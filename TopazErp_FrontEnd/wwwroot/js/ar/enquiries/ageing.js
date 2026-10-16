const app = Vue.createApp({
    data() {
        return {
            isLoading: false,
            payload: {},
            startDate: moment().format("YYYY-MM-DD"),
            agingInterval: 30,
            theme: '#0645e7',
            agingData: [
                {
                    currencyCode: "GHS",
                    invoiceNumber: "INV-2026-001",
                    invoiceDate: "2026-10-15",
                    purchaseOrderNumber: "PO-2026-001",
                    totalInvoiceAmount: 15000.00,
                    paidAmount: 5000.00,
                    balance: 10000.00,
                    currentDay: 4000.00,
                    agingFirst: 3000.00,
                    agingSecond: 2000.00,
                    agingThird: 1000.00
                },
                {
                    currencyCode: "USD",
                    invoiceNumber: "INV-2026-002",
                    invoiceDate: "2026-10-10",
                    purchaseOrderNumber: "PO-2026-002",
                    totalInvoiceAmount: 4500.00,
                    paidAmount: 1500.00,
                    balance: 3000.00,
                    currentDay: 1000.00,
                    agingFirst: 1000.00,
                    agingSecond: 500.00,
                    agingThird: 500.00
                },
                {
                    currencyCode: "GBP",
                    invoiceNumber: "INV-2026-003",
                    invoiceDate: "2026-09-25",
                    purchaseOrderNumber: "PO-2026-003",
                    totalInvoiceAmount: 2800.00,
                    paidAmount: 800.00,
                    balance: 2000.00,
                    currentDay: 0.00,
                    agingFirst: 500.00,
                    agingSecond: 700.00,
                    agingThird: 800.00
                },
                {
                    currencyCode: "EUR",
                    invoiceNumber: "INV-2026-004",
                    invoiceDate: "2026-09-01",
                    purchaseOrderNumber: "PO-2026-004",
                    totalInvoiceAmount: 6200.00,
                    paidAmount: 1200.00,
                    balance: 5000.00,
                    currentDay: 0.00,
                    agingFirst: 0.00,
                    agingSecond: 2000.00,
                    agingThird: 3000.00
                },
                {
                    currencyCode: "GHS",
                    invoiceNumber: "INV-2026-005",
                    invoiceDate: "2026-10-14",
                    purchaseOrderNumber: "PO-2026-005",
                    totalInvoiceAmount: 8500.00,
                    paidAmount: 8500.00,
                    balance: 0.00,
                    currentDay: 0.00,
                    agingFirst: 0.00,
                    agingSecond: 0.00,
                    agingThird: 0.00
                },
                {
                    currencyCode: "USD",
                    invoiceNumber: "INV-2026-006",
                    invoiceDate: "2026-08-15",
                    purchaseOrderNumber: "PO-2026-006",
                    totalInvoiceAmount: 7200.00,
                    paidAmount: 2200.00,
                    balance: 5000.00,
                    currentDay: 0.00,
                    agingFirst: 0.00,
                    agingSecond: 1500.00,
                    agingThird: 3500.00
                },
                {
                    currencyCode: "GBP",
                    invoiceNumber: "INV-2026-007",
                    invoiceDate: "2026-10-12",
                    purchaseOrderNumber: "PO-2026-007",
                    totalInvoiceAmount: 1750.00,
                    paidAmount: 750.00,
                    balance: 1000.00,
                    currentDay: 600.00,
                    agingFirst: 400.00,
                    agingSecond: 0.00,
                    agingThird: 0.00
                },
                {
                    currencyCode: "EUR",
                    invoiceNumber: "INV-2026-008",
                    invoiceDate: "2026-07-20",
                    purchaseOrderNumber: "PO-2026-008",
                    totalInvoiceAmount: 3900.00,
                    paidAmount: 900.00,
                    balance: 3000.00,
                    currentDay: 0.00,
                    agingFirst: 0.00,
                    agingSecond: 0.00,
                    agingThird: 3000.00,
                   
                }
            ],
            
        }
    },
        computed: {
            first() {
                return this.agingInterval;
            },
            second() {
                return this.agingInterval * 2;
            },
            third() {
                return this.agingInterval * 3;
            },
            agingColumns() {
                return [
                    { key: 'currencyCode', label: 'Currency', type: 'text', hidden: true, editable: false },
                    { key: 'invoiceNumber', label: 'Invoice Number', type: 'text', width: 150, searchable: true },
                    { key: 'invoiceDate', label: 'Invoice Date', type: 'date', width: 130, searchable: true },
                    { key: 'purchaseOrderNumber', label: 'PO Number', type: 'text', width: 130, searchable: true },
                    { key: 'totalInvoiceAmount', label: 'Amount', type: 'number', width: 130, decimals: 2, agg: 'sum' },
                    { key: 'paidAmount', label: 'Paid', type: 'number', width: 120, decimals: 2, agg: 'sum' },
                    { key: 'balance', label: 'Balance', type: 'number', width: 130, decimals: 2, agg: 'sum' },
                    { key: 'currentDay', label: 'Current', type: 'number', width: 120, decimals: 2, agg: 'sum' },
                    { key: 'agingFirst', label: `${this.first} Days`, type: 'number', width: 120, decimals: 2, agg: 'sum' },
                    { key: 'agingSecond', label: `${this.second} Days`, type: 'number', width: 120, decimals: 2, agg: 'sum' },
                    { key: 'agingThird', label: `${this.third}+ Days`, type: 'number', width: 120, decimals: 2, agg: 'sum' }
                ];
            }
        },
   
    methods: {
      /*  getAgingData() {
            let url = `/ApReports/GetAgeingByDate?startDate=${this.startDate}&agingInterval=${this.agingInterval}`
            axios.get(url).then(response => {
                this.agingData = response.data.reportDetails.invoices;
                this. dataTable(this.agingData);
                this.isLoading = false;

            }).catch(err => {

                this.toastHandler('error', 'Unable to get data');
                this.isLoading = false;

            });
        },*/

      /*  dataTable(responseData) {
            const interval = parseInt(this.agingInterval);
            const first = interval;
            const second = interval * 2;
            const third = interval * 3;

            if ($("#dataTable").data("ejGrid")) {
                $("#dataTable").ejGrid("destroy");
            }

            $("#dataTable").ejGrid({
                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                allowGrouping: true,
                pageSettings: {
                    pageSize: 20,
                    pageSizeList: [10, 20, 50, 100]
                },
                groupSettings: {
                    groupedColumns: ["currencyCode"],
                    showDropArea: false
                },
                scrollSettings: { width: "1200px", height: "400px" },
                toolbarSettings: {
                    showToolbar: true,
                    toolbarItems: [ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search]
                },
                columns: [
                    { field: "currencyCode", headerText: "Currency", visible: false },
                    { field: "invoiceNumber", headerText: "Invoice Number", textAlign: ej.TextAlign.Left, width: 120 },
                    { field: "invoiceDate", headerText: "Invoice Date", textAlign: ej.TextAlign.Left, width: 100 },
                    { field: "purchaseOrderNumber", headerText: "PO Number", textAlign: ej.TextAlign.Left, width: 100 },
                    { field: "totalInvoiceAmount", headerText: "Amount", format: "{0:n2}", textAlign: ej.TextAlign.Right, width: 100 },
                    { field: "paidAmount", headerText: "Paid", format: "{0:n2}", textAlign: ej.TextAlign.Right, width: 100 },
                    { field: "balance", headerText: "Balance", format: "{0:n2}", textAlign: ej.TextAlign.Right, width: 100 },
                    { field: "currentDay", headerText: "Current", format: "{0:n2}", textAlign: ej.TextAlign.Right, width: 100 },
                    { field: "agingFirst", headerText: `${first} Days`, format: "{0:n2}", textAlign: ej.TextAlign.Right, width: 100 },
                    { field: "agingSecond", headerText: `${second} Days`, format: "{0:n2}", textAlign: ej.TextAlign.Right, width: 100 },
                    { field: "agingThird", headerText: `${third}+ Days`, format: "{0:n2}", textAlign: ej.TextAlign.Right, width: 100 }
                ],
                summaryRows: [{
                    summaryColumns: [
                        {
                            summaryType: ej.Grid.SummaryType.Sum,
                            displayColumn: "totalInvoiceAmount",
                            dataMember: "totalInvoiceAmount",
                            prefix: " ",
                            format: "{0:n2}"
                        },
                        {
                            summaryType: ej.Grid.SummaryType.Sum,
                            displayColumn: "paidAmount",
                            dataMember: "paidAmount",
                            prefix: " ",
                            format: "{0:n2}"
                        },
                        {
                            summaryType: ej.Grid.SummaryType.Sum,
                            displayColumn: "balance",
                            dataMember: "balance",
                            prefix: " ",
                            format: "{0:n2}"
                        },
                        {
                            summaryType: ej.Grid.SummaryType.Sum,
                            displayColumn: "currentDay",
                            dataMember: "currentDay",
                            prefix: " ",
                            format: "{0:n2}"
                        },
                        {
                            summaryType: ej.Grid.SummaryType.Sum,
                            displayColumn: "agingFirst",
                            dataMember: "agingFirst",
                            prefix: " ",
                            format: "{0:n2}"
                        },
                        {
                            summaryType: ej.Grid.SummaryType.Sum,
                            displayColumn: "agingSecond",
                            dataMember: "agingSecond",
                            prefix: " ",
                            format: "{0:n2}"
                        },
                        {
                            summaryType: ej.Grid.SummaryType.Sum,
                            displayColumn: "agingThird",
                            dataMember: "agingThird",
                            prefix: " ",
                            format: "{0:n2}"
                        }
                    ],
                    showCaptionSummary: false,
                    showTotalSummary: false,
                    summaryRowsTitle: "Group Totals"
                }]
            });
        },*/




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

     //   this.getAgingData();


    },
});
app.use(DataGridPlugin);
app.mount('#app');
