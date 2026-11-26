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
                    wrap: true,   // span both columns in the modal form
                    onChange: (val, values) => {
                        if (!val || val === this.emptyGuid) return;
                        const parent = this.getParentControl(val, values?.id);
                        if (parent) {
                            const pMin = parent.minAccount;
                            const pMax = parent.maxAccount;
                            const pName = parent.accountHeaderName || parent.name || 'parent';
                            this.toastHandler('info', `Under "${pName}": allowed account range is [${pMin} – ${pMax}].`);
                        }
                    }
                },
                {
                    key: 'minAccount',
                    label: 'Min Account No',
                    type: 'text',
                    required: true,
                    searchable: true,
                    width: 180,
                    help: 'Must be within parent range and ≤ all child minimums'
                },
                {
                    key: 'maxAccount',
                    label: 'Max Account No',
                    type: 'text',
                    required: true,
                    searchable: true,
                    width: 180,
                    help: 'Must be within parent range and ≥ all child maximums'
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
            if (!row) return;

            // Auto-derive accountHeaderName from the selected account group
            const accountGroupId = row?.accountGroupId || row?.accountHeadId;
            row.accountHeaderName = this.resolveGroupName(accountGroupId);

            if (!this.validateRecord(row)) return;

            const parentControl = this.getParentControl(accountGroupId, row.id);
            const parentAccountHeaderId = parentControl?.id || row.parentAccountHeaderId || row.parentControlId || this.emptyGuid;
            const headerName = String(row.accountHeaderName || '').trim();

            const payload = {
                accountHeaderName: headerName,
                name: headerName,
                accountGroupId: accountGroupId,
                parentAccountHeaderId: parentAccountHeaderId,
                parentControlId: parentAccountHeaderId,
                minAccount: parseInt(row.minAccount, 10) || 0,
                maxAccount: parseInt(row.maxAccount, 10) || 0,
                parentName: parentControl
                    ? `${parentControl.parentName || parentControl.accountHeaderName}/${headerName}`
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
            if (!row) return;

            // Auto-derive accountHeaderName from the selected account group
            const accountGroupId = row?.accountGroupId || row?.accountHeadId;
            row.accountHeaderName = this.resolveGroupName(accountGroupId);

            if (!this.validateRecord(row)) return;

            const existing = this.coaControlList.find(
                c => String(c.id) === String(row.id)
            );

            if (!existing) {
                this.toastHandler('error', 'Control account record was not found.');
                return;
            }

            const parentControl = this.getParentControl(accountGroupId, row.id);
            const parentAccountHeaderId = parentControl?.id || row.parentAccountHeaderId || row.parentControlId || existing.parentAccountHeaderId || this.emptyGuid;
            const headerName = String(row.accountHeaderName || '').trim();

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
                parentName: parentControl
                    ? `${parentControl.parentName || parentControl.accountHeaderName}/${headerName}`
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

        /* ── Hierarchy & Relationship Helpers ─────────────────────── */

        /** Find the nearest parent control in coaControlList for an account group or control */
        getParentControl(accountGroupId, controlId) {
            // 1. Direct parent ID lookup if stored on the control record
            if (controlId && controlId !== this.emptyGuid) {
                const existing = this.coaControlList.find(c => String(c.id) === String(controlId));
                const directParentId = existing?.parentAccountHeaderId || existing?.parentControlId;
                if (directParentId && directParentId !== this.emptyGuid) {
                    const parent = this.coaControlList.find(c => String(c.id) === String(directParentId));
                    if (parent && String(parent.id) !== String(controlId)) return parent;
                }
            }

            // 2. Traverse up the Account Head hierarchy to find the nearest ancestor with a control
            if (accountGroupId && accountGroupId !== this.emptyGuid) {
                let currentHead = this.accountGroupList.find(g => String(g.id) === String(accountGroupId));
                const visited = new Set();

                while (currentHead) {
                    if (visited.has(currentHead.id)) break;
                    visited.add(currentHead.id);

                    const parentHeadId = currentHead.parentId || currentHead.parentAccountHeadId;
                    if (!parentHeadId || parentHeadId === this.emptyGuid) break;

                    const parentControl = this.coaControlList.find(c => {
                        if (controlId && String(c.id) === String(controlId)) return false;
                        const cGroupId = c.accountGroupId || c.accountHeadId;
                        return String(cGroupId) === String(parentHeadId);
                    });

                    if (parentControl) return parentControl;

                    currentHead = this.accountGroupList.find(g => String(g.id) === String(parentHeadId));
                }
            }

            return null;
        },

        /** Find all direct and indirect child controls for an account group or control */
        getChildControls(accountGroupId, controlId) {
            const descendantGroupIds = new Set();

            if (accountGroupId && accountGroupId !== this.emptyGuid) {
                const collectDescendantIds = (parentId) => {
                    for (const g of this.accountGroupList) {
                        const pId = g.parentId || g.parentAccountHeadId;
                        if (pId && String(pId) === String(parentId) && g.id && !descendantGroupIds.has(g.id)) {
                            descendantGroupIds.add(g.id);
                            collectDescendantIds(g.id);
                        }
                    }
                };
                collectDescendantIds(accountGroupId);
            }

            return this.coaControlList.filter(c => {
                if (controlId && String(c.id) === String(controlId)) return false;

                const cGroupId = c.accountGroupId || c.accountHeadId;
                const cParentControlId = c.parentAccountHeaderId || c.parentControlId;

                const isDescendantGroup = Boolean(cGroupId && descendantGroupIds.has(cGroupId));
                const isChildByControlId = Boolean(controlId && controlId !== this.emptyGuid && String(cParentControlId) === String(controlId));

                return isDescendantGroup || isChildByControlId;
            });
        },

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

                let parentId = item.parentAccountHeaderId || item.parentControlId;
                if (!parentId || parentId === this.emptyGuid) {
                    const groupId = item.accountGroupId || item.accountHeadId;
                    const parentControl = this.getParentControl(groupId, item.id);
                    if (parentControl && parentControl.id !== item.id) {
                        parentId = parentControl.id;
                    }
                }

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

        /* ── Preventive Validation ───────────────────────────────── */

        validateRecord(row) {
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

            if (isNaN(min) || isNaN(max)) {
                this.toastHandler('warning', 'Min and Max account numbers must be valid integers.');
                return false;
            }

            if (min < 0) {
                this.toastHandler('warning', 'Min Account No cannot be negative.');
                return false;
            }

            if (max < min) {
                this.toastHandler('warning', 'Max Account No cannot be less than Min Account No.');
                return false;
            }

            // ── 1. Parent Range Check: Child must fit within parent's range ───
            const parent = this.getParentControl(groupId, row.id);
            if (parent && String(parent.id) !== String(row.id)) {
                const parentMin = parseInt(parent.minAccount, 10);
                const parentMax = parseInt(parent.maxAccount, 10);

                if (!isNaN(parentMin) && !isNaN(parentMax)) {
                    const parentName = parent.accountHeaderName || parent.name || 'parent control';
                    if (min < parentMin) {
                        this.toastHandler(
                            'warning',
                            `Min Account No (${min}) cannot be less than parent "${parentName}" minimum (${parentMin}). Allowed parent range is [${parentMin} – ${parentMax}].`
                        );
                        return false;
                    }
                    if (max > parentMax) {
                        this.toastHandler(
                            'warning',
                            `Max Account No (${max}) cannot be greater than parent "${parentName}" maximum (${parentMax}). Allowed parent range is [${parentMin} – ${parentMax}].`
                        );
                        return false;
                    }
                }
            }

            // ── 2. Child Controls Range Check: Parent must enclose all child controls ─
            const childControls = this.getChildControls(groupId, row.id);
            if (childControls.length > 0) {
                for (const child of childControls) {
                    const childMin = parseInt(child.minAccount, 10);
                    const childMax = parseInt(child.maxAccount, 10);
                    if (isNaN(childMin) || isNaN(childMax)) continue;

                    const childName = child.accountHeaderName || child.name || 'child control';

                    if (min > childMin) {
                        this.toastHandler(
                            'warning',
                            `Cannot save Min Account No (${min}): child control "${childName}" has minimum ${childMin}. The range must encompass all child controls.`
                        );
                        return false;
                    }

                    if (max < childMax) {
                        this.toastHandler(
                            'warning',
                            `Cannot save Max Account No (${max}): child control "${childName}" has maximum ${childMax}. The range must encompass all child controls.`
                        );
                        return false;
                    }
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
