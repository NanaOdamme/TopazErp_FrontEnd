using Newtonsoft.Json;

namespace TopazErp_FrontEnd.Models.Authentication;

public class TokenResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public TokenResult Result { get; set; }
}

public class TokenResult
{
    public string AccessToken { get; set; }
    
    public string EncryptedAccessToken { get; set; }
    
}

public class SessionResponse: BaseApiResponseModel
{
    [JsonProperty("result")]
    public SessionResult Result { get; set; }
}