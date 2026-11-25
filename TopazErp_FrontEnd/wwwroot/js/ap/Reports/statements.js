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

    // Blank out "empty" .NET dates (0001-01-01 / 1900-01-01) so the template
    // shows nothing instead of a nonsense date.
    const loadedDate = (value) => {
        const iso = isoDate(value);
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
        if (iso.startsWith('0001-') || iso.startsWith('0000-') || iso === '1900-01-01') return '';
        return iso;
    };

    const today = isoDate(new Date());

    // Negative numbers are shown in brackets: -1234.5 -> (1,234.50)
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

    const toNumber = (value) => {
        if (typeof value === 'string') {
            const cleaned = value.trim().replace(/,/g, '');
            if (/^\(.*\)$/.test(cleaned)) {
                const neg = Number(cleaned.slice(1, -1));
                return Number.isFinite(neg) ? -neg : 0;
            }
            const n = Number(cleaned);
            return Number.isFinite(n) ? n : 0;
        }
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    // Blank row so every placeholder in the template has a value
    const blankRow = {
        currencyName: '',
        currencyCode: '',
        invoiceDate: '',
        invoiceNumber: '',
        totalInvoiceAmount: '',
        paidAmount: '',
        paymentDate: '',
        description: '',
        balance: '',
        outstanding: '',
        rowClass: '',
    };

    const formatRow = (row) => ({
        ...blankRow,
        ...row,
        // AP statement rows may carry the party as supplier*/vendor*.
        supplierName: row.supplierName ?? row.vendorName ?? row.customerName ?? '',
        supplierAccountNumber:
            row.supplierAccountNumber ?? row.vendorAccountNumber ?? row.accountNumber ?? '',
        invoiceNumber: row.invoiceNumber ?? '',
        description: row.description ?? '',
        invoiceDate: loadedDate(row.invoiceDate),
        paymentDate: loadedDate(row.paymentDate),
        totalInvoiceAmount: formatAmount(row.totalInvoiceAmount),
        paidAmount: formatAmount(row.paidAmount),
        amountPaid: formatAmount(row.amountPaid),
        balance: formatAmount(row.balance),
        outstanding: formatAmount(row.outstanding),
    });

    // Group by currencyName (order of first appearance).
    // totals: true  -> adds a total row per currency
    // totals: false -> header + rows only
    const buildGroupedRows = (rows, { totals = true } = {}) => {
        const groups = new Map();

        rows.forEach((row) => {
            const key =
                (row.currencyName ?? '').toString().trim() ||
                (row.currencyCode ?? '').toString().trim() ||
                'N/A';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(row);
        });

        const output = [];

        groups.forEach((groupRows, currency) => {
            output.push({ ...blankRow, currencyName: currency, rowClass: 'group-header' });

            let invoiceTotal = 0;
            let paidTotal = 0;

            groupRows.forEach((row) => {
                invoiceTotal += toNumber(row.totalInvoiceAmount);
                paidTotal += toNumber(row.paidAmount);

                output.push({
                    ...formatRow(row),
                    currencyName: '', // shown once in the group header
                    rowClass: 'data-row',
                });
            });

            if (totals) {
                output.push({
                    ...blankRow,
                    invoiceNumber: `Total ${currency}`,
                    totalInvoiceAmount: formatAmount(invoiceTotal),
                    paidAmount: formatAmount(paidTotal),
                    rowClass: 'group-total',
                });
            }
        });

        return output;
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
                isShimmerLoading: false,
                isLoading: false,
                payload: {},

                reportType: 'type1',

                startDate: today,
                endDate: today,

                reportApiBaseUrl: '',
                reportPath: '',

                supplierList: [],
                supplierId: '',

                reportHeader: [],
                reportData: [],
                viewerColor: 'blue',
                showReport: false,
                reportTitle: 'Supplier Statements',

                reportPathConfig: {
                    summaryReportPath: '/ReportTemplates/Ap/ap-statement-type1.html',
                    type1ReportPath: '/ReportTemplates/Ap/ap-statement-type2.html',
                    type2ReportPath: '/ReportTemplates/Ap/ap-statement-type3.html',
                },
            };
        },

        methods: {
            async getReportHeader() {
                let title = 'Supplier Statements';

                if (this.reportType === 'type2' || this.reportType === 'type3') {
                    title = `For the Duration of ${this.startDate} to ${this.endDate}`;
                }

                this.reportTitle = title;

                const url = `/Ap/GetReportHeader?title=${encodeURIComponent(title)}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },

            async getReportData() {
                if (this.isLoading) return;

                const startDate = isoDate(this.startDate);
                const endDate = isoDate(this.endDate);

                // Validate dates only for Type 2 and Type 3.
                if (this.reportType === 'type2' || this.reportType === 'type3') {
                    if (!startDate || !endDate) {
                        this.toastHandler('warning', 'Please select both start and end dates.');
                        return;
                    }

                    // YYYY-MM-DD strings can be compared directly.
                    if (startDate > endDate) {
                        this.toastHandler('warning', 'Start date cannot be greater than end date.');
                        return;
                    }
                }

                if (!this.supplierId) {
                    this.toastHandler('warning', 'Please select a supplier.');
                    return;
                }

                let url = '';
                let selectedReportPath = '';

                switch (this.reportType) {
                    case 'type1':
                        selectedReportPath = this.reportPathConfig.summaryReportPath;

                        url = `/Ap/GetApStatement?supplierId=${encodeURIComponent(this.supplierId)}`;
                        break;

                    case 'type2':
                        selectedReportPath = this.reportPathConfig.type1ReportPath;

                        url = `/Ap/GetApStatementType2?supplierId=${encodeURIComponent(this.supplierId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
                        break;

                    case 'type3':
                        selectedReportPath = this.reportPathConfig.type2ReportPath;

                        url = `/Ap/GetApStatementType3?supplierId=${encodeURIComponent(this.supplierId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
                        break;

                    default:
                        this.toastHandler('warning', 'Please select a valid report type.');
                        return;
                }

                this.isLoading = true;

                try {
                    const response = await axios.get(url);

                    const result = response.data?.result;
                    const rows = (Array.isArray(result) ? result : [result]).filter(
                        (row) => row && typeof row === 'object' && Object.keys(row).length > 0
                    );

                    if (!rows.length) {
                        this.reportData = [];
                        this.showReport = false;
                        this.reportPath = selectedReportPath;
                        this.toastHandler('warning', 'No statement data was returned.');
                        return;
                    }

                    const header = await this.getReportHeader();
                    const headerObj = Array.isArray(header)
                        ? (header[0] || {})
                        : (header || {});

                    const selectedSupplier = this.supplierList.find(
                        (supplier) => supplier.id === this.supplierId
                    );

                    // Type 3 is rendered without per-currency total rows;
                    // type 1 and type 2 include them.
                    const formattedRows = this.reportType === 'type3'
                        ? buildGroupedRows(rows, { totals: false })
                        : buildGroupedRows(rows);

                    const firstDataRow = formattedRows.find((r) => r.rowClass === 'data-row');

                    const headerItem = {
                        ...headerObj,
                        companyLogo: toLogoDataUri(headerObj.companyLogo),
                        CurrentDate: today,
                        reportTitle: headerObj.reportTitle || this.reportTitle,

                        // Statement period (blank for type 1, which is "as at now").
                        startDate: this.reportType === 'type1' ? '' : startDate,
                        endDate: this.reportType === 'type1' ? '' : endDate,

                        supplierName: selectedSupplier
                            ? selectedSupplier.name
                            : (firstDataRow?.supplierName || ''),
                        supplierAccountNumber:
                            selectedSupplier?.accountNumber ||
                            firstDataRow?.supplierAccountNumber ||
                            '',
                        accountNumber:
                            selectedSupplier?.accountNumber ||
                            firstDataRow?.supplierAccountNumber ||
                            '',
                        contactPhone: selectedSupplier?.contactPersonPhone || '',
                        supplierEmail: selectedSupplier?.email || '',

                        // Aliases so an AP template copied from the AR
                        // template (customerName / accountNumber / ...)
                        // still renders without edits.
                        customerName: selectedSupplier
                            ? selectedSupplier.name
                            : (firstDataRow?.supplierName || ''),
                    };

                    const reportData = [headerItem, ...formattedRows];

                    this.reportPath = selectedReportPath;
                    this.reportData = reportData;
                    this.showReport = reportData.length > 1;

                    if (!this.showReport) {
                        this.toastHandler('warning', 'No data found.');
                    }
                } catch (error) {
                    console.error('Supplier statement error:', error);

                    this.reportData = [];
                    this.showReport = false;

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Unable to get supplier statement data.'
                    );
                } finally {
                    this.isLoading = false;
                }
            },

            async getSuppliers() {
                this.isShimmerLoading = true;

                try {
                    const response = await axios.get('/SharedResource/GetSuppliers');

                    let suppliers = response.data?.result;

                    // Handle possible ABP response wrappers.
                    if (!Array.isArray(suppliers)) {
                        suppliers =
                            suppliers?.result ??
                            suppliers?.items ??
                            suppliers?.data ??
                            [];
                    }

                    this.supplierList = Array.isArray(suppliers) ? suppliers : [];

                    if (this.supplierList.length > 0) {
                        this.supplierId = this.supplierList[0].id;
                    } else {
                        this.supplierId = '';
                    }
                } catch (error) {
                    console.error('Get suppliers error:', error);

                    this.supplierList = [];
                    this.supplierId = '';

                    this.toastHandler('error', 'Unable to get suppliers.');
                } finally {
                    this.isShimmerLoading = false;
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

            await this.getSuppliers();
        },
    });

    app.component('PdfViewer', PdfViewer);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
