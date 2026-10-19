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
    public PagedRecords<CostCenter> Result { get; set; }
}

public class CurrencyResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<Currency> Result { get; set; }
}
public class JournalTransactionResponse: BaseApiResponseModel
{
    [JsonProperty("result")]    
    public PagedRecords<JournalTransaction> Result { get; set; }
    
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

public class EmployeeBioDataResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<EmployeeBioData> Result { get; set; }
}

public class EmployeeSsnitDataResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<EmployeeSnit> Result { get; set; }
}

public class EmployeeSalaryInfoResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<EmployeeSalaryInfo> Result { get; set; }
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
    public PagedRecords<AccountHead> Result { get; set; }
}

public class BankResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<Bank> Result { get; set; }
}

public class BankAccountResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<BankAccount> Result { get; set; }
}

public class CoaControlResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<CoaControl> Result { get; set; }
}

public class CoaControlListResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public List<CoaControl> Result { get; set; }
}

public class CoaDetailResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public PagedRecords<CoaDetail> Result { get; set; }
}

public class CheckCoaDetailResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public CoaDetail Result { get; set; }
}