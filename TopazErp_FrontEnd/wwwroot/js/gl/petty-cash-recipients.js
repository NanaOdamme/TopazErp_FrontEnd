const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            theme: '#0645e7',

            recipientList: [],

            recipientColumns: [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true,
                    width: 100
                },
                {
                    key: 'recipient',
                    label: 'Recipient Name',
                    type: 'avatar',
                    width: 300,
                    minWidth: 220,
                    required: true,
                    searchable: true,
                    subtitleKey: 'email'
                },
                {
                    key: 'phoneNo',
                    label: 'Phone Number',
                    type: 'text',
                    width: 190,
                    searchable: true
                },
                {
                    key: 'email',
                    label: 'Email',
                    type: 'text',
                    width: 240,
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

        async getPettyCashRecipients() {
            this.isShimmerLoading = true;
            try {
                const response = await axios.get('/GeneralLedger/GetPettyCashRecipients?pageNo=1&pageSize=1000');
                const res = response.data;

                // Handle paginated { result: { data: [] } }, { result: [] }, { data: [] }, or flat []
                const rawList =
                    res?.result?.data ||
                    res?.result ||
                    res?.data ||
                    (Array.isArray(res) ? res : []);

                this.recipientList = rawList.map(r => ({
                    ...r,
                    recipient: r.recipient || r.name || '',
                    name: r.recipient || r.name || ''
                }));
            } catch (error) {
                console.error('Failed to load petty cash recipients:', error);
                this.toastHandler('error', 'Unable to load petty cash recipients.');
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

            const recipientName = String(row.recipient || row.name || '').trim();
            const payload = {
                recipient: recipientName,
                name: recipientName,
                phoneNo: String(row.phoneNo || '').trim(),
                email: String(row.email || '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/GeneralLedger/CreatePettyCashRecipient', payload);
                await this.getPettyCashRecipients();
                this.toastHandler('success', 'Petty cash recipient created successfully.');
            } catch (err) {
                console.error('Create failed:', err);
                this.toastHandler('error', 'Failed to create petty cash recipient.');
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

            const existing = this.recipientList.find(
                item => String(item.id) === String(row.id)
            );

            if (!existing) {
                this.toastHandler('error', 'Petty cash recipient was not found.');
                return;
            }

            const recipientName = String(row.recipient || row.name || existing.recipient || existing.name || '').trim();
            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId,
                recipient: recipientName,
                name: recipientName,
                phoneNo: String(row.phoneNo ?? existing.phoneNo ?? '').trim(),
                email: String(row.email ?? existing.email ?? '').trim()
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/GeneralLedger/UpdatePettyCashRecipient', payload);

                // Optimistically patch local list so grid reflects changes immediately
                const idx = this.recipientList.findIndex(
                    item => String(item.id) === String(payload.id)
                );
                if (idx !== -1) {
                    this.recipientList.splice(idx, 1, { ...payload });
                }

                this.toastHandler('success', 'Petty cash recipient updated successfully.');
            } catch (err) {
                console.error('Update failed:', err);
                this.toastHandler('error', 'Failed to update petty cash recipient.');
                await this.getPettyCashRecipients(); // roll back optimistic patch
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
                    rows.map(r => axios.get('/GeneralLedger/DeletePettyCashRecipient?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;
                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} deleted; ${failed} failed.`
                    );
                    await this.getPettyCashRecipients();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} recipient${rows.length !== 1 ? 's' : ''} deleted.`
                    );
                }
            } catch (err) {
                console.error('Delete failed:', err);
                this.toastHandler('error', 'Failed to delete petty cash recipient.');
                await this.getPettyCashRecipients();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Helpers & Validation ───────────────────────────────── */

        validateRecord(row, excludeId = null) {
            const name = String(row.recipient || row.name || '').trim();
            if (!name) {
                this.toastHandler('error', 'Recipient name is required.');
                return false;
            }

            const normalizedName = name.toLowerCase();
            const duplicate = this.recipientList.some(
                item =>
                    String(item.recipient || item.name || '').trim().toLowerCase() === normalizedName &&
                    String(item.id) !== String(excludeId ?? row.id)
            );

            if (duplicate) {
                this.toastHandler('warning', 'A recipient with this name already exists.');
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
        this.getPettyCashRecipients();
    }
});

if (typeof DataGridPlugin !== 'undefined') {
    app.use(DataGridPlugin);
}
app.mount('#app');
