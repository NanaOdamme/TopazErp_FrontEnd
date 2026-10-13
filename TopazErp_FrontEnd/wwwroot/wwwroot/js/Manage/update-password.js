const vue = Vue.createApp({

    data() {
        return {

            isShimmerLoading: false,
            isLoading: false,

            payload: {},

            id: null,
            tenantId: null,

            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',

            passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{10,}$/,

            errors: {
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            }

        };
    },


    computed: {

        newPasswordIsValid() {
            return this.passwordRegex.test(this.newPassword);
        },

        confirmPasswordIsValid() {
            return this.passwordRegex.test(this.confirmNewPassword);
        },

        passwordsMatch() {
            return this.newPassword === this.confirmNewPassword;
        }

    },


    methods: {

        validateForm() {

            this.errors = {
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            };


            let isValid = true;


            // Current password
            if (!this.currentPassword.trim()) {

                this.errors.currentPassword = 'Current Password is required.';

                isValid = false;
            }


            // New password
            if (!this.newPassword.trim()) {

                this.errors.newPassword = 'New Password is required.';

                isValid = false;

            } else if (!this.passwordRegex.test(this.newPassword)) {

                this.errors.newPassword =
                    'Password must be at least 10 characters and contain uppercase, lowercase, number and special character.';

                isValid = false;
            }


            // Confirm password
            if (!this.confirmNewPassword.trim()) {

                this.errors.confirmNewPassword =
                    'Confirm New Password is required.';

                isValid = false;

            } else if (!this.passwordRegex.test(this.confirmNewPassword)) {

                this.errors.confirmNewPassword =
                    'Password confirmation must be at least 10 characters and contain uppercase, lowercase, number and special character.';

                isValid = false;

            } else if (this.confirmNewPassword !== this.newPassword) {

                this.errors.confirmNewPassword =
                    'Password confirmation does not match the new password.';

                isValid = false;
            }


            return isValid;
        },


        async updatePassword() {

            // Validate form
            if (!this.validateForm()) {

                this.focusFirstError();

                return;
            }


            this.payload = {

                currentPassword: this.currentPassword,

                newPassword: this.newPassword

            };


            this.isLoading = true;


            try {

                await axios.post(
                    '/Manage/ChangePassword',
                    this.payload
                );


                this.isLoading = false;


                this.toastHandler(
                    'success',
                    'Password updated successfully.'
                );


                // Clear password fields
                this.currentPassword = '';
                this.newPassword = '';
                this.confirmNewPassword = '';


                this.errors = {
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: ''
                };


            } catch (error) {

                this.isLoading = false;

                console.error(error);


                let message = 'Unable to update password.';


                if (
                    error.response &&
                    error.response.data
                ) {

                    if (typeof error.response.data === 'string') {

                        message = error.response.data;

                    } else if (error.response.data.message) {

                        message = error.response.data.message;

                    }

                }


                this.toastHandler(
                    'error',
                    message
                );

            }

        },


        focusFirstError() {

            if (this.errors.currentPassword) {

                this.$refs.currentPassword?.focus();

                return;
            }


            if (this.errors.newPassword) {

                this.$refs.newPassword?.focus();

                return;
            }


            if (this.errors.confirmNewPassword) {

                this.$refs.confirmNewPassword?.focus();

            }

        },


        clearError(field) {

            this.errors[field] = '';

        },


        validateNewPassword() {

            if (!this.newPassword.trim()) {

                this.errors.newPassword =
                    'New Password is required.';

                return;

            }


            if (!this.passwordRegex.test(this.newPassword)) {

                this.errors.newPassword =
                    'Password must be at least 10 characters and contain uppercase, lowercase, number and special character.';

                return;

            }


            this.errors.newPassword = '';


            // Revalidate confirmation if user changes new password
            if (this.confirmNewPassword) {

                this.validateConfirmPassword();

            }

        },


        validateConfirmPassword() {

            if (!this.confirmNewPassword.trim()) {

                this.errors.confirmNewPassword =
                    'Confirm New Password is required.';

                return;

            }


            if (!this.passwordRegex.test(this.confirmNewPassword)) {

                this.errors.confirmNewPassword =
                    'Password confirmation must be at least 10 characters and contain uppercase, lowercase, number and special character.';

                return;

            }


            if (
                this.confirmNewPassword !==
                this.newPassword
            ) {

                this.errors.confirmNewPassword =
                    'Password confirmation does not match the new password.';

                return;

            }


            this.errors.confirmNewPassword = '';

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

    }

});


vue.mount('#app');