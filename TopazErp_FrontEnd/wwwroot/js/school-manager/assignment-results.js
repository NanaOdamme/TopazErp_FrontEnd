/* ==========================================================================
 * Assignment Results — Entry and Management of Class Assessments & Marks
 *
 * Entity Model:
 *  - ClassAssignment : AuditedEntity<Guid>
 *      public Guid AcademicYearId { get; set; }
 *      public string AcademicYearName { get; set; }
 *      public Guid TermId { get; set; }
 *      public string TermName { get; set; }
 *      public Guid ClassId { get; set; }
 *      public string ClassName { get; set; }
 *      public Guid SubjectId { get; set; }
 *      public string SubjectName { get; set; }
 *      public int AssignmentNumber { get; set; }
 *      public string Type { get; set; }             // ClassAssignment | ClassTest | HomeWork | Project | MidTerm | Exam
 *      public decimal OverallMark { get; set; }     // Default: 10
 *      public bool IsRawMark { get; set; }
 *      public bool IsPercentage { get; set; }
 *      public bool IsCanceled { get; set; }
 *      public DateTime AssignedDate { get; set; }
 *      [Column(TypeName = "jsonb")]
 *      public List<AssignmentImport> Details { get; set; }
 *      public int TenantId { get; set; }
 *
 *  - AssignmentImport:
 *      public Guid Id { get; set; }
 *      public Guid ClassAssignmentId { get; set; }
 *      public string StudentIdentifier { get; set; }
 *      public string StudentName { get; set; }
 *      public decimal Marks { get; set; }
 *
 * Controller Endpoints:
 *  - GET:    /SchoolManager/GetResults/
 *  - POST:   /SchoolManager/CreateResult/
 *  - POST:   /SchoolManager/UpdateResult/
 *  - GET:    /SchoolManager/DeleteResult?id=...
 *
 * Lookups:
 *  - Academic Years:    /SchoolManager/GetAcademicYears/
 *  - Terms:             /jsonDataSample/terms.json
 *  - Classes:           /SchoolManager/GetLevelClasses/
 *  - All Subjects:      /SchoolManager/GetSubjects/
 *  - Assigned Subjects: /SchoolManager/GetAssignedSubjects/
 *  - Students:          /SchoolManager/GetStudentBios/
 *
 * Business Rules:
 *  - Types (6): ClassAssignment, ClassTest, HomeWork, Project, MidTerm, Exam.
 *  - Default OverallMark: 10.
 *  - For MidTerm and Exam, assignmentNumber is ALWAYS 11.
 *  - For other types: checks existing non-canceled assignments matching the scope
 *    (Year + Term + Class + Subject + Type) and auto-assigns next number: (max assignmentNumber + 1), defaulting to 1.
 *  - Subject filtering: Subjects available for selection are tied to the selected ClassId
 *    via AssignedSubjects. If no subjects are assigned to that class, an informative prompt is shown.
 *  - Cancel Assignment: Calls UpdateResult with isCanceled = true.
 *  - View filter: Displays only non-canceled results (!isCanceled).
 *  - Pagination: Page size selector (5, 10, 20, 50), page navigation, range stats.
 *  - Style standards: theme: '#062a81', classes .label and .input-control.
 * ========================================================================== */
