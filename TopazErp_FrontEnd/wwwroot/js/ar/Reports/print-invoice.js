(() => {
    'use strict';

    const pad = (value) => String(value).padStart(2, '0');

    const MONTHS = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };

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

            // Handle dd-MMM-yyyy (e.g. "12-Nov-2026").
            const dMonY = /^(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{4})$/.exec(raw);

            if (dMonY) {
                const month = MONTHS[dMonY[2].toLowerCase()];
                if (month) return `${dMonY[3]}-${month}-${pad(dMonY[1])}`;
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

        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);

        return local.toISOString().slice(0, 10);
    };

    const today = isoDate(new Date());

    const formatAmount = (value) => {
        if (value === null || value === undefined || value === '') return '';

        const num = Number(value);
        if (!Number.isFinite(num)) return value;

        const rounded = Math.round(num * 100) / 100;
        const text = Math.abs(rounded).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        return rounded < 0 ? `(${text})` : text;
    };

    const formatQuantity = (value) => {
        if (value === null || value === undefined || value === '') return '';

        const num = Number(value);
        if (!Number.isFinite(num)) return value;

        return num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    const formatDetailRow = (item, idx) => ({
        index: item.index > 0 ? item.index : idx + 1,
        rowNumber: idx + 1,
        description: item.description ?? '',
        referenceNumber: item.referenceNumber ?? '',
        quantity: formatQuantity(item.quantity),
        unitPrice: formatAmount(item.unitPrice),
        amount: formatAmount(item.amount),
        discount: formatAmount(item.discount),
        subTotal: formatAmount(item.subTotal),
        rowClass: 'data-row',
    });

    const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const toLogoDataUri = (logo) => {
        if (!logo || typeof logo !== 'string') return TRANSPARENT_PIXEL;

        const trimmed = logo.trim();

        if (!trimmed) return TRANSPARENT_PIXEL;

        if (trimmed.startsWith('data:')) return trimmed;

        return `data:image/jpeg;base64,${trimmed}`;
    };

    const app = Vue.createApp({
        data() {
            return {
                emptyGuid: '00000000-0000-0000-0000-000000000000',
                isLoading: false,
                payload: {},

                reportApiBaseUrl: '',

                invoiceList: [],
                invoiceId: '',
                invoiceNumber: '',

                reportHeader: [],
                reportPath: '',
                reportData: [],
                viewerColor: 'blue',
                showReport: false,

                reportPathConfig: {
                    invoiceReportPath: '/ReportTemplates/Ar/ar-invoice-by-id.html',
                },
            };
        },

        computed: {
            reportTitle() {
                return 'INVOICE';
            },
        },

        methods: {
            unwrapList(raw) {
                if (!raw) return [];

                if (Array.isArray(raw)) return raw;

                if (Array.isArray(raw.result)) return raw.result;

                if (Array.isArray(raw.result?.items)) return raw.result.items;

                if (Array.isArray(raw.items)) return raw.items;

                if (Array.isArray(raw.data)) return raw.data;

                return [];
            },

            async getReportHeader() {
                const url = `/Ap/GetReportHeader?title=${encodeURIComponent(this.reportTitle)}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },

            async getInvoices() {
                try {
                    const response = await axios.get('/Ar/GetInvoices');

                    const invoices = this.unwrapList(response.data);

                    this.invoiceList = invoices
                        .filter((invoice) => invoice.isCanceled === false)
                        .map((invoice) => ({
                            id: invoice.id,
                            invoiceNumber: invoice.invoiceNumber,
                        }));

                    if (this.invoiceList.length > 0) {
                        const firstInvoice = this.invoiceList[0];

                        this.invoiceId = firstInvoice.id;
                        this.invoiceNumber = firstInvoice.invoiceNumber;
                    } else {
                        this.invoiceId = '';
                        this.invoiceNumber = '';
                    }
                } catch (error) {
                    console.error('Get invoices error:', error);
                    this.invoiceList = [];
                    this.invoiceId = '';
                    this.invoiceNumber = '';
                    this.toastHandler('error', 'Unable to get invoices.');
                }
            },

            async getReportData() {
                if (this.isLoading) return;

                if (!this.invoiceId || this.invoiceId === this.emptyGuid) {
                    this.toastHandler('warning', 'Please select an invoice.');
                    return;
                }

                this.isLoading = true;

                const selectedReportPath = this.reportPathConfig.invoiceReportPath;
                const url = `/Ar/GetInvoiceDetails?id=${encodeURIComponent(this.invoiceId)}`;

                try {
                    const response = await axios.get(url);
                    const raw = response?.data?.result ?? response?.data;
                    const data = Array.isArray(raw) ? (raw[0] || null) : raw;

                    if (!data || (!data.invoiceNumber && !Array.isArray(data.invoiceDetails))) {
                        this.reportData = [];
                        this.showReport = false;
                        this.toastHandler('warning', 'No invoice details were returned.');
                        return;
                    }

                    // Exclude smtpCredentials from report data; extract header, customer, and line items.
                    const {
                        smtpCredentials,
                        reportHeader,
                        customerInfo,
                        invoiceDetails,
                        ...invoice
                    } = data;

                    let headerObj = Array.isArray(reportHeader)
                        ? (reportHeader[0] || {})
                        : (reportHeader || {});

                    if (!headerObj.companyName && !headerObj.companyLogo) {
                        const fallbackHeader = await this.getReportHeader();
                        headerObj = Array.isArray(fallbackHeader)
                            ? (fallbackHeader[0] || {})
                            : (fallbackHeader || {});
                    }

                    const customer = customerInfo || {};
                    const details = Array.isArray(invoiceDetails) ? invoiceDetails : [];
                    const formattedRows = details.map(formatDetailRow);

                    const headerItem = {
                        ...headerObj,
                        companyLogo: toLogoDataUri(headerObj.companyLogo),
                        email: headerObj.email ?? '',
                        CurrentDate: today,
                        reportTitle: this.reportTitle,

                        invoiceNumber: invoice.invoiceNumber ?? '',
                        invoiceDate: isoDate(invoice.invoiceDate),
                        projectedPayDate: isoDate(invoice.projectedPayDate),
                        purchaseOrderNumber: invoice.purchaseOrderNumber || '—',
                        referenceNumber: invoice.referenceNumber || '—',
                        currencyName: invoice.currencyName ?? '',
                        totalInvoiceAmount: formatAmount(invoice.totalInvoiceAmount),
                        balance: formatAmount(invoice.balance),
                        amountInWords: invoice.amountInWords ?? '',

                        // Prefixed customerEmail prevents overwriting company header email.
                        customerName: customer.customerName ?? '',
                        customerAddress: customer.customerAddress ?? '',
                        customerPhoneNo: customer.customerPhoneNo ?? '',
                        accountNumber: customer.accountNumber || '—',
                        vatNumber: customer.vatNumber || '—',
                        contactPerson: customer.contactPerson ?? '',
                        customerEmail: customer.email ?? '',
                    };

                    const reportData = [headerItem, ...formattedRows];

                    this.reportPath = selectedReportPath;
                    this.reportData = reportData;
                    this.showReport = reportData.length > 0 && Boolean(headerItem.invoiceNumber || formattedRows.length);

                    if (!this.showReport) {
                        this.toastHandler('warning', 'No invoice data found.');
                    }
                } catch (error) {
                    console.error('Invoice report error:', error);

                    this.reportData = [];
                    this.showReport = false;

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Unable to get invoice report.'
                    );
                } finally {
                    this.isLoading = false;
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
                    timerProgressBar: true,
                });
            },
        },

        async mounted() {
            if (typeof reportApiBaseUrl !== 'undefined') {
                this.reportApiBaseUrl = reportApiBaseUrl;
            }

            await this.getInvoices();
            if (this.invoiceId) {
                await this.getReportData();
            }
        },
    });

    app.use(WSelectPlugin);
    app.component('PdfViewer', PdfViewer);
    app.mount('#app');
})();