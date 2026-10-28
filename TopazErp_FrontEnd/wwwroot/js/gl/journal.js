const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            isShimmerLoading: false,
            isLoading: false,

            // Raw journal list from server (headers + matched details)
            journalList: [],

            // Filter state
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            postingStatus: 'all',    // 'all' | 'unposted' | 'posted'
            currencyFilter: 'all',   // 'all' | 'local' | 'multi'
            searchQuery: '',

            // Collapsible state (list of expanded header IDs)
            expandedIds: [],

            // Selection state for batch operations
            selectedIds: [],

            // Pagination
            currentPage: 1,
            pageSize: 15,
            pageSizeOptions: [10, 15, 25, 50, 100],

            // Detail modal (optional pop-out)
            selectedJournal: null,
            showDetailModal: false
        };
    },

    computed: {
        /* ── Client-side Filtered Journals ─────────────────────── */
        filteredJournalList() {
            let list = this.journalList || [];

            // Posting status filter
            if (this.postingStatus === 'posted') {
                list = list.filter(j => j.isPosted === true);
            } else if (this.postingStatus === 'unposted') {
                list = list.filter(j => j.isPosted === false);
            }

            // Currency filter
            if (this.currencyFilter === 'local') {
                list = list.filter(j => j.isMultiCurrency === false);
            } else if (this.currencyFilter === 'multi') {
                list = list.filter(j => j.isMultiCurrency === true);
            }

            // Search query filter
            if (this.searchQuery && this.searchQuery.trim() !== '') {
                const q = this.searchQuery.toLowerCase().trim();
                list = list.filter(j => {
                    const batchMatch = (j.batchNumber || '').toLowerCase().includes(q);
                    const descMatch = (j.batchDescription || '').toLowerCase().includes(q);
                    const srcMatch = (j.transactionSource || '').toLowerCase().includes(q);
                    const detailMatch = (j.details || []).some(d =>
                        (d.accountName || '').toLowerCase().includes(q) ||
                        (d.description || '').toLowerCase().includes(q) ||
                        (d.ouName || '').toLowerCase().includes(q) ||
                        (d.referenceNumber || '').toLowerCase().includes(q) ||
                        (d.chequeNo || '').toLowerCase().includes(q) ||
                        (d.currencyCode || '').toLowerCase().includes(q)
                    );
                    return batchMatch || descMatch || srcMatch || detailMatch;
                });
            }

            return list;
        },

        /* ── Paginated Journals ────────────────────────────────── */
        paginatedJournals() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredJournalList.slice(start, start + this.pageSize);
        },

        totalPages() {
            return Math.ceil(this.filteredJournalList.length / this.pageSize) || 1;
        },

        startIndex() {
            return this.filteredJournalList.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
        },

        endIndex() {
            return Math.min(this.currentPage * this.pageSize, this.filteredJournalList.length);
        },

        /* ── KPI & Summary Metrics ─────────────────────────────── */
        totalBatches() {
            return this.filteredJournalList.length;
        },

        totalDebits() {
            return this.filteredJournalList.reduce((sum, j) => sum + (parseFloat(j.totalDebit) || 0), 0);
        },

        totalCredits() {
            return this.filteredJournalList.reduce((sum, j) => sum + (parseFloat(j.totalCredit) || 0), 0);
        },

        postedCount() {
            return this.filteredJournalList.filter(j => j.isPosted).length;
        },

        unpostedCount() {
            return this.filteredJournalList.filter(j => !j.isPosted).length;
        },

        selectedJournals() {
            const idSet = new Set(this.selectedIds.map(String));
            return this.journalList.filter(j => idSet.has(String(j.id)));
        },

        selectedUnpostedCount() {
            return this.selectedJournals.filter(j => !j.isPosted).length;
        },

        isAllExpanded() {
            if (this.paginatedJournals.length === 0) return false;
            return this.paginatedJournals.every(j => this.isExpanded(j.id));
        },

        isAllSelected() {
            if (this.paginatedJournals.length === 0) return false;
            return this.paginatedJournals.every(j => this.selectedIds.includes(j.id));
        }
    },

    watch: {
        searchQuery() {
            this.currentPage = 1;
        },
        postingStatus() {
            this.currentPage = 1;
        },
        currencyFilter() {
            this.currentPage = 1;
        },
        pageSize() {
            this.currentPage = 1;
        }
    },

    methods: {
        /* ── Collapsible Accordion Logic ───────────────────────── */
        toggleExpand(id) {
            const idx = this.expandedIds.indexOf(id);
            if (idx > -1) {
                this.expandedIds.splice(idx, 1);
            } else {
                this.expandedIds.push(id);
            }
        },

        isExpanded(id) {
            return this.expandedIds.includes(id);
        },

        expandAll() {
            const currentIds = this.paginatedJournals.map(j => j.id);
            this.expandedIds = Array.from(new Set([...this.expandedIds, ...currentIds]));
        },

        collapseAll() {
            const currentIds = new Set(this.paginatedJournals.map(j => j.id));
            this.expandedIds = this.expandedIds.filter(id => !currentIds.has(id));
        },

        toggleAllExpansion() {
            if (this.isAllExpanded) {
                this.collapseAll();
            } else {
                this.expandAll();
            }
        },

        /* ── Fetch Data ────────────────────────────────────────── */
        async getJournalTransactions() {
            this.isShimmerLoading = true;
            try {
                const payload = {
                    pageNo: 1,
                    pageSize: 5000,
                    startDate: this.startDate || null,
                    endDate: this.endDate || null,
                    isPosted: this.postingStatus === 'posted'
                        ? true
                        : this.postingStatus === 'unposted'
                            ? false
                            : null,
                    isMultiCurrency: this.currencyFilter === 'multi'
                        ? true
                        : this.currencyFilter === 'local'
                            ? false
                            : null
                };

                const response = await axios.post('/GeneralLedger/GetJournalTransactions', payload);

                const res = response?.data;
                const result = res?.result || res?.Result || {};

                // New shape: result.items[] where each item = { journalHeader, journalDetails[] }
                const items = result?.items || result?.Items || [];

                this.journalList = items.map(item => {
                    const h = item.journalHeader || item.JournalHeader || {};
                    const rawDetails = item.journalDetails || item.JournalDetails || [];

                    const details = rawDetails.map(d => ({
                        id: d.id || d.Id,
                        journalId: d.journalId || d.JournalId || h.id || h.Id,
                        accountId: d.accountId || d.AccountId || '',
                        accountName: d.accountName || d.AccountName || '—',
                        ouId: d.ouId || d.OuId || '',
                        ouName: d.ouName || d.OuName || '—',
                        referenceNumber: d.referenceNumber || d.ReferenceNumber || '',
                        chequeNo: d.chequeNo || d.ChequeNo || '',
                        description: d.description || d.Description || '',
                        debitAmount: parseFloat(d.debitAmount ?? d.DebitAmount ?? 0),
                        creditAmount: parseFloat(d.creditAmount ?? d.CreditAmount ?? 0),
                        transactionDate: d.transactionDate || d.TransactionDate || d.batchDate || d.BatchDate,
                        transactionSource: d.transactionSource || d.TransactionSource || h.transactionSource || 'GL',
                        isMultiCurrency: Boolean(d.isMultiCurrency ?? d.IsMultiCurrency),
                        currencyId: d.currencyId || d.CurrencyId || '',
                        currencyName: d.currencyName || d.CurrencyName || '',
                        currencyCode: d.currencyCode || d.CurrencyCode || 'GHS',
                        buyRate: parseFloat(d.buyRate ?? d.BuyRate ?? 1),
                        sellRate: parseFloat(d.sellRate ?? d.SellRate ?? 1),
                        isPosted: Boolean(d.isPosted ?? d.IsPosted),
                        isReconciled: Boolean(d.isReconciled ?? d.IsReconciled),
                        standardAccountType: d.standardAccountType ?? d.StandardAccountType ?? 0,
                        batchNumber: d.batchNumber || d.BatchNumber || h.batchNumber || h.BatchNumber || '—',
                        pettyCashRecipientName: d.pettyCashReceipientName || d.PettyCashReceipientName || null
                    }));

                    const sumDebits = details.reduce((acc, d) => acc + d.debitAmount, 0);
                    const sumCredits = details.reduce((acc, d) => acc + d.creditAmount, 0);
                    const hasMultiCurrency = details.some(d => d.isMultiCurrency || (d.currencyCode && d.currencyCode !== 'GHS'));

                    return {
                        id: h.id || h.Id,
                        batchNumber: h.batchNumber || h.BatchNumber || '—',
                        batchDate: h.batchDate || h.BatchDate || '',
                        batchDescription: h.batchDescription || h.BatchDescription || '',
                        transactionSource: h.transactionSource || h.TransactionSource || 'GL',
                        totalDebit: parseFloat(h.totalDebit ?? h.TotalDebit ?? sumDebits),
                        totalCredit: parseFloat(h.totalCredit ?? h.TotalCredit ?? sumCredits),
                        isPosted: Boolean(h.isPosted ?? h.IsPosted),
                        isTemporary: Boolean(h.isTemporary ?? h.IsTemporary),
                        isMultiCurrency: hasMultiCurrency,
                        tenantId: h.tenantId ?? h.TenantId,
                        creationTime: h.creationTime || h.CreationTime,
                        detailsCount: details.length,
                        details: details
                    };
                });

                // Clear selection on new fetch
                this.selectedIds = [];
            } catch (err) {
                console.error('Failed to retrieve journal transactions:', err);
                this.toastHandler('error', 'Unable to retrieve journal transactions.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        /* ── Date Preset Helpers ───────────────────────────────── */
        setQuickDate(preset) {
            const today = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

            if (preset === 'today') {
                this.startDate = fmt(today);
                this.endDate = fmt(today);
            } else if (preset === 'month') {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                this.startDate = fmt(firstDay);
                this.endDate = fmt(today);
            } else if (preset === '3months') {
                const d = new Date();
                d.setMonth(d.getMonth() - 3);
                this.startDate = fmt(d);
                this.endDate = fmt(today);
            } else if (preset === 'year') {
                const firstDay = new Date(today.getFullYear(), 0, 1);
                this.startDate = fmt(firstDay);
                this.endDate = fmt(today);
            } else if (preset === 'all') {
                const d = new Date();
                d.setFullYear(d.getFullYear() - 3);
                this.startDate = fmt(d);
                this.endDate = fmt(today);
            }

            this.getJournalTransactions();
        },

        /* ── Reset Filters ─────────────────────────────────────── */
        resetFilters() {
            const d = new Date();
            d.setMonth(d.getMonth() - 3);
            this.startDate = d.toISOString().split('T')[0];
            this.endDate = new Date().toISOString().split('T')[0];
            this.postingStatus = 'all';
            this.currencyFilter = 'all';
            this.searchQuery = '';
            this.currentPage = 1;
            this.getJournalTransactions();
        },

        /* ── Selection Handling ────────────────────────────────── */
        toggleSelectAll() {
            if (this.isAllSelected) {
                const currentIds = new Set(this.paginatedJournals.map(j => j.id));
                this.selectedIds = this.selectedIds.filter(id => !currentIds.has(id));
            } else {
                const currentIds = this.paginatedJournals.map(j => j.id);
                this.selectedIds = Array.from(new Set([...this.selectedIds, ...currentIds]));
            }
        },

        toggleSelectJournal(id) {
            const idx = this.selectedIds.indexOf(id);
            if (idx > -1) {
                this.selectedIds.splice(idx, 1);
            } else {
                this.selectedIds.push(id);
            }
        },

        clearSelection() {
            this.selectedIds = [];
        },

        /* ── Single Voucher Detail Modal ───────────────────────── */
        viewVoucher(journal) {
            if (!journal) return;
            this.selectedJournal = journal;
            this.showDetailModal = true;
        },

        closeDetailModal() {
            this.showDetailModal = false;
            this.selectedJournal = null;
        },

        /* ── Post Actions ──────────────────────────────────────── */
        async postSingleJournal(journal) {
            if (!journal) return;
            if (journal.isPosted) {
                this.toastHandler('info', 'This journal batch is already posted.');
                return;
            }

            const confirm = await Swal.fire({
                title: 'Post Journal Batch?',
                text: `Are you sure you want to post batch "${journal.batchNumber}"? Posted journals affect the general ledger permanently.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#059669',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Post Journal'
            });

            if (!confirm.isConfirmed) return;

            this.isLoading = true;
            try {
                try {
                    await axios.post(`/GeneralLedger/PostJournalBatch?id=${journal.id}`);
                } catch (e) {
                    await axios.post('/LedgerDataEntry/PostVouchers', { ids: [journal.id] });
                }

                this.toastHandler('success', `Batch "${journal.batchNumber}" posted successfully.`);
                journal.isPosted = true;
                if (this.selectedJournal && this.selectedJournal.id === journal.id) {
                    this.selectedJournal.isPosted = true;
                }
                this.getJournalTransactions();
            } catch (err) {
                console.error('Error posting journal:', err);
                this.toastHandler('error', 'Unable to post journal batch.');
            } finally {
                this.isLoading = false;
            }
        },

        async postSelectedBatches() {
            const unposted = this.selectedJournals.filter(j => !j.isPosted);
            const ids = unposted.map(j => j.id);

            if (ids.length === 0) {
                this.toastHandler('warning', 'Please select at least one unposted journal batch to post.');
                return;
            }

            const confirm = await Swal.fire({
                title: `Post ${ids.length} Journal ${ids.length === 1 ? 'Batch' : 'Batches'}?`,
                text: 'All selected batches will be permanently posted to the general ledger.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#059669',
                cancelButtonColor: '#64748b',
                confirmButtonText: `Yes, Post ${ids.length} ${ids.length === 1 ? 'Batch' : 'Batches'}`
            });

            if (!confirm.isConfirmed) return;

            this.isLoading = true;
            try {
                try {
                    await axios.post('/GeneralLedger/PostJournalBatches', ids);
                } catch (e) {
                    await axios.post('/LedgerDataEntry/PostVouchers', { ids: ids });
                }

                this.toastHandler('success', `${ids.length} journal batch(es) posted successfully.`);
                this.selectedIds = [];
                this.getJournalTransactions();
            } catch (err) {
                console.error('Error posting selected journals:', err);
                this.toastHandler('error', 'Unable to post selected journal batches.');
            } finally {
                this.isLoading = false;
            }
        },

        /* ── Delete Actions ────────────────────────────────────── */
        async deleteSingleJournal(journal) {
            if (!journal) return;
            if (journal.isPosted) {
                this.toastHandler('warning', 'Posted journal batches cannot be deleted.');
                return;
            }

            const confirm = await Swal.fire({
                title: 'Delete Journal Batch?',
                text: `Batch "${journal.batchNumber}" and all its ${journal.detailsCount || 0} lines will be permanently removed.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Delete Batch'
            });

            if (!confirm.isConfirmed) return;

            this.isLoading = true;
            try {
                try {
                    await axios.post(`/GeneralLedger/DeleteJournalBatch?id=${journal.id}`);
                } catch (e) {
                    await axios.post('/LedgerDataEntry/DeleteVouchers', { ids: [journal.id] });
                }

                this.toastHandler('success', 'Journal batch deleted successfully.');
                if (this.showDetailModal && this.selectedJournal?.id === journal.id) {
                    this.closeDetailModal();
                }
                this.getJournalTransactions();
            } catch (err) {
                console.error('Error deleting journal:', err);
                this.toastHandler('error', 'Unable to delete journal batch.');
            } finally {
                this.isLoading = false;
            }
        },

        /* ── Pagination Helpers ────────────────────────────────── */
        goToPage(p) {
            if (p < 1 || p > this.totalPages) return;
            this.currentPage = p;
        },

        /* ── Formatting Helpers ────────────────────────────────── */
        fmtDate(d) {
            if (!d) return '—';
            try {
                const date = new Date(d);
                if (isNaN(date.getTime())) return String(d).split('T')[0];
                return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            } catch {
                return String(d).split('T')[0];
            }
        },

        fmtCurrency(v, cur = 'GHS') {
            if (v === null || v === undefined || isNaN(v)) return '0.00';
            return Number(v).toLocaleString('en-GH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        isBatchBalanced(header) {
            return Math.abs((header.totalDebit || 0) - (header.totalCredit || 0)) <= 0.01;
        },

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
                timerProgressBar: true
            });
        }
    },

    created() {
        this.getJournalTransactions();
    }
});

app.mount('#app');
