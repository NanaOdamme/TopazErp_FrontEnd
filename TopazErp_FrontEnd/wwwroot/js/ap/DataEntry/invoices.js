(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const ENDPOINTS = {
        invoices: '/Ap/GetInvoices',
        suppliers: '/SharedResource/GetSuppliers',
        currencies: '/SharedResource/GetCurrencies',
        organizationalUnits: '/SharedResource/GetCostCenters/',
        accounts: '/Ap/InitJournalEntry',
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
    const asList = (result) => (Array.isArray(result) ? result : (result && Array.isArray(result.items) ? result.items : []));

    // Normalizes .NET PascalCase -> camelCase once, so Id/InvoiceNumber still works
    const toCamel = s => s.charAt(0).toLowerCase() + s.slice(1);
    const normalizeKeys = obj => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        if (obj.id || obj.Id) { /* has id already */ }
        const out = {};
        for (const [k, v] of Object.entries(obj)) out[toCamel(k)] = v;
        return out;
    };

    // FIX #1: recursive PascalCase normalizer for NESTED objects (invoiceDetails,
    // invoiceTaxLevies, ...). Before, only the top-level invoice row was normalized,
    // so nested rows could still expose IsTax / TaxId / ReferenceNumber and every
    // tax-row detection below silently failed.
    const deepNormalize = (value, depth = 0) => {
        if (!value || typeof value !== 'object' || depth > 6) return value;
        if (Array.isArray(value)) return value.map(v => deepNormalize(v, depth + 1));
        const out = {};
        for (const [k, v] of Object.entries(value)) out[toCamel(k)] = deepNormalize(v, depth + 1);
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

    // FIX #2: helpers used to recognise a persisted tax line, whatever shape the API returns.
    const isBlankGuid = (value) => {
        const s = String(value ?? '').trim();
        return !s || s === EMPTY_GUID || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(s);
    };
    // "NHIL", "NHIL 2.5%", "nhil (2.5)" -> "nhil"  |  "GETFund" -> "getfund"
    const taxNameKey = (value) => String(value ?? '').toLowerCase().replace(/[^a-z]/g, '');
    // FIX #7: the API deserializes detail ids as System.Guid, so anything that is not a
    // real GUID ("det-...", "tax-...", "d1", "") makes the whole POST fail with
    // "The JSON value could not be converted to System.Guid. Path: $.invoiceDetails[i].id".
    const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isGuid = (value) => typeof value === 'string' && GUID_PATTERN.test(value.trim());

    const today = isoDate(new Date());

    const app = Vue.createApp({
        data() {
            return {
                emptyGuid: EMPTY_GUID,
                theme: '#ff2056',
                theme1: '#0645e7',
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
                debitAccountId: EMPTY_GUID,
                // FIX #7b: keeps one stable GUID per levy row, so a regenerated tax row
                // reuses the id the DB already knows instead of a new one on every recalc.
                taxRowIdMap: {},

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
                    { key: 'isPosted', label: 'Posted', type: 'boolean', width: 100, disabled: true },
                ];
            },
            invoiceDetailChild() {
                return { key: 'invoiceDetails', title: 'Invoice Details', columns: this.detailColumns };
            }
        },
        watch: {
            vatRate() { this.recalculateInvoice(); },
            isVatInclusive(value) {
                // FIX #3: never wipe the applied flags while an existing invoice is being
                // edited - the saved flags are re-derived in loadInvoice().
                if (value && !this.isEditing) this.taxLevyList = this.taxLevyList.map((tax) => ({ ...tax, isApplied: false }));
                this.recalculateInvoice();
            }
        },
        methods: {
            uuid() {
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                );
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
                    const response = await axios.get('/Ap/GetDefaultGlSetup');
                    // ABP wraps the payload in { result: ... }; fall back to the raw body.
                    const d = (response.data && response.data.result) || response.data || {};
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
                } catch (err) {
                    console.log(err);
                    this.toastHandler('error', 'Unable to get default GL numbers.');
                    return null;
                }
            },
            getBusinessProfile() {
                axios.get('/SharedResource/GetBusinessProfile').then(response => {
                    if (response.data) {
                        // FIX #3b: don't let a late profile response overwrite the values of
                        // the invoice the user already opened for editing.
                        if (!this.isEditing) this.isVatInclusive = response.data.isTaxLeviesInclusive;
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
                    const response = await axios.get(url);
                    // Handle: raw array, {result: [...]}, {accounts:[...]}, {items:[...]}
                    const list = unwrapList(response.data, preferredKey);
                    // FIX #1: deep-normalize so nested invoiceDetails / invoiceTaxLevies
                    // rows also come back as camelCase.
                    return list.map(item => deepNormalize((item && item.Id && !item.id) ? normalizeKeys(item) : item));
                } catch (error) {
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },
            async getApInvoices() {
                const invoiceList = await this.fetchList(ENDPOINTS.invoices, 'AP invoices');
                this.invoiceList = invoiceList.filter(i => !i.isCanceled);
                return this.invoiceList;
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
                    currencyName: c.currencyName,
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
                    .sort((a, b) => a.name.localeCompare(b.name));

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
            // Reference number of the FIRST line row currently in the details table.
            // Every tax levy row copies this, so the levies always carry the same
            // "Ref No." as the line they were calculated from.
            firstDetailReference() {
                const rows = Array.isArray(this.detailsList) ? this.detailsList : [];
                for (const row of rows) {
                    if (!row || this.isLegacyTaxRow(row)) continue;
                    const ref = String(row.referenceNumber ?? '').trim();
                    if (ref) return ref;
                }
                return '';
            },
            // Tax rows / new lines: first row's reference -> invoice reference -> invoice number.
            resolveInvoiceReference(fallbackRows) {
                const rows = Array.isArray(fallbackRows) ? fallbackRows : [];
                for (const row of rows) {
                    if (!row || this.isLegacyTaxRow(row)) continue;
                    const ref = String(row.referenceNumber ?? '').trim();
                    if (ref) return ref;
                }
                return this.firstDetailReference() || this.referenceNumber || this.invoiceNumber || '';
            },
            normalizeDetail(detail) {
                const row = { ...detail };
                const calculated = this.lineSubtotal(row);
                const account = this.accounts.find((item) => String(item.id) === String(row.debitAccountId));
                return {
                    ...row,
                    // FIX #7: never keep a non-GUID id on a detail row - the API validates
                    // System.Guid and rejects the entire invoice otherwise.
                    id: isGuid(row.id) ? row.id.trim() : this.uuid(),
                    // NOTE: ApInvoiceDetail has no InvoiceId - the child rows are owned
                    // by the aggregate, so nothing invoice-scoped belongs on the row.
                    referenceNumber: String(row.referenceNumber ?? '').trim() || this.firstDetailReference() || this.referenceNumber || this.invoiceNumber || '',
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

            // ================= TAX-ROW DETECTION (the actual bug) =================
            // A row is a tax row if ANY of these is true. Before we only looked at
            // `isTax` / `lineType` / `taxId`, which the API can drop, so saved tax
            // rows survived the filter and recalculateInvoice() appended a fresh set
            // -> duplicated levies, the copies carrying the invoice number as their
            // reference number (see recalculateInvoice below).
            isTaxRow(detail) {
                if (!detail) return false;
                if (asBoolean(detail.isTax)) return true;
                if (String(detail.lineType || '').toLowerCase() === 'tax') return true;
                if (!isBlankGuid(detail.taxId)) return true;
                if (/^tax-/.test(String(detail.id || ''))) return true; // legacy client-side ids
                return false;
            },
            findTaxByName(name) {
                const key = taxNameKey(name);
                if (!key) return null;
                return this.taxCatalog.find(t => taxNameKey(t.name) === key) || null;
            },
            isLegacyTaxRow(detail) {
                if (this.isTaxRow(detail)) return true;
                // Fallback for backends that don't persist isTax / lineType / taxId:
                // match the description against the levy catalogue, ignoring case,
                // percentages and punctuation ("NHIL 2.5%" === "NHIL" === "nhil").
                // The row's amount/account are regenerated from the levy anyway.
                return !!this.findTaxByName(detail && detail.description);
            },
            // Split a persisted detail collection into plain lines + tax lines.
            // `extraNameKeys` lets the caller supply levy names from InvoiceTaxLevies,
            // because ApInvoiceDetail has no IsTax/TaxId column of its own.
            splitTaxRows(details, extraNameKeys) {
                const extra = extraNameKeys instanceof Set ? extraNameKeys : new Set();
                const lines = [];
                const taxRows = [];
                (Array.isArray(details) ? details : []).forEach((detail) => {
                    const key = taxNameKey(detail && detail.description);
                    if (this.isLegacyTaxRow(detail) || (key && extra.has(key))) taxRows.push(detail);
                    else lines.push(detail);
                });
                return { lines, taxRows };
            },
            // Keep only ONE row per taxId, so a duplicated payload can never be saved again.
            dedupeTaxRows(details) {
                const seen = new Set();
                return (Array.isArray(details) ? details : []).filter((detail) => {
                    if (!this.isTaxRow(detail) && !this.isLegacyTaxRow(detail)) return true;
                    const key = !isBlankGuid(detail.taxId)
                        ? `id:${String(detail.taxId)}`
                        : `name:${taxNameKey(detail.description)}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            },
            // FIX #7b: one STABLE GUID per levy row (not "tax-<guid>").
            resolveTaxRowId(tax) {
                const key = String(tax?.id ?? tax?.name ?? '');
                const saved = this.taxRowIdMap[key];
                if (isGuid(saved)) return saved;
                if (!this.taxRowIdMap[key]) {
                    this.taxRowIdMap = { ...this.taxRowIdMap, [key]: this.uuid() };
                }
                return this.taxRowIdMap[key];
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
                // FIX #4: use the hardened detector here too, and de-duplicate first.
                const cleanRows = this.dedupeTaxRows(sourceRows);
                const lineRows = cleanRows
                    .filter((detail) => !this.isLegacyTaxRow(detail))
                    .map((detail) => this.normalizeDetail(detail));
                const baseAmount = roundMoney(lineRows.reduce((sum, detail) => sum + toNumber(detail.subTotal), 0));
                const taxRows = [];
                const taxSummary = [];
                // FIX #6: when the details table already has rows, every tax levy row inherits
                // the FIRST row's reference number (only when the table is empty does it fall
                // back to the invoice reference / invoice number).
                const taxReference = this.resolveInvoiceReference(lineRows);

                if (!this.isVatInclusive) {
                    const appliedTaxes = this.taxLevyList.filter((tax) => tax.isApplied && tax.isActive !== false);
                    const seenTaxIds = new Set();
                    appliedTaxes.forEach((tax) => {
                        const taxKey = String(tax.id ?? tax.name);
                        if (seenTaxIds.has(taxKey)) return; // never emit the same levy twice
                        seenTaxIds.add(taxKey);

                        const rate = tax.type === 'vat' ? Math.max(0, toNumber(this.vatRate, tax.rate)) : Math.max(0, toNumber(tax.rate));
                        const taxAmount = roundMoney(baseAmount * rate / 100);
                        const account = this.accounts.find((item) => String(item.id) === String(tax.accountId));
                        const row = {
                            id: this.resolveTaxRowId(tax), // FIX #7: real GUID, stable across recalcs
                            taxId: tax.id,
                            isTax: true,
                            lineType: 'tax',
                            referenceNumber: taxReference,
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
                if (!this.isLegacyTaxRow(event.row)) Object.assign(event.row, this.normalizeDetail(event.row));
                this.recalculateInvoice();
            },
            onDeleteDetail(event) {
                const deleted = Array.isArray(event && event.rows) ? event.rows : [];
                const deletedTaxIds = new Set(deleted.filter((row) => this.isLegacyTaxRow(row)).map((row) => String(row.taxId || '')));
                if (deletedTaxIds.size) {
                    this.taxLevyList = this.taxLevyList.map((tax) => deletedTaxIds.has(String(tax.id)) ? { ...tax, isApplied: false } : tax);
                }
                this.recalculateInvoice();
            },
            createNewInvoice() {
                this.isEditing = false;
                this.invoiceId = ''; this.invoiceNumber = ''; this.batchNumber = '';
                this.supplierId = ''; this.supplierName = ''; this.accountNumber = ''; this.address = '';
                this.invoiceDate = isoDate(new Date());
                this.projectedPayDate = addDays(this.invoiceDate, 30);
                this.purchaseOrderNumber = ''; this.voucherNumber = ''; this.referenceNumber = ''; this.description = '';
                this.isMultiCurrency = false; this.isVatWithheld = false;
                this.applyNewInvoiceDefaults();
                this.vatRate = 15; this.vatAmount = 0; this.isVatInclusive = false;
                this.invoiceNumber = '';
                this.setMessage('Creating a new invoice.', 'info');
                this.taxRowIdMap = {}; // FIX #7b: fresh ids for a new document
                this.taxLevyList = this.freshTaxLevies(); this.computedTaxLevies = []; this.detailsList = [];
                this.totalInvoiceAmount = 0; this.amount = 0; this.paidAmount = 0; this.invoiceBalance = 0; this.withHeldAmount = 0;
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
                // entity names: VatWithHeld / WithheldAmount (not isVatWithheld / withHeldAmount)
                this.isVatWithheld = asBoolean(invoice.vatWithHeld ?? invoice.isVatWithheld);
                this.ouId = invoice.ouId || ''; this.ouName = invoice.ouName || '';
                this.liabilityAccountId = invoice.liabilityAccountId || EMPTY_GUID;
                this.liabilityAccountName = invoice.liabilityAccountName || '';
                this.vatRate = toNumber(invoice.vatRate, 15);
                this.isVatInclusive = asBoolean(invoice.isVatInclusive);
                this.paidAmount = toNumber(invoice.paidAmount);
                this.withHeldAmount = toNumber(invoice.withheldAmount ?? invoice.withHeldAmount);
                this.status = invoice.status || 'Pending';
                this.isApproved = asBoolean(invoice.isApproved);
                this.isPosted = asBoolean(invoice.isPosted);
                this.isCanceled = asBoolean(invoice.isCanceled);
                this.onSupplierChange();
                if (invoice.supplierName) this.supplierName = invoice.supplierName;
                if (invoice.accountNumber) this.accountNumber = invoice.accountNumber;

                // ---------------- tax synchronisation (rewritten) ----------------
                this.taxLevyList = this.freshTaxLevies();
                this.taxRowIdMap = {};

                const savedTaxes = Array.isArray(invoice.invoiceTaxLevies) ? invoice.invoiceTaxLevies : [];
                const sourceDetails = Array.isArray(invoice.invoiceDetails) ? invoice.invoiceDetails : [];

                // 1) strip EVERY persisted tax line out of the details collection.
                //    The entity has no isTax/taxId column, so levy names coming back in
                //    invoiceTaxLevies are used as an extra fingerprint.
                const savedLevyNameKeys = new Set(savedTaxes.map((tax) => taxNameKey(tax.name)).filter(Boolean));
                const { lines, taxRows } = this.splitTaxRows(sourceDetails, savedLevyNameKeys);

                // FIX #7b: remember the id the DB already assigned to each levy row so the
                // regenerated row keeps it (otherwise /Ap/UpdateInvoice would insert a new
                // detail row every time the invoice is opened and saved).
                taxRows.forEach((row) => {
                    if (!isGuid(row.id)) return;
                    const catalogTax = !isBlankGuid(row.taxId) ? this.taxCatalog.find(t => String(t.id) === String(row.taxId)) : this.findTaxByName(row.description);
                    if (catalogTax && !this.taxRowIdMap[String(catalogTax.id)]) {
                        this.taxRowIdMap = { ...this.taxRowIdMap, [String(catalogTax.id)]: String(row.id).trim() };
                    }
                });

                // 2) work out which levies were applied, using (in order of trust):
                //    the stripped tax rows -> invoice.invoiceTaxLevies -> nothing
                const appliedTaxIds = new Set();
                const markApplied = (value) => {
                    if (value === null || value === undefined || value === '') return;
                    const raw = String(value).toLowerCase();
                    const byId = this.taxCatalog.find(t => String(t.id).toLowerCase() === raw);
                    if (byId) { appliedTaxIds.add(String(byId.id)); return; }
                    const byName = this.findTaxByName(value);
                    if (byName) appliedTaxIds.add(String(byName.id));
                };

                taxRows.forEach((row) => {
                    if (!isBlankGuid(row.taxId)) markApplied(row.taxId);
                    if (!appliedTaxIds.size || !row.taxId) markApplied(row.description);
                });
                savedTaxes.forEach((tax) => {
                    markApplied(tax.taxId);
                    markApplied(tax.id);
                    markApplied(tax.name);
                    // InvoiceTaxLevies.IsApplied (only trusted when true: older rows were
                    // saved before the client started sending the flag).
                    if (tax.isApplied === true) markApplied(tax.id ?? tax.name);
                });

                this.taxLevyList = this.taxLevyList.map((tax) => ({
                    ...tax,
                    isApplied: !this.isVatInclusive && appliedTaxIds.has(String(tax.id))
                }));

                // 3) keep only the real line items; tax rows are regenerated (once) below
                this.detailsList = lines.map((detail) => ({ ...detail, isTax: false, taxId: '', lineType: 'line' }));

                this.recalculateInvoice();
                this.setMessage(`Editing ${this.invoiceNumber || 'selected invoice'}.`, 'info');
            },
            // ============ payload builders: the exact ApInvoice / ApInvoiceDetail shape ============
            // ApInvoiceDetail = { Id, ReferenceNumber, Description, Quantity(int), Amount,
            //                     UnitPrice, SubTotal, DiscountAsPercentage, Discount,
            //                     DebitAccountId(Guid), DebitAccountName }
            // No InvoiceId, IsTax, LineType or TaxId - so those stay client-side only.
            buildDetailPayload(referenceFallback) {
                return this.dedupeTaxRows(this.detailsList).map((detail) => {
                    const quantity = Math.max(0, toNumber(detail.quantity, 1));
                    return {
                        id: isGuid(detail.id) ? String(detail.id).trim() : this.uuid(),
                        referenceNumber: String(detail.referenceNumber ?? '').trim() || referenceFallback,
                        description: String(detail.description || '').trim(),
                        quantity: Math.round(quantity), // Quantity is an int on the entity
                        amount: roundMoney(toNumber(detail.amount)),
                        unitPrice: roundMoney(toNumber(detail.unitPrice)),
                        subTotal: roundMoney(toNumber(detail.subTotal)),
                        discountAsPercentage: asBoolean(detail.discountAsPercentage),
                        discount: roundMoney(toNumber(detail.discount)),
                        debitAccountId: isGuid(detail.debitAccountId) ? String(detail.debitAccountId).trim() : EMPTY_GUID,
                        debitAccountName: detail.debitAccountName || ''
                    };
                });
            },
            // InvoiceTaxLevies = { Id, Name, Amount, Rate, IsApplied }
            buildTaxLevyPayload() {
                const seen = new Set();
                return this.computedTaxLevies.filter((tax) => {
                    const key = String(tax.id ?? tax.name ?? '');
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                }).map((tax) => ({
                    id: isGuid(tax.id) ? String(tax.id).trim() : this.uuid(),
                    name: tax.name,
                    amount: roundMoney(toNumber(tax.amount)),
                    rate: toNumber(tax.rate),
                    isApplied: true
                }));
            },
            // Applied VAT levy, if any (feeds the invoice-level vatId / vatName fields).
            appliedVatLevy() {
                const applied = this.taxLevyList.filter(t => t.isApplied && t.isActive !== false);
                return applied.find(t => t.type === 'vat') || applied.find(t => taxNameKey(t.name) === 'vat') || null;
            },
            saveInvoice() {
                this.setMessage('', 'info');
                if (!this.supplierId) { this.setMessage('Choose a supplier before saving.', 'error'); this.scrollToAdd(); return; }
                if (!this.currencyId) { this.setMessage('Choose a currency before saving.', 'error'); this.scrollToAdd(); return; }
                const lineRows = this.detailsList.filter((detail) => !this.isLegacyTaxRow(detail));
                if (!lineRows.length) { this.setMessage('Add at least one invoice detail row before saving.', 'error'); this.scrollToAdd(); return; }
                let hasZeroQuantity = lineRows.some(detail => !detail.quantity && detail.quantity !== null);
                if (hasZeroQuantity) {
                    this.toastHandler('warning', 'One or more items have quantity 0. Please correct before saving.');
                    this.isLoading = false;
                    return;
                }

                let hasZeroUnitPrice = lineRows.some(detail => !detail.unitPrice && detail.unitPrice !== null);
                if (hasZeroUnitPrice) {
                    this.toastHandler('warning', 'One or more items have unit price 0. Please correct before saving.');
                    this.isLoading = false;
                    return;
                }

                let noDescription = lineRows.some(detail => !detail.description || detail.description.trim() === '');
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
                const batchNumber = this.batchNumber || `BATCH-${invoiceNumber.split('-').pop()}`;
                const invoiceReference = this.referenceNumber || invoiceNumber;
                // FIX #5: single, de-duplicated detail set with explicit tax markers so the
                // stored rows can always be recognised on the next edit.
                // FIX #7: every detail id is forced to a real GUID right before the POST.
                this.detailsList = this.dedupeTaxRows(this.detailsList).map((detail) => {
                    const isTax = this.isLegacyTaxRow(detail);
                    return {
                        ...detail,
                        id: isGuid(detail.id) ? detail.id.trim() : this.uuid(),
                        referenceNumber: detail.referenceNumber || invoiceReference,
                        isTax,
                        lineType: isTax ? 'tax' : 'line'
                    };
                });
                const vatLevy = this.appliedVatLevy();
                const invoice = {
                    invoiceNumber, batchNumber,
                    status:0,
                    supplierId: this.supplierId, supplierName: supplier ? supplier.name : this.supplierName,
                    accountNumber: supplier ? supplier.accountNumber || '' : this.accountNumber,
                    address: supplier ? supplier.address || '' : this.address,
                    invoiceDate: this.invoiceDate, projectedPayDate: this.projectedPayDate,
                    purchaseOrderNumber: this.purchaseOrderNumber, voucherNumber: this.voucherNumber,
                    referenceNumber: invoiceReference, description: this.description,
                    currencyId: this.currencyId, currencyName: currency ? (currency.currencyName || currency.name) : this.currencyName,
                    currencyCode: currency ? (currency.currencyCode || currency.code) : this.currencyCode,
                    minorName: currency ? currency.minorName : this.minorName,
                    buyRate: toNumber(this.buyRate, 1), sellRate: toNumber(this.sellRate, 1),
                    amount: this.totalInvoiceAmount, totalInvoiceAmount: this.totalInvoiceAmount,
                    paidAmount: Math.max(0, toNumber(this.paidAmount)), balance: this.invoiceBalance,
                    vatId: vatLevy && isGuid(vatLevy.id) ? String(vatLevy.id).trim() : EMPTY_GUID,
                    vatName: vatLevy ? vatLevy.name : '',
                    vatRate: toNumber(this.vatRate, 0),
                    vatIsApplied: !!vatLevy && !this.isVatInclusive,
                    vatAmount: roundMoney(this.vatAmount),
                    vatWithHeld: this.isVatWithheld,
                    withheldAmount: Math.max(0, toNumber(this.withHeldAmount)),
                    accountingPeriod: this.invoiceDate ? this.invoiceDate.slice(0, 7) : '',
                    ouId: isGuid(this.ouId) ? String(this.ouId).trim() : EMPTY_GUID,
                    ouName: ou ? ou.name : this.ouName,
                    isPosted: this.isPosted, isApproved: this.isApproved, isCanceled: this.isCanceled,
                    liabilityAccountId: isGuid(this.liabilityAccountId) ? String(this.liabilityAccountId).trim() : EMPTY_GUID,
                    liabilityAccountName: liability ? liability.accountIdentifier : this.liabilityAccountName,
                    isMultiCurrency: this.isMultiCurrency, isVatInclusive: this.isVatInclusive,
                    invoiceTaxLevies: this.buildTaxLevyPayload(),
                    invoiceDetails: this.buildDetailPayload(invoiceReference)
                };
                const index = this.invoiceList.findIndex((item) => String(item.id) === String(invoice.id));
                if (index >= 0) this.invoiceList.splice(index, 1, invoice); else this.invoiceList.unshift(invoice);
                if (this.isEditing === true) {
                    invoice.id = this.invoiceId;
                    axios.post('/Ap/UpdateInvoice', invoice)
                        .then(async response => {
                            this.toastHandler('', 'Invoice updated.');
                            this.isLoading = false;
                            await this.getApInvoices();
                        })
                        .catch(async err => {
                            this.toastHandler('error', 'Unable to update invoice.');
                            this.isLoading = false;
                            await this.getApInvoices();
                        });

                } else {
                    axios.post('/Ap/CreateInvoice', invoice,
                    )
                        .then(async response => {
                            if (response.data.result.code === 200) {
                                this.toastHandler('', 'Invoice saved.');
                                this.isLoading = false;
                                await this.getApInvoices();
                            } else {
                                this.toastHandler('error', response.data.result.message);
                                this.isLoading = false;
                                await this.getApInvoices();
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
            <strong>${number}</strong>

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

                    const res = await axios.post('/Ap/CancelInvoices', invoiceIds);

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
                        '/Ap/ApproveInvoices',
                        invoiceIds 
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
                        '/Ap/PostInvoices',
                        invoiceIds
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
            this.getDefaultGlSetup();
            this.getBusinessProfile();
            await this.getApInvoices();
            this.recalculateInvoice();
            this.isLoading = false;
        }
    });

    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
