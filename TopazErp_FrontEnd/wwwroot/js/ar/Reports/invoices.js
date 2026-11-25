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

    // >>> ADDED: format amounts with thousands separators and 2 decimals
    //     (e.g. 6000 -> "6,000.00"). Non-numeric values pass through.
    const formatAmount = (value) => {
        if (value === null || value === undefined || value === '') return '';

        const num = Number(value);

        if (!Number.isFinite(num)) return value;

        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // >>> ADDED: the API returns the logo as raw base64 — convert it to a
    //     data URI so <img src="{{companyLogo}}"> can render it. Falls back
    //     to a transparent pixel when there is no logo.
    const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const toLogoDataUri = (logo) => {
        if (!logo || typeof logo !== 'string') return TRANSPARENT_PIXEL;

        const trimmed = logo.trim();

        if (!trimmed) return TRANSPARENT_PIXEL;

        if (trimmed.startsWith('data:')) return trimmed;

        return `data:image/jpeg;base64,${trimmed}`;
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

                customerList: [],
                customerId: '',
                reportHeader:[],

                reportPath: '',
                reportData:[],
                viewerColor: 'blue',
                showReport: false,

                reportPathConfig: {
                    invoiceReportPath: '/ReportTemplates/Ar/ar-invoice-summary.html',
                    customerInvoicesReportPath: '/ReportTemplates/Ar/ar-invoice-customer.html',
                },
            };
        },
        computed: {
            reportTitle() {
                let title = 'AR INVOICES'
                if (this.reportType === 'summary-report') {
                    title = 'Invoice Summary';
                }
                else if (this.reportType === 'byCustomer')
                {
                    title = 'Invoice Summary Report For Customer'
                }
                else if (this.reportType === 'byDate'){
                    title = `Invoice Summary for the period ${this.startDate} to ${this.endDate}`;
                }
                else if (this.reportType === 'byInvoiceRange')
                {
                    title = `Invoice Summary for the ranges ${this.startNumber} to ${this.endNumber}`;
                }
                return title;
            }
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
                const url = `/Ap/GetReportHeader?title=${this.reportTitle}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },
            async getReportData() {
                if (this.isLoading) return;

                let url = '/Ar/GetAllInvoices';

                // >>> CHANGED: every invoice report now uses an HTML template.
                //     The By Customer report uses the customer invoices template.
                let selectedReportPath =
                    this.reportType === 'byCustomer'
                        ? this.reportPathConfig.customerInvoicesReportPath
                        : this.reportPathConfig.invoiceReportPath;

                switch (this.reportType) {
                    case 'summary-report':
                        break;

                    case 'byCustomer':
                        if (!this.customerId) {
                            this.toastHandler(
                                'warning',
                                'Please select a customer.'
                            );
                            return;
                        }

                        url = `/Ar/GetInvoiceReport?CustomerId=${encodeURIComponent(this.customerId)}`;
                        break;

                    case 'byBatch':
                        if (!this.batchNumber) {
                            this.toastHandler(
                                'warning',
                                'Please select a batch number.'
                            );
                            return;
                        }

                        url = `/Ar/GetInvoiceByBatch?batchNumber=${encodeURIComponent(this.batchNumber)}`;
                        break;

                    case 'byInvoiceNumber':
                        if (!this.invoiceNumber) {
                            this.toastHandler(
                                'warning',
                                'Please select an invoice number.'
                            );
                            return;
                        }

                        url = `/Ar/GetInvoiceByInvoiceNumber?invoiceNumber=${encodeURIComponent(this.invoiceNumber)}`;
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

                        url = `/Ar/GetInvoiceByDate?startDate=${encodeURIComponent(this.startDate)}&endDate=${encodeURIComponent(this.endDate)}`;
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

                        url = `/Ar/GetInvoiceByRange?startNumber=${encodeURIComponent(this.startNumber)}&endNumber=${encodeURIComponent(this.endNumber)}`;
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

                    const result = response.data.result || [];
                    const header = await this.getReportHeader();

                    // The header comes back as an array with one object —
                    // take the first item so reportData[0] is always the
                    // header (even if the header array is empty).
                    const headerObj = Array.isArray(header)
                        ? (header[0] || {})
                        : (header || {});

                    const rows = Array.isArray(result) ? result : [result];

                    // >>> ADDED: format the amount fields on every row so the
                    //     template shows "6,000.00" instead of "6000".
                    const formattedRows = rows.map((row) => ({
                        ...row,
                        balance: formatAmount(row.balance),
                        totalInvoiceAmount: formatAmount(row.totalInvoiceAmount),
                    }));

                    // >>> ADDED: convert the logo to a data URI and add the
                    //     current date so the template's {{companyLogo}} and
                    //     {{CurrentDate}} placeholders are filled. The customer
                    //     name is added too — the customer invoices template
                    //     shows it in its customer block (falls back to the
                    //     first row's customerName).
                    const selectedCustomer = this.customerList.find(
                        (customer) => customer.id === this.customerId
                    );

                    const headerItem = {
                        ...headerObj,
                        companyLogo: toLogoDataUri(headerObj.companyLogo),
                        CurrentDate: today,
                        customerName: selectedCustomer
                            ? selectedCustomer.name
                            : (formattedRows[0]?.customerName || ''),
                    };

                    // reportData = [header, ...invoiceRows]. The PdfViewer
                    // treats the first item as the header (top-level
                    // placeholders) and the rest as `rows` for the template's
                    // data-repeat loops — all markup lives in the template.
                    const reportData = [headerItem, ...formattedRows];

                    this.reportPath = selectedReportPath;
                    this.reportData = reportData;

                    // >>> ADDED: show the report in the PdfViewer.
                    this.showReport = reportData.length > 1;

                    if (!this.showReport) {
                        this.toastHandler('warning', 'No invoice data found.');
                    }

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

            async getCustomers() {
                try {
                    const response = await axios.get(
                        '/SharedResource/GetCustomers'
                    );

                    this.customerList = this.unwrapList(response.data);

                    if (this.customerList.length > 0) {
                        this.customerId = this.customerList[0].id;
                    } else {
                        this.customerId = '';
                    }

                } catch (error) {
                    console.error('Get customers error:', error);

                    this.customerList = [];
                    this.customerId = '';

                    this.toastHandler(
                        'error',
                        'Unable to get customers.'
                    );
                }
            },

            async getInvoices() {
                try {
                    const response = await axios.get(
                        '/Ar/GetInvoices'
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

            this.getCustomers();
            this.getInvoices();
            this.getReportData();
        }
    });
    app.component('PdfViewer', PdfViewer);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
