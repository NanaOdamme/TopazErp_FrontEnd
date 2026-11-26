(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const ASSESSMENT_TYPES = [
        { id: 'Conduct', name: 'Conduct', icon: 'bi-shield-check' },
        { id: 'Attitude', name: 'Attitude', icon: 'bi-emoji-smile' },
        { id: 'Interest', name: 'Interest', icon: 'bi-star' }
    ];

    const SUGGESTIONS_BY_TYPE = {
        Conduct: [
            {
                category: 'Exemplary Conduct',
                icon: 'bi-star-fill',
                items: [
                    'Exemplary and courteous behavior at all times.',
                    'Very well-behaved, polite, and respectful to staff and peers.',
                    'Demonstrates high moral standards, honesty, and reliable leadership.',
                    'A role model in discipline, punctuality, and neatness.'
                ]
            },
            {
                category: 'Satisfactory & Developing Conduct',
                icon: 'bi-hand-thumbs-up-fill',
                items: [
                    'Calm, obedient, and cooperative with school rules.',
                    'Good conduct overall, but occasionally needs reminders on quietness.',
                    'Relates amicably with classmates and adheres to instructions.',
                    'Shows steady improvement in personal conduct and self-regulation.'
                ]
            },
            {
                category: 'Requires Disciplinary Attention',
                icon: 'bi-exclamation-triangle-fill',
                items: [
                    'Needs to improve in punctuality and class decorum.',
                    'Prone to playful distractions during instructional time.',
                    'Must show greater respect for school regulations and authority.',
                    'Parental guidance recommended to address recurrent classroom restlessness.'
                ]
            }
        ],
        Attitude: [
            {
                category: 'Positive & Proactive Attitude',
                icon: 'bi-emoji-sunglasses-fill',
                items: [
                    'Possesses a highly positive, enthusiastic, and curious learning attitude.',
                    'Always eager to learn, asks insightful questions, and participates actively.',
                    'Takes constructive feedback gracefully and acts upon suggestions promptly.',
                    'Displays exceptional perseverance when faced with challenging tasks.'
                ]
            },
            {
                category: 'Steady & Cooperative Attitude',
                icon: 'bi-hand-thumbs-up-fill',
                items: [
                    'Maintains a cheerful disposition and works cooperatively in team activities.',
                    'Shows positive interest in most school subjects and routines.',
                    'Willing to learn but needs continuous encouragement to speak up in group discussions.',
                    'Receptive to guidance and demonstrates a calm demeanor in class.'
                ]
            },
            {
                category: 'Needs Attitude Adjustment',
                icon: 'bi-exclamation-octagon-fill',
                items: [
                    'Lacks urgency and shows indifferent attitude towards class assignments.',
                    'Tends to give up easily when tasks become moderately difficult.',
                    'Needs to cultivate a more serious approach towards academic responsibilities.',
                    'Must develop a more proactive and committed mindset toward learning.'
                ]
            }
        ],
        Interest: [
            {
                category: 'Academic & Co-Curricular Passions',
                icon: 'bi-palette-fill',
                items: [
                    'Shows keen interest in Science, Mathematics, and creative problem solving.',
                    'Displays passionate enthusiasm for reading, creative writing, and literature.',
                    'Actively interested in debate, public speaking, and current affairs.',
                    'Very enthusiastic about ICT, coding, and technological innovations.'
                ]
            },
            {
                category: 'Sports & Practical Skills',
                icon: 'bi-trophy-fill',
                items: [
                    'Demonstrates strong interest and exceptional talent in athletic activities and sports.',
                    'Expresses deep interest in visual arts, drawing, and creative design.',
                    'Displays love for music, performing arts, and cultural presentations.',
                    'Shows remarkable affinity for practical hands-on and vocational projects.'
                ]
            },
            {
                category: 'General & Broad Interests',
                icon: 'bi-compass-fill',
                items: [
                    'Shows balanced curiosity across both indoor studies and outdoor activities.',
                    'Enjoys collaborative group projects and team problem-solving tasks.',
                    'Encouraged to explore and discover specific hobby niches this academic year.',
                    'Needs encouragement to develop sustained interest in regular reading habits.'
                ]
            }
        ]
    };

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

    const errMsg = err =>
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.title)) ||
        (err && err.message) ||
        'Something went wrong.';

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

    const normalizeAssessmentDetail = (d, parentId) => {
        const id = val(d, 'id') || uuid();
        const behavioralAssessmentId = val(d, 'behavioralAssessmentId') || parentId || EMPTY_GUID;
        return {
            id: String(id),
            behavioralAssessmentId: String(behavioralAssessmentId),
            studentId: asGuid(val(d, 'studentId')),
            studentName: String(val(d, 'studentName') || '').trim(),
            studentIdentifier: String(val(d, 'studentIdentifier') || '').trim(),
            description: String(val(d, 'description') || '').trim()
        };
    };

    const normalizeBehavioralRecord = r => {
        const id = val(r, 'id');
        const rawAssessments = val(r, 'assessments');
        let assessmentsList = [];

        if (typeof rawAssessments === 'string') {
            try {
                assessmentsList = JSON.parse(rawAssessments);
            } catch (e) {
                assessmentsList = [];
            }
        } else if (Array.isArray(rawAssessments)) {
            assessmentsList = rawAssessments;
        }

        const normalizedDetails = assessmentsList.map(d => normalizeAssessmentDetail(d, id));

        return {
            id: id ? String(id) : undefined,
            classId: asGuid(val(r, 'classId')),
            className: String(val(r, 'className') || '').trim(),
            academicYearId: asGuid(val(r, 'academicYearId')),
            academicYearName: String(val(r, 'academicYearName') || '').trim(),
            termId: asGuid(val(r, 'termId')),
            termName: String(val(r, 'termName') || '').trim(),
            assessmentType: String(val(r, 'assessmentType') || 'Conduct').trim(),
            assessments: normalizedDetails,
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
                allStudents: [],
                assessmentTypes: ASSESSMENT_TYPES,

                // Active Scope Filter
                academicYearId: '',
                termId: '',
                classId: '',

                // Tab: 'Conduct' | 'Attitude' | 'Interest'
                activeType: 'Conduct',

                // Loaded Assessment Records from API
                records: [],

                // Editable Student Rows for Active Scope & Tab
                studentRows: [],

                // Suggestions Modal
                showSuggestionsPanel: false,
                activeStudentForSuggestion: null,
                searchQuery: '',

                // Pagination
                currentPage: 1,
                pageSize: 10,
                pageSizeOptions: [5, 10, 20, 50]
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

            studentsInClass() {
                if (!this.classId) return [];
                const cId = String(this.classId).toLowerCase();
                return (this.allStudents || []).filter(s =>
                    s.classId && String(s.classId).toLowerCase() === cId
                );
            },

            existingRecord() {
                if (!this.scopeReady) return null;
                const yId = String(this.academicYearId).toLowerCase();
                const tId = String(this.termId).toLowerCase();
                const cId = String(this.classId).toLowerCase();
                const aType = String(this.activeType).toLowerCase();

                return (this.records || []).find(r =>
                    String(r.academicYearId).toLowerCase() === yId &&
                    String(r.termId).toLowerCase() === tId &&
                    String(r.classId).toLowerCase() === cId &&
                    String(r.assessmentType).toLowerCase() === aType
                ) || null;
            },

            activeCompletedCount() {
                return (this.studentRows || []).filter(r => r.description && r.description.trim().length > 0).length;
            },

            currentCategorySuggestions() {
                return SUGGESTIONS_BY_TYPE[this.activeType] || [];
            },

            filteredStudents() {
                const query = String(this.searchQuery || '').trim().toLowerCase();
                if (!query) return this.studentRows;

                return (this.studentRows || []).filter(s => {
                    const name = (s.studentName || '').toLowerCase();
                    const ident = (s.studentIdentifier || '').toLowerCase();
                    const desc = (s.description || '').toLowerCase();
                    return name.includes(query) || ident.includes(query) || desc.includes(query);
                });
            },

            totalPages() {
                const total = this.filteredStudents.length;
                return Math.max(1, Math.ceil(total / this.pageSize));
            },

            paginatedStudents() {
                const start = (this.currentPage - 1) * this.pageSize;
                return this.filteredStudents.slice(start, start + this.pageSize);
            },

            paginationStart() {
                if (this.filteredStudents.length === 0) return 0;
                return (this.currentPage - 1) * this.pageSize + 1;
            },

            paginationEnd() {
                return Math.min(this.currentPage * this.pageSize, this.filteredStudents.length);
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
            classId() {
                this.currentPage = 1;
                this.buildStudentRows();
            },
            academicYearId() {
                this.currentPage = 1;
                this.buildStudentRows();
            },
            termId() {
                this.currentPage = 1;
                this.buildStudentRows();
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
            val,
            isGuid,
            asGuid,

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

            nameOf(list, id) {
                const item = (list || []).find(x => String(x.id).toLowerCase() === String(id || '').toLowerCase());
                return item ? item.name : '';
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

            setActiveType(typeName) {
                this.activeType = typeName;
                this.currentPage = 1;
                this.buildStudentRows();
            },

            countCompleted(typeName) {
                const yId = String(this.academicYearId || '').toLowerCase();
                const tId = String(this.termId || '').toLowerCase();
                const cId = String(this.classId || '').toLowerCase();
                const typ = String(typeName).toLowerCase();

                const rec = (this.records || []).find(r =>
                    String(r.academicYearId).toLowerCase() === yId &&
                    String(r.termId).toLowerCase() === tId &&
                    String(r.classId).toLowerCase() === cId &&
                    String(r.assessmentType).toLowerCase() === typ
                );

                if (!rec || !rec.assessments) return 0;
                return rec.assessments.filter(a => a.description && a.description.trim().length > 0).length;
            },

            onDescriptionChange(row) {
                row.dirty = true;
            },

            openSuggestionsFor(row) {
                this.activeStudentForSuggestion = row;
                this.showSuggestionsPanel = true;
            },

            closeSuggestionsPanel() {
                this.showSuggestionsPanel = false;
                this.activeStudentForSuggestion = null;
            },

            selectSuggestion(text) {
                if (!this.activeStudentForSuggestion) return;
                this.activeStudentForSuggestion.description = text;
                this.activeStudentForSuggestion.dirty = true;
                this.toastHandler('success', `Applied description for ${this.activeStudentForSuggestion.studentName}`);
                this.closeSuggestionsPanel();
            },

            applyPresetToAllEmpty(presetText) {
                let count = 0;
                this.studentRows.forEach(row => {
                    if (!row.description || !row.description.trim()) {
                        row.description = presetText;
                        row.dirty = true;
                        count++;
                    }
                });
                if (count > 0) {
                    this.toastHandler('success', `Applied preset description to ${count} student(s).`);
                } else {
                    this.toastHandler('warning', 'No empty student assessment fields found.');
                }
                this.closeSuggestionsPanel();
            },

            buildStudentRows() {
                if (!this.scopeReady) {
                    this.studentRows = [];
                    return;
                }

                const rec = this.existingRecord;
                const assessmentsMap = new Map();

                if (rec && Array.isArray(rec.assessments)) {
                    rec.assessments.forEach(a => {
                        const stId = String(a.studentId).toLowerCase();
                        assessmentsMap.set(stId, a);
                    });
                }

                this.studentRows = this.studentsInClass.map(st => {
                    const stId = String(st.id).toLowerCase();
                    const existing = assessmentsMap.get(stId);

                    return {
                        id: existing ? existing.id : uuid(),
                        behavioralAssessmentId: rec ? rec.id : EMPTY_GUID,
                        studentId: this.asGuid(st.id),
                        studentName: st.name,
                        studentIdentifier: st.studentIdentifier || '',
                        description: existing ? existing.description : '',
                        dirty: false
                    };
                });
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const [yearsRes, termsRes, classesRes, studentsRes, assessmentsRes] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetStudentBios/'),
                        axios.get('/SchoolManager/GetBehavioralAssessments/')
                    ]);

                    this.academicYears = normalizeLookups(yearsRes.data && (yearsRes.data.result || yearsRes.data));
                    this.terms = normalizeLookups(termsRes.data);
                    this.classes = normalizeClasses(classesRes.data && (classesRes.data.result || classesRes.data));
                    this.allStudents = normalizeStudents(studentsRes.data && (studentsRes.data.result || studentsRes.data));

                    const rawAssessments = (assessmentsRes.data && (assessmentsRes.data.result || assessmentsRes.data)) || [];
                    this.records = (Array.isArray(rawAssessments) ? rawAssessments : []).map(normalizeBehavioralRecord);

                    this.setupDone = true;
                    this.buildStudentRows();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildPayload() {
                const yearId = this.asGuid(this.academicYearId);
                const termId = this.asGuid(this.termId);
                const classId = this.asGuid(this.classId);
                const parentId = this.existingRecord ? this.existingRecord.id : undefined;

                const detailList = (this.studentRows || [])
                    .filter(r => r.description && r.description.trim().length > 0)
                    .map(r => ({
                        id: r.id || uuid(),
                        behavioralAssessmentId: asGuid(parentId),
                        studentId: this.asGuid(r.studentId),
                        studentName: String(r.studentName || '').trim(),
                        studentIdentifier: String(r.studentIdentifier || '').trim(),
                        description: String(r.description || '').trim()
                    }));

                const payload = {
                    academicYearId: yearId,
                    academicYearName: this.nameOf(this.academicYears, yearId),
                    termId: termId,
                    termName: this.nameOf(this.terms, termId),
                    classId: classId,
                    className: this.nameOf(this.classes, classId),
                    assessmentType: this.activeType,
                    assessments: detailList
                };

                if (this.existingRecord) {
                    payload.id = this.existingRecord.id;
                    if (this.existingRecord.tenantId !== undefined && this.existingRecord.tenantId !== null) {
                        payload.tenantId = Number(this.existingRecord.tenantId);
                    }
                }

                return payload;
            },

            async saveAssessment() {
                const filledRows = (this.studentRows || []).filter(r => r.description && r.description.trim());
                if (filledRows.length === 0) {
                    return this.toastHandler('warning', 'Please enter at least one student assessment description.');
                }

                const payload = this.buildPayload();
                this.saving = true;

                try {
                    if (this.existingRecord && this.existingRecord.id) {
                        await axios.post('/SchoolManager/UpdateBehavioralAssessment/', payload);
                        this.toastHandler('success', `${this.activeType} assessment updated successfully.`);
                    } else {
                        await axios.post('/SchoolManager/CreateBehavioralAssessment/', payload);
                        this.toastHandler('success', `${this.activeType} assessment created successfully.`);
                    }

                    this.studentRows.forEach(r => { r.dirty = false; });
                    await this.refreshAssessments();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            async deleteCurrentAssessment() {
                if (!this.existingRecord || !this.existingRecord.id) return;

                const confirmed = (typeof Swal !== 'undefined')
                    ? await Swal.fire({
                        icon: 'warning',
                        title: `Delete ${this.activeType} Assessment?`,
                        text: `This will permanently delete the assessment record for ${this.selectedClass ? this.selectedClass.name : 'this class'}.`,
                        showCancelButton: true,
                        confirmButtonColor: '#dc2626',
                        cancelButtonColor: '#64748b',
                        confirmButtonText: 'Yes, delete',
                        cancelButtonText: 'Cancel'
                    }).then(r => !!r.isConfirmed)
                    : true;

                if (!confirmed) return;

                this.saving = true;
                try {
                    await axios.get(`/SchoolManager/DeleteBehavioralAssessment?id=${encodeURIComponent(this.existingRecord.id)}`);
                    this.toastHandler('success', `${this.activeType} assessment deleted successfully.`);
                    await this.refreshAssessments();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            async refreshAssessments() {
                try {
                    const res = await axios.get('/SchoolManager/GetBehavioralAssessments/');
                    const raw = (res.data && (res.data.result || res.data)) || [];
                    this.records = (Array.isArray(raw) ? raw : []).map(normalizeBehavioralRecord);
                    this.buildStudentRows();
                } catch (e) {
                    console.error('Failed to refresh behavioral assessments', e);
                }
            }
        }
    });

    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();
