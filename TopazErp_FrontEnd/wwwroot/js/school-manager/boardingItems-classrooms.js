const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            boardingItemList: [],
            classRoomList: [],
            theme: '#062a81'
        };
    },

    computed: {
        boardingItemColumns() {
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
                    label: 'Boarding Item',
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

        classRoomColumns() {
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
                    label: 'Class Room',
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
        }
    },

    methods: {
        getSetupData() {
            this.isShimmerLoading = true;

            Promise.all([
                axios.get('/SchoolManager/GetBoardingItems/'),
                axios.get('/SchoolManager/GetClassRooms/')
            ]).then(([boardingItemsResponse, classRoomsResponse]) => {
                this.boardingItemList = boardingItemsResponse.data.result;
                this.classRoomList = classRoomsResponse.data.result;
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to get boarding items or class rooms.');
            });
        },

        async onCreateBoardingItem(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.createBoardingItem(row);
        },

        async onUpdateBoardingItem(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.updateBoardingItem(row);
        },

        async onDeleteBoardingItem(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            await this.deleteBoardingItems(rows);
        },

        createBoardingItem(row) {
            const payload = {
                name: String(row.name || '').trim()
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateBoardingItem/', payload).then(response => {
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
                this.toastHandler('error', 'Unable to save boarding item.');
                this.isShimmerLoading = false;
            });
        },

        updateBoardingItem(row) {
            const existing = this.boardingItemList.find(item => item.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Boarding item was not found.');
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

            axios.post('/SchoolManager/UpdateBoardingItem/', payload).then(response => {
                this.getSetupData();
                this.toastHandler('success', 'Boarding item updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update boarding item.');
            });
        },

        async deleteBoardingItems(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(row =>
                        axios.get('/SchoolManager/DeleteBoardingItem?id=' + row.id)
                    )
                );

                const failed = results.filter(result => result.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} boarding item(s) deleted; ${failed} failed.`
                    );
                    this.getSetupData();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} boarding item(s) deleted successfully.`
                    );
                }
            } catch (err) {
                console.error('Failed to delete boarding items:', err);
                this.toastHandler('error', 'Failed to delete boarding items.');
                this.getSetupData();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onCreateClassRoom(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.createClassRoom(row);
        },

        async onUpdateClassRoom(event) {
            const row = event?.row || event?.data;
            if (!row) return;

            this.updateClassRoom(row);
        },

        async onDeleteClassRoom(event) {
            const rows = event?.rows;
            if (!Array.isArray(rows) || !rows.length) return;

            await this.deleteClassRooms(rows);
        },

        createClassRoom(row) {
            const payload = {
                name: String(row.name || '').trim()
            };

            this.isShimmerLoading = true;

            axios.post('/SchoolManager/CreateClassRoom/', payload).then(response => {
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
                this.toastHandler('error', 'Unable to save class room.');
                this.isShimmerLoading = false;
            });
        },

        updateClassRoom(row) {
            const existing = this.classRoomList.find(item => item.id === row.id);
            if (!existing) {
                this.toastHandler('error', 'Class room was not found.');
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

            axios.post('/SchoolManager/UpdateClassRoom/', payload).then(response => {
                this.getSetupData();
                this.toastHandler('success', 'Class room updated.');
                this.isShimmerLoading = false;
            }).catch(err => {
                this.isShimmerLoading = false;
                this.toastHandler('error', 'Unable to update class room.');
            });
        },

        async deleteClassRooms(rows) {
            this.isShimmerLoading = true;

            try {
                const results = await Promise.allSettled(
                    rows.map(row =>
                        axios.get('/SchoolManager/DeleteClassRoom?id=' + row.id)
                    )
                );

                const failed = results.filter(result => result.status === 'rejected').length;

                if (failed) {
                    this.toastHandler(
                        'warning',
                        `${rows.length - failed} class room(s) deleted; ${failed} failed.`
                    );
                    this.getSetupData();
                } else {
                    this.toastHandler(
                        'success',
                        `${rows.length} class room(s) deleted successfully.`
                    );
                }
            } catch (err) {
                console.error('Failed to delete class rooms:', err);
                this.toastHandler('error', 'Failed to delete class rooms.');
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