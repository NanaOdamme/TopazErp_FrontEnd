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
    

}