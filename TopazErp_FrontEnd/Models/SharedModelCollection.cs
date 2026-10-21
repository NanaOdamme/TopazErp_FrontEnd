namespace TopazErp_FrontEnd.Models;

public class SharedModelCollection
{
    
}

public class Bank: AuditedEntity<Guid>
{
    public string Name { get; set; }
    public string ContactPerson { get; set; }
    public string ContactNo { get; set; }
    public string Email { get; set; }
    public string BankCode { get; set; }
    public List<BankBranch> BankBranches { get; set; }
}

public class CompanyProfile: AuditedEntity<Guid>
{
     public int TenantId { get; set; }
        public string CompanyName { get; set; }
        public string CountryName { get; set; }
        public string CityName { get; set; }
        public string PhoneNo { get; set; }
        public string Address { get; set; }
        public Guid CountryId { get; set; }
        public Guid CountryStateId { get; set; }
        public string CompanyTin { get; set; }
        public string Email { get; set; }
        public string SenderId { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public int FirstMonthOfFiscalYear { get; set; }
        public string VATNo { get; set; }

        //Social Security Rates...
        public string EmployerSocialSecurityNo { get; set; }
        public bool PaySocialSecurityFund { get; set; }
        public decimal SocialSecurityFundEmployeeRate { get; set; }
        public decimal SocialSecurityFundEmployerRate { get; set; }

        //Provident Fund Rates...
        public bool PayProvidentFund { get; set; }
        public decimal ProvidentFundEmployeeRate { get; set; }
        public decimal ProvidentFundEmployerRate { get; set; }
        public bool ProvidentFundTreatAsSocialSecurityFund { get; set; }
        public bool ProvidentFundTaxEmployerPortion { get; set; }

        // 2nd provident fund
        public bool PaySecondProvidentOrOthers { get; set; }
        public decimal SecondProvidentEmployeeRate { get; set; }
        public decimal SecondProvidentEmployerRate { get; set; }
        public bool TreatSecondProvidentAsSsf { get; set; }
        public bool SecondProvidentTaxEmployerPortion { get; set; }

        //Overtime Percentage...
        public bool OvertimePercentageOnBasicSalary { get; set; }

        public bool OvertimePercentageOnDailyWage { get; set; }
        public Guid DefaultCurrenyId { get; set; }

        //email settings
        public string MailHostName { get; set; }
        public bool IsSSLEnabled { get; set; }
        public int PortNumber { get; set; }
        public string PrimaryEmailAddress { get; set; }
        public string EmailPassword { get; set; }

        //tax levies inclusive
        public bool IsTaxLeviesInclusive { get; set; }
        // aprove invoice before payment
        public bool ApproveInvoiceBeforePayment { get; set; }
        public byte[] CompanyLogo { get; set; }
        public string CompanyLogoUrl { get; set; }

        // gl
        public bool EnforceOu { get; set; }
}

public class BankBranch
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string ContactPerson { get; set; }
    public string ContactNo { get; set; }
    public string Email { get; set; }
    
}

public class SubscriptionInfo
{

    public string BusinessId { get; set; }
    public string BusinessLogo { get; set; }
    public string Country { get; set; }
    public string Network { get; set; }
    public bool HasSubscribedToGl { get; set; }
    public bool HasSubscribedToPayroll { get; set; }
    public bool HasSubscribedToSchoolManager { get; set; }
    public bool HasSubscribedToPropertyRentals { get; set; }
    public bool HasSubscribedToAp { get; set; }
    public bool HasSubscribedToAr { get; set; }
    public bool HasSubscribedToFixedAssets { get; set; }
    public bool HasSubscribedToDocumentManagement { get; set; }
    public bool HasSubscribedToHumanResource { get; set; }
    public bool HasSubscribedToManufacturing { get; set; }
    public bool HasSubscribedToSupplyChain { get; set; }
    public bool HasSubscribedToPointOfSale { get; set; }
    public bool HasSubscribedToCoreBanking { get; set; }
    public bool HasSubscribedToInventory { get; set; }
    
    public bool IsDirectDebitEnabled { get; set; }
    public string PhoneNumber { get; set; }
    public string PaymentMethod { get; set; } // mobile-money,bank-card
    public string MobileMoneyChannel { get; set; } //mtn-gh-direct-debit, vodafone-gh-direct-debit
}

public class SystemNumber: AuditedEntity<Guid>
{
    public string ItemName { get; set; }
    public string Key { get; set; }
    public string Prefix { get; set; }
    public string Suffix { get; set; }
    public string FormatPattern { get; set; } // eg. {PREFIX}{NO}{SUFFIX}
    public int Padding { get; set; }
    public int LastNo { get; set; }
    public int TenantId { get; set; }
}

public class CostCenter: AuditedEntity<Guid>
{
    public Guid ParentId { get; set; }
    public string Name { get; set; }
}

public class CustomerGroup: AuditedEntity<Guid>
{
    public string Name { get; set; }
}

public class SupplierGroup: AuditedEntity<Guid>
{
    public string Name { get; set; }
}

public class Customer: AuditedEntity<Guid>
{
    public string Name { get; set; }
}


public class Supplier: AuditedEntity<Guid>
{
    public string Name { get; set; }
}

public class Department: AuditedEntity<Guid>
{
    public Guid ParentId { get; set; }
    public string Name { get; set; }
}

public class TaxLevy: AuditedEntity<Guid>
{
    public string Name { get; set; }
    public decimal Rate { get; set; }
    public string Type { get; set; } //vat, others
}


public class Currency: AuditedEntity<Guid>
{
    public string CurrencyName { get; set; }
    public string CurrencyCode { get; set; }
    public string MinorName { get; set; }
    public decimal BuyRate { get; set; }
    public decimal SellRate { get; set; }
    public bool IsDefault { get; set; }
    public List<CurrencyRate> Rates { get; set; }
}

public class CurrencyRate
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public decimal SellingRate { get; set; }
    public decimal BuyingRate { get; set; }
}

public class AuditLog
{
    public string UserFullName { get; set; }  
    
    public string UrlPath { get; set; }  
    
    public long UserId { get; set; }

    public string ServiceName { get; set; }

    public string MethodName { get; set; }

    public string Parameters { get; set; }

    public object ReturnValue { get; set; }

    public DateTimeOffset ExecutionTime { get; set; }

    public long ExecutionDuration { get; set; }

    public string ClientIpAddress { get; set; }

    public object ClientName { get; set; }

    public object BrowserInfo { get; set; }

    public object ExceptionMessage { get; set; }

    public object Exception { get; set; }

    public object ImpersonatorUserId { get; set; }

    public object ImpersonatorTenantId { get; set; }

    public object CustomData { get; set; }

    public long Id { get; set; }
}