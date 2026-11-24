/* ==========================================================================
 * Results Entry Period — Academic Results Submission Windows
 * Configures the open/close date windows for entering exam/term results
 * by Academic Year and Term.
 *
 * Entity Model:
 *  - ResultPeriod : AuditedEntity<Guid>
 *      public Guid AcademicYearId { get; set; }
 *      public Guid TermId { get; set; }
 *      public DateTime StartDate { get; set; }
 *      public DateTime EndDate { get; set; }
 *      public int TenantId { get; set; }
 *
 * Controller Endpoints:
 *  - GET:    /SchoolManager/GetResultPeriods/
 *  - POST:   /SchoolManager/CreateResultPeriod/
 *  - POST:   /SchoolManager/UpdateResultPeriod/
 *  - GET:    /SchoolManager/DeleteResultPeriod?id=...
 *
 * Lookups:
 *  - Academic Years: /SchoolManager/GetAcademicYears/
 *  - Terms:          /jsonDataSample/terms.json
 *
 * UI:
 *  - data-grid with select dropdowns for Academic Year and Term (value: 'id', display: 'name')
 *  - date columns for StartDate and EndDate (defaulting to today, formatted YYYY-MM-DD)
 *  - theme: '#062a81'
 *  - Filter by Academic Year
 * ========================================================================== */
(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

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

    const asGuid = v => (isGuid(v) ? v.trim() : EMPTY_GUID);

    const todayIso = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const toInputDate = v => {
        if (!v) return todayIso();
        const s = String(v);
        const m = s.match(/^\d{4}-\d{2}-\d{2}/);
        return m ? m[0] : todayIso();
    };

    const toIsoDateTime = v => {
        const dateStr = toInputDate(v);
        return `${dateStr}T00:00:00`;
    };

    const errMsg = err =>
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.title)) ||
        (err && err.message) ||
        'Something went wrong.';

    const toastHandler = (type, message) => {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                icon: type,
                title: message
            });
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    };

    const normalizeLookups = list => (list || [])
        .map(o => ({
            id: val(o, 'id'),
            name: val(o, 'name') || val(o, 'displayName') || ''
        }))
        .filter(o => o.id != null && o.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeResultPeriod = r => {
        const id = val(r, 'id');
        return {
            id: id ? String(id) : undefined,
            academicYearId: asGuid(val(r, 'academicYearId')),
            termId: asGuid(val(r, 'termId')),
            startDate: toInputDate(val(r, 'startDate')),
            endDate: toInputDate(val(r, 'endDate')),
            tenantId: val(r, 'tenantId') !== undefined ? Number(val(r, 'tenantId')) : undefined
        };
    };

    const app = Vue.createApp({
        data() {
            return {
                setupDone: false,
                isShimmerLoading: true,
                theme: '#062a81',

                // Lookups
                academicYears: [],
                terms: [],

                // Filter
                academicYearId: '',

                // Stored records
                resultPeriods: []
            };
        },

        computed: {
            academicYearOptions() {
                return [
                    { id: '', name: 'All Academic Years' },
                    ...(this.academicYears || [])
                ];
            },

            filteredResultPeriods() {
                if (!this.academicYearId) return this.resultPeriods || [];
                const yearId = String(this.academicYearId).toLowerCase();
                return (this.resultPeriods || []).filter(rp =>
                    String(rp.academicYearId).toLowerCase() === yearId
                );
            },

            columns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    {
                        key: 'academicYearId',
                        label: 'Academic Year',
                        type: 'select',
                        required: true,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '220',
                        options: this.academicYears,
                        display: 'name',
                        value: 'id'
                    },
                    {
                        key: 'termId',
                        label: 'Term',
                        type: 'select',
                        required: true,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '180',
                        options: this.terms,
                        display: 'name',
                        value: 'id'
                    },
                    {
                        key: 'startDate',
                        label: 'Start Date',
                        type: 'date',
                        required: true,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '170'
                    },
                    {
                        key: 'endDate',
                        label: 'End Date',
                        type: 'date',
                        required: true,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '170'
                    },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false }
                ];
            }
        },

        mounted() {
            this.getSetupData();
        },

        methods: {
            errMsg,
            toastHandler,
            val,
            isGuid,
            asGuid,
            toInputDate,
            toIsoDateTime,

            nameOf(list, id) {
                const item = (list || []).find(x => String(x.id).toLowerCase() === String(id || '').toLowerCase());
                return item ? item.name : '';
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const [yearsRes, termsRes, rpRes] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                        axios.get('/SchoolManager/GetResultPeriods/')
                    ]);

                    this.academicYears = normalizeLookups(yearsRes.data && (yearsRes.data.result || yearsRes.data));
                    this.terms = normalizeLookups(termsRes.data);

                    const rawRP = (rpRes.data && (rpRes.data.result || rpRes.data)) || [];
                    this.resultPeriods = (Array.isArray(rawRP) ? rawRP : []).map(normalizeResultPeriod);

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildPayload(row, forUpdate = false) {
                const yearId = this.asGuid(row.academicYearId || this.academicYearId);
                const termId = this.asGuid(row.termId);
                const startDate = toIsoDateTime(row.startDate || todayIso());
                const endDate = toIsoDateTime(row.endDate || todayIso());

                const payload = {
                    academicYearId: yearId,
                    termId: termId,
                    startDate: startDate,
                    endDate: endDate
                };

                if (forUpdate) {
                    if (row.id) payload.id = row.id;
                    if (row.tenantId !== undefined && row.tenantId !== null) {
                        payload.tenantId = Number(row.tenantId);
                    }
                }

                return payload;
            },

            async onCreate({ row }) {
                this.isShimmerLoading = true;
                try {
                    const payload = this.buildPayload(row || {}, false);
                    await axios.post('/SchoolManager/CreateResultPeriod/', payload);
                    this.toastHandler('success', 'Results entry period created successfully.');
                    await this.getSetupData();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                    this.isShimmerLoading = false;
                }
            },

            async onUpdate({ row }) {
                this.isShimmerLoading = true;
                try {
                    const payload = this.buildPayload(row || {}, true);
                    await axios.post('/SchoolManager/UpdateResultPeriod/', payload);
                    this.toastHandler('success', 'Results entry period updated successfully.');
                    await this.getSetupData();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                    this.isShimmerLoading = false;
                }
            },

            async onDelete({ rows }) {
                const list = rows || [];
                if (!list.length) return;
                this.isShimmerLoading = true;
                try {
                    for (const r of list) {
                        if (r && r.id) {
                            await axios.get('/SchoolManager/DeleteResultPeriod?id=' + encodeURIComponent(r.id));
                        }
                    }
                    this.toastHandler('success', 'Results entry period(s) deleted.');
                    await this.getSetupData();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                    this.isShimmerLoading = false;
                }
            }
        }
    });

    if (typeof DataGridPlugin !== 'undefined') {
        app.use(DataGridPlugin);
    }
    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();
