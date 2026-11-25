const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            transportationLocationList: [],
            locationsList: [],
            transportationUnitsList: [],
            theme: '#062a81',
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
                key: 'locationId',
                label: 'Location',
                type: 'select',
                options: this.locationsList,
                display: 'name',
                value: 'id',
                required: true,
                editable: true,
                searchable: true,
                width: 220
            },
            {
                key: 'locationName',
                label: 'Location Name',
                type: 'text',
                hidden: true,
                editable: false,
                searchable: false
            },
            {
                key: 'amount',
                label: 'Amount',
                type: 'number',
                required: true,
                editable: true,
                searchable: true,
                width: 150
            },
            {
                key: 'transportationUnitId',
                label: 'Transportation Unit',
                type: 'select',
                options: this.transportationUnitsList,
                display: 'name',
                value: 'id',
                required: true,
                editable: true,
                searchable: true,
                width: 220
            },
            {
                key: 'transportationUnitName',
                label: 'Transportation Unit Name',
                type: 'text',
                hidden: true,
                editable: false,
                searchable: false
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

},
    methods: {
           
        getSetupData() {
            this.isShimmerLoading = true;

            Promise.all([
                axios.get('/SchoolManager/GetTransportationLocations/'),
                axios.get('/SchoolManager/GetLocations/'),
                axios.get(`/jsonDataSample/transportationalUnits.json?v=${new Date().getTime()}`)
            ]).then(([transportationLocationsResponse, locationsResponse, unitsResponse]) => {
                this.transportationLocationList = transportationLocationsResponse.data.result;
                this.locationsList = locationsResponse.data.result;
                this.transportationUnitsList = unitsResponse.data;
              
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get transportation locations.');
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
            const location = this.locationsList.find(item => item.id === row.locationId);
            const transportationUnit = this.transportationUnitsList.find(
                item => item.id === row.transportationUnitId
            );

            const payload = {
                locationId: row.locationId,
                locationName: location?.name || row.locationName || '',
                amount: Number(row.amount),
                transportationUnitId: row.transportationUnitId,
                transportationUnitName: transportationUnit?.name || row.transportationUnitName || ''
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateTransportationLocation/', payload).then(response => {
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
                this.toastHandler('error', 'Unable to save transportation location.');
                this.isShimmerLoading = false;
            });
        },

        update(row) {
            const existing = this.transportationLocationList.find(b => b.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Transportation location was not found.');
                return;
            }

            const location = this.locationsList.find(item => item.id === row.locationId);
            const transportationUnit = this.transportationUnitsList.find(
                item => item.id === row.transportationUnitId
            );

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId,
                locationId: row.locationId,
                locationName: location?.name || row.locationName || existing.locationName,
                amount: Number(row.amount),
                transportationUnitId: row.transportationUnitId,
                transportationUnitName:
                    transportationUnit?.name || row.transportationUnitName || existing.transportationUnitName
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/UpdateTransportationLocation/', payload).then(response => {
                this.getSetupData();
                this.toastHandler('success', 'Transportation location updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update transportation location.');
            });
        },

        async delete(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(r => axios.get('/SchoolManager/DeleteTransportationLocation?id=' + r.id))
                );

                const failed = results.filter(r => r.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} transportation location(s) deleted; ${failed} failed.`
                    );
                    this.getSetupData();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} transportation location(s) deleted successfully.`
                    );
                }
            } catch (err) {
                console.error('Failed to delete transportation locations:', err);
                this.toastHandler('error', 'Failed to delete transportation locations.');
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