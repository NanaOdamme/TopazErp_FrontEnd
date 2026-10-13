const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            theme: '#0645e7',
            bankList: [],
            bankBranchList: [],
            bankColumns : [
                { key:'id',         label:'ID',         type:'text', hidden:true,   width:74, help:'Auto-filled, but you can change it' },
                { key:'name',       label:'Name',     type:'avatar',   width:250, minWidth:250, required:true, searchable:true, subtitleKey:'email' },
                { key:'contactPerson',      label:'Contact Person',      type:'text',    width:230, searchable:true,},
                { key:'email',      label:'Email',      type:'email',    width:250,  required:true, searchable:true,},
                { key:'contactNo',       label:'Contact No',       type:'text',  width:150, searchable:true, },
                { key:'bankCode', label:'Bank Code', type:'text',  width:120, searchable:true, },
                { key:'tenantId',      label:'Tenant',      type:'number', hidden:true, minWidth:74 }
            ],
            childSchema : { },
            branchCol : {
                key:'bankBranches', title:'Branch',
                columns: [
        { key:'id',         label:'ID',         type:'text', hidden:true,   width:74, help:'Auto-filled, but you can change it' },
        { key:'bankId',         label:'Bank ID',  hidden:true, type:'text', },
        { key:'name',       label:'Name',     type:'avatar',   width:250, minWidth:250, required:true, searchable:true, subtitleKey:'email' },
        { key:'contactPerson',      label:'Contact Person',      type:'text',    width:230, searchable:true,},
        { key:'email',      label:'Email',      type:'email',    width:250,  required:true, searchable:true,},
        { key:'contactNo',       label:'Contact No',       type:'text',  width:150, searchable:true, },
    ]
            },
               
           
        }
    },

    methods: {
       

        // Create a unique mock ID
        generateId(prefix = 'BANK') {
            return `${prefix}-${Date.now()}-${Math.floor(
                Math.random() * 1000
            )}`;
        },

        // Basic validation before simulating requests
        validateRecord(row) {
            if (!row.name || !row.name.trim()) {
                this.toastHandler('Name is required.', 'warning');
                return false;
            }

            if (!row.email || !row.email.trim()) {
                this.toastHandler('Email is required.', 'warning');
                return false;
            }

            return true;
        },

        // CREATE
        async onCreate(event) {
            try {
                const row = event?.row;

                if (!row || !this.validateRecord(row)) {
                    return;
                }

                // Create payload excludes ID and tenant ID.
                const {
                    id,
                    tenantId,
                    ...createPayload
                } = row;

                // Simulated request payload.
                console.log('CREATE PAYLOAD:', createPayload);

                this.isShimmerLoading = true;

                // Simulate backend assigning ID and tenant.
                const createdRecord = {
                    ...createPayload,
                    id: this.generateId('BANK'),
                    tenantId: this.currentTenantId
                };

               // this.bankList.unshift(createdRecord);

                this.toastHandler('Bank created successfully.');

                console.log('CREATED RECORD:', createdRecord);

            } catch (error) {
                console.error('Create failed:', error);
                this.toastHandler('Failed to create bank.', 'error');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        // UPDATE
        async onUpdate(event) {
            try {
                const row = event?.row;

                if (!row || !this.validateRecord(row)) {
                    return;
                }

                // Find the original record so ID and tenant ID
                // are retained even if the editor omits them.
                const existingRecord = this.bankList.find(
                    item => item.id === row.id
                );

                if (!existingRecord) {
                    this.toastHandler('Bank record was not found.', 'error');
                    return;
                }

                // ID and tenant ID are automatically included.
                const updatePayload = {
                    ...existingRecord,
                    ...row,
                    id: existingRecord.id,
                    tenantId: existingRecord.tenantId
                };

                console.log('UPDATE PAYLOAD:', updatePayload);

                this.isShimmerLoading = true;

                const index = this.bankList.findIndex(
                    item => item.id === updatePayload.id
                );

                if (index !== -1) {
                    this.bankList.splice(index, 1, {
                        ...updatePayload
                    });
                }

                this.toastHandler('Bank updated successfully.');

                console.log('UPDATED RECORD:', updatePayload);

            } catch (error) {
                console.error('Update failed:', error);
                this.toastHandler('Failed to update bank.', 'error');
            } finally {
                this.isShimmerLoading = false;
            }
        },

      
        onDelete(event) { console.info('Delete record(s)', event.rows); },
        // =========================
        // LOAD DATA
        // =========================
       /* getSetupData() {
            axios.get('http://localhost:5300/SharedResource/GetBanks', {withCredentials: true})
                .then(response => {

                    this.bankList = response.data;
                    this.bankBranchList = [];

                    this.bankList.forEach(bank => {
                        
                        bank.bankId = bank.id;
                        
                        if (bank.bankBranches && bank.bankBranches.length > 0) {
                            bank.bankBranches.forEach(branch => {
                                branch.bankId = bank.id;
                                this.bankBranchList.push(branch);

                            });
                        }

                    });
                      this.childSchema = {key:'bankBranches', title:'Branches', columns: this.branchCol}
                  //  this.renderTable(this.bankList, this.bankBranchList);

                })
                .catch(err => {
                    console.error(err);
                    this.toastHandler('error', 'Unable to get banks.');
                });
        },*/
        
        // =========================
        // BANK CRUD
        // =========================
        saveBank(payload) {

            delete payload.id;
            delete payload.tenantId;

            axios.post('http://localhost:5300/SharedResource/CreateBank', payload, {  withCredentials: true})
                .then(response => {

                    this.getSetupData();

                    if (response.data.code === 200) {
                        this.toastHandler('', 'Bank saved.');
                    } else {
                        this.toastHandler('error', response.data.message);
                    }

                })
                .catch(() => {
                    this.toastHandler('error', 'Unable to save bank.');
                });
        },

        updateBank(payload) {

            axios.post('/SharedResource/UpdateBank', payload)
                .then(() => {
                    this.getSetupData();
                    this.toastHandler('', 'Bank updated.');
                })
                .catch(() => {
                    this.toastHandler('error', 'Unable to update bank.');
                });
        },

        deleteBank(id) {

            axios.get('/SharedResource/DelBank?id=' + id)
                .then(() => {
                    this.getSetupData();
                    this.toastHandler('', 'Bank deleted.');
                })
                .catch(() => {
                    this.toastHandler('error', 'Unable to delete bank.');
                });
        },

        // =========================
        // BRANCH CRUD
        // =========================
        saveBranch(payload) {

            payload.id = this.uuid();

            axios.post('/SharedResource/CreateBankBranch', payload)
                .then(response => {

                    if (response.data.code === 200) {
                        this.toastHandler('', 'Bank Branch saved.');
                    } else {
                        this.toastHandler('error', response.data.message);
                    }

                })
                .catch(() => {
                    this.toastHandler('error', 'Unable to save bank branch.');
                });
        },

        updateBranch(payload) {

            axios.post('/SharedResource/UpdateBankBranch', payload)
                .then(() => {
                    this.toastHandler('', 'Bank Branch updated.');
                })
                .catch(() => {
                    this.toastHandler('error', 'Unable to update bank branch.');
                });
        },

        delBranch(payload) {

            axios.post('/SharedResource/DelBankBranch', payload)
                .then(() => {
                    this.toastHandler('', 'Bank Branch deleted.');
                })
                .catch(() => {
                    this.toastHandler('error', 'Unable to delete bank branch.');
                });
        },

        // =========================
        // HELPERS
        // =========================
        getBankDetails(id) {
            return this.bankList.find(b => b.id === id);
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

        },

    },

    mounted() {
     //   this.getSetupData();
    }
});
app.use(DataGridPlugin);

app.mount('#app');



