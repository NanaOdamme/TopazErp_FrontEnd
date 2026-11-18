const { createApp, ref, computed, watch, onMounted, reactive } = Vue;

createApp({
    setup() {
        // ── State ────────────────────────────────────────────────────
        const isLoading = ref(false);
        const showSaveMenu = ref(false);
        const emptyGuid = '00000000-0000-0000-0000-000000000000';

        const customerId      = ref('');
        const voucherEntryDate = ref(moment().format('YYYY-MM-DD'));
        const paymentDate     = ref(moment().format('YYYY-MM-DD'));
        const bankAccountId   = ref('');
        const currencyId      = ref('');
        const currencyRate    = ref(null);
        const isMultiCurrency = ref(false);
        const modePayment     = ref('Cash');
        const batchNo         = ref('');
        const chequeNo        = ref('');
        const bankId          = ref('');

        const voucherId       = ref('');
        const isEditMode      = ref(false);
        const isRecordCreated = ref(false);
        const proposedJournalHeaderId   = ref('');
        const proposedJournalDetailIdList = ref([]);

        const customerList   = ref([]);
        const accountsList   = ref([]);
        const bankList       = ref([]);
        const currencyList   = ref([]);
        const costCenterHierachyList = ref([]);
        const costCenterList = ref([]);
        const costCenterNameList = ref([]);
        const voucherList    = ref([]);
        const journalEntryList = ref([]);

        const totalCredit    = ref(0);
        const totalDebit     = ref(0);
        const totalNetAmount = ref(0);

        const withHoldingVatPercentage = ref(7);

        const errors = reactive({
            customerId: false,
            voucherEntryDate: false,
            bankAccountId: false,
            currencyId: false,
        });

        // ── Computed ──────────────────────────────────────────────────
        const saveButtonText = computed(() => {
            if (isEditMode.value) return 'Update';
            return isRecordCreated.value ? 'Create New' : 'Save';
        });

        const currencyCode = computed(() => {
            const c = currencyList.value.find(x => x.id === currencyId.value);
            return c?.currencyCode || 'GHS';
        });

        const currencySymbol = computed(() => {
            const code = currencyCode.value;
            if (!code || code === 'GHS') return 'GH¢';
            if (code === 'USD') return '$';
            if (code === 'EUR') return '€';
            if (code === 'GBP') return '£';
            return code + ' ';
        });

        // ── Helpers ───────────────────────────────────────────────────
        function uuid() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        }

        function roundNumber(n) { return Math.round(n * 100) / 100; }

        function fmtNum(n) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);
        }

        function formatAccountDisplay(account) {
            if (!account) return '--';
            if (account.accountNo && account.accountName) {
                return `${account.accountNo} — ${account.accountName}`;
            }
            if (account.accountIdentifier) {
                return account.accountIdentifier.replace(' - ', ' — ');
            }
            return account.accountName || '--';
        }

        function toastHandler(type, message = 'An unexpected error occurred.') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                title: message,
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true,
            });
        }

        function parseCostCenterHierachy(dataArr) {
            costCenterList.value = dataArr;
            const list = [];
            for (let i = 0; i < dataArr.length; i++) {
                costCenterNameList.value = [];
                getHierachyName(dataArr[i].id);
                const name = [...new Set(costCenterNameList.value)].join().replace(/,/g, '/');
                list.push({ name, parentId: dataArr[i].parentId, id: dataArr[i].id, rawName: dataArr[i].name, tenantId: dataArr[i].tenantId });
            }
            return list;
        }

        function getHierachyName(id) {
            let parentId, returnName;
            costCenterList.value.forEach(item => {
                if (item.id === id) { parentId = item.parentId; returnName = item.name; }
                costCenterList.value.forEach(cc => { if (cc.id === parentId) getHierachyName(parentId); });
            });
            costCenterNameList.value.push(returnName);
        }

        // ── Calculation ───────────────────────────────────────────────
        function computeTotal() {
            totalDebit.value = voucherList.value.reduce(
                (sum, v) => sum + (parseFloat(v.localDebitAmount) || 0), 0
            );
            totalCredit.value = totalDebit.value;
            totalNetAmount.value = totalDebit.value;

            totalDebit.value = roundNumber(totalDebit.value);
            totalCredit.value = roundNumber(totalCredit.value);
            totalNetAmount.value = roundNumber(totalNetAmount.value);
        }

        function onForeignAmountChange(row) {
            if (isMultiCurrency.value && currencyRate.value && currencyRate.value > 0) {
                row.localDebitAmount = roundNumber((parseFloat(row.foreignDebitAmount) || 0) * parseFloat(currencyRate.value));
                computeTotal();
            }
        }

        // ── Row management ────────────────────────────────────────────
        function addVoucherRow() {
            voucherList.value.push({
                id: uuid(),
                withHold: false,
                invoiceNo: '',
                referenceNo: '',
                accountId: '',
                description: '',
                localDebitAmount: 0,
                foreignDebitAmount: 0,
                ouId: '',
            });
        }

        function removeVoucherRow(idx) {
            voucherList.value.splice(idx, 1);
            computeTotal();
        }

        // ── API calls ─────────────────────────────────────────────────
        async function initReceiptVoucher() {
            try {
                let res;
                try {
                    res = await axios.get('/GeneralLedger/InitSupplierPvEntry');
                } catch {
                    res = await axios.get('/LedgerDataEntry/InitSupplierPvEntry');
                }
                const data = res.data?.result || res.data;
                const rawAccounts = data.accounts?.data || data.accounts || [];
                rawAccounts.forEach(v => { v.accountIdentifier = `${v.accountNo} - ${v.accountName}`; });
                accountsList.value = rawAccounts;
                const rawCostCenters = data.costCenters?.data || data.costCenters || [];
                costCenterHierachyList.value = parseCostCenterHierachy(rawCostCenters);

                if (data.voucherBatchSystemNumber && !batchNo.value) {
                    const sn = data.voucherBatchSystemNumber;
                    batchNo.value = `${sn.prefix || ''}${sn.lastNo || ''}${sn.suffix || ''}`;
                }

                const defaultBankId = data.defaultGlNumbers ? (data.defaultGlNumbers.accountsReceivableBankAccountId || data.defaultGlNumbers.accountReceivableBankAccountId) : '';
                if (defaultBankId && !bankAccountId.value) {
                    bankAccountId.value = defaultBankId;
                    const accountInfo = accountsList.value.find(a => a.id === defaultBankId);
                    if (accountInfo && accountInfo.currencyId) currencyId.value = accountInfo.currencyId;
                }
            } catch (err) {
                console.error('Init receipt voucher error:', err);
                toastHandler('error', 'Voucher initialization failed.');
            }
        }

        async function getCustomers() {
            try {
                const res = await axios.get('/SharedResource/GetCustomers?pageNo=1&pageSize=500');
                const raw = res.data?.result?.items
                    || res.data?.result?.data
                    || res.data?.result
                    || res.data?.data
                    || (Array.isArray(res.data) ? res.data : []);
                customerList.value = raw;
            } catch {
                try {
                    const res2 = await axios.get('/SharedResource/GetCustomers');
                    customerList.value = res2.data?.result || res2.data || [];
                } catch {
                    toastHandler('error', 'Unable to retrieve customers.');
                }
            }
        }

        async function getBanks() {
            try {
                const res = await axios.get('/SharedResource/GetBanks?pageNo=1&pageSize=1000');
                const raw = res.data?.result?.data
                    || res.data?.result
                    || res.data?.data
                    || (Array.isArray(res.data) ? res.data : []);
                bankList.value = raw;
            } catch {
                try {
                    const res2 = await axios.get('/SharedResource/GetBanks');
                    bankList.value = res2.data?.result || res2.data || [];
                } catch {
                    toastHandler('error', 'Unable to retrieve banks.');
                }
            }
        }

        async function getCurrencies() {
            try {
                const res = await axios.get('/SharedResource/GetCurrencies?pageNo=1&pageSize=100');
                const raw = res.data?.result?.data
                    || res.data?.result
                    || res.data?.data
                    || (Array.isArray(res.data) ? res.data : []);
                currencyList.value = raw;
            } catch {
                try {
                    const res2 = await axios.get('/SharedResource/GetCurrencys');
                    currencyList.value = res2.data?.result || res2.data || [];
                } catch {
                    toastHandler('error', 'Unable to retrieve currencies.');
                }
            }
        }

        async function loadVoucherDetails() {
            try {
                let res;
                try {
                    res = await axios.get('/GeneralLedger/GetVoucherDetails?id=' + voucherId.value);
                } catch {
                    res = await axios.get('/LedgerDataEntry/GetVoucherDetails?id=' + voucherId.value);
                }

                // Decompose the revised Voucher model (result or direct object)
                const v = res.data?.result || res.data?.voucherInfo || res.data;
                if (!v) return;

                // ── 1. Root Voucher Header Fields ─────────────────────────────
                if (v.id && v.id !== emptyGuid) voucherId.value = v.id;
                if (v.customerId && v.customerId !== emptyGuid) customerId.value = v.customerId;
                bankAccountId.value = v.bankAccountId || '';
                currencyId.value = v.currencyId || '';
                currencyRate.value = v.currencyRate != null ? v.currencyRate : null;
                isMultiCurrency.value = Boolean(v.isMultiCurrency);
                bankId.value = (v.bankId && v.bankId !== emptyGuid) ? v.bankId : '';
                modePayment.value = v.modePayment || v.modeOfPayment || 'Cash';
                voucherEntryDate.value = v.voucherEntryDate ? moment(v.voucherEntryDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
                paymentDate.value = v.paymentDate ? moment(v.paymentDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
                batchNo.value = v.batchNo || '';
                chequeNo.value = v.chequeNo || '';

                // ── 2. Details (Transaction Lines) ───────────────────────────
                const lineItems = v.details || v.lines || [];
                voucherList.value = lineItems.map(d => ({
                    id: d.id || uuid(),
                    withHold: false,
                    invoiceNo: d.invoiceNo || '',
                    referenceNo: d.referenceNo || '',
                    accountId: d.accountId ? String(d.accountId).toLowerCase() : (d.debitAccountId ? String(d.debitAccountId).toLowerCase() : ''),
                    debitAccountName: d.debitAccountName || '',
                    description: d.description || '',
                    localDebitAmount: parseFloat(d.localDebitAmount != null ? d.localDebitAmount : (d.amount || d.debitAmount || 0)),
                    foreignDebitAmount: parseFloat(d.foreignDebitAmount || 0),
                    ouId: d.ouId ? String(d.ouId).toLowerCase() : emptyGuid,
                    ouName: d.ouName || '--',
                }));

                // ── 3. Proposed Journal Entry ────────────────────────────────
                const pj = v.proposedJournalEntries || v.proposedJournalEntry || res.data?.proposedJournalHeader;
                if (pj) {
                    proposedJournalHeaderId.value = pj.id || pj.headerId || '';
                    if (Array.isArray(pj.detailIds)) {
                        proposedJournalDetailIdList.value = pj.detailIds;
                    } else if (Array.isArray(res.data?.proposedJournalDetails)) {
                        proposedJournalDetailIdList.value = res.data.proposedJournalDetails.map(a => a.id);
                    }
                }

                computeTotal();
            } catch (err) {
                console.error('loadVoucherDetails error:', err);
                toastHandler('error', 'Unable to load voucher details.');
            }
        }

        // ── Journal ───────────────────────────────────────────────────
        function rebuildJournalEntryList() {
            const journalLines = [];
            const currencyInfo = currencyList.value.find(x => x.id === currencyId.value);
            const bankAccountInfo = accountsList.value.find(x => x.id === bankAccountId.value);

            const commonFields = (accId, accInfo, ouId) => {
                const ouInfo = costCenterHierachyList.value.find(x => x.id === ouId);
                return {
                    id: uuid(),
                    accountId: accId,
                    accountName: accInfo ? accInfo.accountIdentifier : '',
                    ouId: ouId || emptyGuid,
                    ouName: ouInfo ? ouInfo.name : '--',
                    transactionDate: voucherEntryDate.value,
                    transactionSource: 'gl',
                    currencyId: currencyId.value,
                    currencyName: currencyInfo ? currencyInfo.currencyName : '',
                    currencyCode: currencyInfo ? currencyInfo.currencyCode : '',
                    buyRate: currencyInfo ? currencyInfo.buyRate : '',
                    sellRate: currencyInfo ? currencyInfo.sellRate : '',
                    pettyCashReceipientId: emptyGuid,
                    chequeNo: chequeNo.value || '--',
                    referenceNumber: batchNo.value,
                };
            };

            const totalAmount = voucherList.value.reduce(
                (sum, v) => sum + (parseFloat(v.localDebitAmount || v.debitAmount || 0)), 0
            );
            const firstOuId = voucherList.value.length ? (voucherList.value[0].ouId || emptyGuid) : emptyGuid;
            const firstRef  = voucherList.value.length ? (voucherList.value[0].referenceNo || batchNo.value) : batchNo.value;
            const baseDesc  = chequeNo.value
                ? `Voucher (#${batchNo.value}) Cheque No.: ${chequeNo.value}`
                : `Voucher (#${batchNo.value})`;

            // ── Row 1: DEBIT → Bank / Cash GL (money received)
            journalLines.push({
                ...commonFields(bankAccountId.value, bankAccountInfo, firstOuId),
                invoiceNo: '',
                referenceNumber: firstRef,
                description: baseDesc,
                debitAmount: totalAmount,
                creditAmount: 0,
            });

            // ── Row 2+: CREDIT → AR / Customer GL per row
            if (voucherList.value.length === 1) {
                const arAccountId = voucherList.value[0].accountId;
                const arAccountInfo = arAccountId ? accountsList.value.find(x => x.id === arAccountId) : null;
                journalLines.push({
                    ...commonFields(arAccountId, arAccountInfo, firstOuId),
                    invoiceNo: voucherList.value[0].invoiceNo || '',
                    referenceNumber: firstRef,
                    description: voucherList.value[0].description || baseDesc,
                    debitAmount: 0,
                    creditAmount: totalAmount,
                });
            } else {
                voucherList.value.forEach(v => {
                    const rowAccId = v.accountId;
                    const rowAccInfo = rowAccId ? accountsList.value.find(x => x.id === rowAccId) : null;
                    const rowAmount = parseFloat(v.localDebitAmount || v.debitAmount || 0);
                    journalLines.push({
                        ...commonFields(rowAccId, rowAccInfo, v.ouId || firstOuId),
                        invoiceNo: v.invoiceNo || '',
                        referenceNumber: v.referenceNo || firstRef,
                        description: v.description || baseDesc,
                        debitAmount: 0,
                        creditAmount: rowAmount,
                    });
                });
            }

            journalEntryList.value = journalLines;
        }

        // ── Proposed Journal Entries (live preview) ──────────────────
        const proposedJournalEntries = computed(() => {
            const lines = [];
            const totalAmount = voucherList.value.reduce(
                (sum, v) => sum + parseFloat(v.localDebitAmount || v.debitAmount || 0), 0
            );

            const firstOuId = voucherList.value.length ? (voucherList.value[0].ouId || emptyGuid) : emptyGuid;
            const firstOuInfo = costCenterHierachyList.value.find(x => x.id === firstOuId);
            const firstOuName = firstOuInfo ? firstOuInfo.name : '--';
            const firstRef  = voucherList.value.length ? (voucherList.value[0].referenceNo || batchNo.value) : batchNo.value;

            // 1. DEBIT: Bank / Cash GL (money received in)
            const bankAccountInfo = accountsList.value.find(x => x.id === bankAccountId.value);
            if (bankAccountId.value || totalAmount > 0) {
                lines.push({
                    accountId: bankAccountId.value || emptyGuid,
                    accountDisplay: formatAccountDisplay(bankAccountInfo),
                    description: 'Cash / bank received',
                    debitAmount: totalAmount,
                    creditAmount: 0,
                    ouId: firstOuId,
                    ouName: firstOuName,
                    referenceNumber: firstRef,
                    chequeNo: chequeNo.value || '',
                });
            }

            // 2. CREDIT: AR / Customer GL lines
            if (voucherList.value.length === 1) {
                const v = voucherList.value[0];
                const arAccInfo = v.accountId ? accountsList.value.find(x => x.id === v.accountId) : null;
                const rowAmt = parseFloat(v.localDebitAmount || v.debitAmount || 0);
                const ouInfo = costCenterHierachyList.value.find(x => x.id === v.ouId);
                lines.push({
                    accountId: v.accountId || emptyGuid,
                    accountDisplay: formatAccountDisplay(arAccInfo),
                    description: v.description || 'Customer receipt',
                    debitAmount: 0,
                    creditAmount: rowAmt,
                    ouId: v.ouId || emptyGuid,
                    ouName: ouInfo ? ouInfo.name : '--',
                    referenceNumber: v.referenceNo || firstRef,
                    chequeNo: chequeNo.value || '',
                });
            } else {
                voucherList.value.forEach(v => {
                    const arAccInfo = v.accountId ? accountsList.value.find(x => x.id === v.accountId) : null;
                    const rowAmt = parseFloat(v.localDebitAmount || v.debitAmount || 0);
                    const ouInfo = costCenterHierachyList.value.find(x => x.id === v.ouId);
                    if (v.accountId || rowAmt > 0) {
                        lines.push({
                            accountId: v.accountId || emptyGuid,
                            accountDisplay: formatAccountDisplay(arAccInfo),
                            description: v.description || 'Customer receipt',
                            debitAmount: 0,
                            creditAmount: rowAmt,
                            ouId: v.ouId || emptyGuid,
                            ouName: ouInfo ? ouInfo.name : '--',
                            referenceNumber: v.referenceNo || firstRef,
                            chequeNo: chequeNo.value || '',
                        });
                    }
                });
            }

            return lines;
        });

        const proposedJournalTotals = computed(() => {
            let debit = 0;
            let credit = 0;
            proposedJournalEntries.value.forEach(row => {
                debit += parseFloat(row.debitAmount || 0);
                credit += parseFloat(row.creditAmount || 0);
            });
            debit = roundNumber(debit);
            credit = roundNumber(credit);
            const isBalanced = Math.abs(debit - credit) < 0.009;
            return { debit, credit, isBalanced };
        });

        async function saveJournal() {
            rebuildJournalEntryList();
            const totalAmount = voucherList.value.reduce(
                (sum, v) => sum + (parseFloat(v.localDebitAmount || v.debitAmount || 0)), 0
            );

            const payload = {
                batchNumber: batchNo.value,
                batchDate: voucherEntryDate.value,
                isTemporary: true,
                totalCredit: totalAmount,
                totalDebit: totalAmount,
                id: voucherId.value,
                journalDetails: journalEntryList.value,
            };

            try {
                try {
                    await axios.post('/GeneralLedger/SaveJournal', payload);
                } catch {
                    await axios.post('/LedgerDataEntry/CreateJournal', payload);
                }
                journalEntryList.value = [];
                isLoading.value = false;

                if (voucherId.value) {
                    try {
                        const res = await axios.get('/GeneralLedger/GetVoucherDetails?id=' + voucherId.value);
                        const pj = res.data?.result?.proposedJournalEntries || res.data?.proposedJournalHeader;
                        if (pj) {
                            proposedJournalHeaderId.value = pj.id;
                            proposedJournalDetailIdList.value = pj.detailIds || (res.data.proposedJournalDetails || []).map(a => a.id);
                        }
                    } catch {}
                }
            } catch {
                isLoading.value = false;
                toastHandler('error', 'Unable to create journal.');
            }
        }

        /**
         * Builds the payload matching the revised C# Voucher model in GeneralLedgerModelCollection.cs.
         * Contains root header properties and the decomposed child cards:
         *   - details:                List<GlVoucherDetail> (Transaction Lines)
         *   - withholdingSettings:    WithholdingSettings (clean/zeroed for receipt)
         *   - retentions:             List<VoucherRetentionDto> (empty list)
         *   - proposedJournalEntries: ProposedJournalEntry (Proposed Journal lines, balance, totals)
         */
        function buildVoucherPayload() {
            rebuildJournalEntryList();

            const customerInfo    = customerList.value.find(a => a.id === customerId.value);
            const bankAccountInfo = accountsList.value.find(a => a.id === bankAccountId.value);
            const bankInfo        = bankList.value.find(a => a.id === bankId.value);
            const currencyInfo    = currencyList.value.find(a => a.id === currencyId.value);

            // 1. Details (List<GlVoucherDetail>)
            const details = voucherList.value.map(v => {
                const debitAccountInfo = accountsList.value.find(a => a.id === v.accountId);
                const ouInfo = costCenterHierachyList.value.find(x => x.id === v.ouId);
                return {
                    id:                 (v.id && v.id !== emptyGuid) ? v.id : uuid(),
                    withHold:           false,
                    invoiceNo:          v.invoiceNo || '',
                    referenceNo:        v.referenceNo || '',
                    accountId:          v.accountId,
                    debitAccountName:   debitAccountInfo ? debitAccountInfo.accountIdentifier : (v.debitAccountName || ''),
                    description:        v.description || '',
                    localDebitAmount:   parseFloat(v.localDebitAmount || 0),
                    foreignDebitAmount: parseFloat(v.foreignDebitAmount || 0),
                    ouId:               v.ouId ? v.ouId : emptyGuid,
                    ouName:             ouInfo ? ouInfo.name : (v.ouName || '--'),
                    hasImprest:         false,
                };
            });

            // 2. Withholding Settings & Summary (WithholdingSettings - zeroed for Customer Receipt)
            const withholdingSettings = {
                hasWithHolding:            false,
                withHoldingRate:           0,
                taxType:                   '',
                withHoldingAccountId:      emptyGuid,
                withHoldingAccountName:    '',
                vatWithHoldingAccountId:   emptyGuid,
                vatWithHoldingAccountName: '',
                totalVatAmount:            0,
                baseAmount:                0,
                taxFlags:                  [],
                summary: {
                    grossAmount:      parseFloat(totalDebit.value || 0),
                    totalWithheld:    0,
                    totalRetained:    0,
                    totalVatWithheld: 0,
                    netAmount:        parseFloat(totalNetAmount.value || 0),
                },
            };

            // 3. Retentions (empty for Customer Receipt)
            const retentions = [];

            // 4. Proposed Journal Entry (ProposedJournalEntry)
            const proposedJournalEntriesObj = {
                id:          (proposedJournalHeaderId.value && proposedJournalHeaderId.value !== emptyGuid) ? proposedJournalHeaderId.value : uuid(),
                detailIds:   proposedJournalDetailIdList.value || [],
                isBalanced:  Boolean(proposedJournalTotals.value.isBalanced),
                totalDebit:  parseFloat(proposedJournalTotals.value.debit || 0),
                totalCredit: parseFloat(proposedJournalTotals.value.credit || 0),
                lines: proposedJournalEntries.value.map(l => ({
                    accountId:       l.accountId || emptyGuid,
                    accountDisplay:  l.accountDisplay || '',
                    description:     l.description || '',
                    debitAmount:     parseFloat(l.debitAmount || 0),
                    creditAmount:    parseFloat(l.creditAmount || 0),
                    ouId:            l.ouId || emptyGuid,
                    ouName:          l.ouName || '',
                    referenceNumber: l.referenceNumber || '',
                    chequeNo:        l.chequeNo || '',
                })),
            };

            // Root Voucher matching C# class Voucher
            return {
                id:               voucherId.value || emptyGuid,
                supplierId:       emptyGuid,
                supplierName:     '',
                employeeId:       emptyGuid,
                employeeName:     '',
                customerId:       customerId.value || emptyGuid,
                customerName:     customerInfo ? customerInfo.name : '',
                voucherType:      'customer',
                voucherEntryDate: voucherEntryDate.value,
                bankAccountId:    bankAccountId.value || emptyGuid,
                bankAccountName:  bankAccountInfo ? bankAccountInfo.accountIdentifier : '',
                bankGlAccountName: bankAccountInfo ? bankAccountInfo.accountName : '',
                bankId:           bankId.value || emptyGuid,
                bankName:         bankInfo ? bankInfo.name : '',
                currencyId:       currencyId.value,
                currencyName:     currencyInfo ? currencyInfo.currencyName : '',
                currencyCode:     currencyInfo ? currencyInfo.currencyCode : '',
                currencyRate:     currencyRate.value != null ? parseFloat(currencyRate.value) : 1,
                isMultiCurrency:  Boolean(isMultiCurrency.value),
                modePayment:      modePayment.value,
                paymentDate:      paymentDate.value || voucherEntryDate.value,
                batchNo:          batchNo.value,
                chequeNo:         modePayment.value === 'Cheque' ? chequeNo.value : '',
                isPosted:         false,
                grossAmount:      parseFloat(totalDebit.value || 0),
                netAmount:        parseFloat(totalNetAmount.value || 0),

                details,
                withholdingSettings,
                retentions,
                proposedJournalEntries: proposedJournalEntriesObj,
            };
        }

        // ── Save Voucher ──────────────────────────────────────────────
        async function saveVoucher(andPreview = false) {
            showSaveMenu.value = false;
            if (isRecordCreated.value && !andPreview) {
                createNewVoucher();
                return;
            }

            errors.customerId = !customerId.value;
            errors.voucherEntryDate = !voucherEntryDate.value;
            errors.bankAccountId = !bankAccountId.value;
            errors.currencyId = !currencyId.value;

            if (errors.customerId || errors.voucherEntryDate || errors.bankAccountId || errors.currencyId) {
                toastHandler('warning', 'Please complete all required fields.');
                return;
            }

            if (!voucherList.value.length) {
                toastHandler('warning', 'Receipt voucher has no transaction lines.');
                return;
            }

            // Verify lines have an account selected
            const missingAccount = voucherList.value.some(v => !v.accountId);
            if (missingAccount) {
                toastHandler('warning', 'Please select a Debit G/L account for all receipt lines.');
                return;
            }

            isLoading.value = true;

            const payload = buildVoucherPayload();
            const endpoint = isEditMode.value ? `/GeneralLedger/UpdateVoucher?id=${voucherId.value}` : '/GeneralLedger/CreateVoucher';

            try {
                let response;
                try {
                    response = await axios.post(endpoint, payload);
                } catch {
                    const legacyEndpoint = isEditMode.value ? `/LedgerDataEntry/UpdateVoucher?id=${voucherId.value}` : '/LedgerDataEntry/CreateVoucher';
                    response = await axios.post(legacyEndpoint, payload);
                }

                const createdId = response.data?.id || response.data?.result?.id || voucherId.value;
                if (createdId && createdId !== emptyGuid) {
                    voucherId.value = createdId;
                    isRecordCreated.value = true;
                }
                toastHandler('success', `Customer Receipt voucher ${isEditMode.value ? 'updated' : 'saved'}.`);
                await saveJournal();

                if (andPreview && createdId) {
                    window.open('/LedgerDataEntry/ReceiptVoucherPreview?id=' + createdId, '_blank');
                }

                setTimeout(() => {
                    window.location.href = '/GeneralLedger/Vouchers?tab=customer';
                }, 1000);
            } catch (err) {
                isLoading.value = false;
                console.error('Save voucher error:', err);
                toastHandler('error', `Unable to ${isEditMode.value ? 'update' : 'create'} customer receipt voucher.`);
            }
        }

        function previewVoucher() {
            window.open('/LedgerDataEntry/ReceiptVoucherPreview?id=' + voucherId.value, '_blank');
        }

        function createNewVoucher() {
            resetForm();
            isRecordCreated.value = false;
            initReceiptVoucher();
            addVoucherRow();
            toastHandler('', 'Form cleared for new voucher entry.');
        }

        function resetForm() {
            voucherId.value = '';
            customerId.value = '';
            bankId.value = '';
            currencyId.value = '';
            voucherEntryDate.value = moment().format('YYYY-MM-DD');
            paymentDate.value = moment().format('YYYY-MM-DD');
            batchNo.value = '';
            chequeNo.value = '';
            modePayment.value = 'Cash';

            totalCredit.value = 0;
            totalDebit.value = 0;
            totalNetAmount.value = 0;

            voucherList.value = [];
            journalEntryList.value = [];

            isMultiCurrency.value = false;
            currencyRate.value = null;

            errors.customerId = false;
            errors.voucherEntryDate = false;
            errors.bankAccountId = false;
            errors.currencyId = false;
        }

        function postVoucher() {
            if (!voucherId.value) {
                toastHandler('warning', 'Please save the voucher before posting.');
                return;
            }
            isLoading.value = true;
            axios.post('/LedgerDataEntry/PostVouchers', { ids: [voucherId.value] })
                .then(() => {
                    toastHandler('success', 'Voucher posted successfully.');
                    setTimeout(() => { window.location.href = '/GeneralLedger/Vouchers?tab=customer'; }, 1500);
                }).catch(() => {
                    isLoading.value = false;
                    toastHandler('error', 'Unable to post voucher.');
                });
        }

        function deleteVoucher() {
            if (!voucherId.value) {
                toastHandler('warning', 'Voucher not found.');
                return;
            }
            if (!confirm('Are you sure you want to delete this voucher?')) return;

            isLoading.value = true;
            axios.get('/LedgerDataEntry/DelVoucher?id=' + voucherId.value).then(() => {
                toastHandler('success', 'Voucher deleted successfully.');
                setTimeout(() => { window.location.href = '/GeneralLedger/Vouchers?tab=customer'; }, 1500);
            }).catch(() => {
                isLoading.value = false;
                toastHandler('error', 'Unable to delete voucher.');
            });
        }

        // ── Watchers ──────────────────────────────────────────────────
        watch(bankAccountId, val => {
            errors.bankAccountId = !val;
            const account = accountsList.value.find(a => a.id === val);
            if (account && account.currencyId) currencyId.value = account.currencyId;
        });

        watch(currencyId, val => {
            errors.currencyId = !val;
            const currency = currencyList.value.find(c => c.id === val);
            if (currency) {
                currencyRate.value = currency.buyRate ? parseFloat(currency.buyRate).toFixed(2) : null;
                isMultiCurrency.value = currency.isDefault === false;
            } else {
                currencyRate.value = null;
                isMultiCurrency.value = false;
            }
        });

        watch(customerId, val => { errors.customerId = !val; });
        watch(voucherEntryDate, val => {
            errors.voucherEntryDate = !val;
            paymentDate.value = val;
        });

        // ── Lifecycle ─────────────────────────────────────────────────
        onMounted(async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const queryId = urlParams.get('id');
            const targetId = (typeof window.voucherId !== 'undefined' && window.voucherId && window.voucherId !== '00000000-0000-0000-0000-000000000000')
                ? window.voucherId
                : (queryId && queryId !== '00000000-0000-0000-0000-000000000000' ? queryId : '');

            if (targetId) {
                voucherId.value = targetId;
                isEditMode.value = true;
            }
            if (typeof window.withHoldingVatPercentage !== 'undefined') {
                withHoldingVatPercentage.value = parseFloat(window.withHoldingVatPercentage) || 7;
            }

            await Promise.all([
                getBanks(),
                getCustomers(),
                getCurrencies(),
                initReceiptVoucher()
            ]);

            document.addEventListener('click', (e) => {
                const wrapper = document.getElementById('saveMenuWrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    showSaveMenu.value = false;
                }
            });

            if (isEditMode.value) {
                await loadVoucherDetails();
            } else {
                addVoucherRow();
            }
        });

        return {
            isLoading, showSaveMenu, customerId, voucherEntryDate, paymentDate, bankAccountId,
            currencyId, currencyRate, isMultiCurrency, modePayment, batchNo, chequeNo,
            voucherId, isEditMode, isRecordCreated,
            customerList, accountsList, currencyList, costCenterHierachyList,
            voucherList, errors,
            totalCredit, totalDebit, totalNetAmount,
            saveButtonText, currencyCode, currencySymbol, proposedJournalEntries, proposedJournalTotals,
            saveVoucher, previewVoucher, addVoucherRow, removeVoucherRow,
            computeTotal, onForeignAmountChange, postVoucher, deleteVoucher, fmtNum,
        };
    }
}).mount('#app');
