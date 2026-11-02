const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            isLoading: false,
            isShimmerLoading: false,
            isEditing: false,
            currentTenantId: 1,
            supplierSearch: '',

            supplierColumns: [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true,
                    width: 100
                },
                {
                    key: 'accountNumber',
                    label: 'Account Number',
                    type: 'text',
                    width: 160,
                    searchable: true,
                    render: (v, row) => {
                        const val = v || '—';
                        const id = row?.id;
                        if (id) {
                            return `<a href="/GeneralLedger/CreateSupplier?id=${encodeURIComponent(id)}" class="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition" title="Click to edit supplier">${val}</a>`;
                        }
                        return `<span class="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 text-slate-800">${val}</span>`;
                    }
                },
                {
                    key: 'name',
                    label: 'Supplier Name',
                    type: 'avatar',
                    width: 260,
                    minWidth: 220,
                    required: true,
                    searchable: true,
                    subtitleKey: 'email'
                },
                {
                    key: 'supplierGroupName',
                    label: 'Supplier Group',
                    type: 'text',
                    width: 190,
                    searchable: true
                },
                {
                    key: 'phoneNo',
                    label: 'Contact Number',
                    type: 'text',
                    width: 160,
                    searchable: true
                },
                {
                    key: 'email',
                    label: 'Email',
                    type: 'email',
                    width: 240,
                    searchable: true
                },
                {
                    key: 'statusName',
                    label: 'Status',
                    type: 'text',
                    width: 130,
                    searchable: true
                },
                {
                    key: 'tenantId',
                    label: 'Tenant',
                    type: 'number',
                    hidden: true,
                    width: 100
                }
            ],

            supplierGroupList: [
                { id: 'SG-001', name: 'General Suppliers' },
                { id: 'SG-002', name: 'Raw Materials' },
                { id: 'SG-003', name: 'Office Supplies' },
                { id: 'SG-004', name: 'IT Equipment and Services' },
                { id: 'SG-005', name: 'Transport and Logistics' },
                { id: 'SG-006', name: 'Maintenance and Repairs' },
                { id: 'SG-007', name: 'Professional Services' }
            ],

            statusList: [
                { id: 1, name: 'Active' },
                { id: 2, name: 'Inactive' },
                { id: 3, name: 'Pending' }
            ],

            currencyList: [
                { id: 1, currencyName: 'GHS - Ghana Cedi' },
                { id: 2, currencyName: 'USD - US Dollar' },
                { id: 3, currencyName: 'EUR - Euro' },
                { id: 4, currencyName: 'GBP - British Pound' }
            ],

            supplierList: [],

            form: {},

            emptyForm: {
                id: null,
                tenantId: null,
                accountNumber: '',
                name: '',
                supplierGroupId: '',
                statusId: '',
                address: '',
                tinNumber: '',
                vatNumber: '',
                phoneNo: '',
                currencyId: '',
                email: '',
                balance: 0,
                taxOffice: '',
                debitAccountId: '',
                creditAccountId: '',
                vatAccountId: '',
                irsAccountId: '',
                isResident: false,
                contactPerson: '',
                contactPersonPhone: '',
                contactPersonEmail: ''
            }
        };
    },

    methods: {
        // Generate mock IDs.
        generateId() {
            if (
                typeof crypto !== 'undefined' &&
                typeof crypto.randomUUID === 'function'
            ) {
                return crypto.randomUUID();
            }

            return `SUP-${Date.now()}-${Math.floor(
                Math.random() * 100000
            )}`;
        },

        // Create an account number for a new supplier.
        generateAccountNumber() {
            if (this.isEditing) {
                this.toastHandler(
                    'warning',
                    'Account number generation is available for new suppliers.'
                );
                return;
            }

            const existingNumbers = new Set(
                this.supplierList.map(item => item.accountNumber)
            );

            let accountNumber;

            do {
                accountNumber =
                    `SUP${Date.now().toString().slice(-6)}` +
                    Math.floor(Math.random() * 10);
            } while (existingNumbers.has(accountNumber));

            this.form.accountNumber = accountNumber;
        },

        // Resolve dropdown names for display in the grid.
        enrichSupplier(supplier) {
            const group = this.supplierGroupList.find(
                item => String(item.id) ===
                    String(supplier.supplierGroupId)
            );

            const status = this.statusList.find(
                item => String(item.id) ===
                    String(supplier.statusId)
            );

            return {
                ...supplier,
                supplierGroupName: group?.name || 'Not assigned',
                statusName: status?.name || 'Unknown'
            };
        },

        // Create mock supplier records.
        loadMockData() {
            const samples = [
                {
                    id: 'SUP-001',
                    tenantId: 1,
                    accountNumber: 'SUP100001',
                    name: 'Accra Office Supplies Ltd',
                    supplierGroupId: 'SG-003',
                    statusId: 1,
                    address: 'Accra, Ghana',
                    tinNumber: 'C0012345678',
                    vatNumber: 'VAT-10001',
                    phoneNo: '0240000001',
                    currencyId: 1,
                    email: 'sales@accraoffice.example',
                    balance: 1250,
                    taxOffice: 'Accra Central',
                    debitAccountId: '120001',
                    creditAccountId: '210001',
                    vatAccountId: '220001',
                    irsAccountId: '230001',
                    isResident: true,
                    contactPerson: 'Ama Mensah',
                    contactPersonPhone: '0240000011',
                    contactPersonEmail: 'ama@accraoffice.example'
                },
                {
                    id: 'SUP-002',
                    tenantId: 1,
                    accountNumber: 'SUP100002',
                    name: 'Golden Materials Ltd',
                    supplierGroupId: 'SG-002',
                    statusId: 1,
                    address: 'Tema, Ghana',
                    tinNumber: 'C0023456789',
                    vatNumber: 'VAT-10002',
                    phoneNo: '0240000002',
                    currencyId: 1,
                    email: 'orders@goldenmaterials.example',
                    balance: 0,
                    taxOffice: 'Tema',
                    debitAccountId: '120002',
                    creditAccountId: '210002',
                    vatAccountId: '220002',
                    irsAccountId: '230002',
                    isResident: true,
                    contactPerson: 'Kwame Owusu',
                    contactPersonPhone: '0240000012',
                    contactPersonEmail: 'kwame@goldenmaterials.example'
                },
                {
                    id: 'SUP-003',
                    tenantId: 1,
                    accountNumber: 'SUP100003',
                    name: 'Tech Solutions Ghana',
                    supplierGroupId: 'SG-004',
                    statusId: 1,
                    address: 'East Legon, Accra',
                    tinNumber: 'C0034567890',
                    vatNumber: 'VAT-10003',
                    phoneNo: '0240000003',
                    currencyId: 1,
                    email: 'info@techsolutions.example',
                    balance: 3200.5,
                    taxOffice: 'Accra East',
                    debitAccountId: '120003',
                    creditAccountId: '210003',
                    vatAccountId: '220003',
                    irsAccountId: '230003',
                    isResident: true,
                    contactPerson: 'Kofi Asare',
                    contactPersonPhone: '0240000013',
                    contactPersonEmail: 'kofi@techsolutions.example'
                },
                {
                    id: 'SUP-004',
                    tenantId: 1,
                    accountNumber: 'SUP100004',
                    name: 'Global Logistics Services',
                    supplierGroupId: 'SG-005',
                    statusId: 2,
                    address: 'Spintex Road, Accra',
                    tinNumber: 'C0045678901',
                    vatNumber: '',
                    phoneNo: '0240000004',
                    currencyId: 2,
                    email: 'accounts@globallogistics.example',
                    balance: 450,
                    taxOffice: 'Accra Central',
                    debitAccountId: '120004',
                    creditAccountId: '210004',
                    vatAccountId: '220004',
                    irsAccountId: '230004',
                    isResident: false,
                    contactPerson: 'Esi Boateng',
                    contactPersonPhone: '0240000014',
                    contactPersonEmail: 'esi@globallogistics.example'
                },
                {
                    id: 'SUP-005',
                    tenantId: 1,
                    accountNumber: 'SUP100005',
                    name: 'Prime Maintenance Services',
                    supplierGroupId: 'SG-006',
                    statusId: 3,
                    address: 'Adenta, Accra',
                    tinNumber: 'C0056789012',
                    vatNumber: 'VAT-10005',
                    phoneNo: '0240000005',
                    currencyId: 1,
                    email: 'support@primemaintenance.example',
                    balance: 0,
                    taxOffice: 'Madina',
                    debitAccountId: '120005',
                    creditAccountId: '210005',
                    vatAccountId: '220005',
                    irsAccountId: '230005',
                    isResident: true,
                    contactPerson: 'Abena Osei',
                    contactPersonPhone: '0240000015',
                    contactPersonEmail: 'abena@primemaintenance.example'
                }
            ];

            this.supplierList = samples.map(item =>
                this.enrichSupplier(item)
            );
        },

        // Reset the form for a new supplier.
        clearForm() {
            this.isEditing = false;
            this.supplierSearch = '';
            this.form = { ...this.emptyForm };

            this.$nextTick(() => {
                const accountInput = document.getElementById(
                    'accountNumber'
                );

                if (accountInput) {
                    accountInput.focus();
                }
            });
        },

        // Search for an existing supplier and load it.
        loadSupplierFromSearch() {
            const query = this.supplierSearch.trim().toLowerCase();

            if (!query) {
                this.toastHandler(
                    'warning',
                    'Enter a supplier name or account number.'
                );
                return;
            }

            const matches = this.supplierList.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.accountNumber.toLowerCase().includes(query)
            );

            if (!matches.length) {
                this.toastHandler(
                    'warning',
                    'No matching supplier was found.'
                );
                return;
            }

            if (matches.length > 1) {
                this.toastHandler(
                    'warning',
                    'More than one supplier matched. Refine your search.'
                );
                return;
            }

            this.loadSupplier(matches[0]);
        },

        // Populate the form from a supplier record.
        loadSupplier(supplier) {
            if (!supplier) {
                return;
            }

            const { supplierGroupName, statusName, ...record } = supplier;

            this.form = {
                ...this.emptyForm,
                ...record
            };

            this.isEditing = true;
            this.supplierSearch = supplier.name;

            this.toastHandler(
                'success',
                'Supplier loaded for editing.'
            );

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },

        // Validate required fields and duplicate values.
        validateSupplier() {
            const requiredFields = [
                ['accountNumber', 'Account number'],
                ['name', 'Supplier name'],
                ['statusId', 'Supplier status'],
                ['address', 'Supplier address'],
                ['tinNumber', 'TIN number'],
                ['phoneNo', 'Contact number'],
                ['currencyId', 'Default currency'],
                ['email', 'Email address'],
                ['debitAccountId', 'Debit G/L'],
                ['creditAccountId', 'Credit G/L'],
                ['vatAccountId', 'VAT G/L'],
                ['irsAccountId', 'IRS G/L']
            ];

            for (const [field, label] of requiredFields) {
                const value = this.form[field];

                if (
                    value === null ||
                    value === undefined ||
                    String(value).trim() === ''
                ) {
                    this.toastHandler(
                        'warning',
                        `${label} is required.`
                    );
                    return false;
                }
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(this.form.email)) {
                this.toastHandler(
                    'warning',
                    'Enter a valid supplier email address.'
                );
                return false;
            }

            if (
                this.form.contactPersonEmail &&
                !emailPattern.test(this.form.contactPersonEmail)
            ) {
                this.toastHandler(
                    'warning',
                    'Enter a valid contact person email address.'
                );
                return false;
            }

            const duplicateAccount = this.supplierList.some(item =>
                item.accountNumber.trim().toLowerCase() ===
                this.form.accountNumber.trim().toLowerCase() &&
                String(item.id) !== String(this.form.id)
            );

            if (duplicateAccount) {
                this.toastHandler(
                    'warning',
                    'This account number is already assigned to another supplier.'
                );
                return false;
            }

            const duplicateName = this.supplierList.some(item =>
                item.name.trim().toLowerCase() ===
                this.form.name.trim().toLowerCase() &&
                String(item.id) !== String(this.form.id)
            );

            if (duplicateName) {
                this.toastHandler(
                    'warning',
                    'A supplier with this name already exists.'
                );
                return false;
            }

            return true;
        },

        // Save a new supplier or update an existing one.
        async saveSupplier() {
            if (this.isLoading || !this.validateSupplier()) {
                return;
            }

            this.isLoading = true;

            try {
                const isUpdate = this.isEditing;

                const payload = {
                    ...this.form,
                    name: this.form.name.trim(),
                    accountNumber: this.form.accountNumber.trim(),
                    email: this.form.email.trim(),
                    address: this.form.address.trim(),
                    tinNumber: this.form.tinNumber.trim(),
                    phoneNo: this.form.phoneNo.trim()
                };

                if (isUpdate) {
                    const index = this.supplierList.findIndex(
                        item => String(item.id) === String(payload.id)
                    );

                    if (index === -1) {
                        this.toastHandler(
                            'error',
                            'Supplier record was not found.'
                        );
                        return;
                    }

                    // Retain system-owned fields.
                    payload.id = this.supplierList[index].id;
                    payload.tenantId =
                        this.supplierList[index].tenantId;

                    this.supplierList.splice(
                        index,
                        1,
                        this.enrichSupplier(payload)
                    );

                    this.toastHandler(
                        'success',
                        'Supplier updated successfully.'
                    );
                } else {
                    // Simulate server-assigned ID and tenant.
                    delete payload.id;
                    delete payload.tenantId;

                    const createdRecord = {
                        ...payload,
                        id: this.generateId(),
                        tenantId: this.currentTenantId
                    };

                    this.supplierList.unshift(
                        this.enrichSupplier(createdRecord)
                    );

                    this.toastHandler(
                        'success',
                        'Supplier created successfully.'
                    );
                }

                console.log(
                    isUpdate
                        ? 'MOCK SUPPLIER UPDATE'
                        : 'MOCK SUPPLIER CREATE',
                    payload
                );

                this.clearForm();
            } catch (error) {
                console.error('Supplier save failed:', error);

                this.toastHandler(
                    'error',
                    'Unable to save supplier.'
                );
            } finally {
                this.isLoading = false;
            }
        },

        // Data-grid open-form event: navigate to dedicated create or edit page.
        onGridOpenForm(event) {
            if (event?.mode === 'update' && event?.row?.id) {
                window.location.href = `/GeneralLedger/CreateSupplier?id=${encodeURIComponent(event.row.id)}`;
            } else {
                window.location.href = '/GeneralLedger/CreateSupplier';
            }
        },

        // Data-grid create event.
        onGridCreate(event) {
            const row = event?.row;

            if (!row) {
                this.clearForm();
                return;
            }

            this.createFromGrid(row);
        },

        // Create a supplier from a grid editor.
        createFromGrid(row) {
            const payload = {
                ...this.emptyForm,
                ...row
            };

            if (!payload.name || !payload.name.trim()) {
                this.toastHandler(
                    'warning',
                    'Supplier name is required.'
                );
                return;
            }

            const duplicate = this.supplierList.some(item =>
                item.name.trim().toLowerCase() ===
                payload.name.trim().toLowerCase()
            );

            if (duplicate) {
                this.toastHandler(
                    'warning',
                    'A supplier with this name already exists.'
                );
                return;
            }

            delete payload.id;
            delete payload.tenantId;

            const createdRecord = {
                ...payload,
                id: this.generateId(),
                tenantId: this.currentTenantId
            };

            this.supplierList.unshift(
                this.enrichSupplier(createdRecord)
            );

            this.toastHandler(
                'success',
                'Supplier created successfully.'
            );
        },

        // Data-grid update event.
        onGridUpdate(event) {
            const row = event?.row;

            if (!row) {
                this.toastHandler(
                    'warning',
                    'No supplier was provided for updating.'
                );
                return;
            }

            const existing = this.supplierList.find(
                item => String(item.id) === String(row.id)
            );

            if (!existing) {
                this.toastHandler(
                    'error',
                    'Supplier record was not found.'
                );
                return;
            }

            const updated = {
                ...existing,
                ...row,
                id: existing.id,
                tenantId: existing.tenantId
            };

            if (!updated.name || !updated.name.trim()) {
                this.toastHandler(
                    'warning',
                    'Supplier name is required.'
                );
                return;
            }

            const duplicate = this.supplierList.some(item =>
                String(item.id) !== String(updated.id) &&
                item.name.trim().toLowerCase() ===
                updated.name.trim().toLowerCase()
            );

            if (duplicate) {
                this.toastHandler(
                    'warning',
                    'A supplier with this name already exists.'
                );
                return;
            }

            const index = this.supplierList.findIndex(
                item => String(item.id) === String(updated.id)
            );

            this.supplierList.splice(
                index,
                1,
                this.enrichSupplier(updated)
            );

            this.toastHandler(
                'success',
                'Supplier updated successfully.'
            );
        },

        // Data-grid delete event.
        async onGridDelete(event) {
            const rows = this.getRowsFromEvent(event);

            if (!rows.length) {
                this.toastHandler(
                    'warning',
                    'No supplier was selected for deletion.'
                );
                return;
            }

            await this.deleteSuppliers(rows);
        },

        // Delete the supplier currently loaded in the form.
        async confirmDeleteCurrent() {
            if (!this.form.id) {
                return;
            }

            await this.deleteSuppliers([
                { id: this.form.id, name: this.form.name }
            ]);
        },

        // Normalize grid event payloads.
        getRowsFromEvent(event) {
            if (Array.isArray(event?.rows)) {
                return event.rows;
            }

            if (event?.row) {
                return [event.row];
            }

            if (Array.isArray(event?.data)) {
                return event.data;
            }

            if (event?.data) {
                return [event.data];
            }

            return [];
        },

        // Delete records locally after confirmation.
        async deleteSuppliers(rows) {
            const ids = [
                ...new Set(
                    rows
                        .map(row => row.id)
                        .filter(id => id !== undefined && id !== null)
                        .map(String)
                )
            ];

            if (!ids.length) {
                this.toastHandler(
                    'error',
                    'No valid supplier IDs were provided.'
                );
                return;
            }

            if (typeof Swal === 'undefined') {
                this.toastHandler(
                    'error',
                    'SweetAlert2 is not available.'
                );
                return;
            }

            const result = await Swal.fire({
                title: ids.length === 1
                    ? 'Delete supplier?'
                    : 'Delete selected suppliers?',
                text: ids.length === 1
                    ? 'This supplier will be removed from the local list.'
                    : `${ids.length} suppliers will be removed from the local list.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                reverseButtons: true,
                focusCancel: true
            });

            if (!result.isConfirmed) {
                return;
            }

            this.supplierList = this.supplierList.filter(
                item => !ids.includes(String(item.id))
            );

            if (ids.includes(String(this.form.id))) {
                this.clearForm();
            }

            this.toastHandler(
                'success',
                ids.length === 1
                    ? 'Supplier deleted successfully.'
                    : 'Suppliers deleted successfully.'
            );
        },

        // SweetAlert2 notifications.
        toastHandler(
            type,
            message = 'An unexpected error occurred.'
        ) {
            if (typeof Swal === 'undefined') {
                console.log(message);
                return;
            }

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type || 'success',
                title: message,
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
        }
    },

    mounted() {
        this.form = { ...this.emptyForm };
        this.loadMockData();
    }
});

app.use(DataGridPlugin);

app.mount('#app');