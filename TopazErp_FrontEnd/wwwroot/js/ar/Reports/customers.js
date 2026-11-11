const app = Vue.createApp({
    data() {
        return {
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            isLoading: false,
            payload: {},

            reportType: 'summary-report',
            reportApiBaseUrl: '',

            customerGroupId: '',
            customerGroupList: [],
            customerGroupName: '',

            reportPath: '',
            reportHeader:[],
            reportPathConfig: {

                summaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1744299058/erp-reports/ar/customers_eylpvf.rdl',
                customerGroupReport: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1744299058/erp-reports/ar/customers_eylpvf.rdl',
            },
        };
    },

    methods: {
        unwrapList(raw) {
            if (!raw) return [];

            if (Array.isArray(raw)) return raw;

            if (raw.result !== undefined) {
                return this.unwrapList(raw.result);
            }

            if (Array.isArray(raw.items)) return raw.items;
            if (Array.isArray(raw.data)) return raw.data;

            const firstArray = Object.values(raw).find(
                value => Array.isArray(value)
            );

            return firstArray || [];
        },
        async getReportHeader() {
            let title = 'Customers';

            if (this.reportType === 'customer-group') {
                title = `Customers - ${this.customerGroupName}`;
            }

            const url = `/Ap/GetReportHeader?title=${encodeURIComponent(title)}`;
            const response = await axios.get(url);

            this.reportHeader = response.data?.result || [];
            return this.reportHeader;
        },
        async getReportData() {
            if (this.isLoading) return;

            this.isLoading = true;

            try {
                let url = '/SharedResource/GetCustomers';

                this.reportPath = this.reportPathConfig.summaryReportPath;

                if (this.reportType === 'customer-group') {
                    if (!this.customerGroupId) {
                        this.toastHandler('warning', 'Please select a customer group.');
                        return;
                    }

                    this.reportPath = this.reportPathConfig.customerGroupReport;
                }

                const response = await axios.get(url);

                const reportHeader = await this.getReportHeader();

                let reportDetails = this.unwrapList(response.data);

                // Filter customers by selected customer group
                if (this.reportType === 'customer-group') {
                    reportDetails = reportDetails.filter(
                        item => String(item.customerGroupId) === String(this.customerGroupId)
                    );
                }

                this.renderReport(
                    reportHeader,
                    reportDetails,
                    this.reportPath
                );

            } catch (error) {
                console.error('Report loading failed:', error);

                this.toastHandler(
                    'error',
                    error.response?.data?.message || 'Unable to get report data.'
                );

            } finally {
                this.isLoading = false;
            }
        },

        renderReport(header, details, reportPath) {
            const reportElement = $("#reportView");

            reportElement.empty();

            reportElement.boldReportViewer({
                reportServiceUrl: this.reportApiBaseUrl,

                processingMode: ej.ReportViewer.ProcessingMode.Local,

                toolbarSettings: {
                    showToolbar: true,
                    items: ej.ReportViewer.ToolbarItems.All &
                        ~ej.ReportViewer.ToolbarItems.Print
                },

                reportPath: reportPath,

                dataSources: [
                    {
                        value: header,
                        name: "DataSet1"
                    },
                    {
                        value: details,
                        name: "DataSet2"
                    }
                ]
            });
        },

        async getCustomerGroups() {
            try {
                const response = await axios.get(
                    '/SharedResource/GetCustomerGroups'
                );

                this.customerGroupList = this.unwrapList(response.data);

            } catch (error) {
                console.error('Customer groups loading failed:', error);

                this.toastHandler(
                    'error',
                    'Unable to get customer groups.'
                );
            }
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

    watch: {
        customerGroupId(val) {
            const customerGroupInfo = this.customerGroupList.find(
                item => String(item.id) === String(val)
            );

            this.customerGroupName = customerGroupInfo?.name || '';
            this.getReportData();
        }
    },

    async mounted() {
        this.reportApiBaseUrl = reportApiBaseUrl;

        await this.getCustomerGroups();
        await this.getReportData();
    }
});
app.use(WSelectPlugin);
app.mount('#app');