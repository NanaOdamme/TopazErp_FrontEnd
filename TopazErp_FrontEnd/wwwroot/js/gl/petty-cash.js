/**
 * General Ledger - Petty Cash Transactions LISTING (Vue 3)
 * List-only page; entry/edit lives on /GeneralLedger/CreatePettyCash
 */
const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            isShimmerLoading: false,

            // Loaded data
            pettyCashList: [],
            recipientList: [],
            pettyCashAccounts: [],

            // Listing filters
            filterParams: {
                startDate: '',
                endDate: '',
                accountId: '',
                query: ''
            }
        };
    },

    computed: {
        totalBatches() {
            return this.pettyCashList.length;
        },

        totalDisbursements() {
            return this.pettyCashList.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
        },

        totalDisbursementsFormatted() {
            return 'GH¢ ' + this.formatNumber(this.totalDisbursements);
        },

        totalLineItems() {
            return this.pettyCashList.reduce((sum, b) => sum + ((b.details && b.details.length) || 0), 0);
        },

        recipientsCount() {
            return this.recipientList.length;
        },

        filteredPettyCashList() {
            return this.pettyCashList.filter(item => {
                if (this.filterParams.startDate) {
                    const itemDate = (item.batchDate || '').split('T')[0];
                    if (itemDate && itemDate < this.filterParams.startDate) return false;
                }
                if (this.filterParams.endDate) {
                    const itemDate = (item.batchDate || '').split('T')[0];
                    if (itemDate && itemDate > this.filterParams.endDate) return false;
                }
                if (this.filterParams.accountId) {
                    if (String(item.pettyCashAccountId).toLowerCase() !== String(this.filterParams.accountId).toLowerCase()) {
                        return false;
                    }
                }
                return true;
            });
        },

        pettyCashColumns() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'batchNo',
                    label: 'Batch #',
                    type: 'text',
                    width: 130,
                    searchable: true,
                    sortable: true,
                    render: (v, row) => {
                        const val = v || '—';
                        return `<a href="/GeneralLedger/CreatePettyCash?id=${row.id}" class="inline-flex items-center px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800" title="Click to view/edit transaction batch">${val}</a>`;
                    }
                },
                {
                    key: 'batchDate',
                    label: 'Batch Date',
                    type: 'date',
                    width: 130,
                    searchable: true,
                    sortable: true,
                    render: (v) => this.formatDate(v)
                },
                {
                    key: 'sourceDocNo',
                    label: 'Source Doc #',
                    type: 'text',
                    width: 140,
                    searchable: true,
                    render: (v) => v ? `<span class="font-mono text-xs text-gray-700 dark:text-gray-300">${v}</span>` : '<span class="text-gray-400">—</span>'
                },
                {
                    key: 'pettyCashAccountName',
                    label: 'Petty Cash G/L Account',
                    type: 'text',
                    width: 260,
                    searchable: true,
                    sortable: true,
                    render: (v) => `<span class="font-medium text-xs text-slate-800 dark:text-slate-200">${v || 'Petty Cash'}</span>`
                },
                {
                    key: 'batchOriginator',
                    label: 'Originator',
                    type: 'text',
                    width: 140,
                    searchable: true,
                    render: (v) => `<span class="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"><i class="bi bi-person text-gray-400"></i>${v || 'System'}</span>`
                },
                {
                    key: 'currencyCode',
                    label: 'Currency',
                    type: 'text',
                    width: 100,
                    render: (v) => `<span class="font-semibold text-xs text-slate-700 dark:text-slate-300">${v || 'GHS'}</span>`
                },
                {
                    key: 'linesCount',
                    label: 'Line Items',
                    type: 'text',
                    width: 110,
                    render: (v, row) => {
                        const count = (row.details && row.details.length) || Number(v) || 0;
                        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">${count} line${count === 1 ? '' : 's'}</span>`;
                    }
                },
                {
                    key: 'totalAmount',
                    label: 'Total Disbursed',
                    type: 'number',
                    width: 150,
                    sortable: true,
                    render: (v, row) => {
                        const num = Number(v) || 0;
                        const code = row.currencyCode || 'GHS';
                        return `<div class="text-right font-mono text-xs font-bold text-slate-900 dark:text-white">${code} ${this.formatNumber(num)}</div>`;
                    }
                },
                {
                    key: 'isPosted',
                    label: 'Status',
                    type: 'text',
                    width: 110,
                    sortable: true,
                    render: (v) => {
                        if (v === true) {
                            return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300"><i class="bi bi-check-circle-fill mr-1 text-[10px]"></i>Posted</span>`;
                        }
                        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300"><i class="bi bi-pencil-fill mr-1 text-[10px]"></i>Recorded</span>`;
                    }
                }
            ];
        }
    },

    methods: {
        formatNumber(num) {
            if (num === null || num === undefined || isNaN(num)) return '0.00';
            const val = Number(num);
            if (val < 0) {
                return `(${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
            }
            return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        formatDate(dateVal) {
            if (!dateVal) return '—';
            try {
                const d = new Date(dateVal);
                if (isNaN(d.getTime())) return String(dateVal).split('T')[0];
                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
            } catch (e) {
                return String(dateVal).split('T')[0];
            }
        },

        resetFilterParams() {
            this.filterParams = {
                startDate: '',
                endDate: '',
                accountId: '',
                query: ''
            };
            this.getPettyCashList();
        },

        onGridOpenForm(e) {
            const targetRow = e?.row || (e?.rows && e.rows[0]) || e;
            if (targetRow && targetRow.id) {
                window.location.href = `/GeneralLedger/CreatePettyCash?id=${encodeURIComponent(targetRow.id)}`;
            } else {
                window.location.href = '/GeneralLedger/CreatePettyCash';
            }
        },

        onGridDelete(e) {
            const rows = e?.rows || (e?.row ? [e.row] : []);
            if (!rows.length) return;
            const target = rows[0];
            this.deletePettyCashBatch(target.id, target.batchNo);
        },

        async deletePettyCashBatch(id, batchNo) {
            if (!id) return;

            const res = await Swal.fire({
                title: 'Delete Petty Cash Batch?',
                html: `Are you sure you want to delete Batch <strong>#${batchNo || id}</strong>?<br><span class="text-xs text-slate-500">All associated expense line items will be removed.</span>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, delete',
                cancelButtonText: 'Cancel'
            });

            if (!res.isConfirmed) return;

            this.isShimmerLoading = true;
            try {
                await axios.delete(`/GeneralLedger/DeletePettyCash?id=${id}`);
                this.toast('success', 'Petty cash batch deleted successfully.');
                await this.getPettyCashList();
            } catch (err) {
                console.error('Error deleting petty cash batch:', err);
                this.toast('error', 'Unable to delete petty cash batch.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async getPettyCashList() {
            this.isShimmerLoading = true;
            try {
                const resp = await axios.get('/GeneralLedger/GetPettyCashTransactions?pageNo=1&pageSize=1000');
                const raw = resp.data;
                let list = [];
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result?.data && Array.isArray(raw.result.data)) {
                    list = raw.result.data;
                } else if (raw?.data && Array.isArray(raw.data)) {
                    list = raw.data;
                }

                this.pettyCashList = list;

                // Derive the petty cash account filter options from loaded batches
                const seen = new Map();
                this.pettyCashList.forEach(b => {
                    if (b.pettyCashAccountId && !seen.has(String(b.pettyCashAccountId))) {
                        seen.set(String(b.pettyCashAccountId), {
                            id: b.pettyCashAccountId,
                            accountIdentifier: b.pettyCashAccountName || 'Petty Cash'
                        });
                    }
                });
                this.pettyCashAccounts = Array.from(seen.values());
            } catch (err) {
                console.error('Error fetching petty cash transactions:', err);
                this.toast('error', 'Unable to load petty cash transactions.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async getRecipients() {
            try {
                const resp = await axios.get('/GeneralLedger/GetPettyCashRecipients?pageNo=1&pageSize=1000');
                const raw = resp.data?.result || resp.data;
                this.recipientList = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
            } catch (err) {
                console.warn('Recipients fetch failed:', err);
            }
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
                alert(message);
            }
        }
    },

    async mounted() {
        this.isShimmerLoading = true;
        try {
            await Promise.allSettled([
                this.getRecipients(),
                this.getPettyCashList()
            ]);
        } catch (err) {
            console.error('Initialization error in Petty Cash listing page:', err);
        } finally {
            this.isShimmerLoading = false;
        }
    }
});

app.use(DataGridPlugin);
app.mount('#app');
