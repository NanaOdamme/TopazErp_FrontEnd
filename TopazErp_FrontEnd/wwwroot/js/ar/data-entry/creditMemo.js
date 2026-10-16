
const app = Vue.createApp({
    data() {
        const emptyGuid = '00000000-0000-0000-0000-000000000000';

        const customerList = [
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
                customerId: customerList[0].id,
                customerName: customerList[0].name,
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
                customerId: customerList[1].id,
                customerName: customerList[1].name,
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
                customerId: customerList[2].id,
                customerName: customerList[2].name,
                currencyId: currencyList[0].id,
                currencyName: currencyList[0].currencyName,
                buyRate: 1,
                balance: 1200,
                amount: 1200,
                isPosted: true
            }
        ];

        const initialCreditMemos = [
            {
                id: '70000000-0000-0000-0000-000000000001',
                tenantId: 2,
                customerId: customerList[0].id,
                customerName: customerList[0].name,
                accountNo: customerList[0].accountNumber,
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
                customerId: customerList[1].id,
                customerName: customerList[1].name,
                accountNo: customerList[1].accountNumber,
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
                customerId: customerList[2].id,
                customerName: customerList[2].name,
                accountNo: customerList[2].accountNumber,
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
                customerId: customerList[3].id,
                customerName: customerList[3].name,
                accountNo: customerList[3].accountNumber,
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

            customerList: customerList,
            currencyList: currencyList,
            accountsList: accountsList,
            bankList: bankList,
            bankBranchList: [],
            invoiceList: invoiceList,
            costCenterHierachyList: costCenterHierachyList,

            creditMemoList: initialCreditMemos,
            today: moment().format("YYYY-MM-DD"),
           
        };
    },

    computed: {
        creditMemoColumns() {
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
                    key: 'customerId',
                    label: 'Customer',
                    type: 'select',
                    options: this.customerList,
                    value: 'id',
                    display: 'name',
                    required: true,
                    searchable: true,
                    width:  180
                },
                {
                    key: 'accountNo',
                    label: 'Account Number',
                    searchable: true,
                    width:  180
                },
                {
                    key: 'invoiceNo',
                    label: 'Invoice Number',
                    searchable: true,
                    width:  180
                },
                {
                    key: 'isInvoiceDebit',
                    label: 'Invoice Debit',
                    type: 'boolean',
                    width: 20
                },
                {
                    key: 'currencyId',
                    label: 'Currency',
                    type: 'select',
                    options: this.currencyList,
                    display: 'currencyName',
                    value: 'id',
                    width:  180
                },
                {
                    key: 'buyRate',
                    label: 'Buy Rate',
                    type: 'number',
                    width:  180,
                    decimals: 4
                },
                {
                    key: 'amount',
                    label: 'Amount',
                    type: 'number',
                    required: true,
                    width:  180,
                    decimals: 2
                },
                {
                    key: 'modeOfPayment',
                    label: 'Payment Method',
                    type: 'select',
                    options: [
                        { id: 'cash', name: 'Cash' },
                        { id: 'cheque', name: 'Cheque' },
                        { id: 'bankTransfer', name: 'Bank Transfer' },
                        { id: 'mobileMoney', name: 'Mobile Money' }
                    ],
                    display: 'name',
                    value: 'id',
                    width:  180
                },
                {
                    key: 'transactionDate',
                    label: 'Transaction Date',
                    type: 'date',
                    width:  180,
                    defaultValue: this.today
                },
                {
                    key: 'bankId',
                    label: 'Bank',
                    type: 'select',
                    options: this.bankList,
                    display: 'name',
                    value: 'id',
                    width:  200
                },
                {
                    key: 'debitGlId',
                    label: 'Debit GL',
                    type: 'select',
                    options: this.accountsList,
                    display: 'accountIdentifier',
                    value: 'id',
                    width: 200
                },
                {
                    key: 'creditGlId',
                    label: 'Credit GL',
                    type: 'select',
                    options: this.accountsList,
                    display: 'accountIdentifier',
                    value: 'id',
                    width: 200
                },
                {
                    key: 'ouId',
                    label: 'OU / Cost Centre',
                    type: 'select',
                    options: this.costCenterHierachyList,
                    display: 'name',
                    value: 'id',
                    width: 200
                },
                {
                    key: 'description',
                    label: 'Description',
                    searchable: true,
                    width: 200
                }
            ];
        },

        selectedCustomer() {
            return this.customerList.find(
                customer => customer.id === this.form.customerId
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
            return this.creditMemoList.reduce(
                (total, memo) => total + (Number(memo.amount) || 0),
                0
            );
        },

        invoiceDebitCount() {
            return this.creditMemoList.filter(
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

        getCustomerDetails(id) {
            return this.customerList.find(customer => customer.id === id) || null;
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
            return this.creditMemoList.find(memo => memo.id === id) || null;
        },

        onCreate() {
            this.isEditing = false;
        },

        onUpdate(event) {
           
            const row = event?.row;

            
            const existingRecord = this.creditMemoList.find(
                item => item.id === row.id
            );

            if (!existingRecord) {
                this.toastHandler('memo record was not found.', 'error');
                return;
            }
            this.isEditing = true;
            this.editingId = event.id;

            const updatePayload = {
                ...existingRecord,
                ...row,
                id: existingRecord.id,
                tenantId: existingRecord.tenantId
            };

            this.toastHandler('success', 'memo updated successfully.');
           
        },

        async onDelete(record) {
            if (!record) {
                this.toastHandler('warning', 'Select a credit memo to delete.');
                return;
            }

            const id = typeof record === 'string' ? record : record.id;
            const memo = this.getMemoDetails(id) || record;

            if (!memo || !memo.id) {
                this.toastHandler('error', 'Unable to identify the credit memo.');
                return;
            }

            const confirmed = await this.confirmAction(
                'Delete credit memo?',
                `Delete ${memo.invoiceNo || 'this credit memo'} for ${memo.customerName || 'this customer'}?`,
                'Yes, delete'
            );

            if (!confirmed) {
                return;
            }

            this.creditMemoList = this.creditMemoList.filter(
                item => item.id !== id
            );

            this.toastHandler('success', 'Credit memo deleted successfully.');
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
                customerId: '',
                customerName: '',
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
            const customer = this.getCustomerDetails(this.form.customerId);

            if (customer) {
                this.form.customerName = customer.name;
                this.form.accountNo = customer.accountNumber;
            } else {
                this.form.customerName = '';
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
                this.form.customerId = invoice.customerId;
                this.form.customerName = invoice.customerName;
                this.form.accountNo = (
                    this.getCustomerDetails(invoice.customerId) || {}
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

            if (!this.form.customerId) {
                this.toastHandler('warning', 'Please select a customer.');
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
                this.toastHandler('warning', 'Please select an invoice for an invoice credit memo.');
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
                    const index = this.creditMemoList.findIndex(
                        memo => memo.id === this.editingId
                    );

                    if (index === -1) {
                        this.toastHandler('error', 'Credit memo could not be found.');
                        return;
                    }

                    this.creditMemoList.splice(index, 1, payload);
                    this.toastHandler('success', 'Credit memo updated successfully.');
                } else {
                    this.creditMemoList.unshift(payload);
                    this.toastHandler('success', 'Credit memo created successfully.');
                }

                this.showModal = false;
            } catch (error) {
                console.error(error);
                this.toastHandler('error', 'Unable to save credit memo.');
            } finally {
                this.isLoading = false;
            }
        }
    },

    watch: {
        'form.customerId'() {
            const customer = this.getCustomerDetails(this.form.customerId);

            if (customer) {
                this.form.customerName = customer.name;
                this.form.accountNo = customer.accountNumber;
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
                    this.form.customerId = invoice.customerId;
                    this.form.customerName = invoice.customerName;
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



