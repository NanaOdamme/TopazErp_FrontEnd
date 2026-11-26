(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const DEFAULT_DATE_TIME = '0001-01-01T00:00:00';

    /* ==============================================================
     * ENDPOINTS — Attendance
     * ============================================================== */
    const ENDPOINTS = {
        // daily attendance
        attendances: '/SchoolManager/GetAttendances/',
        createAttendance: '/SchoolManager/CreateAttendance/',
        updateAttendance: '/SchoolManager/UpdateAttendance/',
        deleteAttendance: '/SchoolManager/DeleteAttendance',

        // cumulative attendance
        cumulative: '/SchoolManager/GetCumulativeAttendances/',
        createCumulative: '/SchoolManager/CreateCumulativeAttendance/',
        updateCumulative: '/SchoolManager/UpdateCumulativeAttendance/',
        deleteCumulative: '/SchoolManager/DeleteCumulativeAttendance',

        // lookups
        students: '/SchoolManager/GetStudentBios/',
        classes: '/SchoolManager/GetLevelClasses/',
        academicYears: '/SchoolManager/GetAcademicYears/',
        terms: '/jsonDataSample/terms.json'
    };

    /* ---------------- helpers ---------------- */
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

    /** Students are displayed as: lastName firstName otherName */
    const buildStudentFullName = (lastName, firstName, otherName) =>
        [lastName, firstName, otherName].map(p => String(p || '').trim()).filter(Boolean).join(' ');

    const normalizeStudents = list => (list || [])
        .map(s => {
            const id = val(s, 'id') || val(s, 'studentId') || val(s, 'studentID');
            const firstName = String(val(s, 'firstName') || '').trim();
            const lastName = String(val(s, 'lastName') || '').trim();
            const otherName = String(val(s, 'otherName') || '').trim();
            const fullName = buildStudentFullName(lastName, firstName, otherName);
            return {
                id,
                fullName,
                name: fullName,
                identifier: String(val(s, 'studentIdentifier') || val(s, 'identifier') || val(s, 'admissionNumber') || '').trim(),
                classId: val(s, 'classId') || val(s, 'classID') || null
            };
        })
        .filter(s => s.id != null && s.fullName !== '')
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const normalizeClasses = list => (list || [])
        .map(c => ({
            id: val(c, 'id'),
            name: val(c, 'className') || val(c, 'name') || '',
            className: val(c, 'className') || val(c, 'name') || ''
        }))
        .filter(c => c.id != null && c.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeLookups = list => (list || [])
        .map(o => ({
            id: val(o, 'id'),
            name: val(o, 'name') || val(o, 'displayName') || val(o, 'className') || '',
            className: val(o, 'className') || val(o, 'name') || ''
        }))
        .filter(o => o.id != null && (o.name !== '' || o.className !== ''))
        .sort((a, b) => (a.name || a.className).localeCompare(b.name || b.className));

    /* ---------------- modal state factories ---------------- */
    const emptyDailyForm = () => ({
        classId: '',
        date: isoDate(new Date()),
        rows: []
    });

    const emptyCumulativeForm = () => ({
        academicYearId: '',
        termId: '',
        classId: '',
        rows: []
    });

    const app = Vue.createApp({
        data() {
            return {
                theme: '#062a81',
                isShimmerLoading: false,
                saving: false,
                busy: false,
                setupDone: false,

                // 'daily' | 'cumulative'
                attendanceType: 'daily',

                // lookups
                classes: [],
                academicYears: [],
                terms: [],
                allStudents: [],

                // collections
                attendances: [],
                cumulativeAttendances: [],

                // daily modal
                dailyModalOpen: false,
                dailyForm: emptyDailyForm(),

                // cumulative modal
                cumulativeModalOpen: false,
                cumulativeForm: emptyCumulativeForm(),
                cumulativeFillDays: 0
            };
        },

        computed: {
            /* ================= GRID COLUMNS ================= */
            dailyColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false },
                    { key: 'date', label: 'Date', type: 'date', width: 130, searchable: true, editable: false },
                    {
                        key: 'classId',
                        label: 'Class',
                        type: 'select',
                        width: 180,
                        options: this.classes,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    { key: 'studentName', label: 'Student Name', type: 'text', width: 240, searchable: true, editable: false },
                    { key: 'studentIdentifier', label: 'Student ID', type: 'text', width: 150, searchable: true, editable: false },
                    { key: 'isPresent', label: 'Present?', type: 'boolean', width: 110, editable: false }
                ];
            },

            cumulativeColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false },
                    {
                        key: 'academicYearId',
                        label: 'Academic Year',
                        type: 'select',
                        width: 160,
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
                    {
                        key: 'classId',
                        label: 'Class',
                        type: 'select',
                        width: 170,
                        options: this.classes,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    { key: 'studentName', label: 'Student Name', type: 'text', width: 240, searchable: true, editable: false },
                    { key: 'studentIdentifier', label: 'Student ID', type: 'text', width: 150, searchable: true, editable: false },
                    { key: 'days', label: 'Days', type: 'number', width: 110, editable: false }
                ];
            },

            /* ================= roster helpers ================= */
            dailyRows() {
                return Array.isArray(this.dailyForm.rows) ? this.dailyForm.rows : [];
            },

            cumulativeRows() {
                return Array.isArray(this.cumulativeForm.rows) ? this.cumulativeForm.rows : [];
            },

            dailyPresentCount() {
                return this.dailyRows.filter(r => r.isPresent).length;
            },

            dailyAbsentCount() {
                return this.dailyRows.length - this.dailyPresentCount;
            },

            dailyAllPresent() {
                return this.dailyRows.length > 0 && this.dailyRows.every(r => r.isPresent);
            },

            cumulativeTotalDays() {
                return this.cumulativeRows.reduce((sum, r) => sum + asNumber(r.days), 0);
            },

            cumulativeStudentsWithDays() {
                return this.cumulativeRows.filter(r => asNumber(r.days) > 0).length;
            },

            dailyClassName() {
                return this.getClassName(this.dailyForm.classId);
            },

            cumulativeClassName() {
                return this.getClassName(this.cumulativeForm.classId);
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

            /* ================= lookups ================= */
            getClassName(classId) {
                if (!classId || classId === EMPTY_GUID) return '';
                const c = this.classes.find(x => sameId(x.id, classId));
                return c ? c.name : '';
            },

            getYearName(yearId) {
                const y = this.academicYears.find(x => sameId(x.id, yearId));
                return y ? y.name : '';
            },

            getTermName(termId) {
                const t = this.terms.find(x => sameId(x.id, termId));
                return t ? t.name : '';
            },

            getStudentById(studentId) {
                if (!studentId) return null;
                return this.allStudents.find(x => sameId(x.id, studentId)) || null;
            },

            /** lastName firstName otherName, falling back to the stored record name. */
            getStudentName(studentId, fallback = '') {
                const s = this.getStudentById(studentId);
                if (s) return s.fullName;
                return fallback || (isGuid(studentId) ? `Unknown Student (${String(studentId).substring(0, 8)}…)` : 'Unknown Student');
            },

            getStudentIdentifier(studentId, fallback = '') {
                const s = this.getStudentById(studentId);
                return s ? s.identifier : (fallback || '');
            },

            /** Students of a class, taken from the student bios. */
            studentsInClass(classId) {
                if (!classId) return [];
                return (this.allStudents || []).filter(s => s.classId && sameId(s.classId, classId));
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
                        console.warn(`Optional lookup "${label}" is not available (${url}).`);
                    }
                    return [];
                }
            },

            async loadLookups() {
                const stamp = Date.now();
                const soft = (url, label, key = null) => this.fetchList(url, label, key, true);

                const [classes, years, terms, students] = await Promise.all([
                    this.fetchList(ENDPOINTS.classes, 'classes', 'classes'),
                    this.fetchList(ENDPOINTS.academicYears, 'academic years', 'academicYears'),
                    soft(`${ENDPOINTS.terms}?v=${stamp}`, 'terms'),
                    this.fetchList(ENDPOINTS.students, 'students', 'students')
                ]);

                this.classes = normalizeClasses(classes);
                this.academicYears = normalizeLookups(years);
                this.terms = normalizeLookups(terms);
                this.allStudents = normalizeStudents(students);
            },

            normalizeAttendance(r) {
                const studentId = asGuid(val(r, 'studentId'));
                return {
                    id: val(r, 'id'),
                    tenantId: Number(val(r, 'tenantId')) || 0,
                    classId: asGuid(val(r, 'classId')),
                    className: asText(val(r, 'className')) || this.getClassName(val(r, 'classId')),
                    date: loadedDate(val(r, 'date')),
                    studentId,
                    studentIdentifier: asText(val(r, 'studentIdentifier')) || this.getStudentIdentifier(studentId),
                    studentName: asText(val(r, 'studentName')) || this.getStudentName(studentId),
                    isPresent: parseBool(val(r, 'isPresent'))
                };
            },

            normalizeCumulative(r) {
                const studentId = asGuid(val(r, 'studentId'));
                return {
                    id: val(r, 'id'),
                    tenantId: Number(val(r, 'tenantId')) || 0,
                    academicYearId: asGuid(val(r, 'academicYearId')),
                    classId: asGuid(val(r, 'classId')),
                    termId: asGuid(val(r, 'termId')),
                    studentId,
                    studentIdentifier: this.getStudentIdentifier(studentId),
                    studentName: this.getStudentName(studentId),
                    days: asNumber(val(r, 'days'))
                };
            },

            async loadAttendances() {
                const raw = await this.fetchList(ENDPOINTS.attendances, 'attendance records', 'attendances');
                this.attendances = raw
                    .map(r => this.normalizeAttendance(r))
                    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.studentName.localeCompare(b.studentName));
            },

            async loadCumulative() {
                const raw = await this.fetchList(ENDPOINTS.cumulative, 'cumulative attendance', 'cumulativeAttendances');
                this.cumulativeAttendances = raw
                    .map(r => this.normalizeCumulative(r))
                    .sort((a, b) => a.studentName.localeCompare(b.studentName));
            },

            async refreshAll() {
                this.isShimmerLoading = true;
                try {
                    await Promise.all([this.loadAttendances(), this.loadCumulative()]);
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ================= selection ================= */
            getGridSelectedRows(gridRef) {
                const grid = (this.$refs && this.$refs[gridRef]) ? this.$refs[gridRef] : null;
                if (!grid) return [];
                if (typeof grid.selectedRows === 'function') {
                    try {
                        const rows = grid.selectedRows();
                        if (Array.isArray(rows)) return rows;
                    } catch (e) { console.warn('selectedRows() failed:', e); }
                }
                if (Array.isArray(grid.selectedRows)) return grid.selectedRows;
                return [];
            },

            clearGridSelection(gridRef) {
                const grid = (this.$refs && this.$refs[gridRef]) ? this.$refs[gridRef] : null;
                if (!grid) return;
                if (typeof grid.clearSelection === 'function') { try { grid.clearSelection(); } catch (e) {} }
                if (typeof grid.deselectAll === 'function') { try { grid.deselectAll(); } catch (e) {} }
            },

            /* ==========================================================
             * DAILY ATTENDANCE
             * ========================================================== */
            /** Existing record for class + date + student, if any. */
            findDailyRecord(classId, date, studentId) {
                return (this.attendances || []).find(a =>
                    sameId(a.classId, classId) &&
                    a.date === date &&
                    sameId(a.studentId, studentId)
                ) || null;
            },

            openDailyModal(row = null) {
                // opening from a grid row preloads that class + date
                const classId = row ? row.classId : (this.classes.length ? this.classes[0].id : '');
                const date = row ? row.date : isoDate(new Date());

                this.dailyForm = { classId, date, rows: [] };
                this.dailyModalOpen = true;
                this.buildDailyRoster();
            },

            closeDailyModal() {
                this.dailyModalOpen = false;
                this.dailyForm = emptyDailyForm();
            },

            /** Students of class + existing marks for the selected date. */
            buildDailyRoster() {
                const classId = this.dailyForm.classId;
                const date = this.dailyForm.date;
                if (!classId) {
                    this.dailyForm.rows = [];
                    return;
                }

                this.dailyForm.rows = this.studentsInClass(classId).map(st => {
                    const existing = date ? this.findDailyRecord(classId, date, st.id) : null;
                    return {
                        studentId: st.id,
                        studentName: st.fullName,
                        studentIdentifier: st.identifier,
                        // default: present (fastest path for a normal school day)
                        isPresent: existing ? parseBool(existing.isPresent) : true,
                        existingId: existing ? existing.id : null
                    };
                });
            },

            onDailyClassChanged() {
                this.buildDailyRoster();
            },

            onDailyDateChanged() {
                this.buildDailyRoster();
            },

            toggleDailyAll() {
                const next = !this.dailyAllPresent;
                this.dailyRows.forEach(r => { r.isPresent = next; });
            },

            buildDailyPayload(row) {
                const className = this.getClassName(this.dailyForm.classId);
                const payload = {
                    classId: asGuid(this.dailyForm.classId),
                    className: asText(className),
                    date: toApiDate(this.dailyForm.date),
                    studentId: asGuid(row.studentId),
                    studentIdentifier: asText(row.studentIdentifier),
                    studentName: asText(row.studentName),
                    isPresent: parseBool(row.isPresent)
                };

                if (row.existingId) {
                    payload.id = row.existingId;
                    const existing = (this.attendances || []).find(a => sameId(a.id, row.existingId));
                    payload.tenantId = existing ? (Number(existing.tenantId) || 0) : 0;
                }

                return payload;
            },

            async saveDailyAttendance() {
                if (this.saving) return;

                if (!this.dailyForm.classId) return this.toastHandler('warning', 'Please select a class.');
                if (!this.dailyForm.date) return this.toastHandler('warning', 'Please choose the attendance date.');
                if (!this.dailyRows.length) return this.toastHandler('warning', 'There are no students in the selected class.');

                const newCount = this.dailyRows.filter(r => !r.existingId).length;
                const editCount = this.dailyRows.length - newCount;

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'question',
                        title: 'Save Attendance?',
                        html: `<div class="text-sm text-left">
                                 <div><b>${this.dailyClassName}</b> — ${this.dailyForm.date}</div>
                                 <div class="mt-1">${this.dailyPresentCount} present · ${this.dailyAbsentCount} absent</div>
                                 <div class="mt-2 text-xs text-gray-500">${newCount} new record(s), ${editCount} existing record(s) to update.</div>
                               </div>`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, save',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#059669',
                        cancelButtonColor: '#64748b'
                    });
                    if (!result.isConfirmed) return;
                }

                this.saving = true;
                this.isShimmerLoading = true;

                let saved = 0;
                let failed = 0;

                try {
                    for (const row of this.dailyRows) {
                        const payload = this.buildDailyPayload(row);
                        const endpoint = row.existingId ? ENDPOINTS.updateAttendance : ENDPOINTS.createAttendance;

                        try {
                            const res = await axios.post(endpoint, payload);
                            if (res.data && res.data.success === false) { failed++; continue; }
                            saved++;
                        } catch (err) {
                            console.error('Attendance save failed for student', row.studentId, err);
                            failed++;
                        }
                    }

                    if (saved) this.toastHandler('success', `Attendance saved for ${saved} student(s).`);
                    if (failed) this.toastHandler('warning', `${failed} student(s) could not be saved.`);

                    this.closeDailyModal();
                    await this.refreshAll();
                } catch (error) {
                    console.error('Save attendance failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to save attendance.');
                } finally {
                    this.saving = false;
                    this.isShimmerLoading = false;
                }
            },

            async deleteSelectedDaily() {
                const rows = this.getGridSelectedRows('dailyGrid');
                if (!rows.length) return this.toastHandler('warning', 'Select one or more attendance records to delete.');

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'warning',
                        title: 'Confirm Delete',
                        text: `Delete ${rows.length} attendance record${rows.length === 1 ? '' : 's'}?`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, delete',
                        cancelButtonText: 'No, go back',
                        confirmButtonColor: '#dc2626',
                        cancelButtonColor: '#64748b',
                        reverseButtons: true
                    });
                    if (!result.isConfirmed) return;
                }

                this.busy = true;
                this.isShimmerLoading = true;
                try {
                    for (const row of rows) {
                        if (!row.id) continue;
                        const res = await axios.get(`${ENDPOINTS.deleteAttendance}?id=${encodeURIComponent(row.id)}`);
                        if (res.data && res.data.success === false) {
                            this.toastHandler('error', res.data.message || 'Failed to delete an attendance record.');
                            return;
                        }
                    }
                    this.clearGridSelection('dailyGrid');
                    this.toastHandler('success', 'Deleted successfully.');
                    await this.refreshAll();
                } catch (error) {
                    console.error('Delete attendance failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to delete attendance.');
                } finally {
                    this.busy = false;
                    this.isShimmerLoading = false;
                }
            },

            editSelectedDaily() {
                const rows = this.getGridSelectedRows('dailyGrid');
                if (!rows.length) return this.toastHandler('warning', 'Select an attendance record to edit.');
                if (rows.length > 1) return this.toastHandler('warning', 'Select only one record to edit the class register.');
                this.openDailyModal(rows[0]);
            },

            /* ==========================================================
             * CUMULATIVE ATTENDANCE
             * ========================================================== */
            findCumulativeRecord(academicYearId, termId, classId, studentId) {
                return (this.cumulativeAttendances || []).find(c =>
                    sameId(c.academicYearId, academicYearId) &&
                    sameId(c.termId, termId) &&
                    sameId(c.classId, classId) &&
                    sameId(c.studentId, studentId)
                ) || null;
            },

            openCumulativeModal() {
                const yearId = this.academicYears.length ? this.academicYears[0].id : '';
                const termId = this.terms.length ? this.terms[0].id : '';
                const classId = this.classes.length ? this.classes[0].id : '';

                this.cumulativeForm = { academicYearId: yearId, termId, classId, rows: [] };
                this.cumulativeModalOpen = true;
                this.buildCumulativeRoster();
            },

            closeCumulativeModal() {
                this.cumulativeModalOpen = false;
                this.cumulativeForm = emptyCumulativeForm();
            },

            /** Students of the class with their existing day counts pre-filled. */
            buildCumulativeRoster() {
                const { academicYearId, termId, classId } = this.cumulativeForm;
                if (!classId) {
                    this.cumulativeForm.rows = [];
                    return;
                }

                this.cumulativeForm.rows = this.studentsInClass(classId).map(st => {
                    const existing = (academicYearId && termId)
                        ? this.findCumulativeRecord(academicYearId, termId, classId, st.id)
                        : null;

                    return {
                        studentId: st.id,
                        studentName: st.fullName,
                        studentIdentifier: st.identifier,
                        days: existing ? asNumber(existing.days) : 0,
                        existingId: existing ? existing.id : null
                    };
                });
            },

            onCumulativeScopeChanged() {
                this.buildCumulativeRoster();
            },

            fillCumulativeDays(days) {
                const value = Math.max(0, asNumber(days));
                this.cumulativeRows.forEach(r => { r.days = value; });
            },

            buildCumulativePayload(row) {
                const payload = {
                    academicYearId: asGuid(this.cumulativeForm.academicYearId),
                    classId: asGuid(this.cumulativeForm.classId),
                    termId: asGuid(this.cumulativeForm.termId),
                    studentId: asGuid(row.studentId),
                    days: Math.max(0, asNumber(row.days))
                };

                if (row.existingId) {
                    payload.id = row.existingId;
                    const existing = (this.cumulativeAttendances || []).find(c => sameId(c.id, row.existingId));
                    payload.tenantId = existing ? (Number(existing.tenantId) || 0) : 0;
                }

                return payload;
            },

            async saveCumulativeAttendance() {
                if (this.saving) return;

                if (!this.cumulativeForm.academicYearId) return this.toastHandler('warning', 'Please select an academic year.');
                if (!this.cumulativeForm.termId) return this.toastHandler('warning', 'Please select a term.');
                if (!this.cumulativeForm.classId) return this.toastHandler('warning', 'Please select a class.');
                if (!this.cumulativeRows.length) return this.toastHandler('warning', 'There are no students in the selected class.');

                const newCount = this.cumulativeRows.filter(r => !r.existingId).length;
                const editCount = this.cumulativeRows.length - newCount;

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'question',
                        title: 'Save Cumulative Attendance?',
                        html: `<div class="text-sm text-left">
                                 <div><b>${this.cumulativeClassName}</b> — ${this.getYearName(this.cumulativeForm.academicYearId)} / ${this.getTermName(this.cumulativeForm.termId)}</div>
                                 <div class="mt-1">${this.cumulativeStudentsWithDays} student(s) with days · ${this.cumulativeTotalDays} attendance day(s) in total</div>
                                 <div class="mt-2 text-xs text-gray-500">${newCount} new record(s), ${editCount} existing record(s) to update.</div>
                               </div>`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, save',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#059669',
                        cancelButtonColor: '#64748b'
                    });
                    if (!result.isConfirmed) return;
                }

                this.saving = true;
                this.isShimmerLoading = true;

                let saved = 0;
                let failed = 0;

                try {
                    for (const row of this.cumulativeRows) {
                        const payload = this.buildCumulativePayload(row);
                        const endpoint = row.existingId ? ENDPOINTS.updateCumulative : ENDPOINTS.createCumulative;

                        try {
                            const res = await axios.post(endpoint, payload);
                            if (res.data && res.data.success === false) { failed++; continue; }
                            saved++;
                        } catch (err) {
                            console.error('Cumulative attendance save failed for student', row.studentId, err);
                            failed++;
                        }
                    }

                    if (saved) this.toastHandler('success', `Cumulative attendance saved for ${saved} student(s).`);
                    if (failed) this.toastHandler('warning', `${failed} student(s) could not be saved.`);

                    this.closeCumulativeModal();
                    await this.refreshAll();
                } catch (error) {
                    console.error('Save cumulative attendance failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to save cumulative attendance.');
                } finally {
                    this.saving = false;
                    this.isShimmerLoading = false;
                }
            },

            async deleteSelectedCumulative() {
                const rows = this.getGridSelectedRows('cumulativeGrid');
                if (!rows.length) return this.toastHandler('warning', 'Select one or more cumulative records to delete.');

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'warning',
                        title: 'Confirm Delete',
                        text: `Delete ${rows.length} cumulative attendance record${rows.length === 1 ? '' : 's'}?`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, delete',
                        cancelButtonText: 'No, go back',
                        confirmButtonColor: '#dc2626',
                        cancelButtonColor: '#64748b',
                        reverseButtons: true
                    });
                    if (!result.isConfirmed) return;
                }

                this.busy = true;
                this.isShimmerLoading = true;
                try {
                    for (const row of rows) {
                        if (!row.id) continue;
                        const res = await axios.get(`${ENDPOINTS.deleteCumulative}?id=${encodeURIComponent(row.id)}`);
                        if (res.data && res.data.success === false) {
                            this.toastHandler('error', res.data.message || 'Failed to delete a cumulative record.');
                            return;
                        }
                    }
                    this.clearGridSelection('cumulativeGrid');
                    this.toastHandler('success', 'Deleted successfully.');
                    await this.refreshAll();
                } catch (error) {
                    console.error('Delete cumulative attendance failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to delete cumulative attendance.');
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
                await this.refreshAll();
            } finally {
                this.setupDone = true;
                this.isShimmerLoading = false;
            }
        }
    });

    if (typeof DataGridPlugin !== 'undefined') app.use(DataGridPlugin);
    if (typeof WSelectPlugin !== 'undefined') app.use(WSelectPlugin);

    app.mount('#app');
})();
