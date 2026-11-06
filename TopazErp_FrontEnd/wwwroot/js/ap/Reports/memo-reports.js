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

                reportHeader:[],
                reportPath: '',

                summaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1755785681/erp-reports/ap/debitMemo_q1sdox.rdl'
            };
        },

        methods: {
            unwrapList(response) {
                const data = response?.data;

                if (Array.isArray(data)) return data;
                if (Array.isArray(data?.result)) return data.result;
                if (Array.isArray(data?.result?.items)) return data.result.items;
                if (Array.isArray(data?.items)) return data.items;
                if (Array.isArray(data?.data)) return data.data;

                return [];
            },
            // report header
            async getReportHeader() {
                const url = `/Ap/GetReportHeader?title=Debit Memos`;
                const response = await axios.get(url);

                this.reportHeader = response.data?.result || [];
                return this.reportHeader;
            },
            getReportData() {
                this.isLoading = true;

                this.reportPath = this.summaryReportPath;

                axios.get('/Ap/GetApDebitMemo')
                    .then(async response => {
                        const data = response?.data?.result;

                        if (!data) {
                            this.toastHandler('error', 'No report data was returned.');
                            return;
                        }

                        const header = await this.getReportHeader();
                        if (Array.isArray(data)) {
                            data.forEach(row => {
                                row.transactionDate = isoDate(row.transactionDate);
                            });
                        }
                        this.renderReport(
                            header,
                            data,
                            this.reportPath
                        );
                    })
                    .catch(error => {
                        console.error('Error generating Debit Memo report:', error);

                        this.toastHandler('error', 'Unable to get debit memo report data.');
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
            },

            renderReport(header, details, reportPath) {
                console.log('Debit Memo Report Details:', details);

                $('#reportView').empty();

                $('#reportView').boldReportViewer({
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

        mounted() {
            this.reportApiBaseUrl = reportApiBaseUrl;

            this.getReportData();
        }
    });

    app.use(WSelectPlugin);
    app.mount('#app');
})();