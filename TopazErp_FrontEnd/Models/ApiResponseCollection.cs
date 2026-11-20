using Newtonsoft.Json;

namespace TopazErp_FrontEnd.Models;

public class ApiResponseCollection
{
    
}
public class SystemNumberResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SystemNumber> Result { get; set; }
}


public class CostCenterResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<CostCenter> Result { get; set; }
}

public class CustomerGroupResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<CustomerGroup> Result { get; set; }
}

public class CustomerResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Customer> Result { get; set; }
}

public class CustomersResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Customer> Result { get; set; }
}

public class CustomerDetailResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public Customer? Result { get; set; }
}

public class SupplierResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Supplier> Result { get; set; }
}

public class SuppliersResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Supplier> Result { get; set; }
}

public class SupplierDetailResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public Supplier? Result { get; set; }
}

public class SupplierGroupResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SupplierGroup> Result { get; set; }
}

public class DepartmentResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Department> Result { get; set; }
}




public class TaxLevyResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<TaxLevy> Result { get; set; }
}



public class CurrencyResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Currency> Result { get; set; }
}
public class JournalTransactionResponse: BaseApiResponseModel
{
    [JsonProperty("result")]    
    public JournalTransactionPagedResult Result { get; set; }
    
}

public class VoucherResponse: BaseApiResponseModel
{
    [JsonProperty("result")]  
    public List<Voucher> Result { get; set; }
    
}

public class AuditLogResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<AuditLog> Result { get; set; }
}
public class BudgetResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<Budget> Result { get; set; }
}


public class PettyCashRecipientResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<PettyCashRecipient> Result { get; set; }
}

public class PettyCashResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<PettyCash> Result { get; set; }
}


public class ImprestCategoryResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ImprestCategory> Result { get; set; }
}

public class ImprestResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Imprest> Result { get; set; }
}

public class DefaultGLNumbersResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public DefaultGLNumbers Result { get; set; }
}



public class EmployeeBioDataResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<EmployeeBioData> Result { get; set; }
}

public class EmployeeSsnitDataResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<EmployeeSnit> Result { get; set; }
}

public class EmployeeSsnitDetailsResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public EmployeeSnit Result { get; set; }
}

public class EmployeeSalaryInfoResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<EmployeeSalaryInfo> Result { get; set; }
}

public class EmployeeSalaryDataResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public EmployeeSalaryInfo Result { get; set; }
}

public class SubscriptionInfoResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public SubscriptionInfo Result { get; set; }
}

public class AllowanceTypeResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<AllowanceType> Result { get; set; }
}

public class AllowanceTypeDetailResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public AllowanceType Result { get; set; }
}

public class EmployeeCategoryResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<EmployeeCategory> Result { get; set; }
}


public class BikTypeResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<BikType> Result { get; set; }
}

public class BikTypeDetailResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public BikType Result { get; set; }
}


public class DeductionTypeResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<DeductionType> Result { get; set; }
}

public class DeductionTypeDetailResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public DeductionType Result { get; set; }
}

public class OvertimeTypeResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<OvertimeType> Result { get; set; }
}

public class OvertimeTypeDetailResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public OvertimeType Result { get; set; }
}

public class LoanTypeResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<LoanType> Result { get; set; }
}

public class EmployeeRankResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<EmployeeRank> Result { get; set; }
}

public class TaxReliefResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<TaxRelief> Result { get; set; }
}

public class TaxTableResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<TaxTable> Result { get; set; }
}


public class GratuityResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<Gratuity> Result { get; set; }
}

public class PayCalendarResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<PayCalendar> Result { get; set; }
}

public class AccountHeadResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<AccountHead> Result { get; set; }
}

public class BankResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Bank> Result { get; set; }
}

public class CompanyProfileResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public CompanyProfile Result { get; set; }
}

public class BankAccountResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<BankAccount> Result { get; set; }
}

public class CoaControlResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<CoaControl> Result { get; set; }
}

public class CoaControlListResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<CoaControl> Result { get; set; }
}

public class CoaDetailResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<CoaDetail> Result { get; set; }
}

