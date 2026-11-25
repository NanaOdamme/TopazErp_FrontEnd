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
            name: val(o, 'name') || val(o, 'roomName') || val(o, 'displayName') || ''
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

    const normalizeStudents = list => (list || [])
        .map(s => {
            const id = val(s, 'id') || val(s, 'studentId');
            const firstName = String(val(s, 'firstName') || '').trim();
            const otherName = String(val(s, 'otherName') || '').trim();
            const lastName = String(val(s, 'lastName') || '').trim();
            const combined = [firstName, otherName, lastName].filter(Boolean).join(' ').trim();
            const name = combined || String(val(s, 'name') || val(s, 'fullName') || val(s, 'studentName') || '').trim();
            const classId = val(s, 'classId') || val(s, 'classID');

            return {
                id: id ? String(id) : undefined,
                name: name || 'Student',
                classId: classId ? String(classId) : null
            };
        })
        .filter(s => s.id != null && s.name !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

    const normalizeTeacherClasses = list => (list || [])
        .map(tc => ({
            id: val(tc, 'id'),
            staffId: val(tc, 'staffId'),
            staffName: val(tc, 'staffName') || '',
            classId: val(tc, 'classId'),
            className: val(tc, 'className') || '',
            academicYearId: val(tc, 'academicYearId')
        }))
        .filter(tc => tc.staffId && tc.classId);

    const normalizeRegisteredClass = r => {
        const id = val(r, 'id');
        return {
            id: id ? String(id) : undefined,
            classId: asGuid(val(r, 'classId')),
            className: String(val(r, 'className') || '').trim(),
            academicYearId: asGuid(val(r, 'academicYearId')),
            academicYearName: String(val(r, 'academicYearName') || '').trim(),
            description: String(val(r, 'description') || '').trim(),
            capacity: Number(val(r, 'capacity') ?? 0),
            roomId: asGuid(val(r, 'roomId')),
            roomName: String(val(r, 'roomName') || '').trim(),
            mainTeacherId: asGuid(val(r, 'mainTeacherId')),
            mainTeacherName: String(val(r, 'mainTeacherName') || '').trim(),
            subTeacherId: asGuid(val(r, 'subTeacherId')),
            subTeacherName: String(val(r, 'subTeacherName') || '').trim(),
            classPrefectId: asGuid(val(r, 'classPrefectId')),
            classPrefectName: String(val(r, 'classPrefectName') || '').trim(),
            assistantPrefectId: asGuid(val(r, 'assistantPrefectId')),
            assistantPrefectName: String(val(r, 'assistantPrefectName') || '').trim(),
            comments: String(val(r, 'comments') || '').trim(),
            tenantId: val(r, 'tenantId') !== undefined ? Number(val(r, 'tenantId')) : undefined
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
                students: [],
                rooms: [],
                teacherClasses: [],

                // Filter
                academicYearId: '',

                // Stored records
                registeredClasses: []
            };
        },

        computed: {
            academicYearOptions() {
                return [
                    { id: '', name: 'All Academic Years' },
                    ...(this.academicYears || [])
                ];
            },

            filteredClasses() {
                if (!this.academicYearId) return this.registeredClasses || [];
                const yearId = String(this.academicYearId).toLowerCase();
                return (this.registeredClasses || []).filter(rc =>
                    String(rc.academicYearId).toLowerCase() === yearId
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
                        width: '180',
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
                        width: '180',
                        options: this.classes,
                        display: 'name',
                        value: 'id'
                    },
                    {
                        key: 'capacity',
                        label: 'Capacity',
                        type: 'number',
                        required: true,
                        editable: true,
                        searchable: false,
                        sortable: true,
                        width: '110',
                        defaultValue:0
                    },
                    {
                        key: 'mainTeacherId',
                        label: 'Main Teacher',
                        type: 'select',
                        required: true,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '220',
                        options: values => this.getTeachersForClass(values ? values.classId : null),
                        display: 'name',
                        value: 'id',
                        dependsOn: 'classId',
                        disabled: (row, mode, column, values) => !(values && values.classId)
                    },
                    {
                        key: 'subTeacherId',
                        label: 'Sub Teacher',
                        type: 'select',
                        required: false,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '220',
                        options: values => this.getTeachersForClass(values ? values.classId : null),
                        display: 'name',
                        value: 'id',
                        dependsOn: 'classId',
                        disabled: (row, mode, column, values) => !(values && values.classId)
                    },
                    {
                        key: 'classPrefectId',
                        label: 'Class Prefect',
                        type: 'select',
                        required: true,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '220',
                        options: values => this.getStudentsForClass(values ? values.classId : null),
                        display: 'name',
                        value: 'id',
                        dependsOn: 'classId',
                        disabled: (row, mode, column, values) => !(values && values.classId)
                    },
                    {
                        key: 'assistantPrefectId',
                        label: 'Assistant Prefect',
                        type: 'select',
                        required: false,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '220',
                        options: values => this.getStudentsForClass(values ? values.classId : null),
                        display: 'name',
                        value: 'id',
                        dependsOn: 'classId',
                        disabled: (row, mode, column, values) => !(values && values.classId)
                    },
                    {
                        key: 'roomId',
                        label: 'Room',
                        type: this.rooms.length ? 'select' : 'text',
                        required: false,
                        editable: true,
                        searchable: true,
                        sortable: true,
                        width: '180',
                        options: this.rooms.length ? this.rooms : undefined,
                        display: this.rooms.length ? 'name' : undefined,
                        value: this.rooms.length ? 'id' : undefined
                    },
                    {
                        key: 'description',
                        label: 'Description',
                        type: 'text',
                        required: false,
                        editable: true,
                        searchable: true,
                        width: '200'
                    },
                    {
                        key: 'comments',
                        label: 'Comments',
                        type: 'text',
                        required: false,
                        editable: true,
                        searchable: true,
                        width: '200'
                    },
                    { key: 'className', label: 'Class Name', type: 'text', hidden: true, editable: false },
                    { key: 'academicYearName', label: 'Year Name', type: 'text', hidden: true, editable: false },
                    { key: 'roomName', label: 'Room Name', type: 'text', hidden: true, editable: false },
                    { key: 'mainTeacherName', label: 'Main Teacher Name', type: 'text', hidden: true, editable: false },
                    { key: 'subTeacherName', label: 'Sub Teacher Name', type: 'text', hidden: true, editable: false },
                    { key: 'classPrefectName', label: 'Class Prefect Name', type: 'text', hidden: true, editable: false },
                    { key: 'assistantPrefectName', label: 'Assistant Prefect Name', type: 'text', hidden: true, editable: false },
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

            // Filter teachers assigned to the selected classId in TeacherClasses
            getTeachersForClass(classId) {
                if (!classId) return [];
                const cId = String(classId).toLowerCase();

                // Find staffIds assigned to this class
                const assignedStaffIds = new Set(
                    (this.teacherClasses || [])
                        .filter(tc => String(tc.classId).toLowerCase() === cId)
                        .map(tc => String(tc.staffId).toLowerCase())
                );

                return (this.teachers || []).filter(t =>
                    assignedStaffIds.has(String(t.id).toLowerCase())
                );
            },

            // Filter students belonging to the selected classId
            getStudentsForClass(classId) {
                if (!classId) return [];
                const cId = String(classId).toLowerCase();

                return (this.students || []).filter(s =>
                    s.classId && String(s.classId).toLowerCase() === cId
                );
            },

            async getSetupData() {
                this.isShimmerLoading = true;
                try {
                    const safeGet = promise => promise.catch(() => ({ data: { result: [] } }));

                    const [yearsRes, classesRes, staffRes, studentsRes, roomsRes, tcRes, regRes] = await Promise.all([
                        axios.get('/SchoolManager/GetAcademicYears/'),
                        axios.get('/SchoolManager/GetLevelClasses/'),
                        axios.get('/SchoolManager/GetStaffBios/'),
                        axios.get('/SchoolManager/GetStudentBios/'),
                        safeGet(axios.get('/SchoolManager/GetClassRooms/')),
                        safeGet(axios.get('/SchoolManager/GetTeacherClasses/')),
                        axios.get('/SchoolManager/GetRegisteredClasses/')
                    ]);

                    this.academicYears = normalizeLookups(yearsRes.data && (yearsRes.data.result || yearsRes.data));
                    this.classes = normalizeClasses(classesRes.data && (classesRes.data.result || classesRes.data));
                    const staffList = (staffRes.data && (staffRes.data.result || staffRes.data)) || [];
                    this.teachers = normalizeTeachers(staffList);
                    const studentList = (studentsRes.data && (studentsRes.data.result || studentsRes.data)) || [];
                    this.students = normalizeStudents(studentList);
                    const roomList = (roomsRes.data && (roomsRes.data.result || roomsRes.data)) || [];
                    this.rooms = normalizeLookups(roomList);
                    const tcList = (tcRes.data && (tcRes.data.result || tcRes.data)) || [];
                    this.teacherClasses = normalizeTeacherClasses(tcList);

                    const rawReg = (regRes.data && (regRes.data.result || regRes.data)) || [];
                    this.registeredClasses = (Array.isArray(rawReg) ? rawReg : []).map(normalizeRegisteredClass);

                    this.setupDone = true;
                } catch (err) {
                    this.toastHandler('error', this.errMsg(err));
                } finally {
                    this.isShimmerLoading = false;
                }
            },

            buildPayload(row, forUpdate = false) {
                const classId = this.asGuid(row.classId);
                const yearId = this.asGuid(row.academicYearId || this.academicYearId);
                const roomId = this.asGuid(row.roomId);
                const mainTeacherId = this.asGuid(row.mainTeacherId);
                const subTeacherId = this.asGuid(row.subTeacherId);
                const prefectId = this.asGuid(row.classPrefectId);
                const asstPrefectId = this.asGuid(row.assistantPrefectId);

                const payload = {
                    classId: classId,
                    className: String(this.nameOf(this.classes, classId) || row.className || '').trim(),
                    academicYearId: yearId,
                    academicYearName: String(this.nameOf(this.academicYears, yearId) || row.academicYearName || '').trim(),
                    description: String(row.description || '').trim(),
                    capacity: Number(row.capacity ?? 0),
                    roomId: roomId,
                    roomName: String(this.nameOf(this.rooms, roomId) || row.roomName || '').trim(),
                    mainTeacherId: mainTeacherId,
                    mainTeacherName: String(this.nameOf(this.teachers, mainTeacherId) || row.mainTeacherName || '').trim(),
                    subTeacherId: subTeacherId,
                    subTeacherName: String(this.nameOf(this.teachers, subTeacherId) || row.subTeacherName || '').trim(),
                    classPrefectId: prefectId,
                    classPrefectName: String(this.nameOf(this.students, prefectId) || row.classPrefectName || '').trim(),
                    assistantPrefectId: asstPrefectId,
                    assistantPrefectName: String(this.nameOf(this.students, asstPrefectId) || row.assistantPrefectName || '').trim(),
                    comments: String(row.comments || '').trim()
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
                    await axios.post('/SchoolManager/CreateRegisteredClass/', payload);
                    this.toastHandler('success', 'Class registered successfully.');
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
                    await axios.post('/SchoolManager/UpdateRegisteredClass/', payload);
                    this.toastHandler('success', 'Registered class updated successfully.');
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
                            await axios.get('/SchoolManager/DeleteRegisteredClass?id=' + encodeURIComponent(r.id));
                        }
                    }
                    this.toastHandler('success', 'Registered class(es) deleted.');
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
