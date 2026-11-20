namespace TopazErp_FrontEnd.Models;

public class SmModelCollection
{
    
}
public class SimpleSmInputs : AuditedEntity<Guid>
{
    public string Name { get; set; }
    public int TenantId { get; set; }
}
public class AcademicYear : AuditedEntity<Guid>
{
    public string Name { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public int TenantId { get; set; }

}
public class AcademicYearTerm : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid TermId { get; set; }
    public string TermName { get; set; }
    public int Ordinal { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public Guid ActualLevelId { get; set; }
    public string ActualLevelName { get; set; }
    public int TenantId { get; set; }
}
public class CurrentAcademicYear
{
    public string AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public string TermId { get; set; }
    public string TermName { get; set; }
}
public class AcademicYearTermDetail : AuditedEntity<Guid>
{
    public Guid AcademicYearTermId { get; set; }
    public string AcademicYearTermName { get; set; }
    public string ActivityDescription { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TenantId { get; set; }
}
public class Assessment
{
    public Guid Id { get; set; }
    public Guid MidTermAssessmentId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<AssessmentRemarkHeader> Headers { get; set; }
}
public class AssessmentRemarkHeader : AuditedEntity<Guid>
{
    public string Name { get; set; }
    public int TenantId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<AssessmentRemarkOption> Options { get; set; }
}
public class AssessmentRemarkOption
{
    public Guid Id { get; set; }
    public Guid RemarkId { get; set; }
    public string Option { get; set; }
}
public class AssignedSubject : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public Guid TermId { get; set; }
    public string TermName { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<AssignedSubjectsDetail> Details { get; set; }
    public int TenantId { get; set; }
}
public class AssignedSubjectsDetail
{
    public Guid Id { get; set; }
    public Guid AssignedSubjectId { get; set; }
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; }
}
public class AssignmentImport
{
    public Guid Id { get; set; }
    public Guid ClassAssignmentId { get; set; }
    public string StudentIdentifier { get; set; }
    public string StudentName { get; set; }
    public decimal Marks { get; set; }
}
public class Attendance : AuditedEntity<Guid>
{
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public DateTime Date { get; set; }
    public Guid StudentId { get; set; }
    public string StudentIdentifier { get; set; }
    public string StudentName { get; set; }
    public bool IsPresent { get; set; }
    public int TenantId { get; set; }

}
public class BehavioralAssessment : AuditedEntity<Guid>
{
    public int TenantId { get; set; }

    public Guid ClassId { get; set; }
    public string ClassName { get; set; }

    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }

    public Guid TermId { get; set; }
    public string TermName { get; set; }
    public string AssessmentType { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<BehavioralAssessmentImport> Assessments { get; set; }
}
public class BehavioralAssessmentImport
{
    public Guid Id { get; set; }
    public string BehavioralAssessmentId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public string StudentIdentifier { get; set; }
    public string Description { get; set; }
}
public class BestSubjectsDetail
{
    public Guid Id { get; set; }
    public Guid BestSubjectId { get; set; }
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; }
}
public class Bill : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public Guid ClassId { get; set; }
    public Guid LevelId { get; set; }
    public string BillNumber { get; set; }
    public DateTime BillDate { get; set; }
    public int BillingScopeId { get; set; }
    public bool IsProcessed { get; set; }
    public bool IsPosted { get; set; }
    public bool IsCancelled { get; set; }
    public string CanceledBy { get; set; }
    public DateTime? CanceledDate { get; set; }
    public int BillTypeId { get; set; }
    public string BatchNumber { get; set; }
    public Guid JournalId { get; set; }
    public int TenantId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<BillDetail> Details { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<BilledStudent> Students { get; set; }
}
public class BillDetail
{
    public Guid Id { get; set; }
    public Guid BillId { get; set; }
    public Guid FeeItemId { get; set; }
    public decimal Amount { get; set; }
}
public class BilledStudent
{
    public Guid Id { get; set; }
    public Guid BillId { get; set; }
    public Guid StudentId { get; set; }
    public bool ToBeBilled { get; set; }
    public bool IsDiscounted { get; set; }
    public decimal Amount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal DiscountPercentage { get; set; }
}
public class BillFooter : AuditedEntity<Guid>
{
    public int TenantId { get; set; }
    public string Message { get; set; }
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public bool ToSchool { get; set; }
    public bool ToClass { get; set; }
    public int OrderNumber { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<BillFooterDetails> Details { get; set; }
}
public class BillFooterDetails
{
    public Guid Id { get; set; }
    public Guid BillFooterId { get; set; }
    public Guid StudentId { get; set; }
    public Guid ClassId { get; set; }
    public Guid LevelId { get; set; }
}
public class BoardingFee : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public Guid ClassId { get; set; }
    public int TenantId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<BoardingFeeDetail> Details { get; set; }
}
public class BoardingFeeDetail
{
    public Guid Id { get; set; }
    public Guid BoardingFeeId { get; set; }
    public Guid BoardingItemId { get; set; }
    public decimal Amount { get; set; }
}
public class CategoryPercentage : AuditedEntity<Guid>
{
    public decimal ExamPercentage { get; set; }
    public decimal Cat1Percentage { get; set; }
    public decimal Cat2Percentage { get; set; }
    public decimal Cat3Percentage { get; set; }
    public decimal Cat4Percentage { get; set; }

