 

var vue = new Vue({
    el: '#app',
    data: {

        isSchoolManagerLoading: false,
        isPayrollLoading: false,
        isGeneralLedgerLoading: false,
        isStockManagerLoading: false,
        isAccountPayablesLoading: false,
        isAccountReceivablesLoading: false,
        isBankingModuleLoading: false,
        isAssetManagerLoading: false,
        isAuditingModuleLoading: false,
        payload: {},
        alertConfig: {
            type: '',
            alertMessage: null,
            showAlert: false,
            timeout: 5000
        },
        selectedModuleId: 0,
        modulesConstants: {

            generalLedger: 100,
            payroll: 200,
            schoolManager: 300,
            stockManager: 400,
            hrManager: 500,
            accountPayables: 600,
            accountReceivables: 700,
            assetManager: 800,
            banking: 900,
            audit: 9001,

        },
        subscriptionSummary: [],

    },

    methods: {
        
        selectModuleFaux(id) {


            switch (id) {
                case this.modulesConstants.schoolManager:
                    window.location.href = '/dashboard/schoolmanager';

                    break;
                case this.modulesConstants.generalLedger:
                    window.location.href = '/dashboard/GeneralLedger';


                    break;
                case this.modulesConstants.banking:
                    window.location.href = '/dashboard/schoolmanager';


                    break;
                case this.modulesConstants.payroll:
                    window.location.href = '/dashboard/Payroll';


                    break;
                case this.modulesConstants.stockManager:
                    window.location.href = '/dashboard/schoolmanager';


                    break;
                case this.modulesConstants.assetManager:
                    window.location.href = '/dashboard/schoolmanager';


                    break;

                case this.modulesConstants.accountPayables:
                    window.location.href = '/dashboard/schoolmanager';


                    break;

                case this.modulesConstants.accountReceivables:
                    window.location.href = '/dashboard/schoolmanager';


                    break;

                case this.modulesConstants.audit:
                    window.location.href = '/dashboard/schoolmanager';

                default:
                    break;
            }


        },


        selectModule(id) {

            this.selectedModuleId = id;

            switch (id) {
                case this.modulesConstants.schoolManager:
                    this.isSchoolManagerLoading = true;
                    break;
                case this.modulesConstants.generalLedger:
                    this.isGeneralLedgerLoading = true;

                    break;
                case this.modulesConstants.banking:
                    this.isBankingModuleLoading = true;

                    break;
                case this.modulesConstants.payroll:
                    this.isPayrollLoading = true;

                    break;
                case this.modulesConstants.stockManager:
                    this.isStockManagerLoading = true;

                    break;
                case this.modulesConstants.assetManager:
                    this.isAssetManagerLoading = true;

                    break;

                case this.modulesConstants.accountPayables:
                    this.isAccountPayablesLoading = true;

                    break;

                case this.modulesConstants.accountReceivables:
                    this.isAccountReceivablesLoading = true;

                    break;

                case this.modulesConstants.audit:
                    this.isAuditingModuleLoading = true;

                default:
                    break;
            }


            axios.get('/Manage/ValidateModuleAccess?id='+id).then(response => {

                if (response.data.isValidLicense && response.data.redirectUrl) {

                    window.location.href = response.data.redirectUrl;

                }
                else {

                    this.resetLoaders();

                    toastr.options = {
                        closeButton: true,
                        progressBar: true,
                        showMethod: 'fadeIn',
                        hideMethod: 'fadeOut',
                        timeOut: 10000,
                    };

                    toastr.warning('Contact support to activate license', 'Access denied.');

                }

            }).catch(err => {

                this.resetLoaders();
              
                toastr.options = {
                    closeButton: true,
                    progressBar: true,
                    showMethod: 'fadeIn',
                    hideMethod: 'fadeOut',
                    timeOut: 10000,
                };

                toastr.warning('Contact support to activate license', 'Access denied.');
                 

            });
        },
       
        getSubscriptionInfo() {

            axios.get('/Manage/GetSubscriptionInfo').then(response => {

                this.subscriptionSummary = response.data;

            }).catch(err => {

                this.toastHandler('error', '');

            });

        },

        resetLoaders() {

            switch (this.selectedModuleId) {
                case this.modulesConstants.schoolManager:
                    this.isSchoolManagerLoading = false;
                    break;
                case this.modulesConstants.generalLedger:
                    this.isGeneralLedgerLoading = false;

                    break;
                case this.modulesConstants.banking:
                    this.isBankingModuleLoading = false;

                    break;
                case this.modulesConstants.payroll:
                    this.isPayrollLoading = false;

                    break;
                case this.modulesConstants.stockManager:
                    this.isStockManagerLoading = false;

                    break;
                case this.modulesConstants.assetManager:
                    this.isAssetManagerLoading = false;

                    break;

                case this.modulesConstants.accountPayables:
                    this.isAccountPayablesLoading = false;

                    break;

                case this.modulesConstants.accountReceivables:
                    this.isAccountReceivablesLoading = false;

                case this.modulesConstants.audit:
                    this.isAuditingModuleLoading = false;

                    break;

                default:
                    break;
            }


             
        },

        errorHandler(error, message = 'An unexpected error occurred.') {

            //display alert with 
            this.alertConfig.alertMessage = message;
            this.alertConfig.showAlert = true;
            this.alertConfig.type = 'danger';

            setTimeout(() => {

                this.alertConfig.alertMessage = '';
                this.alertConfig.showAlert = false;
                this.alertConfig.type = '';

            }, this.alertConfig.timeout);

        },
        onEnterAmount() {

            if (this.amountPaid <= 0) {
                this.errorMessage = 'Topup amount must be greater than zero';
            }
            else {
                this.errorMessage = '';
            }
        }
    },
     
    created() {

        this.getSubscriptionInfo();
    },
});