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
    Task<BaseApiResponse> UpdateCompanyProfile(object dto);

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
    Task<CustomerResponse> GetCustomers();
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
    Task<BaseApiResponse> DeleteAllowanceRate(Guid allowanceTypeId, Guid id);

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
    Task<EmployeeBioDataResponse> GetEmployeeBioData();
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
    Task<CoaDetailResponse> GetBankGlAccounts();
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
    Task<PettyCashResponse> GetPettyTransactions(PettyCashFilterDto dto);
    Task<PettyCashTransactionDetailResponse> GetPettyTransactionDetails(Guid id);
    Task<BaseApiResponse> CreatePettyCash(object dto);
    Task<BaseApiResponse> UpdatePettyCash(object dto);
    Task<BaseApiResponse> DeletePettyCash(Guid id);
    Task<BaseApiResponse> PostPettyCash(object dto);
    
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
    
    // Journal ...
    Task<JournalTransactionResponse> GetJournalTransactions(JournalListFilterDto dto);
    Task<BaseApiResponse> CreateJournal(object dto);
    Task<BaseApiResponse> UpdateJournal(object dto);
    Task<JournalTransactionDetailResponse> GetJournalDetails(Guid id);
    Task<BaseApiResponse> DeleteJournalBatch(Guid id);
    Task<BaseApiResponse> PostJournal(Guid id);

    //vouchers
    Task<VoucherResponse> GetVouchers(DateTime startDate, DateTime endDate, string voucherType);
    Task<VoucherDetailResponse> GetVoucherDetails(Guid id);
    Task<VoucherDetailResponse> CreateVoucher(object dto);
    Task<BaseApiResponse> UpdateVoucher(object dto, Guid? id = null);
    Task<BaseApiResponse> DeleteVoucher(object dto);
    Task<BaseApiResponse> PostVoucher(object dto);
    

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
    Task<ArQuotationPdfResponse> GetArQuotationDetails(Guid id);
    Task<ArAgingResponse> GetArAgingSummary(DateTime startDate, int agingInterval);
    Task<ArAgingResponse> GetArAgingByCustomer(Guid customerId, DateTime startDate, int agingInterval);
    Task<ArGlTransactionResponse> GetArGlTransaction(DateTime startDate, DateTime endDate, bool isMultiCurrency);

    //School manager
    //academic year
    Task<AcademicYearResponse> GetAcademicYears();
    Task<BaseApiResponse> CreateAcademicYear(object dto);
    Task<BaseApiResponse> UpdateAcademicYear(object dto);
    Task<BaseApiResponse> DeleteAcademicYear(Guid id);
    Task<AcademicYearTermResponse> GetAcademicYearTerms();
    Task<BaseApiResponse> CreateAcademicYearTerm(object dto);
    Task<BaseApiResponse> UpdateAcademicYearTerm(object dto);
    Task<BaseApiResponse> DeleteAcademicYearTerm(Guid id);
    Task<AcademicYearTermDetailResponse> AcademicYearTermDetails();
    Task<BaseApiResponse> CreateAcademicYearTermDetail(object dto);
    Task<BaseApiResponse> UpdateAcademicYearTermDetail(object dto);
    Task<BaseApiResponse> DeleteAcademicYearTermDetail(Guid id);

    Task<CurrentAcademicYearResponse> GetCurrentAcademicYear();

    //streams
    Task<SmSimpleInputResponse> GetStreams();
    Task<BaseApiResponse> CreateStream(object dto);
    Task<BaseApiResponse> UpdateStream(object dto);
    Task<BaseApiResponse> DeleteStream(Guid id);
    //class
    Task<SmSimpleInputResponse> GetClasses();
    Task<BaseApiResponse> CreateClass(object dto);
    Task<BaseApiResponse> UpdateClass(object dto);
    Task<BaseApiResponse> DeleteClass(Guid id);
    //levels
    Task<LevelResponse> GetLevels();
    Task<BaseApiResponse> CreateLevel(object dto);
    Task<BaseApiResponse> UpdateLevel(object dto);
    Task<BaseApiResponse> DeleteLevel(Guid id);
    //level classes
    Task<LevelClassResponse> GetLevelClasses();
    Task<BaseApiResponse> CreateLevelClass(object dto);
    Task<BaseApiResponse> UpdateLevelClass(object dto);
    Task<BaseApiResponse> DeleteLevelClass(Guid id);
   
    //DisciplinaryAction
    Task<DisciplinaryActionResponse> GetDisciplinaryActions();
    Task<BaseApiResponse> CreateDisciplinaryAction(object dto);
    Task<BaseApiResponse> UpdateDisciplinaryAction(object dto);
    Task<BaseApiResponse> DeleteDisciplinaryAction(Guid id);
    
    Task<StudentDisciplinaryActionResponse> GetStDisciplinaryActions();
    Task<BaseApiResponse> CreateStDisciplinaryAction(object dto);
    Task<BaseApiResponse> UpdateStDisciplinaryAction(object dto);
    Task<BaseApiResponse> DeleteStDisciplinaryAction(Guid id);
    
    //Offence
    Task<SmSimpleInputResponse> GetOffences();
    Task<BaseApiResponse> CreateOffence(object dto);
    Task<BaseApiResponse> UpdateOffence(object dto);
    Task<BaseApiResponse> DeleteOffence(Guid id);
 
    //PerformanceArea
    Task<SmSimpleInputResponse> GetPerformanceAreas();
    Task<BaseApiResponse> CreatePerformanceArea(object dto);
    Task<BaseApiResponse> UpdatePerformanceArea(object dto);
    Task<BaseApiResponse> DeletePerformanceArea(Guid id);
  
    Task<PerformanceSkillResponse> GetPerformanceSkills();
    Task<BaseApiResponse> CreatePerformanceSkill(object dto);
    Task<BaseApiResponse> UpdatePerformanceSkill(object dto);
    Task<BaseApiResponse> DeletePerformanceSkill(Guid id);
    
    Task<StudentPerformanceSkillResponse> GetStPerformanceSkills();
    Task<BaseApiResponse> CreateStPerformanceSkill(object dto);
    Task<BaseApiResponse> UpdateStPerformanceSkill(object dto);
    Task<BaseApiResponse> DeleteStPerformanceSkill(Guid id);
    
    //Assignments
    Task<ClassAssignmentResponse> GetResults();
    Task<BaseApiResponse> CreateResult(object dto);
    Task<BaseApiResponse> UpdateResult(object dto);
    Task<BaseApiResponse> DeleteResult(Guid id);
    
    Task<ResultPeriodResponse> GetResultPeriods();
    Task<BaseApiResponse> CreateResultPeriod(object dto);
    Task<BaseApiResponse> UpdateResultPeriod(object dto);
    Task<BaseApiResponse> DeleteResultPeriod(Guid id);
    
    //AssignedSubject
    Task<AssignedSubjectResponse> GetAssignedSubjects();
    Task<BaseApiResponse> CreateAssignedSubject(object dto);
    Task<BaseApiResponse> UpdateAssignedSubject(object dto);
    Task<BaseApiResponse> DeleteAssignedSubject(Guid id);
    
    //AwardAndPrize
     Task<SmSimpleInputResponse> GetAwardTypes();
     Task<BaseApiResponse> CreateAwardType(object dto);
     Task<BaseApiResponse> UpdateAwardType(object dto);
     Task<BaseApiResponse> DeleteAwardType(Guid id);
     
     Task<SmSimpleInputResponse> GetPrizeTypes();
     Task<BaseApiResponse> CreatePrizeType(object dto);
     Task<BaseApiResponse> UpdatePrizeType(object dto);
     Task<BaseApiResponse> DeletePrizeType(Guid id);
     
     Task<PrizeAwardedResponse> GetPrizeAwards();
     Task<BaseApiResponse> CreatePrizeAward(object dto);
     Task<BaseApiResponse> UpdatePrizeAward(object dto);
     Task<BaseApiResponse> DeletePrizeAward(Guid id);
     
     //BehavioralAssessment
     Task<BehavioralAssessmentResponse> GetBehavioralAssessments();
     Task<BaseApiResponse> CreateBehavioralAssessment(object dto);
     Task<BaseApiResponse> UpdateBehavioralAssessment(object dto);
     Task<BaseApiResponse> DeleteBehavioralAssessment(Guid id);
     
     //BillFooter
     Task<BillFooterResponse> GetBillFooters();
     Task<BaseApiResponse> CreateBillFooter(object dto);
     Task<BaseApiResponse> UpdateBillFooter(object dto);
     Task<BaseApiResponse> DeleteBillFooter(Guid id);
     
     //CategoryPercentage
     Task<CategoryPercentageResponse> GetCategoryPercentages();
     Task<BaseApiResponse> CreateCategoryPercentage(object dto);
     Task<BaseApiResponse> UpdateCategoryPercentage(object dto);
     Task<BaseApiResponse> DeleteCategoryPercentage(Guid id);
     
     //Certificate
     Task<SmSimpleInputResponse> GetCertificates();
     Task<BaseApiResponse> CreateCertificate(object dto);
     Task<BaseApiResponse> UpdateCertificate(object dto);
     Task<BaseApiResponse> DeleteCertificate(Guid id);
     
     //ChangeStudentStatus
     Task<BaseApiResponse> CreateStudentStatus(object dto);
     Task<BaseApiResponse> UpdateStudentStatus(object dto);
     
     //Attendance
     Task<AttendanceResponse> GetAttendances();
     Task<BaseApiResponse> CreateAttendance(object dto);
     Task<BaseApiResponse> UpdateAttendance(object dto);
     Task<BaseApiResponse> DeleteAttendance(Guid id);
     
     Task<CumulativeAttendanceResponse> GetCumulativeAttendances();
     Task<BaseApiResponse> CreateCumulativeAttendance(object dto);
     Task<BaseApiResponse> UpdateCumulativeAttendance(object dto);
     Task<BaseApiResponse> DeleteCumulativeAttendance(Guid id);
     
     //ClassLevelPercentage
     Task<ClassLevelPercentageResponse> GetClassLevelPercentages();
     Task<BaseApiResponse> CreateClassLevelPercentage(object dto);
     Task<BaseApiResponse> UpdateClassLevelPercentage(object dto);
     Task<BaseApiResponse> DeleteClassLevelPercentage(Guid id);
     
     //ClassPromotion
     Task<ClassPromotionResponse> GetClassPromotions();
     Task<BaseApiResponse> CreateClassPromotion(object dto);
     Task<BaseApiResponse> UpdateClassPromotion(object dto);
     
     //ClassRoom
     Task<SmSimpleInputResponse> GetClassRooms();
     Task<BaseApiResponse> CreateClassRoom(object dto);
     Task<BaseApiResponse> UpdateClassRoom(object dto);
     Task<BaseApiResponse> DeleteClassRoom(Guid id);
     
     //SmCreditMemo
     Task<SchCreditMemoResponse> GetSchCreditMemos();
     Task<BaseApiResponse> CreateSchCreditMemo(object dto);
     Task<BaseApiResponse> UpdateSchCreditMemo(object dto);
     Task<BaseApiResponse> CancelSchCreditMemo(List<Guid> memoIds);
 
     //Excursion
     Task<ExcursionResponse> GetExcursions();
     Task<BaseApiResponse> CreateExcursion(object dto);
     Task<BaseApiResponse> UpdateExcursion(object dto);
     Task<BaseApiResponse> DeleteExcursion(Guid id);
     
     //FeesDescription
     Task<FeesDescriptionResponse> GetFeesDescriptions();
     Task<BaseApiResponse> CreateFeesDescription(object dto);
     Task<BaseApiResponse> UpdateFeesDescription(object dto);
     Task<BaseApiResponse> DeleteFeesDescription(Guid id);
     
     //FeeSetUp
     Task<FeeSetUpResponse> GetFees();
     Task<BaseApiResponse> CreateFee(object dto);
     Task<BaseApiResponse> UpdateFee(object dto);
     Task<BaseApiResponse> DeleteFee(Guid id);
     
     Task<SmSimpleInputResponse> GetBoardingItems();
     Task<BaseApiResponse> CreateBoardingItem(object dto);
     Task<BaseApiResponse> UpdateBoardingItem(object dto);
     Task<BaseApiResponse> DeleteBoardingItem(Guid id);
     
     Task<BoardingFeeResponse> GetBoardingFees();
     Task<BaseApiResponse> CreateBoardingFee(object dto);
     Task<BaseApiResponse> UpdateBoardingFee(object dto);
     Task<BaseApiResponse> DeleteBoardingFee(Guid id);
     
     //Health
     Task<SmSimpleInputResponse> GetHealths();
     Task<BaseApiResponse> CreateHealth(object dto);
     Task<BaseApiResponse> UpdateHealth(object dto);
     Task<BaseApiResponse> DeleteHealth(Guid id);
     
     //Hostel
     Task<HostelResponse> GetHostels();
     Task<BaseApiResponse> CreateHostel(object dto);
     Task<BaseApiResponse> UpdateHostel(object dto);
     Task<BaseApiResponse> DeleteHostel(Guid id);
      
     //House
     Task<SmSimpleInputResponse> GetHouses();
     Task<BaseApiResponse> CreateHouse(object dto);
     Task<BaseApiResponse> UpdateHouse(object dto);
     Task<BaseApiResponse> DeleteHouse(Guid id);
     
     //Location
     Task<SmSimpleInputResponse> GetLocations();
     Task<BaseApiResponse> CreateLocation(object dto);
     Task<BaseApiResponse> UpdateLocation(object dto);
     Task<BaseApiResponse> DeleteLocation(Guid id);
     
     //MidTermAssessment
     Task<AssessmentRemarkHeaderResponse> GetAssessmentRemarkHeaders();
     Task<BaseApiResponse> CreateAssessmentRemarkHeader(object dto);
     Task<BaseApiResponse> UpdateAssessmentRemarkHeader(object dto);
     Task<BaseApiResponse> DeleteAssessmentRemarkHeader(Guid id);
     
     Task<MidTermAssessmentResponse> GetMidTermAssessments();
     Task<BaseApiResponse> CreateMidTermAssessment(object dto);
     Task<BaseApiResponse> UpdateMidTermAssessment(object dto);
     Task<BaseApiResponse> DeleteMidTermAssessment(Guid id);
     
     //SmOpeningBalance
     Task<StudentOpeningBalanceResponse> GetSmOpeningBalances();
     Task<BaseApiResponse> CreateSmOpeningBalance(object dto);
     Task<BaseApiResponse> UpdateSmOpeningBalance(object dto);
     Task<BaseApiResponse> DeleteSmOpeningBalance(Guid id);
     Task<BaseApiResponse> PostSmOpeningBalance(List<Guid> balanceIds);
     
     //ParentProfession
     Task<SmSimpleInputResponse> GetParentProfessions();
     Task<BaseApiResponse> CreateParentProfession(object dto);
     Task<BaseApiResponse> UpdateParentProfession(object dto);
     Task<BaseApiResponse> DeleteParentProfession(Guid id);
     
     //SmPayment
     Task<SchPaymentResponse> GetSchPayments();
     Task<BaseApiResponse> CreateSchPayment(object dto);
     Task<BaseApiResponse> UpdateSchPayment(object dto);
     Task<BaseApiResponse> ProcessSchPayments(List<Guid> paymentIds);
     Task<BaseApiResponse> CancelSchPayments(List<Guid> paymentIds);
     
     //PostToGl
     Task<BaseApiResponse> PostBills(List<Guid> billIds);
     Task<BaseApiResponse> PostSchPayments(List<Guid> billIds);
     Task<BaseApiResponse> PostSchCreditMemos(List<Guid> memoIds);
     
     //ProcessBill
     Task<BillResponse> GetBills();
     Task<StudentBillInfoResponse> GetStudentBills();
     Task<BaseApiResponse> CreateBill(object dto);
     Task<BaseApiResponse> UpdateBill(object dto);
     Task<BaseApiResponse> CancelStudentBills(object dto);
 
     
     //PtaExecutive
     Task<PtaExecutiveResponse> GetPtaExecutives();
     Task<BaseApiResponse> CreatePtaExecutive(object dto);
     Task<BaseApiResponse> UpdatePtaExecutive(object dto);
     Task<BaseApiResponse> DeletePtaExecutive(Guid id);
     
     //PtaPosition
     Task<SmSimpleInputResponse> GetPtaPositions();
     Task<BaseApiResponse> CreatePtaPosition(object dto);
     Task<BaseApiResponse> UpdatePtaPosition(object dto);
     Task<BaseApiResponse> DeletePtaPosition(Guid id);
     
     //RegisterClass
     Task<RegisteredClassResponse> GetRegisteredClasses();
     Task<BaseApiResponse> CreateRegisteredClass(object dto);
     Task<BaseApiResponse> UpdateRegisteredClass(object dto);
     Task<BaseApiResponse> DeleteRegisteredClass(Guid id);
     
     //RemarkByTeacher
     Task<RemarksByTeacherResponse> GetRemarksByTeachers();
     Task<BaseApiResponse> CreateRemarksByTeacher(object dto);
     Task<BaseApiResponse> UpdateRemarksByTeacher(object dto);
     
     //SchGlAccounts
     Task<SchBillAccountResponse> GetSchBillAccounts();
     Task<BaseApiResponse> CreateSchBillAccount(object dto);
     Task<BaseApiResponse> UpdateSchBillAccount(object dto);
     Task<BaseApiResponse> DeleteSchBillAccount(Guid id);
     
     Task<SchPaymentAccountResponse> GetSchPaymentAccounts();
     Task<BaseApiResponse> CreateSchPaymentAccount(object dto);
     Task<BaseApiResponse> UpdateSchPaymentAccount(object dto);
     Task<BaseApiResponse> DeleteSchPaymentAccount(Guid id);
     
     Task<SchCreditMemoAccountResponse> GetSchCreditMemoAccounts();
     Task<BaseApiResponse> CreateSchCreditMemoAccount(object dto);
     Task<BaseApiResponse> UpdateSchCreditMemoAccount(object dto);
     Task<BaseApiResponse> DeleteSchCreditMemoAccount(Guid id);
     
     //SchoolGroup
     Task<SchoolGroupResponse> GetSchoolGroups();
     Task<BaseApiResponse> CreateSchoolGroup(object dto);
     Task<BaseApiResponse> UpdateSchoolGroup(object dto);
     Task<BaseApiResponse> DeleteSchoolGroup(Guid id);
     
     //SchoolProfile
     Task<SchoolProfileResponse> GetSchoolProfile();
     Task<BaseApiResponse> CreateSchoolProfile(object dto);
     Task<BaseApiResponse> UpdateSchoolProfile(object dto);
    
     //StaffBio
     Task<StaffBioResponse> GetStaffBios();
     Task<BaseApiResponse> CreateStaffBio(object dto);
     Task<BaseApiResponse> UpdateStaffBio(object dto);
     Task<BaseApiResponse> DeleteStaffBio(Guid id);
     
     //StaffDesignation
     Task<SmSimpleInputResponse> GetStaffDesignations();
     Task<BaseApiResponse> CreateStaffDesignation(object dto);
     Task<BaseApiResponse> UpdateStaffDesignation(object dto);
     Task<BaseApiResponse> DeleteStaffDesignation(Guid id);
     
     //StaffGrade
     Task<SmSimpleInputResponse> GetStaffGrades();
     Task<BaseApiResponse> CreateStaffGrade(object dto);
     Task<BaseApiResponse> UpdateStaffGrade(object dto);
     Task<BaseApiResponse> DeleteStaffGrade(Guid id);
     
     //StaffPastEmployment
     Task<StaffPastEmploymentResponse> GetStaffPastEmployments();
     Task<BaseApiResponse> CreateStaffPastEmployment(object dto);
     Task<BaseApiResponse> UpdateStaffPastEmployment(object dto);
     Task<BaseApiResponse> DeleteStaffPastEmployment(Guid id);
     
     //StaffPastPosition
     Task<StaffPastPositionResponse> GetStaffPastPositions();
     Task<BaseApiResponse> CreateStaffPastPosition(object dto);
     Task<BaseApiResponse> UpdateStaffPastPosition(object dto);
     Task<BaseApiResponse> DeleteStaffPastPosition(Guid id);
     
     //StaffQualification
     Task<StaffQualificationResponse> GetStaffQualifications();
     Task<BaseApiResponse> CreateStaffQualification(object dto);
     Task<BaseApiResponse> UpdateStaffQualification(object dto);
     Task<BaseApiResponse> DeleteStaffQualification(Guid id);
     
     //StaffRelationship
     Task<StaffRelationshipResponse> GetStaffRelationships();
     Task<BaseApiResponse> CreateStaffRelationship(object dto);
     Task<BaseApiResponse> UpdateStaffRelationship(object dto);
     Task<BaseApiResponse> DeleteStaffRelationship(Guid id);
     
     //StContactRelationship
     Task<StContactRelationshipResponse> GetStContactRelationships();
     Task<BaseApiResponse> CreateStContactRelationship(object dto);
     Task<BaseApiResponse> UpdateStContactRelationship(object dto);
     Task<BaseApiResponse> DeleteStContactRelationship(Guid id);
     
     //StudentAllergy
     Task<SmSimpleInputResponse> GetAllergyTypes();
     Task<BaseApiResponse> CreateAllergyType(object dto);
     Task<BaseApiResponse> UpdateAllergyType(object dto);
     Task<BaseApiResponse> DeleteAllergyType(Guid id);
     
     Task<StudentAllergyResponse> GetStudentAllergies(Guid studentId);
     Task<BaseApiResponse> CreateStudentAllergy(object dto);
     Task<BaseApiResponse> UpdateStudentAllergy(object dto);
     Task<BaseApiResponse> DeleteStudentAllergy(Guid id);
     
     //StudentBio
     Task<StudentInfoResponse> GetStudentBios();
     Task<BaseApiResponse> CreateStudentBio(object dto);
     Task<BaseApiResponse> UpdateStudentBio(object dto);
     Task<BaseApiResponse> DeleteStudentBio(Guid id);
     
     //StudentDisability
     Task<SmSimpleInputResponse> GetDisabilityTypes();
     Task<BaseApiResponse> CreateDisabilityType(object dto);
     Task<BaseApiResponse> UpdateDisabilityType(object dto);
     Task<BaseApiResponse> DeleteDisabilityType(Guid id);
     
     Task<StudentDisabilityResponse> GetStudentDisabilities(Guid studentId);
     Task<BaseApiResponse> CreateStudentDisability(object dto);
     Task<BaseApiResponse> UpdateStudentDisability(object dto);
     Task<BaseApiResponse> DeleteStudentDisability(Guid id);
     
     //StudentImmunization
     Task<SmSimpleInputResponse> GetImmunizationTypes();
     Task<BaseApiResponse> CreateImmunizationType(object dto);
     Task<BaseApiResponse> UpdateImmunizationType(object dto);
     Task<BaseApiResponse> DeleteImmunizationType(Guid id);
     
     Task<StudentImmunizationResponse> GetStudentImmunizations(Guid studentId);
     Task<BaseApiResponse> CreateStudentImmunization(object dto);
     Task<BaseApiResponse> UpdateStudentImmunization(object dto);
     Task<BaseApiResponse> DeleteStudentImmunization(Guid id);
     
     //StudentMedical
     Task<StudentMedicalResponse> GetStudentMedicals(Guid studentId);
     Task<BaseApiResponse> CreateStudentMedical(object dto);
     Task<BaseApiResponse> UpdateStudentMedical(object dto);
     Task<BaseApiResponse> DeleteStudentMedical(Guid id);
     
     //StudentPosition
      Task<SmSimpleInputResponse> GetPositionTypes();
      Task<BaseApiResponse> CreatePositionType(object dto);
      Task<BaseApiResponse> UpdatePositionType(object dto);
      Task<BaseApiResponse> DeletePositionType(Guid id);
          
     Task<StudentPositionResponse> GetStudentPositions(Guid studentId);
     Task<BaseApiResponse> CreateStudentPosition(object dto);
     Task<BaseApiResponse> UpdateStudentPosition(object dto);
     Task<BaseApiResponse> DeleteStudentPosition(Guid id);
     Task<StudentPositionResponse> GetStudentPositions();
     
     //StudentPromotion
     Task<StudentPromotionResponse> GetStudentPromotions();
     Task<BaseApiResponse> CreateStudentPromotion(object dto);
     Task<BaseApiResponse> UpdateStudentPromotion(object dto);
     
     Task<PreClassStudentPromotionResponse> GetPreClassStudentPromotions();
     Task<BaseApiResponse> CreatePreClassStudentPromotion(object dto);
     Task<BaseApiResponse> UpdatePreClassStudentPromotion(object dto);
     
     //SubjectRemark
      Task<SubjectRemarkResponse> GetSubjectRemarks();
      Task<BaseApiResponse> CreateSubjectRemark(object dto);
      Task<BaseApiResponse> UpdateSubjectRemark(object dto);
      Task<BaseApiResponse> DeleteSubjectRemark(Guid id);
     
     //Subject
     Task<SubjectResponse> GetSubjects();
     Task<BaseApiResponse> CreateSubject(object dto);
     Task<BaseApiResponse> UpdateSubject(object dto);
     Task<BaseApiResponse> DeleteSubject(Guid id);
     
     //SupplementaryItem
     Task<SupplementaryItemResponse> GetSupplementaryItems();
     Task<BaseApiResponse> CreateSupplementaryItem(object dto);
     Task<BaseApiResponse> UpdateSupplementaryItem(object dto);
     Task<BaseApiResponse> DeleteSupplementaryItem(Guid id);
     
     //TeacherClass
     Task<TeacherClassResponse> GetTeacherClasses();
     Task<BaseApiResponse> CreatTeacherClass(object dto);
     Task<BaseApiResponse> UpdateTeacherClass(object dto);
     Task<BaseApiResponse> DeleteTeacherClass(Guid id);
     
     //TeacherSubject
     Task<TeacherSubjectResponse> GetTeacherSubjects();
     Task<BaseApiResponse> CreateTeacherSubject(object dto);
     Task<BaseApiResponse> UpdateTeacherSubject(object dto);
     Task<BaseApiResponse> DeleteTeacherSubject(Guid id);
          
     //TimeTable
     Task<TimeTableResponse> GetTimeTables();
     Task<BaseApiResponse> CreateTimeTable(object dto);
     Task<BaseApiResponse> UpdateTimeTable(object dto);
     Task<BaseApiResponse> DeleteTimeTable(Guid id);  
     
    
          
          
}
    