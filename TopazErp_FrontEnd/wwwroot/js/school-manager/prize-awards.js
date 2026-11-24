(function () {
    'use strict';

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

    // prize/award types keep tenantId — updates must send it back
    const normalizeTypes = list => (list || [])
        .map(o => ({ id: val(o, 'id'), name: val(o, 'name') || '', tenantId: val(o, 'tenantId') }))
        .filter(o => o.id != null && o.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    // levels come from the same GetLevelClasses payload (distinct levelId -> levelName)
    const normalizeLevels = list => {
        const map = {};
        (list || []).forEach(c => {
            const id = val(c, 'levelId'), name = val(c, 'levelName');
            if (id && name && !map[String(id).toLowerCase()]) map[String(id).toLowerCase()] = { id, name };
        });
        return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
    };

    // GetStudentBios shape not verified — id tries id/studentId/studentID,
    // name tries studentName/fullName/name/firstName+lastName, levelId optional
    const normalizeStudents = list => (list || [])
        .map(s => ({
            id: val(s, 'id') || val(s, 'studentId') || val(s, 'studentID'),
            name: val(s, 'studentName') || val(s, 'fullName') || val(s, 'name')
                || [val(s, 'firstName'), val(s, 'lastName')].filter(Boolean).join(' ') || '',
            levelId: val(s, 'levelId') || null
        }))
        .filter(s => s.id != null && s.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    // details de-duped by (award, prize, student) so a line can never appear twice
    const normalizePrizeAward = a => {
        const seen = {};
        const details = [];
        (val(a, 'details') || []).forEach(d => {
            const studentId = val(d, 'studentId'), awardId = val(d, 'awardId'), prizeId = val(d, 'prizeId');
            const key = [awardId, prizeId, studentId].map(x => String(x || '').toLowerCase()).join('|');
            if (!studentId || !awardId || !prizeId || seen[key]) return;
            seen[key] = true;
            details.push({
                id: val(d, 'id') || newId(),
                prizeAwardId: val(d, 'prizeAwardId'),
                awardId, awardName: val(d, 'awardName') || '',
                prizeId, prizeName: val(d, 'prizeName') || '',
                studentId, studentName: val(d, 'studentName') || ''
            });
        });
        return {
            id: val(a, 'id'),
            academicYearId: val(a, 'academicYearId'),
            academicYearName: val(a, 'academicYearName') || '',
            termId: val(a, 'termId'),
            termName: val(a, 'termName') || '',
            levelId: val(a, 'levelId'),
            levelName: val(a, 'levelName') || '',
            tenantId: val(a, 'tenantId'),
            details
        };
    };

    const lineKeyOf = l => [l.awardId, l.prizeId, l.studentId].map(x => String(x || '').toLowerCase()).join('|');

    const app = Vue.createApp({
        data() {
            return {
                isShimmerLoading: false,
                activeTab: 'prizes',   // 'prizes' | 'awards' | 'awarded'
                theme: '#062a81',

                prizeTypeColumns: [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'name', label: 'Prize Type', type: 'text', required: true, editable: true, searchable: true, width: '250' },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false },
                ],
                awardTypeColumns: [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'name', label: 'Award Type', type: 'text', required: true, editable: true, searchable: true, width: '250' },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false, searchable: false },
                ],

                prizeTypes: [],
                awardTypes: [],
                prizeAwards: [],
                academicYears: [],
                terms: [],
                levels: [],
                students: [],

                // prize awarded tab
                awarded: { academicYearId: '', termId: '', levelId: '' },
                lineDraftAwardId: '',
                lineDraftPrizeId: '',
                studentFilter: '',
                selectedStudentIds: [],
                lines: []
            };
        },

        computed: {
            awardedContextReady() {
                return !!(this.awarded.academicYearId && this.awarded.termId && this.awarded.levelId);
            },
            existingPrizeAward() {
                if (!this.awardedContextReady) return null;
                return this.prizeAwards.find(a =>
                    sameId(a.academicYearId, this.awarded.academicYearId) &&
                    sameId(a.termId, this.awarded.termId) &&
                    sameId(a.levelId, this.awarded.levelId)) || null;
            },
            studentsHaveLevel() {
                return this.students.some(s => s.levelId);
            },
            filteredStudents() {
                let list = this.students;
                const levelId = this.awarded.levelId;
                if (levelId && this.studentsHaveLevel) {
                    list = list.filter(s => sameId(s.levelId, levelId));
                }
                const q = this.studentFilter.trim().toLowerCase();
                if (q) list = list.filter(s => s.name.toLowerCase().includes(q));
                return list;
            },
            allFilteredStudentsSelected() {
                return this.filteredStudents.length > 0 && this.filteredStudents.every(s => this.isStudentSelected(s.id));
            },
            lineCountByAward() {
                const map = {};
                this.lines.forEach(l => { map[lineKeyOf(l)] = true; });
                return map;
            }
        },

        watch: {
            'awarded.academicYearId': 'fillAwardedFromExisting',
            'awarded.termId': 'fillAwardedFromExisting',
            'awarded.levelId': 'fillAwardedFromExisting'
        },

        methods: {
            /* ---------- setup ---------- */
            getSetupData() {
                this.isShimmerLoading = true;
                return Promise.all([
                    axios.get('/SchoolManager/GetPrizeTypes/'),
                    axios.get('/SchoolManager/GetAwardTypes/'),
                    axios.get('/SchoolManager/GetAcademicYears/'),
                    axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                    axios.get('/SchoolManager/GetLevelClasses/'),
                    axios.get('/SchoolManager/GetStudentBios/'),
                    axios.get('/SchoolManager/GetPrizeAwards/'),
                ]).then(([prizeTypes, awardTypes, years, terms, levelClasses, students, prizeAwards]) => {
                    this.prizeTypes = normalizeTypes(prizeTypes.data.result);
                    this.awardTypes = normalizeTypes(awardTypes.data.result);
                    this.academicYears = normalizeLookups(years.data.result);
                    this.terms = normalizeLookups(terms.data);
                    this.levels = normalizeLevels(levelClasses.data.result);
                    this.students = normalizeStudents(students.data.result);
                    this.prizeAwards = (prizeAwards.data.result || []).map(normalizePrizeAward);
                    this.isShimmerLoading = false;
                }).catch(() => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load setups.');
                });
            },

            getPrizeTypes() {
                return axios.get('/SchoolManager/GetPrizeTypes/').then(r => {
                    this.prizeTypes = normalizeTypes(r.data.result);
                });
            },
            getAwardTypes() {
                return axios.get('/SchoolManager/GetAwardTypes/').then(r => {
                    this.awardTypes = normalizeTypes(r.data.result);
                });
            },
            refreshPrizeAwards() {
                return axios.get('/SchoolManager/GetPrizeAwards/').then(r => {
                    this.prizeAwards = (r.data.result || []).map(normalizePrizeAward);
                });
            },

            nameOf(list, id) {
                const item = list.find(x => sameId(x.id, id));
                return item ? item.name : '';
            },
            shortId(id) {
                return String(id || '').substring(0, 8);
            },
            rowOf(event) {
                return (event && (event.row || event.data)) || null;
            },

            /* ================= TAB 1 & 2 — Prize/Award Types (data-grid) ================= */
            onPrizeCreate(event) { const row = this.rowOf(event); return row && this.createType(row, 'prize'); },
            onPrizeUpdate(event) { const row = this.rowOf(event); return row && this.updateType(row, 'prize'); },
            onPrizeDelete(event) { const rows = event && event.rows; return Array.isArray(rows) && rows.length && this.deleteType(rows, 'prize'); },

            onAwardCreate(event) { const row = this.rowOf(event); return row && this.createType(row, 'award'); },
            onAwardUpdate(event) { const row = this.rowOf(event); return row && this.updateType(row, 'award'); },
            onAwardDelete(event) { const rows = event && event.rows; return Array.isArray(rows) && rows.length && this.deleteType(rows, 'award'); },

            async createType(row, kind) {
                const label = kind === 'prize' ? 'Prize type' : 'Award type';
                const name = String((row && row.name) || '').trim();
                if (!name) return this.toastHandler('warning', label + ' name is required.');

                const url = kind === 'prize' ? '/SchoolManager/CreatePrizeType/' : '/SchoolManager/CreateAwardType/';
                const listUrl = kind === 'prize' ? '/SchoolManager/GetPrizeTypes/' : '/SchoolManager/GetAwardTypes/';
                const refresh = () => (kind === 'prize' ? this.getPrizeTypes() : this.getAwardTypes());

                this.isShimmerLoading = true;
                try {
                    // IMPORTANT: check duplicates against the SERVER, not the local list.
                    // The data-grid inserts the optimistic draft row into the local list
                    // before @create fires, so a local check always "finds" the name you
                    // just typed — that is what produced the false "already exists".
                    let fresh = null;
                    try {
                        const res = await axios.get(listUrl);
                        fresh = normalizeTypes(res.data.result);
                    } catch (e) { /* cannot verify right now — proceed like the Streams page */ }

                    /*if (fresh && fresh.some(x => String(x.name).trim().toLowerCase() === name.toLowerCase())) {
                        this.toastHandler('warning', label + ' "' + name + '" already exists.');
                        await refresh().catch(() => { /!* non-fatal *!/ });
                        return;
                    }*/

                    const response = await axios.post(url, { name });
                    if (response.data.result && response.data.result.code === 200) {
                        this.toastHandler('success', label + ' saved.');
                    } else {
                        this.toastHandler('error', (response.data && response.data.message) || 'Unable to save.');
                    }
                    await refresh().catch(() => { /* non-fatal */ });
                } catch (err) {
                    await refresh().catch(() => { /* non-fatal */ });
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            updateType(row, kind) {
                const label = kind === 'prize' ? 'Prize type' : 'Award type';
                const list = kind === 'prize' ? this.prizeTypes : this.awardTypes;
                const existing = list.find(b => sameId(b.id, row.id));
                if (!existing) {
                    this.toastHandler('error', label + ' was not found.');
                    return;
                }

                const payload = {
                    ...existing,
                    ...row,
                    id: existing.id,
                    tenantId: existing.tenantId,   // TenantId ONLY on updates
                    name: String(row.name || '').trim(),
                };
                if (!payload.name) return this.toastHandler('warning', label + ' name is required.');

                const url = kind === 'prize' ? '/SchoolManager/UpdatePrizeType/' : '/SchoolManager/UpdateAwardType/';
                this.isShimmerLoading = true;
                return axios.post(url, payload).then(async () => {
                    await (kind === 'prize' ? this.getPrizeTypes() : this.getAwardTypes());
                    this.toastHandler('success', label + ' updated.');
                    this.isShimmerLoading = false;
                }).catch(() => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to update ' + label.toLowerCase() + '.');
                });
            },

            async deleteType(rows, kind) {
                const label = kind === 'prize' ? 'prize type' : 'award type';
                const deleteUrl = kind === 'prize' ? '/SchoolManager/DeletePrizeType?id=' : '/SchoolManager/DeleteAwardType?id=';
                this.isShimmerLoading = true;
                try {
                    const results = await Promise.allSettled(rows.map(r => axios.get(deleteUrl + r.id)));
                    const failed = results.filter(r => r.status === 'rejected').length;
                    if (failed) {
                        this.toastHandler('warning', `${rows.length - failed} ${label}(s) deleted; ${failed} failed.`);
                    } else {
                        this.toastHandler('success', `${rows.length} ${label}(s) deleted successfully.`);
                    }
                    await (kind === 'prize' ? this.getPrizeTypes() : this.getAwardTypes());
                } catch (err) {
                    this.toastHandler('error', 'Failed to delete ' + label + '.');
                    await (kind === 'prize' ? this.getPrizeTypes() : this.getAwardTypes());
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ================= TAB 3 — Prize Awarded ================= */
            fillAwardedFromExisting() {
                this.selectedStudentIds = [];
                this.studentFilter = '';
                this.lineDraftAwardId = '';
                this.lineDraftPrizeId = '';
                const existing = this.existingPrizeAward;
                this.lines = existing
                    ? existing.details.map(d => ({ ...d }))
                    : [];
            },
            isStudentSelected(id) {
                return this.selectedStudentIds.some(x => sameId(x, id));
            },
            toggleStudent(id) {
                const i = this.selectedStudentIds.findIndex(x => sameId(x, id));
                if (i === -1) this.selectedStudentIds.push(id);
                else this.selectedStudentIds.splice(i, 1);
            },
            toggleSelectAllStudents() {
                if (this.allFilteredStudentsSelected) {
                    const filtered = {};
                    this.filteredStudents.forEach(s => { filtered[String(s.id).toLowerCase()] = true; });
                    this.selectedStudentIds = this.selectedStudentIds.filter(id => !filtered[String(id).toLowerCase()]);
                } else {
                    this.filteredStudents.forEach(s => { if (!this.isStudentSelected(s.id)) this.selectedStudentIds.push(s.id); });
                }
            },
            addLines() {
                if (!this.lineDraftAwardId) return this.toastHandler('warning', 'Pick an award type first.');
                if (!this.lineDraftPrizeId) return this.toastHandler('warning', 'Pick a prize type first.');
                if (!this.selectedStudentIds.length) return this.toastHandler('warning', 'Tick at least one student.');

                const award = this.awardTypes.find(a => sameId(a.id, this.lineDraftAwardId));
                const prize = this.prizeTypes.find(p => sameId(p.id, this.lineDraftPrizeId));
                const studentById = {};
                this.students.forEach(s => { studentById[String(s.id).toLowerCase()] = s; });

                const seen = {};
                this.lines.forEach(l => { seen[lineKeyOf(l)] = true; });

                let added = 0, skipped = 0;
                this.selectedStudentIds.forEach(sid => {
                    const s = studentById[String(sid).toLowerCase()];
                    if (!s) return;
                    const line = {
                        id: newId(),
                        awardId: this.lineDraftAwardId,
                        awardName: award ? award.name : '',
                        prizeId: this.lineDraftPrizeId,
                        prizeName: prize ? prize.name : '',
                        studentId: s.id,
                        studentName: s.name
                    };
                    const key = lineKeyOf(line);
                    if (seen[key]) { skipped++; return; }
                    seen[key] = true;
                    this.lines.push(line);
                    added++;
                });

                this.selectedStudentIds = [];
                this.toastHandler(added ? 'success' : 'warning',
                    added + ' line(s) added' + (skipped ? ', ' + skipped + ' duplicate(s) skipped.' : '.'));
            },
            removeLine(index) {
                this.lines.splice(index, 1);
            },
            clearLines() {
                this.lines = [];
            },
            resetAwardedForm() {
                this.awarded.levelId = '';
                this.lineDraftAwardId = '';
                this.lineDraftPrizeId = '';
                this.studentFilter = '';
                this.selectedStudentIds = [];
                this.lines = [];
            },
            async savePrizeAwarded() {
                if (this.isShimmerLoading) return;
                const y = this.awarded.academicYearId, t = this.awarded.termId, l = this.awarded.levelId;
                if (!y || !t || !l) return this.toastHandler('warning', 'Choose an academic year, a term and a level.');
                if (!this.lines.length) return this.toastHandler('warning', 'Add at least one line (award + prize + student).');

                // hard de-dupe of lines by (award, prize, student)
                const seen = {};
                const lines = this.lines.filter(line => {
                    const key = lineKeyOf(line);
                    if (seen[key]) return false;
                    seen[key] = true;
                    return true;
                });

                this.isShimmerLoading = true;
                try {
                    // fresh check so we update instead of duplicating a record
                    try { await this.refreshPrizeAwards(); } catch (e) { /* use cached list */ }

                    const existing = this.prizeAwards.find(a =>
                        sameId(a.academicYearId, y) && sameId(a.termId, t) && sameId(a.levelId, l)) || null;

                    const details = lines.map(line => {
                        const keep = existing && existing.details.find(d =>
                            lineKeyOf(d) === lineKeyOf(line));
                        const detail = {
                            id: keep ? keep.id : newId(),
                            awardId: line.awardId,
                            awardName: line.awardName,
                            prizeId: line.prizeId,
                            prizeName: line.prizeName,
                            studentId: line.studentId,
                            studentName: line.studentName
                        };
                        if (existing) detail.prizeAwardId = existing.id;   // link only on updates
                        return detail;
                    });

                    const base = {
                        academicYearId: y,
                        academicYearName: this.nameOf(this.academicYears, y),
                        termId: t,
                        termName: this.nameOf(this.terms, t),
                        levelId: l,
                        levelName: this.nameOf(this.levels, l),
                        details: details
                    };

                    if (existing) {
                        await axios.post('/SchoolManager/UpdatePrizeAward/', {
                            id: existing.id,
                            tenantId: existing.tenantId,   // TenantId ONLY on updates
                            ...base
                        });
                        this.toastHandler('success', 'Existing prize award updated — no duplicate created.');
                    } else {
                        await axios.post('/SchoolManager/CreatePrizeAward/', base);   // no tenantId on create
                        this.toastHandler('success', 'Prize awarded recorded.');
                    }

                    await this.refreshPrizeAwards().catch(() => { /* non-fatal */ });
                    this.fillAwardedFromExisting();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },
            async deleteExistingPrizeAward() {
                const existing = this.existingPrizeAward;
                if (!existing) return;
                if (!window.confirm('Remove the prize award record for this level and term? This cannot be undone.')) return;
                this.isShimmerLoading = true;
                try {
                    await axios.get('/SchoolManager/DeletePrizeAward?id=' + existing.id);
                    this.toastHandler('success', 'Prize award record deleted.');
                    await this.refreshPrizeAwards();
                    this.fillAwardedFromExisting();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ---------- Swal toast (same as your Streams page) ---------- */
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
            uuid() {
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                );
            }
        },

        mounted() {
            this.getSetupData();
        },
    });

   
    app.use(WSelectPlugin);
    app.use(DataGridPlugin);
    app.mount('#app');
})();
