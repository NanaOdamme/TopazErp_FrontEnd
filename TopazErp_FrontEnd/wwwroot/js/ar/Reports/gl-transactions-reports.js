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
        currencyName: '',
        currencyCode: '',
        transactionDate: '',
        ouName: '',
        transactionSource: '',
        batchNumber: '',
        referenceNumber: '',
        chequeNo: '',
        accountName: '',
        description: '',
        debitAmount: '',
        creditAmount: '',
        rowClass: '',
    };

    const formatRow = (row) => ({
        ...blankRow,
        ...row,
        currencyCode: row.currencyCode ?? '',
        ouName: row.ouName ?? '',
        transactionSource: row.transactionSource ?? '',
        batchNumber: row.batchNumber ?? '',
        referenceNumber: row.referenceNumber ?? '',
        chequeNo: row.chequeNo ?? '',
        accountName: row.accountName ?? '',
        description: row.description ?? '',
        transactionDate: isoDate(row.transactionDate),
        debitAmount: formatAmount(row.debitAmount),
        creditAmount: formatAmount(row.creditAmount),
    });

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
            output.push({
                ...blankRow,
                currencyName: currency,
                rowClass: 'group-header',
            });

            const groupTotals = {
                debitAmount: 0,
                creditAmount: 0,
            };

            groupRows.forEach((row) => {
                groupTotals.debitAmount += toNumber(row.debitAmount);
                groupTotals.creditAmount += toNumber(row.creditAmount);

                output.push({
                    ...formatRow(row),
                    currencyName: '', // shown once in the group header
                    rowClass: 'data-row',
                });
            });

            if (totals) {
                output.push({
                    ...blankRow,
                    currencyName: `Total ${currency}`,
                    debitAmount: formatAmount(groupTotals.debitAmount),
                    creditAmount: formatAmount(groupTotals.creditAmount),
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
                isShimmerLoading: false,
                isLoading: false,
                payload: {},

                startDate: isoDate(new Date()),
                endDate: isoDate(new Date()),

                reportApiBaseUrl: '',
                showMultiCurrency: false,

                reportHeader: [],
                reportPath: '',
                reportData: [],
                viewerColor: 'blue',
                showReport: false,

                reportPathConfig: {
                    summaryReportPath: '/ReportTemplates/Ar/ar-gl-transactions.html',
                },
            };
        },

        computed: {
            reportTitle() {
                return 'AR G/L Transactions';
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

            async getReportData() {
                if (this.isLoading) return;

                const startDate = isoDate(this.startDate);
                const endDate = isoDate(this.endDate);

                if (!startDate || !endDate) {
                    this.toastHandler('warning', 'Please provide valid start and end dates.');
                    return;
                }

                if (startDate > endDate) {
                    this.toastHandler('warning', 'Start date cannot be greater than end date.');
                    return;
                }

                this.isLoading = true;

                const selectedReportPath = this.reportPathConfig.summaryReportPath;
                const url = `/Ar/GetGlTransaction?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&isMultiCurrency=${encodeURIComponent(this.showMultiCurrency)}`;

                try {
                    const response = await axios.get(url);
                    const rows = this.unwrapList(response.data);

                    if (!rows.length) {
                        this.reportData = [];
                        this.showReport = false;
                        this.toastHandler('warning', 'No GL transaction data was returned.');
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

                    const headerItem = {
                        ...headerObj,
                        companyLogo: toLogoDataUri(headerObj.companyLogo),
                        CurrentDate: today,
                        reportTitle: headerObj.reportTitle || this.reportTitle,
                        startDate,
                        endDate,
                        multiCurrencyLabel: this.showMultiCurrency ? 'Yes' : 'No',
                    };

                    const reportData = [headerItem, ...formattedRows];

                    this.reportPath = selectedReportPath;
                    this.reportData = reportData;
                    this.showReport = reportData.length > 1;

                    if (!this.showReport) {
                        this.toastHandler('warning', 'No data found.');
                    }
                } catch (error) {
                    console.error('Error generating GL Transactions report:', error);

                    this.reportData = [];
                    this.showReport = false;

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Unable to get GL transaction data.'
                    );
                } finally {
                    this.isLoading = false;
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

        watch: {
            showMultiCurrency() {
                this.getReportData();
            },
        },

        async mounted() {
            if (typeof reportApiBaseUrl !== 'undefined') {
                this.reportApiBaseUrl = reportApiBaseUrl;
            }

            await this.getReportData();
        },
    });

    app.use(WSelectPlugin);
    app.component('PdfViewer', PdfViewer);
    app.mount('#app');
})();