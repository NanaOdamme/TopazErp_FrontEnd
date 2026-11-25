namespace TopazErp_FrontEnd.Models;

public class ArModelCollection
{
    
}

public class ArInvoice : AuditedEntity<Guid>
    {
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string CustomerAccountNumber { get; set; }
        public string InvoiceNumber { get; set; }
        public DateTime InvoiceDate { get; set; }
        public DateTime ProjectedPayDate { get; set; }
        public string PurchaseOrderNumber { get; set; }
        public Guid AccountId { get; set; }
        public string AccountName { get; set; }
        public string BatchNumber { get; set; }
        public string VoucherNumber { get; set; }
        public decimal BuyRate { get; set; }
        public decimal SellRate { get; set; }
        public Guid CustomerGroupId { get; set; }
        public string CustomerGroupName { get; set; }
        public bool SendEmail { get; set; }
        public bool SendSms { get; set; }
        public string MinorName { get; set; }
        public bool IsMultiCurrency { get; set; }
        public decimal TotalInvoiceAmount { get; set; }
        public decimal Balance { get; set; }
        public bool VatWithHeld { get; set; }
        public Guid vatId { get; set; }
        public string vatName { get; set; }
        public decimal NewVatRate { get; set; }
        public decimal vatRate { get; set; }
        public bool vatIsApplied { get; set; }
        public decimal vatAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public Guid OuId { get; set; }
        public string OuName { get; set; }
        public Guid CurrencyId { get; set; }
        public string CurrencyName { get; set; }
        //  public decimal CurrencyCode { get; set; }
        public string currencyCode { get; set; }
        public bool IsCanceled { get; set; }
        public bool IsPosted { get; set; }
        public string AccountingPeriod { get; set; }
        public int Status { get; set; }
        public bool IsApproved { get; set; }
        [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
        public List<ArInvoiceTaxLevies> InvoiceTaxLevies { get; set; }
        [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
        public List<ArInvoiceDetail> Details { get; set; }

    }
    public class ArInvoiceTaxLevies
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public decimal Amount { get; set; }
        public decimal Rate { get; set; }
        public bool IsApplied { get; set; }
    }
    public class ArInvoiceDetail
    {
        public Guid Id { get; set; }
        public Guid CreditAccountId { get; set; }
        public string CreditAccountName { get; set; }
        public string Description { get; set; }
        public string ReferenceNo { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Amount { get; set; }
        public decimal SubTotal { get; set; }
        public bool DiscountAsPercentage { get; set; }
        public decimal Discount { get; set; }
    }
    public class ArCreditMemo: AuditedEntity<Guid> 
    {
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; }
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
        public Guid LiabilityGlId { get; set; }
        public string LiabilityName { get; set; }
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
    public class ArPayment : AuditedEntity<Guid>
    {
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; }
        public DateTime BatchDate { get; set; }
        public decimal AmountToPay { get; set; }
        public Guid CurrencyId { get; set; }
        public string CurrencyName { get; set; }
        public string CurrencyCode { get; set; }
        public bool IsMultiCurrency { get; set; }
        public string ModeOfPayment { get; set; }
        public Guid OuId { get; set; }
        public string OuName { get; set; }
        public decimal BuyRate { get; set; }
        public decimal SellRate { get; set; }
        public string ReferenceNo { get; set; }
        public Guid BankAccountId { get; set; }
        public string BankAccountName { get; set; }
        public string BatchNumber { get; set; }
        public string BatchDescription { get; set; }
        public string ChequeNumber { get; set; }
        public Guid InvoiceTypeId { get; set; }
        public string InvoiceTypeName { get; set; }
        public DateTime PaymentDate { get; set; }
        public string MinorName { get; set; }
        public bool IsAutomatic { get; set; }
        public bool IsPosted { get; set; }
        public bool IsCanceled { get; set; }
        public string CanceledBy { get; set; }
        public DateTime? CanceledDate { get; set; }
        public Guid BankId { get; set; }
        public string BankName { get; set; }
        public Guid BankBranchId { get; set; }
        public string BankBranch { get; set; }
        [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
        public List<ArInvoice> InvoiceList { get; set; }
     
    }

    public class ArOpeningBalance : AuditedEntity<Guid>
    {
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; }
        public DateTime TransactionDate { get; set; }
        public decimal Amount { get; set; }
        public Guid CurrencyId { get; set; }
        public string CurrencyName { get; set; }
        public string CurrencyCode { get; set; }
        public decimal BuyRate { get; set; }
        public decimal SellRate { get; set; }
        public Guid OuId { get; set; }
        public string OuName { get; set; }
        public bool IsPosted { get; set; }
      
    }

    public class Quotation : AuditedEntity<Guid>
    {
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string Address { get; set; }
        public string AccountNumber { get; set; }
        public Guid CurrencyId { get; set; }
        public string CurrencyName { get; set; }
        public string CurrencyCode { get; set; }
        public decimal buyRate { get; set; }
        public string QuotationNumber { get; set; }
        public string Notes { get; set; }
        public bool SendEmail { get; set; }
        public bool SendSms { get; set; }
        public bool IsConvertedToInvoice { get; set; }
        public DateTime QuotationDate { get; set; }
        [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
        public List<QuotationDetail> Details { get; set; }
        [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
        public List<ArQuotationTaxLevies> TaxLevies { get; set; }
    }

    public class ArQuotationTaxLevies
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public decimal Amount { get; set; }
        public decimal Rate { get; set; }
        public bool IsApplied { get; set; }
    }
    public class QuotationDetail
    {
        public Guid Id { get; set; }
        public string ReferenceNo { get; set; }
        public string Description { get; set; }
        public Guid DebitAccountId { get; set; }
        public string DebitAccountName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Amount { get; set; }
        public bool DiscountAsPercentage { get; set; }
        public decimal Discount { get; set; }
        public decimal SubTotal { get; set; }
    }

public class ArAgingData
{
    public string CurrencyCode { get; set; }
    public string CustomerName { get; set; }
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
public class ArStatementRecord
{
    public string Type { get; set; }
    public string ContactPerson { get; set; }
    public string ContactPhone { get; set; }
    public string CustomerName { get; set; }
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

public class ArGlTransactions
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
public class ArPaymentReceipt
{
    public string CustomerName { get; set; }
    public string InvoiceNo { get; set; }
    public decimal PaidAmount { get; set; }
    public string PaymentDate { get; set; }
    public string AmountInWords { get; set; }
    public string ModeOfPayment { get; set; }
    public string ChequeNo { get; set; }
    public string CurrencyName { get; set; }
    public string CurrencyCode { get; set; }
    public string ReceiptNo { get; set; }
    public string BankName { get; set; }
    public string BankBranch { get; set; }
    public SmtpCredentials SmtpCredentials { get; set; }
}

public class ArPaymentReport
{
    public string CustomerName { get; set; }
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
public class ArInvoiceReport
{
    // Customer Details
    public string CustomerName { get; set; }
    public string CustomerAccountNumber { get; set; }
    public string CustomerAddress { get; set; }
    public string CustomerPhoneNo { get; set; }
    public string CustomerContactPerson { get; set; }
    public string CustomerVatNumber { get; set; }
    public decimal CustomerCreditLimit { get; set; }

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
public class ArInvoicePdfData
{
    public string InvoiceNumber { get; set; }
    public string InvoiceDate { get; set; }
    public string ProjectedPayDate { get; set; }
    public decimal Balance { get; set; }
    public decimal TotalInvoiceAmount { get; set; }
    public string AmountInWords { get; set; }

    public decimal TotalBeforeDiscount { get; set; }
    public decimal TotalDiscount { get; set; }
    public string CurrencyName { get; set; }
    public string PurchaseOrderNumber { get; set; }
    public decimal VatAmount { get; set; }
    public string ReferenceNumber { get; set; }

    public ReportHeader ReportHeader { get; set; }
    public CustomerInfo CustomerInfo { get; set; }
    public List<ArInvoiceDetailDto> InvoiceDetails { get; set; }

    public SmtpCredentials SmtpCredentials { get; set; }


}
public class CustomerInfo
{
    public string CustomerName { get; set; }
    public string CustomerAddress { get; set; }
    public string CustomerPhoneNo { get; set; }
    public string AccountNumber { get; set; }
    public decimal CreditLimit { get; set; }
    public string VatNumber { get; set; }
    public string ContactPerson { get; set; }
    public string Email { get; set; }
}


public class ArInvoiceDetailDto
{
    public int Index { get; set; }
    public string Description { get; set; }
    public string ReferenceNumber { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal Amount { get; set; }
    public decimal SubTotal { get; set; }
    public decimal Discount { get; set; }
}

public class QuotationData
{
    public string QuotationNumber { get; set; }
    public string QuotationDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string AmountInWords { get; set; }
    public decimal TotalBeforeDiscount { get; set; }
    public decimal TotalDiscount { get; set; }
    public string CurrencyName { get; set; }
    public decimal VatAmount { get; set; }
    public string ReferenceNumber { get; set; }

    public string Notes { get; set; }
    public ReportHeader ReportHeader { get; set; }
    public CustomerInfo CustomerInfo { get; set; }
    public List<QuotationDetailDto> Details { get; set; }
    public SmtpCredentials SmtpCredentials { get; set; }
}



public class QuotationDetailDto
{
    public int Index { get; set; }
    public string Description { get; set; }
    public decimal UnitPrice { get; set; }
    public string ReferenceNumber { get; set; }

    public decimal AmountBeforeDiscount { get; set; }
    public decimal Quantity { get; set; }
    public string Amount { get; set; }
    public decimal SubTotal { get; set; }

}