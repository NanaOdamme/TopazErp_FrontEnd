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
            invoiceDate: moment().format("YYYY-MM-DD"),
            projectedPayDate: moment().add(1, 'months').format("YYYY-MM-DD"),
            balance: 0,
            purchaseOrderNumber: '',
            currencyList: [],
            currencyId: '',
            totalInvoiceAmount: 0,
            amount: '0',
            referenceNumber: '',
            description: '',
            isVatWithheld: false,
            unitPrice: '0',
            quantity: '1',
            subTotal: ' 0',
            paidAmount: '0',
            vatAmount: '0',
            minorName: '',
            ouId: '',
            ouList: [],
            ouName: '',
            departmentHierachyList: [],
            costCenterHierachyList: [],
            costCenterList: [],
            ouNameList: [],
            debitAccountList: [],
            debitAccountId: '',
            date: moment().format("YYYY-MM-DD"),
            address: '',
            buyRate: '',
            voucherNumber: '',
            batchNumber: '',
            discountAsPercentage: false,
            discount: '0',
            departments: [],
            debitAccountName: '',
            invoiceDetailId: '',
            taxLevyList: [],
            vatId: '',
            vatName: 'None',
            vat: [],
            otherTaxLevyList: [],
            vatRate: '0',
            vatIsApplied: false,
            invoiceEdithList: [],
            invoiceBalance: '0',
            invoiceNumber: '0',
            detailsId: '',
            isOu: false,
            selectedInvoiceList: [],
            reportType: 'summary-report',
            reportApiBaseUrl: '',
            reportPath: '',
            isCanceled: false,
            canPrint: false,
            computedTaxLevies: [],
            accountsList: [],
            liabilityAccountId: this.emptyGuid,
            liabilityAccountName: '',
            isApproved: false,
            withHeldAmount: 0,
            isMultiCurrency: false,
            isVatInclusive: false,
        }
    },
    methods:{
        getBusinessProfile() {
            axios.get('/SharedResource/GetBusinessProfile').then(response => {
                if (response.data) {
                    this.isVatInclusive = response.data.isTaxLeviesInclusive;
                    this.isOu = response.data.enforceOu;
                    console.log(this.isVatInclusive);
                }
            }).catch(err => {
                console.log(err);
            });
        },
        getDefaultGlSetup() {

            axios.get('/LedgerSetups/GetDefaultGlSetup').then(response => {

                let responseData = response.data
                this.debitAccountId = responseData.accountsPayableAccountId;
                this.vatGl = responseData.vatPaidAccountId;
                this.covidGl = responseData.covidTaxPaidAccountId;
                this.nhilGl = responseData.nhilPaidAccountId;
                this.getflGl = responseData.getflPaidAccountId;
                this.cstGl = responseData.vatPaidAccountId;

                if (responseData) {

                    this.id = responseData.id;

                    $("#liabilityAccountId").ejDropDownList({

                        value: responseData.accountsPayableAccountId,

                    });


                }
                $("#invoiceDate").ejDatePicker({
                    width: "100%",
                    dateFormat: "yyyy-MM-dd",
                    value: moment().format("YYYY-MM-DD"),
                    change: (args) => {
                        this.invoiceDate = args.value;
                        this.projectedPayDate = moment(args.value).add(1, 'months').format("YYYY-MM-DD");

                        let projectedPicker = $("#projectedPayDate").data("ejDatePicker");
                        if (projectedPicker) {
                            projectedPicker.option("value", moment(args.value).add(1, 'months').toDate());
                        }
                    }
                });

                $("#projectedPayDate").ejDatePicker({
                    width: "100%",
                    dateFormat: "yyyy-MM-dd",
                    value: moment().add(1, 'months').format("YYYY-MM-DD"),
                    change: (args) => {
                        this.projectedPayDate = args.value;
                    }
                });


            }).catch(err => {

                console.log(err);

                this.toastHandler('error', 'Unable to get default GL numbers.');

            });
        },
        getTaxLevies() {
            axios.get('/SharedResource/GetTaxLevies').then(response => {
                this.taxLevyList = response.data;

                if (this.taxLevyList.length > 0) {
                    let vat = this.taxLevyList.find(tax => tax.type === 'vat');
                    this.vatRate = parseFloat(vat.rate).toFixed(2);
                    this.vatList = this.taxLevyList.filter(tax => tax.type === 'vat');
                }


            }).catch(err => {
                this.toastHandler('error', 'Unable to get tax levies.');
            });
        },

        toggleTaxLevy(taxId) {
            const selectedTax = this.taxLevyList.find(t => t.id === taxId);
            if (!selectedTax) return;

            const isCST = selectedTax.name === 'CST' && selectedTax.type.toLowerCase() === 'others';
            const isVAT = selectedTax.name === 'VAT' && selectedTax.type.toLowerCase() === 'vat';

            // Update isApplied state
            this.taxLevyList = this.taxLevyList.map(tax => {
                if (isCST || isVAT) {
                    const isOther = (tax.name === 'CST' && tax.type.toLowerCase() === 'others') ||
                        (tax.name === 'VAT' && tax.type.toLowerCase() === 'vat');

                    if (isOther) {
                        const newAppliedState = tax.id === taxId ? !selectedTax.isApplied : false;

                        // If this tax is being turned OFF, remove it from table
                        if (!newAppliedState) {
                            this.detailsList = this.detailsList.filter(
                                detail => detail.description !== tax.name
                            );
                        }

                        return { ...tax, isApplied: newAppliedState };
                    }
                }
                return tax.id === taxId
                    ? { ...tax, isApplied: !tax.isApplied }
                    : tax;
            });
            let debitAccountId = this.emptyGuid;
            let debitAccountName = '';

            switch (selectedTax.name.toUpperCase()) {
                case "VAT":
                    debitAccountId = this.vatGl;
                    break;
                case "NHIL":
                    debitAccountId = this.nhilGl;
                    break;
                case "GETFL":
                    debitAccountId = this.getflGl;
                    break;
                case "COVID":
                    debitAccountId = this.covidGl;
                    break;
                case "CST":
                    debitAccountId = this.cstGl;
                    break;
            }

            const selectedAccount = this.accountsList.find(a => a.id === debitAccountId);
            if (selectedAccount) {
                debitAccountName = selectedAccount.accountIdentifier;
            }

            const commonRefNo = this.detailsList.length > 0
                ? this.detailsList[0].referenceNumber
                : `REF-${Date.now()}`;

            if (!selectedTax.isApplied) {
                // Calculate total before tax (excluding tax rows)
                const taxNames = ["VAT", "NHIL", "GETFL", "COVID", "CST"];
                const totalBeforeTax = this.detailsList
                    .filter(d => !taxNames.includes(d.description))
                    .reduce((sum, d) => sum + parseFloat(d.subTotal || 0), 0);

                let taxAmount = 0;
                /* if (isVAT) {
                     const otherTaxLevies = this.taxLevyList.filter(t => t.isApplied && t.type !== 'vat');
                     const sumOtherTaxAmounts = otherTaxLevies.reduce((sum, t) => {
                         return sum + ((t.rate / 100) * totalBeforeTax);
                     }, 0);
                     taxAmount = (this.vatRate / 100) * (totalBeforeTax + sumOtherTaxAmounts);
                 }
                 else {
                     taxAmount = (selectedTax.rate / 100) * totalBeforeTax;
                 }*/
                taxAmount = (selectedTax.rate / 100) * totalBeforeTax;
                const taxDetail = {
                    id: this.uuid(),
                    referenceNumber: commonRefNo,
                    description: selectedTax.name, // only name
                    debitAccountId: debitAccountId,
                    debitAccountName: debitAccountName,
                    quantity: 1,
                    unitPrice: taxAmount.toFixed(2),
                    discount: 0,
                    amount: 0,
                    subTotal: taxAmount.toFixed(2)
                };

                this.detailsList.push(taxDetail);
                console.log(taxDetail);
            } else {
                // Remove tax row by name
                this.detailsList = this.detailsList.filter(
                    detail => detail.description !== selectedTax.name
                );
            }

            // Ensure VAT is always last
            const vatIndex = this.detailsList.findIndex(d => d.description === "VAT");
            if (vatIndex >= 0 && vatIndex !== this.detailsList.length - 1) {
                const [vatRow] = this.detailsList.splice(vatIndex, 1);
                this.detailsList.push(vatRow);
            }

            this.Table();
            this.computeTotalTaxAmount();
        },

        computeTotalTaxAmount() {
            this.computedTaxLevies = [];
            let hasAppliedTax = this.taxLevyList.some(tax => tax.isApplied);

            const taxNames = ["VAT", "NHIL", "GETFL", "COVID", "CST"];

            // Total excluding tax rows
            const totalBeforeTaxRows = this.detailsList
                .filter(d => !taxNames.includes(d.description))
                .reduce((acc, detail) => acc + parseFloat(detail.subTotal), 0);

            if (hasAppliedTax && this.isVatInclusive === false) {
                let otherTaxLevies = this.taxLevyList.filter(tax => tax.isApplied && tax.type !== 'vat');
                let taxLevies = this.taxLevyList.filter(tax => tax.isApplied);

                // calculate taxes
                taxLevies.forEach(v => {
                    const taxAmount = (v.rate * totalBeforeTaxRows) / 100;
                    this.computedTaxLevies.push({
                        name: v.name,
                        rate: v.rate,
                        isApplied: true,
                        amount: taxAmount
                    });

                    // Update tax rows in detailsList
                    let taxDetail = this.detailsList.find(d => d.description === v.name);
                    if (taxDetail) {
                        taxDetail.unitPrice = taxAmount.toFixed(2);
                        taxDetail.subTotal = taxAmount.toFixed(2);
                    }
                });

                // If VAT is applied
                let vat = this.taxLevyList.find(tax => tax.isApplied && tax.type === 'vat');
                if (vat) {
                    // prefer the user-updated this.vatRate if present, otherwise use vat.rate
                    const vatRate = parseFloat(this.vatRate) || parseFloat(vat.rate) || 0;

                    this.vatAmount = (totalBeforeTaxRows * vatRate) / 100;

                    let vatDetail = this.detailsList.find(d => d.description === vat.name);
                    if (vatDetail) {
                        vatDetail.unitPrice = this.vatAmount.toFixed(2);
                        vatDetail.subTotal = this.vatAmount.toFixed(2);
                    }
                }
                // ✅ Total = sum of subtotals
                this.totalInvoiceAmount = this.detailsList.reduce(
                    (acc, detail) => acc + parseFloat(detail.subTotal), 0
                ).toFixed(2);

            }else {
                // No taxes applied
                this.computedTaxLevies = [];
                this.vatAmount = 0;
                this.totalInvoiceAmount = this.detailsList.reduce(
                    (acc, detail) => acc + parseFloat(detail.subTotal), 0
                ).toFixed(2);
            }
        },

        initApInvoice() {
            axios.get('/LedgerDataEntry/InitJournalEntry')
                .then(response => {
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
                    this.debitAccountList = accounts;

                    // Set up liability account dropdown
                    $('#liabilityAccountId').ejDropDownList({
                        dataSource: accounts,
                        width: "100%",
                        watermarkText: "Select Account",
                        fields: { id: "id", text: "accountIdentifier", value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            // Use emptyGuid if no account is selected
                            this.liabilityAccountId = args.value || this.emptyGuid;
                        }
                    });
                })
                .catch(err => {
                    this.toastHandler('error', 'Voucher initialization failed.');
                });
        },
        toggleOu(){
            this.isOu = !this.isOu;
            //   this.getCostCenters();
        },
        getPostedInvoices() {
            return axios.get('/ApDataEntry/GetInvoices').then(response =>
            {
                this.invoiceList = response.data
                    .filter(a => a.isPosted === true && a.isCanceled === false && a.totalInvoiceAmount === a.balance)
                    .sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
                this.invoiceList.forEach((invoice) =>
                {
                    invoice.invoiceId = invoice.id;
                    invoice.totalInvoiceAmount = parseFloat(invoice.totalInvoiceAmount).toFixed(2);
                    invoice.balance = parseFloat(invoice.balance).toFixed(2);
                    invoice.amountToPay = parseFloat(invoice.amountToPay).toFixed(2);
                    invoice.displayText = `${invoice.supplierName} - ${invoice.invoiceNumber}`;

                });
                $("#invoiceId").ejDropDownList({
                    dataSource: this.invoiceList,
                    watermarkText: "Select Invoice Number",
                    width: "100%",
                    fields: { id: "id", text: "displayText", value: "id" },
                    enableFilterSearch: true,
                    change: (args) => {
                        this.invoiceId = args.value;
                    }
                });
                return this.invoiceList;
            })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get invoices.');
                    throw err;
                });
        },
        getInvoicesdetails(id) {
            return this.invoiceList.find(a => a.id === id);
        },
        Table() {
            $("#dataTable2").ejGrid({
                dataSource: this.detailsList,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                pageSettings: { pageSize: 10 },
                editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true, showDeleteConfirmDialog: true, showConfirmDialog: true},
                toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Add, ej.Grid.ToolBarItems.Edit, ej.Grid.ToolBarItems.Delete, ej.Grid.ToolBarItems.Update, ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                columns: [
                    { field: "id", headerText: 'Id', visible: false, isPrimaryKey: true, width: 80 },
                    { field: "referenceNumber", headerText: 'Ref No', textAlign: ej.TextAlign.Left, width: 60 },
                    { field: "description", headerText: "Description", width: 80, validationRules: { required: true, }  },
                    {
                        field: "debitAccountId",
                        headerText: "Debit G/L Account",
                        width: 80,
                        editType: ej.Grid.EditingType.DropDown,
                        foreignKeyField: "id",
                        foreignKeyValue: "accountIdentifier",
                        dataSource: this.debitAccountList,
                        editParams: {
                            dataSource: this.debitAccountList,
                            fields: { text: "accountIdentifier", value: "id" }
                        },
                        validationRules: { required: false }
                    },
                    { field: "quantity", headerText: "Quantity", width: 65, defaultValue: 0, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 }, validationRules: { required: true, min: 0, max: 100000 } },
                    { field: "unitPrice", headerText: "Unit Price", width: 65, defaultValue: 0, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 }, format: "{0:n2}", validationRules: { required: true, min: 0, max: 100000 }},
                    { field: "discount", headerText: "Disc. %", width: 65, defaultValue: 0, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 }, format: "{0:n2}"},
                    { field: "amount", headerText: "Disc. Amt.", width: 65, defaultValue: 0, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 }, format: "{0:n2}", allowEditing: false},
                    { field: "subTotal", headerText: "Sub Total", width: 65, defaultValue: 0, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 }, format: "{0:n2}", allowEditing: false},
                ],
                actionBegin: (args) => {
                    if (args.requestType === "add") {

                        args.data = args.data || {};
                        args.data.debitAccountId = this.debitAccountId;
                        if (this.detailsList.length > 0) {

                            args.data.referenceNumber = this.detailsList[0].referenceNumber;
                        } else {

                            args.data.referenceNumber = "";
                        }
                        const selectedAccount = this.debitAccountList.find(a => a.id === this.debitAccountId);
                        if (selectedAccount) {
                            args.data.debitAccountName = selectedAccount.accountIdentifier;
                        }
                    }

                },
                endAdd: (args) => {

                    if (!args.data.debitAccountId || args.data.debitAccountId === this.emptyGuid) {
                        args.data.debitAccountId = this.debitAccountId;
                    }
                    const selectedAccount = this.debitAccountList.find(a => a.id === args.data.debitAccountId);
                    if (selectedAccount) {
                        args.data.debitAccountName = selectedAccount.accountIdentifier;
                    } else {
                        args.data.debitAccountName = "unknown";
                    }
                    this.addInvoiceDetail(args.data);
                },
                endEdit: (args) => {
                    args.data.debitAccountId = args.data.debitAccountId || this.emptyGuid;
                    const selectedAccount = this.debitAccountList.find(a => a.id === args.data.debitAccountId);
                    if (selectedAccount) {
                        args.data.debitAccountName = selectedAccount.accountIdentifier;
                    } else {
                        args.data.debitAccountName = "unknown";
                    }
                    this.updateInvoiceDetail(args.data);
                },
                endDelete: (args) => {

                    this.deleteInvoiceDetail(args.data);
                },
            });
        },
        setTable(invoiceId) {
            let invoice = this.invoiceList.find(a => a.id === invoiceId);
            if (invoice)
            {
                this.Table([invoice]);
            }else
            {
                this.Table([]);
            }
        },
        getInvoiceDetails(id) {
            return this.detailsList.find(a => a.id === id);
        },
        getSuppliers() {
            axios.get('/SharedResource/GetSuppliers').then(response =>
            {
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
            }).catch(err =>
            {
                this.toastHandler('error', 'Unable to get suppliers.');
            });
        },
        getSupplierDetails(id) {
            return this.supplierList.find(a => a.id === id);
        },
        setCurrentSupplier() {
            let supplierInfo = this.getSupplierDetails(this.supplierId);
            if (supplierInfo)
            {
                this.accountNumber = supplierInfo.accountNumber;
                this.balance = supplierInfo.balance;
                this.name = supplierInfo.name;
                this.supplierId = supplierInfo.id;
                this.address = supplierInfo.address;
                this.tenantId = supplierInfo.tenantId;
                $("#supplierId").ejDropDownList({value: supplierInfo.id});
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
                this.setOu(initOuId);

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
        formatDate(dateInput) {
            return moment(dateInput).format("YYYY-MM-DD");
        },
        setCurrentInvoice() {
            let invoiceInfo = this.getInvoicesdetails(this.invoiceId);
            if (invoiceInfo) {
                this.taxLevyList = this.taxLevyList.map(tax => ({ ...tax, isApplied: false }));
                this.minorName = invoiceInfo.minorName;
                this.invoiceId = invoiceInfo.id;
                this.invoiceNumber = invoiceInfo.invoiceNumber;
                this.invoiceDate = this.formatDate(invoiceInfo.invoiceDate);
                this.projectedPayDate = this.formatDate(invoiceInfo.projectedPayDate);
                this.invoiceBalance = invoiceInfo.balance;
                this.purchaseOrderNumber = invoiceInfo.purchaseOrderNumber;
                this.voucherNumber = invoiceInfo.voucherNumber;
                this.totalInvoiceAmount = invoiceInfo.totalInvoiceAmount;
                this.amount = invoiceInfo.amount;
                this.referenceNumber = invoiceInfo.referenceNumber;
                this.description = invoiceInfo.description;
                this.batchNumber = invoiceInfo.batchNumber;
                this.currencyId = invoiceInfo.currencyId;
                this.supplierId = invoiceInfo.supplierId;
                this.vatRate = parseFloat(invoiceInfo.vatRate).toFixed(2);
                this.tenantId = invoiceInfo.tenantId;
                this.ouId = invoiceInfo.ouId;
                this.paidAmount = invoiceInfo.paidAmount;
                this.isApproved = invoiceInfo.isApproved;
                this.detailsList = invoiceInfo.invoiceDetails;
                this.buyRate = parseFloat(invoiceInfo.buyRate).toFixed(4);
                this.isMultiCurrency = invoiceInfo.isMultiCurrency;
                $("#invoiceId").ejDropDownList({value: invoiceInfo.id});
                $("#currencyId").ejDropDownList({value: invoiceInfo.currencyId});
                let dropdown = $("#liabilityAccountId").data("ejDropDownList");
                if (dropdown) {
                    dropdown.option("value", invoiceInfo.liabilityAccountId);
                }
                this.liabilityAccountName = invoiceInfo.liabilityAccountName;

                //toggle the tax levies that are in invoiceTaxLevies
                if (invoiceInfo.invoiceTaxLevies.length > 0)
                {
                    invoiceInfo.invoiceTaxLevies.forEach(v => {
                        this.taxLevyList = this.taxLevyList.map(tax => tax.name === v.name ? { ...tax, isApplied: true } : tax);
                    });
                }
            }
        },
        resetModal() {

            this.modalTitle = 'Confirm Action';
            this.name = '';
            this.displayName = '';

        },
        computeSubTotal(quantity, unitPrice, amount) {

            let parsedQuantity = parseFloat(quantity) || 0;
            let parsedUnitPrice = parseFloat(unitPrice) || 0;
            let parsedAmount =parseFloat(amount) || 0;

            return ((parsedQuantity * parsedUnitPrice) - parsedAmount).toFixed(2);

        },
        addInvoiceDetail(payload) {
            payload.id = this.uuid();

            if (payload.unitPrice && payload.quantity && payload.discount === 0){
                payload.unitPrice = parseFloat(payload.unitPrice).toFixed(2);
                payload.discount = parseFloat(payload.discount).toFixed(2);
                payload.subTotal = parseFloat(payload.unitPrice * payload.quantity).toFixed(2);
                payload.amount = 0;


            }
            else if (payload.unitPrice && payload.quantity && payload.discount > 0) {
                payload.discountAsPercentage = true;
                payload.unitPrice = parseFloat(payload.unitPrice).toFixed(2);
                payload.discount = parseFloat(payload.discount).toFixed(2);
                payload.subTotal = parseFloat(payload.unitPrice * payload.quantity).toFixed(2);
                payload.amount = (payload.discount * payload.subTotal) / 100;
                payload.subTotal = parseFloat(payload.subTotal - payload.amount).toFixed(2);
            }

            payload.subTotal = this.computeSubTotal(payload.quantity, payload.unitPrice, payload.amount);

            const taxDescriptions = ["VAT", "NHIL", "GETFL", "COVID", "CST"];

            // Find the first tax row index
            const taxStartIndex = this.detailsList.findIndex(
                d => taxDescriptions.some(tax => d.description?.toUpperCase().startsWith(tax))
            );

            if (taxStartIndex !== -1) {
                // Insert before the first tax levy
                this.detailsList.splice(taxStartIndex, 0, payload);
            } else {
                // No taxes yet → push to end
                this.detailsList.push(payload);
            }

            this.Table();
            this.computeTotalTaxAmount();
        },
        updateInvoiceDetail(payload) {
            payload.invoiceId = this.invoiceId;
            payload.id = this.detailsId || payload.id;
            let existingDetail = this.detailsList.findIndex(d => d.id === payload.id);

            if (existingDetail !== -1) {
                payload.unitPrice = parseFloat(payload.unitPrice) || 0;
                payload.quantity = parseFloat(payload.quantity) || 0;
                payload.discount = parseFloat(payload.discount) || 0;
                payload.unitPrice = payload.unitPrice.toFixed(2);
                payload.discount = payload.discount.toFixed(2);

                let subTotalBeforeDiscount = parseFloat(payload.unitPrice * payload.quantity).toFixed(2);
                if (payload.discount > 0) {
                    payload.discountAsPercentage = true;
                    payload.amount = (payload.discount * subTotalBeforeDiscount) / 100;
                    payload.subTotal = (subTotalBeforeDiscount - payload.amount).toFixed(2);
                } else {
                    payload.amount = 0;
                    payload.subTotal = subTotalBeforeDiscount;
                }

                payload.subTotal = this.computeSubTotal(payload.quantity, payload.unitPrice, payload.amount);
                const taxDescriptions = ["VAT", "NHIL", "GETFL", "COVID", "CST"];

                // Remove existing detail
                this.detailsList.splice(existingDetail, 1);
                const taxStartIndex = this.detailsList.findIndex(
                    d => taxDescriptions.some(tax => d.description?.toUpperCase().startsWith(tax))
                );

                if (taxStartIndex !== -1) {
                    // Insert before the first tax levy
                    this.detailsList.splice(taxStartIndex, 0, payload);
                } else {
                    // No taxes yet → push to end
                    this.detailsList.push(payload);
                }
            }

            this.Table();
            this.computeTotalTaxAmount();
        },
        deleteInvoiceDetail(payload) {
            this.detailsList = this.detailsList.filter(detail => detail.id !== payload.id);

            this.computeTotalTaxAmount();
        },
        uuid() {
            return([1e7]+ -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        },
        clearForm() {
            window.location.reload();
        },
        editPostedInvoice() {
            this.isLoading = true;
            let hasZeroQuantity = this.detailsList.some(detail => !detail.quantity && detail.quantity !== null);
            if (hasZeroQuantity) {
                this.toastHandler('warning', 'One or more items have quantity 0. Please correct before saving.');
                this.isLoading = false;
                return;
            }

            let hasZeroUnitPrice = this.detailsList.some(detail => !detail.unitPrice && detail.unitPrice !== null);
            if (hasZeroUnitPrice) {
                this.toastHandler('warning', 'One or more items have unit price 0. Please correct before saving.');
                this.isLoading = false;
                return;
            }

            let noDescription = this.detailsList.some(detail => !detail.description || detail.description.trim() === '');
            if (noDescription) {
                this.toastHandler('warning', 'One or more items have no description. Please correct before saving.');
                this.isLoading = false;
                return;
            }

            let payload = {};
            if (this.invoiceNumber === null || this.invoiceNumber === '')
            {
                payload.invoiceNumber = '0';
            }
            if (this.batchNumber === null || this.batchNumber === '')
            {
                payload.batchNumber = '0';
            }
            payload.invoiceNumber = this.invoiceNumber;
            payload.invoiceDate = this.invoiceDate;
            payload.projectedPayDate = this.projectedPayDate;
            payload.balance = this.totalInvoiceAmount;
            payload.purchaseOrderNumber = this.purchaseOrderNumber;
            payload.voucherNumber = this.voucherNumber;
            payload.totalInvoiceAmount = this.totalInvoiceAmount;
            payload.batchNumber = this.batchNumber;
            payload.newVatRate = this.newVatRate;
            payload.paidAmount = this.paidAmount;
            payload.isApproved = this.isApproved;
            payload.invoiceTaxLevies = this.computedTaxLevies;
            if (this.currencyId) {
                let currencyInfo = this.getCurrencyDetails(this.currencyId);
                if (currencyInfo)
                {
                    payload.currencyId = currencyInfo.id;
                    payload.currencyName = currencyInfo.currencyName;
                    payload.currencyCode = currencyInfo.currencyCode;
                    payload.minorName = currencyInfo.minorName;
                    payload.buyRate = this.buyRate;
                    payload.sellRate = currencyInfo.sellRate;
                }
            }
            if (this.ouId && this.isOu) {
                let ouInfo = this.getOuDetails(this.ouId);
                if (ouInfo)
                {
                    payload.ouId = ouInfo.id;
                    payload.ouName = ouInfo.name;
                }
            }
            else
            {
                payload.ouId = this.emptyGuid;
                payload.ouName = '';
            }
            if (this.supplierId) {
                let supplierInfo = this.getSupplierDetails(this.supplierId);
                if (supplierInfo)
                {
                    payload.supplierId = supplierInfo.id;
                    payload.supplierName = supplierInfo.name;
                    payload.accountNumber = supplierInfo.accountNumber;
                    if (supplierInfo.creditLimit > 0 && this.totalInvoiceAmount > supplierInfo.creditLimit) {
                        this.toastHandler('warning', `Total invoice amount exceeds the credit limit of ${supplierInfo.creditLimit}. Please adjust.`);
                        this.isLoading = false;
                        return;
                    }
                }
            }
            if (this.liabilityAccountId){
                let accountInfo = this.accountsList.find(a => a.id === this.liabilityAccountId);
                if (accountInfo) {
                    payload.liabilityAccountId = accountInfo.id;
                    payload.liabilityAccountName = accountInfo.accountIdentifier;
                } else {
                    payload.liabilityAccountId = this.emptyGuid;
                    payload.liabilityAccountName = 'Not Set';
                }
            }
            payload.vatRate = this.vatRate;
            payload.vatAmount = this.vatAmount;
            payload.withHeldAmount = this.withHeldAmount;
            payload.invoiceDetails = this.detailsList;
            payload.isMultiCurrency = this.isMultiCurrency;


            const isUpdating = !!this.invoiceId;
            if (isUpdating)
            {
                payload.id = this.invoiceId;
                payload.tenantId = this.tenantId;
                axios.post('/ApDataEntry/EditPostedInvoices', payload)
                    .then(async response => {
                        this.invoiceId = payload.id;
                        this.toastHandler('', 'Invoice updated.');
                        await this.getPostedInvoices();
                        this.setCurrentInvoice();
                        this.setTable(this.invoiceId);
                        this.isLoading = false;
                        $('#addEdit').modal('hide');
                    })
                    .catch(err => {
                        this.toastHandler('error', 'Unable to update invoice.');
                        this.isLoading = false;
                        $('#addEdit').modal('hide');
                    });

            }
        },
        printReport() {
            this.isLoading = true;
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
                    font-family: Arial, sans-serif;
                }
                .loader {
                    border: 10px solid #f3f3f3;
                    border-top: 10px solid #3498db;
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
            printWindow.document.close(); // finish writing

            let url = `/ApReports/GetInvoiceInPdf?id=${this.invoiceId}`;
            axios.get(url, { responseType: 'blob' })
                .then(response => {
                    if (!response.data) {
                        this.toastHandler("warning", "No Data is selected for printing.");
                        printWindow.close();
                        this.isLoading = false;
                        return;
                    }

                    const blob = new Blob([response.data], { type: "application/pdf" });
                    const blobUrl = URL.createObjectURL(blob);

                    // Replace content with the PDF once it's loaded
                    printWindow.location.href = blobUrl;
                    this.isLoading = false;
                })
                .catch(err => {
                    this.toastHandler("error", "Unable to load the invoice. Please try again.");
                    printWindow.close();
                    this.isLoading = false;
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
            if (val)
            {
                this.setTable(this.invoiceId);
                this.setCurrentSupplier();
            }
        },
        invoiceId(val) {
            if (val)
            {
                this.setCurrentInvoice();
                this.setTable(val);
                let invoiceInfo = this.getInvoicesdetails(val);
                if (invoiceInfo)
                {
                    this.invoiceNumber = invoiceInfo.invoiceNumber;
                }
            }
        },
        
        currencyId(val) {
            let currencyInfo = this.getCurrencyDetails(val)
            this.buyRate = parseFloat(currencyInfo.buyRate).toFixed(4);
            this.isMultiCurrency = val !== this.defaultCurrency.id;
        },
        vatRate(val) {
            const parsed = parseFloat(val) || 0;

            // update VAT rate in taxLevyList
            this.taxLevyList = this.taxLevyList.map(tax =>
                tax.type === 'vat' ? { ...tax, rate: parsed } : tax
            );

            const vatTax = this.taxLevyList.find(t => t.type === 'vat');
            const taxNames = ["VAT", "NHIL", "GETFL", "COVID", "CST"];

            if (vatTax && vatTax.isApplied) {
                // total of non-tax rows
                const totalBeforeTaxRows = this.detailsList
                    .filter(d => !taxNames.includes((d.description || '').toUpperCase()))
                    .reduce((acc, detail) => acc + parseFloat(detail.subTotal || 0), 0);

                // recompute other applied taxes amounts (non-VAT)
                let otherTaxAmount = this.taxLevyList
                    .filter(t => t.isApplied && t.type !== 'vat')
                    .reduce((sum, t) => {
                        return sum + ((parseFloat(t.rate || 0) * totalBeforeTaxRows) / 100);
                    }, 0);

                const baseForVat = totalBeforeTaxRows + otherTaxAmount;
                const newVatAmount = (baseForVat * parsed) / 100;

                // update reactive VAT amount
                this.vatAmount = newVatAmount;

                // update computedTaxLevies entry for VAT
                const vatComputedIndex = this.computedTaxLevies.findIndex(c => c.name === vatTax.name);
                if (vatComputedIndex !== -1) {
                    // ensure reactivity when replacing object
                    if (typeof Vue !== 'undefined' && Vue.set) {
                        Vue.set(this.computedTaxLevies, vatComputedIndex, {
                            ...this.computedTaxLevies[vatComputedIndex],
                            rate: parsed,
                            amount: newVatAmount,
                            isApplied: true
                        });
                    } else {
                        this.computedTaxLevies[vatComputedIndex].rate = parsed;
                        this.computedTaxLevies[vatComputedIndex].amount = newVatAmount;
                        this.computedTaxLevies[vatComputedIndex].isApplied = true;
                    }
                } else {
                    this.computedTaxLevies.push({
                        name: vatTax.name,
                        rate: parsed,
                        amount: newVatAmount,
                        isApplied: true
                    });
                }

                // update VAT row in detailsList (if present)
                const vatDetail = this.detailsList.find(d => d.description === vatTax.name);
                if (vatDetail) {
                    vatDetail.unitPrice = newVatAmount.toFixed(2);
                    vatDetail.subTotal = newVatAmount.toFixed(2);
                } else {
                    // optional: insert VAT row if missing (keeps VAT as last)
                    const taxRow = {
                        id: this.uuid(),
                        referenceNumber: this.detailsList.length > 0 ? this.detailsList[0].referenceNumber : `REF-${Date.now()}`,
                        description: vatTax.name,
                        debitAccountId: this.vatGl || this.emptyGuid,
                        debitAccountName: this.accountsList.find(a => a.id === (this.vatGl || this.emptyGuid))?.accountIdentifier || '',
                        quantity: 1,
                        unitPrice: newVatAmount.toFixed(2),
                        discount: 0,
                        amount: 0,
                        subTotal: newVatAmount.toFixed(2)
                    };
                    this.detailsList.push(taxRow);
                }
            } else {
                // VAT not applied -> remove VAT row and computed levy
                this.vatAmount = 0;
                this.detailsList = this.detailsList.filter(d => d.description !== (vatTax ? vatTax.name : "VAT"));
                this.computedTaxLevies = this.computedTaxLevies.filter(c => c.name !== (vatTax ? vatTax.name : "VAT"));
            }

            // recompute totals and refresh grid so table shows updated values immediately
            this.computeTotalTaxAmount();
            this.Table();
        },
    },
    mounted() {
        this.getPostedInvoices()
        this.getBusinessProfile();
        this.getSuppliers();
        this.getCurrency();
        this.getCostCenters();
        this.initApInvoice();
        this.getDefaultGlSetup();
        this.getTaxLevies();
    }
});
app.mount('#app');