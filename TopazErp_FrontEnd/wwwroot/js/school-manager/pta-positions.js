const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            ptaPositionList: [],
            parentProfessionList: [],
            theme: '#062a81',

            ptaPositionColumns: [
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
                    label: 'PTA Position',
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
            ],

            parentProfessionColumns: [
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
                    label: 'Parent Profession',
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
        getPtaPositionData() {
            this.isShimmerLoading = true;

            axios.get('/SchoolManager/GetPtaPositions/').then(response => {
                this.ptaPositionList = response.data.result;
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get PTA positions.');
            });
        },

        getParentProfessionData() {
            this.isShimmerLoading = true;

            axios.get('/SchoolManager/GetParentProfessions/').then(response => {
                this.parentProfessionList = response.data.result;
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get parent professions.');
            });
        },

        async onCreatePtaPosition(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.createPtaPosition(row);
        },

        async onUpdatePtaPosition(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.updatePtaPosition(row);
        },

        async onDeletePtaPosition(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            await this.deletePtaPositions(rows);
        },

        createPtaPosition(row) {
            const payload = {
                name: String(row.name || '').trim()
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreatePtaPosition/', payload).then(response => {
                if (response.data.result.code === 200) {
                    this.getPtaPositionData();
                    this.toastHandler('success', 'Data saved.');
                } else {
                    this.toastHandler('error', response.data.message);
                    this.getPtaPositionData();
                }

                this.isShimmerLoading = false;
            }).catch(err => {
                this.getPtaPositionData();
                this.toastHandler('error', 'Unable to save PTA position.');
                this.isShimmerLoading = false;
            });
        },

        updatePtaPosition(row) {
            const existing = this.ptaPositionList.find(b => b.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'PTA position was not found.');
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

            axios.post('/SchoolManager/UpdatePtaPosition/', payload).then(response => {
                this.getPtaPositionData();
                this.toastHandler('success', 'PTA position updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update PTA position.');
            });
        },

        async deletePtaPositions(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SchoolManager/DeletePtaPosition?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} PTA position(s) deleted; ${failed} failed.`
                    );
                    this.getPtaPositionData();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} PTA position(s) deleted successfully.`
                    );
                }
            } catch (err) {
                console.error('Failed to delete PTA positions:', err);
                this.toastHandler('error', 'Failed to delete PTA positions.');
                this.getPtaPositionData();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onCreateParentProfession(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.createParentProfession(row);
        },

        async onUpdateParentProfession(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.updateParentProfession(row);
        },

        async onDeleteParentProfession(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            await this.deleteParentProfessions(rows);
        },

        createParentProfession(row) {
            const payload = {
                name: String(row.name || '').trim()
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateParentProfession/', payload).then(response => {
                if (response.data.result.code === 200) {
                    this.getParentProfessionData();
                    this.toastHandler('success', 'Data saved.');
                } else {
                    this.toastHandler('error', response.data.message);
                    this.getParentProfessionData();
                }

                this.isShimmerLoading = false;
            }).catch(err => {
                this.getParentProfessionData();
                this.toastHandler('error', 'Unable to save parent profession.');
                this.isShimmerLoading = false;
            });
        },

        updateParentProfession(row) {
            const existing = this.parentProfessionList.find(b => b.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Parent profession was not found.');
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

            axios.post('/SchoolManager/UpdateParentProfession/', payload).then(response => {
                this.getParentProfessionData();
                this.toastHandler('success', 'Parent profession updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update parent profession.');
            });
        },

        async deleteParentProfessions(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SchoolManager/DeleteParentProfession?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} parent profession(s) deleted; ${failed} failed.`
                    );
                    this.getParentProfessionData();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} parent profession(s) deleted successfully.`
                    );
                }
            } catch (err) {
                console.error('Failed to delete parent professions:', err);
                this.toastHandler('error', 'Failed to delete parent professions.');
                this.getParentProfessionData();
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
        this.getPtaPositionData();
        this.getParentProfessionData();
    }
});

app.use(DataGridPlugin);
app.mount('#app');