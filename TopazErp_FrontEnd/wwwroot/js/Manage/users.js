Vue.use(window.vuelidate.default);
const { required, minValue, requiredIf } = window.validators;

var vue = new Vue({
    el: '#app',
    data: {

        isShimmerLoading: false,
        isLoading: false,
        modalTitle: 'Add User',
        payload: {},
        userList: [],
        roleList: [],
        id: null,
        tenantId: null,
        name: '',
        userName: '',
        password: '',
        surname: '',
        emailAddress: '',
        passwordConfirm: '',
        isActive: true,
        roles: [],
        selectedRole: '',
        pageNo: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
        lowerBound: 0,
        upperBound: 0

    },
    validations() {

        return {

            name: {
                required
            },
            userName: {
                required
            },
            //password: {
            //    requiredIf: requiredIf(() => { return this.id != null })
            //},
            surname: {
                required
            },
            emailAddress: {
                required
            },
            
            selectedRole: {
                required
            },
            
        }


    },
    methods: {
     
        saveUser() {

            this.$v.$touch();

            if (this.$v.$invalid) {

                for (let key in Object.keys(this.$v)) {

                    const input = Object.keys(this.$v)[key];

                    if (this.$v[input].$error) {

                        this.$refs[input].focus();

                        break;
                    }

                }

                return;
            }


            if(this.id == null && this.password != this.passwordConfirm) {

                this.toastHandler('warning', 'Pass confirmation mismatch.');
                return;
            }


            this.payload = {};
            this.isLoading = true;
            
            this.payload.name = this.name;
            this.payload.userName = this.userName;
            this.payload.phoneNumber = this.phoneNumber;
            this.payload.emailAddress = this.emailAddress;
            this.payload.surname = this.surname;
            this.payload.password = this.password;
            this.payload.isActive = true;
            this.payload.roleNames = [this.selectedRole];

            if (this.id) {

                this.payload.id = this.id;

                axios.post('/Manage/EditUser', this.payload).then((response) => {

                    this.isLoading = false;
                    this.toastHandler('', 'User updated.');
                    this.getUsers();
                    $("#user-modal").modal('hide');
                    this.id = null;
                    this.modalTitle = 'Add User';

                }).catch((error) => {

                    this.isLoading = false;
                    this.toastHandler('error', 'Unable to create user.');
                    $("#user-modal").modal('hide');


                });

               
            }
            else {

                axios.post('/Manage/AddUser', this.payload).then((response) => {

                    this.isLoading = false;
                    this.toastHandler('', 'User created.');
                    this.getUsers();
                    $("#user-modal").modal('hide');
                    this.id = null;
                    this.modalTitle = 'Add User';


                }).catch((error) => {

                    this.isLoading = false;
                    this.toastHandler('error', 'Unable to create user.');
                    $("#user-modal").modal('show');


                });

            }

            

        },

        deleteUser(user) {


            if (user.userName == 'admin') {

                this.toastHandler('warning', 'Admin user cannot be deleted.');
                return;
            }

            axios.get('/Manage/DelUser?id='+ user.id).then((response) => {

                this.toastHandler('', 'User deleted.');
                this.getUsers();


            }).catch((error) => {

                 
                this.toastHandler('error', 'Unable to delete user.');

                console.log(error);
            });
        },

        viewUserDetails(user) {

           /* console.log(user.roleNames[0]);*/

            this.id = user.id;
            this.name = user.name;
            this.userName = user.userName;
            this.phoneNumber = user.phoneNumber;
            this.emailAddress = user.emailAddress;
            this.surname = user.surname;
            this.password = user.password;
            this.isActive = user;
            this.selectedRole = user.roleNames && user.roleNames.length > 0 ? user.roleNames[0] : '';

            this.modalTitle = 'User Details';

            $("#user-modal").modal('show');

        },
        resetModal() {

            this.modalTitle = 'Add User';
            this.id = null;
            this.name = '';
            this.userName = '';
            this.phoneNumber = '';
            this.emailAddress = '';
            this.surname = '';
            this.password = '';
            this.isActive = true;
            this.selectedRole = '';

        },
        getUsers() {

            axios.get(`/Manage/GetUsers?pageNo=${this.pageNo}&pageSize=${this.pageSize}`).then((response) => {

                this.userList = response.data.data;

                this.totalCount = response.data.totalCount;
                this.totalPages = response.data.totalPages;

                this.lowerBound = response.data.lowerBound;
                this.upperBound = response.data.upperBound;

            }).catch((error) => {

                console.log(error);

            });
        },

        getRoles() {

            axios.get('/Manage/GetRoles?pageNo=1&pageSize=1000').then((response) => {

                this.roleList = response.data.data;

            }).catch((error) => {

                console.log(error);
            });
        },


        onPageChanged(page) {

            this.pageNo = page;
            this.getUsers();
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

        }


    },
    computed: {

        pageList() {

            let counter = 1;
            let initPage = 1;
            const currentPage = this.pageNo;
            const pages = this.totalPages;

            if (currentPage > 9 && pages > 10) {
                initPage = currentPage - 5;
            }

            const pageNumbers = [];

            for (let i = initPage; i <= pages; i++) {
                pageNumbers.push(i);
                counter++;
                if (counter > 10) {
                    break;
                }
            }

            return pageNumbers;

        }

    },
    watch: {

       

    },

    created() {
         
        this.getUsers();
        this.getRoles();
    },
});