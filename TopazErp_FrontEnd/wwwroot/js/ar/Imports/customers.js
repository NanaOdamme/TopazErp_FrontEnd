const app = Vue.createApp({
    data() {
        return {
            file: null,
            previewData: [],
            isLoading: false,
            currentPage: 1,
            pageSize: 10,
            // maps normalized header text -> row property
            columnMap: {
                name: 'name',
                customername: 'name',
                accountno: 'accountNumber',
                accountnumber: 'accountNumber',
                email: 'email',
                phone: 'phoneNo',
                phoneno: 'phoneNo',
                address: 'address',
                balance: 'balance',
                currency: 'currencyName',
                currencyname: 'currencyName',
                group: 'customerGroupName',
                customergroup: 'customerGroupName',
                creditlimit: 'creditLimit',
                creditgl: 'creditAccountName',
                debitgl: 'debitAccountName',
                irsgl: 'irsAccountName',
                vatgl: 'vatAccountName',
                vatno: 'vatNumber',
                vatnumber: 'vatNumber',
                status: 'status'
            }
        };
    },
    computed: {
        hasErrors() {
            return this.previewData.some(r => r.errors && r.errors.length > 0);
        },
        paginatedData() {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.previewData.slice(start, start + this.pageSize);
        },
        totalPages() {
            return Math.ceil(this.previewData.length / this.pageSize);
        },
        paginationPages() {
            const total = this.totalPages;
            const current = this.currentPage;
            const delta = 2;
            const range = [];
            const rangeWithDots = [];
            let l;

            for (let i = 1; i <= total; i++) {
                if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
                    range.push(i);
                }
            }
            for (let i of range) {
                if (l) {
                    if (i - l === 2) rangeWithDots.push(l + 1);
                    else if (i - l > 2) rangeWithDots.push('...');
                }
                rangeWithDots.push(i);
                l = i;
            }
            return rangeWithDots;
        },
    },
    methods: {
        async onFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const validExt = /\.(xlsx|xls|csv)$/i;
            if (!validExt.test(file.name)) {
                this.toastHandler('warning', 'Please choose an Excel (.xlsx, .xls) or .csv file.');
                event.target.value = '';
                return;
            }

            this.file = file;
            await this.previewFile();
        },

        async previewFile() {
            if (!this.file) {
                this.toastHandler('warning', 'Please select a file to preview.');
                return;
            }

            this.isLoading = true;
            try {
                const buffer = await this.file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];

                // defval keeps empty cells as '' so every row has every key
                const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });

                if (rawRows.length === 0) {
                    this.previewData = [];
                    this.toastHandler('warning', 'The selected file has no data rows.');
                    return;
                }

                this.previewData = this.validateRows(rawRows.map(this.mapRow));
                this.currentPage = 1;
            } catch (error) {
                console.error(error);
                this.previewData = [];
                this.toastHandler('error', 'Failed to read the file. Make sure it is a valid Excel file.');
            } finally {
                this.isLoading = false;
            }
        },

        normalizeHeader(h) {
            return String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
        },

        toText(v) {
            return v === null || v === undefined ? '' : String(v).trim();
        },

        toNumber(v) {
            if (typeof v === 'number') return v;
            const cleaned = String(v ?? '').replace(/[^0-9.\-]/g, '');
            const n = parseFloat(cleaned);
            return isNaN(n) ? NaN : n;
        },

        mapRow(raw) {
            const row = {
                name: '', accountNumber: '', email: '', phoneNo: '', address: '',
                balance: 0, currencyName: '', customerGroupName: '', creditLimit: 0,
                creditAccountName: '', debitAccountName: '', irsAccountName: '',
                vatAccountName: '', vatNumber: '', status: '', errors: []
            };

            const numericFields = ['balance', 'creditLimit'];

            Object.keys(raw).forEach(header => {
                const prop = this.columnMap[this.normalizeHeader(header)];
                if (!prop) return;

                if (numericFields.includes(prop)) {
                    const raw_ = raw[header];
                    if (raw_ === '' || raw_ === null) {
                        row[prop] = 0;
                    } else {
                        const n = this.toNumber(raw_);
                        if (isNaN(n)) {
                            row.errors.push(`${header} must be a number (found "${raw_}").`);
                            row[prop] = 0;
                        } else {
                            row[prop] = n;
                        }
                    }
                } else {
                    row[prop] = this.toText(raw[header]);
                }
            });

            return row;
        },

        validateRows(rows) {
            const seenAccounts = new Map();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            rows.forEach(row => {
                if (!row.name) row.errors.push('Name is required.');
                if (!row.accountNumber) row.errors.push('Account No is required.');
                if (row.email && !emailRegex.test(row.email)) row.errors.push('Email is not valid.');
                if (!row.currencyName) row.errors.push('Currency is required.');
                if (row.creditLimit < 0) row.errors.push('Credit Limit cannot be negative.');

                if (row.accountNumber) {
                    const key = row.accountNumber.toLowerCase();
                    if (seenAccounts.has(key)) {
                        row.errors.push('Duplicate Account No in file.');
                        seenAccounts.get(key).errors.push('Duplicate Account No in file.');
                    } else {
                        seenAccounts.set(key, row);
                    }
                }
            });

            return rows;
        },

        async importData() {
            if (this.hasErrors || this.previewData.length === 0) return;

            this.isLoading = true;
            try {
                // TODO: replace with your real endpoint
                // await fetch('/Ar/ImportCustomers', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(this.previewData.map(({ errors, ...r }) => r))
                // });
                this.toastHandler('success', `${this.previewData.length} customers imported.`);
            } catch (error) {
                console.error(error);
                this.toastHandler('error', 'Import failed.');
            } finally {
                this.isLoading = false;
            }
        },

        toastHandler(type, message = 'An unexpected error occurred.') {
            if (typeof Swal === 'undefined') {
                console.log(message);
                return;
            }
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                title: message,
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
        },
    },
});
app.mount('#app');

