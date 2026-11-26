/**
 * General Ledger - Petty Cash Listings (Vue 3)
 * Design matches the Journal Transactions page.
 */
const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            isShimmerLoading: false,

            // Raw list from server
            pettyCashList: [],
            accountsList: [],
            pettyCashAccounts: [],

            // ── Filter state (all client-side, mirroring Journal) ──────────
            useDateFilter: false,
            activeDatePreset: 'all',   // 'today' | 'month' | '3months' | 'year' | 'custom' | 'all'
            startDate: '',
            endDate: '',
            postingStatus: 'all',      // 'all' | 'unposted' | 'posted'
            accountFilter: 'all',      // 'all' | <accountId>
            searchQuery: '',

            // Collapsible state
            expandedIds: [],

            // Selection state for batch operations
            selectedIds: [],

            // Pagination
            currentPage: 1,
            pageSize: 15,
            pageSizeOptions: [10, 15, 25, 50, 100]
        };
    },

    computed: {
        /* ── Client-side filtered list ───────────────────────────── */
        filteredPettyCashList() {
            let list = this.pettyCashList || [];

            // Posting status
            if (this.postingStatus === 'posted') {
                list = list.filter(b => b.isPosted === true);
            } else if (this.postingStatus === 'unposted') {
                list = list.filter(b => b.isPosted === false);
            }

            // Account filter
            if (this.accountFilter && this.accountFilter !== 'all') {
                list = list.filter(b =>
                    String(b.pettyCashAccountId).toLowerCase() === String(this.accountFilter).toLowerCase()
                );
            }

            // Date range filter
            if (this.useDateFilter) {
                if (this.startDate) {
                    list = list.filter(b => {
                        const d = (b.batchDate || '').split('T')[0];
                        return d && d >= this.startDate;
                    });
                }
                if (this.endDate) {
                    list = list.filter(b => {
                        const d = (b.batchDate || '').split('T')[0];
                        return d && d <= this.endDate;
                    });
                }
            }

            // Search query
            if (this.searchQuery && this.searchQuery.trim() !== '') {
                const q = this.searchQuery.toLowerCase().trim();
                list = list.filter(b => {
                    const batchMatch = (b.batchNo || '').toLowerCase().includes(q);
                    const accountMatch = (b.pettyCashAccountName || '').toLowerCase().includes(q);
                    const originatorMatch = (b.batchOriginator || '').toLowerCase().includes(q);
                    const sourceMatch = (b.sourceDocNo || '').toLowerCase().includes(q);
                    const detailMatch = (b.details || []).some(d =>
                        (d.expenseAccountName || d.accountName || d.glAccountName || '').toLowerCase().includes(q) ||
                        (d.description || '').toLowerCase().includes(q) ||
                        (d.ouName || '').toLowerCase().includes(q) ||
                        (d.refNo || d.referenceNo || d.referenceNumber || '').toLowerCase().includes(q)
                    );
                    const pjMatch = (this.getProposedJournalLines(b) || []).some(l =>
                        (l.accountName || '').toLowerCase().includes(q) ||
                        (l.description || '').toLowerCase().includes(q) ||
                        (l.ouName || '').toLowerCase().includes(q) ||
                        (l.referenceNumber || '').toLowerCase().includes(q)
                    );
                    return batchMatch || accountMatch || originatorMatch || sourceMatch || detailMatch || pjMatch;
                });
            }

            return list;
        },

        /* ── Paginated ───────────────────────────────────────────── */
        paginatedBatches() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredPettyCashList.slice(start, start + this.pageSize);
        },

        totalPages() {
            return Math.ceil(this.filteredPettyCashList.length / this.pageSize) || 1;
        },

        startIndex() {
            return this.filteredPettyCashList.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
        },

        endIndex() {
            return Math.min(this.currentPage * this.pageSize, this.filteredPettyCashList.length);
        },

        /* ── KPI metrics ─────────────────────────────────────────── */
        totalBatches() {
            return this.filteredPettyCashList.length;
        },

        totalDisbursements() {
            return this.filteredPettyCashList.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
        },

        postedCount() {
            return this.filteredPettyCashList.filter(b => b.isPosted).length;
        },

        unpostedCount() {
            return this.filteredPettyCashList.filter(b => !b.isPosted).length;
        },

        /* ── Batch Selection Helpers ─────────────────────────────── */
        selectedBatches() {
            const idSet = new Set(this.selectedIds.map(String));
            return this.filteredPettyCashList.filter(b => idSet.has(String(b.id)));
        },

        selectedUnpostedCount() {
            return this.selectedBatches.filter(b => !b.isPosted).length;
        },

        isAllSelected() {
            if (this.paginatedBatches.length === 0) return false;
            return this.paginatedBatches.every(b => this.selectedIds.includes(String(b.id)));
        },

        /* ── Expand All helper ───────────────────────────────────── */
        isAllExpanded() {
            return this.filteredPettyCashList.length > 0 &&
                this.filteredPettyCashList.every(b => this.expandedIds.includes(b.id));
        }
    },

    watch: {
        // Reset to page 1 and clear selection when any filter changes
        searchQuery()     { this.currentPage = 1; this.selectedIds = []; },
        postingStatus()   { this.currentPage = 1; this.selectedIds = []; },
        accountFilter()   { this.currentPage = 1; this.selectedIds = []; },
        useDateFilter()   { this.currentPage = 1; this.selectedIds = []; },
        startDate()       { this.currentPage = 1; this.selectedIds = []; },
        endDate()         { this.currentPage = 1; this.selectedIds = []; },
        pageSize()        { this.currentPage = 1; this.selectedIds = []; }
    },

    methods: {

        /* ── Formatting ──────────────────────────────────────────── */
        fmtCurrency(num) {
            if (num === null || num === undefined || isNaN(num)) return '0.00';
            const val = Number(num);
            if (val < 0) {
                return `(${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
            }
            return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        fmtDate(dateVal) {
            if (!dateVal) return '—';
            try {
                const d = new Date(dateVal);
                if (isNaN(d.getTime())) return String(dateVal).split('T')[0];
                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
            } catch {
                return String(dateVal).split('T')[0];
            }
        },

        /* ── Expand / Collapse ───────────────────────────────────── */
        isExpanded(id) {
            if (!id) return false;
            return this.expandedIds.includes(String(id));
        },

        toggleExpand(id) {
            if (!id) return;
            const strId = String(id);
            const idx = this.expandedIds.indexOf(strId);
            if (idx === -1) {
                this.expandedIds.push(strId);
            } else {
                this.expandedIds.splice(idx, 1);
            }
        },

        expandAll() {
            this.expandedIds = this.filteredPettyCashList
                .map(b => String(b.id || b.batchNo || ''))
                .filter(Boolean);
        },

        collapseAll() {
            this.expandedIds = [];
        },

        toggleAllExpansion() {
            if (this.isAllExpanded) {
                this.collapseAll();
            } else {
                this.expandAll();
            }
        },

        /* ── Selection Handling ──────────────────────────────────── */
        toggleSelectAll() {
            if (this.isAllSelected) {
                const currentIds = new Set(this.paginatedBatches.map(b => String(b.id)));
                this.selectedIds = this.selectedIds.filter(id => !currentIds.has(String(id)));
            } else {
                const currentIds = this.paginatedBatches.map(b => String(b.id));
                this.selectedIds = Array.from(new Set([...this.selectedIds, ...currentIds]));
            }
        },

        toggleSelectBatch(id) {
            if (!id) return;
            const strId = String(id);
            const idx = this.selectedIds.indexOf(strId);
            if (idx > -1) {
                this.selectedIds.splice(idx, 1);
            } else {
                this.selectedIds.push(strId);
            }
        },

        clearSelection() {
            this.selectedIds = [];
        },

        /* ── Post Actions (mirroring Vouchers) ────────────────────── */
        async postSingleBatch(batch) {
            if (!batch || !batch.id) return;
            if (batch.isPosted) {
                this.toast('info', 'This petty cash batch is already posted.');
                return;
            }

            const confirm = await Swal.fire({
                title: 'Post Voucher?',
                text: 'Posted vouchers will affect the general ledger permanently.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#059669',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Post',
                cancelButtonText: 'Cancel'
            });

            if (!confirm.isConfirmed) return;

            this.isShimmerLoading = true;
            try {
                const ids = [batch.id];
                const payload = { ids: ids };

                let resp;
                try {
                    resp = await axios.post('/GeneralLedger/PostPettyCash', payload);
                } catch (_) {
                    resp = await axios.post('/GeneralLedger/PostPettyCashBatches', payload);
                }

                if (resp?.data && (resp.data.success === false || resp.data.isSuccessful === false)) {
                    this.toast('error', resp.data.message || resp.data.error || 'Unable to post selected voucher(s).');
                    return;
                }

                this.toast('success', '1 voucher(s) posted successfully.');
                await this.getPettyCashList();
            } catch (err) {
                console.error('Error posting petty cash batch:', err);
                const errMsg = err?.response?.data?.message || err?.message || 'Unable to post selected vouchers.';
                this.toast('error', errMsg);
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async postSelectedBatches() {
            if (!this.selectedIds || this.selectedIds.length === 0) {
                this.toast('warning', 'Please select at least one voucher to post.');
                return;
            }

            const list = this.pettyCashList;
            const idSet = new Set(this.selectedIds.map(id => String(id).toLowerCase()));
            const toPost = list.filter(b => idSet.has(String(b.id).toLowerCase()) && !b.isPosted);

            if (toPost.length === 0) {
                this.toast('warning', 'The selected voucher(s) are already posted.');
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
                cancelButtonText: 'Cancel'
            });

            if (!confirm.isConfirmed) return;

            this.isShimmerLoading = true;
            try {
                const ids = toPost.map(b => b.id);
                const payload = { ids: ids };

                let resp;
                try {
                    resp = await axios.post('/GeneralLedger/PostPettyCash', payload);
                } catch (_) {
                    resp = await axios.post('/GeneralLedger/PostPettyCashBatches', payload);
                }

                if (resp?.data && (resp.data.success === false || resp.data.isSuccessful === false)) {
                    this.toast('error', resp.data.message || resp.data.error || 'Unable to post selected voucher(s).');
                    return;
                }

                this.toast('success', `${ids.length} voucher(s) posted successfully.`);
                this.selectedIds = [];
                await this.getPettyCashList();
            } catch (err) {
                console.error('Error posting selected batches:', err);
                const errMsg = err?.response?.data?.message || err?.message || 'Unable to post selected vouchers.';
                this.toast('error', errMsg);
            } finally {
                this.isShimmerLoading = false;
            }
        },

        postSelectedVouchers() {
            return this.postSelectedBatches();
        },

        /* ── Proposed Journal Entries Helpers (matches Voucher listings) ── */
        getProposedJournalLines(batch) {
            if (!batch) return [];

            // 1. Check if batch.proposedJournalEntries already contains lines
            const raw = batch.proposedJournalEntries || batch.proposedJournalEntry || batch.proposedJournal;
            let rawLines = [];
            if (Array.isArray(raw)) {
                rawLines = raw;
            } else if (raw && Array.isArray(raw.lines)) {
                rawLines = raw.lines;
            } else if (raw && Array.isArray(raw.items)) {
                rawLines = raw.items;
            }

            let lines = [];
            if (rawLines.length > 0) {
                lines = rawLines.map((l, idx) => ({
                    id:              l.id || `${batch.id || 'pj'}_${idx}`,
                    batchNumber:     l.batchNumber || batch.batchNo || '',
                    referenceNumber: l.referenceNumber || l.referenceNo || batch.batchNo || '',
                    accountName:     l.accountDisplay || l.accountName || this._resolveAccountName(l.accountId) || '—',
                    description:     l.description || '',
                    debitAmount:     parseFloat(l.debitAmount || 0),
                    creditAmount:    parseFloat(l.creditAmount || 0),
                    ouName:          l.ouName || '--',
                    chequeNo:        l.chequeNo || '',
                }));
            } else if (Array.isArray(batch.details) && batch.details.length > 0) {
                // Synthesize proposed journal lines from expense lines and petty cash credit
                let sumDebit = 0;
                batch.details.forEach((d, idx) => {
                    const amt = parseFloat(d.amount != null ? d.amount : (d.debitAmount || d.localDebitAmount || 0));
                    sumDebit += amt;
                    lines.push({
                        id:              d.id || `${batch.id || 'det'}_${idx}`,
                        batchNumber:     batch.batchNo || '',
                        referenceNumber: d.refNo || d.referenceNo || d.referenceNumber || batch.batchNo || '',
                        accountName:     d.expenseAccountName || d.accountName || d.glAccountName || this._resolveAccountName(d.expenseAccountId) || 'Expense Account',
                        description:     d.description || '',
                        debitAmount:     amt,
                        creditAmount:    0,
                        ouName:          d.ouName || '--',
                        chequeNo:        d.chequeNo || '',
                    });
                });

                // Balancing Credit line for Petty Cash Account
                const creditAmt = parseFloat(batch.totalAmount || sumDebit || 0);
                const firstOu = (batch.details[0] && batch.details[0].ouName) || '--';
                lines.push({
                    id:              `credit_${batch.id || batch.batchNo}`,
                    batchNumber:     batch.batchNo || '',
                    referenceNumber: batch.sourceDocNo || batch.batchNo || '',
                    accountName:     batch.pettyCashAccountName || this._resolveAccountName(batch.pettyCashAccountId) || 'Petty Cash Account',
                    description:     `Petty cash disbursement - Batch #${batch.batchNo || ''}`,
                    debitAmount:     0,
                    creditAmount:    creditAmt,
                    ouName:          firstOu,
                    chequeNo:        '',
                });
            }

            return lines;
        },

        getProposedJournalTotals(batch) {
            const lines = this.getProposedJournalLines(batch);
            let debit = 0;
            let credit = 0;
            lines.forEach(l => {
                debit += parseFloat(l.debitAmount || 0);
                credit += parseFloat(l.creditAmount || 0);
            });
            debit = Math.round((debit + Number.EPSILON) * 100) / 100;
            credit = Math.round((credit + Number.EPSILON) * 100) / 100;
            const isBalanced = Math.abs(debit - credit) < 0.009 && debit > 0;
            return { debit, credit, isBalanced };
        },

        isBatchBalanced(batch) {
            return this.getProposedJournalTotals(batch).isBalanced;
        },

        _resolveAccountName(accountId) {
            if (!accountId) return '';
            const acc = (this.accountsList || []).find(a => String(a.id).toLowerCase() === String(accountId).toLowerCase());
            return acc ? (acc.accountIdentifier || acc.accountName || '') : '';
        },

        /* ── Pagination ──────────────────────────────────────────── */
        goToPage(page) {
            if (page < 1 || page > this.totalPages) return;
            this.currentPage = page;
        },

        /* ── Date Filter Helpers (matches Journal) ───────────────── */
        toggleDateFilter() {
            this.useDateFilter = !this.useDateFilter;
            this.onDateToggleChange();
        },

        onDateToggleChange() {
            if (this.useDateFilter) {
                if (!this.startDate || !this.endDate) {
                    this.setQuickDate('3months');
                } else {
                    if (!this.activeDatePreset || this.activeDatePreset === 'all') {
                        this.activeDatePreset = 'custom';
                    }
                    this.getPettyCashList();
                }
            } else {
                this.disableDateFilter();
            }
        },

        onDateInputChange() {
            if (this.startDate || this.endDate) {
                this.useDateFilter = true;
                this.activeDatePreset = 'custom';
                this.getPettyCashList();
            }
        },

        applyDateFilter() {
            if (!this.startDate && !this.endDate) {
                this.toast('info', 'Please select a start date or end date to filter.');
                return;
            }
            this.useDateFilter = true;
            this.activeDatePreset = 'custom';
            this.currentPage = 1;
            this.getPettyCashList();
        },

        disableDateFilter() {
            this.useDateFilter = false;
            this.activeDatePreset = 'all';
            this.startDate = '';
            this.endDate = '';
            this.currentPage = 1;
            this.getPettyCashList();
        },

        setQuickDate(preset) {
            if (preset === 'all') {
                this.disableDateFilter();
                return;
            }

            this.useDateFilter = true;
            this.activeDatePreset = preset;

            const today = new Date();
            const pad = n => String(n).padStart(2, '0');
            const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

            if (preset === 'today') {
                this.startDate = fmt(today);
                this.endDate = fmt(today);
            } else if (preset === 'month') {
                const start = new Date(today.getFullYear(), today.getMonth(), 1);
                this.startDate = fmt(start);
                this.endDate = fmt(today);
            } else if (preset === '3months') {
                const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                this.startDate = fmt(start);
                this.endDate = fmt(today);
            } else if (preset === 'year') {
                this.startDate = `${today.getFullYear()}-01-01`;
                this.endDate = fmt(today);
            }
            this.currentPage = 1;
            this.getPettyCashList();
        },

        resetFilters() {
            this.searchQuery = '';
            this.postingStatus = 'all';
            this.accountFilter = 'all';
            this.useDateFilter = false;
            this.startDate = '';
            this.endDate = '';
            this.activeDatePreset = 'all';
            this.currentPage = 1;
            this.getPettyCashList();
        },

        /* ── Data Fetch ──────────────────────────────────────────── */
        async getPettyCashList() {
            this.isShimmerLoading = true;
            try {
                const payload = {
                    pageNo: 1,
                    pageSize: 5000,
                    startDate: this.useDateFilter && this.startDate ? this.startDate : null,
                    endDate: this.useDateFilter && this.endDate ? this.endDate : null,
                    isPosted: this.postingStatus === 'posted'
                        ? true
                        : this.postingStatus === 'unposted'
                            ? false
                            : null,
                    search: this.searchQuery && this.searchQuery.trim() !== '' ? this.searchQuery.trim() : null
                };

                const resp = await axios.post('/GeneralLedger/GetPettyCashTransactions', payload);
                const raw = resp.data;
                let list = [];
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result?.data && Array.isArray(raw.result.data)) {
                    list = raw.result.data;
                } else if (raw?.data && Array.isArray(raw.data)) {
                    list = raw.data;
                }
                this.pettyCashList = list.map((item, idx) => {
                    const id = item.id || item.Id || item.batchNo || (`pc_${idx}`);
                    return {
                        ...item,
                        id: String(id)
                    };
                });
                this.selectedIds = [];
            } catch (err) {
                console.error('Error fetching petty cash transactions:', err);
                this.toast('error', 'Unable to load petty cash transactions.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async getAccounts() {
            try {
                const resp = await axios.get('/GeneralLedger/GetAccountDetails?pageNo=1&pageSize=5555&isActive=true');
                const raw = resp.data?.result || resp.data;
                const list = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
                this.accountsList = list.map(a => ({
                    id: a.id,
                    accountNo: a.accountNo || a.accountNumber || '',
                    accountName: a.accountName || a.name || '',
                    accountIdentifier: a.accountIdentifier || `${a.accountNo || a.accountNumber || ''} - ${a.accountName || a.name || ''}`,
                    accountHeadName: a.accountHeadName || a.category || ''
                })).sort((a, b) => String(a.accountNo ?? '').localeCompare(String(b.accountNo ?? '')));

                this.pettyCashAccounts = this.accountsList.filter(a =>
                    (a.accountName && a.accountName.toLowerCase().includes('petty cash')) ||
                    (a.accountName && a.accountName.toLowerCase().includes('cash')) ||
                    String(a.accountNo).startsWith('12') ||
                    String(a.accountNo).startsWith('10')
                );
            } catch (err) {
                console.warn('Accounts fetch failed:', err);
            }
        },

        /* ── Delete ──────────────────────────────────────────────── */
        async deletePettyCashBatch(id, batchNo) {
            if (!id) return;

            const res = await Swal.fire({
                title: 'Delete Petty Cash Batch?',
                html: `Are you sure you want to delete Batch <strong>#${batchNo || id}</strong>?<br><span class="text-xs text-slate-500">All associated expense line items will be removed.</span>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, delete',
                cancelButtonText: 'Cancel'
            });

            if (!res.isConfirmed) return;

            this.isShimmerLoading = true;
            try {
                await axios.delete(`/GeneralLedger/DeletePettyCash?id=${id}`);
                this.toast('success', 'Petty cash batch deleted successfully.');
                await this.getPettyCashList();
            } catch (err) {
                console.error('Error deleting petty cash batch:', err);
                this.toast('error', 'Unable to delete petty cash batch.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Toast ───────────────────────────────────────────────── */
        toast(type, message) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'success'),
                    title: message,
                    showConfirmButton: false,
                    timer: 3500,
                    timerProgressBar: true
                });
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }
    },

    async mounted() {
        this.isShimmerLoading = true;
        try {
            await Promise.allSettled([
                this.getAccounts(),
                this.getPettyCashList()
            ]);
        } catch (err) {
            console.error('Initialization error in Petty Cash directory:', err);
        } finally {
            this.isShimmerLoading = false;
        }
    }
});

app.mount('#app');
