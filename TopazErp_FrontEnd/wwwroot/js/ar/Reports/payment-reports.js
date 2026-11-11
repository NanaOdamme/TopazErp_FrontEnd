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
                emptyGuid: '00000000-0000-0000-0000-000000000000',
                isLoading: false,
                payload: {},

                reportType: 'Invoice',
                subReportType: 'customer-report',

                reportApiBaseUrl: '',

                startDate: isoDate(new Date()),
                endDate: isoDate(new Date()),

                paymentList: [],
                customerList: [],

                batchNumber: '',
                customerId: '',
                paymentId: '',

                reportPath: '',
                reportHeader:[],
                reportPathConfig: {
                    invoicePaymentReceiptReportPath:'https://res.cloudinary.com/dusydqiob/raw/upload/v1745323121/erp-reports/ar/paymentReceiptUpdated_ddqlmg.rdl',
                    invoicePaymentSummaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1758628390/erp-reports/ar/ar-payment-history-all_upylwj.rdl',
                    invoicePaymentCustomerReport: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1758628390/erp-reports/ar/ar-payment-history_uwikt3.rdl',
                    invoicePaymentByDateReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1758628390/erp-reports/ar/ar-payment-history-all_upylwj.rdl',
                },
            };
        },

        methods: {
            // report header
            async getReportHeader() {
                let title = 'AR Payments';

                if (this.subReportType === 'date-report') {
                    title = `AR Payments from ${this.startDate} to ${this.endDate}`;
                }

                const url = `/Ap/GetReportHeader?title=${encodeURIComponent(title)}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },
            unwrapList(response) {
                const data = response?.data;

                if (Array.isArray(data)) return data;
                if (Array.isArray(data?.result)) return data.result;
                if (Array.isArray(data?.result?.items)) return data.result.items;
                if (Array.isArray(data?.items)) return data.items;
                if (Array.isArray(data?.data)) return data.data;

                return [];
            },

            getPayments() {
                axios.get('/Ar/GetPayments/')
                    .then(response => {
                        this.paymentList = this.unwrapList(response)
                            .filter(payment => payment.isCanceled === false)
                            .map(payment => ({
                                ...payment,
                                paymentId: payment.id,
                                displayText: `${payment.batchNumber}-${payment.customerName}`
                            }));

                        if (this.paymentList.length > 0) {
                            this.paymentId = this.paymentList[0].id;
                        }
                    })
                    .catch(err => {
                        console.error('Error loading payments:', err);
                        this.toastHandler('error', 'Unable to get payments.');
                    });
            },

            getCustomers() {
                axios.get('/SharedResource/GetCustomers')
                    .then(response => {
                        this.customerList = this.unwrapList(response);

                        if (this.customerList.length > 0) {
                            this.customerId = this.customerList[0].id;
                        }
                    })
                    .catch(err => {
                        console.error('Error loading customers:', err);
                        this.toastHandler('error', 'Unable to get customers.');
                    });
            },

            getReportData() {
                let url = '/Ar/GetPaymentsReport';

                this.reportPath = this.reportPathConfig.invoicePaymentSummaryReportPath;

                if (this.reportType !== 'Invoice') {
                    this.toastHandler('warning', 'Please select a valid report type.');
                    return;
                }

                switch (this.subReportType) {
                    case 'summary-report':
                        this.reportPath =
                            this.reportPathConfig.invoicePaymentSummaryReportPath;

                        url = '/Ar/GetPaymentsReport';
                        break;

                    case 'customer-report':
                        if (!this.customerId) {
                            this.toastHandler('warning', 'Please select a customer.');
                            return;
                        }

                        this.reportPath =
                            this.reportPathConfig.invoicePaymentCustomerReport;

                        url = `/Ar/GetPaymentsByCustomer?CustomerId=${encodeURIComponent(this.customerId)}`;
                        break;

                    case 'date-report':
                        if (!this.startDate || !this.endDate) {
                            this.toastHandler('warning', 'Please select a start date and end date.');
                            return;
                        }

                        if (this.startDate > this.endDate) {
                            this.toastHandler('warning', 'Start date cannot be later than end date.');
                            return;
                        }

                        this.reportPath =
                            this.reportPathConfig.invoicePaymentByDateReportPath;

                        url = `/Ar/GetPaymentsByDate?StartDate=${encodeURIComponent(this.startDate)}&EndDate=${encodeURIComponent(this.endDate)}`;
                        break;

                    case 'batchNumber':
                        if (!this.paymentId) {
                            this.toastHandler('warning', 'Please select a payment batch.');
                            return;
                        }

                        this.reportPath =
                            this.reportPathConfig.invoicePaymentReceiptReportPath;

                        url = `/Ar/GetPaymentReceipts?id=${encodeURIComponent(this.paymentId)}`;
                        break;

                    default:
                        this.toastHandler('warning', 'Please select a valid report option.');
                        return;
                }

                this.isLoading = true;

                axios.get(url)
                    .then(async response => {
                        const data = response.data.result;

                        /*   const reportDetails =
                               this.subReportType === 'batchNumber'
                                   ? data.reportDetails
                                   : data.reportDetails?.data;*/
                        const header = await this.getReportHeader();
                        this.renderReport(
                            header,
                            data,
                            this.reportPath
                        );
                    })
                    .catch(err => {
                        console.error('Error loading report:', err);
                        this.toastHandler('error', 'Unable to get report data.');
                    })
                    .finally(() => {
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
            this.reportApiBaseUrl = reportApiBaseUrl;

            this.getCustomers();
            this.getPayments();
        }
    });

    app.use(WSelectPlugin);
    app.mount('#app');
})();