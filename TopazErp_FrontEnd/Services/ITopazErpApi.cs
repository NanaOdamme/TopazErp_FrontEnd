using TopazErp_FrontEnd.Models;
using TopazErp_FrontEnd.Models.Authentication;

namespace TopazErp_FrontEnd.Services;

public interface ITopazErpApi
{
    Task<TokenResponse> SignIn(SignInDto dto);
    Task<SessionResponse> GetCurrentLoginInformation(string authToken);
    Task<OtpResponse> SendEmailOtp(string authToken, string subject);
    Task<VerifyOtpResponse> VerifyOtp(string otp, string authToken);
    Task<SubscriptionInfoResponse> GetSubscriptionInfo();
    
    //business profile
    Task<BaseApiResponse> CreateCompanyProfile(object dto);
    Task<CompanyProfileResponse> GetBusinessProfile();
    
    //shared 
    Task<BankResponse> GetBanks(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateBank(object dto);
    Task<BaseApiResponse> UpdateBank(object dto);
    Task<BaseApiResponse> DeleteBank(Guid id);
    Task<BaseApiResponse> CreateBranch(object input);
    Task<BaseApiResponse> UpdateBranch(object input);
    Task<BaseApiResponse> DeleteBranch(object input);
     
    //settings / system numbers
    Task<SystemNumberResponse> GetSystemNumbers(string key);
    Task<BaseApiResponse> UpdateSystemNumber(object dto);
    
    //cost centers
    Task<CostCenterResponse> GetCostCenters(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateCostCenter(object dto);
    Task<BaseApiResponse> UpdateCostCenter(object dto);
    Task<BaseApiResponse> DeleteCostCenter(Guid id);
    
    //Customer Groups
    Task<CustomerGroupResponse> GetCustomerGroups(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateCustomerGroup(object dto);
    Task<BaseApiResponse> UpdateCustomerGroup(object dto);
    Task<BaseApiResponse> DeleteCustomerGroup(Guid id);
    
    //Customers...
    Task<CustomerResponse> GetCustomers(int pageNo, int pageSize, string query);
    Task<CustomerDetailResponse> GetCustomer(Guid id);
    Task<CustomersResponse> GetCustomersByGroup(Guid groupId);
    Task<BaseApiResponse> CreateCustomer(object dto);
    Task<BaseApiResponse> UpdateCustomer(object dto);
    Task<BaseApiResponse> DeleteCustomer(Guid id);
    
    //Supplier Groups ...
    Task<SupplierGroupResponse> GetSupplierGroups(int pageNo, int pageSize, string query);
    Task<SuppliersResponse> GetSuppliersByGroup(Guid groupId);
    Task<BaseApiResponse> CreateSupplierGroup(object dto);
    Task<BaseApiResponse> UpdateSupplierGroup(object dto);
    Task<BaseApiResponse> DeleteSupplierGroup(Guid id);
    
    //Supplier
    Task<SupplierResponse> GetSuppliers(int pageNo, int pageSize, string query);
    Task<SupplierDetailResponse> GetSupplier(Guid id);
    Task<BaseApiResponse> CreateSupplier(object dto);
    Task<BaseApiResponse> UpdateSupplier(object dto);
    Task<BaseApiResponse> DeleteSupplier(Guid id);
    
    //Department
    Task<DepartmentResponse> GetDepartments(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateDepartment(object dto);
    Task<BaseApiResponse> UpdateDepartment(object dto);
    Task<BaseApiResponse> DeleteDepartment(Guid id);
    
    //Tax levy
    Task<TaxLevyResponse> GetTaxLevies(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateTaxLevy(object dto);
    Task<BaseApiResponse> UpdateTaxLevy(object dto);
    Task<BaseApiResponse> DeleteTaxLevy(Guid id);
    
    //currency
    Task<CurrencyResponse> GetCurrencies(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateCurrency(object dto);
    Task<BaseApiResponse> UpdateCurrency(object dto);
    Task<BaseApiResponse> DeleteCurrency(Guid id);
    
    
    //payroll
    
    // allowance types
    Task<AllowanceTypeResponse> GetAllowanceTypes(int pageNo, int pageSize, string query);
    Task<AllowanceTypeDetailResponse> GetAllowanceTypeDetails(Guid id);
    Task<BaseApiResponse> CreateAllowanceType(object dto);
    Task<BaseApiResponse> UpdateAllowanceType(object dto);
    Task<BaseApiResponse> DeleteAllowanceType(Guid id);
    
    
    //allowance rates
    Task<BaseApiResponse> CreateAllowanceRate(object dto);
    Task<BaseApiResponse> UpdateAllowanceRate(object dto);
    Task<BaseApiResponse> DeleteAllowanceRate(Guid allowanceTypeId,  Guid id);
    
    //benefits in kind type
    Task<BikTypeResponse> GetBikTypes(int pageNo, int pageSize, string query);
    Task<BikTypeDetailResponse> GetBikTypeDetails(Guid id);
    Task<BaseApiResponse> CreateBikType(object dto);
    Task<BaseApiResponse> UpdateBikType(object dto);
    Task<BaseApiResponse> DeleteBikType(Guid id);
    
    // benefits in kind type rates
    Task<BaseApiResponse> CreateBikRate(object dto);
    Task<BaseApiResponse> UpdateBikRate(object dto);
    Task<BaseApiResponse> DeleteBikRate(Guid bikTypeId, Guid id);
    
    
    // deduction type
    Task<DeductionTypeResponse> GetDeductionTypes(int pageNo, int pageSize, string query);
    Task<DeductionTypeDetailResponse> GetDeductionTypeDetails(Guid id);
    Task<BaseApiResponse> CreateDeductionType(object dto);
    Task<BaseApiResponse> UpdateDeductionType(object dto);
    Task<BaseApiResponse> DeleteDeductionType(Guid id);
    
    // deduction rates
    Task<BaseApiResponse> CreateDeductionRate(object dto);
    Task<BaseApiResponse> UpdateDeductionRate(object dto);
    Task<BaseApiResponse> DeleteDeductionRate(Guid deductionTypeId, Guid id);
    
    //overtime types
    Task<OvertimeTypeResponse> GetOvertimeTypes(int pageNo, int pageSize, string query);
    Task<OvertimeTypeDetailResponse> GetOvertimeTypeDetails(Guid id);
    Task<BaseApiResponse> CreateOvertimeType(object dto);
    Task<BaseApiResponse> UpdateOvertimeType(object dto);
    Task<BaseApiResponse> DeleteOvertimeType(Guid id);
    
    //overtime rates
    Task<BaseApiResponse> CreateOvertimeRate(object dto);
    Task<BaseApiResponse> UpdateOvertimeRate(object dto);
    Task<BaseApiResponse> DeleteOvertimeRate(Guid overtimeTypeId, Guid id);
    
     
    
    // employee categories
    Task<EmployeeCategoryResponse> GetEmployeeCategories(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateEmployeeCategory(object dto);
    Task<BaseApiResponse> UpdateEmployeeCategory(object dto);
    Task<BaseApiResponse> DeleteEmployeeCategory(Guid id);
    
    
    //loan types
    Task<LoanTypeResponse> GetLoanTypes(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateLoanType(object dto);
    Task<BaseApiResponse> UpdateLoanType(object dto);
    Task<BaseApiResponse> DeleteLoanType(Guid id);
    
    //employee ranks
    
    Task<EmployeeRankResponse> GetEmployeeRanks(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateEmployeeRank(object dto);
    Task<BaseApiResponse> UpdateEmployeeRank(object dto);
    Task<BaseApiResponse> DeleteEmployeeRank(Guid id);
    
    //tax reliefs
    Task<TaxReliefResponse> GetTaxReliefs(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateTaxRelief(object dto);
    Task<BaseApiResponse> UpdateTaxRelief(object dto);
    Task<BaseApiResponse> DeleteTaxRelief(Guid id);
    
    //tax tables
    Task<TaxTableResponse> GetTaxTables(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateTaxTable(object dto);
    Task<BaseApiResponse> UpdateTaxTable(object dto);
    Task<BaseApiResponse> DeleteTaxTable(Guid id);
    
    
    // gratuities
    Task<GratuityResponse> GetGratuities(int pageNo, int pageSize);
    Task<BaseApiResponse> CreateGratuity(object dto);
    Task<BaseApiResponse> UpdateGratuity(object dto);
    Task<BaseApiResponse> DeleteGratuity(Guid id);
    
    // pay calendar
    Task<PayCalendarResponse> GetPayCalendars(int pageNo, int pageSize, int? year);
    Task<BaseApiResponse> CreatePayCalendar(object dto);
    Task<BaseApiResponse> UpdatePayCalendar(object dto);
    Task<BaseApiResponse> DeletePayCalendar(Guid id);

    // employee bio data ...
    Task<EmployeeBioDataResponse> GetEmployeeBioData(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateEmployeeBioData(object dto);
    Task<BaseApiResponse> UpdateEmployeeBioData(object dto);
    Task<BaseApiResponse> DeleteEmployeeBioData(Guid id);
    
    // employee salary data
    Task<EmployeeSalaryInfoResponse> GetEmployeeSalaryData(int pageNo, int pageSize, string query);
    Task<EmployeeSalaryDataResponse> GetEmployeeSalaryInfo(Guid id);
    Task<BaseApiResponse> CreateEmployeeSalaryData(object dto);
    Task<BaseApiResponse> UpdateEmployeeSalaryData(object dto);
    Task<BaseApiResponse> DeleteEmployeeSalaryData(Guid id);
    
    // employee ssnit
    Task<EmployeeSsnitDataResponse> GetEmployeeSsnitData(int pageNo, int pageSize, string query);
    Task<EmployeeSsnitDetailsResponse> GetEmployeeSsnitDetails(Guid employeeId);
    Task<BaseApiResponse> CreateEmployeeSsnitData(object dto);
    Task<BaseApiResponse> UpdateEmployeeSsnitData(object dto);
    Task<BaseApiResponse> DeleteEmployeeSsnitData(Guid id);
    
    //General Ledger
    
    //bank accounts
    Task<BankAccountResponse> GetBankAccounts(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateBankAccount(object dto);
    Task<BaseApiResponse> UpdateBankAccount(object dto);
    Task<BaseApiResponse> DeleteBankAccount(Guid id);
    
    //account heads
    Task<AccountHeadResponse> GetAccountHeads(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateAccountHead(object dto);
    Task<BaseApiResponse> UpdateAccountHead(object dto);
    Task<BaseApiResponse> DeleteAccountHead(Guid id);

    
    //chart of account control
    Task<CoaControlResponse> GetAccountControls(int pageNo, int pageSize, string query, Guid accountHeadId);
    Task<CoaControlListResponse> GetControlsByAccountHead(Guid id);
    Task<BaseApiResponse> CreateAccountControl(object dto);
    Task<BaseApiResponse> UpdateAccountControl(object dto);
    Task<BaseApiResponse> DeleteAccountControl(Guid id);
    
    //chart of account detail
    
    Task<CoaDetailResponse> GetAccountDetails(int pageNo, int pageSize, string query, bool isActive);
    Task<CoaDetailResponse> CheckAccountNo(string accountNo);
    Task<CoaDetailResponse> GetLocalAccounts();
    Task<BaseApiResponse> CreateAccountDetail(object dto);
    Task<BaseApiResponse> UpdateAccountDetail(object dto);
    Task<BaseApiResponse> DeleteAccountDetail(Guid id);
    Task<CheckCoaDetailResponse> CheckAccountDetails(int accountNumber, Guid accountControlId);
    
    // budgets
    Task<BudgetResponse> GetBudgets(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateBudget(object dto);
    Task<BaseApiResponse> UpdateBudget(object dto);
    Task<BaseApiResponse> DeleteBudget(Guid id);
    
    //petty cash recipients
    Task<PettyCashRecipientResponse> GetPettyCashRecipients(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreatePettyCashRecipient(object dto);
    Task<BaseApiResponse> UpdatePettyCashRecipient(object dto);
    Task<BaseApiResponse> DeletePettyCashRecipient(Guid id);
    
    //petty cash
    Task<PettyCashResponse> GetPettyTransactions(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreatePettyCash(object dto);
    Task<BaseApiResponse> UpdatePettyCash(object dto);
    Task<BaseApiResponse> DeletePettyCash(Guid id);
    
    //imprest category
    Task<ImprestCategoryResponse> GetImprestCategories(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateImprestCategory(object dto);
    Task<BaseApiResponse> UpdateImprestCategory(object dto);
    Task<BaseApiResponse> DeleteImprestCategory(Guid id);
    
    //imprest
    Task<ImprestResponse> GetImprests(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateImprest(object dto);
    Task<BaseApiResponse> UpdateImprest(object dto);
    Task<BaseApiResponse> DeleteImprest(Guid id);
    
    //Default GL numbers
    Task<DefaultGLNumbersResponse> GetDefaultGlNumbersSetup();
    Task<BaseApiResponse> CreateDefaultGlNumbers(object dto);
    Task<BaseApiResponse> UpdateDefaultGlNumbers(object dto);
    
    // Journal
    Task<JournalTransactionResponse> GetJournalTransactions(JournalListFilterDto dto);
    Task<BaseApiResponse> CreateJournal(object dto);
    Task<BaseApiResponse> UpdateJournal(object dto);
    Task<BaseApiResponse> GetJournalDetails(Guid id);
    Task<BaseApiResponse> DeleteJournalBatch(Guid id);
    Task<BaseApiResponse> PostJournal(Guid id);
    
    //vouchers
    Task<VoucherResponse> GetVouchers(DateTime startDate, DateTime endDate, string voucherType);
    Task<BaseApiResponse> CreateVoucher(object dto);
    Task<BaseApiResponse> UpdateVoucher(object dto);
    Task<BaseApiResponse> DeleteVoucher(Guid id);
    Task<BaseApiResponse> PostVoucher(Guid id);
    
    //AP
    //opening Balance
    Task<ApOpeningBalanceResponse> GetApOpeningBalances(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateApOpeningBalance(object dto);
    Task<BaseApiResponse> UpdateApOpeningBalance(object dto);
    Task<BaseApiResponse> DeleteApOpeningBalance(Guid id);
    Task<BaseApiResponse> PostApOpeningBalances(List<Guid> balanceIds);
    //ApInvoice
    Task<ApInvoiceResponse> GetApInvoices(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateApInvoice(object dto);
    Task<BaseApiResponse> UpdateApInvoice(object dto);
    Task<BaseApiResponse> PostApInvoices(List<Guid> invoiceIds);
    Task<BaseApiResponse> CancelApInvoices(List<Guid> invoiceIds);
    Task<BaseApiResponse> ApproveApInvoices(List<Guid> invoiceIds);
    //ApPayment
    Task<ApPaymentResponse> GetApPayments(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateApPayment(object dto);
    Task<BaseApiResponse> UpdateApPayment(object dto);
    Task<BaseApiResponse> DeleteApPayment(Guid id);
    Task<BaseApiResponse> PostApPayments(List<Guid> paymentIds);
    Task<BaseApiResponse> CancelApPayments(List<Guid> paymentIds);

    //DebitMemo
    Task<DebitMemoResponse> GetDebitMemos(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateDebitMemo(object dto);
    Task<BaseApiResponse> UpdateDebitMemo(object dto);
    Task<BaseApiResponse> DeleteDebitMemo(Guid id);
    Task<BaseApiResponse> ApplyDebitMemo(object dto);
    
    //ApVouchers
    Task<ApVoucherResponse> GetApVouchers(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateApVoucher(object dto);
    Task<BaseApiResponse> UpdateApVoucher(object dto);
    Task<BaseApiResponse> DeleteApVoucher(Guid id);
    Task<BaseApiResponse> PostApVouchers(List<Guid> voucherIds);
    
    //Ap reports
    Task<ApAgingResponse> GetApAgingByDate(DateTime startDate, int agingInterval);
    Task<BaseApiResponse> SendApEmail(object dto);
    Task<ReportHeaderResponse> GetReportHeader(string title);
    Task<SupplierResponse> GetSuppliers();
    Task<ApStatementResponse> GetApStatement(Guid supplierId);
    Task<ApStatementResponse> GetApStatementType2(Guid supplierId, DateTime startDate, DateTime endDate);
    Task<ApStatementResponse> GetApStatementType3(Guid supplierId, DateTime startDate, DateTime endDate);
    Task<ApStatementResponse> GetApStatementByOu(Guid supplierId, Guid ouid, DateTime startDate, DateTime endDate);
    Task<ApStatementResponse> GetApStatementByOuType2(Guid supplierId, Guid ouid, DateTime startDate, DateTime endDate);
    Task<ApInvoiceReportResponse> GetApInvoiceReport(Guid supplierId);
    Task<ApInvoiceReportResponse> GetAllApInvoices();
    Task<ApInvoiceReportResponse> GetApCanceledInvoices();
    Task<ApInvoiceReportResponse> GetApInvoiceByBatch(string batchNumber);
    Task<ApInvoiceReportResponse> GetApInvoiceByInvoiceNumber(string invoiceNumber);
    Task<ApInvoiceReportResponse> GetApInvoiceByDate(DateTime startDate, DateTime endDate);
    Task<ApInvoiceReportResponse> GetApInvoiceByRange(int startNumber, int endNumber);
    Task<ApInvoiceReportResponse> GetApInvoiceReportById(Guid id);
    Task<ApInvoicePdfResponse> GetApInvoiceDetails(Guid id);
    Task<ApOpeningBalanceResponse> GetApBalancesReport(string status);
    Task<ApOpeningBalanceResponse> GetApBalancesBySupplier(Guid supplierId, string status);
    Task<ApOpeningBalanceResponse> GetAllConvertedApBalances(string status);

    Task<ApPaymentReportResponse> GetApPaymentsReport();
    Task<ApPaymentReportResponse> GetApPaymentsBySupplier(Guid supplierId);
    Task<ApPaymentReportResponse> GetApPaymentsByDate(DateTime startDate, DateTime endDate);
    Task<ApPaymentReceiptResponse> GetApPaymentReceipts(Guid id);
    Task<ApPaymentReceiptResponse> GetApPaymentReceipts(List<Guid> ids);

    Task<ApVoucherResponse> GetApVouchersReport();
    Task<ApVoucherResponse> GetApVouchersBySupplier(Guid supplierId);
    Task<ApVoucherResponse> GetApVouchersByDate(DateTime startDate, DateTime endDate);
    Task<ApVoucherResponse> GetApVoucherByInvoice(string invoiceId);
    Task<ApVoucherResponse> GetApVoucherDetails(Guid voucherId);
    Task<ApVoucherResponse> GetApPaymentVoucher(Guid id);
    Task<ApVoucherResponse> GetApPaymentVouchers(List<Guid> ids);
    Task<DebitMemoResponse> GetApDebitMemo();
    Task<ApAgingResponse> GetApAgingSummary(DateTime startDate, int agingInterval);
    Task<ApAgingResponse> GetApAgingBySupplier(Guid supplierId, DateTime startDate, int agingInterval);
    Task<ApGlTransactionResponse> GetApGlTransaction(DateTime startDate, DateTime endDate, bool isMultiCurrency);
    
    //AR
    //opening Balance
    Task<ArOpeningBalanceResponse> GetArOpeningBalances(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateArOpeningBalance(object dto);
    Task<BaseApiResponse> UpdateArOpeningBalance(object dto);
    Task<BaseApiResponse> DeleteArOpeningBalance(Guid id);
    Task<BaseApiResponse> PostArOpeningBalances(List<Guid> balanceIds);
    //ArInvoice
    Task<ArInvoiceResponse> GetArInvoices(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateArInvoice(object dto);
    Task<BaseApiResponse> UpdateArInvoice(object dto);
    Task<BaseApiResponse> PostArInvoices(List<Guid> invoiceIds);
    Task<BaseApiResponse> CancelArInvoices(List<Guid> invoiceIds);
    Task<BaseApiResponse> ApproveArInvoices(List<Guid> invoiceIds);
    //ArPayment
    Task<ArPaymentResponse> GetArPayments(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateArPayment(object dto);
    Task<BaseApiResponse> UpdateArPayment(object dto);
    Task<BaseApiResponse> DeleteArPayment(Guid id);
    Task<BaseApiResponse> PostArPayments(List<Guid> paymentIds);
    Task<BaseApiResponse> CancelArPayments(List<Guid> paymentIds);

    //CreditMemo
    Task<CreditMemoResponse> GetCreditMemos(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateCreditMemo(object dto);
    Task<BaseApiResponse> UpdateCreditMemo(object dto);
    Task<BaseApiResponse> DeleteCreditMemo(Guid id);
    Task<BaseApiResponse> ApplyCreditMemo(object dto);
    
    //Quotations
    Task<QuotationResponse> GetQuotations(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateQuotation(object dto);
    Task<BaseApiResponse> UpdateQuotation(object dto);
    Task<BaseApiResponse> DeleteQuotation(Guid id);
    
    //Ar reports
    Task<ArAgingResponse> GetArAgingByDate(DateTime startDate, int agingInterval);
    Task<BaseApiResponse> SendArEmail(object dto);
    Task<ArStatementResponse> GetArStatement(Guid customerId);
    Task<ArStatementResponse> GetArStatementType2(Guid customerId, DateTime startDate, DateTime endDate);
    Task<ArStatementResponse> GetArStatementType3(Guid customerId, DateTime startDate, DateTime endDate);
    Task<ArStatementResponse> GetArStatementByOu(Guid customerId, Guid ouid, DateTime startDate, DateTime endDate);
    Task<ArStatementResponse> GetArStatementByOuType2(Guid customerId, Guid ouid, DateTime startDate, DateTime endDate);
    Task<ArInvoiceReportResponse> GetArInvoiceReport(Guid customerId);
    Task<ArInvoiceReportResponse> GetAllArInvoices();
    Task<ArInvoiceReportResponse> GetArCanceledInvoices();
    Task<ArInvoiceReportResponse> GetArInvoiceByBatch(string batchNumber);
    Task<ArInvoiceReportResponse> GetArInvoiceByInvoiceNumber(string invoiceNumber);
    Task<ArInvoiceReportResponse> GetArInvoiceByDate(DateTime startDate, DateTime endDate);
    Task<ArInvoiceReportResponse> GetArInvoiceByRange(int startNumber, int endNumber);
    Task<ArInvoiceReportResponse> GetArInvoiceReportById(Guid id);
    Task<ArInvoicePdfResponse> GetArInvoiceDetails(Guid id);
    Task<ArOpeningBalanceResponse> GetArBalancesReport(string status);
    Task<ArOpeningBalanceResponse> GetArBalancesByCustomer(Guid customerId, string status);
    Task<ArOpeningBalanceResponse> GetAllConvertedArBalances(string status);

    Task<ArPaymentReportResponse> GetArPaymentsReport();
    Task<ArPaymentReportResponse> GetArPaymentsByCustomer(Guid customerId);
    Task<ArPaymentReportResponse> GetArPaymentsByDate(DateTime startDate, DateTime endDate);
    Task<ArPaymentReceiptResponse> GetArPaymentReceipts(Guid id);
    Task<ArPaymentReceiptResponse> GetArPaymentReceipts(List<Guid> ids);

    Task<QuotationResponse> GetQuotationsReport();
    Task<ArAgingResponse> GetArAgingSummary(DateTime startDate, int agingInterval);
    Task<ArAgingResponse> GetArAgingByCustomer(Guid customerId, DateTime startDate, int agingInterval);
    Task<ArGlTransactionResponse> GetArGlTransaction(DateTime startDate, DateTime endDate, bool isMultiCurrency);
}