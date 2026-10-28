namespace TopazErp_FrontEnd.Models;

public class GeneralLedgerModelCollection
{
    
}

public class AccountHead: AuditedEntity<Guid>
{
    public Guid ParentId { get; set; }
    public int TenantId { get; set; }
    public int StandardAccountType { get; set; }
    public string Name { get; set; }
}

public enum StandardAccountType
{
    // Balance Sheet accounts
    Asset = 1,
    Liability = 2,
    Equity = 3,
    // Income Statement accounts (General)
    Revenue = 4,
    Expense = 5,
    // Other Income/Expense (General)
    OtherIncome = 6,
    OtherExpense = 7,
    // Selling Company specific
    Sales = 8,
    CostOfSales = 9,
    SellingExpenses = 10
}

public class BankAccount : AuditedEntity<Guid>
{
    public Guid BankId { get; set; }
    public string BankName { get; set; }
    public Guid BankBranchId { get; set; }
    public string BankBranchName { get; set; }
    public Guid AccountId { get; set; }
    public string AccountName { get; set; }
    public string Address { get; set; }
    public string Location { get; set; }
    public string AccountNo { get; set; }
    public string AccountType { get; set; }
    public Guid CurrencyId { get; set; }
    public string CurrencyName { get; set; }
    public string CurrencyCode { get; set; }
    public string ContactPerson { get; set; }
    public string ContactNo { get; set; }
    public string ChequeBookStart { get; set; }
    public string ChequeBookEnd { get; set; }
    public DateTime DateOpened { get; set; }
}

public class CoaControl : AuditedEntity<Guid>
{
    public string AccountHeaderName { get; set; }
    public int MinAccount { get; set; }
    public int MaxAccount { get; set; }
    public Guid AccountGroupId { get; set; }
    public Guid ParentAccountHeaderId { get; set; }
}

public class CoaDetail: AuditedEntity<Guid>
{
    public string AccountName { get; set; }
    public int AccountNo { get; set; }
    public string Status { get; set; }
    public Guid AccountControlId { get; set; }
    public string AccountControlName { get; set; }
    public Guid CurrencyId { get; set; }
    public string CurrencyName { get; set; }
    public string CurrencyCode { get; set; }
    public decimal CurrentBalance { get; set; }
    public decimal CurrentForeignBalance { get; set; }
    public int StandardAccountType { get; set; }
    
}

public class Budget : AuditedEntity<Guid>
{
    public Guid AccountId { get; set; }
    public string AccountName { get; set; }
    public Guid OuId { get; set; }
    public string OuName { get; set; }
    public DateTime BeginDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<BudgetDetail> BudgetDetails { get; set; }
}

public class PettyCashRecipient : AuditedEntity<Guid>
{
    public string Recipient { get; set; }
    public string PhoneNo { get; set; }
    public string Email { get; set; }
}


public class PettyCash : AuditedEntity<Guid>
{
    public DateTime BatchDate { get; set; }
    public string BatchNo { get; set; }
    public string SourceDocNo { get; set; }

    public Guid PettyCashAccountId { get; set; }
    public string PettyCashAccountName { get; set; }

    public string BatchOriginator { get; set; }

    public Guid CurrencyId { get; set; }
    public string CurrencyName { get; set; }

    public string CurrencyCode { get; set; }

    public decimal CurrencyRate { get; set; }
    public decimal TotalAmount { get; set; }
    public bool IsPosted { get; set; }

    public List<PettyCashTransactionDetail> Details { get; set; }
}

public class PettyCashTransactionDetail
{
    public Guid Id { get; set; }
    public DateTime TransactionDate { get; set; }
    public string RefNo { get; set; }

    public Guid ExpenseAccountId { get; set; }
    public string ExpenseAccountName { get; set; }

    public string Description { get; set; }
    public decimal Amount { get; set; }

    public Guid? OuId { get; set; }
    public string OuName { get; set; }

    public Guid? RecipientId { get; set; }
    public string RecipientName { get; set; }    
}

public class ImprestCategory : AuditedEntity<Guid>
{
    public string Name { get; set; }
}

public class Imprest : AuditedEntity<Guid>
{
     
}

