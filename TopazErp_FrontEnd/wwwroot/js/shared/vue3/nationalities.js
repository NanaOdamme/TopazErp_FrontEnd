const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            countries: [],
            theme: '#0645e7',
            columns: [
                { key: 'id', label: 'ID', type: 'text', hidden: true, editable: false, searchable: false},
                { key: 'name', label: 'Country', type: 'avatar', required: true, editable: false, searchable: true, width: '150', subtitleKey: 'code'},
                { key: 'numericIsoCode', label: 'Iso Code', type: 'number', required: true, editable: false, searchable: true, width: '50'},
                { key: 'nationality', label: 'Nationality', type: 'text', required: true, editable: false, searchable: true, width: '150'},
            ]
        }
    },
    methods: {
        getSetupData() {
            this.isShimmerLoading = true;
            axios.get(`/jsonDataSample/countries.json?v=${new Date().getTime()}`).then(response => {

                this.countries = response.data;
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