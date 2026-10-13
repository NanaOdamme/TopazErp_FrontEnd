
var vue = new Vue({
    el: '#app',
    data: {

        isShimmerLoading: false,
        payload: {},

    },

    methods: {

        getSetupData() {

            axios.get('/SharedResource/GetRelationships').then(response => {

                 
                this.renderTable(response.data);

            }).catch(err => {

                this.toastHandler('error', 'Unable to get relationships.');

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
                    { field: "name", headerText: "Relationship", validationRules: { required: true, minlength: 1 }, width: 80 },
                    { field: "tenantId", visible: false, headerText: "tenantId", width: 15, },

                ],
                endAdd: (args) => {

                    this.saveRelationship(args.data);
                },
                endEdit: (args) => {

                    this.updateRelationship(args.data);
                },
                endDelete: (args) => {

                    this.delRelationship(args.data.id);
                },
            });

        },

        saveRelationship(payload) {

            delete payload.id;
            delete payload.tenantId;

            axios.post('/SharedResource/CreateRelationship', payload).then(response => {

                this.getSetupData();

                if (response.data.code == 200) {
                    this.toastHandler('', 'Relationship saved.');

                }
                else {
                    this.toastHandler('error', response.data.message);

                }

            }).catch(err => {

                this.toastHandler('error', 'Unable to save relationship.');

            });
        },

        updateRelationship(payload) {

            axios.post('/SharedResource/UpdateRelationship', payload).then(response => {

                this.getSetupData();

                this.toastHandler('', 'Relationship updated.');


            }).catch(err => {

                this.toastHandler('error', 'Unable to update relationship.');

            });
        },

        delRelationship(id) {

            axios.get('/SharedResource/DelRelationship?id=' + id).then(response => {

                this.getSetupData();

                this.toastHandler('', 'Relationship deleted.');

            }).catch(err => {

                this.toastHandler('error', 'Unable to delete relationship.');

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