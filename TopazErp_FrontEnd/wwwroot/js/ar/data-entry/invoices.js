(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const roundMoney = (value) => Math.round((Number.isFinite(Number(value)) ? Number(value) : 0) * 100) / 100;
    const toNumber = (value, fallback = 0) => {
        if (value === '' || value === null || value === undefined) return fallback;
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    };
    const asBoolean = (value) => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };
    const addDays = (dateString, days) => {
        const d = new Date(`${dateString}T12:00:00`);
        d.setDate(d.getDate() + days);
        return isoDate(d);
    };
    const createId = (prefix = 'id') => {
        const cryptoObject = globalThis.crypto;
        const value = cryptoObject && typeof cryptoObject.randomUUID === 'function'
            ? cryptoObject.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        return `${prefix}-${value}`;
    };

    const today = isoDate(new Date());
    const emptyGuid = EMPTY_GUID;
    const accounts = [
        { id: 'acc-001', accountIdentifier: '5100 - Office Supplies' },
        { id: 'acc-002', accountIdentifier: '5200 - Travel and Transport' },
        { id: 'acc-003', accountIdentifier: '5300 - Professional Services' },
        { id: 'acc-004', accountIdentifier: '1400 - VAT Paid' },
        { id: 'acc-005', accountIdentifier: '1410 - NHIL Paid' },
        { id: 'acc-006', accountIdentifier: '2100 - Accounts Payable' }
    ];
    const taxCatalog = [
        { id: 'a1000000-0000-0000-0000-000000000001', name: 'VAT', type: 'vat', rate: 15, accountId: 'acc-004', isActive: true },
        { id: 'a1000000-0000-0000-0000-000000000002', name: 'NHIL', type: 'others', rate: 2.5, accountId: 'acc-005', isActive: true },
        { id: 'a1000000-0000-0000-0000-000000000003', name: 'GETFL', type: 'others', rate: 2.5, accountId: '', isActive: true },
        { id: 'a1000000-0000-0000-0000-000000000004', name: 'CST', type: 'others', rate: 2.5, accountId: '', isActive: true }
    ];
    const customers = [
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

    const detailColumns = [
        { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
        { key: 'invoiceId', label: 'Invoice ID', type: 'text', hidden: true, editable: false },
        { key: 'taxId', label: 'Tax ID', type: 'text', hidden: true, editable: false },
        { key: 'isTax', label: 'Tax row', type: 'boolean', hidden: true, editable: false },
        { key: 'referenceNumber', label: 'Ref No.', type: 'text', searchable: true },
        { key: 'description', label: 'Description', type: 'text', required: true, searchable: true, minWidth: 190 },
        { key: 'debitAccountId', label: 'Debit G/L Account', type: 'select', options: accounts, display: 'accountIdentifier', value: 'id', minWidth: 210 },
        { key: 'quantity', label: 'Quantity', type: 'number', required: true, defaultValue: 1, min: 0, decimals: 2, width: 110 },
        { key: 'unitPrice', label: 'Unit Price', type: 'number', required: true, defaultValue: 0, min: 0, decimals: 2, width: 130 },
        { key: 'discountAsPercentage', label: 'Disc. as %?', type: 'boolean', defaultValue: false, width: 120 },
        { key: 'discount', label: 'Discount', type: 'number', defaultValue: 0, min: 0, decimals: 2, width: 120 },
        { key: 'amount', label: 'Disc. Amt.', type: 'number', decimals: 2, editable: false, width: 125 },
        { key: 'subTotal', label: 'Sub Total', type: 'number', decimals: 2, editable: false, width: 130 }
    ];

    const invoiceColumns = [
        { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
        { key: 'tenantId', label: 'Tenant ID', type: 'number', hidden: true, editable: false },
        { key: 'invoiceNumber', label: 'Invoice #', type: 'text', width: 150, required: true, searchable: true },
        { key: 'batchNumber', label: 'Batch #', type: 'text', width: 125, searchable: true },
        { key: 'customerId', label: 'Customer', type: 'select', options: customers, value: 'id', display: 'name', width: 220, required: true, searchable: true },
        { key: 'invoiceDate', label: 'Invoice Date', type: 'date', width: 130, searchable: true },
        { key: 'projectedPayDate', label: 'Projected Pay Date', type: 'date', width: 160, searchable: true },
        { key: 'currencyId', label: 'Currency', type: 'select', options: currencies, value: 'id', display: 'name', width: 180, searchable: true },
        { key: 'buyRate', label: 'Buy Rate', type: 'number', width: 110, decimals: 4 },
        { key: 'totalInvoiceAmount', label: 'Invoice Total', type: 'number', width: 145, decimals: 2, agg: 'sum' },
        { key: 'balance', label: 'Balance', type: 'number', width: 130, decimals: 2 },
        { key: 'isApproved', label: 'Approved', type: 'boolean', width: 105 },
        { key: 'isPosted', label: 'Posted', type: 'boolean', width: 100 }
    ];

    const detailChild = { key: 'invoiceDetails', title: 'Invoice Details', columns: detailColumns };
    const vatTaxId = taxCatalog.find((tax) => tax.type === 'vat').id;
    const seedInvoices = [
        {
            id: 'inv-001', tenantId: 2, invoiceNumber: 'INV-2026-001', batchNumber: 'BATCH-001',
            customerId: 'sup-001', customerName: customers[0].name, accountNumber: 'SUP-1001',
            invoiceDate: '2026-09-15', projectedPayDate: '2026-10-15', purchaseOrderNumber: 'PO-2026-001',
            voucherNumber: 'PV-2026-001', referenceNumber: 'REF-1001', description: 'Office stationery and consumables',
            currencyId: 'cur-001', currencyName: currencies[0].name, currencyCode: 'GHS', minorName: 'Pesewa',
            buyRate: 1, sellRate: 1, amount: 3542, totalInvoiceAmount: 3542, paidAmount: 1000, balance: 2542,
            vatRate: 15, vatAmount: 462, withHeldAmount: 0, accountingPeriod: '2026-09',
            ouId: 'ou-001', ouName: 'ACAD - Administration', liabilityAccountId: 'acc-006',
            liabilityAccountName: '2100 - Accounts Payable', status: 'Pending', isApproved: false, isPosted: false,
            isCanceled: false, isMultiCurrency: false, isVatInclusive: false,
            invoiceTaxLevies: [{ id: vatTaxId, name: 'VAT', rate: 15 }],
            invoiceDetails: [
                { id: 'det-001', invoiceId: 'inv-001', referenceNumber: 'REF-1001', description: 'Printer paper and stationery', debitAccountId: 'acc-001', debitAccountName: accounts[0].accountIdentifier, quantity: 20, unitPrice: 100, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 2000, isTax: false },
                { id: 'det-002', invoiceId: 'inv-001', referenceNumber: 'REF-1001', description: 'Printer toner cartridges', debitAccountId: 'acc-001', debitAccountName: accounts[0].accountIdentifier, quantity: 10, unitPrice: 120, discountAsPercentage: true, discount: 10, amount: 120, subTotal: 1080, isTax: false },
                { id: `tax-${vatTaxId}`, invoiceId: 'inv-001', taxId: vatTaxId, isTax: true, referenceNumber: 'REF-1001', description: 'VAT', debitAccountId: 'acc-004', debitAccountName: accounts[3].accountIdentifier, quantity: 1, unitPrice: 462, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 462 }
            ]
        },
        {
            id: 'inv-002', tenantId: 2, invoiceNumber: 'INV-2026-002', batchNumber: 'BATCH-002',
            customerId: 'sup-002', customerName: customers[0].name, accountNumber: 'SUP-1002',
            invoiceDate: '2026-09-22', projectedPayDate: '2026-10-22', purchaseOrderNumber: 'PO-2026-014',
            voucherNumber: 'PV-2026-002', referenceNumber: 'REF-1002', description: 'Vehicle and transport expenses',
            currencyId: 'cur-001', currencyName: currencies[0].name, currencyCode: 'GHS', minorName: 'Pesewa',
            buyRate: 1, sellRate: 1, amount: 2850, totalInvoiceAmount: 2850, paidAmount: 0, balance: 2850,
            vatRate: 15, vatAmount: 0, withHeldAmount: 0, accountingPeriod: '2026-09',
            ouId: 'ou-002', ouName: 'FIN - Finance Department', liabilityAccountId: 'acc-006',
            liabilityAccountName: '2100 - Accounts Payable', status: 'Pending', isApproved: true, isPosted: false,
            isCanceled: false, isMultiCurrency: false, isVatInclusive: false, invoiceTaxLevies: [],
            invoiceDetails: [
                { id: 'det-004', invoiceId: 'inv-002', referenceNumber: 'REF-1002', description: 'Vehicle maintenance', debitAccountId: 'acc-002', debitAccountName: accounts[1].accountIdentifier, quantity: 1, unitPrice: 1500, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 1500, isTax: false },
                { id: 'det-005', invoiceId: 'inv-002', referenceNumber: 'REF-1002', description: 'Fuel and transport', debitAccountId: 'acc-002', debitAccountName: accounts[1].accountIdentifier, quantity: 1, unitPrice: 1350, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 1350, isTax: false }
            ]
        },
        {
            id: 'inv-003', tenantId: 2, invoiceNumber: 'INV-2026-003', batchNumber: 'BATCH-003',
            customerId: 'sup-003', customerName: customers[0].name, accountNumber: 'SUP-1003',
            invoiceDate: '2026-10-01', projectedPayDate: '2026-11-01', purchaseOrderNumber: 'PO-2026-025',
            voucherNumber: 'PV-2026-003', referenceNumber: 'REF-1003', description: 'IT support and software services',
            currencyId: 'cur-001', currencyName: currencies[0].name, currencyCode: 'GHS', minorName: 'Pesewa',
            buyRate: 1, sellRate: 1, amount: 6500, totalInvoiceAmount: 6500, paidAmount: 6500, balance: 0,
            vatRate: 15, vatAmount: 0, withHeldAmount: 0, accountingPeriod: '2026-10',
            ouId: 'ou-001', ouName: 'ACAD - Administration', liabilityAccountId: 'acc-006',
            liabilityAccountName: '2100 - Accounts Payable', status: 'Paid', isApproved: true, isPosted: true,
            isCanceled: false, isMultiCurrency: false, isVatInclusive: false, invoiceTaxLevies: [],
            invoiceDetails: [
                { id: 'det-006', invoiceId: 'inv-003', referenceNumber: 'REF-1003', description: 'Annual IT support', debitAccountId: 'acc-003', debitAccountName: accounts[2].accountIdentifier, quantity: 1, unitPrice: 5000, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 5000, isTax: false },
                { id: 'det-007', invoiceId: 'inv-003', referenceNumber: 'REF-1003', description: 'Software licensing', debitAccountId: 'acc-003', debitAccountName: accounts[2].accountIdentifier, quantity: 1, unitPrice: 1500, discountAsPercentage: false, discount: 0, amount: 0, subTotal: 1500, isTax: false }
            ]
        }
    ];

    const app = Vue.createApp({
        data() {
            const defaultCurrency = currencies[0];
            const defaultOu = organizationalUnits[0];
            const defaultLiability = accounts.find((account) => account.id === 'acc-006');
            return {
                emptyGuid: EMPTY_GUID,
                theme: '#0645e7',
                tenantId: 2,
                accounts: clone(accounts),
                customers: clone(customersq),
                currencies: clone(currencies),
                organizationalUnits: clone(organizationalUnits),
                taxLevyList: taxCatalog.map((tax) => ({ ...tax, isApplied: false })),
                invoiceColumns,
                detailColumns,
                invoiceDetailChild: detailChild,
                invoiceList: clone(seedInvoices),
                detailsList: [],
                invoiceId: '',
                invoiceNumber: '',
                batchNumber: '',
                customerId: '',
                customerName: '',
                accountNumber: '',
                address: '',
                invoiceDate: today,
                projectedPayDate: addDays(today, 30),
                purchaseOrderNumber: '',
                voucherNumber: '',
                referenceNumber: '',
                description: '',
                currencyId: defaultCurrency.id,
                currencyName: defaultCurrency.name,
                currencyCode: defaultCurrency.code,
                minorName: defaultCurrency.minorName,
                buyRate: defaultCurrency.buyRate,
                sellRate: defaultCurrency.sellRate,
                isMultiCurrency: false,
                isVatWithheld: false,
                ouId: defaultOu.id,
                ouName: defaultOu.name,
                liabilityAccountId: defaultLiability ? defaultLiability.id : EMPTY_GUID,
                liabilityAccountName: defaultLiability ? defaultLiability.accountIdentifier : '',
                vatRate: 15,
                vatAmount: 0,
                isVatInclusive: false,
                computedTaxLevies: [],
                totalInvoiceAmount: 0,
                amount: 0,
                paidAmount: 0,
                invoiceBalance: 0,
                withHeldAmount: 0,
                status: 'Draft',
                isApproved: false,
                isPosted: false,
                isCanceled: false,
                isEditing: false,
                formMessage: '',
                formMessageType: 'info'
            };
        },
        watch: {
            vatRate() { this.recalculateInvoice(); },
            isVatInclusive(value) {
                if (value) this.taxLevyList = this.taxLevyList.map((tax) => ({ ...tax, isApplied: false }));
                this.recalculateInvoice();
            }
        },
        methods: {
            scrollToAdd() {
                this.$nextTick(() => {
                    const element = document.getElementById('invoice-editor');
                    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            },
            setMessage(message, type = 'info') {
                this.formMessage = message;
                this.formMessageType = type;
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
            formatMoney(value) {
                return new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(toNumber(value));
            },
            onCustomerChange() {
                const customer = this.customers.find((item) => item.id === this.customerId);
                this.customerName = customer ? customer.name : '';
                this.accountNumber = customer ? customer.accountNumber || '' : '';
            },
            onCurrencyChange() {
                const currency = this.currencies.find((item) => item.id === this.currencyId);
                if (!currency) return;
                this.currencyName = currency.name;
                this.currencyCode = currency.code;
                this.minorName = currency.minorName;
                this.sellRate = currency.sellRate;
                this.buyRate = currency.buyRate;
            },
            onOuChange() {
                const unit = this.organizationalUnits.find((item) => item.id === this.ouId);
                this.ouName = unit ? unit.name : '';
            },
            onLiabilityAccountChange() {
                const account = this.accounts.find((item) => item.id === this.liabilityAccountId);
                this.liabilityAccountName = account ? account.accountIdentifier : '';
            },
            nextInvoiceNumber() {
                const year = (this.invoiceDate || today).slice(0, 4);
                const prefix = `INV-${year}-`;
                const next = this.invoiceList.reduce((max, invoice) => {
                    if (!String(invoice.invoiceNumber || '').startsWith(prefix)) return max;
                    return Math.max(max, Number(String(invoice.invoiceNumber).slice(prefix.length)) || 0);
                }, 0) + 1;
                return `${prefix}${String(next).padStart(3, '0')}`;
            },
            lineSubtotal(detail) {
                const quantity = Math.max(0, toNumber(detail.quantity, 0));
                const unitPrice = Math.max(0, toNumber(detail.unitPrice, 0));
                const gross = quantity * unitPrice;
                const discount = Math.max(0, toNumber(detail.discount, 0));
                const discountAmount = asBoolean(detail.discountAsPercentage)
                    ? gross * Math.min(discount, 100) / 100
                    : Math.min(discount, gross);
                return { gross: roundMoney(gross), discountAmount: roundMoney(discountAmount), subtotal: roundMoney(gross - discountAmount) };
            },
            normalizeDetail(detail) {
                const row = { ...detail };
                const calculated = this.lineSubtotal(row);
                const account = this.accounts.find((item) => String(item.id) === String(row.debitAccountId));
                return {
                    ...row,
                    id: row.id || createId('det'),
                    invoiceId: this.invoiceId || '',
                    referenceNumber: row.referenceNumber || this.referenceNumber || this.invoiceNumber || '',
                    description: String(row.description || '').trim(),
                    debitAccountId: row.debitAccountId || '',
                    debitAccountName: account ? account.accountIdentifier : (row.debitAccountName || ''),
                    quantity: Math.max(0, toNumber(row.quantity, 1)),
                    unitPrice: Math.max(0, toNumber(row.unitPrice, 0)),
                    discountAsPercentage: asBoolean(row.discountAsPercentage),
                    discount: Math.max(0, toNumber(row.discount, 0)),
                    amount: calculated.discountAmount,
                    subTotal: calculated.subtotal,
                    isTax: false,
                    taxId: ''
                };
            },
            isTaxRow(detail) {
                return detail && (asBoolean(detail.isTax) || detail.lineType === 'tax' || Boolean(detail.taxId));
            },
            isLegacyTaxRow(detail) {
                if (this.isTaxRow(detail)) return true;
                const tax = taxCatalog.find((item) => item.name.toLowerCase() === String(detail.description || '').trim().toLowerCase());
                return !!(tax && tax.accountId && String(detail.debitAccountId || '') === String(tax.accountId));
            },
            toggleTaxLevy(taxId) {
                if (this.isVatInclusive) return;
                const selected = this.taxLevyList.find((tax) => String(tax.id) === String(taxId));
                if (!selected || selected.isActive === false) return;
                const nextState = !selected.isApplied;
                this.taxLevyList = this.taxLevyList.map((tax) => String(tax.id) === String(taxId)
                    ? { ...tax, isApplied: nextState }
                    : tax);
                this.recalculateInvoice();
            },
            recalculateInvoice() {
                const sourceRows = Array.isArray(this.detailsList) ? this.detailsList : [];
                const lineRows = sourceRows.filter((detail) => !this.isTaxRow(detail)).map((detail) => this.normalizeDetail(detail));
                const baseAmount = roundMoney(lineRows.reduce((sum, detail) => sum + toNumber(detail.subTotal), 0));
                const taxRows = [];
                const taxSummary = [];

                if (!this.isVatInclusive) {
                    this.taxLevyList.filter((tax) => tax.isApplied && tax.isActive !== false).forEach((tax) => {
                        const rate = tax.type === 'vat' ? Math.max(0, toNumber(this.vatRate, tax.rate)) : Math.max(0, toNumber(tax.rate));
                        const taxAmount = roundMoney(baseAmount * rate / 100);
                        const account = this.accounts.find((item) => String(item.id) === String(tax.accountId));
                        const row = {
                            id: `tax-${tax.id}`,
                            invoiceId: this.invoiceId || '',
                            taxId: tax.id,
                            isTax: true,
                            lineType: 'tax',
                            referenceNumber: this.referenceNumber || this.invoiceNumber || '',
                            description: tax.name,
                            debitAccountId: tax.accountId || '',
                            debitAccountName: account ? account.accountIdentifier : '',
                            quantity: 1,
                            unitPrice: taxAmount,
                            discountAsPercentage: false,
                            discount: 0,
                            amount: 0,
                            subTotal: taxAmount
                        };
                        taxRows.push(row);
                        taxSummary.push({ id: tax.id, name: tax.name, rate, isApplied: true, amount: taxAmount });
                    });
                }

                this.detailsList = lineRows.concat(taxRows);
                this.computedTaxLevies = taxSummary;
                const vat = taxSummary.find((tax) => tax.name.toLowerCase() === 'vat');
                this.vatAmount = vat ? vat.amount : 0;
                this.totalInvoiceAmount = roundMoney(baseAmount + taxRows.reduce((sum, row) => sum + toNumber(row.subTotal), 0));
                this.amount = this.totalInvoiceAmount;
                const paid = Math.max(0, toNumber(this.paidAmount));
                this.invoiceBalance = roundMoney(Math.max(0, this.totalInvoiceAmount - paid));
                return this.totalInvoiceAmount;
            },
            computeTotalTaxAmount() {
                return this.recalculateInvoice();
            },
            onCreateDetail(event) {
                if (!event || !event.row) return;
                Object.assign(event.row, this.normalizeDetail(event.row));
                this.recalculateInvoice();
            },
            onUpdateDetail(event) {
                if (!event || !event.row) return;
                if (!this.isTaxRow(event.row)) Object.assign(event.row, this.normalizeDetail(event.row));
                this.recalculateInvoice();
            },
            onDeleteDetail(event) {
                const deleted = Array.isArray(event && event.rows) ? event.rows : [];
                const deletedTaxIds = new Set(deleted.filter((row) => this.isTaxRow(row)).map((row) => String(row.taxId || '')));
                if (deletedTaxIds.size) {
                    this.taxLevyList = this.taxLevyList.map((tax) => deletedTaxIds.has(String(tax.id)) ? { ...tax, isApplied: false } : tax);
                }
                this.recalculateInvoice();
            },
            createNewInvoice() {
                this.invoiceId = '';
                this.invoiceNumber = '';
                this.batchNumber = '';
                this.customerId = '';
                this.customerName = '';
                this.accountNumber = '';
                this.address = '';
                this.invoiceDate = isoDate(new Date());
                this.projectedPayDate = addDays(this.invoiceDate, 30);
                this.purchaseOrderNumber = '';
                this.voucherNumber = '';
                this.referenceNumber = '';
                this.description = '';
                this.currencyId = currencies[0].id;
                this.currencyName = currencies[0].name;
                this.currencyCode = currencies[0].code;
                this.minorName = currencies[0].minorName;
                this.buyRate = currencies[0].buyRate;
                this.sellRate = currencies[0].sellRate;
                this.isMultiCurrency = false;
                this.isVatWithheld = false;
                this.ouId = organizationalUnits[0].id;
                this.ouName = organizationalUnits[0].name;
                this.liabilityAccountId = 'acc-006';
                this.liabilityAccountName = '2100 - Accounts Payable';
                this.vatRate = 15;
                this.vatAmount = 0;
                this.isVatInclusive = false;
                this.taxLevyList = taxCatalog.map((tax) => ({ ...tax, isApplied: false }));
                this.computedTaxLevies = [];
                this.detailsList = [];
                this.totalInvoiceAmount = 0;
                this.amount = 0;
                this.paidAmount = 0;
                this.invoiceBalance = 0;
                this.withHeldAmount = 0;
                this.status = 'Draft';
                this.isApproved = false;
                this.isPosted = false;
                this.isCanceled = false;
                this.isEditing = false;
                if (this.$refs.invoices && this.$refs.invoices.clearSelection) this.$refs.invoices.clearSelection();
                this.scrollToAdd();
            },
            getSelectedInvoice() {
                const grid = this.$refs.invoices;
                if (!grid || typeof grid.selectedRows !== 'function') return null;
                return grid.selectedRows()[0] || null;
            },
            setCurrentInvoice() {
                const grid = this.$refs.invoices;
                if (!grid || typeof grid.selectedRows !== 'function') {
                    this.setMessage('The invoices grid is not ready.', 'error');
                    return;
                }
                const selectedRows = grid.selectedRows();
                if (selectedRows.length !== 1) {
                    this.toastHandler('warning', 'Select one invoice to edit.');
                    return;
                }
                this.loadInvoice(selectedRows[0]);
                this.scrollToAdd();
            },
            loadInvoice(invoice) {
                if (!invoice) return;
                this.isEditing = true;
                this.invoiceId = invoice.id || '';
                this.invoiceNumber = invoice.invoiceNumber || '';
                this.batchNumber = invoice.batchNumber || '';
                this.customerId = invoice.customerId || '';
                this.customerName = invoice.customerName || '';
                this.accountNumber = invoice.accountNumber || '';
                this.address = invoice.address || '';
                this.invoiceDate = isoDate(invoice.invoiceDate) || today;
                this.projectedPayDate = isoDate(invoice.projectedPayDate) || this.invoiceDate;
                this.purchaseOrderNumber = invoice.purchaseOrderNumber || '';
                this.voucherNumber = invoice.voucherNumber || '';
                this.referenceNumber = invoice.referenceNumber || '';
                this.description = invoice.description || '';
                this.currencyId = invoice.currencyId || currencies[0].id;
                const currency = this.currencies.find((item) => item.id === this.currencyId);
                this.currencyName = invoice.currencyName || (currency && currency.name) || '';
                this.currencyCode = invoice.currencyCode || (currency && currency.code) || '';
                this.minorName = invoice.minorName || (currency && currency.minorName) || '';
                this.buyRate = toNumber(invoice.buyRate, currency ? currency.buyRate : 1);
                this.sellRate = toNumber(invoice.sellRate, currency ? currency.sellRate : 1);
                this.isMultiCurrency = asBoolean(invoice.isMultiCurrency);
                this.isVatWithheld = asBoolean(invoice.isVatWithheld);
                this.ouId = invoice.ouId || '';
                this.ouName = invoice.ouName || '';
                this.liabilityAccountId = invoice.liabilityAccountId || EMPTY_GUID;
                this.liabilityAccountName = invoice.liabilityAccountName || '';
                this.vatRate = toNumber(invoice.vatRate, 15);
                this.isVatInclusive = asBoolean(invoice.isVatInclusive);
                this.paidAmount = toNumber(invoice.paidAmount);
                this.withHeldAmount = toNumber(invoice.withHeldAmount);
                this.status = invoice.status || 'Pending';
                this.isApproved = asBoolean(invoice.isApproved);
                this.isPosted = asBoolean(invoice.isPosted);
                this.isCanceled = asBoolean(invoice.isCanceled);

                this.onCustomerChange();
                if (invoice.customerName) this.customerName = invoice.customerName;
                if (invoice.accountNumber) this.accountNumber = invoice.accountNumber;
                this.taxLevyList = taxCatalog.map((tax) => ({ ...tax, isApplied: false }));
                const savedTaxes = Array.isArray(invoice.invoiceTaxLevies) ? invoice.invoiceTaxLevies : [];
                const sourceDetails = Array.isArray(invoice.invoiceDetails) ? invoice.invoiceDetails : [];
                const legacyTaxDetails = sourceDetails.filter((detail) => this.isLegacyTaxRow(detail));
                const savedTaxKeys = new Set(savedTaxes.flatMap((tax) => [tax.id, tax.taxId, tax.name].filter(Boolean).map((value) => String(value).toLowerCase())));
                const inferredTaxIds = new Set(legacyTaxDetails.map((detail) => {
                    const tax = taxCatalog.find((item) => item.id === detail.taxId || item.name.toLowerCase() === String(detail.description || '').toLowerCase());
                    return tax ? tax.id : '';
                }).filter(Boolean));
                this.taxLevyList = this.taxLevyList.map((tax) => ({
                    ...tax,
                    isApplied: !this.isVatInclusive && (savedTaxKeys.has(String(tax.id).toLowerCase()) || savedTaxKeys.has(String(tax.name).toLowerCase()) || inferredTaxIds.has(tax.id))
                }));
                this.detailsList = sourceDetails.filter((detail) => !this.isLegacyTaxRow(detail)).map((detail) => ({ ...detail, isTax: false, taxId: '' }));
                this.recalculateInvoice();
                this.setMessage(`Editing ${this.invoiceNumber || 'selected invoice'}.`, 'info');
            },
            saveInvoice() {
                this.setMessage('', 'info');
                if (!this.customerId) {
                    this.setMessage('Choose a customer before saving.', 'error');
                    this.scrollToAdd();
                    return;
                }
                if (!this.currencyId) {
                    this.setMessage('Choose a currency before saving.', 'error');
                    this.scrollToAdd();
                    return;
                }
                const lineRows = this.detailsList.filter((detail) => !this.isTaxRow(detail));
                if (!lineRows.length) {
                    this.setMessage('Add at least one invoice detail row before saving.', 'error');
                    this.scrollToAdd();
                    return;
                }

                this.recalculateInvoice();
                const customer = this.customers.find((item) => item.id === this.customerId);
                const currency = this.currencies.find((item) => item.id === this.currencyId);
                const ou = this.organizationalUnits.find((item) => item.id === this.ouId);
                const liability = this.accounts.find((item) => item.id === this.liabilityAccountId);
                const invoiceNumber = this.invoiceNumber || this.nextInvoiceNumber();
                const invoiceId = this.invoiceId || createId('inv');
                const batchNumber = this.batchNumber || `BATCH-${invoiceNumber.split('-').pop()}`;
                this.detailsList = this.detailsList.map((detail) => ({
                    ...detail,
                    invoiceId,
                    referenceNumber: detail.referenceNumber || this.referenceNumber || invoiceNumber
                }));
                const invoice = {
                    id: invoiceId,
                    tenantId: this.tenantId,
                    invoiceNumber,
                    batchNumber,
                    customerId: this.customerId,
                    customerName: customer ? customer.name : this.customerName,
                    accountNumber: customer ? customer.accountNumber || '' : this.accountNumber,
                    invoiceDate: this.invoiceDate,
                    projectedPayDate: this.projectedPayDate,
                    purchaseOrderNumber: this.purchaseOrderNumber,
                    voucherNumber: this.voucherNumber,
                    referenceNumber: this.referenceNumber || invoiceNumber,
                    description: this.description,
                    currencyId: this.currencyId,
                    currencyName: currency ? currency.name : this.currencyName,
                    currencyCode: currency ? currency.code : this.currencyCode,
                    minorName: currency ? currency.minorName : this.minorName,
                    buyRate: toNumber(this.buyRate, 1),
                    sellRate: toNumber(this.sellRate, 1),
                    amount: this.totalInvoiceAmount,
                    totalInvoiceAmount: this.totalInvoiceAmount,
                    balance: this.invoiceBalance,
                    vatRate: toNumber(this.vatRate, 0),
                    vatAmount: this.vatAmount,
                    accountingPeriod: this.invoiceDate ? this.invoiceDate.slice(0, 7) : '',
                    ouId: this.ouId,
                    ouName: ou ? ou.name : this.ouName,
                    liabilityAccountId: this.liabilityAccountId,
                    liabilityAccountName: liability ? liability.accountIdentifier : this.liabilityAccountName,
                    status: this.status === 'Draft' ? 'Pending' : this.status,
                    isApproved: this.isApproved,
                    isPosted: this.isPosted,
                    isCanceled: this.isCanceled,
                    isMultiCurrency: this.isMultiCurrency,
                    isVatInclusive: this.isVatInclusive,
                    invoiceTaxLevies: this.computedTaxLevies.map((tax) => ({ id: tax.id, name: tax.name, rate: tax.rate, amount: tax.amount })),
                    invoiceDetails: this.detailsList.map((detail) => ({ ...detail, invoiceId }))
                };
                const index = this.invoiceList.findIndex((item) => String(item.id) === String(invoice.id));
                if (index >= 0) this.invoiceList.splice(index, 1, invoice);
                else this.invoiceList.unshift(invoice);
                this.invoiceId = invoice.id;
                this.invoiceNumber = invoice.invoiceNumber;
                this.batchNumber = invoice.batchNumber;
                this.isEditing = true;
                this.status = invoice.status;
                this.toastHandler('success','saved successfully.');
            },
            cancelSelectedInvoices() {
                const grid = this.$refs.invoices;
                const selected = grid && grid.selectedRows ? grid.selectedRows() : [];
                if (!selected.length) {
                    this.toastHandler('warning', 'Select one or more invoices to cancel.');
                    return;
                }
                selected.forEach((invoice) => {
                    invoice.isCanceled = true;
                    invoice.status = 'Canceled';
                });
                if (grid.clearSelection) grid.clearSelection();
                this.setMessage(`${selected.length} invoice${selected.length === 1 ? '' : 's'} canceled.`, 'success');
            },
            postSelectedInvoices() {
                const grid = this.$refs.invoices;
                const selected = grid && grid.selectedRows ? grid.selectedRows() : [];
                if (!selected.length) {
                    this.setMessage('Select one or more invoices to post.', 'warning');
                    return;
                }
                const eligible = selected.filter((invoice) => !invoice.isCanceled);
                if (!eligible.length) {
                    this.setMessage('Canceled invoices cannot be posted.', 'error');
                    return;
                }
                eligible.forEach((invoice) => {
                    invoice.isPosted = true;
                    invoice.status = 'Posted';
                });
                if (grid.clearSelection) grid.clearSelection();
                this.setMessage(`${eligible.length} invoice${eligible.length === 1 ? '' : 's'} posted.`, 'success');
            }
        },
        mounted() {
            this.recalculateInvoice();
        }
    });

    app.use(DataGridPlugin);
    globalThis.invoiceEntryApp = app;
    globalThis.invoiceEntryVm = app.mount('#app');
})();
