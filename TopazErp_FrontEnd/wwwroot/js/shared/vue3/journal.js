const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            isShimmerLoading: false,
            isLoading: false,

            // Raw journal list from server
            journalList: [],

            // Filter state (legacy defaults: 3 months ago to today)
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            postingStatus: 'all',    // 'all' | 'unposted' | 'posted'
            currencyFilter: 'all',   // 'all' | 'local' | 'multi'
            searchQuery: '',

            // Selection state for batch operations
            selectedIds: [],

            // Detail modal state
            selectedJournal: null,
            showDetailModal: false,
            isDetailLoading: false,

            // Posting status options
            postingOptions: [
                { label: 'All Statuses', value: 'all' },
                { label: 'Draft / Unposted', value: 'unposted' },
                { label: 'Posted', value: 'posted' }
            ],

            // Currency filter options
            currencyOptions: [
                { label: 'All Currencies', value: 'all' },
                { label: 'Local Currency Only', value: 'local' },
                { label: 'Multi-Currency', value: 'multi' }
            ]
        };
    },

    computed: {
        /* ── Grid Columns Definition ───────────────────────────── */
        journalColumns() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'batchNumber',
                    label: 'Batch No#',
                    type: 'avatar',
                    width: 220,
                    minWidth: 180,
                    searchable: true,
                    subtitleKey: 'ouName'
                },
                {
                    key: 'batchDate',
                    label: 'Batch Date',
                    type: 'date',
                    width: 140,
                    searchable: true
                },
                {
                    key: 'ouName',
                    label: 'Operating Unit',
                    type: 'text',
                    width: 200,
                    searchable: true
                },
                {
                    key: 'totalDebit',
                    label: 'Total Debit',
                    type: 'number',
                    format: 'currency',
                    currency: 'GHS',
                    digits: 2,
                    width: 160
                },
                {
                    key: 'totalCredit',
                    label: 'Total Credit',
                    type: 'number',
                    format: 'currency',
                    currency: 'GHS',
                    digits: 2,
                    width: 160
                },
                {
                    key: 'isMultiCurrency',
                    label: 'Currency',
                    type: 'badge',
                    width: 150,
                    options: [
                        { value: true, label: 'Multi-Currency', color: 'indigo' },
                        { value: false, label: 'Local Only', color: 'slate' }
                    ]
                },
                {
                    key: 'isPosted',
                    label: 'Status',
                    type: 'badge',
                    width: 140,
                    options: [
                        { value: true, label: 'Posted', color: 'emerald' },
                        { value: false, label: 'Draft / Unposted', color: 'amber' }
                    ]
                },
                {
                    key: 'detailsCount',
                    label: 'Lines',
                    type: 'number',
                    digits: 0,
                    width: 90
                }
            ];
        },

        /* ── Master-Detail Child Grid Config ───────────────────── */
        childDetailConfig() {
            return {
                key: 'details',
                title: 'Journal Lines',
                columns: [
                    {
                        key: 'accountName',
                        label: 'GL Account',
                        type: 'text',
                        width: 240,
                        searchable: true
                    },
                    {
                        key: 'description',
                        label: 'Description / Narration',
                        type: 'text',
                        width: 260,
                        searchable: true
                    },
                    {
                        key: 'referenceNumber',
                        label: 'Ref No#',
                        type: 'text',
                        width: 130
                    },
                    {
                        key: 'chequeNo',
                        label: 'Cheque No#',
                        type: 'text',
                        width: 130
                    },
                    {
                        key: 'currencyCode',
                        label: 'Currency',
                        type: 'text',
                        width: 100
                    },
                    {
                        key: 'localDebit',
                        label: 'Local Debit',
                        type: 'number',
                        format: 'currency',
                        currency: 'GHS',
                        digits: 2,
                        width: 150
                    },
                    {
                        key: 'localCredit',
                        label: 'Local Credit',
                        type: 'number',
                        format: 'currency',
                        currency: 'GHS',
                        digits: 2,
                        width: 150
                    },
                    {
                        key: 'foreignDebit',
                        label: 'Foreign Debit',
                        type: 'number',
                        digits: 2,
                        width: 130
                    },
                    {
                        key: 'foreignCredit',
                        label: 'Foreign Credit',
                        type: 'number',
                        digits: 2,
                        width: 130
                    },
                    {
                        key: 'ouName',
                        label: 'Cost Center',
                        type: 'text',
                        width: 180
                    }
                ]
            };
        },

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
                    const ouMatch = (j.ouName || '').toLowerCase().includes(q);
                    const srcMatch = (j.transactionSource || '').toLowerCase().includes(q);
                    const detailMatch = (j.details || []).some(d =>
                        (d.accountName || '').toLowerCase().includes(q) ||
                        (d.description || '').toLowerCase().includes(q) ||
                        (d.referenceNumber || '').toLowerCase().includes(q)
                    );
                    return batchMatch || ouMatch || srcMatch || detailMatch;
                });
            }

            return list;
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

        // Aliases for compatibility
        costCenterCol() {
            return this.journalColumns;
        },
        costCenterList() {
            return this.journalList;
        },
        journalCol() {
            return this.journalColumns;
        }
    },

    methods: {
        /* ── Fetch Data ────────────────────────────────────────── */
        async getJournalTransactions() {
            this.isShimmerLoading = true;
            try {
                const params = new URLSearchParams();
                params.append('pageNo', '1');
                params.append('pageSize', '2000');

                if (this.startDate) params.append('startDate', this.startDate);
                if (this.endDate) params.append('endDate', this.endDate);

                if (this.postingStatus === 'posted') {
                    params.append('isPosted', 'true');
                } else if (this.postingStatus === 'unposted') {
                    params.append('isPosted', 'false');
                }

                if (this.currencyFilter === 'multi') {
                    params.append('isMultiCurrency', 'true');
                } else if (this.currencyFilter === 'local') {
                    params.append('isMultiCurrency', 'false');
                }

                // Call GeneralLedger controller action (with fallback handling)
                let response;
                try {
                    response = await axios.get(`/GeneralLedger/GetJournalTransactions?${params.toString()}`);
                } catch (e) {
                    // Fallback to legacy endpoint if applicable
                    response = await axios.get(`/LedgerDataEntry/GetJournalTransactions?${params.toString()}`);
                }

                const res = response?.data;
                const rawList = res?.result?.data || res?.result || res?.data || (Array.isArray(res) ? res : []);

                this.journalList = rawList.map(j => {
                    const rawDetails = j.details || j.Details || [];
                    const details = rawDetails.map(d => ({
                        journalId: d.journalId || d.JournalId || j.id,
                        accountId: d.accountId || d.AccountId || '',
                        accountName: d.accountName || d.AccountName || '',
                        ouId: d.ouId || d.OuId || '',
                        ouName: d.ouName || d.OuName || j.ouName || '',
                        referenceNumber: d.referenceNumber || d.ReferenceNumber || '',
                        chequeNo: d.chequeNo || d.ChequeNo || '',
                        description: d.description || d.Description || '',
                        localDebit: parseFloat(d.localDebit || d.LocalDebit || 0),
                        localCredit: parseFloat(d.localCredit || d.LocalCredit || 0),
                        foreignDebit: parseFloat(d.foreignDebit || d.ForeignDebit || 0),
                        foreignCredit: parseFloat(d.foreignCredit || d.ForeignCredit || 0),
                        currencyId: d.currencyId || d.CurrencyId || '',
                        currencyName: d.currencyName || d.CurrencyName || '',
                        currencyCode: d.currencyCode || d.CurrencyCode || 'GHS',
                        buyRate: parseFloat(d.buyRate || d.BuyRate || 1)
                    }));

                    const calculatedDebit = details.reduce((s, d) => s + d.localDebit, 0);
                    const calculatedCredit = details.reduce((s, d) => s + d.localCredit, 0);

                    return {
                        id: j.id || j.Id,
                        batchNumber: j.batchNumber || j.BatchNumber || '—',
                        batchDate: j.batchDate || j.BatchDate ? String(j.batchDate || j.BatchDate).split('T')[0] : '',
                        ouId: j.ouId || j.OuId || '',
                        ouName: j.ouName || j.OuName || '—',
                        totalDebit: parseFloat(j.totalDebit ?? j.TotalDebit ?? calculatedDebit),
                        totalCredit: parseFloat(j.totalCredit ?? j.TotalCredit ?? calculatedCredit),
                        isPosted: Boolean(j.isPosted ?? j.IsPosted),
                        isMultiCurrency: Boolean(j.isMultiCurrency ?? j.IsMultiCurrency),
                        transactionSource: j.transactionSource || j.TransactionSource || 'General Ledger',
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

            if (preset === 'month') {
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
            this.getJournalTransactions();
        },

        /* ── Selection Handling ────────────────────────────────── */
        onSelectionChange(selected) {
            if (Array.isArray(selected)) {
                this.selectedIds = selected.map(item => (typeof item === 'object' && item !== null ? item.id : item));
            }
        },

        clearSelection() {
            this.selectedIds = [];
        },

        /* ── Single Voucher Detail Modal ───────────────────────── */
        async viewVoucher(journal) {
            if (!journal) return;
            this.selectedJournal = { ...journal };
            this.showDetailModal = true;

            // If details are empty, fetch from server
            if (!this.selectedJournal.details || this.selectedJournal.details.length === 0) {
                this.isDetailLoading = true;
                try {
                    const response = await axios.get(`/GeneralLedger/GetJournalDetails?id=${journal.id}`);
                    const res = response?.data;
                    const details = res?.result?.details || res?.result || res?.data || [];
                    this.selectedJournal.details = details;
                } catch (e) {
                    console.warn('Could not fetch extra journal details:', e);
                } finally {
                    this.isDetailLoading = false;
                }
            }
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
                let response;
                try {
                    response = await axios.post(`/GeneralLedger/PostJournalBatch?id=${journal.id}`);
                } catch (e) {
                    response = await axios.post('/LedgerDataEntry/PostVouchers', { ids: [journal.id] });
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
                let response;
                try {
                    response = await axios.post('/GeneralLedger/PostJournalBatches', ids);
                } catch (e) {
                    response = await axios.post('/LedgerDataEntry/PostVouchers', { ids: ids });
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
                text: `Batch "${journal.batchNumber}" and all its lines will be permanently removed.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Delete Batch'
            });

            if (!confirm.isConfirmed) return;

            this.isLoading = true;
            try {
                let response;
                try {
                    response = await axios.post(`/GeneralLedger/DeleteJournalBatch?id=${journal.id}`);
                } catch (e) {
                    response = await axios.post('/LedgerDataEntry/DeleteVouchers', { ids: [journal.id] });
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

        async deleteSelectedBatches() {
            const batches = this.selectedJournals;
            const hasPosted = batches.some(j => j.isPosted);

            if (hasPosted) {
                const proceed = await Swal.fire({
                    title: 'Posted Batches Selected',
                    text: 'Some selected batches are already posted and cannot be deleted. Do you want to proceed and delete only the unposted draft batches?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc2626',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: 'Delete Drafts Only'
                });
                if (!proceed.isConfirmed) return;
            }

            const unpostedIds = batches.filter(j => !j.isPosted).map(j => j.id);

            if (unpostedIds.length === 0) {
                this.toastHandler('warning', 'No deletable unposted batches selected.');
                return;
            }

            const confirm = await Swal.fire({
                title: `Delete ${unpostedIds.length} Journal ${unpostedIds.length === 1 ? 'Batch' : 'Batches'}?`,
                text: 'This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Delete'
            });

            if (!confirm.isConfirmed) return;

            this.isLoading = true;
            try {
                let response;
                try {
                    response = await axios.post('/GeneralLedger/DeleteJournalBatches', unpostedIds);
                } catch (e) {
                    response = await axios.post('/LedgerDataEntry/DeleteVouchers', { ids: unpostedIds });
                }

                this.toastHandler('success', `${unpostedIds.length} journal batch(es) deleted successfully.`);
                this.selectedIds = [];
                this.getJournalTransactions();
            } catch (err) {
                console.error('Error deleting selected batches:', err);
                this.toastHandler('error', 'Unable to delete selected journal batches.');
            } finally {
                this.isLoading = false;
            }
        },

        /* ── DataGrid Event Handlers ───────────────────────────── */
        onCreate(event) {
            window.location.href = '/GeneralLedger/CreateJournal';
        },

        onUpdate(event) {
            const row = event?.row || event?.data;
            if (row) {
                this.viewVoucher(row);
            }
        },

        async onDelete(event) {
            const rows = event?.rows || (event?.row ? [event.row] : []);
            if (!rows || rows.length === 0) return;

            const unpostedRows = rows.filter(r => !r.isPosted);
            if (unpostedRows.length === 0) {
                this.toastHandler('warning', 'Posted journal batches cannot be deleted.');
                return;
            }

            const ids = unpostedRows.map(r => r.id);
            try {
                await axios.post('/GeneralLedger/DeleteJournalBatches', ids);
                this.toastHandler('success', 'Journal batch(es) deleted successfully.');
                this.getJournalTransactions();
            } catch (e) {
                this.toastHandler('error', 'Unable to delete journal batch(es).');
            }
        },

        /* ── Utility Methods ───────────────────────────────────── */
        fmtCurrency(v, cur = 'GHS') {
            if (v === null || v === undefined || isNaN(v)) return '0.00';
            return new Intl.NumberFormat('en-GH', {
                style: 'currency',
                currency: cur,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(Number(v));
        },

        printVoucher() {
            window.print();
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

// Register DataGrid plugin if loaded globally
if (typeof DataGridPlugin !== 'undefined') {
    app.use(DataGridPlugin);
} else if (typeof DataGrid !== 'undefined') {
    app.component('data-grid', DataGrid);
}

app.mount('#app');
