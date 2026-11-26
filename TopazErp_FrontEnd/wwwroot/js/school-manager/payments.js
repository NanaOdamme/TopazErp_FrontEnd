(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const DEFAULT_DATE_TIME = '0001-01-01T00:00:00';

    /* ==============================================================
     * ENDPOINTS
     * ============================================================== */
    const ENDPOINTS = {
        // Student payments (SchPayment)
        payments: '/SchoolManager/GetSchPayments/',
        createPayment: '/SchoolManager/CreateSchPayment/',
        updatePayment: '/SchoolManager/UpdateSchPayment/',
        processPayments: '/SchoolManager/ProcessSchPayments/',
        cancelPayments: '/SchoolManager/CancelSchPayments/',

        // Student credit memos (SchCreditMemo) — used by the overpayment prompt
        createCreditMemo: '/SchoolManager/CreateSchCreditMemo/',

        // School Manager lookups
        studentBills: '/SchoolManager/GetStudentBills/',
        students: '/SchoolManager/GetStudentBios/',
        academicYears: '/SchoolManager/GetAcademicYears/',
        classes: '/SchoolManager/GetLevelClasses/',
        terms: '/jsonDataSample/terms.json',
        schoolProfile: '/SchoolManager/GetSchoolProfile/',

        // TODO: swap for the real SharedResource routes once known
        currencies: '/SharedResource/GetCurrencies',
        banks: '/SharedResource/GetBanks',
        glAccounts: '/Ap/InitJournalEntry'
    };

    /* ==============================================================
     * Payment method enum — align with the backend enum values.
     * ============================================================== */
    const PAYMENT_METHODS = [
        { id: 1, name: 'Cash' },
        { id: 2, name: 'Cheque' },
        { id: 3, name: 'Bank Transfer' },
        { id: 4, name: 'Mobile Money' }
    ];
    const CHEQUE_METHOD_ID = 2;

    /* ==============================================================
  * UPDATE / CANCEL RULES (SchPayment)
  *  - Cancel: posted and unposted payments can be canceled.
  *  - Update: processed and posted payments cannot be updated.
  *  - Canceled payments are never loaded / displayed.
  * ============================================================== */
    const RULES = {
        canUpdate: payment =>
            Boolean(payment) &&
            !parseBool(payment.isCanceled) &&
            !parseBool(payment.isProcessed) &&
            !parseBool(payment.isPosted),

        canCancel: payment =>
            Boolean(payment) &&
            !parseBool(payment.isCanceled)
    };

    /**
     * Set to true once the API accepts an allocation list on CreateSchPayment.
     * The payment is automatically spread across ALL open student bills, and the
     * resulting per-bill breakdown is sent as `studentBillAllocations` when this flag is on.
     */
    const SEND_BILL_ALLOCATIONS = false;

    /* ---------------- small helpers ---------------- */
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

    /** Full ISO timestamp for C# DateTime properties. */
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
                classId: val(s, 'classId') || val(s, 'classID') || null,
                legalGuardianId: asGuid(val(s, 'legalGuardianId'))
            };
        })
        .filter(s => s.id != null && s.fullName !== '')
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const normalizeStudentBill = r => ({
        id: val(r, 'id'),
        studentId: asGuid(val(r, 'studentId')),
        billId: asGuid(val(r, 'billId')),
        billNumber: String(val(r, 'billNumber') || ''),
        academicYearId: asGuid(val(r, 'academicYearId')),
        termId: asGuid(val(r, 'termId')),
        classId: asGuid(val(r, 'classId')),
        billDate: loadedDate(val(r, 'billDate')),
        amount: asNumber(val(r, 'amount')),
        amountPaid: asNumber(val(r, 'amountPaid')),
        balanceDue: asNumber(val(r, 'balanceDue')),
        isCanceled: parseBool(val(r, 'isCanceled') || val(r, 'isCancelled'))
    });

    /**
     * Default modal form.
     * `openBills` is a snapshot of the student's open bills taken when the student
     * is picked — the payment is spread across all of them automatically.
     */
    const emptyPaymentForm = () => ({
        id: null,
        tenantId: 0,
        // links
        academicYearId: '',
        termId: '',
        classId: '',
        studentId: '',
        openBills: [],
        // dates & money
        paymentDate: isoDate(new Date()),
        amountDue: 0,
        amountToPaid: 0,
        // payment meta
        paymentMethod: 1,
        referenceNumber: '',
        batchNumber: '',
        receiptNumber: '',
        currencyId: '',
        buyRate: 1,
        isMultiCurrency: false,
        // bank
        bankGlId: EMPTY_GUID,
        bankId: '',
        bankBranchId: '',
        chequeNumber: '',
        chequeDate: '',
        // gl (kept from the existing record on update)
        creditGlId: EMPTY_GUID,
        debitGlId: EMPTY_GUID,
        journalId: EMPTY_GUID,
        // misc
        description: '',
        legalGuardianId: EMPTY_GUID,
        byLegalGuardian: false,
        isPosted: false,
        isProcessed: false,
        isCanceled: false,
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

                // Lookups
                academicYears: [],
                terms: [],
                classes: [],
                allStudents: [],
                currencies: [],
                banks: [],
                glAccounts: [],

                // Local (school) currency
                localCurrencyId: '',
                localCurrencyCode: '',
                localCurrencyName: '',
                localCurrencyMinor: '',

                // Collections
                payments: [],
                studentBills: [],

                // Modal state
                paymentModalOpen: false,
                editMode: false,
                form: emptyPaymentForm()
            };
        },

        computed: {
            /* ================= grid ================= */
            paymentColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false },
                    { key: 'receiptNumber', label: 'Receipt No.', type: 'text', width: 160, searchable: true, editable: false },
                    { key: 'paymentDate', label: 'Payment Date', type: 'date', width: 140, searchable: true, editable: false },
                    {
                        // resolved from student bios (lastName firstName otherName)
                        key: 'studentName',
                        label: 'Student',
                        type: 'text',
                        width: 240,
                        searchable: true,
                        editable: false
                    },
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
                        width: 130,
                        options: this.terms,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    { key: 'amountDue', label: 'Amount Due', type: 'number', decimals: 2, width: 130, editable: false },
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
                    { key: 'referenceNumber', label: 'Reference', type: 'text', width: 150, searchable: true, editable: false },
                    { key: 'isProcessed', label: 'Processed?', type: 'boolean', width: 110, editable: false },
                    { key: 'isPosted', label: 'Posted?', type: 'boolean', width: 100, editable: false }
                    // 'isCanceled' is intentionally not shown: canceled payments are never loaded.
                ];
            },

            /* ================= student picker ================= */
            /**
             * One option per student that appears in the Student Bills collection.
             * Every billed student is listed (settled ones show "Owing 0.00") so a
             * prepayment / credit can also be captured.
             */
            studentOptions() {
                const groups = new Map();

                (this.studentBills || []).forEach(sb => {
                    if (parseBool(sb.isCanceled)) return;
                    if (!sb.studentId || sb.studentId === EMPTY_GUID) return;

                    const key = String(sb.studentId).toLowerCase();
                    const student = this.getStudentById(sb.studentId);

                    if (!groups.has(key)) {
                        groups.set(key, {
                            id: sb.studentId,
                            studentId: sb.studentId,
                            fullName: student ? student.fullName : `Unknown Student (${sb.studentId.substring(0, 8)}…)`,
                            identifier: student ? student.identifier : '',
                            classId: sb.classId,
                            className: this.getClassName(sb.classId),
                            bills: [],
                            openBillsCount: 0,
                            outstanding: 0
                        });
                    }

                    const group = groups.get(key);
                    group.bills.push(sb);
                    const bal = asNumber(sb.balanceDue);
                    group.outstanding += bal;
                    if (bal > 0.009) group.openBillsCount += 1;
                    if (!group.classId && sb.classId) {
                        group.classId = sb.classId;
                        group.className = this.getClassName(sb.classId);
                    }
                });

                return [...groups.values()]
                    .map(g => ({
                        ...g,
                        name: `${g.identifier ? g.identifier + ' - ' : ''}${g.fullName}` +
                            (g.openBillsCount > 1 ? ` (${g.openBillsCount} bills)` : '') +
                            ` · Owing ${this.formatMoney(g.outstanding)}`
                    }))
                    .sort((a, b) => a.fullName.localeCompare(b.fullName));
            },

            /** Snapshot of the open bills of the selected student (oldest first). */
            openBillsList() {
                return Array.isArray(this.form.openBills) ? this.form.openBills : [];
            },

            /**
             * Automatic allocation: the payment (converted to the local currency) is
             * applied to the student's open bills oldest-first until it is exhausted.
             * Paying 500 against bills of 300 + 200 settles both.
             */
            allocationPlan() {
                let remaining = this.amountPaidInLocalCurrency;

                return this.openBillsList.map(bill => {
                    const balance = asNumber(bill.balanceDue);
                    const applied = remaining > 0.009 ? Math.min(balance, remaining) : 0;
                    remaining = Number((remaining - applied).toFixed(2));

                    return {
                        id: bill.id,
                        billNumber: bill.billNumber,
                        billDate: bill.billDate,
                        yearName: this.getYearName(bill.academicYearId),
                        termName: this.getTermName(bill.termId),
                        balance,
                        applied: Number(applied.toFixed(2)),
                        remaining: Number((balance - applied).toFixed(2)),
                        settled: balance - applied <= 0.009
                    };
                });
            },

            /** Total applied to bills, in local currency. */
            allocatedTotal() {
                return Number(this.allocationPlan.reduce((sum, r) => sum + r.applied, 0).toFixed(2));
            },

            /** Total amount that is still owed across all of the student's open bills. */
            outstandingBefore() {
                return Number(this.openBillsList.reduce((sum, b) => sum + asNumber(b.balanceDue), 0).toFixed(2));
            },

            /** Part of the payment that could not be applied to a bill → becomes a credit. */
            creditAmount() {
                return Math.max(0, Number((this.amountPaidInLocalCurrency - this.allocatedTotal).toFixed(2)));
            },

            hasOpenBills() {
                return this.openBillsList.length > 0;
            },

            isCheque() {
                return Number(this.form.paymentMethod) === CHEQUE_METHOD_ID;
            },

            /** Payment method requires bank details. */
            requiresBank() {
                return Number(this.form.paymentMethod) !== 1; // anything other than cash
            },

            selectedCurrency() {
                return this.currencies.find(c => sameId(c.id, this.form.currencyId)) || null;
            },

            /** The school's own currency (from the school profile). */
            localCurrency() {
                return this.currencies.find(c => sameId(c.id, this.localCurrencyId)) || null;
            },

            /** ISO code shown next to every amount, e.g. GHS / NGN / USD. */
            currencyCode() {
                return this.localCurrencyCode || 'GHS';
            },

            /** Code of the currency the payment is being made in. */
            paymentCurrencyCode() {
                const c = this.selectedCurrency;
                return (c && (c.currencyCode || c.currencyName)) || this.currencyCode;
            },

            /**
             * Multi-currency === the payment currency is NOT the school's local currency.
             * Derived on every render, so it can never drift out of sync.
             */
            isPaymentMultiCurrency() {
                if (!this.form.currencyId) return false;
                if (!this.localCurrencyId) return false;
                return !sameId(this.form.currencyId, this.localCurrencyId);
            },

            /** Rate used to convert the payment amount into the local currency. */
            effectiveRate() {
                if (!this.isPaymentMultiCurrency) return 1;
                const rate = asNumber(this.form.buyRate, 0);
                return rate > 0 ? rate : 1;
            },

            amountPaidInPaymentCurrency() {
                return asNumber(this.form.amountToPaid);
            },

            amountPaidInLocalCurrency() {
                return Number((this.amountPaidInPaymentCurrency * this.effectiveRate).toFixed(2));
            },

            outstandingInLocalCurrency() {
                return this.outstandingBefore;
            },

            /** Outstanding balance expressed in the payment currency. */
            outstandingInPaymentCurrency() {
                const rate = this.effectiveRate;
                return rate > 0 ? Number((this.outstandingBefore / rate).toFixed(2)) : this.outstandingBefore;
            },

            /** Remaining balance after this payment — in local currency. */
            balanceAfterLocal() {
                const remaining = this.outstandingBefore - this.allocatedTotal;
                return Math.max(0, Number(remaining.toFixed(2)));
            },

            /** Remaining balance after this payment — in the payment currency. */
            balanceAfterPaymentCurrency() {
                const rate = this.effectiveRate;
                const remaining = this.outstandingInPaymentCurrency - this.amountPaidInPaymentCurrency;
                return Math.max(0, Number(remaining.toFixed(2)));
            },

            /** True when the payment leaves money unapplied (a credit). */
            hasCredit() {
                return this.creditAmount > 0.009;
            },

            /** Branches of the selected bank. */
            bankBranchChoices() {
                const bank = this.banks.find(b => sameId(b.id, this.form.bankId));
                return bank ? (bank.bankBranches || []) : [];
            },

            canSave() {
                if (this.saving) return false;
                if (this.editMode && this.form.isLocked) return false;
                return true;
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
                return emptyPaymentForm();
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

            /** Money in the school's LOCAL currency. */
            formatMoney(v, code = null) {
                const n = asNumber(v);
                const currency = code || this.currencyCode;
                return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            },

            /** Money in the currency of the payment being captured. */
            formatPaymentMoney(v) {
                return this.formatMoney(v, this.paymentCurrencyCode);
            },

            /** "≈ GHS 1,200.00" style label for converted amounts. */
            formatConverted(v) {
                return `≈ ${this.formatMoney(v)}`;
            },

            /* ================= lookups / name resolution ================= */
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

            getPaymentMethodName(id) {
                const m = PAYMENT_METHODS.find(x => Number(x.id) === Number(id));
                return m ? m.name : '';
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

            /**
             * Read-only in the modal only when the payment cannot be updated.
             * Posted / processed payments stay editable per business rules.
             */
            isPaymentLocked(payment) {
                if (!payment) return false;
                return !RULES.canUpdate(payment);
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
                        console.warn(`Optional lookup "${label}" is not available yet (${url}).`);
                    }
                    return [];
                }
            },

            normalizePayment(r) {
                const studentId = asGuid(val(r, 'studentId'));
                return {
                    id: val(r, 'id'),
                    tenantId: Number(val(r, 'tenantId')) || 0,
                    academicYearId: asGuid(val(r, 'academicYearId')),
                    termId: asGuid(val(r, 'termId')),
                    classId: asGuid(val(r, 'classId')),
                    studentId,
                    studentName: this.getStudentName(studentId),
                    paymentDate: loadedDate(val(r, 'paymentDate')),
                    amountDue: asNumber(val(r, 'amountDue')),
                    amountToPaid: asNumber(val(r, 'amountToPaid')),
                    balance: asNumber(val(r, 'balance')),
                    paymentMethod: Number(val(r, 'paymentMethod')) || 1,
                    referenceNumber: asText(val(r, 'referenceNumber')),
                    batchNumber: asText(val(r, 'batchNumber')),
                    currencyId: asGuid(val(r, 'currencyId')),
                    buyRate: asNumber(val(r, 'buyRate'), 1),
                    bankGlId: asGuid(val(r, 'bankGlId')),
                    bankId: asGuid(val(r, 'bankId')),
                    bankBranchId: asGuid(val(r, 'bankBranchId')),
                    chequeNumber: asText(val(r, 'chequeNumber')),
                    chequeDate: loadedDate(val(r, 'chequeDate')),
                    description: asText(val(r, 'description')),
                    isPosted: parseBool(val(r, 'isPosted')),
                    isCanceled: parseBool(val(r, 'isCanceled')),
                    canceledBy: asText(val(r, 'canceledBy')),
                    canceledDate: loadedDate(val(r, 'canceledDate')),
                    receiptNumber: asText(val(r, 'receiptNumber')),
                    isProcessed: parseBool(val(r, 'isProcessed')),
                    legalGuardianId: asGuid(val(r, 'legalGuardianId')),
                    byLegalGuardian: parseBool(val(r, 'byLegalGuardian')),
                    creditGlId: asGuid(val(r, 'creditGlId')),
                    debitGlId: asGuid(val(r, 'debitGlId')),
                    journalId: asGuid(val(r, 'journalId')),
                    isMultiCurrency: parseBool(val(r, 'isMultiCurrency'))
                };
            },

            hydrateStudentNames() {
                (this.payments || []).forEach(p => {
                    const name = this.getStudentName(p.studentId);
                    if (name) p.studentName = name;
                });
            },

            async loadPayments() {
                this.isShimmerLoading = true;
                try {
                    const raw = await this.fetchList(ENDPOINTS.payments, 'student payments', 'schPayments');
                    // Only non-canceled data — canceled payments are not displayed at all.
                    this.payments = raw
                        .filter(r => !parseBool(val(r, 'isCanceled')))
                        .map(r => this.normalizePayment(r));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async loadStudentBills() {
                const raw = await this.fetchList(ENDPOINTS.studentBills, 'student bills', 'studentBills');
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

                // ---- local currency comes from the school profile ----
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
                await Promise.all([this.loadPayments(), this.loadStudentBills()]);
                this.hydrateStudentNames();
            },

            /* ================= grid selection helpers ================= */
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

            /* ================= numbering ================= */
            generateReceiptNumber() {
                const d = new Date();
                const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
                const seq = String(Math.floor(100000 + Math.random() * 900000));
                return `RCP-${ymd}-${seq}`;
            },

            generateBatchNumber() {
                return `B-${Math.floor(100000 + Math.random() * 900000)}`;
            },

            /* ================= open bills snapshot ================= */
            /** Builds the open-bill snapshot used for the automatic allocation. */
            buildOpenBillsFor(studentId, extraAmount = 0) {
                const bills = (this.studentBills || [])
                    .filter(sb => !parseBool(sb.isCanceled) && sameId(sb.studentId, studentId))
                    .filter(sb => asNumber(sb.balanceDue) > 0.009)
                    .sort((a, b) => new Date(a.billDate || 0) - new Date(b.billDate || 0));

                const snapshot = bills.map(sb => ({
                    id: sb.id,
                    billId: sb.billId,
                    billNumber: sb.billNumber,
                    billDate: sb.billDate,
                    academicYearId: sb.academicYearId,
                    termId: sb.termId,
                    classId: sb.classId,
                    amount: sb.amount,
                    balanceDue: asNumber(sb.balanceDue)
                }));

                // On edit, the money already applied by this payment is not reflected
                // in the bills anymore — put it back on the oldest bill so the numbers add up.
                if (extraAmount > 0.009) {
                    if (!snapshot.length) {
                        snapshot.push({
                            id: '',
                            billId: EMPTY_GUID,
                            billNumber: '—',
                            billDate: '',
                            academicYearId: this.form.academicYearId,
                            termId: this.form.termId,
                            classId: this.form.classId,
                            amount: 0,
                            balanceDue: extraAmount
                        });
                    } else {
                        snapshot[0].balanceDue = Number((snapshot[0].balanceDue + extraAmount).toFixed(2));
                    }
                }

                return snapshot;
            },

            /* ================= modal workflow ================= */
            openPaymentModal(payment = null) {
                this.editMode = Boolean(payment && payment.id);

                if (this.editMode) {
                    const alreadyApplied = Number(
                        (asNumber(payment.amountToPaid) * (asNumber(payment.buyRate, 1) || 1)).toFixed(2)
                    );

                    this.form = {
                        ...this.emptyForm(),
                        id: payment.id,
                        tenantId: Number(payment.tenantId) || 0,
                        academicYearId: payment.academicYearId,
                        termId: payment.termId,
                        classId: payment.classId,
                        studentId: payment.studentId,
                        openBills: [],
                        paymentDate: payment.paymentDate || isoDate(new Date()),
                        amountDue: asNumber(payment.amountDue),
                        amountToPaid: asNumber(payment.amountToPaid),
                        paymentMethod: Number(payment.paymentMethod) || 1,
                        referenceNumber: payment.referenceNumber || '',
                        batchNumber: payment.batchNumber || this.generateBatchNumber(),
                        receiptNumber: payment.receiptNumber || this.generateReceiptNumber(),
                        currencyId: payment.currencyId,
                        buyRate: asNumber(payment.buyRate, 1) || 1,
                        isMultiCurrency: parseBool(payment.isMultiCurrency),
                        bankGlId: payment.bankGlId || EMPTY_GUID,
                        bankId: payment.bankId !== EMPTY_GUID ? payment.bankId : '',
                        bankBranchId: payment.bankBranchId !== EMPTY_GUID ? payment.bankBranchId : '',
                        chequeNumber: payment.chequeNumber || '',
                        chequeDate: payment.chequeDate || '',
                        creditGlId: payment.creditGlId || EMPTY_GUID,
                        debitGlId: payment.debitGlId || EMPTY_GUID,
                        journalId: payment.journalId || EMPTY_GUID,
                        description: payment.description || '',
                        legalGuardianId: payment.legalGuardianId || EMPTY_GUID,
                        byLegalGuardian: parseBool(payment.byLegalGuardian),
                        isPosted: parseBool(payment.isPosted),
                        isProcessed: parseBool(payment.isProcessed),
                        isCanceled: parseBool(payment.isCanceled),
                        isLocked: this.isPaymentLocked(payment)
                    };

                    // Same automatic allocation, but without double counting this payment
                    this.form.openBills = this.buildOpenBillsFor(payment.studentId, alreadyApplied);

                    const loadedCurrency = this.selectedCurrency;
                    if (loadedCurrency && sameId(loadedCurrency.id, this.localCurrencyId)) {
                        this.form.buyRate = 1;
                    }
                    this.syncMultiCurrencyFlag();
                } else {
                    // New payments default to the school's LOCAL currency.
                    const defaultCurrency =
                        this.currencies.find(c => sameId(c.id, this.localCurrencyId)) ||
                        this.currencies.find(c => c.isDefault) ||
                        this.currencies[0] ||
                        null;

                    this.form = {
                        ...this.emptyForm(),
                        paymentDate: isoDate(new Date()),
                        receiptNumber: this.generateReceiptNumber(),
                        batchNumber: this.generateBatchNumber(),
                        paymentMethod: 1,
                        currencyId: defaultCurrency ? defaultCurrency.id : '',
                        buyRate: defaultCurrency && !sameId(defaultCurrency.id, this.localCurrencyId)
                            ? asNumber(defaultCurrency.buyRate, 1) || 1
                            : 1,
                        isMultiCurrency: defaultCurrency
                            ? !!this.localCurrencyId && !sameId(defaultCurrency.id, this.localCurrencyId)
                            : false,
                        academicYearId: this.academicYears.length ? this.academicYears[0].id : '',
                        termId: this.terms.length ? this.terms[0].id : ''
                    };
                }

                this.paymentModalOpen = true;
            },

            closePaymentModal() {
                this.paymentModalOpen = false;
                this.editMode = false;
                this.form = this.emptyForm();
            },

            editSelectedPayment() {
                const selected = this.getGridSelectedRows('paymentsGrid', this.payments);
                if (!selected.length) return this.toastHandler('warning', 'Please select a payment to edit.');
                if (selected.length > 1) return this.toastHandler('warning', 'Please select only one payment to edit at a time.');

                const payment = selected[0];
                // Processed and posted payments may be updated; canceled ones are never listed.
                if (!RULES.canUpdate(payment)) {
                    return this.toastHandler('warning', 'This payment can no longer be updated.');
                }

                this.openPaymentModal(payment);
            },

            /* ================= selection driven amounts ================= */
            onStudentChanged() {
                if (this.editMode) return;

                this.form.amountDue = 0;
                this.form.amountToPaid = 0;

                const student = this.getStudentById(this.form.studentId);
                if (student) {
                    this.form.legalGuardianId = student.legalGuardianId || EMPTY_GUID;
                }

                // Snapshot every open bill — no per-bill picking any more.
                this.form.openBills = this.buildOpenBillsFor(this.form.studentId);

                const first = this.form.openBills[0];
                if (first) {
                    this.form.academicYearId = first.academicYearId || this.form.academicYearId;
                    this.form.termId = first.termId || this.form.termId;
                    this.form.classId = first.classId || this.form.classId;
                } else if (student && student.classId) {
                    this.form.classId = student.classId;
                }

                this.form.amountDue = this.outstandingBefore;

                // Prefill with the full outstanding amount, in the payment currency
                if (this.outstandingBefore > 0.009) {
                    this.form.amountToPaid = this.outstandingInPaymentCurrency;
                }

                if (this.form.openBills.length > 1) {
                    this.toastHandler('success', `${this.form.openBills.length} open bills found — the payment will be applied oldest first.`);
                }
            },

            /** Fill the amount with the full outstanding balance (in the payment currency). */
            payFullBalance() {
                this.form.amountToPaid = this.outstandingInPaymentCurrency;
            },

            onPaymentMethodChanged() {
                if (!this.isCheque) {
                    this.form.chequeNumber = '';
                    this.form.chequeDate = '';
                } else if (!this.form.chequeDate) {
                    this.form.chequeDate = this.form.paymentDate || isoDate(new Date());
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
                    this.form.buyRate = 1;
                    this.syncMultiCurrencyFlag();
                    return;
                }

                const isLocal = sameId(currency.id, this.localCurrencyId);
                this.form.buyRate = isLocal ? 1 : asNumber(currency.buyRate, 1) || 1;
                this.syncMultiCurrencyFlag();
            },

            syncMultiCurrencyFlag() {
                this.form.isMultiCurrency = this.isPaymentMultiCurrency;
                return this.form.isMultiCurrency;
            },

            applyLocalCurrencyToForm() {
                if (!this.localCurrencyId) return;
                if (!this.form.currencyId) {
                    this.form.currencyId = this.localCurrencyId;
                    this.form.buyRate = 1;
                }
                this.syncMultiCurrencyFlag();
            },

            regenerateReceiptNumber() {
                this.form.receiptNumber = this.generateReceiptNumber();
            },

            /* ================= payload ================= */
            buildPayload() {
                const f = this.form;

                const payload = {
                    academicYearId: asGuid(f.academicYearId),
                    termId: asGuid(f.termId),
                    classId: asGuid(f.classId),
                    studentId: asGuid(f.studentId),
                    paymentDate: toApiDate(f.paymentDate),
                    amountDue: asNumber(f.amountDue),
                    amountToPaid: asNumber(f.amountToPaid),
                    // SchPayment amounts are in the school's local currency
                    balance: this.balanceAfterLocal,
                    paymentMethod: Number(f.paymentMethod) || 1,
                    referenceNumber: asText(f.referenceNumber),
                    batchNumber: asText(f.batchNumber),
                    currencyId: asGuid(f.currencyId),
                    buyRate: asNumber(f.buyRate, 1),
                    bankGlId: asGuid(f.bankGlId),
                    bankId: this.requiresBank ? asGuid(f.bankId) : EMPTY_GUID,
                    bankBranchId: this.requiresBank ? asGuid(f.bankBranchId) : EMPTY_GUID,
                    chequeNumber: this.isCheque ? asText(f.chequeNumber) : '',
                    chequeDate: this.isCheque ? toApiDate(f.chequeDate) : DEFAULT_DATE_TIME,
                    description: asText(f.description),
                    isPosted: parseBool(f.isPosted),
                    isCanceled: false,
                    receiptNumber: asText(f.receiptNumber),
                    isProcessed: parseBool(f.isProcessed),
                    legalGuardianId: asGuid(f.legalGuardianId),
                    byLegalGuardian: parseBool(f.byLegalGuardian),
                    creditGlId: asGuid(f.creditGlId),
                    debitGlId: asGuid(f.debitGlId),
                    journalId: asGuid(f.journalId),
                    isMultiCurrency: this.isPaymentMultiCurrency
                };

                // Optional per-bill breakdown (off until the API supports it)
                if (SEND_BILL_ALLOCATIONS) {
                    payload.studentBillAllocations = this.allocationPlan
                        .filter(r => r.applied > 0.009)
                        .map(r => ({ studentBillId: asGuid(r.id), amount: r.applied }));
                }

                // TenantId is sent on UPDATE only
                if (f.id) {
                    payload.id = f.id;
                    payload.tenantId = Number(f.tenantId) || 0;
                }

                return payload;
            },

            validateBeforeSave() {
                const f = this.form;

                if (!f.studentId) return 'Please select a student.';
                if (!f.paymentDate) return 'Please choose the payment date.';

                const amount = asNumber(f.amountToPaid);
                if (!(amount > 0)) return 'Amount to pay must be greater than zero.';
                if (this.isPaymentMultiCurrency && !(asNumber(f.buyRate, 0) > 0)) {
                    return 'Please enter a valid exchange rate for the selected currency.';
                }
                if (this.isCheque && !String(f.chequeNumber || '').trim()) {
                    return 'Cheque number is required for cheque payments.';
                }
                if (!String(f.receiptNumber || '').trim()) return 'Receipt number could not be generated. Please retry.';

                // Overpayment is allowed — the excess becomes a credit memo.
                return '';
            },

            async savePayment() {
                if (this.saving) return;

                const error = this.validateBeforeSave();
                if (error) return this.toastHandler('warning', error);

                if (this.editMode && this.form.isLocked) {
                    return this.toastHandler('warning', 'Posted or processed payments cannot be updated.');
                }

                const studentName = this.getStudentDisplayName(this.form.studentId);
                const credit = this.creditAmount;
                const creditNote = credit > 0.009
                    ? `<div class="mt-2 text-xs text-amber-600">${this.formatMoney(credit)} cannot be applied to a bill and will be recorded as a credit.</div>`
                    : '';

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'question',
                        title: this.editMode ? 'Update Payment?' : 'Record Payment?',
                        html:
                            `<div class="text-sm text-left">` +
                            `<div>${this.isPaymentMultiCurrency
                                ? `${this.formatPaymentMoney(this.form.amountToPaid)} (≈ ${this.formatMoney(this.amountPaidInLocalCurrency)})`
                                : this.formatMoney(this.form.amountToPaid)} from <b>${studentName}</b>.</div>` +
                            `<div class="mt-1">Receipt <b>${this.form.receiptNumber}</b></div>` +
                            (this.hasOpenBills
                                ? `<div class="mt-1 text-xs text-gray-500">Applied to ${this.allocationPlan.filter(r => r.applied > 0.009).length} bill(s): ${this.formatMoney(this.allocatedTotal)}</div>`
                                : `<div class="mt-1 text-xs text-gray-500">No open bills for this student.</div>`) +
                            creditNote +
                            `</div>`,
                        showCancelButton: true,
                        confirmButtonText: this.editMode ? 'Yes, update' : 'Yes, save',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#059669',
                        cancelButtonColor: '#64748b'
                    });
                    if (!result.isConfirmed) return;
                }

                this.saving = true;
                const payload = this.buildPayload();
                const endpoint = this.editMode ? ENDPOINTS.updatePayment : ENDPOINTS.createPayment;

                try {
                    const res = await axios.post(endpoint, payload);
                    const result = res.data?.result || res.data;

                    if (res.data?.success === false || (result?.code && Number(result.code) !== 200)) {
                        this.toastHandler('error', result?.message || res.data?.error?.message || 'Failed to save the student payment.');
                        return;
                    }

                    this.toastHandler('success', this.editMode ? 'Student payment updated successfully.' : 'Student payment recorded successfully.');
                    this.closePaymentModal();
                    await this.refreshAll();

                    // ---- outstanding credit → offer a credit memo ----
                    if (credit > 0.009) {
                        await this.offerCreditMemo(credit, studentName);
                    }
                } catch (err) {
                    console.error('Save student payment failed:', err);
                    this.toastHandler('error', err.response?.data?.message || 'Failed to save the student payment.');
                } finally {
                    this.saving = false;
                }
            },

            /* ================= credit memo (overpayment) ================= */
            async offerCreditMemo(creditAmount, studentName) {
                if (typeof Swal === 'undefined') return;

                const result = await Swal.fire({
                    icon: 'warning',
                    title: 'Outstanding Credit',
                    html: `<div class="text-sm text-left">
                             <div>${this.formatMoney(creditAmount)} paid by <b>${studentName}</b> could not be applied to any bill.</div>
                             <div class="mt-2">Do you want to create a credit memo for this amount?</div>
                           </div>`,
                    showCancelButton: true,
                    confirmButtonText: 'Yes, create credit memo',
                    cancelButtonText: 'No, skip',
                    confirmButtonColor: '#4f46e5',
                    cancelButtonColor: '#64748b',
                    reverseButtons: true
                });

                if (!result.isConfirmed) {
                    this.toastHandler('warning', `Credit of ${this.formatMoney(creditAmount)} was not recorded. You can create a credit memo from the Credit Memos page.`);
                    return;
                }

                await this.createCreditMemo(creditAmount);
            },

            /**
             * Creates a SchCreditMemo for the unapplied amount.
             * The memo is always held in the school's local currency.
             */
            async createCreditMemo(creditAmount) {
                const f = this.form;

                const memo = {
                    academicYearId: asGuid(f.academicYearId),
                    termId: asGuid(f.termId),
                    classId: asGuid(f.classId),
                    studentId: asGuid(f.studentId),
                    date: toApiDate(f.paymentDate),
                    receiptNumber: asText(f.receiptNumber),
                    batchNumber: asText(f.batchNumber),
                    amountDue: asNumber(f.amountDue),
                    amountToCredit: asNumber(creditAmount),
                    description: `Credit from payment ${f.receiptNumber}` + (f.description ? ` — ${f.description}` : ''),
                    isPosted: false,
                    isCanceled: false,
                    canceledBy: '',
                    canceledDate: DEFAULT_DATE_TIME,
                    isProcessed: false,
                    currencyId: asGuid(this.localCurrencyId),
                    rate: 1,
                    bankId: this.requiresBank ? asGuid(f.bankId) : EMPTY_GUID,
                    bankBranchId: this.requiresBank ? asGuid(f.bankBranchId) : EMPTY_GUID,
                    chequeNumber: this.isCheque ? asText(f.chequeNumber) : '',
                    chequeDate: this.isCheque ? toApiDate(f.chequeDate) : DEFAULT_DATE_TIME,
                    paymentMethod: Number(f.paymentMethod) || 1,
                    creditGlId: asGuid(f.creditGlId),
                    debitGlId: asGuid(f.debitGlId),
                    isMultiCurrency: false,
                    journalId: asGuid(f.journalId)
                };

                try {
                    const res = await axios.post(ENDPOINTS.createCreditMemo, memo);
                    const result = res.data?.result || res.data;

                    if (res.data?.success === false || (result?.code && Number(result.code) !== 200)) {
                        this.toastHandler('error', result?.message || res.data?.error?.message || 'Failed to create the credit memo.');
                        return;
                    }

                    this.toastHandler('success', `Credit memo for ${this.formatMoney(creditAmount)} created.`);
                } catch (err) {
                    console.error('Create credit memo failed:', err);
                    this.toastHandler('error', err.response?.data?.message || 'Failed to create the credit memo.');
                }
            },

            /* ==========================================================
             * Batch operations
             * ----------------------------------------------------------
             * Rows are read straight off the grid: grid.selectedRows().
             * Cancel works for posted AND unposted payments.
             * ========================================================== */
            async cancelSelectedPayments() {
                const grid = this.$refs.paymentsGrid;
                const selected = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];
                if (!selected.length) { this.toastHandler('warning', 'Select one or more payments to cancel.'); return; }

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'warning', title: 'Confirm Cancellation',
                        text: `Are you sure you want to cancel ${selected.length} selected payments${selected.length === 1 ? '' : 's'}?`,
                        showCancelButton: true, confirmButtonText: 'Yes, cancel', cancelButtonText: 'No, go back',
                        confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b', reverseButtons: true
                    });
                    if (!result.isConfirmed) return;
                }

                this.busy = true;
                this.isShimmerLoading = true;
                try {
                    const paymentIds = selected.map(payment => payment.id);
                    const res = await axios.post(ENDPOINTS.cancelPayments, paymentIds);
                    if (res.data && res.data.success === false) {
                        this.toastHandler('error', res.data.message || 'Unable to cancel selected payments.');
                        return;
                    }
                    if (grid.clearSelection) grid.clearSelection();
                    this.toastHandler('success', 'Canceled successfully.');

                    await this.refreshAll();
                } catch (error) {
                    console.error('Payments cancellation failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to cancel payment(s).');
                } finally {
                    this.busy = false;
                    this.isShimmerLoading = false;
                }
            },

            async processSelectedPayments() {
                const grid = this.$refs.paymentsGrid;
                const selected = grid && typeof grid.selectedRows === 'function' ? grid.selectedRows() : [];
                if (!selected.length) { this.toastHandler('warning', 'Select one or more payments to process.'); return; }

                const processable = selected.filter(p => !parseBool(p.isCanceled));
                if (!processable.length) return this.toastHandler('warning', 'All selected payments have already been canceled.');

                const alreadyProcessed = processable.filter(p => parseBool(p.isProcessed) || parseBool(p.isPosted));
                const toProcess = processable.filter(p => !parseBool(p.isProcessed) && !parseBool(p.isPosted));

                if (!toProcess.length) {
                    return this.toastHandler('warning', 'All selected payments have already been processed/posted.');
                }

                if (typeof Swal !== 'undefined') {
                    const skipped = alreadyProcessed.length;
                    const result = await Swal.fire({
                        icon: 'question',
                        title: 'Process Payments?',
                        text: `Process ${toProcess.length} payment(s)?${skipped ? ` ${skipped} already processed payment(s) will be skipped.` : ''}`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, process',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#4f46e5',
                        cancelButtonColor: '#64748b'
                    });
                    if (!result.isConfirmed) return;
                }

                this.busy = true;
                this.isShimmerLoading = true;
                try {
                    // only the rows that are not processed/posted yet
                    const paymentIds = toProcess.map(payment => payment.id);
                    const res = await axios.post(ENDPOINTS.processPayments, paymentIds);
                    if (res.data && res.data.success === false) {
                        this.toastHandler('error', res.data.message || 'Unable to process selected payments.');
                        return;
                    }
                    if (grid.clearSelection) grid.clearSelection();
                    this.toastHandler('success', `Processed ${paymentIds.length} payment(s).`);

                    await this.refreshAll();
                } catch (error) {
                    console.error('Payments processing failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to process payment(s).');
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
                this.applyLocalCurrencyToForm();
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
