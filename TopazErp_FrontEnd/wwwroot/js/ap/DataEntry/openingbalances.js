
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
    /*const api = axios.create({ baseURL: 'http://localhost:5300', withCredentials: true });*/
    const ENDPOINTS = {
        balances: '/Ap/GetOpeningBalances',
        suppliers: '/SharedResource/GetSuppliers',
        currencies: '/SharedResource/GetCurrencies/?pageNo=1&pageSize=1000',
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
                isShimmerLoading:false
                
                
            };
        },

        computed: {
            columns (){
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, width: 74, help: 'Generated opening balance ID.'},
                    { key: 'supplierId', label: 'Supplier', type: 'select', width: 250, required: true, searchable: true, options: this.suppliers, value: 'id', display:'name',},
                    { key: 'transactionDate', label: 'Date', type: 'date', width: 160, required: true, searchable: true, defaultValue:today},
                    { key: 'amount', label: 'Amount', type: 'number', width: 160, required: true, decimals: 2},
                    { key: 'currencyId', label: 'Currency', type: 'select', width: 180, required: true, options: this.currencies, value: 'id', display:'currencyName', defaultValue: this.currencyId},
                    { key: "buyRate", label: "Rate",type: "number", decimals: 4, width: 150, defaultValue: this.buyRate, dependsOn: 'currencyId', valueFrom: values => this.setCurrencyRate(values.currencyId) },
                    { key: 'ouId', label: 'OU / Cost Center', type: 'select', width: 240, options: this.ouList, display: 'name', value: 'id', help: 'Add if needed', },
                    { key: 'isPosted', label: 'Posted', type: 'boolean', width: 110, searchable: true, help: 'Posted Balances cannot be updated later', defaultValue: false, disabled: true},
                    { key: 'sellRate', label: 'Sell Rate', type: 'number', width: 140,  decimals: 4, hidden: true},
                    { key: 'supplierName', label: 'name', type: 'text', width: 70, hidden: true},
                    { key: 'accountNumber', label: 'Acc #', type: 'text', width: 70, hidden: true},
                    { key: 'currencyCode', label: 'code', type: 'text', width: 70, hidden: true},
                    { key: 'currencyName', label: 'CurrencyName', type: 'text', width: 70, hidden: true},
                ]
            },
            
        },

        methods: {
            setCurrencyRate(currencyId) {
                const currency = this.currencies.find(c => c.id === currencyId);
                return currency?.buyRate ?? '';
            },
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
                    const response = await  axios.get(url);
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
                this.isShimmerLoading = true;
                this.openingBalanceList = await this.fetchList(ENDPOINTS.balances, 'Opening Balances');
                this.isShimmerLoading = false;
            },
            async loadLookups() {
                this.isShimmerLoading = true;
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
                            originalName: u.name?.trim() || '-',
                            name: path,
                            displayName: path,
                            hierarchy: path
                        };
                    })
                    .sort((a, b) => a.name.localeCompare(b.name));


                if (!this.isEditing) this.applyDefaults();

                this.isShimmerLoading = false;
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
            getOuName(ouId) {
                if (!ouId || String(ouId) === EMPTY_GUID) return '-';
                const ou = this.ouList.find(x => String(x.id) === String(ouId));
                return ou?.name || '-';
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
                // Extract the actual record from the grid event.
                const row = {
                    ...(payload.data || payload.row || payload)
                };

                const supplier = this.suppliers.find(
                    item => item.id === row.supplierId
                );

                const currency = this.currencies.find(
                    item => item.id === row.currencyId
                );

                const record = {
                    supplierId: row.supplierId,
                    supplierName: supplier?.name || row.supplierName || '',
                    accountNumber: supplier?.accountNumber || row.accountNumber || '',

                    transactionDate: row.transactionDate
                        ? new Date(row.transactionDate).toISOString()
                        : new Date().toISOString(),

                    currencyId: row.currencyId,
                    currencyCode: currency?.currencyCode || row.currencyCode || '',

                    buyRate: row.buyRate ?? currency?.buyRate ?? 1,
                    sellRate: row.sellRate ?? currency?.sellRate ?? 1,

                    ouId: row.ouId? row.ouId : EMPTY_GUID,
                    amount: row.amount,

                    isPosted: row.isPosted ?? false
                };

                console.log('Opening balance create payload:', record);
               
                try {
                    const res = await axios.post(
                        '/Ap/CreateOpeningBalance',
                        record
                    );

                    const result = res.data?.result;

                    if (res.data?.success === false || (result?.code && result.code !== 200)) {
                        this.toastHandler(
                            'error',
                            result?.message || res.data?.error?.message || 'Failed to create opening balance.'
                        );
                        await this.getOpeningBalances();
                        return;
                        
                    }

                    this.toastHandler('success', result?.message || 'Opening balance created successfully.');
                    await this.getOpeningBalances();
                } catch (error) {
                    console.error('Opening balance creation failed:', error);
                    
                    this.toastHandler(
                        'error',
                        error.response?.data?.message ||
                        'Failed to create opening balance.'
                    );
                    await this.getOpeningBalances();
                }
            },

            async onUpdate(event) {

                // Extract the actual record from the grid event.
                const row = event?.row || event?.data;
                if (!row) return;

                const rawId = row.id;
                const id = typeof rawId === 'object' ? rawId?.id : rawId;

                const existing = this.openingBalanceList.find(item => item.id === id);
                if (!existing) {
                    console.error('Opening balance update event:', event);
                    this.toastHandler('error', 'Opening balance record was not found.');
                    return;
                }
                const supplier = this.suppliers.find(
                    item => item.id === row.supplierId
                );

                const currency = this.currencies.find(
                    item => item.id === row.currencyId
                );

                const record = {
                    ...existing,
                    ...row,
                    id: existing.id,
                    supplierId: row.supplierId,
                    supplierName: supplier?.name || row.supplierName || '',
                    accountNumber: supplier?.accountNumber || row.accountNumber || '',

                    transactionDate: row.transactionDate
                        ? new Date(row.transactionDate).toISOString()
                        : new Date().toISOString(),

                    currencyId: row.currencyId,
                    currencyCode: currency?.currencyCode || row.currencyCode || '',
                    currencyName: currency?.currencyName || row.currencyName || '',
                    buyRate: row.buyRate ?? currency?.buyRate ?? 1,
                    sellRate: row.sellRate ?? currency?.sellRate ?? 1,

                    ouId: row.ouId,
                    amount: row.amount,
                    isPosted: row.isPosted ?? false,

                };

                console.log('Opening balance API payload:', record);

                try {
                    const res = await axios.put(
                        '/Ap/UpdateOpeningBalance',
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

                    this.toastHandler(
                        'success',
                        'Opening balance updated successfully.'
                    );
                    await this.getOpeningBalances();
                } catch (error) {
                    console.error('Opening balance update failed:', error);
                    await this.getOpeningBalances();
                    this.toastHandler(
                        'error',
                        error.response?.data?.message ||
                        'Failed to update opening balance.'
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
                            `/Ap/DeleteOpeningBalance?id=${encodeURIComponent(id)}`
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
            async postBalances() {
                const grid = this.$refs.balances;
                const selected = grid && typeof grid.selectedRows === 'function'
                    ? grid.selectedRows()
                    : [];

                if (!selected.length) {
                    this.toastHandler('warning', 'Select one or more opening balances to post.');
                    return;
                }

                // Skip opening balances that have already been posted.
                const balancesToPost = selected.filter(balance =>
                    balance.isPosted !== true
                );

                const skippedCount = selected.length - balancesToPost.length;

                if (!balancesToPost.length) {
                    this.toastHandler('info', 'All selected opening balances have already been posted.');
                    return;
                }

                // Confirm before posting.
                const result = await Swal.fire({
                    icon: 'warning',
                    title: 'Confirm Posting',
                    text: `Are you sure you want to post ${balancesToPost.length} opening balance${balancesToPost.length === 1 ? '' : 's'}?${skippedCount > 0 ? ` ${skippedCount} already-posted opening balance(s) will be skipped.` : ''}`,
                    showCancelButton: true,
                    confirmButtonText: 'Yes, post',
                    cancelButtonText: 'No, go back',
                    confirmButtonColor: '#4f46e5',
                    cancelButtonColor: '#64748b',
                    reverseButtons: true
                });

                if (!result.isConfirmed) return;

                try {
                    const balanceIds = balancesToPost.map(balance => balance.id);

                    const res = await axios.post('/Ap/PostOpeningBalances', balanceIds);

                    if (res.data && res.data.success === false) {
                        this.toastHandler(
                            'error',
                            res.data.message || 'Unable to post selected opening balances.'
                        );
                        return;
                    }

                    if (grid.clearSelection) {
                        grid.clearSelection();
                    }

                    this.toastHandler(
                        'success',
                        skippedCount > 0
                            ? `Posted ${balancesToPost.length} opening balance(s). Skipped ${skippedCount} already-posted opening balance(s).`
                            : 'Posted successfully.'
                    );

                    await this.getOpeningBalances();
                } catch (error) {
                    console.error('Opening balance posting failed:', error);

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Failed to post opening balance(s).'
                    );
                    await this.getOpeningBalances();
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
