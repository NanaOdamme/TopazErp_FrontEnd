/* ==========================================================================
 * Subject Remarks Management
 * Tabs for Stages: Primary and JHS (Junior High School)
 *
 * Entity Model:
 *  - SubjectRemark : AuditedEntity<Guid>
 *      public string Stage { get; set; }           // "Primary" | "JHS"
 *      public string GradeNumber { get; set; }     // e.g., "1", "2", "A", "B", etc.
 *      public decimal MinMark { get; set; }        // Lower bound (e.g., 80)
 *      public decimal MaxMark { get; set; }        // Upper bound (e.g., 100)
 *      public string Remark { get; set; }          // e.g., "Excellent", "Very Good"
 *      public int TenantId { get; set; }
 *
 * Controller Endpoints:
 *  - GET:    /SchoolManager/GetSubjectRemarks/
 *  - POST:   /SchoolManager/CreateSubjectRemark/   (Body: payload without id, without tenantId)
 *  - POST:   /SchoolManager/UpdateSubjectRemark/   (Body: payload with id, with tenantId)
 *  - GET:    /SchoolManager/DeleteSubjectRemark?id=...
 *
 * Data-grid inbuilt modal CRUD rules:
 *  - Deletes: rely on data-grid's inbuilt confirm dialog (no extra Swal confirmation wrapper).
 *  - Numbers: coerce minMark and maxMark to numeric.
 *  - Stage scoping: active tab sets the Stage automatically on create ("Primary" or "JHS").
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

    const normalizeRemark = o => {
        const id = val(o, 'id');
        const rawStage = String(val(o, 'stage') || '').trim();
        // Normalize common case variations (e.g. primary -> Primary, jhs -> JHS)
        let stage = rawStage;
        if (/^primary$/i.test(rawStage)) stage = 'Primary';
        else if (/^jhs$/i.test(rawStage) || /^j\.h\.s$/i.test(rawStage)) stage = 'JHS';

        return {
            id: id ? String(id) : undefined,
            stage: stage || 'Primary',
            gradeNumber: String(val(o, 'gradeNumber') ?? '').trim(),
            minMark: Number(val(o, 'minMark') ?? 0),
            maxMark: Number(val(o, 'maxMark') ?? 0),
            remark: String(val(o, 'remark') ?? '').trim(),
            tenantId: val(o, 'tenantId') !== undefined ? Number(val(o, 'tenantId')) : undefined
        };
    };

    const remarkColumns = [
        { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
        {
            key: 'gradeNumber',
            label: 'Grade Number / Code',
            type: 'text',
            required: true,
            editable: true,
            searchable: true,
            sortable: true,
            width: '180'
        },
        {
            key: 'minMark',
            label: 'Min Mark (%)',
            type: 'number',
            required: true,
            editable: true,
            searchable: false,
            sortable: true,
            width: '140'
        },
        {
            key: 'maxMark',
            label: 'Max Mark (%)',
            type: 'number',
            required: true,
            editable: true,
            searchable: false,
            sortable: true,
            width: '140'
        },
        {
            key: 'remark',
            label: 'Remark',
            type: 'text',
            required: true,
            editable: true,
            searchable: true,
            sortable: true,
            width: '260'
        },
        { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false }
    ];

    const app = Vue.createApp({
        data() {
            return {
                setupDone: false,
                isShimmerLoading: true,
                activeTab: 'Primary',
                remarks: [],
                columns: remarkColumns,
                theme:'#062a81' 
            };
        },

        computed: {
            primaryRemarks() {
                return (this.remarks || [])
                    .filter(r => String(r.stage).toLowerCase() === 'primary')
                    .sort((a, b) => b.minMark - a.minMark);
            },

            jhsRemarks() {
                return (this.remarks || [])
                    .filter(r => String(r.stage).toLowerCase() === 'jhs')
                    .sort((a, b) => b.minMark - a.minMark);
            },

            activeRemarks() {
                return this.activeTab === 'Primary' ? this.primaryRemarks : this.jhsRemarks;
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

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const res = await axios.get('/SchoolManager/GetSubjectRemarks/');
                    const raw = (res && res.data && (res.data.result || res.data)) || [];
                    const list = Array.isArray(raw) ? raw : [];
                    this.remarks = list.map(normalizeRemark);
                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildPayload(row, forUpdate = false) {
                const stage = String(row.stage || this.activeTab || 'Primary').trim();
                const minMark = Number(row.minMark ?? 0);
                const maxMark = Number(row.maxMark ?? 0);
                const payload = {
                    stage: /^jhs$/i.test(stage) ? 'JHS' : 'Primary',
                    gradeNumber: String(row.gradeNumber ?? '').trim(),
                    minMark: Number.isFinite(minMark) ? minMark : 0,
                    maxMark: Number.isFinite(maxMark) ? maxMark : 0,
                    remark: String(row.remark ?? '').trim()
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
                    const r = row || {};
                    // Ensure the stage matches current tab if not set
                    if (!r.stage) r.stage = this.activeTab;
                    const payload = this.buildPayload(r, false);

                    await axios.post('/SchoolManager/CreateSubjectRemark/', payload);
                    this.toastHandler('success', 'Subject remark created successfully.');
                    await this.getSetupData();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                    this.isShimmerLoading = false;
                }
            },

            async onUpdate({ row }) {
                this.isShimmerLoading = true;
                try {
                    const r = row || {};
                    if (!r.stage) r.stage = this.activeTab;
                    const payload = this.buildPayload(r, true);

                    await axios.post('/SchoolManager/UpdateSubjectRemark/', payload);
                    this.toastHandler('success', 'Subject remark updated successfully.');
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
                    for (const row of list) {
                        if (row && row.id) {
                            await axios.get('/SchoolManager/DeleteSubjectRemark?id=' + encodeURIComponent(row.id));
                        }
                    }
                    this.toastHandler('success', 'Subject remark(s) deleted successfully.');
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
