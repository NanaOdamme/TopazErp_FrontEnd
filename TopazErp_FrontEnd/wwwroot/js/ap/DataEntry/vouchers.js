const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,
            payload: {},
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            voucherList:[],
            vouchers: [
                {
                    id: "11111111-aaaa-1111-aaaa-111111111111",
                    invoiceNumber: "INV-2026-001",
                    voucherNumber: "PV-2026-001",
                    supplierName: "Melcom Limited",
                    description: "Office equipment purchase",
                    liabilityAccountName: "2001 - Accounts Payable",
                    bankAccountName: "1002 - Main Bank Account",
                    vatWithHoldAccountName: "2002 - VAT Withholding Account",
                    creditAccountName: "2003 - Withholding Tax Payable",
                    paymentAmount: 5000.00,
                    netAmount: 4500.00,
                    vatWithHeld: 250.00,
                    withHeld: 250.00,
                    buyRate: 1.00,
                    ou: "FINANCE",
                    voucherEntryDate: "2026-10-01T00:00:00",
                    paymentDate: "2026-10-05T00:00:00",
                    isPosted: false
                },
                {
                    id: "22222222-bbbb-2222-bbbb-222222222222",
                    invoiceNumber: "INV-2026-002",
                    voucherNumber: "PV-2026-002",
                    supplierName: "Papaye Fast Food",
                    description: "Catering services",
                    liabilityAccountName: "2001 - Accounts Payable",
                    bankAccountName: "1003 - Business Savings Account",
                    vatWithHoldAccountName: "2002 - VAT Withholding Account",
                    creditAccountName: "2003 - Withholding Tax Payable",
                    paymentAmount: 2500.00,
                    netAmount: 2400.00,
                    vatWithHeld: 100.00,
                    withHeld: 0.00,
                    buyRate: 1.00,
                    ou: "ADMIN",
                    voucherEntryDate: "2026-10-03T00:00:00",
                    paymentDate: "2026-10-07T00:00:00",
                    isPosted: false
                },
                {
                    id: "33333333-cccc-3333-cccc-333333333333",
                    invoiceNumber: "INV-2026-003",
                    voucherNumber: "PV-2026-003",
                    supplierName: "Office World Ghana",
                    description: "Stationery supplies",
                    liabilityAccountName: "2001 - Accounts Payable",
                    bankAccountName: "1002 - Main Bank Account",
                    vatWithHoldAccountName: "2002 - VAT Withholding Account",
                    creditAccountName: "2003 - Withholding Tax Payable",
                    paymentAmount: 1200.00,
                    netAmount: 1200.00,
                    vatWithHeld: 0.00,
                    withHeld: 0.00,
                    buyRate: 1.00,
                    ou: "FINANCE",
                    voucherEntryDate: "2026-10-06T00:00:00",
                    paymentDate: "2026-10-10T00:00:00",
                    isPosted: true
                },
                {
                    id: "44444444-dddd-4444-dddd-444444444444",
                    invoiceNumber: "INV-2026-004",
                    voucherNumber: "PV-2026-004",
                    supplierName: "Accra Stationery Supplies",
                    description: "Printing materials",
                    liabilityAccountName: "2001 - Accounts Payable",
                    bankAccountName: "1004 - Operations Account",
                    vatWithHoldAccountName: "2002 - VAT Withholding Account",
                    creditAccountName: "2003 - Withholding Tax Payable",
                    paymentAmount: 1800.00,
                    netAmount: 1700.00,
                    vatWithHeld: 0.00,
                    withHeld: 100.00,
                    buyRate: 1.00,
                    ou: "ADMIN",
                    voucherEntryDate: "2026-10-08T00:00:00",
                    paymentDate: "2026-10-12T00:00:00",
                    isPosted: false
                }
            ],
            invoiceList: [
                {
                    id: "11111111-1111-1111-1111-111111111111",
                    invoiceNumber: "INV-2026-001",
                    supplierName: "Melcom Limited",
                    invoiceDate: "2026-10-01T00:00:00",
                    isPosted: true,
                    isCanceled: false,
                    balance: 2500.00,
                    invoiceDetails: [
                        {
                            id: "detail-001",
                            description: "Office Furniture",
                            quantity: 2,
                            unitPrice: 1500.00,
                            subTotal: 3000.00
                        },
                        {
                            id: "detail-002",
                            description: "VAT",
                            quantity: 1,
                            unitPrice: 450.00,
                            subTotal: 450.00
                        },
                        {
                            id: "detail-003",
                            description: "NHIL",
                            quantity: 1,
                            unitPrice: 75.00,
                            subTotal: 75.00
                        }
                    ],
                    invoiceTaxLevies: [
                    ]
                },
                {
                    id: "22222222-2222-2222-2222-222222222222",
                    invoiceNumber: "INV-2026-002",
                    supplierName: "Office World Ghana",
                    invoiceDate: "2026-10-05T00:00:00",
                    isPosted: true,
                    isCanceled: false,
                    balance: 1800.00,
                    invoiceDetails: [
                        {
                            id: "detail-004",
                            description: "Printer Paper",
                            quantity: 10,
                            unitPrice: 120.00,
                            subTotal: 1200.00
                        },
                        {
                            id: "detail-005",
                            description: "Printer Toner",
                            quantity: 2,
                            unitPrice: 300.00,
                            subTotal: 600.00
                        },
                        {
                            id: "detail-006",
                            description: "VAT",
                            quantity: 1,
                            unitPrice: 270.00,
                            subTotal: 270.00
                        }
                    ],
                    invoiceTaxLevies: [
                    ]
                },
                {
                    id: "33333333-3333-3333-3333-333333333333",
                    invoiceNumber: "INV-2026-003",
                    supplierName: "Accra Stationery Supplies",
                    invoiceDate: "2026-10-08T00:00:00",
                    isPosted: true,
                    isCanceled: false,
                    balance: 0.00,
                    invoiceDetails: [
                        {
                            id: "detail-007",
                            description: "Stationery",
                            quantity: 5,
                            unitPrice: 200.00,
                            subTotal: 1000.00
                        },
                        {
                            id: "detail-008",
                            description: "VAT",
                            quantity: 1,
                            unitPrice: 150.00,
                            subTotal: 150.00
                        }
                    ],
                    invoiceTaxLevies: [
                        {
                            id: "122-34",
                            name: "VAT",
                            rate: 15,
                            amount: 100.00,
                        },
                        {
                            id: "122-33",
                            name: "GETFL",
                            rate: 15,
                            amount: 100.00,
                        },
                        {
                            id: "122-34",
                            name: "NHIL",
                            rate: 15,
                            amount: 100.00,
                        }
                    ]
                },
                {
                    id: "44444444-4444-4444-4444-444444444444",
                    invoiceNumber: "INV-2026-004",
                    supplierName: "Papaye Fast Food",
                    invoiceDate: "2026-10-10T00:00:00",
                    isPosted: true,
                    isCanceled: false,
                    balance: 900.00,
                    invoiceDetails: [
                        {
                            id: "detail-009",
                            description: "Catering Services",
                            quantity: 1,
                            unitPrice: 900.00,
                            subTotal: 900.00
                        }
                    ],
                    invoiceTaxLevies: [
                        {
                            id: "122-34",
                            name: "VAT",
                            rate: 15,
                            amount: 100.00,
                        },
                        {
                            id: "122-33",
                            name: "GETFL",
                            rate: 15,
                            amount: 100.00,
                        },
                        {
                            id: "122-34",
                            name: "NHIL",
                            rate: 15,
                            amount: 100.00,
                        }
                    ]
                },
                {
                    id: "55555555-5555-5555-5555-555555555555",
                    invoiceNumber: "INV-2026-005",
                    supplierName: "Ghana Office Solutions",
                    invoiceDate: "2026-10-12T00:00:00",
                    isPosted: true,
                    isCanceled: false,
                    balance: 1200.00,
                    invoiceDetails: [
                        {
                            id: "detail-010",
                            description: "Computer Accessories",
                            quantity: 1,
                            unitPrice: 1200.00,
                            subTotal: 1200.00
                        }
                    ],
                    invoiceTaxLevies: [
                        {
                            id: "122-34",
                            name: "VAT",
                            rate: 15,
                            amount: 100.00,
                        },
                        {
                            id: "122-33",
                            name: "GETFL",
                            rate: 15,
                            amount: 100.00,
                        },
                        {
                            id: "122-34",
                            name: "NHIL",
                            rate: 15,
                            amount: 100.00,
                        }
                    ]
                }
            ],
            voucherNumber: '0',
            invoiceId: '',
            invoiceDetailsList: this.detailsList,
            supplierList: [
                {
                    id: "11111111-1111-1111-1111-111111111111",
                    name: "Accra Stationery Supplies",
                    statusName: "Active"
                },
                {
                    id: "22222222-2222-2222-2222-222222222222",
                    name: "Ghana Office Solutions",
                    statusName: "Active"
                },
                {
                    id: "33333333-3333-3333-3333-333333333333",
                    name: "Melcom Limited",
                    statusName: "Active"
                },
                {
                    id: "44444444-4444-4444-4444-444444444444",
                    name: "Office World Ghana",
                    statusName: "Inactive"
                },
                {
                    id: "55555555-5555-5555-5555-555555555555",
                    name: "Papaye Fast Food",
                    statusName: "Active"
                },
                {
                    id: "66666666-6666-6666-6666-666666666666",
                    name: "Prime Business Services",
                    statusName: "Pending"
                }
            ],
            supplierId: '',
            supplierName: '',
            referenceNumber: '',
            accountNumber: '',
            invoiceNumber: '',
            currencyList: [
                {
                    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                    currencyName: "Ghana Cedis",
                    currencyCode: "GHS",
                    buyRate: 1.0000
                },
                {
                    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                    currencyName: "US Dollar",
                    currencyCode: "USD",
                    buyRate: 12.5000
                },
                {
                    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
                    currencyName: "British Pound",
                    currencyCode: "GBP",
                    buyRate: 16.8000
                },
                {
                    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
                    currencyName: "Euro",
                    currencyCode: "EUR",
                    buyRate: 14.2000
                },
                {
                    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                    currencyName: "Nigerian Naira",
                    currencyCode: "NGN",
                    buyRate: 0.0080
                }
            ],
            currencyId: '',
            currencyName: '',
            buyRate: '',
            sellRate: '',
            invoiceAmount: '',
            balance: '',
            minorName: '',
            description: '',
            liabilityAccountId: '',
            liabilityAccountCode: '',
            bankList: [],
            bankBranchList: [],
            bankId: '',
            bankName: '',
            bankBranchId: '',
            bankBranchCode: '',
            payCurrencyId: '',
            payCurrencyName: '',
            payCurrencyCode: '',
            payCurrencyBuyRate: '',
            payCurrencySellRate: '',
            paymentAmount: '0.00',
            paymentDate: moment().format("YYYY-MM-DD"),
            modeOfPayment: 'Cash',
            chequeNumber: '0',
            voucherDetails: [],
            withHoldingRate: '0.00',
            isWithHolding: false,
            GETFL: false,
            GETFLRate: 0,
            NHIL: false,
            NHILRate: 0,
            Vat: false,
            CSTRate: 0,
            COVIDRate: 0,
            VatRate: 0,
            withHeld: '0.00',
            vatWithheld: '0.00',
            total: '0.00',
            vatAmount: '0.00',
            netAmount: '0.00',
            vatWithHoldAccountId: '',
            vatWithHoldAccountName: '',
            creditAccountId: '',
            creditAccountName: '',
            voucherId: '',
            bankAccountId: '',
            voucherDescription: '',
            cash: true,
            cheque: false,
            totalTaxAmount: '0.00',
            VatWithHeldRate: '0.00',
            isVatWithHolding: false,
            voucherEntryDate: moment().format("YYYY-MM-DD"),
            invoiceDate: moment().format("YYYY-MM-DD"),
            isPosted: false,
            defaultCurrency: {},
            batchNumber: '',
            accountsList: [
                {
                    id: "11111111-1111-1111-1111-111111111111",
                    accountNo: "1001",
                    accountName: "Cash Account"
                },
                {
                    id: "22222222-2222-2222-2222-222222222222",
                    accountNo: "1002",
                    accountName: "Bank Account"
                },
                {
                    id: "33333333-3333-3333-3333-333333333333",
                    accountNo: "2001",
                    accountName: "Accounts Payable"
                },
                {
                    id: "44444444-4444-4444-4444-444444444444",
                    accountNo: "2002",
                    accountName: "VAT Withholding Account"
                },
                {
                    id: "55555555-5555-5555-5555-555555555555",
                    accountNo: "3001",
                    accountName: "Withholding Tax Account"
                },
                {
                    id: "66666666-6666-6666-6666-666666666666",
                    accountNo: "4001",
                    accountName: "Office Expenses"
                }
            ],
            taxLevyList: [
                {
                    id: "tax-001",
                    name: "VAT",
                    type: "VAT",
                    rate: 15.00,
                    amount: 0,
                    isApplied: false,
                    isDisabled: false
                },
                {
                    id: "tax-002",
                    name: "NHIL",
                    type: "VAT",
                    rate: 2.50,
                    amount: 0,
                    isApplied: false,
                    isDisabled: false
                },
                {
                    id: "tax-003",
                    name: "GETFL",
                    type: "VAT",
                    rate: 2.50,
                    amount: 0,
                    isApplied: false,
                    isDisabled: false
                },
                {
                    id: "tax-004",
                    name: "COVID",
                    type: "VAT",
                    rate: 0.00,
                    amount: 0,
                    isApplied: false,
                    isDisabled: false
                },
                {
                    id: "tax-005",
                    name: "CST",
                    type: "VAT",
                    rate: 0.00,
                    amount: 0,
                    isApplied: false,
                    isDisabled: false
                }
            ],
            covidRate: 0,
            cstRate: 0,
            covid: false,
            cst: false,
            userIsEditingRate: false,
            bankAccountList: [
                {
                    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                    accountNo: "1002",
                    accountName: "Main Bank Account",
                    bankName: "GCB Bank",
                    branchName: "Accra Main Branch",
                    accountNumber: "0123456789"
                },
                {
                    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                    accountNo: "1003",
                    accountName: "Business Savings Account",
                    bankName: "Ecobank Ghana",
                    branchName: "Osu Branch",
                    accountNumber: "9876543210"
                },
                {
                    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
                    accountNo: "1004",
                    accountName: "Operations Account",
                    bankName: "Absa Bank Ghana",
                    branchName: "Airport Branch",
                    accountNumber: "1234567890"
                }
            ],
           
            vatInInvoice: true,
            isVatInclusive: true,
            baseAmount: '0.00',
            isMultiCurrency: false,
            baseAmount2: '0.00',
            vatCertificate: '',
            invoiceEditList: []
        }
    },
    methods: {
        generateRefNo() {   
            this.referenceNumber = Math.floor(100000 + Math.random() * 900000).toString();
        },
        getBusinessProfile() {
                    this.isVatInclusive = false;
        },

        getDefaultGlSetup() {
            const responseData = {
                accountsPayableAccountId: "GL-AP-001",
                vatPaidAccountId: "GL-VAT-001",
                accountPayablesBankAccountId: "GL-BANK-001",
                withholdingTaxAccountId: "GL-WHT-001"
            };

            this.debitAccountId = responseData.accountsPayableAccountId;
            this.vatWithHoldAccountId = responseData.vatPaidAccountId;
            this.bankAccountId = responseData.accountPayablesBankAccountId;
            this.creditAccountId = responseData.withholdingTaxAccountId;
        },

        getTaxLevies() {
            if (this.taxLevyList.length > 0) {
                const vat = this.taxLevyList.find(
                    tax => tax.name.toLowerCase() === "vat"
                );

                const nhil = this.taxLevyList.find(
                    tax => tax.name.toLowerCase() === "nhil"
                );

                const getfl = this.taxLevyList.find(
                    tax => tax.name.toLowerCase() === "getfl"
                );

                const covid = this.taxLevyList.find(
                    tax => tax.name.toLowerCase() === "covid"
                );

                const cst = this.taxLevyList.find(
                    tax => tax.name.toLowerCase() === "cst"
                );

                this.VatRate = vat ? parseFloat(vat.rate).toFixed(2) : "0.00";
                this.NHILRate = nhil ? parseFloat(nhil.rate).toFixed(2) : "0.00";
                this.GETFLRate = getfl ? parseFloat(getfl.rate).toFixed(2) : "0.00";
                this.covidRate = covid ? parseFloat(covid.rate).toFixed(2) : "0.00";
                this.cstRate = cst ? parseFloat(cst.rate).toFixed(2) : "0.00";

                this.vatList = this.taxLevyList.filter(
                    tax => tax.type.toLowerCase() === "vat"
                );

                this.NHIL = nhil?.isApplied || false;
                this.Vat = vat?.isApplied || false;
                this.GETFL = getfl?.isApplied || false;
                this.covid = covid?.isApplied || false;
                this.cst = cst?.isApplied || false;
            }
            return this.taxLevyList;
        },
        syncTaxFlags() {
            this.Vat = this.taxLevyList.find(t => t.name.toLowerCase() === 'vat')?.isApplied || false;
            this.NHIL = this.taxLevyList.find(t => t.name.toLowerCase() === 'nhil')?.isApplied || false;
            this.GETFL = this.taxLevyList.find(t => t.name.toLowerCase() === 'getfl')?.isApplied || false;
            this.covid = this.taxLevyList.find(t => t.name.toLowerCase() === 'covid')?.isApplied || false;
            this.cst = this.taxLevyList.find(t => t.name.toLowerCase() === 'cst')?.isApplied || false;
        },

        initPaymentVoucher() {
                this.accountsList.forEach(account => {
                    account.accountIdentifier =
                        `${account.accountNo} - ${account.accountName}`;
                });

                this.accountsList.sort((a, b) => {
                    return Number(a.accountNo) - Number(b.accountNo);
                });
           
                return this.accountsList
           
        },

      
        getAccountDetails(id) {
            return this.accountsList.find(a => a.id === id);
        },
        toggleCash() {
            this.cash = true;
            this.cheque = false;
            this.InitModeOfPayment();
        },
        toggleCheque() {
            this.cash = false;
            this.cheque = true;
            this.InitModeOfPayment();
        },
        InitModeOfPayment() {
            this.modeOfPayment = this.cash ? 'Cash' : 'Cheque';
        },
        getVouchers() {
            this.voucherList = this.vouchers
                .filter(voucher => !voucher.isPosted)
                .sort((a, b) =>
                    a.invoiceNumber.localeCompare(b.invoiceNumber)
                );

            this.voucherDetails = [];
            this.voucherDetailsMap = {};

            this.voucherList.forEach(voucher => {
                const details = [];

                // Liability (debit)
                details.push({
                    id: voucher.id,
                    account: voucher.liabilityAccountName,
                    description: voucher.description,
                    debitAmount: voucher.paymentAmount,
                    creditAmount: 0,
                    buyRate: voucher.buyRate
                });

                // Bank (credit)
                details.push({
                    id: voucher.id,
                    account: voucher.bankAccountName,
                    description: voucher.description,
                    debitAmount: 0,
                    creditAmount: voucher.netAmount,
                    buyRate: voucher.buyRate
                });

                // VAT withheld (credit)
                if (parseFloat(voucher.vatWithHeld) > 0) {
                    details.push({
                        id: voucher.id,
                        account: voucher.vatWithHoldAccountName,
                        description: "Withholding VAT",
                        debitAmount: 0,
                        creditAmount: voucher.vatWithHeld,
                        buyRate: voucher.buyRate
                    });
                }

                // Withholding tax (credit)
                if (parseFloat(voucher.withHeld) > 0) {
                    details.push({
                        id: voucher.id,
                        account: voucher.creditAccountName,
                        description: "Withholding Amount",
                        debitAmount: 0,
                        creditAmount: voucher.withHeld,
                        ou: voucher.ou,
                        referenceNumber: voucher.invoiceNumber,
                        buyRate: voucher.buyRate
                    });
                }

                // Save voucher details
                this.voucherDetailsMap[voucher.id] = details;
                this.voucherDetails.push(...details);

                // Dropdown display text
                voucher.displayText =
                    `${voucher.supplierName} - ${voucher.voucherNumber}`;

                // Format dates
                voucher.voucherEntryDate =
                    this.formatDate(voucher.voucherEntryDate);

                voucher.paymentDate =
                    this.formatDate(voucher.paymentDate);
            });

            // Build grid
            this.dataTable(this.voucherList, this.voucherDetails);

        },
        getVoucherDetails(id) {
            return this.voucherList.find(a => a.id === id);
        },
        dataTable(responseData, voucherDetails) {
            $("#dataTable").ejGrid({
                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                scrollSettings: { width: "1200px", height: "400px" },
                editSettings: { allowDeleting: true, showDeleteConfirmDialog: true },
                toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Delete, ej.Grid.ToolBarItems.Update, ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                childGrid: {
                    dataSource: voucherDetails,
                    queryString: "id",
                    allowPaging: true,
                    allowSorting: true,
                    isResponsive: true,
                    pageSettings: { pageSize: 10 },
                    editSettings: {},
                    toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                    columns: [
                        { field: "id", headerText: 'Id', visible: false, isPrimaryKey: true },
                        { field: "account", headerText: "Account", width: 100 },
                        { field: "description", headerText: 'Description', textAlign: ej.TextAlign.Left, width: 120 },
                        { field: "debitAmount", headerText: "Debit Amount", width: 80, format: "{0:n2}" },
                        { field: "creditAmount", headerText: "Credit Amount", width: 80, format: "{0:n2}" },
                        { field: "buyRate", headerText: "Buy Rate", format: "{0:n4}", width: 80 }
                    ],
                },

                columns: [
                    { field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true },
                    { field: "batchNumber", headerText: "Batch Number", width: 65 },
                    { field: "voucherEntryDate", headerText: "Entry Date", width: 75, format: "{0:yyyy-MM-dd}" },
                    { field: "supplierName", headerText: "Recipient", textAlign: ej.TextAlign.Left, width: 85 },
                    { field: "payCurrencyName", headerText: "Currency", textAlign: ej.TextAlign.Left, width: 75 },
                    { field: "chequeNumber", headerText: "Cheque No.", width: 65, textAlign: ej.TextAlign.Left, },
                    { field: "tenantId", visible: false, headerText: "Tenant Id", width: 15 }
                ],
                endDelete: (args) => {
                    this.deleteVoucher(args.data.id);
                }
            });
        },
        getInvoices() {
            
            // Sort invoices by invoice number
            this.invoiceList.sort((a, b) =>
                a.invoiceNumber.localeCompare(b.invoiceNumber)
            );

            // Only posted, uncanceled invoices with an outstanding balance
            this.invoiceList.filter(invoice =>
                invoice.isPosted === true &&
                invoice.isCanceled === false &&
                invoice.balance > 0
            );

            this.invoiceDetailsMap = {};

            this.invoiceList.forEach(invoice => {
                invoice.invoiceId = invoice.id;

                invoice.invoiceDate = this.formatDate(invoice.invoiceDate);

                invoice.displayText =
                    `${invoice.supplierName} - ${invoice.invoiceNumber}`;

                const descriptions = ["VAT", "NHIL", "GETFL", "COVID", "CST"];

                invoice.baseAmount = (invoice.invoiceDetails || [])
                    .filter(detail =>
                        !descriptions.includes(detail.description)
                    )
                    .reduce(
                        (sum, detail) => sum + parseFloat(detail.subTotal || 0),
                        0
                    )
                    .toFixed(2);

                this.baseAmount = invoice.baseAmount;

                this.invoiceDetailsMap[invoice.id] =
                    (invoice.invoiceDetails || []).map(detail => {
                        detail.invoiceId = invoice.id;
                        return detail;
                    });
            });

            // Initialize invoice data table
            this.invoiceDataTable([]);

            return this.invoiceList;
        },
        invoiceDataTable(responseData) {
            $("#invoiceDataTable").ejGrid({
                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Search] },

                childGrid: {
                    dataSource: this.invoiceDetailsList,
                    queryString: "invoiceId",
                    allowPaging: true,
                    allowSorting: true,
                    isResponsive: true,
                    pageSettings: { pageSize: 10 },
                    toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Search] },
                    columns: [
                        { field: "id", headerText: 'Id', visible: false, isPrimaryKey: true, width: 80 },
                        { field: "invoiceId", headerText: 'Invoice Id', visible: false, width: 80 },
                        { field: "referenceNumber", headerText: 'Ref No', textAlign: ej.TextAlign.Left, width: 60 },
                        { field: "description", headerText: "Description", width: 80 },
                        { field: "unitPrice", headerText: "Unit Price", width: 65, format: "{0:n2}" },
                        { field: "quantity", headerText: "Quantity", width: 65 },
                        { field: "subTotal", headerText: "Sub Total", width: 65, format: "{0:n2}" },
                    ]
                },
                columns: [
                    { field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true },
                    { field: "supplierName", headerText: "Supplier", textAlign: ej.TextAlign.Left, width: 75 },
                    { field: "currencyName", headerText: "Currency", textAlign: ej.TextAlign.Left, width: 75 },
                    {
                        field: "buyRate",
                        headerText: "Currency Rate",
                        format: "{0:n4}",
                        textAlign: ej.TextAlign.Left,
                        width: 75
                    },
                    { field: "totalInvoiceAmount", headerText: "Total Amount", width: 80, format: "{0:n2}" },
                    {
                        field: "liabilityAccountName",
                        headerText: "Liability G/L:",
                        width: 80,
                        textAlign: ej.TextAlign.Left
                    },
                    { field: "balance", headerText: "Balance", width: 80, format: "{0:n2}" },
                    { field: "invoiceDate", headerText: "Invoice Date", width: 75, format: "{0:yyyy-MM-dd}" },
                    { field: "tenantId", visible: false, headerText: "Tenant Id", width: 15 }
                ],
                summaryRows: [{
                    title: "Base Amount :",
                    summaryColumns: [{
                        summaryType: ej.Grid.SummaryType.Sum,
                        displayColumn: "invoiceDate",
                        dataMember: "baseAmount",
                        format: "{0:n2}"
                    }]
                }]
            });

        },
        setCurrentInvoice() {
            if (this.invoiceId) {
                const invoice = this.invoiceList.find(a => a.id === this.invoiceId);

                this.InvoiceId = invoice.id;
                this.supplierId = invoice.supplierId;
                this.supplierName = invoice.supplierName;
                this.accountNumber = invoice.accountNumber;
                this.invoiceNumber = invoice.invoiceNumber;
                this.currencyId = invoice.currencyId;
                this.currencyName = invoice.currencyName;
                this.currencyCode = invoice.currencyCode;
                this.buyRate = parseFloat(invoice.buyRate).toFixed(4);
                this.sellRate = parseFloat(invoice.sellRate).toFixed(4);
                this.invoiceAmount = parseFloat(invoice.totalInvoiceAmount).toFixed(2);
                this.balance = parseFloat(invoice.balance).toFixed(2);
                this.liabilityAccountId = invoice.liabilityAccountId;
                this.liabilityAccountCode = invoice.liabilityAccountCode;
                this.vatWithHoldingAccountId = invoice.vatWithHoldingAccountId;
                this.vatWithHoldingAccountName = invoice.vatWithHoldingAccountName;
                this.invoiceDetailsList = invoice.invoiceDetails;
                this.invoiceDate = this.formatDate(invoice.invoiceDate);
                this.totalInvoiceAmount = invoice.totalInvoiceAmount;
                if (!this.voucherId) {
                    this.paymentAmount = parseFloat(invoice.balance).toFixed(2);
                }
                this.voucherDescription = invoice.invoiceDetails.map(d => d.description).join(', ');

                $("#voucherId").ejDropDownList({ value: '' });
                this.invoiceDataTable([invoice]);

                  // tax levies
                  const invoiceLevyNames = invoice.invoiceTaxLevies.map(v => v.name);
                  this.vatInInvoice = invoice.invoiceTaxLevies.some(v => v.name === 'VAT');
  
                  this.taxLevyList = this.taxLevyList.map(tax => {
                      const invoiceTax = invoice.invoiceTaxLevies.find(v => v.name === tax.name);
  
                      return {
                          ...tax,
                          isApplied: !!invoiceTax,
                          isDisabled: invoice.invoiceTaxLevies.length === 0 || !invoiceTax,
                          amount: (invoiceTax && tax.name.toLowerCase() !== 'vat')
                              ? parseFloat(invoiceTax.amount).toFixed(2)
                              : null
                      };
                  });
  
                  const taxSum = invoice.invoiceTaxLevies.reduce((sum, tax) => sum + parseFloat(tax.amount || 0), 0);
                  this.totalTaxAmount = parseFloat(taxSum).toFixed(2);
                  this.VatRate = parseFloat(invoice.vatRate).toFixed(2);
                  this.vatAmount = parseFloat(invoice.vatAmount).toFixed(2);

                // ✅ Compute base amounts here instead of in getInvoices()
                const descriptions = ["VAT", "NHIL", "GETFL", "COVID", "CST"];
                const descriptionsNoVat = ["VAT", "CST"];

                this.baseAmount = (invoice.invoiceDetails || [])
                    .filter(detail => !descriptions.includes(detail.description))
                    .reduce((sum, detail) => sum + parseFloat(detail.subTotal || 0), 0)
                    .toFixed(2);

                this.baseAmount2 = (invoice.invoiceDetails || [])
                    .filter(detail => !descriptionsNoVat.includes(detail.description))
                    .reduce((sum, detail) => sum + parseFloat(detail.subTotal || 0), 0)
                    .toFixed(2);
            }
        },

        /* toggleTaxLevy(taxId) {
             this.taxLevyList = this.taxLevyList.map(tax =>
                 tax.id === taxId ? { ...tax, isApplied: !tax.isApplied } : tax
             );
             this.syncTaxFlags();
             this.calculateTotalTaxAmount();
         },*/
        toggleTaxLevy(taxId) {
            const selectedTax = this.taxLevyList.find(t => t.id === taxId);
            if (!selectedTax) return;

            const isCST = selectedTax.name === 'CST' && selectedTax.type.toLowerCase() === 'others';
            const isVAT = selectedTax.name === 'VAT' && selectedTax.type.toLowerCase() === 'vat';

            this.taxLevyList = this.taxLevyList.map(tax => {
                if (isCST || isVAT) {
                    const isOther = (tax.name === 'CST' && tax.type.toLowerCase() === 'others') ||
                        (tax.name === 'VAT' && tax.type.toLowerCase() === 'vat');

                    if (isOther) {
                        return {
                            ...tax,
                            isApplied: tax.id === taxId ? !selectedTax.isApplied : false
                        };
                    }
                }
                return tax.id === taxId
                    ? { ...tax, isApplied: !tax.isApplied }
                    : tax;
            });

            this.syncTaxFlags();
            this.calculateTotalTaxAmount();
        },
        getSuppliers() {
           

            // Sort suppliers alphabetically and keep active suppliers only
            this.supplierList.sort((a, b) => a.name.localeCompare(b.name));
            
        },

        getCurrency() {
            

            // Find Ghana cedi as the default currency
            this.defaultCurrency = this.currencyList.find(currency => {
                const name = (currency.currencyName || "").trim().toLowerCase();

                return name === "ghana cedis" || name === "ghana cedi";
            });

            if (this.defaultCurrency) {
                this.payCurrencyId = this.defaultCurrency.id;
                this.payCurrencyBuyRate = parseFloat(
                    this.defaultCurrency.buyRate
                ).toFixed(4);
            }

            // Initialize currency dropdown
            $("#payCurrencyId").ejDropDownList({
                dataSource: this.currencyList,
                width: "100%",
                watermarkText: "Select Currency",
                fields: {
                    id: "id",
                    text: "currencyName",
                    value: "id"
                },
                enableFilterSearch: true,
                value: this.payCurrencyId,
                change: (args) => {
                    this.payCurrencyId = args.value;

                    // Update the buy rate for the selected currency
                    const selectedCurrency = this.currencyList.find(
                        currency => currency.id === args.value
                    );

                    if (selectedCurrency) {
                        this.payCurrencyBuyRate = parseFloat(
                            selectedCurrency.buyRate
                        ).toFixed(4);
                    }
                }
            });
        },
        getSupplierDetails(id) {
            return this.supplierList.find(a => a.id === id);
        },
       
        getCurrencyDetails(id) {
            return this.currencyList.find(a => a.id === id);
        },
        getBanks() {
            this.bankList = [
                {
                    id: "11111111-aaaa-1111-aaaa-111111111111",
                    name: "GCB Bank"
                },
                {
                    id: "22222222-bbbb-2222-bbbb-222222222222",
                    name: "Ecobank Ghana"
                },
                {
                    id: "33333333-cccc-3333-cccc-333333333333",
                    name: "Absa Bank Ghana"
                },
                {
                    id: "44444444-dddd-4444-dddd-444444444444",
                    name: "Fidelity Bank Ghana"
                },
                {
                    id: "55555555-eeee-5555-eeee-555555555555",
                    name: "Stanbic Bank Ghana"
                },
                {
                    id: "66666666-ffff-6666-ffff-666666666666",
                    name: "Zenith Bank Ghana"
                },
                {
                    id: "77777777-aaaa-7777-aaaa-777777777777",
                    name: "CalBank"
                },
                {
                    id: "88888888-bbbb-8888-bbbb-888888888888",
                    name: "Access Bank Ghana"
                }
            ];

            $("#bankId").ejDropDownList({
                dataSource: this.bankList,
                watermarkText: "Select Bank",
                width: "100%",
                fields: {
                    id: "id",
                    text: "name",
                    value: "id"
                },
                enableFilterSearch: true,
                change: (args) => {
                    this.bankId = args.value;
                }
            });
        },
        getBankDetails(id) {

            return this.bankList.find(a => a.id === id);
        },
        getBankBranchDetails(id) {

            return this.bankBranchList.find(a => a.id === id);
        },
        getInvoiceDetails(id) {
            return this.invoiceList.find(a => a.id === id);
        },
        formatDate(dateInput) {

            return moment(dateInput).format("YYYY-MM-DD");

        },
       
        uuid() {

            return([1e7]+ -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        },
        saveVoucher() {
            this.isLoading = true;
            this.InitModeOfPayment();
            let payload = {};
            if (this.voucherNumber === null || this.voucherNumber === '') {
                payload.voucherNumber = '0';
            }
            console.log("CreditAccountId:", this.creditAccountId);

            payload.voucherNumber = this.voucherNumber;
            payload.chequeNumber = this.chequeNumber;
            if (this.invoiceId) {
                let invoiceInfo = this.getInvoiceDetails(this.invoiceId);
                if (invoiceInfo) {
                    payload.invoiceId = invoiceInfo.id;
                    payload.invoiceNumber = invoiceInfo.invoiceNumber;
                    payload.invoiceAmount = invoiceInfo.totalInvoiceAmount;
                    payload.invoiceDate = invoiceInfo.invoiceDate;
                    payload.currencyId = invoiceInfo.currencyId;
                    payload.currencyName = invoiceInfo.currencyName;
                    payload.currencyCode = invoiceInfo.currencyCode;
                    payload.buyRate = invoiceInfo.buyRate;
                    payload.sellRate = invoiceInfo.sellRate;
                    payload.balance = invoiceInfo.balance;
                    payload.liabilityAccountId = invoiceInfo.liabilityAccountId;
                    payload.liabilityAccountCode = invoiceInfo.liabilityAccountCode;
                    payload.liabilityAccountName = invoiceInfo.liabilityAccountName;
                    payload.supplierId = invoiceInfo.supplierId;
                    payload.supplierName = invoiceInfo.supplierName;
                    payload.accountNumber = invoiceInfo.accountNumber;
                    
                    let mappedVoucherDetails = invoiceInfo.invoiceDetails.map(detail => {
                        return {
                            id: this.uuid(),
                            description: detail.description || 'N/A',
                            amount: detail.subTotal || 0,
                            isWithHolding: false,
                        };
                    });
                    payload.details = mappedVoucherDetails;
                }
            }
            if (this.payCurrencyId) {
                let currencyInfo = this.getCurrencyDetails(this.payCurrencyId);
                if (currencyInfo) {
                    payload.payCurrencyId = this.payCurrencyId;
                    payload.payCurrencyName = currencyInfo.currencyName;
                    payload.payCurrencyCode = currencyInfo.currencyCode;
                    payload.minorName = currencyInfo.minorName;
                    payload.payCurrencyBuyRate = currencyInfo.buyRate;
                    payload.payCurrencySellRate = currencyInfo.sellRate;
                }
            }
            if (this.bankId) {

                let bankInfo = this.getBankDetails(this.bankId);
                if (bankInfo) {
                    payload.bankId = this.bankId;
                    payload.bankName = bankInfo.name;
                }

            } else {

                payload.bankId = this.emptyGuid;
            }
            if (this.bankBranchId) {

                let bankBranchInfo = this.getBankBranchDetails(this.bankBranchId);
                if (bankBranchInfo) {
                    payload.bankBranchId = this.bankBranchId;
                    payload.departmentName = bankBranchInfo.name;
                }


            } else {
                payload.bankBranchId = this.emptyGuid;
            }
            payload.voucherEntryDate = this.voucherEntryDate;
            payload.paymentDate = this.paymentDate;
            payload.VatWithHeldRate = this.VatWithHeldRate;
            payload.paymentAmount = this.paymentAmount;
            payload.modeOfPayment = this.modeOfPayment;
            payload.checkNumber = this.checkNumber;
            payload.batchNumber = this.batchNumber;
            payload.getfl = this.GETFL;
            payload.getflRate = this.GETFLRate;
            payload.nhil = this.NHIL;
            payload.nhilRate = this.NHILRate;
            payload.vat = this.Vat;
            payload.vatRate = this.VatRate;
            payload.covid = this.covid;
            payload.covidRate = this.covidRate;
            payload.cst = this.cst;
            payload.cstRate = this.cstRate;
            payload.withHeld = this.withHeld;
            payload.vatWithheld = this.vatWithheld;
            payload.total = this.total;
            payload.vatAmount = this.vatAmount;
            payload.netAmount = this.netAmount;
            payload.isWithHolding = this.isWithHolding;
            payload.withHoldingRate = this.withHoldingRate;
            payload.isMultiCurrency = this.isMultiCurrency;
            payload.referenceNumber = this.referenceNumber;
           if (this.vatWithHoldAccountId) {
                let vatWithHoldingAccount = this.getAccountDetails(this.vatWithHoldAccountId);
                if (vatWithHoldingAccount) {
                    payload.vatWithHoldAccountId = this.vatWithHoldAccountId;
                    payload.vatWithHoldAccountName = `${vatWithHoldingAccount.accountNo} - ${vatWithHoldingAccount.accountName}`;
                }
            }
            else {
                payload.vatWithHoldAccountId = this.emptyGuid;
                payload.vatWithHoldAccountName = '';
            }
           
            if (this.creditAccountId) {
                let creditAccount = this.getAccountDetails(this.creditAccountId);
                if (creditAccount) {
                    payload.creditAccountId = this.creditAccountId;
                    payload.creditAccountName = `${creditAccount.accountNo} - ${creditAccount.accountName}`;
                }
            } else {
                payload.creditAccountId = this.emptyGuid;
                payload.creditAccountName = '';
            }
            
            if (this.bankAccountId) {
                let bankGlAccount = this.getAccountDetails(this.bankAccountId);
                if (bankGlAccount) {
                    payload.bankAccountId = this.bankAccountId;
                    payload.bankAccountName = `${bankGlAccount.accountNo} - ${bankGlAccount.accountName}`;
                }
            } else {
                payload.bankAccountId = this.emptyGuid;
                payload.bankGlAccountName = '';
            }
            payload.description = this.voucherDescription;
            payload.isWithHolding = this.isWithHolding;
            payload.isVatWithHolding = this.isVatWithHolding;
            payload.totalTaxAmount = this.totalTaxAmount;
            payload.isPosted = this.isPosted;

            if (this.voucherId) {
                payload.id = this.voucherId;
                payload.tenantId = this.tenantId;
                axios.post('/ApDataEntry/UpdateVoucher', payload)
                    .then(response => {
                        this.getVouchers();
                        this.isLoading = false;
                        this.toastHandler('', 'voucher updated.');
                    })
                    // redirect to voucher action page
                    
                    .catch(err => {
                        this.isLoading = false;
                        this.toastHandler('error', 'Unable to update voucher.');
                    });
            } else {
                axios.post('/ApDataEntry/CreateVoucher', payload)
                    .then(response => {
                        if (response.data.code === 200) {
                            this.toastHandler('', 'Voucher saved.');
                            this.getVouchers();
                            this.isLoading = false;
                            this.voucherId = response.data.id;
                            this.voucherNumber = response.data.voucherNumber;
                            // redirect to voucher action page
                           window.location.href = `/ApDataEntry/VoucherAction`;
                        } else {
                            this.isLoading = false;
                            this.toastHandler('error', response.data.message);
                        }
                    })
                    .catch(err => {
                        this.isLoading = false;
                        this.toastHandler('error', 'Unable to raise voucher.');
                    });
            }

        },
        calculateWithHeldDetails() {
            this.total = parseFloat(this.paymentAmount).toFixed(2);
            this.netAmount = this.total;

            // reset first
            this.withHeld = 0;
            this.vatWithheld = 0;

            // Normal Withholding
            if (this.isWithHolding) {
                this.withHeld = ((this.totalInvoiceAmount - this.totalTaxAmount) * this.withHoldingRate / 100).toFixed(2);
            }

            // VAT Withholding (independent of WithHolding)
            if (this.isVatWithHolding) {
                this.vatWithheld = ((this.totalInvoiceAmount - this.totalTaxAmount) * this.VatWithHeldRate / 100).toFixed(2);
            }

            // Calculate Net Amount after deductions
            this.netAmount = (this.total - this.withHeld - this.vatWithheld).toFixed(2);

            // If neither is selected, reset everything
            if (!this.isWithHolding && !this.isVatWithHolding) {
                this.withHeld = '0.00';
                this.vatWithheld = '0.00';
                this.VatWithHeldRate = '0.00';
            }
        },
        calculateTotalTaxAmount() {
            let subTotal = Array.isArray(this.invoiceDetailsList)
                ? this.invoiceDetailsList.reduce((acc, detail) => {
                    // Exclude if description matches any of the tax items
                    if (
                        !['VAT', 'NHIL', 'GETFL', 'COVID', 'CST'].includes(
                            (detail.description || '').toUpperCase()
                        )
                    ) {
                        return acc + parseFloat(detail.subTotal || 0);
                    }
                    return acc;
                }, 0)
                : 0;


            const nhilAmount = this.NHIL && parseFloat(this.NHILRate) > 0
                ? subTotal * parseFloat(this.NHILRate) / 100
                : 0;

            const getflAmount = this.GETFL && parseFloat(this.GETFLRate) > 0
                ? subTotal * parseFloat(this.GETFLRate) / 100
                : 0;

            const covidAmount = this.covid && parseFloat(this.covidRate) > 0
                ? subTotal * parseFloat(this.covidRate) / 100
                : 0;

            const cstAmount = this.cst && parseFloat(this.cstRate) > 0
                ? subTotal * parseFloat(this.cstRate) / 100
                : 0;
            const vatAmount = this.Vat && parseFloat(this.VatRate) > 0
                ? subTotal * parseFloat(this.VatRate) / 100
                : 0;

            const newAmount = subTotal + nhilAmount + getflAmount + covidAmount + cstAmount + vatAmount;

           /* let vatAmount = 0;
            if (this.Vat && parseFloat(this.VatRate) > 0) {
                vatAmount = newAmount * parseFloat(this.VatRate) / 100;
            }*/

            this.vatAmount = vatAmount.toFixed(2);
            this.totalTaxAmount = (vatAmount + nhilAmount + getflAmount + covidAmount + cstAmount).toFixed(2);
          
        },
        setCurrentVoucher() {
            if (this.voucherId) {
                const voucher = this.voucherList.find(a => a.id === this.voucherId);
                this.batchNumber = voucher.batchNumber;
                this.voucherNumber = voucher.voucherNumber;
                this.invoiceId = voucher.invoiceId;
                this.invoiceNumber = voucher.invoiceNumber;
                this.supplierId = voucher.supplierId;
                this.supplierName = voucher.supplierName;
                this.accountNumber = voucher.accountNumber;
                this.minorName = voucher.minorName;
                this.currencyId = voucher.currencyId;
                this.currencyName = voucher.currencyName;
                this.currencyCode = voucher.currencyCode;
                this.buyRate = parseFloat(voucher.buyRate).toFixed(4);
                this.sellRate = parseFloat(voucher.sellRate).toFixed(4);
                this.invoiceAmount = parseFloat(voucher.invoiceAmount).toFixed(2);
                this.voucherEntryDate = this.formatDate(voucher.voucherEntryDate);
                this.balance = parseFloat(voucher.balance).toFixed(2);
                this.liabilityAccountId = voucher.liabilityAccountId;
                this.liabilityAccountCode = voucher.liabilityAccountCode;
                this.liabilityAccountName = voucher.liabilityAccountName;
                this.bankId = voucher.bankId;
                this.bankName = voucher.bankName;
                this.bankBranchId = voucher.bankBranchId;
                this.bankBranchCode = voucher.bankBranchCode;
                this.bankBranchName = voucher.bankBranchName;
                this.paymentDate = this.formatDate(voucher.paymentDate);
                this.paymentAmount = parseFloat(voucher.paymentAmount).toFixed(2);
                this.modeOfPayment = voucher.modeOfPayment;
                if (this.modeOfPayment === 'Cash') {
                    this.cash = true;
                    this.cheque = false;
                } else {
                    this.cash = false;
                    this.cheque = true;
                }
                this.chequeNumber = voucher.chequeNumber;
                this.GETFL = voucher.getfl;
                this.GETFLRate = voucher.getflRate;
                this.NHIL = voucher.nhil;
                this.NHILRate = voucher.nhilRate;
                this.Vat = voucher.vat;
                this.VatRate = voucher.vatRate;
                this.covid = voucher.covid;
                this.covidRate = voucher.covidRate;
                this.cst = voucher.cst;
                this.cstRate = voucher.cstRate;
                this.payCurrencyId = voucher.payCurrencyId;
                this.payCurrencyName = voucher.payCurrencyName;
                this.payCurrencyCode = voucher.payCurrencyCode;
                this.payCurrencyBuyRate = parseFloat(voucher.payCurrencyBuyRate).toFixed(4);
                this.payCurrencySellRate = voucher.payCurrencySellRate;
                this.withHeld = voucher.withHeld;
                this.isVatWithHolding = voucher.isVatWithHolding;
                this.total = voucher.total;
                this.isWithHolding = voucher.isWithHolding;
                this.withHoldingRate = parseFloat(voucher.withHoldingRate).toFixed(2);
                this.vatAmount = voucher.vatAmount;
                this.netAmount = voucher.netAmount;
                this.vatWithHoldingAccountId = voucher.vatWithHoldingAccountId;
                this.vatWithHoldingAccountName = voucher.vatWithHoldingAccountName;
                this.creditAccountId = voucher.creditAccountId;
                this.creditAccountName = voucher.creditAccountName;
                this.bankGlAccountId = voucher.bankGlAccountId;
                this.voucherDescription = voucher.description;
                this.voucherDetails = voucher.details;
                this.totalTaxAmount = voucher.totalTaxAmount;
                this.isPosted = voucher.isPosted;
                this.referenceNumber = voucher.referenceNumber;
                this.tenantId = voucher.tenantId;
                this.taxLevyList = this.taxLevyList.map(tax => {
                    switch (tax.name.toLowerCase()) {
                        case 'vat':
                            return { ...tax, isApplied: this.Vat };
                        case 'nhil':
                            return { ...tax, isApplied: this.NHIL };
                        case 'getfl':
                            return { ...tax, isApplied: this.GETFL };
                        case 'covid':
                            return { ...tax, isApplied: this.covid };
                        case 'cst':
                            return { ...tax, isApplied: this.cst };
                        default:
                            return tax;
                    }
                });
                const taxNames = ['vat', 'nhil', 'getfl', 'covid', 'cst'];

                taxNames.forEach(taxName => {
                    const rateKey = `${taxName}Rate`;
                    const voucherRate = voucher[rateKey];

                    if (!voucherRate || voucherRate === 0) {
                        const tax = this.taxLevyList.find(t => t.name.toLowerCase() === taxName);
                        this[rateKey] = tax ? parseFloat(tax.rate).toFixed(2) : "0.00";
                    } else {
                        this[rateKey] = parseFloat(voucherRate).toFixed(2);
                    }
                });

                this.$nextTick(() => {
                    this.calculateWithHeldDetails();
                });
            }
        },
        validateAndSaveVoucher() {
            if (this.$refs.voucherForm.checkValidity()) {
                this.saveVoucher();
            } else {
                this.$refs.voucherForm.reportValidity();
            }
        },
        deleteVoucher(id) {

            axios.get('/ApDataEntry/DeleteVoucher/?id=' + id).then(response => {

               this.getVouchers();

                this.toastHandler('', 'Voucher deleted.');


            }).catch(err => {

                this.toastHandler('error', 'Unable to delete Voucher.');

            });
        },
        printReport() {
            let voucherId = this.voucherId || '';
            let reportUrl = `/ApReports/PrintPaymentVoucher?id=${voucherId}`;
            window.open(reportUrl, '_blank');
        },
        clearForm() {
            window.location.reload();
        },
        setBuyRate() {
            if (this.payCurrencyId) {
                const currency = this.currencyList.find(a => a.id === this.payCurrencyId);
                this.payCurrencyBuyRate = parseFloat(currency.buyRate).toFixed(4);
            }
        },
        toastHandler(type, message = 'An unexpected error occurred.') {
            if (typeof Swal === 'undefined') {
                console.log(message);
                return;
            }
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                title: message,
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });

        },
        resetBankFields() {
            this.bankId = '';
            this.bankName = '';
            this.bankBranchId = '';
            this.bankBranchName = '';
        },
    },
    watch: {
        
        isVatWithHolding(newValue) {
           this.VatWithHeldRate = newValue ? '7.00' : '0.00';
            this.calculateWithHeldDetails();
        },
        VatWithHeldRate() {
            this.calculateWithHeldDetails();
        },
        withHoldingRate() {
            this.calculateWithHeldDetails();
        },
        isWithHolding(newValue) {
            this.withHoldingRate = newValue ? '7.5' : '0.00';
            this.calculateWithHeldDetails();
        },
        paymentAmount(newAmount) {
            this.total = parseFloat(newAmount).toFixed(2);
            this.calculateWithHeldDetails();
        },

        VatRate(newVal, oldVal) {
            if (this.userIsEditingRate) {
                this.calculateTotalTaxAmount();
            }
        },
        invoiceId(val) {
            if (!val) return;

            // find any ACTIVE (not deleted), UNPOSTED voucher for this invoice
            const openVoucher = Array.isArray(this.voucherList)
                ? this.voucherList.find(v =>
                    v.invoiceId === val &&
                    v.isPosted === false &&
                    v.isDeleted === false
                )
                : null;

            // block only if another active unposted voucher exists
            if (openVoucher && this.voucherId !== openVoucher.id) {
                this.toastHandler(
                    'warning',
                    'Please post the outstanding payment for this invoice before proceeding.'
                );

                // reset model
                this.invoiceId = '';
                

                return;
            }

            // ✅ allowed:
            // - no unposted voucher
            // - OR voucher exists but isDeleted === true
            // - OR editing the same voucher
            this.setCurrentInvoice(val);
        },

        voucherId(val) {
          
            if (val) {
                
                this.setCurrentVoucher();
               
            }
        },
        bankAccountId(newVal) {
            if (!newVal) {
                this.bankName = '';
                this.bankBranchName = '';
                this.bankId = '';
                this.bankBranchId = '';
                return;
            }
            const selectedAccount = this.accountsList.find(
                acc => acc.id === newVal
            );
            const bankAccount = this.bankAccountList.find(
                ba => ba.accountId === selectedAccount.id
            );
            const bank = this.bankList.find(
                b => b.name.toLowerCase() === bankAccount.bankName.toLowerCase()
            );

            this.bankId = bank.id;
            this.bankName = bank.name;

            $("#bankId").ejDropDownList("option", "value", bank.id);

            const branch = bank.bankBranches.find(
                br => br.id === bankAccount.bankBranchId
            );

            if (!branch) {
                this.bankBranchId = '';
                this.bankBranchName = '';
                return;
            }

            this.bankBranchId = branch.id;
            this.bankBranchName = branch.name;

            $("#bankBranchId").ejDropDownList("option", "value", branch.id);
        },
        bankId(val) {
            if (val) {
                const bankInfo = this.getBankDetails(val);

                if (bankInfo) {
                    this.bankBranchList = [...bankInfo.bankBranches].sort((a, b) => {
                        const nameA = a?.name || "";
                        const nameB = b?.name || "";
                        return nameA.localeCompare(nameB);
                    });
                    $("#branchId").ejDropDownList({
                        dataSource: this.bankBranchList,
                        watermarkText: "Select Branch",
                        width: "100%",
                        fields: { id: "id", text: "name", value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            this.bankBranchId = args.value;
                        }
                    });

                    // 🔥 Important: Set the selected branch **after** dropdown is recreated
                    this.$nextTick(() => {
                        if (this.bankBranchId) {
                            $("#branchId").ejDropDownList("option", "value", this.bankBranchId);
                        }
                    });
                }
            }
        },

        payCurrencyId(val) {
            if (val) {
                this.setBuyRate();
                this.isMultiCurrency = val !== this.defaultCurrency.id;

            }
        },
        
    },
    mounted() {
        this.getBusinessProfile();
        this.initPaymentVoucher();
       // this.getBankAccounts();
        this.getCurrency();
        this.getTaxLevies();
        this.setCurrentInvoice();
        this.calculateWithHeldDetails();
        this.getInvoices();
        this.getSuppliers();
        this.getVouchers();
        this.getBanks();
        this.getDefaultGlSetup();
        this.getVouchers();
        this.generateRefNo();
    }
    
});
app.use(DataGridPlugin);
app.use(WSelectPlugin);
    app.mount('#app');