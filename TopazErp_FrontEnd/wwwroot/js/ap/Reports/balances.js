
(() => {
    'use strict';
    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
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
                reportHeader:[],
                reportPath: '',

                reportPathConfig: {
                    SummaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1755775403/erp-reports/ap/openingBalanceSummary_ofo8p1.rdl',

                    supplierReport: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1755775403/erp-reports/ap/openingBalanceBySupplier_zwkiag.rdl',

                    type2Report: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1755775403/erp-reports/ap/openingBalancesType2_bzd5ow.rdl',
                }
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
                    bySupplier: 'Supplier Opening Balances',
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
            async getSuppliers() {
                try {
                    const response = await axios.get(
                        '/SharedResource/GetSuppliers'
                    );

                    this.supplierList = this.unwrapList(response.data);

                    if (
                        this.supplierList.length > 0 &&
                        !this.supplierId
                    ) {
                        this.supplierId = this.supplierList[0].id;
                    }

                } catch (error) {
                    console.error('Get suppliers error:', error);

                    this.supplierList = [];
                    this.supplierId = '';

                    this.toastHandler(
                        'error',
                        'Unable to get suppliers.'
                    );
                }
            },

            async getReportData() {
                if (this.isLoading) return;

                if (
                    this.reportType === 'bySupplier' &&
                    !this.supplierId
                ) {
                    this.toastHandler(
                        'warning',
                        'Please select a supplier.'
                    );
                    return;
                }

                let url = '';
                let selectedReportPath = '';

                switch (this.reportType) {
                    case 'summary':
                        selectedReportPath =
                            this.reportPathConfig.SummaryReportPath;

                        url = `/Ap/GetApBalancesReport?status=${encodeURIComponent(this.reportStatus)}`;
                        break;

                    case 'bySupplier':
                        selectedReportPath =
                            this.reportPathConfig.supplierReport;

                        url = `/Ap/GetApBalancesBySupplier?SupplierId=${encodeURIComponent(this.supplierId)}&status=${encodeURIComponent(this.reportStatus)}`;
                        break;

                    case 'type2':
                        selectedReportPath =
                            this.reportPathConfig.type2Report;

                        url = `/Ap/GetAllConvertedApBalances?status=${encodeURIComponent(this.reportStatus)}`;
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
                    this.reportHeader = await this.getReportHeader();
                    //format date in result
                    if (Array.isArray(result)) {
                        result.forEach(row => {
                            row.transactionDate = isoDate(row.transactionDate);
                        });
                    }
                    this.renderReport(
                        this.reportHeader || [],
                        result || [],
                        selectedReportPath
                    );

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

            renderReport(header, details, reportPath) {
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
                        }
                    ]
                });
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

            await this.getSuppliers();
            await this.getReportData();
        }
    });

    app.use(WSelectPlugin);
    app.mount('#app');
})();
