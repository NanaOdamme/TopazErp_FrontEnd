(function () {
    'use strict';

    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

    const val = (o, k) => {
        if (!o) return undefined;
        if (o[k] !== undefined) return o[k];
        const pascal = k.charAt(0).toUpperCase() + k.slice(1);
        if (o[pascal] !== undefined) return o[pascal];
        const lower = k.toLowerCase();
        for (const prop of Object.keys(o)) {
            if (prop.toLowerCase() === lower) return o[prop];
        }
        return undefined;
    };

    const isGuid = v =>
        typeof v === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim()) &&
        v.trim() !== EMPTY_GUID;

    const asGuid = v => (isGuid(v) ? v.trim() : EMPTY_GUID);

    const sameId = (a, b) =>
        String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

    const generateUuid = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    const unwrapList = (raw, preferredKey) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw.result !== undefined) return unwrapList(raw.result, preferredKey);
        if (preferredKey && Array.isArray(raw[preferredKey])) return raw[preferredKey];
        if (Array.isArray(raw.items)) return raw.items;
        if (Array.isArray(raw.data)) return raw.data;
        if (typeof raw === 'object') {
            const firstArr = Object.values(raw).find(v => Array.isArray(v));
            if (firstArr) return firstArr;
        }
        return [];
    };

    const normalizeLookups = list => (list || [])
        .map(o => ({
            id: val(o, 'id'),
            name: val(o, 'name') || val(o, 'displayName') || val(o, 'className') || '',
            className: val(o, 'className') || val(o, 'name') || ''
        }))
        .filter(o => o.id != null && (o.name !== '' || o.className !== ''))
        .sort((a, b) => (a.name || a.className).localeCompare(b.name || b.className));

    const normalizeClasses = list => (list || [])
        .map(c => ({
            id: val(c, 'id'),
            name: val(c, 'className') || val(c, 'name') || '',
            className: val(c, 'className') || val(c, 'name') || '',
            levelId: val(c, 'levelId') || EMPTY_GUID,
            levelName: val(c, 'levelName') || ''
        }))
        .filter(c => c.id != null && (c.name !== '' || c.className !== ''))
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeStudents = list => (list || [])
        .map(s => {
            const id = val(s, 'id') || val(s, 'studentId') || val(s, 'studentID');
            const firstName = val(s, 'firstName') || '';
            const lastName = val(s, 'lastName') || '';
            const otherName = val(s, 'otherName') || '';
            const fullName = val(s, 'studentName') || val(s, 'fullName') || [lastName, firstName, otherName].filter(Boolean).join(' ') || '';
            const identifier = String(val(s, 'studentIdentifier') || val(s, 'identifier') || val(s, 'admissionNumber') || '').trim();
            const classId = val(s, 'classId') || val(s, 'classID') || null;
            const className = val(s, 'className') || '';

            return {
                id,
                name: `${fullName}${identifier ? ' (' + identifier + ')' : ''}`,
                fullName,
                identifier,
                classId,
                className
            };
        })
        .filter(s => s.id != null && s.name !== '')
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const normalizeLevels = list => {
        const map = {};
        (list || []).forEach(c => {
            const id = val(c, 'levelId'), name = val(c, 'levelName');
            if (id && name && !map[String(id).toLowerCase()]) {
                map[String(id).toLowerCase()] = { id, name };
            }
        });
        return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
    };

    const normalizeFooterRecord = r => {
        const rawDetails = val(r, 'details') || [];
        const details = (Array.isArray(rawDetails) ? rawDetails : []).map(d => ({
            id: val(d, 'id') || generateUuid(),
            billFooterId: val(d, 'billFooterId') || val(r, 'id') || EMPTY_GUID,
            studentId: asGuid(val(d, 'studentId')),
            classId: asGuid(val(d, 'classId')),
            levelId: asGuid(val(d, 'levelId'))
        }));

        return {
            id: val(r, 'id'),
            tenantId: val(r, 'tenantId'),
            message: String(val(r, 'message') || '').trim(),
            academicYearId: asGuid(val(r, 'academicYearId')),
            academicYearName: val(r, 'academicYearName') || '',
            termId: asGuid(val(r, 'termId')),
            termName: val(r, 'termName') || '',
            toSchool: Boolean(val(r, 'toSchool')),
            toClass: Boolean(val(r, 'toClass')),
            orderNumber: Number(val(r, 'orderNumber')) || 0,
            details
        };
    };

    const app = Vue.createApp({
        data() {
            return {
                isShimmerLoading: false,
                saving: false,
                setupDone: false,
                theme: '#062a81',

                // Lookups
                academicYears: [],
                terms: [],
                classes: [],
                students: [],
                levels: [],

                // Main data list
                billFooters: []
            };
        },

        computed: {
            /**
             * Primary Master Grid Columns
             */
            footerColumns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false },
                    {
                        key: 'orderNumber',
                        label: 'Order',
                        type: 'number',
                        required: true,
                        width: 90,
                        defaultValue: (this.billFooters.length + 1)
                    },
                    {
                        key: 'toSchool',
                        label: 'To Whole School',
                        type: 'boolean',
                        width: 160,
                        defaultValue: false,
                        help: 'Display this bill footer across all students in the school.'
                    },
                    {
                        key: 'toClass',
                        label: 'To Specific Class',
                        type: 'boolean',
                        width: 160,
                        defaultValue: false,
                        help: 'Target specific classes or students via the expandable child Details table.'
                    },
                    {
                        key: 'message',
                        label: 'Footer Message',
                        type: 'text',
                        required: true,
                        searchable: true,
                        width: 320,
                        help: 'Note or announcement text appearing at the bottom of student bills.'
                    },
                    {
                        key: 'academicYearId',
                        label: 'Academic Year',
                        type: 'select',
                        required: true,
                        searchable: true,
                        width: 170,
                        options: this.academicYears,
                        value: 'id',
                        display: 'name',
                        defaultValue: this.academicYears.length ? this.academicYears[0].id : ''
                    },
                    {
                        key: 'termId',
                        label: 'Term',
                        type: 'select',
                        required: true,
                        searchable: true,
                        width: 150,
                        options: this.terms,
                        value: 'id',
                        display: 'name',
                        defaultValue: this.terms.length ? this.terms[0].id : ''
                    }
                ];
            },

            /**
             * Expandable Child Details Sub-Grid (matches MidTerm Remarks Headers child options style)
             */
            detailSubgrid() {
                return {
                    key: 'details',
                    title: 'Targeted Classes / Students / Levels',
                    columns: [
                        { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                        {
                            key: 'billFooterId',
                            label: 'BillFooter ID',
                            type: 'text',
                            hidden: true,
                            editable: false,
                            searchable: false,
                            defaultValue: (row, column, parentRow) => (parentRow && parentRow.id) || '',
                            disabled: true
                        },
                        {
                            key: 'classId',
                            label: 'Class',
                            type: 'select',
                            width: 240,
                            searchable: true,
                            options: [{ id: EMPTY_GUID, name: '— None / Not Specified —' }, ...this.classes],
                            value: 'id',
                            display: 'name',
                            defaultValue: EMPTY_GUID
                        },
                        {
                            key: 'studentId',
                            label: 'Specific Student (Optional)',
                            type: 'select',
                            width: 280,
                            searchable: true,
                            options: [{ id: EMPTY_GUID, name: '— None / All Students —' }, ...this.students],
                            value: 'id',
                            display: 'name',
                            defaultValue: EMPTY_GUID
                        },
                        {
                            key: 'levelId',
                            label: 'Level (Optional)',
                            type: 'select',
                            width: 200,
                            searchable: true,
                            options: [{ id: EMPTY_GUID, name: '— None / Any Level —' }, ...this.levels],
                            value: 'id',
                            display: 'name',
                            defaultValue: EMPTY_GUID
                        }
                    ]
                };
            },

            totalFootersCount() {
                return this.billFooters.length;
            },

            schoolFootersCount() {
                return this.billFooters.filter(f => f.toSchool === true).length;
            },

            classFootersCount() {
                return this.billFooters.filter(f => f.toClass === true).length;
            }
        },

        methods: {
            val,
            isGuid,
            asGuid,
            sameId,

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

            async fetchList(url, label, preferredKey = null) {
                try {
                    const response = await axios.get(url);
                    return unwrapList(response.data, preferredKey);
                } catch (error) {
                    this.toastHandler('error', `Failed to load ${label}.`);
                    return [];
                }
            },

            async getBillFooters() {
                this.isShimmerLoading = true;
                try {
                    const list = await this.fetchList('/SchoolManager/GetBillFooters/', 'Bill Footers');
                    this.billFooters = (list || []).map(r => normalizeFooterRecord(r));
                } catch (err) {
                    this.toastHandler('error', 'Failed to refresh bill footers.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async loadLookups() {
                this.isShimmerLoading = true;
                const stamp = new Date().getTime();
                const safeGet = p => p.catch(() => ({ data: { result: [] } }));

                try {
                    const [yearsRes, termsRes, classesRes, studentsRes] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        safeGet(axios.get(`/jsonDataSample/terms.json?v=${stamp}`)),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetStudentBios/')
                    ]);

                    const rawClasses = unwrapList(classesRes.data);
                    this.academicYears = normalizeLookups(unwrapList(yearsRes.data));
                    this.terms = normalizeLookups(unwrapList(termsRes.data));
                    this.classes = normalizeClasses(rawClasses);
                    this.levels = normalizeLevels(rawClasses);
                    this.students = normalizeStudents(unwrapList(studentsRes.data));

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', 'Error loading reference lookups.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildPayload(row) {
                const rawDetails = row.details || [];
                const details = (Array.isArray(rawDetails) ? rawDetails : []).map(d => ({
                    id: isGuid(d.id) ? d.id : generateUuid(),
                    billFooterId: isGuid(d.billFooterId) ? d.billFooterId : (isGuid(row.id) ? row.id : EMPTY_GUID),
                    studentId: this.asGuid(d.studentId),
                    classId: this.asGuid(d.classId),
                    levelId: this.asGuid(d.levelId)
                }));

                const payload = {
                    message: String(row.message || '').trim(),
                    academicYearId: this.asGuid(row.academicYearId),
                    termId: this.asGuid(row.termId),
                    toSchool: Boolean(row.toSchool),
                    toClass: Boolean(row.toClass),
                    orderNumber: Number(row.orderNumber) || 0,
                    details
                };

                if (row.id) {
                    payload.id = row.id;
                    if (row.tenantId !== undefined && row.tenantId !== null) {
                        payload.tenantId = row.tenantId;
                    }
                }

                return payload;
            },

            /* ==========================================================
             * DataGrid Multi-Level Dispatch (like MidTerm Remarks Headers)
             * level 0 = Master BillFooter row
             * level 1 = Details sub-grid row
             * ========================================================== */
            async onCreate(event) {
                const row = event?.row || event?.data;
                const level = Number(event?.level ?? 0);
                if (!row) return;

                if (level === 0) {
                    await this.createFooter(row);
                    return;
                }

                // Level 1: child detail line
                const parentFooterId = event?.grid?.parentRow?.id || row.billFooterId;
                if (!parentFooterId) {
                    this.toastHandler('error', 'Parent bill footer was not found for this detail item.');
                    return;
                }

                row.billFooterId = parentFooterId;
                await this.saveFooterDetail(parentFooterId, row, 'create');
            },

            async onUpdate(event) {
                const row = event?.row || event?.data;
                const level = Number(event?.level ?? 0);
                if (!row) return;

                if (level === 0) {
                    await this.updateFooter(row);
                    return;
                }

                // Level 1: child detail line
                const parentFooterId = event?.grid?.parentRow?.id || row.billFooterId;
                if (!parentFooterId) {
                    this.toastHandler('error', 'Parent bill footer was not found for this detail item.');
                    return;
                }

                row.billFooterId = parentFooterId;
                await this.saveFooterDetail(parentFooterId, row, 'update');
            },

            async onDelete(event) {
                const rows = Array.isArray(event?.rows) ? event.rows : (event?.row ? [event.row] : []);
                const level = Number(event?.level ?? 0);
                if (!rows.length) return;

                if (level === 0) {
                    await this.deleteFooters(rows);
                    return;
                }

                if (level === 1) {
                    const parentFooterId =
                        event?.grid?.parentRow?.id ||
                        rows.find(r => r.billFooterId)?.billFooterId;

                    if (!parentFooterId) {
                        this.toastHandler('error', 'Parent bill footer was not found for these details.');
                        return;
                    }

                    await this.deleteFooterDetails(parentFooterId, rows);
                }
            },

            /* ==========================================================
             * Level 0 Operations: BillFooter Header
             * ========================================================== */
            async createFooter(row) {
                if (!String(row.message || '').trim()) {
                    return this.toastHandler('warning', 'Footer message is required.');
                }
                if (!row.academicYearId || row.academicYearId === EMPTY_GUID) {
                    return this.toastHandler('warning', 'Please select an Academic Year.');
                }
                if (!row.termId || row.termId === EMPTY_GUID) {
                    return this.toastHandler('warning', 'Please select a Term.');
                }

                this.isShimmerLoading = true;
                const record = this.buildPayload(row);

                try {
                    const res = await axios.post('/SchoolManager/CreateBillFooter/', record);
                    const result = res.data?.result || res.data;

                    if (res.data?.success === false || (result?.code && result.code !== 200)) {
                        this.toastHandler('error', result?.message || res.data?.error?.message || 'Failed to create bill footer.');
                        await this.getBillFooters();
                        return;
                    }

                    this.toastHandler('success', 'Bill footer created successfully.');
                    await this.getBillFooters();
                } catch (error) {
                    console.error('Bill footer create failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to create bill footer.');
                    await this.getBillFooters();
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async updateFooter(row) {
                const rawId = row.id;
                const id = typeof rawId === 'object' ? rawId?.id : rawId;

                const existing = this.billFooters.find(item => this.sameId(item.id, id));
                if (!existing) {
                    this.toastHandler('error', 'Bill footer record not found.');
                    return;
                }

                if (!String(row.message || '').trim()) {
                    return this.toastHandler('warning', 'Footer message cannot be empty.');
                }

                this.isShimmerLoading = true;
                const record = this.buildPayload({ ...existing, ...row, id: existing.id, tenantId: existing.tenantId });

                try {
                    const res = await axios.post('/SchoolManager/UpdateBillFooter/', record);
                    if (res.data && res.data.success === false) {
                        this.toastHandler('error', res.data.message || 'Failed to update bill footer.');
                        await this.getBillFooters();
                        return;
                    }

                    this.toastHandler('success', 'Bill footer updated successfully.');
                    await this.getBillFooters();
                } catch (error) {
                    console.error('Bill footer update failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to update bill footer.');
                    await this.getBillFooters();
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            async deleteFooters(rows) {
                if (typeof Swal !== 'undefined') {
                    const result = await Swal.fire({
                        icon: 'warning',
                        title: 'Delete Bill Footer?',
                        text: `Are you sure you want to delete ${rows.length} bill footer(s)? This cannot be undone.`,
                        showCancelButton: true,
                        confirmButtonText: 'Yes, delete',
                        cancelButtonText: 'Cancel',
                        confirmButtonColor: '#dc2626',
                        cancelButtonColor: '#64748b',
                        reverseButtons: true
                    });

                    if (!result.isConfirmed) return;
                }

                this.isShimmerLoading = true;
                try {
                    for (const row of rows) {
                        const id = typeof row.id === 'object' ? row.id?.id : row.id;
                        if (!id) continue;

                        const res = await axios.get(`/SchoolManager/DeleteBillFooter?id=${encodeURIComponent(id)}`);
                        if (res.data?.success === false) {
                            this.toastHandler('error', res.data.message || 'Failed to delete bill footer.');
                            return;
                        }
                    }

                    this.toastHandler('success', 'Bill footer deleted successfully.');
                    await this.getBillFooters();
                } catch (error) {
                    console.error('Bill footer deletion failed:', error);
                    this.toastHandler('error', error.response?.data?.message || 'Failed to delete bill footer.');
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            /* ==========================================================
             * Level 1 Operations: BillFooter Detail Items
             * Embeds details in parent BillFooter and updates parent record
             * ========================================================== */
            async saveFooterDetail(parentFooterId, detailRow, action) {
                const existing = this.billFooters.find(f => this.sameId(f.id, parentFooterId));
                if (!existing) {
                    this.toastHandler('error', 'Parent bill footer not found.');
                    return;
                }

                // Make sure at least one target scope is set
                const classId = this.asGuid(detailRow.classId);
                const studentId = this.asGuid(detailRow.studentId);
                const levelId = this.asGuid(detailRow.levelId);

                if (classId === EMPTY_GUID && studentId === EMPTY_GUID && levelId === EMPTY_GUID) {
                    this.toastHandler('warning', 'Please select at least a Class, Student, or Level for this detail entry.');
                    return;
                }

                let details = [...(existing.details || [])];
                const detailItem = {
                    id: isGuid(detailRow.id) ? detailRow.id : generateUuid(),
                    billFooterId: existing.id,
                    classId,
                    studentId,
                    levelId
                };

                if (action === 'create') {
                    // Check duplicate target in this footer
                    const dupe = details.find(d =>
                        d.id !== detailRow.id &&
                        d.classId === classId &&
                        d.studentId === studentId &&
                        d.levelId === levelId
                    );
                    if (dupe) {
                        this.toastHandler('warning', 'This class/student/level target is already added to this footer.');
                        return;
                    }
                    details = details.filter(d => d.id !== detailRow.id);
                    details.push(detailItem);
                } else {
                    details = details.map(item => item.id === detailRow.id ? detailItem : item);
                }

                await this.saveFooterWithDetails(existing, details, action);
            },

            async deleteFooterDetails(parentFooterId, rows) {
                if (!parentFooterId || !Array.isArray(rows) || !rows.length) return;

                const existing = this.billFooters.find(f => this.sameId(f.id, parentFooterId));
                if (!existing) {
                    this.toastHandler('error', 'Parent bill footer was not found.');
                    await this.getBillFooters().catch(() => {});
                    return;
                }

                const deletedIds = new Set(
                    rows
                        .map(r => r.id)
                        .filter(id => id != null)
                        .map(id => String(id).toLowerCase())
                );

                const remainingDetails = (existing.details || []).filter(d =>
                    !deletedIds.has(String(d.id || '').toLowerCase())
                );

                await this.saveFooterWithDetails(existing, remainingDetails, 'delete');
            },

            async saveFooterWithDetails(footer, details, action) {
                const payload = {
                    ...footer,
                    tenantId: footer.tenantId,
                    toClass: true, // auto-ensure toClass is true when specific details exist
                    details: details.map(d => ({
                        id: isGuid(d.id) ? d.id : generateUuid(),
                        billFooterId: footer.id,
                        classId: this.asGuid(d.classId),
                        studentId: this.asGuid(d.studentId),
                        levelId: this.asGuid(d.levelId)
                    }))
                };

                this.isShimmerLoading = true;
                try {
                    await axios.post('/SchoolManager/UpdateBillFooter/', payload);
                    await this.getBillFooters();
                    const message = action === 'create'
                        ? 'Target detail saved.'
                        : action === 'update'
                            ? 'Target detail updated.'
                            : 'Target detail(s) removed.';
                    this.toastHandler('success', message);
                } catch (err) {
                    console.error('Failed updating footer with details:', err);
                    this.toastHandler('error', err.response?.data?.message || 'Failed to save footer detail.');
                    await this.getBillFooters();
                } finally {
                    this.isShimmerLoading = false;
                }
            }
        },

        async mounted() {
            await this.loadLookups();
            await this.getBillFooters();
        }
    });

    if (typeof DataGridPlugin !== 'undefined') {
        app.use(DataGridPlugin);
    }
    if (typeof WSelectPlugin !== 'undefined') {
        app.use(WSelectPlugin);
    }

    app.mount('#app');
})();
