
(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const createId = (prefix = 'id') => {
        const cryptoObject = globalThis.crypto;
        const value = cryptoObject && typeof cryptoObject.randomUUID === 'function'
            ? cryptoObject.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        return `${prefix}-${value}`;
    };
    const api = axios.create({ baseURL: 'http://localhost:5300', withCredentials: true });
    const ENDPOINTS = {
        balances: '/ApDataEntry/GetOpeningBalances',
        suppliers: '/SharedResource/GetSuppliers',
        currencies: '/SharedResource/GetCurrencys',
        organizationalUnits: '/SharedResource/GetCostCenters/',
    };

    const unwrapList = (raw, preferredKey) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        // ABP wrapper: { result: [...] } or { result: { items: [...] } }
        if (raw.result !== undefined) return unwrapList(raw.result, preferredKey);
        if (raw.data !== undefined && !Array.isArray(raw) && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
            // avoid infinite if raw.data is array already handled
        }
        if (preferredKey && Array.isArray(raw[preferredKey])) return raw[preferredKey];
        if (Array.isArray(raw.items)) return raw.items;
        if (Array.isArray(raw.result)) return raw.result;
        // InitJournalEntry: { accounts: [...] }
        if (Array.isArray(raw.accounts)) return raw.accounts;
        // fallback: first array property in object (covers suppliers/currencies wrapped once)
        if (typeof raw === 'object') {
            const firstArr = Object.values(raw).find(v => Array.isArray(v));
            if (firstArr) return firstArr;
        }
        return asList(raw);
    };
    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };
    const today = isoDate(new Date());

    
    const app = Vue.createApp({
        data() {
            return {
                theme: '#0645e7',
                emptyGuid: EMPTY_GUID,
                tenantId: null,
                suppliers: [],
                currencies: [],
                ouList: [],
                openingBalanceList:[],
                today,
                currencyId: '',
                buyRate:'',
                isEditing: false,
                supplierName:'',
                accountNumber:'',
                currencyCode:'',
                sellRate:0,
                ouName:'',
                
                
            };
        },

        computed: {
            columns (){
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, width: 74, help: 'Generated opening balance ID.'},
                    { key: 'tenantId', label: 'Tenant ID', type: 'text', hidden: true, width: 74, help: 'Tenant identifier.'},
                    { key: 'supplierId', label: 'Supplier', type: 'select', width: 250, required: true, searchable: true, options: this.suppliers, value: 'id', display:'name',},
                    { key: 'transactionDate', label: 'Date', type: 'date', width: 160, required: true, searchable: true, defaultValue:today},
                    { key: 'amount', label: 'Amount', type: 'number', width: 160, required: true, decimals: 2},
                    { key: 'currencyId', label: 'Currency', type: 'select', width: 180, required: true, options: this.currencies, value: 'id', display:'currencyName', defaultValue: this.currencyId},
                    { key: 'buyRate', label: 'Exchange Rate', type: 'number', width: 140, required: true, decimals: 4, defaultValue: this.buyRate},
                    { key: 'ouId', label: 'OU / Cost Center', type: 'select', width: 240, options: this.ouList, display: 'name', value: 'id'},
                    { key: 'isPosted', label: 'Posted', type: 'boolean', width: 110, searchable: true, help: 'Posted Balances cannot be updated later'},
                  /*  { key: 'sellRate', label: 'Sell Rate', type: 'number', width: 140,  decimals: 4, hidden: true},
                    { key: 'supplierName', label: 'name', type: 'text', width: 70, hidden: true},
                    { key: 'accountNumber', label: 'Acc #', type: 'text', width: 70, hidden: true},
                    { key: 'currencyCode', label: 'code', type: 'text', width: 70, hidden: true},*/
                    
                ]
            },
            
        },

        methods: {
            isPosted(row) {
                return row.isPosted === true;
            },
            toNumber(value) {
                const result = Number(value);
                return Number.isFinite(result) ? result : 0;
            },

            formatMoney(value) {
                return this.toNumber(value).toLocaleString('en-GH', {
                    style: 'currency',
                    currency: 'GHS',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            },
            async fetchList(url, label, preferredKey = null) {
                try {
                    const response = await api.get(url);
                    // Handle: raw array, {result: [...]}, {accounts:[...]}, {items:[...]}
                    const list = unwrapList(response.data, preferredKey);
                    // PascalCase safety
                    return list.map(item => (item && item.Id && !item.id) ? normalizeKeys(item) : item);
                } catch (error) {
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },
            async getOpeningBalances() {
                this.openingBalanceList = await this.fetchList(ENDPOINTS.balances, 'Opening Balances');
            },
            async loadLookups() {
                const [rawSuppliers, rawCurrencies, rawUnits] = await Promise.all([
                    this.fetchList(ENDPOINTS.suppliers, 'suppliers'),
                    this.fetchList(ENDPOINTS.currencies, 'currencies'),
                    this.fetchList(ENDPOINTS.organizationalUnits, 'organizational units'),
                ]);

                // Suppliers
                this.suppliers = rawSuppliers.map(s => ({
                    ...s,
                    name: (s.name || '').trim()
                }));

                // Currencies
                this.currencies = rawCurrencies.map(c => ({
                    ...c,
                    currencyName: c.currencyName,
                    currencyCode: c.currencyCode,
                    buyRate: c.buyRate,
                    sellRate: c.sellRate
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

                this.ouList = rawUnits
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
                    .sort((a, b) => a.name.localeCompare(b.name));


                if (!this.isEditing) this.applyDefaults();


            },
            applyDefaults() {
                const currency = this.currencies.find(c => c.isDefault) || this.currencies[0];
                if (currency) {
                    this.currencyId = currency.id;
                    this.buyRate = currency.buyRate;
                }
                this.ouId = EMPTY_GUID;
                this.ouName = '';
            },

            onSupplierChange() {
                const supplier = this.suppliers.find((item) => item.id === this.supplierId);
                this.supplierName = supplier ? supplier.name : '';
                this.accountNumber = supplier ? supplier.accountNumber || '' : '';
            },
            onCurrencyChange() {
                const currency = this.currencies.find((item) => item.id === this.currencyId);
                if (!currency) return;
                this.currencyName = currency.currencyName;
                this.currencyCode = currency.currencyCode;
                this.sellRate = currency.sellRate;
                this.buyRate = currency.buyRate;

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
            normalizeInput(detail) {
                const row = {...detail};
                return {
                    ...row,
                    id: row.id || createId('det'),
                    supplierId: row.supplierId,
                    transactionDate: new Date(row.transactionDate),
                    currencyId: row.currencyId,
                    buyRate: row.buyRate,
                    ouId: row.ouId,
                    amount: row.amount,
                    isPosted: row.isPosted,
                };
            },
            async onCreate(payload = {}) {
                const row = {...payload};

                const supplier = this.suppliers.find(item => item.id === row.supplierId);
                const currency = this.currencies.find(item => item.id === row.currencyId);

                const record = {
                    ...row,
                    supplierId: row.supplierId,
                    supplierName: supplier?.name || '',
                    accountNumber: supplier?.accountNumber || '',
                    transactionDate: row.transactionDate ? new Date(row.transactionDate).toISOString() : new Date().toISOString(),
                    currencyId: row.currencyId,
                    currencyCode: currency?.currencyCode || '',
                    buyRate: row.buyRate ?? currency?.buyRate ?? 1,
                    sellRate: currency?.sellRate ?? 1,
                    ouId: row.ouId,
                    amount: row.amount,
                    isPosted: row.isPosted ?? false
                };

                try {
                    const res = await axios.post(
                        'http://localhost:5300/ApDataEntry/CreateOpeningBalances',
                        record
                    );

                    if (res.data?.success === false) {
                        this.toastHandler(
                            'error',
                            res.data.message || 'Failed to create opening balance.'
                        );
                        return;
                    }

                    this.openingBalanceList.unshift(record);

                    this.toastHandler('success', 'Opening balance created successfully.');
                } catch (error) {
                    console.error('Opening balance creation failed:', error);

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Failed to create opening balance.'
                    );
                }
            },

            async onUpdate(payload = {}) {
                const row = {...payload};

                const supplier = this.suppliers.find(
                    item => item.id === row.supplierId
                );

                const currency = this.currencies.find(
                    item => item.id === row.currencyId
                );

                const record = {
                    ...row,
                    id: row.id,
                    tenantId: row.tenantId || this.tenantId,
                    supplierId: row.supplierId,
                    supplierName: supplier?.name || row.supplierName || '',
                    accountNumber: supplier?.accountNumber || row.accountNumber || '',
                    transactionDate: row.transactionDate
                        ? new Date(row.transactionDate).toISOString()
                        : new Date().toISOString(),
                    currencyId: row.currencyId,
                    currencyCode: currency?.currencyCode || row.currencyCode || '',
                    buyRate: row.buyRate ?? currency?.buyRate ?? 1,
                    sellRate: currency?.sellRate ?? row.sellRate ?? 1,
                    ouId: row.ouId,
                    amount: row.amount,
                    isPosted: row.isPosted ?? false
                };

                try {
                    const res = await axios.post(
                        'http://localhost:5300/ApDataEntry/UpdateOpeningBalances',
                        record
                    );


                    const index = this.openingBalanceList.findIndex(
                        item => item.id === record.id
                    );

                    if (index !== -1) {
                        this.openingBalanceList.splice(index, 1, {
                            ...this.openingBalanceList[index],
                            ...record
                        });
                    }

                    this.toastHandler('success', 'Opening balance updated successfully.');
                } catch (error) {
                    console.error('Opening balance update failed:', error);

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Failed to update opening balance.'
                    );
                }
            },
            async onDelete(event) {
                const deleted = Array.isArray(event?.rows) ? event.rows : [];

                if (!deleted.length) {
                    this.toastHandler('warning', 'No opening balance selected for deletion.');
                    return;
                }

                try {
                    for (const row of deleted) {
                        // Extract the ID whether it is a string or nested object.
                        const id = typeof row.id === 'object'
                            ? row.id?.id
                            : row.id;

                        if (!id) {
                            console.error('Invalid deleted row:', row);
                            this.toastHandler('error', 'Opening balance ID is missing or invalid.');
                            return;
                        }

                        const res = await axios.delete(
                            `http://localhost:5300/ApDataEntry/DeleteOpeningBalances?id=${encodeURIComponent(id)}`
                        );

                        if (res.data?.success === false) {
                            this.toastHandler(
                                'error',
                                res.data.message || 'Failed to delete opening balance.'
                            );
                            return;
                        }
                    }

                    this.toastHandler('success', 'Opening balance deleted successfully.');
                    await this.getOpeningBalances();
                } catch (error) {
                    console.error('Opening balance deletion failed:', error);

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Failed to delete opening balance.'
                    );
                }
            },
        },
        async mounted() {
            this.isLoading = true;
            await this.loadLookups();
            await this.getOpeningBalances();
            this.isLoading = false;
        }
    });

   
    app.use(DataGridPlugin);
    app.mount('#app');
})();
