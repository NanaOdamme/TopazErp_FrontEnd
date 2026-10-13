const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,
            openingBalanceList: [],
            isPosted: false,
            openingBalanceId: null,
            postedopeningBalanceId: '',
            postedOpeningBalanceList: [],
            selectedBalanceList: [],
        }
    },
    methods: {
        getOpeningBalances() {
            axios.get('/ApDataEntry/GetOpeningBalances/')
                .then(response => {
                    this.openingBalanceList = response.data.filter(a => a.isPosted === false);
                    this.renderTable(this.openingBalanceList);
                    this.openingBalanceList.forEach(item => {
                        item.transactionDate = this.formatDate(item.transactionDate);
                        item.displayText = `${item.supplierName} - ${item.currencyName}`;
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
        postOpeningBalance() {
            this.getSelectedBalances()
            let payload = {};
            if (!this.selectedBalanceList.length) {

                this.toastHandler('warning', 'Selected Balance post.');

                return;

            }
            this.isLoading = true;
            payload.balanceIds = this.selectedBalanceList.map(a => a.id);
            axios.post('/ApDataEntry/InitPostBalances', payload).then(response => {

                if (response.data.code == 200) {

                    this.toastHandler('', response.data.message)
                    this.getOpeningBalances();
                    $('#addEdit').modal('hide');
                } else {

                    this.toastHandler('warning', response.data.message);
                }


                this.isLoading = false;


            }).catch(err => {

                this.toastHandler('error', 'Unable to post balances.');
                this.isLoading = false;


            });
        },
        getSelectedBalances() {

            let obj = $("#dataTable").ejGrid("instance"), rec = []; this.selectedBalanceList = [];
            let check = obj.checkSelectedRowsIndexes;  // collection which holds the page index and the selected record index
            if (check.length) {
                for (let pageInx = 0; pageInx < check.length; pageInx++) {
                    if (!ej.isNullOrUndefined(check[pageInx]))
                        rec = this.getRecords(pageInx, check[pageInx], obj, rec);
                }
            }

            this.selectedBalanceList = rec;

        },
        getRecords(pageInx, inx, proxy, rec) {

            if (inx.length) {
                for (let i = 0; i < inx.length; i++) {
                    let pageSize = proxy.model.pageSettings.pageSize;  //gets the page size of grid
                    let data = proxy.model.dataSource[pageInx * pageSize + inx[i]];
                    rec.push(data);     //pushing all the selected Records
                }
            }
            return rec;

        },
        renderTable(responseData) {

            $("#dataTable").ejGrid({

                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                toolbarSettings: {
                    showToolbar: true,
                    toolbarItems: [ ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search]
                },
                columns: [

                    {field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true,},
                    { type: "checkbox", width: 20, },
                    {field: "supplierName", headerText: "Supplier", width: 65},
                    {field: "currencyName", headerText: "Currency", width: 65},
                    {field: "buyRate", headerText: "Buy Rate", width: 65, format: "{0:n4}"},
                    {field: "amount", headerText: "Amount", width: 65, format: "{0:n2}"},
                    {field: "ouName", headerText: "OU/Cost Centers", width: 65},
                    {field: "transactionDate", headerText: "Transaction Date", width: 65},
                    {field: "isPosted", headerText: "Is Posted", width: 65},
                    {field: "tenantId", visible: false, headerText: "tenantId", width: 15,},
                ],
            });

        },
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

    },
    mounted(){
        this.getOpeningBalances();
    },

});
app.mount('#app');
    