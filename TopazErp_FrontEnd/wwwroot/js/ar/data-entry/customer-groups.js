const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            theme: '#f88500',

            // Mock tenant ID for local frontend testing.
            currentTenantId: 1,

            customerGroupList: [
                {
                    id: 'SG-001',
                    tenantId: 1,
                    name: 'General Customers'
                },
                {
                    id: 'SG-002',
                    tenantId: 1,
                    name: 'Raw Materials'
                },
                {
                    id: 'SG-003',
                    tenantId: 1,
                    name: 'Office Supplies'
                },
                {
                    id: 'SG-004',
                    tenantId: 1,
                    name: 'IT Equipment and Services'
                },
                {
                    id: 'SG-005',
                    tenantId: 1,
                    name: 'Transport and Logistics'
                },
                {
                    id: 'SG-006',
                    tenantId: 1,
                    name: 'Maintenance and Repairs'
                },
                {
                    id: 'SG-007',
                    tenantId: 1,
                    name: 'Professional Services'
                },
                {
                    id: 'SG-008',
                    tenantId: 1,
                    name: 'Construction Materials'
                }
            ],

            customerGroupColumns: [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true,
                    width: 100,
                    help: 'Automatically generated record ID'
                },
                {
                    key: 'name',
                    label: 'Customer Group',
                    type: 'text',
                    width: 320,
                    minWidth: 250,
                    required: true,
                    searchable: true
                },
                {
                    key: 'tenantId',
                    label: 'Tenant',
                    type: 'number',
                    hidden: true,
                    width: 100
                }
            ]
        };
    },

    methods: {
        // Generate a unique mock record ID.
        generateId() {
            if (typeof crypto !== 'undefined' &&
                typeof crypto.randomUUID === 'function') {
                return crypto.randomUUID();
            }

            return `SG-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        },

        // Find a record by its ID.
        getCustomerGroup(id) {
            return this.customerGroupList.find(
                item => String(item.id) === String(id)
            );
        },

        // Validate the customer group.
        validateRecord(row, excludeId = null) {
            if (!row || !row.name || !row.name.trim()) {
                this.toastHandler(
                    'warning',
                    'Customer group name is required.'
                );
                return false;
            }

            const normalizedName = row.name.trim().toLowerCase();

            const duplicate = this.customerGroupList.some(item =>
                item.name.trim().toLowerCase() === normalizedName &&
                String(item.id) !== String(excludeId)
            );

            if (duplicate) {
                this.toastHandler(
                    'warning',
                    'A customer group with this name already exists.'
                );
                return false;
            }

            return true;
        },

        // CREATE
        async onCreate(event) {
            try {
                const row = event?.row;

                if (!row || !this.validateRecord(row)) {
                    return;
                }

                // Exclude ID and tenant ID from the create fields.
                const {
                    id,
                    tenantId,
                    ...createPayload
                } = row;

                const createdRecord = {
                    ...createPayload,
                    name: createPayload.name.trim(),
                    id: this.generateId(),
                    tenantId: this.currentTenantId
                };

                this.customerGroupList.unshift(createdRecord);

                this.toastHandler(
                    'success',
                    'Customer group created successfully.'
                );

                console.log('MOCK CREATE PAYLOAD:', createPayload);
                console.log('CREATED RECORD:', createdRecord);
            } catch (error) {
                console.error('Create failed:', error);

                this.toastHandler(
                    'error',
                    'Failed to create customer group.'
                );
            }
        },

        // UPDATE
        async onUpdate(event) {
            try {
                const row = event?.row;

                if (!row) {
                    this.toastHandler(
                        'error',
                        'No customer group was provided for updating.'
                    );
                    return;
                }

                const existingRecord = this.getCustomerGroup(row.id);

                if (!existingRecord) {
                    this.toastHandler(
                        'error',
                        'Customer group was not found.'
                    );
                    return;
                }

                if (!this.validateRecord(row, existingRecord.id)) {
                    return;
                }

                // Preserve the original ID and tenant ID.
                const updatePayload = {
                    ...existingRecord,
                    ...row,
                    id: existingRecord.id,
                    tenantId: existingRecord.tenantId,
                    name: row.name.trim()
                };

                const index = this.customerGroupList.findIndex(
                    item => String(item.id) === String(updatePayload.id)
                );

                if (index !== -1) {
                    this.customerGroupList.splice(index, 1, updatePayload);
                }

                this.toastHandler(
                    'success',
                    'Customer group updated successfully.'
                );

                console.log('MOCK UPDATE PAYLOAD:', updatePayload);
            } catch (error) {
                console.error('Update failed:', error);

                this.toastHandler(
                    'error',
                    'Failed to update customer group.'
                );
            }
        },

        // DELETE
        async onDelete(event) {
            try {
                // Support either a single row or selected rows.
                const rows = event?.rows
                    ? event.rows
                    : event?.row
                        ? [event.row]
                        : event?.data
                            ? (Array.isArray(event.data)
                                ? event.data
                                : [event.data])
                            : [];

                if (!rows.length) {
                    this.toastHandler(
                        'warning',
                        'Select at least one customer group to delete.'
                    );
                    return;
                }

                const ids = rows
                    .map(row => row.id)
                    .filter(id => id !== undefined && id !== null);

                if (!ids.length) {
                    this.toastHandler(
                        'error',
                        'No valid customer group IDs were found.'
                    );
                    return;
                }

                const result = await Swal.fire({
                    title: 'Delete customer group?',
                    text: ids.length === 1
                        ? 'This customer group will be removed.'
                        : `You are about to delete ${ids.length} customer groups.`,
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

                const idsToDelete = new Set(ids.map(String));

                this.customerGroupList =
                    this.customerGroupList.filter(
                        item => !idsToDelete.has(String(item.id))
                    );

                this.toastHandler(
                    'success',
                    ids.length === 1
                        ? 'Customer group deleted successfully.'
                        : 'Customer groups deleted successfully.'
                );

                console.log('MOCK DELETE IDS:', ids);
            } catch (error) {
                console.error('Delete failed:', error);

                this.toastHandler(
                    'error',
                    'Failed to delete customer group.'
                );
            }
        },

        // SweetAlert2 toast notifications.
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
        // No API calls. Data is initialized locally in data().
    }
});

app.use(DataGridPlugin);

app.mount('#app');

