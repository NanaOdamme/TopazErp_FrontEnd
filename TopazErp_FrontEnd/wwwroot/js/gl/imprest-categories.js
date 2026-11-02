const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            theme: '#0645e7',

            imprestCategoryList: [],

            imprestCategoryColumns: [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true,
                    width: 100
                },
                {
                    key: 'name',
                    label: 'Category Name',
                    type: 'avatar',
                    width: 350,
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

        async getImprestCategories() {
            this.isShimmerLoading = true;
            try {
                const response = await axios.get('/GeneralLedger/GetImprestCategories');
                this.imprestCategoryList = response.data.result;
                
            } catch (error) {
                console.error('Failed to load imprest categories:', error);
                this.toastHandler('error', 'Unable to load imprest categories.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

       
        async onCreate(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            if (!this.validateRecord(row)) return;

            const payload = {
                name: String(row.name || '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/GeneralLedger/CreateImprestCategory', payload);
                await this.getImprestCategories();
                this.toastHandler('success', 'Imprest category created successfully.');
            } catch (err) {
                console.error('Create failed:', err);
                this.toastHandler('error', 'Failed to create imprest category.');
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

            const existing = this.imprestCategoryList.find(
                item => String(item.id) === String(row.id)
            );

            if (!existing) {
                this.toastHandler('error', 'Imprest category was not found.');
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
                await axios.post('/GeneralLedger/UpdateImprestCategory', payload);

                // Optimistically patch local list so grid reflects changes immediately
                const idx = this.imprestCategoryList.findIndex(
                    item => String(item.id) === String(payload.id)
                );
                if (idx !== -1) {
                    this.imprestCategoryList.splice(idx, 1, { ...payload });
                }

                this.toastHandler('success', 'Imprest category updated successfully.');
            } catch (err) {
                console.error('Update failed:', err);
                this.toastHandler('error', 'Failed to update imprest category.');
                await this.getImprestCategories(); // roll back optimistic patch
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
                    rows.map(r => axios.get('/GeneralLedger/DeleteImprestCategory?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} deleted; ${failed} failed.`
                    );
                    await this.getImprestCategories();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} imprest category${rows.length !== 1 ? 'ies' : ''} deleted.`
                    );
                }
            } catch (err) {
                console.error('Delete failed:', err);
                this.toastHandler('error', 'Failed to delete imprest category.');
                await this.getImprestCategories();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Helpers & Validation ───────────────────────────────── */

        validateRecord(row, excludeId = null) {
            if (!row.name || !String(row.name).trim()) {
                this.toastHandler('error', 'Category name is required.');
                return false;
            }

            const normalizedName = String(row.name).trim().toLowerCase();
            const duplicate = this.imprestCategoryList.some(
                item =>
                    String(item.name).trim().toLowerCase() === normalizedName &&
                    String(item.id) !== String(excludeId ?? row.id)
            );

            if (duplicate) {
                this.toastHandler('warning', 'An imprest category with this name already exists.');
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
        this.getImprestCategories();
    }
});

if (typeof DataGridPlugin !== 'undefined') {
    app.use(DataGridPlugin);
}
app.mount('#app');
