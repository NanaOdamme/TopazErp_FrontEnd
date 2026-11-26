(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const TEACHER_TYPES = [
        { id: 'Class', name: 'Class Teacher Remarks' },
        { id: 'Head', name: 'Headmaster Remarks' }
    ];

    const SUGGESTIONS = [
        {
            category: 'Outstanding & Excellent',
            icon: 'bi-star-fill',
            color: 'emerald',
            remarks: [
                'An outstanding performance! Demonstrates remarkable consistency and academic excellence.',
                'Exemplary student. Shows great dedication, critical thinking, and disciplined leadership.',
                'Brilliant result. Consistently produces high-quality work in all class activities.',
                'Excellent work! Keep up this high standard of dedication.'
            ]
        },
        {
            category: 'Good & Commendable',
            icon: 'bi-hand-thumbs-up-fill',
            color: 'blue',
            remarks: [
                'A very commendable result. Shows strong potential and consistent effort.',
                'Good performance throughout the term. Capable of even higher grades with steady focus.',
                'Hardworking and attentive in class. Keep pushing forward.',
                'Steady progress observed. Encouraged to participate more actively in discussions.'
            ]
        },
        {
            category: 'Needs Encouragement & Guidance',
            icon: 'bi-lightbulb-fill',
            color: 'amber',
            remarks: [
                'Satisfactory effort, but needs to allocate more time for independent studies and homework.',
                'Shows potential but gets easily distracted. Extra focus required next term.',
                'Fair performance. Regular revision and active participation will yield better grades.',
                'Needs to work on consistency and time management in assignments.'
            ]
        },
        {
            category: 'Urgent Attention & Intervention',
            icon: 'bi-exclamation-triangle-fill',
            color: 'rose',
            remarks: [
                'Weak performance. Needs intensive academic coaching and close monitoring at home.',
                'Unsatisfactory outcome. Parent-teacher consultation urgently advised.',
                'Must take studies more seriously to avoid falling behind.',
                'Struggles with core concepts. Extra remedial support is required.'
            ]
        }
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

    const normalizeRemarkRecord = r => ({
        id: val(r, 'id') ? String(val(r, 'id')) : undefined,
        academicYearId: asGuid(val(r, 'academicYearId')),
        termId: asGuid(val(r, 'termId')),
        classId: asGuid(val(r, 'classId')),
        teacherType: String(val(r, 'teacherType') || 'Class').trim(),
        remarkType: String(val(r, 'remarkType') || 'MidTerm').trim(),
        remark: String(val(r, 'remark') || '').trim(),
        studentId: asGuid(val(r, 'studentId')),
        studentName: String(val(r, 'studentName') || '').trim(),
        studentIdentifier: String(val(r, 'studentIdentifier') || '').trim(),
        tenantId: val(r, 'tenantId') !== undefined ? Number(val(r, 'tenantId')) : undefined
    });

    const app = Vue.createApp({
        data() {
            return {
                setupDone: false,
                isShimmerLoading: true,
                saving: false,
                savingStudentId: null,
                theme: '#062a81',

                // Lookups
                academicYears: [],
                terms: [],
                classes: [],
                allStudents: [],
                teacherTypes: TEACHER_TYPES,

                // Active Scope Filter
                academicYearId: '',
                termId: '',
                classId: '',

                // Evaluation Tab: 'MidTerm' | 'Overall'
                activeTab: 'MidTerm',

                // Selected Teacher Type: 'Class' | 'Head'
                selectedTeacherType: 'Class',

                // Loaded Remarks from Server
                remarksList: [],

                // Editable Student Rows for Active Scope, Tab, and Teacher Type
                studentRows: [],

                // Modern Quick Suggestions Panel State
                suggestions: SUGGESTIONS,
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

            activeCompletedCount() {
                return (this.studentRows || []).filter(r => (r.remark && r.remark.trim().length > 0) || r.id).length;
            },

            filteredStudents() {
                const query = String(this.searchQuery || '').trim().toLowerCase();
                if (!query) return this.studentRows;

                return (this.studentRows || []).filter(s => {
                    const name = (s.studentName || '').toLowerCase();
                    const ident = (s.studentIdentifier || '').toLowerCase();
                    const remark = (s.remark || '').toLowerCase();
                    return name.includes(query) || ident.includes(query) || remark.includes(query);
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
            selectedTeacherType() {
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

            setActiveTab(tabName) {
                this.activeTab = tabName;
                this.currentPage = 1;
                this.buildStudentRows();
            },

            countTabCompleted(rType) {
                const yId = String(this.academicYearId || '').toLowerCase();
                const tId = String(this.termId || '').toLowerCase();
                const cId = String(this.classId || '').toLowerCase();
                const tType = String(this.selectedTeacherType || '').toLowerCase();

                const classStudentIds = new Set(this.studentsInClass.map(s => String(s.id).toLowerCase()));

                return (this.remarksList || []).filter(r =>
                    String(r.academicYearId).toLowerCase() === yId &&
                    String(r.termId).toLowerCase() === tId &&
                    String(r.classId).toLowerCase() === cId &&
                    String(r.teacherType).toLowerCase() === tType &&
                    String(r.remarkType).toLowerCase() === rType.toLowerCase() &&
                    classStudentIds.has(String(r.studentId).toLowerCase()) &&
                    r.remark && r.remark.trim().length > 0
                ).length;
            },

            onRemarkChange(row) {
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
                this.activeStudentForSuggestion.remark = text;
                this.activeStudentForSuggestion.dirty = true;
                this.toastHandler('success', `Applied suggestion for ${this.activeStudentForSuggestion.studentName}`);
                this.closeSuggestionsPanel();
            },

            appendQuickSnippet(row, snippet) {
                const cur = (row.remark || '').trim();
                if (!cur) {
                    row.remark = snippet;
                } else if (!cur.toLowerCase().includes(snippet.toLowerCase())) {
                    row.remark = `${cur} ${snippet}`;
                }
                row.dirty = true;
            },

            applyPresetToAllEmpty(presetText) {
                let count = 0;
                this.studentRows.forEach(row => {
                    if (!row.remark || !row.remark.trim()) {
                        row.remark = presetText;
                        row.dirty = true;
                        count++;
                    }
                });
                if (count > 0) {
                    this.toastHandler('success', `Applied preset remark to ${count} empty student row(s).`);
                } else {
                    this.toastHandler('warning', 'No empty student remark fields found.');
                }
                this.closeSuggestionsPanel();
            },

            buildStudentRows() {
                if (!this.scopeReady) {
                    this.studentRows = [];
                    return;
                }

                const yId = String(this.academicYearId).toLowerCase();
                const tId = String(this.termId).toLowerCase();
                const cId = String(this.classId).toLowerCase();
                const rType = String(this.activeTab).toLowerCase();
                const tType = String(this.selectedTeacherType).toLowerCase();

                const remarksMap = new Map();
                (this.remarksList || []).forEach(r => {
                    if (
                        String(r.academicYearId).toLowerCase() === yId &&
                        String(r.termId).toLowerCase() === tId &&
                        String(r.classId).toLowerCase() === cId &&
                        String(r.teacherType).toLowerCase() === tType &&
                        String(r.remarkType).toLowerCase() === rType
                    ) {
                        remarksMap.set(String(r.studentId).toLowerCase(), r);
                    }
                });

                this.studentRows = this.studentsInClass.map(st => {
                    const stId = String(st.id).toLowerCase();
                    const existing = remarksMap.get(stId);

                    return {
                        id: existing ? existing.id : null,
                        academicYearId: this.asGuid(this.academicYearId),
                        termId: this.asGuid(this.termId),
                        classId: this.asGuid(this.classId),
                        teacherType: this.selectedTeacherType,
                        remarkType: this.activeTab,
                        studentId: this.asGuid(st.id),
                        studentName: st.name,
                        studentIdentifier: st.studentIdentifier || '',
                        remark: existing ? existing.remark : '',
                        tenantId: existing ? existing.tenantId : undefined,
                        dirty: false
                    };
                });
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const [yearsRes, termsRes, classesRes, studentsRes, remarksRes] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetStudentBios/'),
                        axios.get('/SchoolManager/GetRemarksByTeachers/')
                    ]);

                    this.academicYears = normalizeLookups(yearsRes.data && (yearsRes.data.result || yearsRes.data));
                    this.terms = normalizeLookups(termsRes.data);
                    this.classes = normalizeClasses(classesRes.data && (classesRes.data.result || classesRes.data));
                    this.allStudents = normalizeStudents(studentsRes.data && (studentsRes.data.result || studentsRes.data));

                    const rawRemarks = (remarksRes.data && (remarksRes.data.result || remarksRes.data)) || [];
                    this.remarksList = (Array.isArray(rawRemarks) ? rawRemarks : []).map(normalizeRemarkRecord);

                    this.setupDone = true;
                    this.buildStudentRows();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildPayload(row) {
                const payload = {
                    academicYearId: this.asGuid(this.academicYearId),
                    termId: this.asGuid(this.termId),
                    classId: this.asGuid(this.classId),
                    teacherType: this.selectedTeacherType,
                    remarkType: this.activeTab,
                    remark: String(row.remark || '').trim(),
                    studentId: this.asGuid(row.studentId),
                    studentName: String(row.studentName || '').trim(),
                    studentIdentifier: String(row.studentIdentifier || '').trim()
                };

                if (row.id) {
                    payload.id = row.id;
                    if (row.tenantId !== undefined && row.tenantId !== null) {
                        payload.tenantId = Number(row.tenantId);
                    }
                }

                return payload;
            },

            async saveSingleStudent(row) {
                if (!row.dirty) {
                    return this.toastHandler('warning', 'No changes to save for this student.');
                }
                if (!row.remark || !row.remark.trim()) {
                    return this.toastHandler('warning', 'Please enter a remark before saving.');
                }

                this.savingStudentId = row.studentId;
                const payload = this.buildPayload(row);

                try {
                    if (row.id) {
                        await axios.post('/SchoolManager/UpdateRemarksByTeacher/', payload);
                        row.dirty = false;
                        this.toastHandler('success', `Remark updated for ${row.studentName}.`);
                    } else {
                        const res = await axios.post('/SchoolManager/CreateRemarksByTeacher/', payload);
                        const createdId = val(res.data, 'id') || (res.data && res.data.result && val(res.data.result, 'id'));
                        if (createdId) row.id = String(createdId);
                        row.dirty = false;
                        this.toastHandler('success', `Remark saved for ${row.studentName}.`);
                    }
                    await this.refreshRemarks();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.savingStudentId = null;
                }
            },

            async saveAllRemarks() {
                const dirtyRows = (this.studentRows || []).filter(r => r.dirty && r.remark && r.remark.trim());

                if (dirtyRows.length === 0) {
                    return this.toastHandler('warning', 'No modified student remarks to save.');
                }

                this.saving = true;
                let successCount = 0;
                let failCount = 0;

                try {
                    for (const row of dirtyRows) {
                        const payload = this.buildPayload(row);
                        try {
                            if (row.id) {
                                await axios.post('/SchoolManager/UpdateRemarksByTeacher/', payload);
                            } else {
                                const res = await axios.post('/SchoolManager/CreateRemarksByTeacher/', payload);
                                const createdId = val(res.data, 'id') || (res.data && res.data.result && val(res.data.result, 'id'));
                                if (createdId) row.id = String(createdId);
                            }
                            row.dirty = false;
                            successCount++;
                        } catch (err) {
                            failCount++;
                            console.error('Failed saving remark for student', row.studentName, err);
                        }
                    }

                    if (successCount > 0) {
                        this.toastHandler('success', `Successfully saved ${successCount} remark(s).`);
                    }
                    if (failCount > 0) {
                        this.toastHandler('warning', `${failCount} remark(s) could not be saved.`);
                    }

                    await this.refreshRemarks();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                }
            },

            async refreshRemarks() {
                try {
                    const res = await axios.get('/SchoolManager/GetRemarksByTeachers/');
                    const raw = (res.data && (res.data.result || res.data)) || [];
                    this.remarksList = (Array.isArray(raw) ? raw : []).map(normalizeRemarkRecord);
                    this.buildStudentRows();
                } catch (e) {
                    console.error('Failed to refresh teacher remarks', e);
                }
            }
        }
    });

    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();
