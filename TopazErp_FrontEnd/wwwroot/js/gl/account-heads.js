const app = Vue.createApp({

    data() {
        return {
            theme: '#0645e7',
            isShimmerLoading: true,
            emptyGuid: '00000000-0000-0000-0000-000000000000',

            accountHeadList: [],          // raw flat list from server (with parentName resolved)
            accountHeadHierarchyList: [], // [{ label, value }] for the parent-select dropdown

            standardAccountTypes: [
                { label: 'Asset', value: 1, color: 'blue' },
                { label: 'Liability', value: 2, color: 'amber' },
                { label: 'Equity', value: 3, color: 'violet' },
                { label: 'Revenue', value: 4, color: 'emerald' },
                { label: 'Expense', value: 5, color: 'rose' },
                { label: 'Other Income', value: 6, color: 'teal' },
                { label: 'Other Expense', value: 7, color: 'orange' },
                { label: 'Sales', value: 8, color: 'cyan' },
                { label: 'Cost of Sales', value: 9, color: 'indigo' },
                { label: 'Selling Expenses', value: 10, color: 'pink' }
            ]
        };
    },

    computed: {
        // Computed columns so parent-select options update reactively whenever
        // accountHeadHierarchyList changes after a fetch/create/update.
        accountHeadCol() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'name',
                    label: 'Account Head',
                    type: 'avatar',
                    width: 260,
                    minWidth: 200,
                    required: true,
                    searchable: true,
                    subtitleKey: 'parentName'
                },
                {
                    key: 'standardAccountType',
                    label: 'Account Type',
                    type: 'badge',
                    options: this.standardAccountTypes,
                    required: true,
                    searchable: true,
                    width: 170
                },
                {
                    key: 'parentId',
                    label: 'Parent Account Head',
                    type: 'select',
                    options: this.accountHeadHierarchyList,
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
                    help: 'Full path generated from the account head hierarchy'
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

        async getAccountHeads() {
            this.isShimmerLoading = true;
            try {
                const response = await axios.get('/GeneralLedger/GetAccountHeads?pageNo=1&pageSize=2000');
                const res = response.data;

                // Handle paginated { result: { data: [] } }, { result: [] }, or flat []
                const rawList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);

                this.accountHeadList = rawList;
                this.buildHierarchy();
            } catch (error) {
                console.error('Failed to load account heads:', error);
                this.toastHandler('error', 'Unable to load account heads.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── CRUD handlers wired to <data-grid> events ──────────── */

        async onCreate(event) {
            const row = event?.row || event?.data;
            if (!row || !this.validateRecord(row)) return;

            const parentId = row.parentId || this.emptyGuid;
            const parent   = this.accountHeadList.find(a => a.id === parentId);

            let standardAccountType = Number(row.standardAccountType);
            if (!standardAccountType && parent) {
                standardAccountType = Number(parent.standardAccountType);
            }
            if (!standardAccountType) {
                standardAccountType = 1; // Default to Asset
            }

            const payload = {
                name:                String(row.name || '').trim(),
                parentId,
                standardAccountType,
                parentName: parent
                    ? `${parent.parentName}/${String(row.name || '').trim()}`
                    : String(row.name || '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/GeneralLedger/CreateAccountHead', payload);
                await this.getAccountHeads();
                this.toastHandler('success', 'Account head created successfully.');
            } catch (err) {
                console.error('Create failed:', err);
                this.toastHandler('error', 'Failed to create account head.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onUpdate(event) {
            const row = event?.row || event?.data;
            if (!row || !this.validateRecord(row)) return;

            const existing = this.accountHeadList.find(
                a => String(a.id) === String(row.id)
            );

            if (!existing) {
                this.toastHandler('error', 'Account head record was not found.');
                return;
            }

            const parentId = row.parentId || this.emptyGuid;
            const parent   = this.accountHeadList.find(a => a.id === parentId);

            const standardAccountType = Number(row.standardAccountType)
                || Number(existing.standardAccountType)
                || (parent ? Number(parent.standardAccountType) : 1);

            const payload = {
                ...existing,
                ...row,
                id:                  existing.id,
                tenantId:            existing.tenantId,
                name:                String(row.name || '').trim(),
                parentId,
                standardAccountType,
                parentName: parent
                    ? `${parent.parentName}/${String(row.name || '').trim()}`
                    : String(row.name || '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/GeneralLedger/UpdateAccountHead', payload);

                // Optimistically patch the local list
                const idx = this.accountHeadList.findIndex(
                    a => String(a.id) === String(existing.id)
                );
                if (idx !== -1) {
                    this.accountHeadList.splice(idx, 1, { ...payload });
                }

                this.buildHierarchy();
                this.toastHandler('success', 'Account head updated successfully.');
            } catch (err) {
                console.error('Update failed:', err);
                this.toastHandler('error', 'Failed to update account head.');
                await this.getAccountHeads(); // re-sync on failure
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
                    rows.map(r => axios.get('/GeneralLedger/DeleteAccountHead?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} deleted; ${failed} failed.`
                    );
                    await this.getAccountHeads();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} account head${rows.length !== 1 ? 's' : ''} deleted.`
                    );
                }
            } catch (err) {
                console.error('Delete failed:', err);
                this.toastHandler('error', 'Failed to delete account head.');
                await this.getAccountHeads();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Hierarchy builder ──────────────────────────────────── */

        // Resolves the full breadcrumb path for each account head and builds
        // the parent-select dropdown options.
        buildHierarchy() {
            const listMap = new Map(
                this.accountHeadList.map(a => [a.id, a])
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

            // Annotate each record with its computed parentName and ensure standardAccountType is numeric
            this.accountHeadList = this.accountHeadList.map(a => ({
                ...a,
                standardAccountType: Number(a.standardAccountType) || 1,
                parentName: getPath(a)
            }));

            // Rebuild the parent-select options
            this.accountHeadHierarchyList = [
                { label: 'No Parent (Root)', value: this.emptyGuid },
                ...this.accountHeadList.map(a => ({
                    label: a.parentName,
                    value: a.id
                }))
            ];
        },

        /* ── Validation ─────────────────────────────────────────── */

        validateRecord(row) {
            if (!row.name || !String(row.name).trim()) {
                this.toastHandler('warning', 'Account head name is required.');
                return false;
            }

            if (row.parentId && row.parentId !== this.emptyGuid) {
                const parent = this.accountHeadList.find(a => a.id === row.parentId);

                if (!parent) {
                    this.toastHandler('error', 'Selected parent account head does not exist.');
                    return false;
                }

                if (row.id && row.parentId === row.id) {
                    this.toastHandler('warning', 'An account head cannot be its own parent.');
                    return false;
                }

                // Guard against circular hierarchy
                let current = this.accountHeadList.find(a => a.id === row.parentId);
                const visited = new Set();

                while (current && !visited.has(current.id)) {
                    if (current.id === row.id) {
                        this.toastHandler('warning', 'This change would create a circular hierarchy.');
                        return false;
                    }
                    visited.add(current.id);
                    current = this.accountHeadList.find(a => a.id === current.parentId);
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
        this.getAccountHeads();
    }
});

app.use(DataGridPlugin);
app.mount('#app');
