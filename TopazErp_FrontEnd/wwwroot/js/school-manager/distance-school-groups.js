const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            schoolGroupList: [],
            staffList: [],
            distanceGroupList: [],
            distanceUnitList: [],
            theme: '#062a81',
          
        };
    },
    computed:{
        schoolGroupColumns() {
            return [
                {key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false},
                {
                    key: 'name',
                    label: 'School Group',
                    type: 'text',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: '250'
                },
                {
                    key: 'staffId',
                    label: 'Head',
                    type: 'select',
                    options: this.staffList,
                    display: 'staffName',
                    value: 'id',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: 220
                },
                {
                    key: 'staffName',
                    label: 'Staff Name',
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

        distanceGroupColumns(){
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
                    key: 'description',
                    label: 'Description',
                    type: 'text',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: '250'
                },
                {
                    key: 'distanceUnitId',
                    label: 'Distance Unit',
                    type: 'select',
                    options: this.distanceUnitList,
                    display: 'unitName',
                    value: 'id',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: 220
                },
                {
                    key: 'distanceUnitName',
                    label: 'Distance Unit Name',
                    type: 'text',
                    hidden: true,
                    editable: false,
                    searchable: false
                },
                {
                    key: 'distanceFrom',
                    label: 'Distance From',
                    type: 'number',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: 150
                },
                {
                    key: 'distanceTo',
                    label: 'Distance To',
                    type: 'number',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: 150
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
                axios.get('/SchoolManager/GetSchoolGroups/'),
                axios.get('/SchoolManager/GetStaffBios/'),
                axios.get('/SchoolManager/GetDistanceGroups/'),
                axios.get(`/JsonDataSample/distanceUnits.json?v=${new Date().getTime()}`)
            ]).then(([schoolGroupsResponse, staffResponse, distanceGroupsResponse, distanceUnitsResponse]) => {
                this.schoolGroupList = schoolGroupsResponse.data.result;
                this.staffList = staffResponse.data.result;

                this.staffList.forEach(staff => {
                    staff.staffName = [
                        staff.lastName,
                        staff.firstName,
                        staff.otherName
                    ].filter(name => name && name.trim()).join(' ');
                });
                this.staffList.sort((a, b) =>
                    a.staffName.localeCompare(b.staffName, undefined, { sensitivity: 'base' })
                );
                this.distanceGroupList = distanceGroupsResponse.data.result;
                this.distanceUnitList = distanceUnitsResponse.data;
                
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get school or distance group data.');
            });
        },

        async onCreateSchoolGroup(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.createSchoolGroup(row);
        },

        async onUpdateSchoolGroup(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.updateSchoolGroup(row);
        },

        async onDeleteSchoolGroup(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            await this.deleteSchoolGroups(rows);
        },

        createSchoolGroup(row) {
            const staff = this.staffList.find(item => item.id === row.staffId);

            const payload = {
                name: String(row.name || '').trim(),
                staffId: row.staffId,
                staffName: staff?.staffName || row.staffName || ''
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateSchoolGroup/', payload).then(response => {
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
                this.toastHandler('error', 'Unable to save school group.');
                this.isShimmerLoading = false;
            });
        },

        updateSchoolGroup(row) {
            const existing = this.schoolGroupList.find(item => item.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'School group was not found.');
                return;
            }

            const staff = this.staffList.find(item => item.id === row.staffId);

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId,
                name: String(row.name || '').trim(),
                staffId: row.staffId,
                staffName: staff?.staffName || row.staffName || existing.staffName
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/UpdateSchoolGroup/', payload).then(response => {
                this.getSetupData();
                this.toastHandler('success', 'School group updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update school group.');
            });
        },

        async deleteSchoolGroups(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(row => axios.get('/SchoolManager/DeleteSchoolGroup?id=' + row.id))
                );

                const failed = results.filter(result => result.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} school group(s) deleted; ${failed} failed.`
                    );
                    this.getSetupData();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} school group(s) deleted successfully.`
                    );
                }
            } catch (err) {
                console.error('Failed to delete school groups:', err);
                this.toastHandler('error', 'Failed to delete school groups.');
                this.getSetupData();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onCreateDistanceGroup(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.createDistanceGroup(row);
        },

        async onUpdateDistanceGroup(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.updateDistanceGroup(row);
        },

        async onDeleteDistanceGroup(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            await this.deleteDistanceGroups(rows);
        },

        createDistanceGroup(row) {
            const distanceUnit = this.distanceUnitList.find(item => item.id === row.distanceUnitId);

            const payload = {
                description: String(row.description || '').trim(),
                distanceUnitId: row.distanceUnitId,
                distanceUnitName: distanceUnit?.unitName || row.distanceUnitName || '',
                distanceFrom: Number(row.distanceFrom),
                distanceTo: Number(row.distanceTo),
                amount: Number(row.amount)
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateDistanceGroup/', payload).then(response => {
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
                this.toastHandler('error', 'Unable to save distance group.');
                this.isShimmerLoading = false;
            });
        },

        updateDistanceGroup(row) {
            const existing = this.distanceGroupList.find(item => item.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Distance group was not found.');
                return;
            }

            const distanceUnit = this.distanceUnitList.find(item => item.id === row.distanceUnitId);

            const payload = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId,
                description: String(row.description || '').trim(),
                distanceUnitId: row.distanceUnitId,
                distanceUnitName:
                    distanceUnit?.unitName || row.distanceUnitName || existing.distanceUnitName,
                distanceFrom: Number(row.distanceFrom),
                distanceTo: Number(row.distanceTo),
                amount: Number(row.amount)
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/UpdateDistanceGroup/', payload).then(response => {
                this.getSetupData();
                this.toastHandler('success', 'Distance group updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update distance group.');
            });
        },

        async deleteDistanceGroups(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(row => axios.get('/SchoolManager/DeleteDistanceGroup?id=' + row.id))
                );

                const failed = results.filter(result => result.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} distance group(s) deleted; ${failed} failed.`
                    );
                    this.getSetupData();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} distance group(s) deleted successfully.`
                    );
                }
            } catch (err) {
                console.error('Failed to delete distance groups:', err);
                this.toastHandler('error', 'Failed to delete distance groups.');
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