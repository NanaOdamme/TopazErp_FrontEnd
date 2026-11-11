namespace TopazErp_FrontEnd.Models;

public class ApModelCollection
{
    
}
 public class ApInvoice : AuditedEntity<Guid>
    {
        public Guid SupplierId { get; set; }
        public string SupplierName { get; set; }
        public string AccountNumber { get; set; }
        public string BatchNumber { get; set; }
        public string InvoiceNumber { get; set; }
        public DateTime InvoiceDate { get; set; }
        public DateTime ProjectedPayDate { get; set; }
        public decimal Balance { get; set; }
        public string PurchaseOrderNumber { get; set; }
        public string VoucherNumber { get; set; }
        public Guid LiabilityAccountId { get; set; }
        public string LiabilityAccountName { get; set; }
        public Guid CurrencyId { get; set; }
        public string CurrencyName { get; set; }
        public string CurrencyCode { get; set; }
        public string MinorName { get; set; }
        public bool IsMultiCurrency { get; set; }
        public bool SendEmail { get; set; }
        public bool SendSms { get; set; }
        public decimal BuyRate { get; set; }
        public decimal SellRate { get; set; }
        public decimal TotalInvoiceAmount { get; set; }
        public bool VatWithHeld { get; set; }
        public Guid vatId { get; set; }
        public string vatName { get; set; }
        public decimal NewVateRate { get; set; }
        public decimal vatRate { get; set; }
        public bool vatIsApplied { get; set; }
        public decimal vatAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal WithheldAmount { get; set; }
        public Guid OuId { get; set; }
        public string OuName { get; set; }
        public bool IsCanceled { get; set; }
        public string CanceledBy { get; set; }
        public DateTime? CanceledDate { get; set; }
        public bool IsPosted { get; set; }
        public string AccountingPeriod { get; set; }
        public int Status { get; set; }
        public bool IsApproved { get; set; }
        public List<InvoiceTaxLevies> InvoiceTaxLevies { get; set; }
        public List<ApInvoiceDetail> InvoiceDetails { get; set; }
      
    }
    public class InvoiceTaxLevies
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public decimal Amount { get; set; }
        public decimal Rate { get; set; }
        public bool IsApplied { get; set; }
    }
    public class ApInvoiceDetail
    {
        public Guid Id { get; set; }
        public string ReferenceNumber { get; set; }
        public string Description { get; set; }
        public int Quantity { get; set; }
        public decimal Amount { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal SubTotal { get; set; }
        public bool DiscountAsPercentage { get; set; }
        public decimal Discount { get; set; }
        public Guid DebitAccountId { get; set; }
        public string DebitAccountName { get; set; }
    }
    
public class ApOpeningBalance: AuditedEntity<Guid>
{
     public Guid SupplierId { get; set; }
     public string SupplierName { get; set; }
     public string AccountNumber { get; set; }
     public decimal Amount { get; set; }
     public DateTime TransactionDate { get; set; }
     public Guid CurrencyId { get; set; }
     public string CurrencyName { get; set; }
     public string CurrencyCode { get; set; }
     public decimal BuyRate { get; set; }
     public decimal SellRate { get; set; }
     public Guid OuId { get; set; }
     public string OuName { get; set; }
     public bool IsPosted { get; set; }
}
public class ApPayment: AuditedEntity<Guid>
{
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; }
    public string AccountNumber { get; set; }
    public Guid OuId { get; set; }
    public string OuName { get; set; }
    public string BatchNumber { get; set; }
    public string ReferenceNumber { get; set; }
    public decimal AmountToPay { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal OutstandingCreditMemo { get; set; }
    public Guid InvoiceTypeId { get; set; }
    public string InvoiceTypeName { get; set; }
    public Guid CurrencyId { get; set; }
    public string CurrencyName { get; set; }
    public string CurrencyCode { get; set; }
    public bool IsMultiCurrency { get; set; }
    public string ModeOfPayment { get; set; }
    public string MinorName { get; set; }
    public string ChequeNumber { get; set; }
    public decimal BuyRate { get; set; }
    public decimal SellRate { get; set; }
    public Guid BankAccountId { get; set; }
    public string BankAccountName { get; set; }
    public string BankAccountNumber { get; set; }
    public bool IsAutomatic { get; set; }
    public bool IsPosted { get; set; }
    public bool IsCanceled { get; set; }
    public Guid BankId { get; set; }
    public string BankName { get; set; }
    public Guid BankBranchId { get; set; }
    public string BankBranch { get; set; }
    public List<ApInvoice> InvoiceList { get; set; }
}

public class ApDebitMemo: AuditedEntity<Guid>
{
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; }
    public string AccountNo { get; set; }
    public Guid InvoiceId { get; set; }
    public string InvoiceNo { get; set; }
    public decimal InvoiceBalance { get; set; }
    public string InvoiceCurrencyName { get; set; }
    public decimal InvoiceBuyRate { get; set; }
    public decimal Amount { get; set; }
    public DateTime TransactionDate { get; set; }
    public Guid CurrencyId { get; set; }
    public string CurrencyName { get; set; }
    public string CurrencyCode { get; set; }
    public decimal BuyRate { get; set; }
    public decimal SellRate { get; set; }
    public Guid OuId { get; set; }
    public string OuName { get; set; }
    public Guid DebitGlId { get; set; }
    public string DebitGlName { get; set; }
    public Guid CreditGlId { get; set; }
    public string CreditGlName { get; set; }
    public Guid BankId { get; set; }
    public string BankName { get; set; }
    public Guid BankBranchId { get; set; }
    public string BankBranch { get; set; }
    public string ChequeNo { get; set; }
    public string ChequeDate { get; set; }
    public string ModeOfPayment { get; set; }
    public string Description { get; set; }
    public bool IsInvoiceDebit { get; set; }
    public string BatchNumber { get; set; }
}
public class ApVoucher:AuditedEntity<Guid>
{
        public Guid VoucherId { get; set; }
        public string VoucherNumber { get; set; }
        //Invoice Details...
        public Guid SupplierId { get; set; }
        public string SupplierName { get; set; }
        public string AccountNumber { get; set; }
        public string InvoiceId { get; set; }
        public string InvoiceNumber { get; set; }
        public DateTime VoucherEntryDate { get; set; }
        public Guid CurrencyId { get; set; }
        public string CurrencyName { get; set; }
        public string CurrencyCode { get; set; }
        public decimal BuyRate { get; set; }
        public decimal SellRate { get; set; }
        public decimal InvoiceAmount { get; set; }
        public decimal Balance { get; set; }
        public Guid LiabilityAccountId { get; set; }
        public string LiabilityAccountCode { get; set; }
        public string LiabilityAccountName { get; set; }
        public string Description { get; set; }
        //payment details...

