/**
 * General Ledger - Dashboard (Vue 3 + Chart.js)
 * Single round trip to /GeneralLedger/InitGlDashboard, then renders KPIs,
 * monthly journal activity, voucher mix, recent batches and top payables.
 */
const app = Vue.createApp({
    data() {
        return {
            isLoading: true,
            periodLabel: '',
            accountCount: 0,
            journalHeaders: [],
            voucherSummary: {
                supplier: { count: 0, value: 0 },
                employee: { count: 0, value: 0 },
                customer: { count: 0, value: 0 }
            },
            payables: {
                supplierCount: 0,
                activeSupplierCount: 0,
                totalBalance: 0,
                topSuppliers: []
            },
            degraded: [],
            journalChartInstance: null,
            voucherChartInstance: null
        };
    },

    computed: {
        postedCount() {
            return this.journalHeaders.filter(j => j.isPosted).length;
        },
        pendingCount() {
            return this.journalHeaders.filter(j => !j.isPosted).length;
        },
        voucherTotalCount() {
            const v = this.voucherSummary;
            return (v.supplier?.count || 0) + (v.employee?.count || 0) + (v.customer?.count || 0);
        },
        voucherTotalValue() {
            const v = this.voucherSummary;
            return (v.supplier?.value || 0) + (v.employee?.value || 0) + (v.customer?.value || 0);
        },
        recentJournals() {
            return this.journalHeaders.slice(0, 6);
        },
        maxTopBalance() {
            const list = this.payables.topSuppliers || [];
            return Math.max(...list.map(s => Math.abs(Number(s.balance) || 0)), 0) || 1;
        }
    },

    methods: {
        formatInt(n) {
            return (Number(n) || 0).toLocaleString();
        },

        formatNumber(num) {
            const val = Number(num);
            if (!isFinite(val)) return '0.00';
            if (val < 0) {
                return `(${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
            }
            return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        formatDate(d) {
            if (!d) return '—';
            if (typeof moment !== 'undefined') {
                const m = moment(d);
                return m.isValid() ? m.format('DD MMM YYYY') : '—';
            }
            const dt = new Date(d);
            return isNaN(dt) ? '—' : dt.toISOString().slice(0, 10);
        },

        topBalanceBar(balance) {
            const pct = (Math.abs(Number(balance) || 0) / this.maxTopBalance) * 100;
            return `${Math.max(4, Math.min(100, pct)).toFixed(1)}%`;
        },

        async loadData() {
            this.isLoading = true;
            try {
                const resp = await axios.get('/GeneralLedger/InitGlDashboard');
                const d = resp?.data || {};

                this.journalHeaders = (d.journalHeaders || [])
                    .filter(h => h)
                    .map(h => ({
                        id: h.id,
                        batchNumber: h.batchNumber || '—',
                        batchDate: h.batchDate,
                        batchDescription: h.batchDescription || '',
                        totalDebit: Number(h.totalDebit) || 0,
                        totalCredit: Number(h.totalCredit) || 0,
                        isPosted: Boolean(h.isPosted),
                        transactionSource: h.transactionSource || 'GL'
                    }));

                this.voucherSummary = {
                    supplier: d.vouchers?.supplier || { count: 0, value: 0 },
                    employee: d.vouchers?.employee || { count: 0, value: 0 },
                    customer: d.vouchers?.customer || { count: 0, value: 0 }
                };

                this.payables = {
                    supplierCount: d.payables?.supplierCount || 0,
                    activeSupplierCount: d.payables?.activeSupplierCount || 0,
                    totalBalance: Number(d.payables?.totalBalance) || 0,
                    topSuppliers: d.payables?.topSuppliers || []
                };

                this.accountCount = d.accounts?.activeCount || 0;
                this.degraded = d.degraded || [];

                if (d.journalPeriodStart && typeof moment !== 'undefined') {
                    const start = moment(d.journalPeriodStart);
                    this.periodLabel = start.isValid()
                        ? `${start.format('MMM YYYY')} – ${moment().format('MMM YYYY')}`
                        : '';
                }

                if (this.degraded.length === 6) {
                    this.toast('error', 'Dashboard data is unavailable right now.');
                } else if (this.degraded.length) {
                    this.toast('warning', `Some sections could not be loaded (${this.degraded.join(', ')}).`);
                }

                await this.$nextTick();
                this.renderCharts();
            } catch (err) {
                console.error('Error loading GL dashboard:', err);
                this.toast('error', 'Unable to load dashboard data.');
            } finally {
                this.isLoading = false;
            }
        },

        renderCharts() {
            if (typeof Chart === 'undefined') return;
            this.renderJournalChart();
            this.renderVoucherChart();
        },

        renderJournalChart() {
            const canvas = document.getElementById('journalChart');
            if (!canvas) return;

            if (this.journalChartInstance) {
                this.journalChartInstance.destroy();
                this.journalChartInstance = null;
            }
            if (!this.journalHeaders.length) return;

            // Bucket totals by calendar month over the loaded period (6 months from the API)
            const months = [];
            if (typeof moment !== 'undefined') {
                const start = moment().startOf('month').subtract(5, 'months');
                for (let i = 0; i < 6; i++) months.push(moment(start).add(i, 'months'));
            }
            const labels = months.map(m => m.format('MMM YY'));
            const values = months.map(m =>
                this.journalHeaders
                    .filter(h => {
                        const bd = moment(h.batchDate);
                        return bd.isValid() && bd.isSame(m, 'month');
                    })
                    .reduce((sum, h) => sum + h.totalDebit, 0)
            );

            const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

            this.journalChartInstance = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Total debits (GHS)',
                        data: values,
                        backgroundColor: 'rgba(37, 99, 235, 0.82)',
                        hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
                        borderRadius: 6,
                        maxBarThickness: 52
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => `GHS ${ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 11 } }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(148, 163, 184, 0.18)' },
                            ticks: {
                                color: '#94a3b8',
                                font: { size: 11 },
                                callback: v => compact.format(v)
                            }
                        }
                    }
                }
            });
        },

        renderVoucherChart() {
            const canvas = document.getElementById('voucherChart');
            if (!canvas) return;

            if (this.voucherChartInstance) {
                this.voucherChartInstance.destroy();
                this.voucherChartInstance = null;
            }
            if (!this.voucherTotalCount) return;

            this.voucherChartInstance = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: ['Payment Vouchers', 'Employee Vouchers', 'Receipt Vouchers'],
                    datasets: [{
                        data: [
                            this.voucherSummary.supplier?.count || 0,
                            this.voucherSummary.employee?.count || 0,
                            this.voucherSummary.customer?.count || 0
                        ],
                        backgroundColor: ['#0ea5e9', '#8b5cf6', '#10b981'],
                        borderWidth: 0,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '62%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                boxWidth: 8,
                                color: '#64748b',
                                font: { size: 11 }
                            }
                        }
                    }
                }
            });
        },

        toast(type, message) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'success'),
                    title: message,
                    showConfirmButton: false,
                    timer: 3500,
                    timerProgressBar: true
                });
            } else if (typeof toastr !== 'undefined') {
                toastr[type] ? toastr[type](message) : toastr.info(message);
            } else {
                console.log(`[${type}] ${message}`);
            }
        }
    },

    async mounted() {
        await this.loadData();
    }
});

app.mount('#app');