public class CheckCoaDetailResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public CoaDetail Result { get; set; }
}

//API Response for AP
//opening balance
public class ApOpeningBalanceResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
     public List<ApOpeningBalance> Result { get; set; }
}
//ApInvoice
public class ApInvoiceResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ApInvoice> Result { get; set; }
}
//ApPayment
public class ApPaymentResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ApPayment> Result { get; set; }
}
//debitmemo
public class DebitMemoResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ApDebitMemo> Result { get; set; }
}
//apvoucher
public class ApVoucherResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ApVoucher> Result { get; set; }
}
//reports
public class ReportHeaderResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ReportHeader> Result { get; set; }
}
public class ApAgingResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ApAgingData> Result { get; set; }
}
public class ApStatementResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ApStatementRecord> Result { get; set; }
}
public class ApPaymentReceiptResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ApPaymentReceipt> Result { get; set; }
}
public class ApPaymentReportResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ApPaymentReport> Result { get; set; }
}
public class ApGlTransactionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ApGlTransactions> Result { get; set; }
}
public class ApInvoiceReportResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ApInvoiceReport> Result { get; set; }
}
public class ApInvoicePdfResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public InvoicePdfData Result { get; set; }
}

//API Response for AR
//opening balance
public class ArOpeningBalanceResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ArOpeningBalance> Result { get; set; }
}
//ArInvoice
public class ArInvoiceResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ArInvoice> Result { get; set; }
}
//ArPayment
public class ArPaymentResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ArPayment> Result { get; set; }
}
//creditmemo
public class CreditMemoResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ArCreditMemo> Result { get; set; }
}
//quotation
public class QuotationResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Quotation> Result { get; set; }
}
//reports
public class ArAgingResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ArAgingData> Result { get; set; }
}
public class ArStatementResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ArStatementRecord> Result { get; set; }
}
public class ArPaymentReceiptResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ArPaymentReceipt> Result { get; set; }
}
public class ArPaymentReportResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ArPaymentReport> Result { get; set; }
}
public class ArGlTransactionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ArGlTransactions> Result { get; set; }
}
public class ArInvoiceReportResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ArInvoiceReport> Result { get; set; }
}
public class ArInvoicePdfResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public ArInvoicePdfData Result { get; set; }
}
public class ArQuotationPdfResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public QuotationData Result { get; set; }
}