        public Guid BankAccountId { get; set; }
        public string BankAccountNumber { get; set; }
        public string BankAccountName { get; set; }
        public Guid BankId { get; set; }
        public string BankName { get; set; }
        public Guid BankBranchId { get; set; }
        public string BankBranchCode { get; set; }
        public Guid PayCurrencyId { get; set; }
        public string PayCurrencyName { get; set; }
        public string PayCurrencyCode { get; set; }
        public decimal PayCurrencyBuyRate { get; set; }
        public decimal PayCurrencySellRate { get; set; }
        public string MinorName { get; set; }
        public DateTime PaymentDate { get; set; }
        public decimal PaymentAmount { get; set; }
        public string ModeOfPayment { get; set; }
        public string ChequeNumber { get; set; }
        //withholding...
        public bool GETFL { get; set; }
        public decimal GETFLRate { get; set; }
        public bool NHIL { get; set; }
        public decimal NHILRate { get; set; }
        public bool VAT { get; set; }
        public decimal VATRate { get; set; }
        public bool Covid { get; set; }
        public decimal CovidRate { get; set; }
        public bool CST { get; set; }
        public decimal CSTRate { get; set; }
        public decimal Total { get; set; }
        public decimal WithHeld { get; set; }
        public decimal VATWithHeld { get; set; }
        public decimal VATAmount { get; set; }
        public decimal NetAmount { get; set; }
        public decimal WithHoldingRate { get; set; }
        public Guid VatWithHoldAccountId { get; set; }
        public string VatWithHoldAccountName { get; set; }
        public Guid CreditAccountId { get; set; }
        public string CreditAccountName { get; set; }
        public bool isWithHolding { get; set; }
        public bool isVatWithHolding { get; set; }
        public decimal TotalTaxAmount { get; set; }
        public bool IsPosted { get; set; }
        public bool IsMultiCurrency { get; set; }
        public string BatchNumber { get; set; }
        public string ReferenceNumber { get; set; }
        public string AmountInWords { get; set; }
        public List<ApVoucherDetail> Details { get; set; }
}
public class ApVoucherDetail
{
    public Guid Id { get; set; }
    public string Description { get; set; }
    public decimal Amount { get; set; }
    public bool IsWithHolding { get; set; }
}
public class ReportHeader
{
    public string CompanyName { get; set; }
    public string PrimaryPhoneNo { get; set; }
    public string Address { get; set; }
    public string Email { get; set; }
    public string ReportTitle { get; set; }
    public string CompanyLogo { get; set; }
}
public class ApAgingData
{
    public string CurrencyCode { get; set; }
    public string SupplierName { get; set; }
    public string AccountNumber { get; set; }
    public string InvoiceNumber { get; set; }
    public decimal BuyRate { get; set; }
    public decimal Balance { get; set; }
    public decimal TotalInvoiceAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string InvoiceDate { get; set; }
    public string ProjectedPayDate { get; set; }
    public string PurchaseOrderNumber { get; set; }
    public int AgingNumber { get; set; }
    public decimal CurrentDay { get; set; }
    public decimal AgingFirst { get; set; }
    public decimal AgingSecond { get; set; }
    public decimal AgingThird { get; set; }
}
public class ApStatementRecord
{
    public string Type { get; set; }
    public string ContactPerson { get; set; }
    public string ContactPhone { get; set; }
    public string SupplierName { get; set; }
    public string AccountNumber { get; set; }
    public string InvoiceNumber { get; set; }
    public string InvoiceNo { get; set; }
    public string InvoiceDate { get; set; }
    public DateTime TransactionDate { get; set; }
    public decimal? Balance { get; set; }
    public decimal? TotalInvoiceAmount { get; set; }
    public decimal? PaidAmount { get; set; }
    public decimal? AmountPaid { get; set; }
    public string PaymentDate { get; set; }
    public string CurrencyName { get; set; }
    public decimal? BuyRate { get; set; }
    public string Description { get; set; }
    public string OuName { get; set; }
    public Guid OuId { get; set; }
    public decimal? Outstanding { get; set; }
}

