(() => {
    'use strict';

    const isoDate = (date) => {
        if (date === null || date === undefined || date === '') return '';

        if (typeof date === 'string') {
            const raw = date.trim();
            if (!raw) return '';
            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

            const ms = /\/Date\((-?\d+)/.exec(raw);
            if (ms) {
                const d = new Date(Number(ms[1]));
                return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }

            const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(raw);
            if (dmy) return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;

            const ymd = /^(\d{4})[/](\d{1,2})[/](\d{1,2})/.exec(raw);
            if (ymd) return `${ymd[1]}-${pad(ymd[2])}-${pad(ymd[3])}`;
        }

        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };

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
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    const formatRow = (row) => ({
        ...row,
        paidAmount: formatAmount(row.paidAmount),
        totalInvoiceAmount: formatAmount(row.totalInvoiceAmount),
        amountPaid: formatAmount(row.amountPaid),
        balance: formatAmount(row.balance),
    });

// Blank row so every placeholder in the template has a value
    // Blank row so every placeholder in the template has a value
    const blankRow = {
        currencyName: '',
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

// Group by currencyName (order of first appearance).
// totals: true  -> adds a total row per currency
// totals: false -> header + rows only
    const buildGroupedRows = (rows, { totals = true } = {}) => {
        const groups = new Map();

        rows.forEach((row) => {
            const key = (row.currencyName ?? '').toString().trim() || 'N/A';
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
                    currencyName: '',          // shown once in the group header
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

                customerList: [],
                customerId: '',
                reportHeader:[],
                reportData:[],
                viewerColor: 'blue',
                showReport: false,
                reportTitle: 'Customer Statements',
                reportPathConfig: {
                    summaryReportPath: '/ReportTemplates/Ar/ar-statement-type1.html',
                    type1ReportPath: '/ReportTemplates/Ar/ar-statement-type2.html',
                    type2ReportPath: '/ReportTemplates/Ar/ar-statement-type3.html',
                },
            };
        },

        methods: {
            // report header
            async getReportHeader() {
                let title = 'Customer Statements';

                if (this.reportType === 'type2' || this.reportType === 'type3') {
                    title = `For the Duration of ${this.startDate} to ${this.endDate}`;
                }

                const url = `/Ap/GetReportHeader?title=${encodeURIComponent(title)}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },
            async getReportData() {
                if (this.isLoading) return;

                // Validate dates only for Type 2 and Type 3
                if (this.reportType === 'type2' || this.reportType === 'type3') {
                    if (!this.startDate || !this.endDate) {
                        this.toastHandler(
                            'warning',
                            'Please select both start and end dates.'
                        );
                        return;
                    }

                    // YYYY-MM-DD strings can be compared directly.
                    if (this.startDate > this.endDate) {
                        this.toastHandler(
                            'warning',
                            'Start date cannot be greater than end date.'
                        );
                        return;
                    }
                }

                // Validate customer
                if (!this.customerId) {
                    this.toastHandler(
                        'warning',
                        'Please select a customer.'
                    );
                    return;
                }

                let url = '';
                let selectedReportPath = '';

                switch (this.reportType) {
                    case 'type1':
                        selectedReportPath = this.reportPathConfig.summaryReportPath;

                        url = `/Ar/GetStatement?customerId=${encodeURIComponent(this.customerId)}`;
                        break;

                    case 'type2':
                        selectedReportPath = this.reportPathConfig.type1ReportPath;

                        url = `/Ar/GetStatementType2?customerId=${encodeURIComponent(this.customerId)}&startDate=${encodeURIComponent(this.startDate)}&endDate=${encodeURIComponent(this.endDate)}`;
                        break;

                    case 'type3':
                        selectedReportPath = this.reportPathConfig.type2ReportPath;

                        url = `/Ar/GetStatementType3?customerId=${encodeURIComponent(this.customerId)}&startDate=${encodeURIComponent(this.startDate)}&endDate=${encodeURIComponent(this.endDate)}`;
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

                    const result = response.data.result;
                    this.reportPath = selectedReportPath;
                    const outstanding = []
                    const header = await this.getReportHeader();
                    const headerObj = Array.isArray(header)
                        ? (header[0] || {})
                        : (header || {});

                    const rows = Array.isArray(result) ? result : [result];
                    const selectedCustomer = this.customerList.find(
                        (customer) => customer.id === this.customerId
                    );
                    // Only the HTML template (type1) is grouped; the RDL reports just get bracketed negatives
                    const formattedRows = this.reportType === 'type3'
                        ? buildGroupedRows(rows, { totals: false })
                        : buildGroupedRows(rows);
                    
             
                        
                    
                    const headerItem = {
                        ...headerObj,
                        companyLogo: toLogoDataUri(headerObj.companyLogo),
                        CurrentDate: today,
                        customerName: selectedCustomer
                            ? selectedCustomer.name
                            : (formattedRows[0]?.customerName || ''),
                        accountNumber: selectedCustomer.accountNumber,
                        contactPhone: selectedCustomer.contactPersonPhone,
                    };
                    const reportData = [headerItem, ...formattedRows];
                    this.reportPath = selectedReportPath;
                    this.reportData = reportData;

                    // >>> ADDED: show the report in the PdfViewer.
                    this.showReport = reportData.length > 1;

                    if (!this.showReport) {
                        this.toastHandler('warning', 'No data found.');
                    }


                } catch (error) {
                    console.error('Customer statement error:', error);

                    this.toastHandler(
                        'error',
                        error.response?.data?.message ||
                        'Unable to get customer statement data.'
                    );
                } finally {
                    this.isLoading = false;
                }
            },
            
            async getCustomers() {
                this.isShimmerLoading = true;

                try {
                    const response = await axios.get(
                        '/SharedResource/GetCustomers'
                    );

                    let customers = response.data.result;

                    // Handle possible ABP response wrappers.
                    if (!Array.isArray(customers)) {
                        customers =
                            customers?.result ??
                            customers?.items ??
                            customers?.data ??
                            [];
                    }

                    this.customerList = Array.isArray(customers)
                        ? customers
                        : [];

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
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            formatDate(dateInput) {
                return moment(dateInput).format('YYYY-MM-DD');
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
            this.getCustomers();
        }
    });
    app.component('PdfViewer', PdfViewer);
    app.use(WSelectPlugin);
    app.mount('#app');
})();