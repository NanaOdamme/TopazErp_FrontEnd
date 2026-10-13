const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            isLoading: false,

            moduleList: [
                { Id: 1001, Name: 'General Ledger' },
                { Id: 2001, Name: 'Payroll' },
                { Id: 3001, Name: 'School Manager' },
                { Id: 4001, Name: 'School Pro' },
                { Id: 5001, Name: 'Stock Manager' },
                { Id: 6001, Name: 'Account Payables' },
                { Id: 7001, Name: 'Account Receivables' },
                { Id: 8001, Name: 'Assets Manager' },
                { Id: 9001, Name: 'Shared' }
            ],

            itemNames: [
                { Id: 1001, moduleId: 6001, Name: 'ApInvoiceNumbers', FriendlyName: 'AP Invoice Numbers' },
                { Id: 2001, moduleId: 6001, Name: 'ApAccountNumbers', FriendlyName: 'Supplier Account Numbers' },
                { Id: 3001, moduleId: 6001, Name: 'ApInvoiceBatchNumbers', FriendlyName: 'AP Invoice Batch Numbers' },
                { Id: 4001, moduleId: 7001, Name: 'ArInvoiceNumbers', FriendlyName: 'AR Invoice Numbers' },
                { Id: 5001, moduleId: 7001, Name: 'ArAccountNumbers', FriendlyName: 'Customer Account Numbers' },
                { Id: 6001, moduleId: 7001, Name: 'ArInvoiceBatchNumbers', FriendlyName: 'AR Invoice Batch Numbers' },
                { Id: 7001, moduleId: 2001, Name: 'EmployeeID', FriendlyName: 'Employee ID' },
                { Id: 8001, moduleId: 1001, Name: 'GL', FriendlyName: 'General Ledger Numbers' },
                { Id: 9001, moduleId: 6001, Name: 'AP-VoucherBatchNumbers', FriendlyName: 'AP Voucher Batch Numbers' },
                { Id: 1002, moduleId: 6001, Name: 'AP-PaymentBatchNumbers', FriendlyName: 'AP Payment Batch Numbers' },
                { Id: 1101, moduleId: 6001, Name: 'AP-MemoBatchNumbers', FriendlyName: 'Debit Memo Batch Numbers' },
                { Id: 1201, moduleId: 7001, Name: 'AR-MemoBatchNumbers', FriendlyName: 'Credit Memo Batch Numbers' },
                { Id: 1301, moduleId: 7001, Name: 'AR-PaymentBatchNumbers', FriendlyName: 'AR Payment Batch Numbers' },
                { Id: 1401, moduleId: 1001, Name: 'GL-VoucherBatchNumbers', FriendlyName: 'GL Voucher Batch Numbers' },
                { Id: 1501, moduleId: 3001, Name: 'SM-StudentID', FriendlyName: 'Student ID' },
                { Id: 1601, moduleId: 3001, Name: 'SM-StaffID', FriendlyName: 'Staff ID' },
                { Id: 1701, moduleId: 3001, Name: 'SM-IndexNo', FriendlyName: 'Student Index Number' },
                { Id: 1702, moduleId: 9001, Name: 'SupplierID', FriendlyName: 'Supplier ID' },
                { Id: 1703, moduleId: 1001, Name: 'JournalBatchNumber', FriendlyName: 'Journal Batch Numbers' },
                { Id: 1704, moduleId: 3001, Name: 'SM-ReceiptNumbers', FriendlyName: 'Receipt Numbers' },
                { Id: 1705, moduleId: 3001, Name: 'SM-BatchNumbers', FriendlyName: 'School Batch Numbers' },
                { Id: 1706, moduleId: 3001, Name: 'SM-BillNumbers', FriendlyName: 'Bill Numbers' }
            ],

            systemNumberColumns: [
                {
                    key: 'pk',
                    label: 'Key',
                    hidden: true
                },
                {
                    key: 'id',
                    label: 'ID',
                    hidden: true
                },
                {
                    key: 'moduleName',
                    label: 'Module',
                    type: 'text',
                    searchable: true,
                    editable: false,
                    width: 180
                },
                {
                    key: 'friendlyName',
                    label: 'System Number',
                    type: 'text',
                    searchable: true,
                    editable: false,
                    required: true,
                    width: 250
                },
                {
                    key: 'prefix',
                    label: 'Prefix',
                    type: 'text',
                    editable: true,
                    width: 150
                },
                {
                    key: 'suffix',
                    label: 'Suffix',
                    type: 'text',
                    editable: true,
                    width: 150
                },
                {
                    key: 'lastNo',
                    label: 'Last Number',
                    type: 'number',
                    editable: true,
                    required: true,
                    width: 150
                },
                {
                    key: 'setupStatus',
                    label: 'Setup Status',
                    type: 'text',
                    searchable: true,
                    editable: false,
                    width: 150
                },
                {
                    key: 'tenantId',
                    label: 'Tenant',
                    hidden: true
                }
            ],

            systemNumbers: [],

            // Preserve the original mock configuration for reset.
            initialConfiguredNumbers: [
                {
                    itemName: 'ApInvoiceNumbers',
                    prefix: 'API-',
                    suffix: '',
                    lastNo: 1005
                },
                {
                    itemName: 'ApAccountNumbers',
                    prefix: 'SUP-',
                    suffix: '',
                    lastNo: 125
                },
                {
                    itemName: 'ArInvoiceNumbers',
                    prefix: 'ARI-',
                    suffix: '',
                    lastNo: 450
                },
                {
                    itemName: 'EmployeeID',
                    prefix: 'EMP-',
                    suffix: '',
                    lastNo: 85
                },
                {
                    itemName: 'GL',
                    prefix: 'GL-',
                    suffix: '',
                    lastNo: 500
                },
                {
                    itemName: 'SM-StudentID',
                    prefix: 'STU-',
                    suffix: '',
                    lastNo: 1200
                },
                {
                    itemName: 'SupplierID',
                    prefix: 'SUPP-',
                    suffix: '',
                    lastNo: 90
                },
                {
                    itemName: 'JournalBatchNumber',
                    prefix: 'JRN-',
                    suffix: '',
                    lastNo: 200
                }
            ]
        };
    },

    computed: {
        configuredCount() {
            return this.systemNumbers.filter(
                item => !item._isMissing
            ).length;
        },

        missingCount() {
            return this.systemNumbers.filter(
                item => item._isMissing
            ).length;
        },

        moduleCount() {
            return new Set(
                this.systemNumbers.map(item => item.moduleName)
            ).size;
        }
    },

    methods: {
        uuid() {
            if (
                typeof crypto !== 'undefined' &&
                typeof crypto.randomUUID === 'function'
            ) {
                return crypto.randomUUID();
            }

            return `SYS-${Date.now()}-${Math.floor(
                Math.random() * 100000
            )}`;
        },

        // Build the master numbering list.
        buildMasterRows() {
            const moduleById = new Map(
                this.moduleList.map(module => [
                    String(module.Id),
                    module.Name
                ])
            );

            return this.itemNames.map(item => {
                const moduleName =
                    moduleById.get(String(item.moduleId)) || 'Other';

                return {
                    pk: `${moduleName}__${item.Name}`,
                    id: null,
                    moduleName,
                    friendlyName: item.FriendlyName || item.Name,
                    itemName: item.Name,
                    prefix: '',
                    suffix: '',
                    lastNo: 1,
                    tenantId: null,
                    setupStatus: 'Not configured',
                    _isMissing: true
                };
            });
        },

        // Merge the master list with the local mock configurations.
        buildSystemNumbers() {
            const master = this.buildMasterRows();

            const configuredByName = new Map(
                this.initialConfiguredNumbers.map(item => [
                    item.itemName,
                    item
                ])
            );

            return master.map(item => {
                const configured = configuredByName.get(item.itemName);

                if (!configured) {
                    return item;
                }

                return {
                    ...item,
                    ...configured,
                    id: this.uuid(),
                    tenantId: 1,
                    pk: item.pk,
                    setupStatus: 'Configured',
                    _isMissing: false
                };
            }).sort((a, b) => {
                const moduleComparison =
                    a.moduleName.localeCompare(b.moduleName);

                if (moduleComparison !== 0) {
                    return moduleComparison;
                }

                return a.friendlyName.localeCompare(b.friendlyName);
            });
        },

        // Determine whether a record contains a valid configuration.
        isConfigured(record) {
            return Boolean(
                record.prefix?.trim() ||
                record.suffix?.trim() ||
                Number(record.lastNo) > 1
            );
        },

        // Find the master definition for a system number.
        findMasterItem(record) {
            return this.itemNames.find(
                item => item.Name === record.itemName
            );
        },

        // Validate a configuration before saving it locally.
        validateSystemNumber(record) {
            if (!record || !record.itemName) {
                this.toastHandler(
                    'error',
                    'The system number definition is missing.'
                );
                return false;
            }

            if (
                record.lastNo === '' ||
                record.lastNo === null ||
                record.lastNo === undefined ||
                !Number.isInteger(Number(record.lastNo)) ||
                Number(record.lastNo) < 1
            ) {
                this.toastHandler(
                    'warning',
                    'Last Number must be a whole number greater than zero.'
                );
                return false;
            }

            if (
                record.prefix != null &&
                typeof record.prefix !== 'string'
            ) {
                this.toastHandler(
                    'warning',
                    'Prefix must be text.'
                );
                return false;
            }

            if (
                record.suffix != null &&
                typeof record.suffix !== 'string'
            ) {
                this.toastHandler(
                    'warning',
                    'Suffix must be text.'
                );
                return false;
            }

            return true;
        },

        // Handle creation from the reusable grid.
        onCreate(event) {
            const record = event?.row || event?.data;

            if (!record) {
                this.toastHandler(
                    'warning',
                    'Select a system number to configure.'
                );
                return;
            }

            this.saveSystemNumber(record);
        },

        // Handle edits from the reusable grid.
        onUpdate(event) {
            const record = event?.row || event?.data;

            if (!record) {
                this.toastHandler(
                    'warning',
                    'No system number was provided.'
                );
                return;
            }

            this.saveSystemNumber(record);
        },

        // Simulate saving a configuration without an API.
        saveSystemNumber(record) {
            if (this.isLoading) {
                return;
            }

            const index = this.systemNumbers.findIndex(
                item => item.pk === record.pk
            );

            if (index === -1) {
                this.toastHandler(
                    'error',
                    'The selected system number could not be found.'
                );
                return;
            }

            if (!this.validateSystemNumber(record)) {
                return;
            }

            const existing = this.systemNumbers[index];

            const updatedRecord = {
                ...existing,
                ...record,
                id: existing.id || this.uuid(),
                tenantId: existing.tenantId || 1,
                prefix: record.prefix || '',
                suffix: record.suffix || '',
                lastNo: Number(record.lastNo),
                setupStatus: 'Configured',
                _isMissing: false
            };

            this.systemNumbers.splice(index, 1, updatedRecord);

            // Update the in-memory demo configuration.
            const configuredIndex =
                this.initialConfiguredNumbers.findIndex(
                    item => item.itemName === updatedRecord.itemName
                );

            const mockRecord = {
                itemName: updatedRecord.itemName,
                prefix: updatedRecord.prefix,
                suffix: updatedRecord.suffix,
                lastNo: updatedRecord.lastNo
            };

            if (configuredIndex >= 0) {
                this.initialConfiguredNumbers.splice(
                    configuredIndex,
                    1,
                    mockRecord
                );
            } else {
                this.initialConfiguredNumbers.push(mockRecord);
            }

            this.toastHandler(
                'success',
                'System number configuration saved.'
            );

            console.log('MOCK SYSTEM NUMBER SAVE:', updatedRecord);
        },

        // Handle grid delete events.
        async onDelete(event) {
            const rows = Array.isArray(event?.rows)
                ? event.rows
                : event?.row
                    ? [event.row]
                    : event?.data
                        ? Array.isArray(event.data)
                            ? event.data
                            : [event.data]
                        : [];

            if (!rows.length) {
                this.toastHandler(
                    'warning',
                    'No system number was selected.'
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
                title: 'Remove configuration?',
                text: 'The numbering rule will return to its not-configured state.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, remove',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                reverseButtons: true
            });

            if (!result.isConfirmed) {
                return;
            }

            rows.forEach(row => {
                const index = this.systemNumbers.findIndex(
                    item => item.pk === row.pk
                );

                if (index === -1) {
                    return;
                }

                const current = this.systemNumbers[index];

                this.systemNumbers.splice(index, 1, {
                    ...current,
                    id: null,
                    tenantId: null,
                    prefix: '',
                    suffix: '',
                    lastNo: 1,
                    setupStatus: 'Not configured',
                    _isMissing: true
                });

                this.initialConfiguredNumbers =
                    this.initialConfiguredNumbers.filter(
                        item => item.itemName !== current.itemName
                    );
            });

            this.toastHandler(
                'success',
                'System number configuration removed.'
            );
        },

        // Restore the original sample configurations.
        async resetDemoData() {
            if (typeof Swal === 'undefined') {
                this.initialConfiguredNumbers = [
                    {
                        itemName: 'ApInvoiceNumbers',
                        prefix: 'API-',
                        suffix: '',
                        lastNo: 1005
                    },
                    {
                        itemName: 'ApAccountNumbers',
                        prefix: 'SUP-',
                        suffix: '',
                        lastNo: 125
                    },
                    {
                        itemName: 'ArInvoiceNumbers',
                        prefix: 'ARI-',
                        suffix: '',
                        lastNo: 450
                    },
                    {
                        itemName: 'EmployeeID',
                        prefix: 'EMP-',
                        suffix: '',
                        lastNo: 85
                    },
                    {
                        itemName: 'GL',
                        prefix: 'GL-',
                        suffix: '',
                        lastNo: 500
                    },
                    {
                        itemName: 'SM-StudentID',
                        prefix: 'STU-',
                        suffix: '',
                        lastNo: 1200
                    },
                    {
                        itemName: 'SupplierID',
                        prefix: 'SUPP-',
                        suffix: '',
                        lastNo: 90
                    },
                    {
                        itemName: 'JournalBatchNumber',
                        prefix: 'JRN-',
                        suffix: '',
                        lastNo: 200
                    }
                ];

                this.systemNumbers = this.buildSystemNumbers();

                this.toastHandler(
                    'success',
                    'Demo configurations reset.'
                );
                return;
            }

            const result = await Swal.fire({
                title: 'Reset demo data?',
                text: 'All numbering rules will return to their original sample configurations.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, reset',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#0645e7',
                cancelButtonColor: '#64748b',
                reverseButtons: true
            });

            if (!result.isConfirmed) {
                return;
            }

            this.initialConfiguredNumbers = [
                {
                    itemName: 'ApInvoiceNumbers',
                    prefix: 'API-',
                    suffix: '',
                    lastNo: 1005
                },
                {
                    itemName: 'ApAccountNumbers',
                    prefix: 'SUP-',
                    suffix: '',
                    lastNo: 125
                },
                {
                    itemName: 'ArInvoiceNumbers',
                    prefix: 'ARI-',
                    suffix: '',
                    lastNo: 450
                },
                {
                    itemName: 'EmployeeID',
                    prefix: 'EMP-',
                    suffix: '',
                    lastNo: 85
                },
                {
                    itemName: 'GL',
                    prefix: 'GL-',
                    suffix: '',
                    lastNo: 500
                },
                {
                    itemName: 'SM-StudentID',
                    prefix: 'STU-',
                    suffix: '',
                    lastNo: 1200
                },
                {
                    itemName: 'SupplierID',
                    prefix: 'SUPP-',
                    suffix: '',
                    lastNo: 90
                },
                {
                    itemName: 'JournalBatchNumber',
                    prefix: 'JRN-',
                    suffix: '',
                    lastNo: 200
                }
            ];

            this.systemNumbers = this.buildSystemNumbers();

            this.toastHandler(
                'success',
                'Demo configurations reset successfully.'
            );
        },

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
        this.systemNumbers = this.buildSystemNumbers();
    }
});

app.use(DataGridPlugin);
app.mount('#app');
