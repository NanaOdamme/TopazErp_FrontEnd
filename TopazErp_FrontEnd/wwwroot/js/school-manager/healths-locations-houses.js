const app = Vue.createApp({
    data() {
        const nameColumns = label => [
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
                label,
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

        return {
            isShimmerLoading: false,
            payload: {},
            healthList: [],
            houseList: [],
            locationList: [],
            theme: '#062a81',
            healthColumns: nameColumns('Health'),
            houseColumns: nameColumns('House'),
            locationColumns: nameColumns('Location')
        };
    },

    methods: {
        getHealthData() {
            this.isShimmerLoading = true;

            axios.get('/SchoolManager/GetHealths/').then(response => {
                this.healthList = response.data.result;
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get healths.');
            });
        },

        getHouseData() {
            this.isShimmerLoading = true;

            axios.get('/SchoolManager/GetHouses/').then(response => {
                this.houseList = response.data.result;
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get houses.');
            });
        },

        getLocationData() {
            this.isShimmerLoading = true;

            axios.get('/SchoolManager/GetLocations/').then(response => {
                this.locationList = response.data.result;
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get locations.');
            });
        },

        async onCreateHealth(event) {
            const row = event?.row || event?.data;
            if (!row) return;
            this.createHealth(row);
        },

        async onUpdateHealth(event) {
            const row = event?.row || event?.data;
            if (!row) return;
            this.updateHealth(row);
        },

        async onDeleteHealth(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;
            await this.deleteHealths(rows);
        },

        createHealth(row) {
            const payload = { name: String(row.name || '').trim() };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateHealth/', payload).then(response => {
                if (response.data.result.code === 200) {
                    this.getHealthData();
                    this.toastHandler('success', 'Data saved.');
                } else {
                    this.toastHandler('error', response.data.message);
                    this.getHealthData();
                }

                this.isShimmerLoading = false;
            }).catch(err => {
                this.getHealthData();
                this.toastHandler('error', 'Unable to save health.');
                this.isShimmerLoading = false;
            });
        },

        updateHealth(row) {
            const existing = this.healthList.find(b => b.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Health was not found.');
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

            axios.post('/SchoolManager/UpdateHealth/', payload).then(response => {
                this.getHealthData();
                this.toastHandler('success', 'Health updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update health.');
            });
        },

        async deleteHealths(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SchoolManager/DeleteHealth?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;

                if (failed) {
                    this.toastHandler('warning', `${rows.length - failed} health record(s) deleted; ${failed} failed.`);
                    this.getHealthData();
                } else {
                    this.toastHandler('success', `${rows.length} health record(s) deleted successfully.`);
                }
            } catch (err) {
                console.error('Failed to delete health records:', err);
                this.toastHandler('error', 'Failed to delete health records.');
                this.getHealthData();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onCreateHouse(event) {
            const row = event?.row || event?.data;
            if (!row) return;
            this.createHouse(row);
        },

        async onUpdateHouse(event) {
            const row = event?.row || event?.data;
            if (!row) return;
            this.updateHouse(row);
        },

        async onDeleteHouse(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;
            await this.deleteHouses(rows);
        },

        createHouse(row) {
            const payload = { name: String(row.name || '').trim() };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateHouse/', payload).then(response => {
                if (response.data.result.code === 200) {
                    this.getHouseData();
                    this.toastHandler('success', 'Data saved.');
                } else {
                    this.toastHandler('error', response.data.message);
                    this.getHouseData();
                }

                this.isShimmerLoading = false;
            }).catch(err => {
                this.getHouseData();
                this.toastHandler('error', 'Unable to save house.');
                this.isShimmerLoading = false;
            });
        },

        updateHouse(row) {
            const existing = this.houseList.find(b => b.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'House was not found.');
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

            axios.post('/SchoolManager/UpdateHouse/', payload).then(response => {
                this.getHouseData();
                this.toastHandler('success', 'House updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update house.');
            });
        },

        async deleteHouses(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SchoolManager/DeleteHouse?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;

                if (failed) {
                    this.toastHandler('warning', `${rows.length - failed} house(s) deleted; ${failed} failed.`);
                    this.getHouseData();
                } else {
                    this.toastHandler('success', `${rows.length} house(s) deleted successfully.`);
                }
            } catch (err) {
                console.error('Failed to delete houses:', err);
                this.toastHandler('error', 'Failed to delete houses.');
                this.getHouseData();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onCreateLocation(event) {
            const row = event?.row || event?.data;
            if (!row) return;
            this.createLocation(row);
        },

        async onUpdateLocation(event) {
            const row = event?.row || event?.data;
            if (!row) return;
            this.updateLocation(row);
        },

        async onDeleteLocation(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;
            await this.deleteLocations(rows);
        },

        createLocation(row) {
            const payload = { name: String(row.name || '').trim() };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateLocation/', payload).then(response => {
                if (response.data.result.code === 200) {
                    this.getLocationData();
                    this.toastHandler('success', 'Data saved.');
                } else {
                    this.toastHandler('error', response.data.message);
                    this.getLocationData();
                }

                this.isShimmerLoading = false;
            }).catch(err => {
                this.getLocationData();
                this.toastHandler('error', 'Unable to save location.');
                this.isShimmerLoading = false;
            });
        },

        updateLocation(row) {
            const existing = this.locationList.find(b => b.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Location was not found.');
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

            axios.post('/SchoolManager/UpdateLocation/', payload).then(response => {
                this.getLocationData();
                this.toastHandler('success', 'Location updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update location.');
            });
        },

        async deleteLocations(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SchoolManager/DeleteLocation?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;

                if (failed) {
                    this.toastHandler('warning', `${rows.length - failed} location(s) deleted; ${failed} failed.`);
                    this.getLocationData();
                } else {
                    this.toastHandler('success', `${rows.length} location(s) deleted successfully.`);
                }
            } catch (err) {
                console.error('Failed to delete locations:', err);
                this.toastHandler('error', 'Failed to delete locations.');
                this.getLocationData();
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
        this.getHealthData();
        this.getHouseData();
        this.getLocationData();
    }
});

app.use(DataGridPlugin);
app.mount('#app');