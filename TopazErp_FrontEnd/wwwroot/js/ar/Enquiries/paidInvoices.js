(() => {
    'use strict';
    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const ENDPOINTS = {
        invoices: '/Ar/GetInvoices',
        customers: '/SharedResource/GetCustomers',
        currencies: '/SharedResource/GetCurrencies',
        accounts: '/Ap/InitJournalEntry',
        costCenters: '/SharedResource/GetCostCenters',
    };

    const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

    const unwrapList = (raw, preferredKey) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw.result !== undefined) return unwrapList(raw.result, preferredKey);
        if (preferredKey && Array.isArray(raw[preferredKey])) return raw[preferredKey];
        if (Array.isArray(raw.items)) return raw.items;
        if (Array.isArray(raw.result)) return raw.result;
        if (Array.isArray(raw.accounts)) return raw.accounts;
        if (typeof raw === 'object') {
            const firstArr = Object.values(raw).find(v => Array.isArray(v));
            if (firstArr) return firstArr;
        }
        return asList(raw);
    };
    const app = Vue.createApp({
        data() {
            return {
                theme: '#0645e7',
                invoiceList:[],
                accounts:[],
                customers:[],
                currencies: [],
                costCenters: [],
                isLoading: false,

            }
        },
        computed: {
            detailColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'invoiceId', label: 'Invoice ID', type: 'text', hidden: true, editable: false },
                    { key: 'referenceNumber', label: 'Ref No.', type: 'text', searchable: true, width: 150 },
                    { key: 'description', label: 'Description', type: 'text', required: true, searchable: true, width: 220 },
                    { key: 'debitAccountId', label: 'Debit G/L Account', type: 'select', options: this.accounts, display: 'accountIdentifier', value: 'id', width: 220},
                    { key: 'quantity', label: 'Quantity', type: 'number', required: true, defaultValue: 1, min: 0, decimals: 2, width: 110 },
                    { key: 'unitPrice', label: 'Unit Price', type: 'number', required: true, defaultValue: 0, min: 0, decimals: 2, width: 130 },
                    { key: 'discountAsPercentage', label: 'Disc. as %?', type: 'boolean', defaultValue: false, width: 120 },
                    { key: 'discount', label: 'Discount', type: 'number', defaultValue: 0, min: 0, decimals: 2, width: 120 },
                    { key: 'amount', label: 'Disc. Amt.', type: 'number', decimals: 2, editable: false, width: 125 },
                    { key: 'subTotal', label: 'Sub Total', type: 'number', decimals: 2, editable: false, width: 130 }
                ];
            },
            invoiceColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant ID', type: 'number', hidden: true, editable: false },
                    { key: 'invoiceNumber', label: 'Invoice #', type: 'text', width: 150, required: true, searchable: true },
                    { key: 'batchNumber', label: 'Batch #', type: 'text', width: 125, searchable: true },
                    { key: 'customerId', label: 'Customer', type: 'select', options: this.customers, value: 'id', display: 'name', width: 280, required: true, searchable: true },
                    { key: 'invoiceDate', label: 'Invoice Date', type: 'date', width: 130, searchable: true },
                    { key: 'projectedPayDate', label: 'Projected Pay Date', type: 'date', width: 160, searchable: true },
                    { key: 'currencyId', label: 'Currency', type: 'select', options: this.currencies, value: 'id', display: 'currencyName', width: 180, searchable: true },
                    { key: 'buyRate', label: 'Buy Rate', type: 'number', width: 110, decimals: 4 },
                    { key: 'totalInvoiceAmount', label: 'Invoice Total', type: 'number', width: 145, decimals: 2, agg: 'sum' },
                ];
            },
            invoiceDetailChild() {
                return { key: 'invoiceDetails', title: 'Invoice Details', columns: this.detailColumns };
            }
        },
        methods:{
            async fetchList(url, label, preferredKey = null) {
                try {
                    const response = await axios.get(url);
                    // Handle: raw array, {result: [...]}, {accounts:[...]}, {items:[...]}
                    const list = unwrapList(response.data, preferredKey);
                    // PascalCase safety
                    return list.map(item => (item && item.Id && !item.id) ? normalizeKeys(item) : item);
                } catch (error) {
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },
            async getInvoices() {
                const list = await this.fetchList(ENDPOINTS.invoices, 'AR invoices');
                this.invoiceList = list.filter(inv => !inv.isCanceled && inv.isPosted && inv.balance === 0);

                return this.invoiceList;
            },
            async loadLookups() {
                const [rawAccounts, rawCustomers, rawCurrencies, rawUnits,] = await Promise.all([
                    this.fetchList(ENDPOINTS.accounts, 'accounts', 'accounts'),
                    this.fetchList(ENDPOINTS.customers, 'customers'),
                    this.fetchList(ENDPOINTS.currencies, 'currencies'),
                    this.fetchList(ENDPOINTS.costCenters, 'organizational units'),

                ]);

                // Accounts
                this.accounts = rawAccounts.map(a => ({
                    ...a,
                    accountIdentifier: a.accountIdentifier || `${a.accountNo ?? ''} - ${a.accountName ?? a.name ?? ''}`.trim().replace(/^ - /, ''),
                    name: a.accountName || a.name,
                    accountName: a.accountName || a.name
                }));

                // customers
                this.customers = rawCustomers.map(s => ({
                    ...s,
                    name: (s.name || '').trim()
                }));

                // Currencies
                this.currencies = rawCurrencies.map(c => ({
                    ...c,
                    currencyName:  c.currencyName,
                    currencyCode: c.currencyCode,
                    buyRate: c.buyRate,
                    sellRate: c.sellRate,
                }));

                // ---- OU HIERARCHY: Parent / Child ----
                // e.g. ACAD -> ACAD / CES, ACAD / CES / Lab
                const byId = new Map(rawUnits.map(u => [String(u.id), u]));

                const getPath = (unit, visited = new Set()) => {
                    const names = [];
                    let cur = unit;
                    let depth = 0;
                    while (cur && depth < 20) { // 20 = circular protection
                        names.unshift(cur.name);
                        const pid = cur.parentId ? String(cur.parentId) : '';
                        if (!pid || pid === EMPTY_GUID || !byId.has(pid) || visited.has(pid)) break;
                        visited.add(pid);
                        cur = byId.get(pid);
                        depth++;
                    }
                    return names.join(' / ');
                };

                this.organizationalUnits = rawUnits
                    .map(u => {
                        const path = getPath(u);
                        return {
                            ...u,
                            originalName: u.name,
                            name: path,
                            displayName: path,
                            hierarchy: path
                        };
                    })
                    .sort((a,b) => a.name.localeCompare(b.name));

            },
            toastHandler(type, message = 'An unexpected error occurred.') {
                if (typeof Swal === 'undefined') {
                    console.log(message);
                    return;
                }
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                    title: message,
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true
                });

            },
        },

        async mounted() {
            this.isLoading = true;
            await this.loadLookups();
            await this.getInvoices();
            this.isLoading = false;
        }
    });
    app.use(DataGridPlugin);
    app.mount('#app');
})();