    public int TenantId { get; set; }

}
public class ClassAssignment : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid TermId { get; set; }
    public string TermName { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; }
    public int AssignmentNumber { get; set; }
    public string Type { get; set; }
    public decimal OverallMark { get; set; }
    public bool IsRawMark { get; set; }
    public bool IsPercentage { get; set; }
    public bool IsCanceled { get; set; }
    public DateTime AssignedDate { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<AssignmentImport> Details { get; set; }
    public int TenantId { get; set; }
    public DateTime CanceledDate { get; set; }
    public string CanceledBy { get; set; }
}
public class ClassLevelPercentage : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<ClassLevelPercentageDetail> Details { get; set; }

    public int TenantId { get; set; }

}
public class ClassLevelPercentageDetail
{
    public Guid Id { get; set; }
    public Guid ClassLevelPercentageId { get; set; }
    public Guid LevelId { get; set; }
    public string LevelName { get; set; }
    public decimal ExamPercentage { get; set; }
    public decimal ClassPercentage { get; set; }
}
public class ClassPromotion: AuditedEntity<Guid>
{
    public DateTime StartDate { get; set; }
    public Guid FromClassId { get; set; }
    public string FromClassName { get; set; }
    public Guid ToClassId { get; set; }
    public string ToClassName { get; set; }
    public int TenantId { get; set; }

}
public class ConductCutOf : AuditedEntity<Guid>
                          {
    public decimal CutOfMark { get; set; }
    public int TenantId { get; set; }
}
public class CumulativeAttendance : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid ClassId { get; set; }
    public Guid TermId { get; set; }
    public Guid StudentId { get; set; }
    public int Days { get; set; }
    public int TenantId { get; set; }

}
public class DisciplinaryAction : AuditedEntity<Guid>
{
    public string ActionDescription { get; set; }
    public int TenantId { get; set; }
}   
public class DistanceGroup : AuditedEntity<Guid>
{
    public string Description { get; set; }
    public Guid DistanceUnitId { get; set; }
    public string DistanceUnitName { get; set; }
    public int DistanceFrom { get; set; }
    public int DistanceTo { get; set; }
    public decimal Amount { get; set; }
    public int TenantId { get; set; }
}
public class DistanceUnit : AuditedEntity<Guid>
{
    public string UnitName { get; set; }
    public int TenantId { get; set; }
}
public class Excursion : AuditedEntity<Guid>
{
    public DateTime DepartureDate { get; set; }
    public TimeSpan DepartureTime { get; set; }
    public DateTime ReturnDate { get; set; }
    public TimeSpan ReturnTime { get; set; }
    public string Point { get; set; }
    public string Destination { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid TermId { get; set; }
    public string TermName { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<StudentExcursion> Students { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<TeacherExcursion> Teachers { get; set; }
    public int TenantId { get; set; }

}
public class FeesDescription : AuditedEntity<Guid>
{
    public string Description { get; set; }
    public int TenantId { get; set; }

}
public class FeeSetUp : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public Guid ClassId { get; set; }
    public Guid LevelId { get; set; }
    public bool IsClassFee { get; set; }
    public bool IsLevelFee { get; set; }
    public bool IsSchoolFee { get; set; }
    public string FeeType { get; set; }
    public int TenantId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<FeeSetUpDetail> Details { get; set; }
}
public class FeeSetUpDetail
{
    public Guid Id { get; set; }
    public Guid FeeSetUpId { get; set; }
    public Guid FeesItemId { get; set; }
    public decimal Amount { get; set; }
}
public class Hostel : AuditedEntity<Guid>
{
    public string Name { get; set; }
    public int TenantId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<HostelDetail> Details { get; set; }
}
public class HostelDetail
{
    public Guid Id { get; set; }
    public Guid HostelId { get; set; }
    public string BlockName { get; set; }
}
public class Level : AuditedEntity<Guid>
{
    public Guid ActualLevelId { get; set; }
    public string ActualLevelName { get; set; }
    public string LevelName { get; set; }
    public int Ordinal { get; set; }
    public bool AccessPerformanceForm { get; set; }
    public int TenantId { get; set; }
}
public class LevelClass : AuditedEntity<Guid>
{
    public Guid LevelId { get; set; }
    public string LevelName { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public bool IsHighestClass { get; set; }
    public Guid StreamId { get; set; }
    public string StreamName { get; set; }
    public int Ordinal { get; set; }
    public int TenantId { get; set; }
}
public class MidTermAssessment : AuditedEntity<Guid>
{
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid TermId { get; set; }
    public string TermName { get; set; }
    public int TenantId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<Assessment> Assessment { get; set; }
}
public class PerformanceSkill : AuditedEntity<Guid>
{
    public Guid PerformanceAreaId { get; set; }
    public string PerformanceAreaName { get; set; }
    public string Name { get; set; }
    public int TenantId { get; set; }

}
public class PreClassStudentPromotion : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid FromClassId { get; set; }
    public Guid ToClassId { get; set; }
    public bool IsIndividualClass { get; set; }
    public bool IsEntireLevel { get; set; }
    public bool IsAlumni { get; set; }
    public Guid EntireLevelClassId { get; set; }
    public int TenantId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<PromotedStudents> Students { get; set; }
}
public class PrizeAwardDetail
{
    public Guid Id { get; set; }
    public Guid PrizeAwardId { get; set; }
    public Guid AwardId { get; set; }
    public string AwardName { get; set; }
    public Guid PrizeId { get; set; }
    public string PrizeName { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
}
public class PrizeAwarded : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid TermId { get; set; }
    public string TermName { get; set; }
    public Guid LevelId { get; set; }
    public string LevelName { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<PrizeAwardDetail> Details { get; set; }
    public int TenantId { get; set; }

}
public class PromotedStudents
{
    public Guid Id { get; set; }
    public Guid PromotionId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentIdentifier { get; set; }
    public Guid ToClassId { get; set; }
}
public class PtaExecutive : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid PtaPositionId { get; set; }
    public string PtaPositionName { get; set; }
    public string Name { get; set; }
    public string PhoneNumber { get; set; }
    public string Email { get; set; }
    public string Address { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TenantId { get; set; }

}
public class RegisteredClass : AuditedEntity<Guid>
{
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public string Description { get; set; }
    public int Capacity { get; set; }
    public Guid RoomId { get; set; }
    public string RoomName { get; set; }
    public Guid MainTeacherId { get; set; }
    public string MainTeacherName { get; set; }
    public Guid SubTeacherId { get; set; }
    public string SubTeacherName { get; set; }
    public Guid ClassPrefectId { get; set; }
    public string ClassPrefectName { get; set; }
    public Guid AssistantPrefectId { get; set; }
    public string AssistantPrefectName { get; set; }
    public string Comments { get; set; }
    public int TenantId { get; set; }

}
public class RemarksByTeacher : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public Guid ClassId { get; set; }
    public string TeacherType { get; set; }
    public string RemarkType { get; set; }
    public string Remark { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public string StudentIdentifier { get; set; }
    public int TenantId { get; set; }
}
public class RepeatedStudent : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid RepeatClassId { get; set; }
    public Guid StudentId { get; set; }
    public int TenantId { get; set; }

}
public class ResultPeriod : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TenantId { get; set; }
}
public class SchBillAccount : AuditedEntity<Guid>
                            {
    public int BillTypeId { get; set; }
    public Guid FeeItemId { get; set; }
    public Guid BankGlId { get; set; }
    public Guid DebitGlId { get; set; }
    public Guid CreditGlId { get; set; }
    public int TenantId { get; set; }
}
public class SchCreditMemo : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public Guid ClassId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime Date { get; set; }
    public string ReceiptNumber { get; set; }
    public string BatchNumber { get; set; }
    public decimal AmountDue { get; set; }
    public decimal AmountToCredit { get; set; }
    public string Description { get; set; }
    public bool IsPosted { get; set; }
    public bool IsCanceled { get; set; }
    public string CanceledBy { get; set; }
    public DateTime CanceledDate { get; set; }
    public bool IsProcessed { get; set; }
    public Guid CurrencyId { get; set; }
    public decimal Rate { get; set; }
    public Guid BankId { get; set; }
    public Guid BankBranchId { get; set; }
    public string ChequeNumber { get; set; }
    public DateTime ChequeDate { get; set; }
    public int PaymentMethod { get; set; }
    public Guid CreditGlId { get; set; }
    public Guid DebitGlId { get; set; }
    public bool IsMultiCurrency { get; set; }
    public Guid JournalId { get; set; }
    public int TenantId { get; set; }
}     
public class SchCreditMemoAccount : AuditedEntity<Guid>
{
    public Guid DebitGlId { get; set; }
    public Guid CreditGlId { get; set; }
    public int TenantId { get; set; }
}
public class SchoolGroup : AuditedEntity<Guid>
{
    public string Name { get; set; }
    public Guid StaffId { get; set; }
    public string StaffName { get; set; }
    public int TenantId { get; set; }

}
public class SchoolGroupPosition : AuditedEntity<Guid>
{
    public string Name { get; set; }
    public Guid SchoolGroupId { get; set; }
    public string SchoolGroupName { get; set; }
    public int TenantId { get; set; }

}
public class SchoolProfile: AuditedEntity<Guid>
{
    public int TenantId { get; set; }
    public string SchoolName { get; set; }
    public string CountryName { get; set; }
    public string CityName { get; set; }
    public string CountryStateName { get; set; }
    public string PhoneNo { get; set; }
    public string Address { get; set; }
    public Guid CountryId { get; set; }
    public Guid CountryStateId { get; set; }
    public Guid CityId { get; set; }
    public string Email { get; set; }
    public string SenderId { get; set; }
    public string ClientId { get; set; }
    public string ClientSecret { get; set; }
    public string RegistrationNo { get; set; }
    public bool EnforceExamSecurity { get; set; }
    public int SchoolDays { get; set; }
    public string FaxNo { get; set; }
    public string Website { get; set; }
    public Guid CurrentAcademicYearId { get; set; }
    public string CurrentAcademicYearName { get; set; }
    public string SubMetro { get; set; }
    public string Circuit { get; set; }
    public Guid CurrentTermId { get; set; }
    public string CurrentTermName { get; set; }
    public Guid CurrencyId { get; set; }


