/**
 * General Ledger - Create / Edit Customer (Vue 3)
 * Modern implementation matching Topaz ERP Design System
 */
const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            isLoading: false,
            isFetching: false,
            isEditing: false,
            customerId: null,

            customerList: [],
            customerGroupList: [],
            currencyList: [],
            accountList: [],
            currentSystemNumber: null,
            customerSearch: '',

            statusList: [
                { id: 'Active', name: 'Active' },
                { id: 'Inactive', name: 'Inactive' },
                { id: 'Pending', name: 'Pending' },
                { id: 'Dormant', name: 'Dormant' }
            ],

            defaultGlSetup: {
                creditAccountId: '',
                vatAccountId: '',
                irsAccountId: ''
            },

            form: {
                id: null,
                tenantId: null,
                accountNumber: '',
                name: '',
                customerGroupId: '',
                customerGroupName: '',
                status: 'Active',
                statusName: 'Active',
                statusId: '1',
                address: '',
                tinNumber: '',
                vatNumber: '',
                phoneNo: '',
                email: '',
                currencyId: '',
                currencyCode: 'GHS',
                currencyName: 'Ghana Cedi',
                buyingRate: 1,
                sellingRate: 1,
                balance: 0,
                creditLimit: 0,
                taxOffice: '',
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
                customerGroupId: '',
                customerGroupName: '',
                status: 'Active',
                statusName: 'Active',
                statusId: '1',
                address: '',
                tinNumber: '',
                vatNumber: '',
                phoneNo: '',
                email: '',
                currencyId: '',
                currencyCode: 'GHS',
                currencyName: 'Ghana Cedi',
                buyingRate: 1,
                sellingRate: 1,
                balance: 0,
                creditLimit: 0,
                taxOffice: '',
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
            // In edit mode, revert the form back to the last saved record
            if (this.isEditing && this.customerId) {
                this.loadCustomerById(this.customerId);
                return;
            }

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
            if (this.customerGroupList.length > 0) {
                this.form.customerGroupId = this.customerGroupList[0].id;
                this.form.customerGroupName = this.customerGroupList[0].name;
            }

            // Apply default GL accounts
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

        newCustomer() {
            this.isEditing = false;
            this.customerId = null;
            this.customerSearch = '';
            this.resetForm();
            this.generateAccountNumber();

            // Update URL without reloading
            if (window.history.pushState) {
                window.history.pushState({}, '', '/GeneralLedger/CreateCustomer');
            }
        },

        enrichCustomer(customer) {
            const group = this.customerGroupList.find(g => String(g.id) === String(customer.customerGroupId));
            const curr = this.currencyList.find(c => String(c.id) === String(customer.currencyId));
            const statusObj = this.statusList.find(s =>
                String(s.id).toLowerCase() === String(customer.status || customer.statusName || '').toLowerCase() ||
                String(s.name).toLowerCase() === String(customer.status || '').toLowerCase()
            );

            return {
                ...customer,
                customerGroupName: group?.name || customer.customerGroupName || 'General',
                currencyCode: curr?.currencyCode || customer.currencyCode || 'GHS',
                currencyName: curr?.currencyName || customer.currencyName || 'Ghana Cedi',
                status: statusObj?.name || customer.status || customer.statusName || 'Active',
                statusName: statusObj?.name || customer.status || customer.statusName || 'Active',
                balance: Number(customer.balance) || 0,
                creditLimit: Number(customer.creditLimit) || 0,
                isResident: customer.isResident !== undefined ? Boolean(customer.isResident) : true
            };
        },

        loadCustomer(customer) {
            if (!customer) return;
            this.isEditing = true;
            this.customerId = customer.id;
            this.customerSearch = customer.name || '';

            const enriched = this.enrichCustomer(customer);
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
            if (window.history.pushState && customer.id) {
                window.history.pushState({}, '', `/GeneralLedger/CreateCustomer?id=${encodeURIComponent(customer.id)}`);
            }

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },

        async loadCustomerById(id) {
            if (!id) return;
            this.isFetching = true;
            try {
                // Try targeted endpoint first
                try {
                    const resp = await axios.get(`/GeneralLedger/GetCustomer?id=${encodeURIComponent(id)}`);
                    if (resp.data?.success !== false && resp.data?.result) {
                        this.loadCustomer(resp.data.result);
                        return;
                    }
                } catch (e) {
                    // Fall back to full list search
                }

                // If not found yet, search in full list
                if (this.customerList.length === 0) {
                    await this.getCustomersList();
                }

                const match = this.customerList.find(c => String(c.id).toLowerCase() === String(id).toLowerCase());
                if (match) {
                    this.loadCustomer(match);
                } else {
                    this.toast('warning', 'Customer record could not be found.');
                }
            } catch (err) {
                console.error('Error loading customer by ID:', err);
                this.toast('error', 'Unable to load customer details.');
            } finally {
                this.isFetching = false;
            }
        },

        async loadCustomerFromSearch() {
            const query = (this.customerSearch || '').trim().toLowerCase();
            if (!query) {
                this.toast('warning', 'Please enter a customer name or account number to search.');
                return;
            }

            if (this.customerList.length === 0) {
                await this.getCustomersList();
            }

            const match = this.customerList.find(c =>
                (c.name && c.name.toLowerCase().includes(query)) ||
                (c.accountNumber && c.accountNumber.toLowerCase().includes(query))
            );

            if (!match) {
                this.toast('warning', 'No matching customer found.');
                return;
            }

            this.loadCustomer(match);
            this.toast('success', `Loaded customer: ${match.name}`);
        },

        onCurrencyChange() {
            const curr = this.currencyList.find(c => String(c.id) === String(this.form.currencyId));
            if (curr) {
                this.form.currencyCode = curr.currencyCode || curr.code || 'GHS';
                this.form.currencyName = curr.currencyName || curr.name || 'Ghana Cedi';
            }
        },

        onCustomerGroupChange() {
            const group = this.customerGroupList.find(g => String(g.id) === String(this.form.customerGroupId));
            if (group) {
                this.form.customerGroupName = group.name;
            }
        },

        async generateAccountNumber() {
            if (this.isEditing) {
                this.toast('info', 'Account number cannot be regenerated for an existing customer.');
                return;
            }

            try {
                const response = await axios.get('/SharedResource/GetSystemNumbers');
                const systemNumbers = response.data.result || response.data || [];
                if (Array.isArray(systemNumbers) && systemNumbers.length > 0) {
                    const sn = systemNumbers.find(item =>
                        item.key === 'customer-account-id' ||
                        item.key === 'ar-account-id' ||
                        item.itemName === 'ArAccountNumbers' ||
                        (item.itemName && item.itemName.toLowerCase().includes('araccount')) ||
                        (item.key && item.key.toLowerCase().includes('customer'))
                    );
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
            this.form.accountNumber = `AR-${rand}`;
        },

        async getCustomersList() {
            try {
                let response = null;
                try {
                    response = await axios.get('/GeneralLedger/GetCustomers');
                } catch (e) {
                    response = await axios.get('/SharedResource/GetCustomers');
                }

                const raw = response.data;
                let list = [];
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result?.data && Array.isArray(raw.result.data)) {
                    list = raw.result.data;
                } else if (raw?.data && Array.isArray(raw.data)) {
                    list = raw.data;
                }

                this.customerList = list;
            } catch (err) {
                console.warn('Error fetching customer lookup list:', err);
            }
        },

        async getCustomerGroups() {
            try {
                let response = null;
                try {
                    response = await axios.get('/SharedResource/GetCustomerGroups?pageNo=1&pageSize=1000');
                } catch (e) {
                    response = await axios.get('/GeneralLedger/GetCustomerGroups');
                }
                const raw = response.data;
                let list = [];
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result?.data && Array.isArray(raw.result.data)) {
                    list = raw.result.data;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                } else if (raw?.data && Array.isArray(raw.data)) {
                    list = raw.data;
                }
                this.customerGroupList = list;
            } catch (err) {
                console.warn('Error fetching customer groups:', err);
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
                    response = await axios.get('/GeneralLedger/GetAccountDetails?pageNo=1&pageSize=5555&isActive=true');
                } catch (e) {
                    response = await axios.get('/GeneralLedger/InitJournalEntry');
                }

                const raw = response.data;
                let list = [];
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result?.data && Array.isArray(raw.result.data)) {
                    list = raw.result.data;
                } else if (raw?.data && Array.isArray(raw.data)) {
                    list = raw.data;
                }

                this.accountList = list.map(a => ({
                    id: a.id,
                    accountNo: a.accountNo || a.accountNumber || '',
                    accountName: a.accountName || a.name || '',
                    accountIdentifier: a.accountIdentifier || `${a.accountNo || a.accountNumber || ''} - ${a.accountName || a.name || ''}`
                })).sort((a, b) =>
                    String(a.accountNo ?? '').localeCompare(String(b.accountNo ?? ''))
                );
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
                        creditAccountId: raw.accountsReceivableAccountId || '',
                        vatAccountId: raw.vatReceivedAccountId || raw.vatPaidAccountId || '',
                        irsAccountId: raw.withholdingTaxAccountId || ''
                    };
                }
            } catch (err) {
                console.warn('Error loading default GL setup:', err);
            }
        },

        validateForm() {
            if (!this.form.name || !this.form.name.trim()) {
                this.toast('warning', 'Customer Name is required.');
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
            if (this.form.contactPersonEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.contactPersonEmail)) {
                this.toast('warning', 'Please enter a valid contact person email address.');
                return false;
            }
            return true;
        },

        apiErrorMessage(resp, fallback) {
            const data = resp?.data;
            const err = data?.error;
            if (typeof err === 'string' && err.trim()) return err;
            if (err && typeof err === 'object' && err.message) return err.message;
            return fallback;
        },

        assertApiSuccess(resp, fallback) {
            if (resp?.data && resp.data.success === false) {
                throw new Error(this.apiErrorMessage(resp, fallback));
            }
        },

        async saveCustomer() {
            if (!this.validateForm() || this.isLoading || this.isFetching) return;

            if (this.isEditing && !this.form.id) {
                this.toast('error', 'This customer record has no id. Please reopen it from the Customers list.');
                return;
            }

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
                    statusName: this.form.status || 'Active',
                    statusId: this.form.status === 'Active' ? '1' : this.form.status === 'Inactive' ? '2' : '3',
                    isResident: Boolean(this.form.isResident)
                };

                // Resolve Group Name
                if (payload.customerGroupId) {
                    const group = this.customerGroupList.find(g => String(g.id) === String(payload.customerGroupId));
                    if (group) {
                        payload.customerGroupName = group.name;
                    }
                }

                // Resolve Currency Name & Rates
                if (payload.currencyId) {
                    const curr = this.currencyList.find(c => String(c.id) === String(payload.currencyId));
                    if (curr) {
                        payload.currencyName = curr.currencyName || curr.name;
                        payload.currencyCode = curr.currencyCode || curr.code;
                        payload.buyingRate = curr.buyRate || curr.buyingRate || 1;
                        payload.sellingRate = curr.sellRate || curr.sellingRate || 1;
                    }
                }

                // Resolve Account Names
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
                    // Update existing customer
                    payload.id = this.form.id;
                    let resp = null;
                    try {
                        resp = await axios.post('/GeneralLedger/UpdateCustomer', payload);
                    } catch (e) {
                        resp = await axios.post('/SharedResource/UpdateCustomer', payload);
                    }
                    this.assertApiSuccess(resp, 'The customer update was rejected.');
                    this.toast('success', 'Customer updated successfully.');
                } else {
                    // Create new customer
                    delete payload.id;
                    let resp = null;
                    try {
                        resp = await axios.post('/GeneralLedger/CreateCustomer', payload);
                    } catch (e) {
                        resp = await axios.post('/SharedResource/CreateCustomer', payload);
                    }
                    this.assertApiSuccess(resp, 'The customer creation was rejected.');

                    // Increment system number if used
                    if (this.currentSystemNumber) {
                        try {
                            const updatedSn = {
                                ...this.currentSystemNumber,
                                lastNo: (parseInt(this.currentSystemNumber.lastNo) || 0) + 1
                            };
                            await axios.post('/SharedResource/UpdateSystemNumber', updatedSn);
                        } catch (snErr) {
                            console.warn('System number update warning:', snErr);
                        }
                    }

                    this.toast('success', 'Customer created successfully.');
                }

                // Redirect back to Customers directory after a brief delay
                setTimeout(() => {
                    window.location.href = '/GeneralLedger/Customers';
                }, 1000);
            } catch (err) {
                console.error('Error saving customer:', err);
                const errMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Unable to save customer.';
                this.toast('error', errMsg);
            } finally {
                this.isLoading = false;
            }
        },

        async deleteCustomer(id, name) {
            if (!id) return;

            const res = await Swal.fire({
                title: 'Delete Customer?',
                html: `Are you sure you want to delete <strong>${name || 'this customer'}</strong>?<br><span class="text-xs text-slate-500">This action cannot be undone.</span>`,
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
                let resp = null;
                try {
                    resp = await axios.delete(`/GeneralLedger/DeleteCustomer?id=${id}`);
                } catch (e) {
                    try {
                        resp = await axios.post(`/GeneralLedger/DeleteCustomer?id=${id}`);
                    } catch (e2) {
                        resp = await axios.get(`/SharedResource/DelCustomer?id=${id}`);
                    }
                }
                this.assertApiSuccess(resp, 'The customer deletion was rejected.');

                this.toast('success', 'Customer deleted successfully.');
                setTimeout(() => {
                    window.location.href = '/GeneralLedger/Customers';
                }, 1000);
            } catch (err) {
                console.error('Error deleting customer:', err);
                this.toast('error', 'Unable to delete customer.');
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
        // Read customer ID from query parameter or app dataset
        const urlParams = new URLSearchParams(window.location.search);
        const queryId = urlParams.get('id');
        const container = document.getElementById('app');
        const datasetId = container?.dataset?.customerId;
        const targetId = queryId || datasetId;

        try {
            await Promise.allSettled([
                this.getCustomerGroups(),
                this.getCurrencies(),
                this.getAccounts(),
                this.getDefaultGlSetup()
            ]);

            if (targetId && targetId !== '00000000-0000-0000-0000-000000000000') {
                await this.loadCustomerById(targetId);
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
