using Newtonsoft.Json;

namespace TopazErp_FrontEnd.Models;

public class BaseApiResponseModel
{
    [JsonProperty("targetUrl")]
    public object TargetUrl { get; set; }

    [JsonProperty("success")]
    public bool Success { get; set; }

    [JsonProperty("error")]
    public object Error { get; set; }

    [JsonProperty("unAuthorizedRequest")]
    public bool UnAuthorizedRequest { get; set; }

    [JsonProperty("__abp")]
    public bool Abp { get; set; }
}


public class BaseApiResponse : BaseApiResponseModel
{
    [JsonProperty("result")]
    public object Result { get; set; }
}