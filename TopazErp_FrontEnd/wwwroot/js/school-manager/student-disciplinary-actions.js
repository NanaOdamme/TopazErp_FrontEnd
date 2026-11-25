(function () {
    'use strict';

    const sameId = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

    const val = (o, k) => o
        ? (o[k] !== undefined ? o[k] : o[k.charAt(0).toUpperCase() + k.slice(1)])
        : undefined;

    const errMsg = err =>
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.title))
        || (err && err.message)
        || 'Something went wrong.';

    const normalizeLookups = list => (list || [])
        .map(o => ({ id: val(o, 'id'), name: val(o, 'name') || val(o, 'displayName') || val(o, 'offenseName') || '' }))
        .filter(o => o.id != null && o.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    // GetLevelClasses rows: value = row id, label = className (streams stay separate rows)
    const normalizeClasses = list => (list || [])
        .map(c => ({
            id: val(c, 'id'),
            name: val(c, 'className') || '',
            streamName: val(c, 'streamName') || '',
            ordinal: val(c, 'ordinal') || 0
        }))
        .filter(c => c.id != null && c.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name) || a.streamName.localeCompare(b.streamName) || (a.ordinal - b.ordinal))
        .map(({ id, name }) => ({ id, name }));

    // GetStudentBios — bios carry classId (the same GetLevelClasses row id)
    const normalizeStudents = list => (list || [])
        .map(s => ({
            id: val(s, 'id') || val(s, 'studentId') || val(s, 'studentID'),
            name: val(s, 'studentName') || val(s, 'fullName') || val(s, 'name')
                || [val(s, 'firstName'), val(s, 'lastName')].filter(Boolean).join(' ') || '',
            classId: val(s, 'classId') || val(s, 'classID') || null
        }))
        .filter(s => s.id != null && s.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const toInputDate = v => {
        const s = String(v || '');
        const m = s.match(/^\d{4}-\d{2}-\d{2}/);
        return m ? m[0] : '';
    };

    const prettyDate = v => {
        const s = toInputDate(v);
        if (!s) return String(v || '');
        const d = new Date(s + 'T00:00:00');
        return isNaN(d) ? s : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const normalizeActions = list => (list || [])
        .map(a => ({
            id: val(a, 'id'),
            academicYearId: val(a, 'academicYearId'),
            academicYearName: val(a, 'academicYearName') || '',
            classId: val(a, 'classId'),
            className: val(a, 'className') || '',
            offenseId: val(a, 'offenseId'),
            offenseName: val(a, 'offenseName') || '',
            studentId: val(a, 'studentId'),
            studentName: val(a, 'studentName') || '',
            description: val(a, 'description') || '',
            actionDate: val(a, 'actionDate') || '',
            tenantId: val(a, 'tenantId')
        }))
        .filter(a => a.id != null);

    // Windowed page numbers with ellipsis: [1, '…', 4, 5, 6, '…', 9]
    const pageWindow = (current, total) => {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const pages = new Set([1, total, current - 1, current, current + 1]);
        const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
        const out = [];
        let prev = 0;
        for (const p of sorted) {
            if (p - prev > 1) out.push('…');
            out.push(p);
            prev = p;
        }
        return out;
    };

    const app = Vue.createApp({
        data() {
            return {
                isShimmerLoading: true,

                academicYears: [],
                classes: [],
                students: [],
                offenses: [],
                actions: [],

                academicYearId: '',
                classId: '',

                studentFilter: '',
                studentPage: 1,
                studentsPerPage: 10,

                expandedStudentId: '', 
                actionPages: {},
                actionsPerPage: 4,

                editingStudentId: '',
                editingActionId: '',
                draft: { offenseId: '', description: '', actionDate: '' }
            };
        },

        computed: {
            scopeReady() {
                return !!(this.academicYearId && this.classId);
            },
            today() {
                const d = new Date();
                return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            },
            studentsInClass() {
                if (!this.classId) return [];
                return this.students.filter(s => sameId(s.classId, this.classId));
            },
            visibleStudents() {
                const q = this.studentFilter.trim().toLowerCase();
                if (!q) return this.studentsInClass;
                return this.studentsInClass.filter(s => s.name.toLowerCase().includes(q));
            },
            totalStudentPages() {
                return Math.max(1, Math.ceil(this.visibleStudents.length / this.studentsPerPage));
            },
            clampedStudentPage() {
                return Math.min(this.studentPage, this.totalStudentPages);
            },
            pagedStudents() {
                const start = (this.clampedStudentPage - 1) * this.studentsPerPage;
                return this.visibleStudents.slice(start, start + this.studentsPerPage);
            },
            studentPageNumbers() {
                return pageWindow(this.clampedStudentPage, this.totalStudentPages);
            },
            studentShowingFrom() {
                return this.visibleStudents.length === 0 ? 0 : (this.clampedStudentPage - 1) * this.studentsPerPage + 1;
            },
            studentShowingTo() {
                return Math.min(this.clampedStudentPage * this.studentsPerPage, this.visibleStudents.length);
            },
            actionsInScope() {
                if (!this.scopeReady) return [];
                return this.actions
                    .filter(a => sameId(a.academicYearId, this.academicYearId) && sameId(a.classId, this.classId))
                    .sort((a, b) => String(b.actionDate).localeCompare(String(a.actionDate)));
            },
            actionsByStudent() {
                const map = {};
                this.actionsInScope.forEach(a => {
                    const key = String(a.studentId || '').toLowerCase();
                    (map[key] = map[key] || []).push(a);
                });
                return map;
            }
        },

        watch: {
            studentFilter() { this.studentPage = 1; },
            academicYearId() { this.resetScopeState(); },
            classId() { this.resetScopeState(); }
        },

        methods: {
            /* ---------- setup ---------- */
            getSetupData() {
                this.isShimmerLoading = true;
                return Promise.all([
                    axios.get('/SchoolManager/GetAcademicYears/'),
                    axios.get('/SchoolManager/GetLevelClasses/'),
                    axios.get('/SchoolManager/GetStudentBios/'),
                    axios.get('/SchoolManager/GetOffences/'),
                    axios.get('/SchoolManager/GetStDisciplinaryActions/'),
                ]).then(([years, levelClasses, bios, offenses, actions]) => {
                    this.academicYears = normalizeLookups(years.data.result);
                    this.classes = normalizeClasses(levelClasses.data.result);
                    this.students = normalizeStudents(bios.data.result);
                    this.offenses = normalizeLookups(offenses.data.result);
                    this.actions = normalizeActions(actions.data.result);
                    this.resetScopeState();
                    this.isShimmerLoading = false;
                }).catch(() => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load setups.');
                });
            },

            refreshActions() {
                return axios.get('/SchoolManager/GetStDisciplinaryActions/').then(res => {
                    this.actions = normalizeActions(res.data.result);
                });
            },

            resetScopeState() {
                this.studentPage = 1;
                this.expandedStudentId = '';
                this.actionPages = {};
            },

            nameOf(list, id) {
                const item = list.find(x => sameId(x.id, id));
                return item ? item.name : '';
            },
            actionsFor(studentId) {
                return this.actionsByStudent[String(studentId || '').toLowerCase()] || [];
            },
            initials(name) {
                return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
            },
            prettyDate,
            toInputDate,

            /* ---------- students table pagination ---------- */
            studentGlobalIndex(index) {
                return (this.clampedStudentPage - 1) * this.studentsPerPage + index + 1;
            },
            setStudentPage(p) {
                if (typeof p !== 'number') return; // ellipsis clicks
                this.studentPage = Math.min(Math.max(1, p), this.totalStudentPages);
            },

            /* ---------- child table (per-student) pagination ---------- */
            actionPageKey(studentId) {
                return String(studentId || '').toLowerCase();
            },
            actionCurrentPage(studentId) {
                return this.actionPages[this.actionPageKey(studentId)] || 1;
            },
            actionTotalPages(studentId) {
                return Math.max(1, Math.ceil(this.actionsFor(studentId).length / this.actionsPerPage));
            },
            actionClampedPage(studentId) {
                return Math.min(this.actionCurrentPage(studentId), this.actionTotalPages(studentId));
            },
            pagedActions(studentId) {
                const list = this.actionsFor(studentId);
                const page = this.actionClampedPage(studentId);
                const start = (page - 1) * this.actionsPerPage;
                return list.slice(start, start + this.actionsPerPage);
            },
            actionShowingFrom(studentId) {
                const total = this.actionsFor(studentId).length;
                return total === 0 ? 0 : (this.actionClampedPage(studentId) - 1) * this.actionsPerPage + 1;
            },
            actionShowingTo(studentId) {
                return Math.min(this.actionClampedPage(studentId) * this.actionsPerPage, this.actionsFor(studentId).length);
            },
            setActionPage(studentId, p) {
                this.actionPages = { ...this.actionPages, [this.actionPageKey(studentId)]: Math.min(Math.max(1, p), this.actionTotalPages(studentId)) };
            },
            toggleExpand(student) {
                this.expandedStudentId = this.expandedStudentId === student.id ? '' : student.id;
            },

            /* ---------- open the inline editor (add or edit) ---------- */
            openAddFor(student) {
                this.expandedStudentId = student.id;
                this.editingStudentId = student.id;
                this.editingActionId = '';
                this.draft = { offenseId: '', description: '', actionDate: this.today };
            },
            openEditFor(student, action) {
                this.expandedStudentId = student.id;
                this.editingStudentId = student.id;
                this.editingActionId = action.id;
                this.draft = {
                    offenseId: action.offenseId,
                    description: action.description || '',
                    actionDate: toInputDate(action.actionDate)
                };
            },
            cancelEditor() {
                this.editingStudentId = '';
                this.editingActionId = '';
                this.draft = { offenseId: '', description: '', actionDate: '' };
            },

            /* ---------- save (create or update) ---------- */
            async saveEditor(student) {
                const offense = this.offenses.find(o => sameId(o.id, this.draft.offenseId));
                if (!offense) return this.toastHandler('warning', 'Pick an offense.');
                if (!this.draft.actionDate) return this.toastHandler('warning', 'Pick the date of the action.');

                const description = String(this.draft.description || '').trim();
                const actionDate = this.draft.actionDate;
                const studentActions = this.actionsFor(student.id);

                this.isShimmerLoading = true;
                try {
                    if (this.editingActionId) {
                        // ---- UPDATE — spread existing, override the edited fields, tenantId only here ----
                        const existing = this.actions.find(a => sameId(a.id, this.editingActionId));
                        if (!existing) {
                            this.toastHandler('error', 'Action was not found.');
                            return;
                        }
                        const payload = {
                            ...existing,
                            id: existing.id,
                            tenantId: existing.tenantId,
                            offenseId: offense.id,
                            offenseName: offense.name,
                            description,
                            actionDate
                        };
                        await axios.post('/SchoolManager/UpdateStDisciplinaryAction/', payload);
                        this.toastHandler('success', 'Disciplinary action updated.');
                    } else {
                        // ---- CREATE — block an identical re-entry for the same student on the same date ----
                        const dupe = studentActions.some(a =>
                            sameId(a.offenseId, offense.id) && toInputDate(a.actionDate) === actionDate);
                        if (dupe) {
                            this.toastHandler('warning', 'This offense is already recorded for ' + student.name + ' on that date.');
                            return;
                        }

                        const payload = {
                            academicYearId: this.academicYearId,
                            academicYearName: this.nameOf(this.academicYears, this.academicYearId),
                            classId: this.classId,
                            className: this.nameOf(this.classes, this.classId),
                            offenseId: offense.id,
                            offenseName: offense.name,
                            studentId: student.id,
                            studentName: student.name,
                            description,
                            actionDate
                        }; // no tenantId on create
                        await axios.post('/SchoolManager/CreateStDisciplinaryAction/', payload);
                        this.toastHandler('success', 'Disciplinary action recorded.');
                        // jump the child table to the first page (newest first)
                        this.setActionPage(student.id, 1);
                    }

                    await this.refreshActions();
                    this.cancelEditor();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ---------- delete ---------- */
            async deleteAction(action) {
                if (!window.confirm('Delete the "' + (action.offenseName || 'offense') + '" action dated ' + this.prettyDate(action.actionDate) + '?')) return;
                this.isShimmerLoading = true;
                try {
                    await axios.get('/SchoolManager/DeleteStDisciplinaryAction?id=' + action.id);
                    this.toastHandler('success', 'Action deleted.');
                    await this.refreshActions();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ---------- Swal toast (same as your other pages) ---------- */
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
        },
    });

   
        app.use(WSelectPlugin);
  

    app.mount('#app');
})();
