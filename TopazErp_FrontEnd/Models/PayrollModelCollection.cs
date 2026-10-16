namespace TopazErp_FrontEnd.Models;

public class PayrollModelCollection
{
    
}

public class AllowanceType: AuditedEntity<Guid>
{
    public string Name { get; set; }
    public int AllowanceDays { get; set; }
    public Guid ExpenseAccountId { get; set; }
    public string ExpenseAccountName { get; set; }
    public bool IsTaxable { get; set; }
    public List<AllowanceRate> AllowanceRates { get; set; }
}

public class AllowanceRate
{
    public Guid AllowanceTypeId { get; set; }
    public Guid Id { get; set; }
    public string AllowanceTypeName { get; set; }
    public Guid EmployeeCategoryId { get; set; }
    public string EmployeeCategoryName { get; set; }
    public bool FixedAmount { get; set; }
    public decimal PercentageBasic { get; set; }
    public decimal Amount { get; set; }
    public decimal MaximumAmount { get; set; }
    public bool Prorate { get; set; }
    public bool ApplyBackPay { get; set; }
    public bool Taxable { get; set; }
}

public class EmployeeCategory: AuditedEntity<Guid>
{
    public string Name { get; set; }
}


public class BikType: AuditedEntity<Guid>
{
    public string Name { get; set; }
    public Guid ExpenseAccountId { get; set; }
    public string ExpenseAccountName { get; set; }
    public bool IsTaxable { get; set; }
    public List<BikRate> BikRates { get; set; }
}

public class BikRate
{
    public Guid Id { get; set; }
    public Guid BikTypeId { get; set; }
    public Guid EmployeeCategoryId { get; set; }
    public string EmployeeCategoryName { get; set; }
    public Guid AllowanceTypeId { get; set; }
    public string AllowanceTypeName { get; set; }
    public bool FixedAmount { get; set; }
    public decimal Amount { get; set; }
    public decimal PercentageBasic { get; set; }
    public decimal MaximumAmount { get; set; }
}

public class DeductionType : AuditedEntity<Guid>
{
    public string Name { get; set; }
    public Guid LiabilityAccountId { get; set; }
    public string LiabilityAccountName { get; set; }
    public List<DeductionRate> Rates { get; set; }
}

public class DeductionRate
{
    public Guid Id { get; set; }
    public Guid DeductionTypeId { get; set; }
    public string DeductionTypeName { get; set; }
    public Guid EmployeeCategoryId { get; set; }
    public string EmployeeCategoryName { get; set; }
    public bool Prorate { get; set; }
    public bool FixedAmount { get; set; }
    public decimal Amount { get; set; }
    public decimal MaximumAmount { get; set; }
    public decimal PercentageBasic { get; set; }
}


public class OvertimeType: AuditedEntity<Guid>
{
    public string Name { get; set; }
    
    public bool IsTaxable { get; set; }
    public List<OvertimeRate> Rates { get; set; }
}


public class OvertimeRate
{
    public Guid Id { get; set; }
    public Guid OvertimeTypeId { get; set; }
    public Guid EmployeeCategoryId { get; set; }
    public string EmployeeCategoryName { get; set; }
    public bool FixedAmount { get; set; }
    public decimal Amount { get; set; }
    public decimal PercentageBasic { get; set; }
    public bool IsFactor { get; set; }
    public bool Prorate { get; set; }
    public decimal Factor { get; set; }
    public decimal MaximumAmount { get; set; }
    public decimal AnnualHours { get; set; }
    public decimal PercentageLimitOfBasic { get; set; }
}


public class LoanType: AuditedEntity<Guid>
{
    public string Name { get; set; }
    public bool ChargeInterest { get; set; }
}

public class PayCalendar: AuditedEntity<Guid>
{
    public int Year { get; set; }
    public List<PayCalendarDetail> Details { get; set; }
}

public class PayrollPeriod : AuditedEntity<Guid>
{
    public int Month { get; set; }
    public int Year { get; set; }
}

public class PayCalendarDetail
{
    public Guid Id { get; set; }
    public Guid PayCalendarId { get; set; }
    public int Year { get; set; }
    public int Days { get; set; }
    public int Month { get; set; }
}

