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
            supplierId: '',
            supplierName: '',
            accountNumber: '',
            invoiceNumber: '',
            paymentDate: moment().format("YYYY-MM-DD"),
            balance: '0',
            purchaseOrderNumber: '',
            currencyList: [],
            currencyId: '',
            totalInvoiceAmount: '0',
            amountToPay: '0',
            referenceNumber: '0',
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
            batchNumber: '0',
            discount: '0',
            departments: [],
            debitAccountName: '',
            invoiceEditList: [],
            chequeNumber: '',
            bankAccountId: this.emptyGuid,
            bankAccountName: '',
            bankAccountNumber: '',
            isPosted: false,
            invoiceTypeList: [],
            invoiceType: '',
            cash: true,
            cheque: false,
            paymentList: [],
            selectedInvoiceList: [],
            outstandingCreditMemo: '0',
            paymentId: '',
            modeOfPayment: 'Cash',
            isAutomatic: true,
            Automatic: true,
            Manual: false,
            selectedPaymentList: [],
            paymentIds: [],
            paymentInvoiceList: [],
            paymentInvoiceDetailsMap: {},
        }
    },
    methods:{
        getSelectedPayments() {
            let obj = $("#dataTable").ejGrid("instance"), rec = []; this.selectedPaymentList = [];
            let check = obj.checkSelectedRowsIndexes; 
            if (check.length) {
                for (let pageInx = 0; pageInx < check.length; pageInx++) {
                    if (!ej.isNullOrUndefined(check[pageInx]))
                        rec = this.getRecords(pageInx, check[pageInx], obj, rec);
                }
            }

            this.selectedPaymentList = rec;

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

        getPayments() {
            axios.get('/ApDataEntry/GetPayments/')
                .then(response => {
                   
                    this.paymentList = response.data.filter(payment => payment.isPosted === false && payment.invoiceList.length > 0 && payment.isCanceled === false);

                    this.paymentInvoiceList = [];
                    this.paymentInvoiceDetailsMap = {};
                    this.paymentList.forEach(payment => {
                        payment.paymentId = payment.id;
                        payment.paymentDate = this.formatDate(payment.paymentDate);

                        this.paymentInvoiceDetailsMap[payment.id] = payment.invoiceList.map(detail => {
                            detail.paymentId = payment.id;
                            this.paymentInvoiceList.push(detail);
                            return detail;
                        });
                    });

                    
                    this.renderTable(this.paymentList);
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get payments.');
                });
        },

        renderTable(responseData) {
            $("#dataTable").ejGrid({
                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Search] },
                childGrid: {
                    dataSource: this.paymentInvoiceList,
                    queryString: "paymentId",
                    allowPaging: true,
                    allowSorting: true,
                    isResponsive: true,
                    pageSettings: { pageSize: 10 },
                    toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                    columns: [
                        { field: "id", headerText: 'Id', visible: false, isPrimaryKey: true, width: 80 },
                        { field: "paymentId", headerText: 'Payment Id', visible: false, width: 80 },
                        { field: "supplierName", headerText: "Supplier", textAlign: ej.TextAlign.Left, width: 75 },
                        { field: "invoiceNumber", headerText: "Invoice Number", textAlign: ej.TextAlign.Left, width: 75 },
                        { field: "currencyName", headerText: "Currency", textAlign: ej.TextAlign.Left, width: 75 },
                        { field: "buyRate", headerText: "Currency Rate",format: "{0:n2}", textAlign: ej.TextAlign.Left, width: 75 },
                        { field: "totalInvoiceAmount", headerText: "Total Amount", width: 80, format: "{0:n2}" },
                        { field: "balance", headerText: "Balance", width: 80, format: "{0:n2}" },
                        { field: "batchNumber", headerText: "Batch N0.", width: 65 },
                        { field: "voucherNumber", headerText: "Voucher No.", width: 65 },
                    ],
                },
                columns: [
                    { field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true },
                    { type: "checkbox", width: 20, },
                    { field: "supplierName", headerText: "Supplier", textAlign: ej.TextAlign.Left, width: 75 },
                    {field: "currencyName", headerText: "Currency",  width: 75 },
                    {field: "bankAccountName", headerText: "Bank G/L", width: 80, textAlign: ej.TextAlign.Left},
                    { field: "amountToPay", headerText: "Amount", width: 65, format: "{0:n2}" },
                    { field: "paymentDate", headerText: "Payment Date", width: 75, format: "{0:yyyy-MM-dd}"},
                    { field: "referenceNumber", headerText: "Reference Number", width: 75 },
                    { field: "batchNumber", headerText: "Batch Number", width: 75 },
                    { field: "modeOfPayment", headerText: "Mode of Payment", width: 75 },
                    { field: "tenantId", visible: false, headerText: "Tenant Id", width: 15 },
                    {field: "accountNumber", headerText: "accountNumber",  width: 75, visible: false },
                    {field: "referenceNumber", headerText: "referenceNumber",  width: 75, visible: false },
                    {field: "referenceNumber", headerText: "referenceNumber",  width: 75, visible: false },
                    {field: "invoiceList", headerText: "invoiceList",  width: 75, visible: false },
                ]

            });
        },
        postPayment() {
            this.getSelectedPayments();

            // Check if any payment is selected
            if (!this.selectedPaymentList.length) {
                this.toastHandler('warning', 'Please select an invoice to post.');
                return;
            }

            this.isLoading = true;

            let payload = {
                paymentIds: this.selectedPaymentList.map(a => a.id)
            };

            axios.post('/ApDataEntry/InitPostPayment', payload)
                .then(response => {
                    if (response.data.code === 200) {
                        this.toastHandler('', response.data.message);
                        this.getPayments();
                    } else {
                        this.toastHandler('warning', response.data.message);
                    }
                    this.isLoading = false;
                    $('#addEdit').modal('hide');
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to post payment.');
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

        },,
    },
   
    
    mounted() {
        
        this.getPayments();
    }
});
app.mount('#app');