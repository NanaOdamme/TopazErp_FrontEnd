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

    const errMsg = err =>
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.title)) ||
        (err && err.message) ||
        'Something went wrong.';

    const toastHandler = (type, message) => {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                icon: type,
                title: message
            });
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    };

    const normalizeLookups = list => (list || [])
        .map(o => ({
            id: val(o, 'id'),
            name: val(o, 'name') || val(o, 'displayName') || ''
        }))
        .filter(o => o.id != null && o.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeClasses = list => (list || [])
        .map(c => ({
            id: val(c, 'id'),
            name: val(c, 'className') || val(c, 'name') || ''
        }))
        .filter(c => c.id != null && c.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeTeachers = list => {
        const raw = list || [];
        return raw
            .filter(t => t && (t.isTeacher === true || String(t.isTeacher).toLowerCase() === 'true'))
            .map(t => {
                const id = val(t, 'id') || val(t, 'staffId');
                const firstName = String(val(t, 'firstName') || '').trim();
                const otherName = String(val(t, 'otherName') || '').trim();
                const lastName = String(val(t, 'lastName') || '').trim();
                const combined = [firstName, otherName, lastName].filter(Boolean).join(' ').trim();
                const name = combined || String(val(t, 'name') || val(t, 'fullName') || val(t, 'staffName') || '').trim();

                return {
                    id: id ? String(id) : undefined,
                    name: name || 'Teacher',
                    isTeacher: true
                };
            })
            .filter(t => t.id != null && t.name !== '')
            .sort((a, b) => a.name.localeCompare(b.name));
    };

    const normalizeTeacherClass = t => {
        const id = val(t, 'id');
        return {
            id: id ? String(id) : undefined,
            staffId: asGuid(val(t, 'staffId')),
            staffName: String(val(t, 'staffName') || '').trim(),
            classId: asGuid(val(t, 'classId')),
            className: String(val(t, 'className') || '').trim(),
            academicYearId: asGuid(val(t, 'academicYearId')),
            academicYearName: String(val(t, 'academicYearName') || '').trim(),
            tenantId: val(t, 'tenantId') !== undefined ? Number(val(t, 'tenantId')) : undefined
        };
    };

    const app = Vue.createApp({
        data() {
            return {
                setupDone: false,
                isShimmerLoading: true,
                theme: '#062a81',

                // Lookups
                academicYears: [],
                classes: [],
                teachers: [],

                // Active filter: Academic Year
                academicYearId: '',

                // Stored records
                teacherClasses: []
            };
        },

        computed: {
            academicYearOptions() {
                return [
                    { id: '', name: 'All Academic Years' },
                    ...(this.academicYears || [])
                ];
            },

            // Filter data-grid rows by selected academic year if chosen
            filteredTeacherClasses() {
                if (!this.academicYearId) return this.teacherClasses || [];
                const yearId = String(this.academicYearId).toLowerCase();
                return (this.teacherClasses || []).filter(tc =>
                    String(tc.academicYearId).toLowerCase() === yearId
                );
            },

            columns() {
                return [
                    { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false },
                    {
                        key: 'academicYearId',
                        label: 'Academic Year',
                        type: 'select',
                        required: true,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '200',
                        options: this.academicYears,
                        display: 'name',
                        value: 'id'
                    },
                    {
                        key: 'classId',
                        label: 'Class',
                        type: 'select',
                        required: true,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '220',
                        options: this.classes,
                        display: 'name',
                        value: 'id'
                    },
                    {
                        key: 'staffId',
                        label: 'Teacher / Staff',
                        type: 'select',
                        required: true,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '260',
                        options: this.teachers,
                        value: 'id',
                        display:'name'
                    },
                    { key: 'academicYearName', label: 'Year Name', type: 'text', hidden: true, editable: false },
                    { key: 'className', label: 'Class Name', type: 'text', hidden: true, editable: false },
                    { key: 'staffName', label: 'Teacher Name', type: 'text', hidden: true, editable: false },
                    { key: 'tenantId', label: 'Tenant', type: 'number', hidden: true, editable: false }
                ];
            }
        },

        mounted() {
            this.getSetupData();
        },

        methods: {
            errMsg,
            toastHandler,
            val,
            isGuid,
            asGuid,

            nameOf(list, id) {
                const item = (list || []).find(x => String(x.id).toLowerCase() === String(id || '').toLowerCase());
                return item ? item.name : '';
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const [yearsRes, classesRes, staffRes, tcRes] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetStaffBios/'),
                        axios.get('/SchoolManager/GetTeacherClasses/')
                    ]);

                    this.academicYears = normalizeLookups(yearsRes.data && (yearsRes.data.result || yearsRes.data));
                    this.classes = normalizeClasses(classesRes.data && (classesRes.data.result || classesRes.data));
                    const staffList = (staffRes.data && (staffRes.data.result || staffRes.data)) || [];
                    this.teachers = normalizeTeachers(staffList);

                    const rawTC = (tcRes.data && (tcRes.data.result || tcRes.data)) || [];
                    this.teacherClasses = (Array.isArray(rawTC) ? rawTC : []).map(normalizeTeacherClass);

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildPayload(row, forUpdate = false) {
                const staffId = this.asGuid(row.staffId);
                const classId = this.asGuid(row.classId);
                const yearId = this.asGuid(row.academicYearId || this.academicYearId);

                const payload = {
                    staffId: staffId,
                    staffName: String(this.nameOf(this.teachers, staffId) || row.staffName || '').trim(),
                    classId: classId,
                    className: String(this.nameOf(this.classes, classId) || row.className || '').trim(),
                    academicYearId: yearId,
                    academicYearName: String(this.nameOf(this.academicYears, yearId) || row.academicYearName || '').trim()
                };

                if (forUpdate) {
                    if (row.id) payload.id = row.id;
                    if (row.tenantId !== undefined && row.tenantId !== null) {
                        payload.tenantId = Number(row.tenantId);
                    }
                }

                return payload;
            },

            async onCreate({ row }) {
                this.isShimmerLoading = true;
                try {
                    const payload = this.buildPayload(row || {}, false);
                    // Endpoint spelling from controller: CreatTeacherClass
                    await axios.post('/SchoolManager/CreatTeacherClass/', payload);
                    this.toastHandler('success', 'Teacher class assigned successfully.');
                    await this.getSetupData();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                    this.isShimmerLoading = false;
                }
            },

            async onUpdate({ row }) {
                this.isShimmerLoading = true;
                try {
                    const payload = this.buildPayload(row || {}, true);
                    await axios.post('/SchoolManager/UpdateTeacherClass/', payload);
                    this.toastHandler('success', 'Teacher class updated successfully.');
                    await this.getSetupData();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                    this.isShimmerLoading = false;
                }
            },

            async onDelete({ rows }) {
                const list = rows || [];
                if (!list.length) return;
                this.isShimmerLoading = true;
                try {
                    for (const r of list) {
                        if (r && r.id) {
                            await axios.get('/SchoolManager/DeleteTeacherClass?id=' + encodeURIComponent(r.id));
                        }
                    }
                    this.toastHandler('success', 'Teacher class assignment(s) deleted.');
                    await this.getSetupData();
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                    this.isShimmerLoading = false;
                }
            }
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
