const { createApp, ref, computed, watch, onMounted, reactive } = Vue;

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
        const withHoldingAccountId    = ref('');
        const vatWithHoldingAccountId = ref('');
        const hasWithHolding = ref(false);

        const voucherId       = ref('');
        const isEditMode      = ref(false);
        const isRecordCreated = ref(false);
        const proposedJournalHeaderId  = ref('');
        const proposedJournalDetailIdList = ref([]);

        const supplierList   = ref([]);
        const accountsList   = ref([]);
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

        function toastHandler(type, message = 'An unexpected error occurred.') {
            toastr.options = { closeButton: true, progressBar: true, showMethod: 'fadeIn', hideMethod: 'fadeOut', timeOut: 10000 };
            if (type === 'warning') toastr.warning('', message);
            else if (type === 'error') toastr.error('', message);
            else toastr.success('', message);
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
            const nhilRate  = nhil  ? parseFloat(nhil.rate  || 0) : 0;
            const getflRate = getfl ? parseFloat(getfl.rate || 0) : 0;
            const vatRate   = vat   ? parseFloat(vat.rate   || 0) : 0;
            const withholdingRate    = parseFloat(withHoldingRate.value || 0);
            const withHoldingVatRate = vatWh ? parseFloat(vatWh.rate || 0) : 0;

            let baseAmount = grossAmount;
            let nhilAmount = 0, getflAmount = 0, vatAmount = 0, withHeldAmount = 0, vatWithHeldAmount = 0;

            if (withHold) {
                const totalRate = nhilRate + getflRate + vatRate;
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

            voucherList.value.forEach(tx => {
                const debitAmount = parseFloat(tx.localDebitAmount || tx.debitAmount || 0);
                totalDebit.value += debitAmount;
                const bd = calculateVoucherBreakdown(debitAmount, tx.withHold);
                totalVatAmount.value         += bd.vatAmount;
                totalWithHeldAmount.value    += bd.withHeldAmount;
                totalVatWithHeldAmount.value += bd.vatWithHeldAmount || 0;
                totalNetAmount.value         += bd.netAmount;
                amountWithoutTaxes.value     += bd.amountWithoutTaxes;
            });

            totalRetentionCredit.value = retentionsList.value.reduce((s, r) => s + parseFloat(r.totalAmount || 0), 0);
            totalNetAmount.value      -= parseFloat(totalRetentionCredit.value || 0);
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

        // ── API calls ─────────────────────────────────────────────────
        async function initPaymentVoucher() {
            try {
                const res = await axios.get('/LedgerDataEntry/InitSupplierPvEntry');
                res.data.accounts.forEach(v => { v.accountIdentifier = `${v.accountNo} - ${v.accountName}`; });
                accountsList.value = res.data.accounts;
                costCenterHierachyList.value = parseCostCenterHierachy(res.data.costCenters);
                voucherBatchSystemNumber.value = res.data.voucherBatchSystemNumber;
                batchNo.value = `${res.data.voucherBatchSystemNumber.prefix}${res.data.voucherBatchSystemNumber.lastNo}${res.data.voucherBatchSystemNumber.suffix}`;
                const defaultBankId = res.data.defaultGlNumbers.accountPayablesBankAccountId;
                bankAccountId.value = defaultBankId;
                const accountInfo = accountsList.value.find(a => a.id === defaultBankId);
                if (accountInfo && accountInfo.currencyId) currencyId.value = accountInfo.currencyId;
            } catch {
                toastHandler('error', 'Voucher initialization failed.');
            }
        }

        async function getSuppliers() {
            try {
                const res = await axios.get('/SharedResource/GetSuppliers');
                supplierList.value = res.data;
            } catch { toastHandler('error', 'Unable to retrieve suppliers.'); }
        }

        async function getBanks() {
            try {
                const res = await axios.get('/SharedResource/GetBanks');
                bankList.value = res.data;
            } catch { toastHandler('error', 'Unable to retrieve banks.'); }
        }

        async function getCurrencies() {
            try {
                const res = await axios.get('/SharedResource/GetCurrencys');
                currencyList.value = res.data;
            } catch { toastHandler('error', 'Unable to retrieve currencies.'); }
        }

        async function loadVoucherDetails() {
            try {
                const res = await axios.get('/LedgerDataEntry/GetVoucherDetails?id=' + voucherId.value);
                const data = res.data.voucherInfo;
                proposedJournalHeaderId.value   = res.data.proposedJournalHeader.id;
                proposedJournalDetailIdList.value = res.data.proposedJournalDetails.map(a => a.id);

                supplierId.value    = data.supplierId;
                bankAccountId.value = data.bankAccountId;
                currencyId.value    = data.currencyId;
                withHoldingAccountId.value    = data.withHoldingAccountId;
                vatWithHoldingAccountId.value = data.vatWithHoldingAccountId;
                modePayment.value   = data.modeOfPayment;
                voucherEntryDate.value = moment(data.voucherEntryDate).format('YYYY-MM-DD');
                paymentDate.value   = moment(data.paymentDate).format('YYYY-MM-DD');
                batchNo.value       = data.batchNo;
                chequeNo.value      = data.chequeNo;
                taxType.value       = data.taxType;
                hasWithHolding.value  = data.hasWithHolding;
                withHoldingRate.value = data.withHoldingRate;

                // Restore tax flags
                const setFlag = (key, enabled, rate) => {
                    const f = getTaxFlag(key);
                    if (f) { f.enabled = enabled; f.rate = rate || f.defaultRate; }
                };
                setFlag('getfl',  data.hasGetFundLevy, data.getFundLevyRate);
                setFlag('vat',    data.hasVat, data.vatRate);
                setFlag('vatWh',  data.hasVatWithhold, data.withHoldingVatPercentage);
                setFlag('nhil',   data.hasNationalHealthInsuranceLevy, data.nationalHealthInsuranceLevyRate);
                setFlag('cst',    data.hasCommunicationServiceTax, data.communicationServiceTaxRate);
                setFlag('covid',  data.hasCovidTax, data.covidTaxRate);

                voucherList.value = (data.details || []).map(v => ({
                    ...v,
                    localDebitAmount:   v.amount,
                    foreignDebitAmount: v.foreignDebitAmount || 0,
                    accountId: v.debitAccountId ? v.debitAccountId.toLowerCase() : '',
                    description: v.description || '',
                    id: v.id || uuid(),
                }));

                retentionsList.value = (data.retensions || []).map(r => ({
                    ...r,
                    accountId:   r.accountId   ? r.accountId.toLowerCase() : '',
                    amount:      r.amount      || 0,
                    totalAmount: r.totalAmount || 0,
                    id: r.id || uuid(),
                }));

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
            reComputeVoucherSummary();
        }

        function onWithHoldChange() {
            hasWithHolding.value = voucherList.value.some(v => v.withHold);
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
            const amount = parseFloat(row.amount || 0);
            row.totalAmount = row.IsPercentage ? (amount / 100) * totalDebit.value : amount;
            reComputeVoucherSummary();
        }

        // ── Journal rebuild ───────────────────────────────────────────
        function rebuildJournalEntryList() {
            const currencyInfo           = currencyList.value.find(x => x.id === currencyId.value);
            const bankAccountInfo        = accountsList.value.find(x => x.id === bankAccountId.value);
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
                lines.push({ ...commonFields(bankAccountId.value, bankAccountInfo, firstOuId), invoiceNo: '', referenceNumber: firstRef, description: chequeNo.value ? `Voucher (#${batchNo.value}) Cheque No.: ${chequeNo.value}` : `Voucher (#${batchNo.value})`, debitAmount: 0, creditAmount: netAmount });
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

            journalEntryList.value = lines;
        }

        async function saveJournal() {
            rebuildJournalEntryList();
            const vatWhAmt = parseFloat(totalVatWithHeldAmount.value || 0);
            const whAmt    = parseFloat(totalWithHeldAmount.value    || 0);
            const payload  = {
                batchNumber: batchNo.value, batchDate: voucherEntryDate.value, isTemporary: true,
                totalCredit: totalNetAmount.value + vatWhAmt + whAmt,
                totalDebit: totalDebit.value,
                id: voucherId.value,
                journalDetails: journalEntryList.value,
            };
            try {
                await axios.post('/LedgerDataEntry/CreateJournal', payload);
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

        async function saveVoucher() {
            if (isRecordCreated.value) { createNewVoucher(); return; }
            if (!validate()) { toastHandler('warning', 'Please fill in all required fields.'); return; }
            if (!voucherList.value.length) { toastHandler('warning', 'Payment voucher has no transactions.'); return; }

            isLoading.value = true;

            const supplierInfo           = supplierList.value.find(a => a.id === supplierId.value);
            const bankAccountInfo        = accountsList.value.find(a => a.id === bankAccountId.value);
            const withHoldingAccountInfo = accountsList.value.find(a => a.id === withHoldingAccountId.value);
            const vatWithHoldingAccountInfo = accountsList.value.find(a => a.id === vatWithHoldingAccountId.value);
            const bankInfo               = bankList.value.find(a => a.id === '');
            const currencyInfo           = currencyList.value.find(a => a.id === currencyId.value);
            const vatWhF                 = getTaxFlag('vatWh');
            const getflF                 = getTaxFlag('getfl');
            const vatF                   = getTaxFlag('vat');
            const nhilF                  = getTaxFlag('nhil');
            const cstF                   = getTaxFlag('cst');
            const covidF                 = getTaxFlag('covid');

            voucherList.value.forEach(v => {
                v.debitAccountId    = v.accountId;
                v.debitAmount       = parseFloat(v.localDebitAmount || 0);
                v.foreignDebitAmount = parseFloat(v.foreignDebitAmount || 0);
                v.amount            = parseFloat(v.localDebitAmount || 0);
                v.isWithHeld        = v.withHold;
                if (!v.id) v.id = uuid();
                const debitAccountInfo = accountsList.value.find(a => a.id === v.accountId);
                v.debitAccountName = debitAccountInfo ? debitAccountInfo.accountIdentifier : '';
                v.ouId = v.ouId ? v.ouId : emptyGuid;
                const ouInfo = costCenterHierachyList.value.find(a => a.id === v.ouId);
                v.ouName = ouInfo ? ouInfo.name : '--';
            });

            retentionsList.value.forEach(v => {
                v.creditAccountId = v.accountId;
                const creditAccountInfo = accountsList.value.find(a => a.id === v.accountId);
                v.creditAccountName = creditAccountInfo ? creditAccountInfo.accountIdentifier : '';
            });

            const payload = {
                supplierId:    supplierId.value,
                supplierName:  supplierInfo ? supplierInfo.name : '',
                customerId:    emptyGuid,
                customerName:  '',
                employeeId:    emptyGuid,
                employeeName:  '',
                voucherEntryDate: voucherEntryDate.value,
                batchNo:       batchNo.value,
                chequeNo:      chequeNo.value,
                currencyId:    currencyId.value,
                currencyName:  currencyInfo ? currencyInfo.currencyName : '',
                currencyCode:  currencyInfo ? currencyInfo.currencyCode : '',
                buyRate:       currencyInfo ? currencyInfo.buyRate : '',
                sellRate:      currencyInfo ? currencyInfo.sellRate : '',
                bankAccountId: bankAccountId.value,
                bankAccountName: bankAccountInfo ? bankAccountInfo.accountIdentifier : '',
                bankId:        emptyGuid,
                bankName:      '',
                paymentDate:   paymentDate.value,
                modePayment:   modePayment.value,
                paymentAmount: parseFloat(totalCredit.value),
                bankGlAccountName: bankAccountInfo ? bankAccountInfo.accountName : '',
                hasWithHolding: hasWithHolding.value,
                withHoldingRate: parseFloat(withHoldingRate.value),
                withHoldingAccountId:    withHoldingAccountId.value    || emptyGuid,
                withHoldingAccountName:  withHoldingAccountInfo ? withHoldingAccountInfo.accountIdentifier : '',
                vatWithHoldingAccountId: vatWithHoldingAccountId.value || emptyGuid,
                vatWithHoldingAccountName: vatWithHoldingAccountInfo ? vatWithHoldingAccountInfo.accountIdentifier : '',
                taxType:       taxType.value,
                hasGetFundLevy:                getflF ? getflF.enabled : false,
                getFundLevyRate:               getflF ? getflF.rate    : 0,
                hasNationalHealthInsuranceLevy: nhilF  ? nhilF.enabled  : false,
                nationalHealthInsuranceLevyRate: nhilF ? nhilF.rate    : 0,
                hasCommunicationServiceTax:    cstF   ? cstF.enabled   : false,
                communicationServiceTaxRate:   cstF   ? cstF.rate      : 0,
                hasVat:    vatF   ? vatF.enabled   : false,
                vatRate:   vatF   ? vatF.rate      : 0,
                hasCovidTax:    covidF ? covidF.enabled : false,
                covidTaxRate:   covidF ? covidF.rate   : 0,
                hasVatWithhold: vatWhF ? vatWhF.enabled : false,
                withHoldingVatPercentage: vatWhF ? vatWhF.rate : 0,
                grossAmount:     parseFloat(totalDebit.value),
                netAmount:       parseFloat(totalNetAmount.value),
                totalRetained:   parseFloat(totalRetentionCredit.value),
                totalWithheld:   parseFloat(totalWithHeldAmount.value),
                totalVatWithheld: parseFloat(totalVatWithHeldAmount.value),
                totalVatAmount:  parseFloat(totalVatAmount.value),
                baseAmount:      parseFloat(amountWithoutTaxes.value),
                isPayment:       true,
                isMultiCurrency: isMultiCurrency.value,
                proposedJournalHeaderId:    proposedJournalHeaderId.value,
                proposedJournalDetailIdList: proposedJournalDetailIdList.value,
                id:     voucherId.value,
                details: voucherList.value,
                retensions: retentionsList.value,
            };

            const endpoint = isEditMode.value ? '/LedgerDataEntry/UpdateVoucher' : '/LedgerDataEntry/CreateVoucher';
            try {
                const res = await axios.post(endpoint, payload);
                if (res.data && res.data.id) { voucherId.value = res.data.id; isRecordCreated.value = true; }
                toastHandler('', `Supplier Payment voucher ${isEditMode.value ? 'updated' : 'saved'}.`);
                saveJournal();
            } catch {
                isLoading.value = false;
                toastHandler('error', `Unable to ${isEditMode.value ? 'update' : 'create'} supplier payment voucher.`);
            }
        }

        function previewVoucher() {
            window.open('/LedgerDataEntry/PaymentVoucherPreview?id=' + voucherId.value, '_blank');
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
            const account = accountsList.value.find(a => a.id === val);
            if (account && account.currencyId) currencyId.value = account.currencyId;
        });

        watch(currencyId, val => {
            const currency = currencyList.value.find(c => c.id === val);
            if (currency) {
                currencyRate.value  = currency.buyRate ? parseFloat(currency.buyRate).toFixed(2) : null;
                isMultiCurrency.value = currency.isDefault === false;
            } else { currencyRate.value = null; isMultiCurrency.value = false; }
        });

        watch(withHoldingRate, () => reComputeVoucherSummary());

        // ── Lifecycle ─────────────────────────────────────────────────
        onMounted(async () => {
            // Pick up voucherId from inline script (legacy pattern)
            if (typeof window.voucherId !== 'undefined' && window.voucherId && window.voucherId !== '00000000-0000-0000-0000-000000000000') {
                voucherId.value = window.voucherId;
                isEditMode.value = true;
            }
            if (typeof window.withHoldingVatPercentage !== 'undefined') {
                withHoldingVatPercentage.value = parseFloat(window.withHoldingVatPercentage) || 7;
                const vatWhF = getTaxFlag('vatWh');
                if (vatWhF) vatWhF.defaultRate = withHoldingVatPercentage.value;
            }

            await Promise.all([getBanks(), getSuppliers(), getCurrencies(), initPaymentVoucher()]);

            if (isEditMode.value) await loadVoucherDetails();
            else addVoucherRow();
        });

        return {
            // state
            isLoading, supplierId, voucherEntryDate, paymentDate, bankAccountId,
            currencyId, currencyRate, isMultiCurrency, modePayment, batchNo, chequeNo,
            taxType, withHoldingRate, withHoldingAccountId, vatWithHoldingAccountId,
            hasWithHolding, voucherId, isEditMode, isRecordCreated,
            supplierList, accountsList, currencyList, costCenterHierachyList,
            voucherList, retentionsList, errors, taxFlags,
            totalVatAmount, totalWithHeldAmount, totalVatWithHeldAmount,
            totalRetentionCredit, totalCredit, totalDebit, totalNetAmount, amountWithoutTaxes,
            // computed
            saveButtonText,
            // methods
            saveVoucher, previewVoucher, addVoucherRow, removeVoucherRow,
            onWithHoldChange, addRetentionRow, removeRetentionRow, onRetentionAmountChange,
            onTaxFlagChange, reComputeVoucherSummary, fmtNum,
        };
    }
}).mount('#app');
