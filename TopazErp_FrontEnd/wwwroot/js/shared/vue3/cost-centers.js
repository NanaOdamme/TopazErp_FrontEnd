const app = Vue.createApp({

    data() {
        return {
            theme: '#0645e7',
            isShimmerLoading: false,
            emptyGuid: '00000000-0000-0000-0000-000000000000',

            costCenterList: [],          // raw flat list from server (with parentName resolved)
            costCenterHierarchyList: [], // [{ label, value }] for the parent-select dropdown
        };
    },

    computed: {
        // Computed columns so the parent-select options update reactively whenever
        // costCenterHierarchyList changes after a fetch/create/update.
        costCenterCol() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'name',
                    label: 'Cost Center',
                    type: 'avatar',
                    width: 280,
                    minWidth: 220,
                    required: true,
                    searchable: true,
                    subtitleKey: 'parentName'
                },
                {
                    key: 'parentId',
                    label: 'Parent Cost Center',
                    type: 'select',
                    options: this.costCenterHierarchyList,
                    required: false,
                    searchable: true,
                    width: 260
                },
                {
                    key: 'parentName',
                    label: 'Hierarchy Path',
                    type: 'text',
                    searchable: true,
                    editable: false,
                    width: 320,
                    help: 'Full path generated from the cost center hierarchy'
                },
                {
                    key: 'tenantId',
                    label: 'Tenant',
                    type: 'number',
                    hidden: true
                }
            ];
        }
    },

    methods: {

        /* ── Fetch ──────────────────────────────────────────────── */

        async getCostCenters() {
            this.isShimmerLoading = true;
            try {
                const response = await axios.get('/SharedResource/GetCostCenters?pageNo=1&pageSize=2000');
                const res = response.data;

                // Handle paginated { result: { data: [] } }, { result: [] }, or flat []
                const rawList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);

                this.costCenterList = rawList;
                this.buildHierarchy();
            } catch (error) {
                console.error('Failed to load cost centers:', error);
                this.toastHandler('error', 'Unable to load cost centers.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── CRUD handlers wired to <data-grid> events ──────────── */

        async onCreate(event) {
            const row = event?.row || event?.data;
            if (!row || !this.validateRecord(row)) return;

            const parentId = row.parentId || this.emptyGuid;
            const parent   = this.costCenterList.find(c => c.id === parentId);

            const payload = {
                name:       String(row.name || '').trim(),
                parentId,
                parentName: parent
                    ? `${parent.parentName}/${String(row.name || '').trim()}`
                    : String(row.name || '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/SharedResource/CreateCostCenter', payload);
                await this.getCostCenters();
                this.toastHandler('success', 'Cost center created successfully.');
            } catch (err) {
                console.error('Create failed:', err);
                this.toastHandler('error', 'Failed to create cost center.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onUpdate(event) {
            const row = event?.row || event?.data;
            if (!row || !this.validateRecord(row)) return;

            const existing = this.costCenterList.find(
                c => String(c.id) === String(row.id)
            );

            if (!existing) {
                this.toastHandler('error', 'Cost center record was not found.');
                return;
            }

            const parentId = row.parentId || this.emptyGuid;
            const parent   = this.costCenterList.find(c => c.id === parentId);

            const payload = {
                ...existing,
                ...row,
                id:         existing.id,
                tenantId:   existing.tenantId,
                name:       String(row.name || '').trim(),
                parentId,
                parentName: parent
                    ? `${parent.parentName}/${String(row.name || '').trim()}`
                    : String(row.name || '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/SharedResource/UpdateCostCenter', payload);

                // Optimistically patch the local list
                const idx = this.costCenterList.findIndex(
                    c => String(c.id) === String(existing.id)
                );
                if (idx !== -1) {
                    this.costCenterList.splice(idx, 1, { ...payload });
                }

                this.buildHierarchy();
                this.toastHandler('success', 'Cost center updated successfully.');
            } catch (err) {
                console.error('Update failed:', err);
                this.toastHandler('error', 'Failed to update cost center.');
                await this.getCostCenters(); // re-sync on failure
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onDelete(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            this.isShimmerLoading = true;
            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SharedResource/DelCostCenter?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} deleted; ${failed} failed.`
                    );
                    await this.getCostCenters();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} cost center${rows.length !== 1 ? 's' : ''} deleted.`
                    );
                }
            } catch (err) {
                console.error('Delete failed:', err);
                this.toastHandler('error', 'Failed to delete cost center.');
                await this.getCostCenters();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Hierarchy builder ──────────────────────────────────── */

        // Resolves the full breadcrumb path for each cost center and builds
        // the parent-select dropdown options.
        buildHierarchy() {
            const listMap = new Map(
                this.costCenterList.map(c => [c.id, c])
            );

            // Recursively build "Root / Child / Grandchild" path
            const getPath = (item, visited = new Set()) => {
                if (!item || visited.has(item.id)) return item?.name || '';
                visited.add(item.id);

                if (!item.parentId || item.parentId === this.emptyGuid) {
                    return item.name;
                }

                const parent = listMap.get(item.parentId);
                if (!parent) return item.name;

                return `${getPath(parent, visited)} / ${item.name}`;
            };

            // Annotate each record with its computed parentName
            this.costCenterList = this.costCenterList.map(c => ({
                ...c,
                parentName: getPath(c)
            }));

            // Rebuild the parent-select options
            this.costCenterHierarchyList = [
                { label: 'No Parent (Root)', value: this.emptyGuid },
                ...this.costCenterList.map(c => ({
                    label: c.parentName,
                    value: c.id
                }))
            ];
        },

        /* ── Validation ─────────────────────────────────────────── */

        validateRecord(row) {
            if (!row.name || !String(row.name).trim()) {
                this.toastHandler('warning', 'Cost center name is required.');
                return false;
            }

            if (row.parentId && row.parentId !== this.emptyGuid) {
                const parent = this.costCenterList.find(c => c.id === row.parentId);

                if (!parent) {
                    this.toastHandler('error', 'Selected parent cost center does not exist.');
                    return false;
                }

                if (row.id && row.parentId === row.id) {
                    this.toastHandler('warning', 'A cost center cannot be its own parent.');
                    return false;
                }

                // Guard against circular hierarchy
                let current = this.costCenterList.find(c => c.id === row.parentId);
                const visited = new Set();

                while (current && !visited.has(current.id)) {
                    if (current.id === row.id) {
                        this.toastHandler('warning', 'This change would create a circular hierarchy.');
                        return false;
                    }
                    visited.add(current.id);
                    current = this.costCenterList.find(c => c.id === current.parentId);
                }
            }

            return true;
        },

        /* ── Helpers ─────────────────────────────────────────────── */

        toastHandler(type, message = 'An unexpected error occurred.') {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                    title: message,
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true
                });
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }
    },

    mounted() {
        this.getCostCenters();
    }
});

app.use(DataGridPlugin);
app.mount('#app');