const { createApp, ref, shallowRef, computed, watch, onMounted, reactive } = Vue;

createApp({
    setup() {
        // ── State ────────────────────────────────────────────────────
        const isLoading = ref(false);
        const isShimmerLoading = ref(false);
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
        const receiptNo       = ref('');
        const chequeNo        = ref('');
        const bankId          = ref('');
        const voucherBatchSystemNumber = ref({});
        const receiptVoucherSystemNumber = ref({});

        const voucherId       = ref('');
        const isEditMode      = ref(false);
        const isRecordCreated = ref(false);
        const isPosted        = ref(false);
        const showPreviewModal = ref(false);
        const previewReport    = shallowRef(null);
        const previewExporters = shallowRef(null);
        const previewBatchNo   = ref('');
        const isPreviewLoading = ref(false);
        const previewError     = ref('');
        const companyName      = ref('');
        const companyProfile   = ref(null);
        const companyLogo      = ref(null);
        const proposedJournalHeaderId   = ref('');
        const proposedJournalDetailIdList = ref([]);

        const customerList   = ref([]);
        const accountsList   = ref([]);
        const bankGlAccountsList = ref([]);
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
        /**
         * Formats a system number according to its formatPattern, matching backend C# logic:
         *   var format = string.IsNullOrWhiteSpace(sn.FormatPattern) ? "{prefix}{number}{suffix}" : sn.FormatPattern;
         *   format.Replace("{PREFIX}", sn.Prefix ?? "")
         *         .Replace("{NO}", sn.LastNo.ToString($"D{sn.Padding}"))
         *         .Replace("{SUFFIX}", sn.Suffix ?? "");
         * Also handles the lowercase fallback placeholders {prefix}, {number}, {suffix}.
         * @param {Object} sn  — the system number record from the API
         * @returns {string}
         */
        function applySystemNumberPattern(sn) {
            const prefix  = sn.prefix  != null ? sn.prefix  : '';
            const suffix  = sn.suffix  != null ? sn.suffix  : '';
            const lastNo  = sn.lastNo  != null ? sn.lastNo  : 0;
            const padding = sn.padding != null ? parseInt(sn.padding, 10) : 0;

            const pattern = (sn.formatPattern && sn.formatPattern.trim())
                ? sn.formatPattern.trim()
                : '{prefix}{number}{suffix}';

            const paddedNo = padding > 0
                ? String(lastNo).padStart(padding, '0')
                : String(lastNo);

            return pattern
                .replace(/\{PREFIX\}/gi, prefix)
                .replace(/\{NO\}/gi, paddedNo)
                .replace(/\{number\}/gi, paddedNo)
                .replace(/\{SUFFIX\}/gi, suffix);
        }

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
            const arr = Array.isArray(dataArr) ? dataArr : (dataArr?.result || dataArr?.data || []);
            costCenterList.value = arr;
            const list = [];
            for (let i = 0; i < arr.length; i++) {
                costCenterNameList.value = [];
                getHierachyName(arr[i].id);
                const name = [...new Set(costCenterNameList.value)].join().replace(/,/g, '/');
                list.push({ name, parentId: arr[i].parentId, id: arr[i].id, rawName: arr[i].name, tenantId: arr[i].tenantId });
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
        async function getBankGlAccounts() {
            try {
                const res = await axios.get('/GeneralLedger/GetBankGlAccounts');
                const raw = res.data?.result?.data
                    || res.data?.result
                    || res.data?.data
                    || (Array.isArray(res.data) ? res.data : []);
                raw.forEach(v => { v.accountIdentifier = `${v.accountNo} - ${v.accountName}`; });
                bankGlAccountsList.value = raw;
            } catch (err) {
                console.error('Failed to get bank GL accounts:', err);
                toastHandler('error', 'Unable to retrieve Bank GL accounts.');
            }
        }

        async function getAccounts() {
            try {
                const res = await axios.get('/GeneralLedger/GetAccountDetails?pageNo=1&pageSize=5000&isActive=true');
                const raw = res.data?.result?.data
                    || res.data?.result
                    || res.data?.data
                    || (Array.isArray(res.data) ? res.data : []);
                raw.forEach(v => { v.accountIdentifier = `${v.accountNo} - ${v.accountName}`; });
                accountsList.value = raw;
            } catch (err) {
                console.error('Failed to get account details:', err);
                toastHandler('error', 'Unable to retrieve GL accounts.');
            }
        }

        async function getCostCenters() {
            try {
                const res = await axios.get('/SharedResource/GetCostCenters?pageNo=1&pageSize=2000');
                const raw = res.data?.result;
                costCenterHierachyList.value = parseCostCenterHierachy(raw);
            } catch {
                try {
                    const jRes = await axios.get('/GeneralLedger/InitJournalEntry');
                    const raw = jRes.data?.costCenters?.result || [];
                    costCenterHierachyList.value = parseCostCenterHierachy(raw);
                } catch {
                    toastHandler('error', 'Unable to retrieve cost centers.');
                }
            }
        }

        async function initReceiptVoucher() {
            try {
                const res = await axios.get('/GeneralLedger/InitSupplierPvEntry');
                const data = res.data?.result || res.data;
                if (!accountsList.value.length) {
                    const rawAccounts = data.accounts?.data || data.accounts || [];
                    rawAccounts.forEach(v => { v.accountIdentifier = `${v.accountNo} - ${v.accountName}`; });
                    accountsList.value = rawAccounts;
                }
                const rawCostCenters = data.costCenters?.result || data.costCenters?.data || (Array.isArray(data.costCenters) ? data.costCenters : []);
                if (rawCostCenters && rawCostCenters.length) {
                    costCenterHierachyList.value = parseCostCenterHierachy(rawCostCenters);
                } else if (!costCenterHierachyList.value.length) {
                    await getCostCenters();
                }

                if (data.voucherBatchSystemNumber && !batchNo.value) {
                    const sn = data.voucherBatchSystemNumber;
                    voucherBatchSystemNumber.value = sn;
                    batchNo.value = applySystemNumberPattern(sn);
                }

                // gl-receipt-voucher-id system number
                let rctSn = data.receiptVoucherSystemNumber;
                if (!rctSn) {
                    try {
                        const snRes = await axios.get('/SharedResource/GetSystemNumberInfo?key=gl-receipt-voucher-id');
                        const snData = snRes.data?.result || snRes.data;
                        if (Array.isArray(snData)) {
                            rctSn = snData.find(s => s.key && s.key.toLowerCase().includes('gl-receipt-voucher-id')) || snData[0];
                        } else if (snData && snData.key) {
                            rctSn = snData;
                        }
                    } catch (_) {
                        try {
                            const sysRes = await axios.get('/SharedResource/GetSystemNumbers');
                            const allSys = sysRes.data?.result || sysRes.data || [];
                            rctSn = allSys.find(s => s.key && s.key.toLowerCase().includes('gl-receipt-voucher-id'));
                        } catch (_) {}
                    }
                }
                if (rctSn && !receiptNo.value) {
                    receiptVoucherSystemNumber.value = rctSn;
                    receiptNo.value = applySystemNumberPattern(rctSn);
                }

                const defaultBankId = data.defaultGlNumbers ? (data.defaultGlNumbers.accountsReceivableBankAccountId || data.defaultGlNumbers.accountReceivableBankAccountId) : '';
                if (defaultBankId && !bankAccountId.value) {
                    bankAccountId.value = defaultBankId;
                    const accountInfo = bankGlAccountsList.value.find(a => a.id === defaultBankId) || accountsList.value.find(a => a.id === defaultBankId);
                    if (accountInfo && accountInfo.currencyId) currencyId.value = accountInfo.currencyId;
                }
            } catch (err) {
                console.error('Init receipt voucher error:', err);
                toastHandler('error', 'Voucher initialization failed.');
            }
        }

        async function getCustomers() {
            try {
                const res = await axios.get('/SharedResource/GetCustomers');
                const raw = res.data?.result;
                customerList.value = raw;
            } catch {
                
            }
        }

        async function getBanks() {
            try {
                const res = await axios.get('/SharedResource/GetBanks?pageNo=1&pageSize=1000');
                const raw = res.data?.result;
                bankList.value = raw;
            } catch {
                
            }
        }

        async function getCurrencies() {
            try {
                const res = await axios.get('/SharedResource/GetCurrencies?pageNo=1&pageSize=100');
                const raw = res.data?.result;
                currencyList.value = raw;
            } catch {
                
            }
        }

        async function loadCompanyProfile() {
            try {
                const res = await axios.get('/GeneralLedger/GetBusinessProfile');
                const prof = res.data?.result || res.data;
                companyProfile.value = prof || null;
                companyName.value = prof?.companyName || prof?.businessName || '';
                companyLogo.value = prof?.companyLogo || null;
            } catch (_) {
                companyProfile.value = null;
                companyName.value = '';
                companyLogo.value = null;
            }
        }

        async function loadVoucherDetails() {
            isShimmerLoading.value = true;
            try {
                const res = await axios.get('/GeneralLedger/GetVoucherDetails?id=' + voucherId.value);

                // Decompose the revised Voucher model (result or direct object)
                const v = res.data?.result
                if (!v) return;

                // ── 1. Root Voucher Header Fields ─────────────────────────────
                if (v.id && v.id !== emptyGuid) voucherId.value = v.id;
                if (v.customerId && v.customerId !== emptyGuid) customerId.value = v.customerId;

                // Resolve bankAccountId → must match an id in bankGlAccountsList (CoaDetail.Id)
                // v.bankAccountId may be a BankAccount PK or a GL account ID — handle both.
                (function resolveBankGl() {
                    const targetId = String(v.bankAccountId || '').toLowerCase();
                    if (!targetId || targetId === emptyGuid) return;

                    // 1. Direct case-insensitive match in bankGlAccountsList
                    const matchedGl = bankGlAccountsList.value.find(b => String(b.id).toLowerCase() === targetId);

                    if (matchedGl) {
                        bankAccountId.value = matchedGl.id;
                    } else {
                        // 2. Fallback: inject a synthetic option so the select can display the saved value
                        const fallback = {
                            id: v.bankAccountId,
                            accountNo: '',
                            accountName: v.bankGlAccountName || v.bankAccountName || 'Bank Account',
                            accountIdentifier: v.bankAccountName || v.bankGlAccountName || 'Bank Account',
                        };
                        if (!bankGlAccountsList.value.some(b => String(b.id).toLowerCase() === targetId)) {
                            bankGlAccountsList.value.unshift(fallback);
                        }
                        bankAccountId.value = v.bankAccountId;
                    }
                })();
                currencyId.value = v.currencyId || '';
                currencyRate.value = v.currencyRate != null ? v.currencyRate : null;
                isMultiCurrency.value = Boolean(v.isMultiCurrency);
                bankId.value = (v.bankId && v.bankId !== emptyGuid) ? v.bankId : '';
                modePayment.value = v.modePayment || v.modeOfPayment || 'Cash';
                voucherEntryDate.value = v.voucherEntryDate ? moment(v.voucherEntryDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
                paymentDate.value = v.paymentDate ? moment(v.paymentDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
                batchNo.value = v.batchNo || '';
                receiptNo.value = v.receiptNo || (v.batchNo ? (v.batchNo.endsWith('V') ? v.batchNo.slice(0, -1) + 'RCT' : v.batchNo) : '');
                chequeNo.value = v.chequeNo || '';
                isPosted.value = Boolean(v.isPosted);

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
            } finally {
                isShimmerLoading.value = false;
            }
        }

        // ── Journal ───────────────────────────────────────────────────
        function rebuildJournalEntryList() {
            const currencyInfo    = currencyList.value.find(x => x.id === currencyId.value);
            const bankAccountInfo = bankGlAccountsList.value.find(x => x.id === bankAccountId.value)
                || accountsList.value.find(x => x.id === bankAccountId.value);

            const firstOuId = (voucherList.value.find(x => x.ouId && x.ouId !== emptyGuid)?.ouId)
                || (voucherList.value.length ? (voucherList.value[0].ouId || emptyGuid) : emptyGuid);
            const firstRef  = voucherList.value.length ? (voucherList.value[0].referenceNo || batchNo.value) : batchNo.value;

            const commonFields = (accountId, accountInfo, ouId) => {
                const targetOuId = (ouId && ouId !== emptyGuid) ? ouId : firstOuId;
                const ouInfo = costCenterHierachyList.value.find(x => x.id === targetOuId || (x.id && targetOuId && String(x.id).toLowerCase() === String(targetOuId).toLowerCase()));
                return {
                    id: uuid(),
                    accountId,
                    accountName: accountInfo ? accountInfo.accountIdentifier : '',
                    ouId: targetOuId || emptyGuid,
                    ouName: ouInfo ? ouInfo.name : '',
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

            const lines = [];

            const totalAmount = voucherList.value.reduce(
                (sum, v) => sum + (parseFloat(v.localDebitAmount || v.debitAmount || 0)), 0
            );

            // 1. Bank / Cash GL (Debit total received amount)
            if (totalAmount !== 0) {
                lines.push({
                    ...commonFields(bankAccountId.value, bankAccountInfo, firstOuId),
                    invoiceNo: '',
                    referenceNumber: firstRef,
                    description: chequeNo.value ? `Voucher (#${batchNo.value}) Cheque No.: ${chequeNo.value}` : `Voucher (#${batchNo.value})`,
                    debitAmount: totalAmount,
                    creditAmount: 0,
                });
            }

            // 2. AR / Customer GL lines (Credit per row)
            voucherList.value.forEach(v => {
                const arAccountInfo = accountsList.value.find(x => x.id === v.accountId);
                const rowAmount = parseFloat(v.localDebitAmount || v.debitAmount || 0);
                const rowOuInfo = costCenterHierachyList.value.find(x => x.id === v.ouId || (x.id && v.ouId && String(x.id).toLowerCase() === String(v.ouId).toLowerCase()));
                lines.push({
                    ...commonFields(v.accountId, arAccountInfo, v.ouId || firstOuId),
                    ouName: rowOuInfo ? rowOuInfo.name : (v.ouName && v.ouName !== '--' ? v.ouName : (commonFields(v.accountId, arAccountInfo, v.ouId || firstOuId).ouName)),
                    invoiceNo: v.invoiceNo || '',
                    referenceNumber: v.referenceNo || firstRef,
                    description: `Voucher (#${batchNo.value}) Cheque No.: ${chequeNo.value || 'N/A'} - ${v.description || ''}`.trim(),
                    debitAmount: 0,
                    creditAmount: rowAmount,
                });
            });

            journalEntryList.value = lines;
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
            const bankAccountInfo = bankGlAccountsList.value.find(x => x.id === bankAccountId.value) || accountsList.value.find(x => x.id === bankAccountId.value);
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
                id: emptyGuid,
                transactionSource: "GL",
                journalDetails: journalEntryList.value,
            };

            try {
                await axios.post('/GeneralLedger/SaveJournal', payload);
                journalEntryList.value = [];
                isLoading.value = false;

                if (voucherId.value) {
                    axios.get('/GeneralLedger/GetVoucherDetails?id=' + voucherId.value).then(res => {
                        if (res.data && res.data.proposedJournalHeader) {
                            proposedJournalHeaderId.value = res.data.proposedJournalHeader.id;
                            proposedJournalDetailIdList.value = (res.data.proposedJournalDetails || []).map(a => a.id);
                        }
                    }).catch(() => {});
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
            const bankAccountInfo = bankGlAccountsList.value.find(a => a.id === bankAccountId.value) || accountsList.value.find(a => a.id === bankAccountId.value);
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
                receiptNo:        receiptNo.value,
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
                const response = await axios.post(endpoint, payload);

                const createdId = response.data?.id || response.data?.result?.id || voucherId.value;
                if (createdId && createdId !== emptyGuid) {
                    voucherId.value = createdId;
                    isRecordCreated.value = true;
                }
                toastHandler('success', `Customer Receipt voucher ${isEditMode.value ? 'updated' : 'saved'}.`);
                await saveJournal();

                if (andPreview && createdId) {
                    await openPreviewModal(null, true);
                } else {
                    setTimeout(() => {
                        window.location.href = '/GeneralLedger/Vouchers?tab=customer';
                    }, 1200);
                }
            } catch (err) {
                console.error('Save voucher error:', err);
                toastHandler('error', `Unable to ${isEditMode.value ? 'update' : 'create'} customer receipt voucher.`);
            } finally {
                isLoading.value = false;
            }
        }

        function previewVoucher() {
            openPreviewModal(null, true);
        }

        async function openPreviewModal(voucherInfoOverride = null, skipApiFetch = false) {
            showPreviewModal.value = true;
            isPreviewLoading.value = true;
            previewError.value = '';
            previewReport.value = null;

            try {
                if (!companyName.value || !companyProfile.value) {
                    await loadCompanyProfile();
                }

                let voucherData = voucherInfoOverride;
                if (!voucherData && !skipApiFetch && voucherId.value) {
                    try {
                        const res = await axios.get('/GeneralLedger/GetVoucherDetails?id=' + voucherId.value);
                        const apiRes = res.data?.result || res.data?.voucherInfo || res.data;
                        if (apiRes && (apiRes.batchNo || apiRes.id || apiRes.details)) {
                            voucherData = apiRes;
                        }
                    } catch (_) {}
                }

                if (!voucherData) {
                    const customerInfo = customerList.value.find(c => c.id === customerId.value);
                    const custName = customerInfo ? (customerInfo.name || customerInfo.customerName || '') : '';
                    const bankAccountInfo = bankGlAccountsList.value.find(a => a.id === bankAccountId.value)
                        || accountsList.value.find(a => a.id === bankAccountId.value);
                    const bankAccountDisplayName = bankAccountInfo ? bankAccountInfo.accountIdentifier : '';
                    const bankGlDisplayName = bankAccountInfo ? (bankAccountInfo.accountIdentifier || bankAccountInfo.accountName) : '';

                    voucherData = {
                        id: voucherId.value || 'draft',
                        isReceipt: true,
                        type: 'customer-receipt',
                        voucherType: 'customer',
                        batchNo: batchNo.value || 'Draft',
                        voucherNumber: batchNo.value,
                        receiptNo: receiptNo.value,
                        voucherEntryDate: voucherEntryDate.value,
                        receiptDate: paymentDate.value || voucherEntryDate.value,
                        paymentDate: paymentDate.value || voucherEntryDate.value,
                        customerName: custName,
                        payeeName: custName,
                        bankAccountName: bankAccountDisplayName,
                        bankGlAccountName: bankGlDisplayName,
                        modePayment: modePayment.value,
                        chequeNo: chequeNo.value,
                        currencyCode: currencyCode.value,
                        grossAmount: totalDebit.value,
                        netAmount: totalNetAmount.value,
                        details: voucherList.value.map(v => {
                            const debitAccountInfo = accountsList.value.find(a => a.id === v.accountId);
                            const ouInfo = costCenterHierachyList.value.find(a => a.id === v.ouId);
                            return {
                                ...v,
                                debitAccountName: debitAccountInfo ? debitAccountInfo.accountIdentifier : (v.debitAccountName || ''),
                                amount: v.localDebitAmount,
                                ouName: ouInfo ? ouInfo.name : (v.ouName || '--')
                            };
                        }),
                        retensions: [],
                    };
                } else {
                    voucherData.isReceipt = true;
                    voucherData.type = 'customer-receipt';
                    voucherData.voucherType = 'customer';
                    const customerInfo = customerList.value.find(c => c.id === voucherData.customerId);
                    const custName = voucherData.customerName || (customerInfo ? (customerInfo.name || customerInfo.customerName) : '');
                    if (!voucherData.payeeName) {
                        voucherData.payeeName = custName || voucherData.customerName || '';
                    }
                    if (!voucherData.customerName && custName) {
                        voucherData.customerName = custName;
                    }
                    if (!voucherData.batchNo && voucherData.voucherNumber) {
                        voucherData.batchNo = voucherData.voucherNumber;
                    }
                    if (!voucherData.details && voucherData.lines) {
                        voucherData.details = voucherData.lines;
                    }
                    if (Array.isArray(voucherData.details)) {
                        voucherData.details = voucherData.details.map(d => {
                            const debitAccountInfo = accountsList.value.find(a => a.id === d.accountId || a.id === d.debitAccountId);
                            const ouInfo = costCenterHierachyList.value.find(a => a.id === d.ouId);
                            return {
                                ...d,
                                debitAccountName: d.debitAccountName || (debitAccountInfo ? debitAccountInfo.accountIdentifier : ''),
                                amount: d.localDebitAmount != null ? d.localDebitAmount : (d.amount || d.debitAmount || 0),
                                ouName: d.ouName && d.ouName !== '--' ? d.ouName : (ouInfo ? ouInfo.name : (d.ouName || '--'))
                            };
                        });
                    }
                    if (!voucherData.receiptNo) {
                        voucherData.receiptNo = receiptNo.value || (voucherData.batchNo ? (voucherData.batchNo.endsWith('V') ? voucherData.batchNo.slice(0, -1) + 'RCT' : voucherData.batchNo) : '');
                    }
                }

                previewBatchNo.value = voucherData.receiptNo || voucherData.batchNo || voucherData.voucherNumber || batchNo.value || '';

                const gross = parseFloat(voucherData.grossAmount != null ? voucherData.grossAmount : (totalDebit.value || 0));
                const net   = parseFloat(voucherData.netAmount != null ? voucherData.netAmount : (totalNetAmount.value || 0));

                const summary = {
                    gross: gross.toFixed(2),
                    net: net.toFixed(2),
                    retained: '0.00',
                    incomeWithholding: '0.00',
                    vatWithholding: '0.00',
                    nhil: '0.00',
                    getfund: '0.00',
                    vat: '0.00',
                    cst: '0.00',
                    covid: '0.00',
                };

                const profileObj = companyProfile.value || { companyName: companyName.value, companyLogo: companyLogo.value };
                const rep = window.TopazReportViewer.buildVoucherReport(voucherData, summary, profileObj);
                previewReport.value = rep;

                previewExporters.value = {
                    pdf:  async () => window.TopazReportViewer.createVoucherPdf(previewReport.value),
                    xlsx: async () => window.TopazReportViewer.createVoucherExcel(previewReport.value),
                    docx: async () => window.TopazReportViewer.createVoucherWord(previewReport.value),
                };
            } catch (e) {
                console.error('Failed to prepare voucher preview:', e);
                previewError.value = e?.message || 'Unable to prepare voucher preview.';
            } finally {
                isPreviewLoading.value = false;
            }
        }

        function closePreviewModal() {
            showPreviewModal.value = false;
        }

        function onBackToVouchers() {
            showPreviewModal.value = false;
            window.location.href = '/GeneralLedger/Vouchers?tab=customer';
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
            receiptNo.value = '';
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

        async function postVoucher() {
            if (!voucherId.value) {
                toastHandler('warning', 'Please save the voucher before posting.');
                return;
            }

            const result = await Swal.fire({
                title: 'Post Voucher?',
                text: 'Are you sure you want to post this voucher? This action will affect the general ledger and cannot be undone.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#059669',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Post',
                cancelButtonText: 'Cancel'
            });
            if (!result.isConfirmed) return;

            isLoading.value = true;
            try {
                const payload = { ids: [voucherId.value] };
                let res;
                try {
                    res = await axios.post('/GeneralLedger/PostVouchers', payload);
                } catch {
                    res = await axios.post('/GeneralLedger/PostVoucher', payload);
                }

                if (res?.data && res.data.success === false) {
                    toastHandler('error', res.data.message || res.data.error || 'Unable to post voucher.');
                    isLoading.value = false;
                    return;
                }

                isPosted.value = true;
                toastHandler('success', 'Voucher posted successfully.');
                setTimeout(() => { window.location.href = '/GeneralLedger/Vouchers?tab=customer'; }, 1500);
            } catch {
                isLoading.value = false;
                toastHandler('error', 'Unable to post voucher.');
            }
        }

        async function deleteVoucher() {
            if (!voucherId.value) {
                toastHandler('warning', 'Voucher not found.');
                return;
            }

            const result = await Swal.fire({
                title: 'Delete Voucher?',
                text: 'Are you sure you want to delete this voucher? This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Delete',
                cancelButtonText: 'Cancel'
            });
            if (!result.isConfirmed) return;

            isLoading.value = true;
            try {
                let res;
                try {
                    res = await axios.post('/GeneralLedger/DeleteVouchers', { ids: [voucherId.value] });
                } catch {
                    res = await axios.post('/GeneralLedger/DeleteVoucher', { ids: [voucherId.value] });
                }
                if (res?.data && res.data.success === false) {
                    toastHandler('error', res.data.message || res.data.error || 'Unable to delete voucher.');
                    isLoading.value = false;
                    return;
                }
                toastHandler('success', 'Voucher deleted successfully.');
                setTimeout(() => { window.location.href = '/GeneralLedger/Vouchers?tab=customer'; }, 1500);
            } catch {
                isLoading.value = false;
                toastHandler('error', 'Unable to delete voucher.');
            }
        }

        // ── Watchers ──────────────────────────────────────────────────
        watch(bankAccountId, val => {
            errors.bankAccountId = !val;
            const bankGlAccount = bankGlAccountsList.value.find(a => a.id === val);
            if (bankGlAccount && bankGlAccount.currencyId) {
                currencyId.value = bankGlAccount.currencyId;
                return;
            }
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
                isShimmerLoading.value = true;
            }
            if (typeof window.withHoldingVatPercentage !== 'undefined') {
                withHoldingVatPercentage.value = parseFloat(window.withHoldingVatPercentage) || 7;
            }

            try {
                if (!isEditMode.value) isShimmerLoading.value = true;
                await Promise.all([
                    getBankGlAccounts(),
                    getAccounts(),
                    getBanks(),
                    getCustomers(),
                    getCurrencies(),
                    getCostCenters(),
                    initReceiptVoucher(),
                    loadCompanyProfile()
                ]);
            } catch (err) {
                console.error('Init receipt voucher error:', err);
            } finally {
                if (!isEditMode.value) isShimmerLoading.value = false;
            }

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
            isLoading, isShimmerLoading, showSaveMenu, customerId, voucherEntryDate, paymentDate, bankAccountId,
            currencyId, currencyRate, isMultiCurrency, modePayment, batchNo, receiptNo, chequeNo,
            voucherId, isEditMode, isRecordCreated, isPosted,
            customerList, accountsList, bankGlAccountsList, currencyList, costCenterHierachyList,
            voucherList, errors,
            totalCredit, totalDebit, totalNetAmount,
            saveButtonText, currencyCode, currencySymbol, proposedJournalEntries, proposedJournalTotals,
            saveVoucher, previewVoucher, addVoucherRow, removeVoucherRow,
            computeTotal, onForeignAmountChange, postVoucher, deleteVoucher, fmtNum,
            showPreviewModal, previewReport, previewExporters, previewBatchNo, isPreviewLoading, previewError,
            companyProfile, companyLogo,
            openPreviewModal, closePreviewModal, onBackToVouchers,
        };
    }
}).mount('#app');
