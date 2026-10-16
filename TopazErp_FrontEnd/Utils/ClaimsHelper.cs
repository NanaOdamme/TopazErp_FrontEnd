using System.Security.Claims;
using TopazErp_FrontEnd.Models.Authentication;

namespace TopazErp_FrontEnd.Utils;

public class ClaimsHelper
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ClaimsHelper(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }
    
    public string GetAuthToken()
    {
        var user = _httpContextAccessor.HttpContext.User;
        var authTokenClaim = user?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Authentication);
        return authTokenClaim?.Value;
    }
    
    public static List<Claim> GetClaimsFromSessionResult(SessionResult sessionResult)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, sessionResult.User.UserName),
            new Claim(ClaimTypes.Email, sessionResult.User.EmailAddress),
            new Claim(ClaimTypes.Authentication, sessionResult.AuthToken),
            new Claim("TenantId", sessionResult.Tenant.Id.ToString()),
            new Claim("TenantName", sessionResult.Tenant.Name)
        };

        // Add more claims as needed ...
        return claims;
    }
    
    public static ClaimsPrincipal CreateClaimsPrincipal(SessionResult sessionResult)
    {
        var claims = ClaimsHelper.GetClaimsFromSessionResult(sessionResult);
        var identity = new ClaimsIdentity(claims, "Custom");
        return new ClaimsPrincipal(identity);
    }
}