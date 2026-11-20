const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            paymentMethods: [],
            theme: '#062a81',
            columns: [
                { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false},
                { key: 'name', label: 'Term', type: 'text', required: true, editable: false, searchable: true, width: '250'},

            ]
        }
    },
    methods: {
        getSetupData() {
            this.isShimmerLoading = true;
            axios.get(`/jsonDataSample/paymentMethods.json?v=${new Date().getTime()}`).then(response => {

                this.paymentMethods = response.data;
                this.isShimmerLoading = false;
            }).catch(err => {

                this.toastHandler('error', 'Unable to get term.');

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

        },

    },

    mounted() {

        this.getSetupData();

    },
});
app.use(DataGridPlugin);
app.mount('#app');