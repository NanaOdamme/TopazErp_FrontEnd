(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const pad = (value) => String(value).padStart(2, '0');

    const isoDate = (date = new Date()) => {
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());

        return `${year}-${month}-${day}`;
    };

    const app = Vue.createApp({
        data() {
            return {
                emptyGuid: EMPTY_GUID,
                isLoading: false,
                payload: {},

                reportType: 'summary-report',
                reportApiBaseUrl: '',
                PrintedDate: isoDate(),

                invoiceList: [],
                invoiceNumber: '',
                invoiceId: 'ALL',

                reportPath: '',
                reportHeader: [],
                reportDetails: [],
                supplierInfo: [],
                invoiceDetails: [],
                pdfUrl: '',
                referenceNumber: '',

                reportPathConfig: {
                    summaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1742396578/erp-reports/ap/invoiceDetails_mmyqoy_iryhog.rdl'
                },

                selectedInvoices: [],
                selectAll: false,
                showDropdown: false,

                modalActionType: '',
                modalInvoiceId: null,
                modalTitle: '',
                modalMessage: '',
                modalBulkIds: [],

                searchQuery: '',
                sortKey: '',
                sortAsc: true,

                perPage: 10,
                currentPage: 1,

                expanded: [],
                expandedYears: []
            };
        },

        computed: {
            filteredInvoices() {
                let list = this.invoiceList.filter(i => i.id !== 'ALL');

                if (this.searchQuery) {
                    const q = this.searchQuery.toLowerCase();

                    list = list.filter(i =>
                        String(i.batchNumber || '').toLowerCase().includes(q) ||
                        String(i.invoiceNumber || '').toLowerCase().includes(q) ||
                        String(i.supplierName || '').toLowerCase().includes(q) ||
                        String(i.isPosted ?? '').toLowerCase().includes(q)
                    );
                }

                if (this.sortKey) {
                    list.sort((a, b) => {
                        let valA = a[this.sortKey] ?? '';
                        let valB = b[this.sortKey] ?? '';

                        if (typeof valA === 'string') {
                            valA = valA.toLowerCase();
                        }

                        if (typeof valB === 'string') {
                            valB = valB.toLowerCase();
                        }

                        if (valA < valB) return this.sortAsc ? -1 : 1;
                        if (valA > valB) return this.sortAsc ? 1 : -1;

                        return 0;
                    });
                }

                return list;
            },

            isAllSelected() {
                const invoices = this.invoiceList.filter(i => i.id !== 'ALL');

                return invoices.length > 0 &&
                    this.selectedInvoices.length === invoices.length;
            },

            paginatedInvoices() {
                const start = (this.currentPage - 1) * this.perPage;

                return this.filteredInvoices.slice(start, start + this.perPage);
            },

            totalPages() {
                return Math.ceil(this.filteredInvoices.length / this.perPage) || 1;
            },

            selectedInvoice() {
                if (this.selectedInvoices.length === 1) {
                    return this.invoiceList.find(i => i.id === this.selectedInvoices[0]);
                }

                return null;
            },

            paginationPages() {
                const total = this.totalPages;
                const current = this.currentPage;
                const delta = 2;

                const range = [];
                const rangeWithDots = [];

                let lastPage;

                for (let i = 1; i <= total; i++) {
                    if (
                        i === 1 ||
                        i === total ||
                        (i >= current - delta && i <= current + delta)
                    ) {
                        range.push(i);
                    }
                }

                for (const page of range) {
                    if (lastPage) {
                        if (page - lastPage === 2) {
                            rangeWithDots.push(lastPage + 1);
                        } else if (page - lastPage > 2) {
                            rangeWithDots.push('...');
                        }
                    }

                    rangeWithDots.push(page);
                    lastPage = page;
                }

                return rangeWithDots;
            }
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

            toggleYear(year) {
                const index = this.expandedYears.indexOf(year);

                if (index > -1) {
                    this.expandedYears.splice(index, 1);
                } else {
                    this.expandedYears.push(year);
                }
            },

            toggleSelectAll() {
                if (this.selectAll) {
                    this.selectedInvoices = this.invoiceList
                        .filter(i => i.id !== 'ALL')
                        .map(i => i.id);
                } else {
                    this.selectedInvoices = [];
                }
            },

            sort(key) {
                if (this.sortKey === key) {
                    this.sortAsc = !this.sortAsc;
                } else {
                    this.sortKey = key;
                    this.sortAsc = true;
                }
            },

            toggleInvoice(id) {
                const index = this.expanded.indexOf(id);

                if (index >= 0) {
                    this.expanded.splice(index, 1);
                } else {
                    this.expanded.push(id);
                }
            },

            getPdf() {
                if (this.invoiceId === 'ALL') {
                    this.printAllInvoices();
                    return;
                }

                if (!this.invoiceId) {
                    this.toastHandler('warning', 'Please select an invoice.');
                    return;
                }

                this.isLoading = true;

                axios.get('/Ap/GetApInvoiceDetails', {
                    params: {
                        id: this.invoiceId
                    },
                    responseType: 'blob'
                })
                    .then(response => {
                        if (!response.data.result || response.data.size === 0) {
                            this.toastHandler('warning', 'No Data is selected for printing.');
                            return;
                        }

                        const blob = new Blob([response.data], {
                            type: 'application/pdf'
                        });

                        const blobUrl = URL.createObjectURL(blob);

                        window.open(blobUrl, '_blank');
                    })
                    .catch(error => {
                        console.error('Invoice PDF error:', error);
                        this.toastHandler('error', 'Unable to load the invoice.');
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
            },

            printAllInvoices() {
                if (typeof PDFLib === 'undefined') {
                    this.toastHandler('error', 'PDF processing library is not available.');
                    return;
                }
             

                const invoicesToPrint = this.selectedInvoices.length > 0
                    ? this.invoiceList.filter(inv =>
                        this.selectedInvoices.includes(inv.id)
                    )
                    : this.invoiceList.filter(inv => inv.id !== 'ALL');

                if (invoicesToPrint.length === 0) {
                    this.toastHandler('warning', 'No invoices to print.');
                    return;
                }

                this.isLoading = true;

                const { PDFDocument } = PDFLib;

                PDFDocument.create()
                    .then(mergedPdf => {
                        let chain = Promise.resolve();

                        invoicesToPrint.forEach(invoice => {
                            chain = chain.then(() => {
                                return axios.get('/Ap/GetApInvoiceDetails', {
                                    params: {
                                        id: invoice.id
                                    },
                                    responseType: 'arraybuffer'
                                }).then(response => {
                                    return PDFDocument.load(response.data);
                                }).then(pdf => {
                                    return mergedPdf.copyPages(
                                        pdf,
                                        pdf.getPageIndices()
                                    ).then(pages => {
                                        pages.forEach(page => {
                                            mergedPdf.addPage(page);
                                        });
                                    });
                                });
                            });
                        });

                        return chain.then(() => mergedPdf.save());
                    })
                    .then(mergedBytes => {
                        const blob = new Blob([mergedBytes], {
                            type: 'application/pdf'
                        });

                        const url = URL.createObjectURL(blob);

                        window.open(url, '_blank');

                        this.toastHandler(
                            'success',
                            this.selectedInvoices.length > 0
                                ? 'Selected invoices ready.'
                                : 'All invoices ready.'
                        );
                    })
                    .catch(error => {
                        console.error('Merge invoice PDFs error:', error);
                        this.toastHandler('error', 'Unable to merge invoice PDFs.');
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
            },

            getReportData() {
                if (!this.invoiceId || this.invoiceId === 'ALL') {
                    this.toastHandler('warning', 'Please select a specific invoice to generate this report.');
                    return;
                }

                this.isLoading = true;

                const url = '/Ap/GetApInvoiceDetails';

                this.reportPath = this.reportPathConfig.summaryReportPath;

                axios.get(url, {
                    params: {
                        id: this.invoiceId
                    }
                })
                    .then(response => {
                        const data = response.data?.result ?? response.data;

                        this.reportHeader = data?.reportHeader?.[0] ?? {};
                        this.reportDetails = data?.reportDetails?.data?.[0] ?? {};
                        this.supplierInfo = data?.reportDetails?.supplierInfo?.[0] ?? {};
                        this.invoiceDetails = data?.reportDetails?.invoiceDetails ?? [];

                        this.referenceNumber = this.invoiceDetails[0] ?? {};

                        // Keep the original response assignments.
                        // Call renderReport() here if you want to display the RDL.
                        // this.renderReport(
                        //     data.reportHeader,
                        //     data.reportDetails.data,
                        //     this.reportPath
                        // );
                    })
                    .catch(error => {
                        console.error('Invoice report error:', error);
                        this.toastHandler('error', 'Unable to get data.');
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
            },

            renderReport(header, details, reportPath) {
                console.log(details);

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

            getInvoices() {
                this.isLoading = true;
                axios.get('/Ap/GetInvoices')
                    .then(response => {
                        const invoices = this.unwrapList(response)
                            .filter(x => x.isCanceled === false);

                        const allOption = {
                            id: 'ALL',
                            invoiceNumber: 'ALL',
                            supplierName: '',
                            displayText: 'All Invoices'
                        };

                        invoices.forEach(item => {
                            item.displayText =
                                `${item.invoiceNumber} - ${item.supplierName}`;
                        });

                        this.invoiceList = [allOption, ...invoices];
                        this.invoiceId = 'ALL';

                        })
                    .catch(error => {
                        console.error('Get invoices error:', error);
                        this.toastHandler('error', 'Unable to get invoices.');
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
            },

            formatNumber(value) {
                const number = parseFloat(value ?? 0);

                return isNaN(number)
                    ? '-'
                    : number.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
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
            this.getInvoices();
        }
    });
    app.use(WSelectPlugin);
    app.mount('#app');
})();