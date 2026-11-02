
const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            theme: '#0645e7',

            customerGroupList: [],

            customerGroupColumns: [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true,
                    width: 100
                },
                {
                    key: 'name',
                    label: 'Customer Group',
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

        async getCustomerGroups() {
            this.isShimmerLoading = true;
            try {
                const response = await axios.get('/SharedResource/GetCustomerGroups/?pageNo=1&pageSize=1000');

                this.customerGroupList = response.data.result || [];
            } catch (error) {
                console.error('Failed to load supplier groups:', error);
                this.toastHandler('error', 'Unable to load customer groups.');
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
                await axios.post('/SharedResource/CreateCustomerGroup', payload);
                await this.getCustomerGroups();
                this.toastHandler('success', 'Customer group created successfully.');
            } catch (err) {
                console.error('Create failed:', err);
                this.toastHandler('error', 'Failed to create customer group.');
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

            const existing = this.customerGroupList.find(
                item => String(item.id) === String(row.id)
            );

            if (!existing) {
                this.toastHandler('error', 'Customer group was not found.');
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
                await axios.post('/SharedResource/UpdateCustomerGroup', payload);

                // Optimistically patch the local list so the grid reflects changes immediately
                const idx = this.customerGroupList.findIndex(item => String(item.id) === String(payload.id));
                if (idx !== -1) {
                    this.customerGroupList.splice(idx, 1, { ...payload });
                }
                
                this.toastHandler('success', 'Customer group updated successfully.');
                
            } catch (err) {
                console.error('Update failed:', err);
                this.toastHandler('error', 'Failed to update customer group.');
                await this.getCustomerGroups(); // roll back optimistic patch
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
                    rows.map(r => axios.get('/SharedResource/DelCustomerGroup/?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} deleted; ${failed} failed.`
                    );
                    await this.getCustomerGroups(); // re-sync after partial failure
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} supplier group${rows.length !== 1 ? 's' : ''} deleted.`
                    );
                    // The grid already removed the rows from its local data; no re-fetch needed
                }
            } catch (err) {
                console.error('Delete failed:', err);
                this.toastHandler('error', 'Failed to delete customer group.');
                await this.getCustomerGroups();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Helpers & Validation ───────────────────────────────── */

        validateRecord(row, excludeId = null) {
            if (!row.name || !String(row.name).trim()) {
                this.toastHandler('error', 'Customer group name is required.');
                return false;
            }

            const normalizedName = String(row.name).trim().toLowerCase();
            const duplicate = this.customerGroupList.some(
                item =>
                    String(item.name).trim().toLowerCase() === normalizedName &&
                    String(item.id) !== String(excludeId ?? row.id)
            );

            if (duplicate) {
                this.toastHandler('warning', 'A customer group with this name already exists.');
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
        this.getCustomerGroups();
    }
});

app.use(DataGridPlugin);
app.mount('#app');
