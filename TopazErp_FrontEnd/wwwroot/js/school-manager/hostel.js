const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            hostelList: [],
            theme: '#062a81'
        };
    },

    computed: {
        hostelColumns() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true,
                    editable: false,
                    searchable: false
                },
                {
                    key: 'name',
                    label: 'Hostel',
                    type: 'text',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: '250'
                },
                {
                    key: 'tenantId',
                    label: 'Tenant',
                    type: 'number',
                    hidden: true,
                    editable: false,
                    searchable: false
                }
            ];
        },

        hostelDetailCol() {
            return {
                key: 'details',
                title: 'Blocks',
                columns: [
                    {
                        key: 'id',
                        label: 'ID',
                        type: 'text',
                        hidden: true,
                        editable: false,
                        searchable: false
                    },
                    {
                        key: 'hostelId',
                        label: 'Hostel ID',
                        type: 'text',
                        hidden: true,
                        editable: false,
                        searchable: false,
                        defaultValue: (row, column, parentRow) => parentRow?.id ?? '',
                        disabled: true
                    },
                    {
                        key: 'blockName',
                        label: 'Block Name',
                        type: 'text',
                        required: true,
                        editable: true,
                        searchable: true,
                        width: '250'
                    }
                ]
            };
        }
    },

    methods: {
        sameId(a, b) {
            return a != null && b != null &&
                String(a).toLowerCase() === String(b).toLowerCase();
        },

        isGuid(value) {
            return !!value &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value));
        },

        asGuid(value) {
            return this.isGuid(value) ? String(value) : this.uuid();
        },
        
        getSetupData() {
            this.isShimmerLoading = true;

            axios.get('/SchoolManager/GetHostels/').then(response => {
                this.hostelList = response.data.result || [];
                this.hostelList = this.hostelList.map(hostel => ({
                    ...hostel,
                    details: hostel.details || []
                }));
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get hostels.');
            });
        },

        async onCreate(event) {
            const row = event?.row || event?.data;
            const level = Number(event?.level ?? 0);
            if (!row) return;

            if (level === 0) {
                await this.createHostel(row);
                return;
            }

            const parentHostelId = event?.grid?.parentRow?.id || row.hostelId;
            if (!parentHostelId) {
                this.toastHandler('error', 'Hostel was not found for this block.');
                return;
            }

            row.hostelId = parentHostelId;
            await this.saveHostelDetail(parentHostelId, row, 'create');
        },

        async onUpdate(event) {
            const row = event?.row || event?.data;
            const level = Number(event?.level ?? 0);
            if (!row) return;

            if (level === 0) {
                await this.updateHostel(row);
                return;
            }

            const parentHostelId = event?.grid?.parentRow?.id || row.hostelId;
            if (!parentHostelId) {
                this.toastHandler('error', 'Hostel was not found for this block.');
                return;
            }

            row.hostelId = parentHostelId;
            await this.saveHostelDetail(parentHostelId, row, 'update');
        },

        async onDelete(event) {
            const rows = Array.isArray(event?.rows) ? event.rows : [];
            const level = Number(event?.level ?? 0);
            if (!rows.length) return;

            if (level === 0) {
                await this.deleteHostels(rows);
                return;
            }

            if (level === 1) {
                const parentHostelId =
                    event?.grid?.parentRow?.id ||
                    rows.find(row => row.hostelId)?.hostelId;

                if (!parentHostelId) {
                    this.toastHandler('error', 'Hostel was not found for these blocks.');
                    return;
                }

                await this.deleteHostelDetails(parentHostelId, rows);
            }
        },

        async createHostel(row) {
            const payload = {
                name: String(row.name || '').trim(),
                details: (row.details || []).map(detail => ({
                    id: detail.id || this.uuid(),
                    hostelId: detail.hostelId || row.id || '',
                    blockName: String(detail.blockName || '').trim()
                }))
            };

            this.isShimmerLoading = true;

            try {
                const response = await axios.post('/SchoolManager/CreateHostel/', payload);

                if (response.data.result.code === 200) {
                    await this.getSetupData();
                    this.toastHandler('success', 'Hostel saved.');
                } else {
                    this.toastHandler('error', response.data.message || 'Unable to save hostel.');
                    await this.getSetupData();
                }
            } catch (err) {
                await this.getSetupData();
                this.toastHandler('error', 'Unable to save hostel.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async updateHostel(row) {
            const existing = this.hostelList.find(item => item.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Hostel was not found.');
                return;
            }

            const details = (row.details || existing.details || []).map(detail => ({
                ...detail,
                id: detail.id || this.uuid(),
                hostelId: existing.id,
                blockName: String(detail.blockName || '').trim()
            }));

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId,
                name: String(row.name || '').trim(),
                details
            };

            this.isShimmerLoading = true;

            try {
                await axios.post('/SchoolManager/UpdateHostel/', payload);
                await this.getSetupData();
                this.toastHandler('success', 'Hostel updated.');
            } catch (err) {
                this.toastHandler('error', 'Unable to update hostel.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async saveHostelDetail(hostelId, row, action) {
            const existing = this.hostelList.find(item => this.sameId(item.id, hostelId));
            if (!existing) {
                this.toastHandler('error', 'Hostel was not found.');
                await this.getSetupData();
                return;
            }

            // Don't send a DataGrid-generated draft ID to an endpoint expecting a saved hostel ID.
            if (!this.isGuid(existing.id)) {
                this.toastHandler('warning', 'Save the hostel before saving blocks.');
                return;
            }

            let details = [...(existing.details || [])];
            const detail = {
                ...row,
                id: this.asGuid(row.id),
                hostelId: existing.id,
                blockName: String(row.blockName || '').trim()
            };

            if (action === 'create') {
                details = details.filter(item => !this.sameId(item.id, row.id));
                details.push(detail);
            } else {
                details = details.map(item =>
                    this.sameId(item.id, row.id) ? detail : item
                );
            }

            await this.saveHostelWithDetails(existing, details, action);
        },

        async deleteHostelDetails(hostelId, rows) {
            if (!hostelId || !Array.isArray(rows) || !rows.length) return;

            // A block under an unsaved draft parent was only removed locally.
            if (!this.isGuid(hostelId)) return;

            const existing = this.hostelList.find(item => this.sameId(item.id, hostelId));
            if (!existing) {
                this.toastHandler('error', 'Hostel was not found.');
                await this.getSetupData();
                return;
            }

            const deletedIds = new Set(
                rows
                    .map(row => row.id)
                    .filter(id => id != null)
                    .map(id => String(id).toLowerCase())
            );

            const details = (existing.details || []).filter(item =>
                !deletedIds.has(String(item.id || '').toLowerCase())
            );

            await this.saveHostelWithDetails(existing, details, 'delete');
        },
       

        async saveHostelWithDetails(hostel, details, action) {
            const payload = {
                ...hostel,
                details
            };

            this.isShimmerLoading = true;

            try {
                await axios.post('/SchoolManager/UpdateHostel/', payload);
                await this.getSetupData();

                const message = action === 'create'
                    ? 'Block saved.'
                    : action === 'update'
                        ? 'Block updated.'
                        : 'Block(s) deleted successfully.';

                this.toastHandler('success', message);
            } catch (err) {
                this.toastHandler('error', 'Unable to save hostel blocks.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async deleteHostels(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(row =>
                        axios.get('/SchoolManager/DeleteHostel?id=' + row.id)
                    )
                );

                const failed = results.filter(result => result.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} hostel(s) deleted; ${failed} failed.`
                    );
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} hostel(s) deleted successfully.`
                    );
                }

                await this.getSetupData();
            } catch (err) {
                console.error('Failed to delete hostels:', err);
                this.toastHandler('error', 'Failed to delete hostels.');
                await this.getSetupData();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        uuid() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        },

        toastHandler(type, message = 'An unexpected error occurred.') {
            if (typeof Swal === 'undefined') {
                console.log(message);
                return;
            }

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                title: message,
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
        }
    },

    mounted() {
        this.getSetupData();
    }
});

app.use(DataGridPlugin);
app.mount('#app');