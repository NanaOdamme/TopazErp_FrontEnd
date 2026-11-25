const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            disciplinaryActionList: [],
            theme: '#062a81',
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
                    key: 'actionDescription',
                    label: 'Action Description',
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
            ]
        };
    },

    methods: {
        getSetupData() {
            this.isShimmerLoading = true;

            axios.get('/SchoolManager/GetDisciplinaryActions/').then(response => {
                this.disciplinaryActionList = response.data.result;
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get disciplinary actions.');
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
                actionDescription: String(row.actionDescription || '').trim()
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateDisciplinaryAction/', payload).then(response => {
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
                this.toastHandler('error', 'Unable to save disciplinary action.');
                this.isShimmerLoading = false;
            });
        },

        update(row) {
            const existing = this.disciplinaryActionList.find(b => b.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Disciplinary action was not found.');
                return;
            }

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId,
                actionDescription: String(row.actionDescription || '').trim()
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/UpdateDisciplinaryAction/', payload).then(response => {
                this.getSetupData();
                this.toastHandler('success', 'Disciplinary action updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update disciplinary action.');
            });
        },

        async delete(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SchoolManager/DeleteDisciplinaryAction?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} disciplinary action(s) deleted; ${failed} failed.`
                    );
                    this.getSetupData();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} disciplinary action(s) deleted successfully.`
                    );
                }
            } catch (err) {
                console.error('Failed to delete disciplinary actions:', err);
                this.toastHandler('error', 'Failed to delete disciplinary actions.');
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
