const app = Vue.createApp({
    data() {
        return {
            file: null,
            previewData: [],
            isLoading: false,
            currentPage: 1,
            pageSize: 10,
            
            // normalized header text -> row property
            columnMap: {
                supplier: 'supplier',
                suppliername: 'supplier',
                transactiondate: 'transactionDate',
                date: 'transactionDate',
                currency: 'currencyName',
                currencyname: 'currencyName',
                rate: 'currencyRate',
                currencyrate: 'currencyRate',
                exchangerate: 'currencyRate',
                amount: 'amount',
                balance: 'amount'
            }
        };
    },
    computed: {
        hasErrors() {
            return this.previewData.some(r => r.errors && r.errors.length > 0);
        },
        pendingRows() {
            return this.previewData.some(row => !row.imported);
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

            if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
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

                // raw: true keeps dates as Excel serial numbers, which parseDate handles
                const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });

                if (rawRows.length === 0) {
                    this.previewData = [];
                    this.toastHandler('warning', 'The selected file has no data rows.');
                    return;
                }

                this.previewData = rawRows.map(this.mapRow);
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
            if (cleaned === '' || cleaned === '-' || cleaned === '.') return NaN;
            return parseFloat(cleaned);
        },

        // Returns 'yyyy-mm-dd' or '' if it can't be understood
        parseDate(v) {
            if (v === '' || v === null || v === undefined) return '';
            const pad = n => String(n).padStart(2, '0');

            // Excel serial number
            if (typeof v === 'number') {
                const d = XLSX.SSF.parse_date_code(v);
                return d ? `${d.y}-${pad(d.m)}-${pad(d.d)}` : '';
            }

            if (v instanceof Date && !isNaN(v)) {
                return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
            }

            const s = String(v).trim();

            // yyyy-mm-dd
            let m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
            if (m) return this.buildDate(+m[1], +m[2], +m[3]);

            // dd/mm/yyyy (day first)
            m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
            if (m) return this.buildDate(+m[3], +m[2], +m[1]);

            return '';
        },

        buildDate(y, mo, d) {
            const dt = new Date(y, mo - 1, d);
            if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return '';
            return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        },

        // Used by the template: 'yyyy-mm-dd' -> '05 Mar 2026'
        formatDate(value) {
            if (!value) return '';
            const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!m) return value;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${m[3]} ${months[+m[2] - 1]} ${m[1]}`;
        },

        mapRow(raw) {
            const row = {
                supplier: '',
                transactionDate: '',
                currencyName: '',
                currencyRate: 0,
                amount: 0,
                imported: false,
                importError: '',
                errors: []
            };

            // Collect the raw values by property first, then validate
            const found = {};
            Object.keys(raw).forEach(header => {
                const prop = this.columnMap[this.normalizeHeader(header)];
                if (prop) found[prop] = { header, value: raw[header] };
            });

            row.supplier = this.toText(found.supplier?.value);
            row.currencyName = this.toText(found.currencyName?.value);

            if (!row.supplier) row.errors.push('Supplier is required.');
            if (!row.currencyName) row.errors.push('Currency is required.');

            // Date
            const rawDate = found.transactionDate?.value;
            if (rawDate === undefined || rawDate === '' || rawDate === null) {
                row.errors.push('Transaction Date is required.');
            } else {
                row.transactionDate = this.parseDate(rawDate);
                if (!row.transactionDate) {
                    row.errors.push(`Transaction Date is not valid (found "${rawDate}"). Use dd/mm/yyyy.`);
                }
            }

            // Rate
            const rawRate = found.currencyRate?.value;
            if (rawRate === undefined || rawRate === '' || rawRate === null) {
                row.errors.push('Rate is required.');
            } else {
                const rate = this.toNumber(rawRate);
                if (isNaN(rate)) row.errors.push(`Rate must be a number (found "${rawRate}").`);
                else if (rate <= 0) row.errors.push('Rate must be greater than zero.');
                else row.currencyRate = rate;
            }

            // Amount
            const rawAmount = found.amount?.value;
            if (rawAmount === undefined || rawAmount === '' || rawAmount === null) {
                row.errors.push('Amount is required.');
            } else {
                const amount = this.toNumber(rawAmount);
                if (isNaN(amount)) row.errors.push(`Amount must be a number (found "${rawAmount}").`);
                else row.amount = amount;
            }

            return row;
        },

        async importData() {
            if (this.hasErrors || !this.pendingRows || this.isLoading) return;

            this.isLoading = true;
            try {
                const [supplierResponse, currencyResponse] = await Promise.all([
                    fetch('/SharedResource/GetSuppliers'),
                    fetch('/SharedResource/GetCurrencys')
                ]);

                if (!supplierResponse.ok || !currencyResponse.ok) {
                    throw new Error('Unable to load suppliers or currencies.');
                }

                const [suppliers, currencies] = await Promise.all([
                    supplierResponse.json(),
                    currencyResponse.json()
                ]);
                const normalizeName = value => this.toText(value).toLocaleLowerCase();
                const supplierByName = new Map(
                    (Array.isArray(suppliers) ? suppliers : [])
                        .filter(supplier => String(supplier.statusName || '').trim().toLowerCase() === 'active')
                        .map(supplier => [normalizeName(supplier.name), supplier])
                );
                const currencyByName = new Map(
                    (Array.isArray(currencies) ? currencies : [])
                        .map(currency => [normalizeName(currency.currencyName), currency])
                );

                let importedCount = 0;
                let failedCount = 0;
                for (const row of this.previewData) {
                    if (row.imported) continue;
                    row.importError = '';

                    const supplier = supplierByName.get(normalizeName(row.supplier));
                    const currency = currencyByName.get(normalizeName(row.currencyName));
                    if (!supplier || !currency) {
                        const missing = [];
                        if (!supplier) missing.push(`active supplier "${row.supplier}"`);
                        if (!currency) missing.push(`currency "${row.currencyName}"`);
                        row.importError = `No matching ${missing.join(' and ')} was found.`;
                        failedCount++;
                        continue;
                    }

                    const payload = {
                        supplierId: supplier.id,
                        supplierName: supplier.name,
                        accountNumber: supplier.accountNumber,
                        currencyId: currency.id,
                        currencyName: currency.currencyName,
                        currencyCode: currency.currencyCode,
                        buyRate: row.currencyRate,
                        sellRate: currency.sellRate ?? row.currencyRate,
                        transactionDate: row.transactionDate,
                        amount: row.amount,
                        isPosted: false,
                        ouId: '00000000-0000-0000-0000-000000000000',
                        ouName: 'N/A'
                    };

                    try {
                        const response = await fetch('/ApDataEntry/CreateOpeningBalances', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        const result = await response.json().catch(() => null);
                        if (!response.ok || !result || result.code !== 200) {
                            throw new Error(result?.message || `Request failed (${response.status}).`);
                        }
                        row.imported = true;
                        importedCount++;
                    } catch (error) {
                        row.importError = error.message || 'Import failed.';
                        failedCount++;
                    }
                }

                if (failedCount > 0) {
                    this.toastHandler('warning', `${importedCount} opening balances imported; ${failedCount} failed. Review the affected rows and retry.`);
                } else {
                    this.toastHandler('success', `${importedCount} opening balances imported.`);
                }
            } catch (error) {
                console.error(error);
                this.toastHandler('error', error.message || 'Unable to import opening balances.');
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
