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
                supplierGroupId: '',
                supplierGroupList: [],
                supplierGroupName: '',
                reportData: [],
                reportTitle: '',
                viewerColor: '#ff2056',
                showReport: false,
                reportPath: '',
                reportHeader: [],
                reportPathConfig: {
                    summaryReportPath: '/ReportTemplates/Ap/suppliers.html',
                    supplierGroupReport: '/ReportTemplates/Ap/suppliers.html',
                },
            };
        },

        methods: {
            unwrapList(raw) {
                if (!raw) return [];

                if (Array.isArray(raw)) return raw;

                if (raw.result !== undefined) {
                    return this.unwrapList(raw.result);
                }

                if (Array.isArray(raw.result?.items)) return raw.result.items;
                if (Array.isArray(raw.items)) return raw.items;
                if (Array.isArray(raw.data)) return raw.data;

                const firstArray = Object.values(raw).find(
                    (value) => Array.isArray(value)
                );

                return firstArray || [];
            },

            async getReportHeader() {
                let title = 'Suppliers';

                if (this.reportType === 'supplier-group') {
                    title = `Suppliers - ${this.supplierGroupName}`;
                }

                this.reportTitle = title;

                const url = `/Ap/GetReportHeader?title=${encodeURIComponent(title)}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },

            async getReportData() {
                if (this.isLoading) return;

                this.isLoading = true;

                try {
                    let url = '/SharedResource/GetSuppliers';

                    this.reportPath = this.reportPathConfig.summaryReportPath;

                    if (this.reportType === 'supplier-group') {
                        if (!this.supplierGroupId) {
                            this.toastHandler('warning', 'Please select a supplier group.');
                            return;
                        }

                        this.reportPath = this.reportPathConfig.supplierGroupReport;
                    }

                    const response = await axios.get(url);

                    const header = await this.getReportHeader();

                    let reportDetails = this.unwrapList(response.data);

                    // Filter suppliers by selected supplier group.
                    if (this.reportType === 'supplier-group') {
                        reportDetails = reportDetails.filter(
                            (item) => String(item.supplierGroupId) === String(this.supplierGroupId)
                        );
                    }

                    if (!reportDetails.length) {
                        this.reportData = [];
                        this.showReport = false;
                        this.toastHandler('warning', 'No supplier data found.');
                        return;
                    }

                    const headerObj = Array.isArray(header)
                        ? (header[0] || {})
                        : (header || {});

                    // Normalise the amount and date columns once so the
                    // template renders them formatted.
                    const formattedRows = reportDetails.map((item, index) => ({
                        ...item,
                        supplierName:
                            item.supplierName ?? item.vendorName ?? item.customerName ?? item.name ?? '',
                        supplierAccountNumber:
                            item.supplierAccountNumber ??
                            item.vendorAccountNumber ??
                            item.accountNumber ??
                            '',
                        creditLimit: formatAmount(item.creditLimit),
                        openingBalance: formatAmount(item.openingBalance),
                        currentBalance: formatAmount(item.currentBalance),
                        balance: formatAmount(item.balance),
                        createdAt: isoDate(item.createdAt),
                        rowNumber: index + 1,
                    }));

                    // Total credit limit across the rows shown.
                    const creditLimitTotal = reportDetails.reduce(
                        (total, item) => total + toNumber(item.creditLimit),
                        0
                    );

                    const headerItem = {
                        ...headerObj,
                        companyLogo: toLogoDataUri(headerObj.companyLogo),
                        CurrentDate: today,
                        reportTitle: headerObj.reportTitle || this.reportTitle,
                        supplierGroupName: this.supplierGroupName,
                        rowCount: formattedRows.length,
                        creditLimitTotal: formatAmount(creditLimitTotal),
                    };

                    const reportData = [headerItem, ...formattedRows];

                    this.reportPath = this.reportPathConfig[
                        this.reportType === 'supplier-group'
                            ? 'supplierGroupReport'
                            : 'summaryReportPath'
                        ];
                    this.reportData = reportData;

                    // Show the report in the PdfViewer.
                    this.showReport = reportData.length > 1;

                    if (!this.showReport) {
                        this.toastHandler('warning', 'No data found.');
                    }
                } catch (error) {
                    console.error('Report loading failed:', error);

                    this.reportData = [];
                    this.showReport = false;

                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Unable to get report data.'
                    );
                } finally {
                    this.isLoading = false;
                }
            },

            async getSupplierGroups() {
                try {
                    const response = await axios.get('/SharedResource/GetSupplierGroups');

                    this.supplierGroupList = this.unwrapList(response.data);
                } catch (error) {
                    console.error('Supplier groups loading failed:', error);

                    this.supplierGroupList = [];

                    this.toastHandler('error', 'Unable to get supplier groups.');
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

        watch: {
            supplierGroupId(val) {
                const supplierGroupInfo = this.supplierGroupList.find(
                    (item) => String(item.id) === String(val)
                );

                this.supplierGroupName = supplierGroupInfo?.name || '';
                this.getReportData();
            },
        },

        async mounted() {
           
            await this.getSupplierGroups();
            await this.getReportData();
        },
    });

    app.use(WSelectPlugin);
    app.component('PdfViewer', PdfViewer);
    app.mount('#app');
})();
