const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,

            nationalityList: [],
            currencyList: [],

            payload: {},
            emptyGuid: '00000000-0000-0000-0000-000000000000',

            companyName: '',
            countryId: '',
            cityName: '',
            phoneNo: '',
            companyTin: '',
            email: '',
            address: '',

            firstMonthOfFiscalYear: 1,
            senderId: '',
            clientId: '',
            clientSecret: '',

            employerSocialSecurityNo: '',
            socialSecurityFundEmployerRate: null,
            socialSecurityFundEmployeeRate: null,
            paySocialSecurityFund: false,

            providentFundEmployeeRate: null,
            providentFundEmployerRate: null,
            providentFundTreatAsSocialSecurityFund: false,
            payProvidentFund: false,
            providentFundTaxEmployerPortion: false,

            secondProvidentEmployeeRate: null,
            secondProvidentEmployerRate: null,
            paySecondProvidentOrOthers: false,
            treatSecondProvidentAsSSF: false,
            secondProvidentTaxEmployerPortion: false,

            overtimePercentageOnBasicSalary: false,
            overtimePercentageOnDailyWage: false,

            mailHostName: '',
            primaryEmailAddress: '',
            emailPassword: '',
            portNumber: 0,
            isSSLEnabled: false,

            companyProfileId: '',
            defaultCurrenyId: '',
            isTaxLeviesInclusive: false,

            vatTaxLevyList: [],
            otherTaxLevyList: [],
            vatList: [],
            vatId: '',
            amount: 0,
            tenantId: '',
            taxlevyId: '',
            maximumVatTaxLevyRows: 1,

            companyLogoBase64: '',
            companyLogo: null,

            enforceOu: false,
            approveInvoiceBeforePayment: false,
            errors: {},
            vatCol: [
                { key:'id',         label:'ID',         type:'text', hidden:true,   width:74, help:'Auto-filled, but you can change it' },
                { key: "name", label: "Tax Levy Type", type:'text', required:true, searchable:true, width: 80 },
                { key: "rate", label: "Rate", type:'number', required:true, searchable:true, width: 80, decimals:4 },
                { key: "type", hidden: true, type:'text', label: "Type", width: 15, },
                { key:'tenantId',      label:'Tenant',      type:'number', hidden:true, minWidth:74 }
            ],
            taxesCol: [
                { key:'id',         label:'ID',         type:'text', hidden:true,   width:74, help:'Auto-filled, but you can change it' },
                { key: "name", label: "Tax Levy Type", type:'text', required:true, searchable:true, width: 80 },
                { key: "rate", label: "Rate", type:'number', required:true, searchable:true, width: 80, decimals:4 },
                { key: "type", hidden: true, type:'text', label: "Type", width: 15, },
                { key:'tenantId',      label:'Tenant',      type:'number', hidden:true, minWidth:74 }
            ],
            theme: '#0645e7',
            activeTab:'profile'
        }
    },

    methods: {
        isValidEmail(email) {
            const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return pattern.test(email);
        },
        validateForm() {
            this.errors = {};

            if (!this.companyName || this.companyName.trim() === '') {
                this.errors.companyName = "Company name is required";
            }

            if (!this.phoneNo || this.phoneNo.trim() === '') {
                this.errors.phoneNo = "Phone number is required";
            }

            if (!this.email || this.email.trim() === '') {
                this.errors.email = "Email is required";
            } else if (!this.isValidEmail(this.email)) {
                this.errors.email = "Invalid email format";
            }

            if (!this.address || this.address.trim() === '') {
                this.errors.address = "Address is required";
            }

            return Object.keys(this.errors).length === 0;
        },
        onFileChange(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                this.companyLogoBase64 = event.target.result;
            };
            reader.readAsDataURL(file);
        },

        showUpload() {
            this.$refs.fileInput.click();
        },

        removeLogo() {
            this.companyLogoBase64 = null;
        },
      /*  getBusinessProfile() {

            axios.get('http://localhost:5300/SharedResource/GetBusinessProfile', {withCredentials: true}).then(response => {

                if (response.data) {

                    let businessProfile = response.data;
                    this.companyName = businessProfile.companyName;
                    this.countryId = businessProfile.countryId;
                    this.cityName = businessProfile.cityName;
                    this.phoneNo = businessProfile.phoneNo;
                    this.companyTin = businessProfile.companyTin;
                    this.email = businessProfile.email;
                    this.address = businessProfile.address;
                    this.firstMonthOfFiscalYear = businessProfile.firstMonthOfFiscalYear;
                    this.senderId = businessProfile.senderId;
                    this.clientId = businessProfile.clientId;
                    this.clientSecret = businessProfile.clientSecret;
                    this.employerSocialSecurityNo = businessProfile.employerSocialSecurityNo;
                    this.socialSecurityFundEmployerRate = businessProfile.socialSecurityFundEmployerRate;
                    this.socialSecurityFundEmployeeRate = businessProfile.socialSecurityFundEmployeeRate;
                    this.paySocialSecurityFund = businessProfile.paySocialSecurityFund;
                    this.providentFundEmployeeRate = businessProfile.providentFundEmployeeRate;
                    this.providentFundEmployerRate = businessProfile.providentFundEmployerRate;
                    this.providentFundTreatAsSocialSecurityFund = businessProfile.providentFundTreatAsSocialSecurityFund;
                    this.payProvidentFund = businessProfile.payProvidentFund;
                    this.providentFundTaxEmployerPortion = businessProfile.providentFundTaxEmployerPortion;
                    this.secondProvidentEmployeeRate = businessProfile.secondProvidentEmployeeRate;
                    this.secondProvidentEmployerRate = businessProfile.secondProvidentEmployerRate;
                    this.paySecondProvidentOrOthers = businessProfile.paySecondProvidentOrOthers;
                    this.treatSecondProvidentAsSSF = businessProfile.treatSecondProvidentAsSSF;
                    this.secondProvidentTaxEmployerPortion = businessProfile.secondProvidentTaxEmployerPortion;
                    this.overtimePercentageOnBasicSalary = businessProfile.overtimePercentageOnBasicSalary;
                    this.overtimePercentageOnDailyWage = businessProfile.overtimePercentageOnDailyWage;
                    this.mailHostName = businessProfile.mailHostName;
                    this.primaryEmailAddress = businessProfile.primaryEmailAddress;
                    this.emailPassword = businessProfile.emailPassword;
                    this.portNumber = businessProfile.portNumber;
                    this.isSSLEnabled = businessProfile.isSSLEnabled;
                    this.companyProfileId = businessProfile.id;
                    this.defaultCurrenyId = businessProfile.defaultCurrenyId;
                    this.isTaxLeviesInclusive = businessProfile.isTaxLeviesInclusive;
                    this.companyLogoBase64 = businessProfile.companyLogo
                        ? "data:image/png;base64," + businessProfile.companyLogo
                        : null;
                    this.enforceOu = businessProfile.enforceOu;
                    this.approveInvoiceBeforePayment = businessProfile.approveInvoiceBeforePayment;
                    this.tenantId = businessProfile.tenantId;

                }

            }).catch(err => {

                console.log(err);

            });
        },*/

        getNationalities() {

            axios.get(`/jsonDataSample/countries.json?v=${new Date().getTime()}`)
                .then(response => {

                this.nationalityList = response.data;

            }).catch(err => {

                this.toastHandler('error', 'Unable to get nationalities.');

            });
        },

     /*   getCurrency() {

            axios.get('http://localhost:5300/SharedResource/GetCurrencys', {withCredentials: true}).then(response => {

                this.currencyList = response.data;

            }).catch(err => {

                this.toastHandler('error', 'Unable to get currency.');

            });
        },*/
        async saveProfile() {

            if (!this.validateForm()) {
                this.toastHandler('error', 'Please fix validation errors.');
                return;
            }
            
            this.isLoading = true;

            let payload = {
                companyName: this.companyName,
                countryId: this.countryId || this.emptyGuid,
                cityName: this.cityName,
                phoneNo: this.phoneNo,
                companyTin: this.companyTin,
                email: this.email,
                address: this.address,
                firstMonthOfFiscalYear: this.firstMonthOfFiscalYear,
                senderId: this.senderId,
                clientId: this.clientId,
                clientSecret: this.clientSecret,
                employerSocialSecurityNo: this.employerSocialSecurityNo,
                socialSecurityFundEmployerRate: this.socialSecurityFundEmployerRate || 0,
                socialSecurityFundEmployeeRate: this.socialSecurityFundEmployeeRate || 0,
                paySocialSecurityFund: this.paySocialSecurityFund,
                providentFundEmployeeRate: this.providentFundEmployeeRate || 0,
                providentFundEmployerRate: this.providentFundEmployerRate || 0,
                providentFundTreatAsSocialSecurityFund: this.providentFundTreatAsSocialSecurityFund,
                payProvidentFund: this.payProvidentFund,
                providentFundTaxEmployerPortion: this.providentFundTaxEmployerPortion,
                secondProvidentEmployeeRate: this.secondProvidentEmployeeRate || 0,
                secondProvidentEmployerRate: this.secondProvidentEmployerRate || 0,
                paySecondProvidentOrOthers: this.paySecondProvidentOrOthers,
                treatSecondProvidentAsSSF: this.treatSecondProvidentAsSSF,
                secondProvidentTaxEmployerPortion: this.secondProvidentTaxEmployerPortion,
                overtimePercentageOnBasicSalary: this.overtimePercentageOnBasicSalary,
                overtimePercentageOnDailyWage: this.overtimePercentageOnDailyWage,
                mailHostName: this.mailHostName,
                primaryEmailAddress: this.primaryEmailAddress,
                emailPassword: this.emailPassword,
                portNumber: this.portNumber,
                isSSLEnabled: this.isSSLEnabled,
                defaultCurrenyId: this.defaultCurrenyId || this.emptyGuid,
                isTaxLeviesInclusive: this.isTaxLeviesInclusive,
                approveInvoiceBeforePayment: this.approveInvoiceBeforePayment,
                companyLogoBase64: this.companyLogoBase64
                    ? this.companyLogoBase64.split(",")[1]
                    : null,
                enforceOu: this.enforceOu
            };

            const url = this.companyProfileId
                ? '/SharedResource/UpdateBusinessProfile'
                : '/SharedResource/CreateBusinessProfile';

            if (this.companyProfileId) {
                payload.id = this.companyProfileId;
                payload.tenantId = this.tenantId;
            }

            axios.post(url, payload)
                .then(() => {
                    this.toastHandler('', 'Saved successfully.');
                })
                .catch(() => {
                    this.toastHandler('error', 'Save failed.');
                })
                .finally(() => {
                    this.isLoading = false;
                });
        },
     /*   getVatTaxLevies() {
            axios.get('http://localhost:5300/SharedResource/GetTaxLevies?type=vat', {withCredentials:true}).then(response => {

                this.vatTaxLevyList = response.data;


                /!*this.renderTable1(response.data);*!/

            }).catch(err => {

                this.toastHandler('error', 'Unable to get vat.');

            });
        },*/
        //rendertable
       /* renderTable1(responseData) {

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
                    { field: "rate", headerText: "Rate", editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 }, format: "{0:n2}", width: 80 },
                    { field: "type", visible: false, headerText: "type", width: 15, },
                    { field: "tenantId", visible: false, headerText: "tenantId", width: 15, },

                ],
                endAdd: (args) => {

                    this.saveVat(args.data);
                },
                endEdit: (args) => {
                    console.log("Edited Data:", args.data);
                    this.updateVat(args.data);
                },
                endDelete: (args) => {

                    this.delVat(args.data.id);
                },
            });

        },*/
        saveVat(payload) {

            if (this.vatTaxLevyList.length >= this.maximumVatTaxLevyRows) {
                this.toastHandler('error', 'Maximum number of rows reached.');
                this.getVatTaxLevies();
                return;
            }

            payload.type = 'vat';

            axios.post('/SharedResource/CreateTaxLevy', payload).then(response => {

                this.getVatTaxLevies();

                this.toastHandler('', 'VAT Tax Levy saved.');


            }).catch(err => {

                this.toastHandler('error', 'Unable to save Tax Levy.');

            });
        },
        updateVat(payload) {
            console.log("Payload to be sent for update:", payload); // Log the payload
            axios.post('/SharedResource/UpdateTaxLevy', payload).then(response => {
                this.getVatTaxLevies();
                this.toastHandler('', 'Tax Levy updated.');
            }).catch(err => {
                this.toastHandler('error', 'Unable to update Tax Levy.');
            });
        },

        delVat(id) {

            axios.get('/SharedResource/DelTaxLevy/?id=' + id).then(response => {

                this.getVatTaxLevies();

                this.toastHandler('', 'Tax Levy deleted.');

            }).catch(err => {

                this.toastHandler('error', 'Unable to delete Tax Levy.');

            });
        },
     /*   getOtherTaxLevies() {
            axios.get('http://localhost:5300/SharedResource/GetTaxLevies?type=others', {withCredentials:true}).then(response => {

                this.otherTaxLevyList = response.data;
                
               /!* this.renderTable(response.data);*!/
                console.log(response.data);
            }).catch(err => {

                this.toastHandler('error', 'Unable to retrieve tax levies.');

            });
        },*/

        //rendertable
      /*  renderTable(responseData) {

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
                    { field: "rate", headerText: "Rate",editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 4 },format: "{0:n2}", validationRules: { required: true, minlength: 1 }, width: 80 },
                    { field: "type", visible: false, headerText: "type", width: 15, },
                    { field: "tenantId", visible: false, headerText: "tenantId", width: 15, },
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

        },*/
        saveTaxLevy(payload) {

            payload.type = 'others';

            axios.post('/SharedResource/CreateTaxLevy', payload).then(response => {

                this.getOtherTaxLevies();

                this.toastHandler('', 'Tax Levy saved.');


            }).catch(err => {

                console.log(err);
                this.toastHandler('error', 'Unable to save Tax Levy.');

            });
        },

        updateTaxLevy(payload) {


            axios.post('/SharedResource/UpdateTaxLevy', payload).then(response => {

                this.getOtherTaxLevies();

                this.toastHandler('', 'Data updated.');


            }).catch(err => {

                this.toastHandler('error', 'Unable to update Tax Levy.');

            });
        },

        delTaxLevy(id) {

            axios.get('/SharedResource/DelTaxLevy?id=' + id).then(response => {

                this.getOtherTaxLevies();

                this.toastHandler('', 'Data deleted.');

            }).catch(err => {

                this.toastHandler('error', 'Unable to delete Tax Levy.');

            });
        },

        toastHandler(type, message) {
            toastr.options = {
                closeButton: true,
                progressBar: true,
                timeOut: 10000
            };

            if (type === 'error') toastr.error(message);
            else if (type === 'warning') toastr.warning(message);
            else toastr.success(message);
        }
    },

    mounted() {
      //  this.getBusinessProfile();
      //  this.getNationalities();
      //  this.getCurrency();
     //   this.getVatTaxLevies();
     //   this.getOtherTaxLevies();
    }
});
app.use(DataGridPlugin);
app.mount('#app');
