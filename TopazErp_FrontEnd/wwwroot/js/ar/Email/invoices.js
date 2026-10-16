const app = Vue.createApp({
    data() {
        return {
            supplierList: [],
            currencyList:[],
            isShimmerLoading: false,
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            supplierId: '',
            isLoading: false,
            invoiceId: '',
            invoiceList: [],
            pdfUrl: '',
            selectedInvoiceList: [],
            sendMultipleInvoices: true,
            theme: '#e76b06',
            suppliers : [
                { id: 'sup-001', name: 'Accra Office Supplies Ltd.', accountNumber: 'SUP-1001', address: 'Accra, Ghana' },
                { id: 'sup-002', name: 'Reliable Transport Services', accountNumber: 'SUP-1002', address: 'Tema, Ghana' },
                { id: 'sup-003', name: 'Professional IT Solutions', accountNumber: 'SUP-1003', address: 'Accra, Ghana' },
                { id: 'sup-004', name: 'Golden Coast Enterprises', accountNumber: 'SUP-1004', address: 'Ghana' }
            ],
            currencies : [
                { id: 'cur-001', name: 'GHS - Ghana Cedi', code: 'GHS', minorName: 'Pesewa', buyRate: 1, sellRate: 1 },
                { id: 'cur-002', name: 'USD - US Dollar', code: 'USD', minorName: 'Cent', buyRate: 11, sellRate: 11 },
                { id: 'cur-003', name: 'EUR - Euro', code: 'EUR', minorName: 'Cent', buyRate: 14, sellRate: 14 }
            ],
            detailColumns : {
                key:'invoiceDetails', title:'Invoice Details',
                columns: [
                    {key: 'id', label: 'ID', type: 'text', hidden: true, editable: false},
                    {key: 'referenceNumber', label: 'Ref No.', type: 'text', searchable: true},
                    {key: 'description', label: 'Description', type: 'text', required: true, searchable: true, minWidth: 190},
                    {key: 'quantity', label: 'Quantity', type: 'number', required: true, defaultValue: 1, min: 0, decimals: 2, width: 110},
                    {key: 'unitPrice', label: 'Unit Price', type: 'number', required: true, defaultValue: 0, min: 0, decimals: 2, width: 130},
                    {key: 'discountAsPercentage', label: 'Disc. as %?', type: 'boolean', defaultValue: false, width: 120},
                    {key: 'discount', label: 'Discount', type: 'number', defaultValue: 0, min: 0, decimals: 2, width: 120},
                    {key: 'amount', label: 'Disc. Amt.', type: 'number', decimals: 2, editable: false, width: 125},
                    {key: 'subTotal', label: 'Sub Total', type: 'number', decimals: 2, editable: false, width: 130}

                ]
            },
            invoiceColumns : [
                { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                { key: 'tenantId', label: 'Tenant ID', type: 'number', hidden: true, editable: false },
                { key: 'invoiceNumber', label: 'Invoice #', type: 'text', width: 150, required: true, searchable: true },
                { key: 'batchNumber', label: 'Batch #', type: 'text', width: 125, searchable: true },
                { key: 'supplierId', label: 'Supplier', type: 'select', options: this.suppliers, value: 'id', display: 'name', width: 220, required: true, searchable: true },
                { key: 'invoiceDate', label: 'Invoice Date', type: 'date', width: 130, searchable: true },
                { key: 'projectedPayDate', label: 'Projected Pay Date', type: 'date', width: 160, searchable: true },
                { key: 'currencyId', label: 'Currency', type: 'select', options: this.currencies, value: 'id', display: 'name', width: 180, searchable: true },
                { key: 'totalInvoiceAmount', label: 'Invoice Total', type: 'number', width: 145, decimals: 2, agg: 'sum' },
            ],
            
        }
    },
    methods: {
        toggleSendMultipleInvoices() {
            this.sendMultipleInvoices = !this.sendMultipleInvoices;
            this.getInvoices();
        },
        getSelectedInvoices() {

            let obj = $("#dataTable").ejGrid("instance"), rec = []; this.selectedInvoiceList = [];
            let check = obj.checkSelectedRowsIndexes;  // collection which holds the page index and the selected record index
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
        getSuppliers() {
            axios.get('/SharedResource/GetSuppliers').then(response =>
            {
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
            }).catch(err =>
            {
                this.toastHandler('error', 'Unable to get suppliers.');
            });
        },
        formatDate(dateInput) {

            return moment(dateInput).format("DD-MMM-YYYY");
        },
        getInvoices() {
            return axios.get('/ApDataEntry/GetInvoices').then(response =>
            {
                this.invoiceList = response.data
                    .filter(a => a.supplierId === this.supplierId && a.isCanceled === false)
                    .sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
                this.detailsList = [];
                this.invoiceDetailsMap = {};
                this.invoiceList.forEach((invoice) =>
                {
                    invoice.invoiceId = invoice.id;
                    invoice.totalInvoiceAmount = parseFloat(invoice.totalInvoiceAmount).toFixed(2);
                    invoice.balance = parseFloat(invoice.balance).toFixed(2);
                    invoice.amountToPay = parseFloat(invoice.amountToPay).toFixed(2);
                    invoice.displayText = `${invoice.supplierName} - ${invoice.invoiceNumber}`;
                    invoice.invoiceDate = this.formatDate(invoice.invoiceDate);
                    invoice.projectedPayDate = this.formatDate(invoice.projectedPayDate);
                    this.invoiceDetailsMap[invoice.id] = invoice.invoiceDetails.map((detail) => {
                        detail.invoiceId = invoice.id;
                        this.detailsList.push(detail);
                        return detail;
                    });

                });
                this.dataTable(this.invoiceList);
                return this.invoiceList;
            })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get invoices.');
                    throw err;
                });
        },
        
        printReport() {
            this.isLoading = true;
            let url = `/ApReports/GetInvoiceInPdf?id=${this.invoiceId}`;

            axios.get(url, { responseType: 'blob' })
                .then(response => {
                    if (!response.data) {
                        this.toastHandler("warning", "No Data is selected for printing.");
                        return;
                    }

                    const blob = new Blob([response.data], { type: "application/pdf" });
                    const blobUrl = URL.createObjectURL(blob);

                    // Render inside iframe by setting pdfUrl
                    this.pdfUrl = blobUrl;

                    this.isLoading = false;
                })
                .catch(err => {
                    this.toastHandler("error", "Unable to load the invoice. Please try again.");
                    this.isLoading = false;
                });
        },

        dispatchInvoice(){
            this.getSelectedInvoices();
            this.isLoading = true;
            let payload = {};
            if (this.sendMultipleInvoices) {
                this.getSelectedInvoices();
                if (this.selectedInvoiceList.length === 0) {
                    this.toastHandler('warning', 'No invoice selected for dispatch.');
                    this.isLoading = false;
                    return;
                }
                payload.sendMultipleInvoices = true;
                payload.supplierId = this.supplierId;
                payload.invoiceIds = this.selectedInvoiceList.map(a => a.id);
            } else {
                let selectedInvoice = this.invoiceList.find(a => a.id === this.invoiceId);
                if (!selectedInvoice) {
                    this.toastHandler('warning', 'Please select an invoice before dispatching.');
                    this.isLoading = false;
                    return;
                }

                payload.sendMultipleInvoices = false;
                payload.supplierId = this.supplierId;
                payload.invoiceIds = [selectedInvoice.id];
            }

            axios.post('/ApEmail/DispatchInvoice/', payload).then(response => {
                if (response.data && response.data.code === 200) {
                    this.toastHandler('', response.data.message);
                } else {
                    this.toastHandler('warning', response.data.message || 'Unexpected response.');
                }
            })
                .catch(error => {
                    this.toastHandler('error', 'Unable to dispatch invoice.');
                })
                .finally(() => {
                    this.isLoading = false;
                });
        },
        toastHandler(type, message = 'An unexpected error occurred.') {

            //display alert with 
            toastr.options = {
                closeButton: true,
                progressBar: true,
                showMethod: 'fadeIn',
                hideMethod: 'fadeOut',
                timeOut: 10000,
            };

            switch (type) {

                case 'warning':
                    toastr.warning('', message);
                    break;
                case 'error':
                    toastr.error('', message);
                    break;
                default:
                    toastr.success('', message);
                    break;
            }

        },


    },
    watch: {
        supplierId() {
            this.getInvoices();
        }



    },
    mounted() {

        this.getInvoices();
        this.getSuppliers();


    },
});
app.use(DataGridPlugin);
app.use(WSelectPlugin);
app.mount('#app');