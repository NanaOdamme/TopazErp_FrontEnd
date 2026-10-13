
const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            payload: {},
            currencyRates: [],
            currencyList:[],
            theme: '#0645e7',
            currencyColumn : [
                { key:'id',         label:'ID',         type:'text', hidden:true,   width:74, help:'Auto-filled, but you can change it' },
                { key:'currencyName',       label:'Currency Name',     type:'avatar',   width:150, minWidth:250, required:true, searchable:true, subtitleKey:'currencyCode' },
                { key:'currencyCode',      label:'Currency Code',      type:'text',    width:80, searchable:true,},
                { key:'minorName',      label:'Minor Name',      type:'text',    width:80,  required:true, searchable:true,},
                { key: "buyRate", label: "Buy Rate", type:'number', required:true, searchable:true, width: 80, decimals:4 },
                { key: "sellRate", label: "Sell Rate", type:'number', required:true, searchable:true, width: 80, decimals:4 },
                { key:'tenantId',      label:'Tenant',      type:'number', hidden:true, minWidth:74 }
            ],
            ratesColumn : {
                key:'rates', title:'Rates',
                columns: [
                    { key: "id", label: 'id', hidden:true,  width: 10 },
                    { key:'createdAt',      label:'Created At',      type:'date',    width:80, searchable:true,},
                    { key: "buyingRate", label: "Buy Rate", type:'number', required:true, searchable:true, width: 80, decimals:4 },
                    { key: "sellingRate", label: "Sell Rate", type:'number', required:true, searchable:true, width: 80, decimals:4 },
                ]
            }
        }
    },

    methods: {

      /*  getSetupData() {

            axios.get('http://localhost:5300/SharedResource/GetCurrencys', {withCredentials:true}).then(response => {


                this.currencyRates = [];
               
                if (response.data) {


                    response.data.forEach((header) => {

                        header.headerId = header.id;
                        header.rates.forEach((detail) => {

                            detail.headerId = header.id
                            detail.createdAt = this.formatShortDate(detail.createdAt);

                            this.currencyRates.push(detail);
                        });

                    });
                    this.currencyList = response.data;
                    

                }



            }).catch(err => {

                this.toastHandler('error', 'Unable to get currency.');

            });
        },*/

        renderTable() {
            this.currencyColumn = [
                { key:'id',         label:'ID',         type:'text', hidden:true,   width:74, help:'Auto-filled, but you can change it' },
                { key:'currencyName',       label:'Currency Name',     type:'avatar',   width:250, minWidth:250, required:true, searchable:true, subtitleKey:'currencyCode' },
                { key:'currencyCode',      label:'Currency Code',      type:'text',    width:230, searchable:true,},
                { key:'minorName',      label:'Minor Name',      type:'text',    width:250,  required:true, searchable:true,},
                { key: "buyRate", label: "Buy Rate", type:'number', required:true, searchable:true, width: 80, decimals:4 },
                { key: "sellRate", label: "Sell Rate", type:'number', required:true, searchable:true, width: 80, decimals:4 },
                { key:'tenantId',      label:'Tenant',      type:'number', hidden:true, minWidth:74 }
            ];
            this.ratesColumn = {
                key:'bankBranches', title:'Rates',
                columns: [
                    { key: "id", label: 'id', hidden:true,  width: 10 },
                    { key:'createdAt',      label:'Created At',      type:'date',    width:230, searchable:true,},
                    { key:'minorName',      label:'Minor Name',      type:'text',    width:250,  required:true, searchable:true,},
                    { key: "buyingRate", label: "Buy Rate", type:'number', required:true, searchable:true, width: 80, decimals:4 },
                    { key: "sellingRate", label: "Sell Rate", type:'number', required:true, searchable:true, width: 80, decimals:4 },
                ]
            }

        },

        saveCurrency(payload) {

            delete payload.id;
            delete payload.tenantId;
            payload.Rates = [{ id: this.uuid(), createdAt: moment().format("DD-MMM-YYYY"), sellingRate : payload.sellRate, buyingRate: payload.buyRate }];

            axios.post('/SharedResource/CreateCurrency', payload).then(response => {

                this.getSetupData();
                this.toastHandler('', 'Currency saved.');

            }).catch(err => {

                this.toastHandler('error', 'Unable to save currency.');

            });
        },

        updateCurrency(payload) {

            payload.Rates = [{ id: this.uuid(), createdAt: moment().format("DD-MMM-YYYY"), sellingRate : payload.sellRate, buyingRate: payload.buyRate }];

            axios.post('/SharedResource/UpdateCurrency', payload).then(response => {

                this.getSetupData();

                this.toastHandler('', 'Currency updated.');


            }).catch(err => {

                this.toastHandler('error', 'Unable to update currency.');

            });
        },

        delCurrency(id) {

            axios.get('/SharedResource/DelCurrency?id=' + id).then(response => {

                this.getSetupData();

                this.toastHandler('', 'Currency deleted.');

            }).catch(err => {

                this.toastHandler('error', 'Unable to delete currency.');

            });
        },
        formatShortDate(dateInput) {

            return moment(dateInput).format("DD-MMM-YYYY");

        },
        uuid() {

            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
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

     //   this.getSetupData();
       /* this.renderTable();*/
    },
});
app.use(DataGridPlugin);
app.mount('#app');