(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const ASSESSMENT_TYPES = [
        { id: 'ClassAssignment', name: 'Class Assignment' },
        { id: 'ClassTest', name: 'Class Test' },
        { id: 'HomeWork', name: 'Home Work' },
        { id: 'Project', name: 'Project' },
        { id: 'MidTerm', name: 'Mid Term' },
        { id: 'Exam', name: 'Exam' }
    ];

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

    const uuid = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
        );
    };

    const isGuid = v =>
        typeof v === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim()) &&
        v.trim() !== EMPTY_GUID;

    const asGuid = v => (isGuid(v) ? v.trim() : EMPTY_GUID);

    const todayIso = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const toInputDate = v => {
        if (!v) return todayIso();
        const s = String(v);
        const m = s.match(/^\d{4}-\d{2}-\d{2}/);
        return m ? m[0] : todayIso();
    };

    const toIsoDateTime = v => {
        const dateStr = toInputDate(v);
        return `${dateStr}T00:00:00`;
    };

    const errMsg = err =>
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.title)) ||
        (err && err.message) ||
        'Something went wrong.';

    const toastHandler = (type, message) => {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                icon: type,
                title: message
            });
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    };

    const confirmDialog = ({ title = 'Are you sure?', text = '', confirmText = 'Yes, continue', tone = 'danger' } = {}) => {
        if (typeof Swal === 'undefined') return Promise.resolve(true);
        const isDanger = tone === 'danger';
        return Swal.fire({
            icon: isDanger ? 'warning' : 'question',
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
    };

    const normalizeLookups = list => (list || [])
        .map(o => ({
            id: val(o, 'id'),
            name: val(o, 'name') || val(o, 'displayName') || ''
        }))
        .filter(o => o.id != null && o.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeClasses = list => (list || [])
        .map(c => ({
            id: val(c, 'id'),
            name: val(c, 'className') || val(c, 'name') || ''
        }))
        .filter(c => c.id != null && c.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeStudents = list => (list || [])
        .map(s => {
            const id = val(s, 'id') || val(s, 'studentId');
            const identifier = val(s, 'studentIdentifier') || val(s, 'studentID') || val(s, 'identifier') || '';
            const firstName = String(val(s, 'firstName') || '').trim();
            const otherName = String(val(s, 'otherName') || '').trim();
            const lastName = String(val(s, 'lastName') || '').trim();
            const combined = [firstName, otherName, lastName].filter(Boolean).join(' ').trim();
            const name = combined || String(val(s, 'name') || val(s, 'fullName') || val(s, 'studentName') || '').trim();
            const classId = val(s, 'classId') || val(s, 'classID');

            return {
                id: id ? String(id) : undefined,
                studentIdentifier: String(identifier).trim(),
                name: name || 'Student',
                classId: classId ? String(classId) : null
            };
        })
        .filter(s => s.id != null && s.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeAssignedSubjects = list => (list || [])
        .map(a => {
            const classId = val(a, 'classId');
            const details = val(a, 'details') || [];
            const subjectIds = Array.isArray(details)
                ? details.map(d => val(d, 'subjectId')).filter(Boolean)
                : [];
            return {
                classId: classId ? String(classId) : null,
                subjectIds: subjectIds.map(String)
            };
        })
        .filter(a => a.classId);

    const normalizeResultDetail = (d, parentId) => {
        const id = val(d, 'id') || uuid();
        const classAssignmentId = val(d, 'classAssignmentId') || parentId || EMPTY_GUID;
        return {
            id: String(id),
            classAssignmentId: asGuid(classAssignmentId),
            studentIdentifier: String(val(d, 'studentIdentifier') || '').trim(),
            studentName: String(val(d, 'studentName') || '').trim(),
            marks: Number(val(d, 'marks') ?? 0)
        };
    };

    const normalizeResult = r => {
        const id = val(r, 'id');
        const detailsRaw = val(r, 'details');
        let detailsList = [];
        if (typeof detailsRaw === 'string') {
            try {
                detailsList = JSON.parse(detailsRaw);
            } catch (e) {
                detailsList = [];
            }
        } else if (Array.isArray(detailsRaw)) {
            detailsList = detailsRaw;
        }

        const details = detailsList.map(d => normalizeResultDetail(d, id));

        return {
            id: id ? String(id) : undefined,
            academicYearId: asGuid(val(r, 'academicYearId')),
            academicYearName: String(val(r, 'academicYearName') || '').trim(),
            termId: asGuid(val(r, 'termId')),
            termName: String(val(r, 'termName') || '').trim(),
            classId: asGuid(val(r, 'classId')),
            className: String(val(r, 'className') || '').trim(),
            subjectId: asGuid(val(r, 'subjectId')),
            subjectName: String(val(r, 'subjectName') || '').trim(),
            assignmentNumber: Number(val(r, 'assignmentNumber') ?? 1),
            type: String(val(r, 'type') || 'ClassAssignment').trim(),
            overallMark: Number(val(r, 'overallMark') ?? 10),
            isRawMark: val(r, 'isRawMark') === true || String(val(r, 'isRawMark')).toLowerCase() === 'true',
            isPercentage: val(r, 'isPercentage') === true || String(val(r, 'isPercentage')).toLowerCase() === 'true',
            isCanceled: val(r, 'isCanceled') === true || String(val(r, 'isCanceled')).toLowerCase() === 'true',
            assignedDate: toInputDate(val(r, 'assignedDate')),
            details: details,
            tenantId: val(r, 'tenantId') !== undefined ? Number(val(r, 'tenantId')) : undefined
        };
    };

    const app = Vue.createApp({
        data() {
            return {
                setupDone: false,
                isShimmerLoading: true,
                saving: false,
                theme: '#062a81',

                // Lookups
                academicYears: [],
                terms: [],
                classes: [],
                allSubjects: [],
                assignedSubjectsMap: [],
                students: [],
                assessmentTypes: ASSESSMENT_TYPES,

                // Scope filters
                academicYearId: '',
                termId: '',
                classId: '',
                subjectId: '',
                selectedTypeFilter: '',
                searchQuery: '',

                // Pagination
                currentPage: 1,
                pageSize: 10,
                pageSizeOptions: [5, 10, 20, 50],

                // Stored results from API
                results: [],

                // Modal state for Add / Edit Assessment Result Entry
                modalOpen: false,
                isEditing: false,
                draft: {
                    id: null,
                    academicYearId: '',
                    termId: '',
                    classId: '',
                    subjectId: '',
                    type: 'ClassAssignment',
                    assignmentNumber: 1,
                    overallMark: 10,
                    isRawMark: true,
                    isPercentage: false,
                    assignedDate: todayIso(),
                    details: [],
                    tenantId: undefined
                }
            };
        },

        computed: {
            scopeReady() {
                return !!(this.academicYearId && this.termId && this.classId);
            },

            selectedAcademicYear() {
                return this.academicYears.find(y => String(y.id).toLowerCase() === String(this.academicYearId).toLowerCase());
            },

            selectedTerm() {
                return this.terms.find(t => String(t.id).toLowerCase() === String(this.termId).toLowerCase());
            },

            selectedClass() {
                return this.classes.find(c => String(c.id).toLowerCase() === String(this.classId).toLowerCase());
            },

            availableSubjects() {
                if (!this.classId) return [];
                const cId = String(this.classId).toLowerCase();

                const allowedSubjectIds = new Set();
                this.assignedSubjectsMap.forEach(as => {
                    if (String(as.classId).toLowerCase() === cId) {
                        as.subjectIds.forEach(id => allowedSubjectIds.add(String(id).toLowerCase()));
                    }
                });

                return (this.allSubjects || []).filter(s =>
                    allowedSubjectIds.has(String(s.id).toLowerCase())
                );
            },

            hasAssignedSubjects() {
                if (!this.classId) return true;
                return this.availableSubjects.length > 0;
            },

            filteredResults() {
                const yId = String(this.academicYearId || '').toLowerCase();
                const tId = String(this.termId || '').toLowerCase();
                const cId = String(this.classId || '').toLowerCase();
                const sId = String(this.subjectId || '').toLowerCase();
                const typeFilter = String(this.selectedTypeFilter || '').toLowerCase();
                const query = String(this.searchQuery || '').trim().toLowerCase();

                return (this.results || []).filter(r => {
                    if (r.isCanceled) return false;
                    if (yId && String(r.academicYearId).toLowerCase() !== yId) return false;
                    if (tId && String(r.termId).toLowerCase() !== tId) return false;
                    if (cId && String(r.classId).toLowerCase() !== cId) return false;
                    if (sId && String(r.subjectId).toLowerCase() !== sId) return false;
                    if (typeFilter && String(r.type).toLowerCase() !== typeFilter) return false;
                    if (query) {
                        const matchesSubj = r.subjectName && r.subjectName.toLowerCase().includes(query);
                        const matchesType = r.type && r.type.toLowerCase().includes(query);
                        const matchesNum = String(r.assignmentNumber).includes(query);
                        if (!matchesSubj && !matchesType && !matchesNum) return false;
                    }
                    return true;
                });
            },

            totalPages() {
                const total = this.filteredResults.length;
                return Math.max(1, Math.ceil(total / this.pageSize));
            },

            paginatedResults() {
                const start = (this.currentPage - 1) * this.pageSize;
                return this.filteredResults.slice(start, start + this.pageSize);
            },

            paginationStart() {
                if (this.filteredResults.length === 0) return 0;
                return (this.currentPage - 1) * this.pageSize + 1;
            },

            paginationEnd() {
                return Math.min(this.currentPage * this.pageSize, this.filteredResults.length);
            },

            pageNumbers() {
                const total = this.totalPages;
                const current = this.currentPage;
                if (total <= 7) {
                    return Array.from({ length: total }, (_, i) => i + 1);
                }
                const pages = [];
                pages.push(1);
                let start = Math.max(2, current - 1);
                let end = Math.min(total - 1, current + 1);

                if (start > 2) pages.push('...');
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < total - 1) pages.push('...');
                pages.push(total);
                return pages;
            },

            hasExceedingMarks() {
                const max = Number(this.draft.overallMark) || 0;
                return (this.draft.details || []).some(st => Number(st.marks) > max);
            },

            draftClassStudents() {
                const cId = String(this.draft.classId || this.classId || '').toLowerCase();
                if (!cId) return [];
                return (this.students || []).filter(s =>
                    s.classId && String(s.classId).toLowerCase() === cId
                );
            }
        },

        watch: {
            academicYears(list) {
                if (!this.academicYearId && list && list.length) {
                    this.academicYearId = list[0].id;
                }
            },
            terms(list) {
                if (!this.termId && list && list.length) {
                    this.termId = list[0].id;
                }
            },
            classes(list) {
                if (!this.classId && list && list.length) {
                    this.classId = list[0].id;
                }
            },
            classId(newVal) {
                if (this.subjectId) {
                    const exists = this.availableSubjects.some(s => String(s.id).toLowerCase() === String(this.subjectId).toLowerCase());
                    if (!exists) this.subjectId = '';
                }
                this.currentPage = 1;
            },
            subjectId() {
                this.currentPage = 1;
            },
            selectedTypeFilter() {
                this.currentPage = 1;
            },
            searchQuery() {
                this.currentPage = 1;
            },
            pageSize() {
                this.currentPage = 1;
            }
        },

        mounted() {
            this.getSetupData();
        },

        methods: {
            errMsg,
            toastHandler,
            confirmDialog,
            val,
            isGuid,
            asGuid,
            todayIso,
            toInputDate,
            toIsoDateTime,

            nameOf(list, id) {
                const item = (list || []).find(x => String(x.id).toLowerCase() === String(id || '').toLowerCase());
                return item ? item.name : '';
            },

            getTypeName(typeId) {
                const item = ASSESSMENT_TYPES.find(t => t.id === typeId);
                return item ? item.name : typeId;
            },

            setPage(page) {
                if (page < 1 || page > this.totalPages || page === '...') return;
                this.currentPage = page;
            },

            nextPage() {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                }
            },

            prevPage() {
                if (this.currentPage > 1) {
                    this.currentPage--;
                }
            },

            getAverageScore(details, overall) {
                if (!details || details.length === 0 || !overall) return '0%';
                const sum = details.reduce((acc, d) => acc + (Number(d.marks) || 0), 0);
                const avg = sum / details.length;
                const pct = Math.round((avg / overall) * 100);
                return `${pct}%`;
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const safeGet = promise => promise.catch(() => ({ data: { result: [] } }));

                    const [yearsRes, termsRes, classesRes, subjectsRes, assignedSubRes, studentsRes, resultsRes] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetSubjects/'),
                        safeGet(axios.get('/SchoolManager/GetAssignedSubjects/')),
                        axios.get('/SchoolManager/GetStudentBios/'),
                        axios.get('/SchoolManager/GetResults/')
                    ]);

                    this.academicYears = normalizeLookups(yearsRes.data && (yearsRes.data.result || yearsRes.data));
                    this.terms = normalizeLookups(termsRes.data);
                    this.classes = normalizeClasses(classesRes.data && (classesRes.data.result || classesRes.data));
                    this.allSubjects = normalizeLookups(subjectsRes.data && (subjectsRes.data.result || subjectsRes.data));
                    const assignedList = (assignedSubRes.data && (assignedSubRes.data.result || assignedSubRes.data)) || [];
                    this.assignedSubjectsMap = normalizeAssignedSubjects(assignedList);
                    const studentList = (studentsRes.data && (studentsRes.data.result || studentsRes.data)) || [];
                    this.students = normalizeStudents(studentList);

                    const rawResults = (resultsRes.data && (resultsRes.data.result || resultsRes.data)) || [];
                    this.results = (Array.isArray(rawResults) ? rawResults : []).map(normalizeResult);

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            computeNextAssignmentNumber(yearId, termId, classId, subjectId, type) {
                if (type === 'MidTerm' || type === 'Exam') {
                    return 11;
                }

                const y = String(yearId).toLowerCase();
                const t = String(termId).toLowerCase();
                const c = String(classId).toLowerCase();
                const s = String(subjectId).toLowerCase();
                const typ = String(type).toLowerCase();

                const matching = (this.results || []).filter(r =>
                    !r.isCanceled &&
                    String(r.academicYearId).toLowerCase() === y &&
                    String(r.termId).toLowerCase() === t &&
                    String(r.classId).toLowerCase() === c &&
                    String(r.subjectId).toLowerCase() === s &&
                    String(r.type).toLowerCase() === typ
                );

                if (matching.length === 0) return 1;

                const maxNum = matching.reduce((max, r) => Math.max(max, Number(r.assignmentNumber) || 0), 0);
                return maxNum + 1;
            },

            onDraftTypeOrSubjectChange() {
                if (this.isEditing) return;
                this.draft.assignmentNumber = this.computeNextAssignmentNumber(
                    this.draft.academicYearId,
                    this.draft.termId,
                    this.draft.classId,
                    this.draft.subjectId,
                    this.draft.type
                );
            },

            openCreateModal() {
                if (!this.scopeReady) {
                    return this.toastHandler('warning', 'Please select Academic Year, Term, and Class.');
                }
                if (!this.hasAssignedSubjects) {
                    return this.toastHandler('warning', 'The selected class has no assigned subjects.');
                }

                const initialSubjectId = this.subjectId || (this.availableSubjects.length ? this.availableSubjects[0].id : '');
                const initialType = 'ClassAssignment';
                const nextNumber = this.computeNextAssignmentNumber(
                    this.academicYearId,
                    this.termId,
                    this.classId,
                    initialSubjectId,
                    initialType
                );

                const classStudents = (this.students || []).filter(s =>
                    s.classId && String(s.classId).toLowerCase() === String(this.classId).toLowerCase()
                );

                const detailRows = classStudents.map(st => ({
                    id: uuid(),
                    classAssignmentId: EMPTY_GUID,
                    studentIdentifier: st.studentIdentifier || '',
                    studentName: st.name,
                    marks: 0
                }));

                this.draft = {
                    id: null,
                    academicYearId: this.academicYearId,
                    termId: this.termId,
                    classId: this.classId,
                    subjectId: initialSubjectId,
                    type: initialType,
                    assignmentNumber: nextNumber,
                    overallMark: 10,
                    isRawMark: true,
                    isPercentage: false,
                    assignedDate: todayIso(),
                    details: detailRows,
                    tenantId: undefined
                };

                this.isEditing = false;
                this.modalOpen = true;
            },

            openEditModal(item) {
                const existingDetails = item.details || [];
                const classStudents = (this.students || []).filter(s =>
                    s.classId && String(s.classId).toLowerCase() === String(item.classId).toLowerCase()
                );

                const detailsMap = new Map();
                existingDetails.forEach(d => {
                    const key = (d.studentIdentifier || d.studentName || '').toLowerCase();
                    detailsMap.set(key, d);
                });

                const mergedDetails = classStudents.map(st => {
                    const key = (st.studentIdentifier || st.name || '').toLowerCase();
                    const existing = detailsMap.get(key);
                    return {
                        id: existing ? existing.id : uuid(),
                        classAssignmentId: asGuid(item.id),
                        studentIdentifier: st.studentIdentifier || (existing ? existing.studentIdentifier : ''),
                        studentName: st.name || (existing ? existing.studentName : ''),
                        marks: existing ? Number(existing.marks ?? 0) : 0
                    };
                });

                this.draft = {
                    id: item.id,
                    academicYearId: item.academicYearId,
                    termId: item.termId,
                    classId: item.classId,
                    subjectId: item.subjectId,
                    type: item.type,
                    assignmentNumber: item.assignmentNumber,
                    overallMark: item.overallMark,
                    isRawMark: item.isRawMark,
                    isPercentage: item.isPercentage,
                    assignedDate: item.assignedDate,
                    details: mergedDetails.length ? mergedDetails : existingDetails,
                    tenantId: item.tenantId
                };

                this.isEditing = true;
                this.modalOpen = true;
            },

            closeModal() {
                this.modalOpen = false;
                this.isEditing = false;
            },

            buildPayload(draft) {
                const yearId = this.asGuid(draft.academicYearId);
                const termId = this.asGuid(draft.termId);
                const classId = this.asGuid(draft.classId);
                const subjectId = this.asGuid(draft.subjectId);
                const parentId = draft.id || undefined;

                const details = (draft.details || []).map(d => ({
                    id: d.id || uuid(),
                    classAssignmentId: asGuid(parentId),
                    studentIdentifier: String(d.studentIdentifier || '').trim(),
                    studentName: String(d.studentName || '').trim(),
                    marks: Number(d.marks ?? 0)
                }));

                const payload = {
                    academicYearId: yearId,
                    academicYearName: this.nameOf(this.academicYears, yearId),
                    termId: termId,
                    termName: this.nameOf(this.terms, termId),
                    classId: classId,
                    className: this.nameOf(this.classes, classId),
                    subjectId: subjectId,
                    subjectName: this.nameOf(this.allSubjects, subjectId),
                    assignmentNumber: Number(draft.assignmentNumber || 1),
                    type: draft.type,
                    overallMark: Number(draft.overallMark ?? 10),
                    isRawMark: Boolean(draft.isRawMark),
                    isPercentage: Boolean(draft.isPercentage),
                    isCanceled: false,
                    assignedDate: toIsoDateTime(draft.assignedDate),
                    details: details
                };

                if (draft.id) {
                    payload.id = draft.id;
                    if (draft.tenantId !== undefined && draft.tenantId !== null) {
                        payload.tenantId = Number(draft.tenantId);
                    }
                }

                return payload;
            },

            isMarkExceeding(mark) {
                const max = Number(this.draft.overallMark) || 0;
                return Number(mark) > max;
            },

            async saveResult() {
                if (this.hasExceedingMarks) {
                    return this.toastHandler('error', 'One or more student marks exceed the overall mark of ' + this.draft.overallMark + '. Please correct them before saving.');
                }
                if (!this.draft.subjectId) {
                    return this.toastHandler('warning', 'Please select a Subject.');
                }
                if (!this.draft.details || this.draft.details.length === 0) {
                    return this.toastHandler('warning', 'No students found in this class to enter marks.');
                }

                const payload = this.buildPayload(this.draft);
                this.saving = true;
                try {
                    if (this.isEditing && this.draft.id) {
                        await axios.post('/SchoolManager/UpdateResult/', payload);
                        this.toastHandler('success', 'Assessment result updated successfully.');
                    } else {
                        await axios.post('/SchoolManager/CreateResult/', payload);
                        this.toastHandler('success', 'Assessment result created successfully.');
                    }
                    this.closeModal();
                    await this.refreshResults();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            async cancelAssignment(item) {
                const confirmed = await confirmDialog({
                    title: 'Cancel Assessment?',
                    text: `Are you sure you want to cancel ${this.getTypeName(item.type)} #${item.assignmentNumber} for ${item.subjectName}? It will no longer appear in result sheets.`,
                    confirmText: 'Yes, cancel assessment',
                    tone: 'danger'
                });
                if (!confirmed) return;

                this.saving = true;
                try {
                    const payload = {
                        id: item.id,
                        academicYearId: item.academicYearId,
                        academicYearName: item.academicYearName,
                        termId: item.termId,
                        termName: item.termName,
                        classId: item.classId,
                        className: item.className,
                        subjectId: item.subjectId,
                        subjectName: item.subjectName,
                        assignmentNumber: item.assignmentNumber,
                        type: item.type,
                        overallMark: item.overallMark,
                        isRawMark: item.isRawMark,
                        isPercentage: item.isPercentage,
                        isCanceled: true,
                        assignedDate: toIsoDateTime(item.assignedDate),
                        tenantId: item.tenantId,
                        details: item.details || []
                    };

                    await axios.post('/SchoolManager/UpdateResult/', payload);
                    this.toastHandler('success', 'Assessment canceled.');
                    await this.refreshResults();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            async refreshResults() {
                try {
                    const res = await axios.get('/SchoolManager/GetResults/');
                    const raw = (res.data && (res.data.result || res.data)) || [];
                    this.results = (Array.isArray(raw) ? raw : []).map(normalizeResult);
                } catch (e) {
                    console.error('Failed to refresh results', e);
                }
            }
        }
    });

    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();
