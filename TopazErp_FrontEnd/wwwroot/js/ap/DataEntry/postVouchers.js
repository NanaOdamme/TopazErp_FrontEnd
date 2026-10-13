const app = Vue.createApp({
    data() {
        return {
            isShimmerLoading: false,
            isLoading: false,
            payload: {},
            emptyGuid: '00000000-0000-0000-0000-000000000000',
            voucherList: [],
            invoiceList: [],
            invoiceId: '',
            invoiceDetailsList: this.detailsList,
            supplierList: [],
            supplierId: '',
            supplierName: '',
            referenceNumber: '',
            accountNumber: '',
            invoiceNumber: '',
            currencyList: [],
            currencyId: '',
            currencyName: '',
            buyRate: '',
            sellRate: '',
            invoiceAmount: '',
            balance: '',
            description: '',
            liabilityAccountId: this.emptyGuid,
            liabilityAccountCode: '',
            bankList: [],
            bankBranchList: [],
            bankId: '',
            bankName: '',
            bankBranchId: '',
            bankBranchCode: '',
            payCurrencyId: '',
            payCurrencyName: '',
            payCurrencyCode: '',
            payCurrencyBuyRate: '',
            payCurrencySellRate: '',
            paymentAmount: '0.00',
            paymentDate: moment().format("YYYY-MM-DD"),
            modeOfPayment: 'Cash',
            chequeNumber: '0',
            voucherDetails: [],
            withHoldingRate: '0.00',
            isWithHolding: false,
            vatWithHoldAccountId: this.emptyGuid,
            vatWithHoldAccountName: '',
            creditAccountId: this.emptyGuid,
            creditAccountName: '',
            voucherId: '',
            voucherNumber: '',
            voucherDescription: '',
            voucherEntryDate: moment().format("YYYY-MM-DD"),
            invoiceDate: moment().format("YYYY-MM-DD"),
            selectedVoucherList: [],
            voucherIds: [],
        }
    },
    methods: {
        getSelectedVouchers() {

            let obj = $("#dataTable").ejGrid("instance"), rec = []; this.selectedVoucherList = [];
            let check = obj.checkSelectedRowsIndexes;  // collection which holds the page index and the selected record index
            if (check.length) {
                for (let pageInx = 0; pageInx < check.length; pageInx++) {
                    if (!ej.isNullOrUndefined(check[pageInx]))
                        rec = this.getRecords(pageInx, check[pageInx], obj, rec);
                }
            }

            this.selectedVoucherList = rec;

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
        getUnpostedVouchers() {
            axios.get('/ApDataEntry/GetVouchers')
                .then(response => {
                    this.voucherList = response.data
                        .filter(voucher => voucher.isPosted === false)
                        .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber));

                    this.voucherDetails = [];
                    this.voucherDetailsMap = {};

                    this.voucherList.forEach((voucher) => {
                        // format date
                        voucher.voucherEntryDate = this.formatDate(voucher.voucherEntryDate);
                        // Build child entries instead of using voucher.details
                        const details = [];

                        // liability (debit)
                        details.push({
                            id: voucher.id,
                            account: voucher.liabilityAccountName,
                            description: voucher.description,
                            debitAmount: voucher.paymentAmount,
                            creditAmount: 0,
                            buyRate: voucher.buyRate
                        });

                        // bank (credit)
                        details.push({
                            id: voucher.id,
                            account: voucher.bankAccountName,
                            description: voucher.description,
                            debitAmount: 0,
                            creditAmount: voucher.netAmount,
                            buyRate: voucher.buyRate
                        });

                        // VAT withheld - include only if > 0
                        if (parseFloat(voucher.vatWithHeld) > 0) {
                            details.push({
                                id: voucher.id,
                                account: voucher.vatWithHoldAccountName,
                                description: "Withholding VAT",
                                debitAmount: 0,
                                creditAmount: voucher.vatWithHeld,
                                buyRate: voucher.buyRate
                            });
                        }

                        // Withholding tax - include only if > 0
                        if (parseFloat(voucher.withHeld) > 0) {
                            details.push({
                                id: voucher.id,
                                account: voucher.creditAccountName,
                                description: "Withholding Amount",
                                debitAmount: 0,
                                creditAmount: voucher.withHeld,
                                ou: voucher.ou,
                                referenceNumber: voucher.invoiceNumber,
                                buyRate: voucher.buyRate
                            });
                        }

                        // Save details in map and master list
                        this.voucherDetailsMap[voucher.id] = details;
                        this.voucherDetails.push(...details);

                        // Display text for dropdown
                        voucher.displayText = `${voucher.supplierName} - ${voucher.voucherNumber}`;
                    });

                    // Build grid
                    this.dataTable(this.voucherList, this.voucherDetails);

                    // Dropdown
                    $("#voucherId").ejDropDownList({
                        dataSource: this.voucherList,
                        watermarkText: "Select Voucher",
                        width: "100%",
                        fields: { id: "id", text: "displayText", value: "id" },
                        enableFilterSearch: true,
                        change: (args) => {
                            this.voucherId = args.value;
                        }
                    });
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to get invoices.');
                });
        },
        dataTable(responseData, voucherDetails) {
            $("#dataTable").ejGrid({
                dataSource: responseData,
                allowPaging: true,
                allowSorting: true,
                isResponsive: true,
                scrollSettings: { width: "1200px", height: "400px" },
                editSettings: { allowDeleting: true, showDeleteConfirmDialog: true },
                toolbarSettings: { showToolbar: true, toolbarItems: [ ej.Grid.ToolBarItems.Update, ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                childGrid: {
                    dataSource: voucherDetails,
                    queryString: "id",
                    allowPaging: true,
                    allowSorting: true,
                    isResponsive: true,
                    pageSettings: { pageSize: 10 },
                    editSettings: {},
                    toolbarSettings: { showToolbar: true, toolbarItems: [ej.Grid.ToolBarItems.Cancel, ej.Grid.ToolBarItems.Search] },
                    columns: [
                        { field: "id", headerText: 'Id', visible: false, isPrimaryKey: true },
                        { field: "account", headerText: "Account", width: 100 },
                        { field: "description", headerText: 'Description', textAlign: ej.TextAlign.Left, width: 120 },
                        { field: "debitAmount", headerText: "Debit Amount", width: 80, format: "{0:n2}" },
                        { field: "creditAmount", headerText: "Credit Amount", width: 80, format: "{0:n2}" },
                        { field: "buyRate", headerText: "Buy Rate", format: "{0:n4}", width: 80 }
                    ],
                },

                columns: [
                    { field: "id", headerText: "Id", width: 75, visible: false, isPrimaryKey: true },
                    { type: "checkbox", width: 30 },
                    { field: "batchNumber", headerText: "Batch Number", width: 65 },
                    { field: "voucherEntryDate", headerText: "Entry Date", width: 75, format: "{0:yyyy-MM-dd}" },
                    { field: "supplierName", headerText: "Recipient", textAlign: ej.TextAlign.Left, width: 85 },
                    { field: "payCurrencyName", headerText: "Currency", textAlign: ej.TextAlign.Left, width: 75 },
                    { field: "chequeNumber", headerText: "Cheque No.", width: 65, textAlign: ej.TextAlign.Left, },
                    { field: "tenantId", visible: false, headerText: "Tenant Id", width: 15 }
                ],
            });
        },
        formatDate(dateInput) {

            return moment(dateInput).format("DD-MMM-YYYY");
        },
        postVouchers() {
            this.getSelectedVouchers();

            // Check if any voucher is selected
            if (!this.selectedVoucherList.length) {
                this.toastHandler('warning', 'Select vouchers to post.');
                return;
            }

            this.isLoading = true;

            let payload = {
                voucherIds: this.selectedVoucherList.map(a => a.id)
            };

            axios.post('/ApDataEntry/InitPostVouchers', payload)
                .then(response => {
                    if (response.data.code === 200) {
                        this.toastHandler('', response.data.message);
                        this.getUnpostedVouchers();
                    } else {
                        this.toastHandler('warning', response.data.message);
                    }
                    this.isLoading = false;
                    $('#addEdit').modal('hide');
                    window.location.href = `/ApDataEntry/VoucherAction`
                })
                .catch(err => {
                    this.toastHandler('error', 'Unable to post voucher(s).');
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
    mounted() {
        this.getUnpostedVouchers();
    }

});
app.mount('#app');