public class DefaultGLNumbers : AuditedEntity<Guid>
{
     public Guid AccountPayablesBankAccountId { get; set; }
    public Guid PayRollBankAccountId { get; set; }
    public Guid SalesBankAccountId { get; set; }
    public Guid AccountsReceivableBankAccountId { get; set; }
    public Guid AccountsReceivableAccountId { get; set; }
    public Guid AccountsPayableAccountId { get; set; }
    public Guid WithholdingTaxAccountId { get; set; }
    public Guid ImprestCategoryId { get; set; }
    public Guid CreditPurchasesAccountId { get; set; }
    public Guid AdvanceFromCustomerAccountId { get; set; }
    public Guid CovidTaxReceivedAccountId { get; set; }
    public Guid CommunicationsServiceTaxReceivedAccountId { get; set; }
    public Guid InventoryAccountId { get; set; }
    public Guid SalesRevenueAccountId { get; set; }
    public Guid StockPurchasesAccountId { get; set; }
    public Guid CurrentEarningsAccountId { get; set; }
    public Guid RetainedEarningsAccountId { get; set; }
    public Guid VatReceivedAccountId { get; set; }
    public decimal VatRate { get; set; }
    public Guid ImprestGlAccountId { get; set; }
    public Guid PettyCashGlAccountId { get; set; }
    public Guid PurchasesBankAccountId { get; set; }
    public Guid AdvanceToSupplierAccountId { get; set; }
    public Guid CovidTaxPaidAccountId { get; set; }
    public Guid CommunicationsServiceTaxPaidAccountId { get; set; }
    public Guid GoodsInTransitAccountId { get; set; }
    public Guid UnrealizedFxLossAccountId { get; set; }
    public Guid UnrealizedFxGainAccountId { get; set; }
    public Guid RealizedFxLossAccountId { get; set; }
    public Guid RealizedFxGainAccountId { get; set; }
    public Guid VatPaidAccountId { get; set; }
    public Guid GetflReceivedAccountId { get; set; }
    public Guid GetflPaidAccountId { get; set; }
    public Guid NhilReceivedAccountId { get; set; }
    public Guid NhilPaidAccountId { get; set; }

    //social security...
    public Guid SocialSecurityEmployerPortionDefaultExpenseGl { get; set; }
    public Guid SocialSecurityEmployeePortionDefaultExpenseGl { get; set; }
    public Guid SocialSecurityEmployerPortionDefaultLiabilityGl { get; set; }
    public Guid SocialSecurityEmployeePortionDefaultLiabilityGl { get; set; }
    public int TenantId { get; set; }
}




public class BudgetDetail
{
    public Guid Id { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal BudgetAmount { get; set; }
    public decimal RevisedAmount { get; set; }
    
}

public class Voucher: AuditedEntity<Guid>
{
    public string BatchNo { get; set; }
    
    public string BatchDescription { get; set; }

    public DateTime? PaymentDate { get; set; }

    public Guid BankAccountId { get; set; }

    public string BankAccountName { get; set; }

    public Guid BankId { get; set; }
    public string BankName { get; set; }

    public string ChequeNo { get; set; }
    
    public DateTime VoucherEntryDate { get; set; }
    
    public string ModeOfPayment { get; set; }

    public Guid CurrencyId { get; set; }

    public string CurrencyName { get; set; }

    public string CurrencyCode { get; set; }

    public decimal BuyRate { get; set; }

    public decimal BaseAmount { get; set; }

    public bool HasCommunicationServiceTax { get; set; }

    public decimal CommunicationServiceTaxRate { get; set; }

    public bool HasCovidTax { get; set; }

    public decimal CovidTaxRate { get; set; }

    public bool HasWithHolding { get; set; }

    public bool HasGetFundLevy { get; set; }

    public decimal GetFundLevyRate { get; set; }

    public bool HasNationalHealthInsuranceLevy { get; set; }

    public decimal NationalHealthInsuranceLevyRate { get; set; }

    public bool HasVat { get; set; }

    public decimal VatRate { get; set; }
    public decimal TotalVatAmount { get; set; }
    public bool HasVatWithhold { get; set; }