public class EmployeeRank: AuditedEntity<Guid>
{
    public string Name { get; set; }
}

public class TaxRelief : AuditedEntity<Guid>
{
    public string Name { get; set; }
    public decimal Amount { get; set; }
    
}

public class TaxTable : AuditedEntity<Guid>
{
    public decimal Rate { get; set; }
    public decimal UpperLimitOfAmount { get; set; }
}


public class Gratuity: AuditedEntity<Guid>
{
    public decimal MinYears { get; set; }
    public decimal MaxYears { get; set; }
    public decimal Factor { get; set; }
}

// employee bio data
public class EmployeeBioData: AuditedEntity<Guid>
{
    public string EmployeeIdentifier { get; set; }
    public string FirstName { get; set; }
    public string OtherName { get; set; }
    public string LastName { get; set; }
    public string EmployeePhoto { get; set; }
    
    public string Title { get; set; }
    public string Gender { get; set; }
    public int Status { get; set; }
    public string CityOrLocation { get; set; }
    public string ResidenceAddress { get; set; }
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; }
    public DateTime DateAppointed { get; set; }
    public Guid SalaryGradeId { get; set; }
    public string SalaryGradeName { get; set; }
    public Guid SalaryNotchId { get; set; }
    public string SalaryNotchName { get; set; }
    
    public Guid RankId { get; set; }
    
    public string RankName { get; set; }
    public string TaxIdentificationNo { get; set; }

    // personal info
    public DateTime DateOfBirth { get; set; }
    public string PersonalEmail { get; set; }
    public string MaritalStatus { get; set; }
    public Guid ReligionId { get; set; }
    
    public string ReligionName { get; set; }
    public Guid NationalityId { get; set; }
    public string NationalityName { get; set; }
    public string Hometown { get; set; }
    // contact info
    public string PrimaryPhoneNumber { get; set; }
    public string SecondaryPhoneNumber { get; set; }
    public string CompanyEmail { get; set; }
}

public class EmployeeSalaryInfo : AuditedEntity<Guid>
{
    public Guid EmployeeId { get; set; }
    public Guid EmployeeCategoryId { get; set; }
    public Guid EmployeeSalaryGradeId { get; set; }
    public Guid EmployeeSalaryNotchId { get; set; }
        
    public string EmployeeIdentifier { get; set; }
        
    public string EmployeePhoto { get; set; }
    public string EmployeeName { get; set; }
    public string SalaryType { get; set; }
    public string PayType { get; set; }
    public Guid BankId { get; set; }
    public string BankName { get; set; }
    public Guid BankBranchId { get; set; }
    public string BankBranchName { get; set; }
    public decimal DailyHours { get; set; }
    public decimal PreviousSalary { get; set; }
    public decimal MonthlySalary { get; set; }
    public Guid CurrencyId { get; set; }
    public string CurrencyName { get; set; }
    public decimal CurrentHourlyRate { get; set; }
    public string AccountNumber { get; set; }
    
    public bool PaysGraduatedTax { get; set; }
        
    public bool PaysWithHoldingTax { get; set; }
    public decimal WithHoldingTaxRate { get; set; }
    public decimal VacationDaysPaid { get; set; }
}

public class EmployeeSnit : AuditedEntity<Guid>
{
    public Guid EmployeeId { get; set; }
    public string EmployeeIdentifier { get; set; }
    public string EmployeeName { get; set; }
    public decimal SocialSecurityFundEmployerContribution { get; set; }
    public string SocialSecurityNo { get; set; }
    public decimal SocialSecurityFundEmployeeContribution { get; set; }
    public decimal SuperAnnuationEmployerContribution { get; set; }
    public decimal SuperAnnuationEmployeeContribution { get; set; }
    public decimal ProvidentFundEmployeeContribution { get; set; }
    public decimal ProvidentFundEmployerContribution { get; set; }
    public decimal SecondProvidentFundEmployeeContribution { get; set; }
    public decimal SecondProvidentFundEmployerContribution { get; set; }
        
    public bool PaySocialSecurityFund { get; set; }
    public bool PayProvidentFund { get; set; }
    public bool PaySecondProvidentFund { get; set; }
}