(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const ENDPOINTS = {
        suppliers: '/SharedResource/GetSuppliers',
        supplierGroups: '/SharedResource/GetSupplierGroups',
        currencies: '/SharedResource/GetCurrencies',
        accounts: '/Ap/InitJournalEntry',
        defaultGlSetup: '/Ap/GetDefaultGlSetup',
        systemNumbers: '/SharedResource/GetSystemNumbers',
        updateSystemNumber: '/SharedResource/UpdateSystemNumber',
        createSupplier: '/SharedResource/CreateSupplier',
        updateSupplier: '/SharedResource/UpdateSupplier',
        deleteSupplier: '/SharedResource/DelSupplier'
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

    const SUPPLIER_TEXT_FIELDS = [
        'accountNumber', 'name', 'address', 'tinNumber', 'vatNumber', 'phoneNo',
        'email', 'taxOffice', 'contactPerson', 'contactPersonPhone',
        'contactPersonEmail', 'supplierGroupName', 'currencyName', 'currencyCode',
        'debitAccountName', 'creditAccountName', 'vatAccountName', 'irsAccountName', 'status'
    ];

    const SUPPLIER_NUMBER_FIELDS = ['balance', 'buyingRate', 'sellingRate'];

    const app = Vue.createApp({
        data() {
            const emptyForm = {
                accountNumber: '',
                name: '',
                supplierGroupId: '',
                statusId: '',
                address: '',
                tinNumber: '',
                vatNumber: '',
                phoneNo: '',
                currencyId: '',
                email: '',
                balance: '0.00',
                taxOffice: '',
                debitAccountId: '',
                creditAccountId: '',
                vatAccountId: '',
                irsAccountId: '',
                isResident: false,
                contactPerson: '',
                contactPersonPhone: '',
                contactPersonEmail: ''
            };

            return {
                theme: '#ff2056',
                emptyGuid: EMPTY_GUID,

                isLoading: false,
                isShimmerLoading: false,
                isSettingSupplier: false,
                payload: {},

                suppliers: [],
                supplierGroups: [],
                currencies: [],
                accounts: [],

                statusList: [
                    { id: 'a3b4c2f9-8e4d-4e79-b6b9-2d8c6b80b5fc', name: 'Active' },
                    { id: '6d1d2b1e-6c5e-4f31-9c3d-945d7f6e2a34', name: 'Inactive' },
                    { id: 'f28e71d1-63c9-4070-b7cb-2e5ce2cbe4a1', name: 'Dormant' }
                ],

                supplierId: '',
                loadedSupplierId: '',
                tenantId: null,

                defaultCurrencyId: '',
                defaultStatusId: '',
                defaultGlSetup: null,
                currentSystemNumber: null,
                isLoadingAccountNo: false,

                form: { ...emptyForm }
            };
        },

        computed: {
            isEditing() {
                return Boolean(this.supplierId);
            },
            supplierColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, width: 80, help: 'Unique supplier identifier.' },
                    { key: 'accountNumber', label: 'Account No.', type: 'text', width: 150, required: true, searchable: true },
                    { key: 'name', label: 'Supplier Name', type: 'avatar', width: 240, minWidth: 200, required: true, searchable: true, subtitleKey: 'email' },
                    { key: 'supplierGroupName', label: 'Supplier Group', type: 'text', width: 180, searchable: true },
                    { key: 'currencyName', label: 'Currency', type: 'text', width: 110, searchable: true },
                    { key: 'phoneNo', label: 'Contact No.', type: 'text', width: 150, searchable: true },
                    { key: 'email', label: 'Email', type: 'email', width: 220, searchable: true },
                    { key: 'statusName', label: 'Status', type: 'text', width: 120, searchable: true },
                    { key: 'balance', label: 'Balance', type: 'number', width: 140, decimals: 2 },
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

            getSupplierGroupName(supplier) {
                const group = this.supplierGroups.find((item) => sameId(item.id, supplier.supplierGroupId));
                return supplier.supplierGroupName || group?.name || 'Not assigned';
            },

            getStatusName(supplier) {
                const status = this.statusList.find((item) => sameId(item.id, supplier.statusId));
                return supplier.statusName || supplier.status || status?.name || 'Unknown';
            },

            getCurrencyName(supplier) {
                const currency = this.currencies.find((item) => sameId(item.id, supplier.currencyId));
                return supplier.currencyName || currency?.currencyName || '';
            },

            enrichSupplier(supplier) {
                return {
                    ...supplier,
                    supplierGroupName: this.getSupplierGroupName(supplier),
                    statusName: this.getStatusName(supplier),
                    currencyName: this.getCurrencyName(supplier),
                    balance: money(supplier.balance)
                };
            },

            async getSuppliers() {
                this.isShimmerLoading = true;
                try {
                    const list = await this.fetchList(ENDPOINTS.suppliers, 'suppliers');
                    this.suppliers = list
                        .map((item) => this.enrichSupplier(item))
                        .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
                } finally {
                    this.isShimmerLoading = false;
                }
                return this.suppliers;
            },

            async getSupplierGroups() {
                this.supplierGroups = await this.fetchList(ENDPOINTS.supplierGroups, 'supplier groups');
                return this.supplierGroups;
            },

            async getCurrencies() {
                this.currencies = await this.fetchList(ENDPOINTS.currencies, 'currencies');

                const defaultCurrency = this.currencies.find((c) => c.isDefault === true);
                if (defaultCurrency) {
                    this.defaultCurrencyId = defaultCurrency.id;
                }
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
                            data.accountsPayableAccountId ||
                            data.accountsPayableBankAccountId ||
                            '',
                        creditAccountId:
                            data.creditAccountId ||
                            data.accountsPayableBankAccountId ||
                            data.accountsReceivableBankAccountId ||
                            '',
                        vatAccountId:
                            data.vatAccountId ||
                            data.vatPaidAccountId ||
                            '',
                        irsAccountId:
                            data.irsAccountId ||
                            data.withholdingTaxAccountId ||
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
                        systemNumbers.find((sn) => sn.itemName === 'ApAccountNumbers') ||
                        systemNumbers.find((sn) => sn.itemName === 'SupplierAccountNumbers') ||
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
                    this.getSupplierGroups(),
                    this.getCurrencies(),
                    this.getAccounts(),
                    this.getDefaultGlSetup(),
                    this.getSystemNumbers()
                ]);

                await this.getSuppliers();
            },

            // ================================================================
            // LOOKUP HELPERS
            // ================================================================
            getSupplierDetails(id) {
                return this.suppliers.find((item) => sameId(item.id, id));
            },
            getSupplierGroupDetails(id) {
                return this.supplierGroups.find((item) => sameId(item.id, id));
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
                this.isLoadingAccountNo = true
                if (this.isEditing) {
                    this.toastHandler('warning', 'Account number generation is available for new suppliers.');
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
                    this.form.accountNumber = `SUP-${randomNum}/AP`;
                }

                this.isLoadingAccountNo = false;
                return this.form.accountNumber;
            },

            // ================================================================
            // LOAD / RESET THE FORM
            // ================================================================
            async setCurrentSupplier(supplier = null) {
                this.scrollToAdd();

                if (this.isSettingSupplier) return;

                let record = null;

                if (supplier && typeof supplier === 'object') {
                    record = supplier;
                } else {
                    const grid = this.$refs.suppliersGrid;
                    if (!grid || typeof grid.selectedRows !== 'function') return;

                    const selected = grid.selectedRows() || [];
                    if (selected.length > 1) {
                        this.toastHandler('warning', 'You can only edit one record at a time');
                        return;
                    }
                    record = selected[0] ?? null;
                }

                if (!record) {
                    this.toastHandler('warning', 'Please select a supplier first.');
                    return;
                }

                this.isSettingSupplier = true;
                this.isShimmerLoading = true;

                try {
                    this.supplierId = record.id;
                    this.tenantId = record.tenantId ?? null;

                    this.form = {
                        accountNumber: record.accountNumber ?? '',
                        name: record.name ?? '',
                        supplierGroupId: record.supplierGroupId ?? '',
                        statusId: record.statusId || this.defaultStatusId || '',
                        address: record.address ?? '',
                        tinNumber: record.tinNumber ?? '',
                        vatNumber: record.vatNumber ?? '',
                        phoneNo: record.phoneNo ?? '',
                        currencyId: record.currencyId || this.defaultCurrencyId || '',
                        email: record.email ?? '',
                        balance: money(record.balance).toFixed(2),
                        taxOffice: record.taxOffice ?? '',
                        debitAccountId: record.debitAccountId ?? '',
                        creditAccountId: record.creditAccountId ?? '',
                        vatAccountId: record.vatAccountId ?? '',
                        irsAccountId: record.irsAccountId ?? '',
                        isResident: Boolean(record.isResident),
                        contactPerson: record.contactPerson ?? '',
                        contactPersonPhone: record.contactPersonPhone ?? '',
                        contactPersonEmail: record.contactPersonEmail ?? ''
                    };

                    this.loadedSupplierId = this.supplierId;
                } catch (error) {
                    console.error('setCurrentSupplier failed:', error);
                    this.toastHandler('error', 'Unable to load the supplier details.');
                } finally {
                    await this.$nextTick();
                    this.isSettingSupplier = false;
                    this.isShimmerLoading = false;
                }
            },

            resetSupplierFields() {
                this.supplierId = '';
                this.loadedSupplierId = '';
                this.tenantId = null;
                this.currentSystemNumber = null;

                this.form = {
                    accountNumber: '',
                    name: '',
                    supplierGroupId: '',
                    statusId: this.defaultStatusId || '',
                    address: '',
                    tinNumber: '',
                    vatNumber: '',
                    phoneNo: '',
                    currencyId: this.defaultCurrencyId || '',
                    email: '',
                    balance: '0.00',
                    taxOffice: '',
                    debitAccountId: '',
                    creditAccountId: '',
                    vatAccountId: '',
                    irsAccountId: '',
                    isResident: false,
                    contactPerson: '',
                    contactPersonPhone: '',
                    contactPersonEmail: ''
                };

                this.applyDefaultGlSetup();

                const grid = this.$refs.suppliersGrid;
                if (grid && typeof grid.clearSelection === 'function') {
                    grid.clearSelection();
                }

                this.$nextTick(() => {
                    const accountInput = document.getElementById('accountNumber');
                    if (accountInput) accountInput.focus();
                });
            },

            newSupplier() {
                this.resetSupplierFields();
                this.scrollToAdd();
            },

            onGridRowClick(event) {
                const row = event?.row || event?.data || event;
                if (row?.id) this.setCurrentSupplier(row);
            },

            // ================================================================
            // VALIDATION & SAVE
            // ================================================================
            validateSupplier() {
                const formEl = this.$refs.supplierForm;
                if (formEl && typeof formEl.checkValidity === 'function' && !formEl.checkValidity()) {
                    formEl.reportValidity();
                    return false;
                }

                const requiredFields = [
                    ['accountNumber', 'Account number'],
                    ['name', 'Supplier name'],
                    ['statusId', 'Supplier status'],
                    ['address', 'Supplier address'],
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
                    this.toastHandler('warning', 'Enter a valid supplier email address.');
                    return false;
                }

                if (this.form.contactPersonEmail && !emailPattern.test(this.form.contactPersonEmail)) {
                    this.toastHandler('warning', 'Enter a valid contact person email address.');
                    return false;
                }

                const currentId = this.supplierId;

                const duplicateAccount = (this.suppliers || []).some(
                    (item) =>
                        String(item.accountNumber ?? '').trim().toLowerCase() ===
                        String(this.form.accountNumber ?? '').trim().toLowerCase() &&
                        !sameId(item.id, currentId)
                );

                if (duplicateAccount) {
                    this.toastHandler('warning', 'This account number is already assigned to another supplier.');
                    return false;
                }

                const duplicateName = (this.suppliers || []).some(
                    (item) =>
                        String(item.name ?? '').trim().toLowerCase() ===
                        String(this.form.name ?? '').trim().toLowerCase() &&
                        !sameId(item.id, currentId)
                );

                if (duplicateName) {
                    this.toastHandler('warning', 'A supplier with this name already exists.');
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

            sanitizeSupplierPayload(payload) {
                SUPPLIER_TEXT_FIELDS.forEach((key) => {
                    if (key in payload) payload[key] = asText(payload[key]).trim();
                });
                SUPPLIER_NUMBER_FIELDS.forEach((key) => {
                    if (key in payload) payload[key] = asNumber(payload[key]);
                });
                if ('isResident' in payload) payload.isResident = Boolean(payload.isResident);
                if ('balance' in payload) payload.balance = money(payload.balance);
                return payload;
            },

            async saveSupplier() {
                if (this.isLoading) return;
                if (!this.validateSupplier()) return;

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

                    // Supplier group
                    const groupInfo = this.getSupplierGroupDetails(this.form.supplierGroupId);
                    if (groupInfo) {
                        payload.supplierGroupId = groupInfo.id;
                        payload.supplierGroupName = groupInfo.name;
                    } else {
                        payload.supplierGroupId = this.emptyGuid || EMPTY_GUID;
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

                    this.sanitizeSupplierPayload(payload);

                    // ---------------- UPDATE ----------------
                    if (this.supplierId) {
                        payload.id = this.supplierId;
                        if (this.tenantId) payload.tenantId = this.tenantId;

                        const response = await axios.post(ENDPOINTS.updateSupplier, payload);
                        const body = response.data || {};

                        if (body.code !== undefined && body.code !== 200 && body.success !== true) {
                            this.toastHandler('warning', body.message || 'Unable to update supplier.');
                            return;
                        }

                        const updatedId = body.result?.id || body.id || this.supplierId;
                        await this.getSuppliers();

                        const refreshed = this.getSupplierDetails(updatedId);
                        if (refreshed) await this.setCurrentSupplier(refreshed);

                        this.toastHandler('success', body.message || 'Supplier updated successfully.');
                        return;
                    }

                    // ---------------- CREATE ----------------
                    const response = await axios.post(ENDPOINTS.createSupplier, payload);
                    const body = response.data || {};

                    if (body.code !== 200 && body.success !== true && body.code !== undefined) {
                        this.toastHandler('warning', body.message || 'Unable to save supplier.');
                        return;
                    }

                    // Bump the system number only once the record exists.
                    if (this.currentSystemNumber) {
                        this.currentSystemNumber.lastNo = asNumber(this.currentSystemNumber.lastNo) + 1;
                        axios.post(ENDPOINTS.updateSystemNumber, this.currentSystemNumber)
                            .catch((err) => console.error('Failed to update system number:', err));
                    }

                    const createdId = body.result?.id || body.id;
                    await this.getSuppliers();

                    const created = createdId ? this.getSupplierDetails(createdId) : null;
                    if (created) await this.setCurrentSupplier(created);
                    else this.resetSupplierFields();

                    this.toastHandler('success', body.message || 'Supplier created successfully.');
                } catch (error) {
                    console.error('saveSupplier failed:', error && error.response ? error.response.data : error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Unable to save supplier.'));
                } finally {
                    this.isLoading = false;
                }
            },

            // ================================================================
            // DELETE — blocked unless the supplier balance is exactly zero
            // ================================================================
            getSelectedSuppliers() {
                const grid = this.$refs.suppliersGrid;
                if (!grid || typeof grid.selectedRows !== 'function') return [];
                return grid.selectedRows() || [];
            },

            /**
             * Returns the suppliers whose balance is not zero, checking the
             * freshest data available (the reloaded grid) so a stale balance in
             * the UI cannot let a supplier with a balance slip through.
             */
            async findSuppliersWithBalance(rows) {
                const ids = rows
                    .map((row) => row.id)
                    .filter((id) => id !== undefined && id !== null && id !== '')
                    .map(String);

                if (!ids.length) return [];

                const fresh = await this.fetchList(ENDPOINTS.suppliers, 'suppliers');
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

            async deleteSelectedSuppliers() {
                const selected = this.getSelectedSuppliers();

                if (!selected.length) {
                    this.toastHandler('warning', 'Select one or more suppliers to delete.');
                    return;
                }

                // ---- balance guard -------------------------------------------
                const blocked = await this.findSuppliersWithBalance(selected);

                if (blocked.length) {
                    const list = blocked
                        .map((item) => `• ${item.name || item.accountNumber || item.id} — balance ${item.balance.toFixed(2)}`)
                        .join('<br/>');

                    this.toastHandler(
                        'error',
                        `Deletion is only allowed when the supplier balance is zero. ${blocked.length} selected supplier${blocked.length === 1 ? ' has' : 's have'} a non-zero balance:`
                    );

                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'error',
                            title: 'Cannot delete supplier',
                            html:
                                '<p class="text-sm text-left">Deletion is only allowed when the supplier balance is <strong>0.00</strong>.</p>' +
                                `<p class="text-sm text-left mt-2">${list}</p>`,
                            confirmButtonText: 'Close',
                            confirmButtonColor: '#dc2626'
                        });
                    }
                    return;
                }

                // ---- confirm -------------------------------------------------
                if (typeof Swal === 'undefined') {
                    if (!window.confirm('Delete selected supplier(s)?')) return;
                } else {
                    const result = await Swal.fire({
                        title: selected.length === 1 ? 'Delete supplier?' : 'Delete selected suppliers?',
                        text:
                            selected.length === 1
                                ? 'This supplier record will be deleted. Its balance is 0.00.'
                                : `${selected.length} supplier records will be deleted. Their balances are all 0.00.`,
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
                            axios.get(`${ENDPOINTS.deleteSupplier}?id=${encodeURIComponent(id)}`)
                        )
                    );

                    const failed = responses.find(
                        (res) => res.data && res.data.success === false
                    );

                    if (failed) {
                        this.toastHandler('error', failed.data.message || 'Unable to delete supplier.');
                        return;
                    }

                    const grid = this.$refs.suppliersGrid;
                    if (grid && typeof grid.clearSelection === 'function') grid.clearSelection();

                    if (this.supplierId && ids.some((id) => sameId(id, this.supplierId))) {
                        this.resetSupplierFields();
                    }

                    await this.getSuppliers();

                    this.toastHandler(
                        'success',
                        ids.length === 1 ? 'Supplier deleted successfully.' : 'Suppliers deleted successfully.'
                    );
                } catch (error) {
                    console.error('deleteSelectedSuppliers failed:', error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Unable to delete supplier.'));
                } finally {
                    this.isLoading = false;
                }
            },

            // Kept for the inline "Delete Supplier" button on the form.
            async confirmDeleteCurrent() {
                if (!this.supplierId) return;

                const blocked = await this.findSuppliersWithBalance([
                    { id: this.supplierId, name: this.form.name, accountNumber: this.form.accountNumber }
                ]);

                if (blocked.length) {
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'error',
                            title: 'Cannot delete supplier',
                            html:
                                '<p class="text-sm text-left">Deletion is only allowed when the supplier balance is <strong>0.00</strong>.</p>' +
                                `<p class="text-sm text-left mt-2">${this.form.name || this.form.accountNumber} — balance ${blocked[0].balance.toFixed(2)}</p>`,
                            confirmButtonText: 'Close',
                            confirmButtonColor: '#dc2626'
                        });
                    } else {
                        this.toastHandler('error', 'Deletion is only allowed when the supplier balance is zero.');
                    }
                    return;
                }

                const result = typeof Swal !== 'undefined'
                    ? await Swal.fire({
                        title: 'Delete supplier?',
                        text: 'This supplier record will be deleted.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, delete',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#dc2626',
                        cancelButtonColor: '#64748b',
                        reverseButtons: true,
                        focusCancel: true
                    })
                    : { isConfirmed: window.confirm('Delete this supplier?') };

                if (!result.isConfirmed) return;

                this.isLoading = true;

                try {
                    const response = await axios.get(
                        `${ENDPOINTS.deleteSupplier}?id=${encodeURIComponent(this.supplierId)}`
                    );

                    if (response.data && response.data.success === false) {
                        this.toastHandler('error', response.data.message || 'Unable to delete supplier.');
                        return;
                    }

                    this.resetSupplierFields();
                    await this.getSuppliers();

                    this.toastHandler('success', 'Supplier deleted successfully.');
                } catch (error) {
                    console.error('confirmDeleteCurrent failed:', error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Unable to delete supplier.'));
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
            supplierId(val) {
                if (val && !this.isSettingSupplier && val !== this.loadedSupplierId) {
                    const record = this.getSupplierDetails(val);
                    if (record) this.setCurrentSupplier(record);
                }
            }
        },

        async mounted() {
            this.isShimmerLoading = true;

            await this.loadLookups();

            this.isShimmerLoading = false;

            // Deep link: /SharedResource/Suppliers?id=...
            const queryId = new URLSearchParams(window.location.search).get('id');
            if (queryId) {
                const target = this.getSupplierDetails(queryId);
                if (target) await this.setCurrentSupplier(target);
            }
        }
    });

    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
