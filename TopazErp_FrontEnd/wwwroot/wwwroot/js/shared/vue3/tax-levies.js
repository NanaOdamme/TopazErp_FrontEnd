var vue = new Vue({
    el: '#app1',
    data: {

        isShimmerLoading: false,
        isLoading: false,
        nationalityList: [],
        currencyList: [],
        payload: {},
        emptyGuid: '00000000-0000-0000-0000-000000000000',
        companyProfileId: '',
        isTaxLevyInclusive: false,
        taxLevyList: [],
        taxlevyId: '',
        tenantId: '',
        amount: 0,
    },
    methods: {

        //get tax levies
        getTaxLevies() {

            axios.get('/SharedResource/GetTaxLevies').then(response => {

                this.taxLevyList = response.data;
                this.renderTable(response.data);

            }).catch(err => {

                this.toastHandler('error', 'Unable to get tax levies.');

            });
        },
        
        //rendertable
        renderTable(responseData) {

            $("#dataTable").ejGrid({

                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true, showDeleteConfirmDialog: true },
                toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Add, ej.Grid.ToolBarItems.Edit, ej.Grid.ToolBarItems.Delete, ej.Grid.ToolBarItems.Update, ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                columns: [

                    { field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true, background: "red" },
                    { field: "name", headerText: "Tax Levy Type", validationRules: { required: true, minlength: 1 }, width: 80 },
                    { field: "percentage", headerText: "Rate",editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 4 },format: "{0:n2}", validationRules: { required: true, minlength: 1 }, width: 80 },
                    { field: "tenantId", visible: false, headerText: "tenantId", width: 15, },
                    { field: "amount", visible: false, headerText: "Inclusive",width: 15 },
                ],
                endAdd: (args) => {

                    this.saveTaxLevy(args.data);
                },
                endEdit: (args) => {

                    this.updateTaxLevy(args.data);
                },
                endDelete: (args) => {

                    this.delTaxLevy(args.data.id);
                },
            });

        },
        saveTaxLevy(payload) {
            delete payload.id;
            delete payload.tenantId;
            axios.post('/SharedResource/CreateTaxLevy', payload).then(response => {

                this.getTaxLevies();

                if (response.data.code === 200) {
                    this.toastHandler('', 'Tax Levy saved.');
                }
                else {
                    this.toastHandler('error', response.data.message);

                }

            }).catch(err => {

                this.toastHandler('error', 'Unable to save data.');

            });
        },

        updateTaxLevy(payload) {
            axios.post('/SharedResource/UpdateTaxLevy', payload).then(response => {

                this.getTaxLevies();

                this.toastHandler('', 'Data updated.');


            }).catch(err => {

                this.toastHandler('error', 'Unable to update data.');

            });
        },

        delTaxLevy(id) {

            axios.get('/SharedResource/DelTaxLevy?id=' + id).then(response => {

                this.getTaxLevies();

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
        this.getTaxLevies();

    },
});