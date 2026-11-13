(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const ENDPOINTS = {
        customers: '/SharedResource/GetCustomers',
        customerGroups: '/SharedResource/GetCustomerGroups',
        currencies: '/SharedResource/GetCurrencies',
        accounts: '/Ap/InitJournalEntry',
        defaultGlSetup: '/Ap/GetDefaultGlSetup',
        systemNumbers: '/SharedResource/GetSystemNumbers',
        updateSystemNumber: '/SharedResource/UpdateSystemNumber',
        createCustomer: '/SharedResource/CreateCustomer',
        updateCustomer: '/SharedResource/UpdateCustomer',
        deleteCustomer: '/SharedResource/DelCustomer'
    };

    const pad = (n) => String(n).padStart(2, '0');

    const isoDate = (date) => {
        if (date === null || date === undefined || date === '') return '';
        if (typeof date === 'string') {
            const raw = date.trim();
            if (!raw) return '';
            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
            const ms = /\/Date\((-?\d+)/.exec(raw);
            if (ms) {
                const d = new Date(Number(ms[1]));
                return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }
            const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(raw);
            if (dmy) return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
            const ymd = /^(\d{4})[/](\d{1,2})[/](\d{1,2})/.exec(raw);
            if (ymd) return `${ymd[1]}-${pad(ymd[2])}-${pad(ymd[3])}`;
        }
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };

    const sameId = (a, b) =>
        a !== null && a !== undefined && b !== null && b !== undefined &&
        String(a).toLowerCase() === String(b).toLowerCase();

    const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

    const unwrapList = (raw, preferredKey) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw.result !== undefined) return unwrapList(raw.result, preferredKey);
        if (preferredKey && Array.isArray(raw[preferredKey])) return raw[preferredKey];
        if (Array.isArray(raw.items)) return raw.items;
        if (Array.isArray(raw.result)) return raw.result;
        if (typeof raw === 'object') {
            const firstArr = Object.values(raw).find((v) => Array.isArray(v));
            if (firstArr) return firstArr;
        }
        return asList(raw);
    };

    const asText = (value) => (value === null || value === undefined ? '' : String(value));

    const asNumber = (value, fallback = 0) => {
        const cleaned = typeof value === 'string' ? value.replace(/,/g, '').trim() : value;
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : fallback;
    };

    // Rounds to 2dp so `balance` comparisons are not tripped by float noise.
    const money = (value) => Math.round(asNumber(value) * 100) / 100;

    const CUSTOMER_TEXT_FIELDS = [
        'accountNumber', 'name', 'address', 'tinNumber', 'vatNumber', 'phoneNo',
        'email', 'taxOffice', 'contactPerson', 'contactPersonPhone',
        'contactPersonEmail', 'customerGroupName', 'currencyName', 'currencyCode',
        'debitAccountName', 'creditAccountName', 'vatAccountName', 'irsAccountName', 'status'
    ];

    const CUSTOMER_NUMBER_FIELDS = ['balance', 'creditLimit', 'buyingRate', 'sellingRate'];

    const createEmptyForm = () => ({
        accountNumber: '',
        name: '',
        customerGroupId: '',
        statusId: '',
        address: '',
        tinNumber: '',
        vatNumber: '',
        phoneNo: '',
        currencyId: '',
        balance: '0.00',
        creditLimit: '0.00',
        taxOffice: '',
        email: '',
        debitAccountId: '',
        creditAccountId: '',
        vatAccountId: '',
        irsAccountId: '',
        isResident: false,
        contactPerson: '',
        contactPersonPhone: '',
        contactPersonEmail: ''
    });

    const app = Vue.createApp({
        data() {
            return {
                theme: '#0645e7',
                emptyGuid: EMPTY_GUID,

                isLoading: false,
                isShimmerLoading: false,
                isSettingCustomer: false,
                payload: {},

                customers: [],
                customerGroups: [],
                currencies: [],
                accounts: [],

                statusList: [
                    { id: 'a3b4c2f9-8e4d-4e79-b6b9-2d8c6b80b5fc', name: 'Active' },
                    { id: '6d1d2b1e-6c5e-4f31-9c3d-945d7f6e2a34', name: 'Inactive' },
                    { id: 'f28e71d1-63c9-4070-b7cb-2e5ce2cbe4a1', name: 'Dormant' }
                ],

                customerId: '',
                loadedCustomerId: '',
                tenantId: null,

                defaultCurrencyId: '',
                defaultStatusId: '',
                defaultGlSetup: null,
                currentSystemNumber: null,
                isLoadingAccountNo: false,
                form: createEmptyForm()
            };
        },

        computed: {
            isEditing() {
                return Boolean(this.customerId);
            },
            customerColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, width: 80, help: 'Unique customer identifier.' },
                    { key: 'accountNumber', label: 'Account #', type: 'text', width: 140, required: true, searchable: true },
                    { key: 'name', label: 'Customer', type: 'avatar', width: 240, minWidth: 200, required: true, searchable: true, subtitleKey: 'email' },
                    { key: 'customerGroupName', label: 'Group', type: 'text', width: 160, searchable: true },
                    { key: 'phoneNo', label: 'Phone', type: 'text', width: 140, searchable: true },
                    { key: 'email', label: 'Email', type: 'email', width: 200, searchable: true },
                    { key: 'currencyCode', label: 'Currency', type: 'text', width: 100, searchable: true },
                    { key: 'balance', label: 'Balance', type: 'number', width: 130, decimals: 2 },
                    { key: 'creditLimit', label: 'Credit Limit', type: 'number', width: 130, decimals: 2 },
                    { key: 'statusName', label: 'Status', type: 'text', width: 110, searchable: true },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, width: 100 }
                ];
            }
        },

        methods: {
            scrollToAdd() {
                this.$nextTick(() => {
                    const element = document.querySelector('#add');
                    if (!element) {
                        console.error('Cannot find #add. Check where the div is rendered.');
                        return;
                    }
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            },

            // ================================================================
            // DATA LOADING
            // ================================================================
            async fetchList(url, label, preferredKey = null) {
                try {
                    const response = await axios.get(url);
                    return unwrapList(response.data, preferredKey);
                } catch (error) {
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },

            getCustomerGroupName(customer) {
                const group = this.customerGroups.find((item) => sameId(item.id, customer.customerGroupId));
                return customer.customerGroupName || group?.name || 'Not assigned';
            },

            getStatusName(customer) {
                const status = this.statusList.find((item) => sameId(item.id, customer.statusId));
                return customer.statusName || customer.status || status?.name || 'Unknown';
            },

            getCurrencyName(customer) {
                const currency = this.currencies.find((item) => sameId(item.id, customer.currencyId));
                return customer.currencyCode || currency?.currencyCode || customer.currencyName || '';
            },

            enrichCustomer(customer) {
                return {
                    ...customer,
                    customerGroupName: this.getCustomerGroupName(customer),
                    statusName: this.getStatusName(customer),
                    currencyCode: this.getCurrencyName(customer),
                    displayName: `${customer.name ?? ''} - ${customer.accountNumber ?? ''}`,
                    balance: money(customer.balance),
                    creditLimit: money(customer.creditLimit)
                };
            },

            async getCustomers() {
                this.isShimmerLoading = true;
                try {
                    const list = await this.fetchList(ENDPOINTS.customers, 'customers');
                    this.customers = list
                        .map((item) => this.enrichCustomer(item))
                        .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
                } finally {
                    this.isShimmerLoading = false;
                }
                return this.customers;
            },

            async getCustomerGroups() {
                this.customerGroups = await this.fetchList(ENDPOINTS.customerGroups, 'customer groups');
                return this.customerGroups;
            },

            async getCurrencies() {
                this.currencies = await this.fetchList(ENDPOINTS.currencies, 'currencies');

                const defaultCurrency = this.currencies.find((c) => c.isDefault === true);
                if (defaultCurrency) this.defaultCurrencyId = defaultCurrency.id;

                return this.currencies;
            },

            async getAccounts() {
                const raw = await this.fetchList(ENDPOINTS.accounts, 'accounts', 'accounts');

                this.accounts = raw.map((account) => ({
                    ...account,
                    accountIdentifier:
                        account.accountIdentifier ||
                        `${asText(account.accountNo)} - ${asText(account.accountName || account.name)}`.trim().replace(/^ - /, ''),
                    accountName: account.accountName || account.name
                }));

                this.accounts.sort((a, b) =>
                    String(a.accountNo ?? '').localeCompare(String(b.accountNo ?? ''))
                );

                if (!this.accounts.length) {
                    this.accounts = [{
                        id: this.emptyGuid || EMPTY_GUID,
                        accountNo: '',
                        accountIdentifier: 'No Ledger Available'
                    }];
                }

                return this.accounts;
            },

            async getDefaultGlSetup() {
                try {
                    const response = await axios.get(ENDPOINTS.defaultGlSetup);
                    const data = response.data?.result;

                    if (!data) return null;

                    this.defaultGlSetup = {
                        debitAccountId:
                            data.debitAccountId ||
                            data.accountsReceivableAccountId ||
                            data.accountsReceivableBankAccountId ||
                            '',
                        creditAccountId:
                            data.creditAccountId ||
                            data.accountsReceivableBankAccountId ||
                            '',
                        vatAccountId:
                            data.vatAccountId ||
                            data.vatReceivedAccountId ||
                            '',
                        irsAccountId:
                            data.irsAccountId ||
                            data.withholdingTaxAccountId ||
                            data.accountsReceivableBankAccountId ||
                            ''
                    };

                    if (!this.isEditing) this.applyDefaultGlSetup();
                    return this.defaultGlSetup;
                } catch (error) {
                    console.error('Get default GL setup error:', error);
                    this.toastHandler('error', 'Unable to get default GL numbers.');
                    return null;
                }
            },

            applyDefaultGlSetup() {
                if (!this.defaultGlSetup) return;

                this.form.debitAccountId = this.defaultGlSetup.debitAccountId || '';
                this.form.creditAccountId = this.defaultGlSetup.creditAccountId || '';
                this.form.vatAccountId = this.defaultGlSetup.vatAccountId || '';
                this.form.irsAccountId = this.defaultGlSetup.irsAccountId || '';
            },

            async getSystemNumbers() {
                try {
                    const response = await axios.get(ENDPOINTS.systemNumbers);
                    const systemNumbers = unwrapList(response.data);

                    this.currentSystemNumber =
                        systemNumbers.find((sn) => sn.itemName === 'ArAccountNumbers') ||
                        systemNumbers.find((sn) => sn.itemName === 'CustomerAccountNumbers') ||
                        null;

                    return this.currentSystemNumber;
                } catch (error) {
                    console.error('Error fetching system numbers:', error);
                    this.currentSystemNumber = null;
                    return null;
                }
            },

            getStatus() {
                this.statusList = [...this.statusList].sort((a, b) => a.name.localeCompare(b.name));

                const defaultStatus = this.statusList.find((s) => s.name.toLowerCase() === 'active');
                if (defaultStatus) this.defaultStatusId = defaultStatus.id;
            },

            async loadLookups() {
                this.getStatus();

                await Promise.all([
                    this.getCustomerGroups(),
                    this.getCurrencies(),
                    this.getAccounts(),
                    this.getDefaultGlSetup(),
                    this.getSystemNumbers()
                ]);

                await this.getCustomers();
            },

            // ================================================================
            // LOOKUP HELPERS
            // ================================================================
            getCustomerDetails(id) {
                return this.customers.find((item) => sameId(item.id, id));
            },
            getCustomerGroupDetails(id) {
                return this.customerGroups.find((item) => sameId(item.id, id));
            },
            getCurrencyDetails(id) {
                return this.currencies.find((item) => sameId(item.id, id));
            },
            getStatusDetails(id) {
                return this.statusList.find((item) => sameId(item.id, id));
            },
            getAccountDetails(id) {
                return this.accounts.find((item) => sameId(item.id, id));
            },

            async generateAccountNumber() {
                this.isLoadingAccountNo = true;
                if (this.isEditing) {
                    this.toastHandler('warning', 'Account number generation is available for new customers.');
                    return this.form.accountNumber;
                }

                await this.getSystemNumbers();

                if (this.currentSystemNumber) {
                    this.form.accountNumber =
                        `${this.currentSystemNumber.prefix ?? ''}` +
                        `${this.currentSystemNumber.lastNo ?? ''}` +
                        `${this.currentSystemNumber.suffix ?? ''}`;
                }

                if (!this.form.accountNumber) {
                    const randomNum = Math.floor(100000 + Math.random() * 900000);
                    this.form.accountNumber = `ACC-${randomNum}/AR`;
                }
                this.isLoadingAccountNo = false;
                return this.form.accountNumber;
            },

            // ================================================================
            // LOAD / RESET THE FORM
            // ================================================================
            async setCurrentCustomer(customer = null) {
                this.scrollToAdd();

                if (this.isSettingCustomer) return;

                let record = null;

                if (customer && typeof customer === 'object') {
                    record = customer;
                } else {
                    const grid = this.$refs.customersGrid;
                    if (!grid || typeof grid.selectedRows !== 'function') return;

                    const selected = grid.selectedRows() || [];
                    if (selected.length > 1) {
                        this.toastHandler('warning', 'You can only edit one record at a time');
                        return;
                    }
                    record = selected[0] ?? null;
                }

                if (!record) {
                    this.toastHandler('warning', 'Please select a customer first.');
                    return;
                }

                this.isSettingCustomer = true;
                this.isShimmerLoading = true;

                try {
                    this.customerId = record.id;
                    this.tenantId = record.tenantId ?? null;

                    this.form = {
                        accountNumber: record.accountNumber ?? '',
                        name: record.name ?? '',
                        customerGroupId: record.customerGroupId ?? '',
                        statusId: record.statusId || this.defaultStatusId || '',
                        address: record.address ?? '',
                        tinNumber: record.tinNumber ?? '',
                        vatNumber: record.vatNumber ?? '',
                        phoneNo: record.phoneNo ?? '',
                        currencyId: record.currencyId || this.defaultCurrencyId || '',
                        balance: money(record.balance).toFixed(2),
                        creditLimit: money(record.creditLimit).toFixed(2),
                        taxOffice: record.taxOffice ?? '',
                        email: record.email ?? '',
                        debitAccountId: record.debitAccountId ?? '',
                        creditAccountId: record.creditAccountId ?? '',
                        vatAccountId: record.vatAccountId ?? '',
                        irsAccountId: record.irsAccountId ?? '',
                        isResident: Boolean(record.isResident),
                        contactPerson: record.contactPerson ?? '',
                        contactPersonPhone: record.contactPersonPhone ?? '',
                        contactPersonEmail: record.contactPersonEmail ?? ''
                    };

                    this.loadedCustomerId = this.customerId;
                } catch (error) {
                    console.error('setCurrentCustomer failed:', error);
                    this.toastHandler('error', 'Unable to load the customer details.');
                } finally {
                    await this.$nextTick();
                    this.isSettingCustomer = false;
                    this.isShimmerLoading = false;
                }
            },

            resetCustomerFields() {
                this.customerId = '';
                this.loadedCustomerId = '';
                this.tenantId = null;
                this.currentSystemNumber = null;

                this.form = createEmptyForm();

                if (this.defaultCurrencyId) this.form.currencyId = this.defaultCurrencyId;
                if (this.defaultStatusId) this.form.statusId = this.defaultStatusId;

                this.applyDefaultGlSetup();

                const grid = this.$refs.customersGrid;
                if (grid && typeof grid.clearSelection === 'function') grid.clearSelection();

                this.$nextTick(() => {
                    const accountInput = document.getElementById('accountNumber');
                    if (accountInput) accountInput.focus();
                });
            },

            newCustomer() {
                this.resetCustomerFields();
                this.scrollToAdd();
            },

            onGridRowClick(event) {
                const row = event?.row || event?.data || event;
                if (row?.id) this.setCurrentCustomer(row);
            },

            // ================================================================
            // VALIDATION & SAVE
            // ================================================================
            validateCustomer() {
                const formEl = this.$refs.customerForm;
                if (formEl && typeof formEl.checkValidity === 'function' && !formEl.checkValidity()) {
                    formEl.reportValidity();
                    return false;
                }

                const requiredFields = [
                    ['accountNumber', 'Account number'],
                    ['name', 'Customer name'],
                    ['statusId', 'Customer status'],
                    ['address', 'Customer address'],
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
                    if (value === null || value === undefined || String(value).trim() === '') {
                        this.toastHandler('warning', `${label} is required.`);
                        return false;
                    }
                }

                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailPattern.test(this.form.email)) {
                    this.toastHandler('warning', 'Enter a valid customer email address.');
                    return false;
                }

                if (this.form.contactPersonEmail && !emailPattern.test(this.form.contactPersonEmail)) {
                    this.toastHandler('warning', 'Enter a valid contact person email address.');
                    return false;
                }

                if (money(this.form.creditLimit) < 0) {
                    this.toastHandler('warning', 'Credit limit cannot be negative.');
                    return false;
                }

                const currentId = this.customerId;

                const duplicateAccount = (this.customers || []).some(
                    (item) =>
                        String(item.accountNumber ?? '').trim().toLowerCase() ===
                        String(this.form.accountNumber ?? '').trim().toLowerCase() &&
                        !sameId(item.id, currentId)
                );

                if (duplicateAccount) {
                    this.toastHandler('warning', 'This account number is already assigned to another customer.');
                    return false;
                }

                const duplicateName = (this.customers || []).some(
                    (item) =>
                        String(item.name ?? '').trim().toLowerCase() ===
                        String(this.form.name ?? '').trim().toLowerCase() &&
                        !sameId(item.id, currentId)
                );

                if (duplicateName) {
                    this.toastHandler('warning', 'A customer with this name already exists.');
                    return false;
                }

                return true;
            },

            mapGlAccount(accountId, idKey, nameKey, payload) {
                if (!accountId) {
                    payload[idKey] = this.emptyGuid || EMPTY_GUID;
                    payload[nameKey] = 'Not Set';
                    return;
                }

                const account = this.getAccountDetails(accountId);

                if (account) {
                    payload[idKey] = account.id;
                    payload[nameKey] = account.accountIdentifier;
                } else {
                    payload[idKey] = this.emptyGuid || EMPTY_GUID;
                    payload[nameKey] = 'Not Set';
                }
            },

            apiErrorMessage(error, fallback) {
                const data = error && error.response && error.response.data;
                if (!data) return error && error.message ? `${fallback} (${error.message})` : fallback;
                if (typeof data === 'string') return `${fallback} ${data}`.trim();
                const abpError = data.error && (data.error.details || data.error.message);
                return abpError || data.message || data.detail || data.title || fallback;
            },

            sanitizeCustomerPayload(payload) {
                CUSTOMER_TEXT_FIELDS.forEach((key) => {
                    if (key in payload) payload[key] = asText(payload[key]).trim();
                });
                CUSTOMER_NUMBER_FIELDS.forEach((key) => {
                    if (key in payload) payload[key] = asNumber(payload[key]);
                });
                if ('isResident' in payload) payload.isResident = Boolean(payload.isResident);
                if ('balance' in payload) payload.balance = money(payload.balance);
                if ('creditLimit' in payload) payload.creditLimit = money(payload.creditLimit);
                return payload;
            },

            async saveCustomer() {
                if (this.isLoading) return;
                if (!this.validateCustomer()) return;

                this.isLoading = true;

                try {
                    if (!this.form.accountNumber) {
                        await this.generateAccountNumber();
                    }

                    const payload = {
                        accountNumber: asText(this.form.accountNumber).trim(),
                        name: asText(this.form.name).trim(),
                        address: asText(this.form.address).trim(),
                        tinNumber: asText(this.form.tinNumber).trim(),
                        vatNumber: asText(this.form.vatNumber).trim(),
                        phoneNo: asText(this.form.phoneNo).trim(),
                        email: asText(this.form.email).trim(),
                        balance: money(this.form.balance),
                        creditLimit: money(this.form.creditLimit),
                        taxOffice: asText(this.form.taxOffice).trim(),
                        isResident: Boolean(this.form.isResident),
                        contactPerson: asText(this.form.contactPerson).trim(),
                        contactPersonPhone: asText(this.form.contactPersonPhone).trim(),
                        contactPersonEmail: asText(this.form.contactPersonEmail).trim()
                    };

                    // Currency
                    const currencyInfo = this.getCurrencyDetails(this.form.currencyId);
                    if (currencyInfo) {
                        payload.currencyId = currencyInfo.id;
                        payload.currencyName = currencyInfo.currencyName;
                        payload.currencyCode = currencyInfo.currencyCode;
                        payload.buyingRate = asNumber(currencyInfo.buyRate);
                        payload.sellingRate = asNumber(currencyInfo.sellRate);
                    } else {
                        payload.currencyId = this.emptyGuid || EMPTY_GUID;
                    }

                    // Customer group
                    const groupInfo = this.getCustomerGroupDetails(this.form.customerGroupId);
                    if (groupInfo) {
                        payload.customerGroupId = groupInfo.id;
                        payload.customerGroupName = groupInfo.name;
                    } else {
                        payload.customerGroupId = this.emptyGuid || EMPTY_GUID;
                    }

                    // GL mapping
                    this.mapGlAccount(this.form.debitAccountId, 'debitAccountId', 'debitAccountName', payload);
                    this.mapGlAccount(this.form.creditAccountId, 'creditAccountId', 'creditAccountName', payload);
                    this.mapGlAccount(this.form.vatAccountId, 'vatAccountId', 'vatAccountName', payload);
                    this.mapGlAccount(this.form.irsAccountId, 'irsAccountId', 'irsAccountName', payload);

                    // Status
                    const statusInfo =
                        this.getStatusDetails(this.form.statusId) ||
                        this.getStatusDetails(this.defaultStatusId);

                    if (statusInfo) {
                        payload.statusId = statusInfo.id;
                        payload.status = statusInfo.name;
                    }

                    this.sanitizeCustomerPayload(payload);

                    // ---------------- UPDATE ----------------
                    if (this.customerId) {
                        payload.id = this.customerId;
                        if (this.tenantId) payload.tenantId = this.tenantId;

                        const response = await axios.post(ENDPOINTS.updateCustomer, payload);
                        const body = response.data || {};

                        if (body.code !== undefined && body.code !== 200 && body.success !== true) {
                            this.toastHandler('warning', body.message || 'Unable to update customer.');
                            return;
                        }

                        const updatedId = body.result?.id || body.id || this.customerId;
                        await this.getCustomers();

                        const refreshed = this.getCustomerDetails(updatedId);
                        if (refreshed) await this.setCurrentCustomer(refreshed);

                        this.toastHandler('success', body.message || 'Customer info updated.');
                        return;
                    }

                    // ---------------- CREATE ----------------
                    const response = await axios.post(ENDPOINTS.createCustomer, payload);
                    const body = response.data || {};

                    if (body.code !== 200 && body.success !== true && body.code !== undefined) {
                        this.toastHandler('warning', body.message || 'Unable to save customer.');
                        return;
                    }

                    // Bump the system number only once the record exists.
                    if (this.currentSystemNumber) {
                        this.currentSystemNumber.lastNo = asNumber(this.currentSystemNumber.lastNo) + 1;
                        axios.post(ENDPOINTS.updateSystemNumber, this.currentSystemNumber)
                            .catch((err) => console.error('Failed to update system number:', err));
                    }

                    const createdId = body.result?.id || body.id;
                    await this.getCustomers();

                    const created = createdId ? this.getCustomerDetails(createdId) : null;
                    if (created) await this.setCurrentCustomer(created);
                    else this.resetCustomerFields();

                    this.toastHandler('success', body.message || 'Customer data saved.');
                } catch (error) {
                    console.error('saveCustomer failed:', error && error.response ? error.response.data : error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Unable to save customer.'));
                } finally {
                    this.isLoading = false;
                }
            },

            // ================================================================
            // DELETE — blocked unless the customer balance is exactly zero
            // ================================================================
            getSelectedCustomers() {
                const grid = this.$refs.customersGrid;
                if (!grid || typeof grid.selectedRows !== 'function') return [];
                return grid.selectedRows() || [];
            },

            /**
             * Returns the customers whose balance is not zero, checking the
             * freshest data available (the reloaded grid) so a stale balance in
             * the UI cannot let a customer with a balance slip through.
             */
            async findCustomersWithBalance(rows) {
                const ids = rows
                    .map((row) => row.id)
                    .filter((id) => id !== undefined && id !== null && id !== '')
                    .map(String);

                if (!ids.length) return [];

                const fresh = await this.fetchList(ENDPOINTS.customers, 'customers');
                const freshById = new Map(fresh.map((item) => [String(item.id).toLowerCase(), item]));

                return rows
                    .map((row) => {
                        const latest = freshById.get(String(row.id).toLowerCase()) || row;
                        return {
                            id: latest.id,
                            name: latest.name ?? row.name ?? '',
                            accountNumber: latest.accountNumber ?? row.accountNumber ?? '',
                            balance: money(latest.balance)
                        };
                    })
                    .filter((item) => item.balance !== 0);
            },

            showBalanceBlocked(blocked) {
                if (typeof Swal !== 'undefined') {
                    const list = blocked
                        .map((item) => `• ${item.name || item.accountNumber || item.id} — balance ${item.balance.toFixed(2)}`)
                        .join('<br/>');

                    Swal.fire({
                        icon: 'error',
                        title: 'Cannot delete customer',
                        html:
                            '<p class="text-sm text-left">Deletion is only allowed when the customer balance is <strong>0.00</strong>.</p>' +
                            `<p class="text-sm text-left mt-2">${list}</p>`,
                        confirmButtonText: 'Close',
                        confirmButtonColor: '#dc2626'
                    });
                    return;
                }

                this.toastHandler('error', 'Deletion is only allowed when the customer balance is zero.');
            },

            async deleteSelectedCustomers() {
                const selected = this.getSelectedCustomers();

                if (!selected.length) {
                    this.toastHandler('warning', 'Select one or more customers to delete.');
                    return;
                }

                // ---- balance guard -------------------------------------------
                const blocked = await this.findCustomersWithBalance(selected);

                if (blocked.length) {
                    this.showBalanceBlocked(blocked);
                    return;
                }

                // ---- confirm -------------------------------------------------
                if (typeof Swal === 'undefined') {
                    if (!window.confirm('Delete selected customer(s)?')) return;
                } else {
                    const result = await Swal.fire({
                        title: selected.length === 1 ? 'Delete customer?' : 'Delete selected customers?',
                        text:
                            selected.length === 1
                                ? 'This customer record will be deleted. Its balance is 0.00.'
                                : `${selected.length} customer records will be deleted. Their balances are all 0.00.`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, delete',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#dc2626',
                        cancelButtonColor: '#64748b',
                        reverseButtons: true,
                        focusCancel: true
                    });

                    if (!result.isConfirmed) return;
                }

                this.isLoading = true;

                try {
                    const ids = selected.map((row) => String(row.id));

                    const responses = await Promise.all(
                        ids.map((id) =>
                            axios.get(`${ENDPOINTS.deleteCustomer}?id=${encodeURIComponent(id)}`)
                        )
                    );

                    const failed = responses.find((res) => res.data && res.data.success === false);

                    if (failed) {
                        this.toastHandler('error', failed.data.message || 'Unable to delete customer.');
                        return;
                    }

                    const grid = this.$refs.customersGrid;
                    if (grid && typeof grid.clearSelection === 'function') grid.clearSelection();

                    if (this.customerId && ids.some((id) => sameId(id, this.customerId))) {
                        this.resetCustomerFields();
                    }

                    await this.getCustomers();

                    this.toastHandler(
                        'success',
                        ids.length === 1 ? 'Customer info deleted.' : 'Customers deleted successfully.'
                    );
                } catch (error) {
                    console.error('deleteSelectedCustomers failed:', error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Unable to delete customer.'));
                } finally {
                    this.isLoading = false;
                }
            },

            // Kept for the inline "Delete Customer" button on the form.
            async confirmDeleteCurrent() {
                if (!this.customerId) return;

                const blocked = await this.findCustomersWithBalance([
                    { id: this.customerId, name: this.form.name, accountNumber: this.form.accountNumber }
                ]);

                if (blocked.length) {
                    this.showBalanceBlocked(blocked);
                    return;
                }

                const result = typeof Swal !== 'undefined'
                    ? await Swal.fire({
                        title: 'Delete customer?',
                        text: `Are you sure you want to delete "${this.form.name || this.form.accountNumber || 'this customer'}"? Its balance is 0.00.`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, delete',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#dc2626',
                        cancelButtonColor: '#64748b',
                        reverseButtons: true,
                        focusCancel: true
                    })
                    : { isConfirmed: window.confirm('Delete this customer?') };

                if (!result.isConfirmed) return;

                this.isLoading = true;

                try {
                    const response = await axios.get(
                        `${ENDPOINTS.deleteCustomer}?id=${encodeURIComponent(this.customerId)}`
                    );

                    if (response.data && response.data.success === false) {
                        this.toastHandler('error', response.data.message || 'Unable to delete customer.');
                        return;
                    }

                    this.resetCustomerFields();
                    await this.getCustomers();

                    this.toastHandler('success', 'Customer info deleted.');
                } catch (error) {
                    console.error('confirmDeleteCurrent failed:', error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Unable to delete customer.'));
                } finally {
                    this.isLoading = false;
                }
            },

            // ================================================================
            // TOAST
            // ================================================================
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
            }
        },

        watch: {
            customerId(val) {
                if (val && !this.isSettingCustomer && val !== this.loadedCustomerId) {
                    const record = this.getCustomerDetails(val);
                    if (record) this.setCurrentCustomer(record);
                }
            }
        },

        async mounted() {
            this.isShimmerLoading = true;

            await this.loadLookups();

            this.isShimmerLoading = false;

            // Deep link: /SharedResource/Customers?id=...
            const queryId = new URLSearchParams(window.location.search).get('id');
            if (queryId) {
                const target = this.getCustomerDetails(queryId);
                if (target) await this.setCurrentCustomer(target);
            }
        }
    });

    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
