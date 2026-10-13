const app = Vue.createApp({
    data() {
        return {
            emptyGuid: '00000000-0000-0000-0000-000000000000',
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
            balanceId: window.balanceId,
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
                    this.openingBalanceList = response.data.filter(a => a.isPosted === false && a.id === this.balanceId);
                    this.openingBalanceList.forEach(item => {
                        item.transactionDate = this.formatDate(item.transactionDate);
                    });
                    this.setCurrentOpeningBalance(this.balanceId);
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
                    this.supplierList = response.data
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .filter(a => a.statusName.trim().toLowerCase() === 'active');

                    $("#supplierId").ejDropDownList({
                        dataSource: this.supplierList,
                        watermarkText: "Select Supplier",
                        width: "100%",
                        fields: { id: "id", text: "name", value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            this.supplierId = args.value;
                        }
                    });

                 
                    if (this.supplierId) {
                        $("#supplierId").ejDropDownList("option", "value", this.supplierId);
                    }
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

                this.defaultCurrency = this.currencyList.find(c =>
                    c.currencyName.trim().toLowerCase() === 'ghana cedis' ||
                    c.currencyName.trim().toLowerCase() === 'ghana cedi'
                );

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
                    change: (args) => { this.currencyId = args.value; }
                });

                if (this.currencyId) {
                    $('#currencyId').ejDropDownList("option", "value", this.currencyId);
                }
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
        updateOpeningBalance() {
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
            
                payload.id = this.balanceId;
                payload.tenantId = this.tenantId;
                axios.post('/ApDataEntry/UpdateOpeningBalances', payload).then(response => {
                    this.toastHandler('', 'Opening Balance info updated.');
                    this.isLoading = false;
                    this.getOpeningBalances();
                    window.location.href = `/ApDataEntry/OpeningBalances/`;
                }).catch(err => {
                    this.toastHandler('error', 'Unable to update Opening Balance info.');
                    this.isLoading = false;
                });
        },
        setCurrentOpeningBalance(id) {
            let openingBalanceInfo = this.getOpeningBalanceDetails(this.balanceId);

            this.amount = parseFloat(openingBalanceInfo.amount).toFixed(2);
            this.transactionDate = moment(openingBalanceInfo.transactionDate).format("YYYY-MM-DD");
            this.isPosted = openingBalanceInfo.isPosted;
            this.currencyId = openingBalanceInfo.currencyId;
            this.buyRate = parseFloat(openingBalanceInfo.buyRate).toFixed(4);
            this.ouId = openingBalanceInfo.ouId;

            this.supplierId = openingBalanceInfo.supplierId;
            this.tenantId = openingBalanceInfo.tenantId;
            
            this.$nextTick(() => {
                $("#supplierId").ejDropDownList("option", "value", this.supplierId);
                $("#currencyId").ejDropDownList("option", "value", this.currencyId);
                $("#ouId").ejDropDownList("option", "value", this.ouId);
            });
        },

        printReport() {
            let supplierId = this.supplierId || '';
            let status =  'all';
            let reportUrl = `/ApReports/PrintOpeningBalance?supplierId=${supplierId}&status=${status}`;
            window.open(reportUrl, '_blank');
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

        },,
        clearForm() {
            window.location.reload();
        },

    },
    watch: {
        openingBalanceId(val) {

            if (val) {

                this.setCurrentOpeningBalance();

            }

        },
    },
   mounted(){
        this.balanceId = window.balanceId;
        this.getSuppliers();
        this.getCurrency();
        this.getCostCenters();
        this.getBusinessProfile();
        this.getHeriechy();
        this.getOpeningBalances();
    },

});
app.mount('#app')