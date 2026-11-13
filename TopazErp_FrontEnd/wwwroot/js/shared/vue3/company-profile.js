(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const ENDPOINTS = {
        businessProfile: '/SharedResource/GetBusinessProfile',
        createBusinessProfile: '/SharedResource/CreateBusinessProfile',
        updateBusinessProfile: '/SharedResource/UpdateBusinessProfile',
        currencies: '/SharedResource/GetCurrencies',
        countries: '/jsonDataSample/countries.json',
        taxLevies: '/SharedResource/GetTaxLevies',
        createTaxLevy: '/SharedResource/CreateTaxLevy',
        updateTaxLevy: '/SharedResource/UpdateTaxLevy',
        deleteTaxLevy: '/SharedResource/DelTaxLevy'
    };

    const COVER_STORAGE_KEY = 'company-profile-cover';

    const MONTHS = [
        { id: 1, name: 'January' }, { id: 2, name: 'February' }, { id: 3, name: 'March' },
        { id: 4, name: 'April' }, { id: 5, name: 'May' }, { id: 6, name: 'June' },
        { id: 7, name: 'July' }, { id: 8, name: 'August' }, { id: 9, name: 'September' },
        { id: 10, name: 'October' }, { id: 11, name: 'November' }, { id: 12, name: 'December' }
    ];

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

    // Rates are stored/displayed with 4 decimals everywhere in this app.
    const rate4 = (value) => asNumber(value).toFixed(4);

    const app = Vue.createApp({
        data() {
            return {
                theme: '#0645e7',
                emptyGuid: EMPTY_GUID,

                activeTab: 'profile',

                isShimmerLoading: false,
                isLoading: false,

                errors: {},

                // ---------- company profile ----------
                companyProfileId: '',
                tenantId: '',

                companyName: '',
                countryId: '',
                cityName: '',
                phoneNo: '',
                companyTin: '',
                email: '',
                address: '',
                firstMonthOfFiscalYear: 1,
                defaultCurrenyId: '',
                isTaxLeviesInclusive: false,
                approveInvoiceBeforePayment: false,
                enforceOu: false,

                senderId: '',
                clientId: '',
                clientSecret: '',

                employerSocialSecurityNo: '',
                socialSecurityFundEmployerRate: null,
                socialSecurityFundEmployeeRate: null,
                paySocialSecurityFund: false,

                providentFundEmployeeRate: null,
                providentFundEmployerRate: null,
                providentFundTreatAsSocialSecurityFund: false,
                payProvidentFund: false,
                providentFundTaxEmployerPortion: false,

                secondProvidentEmployeeRate: null,
                secondProvidentEmployerRate: null,
                paySecondProvidentOrOthers: false,
                treatSecondProvidentAsSSF: false,
                secondProvidentTaxEmployerPortion: false,

                overtimePercentageOnBasicSalary: false,
                overtimePercentageOnDailyWage: false,

                mailHostName: '',
                primaryEmailAddress: '',
                emailPassword: '',
                portNumber: 0,
                isSSLEnabled: false,

                companyLogoBase64: '',
                coverPhotoBase64: '',

                countryList: [],
                currencyList: [],
                monthList: MONTHS,

                // ---------- tax levies ----------
                vatTaxLevyList: [],
                otherTaxLevyList: [],
                maximumVatTaxLevyRows: 1
            };
        },

        computed: {
            taxLevyColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, width: 74, help: 'Unique tax levy identifier.' },
                    { key: 'name', label: 'Tax Levy Type', type: 'text', required: true, searchable: true, width: 240 },
                    { key: 'rate', label: 'Rate (%)', type: 'number', required: true, decimals: 4, width: 120 },
                    { key: 'typeName', label: 'Category', type: 'text', width: 120 },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, width: 90 }
                ];
            },

            // Banner shown at the top of the profile page.
            coverPhotoPreview() {
                return this.coverPhotoBase64 || '';
            },

            countryName() {
                const country = this.countryList.find((c) => sameId(c.id, this.countryId));
                return country?.name || '—';
            },

            currencyName() {
                const currency = this.currencyList.find((c) => sameId(c.id, this.defaultCurrenyId));
                return currency?.currencyName || '—';
            },

            fiscalYearLabel() {
                const month = this.monthList.find(
                    (m) => asNumber(m.id) === asNumber(this.firstMonthOfFiscalYear)
                );
                return month?.name || '—';
            },

            profileSubtitle() {
                const parts = [];
                if (this.companyTin) parts.push(`TIN ${this.companyTin}`);
                if (this.cityName) parts.push(this.cityName);
                if (this.countryName !== '—') parts.push(this.countryName);
                return parts.join(' · ') || 'Company profile';
            }
        },

        methods: {
            getTaxList(type) {
                return type === 'vat' ? this.vatTaxLevyList : this.otherTaxLevyList;
            },

            scrollToAdd(id = 'add') {
                this.$nextTick(() => {
                    const element = document.querySelector('#' + id);
                    if (!element) {
                        console.error(`Cannot find #${id}. Check where the div is rendered.`);
                        return;
                    }
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
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
            },

            apiErrorMessage(error, fallback) {
                const data = error && error.response && error.response.data;
                if (!data) return error && error.message ? `${fallback} (${error.message})` : fallback;
                if (typeof data === 'string') return `${fallback} ${data}`.trim();
                const abpError = data.error && (data.error.details || data.error.message);
                return abpError || data.message || data.detail || data.title || fallback;
            },

            isValidEmail(value) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },

            // ================================================================
            // COMPANY PROFILE
            // ================================================================
            async getBusinessProfile() {
                this.isShimmerLoading = true;

                try {
                    const response = await axios.get(ENDPOINTS.businessProfile);
                    const p = response.data?.result;

                    if (!p) return;

                    this.companyProfileId = p.id || '';
                    this.tenantId = p.tenantId || '';

                    this.companyName = p.companyName ?? '';
                    this.countryId = p.countryId ?? '';
                    this.cityName = p.cityName ?? '';
                    this.phoneNo = p.phoneNo ?? '';
                    this.companyTin = p.companyTin ?? '';
                    this.email = p.email ?? '';
                    this.address = p.address ?? '';
                    this.firstMonthOfFiscalYear = asNumber(p.firstMonthOfFiscalYear, 1);
                    this.defaultCurrenyId = p.defaultCurrenyId ?? '';
                    this.isTaxLeviesInclusive = Boolean(p.isTaxLeviesInclusive);
                    this.approveInvoiceBeforePayment = Boolean(p.approveInvoiceBeforePayment);
                    this.enforceOu = Boolean(p.enforceOu);

                    this.senderId = p.senderId ?? '';
                    this.clientId = p.clientId ?? '';
                    this.clientSecret = p.clientSecret ?? '';

                    this.employerSocialSecurityNo = p.employerSocialSecurityNo ?? '';
                    this.socialSecurityFundEmployerRate = p.socialSecurityFundEmployerRate ?? null;
                    this.socialSecurityFundEmployeeRate = p.socialSecurityFundEmployeeRate ?? null;
                    this.paySocialSecurityFund = Boolean(p.paySocialSecurityFund);

                    this.providentFundEmployeeRate = p.providentFundEmployeeRate ?? null;
                    this.providentFundEmployerRate = p.providentFundEmployerRate ?? null;
                    this.providentFundTreatAsSocialSecurityFund = Boolean(p.providentFundTreatAsSocialSecurityFund);
                    this.payProvidentFund = Boolean(p.payProvidentFund);
                    this.providentFundTaxEmployerPortion = Boolean(p.providentFundTaxEmployerPortion);

                    this.secondProvidentEmployeeRate = p.secondProvidentEmployeeRate ?? null;
                    this.secondProvidentEmployerRate = p.secondProvidentEmployerRate ?? null;
                    this.paySecondProvidentOrOthers = Boolean(p.paySecondProvidentOrOthers);
                    this.treatSecondProvidentAsSSF = Boolean(p.treatSecondProvidentAsSSF);
                    this.secondProvidentTaxEmployerPortion = Boolean(p.secondProvidentTaxEmployerPortion);

                    this.overtimePercentageOnBasicSalary = Boolean(p.overtimePercentageOnBasicSalary);
                    this.overtimePercentageOnDailyWage = Boolean(p.overtimePercentageOnDailyWage);

                    this.mailHostName = p.mailHostName ?? '';
                    this.primaryEmailAddress = p.primaryEmailAddress ?? '';
                    this.emailPassword = p.emailPassword ?? '';
                    this.portNumber = asNumber(p.portNumber, 0);
                    this.isSSLEnabled = Boolean(p.isSSLEnabled);

                    this.companyLogoBase64 = p.companyLogo
                        ? (String(p.companyLogo).startsWith('data:')
                            ? p.companyLogo
                            : `data:image/png;base64,${p.companyLogo}`)
                        : '';

                    // Cover photo: prefer the API, fall back to the one saved
                    // locally so the banner survives a reload on backends that
                    // don't persist it yet.
                    const apiCover = p.coverPhotoBase64 || p.coverPhoto || '';
                    this.coverPhotoBase64 = apiCover
                        ? (String(apiCover).startsWith('data:')
                            ? apiCover
                            : `data:image/png;base64,${apiCover}`)
                        : (localStorage.getItem(COVER_STORAGE_KEY) || '');
                } catch (error) {
                    console.error('Get business profile error:', error);
                    this.toastHandler('error', 'Unable to get the company profile.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            validateForm() {
                const formEl = this.$refs.profileForm;
                if (formEl && typeof formEl.checkValidity === 'function' && !formEl.checkValidity()) {
                    formEl.reportValidity();
                    return false;
                }

                this.errors = {};

                if (!this.companyName || !this.companyName.trim()) {
                    this.errors.companyName = 'Company name is required';
                }
                if (!this.phoneNo || !this.phoneNo.trim()) {
                    this.errors.phoneNo = 'Phone number is required';
                }
                if (!this.email || !this.email.trim()) {
                    this.errors.email = 'Email is required';
                } else if (!this.isValidEmail(this.email)) {
                    this.errors.email = 'Invalid email format';
                }
                if (!this.address || !this.address.trim()) {
                    this.errors.address = 'Address is required';
                }

                return Object.keys(this.errors).length === 0;
            },

            onFileChange(e) {
                const file = e.target.files && e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    this.companyLogoBase64 = event.target.result;
                };
                reader.readAsDataURL(file);
            },

            showUpload() {
                if (this.$refs.fileInput) this.$refs.fileInput.click();
            },

            removeLogo() {
                this.companyLogoBase64 = '';
            },

            showCoverUpload() {
                if (this.$refs.coverInput) this.$refs.coverInput.click();
            },

            onCoverChange(e) {
                const file = e.target.files && e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    this.coverPhotoBase64 = event.target.result;
                    try {
                        localStorage.setItem(COVER_STORAGE_KEY, this.coverPhotoBase64);
                    } catch (error) {
                        console.warn('Cover photo could not be cached locally:', error);
                    }
                };
                reader.readAsDataURL(file);
            },

            removeCover() {
                this.coverPhotoBase64 = '';
                try {
                    localStorage.removeItem(COVER_STORAGE_KEY);
                } catch (error) {
                    console.warn('Cover photo cache could not be cleared:', error);
                }
            },

            async saveProfile() {
                if (this.isLoading) return;

                if (!this.validateForm()) {
                    this.toastHandler('error', 'Please fix validation errors.');
                    return;
                }

                this.isLoading = true;

                try {
                    const payload = {
                        companyName: this.companyName,
                        countryId: this.countryId || this.emptyGuid,
                        cityName: this.cityName,
                        phoneNo: this.phoneNo,
                        companyTin: this.companyTin,
                        email: this.email,
                        address: this.address,
                        firstMonthOfFiscalYear: asNumber(this.firstMonthOfFiscalYear, 1),
                        senderId: this.senderId,
                        clientId: this.clientId,
                        clientSecret: this.clientSecret,
                        employerSocialSecurityNo: this.employerSocialSecurityNo,
                        socialSecurityFundEmployerRate: asNumber(this.socialSecurityFundEmployerRate),
                        socialSecurityFundEmployeeRate: asNumber(this.socialSecurityFundEmployeeRate),
                        paySocialSecurityFund: Boolean(this.paySocialSecurityFund),
                        providentFundEmployeeRate: asNumber(this.providentFundEmployeeRate),
                        providentFundEmployerRate: asNumber(this.providentFundEmployerRate),
                        providentFundTreatAsSocialSecurityFund: Boolean(this.providentFundTreatAsSocialSecurityFund),
                        payProvidentFund: Boolean(this.payProvidentFund),
                        providentFundTaxEmployerPortion: Boolean(this.providentFundTaxEmployerPortion),
                        secondProvidentEmployeeRate: asNumber(this.secondProvidentEmployeeRate),
                        secondProvidentEmployerRate: asNumber(this.secondProvidentEmployerRate),
                        paySecondProvidentOrOthers: Boolean(this.paySecondProvidentOrOthers),
                        treatSecondProvidentAsSSF: Boolean(this.treatSecondProvidentAsSSF),
                        secondProvidentTaxEmployerPortion: Boolean(this.secondProvidentTaxEmployerPortion),
                        overtimePercentageOnBasicSalary: Boolean(this.overtimePercentageOnBasicSalary),
                        overtimePercentageOnDailyWage: Boolean(this.overtimePercentageOnDailyWage),
                        mailHostName: asText(this.mailHostName).trim(),
                        primaryEmailAddress: asText(this.primaryEmailAddress).trim(),
                        emailPassword: this.emailPassword,
                        portNumber: asNumber(this.portNumber, 0),
                        isSSLEnabled: Boolean(this.isSSLEnabled),
                        defaultCurrenyId: this.defaultCurrenyId || this.emptyGuid,
                        isTaxLeviesInclusive: Boolean(this.isTaxLeviesInclusive),
                        approveInvoiceBeforePayment: Boolean(this.approveInvoiceBeforePayment),
                        companyLogoBase64: this.companyLogoBase64
                            ? String(this.companyLogoBase64).split(',')[1]
                            : null,
                        coverPhotoBase64: this.coverPhotoBase64
                            ? String(this.coverPhotoBase64).split(',')[1]
                            : null,
                        enforceOu: Boolean(this.enforceOu)
                    };

                    const isUpdate = Boolean(this.companyProfileId);
                    const url = isUpdate
                        ? ENDPOINTS.updateBusinessProfile
                        : ENDPOINTS.createBusinessProfile;

                    if (isUpdate) payload.id = this.companyProfileId;

                    const response = await axios.post(url, payload);
                    const body = response.data || {};

                    if (body.code !== undefined && body.code !== 200 && body.success !== true) {
                        this.toastHandler('warning', body.message || 'Unable to save the profile.');
                        return;
                    }

                    const newId = body.result?.id || body.id;
                    if (!isUpdate && newId) this.companyProfileId = newId;

                    this.toastHandler('success', body.message || 'Saved successfully.');
                    await this.getBusinessProfile();
                } catch (error) {
                    console.error('saveProfile failed:', error && error.response ? error.response.data : error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Save failed.'));
                } finally {
                    this.isLoading = false;
                }
            },

            // ================================================================
            // LOOKUPS
            // ================================================================
            async getCountries() {
                try {
                    const response = await axios.get(`${ENDPOINTS.countries}?v=${new Date().getTime()}`);
                    this.countryList = asList(response.data);
                } catch (error) {
                    console.error('Get countries error:', error);
                    this.countryList = [];
                    this.toastHandler('error', 'Unable to get countries.');
                }
            },

            async getCurrencies() {
                try {
                    const response = await axios.get(ENDPOINTS.currencies);
                    this.currencyList = unwrapList(response.data);
                } catch (error) {
                    console.error('Get currencies error:', error);
                    this.currencyList = [];
                    this.toastHandler('error', 'Unable to get currency.');
                }
            },

            // ================================================================
            // TAX LEVIES — READ
            // ================================================================
            // Levy category comes from the record itself, not the request.
            normalizeTaxType(value) {
                const type = asText(value).trim().toLowerCase();
                return type === 'vat' ? 'vat' : 'others';
            },

            decorateTaxLevy(item) {
                const type = this.normalizeTaxType(item.type);
                return {
                    ...item,
                    name: item.name ?? item.taxLevyType ?? '',
                    rate: asNumber(item.rate),
                    type,
                    typeName: type === 'vat' ? 'VAT' : 'Other'
                };
            },

            // One call returns every levy; the two tables are filtered locally.
            async getTaxLevies() {
                try {
                    const response = await axios.get(ENDPOINTS.taxLevies);
                    const all = unwrapList(response.data).map((item) => this.decorateTaxLevy(item));

                    this.vatTaxLevyList = all
                        .filter((item) => item.type === 'vat')
                        .sort((a, b) => String(a.name).localeCompare(String(b.name)));

                    this.otherTaxLevyList = all
                        .filter((item) => item.type !== 'vat')
                        .sort((a, b) => String(a.name).localeCompare(String(b.name)));

                    return all;
                } catch (error) {
                    console.error('Get tax levies error:', error);
                    this.vatTaxLevyList = [];
                    this.otherTaxLevyList = [];
                    this.toastHandler('error', 'Unable to get tax levies.');
                    return [];
                }
            },

            // ================================================================
            // TAX LEVIES — GRID-DRIVEN CRUD
            // The data-grid's built-in form fires:
            //   @@create / @@update  -> { grid, level, row, data }
            //   @@delete             -> { grid, level, rows }
            // The levy category is not shown in the grid, so it is passed in
            // from the template ("vat" | "others").
            // ================================================================
            setTaxList(type, list) {
                if (type === 'vat') this.vatTaxLevyList = list;
                else this.otherTaxLevyList = list;
            },

            validateTaxLevyRow(type, row, editingId = null) {
                const name = asText(row?.name).trim();
                const rate = asNumber(row?.rate, NaN);

                if (!name) {
                    this.toastHandler('warning', 'Tax levy name is required.');
                    return false;
                }

                if (!Number.isFinite(rate) || rate <= 0) {
                    this.toastHandler('warning', 'Enter a rate greater than zero.');
                    return false;
                }

                if (rate > 100) {
                    this.toastHandler('warning', 'Rate cannot be greater than 100%.');
                    return false;
                }

                const duplicate = this.getTaxList(type).some(
                    (item) =>
                        String(item.name ?? '').trim().toLowerCase() === name.toLowerCase() &&
                        !sameId(item.id, editingId)
                );

                if (duplicate) {
                    this.toastHandler('warning', 'A tax levy with this name already exists.');
                    return false;
                }

                return true;
            },

            // @create — fired after the grid's built-in form is submitted with mode='create'
            async onCreateTaxLevy(type, event) {
                const row = event?.row || event?.data;
                if (!row) return;

                if (!this.validateTaxLevyRow(type, row)) return;

                // The profile allows only a limited number of VAT levies.
                if (type === 'vat' && this.vatTaxLevyList.length >= this.maximumVatTaxLevyRows) {
                    this.toastHandler(
                        'error',
                        `Maximum of ${this.maximumVatTaxLevyRows} VAT levy row(s) reached.`
                    );
                    await this.getTaxLevies();
                    return;
                }

                const payload = {
                    name: asText(row.name).trim(),
                    rate: asNumber(row.rate),
                    type
                };

                this.isShimmerLoading = true;

                try {
                    const response = await axios.post(ENDPOINTS.createTaxLevy, payload);
                    const body = response.data || {};

                    if (body.code !== undefined && body.code !== 200 && body.success !== true) {
                        this.toastHandler('warning', body.message || 'Unable to save tax levy.');
                        return;
                    }

                    await this.getTaxLevies();
                    this.toastHandler('success', body.message || 'Tax levy created successfully.');
                } catch (error) {
                    console.error('Create tax levy failed:', error && error.response ? error.response.data : error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Failed to create tax levy.'));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            // @update — fired after the grid's built-in form is submitted with mode='update'
            async onUpdateTaxLevy(type, event) {
                const row = event?.row || event?.data;
                if (!row) return;

                if (!this.validateTaxLevyRow(type, row, row.id)) return;

                const list = this.getTaxList(type);

                const existing = list.find((item) => sameId(item.id, row.id));

                if (!existing) {
                    this.toastHandler('error', 'Tax levy was not found.');
                    return;
                }

                const payload = {
                    ...existing,
                    ...row,
                    id: existing.id,
                    tenantId: existing.tenantId,
                    name: asText(row.name).trim(),
                    rate: asNumber(row.rate),
                    type
                };

                this.isShimmerLoading = true;

                try {
                    const response = await axios.post(ENDPOINTS.updateTaxLevy, payload);
                    const body = response.data || {};

                    if (body.code !== undefined && body.code !== 200 && body.success !== true) {
                        this.toastHandler('warning', body.message || 'Unable to update tax levy.');
                        return;
                    }

                    // Optimistically patch the local list so the grid reflects changes immediately
                    const idx = list.findIndex((item) => sameId(item.id, payload.id));
                    if (idx !== -1) {
                        list.splice(idx, 1, this.decorateTaxLevy(payload));
                        this.setTaxList(type, [...list]);
                    } else {
                        await this.getTaxLevies();
                    }

                    this.toastHandler('success', body.message || 'Tax levy updated successfully.');
                } catch (error) {
                    console.error('Update tax levy failed:', error && error.response ? error.response.data : error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Failed to update tax levy.'));
                    await this.getTaxLevies(); // roll back optimistic patch
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            // @delete — fired after the user confirms the grid's built-in delete dialog
            async onDeleteTaxLevies(type, event) {
                const rows = event?.rows;

                if (!Array.isArray(rows) || !rows.length) return;

                this.isShimmerLoading = true;

                try {
                    const results = await Promise.allSettled(
                        rows.map((row) =>
                            axios.get(`${ENDPOINTS.deleteTaxLevy}?id=${encodeURIComponent(row.id)}`)
                        )
                    );

                    const rejected = results.filter((r) => r.status === 'rejected');
                    const flagged = results.filter(
                        (r) => r.status === 'fulfilled' && r.value?.data && r.value.data.success === false
                    );
                    const failed = rejected.length + flagged.length;
                    const label = type === 'vat' ? 'VAT levy' : 'tax levy';
                    const plural = rows.length !== 1 ? 's' : '';

                    if (failed) {
                        this.toastHandler(
                            'warning',
                            `${rows.length - failed} deleted; ${failed} failed.`
                        );
                        await this.getTaxLevies(); // re-sync after partial failure
                    } else {
                        this.toastHandler(
                            'success',
                            `${rows.length} ${label}${plural} deleted.`
                        );
                        // The grid already removed the rows from its local data; no re-fetch needed
                    }
                } catch (error) {
                    console.error('Delete tax levies failed:', error);
                    this.toastHandler('error', 'Failed to delete tax levy.');
                    await this.getTaxLevies();
                } finally {
                    this.isShimmerLoading = false;
                }
            }
        },

        async mounted() {
            this.isShimmerLoading = true;

            await Promise.all([
                this.getBusinessProfile(),
                this.getCountries(),
                this.getCurrencies(),
                this.getTaxLevies()
            ]);

            this.isShimmerLoading = false;
        }
    });

    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
