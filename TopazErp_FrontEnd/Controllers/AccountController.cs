using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TopazErp_FrontEnd.Models.Authentication;
using TopazErp_FrontEnd.Services;
using TopazErp_FrontEnd.Utils;

namespace TopazErp_FrontEnd.Controllers;

public class AccountController: Controller
{
    
    private readonly ITopazErpApi  _topazErpApi;

    public AccountController(ITopazErpApi topazErpApi)
    {
        _topazErpApi = topazErpApi;
    }
    public IActionResult Login()
    {
            
        return View();
    }
    
    [Authorize]
    public IActionResult ModuleManager()
    {
        return View();
    }
    
    public IActionResult Signup()
    {
            
        return View();
    }
    
    public async Task<IActionResult> AttemptLogin(string accountName, string usernameOrEmail, string password)
    {
        var tokenResponse = await _topazErpApi.SignIn(new SignInDto
        {
            AccountName = accountName,
            UserNameOrEmailAddress = usernameOrEmail,
            Password = password
        });
        
        if (tokenResponse.Success)
        {
            await Task.Delay(100);
            //get session data
            var sessionResponse = await _topazErpApi.GetCurrentLoginInformation(tokenResponse.Result.AccessToken);
            
            if (sessionResponse.Success)
            {
                sessionResponse.Result.AuthToken = tokenResponse.Result.AccessToken;
                
                //save the session response in redis,
                // use auth token to send otp and navigate to otp verification page
                // var loginId = Guid.NewGuid().ToString("N");
                //
                // await _redisCacheManager.SetValueAsync(0, loginId, JsonConvert.SerializeObject(sessionResponse.Result));
                //
                // var otpResult =  await _orbitApi.SendEmailOtp(tokenResponse.Result.AccessToken, "Rhyolite ERP - OTP Verification");
                //
                // if (otpResult is { Success: true, Result.Code: 200 })
                // {
                //     return RedirectToAction("VerifyOtp", "Account" , new { id = loginId });
                // }
                
                var claimsPrincipal = ClaimsHelper.CreateClaimsPrincipal(sessionResponse.Result);
                
                await HttpContext.SignInAsync(claimsPrincipal);
            
                return RedirectToAction("ModuleManager", "Account");
            }
            

            return Unauthorized();

        }
        
        return RedirectToAction("Login", "Account");
        
    }

    
    public async Task<IActionResult> Logout()
    {
        // Sign out the user
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        // Clear the session
        HttpContext.Session.Clear();
        
        //clear redis cache for this tenant as well...

        // Redirect to the login page
        return RedirectToAction("Login", "Account");
    }
}