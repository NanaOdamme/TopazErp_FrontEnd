/**
 * General Ledger - Customers Management (Vue 3)
 * Modern implementation matching Topaz ERP Design System
 */
const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            activeTab: 'list', // 'list' or 'form'
            isLoading: false,
            isShimmerLoading: false,
            isEditing: false,
            emptyGuid: '00000000-0000-0000-0000-000000000000',

            customerList: [],
            customerGroupList: [],
            currencyList: [],
            accountList: [],
            currentSystemNumber: null,
            customerSearch: '',

            statusList: [
                { id: 'Active', name: 'Active' },
                { id: 'Inactive', name: 'Inactive' },
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
                statusId: 'Active',
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
                statusId: 'Active',
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

    computed: {
        customerColumns() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'accountNumber',
                    label: 'Account No',
                    type: 'text',
                    width: 140,
                    searchable: true,
                    sortable: true,
                    render: (v) => {
                        const val = v || '—';
                        return `<span class="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">${val}</span>`;
                    }
                },
                {
                    key: 'name',
                    label: 'Customer Name',
                    type: 'avatar',
                    width: 260,
                    minWidth: 200,
                    required: true,
                    searchable: true,
                    sortable: true,
                    subtitleKey: 'email'
                },
                {
                    key: 'customerGroupName',
                    label: 'Group',
                    type: 'text',
                    width: 160,
                    searchable: true,
                    sortable: true,
                    render: (v) => {
                        const val = v || 'General';
                        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">${val}</span>`;
                    }
                },
                {
                    key: 'phoneNo',
                    label: 'Phone',
                    type: 'text',
                    width: 140,
                    searchable: true,
                    render: (v) => {
                        if (!v) return '—';
                        const clean = String(v).replace(/[^\d+]/g, '');
                        return `<a href="tel:${clean}" class="text-blue-600 hover:underline font-mono text-xs">${v}</a>`;
                    }
                },
                {
                    key: 'email',
                    label: 'Email',
                    type: 'email',
                    width: 200,
                    searchable: true,
                    render: (v) => {
                        if (!v) return '—';
                        return `<a href="mailto:${v}" class="text-slate-600 hover:text-blue-600 truncate text-xs">${v}</a>`;
                    }
                },
                {
                    key: 'currencyCode',
                    label: 'Currency',
                    type: 'text',
                    width: 100,
                    searchable: true,
                    render: (v) => {
                        const val = v || 'GHS';
                        return `<span class="font-semibold text-xs text-slate-700 dark:text-slate-300">${val}</span>`;
                    }
                },
                {
                    key: 'balance',
                    label: 'Balance',
                    type: 'number',
                    width: 140,
                    searchable: true,
                    sortable: true,
                    render: (v, row) => {
                        const num = Number(v) || 0;
                        const formatted = this.formatNumber(num);
                        const isNeg = num < 0;
                        const colorClass = isNeg ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-800 dark:text-slate-200';
                        return `<div class="text-right font-mono text-xs ${colorClass}">${formatted}</div>`;
                    }
                },
                {
                    key: 'status',
                    label: 'Status',
                    type: 'text',
                    width: 110,
                    searchable: true,
                    sortable: true,
                    render: (v) => {
                        const s = String(v || 'Active').toLowerCase();
                        let badgeCls = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300';
                        if (s.includes('inactive')) {
                            badgeCls = 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300';
                        } else if (s.includes('dormant') || s.includes('pending')) {
                            badgeCls = 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300';
                        }
                        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${badgeCls}">${v || 'Active'}</span>`;
                    }
                }
            ];
        },

        totalCustomers() {
            return this.customerList.length;
        },

        activeCustomersCount() {
            return this.customerList.filter(c => String(c.status || '').toLowerCase() === 'active').length;
        },

        totalReceivableBalance() {
            const sum = this.customerList.reduce((acc, c) => acc + (Number(c.balance) || 0), 0);
            return this.formatNumber(sum);
        },

        customerGroupsCount() {
            return this.customerGroupList.length;
        }
    },

    methods: {
        formatNumber(num) {
            if (num === null || num === undefined || isNaN(num)) return '0.00';
            const val = Number(num);
            if (val < 0) {
                return `(${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
            }
            return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        switchTab(tab) {
            this.activeTab = tab;
            if (tab === 'list') {
                // Return to listing
            } else if (tab === 'form' && !this.isEditing) {
                this.resetForm();
            }
        },

        newCustomer() {
            this.isEditing = false;
            this.resetForm();
            this.generateAccountNumber();
            this.activeTab = 'form';
        },

        resetForm() {
            this.isEditing = false;
            this.customerSearch = '';
            this.form = JSON.parse(JSON.stringify(this.emptyForm));

            // Pre-fill defaults
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

        enrichCustomer(customer) {
            const group = this.customerGroupList.find(g => String(g.id) === String(customer.customerGroupId));
            const curr = this.currencyList.find(c => String(c.id) === String(customer.currencyId));
            const statusObj = this.statusList.find(s =>
                String(s.id).toLowerCase() === String(customer.status || customer.statusId || '').toLowerCase() ||
                String(s.name).toLowerCase() === String(customer.status || '').toLowerCase()
            );

            return {
                ...customer,
                customerGroupName: group?.name || customer.customerGroupName || 'General',
                currencyCode: curr?.currencyCode || customer.currencyCode || 'GHS',
                currencyName: curr?.currencyName || customer.currencyName || 'Ghana Cedi',
                status: statusObj?.name || customer.status || 'Active',
                statusName: statusObj?.name || customer.status || 'Active',
                balance: Number(customer.balance) || 0,
                creditLimit: Number(customer.creditLimit) || 0
            };
        },

        editCustomer(customer) {
            if (!customer) return;
            this.isEditing = true;
            this.customerSearch = customer.name || '';

            const enriched = this.enrichCustomer(customer);
            this.form = {
                ...this.emptyForm,
                ...enriched,
                id: enriched.id,
                tenantId: enriched.tenantId,
                status: enriched.status || 'Active',
                statusId: enriched.status || 'Active',
                balance: enriched.balance || 0,
                creditLimit: enriched.creditLimit || 0
            };

            this.activeTab = 'form';

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },

        loadCustomerFromSearch() {
            const query = (this.customerSearch || '').trim().toLowerCase();
            if (!query) {
                this.toast('warning', 'Please enter a customer name or account number to search.');
                return;
            }

            const match = this.customerList.find(c =>
                (c.name && c.name.toLowerCase().includes(query)) ||
                (c.accountNumber && c.accountNumber.toLowerCase().includes(query))
            );

            if (!match) {
                this.toast('warning', 'No matching customer found.');
                return;
            }

            this.editCustomer(match);
            this.toast('success', `Loaded customer: ${match.name}`);
        },

        onCurrencyChange() {
            const curr = this.currencyList.find(c => String(c.id) === String(this.form.currencyId));
            if (curr) {
                this.form.currencyCode = curr.currencyCode;
                this.form.currencyName = curr.currencyName;
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
                const systemNumbers = response.data || [];
                if (Array.isArray(systemNumbers) && systemNumbers.length > 0) {
                    const sn = systemNumbers.find(item => item.itemName === 'ArAccountNumbers');
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

        async getCustomers() {
            this.isShimmerLoading = true;
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
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                } else if (raw?.data && Array.isArray(raw.data)) {
                    list = raw.data;
                }

                this.customerList = list.map(c => this.enrichCustomer(c));
            } catch (err) {
                console.error('Error fetching customers:', err);
                this.toast('error', 'Unable to load customer list.');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async getCustomerGroups() {
            try {
                const response = await axios.get('/SharedResource/GetCustomerGroups');
                const raw = response.data;
                let list = [];
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
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
                        creditAccountId: raw.accountsReceivableAccountId || raw.accountsReceivableBankAccountId || '',
                        vatAccountId: raw.vatReceivedAccountId || '',
                        irsAccountId: raw.withholdingTaxAccountId || raw.accountsReceivableAccountId || ''
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
            return true;
        },

        async saveCustomer() {
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
                        payload.currencyName = curr.currencyName;
                        payload.currencyCode = curr.currencyCode;
                        payload.buyingRate = curr.buyRate || 1;
                        payload.sellingRate = curr.sellRate || 1;
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
                    try {
                        await axios.post('/GeneralLedger/UpdateCustomer', payload);
                    } catch (e) {
                        await axios.post('/SharedResource/UpdateCustomer', payload);
                    }
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

                    this.toast('success', 'Customer created successfully.');
                }

                await this.getCustomers();
                this.activeTab = 'list';
                this.isEditing = false;
            } catch (err) {
                console.error('Error saving customer:', err);
                const errMsg = err?.response?.data?.message || err?.message || 'Unable to save customer.';
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
                try {
                    await axios.delete(`/GeneralLedger/DeleteCustomer?id=${id}`);
                } catch (e) {
                    try {
                        await axios.post(`/GeneralLedger/DeleteCustomer?id=${id}`);
                    } catch (e2) {
                        await axios.get(`/SharedResource/DelCustomer?id=${id}`);
                    }
                }

                this.toast('success', 'Customer deleted successfully.');
                if (this.isEditing && this.form.id === id) {
                    this.resetForm();
                    this.activeTab = 'list';
                }
                await this.getCustomers();
            } catch (err) {
                console.error('Error deleting customer:', err);
                this.toast('error', 'Unable to delete customer.');
            } finally {
                this.isLoading = false;
            }
        },

        // DataGrid event handlers
        onGridOpenForm(e) {
            if (e?.mode === 'update' && e?.row) {
                this.editCustomer(e.row);
            } else {
                this.newCustomer();
            }
        },

        onGridDelete(e) {
            const rows = e?.rows || (e?.row ? [e.row] : []);
            if (!rows.length) return;
            const target = rows[0];
            this.deleteCustomer(target.id, target.name);
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
        this.isShimmerLoading = true;
        try {
            await Promise.allSettled([
                this.getCustomers(),
                this.getCustomerGroups(),
                this.getCurrencies(),
                this.getAccounts(),
                this.getDefaultGlSetup()
            ]);
        } finally {
            this.isShimmerLoading = false;
        }
    }
});

app.mount('#app');
