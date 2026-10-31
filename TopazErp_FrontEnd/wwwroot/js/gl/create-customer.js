const { ref, reactive, computed, onMounted } = Vue;

createApp({
    setup() {
        const isEditing = ref(false);
        const targetId = ref(null);
        const customerSearch = ref('');
        const isFetching = ref(false);
        const isSaving = ref(false);
        const isDeleting = ref(false);

        const customerList = ref([]);
        const filteredCustomers = computed(() => customerList.value);
        const customerGroupList = ref([]);
        const statusList = ref(['Active', 'Inactive', 'Dormant']);
        const currencyList = ref([]);
        const accountsList = ref([]);

        const submitted = ref(false);
        const showDeleteModal = ref(false);

        const form = reactive({
            id: null,
            accountNumber: '',
            name: '',
            customerGroupId: '',
            customerGroupName: '',
            status: 'Active',
            address: '',
            tinNumber: '',
            vatNumber: '',
            phoneNo: '',
            email: '',
            currencyId: '',
            currencyCode: '',
            currencyName: '',
            balance: 0,
            creditLimit: 0,
            taxOffice: '',
            creditAccountId: '',
            creditAccountName: '',
            vatAccountId: '',
            vatAccountName: '',
            irsAccountId: '',
            irsAccountName: '',
            isResident: false,
            contactPerson: '',
            contactPersonPhone: '',
            contactPersonEmail: ''
        });

        const isFormInvalid = computed(() =>
            !form.accountNumber.trim() ||
            !form.name.trim() ||
            !form.currencyId
        );

        const customerSearchResults = computed(() => {
            const query = customerSearch.value.toLowerCase().trim();
            if (!query) return [];
            return customerList.value.filter(customer =>
                customer.name.toLowerCase().includes(query) ||
                customer.accountNumber?.toLowerCase().includes(query)
            );
        });

        const accountNumberInvalid = computed(() => submitted.value && !form.accountNumber?.trim());
        const nameInvalid = computed(() => submitted.value && !form.name?.trim());
        const currencyIdInvalid = computed(() => submitted.value && !form.currencyId);
        const customerGroupIdInvalid = computed(() => submitted.value && !form.customerGroupId);
        const emailInvalid = computed(() => submitted.value && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email));

        // ── Data loading ─────────────────────────────────────────────
        async function getCustomerGroups() {
            try {
                const res = await axios.get('/SharedResource/GetCustomerGroups?pageNo=1&pageSize=1000');
                const raw = res.data?.result?.data
                    || res.data?.result
                    || res.data?.data
                    || (Array.isArray(res.data) ? res.data : []);
                customerGroupList.value = raw;
            } catch (err) {
                console.error('Error fetching customer groups:', err);
                toastHandler('error', 'Unable to retrieve customer groups.');
            }
        }

        async function getCurrencies() {
            try {
                const res = await axios.get('/SharedResource/GetCurrencies?pageNo=1&pageSize=100');
                const raw = res.data?.result?.data
                    || res.data?.result
                    || res.data?.data
                    || (Array.isArray(res.data) ? res.data : []);
                currencyList.value = raw;
            } catch (err) {
                console.error('Error fetching currencies:', err);
                toastHandler('error', 'Unable to retrieve currencies.');
            }
        }

        async function getAccounts() {
            try {
                const res = await axios.get('/GeneralLedger/GetAccountDetails?pageNo=1&pageSize=5000&isActive=true');
                const raw = res.data?.result?.data
                    || res.data?.result
                    || res.data?.data
                    || (Array.isArray(res.data) ? res.data : []);
                raw.forEach(v => { v.accountIdentifier = `${v.accountNo} - ${v.accountName}`; });
                accountsList.value = raw;
            } catch (err) {
                console.error('Failed to get account details:', err);
                toastHandler('error', 'Unable to retrieve accounts.');
            }
        }

        async function getDefaultGL() {
            try {
                const res = await axios.get('/GeneralLedger/GetDefaultGlNumbersSetup');
                let raw = res.data?.result || res.data?.Result || res.data;
                if (Array.isArray(raw)) raw = raw[0];
                if (!raw) return;

                if (!form.creditAccountId && raw.accountsReceivableAccountId) {
                    form.creditAccountId = raw.accountsReceivableAccountId;
                    onCreditAccountChange();
                }
                if (!form.vatAccountId && raw.vatReceivedAccountId) {
                    form.vatAccountId = raw.vatReceivedAccountId;
                    onVatAccountChange();
                }
                if (!form.irsAccountId && raw.withholdingTaxAccountId) {
                    form.irsAccountId = raw.withholdingTaxAccountId;
                    onIrsAccountChange();
                }
            } catch (err) {
                console.warn('Default GL numbers setup not available:', err);
            }
        }

        // ── Account number generation ────────────────────────────────
        async function generateAccountNumber() {
            if (isEditing.value) return; // keep locked when editing
            try {
                const response = await axios.get('/SharedResource/GetSystemNumbers');
                const raw = response.data?.result || response.data?.data || (Array.isArray(response.data) ? response.data : []);
                const defaultSystem = raw.find(systemNumber =>
                    (systemNumber.itemName && systemNumber.itemName.toLowerCase().includes('araccount')) ||
                    (systemNumber.key && (systemNumber.key.toLowerCase().includes('customer') || systemNumber.key.toLowerCase().includes('ar-')))
                );
                if (defaultSystem && defaultSystem.id !== '00000000-0000-0000-0000-000000000000') {
                    form.accountNumber = defaultSystem.prefix + defaultSystem.lastNo + defaultSystem.suffix;
                    defaultSystem.lastNo = (parseInt(defaultSystem.lastNo) || 0) + 1;
                    await saveSystemNumber(defaultSystem);
                } else {
                    form.accountNumber = `AR-${1000 + Math.floor(Math.random() * 9000)}`;
                }
            } catch (error) {
                console.error('Error generating account number:', error);
                toastHandler('error', 'Unable to generate account number.');
                form.accountNumber = '';
            }
        }

        async function saveSystemNumber(systemNumber) {
            try {
                await axios.post('/SharedResource/UpdateSystemNumber', systemNumber);
            } catch (error) {
                console.error('Error updating system number:', error);
            }
        }

        // ── Loaders for edit mode ────────────────────────────────────
        async function getCustomersList() {
            try {
                const res = await axios.get('/GeneralLedger/GetCustomers');
                const r = res.data?.result ?? res.data?.Result;
                customerList.value = Array.isArray(r)
                    ? r
                    : (Array.isArray(r?.data) ? r.data : (Array.isArray(r?.items) ? r.items : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []))));
            } catch (err) {
                console.error('Error fetching customers:', err);
                customerList.value = [];
            }
        }

        function loadCustomer(customer) {
            if (isFetching.value) return;
            isFetching.value = true;
            setTimeout(() => {
                form.id = customer.id;
                form.accountNumber = customer.accountNumber || '';
                form.name = customer.name || '';
                form.customerGroupId = customer.customerGroupId || '';
                form.customerGroupName = customer.customerGroupName || '';
                form.status = customer.status || customer.statusName || 'Active';
                form.address = customer.address || '';
                form.tinNumber = customer.tinNumber || '';
                form.vatNumber = customer.vatNumber || '';
                form.phoneNo = customer.phoneNo || '';
                form.email = customer.email || '';
                form.currencyId = customer.currencyId || '';
                form.currencyCode = customer.currencyCode || '';
                form.currencyName = customer.currencyName || '';
                form.balance = customer.balance || 0;
                form.creditLimit = customer.creditLimit || 0;
                form.taxOffice = customer.taxOffice || '';
                form.creditAccountId = customer.creditAccountId || '';
                form.creditAccountName = customer.creditAccountName || '';
                form.vatAccountId = customer.vatAccountId || '';
                form.vatAccountName = customer.vatAccountName || '';
                form.irsAccountId = customer.irsAccountId || '';
                form.irsAccountName = customer.irsAccountName || '';
                form.isResident = customer.isResident || false;
                form.contactPerson = customer.contactPerson || '';
                form.contactPersonPhone = customer.contactPersonPhone || '';
                form.contactPersonEmail = customer.contactPersonEmail || '';

                isEditing.value = true;
                submitted.value = false;
                customerSearch.value = '';
                isFetching.value = false;
            }, 300);
        }

        async function loadCustomerById(id) {
            if (!id) return;
            isFetching.value = true;
            try {
                const res = await axios.get(`/GeneralLedger/GetCustomer?id=${id}`);
                const c = res.data?.result;
                if (res.data?.success !== false && c && c.id) {
                    loadCustomer(c);
                } else {
                    throw new Error(res.data?.error || 'not found via detail endpoint');
                }
            } catch (err) {
                console.warn('Detail endpoint unavailable, falling back to list lookup:', err);
                try {
                    if (!customerList.value.length) await getCustomersList();
                    const customer = customerList.value.find(c => c.id === id);
                    if (customer) loadCustomer(customer);
                    else toastHandler('error', 'Customer not found.');
                } catch (e2) {
                    console.error('Error loading customer:', e2);
                    toastHandler('error', 'Unable to load customer.');
                }
            } finally {
                isFetching.value = false;
            }
        }

        function loadCustomerFromSearch(customer) {
            if (isFetching.value || !customer) return;
            isFetching.value = true;
            form.id = customer.id;
            form.accountNumber = customer.accountNumber || '';
            form.name = customer.name || '';
            form.customerGroupId = customer.customerGroupId || '';
            form.customerGroupName = customer.customerGroupName || '';
            form.status = customer.status || customer.statusName || 'Active';
            form.address = customer.address || '';
            form.tinNumber = customer.tinNumber || '';
            form.vatNumber = customer.vatNumber || '';
            form.phoneNo = customer.phoneNo || '';
            form.email = customer.email || '';
            form.currencyId = customer.currencyId || '';
            form.currencyCode = customer.currencyCode || '';
            form.currencyName = customer.currencyName || '';
            form.balance = customer.balance || 0;
            form.creditLimit = customer.creditLimit || 0;
            form.taxOffice = customer.taxOffice || '';
            form.creditAccountId = customer.creditAccountId || '';
            form.creditAccountName = customer.creditAccountName || '';
            form.vatAccountId = customer.vatAccountId || '';
            form.vatAccountName = customer.vatAccountName || '';
            form.irsAccountId = customer.irsAccountId || '';
            form.irsAccountName = customer.irsAccountName || '';
            form.isResident = customer.isResident || false;
            form.contactPerson = customer.contactPerson || '';
            form.contactPersonPhone = customer.contactPersonPhone || '';
            form.contactPersonEmail = customer.contactPersonEmail || '';

            isEditing.value = true;
            submitted.value = false;
            customerSearch.value = '';
            isFetching.value = false;
        }

        // ── Dropdown handlers ────────────────────────────────────────
        function onCurrencyChange() {
            const selectedCurrency = currencyList.value.find(c => c.id === form.currencyId);
            form.currencyCode = selectedCurrency?.code || '';
            form.currencyName = selectedCurrency?.name || '';
        }

        function onCustomerGroupChange() {
            const group = customerGroupList.value.find(g => g.id === form.customerGroupId);
            form.customerGroupName = group?.name || '';
        }

        function onCreditAccountChange() {
            const account = accountsList.value.find(a => a.id === form.creditAccountId);
            form.creditAccountName = account?.accountName || '';
        }

        function onVatAccountChange() {
            const account = accountsList.value.find(a => a.id === form.vatAccountId);
            form.vatAccountName = account?.accountName || '';
        }

        function onIrsAccountChange() {
            const account = accountsList.value.find(a => a.id === form.irsAccountId);
            form.irsAccountName = account?.accountName || '';
        }

        // ── Form actions ─────────────────────────────────────────────
        function resetForm() {
            Object.assign(form, {
                id: null,
                accountNumber: '',
                name: '',
                customerGroupId: '',
                customerGroupName: '',
                status: 'Active',
                address: '',
                tinNumber: '',
                vatNumber: '',
                phoneNo: '',
                email: '',
                currencyId: '',
                currencyCode: '',
                currencyName: '',
                balance: 0,
                creditLimit: 0,
                taxOffice: '',
                creditAccountId: '',
                creditAccountName: '',
                vatAccountId: '',
                vatAccountName: '',
                irsAccountId: '',
                irsAccountName: '',
                isResident: false,
                contactPerson: '',
                contactPersonPhone: '',
                contactPersonEmail: ''
            });
            submitted.value = false;
            customerSearch.value = '';
            if (isEditing.value) {
                isEditing.value = false;
                generateAccountNumber();
                if (customerGroupList.value.length && !form.customerGroupId) {
                    form.customerGroupId = customerGroupList.value[0].id;
                    onCustomerGroupChange();
                }
            }
        }

        function revertForm() {
            if (!isEditing.value || !form.id) { resetForm(); return; }
            loadCustomerById(form.id);
        }

        function newCustomer() {
            resetForm();
        }

        function apiErrorMessage(err, fallback) {
            return err?.response?.data?.error
                || err?.response?.data?.title
                || err?.response?.data?.message
                || err?.message
                || fallback;
        }

        function assertApiSuccess(res, fallback) {
            const d = res?.data;
            if (d && (d.success === false || d.isSuccess === false || d.error || d.errors)) {
                throw new Error(d.error || d.title || d.errors || fallback);
            }
            if (res.status >= 400) {
                throw new Error(fallback);
            }
            return true;
        }

        async function saveCustomer() {
            submitted.value = true;
            if (isFormInvalid.value) {
                toastHandler('error', 'Please fill all required fields.');
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (form.email && !emailPattern.test(form.email)) {
                toastHandler('error', 'Please enter a valid email address.');
                return;
            }
            if (form.contactPersonEmail && !emailPattern.test(form.contactPersonEmail)) {
                toastHandler('error', 'Please enter a valid contact person email address.');
                return;
            }

            isSaving.value = true;
            const payload = {
                id: form.id || '00000000-0000-0000-0000-000000000000',
                accountNumber: form.accountNumber,
                name: form.name,
                customerGroupId: form.customerGroupId,
                customerGroupName: form.customerGroupName,
                status: form.status,
                statusId: form.status === 'Active' ? 1 : form.status === 'Inactive' ? 2 : 3,
                statusName: form.status,
                address: form.address,
                tinNumber: form.tinNumber,
                vatNumber: form.vatNumber,
                phoneNo: form.phoneNo,
                email: form.email,
                currencyId: form.currencyId,
                currencyCode: form.currencyCode,
                currencyName: form.currencyName,
                balance: parseFloat(form.balance) || 0,
                creditLimit: parseFloat(form.creditLimit) || 0,
                taxOffice: form.taxOffice,
                creditAccountId: form.creditAccountId,
                creditAccountName: form.creditAccountName,
                vatAccountId: form.vatAccountId,
                vatAccountName: form.vatAccountName,
                irsAccountId: form.irsAccountId,
                irsAccountName: form.irsAccountName,
                isResident: form.isResident,
                contactPerson: form.contactPerson,
                contactPersonPhone: form.contactPersonPhone,
                contactPersonEmail: form.contactPersonEmail
            };

            try {
                let res;
                if (isEditing.value && form.id) {
                    res = await axios.post(`/GeneralLedger/UpdateCustomer`, payload);
                    assertApiSuccess(res, 'Failed to update customer.');
                } else {
                    res = await axios.post('/GeneralLedger/CreateCustomer', payload);
                    assertApiSuccess(res, 'Failed to create customer.');
                    await generateAccountNumber();
                }

                toastHandler('success', isEditing.value ? 'Customer updated successfully!' : 'Customer created successfully!');
                setTimeout(() => { window.location.href = '/GeneralLedger/Customers'; }, 1000);
            } catch (err) {
                console.error('Error saving customer:', err);
                toastHandler('error', apiErrorMessage(err, 'Unable to save customer.'));
            } finally {
                isSaving.value = false;
            }
        }

        async function confirmDelete() {
            showDeleteModal.value = true;
        }

        async function deleteCustomer() {
            if (!isEditing.value || !form.id) return;
            isDeleting.value = true;
            try {
                // Mirror create-supplier.js: DELETE → POST fallback → SharedResource GET fallback
                try {
                    await axios.delete(`/GeneralLedger/DeleteCustomer?id=${form.id}`);
                } catch (e) {
                    try {
                        await axios.post(`/GeneralLedger/DeleteCustomer?id=${form.id}`);
                    } catch (e2) {
                        await axios.get(`/SharedResource/DelCustomer?id=${form.id}`);
                    }
                }
                toastHandler('success', 'Customer deleted successfully!');
                showDeleteModal.value = false;
                setTimeout(() => { window.location.href = '/GeneralLedger/Customers'; }, 1000);
            } catch (err) {
                console.error('Error deleting customer:', err);
                toastHandler('error', apiErrorMessage(err, 'Unable to delete customer.'));
            } finally {
                isDeleting.value = false;
            }
        }

        function handleBack() {
            window.location.href = '/GeneralLedger/Customers';
        }

        onMounted(async () => {
            targetId.value = new URLSearchParams(window.location.search).get('id')
                || document.querySelector('[data-customer-id]')?.getAttribute('data-customer-id');

            await Promise.allSettled([
                getCustomerGroups(),
                getCurrencies(),
                getAccounts(),
                getDefaultGL()
            ]);

            if (targetId.value && targetId.value !== '00000000-0000-0000-0000-000000000000') {
                isEditing.value = true;
                await loadCustomerById(targetId.value);
            } else {
                resetForm();
                generateAccountNumber();
                if (customerGroupList.value.length && !form.customerGroupId) {
                    form.customerGroupId = customerGroupList.value[0].id;
                    onCustomerGroupChange();
                }
            }
        });

        return {
            isEditing,
            customerSearch,
            filteredCustomers,
            customerSearchResults,
            isFetching,
            isSaving,
            isDeleting,
            customerGroupList,
            statusList,
            currencyList,
            accountsList,
            form,
            submitted,
            isFormInvalid,
            showDeleteModal,
            accountNumberInvalid,
            nameInvalid,
            currencyIdInvalid,
            customerGroupIdInvalid,
            emailInvalid,
            onCurrencyChange,
            onCustomerGroupChange,
            onCreditAccountChange,
            onVatAccountChange,
            onIrsAccountChange,
            loadCustomer,
            loadCustomerFromSearch,
            generateAccountNumber,
            resetForm,
            revertForm,
            newCustomer,
            saveCustomer,
            confirmDelete,
            deleteCustomer,
            handleBack
        };
    }
}).mount('#app');
