const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            theme: '#0645e7',

            // Mock tenant ID for local frontend testing.
            currentTenantId: 1,

            supplierGroupList: [
                {
                    id: 'SG-001',
                    tenantId: 1,
                    name: 'General Suppliers'
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

            supplierGroupColumns: [
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
                    label: 'Supplier Group',
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
        getSupplierGroup(id) {
            return this.supplierGroupList.find(
                item => String(item.id) === String(id)
            );
        },

        // Validate the supplier group.
        validateRecord(row, excludeId = null) {
            if (!row || !row.name || !row.name.trim()) {
                this.toastHandler(
                    'warning',
                    'Supplier group name is required.'
                );
                return false;
            }

            const normalizedName = row.name.trim().toLowerCase();

            const duplicate = this.supplierGroupList.some(item =>
                item.name.trim().toLowerCase() === normalizedName &&
                String(item.id) !== String(excludeId)
            );

            if (duplicate) {
                this.toastHandler(
                    'warning',
                    'A supplier group with this name already exists.'
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

                this.supplierGroupList.unshift(createdRecord);

                this.toastHandler(
                    'success',
                    'Supplier group created successfully.'
                );

                console.log('MOCK CREATE PAYLOAD:', createPayload);
                console.log('CREATED RECORD:', createdRecord);
            } catch (error) {
                console.error('Create failed:', error);

                this.toastHandler(
                    'error',
                    'Failed to create supplier group.'
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
                        'No supplier group was provided for updating.'
                    );
                    return;
                }

                const existingRecord = this.getSupplierGroup(row.id);

                if (!existingRecord) {
                    this.toastHandler(
                        'error',
                        'Supplier group was not found.'
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

                const index = this.supplierGroupList.findIndex(
                    item => String(item.id) === String(updatePayload.id)
                );

                if (index !== -1) {
                    this.supplierGroupList.splice(index, 1, updatePayload);
                }

                this.toastHandler(
                    'success',
                    'Supplier group updated successfully.'
                );

                console.log('MOCK UPDATE PAYLOAD:', updatePayload);
            } catch (error) {
                console.error('Update failed:', error);

                this.toastHandler(
                    'error',
                    'Failed to update supplier group.'
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
                        'Select at least one supplier group to delete.'
                    );
                    return;
                }

                const ids = rows
                    .map(row => row.id)
                    .filter(id => id !== undefined && id !== null);

                if (!ids.length) {
                    this.toastHandler(
                        'error',
                        'No valid supplier group IDs were found.'
                    );
                    return;
                }

                const result = await Swal.fire({
                    title: 'Delete supplier group?',
                    text: ids.length === 1
                        ? 'This supplier group will be removed.'
                        : `You are about to delete ${ids.length} supplier groups.`,
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

                this.supplierGroupList =
                    this.supplierGroupList.filter(
                        item => !idsToDelete.has(String(item.id))
                    );

                this.toastHandler(
                    'success',
                    ids.length === 1
                        ? 'Supplier group deleted successfully.'
                        : 'Supplier groups deleted successfully.'
                );

                console.log('MOCK DELETE IDS:', ids);
            } catch (error) {
                console.error('Delete failed:', error);

                this.toastHandler(
                    'error',
                    'Failed to delete supplier group.'
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
