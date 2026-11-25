const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            supplementaryItemList: [],
            theme: '#062a81'
        };
    },

    computed: {
        columns() {
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
                    label: 'Supplementary Item',
                    type: 'text',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: '250'
                },
                {
                    key: 'isFixed',
                    label: 'Is Fixed',
                    type: 'boolean',
                    editable: true,
                    searchable: false,
                    width: 120
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
        }
    },

    methods: {
        getSetupData() {
            this.isShimmerLoading = true;

            axios.get('/SchoolManager/GetSupplementaryItems/').then(response => {
                this.supplementaryItemList = response.data.result;
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get supplementary items.');
            });
        },

        async onCreate(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.create(row);
        },

        async onUpdate(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.update(row);
        },

        async onDelete(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            await this.delete(rows);
        },

        create(row) {
            const payload = {
                name: String(row.name || '').trim(),
                isFixed: Boolean(row.isFixed)
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateSupplementaryItem/', payload).then(response => {
                if (response.data.result.code === 200) {
                    this.getSetupData();
                    this.toastHandler('success', 'Data saved.');
                } else {
                    this.toastHandler('error', response.data.message);
                    this.getSetupData();
                }

                this.isShimmerLoading = false;
            }).catch(err => {
                this.getSetupData();
                this.toastHandler('error', 'Unable to save supplementary item.');
                this.isShimmerLoading = false;
            });
        },

        update(row) {
            const existing = this.supplementaryItemList.find(item => item.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Supplementary item was not found.');
                return;
            }

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId,
                name: String(row.name || '').trim(),
                isFixed: Boolean(row.isFixed)
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/UpdateSupplementaryItem/', payload).then(response => {
                this.getSetupData();
                this.toastHandler('success', 'Supplementary item updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update supplementary item.');
            });
        },

        async delete(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(row =>
                        axios.get('/SchoolManager/DeleteSupplementaryItem?id=' + row.id)
                    )
                );

                const failed = results.filter(result => result.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} supplementary item(s) deleted; ${failed} failed.`
                    );
                    this.getSetupData();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} supplementary item(s) deleted successfully.`
                    );
                }
            } catch (err) {
                console.error('Failed to delete supplementary items:', err);
                this.toastHandler('error', 'Failed to delete supplementary items.');
                this.getSetupData();
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