    public decimal WithHoldingVatPercentage { get; set; }
    public decimal GrossAmount { get; set; } //as total on view
    public decimal TotalWithheld { get; set; }
    public decimal TotalRetained { get; set; }
    public decimal NetAmount { get; set; }
    public decimal TotalVatWithheld { get; set; }

    public string TaxType { get; set; }
    public Guid VatWithHoldingAccountId { get; set; }
    public string VatWithHoldingAccountName { get; set; }
    public Guid WithHoldingAccountId { get; set; }
    public string WithHoldingAccountName { get; set; }
    public decimal VatWithHoldAmount { get; set; }
    public decimal WithHoldingRate { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; }
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; }
    public Guid EmployeeId { get; set; }
    public string EmployeeName { get; set; }
    public bool Posted { get; set; }
    public bool IsPayment { get; set; }
    public bool IsMultiCurrency { get; set; }
    public bool IsPosted { get; set; }

    public List<GlVoucherDetail> Details { get; set; }
    
}

public class GlVoucherDetail
{
    
    public Guid Id { get; set; }
    public Guid DebitAccountId { get; set; }
    public string DebitAccountName { get; set; }
    public bool WithHold { get; set; }
    public Guid OuId { get; set; }
    public string OuName { get; set; }
    public decimal Amount { get; set; } // debit amount
    public decimal ForeignDebitAmount { get; set; } // debit amount
    public string ReferenceNo { get; set; }
    public string Description { get; set; }
    public string InvoiceNo { get; set; }
    public bool HasImprest { get; set; }
}

public class JournalListFilterDto
{
    public int PageNo { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    /// <summary>Filter by posted status. Null means return all.</summary>
    public bool? IsPosted { get; set; }

    /// <summary>Filter by transaction source (e.g. "AP", "GL"). Null/empty means return all.</summary>
    public string TransactionSource { get; set; }

    /// <summary>Free-text search against BatchNumber and BatchDescription.</summary>
    public string Search { get; set; }
}

/// <summary>Paged wrapper returned by Journal/ListAll.</summary>
public class JournalTransactionPagedResult
{
    public int TotalCount { get; set; }

    public int PageNo { get; set; }

    public int PageSize { get; set; }

    public List<JournalTransaction> Items { get; set; } = new();
}

/// <summary>A single journal entry: one header paired with its detail lines.</summary>
public class JournalTransaction
{
    public JournalHeader JournalHeader { get; set; }

    public List<JournalDetail> JournalDetails { get; set; } = new();
}

public class JournalHeader
{
    public Guid Id { get; set; }

    public string BatchNumber { get; set; }

    public DateTime BatchDate { get; set; }

    public string BatchDescription { get; set; }

    public decimal TotalCredit { get; set; }

    public decimal TotalDebit { get; set; }

    public bool IsPosted { get; set; }

    public bool IsTemporary { get; set; }
    public bool IsMulticurrency { get; set; }

    public string TransactionSource { get; set; }

    public int TenantId { get; set; }

  
}

public class JournalDetail
{
    public Guid Id { get; set; }

    public Guid JournalId { get; set; }

    public Guid AccountId { get; set; }

    public string AccountName { get; set; }

    public Guid OuId { get; set; }

    public string OuName { get; set; }

    public string ReferenceNumber { get; set; }

    public string ChequeNo { get; set; }

    public string Description { get; set; }
    public decimal DebitAmount { get; set; }

    public decimal CreditAmount { get; set; }

    public DateTime TransactionDate { get; set; }

    public string TransactionSource { get; set; }

    public bool IsMultiCurrency { get; set; }

    public bool IsReconciled { get; set; }

    public bool IsOpeningBalance { get; set; }

    public bool IsConsolidated { get; set; }

    public DateTime DateConsolidated { get; set; }

    public Guid CurrencyId { get; set; }

    public string CurrencyName { get; set; }

    public string CurrencyCode { get; set; }

    public decimal BuyRate { get; set; }

    public decimal SellRate { get; set; }

    public DateTime BatchDate { get; set; }

    public DateTime? ClosedDate { get; set; }

    public Guid PettyCashRecipientId { get; set; }

    public string PettyCashRecipientName { get; set; }

    public bool IsPosted { get; set; }

    public int StandardAccountType { get; set; }

    public string BatchNumber { get; set; }

    public int TenantId { get; set; }

     
}