public class ApGlTransactions
{
    public string BatchNumber { get; set; }
    public string TransactionSource { get; set; }
    public string AccountName { get; set; }
    public string Description { get; set; }
    public decimal DebitAmount { get; set; }
    public decimal CreditAmount { get; set; }
    public DateTime TransactionDate { get; set; }
    public string CurrencyCode { get; set; }
    public string CurrencyName { get; set; }
    public string OuName { get; set; }
    public string ReferenceNumber { get; set; }
    public string ChequeNo { get; set; }
    public bool IsMultiCurrency { get; set; }
}

public class ApPaymentReceipt
{
    // Company Header
    public string CompanyName { get; set; }
    public string PrimaryPhoneNo { get; set; }
    public string Address { get; set; }
    public string Email { get; set; }
    public string ReportTitle { get; set; }
    public string CompanyLogo { get; set; }

    // Payment Details
    public Guid Id { get; set; }
    public string SupplierName { get; set; }
    public string PaymentDate { get; set; }
    public string ChequeNo { get; set; }
    public decimal AmountToApply { get; set; }
    public decimal AmountToPay { get; set; }
    public decimal OutstandingCreditMemo { get; set; }
    public string CurrencyName { get; set; }
    public string ModeOfPayment { get; set; }
    public string CurrencyCode { get; set; }

