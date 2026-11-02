/**
 * General Ledger - Customers Management (Vue 3)
 * Modern implementation matching Topaz ERP Design System
 * Directory & List View
 */
const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            isLoading: false,
            isShimmerLoading: false,

            customerList: [],
            customerGroupList: [],
            currencyList: [],

            statusList: [
                { id: 'Active', name: 'Active' },
                { id: 'Inactive', name: 'Inactive' },
                { id: 'Pending', name: 'Pending' },
                { id: 'Dormant', name: 'Dormant' }
            ]
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
                    width: 150,
                    searchable: true,
                    sortable: true,
                    render: (v, row) => {
                        const val = v || '—';
                        const id = row?.id;
                        if (id) {
                            return `<a href="/GeneralLedger/CreateCustomer?id=${encodeURIComponent(id)}" class="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-200 transition" title="Click to view/edit customer details">${val}</a>`;
                        }
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
                    width: 170,
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
                    width: 210,
                    searchable: true,
                    render: (v) => {
                        if (!v) return '—';
                        return `<a href="mailto:${v}" class="text-slate-600 hover:text-blue-600 truncate text-xs">${v}</a>`;
                    }
                },
                {
                    key: 'tinNumber',
                    label: 'TIN No',
                    type: 'text',
                    width: 130,
                    searchable: true,
                    render: (v) => {
                        if (!v) return '—';
                        return `<span class="font-mono text-xs text-slate-600 dark:text-slate-400 uppercase">${v}</span>`;
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
                    render: (v) => {
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
                        } else if (s.includes('pending') || s.includes('dormant')) {
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
                creditLimit: Number(customer.creditLimit) || 0
            };
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
                } else if (raw?.result && Array.isArray(raw.result)) {
                    list = raw.result;
                } else if (raw?.result?.items && Array.isArray(raw.result.items)) {
                    list = raw.result.items;
                } else if (raw?.result?.data && Array.isArray(raw.result.data)) {
                    list = raw.result.data;
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

        // DataGrid open-form handler: navigate to dedicated create or edit page
        onGridOpenForm(e) {
            if (e?.mode === 'update' && e?.row?.id) {
                window.location.href = `/GeneralLedger/CreateCustomer?id=${encodeURIComponent(e.row.id)}`;
            } else {
                window.location.href = '/GeneralLedger/CreateCustomer';
            }
        },

        // DataGrid delete event
        onGridDelete(e) {
            const rows = e?.rows || (e?.row ? [e.row] : []);
            if (!rows.length) return;
            const target = rows[0];
            this.deleteCustomer(target.id, target.name);
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

            this.isShimmerLoading = true;
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
                await this.getCustomers();
            } catch (err) {
                console.error('Error deleting customer:', err);
                this.toast('error', 'Unable to delete customer.');
            } finally {
                this.isShimmerLoading = false;
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
        this.isShimmerLoading = true;
        try {
            await Promise.allSettled([
                this.getCustomerGroups(),
                this.getCurrencies()
            ]);
            await this.getCustomers();
        } finally {
            this.isShimmerLoading = false;
        }
    }
});
app.use(DataGridPlugin);
app.mount('#app');
