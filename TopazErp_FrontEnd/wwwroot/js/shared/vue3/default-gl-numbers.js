const app= Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,
            payload: {},
            ledgerAccountList: [],
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            id: '',
            tenantId: '',
            accountPayablesBankAccountId: '',
            payRollBankAccountId: '',
            accountsReceivableBankAccountId: '',
            salesBankAccountId: '',
            accountsReceivableAccountId: '',
            accountsPayableAccountId: '',
            withholdingTaxAccountId: '',
            imprestCategoryId: '',
            creditPurchasesAccountId: '',
            advanceFromCustomerAccountId: '',
            covidTaxRecievedAccountId: '',
            communicationsServiceTaxReceivedAccountId: '',
            inventoryAccountId: '',
            salesRevenueAccountId: '',
            stockPurchasesAccountId: '',
            currentEarningsAccountId: '',
            retainedEarningsAccountId: '',
            vatReceivedAccountId: '',
            imprestGlAccountId: '',
            purchasesBankAccountId: '',
            advanceToSupplierAccountId: '',
            covidTaxPaidAccountId: '',
            communicationsServiceTaxPaidAccountId: '',
            vatRate: 0,
            goodsInTransitAccountId: '',
            unrealizedFxLossAccountId: '',
            unrealizedFxGainAccountId: '',
            realizedFxLossAccountId: '',
            realizedFxGainAccountId: '',
            vatPaidAccountId: '',
            getflReceivedAccountId: '',
            getflPaidAccountId: '',
            nhilReceivedAccountId: '',
            nhilPaidAccountId: '',
            socialSecurityFundEmployerRate: 0,
            socialSecurityFundEmployeeRate: 0,
            socialSecurityEmployerPortionDefaultExpenseGl: '',
            socialSecurityEmployeePortionDefaultExpenseGl: '',
            socialSecurityEmployerPortionDefaultLiabilityGl: '',
            socialSecurityEmployeePortionDefaultLiabilityGl: '',


        }
    },
    methods: {

        getDefaultGlSetup() {

            axios.get('/LedgerSetups/GetDefaultGlSetup').then(response => {

                let responseData = response.data;

                if (responseData) {

                    this.id = responseData.id;
                    this.tenantId = responseData.tenantId;

                    $("#accountPayablesBankAccountId").ejDropDownList({

                        value: responseData.accountPayablesBankAccountId,

                    });

                    $("#payRollBankAccountId").ejDropDownList({

                        value: responseData.payRollBankAccountId,

                    });

                    $("#accountsReceivableBankAccountId").ejDropDownList({

                        value: responseData.accountsReceivableBankAccountId,

                    });

                    $("#salesBankAccountId").ejDropDownList({

                        value: responseData.salesBankAccountId,

                    });

                    $("#accountsReceivableAccountId").ejDropDownList({

                        value: responseData.accountsReceivableAccountId,

                    });

                    $("#accountsPayableAccountId").ejDropDownList({

                        value: responseData.accountsPayableAccountId,

                    });

                    $("#withholdingTaxAccountId").ejDropDownList({

                        value: responseData.withholdingTaxAccountId,

                    });

                    $("#imprestCategoryId").ejDropDownList({

                        value: responseData.imprestCategoryId,

                    });

                    $("#creditPurchasesAccountId").ejDropDownList({

                        value: responseData.creditPurchasesAccountId,

                    });

                    $("#advanceFromCustomerAccountId").ejDropDownList({

                        value: responseData.advanceFromCustomerAccountId,

                    });

                    $("#covidTaxRecievedAccountId").ejDropDownList({

                        value: responseData.covidTaxReceivedAccountId

                    });

                    $("#communicationsServiceTaxReceivedAccountId").ejDropDownList({

                        value: responseData.communicationsServiceTaxReceivedAccountId,

                    });

                    $("#inventoryAccountId").ejDropDownList({

                        value: responseData.inventoryAccountId,

                    });

                    $("#salesRevenueAccountId").ejDropDownList({

                        value: responseData.salesRevenueAccountId,

                    });

                    $("#stockPurchasesAccountId").ejDropDownList({

                        value: responseData.stockPurchasesAccountId,

                    });

                    $("#currentEarningsAccountId").ejDropDownList({

                        value: responseData.currentEarningsAccountId,

                    });

                    $("#retainedEarningsAccountId").ejDropDownList({

                        value: responseData.retainedEarningsAccountId,

                    });

                    $("#vatReceivedAccountId").ejDropDownList({

                        value: responseData.vatReceivedAccountId,

                    });

                    $("#imprestGlAccountId").ejDropDownList({

                        value: responseData.imprestGlAccountId,

                    });

                    $("#purchasesBankAccountId").ejDropDownList({

                        value: responseData.purchasesBankAccountId,

                    });

                    $("#advanceToSupplierAccountId").ejDropDownList({

                        value: responseData.advanceToSupplierAccountId,

                    });

                    $("#covidTaxPaidAccountId").ejDropDownList({

                        value: responseData.covidTaxPaidAccountId,

                    });

                    $("#communicationsServiceTaxPaidAccountId").ejDropDownList({

                        value: responseData.communicationsServiceTaxPaidAccountId,

                    });

                    $("#vatRate").ejNumericTextbox({ value: responseData.vatRate, minValue: 0, maxValue: 100, decimalPlaces: 2, watermarkText: "0.00", width: 'inherit', });

                    $("#goodsInTransitAccountId").ejDropDownList({

                        value: responseData.goodsInTransitAccountId,

                    });

                    $("#unrealizedFxLossAccountId").ejDropDownList({

                        value: responseData.unrealizedFxLossAccountId,

                    });

                    $("#unrealizedFxGainAccountId").ejDropDownList({

                        value: responseData.unrealizedFxGainAccountId,

                    });

                    $("#realizedFxLossAccountId").ejDropDownList({

                        value: responseData.realizedFxLossAccountId,

                    });

                    $("#realizedFxGainAccountId").ejDropDownList({

                        value: responseData.realizedFxGainAccountId,

                    });

                    $("#vatPaidAccountId").ejDropDownList({

                        value: responseData.vatPaidAccountId,

                    });

                    $("#getflReceivedAccountId").ejDropDownList({

                        value: responseData.getflReceivedAccountId,

                    });

                    $("#getflPaidAccountId").ejDropDownList({

                        value: responseData.getflPaidAccountId,

                    });

                    $("#nhilReceivedAccountId").ejDropDownList({

                        value: responseData.nhilReceivedAccountId,

                    });

                    $("#nhilPaidAccountId").ejDropDownList({

                        value: responseData.nhilPaidAccountId,

                    });


                    $("#socialSecurityEmployerPortionDefaultExpenseGl").ejDropDownList({

                        value: responseData.socialSecurityEmployerPortionDefaultExpenseGl,

                    });

                    $("#socialSecurityEmployeePortionDefaultExpenseGl").ejDropDownList({

                        value: responseData.socialSecurityEmployeePortionDefaultExpenseGl,

                    });

                    $("#socialSecurityEmployerPortionDefaultLiabilityGl").ejDropDownList({

                        value: responseData.socialSecurityEmployerPortionDefaultLiabilityGl,

                    });

                    $("#socialSecurityEmployeePortionDefaultLiabilityGl").ejDropDownList({

                        value: responseData.socialSecurityEmployeePortionDefaultLiabilityGl,

                    });

                }


            }).catch(err => {

                console.log(err);

                this.toastHandler('error', 'Unable to get default GL numbers.');

            });
        },

        getBusinessProfile() {

            axios.get('/SharedResource/GetBusinessProfile').then(response => {


                if (response.data) {

                    let businessProfile = response.data;

                    this.socialSecurityFundEmployerRate = businessProfile.socialSecurityFundEmployeeRate;
                    this.socialSecurityFundEmployeeRate = businessProfile.socialSecurityFundEmployeeRate;

                    $("#socialSecurityFundEmployerRate").ejNumericTextbox({ value: businessProfile.socialSecurityFundEmployerRate, minValue: 0, maxValue: 100, decimalPlaces: 2, watermarkText: "0.00", width: 'inherit', });

                    $("#socialSecurityFundEmployeeRate").ejNumericTextbox({ value: businessProfile.socialSecurityFundEmployeeRate, minValue: 0, maxValue: 100, decimalPlaces: 2, watermarkText: "0.00", width: 'inherit', });


                }

            }).catch(err => {

                console.log(err);

            });
        },

        getLedgerAccounts() {

            axios.get('/LedgerSetups/GetLedgerAccounts').then(response => {

                this.ledgerAccountList = response.data;

                response.data.forEach((v) => {

                    v.accountIdentifier = `${v.accountNo} - ${v.accountName}`;

                });

                this.initControls(response.data);


            }).catch(err => {

                this.toastHandler('error', 'Unable to get ledger accounts.');

            });
        },

        getImprestCategories() {

            axios.get('/LedgerSetups/GetImprestCategories').then(response => {

                $("#imprestCategoryId").ejDropDownList({
                    dataSource: response.data,
                    watermarkText: "Select Imprest Category",
                    width: "100%",
                    fields: { id: "id", text: "name", value: "id" },
                    enableFilterSearch: true,
                    change: (args) => {

                        this.imprestCategoryId = args.value;
                    }

                });

            }).catch(err => {

                this.toastHandler('error', 'Unable to get imprest categories');

            });
        },

        saveDefaultGlNumbers() {

            this.isLoading = true;

            let payload = {};

            payload.accountPayablesBankAccountId = !this.accountPayablesBankAccountId ? this.emptyGuid : this.accountPayablesBankAccountId;
            payload.payRollBankAccountId = !this.payRollBankAccountId ? this.emptyGuid : this.payRollBankAccountId;
            payload.accountsReceivableBankAccountId = !this.accountsReceivableBankAccountId ? this.emptyGuid : this.accountsReceivableBankAccountId;
            payload.salesBankAccountId = !this.salesBankAccountId ? this.emptyGuid : this.salesBankAccountId;
            payload.accountsReceivableAccountId = !this.accountsReceivableAccountId ? this.emptyGuid : this.accountsReceivableAccountId;
            payload.accountsPayableAccountId = !this.accountsPayableAccountId ? this.emptyGuid : this.accountsPayableAccountId;
            payload.withholdingTaxAccountId = !this.withholdingTaxAccountId ? this.emptyGuid : this.withholdingTaxAccountId;
            payload.imprestCategoryId = !this.imprestCategoryId ? this.emptyGuid : this.imprestCategoryId;
            payload.creditPurchasesAccountId = !this.creditPurchasesAccountId ? this.emptyGuid : this.creditPurchasesAccountId;
            payload.advanceFromCustomerAccountId = !this.advanceFromCustomerAccountId ? this.emptyGuid : this.advanceFromCustomerAccountId;
            payload.covidTaxReceivedAccountId = !this.covidTaxRecievedAccountId ? this.emptyGuid : this.covidTaxRecievedAccountId;
            payload.communicationsServiceTaxReceivedAccountId = !this.communicationsServiceTaxReceivedAccountId ? this.emptyGuid : this.communicationsServiceTaxReceivedAccountId;
            payload.inventoryAccountId = !this.inventoryAccountId ? this.emptyGuid : this.inventoryAccountId;
            payload.salesRevenueAccountId = !this.salesRevenueAccountId ? this.emptyGuid : this.salesRevenueAccountId;
            payload.stockPurchasesAccountId = !this.stockPurchasesAccountId ? this.emptyGuid : this.stockPurchasesAccountId;
            payload.currentEarningsAccountId = !this.currentEarningsAccountId ? this.emptyGuid : this.currentEarningsAccountId;
            payload.retainedEarningsAccountId = !this.retainedEarningsAccountId ? this.emptyGuid : this.retainedEarningsAccountId;
            payload.vatReceivedAccountId = !this.vatReceivedAccountId ? this.emptyGuid : this.vatReceivedAccountId;
            payload.imprestGlAccountId = !this.imprestGlAccountId ? this.emptyGuid : this.imprestGlAccountId;
            payload.purchasesBankAccountId = !this.purchasesBankAccountId ? this.emptyGuid : this.purchasesBankAccountId;
            payload.advanceToSupplierAccountId = !this.advanceToSupplierAccountId ? this.emptyGuid : this.advanceToSupplierAccountId;
            payload.covidTaxPaidAccountId = !this.covidTaxPaidAccountId ? this.emptyGuid : this.covidTaxPaidAccountId;
            payload.communicationsServiceTaxPaidAccountId = !this.communicationsServiceTaxPaidAccountId ? this.emptyGuid : this.communicationsServiceTaxPaidAccountId;
            payload.vatRate = this.vatRate ;
            payload.goodsInTransitAccountId = !this.goodsInTransitAccountId ? this.emptyGuid : this.goodsInTransitAccountId;
            payload.unrealizedFxLossAccountId = !this.unrealizedFxLossAccountId ? this.emptyGuid : this.unrealizedFxLossAccountId;
            payload.unrealizedFxGainAccountId = !this.unrealizedFxGainAccountId ? this.emptyGuid : this.unrealizedFxGainAccountId;
            payload.realizedFxLossAccountId = !this.realizedFxLossAccountId ? this.emptyGuid : this.realizedFxLossAccountId;
            payload.realizedFxGainAccountId = !this.realizedFxGainAccountId ? this.emptyGuid : this.realizedFxGainAccountId;
            payload.vatPaidAccountId = !this.vatPaidAccountId ? this.emptyGuid : this.vatPaidAccountId;
            payload.getflReceivedAccountId = !this.getflReceivedAccountId ? this.emptyGuid : this.getflReceivedAccountId;
            payload.getflPaidAccountId = !this.getflPaidAccountId ? this.emptyGuid : this.getflPaidAccountId;
            payload.nhilReceivedAccountId = !this.nhilReceivedAccountId ? this.emptyGuid : this.nhilReceivedAccountId;
            payload.nhilPaidAccountId = !this.nhilPaidAccountId ? this.emptyGuid : this.nhilPaidAccountId;

            payload.socialSecurityEmployerPortionDefaultExpenseGl = !this.socialSecurityEmployerPortionDefaultExpenseGl ? this.emptyGuid : this.socialSecurityEmployerPortionDefaultExpenseGl;
            payload.socialSecurityEmployeePortionDefaultExpenseGl = !this.socialSecurityEmployeePortionDefaultExpenseGl ? this.emptyGuid : this.socialSecurityEmployeePortionDefaultExpenseGl;

            payload.socialSecurityEmployerPortionDefaultLiabilityGl = !this.socialSecurityEmployerPortionDefaultLiabilityGl ? this.emptyGuid : this.socialSecurityEmployerPortionDefaultLiabilityGl;
            payload.socialSecurityEmployeePortionDefaultLiabilityGl = !this.socialSecurityEmployeePortionDefaultLiabilityGl ? this.emptyGuid : this.socialSecurityEmployeePortionDefaultLiabilityGl;

            if (this.id)
            {
                payload.id = this.id;
                payload.tenantId = this.tenantId;

                axios.post('/LedgerSetups/UpdateDefaultGlNumbers', payload).then(response => {

                    this.toastHandler('', 'Default GL Numbers updated.');
                    this.isLoading = false;

                }).catch(err => {

                    this.toastHandler('error', 'Unable to update Default GL numbers.');
                    this.isLoading = false;

                });


            }
            else {

                axios.post('/LedgerSetups/SaveDefaultGlNumbers', payload).then(response => {

                    this.toastHandler('', 'Default GL Numbers saved.');
                    this.isLoading = false;

                }).catch(err => {

                    this.toastHandler('error', 'Unable to save Default GL numbers.');
                    this.isLoading = false;

                });

            }
        },

        initControls(ledgerAccountList) {

            $("#accountPayablesBankAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.accountPayablesBankAccountId = args.value;
                }

            });

            $("#payRollBankAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.payRollBankAccountId = args.value;
                }

            });

            $("#accountsReceivableBankAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.accountsReceivableBankAccountId = args.value;
                }

            });

            $("#salesBankAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.salesBankAccountId = args.value;
                }

            });

            $("#accountsReceivableAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.accountsReceivableAccountId = args.value;
                }

            });

            $("#accountsPayableAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.accountsPayableAccountId = args.value;
                }

            });

            $("#withholdingTaxAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.withholdingTaxAccountId = args.value;
                }

            });

            $("#creditPurchasesAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.creditPurchasesAccountId = args.value;
                }

            });

            $("#advanceFromCustomerAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.advanceFromCustomerAccountId = args.value;
                }

            });

            $("#covidTaxRecievedAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.covidTaxRecievedAccountId = args.value;
                }

            });

            $("#communicationsServiceTaxReceivedAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.communicationsServiceTaxReceivedAccountId = args.value;
                }

            });

            $("#inventoryAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.inventoryAccountId = args.value;
                }

            });

            $("#salesRevenueAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.salesRevenueAccountId = args.value;
                }

            });

            $("#stockPurchasesAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.stockPurchasesAccountId = args.value;
                }

            });

            $("#currentEarningsAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.currentEarningsAccountId = args.value;
                }

            });

            $("#retainedEarningsAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.retainedEarningsAccountId = args.value;
                }

            });

            $("#vatReceivedAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.vatReceivedAccountId = args.value;
                }

            });

            $("#imprestGlAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.imprestGlAccountId = args.value;
                }

            });

            $("#purchasesBankAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.purchasesBankAccountId = args.value;
                }

            });

            $("#advanceToSupplierAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.advanceToSupplierAccountId = args.value;
                }

            });

            $("#covidTaxPaidAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.covidTaxPaidAccountId = args.value;
                }

            });

            $("#communicationsServiceTaxPaidAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.communicationsServiceTaxPaidAccountId = args.value;
                }

            });

            $("#goodsInTransitAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.goodsInTransitAccountId = args.value;
                }

            });

            $("#unrealizedFxLossAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.unrealizedFxLossAccountId = args.value;
                }

            });

            $("#unrealizedFxGainAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.unrealizedFxGainAccountId = args.value;
                }

            });

            $("#realizedFxLossAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.realizedFxLossAccountId = args.value;
                }

            });

            $("#realizedFxGainAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.realizedFxGainAccountId = args.value;
                }

            });

            $("#vatPaidAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.vatPaidAccountId = args.value;
                }

            });

            $("#getflReceivedAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.getflReceivedAccountId = args.value;
                }

            });

            $("#getflPaidAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.getflPaidAccountId = args.value;
                }

            });

            $("#nhilReceivedAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.nhilReceivedAccountId = args.value;
                }

            });

            $("#nhilPaidAccountId").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.nhilPaidAccountId = args.value;
                }

            });

            $("#vatRate").ejNumericTextbox({ value: 0, minValue: 0, maxValue: 100, decimalPlaces: 2, watermarkText: "0.00", width: 'inherit', });

            $("#socialSecurityFundEmployerRate").ejNumericTextbox({ value: 0, minValue: 0, maxValue: 100, decimalPlaces: 2, watermarkText: "0.00", width: 'inherit', });

            $("#socialSecurityFundEmployeeRate").ejNumericTextbox({ value: 0, minValue: 0, maxValue: 100, decimalPlaces: 2, watermarkText: "0.00", width: 'inherit', });


            $("#socialSecurityEmployerPortionDefaultExpenseGl").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.socialSecurityEmployerPortionDefaultExpenseGl = args.value;
                }

            });

            $("#socialSecurityEmployeePortionDefaultExpenseGl").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.socialSecurityEmployeePortionDefaultExpenseGl = args.value;
                }

            });


            $("#socialSecurityEmployerPortionDefaultLiabilityGl").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.socialSecurityEmployerPortionDefaultLiabilityGl = args.value;
                }

            });

            $("#socialSecurityEmployeePortionDefaultLiabilityGl").ejDropDownList({
                dataSource: ledgerAccountList,
                watermarkText: "Select Account",
                width: "100%",
                fields: { id: "id", text: "accountIdentifier", value: "id" },
                enableFilterSearch: true,
                change: (args) => {

                    this.socialSecurityEmployeePortionDefaultLiabilityGl = args.value;
                }

            });

            this.getDefaultGlSetup();


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


    },

    mounted() {

        this.getLedgerAccounts();

        this.getImprestCategories();

        this.getBusinessProfile();
        
        //remove d-none class from the div with id = app
        document.getElementById('app').classList.remove('d-none');

    },
});
app.mount('#app');