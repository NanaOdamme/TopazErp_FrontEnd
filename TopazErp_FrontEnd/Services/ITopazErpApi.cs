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
    Task<BaseApiResponse> CreateEmployeeSalaryData(object dto);
    Task<BaseApiResponse> UpdateEmployeeSalaryData(object dto);
    Task<BaseApiResponse> DeleteEmployeeSalaryData(Guid id);
    
    // employee ssnit
    Task<EmployeeSsnitDataResponse> GetEmployeeSsnitData(int pageNo, int pageSize, string query);
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
    Task<BaseApiResponse> CreateAccountDetail(object dto);
    Task<BaseApiResponse> UpdateAccountDetail(object dto);
    Task<BaseApiResponse> DeleteAccountDetail(Guid id);
    Task<CheckCoaDetailResponse> CheckAccountDetails(int accountNumber, Guid accountControlId);
    
    // budgets
    Task<BudgetResponse> GetBudgets(int pageNo, int pageSize, string query);
    Task<BaseApiResponse> CreateBudget(object dto);
    Task<BaseApiResponse> UpdateBudget(object dto);
    Task<BaseApiResponse> DeleteBudget(Guid id);
    
    // Journal
    Task<JournalTransactionResponse> GetJournalTransactions(int pageNo, int pageSize,string batchNumber, DateTime? startDate = null, DateTime? endDate = null, bool? isPosted = null, bool? isMultiCurrency = null);
    
    Task<BaseApiResponse> CreateJournal(object dto);
    
    Task<BaseApiResponse> UpdateJournal(object dto);
    
    Task<BaseApiResponse> GetJournalDetails(Guid id);

    Task<BaseApiResponse> DeleteJournalBatch(Guid id);

}