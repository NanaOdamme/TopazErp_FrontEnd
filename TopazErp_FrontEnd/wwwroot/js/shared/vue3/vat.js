var vue = new Vue({
    el: '#app2',
    data: {

        isShimmerLoading: false,
        isLoading: false,
        nationalityList: [],
        currencyList: [],
        payload: {},
        emptyGuid: '00000000-0000-0000-0000-000000000000',
        companyProfileId: '',
        isTaxLevyInclusive: false,
        vatList: [],
        vatId: '',
        tenantId: '',
    },
    methods: {

        //get vat
        getVat() {

            axios.get('/SharedResource/GetVat').then(response => {

                this.vatList = response.data;
                this.renderTable1(response.data);

            }).catch(err => {

                this.toastHandler('error', 'Unable to get vat.');

            });
        },
        //rendertable
        renderTable1(responseData) {

            $("#dataTable1").ejGrid({

                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true, showDeleteConfirmDialog: true },
                toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Add, ej.Grid.ToolBarItems.Edit, ej.Grid.ToolBarItems.Delete, ej.Grid.ToolBarItems.Update, ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                columns: [

                    { field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true, background: "red" },
                    { field: "name", headerText: "Tax Levy Type", validationRules: { required: true, minlength: 1 }, width: 80 },
                    { field: "rate", headerText: "Rate",editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 },format: "{0:n2}", validationRules: { required: true, minlength: 1 }, width: 80 },
                    { field: "tenantId", visible: false, headerText: "tenantId", width: 15, },

                ],
                endAdd: (args) => {

                    this.saveVat(args.data);
                },
                endEdit: (args) => {

                    this.updateVat(args.data);
                },
                endDelete: (args) => {

                    this.delVat(args.data.id);
                },
            });

        },
        saveVat(payload) {

            delete payload.id;
            delete payload.tenantId;

            axios.post('/SharedResource/CreateVat', payload).then(response => {

                this.getVat();

                if (response.data.code === 200) {
                    this.toastHandler('', 'VAT saved.');
                }
                else {
                    this.toastHandler('error', response.data.message);

                }

            }).catch(err => {

                this.toastHandler('error', 'Unable to save data.');

            });
        },

        updateVat(payload) {

            axios.post('/SharedResource/UpdateVat', payload).then(response => {

                this.getVat();

                this.toastHandler('', 'Data updated.');


            }).catch(err => {

                this.toastHandler('error', 'Unable to update data.');

            });
        },

        delVat(id) {

            axios.get('/SharedResource/DelVat/?id=' + id).then(response => {

                this.getVat();

                this.toastHandler('', 'Data deleted.');

            }).catch(err => {

                this.toastHandler('error', 'Unable to delete data.');

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
    watch: {



    },
    created() {
        this.getVat();
    },
});