(() => {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const ENDPOINTS = {
        // School profile
        schoolProfile: '/SchoolManager/GetSchoolProfile',
        createSchoolProfile: '/SchoolManager/CreateSchoolProfile',
        updateSchoolProfile: '/SchoolManager/UpdateSchoolProfile',
        businessProfile: '/SharedResource/GetBusinessProfile',
        countries: '/jsonDataSample/countries.json',
        countryStates: '/jsonDataSample/regions.json',
        cities: '/jsonDataSample/cities.json',
        currencies: '/SharedResource/GetCurrencies',
        academicYears: '/SchoolManager/GetAcademicYears',
        terms: '/jsonDataSample/terms.json',
        updateAcademicYear: '/SchoolManager/UpdateAcademicYear',
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

    // "data:image/png;base64,AAAA" -> "AAAA" (the API stores raw base64).
    const stripDataUrl = (value) => {
        if (!value) return null;
        const text = String(value);
        return text.includes(',') ? text.split(',')[1] : text;
    };

    // "AAAA" -> "data:image/png;base64,AAAA", URLs and data URIs pass through.
    const toDataUrl = (value) => {
        if (!value) return '';
        const text = String(value);
        if (text.startsWith('data:') || /^https?:\/\//i.test(text)) return text;
        return `data:image/png;base64,${text}`;
    };

    const app = Vue.createApp({
        data() {
            return {
                theme: '#0645e7',
                emptyGuid: EMPTY_GUID,

                activeTab: 'school',

                isShimmerLoading: false,
                isLoading: false,
                isHydrating: false,

                errors: {},

                // ---------- school profile model ----------
                id: '',

                schoolName: '',
                countryName: '',
                cityName: '',
                countryStateName: '',
                phoneNo: '',
                address: '',
                countryId: '',
                countryStateId: '',
                cityId: '',
                email: '',
                senderId: '',
                clientId: '',
                clientSecret: '',
                registrationNo: '',
                enforceExamSecurity: false,
                schoolDays: 0,
                faxNo: '',
                website: '',
                currentAcademicYearId: '',
                currentAcademicYearName: '',
                subMetro: '',
                circuit: '',
                currentTermId: '',
                currentTermName: '',

                // ---------- email settings ----------
                mailHostName: '',
                isSSLEnabled: false,
                portNumber: 0,
                primaryEmailAddress: '',
                emailPassword: '',

                // ---------- logo and signature ----------
                companyLogoBase64: '',
                schoolLogo: '',
                signatureBase64: '',
                signatureUrl: '',
                showSignature: false,
                showSignatureOnResults: false,
                showSignatureOnBills: false,
                showSignatureOnStatement: false,
                showSignatureOnReceipt: false,

                // ---------- terminal report ----------
                isClassPosition: false,
                isSubjectPosition: false,
                currencyId: '',

                // ---------- lookups ----------
                countryList: [],
                countryStateList: [],
                cityList: [],
                currencyList: [],
                academicYearList: [],
                termList: [],
                allCountryStates: [],
                allCities: [],
                tenantId: null,
            };
        },

        computed: {
            logoPreview() {
                return toDataUrl(this.companyLogoBase64 || this.schoolLogo);
            },

            signaturePreview() {
                return toDataUrl(this.signatureBase64 || this.signatureUrl);
            },

            isSaved() {
                return Boolean(this.id) && !sameId(this.id, EMPTY_GUID);
            },

            currencyName() {
                const currency = this.currencyList.find((c) => sameId(c.id, this.currencyId));
                return currency?.currencyName || '—';
            },

            countryLabel() {
                const country = this.countryList.find((c) => sameId(c.id, this.countryId));
                return country?.name || this.countryName || '—';
            },

            countryStateLabel() {
                const state = this.countryStateList.find((s) => sameId(s.id, this.countryStateId));
                return state?.name || this.countryStateName || '—';
            },

            cityLabel() {
                const city = this.cityList.find((c) => sameId(c.id, this.cityId));
                return city?.name || this.cityName || '—';
            },

            academicYearLabel() {
                const year = this.academicYearList.find((y) => sameId(y.id, this.currentAcademicYearId));
                return year?.name || this.currentAcademicYearName || '—';
            },

            // Terms belonging to the selected academic year when the API supplies it.
            termOptions() {
                if (!this.currentAcademicYearId) return this.termList;

                const related = this.termList.filter(
                    (t) => sameId(t.academicYearId, this.currentAcademicYearId)
                );

                return related.length ? related : this.termList;
            },

            termLabel() {
                const term = this.termList.find((t) => sameId(t.id, this.currentTermId));
                return term?.name || this.currentTermName || '—';
            },

            profileSubtitle() {
                const parts = [];

                if (this.registrationNo) parts.push(`Reg. ${this.registrationNo}`);

                const location = [this.cityLabel, this.countryStateLabel, this.countryLabel]
                    .filter((part) => part && part !== '—');

                if (location.length) parts.push(location.join(', '));

                return parts.join(' · ');
            }
        },

        methods: {
            getCountryCode(country) {
                return country?.countryCode
                    || country?.iso2
                    || country?.isoCode
                    || country?.alpha2
                    || country?.code
                    || country?.countryIsoCode
                    || '';
            },

            getCountryName(country) {
                return country?.name
                    || country?.countryName
                    || country?.displayName
                    || '';
            },

            selectedCountry() {
                return this.countryList.find((country) => sameId(
                    country.id ?? country.countryId,
                    this.countryId
                ));
            },

            matchesSelectedCountry(item, country) {
                if (!country || !item) return false;

                const selectedCode = this.getCountryCode(country);
                const selectedName = this.getCountryName(country);

                if (selectedCode && item.countryCode) {
                    return String(item.countryCode).toLowerCase()
                        === String(selectedCode).toLowerCase();
                }

                return Boolean(selectedName && item.countryName
                    && String(item.countryName).trim().toLowerCase()
                    === String(selectedName).trim().toLowerCase());
            },
            // ================================================================
            // TOAST / HELPERS
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

            // Adds an option sourced from the saved record so a select still shows
            // its current value when the lookup endpoint does not contain it.
            ensureOption(list, id, name) {
                if (!id || sameId(id, EMPTY_GUID)) return list;
                if (list.some((item) => sameId(item.id, id))) return list;
                if (!name) return list;

                return [{ id, name }, ...list];
            },

            // ================================================================
            // SCHOOL PROFILE — READ
            // ================================================================
            async getSchoolProfile() {
                this.isShimmerLoading = true;

                try {
                    let profile = null;

                    try {
                        const response = await axios.get(ENDPOINTS.schoolProfile);
                        profile = response.data?.result;
                    } catch (error) {
                        console.warn('School profile endpoint unavailable, trying the shared profile:', error);
                    }

                    if (!profile) {
                        profile = await this.getBusinessProfileFallback();
                    }

                    if (!profile) return;

                    this.hydrate(profile);
                } catch (error) {
                    console.error('Get school profile error:', error);
                    this.toastHandler('error', 'Unable to get the school profile.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async getBusinessProfileFallback() {
                try {
                    const response = await axios.get(ENDPOINTS.businessProfile);
                    return response.data?.result || null;
                } catch (error) {
                    console.warn('Shared profile unavailable:', error);
                    return null;
                }
            },

            hydrate(p) {
                this.isHydrating = true;

                this.id = p.id || '';
                this.tenantId = p.tenantId || null;
                this.schoolName = p.schoolName ?? p.companyName ?? '';
                this.countryName = p.countryName ?? '';
                this.cityName = p.cityName ?? '';
                this.countryStateName = p.countryStateName ?? p.stateName ?? '';
                this.phoneNo = p.phoneNo ?? '';
                this.address = p.address ?? '';
                this.countryId = p.countryId ?? '';
                this.countryStateId = p.countryStateId ?? '';
                this.cityId = p.cityId ?? '';
                this.email = p.email ?? '';
                this.senderId = p.senderId ?? '';
                this.clientId = p.clientId ?? '';
                this.clientSecret = p.clientSecret ?? '';
                this.registrationNo = p.registrationNo ?? p.companyTin ?? '';
                this.enforceExamSecurity = Boolean(p.enforceExamSecurity);
                this.schoolDays = asNumber(p.schoolDays, 0);
                this.faxNo = p.faxNo ?? '';
                this.website = p.website ?? p.webSite ?? '';
                this.currentAcademicYearId = p.currentAcademicYearId ?? '';
                this.currentAcademicYearName = p.currentAcademicYearName ?? '';
                this.subMetro = p.subMetro ?? '';
                this.circuit = p.circuit ?? '';
                this.currentTermId = p.currentTermId ?? '';
                this.currentTermName = p.currentTermName ?? '';

                this.mailHostName = p.mailHostName ?? '';
                this.isSSLEnabled = Boolean(p.isSSLEnabled);
                this.portNumber = asNumber(p.portNumber, 0);
                this.primaryEmailAddress = p.primaryEmailAddress ?? '';
                this.emailPassword = p.emailPassword ?? '';

                this.companyLogoBase64 = p.companyLogoBase64 ?? '';
                this.schoolLogo = p.schoolLogo ?? '';
                this.signatureBase64 = p.signatureBase64 ?? '';
                this.signatureUrl = p.signatureUrl ?? '';
                this.showSignature = Boolean(p.showSignature);
                this.showSignatureOnResults = Boolean(p.showSignatureOnResults);
                this.showSignatureOnBills = Boolean(p.showSignatureOnBills);
                this.showSignatureOnStatement = Boolean(p.showSignatureOnStatement);
                this.showSignatureOnReceipt = Boolean(p.showSignatureOnReceipt);

                this.isClassPosition = Boolean(p.isClassPosition);
                this.isSubjectPosition = Boolean(p.isSubjectPosition);
                this.currencyId = p.currencyId ?? p.defaultCurrenyId ?? '';

                // Keep the selects usable even when the lookup does not contain the
                // saved id — the name recorded on the profile is real API data.
                this.countryList = this.ensureOption(this.countryList, this.countryId, this.countryName);
                this.countryStateList = this.ensureOption(
                    this.countryStateList, this.countryStateId, this.countryStateName
                );
                this.cityList = this.ensureOption(this.cityList, this.cityId, this.cityName);
                this.academicYearList = this.ensureOption(
                    this.academicYearList, this.currentAcademicYearId, this.currentAcademicYearName
                );
                this.termList = this.ensureOption(this.termList, this.currentTermId, this.currentTermName);

                this.$nextTick(() => {
                    this.isHydrating = false;
                });
            },

            // ================================================================
            // VALIDATION / FILE HANDLING
            // ================================================================
            validateForm() {
                const formEl = this.$refs?.profileForm;
                if (formEl && typeof formEl.checkValidity === 'function' && !formEl.checkValidity()) {
                    formEl.reportValidity();
                    return false;
                }

                this.errors = {};

                if (!this.schoolName || !this.schoolName.trim()) {
                    this.errors.schoolName = 'School name is required';
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

            readFileAsDataUrl(file, onLoaded) {
                if (!file) return;

                if (!String(file.type || '').startsWith('image/')) {
                    this.toastHandler('warning', 'Please choose an image file.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => onLoaded(event.target.result);
                reader.onerror = () => this.toastHandler('error', 'Unable to read that file.');
                reader.readAsDataURL(file);
            },

            onLogoChange(e) {
                this.readFileAsDataUrl(e.target.files && e.target.files[0], (result) => {
                    this.companyLogoBase64 = result;
                });
                e.target.value = '';
            },

            onSignatureChange(e) {
                this.readFileAsDataUrl(e.target.files && e.target.files[0], (result) => {
                    this.signatureBase64 = result;
                });
                e.target.value = '';
            },

            showUpload(refName) {
                const input = this.$refs?.[refName];
                if (input) input.click();
            },

            removeLogo() {
                this.companyLogoBase64 = '';
                this.schoolLogo = '';
            },

            removeSignature() {
                this.signatureBase64 = '';
                this.signatureUrl = '';
            },

            // ================================================================
            // SCHOOL PROFILE — SAVE
            // ================================================================
            async saveProfile() {
                if (this.isLoading) return;

                if (!this.validateForm()) {
                    this.toastHandler('error', 'Please fix validation errors.');
                    return;
                }

                this.isLoading = true;

                try {
                    const payload = {
                        schoolName: asText(this.schoolName).trim(),
                        countryName: this.countryLabel === '—' ? '' : this.countryLabel,
                        cityName: this.cityLabel === '—' ? '' : this.cityLabel,
                        countryStateName: this.countryStateLabel === '—' ? '' : this.countryStateLabel,
                        phoneNo: asText(this.phoneNo).trim(),
                        address: asText(this.address).trim(),
                        countryId: this.countryId || this.emptyGuid,
                        countryStateId: this.countryStateId || this.emptyGuid,
                        cityId: this.cityId || this.emptyGuid,
                        email: asText(this.email).trim(),
                        senderId: asText(this.senderId).trim(),
                        clientId: asText(this.clientId).trim(),
                        clientSecret: asText(this.clientSecret),
                        registrationNo: asText(this.registrationNo).trim(),
                        enforceExamSecurity: Boolean(this.enforceExamSecurity),
                        schoolDays: asNumber(this.schoolDays, 0),
                        faxNo: asText(this.faxNo).trim(),
                        website: asText(this.website).trim(),
                        currentAcademicYearId: this.currentAcademicYearId || this.emptyGuid,
                        currentAcademicYearName: this.academicYearLabel === '—' ? '' : this.academicYearLabel,
                        subMetro: asText(this.subMetro).trim(),
                        circuit: asText(this.circuit).trim(),
                        currentTermId: this.currentTermId || this.emptyGuid,
                        currentTermName: this.termLabel === '—' ? '' : this.termLabel,

                        mailHostName: asText(this.mailHostName).trim(),
                        isSSLEnabled: Boolean(this.isSSLEnabled),
                        portNumber: asNumber(this.portNumber, 0),
                        primaryEmailAddress: asText(this.primaryEmailAddress).trim(),
                        emailPassword: this.emailPassword,

                        companyLogoBase64: stripDataUrl(this.companyLogoBase64),
                        signatureBase64: stripDataUrl(this.signatureBase64),
                        schoolLogo: asText(this.schoolLogo).trim(),
                        signatureUrl: asText(this.signatureUrl).trim(),
                        showSignature: Boolean(this.showSignature),
                        showSignatureOnResults: Boolean(this.showSignatureOnResults),
                        showSignatureOnBills: Boolean(this.showSignatureOnBills),
                        showSignatureOnStatement: Boolean(this.showSignatureOnStatement),
                        showSignatureOnReceipt: Boolean(this.showSignatureOnReceipt),

                        isClassPosition: Boolean(this.isClassPosition),
                        isSubjectPosition: Boolean(this.isSubjectPosition),
                        currencyId: this.currencyId || this.emptyGuid
                    };

                    const isUpdate = this.isSaved;
                    const url = isUpdate
                        ? ENDPOINTS.updateSchoolProfile
                        : ENDPOINTS.createSchoolProfile;

                    if (isUpdate){
                        payload.id = this.id;
                        payload.tenantId = this.tenantId;
                    } 

                    const response = await axios.post(url, payload);
                    const body = response.data || {};

                    if (body.code !== undefined && body.code !== 200 && body.success !== true) {
                        this.toastHandler('warning', body.message || 'Unable to save the school profile.');
                        return;
                    }

                    const newId = body.result?.id || body.id;
                    if (newId) this.id = newId;
                    await this.syncActiveAcademicYear(payload.currentAcademicYearId);
                    this.toastHandler('success', body.message || 'Saved successfully.');
                    await this.getSchoolProfile();
                } catch (error) {
                    console.error('saveProfile failed:', error && error.response ? error.response.data : error);
                    this.toastHandler('error', this.apiErrorMessage(error, 'Save failed.'));
                } finally {
                    this.isLoading = false;
                }
            },

            resetForm() {
                this.errors = {};
                this.getSchoolProfile();
                this.toastHandler('success', 'Form reloaded from the server.');
            },

            // ================================================================
            // LOOKUPS
            // ================================================================
            async getCountries() {
                try {
                    const response = await axios.get(
                        `${ENDPOINTS.countries}?v=${new Date().getTime()}`
                    );

                    this.countryList = unwrapList(response.data).map((country) => ({
                        ...country,
                        id: country.id ?? country.countryId,
                        name: this.getCountryName(country),
                        countryCode: this.getCountryCode(country)
                    }));
                } catch (error) {
                    console.error('Get countries error:', error);
                    this.countryList = [];
                    this.toastHandler('error', 'Unable to get countries.');
                }
            },
            async getCountryStates(countryId) {
                if (!countryId) {
                    this.countryStateList = [];
                    return;
                }

                try {
                    if (!this.allCountryStates.length) {
                        const response = await axios.get(ENDPOINTS.countryStates);
                        this.allCountryStates = unwrapList(response.data);
                    }

                    const country = this.countryList.find((item) =>
                        sameId(item.id, countryId)
                    );

                    this.countryStateList = this.allCountryStates
                        .filter((state) => this.matchesSelectedCountry(state, country))
                        .sort((a, b) => a.name.localeCompare(b.name));
                } catch (error) {
                    console.warn('Country states not available:', error);
                    this.countryStateList = [];
                }
            },

            async getCities(countryId, countryStateId = '') {
                if (!countryId) {
                    this.cityList = [];
                    return;
                }

                try {
                    if (!this.allCities.length) {
                        const response = await axios.get(ENDPOINTS.cities);
                        this.allCities = unwrapList(response.data);
                    }

                    const country = this.countryList.find((item) =>
                        sameId(item.id, countryId)
                    );

                    const selectedState = this.countryStateList.find((state) =>
                        sameId(state.id, countryStateId)
                    );

                    this.cityList = this.allCities
                        .filter((city) => this.matchesSelectedCountry(city, country))
                        .filter((city) => {
                            // If the selected region and city both have GeoNames admin codes,
                            // restrict the list to cities in that region.
                            if (!selectedState?.adminCode || !city.admin1) return true;
                            return sameId(city.admin1, selectedState.adminCode);
                        })
                        .sort((a, b) => a.name.localeCompare(b.name));
                } catch (error) {
                    console.warn('Cities not available:', error);
                    this.cityList = [];
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

            async getAcademicYears() {
                try {
                    const response = await axios.get(ENDPOINTS.academicYears);

                    this.academicYearList = unwrapList(response.data).map((year) => ({
                        ...year,
                        name: year.name || year.academicYearName || year.yearName || year.title || ''
                    }));
                } catch (error) {
                    console.warn('Academic years not available:', error);
                    this.academicYearList = [];
                }
            },
            async syncActiveAcademicYear(selectedId) {
                if (!selectedId || sameId(selectedId, EMPTY_GUID)) {
                    throw new Error('Please select an academic year.');
                }

                // Read fresh records, including their existing tenantId values.
                const response = await axios.get(ENDPOINTS.academicYears);
                const years = unwrapList(response.data);

                const selectedYear = years.find((year) => sameId(year.id, selectedId));

                if (!selectedYear) {
                    throw new Error('The selected academic year was not found.');
                }

                if (selectedYear.tenantId === undefined) {
                    throw new Error('The selected academic year has no tenantId.');
                }

                // Deactivate other active years, then activate the selected year.
                const yearsToUpdate = [
                    ...years.filter(
                        (year) => !sameId(year.id, selectedId) && year.isActive === true
                    ).map((year) => ({ year, isActive: false })),
                    ...(selectedYear.isActive === true
                        ? []
                        : [{ year: selectedYear, isActive: true }])
                ];

                for (const { year, isActive } of yearsToUpdate) {
                    if (year.tenantId === undefined) {
                        throw new Error(`Academic year ${year.id} has no tenantId.`);
                    }

                    const result = await axios.post(ENDPOINTS.updateAcademicYear, {
                        ...year,
                        id: year.id,
                        tenantId: year.tenantId,
                        isActive
                    });

                    const body = result.data || {};

                    if (
                        body.success === false ||
                        (body.code !== undefined && body.code !== 200 && body.success !== true)
                    ) {
                        throw new Error(body.message || 'Unable to update the academic year.');
                    }
                }
            },
            async getTerms() {
                try {
                    const response = await axios.get(ENDPOINTS.terms);

                    this.termList = unwrapList(response.data).map((term) => ({
                        ...term,
                        name: term.name || term.termName || term.title || ''
                    }));
                } catch (error) {
                    console.warn('Terms not available:', error);
                    this.termList = [];
                }
            }
        },

        watch: {
            countryId(value, oldValue) {
                if (this.isHydrating || sameId(value, oldValue)) return;

                this.countryStateId = '';
                this.cityId = '';
                this.countryStateList = [];
                this.cityList = [];

                this.getCountryStates(value);
            },

            countryStateId(value, oldValue) {
                if (this.isHydrating || sameId(value, oldValue)) return;

                this.cityId = '';
                this.getCities(this.countryId, value);
            },
            // Keep the selected term inside the selected academic year.
            currentAcademicYearId() {
                if (this.isHydrating || !this.currentTermId) return;

                const stillValid = this.termOptions.some((t) => sameId(t.id, this.currentTermId));
                if (!stillValid) this.currentTermId = '';
            }
        },

        async mounted() {
            this.isShimmerLoading = true;

            await Promise.all([
                this.getCountries(),
                this.getCurrencies(),
                this.getAcademicYears(),
                this.getTerms(),
                this.getSchoolProfile()
            ]);

            // Cascades depend on the saved ids, so they run after the profile loads.
            await Promise.all([
                this.getCountryStates(this.countryId),
                this.getCities(this.countryId, this.countryStateId)
            ]);

            this.isShimmerLoading = false;
        }
    });

    app.use(WSelectPlugin);
    app.mount('#app');
})();
