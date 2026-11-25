(function () {
    'use strict';

    const sameText = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

    const val = (o, k) => o
        ? (o[k] !== undefined ? o[k] : o[k.charAt(0).toUpperCase() + k.slice(1)])
        : undefined;

    const uuid = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );

    // The data-grid mints optimistic draft ids like "id-n1wb9pnj" for new rows —
    // never a Guid. Only server-issued or uuid()-issued ids may go into payloads.
    const isGuid = v => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v));
    const asGuid = v => (isGuid(v) ? String(v) : uuid());
    const sameId = (a, b) =>
        a !== null && a !== undefined && b !== null && b !== undefined &&
        String(a).toLowerCase() === String(b).toLowerCase();
    const errMsg = err =>
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.title))
        || (err && err.message)
        || 'Something went wrong.';


    // Swal confirmation — popup dialogs only
    const confirmDialog = ({ title = 'Are you sure?', text = '', confirmText = 'Yes, delete', tone = 'danger' } = {}) => {
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
    };
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

    // GetStudentBios — bios carry classId
    const normalizeStudents = list => (list || [])
        .map(s => ({
            id: val(s, 'id') || val(s, 'studentId') || val(s, 'studentID'),
            name: val(s, 'studentName') || val(s, 'fullName') || val(s, 'name')
                || [val(s, 'firstName'), val(s, 'lastName')].filter(Boolean).join(' ') || '',
            identifier: val(s, 'studentIdentifier') || val(s, 'identifier') || val(s, 'admissionNumber') || '',
            classId: val(s, 'classId') || val(s, 'classID') || null
        }))
        .filter(s => s.id != null && s.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    // Header + embedded Options jsonb — de-dupe options by id AND text (unique per header)
    const normalizeHeader = h => {
        const seenId = {}, seenText = {}, options = [];
        (val(h, 'options') || []).forEach(o => {
            const text = String(val(o, 'option') || '').trim();
            const id = val(o, 'id') || uuid();
            const idKey = String(id).toLowerCase(), textKey = text.toLowerCase();
            if (!text || seenId[idKey] || seenText[textKey]) return;
            seenId[idKey] = true; seenText[textKey] = true;
            options.push({
                id,
                remarkId: val(o, 'remarkId') || val(h, 'id'),
                option: text
            });
        });
        return {
            id: val(h, 'id'),
            name: String(val(h, 'name') || '').trim(),
            tenantId: val(h, 'tenantId'),
            options
        };
    };

    // MidTermAssessment + embedded Assessment lines — de-dupe lines by student (first wins)
    const normalizeAssessmentRecord = r => {
        const seen = {}, lines = [];
        (val(r, 'assessment') || []).forEach(a => {
            const studentId = val(a, 'studentId');
            if (!studentId || seen[String(studentId).toLowerCase()]) return;
            seen[String(studentId).toLowerCase()] = true;
            lines.push({
                id: val(a, 'id') || uuid(),
                midTermAssessmentId: val(a, 'midTermAssessmentId'),
                studentId,
                studentName: val(a, 'studentName') || '',
                headers: (val(a, 'headers') || []).map(h => ({
                    id: val(h, 'id'),
                    name: String(val(h, 'name') || '').trim(),
                    options: (val(h, 'options') || []).slice(0, 1).map(o => ({
                        id: val(o, 'id'),
                        remarkId: val(o, 'remarkId'),
                        option: String(val(o, 'option') || '')
                    }))
                }))
            });
        });
        return {
            id: val(r, 'id'),
            classId: val(r, 'classId'),
            className: val(r, 'className') || '',
            academicYearId: val(r, 'academicYearId'),
            academicYearName: val(r, 'academicYearName') || '',
            termId: val(r, 'termId'),
            termName: val(r, 'termName') || '',
            tenantId: val(r, 'tenantId'),
            assessment: lines
        };
    };

    const app = Vue.createApp({
        data() {
            return {
                isShimmerLoading: true,
                activeTab: 'headers',  // 'headers' | 'assessment'

                academicYears: [],
                terms: [],
                classes: [],
                students: [],
                remarkHeaders: [],
                midTermAssessments: [],

                // ---- Tab 1 state (single data-grid with child Options column) ----
                theme: '#062a81',
                headerColumns: [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'name', label: 'Remark Header', type: 'text', required: true, editable: true, searchable: true, width: '250' },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false },
                ],
                optionDetailCol: {
                    key: 'options',
                    title: 'Options',
                    columns: [
                        { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                        {
                            key: 'remarkId',
                            label: 'Header ID',
                            type: 'text',
                            hidden: true,
                            editable: false,
                            searchable: false,
                            defaultValue: (row, column, parentRow) => (parentRow && parentRow.id) || '',
                            disabled: true
                        },
                        { key: 'option', label: 'Option', type: 'text', required: true, editable: true, searchable: true, width: '250' }
                    ]
                },

                // ---- Tab 2 state ----
                academicYearId: '',
                termId: '',
                classId: '',
                studentPage: 1,
                studentsPerPage: 10,
                selections: {},        
                lineIds: {}
            };
        },

        computed: {
            // ---------- shared ----------
            scopeReady() {
                return !!(this.academicYearId && this.termId && this.classId);
            },
            today() {
                const d = new Date();
                return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            },
            // ---------- tab 2 ----------
            studentsInClass() {
                if (!this.classId) return [];
                return this.students.filter(s => (s.classId === this.classId));
            },
            totalStudentPages() {
                return Math.max(1, Math.ceil(this.studentsInClass.length / this.studentsPerPage));
            },
            clampedStudentPage() {
                return Math.min(this.studentPage, this.totalStudentPages);
            },
            pagedStudents() {
                const start = (this.clampedStudentPage - 1) * this.studentsPerPage;
                return this.studentsInClass.slice(start, start + this.studentsPerPage);
            },
            studentShowingFrom() {
                return this.studentsInClass.length === 0 ? 0 : (this.clampedStudentPage - 1) * this.studentsPerPage + 1;
            },
            studentShowingTo() {
                return Math.min(this.clampedStudentPage * this.studentsPerPage, this.studentsInClass.length);
            },
            existingRecord() {
                if (!this.scopeReady) return null;
                return this.midTermAssessments.find(r =>
                    (r.academicYearId === this.academicYearId)
                    && (r.termId === this.termId)
                    && (r.classId === this.classId)) || null;
            },
            optionChoices() {
                // same for every cell: every header offers "Not set" + its own options
                return this.remarkHeaders.map(h => ({
                    headerId: h.id,
                    options: [{ id: '', name: '— Not set —' }].concat(h.options.map(o => ({ id: o.id, name: o.option })))
                }));
            },
            studentsWithSelections() {
                return this.studentsInClass.filter(s => {
                    const m = this.selections[String(s.id).toLowerCase()];
                    return m && Object.keys(m).some(k => m[k]);
                });
            },
            anySelection() {
                return this.studentsWithSelections.length > 0;
            }
        },

        watch: {
            academicYearId() { this.fillSelectionsFromExisting(); },
            termId() { this.fillSelectionsFromExisting(); },
            classId() { this.fillSelectionsFromExisting(); }
        },

        methods: {
            /* ---------- setup ---------- */
            getSetupData() {
                this.isShimmerLoading = true;
                return Promise.all([
                    axios.get('/SchoolManager/GetAssessmentRemarkHeaders/'),
                    axios.get('/SchoolManager/GetAcademicYears/'),
                    axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                    axios.get('/SchoolManager/GetLevelClasses/'),
                    axios.get('/SchoolManager/GetStudentBios/'),
                    axios.get('/SchoolManager/GetMidTermAssessments/'),
                ]).then(([headersRes, years, terms, levelClasses, bios, midterm]) => {
                    this.remarkHeaders = (headersRes.data.result || []).map(normalizeHeader).filter(h => h.id != null);
                    this.academicYears = normalizeLookups(years.data.result);
                    this.terms = normalizeLookups(terms.data);
                    this.classes = normalizeClasses(levelClasses.data.result);
                    this.students = normalizeStudents(bios.data.result);
                    this.midTermAssessments = (midterm.data.result || []).map(normalizeAssessmentRecord).filter(r => r.id != null);
                    this.fillSelectionsFromExisting();
                    this.isShimmerLoading = false;
                }).catch(() => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load setups.');
                });
            },

            refreshHeaders() {
                return axios.get('/SchoolManager/GetAssessmentRemarkHeaders/').then(res => {
                    this.remarkHeaders = (res.data.result || []).map(normalizeHeader).filter(h => h.id != null);
                });
            },

            refreshMidTermAssessments() {
                return axios.get('/SchoolManager/GetMidTermAssessments/').then(res => {
                    this.midTermAssessments = (res.data.result || []).map(normalizeAssessmentRecord).filter(r => r.id != null);
                });
            },

            nameOf(list, id) {
                const item = list.find(x => (x.id === id));
                return item ? item.name : '';
            },

            /* ==========================================================
             * TAB 1 — REMARK HEADERS  (single data-grid with child Options)
             * level 0 = remark header, level 1 = its options
             * ========================================================== */
            async onCreate(event) {
                const row = event?.row || event?.data;
                const level = Number(event?.level ?? 0);
                if (!row) return;

                if (level === 0) {
                    await this.createHeader(row);
                    return;
                }

                const parentHeaderId = event?.grid?.parentRow?.id || row.remarkId;
                if (!parentHeaderId) {
                    this.toastHandler('error', 'Remark header was not found for this option.');
                    return;
                }

                row.remarkId = parentHeaderId;
                await this.saveHeaderDetail(parentHeaderId, row, 'create');
            },

            async onUpdate(event) {
                const row = event?.row || event?.data;
                const level = Number(event?.level ?? 0);
                if (!row) return;

                if (level === 0) {
                    await this.updateHeader(row);
                    return;
                }

                const parentHeaderId = event?.grid?.parentRow?.id || row.remarkId;
                if (!parentHeaderId) {
                    this.toastHandler('error', 'Remark header was not found for this option.');
                    return;
                }

                row.remarkId = parentHeaderId;
                await this.saveHeaderDetail(parentHeaderId, row, 'update');
            },

            async onDelete(event) {
                const rows = Array.isArray(event?.rows) ? event.rows : [];
                const level = Number(event?.level ?? 0);
                if (!rows.length) return;

                if (level === 0) {
                    await this.deleteHeaders(rows);
                    return;
                }

                if (level === 1) {
                    const parentHeaderId =
                        event?.grid?.parentRow?.id ||
                        rows.find(row => row.remarkId)?.remarkId;

                    if (!parentHeaderId) {
                        this.toastHandler('error', 'Remark header was not found for these options.');
                        return;
                    }

                    await this.deleteHeaderOptions(parentHeaderId, rows);
                }
            },

            async createHeader(row) {
                const payload = {
                    ...row,
                    options: (row.options || []).map(o => ({
                        id: asGuid(o.id),
                        option: String(o.option || '').trim()
                    }))
                };
                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/CreateAssessmentRemarkHeader/', payload);
                    this.toastHandler('success', 'Remark header saved.');
                    await this.refreshHeaders();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                    await this.refreshHeaders();
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async updateHeader(row) {
                const existing = this.remarkHeaders.find(h => (h.id === row.id));
                if (!existing) {
                    this.toastHandler('error', 'Remark header was not found.');
                    await this.refreshHeaders();
                    return;
                }
                const name = String(row.name || '').trim();
                if (!name) {
                    this.toastHandler('warning', 'Name cannot be empty.');
                    return;
                }
                const options = (row.options || existing.options || []).map(o => ({
                    id: asGuid(o.id),
                    remarkId: existing.id,
                    option: String(o.option || '').trim()
                }));
                const payload = {
                    ...existing,
                    ...row,
                    id: existing.id,
                    tenantId: existing.tenantId,
                    name,
                    options
                };
                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/UpdateAssessmentRemarkHeader/', payload);
                    await this.refreshHeaders();
                    this.toastHandler('success', 'Remark header updated.');
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async saveHeaderDetail(headerId, row, action) {
                const existing = this.remarkHeaders.find(h => (h.id === headerId));
                if (!existing) {
                    this.toastHandler('error', 'Remark header was not found.');
                    return;
                }
                const text = String(row.option || '').trim();
                if (!text) {
                    this.toastHandler('warning', 'Type an option first.');
                    return;
                }
                let details = [...(existing.options || [])];
                const detail = {
                    ...row,
                    id: asGuid(row.id),
                    remarkId: headerId,
                    option: text
                };
                if (action === 'create') {
                    details = details.filter(o => o.id !== row.id && !sameText(o.option, text));
                    details.push(detail);
                } else {
                    details = details.map(item => item.id === row.id ? detail : item);
                }
                await this.saveHeaderWithOptions(existing, details, action);
            },

            async deleteHeaders(rows) {
                this.isShimmerLoading = true;
                try {
                    const results = await Promise.allSettled(
                        rows.map(row => axios.get('/SchoolManager/DeleteAssessmentRemarkHeader?id=' + row.id))
                    );
                    const failed = results.filter(r => r.status === 'rejected').length;
                    if (failed) {
                        this.toastHandler('warning', (rows.length - failed) + ' header(s) deleted; ' + failed + ' failed.');
                    } else {
                        this.toastHandler('success', rows.length + ' header(s) deleted.');
                    }
                    await this.refreshHeaders();
                } catch (err) {
                    this.toastHandler('error', 'Failed to delete remark headers.');
                    await this.refreshHeaders();
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async deleteHeaderOptions(headerId, rows) {
                if (!headerId || !Array.isArray(rows) || !rows.length) return;

                const existing = this.remarkHeaders.find(header =>
                    sameId(header.id, headerId)
                );

                // A not-yet-saved DataGrid draft has a generated non-GUID ID.
                // The grid has already removed its option locally, so don't send it to the API.
                if (!existing && !isGuid(headerId)) return;

                if (!existing) {
                    this.toastHandler('error', 'Remark header was not found.');
                    await this.refreshHeaders().catch(() => {});
                    return;
                }

                const deletedIds = new Set(
                    rows
                        .map(row => row.id)
                        .filter(id => id != null)
                        .map(id => String(id).toLowerCase())
                );

                const remainingOptions = (existing.options || []).filter(option =>
                    !deletedIds.has(String(option.id || '').toLowerCase())
                );

                // Options are embedded in the header, so persist the updated parent.
                await this.saveHeaderWithOptions(existing, remainingOptions, 'delete');
            },
            async saveHeaderWithOptions(header, options, action) {
                const seen = {};
                const uniqueOptions = (options || []).filter(o => {
                    const k = String(o.option || '').trim().toLowerCase();
                    if (!k || seen[k]) return false;
                    seen[k] = true;
                    return true;
                });
                const payload = {
                    ...header,
                    tenantId: header.tenantId,
                    options: uniqueOptions.map(o => ({
                        id: asGuid(o.id),
                        remarkId: header.id,
                        option: String(o.option || '').trim()
                    }))
                };
                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/UpdateAssessmentRemarkHeader/', payload);
                    await this.refreshHeaders();
                    const message = action === 'create'
                        ? 'Option saved.'
                        : action === 'update'
                            ? 'Option updated.'
                            : 'Option(s) deleted.';
                    this.toastHandler('success', message);
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ==========================================================
             * TAB 2 — ASSESSMENT per student
             * ========================================================== */
            fillSelectionsFromExisting() {
                this.studentPage = 1;
                this.selections = {};
                this.lineIds = {};
                const rec = this.existingRecord;
                if (!rec) return;
                const sel = {}, ids = {};
                rec.assessment.forEach(line => {
                    const sKey = String(line.studentId).toLowerCase();
                    ids[sKey] = line.id;
                    const byHeader = {};
                    (line.headers || []).forEach(h => {
                        const chosen = (h.options || [])[0];
                        if (chosen && h.id) byHeader[String(h.id).toLowerCase()] = chosen.id;
                    });
                    sel[sKey] = byHeader;
                });
                this.selections = sel;
                this.lineIds = ids;
            },

            selectionOf(studentId, headerId) {
                const s = this.selections[String(studentId).toLowerCase()];
                return s ? (s[String(headerId).toLowerCase()] || '') : '';
            },

            optionsFor(header) {
                return [{ id: '', name: '— Not set —' }]
                    .concat((header.options || []).map(o => ({ id: o.id, name: o.option })));
            },

            studentGlobalIndex(index) {
                return (this.clampedStudentPage - 1) * this.studentsPerPage + index + 1;
            },

            setSelection(studentId, headerId, payload) {
                // w-select may emit the value itself or the option row
                let value = (payload && typeof payload === 'object') ? val(payload, 'id') : payload;
                value = value == null ? '' : String(value);
                const sKey = String(studentId).toLowerCase(), hKey = String(headerId).toLowerCase();
                this.selections = {
                    ...this.selections,
                    [sKey]: { ...(this.selections[sKey] || {}), [hKey]: value }
                };
            },

            clearStudent(studentId) {
                const sKey = String(studentId).toLowerCase();
                this.selections = { ...this.selections, [sKey]: {} };
            },

            clearAllStudents() {
                this.selections = {};
            },

            buildStudentLines() {
                const rec = this.existingRecord;
                return this.studentsInClass
                    .filter(s => Object.values(this.selections[String(s.id).toLowerCase()] || {}).some(Boolean))
                    .map(s => {
                        const sKey = String(s.id).toLowerCase();
                        const byHeader = this.selections[sKey] || {};
                        const headers = this.remarkHeaders
                            .filter(h => byHeader[String(h.id).toLowerCase()])
                            .map(h => {
                                const chosen = h.options.find(o => o.id === byHeader[String(h.id).toLowerCase()]);
                                if (!chosen) return null;
                                return {
                                    ...h,
                                    options: [{ id: chosen.id, remarkId: h.id, option: chosen.option }]
                                };
                            })
                            .filter(Boolean);
                        return {
                            id: this.lineIds[sKey] || uuid(),
                            ...(rec ? { midTermAssessmentId: rec.id } : {}), // omit on create — '' is not a valid Guid
                            studentId: s.id,
                            studentName: s.name,
                            headers
                        };
                    })
                    .filter(line => line.headers.length > 0);
            },

            async saveAssessment() {
                if (!this.scopeReady) return this.toastHandler('warning', 'Pick an academic year, term and class.');

                const rec = this.existingRecord;
                const lines = this.buildStudentLines();

                if (lines.length === 0) {
                    if (rec) {
                        // never leave an empty record behind — removing the last line removes the parent
                        if (!(await confirmDialog({ tone: 'danger', title: 'Delete assessment record?', text: 'No remarks are selected anymore. Delete the whole assessment record for this class and term?', confirmText: 'Yes, delete' }))) return;
                        return this.deleteAssessmentRecord(true);
                    }
                    return this.toastHandler('warning', 'Pick at least one remark for at least one student.');
                }

                const payload = {
                    classId: this.classId,
                    className: this.nameOf(this.classes, this.classId),
                    academicYearId: this.academicYearId,
                    academicYearName: this.nameOf(this.academicYears, this.academicYearId),
                    termId: this.termId,
                    termName: this.nameOf(this.terms, this.termId),
                    assessment: lines
                };

                this.isShimmerLoading = true;
                try {
                    if (rec) {
                        await axios.post('/SchoolManager/UpdateMidTermAssessment/', { ...payload, id: rec.id, tenantId: rec.tenantId });
                        this.toastHandler('success', 'Assessment updated.');
                    } else {
                        await axios.post('/SchoolManager/CreateMidTermAssessment/', payload); // no tenantId on create
                        this.toastHandler('success', 'Assessment saved.');
                    }
                    await this.refreshMidTermAssessments();
                    this.fillSelectionsFromExisting();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async deleteAssessmentRecord(silentNoConfirm) {
                const rec = this.existingRecord;
                if (!rec) return;
                if (!silentNoConfirm && !(await confirmDialog({ tone: 'danger', title: 'Delete assessment record?', text: 'Delete the assessment record for this class and term?', confirmText: 'Yes, delete' }))) return;
                this.isShimmerLoading = true;
                try {
                    await axios.get('/SchoolManager/DeleteMidTermAssessment?id=' + rec.id);
                    this.toastHandler('success', 'Assessment record deleted.');
                    await this.refreshMidTermAssessments();
                    this.fillSelectionsFromExisting();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            setStudentPage(p) {
                this.studentPage = Math.min(Math.max(1, p), this.totalStudentPages);
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

    if (typeof DataGridPlugin !== 'undefined') {
        app.use(DataGridPlugin);
    } else {
        console.error('DataGridPlugin not found — load the data-grid plugin before js/school-manager/mid-term-assessment.js');
    }
    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    } else {
        console.error('WSelectPlugin not found — load the w-select plugin before js/school-manager/mid-term-assessment.js');
    }

    app.mount('#app');
})();
