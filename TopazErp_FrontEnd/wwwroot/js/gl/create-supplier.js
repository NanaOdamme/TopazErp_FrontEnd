/**
 * General Ledger - Create / Edit Supplier (Vue 3)
 * Modern implementation matching Topaz ERP Design System
 */
const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            isLoading: false,
            isFetching: false,
            isEditing: false,
            supplierId: null,

            supplierList: [],
            supplierGroupList: [],
            currencyList: [],
            accountList: [],
            currentSystemNumber: null,
            supplierSearch: '',

            statusList: [
                { id: 'Active', name: 'Active' },
                { id: 'Inactive', name: 'Inactive' },
                { id: 'Pending', name: 'Pending' }
            ],

            defaultGlSetup: {
                debitAccountId: '',
                creditAccountId: '',
                vatAccountId: '',
                irsAccountId: ''
            },

            form: {
                id: null,
                tenantId: null,
                accountNumber: '',
                name: '',
                supplierGroupId: '',
                supplierGroupName: '',
                status: 'Active',
                statusName: 'Active',
                address: '',
                tinNumber: '',
                vatNumber: '',
                phoneNo: '',
                email: '',
                currencyId: '',
                currencyCode: 'GHS',
                currencyName: 'Ghana Cedi',
                balance: 0,
                creditLimit: 0,
                taxOffice: '',
                debitAccountId: '',
                debitAccountName: '',
                creditAccountId: '',
                creditAccountName: '',
                vatAccountId: '',
                vatAccountName: '',
                irsAccountId: '',
                irsAccountName: '',
                isResident: true,
                contactPerson: '',
                contactPersonPhone: '',
                contactPersonEmail: ''
            },

            emptyForm: {
                id: null,
                tenantId: null,
                accountNumber: '',
                name: '',
                supplierGroupId: '',
                supplierGroupName: '',
                status: 'Active',
                statusName: 'Active',
                address: '',
                tinNumber: '',
                vatNumber: '',
                phoneNo: '',
                email: '',
                currencyId: '',
                currencyCode: 'GHS',
                currencyName: 'Ghana Cedi',
                balance: 0,
                creditLimit: 0,
                taxOffice: '',
                debitAccountId: '',
                debitAccountName: '',
                creditAccountId: '',
                creditAccountName: '',
                vatAccountId: '',
                vatAccountName: '',
                irsAccountId: '',
                irsAccountName: '',
                isResident: true,
                contactPerson: '',
                contactPersonPhone: '',
                contactPersonEmail: ''
            }
        };
    },

    methods: {
        resetForm() {
            this.form = JSON.parse(JSON.stringify(this.emptyForm));

            // Pre-fill default currency
            if (this.currencyList.length > 0) {
                const defaultCurr = this.currencyList.find(c =>
                    c.isDefault ||
                    (c.currencyName && c.currencyName.toLowerCase().includes('cedi')) ||
                    (c.currencyCode && c.currencyCode.toUpperCase() === 'GHS')
                ) || this.currencyList[0];

                if (defaultCurr) {
                    this.form.currencyId = defaultCurr.id;
                    this.form.currencyCode = defaultCurr.currencyCode;
                    this.form.currencyName = defaultCurr.currencyName;
                }
            }

            // Pre-fill default group
            if (this.supplierGroupList.length > 0) {
                this.form.supplierGroupId = this.supplierGroupList[0].id;
                this.form.supplierGroupName = this.supplierGroupList[0].name;
            }

            // Apply default GL accounts
            if (this.defaultGlSetup.debitAccountId) {
                this.form.debitAccountId = this.defaultGlSetup.debitAccountId;
            }
            if (this.defaultGlSetup.creditAccountId) {
                this.form.creditAccountId = this.defaultGlSetup.creditAccountId;
            }
            if (this.defaultGlSetup.vatAccountId) {
                this.form.vatAccountId = this.defaultGlSetup.vatAccountId;
            }
            if (this.defaultGlSetup.irsAccountId) {
                this.form.irsAccountId = this.defaultGlSetup.irsAccountId;
            }
        },

        newSupplier() {
            this.isEditing = false;
            this.supplierId = null;
            this.supplierSearch = '';
            this.resetForm();
            this.generateAccountNumber();

            // Update URL without reloading
            if (window.history.pushState) {
                window.history.pushState({}, '', '/GeneralLedger/CreateSupplier');
            }
        },

        enrichSupplier(supplier) {
            const group = this.supplierGroupList.find(g => String(g.id) === String(supplier.supplierGroupId));
            const curr = this.currencyList.find(c => String(c.id) === String(supplier.currencyId));
            const statusObj = this.statusList.find(s =>
                String(s.id).toLowerCase() === String(supplier.status || supplier.statusName || '').toLowerCase() ||
                String(s.name).toLowerCase() === String(supplier.status || '').toLowerCase()
            );

            return {
                ...supplier,
                supplierGroupName: group?.name || supplier.supplierGroupName || 'General',
                currencyCode: curr?.currencyCode || supplier.currencyCode || 'GHS',
                currencyName: curr?.currencyName || supplier.currencyName || 'Ghana Cedi',
                status: statusObj?.name || supplier.status || supplier.statusName || 'Active',
                statusName: statusObj?.name || supplier.status || supplier.statusName || 'Active',
                balance: Number(supplier.balance) || 0,
                creditLimit: Number(supplier.creditLimit) || 0
            };
        },

        loadSupplier(supplier) {
            if (!supplier) return;
            this.isEditing = true;
            this.supplierId = supplier.id;
            this.supplierSearch = supplier.name || '';

            const enriched = this.enrichSupplier(supplier);
            this.form = {
                ...this.emptyForm,
                ...enriched,
                id: enriched.id,
                tenantId: enriched.tenantId,
                status: enriched.status || 'Active',
                statusName: enriched.status || 'Active',
                balance: enriched.balance || 0,
                creditLimit: enriched.creditLimit || 0
            };

            // Update URL query parameter
            if (window.history.pushState && supplier.id) {
                window.history.pushState({}, '', `/GeneralLedger/CreateSupplier?id=${encodeURIComponent(supplier.id)}`);
            }

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },

        async loadSupplierById(id) {
            if (!id) return;
            this.isFetching = true;
            try {
                // Try targeted endpoint first
                try {
                    const resp = await axios.get(`/GeneralLedger/GetSupplier?id=${encodeURIComponent(id)}`);
                    if (resp.data?.success && resp.data?.result) {
                        this.loadSupplier(resp.data.result);
                        return;
                    }
                } catch (e) {
                    // Fall back to full list search
                }

                // If not found yet, search in the full suppliers list
                if (this.supplierList.length === 0) {
                    await this.getSuppliersList();
                }

                const match = this.supplierList.find(s => String(s.id).toLowerCase() === String(id).toLowerCase());
                if (match) {
                    this.loadSupplier(match);
                } else {
                    this.toast('warning', 'Supplier record could not be found.');
                }
            } catch (err) {
                console.error('Error loading supplier by ID:', err);
                this.toast('error', 'Unable to load supplier details.');
            } finally {
                this.isFetching = false;
            }
        },

        async loadSupplierFromSearch() {
            const query = (this.supplierSearch || '').trim().toLowerCase();
            if (!query) {
                this.toast('warning', 'Please enter a supplier name or account number to search.');
                return;
            }

            if (this.supplierList.length === 0) {
                await this.getSuppliersList();
            }

            const match = this.supplierList.find(s =>
                (s.name && s.name.toLowerCase().includes(query)) ||
                (s.accountNumber && s.accountNumber.toLowerCase().includes(query))
            );

            if (!match) {
                this.toast('warning', 'No matching supplier found.');
                return;
            }

            this.loadSupplier(match);
            this.toast('success', `Loaded supplier: ${match.name}`);
        },

        onCurrencyChange() {
            const curr = this.currencyList.find(c => String(c.id) === String(this.form.currencyId));
            if (curr) {
                this.form.currencyCode = curr.currencyCode;
                this.form.currencyName = curr.currencyName;
            }
        },

        onSupplierGroupChange() {
            const group = this.supplierGroupList.find(g => String(g.id) === String(this.form.supplierGroupId));
            if (group) {
                this.form.supplierGroupName = group.name;
            }
        },

        async generateAccountNumber() {
            if (this.isEditing) {
                this.toast('info', 'Account number cannot be regenerated for an existing supplier.');
                return;
            }

            try {
                const response = await axios.get('/SharedResource/GetSystemNumbers');
                const systemNumbers = response.data || [];
                if (Array.isArray(systemNumbers) && systemNumbers.length > 0) {
                    const sn = systemNumbers.find(item => item.itemName === 'ApAccountNumbers');
                    if (sn) {
                        this.currentSystemNumber = sn;
                        this.form.accountNumber = `${sn.prefix || ''}${sn.lastNo || ''}${sn.suffix || ''}`;
                        return;
                    }
                }
            } catch (err) {
                console.warn('Unable to fetch system numbers, using fallback pattern:', err);
            }

            // Fallback generated account number
            const rand = Math.floor(100000 + Math.random() * 900000);
            this.form.accountNumber = `AP-${rand}`;
        },

        async getSuppliersList() {
            try {
                let response = null;
                try {
                    response = await axios.get('/GeneralLedger/GetSuppliers');
                } catch (e) {
                    response = await axios.get('/SharedResource/GetSuppliers');
                }

                const raw = response.data;
                let list = [];
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw?.result?.data && Array.isArray(raw.result.data)) {
                    list = raw.result.data;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                } else if (raw?.data && Array.isArray(raw.data)) {
                    list = raw.data;
                }
                this.supplierList = list;
            } catch (err) {
                console.warn('Error fetching supplier lookup list:', err);
            }
        },

        async getSupplierGroups() {
            try {
                const response = await axios.get('/SharedResource/GetSupplierGroups');
                const raw = response.data;
                let list = [];
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                }
                this.supplierGroupList = list;
            } catch (err) {
                console.warn('Error fetching supplier groups:', err);
            }
        },

        async getCurrencies() {
            try {
                const response = await axios.get('/SharedResource/GetCurrencies');
                const raw = response.data;
                let list = [];
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                }
                this.currencyList = list;
            } catch (err) {
                console.warn('Error fetching currencies:', err);
            }
        },

        async getAccounts() {
            try {
                let response = null;
                try {
                    response = await axios.get('/GeneralLedger/GetAccountDetails?pageNo=1&pageSize=5000&isActive=true');
                } catch (e) {
                    response = await axios.get('/GeneralLedger/InitJournalEntry');
                }

                const raw = response.data;
                let list = [];
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw?.result?.data && Array.isArray(raw.result.data)) {
                    list = raw.result.data;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                } else if (raw?.accounts && Array.isArray(raw.accounts)) {
                    list = raw.accounts;
                }

                this.accountList = list.map(a => ({
                    id: a.id,
                    accountNo: a.accountNo || a.accountNumber || '',
                    accountName: a.accountName || a.name || '',
                    accountIdentifier: a.accountIdentifier || `${a.accountNo || ''} - ${a.accountName || a.name || ''}`
                })).sort((a, b) => (a.accountNo || '').localeCompare(b.accountNo || ''));
            } catch (err) {
                console.warn('Error fetching GL accounts:', err);
            }
        },

        async getDefaultGlSetup() {
            try {
                const response = await axios.get('/GeneralLedger/GetDefaultGlNumbersSetup');
                const raw = response.data?.result || response.data;
                if (raw) {
                    this.defaultGlSetup = {
                        debitAccountId: raw.creditPurchasesAccountId || raw.stockPurchasesAccountId || raw.accountsPayableAccountId || '',
                        creditAccountId: raw.accountsPayableAccountId || '',
                        vatAccountId: raw.vatPaidAccountId || '',
                        irsAccountId: raw.withholdingTaxAccountId || raw.accountsPayableAccountId || ''
                    };
                }
            } catch (err) {
                console.warn('Error loading default GL setup:', err);
            }
        },

        validateForm() {
            if (!this.form.name || !this.form.name.trim()) {
                this.toast('warning', 'Supplier Name is required.');
                return false;
            }
            if (!this.form.accountNumber || !this.form.accountNumber.trim()) {
                this.toast('warning', 'Account Number is required.');
                return false;
            }
            if (!this.form.currencyId) {
                this.toast('warning', 'Default Currency is required.');
                return false;
            }
            if (this.form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
                this.toast('warning', 'Please enter a valid email address.');
                return false;
            }
            return true;
        },

        async saveSupplier() {
            if (!this.validateForm() || this.isLoading) return;

            this.isLoading = true;
            try {
                const payload = {
                    ...this.form,
                    name: this.form.name.trim(),
                    accountNumber: this.form.accountNumber.trim(),
                    email: (this.form.email || '').trim(),
                    phoneNo: (this.form.phoneNo || '').trim(),
                    address: (this.form.address || '').trim(),
                    tinNumber: (this.form.tinNumber || '').trim(),
                    vatNumber: (this.form.vatNumber || '').trim(),
                    taxOffice: (this.form.taxOffice || '').trim(),
                    contactPerson: (this.form.contactPerson || '').trim(),
                    contactPersonPhone: (this.form.contactPersonPhone || '').trim(),
                    contactPersonEmail: (this.form.contactPersonEmail || '').trim(),
                    balance: Number(this.form.balance) || 0,
                    creditLimit: Number(this.form.creditLimit) || 0,
                    status: this.form.status || 'Active',
                    statusName: this.form.status || 'Active'
                };

                // Resolve Group Name
                if (payload.supplierGroupId) {
                    const group = this.supplierGroupList.find(g => String(g.id) === String(payload.supplierGroupId));
                    if (group) {
                        payload.supplierGroupName = group.name;
                    }
                }

                // Resolve Currency Name & Rates
                if (payload.currencyId) {
                    const curr = this.currencyList.find(c => String(c.id) === String(payload.currencyId));
                    if (curr) {
                        payload.currencyName = curr.currencyName;
                        payload.currencyCode = curr.currencyCode;
                        payload.buyingRate = curr.buyRate || 1;
                        payload.sellingRate = curr.sellRate || 1;
                    }
                }

                // Resolve Account Names
                if (payload.debitAccountId) {
                    const acc = this.accountList.find(a => String(a.id) === String(payload.debitAccountId));
                    payload.debitAccountName = acc ? acc.accountIdentifier : '';
                }
                if (payload.creditAccountId) {
                    const acc = this.accountList.find(a => String(a.id) === String(payload.creditAccountId));
                    payload.creditAccountName = acc ? acc.accountIdentifier : '';
                }
                if (payload.vatAccountId) {
                    const acc = this.accountList.find(a => String(a.id) === String(payload.vatAccountId));
                    payload.vatAccountName = acc ? acc.accountIdentifier : '';
                }
                if (payload.irsAccountId) {
                    const acc = this.accountList.find(a => String(a.id) === String(payload.irsAccountId));
                    payload.irsAccountName = acc ? acc.accountIdentifier : '';
                }

                if (this.isEditing && this.form.id) {
                    // Update existing supplier
                    payload.id = this.form.id;
                    try {
                        await axios.post('/GeneralLedger/UpdateSupplier', payload);
                    } catch (e) {
                        await axios.post('/SharedResource/UpdateSupplier', payload);
                    }
                    this.toast('success', 'Supplier updated successfully.');
                } else {
                    // Create new supplier
                    delete payload.id;
                    let resp = null;
                    try {
                        resp = await axios.post('/GeneralLedger/CreateSupplier', payload);
                    } catch (e) {
                        resp = await axios.post('/SharedResource/CreateSupplier', payload);
                    }

                    // Increment system number if used
                    if (this.currentSystemNumber) {
                        try {
                            const updatedSn = {
                                ...this.currentSystemNumber,
                                lastNo: (this.currentSystemNumber.lastNo || 0) + 1
                            };
                            await axios.post('/SharedResource/UpdateSystemNumber', updatedSn);
                        } catch (snErr) {
                            console.warn('System number update warning:', snErr);
                        }
                    }

                    this.toast('success', 'Supplier created successfully.');
                }

                // Redirect back to Suppliers directory after a brief delay
                setTimeout(() => {
                    window.location.href = '/GeneralLedger/Suppliers';
                }, 1000);
            } catch (err) {
                console.error('Error saving supplier:', err);
                const errMsg = err?.response?.data?.message || err?.message || 'Unable to save supplier.';
                this.toast('error', errMsg);
            } finally {
                this.isLoading = false;
            }
        },

        async deleteSupplier(id, name) {
            if (!id) return;

            const res = await Swal.fire({
                title: 'Delete Supplier?',
                html: `Are you sure you want to delete <strong>${name || 'this supplier'}</strong>?<br><span class="text-xs text-slate-500">This action cannot be undone.</span>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, delete',
                cancelButtonText: 'Cancel'
            });

            if (!res.isConfirmed) return;

            this.isLoading = true;
            try {
                try {
                    await axios.delete(`/GeneralLedger/DeleteSupplier?id=${id}`);
                } catch (e) {
                    try {
                        await axios.post(`/GeneralLedger/DeleteSupplier?id=${id}`);
                    } catch (e2) {
                        await axios.get(`/SharedResource/DelSupplier?id=${id}`);
                    }
                }

                this.toast('success', 'Supplier deleted successfully.');
                setTimeout(() => {
                    window.location.href = '/GeneralLedger/Suppliers';
                }, 1000);
            } catch (err) {
                console.error('Error deleting supplier:', err);
                this.toast('error', 'Unable to delete supplier.');
            } finally {
                this.isLoading = false;
            }
        },

        toast(type, message) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'success'),
                    title: message,
                    showConfirmButton: false,
                    timer: 3500,
                    timerProgressBar: true
                });
            } else if (typeof toastr !== 'undefined') {
                toastr[type] ? toastr[type](message) : toastr.info(message);
            } else {
                alert(message);
            }
        }
    },

    async mounted() {
        // Read supplier ID from query parameter or app dataset
        const urlParams = new URLSearchParams(window.location.search);
        const queryId = urlParams.get('id');
        const container = document.getElementById('app');
        const datasetId = container?.dataset?.supplierId;
        const targetId = queryId || datasetId;

        try {
            await Promise.allSettled([
                this.getSupplierGroups(),
                this.getCurrencies(),
                this.getAccounts(),
                this.getDefaultGlSetup()
            ]);

            if (targetId) {
                await this.loadSupplierById(targetId);
            } else {
                this.resetForm();
                await this.generateAccountNumber();
            }
        } catch (err) {
            console.error('Initialization error:', err);
        }
    }
});

app.mount('#app');

