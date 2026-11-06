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

        const local = new Date(
            d.getTime() - d.getTimezoneOffset() * 60000
        );

        return local.toISOString().slice(0, 10);
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

                supplierGroupId: '',
                supplierGroupList: [],
                supplierGroupName: '',

                supplierList: [],
                supplierId: '',

                reportPath: '',
                reportHeader:[],
                reportPathConfig: {

                    summaryReportPath:
                        'https://res.cloudinary.com/dusydqiob/raw/upload/v1755784323/erp-reports/ap/agingSummary_p4a5eg.rdl',

                    summaryReportByDatePath:
                        'https://res.cloudinary.com/dusydqiob/raw/upload/v1755784323/erp-reports/ap/agingByDate_oqqmjy.rdl',

                    summaryReportBySupplierPath:
                        'https://res.cloudinary.com/dusydqiob/raw/upload/v1755784324/erp-reports/ap/agingBySupplier_swloka.rdl'

                }
            };
        },

        computed: {
            reportTitle() {
                return this.reportType === 'bySupplier'
                    ? 'Ageing by Supplier'
                    : 'Ageing Summary by Date';
            }
        },
        methods: {

            // ==========================================
            // UNWRAP API RESPONSE
            // ==========================================

            unwrapList(response) {
                const data = response?.data;

                if (Array.isArray(data)) return data;
                if (Array.isArray(data?.result)) return data.result;
                if (Array.isArray(data?.result?.items)) return data.result.items;
                if (Array.isArray(data?.items)) return data.items;
                if (Array.isArray(data?.data)) return data.data;

                return [];
            },


            // ==========================================
            // GENERATE PDF
            // ==========================================

            generatePdf() {

                const element = this.$refs.pdfContent;

                if (!element) {
                    this.toastHandler('warning', 'PDF content not found.');
                    return;
                }

                html2canvas(element)
                    .then(canvas => {

                        const imgData = canvas.toDataURL('image/png');

                        const doc = new jsPDF('p', 'mm', 'a4');

                        doc.addImage(imgData, 'PNG', 10, 10, 180, 0);

                        const pdfBlob = doc.output('blob');

                        const pdfUrl = URL.createObjectURL(pdfBlob);

                        window.open(pdfUrl, '_blank');

                    })
                    .catch(err => {

                        console.error('PDF generation error:', err);

                        this.toastHandler('error', 'Unable to generate PDF.');

                    });
            },

            // report header
            async getReportHeader() {
                const url = `/Ap/GetReportHeader?title=${encodeURIComponent(this.reportTitle)}`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },

            // ==========================================
            // GET REPORT DATA
            // ==========================================

            getReportData() {

                let url = `/Ap/GetAgingSummary?startDate=${encodeURIComponent(this.startDate)}&agingInterval=${encodeURIComponent(this.agingInterval)}`;

                this.reportPath = this.reportPathConfig.summaryReportPath;

                if (!this.startDate) {
                    this.toastHandler('warning', 'Please select a start date.');
                    return;
                }

                if (!Number.isFinite(Number(this.agingInterval)) || Number(this.agingInterval) <= 0) {
                    this.toastHandler('warning', 'Please enter a valid ageing interval.');
                    return;
                }

                switch (this.reportType) {

                    // ----------------------------------
                    // AGEING SUMMARY BY DATE
                    // ----------------------------------

                    case 'byDateSummary':

                        this.reportPath =
                            this.reportPathConfig.summaryReportByDatePath;

                        url = `/Ap/GetAgingByDate?startDate=${encodeURIComponent(this.startDate)}&agingInterval=${encodeURIComponent(this.agingInterval)}`;

                        break;


                    // ----------------------------------
                    // AGEING BY SUPPLIER
                    // ----------------------------------

                    case 'bySupplier':

                        if (!this.supplierId) {
                            this.toastHandler('warning', 'Please select a supplier.');
                            return;
                        }

                        this.reportPath =
                            this.reportPathConfig.summaryReportBySupplierPath;

                        url = `/Ap/GetApAgingBySupplier?SupplierId=${encodeURIComponent(this.supplierId)}&startDate=${encodeURIComponent(this.startDate)}&agingInterval=${encodeURIComponent(this.agingInterval)}`;

                        break;


                    // ----------------------------------
                    // DEFAULT AGEING SUMMARY
                    // ----------------------------------

                    default:

                        this.toastHandler('warning', 'Please select a valid report option.');

                        return;

                }


                this.isLoading = true;

                axios.get(url)
                    .then(async response => {

                        const reportDetails = response.data.result;
                        this.reportHeader = await this.getReportHeader();
                        if (!this.reportHeader || !reportDetails.length) {
                            this.toastHandler('warning', 'No ageing report data was returned.');
                            return;
                        }

                        this.renderReport(
                            this.reportHeader,
                            reportDetails,
                            this.reportPath
                        );

                    })
                    .catch(err => {

                        console.error('Error loading ageing report:', err);

                        this.toastHandler('error', 'Unable to get ageing report data.');

                    })
                    .finally(() => {

                        this.isLoading = false;

                    });
            },


            // ==========================================
            // RENDER BOLD REPORT VIEWER
            // ==========================================

            renderReport(header, details, reportPath) {

                $("#reportView").empty();

                $("#reportView").boldReportViewer({

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
                            name: "DataSet1"
                        },
                        {
                            value: details,
                            name: "DataSet2"
                        }
                    ]

                });
            },


            // ==========================================
            // GET SUPPLIERS
            // ==========================================

            getSuppliers() {

                axios.get('/SharedResource/GetSuppliers')
                    .then(response => {

                        this.supplierList = this.unwrapList(response);

                        if (this.supplierList.length > 0) {
                            this.supplierId = this.supplierList[0].id;
                        } else {
                            this.supplierId = '';
                        }

                    })
                    .catch(err => {

                        console.error('Error loading suppliers:', err);

                        this.toastHandler('error', 'Unable to get suppliers.');

                    });
            },


            // ==========================================
            // TOAST HANDLER
            // ==========================================

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


        // ==========================================
        // MOUNTED
        // ==========================================

        mounted() {
            this.reportApiBaseUrl = reportApiBaseUrl;
            this.getSuppliers();
            this.getReportData();

        }

    });


    app.use(WSelectPlugin);
    app.mount('#app');

})();