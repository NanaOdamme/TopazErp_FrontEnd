const app = Vue.createApp({
    data() {
        return {
            vouchers: [],
            searchQuery: '',
            sortKey: '',
            sortAsc: true,
            perPage: 10,
            currentPage: 1,
            loading: true,
            expandedVouchers: [],
            showDropdown: false,
            modalDeleteId: null,
            modalTitle: "",
            modalMessage: "",
            isLoading: false,
            selectedVouchers: [],
            selectAll: false,
            reportApiBaseUrl: '',
            showReportOverlay: false,
            reportData: [],
            expandedPaymentYears: [],
            reportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1777910390/erp-reports/ap/APPV_Bulk_flnycd.rdl',
        };
    },
    computed: {
        filteredVouchers() {
            let list = this.vouchers;

            // Search filter
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                list = list.filter(v =>
                    (v.batchNumber && v.batchNumber.toLowerCase().includes(q)) ||
                    (v.supplierName && v.supplierName.toLowerCase().includes(q)) ||
                    (v.invoiceNumber && v.invoiceNumber.toLowerCase().includes(q)) ||
                    (v.currencyCode && v.currencyCode.toLowerCase().includes(q))
                );
            }

            // Sort
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
        paginatedVouchers() {
            const start = (this.currentPage - 1) * this.perPage;
            return this.filteredVouchers.slice(start, start + this.perPage);
        },
        totalPages() {
            return Math.ceil(this.filteredVouchers.length / this.perPage) || 1;
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
        groupedPayments() {

            let list = [...this.filteredVouchers];

            // SORT INDIVIDUAL PAYMENTS
            if (this.sortKey) {

                list.sort((a, b) => {

                    let valA = a[this.sortKey];
                    let valB = b[this.sortKey];

                    // HANDLE DATES
                    if (this.sortKey.toLowerCase().includes('date')) {

                        valA = valA
                            ? new Date(valA)
                            : new Date(0);

                        valB = valB
                            ? new Date(valB)
                            : new Date(0);
                    }

                    // HANDLE STRINGS
                    else if (typeof valA === 'string') {

                        valA = valA.toLowerCase();
                        valB = valB.toLowerCase();
                    }

                    // HANDLE NULLS
                    if (valA == null) valA = '';
                    if (valB == null) valB = '';

                    if (valA < valB)
                        return this.sortAsc ? -1 : 1;

                    if (valA > valB)
                        return this.sortAsc ? 1 : -1;

                    return 0;
                });
            }

            // PAGINATION
            const start = (this.currentPage - 1) * this.perPage;

            const paginated = list.slice(
                start,
                start + this.perPage
            );

            // GROUP BY YEAR
            const groups = {};

            paginated.forEach(p => {

                const year = p.voucherEntryDate
                    ? new Date(p.voucherEntryDate).getFullYear()
                    : 'No Year';

                if (!groups[year]) {
                    groups[year] = [];
                }

                groups[year].push(p);
            });

            // SORT YEARS
            const sortedGroups = {};

            Object.keys(groups)
                .sort((a, b) =>
                    this.sortAsc
                        ? b - a
                        : a - b
                )
                .forEach(year => {

                    sortedGroups[year] = groups[year];
                });

            return sortedGroups;
        },
    },
    methods: {
        togglePaymentYear(year) {

            const index = this.expandedPaymentYears.indexOf(year);

            if (index > -1) {
                this.expandedPaymentYears.splice(index, 1);
            } else {
                this.expandedPaymentYears.push(year);
            }
        },
        selectFromDropdown(batchNumber) {
            this.searchQuery = batchNumber;
            this.showDropdown = false;
            this.currentPage = 1;
        },

        hideDropdown() {
            setTimeout(() => this.showDropdown = false, 200);
        },
        toggleVoucher(id) {
            const index = this.expandedVouchers.indexOf(id);
            if (index >= 0) this.expandedVouchers.splice(index, 1);
            else this.expandedVouchers.push(id);
        },
        toggleSelectAll() {
            if (this.selectAll) {
                this.selectedVouchers = this.paginatedVouchers.map(v => v.id);
            } else {
                this.selectedVouchers = [];
            }
        },
        fetchVouchers() {
            axios.get('/ApDataEntry/GetVouchers')
                .then(response => {
                    this.vouchers = response.data
                        .map(voucher => {
                            // Build voucher.details dynamically
                            const details = [];

                            // Liability (debit)
                            details.push({
                                account: voucher.liabilityAccountName,
                                description: voucher.description,
                                debitAmount: voucher.paymentAmount,
                                creditAmount: 0,
                                buyRate: voucher.buyRate
                            });

                            // Bank (credit)
                            details.push({
                                account: voucher.bankAccountName,
                                description: voucher.description,
                                debitAmount: 0,
                                creditAmount: voucher.netAmount,
                                buyRate: voucher.buyRate
                            });

                            // VAT withheld
                            if (parseFloat(voucher.vatWithHeld) > 0) {
                                details.push({
                                    account: voucher.vatWithHoldAccountName,
                                    description: "Withholding VAT",
                                    debitAmount: 0,
                                    creditAmount: voucher.vatWithHeld,
                                    buyRate: voucher.buyRate
                                });
                            }

                            // Withholding tax
                            if (parseFloat(voucher.withHeld) > 0) {
                                details.push({
                                    account: voucher.creditAccountName,
                                    description: "Withholding Amount",
                                    debitAmount: 0,
                                    creditAmount: voucher.withHeld,
                                    buyRate: voucher.buyRate
                                });
                            }

                            return { ...voucher, details };
                        })
                        // Sort vouchers by batchNumber ascending
                        .sort((a, b) => {
                            if (a.batchNumber < b.batchNumber) return -1;
                            if (a.batchNumber > b.batchNumber) return 1;
                            return 0;
                        });
                })
                .catch(error => {
                    console.error(error);
                    toastr.error('Failed to load vouchers');
                })
                .finally(() => this.loading = false);
        },

        deleteVoucher(id) {
            this.openConfirmDelete(id);
        },

        printReport(id) {
            window.open(`/ApReports/PrintPaymentVoucher?id=${id}`, '_blank');
        },
        editVoucher(id) {
            window.location.href = `/ApDataEntry/EditVouchers?id=${id}`;
        },
        sort(key) {
            if (this.sortKey === key) this.sortAsc = !this.sortAsc;
            else { this.sortKey = key; this.sortAsc = true; }
        },
        openConfirmDelete(id) {
            this.modalDeleteId = id;
            this.modalTitle = "Delete Voucher";
            this.modalMessage = "Are you sure you want to delete this voucher?";
            $("#voucherDeleteModal").modal("show");
        },
        cancelSelected() {
            if (this.selectedVouchers.length === 0) {
                toastr.info("No vouchers selected");
                return;
            }

            this.modalTitle = "Delete Selected Vouchers";
            this.modalMessage = `Are you sure you want to delete ${this.selectedVouchers.length} selected voucher(s)?`;

            $("#voucherDeleteModal").modal("show");
        },
        confirmDelete() {
            $("#voucherDeleteModal").modal("hide");

            // BULK DELETE
            if (this.selectedVouchers.length > 0 && !this.modalDeleteId) {
                const idsToCancel = this.selectedVouchers;

                axios.post('/ApDataEntry/DeleteMultipleVouchers', idsToCancel)
                    .then((res) => {
                        if (res.data && res.data.success === false) {
                            toastr.error(res.data.message || "Not allowed");
                            return;
                        }
                        
                        this.vouchers = this.vouchers.filter(v => !this.selectedVouchers.includes(v.id));
                        this.selectedVouchers = [];
                        this.selectAll = false;

                        toastr.success("Selected vouchers deleted successfully");
                    })
                    .catch(() => toastr.error("Failed to delete selected vouchers"));

                return;
            }
            
            axios.get(`/ApDataEntry/DeleteVoucher?id=${this.modalDeleteId}`)
                .then((res) => {
                    if (res.data && res.data.success === false) {
                        toastr.error(res.data.message || "Not allowed");
                        return;
                    }
                    this.vouchers = this.vouchers.filter(v => v.id !== this.modalDeleteId);
                    toastr.success("Voucher deleted successfully");
                })
                .catch(() => toastr.error("Failed to delete voucher"));
        },
        printSelected() {
            if (this.selectedVouchers.length === 0) {
                toastr.info("No vouchers selected");
                return;
            }

            axios.post('/ApReports/GetPaymentVouchers', this.selectedVouchers)
                .then(response => {

                    this.reportData = response.data.result.reportDetails;
                    this.showReportOverlay = true;

                    this.$nextTick(() => {
                        this.renderBulkReport(this.reportData, this.reportPath);
                    });

                });
        },
        closeReport() {
            this.showReportOverlay = false;

            // optional cleanup
            $("#reportView").empty();
        },
        renderBulkReport(details, reportPath) {
                $("#reportView").empty();

                $("#reportView").boldReportViewer({

                    reportServiceUrl: this.reportApiBaseUrl,
                    processingMode: ej.ReportViewer.ProcessingMode.Local,
                    reportPath: reportPath,
                    dataSources: [{
                        value: details,
                        name: "DataSet1"
                    }]

                });

            },
        
    },
    mounted() {
        this.fetchVouchers();
        this.reportApiBaseUrl = reportApiBaseUrl;
    }
});
app.mount('#voucherApp');

