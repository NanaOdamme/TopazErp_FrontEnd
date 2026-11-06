(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const ENDPOINTS = {
        memos: '/Ap/GetDebitMemos',
        createMemo: '/Ap/CreateDebitMemo',
        updateMemo: '/Ap/UpdateDebitMemo',
        applyMemo: '/Ap/ApplyDebitMemo',
        deleteMemo: '/Ap/DeleteDebitMemo/?id=',
        invoices: '/Ap/GetInvoices',
        suppliers: '/SharedResource/GetSuppliers',
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
            debitMemos: [],
            isLoading: false,
            payload: {},
            emptyGuid: EMPTY_GUID,
            supplierInvoices: [],
            invoiceList:[],
            invoiceId: '',
            suppliers: [],
            supplierId: '',
            supplierName: '',
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
            debitGlId: EMPTY_GUID,
            creditGlId: EMPTY_GUID,
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
            debitMemoList: [],
            debitMemoId: '',
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
            isSettingDebitMemo: false,
            bankBranchName:'',
            currencyCode: '',
            debitGlName: '',
            creditGlName: '',
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
                { key: 'supplierId', label: 'Supplier', type: 'select', width: 180, required: true, options: this.suppliers, value: 'id', display:'name'},
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
                { key: 'debitGlId', label: 'Debit G/L Account', type: 'select', options: this.accounts, display: 'accountIdentifier', value: 'id', width: 300, defaultValue: this.debitGlId },
                { key: 'creditGlId', label: 'Credit G/L Account', type: 'select', options: this.accounts, display: 'accountIdentifier', value: 'id', width: 300, defaultValue: this.creditGlId },
                { key: 'isInvoiceDebit', label: 'Applied', type: 'boolean', width: 110, searchable: true,},
            ]
        },
        //convert memo amount to invoice currency amount
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
                // Handle: raw array, {result: [...]}, {accounts:[...]}, {items:[...]}
                const list = unwrapList(response.data, preferredKey);
                // PascalCase safety
                return list.map(item => (item && item.Id && !item.id) ? normalizeKeys(item) : item);
            } catch (error) {
                this.toastHandler('error', `Failed to load ${label}.`);
                return [];
            }
        },
        async getDebitMemos() {
            this.isShimmerLoading = true;
            this.debitMemos = await this.fetchList(ENDPOINTS.memos, 'Debit Memos');
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

            const supplier = this.suppliers.find(
                item => item.id === row.supplierId
            );

            const currency = this.currencies.find(
                item => item.id === row.currencyId
            );

            const invoice = this.invoiceList.find(
                item => item.id === row.invoiceId
            );

            const record = {
                ...row,

                supplierId: row.supplierId,
                supplierName: supplier?.name || row.supplierName || '',
                accountNo: supplier?.accountNumber || row.accountNo || '',

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

                debitGlId: row.debitGlId || this.emptyGuid,
                debitGlName: row.debitGlName || '',
                creditGlId: row.creditGlId || this.emptyGuid,
                creditGlName: row.creditGlName || '',

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

                if (res.result?.code === 200) {
                    this.toastHandler(
                        'success',
                        res.data.result.message || 'Debit memo created successfully.'
                    );
                } else {
                    this.toastHandler(
                        'error',
                        res.data.result.message || 'Failed to create debit memo.'
                    );
                    return;
                }
                
                await this.getDebitMemos();

            } catch (error) {
                console.error('Debit memo creation failed:', error);

                this.toastHandler(
                    'error',
                    error.response?.data?.message || 'Failed to create debit memo.'
                );
                await this.getDebitMemos();
            }
        },
        async onUpdate(event = {}) {
            const row = event?.row || event?.data;
            if (!row) return;

            const rawId = row.id;
            const id = typeof rawId === 'object' ? rawId?.id : rawId;

            const existing = this.debitMemos.find(item => item.id === id);
            if (!existing) {
                console.error('Debit memo update event:', event);
                this.toastHandler('error', 'Debit memo record was not found.');
                return;
            }
            const supplier = this.suppliers.find(
                item => item.id === row.supplierId
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
                supplierId: row.supplierId,
                supplierName: supplier?.name || row.supplierName || '',
                accountNo: supplier?.accountNumber || row.accountNo || '',

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

                debitGlId: row.debitGlId || this.emptyGuid,
                debitGlName: row.debitGlName || '',
                creditGlId: row.creditGlId || this.emptyGuid,
                creditGlName: row.creditGlName || '',

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
                   await this.getDebitMemos();
                }
                else{
                    this.toastHandler(
                        'error',
                        res.data.result?.message || 'Failed to update debit memo.'
                    );
                    return;
                }
                await this.getDebitMemos();

            } catch (error) {
                console.error('Debit memo update failed:', error);

                this.toastHandler(
                    'error',
                    error.response?.data?.message || 'Failed to update debit memo.'
                );
                await this.getDebitMemos();
            }
        },
        async onDelete(event) {
            const deleted = Array.isArray(event?.rows) ? event.rows : [];

            if (!deleted.length) {
                this.toastHandler('warning', 'No debit memo selected for deletion.');
                return;
            }

            try {
                for (const row of deleted) {
                    const id = typeof row.id === 'object'
                        ? row.id?.id
                        : row.id;

                    if (!id) {
                        console.error('Invalid deleted row:', row);
                        this.toastHandler('error', 'Debit memo ID is missing or invalid.');
                        return;
                    }

                    const res = await axios.delete(
                        `${ENDPOINTS.deleteMemo}${encodeURIComponent(id)}`
                    );

                    if (res.data?.success === false) {
                        this.toastHandler(
                            'error',
                            res.data.message || 'Failed to delete debit memo.'
                        );
                        return;
                    }
                }

                this.toastHandler('success', 'Debit memo deleted successfully.');

                await this.getDebitMemos();

            } catch (error) {
                console.error('Debit memo deletion failed:', error);

                this.toastHandler(
                    'error',
                    error.response?.data?.message || 'Failed to delete debit memo.'
                );
                await this.getDebitMemos();
            }
        },
        async loadLookups() {
            const [rawAccounts, rawSuppliers, rawCurrencies, rawCostCenters,
            rawBanks] = await Promise.all([
                this.fetchList(ENDPOINTS.accounts, 'accounts'),
                this.fetchList(ENDPOINTS.suppliers, 'suppliers'),
                this.fetchList(ENDPOINTS.currencies, 'currencies'),
                this.fetchList(ENDPOINTS.costCenters, 'cost centers'),
                this.fetchList(ENDPOINTS.banks, 'banks'),
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
                buyRate: c.buyRate,
                sellRate: c.sellRate
            }));
            
            

            // ---- OU HIERARCHY: Parent / Child ----
            // e.g. ACAD -> ACAD / CES, ACAD / CES / Lab
            const byId = new Map(rawCostCenters.map(c => [String(c.id), c]));

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

            //banks and branches
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
            const list = await this.fetchList(ENDPOINTS.invoices, 'AP invoices');
            this.invoiceList = list.filter(inv => inv.isPosted === true && inv.isCanceled !== true && (parseFloat(inv.balance) || 0) > 0 && inv.supplierId === this.supplierId)
                .map(invoice => {
                return {
                    ...invoice,
                    invoiceId: invoice.id,
                    displayText: `${invoice.supplierName || ''} - ${invoice.invoiceNumber || ''}`.trim(),
                };
            }).sort((a, b) => String(a.invoiceNumber || '').localeCompare(String(b.invoiceNumber || '')));

           //if no invoice found for supplier, throw error
            if (this.invoiceList.length === 0) {
                this.toastHandler('warning', 'No posted invoices with a positive balance found for the selected supplier.');
            }
            return this.invoiceList;
        },
        setCurrentInvoice() {
            if (this.invoiceId) {
                const invoice = this.invoiceList.find(a => a.id === this.invoiceId);
                this.InvoiceId = invoice.id;
                this.invoiceNo = invoice.invoiceNumber;
                this.invoiceCurrencyName =  invoice.currencyName;
                this.invoiceBuyRate = invoice.buyRate;
                this.invoiceBalance = invoice.balance;
            }
        },
        getInvoiceDetails(id) {
            return this.supplierInvoices.find(a => a.id === id);
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
            const grid = this.$refs.debitMemos;
            if (!grid) return null;

            return grid.selectedRows()[0] ?? null;
        },
        async setCurrentMemo(debitMemo = null) {
            if (this.isSettingDebitMemo) return false;

            let debitMemoInfo = null;

            // If a row object was passed directly
            if (debitMemo && typeof debitMemo === 'object') {
                debitMemoInfo = debitMemo;
            } else {
                // Get the actual grid reference
                const grid = this.$refs.debitMemos;

                if (!grid) {
                    console.error('Debit memo grid not found. Check the ref="debitMemos" in your template.');
                    return false;
                }

                const selectedRows = grid.selectedRows();

                if (selectedRows.length > 1) {
                    this.toastHandler('warning', 'You can only edit one record at a time');
                    return false;
                }

                if (!selectedRows.length && !debitMemo) {
                    this.toastHandler('warning', 'Please select a debit memo first.');
                    return false;
                }

                debitMemoInfo = this.getMemoDetails();
            }

            if (!debitMemoInfo) {
                this.toastHandler('warning', 'Unable to find the selected debit memo.');
                return false;
            }

            this.isSettingDebitMemo = true;

            try {
                this.debitMemoId = debitMemoInfo.id;

                this.transactionDate = loadedDate(debitMemoInfo.transactionDate);
                this.amount = money(debitMemoInfo.amount);

                this.supplierId = debitMemoInfo.supplierId || '';
                this.supplierName = debitMemoInfo.supplierName || '';
                this.accountNo = debitMemoInfo.accountNo || '';
                await this.getInvoices();
                this.invoiceId = debitMemoInfo.invoiceId || '';
                this.invoiceNo = debitMemoInfo.invoiceNo || '';
                this.invoiceBalance = money(debitMemoInfo.invoiceBalance);
                this.invoiceCurrencyName = debitMemoInfo.invoiceCurrencyName || 'No Invoice';
                this.invoiceBuyRate = rate4(debitMemoInfo.invoiceBuyRate);

                this.currencyId = debitMemoInfo.currencyId || '';
                this.currencyName = debitMemoInfo.currencyName || '';
                this.currencyCode = debitMemoInfo.currencyCode || '';
                this.buyRate = rate4(debitMemoInfo.buyRate);
                this.sellRate = rate4(debitMemoInfo.sellRate);

                this.ouId = debitMemoInfo.ouId || '';
                this.ouName = debitMemoInfo.ouName || '';

                this.debitGlId = debitMemoInfo.debitGlId || EMPTY_GUID;
                this.debitGlName = debitMemoInfo.debitGlName || '';

                this.creditGlId = debitMemoInfo.creditGlId || EMPTY_GUID;
                this.creditGlName = debitMemoInfo.creditGlName || '';

                this.bankId = debitMemoInfo.bankId || '';
                this.bankName = debitMemoInfo.bankName || '';
                this.bankBranchId = debitMemoInfo.bankBranchId || '';
                this.bankBranchName = debitMemoInfo.bankBranch || '';

                this.chequeNumber = debitMemoInfo.chequeNo || '';
                this.chequeDate = loadedDate(debitMemoInfo.chequeDate);
                this.modeOfPayment = debitMemoInfo.modeOfPayment ;

                this.description = debitMemoInfo.description || '';

              

                this.batchNumber = debitMemoInfo.batchNumber || '';
                this.tenantId = debitMemoInfo.tenantId;
                return true;

            } catch (error) {
                console.error('setCurrentMemo failed:', error);
                this.toastHandler('error', 'Unable to load the debit memo details.');
                return false;

            } finally {
                await this.$nextTick();
                this.isSettingDebitMemo = false;
               
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
        async applyDebitMemo() {
            this.isLoading = true;
            if (this.amountToApply > this.invoiceBalance) {
                this.toastHandler('warning', 'Debit memo amount exceeds the invoice balance.');
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
                    payload.supplierId = invoiceInfo.supplierId;
                    payload.supplierName = invoiceInfo.supplierName;
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
            if (this.debitGlId) {
                let debitGlInfo = this.accounts.find(a => a.id === this.debitGlId);
                if (debitGlInfo) {
                    payload.debitGlId = this.debitGlId;
                    payload.debitGlName = debitGlInfo.accountIdentifier;
                }else
                {
                    payload.debitGlId = this.emptyGuid;
                    payload.debitGlName = 'No Debit GL';
                }
            }

            if (this.creditGlId) {
                let creditGlInfo = this.accounts.find(a => a.id === this.creditGlId);
                if (creditGlInfo) {
                    payload.creditGlId = this.creditGlId;
                    payload.creditGlName = creditGlInfo.accountIdentifier;
                }else
                {
                    payload.creditGlId = this.emptyGuid;
                    payload.creditGlName = 'No Credit GL';
                }
            }
            payload.ouId = this.ouId;
            payload.isInvoiceDebit = true;
            payload.batchNumber = this.batchNumber;
            payload.chequeDate = this.chequeDate;
            payload.supplierId = this.supplierId;
            payload.id = this.debitMemoId;
           
            try{
                const res = await axios.put(
                    ENDPOINTS.applyMemo,
                    payload,
                );
                if (res.data.result.code === 200) {
                    this.toastHandler('', 'Debit Memo Applied.');
                    this.isLoading = false;
                } else {
                    this.toastHandler('error', res.data.result.message);
                    this.isLoading = false;
                }
                await this.getDebitMemos();
            }
                catch(error) {
                    this.toastHandler('error', 'Unable to Apply Debit Memo.');
                    await this.getDebitMemos();
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
        await this.getDebitMemos();
        this.isShimmerLoading = false;
    }
});
app.use(DataGridPlugin);
app.use(WSelectPlugin);
app.mount('#app');
})();
