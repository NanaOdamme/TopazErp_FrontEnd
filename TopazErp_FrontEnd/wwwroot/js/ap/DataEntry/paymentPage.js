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
        createPayment: '/Ap/CreatePayment',
        updatePayment: '/Ap/UpdatePayment',
        deletePayment: '/Ap/DeletePayment',
        createMemo: '/Ap/CreateDebitMemo'
    };

    const pad = (n) => String(n).padStart(2, '0');
    const isoDate = (date) => {
        if (date === null || date === undefined || date === '') return '';
        if (typeof date === 'string') {
            const raw = date.trim();
            if (!raw) return '';
            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
            const ms = /\/Date\((-?\d+)/.exec(raw);
            if (ms) {
                const d = new Date(Number(ms[1]));
                return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }
            const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(raw);
            if (dmy) return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
            const ymd = /^(\d{4})[/](\d{1,2})[/](\d{1,2})/.exec(raw);
            if (ymd) return `${ymd[1]}-${pad(ymd[2])}-${pad(ymd[3])}`;
        }
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };
    const loadedDate = (value) => {
        const iso = isoDate(value);
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
        if (iso.startsWith('0001-') || iso.startsWith('0000-') || iso === '1900-01-01') return '';
        return iso;
    };
    const today = isoDate(new Date());
    const sameId = (a, b) =>
        a !== null && a !== undefined && b !== null && b !== undefined &&
        String(a).toLowerCase() === String(b).toLowerCase();
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
    const asText = (value) => (value === null || value === undefined ? '' : String(value));
    const asNumber = (value, fallback = 0) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    };
    const PAYMENT_TEXT_FIELDS = [
        'batchNumber', 'supplierName', 'accountNumber', 'currencyName', 'currencyCode',
        'minorName', 'invoiceTypeName', 'ouName', 'bankAccountName', 'bankAccountNumber',
        'bankName', 'bankBranch', 'referenceNumber', 'description', 'chequeNumber',
        'modeOfPayment', 'voucherNumber', 'address', 'purchaseOrderNumber'
    ];
    const PAYMENT_ALLOCATION_DROP = ['isSelected', 'newBalance', 'remainingBalance', '__rowKey'];

    const app = Vue.createApp({
        data() {
            return {
                theme: '#ff2056',
                theme1: '#0645e7',
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
                    if (!element) { console.error('Cannot find #add. Check where the div is rendered.'); return; }
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            },
            getBusinessProfile() {
                axios.get('/SharedResource/GetBusinessProfile').then(response => {
                    if (response.data) {
                        this.approveInvoiceBeforePayment = response.data.approveInvoiceBeforePayment;
                        this.isOu = response.data.enforceOu;
                    }
                }).catch(err => { console.log(err); });
            },
            async fetchList(url, label, preferredKey = null) {
                try {
                    const response = await axios.get(url);
                    const list = unwrapList(response.data, preferredKey);
                    return list.map(item => (item && item.Id && !item.id) ? normalizeKeys(item) : item);
                } catch (error) {
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },
            async getPayments() {
                this.isShimmerLoading = true;
                this.paymentList = await this.fetchList(ENDPOINTS.payments, 'Payments');
                this.paymentList.filter(p => !p.isCanceled);
                this.isShimmerLoading = false;
                return this.paymentList;
            },
            async getApInvoices() {
                const list = await this.fetchList(ENDPOINTS.invoices, 'AP invoices');
                if (list.length || !this.invoices.length) this.invoices = list;
                this.invoices.filter(p => !p.isCanceled);
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
                this.accounts = rawAccounts.map(a => ({
                    ...a,
                    accountIdentifier: a.accountIdentifier || `${a.accountNo ?? ''} - ${a.accountName ?? a.name ?? ''}`.trim().replace(/^ - /, ''),
                    name: a.accountName || a.name,
                    accountName: a.accountName || a.name
                }));
                this.suppliers = rawSuppliers.map(s => ({ ...s, name: (s.name || '').trim() }));
                this.banks = rawBanks.map(b => ({ ...b }));
                this.currencies = rawCurrencies.map(c => ({
                    ...c,
                    currencyName: c.currencyName,
                    currencyCode: c.currencyCode,
                    buyRate: c.buyRate,
                    sellRate: c.sellRate,
                }));
                const byId = new Map(rawUnits.map(u => [String(u.id), u]));
                const getPath = (unit, visited = new Set()) => {
                    const names = [];
                    let cur = unit;
                    let depth = 0;
                    while (cur && depth < 20) {
                        names.unshift(cur.name);
                        const pid = cur.parentId ? String(cur.parentId) : '';
                        if (!pid || pid === EMPTY_GUID || !byId.has(pid) || visited.has(pid)) break;
                        visited.add(pid);
                        cur = byId.get(pid);
                        depth++;
                    }
                    return names.join(' / ');
                };
                this.ouList = rawUnits.map(u => {
                    const path = getPath(u);
                    return { ...u, originalName: u.name, name: path, displayName: path, hierarchy: path };
                }).sort((a, b) => a.name.localeCompare(b.name));
            },
            onCurrencyChange() {
                const currency = this.currencies.find((item) => item.id === this.currencyId);
                if (!currency) return;
                this.currencyName = currency.currencyName;
                this.currencyCode = currency.currencyCode;
                this.buyRate = parseFloat(currency.buyRate).toFixed(4);
                this.isMultiCurrency = currency.isDefault !== true;
            },
            initPaymentType() { this.isAutomatic = !!this.Automatic; },
            toggleIsAutomatic() { this.Automatic = true; this.Manual = false; },
            toggleManual() { this.Automatic = false; this.Manual = true; },
            toggleCash() { this.cash = true; this.cheque = false; this.InitModeOfPayment(); },
            toggleCheque() { this.cash = false; this.cheque = true; this.InitModeOfPayment(); },
            InitModeOfPayment() { this.modeOfPayment = this.cash ? 'Cash' : 'Cheque'; },
            formatNumber(number) { if (number < 0) return `(${Math.abs(number).toFixed(2)})`; return number; },
            generateBatchNumber() { return `B-${Math.floor(100000 + Math.random() * 900000)}`; },

            getInvoiceTypeOption(id) {
                if (!id) return null;
                return (this.invoiceTypeList || []).find(t => sameId(t.id, id)) ||
                    (this.currencies || []).find(c => sameId(c.id, id)) || null;
            },
            ensureInvoiceTypeOption(id) {
                if (!id) return;
                if ((this.invoiceTypeList || []).some(t => sameId(t.id, id))) return;
                const currency = this.currencies.find(c => sameId(c.id, id));
                if (currency) this.invoiceTypeList = [...(this.invoiceTypeList || []), currency];
            },
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
                } else { this.invoiceRate = '1.0000'; }
                return option;
            },

            // ================================================================
            // PATCH 1: helper to know if a row counts as "applied"
            // ================================================================
            isAppliedInvoice(row) {
                if (!row) return false;
                const v = parseFloat(row.appliedAmount ?? row.allocatedAmount ?? row.amountToApply ?? row.amount ?? 0);
                return Number.isFinite(v) && v > 0.009;
            },

            getGridData(supplierId, allocatedList = []) {
                const allocated = Array.isArray(allocatedList) ? allocatedList : [];
                const isAllocated = (invoice) => allocated.some(row =>
                    (row && sameId(row.invoiceId, invoice.id)) ||
                    (row && sameId(row.id, invoice.id)) ||
                    (row && row.invoiceNumber && invoice.invoiceNumber && String(row.invoiceNumber) === String(invoice.invoiceNumber))
                );
                const hasDetails = (invoice) => {
                    const details = invoice.invoiceDetails || invoice.invoiceDetailList || invoice.details;
                    return Array.isArray(details) ? details.length > 0 : true;
                };
                const isOpen = (invoice) => {
                    const balance = parseFloat(invoice.balance) || 0;
                    const canceled = invoice.isCanceled === true || invoice.canceled === true;
                    return !canceled && invoice.isPosted === true && balance > 0 && hasDetails(invoice) &&
                        (!this.approveInvoiceBeforePayment || invoice.isApproved === true);
                };

                // KEEP allocated even if closed/0-balance + all open supplier invoices
                this.invoiceList = (this.invoices || [])
                    .filter(invoice => {
                        if (isAllocated(invoice)) return true;
                        if (supplierId && invoice.supplierId && !sameId(invoice.supplierId, supplierId)) return false;
                        return isOpen(invoice);
                    })
                    .map(invoice => ({ ...invoice }))
                    .sort((a, b) => new Date(a.projectedPayDate) - new Date(b.projectedPayDate));

                const typeIds = new Set(
                    this.invoiceList.filter(inv => !supplierId || sameId(inv.supplierId, supplierId))
                        .map(inv => inv.currencyId).filter(Boolean).map(String)
                );
                const currentType = this.invoiceTypeId;
                this.invoiceTypeList = (this.currencies || []).filter(c => typeIds.has(String(c.id)));
                this.ensureInvoiceTypeOption(currentType);

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
                this.syncInvoiceType(this.invoiceTypeId, this.buyRate);
                this.updateFilteredInvoices();
                if (this.isAutomatic) this.calculateAndDisplayAppliedAmounts();
                else this.calculateManualAppliedAmounts();
            },
            onBankChange() {
                const bank = this.banks.find((item) => item.id === this.bankId);
                if (!bank) return;
                this.bankBranchList = bank.bankBranches;
            },

            // ================================================================
            // PATCH 2: filteredInvoices ALWAYS keeps allocated/applied rows visible
            // ================================================================
            updateFilteredInvoices() {
                const supplierId = this.supplierId;
                const invoiceTypeId = this.invoiceTypeId;

                const allocatedIds = new Set(
                    (this.selectedInvoiceList || []).map(s => String(s.invoiceId ?? s.id ?? '').toLowerCase()).filter(Boolean)
                );
                const grid = this.$refs.invoiceGrid;
                let gridSelected = [];
                try { gridSelected = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : []; } catch(e) {}
                (gridSelected || []).forEach(r => {
                    if (r && (r.id || r.invoiceId)) allocatedIds.add(String(r.invoiceId ?? r.id).toLowerCase());
                });

                const filteredInvoices = (this.invoiceList || []).filter(invoice => {
                    const isAllocated = allocatedIds.has(String(invoice.id).toLowerCase());
                    if (isAllocated) return true;
                    const supplierOk = !supplierId || sameId(invoice.supplierId, supplierId);
                    const typeOk = !invoiceTypeId || sameId(invoice.currencyId, invoiceTypeId);
                    return supplierOk && typeOk;
                });

                if (this.Manual && !this.isAutomatic) {
                    const selectedIds = (this.selectedInvoiceList || []).map(s => String(s && (s.invoiceId ?? s.id)));
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
                if (invoices.length === 0 || amountToPay <= 0) return;
                const invoiceRate = parseFloat(this.invoiceRate) || 1;
                const buyRate = parseFloat(this.buyRate) || 1;
                let remainingAmount = amountToPay * (buyRate / invoiceRate);
                const sortedInvoices = [...invoices].sort((a, b) => new Date(a.projectedPayDate) - new Date(b.projectedPayDate));
                const updatedInvoices = sortedInvoices.map(invoice => {
                    const balance = parseFloat(invoice.balance) || 0;
                    let applied = 0;
                    if (remainingAmount > 0) { applied = Math.min(Math.max(balance, 0), remainingAmount); remainingAmount -= applied; }
                    applied = Number(applied.toFixed(2));
                    return { ...invoice, allocatedAmount: applied, appliedAmount: applied, remainingBalance: Number((balance - applied).toFixed(2)), newBalance: Number((balance - applied).toFixed(2)), isSelected: applied > 0 };
                });
                this.filteredInvoices = updatedInvoices;
                const updatedById = new Map(updatedInvoices.map(invoice => [String(invoice.id), invoice]));
                this.invoiceList = (this.invoiceList || []).map(invoice => updatedById.has(String(invoice.id)) ? updatedById.get(String(invoice.id)) : invoice);
                this.outstandingCreditMemo = Number(Math.max(remainingAmount, 0).toFixed(2));
            },
            async ApplyPayment() {
                if (this.isAutomatic) await this.calculateAndDisplayAppliedAmounts();
                else this.calculateManualAppliedAmounts();
            },
            calculateManualAppliedAmounts() {
                const grid = this.$refs.invoiceGrid;
                let selectedRows = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];
                if ((!Array.isArray(selectedRows) || selectedRows.length === 0) && Array.isArray(this.selectedInvoiceList) && this.selectedInvoiceList.length) {
                    selectedRows = this.selectedInvoiceList;
                }
                this.selectedInvoiceList = Array.isArray(selectedRows) ? selectedRows : [];
                const selectedIds = new Set(this.selectedInvoiceList.map(invoice => String(invoice && (invoice.invoiceId ?? invoice.id))));
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
                        if (selected && remainingToApply > 0) { applied = Math.min(Math.max(balance, 0), remainingToApply); remainingToApply -= applied; }
                        return { ...invoice, isSelected: selected, appliedAmount: Number(applied.toFixed(2)), newBalance: Number((balance - applied).toFixed(2)) };
                    });
                    this.filteredInvoices = updatedInvoices;
                    const updMap = new Map(updatedInvoices.map(i => [String(i.id), i]));
                    this.invoiceList = (this.invoiceList || []).map(inv => updMap.has(String(inv.id)) ? updMap.get(String(inv.id)) : inv);
                    this.calculateOutstandingCreditMemo();
                } else {
                    const updatedInvoices = invoices.map(invoice => {
                        const balance = parseFloat(invoice.balance) || 0;
                        return { ...invoice, isSelected: false, appliedAmount: 0, newBalance: Number(balance.toFixed(2)) };
                    });
                    this.filteredInvoices = updatedInvoices;
                    const updMap = new Map(updatedInvoices.map(i => [String(i.id), i]));
                    this.invoiceList = (this.invoiceList || []).map(inv => updMap.has(String(inv.id)) ? updMap.get(String(inv.id)) : inv);
                    this.selectedInvoiceList = [];
                    this.outstandingCreditMemo = 0;
                }
            },
            getSupplierDetails(id) { return this.suppliers.find(a => a.id === id); },
            setCurrentSupplier() {
                const supplierInfo = this.getSupplierDetails(this.supplierId);
                if (supplierInfo) {
                    this.accountNumber = supplierInfo.accountNumber;
                    this.balance = supplierInfo.balance;
                    this.supplierName = supplierInfo.name;
                    this.supplierId = supplierInfo.id;
                    this.address = supplierInfo.address;
                    if (supplierInfo.balance < 0) this.outstandingCreditMemo = parseFloat(supplierInfo.balance).toFixed(2);
                    else this.outstandingCreditMemo = '0.00';
                }
            },
            getCurrencyDetails(id) { return this.currencies.find(a => sameId(a.id, id)); },
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
                        ...invoice, allocatedAmount: 0, appliedAmount: 0,
                        remainingBalance: Number((parseFloat(invoice.balance) || 0).toFixed(2)),
                        newBalance: Number((parseFloat(invoice.balance) || 0).toFixed(2))
                    }));
                    return;
                }
                const invoiceRate = parseFloat(this.invoiceRate) || 1;
                const buyRate = parseFloat(this.buyRate) || 1;
                let remainingAmount = amountToPay * (buyRate / invoiceRate);
                const sortedInvoices = [...filteredInvoices].sort((a, b) => new Date(a.projectedPayDate) - new Date(b.projectedPayDate));
                const allocatedInvoices = sortedInvoices.map(invoice => {
                    const balance = parseFloat(invoice.balance) || 0;
                    let allocatedAmount = 0;
                    if (remainingAmount > 0) { allocatedAmount = Math.min(Math.max(balance, 0), remainingAmount); remainingAmount -= allocatedAmount; }
                    allocatedAmount = Number(allocatedAmount.toFixed(2));
                    return { ...invoice, isSelected: allocatedAmount > 0, allocatedAmount, appliedAmount: allocatedAmount, remainingBalance: Number((balance - allocatedAmount).toFixed(2)), newBalance: Number((balance - allocatedAmount).toFixed(2)) };
                });
                this.filteredInvoices = allocatedInvoices;
                const allocatedById = new Map(allocatedInvoices.map(invoice => [String(invoice.id), invoice]));
                this.invoiceList = (this.invoiceList || []).map(invoice => {
                    const allocated = allocatedById.get(String(invoice.id));
                    if (allocated) return allocated;
                    return { ...invoice, allocatedAmount: 0, appliedAmount: 0, remainingBalance: Number((parseFloat(invoice.balance) || 0).toFixed(2)), newBalance: Number((parseFloat(invoice.balance) || 0).toFixed(2)) };
                });
                this.outstandingCreditMemo = Number(Math.max(remainingAmount, 0).toFixed(2));
            },
            calculateOutstandingCreditMemo() {
                const selectedList = (this.selectedInvoiceList && this.selectedInvoiceList.length > 0) ? this.selectedInvoiceList : (this.filteredInvoices || []);
                let amountToPay = parseFloat(this.amountToPay) || 0;
                if (amountToPay > 0 && selectedList.length > 0) {
                    const invoiceRate = parseFloat(this.invoiceRate) || 1;
                    const buyRate = parseFloat(this.buyRate) || 1;
                    const convertedPayment = amountToPay * (buyRate / invoiceRate);
                    let totalBalance = selectedList.reduce((acc, invoice) => { const balance = parseFloat(invoice.balance) || 0; return acc + balance; }, 0);
                    if (convertedPayment > totalBalance) this.outstandingCreditMemo = (convertedPayment - totalBalance).toFixed(2);
                    else this.outstandingCreditMemo = 0;
                } else { this.outstandingCreditMemo = 0; }
            },
            getPaymentDetails() {
                const grid = this.$refs.payments;
                if (!grid) return null;
                return grid.selectedRows()[0] ?? null;
            },
            paymentInfoInvoice(responseData) {
                const saved = Array.isArray(responseData) ? responseData : [];
                this.selectedInvoiceList = saved.map(invoice => ({ ...invoice }));
                if (!saved.length) return false;
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
                const explicitKeys = amountKeys.slice(0, -1);
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
                    return { ...invoice, isSelected: true, appliedAmount: applied, allocatedAmount: applied, newBalance: Number((balance - applied).toFixed(2)), remainingBalance: Number((balance - applied).toFixed(2)) };
                };
                this.filteredInvoices = (this.filteredInvoices || []).map(merge);
                this.invoiceList = (this.invoiceList || []).map(merge);
                return restoredExplicit > 0;
            },

            // ================================================================
            // PATCH 3: setCurrentPayment - loads allocated + OTHER open invoices
            // ================================================================
            async setCurrentPayment(payment = null) {
                this.scrollToAdd();
                if (this.isSettingPayment) return;
                let paymentInfo = null;
                if (payment && typeof payment === 'object') paymentInfo = payment;
                else {
                    const grid = this.$refs.payments;
                    if (!grid) return;
                    const selectedIds = grid.selectedRows();
                    if (selectedIds.length > 1) { this.toastHandler('warning', 'You can only edit one record at a time'); return; }
                    paymentInfo = this.getPaymentDetails();
                }
                if (!paymentInfo) { this.toastHandler('warning', 'Please select a payment first.'); return; }

                this.isSettingPayment = true;
                this.isShimmerLoading = true;
                this.skipInvoiceReload = true;
                try {
                    const supplierInfo = this.getSupplierDetails(paymentInfo.supplierId) || {};
                    this.paymentId = paymentInfo.id;
                    this.supplierId = paymentInfo.supplierId;
                    this.supplierName = paymentInfo.supplierName || supplierInfo.name || '';
                    this.accountNumber = paymentInfo.accountNumber || supplierInfo.accountNumber || '';
                    const loadedPaymentDate = loadedDate(paymentInfo.paymentDate) || loadedDate(paymentInfo.date) || loadedDate(paymentInfo.valueDate);
                    if (loadedPaymentDate) { this.paymentDate = loadedPaymentDate; this.date = loadedPaymentDate; }
                    else this.date = this.date || this.paymentDate;
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
                    if (this.chequeNumber && this.chequeNumber !== '') this.cheque = true;
                    this.bankId = paymentInfo.bankId;
                    if (this.bankId) this.onBankChange();
                    this.bankName = paymentInfo.bankName;
                    this.bankBranchId = paymentInfo.bankBranchId;
                    this.bankBranch = paymentInfo.bankBranch;
                    this.modeOfPayment = paymentInfo.modeOfPayment;
                    const isAuto = paymentInfo.isAutomatic !== false;
                    this.isAutomatic = isAuto; this.Automatic = isAuto; this.Manual = !isAuto;
                    const parsedCreditMemo = parseFloat(paymentInfo.outstandingCreditMemo);
                    this.outstandingCreditMemo = Number.isFinite(parsedCreditMemo) ? parsedCreditMemo.toFixed(2) : '0.00';
                    const typeId = paymentInfo.invoiceTypeId || paymentInfo.invoiceType || paymentInfo.currencyId || '';
                    this.syncInvoiceType(typeId, paymentInfo.invoiceRate ?? paymentInfo.buyRate, paymentInfo.invoiceTypeName);

                    const freshInvoices = await this.fetchList(ENDPOINTS.invoices, 'AP invoices');
                    if (freshInvoices.length) this.invoices = freshInvoices;
                    const allocated = paymentInfo.invoiceList || paymentInfo.invoices || paymentInfo.paymentInvoices || [];

                    // 1) Build full supplier invoice pool: allocated + open invoices
                    this.getGridData(this.supplierId, allocated);
                    this.ensureInvoiceTypeOption(this.invoiceTypeId);
                    this.ensureInvoiceTypeOption(typeId);

                    // 2) Overlay saved applied amounts
                    const restored = this.paymentInfoInvoice(allocated);

                    // 3) KEEP other supplier invoices visible
                    if (isAuto) {
                        this.calculateOutstandingCreditMemo();
                    } else if (this.selectedInvoiceList.length) {
                        if (!restored) this.calculateManualAppliedAmounts();
                        this.$nextTick(() => {
                            const grid = this.$refs.invoiceGrid;
                            if (grid && typeof grid.setSelectedRows === 'function') {
                                try { grid.setSelectedRows(this.selectedInvoiceList.map(r => r.invoiceId ?? r.id)); } catch(e) {}
                            }
                        });
                    }
                } catch (error) {
                    console.error('setCurrentPayment failed:', error);
                    this.toastHandler('error', 'Unable to load the payment details.');
                } finally {
                    await this.$nextTick();
                    this.isSettingPayment = false;
                    this.skipInvoiceReload = false;
                    this.loadedPaymentId = this.paymentId;
                    this.isShimmerLoading = false;
                }
            },

            // ================================================================
            // PATCH 4: ONLY applied invoices are considered for save
            // ================================================================
            getSelectedInvoices() {
                if (this.Manual && !this.isAutomatic) {
                    const grid = this.$refs.invoiceGrid;
                    let rows = null;
                    try { rows = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : null; } catch(e) {}
                    if (Array.isArray(rows) && rows.length) {
                        this.selectedInvoiceList = rows.map(r => ({ ...r }));
                    }
                } else {
                    const applied = (this.filteredInvoices || []).filter(r => this.isAppliedInvoice(r));
                    if (applied.length) this.selectedInvoiceList = applied.map(r => ({ ...r }));
                }
                return this.selectedInvoiceList;
            },
            getInvoicesToSave() {
                let candidates = [];
                if (this.isAutomatic && !this.Manual) {
                    candidates = (this.filteredInvoices || []).filter(r => this.isAppliedInvoice(r));
                    if (!candidates.length) candidates = (this.invoiceList || []).filter(r => this.isAppliedInvoice(r));
                } else {
                    const grid = this.$refs.invoiceGrid;
                    let gridRows = null;
                    try { gridRows = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : null; } catch(e) {}
                    if (Array.isArray(gridRows) && gridRows.length) {
                        candidates = gridRows.filter(r => this.isAppliedInvoice(r));
                        if (!candidates.length && gridRows.some(r => r.isSelected)) {
                            this.calculateManualAppliedAmounts();
                            candidates = (this.filteredInvoices || []).filter(r => this.isAppliedInvoice(r) && r.isSelected);
                        }
                    } else {
                        candidates = (this.selectedInvoiceList || []).filter(r => this.isAppliedInvoice(r));
                        if (!candidates.length) candidates = (this.filteredInvoices || []).filter(r => r.isSelected && this.isAppliedInvoice(r));
                    }
                }
                return candidates.filter(r => this.isAppliedInvoice(r));
            },

            async findPaymentById(id) {
                if (!id) return null;
                let row = (this.paymentList || []).find(p => sameId(p.id, id));
                if (row) return row;
                await this.getPayments();
                row = (this.paymentList || []).find(p => sameId(p.id, id));
                return row || null;
            },
            resetPaymentFields() {
                this.paymentId = ''; this.loadedPaymentId = ''; this.selectedInvoiceList = [];
                this.filteredInvoices = []; this.invoiceList = []; this.invoiceTypeList = [];
                this.invoiceTypeId = ''; this.invoiceTypeName = ''; this.invoiceRate = '1.0000';
                this.amountToPay = '0'; this.outstandingCreditMemo = '0.00';
                this.batchNumber = ''; this.chequeNumber = ''; this.referenceNumber = '0';
                this.description = ''; this.isPosted = false;
            },
            apiErrorMessage(error, fallback) {
                const data = error && error.response && error.response.data;
                if (!data) return error && error.message ? `${fallback} (${error.message})` : fallback;
                if (typeof data === 'string') return `${fallback} ${data}`.trim();
                const abpError = data.error && (data.error.details || data.error.message);
                return abpError || data.message || data.detail || data.title || fallback;
            },
            sanitizePaymentPayload(payload) {
                PAYMENT_TEXT_FIELDS.forEach((key) => { if (key in payload) payload[key] = asText(payload[key]); });
                ['buyRate', 'sellRate', 'invoiceRate', 'amountToPay'].forEach((key) => { if (key in payload) payload[key] = asNumber(payload[key]); });
                ['paymentDate', 'date'].forEach((key) => { if (key in payload) payload[key] = loadedDate(payload[key]) || isoDate(new Date()); });
                if (Array.isArray(payload.invoiceList)) {
                    payload.invoiceList = payload.invoiceList.map((row) => {
                        const clean = {};
                        Object.entries(row || {}).forEach(([key, value]) => { if (!PAYMENT_ALLOCATION_DROP.includes(key)) clean[key] = value; });
                        ['supplierName', 'invoiceNumber', 'currencyName', 'batchNumber'].forEach((key) => { if (key in clean) clean[key] = asText(clean[key]); });
                        return clean;
                    });
                }
                return payload;
            },
            async createDebitMemo() {
                const supplier = this.getSupplierDetails(this.supplierId);
                const currency = this.getCurrencyDetails(this.currencyId);
                const department = this.getOuDetails(this.ouId);
                const bank = this.getBankDetails(this.bankId);
                const branch = this.getBankBranchDetails(this.bankBranchId);
                const invoices = Array.isArray(this.selectedInvoiceList) ? this.selectedInvoiceList : [];
                const invoice = invoices[0];
                if (!invoice) { this.toastHandler('warning', 'Please select an invoice for the credit memo.'); return false; }
                const supplierName = supplier?.name || this.supplierName;
                const accountNo = supplier?.accountNumber ?? this.accountNumber;
                const outstandingAmount = parseFloat(this.outstandingCreditMemo) || 0;
                const payload = {
                    supplierId: supplier?.id || this.supplierId,
                    supplierName: supplierName,
                    accountNo: asText(accountNo),
                    invoiceId: invoice.id || invoice.invoiceId,
                    invoiceNo: this.referenceNumber,
                    invoiceBalance: parseFloat(invoice.invoiceBalance ?? invoice.balance ?? invoice.amountDue) || 0,
                    invoiceCurrencyName: invoice.invoiceCurrencyName || invoice.currencyName || invoice.currencyCode || '',
                    invoiceBuyRate: parseFloat(invoice.invoiceBuyRate ?? invoice.buyRate) || 1,
                    amount: outstandingAmount,
                    transactionDate: loadedDate(this.paymentDate) || loadedDate(this.date) || isoDate(new Date()),
                    currencyId: currency?.id || this.currencyId,
                    currencyName: currency?.currencyName || this.currencyName,
                    currencyCode: currency?.currencyCode || '',
                    buyRate: parseFloat(this.buyRate) || 1,
                    sellRate: parseFloat(currency?.sellRate) || 1,
                    ouId: department?.id || this.ouId || this.emptyGuid,
                    ouName: department?.name || '',
                    debitGlId: this.emptyGuid,
                    debitName: '',
                    creditGlId: this.emptyGuid,
                    creditName: '',
                    bankId: bank?.id || this.emptyGuid,
                    bankName: bank?.name || '',
                    bankBranchId: branch?.id || this.emptyGuid,
                    bankBranch: branch?.name || '',
                    chequeNo: this.chequeNumber || '',
                    chequeDate: loadedDate(this.chequeDate) || '',
                    modeOfPayment: this.modeOfPayment || '',
                    description: `Memo from invoice payment - ref ${this.referenceNumber}`,
                    isInvoiceDebit: false,
                    batchNumber: this.batchNumber == null || this.batchNumber === '' ? '0' : asText(this.batchNumber)
                };
                const response = await axios.post(ENDPOINTS.createMemo, payload);
                this.toastHandler('', 'Debit Memo entry created successfully.');
                return response.data;
            },
            async savePayment() {
                if (this.isLoading) return;
                this.isLoading = true;
                try {
                    if (!this.isAutomatic) {
                        const needsRecalc = (this.filteredInvoices || []).some(r => r.isSelected && !this.isAppliedInvoice(r));
                        if (needsRecalc) this.calculateManualAppliedAmounts();
                    }
                    this.getSelectedInvoices();
                    this.calculateOutstandingCreditMemo();

                    if (!this.supplierId) { this.toastHandler('warning', 'Please select a supplier.'); return; }
                    if (!this.invoiceTypeId) { this.toastHandler('warning', 'Please select an invoice type.'); return; }
                    if ((parseFloat(this.amountToPay) || 0) === 0) { this.toastHandler('warning', 'Amount to pay cannot be zero.'); return; }

                    const payload = {};
                    payload.batchNumber = (this.batchNumber === null || this.batchNumber === '') ? '0' : this.batchNumber;
                    const supplierInfo = this.getSupplierDetails(this.supplierId);
                    if (supplierInfo) {
                        payload.supplierId = supplierInfo.id;
                        payload.supplierName = supplierInfo.name;
                        payload.accountNumber = asText(supplierInfo.accountNumber);
                    } else {
                        payload.supplierId = this.supplierId;
                        payload.supplierName = this.supplierName;
                        payload.accountNumber = asText(this.accountNumber);
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
                    const invoiceTypeInfo = this.getInvoiceTypeOption(this.invoiceTypeId) || this.getCurrencyDetails(this.invoiceTypeId);
                    payload.invoiceTypeId = invoiceTypeInfo ? invoiceTypeInfo.id : this.invoiceTypeId;
                    payload.invoiceTypeName = invoiceTypeInfo ? (invoiceTypeInfo.currencyName || invoiceTypeInfo.name) : this.invoiceTypeName;
                    payload.invoiceRate = parseFloat(this.invoiceRate) || 1;
                    if (this.ouId) {
                        const departmentInfo = this.getOuDetails(this.ouId);
                        if (departmentInfo) { payload.ouId = departmentInfo.id; payload.ouName = departmentInfo.name; }
                    }
                    const bankAccountInfo = (this.accounts || []).find(a => sameId(a.id, this.bankAccountId));
                    if (bankAccountInfo) {
                        payload.bankAccountId = bankAccountInfo.id;
                        payload.bankAccountName = `${asText(bankAccountInfo.accountNo)} - ${asText(bankAccountInfo.accountName)}`;
                        payload.bankAccountNumber = asText(bankAccountInfo.accountNo ?? bankAccountInfo.accountNumber);
                    } else {
                        payload.bankAccountId = this.emptyGuid || EMPTY_GUID;
                        payload.bankAccountName = 'Not Set';
                        payload.bankAccountNumber = 'Not Set';
                    }

                    // PATCH 5: ONLY push applied invoices
                    const toSave = this.getInvoicesToSave();
                    payload.invoiceList = toSave;
                    if (!payload.invoiceList.length) {
                        this.toastHandler('warning', 'No applied invoices to save. Check an invoice and click Apply.');
                    }

                    payload.amountToPay = parseFloat(this.amountToPay) || 0;
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

                    this.sanitizePaymentPayload(payload);

                    const outstandingAmount = parseFloat(this.outstandingCreditMemo) || 0;
                    if (outstandingAmount > 0) {
                        const result = await Swal.fire({
                            title: 'Outstanding Credit',
                            text: `There is an outstanding credit of ${outstandingAmount.toFixed(2)}. Would you like to create a debit memo entry?`,
                            icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, Create Entry', cancelButtonText: 'No, Continue',
                            confirmButtonColor: '#2563eb', cancelButtonColor: '#6b7280', reverseButtons: true
                        });
                        if (result.isConfirmed) await this.createDebitMemo();
                    }

                    if (this.paymentId) {
                        payload.id = this.paymentId;
                        const response = await axios.post(ENDPOINTS.updatePayment, payload);
                        const body = response.data || {};
                        const updatedId = body.id || body.paymentId || this.paymentId;
                        await this.getPayments();
                        const refreshed = (body.id || body.paymentId) ? body : await this.findPaymentById(updatedId);
                        if (refreshed) await this.setCurrentPayment(refreshed);
                        this.toastHandler('', 'Invoice Payment updated.');
                        return;
                    }
                    const response = await axios.post(ENDPOINTS.createPayment, payload);
                    const body = response.data.result || {};
                    const createdId = body.id || body.paymentId || (body.payment && body.payment.id);
                    await this.getPayments();
                    const created = createdId ? await this.findPaymentById(createdId) : null;
                    if (created) await this.setCurrentPayment(created);
                    else if (createdId) this.paymentId = createdId;
                    this.toastHandler('', 'Invoice Payment Created.');
                } catch (error) {
                    console.error('savePayment failed:', error && error.response ? error.response.data : error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Unable to save the payment.'));
                } finally { this.isLoading = false; }
            },
            async cancelSelectedPayments() {
                const grid = this.$refs.payments;
                const selected = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];
                if (!selected.length) { this.toastHandler('warning', 'Select one or more payments to cancel.'); return; }
                const result = await Swal.fire({
                    icon: 'warning', title: 'Confirm Cancellation',
                    text: `Are you sure you want to cancel ${selected.length} selected payments${selected.length === 1 ? '' : 's'}?`,
                    showCancelButton: true, confirmButtonText: 'Yes, cancel', cancelButtonText: 'No, go back',
                    confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b', reverseButtons: true
                });
                if (!result.isConfirmed) return;
                try {
                    const paymentIds = selected.map(payment => payment.id);
                    const res = await axios.post('/Ap/CancelPayments', paymentIds);
                    if (res.data && res.data.success === false) { this.toastHandler('error', res.data.message || 'Unable to cancel selected payments.'); return; }
                    if (grid.clearSelection) grid.clearSelection();
                    this.toastHandler('success', 'Canceled successfully.');
                    await this.getPayments();
                } catch (error) {
                    console.error('Payments cancellation failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to cancel payment(s).');
                }
            },
            async postSelectedPayments() {
                const grid = this.$refs.payments;
                const selected = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];
                if (!selected.length) { this.toastHandler('warning', 'Select one or more payments to post.'); return; }
                const paymentsToPost = selected.filter(invoice => invoice.isPosted !== true);
                const skippedCount = selected.length - paymentsToPost.length;
                if (!paymentsToPost.length) { this.toastHandler('info', 'All selected payments have already been posted.'); return; }
                const result = await Swal.fire({
                    icon: 'warning', title: 'Confirm Posting',
                    text: `Are you sure you want to post ${paymentsToPost.length} payments${paymentsToPost.length === 1 ? '' : 's'}?${skippedCount > 0 ? ` ${skippedCount} already-posted payment(s) will be skipped.` : ''}`,
                    showCancelButton: true, confirmButtonText: 'Yes, post', cancelButtonText: 'No, go back',
                    confirmButtonColor: '#392eef', cancelButtonColor: '#64748b', reverseButtons: true
                });
                if (!result.isConfirmed) return;
                try {
                    const paymentIds = paymentsToPost.map(payment => payment.id);
                    const res = await axios.post('/Ap/PostPayments', paymentIds);
                    if (res.data && res.data.success === false) { this.toastHandler('error', res.data.message || 'Unable to post selected payments.'); return; }
                    if (grid.clearSelection) grid.clearSelection();
                    this.toastHandler('success', skippedCount > 0 ? `Posted ${paymentsToPost.length} payment(s). Skipped ${skippedCount} already-posted payment(s).` : 'Posted successfully.');
                    await this.getPayments();
                } catch (error) { this.toastHandler('error', error.response?.data?.message || 'Failed to post payment(s).'); }
            },
            printReport() {
                if (!this.paymentId) { this.toastHandler("warning", "No payment selected for printing."); return; }
                const paymentId = this.paymentId;
                const reportUrl = `/Ap/PrintPaymentReceipt?id=${paymentId}`;
                const printWindow = window.open("", "_blank");
                printWindow.document.write(`<html><head><title>Loading Report...</title><style>body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background-color:#fff;font-family:Arial,sans-serif}.loader{border:10px solid #f3f3f3;border-top:10px solid #15aafa;border-radius:50%;width:60px;height:60px;animation:spin 1s linear infinite}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style></head><body><div class="loader"></div></body></html>`);
                printWindow.document.close();
                setTimeout(() => { printWindow.location.href = reportUrl; }, 800);
            },
            toastHandler(type, message = 'An unexpected error occurred.') {
                if (typeof Swal === 'undefined') { console.log(message); return; }
                Swal.fire({ toast: true, position: 'top-end', icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success', title: message, showConfirmButton: false, timer: 4000, timerProgressBar: true });
            },
            resetBankFields() { this.bankId = ''; this.bankName = ''; this.bankBranchId = ''; this.bankBranchName = ''; },
            getOuDetails(id) { return this.ouList.find(a => sameId(a.id, id)); },
            getBankDetails(id) { return this.banks.find(b => sameId(b.id, id)); },
            getBankBranchDetails(id) { return (this.bankBranchList || []).find(b => sameId(b.id, id)); }
        },
        watch: {
            paymentDate(val) { const iso = isoDate(val); if (iso && iso !== this.date) this.date = iso; },
            date(val) { const iso = isoDate(val); if (iso && iso !== this.paymentDate) this.paymentDate = iso; },
            supplierId(val) { if (!val || this.isSettingPayment) return; this.setCurrentSupplier(); this.getGridData(val); },
            currencyId(val) { if (this.isSettingPayment) return; if (this.isAutomatic) { this.getAutomaticPaymentInvoices(); this.calculateAndDisplayAppliedAmounts(); } },
            invoiceTypeId(val) { if (this.isSettingPayment) return; this.onInvoiceTypeChange(); },
            amountToPay(val) { if (this.isSettingPayment) return; if (this.isAutomatic) { this.getAutomaticPaymentInvoices(); this.calculateAndDisplayAppliedAmounts(); } },
            Manual(val) { if (this.isSettingPayment) return; this.isAutomatic = !val; this.Automatic = !val; this.updateFilteredInvoices(); },
            isAutomatic(val) {
                if (this.isSettingPayment) return;
                this.Automatic = val; this.Manual = !val; this.updateFilteredInvoices();
                if (val) { this.getAutomaticPaymentInvoices(); this.calculateAndDisplayAppliedAmounts(); }
            },
            invoiceId(val) { if (val && !this.isSettingPayment && typeof this.setCurrentInvoice === 'function') this.setCurrentInvoice(); },
            paymentId(val) { if (val && !this.isSettingPayment && val !== this.loadedPaymentId) this.setCurrentPayment(); }
        },
        async mounted() {
            this.isShimmerLoading = true;
            await this.loadLookups();
            await this.getApInvoices();
            await this.getPayments();
            this.getBusinessProfile();
            this.isShimmerLoading = false;
        }
    });
    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
