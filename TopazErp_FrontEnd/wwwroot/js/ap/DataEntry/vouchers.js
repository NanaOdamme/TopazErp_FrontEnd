(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const API_BASE_URL = 'http://localhost:5300';

    // Single axios instance: baseURL + cookies for every call (GET and POST).
    const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

    const ENDPOINTS = {
        vouchers: `${API_BASE_URL}/ApDataEntry/GetVouchers`,
        createVoucher: `${API_BASE_URL}/ApDataEntry/CreateVoucher`,
        updateVoucher: `${API_BASE_URL}/ApDataEntry/UpdateVoucher`,
        deleteVoucher: `${API_BASE_URL}/ApDataEntry/DeleteVoucher/`,
        invoices: `${API_BASE_URL}/ApDataEntry/GetInvoices`,
        suppliers: `${API_BASE_URL}/SharedResource/GetSuppliers`,
        currencies: `${API_BASE_URL}/SharedResource/GetCurrencys`,
        banks: `${API_BASE_URL}/SharedResource/GetBanks`,
        accounts: `${API_BASE_URL}/LedgerDataEntry/InitJournalEntry`,
        bankAccounts: `${API_BASE_URL}/LedgerSetups/GetBankAccounts`,
        taxLevies: `${API_BASE_URL}/SharedResource/GetTaxLevies`,
        defaultGlSetup: `${API_BASE_URL}/LedgerSetups/GetDefaultGlSetup`,
        businessProfile: `${API_BASE_URL}/SharedResource/GetBusinessProfile`
    };

    // MVC report page - lives on the web app, not on the API host
    const REPORT_URL = '/ApReports/PrintPaymentVoucher';

    const TAX_DESCRIPTIONS = ['VAT', 'NHIL', 'GETFL', 'COVID', 'CST'];
    const TAX_DESCRIPTIONS_NO_VAT = ['VAT', 'CST'];

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

    // Derives a grouping label from a date: "2026", or "No Date" when there is none.
    const yearOf = (value) => {
        const iso = loadedDate(value);
        return iso ? iso.slice(0, 4) : '';
    };

    const sameId = (a, b) =>
        a !== null && a !== undefined && b !== null && b !== undefined &&
        String(a).toLowerCase() === String(b).toLowerCase();

    const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
    const money = (value) => (parseFloat(value) || 0).toFixed(2);
    const round2 = (value) => Math.round(((parseFloat(value) || 0) + Number.EPSILON) * 100) / 100;
    const rate4 = (value) => (parseFloat(value) || 0).toFixed(4);

    const today = isoDate(new Date());

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
                theme1: '#383636',

                isLoading: false,
                isShimmerLoading: false,
                emptyGuid: EMPTY_GUID,

                /* ---------------- lookups ---------------- */
                suppliers: [],
                currencies: [],
                currencyList: [],
                banks: [],
                bankList: [],
                bankBranchList: [],
                accounts: [],
                accountsList: [],
                bankAccountList: [],
                taxLevyList: [],
                defaultCurrency: {},

                /* ---------------- registers ---------------- */
                voucherList: [],
                invoices: [],
                invoiceList: [],
                voucherDetailsMap: {},
                invoiceDetailsMap: {},

                /* ---------------- state ---------------- */
                isSettingVoucher: false,
                loadedVoucherId: '',
                loadedVoucherDetails: [],
                userIsEditingRate: false,

                /* ---------------- voucher header ---------------- */
                voucherId: '',
                voucherNumber: '',
                batchNumber: '',
                referenceNumber: '',
                voucherDescription: '',
                voucherEntryDate: today,
                paymentDate: today,
                isPosted: false,
                tenantId: '',

                /* ---------------- invoice ---------------- */
                invoiceId: '',
                invoiceNumber: '',
                invoiceDate: '',
                invoiceAmount: '0.00',
                invoiceEditList: [],
                filteredInvoices: [],
                invoiceDetailsList: [],
                totalInvoiceAmount: '0.00',
                balance: '0.00',
                liabilityAccountId: '',
                liabilityAccountCode: '',
                liabilityAccountName: '',
                supplierId: '',
                supplierName: '',
                accountNumber: '',
                minorName: '',

                /* ---------------- invoice currency ---------------- */
                currencyId: '',
                currencyName: '',
                currencyCode: '',
                buyRate: '0.0000',
                sellRate: '0.0000',

                /* ---------------- payment currency ---------------- */
                payCurrencyId: '',
                payCurrencyName: '',
                payCurrencyCode: '',
                payCurrencyBuyRate: '0.0000',
                payCurrencySellRate: '0.0000',
                isMultiCurrency: false,

                /* ---------------- bank / GL ---------------- */
                bankId: '',
                bankName: '',
                bankBranchId: '',
                bankBranchName: '',
                bankAccountId: '',
                bankAccountName: '',
                creditAccountId: '',
                creditAccountName: '',
                vatWithHoldAccountId: '',
                vatWithHoldAccountName: '',

                /* ---------------- mode of payment ---------------- */
                modeOfPayment: 'Cash',
                cash: true,
                cheque: false,
                chequeNumber: '',

                /* ---------------- tax levies ---------------- */
                vatInInvoice: false,
                isVatInclusive: true,
                invoiceTaxLevies: [],
                Vat: false,
                NHIL: false,
                GETFL: false,
                covid: false,
                cst: false,
                VatRate: '0.00',
                NHILRate: '0.00',
                GETFLRate: '0.00',
                covidRate: '0.00',
                cstRate: '0.00',
                vatAmount: '0.00',
                totalTaxAmount: '0.00',
                baseAmount: '0.00',
                baseAmount2: '0.00',

                /* ---------------- withholding ---------------- */
                isWithHolding: false,
                withHoldingRate: '0.00',
                isVatWithHolding: false,
                VatWithHeldRate: '0.00',
                withHeld: '0.00',
                vatWithheld: '0.00',
                total: '0.00',
                netAmount: '0.00',
                paymentAmount: '0.00'
            };
        },
        computed: {
            voucherColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, width: 74 },
                    { key: 'tenantId', label: 'Tenant ID', type: 'text', hidden: true, width: 74 },
                    { key: 'batchNumber', label: 'Batch #', type: 'text', width: 140, searchable: true },
                    { key: 'voucherNumber', label: 'Voucher No.', type: 'text', width: 160, searchable: true },
                    // Grouping key for the grid: group-header="voucherYear"
                    { key: 'voucherYear', label: 'Year', type: 'text', width: 90, searchable: true },
                    { key: 'voucherEntryDate', label: 'Entry Date', type: 'date', width: 140, searchable: true },
                    { key: 'paymentDate', label: 'Payment Date', type: 'date', width: 140, searchable: true },
                    { key: 'supplierName', label: 'Supplier', type: 'text', width: 220, searchable: true },
                    { key: 'invoiceNumber', label: 'Invoice', type: 'text', width: 150, searchable: true },
                    { key: 'payCurrencyName', label: 'Currency', type: 'text', width: 120, searchable: true },
                    { key: 'chequeNumber', label: 'Cheque No.', type: 'text', width: 130, searchable: true },
                    { key: 'paymentAmount', label: 'Payment', type: 'number', width: 140, decimals: 2 },
                    { key: 'netAmount', label: 'Net Amount', type: 'number', width: 140, decimals: 2 },
                    { key: 'isPosted', label: 'Posted', type: 'boolean', width: 100 }
                ];
            },
            voucherDetailsGrid() {
                return {
                    key: 'voucherDetails',
                    title: 'Voucher Entries',
                    columns: [
                        { key: 'id', label: 'ID', type: 'text', hidden: true },
                        { key: 'account', label: 'Account', type: 'text', width: 260, searchable: true },
                        { key: 'description', label: 'Description', type: 'text', width: 220, searchable: true },
                        { key: 'debitAmount', label: 'Debit', type: 'number', width: 140, decimals: 2 },
                        { key: 'creditAmount', label: 'Credit', type: 'number', width: 140, decimals: 2 },
                        { key: 'buyRate', label: 'Rate', type: 'number', width: 110, decimals: 4 }
                    ]
                };
            },
            invoiceColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, width: 74 },
                    { key: 'tenantId', label: 'Tenant ID', type: 'text', hidden: true, width: 74 },
                    { key: 'invoiceNumber', label: 'Invoice No.', type: 'text', width: 150, searchable: true },
                    { key: 'supplierName', label: 'Supplier', type: 'text', width: 200, searchable: true },
                    { key: 'currencyName', label: 'Currency', type: 'text', width: 110, searchable: true },
                    { key: 'buyRate', label: 'Rate', type: 'number', width: 110, decimals: 4 },
                    { key: 'totalInvoiceAmount', label: 'Total Amount', type: 'number', width: 150, decimals: 2 },
                    { key: 'liabilityAccountName', label: 'Liability G/L', type: 'text', width: 190, searchable: true },
                    { key: 'balance', label: 'Balance', type: 'number', width: 140, decimals: 2 },
                    { key: 'invoiceYear', label: 'Year', type: 'text', width: 90, searchable: true },
                    { key: 'invoiceDate', label: 'Invoice Date', type: 'date', width: 140, searchable: true }
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
            }
        },
        methods: {
            /* ==================================================================
             * SHELL
             * ================================================================== */
            scrollToAdd() {
                this.$nextTick(() => {
                    const element = document.querySelector('#add');
                    if (!element) {
                        console.error('Cannot find #add. Check where the div is rendered.');
                        return;
                    }
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            },
            toastHandler(type, message = 'An unexpected error occurred.') {
                if (typeof Swal === 'undefined') {
                    console.log(`[${type}] ${message}`);
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
            apiErrorMessage(error, fallback) {
                const data = error && error.response && error.response.data;
                if (!data) return error && error.message ? `${fallback} (${error.message})` : fallback;
                if (typeof data === 'string') return `${fallback} ${data}`.trim();
                const abpError = data.error && (data.error.message || data.error.details);
                return abpError || data.message || data.detail || data.title || fallback;
            },
            uuid() {
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                );
            },
            generateRefNo() {
                this.referenceNumber = Math.floor(100000 + Math.random() * 900000).toString();
            },
            formatDate(dateInput) {
                return isoDate(dateInput);
            },

            /* ==================================================================
             * DATA LOADING
             * ================================================================== */
            async fetchList(url, label, preferredKey = null) {
                try {
                    const response = await api.get(url);
                    const list = unwrapList(response.data, preferredKey);
                    return list.map(item => (item && item.Id && !item.id && typeof normalizeKeys === 'function') ? normalizeKeys(item) : item);
                } catch (error) {
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },

            async getSuppliers() {
                const list = await this.fetchList(ENDPOINTS.suppliers, 'suppliers');
                this.suppliers = list
                    .map(s => ({ ...s, name: (s.name || '').trim() }))
                    .filter(s => !s.statusName || s.statusName.trim().toLowerCase() === 'active')
                    .sort((a, b) => a.name.localeCompare(b.name));
                return this.suppliers;
            },

            async getCurrencies() {
                const list = await this.fetchList(ENDPOINTS.currencies, 'currencies');
                this.currencies = list.map(c => ({ ...c }));
                this.currencyList = this.currencies;

                this.defaultCurrency =
                    this.currencies.find(c => c.isDefault === true) ||
                    this.currencies.find(c => ['ghana cedis', 'ghana cedi'].includes(String(c.currencyName || '').trim().toLowerCase())) ||
                    {};

                if (!this.payCurrencyId && this.defaultCurrency.id) {
                    this.payCurrencyId = this.defaultCurrency.id;
                    this.onPayCurrencyChange();
                }
                return this.currencies;
            },

            async getBanks() {
                const list = await this.fetchList(ENDPOINTS.banks, 'banks');
                this.banks = list.map(b => ({ ...b }));
                this.bankList = this.banks;
                return this.banks;
            },

            async loadAccounts() {
                const rawAccounts = await this.fetchList(ENDPOINTS.accounts, 'accounts', 'accounts');

                let accounts = rawAccounts.map(a => ({
                    ...a,
                    accountIdentifier: a.accountIdentifier || `${a.accountNo ?? ''} - ${a.accountName ?? a.name ?? ''}`.trim().replace(/^ - /, ''),
                    name: a.accountName || a.name,
                    accountName: a.accountName || a.name
                }));

                if (!accounts.length) {
                    accounts = [{ id: EMPTY_GUID, accountNo: '', accountName: 'No Ledger Available', accountIdentifier: 'No Ledger Available' }];
                }

                accounts.sort((a, b) => Number(a.accountNo || 0) - Number(b.accountNo || 0));

                this.accounts = accounts;
                this.accountsList = accounts;
                return this.accounts;
            },

            async getBankAccounts() {
                const list = await this.fetchList(ENDPOINTS.bankAccounts, 'bank accounts');
                this.bankAccountList = list.map(b => ({ ...b }));
                return this.bankAccountList;
            },

            async getTaxLevies() {
                const list = await this.fetchList(ENDPOINTS.taxLevies, 'tax levies');

                this.taxLevyList = list.map(tax => ({
                    ...tax,
                    name: (tax.name || '').trim(),
                    type: (tax.type || '').trim(),
                    rate: money(tax.rate),
                    isApplied: tax.isApplied === true,
                    defaultIsApplied: tax.isApplied === true,
                    isDisabled: false,
                    amount: null
                }));

                const findRate = (name) => {
                    const tax = this.taxLevyList.find(t => String(t.name).toLowerCase() === name);
                    return tax ? money(tax.rate) : '0.00';
                };

                this.VatRate = findRate('vat');
                this.NHILRate = findRate('nhil');
                this.GETFLRate = findRate('getfl');
                this.covidRate = findRate('covid');
                this.cstRate = findRate('cst');

                this.syncTaxFlags();
                return this.taxLevyList;
            },

            async getBusinessProfile() {
                try {
                    const response = await api.get(ENDPOINTS.businessProfile);
                    if (response.data) {
                        this.isVatInclusive = response.data.isTaxLeviesInclusive === true;
                    }
                } catch (error) {
                    console.log(error);
                }
            },

            async getDefaultGlSetup() {
                try {
                    const response = await api.get(ENDPOINTS.defaultGlSetup);
                    const setup = response.data || {};

                    if (!this.voucherId) {
                        if (setup.vatPaidAccountId) this.vatWithHoldAccountId = setup.vatPaidAccountId;
                        if (setup.accountPayablesBankAccountId) this.bankAccountId = setup.accountPayablesBankAccountId;
                        if (setup.withholdingTaxAccountId) this.creditAccountId = setup.withholdingTaxAccountId;
                    }
                } catch (error) {
                    console.log(error);
                    this.toastHandler('error', 'Unable to get default GL numbers.');
                }
            },

            async getInvoices() {
                const list = await this.fetchList(ENDPOINTS.invoices, 'AP invoices');
                if (list.length || !this.invoiceList.length) this.invoices = list;

                this.invoiceList = (this.invoices || []).map(invoice => {
                    const details = Array.isArray(invoice.invoiceDetails) ? invoice.invoiceDetails : [];

                    return {
                        ...invoice,
                        invoiceId: invoice.id,
                        invoiceDate: loadedDate(invoice.invoiceDate),
                        invoiceYear: yearOf(invoice.invoiceDate) || 'No Date',
                        displayText: `${invoice.supplierName || ''} - ${invoice.invoiceNumber || ''}`.trim(),
                        invoiceDetails: details.map(detail => ({ ...detail, invoiceId: invoice.id })),
                        baseAmount: details
                            .filter(detail => !TAX_DESCRIPTIONS.includes(String(detail.description || '').toUpperCase()))
                            .reduce((sum, detail) => sum + (parseFloat(detail.subTotal) || 0), 0)
                            .toFixed(2)
                    };
                }).sort((a, b) => String(a.invoiceNumber || '').localeCompare(String(b.invoiceNumber || '')));

                this.invoiceDetailsMap = {};
                this.invoiceList.forEach(invoice => {
                    this.invoiceDetailsMap[invoice.id] = invoice.invoiceDetails;
                });

                this.invoiceEditList = this.invoiceList.filter(invoice =>
                    invoice.isPosted === true &&
                    invoice.isCanceled !== true &&
                    (parseFloat(invoice.balance) || 0) > 0
                );

                return this.invoiceList;
            },

            async getVouchers() {
                const list = await this.fetchList(ENDPOINTS.vouchers, 'vouchers');

                this.voucherList = list.map(voucher => {
                    const entryDate = loadedDate(voucher.voucherEntryDate);
                    const payDate = loadedDate(voucher.paymentDate);
                    const voucherDate = entryDate

                    const row = {
                        ...voucher,
                        voucherEntryDate: entryDate,
                        paymentDate: payDate,
                        voucherDate,
                        voucherYear: yearOf(voucherDate) || 'No Date',
                        displayText: `${voucher.supplierName || ''} - ${voucher.voucherNumber || ''}`.trim()
                    };
                    row.voucherDetails = this.buildVoucherEntries(row);
                    return row;
                }).sort((a, b) => {
                    // Group key first so each year stays one contiguous block (newest year first)
                    const yearKey = (row) => (/^\d{4}$/.test(row.voucherYear) ? row.voucherYear : '0000');
                    const byYear = yearKey(b).localeCompare(yearKey(a));
                    if (byYear !== 0) return byYear;
                    // Then newest voucher inside the year
                    return String(b.voucherDate || '').localeCompare(String(a.voucherDate || ''));
                });

                this.voucherDetailsMap = {};
                this.voucherList.forEach(voucher => {
                    this.voucherDetailsMap[voucher.id] = voucher.voucherDetails;
                });

                return this.voucherList;
            },

            // Double-entry preview shown in the register's child grid
            buildVoucherEntries(voucher) {
                const entries = [];
                const rate = parseFloat(voucher.buyRate) || 0;

                entries.push({
                    id: `${voucher.id}-liability`,
                    account: voucher.liabilityAccountName,
                    description: voucher.description,
                    debitAmount: parseFloat(voucher.paymentAmount) || 0,
                    creditAmount: 0,
                    buyRate: rate
                });

                entries.push({
                    id: `${voucher.id}-bank`,
                    account: voucher.bankAccountName,
                    description: voucher.description,
                    debitAmount: 0,
                    creditAmount: parseFloat(voucher.netAmount) || 0,
                    buyRate: rate
                });

                const vatWithHeldAmount = parseFloat(voucher.vatWithHeld ?? voucher.vatWithheld) || 0;

                if (vatWithHeldAmount > 0) {
                    entries.push({
                        id: `${voucher.id}-vat`,
                        account: voucher.vatWithHoldAccountName,
                        description: 'Withholding VAT',
                        debitAmount: 0,
                        creditAmount: vatWithHeldAmount,
                        buyRate: rate
                    });
                }

                if ((parseFloat(voucher.withHeld) || 0) > 0) {
                    entries.push({
                        id: `${voucher.id}-wht`,
                        account: voucher.creditAccountName,
                        description: 'Withholding Amount',
                        debitAmount: 0,
                        creditAmount: parseFloat(voucher.withHeld) || 0,
                        referenceNumber: voucher.invoiceNumber,
                        buyRate: rate
                    });
                }

                return entries;
            },

            /* ==================================================================
             * LOOKUP HELPERS
             * ================================================================== */
            getSupplierDetails(id) {
                return (this.suppliers || []).find(a => sameId(a.id, id));
            },
            getCurrencyDetails(id) {
                return (this.currencies || []).find(a => sameId(a.id, id));
            },
            getBankDetails(id) {
                return (this.banks || []).find(a => sameId(a.id, id));
            },
            getBankBranchDetails(id) {
                return (this.bankBranchList || []).find(a => sameId(a.id, id));
            },
            getAccountDetails(id) {
                return (this.accounts || []).find(a => sameId(a.id, id));
            },
            getInvoiceDetails(id) {
                return (this.invoiceList || []).find(a => sameId(a.id, id));
            },
            getVoucherDetails(id) {
                return (this.voucherList || []).find(a => sameId(a.id, id));
            },
            getSelectedVoucherRow() {
                const grid = this.$refs.vouchers;
                const rows = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];
                return Array.isArray(rows) && rows.length ? rows[0] : null;
            },
            async findVoucherById(id) {
                if (!id) return null;
                let row = (this.voucherList || []).find(v => sameId(v.id, id));
                if (row) return row;
                await this.getVouchers();
                return (this.voucherList || []).find(v => sameId(v.id, id)) || null;
            },
            ensureInvoiceOption(invoice) {
                if (!invoice || !invoice.id) return;
                if ((this.invoiceEditList || []).some(i => sameId(i.id, invoice.id))) return;
                this.invoiceEditList = [...(this.invoiceEditList || []), invoice];
            },

            /* ==================================================================
             * MODE OF PAYMENT
             * ================================================================== */
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

            onPayCurrencyChange() {
                const currency = this.getCurrencyDetails(this.payCurrencyId);
                if (!currency) return;

                this.payCurrencyName = currency.currencyName;
                this.payCurrencyCode = currency.currencyCode;
                this.payCurrencyBuyRate = rate4(currency.buyRate);
                this.payCurrencySellRate = rate4(currency.sellRate);

                this.isMultiCurrency = this.defaultCurrency && this.defaultCurrency.id
                    ? !sameId(this.payCurrencyId, this.defaultCurrency.id)
                    : currency.isDefault !== true;
            },

            onBankChange() {
                const bank = this.getBankDetails(this.bankId);

                this.bankName = bank ? bank.name : '';
                this.bankBranchList = bank && Array.isArray(bank.bankBranches)
                    ? [...bank.bankBranches].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
                    : [];

                if (this.bankBranchId && !this.bankBranchList.some(b => sameId(b.id, this.bankBranchId))) {
                    this.bankBranchId = '';
                    this.bankBranchName = '';
                }
            },

            syncBankFromAccount(accountId) {
                if (!accountId || sameId(accountId, this.emptyGuid)) {
                    this.bankId = '';
                    this.bankName = '';
                    this.bankBranchId = '';
                    this.bankBranchName = '';
                    this.bankBranchList = [];
                    return;
                }

                const account = this.getAccountDetails(accountId);
                if (account) {
                    this.bankAccountName = account.accountIdentifier || `${account.accountNo} - ${account.accountName}`;
                }

                const bankAccount = (this.bankAccountList || []).find(ba => sameId(ba.accountId, accountId));
                if (!bankAccount) return;

                const bank = (this.bankList || []).find(b =>
                    String(b.name || '').toLowerCase() === String(bankAccount.bankName || '').toLowerCase()
                );
                if (!bank) return;

                this.bankId = bank.id;
                this.onBankChange();

                const branch = (this.bankBranchList || []).find(br => sameId(br.id, bankAccount.bankBranchId));
                if (branch) {
                    this.bankBranchId = branch.id;
                    this.bankBranchName = branch.name;
                }
            },

            /* ==================================================================
             * TAX LEVIES
             * ================================================================== */
            syncTaxFlags() {
                const applied = (name) => (this.taxLevyList || []).find(
                    t => String(t.name).toLowerCase() === name
                )?.isApplied === true;

                this.Vat = applied('vat');
                this.NHIL = applied('nhil');
                this.GETFL = applied('getfl');
                this.covid = applied('covid');
                this.cst = applied('cst');
            },

            toggleTaxLevy(taxId) {
                const selectedTax = (this.taxLevyList || []).find(t => sameId(t.id, taxId));
                if (!selectedTax) return;

                const type = String(selectedTax.type || '').toLowerCase();
                const isCST = String(selectedTax.name).toUpperCase() === 'CST' && type === 'others';
                const isVAT = String(selectedTax.name).toUpperCase() === 'VAT' && type === 'vat';

                this.taxLevyList = this.taxLevyList.map(tax => {
                    if (isCST || isVAT) {
                        const isOther =
                            (String(tax.name).toUpperCase() === 'CST' && String(tax.type || '').toLowerCase() === 'others') ||
                            (String(tax.name).toUpperCase() === 'VAT' && String(tax.type || '').toLowerCase() === 'vat');

                        if (isOther) {
                            return { ...tax, isApplied: sameId(tax.id, taxId) ? !selectedTax.isApplied : false };
                        }
                    }
                    return sameId(tax.id, taxId) ? { ...tax, isApplied: !tax.isApplied } : tax;
                });

                this.syncTaxFlags();
                this.calculateTotalTaxAmount();
            },

            // Rates of every levy that is currently switched on (percent)
            appliedTaxRates() {
                const rate = (isOn, value) => (isOn ? (parseFloat(value) || 0) : 0);

                return {
                    vat: rate(this.Vat, this.VatRate),
                    nhil: rate(this.NHIL, this.NHILRate),
                    getfl: rate(this.GETFL, this.GETFLRate),
                    covid: rate(this.covid, this.covidRate),
                    cst: rate(this.cst, this.cstRate)
                };
            },

            calculateTotalTaxAmount() {
                const rates = this.appliedTaxRates();
                const totalRate = Object.values(rates).reduce((sum, r) => sum + r, 0);

                if (this.isVatInclusive) {
                    /* ------------------------------------------------------------------
                     * VAT INCLUSIVE
                     * The invoice total already contains the levies, so each levy is
                     * extracted out of it instead of being added on top.
                     *
                     *   gross 4000, VAT 15% + NHIL 2.5% + GETFL 2.5%  ->  totalRate 20
                     *   VAT   = 4000 * 15   / 120 = 500.00
                     *   NHIL  = 4000 * 2.5  / 120 =  83.33
                     *   GETFL = 4000 * 2.5  / 120 =  83.33
                     *   total tax   = 666.66
                     *   base amount = 4000 - 666.66 = 3333.34
                     * ------------------------------------------------------------------ */
                    const gross = parseFloat(this.totalInvoiceAmount) || 0;
                    const divisor = 100 + totalRate;

                    const levy = (rate) => (totalRate > 0 && gross > 0 ? round2(gross * rate / divisor) : 0);

                    const vatAmount = levy(rates.vat);
                    const taxAmount = round2(
                        vatAmount +
                        levy(rates.nhil) +
                        levy(rates.getfl) +
                        levy(rates.covid) +
                        levy(rates.cst)
                    );

                    this.vatAmount = vatAmount.toFixed(2);
                    this.totalTaxAmount = taxAmount.toFixed(2);
                    this.baseAmount = round2(gross - taxAmount).toFixed(2);

                    // Live amounts on the levy buttons
                    this.taxLevyList = (this.taxLevyList || []).map(tax => {
                        const key = String(tax.name || '').toLowerCase();
                        if (!(key in rates)) return tax;
                        return { ...tax, amount: tax.isApplied ? levy(rates[key]).toFixed(2) : null };
                    });

                    return;
                }

                /* ------------------------------------------------------------------
                 * VAT EXCLUSIVE - levies are added on top of the base amount
                 * ------------------------------------------------------------------ */
                const subTotal = Array.isArray(this.invoiceDetailsList)
                    ? this.invoiceDetailsList.reduce((acc, detail) => {
                        if (TAX_DESCRIPTIONS.includes(String(detail.description || '').toUpperCase())) return acc;
                        return acc + (parseFloat(detail.subTotal) || 0);
                    }, 0)
                    : 0;

                const pct = (rate) => round2(subTotal * rate / 100);

                const vatAmount = pct(rates.vat);
                const taxAmount = round2(
                    vatAmount + pct(rates.nhil) + pct(rates.getfl) + pct(rates.covid) + pct(rates.cst)
                );

                this.vatAmount = vatAmount.toFixed(2);
                this.totalTaxAmount = taxAmount.toFixed(2);
                this.baseAmount = subTotal.toFixed(2);
            },

            // Inclusive: every levy stays clickable. Exclusive: only levies on the invoice.
            syncTaxLevyAvailability() {
                const levies = this.invoiceTaxLevies || [];
                const includeAll = this.isVatInclusive === true;

                this.taxLevyList = (this.taxLevyList || []).map(tax => {
                    const invoiceTax = levies.find(v =>
                        String(v.name || '').toUpperCase() === String(tax.name || '').toUpperCase()
                    );

                    return {
                        ...tax,
                        isDisabled: includeAll ? false : (levies.length === 0 || !invoiceTax),
                        amount: includeAll
                            ? tax.amount
                            : (invoiceTax && String(tax.name).toLowerCase() !== 'vat'
                                ? money(invoiceTax.amount)
                                : null)
                    };
                });
            },

            /* ==================================================================
             * WITHHOLDING / TOTALS
             * ================================================================== */
            calculateWithHeldDetails() {
                const paymentAmount = parseFloat(this.paymentAmount) || 0;
                const taxableBase = (parseFloat(this.totalInvoiceAmount) || 0) - (parseFloat(this.totalTaxAmount) || 0);

                this.total = paymentAmount.toFixed(2);
                this.withHeld = '0.00';
                this.vatWithheld = '0.00';

                if (this.isWithHolding) {
                    this.withHeld = (taxableBase * (parseFloat(this.withHoldingRate) || 0) / 100).toFixed(2);
                }

                if (this.isVatWithHolding) {
                    this.vatWithheld = (taxableBase * (parseFloat(this.VatWithHeldRate) || 0) / 100).toFixed(2);
                }

                this.netAmount = (
                    paymentAmount -
                    (parseFloat(this.withHeld) || 0) -
                    (parseFloat(this.vatWithheld) || 0)
                ).toFixed(2);

                if (!this.isWithHolding && !this.isVatWithHolding) {
                    this.withHeld = '0.00';
                    this.vatWithheld = '0.00';
                }
            },

            /* ==================================================================
             * INVOICE SELECTION
             * ================================================================== */
            onInvoiceChange() {
                const value = this.invoiceId;

                if (!value) {
                    this.filteredInvoices = [];
                    return;
                }

                // Block only when ANOTHER active, unposted voucher already exists for this invoice
                const openVoucher = (this.voucherList || []).find(voucher =>
                    sameId(voucher.invoiceId, value) &&
                    voucher.isPosted !== true &&
                    voucher.isDeleted !== true &&
                    !sameId(voucher.id, this.voucherId)
                );

                if (openVoucher) {
                    this.toastHandler('warning', 'Please post the outstanding payment for this invoice before proceeding.');
                    this.invoiceId = '';
                    this.filteredInvoices = [];
                    return;
                }

                this.setCurrentInvoice(value);
            },

            setCurrentInvoice(invoiceOrId) {
                const invoice = (invoiceOrId && typeof invoiceOrId === 'object')
                    ? invoiceOrId
                    : this.getInvoiceDetails(invoiceOrId || this.invoiceId);

                if (!invoice) return;

                const supplier = this.getSupplierDetails(invoice.supplierId);

                this.invoiceId = invoice.id;
                this.invoiceNumber = invoice.invoiceNumber;
                this.supplierId = invoice.supplierId;
                this.supplierName = invoice.supplierName || (supplier && supplier.name) || '';
                this.accountNumber = invoice.accountNumber || (supplier && supplier.accountNumber) || '';
                this.currencyId = invoice.currencyId;
                this.currencyName = invoice.currencyName;
                this.currencyCode = invoice.currencyCode;
                this.buyRate = rate4(invoice.buyRate);
                this.sellRate = rate4(invoice.sellRate);
                this.minorName = invoice.minorName || '';
                this.invoiceAmount = money(invoice.totalInvoiceAmount);
                this.totalInvoiceAmount = money(invoice.totalInvoiceAmount);
                this.balance = money(invoice.balance);
                this.liabilityAccountId = invoice.liabilityAccountId;
                this.liabilityAccountCode = invoice.liabilityAccountCode;
                this.liabilityAccountName = invoice.liabilityAccountName;
                this.invoiceDate = loadedDate(invoice.invoiceDate);
                this.invoiceDetailsList = Array.isArray(invoice.invoiceDetails) ? invoice.invoiceDetails : [];

                if (!this.voucherId) {
                    this.paymentAmount = money(invoice.balance);
                }

                this.voucherDescription = this.invoiceDetailsList
                    .map(d => d.description)
                    .filter(Boolean)
                    .join(', ');

                this.filteredInvoices = [{ ...invoice, invoiceDetails: this.invoiceDetailsList }];
                this.ensureInvoiceOption(invoice);

                // ---- tax levies carried on the invoice ----
                const levies = Array.isArray(invoice.invoiceTaxLevies) ? invoice.invoiceTaxLevies : [];
                this.invoiceTaxLevies = levies;
                this.vatInInvoice = levies.some(v => String(v.name || '').toUpperCase() === 'VAT');

                if (this.isVatInclusive) {
                    // Inclusive: the user may add ANY levy, so nothing is pre-applied or locked.
                    this.syncTaxLevyAvailability();
                } else {
                    this.taxLevyList = (this.taxLevyList || []).map(tax => {
                        const invoiceTax = levies.find(v => String(v.name || '').toUpperCase() === String(tax.name).toUpperCase());
                        return {
                            ...tax,
                            isApplied: !!invoiceTax,
                            isDisabled: levies.length === 0 || !invoiceTax,
                            amount: (invoiceTax && String(tax.name).toLowerCase() !== 'vat')
                                ? money(invoiceTax.amount)
                                : null
                        };
                    });
                }

                if (invoice.vatRate !== undefined && invoice.vatRate !== null) {
                    this.VatRate = money(invoice.vatRate);
                }

                // ---- base amounts ----
                const details = this.invoiceDetailsList;

                this.baseAmount2 = details
                    .filter(detail => !TAX_DESCRIPTIONS_NO_VAT.includes(String(detail.description || '').toUpperCase()))
                    .reduce((sum, detail) => sum + (parseFloat(detail.subTotal) || 0), 0)
                    .toFixed(2);

                if (this.isVatInclusive) {
                    // Levies are extracted from the invoice total (4000 -> 3333.34 + 666.66)
                    this.calculateTotalTaxAmount();
                } else {
                    const taxSum = levies.reduce((sum, tax) => sum + (parseFloat(tax.amount) || 0), 0);
                    this.totalTaxAmount = taxSum.toFixed(2);

                    if (invoice.vatAmount !== undefined && invoice.vatAmount !== null) {
                        this.vatAmount = money(invoice.vatAmount);
                    }

                    this.baseAmount = details
                        .filter(detail => !TAX_DESCRIPTIONS.includes(String(detail.description || '').toUpperCase()))
                        .reduce((sum, detail) => sum + (parseFloat(detail.subTotal) || 0), 0)
                        .toFixed(2);
                }

                this.calculateWithHeldDetails();
            },

            /* ==================================================================
             * EDIT: load an existing voucher into the form
             * ================================================================== */
            async setCurrentVoucher(voucher = null) {
                if (this.isSettingVoucher) return;

                this.scrollToAdd();

                let info = null;
                if (voucher && typeof voucher === 'object') {
                    info = voucher;
                } else if (typeof voucher === 'string') {
                    info = this.getVoucherDetails(voucher);
                } else {
                    info = this.getVoucherDetails(this.voucherId) || this.getSelectedVoucherRow();
                }

                if (!info) {
                    this.toastHandler('warning', 'Please select a voucher first.');
                    return;
                }

                // Suppress watchers while hydrating
                this.isSettingVoucher = true;

                try {
                    this.voucherId = info.id;
                    this.tenantId = info.tenantId || '';
                    this.batchNumber = info.batchNumber || '';
                    this.voucherNumber = info.voucherNumber || '';
                    this.isPosted = info.isPosted === true;
                    this.referenceNumber = info.referenceNumber || this.referenceNumber;
                    this.voucherDescription = info.description || '';
                    this.voucherEntryDate = loadedDate(info.voucherEntryDate) || this.voucherEntryDate;
                    this.paymentDate = loadedDate(info.paymentDate) || this.paymentDate;

                    this.invoiceId = info.invoiceId || '';
                    this.invoiceNumber = info.invoiceNumber || '';
                    this.invoiceDate = loadedDate(info.invoiceDate);
                    this.invoiceAmount = money(info.invoiceAmount);
                    this.totalInvoiceAmount = money(info.invoiceAmount || info.totalInvoiceAmount);
                    this.balance = money(info.balance);

                    this.supplierId = info.supplierId || '';
                    this.supplierName = info.supplierName || (this.getSupplierDetails(info.supplierId) || {}).name || '';
                    this.accountNumber = info.accountNumber || '';
                    this.minorName = info.minorName || '';

                    this.currencyId = info.currencyId || '';
                    this.currencyName = info.currencyName || '';
                    this.currencyCode = info.currencyCode || '';
                    this.buyRate = rate4(info.buyRate);
                    this.sellRate = rate4(info.sellRate);

                    this.liabilityAccountId = info.liabilityAccountId || '';
                    this.liabilityAccountCode = info.liabilityAccountCode || '';
                    this.liabilityAccountName = info.liabilityAccountName || '';

                    this.payCurrencyId = info.payCurrencyId || this.payCurrencyId;
                    this.payCurrencyName = info.payCurrencyName || '';
                    this.payCurrencyCode = info.payCurrencyCode || '';
                    this.payCurrencyBuyRate = rate4(info.payCurrencyBuyRate);
                    this.payCurrencySellRate = rate4(info.payCurrencySellRate);
                    this.isMultiCurrency = info.isMultiCurrency === true;

                    this.modeOfPayment = info.modeOfPayment || 'Cash';
                    this.cash = this.modeOfPayment === 'Cash';
                    this.cheque = this.modeOfPayment === 'Cheque';
                    this.chequeNumber = info.chequeNumber || '';

                    this.paymentAmount = money(info.paymentAmount);
                    this.total = money(info.total);
                    this.withHeld = money(info.withHeld);
                    this.vatWithheld = money(info.vatWithHeld ?? info.vatWithheld);
                    this.netAmount = money(info.netAmount);
                    this.vatAmount = money(info.vatAmount);
                    this.totalTaxAmount = money(info.totalTaxAmount);

                    this.isWithHolding = info.isWithHolding === true;
                    this.isVatWithHolding = info.isVatWithHolding === true;
                    this.withHoldingRate = money(info.withHoldingRate);
                    this.VatWithHeldRate = money(info.VatWithHeldRate);

                    this.bankAccountId = info.bankAccountId || '';
                    this.bankAccountName = info.bankAccountName || '';
                    this.creditAccountId = info.creditAccountId || '';
                    this.creditAccountName = info.creditAccountName || '';
                    this.vatWithHoldAccountId = info.vatWithHoldAccountId || '';
                    this.vatWithHoldAccountName = info.vatWithHoldAccountName || '';

                    // Bank / branch: populate branch options BEFORE assigning the branch id
                    this.bankId = info.bankId || '';
                    this.bankBranchId = '';
                    this.bankBranchName = '';
                    if (this.bankId) this.onBankChange();
                    this.bankName = info.bankName || this.bankName;

                    const branchId = info.bankBranchId || '';
                    if (branchId) {
                        this.bankBranchId = branchId;
                        const branch = this.getBankBranchDetails(branchId);
                        this.bankBranchName = info.bankBranchName || (branch && branch.name) || '';
                    }

                    // Tax levy flags/rates of the voucher
                    this.Vat = info.vat === true;
                    this.NHIL = info.nhil === true;
                    this.GETFL = info.getfl === true;
                    this.covid = info.covid === true;
                    this.cst = info.cst === true;

                    this.taxLevyList = (this.taxLevyList || []).map(tax => {
                        switch (String(tax.name).toLowerCase()) {
                            case 'vat': return { ...tax, isApplied: this.Vat, isDisabled: false };
                            case 'nhil': return { ...tax, isApplied: this.NHIL, isDisabled: false };
                            case 'getfl': return { ...tax, isApplied: this.GETFL, isDisabled: false };
                            case 'covid': return { ...tax, isApplied: this.covid, isDisabled: false };
                            case 'cst': return { ...tax, isApplied: this.cst, isDisabled: false };
                            default: return tax;
                        }
                    });

                    const rateKeys = [
                        ['vat', 'VatRate'],
                        ['nhil', 'NHILRate'],
                        ['getfl', 'GETFLRate'],
                        ['covid', 'covidRate'],
                        ['cst', 'cstRate']
                    ];

                    rateKeys.forEach(([taxName, rateKey]) => {
                        const voucherRate = parseFloat(info[rateKey]);
                        if (!voucherRate) {
                            const tax = (this.taxLevyList || []).find(t => String(t.name).toLowerCase() === taxName);
                            this[rateKey] = tax ? money(tax.rate) : '0.00';
                        } else {
                            this[rateKey] = voucherRate.toFixed(2);
                        }
                    });

                    // Invoice rows shown in the invoice grid
                    const invoice = this.getInvoiceDetails(info.invoiceId);
                    if (invoice) {
                        this.invoiceDetailsList = invoice.invoiceDetails || [];
                        this.filteredInvoices = [{ ...invoice }];
                        this.ensureInvoiceOption(invoice);
                    } else if (info.invoiceId) {
                        // The invoice is closed/paid - still show it so the form makes sense
                        const fallback = {
                            id: info.invoiceId,
                            invoiceNumber: info.invoiceNumber,
                            supplierName: info.supplierName,
                            supplierId: info.supplierId,
                            currencyId: info.currencyId,
                            currencyName: info.currencyName,
                            buyRate: parseFloat(info.buyRate) || 0,
                            totalInvoiceAmount: parseFloat(info.invoiceAmount) || 0,
                            liabilityAccountName: info.liabilityAccountName,
                            balance: parseFloat(info.balance) || 0,
                            invoiceDate: loadedDate(info.invoiceDate),
                            invoiceYear: yearOf(info.invoiceDate) || 'No Date',
                            displayText: `${info.supplierName || ''} - ${info.invoiceNumber || ''}`.trim(),
                            invoiceDetails: []
                        };
                        this.invoiceDetailsList = [];
                        this.filteredInvoices = [fallback];
                        this.ensureInvoiceOption(fallback);
                    } else {
                        this.invoiceDetailsList = [];
                        this.filteredInvoices = [];
                    }

                    this.loadedVoucherDetails = Array.isArray(info.details) ? info.details : [];
                    this.loadedVoucherId = info.id;
                } catch (error) {
                    console.error('setCurrentVoucher failed:', error);
                    this.toastHandler('error', 'Unable to load the voucher details.');
                } finally {
                    await this.$nextTick();
                    this.isSettingVoucher = false;

                    if (this.isVatInclusive) this.calculateTotalTaxAmount();
                    this.calculateWithHeldDetails();
                }
            },

            /* ==================================================================
             * NEW / RESET
             * ================================================================== */
            resetVoucherFields() {
                this.voucherId = '';
                this.loadedVoucherId = '';
                this.loadedVoucherDetails = [];
                this.tenantId = '';
                this.voucherNumber = '';
                this.batchNumber = '';
                this.isPosted = false;
                this.voucherDescription = '';
                this.voucherEntryDate = isoDate(new Date());
                this.paymentDate = isoDate(new Date());

                this.invoiceId = '';
                this.invoiceNumber = '';
                this.invoiceDate = '';
                this.invoiceAmount = '0.00';
                this.totalInvoiceAmount = '0.00';
                this.balance = '0.00';
                this.filteredInvoices = [];
                this.invoiceDetailsList = [];
                this.liabilityAccountId = '';
                this.liabilityAccountCode = '';
                this.liabilityAccountName = '';

                this.supplierId = '';
                this.supplierName = '';
                this.accountNumber = '';

                this.currencyId = '';
                this.currencyName = '';
                this.currencyCode = '';
                this.buyRate = '0.0000';
                this.sellRate = '0.0000';

                this.bankId = '';
                this.bankName = '';
                this.bankBranchId = '';
                this.bankBranchName = '';
                this.bankBranchList = [];

                this.modeOfPayment = 'Cash';
                this.cash = true;
                this.cheque = false;
                this.chequeNumber = '';

                this.paymentAmount = '0.00';
                this.total = '0.00';
                this.withHeld = '0.00';
                this.vatWithheld = '0.00';
                this.netAmount = '0.00';

                this.isWithHolding = false;
                this.isVatWithHolding = false;
                this.withHoldingRate = '0.00';
                this.VatWithHeldRate = '0.00';

                this.vatAmount = '0.00';
                this.totalTaxAmount = '0.00';
                this.baseAmount = '0.00';
                this.baseAmount2 = '0.00';
                this.vatInInvoice = false;
                this.invoiceTaxLevies = [];

                this.taxLevyList = (this.taxLevyList || []).map(tax => ({
                    ...tax,
                    isApplied: tax.defaultIsApplied === true,
                    isDisabled: false,
                    amount: null
                }));
                this.syncTaxFlags();

                this.bankAccountId = '';
                this.bankAccountName = '';
                this.creditAccountId = '';
                this.creditAccountName = '';
                this.vatWithHoldAccountId = '';
                this.vatWithHoldAccountName = '';

                this.generateRefNo();
                this.getDefaultGlSetup();

                if (this.payCurrencyId) this.onPayCurrencyChange();
            },

            newVoucher() {
                this.resetVoucherFields();
                this.scrollToAdd();
            },

            clearForm() {
                this.newVoucher();
            },

            /* ==================================================================
             * SAVE
             * ================================================================== */
            buildVoucherPayload() {
                const payload = {};
                const invoice = this.getInvoiceDetails(this.invoiceId);

                payload.voucherNumber = this.voucherNumber || '0';
                payload.chequeNumber = this.chequeNumber;
                payload.checkNumber = this.chequeNumber; // legacy name kept for the existing API contract

                if (invoice) {
                    const details = Array.isArray(invoice.invoiceDetails) ? invoice.invoiceDetails : [];

                    payload.invoiceId = invoice.id;
                    payload.invoiceNumber = invoice.invoiceNumber;
                    payload.invoiceAmount = invoice.totalInvoiceAmount;
                    payload.invoiceDate = loadedDate(invoice.invoiceDate) || this.invoiceDate;
                    payload.currencyId = invoice.currencyId;
                    payload.currencyName = invoice.currencyName;
                    payload.currencyCode = invoice.currencyCode;
                    payload.buyRate = parseFloat(invoice.buyRate) || 1;
                    payload.sellRate = invoice.sellRate;
                    payload.balance = invoice.balance;
                    payload.liabilityAccountId = invoice.liabilityAccountId;
                    payload.liabilityAccountCode = invoice.liabilityAccountCode;
                    payload.liabilityAccountName = invoice.liabilityAccountName;
                    payload.supplierId = invoice.supplierId;
                    payload.supplierName = invoice.supplierName || this.supplierName;
                    payload.accountNumber = invoice.accountNumber || this.accountNumber;

                    payload.details = details.map(detail => ({
                        id: this.uuid(),
                        description: detail.description || 'N/A',
                        amount: detail.subTotal || 0,
                        isWithHolding: false
                    }));
                } else {
                    // Editing a voucher whose invoice is no longer in the open-invoice list
                    payload.invoiceId = this.invoiceId;
                    payload.invoiceNumber = this.invoiceNumber;
                    payload.invoiceAmount = this.invoiceAmount;
                    payload.invoiceDate = this.invoiceDate;
                    payload.currencyId = this.currencyId;
                    payload.currencyName = this.currencyName;
                    payload.currencyCode = this.currencyCode;
                    payload.buyRate = parseFloat(this.buyRate) || 1;
                    payload.sellRate = this.sellRate;
                    payload.balance = this.balance;
                    payload.liabilityAccountId = this.liabilityAccountId;
                    payload.liabilityAccountCode = this.liabilityAccountCode;
                    payload.liabilityAccountName = this.liabilityAccountName;
                    payload.supplierId = this.supplierId;
                    payload.supplierName = this.supplierName;
                    payload.accountNumber = this.accountNumber;

                    // Keep the voucher's existing detail lines instead of dropping them
                    const savedDetails = Array.isArray(this.loadedVoucherDetails) ? this.loadedVoucherDetails : [];
                    payload.details = savedDetails.map(detail => ({
                        id: detail.id || this.uuid(),
                        description: detail.description || 'N/A',
                        amount: detail.amount || 0,
                        isWithHolding: detail.isWithHolding === true
                    }));
                }

                const currency = this.getCurrencyDetails(this.payCurrencyId);
                payload.payCurrencyId = this.payCurrencyId;
                payload.payCurrencyName = currency ? currency.currencyName : this.payCurrencyName;
                payload.payCurrencyCode = currency ? currency.currencyCode : this.payCurrencyCode;
                payload.minorName = currency ? currency.minorName : this.minorName;
                payload.payCurrencyBuyRate = parseFloat(this.payCurrencyBuyRate) || 1;
                payload.payCurrencySellRate = currency ? currency.sellRate : this.payCurrencySellRate;

                const bank = this.getBankDetails(this.bankId);
                payload.bankId = bank ? bank.id : this.emptyGuid;
                payload.bankName = bank ? bank.name : '';

                const branch = this.getBankBranchDetails(this.bankBranchId);
                payload.bankBranchId = branch ? branch.id : this.emptyGuid;
                payload.bankBranchName = branch ? branch.name : '';
                payload.departmentName = payload.bankBranchName; // legacy field name used by the old payload

                payload.voucherEntryDate = loadedDate(this.voucherEntryDate) || today;
                payload.paymentDate = loadedDate(this.paymentDate) || today;

                payload.VatWithHeldRate = parseFloat(this.VatWithHeldRate) || 0;
                payload.paymentAmount = parseFloat(this.paymentAmount) || 0;
                payload.modeOfPayment = this.modeOfPayment;
                payload.batchNumber = this.batchNumber || '';

                payload.getfl = this.GETFL === true;
                payload.getflRate = parseFloat(this.GETFLRate) || 0;
                payload.nhil = this.NHIL === true;
                payload.nhilRate = parseFloat(this.NHILRate) || 0;
                payload.vat = this.Vat === true;
                payload.vatRate = parseFloat(this.VatRate) || 0;
                payload.covid = this.covid === true;
                payload.covidRate = parseFloat(this.covidRate) || 0;
                payload.cst = this.cst === true;
                payload.cstRate = parseFloat(this.cstRate) || 0;

                payload.withHeld = parseFloat(this.withHeld) || 0;
                payload.vatWithheld = parseFloat(this.vatWithheld) || 0;
                payload.total = parseFloat(this.total) || 0;
                payload.vatAmount = parseFloat(this.vatAmount) || 0;
                payload.netAmount = parseFloat(this.netAmount) || 0;
                payload.totalTaxAmount = parseFloat(this.totalTaxAmount) || 0;

                payload.isWithHolding = this.isWithHolding === true;
                payload.withHoldingRate = parseFloat(this.withHoldingRate) || 0;
                payload.isVatWithHolding = this.isVatWithHolding === true;
                payload.isMultiCurrency = this.isMultiCurrency === true;
                payload.referenceNumber = this.referenceNumber;

                const vatAccount = this.getAccountDetails(this.vatWithHoldAccountId);
                payload.vatWithHoldAccountId = vatAccount ? vatAccount.id : this.emptyGuid;
                payload.vatWithHoldAccountName = vatAccount
                    ? `${vatAccount.accountNo} - ${vatAccount.accountName}`
                    : '';

                const creditAccount = this.getAccountDetails(this.creditAccountId);
                payload.creditAccountId = creditAccount ? creditAccount.id : this.emptyGuid;
                payload.creditAccountName = creditAccount
                    ? `${creditAccount.accountNo} - ${creditAccount.accountName}`
                    : '';

                const bankGlAccount = this.getAccountDetails(this.bankAccountId);
                payload.bankAccountId = bankGlAccount ? bankGlAccount.id : this.emptyGuid;
                payload.bankAccountName = bankGlAccount
                    ? `${bankGlAccount.accountNo} - ${bankGlAccount.accountName}`
                    : '';
                payload.bankGlAccountName = payload.bankAccountName; // legacy name

                payload.description = this.voucherDescription;
                payload.isPosted = this.isPosted === true;

                return payload;
            },

            validateAndSaveVoucher() {
                this.saveVoucher();
            },

            async saveVoucher() {
                if (this.isLoading) return;

                if (!this.invoiceId) {
                    this.toastHandler('warning', 'Please select a supplier invoice.');
                    return;
                }
                if ((parseFloat(this.paymentAmount) || 0) <= 0) {
                    this.toastHandler('warning', 'Payment amount must be greater than zero.');
                    return;
                }
                if (!this.voucherDescription) {
                    this.toastHandler('warning', 'Please enter a description.');
                    return;
                }

                this.isLoading = true;

                try {
                    this.InitModeOfPayment();
                    const payload = this.buildVoucherPayload();

                    // ---------- UPDATE ----------
                    if (this.voucherId) {
                        payload.id = this.voucherId;
                        payload.tenantId = this.tenantId;

                        const response = await api.post(ENDPOINTS.updateVoucher, payload);
                        const body = response.data || {};
                        const updatedId = body.id || body.voucherId || this.voucherId;

                        await this.getVouchers();
                        const row = await this.findVoucherById(updatedId);
                        if (row) await this.setCurrentVoucher(row);

                        this.toastHandler('', 'Voucher updated.');
                        return;
                    }

                    // ---------- CREATE ----------
                    const response = await api.post(ENDPOINTS.createVoucher, payload);
                    const body = response.data || {};
                    const createdId = body.id || body.voucherId;

                    await this.getVouchers();

                    const created = createdId ? await this.findVoucherById(createdId) : null;

                    if (created) {
                        await this.setCurrentVoucher(created);
                    } else {
                        if (createdId) this.voucherId = createdId;
                        if (body.voucherNumber) this.voucherNumber = body.voucherNumber;
                    }

                    this.toastHandler('', 'Voucher saved.');

                    // Old behaviour redirected to the voucher action page; uncomment if you still want it.
                    // window.location.href = '/ApDataEntry/VoucherAction';
                } catch (error) {
                    console.error('saveVoucher failed:', error && error.response ? error.response.data : error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Unable to save the voucher.'));
                } finally {
                    this.isLoading = false;
                }
            },

            /* ==================================================================
             * DELETE
             * ================================================================== */
            async deleteVoucher(id) {
                const row = this.getSelectedVoucherRow();
                const voucherId = (id && typeof id === 'object')
                    ? (id.id || id.voucherId)
                    : (id || (row && row.id) || this.voucherId);

                if (!voucherId) {
                    this.toastHandler('warning', 'Please select a voucher first.');
                    return;
                }
                if (this.isLoading) return;

                if (typeof Swal !== 'undefined') {
                    const confirmed = await Swal.fire({
                        title: 'Delete voucher?',
                        text: 'This will delete the payment voucher.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Delete',
                        confirmButtonColor: '#d33',
                        cancelButtonText: 'Cancel'
                    });
                    if (!confirmed.isConfirmed) return;
                }

                this.isLoading = true;

                try {
                    // Existing API contract: GET /ApDataEntry/DeleteVoucher/?id=...
                    await api.get(ENDPOINTS.deleteVoucher, { params: { id: voucherId } });

                    const wasCurrent = sameId(voucherId, this.voucherId);

                    await this.getVouchers();

                    if (wasCurrent) {
                        this.resetVoucherFields();
                        await this.getInvoices();

                        const grid = this.$refs.vouchers;
                        if (grid && typeof grid.clearSelection === 'function') grid.clearSelection();
                    }

                    this.toastHandler('', 'Voucher deleted.');
                } catch (error) {
                    console.error('deleteVoucher failed:', error && error.response ? error.response.data : error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Unable to delete the voucher.'));
                } finally {
                    this.isLoading = false;
                }
            },

            /* ==================================================================
             * PRINT
             * ================================================================== */
            printReport() {
                const row = this.getSelectedVoucherRow();
                const voucherId = this.voucherId || (row && row.id);

                if (!voucherId) {
                    this.toastHandler('warning', 'No voucher selected for printing.');
                    return;
                }

                window.open(`${REPORT_URL}?id=${voucherId}`, '_blank');
            }
        },
        watch: {
            invoiceId(val) {
                if (this.isSettingVoucher) return;
                this.onInvoiceChange();
            },
            voucherId(val) {
                if (this.isSettingVoucher) return;
                if (val && val !== this.loadedVoucherId) this.setCurrentVoucher();
            },
            payCurrencyId(val) {
                if (this.isSettingVoucher) return;
                if (val) this.onPayCurrencyChange();
            },
            bankId(val) {
                if (this.isSettingVoucher) return;
                this.onBankChange();
            },
            bankAccountId(val) {
                if (this.isSettingVoucher) return;
                this.syncBankFromAccount(val);
            },
            isWithHolding(val) {
                if (this.isSettingVoucher) return;
                this.withHoldingRate = val ? '7.5' : '0.00';
                this.calculateWithHeldDetails();
            },
            withHoldingRate() {
                if (this.isSettingVoucher) return;
                this.calculateWithHeldDetails();
            },
            isVatWithHolding(val) {
                if (this.isSettingVoucher) return;
                this.VatWithHeldRate = val ? '7.00' : '0.00';
                this.calculateWithHeldDetails();
            },
            VatWithHeldRate() {
                if (this.isSettingVoucher) return;
                this.calculateWithHeldDetails();
            },
            paymentAmount(val) {
                if (this.isSettingVoucher) return;
                this.calculateWithHeldDetails();
            },
            VatRate() {
                if (this.userIsEditingRate) this.calculateTotalTaxAmount();
            },
            isVatInclusive(val) {
                if (this.isSettingVoucher) return;
                // Inclusive <-> exclusive changes both what is clickable and how the tax is derived
                this.syncTaxLevyAvailability();
                this.calculateTotalTaxAmount();
            },
            voucherEntryDate(val) {
                const iso = isoDate(val);
                if (iso && iso !== val) this.voucherEntryDate = iso;
            },
            paymentDate(val) {
                const iso = isoDate(val);
                if (iso && iso !== val) this.paymentDate = iso;
            }
        },
        async mounted() {
            this.isShimmerLoading = true;

            await Promise.all([
                this.getSuppliers(),
                this.getCurrencies(),
                this.getBanks(),
                this.loadAccounts(),
                this.getBankAccounts(),
                this.getTaxLevies(),
                this.getBusinessProfile()
            ]);

            // Needs accountsList / bankAccountList to resolve the bank + branch
            await this.getDefaultGlSetup();

            await this.getInvoices();
            await this.getVouchers();

            this.generateRefNo();
            this.calculateWithHeldDetails();

            this.isShimmerLoading = false;
        }
    });

    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
