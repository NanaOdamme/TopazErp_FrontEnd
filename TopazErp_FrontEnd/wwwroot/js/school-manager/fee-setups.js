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

    const normalizeFeeItems = list => (list || [])
        .map(i => ({
            id: val(i, 'id'),
            name: val(i, 'name') || val(i, 'description') || val(i, 'itemName') || ''
        }))
        .filter(i => i.id != null && i.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeFeeRecord = (r, defaultType = 'Standard') => {
        const isBoarding = defaultType === 'Boarding' || String(val(r, 'feeType') || '').toLowerCase() === 'boarding';
        const rawDetails = val(r, 'details') || [];
        const details = (Array.isArray(rawDetails) ? rawDetails : []).map(d => ({
            id: val(d, 'id') || generateUuid(),
            feeSetUpId: val(d, 'feeSetUpId') || (!isBoarding ? (val(r, 'id') || EMPTY_GUID) : EMPTY_GUID),
            boardingFeeId: val(d, 'boardingFeeId') || (isBoarding ? (val(r, 'id') || EMPTY_GUID) : EMPTY_GUID),
            boardingItemId: asGuid(val(d, 'boardingItemId') || val(d, 'feesItemId')),
            feesItemId: asGuid(val(d, 'boardingItemId') || val(d, 'feesItemId')),
            amount: Number(val(d, 'amount')) || 0
        }));

        const totalAmount = details.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

        /* ------------------------------------------------------------
         * School-wide fee feature disabled.
         * Every setup now belongs to exactly one class, so a setup is
         * always treated as a class fee and classId is never blanked.
         * ------------------------------------------------------------
         * const isSchoolFee = !isBoarding && Boolean(val(r, 'isSchoolFee'));
         * const isClassFee = isBoarding || (!isSchoolFee && (val(r, 'isClassFee') !== undefined ? Boolean(val(r, 'isClassFee')) : true));
         */
        const isClassFee = isBoarding || (val(r, 'isClassFee') !== undefined ? Boolean(val(r, 'isClassFee')) : true);

        return {
            id: val(r, 'id'),
            tenantId: val(r, 'tenantId'),
            academicYearId: asGuid(val(r, 'academicYearId')),
            termId: asGuid(val(r, 'termId')),
            // classId: isSchoolFee ? EMPTY_GUID : asGuid(val(r, 'classId')),
            classId: asGuid(val(r, 'classId')),
            levelId: asGuid(val(r, 'levelId')),
            isClassFee: isClassFee,
            isLevelFee: Boolean(val(r, 'isLevelFee')),
            // isSchoolFee: isSchoolFee,
            feeType: isBoarding ? 'Boarding' : String(val(r, 'feeType') || defaultType),
            details,
            totalAmount
        };
    };

    const app = Vue.createApp({
        data() {
            return {
                isShimmerLoading: false,
                saving: false,
                setupDone: false,
                theme: '#062a81',

                activeTab: 'Standard', // 'Standard' | 'Supplementary' | 'Boarding'

                // Lookups
                academicYears: [],
                terms: [],
                classes: [],
                feesDescriptions: [],   // Standard items (/SchoolManager/GetFeesDescriptions/)
                supplementaryItems: [], // Supplementary items (/SchoolManager/GetSupplementaryItems/)
                boardingItems: [],      // Boarding items (/SchoolManager/GetBoardingItems/)
    
                // Data collections
                standardFees: [],
                supplementaryFees: [],
                boardingFees: [],

                // Copy Setup Modal State
                copyModalOpen: false,
                copying: false,
                sourceSetup: null,
                targetClassIds: [],
                
                currencies:[],
                currencyCode:''
            };
        },

        computed: {
            currentItemsList() {
                if (this.activeTab === 'Standard') return this.feesDescriptions;
                if (this.activeTab === 'Supplementary') return this.supplementaryItems;
                return this.boardingItems;
            },

            currentGridData() {
                if (this.activeTab === 'Standard') return this.standardFees;
                if (this.activeTab === 'Supplementary') return this.supplementaryFees;
                return this.boardingFees;
            },

            headerColumns() {
                const isBoarding = this.activeTab === 'Boarding';

                const cols = [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false }
                ];

                /* --------------------------------------------------------
                 * School-wide fee toggle disabled.
                 * Standard, Supplementary and Boarding are all class-based now.
                 * --------------------------------------------------------
                 * if (!isBoarding) {
                 *     cols.push({
                 *         key: 'isSchoolFee',
                 *         label: 'School-Wide Fee?',
                 *         type: 'boolean',
                 *         width: 150,
                 *         defaultValue: false,
                 *         help: 'When checked, this fee setup applies to the whole school and class is omitted.'
                 *     });
                 * }
                 */

                cols.push({
                    key: 'classId',
                    label: 'Class',
                    type: 'select',
                    required: true, // class is mandatory for every fee type now
                    width: 220,
                    searchable: true,
                    // options: isBoarding
                    //     ? this.classes
                    //     : [{ id: EMPTY_GUID, name: '— Whole School (No Class) —' }, ...this.classes],
                    options: this.classes,
                    value: 'id',
                    display: 'name',
                    defaultValue: this.classes.length ? this.classes[0].id : EMPTY_GUID,
                    // help: isBoarding
                    //     ? 'Select the class for this boarding fee setup.'
                    //     : 'Select the class, or select Whole School if School-Wide Fee is checked.'
                    help: 'Select the class for this fee setup.'
                });

                cols.push({
                    key: 'academicYearId',
                    label: 'Academic Year',
                    type: 'select',
                    required: true,
                    searchable: true,
                    width: 180,
                    options: this.academicYears,
                    value: 'id',
                    display: 'name',
                    defaultValue: this.academicYears.length ? this.academicYears[0].id : ''
                });

                cols.push({
                    key: 'termId',
                    label: 'Term',
                    type: 'select',
                    required: true,
                    searchable: true,
                    width: 160,
                    options: this.terms,
                    value: 'id',
                    display: 'name',
                    defaultValue: this.terms.length ? this.terms[0].id : ''
                });

                cols.push({
                    key: 'totalAmount',
                    label: 'Total Fee Amount',
                    type: 'number',
                    decimals: 2,
                    editable: false,
                    width: 170,
                    help: 'Calculated sum of all fee items in the breakdown below.'
                });

                cols.push({
                    key: 'feeType',
                    label: 'Fee Type',
                    type: 'text',
                    editable: false,
                    width: 140,
                    defaultValue: this.activeTab
                });

                return cols;
            },

            detailSubgrid() {
                const isBoarding = this.activeTab === 'Boarding';
                const itemLabel = this.activeTab === 'Standard'
                    ? 'Standard Fee Item'
                    : (this.activeTab === 'Supplementary' ? 'Supplementary Item' : 'Boarding Item');

                const parentIdKey = isBoarding ? 'boardingFeeId' : 'feeSetUpId';
                const itemKey = isBoarding ? 'boardingItemId' : 'feesItemId';

                return {
                    key: 'details',
                    title: `${this.activeTab} Fee Items Breakdown`,
                    columns: [
                        { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                        {
                            key: parentIdKey,
                            label: 'Setup ID',
                            type: 'text',
                            hidden: true,
                            editable: false,
                            searchable: false,
                            defaultValue: (row, column, parentRow) => (parentRow && parentRow.id) || '',
                            disabled: true
                        },
                        {
                            key: itemKey,
                            label: itemLabel,
                            type: 'select',
                            required: true,
                            searchable: true,
                            width: 320,
                            options: this.currentItemsList,
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

            // Classes eligible as targets for copy: classes that DO NOT already have a setup for this Year + Term + FeeType
            availableClassesForCopy() {
                if (!this.sourceSetup) return [];
                const yKey = String(this.sourceSetup.academicYearId).toLowerCase();
                const tKey = String(this.sourceSetup.termId).toLowerCase();

                const existingClassIdsInScope = new Set(
                    this.currentGridData
                        .filter(f =>
                            String(f.academicYearId).toLowerCase() === yKey &&
                            String(f.termId).toLowerCase() === tKey &&
                            // School-wide fee setups no longer exist, so there is no
                            // "whole school" record to exclude any more.
                            // !f.isSchoolFee &&
                            f.classId !== EMPTY_GUID
                        )
                        .map(f => String(f.classId).toLowerCase())
                );

                return this.classes.filter(c => !existingClassIdsInScope.has(String(c.id).toLowerCase()));
            }
        },

        methods: {
            val,
            isGuid,
            asGuid,
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

            async fetchList(url, label, preferredKey = null) {
                try {
                    const response = await axios.get(url);
                    return unwrapList(response.data, preferredKey);
                } catch (error) {
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },

            getClassName(classId) {
                if (!classId || classId === EMPTY_GUID) return '';
                // School-wide fees disabled — a blank class id is no longer "Whole School":
                // if (!classId || classId === EMPTY_GUID) return 'Whole School';
                const c = this.classes.find(x => this.sameId(x.id, classId));
                return c ? c.name : 'Unknown Class';
            },

            getYearName(yearId) {
                const y = this.academicYears.find(x => this.sameId(x.id, yearId));
                return y ? y.name : '';
            },

            getTermName(termId) {
                const t = this.terms.find(x => this.sameId(x.id, termId));
                return t ? t.name : '';
            },

            getLevelIdForClass(classId) {
                if (!classId || classId === EMPTY_GUID) return EMPTY_GUID;
                const c = this.classes.find(x => this.sameId(x.id, classId));
                return c?.levelId || EMPTY_GUID;
            },

            async getFeeSetups() {
                this.isShimmerLoading = true;
                const safeGet = p => p.catch(() => ({ data: { result: [] } }));

                try {
                    const [generalFeesRes, boardingFeesRes] = await Promise.all([
                        safeGet(axios.get('/SchoolManager/GetFees/')),
                        safeGet(axios.get('/SchoolManager/GetBoardingFees/'))
                    ]);

                    const allGeneral = unwrapList(generalFeesRes.data);
                    const allBoarding = unwrapList(boardingFeesRes.data);

                    this.standardFees = allGeneral
                        .filter(f => String(val(f, 'feeType') || '').toLowerCase() === 'standard' || !val(f, 'feeType'))
                        .map(r => normalizeFeeRecord(r, 'Standard'));

                    this.supplementaryFees = allGeneral
                        .filter(f => String(val(f, 'feeType') || '').toLowerCase() === 'supplementary')
                        .map(r => normalizeFeeRecord(r, 'Supplementary'));

                    this.boardingFees = allBoarding
                        .map(r => normalizeFeeRecord(r, 'Boarding'));
                } catch (err) {
                    this.toastHandler('error', 'Failed to refresh fee setups.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async loadLookups() {
                this.isShimmerLoading = true;
                const stamp = new Date().getTime();
                const safeGet = p => p.catch(() => ({ data: { result: [] } }));

                try {
                    const [yearsRes, termsRes, classesRes, feesDescRes, suppItemsRes, boardingItemsRes, currencies, schoolProfile] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        safeGet(axios.get(`/jsonDataSample/terms.json?v=${stamp}`)),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        safeGet(axios.get('/SchoolManager/GetFeesDescriptions/')),
                        safeGet(axios.get('/SchoolManager/GetSupplementaryItems/')),
                        safeGet(axios.get('/SchoolManager/GetBoardingItems/')),
                        safeGet(axios.get('/SharedResource/GetCurrencies/')),
                        safeGet(axios.get('/SchoolManager/GetSchoolProfile/'))
                    ]);

                    this.academicYears = normalizeLookups(unwrapList(yearsRes.data));
                    this.terms = normalizeLookups(unwrapList(termsRes.data));
                    this.classes = normalizeClasses(unwrapList(classesRes.data));
                    this.feesDescriptions = normalizeFeeItems(unwrapList(feesDescRes.data));
                    this.supplementaryItems = normalizeFeeItems(unwrapList(suppItemsRes.data));
                    this.boardingItems = normalizeFeeItems(unwrapList(boardingItemsRes.data));
                    this.currencies = currencies.data.result;

                    const school = schoolProfile.data.result;
                    const localCurrency = school.currencyId;

                    const currency = this.currencies.find(x => x.id === localCurrency);

                    this.currencyCode = currency ? currency.currencyCode : '';
                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', 'Error loading reference lookups.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildPayload(row, feeType = null) {
                const type = feeType || row.feeType || this.activeTab;
                const isBoarding = type === 'Boarding' || this.activeTab === 'Boarding';

                if (isBoarding) {
                    const classId = this.asGuid(row.classId);
                    const rawDetails = row.details || [];
                    const details = (Array.isArray(rawDetails) ? rawDetails : []).map(d => ({
                        id: isGuid(d.id) ? d.id : generateUuid(),
                        boardingFeeId: isGuid(d.boardingFeeId) ? d.boardingFeeId : (isGuid(row.id) ? row.id : EMPTY_GUID),
                        boardingItemId: this.asGuid(d.boardingItemId || d.feesItemId),
                        amount: Number(d.amount) || 0
                    }));

                    const payload = {
                        academicYearId: this.asGuid(row.academicYearId),
                        termId: this.asGuid(row.termId),
                        classId: classId,
                        details
                    };

                    if (row.id) {
                        payload.id = row.id;
                        if (row.tenantId !== undefined && row.tenantId !== null) {
                            payload.tenantId = row.tenantId;
                        }
                    }

                    return payload;
                }

                // Standard & Supplementary (FeeSetUp model)
                // School-wide fee scope disabled — class is always required:
                // const isSchool = parseBool(row.isSchoolFee);
                // const classId = isSchool ? EMPTY_GUID : this.asGuid(row.classId);
                const classId = this.asGuid(row.classId);

                const rawDetails = row.details || [];
                const details = (Array.isArray(rawDetails) ? rawDetails : []).map(d => ({
                    id: isGuid(d.id) ? d.id : generateUuid(),
                    feeSetUpId: isGuid(d.feeSetUpId) ? d.feeSetUpId : (isGuid(row.id) ? row.id : EMPTY_GUID),
                    feesItemId: this.asGuid(d.feesItemId || d.boardingItemId),
                    amount: Number(d.amount) || 0
                }));

                const payload = {
                    academicYearId: this.asGuid(row.academicYearId),
                    termId: this.asGuid(row.termId),
                    classId: classId,
                    levelId: this.asGuid(row.levelId || this.getLevelIdForClass(classId)),
                    // isClassFee: !isSchool,
                    isClassFee: true,
                    isLevelFee: false,
                    // isSchoolFee: isSchool,
                    feeType: type,
                    details
                };

                if (row.id) {
                    payload.id = row.id;
                    if (row.tenantId !== undefined && row.tenantId !== null) {
                        payload.tenantId = row.tenantId;
                    }
                }

                return payload;
            },

            /* ==========================================================
             * DataGrid Multi-Level Dispatch (Master: Level 0, Detail: Level 1)
             * ========================================================== */
            async onCreate(event) {
                const row = event?.row || event?.data;
                const level = Number(event?.level ?? 0);
                if (!row) return;

                if (level === 0) {
                    await this.createFeeSetup(row);
                    return;
                }

                // Level 1: Child detail item
                const parentSetupId = event?.grid?.parentRow?.id || row.feeSetUpId || row.boardingFeeId;
                if (!parentSetupId) {
                    this.toastHandler('error', 'Parent fee setup was not found for this detail item.');
                    return;
                }

                if (this.activeTab === 'Boarding') {
                    row.boardingFeeId = parentSetupId;
                } else {
                    row.feeSetUpId = parentSetupId;
                }
                await this.saveFeeDetail(parentSetupId, row, 'create');
            },

            async onUpdate(event) {
                const row = event?.row || event?.data;
                const level = Number(event?.level ?? 0);
                if (!row) return;

                if (level === 0) {
                    await this.updateFeeSetup(row);
                    return;
                }

                // Level 1: Child detail item
                const parentSetupId = event?.grid?.parentRow?.id || row.feeSetUpId || row.boardingFeeId;
                if (!parentSetupId) {
                    this.toastHandler('error', 'Parent fee setup was not found for this detail item.');
                    return;
                }

                if (this.activeTab === 'Boarding') {
                    row.boardingFeeId = parentSetupId;
                } else {
                    row.feeSetUpId = parentSetupId;
                }
                await this.saveFeeDetail(parentSetupId, row, 'update');
            },

            async onDelete(event) {
                const rows = Array.isArray(event?.rows) ? event.rows : (event?.row ? [event.row] : []);
                const level = Number(event?.level ?? 0);
                if (!rows.length) return;

                if (level === 0) {
                    await this.deleteFeeSetups(rows);
                    return;
                }

                if (level === 1) {
                    const parentSetupId =
                        event?.grid?.parentRow?.id ||
                        rows.find(r => r.feeSetUpId || r.boardingFeeId)?.feeSetUpId ||
                        rows.find(r => r.feeSetUpId || r.boardingFeeId)?.boardingFeeId;

                    if (!parentSetupId) {
                        this.toastHandler('error', 'Parent fee setup was not found for these details.');
                        return;
                    }

                    await this.deleteFeeDetails(parentSetupId, rows);
                }
            },

            /**
             * Duplicate = same Academic Year + Term + Class.
             * School-wide comparisons removed (school-wide fee feature disabled).
             */
            isDuplicateFeeSetup(row, excludeId = null) {
                const list = this.currentGridData;
                if (!list || !list.length) return false;

                // const isSchool = parseBool(row.isSchoolFee);
                const yKey = String(asGuid(row.academicYearId)).toLowerCase();
                const tKey = String(asGuid(row.termId)).toLowerCase();
                // const cKey = isSchool ? EMPTY_GUID : String(asGuid(row.classId)).toLowerCase();
                const cKey = String(asGuid(row.classId)).toLowerCase();

                // If year or term not set, don't flag as duplicate
                if (yKey === EMPTY_GUID || tKey === EMPTY_GUID) return false;
                // If class not set, don't flag as duplicate
                // if (!isSchool && cKey === EMPTY_GUID) return false;
                if (cKey === EMPTY_GUID) return false;

                const currentId = excludeId || (typeof row.id === 'object' ? row.id?.id : row.id);

                return list.some(f => {
                    // Do not compare row against itself
                    if (f === row) return false;
                    if (currentId && sameId(f.id, currentId)) return false;

                    const fYear = String(asGuid(f.academicYearId)).toLowerCase();
                    const fTerm = String(asGuid(f.termId)).toLowerCase();
                    // const fIsSchool = parseBool(f.isSchoolFee);
                    // const fClass = fIsSchool ? EMPTY_GUID : String(asGuid(f.classId)).toLowerCase();
                    const fClass = String(asGuid(f.classId)).toLowerCase();

                    // return fYear === yKey &&
                    //     fTerm === tKey &&
                    //     (isSchool ? fIsSchool : (!fIsSchool && fClass === cKey));
                    return fYear === yKey &&
                        fTerm === tKey &&
                        fClass === cKey;
                });
            },

            /* ==========================================================
             * Level 0 Operations: FeeSetUp Header
             * ========================================================== */
            async createFeeSetup(row) {
                const yearId = asGuid(row.academicYearId);
                const termId = asGuid(row.termId);
                // const isSchool = parseBool(row.isSchoolFee);
                // const classId = isSchool ? EMPTY_GUID : asGuid(row.classId);
                const classId = asGuid(row.classId);

                if (!yearId || yearId === EMPTY_GUID) {
                    return this.toastHandler('warning', 'Please select an Academic Year.');
                }
                if (!termId || termId === EMPTY_GUID) {
                    return this.toastHandler('warning', 'Please select a Term.');
                }
                // School-wide fee option removed — a class is now mandatory.
                // if (!isSchool && (!classId || classId === EMPTY_GUID)) {
                //     return this.toastHandler('warning', 'Please select a Class or check "School-Wide Fee?".');
                // }
                if (!classId || classId === EMPTY_GUID) {
                    return this.toastHandler('warning', 'Please select a Class.');
                }

                // Duplicate check excluding self
                if (this.isDuplicateFeeSetup(row)) {
                    // const targetName = isSchool ? 'Whole School' : this.getClassName(classId);
                    const targetName = this.getClassName(classId);
                    return this.toastHandler('warning', `A ${this.activeTab} fee setup already exists for ${targetName} in the selected Academic Year and Term.`);
                }

                this.isShimmerLoading = true;
                // const record = this.buildPayload({ ...row, academicYearId: yearId, termId: termId, classId: classId, isSchoolFee: isSchool }, this.activeTab);
                const record = this.buildPayload({ ...row, academicYearId: yearId, termId: termId, classId: classId }, this.activeTab);
                const endpoint = this.activeTab === 'Boarding' ? '/SchoolManager/CreateBoardingFee/' : '/SchoolManager/CreateFee/';

                try {
                    const res = await axios.post(endpoint, record);
                    const result = res.data?.result || res.data;

                    if (res.data?.success === false || (result?.code && result.code !== 200)) {
                        this.toastHandler('error', result?.message || res.data?.error?.message || 'Failed to create fee setup.');
                        await this.getFeeSetups();
                        return;
                    }

                    this.toastHandler('success', `${this.activeTab} fee setup created successfully.`);
                    await this.getFeeSetups();
                } catch (error) {
                    console.error('Fee setup create failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to create fee setup.');
                    await this.getFeeSetups();
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async updateFeeSetup(row) {
                const rawId = row.id;
                const id = typeof rawId === 'object' ? rawId?.id : rawId;

                const existing = this.currentGridData.find(item => this.sameId(item.id, id));
                if (!existing) {
                    this.toastHandler('error', 'Fee setup record not found.');
                    return;
                }

                // School-wide fee scope disabled:
                // const isSchool = parseBool(row.isSchoolFee !== undefined ? row.isSchoolFee : existing.isSchoolFee);
                // const classId = isSchool ? EMPTY_GUID : asGuid(row.classId !== undefined ? row.classId : existing.classId);
                const classId = asGuid(row.classId !== undefined ? row.classId : existing.classId);

                // Duplicate check excluding this record
                // if (this.isDuplicateFeeSetup({ ...existing, ...row, isSchoolFee: isSchool, classId: classId }, id)) {
                //     const targetName = isSchool ? 'Whole School' : this.getClassName(classId);
                if (this.isDuplicateFeeSetup({ ...existing, ...row, classId: classId }, id)) {
                    const targetName = this.getClassName(classId);
                    return this.toastHandler('warning', `A ${this.activeTab} fee setup already exists for ${targetName} in the selected Academic Year and Term.`);
                }

                this.isShimmerLoading = true;
                // const record = this.buildPayload({ ...existing, ...row, id: existing.id, tenantId: existing.tenantId, isSchoolFee: isSchool, classId: classId }, this.activeTab);
                const record = this.buildPayload({ ...existing, ...row, id: existing.id, tenantId: existing.tenantId, classId: classId }, this.activeTab);
                const endpoint = this.activeTab === 'Boarding' ? '/SchoolManager/UpdateBoardingFee/' : '/SchoolManager/UpdateFee/';

                try {
                    const res = await axios.post(endpoint, record);
                    if (res.data && res.data.success === false) {
                        this.toastHandler('error', res.data.message || 'Failed to update fee setup.');
                        await this.getFeeSetups();
                        return;
                    }

                    this.toastHandler('success', `${this.activeTab} fee setup updated successfully.`);
                    await this.getFeeSetups();
                } catch (error) {
                    console.error('Fee setup update failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to update fee setup.');
                    await this.getFeeSetups();
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async deleteFeeSetups(rows) {

                this.isShimmerLoading = true;
                const baseEndpoint = this.activeTab === 'Boarding' ? '/SchoolManager/DeleteBoardingFee' : '/SchoolManager/DeleteFee';

                try {
                    for (const row of rows) {
                        const id = typeof row.id === 'object' ? row.id?.id : row.id;
                        if (!id) continue;

                        const res = await axios.get(`${baseEndpoint}?id=${encodeURIComponent(id)}`);
                        if (res.data?.success === false) {
                            this.toastHandler('error', res.data.message || 'Failed to delete fee setup.');
                            return;
                        }
                    }

                    this.toastHandler('success', `${this.activeTab} fee setup deleted successfully.`);
                    await this.getFeeSetups();
                } catch (error) {
                    console.error('Fee setup deletion failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to delete fee setup.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ==========================================================
             * Level 1 Operations: FeeSetUp Detail Items (Breakdown)
             * ========================================================== */
            async saveFeeDetail(parentSetupId, detailRow, action) {
                const existing = this.currentGridData.find(f => this.sameId(f.id, parentSetupId));
                if (!existing) {
                    this.toastHandler('error', 'Parent fee setup not found.');
                    return;
                }

                const isBoarding = this.activeTab === 'Boarding' || existing.feeType === 'Boarding';
                const feesItemId = this.asGuid(detailRow.feesItemId || detailRow.boardingItemId);
                if (feesItemId === EMPTY_GUID) {
                    this.toastHandler('warning', isBoarding ? 'Please select a boarding item.' : 'Please select a fee item.');
                    return;
                }

                const amount = Number(detailRow.amount);
                if (isNaN(amount) || amount < 0) {
                    this.toastHandler('warning', 'Please enter a valid amount.');
                    return;
                }

                let details = [...(existing.details || [])];
                const detailItem = {
                    id: isGuid(detailRow.id) ? detailRow.id : generateUuid(),
                    feeSetUpId: isBoarding ? EMPTY_GUID : existing.id,
                    boardingFeeId: isBoarding ? existing.id : EMPTY_GUID,
                    feesItemId,
                    boardingItemId: feesItemId,
                    amount
                };

                if (action === 'create') {
                    // Check duplicate fee item in same setup
                    const dupe = details.find(d =>
                        d.id !== detailRow.id &&
                        this.sameId(d.feesItemId || d.boardingItemId, feesItemId)
                    );
                    if (dupe) {
                        this.toastHandler('warning', isBoarding ? 'This boarding item is already in this fee breakdown.' : 'This fee item is already in this fee breakdown.');
                        return;
                    }
                    details = details.filter(d => d.id !== detailRow.id);
                    details.push(detailItem);
                } else {
                    details = details.map(item => item.id === detailRow.id ? detailItem : item);
                }

                await this.saveSetupWithDetails(existing, details, action);
            },

            async deleteFeeDetails(parentSetupId, rows) {
                if (!parentSetupId || !Array.isArray(rows) || !rows.length) return;

                const existing = this.currentGridData.find(f => this.sameId(f.id, parentSetupId));
                if (!existing) {
                    this.toastHandler('error', 'Parent fee setup was not found.');
                    await this.getFeeSetups().catch(() => {});
                    return;
                }

                const deletedIds = new Set(
                    rows
                        .map(r => r.id)
                        .filter(id => id != null)
                        .map(id => String(id).toLowerCase())
                );

                const remainingDetails = (existing.details || []).filter(d =>
                    !deletedIds.has(String(d.id || '').toLowerCase())
                );

                await this.saveSetupWithDetails(existing, remainingDetails, 'delete');
            },

            async saveSetupWithDetails(setup, details, action) {
                const payload = this.buildPayload({
                    ...setup,
                    details
                }, setup.feeType || this.activeTab);

                this.isShimmerLoading = true;
                const endpoint = (setup.feeType === 'Boarding' || this.activeTab === 'Boarding')
                    ? '/SchoolManager/UpdateBoardingFee/'
                    : '/SchoolManager/UpdateFee/';

                try {
                    await axios.post(endpoint, payload);
                    await this.getFeeSetups();
                    const message = action === 'create'
                        ? 'Fee item added to breakdown.'
                        : action === 'update'
                            ? 'Fee item updated.'
                            : 'Fee item removed.';
                    this.toastHandler('success', message);
                } catch (err) {
                    console.error('Failed updating fee setup breakdown:', err);
                    this.toastHandler('error', err.response?.data?.message || 'Failed to save fee item.');
                    await this.getFeeSetups();
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ==========================================================
             * Copy Class Fee Setup to Other Classes
             * ========================================================== */
            openCopyModal(setup) {
                this.sourceSetup = setup;
                this.targetClassIds = [];
                this.copyModalOpen = true;
            },

            closeCopyModal() {
                this.copyModalOpen = false;
                this.sourceSetup = null;
                this.targetClassIds = [];
            },

            toggleAllTargetClasses() {
                if (this.targetClassIds.length === this.availableClassesForCopy.length) {
                    this.targetClassIds = [];
                } else {
                    this.targetClassIds = this.availableClassesForCopy.map(c => c.id);
                }
            },

            async executeCopyFeeSetup() {
                if (!this.sourceSetup) return;
                if (!this.targetClassIds.length) {
                    return this.toastHandler('warning', 'Please select at least one target class to copy to.');
                }

                this.copying = true;
                const isBoarding = this.sourceSetup.feeType === 'Boarding' || this.activeTab === 'Boarding';
                const endpoint = isBoarding
                    ? '/SchoolManager/CreateBoardingFee/'
                    : '/SchoolManager/CreateFee/';

                let successCount = 0;
                let failCount = 0;

                try {
                    for (const targetClassId of this.targetClassIds) {
                        const levelId = this.getLevelIdForClass(targetClassId);
                        const newPayload = isBoarding
                            ? {
                                academicYearId: this.sourceSetup.academicYearId,
                                termId: this.sourceSetup.termId,
                                classId: targetClassId,
                                details: (this.sourceSetup.details || []).map(d => ({
                                    id: generateUuid(),
                                    boardingItemId: d.boardingItemId || d.feesItemId,
                                    amount: Number(d.amount) || 0
                                }))
                            }
                            : {
                                academicYearId: this.sourceSetup.academicYearId,
                                termId: this.sourceSetup.termId,
                                classId: targetClassId,
                                levelId: levelId,
                                isClassFee: true,
                                isLevelFee: false,
                                // isSchoolFee: false, // school-wide fee feature disabled
                                feeType: this.sourceSetup.feeType || this.activeTab,
                                details: (this.sourceSetup.details || []).map(d => ({
                                    id: generateUuid(),
                                    feesItemId: d.feesItemId || d.boardingItemId,
                                    amount: Number(d.amount) || 0
                                }))
                            };

                        try {
                            await axios.post(endpoint, newPayload);
                            successCount++;
                        } catch (err) {
                            failCount++;
                            console.error('Failed copying fee setup to class', targetClassId, err);
                        }
                    }

                    if (successCount > 0) {
                        this.toastHandler('success', `Fee setup copied successfully to ${successCount} class(es).`);
                        this.closeCopyModal();
                        await this.getFeeSetups();
                    }
                    if (failCount > 0) {
                        this.toastHandler('warning', `${failCount} class(es) could not be copied.`);
                    }
                } catch (error) {
                    console.error('Batch copy failed:', error);
                    this.toastHandler('error', 'Error occurred while copying fee setups.');
                } finally {
                    this.copying = false;
                }
            }
        },

        async mounted() {
            await this.loadLookups();
            await this.getFeeSetups();
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
