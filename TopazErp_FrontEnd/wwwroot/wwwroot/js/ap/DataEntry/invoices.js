const app = Vue.createApp({
    data() {
        return {
            invoices: [],
            searchQuery: '',
            sortKey: '',
            sortAsc: true,
            perPage: 10,
            currentPage: 1,
            expanded: [],
            selectedInvoices: [],
            selectAll: false,
            showDropdown: false,
            modalActionType: "",  
            modalInvoiceId: null,
            modalTitle: "",
            modalMessage: "",
            modalBulkIds: [], 
            isLoading: false,
            invoiceList: [],
            expandedYears: [],
        };
    },

    computed: {
        
        filteredInvoices() {
            let list = this.invoices;

            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                list = list.filter(i =>
                    (i.batchNumber && i.batchNumber.toLowerCase().includes(q)) ||
                    (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(q)) ||
                    (i.supplierName && i.supplierName.toLowerCase().includes(q)) ||
                    (i.isPosted && i.isPosted.toString().toLowerCase().includes(q)) 
                );
            }

            if (this.sortKey) {
                list.sort((a, b) => {
                    let valA = a[this.sortKey] ?? '';
                    let valB = b[this.sortKey] ?? '';

                    if (typeof valA === 'string') valA = valA.toLowerCase();
                    if (typeof valB === 'string') valB = valB.toLowerCase();

                    if (valA < valB) return this.sortAsc ? -1 : 1;
                    if (valA > valB) return this.sortAsc ? 1 : -1;
                    return 0;
                });
            }

            return list;
        },

        paginatedInvoices() {
            const start = (this.currentPage - 1) * this.perPage;
            return this.filteredInvoices.slice(start, start + this.perPage);
        },

        totalPages() {
            return Math.ceil(this.filteredInvoices.length / this.perPage) || 1;
        },
        selectedInvoice() {
            if (this.selectedInvoices.length === 1)
                return this.invoices.find(i => i.id === this.selectedInvoices[0]);
            return null;
        },

        canApprove() {
            return this.selectedInvoice && !this.selectedInvoice.isApproved;
        },

        canCancel() {
            return this.selectedInvoice &&
                !this.selectedInvoice.isCanceled &&
                this.selectedInvoice.totalInvoiceAmount === this.selectedInvoice.balance;
        },
        paginationPages() {
            const total = this.totalPages;
            const current = this.currentPage;
            const delta = 2; // how many pages around current

            const range = [];
            const rangeWithDots = [];

            let l;

            for (let i = 1; i <= total; i++) {
                if (
                    i === 1 ||
                    i === total ||
                    (i >= current - delta && i <= current + delta)
                ) {
                    range.push(i);
                }
            }

            for (let i of range) {
                if (l) {
                    if (i - l === 2) {
                        rangeWithDots.push(l + 1);
                    } else if (i - l > 2) {
                        rangeWithDots.push('...');
                    }
                }
                rangeWithDots.push(i);
                l = i;
            }

            return rangeWithDots;
        },
        groupedInvoices() {

            let list = [...this.filteredInvoices];

            // SORT INDIVIDUAL ROWS
            if (this.sortKey) {

                list.sort((a, b) => {

                    let valA = a[this.sortKey];
                    let valB = b[this.sortKey];

                    // HANDLE DATES
                    if (this.sortKey.toLowerCase().includes('date')) {
                        valA = valA ? new Date(valA) : new Date(0);
                        valB = valB ? new Date(valB) : new Date(0);
                    }

                    // HANDLE STRINGS
                    else if (typeof valA === 'string') {
                        valA = valA.toLowerCase();
                        valB = valB.toLowerCase();
                    }

                    // HANDLE NULLS
                    if (valA == null) valA = '';
                    if (valB == null) valB = '';

                    if (valA < valB) return this.sortAsc ? -1 : 1;
                    if (valA > valB) return this.sortAsc ? 1 : -1;

                    return 0;
                });
            }

            // PAGINATION
            const start = (this.currentPage - 1) * this.perPage;
            const paginated = list.slice(start, start + this.perPage);

            // GROUP BY YEAR
            const groups = {};

            paginated.forEach(inv => {

                const year = inv.invoiceDate
                    ? new Date(inv.invoiceDate).getFullYear()
                    : 'No Year';

                if (!groups[year]) {
                    groups[year] = [];
                }

                groups[year].push(inv);
            });

            // SORT YEARS
            const sortedGroups = {};

            Object.keys(groups)
                .sort((a, b) => this.sortAsc ? b - a : a - b)
                .forEach(year => {
                    sortedGroups[year] = groups[year];
                });

            return sortedGroups;
        },
      
    },

    methods: {
        toggleYear(year) {

            const index = this.expandedYears.indexOf(year);

            if (index > -1) {
                this.expandedYears.splice(index, 1);
            } else {
                this.expandedYears.push(year);
            }
        },
        openConfirmModal(type, ids) {
            this.modalActionType = type;

            if (Array.isArray(ids)) {
                this.modalBulkIds = ids;      // bulk
                this.modalInvoiceId = null;
            } else {
                this.modalInvoiceId = ids;    // single
                this.modalBulkIds = [];
            }

            if (type === "approve") {
                this.modalTitle = "Confirm Approval";
                this.modalMessage = this.modalInvoiceId
                    ? "Are you sure you want to approve this invoice?"
                    : `Approve ${ids.length} selected invoices?`;
            }
            else if (type === "cancel") {
                this.modalTitle = "Confirm Cancellation";
                this.modalMessage = this.modalInvoiceId
                    ? "Are you sure you want to cancel this invoice?"
                    : `Cancel ${ids.length} selected invoices?`;
            }

            $("#confirmModal").modal("show");
        },

        confirmAction() {
            $("#confirmModal").modal("hide");

            const ids = this.modalInvoiceId
                ? [this.modalInvoiceId]
                : this.modalBulkIds;

            if (this.modalActionType === "approve") {
                this.approveInvoices(ids);
            }
            else if (this.modalActionType === "cancel") {
                this.cancelInvoices(ids);
            }
        },


        goToAddInvoice() {
            window.location.href = '/ApDataEntry/AddInvoice';
        },
        selectFromDropdown(invoiceNumber) {
            this.searchQuery = invoiceNumber;
            this.showDropdown = false;
            this.currentPage = 1;
        },

        hideDropdown() {
            setTimeout(() => this.showDropdown = false, 200);
        },

        toggleSelectAll() {
            this.selectedInvoices = this.selectAll
                ? this.paginatedInvoices.map(i => i.id)
                : [];
        },

        toggleInvoice(id) {
            const i = this.expanded.indexOf(id);
            if (i >= 0) this.expanded.splice(i, 1);
            else this.expanded.push(id);
        },

        fetchInvoices() {
            axios.get('/ApDataEntry/GetInvoices')
                .then(res => {
                    this.invoices = res.data
                        .filter(i => !i.isCanceled)
                        .sort((a, b) => (a.batchNumber || '').localeCompare(b.batchNumber || ''));
                })
                .catch(() => toastr.error("Failed to load invoices"));
        },

        cancelSingle(id) {
            this.openConfirmModal("cancel", id);
        },


        cancelSelected() {
            if (this.selectedInvoices.length === 0)
                return toastr.info("No invoices selected");

            const invalidInvoices = this.invoices.filter(inv =>
                this.selectedInvoices.includes(inv.id) &&
                Number(inv.totalInvoiceAmount) !== Number(inv.balance)
            );

            if (invalidInvoices.length > 0)
                return toastr.warning("Some selected invoices cannot be canceled because payments have been applied");

            this.openConfirmModal("cancel", this.selectedInvoices);
        },


        approveSingle(id) {
            this.openConfirmModal("approve", id);
        },

        approveSelected() {
            if (this.selectedInvoices.length === 0) {
                return toastr.info("No invoices selected");
            }

            const selected = this.invoices.filter(inv =>
                this.selectedInvoices.includes(inv.id)
            );

            // Filter ONLY valid invoices (not approved & not canceled)
            const validInvoices = selected.filter(inv => !inv.isApproved && !inv.isCanceled);

            // Nothing valid
            if (validInvoices.length === 0) {
                return toastr.warning("No valid invoices to approve");
            }

            // Optional: feedback about skipped ones
            const skippedCount = selected.length - validInvoices.length;

           
            const idsToApprove = validInvoices.map(inv => inv.id);

            axios.post('/ApDataEntry/InvoiceApproval', { invoiceIds: idsToApprove })
                .then(res => {
                    // HANDLE PERMISSION / FAILURE FROM BACKEND
                    if (res.data && res.data.success === false) {
                        toastr.error(res.data.message || "Not allowed");
                        return;
                    }
                    
                    validInvoices.forEach(inv => inv.isApproved = true);

                    this.selectedInvoices = [];
                    this.selectAll = false;
                    
                    if (skippedCount > 0) {
                        toastr.warning(`${skippedCount} invoice(s) were skipped`);
                    }

                    toastr.success(`${validInvoices.length} invoice(s) approved`);

                    this.fetchInvoices();
                })
                .catch(() => toastr.error("Failed to approve selected invoices"));
        },

        editInvoice(id) {
            const invoice = this.invoices.find(i => i.id === id);
            window.location.href = `/ApDataEntry/EditInvoice?id=${invoice.id}&isPosted=${invoice.isPosted}`;
        },

        approveInvoices(ids) {
            axios.post('/ApDataEntry/InvoiceApproval', { invoiceIds: ids })
                .then(res => {
                    console.log(res);
                    // HANDLE PERMISSION / FAILURE FROM BACKEND
                    if (res.data && res.data.success === false) {
                        toastr.error(res.data.message || "Not allowed");
                        return;
                    }
                    
                    this.invoices.forEach(inv => {
                        if (ids.includes(inv.id)) inv.isApproved = true;
                    });

                    this.selectedInvoices = [];
                    this.selectAll = false;

                    toastr.success("Invoice(s) approved");
                    this.fetchInvoices();
                })
                .catch(() => toastr.error("Failed to approve invoice(s)"));
        },

        cancelInvoices(ids) {
            axios.post('/ApDataEntry/CancelInvoices', {invoiceIds: ids})
                .then(res => {
                    // HANDLE PERMISSION / FAILURE FROM BACKEND
                    if (res.data && res.data.success === false) {
                        toastr.error(res.data.message || "Not allowed");
                        return;
                    }
                    // UPDATE UI ONLY ON SUCCESS
                    this.invoices.forEach(inv => {
                        if (ids.includes(inv.id)) {
                            inv.isCanceled = true;
                        }
                    });

                    this.selectedInvoices = [];
                    this.selectAll = false;

                    toastr.success("Invoice(s) canceled");

                    this.fetchInvoices();
                })
                .catch(() => {
                    toastr.error("Failed to cancel invoice(s)");
                });
        },
        
        printReport(id) {
            this.isLoading = true;
            const printWindow = window.open("", "_blank");
            printWindow.document.write(`
        <html>
        <head>
            <title>Loading Report...</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                }
                .loader {
                    border: 10px solid #f3f3f3;
                    border-top: 10px solid #3498db;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="loader"></div>
        </body>
        </html>
    `);
            printWindow.document.close(); // finish writing

            let url = `/ApReports/GetInvoiceInPdf?id=${id}`;
            axios.get(url, { responseType: 'blob' })
                .then(response => {
                    if (!response.data) {
                        this.toastHandler("warning", "No Data is selected for printing.");
                        printWindow.close();
                        this.isLoading = false;
                        return;
                    }

                    const blob = new Blob([response.data], { type: "application/pdf" });
                    const blobUrl = URL.createObjectURL(blob);

                    // Replace content with the PDF once it's loaded
                    printWindow.location.href = blobUrl;
                    this.isLoading = false;
                })
                .catch(err => {
                    this.toastHandler("error", "Unable to load the invoice. Please try again.");
                    printWindow.close();
                    this.isLoading = false;
                });
        },
       /* printSelected() {

            if (!this.selectedInvoices.length) {
                this.toastHandler('warning', 'Please select at least supplier.');
                return;
            }
            
            this.isLoading = true;

            const { PDFDocument } = PDFLib;

            (async () => {

                const selected = this.invoices.filter(s =>
                    this.selectedInvoices.includes(s.id)
                );

                const mergedPdf = await PDFDocument.create();

                for (let invoice of selected) {

                    const response = await axios.get('/ApReports/GetInvoiceInPdf', {
                        params: {
                            id: invoice.id,
                        },
                        responseType: 'arraybuffer'
                    });

                    const pdfBytes = response.data;
                    const pdf = await PDFDocument.load(pdfBytes);

                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach(page => mergedPdf.addPage(page));
                }

                const mergedBytes = await mergedPdf.save();

                const blob = new Blob([mergedBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                // 👇 OPEN PRINT WINDOW
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.src = url;

                document.body.appendChild(iframe);

                iframe.onload = () => {
                    setTimeout(() => {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    }, 500);
                };

                this.isLoading = false;
                this.toastHandler('success', 'Merged report ready for printing.');

            })();
        },*/
        async printSelected() {

            this.isLoading = true;

            const {PDFDocument} = PDFLib;

            const mergedPdf = await PDFDocument.create();

            // 👇 decide what to print
            let invoicesToPrint = [];

            if (this.selectedInvoices && this.selectedInvoices.length > 0) {
                // ✅ print only selected
                invoicesToPrint = this.invoices.filter(s =>
                    this.selectedInvoices.includes(s.id)
                );
            } else {
                // ✅ fallback to all (excluding ALL option)
                invoicesToPrint = this.invoiceList.filter(inv => inv.id !== 'ALL');
            }

            //  safety check
            if (invoicesToPrint.length === 0) {
                this.toastHandler('warning', 'No invoices to print.');
                this.isLoading = false;
                return;
            }

            // 👇 loop through chosen invoices
            for (let invoice of invoicesToPrint) {

                const response = await axios.get('/ApReports/GetInvoiceInPdf', {
                    params: {id: invoice.id},
                    responseType: 'arraybuffer'
                });

                const pdf = await PDFDocument.load(response.data);

                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(p => mergedPdf.addPage(p));
            }

            const mergedBytes = await mergedPdf.save();
            const blob = new Blob([mergedBytes], {type: 'application/pdf'});
            const url = URL.createObjectURL(blob);

            // ✅ safer than iframe (avoids Chrome block issues)
            window.open(url, '_blank');

            this.isLoading = false;

            this.toastHandler(
                'success',
                this.selectedInvoices.length > 0
                    ? 'Selected invoices ready.'
                    : 'All invoices ready.'
            );
        },
        toastHandler(type, message = 'An unexpected error occurred.')
        {
            toastr.options = {
                closeButton: true,
                progressBar: true,
                showMethod: 'fadeIn',
                hideMethod: 'fadeOut',
                timeOut: 10000,
            };

            switch (type) {

                case 'warning':
                    toastr.warning('', message);
                    break;
                case 'error':
                    toastr.error('', message);
                    break;
                default:
                    toastr.success('', message);
                    break;
            }

        }
        ,
        sort(key) {
            if (this.sortKey === key) this.sortAsc = !this.sortAsc;
            else { this.sortKey = key; this.sortAsc = true; }
        },

        formatNumber(v) {
            const n = parseFloat(v ?? 0);
            return isNaN(n)
                ? '-'
                : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    },
    watch: {
        currentPage(val) {
            if (val < 1) this.currentPage = 1;
            if (val > this.totalPages) this.currentPage = this.totalPages;
        }
    },
    mounted() {
        this.fetchInvoices();
    }
});

app.mount('#invoiceApp');
