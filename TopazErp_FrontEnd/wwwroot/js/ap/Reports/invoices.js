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

            // Handle dd-MMM-yyyy (e.g. "12-Nov-2026").
            const dMonY = /^(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{4})$/.exec(raw);

            if (dMonY) {
                const months = {
                    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
                    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
                };
                const month = months[dMonY[2].toLowerCase()];
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

    // Format amounts with thousands separators and 2 decimals
    // (e.g. 6000 -> "6,000.00"). Negatives are shown in brackets.
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

    // The API returns the logo as raw base64 — convert it to a data URI so
    // <img src="{{companyLogo}}"> can render it. Falls back to a transparent
    // pixel when there is no logo.
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
                reportHeader: [],

                reportPath: '',
                reportData: [],
                viewerColor: '#ff2056',
                showReport: false,

                reportPathConfig: {
                    invoiceReportPath: '/ReportTemplates/Ap/ap-invoice-summary.html',
                    supplierInvoicesReportPath: '/ReportTemplates/Ap/ap-invoice-supplier.html',
                },
            };
        },

        computed: {
            reportTitle() {
                let title = 'AP INVOICES';

                if (this.reportType === 'summary-report') {
                    title = 'Invoice Summary';
                } else if (this.reportType === 'bySupplier') {
                    title = 'Invoice Summary Report For Supplier';
                } else if (this.reportType === 'byDate') {
                    title = `Invoice Summary for the period ${this.startDate} to ${this.endDate}`;
                } else if (this.reportType === 'byInvoiceRange') {
                    title = `Invoice Summary for the ranges ${this.startNumber} to ${this.endNumber}`;
                }

                return title;
            },
        },

        methods: {
            // Handle direct arrays and common ABP response wrappers.
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

            async getReportData() {
                if (this.isLoading) return;

                let url = '/Ap/GetAllApInvoices';

                // Every invoice report now uses an HTML template. The
                // By Supplier report uses the supplier invoices template.
                let selectedReportPath =
                    this.reportType === 'bySupplier'
                        ? this.reportPathConfig.supplierInvoicesReportPath
                        : this.reportPathConfig.invoiceReportPath;

                switch (this.reportType) {
                    case 'summary-report':
                        break;

                    case 'bySupplier':
                        if (!this.supplierId) {
                            this.toastHandler('warning', 'Please select a supplier.');
                            return;
                        }

                        url = `/Ap/GetApInvoiceReport?SupplierId=${encodeURIComponent(this.supplierId)}`;
                        break;

                    case 'byBatch':
                        if (!this.batchNumber) {
                            this.toastHandler('warning', 'Please select a batch number.');
                            return;
                        }

                        url = `/Ap/GetApInvoiceByBatch?batchNumber=${encodeURIComponent(this.batchNumber)}`;
                        break;

                    case 'byInvoiceNumber':
                        if (!this.invoiceNumber) {
                            this.toastHandler('warning', 'Please select an invoice number.');
                            return;
                        }

                        url = `/Ap/GetApInvoiceByInvoiceNumber?invoiceNumber=${encodeURIComponent(this.invoiceNumber)}`;
                        break;

                    case 'byDate':
                        if (!this.startDate || !this.endDate) {
                            this.toastHandler('warning', 'Please select both start and end dates.');
                            return;
                        }

                        if (this.startDate > this.endDate) {
                            this.toastHandler('warning', 'Start date cannot be greater than end date.');
                            return;
                        }

                        url = `/Ap/GetApInvoiceByDate?startDate=${encodeURIComponent(this.startDate)}&endDate=${encodeURIComponent(this.endDate)}`;
                        break;

                    case 'byInvoiceRange':
                        if (this.startNumber === '' || this.endNumber === '') {
                            this.toastHandler('warning', 'Please enter both invoice numbers.');
                            return;
                        }

                        if (
                            !Number.isFinite(Number(this.startNumber)) ||
                            !Number.isFinite(Number(this.endNumber)) ||
                            Number(this.startNumber) > Number(this.endNumber)
                        ) {
                            this.toastHandler('warning', 'Please enter a valid invoice number range.');
                            return;
                        }

                        url = `/Ap/GetApInvoiceByRange?startNumber=${encodeURIComponent(this.startNumber)}&endNumber=${encodeURIComponent(this.endNumber)}`;
                        break;

                    default:
                        this.toastHandler('warning', 'Please select a valid report type.');
                        return;
                }

                this.isLoading = true;

                try {
                    const response = await axios.get(url);

                    const result = response.data?.result;
                    const rows = this.unwrapList(result !== undefined ? { result } : response.data)
                        .filter((row) => row && typeof row === 'object' && Object.keys(row).length > 0);

                    if (!rows.length) {
                        this.reportData = [];
                        this.showReport = false;
                        this.reportPath = selectedReportPath;
                        this.toastHandler('warning', 'No invoice data found.');
                        return;
                    }

                    const header = await this.getReportHeader();

                    // The header comes back as an array with one object —
                    // take the first item so reportData[0] is always the
                    // header (even if the header array is empty).
                    const headerObj = Array.isArray(header)
                        ? (header[0] || {})
                        : (header || {});

                    // Format the amount/date fields on every row so the
                    // template shows "6,000.00" instead of "6000".
                    // AP rows may carry the party as supplier*/vendor*;
                    // expose it as supplierName without dropping what was sent.
                    const formattedRows = rows.map((row) => ({
                        ...row,
                        supplierName: row.supplierName ?? row.vendorName ?? row.customerName ?? '',
                        supplierAccountNumber:
                            row.supplierAccountNumber ??
                            row.vendorAccountNumber ??
                            row.accountNumber ??
                            '',
                        invoiceDate: isoDate(row.invoiceDate),
                        balance: formatAmount(row.balance),
                        totalInvoiceAmount: formatAmount(row.totalInvoiceAmount),
                        paidAmount: formatAmount(row.paidAmount),
                    }));

                    const selectedSupplier = this.supplierList.find(
                        (supplier) => supplier.id === this.supplierId
                    );

                    // Convert the logo to a data URI and add the current date
                    // so the template's {{companyLogo}} and {{CurrentDate}}
                    // placeholders are filled. The supplier name is added too —
                    // the supplier invoices template shows it in its party
                    // block (falls back to the first row's supplierName).
                    const headerItem = {
                        ...headerObj,
                        companyLogo: toLogoDataUri(headerObj.companyLogo),
                        CurrentDate: today,
                        reportTitle: headerObj.reportTitle || this.reportTitle,
                        supplierName: selectedSupplier
                            ? selectedSupplier.name
                            : (formattedRows[0]?.supplierName || ''),
                        supplierAccountNumber:
                            selectedSupplier?.accountNumber ||
                            formattedRows[0]?.supplierAccountNumber ||
                            '',
                    };

                    // reportData = [header, ...invoiceRows]. The PdfViewer
                    // treats the first item as the header (top-level
                    // placeholders) and the rest as `rows` for the template's
                    // data-repeat loops — all markup lives in the template.
                    const reportData = [headerItem, ...formattedRows];

                    this.reportPath = selectedReportPath;
                    this.reportData = reportData;
                    this.showReport = reportData.length > 1;

                    if (!this.showReport) {
                        this.toastHandler('warning', 'No invoice data found.');
                    }
                } catch (error) {
                    console.error('Invoice report error:', error);

                    this.reportData = [];
                    this.showReport = false;

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Unable to get invoice report data.'
                    );
                } finally {
                    this.isLoading = false;
                }
            },

            async getSuppliers() {
                try {
                    const response = await axios.get('/SharedResource/GetSuppliers');

                    this.supplierList = this.unwrapList(response.data);

                    if (this.supplierList.length > 0 && !this.supplierId) {
                        this.supplierId = this.supplierList[0].id;
                    }
                } catch (error) {
                    console.error('Get suppliers error:', error);

                    this.supplierList = [];
                    this.supplierId = '';

                    this.toastHandler('error', 'Unable to get suppliers.');
                }
            },

            async getInvoices() {
                try {
                    const response = await axios.get('/Ap/GetInvoices');

                    const invoices = this.unwrapList(response.data);

                    this.invoiceList = invoices.filter(
                        (invoice) => invoice.isCanceled === false
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
                    timerProgressBar: true,
                });
            },
        },

        async mounted() {
            this.reportApiBaseUrl = reportApiBaseUrl;

            // Load the dropdown sources first so the header lookup below can
            // resolve the selected supplier, then render the default report.
            await this.getSuppliers();
            await this.getInvoices();
            await this.getReportData();
        },
    });

    app.component('PdfViewer', PdfViewer);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