    // Invoice Details
    public decimal TotalInvoiceAmount { get; set; }
    public decimal Rate { get; set; }
    public string InvoiceNumber { get; set; }
    public string InvoiceType { get; set; }
    public string InvoiceDate { get; set; }

    // Bank & GL Details
    public string BankName { get; set; }
    public string BankBranch { get; set; }
    public string CreditGl { get; set; }
    public string DebitGl { get; set; }
    public string BatchNumber { get; set; }

    // Additional Details
    public string AmountInWords { get; set; }
    public decimal PayRate { get; set; }
}

public class ApPaymentReport
{
    public string SupplierName { get; set; }
    public string PaymentDate { get; set; }
    public string ModeOfPayment { get; set; }
    public string ChequeNumber { get; set; }
    public string BankName { get; set; }
    public string BankBranch { get; set; }
    public string CurrencyName { get; set; }
    public string CurrencyCode { get; set; }
    public string ReceiptNo { get; set; }
    public string InvoiceNumber { get; set; }
    public string InvoiceDate { get; set; }
    public decimal AmountToPay { get; set; }
    public int DaysToPayment { get; set; }
    public decimal TotalAmount { get; set; }
}
public class ApInvoiceReport
{
    // Supplier Details
    public string SupplierName { get; set; }
    public string SupplierAccountNumber { get; set; }
    public string SupplierAddress { get; set; }
    public string SupplierPhoneNo { get; set; }
    public string SupplierContactPerson { get; set; }
    public string SupplierVatNumber { get; set; }
    public decimal SupplierCreditLimit { get; set; }

    // Invoice Details
    public string InvoiceNumber { get; set; }
    public string InvoiceDate { get; set; }
    public string ProjectedPayDate { get; set; }
    public decimal Balance { get; set; }
    public decimal TotalInvoiceAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string CurrencyName { get; set; }
    public decimal VatAmount { get; set; }
    public decimal VatRate { get; set; }
    public string PurchaseOrderNumber { get; set; }

    // Description & Amount Details
    public string AmountInWords { get; set; }
    public string Description { get; set; }
    public decimal Amount { get; set; }
    public string ReferenceNumber { get; set; }
    public decimal Quantity { get; set; }
    public decimal SubTotal { get; set; }
}

//invoice details report
public class InvoicePdfData
{
    public string InvoiceNumber { get; set; }
    public string InvoiceDate { get; set; }
    public string ProjectedPayDate { get; set; }
    public decimal Balance { get; set; }
    public decimal TotalInvoiceAmount { get; set; }
    public string AmountInWords { get; set; }
    public string CurrencyName { get; set; }
    public string PurchaseOrderNumber { get; set; }
    public decimal VatAmount { get; set; }
    public string ReferenceNumber { get; set; }

    public ReportHeader ReportHeader { get; set; }
    public SupplierInfo SupplierInfo { get; set; }
    public List<InvoiceDetailDto> InvoiceDetails { get; set; }
    public SmtpCredentials SmtpCredentials { get; set; }


}

public class SupplierInfo
{
    public string SupplierName { get; set; }
    public string SupplierAddress { get; set; }
    public string SupplierPhoneNo { get; set; }
    public string AccountNumber { get; set; }
    public decimal CreditLimit { get; set; }
    public string VatNumber { get; set; }
    public string ContactPerson { get; set; }
    public string Email { get; set; }
}


public class InvoiceDetailDto
{
    public int Index { get; set; }
    public string Description { get; set; }
    public string ReferenceNumber { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal Amount { get; set; }
    public decimal SubTotal { get; set; }
}
public class SmtpCredentials
{
    public string PrimaryEmailAddress { get; set; }
    public string DefaultFromDisplayName { get; set; }
    public string EmailPassword { get; set; }
    public string MailHostName { get; set; }
    public int PortNumber { get; set; }
    public bool IsSSLEnabled { get; set; }

}
