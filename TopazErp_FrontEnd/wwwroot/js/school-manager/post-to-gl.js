(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    /* ==============================================================
     * ENDPOINTS — posting to G/L
     * ============================================================== */
    const ENDPOINTS = {
        // posting actions (raw List<Guid> bodies)
        postBills: '/SchoolManager/PostBills/',
        postPayments: '/SchoolManager/PostSchPayments/',
        postMemos: '/SchoolManager/PostSchCreditMemos/',

        // sources
        bills: '/SchoolManager/GetBills/',
        payments: '/SchoolManager/GetSchPayments/',
        memos: '/SchoolManager/GetSchCreditMemos/',
        billAccounts: '/SchoolManager/GetSchBillAccounts/',
        paymentAccounts: '/SchoolManager/GetSchPaymentAccounts/',
        memoAccounts: '/SchoolManager/GetSchCreditMemoAccounts/',

        // lookups
        academicYears: '/SchoolManager/GetAcademicYears/',
        classes: '/SchoolManager/GetLevelClasses/',
        students: '/SchoolManager/GetStudentBios/',
        terms: '/jsonDataSample/terms.json',
        schoolProfile: '/SchoolManager/GetSchoolProfile/',
        currencies: '/SharedResource/GetCurrencies',
        feeDescriptions: '/SchoolManager/GetFeesDescriptions/',
        supplementaryItems: '/SchoolManager/GetSupplementaryItems/',
        boardingItems: '/SchoolManager/GetBoardingItems/'
    };

    const BILL_TYPES = [
        { id: 1, name: 'Standard' },
        { id: 2, name: 'Supplementary' },
        { id: 3, name: 'Boarding' }
    ];

    const PAYMENT_METHODS = [
        { id: 1, name: 'Cash' },
        { id: 2, name: 'Cheque' },
        { id: 3, name: 'Bank Transfer' },
        { id: 4, name: 'Mobile Money' }
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

    const parseBool = v => {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'string') {
            const s = v.trim().toLowerCase();
            return s === 'true' || s === '1' || s === 'yes';
        }
        if (typeof v === 'number') return v === 1;
        return false;
    };

    const sameId = (a, b) =>
        String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

    const asNumber = (v, fallback = 0) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
    };

    const asText = v => (v === null || v === undefined ? '' : String(v));

    const isoDate = date => {
        if (date === null || date === undefined || date === '') return '';
        if (typeof date === 'string') {
            const raw = date.trim();
            if (!raw) return '';
            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
            const ms = /\/Date\((-?\d+)/.exec(raw);
            if (ms) {
                const d = new Date(Number(ms[1]));
                return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
            }
        }
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10);
    };

    const unwrapList = (raw, preferredKey) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw.result !== undefined) return unwrapList(raw.result, preferredKey);
        if (preferredKey && Array.isArray(raw[preferredKey])) return raw[preferredKey];
        if (Array.isArray(raw.items)) return raw.items;
        if (Array.isArray(raw.data)) return raw.data;
        if (typeof raw === 'object') {
            const firstArr = Object.values(raw).find(v => Array.isArray(v));
            if (firstArr) return firstArr;
        }
        return [];
    };

    const buildStudentFullName = (lastName, firstName, otherName) =>
        [lastName, firstName, otherName].map(p => String(p || '').trim()).filter(Boolean).join(' ');

    const normalizeLookups = list => (list || [])
        .map(o => ({
            id: val(o, 'id'),
            name: val(o, 'name') || val(o, 'displayName') || val(o, 'className') || '',
            className: val(o, 'className') || val(o, 'name') || ''
        }))
        .filter(o => o.id != null && (o.name !== '' || o.className !== ''))
        .sort((a, b) => (a.name || a.className).localeCompare(b.name || b.className));

    const normalizeClasses = list => (list || [])
        .map(c => ({
            id: val(c, 'id'),
            name: val(c, 'className') || val(c, 'name') || '',
            className: val(c, 'className') || val(c, 'name') || ''
        }))
        .filter(c => c.id != null && c.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeStudents = list => (list || [])
        .map(s => {
            const id = val(s, 'id') || val(s, 'studentId') || val(s, 'studentID');
            const firstName = String(val(s, 'firstName') || '').trim();
            const lastName = String(val(s, 'lastName') || '').trim();
            const otherName = String(val(s, 'otherName') || '').trim();
            const fullName = buildStudentFullName(lastName, firstName, otherName);
            return { id, fullName, name: fullName, identifier: String(val(s, 'studentIdentifier') || '').trim() };
        })
        .filter(s => s.id != null && s.fullName !== '')
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const normalizeFeeItems = list => (list || [])
        .map(i => ({
            id: val(i, 'id'),
            name: val(i, 'name') || val(i, 'description') || val(i, 'itemName') || ''
        }))
        .filter(i => i.id != null && i.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const app = Vue.createApp({
        data() {
            return {
                theme: '#062a81',
                isShimmerLoading: false,
                busy: false,
                setupDone: false,

                activeTab: 'bills', // 'bills' | 'payments' | 'memos'
                billTypes: BILL_TYPES,
                paymentMethods: PAYMENT_METHODS,

                // lookups
                academicYears: [],
                terms: [],
                classes: [],
                allStudents: [],
                currencies: [],
                feeDescriptions: [],
                supplementaryItems: [],
                boardingItems: [],

                // school profile / local currency
                localCurrencyId: '',
                localCurrencyCode: '',
                profileLoaded: false,

                // G/L configuration
                billAccounts: [],
                paymentAccounts: [],
                memoAccounts: [],

                // collections (unposted only)
                bills: [],
                payments: [],
                memos: [],
                currencyList:[]
            };
        },

        computed: {
            /** Every fee item tagged with its bill type. */
            allFeeItems() {
                return [
                    ...this.feeDescriptions.map(i => ({ ...i, billTypeId: 1 })),
                    ...this.supplementaryItems.map(i => ({ ...i, billTypeId: 2 })),
                    ...this.boardingItems.map(i => ({ ...i, billTypeId: 3 }))
                ];
            },

            /** "billTypeId|feeItemId" keys of configured bill G/L accounts. */
            billAccountKeys() {
                const keys = new Set();
                (this.billAccounts || []).forEach(a => {
                    if (!a.feeItemId || a.feeItemId === EMPTY_GUID) return;
                    keys.add(`${Number(a.billTypeId) || 1}|${String(a.feeItemId).toLowerCase()}`);
                });
                return keys;
            },

            /* ================= posting readiness ================= */
            /**
             * The local currency comes from the school profile. Posting is only
             * possible once it is a real Guid (not null / empty guid).
             */
            currencyConfigured() {
                return isGuid(this.localCurrencyId);
            },

            currencyWarning() {
                if (!this.profileLoaded) return '';
                if (this.currencyConfigured) return '';
                return "The school's local currency is not set (empty or null). Set the local currency in the School Profile before posting to G/L.";
            },

            /** Bills that reference a fee item with no G/L account configured. */
            billsMissingGl() {
                return (this.bills || [])
                    .map(b => ({ bill: b, missing: this.missingGlItems(b) }))
                    .filter(x => x.missing.length > 0);
            },

            /** Unique missing fee items across every unposted bill. */
            missingGlSummary() {
                const map = new Map();

                this.billsMissingGl.forEach(({ bill, missing }) => {
                    missing.forEach(m => {
                        const key = `${m.billTypeId}|${String(m.feeItemId).toLowerCase()}`;
                        if (!map.has(key)) {
                            map.set(key, {
                                key,
                                feeItemId: m.feeItemId,
                                name: m.name,
                                billTypeId: m.billTypeId,
                                billTypeName: this.getBillTypeName(m.billTypeId),
                                billCount: 0
                            });
                        }
                        map.get(key).billCount += 1;
                    });
                });

                return [...map.values()].sort((a, b) =>
                    a.billTypeName.localeCompare(b.billTypeName) || a.name.localeCompare(b.name));
            },

            canPostBills() {
                return this.currencyConfigured && this.billsMissingGl.length === 0;
            },

            /* ================= grids ================= */
            billColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'billNumber', label: 'Bill Number', type: 'text', width: 150, searchable: true, editable: false },
                    {
                        key: 'billTypeId',
                        label: 'Bill Type',
                        type: 'select',
                        width: 140,
                        options: this.billTypes,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'classId',
                        label: 'Class',
                        type: 'select',
                        width: 170,
                        options: this.classes,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'academicYearId',
                        label: 'Academic Year',
                        type: 'select',
                        width: 150,
                        options: this.academicYears,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'termId',
                        label: 'Term',
                        type: 'select',
                        width: 120,
                        options: this.terms,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    { key: 'billDate', label: 'Bill Date', type: 'date', width: 130, editable: false },
                    { key: 'totalAmount', label: 'Total Amount', type: 'number', decimals: 2, width: 140, editable: false },
                    { key: 'glStatus', label: 'G/L Status', type: 'text', width: 150, editable: false },
                    { key: 'isProcessed', label: 'Processed?', type: 'boolean', width: 110, editable: false }
                ];
            },

            paymentColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'receiptNumber', label: 'Receipt No.', type: 'text', width: 160, searchable: true, editable: false },
                    { key: 'paymentDate', label: 'Date', type: 'date', width: 130, searchable: true, editable: false },
                    { key: 'studentName', label: 'Student', type: 'text', width: 230, searchable: true, editable: false },
                    {
                        key: 'classId',
                        label: 'Class',
                        type: 'select',
                        width: 160,
                        options: this.classes,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'academicYearId',
                        label: 'Academic Year',
                        type: 'select',
                        width: 150,
                        options: this.academicYears,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'termId',
                        label: 'Term',
                        type: 'select',
                        width: 120,
                        options: this.terms,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    { key: 'amountToPaid', label: 'Amount Paid', type: 'number', decimals: 2, width: 130, editable: false },
                    { key: 'balance', label: 'Balance', type: 'number', decimals: 2, width: 130, editable: false },
                    {
                        key: 'paymentMethod',
                        label: 'Method',
                        type: 'select',
                        width: 130,
                        options: this.paymentMethods,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    { key: 'isProcessed', label: 'Processed?', type: 'boolean', width: 110, editable: false }
                ];
            },

            memoColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'receiptNumber', label: 'Memo No.', type: 'text', width: 160, searchable: true, editable: false },
                    { key: 'date', label: 'Date', type: 'date', width: 130, searchable: true, editable: false },
                    { key: 'studentName', label: 'Student', type: 'text', width: 230, searchable: true, editable: false },
                    {
                        key: 'classId',
                        label: 'Class',
                        type: 'select',
                        width: 160,
                        options: this.classes,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'academicYearId',
                        label: 'Academic Year',
                        type: 'select',
                        width: 150,
                        options: this.academicYears,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'termId',
                        label: 'Term',
                        type: 'select',
                        width: 120,
                        options: this.terms,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    { key: 'amountToCredit', label: 'Amount Credited', type: 'number', decimals: 2, width: 150, editable: false },
                    {
                        key: 'paymentMethod',
                        label: 'Method',
                        type: 'select',
                        width: 130,
                        options: this.paymentMethods,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    { key: 'isProcessed', label: 'Processed?', type: 'boolean', width: 110, editable: false }
                ];
            }
        },

        methods: {
            val,
            isGuid,
            asGuid,
            parseBool,
            sameId,

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

            formatMoney(v) {
                const n = asNumber(v);
                const currency = this.localCurrencyCode || '';
                return `${currency ? currency + ' ' : ''}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            },

            /* ================= name helpers ================= */
            getClassName(classId) {
                if (!classId || classId === EMPTY_GUID) return '';
                const c = this.classes.find(x => sameId(x.id, classId));
                return c ? c.name : '';
            },

            getYearName(yearId) {
                const y = this.academicYears.find(x => sameId(x.id, yearId));
                return y ? y.name : '';
            },

            getTermName(termId) {
                const t = this.terms.find(x => sameId(x.id, termId));
                return t ? t.name : '';
            },

            getBillTypeName(typeId) {
                const t = BILL_TYPES.find(x => Number(x.id) === Number(typeId));
                return t ? t.name : '';
            },

            getStudentName(studentId) {
                if (!studentId) return '';
                const s = this.allStudents.find(x => sameId(x.id, studentId));
                return s ? s.fullName : '';
            },

            getFeeItemName(feeItemId) {
                const item = this.allFeeItems.find(i => sameId(i.id, feeItemId));
                return item ? item.name : `Unknown item (${String(feeItemId).substring(0, 8)}…)`;
            },

            /* ================= G/L configuration checks ================= */
            /**
             * Fee items of a bill that have no G/L mapping for that bill type.
             * A Bill Account row is keyed by BillTypeId + FeeItemId.
             */
            missingGlItems(bill) {
                if (!bill) return [];

                const typeId = Number(bill.billTypeId) || 1;
                const ids = [...new Set(
                    (bill.details || [])
                        .map(d => asGuid(d.feeItemId))
                        .filter(id => id !== EMPTY_GUID)
                )];

                return ids
                    .filter(id => !this.billAccountKeys.has(`${typeId}|${String(id).toLowerCase()}`))
                    .map(id => ({ feeItemId: id, billTypeId: typeId, name: this.getFeeItemName(id) }));
            },

            billGlLabel(bill) {
                const missing = this.missingGlItems(bill);
                if (!missing.length) return 'OK';
                return `Missing ${missing.length} item${missing.length === 1 ? '' : 's'}`;
            },

            /** Message listing the missing mappings, used in the prompts. */
            missingGlMessage(rows) {
                const map = new Map();

                rows.forEach(bill => {
                    this.missingGlItems(bill).forEach(m => {
                        const key = `${m.billTypeId}|${String(m.feeItemId).toLowerCase()}`;
                        if (!map.has(key)) map.set(key, { ...m, count: 0 });
                        map.get(key).count += 1;
                    });
                });

                const lines = [...map.values()]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(m => `• ${this.getBillTypeName(m.billTypeId)} — ${m.name}`);

                return lines.join('<br>');
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

            /* ================= normalize ================= */
            normalizeBill(r) {
                const rawDetails = val(r, 'details') || [];
                const details = (Array.isArray(rawDetails) ? rawDetails : []).map(d => ({
                    feeItemId: asGuid(val(d, 'feeItemId') || val(d, 'feesItemId') || val(d, 'boardingItemId')),
                    amount: asNumber(val(d, 'amount'))
                }));

                const rawStudents = val(r, 'students') || [];
                const billedTotal = (Array.isArray(rawStudents) ? rawStudents : [])
                    .filter(s => parseBool(val(s, 'toBeBilled') !== undefined ? val(s, 'toBeBilled') : true))
                    .reduce((sum, s) => sum + asNumber(val(s, 'amount')), 0);

                const bill = {
                    id: val(r, 'id'),
                    billNumber: asText(val(r, 'billNumber')),
                    billTypeId: Number(val(r, 'billTypeId')) || 1,
                    classId: asGuid(val(r, 'classId')),
                    academicYearId: asGuid(val(r, 'academicYearId')),
                    termId: asGuid(val(r, 'termId')),
                    billDate: isoDate(val(r, 'billDate')),
                    isProcessed: parseBool(val(r, 'isProcessed')),
                    isPosted: parseBool(val(r, 'isPosted')),
                    isCancelled: parseBool(val(r, 'isCancelled')),
                    details,
                    totalAmount: billedTotal || details.reduce((sum, d) => sum + asNumber(d.amount), 0)
                };

                bill.glStatus = this.billGlLabel(bill);
                return bill;
            },

            normalizePayment(r) {
                const studentId = asGuid(val(r, 'studentId'));
                return {
                    id: val(r, 'id'),
                    receiptNumber: asText(val(r, 'receiptNumber')),
                    paymentDate: isoDate(val(r, 'paymentDate')),
                    studentId,
                    studentName: this.getStudentName(studentId),
                    classId: asGuid(val(r, 'classId')),
                    academicYearId: asGuid(val(r, 'academicYearId')),
                    termId: asGuid(val(r, 'termId')),
                    amountToPaid: asNumber(val(r, 'amountToPaid')),
                    balance: asNumber(val(r, 'balance')),
                    paymentMethod: Number(val(r, 'paymentMethod')) || 1,
                    isProcessed: parseBool(val(r, 'isProcessed')),
                    isPosted: parseBool(val(r, 'isPosted')),
                    isCanceled: parseBool(val(r, 'isCanceled'))
                };
            },

            normalizeMemo(r) {
                const studentId = asGuid(val(r, 'studentId'));
                return {
                    id: val(r, 'id'),
                    receiptNumber: asText(val(r, 'receiptNumber')),
                    date: isoDate(val(r, 'date')),
                    studentId,
                    studentName: this.getStudentName(studentId),
                    classId: asGuid(val(r, 'classId')),
                    academicYearId: asGuid(val(r, 'academicYearId')),
                    termId: asGuid(val(r, 'termId')),
                    amountToCredit: asNumber(val(r, 'amountToCredit')),
                    paymentMethod: Number(val(r, 'paymentMethod')) || 1,
                    isProcessed: parseBool(val(r, 'isProcessed')),
                    isPosted: parseBool(val(r, 'isPosted')),
                    isCanceled: parseBool(val(r, 'isCanceled'))
                };
            },
            async getSchoolProfile() {
                this.isShimmerLoading = true;

                try {
                    let profile = null;

                    try {
                        const response = await axios.get(ENDPOINTS.schoolProfile);
                        profile = response.data?.result;
                    } catch (error) {
                        console.warn('School profile endpoint unavailable, trying the shared profile:', error);
                    }
                    const localCurrency = profile.currencyId;
                    console.log(profile)
                    if (localCurrency !== EMPTY_GUID || localCurrency !== null) {
                        this.localCurrencyId = localCurrency;
                        this.profileLoaded = true;
                    }

                    const c = this.currencyList.find(x => x.id === localCurrency);

                    this.localCurrencyCode = c ? c.currencyCode : '';
                } catch (error) {
                    console.error('Get school profile error:', error);
                    this.toastHandler('error', 'Unable to get the school profile.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ================= loads ================= */
            async loadLookups() {
                const stamp = Date.now();
                const soft = (url, label, key = null) => this.fetchList(url, label, key, true);

                const [years, terms, classList, students, currencies, feeDesc, suppItems, boardingItems,
                    billAccounts, paymentAccounts, memoAccounts] = await Promise.all([
                    this.fetchList(ENDPOINTS.academicYears, 'academic years', 'academicYears'),
                    soft(`${ENDPOINTS.terms}?v=${stamp}`, 'terms'),
                    this.fetchList(ENDPOINTS.classes, 'classes', 'classes'),
                    this.fetchList(ENDPOINTS.students, 'students', 'students'),
                    this.fetchList(ENDPOINTS.currencies, 'currencies'),
                    soft(ENDPOINTS.feeDescriptions, 'fee descriptions'),
                    soft(ENDPOINTS.supplementaryItems, 'supplementary items'),
                    soft(ENDPOINTS.boardingItems, 'boarding items'),
                    soft(ENDPOINTS.billAccounts, 'bill accounts', 'schBillAccounts'),
                    soft(ENDPOINTS.paymentAccounts, 'payment accounts', 'schPaymentAccounts'),
                    soft(ENDPOINTS.memoAccounts, 'credit memo accounts', 'schCreditMemoAccounts')
                ]);

                this.academicYears = normalizeLookups(years);
                this.terms = normalizeLookups(terms);
                this.classes = normalizeClasses(classList);
                this.allStudents = normalizeStudents(students);

                this.feeDescriptions = normalizeFeeItems(feeDesc);
                this.supplementaryItems = normalizeFeeItems(suppItems);
                this.boardingItems = normalizeFeeItems(boardingItems);

                this.billAccounts = billAccounts.map(a => ({
                    id: val(a, 'id'),
                    billTypeId: Number(val(a, 'billTypeId')) || 1,
                    feeItemId: asGuid(val(a, 'feeItemId'))
                }));

                this.paymentAccounts = paymentAccounts.map(a => ({ id: val(a, 'id') }));
                this.memoAccounts = memoAccounts.map(a => ({ id: val(a, 'id') }));

                // ---- school profile → local currency ----
                this.currencyList = currencies;
                
            },

            /**
             * Only UNPOSTED (and not canceled) records are listed — posted rows
             * have nothing left to post.
             */
            async loadBills() {
                const raw = await this.fetchList(ENDPOINTS.bills, 'bills', 'bills');
                this.bills = raw
                    .filter(r => !parseBool(val(r, 'isCancelled')) && !parseBool(val(r, 'isPosted')))
                    .map(r => this.normalizeBill(r));
            },

            async loadPayments() {
                const raw = await this.fetchList(ENDPOINTS.payments, 'student payments', 'schPayments');
                this.payments = raw
                    .filter(r => !parseBool(val(r, 'isCanceled')) && !parseBool(val(r, 'isPosted')))
                    .map(r => this.normalizePayment(r));
            },

            async loadMemos() {
                const raw = await this.fetchList(ENDPOINTS.memos, 'credit memos', 'schCreditMemos');
                this.memos = raw
                    .filter(r => !parseBool(val(r, 'isCanceled')) && !parseBool(val(r, 'isPosted')))
                    .map(r => this.normalizeMemo(r));
            },

            async refreshAll() {
                this.isShimmerLoading = true;
                try {
                    await Promise.all([this.loadBills(), this.loadPayments(), this.loadMemos()]);
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ================= selection ================= */
            getGridSelectedRows(gridRef) {
                const grid = (this.$refs && this.$refs[gridRef]) ? this.$refs[gridRef] : null;
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

            clearGridSelection(gridRef) {
                const grid = (this.$refs && this.$refs[gridRef]) ? this.$refs[gridRef] : null;
                if (!grid) return;
                if (typeof grid.clearSelection === 'function') { try { grid.clearSelection(); } catch (e) {} }
                if (typeof grid.deselectAll === 'function') { try { grid.deselectAll(); } catch (e) {} }
            },

            /* ================= currency guard ================= */
            /** Blocks posting when the school profile has no local currency. */
            async ensureCurrencyOrWarn() {
                if (this.currencyConfigured) return true;

                if (typeof Swal !== 'undefined') {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Local Currency Not Set',
                        html: `<div class="text-sm text-left">
                                 <div>The school's <b>local currency</b> is <b>empty</b> (null or empty guid).</div>
                                 <div class="mt-2">Please set the local currency in the <b>School Profile</b> before posting to G/L accounts.</div>
                               </div>`,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#dc2626'
                    });
                } else {
                    this.toastHandler('error', 'Set the local currency in the School Profile before posting.');
                }
                return false;
            },

            /* ================= POST: bills ================= */
            async postSelectedBills() {
                if (this.busy) return;

                const grid = this.$refs.billsGrid;
                const selected = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];
                if (!selected.length) return this.toastHandler('warning', 'Select one or more bills to post.');

                if (!(await this.ensureCurrencyOrWarn())) return;

                // every fee item on the selected bills must have a G/L account
                const missingRows = selected.filter(b => this.missingGlItems(b).length > 0);
                if (missingRows.length) {
                    const html = `<div class="text-sm text-left">
                                    <div>The following fee items have <b>no G/L account</b> configured:</div>
                                    <div class="mt-2 text-xs">${this.missingGlMessage(missingRows)}</div>
                                    <div class="mt-3">Set them up in <b>G/L Accounts → Bill Accounts</b> before posting.</div>
                                  </div>`;
                    if (typeof Swal !== 'undefined') {
                        await Swal.fire({
                            icon: 'warning',
                            title: 'G/L Accounts Not Configured',
                            html,
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#f59e0b'
                        });
                    } else {
                        this.toastHandler('warning', 'Some fee items have no G/L account configured.');
                    }
                    return;
                }

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'question',
                        title: 'Post Bills?',
                        text: `Post ${selected.length} bill(s) to the G/L accounts?`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, post',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#4f46e5',
                        cancelButtonColor: '#64748b'
                    });
                    if (!result.isConfirmed) return;
                }

                this.busy = true;
                this.isShimmerLoading = true;
                try {
                    const billIds = selected.map(b => b.id);
                    const res = await axios.post(ENDPOINTS.postBills, billIds);
                    if (res.data && res.data.success === false) {
                        this.toastHandler('error', res.data.message || 'Unable to post selected bills.');
                        return;
                    }
                    if (grid && grid.clearSelection) grid.clearSelection();
                    this.toastHandler('success', `Posted ${billIds.length} bill(s).`);
                    await this.refreshAll();
                } catch (error) {
                    console.error('Post bills failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to post bill(s).');
                } finally {
                    this.busy = false;
                    this.isShimmerLoading = false;
                }
            },

            /* ================= POST: payments ================= */
            async postSelectedPayments() {
                if (this.busy) return;

                const grid = this.$refs.paymentsGrid;
                const selected = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];
                if (!selected.length) return this.toastHandler('warning', 'Select one or more payments to post.');

                if (!(await this.ensureCurrencyOrWarn())) return;

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'question',
                        title: 'Post Payments?',
                        text: `Post ${selected.length} student payment(s) to the G/L accounts?`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, post',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#4f46e5',
                        cancelButtonColor: '#64748b'
                    });
                    if (!result.isConfirmed) return;
                }

                this.busy = true;
                this.isShimmerLoading = true;
                try {
                    const paymentIds = selected.map(p => p.id);
                    const res = await axios.post(ENDPOINTS.postPayments, paymentIds);
                    if (res.data && res.data.success === false) {
                        this.toastHandler('error', res.data.message || 'Unable to post selected payments.');
                        return;
                    }
                    if (grid && grid.clearSelection) grid.clearSelection();
                    this.toastHandler('success', `Posted ${paymentIds.length} payment(s).`);
                    await this.refreshAll();
                } catch (error) {
                    console.error('Post payments failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to post payment(s).');
                } finally {
                    this.busy = false;
                    this.isShimmerLoading = false;
                }
            },

            /* ================= POST: credit memos ================= */
            async postSelectedMemos() {
                if (this.busy) return;

                const grid = this.$refs.memosGrid;
                const selected = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];
                if (!selected.length) return this.toastHandler('warning', 'Select one or more credit memos to post.');

                if (!(await this.ensureCurrencyOrWarn())) return;

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'question',
                        title: 'Post Credit Memos?',
                        text: `Post ${selected.length} credit memo(s) to the G/L accounts?`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, post',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#4f46e5',
                        cancelButtonColor: '#64748b'
                    });
                    if (!result.isConfirmed) return;
                }

                this.busy = true;
                this.isShimmerLoading = true;
                try {
                    const memoIds = selected.map(m => m.id);
                    const res = await axios.post(ENDPOINTS.postMemos, memoIds);
                    if (res.data && res.data.success === false) {
                        this.toastHandler('error', res.data.message || 'Unable to post selected credit memos.');
                        return;
                    }
                    if (grid && grid.clearSelection) grid.clearSelection();
                    this.toastHandler('success', `Posted ${memoIds.length} credit memo(s).`);
                    await this.refreshAll();
                } catch (error) {
                    console.error('Post credit memos failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to post credit memo(s).');
                } finally {
                    this.busy = false;
                    this.isShimmerLoading = false;
                }
            }
        },

        async mounted() {
            this.isShimmerLoading = true;
            try {
                await this.loadLookups();
                await this.getSchoolProfile();
                await this.refreshAll();
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
