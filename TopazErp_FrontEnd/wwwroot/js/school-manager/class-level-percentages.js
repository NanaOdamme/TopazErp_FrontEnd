/* ==========================================================================
 * Class Level Percentage — per academic year, one line per level.
 * Exam % + Class % must ALWAYS add up to exactly 100 for each line
 * (40/60, 50/50, 30/70 … never 40/80). Every entry path enforces it.
 * Same style as your Hostel page (Vue + axios + Swal + DataGridPlugin);
 * one 'parent' record per academic year ("ClassLevelPercentage"),
 * levels editing inline in the data-grid.
 * ========================================================================== */
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

    const sameSumIs100 = d =>
        Math.abs(Number(d.examPercentage) + Number(d.classPercentage) - 100) < 0.001;

    const validPercent = v => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 && n <= 100;
    };

    const normalizeLookups = list => (list || [])
        .map(o => ({ id: val(o, 'id'), name: val(o, 'name') || val(o, 'displayName') || '' }))
        .filter(o => o.id != null && o.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    // levels derived from the existing GetLevelClasses payload
    const normalizeLevels = list => {
        const map = {};
        (list || []).forEach(c => {
            const id = val(c, 'levelId'), name = val(c, 'levelName');
            if (id && name && !map[String(id).toLowerCase()]) map[String(id).toLowerCase()] = { id, name };
        });
        return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
    };

    // one ClassLevelPercentage record per academic year; details de-duped by LevelId
    const normalizeRecord = a => {
        const seen = {};
        const details = [];
        (val(a, 'details') || []).forEach(d => {
            const levelId = val(d, 'levelId');
            const key = String(levelId || '').toLowerCase();
            if (!key || seen[key]) return;   // duplicate level line in payload — first wins
            seen[key] = true;
            details.push({
                id: val(d, 'id') || newId(),
                classLevelPercentageId: val(d, 'classLevelPercentageId'),
                levelId,
                levelName: val(d, 'levelName') || '',
                examPercentage: Number(val(d, 'examPercentage')) || 0,
                classPercentage: Number(val(d, 'classPercentage')) || 0
            });
        });
        return {
            id: val(a, 'id'),
            academicYearId: val(a, 'academicYearId'),
            academicYearName: val(a, 'academicYearName') || '',
            tenantId: val(a, 'tenantId'),
            details
        };
    };

    const app = Vue.createApp({
        data() {
            return {
                isShimmerLoading: false,
                theme: '#062a81',

                percentageColumns: [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'classLevelPercentageId', label: 'Record ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'levelId', label: 'Level ID', type: 'text', hidden: true, editable: false, searchable: false },
                    { key: 'levelName', label: 'Level', type: 'text', required: true, editable: false, searchable: true, width: '250' },
                    { key: 'examPercentage', label: 'Exam %', type: 'number', required: true, editable: true, searchable: false, width: '140' },
                    { key: 'classPercentage', label: 'Class %', type: 'number', required: true, editable: true, searchable: false, width: '140' },
                ],

                academicYears: [],
                levels: [],
                records: [],          // all ClassLevelPercentage records (all years)
                academicYearId: '',   // selected scope
                lines: [],            // details of the selected year (bound to the grid)
                draftLevelId: '',
                draftExam: '',
                draftClass: ''
            };
        },

        computed: {
            yearSelected() {
                return !!this.academicYearId;
            },
            selectedYear() {
                const y = this.academicYears.find(x => sameId(x.id, this.academicYearId));
                return y || null;
            },
            existingRecord() {
                if (!this.academicYearId) return null;
                return this.records.find(r => sameId(r.academicYearId, this.academicYearId)) || null;
            },
            remainingLevels() {
                const used = {};
                this.lines.forEach(l => { used[String(l.levelId).toLowerCase()] = true; });
                return this.levels.filter(l => !used[String(l.id).toLowerCase()]);
            },
            draftSumOk() {
                return validPercent(this.draftExam) && validPercent(this.draftClass) &&
                    Math.abs(Number(this.draftExam) + Number(this.draftClass) - 100) < 0.001;
            },
            invalidLine() {
                return this.lines.find(l => !validPercent(l.examPercentage) || !validPercent(l.classPercentage) || !sameSumIs100(l)) || null;
            }
        },

        watch: {
            academicYearId() {
                this.draftLevelId = '';
                this.draftExam = '';
                this.draftClass = '';
                this.fillLinesFromRecord();
            }
        },

        methods: {
            /* ---------- setup ---------- */
            getSetupData() {
                this.isShimmerLoading = true;
                return Promise.all([
                    axios.get('/SchoolManager/GetAcademicYears/'),
                    axios.get('/SchoolManager/GetLevelClasses/'),
                    axios.get('/SchoolManager/GetClassLevelPercentages/'),
                ]).then(([years, levelClasses, percentages]) => {
                    this.academicYears = normalizeLookups(years.data.result);
                    this.levels = normalizeLevels(levelClasses.data.result);
                    this.records = (percentages.data.result || []).map(normalizeRecord);
                    this.fillLinesFromRecord();
                    this.isShimmerLoading = false;
                }).catch(() => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load setups.');
                });
            },

            refreshRecords() {
                return axios.get('/SchoolManager/GetClassLevelPercentages/').then(res => {
                    this.records = (res.data.result || []).map(normalizeRecord);
                    this.fillLinesFromRecord();
                });
            },

            fillLinesFromRecord() {
                const existing = this.existingRecord;
                this.lines = existing ? existing.details.map(d => ({ ...d })) : [];
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

            /* ================= grid events ================= */
            // the built-in "add" button cannot know which level/year to use —
            // lines are added via the picker above the grid
            onCreate(event) {
                this.toastHandler('warning', 'Pick a level and the two percentages above, then press Add Line.');
            },
            async onUpdate(event) {
                const row = this.rowOf(event);
                if (!row) return;
                await this.updateLine(row);
            },
            async onDelete(event) {
                const rows = event && event.rows;
                if (!Array.isArray(rows) || !rows.length) return;
                await this.deleteLines(rows);
            },

            /* ================= line add (picker) ================= */
            addLine() {
                if (!this.academicYearId) return this.toastHandler('warning', 'Choose an academic year first.');
                if (!this.draftLevelId) return this.toastHandler('warning', 'Pick a level.');
                if (this.lines.some(l => sameId(l.levelId, this.draftLevelId))) {
                    return this.toastHandler('warning', 'That level is already in the list.');
                }
                if (!validPercent(this.draftExam) || !validPercent(this.draftClass)) {
                    return this.toastHandler('warning', 'Percentages must be between 0 and 100.');
                }
                if (Math.abs(Number(this.draftExam) + Number(this.draftClass) - 100) >= 0.001) {
                    return this.toastHandler('warning',
                        `Exam % (${this.draftExam}) + Class % (${this.draftClass}) = ${Number(this.draftExam) + Number(this.draftClass)} — they must add up to exactly 100.`);
                }

                const level = this.levels.find(l => sameId(l.id, this.draftLevelId));
                this.lines.push({
                    id: newId(),
                    classLevelPercentageId: this.existingRecord ? this.existingRecord.id : '',
                    levelId: this.draftLevelId,
                    levelName: level ? level.name : '',
                    examPercentage: Number(this.draftExam),
                    classPercentage: Number(this.draftClass)
                });

                this.draftLevelId = '';
                this.draftExam = '';
                this.draftClass = '';
                this.saveRecord('Level percentages saved.');
            },

            /* ================= grid inline edit / delete ================= */
            async updateLine(row) {
                const exam = Number(row.examPercentage);
                const cls = Number(row.classPercentage);

                if (!validPercent(exam) || !validPercent(cls)) {
                    this.toastHandler('error', 'Percentages must be between 0 and 100. The change was not saved.');
                    this.fillLinesFromRecord();   // revert the grid to the saved state
                    return;
                }
                if (Math.abs(exam + cls - 100) >= 0.001) {
                    this.toastHandler('error',
                        `${row.levelName || 'Line'}: Exam % (${exam}) + Class % (${cls}) = ${exam + cls} — they must add up to exactly 100. The change was not saved.`);
                    this.fillLinesFromRecord();
                    return;
                }

                const index = this.lines.findIndex(l => sameId(l.id, row.id));
                if (index === -1) {
                    this.toastHandler('error', 'Line was not found.');
                    return;
                }
                const line = { ...this.lines[index], examPercentage: exam, classPercentage: cls };
                const nextLines = this.lines.map(l => (sameId(l.id, line.id) ? line : l));
                this.lines = nextLines;
                await this.saveRecord('Line updated.');
            },

            async deleteLines(rows) {
                const deletedIds = new Set(rows.map(r => String(r.id).toLowerCase()));
                this.lines = this.lines.filter(l => !deletedIds.has(String(l.id).toLowerCase()));

                if (this.lines.length === 0 && this.existingRecord) {
                    // no lines left — remove the parent record entirely (never keep empty records)
                    this.isShimmerLoading = true;
                    try {
                        await axios.get('/SchoolManager/DeleteClassLevelPercentage?id=' + this.existingRecord.id);
                        this.toastHandler('success', 'All lines removed — record deleted.');
                        await this.refreshRecords();
                    } catch (err) {
                        this.toastHandler('error', errMsg(err));
                        await this.refreshRecords();
                    } finally {
                        this.isShimmerLoading = false;
                    }
                    return;
                }

                await this.saveRecord(rows.length + ' line(s) deleted.');
            },

            /* ================= persistence — one record per year ================= */
            async saveRecord(successMessage) {
                if (!this.academicYearId) return;

                // final gate — never persist a line that breaks the rule
                const invalid = this.lines.find(l => !sameSumIs100(l) || !validPercent(l.examPercentage) || !validPercent(l.classPercentage));
                if (invalid) {
                    this.toastHandler('error', `${invalid.levelName || 'A line'} does not add up to 100 — not saved.`);
                    this.fillLinesFromRecord();
                    return;
                }

                const yearName = this.nameOf(this.academicYears, this.academicYearId);
                const existing = this.existingRecord;

                const details = this.lines.map(l => ({
                    id: l.id || newId(),
                    classLevelPercentageId: existing ? existing.id : '',
                    levelId: l.levelId,
                    levelName: l.levelName,
                    examPercentage: Number(l.examPercentage),
                    classPercentage: Number(l.classPercentage)
                }));

                const base = {
                    academicYearId: this.academicYearId,
                    academicYearName: yearName,
                    details
                };

                this.isShimmerLoading = true;
                try {
                    if (existing) {
                        await axios.post('/SchoolManager/UpdateClassLevelPercentage/', {
                            ...base,
                            id: existing.id,
                            tenantId: existing.tenantId   // TenantId ONLY on updates
                        });
                    } else {
                        await axios.post('/SchoolManager/CreateClassLevelPercentage/', base); // no tenantId on create
                    }
                    await this.refreshRecords();
                    this.toastHandler('success', successMessage);
                } catch (err) {
                    await this.refreshRecords().catch(() => { /* revert to server state */ });
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async deleteExistingRecord() {
                const existing = this.existingRecord;
                if (!existing) return;
                if (!window.confirm('Delete the class level percentage record for "' + this.nameOf(this.academicYears, this.academicYearId) + '"? This cannot be undone.')) return;
                this.isShimmerLoading = true;
                try {
                    await axios.get('/SchoolManager/DeleteClassLevelPercentage?id=' + existing.id);
                    this.toastHandler('success', 'Record deleted.');
                    await this.refreshRecords();
                } catch (err) {
                    this.toastHandler('error', errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ---------- Swal toast (same as your Hostel page) ---------- */
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
