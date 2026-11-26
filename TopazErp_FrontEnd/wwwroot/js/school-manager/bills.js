(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

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

    /** Single source of truth for how a student's name is displayed. */
    const buildStudentFullName = (lastName, firstName, otherName) =>
        [lastName, firstName, otherName]
            .map(p => String(p || '').trim())
            .filter(Boolean)
            .join(' ');

    const generateUuid = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
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
            levelId: val(c, 'levelId') || EMPTY_GUID,
            levelName: val(c, 'levelName') || ''
        }))
        .filter(c => c.id != null && (c.name !== '' || c.className !== ''))
        .sort((a, b) => a.name.localeCompare(b.name));

    /*
     * Student bios are the ONLY source of student names.
     * Name is always built as: lastName firstName otherName
     */
    const normalizeStudents = list => (list || [])
        .map(s => {
            const id = val(s, 'id') || val(s, 'studentId') || val(s, 'studentID');
            const firstName = String(val(s, 'firstName') || '').trim();
            const lastName = String(val(s, 'lastName') || '').trim();
            const otherName = String(val(s, 'otherName') || '').trim();
            const fullName = buildStudentFullName(lastName, firstName, otherName);
            const identifier = String(val(s, 'studentIdentifier') || val(s, 'identifier') || val(s, 'admissionNumber') || '').trim();
            const classId = val(s, 'classId') || val(s, 'classID') || null;
            const className = val(s, 'className') || '';

            return {
                id,
                fullName,
                firstName,
                lastName,
                otherName,
                identifier,
                // Used by pickers / other screens: "Name (ADM-001)"
                name: `${fullName}${identifier ? ' (' + identifier + ')' : ''}`,
                classId,
                className
            };
        })
        .filter(s => s.id != null && s.fullName !== '')
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const normalizeFeeItems = list => (list || [])
        .map(i => ({
            id: val(i, 'id'),
            name: val(i, 'name') || val(i, 'description') || val(i, 'itemName') || '',
            isFixed: parseBool(val(i, 'isFixed'))
        }))
        .filter(i => i.id != null && i.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const billTypes = [
        { id: 1, name: 'Standard' },
        { id: 2, name: 'Supplementary' },
        { id: 3, name: 'Boarding' }
    ];

    const app = Vue.createApp({
        data() {
            return {
                isShimmerLoading: false,
                saving: false,
                setupDone: false,
                theme: '#062a81',
                activeTab: 'bills', // 'bills' | 'studentBills'
                currency:'',
                // Reference lookups
                academicYears: [],
                terms: [],
                classes: [],
                allStudents: [],
                feeDescriptions: [],
                supplementaryItems: [],
                boardingItems: [],
                generalFeeSetups: [],
                boardingFeeSetups: [],
                billTypes,

                // Primary Collections
                bills: [],
                studentBills: [],

                // Modal state for Class Bill
                billModalOpen: false,
                isSupplementaryFixed: true,
                activeBill: {
                    id: null,
                    academicYearId: '',
                    termId: '',
                    classId: '',
                    levelId: EMPTY_GUID,
                    billNumber: '',
                    billDate: new Date().toISOString().substring(0, 10),
                    billingScopeId: 1,
                    isProcessed: false,
                    isPosted: false,
                    isCancelled: false,
                    billTypeId: 1,
                    batchNumber: '',
                    journalId: EMPTY_GUID,
                    tenantId: 0,
                    details: [],
                    students: [],
                    
                }
            };
        },

        computed: {
            processedBillsCount() {
                return this.bills.filter(b => b.isProcessed).length;
            },

            draftBillsCount() {
                return this.bills.filter(b => !b.isProcessed).length;
            },

            // Only Not Fixed Supplementary allows student discounts
            discountsAllowed() {
                return Number(this.activeBill.billTypeId) === 2 && !this.isSupplementaryFixed;
            },

            availableFeeItems() {
                const typeId = Number(this.activeBill.billTypeId);
                if (typeId === 2) {
                    // Filter Supplementary by isFixed
                    return this.supplementaryItems.filter(item => item.isFixed === this.isSupplementaryFixed);
                }
                if (typeId === 3) return this.boardingItems;
                return this.feeDescriptions;
            },

            totalBaseBillAmount() {
                if (!this.activeBill || !Array.isArray(this.activeBill.details)) return 0;
                return this.activeBill.details.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
            },

            totalStudentsBilledAmount() {
                if (!this.activeBill || !Array.isArray(this.activeBill.students)) return 0;
                return this.activeBill.students
                    .filter(s => s.toBeBilled)
                    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
            },

            billedStudentsCount() {
                if (!this.activeBill || !Array.isArray(this.activeBill.students)) return 0;
                return this.activeBill.students.filter(s => s.toBeBilled).length;
            },

            allStudentsSelected() {
                if (!this.activeBill.students || !this.activeBill.students.length) return false;
                return this.activeBill.students.every(s => s.toBeBilled);
            },

            billColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'billNumber', label: 'Bill Number', type: 'text', width: 150 },
                    {
                        key: 'billTypeId',
                        label: 'Bill Type',
                        type: 'select',
                        width: 140,
                        options: this.billTypes,
                        value: 'id',
                        display: 'name'
                    },
                    {
                        key: 'classId',
                        label: 'Class',
                        type: 'select',
                        required: true,
                        width: 180,
                        searchable: true,
                        options: this.classes,
                        value: 'id',
                        display: 'name'
                    },
                    {
                        key: 'academicYearId',
                        label: 'Academic Year',
                        type: 'select',
                        required: true,
                        width: 150,
                        options: this.academicYears,
                        value: 'id',
                        display: 'name'
                    },
                    {
                        key: 'termId',
                        label: 'Term',
                        type: 'select',
                        required: true,
                        width: 130,
                        options: this.terms,
                        value: 'id',
                        display: 'name'
                    },
                    {
                        key: 'billDate',
                        label: 'Bill Date',
                        type: 'date',
                        width: 130
                    },
                    {
                        /*
                         * Derived, read-only. NOT part of the API payload.
                         * = sum of `amount` for every student row where toBeBilled === true
                         * (see recomputeBillTotal / normalizeBill).
                         */
                        key: 'totalAmount',
                        label: 'Total Amount',
                        type: 'number',
                        decimals: 2,
                        editable: false,
                        width: 160
                    },
                    {
                        key: 'isProcessed',
                        label: 'Processed?',
                        type: 'boolean',
                        editable: false,
                        width: 110
                    },
                    {
                        key: 'isPosted',
                        label: 'Posted?',
                        type: 'boolean',
                        editable: false,
                        width: 100
                    },

                ];
            },

            detailSubgrid() {
                return {
                    key: 'details',
                    title: 'Bill Items Breakdown',
                    columns: [
                        { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                        {
                            key: 'feeItemId',
                            label: 'Fee Item',
                            type: 'select',
                            required: true,
                            width: 320,
                            options: [...this.feeDescriptions, ...this.supplementaryItems, ...this.boardingItems],
                            value: 'id',
                            display: 'name'
                        },
                        {
                            key: 'amount',
                            label: 'Amount (GHS)',
                            type: 'number',
                            required: true,
                            decimals: 2,
                            width: 180,
                            defaultValue: 0
                        }
                    ]
                };
            },

            studentBillColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'billNumber', label: 'Bill Number', type: 'text', width: 140 },
                    {
                        // Resolved client-side from allStudents (lastName firstName otherName).
                        // The student bill record only carries studentId.
                        key: 'studentName',
                        label: 'Student Name',
                        type: 'text',
                        width: 240,
                        searchable: true,
                        editable: false
                    },
                    {
                        key: 'classId',
                        label: 'Class',
                        type: 'select',
                        width: 180,
                        options: this.classes,
                        value: 'id',
                        display: 'name'
                    },
                    {
                        key: 'academicYearId',
                        label: 'Academic Year',
                        type: 'select',
                        width: 150,
                        options: this.academicYears,
                        value: 'id',
                        display: 'name'
                    },
                    {
                        key: 'termId',
                        label: 'Term',
                        type: 'select',
                        width: 130,
                        options: this.terms,
                        value: 'id',
                        display: 'name'
                    },
                    {
                        key: 'billDate',
                        label: 'Bill Date',
                        type: 'date',
                        width: 130
                    },
                    {
                        key: 'amount',
                        label: 'Billed Amount',
                        type: 'number',
                        decimals: 2,
                        width: 130
                    },
                    {
                        key: 'amountPaid',
                        label: 'Amount Paid',
                        type: 'number',
                        decimals: 2,
                        width: 130
                    },
                    {
                        key: 'balanceDue',
                        label: 'Balance Due',
                        type: 'number',
                        decimals: 2,
                        width: 130
                    },

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

            formatMoney(val) {
                const n = Number(val) || 0;
                return `GHS ${n.toFixed(2)}`;
            },

            getClassName(classId) {
                if (!classId) return '';
                const c = this.classes.find(x => this.sameId(x.id, classId));
                return c ? c.name : '';
            },

            getYearName(yearId) {
                if (!yearId) return '';
                const y = this.academicYears.find(x => this.sameId(x.id, yearId));
                return y ? y.name : '';
            },

            getTermName(termId) {
                if (!termId) return '';
                const t = this.terms.find(x => this.sameId(x.id, termId));
                return t ? t.name : '';
            },

            getBillTypeName(typeId) {
                const bt = this.billTypes.find(x => Number(x.id) === Number(typeId));
                return bt ? bt.name : 'Bill';
            },

            /** Student record lookup by id (from GetStudentBios). */
            getStudentById(studentId) {
                if (!studentId) return null;
                return this.allStudents.find(x => this.sameId(x.id, studentId)) || null;
            },

            /**
             * Resolve a student id to "lastName firstName otherName".
             * Returns '' when the student is not in the lookup (never a placeholder,
             * so the grid can fall back to something meaningful instead of "Student").
             */
            getStudentName(studentId) {
                const s = this.getStudentById(studentId);
                return s ? s.fullName : '';
            },

            getStudentDisplayName(studentId) {
                const name = this.getStudentName(studentId);
                if (name) return name;
                return isGuid(studentId) ? `Unknown Student (${String(studentId).substring(0, 8)}…)` : 'Unknown Student';
            },

            getLevelIdForClass(classId) {
                if (!classId) return EMPTY_GUID;
                const c = this.classes.find(x => this.sameId(x.id, classId));
                return c?.levelId || EMPTY_GUID;
            },

            /* ==========================================================
             * Totals
             * ========================================================== */

            /**
             * Total billed amount for a class bill = sum of the amounts of the
             * students that are actually billed. It is DERIVED, never sent or
             * read from the API.
             */
            sumBilledStudents(students) {
                if (!Array.isArray(students)) return 0;
                return students
                    .filter(s => parseBool(s.toBeBilled))
                    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
            },

            /** Re-derive bill.totalAmount from its student rows (in place). */
            recomputeBillTotal(bill) {
                if (!bill) return 0;
                bill.totalAmount = this.sumBilledStudents(bill.students);
                return bill.totalAmount;
            },

            /** Re-derive every bill total in the grid. */
            recomputeAllBillTotals() {
                (this.bills || []).forEach(b => this.recomputeBillTotal(b));
            },

            /**
             * Student bills only store studentId, so the name is filled from
             * allStudents. Called after both loads so names appear even when
             * student bios arrive after the bills.
             */
            hydrateStudentBillNames() {
                (this.studentBills || []).forEach(sb => {
                    const name = this.getStudentName(sb.studentId);
                    if (name) sb.studentName = name;
                });
            },

            /**
             * Check Existing Bill:
             * Checks existing records in client-side collection for duplicates (AcademicYear, Term, Class, BillType)
             */
            checkExistingBill({ academicYearId, termId, classId, billTypeId, excludeBillId = null }) {
                if (!this.bills || !this.bills.length) return null;

                const yKey = String(asGuid(academicYearId)).toLowerCase();
                const tKey = String(asGuid(termId)).toLowerCase();
                const cKey = String(asGuid(classId)).toLowerCase();
                const typeId = Number(billTypeId) || 1;

                if (yKey === EMPTY_GUID || tKey === EMPTY_GUID || cKey === EMPTY_GUID) {
                    return null;
                }

                return this.bills.find(b => {
                    if (excludeBillId && this.sameId(b.id, excludeBillId)) return false;
                    if (b.isCancelled) return false;

                    const bY = String(asGuid(b.academicYearId)).toLowerCase();
                    const bT = String(asGuid(b.termId)).toLowerCase();
                    const bC = String(asGuid(b.classId)).toLowerCase();
                    const bType = Number(b.billTypeId) || 1;

                    return bY === yKey && bT === tKey && bC === cKey && bType === typeId;
                });
            },

            normalizeBill(r) {
                const rawDetails = val(r, 'details') || [];
                const details = (Array.isArray(rawDetails) ? rawDetails : []).map(d => ({
                    id: val(d, 'id') || generateUuid(),
                    billId: val(d, 'billId') || val(r, 'id') || EMPTY_GUID,
                    feeItemId: asGuid(val(d, 'feeItemId') || val(d, 'feesItemId') || val(d, 'boardingItemId')),
                    amount: Number(val(d, 'amount')) || 0
                }));

                const rawStudents = val(r, 'students') || [];
                const students = (Array.isArray(rawStudents) ? rawStudents : []).map(s => ({
                    id: val(s, 'id') || generateUuid(),
                    billId: val(s, 'billId') || val(r, 'id') || EMPTY_GUID,
                    studentId: asGuid(val(s, 'studentId')),
                    toBeBilled: parseBool(val(s, 'toBeBilled') !== undefined ? val(s, 'toBeBilled') : true),
                    isDiscounted: parseBool(val(s, 'isDiscounted')),
                    amount: Number(val(s, 'amount')) || 0,
                    discountAmount: Number(val(s, 'discountAmount')) || 0,
                    discountPercentage: Number(val(s, 'discountPercentage')) || 0
                }));

                return {
                    id: val(r, 'id'),
                    academicYearId: asGuid(val(r, 'academicYearId')),
                    termId: asGuid(val(r, 'termId')),
                    classId: asGuid(val(r, 'classId')),
                    levelId: asGuid(val(r, 'levelId') || this.getLevelIdForClass(val(r, 'classId'))),
                    billNumber: String(val(r, 'billNumber') || ''),
                    billDate: val(r, 'billDate') ? String(val(r, 'billDate')).substring(0, 10) : new Date().toISOString().substring(0, 10),
                    billingScopeId: 1, // Always 1
                    isProcessed: parseBool(val(r, 'isProcessed')),
                    isPosted: parseBool(val(r, 'isPosted')),
                    isCancelled: parseBool(val(r, 'isCancelled')),
                    billTypeId: Number(val(r, 'billTypeId')) || 1,
                    batchNumber: String(val(r, 'batchNumber') || ''),
                    journalId: asGuid(val(r, 'journalId')),
                    tenantId: Number(val(r, 'tenantId')) || 0,
                    details,
                    students,
                    // Derived — NOT read from the API. Sum of billed students' amounts.
                    totalAmount: this.sumBilledStudents(students)
                };
            },

            normalizeStudentBill(r) {
                const studentId = asGuid(val(r, 'studentId'));
                return {
                    id: val(r, 'id'),
                    academicYearId: asGuid(val(r, 'academicYearId')),
                    termId: asGuid(val(r, 'termId')),
                    classId: asGuid(val(r, 'classId')),
                    studentId,
                    // Only studentId exists on the record — name comes from student bios:
                    // lastName firstName otherName
                    studentName: this.getStudentName(studentId),
                    billId: asGuid(val(r, 'billId')),
                    billNumber: String(val(r, 'billNumber') || ''),
                    amount: Number(val(r, 'amount')) || 0,
                    amountPaid: Number(val(r, 'amountPaid')) || 0,
                    balanceDue: Number(val(r, 'balanceDue')) || 0,
                    billDate: val(r, 'billDate') ? String(val(r, 'billDate')).substring(0, 10) : '',
                    billStatusId: Number(val(r, 'billStatusId')) || 0,
                    isCanceled: parseBool(val(r, 'isCanceled') || val(r, 'isCancelled')),
                    tenantId: Number(val(r, 'tenantId')) || 0
                };
            },

            async refreshAll() {
                await Promise.all([
                    this.loadBills(),
                    this.loadStudentBills()
                ]);
                // Names/totals are derived from lookups — refresh them once everything is in.
                this.hydrateStudentBillNames();
                this.recomputeAllBillTotals();
            },

            async loadBills() {
                this.isShimmerLoading = true;
                try {
                    const res = await axios.get('/SchoolManager/GetBills/');
                    const rawList = unwrapList(res.data, 'bills');
                    this.bills = rawList
                        .filter(s => !parseBool(val(s, 'isCancelled')))
                        .map(s => this.normalizeBill(s));
                } catch (err) {
                    this.toastHandler('error', 'Failed to load class bills.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async loadStudentBills() {
                try {
                    const res = await axios.get('/SchoolManager/GetStudentBills/');
                    const rawList = unwrapList(res.data, 'studentBills');
                    this.studentBills = rawList
                        .filter(s => !parseBool(val(s, 'isCanceled') || val(s, 'isCancelled')))
                        .map(s => this.normalizeStudentBill(s));
                } catch (err) {
                    console.error('Failed to load student bill records:', err);
                }
            },

            async loadLookups() {
                this.isShimmerLoading = true;
                const stamp = new Date().getTime();
                const safeGet = p => p.catch(() => ({ data: { result: [] } }));

                try {
                    const [yearsRes, termsRes, classesRes, studentsRes, feeDescRes, suppItemsRes, boardingItemsRes, feeSetupsRes, boardingFeesRes, currencies, school] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        safeGet(axios.get(`/jsonDataSample/terms.json?v=${stamp}`)),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetStudentBios/'),
                        safeGet(axios.get('/SchoolManager/GetFeesDescriptions/')),
                        safeGet(axios.get('/SchoolManager/GetSupplementaryItems/')),
                        safeGet(axios.get('/SchoolManager/GetBoardingItems/')),
                        safeGet(axios.get('/SchoolManager/GetFees/')),
                        safeGet(axios.get('/SchoolManager/GetBoardingFees/')),
                        safeGet(axios.get('/SharedResource/GetCurrencies/')),
                        safeGet(axios.get('/SchoolManager/GetSchoolProfile/'))
                    ]);

                    this.academicYears = normalizeLookups(unwrapList(yearsRes.data));
                    this.terms = normalizeLookups(unwrapList(termsRes.data));
                    this.classes = normalizeClasses(unwrapList(classesRes.data));
                    this.allStudents = normalizeStudents(unwrapList(studentsRes.data));
                    this.feeDescriptions = normalizeFeeItems(unwrapList(feeDescRes.data));
                    this.supplementaryItems = normalizeFeeItems(unwrapList(suppItemsRes.data));
                    this.boardingItems = normalizeFeeItems(unwrapList(boardingItemsRes.data));
                    this.generalFeeSetups = unwrapList(feeSetupsRes.data);
                    this.boardingFeeSetups = unwrapList(boardingFeesRes.data);
                    const currency = currencies.data.result;

                    const schoolProfile = school.data.result;
                    const localCurrency = schoolProfile.currencyId;

                    const c = currency.find(x => x.id === localCurrency);

                    this.currency = c ? c.currencyCode : '';
                    // Lookups are now available — back-fill anything already loaded.
                    this.hydrateStudentBillNames();

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', 'Error loading references.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildBillPayload(bill) {
                const classId = asGuid(bill.classId);
                const levelId = asGuid(bill.levelId || this.getLevelIdForClass(classId));
                const discountsAllowed = this.discountsAllowed;

                const rawDetails = bill.details || [];
                const details = (Array.isArray(rawDetails) ? rawDetails : []).map(d => ({
                    id: isGuid(d.id) ? d.id : generateUuid(),
                    billId: isGuid(bill.id) ? bill.id : EMPTY_GUID,
                    feeItemId: asGuid(d.feeItemId),
                    amount: Number(d.amount) || 0
                }));

                const rawStudents = bill.students || [];
                const students = (Array.isArray(rawStudents) ? rawStudents : []).map(s => {
                    const isDisc = discountsAllowed && parseBool(s.isDiscounted);
                    return {
                        id: isGuid(s.id) ? s.id : generateUuid(),
                        billId: isGuid(bill.id) ? bill.id : EMPTY_GUID,
                        studentId: asGuid(s.studentId),
                        toBeBilled: parseBool(s.toBeBilled !== undefined ? s.toBeBilled : true),
                        isDiscounted: isDisc,
                        amount: Number(s.amount) || 0,
                        discountAmount: isDisc ? (Number(s.discountAmount) || 0) : 0,
                        discountPercentage: isDisc ? (Number(s.discountPercentage) || 0) : 0
                    };
                });

                // NOTE: totalAmount is intentionally excluded — it is a client-side
                // aggregate of the billed students, not part of the bill payload.
                const payload = {
                    academicYearId: asGuid(bill.academicYearId),
                    termId: asGuid(bill.termId),
                    classId: classId,
                    levelId: levelId,
                    billNumber: String(bill.billNumber || ''),
                    billDate: bill.billDate ? new Date(bill.billDate).toISOString() : new Date().toISOString(),
                    billingScopeId: 1, // Strictly 1 (Scope: per class)
                    isProcessed: parseBool(bill.isProcessed),
                    isPosted: parseBool(bill.isPosted),
                    isCancelled: parseBool(bill.isCancelled),
                    billTypeId: Number(bill.billTypeId) || 1,
                    batchNumber: String(bill.batchNumber || ''),
                    journalId: asGuid(bill.journalId),
                    details,
                    students
                };

                if (bill.id) {
                    payload.id = bill.id;
                    if (bill.tenantId !== undefined && bill.tenantId !== null) {
                        payload.tenantId = bill.tenantId;
                    }
                }

                return payload;
            },

            /* ==========================================================
             * Modal Workflow (Create / Edit Bill)
             * ========================================================== */
            canUpdateBill(bill) {
                if (!bill) return false;
                return !parseBool(bill.isProcessed) && !parseBool(bill.isCancelled) && !parseBool(bill.isPosted);
            },

            /**
             * Safely retrieve selected rows from a DataGrid ref.
             * Supports function calls (.selectedRows()), properties (.selectedRows, .selected, .selection),
             * and ID mappings.
             */
            getGridSelectedRows(gridRef, fallbackList = []) {
                const grid = (this.$refs && this.$refs[gridRef]) ? this.$refs[gridRef] : null;
                if (!grid) return [];

                // 1. Function selectedRows()
                if (typeof grid.selectedRows === 'function') {
                    try {
                        const res = grid.selectedRows();
                        if (Array.isArray(res) && res.length) return res;
                    } catch (e) {
                        console.warn('Error invoking selectedRows():', e);
                    }
                }

                // 2. Property selectedRows
                if (Array.isArray(grid.selectedRows) && grid.selectedRows.length) {
                    return grid.selectedRows;
                }

                // 3. Method getSelectedRows()
                if (typeof grid.getSelectedRows === 'function') {
                    try {
                        const res = grid.getSelectedRows();
                        if (Array.isArray(res) && res.length) return res;
                    } catch (e) {
                        console.warn('Error invoking getSelectedRows():', e);
                    }
                }

                // 4. Property selected or selection (can be objects or IDs)
                const candidate = grid.selected || grid.selection || grid.selectedItems || grid.selectedRowIds;
                if (Array.isArray(candidate) && candidate.length) {
                    if (typeof candidate[0] === 'object' && candidate[0] !== null) {
                        return candidate;
                    }
                    return fallbackList.filter(item => candidate.some(id => this.sameId(item.id, id)));
                }

                return [];
            },

            clearGridSelection(gridRef) {
                const grid = (this.$refs && this.$refs[gridRef]) ? this.$refs[gridRef] : null;
                if (!grid) return;
                if (typeof grid.clearSelection === 'function') {
                    try { grid.clearSelection(); } catch (e) {}
                }
                if (typeof grid.deselectAll === 'function') {
                    try { grid.deselectAll(); } catch (e) {}
                }
            },

            editSelectedBill() {
                const grid = this.$refs.billsGrid;
                const selected = grid && typeof grid.selectedRows === 'function'
                    ? grid.selectedRows()
                    : [];

                if (!selected.length) {
                    return this.toastHandler('warning', 'Please select a bill from the table to edit.');
                }
                if (selected.length > 1) {
                    return this.toastHandler('warning', 'Please select only one bill to edit at a time.');
                }

                const bill = selected[0];

                if (bill.isPosted) {
                    return this.toastHandler('warning', 'This bill has been posted and cannot be updated.');
                }
                

                this.openBillModal(bill);
            },

            openBillModal(bill = null) {
                if (bill) {
                    this.activeBill = JSON.parse(JSON.stringify(bill));
                    if (Number(this.activeBill.billTypeId) === 2) {
                        // Check if any details correspond to not-fixed supplementary
                        const hasNotFixed = (this.activeBill.details || []).some(d => {
                            const found = this.supplementaryItems.find(i => this.sameId(i.id, d.feeItemId));
                            return found && !found.isFixed;
                        });
                        this.isSupplementaryFixed = !hasNotFixed;
                    } else {
                        this.isSupplementaryFixed = true;
                    }
                } else {
                    const defaultYear = this.academicYears.length ? this.academicYears[0].id : '';
                    const defaultTerm = this.terms.length ? this.terms[0].id : '';
                    const defaultClass = this.classes.length ? this.classes[0].id : '';

                    this.isSupplementaryFixed = true;
                    this.activeBill = {
                        id: null,
                        academicYearId: defaultYear,
                        termId: defaultTerm,
                        classId: defaultClass,
                        levelId: this.getLevelIdForClass(defaultClass),
                        billNumber: '',
                        billDate: new Date().toISOString().substring(0, 10),
                        billingScopeId: 1,
                        isProcessed: true,
                        isPosted: false,
                        isCancelled: false,
                        billTypeId: 1,
                        batchNumber: '',
                        journalId: EMPTY_GUID,
                        tenantId: 0,
                        details: [],
                        students: [],
                        totalAmount: 0
                    };

                    if (defaultClass) {
                        this.loadClassStudents();
                        this.autoPopulateFeeItems();
                    }
                }
                this.billModalOpen = true;
            },

            closeBillModal() {
                this.billModalOpen = false;
            },

            onClassChanged() {
                this.activeBill.levelId = this.getLevelIdForClass(this.activeBill.classId);
                this.loadClassStudents();
                this.autoPopulateFeeItems();
            },

            onBillTypeChanged() {
                this.activeBill.details = [];
                this.autoPopulateFeeItems();
            },

            onSupplementaryModeChanged() {
                // When toggled between fixed & not fixed, filter or reload appropriate items
                this.activeBill.details = [];
                this.autoPopulateFeeItems();
            },

            loadClassStudents() {
                if (!this.activeBill.classId) {
                    this.activeBill.students = [];
                    return;
                }

                const targetClassId = String(this.activeBill.classId).toLowerCase();
                const matchedStudents = this.allStudents.filter(s =>
                    s.classId && String(s.classId).toLowerCase() === targetClassId
                );

                const baseAmount = this.totalBaseBillAmount;

                this.activeBill.students = matchedStudents.map(st => ({
                    id: generateUuid(),
                    billId: this.activeBill.id || EMPTY_GUID,
                    studentId: st.id,
                    toBeBilled: true,
                    isDiscounted: false,
                    amount: baseAmount,
                    discountAmount: 0,
                    discountPercentage: 0
                }));
            },

            autoPopulateFeeItems() {
                const yearId = String(this.activeBill.academicYearId || '').toLowerCase();
                const termId = String(this.activeBill.termId || '').toLowerCase();
                const classId = String(this.activeBill.classId || '').toLowerCase();
                const billTypeId = Number(this.activeBill.billTypeId);

                let matchedSetup = null;

                if (billTypeId === 3) {
                    // Boarding setup (strictly class-based)
                    matchedSetup = this.boardingFeeSetups.find(f =>
                        String(f.academicYearId || '').toLowerCase() === yearId &&
                        String(f.termId || '').toLowerCase() === termId &&
                        String(f.classId || '').toLowerCase() === classId
                    );
                } else {
                    // Standard (1) or Supplementary (2)
                    const targetTypeStr = billTypeId === 2 ? 'supplementary' : 'standard';
                    matchedSetup = this.generalFeeSetups.find(f => {
                        const yMatch = String(f.academicYearId || '').toLowerCase() === yearId;
                        const tMatch = String(f.termId || '').toLowerCase() === termId;
                        const typeMatch = String(f.feeType || 'standard').toLowerCase() === targetTypeStr;
                        const classMatch = Boolean(f.isSchoolFee) || String(f.classId || '').toLowerCase() === classId;
                        return yMatch && tMatch && typeMatch && classMatch;
                    });
                }

                if (matchedSetup && Array.isArray(matchedSetup.details) && matchedSetup.details.length) {
                    let lines = matchedSetup.details;

                    // If Supplementary, filter lines according to isFixed toggle
                    if (billTypeId === 2) {
                        lines = lines.filter(d => {
                            const itemId = asGuid(d.feesItemId || d.boardingItemId);
                            const supp = this.supplementaryItems.find(i => this.sameId(i.id, itemId));
                            return supp && supp.isFixed === this.isSupplementaryFixed;
                        });
                    }

                    this.activeBill.details = lines.map(d => ({
                        id: generateUuid(),
                        billId: this.activeBill.id || EMPTY_GUID,
                        feeItemId: asGuid(d.feesItemId || d.boardingItemId),
                        amount: Number(d.amount) || 0
                    }));

                    this.onDetailAmountChanged();
                    if (lines.length > 0) {
                        this.toastHandler('success', 'Fee items loaded from Fee Setup.');
                    }
                }
            },

            addFeeDetailLine() {
                this.activeBill.details.push({
                    id: generateUuid(),
                    billId: this.activeBill.id || EMPTY_GUID,
                    feeItemId: '',
                    amount: 0
                });
            },

            removeFeeDetailLine(index) {
                this.activeBill.details.splice(index, 1);
                this.onDetailAmountChanged();
            },

            onDetailAmountChanged() {
                const baseAmount = this.totalBaseBillAmount;
                const discountsAllowed = this.discountsAllowed;

                (this.activeBill.students || []).forEach(st => {
                    if (!discountsAllowed || !st.isDiscounted) {
                        st.amount = st.toBeBilled ? baseAmount : 0;
                        st.discountAmount = 0;
                        st.discountPercentage = 0;
                        if (!discountsAllowed) st.isDiscounted = false;
                    } else {
                        st.amount = st.toBeBilled ? Math.max(0, baseAmount - (Number(st.discountAmount) || 0)) : 0;
                    }
                });

                this.recomputeBillTotal(this.activeBill);
            },

            toggleSelectAllStudents() {
                const newState = !this.allStudentsSelected;
                (this.activeBill.students || []).forEach(st => {
                    st.toBeBilled = newState;
                    this.recalculateStudentAmount(st);
                });
                this.recomputeBillTotal(this.activeBill);
            },

            recalculateStudentAmount(st) {
                if (!st.toBeBilled) {
                    st.amount = 0;
                    st.discountAmount = 0;
                    st.discountPercentage = 0;
                    st.isDiscounted = false;
                } else {
                    const baseAmount = this.totalBaseBillAmount;
                    if (this.discountsAllowed && st.isDiscounted) {
                        st.amount = Math.max(0, baseAmount - (Number(st.discountAmount) || 0));
                    } else {
                        st.amount = baseAmount;
                        st.discountAmount = 0;
                        st.discountPercentage = 0;
                    }
                }
                this.recomputeBillTotal(this.activeBill);
            },

            onDiscountToggled(st) {
                if (!st.isDiscounted || !this.discountsAllowed) {
                    st.discountAmount = 0;
                    st.discountPercentage = 0;
                    st.amount = st.toBeBilled ? this.totalBaseBillAmount : 0;
                }
                this.recomputeBillTotal(this.activeBill);
            },

            onDiscountAmountInput(st) {
                const base = this.totalBaseBillAmount;
                const disc = Number(st.discountAmount) || 0;
                st.amount = st.toBeBilled ? Math.max(0, base - disc) : 0;
                if (base > 0) {
                    st.discountPercentage = Number(((disc / base) * 100).toFixed(2));
                }
                this.recomputeBillTotal(this.activeBill);
            },

            async saveBillModal() {
                if (!this.activeBill.academicYearId) {
                    return this.toastHandler('warning', 'Please select an Academic Year.');
                }
                if (!this.activeBill.termId) {
                    return this.toastHandler('warning', 'Please select a Term.');
                }
                if (!this.activeBill.classId) {
                    return this.toastHandler('warning', 'Please select a Class.');
                }
                if (!this.activeBill.details || !this.activeBill.details.length) {
                    return this.toastHandler('warning', 'Please add at least one fee item to the bill.');
                }

                // Client-side duplicate check method
                const existing = this.checkExistingBill({
                    academicYearId: this.activeBill.academicYearId,
                    termId: this.activeBill.termId,
                    classId: this.activeBill.classId,
                    billTypeId: this.activeBill.billTypeId,
                    excludeBillId: this.activeBill.id
                });

                if (existing) {
                    const cName = this.getClassName(this.activeBill.classId);
                    const yName = this.getYearName(this.activeBill.academicYearId);
                    const tName = this.getTermName(this.activeBill.termId);
                    const typeName = this.getBillTypeName(this.activeBill.billTypeId);
                    return this.toastHandler('warning', `A ${typeName} bill already exists for ${cName} (${yName} - ${tName}).`);
                }
                const className = this.getClassName(this.activeBill.classId);
                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'question',
                        title: 'Process Bills?',
                        text: `You are about to process bill(s) for ${className}. This will generate student invoices. Continue?`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, process',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#059669',
                        cancelButtonColor: '#64748b'
                    });
                    if (!result.isConfirmed) return;
                }
                this.saving = true;
                this.isShimmerLoading = true;
                const payload = this.buildBillPayload(this.activeBill);
                const isUpdate = Boolean(this.activeBill.id);
                const endpoint = isUpdate ? '/SchoolManager/UpdateBill/' : '/SchoolManager/CreateBill/';

                try {
                    const res = await axios.post(endpoint, payload);
                    const result = res.data?.result || res.data;

                    if (res.data?.success === false || (result?.code && result.code !== 200)) {
                        this.toastHandler('error', result?.message || res.data?.error?.message || 'Failed to save bill.');
                        return;
                    }

                    this.toastHandler('success', isUpdate ? 'Class bill updated successfully.' : 'Class bill created successfully.');
                    this.closeBillModal();
                    await this.refreshAll();
                } catch (error) {
                    console.error('Failed saving bill:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to save bill.');
                } finally {
                    this.saving = false;
                    this.isShimmerLoading = false;
                }
            },


            /* ==========================================================
 * Cancel Student Bills Action
 * Backend expects CancelBillForStudentInput: { studentBillInfoIds: [ ... ] }
 * ========================================================== */
            async cancelSelectedStudentBills() {
                const selected = this.getGridSelectedRows('studentBillsGrid', this.studentBills);

                if (!selected.length) {
                    this.toastHandler('warning', 'Select one or more student bills to cancel.');
                    return;
                }

                // Check already cancelled bills first
                const uncancelledBills = selected.filter(sb => !parseBool(sb.isCanceled));
                if (!uncancelledBills.length) {
                    this.toastHandler('warning', 'All selected student bills have already been cancelled.');
                    return;
                }

                // Optional: prevent cancelling if payments have already been made against the student bill
                const paidBills = uncancelledBills.filter(sb => (Number(sb.amountPaid) || 0) > 0);
                if (paidBills.length > 0) {
                    this.toastHandler('error', 'Student bills with payments already recorded cannot be cancelled.');
                    return;
                }

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'warning',
                        title: 'Confirm Cancellation',
                        text: `Are you sure you want to cancel ${uncancelledBills.length} student bill(s)?`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, cancel',
                        cancelButtonText: 'No, go back',
                        confirmButtonColor: '#dc2626',
                        cancelButtonColor: '#64748b',
                        reverseButtons: true
                    });

                    if (!result.isConfirmed) return;
                }

                this.isShimmerLoading = true;
                try {
                    const studentBillInfoIds = uncancelledBills
                        .map(sb => asGuid(sb.id))
                        .filter(id => id !== EMPTY_GUID);

                    // Matches CancelBillForStudentInput { List<Guid> studentBillInfoIds }
                    const res = await axios.post('/SchoolManager/CancelStudentBills/', {
                        studentBillInfoIds
                    });
                    const result = res.data?.result || res.data;

                    if (res.data?.success === false || (result?.code && Number(result.code) !== 200)) {
                        this.toastHandler('error', result?.message || res.data?.error?.message || 'Failed to cancel student bills.');
                        return;
                    }

                    this.clearGridSelection('studentBillsGrid');

                    this.toastHandler('success', result?.message || 'Student bill(s) cancelled successfully.');
                    await this.refreshAll();
                } catch (err) {
                    console.error('Cancel student bills failed:', err);
                    this.toastHandler('error', err.response?.data?.message || 'Failed to cancel student bills.');
                } finally {
                    this.isShimmerLoading = false;
                }
            }

        },

        async mounted() {
            await this.loadLookups();
            await this.refreshAll();
            this.hydrateStudentBillNames();
            this.recomputeAllBillTotals();
        }
    });

    if (typeof DataGridPlugin !== 'undefined') {
        app.use(DataGridPlugin);
    }
    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();
