const app = Vue.createApp({
    data() {
        const emptyGuid = '00000000-0000-0000-0000-000000000000';

        const accounts = [
            {
                id: 'acc-001',
                accountIdentifier: '5100 - Office Supplies'
            },
            {
                id: 'acc-002',
                accountIdentifier: '5200 - Travel and Transport'
            },
            {
                id: 'acc-003',
                accountIdentifier: '5300 - Professional Services'
            },
            {
                id: 'acc-004',
                accountIdentifier: '1400 - VAT Paid'
            },
            {
                id: 'acc-005',
                accountIdentifier: '1410 - NHIL Paid'
            }
        ];

        return {
            theme: '#0645e7',
            emptyGuid,
            accountsList: accounts,
            currencyList: [],
            suppliers:[],
            costCenters:[],
            // All invoice columns are defined here.
            invoiceColumns: [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true,
                    searchable: false
                },
                {
                    key: 'tenantId',
                    label: 'Tenant ID',
                    type: 'number',
                    hidden: true
                },
                {
                    key: 'invoiceNumber',
                    label: 'Invoice #',
                    type: 'text',
                    width: 150,
                    required: true,
                    searchable: true
                },
                {
                    key: 'batchNumber',
                    label: 'Batch #',
                    type: 'text',
                    width: 130,
                    searchable: true
                },
                {
                    key: 'supplierName',
                    label: 'Supplier',
                    type: 'select',
                    options: this.suppliers,
                    width: 220,
                    required: true,
                    searchable: true
                },
                {
                    key: 'accountNumber',
                    label: 'Supplier Account',
                    type: 'text',
                    width: 150,
                    searchable: true
                },
                {
                    key: 'invoiceDate',
                    label: 'Invoice Date',
                    type: 'date',
                    width: 130,
                    searchable: true
                },
                {
                    key: 'projectedPayDate',
                    label: 'Projected Pay Date',
                    type: 'date',
                    width: 160,
                    searchable: true
                },
                {
                    key: 'purchaseOrderNumber',
                    label: 'Purchase Order #',
                    type: 'text',
                    width: 150,
                    searchable: true
                },
                {
                    key: 'voucherNumber',
                    label: 'Voucher #',
                    type: 'text',
                    width: 130,
                    searchable: true
                },
                {
                    key: 'referenceNumber',
                    label: 'Reference #',
                    type: 'text',
                    width: 140,
                    searchable: true
                },
                {
                    key: 'description',
                    label: 'Description',
                    type: 'text',
                    width: 220,
                    searchable: true
                },
                {
                    key: 'currencyName',
                    label: 'Currency',
                    type: 'select',
                    options: this.currencyList,
                    width: 120,
                    searchable: true
                },
                {
                    key: 'buyRate',
                    label: 'Buy Rate',
                    type: 'number',
                    width: 110
                },
                {
                    key: 'totalInvoiceAmount',
                    label: 'Invoice Total',
                    type: 'number',
                    width: 150,
                    searchable: true
                },
                {
                    key: 'amount',
                    label: 'Amount',
                    type: 'number',
                    width: 130
                },
                {
                    key: 'paidAmount',
                    label: 'Paid Amount',
                    type: 'number',
                    width: 140
                },
                {
                    key: 'balance',
                    label: 'Balance',
                    type: 'number',
                    width: 140
                },
                {
                    key: 'vatRate',
                    label: 'VAT Rate',
                    type: 'number',
                    width: 100
                },
                {
                    key: 'vatAmount',
                    label: 'VAT Amount',
                    type: 'number',
                    width: 130
                },
                {
                    key: 'withHeldAmount',
                    label: 'Withheld Amount',
                    type: 'number',
                    width: 150
                },
                {
                    key: 'accountingPeriod',
                    label: 'Accounting Period',
                    type: 'text',
                    width: 150,
                    searchable: true
                },
                {
                    key: 'ouName',
                    label: 'OU / Cost Center',
                    type: 'select',
                    options: this.costCenters,
                    width: 180,
                    searchable: true
                },
                {
                    key: 'liabilityAccountName',
                    label: 'Liability Account',
                    type: 'select',
                    options: this.accountsList,
                    width: 220,
                    searchable: true
                },
                {
                    key: 'status',
                    label: 'Status',
                    type: 'text',
                    width: 120,
                    searchable: true
                },
                {
                    key: 'isApproved',
                    label: 'Approved',
                    type: 'boolean',
                    width: 110
                },
                {
                    key: 'isPosted',
                    label: 'Posted',
                    type: 'boolean',
                    width: 100
                },
                {
                    key: 'isCanceled',
                    label: 'Canceled',
                    type: 'boolean',
                    width: 110
                },
                {
                    key: 'isMultiCurrency',
                    label: 'Multi-Currency',
                    type: 'boolean',
                    width: 140
                },
                {
                    key: 'supplierId',
                    label: 'Supplier ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'currencyId',
                    label: 'Currency ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'ouId',
                    label: 'OU ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'liabilityAccountId',
                    label: 'Liability Account ID',
                    type: 'select',
                    options: this.accountsList,
                    hidden: true
                }
            ],

            // The key must match the child array on each invoice.
            invoiceDetailChild: {
                key: 'invoiceDetails',
                title: 'Invoice Details',
                columns: [
                    {
                        key: 'id',
                        label: 'ID',
                        type: 'text',
                        hidden: true
                    },
                    {
                        key: 'invoiceId',
                        label: 'Invoice ID',
                        type: 'text',
                        hidden: true
                    },
                    {
                        key: 'referenceNumber',
                        label: 'Reference #',
                        type: 'text',
                        width: 140,
                        searchable: true
                    },
                    {
                        key: 'description',
                        label: 'Description',
                        type: 'text',
                        width: 230,
                        required: true,
                        searchable: true
                    },
                    {
                        key: 'debitAccountId',
                        label: 'Debit G/L Account',
                        type: 'select',
                        width: 230,
                        options: accounts,
                        optionLabel: 'accountIdentifier',
                        optionValue: 'id'
                    },
                    {
                        key: 'debitAccountName',
                        label: 'Account Name',
                        type: 'text',
                        width: 220,
                        searchable: true
                    },
                    {
                        key: 'quantity',
                        label: 'Quantity',
                        type: 'number',
                        width: 110,
                        required: true
                    },
                    {
                        key: 'unitPrice',
                        label: 'Unit Price',
                        type: 'number',
                        width: 130,
                        required: true
                    },
                    {
                        key: 'discountAsPercentage',
                        label: 'Discount As %',
                        type: 'boolean',
                        width: 130
                    },
                    {
                        key: 'discount',
                        label: 'Discount %',
                        type: 'number',
                        width: 120
                    },
                    {
                        key: 'amount',
                        label: 'Discount Amount',
                        type: 'number',
                        width: 150
                    },
                    {
                        key: 'subTotal',
                        label: 'Subtotal',
                        type: 'number',
                        width: 140
                    }
                ]
            },

            invoiceList: [
                {
                    id: 'inv-001',
                    tenantId: 2,
                    invoiceNumber: 'INV-2026-001',
                    batchNumber: 'BATCH-001',
                    supplierId: 'sup-001',
                    supplierName: 'Accra Office Supplies Ltd.',
                    accountNumber: 'SUP-1001',
                    invoiceDate: '2026-09-15',
                    projectedPayDate: '2026-10-15',
                    purchaseOrderNumber: 'PO-2026-001',
                    voucherNumber: 'PV-2026-001',
                    referenceNumber: 'REF-1001',
                    description: 'Office stationery and consumables',
                    currencyId: 'cur-001',
                    currencyName: 'Ghana Cedi',
                    currencyCode: 'GHS',
                    minorName: 'Pesewa',
                    buyRate: 1,
                    sellRate: 1,
                    amount: 4200,
                    totalInvoiceAmount: 4200,
                    paidAmount: 1000,
                    balance: 3200,
                    vatRate: 15,
                    vatAmount: 420,
                    withHeldAmount: 0,
                    accountingPeriod: '2026-09',
                    ouId: 'ou-001',
                    ouName: 'ACAD / Administration',
                    liabilityAccountId: 'acc-006',
                    liabilityAccountName: '2100 - Accounts Payable',
                    status: 'Pending',
                    isApproved: false,
                    isPosted: false,
                    isCanceled: false,
                    isMultiCurrency: false,
                    invoiceDetails: [
                        {
                            id: 'det-001',
                            invoiceId: 'inv-001',
                            referenceNumber: 'REF-1001',
                            description: 'Printer paper and stationery',
                            debitAccountId: 'acc-001',
                            debitAccountName: '5100 - Office Supplies',
                            quantity: 20,
                            unitPrice: 100,
                            discountAsPercentage: false,
                            discount: 0,
                            amount: 0,
                            subTotal: 2000
                        },
                        {
                            id: 'det-002',
                            invoiceId: 'inv-001',
                            referenceNumber: 'REF-1001',
                            description: 'Printer toner cartridges',
                            debitAccountId: 'acc-001',
                            debitAccountName: '5100 - Office Supplies',
                            quantity: 10,
                            unitPrice: 120,
                            discountAsPercentage: true,
                            discount: 10,
                            amount: 120,
                            subTotal: 1080
                        },
                        {
                            id: 'det-003',
                            invoiceId: 'inv-001',
                            referenceNumber: 'REF-1001',
                            description: 'VAT',
                            debitAccountId: 'acc-004',
                            debitAccountName: '1400 - VAT Paid',
                            quantity: 1,
                            unitPrice: 420,
                            discountAsPercentage: false,
                            discount: 0,
                            amount: 0,
                            subTotal: 420
                        }
                    ]
                },
                {
                    id: 'inv-002',
                    tenantId: 2,
                    invoiceNumber: 'INV-2026-002',
                    batchNumber: 'BATCH-002',
                    supplierId: 'sup-002',
                    supplierName: 'Reliable Transport Services',
                    accountNumber: 'SUP-1002',
                    invoiceDate: '2026-09-22',
                    projectedPayDate: '2026-10-22',
                    purchaseOrderNumber: 'PO-2026-014',
                    voucherNumber: 'PV-2026-002',
                    referenceNumber: 'REF-1002',
                    description: 'Vehicle and transport expenses',
                    currencyId: 'cur-001',
                    currencyName: 'Ghana Cedi',
                    currencyCode: 'GHS',
                    minorName: 'Pesewa',
                    buyRate: 1,
                    sellRate: 1,
                    amount: 2850,
                    totalInvoiceAmount: 2850,
                    paidAmount: 0,
                    balance: 2850,
                    vatRate: 15,
                    vatAmount: 0,
                    withHeldAmount: 0,
                    accountingPeriod: '2026-09',
                    ouId: 'ou-002',
                    ouName: 'ACAD / Transport',
                    liabilityAccountId: 'acc-006',
                    liabilityAccountName: '2100 - Accounts Payable',
                    status: 'Pending',
                    isApproved: true,
                    isPosted: false,
                    isCanceled: false,
                    isMultiCurrency: false,
                    invoiceDetails: [
                        {
                            id: 'det-004',
                            invoiceId: 'inv-002',
                            referenceNumber: 'REF-1002',
                            description: 'Vehicle maintenance',
                            debitAccountId: 'acc-002',
                            debitAccountName: '5200 - Travel and Transport',
                            quantity: 1,
                            unitPrice: 1500,
                            discountAsPercentage: false,
                            discount: 0,
                            amount: 0,
                            subTotal: 1500
                        },
                        {
                            id: 'det-005',
                            invoiceId: 'inv-002',
                            referenceNumber: 'REF-1002',
                            description: 'Fuel and transport',
                            debitAccountId: 'acc-002',
                            debitAccountName: '5200 - Travel and Transport',
                            quantity: 1,
                            unitPrice: 1350,
                            discountAsPercentage: false,
                            discount: 0,
                            amount: 0,
                            subTotal: 1350
                        }
                    ]
                },
                {
                    id: 'inv-003',
                    tenantId: 2,
                    invoiceNumber: 'INV-2026-003',
                    batchNumber: 'BATCH-003',
                    supplierId: 'sup-003',
                    supplierName: 'Professional IT Solutions',
                    accountNumber: 'SUP-1003',
                    invoiceDate: '2026-10-01',
                    projectedPayDate: '2026-11-01',
                    purchaseOrderNumber: 'PO-2026-025',
                    voucherNumber: 'PV-2026-003',
                    referenceNumber: 'REF-1003',
                    description: 'IT support and software services',
                    currencyId: 'cur-001',
                    currencyName: 'Ghana Cedi',
                    currencyCode: 'GHS',
                    minorName: 'Pesewa',
                    buyRate: 1,
                    sellRate: 1,
                    amount: 6500,
                    totalInvoiceAmount: 6500,
                    paidAmount: 6500,
                    balance: 0,
                    vatRate: 15,
                    vatAmount: 0,
                    withHeldAmount: 0,
                    accountingPeriod: '2026-10',
                    ouId: 'ou-001',
                    ouName: 'ACAD / Administration',
                    liabilityAccountId: 'acc-006',
                    liabilityAccountName: '2100 - Accounts Payable',
                    status: 'Paid',
                    isApproved: true,
                    isPosted: true,
                    isCanceled: false,
                    isMultiCurrency: false,
                    invoiceDetails: [
                        {
                            id: 'det-006',
                            invoiceId: 'inv-003',
                            referenceNumber: 'REF-1003',
                            description: 'Annual IT support',
                            debitAccountId: 'acc-003',
                            debitAccountName: '5300 - Professional Services',
                            quantity: 1,
                            unitPrice: 5000,
                            discountAsPercentage: false,
                            discount: 0,
                            amount: 0,
                            subTotal: 5000
                        },
                        {
                            id: 'det-007',
                            invoiceId: 'inv-003',
                            referenceNumber: 'REF-1003',
                            description: 'Software licensing',
                            debitAccountId: 'acc-003',
                            debitAccountName: '5300 - Professional Services',
                            quantity: 1,
                            unitPrice: 1500,
                            discountAsPercentage: false,
                            discount: 0,
                            amount: 0,
                            subTotal: 1500
                        }
                    ]
                }
            ]
        };
    },

    methods: {
        createId(prefix = 'inv') {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
            }

            return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        },

        money(value) {
            return Number(value || 0).toFixed(2);
        },

        normalizeDetail(detail, invoiceId) {
            const item = {
                ...detail,
                id: detail.id || this.createId('det'),
                invoiceId: invoiceId || detail.invoiceId || '',
                referenceNumber: detail.referenceNumber || '',
                description: String(detail.description || '').trim(),
                quantity: Number(detail.quantity || 0),
                unitPrice: Number(detail.unitPrice || 0),
                discountAsPercentage: Boolean(detail.discountAsPercentage),
                discount: Number(detail.discount || 0),
                amount: Number(detail.amount || 0)
            };

            const account = this.accountsList.find(
                a => a.id === item.debitAccountId
            );

            item.debitAccountName =
                account?.accountIdentifier || item.debitAccountName || 'Unknown';

            const gross = item.quantity * item.unitPrice;
            const discountAmount = item.discountAsPercentage
                ? gross * item.discount / 100
                : item.amount;

            item.amount = Number(discountAmount.toFixed(2));
            item.subTotal = Number(
                Math.max(0, gross - discountAmount).toFixed(2)
            );

            return item;
        },

        recalculateInvoice(invoice) {
            if (!invoice) return;

            invoice.invoiceDetails = (invoice.invoiceDetails || []).map(
                detail => this.normalizeDetail(detail, invoice.id)
            );

            const total = invoice.invoiceDetails.reduce(
                (sum, detail) => sum + Number(detail.subTotal || 0),
                0
            );

            invoice.totalInvoiceAmount = Number(total.toFixed(2));
            invoice.amount = invoice.totalInvoiceAmount;

            const paid = Number(invoice.paidAmount || 0);
            invoice.balance = Number(Math.max(0, total - paid).toFixed(2));

            if (invoice.balance === 0 && paid > 0) {
                invoice.status = 'Paid';
            } else if (paid > 0) {
                invoice.status = 'Partially Paid';
            } else {
                invoice.status = invoice.status || 'Pending';
            }
        },

        onCreate(payload) {
            const invoice = {
                ...payload,
                id: payload?.id || this.createId('inv'),
                tenantId: payload?.tenantId ?? 2,
                invoiceNumber: payload?.invoiceNumber || `INV-${Date.now()}`,
                supplierName: payload?.supplierName || 'New Supplier',
                invoiceDate: payload?.invoiceDate || new Date().toISOString().slice(0, 10),
                projectedPayDate: payload?.projectedPayDate || '',
                currencyName: payload?.currencyName || 'Ghana Cedi',
                currencyCode: payload?.currencyCode || 'GHS',
                paidAmount: Number(payload?.paidAmount || 0),
                isApproved: Boolean(payload?.isApproved),
                isPosted: Boolean(payload?.isPosted),
                isCanceled: Boolean(payload?.isCanceled),
                invoiceDetails: (payload?.invoiceDetails || []).map(
                    detail => this.normalizeDetail(detail, payload?.id)
                )
            };

            this.recalculateInvoice(invoice);
            this.invoiceList.unshift(invoice);
            this.notify('Invoice added locally.');
        },

        onUpdate(payload) {
            if (!payload?.id) {
                this.notify('The invoice ID is missing.', 'warning');
                return;
            }

            const index = this.invoiceList.findIndex(
                invoice => invoice.id === payload.id
            );

            if (index === -1) {
                this.notify('Invoice not found.', 'error');
                return;
            }

            const existing = this.invoiceList[index];

            const updated = {
                ...existing,
                ...payload,
                // Preserve child details unless the update explicitly includes them.
                invoiceDetails: Array.isArray(payload.invoiceDetails)
                    ? payload.invoiceDetails
                    : existing.invoiceDetails
            };

            this.recalculateInvoice(updated);
            this.invoiceList.splice(index, 1, updated);
            this.notify('Invoice updated locally.');
        },

        async onDelete(payload) {
            const invoiceId = typeof payload === 'object'
                ? payload?.id
                : payload;

            const invoice = this.invoiceList.find(
                item => item.id === invoiceId
            );

            if (!invoice) {
                this.notify('Invoice not found.', 'error');
                return;
            }

            if (invoice.isPosted) {
                this.notify('Posted invoices cannot be deleted.', 'warning');
                return;
            }

            if (typeof Swal !== 'undefined') {
                const result = await Swal.fire({
                    title: 'Delete invoice?',
                    text: `Delete ${invoice.invoiceNumber} and its local detail rows?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc2626',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: 'Yes, delete',
                    cancelButtonText: 'Keep invoice',
                    reverseButtons: true
                });

                if (!result.isConfirmed) return;
            }

            this.invoiceList = this.invoiceList.filter(
                item => item.id !== invoiceId
            );

            this.notify('Invoice deleted locally.');
        },

        notify(message, type = 'success') {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: type,
                    title: message,
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            } else {
                console.log(message);
            }
        }
    }
});

app.use(DataGridPlugin);
app.mount('#app');
