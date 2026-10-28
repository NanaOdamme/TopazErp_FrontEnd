const app = Vue.createApp({

    data() {
        return {
            theme: '#0645e7',
            isShimmerLoading: true,
            emptyGuid: '00000000-0000-0000-0000-000000000000',

            coaControlList: [],          // raw flat list from server (with parentName resolved)
            controlHierarchyList: [],    // [{ label, value }] for the parent account header dropdown
            accountGroupList: [],        // raw account groups/heads from server
            accountGroupOptions: []      // [{ label, value }] for the account group dropdown
        };
    },

    computed: {
        // Computed columns so the select options update reactively whenever
        // controlHierarchyList or accountGroupOptions change.
        coaControlCol() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'accountGroupId',
                    label: 'Account Group',
                    type: 'select',
                    options: this.accountGroupOptions,
                    required: true,
                    searchable: true,
                    width: 220,
                    wrap: true   // span both columns in the modal form
                },
                {
                    key: 'minAccount',
                    label: 'Min Account No',
                    type: 'text',
                    required: true,
                    searchable: true,
                    width: 180
                },
                {
                    key: 'maxAccount',
                    label: 'Max Account No',
                    type: 'text',
                    required: true,
                    searchable: true,
                    width: 180
                }
            ];
        }
    },

    methods: {

        /* ── Fetch ──────────────────────────────────────────────── */

        async getAccountGroups() {
            try {
                const response = await axios.get('/GeneralLedger/GetAccountHeads?pageNo=1&pageSize=2000');
                const res = response.data;
                const rawList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);
                this.accountGroupList = rawList;
                this.accountGroupOptions = this.buildGroupHierarchyOptions(rawList);
            } catch (error) {
                console.error('Failed to load account groups:', error);
            }
        },

        /** Build hierarchical labels for the account group dropdown.
         *  Each option label becomes e.g. "Assets / Current Assets / Cash". */
        buildGroupHierarchyOptions(groups) {
            const map = new Map(groups.map(g => [g.id, g]));

            const getPath = (group, visited = new Set()) => {
                if (!group || visited.has(group.id)) return group?.name || '';
                visited.add(group.id);
                const parentId = group.parentId || group.parentAccountHeadId;
                if (!parentId || parentId === this.emptyGuid) return group.name;
                const parent = map.get(parentId);
                if (!parent) return group.name;
                return `${getPath(parent, visited)} / ${group.name}`;
            };

            return groups.map(g => ({
                label: getPath(g),
                value: g.id
            })).sort((a, b) => a.label.localeCompare(b.label));
        },

        /** Resolve the name of the selected account group by its id. */
        resolveGroupName(groupId) {
            const group = this.accountGroupList.find(g => g.id === groupId);
            return group?.name || '';
        },

        async getAccountControls() {
            this.isShimmerLoading = true;
            try {
                const response = await axios.get('/GeneralLedger/GetAccountControls?pageNo=1&pageSize=2000');
                const res = response.data;

                // Handle paginated { result: { data: [] } }, { result: [] }, or flat []
                const rawList = res?.result?.data || res?.result || (Array.isArray(res) ? res : []);

                this.coaControlList = rawList;
                this.buildHierarchy();
            } catch (error) {
                console.error('Failed to load control accounts:', error);
                this.toastHandler('error', 'Unable to load chart of account controls.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── CRUD handlers wired to <data-grid> events ──────────── */

        async onCreate(event) {
            const row = event?.row || event?.data;

            // Auto-derive accountHeaderName from the selected account group
            const accountGroupId = row?.accountGroupId || row?.accountHeadId;
            row.accountHeaderName = this.resolveGroupName(accountGroupId);

            if (!row || !this.validateRecord(row)) return;

            const parentAccountHeaderId = row.parentAccountHeaderId || row.parentControlId || this.emptyGuid;
            const headerName = String(row.accountHeaderName || '').trim();
            const parent = this.coaControlList.find(c => c.id === parentAccountHeaderId);

            const payload = {
                accountHeaderName: headerName,
                name: headerName,
                accountGroupId: accountGroupId,
                parentAccountHeaderId: parentAccountHeaderId || this.emptyGuid,
                parentControlId: parentAccountHeaderId || this.emptyGuid,
                minAccount: parseInt(row.minAccount, 10) || 0,
                maxAccount: parseInt(row.maxAccount, 10) || 0,
                parentName: parent
                    ? `${parent.parentName}/${headerName}`
                    : headerName
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/GeneralLedger/CreateAccountControl', payload);
                await this.getAccountControls();
                this.toastHandler('success', 'Control account created successfully.');
            } catch (err) {
                console.error('Create failed:', err);
                this.toastHandler('error', 'Failed to create control account.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onUpdate(event) {
            const row = event?.row || event?.data;

            // Auto-derive accountHeaderName from the selected account group
            const accountGroupId = row?.accountGroupId || row?.accountHeadId;
            row.accountHeaderName = this.resolveGroupName(accountGroupId);

            if (!row || !this.validateRecord(row)) return;

            const existing = this.coaControlList.find(
                c => String(c.id) === String(row.id)
            );

            if (!existing) {
                this.toastHandler('error', 'Control account record was not found.');
                return;
            }

            const parentAccountHeaderId = row.parentAccountHeaderId || row.parentControlId || this.emptyGuid;
            const headerName = String(row.accountHeaderName || '').trim();
            const parent = this.coaControlList.find(c => c.id === parentAccountHeaderId);

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                accountHeaderName: headerName,
                name: headerName,
                accountGroupId: accountGroupId,
                accountHeadId: accountGroupId,
                parentAccountHeaderId: parentAccountHeaderId,
                parentControlId: parentAccountHeaderId,
                minAccount: parseInt(row.minAccount, 10) || 0,
                maxAccount: parseInt(row.maxAccount, 10) || 0,
                parentName: parent
                    ? `${parent.parentName}/${headerName}`
                    : headerName
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/GeneralLedger/UpdateAccountControl', payload);

                // Optimistically patch the local list
                const idx = this.coaControlList.findIndex(
                    c => String(c.id) === String(existing.id)
                );
                if (idx !== -1) {
                    this.coaControlList.splice(idx, 1, { ...payload });
                }

                this.buildHierarchy();
                this.toastHandler('success', 'Control account updated successfully.');
            } catch (err) {
                console.error('Update failed:', err);
                this.toastHandler('error', 'Failed to update control account.');
                await this.getAccountControls(); // re-sync on failure
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
                    rows.map(r => axios.get('/GeneralLedger/DeleteAccountControl?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} deleted; ${failed} failed.`
                    );
                    await this.getAccountControls();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} control account${rows.length !== 1 ? 's' : ''} deleted.`
                    );
                }
            } catch (err) {
                console.error('Delete failed:', err);
                this.toastHandler('error', 'Failed to delete control account.');
                await this.getAccountControls();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Hierarchy builder ──────────────────────────────────── */

        // Resolves the full breadcrumb path for each control account and builds
        // the parent account header dropdown options.
        buildHierarchy() {
            const listMap = new Map(
                this.coaControlList.map(c => [c.id, c])
            );

            // Recursively build "Root / Child / Grandchild" path
            const getPath = (item, visited = new Set()) => {
                const displayName = item?.accountHeaderName || item?.name || '';
                if (!item || visited.has(item.id)) return displayName;
                visited.add(item.id);

                const parentId = item.parentAccountHeaderId || item.parentControlId;
                if (!parentId || parentId === this.emptyGuid) {
                    return displayName;
                }

                const parent = listMap.get(parentId);
                if (!parent) return displayName;

                return `${getPath(parent, visited)} / ${displayName}`;
            };

            // Annotate each record with its computed parentName and ensure standard fields
            this.coaControlList = this.coaControlList.map(c => {
                const headerName = c.accountHeaderName || c.name || '';
                const parentId = c.parentAccountHeaderId || c.parentControlId || this.emptyGuid;
                const groupId = c.accountGroupId || c.accountHeadId || this.emptyGuid;

                const item = {
                    ...c,
                    accountHeaderName: headerName,
                    name: headerName,
                    accountGroupId: groupId,
                    accountHeadId: groupId,
                    parentAccountHeaderId: parentId,
                    parentControlId: parentId,
                    minAccount: c.minAccount != null ? String(c.minAccount) : '',
                    maxAccount: c.maxAccount != null ? String(c.maxAccount) : ''
                };

                return {
                    ...item,
                    parentName: getPath(item)
                };
            });

            // Rebuild the parent account header dropdown options
            this.controlHierarchyList = [
                { label: 'No Parent (Root Header)', value: this.emptyGuid },
                ...this.coaControlList.map(c => ({
                    label: c.parentName,
                    value: c.id
                }))
            ];
        },

        /* ── Validation ─────────────────────────────────────────── */

        validateRecord(row) {
            // accountHeaderName is auto-derived — no user input needed.
            // We only validate the fields the user actually fills in.

            const groupId = row.accountGroupId || row.accountHeadId;
            if (!groupId || groupId === this.emptyGuid) {
                this.toastHandler('warning', 'Please select an Account Group.');
                return false;
            }

            const minStr = String(row.minAccount ?? '').trim();
            const maxStr = String(row.maxAccount ?? '').trim();

            if (!minStr || !maxStr) {
                this.toastHandler('warning', 'Min and Max account numbers are required.');
                return false;
            }

            const min = parseInt(minStr, 10);
            const max = parseInt(maxStr, 10);

            if (!isNaN(min) && !isNaN(max) && max < min) {
                this.toastHandler('warning', 'Max Account No cannot be less than Min Account No.');
                return false;
            }

            const parentId = row.parentAccountHeaderId || row.parentControlId;
            if (parentId && parentId !== this.emptyGuid) {
                const parent = this.coaControlList.find(c => c.id === parentId);

                if (!parent) {
                    this.toastHandler('error', 'Selected parent account header does not exist.');
                    return false;
                }

                if (row.id && parentId === row.id) {
                    this.toastHandler('warning', 'An account header cannot be its own parent.');
                    return false;
                }

                // Guard against circular hierarchy
                let current = this.coaControlList.find(c => c.id === parentId);
                const visited = new Set();

                while (current && !visited.has(current.id)) {
                    if (current.id === row.id) {
                        this.toastHandler('warning', 'This change would create a circular hierarchy.');
                        return false;
                    }
                    visited.add(current.id);
                    const nextParentId = current.parentAccountHeaderId || current.parentControlId;
                    current = this.coaControlList.find(c => c.id === nextParentId);
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

    async mounted() {
        await this.getAccountGroups();
        await this.getAccountControls();
    }
});

app.use(DataGridPlugin);
app.mount('#app');
