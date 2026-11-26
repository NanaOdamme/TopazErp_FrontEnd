(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const DEFAULT_DATE_TIME = '0001-01-01T00:00:00';

    /* ==============================================================
     * ENDPOINTS — Student Performance Skills
     * ============================================================== */
    const ENDPOINTS = {
        list: '/SchoolManager/GetStPerformanceSkills/',
        create: '/SchoolManager/CreateStPerformanceSkill/',
        update: '/SchoolManager/UpdateStPerformanceSkill/',
        remove: '/SchoolManager/DeleteStPerformanceSkill',

        // lookups
        students: '/SchoolManager/GetStudentBios/',
        classes: '/SchoolManager/GetLevelClasses/',
        academicYears: '/SchoolManager/GetAcademicYears/',
        terms: '/jsonDataSample/terms.json',
        performanceSkills: '/SchoolManager/GetPerformanceSkills/',
        // optional — areas are derived from PerformanceSkill.PerformanceAreaId/-Name when unavailable
        performanceAreas: '/SchoolManager/GetPerformanceAreas/'
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

    const sameId = (a, b) =>
        String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

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

    /** PerformanceArea entity: { Name, TenantId } only. */
    const normalizeAreas = list => (list || [])
        .map(a => ({
            id: val(a, 'id'),
            name: asText(val(a, 'name') || val(a, 'areaName') || val(a, 'performanceAreaName')),
            tenantId: Number(val(a, 'tenantId')) || 0
        }))
        .filter(a => a.id != null && a.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    /** PerformanceSkill entity: { PerformanceAreaId, PerformanceAreaName, Name, TenantId }. */
    const normalizeSkills = list => (list || [])
        .map(s => {
            const areaRaw =
                val(s, 'performanceAreaId') ||
                val(s, 'areaId') ||
                (val(s, 'performanceArea') && val(s, 'performanceArea').id) ||
                null;

            const areaId = isGuid(areaRaw) ? String(areaRaw).trim() : null;

            return {
                id: val(s, 'id'),
                name: asText(val(s, 'name') || val(s, 'skillName') || val(s, 'performanceSkillName')),
                areaId,
                areaName: asText(val(s, 'performanceAreaName') || (val(s, 'performanceArea') && val(s, 'performanceArea').name) || ''),
                tenantId: Number(val(s, 'tenantId')) || 0
            };
        })
        .filter(s => s.id != null && s.name !== '')
        .sort((a, b) => (a.areaName || '').localeCompare(b.areaName || '') || a.name.localeCompare(b.name));

    const app = Vue.createApp({
        data() {
            return {
                theme: '#062a81',
                isShimmerLoading: false,
                saving: false,
                busy: false,
                setupDone: false,

                // lookups
                classes: [],
                academicYears: [],
                terms: [],
                allStudents: [],
                performanceAreas: [],
                performanceSkills: [],

                // data
                records: [],

                // modal
                modalOpen: false,
                bulkAreaId: '',
                editMode: false,
                editId: null,
                editTenantId: 0,
                form: this.emptyForm(),
                loadingRoster: false
            };
        },

        computed: {
            columns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false },
                    {
                        key: 'academicYearId',
                        label: 'Academic Year',
                        type: 'select',
                        width: 150,
                        options: this.academicYears,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'termId',
                        label: 'Term',
                        type: 'select',
                        width: 120,
                        options: this.terms,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'classId',
                        label: 'Class',
                        type: 'select',
                        width: 160,
                        options: this.classes,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    { key: 'date', label: 'Date', type: 'date', width: 120, searchable: true, editable: false },
                    { key: 'studentName', label: 'Student Name', type: 'text', width: 230, searchable: true, editable: false },
                    { key: 'studentIdentifier', label: 'Student ID', type: 'text', width: 140, searchable: true, editable: false },
                    {
                        key: 'performanceAreaId',
                        label: 'Performance Area',
                        type: 'select',
                        width: 190,
                        options: this.performanceAreas,
                        value: 'id',
                        display: 'name',
                        editable: false
                    },
                    {
                        key: 'performanceSkillId',
                        label: 'Performance Skill',
                        type: 'select',
                        width: 200,
                        options: this.performanceSkills,
                        value: 'id',
                        display: 'name',
                        editable: false
                    }
                ];
            },

            rows() {
                return Array.isArray(this.form.rows) ? this.form.rows : [];
            },

            readyRows() {
                return this.rows.filter(r => r.performanceAreaId && r.performanceSkillId);
            },

            /** Selected student/area/skill combinations that are not yet saved. */
            newRowsCount() {
                return this.rows.filter(r =>
                    r.performanceAreaId &&
                    r.performanceSkillId &&
                    !this.findExistingForRow(r)
                ).length;
            },

            updateRowsCount() {
                return this.rows.filter(r =>
                    r.performanceAreaId &&
                    r.performanceSkillId &&
                    !!this.findExistingForRow(r)
                ).length;
            },

            rosterClassId() {
                return this.form.classId;
            }
        },

        methods: {
            val,
            isGuid,
            asGuid,
            sameId,
            isoDate,
            loadedDate,

            emptyForm() {
                return {
                    academicYearId: '',
                    termId: '',
                    classId: '',
                    date: isoDate(new Date()),
                    rows: []
                };
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

            getTermName(termId) {
                const t = this.terms.find(x => sameId(x.id, termId));
                return t ? t.name : '';
            },

            /** Areas = areas endpoint ∪ areas referenced by the skills list. */
            mergeAreas(areas, skills) {
                const merged = new Map();

                (areas || []).forEach(a => {
                    if (!a || a.id == null) return;
                    merged.set(String(a.id).toLowerCase(), {
                        id: a.id,
                        name: a.name,
                        tenantId: Number(a.tenantId) || 0
                    });
                });

                (skills || []).forEach(s => {
                    if (!s || !s.areaId) return;
                    const key = String(s.areaId).toLowerCase();
                    if (merged.has(key)) return;
                    merged.set(key, {
                        id: s.areaId,
                        name: s.areaName || `Area ${merged.size + 1}`,
                        tenantId: Number(s.tenantId) || 0
                    });
                });

                return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
            },

            getAreaName(areaId) {
                if (!areaId || areaId === EMPTY_GUID) return '';
                const a = this.performanceAreas.find(x => sameId(x.id, areaId));
                if (a) return a.name;
                // fall back to the area name carried by any skill of that area
                const s = this.performanceSkills.find(x => x.areaId && sameId(x.areaId, areaId));
                return s ? (s.areaName || '') : '';
            },

            getSkillName(skillId) {
                const s = this.performanceSkills.find(x => sameId(x.id, skillId));
                return s ? s.name : '';
            },

            getStudentById(studentId) {
                if (!studentId) return null;
                return this.allStudents.find(x => sameId(x.id, studentId)) || null;
            },

            getStudentName(studentId, fallback = '') {
                const s = this.getStudentById(studentId);
                if (s) return s.fullName;
                return fallback || (isGuid(studentId) ? `Unknown Student (${String(studentId).substring(0, 8)}…)` : 'Unknown Student');
            },

            getStudentIdentifier(studentId, fallback = '') {
                const s = this.getStudentById(studentId);
                return s ? s.identifier : (fallback || '');
            },

            studentsInClass(classId) {
                if (!classId) return [];
                return (this.allStudents || []).filter(s => s.classId && sameId(s.classId, classId));
            },

            /** Performance skills belonging to the chosen area. */
            skillsForArea(areaId) {
                if (!areaId) return [];
                return (this.performanceSkills || []).filter(s => s.areaId && sameId(s.areaId, areaId));
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

                const [classes, years, terms, students, areas, skills] = await Promise.all([
                    this.fetchList(ENDPOINTS.classes, 'classes', 'classes'),
                    this.fetchList(ENDPOINTS.academicYears, 'academic years', 'academicYears'),
                    soft(`${ENDPOINTS.terms}?v=${stamp}`, 'terms'),
                    this.fetchList(ENDPOINTS.students, 'students', 'students'),
                    soft(ENDPOINTS.performanceAreas, 'performance areas'),
                    soft(ENDPOINTS.performanceSkills, 'performance skills')
                ]);

                this.classes = normalizeClasses(classes);
                this.academicYears = normalizeLookups(years);
                this.terms = normalizeLookups(terms);
                this.allStudents = normalizeStudents(students);
                this.performanceAreas = normalizeAreas(areas);
                this.performanceSkills = normalizeSkills(skills);

                // PerformanceSkill already carries PerformanceAreaId + PerformanceAreaName, so the
                // area list is always complete even if the areas endpoint is not exposed.
                this.performanceAreas = this.mergeAreas(this.performanceAreas, this.performanceSkills);
            },

            normalizeRecord(r) {
                const studentId = asGuid(val(r, 'studentId'));
                const areaId = asGuid(val(r, 'performanceAreaId'));
                const skillId = asGuid(val(r, 'performanceSkillId'));

                return {
                    id: val(r, 'id'),
                    tenantId: Number(val(r, 'tenantId')) || 0,
                    academicYearId: asGuid(val(r, 'academicYearId')),
                    termId: asGuid(val(r, 'termId')),
                    classId: asGuid(val(r, 'classId')),
                    date: loadedDate(val(r, 'date')),
                    studentId,
                    studentName: this.getStudentName(studentId),
                    studentIdentifier: this.getStudentIdentifier(studentId),
                    performanceAreaId: areaId,
                    performanceAreaName: this.getAreaName(areaId) || (this.performanceSkills.find(x => sameId(x.id, skillId)) || {}).areaName || '',
                    performanceSkillId: skillId,
                    performanceSkillName: this.getSkillName(skillId)
                };
            },

            async loadRecords() {
                const raw = await this.fetchList(ENDPOINTS.list, 'student performance skills', 'stPerformanceSkills');
                this.records = raw
                    .map(r => this.normalizeRecord(r))
                    .sort((a, b) =>
                        (b.date || '').localeCompare(a.date || '') ||
                        a.studentName.localeCompare(b.studentName) ||
                        a.performanceAreaName.localeCompare(b.performanceAreaName)
                    );
            },

            async refreshAll() {
                this.isShimmerLoading = true;
                try {
                    await this.loadRecords();
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

            /* ================= modal ================= */
            openCreateModal() {
                this.editMode = false;
                this.editId = null;
                this.bulkAreaId = '';
                this.form = {
                    academicYearId: this.academicYears.length ? this.academicYears[0].id : '',
                    termId: this.terms.length ? this.terms[0].id : '',
                    classId: this.classes.length ? this.classes[0].id : '',
                    date: isoDate(new Date()),
                    rows: []
                };
                this.modalOpen = true;
                this.buildRoster();
            },

            openEditModal(record) {
                if (!record) return;
                const source = record.__source || record;
                this.editMode = true;
                this.editId = source.id || null;
                this.editTenantId = Number(source.tenantId) || 0;
                this.form = {
                    academicYearId: source.academicYearId,
                    termId: source.termId,
                    classId: source.classId,
                    date: source.date || isoDate(new Date()),
                    rows: []
                };
                this.modalOpen = true;
                this.buildRoster();
            },

            closeModal() {
                this.modalOpen = false;
                this.editMode = false;
                this.editId = null;
                this.editTenantId = 0;
                this.form = this.emptyForm();
            },

            editSelected() {
                const rows = this.getGridSelectedRows('skillsGrid');
                if (!rows.length) return this.toastHandler('warning', 'Select a record to edit.');
                if (rows.length > 1) return this.toastHandler('warning', 'Select only one record to edit.');
                this.openEditModal(rows[0]);
            },

            /** Existing saved record for the current scope, area and skill of a row. */
            findExistingForRow(row) {
                if (!row.studentId || !row.performanceAreaId || !row.performanceSkillId) return null;

                // In edit mode the record being edited is the one to update.
                if (this.editMode && this.editId) {
                    const editing = (this.records || []).find(r => sameId(r.id, this.editId));
                    if (editing &&
                        sameId(editing.studentId, row.studentId) &&
                        sameId(editing.performanceAreaId, row.performanceAreaId) &&
                        sameId(editing.performanceSkillId, row.performanceSkillId)) {
                        return editing;
                    }
                }

                return (this.records || []).find(r =>
                    sameId(r.academicYearId, this.form.academicYearId) &&
                    sameId(r.termId, this.form.termId) &&
                    sameId(r.classId, this.form.classId) &&
                    sameId(r.studentId, row.studentId) &&
                    sameId(r.performanceAreaId, row.performanceAreaId) &&
                    sameId(r.performanceSkillId, row.performanceSkillId)
                ) || null;
            },

            /** Records already saved for a student within the current scope. */
            existingForStudent(studentId) {
                return (this.records || []).filter(r =>
                    sameId(r.academicYearId, this.form.academicYearId) &&
                    sameId(r.termId, this.form.termId) &&
                    sameId(r.classId, this.form.classId) &&
                    sameId(r.studentId, studentId)
                );
            },

            buildRoster() {
                const classId = this.form.classId;

                if (this.editMode && this.editId) {
                    const editing = (this.records || []).find(r => sameId(r.id, this.editId));
                    if (editing) {
                        this.form.rows = [{
                            studentId: editing.studentId,
                            studentName: editing.studentName,
                            studentIdentifier: editing.studentIdentifier,
                            performanceAreaId: editing.performanceAreaId,
                            performanceSkillId: editing.performanceSkillId,
                            savedSkills: this.existingForStudent(editing.studentId).map(r => ({
                                id: r.id,
                                name: r.performanceSkillName,
                                areaName: r.performanceAreaName
                            }))
                        }];
                        return;
                    }
                }

                if (!classId) {
                    this.form.rows = [];
                    return;
                }

                this.form.rows = this.studentsInClass(classId).map(st => ({
                    studentId: st.id,
                    studentName: st.fullName,
                    studentIdentifier: st.identifier,
                    performanceAreaId: '',
                    performanceSkillId: '',
                    savedSkills: this.existingForStudent(st.id).map(r => ({
                        id: r.id,
                        name: r.performanceSkillName,
                        areaName: r.performanceAreaName
                    }))
                }));
            },

            onScopeChanged() {
                this.buildRoster();
            },

            onAreaChanged(row) {
                const skills = this.skillsForArea(row.performanceAreaId);
                const stillValid = row.performanceSkillId && skills.some(s => sameId(s.id, row.performanceSkillId));
                if (!stillValid) {
                    row.performanceSkillId = skills.length ? skills[0].id : '';
                }
            },

            applyAreaToAll(areaId) {
                if (!areaId) return;
                const skills = this.skillsForArea(areaId);
                this.rows.forEach(row => {
                    row.performanceAreaId = areaId;
                    row.performanceSkillId = skills.length ? skills[0].id : '';
                });
            },

            clearAllRows() {
                this.rows.forEach(row => {
                    row.performanceAreaId = '';
                    row.performanceSkillId = '';
                });
            },

            /* ================= save / delete ================= */
            buildPayload(row) {
                const payload = {
                    academicYearId: asGuid(this.form.academicYearId),
                    termId: asGuid(this.form.termId),
                    classId: asGuid(this.form.classId),
                    date: toApiDate(this.form.date),
                    studentId: asGuid(row.studentId),
                    performanceSkillId: asGuid(row.performanceSkillId),
                    performanceAreaId: asGuid(row.performanceAreaId)
                };

                const existing = this.findExistingForRow(row);
                if (existing) {
                    payload.id = existing.id;
                    payload.tenantId = Number(existing.tenantId) || 0;
                }

                return payload;
            },

            async save() {
                if (this.saving) return;

                if (!this.form.academicYearId) return this.toastHandler('warning', 'Please select an academic year.');
                if (!this.form.termId) return this.toastHandler('warning', 'Please select a term.');
                if (!this.form.classId) return this.toastHandler('warning', 'Please select a class.');
                if (!this.form.date) return this.toastHandler('warning', 'Please choose the date.');

                const toSave = this.readyRows;
                if (!toSave.length) return this.toastHandler('warning', 'Select a performance area and skill for at least one student.');

                const newCount = toSave.filter(r => !this.findExistingForRow(r)).length;
                const editCount = toSave.length - newCount;

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'question',
                        title: this.editMode ? 'Update Skill Record?' : 'Save Performance Skills?',
                        html: `<div class="text-sm text-left">
                                 <div><b>${this.getClassName(this.form.classId)}</b> — ${this.getYearName(this.form.academicYearId)} / ${this.getTermName(this.form.termId)}</div>
                                 <div class="mt-1">${toSave.length} student(s) will be saved</div>
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
                    for (const row of toSave) {
                        const payload = this.buildPayload(row);
                        const endpoint = payload.id ? ENDPOINTS.update : ENDPOINTS.create;

                        try {
                            const res = await axios.post(endpoint, payload);
                            if (res.data && res.data.success === false) { failed++; continue; }
                            saved++;
                        } catch (err) {
                            console.error('Performance skill save failed for student', row.studentId, err);
                            failed++;
                        }
                    }

                    if (saved) this.toastHandler('success', `Performance skill saved for ${saved} student(s).`);
                    if (failed) this.toastHandler('warning', `${failed} student(s) could not be saved.`);

                    this.closeModal();
                    await this.refreshAll();
                } catch (error) {
                    console.error('Save performance skills failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to save performance skills.');
                } finally {
                    this.saving = false;
                    this.isShimmerLoading = false;
                }
            },

            async deleteRecord(id, { silent = false } = {}) {
                const res = await axios.get(`${ENDPOINTS.remove}?id=${encodeURIComponent(id)}`);
                if (res.data && res.data.success === false) {
                    throw new Error(res.data.message || 'Failed to delete the record.');
                }
                if (!silent) this.toastHandler('success', 'Deleted successfully.');
            },

            async removeSavedSkill(row, skill) {
                if (!skill || !skill.id) return;

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'warning',
                        title: 'Confirm Delete',
                        html: `Delete <b>${skill.name}</b> for <b>${row.studentName}</b>?`,
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
                try {
                    await this.deleteRecord(skill.id);
                    await this.loadRecords();
                    row.savedSkills = row.savedSkills.filter(s => !sameId(s.id, skill.id));
                } catch (error) {
                    console.error('Delete performance skill failed:', error);
                    this.toastHandler('error', error.message || 'Failed to delete the record.');
                } finally {
                    this.busy = false;
                }
            },

            async deleteSelected() {
                const rows = this.getGridSelectedRows('skillsGrid');
                if (!rows.length) return this.toastHandler('warning', 'Select one or more records to delete.');

                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'warning',
                        title: 'Confirm Delete',
                        text: `Delete ${rows.length} performance skill record${rows.length === 1 ? '' : 's'}?`,
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
                        await this.deleteRecord(row.id, { silent: true });
                    }
                    this.clearGridSelection('skillsGrid');
                    this.toastHandler('success', 'Deleted successfully.');
                    await this.refreshAll();
                } catch (error) {
                    console.error('Delete performance skills failed:', error);
                    this.toastHandler('error', error.message || 'Failed to delete performance skills.');
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
                await this.loadRecords();
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
