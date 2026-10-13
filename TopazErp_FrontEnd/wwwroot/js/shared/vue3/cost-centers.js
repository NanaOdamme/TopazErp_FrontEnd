const app = Vue.createApp({

    data() {
        return {
            theme: '#0645e7',
            isShimmerLoading: false,
            isLoading: false,
            payload: {},
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            departmentList: [],
            departmentNameList: [],
            departmentHierarchyList: [],
            name: '',
            parentId: '',
            /* departmentCol: [
                 { key:'id',         label:'ID',         type:'text', hidden:true,   width:74, help:'Auto-filled, but you can change it' },
                 { key: "name", label: "Department", type:'text', required:true, searchable:true, width: 80 },
                 { key: "parentName", label: "Parent Hierarchy", type:'select',options:this.departmentHierarchyList, required:true, searchable:true, width: 80 },
                 { key: "parentId", hidden: true, type:'text', label: "ParentId", width: 15, },
                 { key:'tenantId',      label:'Tenant',      type:'number', hidden:true, minWidth:74 }
             ],*/
        };
    },
    computed: {
        departmentCol() {
            return [
                {
                    key: 'id',
                    label: 'ID',
                    type: 'text',
                    hidden: true
                },
                {
                    key: 'name',
                    label: 'Department',
                    type: 'text',
                    required: true,
                    searchable: true
                },
                {
                    key: 'parentId',
                    label: 'Parent Department',
                    type: 'select',
                    options: this.departmentHierarchyList,
                    required: false,
                    searchable: true
                },
                {
                    key: 'parentName',
                    label: 'Hierarchy',
                    type: 'text',
                    searchable: true,
                    help: 'Generated from the department hierarchy'
                },
                {
                    key: 'tenantId',
                    label: 'Tenant',
                    type: 'number',
                    hidden: true
                }
            ];
        }
    },
    methods: {
        async onCreate(event) {
            try {
                const row = event?.row;

                if (!row || !this.validateRecord(row)) {
                    return;
                }

                this.isShimmerLoading = true;

                const parentId = row.parentId || this.emptyGuid;

                const parent = this.departmentList.find(
                    department => department.id === parentId
                );

                const createPayload = {
                    name: row.name.trim(),
                    parentId,
                    parentName: parent
                        ? `${parent.parentName}/${row.name.trim()}`
                        : row.name.trim()
                };

                const createdRecord = {
                    ...createPayload,
                    id: this.generateId(),
                    tenantId: this.currentTenantId
                };


                this.buildDepartmentHierarchy();

                this.toastHandler('Department created successfully.');
            } catch (error) {
                console.error('Create failed:', error);
                this.toastHandler('Failed to create department.', 'error');
            } finally {
                this.isShimmerLoading = false;
            }
        },

        async onUpdate(event) {
            try {
                const row = event?.row;

                if (!row || !this.validateRecord(row)) {
                    return;
                }

                const parentId = row.parentId || this.emptyGuid;

                const parent = this.departmentList.find(
                    department => department.id === parentId
                );

                const updatePayload = {
                    id: existingRecord.id,
                    tenantId: existingRecord.tenantId,
                    name: row.name.trim(),
                    parentId,
                    parentName: parent
                        ? `${parent.parentName}/${row.name.trim()}`
                        : row.name.trim()
                };

                const index = this.departmentList.findIndex(
                    department => department.id === existingRecord.id
                );

                if (index !== -1) {
                    this.departmentList.splice(index, 1, updatePayload);
                }

                this.buildDepartmentHierarchy();
                this.toastHandler('Department updated successfully.');
            } catch (error) {
                console.error('Update failed:', error);
                this.toastHandler('Failed to update department.', 'error');
            } finally {
                this.isShimmerLoading = false;
            }
        },
        getSetupData() {
            const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

            const mockDepartments = [
                // Root departments
                {
                    id: '10000000-0000-4000-8000-000000000001',
                    tenantId: 2,
                    name: 'Administration',
                    parentId: EMPTY_GUID
                },
                {
                    id: '10000000-0000-4000-8000-000000000002',
                    tenantId: 2,
                    name: 'Finance',
                    parentId: EMPTY_GUID
                },
                {
                    id: '10000000-0000-4000-8000-000000000003',
                    tenantId: 2,
                    name: 'Human Resources',
                    parentId: EMPTY_GUID
                },
                {
                    id: '10000000-0000-4000-8000-000000000004',
                    tenantId: 2,
                    name: 'Information Technology',
                    parentId: EMPTY_GUID
                },
                {
                    id: '10000000-0000-4000-8000-000000000005',
                    tenantId: 2,
                    name: 'Academic Affairs',
                    parentId: EMPTY_GUID
                },
                {
                    id: '10000000-0000-4000-8000-000000000006',
                    tenantId: 2,
                    name: 'Operations',
                    parentId: EMPTY_GUID
                },
                {
                    id: '10000000-0000-4000-8000-000000000007',
                    tenantId: 2,
                    name: 'Internal Audit',
                    parentId: EMPTY_GUID
                },

                // Finance subdepartments
                {
                    id: '20000000-0000-4000-8000-000000000001',
                    tenantId: 2,
                    name: 'Accounts Payable',
                    parentId: '10000000-0000-4000-8000-000000000002'
                },
                {
                    id: '20000000-0000-4000-8000-000000000002',
                    tenantId: 2,
                    name: 'Accounts Receivable',
                    parentId: '10000000-0000-4000-8000-000000000002'
                },
                {
                    id: '20000000-0000-4000-8000-000000000003',
                    tenantId: 2,
                    name: 'Payroll',
                    parentId: '10000000-0000-4000-8000-000000000002'
                },
                {
                    id: '20000000-0000-4000-8000-000000000004',
                    tenantId: 2,
                    name: 'Treasury',
                    parentId: '10000000-0000-4000-8000-000000000002'
                },

                // HR subdepartments
                {
                    id: '30000000-0000-4000-8000-000000000001',
                    tenantId: 2,
                    name: 'Recruitment',
                    parentId: '10000000-0000-4000-8000-000000000003'
                },
                {
                    id: '30000000-0000-4000-8000-000000000002',
                    tenantId: 2,
                    name: 'Staff Welfare',
                    parentId: '10000000-0000-4000-8000-000000000003'
                },
                {
                    id: '30000000-0000-4000-8000-000000000003',
                    tenantId: 2,
                    name: 'Training and Development',
                    parentId: '10000000-0000-4000-8000-000000000003'
                },

                // IT subdepartments
                {
                    id: '40000000-0000-4000-8000-000000000001',
                    tenantId: 2,
                    name: 'Software Development',
                    parentId: '10000000-0000-4000-8000-000000000004'
                },
                {
                    id: '40000000-0000-4000-8000-000000000002',
                    tenantId: 2,
                    name: 'IT Support',
                    parentId: '10000000-0000-4000-8000-000000000004'
                },
                {
                    id: '40000000-0000-4000-8000-000000000003',
                    tenantId: 2,
                    name: 'Network and Infrastructure',
                    parentId: '10000000-0000-4000-8000-000000000004'
                },

                // Academic subdepartments
                {
                    id: '50000000-0000-4000-8000-000000000001',
                    tenantId: 2,
                    name: 'Admissions',
                    parentId: '10000000-0000-4000-8000-000000000005'
                },
                {
                    id: '50000000-0000-4000-8000-000000000002',
                    tenantId: 2,
                    name: 'Examinations',
                    parentId: '10000000-0000-4000-8000-000000000005'
                },
                {
                    id: '50000000-0000-4000-8000-000000000003',
                    tenantId: 2,
                    name: 'Student Records',
                    parentId: '10000000-0000-4000-8000-000000000005'
                },

                // Operations subdepartments
                {
                    id: '60000000-0000-4000-8000-000000000001',
                    tenantId: 2,
                    name: 'Procurement',
                    parentId: '10000000-0000-4000-8000-000000000006'
                },
                {
                    id: '60000000-0000-4000-8000-000000000002',
                    tenantId: 2,
                    name: 'Facilities Management',
                    parentId: '10000000-0000-4000-8000-000000000006'
                },

                // Third level: Finance > Accounts Payable
                {
                    id: '70000000-0000-4000-8000-000000000001',
                    tenantId: 2,
                    name: 'Supplier Payments',
                    parentId: '20000000-0000-4000-8000-000000000001'
                },
                {
                    id: '70000000-0000-4000-8000-000000000002',
                    tenantId: 2,
                    name: 'Invoice Processing',
                    parentId: '20000000-0000-4000-8000-000000000001'
                },

                // Third level: IT > Software Development
                {
                    id: '80000000-0000-4000-8000-000000000001',
                    tenantId: 2,
                    name: 'ERP Development',
                    parentId: '40000000-0000-4000-8000-000000000001'
                },
                {
                    id: '80000000-0000-4000-8000-000000000002',
                    tenantId: 2,
                    name: 'Application Support',
                    parentId: '40000000-0000-4000-8000-000000000001'
                }
            ];
            this.departmentList = mockDepartments.map(item => ({
                ...item
            }));

            this.buildDepartmentHierarchy();

        },

        buildDepartmentHierarchy() {
            const departments = this.departmentList.filter(
                department => department.tenantId === this.currentTenantId
            );

            const departmentMap = new Map(
                departments.map(department => [department.id, department])
            );

            const getPath = (department, visited = new Set()) => {
                if (!department || visited.has(department.id)) {
                    return department?.name || '';
                }

                visited.add(department.id);

                if (
                    !department.parentId ||
                    department.parentId === this.emptyGuid
                ) {
                    return department.name;
                }

                const parent = departmentMap.get(department.parentId);

                if (!parent) {
                    return department.name;
                }

                const parentPath = getPath(parent, visited);

                return `${parentPath}/${department.name}`;
            };

            this.departmentList = departments.map(department => ({
                ...department,
                parentName: getPath(department)
            }));

            this.departmentNameList = this.departmentList.map(department => ({
                ...department
            }));

            this.departmentHierarchyList = [
                {
                    label: 'No Parent (Root Department)',
                    value: this.emptyGuid
                },
                ...this.departmentList.map(department => ({
                    label: department.parentName,
                    value: department.id
                }))
            ];
        },

        validateRecord(row) {
            if (!row.name || !row.name.trim()) {
                this.toastHandler(
                    'Department name is required.',
                    'warning'
                );
                return false;
            }

            if (row.parentId) {
                const parent = this.departmentList.find(
                    department => department.id === row.parentId
                );

                if (!parent && row.parentId !== this.emptyGuid) {
                    this.toastHandler(
                        'Selected parent department does not exist.',
                        'error'
                    );
                    return false;
                }

                if (row.id && row.parentId === row.id) {
                    this.toastHandler(
                        'A department cannot be its own parent.',
                        'warning'
                    );
                    return false;
                }

                // Prevent assigning a department beneath one of its descendants.
                let current = this.departmentList.find(
                    department => department.id === row.parentId
                );

                const visited = new Set();

                while (current && !visited.has(current.id)) {
                    if (current.id === row.id) {
                        this.toastHandler(
                            'This change would create a circular hierarchy.',
                            'warning'
                        );
                        return false;
                    }

                    visited.add(current.id);

                    current = this.departmentList.find(
                        department => department.id === current.parentId
                    );
                }
            }

            return true;
        },

        generateId() {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
            }

            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                /[xy]/g,
                character => {
                    const random = Math.random() * 16 | 0;
                    const value = character === 'x'
                        ? random
                        : (random & 0x3 | 0x8);

                    return value.toString(16);
                }
            );
        },


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


    },

    mounted() {

        this.getSetupData();
    },
});
app.use(DataGridPlugin);
app.mount('#app');