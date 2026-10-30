const { ref, reactive, computed, onMounted } = Vue;

createApp({
    setup() {
        const customerList = ref([]);
        const totalPages = ref(0);
        const totalCount = ref(0);
        const pageSize = ref(10);
        const currentPage = ref(1);
        const searchTerm = ref('');
        const isShimmerLoading = ref(false);
        const isSkeletonLoading = ref(false);

        // KPIs
        const totalCustomers = ref(0);
        const activeCustomersCount = ref(0);
        const totalReceivableBalance = ref(0);
        const customerGroupsCount = ref(0);

        const customerGroups = ref([]);
        const currencies = ref([]);

        const hasSearch = computed(() => searchTerm.value.trim() !== '');
        const paginatedCustomers = computed(() => customerList.value);
        const totalPagesDisplay = () => totalPages.value;

        const customerColumns = [
            { key: 'id', label: 'Id', visible: false },
            { key: 'accountNumber', label: 'Account #', sortable: true },
            { key: 'name', label: 'Customer', sortable: true },
            { key: 'customerGroupName', label: 'Group', sortable: true },
            { key: 'phoneNo', label: 'Phone', sortable: true },
            { key: 'email', label: 'Email', sortable: true },
            { key: 'currencyCode', label: 'Currency', sortable: true },
            { key: 'balance', label: 'Balance (GH¢)', sortable: true },
            { key: 'status', label: 'Status', sortable: true },
        ];

        const statusColorMap = {
            'Completed': 'bg-green-100 text-green-800',
            'Partial': 'bg-orange-100 text-orange-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Failed': 'bg-red-100 text-red-800',
            'Saved': 'bg-green-100 text-green-800',
            'Draft': 'bg-gray-100 text-gray-800',
            'Approved': 'bg-green-100 text-green-800',
            'Rejected': 'bg-red-100 text-red-800',
            'Voided': 'bg-red-100 text-red-800',
            'Received': 'bg-green-100 text-green-800',
            'Issued': 'bg-blue-100 text-blue-800',
            'Lost': 'bg-red-100 text-red-800',
            'New': 'bg-blue-100 text-blue-800',
            'Delivered': 'bg-green-100 text-green-800',
            'Invoiced': 'bg-green-100 text-green-800',
            'Overdue': 'bg-red-100 text-red-800',
            'Partially Paid': 'bg-yellow-100 text-yellow-800',
            'Paid': 'bg-green-100 text-green-800',
            'Unpaid': 'bg-orange-100 text-orange-800',
            'Refunded': 'bg-blue-100 text-blue-800',
            'Disputed': 'bg-red-100 text-red-800',
            'Transit': 'bg-blue-100 text-blue-800',
            'Delayed': 'bg-orange-100 text-orange-800',
            'Customs Hold': 'bg-yellow-100 text-yellow-800',
            'Received Stock': 'bg-green-100 text-green-800',
            'Partially Received': 'bg-orange-100 text-orange-800',
            'Cancelled': 'bg-red-100 text-red-800',
            'Partially Shipped': 'bg-orange-100 text-orange-800',
            'Shipped': 'bg-blue-100 text-blue-800',
            'Backordered': 'bg-orange-100 text-orange-800',
            'Preparing': 'bg-yellow-100 text-yellow-800',
            'Ready': 'bg-green-100 text-green-800',
            'Enquiry': 'bg-blue-100 text-blue-800',
            'Conversion': 'bg-green-100 text-green-800',
            'Negotiation': 'bg-yellow-100 text-yellow-800',
            'Qualification': 'bg-orange-100 text-orange-800',
            'Proposal': 'bg-purple-100 text-purple-800',
            'Deposit': 'bg-yellow-100 text-yellow-800',
            'Downpayment': 'bg-yellow-100 text-yellow-800',
            'Balance Paid': 'bg-green-100 text-green-800',
            'Partially Shipped ': 'bg-orange-100 text-orange-800',
            'Reserved': 'bg-blue-100 text-blue-800',
            'In stock': 'bg-green-100 text-green-800',
            'Low Stock': 'bg-orange-100 text-orange-800',
            'Reorder': 'bg-yellow-100 text-yellow-800',
            'Out of Stock': 'bg-red-100 text-red-800',
            'Reserved Stock': 'bg-blue-100 text-blue-800',
            'Damage': 'bg-red-100 text-red-800',
            'Consignment': 'bg-purple-100 text-purple-800',
            'Good': 'bg-green-100 text-green-800',
            'Bad': 'bg-red-100 text-red-800',
            'Critical': 'bg-red-100 text-red-800',
            'Expired': 'bg-red-100 text-red-800',
            'Active': 'bg-green-100 text-green-800',
            'Inactive': 'bg-red-100 text-red-800',
            'Dormant': 'bg-gray-100 text-gray-600',
        };

        function getStatusClasses(status) {
            if (!status) return 'bg-gray-100 text-gray-800';
            return statusColorMap[status] || 'bg-gray-100 text-gray-800';
        }

        function getInitials(name) {
            if (!name) return '?';
            return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }

        function toastHandler(type, message) {
            let icon = type == 'success' ? 'success' : type == 'warn' ? 'warning' : type == 'error' ? 'error' : 'info';
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: icon,
                title: message,
                showConfirmButton: false,
                timer: 2000
            });
        }

        function openForm() {
            window.location.href = '/GeneralLedger/CreateCustomer';
        }

        function onGridOpenForm(row) {
            if (row && row.id) {
                window.location.href = `/GeneralLedger/CreateCustomer?id=${row.id}`;
                return;
            }
            openForm();
        }

        function setPage(page) {
            if (page < 1 || page > totalPages.value) return;
            currentPage.value = page;
            getCustomers(page);
        }

        function extractList(res) {
            // Robust against paged ({result:{data|items}}), plain array, or wrapper shapes
            const r = res.data?.result ?? res.data?.Result;
            if (Array.isArray(r)) return r;
            if (Array.isArray(r?.data)) return r.data;
            if (Array.isArray(r?.items)) return r.items;
            if (Array.isArray(res.data?.data)) return res.data.data;
            if (Array.isArray(res.data)) return res.data;
            return [];
        }

        async function getCustomers(page = 1) {
            isShimmerLoading.value = true;
            try {
                const res = await axios.get('/GeneralLedger/GetCustomers');
                customerList.value = enrichCustomer(extractList(res));
                totalCount.value = customerList.value.length;
                totalPages.value = 1;
                currentPage.value = 1;

                // KPIs
                totalCustomers.value = totalCount.value;
                activeCustomersCount.value = customerList.value.filter(c => (c.status || '').toLowerCase() === 'active').length;
                totalReceivableBalance.value = customerList.value.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);
                customerGroupsCount.value = customerGroups.value.length;
            } catch (err) {
                console.error('Error fetching customers:', err);
                customerList.value = [];
                toastHandler('error', 'Unable to retrieve customers.');
            } finally {
                isShimmerLoading.value = false;
            }
        }

        function enrichCustomer(data) {
            const groupMap = {};
            customerGroups.value.forEach(g => groupMap[g.id] = g.name);
            const currMap = {};
            currencies.value.forEach(c => currMap[c.id] = c.code || c.name);

            return data.map(c => ({
                ...c,
                status: c.status || c.statusName || '',
                customerGroupName: c.customerGroupName || groupMap[c.customerGroupId] || '',
                currencyCode: c.currencyCode || currMap[c.currencyId] || ''
            }));
        }

        async function getCustomerGroups() {
            try {
                const res = await axios.get('/SharedResource/GetCustomerGroups?pageNo=1&pageSize=1000');
                customerGroups.value = extractList(res);
            } catch (err) {
                console.error('Error fetching customer groups:', err);
                customerGroups.value = [];
            }
        }

        async function getCurrencies() {
            try {
                const res = await axios.get('/SharedResource/GetCurrencies?pageNo=1&pageSize=100');
                const r = res.data?.result;
                currencies.value = Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : (Array.isArray(res.data) ? res.data : []));
            } catch (err) {
                console.error('Error fetching currencies:', err);
                currencies.value = [];
            }
        }

        async function onGridDelete(row) {
            if (!row || !row.id) return;
            const confirmResult = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            });

            if (!confirmResult.isConfirmed) return;

            try {
                // Mirror suppliers.js: DELETE → POST fallback → SharedResource GET fallback
                try {
                    await axios.delete(`/GeneralLedger/DeleteCustomer?id=${row.id}`);
                } catch (e) {
                    try {
                        await axios.post(`/GeneralLedger/DeleteCustomer?id=${row.id}`);
                    } catch (e2) {
                        await axios.get(`/SharedResource/DelCustomer?id=${row.id}`);
                    }
                }
                toastHandler('success', 'Customer deleted successfully!');
                await getCustomers();
            } catch (err) {
                console.error('Error deleting customer:', err);
                toastHandler('error', err.response?.data?.error || 'Unable to delete customer.');
            }
        }

        onMounted(async () => {
            await Promise.allSettled([getCustomerGroups(), getCurrencies()]);
            await getCustomers();
        });

        return {
            customerList,
            customerColumns,
            totalPages,
            totalCount,
            pageSize,
            currentPage,
            searchTerm,
            hasSearch,
            paginatedCustomers,
            totalPagesDisplay,
            getStatusClasses,
            getInitials,
            isShimmerLoading,
            isSkeletonLoading,
            openForm,
            setPage,
            getCustomers,
            onGridDelete,
            onGridOpenForm,
            totalCustomers,
            activeCustomersCount,
            totalReceivableBalance,
            customerGroupsCount,
        };
    }
}).mount('#app');
