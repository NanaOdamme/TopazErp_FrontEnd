(function () {
    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };
    const today = isoDate(new Date());
    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    var app = Vue.createApp({
        data() {
            const now = new Date();
            const todayIso = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            return {
                setupDone: false,
                isShimmerLoading: true,
                saving: false,
                savingMedical: false,
                activeTab: 'bios',
                today: todayIso,
                theme: '#062a81',

                // Selected student for scoping child tabs
                selectedStudentId: '',

                // Lookups
                academicYears: [],
                classes: [],
                countries: [],
                cities: [],
                locations: [],
                religions: [],
                hostels: [],
                houses: [],
                statuses: [],
                allergyTypes: [],
                disabilityTypes: [],
                immunizationTypes: [],
                positionTypes: [],

                genderOptions: [
                    { id: 'Male', name: 'Male' },
                    { id: 'Female', name: 'Female' },
                    { id: 'Other', name: 'Other' }
                ],

                // Entities bound to data-grids & medical form
                studentBios: [],
                allergies: [],
                disabilities: [],
                immunizations: [],
                medicals: [],
                positions: [],

                // Medical card / form model for active student
                medicalForm: {
                    id: '',
                    doctorName: '',
                    doctorPhone: '',
                    clinicName: '',
                    clinicPhone: '',
                    emergencyContactName: '',
                    emergencyContactPhone: '',
                    medicalConditionsText: '',
                    medicationsText: '',
                    tenantId: null
                }
            };
        },

        computed: {
            studentOptions() {
                return [...this.studentBios]
                    .sort((a, b) => String(a.lastName).localeCompare(String(b.lastName)) || String(a.firstName).localeCompare(String(b.firstName)))
                    .map(s => ({
                        id: s.id,
                        label: ((s.studentIdentifier ? s.studentIdentifier + ' — ' : '') + this.displayName(s) + (s.className ? ' (' + s.className + ')' : '')).trim()
                    }));
            },

            selectedStudent() {
                if (!this.selectedStudentId) return null;
                return this.studentBios.find(s => String(s.id).toLowerCase() === String(this.selectedStudentId).toLowerCase()) || null;
            },

            hostelBlockOptions() {
                const list = [];
                (this.hostels || []).forEach(h => {
                    const hostelName = h.name || 'Hostel';
                    (h.details || []).forEach(d => {
                        const bName = d.blockName || d.name || '';
                        if (bName) {
                            list.push({
                                id: bName,
                                name: `${hostelName} — ${bName}`,
                                blockName: bName,
                                hostelId: d.hostelId || h.id
                            });
                        }
                    });
                });
                return list;
            },

            /* ---------- Filtered entities for child grids ---------- */
            scopedAllergies() {
                if (!this.selectedStudentId) return [];
                return this.allergies.filter(a => String(a.studentId).toLowerCase() === String(this.selectedStudentId).toLowerCase());
            },

            scopedDisabilities() {
                if (!this.selectedStudentId) return [];
                return this.disabilities.filter(d => String(d.studentId).toLowerCase() === String(this.selectedStudentId).toLowerCase());
            },

            scopedImmunizations() {
                if (!this.selectedStudentId) return [];
                return this.immunizations.filter(i => String(i.studentId).toLowerCase() === String(this.selectedStudentId).toLowerCase());
            },

            scopedPositions() {
                if (!this.selectedStudentId) return [];
                return this.positions.filter(p => String(p.studentId).toLowerCase() === String(this.selectedStudentId).toLowerCase());
            },

            activeMedicalRecord() {
                if (!this.selectedStudentId) return null;
                return this.medicals.find(m => String(m.studentId).toLowerCase() === String(this.selectedStudentId).toLowerCase()) || null;
            },

            /* ---------- Grid column configs ---------- */
            bioColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'studentIdentifier', label: 'Student ID', type: 'text', width: 120, placeholder: 'Generated on save', editable: true, searchable: true },
                    { key: 'indexNumber', label: 'Index No.', type: 'text', placeholder: 'Generated on save', width: 120, editable: true, searchable: true },
                    { key: 'firstName', label: 'First Name', type: 'text', width: 280, required: true, editable: true, searchable: true },
                    { key: 'otherName', label: 'Other Name', type: 'text', width: 230, editable: true, searchable: true },
                    { key: 'lastName', label: 'Last Name', type: 'text', width: 240, required: true, editable: true, searchable: true },
                    { key: 'gender', label: 'Gender', type: 'select', options: this.genderOptions, display: 'name', value: 'id', width: 100 },
                    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', width: 125, editable: true, searchable: false, defaultValue: today },
                    { key: 'classId', label: 'Class', type: 'select', options: this.classes, display: 'className', value: 'id', width: 220, required: true },
                    { key: 'className', label: 'Class Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'academicYearId', label: 'Academic Year', type: 'select', options: this.academicYears, display: 'name', value: 'id', width: 150 },
                    { key: 'academicYearName', label: 'Academic Year Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'admissionDate', label: 'Admission Date', type: 'date', width: 125, editable: true, defaultValue: today },
                    { key: 'countryId', label: 'Country', type: 'select', options: this.countries, display: 'name', value: 'id', width: 140 },
                    { key: 'countryName', label: 'Country Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'nationality', label: 'Nationality', type: 'text', width: 130, editable: true, searchable: true, hidden: true },
                    { key: 'cityId', label: 'City', type: 'select', options: this.cities, display: 'name', value: 'id', width: 130 },
                    { key: 'cityName', label: 'City Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'locationId', label: 'Location', type: 'select', options: this.locations, display: 'name', value: 'id', width: 220 },
                    { key: 'locationName', label: 'Location Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'houseNumber', label: 'House No.', type: 'text', width: 110, editable: true, searchable: true },
                    { key: 'address', label: 'Address', type: 'text', width: 250, editable: true, searchable: true },
                    { key: 'contactNumber', label: 'Contact No.', type: 'text', width: 120, editable: true, searchable: true },
                    { key: 'phoneNumber', label: 'Phone', type: 'text', width: 120, editable: true, searchable: true },
                    { key: 'religionId', label: 'Religion', type: 'select', options: this.religions, display: 'name', value: 'id', width: 130 },
                    { key: 'religionName', label: 'Religion Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'statusId', label: 'Status', type: 'select', options: this.statuses, display: 'name', value: 'id', width: 130 },
                    { key: 'statusName', label: 'Status Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'hostelId', label: 'Hostel', type: 'select', options: this.hostels, display: 'name', value: 'id', width: 240 },
                    { key: 'hostelName', label: 'Hostel Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'hostelBlockName', label: 'Hostel Block', type: 'select', options: this.hostelBlockOptions, display: 'name', value: 'blockName', width: 220 },
                    { key: 'houseId', label: 'House', type: 'select', options: this.houses, display: 'name', value: 'id', width: 130 },
                    { key: 'houseName', label: 'House Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'isBoarder', label: 'Boarder?', type: 'boolean', width: 95, searchable: false },
                    { key: 'isParentControl', label: 'Parent Control?', type: 'boolean', width: 125, searchable: false, hidden: true },
                    { key: 'isPreClassStudent', label: 'Pre-Class?', type: 'boolean', width: 105, searchable: false },
                    { key: 'isAlumni', label: 'Alumni?', type: 'boolean', width: 90, searchable: false, hidden: true },
                    { key: 'billAs', label: 'Bill As', type: 'text', width: 120, editable: true, searchable: false, hidden: true },
                    { key: 'balanceDue', label: 'Balance Due', type: 'number', width: 120, editable: true, decimals: 2, defaultValue: 0, hidden: true },
                    { key: 'balanceDueDate', label: 'Balance Due Date', type: 'date', width: 135, editable: true, defaultValue: today, hidden: true },
                    { key: 'notes', label: 'Notes', type: 'text', width: 250, editable: true, searchable: true },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false }
                ];
            },

            allergyColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'studentId', label: 'Student', type: 'select', options: this.studentOptions, display: 'label', value: 'id', width: 240, required: true, disabled: !!this.selectedStudentId, defaultValue: this.selectedStudentId },
                    { key: 'studentName', label: 'Student Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'allergyTypeId', label: 'Allergy Type', type: 'select', options: this.allergyTypes, display: 'name', value: 'id', width: 220, required: true },
                    { key: 'allergyTypeName', label: 'Allergy Type Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false }
                ];
            },

            disabilityColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'studentId', label: 'Student', type: 'select', options: this.studentOptions, display: 'label', value: 'id', width: 240, required: true, disabled: !!this.selectedStudentId, defaultValue: this.selectedStudentId },
                    { key: 'studentName', label: 'Student Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'disabilityId', label: 'Disability Type', type: 'select', options: this.disabilityTypes, display: 'name', value: 'id', width: 220, required: true },
                    { key: 'disabilityName', label: 'Disability Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false }
                ];
            },

            immunizationColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'studentId', label: 'Student', type: 'select', options: this.studentOptions, display: 'label', value: 'id', width: 240, required: true, disabled: !!this.selectedStudentId, defaultValue: this.selectedStudentId },
                    { key: 'studentName', label: 'Student Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'immunizationTypeId', label: 'Immunization Type', type: 'select', options: this.immunizationTypes, display: 'name', value: 'id', width: 220, required: true },
                    { key: 'immunizationTypeName', label: 'Immunization Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'isImmunized', label: 'Immunized?', type: 'boolean', width: 110, searchable: false },
                    { key: 'immunizationDate', label: 'Immunization Date', type: 'date', width: 140, editable: true, defaultValue: this.today },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false }
                ];
            },

            positionColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'studentId', label: 'Student', type: 'select', options: this.studentOptions, display: 'label', value: 'id', width: 240, required: true, disabled: !!this.selectedStudentId, defaultValue: this.selectedStudentId },
                    { key: 'studentName', label: 'Student Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'positionId', label: 'Position', type: 'select', options: this.positionTypes, display: 'name', value: 'id', width: 200, required: true },
                    { key: 'positionName', label: 'Position Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'academicYearId', label: 'Academic Year', type: 'select', options: this.academicYears, display: 'name', value: 'id', width: 160 },
                    { key: 'academicYearName', label: 'Academic Year Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false }
                ];
            }
        },

        watch: {
            selectedStudentId() {
                if (this.selectedStudentId) {
                    this.loadStudentSubRecords(this.selectedStudentId);
                }
            },
            activeTab(newTab) {
                if (newTab !== 'bios' && this.selectedStudentId) {
                    this.loadStudentSubRecords(this.selectedStudentId);
                }
            }
        },

        methods: {
            /* ==========================================================
             * helpers
             * ========================================================== */
            val(o, k) {
                return o ? (o[k] !== undefined ? o[k] : o[k.charAt(0).toUpperCase() + k.slice(1)]) : undefined;
            },

            isGuid(v) {
                return !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v));
            },

            asGuid(v) {
                return this.isGuid(v) ? String(v) : EMPTY_GUID;
            },

            truthy(v) {
                return v === true || v === 1 || v === '1'
                    || String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'yes';
            },

            errMsg(err) {
                return (err && err.response && err.response.data && (err.response.data.message || err.response.data.title))
                    || (err && err.message)
                    || 'Something went wrong.';
            },

            nameOf(list, id) {
                const item = (list || []).find(x => String(x.id).toLowerCase() === String(id || '').toLowerCase());
                return item ? (item.name || item.className || '') : '';
            },

            normalizeLookups(list) {
                return (list || [])
                    .map(o => ({
                        id: this.val(o, 'id'),
                        name: this.val(o, 'name') || this.val(o, 'displayName') || this.val(o, 'className') || '',
                        className: this.val(o, 'className') || this.val(o, 'name') || '',
                        details: this.val(o, 'details') || []
                    }))
                    .filter(o => o.id != null && (o.name !== '' || o.className !== ''))
                    .sort((a, b) => (a.name || a.className).localeCompare(b.name || b.className));
            },

            toInputDate(v) {
                const s = String(v || '');
                if (/^0001-01-01/.test(s)) return '';
                const m = s.match(/^\d{4}-\d{2}-\d{2}/);
                return m ? m[0] : '';
            },

            displayName(s) {
                return [s.firstName, s.otherName, s.lastName].filter(Boolean).join(' ').trim();
            },

            normalizeBio(b) {
                return {
                    id: this.val(b, 'id'),
                    studentIdentifier: this.val(b, 'studentIdentifier') || '',
                    firstName: this.val(b, 'firstName') || '',
                    otherName: this.val(b, 'otherName') || '',
                    lastName: this.val(b, 'lastName') || '',
                    dateOfBirth: this.toInputDate(this.val(b, 'dateOfBirth')),
                    gender: this.val(b, 'gender') || '',
                    countryId: this.val(b, 'countryId') || '',
                    countryName: this.val(b, 'countryName') || '',
                    nationality: this.val(b, 'nationality') || '',
                    cityId: this.val(b, 'cityId') || '',
                    cityName: this.val(b, 'cityName') || '',
                    houseNumber: this.val(b, 'houseNumber') || '',
                    locationId: this.val(b, 'locationId') || '',
                    locationName: this.val(b, 'locationName') || '',
                    religionId: this.val(b, 'religionId') || '',
                    religionName: this.val(b, 'religionName') || '',
                    classId: this.val(b, 'classId') || '',
                    className: this.val(b, 'className') || '',
                    contactNumber: this.val(b, 'contactNumber') || '',
                    address: this.val(b, 'address') || '',
                    phoneNumber: this.val(b, 'phoneNumber') || '',
                    admissionDate: this.toInputDate(this.val(b, 'admissionDate')),
                    isBoarder: this.truthy(this.val(b, 'isBoarder')),
                    isParentControl: this.truthy(this.val(b, 'isParentControl')),
                    academicYearId: this.val(b, 'academicYearId') || '',
                    academicYearName: this.val(b, 'academicYearName') || '',
                    notes: this.val(b, 'notes') || '',
                    hostelId: this.val(b, 'hostelId') || '',
                    hostelName: this.val(b, 'hostelName') || '',
                    hostelBlockName: this.val(b, 'hostelBlockName') || '',
                    houseId: this.val(b, 'houseId') || '',
                    houseName: this.val(b, 'houseName') || '',
                    statusId: this.val(b, 'statusId') || '',
                    statusName: this.val(b, 'statusName') || '',
                    balanceDue: Number(this.val(b, 'balanceDue') || 0),
                    balanceDueDate: this.toInputDate(this.val(b, 'balanceDueDate')),
                    isPreClassStudent: this.truthy(this.val(b, 'isPreClassStudent')),
                    indexNumber: this.val(b, 'indexNumber') || '',
                    isAlumni: this.truthy(this.val(b, 'isAlumni')),
                    billAs: this.val(b, 'billAs') || '',
                    tenantId: this.val(b, 'tenantId')
                };
            },

            normalizeAllergy(a) {
                return {
                    id: this.val(a, 'id'),
                    allergyTypeId: this.val(a, 'allergyTypeId') || '',
                    allergyTypeName: this.val(a, 'allergyTypeName') || '',
                    studentId: this.val(a, 'studentId') || '',
                    studentName: this.val(a, 'studentName') || '',
                    tenantId: this.val(a, 'tenantId')
                };
            },

            normalizeDisability(d) {
                return {
                    id: this.val(d, 'id'),
                    disabilityId: this.val(d, 'disabilityId') || '',
                    disabilityName: this.val(d, 'disabilityName') || '',
                    studentId: this.val(d, 'studentId') || '',
                    studentName: this.val(d, 'studentName') || '',
                    tenantId: this.val(d, 'tenantId')
                };
            },

            normalizeImmunization(i) {
                return {
                    id: this.val(i, 'id'),
                    studentId: this.val(i, 'studentId') || '',
                    studentName: this.val(i, 'studentName') || '',
                    immunizationTypeId: this.val(i, 'immunizationTypeId') || '',
                    immunizationTypeName: this.val(i, 'immunizationTypeName') || '',
                    isImmunized: this.truthy(this.val(i, 'isImmunized')),
                    immunizationDate: this.toInputDate(this.val(i, 'immunizationDate')),
                    tenantId: this.val(i, 'tenantId')
                };
            },

            normalizeMedical(m) {
                const conds = this.val(m, 'medicalConditions') || [];
                const meds = this.val(m, 'medications') || [];
                return {
                    id: this.val(m, 'id'),
                    doctorName: this.val(m, 'doctorName') || '',
                    doctorPhone: this.val(m, 'doctorPhone') || '',
                    medicalConditions: Array.isArray(conds) ? conds : (conds ? [String(conds)] : []),
                    medicalConditionsText: Array.isArray(conds) ? conds.join(', ') : String(conds || ''),
                    medications: Array.isArray(meds) ? meds : (meds ? [String(meds)] : []),
                    medicationsText: Array.isArray(meds) ? meds.join(', ') : String(meds || ''),
                    clinicName: this.val(m, 'clinicName') || '',
                    clinicPhone: this.val(m, 'clinicPhone') || '',
                    emergencyContactName: this.val(m, 'emergencyContactName') || '',
                    emergencyContactPhone: this.val(m, 'emergencyContactPhone') || '',
                    studentId: this.val(m, 'studentId') || '',
                    studentName: this.val(m, 'studentName') || '',
                    tenantId: this.val(m, 'tenantId')
                };
            },

            normalizePosition(p) {
                return {
                    id: this.val(p, 'id'),
                    positionId: this.val(p, 'positionId') || '',
                    positionName: this.val(p, 'positionName') || '',
                    studentId: this.val(p, 'studentId') || '',
                    studentName: this.val(p, 'studentName') || '',
                    academicYearId: this.val(p, 'academicYearId') || '',
                    academicYearName: this.val(p, 'academicYearName') || '',
                    tenantId: this.val(p, 'tenantId')
                };
            },

            /* ==========================================================
             * Data loading
             * ========================================================== */
            getSetupData() {
                this.isShimmerLoading = true;
                const stamp = new Date().getTime();
                const safeGet = (promise) => promise.catch(err => {
                    console.warn('Optional lookup failed, continuing with empty list:', err);
                    return { data: { result: [] } };
                });

                return Promise.all([
                    safeGet(axios.get('/SchoolManager/GetStudentBios/')),
                    safeGet(axios.get('/SchoolManager/GetAcademicYears/')),
                    safeGet(axios.get('/SchoolManager/GetLevelClasses/')),
                    safeGet(axios.get(`/jsonDataSample/countries.json?v=${stamp}`)),
                    safeGet(axios.get(`/jsonDataSample/cities.json?v=${stamp}`)),
                    safeGet(axios.get(`/jsonDataSample/religions.json?v=${stamp}`)),
                    safeGet(axios.get(`/jsonDataSample/studentStatuses.json?v=${stamp}`)),
                    safeGet(axios.get('/SchoolManager/GetLocations/')),
                    safeGet(axios.get('/SchoolManager/GetHostels/')),
                    safeGet(axios.get('/SchoolManager/GetHouses/')),
                    safeGet(axios.get('/SchoolManager/GetAllergyTypes/')),
                    safeGet(axios.get('/SchoolManager/GetDisabilityTypes/')),
                    safeGet(axios.get('/SchoolManager/GetImmunizationTypes/')),
                    safeGet(axios.get('/SchoolManager/GetPositionTypes/'))
                ]).then(([bios, years, classes, countries, cities, religions, status, locations, hostels, houses, allergyTypes, disabilityTypes, immunizationTypes, positionTypes]) => {
                    const extract = r => Array.isArray(r.data?.result) ? r.data.result : (Array.isArray(r.data) ? r.data : []);
                    this.academicYears = this.normalizeLookups(extract(years));
                    this.classes = this.normalizeLookups(extract(classes));
                    this.countries = this.normalizeLookups(extract(countries));
                    this.cities = this.normalizeLookups(extract(cities));
                    this.religions = this.normalizeLookups(extract(religions));
                    this.statuses = this.normalizeLookups(extract(status));
                    this.locations = this.normalizeLookups(extract(locations));
                    this.hostels = this.normalizeLookups(extract(hostels));
                    this.houses = this.normalizeLookups(extract(houses));
                    this.allergyTypes = this.normalizeLookups(extract(allergyTypes));
                    this.disabilityTypes = this.normalizeLookups(extract(disabilityTypes));
                    this.immunizationTypes = this.normalizeLookups(extract(immunizationTypes));
                    this.positionTypes = this.normalizeLookups(extract(positionTypes));

                    this.studentBios = extract(bios).map(b => this.normalizeBio(b)).filter(b => b.id != null);
                    if (!this.selectedStudentId && this.studentBios.length) {
                        this.selectedStudentId = this.studentBios[0].id;
                    }
                    this.setupDone = true;
                    this.isShimmerLoading = false;
                    if (this.selectedStudentId) {
                        this.loadStudentSubRecords(this.selectedStudentId);
                    }
                }).catch(() => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load student setups.');
                });
            },

            loadStudentSubRecords(studentId) {
                if (!studentId) return;
                const idParam = encodeURIComponent(studentId);
                const safeGet = (promise) => promise.catch(() => ({ data: { result: [] } }));
                return Promise.all([
                    safeGet(axios.get(`/SchoolManager/GetStudentAllergies?studentId=${idParam}`)),
                    safeGet(axios.get(`/SchoolManager/GetStudentDisabilities?studentId=${idParam}`)),
                    safeGet(axios.get(`/SchoolManager/GetStudentImmunizations?studentId=${idParam}`)),
                    safeGet(axios.get(`/SchoolManager/GetStudentMedicals?studentId=${idParam}`)),
                    safeGet(axios.get(`/SchoolManager/GetPositionsByStudent?studentId=${idParam}`))
                ]).then(([allergies, disabilities, immunizations, medicals, positions]) => {
                    const extract = r => Array.isArray(r.data?.result) ? r.data.result : (Array.isArray(r.data) ? r.data : []);
                    const normAllergies = extract(allergies).map(a => this.normalizeAllergy(a));
                    const normDisabilities = extract(disabilities).map(d => this.normalizeDisability(d));
                    const normImmunizations = extract(immunizations).map(i => this.normalizeImmunization(i));
                    const normMedicals = extract(medicals).map(m => this.normalizeMedical(m));
                    const normPositions = extract(positions).map(p => this.normalizePosition(p));

                    // Merge or replace records for this student
                    const sid = String(studentId).toLowerCase();
                    this.allergies = this.allergies.filter(a => String(a.studentId).toLowerCase() !== sid).concat(normAllergies);
                    this.disabilities = this.disabilities.filter(d => String(d.studentId).toLowerCase() !== sid).concat(normDisabilities);
                    this.immunizations = this.immunizations.filter(i => String(i.studentId).toLowerCase() !== sid).concat(normImmunizations);
                    this.medicals = this.medicals.filter(m => String(m.studentId).toLowerCase() !== sid).concat(normMedicals);
                    this.positions = this.positions.filter(p => String(p.studentId).toLowerCase() !== sid).concat(normPositions);

                    // Sync medicalForm with student's medical record
                    this.syncMedicalForm(sid);
                });
            },

            syncMedicalForm(sid) {
                const rec = this.medicals.find(m => String(m.studentId).toLowerCase() === sid);
                if (rec) {
                    this.medicalForm = {
                        id: rec.id || '',
                        doctorName: rec.doctorName || '',
                        doctorPhone: rec.doctorPhone || '',
                        clinicName: rec.clinicName || '',
                        clinicPhone: rec.clinicPhone || '',
                        emergencyContactName: rec.emergencyContactName || '',
                        emergencyContactPhone: rec.emergencyContactPhone || '',
                        medicalConditionsText: rec.medicalConditionsText || '',
                        medicationsText: rec.medicationsText || '',
                        tenantId: rec.tenantId !== undefined ? rec.tenantId : null
                    };
                } else {
                    this.medicalForm = {
                        id: '',
                        doctorName: '',
                        doctorPhone: '',
                        clinicName: '',
                        clinicPhone: '',
                        emergencyContactName: '',
                        emergencyContactPhone: '',
                        medicalConditionsText: '',
                        medicationsText: '',
                        tenantId: null
                    };
                }
            },

            refreshBios() {
                return axios.get('/SchoolManager/GetStudentBios/').then(r => {
                    const arr = Array.isArray(r.data?.result) ? r.data.result : (Array.isArray(r.data) ? r.data : []);
                    this.studentBios = arr.map(b => this.normalizeBio(b)).filter(b => b.id != null);
                });
            },

            /* ==========================================================
             * GRID CRUD — STUDENT BIOS
             * ========================================================== */
            onBioCreate(event) { return this.saveBio(event, 'create'); },
            onBioUpdate(event) { return this.saveBio(event, 'update'); },

            bioPayload(row, existing) {
                const d = (k) => row[k];
                const payload = {
                    studentIdentifier: String(d('studentIdentifier') || '').trim(),
                    firstName: String(d('firstName') || '').trim(),
                    otherName: String(d('otherName') || '').trim(),
                    lastName: String(d('lastName') || '').trim(),
                    gender: String(d('gender') || '').trim(),
                    nationality: String(d('nationality') || '').trim(),
                    houseNumber: String(d('houseNumber') || '').trim(),
                    contactNumber: String(d('contactNumber') || '').trim(),
                    address: String(d('address') || '').trim(),
                    phoneNumber: String(d('phoneNumber') || '').trim(),
                    isBoarder: !!d('isBoarder'),
                    isParentControl: !!d('isParentControl'),
                    notes: String(d('notes') || '').trim(),
                    hostelBlockName: String(d('hostelBlockName') || '').trim(),
                    balanceDue: Number(d('balanceDue') || 0),
                    isPreClassStudent: !!d('isPreClassStudent'),
                    indexNumber: String(d('indexNumber') || '').trim(),
                    isAlumni: !!d('isAlumni'),
                    billAs: String(d('billAs') || '').trim(),

                    // Guids: if nothing is entered, save as EMPTY_GUID
                    classId: this.asGuid(d('classId')),
                    className: d('classId') ? this.nameOf(this.classes, d('classId')) : '',
                    academicYearId: this.asGuid(d('academicYearId')),
                    academicYearName: d('academicYearId') ? this.nameOf(this.academicYears, d('academicYearId')) : '',
                    countryId: this.asGuid(d('countryId')),
                    countryName: d('countryId') ? this.nameOf(this.countries, d('countryId')) : '',
                    cityId: this.asGuid(d('cityId')),
                    cityName: d('cityId') ? this.nameOf(this.cities, d('cityId')) : '',
                    locationId: this.asGuid(d('locationId')),
                    locationName: d('locationId') ? this.nameOf(this.locations, d('locationId')) : '',
                    religionId: this.asGuid(d('religionId')),
                    religionName: d('religionId') ? this.nameOf(this.religions, d('religionId')) : '',
                    statusId: this.asGuid(d('statusId')),
                    statusName: d('statusId') ? this.nameOf(this.statuses, d('statusId')) : '',
                    hostelId: this.asGuid(d('hostelId')),
                    hostelName: d('hostelId') ? this.nameOf(this.hostels, d('hostelId')) : '',
                    houseId: this.asGuid(d('houseId')),
                    houseName: d('houseId') ? this.nameOf(this.houses, d('houseId')) : ''
                };

                const dob = this.toInputDate(d('dateOfBirth'));
                const adm = this.toInputDate(d('admissionDate'));
                const bDueDate = this.toInputDate(d('balanceDueDate'));
                if (dob) payload.dateOfBirth = dob;
                if (adm) payload.admissionDate = adm;
                if (bDueDate) payload.balanceDueDate = bDueDate;

                if (existing) {
                    payload.id = existing.id;
                    if (existing.tenantId !== undefined && existing.tenantId !== null) payload.tenantId = existing.tenantId;
                }
                return payload;
            },

            async saveBio(event, action) {
                const row = event?.row || event?.data;
                if (!row) return;

                let existing = null;
                if (action === 'update') {
                    existing = this.studentBios.find(b => String(b.id).toLowerCase() === String(row.id || '').toLowerCase());
                    if (!existing) {
                        this.toastHandler('error', 'Student record not found — try refreshing.');
                        await this.refreshBios();
                        return;
                    }
                    if (!this.isGuid(existing.id)) {
                        this.toastHandler('warning', 'This row has an unsaved draft id — nothing was posted.');
                        await this.refreshBios();
                        return;
                    }
                }

                const payload = this.bioPayload(row, existing);
                this.isShimmerLoading = true;
                try {
                    if (existing) {
                        await axios.post('/SchoolManager/UpdateStudentBio/', payload);
                        this.toastHandler('success', 'Student bio updated.');
                    } else {
                        await axios.post('/SchoolManager/CreateStudentBio/', payload);
                        this.toastHandler('success', 'Student bio saved.');
                    }
                    await this.refreshBios();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onBioDelete(event) {
                const rows = Array.isArray(event?.rows) ? event.rows : [];
                if (!rows.length) return;

                this.isShimmerLoading = true;
                try {
                    const results = await Promise.allSettled(
                        rows.map(r => axios.get('/SchoolManager/DeleteStudentBio?id=' + encodeURIComponent(r.id)))
                    );
                    const failed = results.filter(r => r.status === 'rejected').length;
                    this.toastHandler(failed ? 'warning' : 'success',
                        failed ? (rows.length - failed) + ' deleted; ' + failed + ' failed.' : rows.length + ' student record(s) deleted.');
                    await this.refreshBios();
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ==========================================================
             * GRID CRUD — ALLERGIES
             * ========================================================== */
            async onAllergyCreate(event) {
                const row = event?.row || event?.data;
                if (!row) return;
                const studentId = row.studentId || this.selectedStudentId;
                if (!studentId) return this.toastHandler('warning', 'Select a student.');
                if (!row.allergyTypeId) return this.toastHandler('warning', 'Select an allergy type.');

                const student = this.studentBios.find(s => String(s.id).toLowerCase() === String(studentId).toLowerCase());
                const payload = {
                    studentId: this.asGuid(studentId),
                    studentName: student ? this.displayName(student) : '',
                    allergyTypeId: this.asGuid(row.allergyTypeId),
                    allergyTypeName: this.nameOf(this.allergyTypes, row.allergyTypeId)
                };
                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/CreateStudentAllergy/', payload);
                    this.toastHandler('success', 'Allergy saved.');
                    await this.loadStudentSubRecords(studentId);
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onAllergyUpdate(event) {
                const row = event?.row || event?.data;
                if (!row) return;
                const existing = this.allergies.find(a => String(a.id).toLowerCase() === String(row.id || '').toLowerCase());
                if (!existing) return this.toastHandler('error', 'Allergy record not found.');

                const studentId = row.studentId || existing.studentId;
                const student = this.studentBios.find(s => String(s.id).toLowerCase() === String(studentId).toLowerCase());
                const allergyTypeId = row.allergyTypeId || existing.allergyTypeId;
                const payload = {
                    id: existing.id,
                    studentId: this.asGuid(studentId),
                    studentName: student ? this.displayName(student) : existing.studentName,
                    allergyTypeId: this.asGuid(allergyTypeId),
                    allergyTypeName: this.nameOf(this.allergyTypes, allergyTypeId)
                };
                if (existing.tenantId !== undefined && existing.tenantId !== null) payload.tenantId = existing.tenantId;

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/UpdateStudentAllergy/', payload);
                    this.toastHandler('success', 'Allergy updated.');
                    await this.loadStudentSubRecords(studentId);
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onAllergyDelete(event) {
                const rows = Array.isArray(event?.rows) ? event.rows : [];
                if (!rows.length) return;
                this.isShimmerLoading = true;
                try {
                    await Promise.allSettled(rows.map(r => axios.get('/SchoolManager/DeleteStudentAllergy?id=' + encodeURIComponent(r.id))));
                    this.toastHandler('success', 'Allergy deleted.');
                    if (this.selectedStudentId) await this.loadStudentSubRecords(this.selectedStudentId);
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ==========================================================
             * GRID CRUD — DISABILITIES
             * ========================================================== */
            async onDisabilityCreate(event) {
                const row = event?.row || event?.data;
                if (!row) return;
                const studentId = row.studentId || this.selectedStudentId;
                if (!studentId) return this.toastHandler('warning', 'Select a student.');
                if (!row.disabilityId) return this.toastHandler('warning', 'Select a disability type.');

                const student = this.studentBios.find(s => String(s.id).toLowerCase() === String(studentId).toLowerCase());
                const payload = {
                    studentId: this.asGuid(studentId),
                    studentName: student ? this.displayName(student) : '',
                    disabilityId: this.asGuid(row.disabilityId),
                    disabilityName: this.nameOf(this.disabilityTypes, row.disabilityId)
                };
                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/CreateStudentDisability/', payload);
                    this.toastHandler('success', 'Disability saved.');
                    await this.loadStudentSubRecords(studentId);
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onDisabilityUpdate(event) {
                const row = event?.row || event?.data;
                if (!row) return;
                const existing = this.disabilities.find(d => String(d.id).toLowerCase() === String(row.id || '').toLowerCase());
                if (!existing) return this.toastHandler('error', 'Disability record not found.');

                const studentId = row.studentId || existing.studentId;
                const student = this.studentBios.find(s => String(s.id).toLowerCase() === String(studentId).toLowerCase());
                const disabilityId = row.disabilityId || existing.disabilityId;
                const payload = {
                    id: existing.id,
                    studentId: this.asGuid(studentId),
                    studentName: student ? this.displayName(student) : existing.studentName,
                    disabilityId: this.asGuid(disabilityId),
                    disabilityName: this.nameOf(this.disabilityTypes, disabilityId)
                };
                if (existing.tenantId !== undefined && existing.tenantId !== null) payload.tenantId = existing.tenantId;

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/UpdateStudentDisability/', payload);
                    this.toastHandler('success', 'Disability updated.');
                    await this.loadStudentSubRecords(studentId);
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onDisabilityDelete(event) {
                const rows = Array.isArray(event?.rows) ? event.rows : [];
                if (!rows.length) return;
                this.isShimmerLoading = true;
                try {
                    await Promise.allSettled(rows.map(r => axios.get('/SchoolManager/DeleteStudentDisability?id=' + encodeURIComponent(r.id))));
                    this.toastHandler('success', 'Disability deleted.');
                    if (this.selectedStudentId) await this.loadStudentSubRecords(this.selectedStudentId);
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ==========================================================
             * GRID CRUD — IMMUNIZATIONS
             * ========================================================== */
            async onImmunizationCreate(event) {
                const row = event?.row || event?.data;
                if (!row) return;
                const studentId = row.studentId || this.selectedStudentId;
                if (!studentId) return this.toastHandler('warning', 'Select a student.');
                if (!row.immunizationTypeId) return this.toastHandler('warning', 'Select an immunization type.');

                const student = this.studentBios.find(s => String(s.id).toLowerCase() === String(studentId).toLowerCase());
                const payload = {
                    studentId: this.asGuid(studentId),
                    studentName: student ? this.displayName(student) : '',
                    immunizationTypeId: this.asGuid(row.immunizationTypeId),
                    immunizationTypeName: this.nameOf(this.immunizationTypes, row.immunizationTypeId),
                    isImmunized: !!row.isImmunized
                };
                const immDate = this.toInputDate(row.immunizationDate);
                if (immDate) payload.immunizationDate = immDate;

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/CreateStudentImmunization/', payload);
                    this.toastHandler('success', 'Immunization saved.');
                    await this.loadStudentSubRecords(studentId);
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onImmunizationUpdate(event) {
                const row = event?.row || event?.data;
                if (!row) return;
                const existing = this.immunizations.find(i => String(i.id).toLowerCase() === String(row.id || '').toLowerCase());
                if (!existing) return this.toastHandler('error', 'Immunization record not found.');

                const studentId = row.studentId || existing.studentId;
                const student = this.studentBios.find(s => String(s.id).toLowerCase() === String(studentId).toLowerCase());
                const immTypeId = row.immunizationTypeId || existing.immunizationTypeId;
                const payload = {
                    id: existing.id,
                    studentId: this.asGuid(studentId),
                    studentName: student ? this.displayName(student) : existing.studentName,
                    immunizationTypeId: this.asGuid(immTypeId),
                    immunizationTypeName: this.nameOf(this.immunizationTypes, immTypeId),
                    isImmunized: row.isImmunized !== undefined ? !!row.isImmunized : existing.isImmunized
                };
                const immDate = this.toInputDate(row.immunizationDate || existing.immunizationDate);
                if (immDate) payload.immunizationDate = immDate;
                if (existing.tenantId !== undefined && existing.tenantId !== null) payload.tenantId = existing.tenantId;

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/UpdateStudentImmunization/', payload);
                    this.toastHandler('success', 'Immunization updated.');
                    await this.loadStudentSubRecords(studentId);
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onImmunizationDelete(event) {
                const rows = Array.isArray(event?.rows) ? event.rows : [];
                if (!rows.length) return;
                this.isShimmerLoading = true;
                try {
                    await Promise.allSettled(rows.map(r => axios.get('/SchoolManager/DeleteStudentImmunization?id=' + encodeURIComponent(r.id))));
                    this.toastHandler('success', 'Immunization deleted.');
                    if (this.selectedStudentId) await this.loadStudentSubRecords(this.selectedStudentId);
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ==========================================================
             * FORM CRUD — MEDICALS (Card / Form view)
             * ========================================================== */
            async saveMedical() {
                const studentId = this.selectedStudentId;
                if (!studentId) return this.toastHandler('warning', 'Select a student.');

                const student = this.studentBios.find(s => String(s.id).toLowerCase() === String(studentId).toLowerCase());
                const conds = typeof this.medicalForm.medicalConditionsText === 'string'
                    ? this.medicalForm.medicalConditionsText.split(',').map(s => s.trim()).filter(Boolean)
                    : [];
                const meds = typeof this.medicalForm.medicationsText === 'string'
                    ? this.medicalForm.medicationsText.split(',').map(s => s.trim()).filter(Boolean)
                    : [];

                const payload = {
                    studentId: this.asGuid(studentId),
                    studentName: student ? this.displayName(student) : '',
                    doctorName: String(this.medicalForm.doctorName || '').trim(),
                    doctorPhone: String(this.medicalForm.doctorPhone || '').trim(),
                    clinicName: String(this.medicalForm.clinicName || '').trim(),
                    clinicPhone: String(this.medicalForm.clinicPhone || '').trim(),
                    emergencyContactName: String(this.medicalForm.emergencyContactName || '').trim(),
                    emergencyContactPhone: String(this.medicalForm.emergencyContactPhone || '').trim(),
                    medicalConditions: conds,
                    medications: meds
                };

                const existingId = this.medicalForm.id;
                if (existingId && this.isGuid(existingId)) {
                    payload.id = existingId;
                    if (this.medicalForm.tenantId !== null && this.medicalForm.tenantId !== undefined) {
                        payload.tenantId = this.medicalForm.tenantId;
                    }
                }

                this.savingMedical = true;
                try {
                    if (existingId && this.isGuid(existingId)) {
                        await axios.post('/SchoolManager/UpdateStudentMedical/', payload);
                        this.toastHandler('success', 'Medical record updated.');
                    } else {
                        await axios.post('/SchoolManager/CreateStudentMedical/', payload);
                        this.toastHandler('success', 'Medical record saved.');
                    }
                    await this.loadStudentSubRecords(studentId);
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.savingMedical = false;
                }
            },

            async deleteMedicalRecord() {
                if (!this.medicalForm.id) return;
                if (typeof Swal !== 'undefined') {
                    const res = await Swal.fire({
                        title: 'Delete medical record?',
                        text: 'This will remove the medical profile for this student.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#dc2626',
                        cancelButtonColor: '#64748b',
                        confirmButtonText: 'Yes, delete',
                        cancelButtonText: 'Cancel'
                    });
                    if (!res.isConfirmed) return;
                }
                this.savingMedical = true;
                try {
                    await axios.get('/SchoolManager/DeleteStudentMedical?id=' + encodeURIComponent(this.medicalForm.id));
                    this.toastHandler('success', 'Medical record deleted.');
                    if (this.selectedStudentId) await this.loadStudentSubRecords(this.selectedStudentId);
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.savingMedical = false;
                }
            },

            /* ==========================================================
             * GRID CRUD — POSITIONS
             * ========================================================== */
            async onPositionCreate(event) {
                const row = event?.row || event?.data;
                if (!row) return;
                const studentId = row.studentId || this.selectedStudentId;
                if (!studentId) return this.toastHandler('warning', 'Select a student.');
                if (!row.positionId) return this.toastHandler('warning', 'Select a position.');

                const student = this.studentBios.find(s => String(s.id).toLowerCase() === String(studentId).toLowerCase());
                const payload = {
                    studentId: this.asGuid(studentId),
                    studentName: student ? this.displayName(student) : '',
                    positionId: this.asGuid(row.positionId),
                    positionName: this.nameOf(this.positionTypes, row.positionId),
                    academicYearId: this.asGuid(row.academicYearId),
                    academicYearName: row.academicYearId ? this.nameOf(this.academicYears, row.academicYearId) : ''
                };

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/CreateStudentPosition/', payload);
                    this.toastHandler('success', 'Position saved.');
                    await this.loadStudentSubRecords(studentId);
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onPositionUpdate(event) {
                const row = event?.row || event?.data;
                if (!row) return;
                const existing = this.positions.find(p => String(p.id).toLowerCase() === String(row.id || '').toLowerCase());
                if (!existing) return this.toastHandler('error', 'Position record not found.');

                const studentId = row.studentId || existing.studentId;
                const student = this.studentBios.find(s => String(s.id).toLowerCase() === String(studentId).toLowerCase());
                const posId = row.positionId || existing.positionId;
                const yearId = row.academicYearId || existing.academicYearId;

                const payload = {
                    id: existing.id,
                    studentId: this.asGuid(studentId),
                    studentName: student ? this.displayName(student) : existing.studentName,
                    positionId: this.asGuid(posId),
                    positionName: this.nameOf(this.positionTypes, posId),
                    academicYearId: this.asGuid(yearId),
                    academicYearName: yearId ? this.nameOf(this.academicYears, yearId) : ''
                };
                if (existing.tenantId !== undefined && existing.tenantId !== null) payload.tenantId = existing.tenantId;

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/UpdateStudentPosition/', payload);
                    this.toastHandler('success', 'Position updated.');
                    await this.loadStudentSubRecords(studentId);
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async onPositionDelete(event) {
                const rows = Array.isArray(event?.rows) ? event.rows : [];
                if (!rows.length) return;
                this.isShimmerLoading = true;
                try {
                    await Promise.allSettled(rows.map(r => axios.get('/SchoolManager/DeleteStudentPosition?id=' + encodeURIComponent(r.id))));
                    this.toastHandler('success', 'Position deleted.');
                    if (this.selectedStudentId) await this.loadStudentSubRecords(this.selectedStudentId);
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ---------- Toast ---------- */
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
            }
        },

        mounted() {
            this.getSetupData();
        }
    });

    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
