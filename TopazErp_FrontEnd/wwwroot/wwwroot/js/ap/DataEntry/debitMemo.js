
const app = Vue.createApp({
    data() {
        const emptyGuid = '00000000-0000-0000-0000-000000000000';

        const supplierList = [
            {
                id: '10000000-0000-0000-0000-000000000001',
                name: 'Accra Office Supplies Ltd',
                accountNumber: 'SUP-0001',
                statusName: 'Active'
            },
            {
                id: '10000000-0000-0000-0000-000000000002',
                name: 'Ghana Industrial Solutions',
                accountNumber: 'SUP-0002',
                statusName: 'Active'
            },
            {
                id: '10000000-0000-0000-0000-000000000003',
                name: 'Prime Technology Services',
                accountNumber: 'SUP-0003',
                statusName: 'Active'
            },
            {
                id: '10000000-0000-0000-0000-000000000004',
                name: 'Coastal Logistics Ltd',
                accountNumber: 'SUP-0004',
                statusName: 'Active'
            }
        ];

        const currencyList = [
            {
                id: '20000000-0000-0000-0000-000000000001',
                currencyName: 'Ghana Cedi',
                currencyCode: 'GHS',
                buyRate: 1,
                sellRate: 1
            },
            {
                id: '20000000-0000-0000-0000-000000000002',
                currencyName: 'US Dollar',
                currencyCode: 'USD',
                buyRate: 12.5,
                sellRate: 12.8
            },
            {
                id: '20000000-0000-0000-0000-000000000003',
                currencyName: 'Euro',
                currencyCode: 'EUR',
                buyRate: 13.7,
                sellRate: 14.1
            }
        ];

        const accountsList = [
            {
                id: '30000000-0000-0000-0000-000000000001',
                accountNo: '1100',
                accountName: 'Accounts Payable',
                accountIdentifier: '1100 - Accounts Payable'
            },
            {
                id: '30000000-0000-0000-0000-000000000002',
                accountNo: '1200',
                accountName: 'Bank Account',
                accountIdentifier: '1200 - Bank Account'
            },
            {
                id: '30000000-0000-0000-0000-000000000003',
                accountNo: '5100',
                accountName: 'Office Supplies Expense',
                accountIdentifier: '5100 - Office Supplies Expense'
            },
            {
                id: '30000000-0000-0000-0000-000000000004',
                accountNo: '5200',
                accountName: 'Transport Expense',
                accountIdentifier: '5200 - Transport Expense'
            },
            {
                id: '30000000-0000-0000-0000-000000000005',
                accountNo: '5300',
                accountName: 'IT Equipment Expense',
                accountIdentifier: '5300 - IT Equipment Expense'
            }
        ];

        const bankList = [
            {
                id: '40000000-0000-0000-0000-000000000001',
                name: 'GCB Bank',
                bankBranches: [
                    {
                        id: '41000000-0000-0000-0000-000000000001',
                        name: 'Accra Main Branch'
                    },
                    {
                        id: '41000000-0000-0000-0000-000000000002',
                        name: 'Osu Branch'
                    }
                ]
            },
            {
                id: '40000000-0000-0000-0000-000000000002',
                name: 'Absa Bank Ghana',
                bankBranches: [
                    {
                        id: '42000000-0000-0000-0000-000000000001',
                        name: 'Airport Branch'
                    },
                    {
                        id: '42000000-0000-0000-0000-000000000002',
                        name: 'Tema Branch'
                    }
                ]
            },
            {
                id: '40000000-0000-0000-0000-000000000003',
                name: 'Ecobank Ghana',
                bankBranches: [
                    {
                        id: '43000000-0000-0000-0000-000000000001',
                        name: 'Ridge Branch'
                    }
                ]
            }
        ];

        const costCenterHierachyList = [
            {
                id: '50000000-0000-0000-0000-000000000001',
                name: 'ACAD / Administration'
            },
            {
                id: '50000000-0000-0000-0000-000000000002',
                name: 'ACAD / Finance'
            },
            {
                id: '50000000-0000-0000-0000-000000000003',
                name: 'ACAD / Information Technology'
            },
            {
                id: '50000000-0000-0000-0000-000000000004',
                name: 'OPERATIONS / Procurement'
            }
        ];

        const invoiceList = [
            {
                id: '60000000-0000-0000-0000-000000000001',
                invoiceNumber: 'INV-2026-001',
                supplierId: supplierList[0].id,
                supplierName: supplierList[0].name,
                currencyId: currencyList[0].id,
                currencyName: currencyList[0].currencyName,
                buyRate: 1,
                balance: 2500,
                amount: 4000,
                isPosted: true
            },
            {
                id: '60000000-0000-0000-0000-000000000002',
                invoiceNumber: 'INV-2026-002',
                supplierId: supplierList[1].id,
                supplierName: supplierList[1].name,
                currencyId: currencyList[1].id,
                currencyName: currencyList[1].currencyName,
                buyRate: 12.5,
                balance: 800,
                amount: 1800,
                isPosted: true
            },
            {
                id: '60000000-0000-0000-0000-000000000003',
                invoiceNumber: 'INV-2026-003',
                supplierId: supplierList[2].id,
                supplierName: supplierList[2].name,
                currencyId: currencyList[0].id,
                currencyName: currencyList[0].currencyName,
                buyRate: 1,
                balance: 1200,
                amount: 1200,
                isPosted: true
            }
        ];

        const initialDebitMemos = [
            {
                id: '70000000-0000-0000-0000-000000000001',
                tenantId: 2,
                supplierId: supplierList[0].id,
                supplierName: supplierList[0].name,
                accountNo: supplierList[0].accountNumber,
                invoiceId: emptyGuid,
                invoiceNo: 'DM-2026-1001',
                currencyId: currencyList[0].id,
                currencyName: currencyList[0].currencyName,
                currencyCode: 'GHS',
                buyRate: 1,
                sellRate: 1,
                invoiceCurrencyId: emptyGuid,
                invoiceCurrencyName: 'No Invoice',
                invoiceBuyRate: 0,
                invoiceBalance: 0,
                amount: 1250,
                balance: 1250,
                modeOfPayment: 'Cash',
                chequeNo: '00000000',
                chequeDate: '2026-10-05',
                transactionDate: '2026-10-05',
                description: 'Price adjustment on office supplies',
                bankId: emptyGuid,
                bankName: 'No Bank',
                bankBranchId: emptyGuid,
                bankBranch: 'No Branch',
                bankAccountId: accountsList[1].id,
                bankAccountName: accountsList[1].accountName,
                debitGlId: accountsList[2].id,
                debitGlName: accountsList[2].accountIdentifier,
                creditGlId: accountsList[0].id,
                creditGlName: accountsList[0].accountIdentifier,
                ouId: costCenterHierachyList[1].id,
                ouName: costCenterHierachyList[1].name,
                batchNumber: '1001',
                isInvoiceDebit: false
            },
            {
                id: '70000000-0000-0000-0000-000000000002',
                tenantId: 2,
                supplierId: supplierList[1].id,
                supplierName: supplierList[1].name,
                accountNo: supplierList[1].accountNumber,
                invoiceId: invoiceList[1].id,
                invoiceNo: invoiceList[1].invoiceNumber,
                currencyId: currencyList[1].id,
                currencyName: currencyList[1].currencyName,
                currencyCode: 'USD',
                buyRate: 12.5,
                sellRate: 12.8,
                invoiceCurrencyId: currencyList[1].id,
                invoiceCurrencyName: currencyList[1].currencyName,
                invoiceBuyRate: 12.5,
                invoiceBalance: 800,
                amount: 800,
                balance: 800,
                modeOfPayment: 'Cheque',
                chequeNo: 'CHQ-00125',
                chequeDate: '2026-10-07',
                transactionDate: '2026-10-07',
                description: 'Invoice price correction',
                bankId: bankList[0].id,
                bankName: bankList[0].name,
                bankBranchId: bankList[0].bankBranches[0].id,
                bankBranch: bankList[0].bankBranches[0].name,
                bankAccountId: accountsList[1].id,
                bankAccountName: accountsList[1].accountName,
                debitGlId: accountsList[3].id,
                debitGlName: accountsList[3].accountIdentifier,
                creditGlId: accountsList[0].id,
                creditGlName: accountsList[0].accountIdentifier,
                ouId: costCenterHierachyList[3].id,
                ouName: costCenterHierachyList[3].name,
                batchNumber: '1002',
                isInvoiceDebit: true
            },
            {
                id: '70000000-0000-0000-0000-000000000003',
                tenantId: 2,
                supplierId: supplierList[2].id,
                supplierName: supplierList[2].name,
                accountNo: supplierList[2].accountNumber,
                invoiceId: emptyGuid,
                invoiceNo: 'DM-2026-1003',
                currencyId: currencyList[0].id,
                currencyName: currencyList[0].currencyName,
                currencyCode: 'GHS',
                buyRate: 1,
                sellRate: 1,
                invoiceCurrencyId: emptyGuid,
                invoiceCurrencyName: 'No Invoice',
                invoiceBuyRate: 0,
                invoiceBalance: 0,
                amount: 3750,
                balance: 3750,
                modeOfPayment: 'Bank Transfer',
                chequeNo: '00000000',
                chequeDate: '2026-10-08',
                transactionDate: '2026-10-08',
                description: 'IT equipment billing adjustment',
                bankId: bankList[1].id,
                bankName: bankList[1].name,
                bankBranchId: bankList[1].bankBranches[0].id,
                bankBranch: bankList[1].bankBranches[0].name,
                bankAccountId: accountsList[1].id,
                bankAccountName: accountsList[1].accountName,
                debitGlId: accountsList[4].id,
                debitGlName: accountsList[4].accountIdentifier,
                creditGlId: accountsList[0].id,
                creditGlName: accountsList[0].accountIdentifier,
                ouId: costCenterHierachyList[2].id,
                ouName: costCenterHierachyList[2].name,
                batchNumber: '1003',
                isInvoiceDebit: false
            },
            {
                id: '70000000-0000-0000-0000-000000000004',
                tenantId: 2,
                supplierId: supplierList[3].id,
                supplierName: supplierList[3].name,
                accountNo: supplierList[3].accountNumber,
                invoiceId: emptyGuid,
                invoiceNo: 'DM-2026-1004',
                currencyId: currencyList[0].id,
                currencyName: currencyList[0].currencyName,
                currencyCode: 'GHS',
                buyRate: 1,
                sellRate: 1,
                invoiceCurrencyId: emptyGuid,
                invoiceCurrencyName: 'No Invoice',
                invoiceBuyRate: 0,
                invoiceBalance: 0,
                amount: 950,
                balance: 950,
                modeOfPayment: 'Cash',
                chequeNo: '00000000',
                chequeDate: '2026-10-09',
                transactionDate: '2026-10-09',
                description: 'Transport service adjustment',
                bankId: emptyGuid,
                bankName: 'No Bank',
                bankBranchId: emptyGuid,
                bankBranch: 'No Branch',
                bankAccountId: accountsList[1].id,
                bankAccountName: accountsList[1].accountName,
                debitGlId: accountsList[3].id,
                debitGlName: accountsList[3].accountIdentifier,
                creditGlId: accountsList[0].id,
                creditGlName: accountsList[0].accountIdentifier,
                ouId: costCenterHierachyList[0].id,
                ouName: costCenterHierachyList[0].name,
                batchNumber: '1004',
                isInvoiceDebit: false
            }
        ];

        return {
            emptyGuid: emptyGuid,
            tenantId: 2,

            isShimmerLoading: false,
            isLoading: false,
            showModal: false,
            isEditing: false,
            editingId: '',

            supplierList: supplierList,
            currencyList: currencyList,
            accountsList: accountsList,
            bankList: bankList,
            bankBranchList: [],
            invoiceList: invoiceList,
            costCenterHierachyList: costCenterHierachyList,

            debitMemoList: initialDebitMemos,

            form: {
                id: '',
                tenantId: 2,
                supplierId: '',
                supplierName: '',
                accountNo: '',
                invoiceId: emptyGuid,
                invoiceNo: '',
                currencyId: currencyList[0].id,
                currencyName: currencyList[0].currencyName,
                currencyCode: currencyList[0].currencyCode,
                buyRate: 1,
                sellRate: 1,
                invoiceCurrencyId: emptyGuid,
                invoiceCurrencyName: 'No Invoice',
                invoiceBuyRate: 0,
                invoiceBalance: 0,
                amount: 0,
                balance: 0,
                modeOfPayment: 'Cash',
                chequeNo: '00000000',
                chequeDate: moment().format('YYYY-MM-DD'),
                transactionDate: moment().format('YYYY-MM-DD'),
                description: '',
                bankId: '',
                bankName: '',
                bankBranchId: '',
                bankBranch: '',
                bankAccountId: accountsList[1].id,
                bankAccountName: accountsList[1].accountName,
                debitGlId: accountsList[2].id,
                debitGlName: accountsList[2].accountIdentifier,
                creditGlId: accountsList[0].id,
                creditGlName: accountsList[0].accountIdentifier,
                ouId: '',
                ouName: 'No OU',
                batchNumber: '0',
                isInvoiceDebit: false
            }
        };
    },

    computed: {
        debitMemoColumns() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    hidden: true
                },
                {
                    key: 'tenantId',
                    label: 'Tenant ID',
                    hidden: true
                },
                {
                    key: 'supplierId',
                    label: 'Supplier',
                    type: 'select',
                    options: this.supplierList,
                    optionLabel: 'name',
                    optionValue: 'id',
                    required: true,
                    searchable: true,
                    width: '220px'
                },
                {
                    key: 'accountNo',
                    label: 'Account Number',
                    searchable: true,
                    width: '140px'
                },
                {
                    key: 'invoiceNo',
                    label: 'Invoice Number',
                    searchable: true,
                    width: '160px'
                },
                {
                    key: 'isInvoiceDebit',
                    label: 'Invoice Debit',
                    type: 'boolean',
                    width: '120px'
                },
                {
                    key: 'currencyId',
                    label: 'Currency',
                    type: 'select',
                    options: this.currencyList,
                    optionLabel: 'currencyName',
                    optionValue: 'id',
                    width: '130px'
                },
                {
                    key: 'buyRate',
                    label: 'Buy Rate',
                    type: 'number',
                    width: '110px'
                },
                {
                    key: 'amount',
                    label: 'Amount',
                    type: 'number',
                    required: true,
                    width: '130px'
                },
                {
                    key: 'modeOfPayment',
                    label: 'Payment Method',
                    type: 'select',
                    options: [
                        { id: 'Cash', name: 'Cash' },
                        { id: 'Cheque', name: 'Cheque' },
                        { id: 'Bank Transfer', name: 'Bank Transfer' },
                        { id: 'Mobile Money', name: 'Mobile Money' }
                    ],
                    optionLabel: 'name',
                    optionValue: 'id',
                    width: '150px'
                },
                {
                    key: 'transactionDate',
                    label: 'Transaction Date',
                    type: 'date',
                    width: '145px'
                },
                {
                    key: 'bankId',
                    label: 'Bank',
                    type: 'select',
                    options: this.bankList,
                    optionLabel: 'name',
                    optionValue: 'id',
                    width: '150px'
                },
                {
                    key: 'debitGlId',
                    label: 'Debit GL',
                    type: 'select',
                    options: this.accountsList,
                    optionLabel: 'accountIdentifier',
                    optionValue: 'id',
                    width: '230px'
                },
                {
                    key: 'creditGlId',
                    label: 'Credit GL',
                    type: 'select',
                    options: this.accountsList,
                    optionLabel: 'accountIdentifier',
                    optionValue: 'id',
                    width: '230px'
                },
                {
                    key: 'ouId',
                    label: 'OU / Cost Centre',
                    type: 'select',
                    options: this.costCenterHierachyList,
                    optionLabel: 'name',
                    optionValue: 'id',
                    width: '220px'
                },
                {
                    key: 'description',
                    label: 'Description',
                    searchable: true,
                    width: '250px'
                }
            ];
        },

        selectedSupplier() {
            return this.supplierList.find(
                supplier => supplier.id === this.form.supplierId
            ) || null;
        },

        selectedCurrency() {
            return this.currencyList.find(
                currency => currency.id === this.form.currencyId
            ) || null;
        },

        selectedInvoice() {
            return this.invoiceList.find(
                invoice => invoice.id === this.form.invoiceId
            ) || null;
        },

        selectedBank() {
            return this.bankList.find(
                bank => bank.id === this.form.bankId
            ) || null;
        },

        totalAmount() {
            return this.debitMemoList.reduce(
                (total, memo) => total + (Number(memo.amount) || 0),
                0
            );
        },

        invoiceDebitCount() {
            return this.debitMemoList.filter(
                memo => memo.isInvoiceDebit === true
            ).length;
        }
    },

    methods: {
        createId() {
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                return window.crypto.randomUUID();
            }

            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
                const random = Math.random() * 16 | 0;
                const value = char === 'x' ? random : (random & 0x3 | 0x8);
                return value.toString(16);
            });
        },

        formatMoney(value) {
            return new Intl.NumberFormat('en-GH', {
                style: 'currency',
                currency: 'GHS',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(Number(value) || 0);
        },

        toastHandler(type, message) {
            if (typeof Swal === 'undefined') {
                console.log(message);
                return;
            }

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type || 'success',
                title: message,
                showConfirmButton: false,
                timer: 3500,
                timerProgressBar: true
            });
        },

        confirmAction(title, text, confirmText) {
            if (typeof Swal === 'undefined') {
                return Promise.resolve(
                    window.confirm(text || title)
                );
            }

            return Swal.fire({
                title: title,
                text: text,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#0645e7',
                cancelButtonColor: '#64748b',
                confirmButtonText: confirmText || 'Yes, continue',
                cancelButtonText: 'Cancel',
                reverseButtons: true
            }).then(result => result.isConfirmed);
        },

        getSupplierDetails(id) {
            return this.supplierList.find(supplier => supplier.id === id) || null;
        },

        getCurrencyDetails(id) {
            return this.currencyList.find(currency => currency.id === id) || null;
        },

        getAccountDetails(id) {
            return this.accountsList.find(account => account.id === id) || null;
        },

        getBankDetails(id) {
            return this.bankList.find(bank => bank.id === id) || null;
        },

        getBankBranchDetails(id) {
            return this.bankBranchList.find(branch => branch.id === id) || null;
        },

        getOuDetails(id) {
            return this.costCenterHierachyList.find(centre => centre.id === id) || null;
        },

        getInvoiceDetails(id) {
            return this.invoiceList.find(invoice => invoice.id === id) || null;
        },

        getMemoDetails(id) {
            return this.debitMemoList.find(memo => memo.id === id) || null;
        },

        onCreate() {
            this.isEditing = false;
            this.editingId = '';
            this.resetForm();
            this.showModal = true;
        },

        onUpdate(event) {
            if (!record) {
                this.toastHandler('warning', 'Select a debit memo to edit.');
                return;
            }

            const id = typeof event === 'string' ? event : event.id;
            const memo = this.getMemoDetails(id) || event;

            if (!memo || !memo.id) {
                this.toastHandler('error', 'Unable to identify the debit memo.');
                return;
            }

            this.isEditing = true;
            this.editingId = memo.id;

            this.form = {
                ...this.form,
                ...JSON.parse(JSON.stringify(memo)),
                id: memo.id,
                tenantId: memo.tenantId ?? this.tenantId,
                amount: Number(memo.amount) || 0,
                buyRate: Number(memo.buyRate) || 0,
                sellRate: Number(memo.sellRate) || 0,
                invoiceBuyRate: Number(memo.invoiceBuyRate) || 0,
                invoiceBalance: Number(memo.invoiceBalance) || 0,
                transactionDate: this.toInputDate(memo.transactionDate),
                chequeDate: this.toInputDate(memo.chequeDate),
                bankId: memo.bankId === this.emptyGuid ? '' : (memo.bankId || ''),
                bankBranchId: memo.bankBranchId === this.emptyGuid ? '' : (memo.bankBranchId || ''),
                ouId: memo.ouId === this.emptyGuid ? '' : (memo.ouId || ''),
                invoiceId: memo.invoiceId === this.emptyGuid ? '' : (memo.invoiceId || ''),
                invoiceCurrencyId: memo.invoiceCurrencyId === this.emptyGuid
                    ? ''
                    : (memo.invoiceCurrencyId || '')
            };

            const bank = this.getBankDetails(this.form.bankId);
            this.bankBranchList = bank
                ? [...bank.bankBranches].sort((a, b) => a.name.localeCompare(b.name))
                : [];

            this.showModal = true;
        },

        async onDelete(event) {
            if (!event) {
                this.toastHandler('warning', 'Select a debit memo to delete.');
                return;
            }

            const id = typeof event === 'string' ? event : event.id;
            const memo = this.getMemoDetails(id) || event;

            if (!memo || !memo.id) {
                this.toastHandler('error', 'Unable to identify the debit memo.');
                return;
            }

            const confirmed = await this.confirmAction(
                'Delete debit memo?',
                `Delete ${memo.invoiceNo || 'this debit memo'} for ${memo.supplierName || 'this supplier'}?`,
                'Yes, delete'
            );

            if (!confirmed) {
                return;
            }

            this.debitMemoList = this.debitMemoList.filter(
                item => item.id !== id
            );

            this.toastHandler('success', 'Debit memo deleted successfully.');
        },

        resetForm() {
            const defaultCurrency = this.currencyList.find(
                currency => currency.currencyCode === 'GHS'
            ) || this.currencyList[0];

            const defaultBankAccount = this.accountsList.find(
                account => account.accountNo === '1200'
            ) || this.accountsList[0];

            const defaultDebitAccount = this.accountsList.find(
                account => account.accountNo === '5100'
            ) || this.accountsList[0];

            const defaultCreditAccount = this.accountsList.find(
                account => account.accountNo === '1100'
            ) || this.accountsList[0];

            this.bankBranchList = [];

            this.form = {
                id: '',
                tenantId: this.tenantId,
                supplierId: '',
                supplierName: '',
                accountNo: '',
                invoiceId: '',
                invoiceNo: '',
                currencyId: defaultCurrency ? defaultCurrency.id : '',
                currencyName: defaultCurrency ? defaultCurrency.currencyName : '',
                currencyCode: defaultCurrency ? defaultCurrency.currencyCode : '',
                buyRate: defaultCurrency ? Number(defaultCurrency.buyRate) : 1,
                sellRate: defaultCurrency ? Number(defaultCurrency.sellRate) : 1,
                invoiceCurrencyId: '',
                invoiceCurrencyName: 'No Invoice',
                invoiceBuyRate: 0,
                invoiceBalance: 0,
                amount: 0,
                balance: 0,
                modeOfPayment: 'Cash',
                chequeNo: '00000000',
                chequeDate: moment().format('YYYY-MM-DD'),
                transactionDate: moment().format('YYYY-MM-DD'),
                description: '',
                bankId: '',
                bankName: '',
                bankBranchId: '',
                bankBranch: '',
                bankAccountId: defaultBankAccount ? defaultBankAccount.id : '',
                bankAccountName: defaultBankAccount ? defaultBankAccount.accountName : '',
                debitGlId: defaultDebitAccount ? defaultDebitAccount.id : '',
                debitGlName: defaultDebitAccount ? defaultDebitAccount.accountIdentifier : '',
                creditGlId: defaultCreditAccount ? defaultCreditAccount.id : '',
                creditGlName: defaultCreditAccount ? defaultCreditAccount.accountIdentifier : '',
                ouId: '',
                ouName: 'No OU',
                batchNumber: '0',
                isInvoiceDebit: false
            };
        },

        closeModal() {
            if (this.isLoading) {
                return;
            }

            this.showModal = false;
        },

        toInputDate(value) {
            if (!value) {
                return moment().format('YYYY-MM-DD');
            }

            const parsed = moment(value);

            return parsed.isValid()
                ? parsed.format('YYYY-MM-DD')
                : moment().format('YYYY-MM-DD');
        },

        syncFormDetails() {
            const supplier = this.getSupplierDetails(this.form.supplierId);

            if (supplier) {
                this.form.supplierName = supplier.name;
                this.form.accountNo = supplier.accountNumber;
            } else {
                this.form.supplierName = '';
                this.form.accountNo = '';
            }

            const currency = this.getCurrencyDetails(this.form.currencyId);

            if (currency) {
                this.form.currencyName = currency.currencyName;
                this.form.currencyCode = currency.currencyCode;
                this.form.buyRate = Number(currency.buyRate) || 0;
                this.form.sellRate = Number(currency.sellRate) || 0;
            }

            const invoice = this.getInvoiceDetails(this.form.invoiceId);

            if (this.form.isInvoiceDebit && invoice) {
                this.form.supplierId = invoice.supplierId;
                this.form.supplierName = invoice.supplierName;
                this.form.accountNo = (
                    this.getSupplierDetails(invoice.supplierId) || {}
                ).accountNumber || '';

                this.form.invoiceNo = invoice.invoiceNumber;
                this.form.invoiceCurrencyId = invoice.currencyId;
                this.form.invoiceCurrencyName = invoice.currencyName;
                this.form.invoiceBuyRate = Number(invoice.buyRate) || 0;
                this.form.invoiceBalance = Number(invoice.balance) || 0;
            } else if (!this.form.isInvoiceDebit) {
                this.form.invoiceId = '';
                this.form.invoiceCurrencyId = '';
                this.form.invoiceCurrencyName = 'No Invoice';
                this.form.invoiceBuyRate = 0;
                this.form.invoiceBalance = 0;
            }

            const bank = this.getBankDetails(this.form.bankId);

            if (bank) {
                this.form.bankName = bank.name;

                this.bankBranchList = [...bank.bankBranches].sort(
                    (a, b) => a.name.localeCompare(b.name)
                );

                const branch = this.getBankBranchDetails(this.form.bankBranchId);

                if (branch) {
                    this.form.bankBranch = branch.name;
                } else {
                    this.form.bankBranchId = '';
                    this.form.bankBranch = '';
                }
            } else {
                this.form.bankName = '';
                this.form.bankBranchId = '';
                this.form.bankBranch = '';
                this.bankBranchList = [];
            }

            const bankAccount = this.getAccountDetails(this.form.bankAccountId);

            this.form.bankAccountName = bankAccount
                ? bankAccount.accountName
                : 'No Bank Account';

            const debitAccount = this.getAccountDetails(this.form.debitGlId);

            this.form.debitGlName = debitAccount
                ? debitAccount.accountIdentifier
                : 'No Debit GL';

            const creditAccount = this.getAccountDetails(this.form.creditGlId);

            this.form.creditGlName = creditAccount
                ? creditAccount.accountIdentifier
                : 'No Credit GL';

            const centre = this.getOuDetails(this.form.ouId);

            this.form.ouName = centre ? centre.name : 'No OU';

            this.form.balance = Number(this.form.amount) || 0;
        },

        async saveMemo() {
            if (this.isLoading) {
                return;
            }

            if (!this.form.supplierId) {
                this.toastHandler('warning', 'Please select a supplier.');
                return;
            }

            if (!this.form.currencyId) {
                this.toastHandler('warning', 'Please select a currency.');
                return;
            }

            if (!this.form.transactionDate) {
                this.toastHandler('warning', 'Please select a transaction date.');
                return;
            }

            if (!Number.isFinite(Number(this.form.amount)) || Number(this.form.amount) <= 0) {
                this.toastHandler('warning', 'Amount must be greater than zero.');
                return;
            }

            if (this.form.isInvoiceDebit && !this.form.invoiceId) {
                this.toastHandler('warning', 'Please select an invoice for an invoice debit memo.');
                return;
            }

            this.isLoading = true;

            try {
                this.syncFormDetails();

                const payload = {
                    ...JSON.parse(JSON.stringify(this.form)),
                    id: this.isEditing ? this.editingId : this.createId(),
                    tenantId: this.tenantId,
                    amount: Number(this.form.amount) || 0,
                    balance: Number(this.form.amount) || 0,
                    buyRate: Number(this.form.buyRate) || 0,
                    sellRate: Number(this.form.sellRate) || 0,
                    invoiceBuyRate: Number(this.form.invoiceBuyRate) || 0,
                    invoiceBalance: Number(this.form.invoiceBalance) || 0,
                    invoiceId: this.form.isInvoiceDebit && this.form.invoiceId
                        ? this.form.invoiceId
                        : this.emptyGuid,
                    invoiceCurrencyId: this.form.isInvoiceDebit && this.form.invoiceCurrencyId
                        ? this.form.invoiceCurrencyId
                        : this.emptyGuid,
                    invoiceCurrencyName: this.form.isInvoiceDebit
                        ? this.form.invoiceCurrencyName
                        : 'No Invoice',
                    bankId: this.form.bankId || this.emptyGuid,
                    bankBranchId: this.form.bankBranchId || this.emptyGuid,
                    ouId: this.form.ouId || this.emptyGuid,
                    bankName: this.form.bankName || 'No Bank',
                    bankBranch: this.form.bankBranch || 'No Branch',
                    ouName: this.form.ouName || 'No OU',
                    bankAccountId: this.form.bankAccountId || this.emptyGuid,
                    debitGlId: this.form.debitGlId || this.emptyGuid,
                    creditGlId: this.form.creditGlId || this.emptyGuid
                };

                if (this.isEditing) {
                    const index = this.debitMemoList.findIndex(
                        memo => memo.id === this.editingId
                    );

                    if (index === -1) {
                        this.toastHandler('error', 'Debit memo could not be found.');
                        return;
                    }

                    this.debitMemoList.splice(index, 1, payload);
                    this.toastHandler('success', 'Debit memo updated successfully.');
                } else {
                    this.debitMemoList.unshift(payload);
                    this.toastHandler('success', 'Debit memo created successfully.');
                }

                this.showModal = false;
            } catch (error) {
                console.error(error);
                this.toastHandler('error', 'Unable to save debit memo.');
            } finally {
                this.isLoading = false;
            }
        }
    },

    watch: {
        'form.supplierId'() {
            const supplier = this.getSupplierDetails(this.form.supplierId);

            if (supplier) {
                this.form.supplierName = supplier.name;
                this.form.accountNo = supplier.accountNumber;
            }
        },

        'form.currencyId'() {
            const currency = this.getCurrencyDetails(this.form.currencyId);

            if (currency) {
                this.form.currencyName = currency.currencyName;
                this.form.currencyCode = currency.currencyCode;
                this.form.buyRate = Number(currency.buyRate) || 0;
                this.form.sellRate = Number(currency.sellRate) || 0;
            }
        },

        'form.invoiceId'() {
            if (this.form.isInvoiceDebit && this.form.invoiceId) {
                const invoice = this.getInvoiceDetails(this.form.invoiceId);

                if (invoice) {
                    this.form.supplierId = invoice.supplierId;
                    this.form.supplierName = invoice.supplierName;
                    this.form.invoiceNo = invoice.invoiceNumber;
                    this.form.invoiceCurrencyId = invoice.currencyId;
                    this.form.invoiceCurrencyName = invoice.currencyName;
                    this.form.invoiceBuyRate = Number(invoice.buyRate) || 0;
                    this.form.invoiceBalance = Number(invoice.balance) || 0;
                }
            }
        },

        'form.isInvoiceDebit'(value) {
            if (!value) {
                this.form.invoiceId = '';
                this.form.invoiceCurrencyId = '';
                this.form.invoiceCurrencyName = 'No Invoice';
                this.form.invoiceBuyRate = 0;
                this.form.invoiceBalance = 0;
            }
        },

        'form.bankId'(value, oldValue) {
            if (value !== oldValue) {
                this.form.bankBranchId = '';
                this.form.bankBranch = '';
            }

            const bank = this.getBankDetails(value);

            this.bankBranchList = bank
                ? [...bank.bankBranches].sort((a, b) => a.name.localeCompare(b.name))
                : [];

            this.form.bankName = bank ? bank.name : '';
        },

        'form.bankBranchId'(value) {
            const branch = this.getBankBranchDetails(value);
            this.form.bankBranch = branch ? branch.name : '';
        },

        'form.amount'(value) {
            this.form.balance = Number(value) || 0;
        },

        'form.bankAccountId'(value) {
            const account = this.getAccountDetails(value);
            this.form.bankAccountName = account
                ? account.accountName
                : 'No Bank Account';
        },

        'form.debitGlId'(value) {
            const account = this.getAccountDetails(value);
            this.form.debitGlName = account
                ? account.accountIdentifier
                : 'No Debit GL';
        },

        'form.creditGlId'(value) {
            const account = this.getAccountDetails(value);
            this.form.creditGlName = account
                ? account.accountIdentifier
                : 'No Credit GL';
        },

        'form.ouId'(value) {
            const centre = this.getOuDetails(value);
            this.form.ouName = centre ? centre.name : 'No OU';
        }
    },

    mounted() {
        this.isShimmerLoading = false;
    }
});
app.use(DataGridPlugin);
app.mount('#app');
