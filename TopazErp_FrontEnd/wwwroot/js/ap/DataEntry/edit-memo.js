const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,
            payload: {},
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            invoiceList: [],
            invoiceId: '',
            supplierList: [],
            supplierId: '',
            supplierName: '',
            accountNo: '',
            invoiceNo: '',
            currencyList: [],
            currencyId: '',
            currencyName: '',
            buyRate: '',
            sellRate: '',
            invoiceCurrencyId: '',
            invoiceCurrencyName: '',
            invoiceBuyRate: '',
            invoiceAmount: '',
            invoiceBalance: '',
            balance: '',
            description: '',
            debitGlId: this.emptyGuid,
            creditGlId: this.emptyGuid,
            bankList: [],
            bankBranchList: [],
            bankId: '',
            bankName: '',
            bankBranchId: '',
            amount: '0.00',
            transactionDate: moment().format("YYYY-MM-DD"),
            modeOfPayment: 'Cash',
            chequeNumber: '00000000',
            cash: true,
            cheque: false,
            invoiceDate: moment().format("YYYY-MM-DD"),
            debitMemoList: [],
            debitMemoId: '',
            chequeDate: moment().format("YYYY-MM-DD"),
            ouList: [],
            ouNameList: [],
            departmentHierachyList: [],
            ouName: '',
            ouId: '',
            isInvoiceDebit: false,
            costCenterHierachyList: [],
            costCenterList: [],
            accountsList: [],
            bankAccountId: '',
            bankAccountName: '',
            batchNumber: "0",
            isOu: true,
            memoId: window.memoId
        }
    },
    methods: {
        getBusinessProfile() {
            axios.get('/SharedResource/GetBusinessProfile').then(response => {
                if (response.data) {
                    this.isOu = response.data.enforceOu;
                }
            }).catch(err => {
                console.log(err);
            });
        },
        getDefaultGlSetup() {

            axios.get('/LedgerSetups/GetDefaultGlSetup').then(response => {

                let responseData = response.data;
                this.debitAccountId = responseData.accountsPayableAccountId;

                if (responseData) {

                    this.id = responseData.id;

                    $("#debitGlId").ejDropDownList({

                        value: responseData.accountsPayableAccountId,

                    });
                    $("#bankAccountId").ejDropDownList({

                        value: responseData.accountPayablesBankAccountId,

                    });
                    $("#creditGlId").ejDropDownList({

                        value: responseData.accountsPayableAccountId,

                    });


                }
                $("#transactionDate").ejDatePicker({
                    width: "100%",
                    dateFormat: "yyyy-MM-dd",
                    value: moment().add(1, 'months').format("YYYY-MM-DD"),
                    change: (args) => {
                        this.transactionDate = args.value;
                    }
                });


            }).catch(err => {

                console.log(err);

                this.toastHandler('error', 'Unable to get default GL numbers.');

            });
        },
        initDebitMemo() {

            axios.get('/LedgerDataEntry/InitJournalEntry').then(response => {

                let accounts = response.data.accounts;

                if (!accounts || accounts.length === 0) {
                    accounts = [{
                        id: this.emptyGuid,
                        accountIdentifier: 'No Ledger Available'
                    }];
                } else {
                    accounts.forEach(v => {
                        v.accountIdentifier = `${v.accountNo} - ${v.accountName}`;
                    });
                    accounts.sort((a, b) => {
                        return Number(a.accountNo) - Number(b.accountNo);
                    });
                }
                this.accountsList = accounts;





                $( '#bankAccountId' ).ejDropDownList({
                    dataSource: this.accountsList,
                    width: "100%",
                    watermarkText: "Select Account",
                    fields: { id: "id", text: "accountIdentifier", value: "id" },
                    enableFilterSearch: true,
                    change: (args) => {
                        this.bankAccountId = args.value;
                    }
                });

                $( '#creditGlId' ).ejDropDownList({
                    dataSource: this.accountsList,
                    width: "100%",
                    watermarkText: "Select Account",
                    fields: { id: "id", text: "accountIdentifier", value: "id" },
                    enableFilterSearch: true,
                    change: (args) => {
                        this.creditGlId = args.value;
                    }
                });
                $( '#debitGlId' ).ejDropDownList({
                    dataSource: this.accountsList,
                    width: "100%",
                    watermarkText: "Select Account",
                    fields: { id: "id", text: "accountIdentifier", value: "id" },
                    enableFilterSearch: true,
                    change: (args) => {
                        this.debitGlId = args.value;
                    }
                });

            }).catch(err => {

                this.toastHandler('error', 'Voucher initialization failed.');

            });
        },
        getBankAccounts() {
            axios.get('/LedgerSetups/GetBankAccounts').then(response => {
                this.bankAccountList = response.data;

            }).catch(err => {
                this.toastHandler('error', 'Unable to get bank accounts.');
            });
        },
        toggleIsInvoiceDebit() {
            this.isInvoiceDebit = !this.isInvoiceDebit;
            if (this.isInvoiceDebit) {
                this.getInvoices();
            }
            else{
                this.getSuppliers();
            }
        },
        getDepartments() {
            axios.get('/SharedResource/GetDepartments').then(response => {

                this.parseDepartmentHierachy(response.data);

            }).catch(err => {

                console.log(err);

                this.toastHandler('error', 'Unable to get departments.');

            });
        },

        toggleCash() {
            this.cash = true;
            this.cheque = false;
            this.InitModeOfPayment();
        },
        toggleCheque() {
            this.cash = false;
            this.cheque = true;
            this.InitModeOfPayment();
        },
        InitModeOfPayment() {
            this.modeOfPayment = this.cash ? 'Cash' : 'Cheque';
        },
        getMemo() {
            axios.get('/ApDataEntry/GetDebitMemos')
                .then(response => {
                    this.debitMemoList = response.data.filter(dm => dm.isInvoiceDebit === false && dm.id === this.memoId);

                    //format date
                    this.debitMemoList.forEach((item) => {
                        item.transactionDate = this.formatDate(item.transactionDate);
                        item.displayText = `${item.supplierName} - ${item.invoiceNo} - ${item.transactionDate}`;
                    });
                    this.setCurrentDebitMemo(this.memoId)
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get debitMemos.');
                });
        },
        getInvoices() {
            axios.get('/ApDataEntry/GetInvoices').then(response => {
                    this.invoiceList = response.data.sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber));
                    this.invoiceEditList = this.invoiceList.filter(a => a.isPosted === true && a.balance > 0);
                    this.invoiceList.forEach((invoice) => {
                        invoice.invoiceId = invoice.id;
                        invoice.displayText = `${invoice.supplierName} - ${invoice.invoiceNumber}`;

                    });
                    $("#invoiceId").ejDropDownList({
                        dataSource: this.invoiceEditList,
                        watermarkText: "Select Invoice",
                        width: "100%",
                        fields: { id: "id", text: "displayText", value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            this.invoiceId = args.value;
                        }
                    });
                }
            ).catch(err => {
                this.toastHandler('error', 'Unable to get invoices.');
            });
        },
        getSuppliers() {
            axios.get('/SharedResource/GetSuppliers')
                .then(response => {
                    this.supplierList = response.data.sort((a, b) => a.name.localeCompare(b.name)).filter(a => a.statusName.trim().toLowerCase() === 'active');
                    $("#supplierId").ejDropDownList({
                        dataSource: response.data,
                        watermarkText: "Select Supplier",
                        width: "100%",
                        fields: { id: "id", text: "name", value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            this.supplierId = args.value;
                        }
                    });
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get suppliers.');
                });
        },
        getSupplierDetails(id) {
            return this.supplierList.find(a => a.id === id);
        },
        setSupplier() {
            if (this.supplierId) {
                const supplier = this.supplierList.find(a => a.id === this.supplierId);
                this.supplierName = supplier.name;
                this.accountNo = supplier.accountNumber;
                this.balance = parseFloat(supplier.balance).toFixed(2);
            }
        },
        getCurrency() {
            axios.get('/SharedResource/GetCurrencys').then(response => {
                this.currencyList = response.data;

                this.defaultCurrency = this.currencyList.find(currency => {
                    const name = currency.currencyName.trim().toLowerCase();
                    return name === 'ghana cedis' || name === 'ghana cedi';
                });

                if (this.defaultCurrency) {
                    this.currencyId = this.defaultCurrency.id;
                    this.buyRate = parseFloat(this.defaultCurrency.buyRate).toFixed(4);
                }
                $('#currencyId').ejDropDownList({
                    dataSource: this.currencyList,
                    width: "100%",
                    watermarkText: "Select Currency",
                    fields: { id: "id", text: "currencyName", value: "id" },
                    enableFilterSearch: true,
                    value: this.currencyId,
                    change: (args) => {
                        this.currencyId = args.value;
                    }
                });
            }).catch(err => {
                this.toastHandler('error', 'Unable to get currency.');
            });
        },
        parseCostCenterHierachy(dataArr) {

            this.ouList = dataArr;

            let costCenterHierachyList = [];

            for (let i = 0; i < this.costCenterList.length; i++) {

                this.getHierachyName(this.costCenterList[i].id);

                let name = [...new Set(this.ouNameList)].join().replace(/,/g, '/');

                costCenterHierachyList.push({
                    name: name,
                    parentId: this.costCenterList[i].parentId,
                    id: this.costCenterList[i].id,
                    rawName: this.costCenterList[i].name,
                    tenantId: this.costCenterList[i].tenantId,
                });

                name = [];

                this.ouNameList = [];

            }

            return costCenterHierachyList;

        },
        getHierachyName(id) {

            let parentId;
            let returnName;

            this.costCenterList.forEach(item => {

                if (item.id === id) {
                    parentId = item.parentId;
                    returnName = item.name;
                }

                this.costCenterList.forEach(cc => {
                    if (cc.id === parentId) {
                        return (`${this.getHierachyName(parentId)} / ${returnName}`);
                    }
                })

            });

            this.ouNameList.push(returnName);

        },
        getCostCenters() {
            axios.get('/SharedResource/GetCostCenters/').then(response => {

                this.costCenterList = response.data;

                const parsed = this.parseCostCenterHierachy(response.data);
                this.costCenterHierachyList = parsed;

                let initOuId = this.ouId && this.ouId !== this.emptyGuid ? this.ouId : (this.costCenterHierachyList.length > 0 ? this.costCenterHierachyList[0].id : this.emptyGuid);

                $("#ouId").ejDropDownList({
                    dataSource: this.costCenterHierachyList,
                    width: "100%",
                    watermarkText: "Select OU/Cost Center",
                    fields: { id: "id", text: "name", value: "id" },
                    value: this.ouId,
                    enableFilterSearch: true,
                    change: (args) => {
                        this.ouId = args.value;
                    }
                });

            }).catch(err => {
                console.log(err);
                this.toastHandler('error', 'Unable to get cost centers.');
            });
        },

        setOu(id) {
            this.ouId = id;
            let ouInfo = this.getOuDetails(id);
            if (ouInfo) {
                this.ouId = ouInfo.id;
                this.ouName = ouInfo.name;
                $("#ouId").ejDropDownList({ value: ouInfo.id });
            } else {
                this.ouId = this.emptyGuid;
                this.ouName = '';
                $("#ouId").ejDropDownList({ value: this.emptyGuid });
            }
        },

        getOuDetails(id) {

            return this.costCenterHierachyList.find(a => a.id === id);
        },
        getCurrencyDetails(id) {
            return this.currencyList.find(a => a.id === id);
        },
        getBanks() {

            axios.get('/SharedResource/GetBanks').then(response => {

                this.bankList = response.data;

                $("#bankId" ).ejDropDownList({
                    dataSource: response.data,
                    watermarkText: "Select Bank",
                    width: "100%",
                    fields: { id: "id", text: "name", value: "id" },
                    enableFilterSearch: true,
                    change: (args) => {

                        this.bankId = args.value;
                    }
                });

            }).catch(err => {

                this.toastHandler('error', 'Unable to retrieve banks.');

            });
        },
        getBankDetails(id) {

            return this.bankList.find(a => a.id === id);
        },
        getBankBranchDetails(id) {

            return this.bankBranchList.find(a => a.id === id);
        },
        getInvoiceDetails(id) {
            return this.invoiceList.find(a => a.id === id);
        },
        formatDate(dateInput) {

            return moment(dateInput).format("DD-MMM-YYYY");

        },
        setCurrentInvoice() {
            if (this.invoiceId) {
                const invoice = this.invoiceList.find(a => a.id === this.invoiceId);
                this.InvoiceId = invoice.id;
                this.supplierId = invoice.supplierId;
                this.supplierName = invoice.supplierName;
                this.accountNo = invoice.accountNumber;
                this.invoiceNo = invoice.invoiceNumber;
                this.invoiceCurrencyName =  invoice.currencyName;
                this.invoiceBuyRate = parseFloat(invoice.buyRate).toFixed(4);
                this.invoiceBalance = parseFloat(invoice.balance).toFixed(4);
            }
        },
        setBuyRate() {
            if (this.currencyId) {
                const currency = this.currencyList.find(a => a.id === this.currencyId);
                this.buyRate = parseFloat(currency.buyRate).toFixed(4);
            }
        },
        generateInvoiceNo() {
            this.invoiceNo = Math.floor(1000 + Math.random() * 9000);
            return this.invoiceNo;
        },
        generateBatchNumber() {
            axios.get('/ApDataEntry/GetMemoBatchNumber')
                .then(response => {
                    this.batchNumber = response.data;
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to generate batch number.');
                    this.batchNumber = '0001';
                });
        },
        async editMemo() {
            this.isLoading = true;
            this.InitModeOfPayment();
            let payload = {};
            payload.chequeDate = this.chequeDate;
            payload.chequeNo = this.chequeNumber;
            if (this.currencyId) {
                let currencyInfo = this.getCurrencyDetails(this.currencyId);
                if (currencyInfo) {
                    payload.currencyId = this.currencyId;
                    payload.currencyName = currencyInfo.currencyName;
                    payload.currencyCode = currencyInfo.currencyCode;
                    payload.buyRate = currencyInfo.buyRate;
                    payload.sellRate = currencyInfo.sellRate;
                }
            }
            if (this.ouId) {
                let ouInfo = this.getOuDetails(this.ouId);
                if (ouInfo) {
                    payload.ouName = ouInfo.name;
                }

            }
            else
            {
                this.ouId = this.emptyGuid;
                payload.ouName = 'No OU';
            }
            payload.batchNumber = this.batchNumber;
            if (this.bankId) {

                let bankInfo = this.getBankDetails(this.bankId);
                if (bankInfo) {

                    payload.bankId = this.bankId;
                    payload.bankName = bankInfo.name;
                }

            } else {

                payload.bankId = this.emptyGuid;
            }
            if (this.bankBranchId) {

                let bankBranchInfo = this.getBankBranchDetails(this.bankBranchId);
                if (bankBranchInfo) {
                    payload.bankBranchId = this.bankBranchId;
                    payload.bankBranch = bankBranchInfo.name;
                }


            } else {
                payload.bankBranchId = this.emptyGuid;
            }
            payload.transactionDate = this.transactionDate;
            payload.amount = this.amount;
            payload.modeOfPayment = this.modeOfPayment;
            payload.description = this.description;
            if( this.bankAccountId) {
                let bankAccountInfo = this.accountsList.find(a => a.id === this.bankAccountId);
                if (bankAccountInfo) {
                    payload.bankAccountId = this.bankAccountId;
                    payload.bankAccountName = bankAccountInfo.accountName;
                }
            } else {
                payload.bankAccountId = this.emptyGuid;
                payload.bankAccountName = 'No Bank Account';
            }
            if (this.debitGlId) {
                let debitGlInfo = this.accountsList.find(a => a.id === this.debitGlId);
                if (debitGlInfo) {
                    payload.debitGlId = this.debitGlId;
                    payload.debitGlName = debitGlInfo.accountIdentifier;
                }else
                {
                    payload.debitGlId = this.emptyGuid;
                    payload.debitGlName = 'No Debit GL';
                }
            }

            if (this.creditGlId) {
                let creditGlInfo = this.accountsList.find(a => a.id === this.creditGlId);
                if (creditGlInfo) {
                    payload.creditGlId = this.creditGlId;
                    payload.creditGlName = creditGlInfo.accountIdentifier;
                }else
                {
                    payload.creditGlId = this.emptyGuid;
                    payload.creditGlName = 'No Credit GL';
                }
            }
            payload.tenantId = this.tenantId;
            payload.ouId = this.ouId;
            payload.isInvoiceDebit = this.isInvoiceDebit;
            payload.invoiceId = this.emptyGuid;
            payload.invoiceNo = this.invoiceNo;
            payload.invoiceCurrencyId = this.emptyGuid;
            payload.invoiceCurrencyName = 'No Invoice';
            payload.invoiceBuyRate = 0;
            payload.invoiceBalance = 0;
            payload.supplierId = this.supplierId;
            payload.supplierName = this.supplierName;
            payload.accountNo = this.accountNo;
            payload.invoiceBalance = 0;
            
                payload.id = this.memoId;
                payload.tenantId = this.tenantId;

            let url= '/ApDataEntry/UpdateDebitMemo'

            axios.post(url, payload)
                .then(response => {
                    if (response.data.code === 200 || response.data === 200) {
                        this.toastHandler('', 'Debit Memo Updated.');
                        this.getMemo();
                        $('#addEdit').modal('hide');
                        this.clearForm();
                        this.isLoading = false;
                    } else {
                        this.toastHandler('error', response.data.message || 'Something went wrong.');
                        $('#addEdit').modal('hide');
                        this.isLoading = false;
                    }
                    window.location.href = `/ApDataEntry/InitDebitMemo`;
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to save Debit Memo.');
                    $('#addEdit').modal('hide');
                    this.isLoading = false;
                });

        },
        validateForm() {
            if (this.$refs.debitMemo.checkValidity()) {
                // if form is valid display modal #addEdit
                $('#addEdit').modal('show');
            } else {
                // If form is invalid, show validation error messages
                this.$refs.voucherForm.reportValidity();
                $('#addEdit').modal('hide');

            }
        },
        clearForm() {
            window.location.reload();
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
        getMemoDetails(id) {
            return this.debitMemoList.find(a => a.id === id);
        },
        setCurrentDebitMemo(id) {
                const debitMemo = this.getMemoDetails(id);
                    this.transactionDate = debitMemo.transactionDate;
                    this.amount = parseFloat(debitMemo.amount).toFixed(2);
                    this.modeOfPayment = debitMemo.modeOfPayment;
                    this.chequeNumber = debitMemo.chequeNo;
                    this.chequeDate = debitMemo.chequeDate;
                    this.description = debitMemo.description;
                    this.bankAccountId = debitMemo.bankAccountId;
                    this.bankId = debitMemo.bankId;
                    this.bankName = debitMemo.bankName;
                    this.cash = debitMemo.cash;
                    this.cheque = debitMemo.cheque;
                    this.bankBranchId = debitMemo.bankBranchId;
                    this.bankBranchName = debitMemo.bankBranch;
                    this.debitGlId = debitMemo.debitGlId;
                    this.creditGlId = debitMemo.creditGlId;
                    this.ouId = debitMemo.ouId;
                    this.supplierId = debitMemo.supplierId;
                    this.supplierName = debitMemo.supplierName;
                    this.accountNo = debitMemo.accountNo;
                    this.isInvoiceDebit = debitMemo.isInvoiceDebit;
                    this.invoiceId = debitMemo.invoiceId;
                    this.invoiceNo = debitMemo.invoiceNo;
                    this.batchNumber = debitMemo.batchNumber;
                    this.invoiceCurrencyId = debitMemo.invoiceCurrencyId;
                    this.invoiceCurrencyName = debitMemo.invoiceCurrencyName;
                    this.invoiceBuyRate = parseFloat(debitMemo.invoiceBuyRate).toFixed(4);
                    this.invoiceBalance = parseFloat(debitMemo.invoiceBalance).toFixed(4);
                    this.balance = parseFloat(debitMemo.invoiceBalance).toFixed(4);
                    this.ouName = debitMemo.ouName;
                    let dropdown = $("#bankAccountId").data("ejDropDownList");
                    if (dropdown) {
                        dropdown.option("value", debitMemo.bankAccountId);
                    }
                    let ouDropdown = $("#ouId").data("ejDropDownList");
                    if (ouDropdown) {
                        ouDropdown.option("value", debitMemo.ouId);
                    }
                    let bankDropdown = $("#bankId").data("ejDropDownList");
                    if (bankDropdown) {
                        bankDropdown.option("value", debitMemo.bankId);
                    }
                    let branchDropdown = $("#branchId").data("ejDropDownList");
                    if (branchDropdown) {
                        branchDropdown.option("value", debitMemo.bankBranchId);
                    }
                    this.bankAccountName =debitMemo.bankAccountName;
                    let debitGlDropdown = $("#debitGlId").data("ejDropDownList");
                    if (debitGlDropdown) {
                        debitGlDropdown.option("value", debitMemo.debitGlId);
                    }
                    let creditGlDropdown = $("#creditGlId").data("ejDropDownList");
                    if (creditGlDropdown) {
                        creditGlDropdown.option("value", debitMemo.creditGlId);
                    }
                    let currencyDropdown = $("#currencyId").data("ejDropDownList");
                    if (currencyDropdown) {
                        currencyDropdown.option("value",debitMemo.currencyId);
                    }
                    this.tenantId = debitMemo.tenantId;
                    
        },
        resetBankFields() {
            this.bankId = '';
            this.bankName = '';
            this.bankBranchId = '';
            this.bankBranchName = '';
            $("#bankId").ejDropDownList("option", "value", null);
            $("#bankBranchId").ejDropDownList("option", "value", null);
        },
        deleteMemo(id) {

            axios.get('/ApDataEntry/DeleteDebitMemo/?id=' + id).then(response => {

                this.getMemo();

                this.toastHandler('', 'Memo deleted.');


            }).catch(err => {

                this.toastHandler('error', 'Unable to delete Debit memo.');

            });
        },
    },
    watch: {

        supplierId(val) {

            if (val) {

                let supplierInfo = this.getSupplierDetails(val);
                if (supplierInfo) {
                    this.supplierName = supplierInfo.name;
                    this.accountNo = supplierInfo.accountNumber;
                }
                this.setSupplier();

            }

        },
        currencyId(val) {
            if (val) {

                this.setBuyRate();

            }
        },
        debitMemoId(val) {
            if (val) {
                this.setCurrentDebitMemo();
            }
        },

        bankId(val) {
            if (val) {
                const bankInfo = this.getBankDetails(val);

                if (bankInfo) {
                    this.bankBranchList = [...bankInfo.bankBranches].sort((a, b) => {
                        const nameA = a?.name || "";
                        const nameB = b?.name || "";
                        return nameA.localeCompare(nameB);
                    });
                    $("#branchId").ejDropDownList({
                        dataSource: this.bankBranchList,
                        watermarkText: "Select Branch",
                        width: "100%",
                        fields: { id: "id", text: "name", value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            this.bankBranchId = args.value;
                        }
                    });

                    this.$nextTick(() => {
                        if (this.bankBranchId) {
                            $("#branchId").ejDropDownList("option", "value", this.bankBranchId);
                        }
                    });
                }
            }
        },
    },
    mounted() {
        this.memoId = window.memoId
        this.getBusinessProfile();
        this.setCurrentInvoice();
        this.getBankAccounts();
        this.getInvoices();
        this.getSuppliers();
        this.getCurrency();
        this.getCostCenters();
        this.getBanks();
        this.initDebitMemo();
        this.generateInvoiceNo();
        this.getDefaultGlSetup();
        this.getMemo();
    }

});
app.mount('#app');
    