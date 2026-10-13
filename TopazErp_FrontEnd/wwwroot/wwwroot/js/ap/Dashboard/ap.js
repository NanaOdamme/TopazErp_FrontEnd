const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            transactionDate: '',
            invoiceChartInstance: null,
            supplierChartInstance: null,
            invoiceAnalysisChartData: {
                labels: [],
                data: [],
                colors: []
            },
            supplierPaymentsChartData: {
                labels: [],
                balance: [],
                paid: []
            },
            supplierBalances: [],
            supplierInvoices: [],
            supplierPayments: [],
            currentPage: 1,
            currentBPage: 1,
            bItemsPerPage: 3,
            itemsPerPage: 3,
            sortKey: '',
            sortOrder: 'asc',
            bSortKey: '',
            supplierCount: 0,
            invoiceCount: 0,
            paymentCount: 0,
            postedInvoiceCount: 0,
            years:[2022, 2023, 2024, 2025],
        }
    },
    computed: {
        sortedBalances() {
            if (!this.bSortKey) return this.supplierBalances;
            return [...this.supplierBalances].sort((a, b) => {
                const valueA = a[this.bSortKey];
                const valueB = b[this.bSortKey];
                if (valueA < valueB) return this.sortOrder === 'asc' ? -1 : 1;
                if (valueA > valueB) return this.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        },
        paginatedBalances() {
            const start = (this.currentBPage - 1) * this.bItemsPerPage;
            const end = this.currentBPage * this.bItemsPerPage;
            return this.sortedBalances.slice(start, end);
        },

        sortedInvoices() {
            if (!this.sortKey) return this.supplierInvoices;
            return [...this.supplierInvoices].sort((a, b) => {
                const valueA = a[this.sortKey];
                const valueB = b[this.sortKey];
                if (valueA < valueB) return this.sortOrder === 'asc' ? -1 : 1;
                if (valueA > valueB) return this.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        },
        paginatedInvoices() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = this.currentPage * this.itemsPerPage;
            return this.sortedInvoices.slice(start, end);
        },
        totalPages() {
            return Math.ceil(this.supplierInvoices.length / this.itemsPerPage);
        },

        totalBPages() {
            return Math.ceil(this.supplierBalances.length / this.itemsPerPage);
        }

    },
    methods: {
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

        getDashboardData() {
            axios.get('/Dashboard/GetApDashboardData')
                .then(response => {

                    // -----------------------------
                    // 1. INVOICE ANALYSIS DATA
                    // -----------------------------
                    const invoiceData =
                        response.data.invoiceAnalysis?.InvoiceAnalysis?.[0] || {};

                    // Build Chart.js-friendly structure
                    this.invoiceAnalysisChartData.labels = [
                        'Unpaid',
                        'Part Paid',
                        'Fully Paid',
                        'Approved',
                        'Pending Approval'
                    ];

                    this.invoiceAnalysisChartData.data = [
                        invoiceData.unpaidCount || 0,
                        invoiceData.partialCount || 0,
                        invoiceData.fullyPaidCount || 0,
                        invoiceData.approvedCount || 0,
                        invoiceData.unapprovedCount || 0
                    ];

                    this.invoiceAnalysisChartData.colors = [
                        '#FF4E42',
                        '#FFB547',
                        '#00E396',
                        '#1f9aff',
                        '#8884d8'
                    ];

                    // -----------------------------
                    // 2. SUPPLIER DATA
                    // -----------------------------
                    this.supplierBalances =
                        response.data.supplierOpeningBalance?.supplierOpeningBalances || [];

                    this.supplierInvoices =
                        response.data.supplierInvoices?.supplierInvoices || [];

                    this.supplierPayments =
                        response.data.supplierPayments?.SupplierPayments || [];

                    // dashboard counts
                    this.supplierCount = response.data.calculations?.SuppliersWithBalance || 0;
                    this.invoiceCount = response.data.calculations?.TotalInvoices || 0;
                    this.postedInvoiceCount = response.data.calculations?.PostedInvoices || 0;
                    this.paymentCount = response.data.calculations?.PostedPayments || 0;

                    // -----------------------------
                    // 3. SUPPLIER PAYMENTS CHART DATA
                    // -----------------------------
                    const suppliers = [];
                    const totalPaid = [];
                    const invoiceBalance = [];

                    (this.supplierPayments || []).forEach(v => {
                        suppliers.push(v.supplierName);
                        totalPaid.push(v.totalPaid || 0);
                        invoiceBalance.push(v.invoiceBalance || 0);
                    });

                    this.supplierPaymentsChartData.labels = suppliers;
                    this.supplierPaymentsChartData.paid = totalPaid;
                    this.supplierPaymentsChartData.balance = invoiceBalance;

                    // -----------------------------
                    // 4. RENDER CHARTS SAFELY
                    // (wait until DOM is ready)
                    // -----------------------------
                    this.$nextTick(() => {
                        this.renderInvoiceChart();
                        this.renderSupplierChart();
                    });

                })
                .catch(err => {
                    console.error(err);
                    this.toastHandler('error', 'Unable to retrieve dashboard data.');
                });
        },

        renderInvoiceChart() {
            const ctx = document.getElementById('invoiceChart');

            if (this.invoiceChartInstance) {
                this.invoiceChartInstance.destroy();
            }

            this.invoiceChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: this.invoiceAnalysisChartData.labels,
                    datasets: [{
                        data: this.invoiceAnalysisChartData.data,
                        backgroundColor: this.invoiceAnalysisChartData.colors
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        },
        renderSupplierChart() {
            const ctx = document.getElementById('supplierChart');

            if (this.supplierChartInstance) {
                this.supplierChartInstance.destroy();
            }

            this.supplierChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: this.supplierPaymentsChartData.labels,
                    datasets: [
                        {
                            label: 'Balance Due',
                            data: this.supplierPaymentsChartData.balance
                        },
                        {
                            label: 'Amount Paid',
                            data: this.supplierPaymentsChartData.paid
                        }
                    ]
                },
                options: {
                    responsive: true
                }
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

        },,
        sortBTable(key) {
            if (this.bSortKey === key) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                this.bSortKey = key;
                this.sortOrder = 'asc';
            }
        },
        nextBPage() {
            if (this.currentBPage < this.totalBPages) this.currentBPage++;
        },
        prevBPage() {
            if (this.currentBPage > 1) this.currentBPage--;
        },
        sortTable(key) {
            if (this.sortKey === key) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortKey = key;
                this.sortOrder = 'asc';
            }
        },
        nextPage() {
            if (this.currentPage < this.totalPages) this.currentPage++;
        },
        prevPage() {
            if (this.currentPage > 1) this.currentPage--;
        },

    },
    mounted() {
        this.getDashboardData();
    }
});
app.mount('#app');

