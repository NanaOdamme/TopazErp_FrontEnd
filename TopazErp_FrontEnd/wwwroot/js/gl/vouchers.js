const app = Vue.createApp({
    data() {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        return {
            theme: '#0645e7',
            isShimmerLoading: false,
            isLoading: false,
            showCreateMenu: false,

            // Active tab
            activeTab: 'supplier', // 'supplier' | 'employee' | 'customer'

            // Tab definitions
            tabs: [
                { key: 'supplier', label: 'Supplier Payment',  icon: 'bi bi-building',      count: 0 },
                { key: 'employee', label: 'Employee Payment',  icon: 'bi bi-person-badge',   count: 0 },
                { key: 'customer', label: 'Customer Receipt',  icon: 'bi bi-receipt',        count: 0 },
            ],

            // Filter state (shared across tabs)
            filterParams: {
                startDate: threeMonthsAgo.toISOString().split('T')[0],
                endDate:   new Date().toISOString().split('T')[0],
            },

            // Data lists per tab
            supplierList: [],
            employeeList: [],
            customerList: [],

            // Selection (re-used by active tab)
            selectedIds: [],

            // Track which tabs have been loaded
            loadedTabs: new Set(),
        };
    },

    computed: {
        /* ── Shared child-grid config (journal lines) ────────── */
        journalLinesConfig() {
            return {
                key: 'proposedJournalEntries',
                columns: [
                    { key: 'id',              label: 'ID',              type: 'text',   hidden: true },
                    { key: 'batchNumber',     label: 'Batch No',        type: 'text',   hidden: true },
                    { key: 'referenceNumber', label: 'Reference No.',   type: 'text',   width: 140, searchable: true },
                    { key: 'accountName',     label: 'Account Name',    type: 'text',   width: 240, searchable: true },
                    { key: 'description',     label: 'Description',     type: 'text',   width: 280, searchable: true },
                    { key: 'debitAmount',     label: 'Debit Amount',    type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 150 },
                    { key: 'creditAmount',    label: 'Credit Amount',   type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 150 },
                    { key: 'ouName',          label: 'Cost Center',     type: 'text',   width: 180 },
                    { key: 'chequeNo',        label: 'Cheque No.',      type: 'text',   width: 130 },
                ]
            };
        },

        /* ── Supplier columns ────────────────────────────────── */
        supplierColumns() {
            return [
                { key: 'id',               label: 'ID',            type: 'text',   hidden: true },
                { key: 'recipient',        label: 'Supplier Name', type: 'avatar', width: 220, minWidth: 180, searchable: true, subtitleKey: 'batchNumber' },
                { key: 'batchNumber',      label: 'Batch No',      type: 'text',   width: 150, searchable: true },
                { key: 'voucherEntryDate', label: 'Date',          type: 'date',   width: 130 },
                { key: 'currencyName',     label: 'Currency',      type: 'text',   width: 110 },
                { key: 'grossAmount',      label: 'Gross Amount',  type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 160 },
                { key: 'getflNhil',        label: 'GETFL + NHIL',  type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 150 },
                { key: 'totalVatAmount',   label: 'VAT',           type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 130 },
                { key: 'totalWithheld',    label: 'Withheld',      type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 130 },
                { key: 'totalVatWithheld', label: 'VAT WH',        type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 120 },
                { key: 'netAmount',        label: 'Net Amount',    type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 150 },
                {
                    key: 'isPosted', label: 'Status', type: 'badge', width: 120,
                    options: [
                        { value: true,  label: 'Posted',  color: 'green' },
                        { value: false, label: 'Draft',   color: 'amber' },
                    ]
                },
            ];
        },

        /* ── Employee columns ────────────────────────────────── */
        employeeColumns() {
            return [
                { key: 'id',               label: 'ID',             type: 'text',   hidden: true },
                { key: 'recipient',        label: 'Employee Name',  type: 'avatar', width: 220, minWidth: 180, searchable: true, subtitleKey: 'batchNumber' },
                { key: 'batchNumber',      label: 'Batch No',       type: 'text',   width: 150, searchable: true },
                { key: 'voucherEntryDate', label: 'Date',           type: 'date',   width: 130 },
                { key: 'currencyName',     label: 'Currency',       type: 'text',   width: 110 },
                { key: 'grossAmount',      label: 'Gross Amount',   type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 160 },
                { key: 'getflNhil',        label: 'GETFL + NHIL',   type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 150 },
                { key: 'totalVatAmount',   label: 'VAT',            type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 130 },
                { key: 'totalWithheld',    label: 'Withheld',       type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 130 },
                { key: 'totalVatWithheld', label: 'VAT WH',         type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 120 },
                { key: 'netAmount',        label: 'Net Amount',     type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 150 },
                {
                    key: 'isPosted', label: 'Status', type: 'badge', width: 120,
                    options: [
                        { value: true,  label: 'Posted', color: 'green' },
                        { value: false, label: 'Draft',  color: 'amber' },
                    ]
                },
            ];
        },

        /* ── Customer columns ────────────────────────────────── */
        customerColumns() {
            return [
                { key: 'id',               label: 'ID',            type: 'text',   hidden: true },
                { key: 'recipient',        label: 'Customer Name', type: 'avatar', width: 220, minWidth: 180, searchable: true, subtitleKey: 'batchNumber' },
                { key: 'batchNumber',      label: 'Batch No',      type: 'text',   width: 150, searchable: true },
                { key: 'voucherEntryDate', label: 'Date',          type: 'date',   width: 130 },
                { key: 'currencyName',     label: 'Currency',      type: 'text',   width: 110 },
                { key: 'grossAmount',      label: 'Gross Amount',  type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 160 },
                { key: 'netAmount',        label: 'Net Amount',    type: 'number', format: 'currency', currency: 'GHS', digits: 2, width: 150 },
                {
                    key: 'isPosted', label: 'Status', type: 'badge', width: 120,
                    options: [
                        { value: true,  label: 'Posted', color: 'green' },
                        { value: false, label: 'Draft',  color: 'amber' },
                    ]
                },
            ];
        },

        /* ── The list of the currently active tab ────────────── */
        activeList() {
            if (this.activeTab === 'supplier') return this.supplierList;
            if (this.activeTab === 'employee') return this.employeeList;
            return this.customerList;
        },
    },

    methods: {

        /* ══════════════════════════════════════════════════════
           Tab Switching
        ══════════════════════════════════════════════════════ */

        switchTab(key) {
            if (this.activeTab === key) return;
            this.activeTab = key;
            this.selectedIds = [];

            if (!this.loadedTabs.has(key)) {
                this.loadActiveTab();
            }
        },

        /* ══════════════════════════════════════════════════════
           Data Fetching
        ══════════════════════════════════════════════════════ */

        loadActiveTab() {
            if (this.activeTab === 'supplier') this.getSupplierVouchers();
            else if (this.activeTab === 'employee') this.getEmployeeVouchers();
            else this.getCustomerVouchers();
        },

        async getSupplierVouchers() {
            this.isShimmerLoading = true;
            try {
                const params = new URLSearchParams({
                    voucherType: 'supplier',
                    startDate:   this.filterParams.startDate,
                    endDate:     this.filterParams.endDate,
                });

                let response;
                try {
                    response = await axios.get(`/GeneralLedger/GetVoucherData?${params}`);
                } catch {
                    response = await axios.get(`/LedgerDataEntry/GetVoucherData?${params}`);
                }

                const raw = this._extractList(response);
                this.supplierList = raw.map(v => this._mapVoucher(v));
                this._updateTabCount('supplier', this.supplierList.length);
                this.loadedTabs.add('supplier');
            } catch (err) {
                console.error(err);
                this.toastHandler('error', 'Unable to retrieve supplier payment vouchers.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async getEmployeeVouchers() {
            this.isShimmerLoading = true;
            try {
                const params = new URLSearchParams({
                    voucherType: 'employee',
                    startDate:   this.filterParams.startDate,
                    endDate:     this.filterParams.endDate,
                });

                let response;
                try {
                    response = await axios.get(`/GeneralLedger/GetVoucherData?${params}`);
                } catch {
                    response = await axios.get(`/LedgerDataEntry/GetVoucherData?${params}`);
                }

                const raw = this._extractList(response);
                this.employeeList = raw.map(v => this._mapVoucher(v));
                this._updateTabCount('employee', this.employeeList.length);
                this.loadedTabs.add('employee');
            } catch (err) {
                console.error(err);
                this.toastHandler('error', 'Unable to retrieve employee payment vouchers.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async getCustomerVouchers() {
            this.isShimmerLoading = true;
            try {
                const params = new URLSearchParams({
                    voucherType: 'customer',
                    startDate:   this.filterParams.startDate,
                    endDate:     this.filterParams.endDate,
                });

                let response;
                try {
                    response = await axios.get(`/GeneralLedger/GetVoucherData?${params}`);
                } catch {
                    response = await axios.get(`/LedgerDataEntry/GetVoucherData?${params}`);
                }

                const raw = this._extractList(response);
                this.customerList = raw.map(v => this._mapVoucher(v));
                this._updateTabCount('customer', this.customerList.length);
                this.loadedTabs.add('customer');
            } catch (err) {
                console.error(err);
                this.toastHandler('error', 'Unable to retrieve customer receipt vouchers.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ══════════════════════════════════════════════════════
           Data Mapping Helpers
        ══════════════════════════════════════════════════════ */

        _extractList(response) {
            const res = response?.data;
            return res?.result?.data || res?.result || res?.data || (Array.isArray(res) ? res : []);
        },

        _mapVoucher(v) {
            const getflNhil =
                ((v.getFundLevyRate / 100) * v.baseAmount || 0) +
                ((v.nationalHealthInsuranceLevyRate / 100) * v.baseAmount || 0);

            const lines = (v.proposedJournalEntries || []).map(l => ({
                id:              l.id || '',
                batchNumber:     l.batchNumber || v.batchNumber || '',
                referenceNumber: l.referenceNumber || '',
                accountName:     l.accountName || '',
                description:     l.description || '',
                debitAmount:     parseFloat(l.debitAmount || 0),
                creditAmount:    parseFloat(l.creditAmount || 0),
                ouName:          l.ouName || '',
                chequeNo:        l.chequeNo || '',
            }));

            return {
                id:               v.id,
                recipient:        v.recipient || '—',
                batchNumber:      v.batchNumber || '—',
                voucherEntryDate: v.voucherEntryDate ? String(v.voucherEntryDate).split('T')[0] : '',
                currencyName:     v.currencyName || '—',
                grossAmount:      parseFloat(v.grossAmount || 0),
                baseAmount:       parseFloat(v.baseAmount  || 0),
                getflNhil:        parseFloat(getflNhil.toFixed(4)),
                totalVatAmount:   parseFloat(v.totalVatAmount   || 0),
                totalWithheld:    parseFloat(v.totalWithheld    || 0),
                totalVatWithheld: parseFloat(v.totalVatWithheld || 0),
                netAmount:        parseFloat(v.netAmount || 0),
                isPosted:         Boolean(v.isPosted || v.IsPosted),
                proposedJournalEntries: lines,
            };
        },

        _updateTabCount(key, count) {
            const tab = this.tabs.find(t => t.key === key);
            if (tab) tab.count = count;
        },

        /* ══════════════════════════════════════════════════════
           Filters
        ══════════════════════════════════════════════════════ */

        resetFilters() {
            const d = new Date();
            d.setMonth(d.getMonth() - 3);
            this.filterParams.startDate = d.toISOString().split('T')[0];
            this.filterParams.endDate   = new Date().toISOString().split('T')[0];
            this.loadActiveTab();
        },

        /* ══════════════════════════════════════════════════════
           Selection
        ══════════════════════════════════════════════════════ */

        onSelectionChange(selected) {
            if (Array.isArray(selected)) {
                this.selectedIds = selected.map(item =>
                    typeof item === 'object' && item !== null ? item.id : item
                );
            }
        },

        /* ══════════════════════════════════════════════════════
           Bulk Post
        ══════════════════════════════════════════════════════ */

        async postSelectedVouchers() {
            const list = this.activeList;
            const idSet = new Set(this.selectedIds.map(String));
            const toPost = list.filter(v => idSet.has(String(v.id)) && !v.isPosted);

            if (toPost.length === 0) {
                this.toastHandler('warning', 'No unposted vouchers selected to post.');
                return;
            }

            const confirm = await Swal.fire({
                title: `Post ${toPost.length} Voucher${toPost.length !== 1 ? 's' : ''}?`,
                text: 'Posted vouchers will affect the general ledger permanently.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#059669',
                cancelButtonColor: '#64748b',
                confirmButtonText: `Yes, Post ${toPost.length}`,
            });
            if (!confirm.isConfirmed) return;

            this.isLoading = true;
            try {
                const ids = toPost.map(v => v.id);
                let response;
                try {
                    response = await axios.post('/GeneralLedger/PostVouchers', ids);
                } catch {
                    response = await axios.post('/LedgerDataEntry/PostVouchers', { ids });
                }
                this.toastHandler('success', `${ids.length} voucher(s) posted successfully.`);
                this.selectedIds = [];
                this.loadActiveTab();
            } catch (err) {
                console.error(err);
                this.toastHandler('error', 'Unable to post selected vouchers.');
            } finally {
                this.isLoading = false;
            }
        },

        /* ══════════════════════════════════════════════════════
           Bulk Delete
        ══════════════════════════════════════════════════════ */

        async deleteSelectedVouchers() {
            const list = this.activeList;
            const idSet = new Set(this.selectedIds.map(String));
            const unposted = list.filter(v => idSet.has(String(v.id)) && !v.isPosted);
            const hasPosted = list.some(v => idSet.has(String(v.id)) && v.isPosted);

            if (hasPosted) {
                await Swal.fire({
                    title: 'Posted Vouchers Included',
                    text: 'Some selected vouchers are already posted and cannot be deleted. Only draft vouchers will be deleted.',
                    icon: 'warning',
                    confirmButtonColor: '#64748b',
                });
            }

            if (unposted.length === 0) {
                this.toastHandler('warning', 'No deletable draft vouchers selected.');
                return;
            }

            const confirm = await Swal.fire({
                title: `Delete ${unposted.length} Voucher${unposted.length !== 1 ? 's' : ''}?`,
                text: 'This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Delete',
            });
            if (!confirm.isConfirmed) return;

            this.isLoading = true;
            try {
                const ids = unposted.map(v => v.id);
                let response;
                try {
                    response = await axios.post('/GeneralLedger/DeleteVouchers', ids);
                } catch {
                    response = await axios.post('/LedgerDataEntry/DeleteVouchers', { ids });
                }
                this.toastHandler('success', `${ids.length} voucher(s) deleted successfully.`);
                this.selectedIds = [];
                this.loadActiveTab();
            } catch (err) {
                console.error(err);
                this.toastHandler('error', 'Unable to delete selected vouchers.');
            } finally {
                this.isLoading = false;
            }
        },

        /* ══════════════════════════════════════════════════════
           DataGrid Event Handlers
        ══════════════════════════════════════════════════════ */

        async onDelete(event) {
            const rows = event?.rows || (event?.row ? [event.row] : []);
            if (!rows || rows.length === 0) return;

            const unposted = rows.filter(r => !r.isPosted);
            if (unposted.length === 0) {
                this.toastHandler('warning', 'Posted vouchers cannot be deleted.');
                return;
            }

            const ids = unposted.map(r => r.id);
            try {
                let response;
                try {
                    response = await axios.post('/GeneralLedger/DeleteVouchers', ids);
                } catch {
                    response = await axios.post('/LedgerDataEntry/DeleteVouchers', { ids });
                }
                this.toastHandler('success', 'Voucher(s) deleted successfully.');
                this.loadActiveTab();
            } catch (e) {
                this.toastHandler('error', 'Unable to delete voucher(s).');
            }
        },

        /* ══════════════════════════════════════════════════════
           Utilities
        ══════════════════════════════════════════════════════ */

        toastHandler(type, message = 'An unexpected error occurred.') {
            if (typeof Swal === 'undefined') {
                console.log(`[Toast ${type}]: ${message}`);
                return;
            }
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'success',
                title: message,
                showConfirmButton: false,
                timer: 3500,
                timerProgressBar: true,
            });
        },
    },

    created() {
        // Load default tab on mount
        this.getSupplierVouchers();

        // Close the create-menu dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const wrapper = document.getElementById('createMenuWrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                this.showCreateMenu = false;
            }
        });
    },
});

// Register DataGrid component
if (typeof DataGridPlugin !== 'undefined') {
    app.use(DataGridPlugin);
} else if (typeof DataGrid !== 'undefined') {
    app.component('data-grid', DataGrid);
}

app.mount('#app');
