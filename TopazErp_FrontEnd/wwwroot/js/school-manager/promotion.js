(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    /* ==============================================================
     * ENDPOINTS
     * ============================================================== */
    const ENDPOINTS = {
        // StudentPromotion
        list: '/SchoolManager/GetStudentPromotions/',
        create: '/SchoolManager/CreateStudentPromotion/',
        update: '/SchoolManager/UpdateStudentPromotion/',

        // PreClassStudentPromotion
        preList: '/SchoolManager/GetPreClassStudentPromotions/',
        preCreate: '/SchoolManager/CreatePreClassStudentPromotion/',
        preUpdate: '/SchoolManager/UpdatePreClassStudentPromotion/',

        // student bio update (used when promoting to alumni)
        updateStudentBio: '/SchoolManager/UpdateStudentBio/',

        // lookups
        students: '/SchoolManager/GetStudentBios/',
        classes: '/SchoolManager/GetLevelClasses/',
        academicYears: '/SchoolManager/GetAcademicYears/'
    };

    /* ---------------- helpers ---------------- */
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

    const asText = v => (v === null || v === undefined ? '' : String(v));

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

    const app = Vue.createApp({
        data() {
            return {
                theme: '#062a81',
                isShimmerLoading: false,
                saving: false,
                busy: false,
                setupDone: false,

                // 'class' | 'pre'
                activeTab: 'class',

                // lookups
                classes: [],
                academicYears: [],
                allStudents: [],
                rawStudentMap: {},

                // data
                promotions: [],
                prePromotions: [],

                // modal
                modalOpen: false,
                editMode: false,
                editId: null,
                editTenantId: 0,
                showRoster: false,
                viewerOpen: false,
                viewerTitle: '',
                viewerRows: [],

                form: {
                    id: null,
                    academicYearId: '',
                    fromClassId: '',
                    mode: 'individual',   // individual | alumni
                    toClassId: '',
                    rows: []
                }
            };
        },

        computed: {
            isPreTab() {
                return this.activeTab === 'pre';
            },

            currentList() {
                return this.isPreTab ? this.prePromotions : this.promotions;
            },

            columns() {
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
                        key: 'fromClassId',
                        label: 'From Class',
                        type: 'select',
                        width: 170,
                        options: this.classes,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'toClassId',
                        label: 'To Class',
                        type: 'select',
                        width: 170,
                        options: this.classes,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    { key: 'promotionType', label: 'Promotion Type', type: 'text', width: 150, searchable: true, editable: false },
                    { key: 'studentCount', label: 'Students', type: 'number', width: 100, editable: false }
                ];
            },

            rows() {
                return Array.isArray(this.form.rows) ? this.form.rows : [];
            },

            selectedRows() {
                return this.rows.filter(r => r.selected);
            },

            selectedCount() {
                return this.selectedRows.length;
            },

            allSelected() {
                return this.rows.length > 0 && this.rows.every(r => r.selected);
            },

            /** Destination choices — the source class is never a valid target. */
            toClassOptions() {
                return (this.classes || []).filter(c => !sameId(c.id, this.form.fromClassId));
            },

            fromClassName() {
                const c = this.classes.find(x => sameId(x.id, this.form.fromClassId));
                return c ? c.name : '';
            },

            selectedToClassName() {
                const c = this.classes.find(x => sameId(x.id, this.form.toClassId));
                return c ? c.name : '';
            },

            isAlumniMode() {
                return this.form.mode === 'alumni';
            },

            canSave() {
                if (!this.form.academicYearId || !this.form.fromClassId) return false;
                if (!this.selectedCount) return false;
                if (this.isAlumniMode) return true;
                return this.selectedRows.every(r => !!r.toClassId);
            }
        },

        methods: {
            val,
            isGuid,
            asGuid,
            parseBool,
            sameId,

            uuid() {
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                );
            },

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

            getStudentName(studentId, fallback = '') {
                const s = this.allStudents.find(x => sameId(x.id, studentId));
                if (s) return s.fullName;
                return fallback || (isGuid(studentId) ? `Unknown Student (${String(studentId).substring(0, 8)}…)` : 'Unknown Student');
            },

            async fetchList(url, label, preferredKey = null) {
                try {
                    const response = await axios.get(url);
                    return unwrapList(response.data, preferredKey);
                } catch (error) {
                    console.error(`Failed to load ${label}:`, error);
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },

            async loadLookups() {
                const [classes, years, students] = await Promise.all([
                    this.fetchList(ENDPOINTS.classes, 'classes', 'classes'),
                    this.fetchList(ENDPOINTS.academicYears, 'academic years', 'academicYears'),
                    this.fetchList(ENDPOINTS.students, 'students', 'students')
                ]);

                // ----- classes (level aware) -----
                this.classes = (classes || [])
                    .map(c => ({
                        id: val(c, 'id'),
                        name: val(c, 'className') || val(c, 'name') || '',
                        className: val(c, 'className') || val(c, 'name') || '',
                        levelId: val(c, 'levelId') || val(c, 'classLevelId') || val(c, 'LevelId') || null,
                        levelName: val(c, 'levelName') || val(c, 'classLevelName') || ''
                    }))
                    .filter(c => c.id != null && c.name !== '')
                    .sort((a, b) => a.name.localeCompare(b.name));

                // ----- academic years -----
                this.academicYears = (years || [])
                    .map(o => ({ id: val(o, 'id'), name: val(o, 'name') || val(o, 'displayName') || '' }))
                    .filter(o => o.id != null && o.name !== '')
                    .sort((a, b) => a.name.localeCompare(b.name));

                // ----- students -----
                this.rawStudentMap = {};
                this.allStudents = (students || [])
                    .map(s => {
                        const id = val(s, 'id') || val(s, 'studentId');
                        if (id) this.rawStudentMap[String(id).toLowerCase()] = s;

                        const firstName = String(val(s, 'firstName') || '').trim();
                        const lastName = String(val(s, 'lastName') || '').trim();
                        const otherName = String(val(s, 'otherName') || '').trim();
                        const fullName = buildStudentFullName(lastName, firstName, otherName);

                        return {
                            id,
                            fullName,
                            name: fullName,
                            identifier: String(val(s, 'studentIdentifier') || val(s, 'identifier') || '').trim(),
                            classId: val(s, 'classId') || null,
                            academicYearId: val(s, 'academicYearId') || null,
                            isPreClassStudent: parseBool(val(s, 'isPreClassStudent')),
                            isAlumni: parseBool(val(s, 'isAlumni'))
                        };
                    })
                    .filter(s => s.id != null && s.fullName !== '')
                    .sort((a, b) => a.fullName.localeCompare(b.fullName));
            },

            normalizePromotionStudents(raw) {
                let list = raw;
                if (typeof list === 'string') {
                    try { list = JSON.parse(list); } catch (e) { list = []; }
                }
                return (Array.isArray(list) ? list : []).map(s => ({
                    id: s.id || s.Id || null,
                    studentId: s.studentId || s.StudentId || null,
                    studentIdentifier: s.studentIdentifier || s.StudentIdentifier || '',
                    toClassId: s.toClassId || s.ToClassId || null
                }));
            },

            normalizePromotion(r) {
                const students = this.normalizePromotionStudents(val(r, 'students'));
                const isAlumni = parseBool(val(r, 'isAlumni'));
                const isEntireLevel = parseBool(val(r, 'isEntireLevel'));

                return {
                    id: val(r, 'id'),
                    tenantId: Number(val(r, 'tenantId')) || 0,
                    academicYearId: asGuid(val(r, 'academicYearId')),
                    fromClassId: asGuid(val(r, 'fromClassId')),
                    toClassId: asGuid(val(r, 'toClassId')),
                    entireLevelClassId: asGuid(val(r, 'entireLevelClassId')),
                    isIndividualClass: parseBool(val(r, 'isIndividualClass')),
                    isEntireLevel,
                    isAlumni,
                    promotionType: isAlumni ? 'Alumni' : (isEntireLevel ? 'Entire Level (legacy)' : 'Individual Class'),
                    studentCount: students.length,
                    students
                };
            },

            async loadPromotions() {
                const raw = await this.fetchList(ENDPOINTS.list, 'student promotions', 'studentPromotions');
                this.promotions = raw.map(r => this.normalizePromotion(r));
            },

            async loadPrePromotions() {
                const raw = await this.fetchList(ENDPOINTS.preList, 'pre-class student promotions', 'preClassStudentPromotions');
                this.prePromotions = raw.map(r => this.normalizePromotion(r));
            },

            async refreshAll() {
                this.isShimmerLoading = true;
                try {
                    await Promise.all([this.loadPromotions(), this.loadPrePromotions()]);
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

            currentGridRef() {
                return this.isPreTab ? 'preGrid' : 'promoGrid';
            },

            /* ================= modal ================= */
            openCreateModal() {
                this.editMode = false;
                this.editId = null;
                this.editTenantId = 0;
                this.showRoster = false;

                this.form = {
                    id: null,
                    academicYearId: this.academicYears.length ? this.academicYears[0].id : '',
                    fromClassId: this.classes.length ? this.classes[0].id : '',
                    mode: 'individual',
                    toClassId: '',
                    rows: []
                };

                this.modalOpen = true;
                this.buildRoster();
            },

            openEditModal(record) {
                if (!record) return;

                // "entire level" is no longer offered; legacy records open as an individual promotion
                const mode = record.isAlumni ? 'alumni' : 'individual';

                this.editMode = true;
                this.editId = record.id;
                this.editTenantId = Number(record.tenantId) || 0;
                this.showRoster = false;

                this.form = {
                    id: record.id,
                    academicYearId: record.academicYearId,
                    fromClassId: record.fromClassId,
                    mode,
                    toClassId: record.toClassId,
                    rows: []
                };

                this.modalOpen = true;
                this.buildRoster(record);

                // re-apply the saved student selection
                const saved = record.students || [];
                this.rows.forEach(row => {
                    const match = saved.find(s => sameId(s.studentId, row.studentId));
                    if (!match) { row.selected = false; return; }
                    row.selected = true;
                    row.promotionStudentId = match.id;
                    if (mode === 'individual' && match.toClassId) row.toClassId = match.toClassId;
                });
            },

            closeModal() {
                this.modalOpen = false;
                this.editMode = false;
                this.editId = null;
                this.editTenantId = 0;
                this.showRoster = false;
                this.form = {
                    id: null,
                    academicYearId: '',
                    fromClassId: '',
                    mode: 'individual',
                    toClassId: '',
                    rows: []
                };
            },

            /** Students to offer: the students of the selected class (pre-class only on the pre-class tab). */
            rosterSourceStudents() {
                const classId = this.form.fromClassId;
                if (!classId) return [];

                let list = this.allStudents.filter(s => s.classId && sameId(s.classId, classId));
                if (this.isPreTab) list = list.filter(s => s.isPreClassStudent);

                return list;
            },

            buildRoster(savedPromotion = null) {
                const students = this.rosterSourceStudents();

                this.form.rows = students.map(st => {
                    const saved = savedPromotion
                        ? (savedPromotion.students || []).find(x => sameId(x.studentId, st.id))
                        : null;

                    return {
                        studentId: st.id,
                        studentName: st.fullName,
                        studentIdentifier: st.identifier,
                        classId: st.classId,
                        className: this.getClassName(st.classId),
                        selected: !!saved,
                        toClassId: saved && saved.toClassId ? saved.toClassId : (this.form.toClassId || ''),
                        promotionStudentId: saved ? saved.id : null
                    };
                });

                this.showRoster = this.form.rows.length > 0;
            },

            onFromClassChanged() {
                // the source class can never be its own destination
                if (sameId(this.form.toClassId, this.form.fromClassId)) this.form.toClassId = '';
                this.buildRoster();
            },

            onModeChanged() {
                if (this.isAlumniMode) {
                    this.form.toClassId = '';
                }
            },

            onToClassChanged() {
                this.applyDefaultToClass(this.form.toClassId);
            },

            applyDefaultToClass(classId) {
                if (!classId) return;
                this.form.rows.forEach(r => {
                    if (!r.toClassId) r.toClassId = classId;
                });
            },

            toggleAllSelected() {
                const next = !this.allSelected;
                this.rows.forEach(r => { r.selected = next; });
            },

            /* ================= payload / save ================= */
            buildPayload() {
                const mode = this.form.mode;
                const id = this.editMode ? this.editId : (this.form.id || this.uuid());

                const destination = mode === 'alumni' ? EMPTY_GUID : asGuid(this.form.toClassId);

                const students = this.selectedRows.map(r => ({
                    id: r.promotionStudentId || this.uuid(),
                    promotionId: id,
                    studentId: asGuid(r.studentId),
                    studentIdentifier: asText(r.studentIdentifier),
                    toClassId: mode === 'alumni' ? EMPTY_GUID : asGuid(r.toClassId || destination)
                }));

                const payload = {
                    id,
                    academicYearId: asGuid(this.form.academicYearId),
                    fromClassId: asGuid(this.form.fromClassId),
                    toClassId: destination,
                    isIndividualClass: mode === 'individual',
                    // entire-level promotion is not offered anymore
                    isEntireLevel: false,
                    isAlumni: mode === 'alumni',
                    entireLevelClassId: EMPTY_GUID,
                    students
                };

                if (this.editMode) payload.tenantId = this.editTenantId;

                return payload;
            },

            /** Alumni promotion: flip isAlumni and clear the class on the student bio. */
            async markStudentsAsAlumni(students) {
                let ok = 0;
                let failed = 0;

                for (const s of students) {
                    const raw = this.rawStudentMap[String(s.studentId).toLowerCase()];
                    const payload = raw
                        ? Object.assign({}, raw, { isAlumni: true, classId: EMPTY_GUID })
                        : { id: s.studentId, isAlumni: true, classId: EMPTY_GUID };

                    try {
                        const res = await axios.post(ENDPOINTS.updateStudentBio, payload);
                        if (res.data && res.data.success === false) { failed++; continue; }
                        if (res.data && res.data.result && res.data.result.code && res.data.result.code !== 200) { failed++; continue; }
                        ok++;
                    } catch (err) {
                        console.error('Failed to mark student as alumni:', s.studentId, err);
                        failed++;
                    }
                }

                return { ok, failed };
            },

            async save() {
                if (this.saving) return;

                if (!this.form.academicYearId) return this.toastHandler('warning', 'Please select the academic year.');
                if (!this.form.fromClassId) return this.toastHandler('warning', 'Please select the class to promote from.');
                if (!this.form.rows.length) return this.toastHandler('warning', 'There are no students to promote.');
                if (!this.selectedCount) return this.toastHandler('warning', 'Select at least one student to promote.');

                const mode = this.form.mode;

                if (mode === 'individual' && !this.form.toClassId) {
                    return this.toastHandler('warning', 'Please select the class to promote to.');
                }
                if (mode === 'individual' && this.selectedRows.some(r => !r.toClassId)) {
                    return this.toastHandler('warning', 'Every selected student needs a destination class.');
                }

                if (typeof Swal !== 'undefined') {
                    const typeLabel = mode === 'alumni' ? 'Alumni' : 'Individual Class';
                    const destination = mode === 'alumni'
                        ? '<b>Alumni</b>'
                        : `<b>${this.escapeHtml(this.selectedToClassName)}</b>`;

                    const result = await Swal.fire({
                        icon: 'warning',
                        title: 'Confirm Promotion',
                        html: `<div class="text-sm text-left">
                                 <div><b>${this.escapeHtml(this.fromClassName)}</b> → ${destination}</div>
                                 <div class="mt-1">${this.selectedCount} student(s) · ${this.escapeHtml(this.getYearName(this.form.academicYearId))}</div>
                                 <div class="mt-1 text-xs text-gray-500">${typeLabel} promotion</div>
                                 ${mode === 'alumni' ? '<div class="mt-2 text-xs text-rose-600">All selected students will be moved to Alumni.</div>' : ''}
                               </div>`,
                        showCancelButton: true,
                        confirmButtonText: this.editMode ? 'Yes, update' : 'Yes, promote',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#059669',
                        cancelButtonColor: '#64748b'
                    });
                    if (!result.isConfirmed) return;
                }

                this.saving = true;
                this.isShimmerLoading = true;

                try {
                    const payload = this.buildPayload();
                    const endpoint = this.isPreTab
                        ? (this.editMode ? ENDPOINTS.preUpdate : ENDPOINTS.preCreate)
                        : (this.editMode ? ENDPOINTS.update : ENDPOINTS.create);

                    const res = await axios.post(endpoint, payload);

                    const failedFlag = res.data && res.data.success === false;
                    const badCode = res.data && res.data.result && res.data.result.code && res.data.result.code !== 200;

                    if (failedFlag || badCode) {
                        this.toastHandler('error', (res.data && res.data.message) || 'Failed to save the promotion.');
                        return;
                    }

                    this.toastHandler('success', `${payload.students.length} student(s) promoted successfully.`);

                    if (mode === 'alumni') {
                        const { ok, failed } = await this.markStudentsAsAlumni(payload.students);
                        if (ok) this.toastHandler('success', `${ok} student(s) marked as alumni.`);
                        if (failed) this.toastHandler('warning', `${failed} student(s) could not be marked as alumni.`);
                    }

                    this.closeModal();
                    await this.refreshAll();
                } catch (error) {
                    console.error('Save promotion failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to save the promotion.');
                } finally {
                    this.saving = false;
                    this.isShimmerLoading = false;
                }
            },

            escapeHtml(text) {
                return String(text || '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            },

            /* ================= toolbar actions ================= */
            editSelected() {
                const rows = this.getGridSelectedRows(this.currentGridRef());
                if (!rows.length) return this.toastHandler('warning', 'Select a promotion to edit.');
                if (rows.length > 1) return this.toastHandler('warning', 'Select only one promotion to edit.');
                this.openEditModal(rows[0]);
            },

            viewSelected() {
                const rows = this.getGridSelectedRows(this.currentGridRef());
                if (!rows.length) return this.toastHandler('warning', 'Select a promotion to view.');
                if (rows.length > 1) return this.toastHandler('warning', 'Select only one promotion to view.');

                const record = rows[0];
                this.viewerTitle = `${this.getClassName(record.fromClassId)} → ${record.isAlumni ? 'Alumni' : this.getClassName(record.toClassId)}`;
                this.viewerRows = (record.students || []).map(s => ({
                    studentId: s.studentId,
                    studentName: this.getStudentName(s.studentId),
                    studentIdentifier: s.studentIdentifier,
                    toClassId: s.toClassId,
                    toClassName: s.toClassId && s.toClassId !== EMPTY_GUID ? this.getClassName(s.toClassId) : (record.isAlumni ? 'Alumni' : '')
                }));
                this.viewerOpen = true;
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
