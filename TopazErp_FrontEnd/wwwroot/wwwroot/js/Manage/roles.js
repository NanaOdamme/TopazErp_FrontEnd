const vue = Vue.createApp({

    data() {
        return {

            // ==========================================
            // Loading
            // ==========================================
            isShimmerLoading: false,
            isLoading: false,


            // ==========================================
            // Modal
            // ==========================================
            modalTitle: 'Add Role',


            // ==========================================
            // Data
            // ==========================================
            payload: {},

            userList: [],

            roleList: [],

            permissionList: [],

            id: null,

            tenantId: null,
            isModalOpen: false,

            // ==========================================
            // Role Fields
            // ==========================================
            name: '',

            displayName: '',

            description: '',

            grantedPermissions: [],

            roles: [],


            // ==========================================
            // Pagination
            // ==========================================
            pageNo: 1,

            pageSize: 10,

            totalCount: 0,

            totalPages: 0,

            lowerBound: 0,

            upperBound: 0,


            // ==========================================
            // Permissions
            // ==========================================
            permissionToAdd: null,

            openPermissionGroups: {},


            // ==========================================
            // Validation
            // ==========================================
            errors: {
                name: ''
            }

        };
    },


    computed: {

        // ==========================================
        // Available Permissions
        // ==========================================
        availablePermissions() {

            return this.permissionList.filter(permission =>

                !this.grantedPermissions.some(
                    granted => granted.name === permission.name
                )

            );

        },


        // ==========================================
        // Group Available Permissions
        // ==========================================
        groupedAvailablePermissions() {

            const grouped = {};


            this.availablePermissions.forEach(permission => {

                if (!permission || !permission.name) {
                    return;
                }


                // Example:
                // User.Create
                // User.Update
                // Student.Create

                const parts = permission.name.split('.');


                const group =
                    parts[0] || 'Other';


                const subGroup =
                    parts[1] || 'General';


                if (!grouped[group]) {
                    grouped[group] = {};
                }


                if (!grouped[group][subGroup]) {
                    grouped[group][subGroup] = [];
                }


                grouped[group][subGroup].push(permission);

            });


            return grouped;
        },


        // ==========================================
        // Group Granted Permissions
        // ==========================================
        groupedGrantedPermissions() {

            const grouped = {};


            this.grantedPermissions.forEach(permission => {

                if (!permission || !permission.name) {
                    return;
                }


                const parts = permission.name.split('.');


                const group =
                    parts[0] || 'Other';


                const subGroup =
                    parts[1] || 'General';


                if (!grouped[group]) {
                    grouped[group] = {};
                }


                if (!grouped[group][subGroup]) {
                    grouped[group][subGroup] = [];
                }


                grouped[group][subGroup].push(permission);

            });


            return grouped;
        }

    },


    methods: {

        // ==========================================
        // VALIDATE FORM
        // ==========================================
        validateForm() {

            // Clear errors
            this.errors = {
                name: ''
            };


            let isValid = true;


            // Role name
            if (!this.name || !this.name.trim()) {

                this.errors.name =
                    'Role name is required.';

                isValid = false;
            }


            return isValid;
        },


        // ==========================================
        // GROUP PERMISSIONS
        // ==========================================
        groupPermissions(list) {

            if (!Array.isArray(list)) {
                return {};
            }


            const groups = {};


            list.forEach(permission => {

                if (!permission || !permission.name) {
                    return;
                }


                const key =
                    permission.name.split('.')[0];


                if (!groups[key]) {
                    groups[key] = [];
                }


                groups[key].push(permission);

            });


            return groups;
        },


        // ==========================================
        // TOGGLE PERMISSION GROUP
        // ==========================================
        togglePermissionGroup(group, subGroup) {

            const key =
                `${group}_${subGroup}`;


            this.openPermissionGroups[key] =
                !this.openPermissionGroups[key];
        },


        // ==========================================
        // ADD PERMISSION
        // ==========================================
        addPermissionFromList(permission) {

            if (!permission) {
                return;
            }


            // Prevent duplicates
            const exists =
                this.grantedPermissions.some(
                    p => p.name === permission.name
                );


            if (!exists) {

                this.grantedPermissions.push(permission);

            }

        },


        // ==========================================
        // REMOVE PERMISSION
        // ==========================================
        removePermissionFromList(permission) {

            if (!permission) {
                return;
            }


            this.grantedPermissions =
                this.grantedPermissions.filter(
                    p => p.name !== permission.name
                );

        },


        // ==========================================
        // SAVE ROLE
        // ==========================================
        saveRole() {

            // Validate
            if (!this.validateForm()) {

                if (this.errors.name && this.$refs.name) {
                    this.$refs.name.focus();
                }

                return;
            }


            this.payload = {};

            this.isLoading = true;


            // ==========================================
            // Build Payload
            // ==========================================
            this.payload.name =
                this.name;

            this.payload.displayName =
                this.displayName;

            this.payload.description =
                this.description;

            this.payload.grantedPermissions =
                this.grantedPermissions.map(
                    permission => permission.name
                );


            // ==========================================
            // UPDATE
            // ==========================================
            if (this.id) {

                this.payload.id =
                    this.id;


                axios.post(
                    '/Manage/UpdateRole',
                    this.payload
                )
                    .then((response) => {

                        this.isLoading = false;


                        this.toastHandler(
                            'success',
                            'Role updated successfully.'
                        );


                        this.getRoles();


                        this.closeModal();


                    })
                    .catch((error) => {

                        this.isLoading = false;


                        console.log(error);


                        this.toastHandler(
                            'error',
                            'Unable to update role.'
                        );

                    });

            }


                // ==========================================
                // CREATE
            // ==========================================
            else {

                axios.post(
                    '/Manage/AddRole',
                    this.payload
                )
                    .then((response) => {

                        this.isLoading = false;


                        this.toastHandler(
                            'success',
                            'Role created successfully.'
                        );


                        this.getRoles();


                        this.closeModal();


                    })
                    .catch((error) => {

                        this.isLoading = false;


                        console.log(error);


                        this.toastHandler(
                            'error',
                            'Unable to create role.'
                        );

                    });

            }

        },


        // ==========================================
        // GET ROLE PERMISSIONS
        // ==========================================
        getRolePermissions(roleName) {

            axios.get(
                '/Manage/GetAllPermissionsForRole?roleName='
                + encodeURIComponent(roleName)
            )
                .then((response) => {

                    this.grantedPermissions =
                        response.data || [];

                })
                .catch((error) => {

                    console.log(error);


                    this.toastHandler(
                        'error',
                        'Unable to load role permissions.'
                    );

                });

        },


        // ==========================================
        // ADD PERMISSION
        // ==========================================
        addPermission() {

            if (!this.permissionToAdd) {
                return;
            }


            const exists =
                this.grantedPermissions.some(
                    permission =>
                        permission.name ===
                        this.permissionToAdd.name
                );


            if (!exists) {

                this.grantedPermissions.push(
                    this.permissionToAdd
                );

            }


            this.permissionToAdd = null;


            this.$nextTick(() => {

                if (
                    this.$refs.permissionDropdown &&
                    this.$refs.permissionDropdown.activate
                ) {

                    this.$refs.permissionDropdown.activate();

                }

            });

        },


        // ==========================================
        // REMOVE PERMISSION BY INDEX
        // ==========================================
        removePermission(index) {

            this.grantedPermissions.splice(
                index,
                1
            );

        },


        // ==========================================
        // DELETE ROLE
        // ==========================================
        async deleteRole(id) {

            // Confirmation
            const result = await Swal.fire({

                title: 'Delete Role?',

                text: 'This action cannot be undone.',

                icon: 'warning',

                showCancelButton: true,

                confirmButtonText: 'Yes, delete it',

                cancelButtonText: 'Cancel',

                reverseButtons: true

            });


            if (!result.isConfirmed) {
                return;
            }


            axios.get(
                '/Manage/DelRole?id=' + id
            )
                .then((response) => {

                    this.toastHandler(
                        'success',
                        'Role deleted successfully.'
                    );


                    this.getRoles();

                })
                .catch((error) => {

                    console.log(error);


                    this.toastHandler(
                        'error',
                        'Unable to delete role.'
                    );

                });

        },


        // ==========================================
        // INITIALIZE UPDATE
        // ==========================================
        initUpdate(roleInfo) {

            this.getRolePermissions(
                roleInfo.name
            );


            this.modalTitle =
                'Role Details';


            this.name =
                roleInfo.name || '';


            this.displayName =
                roleInfo.displayName || '';


            this.description =
                roleInfo.description || '';


            this.id =
                roleInfo.id;


            this.clearValidation();


            this.openModal();

        },


        // ==========================================
        // RESET MODAL
        // ==========================================
        resetModal() {

            this.modalTitle =
                'Add Role';


            this.id =
                null;


            this.name =
                '';


            this.displayName =
                '';


            this.description =
                '';


            this.grantedPermissions =
                [];


            this.permissionToAdd =
                null;


            this.openPermissionGroups =
                {};


            this.clearValidation();

        },


        // ==========================================
        // CLEAR VALIDATION
        // ==========================================
        clearValidation() {

            this.errors = {
                name: ''
            };

        },


        // ==========================================
        // GET ROLES
        // ==========================================
        getRoles() {

            this.isShimmerLoading = true;


            axios.get(
                `/Manage/GetRoles?pageNo=${this.pageNo}&pageSize=${this.pageSize}`
            )
                .then((response) => {

                    this.roleList =
                        response.data.data || [];


                    this.totalCount =
                        response.data.totalCount || 0;


                    this.totalPages =
                        response.data.totalPages || 0;


                    this.lowerBound =
                        response.data.lowerBound || 0;


                    this.upperBound =
                        response.data.upperBound || 0;

                })
                .catch((error) => {

                    console.log(error);


                    this.toastHandler(
                        'error',
                        'Unable to load roles.'
                    );

                })
                .finally(() => {

                    this.isShimmerLoading = false;

                });

        },


        // ==========================================
        // GET PERMISSIONS
        // ==========================================
        getPermissions() {

            axios.get(
                '/Manage/GetPermissions'
            )
                .then((response) => {

                    const permissions =
                        response.data || [];


                    permissions.forEach(permission => {

                        permission.isSelected =
                            false;

                    });


                    this.permissionList =
                        permissions;

                })
                .catch((error) => {

                    console.log(error);


                    this.toastHandler(
                        'error',
                        'Unable to load permissions.'
                    );

                });

        },


        // ==========================================
        // OPEN MODAL
        // ==========================================
        openModal() {

            const modal =
                document.getElementById(
                    'addEditRole'
                );


            if (modal) {

                modal.classList.remove('hidden');

                modal.classList.add('flex');

                document.body.classList.add(
                    'overflow-hidden'
                );

            }

        },


        // ==========================================
        // CLOSE MODAL
        // ==========================================
        closeModal() {

            const modal =
                document.getElementById(
                    'addEditRole'
                );


            if (modal) {

                modal.classList.add('hidden');

                modal.classList.remove('flex');

                document.body.classList.remove(
                    'overflow-hidden'
                );

            }


            this.modalTitle =
                'Add Role';

        },


        // ==========================================
        // SWEETALERT TOAST
        // ==========================================
        toastHandler(
            type = 'success',
            message = 'An unexpected error occurred.'
        ) {

            Swal.fire({

                toast: true,

                position: 'top-end',

                icon: type,

                title: message,

                showConfirmButton: false,

                timer: 4000,

                timerProgressBar: true

            });

        }

    },


    // ==========================================
    // CREATED
    // ==========================================
    created() {

        this.getRoles();

        this.getPermissions();

    }

});


vue.mount('#app');