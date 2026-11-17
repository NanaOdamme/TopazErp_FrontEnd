(() => {
    'use strict';

    const isoDate = (date) => {
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    };

    const today = isoDate(new Date());

    const app = Vue.createApp({
        data() {
            return {
                theme: '#062a81',
                isShimmerLoading: false,
                payload: {},
                academicYearList: [],
                termList: [],
                termDetails: [],
                actualLevelList: [],
                levelName:'',
                terms: [],
            }
        },
        computed: {
            academicYearColumns(){
                return [
                    { key: 'id',            label: 'ID',             type: 'text',   hidden: true, width: 74 },
                    { key: 'name',          label: 'Name',      type: 'text', width: 250, minWidth: 250, required: true, searchable: true},
                    { key: 'startDate',      label: 'Start Date',      type: 'date',   width: 130, searchable: true, defaultValue: today },
                    { key: 'endDate',      label: 'End Date',      type: 'date',   width: 130, searchable: true, defaultValue: today },
                    { key: 'isActive',      label: 'Current Year?',      type: 'boolean',   width: 130, searchable: true  },
                    { key: 'tenantId',      label: 'Tenant',         type: 'number', hidden: true }
                ];

            },
            termCol() {
                return {
                    key: 'academicYearTerms',
                    title: 'Terms',
                    columns: [
                        { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                        {
                            key: 'academicYearId',
                            label: 'AcademicYear',
                            type: 'select',
                            options: this.academicYearList,
                            display: 'name',
                            value: 'id',
                            width: 220,
                            defaultValue: (row, column, parentRow) => parentRow?.id ?? '',
                            disabled: true

                        },
                        { key: 'termId', label: 'Term', type: 'select', options: this.terms, display: 'name', value: 'id', width: 220 },
                        { key: 'ordinal', label: 'Ordinal', type: 'number', defaultValue: 1, width: 220 },
                        { key: 'startDate',      label: 'Start Date',      type: 'date',   width: 130, searchable: true, defaultValue: today },
                        { key: 'endDate',      label: 'End Date',      type: 'date',   width: 130, searchable: true, defaultValue: today },
                        { key: 'actualLevelId', label: 'Actual Level', type: 'select', options: this.actualLevelList, display: 'name', value: 'id', width: 220 },
                        { key: 'tenantId',      label: 'Tenant',         type: 'number', hidden: true }
                    ],
                    child: {
                        key: 'termDetails',
                        title: 'Term Activities',
                        columns: this.termDetailsColumns
                    }
                };
            },
            termDetailsColumns(){
                return [
                    { key: 'id', label: 'ID', type: 'text',   hidden: true, width: 74 },
                    {
                        key: 'academicYearTermId',
                        label: 'Term',
                        type: 'select',
                        options: this.termList,
                        display: 'termName',
                        value: 'id',
                        width: 220,
                        defaultValue: (row, column, parentRow) => parentRow?.id ?? '',
                        disabled: true
                    },
                    { key: 'activityDescription', label: 'Activity Description', type: 'text', width: 250, minWidth: 250, required: true, searchable: true},
                    { key: 'startDate',      label: 'Start Date',      type: 'date',   width: 130, searchable: true, defaultValue: today },
                    { key: 'endDate',      label: 'End Date',      type: 'date',   width: 130, searchable: true, defaultValue: today }
                ];
            },
        },
        methods: {
            // Setup Data Loading with nested allocation and default values
            getSetupData() {
                this.isShimmerLoading = true;
                return Promise.all([
                    axios.get('/SchoolManager/GetAcademicYears'),
                    axios.get('/SchoolManager/GetAcademicYearTerms'),
                    axios.get('/SchoolManager/GetAcademicYearTermDetails'),
                    axios.get(`/jsonDataSample/actualLevels.json?v=${new Date().getTime()}`),
                    axios.get(`/jsonDataSample/terms.json?v=${new Date().getTime()}`),
                ]).then(([academicYears, terms, termDetails, actualLevels, allTerms]) => {
                    // Base lists
                    const rawYears = academicYears.data.result || [];
                    const rawTerms = terms.data.result || [];
                    const rawDetails = termDetails.data.result || [];

                    this.actualLevelList = actualLevels.data || [];
                    this.terms = allTerms.data || [];

                    // Allocate terms under academic years with default academicYearId and isDisabled: true
                    this.academicYearList = rawYears.map(year => {
                        // Find terms belonging to this academic year
                        const yearTerms = rawTerms
                            .filter(t => t.academicYearId === year.id)
                            .map(term => ({
                                ...term,
                                // Ensure academicYearId defaults to parent ID and is disabled in grid
                                academicYearId: year.id,
                                isDisabled: true // For grid column configuration
                            }));

                        // Allocate term details under each term
                        yearTerms.forEach(term => {
                            term.termDetails = rawDetails
                                .filter(d => d.academicYearTermId === term.id)
                                .map(detail => ({
                                    ...detail,
                                    // Ensure academicYearTermId defaults to parent term ID and is disabled
                                    academicYearTermId: term.id,
                                    isDisabled: true // For grid column configuration
                                }));
                        });

                        return {
                            ...year,
                            academicYearTerms: yearTerms
                        };
                    });

                    // Also keep flat lists for dropdowns (with default values)
                    this.termList = rawTerms.map(t => ({
                        ...t,
                        academicYearId: t.academicYearId, // Default from parent
                        isDisabled: false // Available for selection in dropdowns
                    }));
                    this.termDetails = rawDetails.map(d => ({
                        ...d,
                        academicYearTermId: d.academicYearTermId, // Default from parent
                        isDisabled: false // Available for selection in dropdowns
                    }));

                    this.isShimmerLoading = false;
                }).catch(err => {
                    this.isShimmerLoading = false;
                    this.toastHandler('error', 'Unable to load setups.');
                });
            },

            // Data Retrieval Helpers
            getAcademicYearDetails(id) {
                return this.academicYearList.find(a => a.id === id);
            },
            getAcademicYearTermDetails(id) {
                return this.termList.find(t => t.id === id);
            },
            getTermDetails(id) {
                return this.termDetails.find(d => d.id === id);
            },

            // Toast Handler
            toastHandler(type, message = 'An unexpected error occurred.') {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                        title: message,
                        showConfirmButton: false,
                        timer: 4000,
                        timerProgressBar: true
                    });
                } else {
                    console.log(`[${type.toUpperCase()}] ${message}`);
                }
            },

            // UUID Generator
            uuid() {
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                );
            },

            // Date Validation
            validateDates(startDate, endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                return end >= start;
            },

            // Range Validation (Terms within Academic Year, Details within Term)
            validateTermRange(academicYearId, termStartDate, termEndDate) {
                const year = this.getAcademicYearDetails(academicYearId);
                if (!year) return true; // No parent year found, skip validation

                const yearStart = new Date(year.startDate);
                const yearEnd = new Date(year.endDate);
                const termStart = new Date(termStartDate);
                const termEnd = new Date(termEndDate);

                return termStart >= yearStart && termEnd <= yearEnd;
            },

            validateDetailRange(termId, detailStartDate, detailEndDate) {
                const term = this.getAcademicYearTermDetails(termId);
                if (!term) return true; // No parent term found, skip validation

                const termStart = new Date(term.startDate);
                const termEnd = new Date(term.endDate);
                const detailStart = new Date(detailStartDate);
                const detailEnd = new Date(detailEndDate);

                return detailStart >= termStart && detailEnd <= termEnd;
            },

            // --- CRUD HANDLERS FOR DATA GRID ---

            // @create handler
            async onCreate(event) {
                const row = event?.row || event?.data;
                const level = event?.level || 0; // 0 = AcademicYear, 1 = Term, 2 = TermDetail

                if (!row) return;

                if (level === 0) {
                    // Check if another year is already active
                    const activeYear = this.academicYearList.find(y => y.isActive === true);
                    if (row.isActive && activeYear && activeYear.id !== row.id) {
                        this.toastHandler('error', 'Only one Academic Year can be active. Please deactivate the current active year first.');
                        return;
                    }
                    await this.createAcademicYear(row);
                } else if (level === 1) {
                    // Set default academicYearId from parent grid context
                    const parentYearId = event?.grid?.parentLabelData?.id || row.academicYearId;
                    if (parentYearId) row.academicYearId = parentYearId;

                    // Validate range against parent Academic Year
                    const parentYear = this.getAcademicYearDetails(parentYearId);
                    if (parentYear && !this.validateTermRange(parentYear.id, row.startDate, row.endDate)) {
                        this.toastHandler('error', 'Term dates must be within the Academic Year range.');
                        return;
                    }

                    await this.createAcademicYearTerm(row, event?.grid);
                } else if (level === 2) {
                    // Set default academicYearTermId from parent grid context
                    const parentTermId = event?.grid?.parentLabelData?.id || row.academicYearTermId;
                    if (parentTermId) row.academicYearTermId = parentTermId;

                    // Validate range against parent Term
                    const parentTerm = this.getAcademicYearTermDetails(parentTermId);
                    if (parentTerm && !this.validateDetailRange(parentTerm.id, row.startDate, row.endDate)) {
                        this.toastHandler('error', 'Term Detail dates must be within the Term range.');
                        return;
                    }

                    await this.createAcademicYearTermDetail(row, event?.grid);
                }
            },

            // @update handler
            async onUpdate(event) {
                const row = event?.row || event?.data;
                const level = event?.level || 0;

                if (!row) return;

                if (level === 0) {
                    // Check if another year is already active (excluding current row)
                    const activeYear = this.academicYearList.find(y => y.isActive === true && y.id !== row.id);
                    if (row.isActive && activeYear) {
                        this.toastHandler('error', 'Only one Academic Year can be active. Please deactivate the current active year first.');
                        return;
                    }
                    await this.updateAcademicYear(row);
                } else if (level === 1) {
                    // Validate range against parent Academic Year
                    const parentYearId = row.academicYearId;
                    const parentYear = this.getAcademicYearDetails(parentYearId);
                    if (parentYear && !this.validateTermRange(parentYear.id, row.startDate, row.endDate)) {
                        this.toastHandler('error', 'Term dates must be within the Academic Year range.');
                        return;
                    }
                    await this.updateAcademicYearTerm(row, event?.grid);
                } else if (level === 2) {
                    // Validate range against parent Term
                    const parentTermId = row.academicYearTermId;
                    const parentTerm = this.getAcademicYearTermDetails(parentTermId);
                    if (parentTerm && !this.validateDetailRange(parentTerm.id, row.startDate, row.endDate)) {
                        this.toastHandler('error', 'Term Detail dates must be within the Term range.');
                        return;
                    }
                    await this.updateAcademicYearTermDetail(row, event?.grid);
                }
            },

            // @delete handler
            async onDelete(event) {
                const rows = event?.rows;
                const level = event?.level || 0;

                if (!Array.isArray(rows) || !rows.length) return;

                if (level === 0) {
                    await this.deleteAcademicYears(rows);
                } else if (level === 1) {
                    await this.deleteAcademicYearTerms(rows, event?.grid);
                } else if (level === 2) {
                    await this.deleteAcademicYearTermDetails(rows, event?.grid);
                }
            },

            // --- ACADEMIC YEAR CRUD ---
            async createAcademicYear(row) {
                if (!this.validateDates(row.startDate, row.endDate)) {
                    this.toastHandler('error', 'End date cannot be less than start date.');
                    return;
                }
                // Check if another year is already active (excluding current row)
                const activeYear = this.academicYearList.find(y => y.isActive === true && y.id !== row.id);
                if (row.isActive && activeYear) {
                    this.toastHandler('error', 'Only one Academic Year can be active. Please deactivate the current active year first.');
                    this.getSetupData();
                    return;
                }
                // Exclude id and tenantId for creation (payload only contains form fields)
                const payload = {
                    name: row.name,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    isActive: row.isActive
                };

                this.isShimmerLoading = true;
                try {
                    const response = await axios.post('/SchoolManager/CreateAcademicYear', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Academic Year created successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to create Academic Year.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async updateAcademicYear(row) {
                if (!this.validateDates(row.startDate, row.endDate)) {
                    this.toastHandler('error', 'End date cannot be less than start date.');
                    return;
                }

                // Check if another year is already active (excluding current row)
                const activeYear = this.academicYearList.find(y => y.isActive === true && y.id !== row.id);
                if (row.isActive && activeYear) {
                    this.toastHandler('error', 'Only one Academic Year can be active. Please deactivate the current active year first.');
                    this.getSetupData();
                    return;
                }

                // Include id and tenantId from existing data (not assumed)
                const existing = this.getAcademicYearDetails(row.id);
                const payload = {
                    ...row,
                    id: existing?.id || row.id,
                    tenantId: existing?.tenantId || row.tenantId,
                    name: row.name,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    isActive: row.isActive
                };

                this.isShimmerLoading = true;
                try {
                    const response = await axios.post('/SchoolManager/UpdateAcademicYear', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Academic Year updated successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to update Academic Year.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async deleteAcademicYears(rows) {
                this.isShimmerLoading = true;
                try {
                    const results = await Promise.allSettled(
                        rows.map(r => axios.get('/SchoolManager/DeleteAcademicYear?id=' + r.id))
                    );

                    const failed = results.filter(r => r.status === 'rejected').length;
                    if (failed) {
                        this.toastHandler('warning', `${rows.length - failed} Academic Year(s) deleted; ${failed} failed.`);
                    } else {
                        this.toastHandler('success', `${rows.length} Academic Year(s) deleted successfully.`);
                    }
                    await this.getSetupData();
                } catch (error) {
                    this.toastHandler('error', 'Failed to delete Academic Year(s).');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            // --- ACADEMIC YEAR TERM CRUD ---
            async createAcademicYearTerm(row, grid) {
                if (!this.validateDates(row.startDate, row.endDate)) {
                    this.toastHandler('error', 'End date cannot be less than start date.');
                    return;
                }

                // Validate range against parent Academic Year
                const parentYearId = row.academicYearId;
                const parentYear = this.getAcademicYearDetails(parentYearId);
                if (parentYear && !this.validateTermRange(parentYear.id, row.startDate, row.endDate)) {
                    this.toastHandler('error', 'Term dates must be within the Academic Year range.');
                    return;
                }

                // Exclude id and tenantId for creation, use default parent ID
                const payload = {
                    academicYearId: parentYearId || row.academicYearId,
                    academicYearName: row.academicYearName || '',
                    termId: row.termId,
                    termName: row.termName || '',
                    ordinal: row.ordinal || 1,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    actualLevelId: row.actualLevelId,
                    actualLevelName: row.actualLevelName || ''
                };

                this.isShimmerLoading = true;
                try {
                    const response = await axios.post('/SchoolManager/CreateAcademicYearTerm', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Academic Year Term created successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to create Academic Year Term.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async updateAcademicYearTerm(row, grid) {
                if (!this.validateDates(row.startDate, row.endDate)) {
                    this.toastHandler('error', 'End date cannot be less than start date.');
                    return;
                }

                // Validate range against parent Academic Year
                const parentYearId = row.academicYearId;
                const parentYear = this.getAcademicYearDetails(parentYearId);
                if (parentYear && !this.validateTermRange(parentYear.id, row.startDate, row.endDate)) {
                    this.toastHandler('error', 'Term dates must be within the Academic Year range.');
                    return;
                }

                // Include id and tenantId from existing data (not assumed)
                const existing = this.getAcademicYearTermDetails(row.id);
                const payload = {
                    ...row,
                    id: existing?.id || row.id,
                    tenantId: existing?.tenantId || row.tenantId,
                    academicYearId: row.academicYearId,
                    academicYearName: row.academicYearName || '',
                    termId: row.termId,
                    termName: row.termName || '',
                    ordinal: row.ordinal || 1,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    actualLevelId: row.actualLevelId,
                    actualLevelName: row.actualLevelName || ''
                };

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/UpdateAcademicYearTerm', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Academic Year Term updated successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to update Academic Year Term.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async deleteAcademicYearTerms(rows, grid) {
                this.isShimmerLoading = true;
                try {
                    const results = await Promise.allSettled(
                        rows.map(r => axios.get('/SchoolManager/DeleteAcademicYearTerm?id='+ r.id))
                    );

                    const failed = results.filter(r => r.status === 'rejected').length;
                    if (failed) {
                        this.toastHandler('warning', `${rows.length - failed} Term(s) deleted; ${failed} failed.`);
                    } else {
                        this.toastHandler('success', `${rows.length} Term(s) deleted successfully.`);
                    }
                    await this.getSetupData();
                } catch (error) {
                    this.toastHandler('error', 'Failed to delete Term(s).');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            // --- ACADEMIC YEAR TERM DETAIL CRUD ---
            async createAcademicYearTermDetail(row, grid) {
                if (!this.validateDates(row.startDate, row.endDate)) {
                    this.toastHandler('error', 'End date cannot be less than start date.');
                    return;
                }

                // Validate range against parent Term
                const parentTermId = row.academicYearTermId;
                const parentTerm = this.getAcademicYearTermDetails(parentTermId);
                if (parentTerm && !this.validateDetailRange(parentTerm.id, row.startDate, row.endDate)) {
                    this.toastHandler('error', 'Term Detail dates must be within the Term range.');
                    return;
                }

                // Exclude id and tenantId for creation, use default parent ID
                const payload = {
                    academicYearTermId: row.academicYearTermId,
                    academicYearTermName: row.academicYearTermName || '',
                    activityDescription: row.activityDescription,
                    startDate: row.startDate,
                    endDate: row.endDate
                };

                this.isShimmerLoading = true;
                try {
                    const response = await axios.post('/SchoolManager/CreateAcademicYearTermDetail', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Academic Year Term Detail created successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to create Academic Year Term Detail.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async updateAcademicYearTermDetail(row, grid) {
                if (!this.validateDates(row.startDate, row.endDate)) {
                    this.toastHandler('error', 'End date cannot be less than start date.');
                    return;
                }

                // Validate range against parent Term
                const parentTermId = row.academicYearTermId;
                const parentTerm = this.getAcademicYearTermDetails(parentTermId);
                if (parentTerm && !this.validateDetailRange(parentTerm.id, row.startDate, row.endDate)) {
                    this.toastHandler('error', 'Term Detail dates must be within the Term range.');
                    return;
                }

                // Include id and tenantId from existing data (not assumed)
                const existing = this.getTermDetails(row.id);
                const payload = {
                    ...row,
                    id: existing?.id || row.id,
                    tenantId: existing?.tenantId || row.tenantId,
                    academicYearTermId: row.academicYearTermId, // Keep parent ID
                    academicYearTermName: row.academicYearTermName || '',
                    activityDescription: row.activityDescription,
                    startDate: row.startDate,
                    endDate: row.endDate
                };

                this.isShimmerLoading = true;
                try {
                    const response = await axios.post('/SchoolManager/UpdateAcademicYearTermDetail', payload);
                    await this.getSetupData();
                    this.toastHandler('success', 'Academic Year Term Detail updated successfully.');
                } catch (error) {
                    this.toastHandler('error', 'Failed to update Academic Year Term Detail.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async deleteAcademicYearTermDetails(rows, grid) {
                this.isShimmerLoading = true;
                try {
                    const results = await Promise.allSettled(
                        rows.map(r => axios.get('/SchoolManager/DeleteAcademicYearTermDetail?id=' + r.id))
                    );

                    const failed = results.filter(r => r.status === 'rejected').length;
                    if (failed) {
                        this.toastHandler('warning', `${rows.length - failed} Term Detail(s) deleted; ${failed} failed.`);
                    } else {
                        this.toastHandler('success', `${rows.length} Term Detail(s) deleted successfully.`);
                    }
                    await this.getSetupData();
                } catch (error) {
                    this.toastHandler('error', 'Failed to delete Term Detail(s).');
                } finally {
                    this.isShimmerLoading = false;
                }
            },
            
        },

        mounted() {
            this.getSetupData();
        },
    });

    // Use DataGridPlugin and WSelectPlugin
    app.use(DataGridPlugin);
    app.use(WSelectPlugin);
    app.mount('#app');
})();
