const app = Vue.createApp({
    data() {
        return {
            theme: '#0645e7',

            statusColumns: [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'number',
                    hidden: true,
                    editable: false,
                    searchable: false
                },
                {
                    key: 'name',
                    label: 'Status',
                    type: 'text',
                    required: true,
                    editable: true,
                    searchable: true,
                    width: '100%'
                }
            ],

            statusList: [
                { id: 1, name: 'Active' },
                { id: 2, name: 'Inactive' },
                { id: 3, name: 'Dormant' }
            ],

            nextId: 4
        };
    },

    methods: {
        toastHandler(type, message) {
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
                timer: 3500,
                timerProgressBar: true
            });
        },

        async confirmAction(title, text, confirmButtonText = 'Yes, continue') {
            if (typeof Swal === 'undefined') {
                return window.confirm(`${title}\n${text}`);
            }

            const result = await Swal.fire({
                title,
                text,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: this.theme,
                cancelButtonColor: '#6b7280',
                confirmButtonText,
                cancelButtonText: 'Cancel',
                reverseButtons: true,
                focusCancel: true
            });

            return result.isConfirmed;
        },

        getStatusName(value) {
            if (typeof value === 'string') {
                return value.trim();
            }

            if (value && typeof value === 'object') {
                return String(value.name ?? '').trim();
            }

            return '';
        },

        validateStatus(name, excludeId = null) {
            if (!name) {
                this.toastHandler('warning', 'Please enter a status name.');
                return false;
            }

            const duplicate = this.statusList.some(status =>
                status.name.toLowerCase() === name.toLowerCase() &&
                status.id !== excludeId
            );

            if (duplicate) {
                this.toastHandler(
                    'warning',
                    'A status with this name already exists.'
                );

                return false;
            }

            return true;
        },

        async onCreate(payload) {
            const name = this.getStatusName(payload);

            if (!this.validateStatus(name)) {
                return;
            }

            const confirmed = await this.confirmAction(
                'Create status?',
                `Are you sure you want to create "${name}"?`,
                'Yes, create'
            );

            if (!confirmed) {
                return;
            }

            this.statusList.push({
                id: this.nextId++,
                name
            });

            this.toastHandler('success', 'Status created successfully.');
        },

        async onUpdate(payload) {
            const id = payload?.id;
            const name = this.getStatusName(payload);

            if (id === undefined || id === null) {
                this.toastHandler('error', 'Unable to identify the status.');
                return;
            }

            const existing = this.statusList.find(status => status.id === id);

            if (!existing) {
                this.toastHandler('error', 'Status not found.');
                return;
            }

            if (!this.validateStatus(name, id)) {
                return;
            }

            const confirmed = await this.confirmAction(
                'Update status?',
                `Save the changes to "${name}"?`,
                'Yes, update'
            );

            if (!confirmed) {
                return;
            }

            existing.name = name;

            this.toastHandler('success', 'Status updated successfully.');
        },

        async onDelete(payload) {
            const id = typeof payload === 'object'
                ? payload?.id
                : payload;

            const status = this.statusList.find(item => item.id === id);

            if (!status) {
                this.toastHandler('error', 'Status not found.');
                return;
            }

            const confirmed = await this.confirmAction(
                'Delete status?',
                `Are you sure you want to delete "${status.name}"? This action cannot be undone.`,
                'Yes, delete'
            );

            if (!confirmed) {
                return;
            }

            this.statusList = this.statusList.filter(
                item => item.id !== id
            );

            this.toastHandler('success', 'Status deleted successfully.');
        }
    }
});

app.use(DataGridPlugin);
app.mount('#app');