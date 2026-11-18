const { createApp, ref, shallowRef, computed, watch, onMounted, reactive } = Vue;

createApp({
    setup() {
        // ── State ────────────────────────────────────────────────────
        const isLoading = ref(false);
        const emptyGuid = '00000000-0000-0000-0000-000000000000';

        const supplierId    = ref('');
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

        const isShimmerLoading = ref(false);
        const supplierList   = ref([]);
        const accountsList   = ref([]);
        const bankList       = ref([]);
        const bankAccountList = ref([]);
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

        const defaultRates = {
            nationalHealthInsuranceLevyRate: 2.50,
            communicationServiceTaxRate: 5.00,
            vatRate: 15.00,
            getFundLevyRate: 2.50,
            withHoldingVatPercentage: 7.00,
            covidTaxRate: 1.00,
        };

        // Tax flags as reactive array for easy v-for rendering
        const taxFlags = reactive([
            { label: 'GET Fund Levy',          key: 'getfl',   enabled: false, rate: 0, defaultRate: 2.50 },
            { label: 'VAT',                    key: 'vat',     enabled: false, rate: 0, defaultRate: 15.00 },
            { label: 'VAT Withhold',           key: 'vatWh',   enabled: false, rate: 0, defaultRate: 7.00 },
            { label: 'NHIL',                   key: 'nhil',    enabled: false, rate: 0, defaultRate: 2.50 },
            { label: 'Comm. Service Tax',      key: 'cst',     enabled: false, rate: 0, defaultRate: 5.00 },
            { label: 'Covid Tax',              key: 'covid',   enabled: false, rate: 0, defaultRate: 1.00 },
        ]);

        const errors = reactive({
            supplierId: false,
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

        const bankGlList = computed(() => {
            if (bankAccountList.value && bankAccountList.value.length > 0) {
                if (bankAccountId.value && !bankAccountList.value.some(b => b.id === bankAccountId.value)) {
                    const matchedBank = resolveBankAccount(bankAccountId.value);
                    if (matchedBank) {
                        return bankAccountList.value;
                    }
                    const acc = accountsList.value.find(a => a.id === bankAccountId.value);
                    if (acc) return [acc, ...bankAccountList.value];
                }
                return bankAccountList.value;
            }
            return accountsList.value;
        });

        // ── Helpers ───────────────────────────────────────────────────
        function resolveBankAccount(idOrAccountId) {
            if (!idOrAccountId || idOrAccountId === emptyGuid) return null;
            const target = String(idOrAccountId).toLowerCase();
            // 1. Direct match with BankAccount primary key (b.id)
            let bank = bankAccountList.value.find(b => String(b.id).toLowerCase() === target);
            if (bank) return bank;
            // 2. Match with BankAccount.accountId (GL Chart of Accounts foreign key)
            bank = bankAccountList.value.find(b => String(b.accountId).toLowerCase() === target);
            if (bank) return bank;
            return null;
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
            costCenterList.value = dataArr || [];
            const result = [];
            for (const cc of costCenterList.value) {
                costCenterNameList.value = [];
                getHierachyName(cc.id, new Set());
                const name = [...new Set(costCenterNameList.value)].join().replace(/,/g, '/');
                result.push({
                    id: cc.id,
                    name: name || cc.name,
                    parentId: cc.parentId,
                    rawName: cc.name,
                    tenantId: cc.tenantId
                });
            }
            return result;
        }

        function getHierachyName(id, visited = new Set()) {
            if (!id || visited.has(id)) return;
            visited.add(id);
            let parentId, returnName;
            for (const item of costCenterList.value) {
                if (item.id === id) {
                    parentId = item.parentId;
                    returnName = item.name;
                    break;
                }
            }
            if (parentId && parentId !== emptyGuid) getHierachyName(parentId, visited);
            if (returnName) costCenterNameList.value.push(returnName);
        }

        // ── Tax helpers ───────────────────────────────────────────────
        function getTaxFlag(key) { return taxFlags.find(f => f.key === key); }

        function onTaxFlagChange(tax) {
            // CST & Covid are mutually exclusive
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
            } else {
                baseAmount = grossAmount;
            }

            const netAmount        = grossAmount - withHeldAmount - vatWithHeldAmount;
            const amountWithoutTax = withHold ? grossAmount - nhilAmount - getflAmount - vatAmount : 0;

            return {
                grossAmount:       roundNumber(grossAmount),
                baseAmount:        roundNumber(baseAmount),
                nhilAmount:        roundNumber(nhilAmount),
                getflAmount:       roundNumber(getflAmount),
                vatAmount:         roundNumber(vatAmount),
                withHeldAmount:    roundNumber(withHeldAmount),
                vatWithHeldAmount: roundNumber(vatWithHeldAmount),
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

            // Recompute percentage retentions from Net Amount (not original invoice amounts)
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
            totalCredit.value            = roundNumber(totalCredit.value);
            totalVatAmount.value         = roundNumber(totalVatAmount.value);
            totalWithHeldAmount.value    = roundNumber(totalWithHeldAmount.value);
            totalVatWithHeldAmount.value = roundNumber(totalVatWithHeldAmount.value);
            totalNetAmount.value         = roundNumber(totalNetAmount.value);
            amountWithoutTaxes.value     = roundNumber(amountWithoutTaxes.value);
            totalRetentionCredit.value   = roundNumber(totalRetentionCredit.value);
        }

        function onLocalDebitChange(row) {
            if (isMultiCurrency.value) {
                const rate = parseFloat(currencyRate.value || 1);
                const lAmt = parseFloat(row.localDebitAmount || 0);
                if (rate > 0) {
                    row.foreignDebitAmount = roundNumber(lAmt / rate);
                }
            }
            reComputeVoucherSummary();
        }

        function onForeignDebitChange(row) {
            if (isMultiCurrency.value) {
                const rate = parseFloat(currencyRate.value || 1);
                const fAmt = parseFloat(row.foreignDebitAmount || 0);
                if (rate > 0) {
                    row.localDebitAmount = roundNumber(fAmt * rate);
                }
            }
            reComputeVoucherSummary();
        }

        // ── API calls ─────────────────────────────────────────────────
        async function getAccounts() {
            try {
                const res = await axios.get('/GeneralLedger/GetBankGlAccounts');
                const raw = res.data?.result;
                
                raw.forEach(v => {
                    v.accountIdentifier = `${v.accountNo} - ${v.accountName}`;
                });
                accountsList.value = raw;
            } catch (err) {
                console.error('Failed to get account details:', err);
                toastHandler('error', 'Unable to retrieve GL accounts.');
            }
        }

        async function getBankAccounts() {
            try {
                const res = await axios.get('/GeneralLedger/GetBankAccounts?pageNo=1&pageSize=2000');
                const raw = res.data?.result;
                bankAccountList.value = raw.map(b => ({
                    id: b.id,
                    bankAccountId: b.id,
                    accountId: b.accountId,
                    accountNo: b.accountNo,
                    accountName: b.accountName,
                    bankId: b.bankId,
                    bankName: b.bankName,
                    accountIdentifier: `${b.accountNo ? b.accountNo + ' - ' : ''}${b.bankName ? b.bankName + ' ' : ''}(${b.accountName || ''})`.trim() || b.accountName || b.accountNo,
                    currencyId: b.currencyId
                }));

                // If bankAccountId is already set to a GL accountId, sync it to the BankAccount primary key
                if (bankAccountId.value) {
                    const matched = resolveBankAccount(bankAccountId.value);
                    if (matched) {
                        bankAccountId.value = matched.id;
                    }
                }
            } catch (err) {
                console.warn('Bank accounts load error (optional):', err);
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

        async function getSuppliers() {
            try {
                const res = await axios.get('/SharedResource/GetSuppliers?pageNo=1&pageSize=500');
                const raw = res.data?.result;
                supplierList.value = raw;
            } catch (err) {
                console.error('Failed to get suppliers:', err);
                toastHandler('error', 'Unable to retrieve suppliers.');
            }
        }

        async function getBanks() {
            try {
                const res = await axios.get('/SharedResource/GetBanks?pageNo=1&pageSize=1000');
                const raw = res.data?.result;
                bankList.value = raw;
            } catch (err) {
                console.warn('Failed to retrieve commercial banks:', err);
            }
        }

        async function getDefaultGlSetup() {
            try {
                const res = await axios.get('/GeneralLedger/GetDefaultGlNumbersSetup');
                let d = res.data?.result || res.data?.Result || res.data;
                if (Array.isArray(d)) d = d[0];
                if (!d) return;

                const defaultBankId = d.accountPayablesBankAccountId || d.purchasesBankAccountId;
                if (defaultBankId && defaultBankId !== emptyGuid && !bankAccountId.value) {
                    const matchedBank = resolveBankAccount(defaultBankId);
                    if (matchedBank) {
                        bankAccountId.value = matchedBank.id; // Primary key of the bank account record
                        if (matchedBank.currencyId) {
                            currencyId.value = matchedBank.currencyId;
                        }
                    } else {
                        bankAccountId.value = defaultBankId;
                        const accountInfo = accountsList.value.find(a => a.id === defaultBankId);
                        if (accountInfo && accountInfo.currencyId) {
                            currencyId.value = accountInfo.currencyId;
                        }
                    }
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

        /**
         * Formats a system number using its `formatPattern` (e.g. "{PREFIX}{NO}{SUFFIX}").
         * Mirrors the C# implementation exactly:
         *   format = formatPattern ?? "{prefix}{number}{suffix}"
         *   .Replace("{PREFIX}", prefix)
         *   .Replace("{NO}", lastNo.ToString($"D{padding}"))
         *   .Replace("{SUFFIX}", suffix)
         * Also handles the lowercase fallback placeholders {prefix}, {number}, {suffix}.
         * @param {Object} sn  — the system number record from the API
         * @returns {string}
         */
        function applySystemNumberPattern(sn) {
            const prefix  = sn.prefix  != null ? sn.prefix  : '';
            const suffix  = sn.suffix  != null ? sn.suffix  : '';
            const lastNo  = sn.lastNo  != null ? sn.lastNo  : 0;
            const padding = sn.padding != null ? parseInt(sn.padding, 10) : 0;

            // Mirror C# fallback: use lowercase "{prefix}{number}{suffix}" when no pattern
            const pattern = (sn.formatPattern && sn.formatPattern.trim())
                ? sn.formatPattern.trim()
                : '{prefix}{number}{suffix}';

            // Zero-pad using D{padding} equivalent (String.padStart)
            const paddedNo = padding > 0
                ? String(lastNo).padStart(padding, '0')
                : String(lastNo);

            // Replace all placeholder variants (case-insensitive to be safe):
            //   {PREFIX} / {prefix}   → prefix
            //   {NO} / {number}       → paddedNo   (C# uses {NO}; fallback uses {number})
            //   {SUFFIX} / {suffix}   → suffix
            return pattern
                .replace(/\{PREFIX\}/gi, prefix)
                .replace(/\{NO\}/gi, paddedNo)
                .replace(/\{number\}/gi, paddedNo)
                .replace(/\{SUFFIX\}/gi, suffix);
        }

        async function getSystemNumbers() {
            try {
                const res = await axios.get('/SharedResource/GetSystemNumbers');
                const raw = res.data?.result;
                
                const voucherSys = raw.find(s => (s.key && s.key.toLowerCase() === 'gl-voucher-batch-id'));

                if (voucherSys && !batchNo.value) {
                    voucherBatchSystemNumber.value = voucherSys;
                    batchNo.value = applySystemNumberPattern(voucherSys);
                    console.log('batchNo.value->', batchNo.value);
                }

            } catch (err) {
                console.warn('System numbers load error (optional):', err);
            }
        }

        async function loadCompanyProfile() {
            try {
                const res = await axios.get('/GeneralLedger/GetBusinessProfile');
                const prof = res.data?.result;
                companyName.value = prof?.companyName || prof?.businessName;
            } catch (_) {
                companyName.value = '';
            }
        }

        async function initPaymentVoucher() {
            isShimmerLoading.value = true;
            try {
                await Promise.all([
                    getAccounts(),
                    getBankAccounts(),
                    getCostCenters(),
                    getCurrencies(),
                    getSuppliers(),
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
                isShimmerLoading.value = false;
            }
        }

        async function loadVoucherDetails() {
            try {
                let res;
                try {
                    res = await axios.get('/GeneralLedger/GetVoucherDetails?id=' + voucherId.value);
                } catch {
                     console.error('Voucher initialization failed.');
                }

                // Decompose the revised Voucher model (result or direct object)
                const v = res.data?.result || res.data?.voucherInfo || res.data;
                if (!v) return;

                // ── 1. Root Voucher Header Fields ─────────────────────────────
                if (v.id && v.id !== emptyGuid) voucherId.value = v.id;
                if (v.supplierId && v.supplierId !== emptyGuid) supplierId.value = v.supplierId;
                const matchedBank = resolveBankAccount(v.bankAccountId);
                bankAccountId.value = matchedBank ? matchedBank.id : (v.bankAccountId || '');
                currencyId.value = v.currencyId || '';
                currencyRate.value = v.currencyRate != null ? v.currencyRate : null;
                isMultiCurrency.value = Boolean(v.isMultiCurrency);
                modePayment.value = v.modePayment || v.modeOfPayment || 'Cash';
                voucherEntryDate.value = v.voucherEntryDate ? moment(v.voucherEntryDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
                paymentDate.value = v.paymentDate ? moment(v.paymentDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
                batchNo.value = v.batchNo || '';
                chequeNo.value = v.chequeNo || '';

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
                    localDebitAmount: parseFloat(d.localDebitAmount != null ? d.localDebitAmount : (d.amount || 0)),
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
            } catch {
                toastHandler('error', 'Unable to load voucher details.');
            }
        }

        // ── Row management ────────────────────────────────────────────
        function addVoucherRow() {
            voucherList.value.push({ id: uuid(), withHold: false, invoiceNo: '', referenceNo: '', accountId: '', description: '', localDebitAmount: 0, foreignDebitAmount: 0, ouId: '' });
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

        function removeRetentionRow(idx) {
            retentionsList.value.splice(idx, 1);
            reComputeVoucherSummary();
        }

        function onRetentionAmountChange(row) {
            reComputeVoucherSummary();
        }

        // ── Proposed Journal Entries ─────────────────────────────────
        const proposedJournalEntries = computed(() => {
            const lines = [];

            // 1. Debit lines from voucher lines
            voucherList.value.forEach(v => {
                const debitAccountInfo = accountsList.value.find(x => x.id === v.accountId);
                const debitAmount = parseFloat(v.localDebitAmount || v.amount || 0);
                const ouInfo = costCenterHierachyList.value.find(x => x.id === v.ouId);
                if (v.accountId || debitAmount > 0) {
                    lines.push({
                        accountId: v.accountId || emptyGuid,
                        accountDisplay: formatAccountDisplay(debitAccountInfo),
                        description: v.description || 'Invoice payment',
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
            const matchedBank = resolveBankAccount(bankAccountId.value);
            const glBankAccountId = matchedBank ? (matchedBank.accountId || matchedBank.id) : bankAccountId.value;
            const bankAccountInfo = accountsList.value.find(x => x.id === glBankAccountId)
                || accountsList.value.find(x => x.id === bankAccountId.value)
                || (matchedBank ? { accountNo: matchedBank.accountNo, accountName: matchedBank.accountName } : null);
            const firstOuId = voucherList.value.length ? (voucherList.value[0].ouId || emptyGuid) : emptyGuid;
            const firstOuInfo = costCenterHierachyList.value.find(x => x.id === firstOuId);
            const firstOuName = firstOuInfo ? firstOuInfo.name : '--';
            const firstRef  = voucherList.value.length ? (voucherList.value[0].referenceNo || batchNo.value) : batchNo.value;

            if (bankAccountId.value || netAmount > 0) {
                lines.push({
                    accountId: glBankAccountId || emptyGuid,
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

        // ── Journal rebuild ───────────────────────────────────────────
        function rebuildJournalEntryList() {
            const currencyInfo           = currencyList.value.find(x => x.id === currencyId.value);
            const bankRecord             = resolveBankAccount(bankAccountId.value);
            const glBankAccountId        = bankRecord ? bankRecord.accountId : bankAccountId.value;
            const bankAccountInfo        = accountsList.value.find(x => x.id === glBankAccountId)
                || accountsList.value.find(x => x.id === bankAccountId.value)
                || (bankRecord ? { accountIdentifier: bankRecord.accountIdentifier, accountName: bankRecord.accountName } : null);
            const withHoldingAccountInfo = accountsList.value.find(x => x.id === withHoldingAccountId.value);
            const vatWithHoldingAccountInfo = accountsList.value.find(x => x.id === vatWithHoldingAccountId.value);

            const commonFields = (accountId, accountInfo, ouId) => {
                const ouInfo = costCenterHierachyList.value.find(x => x.id === ouId);
                return {
                    id: uuid(), accountId, accountName: accountInfo ? accountInfo.accountIdentifier : '',
                    ouId, ouName: ouInfo ? ouInfo.name : '',
                    transactionDate: voucherEntryDate.value, transactionSource: 'gl',
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

            voucherList.value.forEach(v => {
                const debitAccountInfo = accountsList.value.find(x => x.id === v.accountId);
                const debitAmount = parseFloat(v.localDebitAmount || v.debitAmount || 0);
                lines.push({
                    ...commonFields(v.accountId, debitAccountInfo, v.ouId),
                    invoiceNo: v.invoiceNo,
                    referenceNumber: v.referenceNo || batchNo.value,
                    description: `Voucher (#${batchNo.value}) Cheque No.: ${chequeNo.value || 'N/A'} - ${v.description || ''}`.trim(),
                    debitAmount, creditAmount: 0,
                });
            });

            const firstOuId = voucherList.value.length ? voucherList.value[0].ouId : null;
            const firstRef  = voucherList.value.length ? (voucherList.value[0].referenceNo || batchNo.value) : batchNo.value;

            const netAmount = parseFloat(totalNetAmount.value || 0);
            if (netAmount !== 0) {
                lines.push({ ...commonFields(glBankAccountId, bankAccountInfo, firstOuId), invoiceNo: '', referenceNumber: firstRef, description: chequeNo.value ? `Voucher (#${batchNo.value}) Cheque No.: ${chequeNo.value}` : `Voucher (#${batchNo.value})`, debitAmount: 0, creditAmount: netAmount });
            }

            const vatWh = parseFloat(totalVatWithHeldAmount.value || 0);
            if (vatWh > 0 && vatWithHoldingAccountId.value) {
                const vatWhF = getTaxFlag('vatWh');
                lines.push({ ...commonFields(vatWithHoldingAccountId.value, vatWithHoldingAccountInfo, firstOuId), invoiceNo: '', referenceNumber: firstRef, description: `${vatWhF ? vatWhF.rate : 0}% withholding VAT`, debitAmount: 0, creditAmount: vatWh });
            }

            const wh = parseFloat(totalWithHeldAmount.value || 0);
            if (wh > 0 && withHoldingAccountId.value) {
                lines.push({ ...commonFields(withHoldingAccountId.value, withHoldingAccountInfo, firstOuId), invoiceNo: '', referenceNumber: firstRef, description: `${parseFloat(withHoldingRate.value || 0)}% Withholding Tax`, debitAmount: 0, creditAmount: wh });
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
                batchNumber: batchNo.value, batchDate: voucherEntryDate.value, isTemporary: true,
                totalCredit: totalNetAmount.value + vatWhAmt + whAmt + retAmt,
                totalDebit: totalDebit.value,
                id: voucherId.value,
                journalDetails: journalEntryList.value,
            };
            
            try {
                await axios.post('/GeneralLedger/SaveJournal', payload);
                journalEntryList.value = [];
                isLoading.value = false;
                
                if (voucherId.value) {
                    axios.get('/LedgerDataEntry/GetVoucherDetails?id=' + voucherId.value).then(res => {
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
            errors.supplierId       = !supplierId.value;
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

            const supplierInfo           = supplierList.value.find(a => a.id === supplierId.value);
            const bankRecord             = resolveBankAccount(bankAccountId.value);
            const payloadBankAccountId   = bankRecord ? bankRecord.id : bankAccountId.value;
            const glBankAccountId        = bankRecord ? bankRecord.accountId : bankAccountId.value;
            const bankAccountInfo        = accountsList.value.find(a => a.id === glBankAccountId)
                || accountsList.value.find(a => a.id === bankAccountId.value);
            const withHoldingAccountInfo = accountsList.value.find(a => a.id === withHoldingAccountId.value);
            const vatWithHoldingAccountInfo = accountsList.value.find(a => a.id === vatWithHoldingAccountId.value);
            const currencyInfo           = currencyList.value.find(a => a.id === currencyId.value);

            // 1. Details (List<GlVoucherDetail>)
            const details = voucherList.value.map(v => {
                const debitAccountInfo = accountsList.value.find(a => a.id === v.accountId);
                const ouInfo = costCenterHierachyList.value.find(a => a.id === v.ouId);
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
                supplierId:       supplierId.value || emptyGuid,
                supplierName:     supplierInfo ? supplierInfo.name : '',
                employeeId:       emptyGuid,
                employeeName:     '',
                customerId:       emptyGuid,
                customerName:     '',
                voucherType:      'supplier',
                voucherEntryDate: voucherEntryDate.value,
                bankAccountId:    payloadBankAccountId,
                bankAccountName:  bankRecord ? bankRecord.accountIdentifier : (bankAccountInfo ? bankAccountInfo.accountIdentifier : ''),
                bankGlAccountName: bankAccountInfo ? bankAccountInfo.accountName : (bankRecord?.accountName || ''),
                bankId:           bankRecord?.bankId || emptyGuid,
                bankName:         bankRecord?.bankName || '',
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
                const res = await axios.post(endpoint, payload);
                const createdId = res.data?.id || res.data?.result?.id || voucherId.value;
                if (createdId && createdId !== emptyGuid) {
                    voucherId.value = createdId;
                    isRecordCreated.value = true;
                }
                toastHandler('success', `Supplier Payment voucher ${isEditMode.value ? 'updated' : 'saved'}.`);
                await saveJournal();

                if (andPreview) {
                    await openPreviewModal(null, true);
                } else {
                    setTimeout(() => {
                        window.location.href = '/GeneralLedger/Vouchers?tab=supplier';
                    }, 1200);
                }
            } catch (err) {
                console.error('Save voucher error:', err);
                toastHandler('error', `Unable to ${isEditMode.value ? 'update' : 'create'} supplier payment voucher.`);
            } finally {
                isLoading.value = false;
            }
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
                // Only fetch from the API when explicitly allowed (e.g. standalone "Preview" button)
                if (!voucherData && !skipApiFetch && voucherId.value) {
                    try {
                        const res = await axios.get('/LedgerDataEntry/GetVoucherDetails?id=' + voucherId.value);
                        voucherData = res.data?.voucherInfo || res.data;
                    } catch (_) {}
                }

                if (!voucherData) {
                    const supplierInfo = supplierList.value.find(a => a.id === supplierId.value);
                    const bankRecord = resolveBankAccount(bankAccountId.value);
                    const glBankAccountId = bankRecord ? bankRecord.accountId : bankAccountId.value;
                    const bankAccountInfo = accountsList.value.find(a => a.id === glBankAccountId)
                        || accountsList.value.find(a => a.id === bankAccountId.value);
                    const bankAccountDisplayName = bankRecord ? bankRecord.accountIdentifier : (bankAccountInfo ? bankAccountInfo.accountIdentifier : '');
                    const bankGlDisplayName = bankAccountInfo ? (bankAccountInfo.accountIdentifier || bankAccountInfo.accountName) : (bankRecord?.accountIdentifier || bankRecord?.accountName || '');

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
                        supplierName: supplierInfo ? supplierInfo.name : '',
                        payeeName: supplierInfo ? supplierInfo.name : '',
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
                }

                previewBatchNo.value = voucherData.batchNo || voucherData.voucherNumber || batchNo.value || '';

                const gross    = parseFloat(voucherData.grossAmount != null ? voucherData.grossAmount : (totalDebit.value || 0));
                const net      = parseFloat(voucherData.netAmount != null ? voucherData.netAmount : (totalNetAmount.value || 0));
                const withheld = parseFloat(voucherData.totalWithheld != null ? voucherData.totalWithheld : (totalWithHeldAmount.value || 0));
                const vatWithheld = parseFloat(voucherData.totalVatWithheld != null ? voucherData.totalVatWithheld : (totalVatWithHeldAmount.value || 0));
                const retained = parseFloat(voucherData.totalRetained != null ? voucherData.totalRetained : (totalRetentionCredit.value || 0));

                const nhilF  = getTaxFlag('nhil');
                const getflF = getTaxFlag('getfl');
                const vatF   = getTaxFlag('vat');
                const cstF   = getTaxFlag('cst');
                const covidF = getTaxFlag('covid');

                const nhilAmt  = (nhilF  && nhilF.enabled  && nhilF.rate)  ? ((gross * nhilF.rate)  / 100).toFixed(2) : '0.00';
                const getflAmt = (getflF && getflF.enabled && getflF.rate) ? ((gross * getflF.rate) / 100).toFixed(2) : '0.00';
                const vatAmt   = (vatF   && vatF.enabled   && vatF.rate)   ? ((gross * vatF.rate)   / 100).toFixed(2) : '0.00';
                const cstAmt   = (cstF   && cstF.enabled   && cstF.rate)   ? ((gross * cstF.rate)   / 100).toFixed(2) : '0.00';
                const covidAmt = (covidF && covidF.enabled && covidF.rate) ? ((gross * covidF.rate) / 100).toFixed(2) : '0.00';

                const summary = {
                    gross: gross.toFixed(2),
                    net: net.toFixed(2),
                    retained: retained.toFixed(2),
                    incomeWithholding: withheld.toFixed(2),
                    vatWithholding: vatWithheld.toFixed(2),
                    nhil: nhilAmt,
                    getfund: getflAmt,
                    vat: vatAmt,
                    cst: cstAmt,
                    covid: covidAmt,
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
            window.location.href = '/GeneralLedger/Vouchers?tab=supplier';
        }

        function createNewVoucher() {
            resetForm();
            isRecordCreated.value = false;
            initPaymentVoucher();
            toastHandler('', 'Form cleared for new voucher entry.');
        }

        function resetForm() {
            voucherId.value = ''; supplierId.value = ''; currencyId.value = '';
            voucherEntryDate.value = moment().format('YYYY-MM-DD');
            paymentDate.value   = moment().format('YYYY-MM-DD');
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
            const bankRecord = resolveBankAccount(val);
            if (bankRecord && bankRecord.currencyId) {
                currencyId.value = bankRecord.currencyId;
                return;
            }
            const account = accountsList.value.find(a => a.id === val);
            if (account && account.currencyId) {
                currencyId.value = account.currencyId;
            }
        });

        watch(currencyId, val => {
            const currency = currencyList.value.find(c => c.id === val || String(c.id).toLowerCase() === String(val).toLowerCase());
            if (currency) {
                const buyRate = currency.buyRate !== undefined ? currency.buyRate 
                    : (currency.BuyRate !== undefined ? currency.BuyRate 
                    : (currency.rates?.[0]?.buyingRate || currency.rates?.[0]?.BuyingRate || (currency.isDefault ? 1 : null)));
                currencyRate.value  = buyRate != null ? parseFloat(buyRate).toFixed(2) : null;
                isMultiCurrency.value = currency.isDefault === false;
            } else {
                currencyRate.value = null;
                isMultiCurrency.value = false;
            }
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
            }
            if (typeof window.withHoldingVatPercentage !== 'undefined') {
                withHoldingVatPercentage.value = parseFloat(window.withHoldingVatPercentage) || 7;
                const vatWhF = getTaxFlag('vatWh');
                if (vatWhF) vatWhF.defaultRate = withHoldingVatPercentage.value;
            }

            await initPaymentVoucher();

            if (isEditMode.value) await loadVoucherDetails();
            else if (!voucherList.value.length) addVoucherRow();

            document.addEventListener('click', (e) => {
                const wrapper = document.getElementById('saveMenuWrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    showSaveMenu.value = false;
                }
            });
        });

        return {
            // state
            isLoading, isShimmerLoading, supplierId, voucherEntryDate, paymentDate, bankAccountId,
            currencyId, currencyRate, isMultiCurrency, modePayment, batchNo, chequeNo,
            taxType, withHoldingRate, withHoldingAccountId, vatWithHoldingAccountId,
            hasWithHolding, voucherId, isEditMode, isRecordCreated, showSaveMenu,
            supplierList, accountsList, bankAccountList, bankGlList, currencyList, costCenterHierachyList,
            voucherList, retentionsList, errors, taxFlags,
            totalVatAmount, totalWithHeldAmount, totalVatWithHeldAmount,
            totalRetentionCredit, totalCredit, totalDebit, totalNetAmount, amountWithoutTaxes,
            showPreviewModal, previewReport, previewExporters, previewBatchNo,
            isPreviewLoading, previewError,
            // computed
            saveButtonText, currencyCode, currencySymbol, proposedJournalEntries, proposedJournalTotals,
            // methods
            saveVoucher, buildVoucherPayload, addVoucherRow, removeVoucherRow,
            onWithHoldChange, addRetentionRow, removeRetentionRow, onRetentionAmountChange,
            onLocalDebitChange, onForeignDebitChange,
            onTaxFlagChange, reComputeVoucherSummary, fmtNum,
            openPreviewModal, closePreviewModal, onBackToVouchers,
        };
    }
}).mount('#app');
