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

public class BudgetDetail
{
    public Guid Id { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal BudgetAmount { get; set; }
    public decimal RevisedAmount { get; set; }
    
}

public class JournalTransaction
{
    public Guid Id { get; set; }
    public string BatchNumber { get; set; }
    public DateTime BatchDate { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal TotalDebit { get; set; }
    
    public bool IsPosted { get; set; }
    
    public bool IsMultiCurrency { get; set; }
    public Guid OuId { get; set; }
    
    public string OuName { get; set; }
    
    public string TransactionSource { get; set; }
    public List<JournalDetail> Details { get; set; }
}

public class JournalDetail
{
    public Guid JournalId { get; set; }
    public Guid AccountId { get; set; }
    public string AccountName { get; set; }
    public Guid OuId { get; set; } 
    public string OuName { get; set; }
    public string ReferenceNumber { get; set; }
    public string ChequeNo { get; set; }
    public string Description { get; set; }
    public decimal LocalDebit { get; set; }
    public decimal LocalCredit { get; set; }
    public decimal ForeignDebit { get; set; }
    public decimal ForeignCredit { get; set; }
    public DateTime TransactionDate { get; set; } //can use system date
    public string TransactionSource { get; set; }
    public bool IsLocal { get; set; }
    public bool IsReconciled { get; set; }
    public bool IsOpeningBalance { get; set; }
    public bool IsConsolidated { get; set; }
    public DateTime DateConsolidated { get; set; }
    public Guid CurrencyId { get; set; }
    public string CurrencyName { get; set; }
    public string CurrencyCode { get; set; }
    public decimal BuyRate { get; set; }
    public decimal SellRate { get; set; }
    public DateTime? ClosedDate { get; set; }
    public Guid PettyCashRecipientId { get; set; }
    public string PettyCashRecipientName { get; set; }
}