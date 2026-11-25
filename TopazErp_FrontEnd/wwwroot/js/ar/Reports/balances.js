(() => {
    'use strict';
    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
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
    const blankRow = {
        currencyName: '',
        amount: '',
        transactionDate: '',
        rowClass: '',
    };
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
                    currencyName: '',          // shown once in the group header
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
                emptyGuid: '00000000-0000-0000-0000-000000000000',

                isLoading: false,
                payload: {},

                reportType: 'summary',
                reportStatus: 'all',

                reportApiBaseUrl: '',

                balanceId: '',
                customerId: '',

                customerList: [],
                openingBalanceList: [],
                reportHeader:[],
                reportPath: '',
                reportData:[],
                viewerColor: 'blue',
                showReport: false,
                reportPathConfig: {
                    SummaryReportPath: '/ReportTemplates/Ar/ar-openingBalances.html',
                    customerReport: '/ReportTemplates/Ar/ar-balance-customer.html',
                    type2Report: '/ReportTemplates/Ar/ar-openingBalances.html',
                },
            };
        },
        computed: {
            reportTitle() {
                if (this.reportType === 'Summary') {
                    const statusLabels = {
                        all: 'All',
                        posted: 'Posted',
                        unposted: 'Unposted'
                    };

                    const status = statusLabels[
                        String(this.reportStatus || '').toLowerCase()
                        ];

                    return status
                        ? `Summary Report for ${status} Opening Balances`
                        : 'Summary Report for Opening Balances';
                }

                const titles = {
                    byCustomer: 'Customer Opening Balances',
                    type2: 'Local Currency Opening Balances'
                };

                return titles[this.reportType] || 'Opening Balances Report';
            }
        },
        methods: {
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
                const url = `/Ap/GetReportHeader?title=${encodeURIComponent(this.reportTitle)}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },
            async getCustomers() {
                try {
                    const response = await axios.get(
                        '/SharedResource/GetCustomers'
                    );

                    this.customerList = this.unwrapList(response.data);

                    if (
                        this.customerList.length > 0 &&
                        !this.customerId
                    ) {
                        this.customerId = this.customerList[0].id;
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

            async getReportData() {
                if (this.isLoading) return;

                if (
                    this.reportType === 'byCustomer' &&
                    !this.customerId
                ) {
                    this.toastHandler(
                        'warning',
                        'Please select a customer.'
                    );
                    return;
                }

                let url = '';
                let selectedReportPath = '';

                switch (this.reportType) {
                    case 'summary':
                        selectedReportPath =
                            this.reportPathConfig.SummaryReportPath;

                        url = `/Ar/GetBalancesReport?status=${encodeURIComponent(this.reportStatus)}`;
                        break;

                    case 'byCustomer':
                        selectedReportPath =
                            this.reportPathConfig.customerReport;

                        url = `/Ar/GetBalancesByCustomer?CustomerId=${encodeURIComponent(this.customerId)}&status=${encodeURIComponent(this.reportStatus)}`;
                        break;

                    case 'type2':
                        selectedReportPath =
                            this.reportPathConfig.type2Report;

                        url = `/Ar/GetAllConvertedBalances?status=${encodeURIComponent(this.reportStatus)}`;
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

                    const result = response.data.result || {};

                    this.reportPath = selectedReportPath;
                    const header = await this.getReportHeader();
                    const headerObj = Array.isArray(header)
                        ? (header[0] || {})
                        : (header || {})
                    if (Array.isArray(result)) {
                        result.forEach(row => {
                            row.transactionDate = isoDate(row.transactionDate);
                            row.amount = formatAmount(row.amount);
                        });
                    }
                  
                    const rows = Array.isArray(result) ? result : [result];
                    const selectedCustomer = this.customerList.find(
                        (customer) => customer.id === this.customerId
                    );
                    const data  = buildGroupedRows(rows);
                    const formattedRows = data.map((item, index) => ({
                        ...item,
                        rowNumber: index + 1
                    }));
                    
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
                    console.error('Opening balances report error:', error);

                    this.toastHandler(
                        'error',
                        error.response?.data?.message ||
                        'Unable to get opening balances report.'
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
                    timerProgressBar: true
                });

            },
        },

        async mounted() {
            this.reportApiBaseUrl = reportApiBaseUrl;

            await this.getCustomers();
            await this.getReportData();
        }
    });

    app.use(WSelectPlugin);
    app.component('PdfViewer', PdfViewer);
    app.mount('#app');
})();