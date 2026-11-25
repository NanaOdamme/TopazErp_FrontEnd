(() => {
    'use strict';

    const pad = (value) => String(value).padStart(2, '0');

    // Convert dates to YYYY-MM-DD without Moment.
    const isoDate = (date) => {
        if (date === null || date === undefined || date === '') return '';

        if (typeof date === 'string') {
            const raw = date.trim();

            if (!raw) return '';

            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
                return raw.slice(0, 10);
            }

            // Handle .NET JSON dates.
            const ms = /\/Date\((-?\d+)\)\//.exec(raw);

            if (ms) {
                const d = new Date(Number(ms[1]));

                return Number.isNaN(d.getTime())
                    ? ''
                    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }

            // Handle DD/MM/YYYY or DD-MM-YYYY.
            const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(raw);

            if (dmy) {
                return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
            }

            // Handle YYYY/MM/DD.
            const ymd = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(raw);

            if (ymd) {
                return `${ymd[1]}-${pad(ymd[2])}-${pad(ymd[3])}`;
            }
        }

        const d = date instanceof Date ? date : new Date(date);

        if (Number.isNaN(d.getTime())) return '';

        const local = new Date(
            d.getTime() - d.getTimezoneOffset() * 60000
        );

        return local.toISOString().slice(0, 10);
    };

    const app = Vue.createApp({
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

                startDate: isoDate(new Date()),
                endDate: isoDate(new Date()),

                companyName: '',

                currentPage: 1,
                pageSize: 10,

                showAuditLogModal: false,
                showAuditReportModal: false,
                
                reportApiBaseUrl: '',

                reportPathConfig: {
                    summaryReportPath: 'https://res.cloudinary.com/dusydqiob/raw/upload/v1786714285/erp-reports/manage/logs_qegz2c.rdl'
                },

                serviceNameMapping: [
                    {
                        systemName: 'TopazERP.Web.Controllers.AccountController',
                        friendlyName: 'User Account',
                        App: 'User Account'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.TenantsController',
                        friendlyName: 'Tenants',
                        App: 'Tenants Account'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.UsersController',
                        friendlyName: 'Users',
                        App: 'Users'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.PayrollSetupsController',
                        friendlyName: 'Setups',
                        App: 'Payroll'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ProcessPayController',
                        friendlyName: 'Process Pay',
                        App: 'Payroll'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SalaryIncreaseController',
                        friendlyName: 'Salary Increase',
                        App: 'Payroll'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.PayrollImportDataController',
                        friendlyName: 'Import Data - Payroll',
                        App: 'Payroll'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.PayrollSharedResourceController',
                        friendlyName: 'Shared Resources - Payroll',
                        App: 'Payroll'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.PayrollReportsController',
                        friendlyName: 'Payroll Reports',
                        App: 'Payroll'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.PayrollDataEntryController',
                        friendlyName: 'Payroll Enquiries',
                        App: 'Payroll'
                    },

                    // School Manager
                    {
                        systemName: 'TopazERP.Web.Controllers.SmCancelResultsPromotionsController',
                        friendlyName: 'Cancel Results',
                        App: 'School Manager'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SmBillingAndPaymentsController',
                        friendlyName: 'Billing and Payments',
                        App: 'School Manager'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SmDataEntryController',
                        friendlyName: 'Data Entry',
                        App: 'School Manager'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SmEditResultsPromotionsController',
                        friendlyName: 'Edit Results',
                        App: 'School Manager'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SmImportDataController',
                        friendlyName: 'Import Data',
                        App: 'School Manager'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SmMainSetups',
                        friendlyName: 'Main Setups',
                        App: 'School Manager'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SmReportsController',
                        friendlyName: 'Reports',
                        App: 'School Manager'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SmResultsPromotionsController',
                        friendlyName: 'Results & Promotions',
                        App: 'School Manager'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SmSharedResourcesController',
                        friendlyName: 'Shared Resources',
                        App: 'School Manager'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SmStaffSetupsController',
                        friendlyName: 'Staff Setups',
                        App: 'School Manager'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SmStudentSetupsController',
                        friendlyName: 'Student Setups',
                        App: 'School Manager'
                    },

                    // Accounts Payable
                    {
                        systemName: 'TopazERP.Web.Controllers.ApDataEntryController',
                        friendlyName: 'Accounts Payable',
                        App: 'Accounts Payable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ApEmailController',
                        friendlyName: 'Email',
                        App: 'Accounts Payable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ApEnquiriesController',
                        friendlyName: 'Enquiries',
                        App: 'Accounts Payable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ApEnterpriseDataEntryController',
                        friendlyName: 'Enterprise Data Entry',
                        App: 'Accounts Payable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ApImportDataController',
                        friendlyName: 'Import Data',
                        App: 'Accounts Payable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ApReportsController',
                        friendlyName: 'Reports',
                        App: 'Accounts Payable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ApSharedResourcesController',
                        friendlyName: 'Shared Resources',
                        App: 'Accounts Payable'
                    },

                    // Accounts Receivable
                    {
                        systemName: 'TopazERP.Web.Controllers.ArDataEntryController',
                        friendlyName: 'Accounts Receivable',
                        App: 'Accounts Receivable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ArEmailController',
                        friendlyName: 'Email',
                        App: 'Accounts Receivable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ArEnquiriesController',
                        friendlyName: 'Enquiries',
                        App: 'Accounts Receivable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ArEnterpriseDataEntryController',
                        friendlyName: 'Enterprise Data Entry',
                        App: 'Accounts Receivable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ArImportDataController',
                        friendlyName: 'Import Data',
                        App: 'Accounts Receivable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ArReportsController',
                        friendlyName: 'Reports',
                        App: 'Accounts Receivable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.ArSharedResourcesController',
                        friendlyName: 'Shared Resources',
                        App: 'Accounts Receivable'
                    },
                    {
                        systemName: 'TopazERP.Web.Controllers.SharedResourceController',
                        friendlyName: 'Shared Resources',
                        App: 'Shared Resources'
                    },

                    // Manage
                    {
                        systemName: 'TopazERP.Web.Controllers.ManageController',
                        friendlyName: 'Manage',
                        App: 'Manage Users'
                    },

                    // Dashboard
                    {
                        systemName: 'TopazERP.Web.Controllers.DashboardController',
                        friendlyName: 'Dashboard'
                    }

                    // Ledger mappings can be added here.
                ]
            };
        },

        computed: {
            generateTable() {
                const allowedApplications = [
                    'User Account',
                    'Tenants Account',
                    'Users',
                    'Accounts Payable',
                    'Manage Users'
                ];

                return this.auditLogsList.filter(log =>
                    allowedApplications.includes(log.application)
                );
            },

            totalPages() {
                return Math.max(
                    1,
                    Math.ceil(this.generateTable.length / this.pageSize)
                );
            },

            paginatedAuditLogs() {
                const start = (this.currentPage - 1) * this.pageSize;
                const end = start + this.pageSize;

                return this.generateTable.slice(start, end);
            },

            paginationPages() {
                const total = this.totalPages;
                const current = this.currentPage;

                if (total <= 7) {
                    return Array.from(
                        { length: total },
                        (_, index) => index + 1
                    );
                }

                const pages = [];

                // Always show first page.
                pages.push(1);

                // Near the beginning.
                if (current <= 4) {
                    pages.push(2, 3, 4, 5, '...', total);
                    return pages;
                }

                // Near the end.
                if (current >= total - 3) {
                    pages.push(
                        '...',
                        total - 4,
                        total - 3,
                        total - 2,
                        total - 1,
                        total
                    );

                    return pages;
                }

                // Somewhere in the middle.
                pages.push(
                    '...',
                    current - 2,
                    current - 1,
                    current,
                    current + 1,
                    current + 2,
                    '...',
                    total
                );

                return pages;
            },

            paginationStart() {
                if (!this.generateTable.length) {
                    return 0;
                }

                return ((this.currentPage - 1) * this.pageSize) + 1;
            },

            paginationEnd() {
                return Math.min(
                    this.currentPage * this.pageSize,
                    this.generateTable.length
                );
            }
        },

        methods: {
            unwrapList(response) {
                const data = response?.data;

                if (Array.isArray(data)) return data;
                if (Array.isArray(data?.result)) return data.result;
                if (Array.isArray(data?.result?.items)) return data.result.items;
                if (Array.isArray(data?.data)) return data.data;
                if (Array.isArray(data?.items)) return data.items;

                return [];
            },

            formatDateTime(dateInput) {
                if (!dateInput) return '';

                let date;

                // Handle .NET JSON dates.
                if (typeof dateInput === 'string') {
                    const ms = /\/Date\((-?\d+)\)\//.exec(dateInput);

                    if (ms) {
                        date = new Date(Number(ms[1]));
                    } else {
                        date = new Date(dateInput);
                    }
                } else {
                    date = new Date(dateInput);
                }

                if (Number.isNaN(date.getTime())) {
                    return '';
                }

                const day = pad(date.getDate());

                const months = [
                    'Jan', 'Feb', 'Mar', 'Apr',
                    'May', 'Jun', 'Jul', 'Aug',
                    'Sep', 'Oct', 'Nov', 'Dec'
                ];

                const month = months[date.getMonth()];
                const year = date.getFullYear();

                let hours = date.getHours();
                const minutes = pad(date.getMinutes());
                const seconds = pad(date.getSeconds());

                const period = hours >= 12 ? 'PM' : 'AM';

                hours = hours % 12 || 12;

                return `${day}-${month}-${year} ${pad(hours)}:${minutes}:${seconds} ${period}`;
            },

            getAuditLogs() {
                if (!this.startDate || !this.endDate) {
                    this.toastHandler(
                        'warning',
                        'Please select a start date and end date.'
                    );

                    return Promise.resolve();
                }

                const startDate = isoDate(this.startDate);
                const endDate = isoDate(this.endDate);

                if (!startDate || !endDate) {
                    this.toastHandler(
                        'warning',
                        'Please provide valid start and end dates.'
                    );

                    return Promise.resolve();
                }

                if (startDate > endDate) {
                    this.toastHandler(
                        'warning',
                        'Start date cannot be greater than end date.'
                    );

                    return Promise.resolve();
                }

                this.isLoading = true;

                return axios.get('/Manage/GetLogs', {
                    params: {
                        startDate,
                        endDate
                    }
                })
                    .then(response => {
                        const logs = this.unwrapList(response);

                        logs.forEach(log => {
                            log.urlPath = this.resolveUrlPath(
                                log.serviceName
                            );

                            log.application = this.getAppName(
                                log.serviceName
                            );

                            if (log.userId) {
                                const userInfo = this.getUserDetails(
                                    log.userId
                                );

                                if (userInfo) {
                                    log.userFullName = userInfo.fullName;
                                }
                            }

                            // Set action message.
                            if (log.status === 'Success') {
                                log.actionMessage = 'Action successful';
                            } else {
                                log.actionMessage =
                                    log.exceptionMessage || 'An error occurred.';
                            }
                        });

                        this.auditLogsList = logs;
                        this.currentPage = 1;
                    })
                    .catch(error => {
                        console.error('Error fetching audit logs:', error);

                        this.toastHandler('error', 'Unable to get logs.');
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
            },

            getUsers() {
                return axios.get('/Manage/GetUsers', {
                    params: {
                        pageNo: 1,
                        pageSize: 100000
                    }
                })
                    .then(response => {
                        this.userList = this.unwrapList(response);
                    })
                    .catch(error => {
                        console.error('Error fetching users:', error);

                        this.toastHandler('error', 'Unable to get users.');

                        this.userList = [];
                    });
            },

            viewDetail(auditLogInfo) {
                console.log('Selected Audit Log:', auditLogInfo);

                this.auditLogInfo = auditLogInfo;

                this.customData = {};
                this.parameters = {};

                if (auditLogInfo.customData) {
                    try {
                        this.customData = JSON.parse(
                            auditLogInfo.customData
                        );
                    } catch (error) {
                        console.error('Invalid customData:', error);

                        this.customData = {
                            _summary: 'Custom data could not be parsed.'
                        };
                    }
                }

                if (auditLogInfo.parameters) {
                    try {
                        this.parameters = JSON.parse(
                            auditLogInfo.parameters
                        );
                    } catch (error) {
                        console.error('Invalid parameters:', error);

                        this.parameters = {
                            _summary: 'Parameters could not be parsed because the stored data is incomplete.'
                        };
                    }
                }

                this.showAuditLogModal = true;
            },

            resolveUrlPath(serviceName) {
                const serviceInfo = this.getServiceDetails(serviceName);

                if (serviceInfo) {
                    return serviceInfo.friendlyName;
                }

                return serviceName;
            },

            getAppName(serviceName) {
                const serviceInfo = this.getServiceDetails(serviceName);

                if (serviceInfo) {
                    return serviceInfo.App || serviceInfo.friendlyName;
                }

                return serviceName;
            },

            getServiceDetails(name) {
                return this.serviceNameMapping.find(
                    item => item.systemName === name
                );
            },

            getUserDetails(id) {
                return this.userList.find(
                    user => user.id === id
                );
            },

            onSelectCourse(user) {
                this.selectedUserId = user.id;
            },

            generateAuditLogJson() {
                const allowedApplications = [
                    'User Account',
                    'Tenants Account',
                    'Users',
                    'Accounts Payable',
                    'Manage Users'
                ];

                return this.auditLogsList
                    .filter(log =>
                        allowedApplications.includes(log.application)
                    )
                    .map(log => ({
                        user: log.userFullName || '__',
                        menu: log.urlPath,
                        action: log.methodName,
                        actionResult: log.actionMessage,
                        executionTime: this.formatDateTime(
                            log.executionTime
                        ),
                        application: log.application || '__'
                    }));
            },

            getCompanyProfile() {
                return axios.get('/SharedResource/GetBusinessProfile')
                    .then(response => {
                        const companyData =
                            response?.data?.result ?? response?.data;

                        this.companyName = companyData?.companyName || '';
                    })
                    .catch(error => {
                        console.error(
                            'Unable to get company profile:',
                            error
                        );

                        this.companyName = '';
                    });
            },

            applicationClass(application) {
                switch (application) {
                    case 'Payroll':
                        return 'badge badge-pill badge-info';

                    case 'School Manager':
                        return 'badge badge-pill badge-primary';

                    case 'Accounts Payable':
                        return 'badge badge-pill badge-success';

                    case 'Accounts Receivable':
                        return 'badge badge-pill badge-warning';

                    case 'General Ledger':
                        return 'badge badge-pill badge-dark';

                    case 'Stock Manager':
                        return 'badge badge-pill badge-danger';

                    case 'Asset Manager':
                        return 'badge badge-pill badge-secondary';

                    case 'School Manager Pro':
                        return 'badge badge-pill badge-deepBlue';

                    case 'Shared Resources':
                        return 'badge badge-pill badge-light';

                    case 'Manage Users':
                        return 'badge badge-pill badge-purple';

                    default:
                        return 'badge badge-pill badge-secondary';
                }
            },

            /*
             * Pagination
             */
            changePage(page) {
                if (
                    page < 1 ||
                    page > this.totalPages ||
                    page === '...'
                ) {
                    return;
                }

                this.currentPage = page;
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

            renderReport(header, details, reportPath) {
                $('#reportView').empty();

                $('#reportView').boldReportViewer({
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
                            name: 'DataSet1'
                        },
                        {
                            value: details,
                            name: 'DataSet2'
                        }
                    ],

                    reportError: (args) => {
                        console.error('Bold Report error:', args);

                        this.toastHandler(
                            'warning',
                            'No data available for the selected criteria.'
                        );
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

                const reportPath =
                    this.reportPathConfig.summaryReportPath;

                // Show the modal.
                this.showAuditReportModal = true;

                // Allow the modal to become visible before initializing
                // the Bold Report Viewer.
                setTimeout(() => {
                    this.renderReport(
                        header,
                        details,
                        reportPath
                    );
                }, 300);
            }
        },

        mounted() {
            this.reportApiBaseUrl = reportApiBaseUrl;

            this.getCompanyProfile();

            // Load users before audit logs so user names can be resolved.
            this.getUsers().finally(() => {
                this.getAuditLogs();
            });
        }
    });

    app.use(WSelectPlugin);
    app.mount('#app');
})();