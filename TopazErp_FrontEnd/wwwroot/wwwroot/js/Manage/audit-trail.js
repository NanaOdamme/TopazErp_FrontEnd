
var vue = new Vue({
    el: '#app',
    components: {
        Multiselect: window.VueMultiselect.default
    },
    data: {

        isLoading: false,
        auditLogsList: [],
        userList: [],
        pageNo: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
        upperBound: 0,
        lowerBound: 0,
        auditLogInfo: {},
        customData: {},
        parameters: {},
        userInfo: null,
        selectedUserId: '',
        startDate: '',
        endDate: '',
        serviceNameMapping: [
            { 'systemName': 'TopazERP.Web.Controllers.AccountController', 'friendlyName': 'User Account' },
            { 'systemName': 'TopazERP.Web.Controllers.TenantsController', 'friendlyName': 'Tenants' },
            { 'systemName': 'TopazERP.Web.Controllers.UsersController', 'friendlyName': 'Users' },
            { 'systemName': 'TopazERP.Web.Controllers.PayrollSetupsController', 'friendlyName': 'Setups' },
            { 'systemName': 'TopazERP.Web.Controllers.ProcessPayController', 'friendlyName': 'Process Pay' },
            { 'systemName': 'TopazERP.Web.Controllers.SalaryIncreaseController', 'friendlyName': 'Salary Increase' },
            { 'systemName': 'TopazERP.Web.Controllers.PayrollImportDataController', 'friendlyName': 'Import Data - Payroll' },
            { 'systemName': 'TopazERP.Web.Controllers.PayrollSharedResourceController', 'friendlyName': 'Shared Resources - Payroll' },
            { 'systemName': 'TopazERP.Web.Controllers.PayrollReportsController', 'friendlyName': 'Payroll Reports' },
            { 'systemName': 'TopazERP.Web.Controllers.PayrollDataEntryController', 'friendlyName': 'Payroll Enquiries' },
            //school manager
            { 'systemName': 'TopazERP.Web.Controllers.SmCancelResultsPromotionsController', 'friendlyName': 'Cancel Results - School Manager' },
            { 'systemName': 'TopazERP.Web.Controllers.SmBillingAndPaymentsController', 'friendlyName': 'Billing and Payments - School Manager' },
            { 'systemName': 'TopazERP.Web.Controllers.SmDataEntryController', 'friendlyName': 'Data Entry - School Manager' },
            { 'systemName': 'TopazERP.Web.Controllers.SmEditResultsPromotionsController', 'friendlyName': 'Edit Results - School Manager' },
            { 'systemName': 'TopazERP.Web.Controllers.SmImportDataController', 'friendlyName': 'Import Data - School Manager' },
            { 'systemName': 'TopazERP.Web.Controllers.SmMainSetups', 'friendlyName': 'Main Setups - School Manager' },
            { 'systemName': 'TopazERP.Web.Controllers.SmReportsController', 'friendlyName': 'Reports - School Manager' },
            { 'systemName': 'TopazERP.Web.Controllers.SmResultsPromotionsController', 'friendlyName': 'Results & Promotions - School Manager' },
            { 'systemName': 'TopazERP.Web.Controllers.SmSharedResourcesController', 'friendlyName': 'Shared Resources - School Manager' },
            { 'systemName': 'TopazERP.Web.Controllers.SmStaffSetupsController', 'friendlyName': 'Staff Setups - School Manager' },
            { 'systemName': 'TopazERP.Web.Controllers.SmStudentSetupsController', 'friendlyName': 'Student Setups - School Manager' },
            //Ap
            { 'systemName': 'TopazERP.Web.Controllers.ApDataEntryController', 'friendlyName': 'Accounts Payable - AP' },
            { 'systemName': 'TopazERP.Web.Controllers.ApEmailController', 'friendlyName': 'Email - AP' },
            { 'systemName': 'TopazERP.Web.Controllers.ApEnquiriesController', 'friendlyName': 'Enquiries - AP' },
            { 'systemName': 'TopazERP.Web.Controllers.ApEnterpriseDataEntryController', 'friendlyName': 'Enterprise Data Entry - AP' },
            { 'systemName': 'TopazERP.Web.Controllers.ApImportDataController', 'friendlyName': 'Import Data - AP' },
            { 'systemName': 'TopazERP.Web.Controllers.ApReportsController', 'friendlyName': 'Reports - AP' },
            { 'systemName': 'TopazERP.Web.Controllers.ApSharedResourcesController', 'friendlyName': 'Shared Resources - AP' },
            
            //AR
            { 'systemName': 'TopazERP.Web.Controllers.ArDataEntryController', 'friendlyName': 'Accounts Receivable - AR' },
            { 'systemName': 'TopazERP.Web.Controllers.ArEmailController', 'friendlyName': 'Email - AR' },
            { 'systemName': 'TopazERP.Web.Controllers.ArEnquiriesController', 'friendlyName': 'Enquiries - AR' },
            { 'systemName': 'TopazERP.Web.Controllers.ArEnterpriseDataEntryController', 'friendlyName': 'Enterprise Data Entry - AR' },
            { 'systemName': 'TopazERP.Web.Controllers.ArImportDataController', 'friendlyName': 'Import Data - AR' },
            { 'systemName': 'TopazERP.Web.Controllers.ArReportsController', 'friendlyName': 'Reports - AR' },
            { 'systemName': 'TopazERP.Web.Controllers.ArSharedResourcesController', 'friendlyName': 'Shared Resources - AR' },
            
            //manage
            { 'systemName': 'TopazERP.Web.Controllers.ManageController', 'friendlyName': 'Manage'},
            //Dashboard
            { 'systemName': 'TopazERP.Web.Controllers.DashboardController', 'friendlyName': 'Dashboard' }
        ]

    },

    methods: {

        getAuditLogs() {

            axios.get(`/Manage/GetAuditLogs?pageNo=${this.pageNo}&pageSize=${this.pageSize}`).then(response => {

                response.data.data.forEach((v) => {

                    v.urlPath = this.resolveUrlPath(v.serviceName, v.methodName);

                    if (v.userId) {
                        var userInfo = this.getUserDetails(v.userId);
                        v.userFullName = userInfo.fullName;
                    }


                });

                this.auditLogsList = response.data.data;
                this.totalCount = response.data.totalCount;
                this.totalPages = response.data.totalPages;

            }).catch(err => {

                console.log(err);
                this.toastHandler('error', 'Unable to get logs.');

            });
        },

        filterAuditLogs() {


            if (this.startDate || this.endDate || this.selectedUserId) {

                this.isLoading = true;
                this.pageNo = 1;
                this.pageSize = 10;
                axios.get(`/Manage/FilterAuditLogs?pageNo=${this.pageNo}&pageSize=${this.pageSize}&startDate=${this.startDate}&endDate=${this.endDate}&userId=${this.selectedUserId}`).then(response => {

                    response.data.data.forEach((v) => {

                        v.urlPath = this.resolveUrlPath(v.serviceName, v.methodName);

                        var userInfo = this.getUserDetails(v.userId);

                        v.userFullName = userInfo.fullName;

                    });


                    this.auditLogsList = response.data.data;
                    this.totalCount = response.data.totalCount;
                    this.totalPages = response.data.totalPages;

                    this.isLoading = false;


                }).catch(err => {

                    this.isLoading = true;

                    this.toastHandler('error', 'Unable to filter audit logs.');

                });

            }



        },

        getUsers() {

            axios.get(`/Manage/GetUsers?pageNo=1&pageSize=100000`).then(response => {

                this.userList = response.data.data;

            }).catch(err => {

                this.toastHandler('error', 'Unable to get logs.');

            });

        },

        viewDetail(auditLogInfo) {

            console.log(auditLogInfo);

            this.auditLogInfo = auditLogInfo;

            this.customData = {};
            this.parameters = {};

            if (auditLogInfo.customData) {
                try {
                    this.customData = JSON.parse(auditLogInfo.customData);
                } catch (error) {
                    console.error('Invalid customData:', error);

                    this.customData = {
                        _summary: 'Custom data could not be parsed.'
                    };
                }
            }

            if (auditLogInfo.parameters) {
                try {
                    this.parameters = JSON.parse(auditLogInfo.parameters);
                } catch (error) {
                    console.error('Invalid parameters:', error);

                    this.parameters = {
                        _summary: 'Parameters could not be parsed because the stored data is incomplete.'
                    };
                }
            }

            $('#auditLog').modal('show');
        },

        resolveUrlPath(serviceName, methodName) {

            let snInfo = this.getServiceDetails(serviceName);

            if (snInfo) {
                let path = snInfo.friendlyName + '/' + methodName;
                return path;

            }

            return serviceName + '/' + methodName;

        },
        getServiceDetails(name) {

            return this.serviceNameMapping.find(a => a.systemName === name);
        },
        getUserDetails(id) {

            return this.userList.find(a => a.id === id);
        },
        onSelectCourse(user) {

            this.selectedUserId = user.id;
        },
        onPageChanged(page) {

            this.pageNo = page;

            if (this.startDate || this.endDate || this.selectedUserId) {

                this.filterAuditLogs();

            } else {
                this.getAuditLogs();

            }
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
    filters: {

        formatShortDate(dateInput) {

            return moment(dateInput).format("DD-MMM-YYYY");
        },

        formatDateTime(dateInput) {

            return moment(dateInput).format("DD-MMM-YYYY hh:mm:ss A");
        },
    },
    computed: {

        pageList() {

            let counter = 1;
            let initPage = 1;
            const currentPage = this.pageNo;
            const pages = this.totalPages;

            if (currentPage > 9 && pages > 10) {
                initPage = currentPage - 5;
            }

            const pageNumbers = [];

            for (let i = initPage; i <= pages; i++) {
                pageNumbers.push(i);
                counter++;
                if (counter > 10) {
                    break;
                }
            }

            return pageNumbers;

        },
         


    },
    created() {

        this.getUsers();

        setTimeout(() => { this.getAuditLogs(); }, 800);


    },
});