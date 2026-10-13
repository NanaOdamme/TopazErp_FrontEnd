const app = Vue.createApp({
    data() {
        return {
            balances: [],
            searchQuery: '',
            expanded: [],
            currentPage: 1,
            perPage: 10,
            status: 'all',
            showDropdown: false,
            modalDeleteId: null,
            modalTitle: "",
            modalMessage: "",

        };
    },

    computed: {
        groupedBalances() {
            const groups = {};

            this.balances.forEach(b => {
                if (!groups[b.supplierId]) groups[b.supplierId] = [];
                groups[b.supplierId].push(b);
            });

            return groups;
        },

        filteredSuppliers() {
            const groups = this.groupedBalances;

            if (!this.searchQuery) return groups;

            const q = this.searchQuery.toLowerCase();
            const filtered = {};

            Object.keys(groups).forEach(supplierId => {
                if (groups[supplierId][0].supplierName.toLowerCase().includes(q)) {
                    filtered[supplierId] = groups[supplierId];
                }
            });

            return filtered;
        },

        paginatedSuppliers() {
            const supplierIds = Object.keys(this.filteredSuppliers);
            const start = (this.currentPage - 1) * this.perPage;
            const paginatedIds = supplierIds.slice(start, start + this.perPage);

            const result = {};
            paginatedIds.forEach(id => result[id] = this.filteredSuppliers[id]);
            return result;
        },

        totalPages() {
            return Math.ceil(Object.keys(this.filteredSuppliers).length / this.perPage) || 1;
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
        }
    },

    methods: {
        selectFromDropdown(supplierName) {
            this.searchQuery = supplierName;
            this.showDropdown = false;
            this.currentPage = 1;
        },

        hideDropdown() {
            setTimeout(() => this.showDropdown = false, 200);
        },
        fetchBalances() {
            axios.get('/ApDataEntry/GetOpeningBalances/')
                .then(res => {
                    this.balances = res.data;
                })
                .catch(() => toastr.error('Failed to load balances'));
        },

        toggleSupplier(id) {
            const index = this.expanded.indexOf(id);
            if (index >= 0) this.expanded.splice(index, 1);
            else this.expanded.push(id);
        },

        sumAmount(items) {
            return items.reduce((t, x) => t + (x.amount || 0), 0);
        },

        deleteBalance(id) {
            this.openConfirmDelete(id);
        },


        printReport(supplierId, status) {
            status =  this.status;
            const url = `/ApReports/PrintOpeningBalance?supplierId=${supplierId}&status=${status}`;
            window.open(url, "_blank");
        },
        editBalance(id) {
            window.location.href = `/ApDataEntry/EditBalance?id=${id}`;
        },

        postBalances() {
            axios.post('/ApDataEntry/InitPostBalances')
                .then(() => {
                    toastr.success('Opening balances posted');
                    this.fetchBalances();
                })
                .catch(() => toastr.error('Posting failed'));
        },

        formatNumber(n) {
            const x = parseFloat(n ?? 0);
            return isNaN(x)
                ? "-"
                : x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
        openConfirmDelete(id) {
            this.modalDeleteId = id;
            this.modalTitle = "Confirm Delete";
            this.modalMessage = "Are you sure you want to delete this opening balance entry?";
            $("#deleteConfirmModal").modal("show");
        },
        confirmDelete() {
            $("#deleteConfirmModal").modal("hide");

            axios.post('/ApDataEntry/DeleteOpeningBalances?id=' + this.modalDeleteId)
                .then(() => {
                    this.balances = this.balances.filter(x => x.id !== this.modalDeleteId);
                    toastr.success('Balance deleted');
                })
                .catch(() => toastr.error('Unable to delete balance'));
        }


    },

    mounted() {
        this.fetchBalances();
    }
});
app.mount('#openingBalanceApp');