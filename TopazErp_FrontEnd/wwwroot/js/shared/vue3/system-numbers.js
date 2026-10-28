    const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',
            isLoading: false,
            isShimmerLoading: false,
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
                    key: 'itemName',
                    label: 'Module',
                    type: 'text',
                    searchable: true,
                    editable: false,
                    width: 180
                },
                {
                    key: 'key',
                    label: 'Key',
                    type: 'text',
                    searchable: false,
                    editable: false,
                    hidden: true,
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
                    key: 'formatPattern',
                    label: 'Format Pattern',
                    type: 'text',
                    editable: true,
                    width: 150
                },
                {
                    key: 'padding',
                    label: 'Padding',
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
                    key: 'tenantId',
                    label: 'Tenant',
                    hidden: true
                }
            ],
            systemNumberList: [],

        };
    },

    computed: {
        
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
        
        getSystemNumbers() {
            
            this.isShimmerLoading = true;
            
            axios.get('/SharedResource/GetSystemNumbers')
                .then(response => {
                    this.systemNumberList = response.data.result;
                })
                .catch(error => {
                    console.error('Failed to load system numbers:', error);
                    this.toastHandler('error', 'Unable to load system numbers.');
                })
                .finally(() => {
                    this.isShimmerLoading = false;
                });
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

        // Handle edits from the reusable grid.
        async onUpdate(event) {
            const record = event?.row || event?.data;

            if (!record) {
                this.toastHandler(
                    'warning',
                    'No system number was provided.'
                );
                return;
            }

            if (!this.validateSystemNumber(record)) return;

            // Find the original row so we preserve server-owned fields
            // (id, pk, tenantId, key, itemName, etc.)
            const existing = this.systemNumberList.find(
                s => String(s.id) === String(record.id)
            );

            if (!existing) {
                this.toastHandler('error', 'System number record not found.');
                return;
            }

            const payload = {
                ...existing,
                prefix:        record.prefix        != null ? String(record.prefix).trim()        : existing.prefix,
                suffix:        record.suffix        != null ? String(record.suffix).trim()        : existing.suffix,
                formatPattern: record.formatPattern != null ? String(record.formatPattern).trim() : existing.formatPattern,
                padding:       record.padding       != null ? Number(record.padding)              : existing.padding,
                lastNo:        Number(record.lastNo)
            };

            this.isShimmerLoading = true;
            try {
                await axios.post('/SharedResource/UpdateSystemNumber', payload);

                // Optimistically patch the local list
                const idx = this.systemNumberList.findIndex(
                    s => String(s.id) === String(existing.id)
                );
                if (idx !== -1) {
                    this.systemNumberList.splice(idx, 1, { ...payload });
                }

                this.toastHandler('success', `"${existing.itemName}" updated successfully.`);
            } catch (err) {
                console.error('UpdateSystemNumber failed:', err);
                this.toastHandler('error', 'Failed to update system number. Please try again.');
                // Re-sync from server on failure to avoid stale data
                await this.getSystemNumbers();
            } finally {
                this.isShimmerLoading = false;
            }
        },

        // Restore the original sample configurations.
        
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
        this.getSystemNumbers();
    }
});

app.use(DataGridPlugin);
app.mount('#app');
