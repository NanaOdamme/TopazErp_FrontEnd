const app = Vue.createApp({
    data() {
        return {
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            isLoading: false,
            payload: {},
            reportType: 'summary',
            reportStatus: "all",
            reportApiBaseUrl: '',
            balanceId: '',
            supplierId: '',
            openingBalanceList: [],
            reportPath: '',
            reportPathConfig: {
                SummaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1755775403/erp-reports/ap/openingBalanceSummary_ofo8p1.rdl',
                supplierReport: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1755775403/erp-reports/ap/openingBalanceBySupplier_zwkiag.rdl',
                type2Report: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1755775403/erp-reports/ap/openingBalancesType2_bzd5ow.rdl',
            },
        }
    },
    methods: {
        getSuppliers() {
            axios.get('/SharedResource/GetSuppliers')
                .then(response => {
                    this.supplierList = response.data;
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
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get suppliers.');
                });
        },
        getReportData() {
            this.isLoading = true;

            let url = `/ApReports/GetOpeningBalances?status=${this.reportStatus}`;
            this.reportPath = this.reportPathConfig.SummaryReportPath;

            switch (this.reportType) {
                case 'bySupplier':
                    this.reportPath = this.reportPathConfig.supplierReport;
                    url = `/ApReports/GetOpeningBalancesBySupplier?SupplierId=${this.supplierId}&status=${this.reportStatus}`;
                    break;
                case 'type2':
                    this.reportPath = this.reportPathConfig.type2Report;
                    url = `/ApReports/GetAllConvertedOpeningBalances?status=${this.reportStatus}`;
                    break;
            }
            axios.get(url)
                .then(response => {
                    this.renderReport(response.data.reportHeader, response.data.reportDetails, this.reportPath);
                    this.isLoading = false;
                })
                .catch(err => {
                    this.toastHandler('warning', 'Unable to get data');
                    this.isLoading = false;
                });
        },



        renderReport(header, details, reportPath) {
            console.log(details);

            $("#reportView").empty();

            $("#reportView").boldReportViewer({

                reportServiceUrl: this.reportApiBaseUrl,
                processingMode: ej.ReportViewer.ProcessingMode.Local,
                toolbarSettings: {
                    showToolbar: true,
                    items: ej.ReportViewer.ToolbarItems.All &
                        ~ej.ReportViewer.ToolbarItems.Print
                },
                reportPath: reportPath,
                dataSources: [{
                    value: header,
                    name: "DataSet1"
                },
                    {
                        value: details,
                        name: "DataSet2"
                    }]

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
    mounted() {
        this.getReportData();
        this.getSuppliers();
        this.reportApiBaseUrl = reportApiBaseUrl;

    },
});
app.use(WSelectPlugin);
app.mount('#app');