const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,
            payload: {},
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            invoiceList: [],
            invoiceId: '',
            detailsList: [],
            supplierList: [],
            supplierId : '',
            supplierName: '',
            accountNumber: '',
            invoiceNumber: '',
            invoiceDate: moment().format("YYYY-MM-DD"),
            projectedPayDate: moment(this.invoiceDate).add(1, 'months').format("YYYY-MM-DD"),
            balance: '0',
            purchaseOrderNumber: '',
            currencyList: [],
            currencyId: '',
            totalInvoiceAmount: '0',
            amount: '0',
            referenceNumber: '',
            description: '',
            isVatWithheld: false,
            unitPrice: '0',
            quantity: '0',
            subTotal: ' 0',
            ouId: '',
            ouList: [],
            ouName: '',
            departmentHierachyList: [],
            ouNameList: [],
            debitAccountList: [],
            debitAccountId: '',
            date: moment().format("YYYY-MM-DD"),
            address: '',
            voucherNumber: '',
            batchNumber:'',
            discountAsPercentage: false,
            discount: '0',
            departments: [],
            debitAccountName:'',
            invoiceDetailId: '',
            taxLevyList: [],
            vatId: '',
            vatName: 'None',
            vatList: [],
            vatRate:'15',
            vatIsApplied: false,
            selectedInvoiceList: [], 
        }
       
    },
    methods:{
        getSelectedInvoices() {

            let obj = $("#dataTable").ejGrid("instance"), rec = []; this.selectedInvoiceList = [];
            let check = obj.checkSelectedRowsIndexes; 
            if (check.length) {
                for (let pageInx = 0; pageInx < check.length; pageInx++) {
                    if (!ej.isNullOrUndefined(check[pageInx]))
                        rec = this.getRecords(pageInx, check[pageInx], obj, rec);
                }
            }

            this.selectedInvoiceList = rec;

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
        getGridData() {
            axios.get('/ApDataEntry/GetInvoices').then(response => {
                this.invoiceList = response.data.filter((invoice) => {
                    return  invoice.isCanceled === false && invoice.invoiceDetails.length > 0 && !invoice.isApproved && invoice.totalInvoiceAmount === invoice.balance;
                });
                this.detailsList = [];
                this.invoiceDetailsMap = {};
                this.invoiceList.forEach((invoice) => {
                    invoice.invoiceId = invoice.id;
                    invoice.invoiceDate = this.formatDate(invoice.invoiceDate);
                    invoice.projectedPayDate = this.formatDate(invoice.projectedPayDate);

                    this.invoiceDetailsMap[invoice.id] = invoice.invoiceDetails.map((detail) => {
                        detail.invoiceId = invoice.id;
                        this.detailsList.push(detail);
                        return detail;
                    });
                });
                //sort by invoice number
                this.invoiceList.sort((a, b) => {
                    return a.invoiceNumber.localeCompare(b.invoiceNumber);
                });
                this.dataTable(this.invoiceList);

            }).catch(err => {
                this.toastHandler('error', 'Unable to get invoices.');
            });
        },
        dataTable(responseData) {
            $("#dataTable").ejGrid({
                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Search] },
                childGrid: {
                    dataSource: this.detailsList,
                    queryString: "invoiceId",
                    allowPaging: true,
                    allowSorting: true,
                    isResponsive: true,
                    pageSettings: { pageSize: 10 },
                    toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Search] },
                    columns: [
                        { field: "id", headerText: 'Id', visible: false, isPrimaryKey: true, width: 80 },
                        { field: "invoiceId", headerText: 'Invoice Id', visible: false, width: 80 },
                        { field: "referenceNumber", headerText: 'Ref No', textAlign: ej.TextAlign.Left, width: 60 },
                        { field: "description", headerText: "Description", width: 80},
                        {field: "debitAccountName", headerText: "Debit G/L", width: 80, textAlign: ej.TextAlign.Left},
                        { field: "quantity", headerText: "Quantity", width: 65, format: "{0:n2}"},
                        { field: "unitPrice", headerText: "Unit Price", width: 80, format: "{0:n2}"},
                        { field: "discount", headerText: "Disc. %", width: 65, format: "{0:n2}"},
                        { field: "amount", headerText: "Disc. Amt.", width: 65, format: "{0:n2}"},
                        { field: "subTotal", headerText: "Sub Total",width: 80, format: "{0:n2}" },


                    ],
                },
                columns: [
                    { field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true },
                    { type: "checkbox", width: 20, },
                    {field: "isPosted", headerText: "Posted", width: 35, type: "boolean",},
                    { field: "supplierName", headerText: "Supplier", textAlign: ej.TextAlign.Left, width: 75 },
                    { field: "invoiceNumber", headerText: "Invoice Number", textAlign: ej.TextAlign.Left, width: 75 },
                    { field: "currencyName", headerText: "Currency", textAlign: ej.TextAlign.Left, width: 75 },
                    { field: "totalInvoiceAmount", headerText: "Total Amount", width: 80, format: "{0:n2}" },
                    { field: "balance", headerText: "Balance", width: 80, format: "{0:n2}" },
                    {field: "liabilityAccountName", headerText: "Liability G/L", width: 80, textAlign: ej.TextAlign.Left},
                    { field: "voucherNumber", headerText: "Voucher No.", width: 65 },
                    { field: "invoiceDate", headerText: "Invoice Date", width: 75, format: "{0:yyyy-MM-dd}" },
                    { field: "projectedPayDate", headerText: "Projected Pay Date", width: 75, format: "{0:yyyy-MM-dd}" },
                    { field: "tenantId", visible: false, headerText: "Tenant Id", width: 15 }
                ],
            });
        },
        ApproveInvoice: function () {
            this.getSelectedInvoices();
            let payload = {};

            if (!this.selectedInvoiceList.length) {
                this.toastHandler('warning', 'Select an invoice to post.');
                return;
            }

            this.isLoading = true;
            payload.invoiceIds = this.selectedInvoiceList.map(a => a.id);

            axios.post('/ApDataEntry/InvoiceApproval', payload)
                .then(response => {
                    if (response.data.code === 200) {
                        this.toastHandler('', response.data.message);
                        this.getGridData();
                    } else {
                        this.toastHandler('warning', response.data.message);
                    }
                    this.isLoading = false;
                    $('#addEdit').modal('hide');
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to post invoice.');
                    this.isLoading = false;
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
    mounted() {

        this.getGridData();

    }
});
app.mount('#app');