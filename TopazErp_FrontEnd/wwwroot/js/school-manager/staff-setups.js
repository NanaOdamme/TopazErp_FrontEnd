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
                activeTab: 'bios',
                today: todayIso,
                theme: '#062a81',
                // lookups
                academicYears: [],
                titles: [],
                relationships: [],
                designations: [],
                grades: [],
                // entities (bound directly to the grids)
                staffBios: [],
                pastEmployments: [],
                pastPositions: [],
                qualifications: [],
                staffRelationships: [],

                genderOptions: [
                    { id: 'Male', name: 'Male' },
                    { id: 'Female', name: 'Female' },
                    { id: 'Other', name: 'Other' }
                ]
            };
        },

        computed: {
            staffOptions() {
                return [...this.staffBios]
                    .sort((a, b) => String(a.lastName).localeCompare(String(b.lastName)) || String(a.firstName).localeCompare(String(b.firstName)))
                    .map(b => ({ id: b.id, label: ((b.staffIdentifier ? b.staffIdentifier + ' — ' : '') + this.displayName(b)).trim() }));
            },

            /* ---------- grid column configs (computed: options load later) ---------- */
            bioColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'staffIdentifier', label: 'Staff ID', type: 'text', width: 110, required: true, editable: true, searchable: true },
                    { key: 'isTeacher', label: 'Teacher?', type: 'boolean', width: 95, searchable: false },
                    { key: 'titleId', label: 'Title', type: 'select', options: this.titles, display: 'name', value: 'id', width: 90 },
                    { key: 'firstName', label: 'First Name', type: 'text', width: 140, required: true, editable: true, searchable: true },
                    { key: 'otherName', label: 'Other Name', type: 'text', width: 130, editable: true, searchable: true },
                    { key: 'lastName', label: 'Last Name', type: 'text', width: 140, required: true, editable: true, searchable: true },
                    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', width: 125, editable: true, searchable: false, defaultValue: today },
                    { key: 'gender', label: 'Gender', type: 'select', options: this.genderOptions, display: 'name', value: 'id', width: 100 },
                    { key: 'contactNumber', label: 'Phone', type: 'text', width: 120, editable: true, searchable: true },
                    { key: 'email', label: 'Email', type: 'text', width: 180, editable: true, searchable: true },
                    { key: 'address', label: 'Address', type: 'text', width: 180, editable: true, searchable: true },
                    { key: 'faxNumber', label: 'Fax', type: 'text', width: 110, editable: true, searchable: false, hidden: true },
                    { key: 'titleName', label: 'Title Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'designationId', label: 'Designation', type: 'select', options: this.designations, display: 'name', value: 'id', width: 170, searchable: false },
                    { key: 'gradeId', label: 'Grade', type: 'select', options: this.grades, display: 'name', value: 'id', width: 130, searchable: false },
                    { key: 'socialSecurityNumber', label: 'SSNIT', type: 'text', width: 200, editable: true, searchable: false },
                    { key: 'academicYearId', label: 'Year Appointed', type: 'select', options: this.academicYears, display: 'name', value: 'id', width: 150 },
                    { key: 'dateOfEmployment', label: 'Employed', type: 'date', width: 125, editable: true, defaultValue: today },
                    { key: 'dateAppointed', label: 'Appointed', type: 'date', width: 125, editable: true, defaultValue: today },
                    { key: 'datePromotedToGrade', label: 'Promoted to Grade', type: 'date', width: 225, editable: true, searchable: false, defaultValue: today },
                    { key: 'notes', label: 'Notes', type: 'text', width: 280, editable: true, searchable: true },
                    { key: 'nextOfKinName', label: 'Next of Kin', type: 'text', width: 220, editable: true, searchable: true },
                    { key: 'nextOfKinContactNumber', label: 'NOK Phone', type: 'text', width: 125, editable: true, searchable: false },
                    { key: 'nextOfKinEmail', label: 'NOK Email', type: 'text', width: 170, editable: true, searchable: false },
                    { key: 'nextOfKinAddress', label: 'NOK Address', type: 'text', width: 220, editable: true, searchable: false },
                    { key: 'nextOfKinRelationshipId', label: 'NOK Relationship', type: 'select', options: this.relationships, display: 'name', value: 'id', width: 150, searchable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false }
                ];
            },
            auxColumns() {
                // shared by designations and grades (single editable Name column)
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'name', label: 'Name', type: 'text', width: 300, required: true, editable: true, searchable: true },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false }
                ];
            },
            pastEmploymentColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'staffId', label: 'Staff Member', type: 'select', options: this.staffOptions, display: 'label', value: 'id', width: 280, required: true, searchable: true },
                    { key: 'companyName', label: 'Company', type: 'text', width: 220, required: true, editable: true, searchable: true },
                    { key: 'startDate', label: 'Start Date', type: 'date', width: 125, editable: true, defaultValue: this.today },
                    { key: 'endDate', label: 'End Date', type: 'date', width: 125, editable: true, defaultValue: this.today },
                    { key: 'reason', label: 'Reason for Leaving', type: 'text', width: 260, editable: true, searchable: true },
                    { key: 'staffName', label: 'Staff Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false }
                ];
            },
            pastPositionColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'staffId', label: 'Staff Member', type: 'select', options: this.staffOptions, display: 'label', value: 'id', width: 280, required: true, searchable: true },
                    { key: 'designationId', label: 'Designation', type: 'select', options: this.designations, display: 'name', value: 'id', width: 200, required: true },
                    { key: 'designationName', label: 'Designation Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'startDate', label: 'Start Date', type: 'date', width: 125, editable: true, defaultValue: this.today },
                    { key: 'endDate', label: 'End Date', type: 'date', width: 125, editable: true, defaultValue: this.today },
                    { key: 'staffName', label: 'Staff Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false }
                ];
            },
            qualificationColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'staffId', label: 'Staff Member', type: 'select', options: this.staffOptions, display: 'label', value: 'id', width: 280, required: true, searchable: true },
                    { key: 'institute', label: 'Institute', type: 'text', width: 220, required: true, editable: true, searchable: true },
                    { key: 'programme', label: 'Programme', type: 'text', width: 200, editable: true, searchable: true },
                    { key: 'certificateId', label: 'Certificate ID', type: 'text', width: 140, editable: true, searchable: true },
                    { key: 'certificateName', label: 'Certificate', type: 'text', width: 160, editable: true, searchable: true },
                    { key: 'startDate', label: 'Start Date', type: 'date', width: 125, editable: true, defaultValue: this.today },
                    { key: 'endDate', label: 'End Date', type: 'date', width: 125, editable: true, defaultValue: this.today },
                    { key: 'isAcademic', label: 'Academic?', type: 'boolean', width: 100, searchable: false },
                    { key: 'comments', label: 'Comments', type: 'text', width: 240, editable: true, searchable: true },
                    { key: 'staffName', label: 'Staff Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false }
                ];
            },
            relationshipColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'staffId', label: 'Staff Member', type: 'select', options: this.staffOptions, display: 'label', value: 'id', width: 280, required: true, searchable: true },
                    { key: 'relationShipId', label: 'Relationship', type: 'select', options: this.relationships, display: 'name', value: 'id', width: 160, required: true },
                    { key: 'relationShipName', label: 'Relationship Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'name', label: 'Full Name', type: 'text', width: 170, required: true, editable: true, searchable: true },
                    { key: 'address', label: 'Address', type: 'text', width: 190, editable: true, searchable: true },
                    { key: 'phoneNumber', label: 'Phone', type: 'text', width: 120, editable: true, searchable: true },
                    { key: 'mobileNumber', label: 'Mobile', type: 'text', width: 120, editable: true, searchable: true },
                    { key: 'faxNumber', label: 'Fax', type: 'text', width: 110, editable: true, searchable: false, hidden:true },
                    { key: 'email', label: 'Email', type: 'text', width: 180, editable: true, searchable: true },
                    { key: 'staffName', label: 'Staff Name', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false }
                ];
            }
        },

        methods: {
            /* ==========================================================
             * helpers (methods, not top-level consts — no 'use strict')
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

            confirmDialog({ title = 'Are you sure?', text = '', confirmText = 'Yes, delete', tone = 'danger' } = {}) {
                if (typeof Swal === 'undefined') return Promise.resolve(true);
                const isDanger = tone === 'danger';
                return Swal.fire({
                    icon: 'warning',
                    title,
                    text,
                    showCancelButton: true,
                    reverseButtons: true,
                    focusCancel: true,
                    confirmButtonColor: isDanger ? '#dc2626' : '#2563eb',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: confirmText,
                    cancelButtonText: 'Cancel'
                }).then(r => !!(r && r.isConfirmed));
            },

            nameOf(list, id) {
                const item = (list || []).find(x => String(x.id).toLowerCase() === String(id || '').toLowerCase());
                return item ? item.name : '';
            },

            normalizeLookups(list) {
                return (list || [])
                    .map(o => ({ id: this.val(o, 'id'), name: this.val(o, 'name') || this.val(o, 'displayName') || '' }))
                    .filter(o => o.id != null && o.name !== '')
                    .sort((a, b) => a.name.localeCompare(b.name));
            },

            toInputDate(v) {
                const s = String(v || '');
                if (/^0001-01-01/.test(s)) return '';
                const m = s.match(/^\d{4}-\d{2}-\d{2}/);
                return m ? m[0] : '';
            },

            displayName(b) {
                return [b.titleName, b.firstName, b.otherName, b.lastName].filter(Boolean).join(' ').trim();
            },

            staffLabelOf(staffId) {
                const b = this.staffBios.find(x => String(x.id).toLowerCase() === String(staffId || '').toLowerCase());
                return b ? this.displayName(b) : '';
            },

            normalizeBio(b) {
                return {
                    id: this.val(b, 'id'),
                    staffIdentifier: this.val(b, 'staffIdentifier') || '',
                    titleId: this.val(b, 'titleId') || '',
                    titleName: this.val(b, 'titleName') || '',
                    firstName: this.val(b, 'firstName') || '',
                    otherName: this.val(b, 'otherName') || '',
                    lastName: this.val(b, 'lastName') || '',
                    dateOfBirth: this.toInputDate(this.val(b, 'dateOfBirth')),
                    gender: this.val(b, 'gender') || '',
                    contactNumber: this.val(b, 'contactNumber') || '',
                    email: this.val(b, 'email') || '',
                    address: this.val(b, 'address') || '',
                    faxNumber: this.val(b, 'faxNumber') || '',
                    designationId: this.val(b, 'designationId') || '',
                    designationName: this.val(b, 'designationName') || '',
                    gradeId: this.val(b, 'gradeId') || '',
                    gradeName: this.val(b, 'gradeName') || '',
                    socialSecurityNumber: this.val(b, 'socialSecurityNumber') || '',
                    academicYearId: this.val(b, 'academicYearId') || '',
                    academicYearName: this.val(b, 'academicYearName') || '',
                    dateOfEmployment: this.toInputDate(this.val(b, 'dateOfEmployment')),
                    dateAppointed: this.toInputDate(this.val(b, 'dateAppointed')),
                    datePromotedToGrade: this.toInputDate(this.val(b, 'datePromotedToGrade')),
                    isTeacher: this.truthy(this.val(b, 'isTeacher')),
                    notes: this.val(b, 'notes') || '',
                    nextOfKinName: this.val(b, 'nextOfKinName') || '',
                    nextOfKinContactNumber: this.val(b, 'nextOfKinContactNumber') || '',
                    nextOfKinEmail: this.val(b, 'nextOfKinEmail') || '',
                    nextOfKinAddress: this.val(b, 'nextOfKinAddress') || '',
                    nextOfKinRelationshipId: this.val(b, 'nextOfKinRelationshipId') || '',
                    tenantId: this.val(b, 'tenantId')
                };
            },

            normalizeNameOnly(o) {
                return { id: this.val(o, 'id'), name: this.val(o, 'name') || '', tenantId: this.val(o, 'tenantId') };
            },

            normalizePastEmployment(o) {
                return {
                    id: this.val(o, 'id'),
                    staffId: this.val(o, 'staffId'),
                    staffName: this.val(o, 'staffName') || '',
                    startDate: this.toInputDate(this.val(o, 'startDate')),
                    endDate: this.toInputDate(this.val(o, 'endDate')),
                    companyName: this.val(o, 'companyName') || '',
                    reason: this.val(o, 'reason') || '',
                    tenantId: this.val(o, 'tenantId')
                };
            },

            normalizePastPosition(o) {
                return {
                    id: this.val(o, 'id'),
                    staffId: this.val(o, 'staffId'),
                    staffName: this.val(o, 'staffName') || '',
                    designationId: this.val(o, 'designationId') || '',
                    designationName: this.val(o, 'designationName') || '',
                    startDate: this.toInputDate(this.val(o, 'startDate')),
                    endDate: this.toInputDate(this.val(o, 'endDate')),
                    tenantId: this.val(o, 'tenantId')
                };
            },

            normalizeQualification(o) {
                return {
                    id: this.val(o, 'id'),
                    staffId: this.val(o, 'staffId'),       // entity binds lower-case keys — kept verbatim
                    staffName: this.val(o, 'staffName') || '',
                    institute: this.val(o, 'institute') || '',
                    programme: this.val(o, 'programme') || '',
                    certificateId: this.val(o, 'certificateId') || '',   // string on the entity, never a Guid
                    certificateName: this.val(o, 'certificateName') || '',
                    startDate: this.toInputDate(this.val(o, 'startDate')),
                    endDate: this.toInputDate(this.val(o, 'endDate')),
                    isAcademic: this.truthy(this.val(o, 'isAcademic')),
                    comments: this.val(o, 'comments') || '',
                    tenantId: this.val(o, 'tenantId')
                };
            },

            normalizeStaffRelationship(o) {
                return {
                    id: this.val(o, 'id'),
                    staffId: this.val(o, 'staffId'),
                    staffName: this.val(o, 'staffName') || '',
                    relationShipId: this.val(o, 'relationShipId') || '',   // entity spelling (capital S) — kept verbatim
                    relationShipName: this.val(o, 'relationShipName') || '',
                    name: this.val(o, 'name') || '',
                    address: this.val(o, 'address') || '',
                    phoneNumber: this.val(o, 'phoneNumber') || '',
                    mobileNumber: this.val(o, 'mobileNumber') || '',
                    faxNumber: this.val(o, 'faxNumber') || '',
                    email: this.val(o, 'email') || '',
                    tenantId: this.val(o, 'tenantId')
                };
            },

            /* ==========================================================
             * data loading
             * ========================================================== */
            getSetupData() {
                this.isShimmerLoading = true;
                const stamp = new Date().getTime();
                return Promise.all([
                    axios.get('/SchoolManager/GetStaffBios/'),
                    axios.get('/SchoolManager/GetAcademicYears/'),
                    axios.get(`/JsonDataSample/titles.json?v=${stamp}`),
                    axios.get(`/JsonDataSample/relationships.json?v=${stamp}`),
                    axios.get('/SchoolManager/GetStaffDesignations/'),
                    axios.get('/SchoolManager/GetStaffGrades/'),
                    axios.get('/SchoolManager/GetStaffPastEmployments/'),
                    axios.get('/SchoolManager/GetStaffPastPositions/'),
                    axios.get('/SchoolManager/GetStaffQualifications/'),
                    axios.get('/SchoolManager/GetStaffRelationships/')
                ]).then(([bios, years, titles, relationships, designations, grades, pastEmployments, pastPositions, qualifications, staffRelationships]) => {
                    this.designations = (designations.data.result || []).map(x => this.normalizeNameOnly(x)).filter(x => x.id != null);
                    this.grades = (grades.data.result || []).map(x => this.normalizeNameOnly(x)).filter(x => x.id != null);
                    this.academicYears = this.normalizeLookups(years.data.result);
                    this.titles = this.normalizeLookups(titles.data);
                    this.relationships = this.normalizeLookups(relationships.data);
                    this.staffBios = (bios.data.result || []).map(x => this.normalizeBio(x)).filter(x => x.id != null);
                    this.pastEmployments = (pastEmployments.data.result || []).map(x => this.normalizePastEmployment(x)).filter(x => x.id != null);
                    this.pastPositions = (pastPositions.data.result || []).map(x => this.normalizePastPosition(x)).filter(x => x.id != null);
                    this.qualifications = (qualifications.data.result || []).map(x => this.normalizeQualification(x)).filter(x => x.id != null);
                    this.staffRelationships = (staffRelationships.data.result || []).map(x => this.normalizeStaffRelationship(x)).filter(x => x.id != null);
                    this.setupDone = true;
                    this.isShimmerLoading = false;
                }).catch(() => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load staff setups.');
                });
            },

            refreshAll() {
                return Promise.all([
                    axios.get('/SchoolManager/GetStaffBios/').then(r => { this.staffBios = (r.data.result || []).map(x => this.normalizeBio(x)).filter(x => x.id != null); }),
                    axios.get('/SchoolManager/GetStaffDesignations/').then(r => { this.designations = (r.data.result || []).map(x => this.normalizeNameOnly(x)).filter(x => x.id != null); }),
                    axios.get('/SchoolManager/GetStaffGrades/').then(r => { this.grades = (r.data.result || []).map(x => this.normalizeNameOnly(x)).filter(x => x.id != null); }),
                    axios.get('/SchoolManager/GetStaffPastEmployments/').then(r => { this.pastEmployments = (r.data.result || []).map(x => this.normalizePastEmployment(x)).filter(x => x.id != null); }),
                    axios.get('/SchoolManager/GetStaffPastPositions/').then(r => { this.pastPositions = (r.data.result || []).map(x => this.normalizePastPosition(x)).filter(x => x.id != null); }),
                    axios.get('/SchoolManager/GetStaffQualifications/').then(r => { this.qualifications = (r.data.result || []).map(x => this.normalizeQualification(x)).filter(x => x.id != null); }),
                    axios.get('/SchoolManager/GetStaffRelationships/').then(r => { this.staffRelationships = (r.data.result || []).map(x => this.normalizeStaffRelationship(x)).filter(x => x.id != null); })
                ]);
            },
            /* ==========================================================
             * GRID CRUD — every handler takes the grid event
             * ========================================================== */

            /* ---------- Staff Bios ---------- */
            onBioCreate(event) { return this.saveBio(event, 'create'); },
            onBioUpdate(event) { return this.saveBio(event, 'update'); },

            bioPayload(row, existing) {
                const d = (k) => row[k];
                const payload = {
                    staffIdentifier: String(d('staffIdentifier') || '').trim(),
                    firstName: String(d('firstName') || '').trim(),
                    otherName: String(d('otherName') || '').trim(),
                    lastName: String(d('lastName') || '').trim(),
                    gender: String(d('gender') || '').trim(),
                    contactNumber: String(d('contactNumber') || '').trim(),
                    email: String(d('email') || '').trim(),
                    address: String(d('address') || '').trim(),
                    faxNumber: String(d('faxNumber') || '').trim(),
                    socialSecurityNumber: String(d('socialSecurityNumber') || '').trim(),
                    isTeacher: !!d('isTeacher'),
                    notes: String(d('notes') || '').trim(),
                    nextOfKinName: String(d('nextOfKinName') || '').trim(),
                    nextOfKinContactNumber: String(d('nextOfKinContactNumber') || '').trim(),
                    nextOfKinEmail: String(d('nextOfKinEmail') || '').trim(),
                    nextOfKinAddress: String(d('nextOfKinAddress') || '').trim(),

                    // Guids: if nothing is entered, save as EMPTY_GUID
                    titleId: this.asGuid(d('titleId')),
                    titleName: d('titleId') ? this.nameOf(this.titles, d('titleId')) : '',
                    designationId: this.asGuid(d('designationId')),
                    designationName: d('designationId') ? this.nameOf(this.designations, d('designationId')) : '',
                    gradeId: this.asGuid(d('gradeId')),
                    gradeName: d('gradeId') ? this.nameOf(this.grades, d('gradeId')) : '',
                    academicYearId: this.asGuid(d('academicYearId')),
                    academicYearName: d('academicYearId') ? this.nameOf(this.academicYears, d('academicYearId')) : '',
                    nextOfKinRelationshipId: this.asGuid(d('nextOfKinRelationshipId'))
                };
                const dateOfBirth = this.toInputDate(d('dateOfBirth'));
                const dateOfEmployment = this.toInputDate(d('dateOfEmployment'));
                const dateAppointed = this.toInputDate(d('dateAppointed'));
                const datePromotedToGrade = this.toInputDate(d('datePromotedToGrade'));
                if (dateOfBirth) payload.dateOfBirth = dateOfBirth;
                if (dateOfEmployment) payload.dateOfEmployment = dateOfEmployment;
                if (dateAppointed) payload.dateAppointed = dateAppointed;
                if (datePromotedToGrade) payload.datePromotedToGrade = datePromotedToGrade;

                if (existing) {
                    payload.id = existing.id;
                    if (existing.tenantId !== undefined && existing.tenantId !== null) payload.tenantId = existing.tenantId;
                }
                return payload;
            },

            async saveBio(event, action) {
                const row = event?.row || event?.data;
                if (!row) return;
                const identifier = String(row.staffIdentifier || '').trim();
                if (!identifier) return this.toastHandler('warning', 'Staff ID is required.');
                if (!String(row.firstName || '').trim()) return this.toastHandler('warning', 'First name is required.');
                if (!String(row.lastName || '').trim()) return this.toastHandler('warning', 'Last name is required.');

                // Date of birth validation: staff must be at least 16 years old
                const dobStr = this.toInputDate(row.dateOfBirth);
                if (dobStr) {
                    const dob = new Date(dobStr);
                    const cutoff = new Date();
                    cutoff.setFullYear(cutoff.getFullYear() - 16);
                    if (dob > cutoff) {
                        return this.toastHandler('warning', 'Staff date of birth cannot be less than 16 years.');
                    }
                }

                let existing = null;
                if (action === 'update') {
                    existing = this.staffBios.find(b => String(b.id).toLowerCase() === String(row.id || '').toLowerCase());
                    if (!existing) {
                        this.toastHandler('error', 'Staff bio not found — try refreshing.');
                        await this.refreshAll();
                        return;
                    }
                    if (!this.isGuid(existing.id)) {
                        this.toastHandler('warning', 'This row has an unsaved draft id — nothing was posted.');
                        await this.refreshAll();
                        return;
                    }
                }

                const payload = this.bioPayload(row, existing);
                this.isShimmerLoading = true;
                try {
                    if (existing) {
                        await axios.post('/SchoolManager/UpdateStaffBio/', payload);
                        this.toastHandler('success', 'Staff bio updated.');
                    } else {
                        await axios.post('/SchoolManager/CreateStaffBio/', payload); // row id omitted — server assigns
                        this.toastHandler('success', 'Staff bio saved.');
                    }
                    await this.refreshAll();
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
                        rows.map(r => axios.get('/SchoolManager/DeleteStaffBio?id=' + encodeURIComponent(r.id)))
                    );
                    const failed = results.filter(r => r.status === 'rejected').length;
                    this.toastHandler(failed ? 'warning' : 'success',
                        failed ? (rows.length - failed) + ' deleted; ' + failed + ' failed.' : rows.length + ' staff record(s) deleted.');
                    await this.refreshAll();
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ---------- Designations / Grades (name-only) ---------- */
            onDesignationCreate(event) { return this.saveAux('designation', event, 'create'); },
            onDesignationUpdate(event) { return this.saveAux('designation', event, 'update'); },
            onDesignationDelete(event) { return this.deleteAux('designation', event); },
            onGradeCreate(event) { return this.saveAux('grade', event, 'create'); },
            onGradeUpdate(event) { return this.saveAux('grade', event, 'update'); },
            onGradeDelete(event) { return this.deleteAux('grade', event); },

            auxEndpoints(kind) {
                return kind === 'designation'
                    ? { create: '/SchoolManager/CreateStaffDesignation/', update: '/SchoolManager/UpdateStaffDesignation/', del: '/SchoolManager/DeleteStaffDesignation?id=' }
                    : { create: '/SchoolManager/CreateStaffGrade/', update: '/SchoolManager/UpdateStaffGrade/', del: '/SchoolManager/DeleteStaffGrade?id=' };
            },

            auxList(kind) {
                return kind === 'designation' ? this.designations : this.grades;
            },

            async saveAux(kind, event, action) {
                const row = event?.row || event?.data;
                if (!row) return;
                const name = String(row.name || '').trim();
                if (!name) return this.toastHandler('warning', 'Name is required.');
                const list = this.auxList(kind);
                const selfId = action === 'update' ? String(row.id || '').toLowerCase() : null;
                const payload = { name };
                if (action === 'update') {
                    const existing = list.find(x => String(x.id).toLowerCase() === selfId);
                    if (!existing) {
                        this.toastHandler('error', (kind === 'designation' ? 'Designation' : 'Grade') + ' not found — try refreshing.');
                        await this.refreshAll();
                        return;
                    }
                    payload.id = existing.id;
                    if (existing.tenantId !== undefined && existing.tenantId !== null) payload.tenantId = existing.tenantId;
                }
                this.isShimmerLoading = true;
                try {
                    const ep = this.auxEndpoints(kind);
                    await axios.post(action === 'update' ? ep.update : ep.create, payload);
                    this.toastHandler('success', (kind === 'designation' ? 'Designation' : 'Grade') + (action === 'update' ? ' updated.' : ' saved.'));
                    await this.refreshAll();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async deleteAux(kind, event) {
                const rows = Array.isArray(event?.rows) ? event.rows : [];
                if (!rows.length) return;
                const label = kind === 'designation' ? 'designation(s)' : 'grade(s)';

                this.isShimmerLoading = true;
                try {
                    const results = await Promise.allSettled(
                        rows.map(r => axios.get(this.auxEndpoints(kind).del + encodeURIComponent(r.id)))
                    );
                    const failed = results.filter(r => r.status === 'rejected').length;
                    this.toastHandler(failed ? 'warning' : 'success',
                        failed ? (rows.length - failed) + ' deleted; ' + failed + ' failed.' : rows.length + ' ' + label + ' deleted.');
                    await this.refreshAll();
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ---------- Child tabs: Past Employment / Past Positions / Qualifications / Relationships ---------- */
            onPastEmploymentCreate(event) { return this.saveChild('pastEmployment', event, 'create'); },
            onPastEmploymentUpdate(event) { return this.saveChild('pastEmployment', event, 'update'); },
            onPastEmploymentDelete(event) { return this.deleteChild('pastEmployment', event); },
            onPastPositionCreate(event) { return this.saveChild('pastPosition', event, 'create'); },
            onPastPositionUpdate(event) { return this.saveChild('pastPosition', event, 'update'); },
            onPastPositionDelete(event) { return this.deleteChild('pastPosition', event); },
            onQualificationCreate(event) { return this.saveChild('qualification', event, 'create'); },
            onQualificationUpdate(event) { return this.saveChild('qualification', event, 'update'); },
            onQualificationDelete(event) { return this.deleteChild('qualification', event); },
            onRelationshipCreate(event) { return this.saveChild('relationship', event, 'create'); },
            onRelationshipUpdate(event) { return this.saveChild('relationship', event, 'update'); },
            onRelationshipDelete(event) { return this.deleteChild('relationship', event); },

            childEndpoints(kind) {
                const map = {
                    pastEmployment: ['/SchoolManager/CreateStaffPastEmployment/', '/SchoolManager/UpdateStaffPastEmployment/', '/SchoolManager/DeleteStaffPastEmployment?id='],
                    pastPosition: ['/SchoolManager/CreateStaffPastPosition/', '/SchoolManager/UpdateStaffPastPosition/', '/SchoolManager/DeleteStaffPastPosition?id='],
                    qualification: ['/SchoolManager/CreateStaffQualification/', '/SchoolManager/UpdateStaffQualification/', '/SchoolManager/DeleteStaffQualification?id='],
                    relationship: ['/SchoolManager/CreateStaffRelationship/', '/SchoolManager/UpdateStaffRelationship/', '/SchoolManager/DeleteStaffRelationship?id=']
                };
                return map[kind];
            },

            childList(kind) {
                if (kind === 'pastEmployment') return this.pastEmployments;
                if (kind === 'pastPosition') return this.pastPositions;
                if (kind === 'qualification') return this.qualifications;
                return this.staffRelationships;
            },

            async saveChild(kind, event, action) {
                const row = event?.row || event?.data;
                if (!row) return;
                if (!row.staffId) return this.toastHandler('warning', 'Pick the staff member.');

                const staff = this.staffBios.find(x => String(x.id).toLowerCase() === String(row.staffId).toLowerCase());
                const staffName = staff ? this.displayName(staff) : '';

                const needsDates = kind !== 'relationship';
                const startDate = this.toInputDate(row.startDate);
                const endDate = this.toInputDate(row.endDate);
                if (needsDates) {
                    if (!startDate || !endDate) return this.toastHandler('warning', 'Pick the start and end dates.');
                    if (endDate < startDate) return this.toastHandler('warning', 'End date cannot be before the start date.');
                }
                if (kind === 'pastEmployment' && !String(row.companyName || '').trim()) return this.toastHandler('warning', 'Company name is required.');
                if (kind === 'pastPosition' && !row.designationId) return this.toastHandler('warning', 'Pick the designation held.');
                if (kind === 'qualification' && !String(row.institute || '').trim()) return this.toastHandler('warning', 'Institute is required.');
                if (kind === 'relationship' && !String(row.name || '').trim()) return this.toastHandler('warning', 'Name is required.');
                if (kind === 'relationship' && !row.relationShipId) return this.toastHandler('warning', 'Pick the relationship.');

                let existing = null;
                if (action === 'update') {
                    existing = this.childList(kind).find(x => String(x.id).toLowerCase() === String(row.id || '').toLowerCase());
                    if (!existing) {
                        this.toastHandler('error', 'Record not found — try refreshing.');
                        await this.refreshAll();
                        return;
                    }
                }

                const common = {};
                if (existing) {
                    common.id = existing.id;
                    if (existing.tenantId !== undefined && existing.tenantId !== null) common.tenantId = existing.tenantId;
                }

                let body;
                if (kind === 'pastEmployment') {
                    body = { staffId: this.asGuid(row.staffId), staffName, startDate, endDate, companyName: String(row.companyName || '').trim(), reason: String(row.reason || '').trim(), ...common };
                } else if (kind === 'pastPosition') {
                    const desId = this.asGuid(row.designationId);
                    body = { staffId: this.asGuid(row.staffId), staffName, designationId: desId, designationName: this.nameOf(this.designations, row.designationId), startDate, endDate, ...common };
                } else if (kind === 'qualification') {
                    body = {
                        staffId: this.asGuid(row.staffId), staffName,
                        institute: String(row.institute || '').trim(), programme: String(row.programme || '').trim(),
                        certificateId: String(row.certificateId || '').trim(), certificateName: String(row.certificateName || '').trim(),
                        startDate, endDate,
                        isAcademic: !!row.isAcademic, comments: String(row.comments || '').trim(),
                        ...common
                    };
                } else {
                    const relId = this.asGuid(row.relationShipId);
                    body = {
                        staffId: this.asGuid(row.staffId), staffName,
                        relationShipId: relId, relationShipName: this.nameOf(this.relationships, row.relationShipId),
                        name: String(row.name || '').trim(), address: String(row.address || '').trim(),
                        phoneNumber: String(row.phoneNumber || '').trim(), mobileNumber: String(row.mobileNumber || '').trim(),
                        faxNumber: String(row.faxNumber || '').trim(), email: String(row.email || '').trim(),
                        ...common
                    };
                }

                const ep = this.childEndpoints(kind);
                this.isShimmerLoading = true;
                try {
                    await axios.post(existing ? ep[1] : ep[0], body); // no id, no tenantId on create
                    this.toastHandler('success', existing ? 'Record updated.' : 'Record saved.');
                    await this.refreshAll();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async deleteChild(kind, event) {
                const rows = Array.isArray(event?.rows) ? event.rows : [];
                if (!rows.length) return;

                this.isShimmerLoading = true;
                try {
                    const results = await Promise.allSettled(
                        rows.map(r => axios.get(this.childEndpoints(kind)[2] + encodeURIComponent(r.id)))
                    );
                    const failed = results.filter(r => r.status === 'rejected').length;
                    this.toastHandler(failed ? 'warning' : 'success',
                        failed ? (rows.length - failed) + ' deleted; ' + failed + ' failed.' : rows.length + ' record(s) deleted.');
                    await this.refreshAll();
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ---------- Swal toast ---------- */
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
