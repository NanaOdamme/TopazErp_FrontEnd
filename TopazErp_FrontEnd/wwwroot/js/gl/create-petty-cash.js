/**
 * General Ledger - Petty Cash Transaction Entry / Edit (Vue 3)
 * Dual-mode page: /GeneralLedger/CreatePettyCash (new) and ?id= (edit).
 * Listing lives on /GeneralLedger/PettyCash.
 */
const app = Vue.createApp({
    data() {
        const todayStr = new Date().toISOString().split('T')[0];
        return {
            theme: '#0645e7',
            isLoading: false,
            isShimmerLoading: false,
            isFetching: false,
            isEditing: false,
            showPrintModal: false,

            // Server-loaded lookups
            accountsList: [],
            pettyCashAccounts: [],
            expenseAccountsList: [],
            costCenterList: [],
            recipientList: [],
            currencyList: [],
            defaultGlSetup: null,
            currentSystemNumber: null,
            currentUser: 'Leticia',

            // Entry Form State
            entryForm: {
                id: null,
                batchDate: todayStr,
                batchNo: '',
                sourceDocNo: '',
                pettyCashAccountId: '',
                pettyCashAccountName: '',
                batchOriginator: 'Leticia',
                currencyId: '',
                currencyName: 'Ghana Cedi',
                currencyCode: 'GHS',
                currencyRate: 1.0000,
                totalAmount: 0,
                isPosted: false,
                lines: []
            },

            emptyFormTemplate: {
                id: null,
                batchDate: todayStr,
                batchNo: '',
                sourceDocNo: '',
                pettyCashAccountId: '',
                pettyCashAccountName: '',
                batchOriginator: '',
                currencyId: '',
                currencyName: 'Ghana Cedi',
                currencyCode: 'GHS',
                currencyRate: 1.0000,
                totalAmount: 0,
                isPosted: false,
                lines: []
            }
        };
    },

    computed: {
        totalLineAmount() {
            if (!this.entryForm.lines) return 0;
            return this.entryForm.lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
        }
    },

    methods: {
        goToListing() {
            window.location.href = '/GeneralLedger/PettyCash';
        },

        formatNumber(num) {
            if (num === null || num === undefined || isNaN(num)) return '0.00';
            const val = Number(num);
            if (val < 0) {
                return `(${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
            }
            return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        createEmptyLine(custom = {}) {
            return {
                uid: 'line_' + Math.random().toString(36).substring(2, 9),
                id: null,
                transactionDate: this.entryForm.batchDate || new Date().toISOString().split('T')[0],
                refNo: '',
                expenseAccountId: '',
                expenseAccountName: '',
                description: '',
                amount: null,
                ouId: '',
                ouName: '',
                recipientId: '',
                recipientName: '',
                ...custom
            };
        },

        addLineItem() {
            this.entryForm.lines.push(this.createEmptyLine());
        },

        removeLineItem(idx) {
            if (this.entryForm.lines.length <= 1) {
                this.toast('warning', 'At least one transaction line item is required.');
                return;
            }
            this.entryForm.lines.splice(idx, 1);
        },

        duplicateLineItem(idx) {
            const target = this.entryForm.lines[idx];
            if (!target) return;
            const cloned = {
                ...JSON.parse(JSON.stringify(target)),
                uid: 'line_' + Math.random().toString(36).substring(2, 9),
                id: null
            };
            this.entryForm.lines.splice(idx + 1, 0, cloned);
            this.toast('info', 'Expense line duplicated.');
        },

        onPettyCashAccountChange() {
            const acc = this.accountsList.find(a => String(a.id) === String(this.entryForm.pettyCashAccountId));
            if (acc) {
                this.entryForm.pettyCashAccountName = acc.accountIdentifier || `${acc.accountNo} - ${acc.accountName}`;
            }
        },

        onCurrencyChange() {
            const curr = this.currencyList.find(c => String(c.id) === String(this.entryForm.currencyId));
            if (curr) {
                this.entryForm.currencyName = curr.currencyName || curr.name || 'Ghana Cedi';
                this.entryForm.currencyCode = curr.currencyCode || curr.code || 'GHS';
                this.entryForm.currencyRate = Number(curr.rate || curr.buyRate || curr.sellingRate || 1.0000);
            }
        },

        onLineAccountChange(line) {
            const acc = this.accountsList.find(a => String(a.id) === String(line.expenseAccountId));
            if (acc) {
                line.expenseAccountName = acc.accountIdentifier || `${acc.accountNo} - ${acc.accountName}`;
            }
        },

        onLineOuChange(line) {
            const ou = this.costCenterList.find(c => String(c.id) === String(line.ouId));
            if (ou) {
                line.ouName = ou.name;
            }
        },

        onLineRecipientChange(line) {
            const rec = this.recipientList.find(r => String(r.id) === String(line.recipientId));
            if (rec) {
                line.recipientName = rec.recipient || rec.name || '';
            }
        },

        async generateBatchNumber() {
            if (this.isEditing) {
                this.toast('info', 'Batch number cannot be regenerated for an existing entry.');
                return;
            }

            try {
                const response = await axios.get('/SharedResource/GetSystemNumbers');
                const systemNumbers = response.data.result || response.data || [];
                if (Array.isArray(systemNumbers) && systemNumbers.length > 0) {
                    const sn = systemNumbers.find(item =>
                        item.key === 'petty-cash-batch-id' ||
                        item.key === 'pettycash-batch-id' ||
                        item.key === 'petty-cash' ||
                        item.itemName === 'PettyCashBatch' ||
                        (item.itemName && item.itemName.toLowerCase().includes('pettycash')) ||
                        (item.key && item.key.toLowerCase().includes('pettycash'))
                    );
                    if (sn) {
                        this.currentSystemNumber = sn;
                        this.entryForm.batchNo = `${sn.prefix || ''}${sn.lastNo || ''}${sn.suffix || ''}`;
                        return;
                    }
                }
            } catch (err) {
                console.warn('Unable to fetch system numbers for petty cash batch:', err);
            }

            // Fallback generated batch number
            const rand = Math.floor(1000 + Math.random() * 9000);
            this.entryForm.batchNo = `${rand}`;
        },

        newBatch() {
            this.isEditing = false;
            const todayStr = new Date().toISOString().split('T')[0];

            this.entryForm = {
                ...JSON.parse(JSON.stringify(this.emptyFormTemplate)),
                batchDate: todayStr,
                batchOriginator: this.currentUser || 'Leticia',
                lines: [this.createEmptyLine({ transactionDate: todayStr })]
            };

            // Set default currency
            if (this.currencyList.length > 0) {
                const defaultCurr = this.currencyList.find(c =>
                    c.isDefault ||
                    (c.currencyName && c.currencyName.toLowerCase().includes('cedi')) ||
                    (c.currencyCode && c.currencyCode.toUpperCase() === 'GHS')
                ) || this.currencyList[0];

                if (defaultCurr) {
                    this.entryForm.currencyId = defaultCurr.id;
                    this.entryForm.currencyCode = defaultCurr.currencyCode || defaultCurr.code || 'GHS';
                    this.entryForm.currencyName = defaultCurr.currencyName || defaultCurr.name || 'Ghana Cedi';
                    this.entryForm.currencyRate = 1.0000;
                }
            }

            // Set default Petty Cash Account
            if (this.defaultGlSetup?.pettyCashGlAccountId) {
                this.entryForm.pettyCashAccountId = this.defaultGlSetup.pettyCashGlAccountId;
                this.onPettyCashAccountChange();
            } else if (this.pettyCashAccounts.length > 0) {
                this.entryForm.pettyCashAccountId = this.pettyCashAccounts[0].id;
                this.onPettyCashAccountChange();
            }

            this.generateBatchNumber();

            if (window.history.pushState) {
                window.history.pushState({}, '', '/GeneralLedger/CreatePettyCash');
            }
        },

        loadBatch(batch) {
            if (!batch) return;
            this.isEditing = true;

            const batchDateFormatted = batch.batchDate ? String(batch.batchDate).split('T')[0] : new Date().toISOString().split('T')[0];

            this.entryForm = {
                id: batch.id,
                batchDate: batchDateFormatted,
                batchNo: batch.batchNo || '',
                sourceDocNo: batch.sourceDocNo || '',
                pettyCashAccountId: batch.pettyCashAccountId || '',
                pettyCashAccountName: batch.pettyCashAccountName || '',
                batchOriginator: batch.batchOriginator || this.currentUser || 'Leticia',
                currencyId: batch.currencyId || '',
                currencyName: batch.currencyName || 'Ghana Cedi',
                currencyCode: batch.currencyCode || 'GHS',
                currencyRate: Number(batch.currencyRate) || 1.0000,
                totalAmount: Number(batch.totalAmount) || 0,
                isPosted: Boolean(batch.isPosted),
                lines: (batch.details && batch.details.length > 0)
                    ? batch.details.map(d => ({
                        uid: 'line_' + Math.random().toString(36).substring(2, 9),
                        id: d.id,
                        transactionDate: d.transactionDate ? String(d.transactionDate).split('T')[0] : batchDateFormatted,
                        refNo: d.refNo || '',
                        expenseAccountId: d.expenseAccountId || '',
                        expenseAccountName: d.expenseAccountName || '',
                        description: d.description || '',
                        amount: Number(d.amount) || 0,
                        ouId: d.ouId || '',
                        ouName: d.ouName || '',
                        recipientId: d.recipientId || '',
                        recipientName: d.recipientName || ''
                    }))
                    : [this.createEmptyLine({ transactionDate: batchDateFormatted })]
            };

            if (window.history.pushState && batch.id) {
                window.history.pushState({}, '', `/GeneralLedger/CreatePettyCash?id=${encodeURIComponent(batch.id)}`);
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        async loadBatchById(id) {
            if (!id) return;
            this.isFetching = true;
            try {
                const resp = await axios.get('/GeneralLedger/GetPettyCashTransactions?pageNo=1&pageSize=1000');
                const raw = resp.data;
                let list = [];
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result?.data && Array.isArray(raw.result.data)) {
                    list = raw.result.data;
                } else if (raw?.data && Array.isArray(raw.data)) {
                    list = raw.data;
                }

                const match = list.find(b => String(b.id).toLowerCase() === String(id).toLowerCase());
                if (match) {
                    this.loadBatch(match);
                } else {
                    this.toast('warning', 'Petty cash batch could not be found.');
                }
            } catch (err) {
                console.error('Error loading petty cash batch:', err);
                this.toast('error', 'Unable to load batch details.');
            } finally {
                this.isFetching = false;
            }
        },

        async deletePettyCashBatch(id, batchNo) {
            if (!id) return;

            const res = await Swal.fire({
                title: 'Delete Petty Cash Batch?',
                html: `Are you sure you want to delete Batch <strong>#${batchNo || id}</strong>?<br><span class="text-xs text-slate-500">All associated expense line items will be removed.</span>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, delete',
                cancelButtonText: 'Cancel'
            });

            if (!res.isConfirmed) return;

            this.isLoading = true;
            try {
                await axios.delete(`/GeneralLedger/DeletePettyCash?id=${id}`);
                this.toast('success', 'Petty cash batch deleted successfully.');
                this.goToListing();
            } catch (err) {
                console.error('Error deleting petty cash batch:', err);
                this.toast('error', 'Unable to delete petty cash batch.');
            } finally {
                this.isLoading = false;
            }
        },

        validateEntryForm() {
            if (!this.entryForm.batchDate) {
                this.toast('warning', 'Batch Date is required.');
                return false;
            }
            if (!this.entryForm.batchNo || !this.entryForm.batchNo.trim()) {
                this.toast('warning', 'Batch Number is required.');
                return false;
            }
            if (!this.entryForm.pettyCashAccountId) {
                this.toast('warning', 'Petty Cash G/L Account is required.');
                return false;
            }
            if (!this.entryForm.batchOriginator || !this.entryForm.batchOriginator.trim()) {
                this.toast('warning', 'Batch Originator is required.');
                return false;
            }
            if (!this.entryForm.lines || !this.entryForm.lines.length) {
                this.toast('warning', 'Please add at least one transaction line item.');
                return false;
            }

            for (let i = 0; i < this.entryForm.lines.length; i++) {
                const line = this.entryForm.lines[i];
                const rowNum = i + 1;
                if (!line.expenseAccountId) {
                    this.toast('warning', `Row #${rowNum}: Please select an Expense G/L Account.`);
                    return false;
                }
                if (!line.description || !line.description.trim()) {
                    this.toast('warning', `Row #${rowNum}: Description is required.`);
                    return false;
                }
                const amt = Number(line.amount);
                if (isNaN(amt) || amt <= 0) {
                    this.toast('warning', `Row #${rowNum}: Amount must be greater than zero.`);
                    return false;
                }
            }

            return true;
        },

        async savePettyCashBatch() {
            if (!this.validateEntryForm() || this.isLoading) return;

            this.isLoading = true;
            try {
                // Prepare line items
                const details = this.entryForm.lines.map(line => ({
                    id: line.id || undefined,
                    transactionDate: line.transactionDate || this.entryForm.batchDate,
                    refNo: (line.refNo || '').trim(),
                    expenseAccountId: line.expenseAccountId,
                    expenseAccountName: line.expenseAccountName || '',
                    description: (line.description || '').trim(),
                    amount: Number(line.amount) || 0,
                    ouId: line.ouId || null,
                    ouName: line.ouName || '',
                    recipientId: line.recipientId || null,
                    recipientName: line.recipientName || ''
                }));

                const payload = {
                    id: this.entryForm.id || undefined,
                    batchDate: this.entryForm.batchDate,
                    batchNo: this.entryForm.batchNo.trim(),
                    sourceDocNo: (this.entryForm.sourceDocNo || '').trim(),
                    pettyCashAccountId: this.entryForm.pettyCashAccountId,
                    pettyCashAccountName: this.entryForm.pettyCashAccountName || '',
                    batchOriginator: this.entryForm.batchOriginator.trim(),
                    currencyId: this.entryForm.currencyId,
                    currencyName: this.entryForm.currencyName,
                    currencyCode: this.entryForm.currencyCode,
                    currencyRate: Number(this.entryForm.currencyRate) || 1.0000,
                    totalAmount: this.totalLineAmount,
                    isPosted: Boolean(this.entryForm.isPosted),
                    details: details
                };

                let resp = null;
                if (this.isEditing && this.entryForm.id) {
                    resp = await axios.post('/GeneralLedger/UpdatePettyCash', payload);
                    this.toast('success', 'Petty cash batch updated successfully.');
                } else {
                    resp = await axios.post('/GeneralLedger/CreatePettyCash', payload);

                    // Increment system number if used
                    if (this.currentSystemNumber) {
                        try {
                            const updatedSn = {
                                ...this.currentSystemNumber,
                                lastNo: (parseInt(this.currentSystemNumber.lastNo) || 0) + 1
                            };
                            await axios.post('/SharedResource/UpdateSystemNumber', updatedSn);
                        } catch (snErr) {
                            console.warn('System number increment warning:', snErr);
                        }
                    }

                    this.toast('success', 'Petty cash batch saved successfully.');
                }

                // Back to the listings page
                this.goToListing();
            } catch (err) {
                console.error('Error saving petty cash batch:', err);
                const errMsg = err?.response?.data?.message || err?.message || 'Unable to save petty cash batch.';
                this.toast('error', errMsg);
            } finally {
                this.isLoading = false;
            }
        },

        revertEntryForm() {
            if (this.isEditing && this.entryForm.id) {
                this.loadBatchById(this.entryForm.id);
            } else {
                this.newBatch();
            }
        },

        printVoucherModal() {
            if (!this.entryForm.lines.length) {
                this.toast('warning', 'No lines to preview.');
                return;
            }
            this.showPrintModal = true;
        },

        printNow() {
            window.print();
        },

        async initEntryData() {
            try {
                const resp = await axios.get('/GeneralLedger/InitPettyCashEntry');
                const data = resp.data || {};

                if (data.currentUser) {
                    this.currentUser = data.currentUser;
                    if (!this.entryForm.batchOriginator) {
                        this.entryForm.batchOriginator = data.currentUser;
                    }
                }

                if (data.accounts && Array.isArray(data.accounts)) {
                    this.accountsList = data.accounts.map(a => ({
                        id: a.id,
                        accountNo: a.accountNo || a.accountNumber || '',
                        accountName: a.accountName || a.name || '',
                        accountIdentifier: a.accountIdentifier || `${a.accountNo || a.accountNumber || ''} - ${a.accountName || a.name || ''}`,
                        accountHeadName: a.accountHeadName || a.category || ''
                    })).sort((a, b) => String(a.accountNo ?? '').localeCompare(String(b.accountNo ?? '')));

                    // Identify Expense Accounts (starts with 5 or AccountHead is Expense)
                    this.expenseAccountsList = this.accountsList.filter(a =>
                        String(a.accountNo).startsWith('5') ||
                        (a.accountHeadName && a.accountHeadName.toLowerCase().includes('expense'))
                    );

                    // Identify Petty Cash Accounts (Cash & Bank, Petty Cash, or 12xxx)
                    this.pettyCashAccounts = this.accountsList.filter(a =>
                        (a.accountName && a.accountName.toLowerCase().includes('petty cash')) ||
                        (a.accountName && a.accountName.toLowerCase().includes('cash')) ||
                        String(a.accountNo).startsWith('12') ||
                        String(a.accountNo).startsWith('10')
                    );
                }

                if (data.costCenters && Array.isArray(data.costCenters)) {
                    this.costCenterList = data.costCenters;
                } else if (data.departments && Array.isArray(data.departments)) {
                    this.costCenterList = data.departments;
                }

                if (data.recipients && Array.isArray(data.recipients)) {
                    this.recipientList = data.recipients;
                }

                if (data.currencies && Array.isArray(data.currencies)) {
                    this.currencyList = data.currencies;
                }

                if (data.defaultGlNumbers) {
                    this.defaultGlSetup = data.defaultGlNumbers;
                }
            } catch (err) {
                console.warn('Error during InitPettyCashEntry, falling back to separate calls:', err);
                await Promise.allSettled([
                    this.getAccounts(),
                    this.getCostCenters(),
                    this.getRecipients(),
                    this.getCurrencies()
                ]);
            }
        },

        async getAccounts() {
            try {
                const resp = await axios.get('/GeneralLedger/GetAccountDetails?pageNo=1&pageSize=5555&isActive=true');
                const raw = resp.data?.result || resp.data;
                const list = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
                this.accountsList = list.map(a => ({
                    id: a.id,
                    accountNo: a.accountNo || a.accountNumber || '',
                    accountName: a.accountName || a.name || '',
                    accountIdentifier: a.accountIdentifier || `${a.accountNo || a.accountNumber || ''} - ${a.accountName || a.name || ''}`,
                    accountHeadName: a.accountHeadName || a.category || ''
                })).sort((a, b) => String(a.accountNo ?? '').localeCompare(String(b.accountNo ?? '')));

                this.expenseAccountsList = this.accountsList.filter(a =>
                    String(a.accountNo).startsWith('5') ||
                    (a.accountHeadName && a.accountHeadName.toLowerCase().includes('expense'))
                );

                this.pettyCashAccounts = this.accountsList.filter(a =>
                    (a.accountName && a.accountName.toLowerCase().includes('petty cash')) ||
                    (a.accountName && a.accountName.toLowerCase().includes('cash')) ||
                    String(a.accountNo).startsWith('12')
                );
            } catch (err) {
                console.warn('Fallback accounts fetch failed:', err);
            }
        },

        async getCostCenters() {
            try {
                const resp = await axios.get('/SharedResource/GetCostCenters?pageNo=1&pageSize=2000');
                const raw = resp.data?.result || resp.data;
                this.costCenterList = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
            } catch (err) {
                console.warn('Fallback cost centers fetch failed:', err);
            }
        },

        async getRecipients() {
            try {
                const resp = await axios.get('/GeneralLedger/GetPettyCashRecipients?pageNo=1&pageSize=1000');
                const raw = resp.data?.result || resp.data;
                this.recipientList = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
            } catch (err) {
                console.warn('Fallback recipients fetch failed:', err);
            }
        },

        async getCurrencies() {
            try {
                const resp = await axios.get('/SharedResource/GetCurrencies');
                const raw = resp.data?.result || resp.data;
                this.currencyList = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
            } catch (err) {
                console.warn('Fallback currencies fetch failed:', err);
            }
        },

        toast(type, message) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'success'),
                    title: message,
                    showConfirmButton: false,
                    timer: 3500,
                    timerProgressBar: true
                });
            } else if (typeof toastr !== 'undefined') {
                toastr[type] ? toastr[type](message) : toastr.info(message);
            } else {
                alert(message);
            }
        }
    },

    async mounted() {
        const urlParams = new URLSearchParams(window.location.search);
        const queryId = urlParams.get('id');
        const container = document.getElementById('app');
        const datasetId = container?.dataset?.pettyCashId;
        const targetId = queryId || datasetId;

        this.isShimmerLoading = true;
        try {
            await this.initEntryData();

            if (targetId && targetId !== '00000000-0000-0000-0000-000000000000') {
                await this.loadBatchById(targetId);
            } else {
                this.newBatch();
            }
        } catch (err) {
            console.error('Initialization error in Petty Cash entry page:', err);
        } finally {
            this.isShimmerLoading = false;
        }
    }
});

app.use(DataGridPlugin);
app.mount('#app');
