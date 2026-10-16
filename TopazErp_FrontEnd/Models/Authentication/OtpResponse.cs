using Newtonsoft.Json;

namespace TopazErp_FrontEnd.Models.Authentication;

public class OtpResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public OtpResult Result { get; set; }
}

public class VerifyOtpResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public OtpResult Result { get; set; }
}

public class OtpResult
{
    public string Otp { get; set; }
    public string Message { get; set; }
    public int Code { get; set; }
}