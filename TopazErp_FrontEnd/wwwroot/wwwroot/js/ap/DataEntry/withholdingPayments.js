const app = Vue.createApp({
data() {
    return {
        selectedWithHoldings: [],
        isShimmerLoading: false,
        isLoading: false,
        payload: {},
        emptyGuid: '00000000-0000-0000-0000-000000000000',
        invoiceList: [],
        invoiceId: '',
        detailsList: [],
        supplierList: [],
        withHoldingList: [],
        supplierId: '',
        supplierName: '',
        accountNumber: '',
        invoiceNumber: '',
        paymentDate: moment().format("YYYY-MM-DD"),
        balance: '0',
        purchaseOrderNumber: '',
        currencyList: [],
        currencyId: '',
        totalInvoiceAmount: '0',
        amountToPay: '0',
        referenceNumber: '0',
        description: '',
        isVatWithheld: false,
        unitPrice: '0',
        quantity: '0',
        subTotal: ' 0',
        ouId: '',
        ouList: [],
        ouName: '',
        departmentHierachyList: [],
        ouNameList: [],
        debitAccountList: [],
        debitAccountId: '',
        date: moment().format("YYYY-MM-DD"),
        address: '',
        voucherNumber: '',
        batchNumber: '0',
        discount: '0',
        departments: [],
        debitAccountName: '',
        invoiceEdithList: [],
        chequeNumber: '',
        bankAccountId: this.emptyGuid,
        bankAccountName: '',
        bankAccountNumber: '',
        isPosted: false,
        invoiceTypeList: [],
        invoiceType: '',
        cash: true,
        cheque: false,
        selectedInvoiceList: [],
        outstandingCreditMemo: '0',
        withholdingId: '',
        modeOfPayment: 'Cash',
        isAutomatic: false,
        filteredInvoices: [],
        invoiceTypeId: '',
        amountToApply: '0',
        accountsList: [],
        buyRate: 0,
        bankAccountList: [],
    }
    },
    methods:{
        initPayment() {

            axios.get('/LedgerSetups/GetChartOfAccountDetails').then(response => {

                let accounts = response.data.accountDetails;

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

            }).catch(err => {

                this.toastHandler('error', 'payment initialization failed.');

            });
        },
        getDefaultGlSetup() {

            axios.get('/LedgerSetups/GetDefaultGlSetup').then(response => {

                let responseData = response.data;
                this.debitAccountId = responseData.accountsPayableAccountId;

                if (responseData) {

                    this.id = responseData.id;

                    $("#vatWithHoldAccountId").ejDropDownList({

                        value: responseData.vatPaidAccountId,

                    });
                    $("#bankAccountId").ejDropDownList({

                        value: responseData.accountPayablesBankAccountId,

                    });

                }
                $("#paymentDate").ejDatePicker({
                    width: "100%",
                    dateFormat: "yyyy-MM-dd",
                    value: moment().add(1, 'months').format("YYYY-MM-DD"),
                    change: (args) => {
                        this.paymentDate = args.value;
                    }
                });


            }).catch(err => {

                console.log(err);

                this.toastHandler('error', 'Unable to get default GL numbers.');

            });
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
                this.changeBankAccount(this.currencyId);
            }).catch(err => {
                this.toastHandler('error', 'Unable to get currency.');
            });
        },
        getSelectedWithHoldings() {
            let obj = $("#dataTable2").ejGrid("instance"), rec = []; this.selectedWithHoldings = [];
            let check = obj.checkSelectedRowsIndexes;
            if (check.length) {
                for (let pageInx = 0; pageInx < check.length; pageInx++) {
                    if (!ej.isNullOrUndefined(check[pageInx]))
                        rec = this.getRecords(pageInx, check[pageInx], obj, rec);
                }
            }

            this.selectedWithHoldings = rec;

        },
        getSelectedInvoices() {
            let obj = $("#dataTable").ejGrid("instance"), rec = []; this.selectedInvoiceList = [];
            let check = obj.checkSelectedRowsIndexes;
            if (check.length) {
                for (let pageInx = 0; pageInx < check.length; pageInx++) {
                    if (!ej.isNullOrUndefined(check[pageInx]))
                        rec = this.getRecords(pageInx, check[pageInx], obj, rec);
                }
            }

            this.selectedInvoiceList = rec;

        },
        getRecords(pageInx, inx, proxy, rec) {

            if (inx.length) {
                for (let i = 0; i < inx.length; i++) {
                    let pageSize = proxy.model.pageSettings.pageSize;  //gets the page size of grid
                    let data = proxy.model.dataSource[pageInx * pageSize + inx[i]];
                    rec.push(data);     //pushing all the selected Records
                }
            }
            return rec;

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
        getWithHoldingsPayments() {
            axios.get('/ApDataEntry/GetWithHoldingPayments')
                .then(response => {
                    this.withHoldingList = response.data;
                    this.withHoldingList.forEach(payment => {
                        payment.paymentDate = this.formatDate(payment.paymentDate);
                        payment.displayText = `${payment.supplierName} - Batch - ${payment.batchNumber}`;
                        payment.bankAccountName = `${payment.bankAccountNumber} - ${payment.bankAccountName}`;
                    });
                    let unpostedPayments = this.withHoldingList.filter(payment => payment.isPosted === false);
                    this.postTable(unpostedPayments);
                    $("#withholdingId").ejDropDownList({
                        dataSource: unpostedPayments,
                        watermarkText: "Select Payment to Edit",
                        width: "100%",
                        fields: { id: "id", text: "displayText", value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            this.withholdingId = args.value;
                        }
                    });
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get payments.');
                });
        },
        postTable(responseData) {
            $("#dataTable2").ejGrid({
                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                editSettings: { allowDeleting: true, showDeleteConfirmDialog: true },
                toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Delete, ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                columns: [
                    { field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true },
                    { type: "checkbox", width: 20, textAlign: ej.TextAlign.Center,},
                    { field: "supplierName", headerText: "Supplier", textAlign: ej.TextAlign.Left, width: 75 },
                    { field: "currencyName", headerText: "Currency", width: 65 },
                    { field: "buyRate", headerText: "Rate", format: "{0:n4}", textAlign: ej.TextAlign.Left, width: 35 },
                    { field: "bankAccountName", headerText: "Bank G/L", width: 85 },
                    { field: "amountToApply", headerText: "Amount To Apply", width: 65, format: "{0:n2}" },
                    { field: "paymentDate", headerText: "Payment Date", width: 65, format: "{0:yyyy-MM-dd}"},
                    { field: "modeOfPayment", headerText: "Mode of Payment", width: 75 },
                    { field: "outstandingCreditMemo", headerText: "Outstanding Credit Memo", width: 75, format: "{0:n2}" },
                    { field: "tenantId", visible: false, headerText: "Tenant Id", width: 15 }
                ],
                endDelete: (args) => {
                    const deletedItems = args.data;
                    deletedItems.forEach(item => {
                        if (item?.id) {
                            this.delPayment(item.id);
                        } else {
                            console.warn("Missing ID on deleted item:", item);
                        }
                    });
                },
            });
        },
        delPayment(id) {
            axios.delete('/ApDataEntry/DeleteWithHoldingPayment?id=' + id)
                .then(response => {
                        this.toastHandler('', 'Payment deleted.');
                        this.getWithHoldingsPayments();
                })
                .catch(err => {
                    this.isLoading = false;
                    this.toastHandler('error', 'Unable to delete payment.');
                });
        },
        setBuyRate() {
            if (this.currencyId) {
                const currency = this.currencyList.find(a => a.id === this.currencyId);
                this.buyRate = parseFloat(currency.buyRate).toFixed(4);
            }
        },
        postWithHolding() {
            this.getSelectedWithHoldings();
            this.isLoading = true;
            // Check if any payment is selected
            if (!this.selectedWithHoldings.length) {
                this.toastHandler('warning', 'Please select an invoice to post.');
                return;
            }
            let payload = {};
            payload.withholdingIds = this.selectedWithHoldings.map(a => a.id);

            // Proceed with posting the payment
            axios.post('/ApDataEntry/InitPostWithHoldingPayment', payload)
                .then(response => {
                    if (response.data.code === 200) {
                        this.toastHandler('', response.data.message);
                        this.getWithHoldingsPayments();
                    } else {
                        this.toastHandler('warning', response.data.message);
                    }
                    this.isLoading = false;
                    $('#addEdit').modal('hide');
                })
                .catch(err => {
                    this.isLoading = false;
                    this.toastHandler('error', 'Unable to post payment.');
                });
        },
        updateFilteredInvoices1() {
            const filteredInvoices = this.invoiceList.filter(invoice => {
                return invoice.supplierId === this.supplierId
            });
            this.filteredInvoices = filteredInvoices;
            this.dataTable(filteredInvoices);
        },
        getGridData() {
            axios.get('/ApDataEntry/GetInvoices/')
                .then(invoiceResponse => {
                        this.invoiceList = invoiceResponse.data.filter(invoice =>
                        invoice.isPosted && invoice.balance > 0&& invoice.invoiceDetails.length > 0 && invoice.isCanceled === false
                    );

                    this.detailsList = [];
                    this.invoiceDetailsMap = {};
                    this.invoiceList.forEach(invoice => {
                        invoice.invoiceId = invoice.id;
                        invoice.invoiceDate = this.formatDate(invoice.invoiceDate);
                        invoice.projectedPayDate = this.formatDate(invoice.projectedPayDate);

                        // Map details
                        this.invoiceDetailsMap[invoice.id] = invoice.invoiceDetails.map(detail => {
                            detail.invoiceId = invoice.id; // Assign the parent invoice ID
                            this.detailsList.push(detail); // Populate detailsList
                            return detail;
                        });
                    });
                    this.updateFilteredInvoices1();
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get invoices.');
                });
        },
        dataTable(responseData) {
            $("#dataTable").ejGrid({
                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Search] },
                childGrid: {
                    dataSource: this.detailsList,
                    queryString: "invoiceId",
                    allowPaging: true,
                    allowSorting: true,
                    isResponsive: true,
                    pageSettings: { pageSize: 10 },
                    toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Search] },
                    columns: [
                        { field: "id", headerText: 'Id', visible: false, isPrimaryKey: true, width: 80 },
                        { field: "invoiceId", headerText: 'Invoice Id', visible: false, width: 80 },
                        { field: "referenceNumber", headerText: 'Ref No', textAlign: ej.TextAlign.Left, width: 60 },
                        { field: "description", headerText: "Description", width: 80 },
                        {field: "debitAccountName", headerText: "Debit G/L", width: 80, textAlign: ej.TextAlign.Left},
                        { field: "unitPrice", headerText: "Unit Price", width: 65, format: "{0:n2}" },
                        { field: "quantity", headerText: "Quantity", width: 65 },
                        { field: "subTotal", headerText: "Sub Total", width: 65, format: "{0:n2}" },
                    ]
                },
                columns: [
                    { field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true },
                    { type: "checkbox", width: 20, textAlign: ej.TextAlign.Center,},
                    { field: "invoiceNumber", headerText: "Invoice No.", textAlign: ej.TextAlign.Left, width: 75 },
                    {field: "liabilityAccountName", headerText: "Liability G/L", width: 80, textAlign: ej.TextAlign.Left},
                    { field: "currencyName", headerText: "Currency", textAlign: ej.TextAlign.Left, width: 75 },
                    { field: "totalInvoiceAmount", headerText: "Total Amount", width: 80, format: "{0:n2}" },
                    { field: "balance", headerText: "Balance", width: 80, format: "{0:n2}" },
                    { field: "invoiceDate", headerText: "Invoice Date", width: 75, format: "{0:yyyy-MM-dd}" },
                    { field: "projectedPayDate", headerText: "Projected Pay Date", width: 75, format: "{0:yyyy-MM-dd}" },
                    { field: "tenantId", visible: false, headerText: "Tenant Id", width: 15 }
                ]
            });
        },
        getSuppliers() {
            axios.get('/SharedResource/GetSuppliers')
                .then(response => {
                    this.supplierList =  response.data.sort((a, b) => a.name.localeCompare(b.name)).filter(a => a.statusName.trim().toLowerCase() === 'active' && a.balance > 0);

                    this.supplierList.forEach((supplier) => {
                        supplier.displayName = `${supplier.name} - ${supplier.accountNumber}`;
                    });
                    $("#supplierId").ejDropDownList({
                        dataSource: this.supplierList,
                        watermarkText: "Select Supplier",
                        width: "100%",
                        fields: { id: "id", text: "displayName", value: "id" },
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
        setCurrentSupplier() {
            let supplierInfo = this.getSupplierDetails(this.supplierId);
            if (supplierInfo) {
                this.accountNumber = supplierInfo.accountNumber;
                this.balance = supplierInfo.balance;
                this.supplierName = supplierInfo.name;
                this.supplierId = supplierInfo.id;
                this.address = supplierInfo.address;
                this.tenantId = supplierInfo.tenantId;
                $("#supplierId").ejDropDownList({value: supplierInfo.id});
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
        parseDepartmentHierachy(dataArr) {

            this.ouList = dataArr;

            let departmentHierachyList = [];

            for (let i = 0; i < this.ouList.length; i++) {

                this.getDepartmentHierachyName(this.ouList[i].id);

                let name = [...new Set(this.ouNameList)].join().replace(/,/g, '/');

                departmentHierachyList.push({
                    name: name,
                    parentId: this.ouList[i].parentId,
                    id: this.ouList[i].id,
                    rawName: this.ouList[i].name,
                    tenantId: this.ouList[i].tenantId,
                });

                name = [];

                this.ouNameList = [];

            }

            this.departmentHierachyList = departmentHierachyList;

        },
        getDepartmentHierachyName(id) {

            let parentId;
            let returnName;
            this.ouList.forEach(item => {

                if (item.id === id) {
                    parentId = item.parentId;
                    returnName = item.name;
                }

                this.ouList.forEach(cc => {
                    if (cc.id === parentId) {
                        return (`${this.getDepartmentHierachyName(parentId)} / ${returnName}`);
                    }
                })

            });

            this.ouNameList.push(returnName);

        },
        getDepartmentDetails(id) {

            return this.departmentHierachyList.find(a => a.id === id);
        },
        getCurrencyDetails(id) {
            return this.currencyList.find(a => a.id === id);
        },
        formatDate(dateInput) {

            return moment(dateInput).format("YYYY-MM-DD");

        },
        calculateOutstandingCreditMemo() {
            let amountToPay = parseFloat(this.amountToApply) || 0;

            if (amountToPay > 0 && this.selectedInvoiceList.length > 0) {
                let totalBalance = this.selectedInvoiceList.reduce((acc, invoice) => {
                    let balance = parseFloat(invoice.balance) || 0;
                    return acc + balance;
                }, 0);

                this.outstandingCreditMemo = (amountToPay - totalBalance).toFixed(2);
                console.log(this.outstandingCreditMemo);

                if (amountToPay > totalBalance) {
                    this.toastHandler('warning', 'You have an outstanding credit memo of ' + this.outstandingCreditMemo);

                }
            }
        },
        savePayment() {
            this.isLoading = true;
            this.getSelectedInvoices();
            this.calculateOutstandingCreditMemo();
            let payload = {};
            if (this.batchNumber === null || this.batchNumber === '') {
                payload.batchNumber = '0';
            } else {
                payload.batchNumber = this.batchNumber;
            }

            if (this.currencyId) {
                let currencyInfo = this.getCurrencyDetails(this.currencyId);
                if (currencyInfo) {
                    payload.currencyId = currencyInfo.id;
                    payload.currencyName = currencyInfo.currencyName;
                    payload.currencyCode = currencyInfo.currencyCode;
                    payload.buyRate = currencyInfo.buyRate;
                    payload.sellRate = currencyInfo.sellRate;
                }
            }
            if (this.supplierId) {
                let supplierInfo = this.getSupplierDetails(this.supplierId);
                if (supplierInfo) {
                    payload.supplierId = supplierInfo.id;
                    payload.supplierName = supplierInfo.name;
                    payload.accountNumber = supplierInfo.accountNumber;
                }
            }
            if (this.selectedInvoiceList.length === 0) {
                this.toastHandler('warning', 'Please select at least one invoice.');
                this.isLoading = false;
                return;
            }
            payload.invoiceList = this.selectedInvoiceList;
            payload.amountToPay = this.amountToApply;
            payload.amountToApply = this.amountToApply;
            payload.paymentDate = this.paymentDate;
            payload.outstandingCreditMemo = this.outstandingCreditMemo;
            payload.modeOfPayment = this.modeOfPayment;
            payload.chequeNumber = this.chequeNumber;
            payload.bankAccountId = this.bankAccountId;
            if (this.bankAccountId) {
                let bankAccountInfo = this.accountsList.find(a => a.id === this.bankAccountId);
                if (bankAccountInfo) {
                    payload.bankAccountName = bankAccountInfo.accountName;
                    payload.bankAccountNumber = bankAccountInfo.accountNo;
                }
                else{
                    payload.bankAccountName = '';
                    payload.bankAccountNumber = '';
                }
            }
            payload.isPosted = this.isPosted;
            payload.isAutomatic = this.isAutomatic;
            if(this.withholdingId){
                payload.id = this.withholdingId;
                payload.tenantId = this.tenantId;

                axios.post('/ApDataEntry/UpdateWithHoldingPayment', payload)
                    .then(response => {
                        this.getWithHoldingsPayments();
                        this.toastHandler('', 'WithHolding Payment updated.');
                    })
                    .catch(err => {
                        this.toastHandler('error', 'Unable to update payment.');
                    });
                this.isLoading = false;
            } else {
                axios.post('/ApDataEntry/CreateWithHoldingPayment', payload)
                    .then(response => {
                        this.getWithHoldingsPayments();
                        if (response.data.code === 200) {
                            this.toastHandler('', 'WithHolding Payment Made.');
                        } else {
                            this.toastHandler('error', response.data.message);
                        }
                        this.isLoading = false;
                    })
                    .catch(err => {
                        this.toastHandler('error', 'Unable to save WithHolding Payment.');
                    });
            }

        },
        clearForm() {
            window.location.reload();
        },
        getPaymetDetails(id) {
            return this.withHoldingList.find(a => a.id === id);
        },
        setCurrentWithHoldingPayment() {
            let paymentInfo = this.getPaymetDetails(this.withholdingId);
            if (paymentInfo) {
                this.supplierId = paymentInfo.supplierId;
                this.supplierName = paymentInfo.supplierName;
                this.accountNumber = paymentInfo.accountNumber;
                this.paymentDate = paymentInfo.paymentDate;
                this.balance = paymentInfo.balance;
                this.purchaseOrderNumber = paymentInfo.purchaseOrderNumber;
                this.currencyId = paymentInfo.currencyId;
                this.totalInvoiceAmount = paymentInfo.totalInvoiceAmount;
                this.amountToPay = parseFloat(paymentInfo.amountToPay).toFixed(2);
                this.amountToApply = parseFloat(paymentInfo.amountToApply).toFixed(2);
                this.referenceNumber = paymentInfo.referenceNumber;
                this.description = paymentInfo.description;
                this.currencyName = paymentInfo.currencyName;
                this.currencyCode = paymentInfo.currencyCode;
                this.buyRate = parseFloat(paymentInfo.buyRate).toFixed(4);
                this.sellRate = paymentInfo.sellRate;
                this.ouId = paymentInfo.ouId;
                this.ouName = paymentInfo.ouName;
                this.voucherNumber = paymentInfo.voucherNumber;
                this.debitAccountName = paymentInfo.debitAccountName;
                this.chequeNumber = paymentInfo.chequeNumber;
                this.bankAccountId = paymentInfo.bankAccountId;
                this.bankAccountName = paymentInfo.bankAccountName;
                this.bankAccountNumber = paymentInfo.bankAccountNumber;
                this.outstandingCreditMemo = parseFloat(paymentInfo.outstandingCreditMemo).toFixed(2);
                let dropdown = $("#bankAccountId").data("ejDropDownList");
                if (dropdown) {
                    dropdown.option("value", paymentInfo.bankAccountId);
                }
                this.isPosted = paymentInfo.isPosted;
                this.cash = paymentInfo.cash;
                this.cheque = paymentInfo.cheque;
                this.modeOfPayment = paymentInfo.modeOfPayment;
                this.isAutomatic = paymentInfo.isAutomatic;
                this.selectedInvoiceList = paymentInfo.invoiceList;
                this.batchNumber = paymentInfo.batchNumber;
                this.updateFilteredInvoices1();
                $("#withholdingId").ejDropDownList({value: paymentInfo.id});
            }
        },
        getBankAccounts() {
            axios.get('/LedgerSetups/GetBankAccounts').then(response => {
                this.bankAccountList = response.data;
            }).catch(err => {
                console.error('Bank account fetch error:', err);
                this.toastHandler('error', 'Unable to get bank accounts.');
            });
        },
        changeBankAccount(currencyId) {
            const val = currencyId || this.currencyId;

            // ✅ Guard: ensure currency and account list exist
            if (!val || !Array.isArray(this.accountsList) || !this.accountsList.length) {
                this.$nextTick(() => {
                    const cddl = $('#currencyId').data("ejDropDownList");
                    if (cddl) cddl.option({ value: val });
                });
                return;
            }

            // ✅ Local copies to prevent accidental mutations
            const accountList = [...this.accountsList];
            const currencyList = [...this.currencyList];

            // ✅ Filter accounts whose currencyId matches the selected currency
            const accounts = accountList.filter(acc =>
                String(acc.currencyId) === String(val)
            );

            // ✅ Initialize or update the bankAccountId dropdown
            this.$nextTick(() => {
                const ddl = $('#bankAccountId').data("ejDropDownList");

                if (ddl) {
                    // Update existing dropdown’s dataSource and value
                    ddl.option({ dataSource: accounts });
                    ddl.option({
                        value: accounts.some(a => String(a.id) === String(this.bankAccountId))
                            ? this.bankAccountId
                            : null
                    });
                } else {
                    // Initialize new dropdown instance
                    $('#bankAccountId').ejDropDownList({
                        dataSource: accounts,
                        width: "100%",
                        watermarkText: "Select Account",
                        fields: { id: "id", text: "accountIdentifier", value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            this.bankAccountId = args.value;
                        }
                    });
                }

                // ✅ Keep currency dropdown synced
                const cddl = $('#currencyId').data("ejDropDownList");
                if (cddl) {
                    cddl.option({ dataSource: currencyList, value: val });
                }
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
        supplierId(val) {
            if (val) {
                this.setCurrentSupplier();
                this.updateFilteredInvoices1();
                this.getGridData();
            }
        },
        invoiceId(val) {

            if (val) {

                this.setCurrentInvoice();

            }
        },
        withholdingId(val) {
            if (val) {
                this. setCurrentWithHoldingPayment();
            }
        },
        currencyId(val) {
            if (val) {
                this.setBuyRate();
            }
            this.changeBankAccount(val);
            
        },
       
    },
    mounted() {
        this.initPayment();
        this.getSuppliers();
        this.getDefaultGlSetup();
        this.getBankAccounts();
        this.getCurrency();
        this.getDepartments();
        this.getWithHoldingsPayments();
        // this.generateBatchNumber();
    }
});
app.mount('#app');