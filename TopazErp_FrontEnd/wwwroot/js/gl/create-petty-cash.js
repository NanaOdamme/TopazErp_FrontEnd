/**
 * General Ledger - Petty Cash Transaction Entry / Edit (Vue 3)
 * Dual-mode page: /GeneralLedger/CreatePettyCash (new) and ?id= (edit).
 * Listing lives on /GeneralLedger/PettyCash.
 */
const app = Vue.createApp({
    data() {
        const todayStr = new Date().toISOString().split('T')[0];
        return {
            theme: '#0645e7',
            isLoading: false,
            isShimmerLoading: true,
            isFetching: false,
            isEditing: false,
            showPrintModal: false,

            emptyGuid: '00000000-0000-0000-0000-000000000000',
            proposedJournalHeaderId: '',
            proposedJournalDetailIdList: [],
            journalEntryList: [],

            // Server-loaded lookups
            accountsList: [],
            pettyCashAccounts: [],
            expenseAccountsList: [],
            costCenterList: [],
            recipientList: [],
            currencyList: [],
            defaultGlSetup: null,
            currentSystemNumber: null,
            currentUser: '',

            // Entry Form State
            entryForm: {
                id: null,
                batchDate: todayStr,
                batchNo: '',
                sourceDocNo: '',
                pettyCashAccountId: '',
                pettyCashAccountName: '',
                batchOriginator: '',
                currencyId: '',
                currencyName: 'Ghana Cedi',
                currencyCode: 'GHS',
                currencyRate: 1.0000,
                totalAmount: 0,
                isPosted: false,
                lines: []
            },

            emptyFormTemplate: {
                id: null,
                batchDate: todayStr,
                batchNo: '',
                sourceDocNo: '',
                pettyCashAccountId: '',
                pettyCashAccountName: '',
                batchOriginator: '',
                currencyId: '',
                currencyName: 'Ghana Cedi',
                currencyCode: 'GHS',
                currencyRate: 1.0000,
                totalAmount: 0,
                isPosted: false,
                lines: []
            }
        };
    },

    computed: {
        totalLineAmount() {
            if (!this.entryForm.lines) return 0;
            return this.entryForm.lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
        },

        currencyCode() {
            return this.entryForm.currencyCode || 'GHS';
        },

        currencySymbol() {
            const code = this.currencyCode;
            if (code === 'USD') return '$';
            if (code === 'EUR') return '€';
            if (code === 'GBP') return '£';
            return 'GH¢ ';
        },

        proposedJournalEntries() {
            const lines = [];

            // 1. Debit lines: Each itemized expense line
            (this.entryForm.lines || []).forEach(v => {
                const debitAccountInfo = this.accountsList.find(x => String(x.id).toLowerCase() === String(v.expenseAccountId).toLowerCase());
                const debitAmount = parseFloat(v.amount || 0);
                const ouInfo = this.costCenterList.find(x => String(x.id).toLowerCase() === String(v.ouId).toLowerCase());
                if (v.expenseAccountId || debitAmount > 0) {
                    lines.push({
                        accountId: v.expenseAccountId || this.emptyGuid,
                        accountDisplay: this.formatAccountDisplay(debitAccountInfo),
                        description: v.description || 'Petty cash expense',
                        debitAmount,
                        creditAmount: 0,
                        ouId: v.ouId || this.emptyGuid,
                        ouName: ouInfo ? ouInfo.name : (v.ouName || '—'),
                        referenceNumber: v.refNo || this.entryForm.batchNo || '',
                        recipientId: v.recipientId || this.emptyGuid,
                        recipientName: v.recipientName || '',
                        chequeNo: '',
                    });
                }
            });

            // 2. Credit line: Petty cash / cash account
            const netAmount = parseFloat(this.totalLineAmount || 0);
            const pettyCashAccountInfo = this.accountsList.find(x => String(x.id).toLowerCase() === String(this.entryForm.pettyCashAccountId).toLowerCase());
            const firstOuId = (this.entryForm.lines && this.entryForm.lines.find(x => x.ouId && x.ouId !== this.emptyGuid)?.ouId) || this.emptyGuid;
            const firstOuInfo = this.costCenterList.find(x => String(x.id).toLowerCase() === String(firstOuId).toLowerCase());
            const firstOuName = firstOuInfo ? firstOuInfo.name : '—';
            const firstRef = (this.entryForm.lines && this.entryForm.lines.length) ? (this.entryForm.lines[0].refNo || this.entryForm.batchNo) : this.entryForm.batchNo;

            if (this.entryForm.pettyCashAccountId || netAmount > 0) {
                lines.push({
                    accountId: this.entryForm.pettyCashAccountId || this.emptyGuid,
                    accountDisplay: this.formatAccountDisplay(pettyCashAccountInfo),
                    description: `Disbursement from petty cash · Batch #${this.entryForm.batchNo || ''}`,
                    debitAmount: 0,
                    creditAmount: netAmount,
                    ouId: firstOuId,
                    ouName: firstOuName,
                    referenceNumber: firstRef || this.entryForm.batchNo || '',
                    chequeNo: '',
                });
            }

            return lines;
        },

        proposedJournalTotals() {
            let debit = 0;
            let credit = 0;
            (this.proposedJournalEntries || []).forEach(row => {
                debit += parseFloat(row.debitAmount || 0);
                credit += parseFloat(row.creditAmount || 0);
            });
            debit = Math.round((debit + Number.EPSILON) * 100) / 100;
            credit = Math.round((credit + Number.EPSILON) * 100) / 100;
            const isBalanced = Math.abs(debit - credit) < 0.009 && debit > 0;
            return { debit, credit, isBalanced };
        }
    },

    methods: {
        goToListing() {
            window.location.href = '/GeneralLedger/PettyCash';
        },

        formatNumber(num) {
            if (num === null || num === undefined || isNaN(num)) return '0.00';
            const val = Number(num);
            if (val < 0) {
                return `(${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
            }
            return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        fmtNum(val) {
            const num = parseFloat(val || 0);
            return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        uuid() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        },

        formatAccountDisplay(acc) {
            if (!acc) return '—';
            if (acc.accountIdentifier) return acc.accountIdentifier;
            if (acc.accountNo && acc.accountName) return `${acc.accountNo} - ${acc.accountName}`;
            return acc.accountName || acc.name || '—';
        },

        createEmptyLine(custom = {}) {
            return {
                uid: 'line_' + Math.random().toString(36).substring(2, 9),
                id: null,
                transactionDate: this.entryForm.batchDate || new Date().toISOString().split('T')[0],
                refNo: '',
                expenseAccountId: '',
                expenseAccountName: '',
                description: '',
                amount: null,
                ouId: '',
                ouName: '',
                recipientId: '',
                recipientName: '',
                ...custom
            };
        },

        addLineItem() {
            this.entryForm.lines.push(this.createEmptyLine());
        },

        removeLineItem(idx) {
            if (this.entryForm.lines.length <= 1) {
                this.toast('warning', 'At least one transaction line item is required.');
                return;
            }
            this.entryForm.lines.splice(idx, 1);
        },

        duplicateLineItem(idx) {
            const target = this.entryForm.lines[idx];
            if (!target) return;
            const cloned = {
                ...JSON.parse(JSON.stringify(target)),
                uid: 'line_' + Math.random().toString(36).substring(2, 9),
                id: null
            };
            this.entryForm.lines.splice(idx + 1, 0, cloned);
            this.toast('info', 'Expense line duplicated.');
        },

        onPettyCashAccountChange() {
            const acc = this.accountsList.find(a => String(a.id) === String(this.entryForm.pettyCashAccountId));
            if (acc) {
                this.entryForm.pettyCashAccountName = acc.accountIdentifier || `${acc.accountNo} - ${acc.accountName}`;
            }
        },

        onCurrencyChange() {
            const curr = this.currencyList.find(c => String(c.id) === String(this.entryForm.currencyId));
            if (curr) {
                this.entryForm.currencyName = curr.currencyName || curr.name || 'Ghana Cedi';
                this.entryForm.currencyCode = curr.currencyCode || curr.code || 'GHS';
                this.entryForm.currencyRate = Number(curr.rate || curr.buyRate || curr.sellingRate || 1.0000);
            }
        },

        onLineAccountChange(line) {
            const acc = this.accountsList.find(a => String(a.id) === String(line.expenseAccountId));
            if (acc) {
                line.expenseAccountName = acc.accountIdentifier || `${acc.accountNo} - ${acc.accountName}`;
            }
        },

        onLineOuChange(line) {
            const ou = this.costCenterList.find(c => String(c.id) === String(line.ouId));
            if (ou) {
                line.ouName = ou.name;
            }
        },

        onLineRecipientChange(line) {
            const rec = this.recipientList.find(r => String(r.id) === String(line.recipientId));
            if (rec) {
                line.recipientName = rec.recipient || rec.name || '';
            }
        },

        applySystemNumberPattern(sn) {
            if (!sn) return '';
            const prefix  = sn.prefix  != null ? sn.prefix  : '';
            const suffix  = sn.suffix  != null ? sn.suffix  : '';
            const lastNo  = sn.lastNo  != null ? sn.lastNo  : 0;
            const padding = sn.padding != null ? parseInt(sn.padding, 10) : 0;

            // Mirror C# fallback: use lowercase "{prefix}{number}{suffix}" when no pattern
            const pattern = (sn.formatPattern && sn.formatPattern.trim())
                ? sn.formatPattern.trim()
                : '{prefix}{number}{suffix}';

            const numStr = padding > 0
                ? String(lastNo).padStart(padding, '0')
                : String(lastNo);

            return pattern
                .replace(/{PREFIX}/g, prefix)
                .replace(/{NO}/g,     numStr)
                .replace(/{SUFFIX}/g, suffix)
                .replace(/{prefix}/g, prefix)
                .replace(/{number}/g, numStr)
                .replace(/{suffix}/g, suffix);
        },

        async generateBatchNumber() {
            if (this.isEditing) {
                return;
            }

            try {
                let sn = this.currentSystemNumber;
                if (!sn || !(sn.key && sn.key.toLowerCase().includes('petty-cash-id'))) {
                    try {
                        const snRes = await axios.get('/SharedResource/GetSystemNumberInfo?key=petty-cash-id');
                        const snData = snRes.data.result;
                        if (Array.isArray(snData)) {
                            sn = snData.find(s => s.key && s.key.toLowerCase().includes('petty-cash-id')) || snData[0];
                        } else if (snData && snData.key) {
                            sn = snData;
                        }
                    } catch (_) {}
                }

                if (!sn) {
                    try {
                        const response = await axios.get('/SharedResource/GetSystemNumbers');
                        const systemNumbers = response.data.result;
                        if (Array.isArray(systemNumbers) && systemNumbers.length > 0) {
                            sn = systemNumbers.find(item =>
                                item.key && item.key.toLowerCase() === 'petty-cash-id'
                            ) || systemNumbers.find(item =>
                                item.key && item.key.toLowerCase().includes('petty-cash-id')
                            ) || systemNumbers.find(item =>
                                item.key && (item.key.toLowerCase().includes('petty-cash') || item.key.toLowerCase().includes('pettycash'))
                            );
                        }
                    } catch (_) {}
                }

                if (sn) {
                    this.currentSystemNumber = sn;
                    this.entryForm.batchNo = this.applySystemNumberPattern(sn);
                    return;
                }
            } catch (err) {
                console.warn('Unable to fetch system numbers for petty cash batch:', err);
            }

            // Fallback generated batch number
            if (!this.entryForm.batchNo) {
                const rand = Math.floor(1000 + Math.random() * 9000);
                this.entryForm.batchNo = `${rand}`;
            }
        },

        newBatch() {
            this.isEditing = false;
            this.proposedJournalHeaderId = '';
            this.proposedJournalDetailIdList = [];
            const todayStr = new Date().toISOString().split('T')[0];

            this.entryForm = {
                ...JSON.parse(JSON.stringify(this.emptyFormTemplate)),
                batchDate: todayStr,
                batchOriginator: this.currentUser || 'Administrator',
                lines: [this.createEmptyLine({ transactionDate: todayStr })]
            };

            // Set default currency
            if (this.currencyList.length > 0) {
                const defaultCurr = this.currencyList.find(c =>
                    c.isDefault ||
                    (c.currencyName && c.currencyName.toLowerCase().includes('cedi')) ||
                    (c.currencyCode && c.currencyCode.toUpperCase() === 'GHS')
                ) || this.currencyList[0];

                if (defaultCurr) {
                    this.entryForm.currencyId = defaultCurr.id;
                    this.entryForm.currencyCode = defaultCurr.currencyCode || defaultCurr.code || 'GHS';
                    this.entryForm.currencyName = defaultCurr.currencyName || defaultCurr.name || 'Ghana Cedi';
                    this.entryForm.currencyRate = 1.0000;
                }
            }

            // Set default Petty Cash Account
            if (this.defaultGlSetup?.pettyCashGlAccountId) {
                this.entryForm.pettyCashAccountId = this.defaultGlSetup.pettyCashGlAccountId;
                this.onPettyCashAccountChange();
            } else if (this.pettyCashAccounts.length > 0) {
                this.entryForm.pettyCashAccountId = this.pettyCashAccounts[0].id;
                this.onPettyCashAccountChange();
            }

            this.generateBatchNumber();

            if (window.history.pushState) {
                window.history.pushState({}, '', '/GeneralLedger/CreatePettyCash');
            }
        },

        hydrateLineNames() {
            if (this.entryForm.pettyCashAccountId) {
                const targetId = String(this.entryForm.pettyCashAccountId).toLowerCase();
                const acc = this.accountsList.find(a => String(a.id).toLowerCase() === targetId);
                if (acc) {
                    this.entryForm.pettyCashAccountId = acc.id;
                    this.entryForm.pettyCashAccountName = acc.accountIdentifier || `${acc.accountNo} - ${acc.accountName}`;
                } else if (this.entryForm.pettyCashAccountName) {
                    const synthetic = {
                        id: this.entryForm.pettyCashAccountId,
                        accountNo: '',
                        accountName: this.entryForm.pettyCashAccountName,
                        accountIdentifier: this.entryForm.pettyCashAccountName
                    };
                    if (!this.pettyCashAccounts.some(a => String(a.id).toLowerCase() === targetId)) {
                        this.pettyCashAccounts.push(synthetic);
                    }
                    if (!this.accountsList.some(a => String(a.id).toLowerCase() === targetId)) {
                        this.accountsList.push(synthetic);
                    }
                }
            }

            if (this.entryForm.currencyId) {
                const targetCurrId = String(this.entryForm.currencyId).toLowerCase();
                const curr = this.currencyList.find(c => String(c.id).toLowerCase() === targetCurrId);
                if (curr) {
                    this.entryForm.currencyId = curr.id;
                    this.entryForm.currencyName = curr.currencyName || curr.name || 'Ghana Cedi';
                    this.entryForm.currencyCode = curr.currencyCode || curr.code || 'GHS';
                }
            }

            (this.entryForm.lines || []).forEach(line => {
                if (line.expenseAccountId) {
                    const targetAccId = String(line.expenseAccountId).toLowerCase();
                    const acc = this.accountsList.find(a => String(a.id).toLowerCase() === targetAccId);
                    if (acc) {
                        line.expenseAccountId = acc.id;
                        line.expenseAccountName = acc.accountIdentifier || `${acc.accountNo} - ${acc.accountName}`;
                    } else if (line.expenseAccountName) {
                        const synthetic = {
                            id: line.expenseAccountId,
                            accountNo: '',
                            accountName: line.expenseAccountName,
                            accountIdentifier: line.expenseAccountName
                        };
                        if (!this.expenseAccountsList.some(a => String(a.id).toLowerCase() === targetAccId)) {
                            this.expenseAccountsList.push(synthetic);
                        }
                        if (!this.accountsList.some(a => String(a.id).toLowerCase() === targetAccId)) {
                            this.accountsList.push(synthetic);
                        }
                    }
                }
                if (line.ouId) {
                    const targetOuId = String(line.ouId).toLowerCase();
                    const ou = this.costCenterList.find(c => String(c.id).toLowerCase() === targetOuId);
                    if (ou) {
                        line.ouId = ou.id;
                        line.ouName = ou.name;
                    } else if (line.ouName) {
                        const syntheticOu = { id: line.ouId, name: line.ouName };
                        if (!this.costCenterList.some(c => String(c.id).toLowerCase() === targetOuId)) {
                            this.costCenterList.push(syntheticOu);
                        }
                    }
                }
                if (line.recipientId) {
                    const targetRecId = String(line.recipientId).toLowerCase();
                    const rec = this.recipientList.find(r => String(r.id).toLowerCase() === targetRecId);
                    if (rec) {
                        line.recipientId = rec.id;
                        line.recipientName = rec.recipient || rec.name || '';
                    } else if (line.recipientName) {
                        const syntheticRec = { id: line.recipientId, name: line.recipientName, recipient: line.recipientName };
                        if (!this.recipientList.some(r => String(r.id).toLowerCase() === targetRecId)) {
                            this.recipientList.push(syntheticRec);
                        }
                    }
                }
            });
        },

        loadBatch(batch, detailsFromApi = null, rawPayload = null) {
            if (!batch) return;
            this.isEditing = true;

            // 1. Resolve Batch ID: ensure it is never emptyGuid
            const validBatchId = (batch.id && batch.id !== this.emptyGuid)
                ? batch.id
                : (batch.Id && batch.Id !== this.emptyGuid ? batch.Id : (this.entryForm.id && this.entryForm.id !== this.emptyGuid ? this.entryForm.id : null));

            // 2. Proposed Journal Header and Detail IDs
            const journalHeader = rawPayload?.proposedJournalHeader || rawPayload?.ProposedJournalHeader || batch.proposedJournalHeader || batch.ProposedJournalHeader;
            const journalDetails = rawPayload?.proposedJournalDetails || rawPayload?.ProposedJournalDetails || batch.proposedJournalDetails || batch.ProposedJournalDetails;
            const pj = batch.proposedJournalEntries || batch.ProposedJournalEntries || batch.proposedJournalEntry || batch.ProposedJournalEntry;

            if (batch.proposedJournalHeaderId && batch.proposedJournalHeaderId !== this.emptyGuid) {
                this.proposedJournalHeaderId = batch.proposedJournalHeaderId;
            } else if (journalHeader && journalHeader.id && journalHeader.id !== this.emptyGuid) {
                this.proposedJournalHeaderId = journalHeader.id;
            } else if (pj && pj.id && pj.id !== this.emptyGuid) {
                this.proposedJournalHeaderId = pj.id;
            } else {
                this.proposedJournalHeaderId = '';
            }

            if (batch.proposedJournalDetailIdList && Array.isArray(batch.proposedJournalDetailIdList) && batch.proposedJournalDetailIdList.length > 0) {
                this.proposedJournalDetailIdList = batch.proposedJournalDetailIdList;
            } else if (Array.isArray(journalDetails) && journalDetails.length > 0) {
                this.proposedJournalDetailIdList = journalDetails.map(d => d.id || d.Id).filter(Boolean);
            } else if (pj && Array.isArray(pj.detailIds) && pj.detailIds.length > 0) {
                this.proposedJournalDetailIdList = pj.detailIds;
            } else {
                this.proposedJournalDetailIdList = [];
            }

            const rawDate = batch.batchDate || batch.BatchDate;
            const batchDateFormatted = rawDate ? String(rawDate).split('T')[0] : new Date().toISOString().split('T')[0];

            // Resolve lines/details
            const details = (Array.isArray(detailsFromApi) && detailsFromApi.length > 0)
                ? detailsFromApi
                : (batch.details || batch.Details || batch.pettyTransactionDetails || batch.PettyTransactionDetails || []);

            this.entryForm = {
                id: validBatchId,
                batchDate: batchDateFormatted,
                batchNo: batch.batchNo || batch.BatchNo || '',
                sourceDocNo: batch.sourceDocNo || batch.SourceDocNo || '',
                pettyCashAccountId: (batch.pettyCashAccountId && batch.pettyCashAccountId !== this.emptyGuid)
                    ? batch.pettyCashAccountId
                    : (batch.PettyCashAccountId && batch.PettyCashAccountId !== this.emptyGuid ? batch.PettyCashAccountId : ''),
                pettyCashAccountName: batch.pettyCashAccountName || batch.PettyCashAccountName || '',
                batchOriginator: batch.batchOriginator || batch.BatchOriginator || this.currentUser || 'Administrator',
                currencyId: (batch.currencyId && batch.currencyId !== this.emptyGuid)
                    ? batch.currencyId
                    : (batch.CurrencyId && batch.CurrencyId !== this.emptyGuid ? batch.CurrencyId : ''),
                currencyName: batch.currencyName || batch.CurrencyName || 'Ghana Cedi',
                currencyCode: batch.currencyCode || batch.CurrencyCode || 'GHS',
                currencyRate: Number(batch.currencyRate != null ? batch.currencyRate : batch.CurrencyRate) || 1.0000,
                totalAmount: Number(batch.totalAmount != null ? batch.totalAmount : batch.TotalAmount) || 0,
                isPosted: Boolean(batch.isPosted != null ? batch.isPosted : batch.IsPosted),
                lines: (Array.isArray(details) && details.length > 0)
                    ? details.map(d => ({
                        uid: 'line_' + Math.random().toString(36).substring(2, 9),
                        id: (d.id && d.id !== this.emptyGuid) ? d.id : (d.Id && d.Id !== this.emptyGuid ? d.Id : null),
                        transactionDate: (d.transactionDate || d.TransactionDate) ? String(d.transactionDate || d.TransactionDate).split('T')[0] : batchDateFormatted,
                        refNo: d.refNo || d.RefNo || d.referenceNo || d.referenceNumber || '',
                        expenseAccountId: (d.expenseAccountId && d.expenseAccountId !== this.emptyGuid)
                            ? d.expenseAccountId
                            : (d.ExpenseAccountId && d.ExpenseAccountId !== this.emptyGuid ? d.ExpenseAccountId : (d.accountId || d.AccountId || '')),
                        expenseAccountName: d.expenseAccountName || d.ExpenseAccountName || d.accountName || d.AccountName || '',
                        description: d.description || d.Description || '',
                        amount: Number(d.amount != null ? d.amount : (d.Amount != null ? d.Amount : (d.debitAmount || d.DebitAmount || 0))) || 0,
                        ouId: (d.ouId && d.ouId !== this.emptyGuid) ? d.ouId : (d.OuId && d.OuId !== this.emptyGuid ? d.OuId : ''),
                        ouName: d.ouName || d.OuName || '',
                        recipientId: (d.recipientId && d.recipientId !== this.emptyGuid) ? d.recipientId : (d.RecipientId && d.RecipientId !== this.emptyGuid ? d.RecipientId : ''),
                        recipientName: d.recipientName || d.RecipientName || ''
                    }))
                    : [this.createEmptyLine({ transactionDate: batchDateFormatted })]
            };

            this.hydrateLineNames();

            if (window.history.pushState && validBatchId) {
                window.history.pushState({}, '', `/GeneralLedger/CreatePettyCash?id=${encodeURIComponent(validBatchId)}`);
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        async loadBatchById(id) {
            if (!id || id === this.emptyGuid) return;
            this.isFetching = true;
            try {
                let resp;
                try {
                    resp = await axios.get(`/GeneralLedger/GetPettyCashTransactionDetails?id=${encodeURIComponent(id)}`);
                } catch (_) {
                    resp = await axios.get(`/GeneralLedger/GetPettyTransactionDetails?id=${encodeURIComponent(id)}`);
                }

                const raw = resp.data?.result || resp.data?.Result || resp.data;

                if (raw) {
                    const txInfo = raw.transactionInfo || raw.TransactionInfo;
                    const journalHeader = raw.proposedJournalHeader || raw.ProposedJournalHeader;
                    const journalDetails = raw.proposedJournalDetails || raw.ProposedJournalDetails;

                    // The primary batch object is either txInfo or raw itself
                    const batch = txInfo ? { ...txInfo } : { ...raw };

                    // Guarantee valid batch id
                    const validBatchId = (batch.id && batch.id !== this.emptyGuid)
                        ? batch.id
                        : ((raw.id && raw.id !== this.emptyGuid) ? raw.id : id);
                    batch.id = validBatchId;

                    // Proposed Journal Header and Detail IDs
                    if (journalHeader && journalHeader.id && journalHeader.id !== this.emptyGuid) {
                        batch.proposedJournalHeaderId = journalHeader.id;
                    }
                    if (Array.isArray(journalDetails) && journalDetails.length > 0) {
                        batch.proposedJournalDetailIdList = journalDetails.map(d => d.id || d.Id).filter(Boolean);
                    }

                    // Lines details
                    const details = (txInfo && Array.isArray(txInfo.details) && txInfo.details.length > 0)
                        ? txInfo.details
                        : (Array.isArray(batch.details) && batch.details.length > 0 ? batch.details : null);

                    this.loadBatch(batch, details, raw);
                    return;
                }

                // Fallback to listings endpoint if GetPettyTransactionDetails returned no data
                await this.loadBatchFromList(id);
            } catch (err) {
                console.error('Error fetching petty transaction details, attempting fallback:', err);
                await this.loadBatchFromList(id);
            } finally {
                this.isFetching = false;
            }
        },

        async loadBatchWithSeparateDetails(id, detailsArray) {
            try {
                let resp;
                try {
                    resp = await axios.post('/GeneralLedger/GetPettyCashTransactions', {
                        pageNo: 1,
                        pageSize: 5000
                    });
                } catch (_) {
                    resp = await axios.get('/GeneralLedger/GetPettyCashTransactions?pageNo=1&pageSize=5000');
                }
                const raw = resp.data?.result || resp.data?.Result || resp.data;
                const list = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
                const match = list.find(b => String(b.id || b.Id).toLowerCase() === String(id).toLowerCase());
                if (match) {
                    this.loadBatch(match, detailsArray);
                } else {
                    this.loadBatch({ id: id, details: detailsArray }, detailsArray);
                }
            } catch (err) {
                console.warn('Error fetching header for separate details:', err);
                this.loadBatch({ id: id, details: detailsArray }, detailsArray);
            }
        },

        async loadBatchFromList(id) {
            try {
                let resp;
                try {
                    resp = await axios.post('/GeneralLedger/GetPettyCashTransactions', {
                        pageNo: 1,
                        pageSize: 5000
                    });
                } catch (_) {
                    resp = await axios.get('/GeneralLedger/GetPettyCashTransactions?pageNo=1&pageSize=5000');
                }
                const raw = resp.data?.result || resp.data?.Result || resp.data;
                const list = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
                
                const match = list.find(b => String(b.id || b.Id).toLowerCase() === String(id).toLowerCase());
                if (match) {
                    this.loadBatch(match);
                } else {
                    this.toast('warning', 'Petty cash batch could not be found.');
                }
            } catch (err) {
                console.error('Error loading petty cash batch from list:', err);
                this.toast('error', 'Unable to load batch details.');
            }
        },

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

            this.isLoading = true;
            try {
                await axios.delete(`/GeneralLedger/DeletePettyCash?id=${id}`);
                this.toast('success', 'Petty cash batch deleted successfully.');
                this.goToListing();
            } catch (err) {
                console.error('Error deleting petty cash batch:', err);
                this.toast('error', 'Unable to delete petty cash batch.');
            } finally {
                this.isLoading = false;
            }
        },

        validateEntryForm() {
            if (!this.entryForm.batchDate) {
                this.toast('warning', 'Batch Date is required.');
                return false;
            }
            if (!this.entryForm.batchNo || !this.entryForm.batchNo.trim()) {
                this.toast('warning', 'Batch Number is required.');
                return false;
            }
            if (!this.entryForm.pettyCashAccountId) {
                this.toast('warning', 'Petty Cash G/L Account is required.');
                return false;
            }
            if (!this.entryForm.batchOriginator) {
                this.entryForm.batchOriginator = this.currentUser || 'Administrator';
            }
            if (!this.entryForm.lines || !this.entryForm.lines.length) {
                this.toast('warning', 'Please add at least one transaction line item.');
                return false;
            }

            for (let i = 0; i < this.entryForm.lines.length; i++) {
                const line = this.entryForm.lines[i];
                const rowNum = i + 1;
                if (!line.expenseAccountId) {
                    this.toast('warning', `Row #${rowNum}: Please select an Expense G/L Account.`);
                    return false;
                }
                if (!line.description || !line.description.trim()) {
                    this.toast('warning', `Row #${rowNum}: Description is required.`);
                    return false;
                }
                const amt = Number(line.amount);
                if (isNaN(amt) || amt <= 0) {
                    this.toast('warning', `Row #${rowNum}: Amount must be greater than zero.`);
                    return false;
                }
            }

            return true;
        },

        rebuildJournalEntryList() {
            const currencyInfo = this.currencyList.find(x => String(x.id).toLowerCase() === String(this.entryForm.currencyId).toLowerCase());
            const pettyCashAccountInfo = this.accountsList.find(x => String(x.id).toLowerCase() === String(this.entryForm.pettyCashAccountId).toLowerCase());
            const firstOuId = (this.entryForm.lines && this.entryForm.lines.find(x => x.ouId && x.ouId !== this.emptyGuid)?.ouId) || this.emptyGuid;
            const firstRef = (this.entryForm.lines && this.entryForm.lines.length) ? (this.entryForm.lines[0].refNo || this.entryForm.batchNo) : this.entryForm.batchNo;

            const commonFields = (accountId, accountInfo, ouId, recipientId) => {
                const targetOuId = (ouId && ouId !== this.emptyGuid) ? ouId : firstOuId;
                const ouInfo = this.costCenterList.find(x => String(x.id).toLowerCase() === String(targetOuId).toLowerCase());
                return {
                    id: this.uuid(),
                    accountId: accountId || this.emptyGuid,
                    accountName: accountInfo ? (accountInfo.accountIdentifier || accountInfo.accountName) : '',
                    ouId: targetOuId || this.emptyGuid,
                    ouName: ouInfo ? ouInfo.name : '',
                    transactionDate: this.entryForm.batchDate,
                    transactionSource: 'GL',
                    currencyId: this.entryForm.currencyId || this.emptyGuid,
                    currencyName: currencyInfo ? (currencyInfo.currencyName || currencyInfo.name) : (this.entryForm.currencyName || ''),
                    currencyCode: currencyInfo ? (currencyInfo.currencyCode || currencyInfo.code) : (this.entryForm.currencyCode || 'GHS'),
                    buyRate: currencyInfo ? (currencyInfo.buyRate || currencyInfo.rate || 1) : (this.entryForm.currencyRate || 1),
                    sellRate: currencyInfo ? (currencyInfo.sellRate || currencyInfo.rate || 1) : (this.entryForm.currencyRate || 1),
                    pettyCashReceipientId: recipientId || this.emptyGuid,
                    chequeNo: '--',
                    referenceNumber: this.entryForm.batchNo || '',
                };
            };

            const lines = [];

            // Debit lines (Expense accounts)
            (this.entryForm.lines || []).forEach(v => {
                const debitAccountInfo = this.accountsList.find(x => String(x.id).toLowerCase() === String(v.expenseAccountId).toLowerCase());
                const debitAmount = parseFloat(v.amount || 0);
                const rowOuInfo = this.costCenterList.find(x => String(x.id).toLowerCase() === String(v.ouId).toLowerCase());
                lines.push({
                    ...commonFields(v.expenseAccountId, debitAccountInfo, v.ouId, v.recipientId),
                    ouName: rowOuInfo ? rowOuInfo.name : (v.ouName || ''),
                    invoiceNo: '',
                    referenceNumber: v.refNo || this.entryForm.batchNo || '',
                    description: `Petty Cash (#${this.entryForm.batchNo}) - ${v.description || ''}`.trim(),
                    debitAmount,
                    creditAmount: 0
                });
            });

            // Credit line (Petty cash / cash on hand account)
            const netAmount = parseFloat(this.totalLineAmount || 0);
            if (netAmount !== 0) {
                lines.push({
                    ...commonFields(this.entryForm.pettyCashAccountId, pettyCashAccountInfo, firstOuId, this.emptyGuid),
                    invoiceNo: '',
                    referenceNumber: this.entryForm.batchNo || firstRef,
                    description: `Petty Cash (#${this.entryForm.batchNo}) Disbursement`,
                    debitAmount: 0,
                    creditAmount: netAmount
                });
            }

            this.journalEntryList = lines;
        },

        async saveJournal(batchId) {
            this.rebuildJournalEntryList();
            const totalAmt = parseFloat(this.totalLineAmount || 0);
            const journalHeaderId = (this.proposedJournalHeaderId && this.proposedJournalHeaderId !== this.emptyGuid)
                ? this.proposedJournalHeaderId
                : this.emptyGuid;
            const payload = {
                batchNumber: this.entryForm.batchNo,
                batchDate: this.entryForm.batchDate,
                batchDescription: `Petty Cash Batch #${this.entryForm.batchNo}`,
                isTemporary: true,
                totalCredit: totalAmt,
                totalDebit: totalAmt,
                id: this.emptyGuid,
                transactionSource: "GL",
                journalDetails: this.journalEntryList
            };

            try {
                await axios.post('/GeneralLedger/SaveJournal', payload);
                this.journalEntryList = [];
            } catch (err) {
                console.error('Failed to create proposed journal:', err);
                this.toast('error', 'Unable to create journal.');
            }
        },

        async savePettyCashBatch() {
            if (!this.validateEntryForm() || this.isLoading) return;

            this.isLoading = true;
            try {
                // Prepare line items
                const details = this.entryForm.lines.map(line => {
                    const item = {
                        transactionDate: line.transactionDate || this.entryForm.batchDate,
                        refNo: (line.refNo || '').trim(),
                        expenseAccountId: line.expenseAccountId,
                        expenseAccountName: line.expenseAccountName || '',
                        description: (line.description || '').trim(),
                        amount: Number(line.amount) || 0,
                        ouId: (line.ouId && line.ouId !== this.emptyGuid) ? line.ouId : null,
                        ouName: line.ouName || '',
                        recipientId: (line.recipientId && line.recipientId !== this.emptyGuid) ? line.recipientId : null,
                        recipientName: line.recipientName || ''
                    };
                    if (line.id && line.id !== this.emptyGuid) {
                        item.id = line.id;
                    }
                    return item;
                });

                const proposedJournalEntriesObj = {
                    id: (this.proposedJournalHeaderId && this.proposedJournalHeaderId !== this.emptyGuid) ? this.proposedJournalHeaderId : this.uuid(),
                    detailIds: this.proposedJournalDetailIdList || [],
                    isBalanced: Boolean(this.proposedJournalTotals.isBalanced),
                    totalDebit: parseFloat(this.proposedJournalTotals.debit || 0),
                    totalCredit: parseFloat(this.proposedJournalTotals.credit || 0),
                    lines: this.proposedJournalEntries.map(l => ({
                        accountId: (l.accountId && l.accountId !== this.emptyGuid) ? l.accountId : this.emptyGuid,
                        accountDisplay: l.accountDisplay || '',
                        description: l.description || '',
                        debitAmount: parseFloat(l.debitAmount || 0),
                        creditAmount: parseFloat(l.creditAmount || 0),
                        ouId: (l.ouId && l.ouId !== this.emptyGuid) ? l.ouId : this.emptyGuid,
                        ouName: l.ouName || '',
                        referenceNumber: l.referenceNumber || '',
                        chequeNo: l.chequeNo || '',
                    }))
                };

                const validBatchId = (this.entryForm.id && this.entryForm.id !== this.emptyGuid) ? this.entryForm.id : null;

                const payload = {
                    id: validBatchId || (this.isEditing ? validBatchId : undefined),
                    batchDate: this.entryForm.batchDate,
                    batchNo: this.entryForm.batchNo.trim(),
                    sourceDocNo: (this.entryForm.sourceDocNo || '').trim(),
                    pettyCashAccountId: this.entryForm.pettyCashAccountId,
                    pettyCashAccountName: this.entryForm.pettyCashAccountName || '',
                    batchOriginator: this.entryForm.batchOriginator.trim(),
                    currencyId: this.entryForm.currencyId,
                    currencyName: this.entryForm.currencyName,
                    currencyCode: this.entryForm.currencyCode,
                    currencyRate: Number(this.entryForm.currencyRate) || 1.0000,
                    totalAmount: this.totalLineAmount,
                    isPosted: Boolean(this.entryForm.isPosted),
                    details: details,
                    proposedJournalEntries: proposedJournalEntriesObj
                };

                let resp = null;
                let createdId = validBatchId;
                if (this.isEditing && validBatchId) {
                    resp = await axios.post('/GeneralLedger/UpdatePettyCash', payload);
                    this.toast('success', 'Petty cash batch updated successfully.');
                } else {
                    resp = await axios.post('/GeneralLedger/CreatePettyCash', payload);
                    createdId = resp.data?.id || resp.data?.result?.id || (typeof resp.data?.result === 'string' ? resp.data.result : null);
                    if (createdId && createdId !== this.emptyGuid) {
                        this.entryForm.id = createdId;
                    }
                    this.toast('success', 'Petty cash batch saved successfully.');
                }

                // Create / save the proposed journal entry
                await this.saveJournal(createdId);

                setTimeout(() => {
                    this.goToListing();
                }, 1200);
            } catch (err) {
                console.error('Error saving petty cash batch:', err);
                const errMsg = err?.response?.data?.message || err?.message || 'Unable to save petty cash batch.';
                this.toast('error', errMsg);
            } finally {
                this.isLoading = false;
            }
        },

        revertEntryForm() {
            if (this.isEditing && this.entryForm.id) {
                this.loadBatchById(this.entryForm.id);
            } else {
                this.newBatch();
            }
        },

        printVoucherModal() {
            if (!this.entryForm.lines.length) {
                this.toast('warning', 'No lines to preview.');
                return;
            }
            this.showPrintModal = true;
        },

        printNow() {
            window.print();
        },

        async initEntryData() {
            this.isShimmerLoading = true;
            try {
                const resp = await axios.get('/GeneralLedger/InitPettyCashEntry');
                const data = resp.data || {};

                if (data.currentUser) {
                    this.currentUser = data.currentUser;
                    if (!this.entryForm.batchOriginator) {
                        this.entryForm.batchOriginator = data.currentUser;
                    }
                }

                if (data.pettyCashSystemNumber) {
                    this.currentSystemNumber = data.pettyCashSystemNumber;
                } else if (data.systemNumbers && Array.isArray(data.systemNumbers)) {
                    this.currentSystemNumber = data.systemNumbers.find(s => s.key && s.key.toLowerCase().includes('petty-cash-id'));
                }

                if (data.accounts && Array.isArray(data.accounts)) {
                    this.accountsList = data.accounts.map(a => ({
                        id: a.id,
                        accountNo: a.accountNo || a.accountNumber || '',
                        accountName: a.accountName || a.name || '',
                        accountIdentifier: a.accountIdentifier || `${a.accountNo || a.accountNumber || ''} - ${a.accountName || a.name || ''}`,
                        accountHeadName: a.accountHeadName || a.category || ''
                    })).sort((a, b) => String(a.accountNo ?? '').localeCompare(String(b.accountNo ?? '')));

                    // Identify Expense Accounts (starts with 5 or AccountHead is Expense)
                    this.expenseAccountsList = this.accountsList.filter(a =>
                        String(a.accountNo).startsWith('5') ||
                        (a.accountHeadName && a.accountHeadName.toLowerCase().includes('expense'))
                    );

                    // Identify Petty Cash Accounts (Cash & Bank, Petty Cash, or 12xxx)
                    this.pettyCashAccounts = this.accountsList.filter(a =>
                        (a.accountName && a.accountName.toLowerCase().includes('petty cash')) ||
                        (a.accountName && a.accountName.toLowerCase().includes('cash')) ||
                        String(a.accountNo).startsWith('12') ||
                        String(a.accountNo).startsWith('10')
                    );
                }

                if (data.costCenters && Array.isArray(data.costCenters)) {
                    this.costCenterList = data.costCenters;
                } else if (data.departments && Array.isArray(data.departments)) {
                    this.costCenterList = data.departments;
                }

                if (data.recipients && Array.isArray(data.recipients)) {
                    this.recipientList = data.recipients;
                }

                if (data.currencies && Array.isArray(data.currencies)) {
                    this.currencyList = data.currencies;
                }

                if (data.defaultGlNumbers) {
                    this.defaultGlSetup = data.defaultGlNumbers;
                }
            } catch (err) {
                console.warn('Error during InitPettyCashEntry, falling back to separate calls:', err);
                await Promise.allSettled([
                    this.getAccounts(),
                    this.getCostCenters(),
                    this.getRecipients(),
                    this.getCurrencies()
                ]);
            }
        },

        async getAccounts() {
            try {
                const resp = await axios.get('/GeneralLedger/GetAccountDetails?pageNo=1&pageSize=5555&isActive=true');
                const raw = resp.data.result;
                const list =  raw ;
                this.accountsList = list.map(a => ({
                    id: a.id,
                    accountNo: a.accountNo || a.accountNumber || '',
                    accountName: a.accountName || a.name || '',
                    accountIdentifier: a.accountIdentifier || `${a.accountNo || a.accountNumber || ''} - ${a.accountName || a.name || ''}`,
                    accountHeadName: a.accountHeadName || a.category || ''
                })).sort((a, b) => String(a.accountNo ?? '').localeCompare(String(b.accountNo ?? '')));

                this.expenseAccountsList = this.accountsList.filter(a =>
                    String(a.accountNo).startsWith('5') ||
                    (a.accountHeadName && a.accountHeadName.toLowerCase().includes('expense'))
                );

                this.pettyCashAccounts = this.accountsList.filter(a =>
                    (a.accountName && a.accountName.toLowerCase().includes('petty cash')) ||
                    (a.accountName && a.accountName.toLowerCase().includes('cash')) ||
                    String(a.accountNo).startsWith('12')
                );
            } catch (err) {
                console.warn('Fallback accounts fetch failed:', err);
            }
        },

        async getCostCenters() {
            try {
                const resp = await axios.get('/SharedResource/GetCostCenters?pageNo=1&pageSize=2000');
                const raw = resp.data.result;
                this.costCenterList =  raw;
            } catch (err) {
                console.warn('Fallback cost centers fetch failed:', err);
            }
        },

        async getRecipients() {
            try {
                const resp = await axios.get('/GeneralLedger/GetPettyCashRecipients?pageNo=1&pageSize=1000');
                const raw = resp.data.result;
                this.recipientList =  raw ;
            } catch (err) {
                console.warn('Fallback recipients fetch failed:', err);
            }
        },

        async getCurrencies() {
            try {
                const resp = await axios.get('/SharedResource/GetCurrencies');
                const raw = resp.data?.result || resp.data;
                this.currencyList = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
            } catch (err) {
                console.warn('Fallback currencies fetch failed:', err);
            }
        },

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
            } else if (typeof toastr !== 'undefined') {
                toastr[type] ? toastr[type](message) : toastr.info(message);
            } else {
                alert(message);
            }
        }
    },

    async mounted() {
        const urlParams = new URLSearchParams(window.location.search);
        const queryId = urlParams.get('id');
        const container = document.getElementById('app');
        const datasetId = container?.dataset?.pettyCashId;
        const rawTargetId = queryId || datasetId;
        const targetId = (rawTargetId && rawTargetId !== this.emptyGuid && rawTargetId.trim() !== '') ? rawTargetId.trim() : null;

        if (targetId) {
            this.isEditing = true;
            this.entryForm.id = targetId;
        }

        this.isShimmerLoading = true;
        try {
            await this.initEntryData();

            if (targetId) {
                await this.loadBatchById(targetId);
            } else {
                this.newBatch();
            }
        } catch (err) {
            console.error('Initialization error in Petty Cash entry page:', err);
        } finally {
            this.isShimmerLoading = false;
        }
    }
});

app.use(DataGridPlugin);
app.mount('#app');
