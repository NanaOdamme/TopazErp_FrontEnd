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
        supplierName: '',
        supplierAccountNumber: '',
        amount: '',
        transactionDate: '',
        rowClass: '',
    };

    // AP payloads may come back with supplier* or vendor* / customer* names,
    // so normalise them once here before the report template sees the row.
    const formatRow = (row) => ({
        ...blankRow,
        ...row,
        supplierName: row.supplierName ?? row.vendorName ?? row.customerName ?? '',
        supplierAccountNumber:
            row.supplierAccountNumber ?? row.vendorAccountNumber ?? row.accountNumber ?? '',
        transactionDate: isoDate(row.transactionDate),
        amount: formatAmount(row.amount),
        paidAmount: formatAmount(row.paidAmount),
        totalInvoiceAmount: formatAmount(row.totalInvoiceAmount),
        amountPaid: formatAmount(row.amountPaid),
        balance: formatAmount(row.balance),
    });

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

            let total = 0;

            groupRows.forEach((row) => {
                total += toNumber(row.amount);

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
                    amount: formatAmount(total),
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

                reportType: 'summary',
                reportStatus: 'all',

                reportApiBaseUrl: '',

                balanceId: '',
                supplierId: '',

                supplierList: [],
                openingBalanceList: [],
                reportHeader: [],
                reportPath: '',
                reportData: [],
                viewerColor: '#ff2056',
                showReport: false,
                reportPathConfig: {
                    summaryReportPath: '/ReportTemplates/Ap/ap-openingBalances.html',
                    supplierReport: '/ReportTemplates/Ap/ap-balance-supplier.html',
                    type2Report: '/ReportTemplates/Ap/ap-openingBalances.html',
                },
            };
        },

        computed: {
            reportTitle() {
                if (this.reportType === 'summary') {
                    const statusLabels = {
                        all: 'All',
                        posted: 'Posted',
                        unposted: 'Unposted',
                    };

                    const status = statusLabels[String(this.reportStatus || '').toLowerCase()];

                    return status
                        ? `Summary Report for ${status} Opening Balances`
                        : 'Summary Report for Opening Balances';
                }

                const titles = {
                    bySupplier: 'Supplier Opening Balances',
                    type2: 'Local Currency Opening Balances',
                };

                return titles[this.reportType] || 'Opening Balances Report';
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

            async getReportData() {
                if (this.isLoading) return;

                if (this.reportType === 'bySupplier' && !this.supplierId) {
                    this.toastHandler('warning', 'Please select a supplier.');
                    return;
                }

                let url = '';
                let selectedReportPath = '';

                switch (this.reportType) {
                    case 'summary':
                        selectedReportPath = this.reportPathConfig.summaryReportPath;

                        url = `/Ap/GetApBalancesReport?status=${encodeURIComponent(this.reportStatus)}`;
                        break;

                    case 'bySupplier':
                        selectedReportPath = this.reportPathConfig.supplierReport;

                        url = `/Ap/GetApBalancesBySupplier?SupplierId=${encodeURIComponent(this.supplierId)}&status=${encodeURIComponent(this.reportStatus)}`;
                        break;

                    case 'type2':
                        selectedReportPath = this.reportPathConfig.type2Report;

                        url = `/Ap/GetAllConvertedApBalances?status=${encodeURIComponent(this.reportStatus)}`;
                        break;

                    default:
                        this.toastHandler('warning', 'Please select a valid report type.');
                        return;
                }

                this.isLoading = true;

                try {
                    const response = await axios.get(url);

                    const result = response.data?.result;

                    // The API sometimes returns a single object (or nothing at
                    // all) instead of a list — normalise it, and treat an
                    // empty object as "no data".
                    const rows = this.unwrapList(result !== undefined ? { result } : response.data)
                        .filter((row) => row && typeof row === 'object' && Object.keys(row).length > 0);

                    if (!rows.length) {
                        this.reportData = [];
                        this.showReport = false;
                        this.reportPath = selectedReportPath;
                        this.toastHandler('warning', 'No opening balances data was returned.');
                        return;
                    }

                    const header = await this.getReportHeader();
                    const headerObj = Array.isArray(header)
                        ? (header[0] || {})
                        : (header || {});

                    const selectedSupplier = this.supplierList.find(
                        (supplier) => supplier.id === this.supplierId
                    );

                    const data = buildGroupedRows(rows);
                    const formattedRows = data.map((item, index) => ({
                        ...item,
                        rowNumber: index + 1,
                    }));

                    const firstDataRow = formattedRows.find((r) => r.rowClass === 'data-row');

                    const headerItem = {
                        ...headerObj,
                        companyLogo: toLogoDataUri(headerObj.companyLogo),
                        CurrentDate: today,
                        reportStatus: this.reportStatus,
                        supplierName: selectedSupplier
                            ? selectedSupplier.name
                            : (this.reportType === 'bySupplier' ? (firstDataRow?.supplierName || '') : ''),
                        supplierAccountNumber:
                            selectedSupplier?.accountNumber ||
                            (this.reportType === 'bySupplier' ? (firstDataRow?.supplierAccountNumber || '') : ''),
                        contactPhone: selectedSupplier?.contactPersonPhone || '',
                    };

                    const reportData = [headerItem, ...formattedRows];

                    this.reportPath = selectedReportPath;
                    this.reportData = reportData;
                    this.showReport = reportData.length > 1;

                    if (!this.showReport) {
                        this.toastHandler('warning', 'No data found.');
                    }
                } catch (error) {
                    console.error('Opening balances report error:', error);

                    this.reportData = [];
                    this.showReport = false;

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Unable to get opening balances report.'
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
            this.reportApiBaseUrl = reportApiBaseUrl;

            await this.getSuppliers();
            await this.getReportData();
        },
    });

    app.use(WSelectPlugin);
    app.component('PdfViewer', PdfViewer);
    app.mount('#app');
})();
