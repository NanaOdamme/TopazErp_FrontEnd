const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,
            payload: {},
            supplierList: [],
            supplierId: '',
            openingBalanceList: [],
            amount: '0.00',
            paidAmount: '0',
            balance: '0',
            isPosted: false,
            openingBalanceId: null,
            currencyList: [],
            currencyId: '',
            ouList: [],
            ouId: '',
            costCenterHierachyList: [],
            costCenterList: [],
            ouNameList: [],
            paymentAmount: '0',
            paymentDate: moment().format("YYYY-MM-DD"),
            postedopeningBalanceId: '',
            postedOpeningBalanceList: [],
            tenantId: '',
            departmentId: '',
            departmentList: [],
            selectedBalanceList: [],
            buyRate: '',
            defaultCurrency: '',
            transactionDate: moment().format("YYYY-MM-DD"),
            accountNumber: '',
            isOu: true,
        }
    },
    methods: {
        getBusinessProfile() {
            axios.get('/SharedResource/GetBusinessProfile').then(response => {
                if (response.data) {
                    //  this.isOu = response.data.enforceOu;
                    console.log(this.isVatInclusive);
                }
            }).catch(err => {
                console.log(err);
            });
        },
        getOpeningBalances() {
            axios.get('/ApDataEntry/GetOpeningBalances/')
                .then(response => {
                    this.openingBalanceList = response.data.filter(a => a.isPosted === false);

                    this.openingBalanceList.forEach(item => {
                        item.transactionDate = this.formatDate(item.transactionDate);
                        item.displayText = `${item.supplierName} - ${item.currencyName}`;
                    });
                    this.renderTable(this.openingBalanceList);
                    $("#openingBalanceId").ejDropDownList({
                        dataSource: this.openingBalanceList,
                        watermarkText: "Select Supplier",
                        width: "100%",
                        fields: {id: "id", text: "displayText", value: "id"},
                        enableFilterSearch: true,
                        change: (args) => {
                            this.openingBalanceId = args.value;
                        }
                    });
                })
                .catch(error => {
                    console.log(error);
                    this.isLoading = false;
                });
        },
        //get opening balance details
        getOpeningBalanceDetails(id) {
            return this.openingBalanceList.find(a => a.id === id);
        },
        //get suppliers
        getSuppliers() {
            axios.get('/SharedResource/GetSuppliers')
                .then(response => {
                    this.supplierList = response.data.sort((a, b) => a.name.localeCompare(b.name)).filter(a => a.statusName.trim().toLowerCase() === 'active');

                    $("#supplierId").ejDropDownList({
                        dataSource: response.data,
                        watermarkText: "Select Supplier",
                        width: "100%",
                        fields: { id: "id", text: "name", value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            this.supplierId = args.value;
                        }
                    });
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get suppliers.');
                });
        },

        //get supplier details
        getSupplierDetails(id) {
            return this.supplierList.find(a => a.id === id);
        },


        //get currency
        getCurrency() {
            axios.get('/SharedResource/GetCurrencys').then(response => {
                this.currencyList = response.data;

                this.defaultCurrency = this.currencyList.find(currency => {
                    const name = currency.currencyName.trim().toLowerCase();
                    return name === 'ghana cedis' || name === 'ghana cedi';
                });

                if (this.defaultCurrency) {
                    this.currencyId = this.defaultCurrency.id;
                    this.buyRate = parseFloat(this.defaultCurrency.buyRate).toFixed(4);
                }
                $('#currencyId').ejDropDownList({
                    dataSource: this.currencyList,
                    width: "100%",
                    watermarkText: "Select Currency",
                    fields: { id: "id", text: "currencyName", value: "id" },
                    enableFilterSearch: true,
                    value: this.currencyId,
                    change: (args) => {
                        this.currencyId = args.value;
                    }
                });
            }).catch(err => {
                this.toastHandler('error', 'Unable to get currency.');
            });
        },

        parseCostCenterHierachy(dataArr) {

            this.ouList = dataArr;

            let costCenterHierachyList = [];

            for (let i = 0; i < this.costCenterList.length; i++) {

                this.getHierachyName(this.costCenterList[i].id);

                let name = [...new Set(this.ouNameList)].join().replace(/,/g, '/');

                costCenterHierachyList.push({
                    name: name,
                    parentId: this.costCenterList[i].parentId,
                    id: this.costCenterList[i].id,
                    rawName: this.costCenterList[i].name,
                    tenantId: this.costCenterList[i].tenantId,
                });

                name = [];

                this.ouNameList = [];

            }

            return costCenterHierachyList;

        },
        getHierachyName(id) {

            let parentId;
            let returnName;

            this.costCenterList.forEach(item => {

                if (item.id === id) {
                    parentId = item.parentId;
                    returnName = item.name;
                }

                this.costCenterList.forEach(cc => {
                    if (cc.id === parentId) {
                        return (`${this.getHierachyName(parentId)} / ${returnName}`);
                    }
                })

            });

            this.ouNameList.push(returnName);

        },
        getCostCenters() {
            axios.get('/SharedResource/GetCostCenters/').then(response => {

                this.costCenterList = response.data;

                const parsed = this.parseCostCenterHierachy(response.data);
                this.costCenterHierachyList = parsed;

                console.log("📦 Final Dropdown Data:", this.costCenterHierachyList);

                $("#ouId").ejDropDownList({
                    dataSource: this.costCenterHierachyList,
                    width: "100%",
                    watermarkText: "Select OU/Cost Center",
                    fields: { id: "id", text: "name", value: "id" },
                    enableFilterSearch: true,
                    change: (args) => {
                        this.ouId = args.value;
                    }
                });

            }).catch(err => {
                console.log(err);
                this.toastHandler('error', 'Unable to get cost centers.');
            });
        },


        getOuDetails(id) {

            return this.costCenterHierachyList.find(a => a.id === id);
        },
        getCurrencyDetails(id) {
            return this.currencyList.find(a => a.id === id);
        },
        
        getHeriechy(){
            axios.get('/ApDataEntry/GetOuHierarchy/').then(response => {
                this.ouList = response.data;
            }).catch(err => {
                this.toastHandler('error', 'Unable to get OU Heriechy.');
            });
        },
     
        saveOpeningBalance() {
            this.isLoading = true;
            let payload = {};
            payload.amount = this.amount;
            payload.transactionDate = this.transactionDate;
            payload.isPosted = this.isPosted;
            if (this.currencyId) {
                let currencyInfo = this.getCurrencyDetails(this.currencyId);
                if (currencyInfo) {
                    payload.currencyId = currencyInfo.id;
                    payload.currencyName = currencyInfo.currencyName;
                    payload.currencyCode = currencyInfo.currencyCode;
                    payload.buyRate = this.buyRate;
                    payload.sellRate = currencyInfo.sellRate;
                }
            }
            if (this.supplierId) {
                let supplierInfo = this.getSupplierDetails(this.supplierId);
                if (supplierInfo) {
                    payload.supplierId = supplierInfo.id;
                    payload.supplierName = supplierInfo.name;
                    payload.accountNumber = supplierInfo.accountNumber;
                }
            }
            if (this.ouId) {
                let ouInfo = this.getOuDetails(this.ouId);
                if (ouInfo) {
                    payload.ouId = ouInfo.id;
                    payload.ouName = ouInfo.name;
                }
            }
            else{
                payload.ouId = this.emptyGuid;
                payload.ouName = 'N/A';
            }
            
                axios.post('/ApDataEntry/CreateOpeningBalances', payload).then(response => {
                    if (response.data.code === 200) {
                        this.toastHandler('', 'Supplier data saved.');
                        this.openingBalanceId = response.data.id;
                        this.getOpeningBalances()
                        window.location.href = `/ApDataEntry/OpeningBalances/`;
                    } else {
                        this.toastHandler('warning', response.data.message);
                        return
                    }
                    this.isLoading = false;
                  
                }).catch(err => {
                    this.toastHandler('error', 'Unable to save Opening Balance info.');
                    this.isLoading = false;
                });

        },

        //formatdate
        formatDate(dateInput) {

            return moment(dateInput).format("DD-MMM-YYYY");
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
        clearForm() {
            window.location.reload();
        },

    },
    watch: {
        currencyId(val) {
            let currencyInfo = this.getCurrencyDetails(val)
            this.buyRate = parseFloat(currencyInfo.buyRate).toFixed(4);
        }
    },
    mounted(){
        this.getOpeningBalances();
        this.getSuppliers();
        this.getCurrency();
        this.getCostCenters();
        this.getBusinessProfile();
        this.getHeriechy();
    },

});
app.mount('#app')
    