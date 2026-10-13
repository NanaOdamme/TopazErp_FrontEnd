const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,
            payload: {},
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            invoiceList: [],
            invoiceId: '',
            detailsList: [],
            supplierList: [],
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
            minorName: '',
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
            costCenterHierachyList: [],
            costCenterList: [],
            ouNameList: [],
            debitAccountList: [],
            debitAccountId: '',
            date: moment().format("YYYY-MM-DD"),
            address: '',
            voucherNumber: '',
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
            paymentList: [],
            selectedInvoiceList: [],
            outstandingCreditMemo: '0.00',
            paymentId: '',
            modeOfPayment: 'Cash',
            isAutomatic: true,
            Automatic: true,
            Manual: false,
            filteredInvoices: [],
            invoiceTypeId: '',
            invoiceTypeName: '',
            paymentInvoiceList: [],
            paymentInvoiceDetailsMap: {},
            reportType: 'details',
            reportApiBaseUrl: '',
            reportPath: '',
            buyRate: '0.0000',
            bankId: '',
            bankName: '',
            bankBranchId: '',
            bankBranch: '',
            bankList: [],
            bankBranchList: [],
            accountsList: [],
            skipInvoiceReload: false,
            bankAccountList: [],
            isOu: true,
            approveInvoiceBeforePayment: false,
            isMultiCurrency: false,
            invoiceRate: '1.0000',
            isSettingPayment: false,
            batchNumber: ''
        }
    },
    methods:{
        getBusinessProfile() {
            axios.get('/SharedResource/GetBusinessProfile').then(response => {
                if (response.data) {
                    this.isOu = response.data.enforceOu;
                   this.approveInvoiceBeforePayment = response.data.approveInvoiceBeforePayment
                }
            }).catch(err => {
                console.log(err);
            });
        },
        initPayment() {
            return axios.get('/LedgerSetups/GetChartOfAccountDetails')
                .then(response => {
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
                        accounts.sort((a, b) => Number(a.accountNo) - Number(b.accountNo));
                    }

                    this.accountsList = accounts;

                    // Initialize or update bankAccountId dropdown
                    this.$nextTick(() => {
                        const ddl = $("#bankAccountId").data("ejDropDownList");
                        if (ddl) {
                            ddl.option({ dataSource: this.accountsList });
                        } else {
                            $('#bankAccountId').ejDropDownList({
                                dataSource: this.accountsList,
                                width: "100%",
                                watermarkText: "Select Account",
                                fields: { id: "id", text: "accountIdentifier", value: "id" },
                                enableFilterSearch: true,
                                change: (args) => { this.bankAccountId = args.value; }
                            });
                        }
                    });
                })
                .catch(err => {
                    this.toastHandler('error', 'payment initialization failed.');
                    throw err;
                });
        },
        getBankAccounts() {
            return axios.get('/LedgerSetups/GetBankAccounts')
                .then(response => {
                    this.bankAccountList = response.data || [];
                    console.log('bankAccountList', this.bankAccountList);
                    return this.bankAccountList;
                })
                .catch(err => {
                    console.error('Bank account fetch error:', err);
                    this.toastHandler('error', 'Unable to get bank accounts.');
                    throw err;
                });
        },
        getCurrency() {
            return axios.get('/SharedResource/GetCurrencys')
                .then(response => {
                    this.currencyList = response.data || [];

                    this.defaultCurrency = this.currencyList.find(currency => {
                        const name = (currency.currencyName || '').trim().toLowerCase();
                        return name === 'ghana cedis' || name === 'ghana cedi';
                    });

                    if (this.defaultCurrency) {
                        this.currencyId = this.defaultCurrency.id;
                        this.buyRate = parseFloat(this.defaultCurrency.buyRate || 0).toFixed(4);
                    }

                    // init or update currency dropdown
                    this.$nextTick(() => {
                        const ddl = $('#currencyId').data("ejDropDownList");
                        if (ddl) {
                            ddl.option({ dataSource: this.currencyList, value: this.currencyId });
                        } else {
                            $('#currencyId').ejDropDownList({
                                dataSource: this.currencyList,
                                width: "100%",
                                watermarkText: "Select Currency",
                                fields: { id: "id", text: "currencyName", value: "id" },
                                enableFilterSearch: true,
                                value: this.currencyId,
                                change: (args) => { this.currencyId = args.value; }
                            });
                        }
                        // call changeBankAccount AFTER currency dropdown and bankAccountList are available
                        this.changeBankAccount(this.currencyId);
                    });

                    return this.currencyList;
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get currency.');
                    throw err;
                });
        },
        changeBankAccount(currencyId) {
            const val = currencyId || this.currencyId;

            // Guard: ensure currency and account list exist
            if (!val || !Array.isArray(this.accountsList) || !this.accountsList.length) {
                this.$nextTick(() => {
                    const cddl = $('#currencyId').data("ejDropDownList");
                    if (cddl) cddl.option({ value: val });
                });
                return;
            }

            // Local copies to prevent accidental mutations
            const accountList = [...this.accountsList];
            const currencyList = [...this.currencyList];

            // Filter accounts whose currencyId matches the selected currency
            const accounts = accountList.filter(acc =>
                String(acc.currencyId) === String(val)
            );

            // Initialize or update the bankAccountId dropdown
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

                // Keep currency dropdown synced
                const cddl = $('#currencyId').data("ejDropDownList");
                if (cddl) {
                    cddl.option({ dataSource: currencyList, value: val });
                }
            });
        },
        getDefaultGlSetup() {
            return axios.get('/LedgerSetups/GetDefaultGlSetup')
                .then(response => {
                    const responseData = response.data;
                    if (responseData) {
                        this.id = responseData.id;
                        // if bankAccount dropdown is ready, set value; else set it in nextTick
                        this.$nextTick(() => {
                            const ddl = $("#bankAccountId").data("ejDropDownList");
                            if (ddl) {
                                ddl.option("value", responseData.accountPayablesBankAccountId);
                            } else {
                                // As a fallback, attempt to initialize when it becomes available
                                // (changeBankAccount and initPayment will have set up the dropdown earlier)
                                // Keep a small timeout fallback to avoid blocking in rare cases
                                setTimeout(() => {
                                    const ddl2 = $("#bankAccountId").data("ejDropDownList");
                                    if (ddl2) ddl2.option("value", responseData.accountPayablesBankAccountId);
                                }, 100);
                            }
                        });
                    }

                    // init paymentDate
                    $("#paymentDate").ejDatePicker({
                        width: "100%",
                        dateFormat: "yyyy-MM-dd",
                        value: moment().add(1, 'months').format("YYYY-MM-DD"),
                        change: (args) => { this.paymentDate = args.value; }
                    });

                    return responseData;
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get default GL setup.');
                    throw err;
                });
        },
        initPaymentType() {
            this.isAutomatic = !!this.Automatic;
        },
        toggleIsAutomatic() {
            this.Automatic = true;
            this.Manual = false;
        },
        toggleManual() {
            this.Automatic = false;
            this.Manual = true;
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
        formatNumber(number) {
            if (number < 0) {
                return `(${Math.abs(number).toFixed(2)})`;
            }
            return number;
        },
        getPayments() {
            axios.get('/ApDataEntry/GetPayments/')
                .then(response => {
                    this.paymentList = response.data;
                    const postedPayments = response.data.filter(payment => payment.isPosted === false && payment.isCanceled === false);
                    //format dates
                    this.paymentInvoiceList = [];
                    this.paymentInvoiceDetailsMap = {};
                    this.paymentList.forEach(payment => {
                        payment.paymentId = payment.id;
                        payment.paymentDate = this.formatDate(payment.paymentDate);
                        payment.displayName = `${payment.supplierName} - ${payment.batchNumber}`;
                        // Map details
                        this.paymentInvoiceDetailsMap[payment.id] = payment.invoiceList.map(detail => {
                            detail.paymentId = payment.id;
                            this.paymentInvoiceList.push(detail);
                            return detail;
                        });
                    });
                    this.renderTable(postedPayments);
                    $("#paymentId").ejDropDownList({
                        dataSource: postedPayments,
                        watermarkText: "Select Payment Batch No.",
                        width: "100%",
                        fields: { id: "id", text: "displayName", value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            this.paymentId = args.value;
                        }
                    });
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get payments.');
                });
        },
        generateBatchNumber() {
            axios.get('/ApDataEntry/GetPaymentLastBatchNumber')
                .then(response => {
                    this.batchNumber = response.data;
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to generate batch number.');
                    this.batchNumber = '0001';
                });
        },
        renderTable(responseData) {
            const formattedData = responseData.map(item => ({
                ...item,
                outstandingCreditMemo: this.formatNumber(item.outstandingCreditMemo),
            }));
            $("#paymentTable").ejGrid({
                dataSource: formattedData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                editSettings: { allowDeleting: true, showDeleteConfirmDialog: true },
                toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Delete, ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                childGrid: {
                    dataSource: this.paymentInvoiceList,
                    queryString: "paymentId",
                    allowPaging: true,
                    allowSorting: true,
                    isResponsive: true,
                    pageSettings: { pageSize: 10 },
                    toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                    columns: [
                        { field: "id", headerText: 'Id', visible: false, isPrimaryKey: true, width: 80 },
                        { field: "paymentId", headerText: 'Payment Id', visible: false, width: 80 },
                        { field: "supplierName", headerText: "Supplier", textAlign: ej.TextAlign.Left, width: 75 },
                        { field: "invoiceNumber", headerText: "Invoice Number", textAlign: ej.TextAlign.Left, width: 75 },
                        { field: "currencyName", headerText: "Currency", textAlign: ej.TextAlign.Left, width: 75 },
                        { field: "buyRate", headerText: "Currency Rate",format: "{0:n4}", textAlign: ej.TextAlign.Left, width: 75 },
                        { field: "totalInvoiceAmount", headerText: "Total Amount", width: 80, format: "{0:n2}" },
                        { field: "balance", headerText: "Balance", width: 80, format: "{0:n2}" },
                        { field: "batchNumber", headerText: "Batch N0.", width: 65 },
                        { field: "voucherNumber", headerText: "Voucher No.", width: 65 },
                    ],
                },
                columns: [
                    { field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true },
                    {field: "isPosted", headerText: "Posted", width: 35, type: "boolean"},
                    { field: "supplierName", headerText: "Supplier", textAlign: ej.TextAlign.Left, width: 75 },
                    { field: "currencyName", headerText: "Currency", width: 65 },
                    {field: "bankAccountName", headerText: "Bank G/L", width: 80, textAlign: ej.TextAlign.Left},
                    { field: "amountToPay", headerText: "Amount", width: 65, format: "{0:n2}" },
                    { field: "paymentDate", headerText: "Payment Date", width: 75, format: "{0:yyyy-MM-dd}"},
                    { field: "referenceNumber", headerText: "Reference Number", width: 75 },
                    { field: "batchNumber", headerText: "Batch Number", width: 75 },
                    { field: "modeOfPayment", headerText: "Mode of Payment", width: 75 },
                    { field: "outstandingCreditMemo", headerText: "Outstanding Credit Memo", width: 75, format: "{0:n2}" },
                    { field: "tenantId", visible: false, headerText: "Tenant Id", width: 15 }
                ],
                endDelete: (args) => {
                    this.delPayment(args.data.id);
                }
                
            });
        },
        getGridData(supplierId) {
            axios.get(`/ApDataEntry/GetInvoices?supplierId=${supplierId}`)
                .then(invoiceResponse => {
                    this.invoiceList = invoiceResponse.data.filter(invoice =>
                        invoice.isCanceled === false &&
                        invoice.isPosted &&
                        invoice.balance > 0 &&
                        invoice.invoiceDetails.length > 0 &&
                        (!this.approveInvoiceBeforePayment || invoice.isApproved === true)
                    )
                        .sort((a, b) => new Date(a.projectedPayDate) - new Date(b.projectedPayDate));

                    const invoiceTypeIds = invoiceResponse.data
                        .filter(invoice => invoice.supplierId === supplierId)
                        .map(invoice => invoice.currencyId);

                    this.invoiceTypeList = this.currencyList.filter(currency => invoiceTypeIds.includes(currency.id));
                    $("#invoiceTypeId").ejDropDownList({
                        dataSource: this.invoiceTypeList,
                        watermarkText: "Select Invoice Type",
                        width: "100%",
                        fields: { id: "id", text: "currencyName", value: "id" },
                        enableFilterSearch: true,
                        value: this.invoiceTypeId || '', // ensure not undefined
                        change: (args) => {
                            this.invoiceTypeId = args.value;
                            this.updateFilteredInvoices();
                        }
                    });

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
                    this.updateFilteredInvoices();
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get invoices.');
                });
        },
        updateFilteredInvoices() {
            const filteredInvoices = this.invoiceList.filter(invoice => {
                return invoice.supplierId === this.supplierId &&
                    (!this.invoiceTypeId || invoice.currencyId === this.invoiceTypeId);
            });
            this.filteredInvoices = filteredInvoices;
            this.dataTable(filteredInvoices);
            
            if (this.Manual && !this.isAutomatic) {
                const selectedIds = (this.selectedInvoiceList || []).map(s => s.id);
                this.filteredInvoices = filteredInvoices.map(inv => ({
                    ...inv,
                    isSelected: selectedIds.includes(inv.id)
                }));
                this.dataTable(this.filteredInvoices);
            }
        },
        calculateAndDisplayAppliedAmounts() {
            // Guard: make sure we have data and amount to pay
            if (!this.filteredInvoices || this.filteredInvoices.length === 0 || !this.amountToPay) {
                this.dataTable(this.filteredInvoices || []);
                return;
            }

            let remainingAmount = parseFloat(this.amountToPay);
            const invoiceRate = parseFloat(this.invoiceRate) || 1;
            const buyRate = parseFloat(this.buyRate) || 1;

            // Convert payment currency into invoice currency
            remainingAmount *= (buyRate / invoiceRate);

            const updatedInvoices = this.filteredInvoices
                .sort((a, b) => new Date(a.projectedPayDate) - new Date(b.projectedPayDate))
                .map(invoice => {
                    let balance = parseFloat(invoice.balance) || 0;
                    let applied = 0;

                    if (remainingAmount > 0) {
                        applied = Math.min(balance, remainingAmount);
                        remainingAmount -= applied;
                    }

                    return {
                        ...invoice,
                        appliedAmount: applied.toFixed(2),
                        newBalance: (balance - applied).toFixed(2)
                    };
                });

            // Update the grid with new values
            this.dataTable(updatedInvoices);
        },
        async ApplyPayment() {
            if (this.isAutomatic) {
                await this.calculateAndDisplayAppliedAmounts();
            }
        },

            calculateManualAppliedAmounts()
            {
                const selectedList = (this.selectedInvoiceList && this.selectedInvoiceList.length > 0)
                    ? this.selectedInvoiceList
                    : [];

                let amountToPay = parseFloat(this.amountToPay) || 0;

                if (this.Manual && amountToPay > 0 && this.filteredInvoices.length > 0) {
                    const invoiceRate = parseFloat(this.invoiceRate) || 1;
                    const buyRate = parseFloat(this.buyRate) || 1;
                    amountToPay = amountToPay * (buyRate / invoiceRate);

                    let remainingToApply = amountToPay;

                    // 💡 Rebuild all invoices each time — ensures deselections are cleared
                    const updatedInvoices = this.filteredInvoices.map(invoice => {
                        const selected = selectedList.some(s => s.id === invoice.id);
                        const balance = parseFloat(invoice.balance) || 0;
                        let applied = 0;

                        if (selected && remainingToApply > 0) {
                            applied = Math.min(balance, remainingToApply);
                            remainingToApply -= applied;
                        }

                        return {
                            ...invoice,
                            isSelected: selected,
                            appliedAmount: applied.toFixed(2),
                            newBalance: (balance - applied).toFixed(2)
                        };
                    });

                    this.filteredInvoices = updatedInvoices;

                    // ✅ Update grid only, no rebuild
                    const grid = $("#dataTable").ejGrid("instance");
                    if (grid) {
                        grid.dataSource(updatedInvoices);
                        grid.refreshContent();
                    }

                    this.calculateOutstandingCreditMemo();
                } else {
                    // 🧹 Reset all if no amount or no selection
                    const updatedInvoices = (this.filteredInvoices || []).map(inv => ({
                        ...inv,
                        appliedAmount: "0.00",
                        newBalance: parseFloat(inv.balance).toFixed(2),
                        isSelected: false
                    }));

                    this.filteredInvoices = updatedInvoices;
                    const grid = $("#dataTable").ejGrid("instance");
                    if (grid) {
                        grid.dataSource(updatedInvoices);
                        grid.refreshContent();
                    }

                    this.outstandingCreditMemo = 0;
                }
            }
        ,
        
            getSelectedInvoices()
            {
                const grid = $("#dataTable").ejGrid("instance");
                if (!grid || !grid.model) {
                    this.selectedInvoiceList = [];
                    return;
                }

                const data = grid.model.dataSource || [];
                // Build selection from the bound boolean field
                this.selectedInvoiceList = data.filter(d => d.isSelected);

                // If manual mode, recalc
                if (this.Manual || !this.isAutomatic) {
                    this.calculateManualAppliedAmounts();
                }
            }
        ,

            getRecords(pageInx, inx, proxy, rec)
            {

                if (inx.length) {
                    for (let i = 0; i < inx.length; i++) {
                        let pageSize = proxy.model.pageSettings.pageSize;  //gets the page size of grid
                        let data = proxy.model.dataSource[pageInx * pageSize + inx[i]];
                        rec.push(data);     //pushing all the selected Records
                    }
                }
                return rec;

            }
        ,

            dataTable(responseData)
            {
                const vm = this;

                // Ensure isSelected exists on every record (preserve any existing selection)
                const selectedIds = (this.selectedInvoiceList || []).map(s => s.id);
                const dataSource = (responseData || []).map(r => ({
                    ...r,
                    isSelected: !!r.isSelected || selectedIds.includes(r.id)
                }));

                $("#dataTable").ejGrid({
                    dataSource: dataSource,
                    allowPaging: true,
                    allowSorting: true,
                    isResponsive: true,
                    selectionSettings: {
                        selectionMode: ej.Grid.SelectionMode.Multiple,
                        selectionType: ej.Grid.SelectionType.CheckBox
                    },

                    toolbarSettings: {showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Search]},
                    childGrid: {
                        dataSource: this.detailsList,
                        queryString: "invoiceId",
                        allowPaging: true,
                        allowSorting: true,
                        isResponsive: true,
                        pageSettings: {pageSize: 10},
                        toolbarSettings: {showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Search]},
                        columns: [
                            {field: "id", headerText: 'Id', visible: false, isPrimaryKey: true, width: 80},
                            {field: "invoiceId", headerText: 'Invoice Id', visible: false, width: 80},
                            {field: "referenceNumber", headerText: 'Ref No', textAlign: ej.TextAlign.Left, width: 60},
                            {field: "description", headerText: "Description", width: 80},
                            {
                                field: "debitAccountName",
                                headerText: "Debit G/L",
                                width: 80,
                                textAlign: ej.TextAlign.Left
                            },
                            {field: "unitPrice", headerText: "Unit Price", width: 65, format: "{0:n2}"},
                            {field: "quantity", headerText: "Quantity", width: 65},
                            {field: "subTotal", headerText: "Sub Total", width: 65, format: "{0:n2}"},
                        ]
                    },
                    columns: [
                        {field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true},
                        // Bind checkbox to isSelected field so visual state matches data
                        {field: "isSelected", type: "checkbox", width: 20, textAlign: ej.TextAlign.Center},
                        {field: "invoiceNumber", headerText: "Invoice No.", textAlign: ej.TextAlign.Left, width: 60},
                        {
                            field: "liabilityAccountName",
                            headerText: "Liability G/L",
                            width: 80,
                            textAlign: ej.TextAlign.Left
                        },
                        {field: "currencyName", headerText: "Currency", textAlign: ej.TextAlign.Left, width: 60},
                        {field: "totalInvoiceAmount", headerText: "Total Amount", width: 80, format: "{0:n2}"},
                        {field: "balance", headerText: "Balance", width: 80, format: "{0:n2}"},
                        {field: "appliedAmount", headerText: "Amount To Apply", width: 85, format: "{0:n2}"},
                        {field: "newBalance", headerText: "New Balance", width: 85, format: "{0:n2}"},
                        {field: "invoiceDate", headerText: "Invoice Date", width: 60, format: "{0:yyyy-MM-dd}"},
                        {field: "projectedPayDate", headerText: "Pay Date", width: 60, format: "{0:yyyy-MM-dd}"},
                        {field: "tenantId", visible: false, headerText: "Tenant Id", width: 15}
                    ],
                    // Use args.data which contains the row data object reliably
                    rowSelected: function (args) {
                        if (args && args.data) {
                            args.data.isSelected = true;
                        }
                        // allow grid to finish then update selection list
                        setTimeout(() => vm.getSelectedInvoices(), 0);
                    },
                    rowDeselected: function (args) {
                        if (args && args.data) {
                            args.data.isSelected = false;
                        }
                        setTimeout(() => vm.getSelectedInvoices(), 0);
                    }
                });
            }
        ,
            getSuppliers()
            {
                axios.get('/SharedResource/GetSuppliers')
                    .then(response => {
                        this.supplierList = response.data.sort((a, b) => a.name.localeCompare(b.name)).filter(a => a.statusName.trim().toLowerCase() === 'active' && a.balance > 0);
                        this.supplierList.forEach((supplier) => {

                            supplier.displayName = `${supplier.name} - ${supplier.accountNumber}`;
                        });
                        $("#supplierId").ejDropDownList({
                            dataSource: this.supplierList,
                            watermarkText: "Select Supplier",
                            width: "100%",
                            fields: {id: "id", text: "displayName", value: "id"},
                            enableFilterSearch: true,
                            change: (args) => {
                                this.supplierId = args.value;
                            }
                        });
                    })
                    .catch(err => {
                        this.toastHandler('error', 'Unable to get suppliers.');
                    });
            }
        ,
            getSupplierDetails(id)
            {
                return this.supplierList.find(a => a.id === id);
            }
        ,
            setCurrentSupplier()
            {
                let supplierInfo = this.getSupplierDetails(this.supplierId);
                if (supplierInfo) {
                    this.accountNumber = supplierInfo.accountNumber;
                    this.balance = supplierInfo.balance;
                    this.supplierName = supplierInfo.name;
                    this.supplierId = supplierInfo.id;
                    this.address = supplierInfo.address;
                    if (supplierInfo.balance < 0) {
                        this.outstandingCreditMemo = parseFloat(supplierInfo.balance).toFixed(2);
                    } else {
                        this.outstandingCreditMemo = '0.00';
                    }
                    this.tenantId = supplierInfo.tenantId;
                    $("#supplierId").ejDropDownList({value: supplierInfo.id});
                }
            }
        ,

            parseCostCenterHierachy(dataArr)
            {

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

            }
        ,
            getHierachyName(id)
            {

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

            }
        ,
            getCostCenters()
            {
                axios.get('/SharedResource/GetCostCenters/').then(response => {

                    this.costCenterList = response.data;

                    const parsed = this.parseCostCenterHierachy(response.data);
                    this.costCenterHierachyList = parsed;

                    let initOuId = this.ouId && this.ouId !== this.emptyGuid ? this.ouId : (this.costCenterHierachyList.length > 0 ? this.costCenterHierachyList[0].id : this.emptyGuid);


                    $("#ouId").ejDropDownList({
                        dataSource: this.costCenterHierachyList,
                        width: "100%",
                        watermarkText: "Select OU/Cost Center",
                        fields: {id: "id", text: "name", value: "id"},
                        value: this.ouId,
                        enableFilterSearch: true,
                        change: (args) => {
                            this.ouId = args.value;
                        }
                    });
                    this.setOu(initOuId);

                }).catch(err => {
                    console.log(err);
                    this.toastHandler('error', 'Unable to get cost centers.');
                });
            }
        ,
            setOu(id)
            {
                this.ouId = id;
                let ouInfo = this.getOuDetails(id);
                if (ouInfo) {
                    this.ouId = ouInfo.id;
                    this.ouName = ouInfo.name;
                    $("#ouId").ejDropDownList({value: ouInfo.id});
                } else {
                    this.ouId = this.emptyGuid;
                    this.ouName = '';
                    $("#ouId").ejDropDownList({value: this.emptyGuid});
                }
            }
        ,

            getOuDetails(id)
            {

                return this.costCenterHierachyList.find(a => a.id === id);
            }
        ,
            getCurrencyDetails(id)
            {
                return this.currencyList.find(a => a.id === id);
            }
        ,
            formatDate(dateInput)
            {

                return moment(dateInput).format("YYYY-MM-DD");

            }
        ,
            getAutomaticPaymentInvoices()
            {
                // Filter invoices for the current supplier & invoice type
                const filteredInvoices = this.invoiceList.filter(invoice => {
                    return invoice.supplierId === this.supplierId &&
                        (!this.invoiceTypeId || invoice.currencyId === this.invoiceTypeId);
                });

                // guard: no invoices or no amount
                if (filteredInvoices.length === 0 || !this.amountToPay) {
                    this.filteredInvoices = [];
                    this.dataTable([]);
                    return;
                }

                // Get rate info
                const invoiceRate = parseFloat(this.invoiceRate) || 1;
                const buyRate = parseFloat(this.buyRate) || 1;

                // Convert payment into invoice currency
                let remainingAmount = parseFloat(this.amountToPay) * (buyRate / invoiceRate);

                let allocatedInvoices = [];

                // Sort by projectedPayDate for allocation order
                for (let invoice of filteredInvoices.sort((a, b) => new Date(a.projectedPayDate) - new Date(b.projectedPayDate))) {
                    if (remainingAmount <= 0) break;

                    let balance = parseFloat(invoice.balance) || 0;

                    // Allocate only up to invoice balance
                    let allocatedAmount = Math.min(balance, remainingAmount);

                    allocatedInvoices.push({
                        ...invoice,
                        allocatedAmount: parseFloat(allocatedAmount).toFixed(2),
                        remainingBalance: parseFloat(balance - allocatedAmount).toFixed(2)
                    });

                    // Reduce remaining amount in invoice currency
                    remainingAmount -= allocatedAmount;
                }

                // optional: handle leftover as credit memo
                this.outstandingCreditMemo = remainingAmount > 0 ? remainingAmount.toFixed(2) : '0.00';

                // Update view
                this.filteredInvoices = allocatedInvoices;
                this.dataTable(allocatedInvoices);
            }
        ,
            calculateOutstandingCreditMemo()
            {
                const selectedList = this.selectedInvoiceList.length > 0
                    ? this.selectedInvoiceList
                    : this.filteredInvoices;

                let amountToPay = parseFloat(this.amountToPay) || 0;

                // guard for empty list
                if (amountToPay > 0 && selectedList.length > 0) {

                    // pick invoice rate and payment buy rate
                    const invoiceRate = parseFloat(this.invoiceRate) || 1;
                    const buyRate = parseFloat(this.buyRate) || 1;

                    // convert payment amount into invoice currency
                    const convertedPayment = amountToPay * (buyRate / invoiceRate);

                    // sum all invoice balances (in invoice currency)
                    let totalBalance = selectedList.reduce((acc, invoice) => {
                        let balance = parseFloat(invoice.balance) || 0;
                        return acc + balance;
                    }, 0);
                    // compare using converted amount
                    if (convertedPayment > totalBalance) {
                        let creditMemo = (convertedPayment - totalBalance).toFixed(2);
                        this.outstandingCreditMemo = creditMemo;
                        /* this.toastHandler('warning', `You have an outstanding credit memo of ${creditMemo}`);*/
                    } else {
                        this.outstandingCreditMemo = 0;
                    }

                } else {
                    this.outstandingCreditMemo = 0;
                }
            }
        ,

            savePayment()
            {
                this.isLoading = true;
                this.getSelectedInvoices();
                this.calculateOutstandingCreditMemo();
                let payload = {};
                if (this.batchNumber === null || this.batchNumber === '') {
                    payload.batchNumber = '0';
                } else {
                    payload.batchNumber = this.batchNumber;
                }

                if (!this.invoiceTypeId) {
                    this.toastHandler('warning', 'Please select an invoice type.');
                    this.isLoading = false;
                    return;
                }
                if (this.amountToPay === 0) {
                    this.toastHandler('warning', 'Amount to pay cannot be zero.');
                    this.isLoading = false;
                    return;
                }
                if (this.currencyId) {
                    let currencyInfo = this.getCurrencyDetails(this.currencyId);
                    if (currencyInfo) {
                        payload.currencyId = currencyInfo.id;
                        payload.currencyName = currencyInfo.currencyName;
                        payload.currencyCode = currencyInfo.currencyCode;
                        payload.minorName = currencyInfo.minorName;
                        payload.buyRate = this.buyRate;
                        payload.sellRate = currencyInfo.sellRate;
                    }
                }
                if (this.invoiceTypeId) {
                    let invoiceTypeInfo = this.getCurrencyDetails(this.invoiceTypeId);
                    if (invoiceTypeInfo) {
                        payload.invoiceTypeId = invoiceTypeInfo.id;
                        payload.invoiceTypeName = invoiceTypeInfo.currencyName;
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
                if (this.ouId) {
                    let departmentInfo = this.getOuDetails(this.ouId);
                    if (departmentInfo) {
                        payload.ouId = departmentInfo.id;
                        payload.ouName = departmentInfo.name;
                    }
                }
                if (this.bankAccountId) {
                    let bankAccountInfo = this.accountsList.find(a => a.id === this.bankAccountId);
                    if (bankAccountInfo) {
                        payload.bankAccountId = bankAccountInfo.id;
                        payload.bankAccountName = `${bankAccountInfo.accountNo} - ${bankAccountInfo.accountName}`;
                        payload.bankAccountNumber = bankAccountInfo.accountNo;
                    } else {
                        payload.bankAccountId = this.emptyGuid;
                        payload.bankAccountName = 'Not Set';
                        payload.bankAccountNumber = 'Not Set';

                    }
                }
                if (this.selectedInvoiceList.length === 0) {
                    payload.invoiceList = this.filteredInvoices;
                } else {
                    payload.invoiceList = this.selectedInvoiceList;
                }
                payload.amountToPay = this.amountToPay;
                payload.paymentDate = this.paymentDate;
                payload.referenceNumber = this.referenceNumber;
                payload.isMultiCurrency = this.isMultiCurrency;
                payload.batchNumber = this.batchNumber;
                payload.outstandingCreditMemo = this.outstandingCreditMemo;
                payload.modeOfPayment = this.modeOfPayment;
                payload.chequeNumber = this.chequeNumber;
                payload.isPosted = this.isPosted;
                payload.isAutomatic = this.isAutomatic;
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
                payload.outstandingCreditMemo = this.outstandingCreditMemo;
                if (this.paymentId) {
                    payload.id = this.paymentId;
                    payload.tenantId = this.tenantId;
                    axios.post('/ApDataEntry/UpdatePayment', payload)
                        .then(response => {
                            this.getPayments();
                            this.setCurrentPayment();
                            this.toastHandler('', 'Invoice Payment updated.');
                            this.isLoading = false;
                        })
                        .catch(err => {
                            this.toastHandler('error', 'Unable to update invoice.');
                            this.isLoading = false;
                        });
                } else {
                    axios.post('/ApDataEntry/CreatePayment', payload)
                        .then(response => {
                            this.getPayments();
                            this.paymentId = response.data.id;
                            this.setCurrentPayment();
                            if (response.data.code === 200) {
                                this.toastHandler('', 'Invoice Payment Created.');
                                this.isLoading = false;
                                window.location.href = `/ApDataEntry/AllPayments`;
                            } else {
                                this.toastHandler('error', response.data.message);
                                this.isLoading = false;
                            }
                        })
                        .catch(err => {
                            this.toastHandler('error', 'Unable to save invoice.');
                        });
                }
            }
        ,
            delPayment(id)
            {
                axios.post('/ApDataEntry/DeletePayment?id=' + id)
                    .then(response => {

                        this.toastHandler('', 'Invoice Payment deleted.');
                        this.getPayments();
                    })
                    .catch(err => {
                        this.toastHandler('error', 'Unable to delete invoice.');
                    });
            }
        ,
            clearForm()
            {
                window.location.reload();
            }
        ,
            getPaymentDetails(id)
            {
                return this.paymentList.find(a => a.id === id);
            }
        ,
            async setCurrentPayment() {
                this.isSettingPayment = true;
                let paymentInfo = this.getPaymentDetails(this.paymentId);
                if (paymentInfo) {
                    this.supplierId = paymentInfo.supplierId;
                    this.supplierName = paymentInfo.supplierName;
                    this.accountNumber = paymentInfo.accountNumber;
                    this.paymentDate = paymentInfo.paymentDate;
                    this.balance = paymentInfo.balance;
                    this.purchaseOrderNumber = paymentInfo.purchaseOrderNumber;
                    this.currencyId = paymentInfo.currencyId;
                    this.totalInvoiceAmount = paymentInfo.totalInvoiceAmount;
                    this.amountToPay = paymentInfo.amountToPay;
                    this.referenceNumber = paymentInfo.referenceNumber;
                    this.description = paymentInfo.description;
                    this.isVatWithheld = paymentInfo.isVatWithheld;
                    this.currencyName = paymentInfo.currencyName;
                    this.currencyCode = paymentInfo.currencyCode;
                    this.buyRate = parseFloat(paymentInfo.buyRate).toFixed(4);
                    this.sellRate = parseFloat(paymentInfo.sellRate).toFixed(4);
                    this.ouId = paymentInfo.ouId;
                    this.ouName = paymentInfo.ouName;
                    this.debitAccountId = paymentInfo.debitAccountId;
                    this.date = paymentInfo.date;
                    this.address = paymentInfo.address;
                    this.voucherNumber = paymentInfo.voucherNumber;
                    this.batchNumber = paymentInfo.batchNumber;
                    this.discount = paymentInfo.discount;
                    this.debitAccountName = paymentInfo.debitAccountName;
                    this.chequeNumber = paymentInfo.chequeNumber;
                    this.bankAccountId = paymentInfo.bankAccountId;
                    this.bankAccountName = paymentInfo.bankAccountName;
                    this.bankAccountNumber = paymentInfo.bankAccountNumber;
                    this.isPosted = paymentInfo.isPosted;
                    this.cash = paymentInfo.cash;
                    this.cheque = paymentInfo.cheque;
                    if (this.chequeNumber && this.chequeNumber !== '') {
                        this.cheque = true
                        this.chequeNumber = paymentInfo.chequeNumber;
                    }
                    this.bankId = paymentInfo.bankId;
                    this.bankName = paymentInfo.bankName;
                    this.bankBranchId = paymentInfo.bankBranchId;
                    this.bankBranch = paymentInfo.bankBranch;
                    this.paymentId = paymentInfo.id;
                    this.modeOfPayment = paymentInfo.modeOfPayment;
                    this.isAutomatic = paymentInfo.isAutomatic;
                    if (this.isAutomatic) {
                        await this.ApplyPayment();
                    }
                    this.Automatic = paymentInfo.isAutomatic;
                    this.Manual = !paymentInfo.isAutomatic;
                    this.isMultiCurrency = paymentInfo.isMultiCurrency;
                    this.selectedInvoiceList = paymentInfo.invoiceList;
                    this.invoiceTypeId = paymentInfo.invoiceTypeId;
                    $("#currencyId").ejDropDownList({value: paymentInfo.currencyId});
                    this.outstandingCreditMemo = parseFloat(paymentInfo.outstandingCreditMemo).toFixed(2)
                    $("#paymentId").ejDropDownList({value: paymentInfo.id});
                    let dropdown = $("#bankAccountId").data("ejDropDownList");
                    if (dropdown) {
                        dropdown.option("value", paymentInfo.bankAccountId);
                    }
                    let ouDropdown = $("#ouId").data("ejDropDownList");
                    if (ouDropdown) {
                        ouDropdown.option("value", paymentInfo.ouId);
                    }
                    let bankDropdown = $("#bankId").data("ejDropDownList");
                    if (bankDropdown) {
                        bankDropdown.option("value", paymentInfo.bankId);
                    }
                    let branchDropdown = $("#branchId").data("ejDropDownList");
                    if (branchDropdown) {
                        branchDropdown.option("value", paymentInfo.bankBranchId);
                    }
                    this.bankAccountName = paymentInfo.bankAccountName;
                    let invoiceTypeDropdown = $("#invoiceTypeId").data("ejDropDownList");
                    if (invoiceTypeDropdown) {
                        invoiceTypeDropdown.option("value", paymentInfo.invoiceTypeId);
                    }
                    this.dataTable(paymentInfo.invoiceList);
                }
                this.$nextTick(() => {
                    this.isSettingPayment = false;
                });
            }
        ,
            setBuyRate()
            {
                if (this.currencyId) {
                    const currency = this.currencyList.find(a => a.id === this.currencyId);
                    this.buyRate = parseFloat(currency.buyRate).toFixed(4);
                }
            }
        ,
            getBanks()
            {

                axios.get('/SharedResource/GetBanks').then(response => {

                    this.bankList = response.data;

                    $("#bankId").ejDropDownList({
                        dataSource: response.data,
                        watermarkText: "Select Bank",
                        width: "100%",
                        fields: {id: "id", text: "name", value: "id"},
                        enableFilterSearch: true,
                        change: (args) => {

                            this.bankId = args.value;
                        }
                    });

                }).catch(err => {

                    this.toastHandler('error', 'Unable to retrieve banks.');

                });
            }
        ,
            getBankDetails(id)
            {

                return this.bankList.find(a => a.id === id);
            }
        ,
            getBankBranchDetails(id)
            {

                return this.bankBranchList.find(a => a.id === id);
            }
        ,
        printReport() {
            if (!this.paymentId) {
                this.toastHandler("warning", "No payment selected for printing.");
                return;
            }

            const paymentId = this.paymentId;
            const reportUrl = `/ApReports/PrintPaymentReceipt?id=${paymentId}`;

            const printWindow = window.open("", "_blank");
            printWindow.document.write(`
        <html>
        <head>
            <title>Loading Report...</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #fff;
                    font-family: Arial, sans-serif;
                }
                .loader {
                    border: 10px solid #f3f3f3;
                    border-top: 10px solid #15aafa;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="loader"></div>
        </body>
        </html>
    `);
            printWindow.document.close();

            // 🔹 After short delay, redirect to actual report URL
            setTimeout(() => {
                printWindow.location.href = reportUrl;
            }, 800);
        },
            toastHandler(type, message = 'An unexpected error occurred.')
            {
                toastr.options = {
                    closeButton: true,
                    progressBar: true,
                    showMethod: 'fadeIn',
                    hideMethod: 'fadeOut',
                    timeOut: 10000,
                };

                switch (type) {

                    case 'warning':
                        toastr.warning('', message);
                        break;
                    case 'error':
                        toastr.error('', message);
                        break;
                    default:
                        toastr.success('', message);
                        break;
                }

            }
        ,
            resetBankFields()
            {
                this.bankId = '';
                this.bankName = '';
                this.bankBranchId = '';
                this.bankBranchName = '';
                $("#bankId").ejDropDownList("option", "value", null);
                $("#bankBranchId").ejDropDownList("option", "value", null);
            }
        ,
        },
    watch: {
        supplierId(val) {
            if (val) {
                this.setCurrentSupplier();
                this.updateFilteredInvoices();
                this.getGridData(val);
            }
        },
        currencyId(val) {
            if (val) {
                this.setBuyRate();
                this.isMultiCurrency = val !== this.defaultCurrency.id;
            }
            this.changeBankAccount(val);
            if (this.isAutomatic) {
                this.getAutomaticPaymentInvoices();
                this.calculateAndDisplayAppliedAmounts();
            }
        },
        invoiceTypeId(val) {
            if (!val) return;
            this.isMultiCurrency = val !== this.defaultCurrency?.id;
            //set invoiceRate as the buyRate for the invoiceType
            let currencyInfo = this.getCurrencyDetails(val);
            if (currencyInfo) {
                this.invoiceRate = parseFloat(currencyInfo.buyRate).toFixed(4);
            }
            if (this.isAutomatic) {
                this.calculateAndDisplayAppliedAmounts();
            }
        },
        amountToPay(val) {
            if (this.isAutomatic) {
                this.getAutomaticPaymentInvoices();
                this.calculateAndDisplayAppliedAmounts();
            }
        },
        
        Manual(val) {
            this.isAutomatic = !val;
            this.Automatic = !val;
            this.updateFilteredInvoices();
        },
        isAutomatic(val) {
            this.Automatic = val;
            this.Manual = !val;
            this.updateFilteredInvoices();
            if (val) this.getAutomaticPaymentInvoices();
            if (val) this.calculateAndDisplayAppliedAmounts();
        },
        invoiceId(val) {

            if (val) {
                this.setCurrentInvoice();
                
            }
        },
        paymentId(val) {
            if (val) {
                    this.setCurrentPayment();
              
            }
        },
        bankAccountId(newVal) {
            if (!newVal) {
                this.bankName = '';
                this.bankBranchName = '';
                this.bankId = '';
                this.bankBranchId = '';
                return;
            }
            const selectedAccount = this.accountsList.find(
                acc => acc.id === newVal
            );

            
            const bankAccount = this.bankAccountList.find(
                ba => ba.accountId === selectedAccount.id
            );
            

            const bank = this.bankList.find(
                b => b.name.toLowerCase() === bankAccount.bankName.toLowerCase()
            );


            this.bankId = bank.id;
            this.bankName = bank.name;

            $("#bankId").ejDropDownList("option", "value", bank.id);

            const branch = bank.bankBranches.find(
                br => br.id === bankAccount.bankBranchId
            );

            this.bankBranchId = branch.id;
            this.bankBranchName = branch.name;

            $("#bankBranchId").ejDropDownList("option", "value", branch.id);
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
    async mounted() {
        await this.initPayment();
        this.getBusinessProfile();
        this.getSuppliers();
        await this.getBankAccounts();
        await this.getCurrency();
        this.getCostCenters();
        this.getPayments();
        this.getBanks();
        this.getDefaultGlSetup();
    }
});

app.mount('#app');