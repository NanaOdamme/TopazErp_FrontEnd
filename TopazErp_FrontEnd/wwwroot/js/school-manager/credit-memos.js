(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const DEFAULT_DATE_TIME = '0001-01-01T00:00:00';

    /* ==============================================================
     * ENDPOINTS — School credit memos (SchCreditMemo)
     * ============================================================== */
    const ENDPOINTS = {
        creditMemos: '/SchoolManager/GetSchCreditMemos/',
        createCreditMemo: '/SchoolManager/CreateSchCreditMemo/',
        updateCreditMemo: '/SchoolManager/UpdateSchCreditMemo/',
        cancelCreditMemo: '/SchoolManager/CancelSchCreditMemo/',

        // lookups
        studentBills: '/SchoolManager/GetStudentBills/',
        students: '/SchoolManager/GetStudentBios/',
        academicYears: '/SchoolManager/GetAcademicYears/',
        classes: '/SchoolManager/GetLevelClasses/',
        terms: '/jsonDataSample/terms.json',
        schoolProfile: '/SchoolManager/GetSchoolProfile/',
        currencies: '/SharedResource/GetCurrencies',
        banks: '/SharedResource/GetBanks',
        glAccounts: '/Ap/InitJournalEntry'
    };

    const PAYMENT_METHODS = [
        { id: 1, name: 'Cash' },
        { id: 2, name: 'Cheque' },
        { id: 3, name: 'Bank Transfer' },
        { id: 4, name: 'Mobile Money' }
    ];
    const CHEQUE_METHOD_ID = 2;

    /* ==============================================================
     * UPDATE / CANCEL RULES  (SchCreditMemo)
     *  - Cancel : processed AND posted memos CAN be canceled
     *             (also when they were already flagged / deleted).
     *  - Update : processed memos CAN be updated,
     *             posted memos CANNOT be updated.
     *  - Canceled memos are never loaded / displayed.
     * ============================================================== */
    const RULES = {
        canUpdate: memo => Boolean(memo) && !parseBool(memo.isPosted) && !parseBool(memo.isCanceled),
        canCancel: memo => Boolean(memo) && !parseBool(memo.isCanceled)
    };

    /* ---------------- helpers ---------------- */
    const pad = n => String(n).padStart(2, '0');

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
                return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }
            const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(raw);
            if (dmy) return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
        }
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };

    const loadedDate = value => {
        const iso = isoDate(value);
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
        if (iso.startsWith('0001-') || iso.startsWith('0000-') || iso === '1900-01-01') return '';
        return iso;
    };

    const toApiDate = value => {
        const iso = loadedDate(value);
        if (!iso) return DEFAULT_DATE_TIME;
        return `${iso}T00:00:00`;
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
            className: val(c, 'className') || val(c, 'name') || '',
            levelId: val(c, 'levelId') || EMPTY_GUID
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
            return {
                id,
                firstName,
                lastName,
                otherName,
                fullName,
                name: fullName,
                identifier: String(val(s, 'studentIdentifier') || val(s, 'identifier') || val(s, 'admissionNumber') || '').trim(),
                classId: val(s, 'classId') || val(s, 'classID') || null
            };
        })
        .filter(s => s.id != null && s.fullName !== '')
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const normalizeStudentBill = r => ({
        id: val(r, 'id'),
        studentId: asGuid(val(r, 'studentId')),
        billNumber: String(val(r, 'billNumber') || ''),
        academicYearId: asGuid(val(r, 'academicYearId')),
        termId: asGuid(val(r, 'termId')),
        classId: asGuid(val(r, 'classId')),
        amount: asNumber(val(r, 'amount')),
        amountPaid: asNumber(val(r, 'amountPaid')),
        balanceDue: asNumber(val(r, 'balanceDue')),
        isCanceled: parseBool(val(r, 'isCanceled') || val(r, 'isCancelled'))
    });

    /** Default form — mirrors SchCreditMemo. */
    const emptyMemoForm = () => ({
        id: null,
        tenantId: 0,
        academicYearId: '',
        termId: '',
        classId: '',
        studentId: '',
        date: isoDate(new Date()),
        receiptNumber: '',
        batchNumber: '',
        amountDue: 0,
        amountToCredit: 0,
        description: '',
        isPosted: false,
        isCanceled: false,
        canceledBy: '',
        canceledDate: '',
        isProcessed: false,
        currencyId: '',
        rate: 1,
        bankId: '',
        bankBranchId: '',
        chequeNumber: '',
        chequeDate: '',
        paymentMethod: 1,
        creditGlId: EMPTY_GUID,
        debitGlId: EMPTY_GUID,
        isMultiCurrency: false,
        journalId: EMPTY_GUID,
        isLocked: false
    });

    const app = Vue.createApp({
        data() {
            return {
                theme: '#062a81',
                isShimmerLoading: false,
                saving: false,
                busy: false,
                setupDone: false,

                paymentMethods: PAYMENT_METHODS,

                // lookups
                academicYears: [],
                terms: [],
                classes: [],
                allStudents: [],
                currencies: [],
                banks: [],
                glAccounts: [],
                studentBills: [],

                // local (school) currency
                localCurrencyId: '',
                localCurrencyCode: '',
                localCurrencyName: '',
                localCurrencyMinor: '',

                // collection
                creditMemos: [],

                // modal
                memoModalOpen: false,
                editMode: false,
                form: emptyMemoForm()
            };
        },

        computed: {
            memoColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false },
                    { key: 'receiptNumber', label: 'Memo No.', type: 'text', width: 160, searchable: true, editable: false },
                    { key: 'date', label: 'Date', type: 'date', width: 130, searchable: true, editable: false },
                    {
                        // resolved from student bios (lastName firstName otherName)
                        key: 'studentName',
                        label: 'Student',
                        type: 'text',
                        width: 230,
                        searchable: true,
                        editable: false
                    },
                    {
                        key: 'classId',
                        label: 'Class',
                        type: 'select',
                        width: 150,
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
                    { key: 'amountDue', label: 'Amount Due', type: 'number', decimals: 2, width: 130, editable: false },
                    { key: 'amountToCredit', label: 'Amount Credited', type: 'number', decimals: 2, width: 150, editable: false },
                    {
                        key: 'paymentMethod',
                        label: 'Method',
                        type: 'select',
                        width: 120,
                        options: this.paymentMethods,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    { key: 'description', label: 'Description', type: 'text', width: 220, searchable: true, editable: false },
                    { key: 'isProcessed', label: 'Processed?', type: 'boolean', width: 110, editable: false },
                    { key: 'isPosted', label: 'Posted?', type: 'boolean', width: 100, editable: false }
                    // 'isCanceled' is intentionally not shown: canceled memos are never loaded.
                ];
            },

            /**
             * Students that can receive a credit memo: those with student bills,
             * plus anyone already having a memo (so edits keep working).
             */
            studentOptions() {
                const map = new Map();

                (this.studentBills || []).forEach(sb => {
                    if (parseBool(sb.isCanceled)) return;
                    if (!sb.studentId || sb.studentId === EMPTY_GUID) return;
                    const key = String(sb.studentId).toLowerCase();
                    if (map.has(key)) return;

                    const student = this.getStudentById(sb.studentId);
                    map.set(key, {
                        studentId: sb.studentId,
                        id: sb.studentId,
                        fullName: student ? student.fullName : `Unknown Student (${sb.studentId.substring(0, 8)}…)`,
                        identifier: student ? student.identifier : '',
                        classId: sb.classId
                    });
                });

                (this.allStudents || []).forEach(st => {
                    const key = String(st.id).toLowerCase();
                    if (map.has(key)) return;
                    map.set(key, {
                        studentId: st.id,
                        id: st.id,
                        fullName: st.fullName,
                        identifier: st.identifier,
                        classId: st.classId
                    });
                });

                return [...map.values()]
                    .map(s => ({
                        ...s,
                        name: `${s.identifier ? s.identifier + ' - ' : ''}${s.fullName}`
                    }))
                    .sort((a, b) => a.fullName.localeCompare(b.fullName));
            },

            isCheque() {
                return Number(this.form.paymentMethod) === CHEQUE_METHOD_ID;
            },

            requiresBank() {
                return Number(this.form.paymentMethod) !== 1;
            },

            selectedCurrency() {
                return this.currencies.find(c => sameId(c.id, this.form.currencyId)) || null;
            },

            localCurrency() {
                return this.currencies.find(c => sameId(c.id, this.localCurrencyId)) || null;
            },

            currencyCode() {
                return this.localCurrencyCode || 'GHS';
            },

            paymentCurrencyCode() {
                const c = this.selectedCurrency;
                return (c && (c.currencyCode || c.currencyName)) || this.currencyCode;
            },

            /** Multi-currency === the memo currency is not the school's local currency. */
            isMemoMultiCurrency() {
                if (!this.form.currencyId) return false;
                if (!this.localCurrencyId) return false;
                return !sameId(this.form.currencyId, this.localCurrencyId);
            },

            effectiveRate() {
                if (!this.isMemoMultiCurrency) return 1;
                const rate = asNumber(this.form.rate, 0);
                return rate > 0 ? rate : 1;
            },

            amountToCreditInMemoCurrency() {
                return asNumber(this.form.amountToCredit);
            },

            /** Amount credited converted into the local currency. */
            amountToCreditInLocalCurrency() {
                return Number((this.amountToCreditInMemoCurrency * this.effectiveRate).toFixed(2));
            },

            /** Balance still owed by this student on their bills (local currency). */
            studentOutstanding() {
                const studentId = this.form.studentId;
                if (!studentId) return 0;
                return (this.studentBills || [])
                    .filter(sb => !parseBool(sb.isCanceled) && sameId(sb.studentId, studentId))
                    .reduce((sum, sb) => sum + asNumber(sb.balanceDue), 0);
            },

            /** Credit smaller than the outstanding balance → memo settles part of the debt. */
            creditSettlesPartOfBalance() {
                return this.studentOutstanding > 0.009 &&
                    this.amountToCreditInLocalCurrency < this.studentOutstanding - 0.009;
            },

            bankBranchChoices() {
                const bank = this.banks.find(b => sameId(b.id, this.form.bankId));
                return bank ? (bank.bankBranches || []) : [];
            }
        },

        methods: {
            val,
            isGuid,
            asGuid,
            parseBool,
            sameId,
            isoDate,
            loadedDate,

            emptyForm() {
                return emptyMemoForm();
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

            formatMoney(v, code = null) {
                const n = asNumber(v);
                const currency = code || this.currencyCode;
                return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            },

            formatMemoMoney(v) {
                return this.formatMoney(v, this.paymentCurrencyCode);
            },

            formatConverted(v) {
                return `≈ ${this.formatMoney(v)}`;
            },

            /* ---------------- lookups ---------------- */
            getClassName(classId) {
                if (!classId || classId === EMPTY_GUID) return '';
                const c = this.classes.find(x => sameId(x.id, classId));
                return c ? c.name : '';
            },

            getYearName(yearId) {
                if (!yearId) return '';
                const y = this.academicYears.find(x => sameId(x.id, yearId));
                return y ? y.name : '';
            },

            getTermName(termId) {
                if (!termId) return '';
                const t = this.terms.find(x => sameId(x.id, termId));
                return t ? t.name : '';
            },

            getStudentById(studentId) {
                if (!studentId) return null;
                return this.allStudents.find(x => sameId(x.id, studentId)) || null;
            },

            /** lastName firstName otherName */
            getStudentName(studentId) {
                const s = this.getStudentById(studentId);
                return s ? s.fullName : '';
            },

            getStudentDisplayName(studentId) {
                const name = this.getStudentName(studentId);
                if (name) return name;
                return isGuid(studentId) ? `Unknown Student (${String(studentId).substring(0, 8)}…)` : 'Unknown Student';
            },

            /** Read-only only when the memo cannot be updated (posted). */
            isMemoLocked(memo) {
                if (!memo) return false;
                return !RULES.canUpdate(memo);
            },

            /* ---------------- API ---------------- */
            async fetchList(url, label, preferredKey = null, soft = false) {
                try {
                    const response = await axios.get(url);
                    return unwrapList(response.data, preferredKey);
                } catch (error) {
                    if (!soft) {
                        console.error(`Failed to load ${label}:`, error);
                        this.toastHandler('error', `Failed to load ${label}.`);
                    } else {
                        console.warn(`Optional lookup "${label}" is not available yet (${url}).`);
                    }
                    return [];
                }
            },

            normalizeCreditMemo(r) {
                const studentId = asGuid(val(r, 'studentId'));
                return {
                    id: val(r, 'id'),
                    tenantId: Number(val(r, 'tenantId')) || 0,
                    academicYearId: asGuid(val(r, 'academicYearId')),
                    termId: asGuid(val(r, 'termId')),
                    classId: asGuid(val(r, 'classId')),
                    studentId,
                    studentName: this.getStudentName(studentId),
                    date: loadedDate(val(r, 'date')),
                    receiptNumber: asText(val(r, 'receiptNumber')),
                    batchNumber: asText(val(r, 'batchNumber')),
                    amountDue: asNumber(val(r, 'amountDue')),
                    amountToCredit: asNumber(val(r, 'amountToCredit')),
                    description: asText(val(r, 'description')),
                    isPosted: parseBool(val(r, 'isPosted')),
                    isCanceled: parseBool(val(r, 'isCanceled')),
                    canceledBy: asText(val(r, 'canceledBy')),
                    canceledDate: loadedDate(val(r, 'canceledDate')),
                    isProcessed: parseBool(val(r, 'isProcessed')),
                    currencyId: asGuid(val(r, 'currencyId')),
                    rate: asNumber(val(r, 'rate'), 1),
                    bankId: asGuid(val(r, 'bankId')),
                    bankBranchId: asGuid(val(r, 'bankBranchId')),
                    chequeNumber: asText(val(r, 'chequeNumber')),
                    chequeDate: loadedDate(val(r, 'chequeDate')),
                    paymentMethod: Number(val(r, 'paymentMethod')) || 1,
                    creditGlId: asGuid(val(r, 'creditGlId')),
                    debitGlId: asGuid(val(r, 'debitGlId')),
                    isMultiCurrency: parseBool(val(r, 'isMultiCurrency')),
                    journalId: asGuid(val(r, 'journalId'))
                };
            },

            hydrateStudentNames() {
                (this.creditMemos || []).forEach(m => {
                    const name = this.getStudentName(m.studentId);
                    if (name) m.studentName = name;
                });
            },

            async loadCreditMemos() {
                this.isShimmerLoading = true;
                try {
                    const raw = await this.fetchList(ENDPOINTS.creditMemos, 'credit memos', 'schCreditMemos');
                    // Only non-canceled data — canceled memos are not displayed at all.
                    this.creditMemos = raw
                        .filter(r => !parseBool(val(r, 'isCanceled')))
                        .map(r => this.normalizeCreditMemo(r));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async loadStudentBills() {
                const raw = await this.fetchList(ENDPOINTS.studentBills, 'student bills', 'studentBills', true);
                this.studentBills = raw.map(r => normalizeStudentBill(r));
            },

            async loadLookups() {
                const stamp = Date.now();
                const soft = (url, label, key = null) => this.fetchList(url, label, key, true);

                const [years, terms, classList, students, currencies, banks, glAccounts, schoolProfile] = await Promise.all([
                    this.fetchList(ENDPOINTS.academicYears, 'academic years', 'academicYears'),
                    soft(`${ENDPOINTS.terms}?v=${stamp}`, 'terms'),
                    this.fetchList(ENDPOINTS.classes, 'classes', 'classes'),
                    this.fetchList(ENDPOINTS.students, 'students', 'students'),
                    soft(ENDPOINTS.currencies, 'currencies'),
                    soft(ENDPOINTS.banks, 'banks'),
                    soft(ENDPOINTS.glAccounts, 'GL accounts', 'accounts'),
                    soft(ENDPOINTS.schoolProfile, 'school profile')
                ]);

                this.academicYears = normalizeLookups(years);
                this.terms = normalizeLookups(terms);
                this.classes = normalizeClasses(classList);
                this.allStudents = normalizeStudents(students);

                this.currencies = currencies.map(c => ({
                    ...c,
                    id: val(c, 'id'),
                    name: val(c, 'currencyName') || val(c, 'name') || val(c, 'currencyCode') || '',
                    currencyName: val(c, 'currencyName') || val(c, 'name') || '',
                    currencyCode: val(c, 'currencyCode') || '',
                    buyRate: asNumber(val(c, 'buyRate'), 1),
                    sellRate: asNumber(val(c, 'sellRate'), 1),
                    minorName: val(c, 'minorName') || '',
                    isDefault: parseBool(val(c, 'isDefault'))
                }));

                // local currency from the school profile
                const profile = Array.isArray(schoolProfile) ? (schoolProfile[0] || {}) : (schoolProfile || {});
                const profileCurrencyId = asGuid(val(profile, 'currencyId'));

                const local =
                    this.currencies.find(c => sameId(c.id, profileCurrencyId)) ||
                    this.currencies.find(c => c.isDefault) ||
                    this.currencies[0] ||
                    null;

                this.localCurrencyId = local ? local.id : '';
                this.localCurrencyCode = local
                    ? (local.currencyCode || local.currencyName || local.name || '')
                    : '';
                this.localCurrencyName = local ? (local.currencyName || local.name || '') : '';
                this.localCurrencyMinor = local ? (local.minorName || '') : '';

                this.banks = banks.map(b => ({
                    ...b,
                    id: val(b, 'id'),
                    name: val(b, 'name') || val(b, 'bankName') || '',
                    bankBranches: unwrapList(val(b, 'bankBranches') || val(b, 'branches') || [])
                }));

                this.glAccounts = glAccounts.map(a => ({
                    ...a,
                    id: val(a, 'id'),
                    accountNo: asText(val(a, 'accountNo')),
                    accountName: val(a, 'accountName') || val(a, 'name') || '',
                    name: `${asText(val(a, 'accountNo'))} - ${val(a, 'accountName') || val(a, 'name') || ''}`.replace(/^ - /, '')
                }));

                this.setupDone = true;
            },

            async refreshAll() {
                await this.loadCreditMemos();
                this.hydrateStudentNames();
            },

            /* ---------------- grid selection ---------------- */
            getGridSelectedRows(gridRef, fallbackList = []) {
                const grid = (this.$refs && this.$refs[gridRef]) ? this.$refs[gridRef] : null;
                if (!grid) return [];

                if (typeof grid.selectedRows === 'function') {
                    try {
                        const res = grid.selectedRows();
                        if (Array.isArray(res) && res.length) return res;
                    } catch (e) { console.warn('selectedRows() failed:', e); }
                }
                if (Array.isArray(grid.selectedRows) && grid.selectedRows.length) return grid.selectedRows;
                if (typeof grid.getSelectedRows === 'function') {
                    try {
                        const res = grid.getSelectedRows();
                        if (Array.isArray(res) && res.length) return res;
                    } catch (e) { console.warn('getSelectedRows() failed:', e); }
                }
                const candidate = grid.selected || grid.selection || grid.selectedItems || grid.selectedRowIds;
                if (Array.isArray(candidate) && candidate.length) {
                    if (typeof candidate[0] === 'object' && candidate[0] !== null) return candidate;
                    return fallbackList.filter(item => candidate.some(id => sameId(item.id, id)));
                }
                return [];
            },

            clearGridSelection(gridRef) {
                const grid = (this.$refs && this.$refs[gridRef]) ? this.$refs[gridRef] : null;
                if (!grid) return;
                if (typeof grid.clearSelection === 'function') { try { grid.clearSelection(); } catch (e) {} }
                if (typeof grid.deselectAll === 'function') { try { grid.deselectAll(); } catch (e) {} }
            },

            /* ---------------- numbering ---------------- */
            generateMemoNumber() {
                const d = new Date();
                const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
                const seq = String(Math.floor(100000 + Math.random() * 900000));
                return `CM-${ymd}-${seq}`;
            },

            generateBatchNumber() {
                return `B-${Math.floor(100000 + Math.random() * 900000)}`;
            },

            /* ---------------- modal ---------------- */
            openMemoModal(memo = null) {
                this.editMode = Boolean(memo && memo.id);

                if (this.editMode) {
                    this.form = {
                        ...this.emptyForm(),
                        id: memo.id,
                        tenantId: Number(memo.tenantId) || 0,
                        academicYearId: memo.academicYearId,
                        termId: memo.termId,
                        classId: memo.classId,
                        studentId: memo.studentId,
                        date: memo.date || isoDate(new Date()),
                        receiptNumber: memo.receiptNumber || this.generateMemoNumber(),
                        batchNumber: memo.batchNumber || this.generateBatchNumber(),
                        amountDue: asNumber(memo.amountDue),
                        amountToCredit: asNumber(memo.amountToCredit),
                        description: memo.description || '',
                        isPosted: parseBool(memo.isPosted),
                        isCanceled: parseBool(memo.isCanceled),
                        canceledBy: memo.canceledBy || '',
                        canceledDate: memo.canceledDate || '',
                        isProcessed: parseBool(memo.isProcessed),
                        currencyId: memo.currencyId,
                        rate: asNumber(memo.rate, 1) || 1,
                        bankId: memo.bankId !== EMPTY_GUID ? memo.bankId : '',
                        bankBranchId: memo.bankBranchId !== EMPTY_GUID ? memo.bankBranchId : '',
                        chequeNumber: memo.chequeNumber || '',
                        chequeDate: memo.chequeDate || '',
                        paymentMethod: Number(memo.paymentMethod) || 1,
                        creditGlId: memo.creditGlId || EMPTY_GUID,
                        debitGlId: memo.debitGlId || EMPTY_GUID,
                        isMultiCurrency: parseBool(memo.isMultiCurrency),
                        journalId: memo.journalId || EMPTY_GUID,
                        isLocked: this.isMemoLocked(memo)
                    };

                    const loadedCurrency = this.selectedCurrency;
                    if (loadedCurrency && sameId(loadedCurrency.id, this.localCurrencyId)) this.form.rate = 1;
                    this.syncMultiCurrencyFlag();
                } else {
                    const defaultCurrency =
                        this.currencies.find(c => sameId(c.id, this.localCurrencyId)) ||
                        this.currencies.find(c => c.isDefault) ||
                        this.currencies[0] ||
                        null;

                    this.form = {
                        ...this.emptyForm(),
                        date: isoDate(new Date()),
                        receiptNumber: this.generateMemoNumber(),
                        batchNumber: this.generateBatchNumber(),
                        currencyId: defaultCurrency ? defaultCurrency.id : (this.localCurrencyId || ''),
                        rate: 1,
                        isMultiCurrency: false,
                        academicYearId: this.academicYears.length ? this.academicYears[0].id : '',
                        termId: this.terms.length ? this.terms[0].id : ''
                    };
                }

                this.memoModalOpen = true;
            },

            closeMemoModal() {
                this.memoModalOpen = false;
                this.editMode = false;
                this.form = this.emptyForm();
            },

            editSelectedMemo() {
                const selected = this.getGridSelectedRows('memosGrid', this.creditMemos);
                if (!selected.length) return this.toastHandler('warning', 'Please select a credit memo to edit.');
                if (selected.length > 1) return this.toastHandler('warning', 'Please select only one credit memo to edit.');

                const memo = selected[0];
                // Processed memos can be updated, posted memos cannot.
                if (!RULES.canUpdate(memo)) {
                    return this.toastHandler('warning', 'Posted credit memos cannot be updated.');
                }

                this.openMemoModal(memo);
            },

            onStudentChanged() {
                const student = this.getStudentById(this.form.studentId);
                if (student && student.classId) {
                    this.form.classId = student.classId;
                }

                // Prefill the amount with the student's outstanding balance (local currency)
                const outstanding = this.studentOutstanding;
                if (outstanding > 0.009 && !asNumber(this.form.amountToCredit)) {
                    this.form.amountToCredit = outstanding;
                }
                this.form.amountDue = outstanding;
            },

            onPaymentMethodChanged() {
                if (!this.isCheque) {
                    this.form.chequeNumber = '';
                    this.form.chequeDate = '';
                } else if (!this.form.chequeDate) {
                    this.form.chequeDate = this.form.date || isoDate(new Date());
                }
            },

            onBankChanged() {
                const bank = this.banks.find(b => sameId(b.id, this.form.bankId));
                const branches = bank ? (bank.bankBranches || []) : [];
                if (!branches.some(b => sameId(b.id, this.form.bankBranchId))) {
                    this.form.bankBranchId = '';
                }
            },

            onCurrencyChanged() {
                const currency = this.selectedCurrency;
                if (!currency) {
                    this.form.rate = 1;
                    this.syncMultiCurrencyFlag();
                    return;
                }
                const isLocal = sameId(currency.id, this.localCurrencyId);
                this.form.rate = isLocal ? 1 : asNumber(currency.buyRate, 1) || 1;
                this.syncMultiCurrencyFlag();
            },

            syncMultiCurrencyFlag() {
                this.form.isMultiCurrency = this.isMemoMultiCurrency;
                return this.form.isMultiCurrency;
            },

            regenerateMemoNumber() {
                this.form.receiptNumber = this.generateMemoNumber();
            },

            /* ---------------- payload ---------------- */
            buildPayload() {
                const f = this.form;

                const payload = {
                    academicYearId: asGuid(f.academicYearId),
                    termId: asGuid(f.termId),
                    classId: asGuid(f.classId),
                    studentId: asGuid(f.studentId),
                    date: toApiDate(f.date),
                    receiptNumber: asText(f.receiptNumber),
                    batchNumber: asText(f.batchNumber),
                    amountDue: asNumber(f.amountDue),
                    amountToCredit: asNumber(f.amountToCredit),
                    description: asText(f.description),
                    isPosted: parseBool(f.isPosted),
                    isCanceled: false,
                    canceledBy: '',
                    canceledDate: DEFAULT_DATE_TIME,
                    isProcessed: parseBool(f.isProcessed),
                    currencyId: asGuid(f.currencyId),
                    rate: asNumber(f.rate, 1),
                    bankId: this.requiresBank ? asGuid(f.bankId) : EMPTY_GUID,
                    bankBranchId: this.requiresBank ? asGuid(f.bankBranchId) : EMPTY_GUID,
                    chequeNumber: this.isCheque ? asText(f.chequeNumber) : '',
                    chequeDate: this.isCheque ? toApiDate(f.chequeDate) : DEFAULT_DATE_TIME,
                    paymentMethod: Number(f.paymentMethod) || 1,
                    creditGlId: asGuid(f.creditGlId),
                    debitGlId: asGuid(f.debitGlId),
                    isMultiCurrency: this.isMemoMultiCurrency,
                    journalId: asGuid(f.journalId)
                };

                // TenantId on update only
                if (f.id) {
                    payload.id = f.id;
                    payload.tenantId = Number(f.tenantId) || 0;
                }

                return payload;
            },

            validateBeforeSave() {
                const f = this.form;

                if (!f.studentId) return 'Please select a student.';
                if (!f.date) return 'Please choose the memo date.';
                if (!f.academicYearId) return 'Please select an academic year.';
                if (!f.termId) return 'Please select a term.';
                if (!f.classId) return 'Please select a class.';

                const amount = asNumber(f.amountToCredit);
                if (!(amount > 0)) return 'Amount to credit must be greater than zero.';
                if (this.isMemoMultiCurrency && !(asNumber(f.rate, 0) > 0)) {
                    return 'Please enter a valid exchange rate for the selected currency.';
                }
                if (this.isCheque && !String(f.chequeNumber || '').trim()) {
                    return 'Cheque number is required for cheque memos.';
                }
                if (!String(f.receiptNumber || '').trim()) return 'Memo number could not be generated. Please retry.';
                return '';
            },

            async saveMemo() {
                if (this.saving) return;

                const error = this.validateBeforeSave();
                if (error) return this.toastHandler('warning', error);

                if (this.editMode && this.form.isLocked) {
                    return this.toastHandler('warning', 'Posted or processed credit memos cannot be updated.');
                }

                const studentName = this.getStudentDisplayName(this.form.studentId);
                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'question',
                        title: this.editMode ? 'Update Credit Memo?' : 'Create Credit Memo?',
                        html: `<div class="text-sm text-left">
                                 <div>Credit <b>${this.formatMemoMoney(this.form.amountToCredit)}</b>${
                            this.isMemoMultiCurrency ? ` (≈ ${this.formatMoney(this.amountToCreditInLocalCurrency)})` : ''
                        } for <b>${studentName}</b>.</div>
                                 <div class="mt-1">Memo No. <b>${this.form.receiptNumber}</b></div>
                               </div>`,
                        showCancelButton: true,
                        confirmButtonText: this.editMode ? 'Yes, update' : 'Yes, save',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#4f46e5',
                        cancelButtonColor: '#64748b'
                    });
                    if (!result.isConfirmed) return;
                }

                this.saving = true;
                const payload = this.buildPayload();
                const endpoint = this.editMode ? ENDPOINTS.updateCreditMemo : ENDPOINTS.createCreditMemo;

                try {
                    const res = await axios.post(endpoint, payload);
                    const result = res.data?.result || res.data;

                    if (res.data?.success === false || (result?.code && Number(result.code) !== 200)) {
                        this.toastHandler('error', result?.message || res.data?.error?.message || 'Failed to save the credit memo.');
                        return;
                    }

                    this.toastHandler('success', this.editMode ? 'Credit memo updated successfully.' : 'Credit memo created successfully.');
                    this.closeMemoModal();
                    await this.refreshAll();
                } catch (err) {
                    console.error('Save credit memo failed:', err);
                    this.toastHandler('error', err.response?.data?.message || 'Failed to save the credit memo.');
                } finally {
                    this.saving = false;
                }
            },

            /* ==========================================================
             * Cancel — same pattern as the payments grid:
             * rows come straight off grid.selectedRows(), ids are posted raw.
             * Processed AND posted memos can be canceled.
             * ========================================================== */
            async cancelSelectedMemos() {
                const grid = this.$refs.memosGrid;
                const selected = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];
                if (!selected.length) { this.toastHandler('warning', 'Select one or more credit memos to cancel.'); return; }

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'warning', title: 'Confirm Cancellation',
                        text: `Are you sure you want to cancel ${selected.length} credit memo${selected.length === 1 ? '' : 's'}?`,
                        showCancelButton: true, confirmButtonText: 'Yes, cancel', cancelButtonText: 'No, go back',
                        confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b', reverseButtons: true
                    });
                    if (!result.isConfirmed) return;
                }

                this.busy = true;
                this.isShimmerLoading = true;
                try {
                    const memoIds = selected.map(memo => memo.id);
                    const res = await axios.post(ENDPOINTS.cancelCreditMemo, memoIds);
                    if (res.data && res.data.success === false) {
                        this.toastHandler('error', res.data.message || 'Unable to cancel selected credit memos.');
                        return;
                    }
                    if (grid.clearSelection) grid.clearSelection();
                    this.toastHandler('success', 'Canceled successfully.');

                    await this.refreshAll();
                } catch (error) {
                    console.error('Credit memo cancellation failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to cancel credit memo(s).');
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
                await this.loadStudentBills();
                await this.refreshAll();
            } finally {
                this.isShimmerLoading = false;
            }
        }
    });

    if (typeof DataGridPlugin !== 'undefined') app.use(DataGridPlugin);
    if (typeof WSelectPlugin !== 'undefined') app.use(WSelectPlugin);

    app.mount('#app');
})();
