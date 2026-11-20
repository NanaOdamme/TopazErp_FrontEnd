const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            subjectList: [],
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
                    label: 'Subject',
                    type: 'text',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: '250'
                },
                {
                    key: 'abbreviation',
                    label: 'Abbreviation',
                    type: 'text',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: '150'
                },
                {
                    key: 'isCore',
                    label: 'Core ?',
                    type: 'boolean',
                    editable: true,
                    searchable: false,
                    width: 130
                },
                {
                    key: 'isBestSubject',
                    label: 'NBES ?',
                    type: 'boolean',
                    editable: true,
                    searchable: false,
                    width: 130
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

            axios.get('/SchoolManager/GetSubjects/').then(response => {
                this.subjectList = response.data.result;
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get subjects.');
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
            if (!this.validateSubjectFlags(row)) return;

            const payload = {
                name: String(row.name || '').trim(),
                abbreviation: String(row.abbreviation || '').trim(),
                isCore: Boolean(row.isCore),
                isBestSubject: Boolean(row.isBestSubject)
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateSubject/', payload).then(response => {
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
                this.toastHandler('error', 'Unable to save subject.');
                this.isShimmerLoading = false;
            });
        },

        update(row) {
            if (!this.validateSubjectFlags(row)) return;

            const existing = this.subjectList.find(item => item.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Subject was not found.');
                return;
            }

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId,
                name: String(row.name || '').trim(),
                abbreviation: String(row.abbreviation || '').trim(),
                isCore: Boolean(row.isCore),
                isBestSubject: Boolean(row.isBestSubject)
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/UpdateSubject/', payload).then(response => {
                this.getSetupData();
                this.toastHandler('success', 'Subject updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update subject.');
            });
        },

        async delete(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(row =>
                        axios.get('/SchoolManager/DeleteSubject?id=' + row.id)
                    )
                );

                const failed = results.filter(result => result.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} subject(s) deleted; ${failed} failed.`
                    );
                    this.getSetupData();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} subject(s) deleted successfully.`
                    );
                }
            } catch (err) {
                console.error('Failed to delete subjects:', err);
                this.toastHandler('error', 'Failed to delete subjects.');
                this.getSetupData();
            } finally {
                this.isShimmerLoading = false;
            }
        },
        validateSubjectFlags(row) {
            if (row.isCore && row.isBestSubject) {
                this.toastHandler(
                    'error',
                    'A subject cannot be both Core and NBES.'
                );
                return false;
            }

            return true;
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