const app = Vue.createApp({

    data() {
        return {
            theme: '#0645e7',
            isShimmerLoading: false,
            emptyGuid: '00000000-0000-0000-0000-000000000000',

            coaDetailList: [],           // raw flat list from server
            accountControlList: [],      // raw control accounts from server
            accountControlOptions: [],   // [{ label, value, min, max, type }]
            accountHeadList: [],         // raw account heads/groups from server
            currencyList: [],            // raw currencies from server
            currencyOptions: [],         // [{ label, value, code, name }]

            standardAccountTypes: [
                { label: 'Asset', value: 1, color: 'blue' },
                { label: 'Liability', value: 2, color: 'amber' },
                { label: 'Equity', value: 3, color: 'violet' },
                { label: 'Revenue', value: 4, color: 'emerald' },
                { label: 'Expense', value: 5, color: 'rose' },
                { label: 'Other Income', value: 6, color: 'teal' },
                { label: 'Other Expense', value: 7, color: 'orange' },
                { label: 'Sales', value: 8, color: 'cyan' },
                { label: 'Cost of Sales', value: 9, color: 'indigo' },
                { label: 'Selling Expenses', value: 10, color: 'pink' }
            ],

            statusOptions: [
                { label: 'Active', value: 'Active', color: 'emerald' },
                { label: 'Inactive', value: 'Inactive', color: 'slate' }
            ]
        };
    },

    computed: {
        coaDetailCol() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'accountName',
                    label: 'Account Name',
                    type: 'avatar',
                    width: 260,
                    minWidth: 200,
                    required: true,
                    searchable: true,
                    subtitleKey: 'accountControlName'
                },
                {
                    key: 'accountNo',
                    label: 'Account No',
                    type: 'number',
                    required: true,
                    searchable: true,
                    width: 140
                },
                {
                    key: 'accountControlId',
                    label: 'Account Control',
                    type: 'select',
                    options: this.accountControlOptions,
                    required: true,
                    searchable: true,
                    width: 250,
                    onChange: (val, values) => {
                        const acctType = this.getAccountTypeForControl(val);
                        if (acctType && values) {
                            values.standardAccountType = acctType;
                        }
                    }
                },
                {
                    key: 'standardAccountType',
                    label: 'Account Type',
                    type: 'badge',
                    options: this.standardAccountTypes,
                    required: false,
                    searchable: true,
                    width: 160
                },
                {
                    key: 'currencyId',
                    label: 'Currency',
                    type: 'select',
                    options: this.currencyOptions,
                    required: true,
                    searchable: true,
                    width: 170
                },
                {
                    key: 'currentBalance',
                    label: 'Current Balance',
                    type: 'currency',
                    currency: 'GHS',
                    editable: false,
                    width: 160,
                    hidden: true,
                    searchable: true
                },
                {
                    key: 'currentForeignBalance',
                    label: 'Foreign Balance',
                    type: 'number',
                    decimals: 2,
                    editable: false,
                    width: 160,
                    hidden: true,
                    searchable: true
                },
                {
                    key: 'status',
                    label: 'Status',
                    type: 'badge',
                    options: this.statusOptions,
                    required: false,
                    defaultValue: 'Active',
                    default: 'Active',
                    searchable: true,
                    width: 120
                }
            ];
        }
    },

    methods: {

        /* ── Fetch ──────────────────────────────────────────────── */

        async getAccountHeads() {
            try {
                const response = await axios.get('/GeneralLedger/GetAccountHeads?pageNo=1&pageSize=2000');
                const res = response.data;
                this.accountHeadList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);
            } catch (error) {
                console.error('Failed to load account heads:', error);
            }
        },

        getAccountTypeForControl(controlId) {
            if (!controlId) return 1;
            const control = this.accountControlList.find(h => String(h.id) === String(controlId));
            if (!control) return 1;

            // 1. Direct standardAccountType / accountHeadType
            if (control.standardAccountType !== undefined && control.standardAccountType !== null && Number(control.standardAccountType) > 0) {
                return Number(control.standardAccountType);
            }
            if (control.accountHeadType !== undefined && control.accountHeadType !== null && Number(control.accountHeadType) > 0) {
                return Number(control.accountHeadType);
            }

            // 2. Lookup via AccountGroupId / AccountHeadId in accountHeadList
            const groupId = control.accountGroupId || control.accountHeadId;
            if (groupId && this.accountHeadList && this.accountHeadList.length) {
                const head = this.accountHeadList.find(a => String(a.id) === String(groupId));
                if (head && head.standardAccountType !== undefined && head.standardAccountType !== null && Number(head.standardAccountType) > 0) {
                    return Number(head.standardAccountType);
                }
            }

            return Number(control.type) || 1;
        },

        async getAccountControls() {
            try {
                const response = await axios.get('/GeneralLedger/GetAccountControls?pageNo=1&pageSize=2000');
                const res = response.data;
                const rawList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);
                this.accountControlList = rawList;
                this.accountControlOptions = rawList.map(h => {
                    const controlName = h.accountControlName || h.accountHeaderName || h.name || 'Unnamed';
                    const range = (h.minAccount || h.maxAccount) ? ` (${h.minAccount} - ${h.maxAccount})` : '';
                    const acctType = this.getAccountTypeForControl(h.id);
                    return {
                        label: `${controlName}${range}`,
                        value: h.id,
                        name: controlName,
                        min: Number(h.minAccount) || 0,
                        max: Number(h.maxAccount) || 0,
                        type: acctType
                    };
                });
            } catch (error) {
                console.error('Failed to load account controls:', error);
            }
        },

        async getCurrencies() {
            try {
                const response = await axios.get('/SharedResource/GetCurrencies?pageNo=1&pageSize=1000');
                const res = response.data;
                const rawList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);
                this.currencyList = rawList;
                this.currencyOptions = rawList.map(c => ({
                    label: `${c.currencyCode} - ${c.currencyName}`,
                    value: c.id,
                    code: c.currencyCode,
                    name: c.currencyName
                }));
            } catch (error) {
                console.error('Failed to load currencies:', error);
            }
        },

        async getAccountDetails() {
            this.isShimmerLoading = true;
            try {
                const response = await axios.get('/GeneralLedger/GetAccountDetails?pageNo=1&pageSize=2000&isActive=true');
                const res = response.data;

                // Handle paginated { result: { data: [] } }, { result: [] }, or flat []
                const rawList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);

                this.coaDetailList = rawList.map(item => {
                    const controlId = item.accountControlId || item.accountHeaderId || '';
                    const control = this.accountControlList.find(h => h.id === controlId);
                    const currId = item.currencyId || '';
                    const curr = this.currencyList.find(c => c.id === currId);

                    const accountName = item.accountName || item.name || '';
                    const accountControlName = item.accountControlName || item.accountHeaderName || (control ? (control.accountControlName || control.accountHeaderName || control.name) : '');
                    const currencyName = item.currencyName || (curr ? curr.currencyName : '');
                    const currencyCode = item.currencyCode || (curr ? curr.currencyCode : '');
                    const status = item.status ? String(item.status) : 'Active';

                    return {
                        ...item,
                        accountName,
                        name: accountName,
                        accountNo: Number(item.accountNo) || 0,
                        status,
                        accountControlId: controlId,
                        accountHeaderId: controlId,
                        accountControlName,
                        accountHeaderName: accountControlName,
                        currencyId: currId,
                        currencyName,
                        currencyCode,
                        currentBalance: Number(item.currentBalance) || 0,
                        currentForeignBalance: Number(item.currentForeignBalance) || 0,
                        standardAccountType: Number(item.standardAccountType) || this.getAccountTypeForControl(controlId) || 1
                    };
                });
            } catch (error) {
                console.error('Failed to load account details:', error);
                this.toastHandler('error', 'Unable to load chart of account details.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── CRUD handlers wired to <data-grid> events ──────────── */

        async onCreate(event) {
            const row = event?.row || event?.data;
            if (!row || !this.validateRecord(row)) return;

            const controlId = row.accountControlId || row.accountHeaderId;
            const control = this.accountControlList.find(h => h.id === controlId);
            const currency = this.currencyList.find(c => c.id === row.currencyId);

            const accountName = String(row.accountName || row.name || '').trim();
            const accountControlName = control ? (control.accountControlName || control.accountHeaderName || control.name) : '';
            const standardAccountType = Number(row.standardAccountType)
                || this.getAccountTypeForControl(controlId)
                || 1;

            const payload = {
                accountName,
                name: accountName,
                accountNo: parseInt(row.accountNo, 10) || 0,
                status: String(row.status || 'Active').trim(),
                accountControlId: controlId,
                accountControlName,
                accountHeaderId: controlId,
                accountHeaderName: accountControlName,
                currencyId: row.currencyId,
                currencyName: currency ? (currency.currencyName || currency.name) : (row.currencyName || ''),
                currencyCode: currency ? currency.currencyCode : (row.currencyCode || ''),
                currentBalance: Number(row.currentBalance) || 0,
                currentForeignBalance: Number(row.currentForeignBalance) || 0,
                standardAccountType
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/GeneralLedger/CreateAccountDetail', payload);
                await this.getAccountDetails();
                this.toastHandler('success', 'Account detail created successfully.');
            } catch (err) {
                console.error('Create failed:', err);
                this.toastHandler('error', 'Failed to create account detail.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onUpdate(event) {
            const row = event?.row || event?.data;
            if (!row || !this.validateRecord(row)) return;

            const existing = this.coaDetailList.find(
                d => String(d.id) === String(row.id)
            );

            if (!existing) {
                this.toastHandler('error', 'Account detail record was not found.');
                return;
            }

            const controlId = row.accountControlId || row.accountHeaderId || existing.accountControlId;
            const control = this.accountControlList.find(h => h.id === controlId);
            const currency = this.currencyList.find(c => c.id === row.currencyId);

            const accountName = String(row.accountName || row.name || existing.accountName || '').trim();
            const accountControlName = control
                ? (control.accountControlName || control.accountHeaderName || control.name)
                : (existing.accountControlName || existing.accountHeaderName || '');
            const standardAccountType = Number(row.standardAccountType)
                || this.getAccountTypeForControl(controlId)
                || Number(existing.standardAccountType)
                || 1;

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                accountName,
                name: accountName,
                accountNo: parseInt(row.accountNo, 10) || existing.accountNo || 0,
                status: String(row.status || existing.status || 'Active').trim(),
                accountControlId: controlId,
                accountControlName,
                accountHeaderId: controlId,
                accountHeaderName: accountControlName,
                currencyId: row.currencyId || existing.currencyId,
                currencyName: currency ? (currency.currencyName || currency.name) : (row.currencyName || existing.currencyName || ''),
                currencyCode: currency ? currency.currencyCode : (row.currencyCode || existing.currencyCode || ''),
                currentBalance: Number(row.currentBalance) || Number(existing.currentBalance) || 0,
                currentForeignBalance: Number(row.currentForeignBalance) || Number(existing.currentForeignBalance) || 0,
                standardAccountType
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/GeneralLedger/UpdateAccountDetail', payload);

                // Optimistically patch the local list
                const idx = this.coaDetailList.findIndex(
                    d => String(d.id) === String(existing.id)
                );
                if (idx !== -1) {
                    this.coaDetailList.splice(idx, 1, { ...payload });
                }

                this.toastHandler('success', 'Account detail updated successfully.');
            } catch (err) {
                console.error('Update failed:', err);
                this.toastHandler('error', 'Failed to update account detail.');
                await this.getAccountDetails(); // re-sync on failure
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onDelete(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            this.isShimmerLoading = true;
            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/GeneralLedger/DeleteAccountDetail?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} deleted; ${failed} failed.`
                    );
                    await this.getAccountDetails();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} account detail${rows.length !== 1 ? 's' : ''} deleted.`
                    );
                }
            } catch (err) {
                console.error('Delete failed:', err);
                this.toastHandler('error', 'Failed to delete account detail.');
                await this.getAccountDetails();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Validation ─────────────────────────────────────────── */

        validateRecord(row) {
            const accountName = row.accountName || row.name;
            if (!accountName || !String(accountName).trim()) {
                this.toastHandler('warning', 'Account name is required.');
                return false;
            }

            const controlId = row.accountControlId || row.accountHeaderId;
            if (!controlId || controlId === this.emptyGuid) {
                this.toastHandler('warning', 'Please select an Account Control.');
                return false;
            }

            if (!row.currencyId || row.currencyId === this.emptyGuid) {
                this.toastHandler('warning', 'Please select a Currency.');
                return false;
            }

            const accountNo = parseInt(row.accountNo, 10);
            if (isNaN(accountNo) || accountNo <= 0) {
                this.toastHandler('warning', 'A valid positive account number is required.');
                return false;
            }

            // Check if account number falls within the selected account control's defined range
            const control = this.accountControlList.find(h => h.id === controlId);
            if (control && control.minAccount && control.maxAccount) {
                const min = Number(control.minAccount);
                const max = Number(control.maxAccount);
                if (min > 0 && max > 0 && (accountNo < min || accountNo > max)) {
                    const controlName = control.accountControlName || control.accountHeaderName || control.name || 'selected control';
                    this.toastHandler('warning', `Account number must be between ${min} and ${max} for "${controlName}".`);
                    return false;
                }
            }

            return true;
        },

        /* ── Helpers ─────────────────────────────────────────────── */

        bindFormChangeListeners() {
            document.addEventListener('change', (e) => {
                const target = e.target;
                if (target && target.id === 'f-accountControlId') {
                    const controlId = target.value;
                    const acctType = this.getAccountTypeForControl(controlId);
                    if (acctType) {
                        const typeSelect = document.getElementById('f-standardAccountType');
                        if (typeSelect && String(typeSelect.value) !== String(acctType)) {
                            typeSelect.value = acctType;
                            typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                }
            });
        },

        toastHandler(type, message = 'An unexpected error occurred.') {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                    title: message,
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true
                });
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }
    },

    async mounted() {
        await this.getAccountHeads();
        await Promise.all([
            this.getAccountControls(),
            this.getCurrencies()
        ]);
        await this.getAccountDetails();
        this.bindFormChangeListeners();
    }
});

app.use(DataGridPlugin);
app.mount('#app');
