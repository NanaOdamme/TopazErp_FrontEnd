const isoDate = (date) => {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
};
const today = isoDate(new Date());

const app = Vue.createApp({
    data() {
        return {
            isLoading: false,
            payload: {},
            startDate: today,
            agingInterval: 30,
            theme: '#0645e7',
            agingData: [],
            
        }
    },
        computed: {
            first() {
                return this.agingInterval;
            },
            second() {
                return this.agingInterval * 2;
            },
            third() {
                return this.agingInterval * 3;
            },
            agingColumns() {
                return [
                    { key: 'currencyCode', label: 'Currency', type: 'text', hidden: true, editable: false },
                    { key: 'invoiceNumber', label: 'Invoice Number', type: 'text', width: 150, searchable: true },
                    { key: 'invoiceDate', label: 'Invoice Date', type: 'date', width: 130, searchable: true },
                    { key: 'purchaseOrderNumber', label: 'PO Number', type: 'text', width: 130, searchable: true },
                    { key: 'totalInvoiceAmount', label: 'Amount', type: 'number', width: 130, decimals: 2, agg: 'sum' },
                    { key: 'paidAmount', label: 'Paid', type: 'number', width: 120, decimals: 2, agg: 'sum' },
                    { key: 'balance', label: 'Balance', type: 'number', width: 130, decimals: 2, agg: 'sum' },
                    { key: 'currentDay', label: 'Current', type: 'number', width: 120, decimals: 2, agg: 'sum' },
                    { key: 'agingFirst', label: `${this.first} Days`, type: 'number', width: 120, decimals: 2, agg: 'sum' },
                    { key: 'agingSecond', label: `${this.second} Days`, type: 'number', width: 120, decimals: 2, agg: 'sum' },
                    { key: 'agingThird', label: `${this.third}+ Days`, type: 'number', width: 120, decimals: 2, agg: 'sum' }
                ];
            }
        },
   
    methods: {
        getAgingData() {
            let url = `http://localhost:5300/ApReports/GetAgeingByDate?startDate=${this.startDate}&agingInterval=${this.agingInterval}`
            axios.get(url, {WithCredentials:true}).then(response => {
                this.agingData = response.data.reportDetails.invoices;
              
                this.isLoading = false;

            }).catch(err => {

                this.toastHandler('error', 'Unable to get data');
                this.isLoading = false;

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

      this.getAgingData();


    },
});
app.use(DataGridPlugin);
app.mount('#app');