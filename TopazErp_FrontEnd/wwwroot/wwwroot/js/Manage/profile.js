const vue = Vue.createApp({

    data() {
        return {

            // ==============================
            // Loading
            // ==============================
            isShimmerLoading: false,
            isLoading: false,


            // ==============================
            // Data
            // ==============================
            payload: {},
            userDetails: {},

            id: null,
            tenantId: null,

            name: '',
            userName: '',
            phoneNumber: '',
            surname: '',
            emailAddress: '',


            // ==============================
            // Validation Errors
            // ==============================
            errors: {
                name: '',
                userName: '',
                surname: '',
                emailAddress: ''
            }

        };
    },


    methods: {

        // ==========================================
        // VALIDATE FORM
        // ==========================================
        validateForm() {

            // Clear previous errors
            this.errors = {
                name: '',
                userName: '',
                surname: '',
                emailAddress: ''
            };

            let isValid = true;


            // ==============================
            // First Name
            // ==============================
            if (!this.name || !this.name.trim()) {

                this.errors.name = 'First name is required.';

                isValid = false;
            }


            // ==============================
            // Username
            // ==============================
            if (!this.userName || !this.userName.trim()) {

                this.errors.userName = 'Username is required.';

                isValid = false;
            }


            // ==============================
            // Last Name
            // ==============================
            if (!this.surname || !this.surname.trim()) {

                this.errors.surname = 'Last name is required.';

                isValid = false;
            }


            // ==============================
            // Email
            // ==============================
            if (!this.emailAddress || !this.emailAddress.trim()) {

                this.errors.emailAddress = 'Email is required.';

                isValid = false;

            }
            else {

                const emailPattern =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailPattern.test(this.emailAddress)) {

                    this.errors.emailAddress =
                        'Please enter a valid email address.';

                    isValid = false;
                }
            }


            return isValid;
        },


        // ==========================================
        // UPDATE PROFILE
        // ==========================================
        updateProfile() {

            // Validate form
            if (!this.validateForm()) {

                // Focus first invalid field
                if (this.errors.name) {

                    this.$refs.name.focus();

                }
                else if (this.errors.userName) {

                    this.$refs.userName.focus();

                }
                else if (this.errors.surname) {

                    this.$refs.surname.focus();

                }
                else if (this.errors.emailAddress) {

                    this.$refs.emailAddress.focus();

                }

                return;
            }


            // ==============================
            // Build Payload
            // ==============================
            this.payload = {

                name: this.name,

                userName: this.userName,

                phoneNumber: this.phoneNumber,

                emailAddress: this.emailAddress,

                surname: this.surname,

                id: this.id,

                isActive: true

            };


            this.isLoading = true;


            // ==============================
            // Update User
            // ==============================
            axios.post( 'http://localhost:5300/Manage/UpdateUserDetails', this.payload, { withCredentials: true } )
                .then((response) => {

                    this.isLoading = false;

                    this.toastHandler(
                        'success',
                        'User profile updated successfully.'
                    );

                })
                .catch((error) => {

                    this.isLoading = false;

                    console.log(error);

                    this.toastHandler(
                        'error',
                        'Unable to update user profile.'
                    );

                });

        },


        // ==========================================
        // GET USER DETAILS
        // ==========================================
        getUserDetails() {

            this.isShimmerLoading = true;


            axios.get( 'http://localhost:5300/Manage/GetUserDetails', { withCredentials: true } )

                .then((response) => {

                    const data = response.data;


                    this.name =
                        data.name || '';

                    this.surname =
                        data.surname || '';

                    this.phoneNumber =
                        data.phoneNumber || '';

                    this.userName =
                        data.userName || '';

                    this.emailAddress =
                        data.emailAddress || '';

                    this.id =
                        data.id || null;


                })
                .catch((error) => {

                    console.log(error);

                    this.toastHandler(
                        'error',
                        'Unable to load user profile.'
                    );

                })
                .finally(() => {

                    this.isShimmerLoading = false;

                });

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

        this.getUserDetails();

    }

});


vue.mount('#app');