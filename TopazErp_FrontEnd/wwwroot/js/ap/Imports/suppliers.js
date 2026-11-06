const LOOKUP_URLS = {
    currencies: '/SharedResource/GetCurrencies',
    accounts: '/Ap/InitJournalEntry',
    supplierGroups: '/SharedResource/GetSupplierGroups',
    createSupplier: '/SharedResource/CreateSupplier'
};

const app = Vue.createApp({
    data() {
        return {
            emptyGuid: '00000000-0000-0000-0000-000000000000',

            file: null,
            previewData: [],
            isLoading: false,
            lookupsReady: false,

            currencies: [],
            accounts: [],
            supplierGroups: [],

            currentPage: 1,
            pageSize: 10,

            // Keep the existing mappings and add the missing contact/tax fields.
            columnMap: {
                name: 'name',
                suppliername: 'name',
                accountno: 'accountNumber',
                accountnumber: 'accountNumber',
                email: 'email',
                phone: 'phoneNo',
                phoneno: 'phoneNo',
                address: 'address',
                balance: 'balance',
                currency: 'currencyName',
                currencyname: 'currencyName',
                group: 'supplierGroupName',
                suppliergroup: 'supplierGroupName',
                creditlimit: 'creditLimit',
                creditgl: 'creditAccountName',
                debitgl: 'debitAccountName',
                irsgl: 'irsAccountName',
                vatgl: 'vatAccountName',
                vatno: 'vatNumber',
                vatnumber: 'vatNumber',
                status: 'status',
                contactperson: 'contactPerson',
                contactpersonphoneno: 'contactPersonPhoneNo',
                contactpersonemail: 'contactPersonEmail',
                taxoffice: 'taxOffice'
            }
        };
    },

    computed: {
        hasErrors() {
            return this.previewData.some(
                row => row.errors && row.errors.length > 0
            );
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
        async loadLookups() {
            this.isLoading = true;

            try {
                const [
                    currencyResponse,
                    accountResponse,
                    groupResponse
                ] = await Promise.all([
                    axios.get(LOOKUP_URLS.currencies),
                    axios.get(LOOKUP_URLS.accounts),
                    axios.get(LOOKUP_URLS.supplierGroups)
                ]);

                this.currencies = this.unwrapList(currencyResponse.data);
                this.accounts = this.unwrapList(accountResponse.data);
                this.supplierGroups = this.unwrapList(groupResponse.data);

                this.lookupsReady = true;
            } catch (error) {
                console.error('Lookup loading error:', error);
                this.lookupsReady = false;

                this.toastHandler(
                    'error',
                    'Unable to load currencies, accounts, or supplier groups.'
                );
            } finally {
                this.isLoading = false;
            }
        },

        unwrapList(raw) {
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;

            for (const key of [
                'result',
                'items',
                'data',
                'accounts',
                'currencies',
                'supplierGroups'
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

        async onFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const validExt = /\.(xlsx|xls|csv)$/i;

            if (!validExt.test(file.name)) {
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

                this.previewData = this.validateRows(
                    rawRows.map(row => this.mapRow(row))
                );
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
            const number = parseFloat(cleaned);

            return Number.isNaN(number) ? NaN : number;
        },

        mapRow(raw) {
            const row = {
                name: '',
                accountNumber: '',
                email: '',
                phoneNo: '',
                address: '',
                balance: 0,
                currencyName: '',
                supplierGroupName: '',
                creditLimit: 0,
                creditAccountName: '',
                debitAccountName: '',
                irsAccountName: '',
                vatAccountName: '',
                vatNumber: '',
                status: '',
                contactPerson: '',
                contactPersonPhoneNo: '',
                contactPersonEmail: '',
                taxOffice: '',
                errors: []
            };

            const numericFields = ['balance', 'creditLimit'];

            Object.keys(raw).forEach(header => {
                const prop = this.columnMap[this.normalizeHeader(header)];
                if (!prop) return;

                if (numericFields.includes(prop)) {
                    const rawValue = raw[header];

                    if (rawValue === '' || rawValue === null) {
                        row[prop] = 0;
                    } else {
                        const number = this.toNumber(rawValue);

                        if (Number.isNaN(number)) {
                            row.errors.push(
                                `${header} must be a number (found "${rawValue}").`
                            );
                            row[prop] = 0;
                        } else {
                            row[prop] = number;
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
                if (!row.accountNumber) {
                    row.errors.push('Account No is required.');
                }
                if (!row.currencyName) {
                    row.errors.push('Currency is required.');
                }
                if (!row.supplierGroupName) {
                    row.errors.push('Supplier Group is required.');
                }
                if (row.email && !emailRegex.test(row.email)) {
                    row.errors.push('Email is not valid.');
                }
                if (
                    row.contactPersonEmail &&
                    !emailRegex.test(row.contactPersonEmail)
                ) {
                    row.errors.push('Contact Person Email is not valid.');
                }
                if (row.creditLimit < 0) {
                    row.errors.push('Credit Limit cannot be negative.');
                }

                if (row.accountNumber) {
                    const key = row.accountNumber.toLowerCase();

                    if (seenAccounts.has(key)) {
                        row.errors.push('Duplicate Account No in file.');
                        seenAccounts.get(key).errors.push(
                            'Duplicate Account No in file.'
                        );
                    } else {
                        seenAccounts.set(key, row);
                    }
                }
            });

            return rows;
        },

        findByName(list, value, nameKeys) {
            const target = this.normalizeHeader(value);
            if (!target) return null;

            return list.find(item =>
                nameKeys.some(key =>
                    this.normalizeHeader(item?.[key]) === target
                )
            ) || null;
        },

        lookupId(item) {
            return item?.id || item?.Id || '';
        },

        buildSupplierPayload(row) {
            const errors = [];

            const currency = this.findByName(
                this.currencies,
                row.currencyName,
                ['currencyName', 'name', 'currencyCode']
            );

            const supplierGroup = this.findByName(
                this.supplierGroups,
                row.supplierGroupName,
                ['supplierGroupName', 'groupName', 'name']
            );

            const findAccount = (excelValue, label) => {
                if (!excelValue) return null;

                const target = this.normalizeHeader(excelValue);

                const account = this.accounts.find(item => {
                    const combinedName =
                        `${item.accountNo ?? ''} - ${item.accountName ?? ''}`;

                    return [
                        combinedName,
                        item.accountName,
                        item.accountNo
                    ].some(value => this.normalizeHeader(value) === target);
                });

                if (!account || !this.lookupId(account)) {
                    errors.push(`${label} "${excelValue}" was not found.`);
                    return null;
                }

                return account;
            };

            const accountDisplayName = account => {
                if (!account) return '';

                const accountNo = account.accountNo;
                const accountName = account.accountName || '';

                return accountNo !== null && accountNo !== undefined && accountName
                    ? `${accountNo} - ${accountName}`
                    : accountName;
            };

            const creditAccount = findAccount(
                row.creditAccountName,
                'Credit account'
            );
            const debitAccount = findAccount(
                row.debitAccountName,
                'Debit account'
            );
            const irsAccount = findAccount(
                row.irsAccountName,
                'IRS account'
            );
            const vatAccount = findAccount(
                row.vatAccountName,
                'VAT account'
            );

            if (!currency || !this.lookupId(currency)) {
                errors.push(`Currency "${row.currencyName}" was not found.`);
            }

            if (!supplierGroup || !this.lookupId(supplierGroup)) {
                errors.push(
                    `Supplier group "${row.supplierGroupName}" was not found.`
                );
            }

            if (errors.length > 0) {
                return { payload: null, errors };
            }

            const accountName = (account, fallback) =>
                account
                    ? account.accountName ||
                    account.name ||
                    account.accountIdentifier ||
                    fallback
                    : '';

            return {
                payload: {
                    accountNumber: row.accountNumber,

                    supplierGroupId: this.lookupId(supplierGroup),
                    supplierGroupName:
                        supplierGroup.supplierGroupName ||
                        supplierGroup.groupName ||
                        supplierGroup.name,

                    statusId: row.status,
                    statusName: row.status,
                    balance: row.balance,

                    creditAccountId: this.lookupId(creditAccount) || this.emptyGuid,
                    creditAccountName: accountDisplayName(creditAccount),

                    debitAccountId: this.lookupId(debitAccount) || this.emptyGuid,
                    debitAccountName: accountDisplayName(debitAccount),

                    irsAccountId: this.lookupId(irsAccount) || this.emptyGuid,
                    irsAccountName: accountDisplayName(irsAccount),

                    vatAccountId: this.lookupId(vatAccount) || this.emptyGuid,
                    vatAccountName: accountDisplayName(vatAccount),
                

                    tinNumber: '',
                    name: row.name,
                    email: row.email,
                    phoneNo: row.phoneNo,
                    address: row.address,
                    contactPerson: row.contactPerson,
                    contactPersonPhone: row.contactPersonPhoneNo,
                    contactPersonEmail: row.contactPersonEmail,
                    vatNumber: row.vatNumber,

                    currencyId: this.lookupId(currency),
                    currencyName:
                        currency.currencyName || currency.name || row.currencyName,
                    currencyCode: currency.currencyCode || '',
                    buyingRate: currency.buyingRate ?? currency.buyRate ?? 0,
                    sellingRate: currency.sellingRate ?? currency.sellRate ?? 0,

                    creditLimit: row.creditLimit,
                    isResident: false,
                    taxOffice: row.taxOffice
                },
                errors: []
            };
        },

        async importData() {
            if (this.previewData.length === 0) {
                this.toastHandler('warning', 'There are no suppliers to import.');
                return;
            }

            if (!this.lookupsReady) {
                this.toastHandler(
                    'warning',
                    'Wait for the currency, account, and supplier group lookups to load.'
                );
                return;
            }

            // Clear lookup errors from a previous import attempt.
            this.previewData.forEach(row => {
                row.errors = (row.errors || []).filter(
                    error => !error.startsWith('Lookup:')
                );
            });

            const preparedRows = this.previewData.map(row => {
                const result = this.buildSupplierPayload(row);

                row.errors.push(
                    ...result.errors.map(error => `Lookup: ${error}`)
                );

                return result.payload;
            });

            if (this.hasErrors) {
                this.toastHandler(
                    'warning',
                    'Fix the preview errors before importing.'
                );
                return;
            }

            this.isLoading = true;

            try {
                for (const payload of preparedRows) {
                    const response = await axios.post(
                        LOOKUP_URLS.createSupplier,
                        payload
                    );

                    if (response.data?.success === false) {
                        throw new Error(
                            response.data.message || 'Supplier creation failed.'
                        );
                    }
                }

                const importedCount = preparedRows.length;
                this.previewData = [];
                this.currentPage = 1;
                this.file = null;

                this.toastHandler(
                    'success',
                    `${importedCount} suppliers imported.`
                );
            } catch (error) {
                console.error('Supplier import error:', error);

                this.toastHandler(
                    'error',
                    error.response?.data?.message ||
                    error.message ||
                    'Import failed.'
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
    },

    async mounted() {
        await this.loadLookups();
    }
});

app.mount('#app');