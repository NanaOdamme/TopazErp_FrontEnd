const { createApp, ref, computed, watch, onMounted, reactive } = Vue;

createApp({
    setup() {
        // ── State ────────────────────────────────────────────────────
        const isLoading = ref(false);
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
                const res = await axios.get('/LedgerDataEntry/InitSupplierPvEntry');
                res.data.accounts.forEach(v => { v.accountIdentifier = `${v.accountNo} - ${v.accountName}`; });
                accountsList.value = res.data.accounts;
                costCenterHierachyList.value = parseCostCenterHierachy(res.data.costCenters);

                if (res.data.voucherBatchSystemNumber) {
                    batchNo.value = `${res.data.voucherBatchSystemNumber.prefix}${res.data.voucherBatchSystemNumber.lastNo}${res.data.voucherBatchSystemNumber.suffix}`;
                }

                const defaultBankId = res.data.defaultGlNumbers ? res.data.defaultGlNumbers.accountsReceivableBankAccountId : '';
                if (defaultBankId) {
                    bankAccountId.value = defaultBankId;
                    const accountInfo = accountsList.value.find(a => a.id === defaultBankId);
                    if (accountInfo && accountInfo.currencyId) currencyId.value = accountInfo.currencyId;
                }
            } catch {
                toastHandler('error', 'Voucher initialization failed.');
            }
        }

        async function getCustomers() {
            try {
                const res = await axios.get('/SharedResource/GetCustomers');
                customerList.value = res.data;
            } catch {
                toastHandler('error', 'Unable to retrieve customers.');
            }
        }

        async function getBanks() {
            try {
                const res = await axios.get('/SharedResource/GetBanks');
                bankList.value = res.data;
            } catch {
                toastHandler('error', 'Unable to retrieve banks.');
            }
        }

        async function getCurrencies() {
            try {
                const res = await axios.get('/SharedResource/GetCurrencys');
                currencyList.value = res.data;
            } catch {
                toastHandler('error', 'Unable to retrieve currencies.');
            }
        }

        async function loadVoucherDetails() {
            try {
                const res = await axios.get('/LedgerDataEntry/GetVoucherDetails?id=' + voucherId.value);
                const data = res.data.voucherInfo;
                if (res.data.proposedJournalHeader) {
                    proposedJournalHeaderId.value = res.data.proposedJournalHeader.id;
                }
                if (res.data.proposedJournalDetails) {
                    proposedJournalDetailIdList.value = res.data.proposedJournalDetails.map(a => a.id);
                }

                customerId.value = data.customerId;
                bankAccountId.value = data.bankAccountId;
                currencyId.value = data.currencyId;
                bankId.value = data.bankId || '';
                modePayment.value = data.modeOfPayment || 'Cash';
                voucherEntryDate.value = data.voucherEntryDate ? moment(data.voucherEntryDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
                paymentDate.value = data.paymentDate ? moment(data.paymentDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
                batchNo.value = data.batchNo || '';
                chequeNo.value = data.chequeNo || '';

                voucherList.value = (data.details || []).map(v => ({
                    id: v.id || uuid(),
                    withHold: false,
                    invoiceNo: v.invoiceNo || '',
                    referenceNo: v.referenceNo || '',
                    accountId: v.debitAccountId ? v.debitAccountId.toLowerCase() : (v.accountId || ''),
                    description: v.description || '',
                    localDebitAmount: v.amount || v.debitAmount || 0,
                    foreignDebitAmount: v.foreignDebitAmount || 0,
                    ouId: v.ouId || '',
                }));

                computeTotal();
            } catch {
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
                await axios.post('/LedgerDataEntry/CreateJournal', payload);
                journalEntryList.value = [];
                isLoading.value = false;

                if (voucherId.value) {
                    try {
                        const res = await axios.get('/LedgerDataEntry/GetVoucherDetails?id=' + voucherId.value);
                        if (res.data && res.data.proposedJournalHeader) {
                            proposedJournalHeaderId.value = res.data.proposedJournalHeader.id;
                            proposedJournalDetailIdList.value = (res.data.proposedJournalDetails || []).map(a => a.id);
                        }
                    } catch {}
                }
            } catch {
                isLoading.value = false;
                toastHandler('error', 'Unable to create journal.');
            }
        }

        // ── Save Voucher ──────────────────────────────────────────────
        async function saveVoucher() {
            if (isRecordCreated.value) {
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

            const customerInfo = customerList.value.find(a => a.id === customerId.value);
            const bankAccountInfo = accountsList.value.find(a => a.id === bankAccountId.value);
            const bankInfo = bankList.value.find(a => a.id === bankId.value);
            const currencyInfo = currencyList.value.find(a => a.id === currencyId.value);

            const payload = {
                supplierId: emptyGuid,
                supplierName: '',
                customerId: customerId.value,
                customerName: customerInfo ? customerInfo.name : '',
                employeeId: emptyGuid,
                employeeName: '',
                voucherEntryDate: voucherEntryDate.value,
                batchNo: batchNo.value,
                chequeNo: chequeNo.value,

                currencyId: currencyId.value,
                currencyName: currencyInfo ? currencyInfo.currencyName : '',
                currencyCode: currencyInfo ? currencyInfo.currencyCode : '',
                buyRate: currencyInfo ? currencyInfo.buyRate : '',
                sellRate: currencyInfo ? currencyInfo.sellRate : '',

                bankAccountId: bankAccountId.value,
                bankAccountName: bankAccountInfo ? bankAccountInfo.accountIdentifier : '',
                bankId: bankId.value || emptyGuid,
                bankName: bankInfo ? bankInfo.name : '',

                paymentDate: paymentDate.value || voucherEntryDate.value,
                modePayment: modePayment.value,
                paymentAmount: parseFloat(totalCredit.value || 0),

                bankGlAccountName: bankAccountInfo ? bankAccountInfo.accountName : '',

                hasWithHolding: false,
                withHoldingRate: 0,
                withHoldingAccountId: emptyGuid,
                withHoldingAccountName: '',
                vatWithHoldingAccountId: emptyGuid,
                vatWithHoldingAccountName: '',

                taxType: '',
                hasGetFundLevy: false,
                getFundLevyRate: 0,
                hasNationalHealthInsuranceLevy: false,
                nationalHealthInsuranceLevyRate: 0,
                hasCommunicationServiceTax: false,
                communicationServiceTaxRate: 0,
                hasVat: false,
                vatRate: 0,
                hasCovidTax: false,
                covidTaxRate: 0,
                hasVatWithhold: false,
                withHoldingVatPercentage: withHoldingVatPercentage.value || 7,

                grossAmount: parseFloat(totalDebit.value || 0),
                netAmount: parseFloat(totalNetAmount.value || 0),
                totalRetained: 0,
                totalWithheld: 0,
                totalVatWithheld: 0,
                totalVatAmount: 0,
                baseAmount: 0,
                isPayment: true,
                isMultiCurrency: isMultiCurrency.value,
                proposedJournalHeaderId: proposedJournalHeaderId.value,
                proposedJournalDetailIdList: proposedJournalDetailIdList.value,
            };

            if (isEditMode.value) {
                payload.id = voucherId.value;
            }

            voucherList.value.forEach(v => {
                v.debitAccountId = v.accountId;
                v.debitAmount = parseFloat(v.localDebitAmount || 0);
                v.foreignDebitAmount = parseFloat(v.foreignDebitAmount || 0);
                v.amount = parseFloat(v.localDebitAmount || 0);
                v.isWithHeld = false;
                if (!v.id) v.id = uuid();

                const debitAccountInfo = accountsList.value.find(a => a.id === v.accountId);
                v.debitAccountName = debitAccountInfo ? debitAccountInfo.accountIdentifier : '';
                v.ouId = v.ouId || emptyGuid;
                const ouInfo = costCenterHierachyList.value.find(a => a.id === v.ouId);
                v.ouName = ouInfo ? ouInfo.name : '--';
            });

            payload.details = voucherList.value;
            payload.retensions = [];

            const saveEndpoint = isEditMode.value ? '/LedgerDataEntry/UpdateVoucher' : '/LedgerDataEntry/CreateVoucher';

            try {
                const response = await axios.post(saveEndpoint, payload);
                if (response.data && response.data.id) {
                    voucherId.value = response.data.id;
                    isRecordCreated.value = true;
                }
                toastHandler('', `Customer Receipt voucher ${isEditMode.value ? 'updated' : 'saved'}.`);
                await saveJournal();
            } catch {
                isLoading.value = false;
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
                    setTimeout(() => { window.location.href = '/GeneralLedger/Vouchers'; }, 1500);
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
                setTimeout(() => { window.location.href = '/GeneralLedger/Vouchers'; }, 1500);
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
            if (typeof window.voucherId !== 'undefined' && window.voucherId && window.voucherId !== '00000000-0000-0000-0000-000000000000') {
                voucherId.value = window.voucherId;
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

            if (isEditMode.value) {
                await loadVoucherDetails();
            } else {
                addVoucherRow();
            }
        });

        return {
            isLoading, customerId, voucherEntryDate, paymentDate, bankAccountId,
            currencyId, currencyRate, isMultiCurrency, modePayment, batchNo, chequeNo,
            voucherId, isEditMode, isRecordCreated,
            customerList, accountsList, currencyList, costCenterHierachyList,
            voucherList, errors,
            totalCredit, totalDebit, totalNetAmount,
            saveButtonText,
            saveVoucher, previewVoucher, addVoucherRow, removeVoucherRow,
            computeTotal, onForeignAmountChange, postVoucher, deleteVoucher, fmtNum,
        };
    }
}).mount('#app');