    //email settings
    public string MailHostName { get; set; }
    public bool IsSSLEnabled { get; set; }
    public int PortNumber { get; set; }
    public string PrimaryEmailAddress { get; set; }
    public string EmailPassword { get; set; }

    //logo and signature
    public byte[] CompanyLogo { get; set; }
    public byte[] Signature { get; set; }
    public bool ShowSignature { get; set; }
    public string SchoolLogo { get; set; }
    public string SignatureUrl { get; set; }
    public bool ShowSignatureOnResults { get; set; }
    public bool ShowSignatureOnBills { get; set; }
    public bool ShowSignatureOnStatement { get; set; }
    public bool ShowSignatureOnReceipt { get; set; }

    // terminal report
    public bool IsClassPosition { get; set; }
    public bool IsSubjectPosition { get; set; }
}
public class SchPayment : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public Guid ClassId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal AmountDue { get; set; }
    public decimal AmountToPaid { get; set; }
    public decimal Balance { get; set; }
    public int PaymentMethod { get; set; }
    public string ReferenceNumber { get; set; }
    public string BatchNumber { get; set; }
    public Guid CurrencyId { get; set; }
    public decimal BuyRate { get; set; }
    public Guid BankGlId { get; set; }
    public Guid BankId { get; set; }
    public Guid BankBranchId { get; set; }
    public string ChequeNumber { get; set; }
    public DateTime ChequeDate { get; set; }
    public string Description { get; set; }
    public bool IsPosted { get; set; }
    public bool IsCanceled { get; set; }
    public string CanceledBy { get; set; }
    public DateTime? CanceledDate { get; set; }
    public string ReceiptNumber { get; set; }
    public bool IsProcessed { get; set; }
    public Guid LegalGuardianId { get; set; }
    public bool ByLegalGuardian { get; set; }
    public Guid CreditGlId { get; set; }
    public Guid DebitGlId { get; set; }
    public Guid JournalId { get; set; }
    public bool IsMultiCurrency { get; set; }
    public int TenantId { get; set; }
}
public class SchPaymentAccount : AuditedEntity<Guid>
{
    public Guid LocalDebitGlId { get; set; }
    public Guid ForeignDebitGlId { get; set; }
    public Guid LocalCreditGlId { get; set; }
    public Guid LocalOverPaymentGlId { get; set; }
    public Guid ForeignOverPaymentGlId { get; set; }
    public Guid OtherPaymentDebitGlId { get; set; }
    public Guid OtherPaymentCreditGlId { get; set; }
    public int TenantId { get; set; }
}
public class StaffBio : AuditedEntity<Guid>
{
    public string StaffIdentifier { get; set; }
    public string FirstName { get; set; }
    public string OtherName { get; set; }
    public string LastName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; }
    public string ContactNumber { get; set; }
    public string Email { get; set; }
    public string Address { get; set; }
    public string FaxNumber { get; set; }
    public Guid TitleId { get; set; }
    public string TitleName { get; set; }
    public Guid DesignationId { get; set; }
    public string DesignationName { get; set; }
    public string SocialSecurityNumber { get; set; }
    public Guid GradeId { get; set; }
    public string GradeName { get; set; }
    public DateTime DateOfEmployment { get; set; }
    public DateTime DateAppointed { get; set; }
    public bool IsTeacher { get; set; }
    public DateTime DatePromotedToGrade { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public string Notes { get; set; }

    /*next of kin details*/
    public string NextOfKinName { get; set; }
    public string NextOfKinContactNumber { get; set; }
    public string NextOfKinEmail { get; set; }
    public string NextOfKinAddress { get; set; }
    public Guid NextOfKinRelationshipId { get; set; }
    public int TenantId { get; set; }
}
public class StaffPastEmployment : AuditedEntity<Guid>
{
    public int TenantId { get; set; }
    public Guid StaffId { get; set; }
    public string StaffName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string CompanyName { get; set; }
    public string Reason { get; set; }
}
public class StaffPastPosition : AuditedEntity<Guid>
{
    public int TenantId { get; set; }
    public Guid DesignationId { get; set; }
    public string DesignationName { get; set; }
    public Guid StaffId { get; set; }
    public string StaffName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
public class StaffQualification : AuditedEntity<Guid>
{
    public int TenantId { get; set; }
    public Guid staffId { get; set; }
    public string staffName { get; set; }
    public string Institute { get; set; }
    public string Programme { get; set; }
    public string CertificateId { get; set; }
    public string CertificateName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsAcademic { get; set; }
    public string Comments { get; set; }
}
public class StaffRelationship : AuditedEntity<Guid>
{
    public int TenantId { get; set; }
    public Guid RelationShipId { get; set; }
    public string RelationShipName { get; set; }
    public string Name { get; set; }
    public string Address { get; set; }
    public string PhoneNumber { get; set; }
    public Guid StaffId { get; set; }
    public string StaffName { get; set; }
    public string FaxNumber { get; set; }
    public string Email { get; set; }
    public string MobileNumber { get; set; }
}
public class StatusChange : AuditedEntity<Guid>
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public string StudentIdentifier { get; set; }
    public string Reason { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid StatusId { get; set; }
    public string StatusName { get; set; }
    public DateTime ChangeDate { get; set; }
    public int TenantId { get; set; }

}
public class StContactRelationship : AuditedEntity<Guid>
{
    public Guid legalGuardiaanId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public Guid RelationshipId { get; set; }
    public string RelationshipName { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string OtherNames { get; set; }
    public string PhoneNumber { get; set; }
    public string ContactNumber { get; set; }
    public string Email { get; set; }
    public Guid TitleId { get; set; }
    public string TitleName { get; set; }
    public bool IsLegalGuardian { get; set; }
    public string PlaceOfWork { get; set; }
    public string WorkPhone { get; set; }
    public int TenantId { get; set; }

}
public class StudentAllergy : AuditedEntity<Guid>
{
    public Guid AllergyTypeId { get; set; }
    public string AllergyTypeName { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public int TenantId { get; set; }
}
public class StudentBillInfo : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public Guid ClassId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public Guid BillId { get; set; }
    public string BillNumber { get; set; }
    public decimal Amount { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal BalanceDue { get; set; }
    public DateTime BillDate { get; set; }
    public int BillStatusId { get; set; }
    public bool IsCanceled { get; set; }
    public string CanceledBy { get; set; }
    public int TenantId { get; set; }
}
public class StudentDisability : AuditedEntity<Guid>
{
    public Guid DisabilityId { get; set; }
    public string DisabilityName { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public int TenantId { get; set; }
}
public class StudentDisciplinaryAction : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public Guid OffenseId { get; set; }
    public string OffenseName { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public string Description { get; set; }
    public DateTime ActionDate { get; set; }
    public int TenantId { get; set; }

}
public class StudentExcursion
{
    public Guid Id { get; set; }
    public Guid ExcursionId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentIdentifier { get; set; }
    public string StudentName { get; set; }
    public bool IsPresent { get; set; }
}
public class StudentImmunization : AuditedEntity<Guid>
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public Guid ImmunizationTypeId { get; set; }
    public string ImmunizationTypeName { get; set; }
    public bool IsImmunized { get; set; }
    public DateTime ImmunizationDate { get; set; }
    public int TenantId { get; set; }

}
public class StudentInfo : AuditedEntity<Guid>
{
    public string StudentIdentifier { get; set; }
    public string FirstName { get; set; }
    public string OtherName { get; set; }
    public string LastName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; }
    public Guid CountryId { get; set; }
    public string CountryName { get; set; }
    public string Nationality { get; set; }
    public Guid CityId { get; set; }
    public string CityName { get; set; }
    public string HouseNumber { get; set; }
    public Guid LocationId { get; set; }
    public string LocationName { get; set; }
    public Guid ReligionId { get; set; }
    public string ReligionName { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public string ContactNumber { get; set; }
    public string Address { get; set; }
    public string PhoneNumber { get; set; }
    public DateTime AdmissionDate { get; set; }
    public bool IsBoarder { get; set; }
    public bool IsParentControl { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public string Notes { get; set; }
    public Guid HostelId { get; set; }
    public string HostelName { get; set; }
    public string HostelBlockName { get; set; }
    public Guid HouseId { get; set; }
    public string HouseName { get; set; }
    public Guid StatusId { get; set; }
    public string StatusName { get; set; }
    public decimal BalanceDue { get; set; }
    public DateTime BalanceDueDate { get; set; }
    public bool IsPreClassStudent { get; set; }
    public string IndexNumber { get; set; }
    public bool isAlumni { get; set; }
    public string BillAs { get; set; }
    public int TenantId { get; set; }
}
public class StudentMedical : AuditedEntity<Guid>
{
    public string DoctorName { get; set; }
    public string DoctorPhone { get; set; }
    public string[] MedicalConditions { get; set; }
    public string[] Medications { get; set; }
    public string ClinicName { get; set; }
    public string ClinicPhone { get; set; }
    public string EmergencyContactName { get; set; }
    public string EmergencyContactPhone { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public int TenantId { get; set; }

}
public class StudentOpeningBalance : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public string StudentIdentifier { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public decimal Amount { get; set; }
    public Guid CurrencyId { get; set; }
    public decimal Rate { get; set; }
    public DateTime Date { get; set; }
    public bool IsPosted { get; set; }
    public int TenantId { get; set; }
}
public class StudentPerformanceSkill : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public Guid ClassId { get; set; }
    public DateTime Date { get; set; }
    public Guid StudentId { get; set; }
    public Guid PerformanceSkillId { get; set; }
    public Guid PerformanceAreaId { get; set; }
    public int TenantId { get; set; }

}
public class StudentPosition : AuditedEntity<Guid>
{
    public Guid PositionId { get; set; }
    public string PositionName { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public int TenantId { get; set; }
}
public class StudentPromotion : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid FromClassId { get; set; }
    public Guid ToClassId { get; set; }
    public bool IsIndividualClass { get; set; }
    public bool IsEntireLevel { get; set; }
    public bool IsAlumni { get; set; }
    public Guid EntireLevelClassId { get; set; }
    public int TenantId { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<PromotedStudents> Students { get; set; }
}
public class Subject : AuditedEntity<Guid>
{
    public string Name { get; set; }
    public string Abbreviation { get; set; }
    public bool IsCore { get; set; }
    public bool IsBestSubject { get; set; }
    public int TenantId { get; set; }
}
public class SubjectRemark : AuditedEntity<Guid>
{
    public string Stage { get; set; }
    public string GradeNumber { get; set; }
    public decimal MinMark { get; set; }
    public decimal MaxMark { get; set; }
    public string Remark { get; set; }
    public int TenantId { get; set; }

}
public class SupplementaryItem : AuditedEntity<Guid>
{
    public string Name { get; set; }
    public bool IsFixed { get; set; }
    public int TenantId { get; set; }
}
public class TeacherClass : AuditedEntity<Guid>
{
    public int TenantId { get; set; }
    public Guid StaffId { get; set; }
    public string StaffName { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
}
public class TeacherExcursion
{
    public Guid Id { get; set; }
    public Guid ExcursionId { get; set; }
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; }
}
public class TeacherSubject : AuditedEntity<Guid>
{
    public int TenantId { get; set; }
    public Guid StaffId { get; set; }
    public string StaffName { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; }
}
public class TerminalSubject : AuditedEntity<Guid>
{
    public string Name { get; set; }
    public int Mark { get; set; }
    public int TenantId { get; set; }

}
public class TerminalSubSubject : AuditedEntity<Guid>
{
    public Guid TerminalSubjectId { get; set; }
    public string TerminalSubjectName { get; set; }
    public string Name { get; set; }
    public int Mark { get; set; }
    public int TenantId { get; set; }
}
public class TimeTable : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; }
    public Guid TermId { get; set; }
    public string TermName { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; }
    public string Day { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<TimeTableDetail> Details { get; set; }
    public int TenantId { get; set; }

}
public class TimeTableDetail
{
    public Guid Id { get; set; }
    public Guid TimeTableId { get; set; }
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; }
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}
public class TransportationBill : AuditedEntity<Guid>
{
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public Guid ClassId { get; set; }
    public Guid LevelId { get; set; }
    public bool IsProcessed { get; set; }
    public bool IsCancelled { get; set; }
    public string BillNumber { get; set; }
    public int TenantId { get; set; }
    public DateTime BillDate { get; set; }
    public bool IsPosted { get; set; }
    public string CanceledBy { get; set; }
    public DateTime? CanceledDate { get; set; }
    public string BatchNumber { get; set; }
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public List<TransportationBillDetails> Details { get; set; }
}
public class TransportationBillDetails
{
    public Guid Id { get; set; }
    public Guid TransportationBillId { get; set; }
    public Guid StudentId { get; set; }
    public int SchoolDays { get; set; }
    public decimal Amount { get; set; }
    public Guid CurrencyId { get; set; }
    public decimal Rate { get; set; }
    public bool IsMultiCurrency { get; set; }
}
public class TransportationLocation : AuditedEntity<Guid>
{
    public Guid LocationId { get; set; }
    public string LocationName { get; set; }
    public decimal Amount { get; set; }
    public Guid TransportationUnitId { get; set; }
    public string TransportationUnitName { get; set; }
    public int TenantId { get; set; }

}
public class TransportationUnit : AuditedEntity<Guid>
{
    public string UnitName { get; set; }
    public int TenantId { get; set; }
}

public class ExistingBill
{
    public Guid AcademicYearId { get; set; }
    public Guid TermId { get; set; }
    public int BillTypeId { get; set; }
    public int BillingScopeId { get; set; }

    public Guid ClassId { get; set; }
    public Guid LevelId { get; set; }

    public Guid? FeeItemId { get; set; }
}