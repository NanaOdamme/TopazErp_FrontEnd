const app = Vue.createApp({
    data() {
        return {
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            isLoading: false,
            payload: {},
            reportType: 'summary-report',
            reportApiBaseUrl: '',
            supplierGroupId: '',
            supplierGroupList: [],
            supplierGroupName: '',
            reportPath: '',
            reportPathConfig: {

                summaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1755697772/erp-reports/ap/suppliers_xtpls7.rdl',
                supplierGroupReport: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1755697772/erp-reports/ap/suppliers_xtpls7.rdl',
            },
        }
    },
    methods: {

        getReportData() {

            this.isLoading = true;

            let url = '/ApReports/GrGetSuppliers';

            this.reportPath = this.reportPathConfig.summaryReportPath;

            if (this.reportType === 'supplier-group') {

                this.reportPath = this.reportPathConfig.supplierGroupReport;
                url = '/ApReports/GetSuppliersByGroup?SupplierGroupId=' + this.supplierGroupId + '&SupplierGroupName=' + this.supplierGroupName;
            }




            axios.get(url).then(response => {



                this.renderReport(response.data.reportHeader, response.data.reportDetails, this.reportPath);


                this.isLoading = false;

            }).catch(err => {

                this.toastHandler('error', 'Unable to get data');
                this.isLoading = false;

            });


        },


        renderReport(header, details, reportPath) {

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

        getSupplierGroups() {

            axios.get('/SharedResource/GetSupplierGroups').then(response => {

                this.supplierGroupList = response.data;

            }).catch(err => {

                this.toastHandler('error', 'Unable to get data');

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
        supplierGroupId: function (val) {
            let supplierGroupInfo = this.supplierGroupList.find(x => x.id === val);

            if (supplierGroupInfo) {

                this.supplierGroupName = supplierGroupInfo.name;

            }
        },
    },
    mounted() {

        this.getReportData();
        this.getSupplierGroups();
        this.reportApiBaseUrl = reportApiBaseUrl;

    },
});
app.mount('#app');