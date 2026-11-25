/* ==========================================================================
 * Assign Subjects — both tabs.
 * Uses the same pattern as getSetupData() on your other pages.
 * Only your existing controller actions are called — no new endpoints.
 * ========================================================================== */
(function () {
    'use strict';

    const sameId = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

    // tolerate PascalCase / camelCase without a big framework
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
        .filter(o => o.id != null && o.name !== '');

    // GetLevelClasses rows look like:
    //   { id, levelId, levelName, classId, className, streamId, streamName, ordinal, ... }
    // AssignedSubject.ClassId stores the ROW's id, and the dropdown label is className.
    // (Rows with the same className but different streams stay separate entries.)
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

    // details are de-duped by SubjectId so a subject can never appear twice
    const normalizeAssignment = a => {
        const seen = {};
        const details = [];
        (val(a, 'details') || []).forEach(d => {
            const subjectId = val(d, 'subjectId');
            const key = String(subjectId || '').toLowerCase();
            if (!key || seen[key]) return;
            seen[key] = true;
            details.push({
                id: val(d, 'id') || newId(),
                subjectId: subjectId,
                subjectName: val(d, 'subjectName') || ''
            });
        });
        return {
            id: val(a, 'id'),
            academicYearId: val(a, 'academicYearId'),
            academicYearName: val(a, 'academicYearName') || '',
            classId: val(a, 'classId'),
            className: val(a, 'className') || '',
            termId: val(a, 'termId'),
            termName: val(a, 'termName') || '',
            tenantId: val(a, 'tenantId'),
            details: details
        };
    };

    const app = Vue.createApp({
        data() {
            return {
                isShimmerLoading: true,
                savingSingle: false,
                copyingBulk: false,

                classes: [],
                terms: [],
                subjects: [],
                academicYears: [],
                assignedSubjects: [],

                activeTab: 'single',
                toasts: [],

                single: {
                    academicYearId: '',
                    termId: '',
                    classId: '',
                    subjectIds: [],
                    subjectFilter: ''
                },
                bulk: {
                    academicYearId: '',
                    termId: '',
                    sourceAssignedSubjectId: '',
                    targetClassIds: []
                },
                copyResults: []
            };
        },

        computed: {
            /* ---------- TAB 1 ---------- */
            singleContextReady() {
                return !!(this.single.academicYearId && this.single.termId && this.single.classId);
            },
            existingSingleAssignment() {
                if (!this.singleContextReady) return null;
                return this.assignedSubjects.find(a =>
                    sameId(a.academicYearId, this.single.academicYearId) &&
                    sameId(a.termId, this.single.termId) &&
                    sameId(a.classId, this.single.classId)) || null;
            },
            filteredSubjects() {
                const q = this.single.subjectFilter.trim().toLowerCase();
                if (!q) return this.subjects;
                return this.subjects.filter(s => (s.name || '').toLowerCase().includes(q));
            },
            allFilteredSelected() {
                if (!this.filteredSubjects.length) return false;
                return this.filteredSubjects.every(s => this.isSubjectSelected(s.id));
            },
            selectedSubjectsSummary() {
                const n = this.single.subjectIds.length;
                return n === 0 ? 'No subjects selected yet.' : n + (n === 1 ? ' subject' : ' subjects') + ' selected.';
            },

            // duplicate assignments already in the data (e.g. created before this page)
            duplicateGroups() {
                const map = {};
                this.assignedSubjects.forEach(a => {
                    if (!a.academicYearId || !a.termId || !a.classId) return;
                    const key = [a.academicYearId, a.termId, a.classId].map(x => String(x).toLowerCase()).join('|');
                    (map[key] = map[key] || []).push(a);
                });
                return Object.values(map)
                    .filter(list => list.length > 1)
                    .map(list => ({
                        key: String(list[0].classId).toLowerCase() + '|' + String(list[0].termId).toLowerCase() + '|' + String(list[0].academicYearId).toLowerCase(),
                        label: (list[0].className || 'Class') + ' — ' + (list[0].termName || 'Term') + ' ' + (list[0].academicYearName || ''),
                        count: list.length,
                        items: list
                    }));
            },

            /* ---------- TAB 2 ---------- */
            bulkScopeReady() {
                return !!(this.bulk.academicYearId && this.bulk.termId);
            },
            assignmentsInScope() {
                if (!this.bulkScopeReady) return [];
                return this.assignedSubjects.filter(a =>
                    sameId(a.academicYearId, this.bulk.academicYearId) &&
                    sameId(a.termId, this.bulk.termId));
            },
            sourceClassOptions() {
                return this.assignmentsInScope
                    .filter(a => a.details.length)
                    .map(a => ({ id: a.id, name: (a.className || 'Class') + ' (' + a.details.length + ' subject' + (a.details.length === 1 ? '' : 's') + ')' }))
                    .sort((a, b) => a.name.localeCompare(b.name));
            },
            sourceAssignment() {
                if (!this.bulk.sourceAssignedSubjectId) return null;
                return this.assignedSubjects.find(a => sameId(a.id, this.bulk.sourceAssignedSubjectId)) || null;
            },
            // classes WITHOUT an assignment for the chosen year + term = "classes that do not have subjects"
            targetPool() {
                const taken = {};
                this.assignmentsInScope.forEach(a => { taken[String(a.classId).toLowerCase()] = true; });
                return this.classes.filter(c => !taken[String(c.id).toLowerCase()]);
            },
            allTargetsSelected() {
                return this.targetPool.length > 0 && this.targetPool.every(c => this.isTargetSelected(c.id));
            },
            copySummary() {
                const summary = { Created: 0, Skipped: 0, Failed: 0 };
                this.copyResults.forEach(r => { if (summary[r.status] !== undefined) summary[r.status]++; });
                return summary;
            }
        },

        watch: {
            // prefill from the existing assignment whenever the context changes
            'single.academicYearId': 'fillFromExisting',
            'single.termId': 'fillFromExisting',
            'single.classId': 'fillFromExisting',

            'bulk.academicYearId': 'resetBulkCopy',
            'bulk.termId': 'resetBulkCopy',

            // keep the ticked targets inside the current pool
            targetPool() {
                const pool = {};
                this.targetPool.forEach(c => { pool[String(c.id).toLowerCase()] = true; });
                this.bulk.targetClassIds = this.bulk.targetClassIds.filter(id => pool[String(id).toLowerCase()]);
            }
        },

        methods: {
            /* ---------- setup (same pattern as your other pages) ---------- */
            getSetupData() {
                this.isShimmerLoading = true;
                return Promise.all([
                    axios.get('/SchoolManager/GetLevelClasses/'),
                    axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                    axios.get('/SchoolManager/GetSubjects/'),
                    axios.get('/SchoolManager/GetAcademicYears/'),
                    axios.get('/SchoolManager/GetAssignedSubjects/'),
                ]).then(([classes, terms, subjects, years, assignedSubjects]) => {
                    this.classes = normalizeClasses(classes.data.result);
                    this.terms = normalizeLookups(terms.data);
                    this.subjects = normalizeLookups(subjects.data.result);
                    this.academicYears = normalizeLookups(years.data.result);
                    this.assignedSubjects = (assignedSubjects.data.result || []).map(normalizeAssignment);
                    this.isShimmerLoading = false;
                }).catch(err => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load setups.');
                });
            },

            refreshAssignedSubjects() {
                return axios.get('/SchoolManager/GetAssignedSubjects/').then(res => {
                    this.assignedSubjects = (res.data.result || []).map(normalizeAssignment);
                });
            },

            nameOf(list, id) {
                const item = list.find(x => sameId(x.id, id));
                return item ? item.name : '';
            },

            shortId(id) {
                return String(id || '').substring(0, 8);
            },

            /* ---------- tiny toast (replace with yours if you have a mixin) ---------- */
            toastHandler(type, message) {
                const id = newId();
                this.toasts.push({ id, type, message });
                setTimeout(() => this.dismissToast(id), 5000);
            },
            dismissToast(id) {
                this.toasts = this.toasts.filter(t => t.id !== id);
            },

            /* ================= TAB 1 — assign to ONE class ================= */
            fillFromExisting() {
                const existing = this.existingSingleAssignment;
                this.single.subjectIds = existing ? existing.details.map(d => d.subjectId) : [];
            },
            isSubjectSelected(id) {
                return this.single.subjectIds.some(x => sameId(x, id));
            },
            isSubjectAlreadyAssigned(id) {
                const existing = this.existingSingleAssignment;
                return !!existing && existing.details.some(d => sameId(d.subjectId, id));
            },
            toggleSubject(id) {
                const i = this.single.subjectIds.findIndex(x => sameId(x, id));
                if (i === -1) this.single.subjectIds.push(id);
                else this.single.subjectIds.splice(i, 1);
            },
            toggleSelectAllFiltered() {
                if (this.allFilteredSelected) {
                    const filtered = {};
                    this.filteredSubjects.forEach(s => { filtered[String(s.id).toLowerCase()] = true; });
                    this.single.subjectIds = this.single.subjectIds.filter(id => !filtered[String(id).toLowerCase()]);
                } else {
                    this.filteredSubjects.forEach(s => { if (!this.isSubjectSelected(s.id)) this.single.subjectIds.push(s.id); });
                }
            },
            clearSubjectSelection() {
                this.single.subjectIds = [];
            },
            resetSingleForm() {
                this.single.classId = '';
                this.single.subjectIds = [];
                this.single.subjectFilter = '';
            },
            async saveSingle() {
                if (this.savingSingle) return;

                const y = this.single.academicYearId, t = this.single.termId, c = this.single.classId;
                if (!y || !t || !c) return this.toastHandler('warning', 'Choose an academic year, a term and a class.');

                // hard de-dupe (UI normally prevents this)
                const seen = {};
                const subjectIds = this.single.subjectIds.filter(id => {
                    const k = String(id).toLowerCase();
                    if (seen[k]) return false;
                    seen[k] = true;
                    return true;
                });
                if (!subjectIds.length) return this.toastHandler('warning', 'Select at least one subject.');

                this.savingSingle = true;
                try {
                    // fresh check right before saving — a class can never be assigned twice
                    try { await this.refreshAssignedSubjects(); } catch (e) { /* use cached list */ }

                    const existing = this.assignedSubjects.find(a =>
                        sameId(a.academicYearId, y) && sameId(a.termId, t) && sameId(a.classId, c)) || null;

                    const details = subjectIds.map(id => {
                        const subject = this.subjects.find(s => sameId(s.id, id));
                        const keep = existing && existing.details.find(d => sameId(d.subjectId, id));
                        const detail = {
                            id: keep ? keep.id : newId(),
                            subjectId: id,
                            subjectName: subject ? subject.name : ''
                        };
                        if (existing) detail.assignedSubjectId = existing.id;
                        return detail;
                    });

                    const base = {
                        academicYearId: y,
                        academicYearName: this.nameOf(this.academicYears, y),
                        classId: c,
                        className: this.nameOf(this.classes, c),
                        termId: t,
                        termName: this.nameOf(this.terms, t),
                        details: details
                    };

                    if (existing) {
                        await axios.post('/SchoolManager/UpdateAssignedSubject/', {
                            id: existing.id,
                            tenantId: existing.tenantId,   // TenantId ONLY on updates
                            ...base
                        });
                        this.toastHandler('success', 'Existing assignment updated — no duplicate created.');
                    } else {
                        await axios.post('/SchoolManager/CreateAssignedSubject/', base); // no tenantId on create
                        this.toastHandler('success', 'Subjects assigned to the class.');
                    }

                    await this.refreshAssignedSubjects().catch(() => { /* non-fatal */ });
                    this.fillFromExisting();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.savingSingle = false;
                }
            },
            async deleteSingleExisting() {
                const existing = this.existingSingleAssignment;
                if (!existing) return;
                if (!window.confirm('Remove the subject assignment for "' + this.nameOf(this.classes, this.single.classId) + '"? This cannot be undone.')) return;
                try {
                    await axios.delete('/SchoolManager/DeleteAssignedSubject/?id=' + existing.id);
                    this.toastHandler('success', 'Assignment deleted.');
                    await this.refreshAssignedSubjects();
                    this.fillFromExisting();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                }
            },
            async deleteAssignmentById(assignment) {
                if (!window.confirm('Delete this assignment (' + (assignment.className || 'class') + ')?')) return;
                try {
                    await axios.delete('/SchoolManager/DeleteAssignedSubject/?id=' + assignment.id);
                    this.toastHandler('success', 'Duplicate removed.');
                    await this.refreshAssignedSubjects();
                    this.fillFromExisting();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                }
            },

            /* ================= TAB 2 — apply to MANY classes ================= */
            resetBulkCopy() {
                this.bulk.sourceAssignedSubjectId = '';
                this.bulk.targetClassIds = [];
                this.copyResults = [];
            },
            isTargetSelected(id) {
                return this.bulk.targetClassIds.some(x => sameId(x, id));
            },
            toggleTarget(id) {
                const i = this.bulk.targetClassIds.findIndex(x => sameId(x, id));
                if (i === -1) this.bulk.targetClassIds.push(id);
                else this.bulk.targetClassIds.splice(i, 1);
            },
            toggleSelectAllTargets() {
                this.bulk.targetClassIds = this.allTargetsSelected ? [] : this.targetPool.map(c => c.id);
            },
            async applyToMultipleClasses() {
                if (this.copyingBulk) return;

                const y = this.bulk.academicYearId, t = this.bulk.termId;
                if (!y || !t) return this.toastHandler('warning', 'Choose an academic year and a term.');
                if (!this.bulk.sourceAssignedSubjectId) return this.toastHandler('warning', 'Choose a source class (one that already has subjects).');

                const selectedIds = this.bulk.targetClassIds.slice();
                if (!selectedIds.length) return this.toastHandler('warning', 'Tick at least one class without subjects.');

                this.copyingBulk = true;
                this.copyResults = [];
                try {
                    // fresh list first — never copy based on stale data
                    try { await this.refreshAssignedSubjects(); } catch (e) { /* use cached list */ }

                    const source = this.assignedSubjects.find(a => sameId(a.id, this.bulk.sourceAssignedSubjectId));
                    if (!source) throw new Error('The source assignment no longer exists. Refresh and pick it again.');
                    if (!source.details.length) throw new Error('The source class has no subjects to copy.');

                    const yearName = this.nameOf(this.academicYears, y);
                    const termName = this.nameOf(this.terms, t);

                    // classes already assigned in this scope — skip them, no duplicates
                    const taken = {};
                    this.assignedSubjects.forEach(a => {
                        if (sameId(a.academicYearId, y) && sameId(a.termId, t)) {
                            taken[String(a.classId).toLowerCase()] = true;
                        }
                    });

                    // copy one class at a time, in order
                    for (const classId of selectedIds) {
                        const cls = this.classes.find(c => sameId(c.id, classId));
                        const className = (cls && cls.name) || 'Class';
                        const entry = { classId, className, status: '', message: '' };

                        if (taken[String(classId).toLowerCase()]) {
                            entry.status = 'Skipped';
                            entry.message = 'Already has subjects for this academic year and term.';
                            this.copyResults = this.copyResults.concat([entry]);
                            continue;
                        }

                        // fresh detail ids — never reuse the source ids
                        const payload = {
                            academicYearId: y,
                            academicYearName: source.academicYearName || yearName,
                            classId: classId,
                            className: className,
                            termId: t,
                            termName: source.termName || termName,
                            details: source.details.map(d => ({ id: newId(), subjectId: d.subjectId, subjectName: d.subjectName }))
                        }; // no tenantId — creates never send it

                        try {
                            await axios.post('/SchoolManager/CreateAssignedSubject/', payload);
                            taken[String(classId).toLowerCase()] = true;
                            entry.status = 'Created';
                            entry.message = payload.details.length + ' subject(s) assigned.';
                        } catch (err) {
                            entry.status = 'Failed';
                            entry.message = errMsg(err);
                        }
                        this.copyResults = this.copyResults.concat([entry]); // live progress
                    }

                    const created = this.copyResults.filter(r => r.status === 'Created').length;
                    const skipped = this.copyResults.filter(r => r.status === 'Skipped').length;
                    const failed = this.copyResults.filter(r => r.status === 'Failed').length;
                    this.toastHandler(failed ? 'warning' : 'success',
                        'Apply complete: ' + created + ' created, ' + skipped + ' skipped, ' + failed + ' failed.');

                    this.bulk.targetClassIds = [];
                    await this.refreshAssignedSubjects().catch(() => { /* non-fatal */ });
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.copyingBulk = false;
                }
            }
        },

        mounted() {
            this.getSetupData();
        }
    });
    app.use(WSelectPlugin);
    app.mount('#app');
})();
