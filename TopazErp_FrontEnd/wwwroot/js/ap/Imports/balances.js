const API_URLS = {
    suppliers: '/SharedResource/GetSuppliers',
    currencies: '/SharedResource/GetCurrencies',
    existingBalances: '/Ap/GetApBalancesReport?status=all',
    createOpeningBalance: '/Ap//CreateOpeningBalance'
};

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

const app = Vue.createApp({
    data() {
        return {
            file: null,
            previewData: [],
            isLoading: false,
            currentPage: 1,
            pageSize: 10,

            // Normalized Excel header -> preview row property
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
            return this.previewData.some(
                row => row.errors && row.errors.length > 0
            );
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
            let last;

            for (let i = 1; i <= total; i++) {
                if (
                    i === 1 ||
                    i === total ||
                    (i >= current - delta && i <= current + delta)
                ) {
                    range.push(i);
                }
            }

            for (const page of range) {
                if (last) {
                    if (page - last === 2) {
                        rangeWithDots.push(last + 1);
                    } else if (page - last > 2) {
                        rangeWithDots.push('...');
                    }
                }

                rangeWithDots.push(page);
                last = page;
            }

            return rangeWithDots;
        }
    },

    methods: {
        async onFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
                this.toastHandler(
                    'warning',
                    'Please choose an Excel (.xlsx, .xls) or .csv file.'
                );
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

                // raw: true keeps Excel dates as serial numbers for parseDate().
                const rawRows = XLSX.utils.sheet_to_json(sheet, {
                    defval: '',
                    raw: true
                });

                if (rawRows.length === 0) {
                    this.previewData = [];
                    this.toastHandler(
                        'warning',
                        'The selected file has no data rows.'
                    );
                    return;
                }

                // Use an arrow so mapRow keeps the Vue component as `this`.
                this.previewData = rawRows.map(raw => this.mapRow(raw));
                this.currentPage = 1;
            } catch (error) {
                console.error(error);
                this.previewData = [];
                this.toastHandler(
                    'error',
                    'Failed to read the file. Make sure it is a valid Excel file.'
                );
            } finally {
                this.isLoading = false;
            }
        },

        normalizeHeader(value) {
            return String(value ?? '')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');
        },

        toText(value) {
            return value === null || value === undefined
                ? ''
                : String(value).trim();
        },

        toNumber(value) {
            if (typeof value === 'number') return value;

            const cleaned = String(value ?? '').replace(/[^0-9.\-]/g, '');
            if (cleaned === '' || cleaned === '-' || cleaned === '.') {
                return NaN;
            }

            return parseFloat(cleaned);
        },

        unwrapList(raw) {
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;

            for (const key of [
                'result',
                'items',
                'data',
                'suppliers',
                'currencies',
                'balances',
                'openingBalances',
                'apOpeningBalances'
            ]) {
                if (Array.isArray(raw[key])) return raw[key];
            }

            if (raw.result && typeof raw.result === 'object') {
                return this.unwrapList(raw.result);
            }

            if (raw.data && typeof raw.data === 'object') {
                return this.unwrapList(raw.data);
            }

            return [];
        },

        async fetchList(url) {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Request failed (${response.status}) for ${url}`);
            }

            const data = await response.json();
            return this.unwrapList(data);
        },

        getField(item, name) {
            if (!item) return undefined;

            const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
            return item[name] ?? item[pascalName];
        },

        normalizeName(value) {
            return this.toText(value).toLocaleLowerCase();
        },

        makeBalanceKey(supplierId, currencyId) {
            if (!supplierId || !currencyId) return '';

            return `${String(supplierId).toLowerCase()}|${String(currencyId).toLowerCase()}`;
        },

        // Returns YYYY-MM-DD or '' when the value cannot be parsed.
        parseDate(value) {
            if (value === '' || value === null || value === undefined) {
                return '';
            }

            const pad = number => String(number).padStart(2, '0');

            // Excel serial date.
            if (typeof value === 'number') {
                const date = XLSX.SSF.parse_date_code(value);

                return date
                    ? `${date.y}-${pad(date.m)}-${pad(date.d)}`
                    : '';
            }

            if (value instanceof Date && !Number.isNaN(value.getTime())) {
                return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
            }

            const text = String(value).trim();

            // YYYY-MM-DD or YYYY/MM/DD.
            let match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
            if (match) {
                return this.buildDate(
                    Number(match[1]),
                    Number(match[2]),
                    Number(match[3])
                );
            }

            // DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY.
            match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
            if (match) {
                return this.buildDate(
                    Number(match[3]),
                    Number(match[2]),
                    Number(match[1])
                );
            }

            return '';
        },

        buildDate(year, month, day) {
            const date = new Date(year, month - 1, day);

            if (
                date.getFullYear() !== year ||
                date.getMonth() !== month - 1 ||
                date.getDate() !== day
            ) {
                return '';
            }

            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        },

        // Used by the template: YYYY-MM-DD -> 05 Mar 2026.
        formatDate(value) {
            if (!value) return '';

            const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return value;

            const months = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];

            return `${match[3]} ${months[Number(match[2]) - 1]} ${match[1]}`;
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

            const found = {};

            Object.keys(raw).forEach(header => {
                const property = this.columnMap[this.normalizeHeader(header)];

                if (property) {
                    found[property] = {
                        header,
                        value: raw[header]
                    };
                }
            });

            row.supplier = this.toText(found.supplier?.value);
            row.currencyName = this.toText(found.currencyName?.value);

            if (!row.supplier) {
                row.errors.push('Supplier is required.');
            }

            if (!row.currencyName) {
                row.errors.push('Currency is required.');
            }

            const rawDate = found.transactionDate?.value;

            if (rawDate === undefined || rawDate === '' || rawDate === null) {
                row.errors.push('Transaction Date is required.');
            } else {
                row.transactionDate = this.parseDate(rawDate);

                if (!row.transactionDate) {
                    row.errors.push(
                        `Transaction Date is not valid (found "${rawDate}"). Use dd/mm/yyyy.`
                    );
                }
            }

            const rawRate = found.currencyRate?.value;

            if (rawRate === undefined || rawRate === '' || rawRate === null) {
                row.errors.push('Rate is required.');
            } else {
                const rate = this.toNumber(rawRate);

                if (Number.isNaN(rate)) {
                    row.errors.push(`Rate must be a number (found "${rawRate}").`);
                } else if (rate <= 0) {
                    row.errors.push('Rate must be greater than zero.');
                } else {
                    row.currencyRate = rate;
                }
            }

            const rawAmount = found.amount?.value;

            if (rawAmount === undefined || rawAmount === '' || rawAmount === null) {
                row.errors.push('Amount is required.');
            } else {
                const amount = this.toNumber(rawAmount);

                if (Number.isNaN(amount)) {
                    row.errors.push(
                        `Amount must be a number (found "${rawAmount}").`
                    );
                } else {
                    row.amount = amount;
                }
            }

            return row;
        },

        async importData() {
            if (this.isLoading) return;

            if (this.previewData.length === 0 || !this.pendingRows) {
                this.toastHandler(
                    'warning',
                    'There are no pending opening balances to import.'
                );
                return;
            }

            if (this.hasErrors) {
                this.toastHandler(
                    'warning',
                    'Fix the preview errors before importing.'
                );
                return;
            }

            this.isLoading = true;

            try {
                // Fetch fresh data before checking duplicates.
                const [suppliers, currencies, existingBalances] =
                    await Promise.all([
                        this.fetchList(API_URLS.suppliers),
                        this.fetchList(API_URLS.currencies),
                        this.fetchList(API_URLS.existingBalances)
                    ]);

                const supplierByName = new Map();

                suppliers.forEach(supplier => {
                    const status = this.normalizeName(
                        this.getField(supplier, 'statusName') ||
                        this.getField(supplier, 'status')
                    );

                    // Only active suppliers may receive an opening balance.
                    if (status !== 'active') return;

                    const name = this.normalizeName(
                        this.getField(supplier, 'name')
                    );

                    if (name) supplierByName.set(name, supplier);
                });

                const currencyByName = new Map();

                currencies.forEach(currency => {
                    const name = this.normalizeName(
                        this.getField(currency, 'currencyName')
                    );

                    if (name) currencyByName.set(name, currency);
                });

                const existingKeys = new Set();

                existingBalances.forEach(balance => {
                    const supplierId = this.getField(balance, 'supplierId');
                    const currencyId = this.getField(balance, 'currencyId');
                    const key = this.makeBalanceKey(supplierId, currencyId);

                    if (key) existingKeys.add(key);
                });

                // Resolve each preview row to supplier and currency IDs.
                const preparedRows = this.previewData.map(row => {
                    if (row.imported) {
                        return {
                            row,
                            supplier: null,
                            currency: null,
                            key: ''
                        };
                    }

                    row.importError = '';

                    const supplier = supplierByName.get(
                        this.normalizeName(row.supplier)
                    );

                    const currency = currencyByName.get(
                        this.normalizeName(row.currencyName)
                    );

                    if (!supplier || !currency) {
                        const missing = [];

                        if (!supplier) {
                            missing.push(`active supplier "${row.supplier}"`);
                        }

                        if (!currency) {
                            missing.push(`currency "${row.currencyName}"`);
                        }

                        row.importError =
                            `No matching ${missing.join(' and ')} was found.`;
                    }

                    const supplierId = this.getField(supplier, 'id');
                    const currencyId = this.getField(currency, 'id');

                    if (
                        supplier &&
                        currency &&
                        (!supplierId || !currencyId)
                    ) {
                        row.importError =
                            'The matched supplier or currency is missing its ID.';
                    }

                    return {
                        row,
                        supplier,
                        currency,
                        key: this.makeBalanceKey(supplierId, currencyId)
                    };
                });

                // Find duplicate supplier + currency pairs inside the preview.
                const previewGroups = new Map();

                preparedRows.forEach(item => {
                    if (!item.key) return;

                    if (!previewGroups.has(item.key)) {
                        previewGroups.set(item.key, []);
                    }

                    previewGroups.get(item.key).push(item);
                });

                previewGroups.forEach(group => {
                    if (group.length < 2) return;

                    const description =
                        `Duplicate supplier and currency in the uploaded file: ` +
                        `"${group[0].row.supplier}" / "${group[0].row.currencyName}".`;

                    group.forEach(item => {
                        if (!item.row.imported) {
                            item.row.importError = item.row.importError
                                ? `${item.row.importError} ${description}`
                                : description;
                        }
                    });
                });

                // Check each pending row against balances already in the system.
                preparedRows.forEach(item => {
                    if (item.row.imported || !item.key) return;
                    if (!existingKeys.has(item.key)) return;

                    const description =
                        `An opening balance already exists for ` +
                        `"${item.row.supplier}" in "${item.row.currencyName}".`;

                    item.row.importError = item.row.importError
                        ? `${item.row.importError} ${description}`
                        : description;
                });

                let importedCount = 0;
                let failedCount = 0;

                for (const item of preparedRows) {
                    const { row, supplier, currency, key } = item;

                    if (row.imported) continue;

                    if (row.importError || !supplier || !currency || !key) {
                        failedCount++;
                        continue;
                    }

                    const payload = {
                        supplierId: this.getField(supplier, 'id'),
                        supplierName: this.getField(supplier, 'name'),
                        accountNumber: this.getField(supplier, 'accountNumber'),

                        currencyId: this.getField(currency, 'id'),
                        currencyName: this.getField(currency, 'currencyName'),
                        currencyCode: this.getField(currency, 'currencyCode'),

                        buyRate: row.currencyRate,
                        sellRate:
                            this.getField(currency, 'sellRate') ??
                            row.currencyRate,

                        transactionDate: row.transactionDate,
                        amount: row.amount,

                        ouId: EMPTY_GUID,
                        ouName: 'N/A',
                        isPosted: false
                    };

                    try {
                        const response = await fetch(
                            API_URLS.createOpeningBalance,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(payload)
                            }
                        );

                        const result = await response.json().catch(() => null);

                        const apiRejected =
                            result?.success === false ||
                            (
                                result?.code !== undefined &&
                                result.code !== 200
                            );

                        if (!response.ok || apiRejected) {
                            throw new Error(
                                result?.error?.message ||
                                result?.message ||
                                `Request failed (${response.status}).`
                            );
                        }

                        row.imported = true;
                        row.importError = '';
                        importedCount++;

                        // Prevent another row from creating this pair during this run.
                        existingKeys.add(key);
                    } catch (error) {
                        row.importError = error.message || 'Import failed.';
                        failedCount++;
                    }
                }

                if (failedCount > 0) {
                    this.toastHandler(
                        'warning',
                        `${importedCount} opening balances imported; ${failedCount} failed. Review the affected rows.`
                    );
                } else {
                    this.toastHandler(
                        'success',
                        `${importedCount} opening balances imported.`
                    );
                }
            } catch (error) {
                console.error('Opening balance import error:', error);

                this.toastHandler(
                    'error',
                    error.message || 'Unable to import opening balances.'
                );
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
                icon:
                    type === 'error'
                        ? 'error'
                        : type === 'warning'
                            ? 'warning'
                            : 'success',
                title: message,
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
        }
    }
});

app.mount('#app');