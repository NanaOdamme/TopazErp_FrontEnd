(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const ENDPOINTS = {
        quotations: '/Ar/GetQuotations',
        createQuotation: '/Ar/CreateQuotation',
        updateQuotation: '/Ar/UpdateQuotation',
        deleteQuotation: '/Ar/DeleteQuotation',
        createInvoice: '/Ar/CreateInvoice',
        customers: '/SharedResource/GetCustomers',
        currencies: '/SharedResource/GetCurrencies',
        organizationalUnits: '/SharedResource/GetCostCenters/',
        accounts: '/Ap/InitJournalEntry',
        taxLevies: '/SharedResource/GetTaxLevies'
    };

    // ---------- helpers (mirrors invoices.js) ----------
    const roundMoney = (v) => Math.round((Number.isFinite(Number(v)) ? Number(v) : 0) * 100) / 100;
    const toNumber = (v, fallback = 0) => {
        if (v === '' || v === null || v === undefined) return fallback;
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
    };
    const asBoolean = (v) => v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';
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
    const asList = (result) => Array.isArray(result) ? result : (result && Array.isArray(result.items) ? result.items : []);
    const today = isoDate(new Date());
    const toCamel = s => s.charAt(0).toLowerCase() + s.slice(1);
    const normalizeKeys = obj => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        const out = {};
        for (const [k, v] of Object.entries(obj)) out[toCamel(k)] = v;
        return out;
    };
    const deepNormalize = (value, depth = 0) => {
        if (!value || typeof value !== 'object' || depth > 6) return value;
        if (Array.isArray(value)) return value.map(v => deepNormalize(v, depth + 1));
        const out = {};
        for (const [k, v] of Object.entries(value)) out[toCamel(k)] = deepNormalize(v, depth + 1);
        return out;
    };
    const unwrapList = (raw, preferredKey) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw.result !== undefined) return unwrapList(raw.result, preferredKey);
        if (preferredKey && Array.isArray(raw[preferredKey])) return raw[preferredKey];
        if (Array.isArray(raw.items)) return raw.items;
        if (typeof raw === 'object') {
            const firstArr = Object.values(raw).find(v => Array.isArray(v));
            if (firstArr) return firstArr;
        }
        return asList(raw);
    };
    const isBlankGuid = (v) => {
        const s = String(v ?? '').trim();
        return !s || s === EMPTY_GUID || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(s);
    };
    const taxNameKey = (v) => String(v ?? '').toLowerCase().replace(/[^a-z]/g, '');
    const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isGuid = (v) => typeof v === 'string' && GUID_PATTERN.test(v.trim());

    const app = Vue.createApp({
        data() {
            return {
                emptyGuid: EMPTY_GUID,
                theme: '#0645e7',
                theme1: '#545454',
                tenantId: null,
                accounts: [],
                customers: [],
                currencies: [],
                organizationalUnits: [],
                taxCatalog: [],
                taxLevyList: [],
                quotationList: [],
                detailsList: [],
                isLoading: false,
                isShimmerLoading: false,

                // header
                quotationId: '',
                quotationNumber: '',
                batchNumber: '',
                customerId: '',
                customerName: '',
                accountNumber: '',
                address: '',
                quotationDate: today,
                currencyId: '',
                currencyName: '',
                currencyCode: '',
                buyRate: 1,
                sellRate: 1,
                isMultiCurrency: false,
                notes: '',
                sendEmail: false,
                sendSms: false,
                isConvertedToInvoice: false,

                // totals
                computedTaxLevies: [],
                totalQuotationAmount: 0,
                vatGl: '',
                nhilGl: '',
                getflGl: '',
                cstGl: '',
                defaultGlSetup: null,

                // state
                isEditing: false,
                formMessage: '',
                formMessageType: 'info',
                taxRowIdMap: {},
                isOu: false,
            };
        },
        computed: {
            detailColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'quotationId', label: 'Quotation ID', type: 'text', hidden: true, editable: false },
                    { key: 'taxId', label: 'Tax ID', type: 'text', hidden: true, editable: false },
                    { key: 'isTax', label: 'Tax row', type: 'boolean', hidden: true, editable: false },
                    { key: 'referenceNo', label: 'Ref No.', type: 'text', searchable: true, width: 150 },
                    { key: 'description', label: 'Description', type: 'text', required: true, searchable: true, width: 220 },
                    { key: 'debitAccountId', label: 'Income G/L Account', type: 'select', options: this.accounts, display: 'accountIdentifier', value: 'id', width: 220 },
                    { key: 'quantity', label: 'Quantity', type: 'number', required: true, defaultValue: 1, min: 0, decimals: 2, width: 110 },
                    { key: 'unitPrice', label: 'Unit Price', type: 'number', required: true, defaultValue: 0, min: 0, decimals: 2, width: 130 },
                    { key: 'discountAsPercentage', label: 'Disc. as %?', type: 'boolean', defaultValue: false, width: 120 },
                    { key: 'discount', label: 'Discount', type: 'number', defaultValue: 0, min: 0, decimals: 2, width: 120 },
                    { key: 'amount', label: 'Disc. Amt.', type: 'number', decimals: 2, editable: false, width: 125 },
                    { key: 'subTotal', label: 'Sub Total', type: 'number', decimals: 2, editable: false, width: 130 }
                ];
            },
            quotationColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'quotationNumber', label: 'Quotation #', type: 'text', width: 150, required: true, searchable: true },
                    { key: 'batchNumber', label: 'Batch #', type: 'text', width: 125, searchable: true },
                    { key: 'customerId', label: 'Customer', type: 'select', options: this.customers, value: 'id', display: 'name', width: 260, required: true, searchable: true },
                    { key: 'quotationDate', label: 'Quotation Date', type: 'date', width: 130, searchable: true },
                    { key: 'currencyId', label: 'Currency', type: 'select', options: this.currencies, value: 'id', display: 'currencyName', width: 150, searchable: true },
                    { key: 'buyRate', label: 'Buy Rate', type: 'number', width: 110, decimals: 4 },
                    { key: 'totalAmount', label: 'Total', type: 'number', width: 135, decimals: 2, agg: 'sum' },
                    { key: 'isConvertedToInvoice', label: 'Converted', type: 'boolean', width: 110 },
                ];
            },
            quotationDetailChild() {
                return { key: 'details', title: 'Quotation Details', columns: this.detailColumns };
            }
        },
        methods: {
            uuid() {
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                );
            },
            setMessage(message, type = 'info') {
                this.formMessage = message;
                this.formMessageType = type;
            },
            toastHandler(type, message = 'An unexpected error occurred.') {
                if (typeof Swal === 'undefined') { console.log(message); return; }
                Swal.fire({
                    toast: true, position: 'top-end',
                    icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                    title: message, showConfirmButton: false, timer: 4000, timerProgressBar: true
                });
            },
            formatMoney(value) {
                return new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(toNumber(value));
            },
            scrollToAdd() {
                this.$nextTick(() => {
                    const el = document.getElementById('quotation-editor');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            },

            // ---------- lookups ----------
            async fetchList(url, label, preferredKey = null) {
                try {
                    const res = await axios.get(url);
                    const list = unwrapList(res.data, preferredKey);
                    return list.map(item => deepNormalize((item && item.Id && !item.id) ? normalizeKeys(item) : item));
                } catch (e) {
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },
            async loadLookups() {
                const [rawAccounts, rawCustomers, rawCurrencies, rawUnits, rawTaxes] = await Promise.all([
                    this.fetchList(ENDPOINTS.accounts, 'accounts', 'accounts'),
                    this.fetchList(ENDPOINTS.customers, 'customers'),
                    this.fetchList(ENDPOINTS.currencies, 'currencies'),
                    this.fetchList(ENDPOINTS.organizationalUnits, 'organizational units'),
                    this.fetchList(ENDPOINTS.taxLevies, 'tax levies')
                ]);
                this.accounts = rawAccounts.map(a => ({
                    ...a,
                    accountIdentifier: a.accountIdentifier || `${a.accountNo ?? ''} - ${a.accountName ?? a.name ?? ''}`.trim().replace(/^ - /, ''),
                    name: a.accountName || a.name,
                    accountName: a.accountName || a.name
                }));
                this.customers = rawCustomers.map(s => ({ ...s, name: (s.name || '').trim() }));
                this.currencies = rawCurrencies.map(c => ({
                    ...c, currencyName: c.currencyName, currencyCode: c.currencyCode,
                    buyRate: toNumber(c.buyRate, 1), sellRate: toNumber(c.sellRate, 1)
                }));
                const byId = new Map(rawUnits.map(u => [String(u.id), u]));
                const getPath = (unit, visited = new Set()) => {
                    const names = []; let cur = unit; let depth = 0;
                    while (cur && depth < 20) {
                        names.unshift(cur.name);
                        const pid = cur.parentId ? String(cur.parentId) : '';
                        if (!pid || pid === EMPTY_GUID || !byId.has(pid) || visited.has(pid)) break;
                        visited.add(pid); cur = byId.get(pid); depth++;
                    }
                    return names.join(' / ');
                };
                this.organizationalUnits = rawUnits.map(u => {
                    const path = getPath(u);
                    return { ...u, originalName: u.name, name: path, displayName: path, hierarchy: path };
                }).sort((a, b) => a.name.localeCompare(b.name));

                this.taxCatalog = rawTaxes.map(t => ({
                    ...t,
                    type: String(t.type || '').toLowerCase() === 'vat' || String(t.name || '').toLowerCase() === 'vat' ? 'vat' : 'others',
                    rate: toNumber(t.rate, 1),
                    accountId: t.accountId || '',
                    isActive: t.isActive !== false
                }));
                this.taxLevyList = this.freshTaxLevies();
                if (!this.isEditing) this.applyNewQuotationDefaults();
            },
            freshTaxLevies() { return this.taxCatalog.map(t => ({ ...t, isApplied: false })); },
            applyNewQuotationDefaults() {
                const cur = this.currencies.find(c => c.isDefault) || this.currencies[0];
                if (cur) {
                    this.currencyId = cur.id; this.currencyName = cur.currencyName;
                    this.currencyCode = cur.currencyCode; this.buyRate = toNumber(cur.buyRate, 1);
                    this.sellRate = toNumber(cur.sellRate, 1);
                }
            },
            async getDefaultGlSetup() {
                try {
                    const r = await axios.get('/Ap/GetDefaultGlSetup');
                    const d = (r.data && r.data.result) || r.data || {};
                    this.defaultGlSetup = d;
                    this.vatGl = d.vatReceivedAccountId || '';
                    this.nhilGl = d.nhilReceivedAccountId || '';
                    this.getflGl = d.getflReceivedAccountId || '';
                    this.cstGl = d.vatReceivedAccountId || '';
                    return d;
                } catch { return null; }
            },
            getBusinessProfile() {
                axios.get('/SharedResource/GetBusinessProfile').then(r => {
                    if (r.data) this.isOu = r.data.enforceOu;
                }).catch(() => {});
            },
            async getQuotations() {
                const list = await this.fetchList(ENDPOINTS.quotations, 'Quotations');
                this.quotationList = list.map(q => ({
                    ...q,
                    quotationDate: isoDate(q.quotationDate),
                    totalAmount: toNumber(q.totalAmount ?? q.totalInvoiceAmount ?? this.calcTotalFromQuotation(q)),
                    isConvertedToInvoice: asBoolean(q.isConvertedToInvoice)
                }));
                return this.quotationList;
            },
            calcTotalFromQuotation(q) {
                const details = Array.isArray(q.details) ? q.details : [];
                const levies = Array.isArray(q.taxLevies) ? q.taxLevies : [];
                const sub = details.reduce((s, d) => s + toNumber(d.subTotal), 0);
                const tax = levies.filter(t => t.isApplied).reduce((s, t) => s + toNumber(t.amount), 0);
                return sub + tax;
            },

            // ---------- header events ----------
            onCustomerChange() {
                const c = this.customers.find(x => x.id === this.customerId);
                this.customerName = c ? c.name : '';
                this.accountNumber = c ? c.accountNumber || '' : '';
                this.address = c ? c.address || '' : this.address;
            },
            onCurrencyChange() {
                const c = this.currencies.find(x => x.id === this.currencyId);
                if (!c) return;
                this.currencyName = c.currencyName; this.currencyCode = c.currencyCode;
                this.buyRate = toNumber(c.buyRate, 1); this.sellRate = toNumber(c.sellRate, 1);
                this.isMultiCurrency = c.isDefault !== true;
            },
            nextQuotationNumber() {
                const year = (this.quotationDate || today).slice(0, 4);
                const prefix = `QT-${year}-`;
                const next = this.quotationList.reduce((max, q) => {
                    if (!String(q.quotationNumber || '').startsWith(prefix)) return max;
                    return Math.max(max, Number(String(q.quotationNumber).slice(prefix.length)) || 0);
                }, 0) + 1;
                return `${prefix}${String(next).padStart(3, '0')}`;
            },

            // ---------- detail / tax math (same as invoices) ----------
            lineSubtotal(detail) {
                const qty = Math.max(0, toNumber(detail.quantity, 0));
                const price = Math.max(0, toNumber(detail.unitPrice, 0));
                const gross = qty * price;
                const disc = Math.max(0, toNumber(detail.discount, 0));
                const discAmt = asBoolean(detail.discountAsPercentage) ? gross * Math.min(disc, 100) / 100 : Math.min(disc, gross);
                return { gross: roundMoney(gross), discountAmount: roundMoney(discAmt), subtotal: roundMoney(gross - discAmt) };
            },
            firstDetailReference() {
                for (const r of (this.detailsList || [])) {
                    if (!r || this.isLegacyTaxRow(r)) continue;
                    const ref = String(r.referenceNo ?? '').trim();
                    if (ref) return ref;
                }
                return '';
            },
            resolveQuotationReference(fallbackRows) {
                for (const r of (fallbackRows || [])) {
                    if (!r || this.isLegacyTaxRow(r)) continue;
                    const ref = String(r.referenceNo ?? '').trim();
                    if (ref) return ref;
                }
                return this.firstDetailReference() || this.quotationNumber || '';
            },
            normalizeDetail(detail) {
                const row = { ...detail };
                const calc = this.lineSubtotal(row);
                const acct = this.accounts.find(a => String(a.id) === String(row.debitAccountId));
                return {
                    ...row,
                    id: isGuid(row.id) ? row.id.trim() : this.uuid(),
                    referenceNo: String(row.referenceNo ?? '').trim() || this.firstDetailReference() || this.quotationNumber || '',
                    description: String(row.description || '').trim(),
                    debitAccountId: row.debitAccountId || '',
                    debitAccountName: acct ? acct.accountIdentifier : (row.debitAccountName || ''),
                    quantity: Math.max(0, toNumber(row.quantity, 1)),
                    unitPrice: Math.max(0, toNumber(row.unitPrice, 0)),
                    discountAsPercentage: asBoolean(row.discountAsPercentage),
                    discount: Math.max(0, toNumber(row.discount, 0)),
                    amount: calc.discountAmount,
                    subTotal: calc.subtotal,
                    isTax: false, taxId: ''
                };
            },
            isTaxRow(d) {
                if (!d) return false;
                if (asBoolean(d.isTax)) return true;
                if (String(d.lineType || '').toLowerCase() === 'tax') return true;
                if (!isBlankGuid(d.taxId)) return true;
                if (/^tax-/.test(String(d.id || ''))) return true;
                return false;
            },
            findTaxByName(name) {
                const key = taxNameKey(name);
                if (!key) return null;
                return this.taxCatalog.find(t => taxNameKey(t.name) === key) || null;
            },
            isLegacyTaxRow(d) {
                if (this.isTaxRow(d)) return true;
                return !!this.findTaxByName(d && d.description);
            },
            splitTaxRows(details, extraNameKeys) {
                const extra = extraNameKeys instanceof Set ? extraNameKeys : new Set();
                const lines = []; const taxRows = [];
                (details || []).forEach(d => {
                    const key = taxNameKey(d && d.description);
                    if (this.isLegacyTaxRow(d) || (key && extra.has(key))) taxRows.push(d);
                    else lines.push(d);
                });
                return { lines, taxRows };
            },
            dedupeTaxRows(details) {
                const seen = new Set();
                return (details || []).filter(d => {
                    if (!this.isTaxRow(d) && !this.isLegacyTaxRow(d)) return true;
                    const key = !isBlankGuid(d.taxId) ? `id:${String(d.taxId)}` : `name:${taxNameKey(d.description)}`;
                    if (seen.has(key)) return false; seen.add(key); return true;
                });
            },
            resolveTaxRowId(tax) {
                const key = String(tax?.id ?? tax?.name ?? '');
                const saved = this.taxRowIdMap[key];
                if (isGuid(saved)) return saved;
                if (!this.taxRowIdMap[key]) this.taxRowIdMap = { ...this.taxRowIdMap, [key]: this.uuid() };
                return this.taxRowIdMap[key];
            },
            toggleTaxLevy(taxId) {
                const sel = this.taxLevyList.find(t => String(t.id) === String(taxId));
                if (!sel || sel.isActive === false) return;
                const next = !sel.isApplied;
                this.taxLevyList = this.taxLevyList.map(t => String(t.id) === String(taxId) ? { ...t, isApplied: next } : t);
                this.recalculateQuotation();
            },
            recalculateQuotation() {
                const source = Array.isArray(this.detailsList) ? this.detailsList : [];
                const clean = this.dedupeTaxRows(source);
                const lineRows = clean.filter(d => !this.isLegacyTaxRow(d)).map(d => this.normalizeDetail(d));
                const base = roundMoney(lineRows.reduce((s, d) => s + toNumber(d.subTotal), 0));
                const taxRows = []; const summary = [];
                const ref = this.resolveQuotationReference(lineRows);
                const applied = this.taxLevyList.filter(t => t.isApplied && t.isActive !== false);
                const seen = new Set();
                applied.forEach(tax => {
                    const key = String(tax.id ?? tax.name);
                    if (seen.has(key)) return; seen.add(key);
                    const rate = Math.max(0, toNumber(tax.rate));
                    const amt = roundMoney(base * rate / 100);
                    const acct = this.accounts.find(a => String(a.id) === String(tax.accountId));
                    taxRows.push({
                        id: this.resolveTaxRowId(tax), taxId: tax.id, isTax: true, lineType: 'tax',
                        referenceNo: ref, description: tax.name,
                        debitAccountId: tax.accountId || '', debitAccountName: acct ? acct.accountIdentifier : '',
                        quantity: 1, unitPrice: amt, discountAsPercentage: false, discount: 0, amount: 0, subTotal: amt
                    });
                    summary.push({ id: tax.id, name: tax.name, rate, isApplied: true, amount: amt });
                });
                this.detailsList = lineRows.concat(taxRows);
                this.computedTaxLevies = summary;
                this.totalQuotationAmount = roundMoney(base + taxRows.reduce((s, r) => s + toNumber(r.subTotal), 0));
                return this.totalQuotationAmount;
            },
            onCreateDetail(e) { if (!e || !e.row) return; Object.assign(e.row, this.normalizeDetail(e.row)); this.recalculateQuotation(); },
            onUpdateDetail(e) {
                if (!e || !e.row) return;
                if (!this.isLegacyTaxRow(e.row)) Object.assign(e.row, this.normalizeDetail(e.row));
                this.recalculateQuotation();
            },
            onDeleteDetail(e) {
                const deleted = Array.isArray(e && e.rows) ? e.rows : [];
                const ids = new Set(deleted.filter(r => this.isLegacyTaxRow(r)).map(r => String(r.taxId || '')));
                if (ids.size) this.taxLevyList = this.taxLevyList.map(t => ids.has(String(t.id)) ? { ...t, isApplied: false } : t);
                this.recalculateQuotation();
            },

            // ---------- CRUD ----------
            createNewQuotation() {
                this.isEditing = false;
                this.quotationId = ''; this.quotationNumber = ''; this.batchNumber = '';
                this.customerId = ''; this.customerName = ''; this.accountNumber = ''; this.address = '';
                this.quotationDate = today; this.notes = ''; this.sendEmail = false; this.sendSms = false; this.isConvertedToInvoice = false;
                this.applyNewQuotationDefaults();
                this.taxRowIdMap = {}; this.taxLevyList = this.freshTaxLevies(); this.computedTaxLevies = []; this.detailsList = [];
                this.totalQuotationAmount = 0;
                this.setMessage('Creating a new quotation.', 'info');
                if (this.$refs.quotations && this.$refs.quotations.clearSelection) this.$refs.quotations.clearSelection();
                this.scrollToAdd();
            },
            getSelectedQuotation() {
                const g = this.$refs.quotations;
                if (!g || typeof g.selectedRows !== 'function') return null;
                return g.selectedRows()[0] || null;
            },
            setCurrentQuotation() {
                const g = this.$refs.quotations;
                if (!g || typeof g.selectedRows !== 'function') { this.setMessage('Grid not ready.', 'error'); return; }
                const rows = g.selectedRows();
                if (rows.length !== 1) { this.toastHandler('warning', 'Select one quotation to edit.'); return; }
                this.loadQuotation(rows[0]); this.scrollToAdd();
            },
            loadQuotation(q) {
                if (!q) return;
                if (q.isConvertedToInvoice){
                    this.toastHandler('warning', 'Cannot edit invoiced quotations.')
                    return;
                }
                this.isEditing = true;
                this.quotationId = q.id || '';
                this.quotationNumber = q.quotationNumber || '';
                this.batchNumber = q.batchNumber || '';
                this.customerId = q.customerId || '';
                this.customerName = q.customerName || '';
                this.accountNumber = q.accountNumber || '';
                this.address = q.address || '';
                this.quotationDate = isoDate(q.quotationDate) || today;
                this.currencyId = q.currencyId || (this.currencies[0] ? this.currencies[0].id : '');
                const cur = this.currencies.find(c => c.id === this.currencyId);
                this.currencyName = q.currencyName || (cur && cur.currencyName) || '';
                this.currencyCode = q.currencyCode || (cur && cur.currencyCode) || '';
                this.buyRate = toNumber(q.buyRate, cur ? cur.buyRate : 1);
                this.sellRate = toNumber(q.sellRate, cur ? cur.sellRate : 1);
                this.isMultiCurrency = cur ? cur.isDefault !== true : false;
                this.notes = q.notes || '';
                this.sendEmail = asBoolean(q.sendEmail);
                this.sendSms = asBoolean(q.sendSms);
                this.isConvertedToInvoice = asBoolean(q.isConvertedToInvoice);
                this.onCustomerChange();

                // tax + details
                this.taxLevyList = this.freshTaxLevies();
                this.taxRowIdMap = {};
                const savedTaxes = Array.isArray(q.taxLevies) ? q.taxLevies : [];
                const sourceDetails = Array.isArray(q.details) ? q.details : [];
                const savedNames = new Set(savedTaxes.map(t => taxNameKey(t.name)).filter(Boolean));
                const { lines, taxRows } = this.splitTaxRows(sourceDetails, savedNames);
                taxRows.forEach(r => {
                    if (!isGuid(r.id)) return;
                    const cat = !isBlankGuid(r.taxId) ? this.taxCatalog.find(t => String(t.id) === String(r.taxId)) : this.findTaxByName(r.description);
                    if (cat && !this.taxRowIdMap[String(cat.id)]) this.taxRowIdMap = { ...this.taxRowIdMap, [String(cat.id)]: String(r.id).trim() };
                });
                const appliedIds = new Set();
                const mark = (v) => {
                    if (v === null || v === undefined || v === '') return;
                    const raw = String(v).toLowerCase();
                    const byId = this.taxCatalog.find(t => String(t.id).toLowerCase() === raw);
                    if (byId) { appliedIds.add(String(byId.id)); return; }
                    const byName = this.findTaxByName(v);
                    if (byName) appliedIds.add(String(byName.id));
                };
                taxRows.forEach(r => { if (!isBlankGuid(r.taxId)) mark(r.taxId); if (!appliedIds.size || !r.taxId) mark(r.description); });
                savedTaxes.forEach(t => { mark(t.id); mark(t.name); if (t.isApplied === true) mark(t.id ?? t.name); });
                this.taxLevyList = this.taxLevyList.map(t => ({ ...t, isApplied: appliedIds.has(String(t.id)) }));
                this.detailsList = lines.map(d => ({ ...d, isTax: false, taxId: '', lineType: 'line' }));
                this.recalculateQuotation();
                this.setMessage(`Editing ${this.quotationNumber || 'selected quotation'}.`, 'info');
            },

            buildDetailPayload(refFallback) {
                return this.dedupeTaxRows(this.detailsList).map(d => ({
                    id: isGuid(d.id) ? String(d.id).trim() : this.uuid(),
                    referenceNo: String(d.referenceNo ?? '').trim() || refFallback,
                    description: String(d.description || '').trim(),
                    debitAccountId: isGuid(d.debitAccountId) ? String(d.debitAccountId).trim() : EMPTY_GUID,
                    debitAccountName: d.debitAccountName || '',
                    quantity: Math.round(Math.max(0, toNumber(d.quantity, 1))),
                    unitPrice: roundMoney(toNumber(d.unitPrice)),
                    amount: roundMoney(toNumber(d.amount)),
                    subTotal: roundMoney(toNumber(d.subTotal)),
                    discountAsPercentage: asBoolean(d.discountAsPercentage),
                    discount: roundMoney(toNumber(d.discount)),
                }));
            },
            buildTaxLevyPayload() {
                const seen = new Set();
                return this.computedTaxLevies.filter(t => {
                    const k = String(t.id ?? t.name ?? '');
                    if (seen.has(k)) return false; seen.add(k); return true;
                }).map(t => ({
                    id: isGuid(t.id) ? String(t.id).trim() : this.uuid(),
                    name: t.name, amount: roundMoney(toNumber(t.amount)),
                    rate: toNumber(t.rate), isApplied: true
                }));
            },
            buildQuotationPayload() {
                const customer = this.customers.find(c => c.id === this.customerId);
                const currency = this.currencies.find(c => c.id === this.currencyId);
                const qNumber = this.quotationNumber || this.nextQuotationNumber();
                const refFallback = qNumber;
                // ensure latest totals
                this.recalculateQuotation();
                this.detailsList = this.dedupeTaxRows(this.detailsList).map(d => {
                    const isTax = this.isLegacyTaxRow(d);
                    return { ...d, id: isGuid(d.id) ? d.id.trim() : this.uuid(), referenceNo: d.referenceNo || refFallback, isTax, lineType: isTax ? 'tax' : 'line' };
                });
                return {
                    id: this.isEditing ? this.quotationId : undefined,
                    customerId: this.customerId,
                    customerName: customer ? customer.name : this.customerName,
                    address: this.address || (customer ? customer.address || '' : ''),
                    accountNumber: customer ? customer.accountNumber || '' : this.accountNumber,
                    currencyId: this.currencyId,
                    currencyName: currency ? currency.currencyName : this.currencyName,
                    currencyCode: currency ? currency.currencyCode : this.currencyCode,
                    buyRate: toNumber(this.buyRate, 1),
                    quotationNumber: qNumber,
                    batchNumber: this.batchNumber || `BATCH-${qNumber.split('-').pop()}`,
                    notes: this.notes || '',
                    sendEmail: !!this.sendEmail,
                    sendSms: !!this.sendSms,
                    isConvertedToInvoice: !!this.isConvertedToInvoice,
                    quotationDate: this.quotationDate,
                    details: this.buildDetailPayload(refFallback),
                    taxLevies: this.buildTaxLevyPayload()
                };
            },
            async saveQuotation() {
                this.setMessage('', 'info');
                if (!this.customerId) { this.setMessage('Choose a customer before saving.', 'error'); this.scrollToAdd(); return; }
                if (!this.currencyId) { this.setMessage('Choose a currency before saving.', 'error'); this.scrollToAdd(); return; }
                const lines = this.detailsList.filter(d => !this.isLegacyTaxRow(d));
                if (!lines.length) { this.setMessage('Add at least one quotation detail row before saving.', 'error'); this.scrollToAdd(); return; }
                if (lines.some(d => !d.quantity)) { this.toastHandler('warning', 'One or more items have quantity 0.'); return; }
                if (lines.some(d => !d.unitPrice && d.unitPrice !== null)) { this.toastHandler('warning', 'One or more items have unit price 0.'); return; }
                if (lines.some(d => !d.description || !d.description.trim())) { this.toastHandler('warning', 'One or more items have no description.'); return; }

                const payload = this.buildQuotationPayload();
                const url = this.isEditing ? ENDPOINTS.updateQuotation : ENDPOINTS.createQuotation;
                try {
                    this.isLoading = true;
                    const res = await axios.post(url, payload);
                    const ok = res.data && (res.data.result?.code === 200 || res.data.success !== false);
                    if (ok) {
                        this.toastHandler('success', this.isEditing ? 'Quotation updated.' : 'Quotation saved.');
                        this.quotationNumber = payload.quotationNumber;
                        await this.getQuotations();
                    } else {
                        this.toastHandler('error', res.data?.result?.message || res.data?.message || 'Unable to save quotation.');
                    }
                } catch (e) {
                    this.toastHandler('error', e.response?.data?.message || 'Unable to save quotation.');
                } finally { this.isLoading = false; }
            },
            async deleteSelectedQuotations() {
                const g = this.$refs.quotations;
                const selected = g && typeof g.selectedRows === 'function' ? g.selectedRows() : [];
                if (!selected.length) { this.toastHandler('warning', 'Select one or more quotations to delete.'); return; }
                const result = await Swal.fire({
                    icon: 'warning', title: 'Confirm Delete',
                    text: `Are you sure you want to delete ${selected.length} quotation${selected.length === 1 ? '' : 's'}?`,
                    showCancelButton: true, confirmButtonText: 'Yes, delete', cancelButtonText: 'Cancel',
                    confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b', reverseButtons: true
                });
                if (!result.isConfirmed) return;
                try {
                    for (const row of selected) {
                        const id = typeof row.id === 'object' ? row.id?.id : row.id;
                        await axios.delete(`${ENDPOINTS.deleteQuotation}?id=${encodeURIComponent(id)}`);
                    }
                    if (g.clearSelection) g.clearSelection();
                    this.toastHandler('success', 'Deleted successfully.');
                    await this.getQuotations();
                    if (selected.some(s => String(s.id) === String(this.quotationId))) this.createNewQuotation();
                } catch (e) {
                    this.toastHandler('error', e.response?.data?.message || 'Failed to delete quotation(s).');
                }
            },

            // ---------- CONVERT TO INVOICE ----------
            async convertToInvoice() {
                const g = this.$refs.quotations;
                const selected = g && typeof g.selectedRows === 'function' ? g.selectedRows() : [];
                if (!selected.length) { this.toastHandler('warning', 'Select a quotation to convert.'); return; }
                if (selected.length > 1) { this.toastHandler('warning', 'Select only one quotation to convert at a time.'); return; }
                const q = selected[0];
                if (asBoolean(q.isConvertedToInvoice)) {
                    const r = await Swal.fire({
                        icon: 'warning', title: 'Already Converted',
                        text: `Quotation ${q.quotationNumber} is already converted to an invoice. Convert again?`,
                        showCancelButton: true, confirmButtonText: 'Yes, convert again', cancelButtonText: 'Cancel'
                    });
                    if (!r.isConfirmed) return;
                }
                const confirm = await Swal.fire({
                    icon: 'question', title: 'Convert to Invoice',
                    html: `<p>Convert quotation <strong>${q.quotationNumber}</strong> for <strong>${q.customerName || ''}</strong> to an AR Invoice?</p>`,
                    showCancelButton: true, confirmButtonText: 'Yes, convert', cancelButtonText: 'Cancel',
                    confirmButtonColor: '#059669', cancelButtonColor: '#64748b', reverseButtons: true
                });
                if (!confirm.isConfirmed) return;

                // If quotation not loaded in editor, fetch full details from list (already has details/taxLevies)
                // Build invoice payload from quotation
                try {
                    this.isLoading = true;
                    const qFull = q.details ? q : (this.quotationList.find(x => String(x.id) === String(q.id)) || q);
                    const details = Array.isArray(qFull.details) ? qFull.details : [];
                    const taxLevies = Array.isArray(qFull.taxLevies) ? qFull.taxLevies : [];

                    // Map quotation details -> invoice details
                    // Invoice expects: referenceNo, description, creditAccountId/Name, quantity, unitPrice, discountAsPercentage, discount, amount, subTotal
                    const invoiceDetails = details.map(d => ({
                        id: this.uuid(),
                        referenceNo: d.referenceNo || d.referenceNumber || qFull.quotationNumber || '',
                        description: d.description,
                        creditAccountId: d.debitAccountId || d.creditAccountId || EMPTY_GUID,
                        creditAccountName: d.debitAccountName || d.creditAccountName || '',
                        quantity: Math.round(toNumber(d.quantity, 1)),
                        unitPrice: roundMoney(toNumber(d.unitPrice)),
                        discountAsPercentage: asBoolean(d.discountAsPercentage),
                        discount: roundMoney(toNumber(d.discount)),
                        amount: roundMoney(toNumber(d.amount)),
                        subTotal: roundMoney(toNumber(d.subTotal))
                    }));

                    // Map tax levies -> invoiceTaxLevies (invoice entity uses invoiceTaxLevies)
                    const invoiceTaxLevies = taxLevies.filter(t => t.isApplied).map(t => ({
                        id: t.id || this.uuid(),
                        name: t.name,
                        amount: roundMoney(toNumber(t.amount)),
                        rate: toNumber(t.rate),
                        isApplied: true
                    }));

                    const totalInvoiceAmount = roundMoney(
                        details.reduce((s, d) => s + toNumber(d.subTotal), 0) +
                        invoiceTaxLevies.reduce((s, t) => s + toNumber(t.amount), 0)
                    );

                    const currency = this.currencies.find(c => c.id === qFull.currencyId);
                    const customer = this.customers.find(c => c.id === qFull.customerId);
                    const vatLevy = invoiceTaxLevies.find(t => taxNameKey(t.name) === 'vat');

                    const invoiceDate = today;
                    const invoice = {
                        invoiceNumber: '', // server will assign, or use nextInvoiceNumber logic server-side
                        batchNumber: '',
                        status: 0,
                        customerId: qFull.customerId,
                        customerName: qFull.customerName || (customer && customer.name) || '',
                        accountNumber: qFull.accountNumber || (customer && customer.accountNumber) || '',
                        address: qFull.address || (customer && customer.address) || '',
                        invoiceDate: invoiceDate,
                        projectedPayDate: addDays(invoiceDate, 30),
                        purchaseOrderNumber: '',
                        voucherNumber: '',
                        referenceNo: qFull.quotationNumber || '',
                        referenceNumber: qFull.quotationNumber || '',
                        description: qFull.notes || `Converted from Quotation ${qFull.quotationNumber}`,
                        currencyId: qFull.currencyId,
                        currencyName: qFull.currencyName || (currency && currency.currencyName) || '',
                        currencyCode: qFull.currencyCode || (currency && currency.currencyCode) || '',
                        minorName: currency ? currency.minorName : '',
                        buyRate: toNumber(qFull.buyRate, 1),
                        sellRate: toNumber(currency ? currency.sellRate : 1, 1),
                        amount: totalInvoiceAmount,
                        totalInvoiceAmount: totalInvoiceAmount,
                        paidAmount: 0,
                        balance: totalInvoiceAmount,
                        vatId: vatLevy && isGuid(vatLevy.id) ? vatLevy.id : EMPTY_GUID,
                        vatName: vatLevy ? vatLevy.name : '',
                        vatRate: vatLevy ? toNumber(vatLevy.rate) : 0,
                        vatIsApplied: !!vatLevy,
                        vatAmount: vatLevy ? roundMoney(vatLevy.amount) : 0,
                        vatWithHeld: false,
                        withheldAmount: 0,
                        accountingPeriod: invoiceDate.slice(0, 7),
                        ouId: EMPTY_GUID,
                        ouName: '',
                        isPosted: false, isApproved: false, isCanceled: false,
                        accountId: EMPTY_GUID,
                        accountName: '',
                        isMultiCurrency: currency ? currency.isDefault !== true : false,
                        isVatInclusive: false,
                        invoiceTaxLevies: invoiceTaxLevies,
                        details: invoiceDetails
                    };

                    const res = await axios.post(ENDPOINTS.createInvoice, invoice);
                    const ok = res.data && (res.data.result?.code === 200 || res.data.success !== false || res.data.id);
                    if (ok) {
                        // mark quotation as converted (optional - update flag)
                        try {
                            const updatedQuotation = { ...qFull, isConvertedToInvoice: true };
                            await axios.post(ENDPOINTS.updateQuotation, updatedQuotation);
                        } catch (_) { /* non-blocking */ }

                        await this.getQuotations();
                        await Swal.fire({
                            icon: 'success',
                            title: 'Converted Successfully',
                            html: `<p>Quotation <strong>${qFull.quotationNumber}</strong> converted to invoice.</p><p class="text-sm text-slate-500 mt-2">Invoice total: ${this.formatMoney(totalInvoiceAmount)} ${qFull.currencyCode || ''}</p>`,
                            confirmButtonColor: '#059669'
                        });
                    } else {
                        this.toastHandler('error', res.data?.result?.message || 'Failed to convert quotation to invoice.');
                    }
                } catch (e) {
                    console.error('Convert failed', e);
                    this.toastHandler('error', e.response?.data?.message || e.response?.data?.result?.message || 'Failed to convert quotation to invoice.');
                } finally { this.isLoading = false; }
            }
        },
        async mounted() {
            this.isShimmerLoading = true;
            await this.loadLookups();
            await this.getDefaultGlSetup();
            this.getBusinessProfile();
            await this.getQuotations();
            this.recalculateQuotation();
            this.isShimmerLoading = false;
        }
    });

    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
