const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            payload: {},
            customerList: [],
            customerGroupList: [],
            accountNumber: '',
            customerGroupId: '',
            statusList: [
                {id: 'a3b4c2f9-8e4d-4e79-b6b9-2d8c6b80b5fc', name: 'Active'},
                {id: '6d1d2b1e-6c5e-4f31-9c3d-945d7f6e2a34', name: 'Inactive'},
                {id: 'f28e71d1-63c9-4070-b7cb-2e5ce2cbe4a1', name: 'Dormant'},
            ],
            currencyList: [],
            statusId: '',
            address: '',
            balance: 0.00,
            vatNumber: '',
            vatAccountId: '',
            name: '',
            tinNumber: '',
            phoneNo: '',
            email: '',
            currencyId: '',
            creditLimit: 0.00,
            irsAccountId: '',
            irsAccountName: '',
            vatAccountName: '',
            creditAccountId: '',
            creditAccountName: '',
            selectedSupplierId: '',
            customerId: null,
            selectedCustomerGroupId: '',
            isResident: false,
            taxOffice: '',
            currencyCode: '',
            contactPerson: '',
            contactPersonPhone: '',
            contactPersonEmail: '',
            defaultCurrency: '',
            defaultStatusId: '',
            accountsList: [],
        }
    },
    methods: {
        initCustomer () {
            axios.get('/LedgerDataEntry/InitJournalEntry').then(response => {

                let accounts = response.data.accounts;

                if (!accounts || accounts.length === 0) {
                    accounts = [{
                        id: this.emptyGuid,
                        accountIdentifier: 'No Ledger Available'
                    }];
                } else {
                    accounts.forEach(v => {
                        v.accountIdentifier = `${v.accountNo} - ${v.accountName}`;
                    });
                }
                //sort accounts by accountNo
                accounts.sort((a, b) => {
                    if (a.accountNo < b.accountNo) return -1;
                    if (a.accountNo > b.accountNo) return 1;
                    return 0;
                });

                this.accountsList = accounts;
                
                $( '#creditAccountId' ).ejDropDownList({
                    dataSource: response.data.accounts,
                    width: "100%",
                    watermarkText: "Select Account",
                    fields: { id: "id", text: "accountIdentifier", value: "id" },
                    enableFilterSearch: true,
                    change: (args) => {
                        this.creditAccountId = args.value;
                    }
                });

                $( '#vatAccountId' ).ejDropDownList({
                    dataSource: response.data.accounts,
                    width: "100%",
                    watermarkText: "Select Account",
                    fields: { id: "id", text: "accountIdentifier", value: "id" },
                    enableFilterSearch: true,
                    change: (args) => {
                        this.vatAccountId = args.value;
                    }
                });

                $( '#irsAccountId' ).ejDropDownList({
                    dataSource: response.data.accounts,
                    width: "100%",
                    watermarkText: "Select Account",
                    fields: { id: "id", text: "accountIdentifier", value: "id" },
                    enableFilterSearch: true,
                    change: (args) => {
                        this.irsAccountId = args.value;
                    }
                });


            }).catch(err => {

                this.toastHandler('error', 'payment initialization failed.');

            });
        },
        getDefaultGlSetup() {

            axios.get('/LedgerSetups/GetDefaultGlSetup').then(response => {

                let responseData = response.data;

                if (responseData) {

                    this.id = responseData.id;

                    $("#creditAccountId").ejDropDownList({

                        value: responseData.accountsReceivableBankAccountId,

                    });
                    $("#vatAccountId").ejDropDownList({
                        value: responseData.vatReceivedAccountId,
                    });
                    $("#irsAccountId").ejDropDownList({
                        value: responseData.accountsReceivableBankAccountId,
                    });


                }


            }).catch(err => {

                console.log(err);

                this.toastHandler('error', 'Unable to get default GL numbers.');

            });
        },
        //puts a bracket around - numbers
        formatNumber(number) {
            if (number < 0) {
                return `(${Math.abs(number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
            }
            return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
        
        getCustomers() {
            axios.get('/SharedResource/GetCustomers')
                .then(response => {
                    this.customerList = response.data.sort((a, b) => a.name.localeCompare(b.name));
                    this.customerList.forEach(customer => {
                       customer.displayName = customer.name + ' - ' + customer.accountNumber;

                    });


                    $("#customerId").ejDropDownList({
                        dataSource: response.data,
                        watermarkText: "Select  Customer",
                        width: "100%",
                        fields: { id: "id", text: "displayName" , value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            this.customerId = args.value;
                        }
                    });
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get customers.');
                });
        },

        //get supplier details
        getCustomerDetails(id) {
            return this.customerList.find(a => a.id === id);
        },


        //get supplier groups
        getCustomerGroups() {
            axios.get('/SharedResource/GetCustomerGroups').then(response => {
                this.customerGroupList = response.data;
            }).catch(err => {
                this.toastHandler('error', 'Unable to get customer groups.');
            });
        },
        //get currency
        getCurrency() {
            axios.get('/SharedResource/GetCurrencys').then(response => {
                this.currencyList = response.data;
                const defaultCurrency = this.currencyList.find(currency =>
                    currency.currencyName === 'Ghana Cedis' || currency.currencyName === 'Ghana Cedi'
                );

                if (defaultCurrency) {
                    this.currencyId = defaultCurrency.id;
                }
                this.defaultCurrency = defaultCurrency.id;
            }).catch(err => {
                this.toastHandler('error', 'Unable to get currency.');
            });
        },
        //get status
        getStatus() {
            this.statusList = this.statusList.sort((a, b) => a.name.localeCompare(b.name));
            const defaultStatus = this.statusList.find(status =>
                status.name.toLowerCase() === 'active'
            );
            if (defaultStatus) {
                this.statusId = defaultStatus.id;
            }
            this.defaultStatusId = defaultStatus.id;
        },
       
        getCustomerGroupDetails(id) {
            return this.customerGroupList.find(a => a.id === id);
        },

        getCurrencyDetails(id) {
            return this.currencyList.find(a => a.id === id);
        },

        getStatusDetails(id) {
            return this.statusList.find(a => a.id === id);
        },

        //generateaccountnumber
        generateAccountNumber() {
            return new Promise((resolve, reject) => {
                // Fetch system numbers
                axios.get('/SharedResource/GetSystemNumbers')
                    .then(systemResponse => {
                        const systemNumbers = systemResponse.data;

                        if (systemNumbers.length > 0) {
                            const systemNumber = systemNumbers.find(sn => sn.itemName === 'ArAccountNumbers');
                            this.currentSystemNumber = systemNumber;
                            if (systemNumber) {
                                // Use system number details
                                this.accountNumber = `${systemNumber.prefix}${systemNumber.lastNo}${systemNumber.suffix}`;

                            }
                        }
                        // Fallback if no system number is found
                        const randomNum = Math.floor(100000 + Math.random() * 900000);
                        if (!this.accountNumber) {
                            this.accountNumber = `ACC-${randomNum}/AR`;
                        }

                        resolve(this.accountNumber);
                    })
                    .catch(error => {
                        console.error("Error fetching system numbers:", error);
                        const randomNum = Math.floor(100000 + Math.random() * 900000);
                        this.accountNumber = `ACC-${randomNum}/AR`;
                        resolve(this.accountNumber);
                    });
            });
        },
        
        formatDate(dateInput) {

            return moment(dateInput).format("YYYY-MM-DD");

        },

        validateAndSaveCustomer() {
            // Check if the form is valid
            if (this.$refs.customerForm.checkValidity()) {
                // Proceed with saving the supplier data
                this.saveCustomer();
            } else {
                // If form is invalid, show validation error messages
                this.$refs.customerForm.reportValidity();
            }
        },

        //save supplier
        async saveCustomer() {
            this.isLoading = true;
            let payload = {};
            if (!this.accountNumber) {
                await this.generateAccountNumber();
            }
            payload.accountNumber = this.accountNumber;
            payload.vatNumber = this.vatNumber;
            payload.balance = this.balance;
            payload.tinNumber = this.tinNumber;
            payload.name = this.name;
            payload.email = this.email;
            payload.phoneNo = this.phoneNo;
            payload.address = this.address;
            payload.creditLimit = this.creditLimit;
            payload.address = this.address;
            payload.contactPerson = this.contactPerson;
            payload.contactPersonPhone = this.contactPersonPhone;
            payload.contactPersonEmail = this.contactPersonEmail;
            if (this.currencyId) {
                let currencyInfo = this.getCurrencyDetails(this.currencyId);
                if (currencyInfo) {
                    payload.currencyId = currencyInfo.id;
                    payload.currencyName = currencyInfo.currencyName;
                    payload.currencyCode = currencyInfo.currencyCode;
                    payload.buyingRate = currencyInfo.buyRate;
                    payload.sellingRate = currencyInfo.sellRate;
                }
                else {
                    payload.currencyId = this.emptyGuid;
                }
            }
           
            if(this.customerGroupId) {
                let customerGroupInfo = this.getCustomerGroupDetails(this.customerGroupId);
                if (customerGroupInfo) {
                    payload.customerGroupId = customerGroupInfo.id;
                    payload.customerGroupName = customerGroupInfo.name;
                }
                else {
                    payload.customerGroupId = this.emptyGuid;
                }
            }
            if (this.creditAccountId) {
                let creditAccount = this.accountsList.find(a => a.id === this.creditAccountId);
                if (creditAccount) {
                    payload.creditAccountId = creditAccount.id;
                    payload.creditAccountName = creditAccount.accountIdentifier;
                }
                else{
                    payload.creditAccountId = this.emptyGuid;
                    payload.creditAccountName = 'No Ledger Available';
                }
            }
            if (this.vatAccountId) {
                let vatAccount = this.accountsList.find(a => a.id === this.vatAccountId);
                if (vatAccount) {
                    payload.vatAccountId = vatAccount.id;
                    payload.vatAccountName = vatAccount.accountIdentifier;
                }
                else{
                    payload.vatAccountId = this.emptyGuid;
                    payload.vatAccountName = 'No Ledger Available';
                }
            }
            if (this.irsAccountId) {
                let irsAccount = this.accountsList.find(a => a.id === this.irsAccountId);
                if (irsAccount) {
                    payload.irsAccountId = irsAccount.id;
                    payload.irsAccountName = irsAccount.accountIdentifier;
                }
                else{
                    payload.irsAccountId = this.emptyGuid;
                    payload.irsAccountName = 'No Ledger Available';
                }
            }
            if(this.statusId) {
                let statusInfo = this.getStatusDetails(this.statusId);
                if (statusInfo) {
                    payload.StatusId = statusInfo.id;
                    payload.Status = statusInfo.name;
                }
            }
            if (!payload.statusId || !payload.status) {
                payload.statusId = this.defaultStatusId;
                payload.status = this.statusList.find(status => status.id === this.defaultStatusId).name;
            }
            if (this.customerId){
                payload.id = this.customerId;
                payload.tenantId = this.tenantId;
                axios.post('/SharedResource/UpdateCustomer', payload).then(response => {
                    this.toastHandler('', 'Customer info updated.');
                    this.isLoading = false;
                    this.clearForm();
                    this.getCustomers();
                });
            }
            else {
                axios.post('/SharedResource/CreateCustomer', payload).then(response => {
                    if (response.data.code === 200) {

                        this.toastHandler('', 'Customer data saved.');

                        this.clearForm();

                        this.getCustomers();

                    }
                    // Update system numbers only if saving was successful
                    if (this.currentSystemNumber) {
                        this.currentSystemNumber.lastNo += 1;
                        axios.post('/SharedResource/UpdateSystemNumber', this.currentSystemNumber)
                            .then(() => {
                                console.log('System number updated successfully.');
                            })
                            .catch(err => {
                                console.error('Failed to update system number:', err);
                            });
                    }
                    else {

                        this.toastHandler('warning', response.data.message);

                    }

                    this.isLoading = false;
                }).catch(err => {
                    this.toastHandler('error', 'Unable to save Customer.');
                    this.isLoading = false;

                });
            }

        },
        setCurrentCustomer() {
            let customerInfo = this.getCustomerDetails(this.customerId);
            if (customerInfo) {
                this.accountNumber = customerInfo.accountNumber;
                this.balance = parseFloat(customerInfo.balance).toFixed(2);
                this.tinNumber =customerInfo.tinNumber;
                this.vatNumber = customerInfo.vatNumber;
                this.name = customerInfo.name;
                this.email = customerInfo.email;
                this.phoneNo = customerInfo.phoneNo;
                this.address = customerInfo.address;
                this.creditLimit = parseFloat(customerInfo.creditLimit).toFixed(2);
                this.currencyId = customerInfo.currencyId;
                this.customerGroupId = customerInfo.customerGroupId;
                this.customerGroupName = customerInfo.customerGroupName;
                this.statusId = customerInfo.statusId;
                this.status = customerInfo.status;
                this.currencyCode = customerInfo.currencyCode;
                this.contactPerson = customerInfo.contactPerson;
                this.contactPersonPhone = customerInfo.contactPersonPhone;
                this.contactPersonEmail = customerInfo.contactPersonEmail;
                this.customerId = customerInfo.id;
                this.tenantId = customerInfo.tenantId;
                $("#customerId").ejDropDownList({value: customerInfo.id});
             
                if (customerInfo.creditAccountId) {
                    this.creditAccountId = customerInfo.creditAccountId;
                    this.creditAccountName = customerInfo.creditAccountName;
                    $("#creditAccountId").ejDropDownList({ value: customerInfo.creditAccountId });
                }
                if (customerInfo.vatAccountId) {
                    this.vatAccountId = customerInfo.vatAccountId;
                    this.vatAccountName = customerInfo.vatAccountName;
                    $("#vatAccountId").ejDropDownList({ value: customerInfo.vatAccountId });
                }
                if (customerInfo.irsAccountId) {
                    this.irsAccountId = customerInfo.irsAccountId;
                    this.irsAccountName = customerInfo.irsAccountName;
                    $("#irsAccountId").ejDropDownList({ value: customerInfo.irsAccountId });
                }
            }
        },


        delCustomer(id) {

            axios.get('/SharedResource/DelCustomer?id=' + id).then(response => {

                this.getCustomers();

                this.toastHandler('', 'Customer info deleted.');


            }).catch(err => {

                this.toastHandler('error', 'Unable to delete customer.');

            });
        },

        clearForm() {
            window.location.reload();
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

        },,

    },
    watch: {
        customerId(val) {

            if (val) {

                this.setCurrentCustomer();

            }

        },

    },
    mounted(){
        this.initCustomer();
        this.getCustomers();
        this.getCustomerGroups();
        this.getStatus();
        this.getCurrency();
        this.getDefaultGlSetup();
    },

});
app.mount('#app');
     
    