(function () {
    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };
    const today = isoDate(new Date());
    var app = Vue.createApp({
        data() {
            return {
                setupDone: false,
                isShimmerLoading: true,
                saving: false,
                academicYears: [],
                positions: [],
                executives: [],
                academicYearId: '',
                modalOpen: false,
                editingId: null,    
                editingTenantId: null,
                draft: {
                    academicYearId: '',
                    ptaPositionId: '',
                    name: '',
                    phoneNumber: '',
                    email: '',
                    address: '',
                    startDate: today,
                    endDate: today
                }
            };
        },

        computed: {
            scopeReady() {
                return !!this.academicYearId;
            },

            executivesInYear() {
                if (!this.academicYearId) return [];
                const key = String(this.academicYearId).toLowerCase();
                return this.executives
                    .filter(e => String(e.academicYearId || '').toLowerCase() === key)
                    .sort((a, b) => String(a.ptaPositionName || '').localeCompare(String(b.ptaPositionName || ''))
                        || String(a.name || '').localeCompare(String(b.name || '')));
            }
        },

        methods: {
            /* ==========================================================
             * helpers (methods, not top-level consts — no 'use strict')
             * ========================================================== */
            val(o, k) {
                return o ? (o[k] !== undefined ? o[k] : o[k.charAt(0).toUpperCase() + k.slice(1)]) : undefined;
            },

            isGuid(v) {
                return !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v));
            },

            errMsg(err) {
                return (err && err.response && err.response.data && (err.response.data.message || err.response.data.title))
                    || (err && err.message)
                    || 'Something went wrong.';
            },

            // Swal confirmation — popup dialogs only
            confirmDialog({ title = 'Are you sure?', text = '', confirmText = 'Yes, delete', tone = 'danger' } = {}) {
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
            },

            nameOf(list, id) {
                const item = (list || []).find(x => x.id === id);
                return item ? item.name : '';
            },

            normalizeLookups(list) {
                return (list || [])
                    .map(o => ({ id: this.val(o, 'id'), name: this.val(o, 'name') || this.val(o, 'displayName') || '' }))
                    .filter(o => o.id != null && o.name !== '')
                    .sort((a, b) => a.name.localeCompare(b.name));
            },

            toInputDate(v) {
                const s = String(v || '');
                const m = s.match(/^\d{4}-\d{2}-\d{2}/);
                return m ? m[0] : '';
            },

            prettyDate(v) {
                const s = this.toInputDate(v);
                if (!s) return '—';
                const d = new Date(s + 'T00:00:00');
                return isNaN(d) ? s : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            },

            normalizeExecutive(e) {
                return {
                    id: this.val(e, 'id'),
                    academicYearId: this.val(e, 'academicYearId'),
                    academicYearName: this.val(e, 'academicYearName') || '',
                    ptaPositionId: this.val(e, 'ptaPositionId'),
                    ptaPositionName: this.val(e, 'ptaPositionName') || this.nameOf(this.positions, this.val(e, 'ptaPositionId')) || '',
                    name: this.val(e, 'name') || '',
                    phoneNumber: this.val(e, 'phoneNumber') || '',
                    email: this.val(e, 'email') || '',
                    address: this.val(e, 'address') || '',
                    startDate: this.toInputDate(this.val(e, 'startDate')),
                    endDate: this.toInputDate(this.val(e, 'endDate')),
                    tenantId: this.val(e, 'tenantId')
                };
            },

            /* ==========================================================
             * data loading
             * ========================================================== */
            getSetupData() {
                this.isShimmerLoading = true;
                return Promise.all([
                    axios.get('/SchoolManager/GetAcademicYears/'),
                    axios.get('/SchoolManager/GetPtaPositions/'),
                    axios.get('/SchoolManager/GetPtaExecutives/')
                ]).then(([years, positions, executives]) => {
                    this.academicYears = this.normalizeLookups(years.data.result);
                    this.positions = this.normalizeLookups(positions.data.result);
                    this.executives = (executives.data.result || []).map(e => this.normalizeExecutive(e)).filter(e => e.id != null);
                    this.setupDone = true;
                    this.isShimmerLoading = false;
                }).catch(() => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load setups.');
                });
            },

            refreshExecutives() {
                return axios.get('/SchoolManager/GetPtaExecutives/').then(res => {
                    this.executives = (res.data.result || []).map(e => this.normalizeExecutive(e)).filter(e => e.id != null);
                });
            },

            /* ==========================================================
             * modal editor
             * ========================================================== */
            blankDraft() {
                return {
                    academicYearId: this.academicYearId || '',
                    ptaPositionId: '',
                    name: '',
                    phoneNumber: '',
                    email: '',
                    address: '',
                    startDate: today,
                    endDate: today
                };
            },

            openAddModal() {
                this.editingId = null;
                this.editingTenantId = null;
                this.draft = this.blankDraft();
                this.modalOpen = true;
            },

            openEditModal(executive) {
                this.editingId = executive.id;
                this.editingTenantId = executive.tenantId;
                this.draft = {
                    academicYearId: executive.academicYearId || '',
                    ptaPositionId: executive.ptaPositionId || '',
                    name: executive.name || '',
                    phoneNumber: executive.phoneNumber || '',
                    email: executive.email || '',
                    address: executive.address || '',
                    startDate: this.toInputDate(executive.startDate),
                    endDate: this.toInputDate(executive.endDate)
                };
                this.modalOpen = true;
            },

            closeModal() {
                this.modalOpen = false;
            },

            buildPayload() {
                const d = this.draft;
                const payload = {
                    academicYearId: d.academicYearId,
                    academicYearName: this.nameOf(this.academicYears, d.academicYearId),
                    ptaPositionId: d.ptaPositionId,
                    ptaPositionName: this.nameOf(this.positions, d.ptaPositionId),
                    name: String(d.name || '').trim(),
                    phoneNumber: String(d.phoneNumber || '').trim(),
                    email: String(d.email || '').trim(),
                    address: String(d.address || '').trim(),
                    startDate: d.startDate,
                    endDate: d.endDate
                };
                if (this.editingId) {
                    payload.id = this.editingId;
                    if (this.editingTenantId !== undefined && this.editingTenantId !== null) {
                        payload.tenantId = this.editingTenantId;
                    }
                }
                return payload;
            },

            async saveExecutive() {
                const d = this.draft;
                if (!d.academicYearId) return this.toastHandler('warning', 'Pick the academic year.');
                if (!d.ptaPositionId) return this.toastHandler('warning', 'Pick the PTA position.');
                if (!String(d.name || '').trim()) return this.toastHandler('warning', 'Name is required.');
                if (!d.startDate) return this.toastHandler('warning', 'Pick a start date.');
                if (!d.endDate) return this.toastHandler('warning', 'Pick an end date.');
                if (d.endDate && d.startDate && d.endDate < d.startDate) {
                    return this.toastHandler('warning', 'End date cannot be before the start date.');
                }

                if (this.editingId && !this.isGuid(this.editingId)) {
                    this.toastHandler('error', 'This record has an invalid id — refresh the page and try again.');
                    return;
                }

                // standing duplicate prevention (block): one position per academic year
                const yKey = String(d.academicYearId).toLowerCase();
                const pKey = String(d.ptaPositionId).toLowerCase();
                const dupe = this.executives.find(e =>
                    String(e.academicYearId || '').toLowerCase() === yKey
                    && String(e.ptaPositionId || '').toLowerCase() === pKey
                    && String(e.id).toLowerCase() !== String(this.editingId || '').toLowerCase());
                if (dupe) {
                    const holder = this.nameOf(this.positions, d.ptaPositionId) || 'this position';
                    this.toastHandler('warning', holder + ' is already filled by ' + (dupe.name || 'someone') + ' for this academic year.');
                    return;
                }

                const payload = this.buildPayload();
                this.saving = true;
                this.isShimmerLoading = true;
                try {
                    if (this.editingId) {
                        await axios.post('/SchoolManager/UpdatePtaExecutive/', payload);
                        this.toastHandler('success', 'Executive updated.');
                    } else {
                        await axios.post('/SchoolManager/CreatePtaExecutive/', payload); // no id, no tenantId on create
                        this.toastHandler('success', 'Executive saved.');
                    }
                    await this.refreshExecutives();
                    this.closeModal();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.saving = false;
                    this.isShimmerLoading = false;
                }
            },

            async deleteExecutive(executive) {
                if (!(await this.confirmDialog({
                    tone: 'danger',
                    title: 'Delete executive?',
                    text: 'Remove ' + (executive.name || 'this person') + ' as ' + (executive.ptaPositionName || 'PTA executive') + '? This cannot be undone.',
                    confirmText: 'Yes, delete'
                }))) return;

                this.isShimmerLoading = true;
                try {
                    await axios.get('/SchoolManager/DeletePtaExecutive?id=' + encodeURIComponent(executive.id));
                    this.toastHandler('success', 'Executive deleted.');
                    await this.refreshExecutives();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ---------- Swal toast ---------- */
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
        }
    });
    app.use(WSelectPlugin);
    app.mount('#app');
})();
