(() => {
    'use strict';
    
    const ENDPOINTS = {
        invoices: '/Ap/GetInvoices',
        suppliers: '/SharedResource/GetSuppliers',
        currencies: '/SharedResource/GetCurrencies',
        dispatchInvoice: '/Ap/SendEmail'
    };

    const sameId = (a, b) =>
        a !== null && a !== undefined && b !== null && b !== undefined &&
        String(a).toLowerCase() === String(b).toLowerCase();

    const toCamel = (key) => {
        if (key.toLowerCase() === 'id') return 'id';
        return key.charAt(0).toLowerCase() + key.slice(1);
    };

    const normalizeKeys = (value) => {
        if (Array.isArray(value)) return value.map(normalizeKeys);
        if (!value || typeof value !== 'object') return value;

        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [toCamel(key), normalizeKeys(item)])
        );
    };

    const unwrapList = (raw, preferredKey) => {
        if (Array.isArray(raw)) return raw;
        if (!raw || typeof raw !== 'object') return [];

        if (raw.result !== undefined) return unwrapList(raw.result, preferredKey);
        if (raw.data !== undefined) return unwrapList(raw.data, preferredKey);
        if (preferredKey && Array.isArray(raw[preferredKey])) return raw[preferredKey];
        if (Array.isArray(raw.items)) return raw.items;
        if (Array.isArray(raw.accounts)) return raw.accounts;

        const firstArray = Object.values(raw).find(Array.isArray);
        return firstArray || [];
    };

    const app = Vue.createApp({
        data() {
            return {
                theme: '#ff2056',
                suppliers: [],
                currencies: [],
                invoiceList: [],
                isLoading: false
            };
        },

        computed: {
            detailColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'invoiceId', label: 'Invoice ID', type: 'text', hidden: true, editable: false },
                    { key: 'referenceNumber', label: 'Ref No.', type: 'text', searchable: true, width: 150 },
                    { key: 'description', label: 'Description', type: 'text', required: true, searchable: true, width: 220 },
                    { key: 'quantity', label: 'Quantity', type: 'number', required: true, defaultValue: 1, min: 0, decimals: 2, width: 110 },
                    { key: 'unitPrice', label: 'Unit Price', type: 'number', required: true, defaultValue: 0, min: 0, decimals: 2, width: 130 },
                    { key: 'discountAsPercentage', label: 'Disc. as %?', type: 'boolean', defaultValue: false, width: 120 },
                    { key: 'discount', label: 'Discount', type: 'number', defaultValue: 0, min: 0, decimals: 2, width: 120 },
                    { key: 'amount', label: 'Disc. Amt.', type: 'number', decimals: 2, editable: false, width: 125 },
                    { key: 'subTotal', label: 'Sub Total', type: 'number', decimals: 2, editable: false, width: 130 }
                ];
            },

            invoiceColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'supplierName', label: 'Supplier', type: 'avatar', width: 280, searchable: true },
                    { key: 'supplierId', label: 'Email', type: 'select', options: this.suppliers, value: 'id', display: 'email', width: 280, searchable: true },
                    { key: 'invoiceNumber', label: 'Invoice #', type: 'text', width: 150, searchable: true },
                    { key: 'batchNumber', label: 'Batch #', type: 'text', width: 125, searchable: true },
                    { key: 'invoiceDate', label: 'Invoice Date', type: 'date', width: 130, searchable: true },
                    { key: 'currencyId', label: 'Currency', type: 'select', options: this.currencies, value: 'id', display: 'currencyName', width: 180, searchable: true },
                    { key: 'totalInvoiceAmount', label: 'Invoice Total', type: 'number', width: 145, decimals: 2, agg: 'sum' }
                ];
            },

            invoiceDetailChild() {
                return { key: 'invoiceDetails', title: 'Invoice Details', columns: this.detailColumns };
            }
        },

        methods: {
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

            async fetchList(url, label, preferredKey = null) {
                try {
                    const response = await axios.get(url);
                    return unwrapList(response.data, preferredKey).map(normalizeKeys);
                } catch (error) {
                    console.error(`Failed to load ${label}:`, error);
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },

            async getApInvoices() {
                const invoices = await this.fetchList(ENDPOINTS.invoices, 'AP invoices');
                this.invoiceList = invoices.filter(invoice => !invoice.isCanceled);
            },

            async loadLookups() {
                const [suppliers, currencies] = await Promise.all([
                    this.fetchList(ENDPOINTS.suppliers, 'suppliers'),
                    this.fetchList(ENDPOINTS.currencies, 'currencies')
                ]);

                this.suppliers = suppliers.map(supplier => ({
                    ...supplier,
                    name: String(supplier.name ?? '').trim(),
                    email: String(supplier.email ?? '').trim()
                }));

                this.currencies = currencies.map(currency => ({
                    ...currency,
                    currencyName: currency.currencyName,
                    currencyCode: currency.currencyCode
                }));
            },

         
            async sendEmails() {
                return this.dispatchInvoice();
            },

            async dispatchInvoice() {
                const grid = this.$refs.invoices;
                const selected = grid && typeof grid.selectedRows === 'function'
                    ? grid.selectedRows()
                    : [];

                if (!selected.length) {
                    this.toastHandler('warning', 'Select one or more invoices to email.');
                    return;
                }

                const invalidRows = selected.filter(invoice =>
                    !invoice || invoice.id === null || invoice.id === undefined || invoice.id === ''
                );
                if (invalidRows.length) {
                    this.toastHandler('error', 'One or more selected invoices are missing an ID.');
                    return;
                }

                const supplierId = selected[0].supplierId;
                if (supplierId === null || supplierId === undefined || supplierId === '') {
                    this.toastHandler('error', 'The selected invoice is missing its supplier ID.');
                    return;
                }

                const hasDifferentSupplier = selected.some(invoice =>
                    !sameId(invoice.supplierId, supplierId)
                );
                if (hasDifferentSupplier) {
                    this.toastHandler('warning', 'Select invoices for one supplier at a time.');
                    return;
                }

                const payload = {
                    sendMultipleInvoices: selected.length > 1,
                    supplierId,
                    invoiceIds: selected.map(invoice => invoice.id)
                };

                this.isLoading = true;
                try {
                    const response = await axios.post(ENDPOINTS.dispatchInvoice, payload);
                    const result = response.data || {};
                    const succeeded = result.code === 200 || result.success === true;

                    if (!succeeded) {
                        this.toastHandler('warning', result.message || 'Unable to dispatch the invoice email.');
                        return;
                    }

                    this.toastHandler('success', result.message || 'Invoice email dispatched successfully.');
                    if (typeof grid.clearSelection === 'function') {
                        grid.clearSelection();
                    }
                } catch (error) {
                    console.error('Invoice dispatch failed:', error);
                    this.toastHandler(
                        'error',
                        error.response?.data?.message || 'Unable to dispatch invoice email.'
                    );
                } finally {
                    this.isLoading = false;
                }
            }
        },

        async mounted() {
            this.isLoading = true;
            try {
                await Promise.all([this.loadLookups(), this.getApInvoices()]);
            } finally {
                this.isLoading = false;
            }
        }
    });

    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
