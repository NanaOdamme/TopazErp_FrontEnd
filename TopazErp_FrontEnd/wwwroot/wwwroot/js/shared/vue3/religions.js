
var vue = new Vue({
    el: '#app',
    data: {

        isShimmerLoading: false,
        payload: {},

    },

    methods: {

        getSetupData() {

            axios.get('/SharedResource/GetReligions').then(response => {

                 
                this.renderTable(response.data);

            }).catch(err => {

                this.toastHandler('error', 'Unable to get religions.');

            });
        },

        renderTable(responseData) {

            $("#dataTable").ejGrid({

                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true, showDeleteConfirmDialog: true },
                toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Add, ej.Grid.ToolBarItems.Edit, ej.Grid.ToolBarItems.Delete, ej.Grid.ToolBarItems.Update, ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                columns: [

                    { field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true, },
                    { field: "name", headerText: "Religion", validationRules: { required: true, minlength: 1 }, width: 80 },
                    { field: "tenantId", visible: false, headerText: "tenantId", width: 15, },

                ],
                endAdd: (args) => {

                    this.saveReligion(args.data);
                },
                endEdit: (args) => {

                    this.updateReligion(args.data);
                },
                endDelete: (args) => {

                    this.delReligion(args.data.id);
                },
            });

        },

        saveReligion(payload) {

            delete payload.id;
            delete payload.tenantId;

            axios.post('/SharedResource/CreateReligion', payload).then(response => {

                this.getSetupData();

                if (response.data.code == 200) {
                    this.toastHandler('', 'Religion saved.');

                }
                else {
                    this.toastHandler('error', response.data.message);

                }

            }).catch(err => {

                this.toastHandler('error', 'Unable to save religion.');

            });
        },

        updateReligion(payload) {

            axios.post('/SharedResource/UpdateReligion', payload).then(response => {

                this.getSetupData();

                this.toastHandler('', 'Religion updated.');


            }).catch(err => {

                this.toastHandler('error', 'Unable to update religion.');

            });
        },

        delReligion(id) {

            axios.get('/SharedResource/DelReligion?id=' + id).then(response => {

                this.getSetupData();

                this.toastHandler('', 'Religion deleted.');

            }).catch(err => {

                this.toastHandler('error', 'Unable to delete religion.');

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

    created() {

        this.getSetupData();
    },
});