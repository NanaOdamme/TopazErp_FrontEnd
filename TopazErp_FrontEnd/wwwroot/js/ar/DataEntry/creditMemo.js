(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const ENDPOINTS = {
        memos: '/Ar/GetCreditMemos',
        createMemo: '/Ar/CreateCreditMemo',
        updateMemo: '/Ar/UpdateCreditMemo',
        applyMemo: '/Ar/ApplyCreditMemo',
        deleteMemo: '/Ar/DeleteCreditMemo/?id=',
        invoices: '/Ar/GetInvoices',
        customers: '/SharedResource/GetCustomers',
        currencies: '/SharedResource/GetCurrencies',
        banks: '/SharedResource/GetBanks',
        accounts: '/Ap/InitJournalEntry',
        bankAccounts: '/LedgerSetups/GetBankAccounts',
        taxLevies: '/SharedResource/GetTaxLevies',
        defaultGlSetup: '/Ap/GetDefaultGlSetup',
        businessProfile: '/SharedResource/GetBusinessProfile',
        costCenters: '/SharedResource/GetCostCenters',
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
                creditMemos: [], // FIXED: was debitMemos
                isLoading: false,
                payload: {},
                emptyGuid: EMPTY_GUID,
                customerInvoices: [],
                invoiceList:[],
                invoiceId: '',
                customers: [],
                customerId: '',
                customerName: '',
                accountNo: '',
                invoiceNo: '',
                currencies: [],
                currencyId: '',
                currencyName: '',
                buyRate: '',
                sellRate: '',
                invoiceCurrencyId: '',
                invoiceCurrencyName: '',
                invoiceBuyRate: 1,
                invoiceAmount: 0,
                invoiceBalance: 0,
                balance: '',
                description: '',
                liabilityGlId: EMPTY_GUID, // FIXED: was debitGlId -> now liabilityGlId
                bankList: [],
                bankBranchList: [],
                bankId: '',
                bankName: '',
                bankBranchId: '',
                amount: '0.00',
                transactionDate: today,
                modeOfPayment: 'Cash',
                chequeNumber: '00000000',
                cash: true,
                cheque: false,
                invoiceDate: today,
                creditMemoList: [],
                creditMemoId: '',
                chequeDate: today,
                ouList: [],
                ouName: '',
                ouId: '',
                costCenterList: [],
                accounts: [],
                bankAccountId: '',
                bankAccountName: '',
                batchNumber: "0",
                isOu: false,
                generatedInvoiceNo: '',
                isSettingCreditMemo: false, // FIXED: was isSettingDebitMemo
                bankBranchName:'',
                currencyCode: '',
                liabilityName: '', // FIXED: was debitGlName -> now liabilityName
                // REMOVED: creditGlId / creditGlName per request
                isApplying:false,
                isShimmerLoading: false,
            };
        },
        computed: {
            modeOfPayments() {
                return [
                    { id: 'Cash', name: 'Cash' },
                    { id: 'Cheque', name: 'Cheque' }
                ];
            },
            memoColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, width: 74 },
                    { key: 'batchNumber', label: 'Batch #', type: 'text', width: 150, disabled: true, placeholder: 'Generated On Save' },
                    { key: 'customerId', label: 'Customer', type: 'select', width: 180, required: true, options: this.customers, value: 'id', display:'name'},
                    { key: "description", label: "Description", type: "text", width: 250 },
                    { key: "transactionDate", label: "Date", type: "date",  width: 200, defaultValue: today },
                    { key: "invoiceNo", label: "Invoice #", type: "text", width: 150, defaultValue: this.generatedInvoiceNo, help: "Enter invoice number if available", required: true },
                    { key: 'currencyId', label: 'Currency', type: 'select', width: 180, required: true, options: this.currencies, value: 'id', display:'currencyName', defaultValue: this.currencyId, },
                    { key: "buyRate", label: "Rate",type: "number", decimals: 4, width: 150, defaultValue: this.buyRate, dependsOn: 'currencyId', valueFrom: values => this.setCurrencyRate(values.currencyId) },
                    { key: "modeOfPayment", label: "Mode of Payment", type: "select", width: 150, options: this.modeOfPayments, value: 'id', display: 'name', defaultValue: this.modeOfPayment },
                    { key: "amount", label: "Amount", type: "number", width: 150, decimals: 2, required: true },
                    { key: 'bankId', label: 'Bank', type: 'select', options: this.bankList, value: 'id', display: 'name', width: 200},
                    { key: 'bankBranchId', label: 'Bank Branch', type: 'select', width:200, options: values => this.getBankBranches(values.bankId), value: 'id', display: 'name', dependsOn: 'bankId', disabled: (row, mode, column, values) => !values.bankId},
                    { key: 'chequeNumber', label: 'Cheque Number', type: 'text', disabled: (row, mode, column, values) => String(values.modeOfPayment).toLowerCase() === 'cash'},
                    { key: 'chequeDate', label: 'Cheque Date', type: 'date', disabled: (row, mode, column, values) => String(values.modeOfPayment).toLowerCase() === 'cash'},
                    { key: 'ouId', label: 'OU / Cost Center', type: 'select', width: 300, options: this.ouList, display: 'name', value: 'id', help: 'Select if needed' },
                    { key: 'liabilityGlId', label: 'Liability G/L Account', type: 'select', options: this.accounts, display: 'accountIdentifier', value: 'id', width: 300, defaultValue: this.liabilityGlId }, // FIXED: was Debit G/L Account with debitGlId -> now Liability
                    { key: 'isInvoiceDebit', label: 'Applied', type: 'boolean', width: 110, searchable: true,},
                ]
            },
            amountToApply() {
                const invoiceBuyRate = parseFloat(this.invoiceBuyRate) || 0;
                const memoBuyRate = parseFloat(this.buyRate) || 0;
                return (this.amount * memoBuyRate) / invoiceBuyRate || 0;
            }
        },
        methods: {
            setCurrencyRate(currencyId) {
                const currency = this.currencies.find(c => c.id === currencyId);
                return currency?.buyRate ?? '';
            },
            isInvoiceDebit(row) {
                return row.isInvoiceDebit === true;
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
            async getCreditMemos() {
                this.isShimmerLoading = true;
                this.creditMemos = await this.fetchList(ENDPOINTS.memos, 'Credit Memos');
                // keep legacy alias in sync
                this.creditMemoList = this.creditMemos;
                await this.generateInvoiceNo();
                this.isShimmerLoading = false;
            },
            generateInvoiceNo() {
                this.generatedInvoiceNo = String(
                    Math.floor(1000 + Math.random() * 9000)
                );
                return this.generatedInvoiceNo;
            },
            async onCreate(payload = {}) {
                const row = {
                    ...(payload.data || payload.row || payload)
                };

                const customer = this.customers.find(
                    item => item.id === row.customerId
                );

                const currency = this.currencies.find(
                    item => item.id === row.currencyId
                );

                const invoice = this.invoiceList.find(
                    item => item.id === row.invoiceId
                );

                const record = {
                    ...row,

                    customerId: row.customerId,
                    customerName: customer?.name || row.customerName || '',
                    accountNo: customer?.accountNumber || row.accountNo || '',

                    invoiceId: row.invoiceId || this.emptyGuid,
                    invoiceNo: invoice?.invoiceNumber || row.invoiceNo || '',
                    invoiceBalance: row.invoiceBalance ?? invoice?.balance ?? 0,
                    invoiceCurrencyName: row.invoiceCurrencyName || invoice?.currencyName || 'No Invoice',
                    invoiceBuyRate: row.invoiceBuyRate ?? invoice?.buyRate ?? 0,

                    amount: parseFloat(row.amount) || 0,

                    transactionDate: row.transactionDate
                        ? new Date(row.transactionDate).toISOString()
                        : new Date().toISOString(),

                    currencyId: row.currencyId,
                    currencyName: currency?.currencyName || row.currencyName || '',
                    currencyCode: currency?.currencyCode || row.currencyCode || '',
                    buyRate: row.buyRate ?? currency?.buyRate ?? 1,
                    sellRate: row.sellRate ?? currency?.sellRate ?? 1,

                    ouId: row.ouId || this.emptyGuid,
                    ouName: row.ouName || '',

                    liabilityGlId: row.liabilityGlId || this.emptyGuid,
                    liabilityName: row.liabilityName || '',

                    bankId: row.bankId || this.emptyGuid,
                    bankName: row.bankName || '',
                    bankBranchId: row.bankBranchId || this.emptyGuid,
                    bankBranch: row.bankBranch || row.bankBranchName || '',

                    chequeNo: row.chequeNo || row.chequeNumber || '',
                    chequeDate: row.chequeDate
                        ? new Date(row.chequeDate).toISOString()
                        : null,

                    modeOfPayment: row.modeOfPayment || 'Cash',
                    description: row.description || '',
                    isInvoiceDebit: row.isInvoiceDebit ?? false,
                    batchNumber: row.batchNumber || '0',
                };

                try {
                    const res = await axios.post(
                        ENDPOINTS.createMemo,
                        record
                    );

                    if (res.data?.result?.code === 200 || res.data?.result?.code === undefined) {
                        // FIXED: was Debit memo
                        this.toastHandler(
                            'success',
                            res.data.result?.message || res.data.message || 'Credit memo created successfully.'
                        );
                    } else {
                        this.toastHandler(
                            'error',
                            res.data.result?.message || 'Failed to create credit memo.'
                        );
                        return;
                    }

                    await this.getCreditMemos();

                } catch (error) {
                    console.error('Credit memo creation failed:', error);
                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Failed to create credit memo.'
                    );
                    await this.getCreditMemos();
                }
            },
            async onUpdate(event = {}) {
                const row = event?.row || event?.data;
                if (!row) return;

                const rawId = row.id;
                const id = typeof rawId === 'object' ? rawId?.id : rawId;

                const existing = this.creditMemos.find(item => item.id === id);
                if (!existing) {
                    console.error('Credit memo update event:', event);
                    this.toastHandler('error', 'Credit memo record was not found.');
                    return;
                }
                const customer = this.customers.find(
                    item => item.id === row.customerId
                );

                const currency = this.currencies.find(
                    item => item.id === row.currencyId
                );

                const invoice = this.invoiceList.find(
                    item => item.id === row.invoiceId
                );

                const record = {
                    ...existing,
                    ...row,
                    id: existing.id,
                    customerId: row.customerId,
                    customerName: customer?.name || row.customerName || '',
                    accountNo: customer?.accountNumber || row.accountNo || '',

                    invoiceId: row.invoiceId || this.emptyGuid,
                    invoiceNo: invoice?.invoiceNumber || row.invoiceNo || '',
                    invoiceBalance: row.invoiceBalance ?? invoice?.balance ?? 0,
                    invoiceCurrencyName: row.invoiceCurrencyName || invoice?.currencyName || 'No Invoice',
                    invoiceBuyRate: row.invoiceBuyRate ?? invoice?.buyRate ?? 0,

                    amount: parseFloat(row.amount) || 0,

                    transactionDate: row.transactionDate
                        ? new Date(row.transactionDate).toISOString()
                        : new Date().toISOString(),

                    currencyId: row.currencyId,
                    currencyName: currency?.currencyName || row.currencyName || '',
                    currencyCode: currency?.currencyCode || row.currencyCode || '',
                    buyRate: row.buyRate ?? currency?.buyRate ?? 1,
                    sellRate: row.sellRate ?? currency?.sellRate ?? 1,

                    ouId: row.ouId || this.emptyGuid,
                    ouName: row.ouName || '',

                    liabilityGlId: row.liabilityGlId || this.emptyGuid,
                    liabilityName: row.liabilityName || '',
                    bankId: row.bankId || this.emptyGuid,
                    bankName: row.bankName || '',
                    bankBranchId: row.bankBranchId || this.emptyGuid,
                    bankBranch: row.bankBranch || row.bankBranchName || '',

                    chequeNo: row.chequeNo || row.chequeNumber || '',
                    chequeDate: row.chequeDate
                        ? new Date(row.chequeDate).toISOString()
                        : null,

                    modeOfPayment: row.modeOfPayment || 'Cash',
                    description: row.description || '',
                    isInvoiceDebit: row.isInvoiceDebit ?? false,
                    batchNumber: row.batchNumber || '0'
                };

                try {
                    const res = await axios.put(
                        ENDPOINTS.updateMemo,
                        record
                    );

                    if (res.data.result?.code === 200) {
                        this.toastHandler(
                            'success',
                            res.data.result?.message || 'Saved Successfully.'
                        );
                        await this.getCreditMemos();
                    }
                    else{
                        this.toastHandler(
                            'error',
                            res.data.result?.message || 'Failed to update credit memo.'
                        );
                        return;
                    }
                    await this.getCreditMemos();

                } catch (error) {
                    console.error('Credit memo update failed:', error);
                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Failed to update credit memo.'
                    );
                    await this.getCreditMemos();
                }
            },
            async onDelete(event) {
                const deleted = Array.isArray(event?.rows) ? event.rows : [];

                if (!deleted.length) {
                    this.toastHandler('warning', 'No credit memo selected for deletion.');
                    return;
                }

                try {
                    for (const row of deleted) {
                        const id = typeof row.id === 'object'
                            ? row.id?.id
                            : row.id;

                        if (!id) {
                            console.error('Invalid deleted row:', row);
                            this.toastHandler('error', 'Credit memo ID is missing or invalid.');
                            return;
                        }

                        const res = await axios.delete(
                            `${ENDPOINTS.deleteMemo}${encodeURIComponent(id)}`
                        );

                        if (res.data?.success === false) {
                            this.toastHandler(
                                'error',
                                res.data.message || 'Failed to delete credit memo.'
                            );
                            return;
                        }
                    }

                    this.toastHandler('success', 'Credit memo deleted successfully.');

                    await this.getCreditMemos();

                } catch (error) {
                    console.error('Credit memo deletion failed:', error);
                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Failed to delete credit memo.'
                    );
                    await this.getCreditMemos();
                }
            },
            async loadLookups() {
                const [rawAccounts, rawCustomers, rawCurrencies, rawCostCenters, rawBanks] = await Promise.all([
                    this.fetchList(ENDPOINTS.accounts, 'accounts'),
                    this.fetchList(ENDPOINTS.customers, 'customers'),
                    this.fetchList(ENDPOINTS.currencies, 'currencies'),
                    this.fetchList(ENDPOINTS.costCenters, 'cost centers'),
                    this.fetchList(ENDPOINTS.banks, 'banks'),
                ]);
                this.accounts = rawAccounts.map(a => ({
                    ...a,
                    accountIdentifier: a.accountIdentifier || `${a.accountNo ?? ''} - ${a.accountName ?? a.name ?? ''}`.trim().replace(/^ - /, ''),
                    name: a.accountName || a.name,
                    accountName: a.accountName || a.name
                }));
                this.customers = rawCustomers.map(s => ({
                    ...s,
                    name: (s.name || '').trim()
                }));
                this.currencies = rawCurrencies.map(c => ({
                    ...c,
                    currencyName: c.currencyName,
                    currencyCode: c.currencyCode,
                    buyRate: c.buyRate,
                    sellRate: c.sellRate
                }));

                const byId = new Map(rawCostCenters.map(c => [String(c.id), c]));
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

                this.ouList = rawCostCenters
                    .map(c => {
                        const path = getPath(c);
                        return {
                            ...c,
                            originalName: c.name,
                            name: path,
                            displayName: path,
                            hierarchy: path
                        };
                    })
                    .sort((a, b) => a.name.localeCompare(b.name));

                this.bankList = rawBanks.map(b => ({
                    ...b,
                    name: (b.name || '').trim()
                }));
                this.bankBranchList = rawBanks.flatMap(b => (b.bankBranches || []).map(br => ({
                    ...br,
                    bankId: b.id,
                    name: (br.name || '').trim()
                })));

                this.applyDefaults();
            },
            getBankBranches(bankId) {
                if (!bankId) return [];
                return this.bankBranchList.filter(
                    br => String(br.bankId) === String(bankId)
                );
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
            async getInvoices() {
                const list = await this.fetchList(ENDPOINTS.invoices, 'AR invoices');
                this.invoiceList = list.filter(inv => inv.isPosted === true && inv.isCanceled !== true && (parseFloat(inv.balance) || 0) > 0 && inv.customerId === this.customerId)
                    .map(invoice => {
                        return {
                            ...invoice,
                            invoiceId: invoice.id,
                            displayText: `${invoice.customerName || ''} - ${invoice.invoiceNumber || ''}`.trim(), // FIXED: was supplierName
                        };
                    }).sort((a, b) => String(a.invoiceNumber || '').localeCompare(String(b.invoiceNumber || '')));

                if (this.invoiceList.length === 0) {
                    this.toastHandler('warning', 'No posted invoices with a positive balance found for the selected customer.'); // FIXED: was supplier
                }
                return this.invoiceList;
            },
            setCurrentInvoice() {
                if (this.invoiceId) {
                    const invoice = this.invoiceList.find(a => a.id === this.invoiceId);
                    this.invoiceId = invoice.id;
                    this.invoiceNo = invoice.invoiceNumber;
                    this.invoiceCurrencyName =  invoice.currencyName;
                    this.invoiceBuyRate = invoice.buyRate;
                    this.invoiceBalance = invoice.balance;
                }
            },
            getInvoiceDetails(id) {
                return this.customerInvoices.find(a => a.id === id);
            },

            async applyMemo() {
                this.isApplying = true;
                await this.setCurrentMemo();
                await this.$nextTick();
                const element = document.querySelector('#apply');
                if (!element) {
                    console.error('Cannot find #apply. Check where the div is rendered.');
                    return;
                }
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            },
            getMemoDetails(id) {
                const grid = this.$refs.creditMemos;
                if (!grid) return null;
                return grid.selectedRows()[0] ?? null;
            },
            async setCurrentMemo(creditMemo = null) { 
                if (this.isSettingCreditMemo) return false;

                let creditMemoInfo = null;

                if (creditMemo && typeof creditMemo === 'object') {
                    creditMemoInfo = creditMemo;
                } else {
                    const grid = this.$refs.creditMemos;

                    if (!grid) {
                        console.error('Credit memo grid not found. Check the ref="creditMemos" in your template.');
                        return false;
                    }

                    const selectedRows = grid.selectedRows();

                    if (selectedRows.length > 1) {
                        this.toastHandler('warning', 'You can only edit one record at a time');
                        return false;
                    }

                    if (!selectedRows.length && !creditMemo) {
                        this.toastHandler('warning', 'Please select a credit memo first.');
                        return false;
                    }

                    creditMemoInfo = this.getMemoDetails();
                }

                if (!creditMemoInfo) {
                    this.toastHandler('warning', 'Unable to find the selected credit memo.');
                    return false;
                }

                this.isSettingCreditMemo = true;

                try {
                    this.creditMemoId = creditMemoInfo.id;

                    this.transactionDate = loadedDate(creditMemoInfo.transactionDate);
                    this.amount = money(creditMemoInfo.amount);

                    this.customerId = creditMemoInfo.customerId || ''; // FIXED: was supplierId
                    this.customerName = creditMemoInfo.customerName || '';
                    this.accountNo = creditMemoInfo.accountNo || '';
                    await this.getInvoices();
                    this.invoiceId = creditMemoInfo.invoiceId || '';
                    this.invoiceNo = creditMemoInfo.invoiceNo || '';
                    this.invoiceBalance = money(creditMemoInfo.invoiceBalance);
                    this.invoiceCurrencyName = creditMemoInfo.invoiceCurrencyName || 'No Invoice';
                    this.invoiceBuyRate = rate4(creditMemoInfo.invoiceBuyRate);

                    this.currencyId = creditMemoInfo.currencyId || '';
                    this.currencyName = creditMemoInfo.currencyName || '';
                    this.currencyCode = creditMemoInfo.currencyCode || '';
                    this.buyRate = rate4(creditMemoInfo.buyRate);
                    this.sellRate = rate4(creditMemoInfo.sellRate);

                    this.ouId = creditMemoInfo.ouId || '';
                    this.ouName = creditMemoInfo.ouName || '';

                    this.liabilityGlId = creditMemoInfo.liabilityGlId || EMPTY_GUID; // FIXED: was debitGlId
                    this.liabilityName = creditMemoInfo.liabilityName || ''; // FIXED: was debitGlName
                    // REMOVED: creditGlId / creditGlName

                    this.bankId = creditMemoInfo.bankId || '';
                    this.bankName = creditMemoInfo.bankName || '';
                    this.bankBranchId = creditMemoInfo.bankBranchId || '';
                    this.bankBranchName = creditMemoInfo.bankBranch || '';

                    this.chequeNumber = creditMemoInfo.chequeNo || '';
                    this.chequeDate = loadedDate(creditMemoInfo.chequeDate);
                    this.modeOfPayment = creditMemoInfo.modeOfPayment ;

                    this.description = creditMemoInfo.description || '';

                    this.batchNumber = creditMemoInfo.batchNumber || '';
                    this.tenantId = creditMemoInfo.tenantId;
                    return true;

                } catch (error) {
                    console.error('setCurrentMemo failed:', error);
                    this.toastHandler('error', 'Unable to load the credit memo details.');
                    return false;
                } finally {
                    await this.$nextTick();
                    this.isSettingCreditMemo = false;
                }
            },
            getCurrencyDetails(id) {
                return this.currencies.find(a => a.id === id);
            },
            getOuDetails(id) {
                return this.ouList.find(a => a.id === id);
            },
            getBankDetails(id) {
                return this.bankList.find(a => a.id === id);
            },
            getBankBranchDetails(id) {
                return this.bankBranchList.find(a => a.id === id);
            },
            async applyCreditMemo() { // FIXED: was applyDebitMemo
                this.isLoading = true;
                if (this.amountToApply > this.invoiceBalance) {
                    this.toastHandler('warning', 'Credit memo amount exceeds the invoice balance.');
                    this.isLoading = false;
                    return;
                }
                let payload = {};
                payload.chequeDate = this.chequeDate;
                payload.chequeNo = this.chequeNumber;
                if (this.invoiceId) {
                    let invoiceInfo = this.getInvoiceDetails(this.invoiceId);
                    if (invoiceInfo) {
                        payload.invoiceId = invoiceInfo.id;
                        payload.invoiceNo = invoiceInfo.invoiceNumber;
                        payload.invoiceCurrencyId = invoiceInfo.currencyId;
                        payload.invoiceCurrencyName = invoiceInfo.currencyName;
                        payload.invoiceBuyRate = invoiceInfo.buyRate;
                        payload.invoiceBalance = invoiceInfo.balance;
                        payload.customerId = invoiceInfo.customerId; // FIXED: was supplierId
                        payload.customerName = invoiceInfo.customerName; // FIXED: was supplierName
                        payload.accountNo = invoiceInfo.accountNumber;
                    }
                }
                if (this.currencyId) {
                    let currencyInfo = this.getCurrencyDetails(this.currencyId);
                    if (currencyInfo) {
                        payload.currencyId = this.currencyId;
                        payload.currencyName = currencyInfo.currencyName;
                        payload.currencyCode = currencyInfo.currencyCode;
                        payload.buyRate = currencyInfo.buyRate;
                        payload.sellRate = currencyInfo.sellRate;
                    }
                }

                if (this.ouId) {
                    let ouInfo = this.getOuDetails(this.ouId);
                    if (ouInfo) {
                        payload.ouName = ouInfo.name;
                    }
                }
                else
                {
                    this.ouId = this.emptyGuid;
                    payload.ouName = 'No OU';
                }

                if (this.bankId) {
                    let bankInfo = this.getBankDetails(this.bankId);
                    if (bankInfo) {
                        payload.bankId = this.bankId;
                        payload.bankName = bankInfo.name;
                    }
                } else {
                    payload.bankId = this.emptyGuid;
                }
                if (this.bankBranchId) {
                    let bankBranchInfo = this.getBankBranchDetails(this.bankBranchId);
                    if (bankBranchInfo) {
                        payload.bankBranchId = this.bankBranchId;
                        payload.bankBranch = bankBranchInfo.name;
                    }
                } else {
                    payload.bankBranchId = this.emptyGuid;
                }
                payload.transactionDate = this.transactionDate;
                payload.amount = this.amount;
                payload.modeOfPayment = this.modeOfPayment;
                payload.description = this.description;
                if (this.liabilityGlId) { // FIXED: was debitGlId
                    let liabilityInfo = this.accounts.find(a => a.id === this.liabilityGlId);
                    if (liabilityInfo) {
                        payload.liabilityGlId = this.liabilityGlId;
                        payload.liabilityName = liabilityInfo.accountIdentifier;
                    } else {
                        payload.liabilityGlId = this.emptyGuid;
                        payload.liabilityName = 'No Liability GL';
                    }
                }
                // REMOVED: creditGlId / creditGlName block

                payload.ouId = this.ouId;
                payload.isInvoiceDebit = true;
                payload.batchNumber = this.batchNumber;
                payload.chequeDate = this.chequeDate;
                payload.customerId = this.customerId; // FIXED: was supplierId
                payload.id = this.creditMemoId;

                try{
                    const res = await axios.put(
                        ENDPOINTS.applyMemo,
                        payload,
                    );
                    if (res.data.result.code === 200) {
                        this.toastHandler('', 'Credit Memo Applied.');
                        this.isLoading = false;
                    } else {
                        this.toastHandler('error', res.data.result.message);
                        this.isLoading = false;
                    }
                    await this.getCreditMemos();
                }
                catch(error) {
                    this.toastHandler('error', 'Unable to Apply Credit Memo.');
                    await this.getCreditMemos();
                    this.isLoading = false;
                }
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
        watch:{
            bankId(val) {
                this.getBankBranches(val);
            },
        },
        async mounted() {
            this.isShimmerLoading = true;
            await this.loadLookups();
            await this.getCreditMemos(); // FIXED: was getDebitMemos
            this.isShimmerLoading = false;
        }
    });
    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
