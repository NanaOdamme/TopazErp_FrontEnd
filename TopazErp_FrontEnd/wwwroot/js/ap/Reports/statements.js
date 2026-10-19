const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,
            payload: {},
            reportType: 'type1',
            startDate: moment().format("YYYY-MM-DD"),
            endDate: moment().format("YYYY-MM-DD"),
            reportApiBaseUrl: '',
            supplierList: [],
            supplierId: '',
            reportPathConfig: {
                summaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1760443454/erp-reports/ap/ap-statement-type-1_qxagi6_unqa1o.rdl',
                type1ReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1758199618/erp-reports/ap/ap-statement-type-2_ukbixr.rdl',
                type2ReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1758199818/erp-reports/ap/ap-statement-type-3_eegzh5.rdl',
            },
        }
    },
    methods: {
        getReportData() {
            this.isLoading = true;

            //if start date is greater than end date, show error
            if (moment(this.startDate).isAfter(this.endDate)) {
                this.toastHandler('warning', 'Start date cannot be greater than end date.');
                this.isLoading = false;
                return;
            }

            //if supplierId is not selected, show error
            if (!this.supplierId) {
                this.toastHandler('warning', 'Please select a supplier.');
                this.isLoading = false;
                return;
            }

            let url = `GetStatement?supplierId=${this.supplierId}`;
            this.reportPath = this.reportPathConfig.summaryReportPath;

            switch (this.reportType) {
                case 'type1':
                    this.reportPath = this.reportPathConfig.summaryReportPath;
                    url = `GetStatement?supplierId=${this.supplierId}`;
                    break;
                case 'type2':
                    this.reportPath = this.reportPathConfig.type1ReportPath;
                    url = `GetStatementType2?supplierId=${this.supplierId}&startDate=${this.startDate}&endDate=${this.endDate}`;
                    break;
                case 'type3':
                    this.reportPath = this.reportPathConfig.type2ReportPath;
                    url = `GetStatementType3?supplierId=${this.supplierId}&startDate=${this.startDate}&endDate=${this.endDate}`;
                    break;
                default:
                    this.toastHandler('warning', 'Please select a valid report type.');
                    this.isLoading = false;
                    return;
            }

            axios.get(url)
                .then(response => {
                    this.renderReport(response.data.reportHeader, response.data.reportDetails.data, response.data.reportDetails.outstanding, this.reportPath);
                    this.isLoading = false;
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get data');
                    this.isLoading = false;
                });
        },



        renderReport(header, details, outstanding, reportPath) {

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
                    },
                    {
                        value: outstanding,
                        name: "DataSet3"
                    }]


            });

        },

        getSuppliers() {
            axios.get('/SharedResource/GetSuppliers')
                .then(response => {
                    this.supplierList = response.data;
                    if (this.supplierList.length > 0) {
                        this.supplierId = this.supplierList[0].id;
                    } else {
                        this.supplierId = null;
                    }

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



        formatDate(dateInput) {

            return moment(dateInput).format("YYYY-MM-DD");
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
        this.getSuppliers();
        //  this.getReportData();
        this.reportApiBaseUrl = reportApiBaseUrl;

    },
});
app.mount('#app');