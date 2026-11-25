(() => {
    'use strict';
    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const ENDPOINTS = {
        invoices: '/Ap/GetInvoices',
        suppliers: '/SharedResource/GetSuppliers',
        currencies: '/SharedResource/GetCurrencies',
        organizationalUnits: '/SharedResource/GetCostCenters/',
        accounts: '/Ap/InitJournalEntry',
        payments: '/Ap/GetPayments',
        banks: '/SharedResource/GetBanks',
    };

    const pad = (n) => String(n).padStart(2, '0');

    // Always returns yyyy-MM-dd (what <input type="date"> and the grid expect),
    // or '' when the value cannot be parsed.
    const isoDate = (date) => {
        if (date === null || date === undefined || date === '') return '';

        if (typeof date === 'string') {
            const raw = date.trim();
            if (!raw) return '';
            // "2026-10-21", "2026-10-21T00:00:00", "2026-10-21T00:00:00+00:00", "2026-10-21 00:00:00"
            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
            // Newtonsoft: "/Date(1729468800000)/"
            const ms = /\/Date\((-?\d+)/.exec(raw);
            if (ms) {
                const d = new Date(Number(ms[1]));
                return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }
            // "21/10/2026" or "21-10-2026" (dd/MM/yyyy)
            const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(raw);
            if (dmy) return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
            // "2026/10/21"
            const ymd = /^(\d{4})[/](\d{1,2})[/](\d{1,2})/.exec(raw);
            if (ymd) return `${ymd[1]}-${pad(ymd[2])}-${pad(ymd[3])}`;
        }

        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };

    // Cleans up a value coming back from the API; blank for empty/.NET sentinels.
    const loadedDate = (value) => {
        const iso = isoDate(value);
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
        if (iso.startsWith('0001-') || iso.startsWith('0000-') || iso === '1900-01-01') return '';
        return iso;
    };

    const today = isoDate(new Date());

    // Safe id comparison (GUID casing / number-vs-string safe)
    const sameId = (a, b) =>
        a !== null && a !== undefined && b !== null && b !== undefined &&
        String(a).toLowerCase() === String(b).toLowerCase();

    // `asList` was used by unwrapList but never defined -> ReferenceError on that code path
    const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

    // Generic unwrapper - handles all your endpoint shapes
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
    const yearOf = (value) => {
        const iso = loadedDate(value);
        return iso ? iso.slice(0, 4) : '';
    };
    const app = Vue.createApp({
        data() {
            return {
                theme: '#0645e7',
                theme1: '#383636',
                suppliers: [],
                accounts: [],
                currencies: [],
                ouList: [],
                banks: [],
                branches: [],
                invoices: [],
                isShimmerLoading: false,
                isLoading: false,
                payload: {},
                emptyGuid: EMPTY_GUID,
                invoiceList: [],
                invoiceId: '',
                detailsList: [],
                supplierList: [],
                supplierId: '',
                supplierName: '',
                accountNumber: '',
                invoiceNumber: '',
                paymentDate: isoDate(new Date()),
                balance: '0',
                purchaseOrderNumber: '',
                currencyList: [],
                currencyId: '',
                totalInvoiceAmount: '0',
                minorName: '',
                amountToPay: '0',
                referenceNumber: '0',
                description: '',
                isVatWithheld: false,
                unitPrice: '0',
                quantity: '0',
                subTotal: ' 0',
                ouId: '',
                ouName: '',
                debitAccountId: '',
                date: isoDate(new Date()),
                address: '',
                voucherNumber: '',
                discount: '0',
                departments: [],
                debitAccountName: '',
                invoiceEditList: [],
                chequeNumber: '',
                bankAccountId: this.emptyGuid,
                bankAccountName: '',
                bankAccountNumber: '',
                isPosted: false,
                invoiceTypeList: [],
                invoiceType: '',
                cash: true,
                cheque: false,
                paymentList: [],

                outstandingCreditMemo: '0.00',
                paymentId: '',
                modeOfPayment: 'Cash',
                isAutomatic: true,
                Automatic: true,
                Manual: false,
                filteredInvoices: [],
                invoiceTypeId: '',
                invoiceTypeName: '',
                paymentInvoiceList: [],
                paymentInvoiceDetailsMap: {},
                reportType: 'details',
                reportApiBaseUrl: '',
                reportPath: '',
                buyRate: '0.0000',
                bankId: '',
                bankName: '',
                bankBranchId: '',
                bankBranch: '',
                bankList: [],
                bankBranchList: [],
                accountsList: [],
                skipInvoiceReload: false,
                bankAccountList: [],
                isOu: true,
                approveInvoiceBeforePayment: false,
                isMultiCurrency: false,
                invoiceRate: '1.0000',
                isSettingPayment: false,
                batchNumber: '',

                selectedInvoiceList: [],
                invoiceDetailsMap: {},

                loadedPaymentId: ''
            };
        },
        computed: {
            invoiceColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, width: 80, help: 'Unique invoice identifier.' },
                    { key: 'tenantId', label: 'Tenant ID', type: 'text', hidden: true, width: 80 },
                    { key: 'isSelected', label: 'Applied', type: 'boolean', width: 80, help: 'Indicates whether this invoice is selected for payment.' },
                    { key: 'invoiceNumber', label: 'Invoice No.', type: 'text', width: 150, searchable: true },
                    { key: 'liabilityAccountName', label: 'Liability G/L', type: 'text', width: 190, searchable: true },
                    { key: 'currencyName', label: 'Currency', type: 'text', width: 110, searchable: true },
                    { key: 'totalInvoiceAmount', label: 'Total Amount', type: 'number', width: 150, decimals: 2 },
                    { key: 'balance', label: 'Balance', type: 'number', width: 140, decimals: 2 },
                    { key: 'appliedAmount', label: 'Amount To Apply', type: 'number', width: 160, decimals: 2 },
                    { key: 'newBalance', label: 'New Balance', type: 'number', width: 150, decimals: 2 },
                    { key: 'invoiceDate', label: 'Invoice Date', type: 'date', width: 140, searchable: true },
                    { key: 'projectedPayDate', label: 'Pay Date', type: 'date', width: 140, searchable: true }
                ];
            },
            invoiceDetailsGrid() {
                return {
                    key: 'invoiceDetails',
                    title: 'Invoice Details',
                    columns: [
                        { key: 'id', label: 'ID', type: 'text', hidden: true },
                        { key: 'invoiceId', label: 'Invoice ID', type: 'text', hidden: true },
                        { key: 'referenceNumber', label: 'Ref No.', type: 'text', width: 140, searchable: true },
                        { key: 'description', label: 'Description', type: 'text', width: 220, searchable: true },
                        { key: 'debitAccountName', label: 'Debit G/L', type: 'text', width: 190, searchable: true },
                        { key: 'unitPrice', label: 'Unit Price', type: 'number', width: 130, decimals: 2 },
                        { key: 'quantity', label: 'Quantity', type: 'number', width: 110, decimals: 2 },
                        { key: 'subTotal', label: 'Sub Total', type: 'number', width: 140, decimals: 2 }
                    ]
                };
            },
            paymentColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, width: 74, help: 'Generated payment ID.' },
                    { key: 'batchNumber', label: 'Batch #', type: 'text', width: 170, required: true, searchable: true },
                    { key: 'paymentDate', label: 'Date', type: 'date', width: 145, required: true, searchable: true, defaultValue: today },
                    { key: 'supplierId', label: 'Supplier', type: 'select', width: 240, required: true, searchable: true, options: this.suppliers, display: 'name', value: 'id' },
                    { key: 'currencyId', label: 'Currency', type: 'select', width: 170, required: true, options: this.currencies, display: 'currencyName', value: 'id' },
                    { key: 'buyRate', label: 'Rate', type: 'number', width: 130, required: true, decimals: 4 },
                    { key: 'amountToPay', label: 'Payment Amount', type: 'number', width: 160, required: true, decimals: 2 },
                    { key: 'isPosted', label: 'Posted', type: 'boolean', width: 100 }
                ];
            },
            paymentInvoices() {
                return {
                    key: 'invoiceList',
                    title: 'Invoice Allocations',
                    columns: [
                        { key: 'id', label: 'ID', type: 'text', hidden: true, width: 74, help: 'Generated payment-record ID.' },
                        { key: 'paymentId', label: 'Payment ID', type: 'text', hidden: true },
                        { key: 'supplierName', label: 'Supplier', type: 'text', width: 40, required: true, searchable: true },
                        { key: 'invoiceNumber', label: 'Invoice', type: 'text', width: 40, required: true, searchable: true },
                        { key: 'currencyName', label: 'Currency', type: 'text', width: 40, required: true, searchable: true },
                        { key: 'buyRate', label: 'Rate', type: 'number', width: 40, decimals: 4 },
                        { key: 'totalInvoiceAmount', label: 'Invoice Total', type: 'number', width: 40, decimals: 2 },
                        { key: 'balance', label: 'Invoice Balance', type: 'number', width: 40, decimals: 4 },
                        { key: 'batchNumber', label: 'Batch Number', type: 'text', width: 40, searchable: true }
                    ]
                };
            }
        },
        methods: {

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
            async getPayments() {
                const paymentList = await this.fetchList(ENDPOINTS.payments, 'Payments');
                this.paymentList = paymentList.filter(pay => pay.isCanceled)
                return this.paymentList;
            },
            async getApInvoices() {
                const list = await this.fetchList(ENDPOINTS.invoices, 'AP invoices');
                // Never wipe a previously loaded list because one refresh failed
                if (list.length || !this.invoices.length) this.invoices = list;
                return this.invoices;
            },
            async loadLookups() {
                const [rawAccounts, rawSuppliers, rawCurrencies, rawUnits, rawBanks] = await Promise.all([
                    this.fetchList(ENDPOINTS.accounts, 'accounts', 'accounts'),
                    this.fetchList(ENDPOINTS.suppliers, 'suppliers'),
                    this.fetchList(ENDPOINTS.currencies, 'currencies'),
                    this.fetchList(ENDPOINTS.organizationalUnits, 'organizational units'),
                    this.fetchList(ENDPOINTS.banks, 'banks')
                ]);

                // Accounts
                this.accounts = rawAccounts.map(a => ({
                    ...a,
                    accountIdentifier: a.accountIdentifier || `${a.accountNo ?? ''} - ${a.accountName ?? a.name ?? ''}`.trim().replace(/^ - /, ''),
                    name: a.accountName || a.name,
                    accountName: a.accountName || a.name
                }));

                // Suppliers
                this.suppliers = rawSuppliers.map(s => ({
                    ...s,
                    name: (s.name || '').trim()
                }));

                //banks
                this.banks = rawBanks.map(b => ({
                    ...b
                }));

                // Currencies
                this.currencies = rawCurrencies.map(c => ({
                    ...c,
                    currencyName: c.currencyName,
                    currencyCode: c.currencyCode,
                    buyRate: c.buyRate,
                    sellRate: c.sellRate,
                }));

                // ---- OU HIERARCHY: Parent / Child ----
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

                //   if (!this.isEditing) this.applyNewInvoiceDefaults();
            },

            /* ------------------------------------------------------------------
             * INVOICE TABLE
             * ------------------------------------------------------------------ */
            getGridData(supplierId, allocatedList = []) {
                const allocated = Array.isArray(allocatedList) ? allocatedList : [];

                // An invoice already attached to the payment being edited must stay visible,
                // even if its balance is now 0 / it was closed by that very payment.
                const isAllocated = (invoice) => allocated.some(row =>
                    (row && sameId(row.invoiceId, invoice.id)) ||
                    (row && sameId(row.id, invoice.id)) ||
                    (row && row.invoiceNumber && invoice.invoiceNumber &&
                        String(row.invoiceNumber) === String(invoice.invoiceNumber))
                );

                // invoice.invoiceDetails may be missing on some rows -> the old code
                // threw `Cannot read properties of undefined (reading 'length')`
                // inside the filter, aborting the whole load.
                const hasDetails = (invoice) => {
                    const details = invoice.invoiceDetails || invoice.invoiceDetailList || invoice.details;
                    return Array.isArray(details) ? details.length > 0 : true;
                };

                const isOpen = (invoice) => {
                    const balance = parseFloat(invoice.balance) || 0;
                    const canceled = invoice.isCanceled === true || invoice.canceled === true;
                    return !canceled &&
                        invoice.isPosted === true &&
                        balance > 0 &&
                        hasDetails(invoice) &&
                        (!this.approveInvoiceBeforePayment || invoice.isApproved === true);
                };

                this.invoiceList = (this.invoices || [])
                    .filter(invoice => {
                        if (isAllocated(invoice)) return true;
                        if (supplierId && invoice.supplierId && !sameId(invoice.supplierId, supplierId)) return false;
                        return isOpen(invoice);
                    })
                    .map(invoice => ({ ...invoice })) // work on copies so the source list stays clean
                    .sort((a, b) => new Date(a.projectedPayDate) - new Date(b.projectedPayDate));

                // Invoice types = currencies used by this supplier's invoices
                const typeIds = new Set(
                    this.invoiceList
                        .filter(inv => !supplierId || sameId(inv.supplierId, supplierId))
                        .map(inv => inv.currencyId)
                        .filter(Boolean)
                        .map(String)
                );
                // Details
                this.detailsList = [];
                const detailsMap = {};
                this.invoiceList.forEach(invoice => {
                    invoice.invoiceId = invoice.id;
                    const details = Array.isArray(invoice.invoiceDetails) ? invoice.invoiceDetails : [];
                    detailsMap[invoice.id] = details.map(detail => {
                        const row = { ...detail, invoiceId: invoice.id };
                        this.detailsList.push(row);
                        return row;
                    });
                });
                this.invoiceDetailsMap = detailsMap;
                return this.invoiceList;
            },
            
            paymentInfoInvoice(responseData) {
                const saved = Array.isArray(responseData) ? responseData : [];
                this.selectedInvoiceList = saved.map(invoice => ({ ...invoice }));

                if (!saved.length) return false;

                const keyOf = (row) => String((row && (row.invoiceId ?? row.id)) ?? '');
                const savedById = new Map();
                saved.forEach(row => {
                    if (row && row.invoiceId) savedById.set(String(row.invoiceId).toLowerCase(), row);
                    if (row && row.id) savedById.set(String(row.id).toLowerCase(), row);
                    if (row && row.invoiceNumber) savedById.set(`#${String(row.invoiceNumber)}`.toLowerCase(), row);
                });

                const findSaved = (invoice) =>
                    savedById.get(String(invoice.id).toLowerCase()) ||
                    (invoice.invoiceNumber ? savedById.get(`#${String(invoice.invoiceNumber)}`.toLowerCase()) : null);

                const amountKeys = ['appliedAmount', 'allocatedAmount', 'amountToApply', 'amount', 'paidAmount', 'paymentAmount', 'balance'];
                const explicitKeys = amountKeys.slice(0, -1); // everything except the `balance` fallback

                let restoredExplicit = 0;

                const merge = (invoice) => {
                    const savedRow = findSaved(invoice);
                    if (!savedRow) return invoice;

                    let applied = null;
                    for (const key of amountKeys) {
                        if (savedRow[key] !== undefined && savedRow[key] !== null && savedRow[key] !== '') {
                            const parsed = parseFloat(savedRow[key]);
                            if (Number.isFinite(parsed)) { applied = parsed; break; }
                        }
                    }
                    if (explicitKeys.some(k => savedRow[k] !== undefined && savedRow[k] !== null)) restoredExplicit++;

                    applied = Number((applied ?? 0).toFixed(2));
                    const balance = parseFloat(invoice.balance) || 0;

                    return {
                        ...invoice,
                        isSelected: true,
                        appliedAmount: applied,
                        allocatedAmount: applied,
                        newBalance: Number((balance - applied).toFixed(2)),
                        remainingBalance: Number((balance - applied).toFixed(2))
                    };
                };

                this.filteredInvoices = (this.filteredInvoices || []).map(merge);
                this.invoiceList = (this.invoiceList || []).map(merge);

                return restoredExplicit > 0;
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
            await this.loadLookups();
            await this.getApInvoices();
            await this.getPayments();
        }
    });

    app.use(DataGridPlugin);
    app.mount('#app');
})();