//SchoolManager
public class SmSimpleInputResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SimpleSmInputs> Result { get; set; }
}
public class AcademicYearResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<AcademicYear> Result { get; set; }
}
public class CurrentAcademicYearResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public CurrentAcademicYear Result { get; set; }
}
public class AcademicYearTermResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<AcademicYearTerm> Result { get; set; }
}
public class AcademicYearTermDetailResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<AcademicYearTermDetail> Result { get; set; }
}
public class AssessmentRemarkHeaderResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<AssessmentRemarkHeader> Result { get; set; }
}
public class AssignedSubjectResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<AssignedSubject> Result { get; set; }
}
public class AttendanceResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Attendance> Result { get; set; }
}
public class BehavioralAssessmentResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<BehavioralAssessment> Result { get; set; }
}
public class BillResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Bill> Result { get; set; }
}
public class BillFooterResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<BillFooter> Result { get; set; }
}
public class BoardingFeeResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<BoardingFee> Result { get; set; }
}
public class CategoryPercentageResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<CategoryPercentage> Result { get; set; }
}
public class ClassAssignmentResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ClassAssignment> Result { get; set; }
}
public class ClassLevelPercentageResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ClassLevelPercentage> Result { get; set; }
}
public class ClassPromotionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ClassPromotion> Result { get; set; }
}
public class ConductCutOfResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ConductCutOf> Result { get; set; }
}
public class CumulativeAttendanceResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<CumulativeAttendance> Result { get; set; }
}
public class DistanceGroupResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<DistanceGroup> Result { get; set; }
}
public class DisciplinaryActionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<DisciplinaryAction> Result { get; set; }
}
public class DistanceUnitResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<DistanceUnit> Result { get; set; }
}
public class ExcursionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Excursion> Result { get; set; }
}
public class FeesDescriptionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<FeesDescription> Result { get; set; }
}
public class FeeSetUpResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<FeeSetUp> Result { get; set; }
}
public class HostelResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Hostel> Result { get; set; }
}
public class LevelResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Level> Result { get; set; }
}
public class LevelClassResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<LevelClass> Result { get; set; }
}
public class MidTermAssessmentResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<MidTermAssessment> Result { get; set; }
}
public class PerformanceSkillResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<PerformanceSkill> Result { get; set; }
}
public class PreClassStudentPromotionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<PreClassStudentPromotion> Result { get; set; }
}
public class PrizeAwardedResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<PrizeAwarded> Result { get; set; }
}
public class RegisteredClassResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<RegisteredClass> Result { get; set; }
}
public class RemarksByTeacherResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<RemarksByTeacher> Result { get; set; }
}
public class RepeatedStudentResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<RepeatedStudent> Result { get; set; }
}
public class ResultPeriodResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<ResultPeriod> Result { get; set; }
}
public class SchBillAccountResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SchBillAccount> Result { get; set; }
}
public class SchCreditMemoResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SchCreditMemo> Result { get; set; }
}
public class SchCreditMemoAccountResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SchCreditMemoAccount> Result { get; set; }
}
public class SchoolGroupResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SchoolGroup> Result { get; set; }
}
public class SchoolGroupPositionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SchoolGroupPosition> Result { get; set; }
}
public class SchoolProfileResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public SchoolProfile Result { get; set; }
}
public class SchPaymentResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SchPayment> Result { get; set; }
}
public class SchPaymentAccountResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SchPaymentAccount> Result { get; set; }
}
public class StaffBioResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StaffBio> Result { get; set; }
}
public class StaffPastEmploymentResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StaffPastEmployment> Result { get; set; }
}
public class StaffPastPositionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StaffPastPosition> Result { get; set; }
}
public class StaffQualificationResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StaffQualification> Result { get; set; }
}
public class StaffRelationshipResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StaffRelationship> Result { get; set; }
}
public class StatusChangeResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StatusChange> Result { get; set; }
}
public class StContactRelationshipResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StContactRelationship> Result { get; set; }
}
public class StudentAllergyResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StudentAllergy> Result { get; set; }
}
public class StudentBillInfoResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StudentBillInfo> Result { get; set; }
}
public class StudentDisabilityResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StudentDisability> Result { get; set; }
}
public class StudentDisciplinaryActionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StudentDisciplinaryAction> Result { get; set; }
}
public class StudentImmunizationResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StudentImmunization> Result { get; set; }
}
public class StudentInfoResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StudentInfo> Result { get; set; }
}
public class StudentMedicalResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StudentMedical> Result { get; set; }
}
public class StudentOpeningBalanceResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StudentOpeningBalance> Result { get; set; }
}
public class StudentPerformanceSkillResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StudentPerformanceSkill> Result { get; set; }
}
public class StudentPositionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StudentPosition> Result { get; set; }
}
public class StudentPromotionResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<StudentPromotion> Result { get; set; }
}
public class SubjectResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<Subject> Result { get; set; }
}
public class SubjectRemarkResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SubjectRemark> Result { get; set; }
}
public class SupplementaryItemResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<SupplementaryItem> Result { get; set; }
}
public class TeacherClassResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<TeacherClass> Result { get; set; }
}
public class TeacherSubjectResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<TeacherSubject> Result { get; set; }
}
public class TerminalSubjectResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<TerminalSubject> Result { get; set; }
}
public class TerminalSubSubjectResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<TerminalSubSubject> Result { get; set; }
}
public class TimeTableResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<TimeTable> Result { get; set; }
}
public class TransportationBillResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<TransportationBill> Result { get; set; }
}
public class TransportationLocationResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<TransportationLocation> Result { get; set; }
}
public class TransportationUnitResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<TransportationUnit> Result { get; set; }
}
public class ExistingBillResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public ExistingBill Result { get; set; }
}
public class PtaExecutiveResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<PtaExecutive> Result { get; set; }
}