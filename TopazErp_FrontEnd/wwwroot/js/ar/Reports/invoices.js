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

   
    const today = isoDate(new Date());

    const app = Vue.createApp({
        data() {
            return {
                emptyGuid: '00000000-0000-0000-0000-000000000000',

                isLoading: false,

                payload: {},

                reportType: 'summary-report',

                reportApiBaseUrl: '',

                invoiceId: '',
                invoiceList: [],

                batchNumber: '',
                invoiceNumber: '',

                startDate: today,
                endDate: today,

                startNumber: '1',
                endNumber: '10',

                supplierList: [],
                supplierId: '',
                reportHeader:[],

                reportPath: '',

                reportPathConfig: {
                    summaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1755773604/erp-reports/ap/invoices_d8emhd.rdl',

                    supplierInvoiceReport: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1755773604/erp-reports/ap/invoices_d8emhd.rdl',
                }
            };
        },

        methods: {
            // Handle direct arrays and common ABP response wrappers.
            unwrapList(raw) {
                if (!raw) return [];

                if (Array.isArray(raw)) return raw;

                if (Array.isArray(raw.result)) return raw.result;

                if (Array.isArray(raw.items)) return raw.items;

                if (Array.isArray(raw.data)) return raw.data;

                return [];
            },
            // report header
            async getReportHeader() {
                const url = `/Ap/GetReportHeader?title=AP Invoices`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },
            async getReportData() {
                if (this.isLoading) return;

                let url = '/Ap/GetAllApInvoices';

                let selectedReportPath =
                    this.reportPathConfig.summaryReportPath;

                switch (this.reportType) {
                    case 'summary-report':
                        break;

                    case 'bySupplier':
                        if (!this.supplierId) {
                            this.toastHandler(
                                'warning',
                                'Please select a supplier.'
                            );
                            return;
                        }

                        selectedReportPath =
                            this.reportPathConfig.supplierInvoiceReport;

                        url = `/Ap/GetApInvoiceReport?SupplierId=${encodeURIComponent(this.supplierId)}`;
                        break;

                    case 'byBatch':
                        if (!this.batchNumber) {
                            this.toastHandler(
                                'warning',
                                'Please select a batch number.'
                            );
                            return;
                        }

                        selectedReportPath =
                            this.reportPathConfig.supplierInvoiceReport;

                        url = `/Ap/GetApInvoiceByBatch?batchNumber=${encodeURIComponent(this.batchNumber)}`;
                        break;

                    case 'byInvoiceNumber':
                        if (!this.invoiceNumber) {
                            this.toastHandler(
                                'warning',
                                'Please select an invoice number.'
                            );
                            return;
                        }

                        selectedReportPath =
                            this.reportPathConfig.supplierInvoiceReport;

                        url = `/Ap/GetApInvoiceByInvoiceNumber?invoiceNumber=${encodeURIComponent(this.invoiceNumber)}`;
                        break;

                    case 'byDate':
                        if (!this.startDate || !this.endDate) {
                            this.toastHandler(
                                'warning',
                                'Please select both start and end dates.'
                            );
                            return;
                        }

                        if (this.startDate > this.endDate) {
                            this.toastHandler(
                                'warning',
                                'Start date cannot be greater than end date.'
                            );
                            return;
                        }

                        selectedReportPath =
                            this.reportPathConfig.supplierInvoiceReport;

                        url = `/Ap/GetApInvoiceByDate?startDate=${encodeURIComponent(this.startDate)}&endDate=${encodeURIComponent(this.endDate)}`;
                        break;

                    case 'byInvoiceRange':
                        if (
                            this.startNumber === '' ||
                            this.endNumber === ''
                        ) {
                            this.toastHandler(
                                'warning',
                                'Please enter both invoice numbers.'
                            );
                            return;
                        }

                        if (
                            !Number.isFinite(Number(this.startNumber)) ||
                            !Number.isFinite(Number(this.endNumber)) ||
                            Number(this.startNumber) > Number(this.endNumber)
                        ) {
                            this.toastHandler(
                                'warning',
                                'Please enter a valid invoice number range.'
                            );
                            return;
                        }

                        selectedReportPath =
                            this.reportPathConfig.supplierInvoiceReport;

                        url = `/Ap/GetApInvoiceByRange?startNumber=${encodeURIComponent(this.startNumber)}&endNumber=${encodeURIComponent(this.endNumber)}`;
                        break;

                    default:
                        this.toastHandler(
                            'warning',
                            'Please select a valid report type.'
                        );
                        return;
                }

                this.isLoading = true;

                try {
                    const response = await axios.get(url);

                    const result = response.data.result || {};
                    const header = await this.getReportHeader();
                    this.reportPath = selectedReportPath;

                    this.renderReport(
                        header,
                        result,
                        selectedReportPath
                    );

                } catch (error) {
                    console.error('Invoice report error:', error);

                    this.toastHandler(
                        'error',
                        error.response?.data?.message ||
                        'Unable to get invoice report data.'
                    );
                } finally {
                    this.isLoading = false;
                }
            },

            renderReport(header, details, reportPath) {
                const reportElement = $('#reportView');

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
                            name: 'DataSet1'
                        },
                        {
                            value: details,
                            name: 'DataSet2'
                        }
                    ]
                });
            },

            async getSuppliers() {
                try {
                    const response = await axios.get(
                        '/SharedResource/GetSuppliers'
                    );

                    this.supplierList = this.unwrapList(response.data);

                    if (this.supplierList.length > 0) {
                        this.supplierId = this.supplierList[0].id;
                    } else {
                        this.supplierId = '';
                    }

                } catch (error) {
                    console.error('Get suppliers error:', error);

                    this.supplierList = [];
                    this.supplierId = '';

                    this.toastHandler(
                        'error',
                        'Unable to get suppliers.'
                    );
                }
            },

            async getInvoices() {
                try {
                    const response = await axios.get(
                        '/Ap/GetInvoices'
                    );

                    const invoices = this.unwrapList(response.data);

                    this.invoiceList = invoices.filter(
                        invoice => invoice.isCanceled === false
                    );

                    if (this.invoiceList.length > 0) {
                        const firstInvoice = this.invoiceList[0];

                        this.invoiceId = firstInvoice.id;
                        this.batchNumber = firstInvoice.batchNumber;
                        this.invoiceNumber = firstInvoice.invoiceNumber;
                        
                    } else {
                        this.invoiceId = '';
                        this.batchNumber = '';
                        this.invoiceNumber = '';
                    }
                } catch (error) {
                    console.error('Get invoices error:', error);
                    this.invoiceList = [];
                    this.invoiceId = '';
                    this.batchNumber = '';
                    this.invoiceNumber = '';
                    this.toastHandler('error', 'Unable to get invoices.');
                }
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

        mounted() {
            this.reportApiBaseUrl = reportApiBaseUrl;

            this.getSuppliers();
            this.getInvoices();

            this.getReportData();
        }
    });

    app.use(WSelectPlugin);
    app.mount('#app');
})();