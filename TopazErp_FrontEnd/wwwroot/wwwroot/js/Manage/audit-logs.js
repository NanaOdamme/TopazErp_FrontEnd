const vue = Vue.createApp({

    data() {
        return {

            isLoading: false,
            auditLogsList: [],
            userList: [],
            auditLogInfo: {},
            customData: {},
            parameters: {},
            userInfo: null,
            selectedUserId: '',
            startDate: '',
            endDate: '',
            companyName: '',
            currentPage: 1,
            pageSize: 10,
            reportApiBaseUrl: '',
            showAuditReportModal: false,
            reportPathConfig: {
                summaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1786714285/erp-reports/manage/logs_qegz2c.rdl',
            },
            serviceNameMapping: [
                {'systemName': 'TopazERP.Web.Controllers.AccountController', 'friendlyName': 'User Account'},
                {'systemName': 'TopazERP.Web.Controllers.TenantsController', 'friendlyName': 'Tenants'},
                {'systemName': 'TopazERP.Web.Controllers.UsersController', 'friendlyName': 'Users'},
                {
                    'systemName': 'TopazERP.Web.Controllers.PayrollSetupsController',
                    'friendlyName': 'Setups',
                    'App': 'Payroll'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ProcessPayController',
                    'friendlyName': 'Process Pay',
                    'App': 'Payroll'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SalaryIncreaseController',
                    'friendlyName': 'Salary Increase',
                    'App': 'Payroll'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.PayrollImportDataController',
                    'friendlyName': 'Import Data - Payroll',
                    'App': 'Payroll'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.PayrollSharedResourceController',
                    'friendlyName': 'Shared Resources - Payroll',
                    'App': 'Payroll'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.PayrollReportsController',
                    'friendlyName': 'Payroll Reports',
                    'App': 'Payroll'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.PayrollDataEntryController',
                    'friendlyName': 'Payroll Enquiries',
                    'App': 'Payroll'
                },
                //school manager
                {
                    'systemName': 'TopazERP.Web.Controllers.SmCancelResultsPromotionsController',
                    'friendlyName': 'Cancel Results',
                    'App': 'School Manager'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SmBillingAndPaymentsController',
                    'friendlyName': 'Billing and Payments',
                    'App': 'School Manager'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SmDataEntryController',
                    'friendlyName': 'Data Entry',
                    'App': 'School Manager'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SmEditResultsPromotionsController',
                    'friendlyName': 'Edit Results',
                    'App': 'School Manager'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SmImportDataController',
                    'friendlyName': 'Import Data',
                    'App': 'School Manager'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SmMainSetups',
                    'friendlyName': 'Main Setups',
                    'App': 'School Manager'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SmReportsController',
                    'friendlyName': 'Reports',
                    'App': 'School Manager'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SmResultsPromotionsController',
                    'friendlyName': 'Results & Promotions',
                    'App': 'School Manager'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SmSharedResourcesController',
                    'friendlyName': 'Shared Resources',
                    'App': 'School Manager'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SmStaffSetupsController',
                    'friendlyName': 'Staff Setups',
                    'App': 'School Manager'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SmStudentSetupsController',
                    'friendlyName': 'Student Setups',
                    'App': 'School Manager'
                },
                //Ap
                {
                    'systemName': 'TopazERP.Web.Controllers.ApDataEntryController',
                    'friendlyName': 'Accounts Payable',
                    'App': 'Accounts Payable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ApEmailController',
                    'friendlyName': 'Email',
                    'App': 'Accounts Payable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ApEnquiriesController',
                    'friendlyName': 'Enquiries',
                    'App': 'Accounts Payable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ApEnterpriseDataEntryController',
                    'friendlyName': 'Enterprise Data Entry',
                    'App': 'Accounts Payable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ApImportDataController',
                    'friendlyName': 'Import Data',
                    'App': 'Accounts Payable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ApReportsController',
                    'friendlyName': 'Reports',
                    'App': 'Accounts Payable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ApSharedResourcesController',
                    'friendlyName': 'Shared Resources',
                    'App': 'Accounts Payable'
                },

                //AR
                {
                    'systemName': 'TopazERP.Web.Controllers.ArDataEntryController',
                    'friendlyName': 'Accounts Receivable',
                    'App': 'Accounts Receivable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ArEmailController',
                    'friendlyName': 'Email',
                    'App': 'Accounts Receivable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ArEnquiriesController',
                    'friendlyName': 'Enquiries',
                    'App': 'Accounts Receivable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ArEnterpriseDataEntryController',
                    'friendlyName': 'Enterprise Data Entry',
                    'App': 'Accounts Receivable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ArImportDataController',
                    'friendlyName': 'Import Data',
                    'App': 'Accounts Receivable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ArReportsController',
                    'friendlyName': 'Reports',
                    'App': 'Accounts Receivable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.ArSharedResourcesController',
                    'friendlyName': 'Shared Resources',
                    'App': 'Accounts Receivable'
                },
                {
                    'systemName': 'TopazERP.Web.Controllers.SharedResourceController',
                    'friendlyName': 'Shared Resources',
                    'App': 'Shared Resources'
                },
                //manage
                {
                    'systemName': 'TopazERP.Web.Controllers.ManageController',
                    'friendlyName': 'Manage',
                    'App': 'Manage Users'
                },
                //Dashboard
                {'systemName': 'TopazERP.Web.Controllers.DashboardController', 'friendlyName': 'Dashboard'}

                //ledger
            ]
        }

    },
    computed: {
        totalPages() {

            return Math.max(
                1,
                Math.ceil(
                    this.auditLogsList.length /
                    this.pageSize
                )
            );

        },
        paginatedAuditLogs() {

            const start =
                (this.currentPage - 1) *
                this.pageSize;

            const end =
                start + this.pageSize;

            return this.auditLogsList.slice(
                start,
                end
            );

        },
        paginationPages() {

            const total = this.totalPages;
            const current = this.currentPage;

            // If there are only a few pages,
            // show all of them.
            if (total <= 7) {

                return Array.from(
                    { length: total },
                    (_, index) => index + 1
                );

            }


            const pages = [];


            // Always show first page
            pages.push(1);


            /*
             * Near the beginning
             *
             * 1 2 3 4 5 ... 20
             */
            if (current <= 4) {

                pages.push(2);
                pages.push(3);
                pages.push(4);
                pages.push(5);
                pages.push('...');
                pages.push(total);

                return pages;

            }


            /*
             * Near the end
             *
             * 1 ... 16 17 18 19 20
             */
            if (current >= total - 3) {

                pages.push('...');

                pages.push(total - 4);
                pages.push(total - 3);
                pages.push(total - 2);
                pages.push(total - 1);
                pages.push(total);

                return pages;

            }


            /*
             * Somewhere in the middle
             *
             * 1 ... 8 9 10 11 12 ... 20
             */
            pages.push('...');

            pages.push(current - 2);
            pages.push(current - 1);
            pages.push(current);
            pages.push(current + 1);
            pages.push(current + 2);

            pages.push('...');

            pages.push(total);


            return pages;

        },


        paginationStart() {

            if (!this.auditLogsList.length) {
                return 0;
            }

            return (
                (this.currentPage - 1) *
                this.pageSize
            ) + 1;

        },
        paginationEnd() {

            return Math.min(
                this.currentPage * this.pageSize,
                this.auditLogsList.length
            );

        },


    },
    methods: {
        formatDateTime(dateInput) {
            return moment(dateInput).format("DD-MMM-YYYY hh:mm:ss A");
        },
        getCurrentDate() {
            const today = new Date();

            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        },
        getAuditLogs() {

            if (!this.startDate || !this.endDate) {
                this.toastHandler('warning', 'Please select a start date and end date.');
                return;
            }

            this.isLoading = true;

            axios.get('http://localhost:5300/Manage/GetLogs', {
                params: {
                    startDate: this.startDate,
                    endDate: this.endDate
                },
                withCredentials: true
            })
                .then(response => {

                    response.data.forEach((v) => {

                        v.urlPath = this.resolveUrlPath(
                            v.serviceName
                        );
                        v.application = this.getAppName(v.serviceName);

                        if (v.userId) {
                            var userInfo = this.getUserDetails(v.userId);

                            if (userInfo) {
                                v.userFullName = userInfo.fullName;
                            }
                        }

                        // Set action message
                        if (v.status === 'Success') {
                            v.actionMessage = 'Action successful';
                        } else {
                            v.actionMessage = v.exceptionMessage || 'An error occurred.';
                        }

                    });

                    this.auditLogsList = response.data;

                    this.isLoading = false;

                })
                .catch(err => {

                    console.log(err);

                    this.isLoading = false;

                    this.toastHandler('error', 'Unable to get logs.');

                });
        },
        getUsers() {
            axios.get(`http://localhost:5300/Manage/GetUsers?pageNo=1&pageSize=100000`,{
                withCredentials: true
            }).then(response => {

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

        resolveUrlPath(serviceName) {

            let snInfo = this.getServiceDetails(serviceName);

            if (snInfo) {
                return snInfo.friendlyName;

            }

            return serviceName;

        },
        getAppName(serviceName) {
            let snInfo = this.getServiceDetails(serviceName);

            if (snInfo) {
                return snInfo.App || snInfo.friendlyName;
            }

            return serviceName;
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
        generateAuditLogJson() {
            return this.auditLogsList.map(log => ({
                user: log.userFullName || '__',
                menu: log.urlPath,
                action: log.methodName,
                actionResult: log.actionMessage,
                executionTime: this.formatDateTime(log.executionTime),
                application: log.application || '__'
            }));
        },
        getCompanyProfile() {
            return axios.all([
                axios.get('http://localhost:5300/SmMainSetups/GetSchoolProfile',{
                    withCredentials: true
                }),
                axios.get('http://localhost:5300/SharedResource/GetBusinessProfile',{
                    withCredentials: true
                })
            ])
                .then(
                    axios.spread((schoolResponse, companyResponse) => {

                        const schoolData = schoolResponse.data;
                        const companyData = companyResponse.data;

                        const schoolName = schoolData?.schoolName || '';
                        const companyName = companyData?.companyName || '';

                        // Company takes priority
                        if (companyName) {
                            this.companyName = companyName;
                        }
                        else if (schoolName) {
                            this.companyName = schoolName;
                        }
                        else {
                            this.companyName = '';
                        }


                    })
                )
                .catch(error => {

                    console.error('Unable to get company profile:', error);

                    this.companyName = '';
                });
        },
        applicationClass(application) {

            switch (application) {

                case 'Payroll':
                    return 'badge bg-sky-500';

                case 'School Manager':
                    return 'badge bg-blue-900';

                case 'Accounts Payable':
                    return 'badge bg-green-500';

                case 'Accounts Receivable':
                    return 'badge bg-orange-500';

                case 'General Ledger':
                    return 'badge bg-zinc-500';

                case 'Stock Manager':
                    return 'badge bg-rose-500';

                case 'Asset Manager':
                    return 'badge bg-indigo-500';

                case 'School Manager Pro':
                    return 'badge bg-violet-900';

                case 'Shared Resources':
                    return 'badge bg-zinc-400';
                case 'Manage Users':
                    return 'badge bg-purple-500';
                default:
                    return 'badge bg-zinc-500';
            }
        },
        /*
        * Pagination
        */
        changePage(page) {

            if (
                page < 1 ||
                page > this.totalPages
            ) {
                return;
            }

            this.currentPage = page;

        },
        renderReport(header, details, reportPath) {
            $("#reportView").empty();

            $("#reportView").boldReportViewer({
                reportServiceUrl: this.reportApiBaseUrl,
                processingMode: ej.ReportViewer.ProcessingMode.Local,
                toolbarSettings: {
                    showToolbar: true,
                    items: ej.ReportViewer.ToolbarItems.All &
                        ~ej.ReportViewer.ToolbarItems.Print
                },
                reportPath: reportPath,
                dataSources: [
                    {
                        value: header,
                        name: "DataSet1"
                    },
                    {
                        value: details,
                        name: "DataSet2"
                    }
                ],
                reportError: (args) => {
                    console.error('Bold Report error:', args);
                    this.toastHandler('warning', 'No data available for the selected criteria.');
                }
            });
        },
        generateAuditLogReport() {

            const details = this.generateAuditLogJson();

            if (!details || details.length === 0) {
                this.toastHandler(
                    'warning',
                    'No audit logs found for the selected applications.'
                );
                return;
            }

            const header = [
                {
                    companyName: this.companyName || ''
                }
            ];

            const reportPath = this.reportPathConfig.summaryReportPath;
            // Show the modal
            this.showAuditReportModal = true;

            // Give the modal time to become visible before initializing
            // the Bold Report Viewer.
            setTimeout(() => {

                this.renderReport(
                    header,
                    details,
                    reportPath
                );

            }, 300);
        },
        // ==========================================
        // SWEETALERT TOAST
        // ==========================================
        toastHandler(
            type = 'success',
            message = 'An unexpected error occurred.'
        ) {

            Swal.fire({

                toast: true,

                position: 'top-end',

                icon: type,

                title: message,

                showConfirmButton: false,

                timer: 4000,

                timerProgressBar: true

            });

        }

    },
    filters: {

        formatShortDate(dateInput) {

            return moment(dateInput).format("DD-MMM-YYYY");
        },

        formatDateTime(dateInput) {

            return moment(dateInput).format("DD-MMM-YYYY hh:mm:ss A");
        },
    },

    created() {

        const currentDate = this.getCurrentDate();

        this.startDate = currentDate;
        this.endDate = currentDate;

        this.getUsers();
        this.getCompanyProfile();
        setTimeout(() => {
            this.getAuditLogs();
        }, 800);
        this.reportApiBaseUrl = reportApiBaseUrl;


    },
});
vue.mount('#app');