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

                subReportType: 'summary-report',

                reportApiBaseUrl: '',

                startDate: isoDate(new Date()),
                endDate: isoDate(new Date()),

                invoiceList: [],
                voucherList: [],
                supplierList: [],

                invoiceId: '',
                voucherId: '',
                supplierId: '',

                reportPath: '',
                reportHeader: [],

                reportPathConfig: {

                    summaryReportPath:
                        'https://res.cloudinary.com/dusydqiob/raw/upload/v1755782780/erp-reports/ap/voucherSummary_fhmj9l.rdl',

                    voucherBySupplierReport:
                        'https://res.cloudinary.com/dusydqiob/raw/upload/v1755782780/erp-reports/ap/VoucherBySupplier_acyuir.rdl',

                    voucherByInvoiceReport:
                        'https://res.cloudinary.com/dusydqiob/raw/upload/v1755782780/erp-reports/ap/VoucherByInvoice_y1xfzj.rdl',

                    voucherDetailsReport:
                        'https://res.cloudinary.com/dusydqiob/raw/upload/v1763377532/erp-reports/ap/APPV_lslbln.rdl',

                    voucherByDateReport:
                        'https://res.cloudinary.com/dusydqiob/raw/upload/v1755782780/erp-reports/ap/voucherSummary_fhmj9l.rdl'

                }
            };
        },


        methods: {

            // ==========================================
            // UNWRAP API RESPONSE
            // ==========================================

            unwrapList(response) {
                const data = response?.data;

                if (Array.isArray(data)) return data;
                if (Array.isArray(data?.result)) return data.result;
                if (Array.isArray(data?.result?.items)) return data.result.items;
                if (Array.isArray(data?.items)) return data.items;
                if (Array.isArray(data?.data)) return data.data;

                return [];
            },


            // ==========================================
            // GET SUPPLIERS
            // ==========================================

            getSuppliers() {
                axios.get('/SharedResource/GetSuppliers')
                    .then(response => {

                        this.supplierList = this.unwrapList(response);

                        if (this.supplierList.length > 0) {
                            this.supplierId = this.supplierList[0].id;
                        } else {
                            this.supplierId = '';
                        }

                    })
                    .catch(err => {

                        console.error('Error loading suppliers:', err);

                        this.toastHandler('error', 'Unable to get suppliers.');

                    });
            },


            // ==========================================
            // GET INVOICES
            // ==========================================

            getInvoices() {

                axios.get('/Ap/GetInvoices')
                    .then(response => {

                        this.invoiceList = this.unwrapList(response)
                            .filter(invoice => invoice.isCanceled === false)
                            .sort((a, b) =>
                                (b.invoiceNumber || '').localeCompare(a.invoiceNumber || '')
                            )
                            .map(invoice => ({
                                ...invoice,
                                invoiceId: invoice.id,
                                displayText: `${invoice.supplierName || ''} - ${invoice.invoiceNumber || ''}`
                            }));

                        if (this.invoiceList.length > 0) {
                            this.invoiceId = this.invoiceList[0].id;
                        } else {
                            this.invoiceId = '';
                        }

                    })
                    .catch(err => {

                        console.error('Error loading invoices:', err);

                        this.toastHandler('error', 'Unable to get invoices.');

                    });
            },


            // ==========================================
            // GET VOUCHERS
            // ==========================================
            getVouchers() {
                axios.get('/Ap/GetVouchers')
                    .then(response => {

                        this.voucherList = this.unwrapList(response)
                            .map(voucher => ({
                                ...voucher,
                                displayText: `${voucher.voucherNumber || ''} - ${voucher.supplierName || ''}`
                            }));

                        if (this.voucherList.length > 0) {
                            this.voucherId = this.voucherList[0].id;
                        } else {
                            this.voucherId = '';
                        }

                    })
                    .catch(err => {

                        console.error('Error loading vouchers:', err);

                        this.toastHandler('error', 'Unable to get vouchers.');

                    });
            },
            // report header
            async getReportHeader() {
                let title = 'AP Vouchers';

                if (this.subReportType === 'date-report') {
                    title = `AP Vouchers from ${this.startDate} to ${this.endDate}`;
                }

                const url = `/Ap/GetReportHeader?title=${encodeURIComponent(title)}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },
            // ==========================================
            // GET REPORT DATA
            // ==========================================
            getReportData() {

                let url = '/Ap/GetApVouchersReport';

                this.reportPath = this.reportPathConfig.summaryReportPath;

                switch (this.subReportType) {

                    // ----------------------------------
                    // VOUCHER SUMMARY
                    // ----------------------------------

                    case 'summary-report':

                        this.reportPath =
                            this.reportPathConfig.summaryReportPath;

                        url = '/Ap/GetApVouchersReport';

                        break;


                    // ----------------------------------
                    // VOUCHERS BY SUPPLIER
                    // ----------------------------------

                    case 'supplier-report':

                        if (!this.supplierId) {
                            this.toastHandler('warning', 'Please select a supplier.');
                            return;
                        }

                        this.reportPath =
                            this.reportPathConfig.voucherBySupplierReport;

                        url = `/Ap/GetApVouchersBySupplier?SupplierId=${encodeURIComponent(this.supplierId)}`;

                        break;


                    // ----------------------------------
                    // VOUCHERS BY INVOICE
                    // ----------------------------------

                    case 'invoice-report':

                        if (!this.invoiceId) {
                            this.toastHandler('warning', 'Please select an invoice.');
                            return;
                        }

                        this.reportPath =
                            this.reportPathConfig.voucherByInvoiceReport;

                        url = `/Ap/GetApVoucherByInvoice?InvoiceId=${encodeURIComponent(this.invoiceId)}`;

                        break;


                    // ----------------------------------
                    // VOUCHER DETAILS
                    // ----------------------------------

                    case 'details-report':

                        if (!this.voucherId) {
                            this.toastHandler('warning', 'Please select a voucher.');
                            return;
                        }

                        this.reportPath =
                            this.reportPathConfig.voucherDetailsReport;

                        url = `/Ap/GetApVoucherDetails?VoucherId=${encodeURIComponent(this.voucherId)}`;

                        break;


                    // ----------------------------------
                    // VOUCHERS BY DATE
                    // ----------------------------------

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
                            this.reportPathConfig.voucherByDateReport;

                        url = `/Ap/GetApVouchersByDate?StartDate=${encodeURIComponent(this.startDate)}&EndDate=${encodeURIComponent(this.endDate)}`;

                        break;


                    default:

                        this.toastHandler('warning', 'Please select a valid report option.');

                        return;
                }


                this.isLoading = true;

                axios.get(url)
                    .then(async response => {

                        const data = response.data.result;

                        if (!data) {
                            this.toastHandler('warning', 'No report data was returned.');
                            return;
                        }
                        if (Array.isArray(data)) {
                            data.forEach(row => {
                                row.voucherEntryDate = isoDate(row.voucherEntryDate);
                                row.paymentDate = isoDate(row.paymentDate);
                            });
                        }
                        const header = await this.getReportHeader();
                        this.renderReport(
                            header,
                            data,
                            this.reportPath
                        );

                    })
                    .catch(err => {

                        console.error('Error loading voucher report:', err);

                        this.toastHandler('error', 'Unable to get report data.');

                    })
                    .finally(() => {

                        this.isLoading = false;

                    });
            },


            // ==========================================
            // RENDER BOLD REPORT VIEWER
            // ==========================================

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


            // ==========================================
            // TOAST HANDLER
            // ==========================================

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
            this.getVouchers();

        }

    });


    app.use(WSelectPlugin);

    app.mount('#app');

})();