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
                reportHeader:[],

                reportPathConfig: {
                    summaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1760443454/erp-reports/ap/ap-statement-type-1_qxagi6_unqa1o.rdl',

                    type1ReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1758199618/erp-reports/ap/ap-statement-type-2_ukbixr.rdl',

                    type2ReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1758199818/erp-reports/ap/ap-statement-type-3_eegzh5.rdl',
                }
            };
        },

        methods: {
            // report header
            async getReportHeader() {
                let title = 'Supplier Statements';

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

                // Validate supplier
                if (!this.supplierId) {
                    this.toastHandler(
                        'warning',
                        'Please select a supplier.'
                    );
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

                        url = `/Ap/GetApStatementType2?supplierId=${encodeURIComponent(this.supplierId)}&startDate=${encodeURIComponent(this.startDate)}&endDate=${encodeURIComponent(this.endDate)}`;
                        break;

                    case 'type3':
                        selectedReportPath = this.reportPathConfig.type2ReportPath;

                        url = `/Ap/GetApStatementType3?supplierId=${encodeURIComponent(this.supplierId)}&startDate=${encodeURIComponent(this.startDate)}&endDate=${encodeURIComponent(this.endDate)}`;
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
                    this.renderReport(
                        header,
                        result,
                        outstanding || [],
                        selectedReportPath
                    );

                } catch (error) {
                    console.error('Supplier statement error:', error);

                    this.toastHandler(
                        'error',
                        error.response?.data?.message ||
                        'Unable to get supplier statement data.'
                    );
                } finally {
                    this.isLoading = false;
                }
            },

            renderReport(header, details, outstanding, reportPath) {
                const reportElement = $('#reportView');

                reportElement.empty();

                reportElement.boldReportViewer({
                    reportServiceUrl: this.reportApiBaseUrl,

                    processingMode: ej.ReportViewer.ProcessingMode.Local,

                    toolbarSettings: {
                        showToolbar: true,
                        items: ej.ReportViewer.ToolbarItems.All &
                            ~ej.ReportViewer.ToolbarItems.Print
                    },

                    reportPath: reportPath,

                    dataSources: [
                        {
                            value: header,
                            name: 'DataSet1'
                        },
                        {
                            value: details,
                            name: 'DataSet2'
                        },
                        {
                            value: outstanding,
                            name: 'DataSet3'
                        }
                    ]
                });
            },

            async getSuppliers() {
                this.isShimmerLoading = true;

                try {
                    const response = await axios.get(
                        '/SharedResource/GetSuppliers'
                    );

                    let suppliers = response.data.result;

                    // Handle possible ABP response wrappers.
                    if (!Array.isArray(suppliers)) {
                        suppliers =
                            suppliers?.result ??
                            suppliers?.items ??
                            suppliers?.data ??
                            [];
                    }

                    this.supplierList = Array.isArray(suppliers)
                        ? suppliers
                        : [];

                    if (this.supplierList.length > 0) {
                        this.supplierId = this.supplierList[0].id;
                    } else {
                        this.supplierId = '';
                    }

                } catch (error) {
                    console.error('Get suppliers error:', error);

                    this.supplierList = [];
                    this.supplierId = '';

                    this.toastHandler(
                        'error',
                        'Unable to get suppliers.'
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
            this.reportApiBaseUrl = reportApiBaseUrl;
            this.getSuppliers();
        }
    });
    app.use(WSelectPlugin);
    app.mount('#app');
})();