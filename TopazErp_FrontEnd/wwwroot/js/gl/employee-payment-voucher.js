const { createApp, ref, shallowRef, computed, watch, onMounted, reactive } = Vue;

createApp({
    setup() {
        // ── State ────────────────────────────────────────────────────
        const isLoading = ref(false);
        const isShimmerLoading = ref(false);
        const emptyGuid = '00000000-0000-0000-0000-000000000000';

        const employeeId    = ref('');
        const voucherEntryDate = ref(moment().format('YYYY-MM-DD'));
        const paymentDate   = ref(moment().format('YYYY-MM-DD'));
        const bankAccountId = ref('');
        const currencyId    = ref('');
        const currencyRate  = ref(null);
        const isMultiCurrency = ref(false);
        const modePayment   = ref('Cash');
        const batchNo       = ref('');
        const chequeNo      = ref('');
        const taxType       = ref('');
        const withHoldingRate = ref(0);
        const lastWithHoldingRate = ref(5.00);
        const lastEnabledTaxKeys = ref(['getfl', 'vat', 'vatWh', 'nhil']);
        const withHoldingAccountId    = ref('');
        const vatWithHoldingAccountId = ref('');
        const hasWithHolding = ref(false);

        const voucherId       = ref('');
        const isEditMode      = ref(false);
        const isRecordCreated = ref(false);
        const isPosted        = ref(false);
        const showSaveMenu    = ref(false);
        const showPreviewModal = ref(false);
        const previewReport    = shallowRef(null);
        const previewExporters = shallowRef(null);
        const previewBatchNo   = ref('');
        const isPreviewLoading = ref(false);
        const previewError     = ref('');
        const companyName      = ref('');
        const proposedJournalHeaderId  = ref('');
        const proposedJournalDetailIdList = ref([]);

        const employeeList   = ref([]);
        const accountsList   = ref([]);
        const bankGlAccountsList = ref([]);
        const bankList       = ref([]);
        const currencyList   = ref([]);
        const costCenterHierachyList = ref([]);
        const costCenterList = ref([]);
        const costCenterNameList = ref([]);
        const voucherList    = ref([]);
        const retentionsList = ref([]);
        const journalEntryList = ref([]);

        const totalVatAmount         = ref(0);
        const totalWithHeldAmount    = ref(0);
        const totalVatWithHeldAmount = ref(0);
        const totalRetentionCredit   = ref(0);
        const totalCredit            = ref(0);
        const totalDebit             = ref(0);
        const totalNetAmount         = ref(0);
        const amountWithoutTaxes     = ref(0);

        const voucherBatchSystemNumber = ref({});
        const withHoldingVatPercentage = ref(7);

        const taxFlags = reactive([
            { label: 'GET Fund Levy',       key: 'getfl',  enabled: false, rate: 0, defaultRate: 2.50 },
            { label: 'VAT',                 key: 'vat',    enabled: false, rate: 0, defaultRate: 15.00 },
            { label: 'VAT Withhold',        key: 'vatWh',  enabled: false, rate: 0, defaultRate: 7.00 },
            { label: 'NHIL',                key: 'nhil',   enabled: false, rate: 0, defaultRate: 2.50 },
            { label: 'Comm. Service Tax',   key: 'cst',    enabled: false, rate: 0, defaultRate: 5.00 },
            { label: 'Covid Tax',           key: 'covid',  enabled: false, rate: 0, defaultRate: 1.00 },
        ]);

        const errors = reactive({
            employeeId: false,
            voucherEntryDate: false,
            bankAccountId: false,
            currencyId: false,
            paymentDate: false,
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

        function getTaxFlag(key) { return taxFlags.find(f => f.key === key); }

        function onTaxFlagChange(tax) {
            if (tax.key === 'cst' && tax.enabled) {
                const covid = getTaxFlag('covid');
                if (covid && covid.enabled) { toastHandler('warning', 'CST & Covid Taxes cannot be used at the same time.'); tax.enabled = false; return; }
            }
            if (tax.key === 'covid' && tax.enabled) {
                const cst = getTaxFlag('cst');
                if (cst && cst.enabled) { toastHandler('warning', 'CST & Covid Taxes cannot be used at the same time.'); tax.enabled = false; return; }
            }
            tax.rate = tax.enabled ? tax.defaultRate : 0;
            reComputeVoucherSummary();
        }

        function calculateVoucherBreakdown(amount, withHold) {
            const grossAmount = parseFloat(amount || 0);
            const nhil  = getTaxFlag('nhil');
            const getfl = getTaxFlag('getfl');
            const vat   = getTaxFlag('vat');
            const vatWh = getTaxFlag('vatWh');
            const cst   = getTaxFlag('cst');
            const covid = getTaxFlag('covid');
            const nhilRate  = nhil  ? parseFloat(nhil.rate  || 0) : 0;
            const getflRate = getfl ? parseFloat(getfl.rate || 0) : 0;
            const vatRate   = vat   ? parseFloat(vat.rate   || 0) : 0;
            const cstRate   = cst   ? parseFloat(cst.rate   || 0) : 0;
            const covidRate = covid ? parseFloat(covid.rate || 0) : 0;
            const withholdingRate    = parseFloat(withHoldingRate.value || 0);
            const withHoldingVatRate = vatWh ? parseFloat(vatWh.rate || 0) : 0;

            let baseAmount = grossAmount;
            let nhilAmount = 0, getflAmount = 0, vatAmount = 0, withHeldAmount = 0, vatWithHeldAmount = 0;

            if (withHold) {
                const totalRate = nhilRate + getflRate + vatRate + cstRate + covidRate;
                baseAmount = totalRate > 0 ? grossAmount / (1 + totalRate / 100) : grossAmount;
                nhilAmount  = nhil  && nhil.enabled  ? (nhilRate  / 100) * baseAmount : 0;
                getflAmount = getfl && getfl.enabled ? (getflRate / 100) * baseAmount : 0;
                vatAmount   = vat   && vat.enabled   ? (vatRate   / 100) * baseAmount : 0;
                withHeldAmount    = (withholdingRate    / 100) * baseAmount;
                vatWithHeldAmount = vatWh && vatWh.enabled ? (withHoldingVatRate / 100) * baseAmount : 0;
            }

            const netAmount        = grossAmount - withHeldAmount - vatWithHeldAmount;
            const amountWithoutTax = withHold ? grossAmount - nhilAmount - getflAmount - vatAmount : 0;

            return {
                grossAmount:       roundNumber(grossAmount),
                withHeldAmount:    roundNumber(withHeldAmount),
                vatWithHeldAmount: roundNumber(vatWithHeldAmount),
                vatAmount:         roundNumber(vatAmount),
                netAmount:         roundNumber(netAmount),
                amountWithoutTaxes: roundNumber(amountWithoutTax),
            };
        }

        function reComputeVoucherSummary() {
            totalVatAmount.value         = 0;
            totalWithHeldAmount.value    = 0;
            totalVatWithHeldAmount.value = 0;
            totalNetAmount.value         = 0;
            totalCredit.value            = 0;
            totalDebit.value             = 0;
            amountWithoutTaxes.value     = 0;

            let netBeforeRetention = 0;

            voucherList.value.forEach(tx => {
                const debitAmount = parseFloat(tx.localDebitAmount || tx.debitAmount || 0);
                totalDebit.value += debitAmount;
                const bd = calculateVoucherBreakdown(debitAmount, tx.withHold);
                totalVatAmount.value         += bd.vatAmount;
                totalWithHeldAmount.value    += bd.withHeldAmount;
                totalVatWithHeldAmount.value += bd.vatWithHeldAmount || 0;
                netBeforeRetention           += bd.netAmount;
                amountWithoutTaxes.value     += bd.amountWithoutTaxes;
            });

            // Recompute percentage retentions from Net Amount
            retentionsList.value.forEach(r => {
                const amt = parseFloat(r.amount || 0);
                if (r.IsPercentage) {
                    r.totalAmount = roundNumber((amt / 100) * netBeforeRetention);
                } else {
                    r.totalAmount = roundNumber(amt);
                }
            });

            totalRetentionCredit.value = retentionsList.value.reduce((s, r) => s + parseFloat(r.totalAmount || 0), 0);
            totalNetAmount.value       = netBeforeRetention - parseFloat(totalRetentionCredit.value || 0);
            amountWithoutTaxes.value  -= parseFloat(totalRetentionCredit.value || 0);

            totalDebit.value             = roundNumber(totalDebit.value);
            totalNetAmount.value         = roundNumber(totalNetAmount.value);
            totalVatAmount.value         = roundNumber(totalVatAmount.value);
            totalWithHeldAmount.value    = roundNumber(totalWithHeldAmount.value);
            totalVatWithHeldAmount.value = roundNumber(totalVatWithHeldAmount.value);
            amountWithoutTaxes.value     = roundNumber(amountWithoutTaxes.value);
            totalRetentionCredit.value   = roundNumber(totalRetentionCredit.value);
        }

        // ── API ───────────────────────────────────────────────────────
        // Loaders mirror supplier-payment-voucher.js (the working reference page)
        async function getBankGlAccounts() {
            try {
                const res = await axios.get('/GeneralLedger/GetBankGlAccounts');
                const raw = res.data?.result;
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
                const raw = res.data?.result;
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

        async function getCurrencies() {
            try {
                const res = await axios.get('/SharedResource/GetCurrencies?pageNo=1&pageSize=100');
                const raw = res.data?.result;
                currencyList.value = raw;
            } catch (err) {
                console.error('Failed to get currencies:', err);
                toastHandler('error', 'Unable to retrieve currencies.');
            }
        }

        async function getEmployees() {
            try {
                const res = await axios.get('/Payroll/GetEmployees');
                const raw = res.data?.result;
                
                raw.forEach(v => {
                    v.employeeName = (v.otherName === '' || v.otherName == null)
                        ? `${v.lastName} ${v.firstName} - ${v.employeeIdentifier}`
                        : `${v.lastName} ${v.firstName} ${v.otherName} - ${v.employeeIdentifier}`;
                });
                employeeList.value = raw;
            } catch { toastHandler('error', 'Unable to retrieve employees.'); }
        }

        async function getBanks() {
            try {
                const res = await axios.get('/SharedResource/GetBanks?pageNo=1&pageSize=1000');
                const raw = res.data?.result;
                bankList.value = raw;
            } catch { toastHandler('error', 'Unable to retrieve banks.'); }
        }

        async function getSystemNumbers() {
            try {
                const res = await axios.get('/SharedResource/GetSystemNumbers');
                const raw = res.data.result;
                const voucherSys = raw.find(s => s.key === 'gl-voucher-batch-id');

                if (voucherSys && !batchNo.value) {
                    voucherBatchSystemNumber.value = voucherSys;
                    batchNo.value = applySystemNumberPattern(voucherSys);
                }
            } catch (err) {
                console.warn('System numbers load error (optional):', err);
            }
        }

        async function getDefaultGlSetup() {
            try {
                const res = await axios.get('/GeneralLedger/GetDefaultGlNumbersSetup');
                let d = res.data?.result;
                if (Array.isArray(d)) d = d[0];
                if (!d) return;

                const defaultBankId = d.payRollBankAccountId || d.accountPayablesBankAccountId || d.purchasesBankAccountId;
                if (defaultBankId && defaultBankId !== emptyGuid && !bankAccountId.value) {
                    bankAccountId.value = defaultBankId;
                    const accountInfo = bankGlAccountsList.value.find(a => a.id === defaultBankId) || accountsList.value.find(a => a.id === defaultBankId);
                    if (accountInfo && accountInfo.currencyId) currencyId.value = accountInfo.currencyId;
                }

                const defaultWhId = d.withholdingTaxAccountId;
                if (defaultWhId && defaultWhId !== emptyGuid && !withHoldingAccountId.value) {
                    withHoldingAccountId.value = defaultWhId;
                }

                const defaultVatId = d.vatPaidAccountId || d.vatReceivedAccountId;
                if (defaultVatId && defaultVatId !== emptyGuid && !vatWithHoldingAccountId.value) {
                    vatWithHoldingAccountId.value = defaultVatId;
                }

                if (d.vatRate && typeof d.vatRate === 'number') {
                    const vatFlag = getTaxFlag('vat');
                    if (vatFlag) vatFlag.defaultRate = d.vatRate;
                }
            } catch (err) {
                console.warn('Default GL setup load error (optional):', err);
            }
        }

        async function loadCompanyProfile() {
            try {
                const res = await axios.get('/GeneralLedger/GetBusinessProfile');
                const prof = res.data?.result;
                companyName.value = prof?.companyName || prof?.businessName || '';
            } catch (_) {
                companyName.value = '';
            }
        }

        async function initPaymentVoucher() {
            isShimmerLoading.value = true;
            try {
                await Promise.all([
                    getBankGlAccounts(),
                    getAccounts(),
                    getCostCenters(),
                    getCurrencies(),
                    getEmployees(),
                    getBanks(),
                    getSystemNumbers(),
                    loadCompanyProfile()
                ]);

                await getDefaultGlSetup();

                if (!currencyId.value && currencyList.value.length) {
                    const defCurr = currencyList.value.find(c => c.isDefault) || currencyList.value[0];
                    if (defCurr) currencyId.value = defCurr.id;
                }
            } catch (err) {
                console.error('Initialization error:', err);
                toastHandler('error', 'Voucher initialization failed.');
            } finally {
                if (!isEditMode.value) {
                    isShimmerLoading.value = false;
                }
            }
        }

        async function loadVoucherDetails() {
            isShimmerLoading.value = true;
            try {
                const res = await axios.get('/GeneralLedger/GetVoucherDetails?id=' + voucherId.value);

                // Decompose the revised Voucher model (result or direct object)
                const v = res.data?.result || res.data?.voucherInfo || res.data;
                if (!v) return;

                // ── 1. Root Voucher Header Fields ─────────────────────────────
                if (v.id && v.id !== emptyGuid) voucherId.value = v.id;
                if (v.employeeId && v.employeeId !== emptyGuid) employeeId.value = v.employeeId;

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
                modePayment.value = v.modePayment || v.modeOfPayment || 'Cash';
                voucherEntryDate.value = v.voucherEntryDate ? moment(v.voucherEntryDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
                paymentDate.value = v.paymentDate ? moment(v.paymentDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
                batchNo.value = v.batchNo || '';
                chequeNo.value = v.chequeNo || '';
                isPosted.value = Boolean(v.isPosted);

                // ── 2. Details (Transaction Lines) ───────────────────────────
                const lineItems = v.details || v.lines || [];
                voucherList.value = lineItems.map(d => ({
                    id: d.id || uuid(),
                    withHold: Boolean(d.withHold !== undefined ? d.withHold : d.isWithHeld),
                    invoiceNo: d.invoiceNo || '',
                    referenceNo: d.referenceNo || '',
                    accountId: d.accountId ? String(d.accountId).toLowerCase() : (d.debitAccountId ? String(d.debitAccountId).toLowerCase() : ''),
                    debitAccountName: d.debitAccountName || '',
                    description: d.description || '',
                    localDebitAmount: parseFloat(d.localDebitAmount != null ? d.localDebitAmount : (d.amount || d.debitAmount || 0)),
                    foreignDebitAmount: parseFloat(d.foreignDebitAmount || 0),
                    ouId: d.ouId ? String(d.ouId).toLowerCase() : emptyGuid,
                    ouName: d.ouName || '--',
                    hasImprest: Boolean(d.hasImprest),
                }));

                // ── 3. Withholding Settings & Tax Flags ───────────────────────
                const wh = v.withholdingSettings || {};
                hasWithHolding.value = Boolean(wh.hasWithHolding != null ? wh.hasWithHolding : v.hasWithHolding);
                withHoldingRate.value = parseFloat(wh.withHoldingRate != null ? wh.withHoldingRate : (v.withHoldingRate || 0));
                taxType.value = wh.taxType != null ? wh.taxType : (v.taxType || '');
                withHoldingAccountId.value = (wh.withHoldingAccountId || v.withHoldingAccountId)
                    ? String(wh.withHoldingAccountId || v.withHoldingAccountId).toLowerCase() : '';
                vatWithHoldingAccountId.value = (wh.vatWithHoldingAccountId || v.vatWithHoldingAccountId)
                    ? String(wh.vatWithHoldingAccountId || v.vatWithHoldingAccountId).toLowerCase() : '';

                if (Array.isArray(wh.taxFlags) && wh.taxFlags.length) {
                    wh.taxFlags.forEach(tf => {
                        const f = getTaxFlag(tf.key);
                        if (f) {
                            f.enabled = Boolean(tf.enabled);
                            f.rate = tf.rate != null ? parseFloat(tf.rate) : f.defaultRate;
                        }
                    });
                    const activeFlags = taxFlags.filter(f => f.enabled).map(f => f.key);
                    if (activeFlags.length > 0) lastEnabledTaxKeys.value = activeFlags;
                } else {
                    const setFlag = (key, enabled, rate) => {
                        const f = getTaxFlag(key);
                        if (f) { f.enabled = enabled; f.rate = rate || f.defaultRate; }
                    };
                    setFlag('getfl', v.hasGetFundLevy, v.getFundLevyRate);
                    setFlag('vat', v.hasVat, v.vatRate);
                    setFlag('vatWh', v.hasVatWithhold, v.withHoldingVatPercentage);
                    setFlag('nhil', v.hasNationalHealthInsuranceLevy, v.nationalHealthInsuranceLevyRate);
                    setFlag('cst', v.hasCommunicationServiceTax, v.communicationServiceTaxRate);
                    setFlag('covid', v.hasCovidTax, v.covidTaxRate);
                    const activeFlags = taxFlags.filter(f => f.enabled).map(f => f.key);
                    if (activeFlags.length > 0) lastEnabledTaxKeys.value = activeFlags;
                }

                if (withHoldingRate.value > 0) {
                    lastWithHoldingRate.value = withHoldingRate.value;
                }

                // ── 4. Retentions ────────────────────────────────────────────
                const retentionItems = v.retentions || v.retensions || [];
                retentionsList.value = retentionItems.map(r => ({
                    id: r.id || uuid(),
                    description: r.description || '',
                    accountId: r.creditAccountId ? String(r.creditAccountId).toLowerCase() : (r.accountId ? String(r.accountId).toLowerCase() : ''),
                    creditAccountName: r.creditAccountName || '',
                    amount: parseFloat(r.amount || 0),
                    IsPercentage: Boolean(r.isPercentage != null ? r.isPercentage : r.IsPercentage),
                    totalAmount: parseFloat(r.totalAmount || 0),
                }));

                // ── 5. Proposed Journal Entry ────────────────────────────────
                const pj = v.proposedJournalEntries || v.proposedJournalEntry || res.data?.proposedJournalHeader;
                if (pj) {
                    proposedJournalHeaderId.value = pj.id || pj.headerId || '';
                    if (Array.isArray(pj.detailIds)) {
                        proposedJournalDetailIdList.value = pj.detailIds;
                    } else if (Array.isArray(res.data?.proposedJournalDetails)) {
                        proposedJournalDetailIdList.value = res.data.proposedJournalDetails.map(a => a.id);
                    }
                }

                reComputeVoucherSummary();
            } catch (err) {
                console.error('loadVoucherDetails error:', err);
                toastHandler('error', 'Unable to load voucher details.');
            } finally {
                isShimmerLoading.value = false;
            }
        }

        // ── Row management ────────────────────────────────────────────
        function addVoucherRow() {
            voucherList.value.push({ id: uuid(), withHold: false, invoiceNo: '', referenceNo: '', accountId: '', description: '', localDebitAmount: 0, foreignDebitAmount: 0, ouId: '', hasImprest: false });
            reComputeVoucherSummary();
        }

        function removeVoucherRow(idx) {
            voucherList.value.splice(idx, 1);
            onWithHoldChange();
        }

        function onWithHoldChange() {
            const anyWithHold = voucherList.value.some(v => v.withHold);

            if (!anyWithHold) {
                // If any withholding components were previously active, save them before clearing
                if (hasWithHolding.value || withHoldingRate.value > 0 || taxFlags.some(f => f.enabled)) {
                    if (withHoldingRate.value > 0) {
                        lastWithHoldingRate.value = parseFloat(withHoldingRate.value);
                    }
                    const activeKeys = taxFlags.filter(f => f.enabled).map(f => f.key);
                    if (activeKeys.length > 0) {
                        lastEnabledTaxKeys.value = activeKeys;
                    }
                }

                // Reset tax rates to zero and uncheck all tax components
                hasWithHolding.value = false;
                withHoldingRate.value = 0;
                taxFlags.forEach(f => {
                    f.enabled = false;
                    f.rate = 0;
                });
            } else {
                // At least one row has withholding checked
                if (!hasWithHolding.value || (!withHoldingRate.value && !taxFlags.some(f => f.enabled))) {
                    // Do the vice versa: check tax components and restore default tax rates
                    hasWithHolding.value = true;
                    withHoldingRate.value = lastWithHoldingRate.value || 5.00;

                    const keysToEnable = (lastEnabledTaxKeys.value && lastEnabledTaxKeys.value.length > 0)
                        ? lastEnabledTaxKeys.value
                        : ['getfl', 'vat', 'vatWh', 'nhil'];

                    taxFlags.forEach(f => {
                        if (keysToEnable.includes(f.key)) {
                            f.enabled = true;
                            if (f.key === 'vatWh') {
                                f.rate = withHoldingVatPercentage.value || f.defaultRate || 7.00;
                            } else {
                                f.rate = f.defaultRate;
                            }
                        } else {
                            f.enabled = false;
                            f.rate = 0;
                        }
                    });
                } else {
                    hasWithHolding.value = true;
                }
            }

            // Always recompute the taxes
            reComputeVoucherSummary();
        }

        function addRetentionRow() {
            retentionsList.value.push({ id: uuid(), description: '', accountId: '', amount: 0, IsPercentage: false, totalAmount: 0 });
            reComputeVoucherSummary();
        }

        function removeRetentionRow(idx) { retentionsList.value.splice(idx, 1); reComputeVoucherSummary(); }

        function onRetentionAmountChange(row) {
            reComputeVoucherSummary();
        }

        // ── Journal ───────────────────────────────────────────────────
        const proposedJournalEntries = computed(() => {
            const lines = [];

            // 1. Debit lines from voucher rows (Expense/Employee accounts)
            voucherList.value.forEach(v => {
                const debitAccountInfo = accountsList.value.find(x => x.id === v.accountId);
                const debitAmount = parseFloat(v.localDebitAmount || v.debitAmount || 0);
                const ouInfo = costCenterHierachyList.value.find(x => x.id === v.ouId);
                if (v.accountId || debitAmount > 0) {
                    lines.push({
                        accountId: v.accountId || emptyGuid,
                        accountDisplay: formatAccountDisplay(debitAccountInfo),
                        description: v.description || 'Employee payment',
                        debitAmount,
                        creditAmount: 0,
                        ouId: v.ouId || emptyGuid,
                        ouName: ouInfo ? ouInfo.name : (v.ouName || '--'),
                        referenceNumber: v.referenceNo || batchNo.value || '',
                        chequeNo: chequeNo.value || '',
                    });
                }
            });

            // 2. Bank / Cash line (Credit net amount)
            const netAmount = parseFloat(totalNetAmount.value || 0);
            const bankAccountInfo = bankGlAccountsList.value.find(x => x.id === bankAccountId.value) || accountsList.value.find(x => x.id === bankAccountId.value);
            const firstOuId = voucherList.value.length ? (voucherList.value[0].ouId || emptyGuid) : emptyGuid;
            const firstOuInfo = costCenterHierachyList.value.find(x => x.id === firstOuId);
            const firstOuName = firstOuInfo ? firstOuInfo.name : '--';
            const firstRef  = voucherList.value.length ? (voucherList.value[0].referenceNo || batchNo.value) : batchNo.value;

            if (bankAccountId.value || netAmount > 0) {
                lines.push({
                    accountId: bankAccountId.value || emptyGuid,
                    accountDisplay: formatAccountDisplay(bankAccountInfo),
                    description: 'Net payment from bank / cash',
                    debitAmount: 0,
                    creditAmount: netAmount,
                    ouId: firstOuId,
                    ouName: firstOuName,
                    referenceNumber: firstRef,
                    chequeNo: chequeNo.value || '',
                });
            }

            // 3. Income Withholding Tax (Credit)
            const wh = parseFloat(totalWithHeldAmount.value || 0);
            if (wh > 0 && withHoldingAccountId.value) {
                const withHoldingAccountInfo = accountsList.value.find(x => x.id === withHoldingAccountId.value);
                const rateVal = parseFloat(withHoldingRate.value || 0);
                lines.push({
                    accountId: withHoldingAccountId.value || emptyGuid,
                    accountDisplay: formatAccountDisplay(withHoldingAccountInfo),
                    description: `Income withholding · ${rateVal}%`,
                    debitAmount: 0,
                    creditAmount: wh,
                    ouId: firstOuId,
                    ouName: firstOuName,
                    referenceNumber: firstRef,
                    chequeNo: chequeNo.value || '',
                });
            }

            // 4. VAT Withholding Tax (Credit)
            const vatWh = parseFloat(totalVatWithHeldAmount.value || 0);
            if (vatWh > 0 && vatWithHoldingAccountId.value) {
                const vatWithHoldingAccountInfo = accountsList.value.find(x => x.id === vatWithHoldingAccountId.value);
                const vatWhF = getTaxFlag('vatWh');
                const rateVal = vatWhF ? vatWhF.rate : (withHoldingVatPercentage.value || 7);
                lines.push({
                    accountId: vatWithHoldingAccountId.value || emptyGuid,
                    accountDisplay: formatAccountDisplay(vatWithHoldingAccountInfo),
                    description: `VAT withholding · ${rateVal}%`,
                    debitAmount: 0,
                    creditAmount: vatWh,
                    ouId: firstOuId,
                    ouName: firstOuName,
                    referenceNumber: firstRef,
                    chequeNo: chequeNo.value || '',
                });
            }

            // 5. Custom Retentions (Credit)
            retentionsList.value.forEach(r => {
                const rAmt = parseFloat(r.totalAmount || 0);
                if (rAmt > 0 && r.accountId) {
                    const rAccInfo = accountsList.value.find(x => x.id === r.accountId);
                    lines.push({
                        accountId: r.accountId || emptyGuid,
                        accountDisplay: formatAccountDisplay(rAccInfo),
                        description: r.description ? (r.IsPercentage ? `${r.description} · ${r.amount}%` : r.description) : (r.IsPercentage ? `Retention · ${r.amount}%` : 'Retention'),
                        debitAmount: 0,
                        creditAmount: rAmt,
                        ouId: firstOuId,
                        ouName: firstOuName,
                        referenceNumber: firstRef,
                        chequeNo: chequeNo.value || '',
                    });
                }
            });

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

        function rebuildJournalEntryList() {
            const currencyInfo           = currencyList.value.find(x => x.id === currencyId.value);
            const bankAccountInfo        = bankGlAccountsList.value.find(x => x.id === bankAccountId.value)
                || accountsList.value.find(x => x.id === bankAccountId.value);
            const withHoldingAccountInfo = accountsList.value.find(x => x.id === withHoldingAccountId.value);
            const vatWithHoldingAccountInfo = accountsList.value.find(x => x.id === vatWithHoldingAccountId.value);

            const firstOuId = (voucherList.value.find(x => x.ouId && x.ouId !== emptyGuid)?.ouId)
                || (voucherList.value.length ? (voucherList.value[0].ouId || emptyGuid) : emptyGuid);
            const firstRef  = voucherList.value.length ? (voucherList.value[0].referenceNo || batchNo.value) : batchNo.value;

            const commonFields = (accountId, accountInfo, ouId) => {
                const targetOuId = (ouId && ouId !== emptyGuid) ? ouId : firstOuId;
                const ouInfo = costCenterHierachyList.value.find(x => x.id === targetOuId || (x.id && targetOuId && String(x.id).toLowerCase() === String(targetOuId).toLowerCase()));
                return {
                    id: uuid(), accountId, accountName: accountInfo ? accountInfo.accountIdentifier : '',
                    ouId: targetOuId || emptyGuid,
                    ouName: ouInfo ? ouInfo.name : '',
                    transactionDate: voucherEntryDate.value, transactionSource: 'gl',
                    currencyId: currencyId.value,
                    currencyName: currencyInfo ? currencyInfo.currencyName : '',
                    currencyCode: currencyInfo ? currencyInfo.currencyCode : '',
                    buyRate: currencyInfo ? currencyInfo.buyRate : '',
                    sellRate: currencyInfo ? currencyInfo.sellRate : '',
                    pettyCashReceipientId: emptyGuid, chequeNo: chequeNo.value || '--',
                    referenceNumber: batchNo.value,
                };
            };

            const lines = [];
            voucherList.value.forEach(v => {
                const debitAccountInfo = accountsList.value.find(x => x.id === v.accountId);
                const debitAmount = parseFloat(v.localDebitAmount || v.debitAmount || 0);
                const rowOuInfo = costCenterHierachyList.value.find(x => x.id === v.ouId || (x.id && v.ouId && String(x.id).toLowerCase() === String(v.ouId).toLowerCase()));
                lines.push({
                    ...commonFields(v.accountId, debitAccountInfo, v.ouId),
                    ouName: rowOuInfo ? rowOuInfo.name : (v.ouName && v.ouName !== '--' ? v.ouName : (commonFields(v.accountId, debitAccountInfo, v.ouId).ouName)),
                    invoiceNo: v.invoiceNo,
                    referenceNumber: v.referenceNo || batchNo.value,
                    description: `Voucher (#${batchNo.value}) Cheque No.: ${chequeNo.value || 'N/A'} - ${v.description || ''}`.trim(),
                    debitAmount,
                    creditAmount: 0
                });
            });

            const netAmount = parseFloat(totalNetAmount.value || 0);
            if (netAmount !== 0) {
                lines.push({
                    ...commonFields(bankAccountId.value, bankAccountInfo, firstOuId),
                    invoiceNo: '',
                    referenceNumber: firstRef,
                    description: chequeNo.value ? `Voucher (#${batchNo.value}) Cheque No.: ${chequeNo.value}` : `Voucher (#${batchNo.value})`,
                    debitAmount: 0,
                    creditAmount: netAmount
                });
            }

            const vatWh = parseFloat(totalVatWithHeldAmount.value || 0);
            if (vatWh > 0 && vatWithHoldingAccountId.value) {
                const vatWhF = getTaxFlag('vatWh');
                lines.push({
                    ...commonFields(vatWithHoldingAccountId.value, vatWithHoldingAccountInfo, firstOuId),
                    invoiceNo: '',
                    referenceNumber: firstRef,
                    description: `${vatWhF ? vatWhF.rate : 0}% withholding VAT`,
                    debitAmount: 0,
                    creditAmount: vatWh
                });
            }

            const wh = parseFloat(totalWithHeldAmount.value || 0);
            if (wh > 0 && withHoldingAccountId.value) {
                lines.push({
                    ...commonFields(withHoldingAccountId.value, withHoldingAccountInfo, firstOuId),
                    invoiceNo: '',
                    referenceNumber: firstRef,
                    description: `${parseFloat(withHoldingRate.value || 0)}% Withholding Tax`,
                    debitAmount: 0,
                    creditAmount: wh
                });
            }

            retentionsList.value.forEach(r => {
                const rAmt = parseFloat(r.totalAmount || 0);
                if (rAmt > 0 && r.accountId) {
                    const rAccInfo = accountsList.value.find(x => x.id === r.accountId);
                    lines.push({
                        ...commonFields(r.accountId, rAccInfo, firstOuId),
                        invoiceNo: '',
                        referenceNumber: firstRef,
                        description: r.description ? (r.IsPercentage ? `${r.description} · ${r.amount}%` : r.description) : (r.IsPercentage ? `Retention · ${r.amount}%` : 'Retention'),
                        debitAmount: 0,
                        creditAmount: rAmt,
                    });
                }
            });

            journalEntryList.value = lines;
        }

        async function saveJournal() {
            rebuildJournalEntryList();
            const vatWhAmt = parseFloat(totalVatWithHeldAmount.value || 0);
            const whAmt    = parseFloat(totalWithHeldAmount.value    || 0);
            const retAmt   = parseFloat(totalRetentionCredit.value   || 0);
            const payload  = {
                batchNumber: batchNo.value,
                batchDate: voucherEntryDate.value,
                isTemporary: true,
                totalCredit: totalNetAmount.value + vatWhAmt + whAmt + retAmt,
                totalDebit: totalDebit.value,
                id: emptyGuid,
                transactionSource: "GL",
                journalDetails: journalEntryList.value
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

        // ── Save ──────────────────────────────────────────────────────
        function validate() {
            errors.employeeId       = !employeeId.value;
            errors.voucherEntryDate = !voucherEntryDate.value;
            errors.bankAccountId    = !bankAccountId.value;
            errors.currencyId       = !currencyId.value;
            errors.paymentDate      = !paymentDate.value;
            return !Object.values(errors).some(Boolean);
        }

        /**
         * Builds the payload matching the revised C# Voucher model in GeneralLedgerModelCollection.cs.
         * Contains root header properties and the decomposed child cards:
         *   - details:                List<GlVoucherDetail> (Transaction Lines)
         *   - withholdingSettings:    WithholdingSettings (WH inputs, tax flags, summary)
         *   - retentions:             List<VoucherRetentionDto> (Retentions)
         *   - proposedJournalEntries: ProposedJournalEntry (Proposed Journal lines, balance, totals)
         */
        function buildVoucherPayload() {
            rebuildJournalEntryList();

            const employeeInfo           = employeeList.value.find(a => a.id === employeeId.value);
            const bankAccountInfo        = bankGlAccountsList.value.find(a => a.id === bankAccountId.value) || accountsList.value.find(a => a.id === bankAccountId.value);
            const withHoldingAccountInfo = accountsList.value.find(a => a.id === withHoldingAccountId.value);
            const vatWithHoldingAccountInfo = accountsList.value.find(a => a.id === vatWithHoldingAccountId.value);
            const currencyInfo           = currencyList.value.find(a => a.id === currencyId.value);

            // 1. Details (List<GlVoucherDetail>)
            const details = voucherList.value.map(v => {
                const debitAccountInfo = accountsList.value.find(a => a.id === v.accountId);
                const ouInfo = costCenterHierachyList.value.find(x => x.id === v.ouId);
                return {
                    id:                 (v.id && v.id !== emptyGuid) ? v.id : uuid(),
                    withHold:           Boolean(v.withHold),
                    invoiceNo:          v.invoiceNo || '',
                    referenceNo:        v.referenceNo || '',
                    accountId:          v.accountId,
                    debitAccountName:   debitAccountInfo ? debitAccountInfo.accountIdentifier : (v.debitAccountName || ''),
                    description:        v.description || '',
                    localDebitAmount:   parseFloat(v.localDebitAmount || 0),
                    foreignDebitAmount: parseFloat(v.foreignDebitAmount || 0),
                    ouId:               v.ouId ? v.ouId : emptyGuid,
                    ouName:             ouInfo ? ouInfo.name : (v.ouName || '--'),
                    hasImprest:         Boolean(v.hasImprest),
                };
            });

            // 2. Withholding Settings & Summary (WithholdingSettings)
            const withholdingSettings = {
                hasWithHolding:            Boolean(hasWithHolding.value),
                withHoldingRate:           parseFloat(withHoldingRate.value || 0),
                taxType:                   taxType.value || '',
                withHoldingAccountId:      withHoldingAccountId.value || emptyGuid,
                withHoldingAccountName:    withHoldingAccountInfo ? withHoldingAccountInfo.accountIdentifier : '',
                vatWithHoldingAccountId:   vatWithHoldingAccountId.value || emptyGuid,
                vatWithHoldingAccountName: vatWithHoldingAccountInfo ? vatWithHoldingAccountInfo.accountIdentifier : '',
                totalVatAmount:            parseFloat(totalVatAmount.value || 0),
                baseAmount:                parseFloat(amountWithoutTaxes.value || 0),
                taxFlags: taxFlags.map(t => {
                    const gross = parseFloat(totalDebit.value || 0);
                    const amt = t.enabled && t.rate ? parseFloat(((gross * t.rate) / 100).toFixed(4)) : 0;
                    return {
                        key:     t.key,
                        label:   t.label,
                        enabled: Boolean(t.enabled),
                        rate:    parseFloat(t.rate || 0),
                        amount:  amt,
                    };
                }),
                summary: {
                    grossAmount:      parseFloat(totalDebit.value || 0),
                    totalWithheld:    parseFloat(totalWithHeldAmount.value || 0),
                    totalRetained:    parseFloat(totalRetentionCredit.value || 0),
                    totalVatWithheld: parseFloat(totalVatWithHeldAmount.value || 0),
                    netAmount:        parseFloat(totalNetAmount.value || 0),
                },
            };

            // 3. Retentions (List<VoucherRetentionDto>)
            const retentions = retentionsList.value.map(r => {
                const creditAccountInfo = accountsList.value.find(a => a.id === r.accountId);
                return {
                    id:                (r.id && r.id !== emptyGuid) ? r.id : uuid(),
                    description:       r.description || '',
                    voucherHeaderId:   voucherId.value || emptyGuid,
                    creditAccountId:   r.accountId,
                    creditAccountName: creditAccountInfo ? creditAccountInfo.accountIdentifier : (r.creditAccountName || ''),
                    amount:            parseFloat(r.amount || 0),
                    isPercentage:      Boolean(r.IsPercentage),
                    totalAmount:       parseFloat(r.totalAmount || 0),
                };
            });

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
                employeeId:       employeeId.value || emptyGuid,
                employeeName:     employeeInfo ? employeeInfo.employeeName : '',
                customerId:       emptyGuid,
                customerName:     '',
                voucherType:      'employee',
                voucherEntryDate: voucherEntryDate.value,
                bankAccountId:    bankAccountId.value || emptyGuid,
                bankAccountName:  bankAccountInfo ? bankAccountInfo.accountIdentifier : '',
                bankGlAccountName: bankAccountInfo ? bankAccountInfo.accountName : '',
                bankId:           emptyGuid,
                bankName:         '',
                currencyId:       currencyId.value,
                currencyName:     currencyInfo ? currencyInfo.currencyName : '',
                currencyCode:     currencyInfo ? currencyInfo.currencyCode : '',
                currencyRate:     currencyRate.value != null ? parseFloat(currencyRate.value) : 1,
                isMultiCurrency:  Boolean(isMultiCurrency.value),
                modePayment:      modePayment.value,
                paymentDate:      paymentDate.value,
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

        async function saveVoucher(andPreview = false) {
            showSaveMenu.value = false;
            if (isRecordCreated.value && !andPreview) { createNewVoucher(); return; }
            if (!validate()) { toastHandler('warning', 'Please fill in all required fields.'); return; }
            if (!voucherList.value.length) { toastHandler('warning', 'Payment voucher has no transactions.'); return; }

            isLoading.value = true;

            const payload = buildVoucherPayload();
            const endpoint = isEditMode.value ? `/GeneralLedger/UpdateVoucher?id=${voucherId.value}` : '/GeneralLedger/CreateVoucher';

            try {
                let res;
                try {
                    res = await axios.post(endpoint, payload);
                } catch (apiErr) {
                }

                const createdId = res.data?.id || res.data?.result?.id || voucherId.value;
                if (createdId && createdId !== emptyGuid) {
                    voucherId.value = createdId;
                    isRecordCreated.value = true;
                }
                toastHandler('success', `Employee Payment voucher ${isEditMode.value ? 'updated' : 'saved'}.`);
                await saveJournal();

                if (andPreview && createdId) {
                    await openPreviewModal(null, true);
                } else {
                    setTimeout(() => {
                        window.location.href = '/GeneralLedger/Vouchers?tab=employee';
                    }, 1200);
                }
            } catch (err) {
                console.error('Save voucher error:', err);
                toastHandler('error', `Unable to ${isEditMode.value ? 'update' : 'create'} employee payment voucher.`);
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
                if (!companyName.value) {
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
                    const employeeInfo = employeeList.value.find(a => a.id === employeeId.value);
                    const empName = employeeInfo ? (employeeInfo.name || employeeInfo.fullName || `${employeeInfo.firstName || ''} ${employeeInfo.lastName || ''}`.trim()) : '';
                    const bankAccountInfo = bankGlAccountsList.value.find(a => a.id === bankAccountId.value)
                        || accountsList.value.find(a => a.id === bankAccountId.value);
                    const bankAccountDisplayName = bankAccountInfo ? bankAccountInfo.accountIdentifier : '';
                    const bankGlDisplayName = bankAccountInfo ? (bankAccountInfo.accountIdentifier || bankAccountInfo.accountName) : '';

                    const vatWhF = getTaxFlag('vatWh');
                    const getflF = getTaxFlag('getfl');
                    const vatF   = getTaxFlag('vat');
                    const nhilF  = getTaxFlag('nhil');
                    const cstF   = getTaxFlag('cst');
                    const covidF = getTaxFlag('covid');

                    voucherData = {
                        id: voucherId.value || 'draft',
                        batchNo: batchNo.value || 'Draft',
                        voucherNumber: batchNo.value || 'Draft',
                        voucherEntryDate: voucherEntryDate.value,
                        paymentDate: paymentDate.value,
                        voucherType: 'employee',
                        employeeName: empName,
                        payeeName: empName,
                        bankAccountName: bankAccountDisplayName,
                        bankGlAccountName: bankGlDisplayName,
                        modePayment: modePayment.value,
                        chequeNo: chequeNo.value,
                        currencyCode: currencyCode.value,
                        grossAmount: totalDebit.value,
                        netAmount: totalNetAmount.value,
                        totalWithheld: totalWithHeldAmount.value,
                        totalVatWithheld: totalVatWithHeldAmount.value,
                        totalRetained: totalRetentionCredit.value,
                        hasWithHolding: hasWithHolding.value,
                        withHoldingRate: parseFloat(withHoldingRate.value || 0),
                        hasVatWithhold: vatWhF ? vatWhF.enabled : false,
                        withHoldingVatPercentage: vatWhF ? vatWhF.rate : 0,
                        hasNationalHealthInsuranceLevy: nhilF ? nhilF.enabled : false,
                        nationalHealthInsuranceLevyRate: nhilF ? nhilF.rate : 0,
                        hasGetFundLevy: getflF ? getflF.enabled : false,
                        getFundLevyRate: getflF ? getflF.rate : 0,
                        hasVat: vatF ? vatF.enabled : false,
                        vatRate: vatF ? vatF.rate : 0,
                        hasCommunicationServiceTax: cstF ? cstF.enabled : false,
                        communicationServiceTaxRate: cstF ? cstF.rate : 0,
                        hasCovidTax: covidF ? covidF.enabled : false,
                        covidTaxRate: covidF ? covidF.rate : 0,
                        taxFlags: taxFlags,
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
                        retensions: retentionsList.value,
                    };
                } else {
                    const wh = voucherData.withholdingSettings || {};
                    const whSummary = wh.summary || {};
                    const employeeInfo = employeeList.value.find(a => a.id === voucherData.employeeId);
                    const empName = voucherData.employeeName || (employeeInfo ? (employeeInfo.name || employeeInfo.fullName || `${employeeInfo.firstName || ''} ${employeeInfo.lastName || ''}`.trim()) : '');
                    if (!voucherData.payeeName) {
                        voucherData.payeeName = empName || voucherData.employeeName || '';
                    }
                    if (!voucherData.employeeName && empName) {
                        voucherData.employeeName = empName;
                    }
                    if (!voucherData.voucherType) {
                        voucherData.voucherType = 'employee';
                    }
                    if (!voucherData.batchNo && voucherData.voucherNumber) {
                        voucherData.batchNo = voucherData.voucherNumber;
                    }
                    if (voucherData.hasWithHolding === undefined && wh.hasWithHolding !== undefined) {
                        voucherData.hasWithHolding = wh.hasWithHolding;
                    }
                    if (voucherData.withHoldingRate === undefined && wh.withHoldingRate !== undefined) {
                        voucherData.withHoldingRate = wh.withHoldingRate;
                    }
                    if (!voucherData.taxFlags && wh.taxFlags) {
                        voucherData.taxFlags = wh.taxFlags;
                    }
                    if (voucherData.totalWithheld === undefined && whSummary.totalWithheld !== undefined) {
                        voucherData.totalWithheld = whSummary.totalWithheld;
                    }
                    if (voucherData.totalVatWithheld === undefined && whSummary.totalVatWithheld !== undefined) {
                        voucherData.totalVatWithheld = whSummary.totalVatWithheld;
                    }
                    if (voucherData.totalRetained === undefined && whSummary.totalRetained !== undefined) {
                        voucherData.totalRetained = whSummary.totalRetained;
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
                    if (!voucherData.retensions && voucherData.retentions) {
                        voucherData.retensions = voucherData.retentions;
                    }
                }

                previewBatchNo.value = voucherData.batchNo || voucherData.voucherNumber || batchNo.value || '';

                const wh = voucherData.withholdingSettings || {};
                const whSummary = wh.summary || {};
                const gross       = parseFloat(whSummary.grossAmount != null ? whSummary.grossAmount : (voucherData.grossAmount != null ? voucherData.grossAmount : (totalDebit.value || 0)));
                const net         = parseFloat(whSummary.netAmount != null ? whSummary.netAmount : (voucherData.netAmount != null ? voucherData.netAmount : (totalNetAmount.value || 0)));
                const withheld    = parseFloat(whSummary.totalWithheld != null ? whSummary.totalWithheld : (voucherData.totalWithheld != null ? voucherData.totalWithheld : (totalWithHeldAmount.value || 0)));
                const vatWithheld = parseFloat(whSummary.totalVatWithheld != null ? whSummary.totalVatWithheld : (voucherData.totalVatWithheld != null ? voucherData.totalVatWithheld : (totalVatWithHeldAmount.value || 0)));
                const retained    = parseFloat(whSummary.totalRetained != null ? whSummary.totalRetained : (voucherData.totalRetained != null ? voucherData.totalRetained : (totalRetentionCredit.value || 0)));

                const tfList = (wh.taxFlags && wh.taxFlags.length) ? wh.taxFlags : taxFlags;
                const getFlag = (k) => tfList.find(x => x.key === k) || getTaxFlag(k);

                const getTaxAmount = (k) => {
                    const f = getFlag(k);
                    if (!f || !f.enabled) return '0.00';
                    if (f.amount != null) return parseFloat(f.amount).toFixed(2);
                    if (f.rate) return ((gross * parseFloat(f.rate)) / 100).toFixed(2);
                    return '0.00';
                };

                const summary = {
                    gross: gross.toFixed(2),
                    net: net.toFixed(2),
                    retained: retained.toFixed(2),
                    incomeWithholding: withheld.toFixed(2),
                    vatWithholding: vatWithheld.toFixed(2),
                    nhil: getTaxAmount('nhil'),
                    getfund: getTaxAmount('getfl'),
                    vat: getTaxAmount('vat'),
                    cst: getTaxAmount('cst'),
                    covid: getTaxAmount('covid'),
                };

                const rep = window.TopazReportViewer.buildVoucherReport(voucherData, summary, companyName.value);
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
            window.location.href = '/GeneralLedger/Vouchers?tab=employee';
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
                }

                if (res?.data && res.data.success === false) {
                    toastHandler('error', res.data.message || res.data.error || 'Unable to post voucher.');
                    isLoading.value = false;
                    return;
                }

                isPosted.value = true;
                toastHandler('success', 'Voucher posted successfully.');
                setTimeout(() => { window.location.href = '/GeneralLedger/Vouchers?tab=employee'; }, 1500);
            } catch {
                isLoading.value = false;
                toastHandler('error', 'Unable to post voucher.');
            }
        }

        function createNewVoucher() {
            resetForm(); isRecordCreated.value = false;
            initPaymentVoucher();
            toastHandler('', 'Form cleared for new voucher entry.');
        }

        function resetForm() {
            voucherId.value = ''; employeeId.value = ''; currencyId.value = '';
            voucherEntryDate.value = moment().format('YYYY-MM-DD');
            paymentDate.value = moment().format('YYYY-MM-DD');
            batchNo.value = ''; chequeNo.value = ''; modePayment.value = 'Cash'; taxType.value = '';
            withHoldingRate.value = 0; withHoldingAccountId.value = ''; vatWithHoldingAccountId.value = '';
            totalVatAmount.value = 0; totalWithHeldAmount.value = 0; totalVatWithHeldAmount.value = 0;
            totalRetentionCredit.value = 0; totalCredit.value = 0; totalDebit.value = 0;
            totalNetAmount.value = 0; amountWithoutTaxes.value = 0;
            hasWithHolding.value = false; isMultiCurrency.value = false; currencyRate.value = null;
            taxFlags.forEach(f => { f.enabled = false; f.rate = 0; });
            voucherList.value = []; retentionsList.value = []; journalEntryList.value = [];
        }

        // ── Watchers ──────────────────────────────────────────────────
        watch(bankAccountId, val => {
            const bankGlAccount = bankGlAccountsList.value.find(a => a.id === val);
            if (bankGlAccount && bankGlAccount.currencyId) {
                currencyId.value = bankGlAccount.currencyId;
                return;
            }
            const account = accountsList.value.find(a => a.id === val);
            if (account && account.currencyId) currencyId.value = account.currencyId;
        });

        watch(currencyId, val => {
            const currency = currencyList.value.find(c => c.id === val);
            if (currency) { currencyRate.value = currency.buyRate ? parseFloat(currency.buyRate).toFixed(2) : null; isMultiCurrency.value = currency.isDefault === false; }
            else { currencyRate.value = null; isMultiCurrency.value = false; }
        });

        watch(withHoldingRate, (newVal) => {
            const val = parseFloat(newVal);
            if (val > 0) {
                lastWithHoldingRate.value = val;
            }
            reComputeVoucherSummary();
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
                const vatWhF = getTaxFlag('vatWh');
                if (vatWhF) vatWhF.defaultRate = withHoldingVatPercentage.value;
            }

            await initPaymentVoucher();

            if (isEditMode.value) await loadVoucherDetails();
            else addVoucherRow();

            document.addEventListener('click', (e) => {
                const wrapper = document.getElementById('saveMenuWrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    showSaveMenu.value = false;
                }
            });
        });

        return {
            isLoading, isShimmerLoading, employeeId, voucherEntryDate, paymentDate, bankAccountId,
            currencyId, currencyRate, isMultiCurrency, modePayment, batchNo, chequeNo,
            taxType, withHoldingRate, withHoldingAccountId, vatWithHoldingAccountId,
            hasWithHolding, voucherId, isEditMode, isRecordCreated, isPosted, showSaveMenu,
            employeeList, accountsList, bankGlAccountsList, currencyList, costCenterHierachyList,
            voucherList, retentionsList, errors, taxFlags,
            totalVatAmount, totalWithHeldAmount, totalVatWithHeldAmount,
            totalRetentionCredit, totalCredit, totalDebit, totalNetAmount, amountWithoutTaxes,
            showPreviewModal, previewReport, previewExporters, previewBatchNo,
            isPreviewLoading, previewError,
            saveButtonText, currencyCode, currencySymbol, proposedJournalEntries, proposedJournalTotals,
            saveVoucher, previewVoucher, postVoucher, addVoucherRow, removeVoucherRow,
            onWithHoldChange, addRetentionRow, removeRetentionRow, onRetentionAmountChange,
            onTaxFlagChange, reComputeVoucherSummary, fmtNum,
            openPreviewModal, closePreviewModal, onBackToVouchers,
        };
    }
}).mount('#app');
