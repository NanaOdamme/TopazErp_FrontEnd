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
        currencyName: '',
        currencyCode: '',
        customerName: '',
        accountNo: '',
        batchNumber: '',
        invoiceNo: '',
        transactionDate: '',
        modeOfPayment: '',
        bankName: '',
        bankBranch: '',
        chequeNo: '',
        chequeDate: '',
        description: '',
        buyRate: '',
        invoiceBalance: '',
        amount: '',
        rowClass: '',
    };

    const formatRow = (row) => {
        // Exclude GL account fields from the report payload.
        const { liabilityGlId, liabilityName, ...safeRow } = row;

        return {
            ...blankRow,
            ...safeRow,
            customerName: safeRow.customerName ?? '',
            accountNo: safeRow.accountNo ?? '',
            batchNumber: safeRow.batchNumber ?? '',
            invoiceNo: safeRow.invoiceNo ?? '',
            modeOfPayment: safeRow.modeOfPayment ?? '',
            bankName: safeRow.bankName ?? '',
            bankBranch: safeRow.bankBranch ?? '',
            chequeNo: safeRow.chequeNo ?? '',
            description: safeRow.description ?? '',
            buyRate: safeRow.buyRate ?? '',
            transactionDate: isoDate(safeRow.transactionDate),
            chequeDate: isoDate(safeRow.chequeDate),
            invoiceBalance: formatAmount(safeRow.invoiceBalance),
            amount: formatAmount(safeRow.amount),
        };
    };

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

            let totalAmount = 0;

            groupRows.forEach((row) => {
                totalAmount += toNumber(row.amount);

                output.push({
                    ...formatRow(row),
                    currencyName: '', // shown once in the group header
                    rowClass: 'data-row',
                });
            });

            if (totals) {
                output.push({
                    ...blankRow,
                    transactionDate: `Total ${currency}`,
                    amount: formatAmount(totalAmount),
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

                reportType: 'summary-report',
                reportApiBaseUrl: '',

                invoiceList: [],
                invoiceId: '',

                voucherList: [],
                voucherId: '',

                startDate: isoDate(new Date()),
                endDate: isoDate(new Date()),

                supplierList: [],
                supplierId: '',

                reportHeader: [],
                reportPath: '',
                reportData: [],
                viewerColor: 'blue',
                showReport: false,

                reportPathConfig: {
                    summaryReportPath: '/ReportTemplates/Ar/ar-credit-memo.html',
                },
            };
        },

        computed: {
            reportTitle() {
                return 'Credit Memos';
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

                this.isLoading = true;

                const selectedReportPath = this.reportPathConfig.summaryReportPath;

                try {
                    const response = await axios.get('/Ar/GetCreditMemos');
                    const rows = this.unwrapList(response.data);

                    if (!rows.length) {
                        this.reportData = [];
                        this.showReport = false;
                        this.toastHandler('warning', 'No credit memo report data was returned.');
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
                    };

                    const reportData = [headerItem, ...formattedRows];

                    this.reportPath = selectedReportPath;
                    this.reportData = reportData;
                    this.showReport = reportData.length > 1;

                    if (!this.showReport) {
                        this.toastHandler('warning', 'No data found.');
                    }
                } catch (error) {
                    console.error('Error generating Credit Memo report:', error);

                    this.reportData = [];
                    this.showReport = false;

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Unable to get credit memo report data.'
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

            await this.getReportData();
        },
    });

    app.use(WSelectPlugin);
    app.component('PdfViewer', PdfViewer);
    app.mount('#app');
})();