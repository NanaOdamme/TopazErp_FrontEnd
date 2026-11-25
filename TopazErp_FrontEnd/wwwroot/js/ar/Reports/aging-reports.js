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

    const blankRow = {
        currencyCode: '',
        customerName: '',
        accountNumber: '',
        invoiceNumber: '',
        buyRate: '',
        balance: '',
        totalInvoiceAmount: '',
        paidAmount: '',
        invoiceDate: '',
        projectedPayDate: '',
        purchaseOrderNumber: '',
        agingNumber: '',
        currentDay: '',
        agingFirst: '',
        agingSecond: '',
        agingThird: '',
        rowClass: '',
    };

    const formatRow = (row) => ({
        ...blankRow,
        ...row,
        customerName: row.customerName ?? '',
        accountNumber: row.accountNumber ?? '',
        invoiceNumber: row.invoiceNumber ?? '',
        buyRate: row.buyRate ?? '',
        purchaseOrderNumber: row.purchaseOrderNumber ?? '',
        agingNumber: row.agingNumber ?? '',
        invoiceDate: isoDate(row.invoiceDate),
        projectedPayDate: isoDate(row.projectedPayDate),
        totalInvoiceAmount: formatAmount(row.totalInvoiceAmount),
        paidAmount: formatAmount(row.paidAmount),
        balance: formatAmount(row.balance),
        currentDay: formatAmount(row.currentDay),
        agingFirst: formatAmount(row.agingFirst),
        agingSecond: formatAmount(row.agingSecond),
        agingThird: formatAmount(row.agingThird),
    });

    const buildGroupedRows = (rows, { totals = true } = {}) => {
        const groups = new Map();

        rows.forEach((row) => {
            const key = (row.currencyCode ?? '').toString().trim() || 'N/A';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(row);
        });

        const output = [];

        groups.forEach((groupRows, currency) => {
            output.push({
                ...blankRow,
                currencyCode: currency,
                rowClass: 'group-header',
            });

            const groupTotals = {
                totalInvoiceAmount: 0,
                paidAmount: 0,
                balance: 0,
                currentDay: 0,
                agingFirst: 0,
                agingSecond: 0,
                agingThird: 0,
            };

            groupRows.forEach((row) => {
                groupTotals.totalInvoiceAmount += toNumber(row.totalInvoiceAmount);
                groupTotals.paidAmount += toNumber(row.paidAmount);
                groupTotals.balance += toNumber(row.balance);
                groupTotals.currentDay += toNumber(row.currentDay);
                groupTotals.agingFirst += toNumber(row.agingFirst);
                groupTotals.agingSecond += toNumber(row.agingSecond);
                groupTotals.agingThird += toNumber(row.agingThird);

                output.push({
                    ...formatRow(row),
                    currencyCode: '', // shown once in the group header
                    rowClass: 'data-row',
                });
            });

            if (totals) {
                output.push({
                    ...blankRow,
                    invoiceNumber: `Total ${currency}`,
                    totalInvoiceAmount: formatAmount(groupTotals.totalInvoiceAmount),
                    paidAmount: formatAmount(groupTotals.paidAmount),
                    balance: formatAmount(groupTotals.balance),
                    currentDay: formatAmount(groupTotals.currentDay),
                    agingFirst: formatAmount(groupTotals.agingFirst),
                    agingSecond: formatAmount(groupTotals.agingSecond),
                    agingThird: formatAmount(groupTotals.agingThird),
                    rowClass: 'group-total',
                });
            }
        });

        return output;
    };

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

                reportType: 'byDateSummary',
                startDate: isoDate(new Date()),
                agingInterval: 30,

                reportApiBaseUrl: '',

                customerGroupId: '',
                customerGroupList: [],
                customerGroupName: '',

                customerList: [],
                customerId: '',

                reportHeader: [],
                reportPath: '',
                reportData: [],
                viewerColor: 'blue',
                showReport: false,

                reportPathConfig: {
                    summaryReportPath: '/ReportTemplates/Ar/ar-aging.html',
                    summaryReportByDatePath: '/ReportTemplates/Ar/ar-aging.html',
                    summaryReportByCustomerPath: '/ReportTemplates/Ar/ar-aging-customer.html',
                },
            };
        },

        computed: {
            reportTitle() {
                const titles = {
                    summary: 'Aging Summary Report',
                    byDateSummary: 'Aging Summary by Date',
                    byCustomer: 'Aging by Customer',
                };

                return titles[this.reportType] || 'Aging Report';
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

            async getCustomers() {
                try {
                    const response = await axios.get('/SharedResource/GetCustomers');

                    this.customerList = this.unwrapList(response.data);

                    if (this.customerList.length > 0 && !this.customerId) {
                        this.customerId = this.customerList[0].id;
                    }
                } catch (error) {
                    console.error('Get customers error:', error);

                    this.customerList = [];
                    this.customerId = '';

                    this.toastHandler('error', 'Unable to get customers.');
                }
            },

            async getReportData() {
                if (this.isLoading) return;

                const startDate = isoDate(this.startDate);
                if (!startDate) {
                    this.toastHandler('warning', 'Please select a start date.');
                    return;
                }

                const interval = Number(this.agingInterval);
                if (!Number.isFinite(interval) || interval <= 0) {
                    this.toastHandler('warning', 'Please enter a valid ageing interval.');
                    return;
                }

                if (this.reportType === 'byCustomer' && !this.customerId) {
                    this.toastHandler('warning', 'Please select a customer.');
                    return;
                }

                let url = '';
                let selectedReportPath = '';

                switch (this.reportType) {
                    case 'summary':
                        selectedReportPath = this.reportPathConfig.summaryReportPath;
                        url = `/Ar/GetAgingSummary?startDate=${encodeURIComponent(startDate)}&agingInterval=${encodeURIComponent(interval)}`;
                        break;

                    case 'byDateSummary':
                        selectedReportPath = this.reportPathConfig.summaryReportByDatePath;
                        url = `/Ar/GetAgingByDate?startDate=${encodeURIComponent(startDate)}&agingInterval=${encodeURIComponent(interval)}`;
                        break;

                    case 'byCustomer':
                        selectedReportPath = this.reportPathConfig.summaryReportByCustomerPath;
                        url = `/Ar/GetAgingByCustomer?CustomerId=${encodeURIComponent(this.customerId)}&startDate=${encodeURIComponent(startDate)}&agingInterval=${encodeURIComponent(interval)}`;
                        break;

                    default:
                        this.toastHandler('warning', 'Please select a valid report option.');
                        return;
                }

                this.isLoading = true;

                try {
                    const response = await axios.get(url);
                    const rows = this.unwrapList(response.data);

                    if (!rows.length) {
                        this.reportData = [];
                        this.showReport = false;
                        this.toastHandler('warning', 'No ageing report data was returned.');
                        return;
                    }

                    const header = await this.getReportHeader();
                    const headerObj = Array.isArray(header)
                        ? (header[0] || {})
                        : (header || {});

                    const groupedRows = buildGroupedRows(rows);
                    const formattedRows = groupedRows.map((item, index) => ({
                        ...item,
                        rowNumber: index + 1,
                    }));

                    const selectedCustomer = this.reportType === 'byCustomer'
                        ? this.customerList.find((customer) => customer.id === this.customerId)
                        : null;

                    const firstDataRow = formattedRows.find((r) => r.rowClass === 'data-row');

                    // Shift to 0 - interval, interval+1 - interval*2, etc. if your backend puts 0-30 in CurrentDay.
                    const agingLabels = {
                        currentDayLabel: 'Current',
                        agingFirstLabel: `1 - ${interval}`,
                        agingSecondLabel: `${interval + 1} - ${interval * 2}`,
                        agingThirdLabel: `Over ${interval * 2}`,
                    };

                    const headerItem = {
                        ...headerObj,
                        companyLogo: toLogoDataUri(headerObj.companyLogo),
                        CurrentDate: today,
                        startDate,
                        agingInterval: interval,
                        ...agingLabels,
                        customerName: selectedCustomer
                            ? selectedCustomer.name
                            : (this.reportType === 'byCustomer' ? (firstDataRow?.customerName || '') : ''),
                        accountNumber: selectedCustomer?.accountNumber || (this.reportType === 'byCustomer' ? (firstDataRow?.accountNumber || '') : ''),
                        contactPhone: selectedCustomer?.contactPersonPhone || '',
                    };

                    const reportData = [headerItem, ...formattedRows];

                    this.reportPath = selectedReportPath;
                    this.reportData = reportData;
                    this.showReport = reportData.length > 1;

                    if (!this.showReport) {
                        this.toastHandler('warning', 'No data found.');
                    }
                } catch (error) {
                    console.error('Error loading ageing report:', error);

                    this.reportData = [];
                    this.showReport = false;

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Unable to get ageing report data.'
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

            await this.getCustomers();
            await this.getReportData();
        },
    });

    app.use(WSelectPlugin);
    app.component('PdfViewer', PdfViewer);
    app.mount('#app');
})();