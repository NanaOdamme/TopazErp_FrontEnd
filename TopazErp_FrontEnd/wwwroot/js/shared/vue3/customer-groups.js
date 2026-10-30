const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
        }
    },

    methods: {

        getSetupData() {

            axios.get('/SharedResource/GetCustomerGroups').then(response => {

                this.renderTable(response.data);

            }).catch(err => {

                this.toastHandler('error', 'Unable to get supplier groups.');

            });
        },


        saveCustomerGroup(payload) {

            delete payload.id;
            delete payload.tenantId;

            axios.post('/SharedResource/CreateCustomerGroup', payload).then(response => {

                this.getSetupData();
                this.toastHandler('', 'Customer group saved.');

            }).catch(err => {

                this.toastHandler('error', 'Unable to save customer group.');

            });
        },

        updateCustomerGroup(payload) {

            axios.post('/SharedResource/UpdateCustomerGroup', payload).then(response => {

                this.getSetupData();

                this.toastHandler('', 'Customer group updated.');


            }).catch(err => {

                this.toastHandler('error', 'Unable to update customer group.');

            });
        },

        delCustomerGroup(id) {

            axios.get('/SharedResource/DelCustomerGroup?id=' + id).then(response => {

                this.getSetupData();

                this.toastHandler('', 'Customer group deleted.');

            }).catch(err => {

                this.toastHandler('error', 'Unable to delete customer group.');

            });
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

        },,

        
    },

    mounted() {

        this.getSetupData();
    }
});
app.use(DataGridPlugin);
app.mount('#app');