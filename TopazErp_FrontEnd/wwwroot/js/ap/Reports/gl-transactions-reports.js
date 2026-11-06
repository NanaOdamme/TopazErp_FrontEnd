(() => {
    'use strict';

    const pad = (value) => String(value).padStart(2, '0');

    // Convert dates to YYYY-MM-DD without Moment.
    const isoDate = (date) => {
        if (date === null || date === undefined || date === '') return '';

        if (typeof date === 'string') {
            const raw = date.trim();

            if (!raw) return '';

            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
                return raw.slice(0, 10);
            }

            // Handle .NET JSON dates.
            const ms = /\/Date\((-?\d+)\)\//.exec(raw);

            if (ms) {
                const d = new Date(Number(ms[1]));

                return Number.isNaN(d.getTime())
                    ? ''
                    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }

            // Handle DD/MM/YYYY or DD-MM-YYYY.
            const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(raw);

            if (dmy) {
                return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
            }

            // Handle YYYY/MM/DD.
            const ymd = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(raw);

            if (ymd) {
                return `${ymd[1]}-${pad(ymd[2])}-${pad(ymd[3])}`;
            }
        }

        const d = date instanceof Date ? date : new Date(date);

        if (Number.isNaN(d.getTime())) return '';

        const local = new Date(
            d.getTime() - d.getTimezoneOffset() * 60000
        );

        return local.toISOString().slice(0, 10);
    };

    const app = Vue.createApp({
        data() {
            return {
                isShimmerLoading: false,
                isLoading: false,
                payload: {},

                startDate: isoDate(new Date()),
                endDate: isoDate(new Date()),

                reportApiBaseUrl: '',
                showMultiCurrency: false,

                reportPath: '',

                reportPathConfig: {
                    summaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1759157558/erp-reports/ap/APGLTransactionLocal_szvowo.rdl'
                }
            };
        },

        methods: {
            // report header
            async getReportHeader() {
                const url = `/Ap/GetReportHeader?title=Ap G/L Transactions`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },
            getReportData() {
                if (this.isLoading) return;

                this.isLoading = true;

                const startDate = isoDate(this.startDate);
                const endDate = isoDate(this.endDate);

                // Validate dates.
                if (!startDate || !endDate) {
                    this.toastHandler('warning', 'Please provide valid start and end dates.');
                    this.isLoading = false;
                    return;
                }

                // Start date cannot be greater than end date.
                if (startDate > endDate) {
                    this.toastHandler('warning', 'Start date cannot be greater than end date.');
                    this.isLoading = false;
                    return;
                }

                const url = `/Ap/GetApGlTransaction?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&isMultiCurrency=${this.showMultiCurrency}`;

                this.reportPath = this.reportPathConfig.summaryReportPath;

                axios.get(url)
                    .then(async response => {
                        const data = response?.data?.result;

                        if (!data) {
                            this.toastHandler('error', 'No report data was returned.');
                            return;
                        }
                        this.reportHeader = await this.getReportHeader();
                        const header = this.reportHeader;
                        this.renderReport(
                            header,
                            data,
                            this.reportPath
                        );
                    })
                    .catch(error => {
                        console.error('Error generating GL Transactions report:', error);

                        this.toastHandler('error', 'Unable to get GL transaction data.');
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
            },

            renderReport(header, details, reportPath) {
                console.log('GL Transaction Report Details:', details);

                $('#reportView').empty();

                $('#reportView').boldReportViewer({
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
                            name: 'DataSet1'
                        },
                        {
                            value: details,
                            name: 'DataSet2'
                        }
                    ]
                });
            },

            formatDate(dateInput) {
                return isoDate(dateInput);
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
            showMultiCurrency() {
                this.getReportData();
            }
        },

        mounted() {
            this.reportApiBaseUrl = reportApiBaseUrl;
        }
    });

    app.use(WSelectPlugin);
    app.mount('#app');
})();