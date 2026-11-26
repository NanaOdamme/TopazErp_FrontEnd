(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    /* ==============================================================
     * ENDPOINTS — SchGlAccounts controller
     * ============================================================== */
    const ENDPOINTS = {
        // G/L account list (source for every w-select below)
        glAccounts: '/Ap/InitJournalEntry',

        // fee items (bill accounts reference)
        feeDescriptions: '/SchoolManager/GetFeesDescriptions/',
        supplementaryItems: '/SchoolManager/GetSupplementaryItems/',
        boardingItems: '/SchoolManager/GetBoardingItems/',

        billAccounts: {
            list: '/SchoolManager/GetSchBillAccounts/',
            create: '/SchoolManager/CreateSchBillAccount/',
            update: '/SchoolManager/UpdateSchBillAccount/',
            remove: '/SchoolManager/DeleteSchBillAccount'
        },
        paymentAccounts: {
            list: '/SchoolManager/GetSchPaymentAccounts/',
            create: '/SchoolManager/CreateSchPaymentAccount/',
            update: '/SchoolManager/UpdateSchPaymentAccount/',
            remove: '/SchoolManager/DeleteSchPaymentAccount'
        },
        memoAccounts: {
            list: '/SchoolManager/GetSchCreditMemoAccounts/',
            create: '/SchoolManager/CreateSchCreditMemoAccount/',
            update: '/SchoolManager/UpdateSchCreditMemoAccount/',
            remove: '/SchoolManager/DeleteSchCreditMemoAccount'
        }
    };

    /** Bill types — BillTypeId on SchBillAccount. */
    const BILL_TYPES = [
        { id: 1, name: 'Standard' },
        { id: 2, name: 'Supplementary' },
        { id: 3, name: 'Boarding' }
    ];

    /* ---------------- helpers ---------------- */
    const val = (o, k) => {
        if (!o) return undefined;
        if (o[k] !== undefined) return o[k];
        const pascal = k.charAt(0).toUpperCase() + k.slice(1);
        if (o[pascal] !== undefined) return o[pascal];
        const lower = k.toLowerCase();
        for (const prop of Object.keys(o)) {
            if (prop.toLowerCase() === lower) return o[prop];
        }
        return undefined;
    };

    const isGuid = v =>
        typeof v === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim()) &&
        v.trim() !== EMPTY_GUID;

    const asGuid = v => {
        if (v && typeof v === 'object' && v.id) return asGuid(v.id);
        return isGuid(v) ? String(v).trim() : EMPTY_GUID;
    };

    const sameId = (a, b) =>
        String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

    const asText = v => (v === null || v === undefined ? '' : String(v));

    const unwrapList = (raw, preferredKey) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw.result !== undefined) return unwrapList(raw.result, preferredKey);
        if (preferredKey && Array.isArray(raw[preferredKey])) return raw[preferredKey];
        if (Array.isArray(raw.items)) return raw.items;
        if (Array.isArray(raw.data)) return raw.data;
        if (Array.isArray(raw.accounts)) return raw.accounts;
        if (typeof raw === 'object') {
            const firstArr = Object.values(raw).find(v => Array.isArray(v));
            if (firstArr) return firstArr;
        }
        return [];
    };

    const normalizeFeeItems = list => (list || [])
        .map(i => ({
            id: val(i, 'id'),
            name: val(i, 'name') || val(i, 'description') || val(i, 'itemName') || '',
            isFixed: val(i, 'isFixed') === true
        }))
        .filter(i => i.id != null && i.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    /* ==============================================================
     * Form factory — one modal, three shapes (per active tab).
     * ============================================================== */
    const emptyAccountForm = () => ({
        id: null,
        tenantId: 0,

        // ---- SchBillAccount ----
        billTypeId: 1,
        feeItemId: '',
        bankGlId: '',

        // ---- shared by bill + credit memo ----
        debitGlId: '',
        creditGlId: '',

        // ---- SchPaymentAccount ----
        localDebitGlId: '',
        foreignDebitGlId: '',
        localCreditGlId: '',
        localOverPaymentGlId: '',
        foreignOverPaymentGlId: '',
        otherPaymentDebitGlId: '',
        otherPaymentCreditGlId: ''
    });

    const app = Vue.createApp({
        data() {
            return {
                theme: '#062a81',
                isShimmerLoading: false,
                saving: false,
                setupDone: false,

                activeTab: 'bills', // 'bills' | 'payments' | 'memos'
                billTypes: BILL_TYPES,

                // lookups
                glAccounts: [],
                feeDescriptions: [],
                supplementaryItems: [],
                boardingItems: [],

                // collections
                billAccounts: [],
                paymentAccounts: [],
                memoAccounts: [],

                // modal
                accountModalOpen: false,
                editMode: false,
                form: emptyAccountForm()
            };
        },

        computed: {
            /** Ref of the grid belonging to the active tab. */
            currentGridRef() {
                if (this.activeTab === 'payments') return 'paymentAccountsGrid';
                if (this.activeTab === 'memos') return 'memoAccountsGrid';
                return 'billAccountsGrid';
            },

            /** Rows of the active tab. */
            currentRows() {
                if (this.activeTab === 'payments') return this.paymentAccounts;
                if (this.activeTab === 'memos') return this.memoAccounts;
                return this.billAccounts;
            },

            /** Every fee item, tagged with the bill type it belongs to. */
            allFeeItems() {
                return [
                    ...this.feeDescriptions.map(i => ({ ...i, billTypeId: 1 })),
                    ...this.supplementaryItems.map(i => ({ ...i, billTypeId: 2 })),
                    ...this.boardingItems.map(i => ({ ...i, billTypeId: 3 }))
                ].sort((a, b) => a.name.localeCompare(b.name));
            },

            /**
             * Keys ("billTypeId|feeItemId") of fee items that ALREADY have a G/L
             * account configured. The row being edited is excluded so its own fee
             * item is not flagged as configured against itself.
             */
            configuredBillAccountKeys() {
                const keys = new Set();
                const excludeId = this.editMode ? this.form.id : null;

                (this.billAccounts || []).forEach(a => {
                    if (excludeId && sameId(a.id, excludeId)) return;
                    if (!a.feeItemId || a.feeItemId === EMPTY_GUID) return;
                    keys.add(`${Number(a.billTypeId) || 1}|${String(a.feeItemId).toLowerCase()}`);
                });

                return keys;
            },

           

            /**
             * Fee items allowed for the bill type currently selected in the modal,
             * with " (Configured)" appended to the name when a G/L mapping exists.
             */
            feeItemOptions() {
                const typeId = Number(this.form.billTypeId) || 1;

                return this.allFeeItems
                    .filter(i => Number(i.billTypeId) === typeId)
                    .map(i => {
                        const configured = this.isFeeItemConfigured(typeId, i.id);
                        return {
                            ...i,
                            isConfigured: configured,
                            name: configured ? `${i.name} (Configured)` : i.name
                        };
                    });
            },

            /* ================= GRID COLUMNS ================= */
            billAccountColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false },
                    {
                        key: 'billTypeId',
                        label: 'Bill Type',
                        type: 'select',
                        width: 150,
                        options: this.billTypes,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'feeItemId',
                        label: 'Fee Item',
                        type: 'select',
                        width: 260,
                        searchable: true,
                        options: this.allFeeItems,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'bankGlId',
                        label: 'Bank G/L',
                        type: 'select',
                        width: 230,
                        searchable: true,
                        options: this.glAccounts,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                  
                    {
                        key: 'creditGlId',
                        label: 'Revenue G/L',
                        type: 'select',
                        width: 230,
                        searchable: true,
                        options: this.glAccounts,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'debitGlId',
                        label: 'Accounts Receivable (AR) G/L',
                        type: 'select',
                        width: 230,
                        searchable: true,
                        options: this.glAccounts,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                ];
            },

            paymentAccountColumns() {
                const gl = { type: 'select', width: 230, searchable: true, options: this.glAccounts, value: 'id', display: 'name', editable: false };
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false },
                    { key: 'localDebitGlId', label: 'Local Bank G/L', ...gl },
                    { key: 'foreignDebitGlId', label: 'Foreign Bank G/L', ...gl },
                    { key: 'localCreditGlId', label: 'Local AR G/L', ...gl },
                    { key: 'localOverPaymentGlId', label: 'Local Overpayment G/L', hidden:true, ...gl },
                    { key: 'foreignOverPaymentGlId', label: 'Foreign Overpayment G/L',hidden:true,  ...gl },
                    { key: 'otherPaymentDebitGlId', label: 'Other Payment Debit G/L',hidden:true,  ...gl },
                    { key: 'otherPaymentCreditGlId', label: 'Foreign AR Credit G/L', ...gl }
                ];
            },

            memoAccountColumns() {
                const gl = { type: 'select', width: 260, searchable: true, options: this.glAccounts, value: 'id', display: 'name', editable: false };
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false },
                    { key: 'debitGlId', label: 'Bank G/L', ...gl },
                    { key: 'creditGlId', label: 'Accounts Receivable (AR) G/L', ...gl }
                ];
            },

            /** Options for the Bill Type select inside the modal (kept in one place). */
            billTypeOptions() {
                return this.billTypes;
            }
        },

        methods: {
            val,
            isGuid,
            asGuid,
            sameId,
            /** True when this bill type + fee item pair already has a mapping. */
            isFeeItemConfigured(billTypeId, feeItemId) {
                if (!feeItemId || feeItemId === EMPTY_GUID) return false;
                return this.configuredBillAccountKeys.has(
                    `${Number(billTypeId) || 1}|${String(feeItemId).toLowerCase()}`
                );
            },
            emptyForm() {
                return emptyAccountForm();
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

            /* ================= name resolution ================= */
            getGlAccount(glId) {
                if (!glId || glId === EMPTY_GUID) return null;
                return this.glAccounts.find(a => sameId(a.id, glId)) || null;
            },

            getGlAccountName(glId) {
                const a = this.getGlAccount(glId);
                return a ? a.name : '';
            },

            getBillTypeName(typeId) {
                const t = BILL_TYPES.find(x => Number(x.id) === Number(typeId));
                return t ? t.name : '';
            },

            /** Plain fee item name (no status suffix). */
            getFeeItemName(feeItemId) {
                const item = this.allFeeItems.find(i => sameId(i.id, feeItemId));
                return item ? item.name : '';
            },

            /** Fee item name with " (Configured)" when a G/L mapping exists. */
            getFeeItemLabel(feeItemId, billTypeId = null) {
                const name = this.getFeeItemName(feeItemId);
                if (!name) return '';
                const typeId = billTypeId != null ? billTypeId : this.form.billTypeId;
                return this.isFeeItemConfigured(typeId, feeItemId) ? `${name} (Configured)` : name;
            },

            /* ================= API ================= */
            async fetchList(url, label, preferredKey = null, soft = false) {
                try {
                    const response = await axios.get(url);
                    return unwrapList(response.data, preferredKey);
                } catch (error) {
                    if (!soft) {
                        console.error(`Failed to load ${label}:`, error);
                        this.toastHandler('error', `Failed to load ${label}.`);
                    } else {
                        console.warn(`Optional lookup "${label}" is not available (${url}).`);
                    }
                    return [];
                }
            },

            async loadLookups() {
                const soft = (url, label, key = null) => this.fetchList(url, label, key, true);

                const [glAccounts, feeDescriptions, supplementaryItems, boardingItems] = await Promise.all([
                    soft(ENDPOINTS.glAccounts, 'G/L accounts', 'accounts'),
                    soft(ENDPOINTS.feeDescriptions, 'fee descriptions'),
                    soft(ENDPOINTS.supplementaryItems, 'supplementary items'),
                    soft(ENDPOINTS.boardingItems, 'boarding items')
                ]);

                this.glAccounts = glAccounts.map(a => ({
                    ...a,
                    id: val(a, 'id'),
                    accountNo: asText(val(a, 'accountNo')),
                    accountName: val(a, 'accountName') || val(a, 'name') || '',
                    name: `${asText(val(a, 'accountNo'))} - ${val(a, 'accountName') || val(a, 'name') || ''}`.replace(/^ - /, '')
                })).filter(a => a.id != null);

                this.feeDescriptions = normalizeFeeItems(feeDescriptions);
                this.supplementaryItems = normalizeFeeItems(supplementaryItems);
                this.boardingItems = normalizeFeeItems(boardingItems);
            },

            /* ================= normalize ================= */
            normalizeBillAccount(r) {
                return {
                    id: val(r, 'id'),
                    tenantId: Number(val(r, 'tenantId')) || 0,
                    billTypeId: Number(val(r, 'billTypeId')) || 1,
                    feeItemId: asGuid(val(r, 'feeItemId')),
                    bankGlId: asGuid(val(r, 'bankGlId')),
                    debitGlId: asGuid(val(r, 'debitGlId')),
                    creditGlId: asGuid(val(r, 'creditGlId'))
                };
            },

            normalizePaymentAccount(r) {
                return {
                    id: val(r, 'id'),
                    tenantId: Number(val(r, 'tenantId')) || 0,
                    localDebitGlId: asGuid(val(r, 'localDebitGlId')),
                    foreignDebitGlId: asGuid(val(r, 'foreignDebitGlId')),
                    localCreditGlId: asGuid(val(r, 'localCreditGlId')),
                    localOverPaymentGlId: asGuid(val(r, 'localOverPaymentGlId')),
                    foreignOverPaymentGlId: asGuid(val(r, 'foreignOverPaymentGlId')),
                    otherPaymentDebitGlId: asGuid(val(r, 'otherPaymentDebitGlId')),
                    otherPaymentCreditGlId: asGuid(val(r, 'otherPaymentCreditGlId'))
                };
            },

            normalizeMemoAccount(r) {
                return {
                    id: val(r, 'id'),
                    tenantId: Number(val(r, 'tenantId')) || 0,
                    debitGlId: asGuid(val(r, 'debitGlId')),
                    creditGlId: asGuid(val(r, 'creditGlId'))
                };
            },

            /* ================= loads ================= */
            async loadBillAccounts() {
                const raw = await this.fetchList(ENDPOINTS.billAccounts.list, 'bill accounts', 'schBillAccounts');
                this.billAccounts = raw.map(r => this.normalizeBillAccount(r));
            },

            async loadPaymentAccounts() {
                const raw = await this.fetchList(ENDPOINTS.paymentAccounts.list, 'payment accounts', 'schPaymentAccounts');
                this.paymentAccounts = raw.map(r => this.normalizePaymentAccount(r));
            },

            async loadMemoAccounts() {
                const raw = await this.fetchList(ENDPOINTS.memoAccounts.list, 'credit memo accounts', 'schCreditMemoAccounts');
                this.memoAccounts = raw.map(r => this.normalizeMemoAccount(r));
            },

            async loadAll() {
                this.isShimmerLoading = true;
                try {
                    await Promise.all([
                        this.loadBillAccounts(),
                        this.loadPaymentAccounts(),
                        this.loadMemoAccounts()
                    ]);
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ================= grid selection ================= */
            getSelectedRows() {
                const grid = (this.$refs && this.$refs[this.currentGridRef]) ? this.$refs[this.currentGridRef] : null;
                if (!grid) return [];
                if (typeof grid.selectedRows === 'function') {
                    try {
                        const rows = grid.selectedRows();
                        if (Array.isArray(rows)) return rows;
                    } catch (e) { console.warn('selectedRows() failed:', e); }
                }
                if (Array.isArray(grid.selectedRows)) return grid.selectedRows;
                return [];
            },

            clearSelection() {
                const grid = (this.$refs && this.$refs[this.currentGridRef]) ? this.$refs[this.currentGridRef] : null;
                if (grid && typeof grid.clearSelection === 'function') { try { grid.clearSelection(); } catch (e) {} }
                if (grid && typeof grid.deselectAll === 'function') { try { grid.deselectAll(); } catch (e) {} }
            },

            /* ================= modal ================= */
            openAccountModal(row = null) {
                this.editMode = Boolean(row && row.id);

                if (this.editMode) {
                    this.form = {
                        ...emptyAccountForm(),
                        id: row.id,
                        tenantId: Number(row.tenantId) || 0,
                        billTypeId: Number(row.billTypeId) || 1,
                        feeItemId: row.feeItemId || '',
                        bankGlId: row.bankGlId && row.bankGlId !== EMPTY_GUID ? row.bankGlId : '',
                        debitGlId: row.debitGlId && row.debitGlId !== EMPTY_GUID ? row.debitGlId : '',
                        creditGlId: row.creditGlId && row.creditGlId !== EMPTY_GUID ? row.creditGlId : '',
                        localDebitGlId: row.localDebitGlId && row.localDebitGlId !== EMPTY_GUID ? row.localDebitGlId : '',
                        foreignDebitGlId: row.foreignDebitGlId && row.foreignDebitGlId !== EMPTY_GUID ? row.foreignDebitGlId : '',
                        localCreditGlId: row.localCreditGlId && row.localCreditGlId !== EMPTY_GUID ? row.localCreditGlId : '',
                        localOverPaymentGlId: row.localOverPaymentGlId && row.localOverPaymentGlId !== EMPTY_GUID ? row.localOverPaymentGlId : '',
                        foreignOverPaymentGlId: row.foreignOverPaymentGlId && row.foreignOverPaymentGlId !== EMPTY_GUID ? row.foreignOverPaymentGlId : '',
                        otherPaymentDebitGlId: row.otherPaymentDebitGlId && row.otherPaymentDebitGlId !== EMPTY_GUID ? row.otherPaymentDebitGlId : '',
                        otherPaymentCreditGlId: row.otherPaymentCreditGlId && row.otherPaymentCreditGlId !== EMPTY_GUID ? row.otherPaymentCreditGlId : ''
                    };
                } else {
                    this.form = emptyAccountForm();
                }

                this.accountModalOpen = true;
            },

            closeAccountModal() {
                this.accountModalOpen = false;
                this.editMode = false;
                this.form = emptyAccountForm();
            },

            editSelectedAccount() {
                const selected = this.getSelectedRows();
                if (!selected.length) return this.toastHandler('warning', 'Please select a row to edit.');
                if (selected.length > 1) return this.toastHandler('warning', 'Please select only one row to edit at a time.');
                this.openAccountModal(selected[0]);
            },

            deleteSelectedAccounts() {
                const rows = this.getSelectedRows();
                if (!rows.length) return this.toastHandler('warning', 'Select one or more rows to delete.');

                const label = this.activeTab === 'bills'
                    ? 'bill account'
                    : (this.activeTab === 'payments' ? 'payment account' : 'credit memo account');

                if (typeof Swal === 'undefined') return;

                Swal.fire({
                    icon: 'warning',
                    title: 'Confirm Delete',
                    text: `Delete ${rows.length} ${label}${rows.length === 1 ? '' : 's'}? This cannot be undone.`,
                    showCancelButton: true,
                    confirmButtonText: 'Yes, delete',
                    cancelButtonText: 'No, go back',
                    confirmButtonColor: '#dc2626',
                    cancelButtonColor: '#64748b',
                    reverseButtons: true
                }).then(async result => {
                    if (!result.isConfirmed) return;
                    await this.deleteAccounts(rows);
                });
            },

            async deleteAccounts(rows) {
                const cfg = this.activeTab === 'payments'
                    ? ENDPOINTS.paymentAccounts
                    : (this.activeTab === 'memos' ? ENDPOINTS.memoAccounts : ENDPOINTS.billAccounts);

                this.isShimmerLoading = true;
                try {
                    for (const row of rows) {
                        const id = typeof row.id === 'object' ? row.id?.id : row.id;
                        if (!id) continue;

                        const res = await axios.get(`${cfg.remove}?id=${encodeURIComponent(id)}`);
                        if (res.data && res.data.success === false) {
                            this.toastHandler('error', res.data.message || 'Failed to delete record.');
                            return;
                        }
                    }

                    this.clearSelection();
                    this.toastHandler('success', 'Deleted successfully.');
                    await this.loadAll();
                } catch (error) {
                    console.error('Delete failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to delete record.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ================= payload / save ================= */
            onBillTypeChanged() {
                // fee items belong to a bill type — clear an incompatible selection
                if (!this.feeItemOptions.some(i => sameId(i.id, this.form.feeItemId))) {
                    this.form.feeItemId = '';
                }
            },

            validate() {
                const f = this.form;

                if (this.activeTab === 'bills') {
                    if (!f.billTypeId) return 'Please select a bill type.';
                    if (!f.feeItemId) return 'Please select a fee item.';
                    if (!f.bankGlId) return 'Please select the bank G/L account.';
                    if (!f.debitGlId) return 'Please select the debit G/L account.';
                    if (!f.creditGlId) return 'Please select the credit G/L account.';
                } else if (this.activeTab === 'payments') {
                    if (!f.localDebitGlId) return 'Please select the local debit G/L account.';
                    if (!f.localCreditGlId) return 'Please select the local credit G/L account.';
                } else {
                    if (!f.debitGlId) return 'Please select the debit G/L account.';
                    if (!f.creditGlId) return 'Please select the credit G/L account.';
                }

                return '';
            },

            buildPayload() {
                const f = this.form;
                let payload = {};

                if (this.activeTab === 'bills') {
                    payload = {
                        billTypeId: Number(f.billTypeId) || 1,
                        feeItemId: asGuid(f.feeItemId),
                        bankGlId: asGuid(f.bankGlId),
                        debitGlId: asGuid(f.debitGlId),
                        creditGlId: asGuid(f.creditGlId)
                    };
                } else if (this.activeTab === 'payments') {
                    payload = {
                        localDebitGlId: asGuid(f.localDebitGlId),
                        foreignDebitGlId: asGuid(f.foreignDebitGlId),
                        localCreditGlId: asGuid(f.localCreditGlId),
                        localOverPaymentGlId: asGuid(f.localOverPaymentGlId),
                        foreignOverPaymentGlId: asGuid(f.foreignOverPaymentGlId),
                        otherPaymentDebitGlId: asGuid(f.otherPaymentDebitGlId),
                        otherPaymentCreditGlId: asGuid(f.otherPaymentCreditGlId)
                    };
                } else {
                    payload = {
                        debitGlId: asGuid(f.debitGlId),
                        creditGlId: asGuid(f.creditGlId)
                    };
                }

                // tenantId is sent on UPDATE only
                if (f.id) {
                    payload.id = f.id;
                    payload.tenantId = Number(f.tenantId) || 0;
                }
                return payload;
            },
            isDuplicate(row) {
                if (this.activeTab !== 'bills') return false;
                const typeId = Number(row.billTypeId) || 1;
                const feeItemId = asGuid(row.feeItemId);

                return this.billAccounts.some(a =>
                    !sameId(a.id, row.id) &&
                    Number(a.billTypeId) === typeId &&
                    sameId(a.feeItemId, feeItemId)
                );
            },
            async saveAccount() {
                if (this.saving) return;

                const error = this.validate();
                if (error) return this.toastHandler('warning', error);

                if (this.isDuplicate(this.form)) {
                    return this.toastHandler('warning',
                        `A ${this.getBillTypeName(this.form.billTypeId)} account already exists for "${this.getFeeItemName(this.form.feeItemId)}".`);
                }

                this.saving = true;
                const cfg = this.activeTab === 'payments'
                    ? ENDPOINTS.paymentAccounts
                    : (this.activeTab === 'memos' ? ENDPOINTS.memoAccounts : ENDPOINTS.billAccounts);
                const endpoint = this.editMode ? cfg.update : cfg.create;
                const payload = this.buildPayload();

                try {
                    const res = await axios.post(endpoint, payload);
                    const result = res.data?.result || res.data;

                    if (res.data?.success === false || (result?.code && Number(result.code) !== 200)) {
                        this.toastHandler('error', result?.message || res.data?.error?.message || 'Failed to save the account mapping.');
                        return;
                    }

                    this.toastHandler('success', this.editMode ? 'Account mapping updated successfully.' : 'Account mapping created successfully.');
                    this.closeAccountModal();
                    await this.loadAll();
                } catch (err) {
                    console.error('Save account mapping failed:', err);
                    this.toastHandler('error', err.response?.data?.message || 'Failed to save the account mapping.');
                } finally {
                    this.saving = false;
                }
            }
        },
        async mounted() {
            this.isShimmerLoading = true;
            try {
                await this.loadLookups();
                await this.loadAll();
            } finally {
                this.setupDone = true;
                this.isShimmerLoading = false;
            }
        }
    });
    if (typeof DataGridPlugin !== 'undefined') app.use(DataGridPlugin);
    if (typeof WSelectPlugin !== 'undefined') app.use(WSelectPlugin);

    app.mount('#app');
})();
