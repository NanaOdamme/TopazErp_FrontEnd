const app = Vue.createApp({
    data() {
        return {
            /* ── UI State ─────────────────────────────────────────── */
            isShimmerLoading: false,
            isLoading: false,
            isMultiCurrency: false,

            /* ── Header fields ────────────────────────────────────── */
            batchNumber: '',
            batchDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD for <input type="date">
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
                    recipient: '',
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
                    recipient: '',
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
        /* When header OU changes, cascade to every line that has no OU set */
        ouId(newVal) {
            this.journalEntryList = this.journalEntryList.map(line => ({
                ...line,
                ouId: newVal
            }));
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

                lines.forEach((line, idx) => {
                    const buyRate = parseFloat(line.buyRate);
                    if (!buyRate || buyRate <= 0) return;

                    const currency = this.currencyRateList.find(c => c.id === line.currencyId);
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

                // Seed two default lines (cannot be deleted)
                this.journalEntryList = [];
                this.addLine();
                this.addLine();

            } catch (err) {
                console.error('Failed to initialise journal:', err);
                this.toastHandler('error', 'Unable to initialise journal.');
                if (this.journalEntryList.length < 2) {
                    this.journalEntryList = [];
                    this.addLine();
                    this.addLine();
                }
            } finally {
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

        /** Returns a blank journal line, pre-filling fields from the previous row
         *  and auto-suggesting the balancing amount to keep debits === credits. */
        buildNewLine() {
            const prev = this.journalEntryList.length > 0
                ? this.journalEntryList[this.journalEntryList.length - 1]
                : null;

            const net = +(this.totalDebit - this.totalCredit);

            const line = {
                referenceNumber: prev?.referenceNumber || '',
                accountId:       '',
                ouId:            prev?.ouId || this.ouId || '',
                currencyId:      '',
                buyRate:         null,
                sellRate:        null,
                description:     prev?.description || '',
                localDebit:      0,
                localCredit:     0,
                foreignDebit:    0,
                foreignCredit:   0,
                recipient:       '',
                chequeNo:        prev?.chequeNo || ''
            };

            // Pre-suggest the deficit side to help balance quickly
            if (net > 0.01)  line.localCredit = net;
            if (net < -0.01) line.localDebit  = Math.abs(net);

            return line;
        },

        addLine() {
            this.journalEntryList.push(this.buildNewLine());
        },

        removeLine(index) {
            if (index < 2) {
                this.toastHandler('warning', 'Default journal rows cannot be deleted.');
                return;
            }
            if (this.journalEntryList.length > 2) {
                this.journalEntryList.splice(index, 1);
            }
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

            const account = this.accountsList.find(a => a.id === accountId);
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
                this.journalEntryList[rowIndex].buyRate      = buyRate !== null && buyRate !== undefined ? parseFloat(buyRate) : null;
                this.journalEntryList[rowIndex].sellRate     = sellRate !== null && sellRate !== undefined ? parseFloat(sellRate) : null;

                if (this.isMultiCurrency) {
                    const isDefault = !!currency.isDefault;
                    const cur = this.journalEntryList[rowIndex];
                    const hasLocal   = (parseFloat(cur.localDebit)   || 0) > 0 || (parseFloat(cur.localCredit)   || 0) > 0;
                    const hasForeign = (parseFloat(cur.foreignDebit)  || 0) > 0 || (parseFloat(cur.foreignCredit) || 0) > 0;

                    Object.assign(this.journalEntryList[rowIndex], {
                        localDebit:   isDefault ? (hasLocal ? cur.localDebit : 0) : 0,
                        localCredit:  isDefault ? (hasLocal ? cur.localCredit : 0) : 0,
                        foreignDebit:  !isDefault ? (hasForeign ? cur.foreignDebit : 0) : 0,
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
            const currency = this.currencyRateList.find(c => c.id === line.currencyId);
            // Unknown currency → fall back to local
            return currency ? !!currency.isDefault : true;
        },
        isLocalFieldEnabled(index)   { return this.isCurrencyDefault(index); },
        isForeignFieldEnabled(index) { return !this.isCurrencyDefault(index); },

        /* ── Validation helper ── */
        lineHasError(index) {
            const line = this.journalEntryList[index];
            return !line?.accountId;
        },

        /* ══════════════════════════════════════════════════════════
           Save
        ══════════════════════════════════════════════════════════ */

        saveJournal() {
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

            const hasDebit  = this.journalEntryList.some(e => (parseFloat(e.localDebit)  || 0) > 0);
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
                const acct = this.accountsList.find(x => x.id === t.accountId);
                const ou   = this.costCenterHierarchyList.find(x => x.id === t.ouId);
                const currencyId = t.currencyId || acct?.currencyId || acct?.CurrencyId || '';
                const currency = this.currencyRateList.find(c => 
                    c.id === currencyId || (currencyId && String(c.id).toLowerCase() === String(currencyId).toLowerCase())
                );

                const buyRate = t.buyRate ?? currency?.buyRate ?? currency?.BuyRate 
                    ?? (currency?.rates?.[0]?.buyingRate || currency?.rates?.[0]?.BuyingRate) ?? (currency?.isDefault ? 1 : 0);
                const sellRate = t.sellRate ?? currency?.sellRate ?? currency?.SellRate 
                    ?? (currency?.rates?.[0]?.sellingRate || currency?.rates?.[0]?.SellingRate) ?? (currency?.isDefault ? 1 : 0);

                this.journalEntryList[i].accountName       = acct ? `${acct.accountNo} - ${acct.accountName}` : '';
                this.journalEntryList[i].ouName            = ou   ? ou.name : '';
                this.journalEntryList[i].currencyId        = currencyId;
                this.journalEntryList[i].currencyName      = t.currencyName || currency?.currencyName || currency?.CurrencyName || currency?.name || '';
                this.journalEntryList[i].currencyCode      = t.currencyCode || currency?.currencyCode || currency?.CurrencyCode || '';
                this.journalEntryList[i].buyRate           = parseFloat(buyRate) || 0;
                this.journalEntryList[i].sellRate          = parseFloat(sellRate) || 0;
                this.journalEntryList[i].id                = this.uuid();
                this.journalEntryList[i].transactionSource = 'GL';
                this.journalEntryList[i].isLocal           = !this.isMultiCurrency;

                // Normalise amounts for the payload
                const localDr  = parseFloat(t.localDebit)  || 0;
                const localCr  = parseFloat(t.localCredit) || 0;
                const fgnDr    = parseFloat(t.foreignDebit)  || 0;
                const fgnCr    = parseFloat(t.foreignCredit) || 0;

                this.journalEntryList[i].localDebit    = localDr;
                this.journalEntryList[i].localCredit   = localCr;
                this.journalEntryList[i].debitAmount    = localDr;
                this.journalEntryList[i].creditAmount   = localCr;

                if (this.isMultiCurrency) {
                    this.journalEntryList[i].foreignDebit  = fgnDr;
                    this.journalEntryList[i].foreignCredit = fgnCr;
                    this.journalEntryList[i].currencyRate  = parseFloat(buyRate) || 0;
                } else {
                    this.journalEntryList[i].foreignDebit  = 0;
                    this.journalEntryList[i].foreignCredit = 0;
                    this.journalEntryList[i].currencyRate  = 1;
                }

                if (!this.journalEntryList[i].ouId) {
                    this.journalEntryList[i].ouId = emptyGuid;
                }
            }

            const payload = {
                batchNumber:      this.batchNumber || String(Math.floor(Math.random() * 100000)),
                batchDate:        this.batchDate,
                totalDebit:       this.totalDebit,
                totalCredit:      this.totalCredit,
                isMultiCurrency:  this.isMultiCurrency,
                transactionSource: 'GL',
                journalDetails:   this.journalEntryList
            };

            
            this.isLoading = true;
            
            axios.post('/GeneralLedger/SaveJournal', payload)
                .then(() => {
                    this.toastHandler('success', 'Journal saved successfully.');
                    setTimeout(() => {
                        window.location.href = '/GeneralLedger/Journal';
                    }, 1500);
                })
                .catch(err => {
                    console.error('Failed to save journal:', err);
                    this.toastHandler('error', 'Unable to save journal.');
                })
                .finally(() => {
                    this.isLoading = false;
                });
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
                    parentId  = item.parentId;
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

    mounted() {
        this.getData();
    }
});

app.mount('#app');
