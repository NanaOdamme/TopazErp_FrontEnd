(function () {
    'use strict';

    const API_URLS = {
        aging: '/Ap/GetApAgingSummary',
        invoices: '/Ap/GetInvoices',
        payments: '/Ap/GetApPaymentsReport',
        openingBalances: '/Ap/GetApBalancesReport?status=all',
        suppliers: '/SharedResource/GetSuppliers',
        vouchers: '/Ap/GetVouchers',
        canceledInvoices: '/Ap/GetApCanceledInvoices',
        debitMemos: '/Ap/GetApDebitMemo',
        glTransactions: '/Ap/GetApGlTransaction'
    };

    function localToday() {
        const date = new Date();
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    }

    Vue.createApp({
        data() {
            return {
                apiUrls: API_URLS,
                asOfDate: localToday(),
                agingInterval: 30,
                isLoading: false,
                loadIssues: [],
                agingRows: [],
                invoices: [],
                payments: [],
                openingBalances: [],
                suppliers: []
            };
        },

        computed: {
            openInvoices() {
                return this.invoices.filter(row => {
                    const balance = this.value(row, ['balance', 'invoiceBalance']);
                    return balance === '' || this.numberValue(balance) > 0;
                });
            },

            cards() {
                return [
                    {
                        label: 'Open invoices',
                        value: this.formatNumber(this.openInvoices.length),
                        note: 'Invoice records with an outstanding balance',
                        icon: '▤',
                        iconClass: 'bg-indigo-50 text-indigo-600'
                    },
                    {
                        label: 'Suppliers',
                        value: this.formatNumber(this.suppliers.length),
                        note: 'Supplier records returned by the shared resource API',
                        icon: '♙',
                        iconClass: 'bg-emerald-50 text-emerald-600'
                    },
                    {
                        label: 'Payments',
                        value: this.formatNumber(this.payments.length),
                        note: 'Payment records returned by the AP reports API',
                        icon: '↗',
                        iconClass: 'bg-sky-50 text-sky-600'
                    },
                    {
                        label: 'Opening balances',
                        value: this.formatNumber(this.openingBalances.length),
                        note: 'Opening balance records across all statuses',
                        icon: '◷',
                        iconClass: 'bg-amber-50 text-amber-600'
                    }
                ];
            },

            agingBuckets() {
                const definitions = [
                    { label: 'Current', key: 'currentDay' },
                    { label: '1–30 days', key: 'agingFirst' },
                    { label: '31–60 days', key: 'agingSecond' },
                    { label: '61+ days', key: 'agingThird' }
                ];

                const buckets = definitions.map(item => ({
                    label: item.label,
                    count: this.agingRows.filter(row =>
                        this.numberValue(this.value(row, [item.key])) > 0
                    ).length
                }));

                const max = Math.max(1, ...buckets.map(item => item.count));
                return buckets.map(item => ({
                    ...item,
                    width: item.count ? Math.max(3, item.count / max * 100) : 0
                }));
            },

            currencyRows() {
                const counts = new Map();

                this.invoices.forEach(row => {
                    const name = String(
                        this.value(row, ['currencyCode', 'currencyName']) || 'Unspecified'
                    );
                    counts.set(name, (counts.get(name) || 0) + 1);
                });

                const rows = Array.from(counts.entries())
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 6);

                const max = Math.max(1, ...rows.map(item => item.count));
                return rows.map(item => ({
                    ...item,
                    width: Math.max(3, item.count / max * 100)
                }));
            },

            recentInvoices() {
                return this.sortRecent(
                    this.invoices,
                    ['invoiceDate', 'transactionDate', 'creationTime']
                ).slice(0, 7);
            },

            recentPayments() {
                return this.sortRecent(
                    this.payments,
                    ['transactionDate', 'paymentDate', 'creationTime']
                ).slice(0, 6);
            },

            quickActions() {
                const startDate = encodeURIComponent(this.asOfDate || localToday());
                const endDate = encodeURIComponent(this.asOfDate || localToday());
                const interval = encodeURIComponent(this.agingInterval);

                return [
                    {
                        label: 'Aging summary',
                        href: this.apiUrls.aging +
                            '?startDate=' + startDate +
                            '&agingInterval=' + interval
                    },
                    {
                        label: 'G/L transactions',
                        href: this.apiUrls.glTransactions +
                            '?startDate=' + startDate +
                            '&endDate=' + endDate +
                            '&isMultiCurrency=false'
                    },
                    { label: 'Payment vouchers', href: this.apiUrls.vouchers },
                    {
                        label: 'Opening balance report',
                        href: this.apiUrls.openingBalances
                    },
                    {
                        label: 'Canceled invoices',
                        href: this.apiUrls.canceledInvoices
                    },
                    { label: 'Debit memos', href: this.apiUrls.debitMemos }
                ];
            }
        },

        methods: {
            property(row, name) {
                if (!row) return undefined;
                const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
                return row[name] ?? row[pascalName];
            },

            value(row, names) {
                for (const name of names) {
                    const result = this.property(row, name);
                    if (result !== undefined && result !== null && result !== '') {
                        return result;
                    }
                }
                return '';
            },

            rowsFrom(raw) {
                if (!raw) return [];
                if (Array.isArray(raw)) return raw;
                if (typeof raw !== 'object') return [];

                const keys = [
                    'result',
                    'items',
                    'data',
                    'invoices',
                    'payments',
                    'balances',
                    'openingBalances',
                    'apOpeningBalances',
                    'suppliers',
                    'records'
                ];

                for (const key of keys) {
                    const value = this.property(raw, key);
                    if (Array.isArray(value)) return value;
                }

                for (const key of ['result', 'data']) {
                    const nested = this.property(raw, key);
                    if (nested && typeof nested === 'object') {
                        const rows = this.rowsFrom(nested);
                        if (rows.length) return rows;
                    }
                }

                return [];
            },

            async fetchRows(url) {
                const response = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    throw new Error('Request failed (' + response.status + ') for ' + url);
                }

                return this.rowsFrom(await response.json());
            },

            async fetchSafely(url, label, issues) {
                try {
                    return await this.fetchRows(url);
                } catch (error) {
                    console.error(label + ' loading error:', error);
                    issues.push(label);
                    return [];
                }
            },

            numberValue(value) {
                const parsed = Number(String(value ?? 0).replace(/,/g, ''));
                return Number.isFinite(parsed) ? parsed : 0;
            },

            formatNumber(value) {
                return new Intl.NumberFormat(undefined, {
                    maximumFractionDigits: 2
                }).format(this.numberValue(value));
            },

            formatDate(value) {
                if (!value) return '—';

                const text = String(value);
                const dotNetDate = text.match(/\/Date\((-?\d+)\)\//);
                let date;

                if (dotNetDate) {
                    date = new Date(Number(dotNetDate[1]));
                } else if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
                    const parts = text.slice(0, 10).split('-').map(Number);
                    date = new Date(parts[0], parts[1] - 1, parts[2]);
                } else {
                    date = new Date(text);
                }

                if (Number.isNaN(date.getTime())) return text;

                return new Intl.DateTimeFormat(undefined, {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }).format(date);
            },

            sortRecent(rows, dateKeys) {
                return rows.slice().sort((a, b) => {
                    const dateA = String(this.value(a, dateKeys));
                    const dateB = String(this.value(b, dateKeys));
                    return dateB.localeCompare(dateA);
                });
            },

            statusLabel(status) {
                if (status === true) return 'Posted';
                if (status === false) return 'Unposted';
                return String(status || '—');
            },

            statusClass(status) {
                const label = this.statusLabel(status).toLowerCase();

                if (label.includes('cancel')) {
                    return 'rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700';
                }
                if (label.includes('post')) {
                    return 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700';
                }
                return 'rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700';
            },

            async loadDashboard() {
                if (this.isLoading) return;

                this.isLoading = true;
                this.loadIssues = [];

                const startDate = encodeURIComponent(this.asOfDate || localToday());
                const interval = encodeURIComponent(this.agingInterval);
                const agingUrl = this.apiUrls.aging +
                    '?startDate=' + startDate +
                    '&agingInterval=' + interval;

                const [agingRows, invoices, payments, openingBalances, suppliers] =
                    await Promise.all([
                        this.fetchSafely(agingUrl, 'Aging summary', this.loadIssues),
                        this.fetchSafely(this.apiUrls.invoices, 'Invoices', this.loadIssues),
                        this.fetchSafely(this.apiUrls.payments, 'Payments', this.loadIssues),
                        this.fetchSafely(this.apiUrls.openingBalances, 'Opening balances', this.loadIssues),
                        this.fetchSafely(this.apiUrls.suppliers, 'Suppliers', this.loadIssues)
                    ]);

                this.agingRows = agingRows;
                this.invoices = invoices;
                this.payments = payments;
                this.openingBalances = openingBalances;
                this.suppliers = suppliers;
                this.isLoading = false;
            }
        },

        mounted() {
            this.loadDashboard();
        }
    }).mount('#apDashboard');
})();