const app = Vue.createApp({
    data() {
        return {
            /* ── UI State ─────────────────────────────────────────── */
            isShimmerLoading: false,
            isLoading: false,
            isLoadingDetails: false,
            isMultiCurrency: false,

            /* ── Edit Mode State ───────────────────────────────────── */
            journalId: '',
            isEditMode: false,
            isPosted: false,
            row2Customized: {
                referenceNumber: false,
                ouId: false,
                description: false,
                transactionDate: false
            },

            /* ── Header fields ────────────────────────────────────── */
            batchNumber: '',
            batchDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD for <input type="date">
            batchDescription: '',
            ouId: '',
            enforceOu: false,
            errors: {},

            /* ── Reference data ───────────────────────────────────── */
            accountsList: [],
            costCenterList: [],
            costCenterNameList: [],
            costCenterHierarchyList: [],
            currencyRateList: [],

            /* ── Journal lines ────────────────────────────────────── */
            journalEntryList: [
                {
                    referenceNumber: '',
                    accountId: '',
                    ouId: '',
                    currencyId: '',
                    buyRate: null,
                    sellRate: null,
                    description: '',
                    localDebit: 0,
                    localCredit: 0,
                    foreignDebit: 0,
                    foreignCredit: 0,
                    transactionDate: new Date().toISOString().slice(0, 10),
                    chequeNo: ''
                },
                {
                    referenceNumber: '',
                    accountId: '',
                    ouId: '',
                    currencyId: '',
                    buyRate: null,
                    sellRate: null,
                    description: '',
                    localDebit: 0,
                    localCredit: 0,
                    foreignDebit: 0,
                    foreignCredit: 0,
                    transactionDate: new Date().toISOString().slice(0, 10),
                    chequeNo: ''
                }
            ]
        };
    },

    computed: {
        /* Local debit = sum of localDebit across all lines */
        totalDebit() {
            return this.journalEntryList.reduce(
                (s, l) => s + (parseFloat(l.localDebit) || 0), 0
            );
        },
        totalCredit() {
            return this.journalEntryList.reduce(
                (s, l) => s + (parseFloat(l.localCredit) || 0), 0
            );
        },
        totalForeignDebit() {
            return this.journalEntryList.reduce(
                (s, l) => s + (parseFloat(l.foreignDebit) || 0), 0
            );
        },
        totalForeignCredit() {
            return this.journalEntryList.reduce(
                (s, l) => s + (parseFloat(l.foreignCredit) || 0), 0
            );
        },
        isBalanced() {
            return this.journalEntryList.length > 0 &&
                Math.abs(this.totalDebit - this.totalCredit) <= 0.01;
        }
    },

    watch: {
        /* When header batch date changes, cascade to lines sharing the old date */
        batchDate(newVal, oldVal) {
            if (this.isLoadingDetails || !newVal) return;
            if (oldVal && oldVal !== newVal) {
                this.journalEntryList.forEach(line => {
                    if (!line.transactionDate || line.transactionDate === oldVal) {
                        line.transactionDate = newVal;
                    }
                });
            }
        },

        /* When header OU changes, cascade to every line that has no OU set */
        ouId(newVal, oldVal) {
            if (this.isLoadingDetails) return;
            if (oldVal !== undefined && oldVal !== null && oldVal !== newVal) {
                this.journalEntryList = this.journalEntryList.map(line => ({
                    ...line,
                    ouId: line.ouId || newVal
                }));
            }
        },

        /* When multi-currency checkbox is toggled off, reset foreign amounts */
        isMultiCurrency(newVal) {
            if (!newVal) {
                this.journalEntryList = this.journalEntryList.map(l => ({
                    ...l,
                    foreignDebit: 0,
                    foreignCredit: 0
                }));
            }
        },

        /* MC mode: auto-compute localDebit / localCredit from foreign × buyRate */
        journalEntryList: {
            deep: true,
            handler(lines) {
                if (!this.isMultiCurrency) return;
                if (this.isLoadingDetails) return;

                lines.forEach((line, idx) => {
                    const buyRate = parseFloat(line.buyRate);
                    if (!buyRate || buyRate <= 0) return;

                    const currency = this.currencyRateList.find(c =>
                        c.id === line.currencyId || (line.currencyId && String(c.id).toLowerCase() === String(line.currencyId).toLowerCase())
                    );
                    if (!currency || currency.isDefault) return; // local currency — no conversion

                    // Foreign → Local Credit
                    const fc = parseFloat(line.foreignCredit);
                    if (!isNaN(fc) && fc >= 0) {
                        const computed = parseFloat((fc * buyRate).toFixed(4));
                        if (parseFloat(line.localCredit) !== computed) {
                            this.journalEntryList[idx].localCredit = computed;
                        }
                    }

                    // Foreign → Local Debit
                    const fd = parseFloat(line.foreignDebit);
                    if (!isNaN(fd) && fd >= 0) {
                        const computed = parseFloat((fd * buyRate).toFixed(4));
                        if (parseFloat(line.localDebit) !== computed) {
                            this.journalEntryList[idx].localDebit = computed;
                        }
                    }
                });
            }
        }
    },

    methods: {

        /* ══════════════════════════════════════════════════════════
           Data Initialisation
        ══════════════════════════════════════════════════════════ */

        async getData() {
            this.isShimmerLoading = true;
            try {
                // Fetch journal init data, currencies, and chart of accounts details in parallel
                const [journalRes, currRes, accountsRes] = await Promise.all([
                    axios.get('/GeneralLedger/InitJournalEntry'),
                    axios.get('/SharedResource/GetCurrencies'),
                    axios.get('/GeneralLedger/GetAccountDetails?pageNo=1&pageSize=5000&isActive=true')
                ]);

                const d = journalRes.data;

                // Chart of Account Details for GL accounts
                const rawAccounts = accountsRes.data?.result?.data
                    || accountsRes.data?.result
                    || accountsRes.data?.data
                    || (Array.isArray(accountsRes.data) ? accountsRes.data : [])
                    || d?.accounts?.result
                    || [];

                rawAccounts.forEach(v => {
                    v.accountIdentifier = `${v.accountNo} - ${v.accountName}`;
                });
                this.accountsList = rawAccounts;

                // Cost centers
                this.costCenterHierarchyList = this.parseCostCenterHierarchy(d?.costCenters?.result || d?.costCenters?.data || d?.costCenters || []);

                // Enforce OU
                this.enforceOu = !!d?.enforceOu;

                // Currencies
                this.currencyRateList = currRes.data?.result?.data || currRes.data?.result || currRes.data?.data || (Array.isArray(currRes.data) ? currRes.data : []);

                // Seed two default lines only if NOT in edit mode
                if (!this.isEditMode) {
                    this.row2Customized = { referenceNumber: false, ouId: false, description: false, transactionDate: false };
                    this.journalEntryList = [];
                    this.addLine();
                    this.addLine();
                }

            } catch (err) {
                console.error('Failed to initialise journal:', err);
                this.toastHandler('error', 'Unable to initialise journal.');
                if (!this.isEditMode && this.journalEntryList.length < 2) {
                    this.journalEntryList = [];
                    this.addLine();
                    this.addLine();
                }
            } finally {
                // In edit mode, loadJournalDetails will manage isShimmerLoading next — don't flicker
                if (!this.isEditMode) {
                    this.isShimmerLoading = false;
                }
            }
        },

        /* ══════════════════════════════════════════════════════════
           Load Journal Details (Edit Mode)
        ══════════════════════════════════════════════════════════ */

        async loadJournalDetails(id) {
            this.isLoadingDetails = true;
            this.isShimmerLoading = true;
            const emptyGuid = '00000000-0000-0000-0000-000000000000';

            try {
                const response = await axios.get('/GeneralLedger/GetJournalDetails?id=' + encodeURIComponent(id));
                const resData = response.data?.result;
                if (!resData) {
                    this.toastHandler('error', 'Journal details could not be found.');
                    return;
                }

                const header = resData.journalHeader || resData.JournalHeader || resData.header || resData.Header || resData;
                const details = resData.journalDetails || resData.JournalDetails || resData.details || resData.Details || [];

                // ── 1. Header fields ──────────────────────────────────────
                this.journalId = header.id || header.Id || id;
                this.batchNumber = header.batchNumber || header.BatchNumber || '';
                this.batchDescription = header.batchDescription || header.BatchDescription || '';

                const rawDate = header.batchDate || header.BatchDate || header.creationTime || header.CreationTime;
                if (rawDate) {
                    if (typeof moment !== 'undefined') {
                        this.batchDate = moment(rawDate).format('YYYY-MM-DD');
                    } else {
                        this.batchDate = new Date(rawDate).toISOString().slice(0, 10);
                    }
                }

                this.isMultiCurrency = Boolean(header.isMulticurrency ?? header.IsMulticurrency ?? header.isMultiCurrency ?? header.IsMultiCurrency);
                this.isPosted = Boolean(header.isPosted ?? header.IsPosted);

                // ── 2. Line Details ───────────────────────────────────────
                if (Array.isArray(details) && details.length > 0) {
                    this.journalEntryList = details.map(d => {
                        const targetAccId = String(d.accountId || d.AccountId || '').toLowerCase();
                        let matchedAcc = this.accountsList.find(a => String(a.id).toLowerCase() === targetAccId);

                        // If account is not in accountsList (e.g. inactive), inject it
                        if (targetAccId && !matchedAcc && (d.accountName || d.AccountName)) {
                            matchedAcc = {
                                id: d.accountId || d.AccountId,
                                accountNo: '',
                                accountName: d.accountName || d.AccountName,
                                accountIdentifier: d.accountName || d.AccountName,
                                currencyId: d.currencyId || d.CurrencyId || ''
                            };
                            this.accountsList.unshift(matchedAcc);
                        }

                        const targetOuId = String(d.ouId || d.OuId || '').toLowerCase();
                        const matchedOu = this.costCenterHierarchyList.find(ou => String(ou.id).toLowerCase() === targetOuId);

                        const targetCurrId = String(d.currencyId || d.CurrencyId || matchedAcc?.currencyId || '').toLowerCase();
                        const matchedCurr = this.currencyRateList.find(c => String(c.id).toLowerCase() === targetCurrId);

                        const buyRate = d.buyRate ?? d.BuyRate ?? (matchedCurr ? (matchedCurr.buyRate || matchedCurr.rates?.[0]?.buyingRate || (matchedCurr.isDefault ? 1 : null)) : null);
                        const sellRate = d.sellRate ?? d.SellRate ?? (matchedCurr ? (matchedCurr.sellRate || matchedCurr.rates?.[0]?.sellingRate || (matchedCurr.isDefault ? 1 : null)) : null);

                        const debitAmt = parseFloat(d.debitAmount ?? d.DebitAmount ?? d.localDebit ?? 0) || 0;
                        const creditAmt = parseFloat(d.creditAmount ?? d.CreditAmount ?? d.localCredit ?? 0) || 0;
                        const rawBuyRate = buyRate != null ? parseFloat(buyRate) : 1;

                        let fgnDebit = 0;
                        let fgnCredit = 0;

                        if (d.foreignDebit != null || d.ForeignDebit != null) {
                            fgnDebit = parseFloat(d.foreignDebit ?? d.ForeignDebit ?? 0) || 0;
                        } else if (matchedCurr && !matchedCurr.isDefault && rawBuyRate > 0 && debitAmt > 0) {
                            fgnDebit = parseFloat((debitAmt / rawBuyRate).toFixed(4));
                        }

                        if (d.foreignCredit != null || d.ForeignCredit != null) {
                            fgnCredit = parseFloat(d.foreignCredit ?? d.ForeignCredit ?? 0) || 0;
                        } else if (matchedCurr && !matchedCurr.isDefault && rawBuyRate > 0 && creditAmt > 0) {
                            fgnCredit = parseFloat((creditAmt / rawBuyRate).toFixed(4));
                        }

                        let txDate = this.batchDate || new Date().toISOString().slice(0, 10);
                        const rawTxDate = d.transactionDate || d.TransactionDate;
                        if (rawTxDate) {
                            if (typeof moment !== 'undefined') {
                                txDate = moment(rawTxDate).format('YYYY-MM-DD');
                            } else {
                                txDate = new Date(rawTxDate).toISOString().slice(0, 10);
                            }
                        }

                        return {
                            id: d.id || d.Id || this.uuid(),
                            referenceNumber: d.referenceNumber || d.ReferenceNumber || '',
                            accountId: matchedAcc ? matchedAcc.id : (d.accountId || d.AccountId || ''),
                            accountName: d.accountName || d.AccountName || (matchedAcc ? `${matchedAcc.accountNo} - ${matchedAcc.accountName}` : ''),
                            ouId: matchedOu ? matchedOu.id : (targetOuId && targetOuId !== emptyGuid ? (d.ouId || d.OuId) : ''),
                            ouName: d.ouName || d.OuName || (matchedOu ? matchedOu.name : ''),
                            currencyId: matchedCurr ? matchedCurr.id : (targetCurrId && targetCurrId !== emptyGuid ? (d.currencyId || d.CurrencyId) : ''),
                            currencyName: d.currencyName || d.CurrencyName || matchedCurr?.currencyName || '',
                            currencyCode: d.currencyCode || d.CurrencyCode || matchedCurr?.currencyCode || '',
                            buyRate: buyRate != null ? parseFloat(buyRate) : null,
                            sellRate: sellRate != null ? parseFloat(sellRate) : null,
                            description: d.description || d.Description || '',
                            localDebit: debitAmt,
                            localCredit: creditAmt,
                            foreignDebit: fgnDebit,
                            foreignCredit: fgnCredit,
                            transactionDate: txDate,
                            TransactionDate: txDate,
                            chequeNo: d.chequeNo || d.ChequeNo || ''
                        };
                    });

                    // Set header OU if all lines share the same OU
                    const firstOu = this.journalEntryList[0]?.ouId;
                    if (firstOu && this.journalEntryList.every(l => l.ouId === firstOu)) {
                        this.ouId = firstOu;
                    }
                } else {
                    this.journalEntryList = [];
                    this.addLine();
                    this.addLine();
                }

                // If any line uses a multi-currency, ensure isMultiCurrency is true
                if (!this.isMultiCurrency && this.journalEntryList.some(l => {
                    const c = this.currencyRateList.find(x => String(x.id).toLowerCase() === String(l.currencyId).toLowerCase());
                    return c && !c.isDefault;
                })) {
                    this.isMultiCurrency = true;
                }

                // In edit mode, lines are loaded from server — mark row 2 as independently populated
                this.row2Customized = { referenceNumber: true, ouId: true, description: true, transactionDate: true };

            } catch (err) {
                console.error('Failed to load journal details:', err);
                this.toastHandler('error', 'Unable to load journal details.');
            } finally {
                this.isLoadingDetails = false;
                this.isShimmerLoading = false;
            }
        },

        /* ══════════════════════════════════════════════════════════
           Mode Toggle
        ══════════════════════════════════════════════════════════ */

        toggleMode() {
            this.isMultiCurrency = !this.isMultiCurrency;

            // When switching to local mode, zero out foreign amounts
            if (!this.isMultiCurrency) {
                this.journalEntryList = this.journalEntryList.map(l => ({
                    ...l,
                    foreignDebit: 0,
                    foreignCredit: 0
                }));
            }
        },

        /* ══════════════════════════════════════════════════════════
           Line Management
        ══════════════════════════════════════════════════════════ */

        onLineFieldInput(index, field) {
            if (this.isLoadingDetails) return;

            // If the user manually edits row 2 (index 1), track that this field was customized
            if (index === 1) {
                const row2Val = this.journalEntryList[1]?.[field];
                const row1Val = this.journalEntryList[0]?.[field];
                // If cleared or equal to row 1, allow future sync from row 1
                this.row2Customized[field] = (row2Val !== '' && row2Val !== null && row2Val !== undefined && row2Val !== row1Val);
                return;
            }

            // When user enters data on the first row (index 0), repeat on the second row reactively
            if (index === 0 && this.journalEntryList.length >= 2) {
                if (!this.row2Customized[field]) {
                    this.journalEntryList[1][field] = this.journalEntryList[0][field];
                }
            }
        },

        /** Returns a blank journal line, picking the last data entered for Ref No,
         *  OU, description, and transaction date across existing rows,
         *  and auto-suggesting the balancing amount to keep debits === credits. */
        buildNewLine() {
            const emptyGuid = '00000000-0000-0000-0000-000000000000';
            let lastRefNo = '';
            let lastOu = '';
            let lastDesc = '';
            let lastTxDate = '';
            let lastChequeNo = '';

            // Search backwards across all existing lines for the last entered data
            if (this.journalEntryList && this.journalEntryList.length > 0) {
                for (let i = this.journalEntryList.length - 1; i >= 0; i--) {
                    const r = this.journalEntryList[i];
                    if (!r) continue;

                    if (!lastRefNo && r.referenceNumber && String(r.referenceNumber).trim()) {
                        lastRefNo = String(r.referenceNumber).trim();
                    }
                    if (!lastOu && r.ouId && r.ouId !== emptyGuid) {
                        lastOu = r.ouId;
                    }
                    if (!lastDesc && r.description && String(r.description).trim()) {
                        lastDesc = String(r.description).trim();
                    }
                    if (!lastTxDate && r.transactionDate && String(r.transactionDate).trim()) {
                        lastTxDate = String(r.transactionDate).trim();
                    }
                    if (!lastChequeNo && r.chequeNo && String(r.chequeNo).trim()) {
                        lastChequeNo = String(r.chequeNo).trim();
                    }
                }
            }

            const net = +(this.totalDebit - this.totalCredit);

            const line = {
                referenceNumber: lastRefNo || '',
                accountId: '',
                ouId: lastOu || this.ouId || '',
                currencyId: '',
                buyRate: null,
                sellRate: null,
                description: lastDesc || '',
                localDebit: 0,
                localCredit: 0,
                foreignDebit: 0,
                foreignCredit: 0,
                transactionDate: lastTxDate || this.batchDate || new Date().toISOString().slice(0, 10),
                chequeNo: lastChequeNo || ''
            };

            // Pre-suggest the deficit side to help balance quickly
            if (net > 0.01) line.localCredit = net;
            if (net < -0.01) line.localDebit = Math.abs(net);

            return line;
        },

        addLine() {
            this.journalEntryList.push(this.buildNewLine());
        },

        removeLine(index) {
            if (this.journalEntryList.length <= 2) {
                this.toastHandler('warning', 'A journal entry requires at least two lines.');
                return;
            }
            this.journalEntryList.splice(index, 1);
        },

        removeLastLine() {
            if (this.journalEntryList.length > 2) {
                this.journalEntryList.pop();
            }
        },

        /* ══════════════════════════════════════════════════════════
           Field Change Handlers
        ══════════════════════════════════════════════════════════ */

        onHeaderOuChange() {
            // Watcher takes care of cascading — nothing extra needed here
        },

        /** When a GL account is chosen, auto-populate the currency for that line. */
        onAccountChange(accountId, rowIndex) {
            const line = this.journalEntryList[rowIndex];
            if (!line) return;

            if (!accountId) {
                // Account cleared
                Object.assign(this.journalEntryList[rowIndex], {
                    currencyId: '', currencyName: '', buyRate: null, sellRate: null,
                    localDebit: 0, localCredit: 0,
                    foreignDebit: 0, foreignCredit: 0
                });
                return;
            }

            const account = this.accountsList.find(a => String(a.id).toLowerCase() === String(accountId).toLowerCase());
            const currencyId = account?.currencyId || account?.CurrencyId || '';
            this.journalEntryList[rowIndex].currencyId = currencyId;

            if (!currencyId) return;

            const currency = this.currencyRateList.find(c =>
                c.id === currencyId || String(c.id).toLowerCase() === String(currencyId).toLowerCase()
            );

            if (currency) {
                const buyRate = currency.buyRate !== undefined ? currency.buyRate
                    : (currency.BuyRate !== undefined ? currency.BuyRate
                        : (currency.rates?.[0]?.buyingRate || currency.rates?.[0]?.BuyingRate || (currency.isDefault ? 1 : null)));

                const sellRate = currency.sellRate !== undefined ? currency.sellRate
                    : (currency.SellRate !== undefined ? currency.SellRate
                        : (currency.rates?.[0]?.sellingRate || currency.rates?.[0]?.SellingRate || (currency.isDefault ? 1 : null)));

                this.journalEntryList[rowIndex].currencyName = currency.currencyName || currency.CurrencyName || currency.name || '';
                this.journalEntryList[rowIndex].currencyCode = currency.currencyCode || currency.CurrencyCode || '';
                this.journalEntryList[rowIndex].buyRate = buyRate !== null && buyRate !== undefined ? parseFloat(buyRate) : null;
                this.journalEntryList[rowIndex].sellRate = sellRate !== null && sellRate !== undefined ? parseFloat(sellRate) : null;

                if (this.isMultiCurrency) {
                    const isDefault = !!currency.isDefault;
                    const cur = this.journalEntryList[rowIndex];
                    const hasLocal = (parseFloat(cur.localDebit) || 0) > 0 || (parseFloat(cur.localCredit) || 0) > 0;
                    const hasForeign = (parseFloat(cur.foreignDebit) || 0) > 0 || (parseFloat(cur.foreignCredit) || 0) > 0;

                    Object.assign(this.journalEntryList[rowIndex], {
                        localDebit: isDefault ? (hasLocal ? cur.localDebit : 0) : 0,
                        localCredit: isDefault ? (hasLocal ? cur.localCredit : 0) : 0,
                        foreignDebit: !isDefault ? (hasForeign ? cur.foreignDebit : 0) : 0,
                        foreignCredit: !isDefault ? (hasForeign ? cur.foreignCredit : 0) : 0
                    });
                }
            }
        },

        /* ── Currency field-enable helpers (MC mode) ── */
        isCurrencyDefault(index) {
            const line = this.journalEntryList[index];
            // No currency set → treat as local (default) so local fields stay open
            if (!line?.currencyId) return true;
            const currency = this.currencyRateList.find(c => String(c.id).toLowerCase() === String(line.currencyId).toLowerCase());
            // Unknown currency → fall back to local
            return currency ? !!currency.isDefault : true;
        },
        isLocalFieldEnabled(index) { return this.isCurrencyDefault(index); },
        isForeignFieldEnabled(index) { return !this.isCurrencyDefault(index); },

        /* ── Validation helper ── */
        lineHasError(index) {
            const line = this.journalEntryList[index];
            return !line?.accountId;
        },

        /* ══════════════════════════════════════════════════════════
           Save / Update
        ══════════════════════════════════════════════════════════ */

        async saveJournal() {
            this.errors = {};

            // Header validation
            if (!this.batchDate) {
                this.errors.batchDate = 'Batch date is required.';
                return;
            }

            // Lines validation
            if (!this.journalEntryList.length) {
                this.toastHandler('error', 'Please add at least one journal line before saving.');
                return;
            }

            const hasDebit = this.journalEntryList.some(e => (parseFloat(e.localDebit) || 0) > 0);
            const hasCredit = this.journalEntryList.some(e => (parseFloat(e.localCredit) || 0) > 0);

            if (!hasDebit || !hasCredit) {
                this.toastHandler('error', 'A journal entry must have both debit and credit transactions.');
                return;
            }

            if (Math.abs(this.totalDebit - this.totalCredit) > 0.01) {
                this.toastHandler('error',
                    `Total debits must equal total credits. Difference: ${Math.abs(this.totalDebit - this.totalCredit).toFixed(2)}`);
                return;
            }

            const emptyGuid = '00000000-0000-0000-0000-000000000000';

            for (let i = 0; i < this.journalEntryList.length; i++) {
                const t = this.journalEntryList[i];

                if (!t.accountId) {
                    this.toastHandler('error', `Row ${i + 1}: GL Account is required.`);
                    return;
                }
                if (this.enforceOu && !t.ouId) {
                    this.toastHandler('error', `Row ${i + 1}: Organisational Unit is required.`);
                    return;
                }

                // Enrich names, currency, and rates for the payload
                const acct = this.accountsList.find(x => String(x.id).toLowerCase() === String(t.accountId).toLowerCase());
                const ou = this.costCenterHierarchyList.find(x => String(x.id).toLowerCase() === String(t.ouId).toLowerCase());
                const currencyId = t.currencyId || acct?.currencyId || acct?.CurrencyId || '';
                const currency = this.currencyRateList.find(c =>
                    String(c.id).toLowerCase() === String(currencyId).toLowerCase()
                );

                const buyRate = t.buyRate ?? currency?.buyRate ?? currency?.BuyRate
                    ?? (currency?.rates?.[0]?.buyingRate || currency?.rates?.[0]?.BuyingRate) ?? (currency?.isDefault ? 1 : 0);
                const sellRate = t.sellRate ?? currency?.sellRate ?? currency?.SellRate
                    ?? (currency?.rates?.[0]?.sellingRate || currency?.rates?.[0]?.SellingRate) ?? (currency?.isDefault ? 1 : 0);

                this.journalEntryList[i].id = (t.id && t.id !== emptyGuid) ? t.id : this.uuid();
                if (this.isEditMode && this.journalId) {
                    this.journalEntryList[i].journalId = this.journalId;
                }
                this.journalEntryList[i].accountName = acct ? `${acct.accountNo} - ${acct.accountName}` : (t.accountName || '');
                this.journalEntryList[i].ouName = ou ? ou.name : (t.ouName || '');
                this.journalEntryList[i].currencyId = currencyId || emptyGuid;
                this.journalEntryList[i].currencyName = t.currencyName || currency?.currencyName || currency?.CurrencyName || currency?.name || '';
                this.journalEntryList[i].currencyCode = t.currencyCode || currency?.currencyCode || currency?.CurrencyCode || '';
                this.journalEntryList[i].buyRate = parseFloat(buyRate) || 0;
                this.journalEntryList[i].sellRate = parseFloat(sellRate) || 0;
                this.journalEntryList[i].transactionSource = 'GL';
                this.journalEntryList[i].isLocal = !this.isMultiCurrency;

                const lineTxDate = t.transactionDate || this.batchDate || new Date().toISOString().slice(0, 10);
                this.journalEntryList[i].transactionDate = lineTxDate;
                this.journalEntryList[i].TransactionDate = lineTxDate;
                this.journalEntryList[i].batchDate = this.batchDate;
                this.journalEntryList[i].BatchDate = this.batchDate;

                // Normalise amounts for the payload
                const localDr = parseFloat(t.localDebit) || 0;
                const localCr = parseFloat(t.localCredit) || 0;
                const fgnDr = parseFloat(t.foreignDebit) || 0;
                const fgnCr = parseFloat(t.foreignCredit) || 0;

                this.journalEntryList[i].localDebit = localDr;
                this.journalEntryList[i].localCredit = localCr;
                this.journalEntryList[i].debitAmount = localDr;
                this.journalEntryList[i].creditAmount = localCr;

                if (this.isMultiCurrency) {
                    this.journalEntryList[i].foreignDebit = fgnDr;
                    this.journalEntryList[i].foreignCredit = fgnCr;
                    this.journalEntryList[i].currencyRate = parseFloat(buyRate) || 0;
                    this.journalEntryList[i].isMultiCurrency = true;    
                } else {
                    this.journalEntryList[i].foreignDebit = 0;
                    this.journalEntryList[i].foreignCredit = 0;
                    this.journalEntryList[i].currencyRate = 1;
                    this.journalEntryList[i].isMultiCurrency = false;
                }

                if (!this.journalEntryList[i].ouId) {
                    this.journalEntryList[i].ouId = emptyGuid;
                }
            }

            const payload = {
                id: this.isEditMode ? this.journalId : undefined,
                batchNumber: this.batchNumber || String(Math.floor(Math.random() * 100000)),
                batchDate: this.batchDate,
                batchDescription: this.batchDescription || '',
                totalDebit: this.totalDebit,
                totalCredit: this.totalCredit,
                isMultiCurrency: this.isMultiCurrency,
                transactionSource: 'GL',
                journalDetails: this.journalEntryList
            };

            this.isLoading = true;

            try {
                let res;
                if (this.isEditMode) {
                    res = await axios.post('/GeneralLedger/UpdateJournal', payload);
                } else {
                    res = await axios.post('/GeneralLedger/SaveJournal', payload);
                }

                if (res?.data && res.data.success === false) {
                    const errorMsg = res.data.message || res.data.error || `Unable to ${this.isEditMode ? 'update' : 'save'} journal.`;
                    this.toastHandler('error', errorMsg);
                    return;
                }

                this.toastHandler('success', `Journal ${this.isEditMode ? 'updated' : 'saved'} successfully.`);
                setTimeout(() => {
                    window.location.href = '/GeneralLedger/Journal';
                }, 1500);
            } catch (err) {
                console.error(`Failed to ${this.isEditMode ? 'update' : 'save'} journal:`, err);
                const errMsg = err?.response?.data?.message || err?.response?.data?.error || `Unable to ${this.isEditMode ? 'update' : 'save'} journal.`;
                this.toastHandler('error', errMsg);
            } finally {
                this.isLoading = false;
            }
        },

        /* ══════════════════════════════════════════════════════════
           Post Journal (Draft to General Ledger)
        ══════════════════════════════════════════════════════════ */

        async postJournal() {
            if (!this.journalId) {
                this.toastHandler('warning', 'Please save the journal before posting.');
                return;
            }

            const confirm = await Swal.fire({
                title: 'Post Journal Batch?',
                text: `Are you sure you want to post batch "${this.batchNumber}"? Posted journals affect the general ledger permanently.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#059669',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Post',
                cancelButtonText: 'Cancel'
            });

            if (!confirm.isConfirmed) return;

            this.isLoading = true;
            try {
                let res;
                try {
                    res = await axios.post('/GeneralLedger/PostJournalBatches', [this.journalId]);
                } catch {
                    res = await axios.post('/LedgerDataEntry/PostVouchers', { ids: [this.journalId] });
                }

                this.isPosted = true;
                this.toastHandler('success', `Batch "${this.batchNumber}" posted successfully.`);
                setTimeout(() => {
                    window.location.href = '/GeneralLedger/Journal';
                }, 1500);
            } catch (err) {
                console.error('Error posting journal:', err);
                this.toastHandler('error', 'Unable to post journal batch.');
            } finally {
                this.isLoading = false;
            }
        },

        /* ══════════════════════════════════════════════════════════
           Cost Centre Hierarchy
        ══════════════════════════════════════════════════════════ */

        parseCostCenterHierarchy(dataArr) {
            this.costCenterList = dataArr;
            const result = [];
            for (const cc of this.costCenterList) {
                this.costCenterNameList = [];
                this.getHierarchyName(cc.id);
                const name = [...new Set(this.costCenterNameList)].join().replace(/,/g, '/');
                result.push({ id: cc.id, name, parentId: cc.parentId, rawName: cc.name });
            }
            return result;
        },

        getHierarchyName(id) {
            let parentId, returnName;
            for (const item of this.costCenterList) {
                if (item.id === id) {
                    parentId = item.parentId;
                    returnName = item.name;
                    break;
                }
            }
            if (parentId) this.getHierarchyName(parentId);
            if (returnName) this.costCenterNameList.push(returnName);
        },

        /* ══════════════════════════════════════════════════════════
           Helpers
        ══════════════════════════════════════════════════════════ */

        formatCurrency(value) {
            if (value === null || value === undefined) return '0.00';
            return parseFloat(value).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        uuid() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        },

        toastHandler(type, message = 'An unexpected error occurred.') {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                    title: message,
                    showConfirmButton: false,
                    timer: 5000,
                    timerProgressBar: true
                });
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }
    },

    async mounted() {
        const urlParams = new URLSearchParams(window.location.search);
        const queryId = urlParams.get('id');
        const targetId = (typeof window.journalId !== 'undefined' && window.journalId && window.journalId !== '00000000-0000-0000-0000-000000000000')
            ? window.journalId
            : (queryId && queryId !== '00000000-0000-0000-0000-000000000000' ? queryId : '');

        if (targetId) {
            this.journalId = targetId;
            this.isEditMode = true;
            // Keep the overlay up for the entire edit-mode initialisation sequence
            this.isShimmerLoading = true;
        }

        await this.getData();

        if (this.isEditMode && this.journalId) {
            // loadJournalDetails manages isShimmerLoading itself
            await this.loadJournalDetails(this.journalId);
        }
    }
});

app.mount('#app');
