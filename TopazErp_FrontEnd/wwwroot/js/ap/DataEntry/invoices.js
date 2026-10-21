(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const api = axios.create({ baseURL: 'http://localhost:5300', withCredentials: true });
    const ENDPOINTS = {
        invoices: '/ApDataEntry/GetInvoices',
        suppliers: '/SharedResource/GetSuppliers',
        currencies: '/SharedResource/GetCurrencys',
        organizationalUnits: '/SharedResource/GetCostCenters/',
        accounts: '/LedgerDataEntry/InitJournalEntry',
        taxLevies: '/SharedResource/GetTaxLevies' 
    };

    const roundMoney = (value) => Math.round((Number.isFinite(Number(value)) ? Number(value) : 0) * 100) / 100;
    const toNumber = (value, fallback = 0) => {
        if (value === '' || value === null || value === undefined) return fallback;
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    };
    const asBoolean = (value) => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };
    const addDays = (dateString, days) => {
        const d = new Date(`${dateString}T12:00:00`);
        d.setDate(d.getDate() + days);
        return isoDate(d);
    };
    const createId = (prefix = 'id') => {
        const cryptoObject = globalThis.crypto;
        const value = cryptoObject && typeof cryptoObject.randomUUID === 'function'
            ? cryptoObject.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        return `${prefix}-${value}`;
    };
    const asList = (result) => (Array.isArray(result) ? result : (result && Array.isArray(result.items) ? result.items : []));

    // Normalizes .NET PascalCase -> camelCase once, so Id/InvoiceNumber still works
    const toCamel = s => s.charAt(0).toLowerCase() + s.slice(1);
    const normalizeKeys = obj => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        if (obj.id || obj.Id) { /* has id already */ }
        const out = {};
        for (const [k,v] of Object.entries(obj)) out[toCamel(k)] = v;
        return out;
    };

    // Generic unwrapper - handles all your endpoint shapes
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

    const today = isoDate(new Date());

    const app = Vue.createApp({
        data() {
            return {
                emptyGuid: EMPTY_GUID,
                theme: '#0645e7',
                theme1: '#545454',
                tenantId: null,
                accounts: [],
                suppliers: [],
                currencies: [],
                organizationalUnits: [],
                taxCatalog: [],
                taxLevyList: [],
                invoiceList: [],
                detailsList: [],
                isLoading: false,
                invoiceId: '',
                invoiceNumber: '',
                batchNumber: '',
                supplierId: '',
                supplierName: '',
                accountNumber: '',
                address: '',
                invoiceDate: today,
                projectedPayDate: addDays(today, 30),
                purchaseOrderNumber: '',
                voucherNumber: '',
                referenceNumber: '',
                description: '',
                currencyId: '',
                currencyName: '',
                currencyCode: '',
                minorName: '',
                buyRate: 1,
                sellRate: 1,
                isMultiCurrency: false,
                isVatWithheld: false,
                ouId: '',
                ouName: '',
                liabilityAccountId: EMPTY_GUID,
                liabilityAccountName: '',
                vatRate: 15,
                vatAmount: 0,
                isVatInclusive: false,
                computedTaxLevies: [],
                totalInvoiceAmount: 0,
                amount: 0,
                paidAmount: 0,
                invoiceBalance: 0,
                withHeldAmount: 0,
                status: 'Draft',
                isApproved: false,
                isPosted: false,
                isCanceled: false,
                isEditing: false,
                formMessage: '',
                formMessageType: 'info',
                isOu: false,
                vatGl: '',
                nhilGl: '',
                getflGl: '',
                cstGl: '',
                defaultGlSetup: null,
                debitAccountId:EMPTY_GUID,
               
            };
        },
        computed: {
            detailColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'invoiceId', label: 'Invoice ID', type: 'text', hidden: true, editable: false },
                    { key: 'taxId', label: 'Tax ID', type: 'text', hidden: true, editable: false },
                    { key: 'isTax', label: 'Tax row', type: 'boolean', hidden: true, editable: false },
                    { key: 'referenceNumber', label: 'Ref No.', type: 'text', searchable: true, width: 150 },
                    { key: 'description', label: 'Description', type: 'text', required: true, searchable: true, width: 220 },
                    { key: 'debitAccountId', label: 'Debit G/L Account', type: 'select', options: this.accounts, display: 'accountIdentifier', value: 'id', width: 220, defaultValue: this.debitAccountId },
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
                    { key: 'supplierId', label: 'Supplier', type: 'select', options: this.suppliers, value: 'id', display: 'name', width: 280, required: true, searchable: true },
                    { key: 'invoiceDate', label: 'Invoice Date', type: 'date', width: 130, searchable: true },
                    { key: 'projectedPayDate', label: 'Projected Pay Date', type: 'date', width: 160, searchable: true },
                    { key: 'currencyId', label: 'Currency', type: 'select', options: this.currencies, value: 'id', display: 'currencyName', width: 180, searchable: true },
                    { key: 'buyRate', label: 'Buy Rate', type: 'number', width: 110, decimals: 4 },
                    { key: 'totalInvoiceAmount', label: 'Invoice Total', type: 'number', width: 145, decimals: 2, agg: 'sum' },
                    { key: 'balance', label: 'Balance', type: 'number', width: 130, decimals: 2 },
                    { key: 'isApproved', label: 'Approved', type: 'boolean', width: 105 },
                    { key: 'isPosted', label: 'Posted', type: 'boolean', width: 100 }
                ];
            },
            invoiceDetailChild() {
                return { key: 'invoiceDetails', title: 'Invoice Details', columns: this.detailColumns };
            }
        },
        watch: {
            vatRate() { this.recalculateInvoice(); },
            isVatInclusive(value) {
                if (value) this.taxLevyList = this.taxLevyList.map((tax) => ({ ...tax, isApplied: false }));
                this.recalculateInvoice();
            }
        },
        methods: {
            isPosted(row) {
                return row.isPosted === true;
            },
            getTaxGlByName(name) {
                if (!name) return '';
                const n = String(name).trim().toLowerCase();
                if (n === 'vat') return this.vatGl || this.defaultGlSetup?.vatPaidAccountId || '';
                if (n === 'nhil') return this.nhilGl || this.defaultGlSetup?.nhilPaidAccountId || '';
                if (n === 'getfl') return this.getflGl || this.defaultGlSetup?.getflPaidAccountId || '';
                if (n === 'cst') return this.cstGl || this.defaultGlSetup?.cstPaidAccountId || this.defaultGlSetup?.vatPaidAccountId || '';
                return '';
            },
            applyTaxGlMapping() {
                if (!this.taxCatalog.length) return;
                let changed = false;
                this.taxCatalog = this.taxCatalog.map(tax => {
                    const gl = this.getTaxGlByName(tax.name);
                    if (gl && tax.accountId !== gl) { changed = true; return { ...tax, accountId: gl }; }
                    return tax;
                });
                if (changed) {
                    const appliedIds = new Set(this.taxLevyList.filter(t => t.isApplied).map(t => String(t.id)));
                    this.taxLevyList = this.taxCatalog.map(tax => ({
                        ...tax,
                        isApplied: appliedIds.has(String(tax.id))
                    }));
                    // if any levy is currently applied, recalc to fix debitAccountId on tax rows
                    if (appliedIds.size) this.recalculateInvoice();
                }
            },
            async getDefaultGlSetup() {
                try {
                    const response = await axios.get('http://localhost:5300/LedgerSetups/GetDefaultGlSetup', {withCredentials:true});
                    const d = response.data || {};
                    this.defaultGlSetup = d;
                    this.vatGl = d.vatPaidAccountId || '';
                    this.nhilGl = d.nhilPaidAccountId || '';
                    this.getflGl = d.getflPaidAccountId || '';
                    this.cstGl = d.cstPaidAccountId || d.vatPaidAccountId || '';

                    // liability default (don't overwrite if user already picked)
                    if (!this.liabilityAccountId || this.liabilityAccountId === EMPTY_GUID) {
                        this.liabilityAccountId = d.accountsPayableAccountId || EMPTY_GUID;
                    }
                    this.debitAccountId = d.accountsPayableAccountId || EMPTY_GUID;

                    this.applyTaxGlMapping();
                    return d;
                } catch(err) {
                    console.log(err);
                    this.toastHandler('error', 'Unable to get default GL numbers.');
                    return null;
                }
            },
            getBusinessProfile() {
                axios.get('http://localhost:5300/SharedResource/GetBusinessProfile', {withCredentials: true}).then(response => {
                    if (response.data) {
                        this.isVatInclusive = response.data.isTaxLeviesInclusive;
                        this.isOu = response.data.enforceOu;
                    }
                }).catch(err => {
                    console.log(err);
                });
            },
          
            scrollToAdd() {
                this.$nextTick(() => {
                    const element = document.getElementById('invoice-editor');
                    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            },
            setMessage(message, type = 'info') {
                this.formMessage = message;
                this.formMessageType = type;
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
            formatMoney(value) {
                return new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(toNumber(value));
            },

            // ---------- API loading - FIXED ----------
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
            async getApInvoices() {
                this.invoiceList = await this.fetchList(ENDPOINTS.invoices, 'AP invoices');
            },
            async loadLookups() {
                const [rawAccounts, rawSuppliers, rawCurrencies, rawUnits, rawTaxes] = await Promise.all([
                    this.fetchList(ENDPOINTS.accounts, 'accounts', 'accounts'),
                    this.fetchList(ENDPOINTS.suppliers, 'suppliers'),
                    this.fetchList(ENDPOINTS.currencies, 'currencies'),
                    this.fetchList(ENDPOINTS.organizationalUnits, 'organizational units'),
                    this.fetchList(ENDPOINTS.taxLevies, 'tax levies')
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

                // Currencies
                this.currencies = rawCurrencies.map(c => ({
                    ...c,
                    currencyName:  c.currencyName,
                    currencyCode: c.currencyCode,
                    buyRate: toNumber(c.buyRate, 1),
                    sellRate: toNumber(c.sellRate, 1)
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

                this.taxCatalog = rawTaxes.map((tax) => ({
                    ...tax,
                    type: String(tax.type || '').toLowerCase() === 'vat' || String(tax.name || '').toLowerCase() === 'vat' ? 'vat' : 'others',
                    rate: toNumber(tax.rate, 1),
                    accountId: this.getTaxGlByName(tax.name) || tax.accountId || '', // <-- key fix
                    isActive: tax.isActive !== false
                }));

                this.taxLevyList = this.freshTaxLevies();
                if (!this.isEditing) this.applyNewInvoiceDefaults();
                
                
            },
            freshTaxLevies() {
                return this.taxCatalog.map((tax) => ({ ...tax, isApplied: false }));
            },
            applyNewInvoiceDefaults() {
                const currency = this.currencies.find(c => c.isDefault) || this.currencies[0];
                if (currency) {
                    this.currencyId = currency.id;
                    this.currencyName = currency.currencyName;
                    this.currencyCode = currency.currencyCode;
                    this.minorName = currency.minorName;
                    this.buyRate = toNumber(currency.buyRate, 1);
                    this.sellRate = toNumber(currency.sellRate, 1);
                }
               
                this.ouId = EMPTY_GUID;
                this.ouName = '';
                this.liabilityAccountId = EMPTY_GUID;
                this.liabilityAccountName = '';
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
                this.minorName = currency.minorName;
                this.sellRate = parseFloat(currency.buyRate).toFixed(4);
                this.buyRate = toNumber(currency.buyRate, 1);

                this.isMultiCurrency = currency.isDefault !== true;
            },
            onOuChange() {
                const unit = this.organizationalUnits.find((item) => item.id === this.ouId);
                this.ouName = unit ? unit.name : '';
            },
            onLiabilityAccountChange() {
                const account = this.accounts.find((item) => item.id === this.liabilityAccountId);
                this.liabilityAccountName = account ? account.accountIdentifier : '';
            },
            nextInvoiceNumber() {
                const year = (this.invoiceDate || today).slice(0, 4);
                const prefix = `INV-${year}-`;
                const next = this.invoiceList.reduce((max, invoice) => {
                    if (!String(invoice.invoiceNumber || '').startsWith(prefix)) return max;
                    return Math.max(max, Number(String(invoice.invoiceNumber).slice(prefix.length)) || 0);
                }, 0) + 1;
                return `${prefix}${String(next).padStart(3, '0')}`;
            },
            lineSubtotal(detail) {
                const quantity = Math.max(0, toNumber(detail.quantity, 0));
                const unitPrice = Math.max(0, toNumber(detail.unitPrice, 0));
                const gross = quantity * unitPrice;
                const discount = Math.max(0, toNumber(detail.discount, 0));
                const discountAmount = asBoolean(detail.discountAsPercentage)
                    ? gross * Math.min(discount, 100) / 100
                    : Math.min(discount, gross);
                return { gross: roundMoney(gross), discountAmount: roundMoney(discountAmount), subtotal: roundMoney(gross - discountAmount) };
            },
            normalizeDetail(detail) {
                const row = { ...detail };
                const calculated = this.lineSubtotal(row);
                const account = this.accounts.find((item) => String(item.id) === String(row.debitAccountId));
                return {
                    ...row,
                    id: row.id || createId('det'),
                    invoiceId: this.invoiceId || '',
                    referenceNumber: row.referenceNumber || this.referenceNumber || this.invoiceNumber || '',
                    description: String(row.description || '').trim(),
                    debitAccountId: row.debitAccountId || '',
                    debitAccountName: account ? account.accountIdentifier : (row.debitAccountName || ''),
                    quantity: Math.max(0, toNumber(row.quantity, 1)),
                    unitPrice: Math.max(0, toNumber(row.unitPrice, 0)),
                    discountAsPercentage: asBoolean(row.discountAsPercentage),
                    discount: Math.max(0, toNumber(row.discount, 0)),
                    amount: calculated.discountAmount,
                    subTotal: calculated.subtotal,
                    isTax: false,
                    taxId: ''
                };
            },
            isTaxRow(detail) {
                return detail && (asBoolean(detail.isTax) || detail.lineType === 'tax' || Boolean(detail.taxId));
            },
            isLegacyTaxRow(detail) {
                if (this.isTaxRow(detail)) return true;
                const tax = this.taxCatalog.find((item) => String(item.name).toLowerCase() === String(detail.description || '').trim().toLowerCase());
                return !!(tax && tax.accountId && String(detail.debitAccountId || '') === String(tax.accountId));
            },
            toggleTaxLevy(taxId) {
                if (this.isVatInclusive) return;
                const selected = this.taxLevyList.find((tax) => String(tax.id) === String(taxId));
                if (!selected || selected.isActive === false) return;
                const nextState = !selected.isApplied;
                this.taxLevyList = this.taxLevyList.map((tax) => String(tax.id) === String(taxId)
                    ? { ...tax, isApplied: nextState }
                    : tax);
                this.recalculateInvoice();
            },

            recalculateInvoice() {
                const sourceRows = Array.isArray(this.detailsList) ? this.detailsList : [];
                const lineRows = sourceRows.filter((detail) => !this.isTaxRow(detail)).map((detail) => this.normalizeDetail(detail));
                const baseAmount = roundMoney(lineRows.reduce((sum, detail) => sum + toNumber(detail.subTotal), 0));
                const taxRows = [];
                const taxSummary = [];

                if (!this.isVatInclusive) {
                    this.taxLevyList.filter((tax) => tax.isApplied && tax.isActive !== false).forEach((tax) => {
                        const rate = tax.type === 'vat' ? Math.max(0, toNumber(this.vatRate, tax.rate)) : Math.max(0, toNumber(tax.rate));
                        const taxAmount = roundMoney(baseAmount * rate / 100);
                        const account = this.accounts.find((item) => String(item.id) === String(tax.accountId));
                        const row = {
                            id: `tax-${tax.id}`,
                            invoiceId: this.invoiceId || '',
                            taxId: tax.id,
                            isTax: true,
                            lineType: 'tax',
                            referenceNumber: this.referenceNumber || this.invoiceNumber || '',
                            description: tax.name,
                            debitAccountId: tax.accountId || '',
                            debitAccountName: account ? account.accountIdentifier : '',
                            quantity: 1,
                            unitPrice: taxAmount,
                            discountAsPercentage: false,
                            discount: 0,
                            amount: 0,
                            subTotal: taxAmount
                        };
                        taxRows.push(row);
                        taxSummary.push({ id: tax.id, name: tax.name, rate, isApplied: true, amount: taxAmount });
                    });
                }

                this.detailsList = lineRows.concat(taxRows);
                this.computedTaxLevies = taxSummary;
                const vat = taxSummary.find((tax) => tax.name.toLowerCase() === 'vat');
                this.vatAmount = vat ? vat.amount : 0;
                this.totalInvoiceAmount = roundMoney(baseAmount + taxRows.reduce((sum, row) => sum + toNumber(row.subTotal), 0));
                this.amount = this.totalInvoiceAmount;
                const paid = Math.max(0, toNumber(this.paidAmount));
                this.invoiceBalance = roundMoney(Math.max(0, this.totalInvoiceAmount - paid));
                return this.totalInvoiceAmount;
            },
            computeTotalTaxAmount() {
                return this.recalculateInvoice();
            },
            onCreateDetail(event) {
                if (!event || !event.row) return;
                Object.assign(event.row, this.normalizeDetail(event.row));
                this.recalculateInvoice();
            },
            onUpdateDetail(event) {
                if (!event || !event.row) return;
                if (!this.isTaxRow(event.row)) Object.assign(event.row, this.normalizeDetail(event.row));
                this.recalculateInvoice();
            },
            onDeleteDetail(event) {
                const deleted = Array.isArray(event && event.rows) ? event.rows : [];
                const deletedTaxIds = new Set(deleted.filter((row) => this.isTaxRow(row)).map((row) => String(row.taxId || '')));
                if (deletedTaxIds.size) {
                    this.taxLevyList = this.taxLevyList.map((tax) => deletedTaxIds.has(String(tax.id)) ? { ...tax, isApplied: false } : tax);
                }
                this.recalculateInvoice();
            },
            createNewInvoice() {
                this.invoiceId = ''; this.invoiceNumber = ''; this.batchNumber = '';
                this.supplierId = ''; this.supplierName = ''; this.accountNumber = ''; this.address = '';
                this.invoiceDate = isoDate(new Date());
                this.projectedPayDate = addDays(this.invoiceDate, 30);
                this.purchaseOrderNumber = ''; this.voucherNumber = ''; this.referenceNumber = ''; this.description = '';
                this.isMultiCurrency = false; this.isVatWithheld = false;
                this.applyNewInvoiceDefaults();
                this.vatRate = 15; this.vatAmount = 0; this.isVatInclusive = false;
                this.taxLevyList = this.freshTaxLevies(); this.computedTaxLevies = []; this.detailsList = [];
                this.totalInvoiceAmount = 0; this.amount = 0; this.paidAmount = 0; this.invoiceBalance = 0; this.withHeldAmount = 0;
                 this.isEditing = false;
                if (this.$refs.invoices && this.$refs.invoices.clearSelection) this.$refs.invoices.clearSelection();
                this.scrollToAdd();
            },
            getSelectedInvoice() {
                const grid = this.$refs.invoices;
                if (!grid || typeof grid.selectedRows !== 'function') return null;
                return grid.selectedRows()[0] || null;
            },
            setCurrentInvoice() {
                const grid = this.$refs.invoices;
                if (!grid || typeof grid.selectedRows !== 'function') {
                    this.setMessage('The invoices grid is not ready.', 'error'); return;
                }
                const selectedRows = grid.selectedRows();
                if (selectedRows.length !== 1) {
                    this.toastHandler('warning', 'Select one invoice to edit.'); return;
                }
                this.loadInvoice(selectedRows[0]);
                this.scrollToAdd();
            },
            loadInvoice(invoice) {
                if (!invoice) return;
                this.isEditing = true;
                this.invoiceId = invoice.id || ''; this.invoiceNumber = invoice.invoiceNumber || ''; this.batchNumber = invoice.batchNumber || '';
                this.supplierId = invoice.supplierId || ''; this.supplierName = invoice.supplierName || '';
                this.accountNumber = invoice.accountNumber || ''; this.address = invoice.address || '';
                this.invoiceDate = isoDate(invoice.invoiceDate) || today;
                this.projectedPayDate = isoDate(invoice.projectedPayDate) || this.invoiceDate;
                this.purchaseOrderNumber = invoice.purchaseOrderNumber || ''; this.voucherNumber = invoice.voucherNumber || '';
                this.referenceNumber = invoice.referenceNumber || ''; this.description = invoice.description || '';
                this.currencyId = invoice.currencyId || (this.currencies[0] ? this.currencies[0].id : '');
                const currency = this.currencies.find((item) => item.id === this.currencyId);
                this.currencyName = invoice.currencyName || (currency && (currency.currencyName || currency.name)) || '';
                this.currencyCode = invoice.currencyCode || (currency && (currency.currencyCode || currency.code)) || '';
                this.minorName = invoice.minorName || (currency && currency.minorName) || '';
                this.buyRate = toNumber(invoice.buyRate, currency ? currency.buyRate : 1);
                this.sellRate = toNumber(invoice.sellRate, currency ? currency.sellRate : 1);
                this.isMultiCurrency = asBoolean(invoice.isMultiCurrency);
                this.isVatWithheld = asBoolean(invoice.isVatWithheld);
                this.ouId = invoice.ouId || ''; this.ouName = invoice.ouName || '';
                this.liabilityAccountId = invoice.liabilityAccountId || EMPTY_GUID;
                this.liabilityAccountName = invoice.liabilityAccountName || '';
                this.vatRate = toNumber(invoice.vatRate, 15);
                this.isVatInclusive = asBoolean(invoice.isVatInclusive);
                this.paidAmount = toNumber(invoice.paidAmount);
                this.withHeldAmount = toNumber(invoice.withHeldAmount);
                this.status = invoice.status || 'Pending';
                this.isApproved = asBoolean(invoice.isApproved);
                this.isPosted = asBoolean(invoice.isPosted);
                this.isCanceled = asBoolean(invoice.isCanceled);
                this.onSupplierChange();
                if (invoice.supplierName) this.supplierName = invoice.supplierName;
                if (invoice.accountNumber) this.accountNumber = invoice.accountNumber;
                this.taxLevyList = this.freshTaxLevies();
                const savedTaxes = Array.isArray(invoice.invoiceTaxLevies) ? invoice.invoiceTaxLevies : [];
                const sourceDetails = Array.isArray(invoice.invoiceDetails) ? invoice.invoiceDetails : [];
                const legacyTaxDetails = sourceDetails.filter((detail) => this.isLegacyTaxRow(detail));
                const savedTaxKeys = new Set(savedTaxes.flatMap((tax) => [tax.id, tax.taxId, tax.name].filter(Boolean).map((value) => String(value).toLowerCase())));
                const inferredTaxIds = new Set(legacyTaxDetails.map((detail) => {
                    const tax = this.taxCatalog.find((item) => item.id === detail.taxId || String(item.name).toLowerCase() === String(detail.description || '').toLowerCase());
                    return tax ? tax.id : '';
                }).filter(Boolean));
                this.taxLevyList = this.taxLevyList.map((tax) => ({
                    ...tax,
                    isApplied: !this.isVatInclusive && (savedTaxKeys.has(String(tax.id).toLowerCase()) || savedTaxKeys.has(String(tax.name).toLowerCase()) || inferredTaxIds.has(tax.id))
                }));
                this.detailsList = sourceDetails.filter((detail) => !this.isLegacyTaxRow(detail)).map((detail) => ({ ...detail, isTax: false, taxId: '' }));
                this.recalculateInvoice();
                this.setMessage(`Editing ${this.invoiceNumber || 'selected invoice'}.`, 'info');
            },
            saveInvoice() {
                this.setMessage('', 'info');
                if (!this.supplierId) { this.setMessage('Choose a supplier before saving.', 'error'); this.scrollToAdd(); return; }
                if (!this.currencyId) { this.setMessage('Choose a currency before saving.', 'error'); this.scrollToAdd(); return; }
                const lineRows = this.detailsList.filter((detail) => !this.isTaxRow(detail));
                if (!lineRows.length) { this.setMessage('Add at least one invoice detail row before saving.', 'error'); this.scrollToAdd(); return; }
                let hasZeroQuantity = this.detailsList.some(detail => !detail.quantity && detail.quantity !== null);
                if (hasZeroQuantity) {
                    this.toastHandler('warning', 'One or more items have quantity 0. Please correct before saving.');
                    this.isLoading = false;
                    return;
                }

                let hasZeroUnitPrice = this.detailsList.some(detail => !detail.unitPrice && detail.unitPrice !== null);
                if (hasZeroUnitPrice) {
                    this.toastHandler('warning', 'One or more items have unit price 0. Please correct before saving.');
                    this.isLoading = false;
                    return;
                }

                let noDescription = this.detailsList.some(detail => !detail.description || detail.description.trim() === '');
                if (noDescription) {
                    this.toastHandler('warning', 'One or more items have no description. Please correct before saving.');
                    this.isLoading = false;
                    return;
                }
                this.recalculateInvoice();
                const supplier = this.suppliers.find((item) => item.id === this.supplierId);
                const currency = this.currencies.find((item) => item.id === this.currencyId);
                const ou = this.organizationalUnits.find((item) => item.id === this.ouId);
                const liability = this.accounts.find((item) => item.id === this.liabilityAccountId);
                const invoiceNumber = this.invoiceNumber || this.nextInvoiceNumber();
                const invoiceId = this.invoiceId || createId('inv');
                const batchNumber = this.batchNumber || `BATCH-${invoiceNumber.split('-').pop()}`;
                this.detailsList = this.detailsList.map((detail) => ({ ...detail, invoiceId, referenceNumber: detail.referenceNumber || this.referenceNumber || invoiceNumber }));
                const invoice = {
                    id: invoiceId, tenantId: this.tenantId, invoiceNumber, batchNumber,
                    supplierId: this.supplierId, supplierName: supplier ? supplier.name : this.supplierName,
                    accountNumber: supplier ? supplier.accountNumber || '' : this.accountNumber,
                    address: supplier ? supplier.address || '' : this.address,
                    invoiceDate: this.invoiceDate, projectedPayDate: this.projectedPayDate,
                    purchaseOrderNumber: this.purchaseOrderNumber, voucherNumber: this.voucherNumber,
                    referenceNumber: this.referenceNumber || invoiceNumber, description: this.description,
                    currencyId: this.currencyId, currencyName: currency ? (currency.currencyName || currency.name) : this.currencyName,
                    currencyCode: currency ? (currency.currencyCode || currency.code) : this.currencyCode,
                    minorName: currency ? currency.minorName : this.minorName,
                    buyRate: toNumber(this.buyRate, 1), sellRate: toNumber(this.sellRate, 1),
                    amount: this.totalInvoiceAmount, totalInvoiceAmount: this.totalInvoiceAmount,
                    paidAmount: Math.max(0, toNumber(this.paidAmount)), balance: this.invoiceBalance,
                    vatRate: toNumber(this.vatRate, 0), vatAmount: this.vatAmount, withHeldAmount: Math.max(0, toNumber(this.withHeldAmount)),
                    isVatWithheld: this.isVatWithheld, accountingPeriod: this.invoiceDate ? this.invoiceDate.slice(0, 7) : '',
                    ouId: this.ouId, ouName: ou ? ou.name : this.ouName,
                    liabilityAccountId: this.liabilityAccountId, liabilityAccountName: liability ? liability.accountIdentifier : this.liabilityAccountName,
                    isMultiCurrency: this.isMultiCurrency, isVatInclusive: this.isVatInclusive,
                    invoiceTaxLevies: this.computedTaxLevies.map((tax) => ({ id: tax.id, name: tax.name, rate: tax.rate, amount: tax.amount })),
                    invoiceDetails: this.detailsList.map((detail) => ({ ...detail, invoiceId }))
                };
                const index = this.invoiceList.findIndex((item) => String(item.id) === String(invoice.id));
                if (index >= 0) this.invoiceList.splice(index, 1, invoice); else this.invoiceList.unshift(invoice);
                 if (this.isEditing === true)
                 {
                     invoice.id = this.invoiceId;
                     invoice.tenantId = this.tenantId;
                     axios.post('http://localhost:5300/ApDataEntry/UpdateInvoice', invoice)
                         .then(async response => {
                             this.toastHandler('', 'Invoice updated.');
                             this.isLoading = false;
                         })
                         .catch(err => {
                             this.toastHandler('error', 'Unable to update invoice.');
                             this.isLoading = false;
                         });
     
                 }else{
                axios.post('http://localhost:5300/ApDataEntry/CreateInvoice', invoice,
                   )
                    .then(async response => {
                        if (response.data.code === 200) {
                            this.toastHandler('', 'Invoice saved.');
                            this.isLoading = false;
                        } else {
                            this.toastHandler('error', response.data.message);
                            this.isLoading = false;
                        }
                    })
                    .catch(err => {
                        this.isLoading = false;
                        this.toastHandler('error', 'Unable to save invoice.');
                      
                    });
}
            },
         
            async cancelSelectedInvoices() {
    const grid = this.$refs.invoices;
    const selected = grid && typeof grid.selectedRows === 'function'
        ? grid.selectedRows()
        : [];

    if (!selected.length) {
        this.toastHandler('warning', 'Select one or more invoices to cancel.');
        return;
    }

    // Validate invoice balances before allowing cancellation.
    const invalidInvoices = selected.filter(invoice => {
        const balance = Number(invoice.balance ?? 0);
        const total = Number(invoice.totalInvoiceAmount ?? 0);

        // Compare monetary values to two decimal places.
        return !Number.isFinite(balance) ||
               !Number.isFinite(total) ||
               Math.round(balance * 100) !== Math.round(total * 100);
    });

    if (invalidInvoices.length > 0) {
        const invoiceNumbers = invalidInvoices
            .map(invoice => {
                const number = invoice.invoiceNumber || invoice.id || 'Unknown invoice';
                const balance = this.formatMoney(invoice.balance);
                const total = this.formatMoney(invoice.totalInvoiceAmount);

                return `<li style="margin-bottom:8px;text-align:left;">
            <strong>${number}</strong><br>
        Total: ${total} | Balance: ${balance}
    </li>`;
            })
            .join('');

        await Swal.fire({
            icon: 'error',
            title: 'Cancellation Not Allowed',
            html: `
    <p style="margin-bottom:12px;">
        The following invoices cannot be canceled.
</p>
    <ul style="padding-left:20px;max-height:250px;overflow-y:auto;">
        ${invoiceNumbers}
    </ul>
    <p style="margin-top:12px;">
        Resolve the outstanding payments or invoice discrepancies first.
    </p>
        `,
            confirmButtonText: 'Understood',
            confirmButtonColor: '#dc2626'
        });

        return;
    }

    // Ask for confirmation before calling the backend.
    const result = await Swal.fire({
        icon: 'warning',
        title: 'Confirm Cancellation',
        text: `Are you sure you want to cancel ${selected.length} selected invoice${selected.length === 1 ? '' : 's'}?`,
        showCancelButton: true,
        confirmButtonText: 'Yes, cancel',
        cancelButtonText: 'No, go back',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
        const invoiceIds = selected.map(invoice => invoice.id);

        const res = await axios.post('http://localhost:5300/ApDataEntry/CancelInvoices', {
            invoiceIds
        });

        if (res.data && res.data.success === false) {
            this.toastHandler(
                'error',
                res.data.message || 'Unable to cancel selected invoices.'
            );
            return;
        }

        if (grid.clearSelection) {
            grid.clearSelection();
        }

        this.toastHandler('success', 'Canceled successfully.');

        await this.getApInvoices();
    } catch (error) {
        console.error('Invoice cancellation failed:', error);

        this.toastHandler(
            'error',
            error.response?.data?.message || 'Failed to cancel invoice(s).'
        );
    }
},
            async approveInvoices() {
                const grid = this.$refs.invoices;
                const selected = grid && typeof grid.selectedRows === 'function'
                    ? grid.selectedRows()
                    : [];

                if (!selected.length) {
                    this.toastHandler('warning', 'Select one or more invoices to approve.');
                    return;
                }

                // Skip invoices that have already been approved.
                const invoicesToApprove = selected.filter(invoice =>
                    invoice.isAproved !== true
                );

                const skippedCount = selected.length - invoicesToApprove.length;

                if (!invoicesToApprove.length) {
                    this.toastHandler('info', 'All selected invoices have already been approved.');
                    return;
                }

                try {
                    const invoiceIds = invoicesToApprove.map(invoice => invoice.id);

                    const res = await axios.post(
                        'http://localhost:5300/ApDataEntry/InvoiceApproval',
                        { invoiceIds }
                    );

                    if (res.data && res.data.success === false) {
                        this.toastHandler(
                            'error',
                            res.data.message || 'Unable to approve selected invoices.'
                        );
                        return;
                    }

                    if (grid.clearSelection) {
                        grid.clearSelection();
                    }

                    const message = skippedCount > 0
                        ? `Approved ${invoicesToApprove.length} invoice(s). Skipped ${skippedCount} already-approved invoice(s).`
                        : 'Approved successfully.';

                    this.toastHandler('success', message);

                    await this.getApInvoices();
                } catch (error) {
                    console.error('Invoice approval failed:', error);

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Failed to approve invoice(s).'
                    );
                }
            },
            async postSelectedInvoices() {
                const grid = this.$refs.invoices;
                const selected = grid && typeof grid.selectedRows === 'function'
                    ? grid.selectedRows()
                    : [];

                if (!selected.length) {
                    this.toastHandler('warning', 'Select one or more invoices to post.');
                    return;
                }

                // Skip invoices that have already been posted.
                const invoicesToPost = selected.filter(invoice =>
                    invoice.isPosted !== true
                );

                const skippedCount = selected.length - invoicesToPost.length;

                if (!invoicesToPost.length) {
                    this.toastHandler('info', 'All selected invoices have already been posted.');
                    return;
                }

                // Confirm before posting.
                const result = await Swal.fire({
                    icon: 'warning',
                    title: 'Confirm Posting',
                    text: `Are you sure you want to post ${invoicesToPost.length} invoice${invoicesToPost.length === 1 ? '' : 's'}?${skippedCount > 0 ? ` ${skippedCount} already-posted invoice(s) will be skipped.` : ''}`,
                    showCancelButton: true,
                    confirmButtonText: 'Yes, post',
                    cancelButtonText: 'No, go back',
                    confirmButtonColor: '#4f46e5',
                    cancelButtonColor: '#64748b',
                    reverseButtons: true
                });

                if (!result.isConfirmed) return;

                try {
                    const invoiceIds = invoicesToPost.map(invoice => invoice.id);

                    const res = await axios.post(
                        'http://localhost:5300/ApDataEntry/InitPostInvoice/',
                        { invoiceIds }
                    );

                    if (res.data && res.data.success === false) {
                        this.toastHandler(
                            'error',
                            res.data.message || 'Unable to post selected invoices.'
                        );
                        return;
                    }

                    if (grid.clearSelection) {
                        grid.clearSelection();
                    }

                    this.toastHandler(
                        'success',
                        skippedCount > 0
                            ? `Posted ${invoicesToPost.length} invoice(s). Skipped ${skippedCount} already-posted invoice(s).`
                            : 'Posted successfully.'
                    );

                    await this.getApInvoices();
                } catch (error) {
                    console.error('Invoice posting failed:', error);

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Failed to post invoice(s).'
                    );
                }
            },
        },
        async mounted() {
            this.isLoading = true;
            await this.loadLookups();
            this.getBusinessProfile();
            this.getDefaultGlSetup();
            await this.getApInvoices();
            this.recalculateInvoice();
            this.isLoading = false;
        }
    });

    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
