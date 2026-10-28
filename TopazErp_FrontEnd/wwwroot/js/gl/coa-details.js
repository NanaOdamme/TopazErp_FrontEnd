const app = Vue.createApp({

    data() {
        return {
            theme: '#0645e7',
            isShimmerLoading: true,
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
            ],

            /* Tracks the selected account control's range live so accountNo
               column constraints update reactively as the user changes controls. */
            _controlRange: { min: null, max: null, name: '' },

            _accountNoDuplicateError: null,
            _accountNoChecking: false,
            _lastCheckedAccountNo: null,
            _accountNoDebounceTimer: null,
            _bypassSubmitCheck: false
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
                // ── Account Control FIRST so it unlocks Account No ──────────────
                {
                    key: 'accountControlId',
                    label: 'Account Control',
                    type: 'select',
                    options: this.accountControlOptions,
                    required: true,
                    searchable: true,
                    width: 280,
                    wrap: true,
                    onChange: (val, values) => {
                        // 1. Auto-set Account Type from the selected control
                        const acctType = this.getAccountTypeForControl(val);
                        if (acctType && values) {
                            values.standardAccountType = acctType;
                        }

                        // 2. Update reactive _controlRange → accountNo constraints re-evaluate
                        this.syncControlRange(val);

                        // 3. Sync native DOM attributes for instant browser enforcement
                        this.$nextTick(() => {
                            const el = document.getElementById('f-accountNo');
                            if (!el) return;
                            el.removeAttribute('min');
                            el.removeAttribute('max');
                            if (this._controlRange.min != null) {
                                el.placeholder = `${this._controlRange.min} – ${this._controlRange.max}`;
                                el.disabled = false;
                            } else {
                                el.placeholder = '';
                                el.disabled = true;
                            }
                        });
                    }
                },
                // ── Account No SECOND — disabled until a control is chosen ───────
                {
                    key: 'accountNo',
                    label: 'Account No',
                    type: 'text',
                    required: true,
                    searchable: true,
                    sortable: true,
                    width: 140,
                    // Reactive disabled: reads _controlRange so Vue re-evaluates when it changes
                    disabled: this._controlRange.min === null,
                    placeholder: this._controlRange.min !== null
                        ? `${this._controlRange.min} – ${this._controlRange.max}`
                        : '',
                    help: this._controlRange.min !== null
                        ? `Must be between ${this._controlRange.min} and ${this._controlRange.max} (${this._controlRange.name})`
                        : 'Select an Account Control first',
                    validate: (val, row) => {
                        const clean = String(val ?? '').trim();
                        if (!clean) return 'Account No is required.';

                        const r = this._controlRange;
                        if (r.min != null && r.max != null) {
                            const n = parseInt(clean, 10);
                            const min = parseInt(r.min, 10);
                            const max = parseInt(r.max, 10);
                            if (!isNaN(n) && !isNaN(min) && !isNaN(max) && (n < min || n > max)) {
                                return `Account No must be between ${r.min} and ${r.max} for "${r.name}".`;
                            }
                        }

                        // In create mode (row is null/undefined), reject if duplicate exists
                        if (!row && this._accountNoDuplicateError) {
                            return this._accountNoDuplicateError;
                        }

                        return true;
                    }
                },
                {
                    key: 'standardAccountType',
                    label: 'Account Type',
                    type: 'badge',
                    options: this.standardAccountTypes,
                    required: false,
                    searchable: true,
                    width: 160,
                    help: 'Auto-set when an Account Control is selected'
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
                if (this.accountControlList && this.accountControlList.length) {
                    this.buildAccountControlOptions();
                }
            } catch (error) {
                console.error('Failed to load account heads:', error);
            }
        },

        /* ── Hierarchy Resolvers for Account Controls ───────────── */

        getAccountHeadPathSegments(headId, visited = new Set()) {
            if (!headId || headId === this.emptyGuid || visited.has(headId)) return [];
            visited.add(headId);

            const head = this.accountHeadList.find(h => String(h.id) === String(headId));
            if (!head) return [];

            const name = String(head.name || head.accountHeadName || '').trim();
            const parentId = head.parentId || head.parentAccountHeadId;

            let segments = [];
            if (parentId && parentId !== this.emptyGuid && String(parentId) !== String(headId)) {
                segments = this.getAccountHeadPathSegments(parentId, visited);
            }
            if (name) {
                segments.push(name);
            }
            return segments;
        },

        getControlPathSegments(control, visited = new Set()) {
            if (!control || visited.has(control.id)) {
                const name = String(control?.accountControlName || control?.accountHeaderName || control?.name || '').trim();
                return name ? [name] : [];
            }
            visited.add(control.id);

            const controlName = String(control.accountControlName || control.accountHeaderName || control.name || '').trim();

            // If control already has a pre-built hierarchical parentName from server (e.g. "Parent/Child")
            if (control.parentName && String(control.parentName).includes('/')) {
                const parts = String(control.parentName).split('/').map(s => s.trim()).filter(Boolean);
                if (parts.length > 0) return parts;
            }

            const parentControlId = control.parentAccountHeaderId || control.parentControlId;
            let segments = [];
            if (parentControlId && parentControlId !== this.emptyGuid && String(parentControlId) !== String(control.id)) {
                const parentControl = this.accountControlList.find(c => String(c.id) === String(parentControlId));
                if (parentControl) {
                    segments = this.getControlPathSegments(parentControl, visited);
                }
            }

            if (controlName) {
                segments.push(controlName);
            }
            return segments;
        },

        buildAccountControlHierarchy(control) {
            if (!control) return '';

            // 1. Control hierarchy segments (e.g. ['Parent Control', 'Child Control'])
            const controlSegments = this.getControlPathSegments(control);

            // 2. Account Head / Group segments (e.g. ['Assets', 'Current Assets'])
            const groupId = control.accountGroupId || control.accountHeadId;
            const headSegments = groupId ? this.getAccountHeadPathSegments(groupId) : [];

            // Combine head and control segments without repeating adjacent identical names
            let combined = [...headSegments];
            if (combined.length > 0 && controlSegments.length > 0) {
                const lastHead = combined[combined.length - 1].toLowerCase();
                const firstControl = controlSegments[0].toLowerCase();
                if (lastHead === firstControl) {
                    combined = combined.slice(0, -1);
                }
            }
            combined.push(...controlSegments);

            if (!combined.length) {
                return control.accountControlName || control.accountHeaderName || control.name || 'Unnamed';
            }

            return combined.join('/');
        },

        buildAccountControlOptions() {
            if (!this.accountControlList || !this.accountControlList.length) {
                this.accountControlOptions = [];
                return;
            }

            this.accountControlOptions = this.accountControlList.map(h => {
                const hierarchyPath = this.buildAccountControlHierarchy(h);
                const range = (h.minAccount || h.maxAccount) ? ` (${h.minAccount} - ${h.maxAccount})` : '';
                const acctType = this.getAccountTypeForControl(h.id);
                return {
                    label: `${hierarchyPath}${range}`,
                    value: h.id,
                    name: hierarchyPath,
                    rawName: h.accountControlName || h.accountHeaderName || h.name || 'Unnamed',
                    path: hierarchyPath,
                    min: Number(h.minAccount) || 0,
                    max: Number(h.maxAccount) || 0,
                    type: acctType
                };
            }).sort((a, b) => a.label.localeCompare(b.label));
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
            this.isShimmerLoading = true;
            try {
                const response = await axios.get('/GeneralLedger/GetAccountControls?pageNo=1&pageSize=2000');
                const res = response.data;
                const rawList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);
                this.accountControlList = rawList;
                this.buildAccountControlOptions();
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
                    const controlHierarchyName = control ? this.buildAccountControlHierarchy(control) : '';
                    const accountControlName = controlHierarchyName || item.accountControlName || item.accountHeaderName || (control ? (control.accountControlName || control.accountHeaderName || control.name) : '');
                    const currencyName = item.currencyName || (curr ? curr.currencyName : '');
                    const currencyCode = item.currencyCode || (curr ? curr.currencyCode : '');
                    const status = item.status ? String(item.status) : 'Active';

                    return {
                        ...item,
                        accountName,
                        name: accountName,
                        accountNo: item.accountNo != null ? String(item.accountNo) : '',
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

            // Ensure account number does not already exist
            const isDuplicate = await this.checkAccountNoExists(row.accountNo);
            if (isDuplicate) {
                this.toastHandler('warning', `Account number ${row.accountNo} already exists.`);
                await this.getAccountDetails();
                return;
            }

            const controlId = row.accountControlId || row.accountHeaderId;
            const control = this.accountControlList.find(h => h.id === controlId);
            const currency = this.currencyList.find(c => c.id === row.currencyId);

            const accountName = String(row.accountName || row.name || '').trim();
            const accountControlName = control ? (control.accountControlName || control.accountHeaderName || control.name) : '';
            const standardAccountType = Number(row.standardAccountType)
                || this.getAccountTypeForControl(controlId)
                || 1;

            const acctNoParsed = parseInt(row.accountNo, 10);
            const payload = {
                accountName,
                name: accountName,
                accountNo: !isNaN(acctNoParsed) ? acctNoParsed : (row.accountNo != null ? String(row.accountNo).trim() : 0),
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

            const acctNoParsed = parseInt(row.accountNo, 10);
            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                accountName,
                name: accountName,
                accountNo: !isNaN(acctNoParsed) ? acctNoParsed : (row.accountNo || existing.accountNo || 0),
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
            if (this._accountNoDuplicateError) {
                this.toastHandler('warning', this._accountNoDuplicateError);
                return false;
            }

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

            const accountNoStr = String(row.accountNo ?? '').trim();
            if (!accountNoStr) {
                this.toastHandler('warning', 'Account number is required.');
                return false;
            }

            // Check if account number falls within the selected account control's defined range
            const control = this.accountControlList.find(h => h.id === controlId);
            if (control && (control.minAccount || control.maxAccount)) {
                const min = parseInt(control.minAccount, 10);
                const max = parseInt(control.maxAccount, 10);
                const num = parseInt(accountNoStr, 10);
                if (!isNaN(num) && !isNaN(min) && !isNaN(max) && min > 0 && max > 0 && (num < min || num > max)) {
                    const controlName = control.accountControlName || control.accountHeaderName || control.name || 'selected control';
                    this.toastHandler('warning', `Account number must be between ${min} and ${max} for "${controlName}".`);
                    return false;
                }
            }

            return true;
        },

        /* ── Helpers ─────────────────────────────────────────────── */

        /* ── syncControlRange ─────────────────────────────────────────
           Single source of truth for updating _controlRange from a
           controlId string.  Called by the column onChange, the DOM
           change listener, and the MutationObserver (edit-mode init). */
        syncControlRange(controlId) {
            if (!controlId) {
                this._controlRange = { min: null, max: null, name: '' };
                return;
            }
            const control = this.accountControlList.find(h => String(h.id) === String(controlId));
            if (control && (control.minAccount || control.maxAccount)) {
                const opt = this.accountControlOptions.find(o => String(o.value) === String(controlId));
                const controlName = opt?.path || this.buildAccountControlHierarchy(control) || control.accountControlName || control.accountHeaderName || control.name || '';
                this._controlRange = {
                    min: control.minAccount != null ? String(control.minAccount) : null,
                    max: control.maxAccount != null ? String(control.maxAccount) : null,
                    name: controlName
                };
            } else {
                this._controlRange = { min: null, max: null, name: '' };
            }
        },

        /* ── Account No Availability Validation ───────────────────── */

        displayAccountNoValidation(message, type = 'error') {
            const numEl = document.getElementById('f-accountNo');
            if (!numEl) return;
            const container = numEl.closest('[data-field="accountNo"]') || numEl.parentElement;
            if (!container) return;

            let msgEl = document.getElementById('accountNo-custom-validation-msg');
            if (!msgEl) {
                msgEl = document.createElement('p');
                msgEl.id = 'accountNo-custom-validation-msg';
                const ref = numEl.closest('.relative') || numEl;
                if (ref.nextSibling) {
                    ref.parentNode.insertBefore(msgEl, ref.nextSibling);
                } else {
                    ref.parentNode.appendChild(msgEl);
                }
            }

            // Hide grid default error if visible to prevent duplicate lines
            const gridErr = container.querySelector('p[data-error]:not(#accountNo-custom-validation-msg)');
            if (gridErr) gridErr.style.display = 'none';

            msgEl.style.display = 'flex';
            if (type === 'error') {
                msgEl.className = 'mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1.5';
                msgEl.innerHTML = `<i class="bi bi-exclamation-circle-fill"></i> <span>${message}</span>`;
                numEl.classList.add('!border-rose-500', 'text-rose-900', 'focus:!border-rose-500', 'focus:!ring-rose-500');
                numEl.classList.remove('border-slate-300', 'border-emerald-500', 'focus:border-emerald-500', 'focus:ring-emerald-500');
                numEl.setAttribute('aria-invalid', 'true');
            } else if (type === 'checking') {
                msgEl.className = 'mt-1 text-[11px] font-medium text-slate-400 flex items-center gap-1.5';
                msgEl.innerHTML = `<i class="bi bi-arrow-repeat animate-spin"></i> <span>${message}</span>`;
                numEl.classList.remove('!border-rose-500', 'text-rose-900', 'focus:!border-rose-500', 'focus:!ring-rose-500', 'border-emerald-500');
                numEl.removeAttribute('aria-invalid');
            } else if (type === 'success') {
                msgEl.className = 'mt-1 text-[11px] font-medium text-emerald-600 flex items-center gap-1.5';
                msgEl.innerHTML = `<i class="bi bi-check-circle-fill text-emerald-500"></i> <span>${message}</span>`;
                numEl.classList.remove('!border-rose-500', 'text-rose-900', 'focus:!border-rose-500', 'focus:!ring-rose-500', 'border-slate-300');
                numEl.classList.add('border-emerald-500', 'focus:border-emerald-500', 'focus:ring-emerald-500');
                numEl.removeAttribute('aria-invalid');
            }
        },

        clearAccountNoValidation() {
            const numEl = document.getElementById('f-accountNo');
            if (numEl) {
                numEl.classList.remove(
                    '!border-rose-500',
                    'text-rose-900',
                    'focus:!border-rose-500',
                    'focus:!ring-rose-500',
                    'border-emerald-500',
                    'focus:border-emerald-500',
                    'focus:ring-emerald-500'
                );
                numEl.classList.add('border-slate-300');
                numEl.removeAttribute('aria-invalid');
            }
            const msgEl = document.getElementById('accountNo-custom-validation-msg');
            if (msgEl) {
                msgEl.style.display = 'none';
                msgEl.innerHTML = '';
            }
        },

        async checkAccountNoAvailability(accountNo) {
            const modalHeader = document.querySelector('#dt-modal-host form h3');
            const isCreateMode = modalHeader && !modalHeader.textContent.toLowerCase().includes('edit');
            if (!isCreateMode) {
                this._accountNoDuplicateError = null;
                this.clearAccountNoValidation();
                return false;
            }

            const cleanNo = String(accountNo ?? '').trim();
            if (!cleanNo) {
                this._accountNoDuplicateError = null;
                this._lastCheckedAccountNo = null;
                this.clearAccountNoValidation();
                return false;
            }

            // If account control range is defined and value is numeric, check range
            const r = this._controlRange;
            const parsed = parseInt(cleanNo, 10);
            const min = parseInt(r.min, 10);
            const max = parseInt(r.max, 10);
            if (!isNaN(parsed) && !isNaN(min) && !isNaN(max) && (parsed < min || parsed > max)) {
                this._accountNoDuplicateError = null;
                this._lastCheckedAccountNo = null;
                this.clearAccountNoValidation();
                return false;
            }

            this._accountNoChecking = true;
            this._lastCheckedAccountNo = cleanNo;
            this.displayAccountNoValidation('Checking account number...', 'checking');

            try {
                const response = await axios.get(`/GeneralLedger/CheckAccountNo?accountNo=${encodeURIComponent(cleanNo)}`);
                const res = response.data;
                const list = res?.result?.data || res?.result || res?.Result || (Array.isArray(res) ? res : []);
                const exists = Array.isArray(list) ? list.length > 0 : Boolean(list);

                if (exists) {
                    const first = Array.isArray(list) ? list[0] : list;
                    const existingName = first?.accountName || first?.name || '';
                    const errMsg = existingName
                        ? `Account number ${cleanNo} already exists (${existingName}).`
                        : `Account number ${cleanNo} already exists.`;

                    this._accountNoDuplicateError = errMsg;
                    this.displayAccountNoValidation(errMsg, 'error');
                    return true;
                } else {
                    this._accountNoDuplicateError = null;
                    this.displayAccountNoValidation('Account number is available', 'success');
                    return false;
                }
            } catch (error) {
                console.error('Failed to check account number:', error);
                this._accountNoDuplicateError = null;
                this.clearAccountNoValidation();
                return false;
            } finally {
                this._accountNoChecking = false;
            }
        },

        async checkAccountNoExists(accountNo) {
            const cleanNo = String(accountNo ?? '').trim();
            if (!cleanNo) return false;

            try {
                const response = await axios.get(`/GeneralLedger/CheckAccountNo?accountNo=${encodeURIComponent(cleanNo)}`);
                const res = response.data;
                const list = res?.result?.data || res?.result || res?.Result || (Array.isArray(res) ? res : []);
                return Array.isArray(list) ? list.length > 0 : Boolean(list);
            } catch (err) {
                console.error('CheckAccountNo endpoint error:', err);
                return false;
            }
        },

        bindFormChangeListeners() {
            // ── 1. User interaction: accountControlId select changes ──────────
            document.addEventListener('change', (e) => {
                const target = e.target;
                if (target && target.id === 'f-accountControlId') {
                    const controlId = target.value;
                    this.syncControlRange(controlId);

                    // Re-validate current accountNo if one was already typed
                    const numEl = document.getElementById('f-accountNo');
                    if (numEl && numEl.value) {
                        this.checkAccountNoAvailability(numEl.value);
                    }

                    // Keep Account Type dropdown in sync via DOM as well
                    const acctType = this.getAccountTypeForControl(controlId);
                    if (acctType) {
                        const typeSelect = document.getElementById('f-standardAccountType');
                        if (typeSelect && String(typeSelect.value) !== String(acctType)) {
                            typeSelect.value = acctType;
                            typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                }

                // Check on change / blur of accountNo
                if (target && target.id === 'f-accountNo') {
                    clearTimeout(this._accountNoDebounceTimer);
                    this.checkAccountNoAvailability(target.value);
                }
            });

            // ── 2. Live input on Account No field (debounced) ──────────────────
            document.addEventListener('input', (e) => {
                const target = e.target;
                if (target && target.id === 'f-accountNo') {
                    clearTimeout(this._accountNoDebounceTimer);
                    this._accountNoDebounceTimer = setTimeout(() => {
                        this.checkAccountNoAvailability(target.value);
                    }, 350);
                }
            });

            // ── 3. Intercept form submit in Create mode ────────────────────────
            document.addEventListener('submit', async (e) => {
                const form = e.target;
                if (!form || !form.closest('#dt-modal-host')) return;

                const modalHeader = form.querySelector('h3');
                const isCreateMode = modalHeader && !modalHeader.textContent.toLowerCase().includes('edit');
                if (!isCreateMode) return;

                if (this._bypassSubmitCheck) {
                    this._bypassSubmitCheck = false;
                    return;
                }

                const numEl = document.getElementById('f-accountNo');
                if (!numEl || !numEl.value) return;

                const val = numEl.value.trim();
                if (this._accountNoDuplicateError) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.displayAccountNoValidation(this._accountNoDuplicateError, 'error');
                    numEl.focus();
                    return;
                }

                if (this._lastCheckedAccountNo !== val || this._accountNoChecking) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const isDuplicate = await this.checkAccountNoAvailability(val);
                    if (isDuplicate) {
                        this.displayAccountNoValidation(this._accountNoDuplicateError, 'error');
                        numEl.focus();
                    } else {
                        this._bypassSubmitCheck = true;
                        form.requestSubmit();
                    }
                }
            }, true);

            // ── 4. MutationObserver: initialise range when form appears ───────
            //    • Edit mode  → pre-filled accountControlId found  → unlock accountNo
            //    • Create mode→ accountControlId is empty           → keep accountNo locked
            //    • Form closed→ element disappears                  → reset for next open
            let lastSeen = null;
            const observer = new MutationObserver(() => {
                const sel = document.getElementById('f-accountControlId');
                if (sel && sel !== lastSeen) {
                    lastSeen = sel;
                    const val = sel.value;
                    this.clearAccountNoValidation();
                    this._accountNoDuplicateError = null;
                    this._lastCheckedAccountNo = null;

                    if (val) {
                        // Edit mode: populate _controlRange so accountNo is enabled
                        this.syncControlRange(val);
                        this.$nextTick(() => {
                            const numEl = document.getElementById('f-accountNo');
                            if (numEl) {
                                numEl.removeAttribute('min');
                                numEl.removeAttribute('max');
                                if (this._controlRange.min != null) {
                                    numEl.placeholder = `${this._controlRange.min} – ${this._controlRange.max}`;
                                    numEl.disabled = false;
                                }
                            }
                        });
                    } else {
                        // Create mode: ensure accountNo starts disabled
                        this._controlRange = { min: null, max: null, name: '' };
                    }
                }
                if (!sel && lastSeen) {
                    // Form was closed: reset so next open starts fresh
                    lastSeen = null;
                    this._controlRange = { min: null, max: null, name: '' };
                    this.clearAccountNoValidation();
                    this._accountNoDuplicateError = null;
                    this._lastCheckedAccountNo = null;
                    clearTimeout(this._accountNoDebounceTimer);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
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
