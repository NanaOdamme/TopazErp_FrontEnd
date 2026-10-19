(() => {
    'use strict';
    const accounts = [
        { id: 'acc-001', accountIdentifier: '5100 - Office Supplies' },
        { id: 'acc-002', accountIdentifier: '5200 - Travel and Transport' },
        { id: 'acc-003', accountIdentifier: '5300 - Professional Services' },
        { id: 'acc-004', accountIdentifier: '1400 - VAT Paid' },
        { id: 'acc-005', accountIdentifier: '1410 - NHIL Paid' },
        { id: 'acc-006', accountIdentifier: '2100 - Accounts Payable' }
    ];
    const suppliers = [
        { id: 'sup-001', name: 'Accra Office Supplies Ltd.', accountNumber: 'SUP-1001', address: 'Accra, Ghana' },
        { id: 'sup-002', name: 'Reliable Transport Services', accountNumber: 'SUP-1002', address: 'Tema, Ghana' },
        { id: 'sup-003', name: 'Professional IT Solutions', accountNumber: 'SUP-1003', address: 'Accra, Ghana' },
        { id: 'sup-004', name: 'Golden Coast Enterprises', accountNumber: 'SUP-1004', address: 'Ghana' }
    ];
    const currencies = [
        { id: 'cur-001', name: 'GHS - Ghana Cedi', code: 'GHS', minorName: 'Pesewa', buyRate: 1, sellRate: 1 },
        { id: 'cur-002', name: 'USD - US Dollar', code: 'USD', minorName: 'Cent', buyRate: 11, sellRate: 11 },
        { id: 'cur-003', name: 'EUR - Euro', code: 'EUR', minorName: 'Cent', buyRate: 14, sellRate: 14 }
    ];
    const organizationalUnits = [
        { id: 'ou-001', name: 'ACAD - Administration' },
        { id: 'ou-002', name: 'FIN - Finance Department' },
        { id: 'ou-003', name: 'OPS - Operations' }
    ];

    const detailColumns = {
        key: 'invoiceDetails', title: 'Invoice Details', columns: [
            {key: 'id', label: 'ID', type: 'text', hidden: true, editable: false},
            {key: 'referenceNumber', label: 'Ref No.', type: 'text', searchable: true},
            {key: 'description', label: 'Description', type: 'text', required: true, searchable: true, minWidth: 190},
            {
                key: 'debitAccountId',
                label: 'Debit G/L Account',
                type: 'select',
                options: accounts,
                display: 'accountIdentifier',
                value: 'id',
                minWidth: 210
            },
            {
                key: 'quantity',
                label: 'Quantity',
                type: 'number',
                required: true,
                defaultValue: 1,
                min: 0,
                decimals: 2,
                width: 110
            },
            {
                key: 'unitPrice',
                label: 'Unit Price',
                type: 'number',
                required: true,
                defaultValue: 0,
                min: 0,
                decimals: 2,
                width: 130
            },
            {key: 'discountAsPercentage', label: 'Disc. as %?', type: 'boolean', defaultValue: false, width: 120},
            {key: 'discount', label: 'Discount', type: 'number', defaultValue: 0, min: 0, decimals: 2, width: 120},
            {key: 'amount', label: 'Disc. Amt.', type: 'number', decimals: 2, editable: false, width: 125},
            {key: 'subTotal', label: 'Sub Total', type: 'number', decimals: 2, editable: false, width: 130}
        ]
    };
    const invoiceColumns = [
        { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
        { key: 'tenantId', label: 'Tenant ID', type: 'number', hidden: true, editable: false },
        { key: "canceledDate", label: "Canceled Date", type: 'date', width: 120},
        { key: "canceledBy", label: "Canceled By", width: 120 },
        { key: 'invoiceNumber', label: 'Invoice #', type: 'text', width: 150, required: true, searchable: true },
        { key: 'batchNumber', label: 'Batch #', type: 'text', width: 125, searchable: true },
        { key: 'supplierId', label: 'Supplier', type: 'select', options: suppliers, value: 'id', display: 'name', width: 220, required: true, searchable: true },
        { key: 'invoiceDate', label: 'Invoice Date', type: 'date', width: 130, searchable: true },
        { key: 'projectedPayDate', label: 'Projected Pay Date', type: 'date', width: 160, searchable: true },
        { key: 'currencyId', label: 'Currency', type: 'select', options: currencies, value: 'id', display: 'name', width: 180, searchable: true },
        { key: 'buyRate', label: 'Buy Rate', type: 'number', width: 110, decimals: 4 },
        { key: 'totalInvoiceAmount', label: 'Invoice Total', type: 'number', width: 145, decimals: 2, agg: 'sum' },
        { key: 'balance', label: 'Balance', type: 'number', width: 130, decimals: 2 },
        
    ];
    const taxCatalog = [
        { id: 'a1000000-0000-0000-0000-000000000001', name: 'VAT', type: 'vat', rate: 15, accountId: 'acc-004', isActive: true },
        { id: 'a1000000-0000-0000-0000-000000000002', name: 'NHIL', type: 'others', rate: 2.5, accountId: 'acc-005', isActive: true },
        { id: 'a1000000-0000-0000-0000-000000000003', name: 'GETFL', type: 'others', rate: 2.5, accountId: '', isActive: true },
        { id: 'a1000000-0000-0000-0000-000000000004', name: 'CST', type: 'others', rate: 2.5, accountId: '', isActive: true }
    ];
    const vatTaxId = taxCatalog.find((tax) => tax.type === 'vat').id;
   const invoices = [
       {
           id: 'inv-001', tenantId: 2, invoiceNumber: 'INV-2026-001', batchNumber: 'BATCH-001',
           supplierId: 'sup-001', supplierName: suppliers[0].name, accountNumber: 'SUP-1001',
           invoiceDate: '2026-09-15', projectedPayDate: '2026-10-15', purchaseOrderNumber: 'PO-2026-001',
           voucherNumber: 'PV-2026-001', referenceNumber: 'REF-1001', description: 'Office stationery and consumables',
           currencyId: 'cur-001', currencyName: currencies[0].name, currencyCode: 'GHS', minorName: 'Pesewa',
           buyRate: 1, sellRate: 1, amount: 3542, totalInvoiceAmount: 3542, paidAmount: 1000, balance: 2542,
           vatRate: 15, vatAmount: 462, withHeldAmount: 0, accountingPeriod: '2026-09',
           ouId: 'ou-001', ouName: 'ACAD - Administration', liabilityAccountId: 'acc-006',
           liabilityAccountName: '2100 - Accounts Payable', status: 'Pending', isApproved: false, isPosted: false,
           isCanceled: true, isMultiCurrency: false, isVatInclusive: false, canceledBy:'Akosua Admin', canceledDate:'2026-09-15',
           invoiceTaxLevies: [{ id: vatTaxId, name: 'VAT', rate: 15 }],
           invoiceDetails: [
               { id: 'det-001', invoiceId: 'inv-001', referenceNumber: 'REF-1001', description: 'Printer paper and stationery', debitAccountId: 'acc-001', debitAccountName: accounts[0].accountIdentifier, quantity: 20, unitPrice: 100, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 2000, isTax: false },
               { id: 'det-002', invoiceId: 'inv-001', referenceNumber: 'REF-1001', description: 'Printer toner cartridges', debitAccountId: 'acc-001', debitAccountName: accounts[0].accountIdentifier, quantity: 10, unitPrice: 120, discountAsPercentage: true, discount: 10, amount: 120, subTotal: 1080, isTax: false },
               { id: `tax-${vatTaxId}`, invoiceId: 'inv-001', taxId: vatTaxId, isTax: true, referenceNumber: 'REF-1001', description: 'VAT', debitAccountId: 'acc-004', debitAccountName: accounts[3].accountIdentifier, quantity: 1, unitPrice: 462, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 462 }
           ]
       },
       {
           id: 'inv-002', tenantId: 2, invoiceNumber: 'INV-2026-002', batchNumber: 'BATCH-002',
           supplierId: 'sup-002', supplierName: suppliers[1].name, accountNumber: 'SUP-1002',
           invoiceDate: '2026-09-22', projectedPayDate: '2026-10-22', purchaseOrderNumber: 'PO-2026-014',
           voucherNumber: 'PV-2026-002', referenceNumber: 'REF-1002', description: 'Vehicle and transport expenses',
           currencyId: 'cur-001', currencyName: currencies[0].name, currencyCode: 'GHS', minorName: 'Pesewa',
           buyRate: 1, sellRate: 1, amount: 2850, totalInvoiceAmount: 2850, paidAmount: 0, balance: 2850,
           vatRate: 15, vatAmount: 0, withHeldAmount: 0, accountingPeriod: '2026-09',
           ouId: 'ou-002', ouName: 'FIN - Finance Department', liabilityAccountId: 'acc-006',
           liabilityAccountName: '2100 - Accounts Payable', status: 'Pending', isApproved: true, isPosted: false,
           isCanceled: true, isMultiCurrency: false, isVatInclusive: false, canceledBy:'Akosua Admin', canceledDate:'2026-09-15', invoiceTaxLevies: [],
           invoiceDetails: [
               { id: 'det-004', invoiceId: 'inv-002', referenceNumber: 'REF-1002', description: 'Vehicle maintenance', debitAccountId: 'acc-002', debitAccountName: accounts[1].accountIdentifier, quantity: 1, unitPrice: 1500, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 1500, isTax: false },
               { id: 'det-005', invoiceId: 'inv-002', referenceNumber: 'REF-1002', description: 'Fuel and transport', debitAccountId: 'acc-002', debitAccountName: accounts[1].accountIdentifier, quantity: 1, unitPrice: 1350, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 1350, isTax: false }
           ]
       },
       {
           id: 'inv-003', tenantId: 2, invoiceNumber: 'INV-2026-003', batchNumber: 'BATCH-003',
           supplierId: 'sup-003', supplierName: suppliers[2].name, accountNumber: 'SUP-1003',
           invoiceDate: '2026-10-01', projectedPayDate: '2026-11-01', purchaseOrderNumber: 'PO-2026-025',
           voucherNumber: 'PV-2026-003', referenceNumber: 'REF-1003', description: 'IT support and software services',
           currencyId: 'cur-001', currencyName: currencies[0].name, currencyCode: 'GHS', minorName: 'Pesewa',
           buyRate: 1, sellRate: 1, amount: 6500, totalInvoiceAmount: 6500, paidAmount: 6500, balance: 0,
           vatRate: 15, vatAmount: 0, withHeldAmount: 0, accountingPeriod: '2026-10',
           ouId: 'ou-001', ouName: 'ACAD - Administration', liabilityAccountId: 'acc-006',
           liabilityAccountName: '2100 - Accounts Payable', status: 'Paid', isApproved: true, isPosted: true,
           isCanceled: true, isMultiCurrency: false, isVatInclusive: false, canceledBy:'Admin', canceledDate:'2026-09-15', invoiceTaxLevies: [],
           invoiceDetails: [
               { id: 'det-006', invoiceId: 'inv-003', referenceNumber: 'REF-1003', description: 'Annual IT support', debitAccountId: 'acc-003', debitAccountName: accounts[2].accountIdentifier, quantity: 1, unitPrice: 5000, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 5000, isTax: false },
               { id: 'det-007', invoiceId: 'inv-003', referenceNumber: 'REF-1003', description: 'Software licensing', debitAccountId: 'acc-003', debitAccountName: accounts[2].accountIdentifier, quantity: 1, unitPrice: 1500, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 1500, isTax: false }
           ]
       }];
    const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            invoiceColumns,
            detailColumns,
            invoices,
            accounts,
            isShimmerLoading: false,
            isLoading: false,
            payload: {},
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            invoiceList: invoices,
            invoiceId: '',
            detailsList: [],
            supplierList: [],
            supplierId: '',
            supplierName: '',
            accountNumber: '',
            invoiceNumber: '',
            invoiceDate: moment().format("YYYY-MM-DD"),
            projectedPayDate: moment(this.invoiceDate).add(1, 'months').format("YYYY-MM-DD"),
            balance: '0',
            purchaseOrderNumber: '',
            currencyList: [],
            currencyId: '',
            totalInvoiceAmount: '0',
            amount: '0',
            referenceNumber: '',
            description: '',
            isVatWithheld: false,
            unitPrice: '0',
            quantity: '0',
            subTotal: ' 0',
            paidAmount: '0',
            vatAmount: '0',
            ouId: '',
            ouList: [],
            ouName: '',
            departmentHierachyList: [],
            ouNameList: [],
            debitAccountList: [],
            debitAccountId: '',
            date: moment().format("YYYY-MM-DD"),
            address: '',
            voucherNumber: '',
            batchNumber: '',
            discountAsPercentage: false,
            discount: '0',
            departments: [],
            debitAccountName: '',
            invoiceDetailId: '',
            taxLevyList: [],
            vatId: '',
            vatName: 'None',
            vatList: [],
            vatRate: '15',
            vatIsApplied: false,
            invoiceEdithList: [],
            invoiceBalance: '0',
        }
    },
    methods:{
        getGridData() {
                this.invoiceList.filter((invoice) => invoice.isCanceled === true)
                    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber));

                this.detailsList = [];
                //this.taxLevyList = [];
                this.invoiceDetailsMap = {};
                // this.invoiceTaxMap = {};

                // Process invoice data
                this.invoiceList.forEach((invoice) => {
                    invoice.invoiceId = invoice.id;
                    invoice.invoiceDate = this.formatDate(invoice.invoiceDate);
                    invoice.projectedPayDate = this.formatDate(invoice.projectedPayDate);
                    invoice.canceledDate = this.formatDate(invoice.canceledDate);
                    invoice.paidAmount = invoice.paidAmount + invoice.withheldAmount;
                    this.invoiceDetailsMap[invoice.id] = invoice.invoiceDetails.map((detail) => {
                        detail.invoiceId = invoice.id;
                        this.detailsList.push(detail);
                        return detail;
                    });
                });
              
          
        },
        formatNumber(number) {
            if (number < 0) {
                return `(${Math.abs(number).toFixed(2)})`;
            }
            return number;
        },
    
        formatDate(dateInput) {

            return moment(dateInput).format("YYYY-MM-DD");

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
    },

    mounted() {
        this.getGridData();
    }
});
    app.use(DataGridPlugin);
    app.mount('#app');
})();