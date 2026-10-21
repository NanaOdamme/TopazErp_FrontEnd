
const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            theme: '#0645e7',

            supplierGroupList: [],

            supplierGroupColumns: [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true,
                    width: 100
                },
                {
                    key: 'name',
                    label: 'Supplier Group',
                    type: 'avatar',
                    width: 320,
                    minWidth: 250,
                    required: true,
                    searchable: true
                },
                {
                    key: 'tenantId',
                    label: 'Tenant',
                    type: 'number',
                    hidden: true,
                    width: 100
                }
            ]
        };
    },

    methods: {

        /* ── Fetch ──────────────────────────────────────────────── */

        async getSupplierGroups() {
            this.isShimmerLoading = true;
            try {
                const response = await axios.get('/SharedResource/GetSupplierGroups?pageNo=1&pageSize=1000');
                const res = response.data;

                // Handle both paginated { result: { data: [] } } and flat { result: [] } shapes
                const rawList =
                    res?.result?.data ||
                    res?.result ||
                    res?.data ||
                    (Array.isArray(res) ? res : []);

                this.supplierGroupList = rawList;
            } catch (error) {
                console.error('Failed to load supplier groups:', error);
                this.toastHandler('error', 'Unable to load supplier groups.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── CRUD handlers wired to <data-grid> events ──────────── */

        // @create — fired after the grid's built-in form is submitted with mode='create'
        // event shape: { grid, level, row, data }
        async onCreate(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            if (!this.validateRecord(row)) return;

            const payload = {
                name: String(row.name || '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/SharedResource/CreateSupplierGroup', payload);
                await this.getSupplierGroups();
                this.toastHandler('success', 'Supplier group created successfully.');
            } catch (err) {
                console.error('Create failed:', err);
                this.toastHandler('error', 'Failed to create supplier group.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        // @update — fired after the grid's built-in form is submitted with mode='update'
        // event shape: { grid, level, row, data }
        async onUpdate(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            if (!this.validateRecord(row)) return;

            const existing = this.supplierGroupList.find(
                item => String(item.id) === String(row.id)
            );

            if (!existing) {
                this.toastHandler('error', 'Supplier group was not found.');
                return;
            }

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId,
                name: String(row.name || '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/SharedResource/UpdateSupplierGroup', payload);

                // Optimistically patch the local list so the grid reflects changes immediately
                const idx = this.supplierGroupList.findIndex(
                    item => String(item.id) === String(payload.id)
                );
                if (idx !== -1) {
                    this.supplierGroupList.splice(idx, 1, { ...payload });
                }

                this.toastHandler('success', 'Supplier group updated successfully.');
            } catch (err) {
                console.error('Update failed:', err);
                this.toastHandler('error', 'Failed to update supplier group.');
                await this.getSupplierGroups(); // roll back optimistic patch
            } finally {
                this.isShimmerLoading = false;
            }
        },

        // @delete — fired after the user confirms the built-in delete dialog
        // event shape: { grid, level, rows }
        async onDelete(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            this.isShimmerLoading = true;
            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SharedResource/DelSupplierGroup?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} deleted; ${failed} failed.`
                    );
                    await this.getSupplierGroups(); // re-sync after partial failure
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} supplier group${rows.length !== 1 ? 's' : ''} deleted.`
                    );
                    // The grid already removed the rows from its local data; no re-fetch needed
                }
            } catch (err) {
                console.error('Delete failed:', err);
                this.toastHandler('error', 'Failed to delete supplier group.');
                await this.getSupplierGroups();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Helpers & Validation ───────────────────────────────── */

        validateRecord(row, excludeId = null) {
            if (!row.name || !String(row.name).trim()) {
                this.toastHandler('error', 'Supplier group name is required.');
                return false;
            }

            const normalizedName = String(row.name).trim().toLowerCase();
            const duplicate = this.supplierGroupList.some(
                item =>
                    String(item.name).trim().toLowerCase() === normalizedName &&
                    String(item.id) !== String(excludeId ?? row.id)
            );

            if (duplicate) {
                this.toastHandler('warning', 'A supplier group with this name already exists.');
                return false;
            }

            return true;
        },

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
        this.getSupplierGroups();
    }
});

app.use(DataGridPlugin);
app.mount('#app');
