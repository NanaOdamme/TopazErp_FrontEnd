(() => {
    'use strict';
    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const API_BASE_URL = 'http://localhost:5300';

    // Single axios instance: baseURL + cookies for every call (GET and POST).
    // Using the global `axios` with a relative url sends the request to the web app
    // host instead of the API, which is why save/delete were failing.
    const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

    const ENDPOINTS = {
        invoices: `${API_BASE_URL}/ApDataEntry/GetInvoices`,
        suppliers: `${API_BASE_URL}/SharedResource/GetSuppliers`,
        currencies: `${API_BASE_URL}/SharedResource/GetCurrencys`,
        organizationalUnits: `${API_BASE_URL}/SharedResource/GetCostCenters/`,
        accounts: `${API_BASE_URL}/LedgerDataEntry/InitJournalEntry`,
        payments: `${API_BASE_URL}/ApDataEntry/GetPayments`,
        banks: `${API_BASE_URL}/SharedResource/GetBanks`,
        createPayment: `${API_BASE_URL}/ApDataEntry/CreatePayment`,
        updatePayment: `${API_BASE_URL}/ApDataEntry/UpdatePayment`,
        deletePayment: `${API_BASE_URL}/ApDataEntry/DeletePayment`
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
                    { key: 'tenantId', label: 'Tenant ID', type: 'text', hidden: true, width: 74, help: 'Demo tenant identifier.' },
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
            scrollToAdd() {
                this.$nextTick(() => {
                    const element = document.querySelector('#add');

                    if (!element) {
                        console.error('Cannot find #add. Check where the div is rendered.');
                        return;
                    }

                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                });
            },
            getBusinessProfile() {
                api.get(`${API_BASE_URL}/SharedResource/GetBusinessProfile`).then(response => {
                    if (response.data) {
                        this.approveInvoiceBeforePayment = response.data.approveInvoiceBeforePayment;
                        this.isOu = response.data.enforceOu;
                    }
                }).catch(err => {
                    console.log(err);
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
            async getPayments() {
                this.paymentList = await this.fetchList(ENDPOINTS.payments, 'Payments');
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
            onCurrencyChange() {
                const currency = this.currencies.find((item) => item.id === this.currencyId);
                if (!currency) return;
                this.currencyName = currency.currencyName;
                this.currencyCode = currency.currencyCode;
                this.buyRate = parseFloat(currency.buyRate).toFixed(4);

                this.isMultiCurrency = currency.isDefault !== true;
            },
            initPaymentType() {
                this.isAutomatic = !!this.Automatic;
            },
            toggleIsAutomatic() {
                this.Automatic = true;
                this.Manual = false;
            },
            toggleManual() {
                this.Automatic = false;
                this.Manual = true;
            },
            toggleCash() {
                this.cash = true;
                this.cheque = false;
                this.InitModeOfPayment();
            },
            toggleCheque() {
                this.cash = false;
                this.cheque = true;
                this.InitModeOfPayment();
            },
            InitModeOfPayment() {
                this.modeOfPayment = this.cash ? 'Cash' : 'Cheque';
            },
            formatNumber(number) {
                if (number < 0) {
                    return `(${Math.abs(number).toFixed(2)})`;
                }
                return number;
            },

            generateBatchNumber() {
                return `B-${Math.floor(100000 + Math.random() * 900000)}`;
            },

            /* ------------------------------------------------------------------
             * INVOICE TYPE HELPERS  (new)
             * The "invoice type" in this app is the currency of the invoice.
             * ------------------------------------------------------------------ */
            getInvoiceTypeOption(id) {
                if (!id) return null;
                return (this.invoiceTypeList || []).find(t => sameId(t.id, id)) ||
                    (this.currencies || []).find(c => sameId(c.id, id)) ||
                    null;
            },
            ensureInvoiceTypeOption(id) {
                if (!id) return;
                if ((this.invoiceTypeList || []).some(t => sameId(t.id, id))) return;
                const currency = this.currencies.find(c => sameId(c.id, id));
                if (currency) this.invoiceTypeList = [...(this.invoiceTypeList || []), currency];
            },
            // Fills invoiceType / invoiceTypeName / invoiceRate from an invoice-type id
            syncInvoiceType(id, fallbackRate, fallbackName) {
                const typeId = (id !== undefined && id !== null) ? id : this.invoiceTypeId;
                this.invoiceTypeId = typeId || '';
                this.invoiceType = typeId || '';

                const option = this.getInvoiceTypeOption(typeId);
                const name = option ? (option.currencyName || option.name || '') : '';
                this.invoiceTypeName = name || fallbackName || this.invoiceTypeName || '';

                if (option) {
                    const rate = parseFloat(option.buyRate ?? option.sellRate);
                    this.invoiceRate = (Number.isFinite(rate) && rate > 0 ? rate : 1).toFixed(4);
                    this.isMultiCurrency = option.isDefault !== true;
                } else if (fallbackRate !== undefined && fallbackRate !== null && fallbackRate !== '') {
                    const rate = parseFloat(fallbackRate);
                    this.invoiceRate = (Number.isFinite(rate) && rate > 0 ? rate : 1).toFixed(4);
                } else {
                    this.invoiceRate = '1.0000';
                }
                return option;
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

                const currentType = this.invoiceTypeId;
                this.invoiceTypeList = (this.currencies || []).filter(c => typeIds.has(String(c.id)));
                // Keep the selected/loaded type selectable even if no open invoice uses it
                this.ensureInvoiceTypeOption(currentType);

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

                this.updateFilteredInvoices();
                return this.invoiceList;
            },

            onInvoiceTypeChange() {
                // Populate the type name AND the rate every time the type changes,
                // whether it was changed by the user or set programmatically.
                this.syncInvoiceType(this.invoiceTypeId, this.buyRate);

                this.updateFilteredInvoices();

                if (this.isAutomatic) {
                    this.calculateAndDisplayAppliedAmounts();
                } else {
                    this.calculateManualAppliedAmounts();
                }
            },
            onBankChange() {
                const bank = this.banks.find((item) => item.id === this.bankId);
                if (!bank) return;
                this.bankBranchList = bank.bankBranches;
            },
            updateFilteredInvoices() {
                const supplierId = this.supplierId;
                const invoiceTypeId = this.invoiceTypeId;

                const filteredInvoices = (this.invoiceList || []).filter(invoice => {
                    const supplierOk = !supplierId || sameId(invoice.supplierId, supplierId);
                    const typeOk = !invoiceTypeId || sameId(invoice.currencyId, invoiceTypeId);
                    return supplierOk && typeOk;
                });

                if (this.Manual && !this.isAutomatic) {
                    const selectedIds = (this.selectedInvoiceList || [])
                        .map(s => String(s && (s.invoiceId ?? s.id)));
                    this.filteredInvoices = filteredInvoices.map(inv => ({
                        ...inv,
                        isSelected: selectedIds.includes(String(inv.id))
                    }));
                } else {
                    this.filteredInvoices = filteredInvoices;
                }
            },

            calculateAndDisplayAppliedAmounts() {
                const invoices = this.filteredInvoices || [];
                const amountToPay = parseFloat(this.amountToPay) || 0;

                if (invoices.length === 0 || amountToPay <= 0) {
                    return;
                }

                const invoiceRate = parseFloat(this.invoiceRate) || 1;
                const buyRate = parseFloat(this.buyRate) || 1;

                // Convert payment currency into invoice currency.
                let remainingAmount = amountToPay * (buyRate / invoiceRate);

                const sortedInvoices = [...invoices].sort((a, b) =>
                    new Date(a.projectedPayDate) - new Date(b.projectedPayDate)
                );

                const updatedInvoices = sortedInvoices.map(invoice => {
                    const balance = parseFloat(invoice.balance) || 0;
                    let applied = 0;

                    if (remainingAmount > 0) {
                        applied = Math.min(Math.max(balance, 0), remainingAmount);
                        remainingAmount -= applied;
                    }

                    applied = Number(applied.toFixed(2));

                    return {
                        ...invoice,
                        allocatedAmount: applied,
                        appliedAmount: applied,
                        remainingBalance: Number((balance - applied).toFixed(2)),
                        newBalance: Number((balance - applied).toFixed(2)),
                        isSelected: applied > 0
                    };
                });

                this.filteredInvoices = updatedInvoices;

                // Update the records displayed by the parent custom grid.
                const updatedById = new Map(updatedInvoices.map(invoice => [String(invoice.id), invoice]));
                this.invoiceList = (this.invoiceList || []).map(invoice =>
                    updatedById.has(String(invoice.id)) ? updatedById.get(String(invoice.id)) : invoice
                );

                this.outstandingCreditMemo = Number(Math.max(remainingAmount, 0).toFixed(2));
            },

            async ApplyPayment() {
                if (this.isAutomatic) {
                    await this.calculateAndDisplayAppliedAmounts();
                } else {
                    this.calculateManualAppliedAmounts();
                }
            },

            calculateManualAppliedAmounts() {
                const grid = this.$refs.invoiceGrid;

                // Get the currently selected rows from the custom grid.
                let selectedRows = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];

                // After a reload the grid loses its selection -> fall back to the
                // allocation list restored from the payment.
                if ((!Array.isArray(selectedRows) || selectedRows.length === 0) &&
                    Array.isArray(this.selectedInvoiceList) && this.selectedInvoiceList.length) {
                    selectedRows = this.selectedInvoiceList;
                }

                this.selectedInvoiceList = Array.isArray(selectedRows) ? selectedRows : [];

                const selectedIds = new Set(
                    this.selectedInvoiceList.map(invoice => String(invoice && (invoice.invoiceId ?? invoice.id)))
                );

                let amountToPay = parseFloat(this.amountToPay) || 0;

                const invoices = Array.isArray(this.filteredInvoices) ? this.filteredInvoices : [];

                if (this.Manual && amountToPay > 0 && invoices.length > 0) {
                    const invoiceRate = parseFloat(this.invoiceRate) || 1;
                    const buyRate = parseFloat(this.buyRate) || 1;

                    amountToPay = amountToPay * (buyRate / invoiceRate);

                    let remainingToApply = amountToPay;

                    const updatedInvoices = invoices.map(invoice => {
                        const selected = selectedIds.has(String(invoice.id));
                        const balance = parseFloat(invoice.balance) || 0;

                        let applied = 0;

                        if (selected && remainingToApply > 0) {
                            applied = Math.min(Math.max(balance, 0), remainingToApply);
                            remainingToApply -= applied;
                        }

                        return {
                            ...invoice,
                            isSelected: selected,
                            appliedAmount: Number(applied.toFixed(2)),
                            newBalance: Number((balance - applied).toFixed(2))
                        };
                    });

                    this.filteredInvoices = updatedInvoices;
                    this.invoiceList = updatedInvoices;

                    this.calculateOutstandingCreditMemo();
                } else {
                    const updatedInvoices = invoices.map(invoice => {
                        const balance = parseFloat(invoice.balance) || 0;

                        return {
                            ...invoice,
                            isSelected: false,
                            appliedAmount: 0,
                            newBalance: Number(balance.toFixed(2))
                        };
                    });

                    this.filteredInvoices = updatedInvoices;
                    this.invoiceList = updatedInvoices;

                    this.selectedInvoiceList = [];
                    this.outstandingCreditMemo = 0;
                }
            },

            getSupplierDetails(id) {
                return this.suppliers.find(a => a.id === id);
            },
            setCurrentSupplier() {
                const supplierInfo = this.getSupplierDetails(this.supplierId);
                if (supplierInfo) {
                    this.accountNumber = supplierInfo.accountNumber;
                    this.balance = supplierInfo.balance;
                    this.supplierName = supplierInfo.name;
                    this.supplierId = supplierInfo.id;
                    this.address = supplierInfo.address;
                    if (supplierInfo.balance < 0) {
                        this.outstandingCreditMemo = parseFloat(supplierInfo.balance).toFixed(2);
                    } else {
                        this.outstandingCreditMemo = '0.00';
                    }
                }
            },

            getCurrencyDetails(id) {
                return this.currencies.find(a => sameId(a.id, id));
            },

            getAutomaticPaymentInvoices() {
                const supplierId = this.supplierId;
                const invoiceTypeId = this.invoiceTypeId;

                const filteredInvoices = (this.invoiceList || []).filter(invoice => {
                    const supplierOk = !supplierId || sameId(invoice.supplierId, supplierId);
                    const typeOk = !invoiceTypeId || sameId(invoice.currencyId, invoiceTypeId);
                    return supplierOk && typeOk;
                });

                const amountToPay = parseFloat(this.amountToPay) || 0;

                if (filteredInvoices.length === 0 || amountToPay <= 0) {
                    this.filteredInvoices = [];

                    this.invoiceList = (this.invoiceList || []).map(invoice => ({
                        ...invoice,
                        allocatedAmount: 0,
                        appliedAmount: 0,
                        remainingBalance: Number((parseFloat(invoice.balance) || 0).toFixed(2)),
                        newBalance: Number((parseFloat(invoice.balance) || 0).toFixed(2))
                    }));

                    return;
                }

                const invoiceRate = parseFloat(this.invoiceRate) || 1;
                const buyRate = parseFloat(this.buyRate) || 1;

                let remainingAmount = amountToPay * (buyRate / invoiceRate);

                const sortedInvoices = [...filteredInvoices].sort((a, b) =>
                    new Date(a.projectedPayDate) - new Date(b.projectedPayDate)
                );

                const allocatedInvoices = sortedInvoices.map(invoice => {
                    const balance = parseFloat(invoice.balance) || 0;
                    let allocatedAmount = 0;

                    if (remainingAmount > 0) {
                        allocatedAmount = Math.min(Math.max(balance, 0), remainingAmount);
                        remainingAmount -= allocatedAmount;
                    }

                    allocatedAmount = Number(allocatedAmount.toFixed(2));

                    return {
                        ...invoice,
                        isSelected: allocatedAmount > 0,
                        allocatedAmount,
                        appliedAmount: allocatedAmount,
                        remainingBalance: Number((balance - allocatedAmount).toFixed(2)),
                        newBalance: Number((balance - allocatedAmount).toFixed(2))
                    };
                });

                this.filteredInvoices = allocatedInvoices;

                const allocatedById = new Map(allocatedInvoices.map(invoice => [String(invoice.id), invoice]));

                this.invoiceList = (this.invoiceList || []).map(invoice => {
                    const allocated = allocatedById.get(String(invoice.id));

                    if (allocated) return allocated;

                    return {
                        ...invoice,
                        allocatedAmount: 0,
                        appliedAmount: 0,
                        remainingBalance: Number((parseFloat(invoice.balance) || 0).toFixed(2)),
                        newBalance: Number((parseFloat(invoice.balance) || 0).toFixed(2))
                    };
                });

                this.outstandingCreditMemo = Number(Math.max(remainingAmount, 0).toFixed(2));
            },

            calculateOutstandingCreditMemo() {
                const selectedList = (this.selectedInvoiceList && this.selectedInvoiceList.length > 0)
                    ? this.selectedInvoiceList
                    : (this.filteredInvoices || []);

                let amountToPay = parseFloat(this.amountToPay) || 0;

                if (amountToPay > 0 && selectedList.length > 0) {
                    const invoiceRate = parseFloat(this.invoiceRate) || 1;
                    const buyRate = parseFloat(this.buyRate) || 1;

                    const convertedPayment = amountToPay * (buyRate / invoiceRate);

                    let totalBalance = selectedList.reduce((acc, invoice) => {
                        const balance = parseFloat(invoice.balance) || 0;
                        return acc + balance;
                    }, 0);

                    if (convertedPayment > totalBalance) {
                        this.outstandingCreditMemo = (convertedPayment - totalBalance).toFixed(2);
                    } else {
                        this.outstandingCreditMemo = 0;
                    }
                } else {
                    this.outstandingCreditMemo = 0;
                }
            },
            getPaymentDetails() {
                const grid = this.$refs.payments;
                if (!grid) return null;

                return grid.selectedRows()[0] ?? null;
            },

            /* ------------------------------------------------------------------
             * Restores the invoice allocations stored on the payment onto the
             * invoice table (this is what makes the table show applied amounts).
             * Returns true when explicit applied amounts were found.
             * ------------------------------------------------------------------ */
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

            /* ------------------------------------------------------------------
             * MAIN FIX: load a payment deterministically instead of relying on
             * watcher side effects that fire in the wrong order.
             * ------------------------------------------------------------------ */
            async setCurrentPayment(payment = null) {
                this.scrollToAdd();

                // paymentId also has a watcher that calls this method -> avoid re-entrancy
                if (this.isSettingPayment) return;

                let paymentInfo = null;

                // Called directly with a row (e.g. right after save). Saves the grid selection.
                if (payment && typeof payment === 'object') {
                    paymentInfo = payment;
                } else {
                    const grid = this.$refs.payments;
                    if (!grid) return;

                    const selectedIds = grid.selectedRows();
                    if (selectedIds.length > 1) {
                        this.toastHandler('warning', 'You can only edit one record at a time');
                        return;
                    }

                    paymentInfo = this.getPaymentDetails();
                }

                if (!paymentInfo) {
                    this.toastHandler('warning', 'Please select a payment first.');
                    return;
                }

                // Suppress the watchers while hydrating, otherwise they re-run
                // getGridData()/updateFilteredInvoices() mid-load and wipe the allocations.
                this.isSettingPayment = true;
                this.skipInvoiceReload = true;

                try {
                    /* ---------- 1. header fields ---------- */
                    const supplierInfo = this.getSupplierDetails(paymentInfo.supplierId) || {};

                    this.paymentId = paymentInfo.id;
                    this.supplierId = paymentInfo.supplierId;
                    this.supplierName = paymentInfo.supplierName || supplierInfo.name || '';
                    this.accountNumber = paymentInfo.accountNumber || supplierInfo.accountNumber || '';
                    /* ---------- dates ----------
                     * The API returns .NET DateTime values ("2026-10-21T00:00:00"),
                     * and a date input only displays a strict yyyy-MM-dd value —
                     * that is why the field looked empty.
                     */
                    const loadedPaymentDate = loadedDate(paymentInfo.paymentDate) ||
                        loadedDate(paymentInfo.date) ||
                        loadedDate(paymentInfo.valueDate);

                    if (loadedPaymentDate) {
                        this.paymentDate = loadedPaymentDate;
                        this.date = loadedPaymentDate;
                    } else {
                        // keep whatever was there instead of blanking the field
                        this.date = this.date || this.paymentDate;
                    }
                    this.balance = paymentInfo.balance ?? supplierInfo.balance ?? '0';
                    this.purchaseOrderNumber = paymentInfo.purchaseOrderNumber;
                    this.currencyId = paymentInfo.currencyId;
                    this.totalInvoiceAmount = paymentInfo.totalInvoiceAmount;
                    this.amountToPay = paymentInfo.amountToPay;
                    this.referenceNumber = paymentInfo.referenceNumber;
                    this.description = paymentInfo.description;
                    this.isVatWithheld = paymentInfo.isVatWithheld;
                    this.currencyName = paymentInfo.currencyName;
                    this.currencyCode = paymentInfo.currencyCode;
                    this.buyRate = (parseFloat(paymentInfo.buyRate) || 1).toFixed(4);
                    this.sellRate = (parseFloat(paymentInfo.sellRate) || 1).toFixed(4);
                    this.ouId = paymentInfo.ouId;
                    this.ouName = paymentInfo.ouName;
                    this.debitAccountId = paymentInfo.debitAccountId;
                    this.address = paymentInfo.address;
                    this.voucherNumber = paymentInfo.voucherNumber;
                    this.batchNumber = paymentInfo.batchNumber;
                    this.discount = paymentInfo.discount;
                    this.debitAccountName = paymentInfo.debitAccountName;
                    this.chequeNumber = paymentInfo.chequeNumber;
                    this.bankAccountId = paymentInfo.bankAccountId;
                    this.bankAccountName = paymentInfo.bankAccountName;
                    this.bankAccountNumber = paymentInfo.bankAccountNumber;
                    this.isPosted = paymentInfo.isPosted;
                    this.cash = paymentInfo.cash;
                    this.cheque = paymentInfo.cheque;

                    if (this.chequeNumber && this.chequeNumber !== '') {
                        this.cheque = true;
                    }

                    this.bankId = paymentInfo.bankId;
                    if (this.bankId) this.onBankChange();

                    this.bankName = paymentInfo.bankName;
                    this.bankBranchId = paymentInfo.bankBranchId;
                    this.bankBranch = paymentInfo.bankBranch;
                    this.modeOfPayment = paymentInfo.modeOfPayment;

                    const isAuto = paymentInfo.isAutomatic !== false;
                    this.isAutomatic = isAuto;
                    this.Automatic = isAuto;
                    this.Manual = !isAuto;

                    const parsedCreditMemo = parseFloat(paymentInfo.outstandingCreditMemo);
                    this.outstandingCreditMemo = Number.isFinite(parsedCreditMemo)
                        ? parsedCreditMemo.toFixed(2)
                        : '0.00';

                    /* ---------- 2. invoice type + rate (BEFORE building the table) ---------- */
                    const typeId = paymentInfo.invoiceTypeId || paymentInfo.invoiceType || paymentInfo.currencyId || '';
                    this.syncInvoiceType(typeId, paymentInfo.invoiceRate ?? paymentInfo.buyRate, paymentInfo.invoiceTypeName);

                    /* ---------- 3. invoice table ---------- */
                    // Refresh headers so balances are current, but keep the cached list if the call fails.
                    const freshInvoices = await this.fetchList(ENDPOINTS.invoices, 'AP invoices');
                    if (freshInvoices.length) this.invoices = freshInvoices;

                    const allocated = paymentInfo.invoiceList || paymentInfo.invoices || paymentInfo.paymentInvoices || [];

                    this.getGridData(this.supplierId, allocated);   // invoiceList + invoiceTypeList + filteredInvoices
                    this.ensureInvoiceTypeOption(this.invoiceTypeId);
                    this.ensureInvoiceTypeOption(typeId);

                    /* ---------- 4. restore the allocation rows ---------- */
                    const restored = this.paymentInfoInvoice(allocated);

                    if (isAuto) {
                        // automatic payments: re-run FIFO allocation with the invoice rate
                        this.getAutomaticPaymentInvoices();
                    } else if (this.selectedInvoiceList.length) {
                        // manual payments: restore the saved allocation exactly when possible
                        if (!restored) this.calculateManualAppliedAmounts();
                    }
                } catch (error) {
                    console.error('setCurrentPayment failed:', error);
                    this.toastHandler('error', 'Unable to load the payment details.');
                } finally {
                    // Let the suppressed watcher flush run before re-enabling them
                    await this.$nextTick();
                    this.isSettingPayment = false;
                    this.skipInvoiceReload = false;
                    this.loadedPaymentId = this.paymentId;
                }
            },

            // Builds the allocation rows that get posted with the payment.
            // (getSelectedInvoices() was called by savePayment() but never existed,
            //  so saving threw a ReferenceError before any request was made.)
            getSelectedInvoices() {
                const selected = Array.isArray(this.selectedInvoiceList) ? this.selectedInvoiceList : [];

                if (this.Manual && !this.isAutomatic) {
                    const grid = this.$refs.invoiceGrid;
                    const rows = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];

                    if (Array.isArray(rows) && rows.length) {
                        this.selectedInvoiceList = rows.map(row => ({ ...row }));
                        return this.selectedInvoiceList;
                    }
                    return selected;
                }

                // Automatic: every invoice on screen already carries its applied amount
                return (this.filteredInvoices || []).filter(inv => (parseFloat(inv.appliedAmount) || 0) > 0);
            },

            /** Finds a payment row locally, then from a fresh fetch. */
            async findPaymentById(id) {
                if (!id) return null;

                let row = (this.paymentList || []).find(p => sameId(p.id, id));
                if (row) return row;

                await this.getPayments();
                row = (this.paymentList || []).find(p => sameId(p.id, id));
                return row || null;
            },

            /** Clears the form after the loaded payment is gone. */
            resetPaymentFields() {
                this.paymentId = '';
                this.loadedPaymentId = '';
                this.selectedInvoiceList = [];
                this.filteredInvoices = [];
                this.invoiceList = [];
                this.invoiceTypeList = [];
                this.invoiceTypeId = '';
                this.invoiceTypeName = '';
                this.invoiceRate = '1.0000';
                this.amountToPay = '0';
                this.outstandingCreditMemo = '0.00';
                this.batchNumber = '';
                this.chequeNumber = '';
                this.referenceNumber = '0';
                this.description = '';
                this.isPosted = false;
            },

            /** Pulls a readable message out of an ABP / Http error response. */
            apiErrorMessage(error, fallback) {
                const data = error && error.response && error.response.data;
                if (!data) return error && error.message ? `${fallback} (${error.message})` : fallback;
                if (typeof data === 'string') return `${fallback} ${data}`.trim();

                const abpError = data.error && (data.error.message || data.error.details);
                return abpError || data.message || data.detail || data.title || fallback;
            },

            async savePayment() {
                if (this.isLoading) return;

                this.isLoading = true;

                try {
                    this.getSelectedInvoices();
                    this.calculateOutstandingCreditMemo();

                    if (!this.supplierId) {
                        this.toastHandler('warning', 'Please select a supplier.');
                        return;
                    }
                    if (!this.invoiceTypeId) {
                        this.toastHandler('warning', 'Please select an invoice type.');
                        return;
                    }
                    if ((parseFloat(this.amountToPay) || 0) === 0) {
                        this.toastHandler('warning', 'Amount to pay cannot be zero.');
                        return;
                    }

                    const payload = {};

                    payload.batchNumber = (this.batchNumber === null || this.batchNumber === '')
                        ? '0'
                        : this.batchNumber;

                    const supplierInfo = this.getSupplierDetails(this.supplierId);
                    if (supplierInfo) {
                        payload.supplierId = supplierInfo.id;
                        payload.supplierName = supplierInfo.name;
                        payload.accountNumber = supplierInfo.accountNumber;
                        payload.tenantId = supplierInfo.tenantId || this.tenantId;
                    } else {
                        payload.supplierId = this.supplierId;
                        payload.supplierName = this.supplierName;
                        payload.accountNumber = this.accountNumber;
                        payload.tenantId = this.tenantId;
                    }

                    const currencyInfo = this.getCurrencyDetails(this.currencyId);
                    if (currencyInfo) {
                        payload.currencyId = currencyInfo.id;
                        payload.currencyName = currencyInfo.currencyName;
                        payload.currencyCode = currencyInfo.currencyCode;
                        payload.minorName = currencyInfo.minorName;
                        payload.buyRate = parseFloat(this.buyRate) || 1;
                        payload.sellRate = currencyInfo.sellRate;
                    } else {
                        payload.currencyId = this.currencyId;
                        payload.currencyName = this.currencyName;
                        payload.buyRate = parseFloat(this.buyRate) || 1;
                    }

                    const invoiceTypeInfo = this.getInvoiceTypeOption(this.invoiceTypeId) ||
                        this.getCurrencyDetails(this.invoiceTypeId);
                    payload.invoiceTypeId = invoiceTypeInfo ? invoiceTypeInfo.id : this.invoiceTypeId;
                    payload.invoiceTypeName = invoiceTypeInfo
                        ? (invoiceTypeInfo.currencyName || invoiceTypeInfo.name)
                        : this.invoiceTypeName;
                    payload.invoiceRate = parseFloat(this.invoiceRate) || 1;

                    if (this.ouId) {
                        const departmentInfo = this.getOuDetails(this.ouId);
                        if (departmentInfo) {
                            payload.ouId = departmentInfo.id;
                            payload.ouName = departmentInfo.name;
                        }
                    }

                    const bankAccountInfo = (this.accounts || []).find(a => sameId(a.id, this.bankAccountId));
                    if (bankAccountInfo) {
                        payload.bankAccountId = bankAccountInfo.id;
                        payload.bankAccountName = `${bankAccountInfo.accountNo} - ${bankAccountInfo.accountName}`;
                        payload.bankAccountNumber = bankAccountInfo.accountNo;
                    } else {
                        payload.bankAccountId = this.emptyGuid;
                        payload.bankAccountName = 'Not Set';
                        payload.bankAccountNumber = 'Not Set';
                    }

                    const selected = Array.isArray(this.selectedInvoiceList) ? this.selectedInvoiceList : [];
                    payload.invoiceList = selected.length ? selected : (this.filteredInvoices || []);

                    payload.amountToPay = parseFloat(this.amountToPay) || 0;
                    // Always send a yyyy-MM-dd value, whichever of the two fields the form edits
                    payload.paymentDate = loadedDate(this.paymentDate) || loadedDate(this.date) || isoDate(new Date());
                    payload.date = payload.paymentDate;
                    payload.referenceNumber = this.referenceNumber;
                    payload.description = this.description;
                    payload.isMultiCurrency = this.isMultiCurrency;
                    payload.outstandingCreditMemo = this.outstandingCreditMemo;
                    payload.modeOfPayment = this.modeOfPayment;
                    payload.chequeNumber = this.chequeNumber;
                    payload.isPosted = this.isPosted;
                    payload.isAutomatic = this.isAutomatic;

                    const bankInfo = this.getBankDetails(this.bankId);
                    payload.bankId = bankInfo ? bankInfo.id : this.emptyGuid;
                    if (bankInfo) payload.bankName = bankInfo.name;

                    const bankBranchInfo = this.getBankBranchDetails(this.bankBranchId);
                    payload.bankBranchId = bankBranchInfo ? bankBranchInfo.id : this.emptyGuid;
                    if (bankBranchInfo) payload.bankBranch = bankBranchInfo.name;

                    // ---------- UPDATE ----------
                    if (this.paymentId) {
                        payload.id = this.paymentId;

                        const response = await api.post(ENDPOINTS.updatePayment, payload);
                        const body = response.data || {};
                        const updatedId = body.id || body.paymentId || this.paymentId;

                        await this.getPayments();
                        const refreshed = (body.id || body.paymentId) ? body : await this.findPaymentById(updatedId);

                        if (refreshed) {
                            await this.setCurrentPayment(refreshed);
                        }

                        this.toastHandler('', 'Invoice Payment updated.');
                        return;
                    }

                    // ---------- CREATE ----------
                    const response = await api.post(ENDPOINTS.createPayment, payload);
                    const body = response.data || {};
                    const createdId = body.id || body.paymentId || (body.payment && body.payment.id);

                    await this.getPayments();

                    const created = createdId
                        ? await this.findPaymentById(createdId)
                        : null;

                    if (created) {
                        await this.setCurrentPayment(created);
                    } else {
                        // keep the created id so a second click updates instead of creating a duplicate
                        if (createdId) this.paymentId = createdId;
                    }

                    this.toastHandler('', 'Invoice Payment Created.');

                    // Original behaviour was a redirect to the list; uncomment if you want it back.
                    // window.location.href = '/ApDataEntry/AllPayments';
                } catch (error) {
                    console.error('savePayment failed:', error && error.response ? error.response.data : error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Unable to save the payment.'));
                } finally {
                    this.isLoading = false;
                }
            },

            async cancelSelectedPayments() {
                const grid = this.$refs.payments;
                const selected = grid && typeof grid.selectedRows === 'function'
                    ? grid.selectedRows()
                    : [];

                if (!selected.length) {
                    this.toastHandler('warning', 'Select one or more payments to cancel.');
                    return;
                }

                // Ask for confirmation before calling the backend.
                const result = await Swal.fire({
                    icon: 'warning',
                    title: 'Confirm Cancellation',
                    text: `Are you sure you want to cancel ${selected.length} selected payments${selected.length === 1 ? '' : 's'}?`,
                    showCancelButton: true,
                    confirmButtonText: 'Yes, cancel',
                    cancelButtonText: 'No, go back',
                    confirmButtonColor: '#dc2626',
                    cancelButtonColor: '#64748b',
                    reverseButtons: true
                });

                if (!result.isConfirmed) return;

                try {
                    const paymentIds = selected.map(payment => payment.id);

                    const res = await axios.post('http://localhost:5300/ApDataEntry/CancelPayments', {
                        paymentIds
                    });

                    if (res.data && res.data.success === false) {
                        this.toastHandler(
                            'error',
                            res.data.message || 'Unable to cancel selected payments.'
                        );
                        return;
                    }

                    if (grid.clearSelection) {
                        grid.clearSelection();
                    }

                    this.toastHandler('success', 'Canceled successfully.');

                    await this.getPayments();
                } catch (error) {
                    console.error('Payments cancellation failed:', error);

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Failed to cancel payment(s).'
                    );
                }
            },
            async postSelectedPayments() {
                const grid = this.$refs.payments;
                const selected = grid && typeof grid.selectedRows === 'function'
                    ? grid.selectedRows()
                    : [];

                if (!selected.length) {
                    this.toastHandler('warning', 'Select one or more invoices to post.');
                    return;
                }

                // Skip payments that have already been posted.
                const paymentsToPost = selected.filter(invoice =>
                    invoice.isPosted !== true
                );

                const skippedCount = selected.length - paymentsToPost.length;

                if (!paymentsToPost.length) {
                    this.toastHandler('info', 'All selected payments have already been posted.');
                    return;
                }

                // Confirm before posting.
                const result = await Swal.fire({
                    icon: 'warning',
                    title: 'Confirm Posting',
                    text: `Are you sure you want to post ${paymentsToPost.length} payments${paymentsToPost.length === 1 ? '' : 's'}?${skippedCount > 0 ? ` ${skippedCount} already-posted payment(s) will be skipped.` : ''}`,
                    showCancelButton: true,
                    confirmButtonText: 'Yes, post',
                    cancelButtonText: 'No, go back',
                    confirmButtonColor: '#392eef',
                    cancelButtonColor: '#64748b',
                    reverseButtons: true
                });

                if (!result.isConfirmed) return;

                try {
                    const paymentIds = paymentsToPost.map(payment => payment.id);

                    const res = await axios.post(
                        'http://localhost:5300/ApDataEntry/InitPostPayment',
                        { paymentIds }
                    );

                    if (res.data && res.data.success === false) {
                        this.toastHandler(
                            'error',
                            res.data.message || 'Unable to post selected payments.'
                        );
                        return;
                    }

                    if (grid.clearSelection) {
                        grid.clearSelection();
                    }

                    this.toastHandler(
                        'success',
                        skippedCount > 0
                            ? `Posted ${paymentsToPost.length} payment(s). Skipped ${skippedCount} already-posted payment(s).`
                            : 'Posted successfully.'
                    );

                    await this.getPayments();
                } catch (error) {
                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Failed to post payment(s).'
                    );
                }
            },

            printReport() {
                if (!this.paymentId) {
                    this.toastHandler("warning", "No payment selected for printing.");
                    return;
                }

                const paymentId = this.paymentId;
                const reportUrl = `/ApReports/PrintPaymentReceipt?id=${paymentId}`;

                const printWindow = window.open("", "_blank");
                printWindow.document.write(`
        <html>
        <head>
            <title>Loading Report...</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #fff;
                    font-family: Arial, sans-serif;
                }
                .loader {
                    border: 10px solid #f3f3f3;
                    border-top: 10px solid #15aafa;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="loader"></div>
        </body>
        </html>
    `);
                printWindow.document.close();

                setTimeout(() => {
                    printWindow.location.href = reportUrl;
                }, 800);
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
            resetBankFields() {
                this.bankId = '';
                this.bankName = '';
                this.bankBranchId = '';
                this.bankBranchName = '';
            },

            // These were used by savePayment() but were never defined
            getOuDetails(id) {
                return this.ouList.find(a => sameId(a.id, id));
            },
            getBankDetails(id) {
                return this.banks.find(b => sameId(b.id, id));
            },
            getBankBranchDetails(id) {
                return (this.bankBranchList || []).find(b => sameId(b.id, id));
            }
        },
        watch: {
            // `date` and `paymentDate` are the same value in this form;
            // keep them mirroring each other so the input bound to either one works.
            paymentDate(val) {
                const iso = isoDate(val);
                if (iso && iso !== this.date) this.date = iso;
            },
            date(val) {
                const iso = isoDate(val);
                if (iso && iso !== this.paymentDate) this.paymentDate = iso;
            },
            supplierId(val) {
                if (!val || this.isSettingPayment) return;
                this.setCurrentSupplier();
                this.getGridData(val);
            },
            currencyId(val) {
                if (this.isSettingPayment) return;
                if (this.isAutomatic) {
                    this.getAutomaticPaymentInvoices();
                    this.calculateAndDisplayAppliedAmounts();
                }
            },
            invoiceTypeId(val) {
                // Always keep the rate / name in sync, even when the id is set in code
                if (this.isSettingPayment) return;
                this.onInvoiceTypeChange();
            },
            amountToPay(val) {
                if (this.isSettingPayment) return;
                if (this.isAutomatic) {
                    this.getAutomaticPaymentInvoices();
                    this.calculateAndDisplayAppliedAmounts();
                }
            },
            Manual(val) {
                if (this.isSettingPayment) return;
                this.isAutomatic = !val;
                this.Automatic = !val;
                this.updateFilteredInvoices();
            },
            isAutomatic(val) {
                if (this.isSettingPayment) return;
                this.Automatic = val;
                this.Manual = !val;
                this.updateFilteredInvoices();
                if (val) {
                    this.getAutomaticPaymentInvoices();
                    this.calculateAndDisplayAppliedAmounts();
                }
            },
            invoiceId(val) {
                if (val && !this.isSettingPayment && typeof this.setCurrentInvoice === 'function') {
                    this.setCurrentInvoice();
                }
            },
            paymentId(val) {
                if (val && !this.isSettingPayment && val !== this.loadedPaymentId) {
                    this.setCurrentPayment();
                }
            }
        },
        async mounted() {
            await this.loadLookups();
            await this.getApInvoices();
            await this.getPayments();
            this.getBusinessProfile();
        }
    });

    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
