(function () {
    'use strict';
    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };
    const today = isoDate(new Date());
    const sameId = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

    const val = (o, k) => o
        ? (o[k] !== undefined ? o[k] : o[k.charAt(0).toUpperCase() + k.slice(1)])
        : undefined;

    const newId = () => (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });

    const errMsg = err =>
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.title))
        || (err && err.message)
        || 'Something went wrong.';

    const normalizeLookups = list => (list || [])
        .map(o => ({ id: val(o, 'id'), name: val(o, 'name') || val(o, 'displayName') || '' }))
        .filter(o => o.id != null && o.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    // GetLevelClasses rows: value = row id, label = className
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
            identifier: val(s, 'studentIdentifier') || val(s, 'identifier') || val(s, 'admissionNumber') || val(s, 'studentCode') || '',
            classId: val(s, 'classId') || val(s, 'classID') || null
        }))
        .filter(s => s.id != null && s.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const truthyFlag = v => v === true || v === 1 || ['true', '1', 'yes'].includes(String(v).toLowerCase());

    // GetStaffs — keep teachers only (isTeacher). If the payload has no isTeacher
    // property anywhere, fall back to all staff rather than an empty picker.
    const normalizeTeachers = list => {
        const raw = list || [];
        const all = raw.map(s => ({
            id: val(s, 'id') || val(s, 'staffId') || val(s, 'staffID'),
            name: val(s, 'staffName') || val(s, 'fullName') || val(s, 'name')
                || [val(s, 'firstName'), val(s, 'lastName')].filter(Boolean).join(' ') || '',
            isTeacher: truthyFlag(val(s, 'isTeacher'))
        })).filter(s => s.id != null && s.name !== '');
        const anyFlag = raw.some(s => val(s, 'isTeacher') !== undefined);
        const teachers = anyFlag ? all.filter(s => s.isTeacher) : all;
        return teachers.sort((a, b) => a.name.localeCompare(b.name));
    };

    const toInputDate = v => {
        const s = String(v || '');
        const m = s.match(/^\d{4}-\d{2}-\d{2}/);
        return m ? m[0] : '';
    };

    // server TimeSpan comes back as "HH:mm:ss"; <input type="time"> wants "HH:mm"
    const toInputTime = v => {
        const s = String(v || '');
        const m = s.match(/^(\d{2}):(\d{2})/);
        return m ? m[1] + ':' + m[2] : '';
    };

    const withSeconds = v => (String(v || '').match(/^\d{2}:\d{2}:\d{2}/) ? String(v) : String(v || '00:00') + ':00');

    const prettyDate = v => {
        const s = toInputDate(v);
        if (!s) return String(v || '');
        const d = new Date(s + 'T00:00:00');
        return isNaN(d) ? s : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Students/Teachers are embedded jsonb lists — de-dupe (first wins)
    const normalizeExcursion = e => {
        const seenStu = {}, seenTeach = {};
        const students = [], teachers = [];
        (val(e, 'students') || []).forEach(s => {
            const studentId = val(s, 'studentId');
            if (!studentId || seenStu[String(studentId).toLowerCase()]) return;
            seenStu[String(studentId).toLowerCase()] = true;
            students.push({
                id: val(s, 'id') || newId(),
                excursionId: val(s, 'excursionId'),
                studentId,
                studentIdentifier: val(s, 'studentIdentifier') || '',
                studentName: val(s, 'studentName') || '',
                isPresent: !!val(s, 'isPresent')
            });
        });
        (val(e, 'teachers') || []).forEach(t => {
            const teacherId = val(t, 'teacherId');
            if (!teacherId || seenTeach[String(teacherId).toLowerCase()]) return;
            seenTeach[String(teacherId).toLowerCase()] = true;
            teachers.push({
                id: val(t, 'id') || newId(),
                excursionId: val(t, 'excursionId'),
                teacherId,
                teacherName: val(t, 'teacherName') || ''
            });
        });
        return {
            id: val(e, 'id'),
            departureDate: val(e, 'departureDate') || '',
            departureTime: toInputTime(val(e, 'departureTime')),
            returnDate: val(e, 'returnDate') || '',
            returnTime: toInputTime(val(e, 'returnTime')),
            point: val(e, 'point') || '',
            destination: val(e, 'destination') || '',
            classId: val(e, 'classId'),
            className: val(e, 'className') || '',
            academicYearId: val(e, 'academicYearId'),
            academicYearName: val(e, 'academicYearName') || '',
            termId: val(e, 'termId'),
            termName: val(e, 'termName') || '',
            tenantId: val(e, 'tenantId'),
            students,
            teachers
        };
    };

    const emptyForm = () => ({
        point: '', destination: '',
        departureDate: today, departureTime: '',
        returnDate: today, returnTime: ''
    });

    const app = Vue.createApp({
        data() {
            return {
                isShimmerLoading: true,
                activeTab: 'plan',   // 'plan' | 'saved'

                academicYears: [],
                terms: [],
                classes: [],
                students: [],
                teachers: [],
                excursions: [],

                // scope
                academicYearId: '',
                termId: '',
                classId: '',

                // plan form
                form: emptyForm(),
                attendingIds: [],        // student ids ticked (IsPresent = true); rest are saved false
                selectedTeacherIds: [],
                editingId: '',
                editingTenantId: null,
                studentFilter: '',
                teacherFilter: '',

                // saved tab
                excursionPage: 1,
                excursionsPerPage: 8
            };
        },

        computed: {
            scopeReady() {
                return !!(this.academicYearId && this.termId && this.classId);
            },
            today() {
                const d = new Date();
                return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            },
            studentsInClass() {
                if (!this.classId) return [];
                return this.students.filter(s => sameId(s.classId, this.classId));
            },
            filteredStudents() {
                const q = this.studentFilter.trim().toLowerCase();
                if (!q) return this.studentsInClass;
                return this.studentsInClass.filter(s =>
                    s.name.toLowerCase().includes(q) || String(s.identifier || '').toLowerCase().includes(q));
            },
            allFilteredStudentsAttending() {
                return this.filteredStudents.length > 0 && this.filteredStudents.every(s => this.isAttending(s.id));
            },
            filteredTeachers() {
                const q = this.teacherFilter.trim().toLowerCase();
                if (!q) return this.teachers;
                return this.teachers.filter(t => t.name.toLowerCase().includes(q));
            },
            departureAt() {
                if (!this.form.departureDate || !this.form.departureTime) return null;
                const d = new Date(this.form.departureDate + 'T' + this.form.departureTime);
                return isNaN(d) ? null : d;
            },
            returnAt() {
                if (!this.form.returnDate || !this.form.returnTime) return null;
                const d = new Date(this.form.returnDate + 'T' + this.form.returnTime);
                return isNaN(d) ? null : d;
            },
            departureBeforeReturn() {
                if (!this.departureAt || !this.returnAt) return true; // checked only when both set
                return this.returnAt >= this.departureAt;
            },
            canSave() {
                return this.scopeReady
                    && !!String(this.form.point || '').trim()
                    && !!String(this.form.destination || '').trim()
                    && !!this.form.departureDate && !!this.form.departureTime
                    && !!this.form.returnDate && !!this.form.returnTime
                    && this.departureBeforeReturn
                    && this.attendingIds.length > 0;
            },
            excursionsInScope() {
                if (!this.scopeReady) return [];
                return this.excursions
                    .filter(e => sameId(e.academicYearId, this.academicYearId) && sameId(e.termId, this.termId) && sameId(e.classId, this.classId))
                    .sort((a, b) => String(b.departureDate).localeCompare(String(a.departureDate)) || String(b.departureTime).localeCompare(String(a.departureTime)));
            },
            totalExcursionPages() {
                return Math.max(1, Math.ceil(this.excursionsInScope.length / this.excursionsPerPage));
            },
            clampedExcursionPage() {
                return Math.min(this.excursionPage, this.totalExcursionPages);
            },
            pagedExcursions() {
                const start = (this.clampedExcursionPage - 1) * this.excursionsPerPage;
                return this.excursionsInScope.slice(start, start + this.excursionsPerPage);
            }
        },

        watch: {
            academicYearId() { this.resetPlanForm(); },
            termId() { this.resetPlanForm(); },
            classId() { this.resetPlanForm(); },
            departureDate() { /* keep return >= departure honest */ }
        },

        methods: {
            /* ---------- setup ---------- */
            getSetupData() {
                this.isShimmerLoading = true;
                return Promise.all([
                    axios.get('/SchoolManager/GetAcademicYears/'),
                    axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                    axios.get('/SchoolManager/GetLevelClasses/'),
                    axios.get('/SchoolManager/GetStudentBios/'),
                    axios.get('/SchoolManager/GetStaffBios/'),
                    axios.get('/SchoolManager/GetExcursions/'),
                ]).then(([years, terms, levelClasses, bios, staffs, excursions]) => {
                    this.academicYears = normalizeLookups(years.data.result);
                    this.terms = normalizeLookups(terms.data);
                    this.classes = normalizeClasses(levelClasses.data.result);
                    this.students = normalizeStudents(bios.data.result);
                    this.teachers = normalizeTeachers(staffs.data.result);
                    this.excursions = (excursions.data.result || []).map(normalizeExcursion).filter(e => e.id != null);
                    this.resetPlanForm();
                    this.isShimmerLoading = false;
                }).catch(() => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load setups.');
                });
            },

            refreshExcursions() {
                return axios.get('/SchoolManager/GetExcursions/').then(res => {
                    this.excursions = (res.data.result || []).map(normalizeExcursion).filter(e => e.id != null);
                });
            },

            nameOf(list, id) {
                const item = list.find(x => sameId(x.id, id));
                return item ? item.name : '';
            },
            prettyDate,
            attendCount(e) {
                return (e.students || []).filter(s => s.isPresent).length;
            },

            /* ---------- reset plan form (new excursion) ---------- */
            resetPlanForm() {
                this.form = emptyForm();
                // everyone in the class attends by default — untick to mark IsPresent = false
                this.attendingIds = this.studentsInClass.map(s => s.id);
                this.selectedTeacherIds = [];
                this.editingId = '';
                this.editingTenantId = null;
                this.studentFilter = '';
                this.teacherFilter = '';
                this.excursionPage = 1;
            },

            /* ---------- students (IsPresent) ---------- */
            isAttending(id) {
                return this.attendingIds.some(x => sameId(x, id));
            },
            toggleAttend(id) {
                const i = this.attendingIds.findIndex(x => sameId(x, id));
                if (i === -1) this.attendingIds.push(id);
                else this.attendingIds.splice(i, 1);
            },
            toggleAllFilteredStudents() {
                if (this.allFilteredStudentsAttending) {
                    const filtered = {};
                    this.filteredStudents.forEach(s => { filtered[String(s.id).toLowerCase()] = true; });
                    this.attendingIds = this.attendingIds.filter(id => !filtered[String(id).toLowerCase()]);
                } else {
                    this.filteredStudents.forEach(s => { if (!this.isAttending(s.id)) this.attendingIds.push(s.id); });
                }
            },

            /* ---------- teachers ---------- */
            isTeacherSelected(id) {
                return this.selectedTeacherIds.some(x => sameId(x, id));
            },
            toggleTeacher(id) {
                const i = this.selectedTeacherIds.findIndex(x => sameId(x, id));
                if (i === -1) this.selectedTeacherIds.push(id);
                else this.selectedTeacherIds.splice(i, 1);
            },

            /* ---------- edit an existing excursion ---------- */
            editExcursion(e) {
                this.editingId = e.id;
                this.editingTenantId = e.tenantId;
                this.form = {
                    point: e.point,
                    destination: e.destination,
                    departureDate: toInputDate(e.departureDate),
                    departureTime: e.departureTime,
                    returnDate: toInputDate(e.returnDate),
                    returnTime: e.returnTime
                };
                this.attendingIds = (e.students || []).filter(s => s.isPresent).map(s => s.studentId);
                this.selectedTeacherIds = (e.teachers || []).map(t => t.teacherId);
                this.activeTab = 'plan';
            },

            /* ---------- save (create or update) ---------- */
            async saveExcursion() {
                if (!this.scopeReady) return this.toastHandler('warning', 'Pick an academic year, term and class.');
                if (!String(this.form.point || '').trim()) return this.toastHandler('warning', 'Enter the point of departure.');
                if (!String(this.form.destination || '').trim()) return this.toastHandler('warning', 'Enter the destination.');
                if (!this.form.departureDate || !this.form.departureTime) return this.toastHandler('warning', 'Pick the departure date and time.');
                if (!this.form.returnDate || !this.form.returnTime) return this.toastHandler('warning', 'Pick the return date and time.');
                if (!this.departureBeforeReturn) return this.toastHandler('warning', 'The return cannot be before the departure.');
                if (this.attendingIds.length === 0) return this.toastHandler('warning', 'Tick at least one student attending.');

                const studentById = {};
                this.studentsInClass.forEach(s => { studentById[String(s.id).toLowerCase()] = s; });
                const teacherById = {};
                this.teachers.forEach(t => { teacherById[String(t.id).toLowerCase()] = t; });

                // roster lines: full class roster with isPresent flags (create/update resend them all)
                const link = this.editingId ? { excursionId: this.editingId } : {}; // omit on create — '' is not a valid Guid
                const students = this.studentsInClass.map(s => ({
                    id: newId(),
                    ...link,
                    studentId: s.id,
                    studentIdentifier: s.identifier || '',
                    studentName: s.name,
                    isPresent: this.isAttending(s.id)
                }));
                const teachers = this.selectedTeacherIds
                    .map(id => teacherById[String(id).toLowerCase()])
                    .filter(Boolean)
                    .map(t => ({
                        id: newId(),
                        ...link,
                        teacherId: t.id,
                        teacherName: t.name
                    }));

                // soft duplicate guard against the loaded list
                const dest = String(this.form.destination || '').trim().toLowerCase();
                const dupe = this.excursionsInScope.find(e =>
                    e.id !== this.editingId
                    && String(e.destination || '').trim().toLowerCase() === dest
                    && toInputDate(e.departureDate) === this.form.departureDate);
                if (dupe && !window.confirm('An excursion to "' + this.form.destination + '" on ' + this.prettyDate(this.form.departureDate) + ' already exists for this class. Save anyway?')) {
                    return;
                }

                const payload = {
                    point: String(this.form.point).trim(),
                    destination: String(this.form.destination).trim(),
                    departureDate: this.form.departureDate,
                    departureTime: withSeconds(this.form.departureTime),
                    returnDate: this.form.returnDate,
                    returnTime: withSeconds(this.form.returnTime),
                    classId: this.classId,
                    className: this.nameOf(this.classes, this.classId),
                    academicYearId: this.academicYearId,
                    academicYearName: this.nameOf(this.academicYears, this.academicYearId),
                    termId: this.termId,
                    termName: this.nameOf(this.terms, this.termId),
                    students,
                    teachers
                };

                this.isShimmerLoading = true;
                try {
                    if (this.editingId) {
                        await axios.post('/SchoolManager/UpdateExcursion/', { ...payload, id: this.editingId, tenantId: this.editingTenantId });
                        this.toastHandler('success', 'Excursion updated.');
                    } else {
                        await axios.post('/SchoolManager/CreateExcursion/', payload); // no tenantId on create
                        this.toastHandler('success', 'Excursion saved.');
                    }
                    await this.refreshExcursions();
                    this.resetPlanForm();
                    this.activeTab = 'saved';
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ---------- delete ---------- */
            async deleteExcursion(e) {
                if (!window.confirm('Delete the excursion to "' + (e.destination || '') + '" (' + this.prettyDate(e.departureDate) + ')?')) return;
                if (this.editingId === e.id) this.resetPlanForm();
                this.isShimmerLoading = true;
                try {
                    await axios.get('/SchoolManager/DeleteExcursion?id=' + e.id);
                    this.toastHandler('success', 'Excursion deleted.');
                    await this.refreshExcursions();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ---------- saved tab pagination ---------- */
            setExcursionPage(p) {
                this.excursionPage = Math.min(Math.max(1, p), this.totalExcursionPages);
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
