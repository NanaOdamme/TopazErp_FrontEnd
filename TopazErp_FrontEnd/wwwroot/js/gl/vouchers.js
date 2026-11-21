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

            if (window.history.replaceState) {
                const url = new URL(window.location);
                url.searchParams.set('tab', key);
                window.history.replaceState({}, '', url);
            }

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
                }

                const raw = this._extractList(response);
                this.supplierList = raw.map(v => this._mapVoucher(v, 'supplier'));
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
                }

                const raw = this._extractList(response);
                this.employeeList = raw.map(v => this._mapVoucher(v, 'employee'));
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
                }

                const raw = this._extractList(response);
                this.customerList = raw.map(v => this._mapVoucher(v, 'customer'));
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
            if (!res) return [];
            if (Array.isArray(res)) return res;
            if (Array.isArray(res.result)) return res.result;
            if (Array.isArray(res.result?.data)) return res.result.data;
            if (Array.isArray(res.result?.items)) return res.result.items;
            if (Array.isArray(res.data)) return res.data;
            if (Array.isArray(res.data?.items)) return res.data.items;
            return [];
        },

        _mapVoucher(v, tabKey = '') {
            const type = v.voucherType || tabKey || this.activeTab;

            // 1. Recipient display based on voucher type
            let recipient = '—';
            if (type === 'supplier') {
                recipient = v.supplierName || v.recipient || '—';
            } else if (type === 'employee') {
                recipient = v.employeeName || v.recipient || '—';
            } else if (type === 'customer') {
                recipient = v.customerName || v.recipient || '—';
            } else {
                recipient = v.supplierName || v.employeeName || v.customerName || v.recipient || '—';
            }

            const batchNumber = v.batchNo || v.batchNumber || '—';
            const wh = v.withholdingSettings || {};
            const summary = wh.summary || {};
            const baseAmount = parseFloat(wh.baseAmount != null ? wh.baseAmount : (v.baseAmount || 0));

            // 2. Compute GETFL + NHIL from taxFlags or legacy rate fields
            let getflNhil = 0;
            if (Array.isArray(wh.taxFlags) && wh.taxFlags.length) {
                wh.taxFlags.forEach(t => {
                    if ((t.key === 'getfl' || t.key === 'nhil') && t.enabled) {
                        const amt = (t.amount != null && parseFloat(t.amount) > 0)
                            ? parseFloat(t.amount)
                            : ((parseFloat(t.rate || 0) / 100) * baseAmount);
                        getflNhil += amt;
                    }
                });
            } else {
                const getflRate = parseFloat(v.getFundLevyRate || 0);
                const nhilRate  = parseFloat(v.nationalHealthInsuranceLevyRate || 0);
                getflNhil = ((getflRate / 100) * baseAmount) + ((nhilRate / 100) * baseAmount);
            }

            // 3. Compute VAT Amount
            let totalVatAmount = parseFloat(wh.totalVatAmount != null ? wh.totalVatAmount : (v.totalVatAmount || 0));
            if (!totalVatAmount && Array.isArray(wh.taxFlags)) {
                const vatFlag = wh.taxFlags.find(t => t.key === 'vat' && t.enabled);
                if (vatFlag) {
                    totalVatAmount = (vatFlag.amount != null && parseFloat(vatFlag.amount) > 0)
                        ? parseFloat(vatFlag.amount)
                        : ((parseFloat(vatFlag.rate || 0) / 100) * baseAmount);
                }
            }

            // 4. Withheld, VAT Withheld, Gross, Net
            const totalWithheld = parseFloat(
                summary.totalWithheld != null ? summary.totalWithheld : (v.totalWithheld || 0)
            );
            const totalVatWithheld = parseFloat(
                summary.totalVatWithheld != null ? summary.totalVatWithheld : (v.totalVatWithheld || 0)
            );
            const grossAmount = parseFloat(
                v.grossAmount != null ? v.grossAmount : (summary.grossAmount || 0)
            );
            const netAmount = parseFloat(
                v.netAmount != null ? v.netAmount : (summary.netAmount || 0)
            );

            // 5. Proposed journal entries for child grid
            const rawLines = Array.isArray(v.proposedJournalEntries)
                ? v.proposedJournalEntries
                : (v.proposedJournalEntries?.lines || v.proposedJournalEntry?.lines || v.lines || []);

            let lines = [];
            if (rawLines.length > 0) {
                lines = rawLines.map((l, idx) => ({
                    id:              l.id || `${v.id || 'pj'}_${idx}`,
                    batchNumber:     l.batchNumber || batchNumber || '',
                    referenceNumber: l.referenceNumber || '',
                    accountName:     l.accountDisplay || l.accountName || '',
                    description:     l.description || '',
                    debitAmount:     parseFloat(l.debitAmount || 0),
                    creditAmount:    parseFloat(l.creditAmount || 0),
                    ouName:          l.ouName || '--',
                    chequeNo:        l.chequeNo || v.chequeNo || '',
                }));
            } else if (Array.isArray(v.details) && v.details.length > 0) {
                lines = v.details.map((d, idx) => ({
                    id:              d.id || `${v.id || 'det'}_${idx}`,
                    batchNumber:     batchNumber || '',
                    referenceNumber: d.referenceNo || '',
                    accountName:     d.debitAccountName || '',
                    description:     d.description || '',
                    debitAmount:     parseFloat(d.localDebitAmount != null ? d.localDebitAmount : (d.amount || 0)),
                    creditAmount:    0,
                    ouName:          d.ouName || '--',
                    chequeNo:        v.chequeNo || '',
                }));
            }

            return {
                id:               v.id,
                voucherType:      type,
                recipient:        recipient,
                supplierName:     v.supplierName || recipient,
                employeeName:     v.employeeName || recipient,
                customerName:     v.customerName || recipient,
                batchNumber:      batchNumber,
                batchNo:          batchNumber,
                voucherEntryDate: v.voucherEntryDate ? String(v.voucherEntryDate).split('T')[0] : '',
                paymentDate:      v.paymentDate ? String(v.paymentDate).split('T')[0] : '',
                currencyName:     v.currencyCode || v.currencyName || 'GHS',
                currencyCode:     v.currencyCode || 'GHS',
                grossAmount:      grossAmount,
                baseAmount:       baseAmount,
                getflNhil:        parseFloat(getflNhil.toFixed(4)),
                totalVatAmount:   totalVatAmount,
                totalWithheld:    totalWithheld,
                totalVatWithheld: totalVatWithheld,
                netAmount:        netAmount,
                isPosted:         Boolean(v.isPosted != null ? v.isPosted : v.IsPosted),
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

        onSelectionChange(payload) {
            if (!payload) {
                this.selectedIds = [];
                return;
            }

            // Ignore nested child grid events
            if (payload.level && payload.level > 0) {
                return;
            }

            let raw = [];
            if (Array.isArray(payload.ids)) {
                raw = payload.ids;
            } else if (Array.isArray(payload)) {
                raw = payload;
            } else if (Array.isArray(payload.rows)) {
                raw = payload.rows.map(r => r?.id || r);
            }

            this.selectedIds = raw.map(item =>
                typeof item === 'object' && item !== null ? item.id : item
            ).filter(Boolean);
        },

        /* ══════════════════════════════════════════════════════
           Bulk Post
        ══════════════════════════════════════════════════════ */

        async postSelectedVouchers() {
            if (!this.selectedIds || this.selectedIds.length === 0) {
                this.toastHandler('warning', 'Please select at least one voucher to post.');
                return;
            }

            const list = this.activeList;
            const idSet = new Set(this.selectedIds.map(id => String(id).toLowerCase()));
            const toPost = list.filter(v => idSet.has(String(v.id).toLowerCase()) && !v.isPosted);

            if (toPost.length === 0) {
                this.toastHandler('warning', 'The selected voucher(s) are already posted.');
                return;
            }

            const isSingle = toPost.length === 1;
            const confirm = await Swal.fire({
                title: isSingle ? 'Post Voucher?' : `Post ${toPost.length} Vouchers?`,
                text: 'Posted vouchers will affect the general ledger permanently.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#059669',
                cancelButtonColor: '#64748b',
                confirmButtonText: isSingle ? 'Yes, Post' : `Yes, Post ${toPost.length}`,
            });
            if (!confirm.isConfirmed) return;

            this.isLoading = true;
            try {
                const ids = toPost.map(v => v.id);
                const payload = { ids: ids };
                 
                let response;
                try {
                    response = await axios.post('/GeneralLedger/PostVouchers', payload);
                } catch {
                     
                }

                if (response?.data && response.data.success === false) {
                    this.toastHandler('error',  'Unable to post selected voucher(s).');
                    return;
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
            const idSet = new Set(this.selectedIds.map(id => String(id).toLowerCase()));
            const unposted = list.filter(v => idSet.has(String(v.id).toLowerCase()) && !v.isPosted);
            const hasPosted = list.some(v => idSet.has(String(v.id).toLowerCase()) && v.isPosted);

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
                    response = await axios.post('/GeneralLedger/DeleteVouchers', { ids });
                } catch {
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

        onOpenForm(event) {
            const row = event?.row || event;
            if (!row || !row.id) return;

            // Close data-grid internal form modal if it tried to open
            if (event?.grid && typeof event.grid.closeForm === 'function') {
                event.grid.closeForm();
            }

            const id = encodeURIComponent(row.id);
            if (this.activeTab === 'supplier') {
                window.location.href = `/GeneralLedger/SupplierPaymentVoucherEdit?id=${id}`;
            } else if (this.activeTab === 'employee') {
                window.location.href = `/GeneralLedger/EmployeePaymentVoucherEdit?id=${id}`;
            } else if (this.activeTab === 'customer') {
                window.location.href = `/GeneralLedger/CustomerReceiptVoucherEdit?id=${id}`;
            }
        },

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
        // Read tab query parameter (e.g. ?tab=supplier | ?tab=employee | ?tab=customer) or hash
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab') || (window.location.hash ? window.location.hash.replace('#', '') : '');
        const validTabs = ['supplier', 'employee', 'customer'];
        if (tabParam && validTabs.includes(tabParam.toLowerCase())) {
            this.activeTab = tabParam.toLowerCase();
        }

        // Load active tab on mount
        this.loadActiveTab();

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
