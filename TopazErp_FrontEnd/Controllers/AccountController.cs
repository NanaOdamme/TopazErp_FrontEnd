using Microsoft.AspNetCore.Mvc;

namespace TopazErp_FrontEnd.Controllers;

public class AccountController: Controller
{
    public IActionResult Login()
    {
            
        return View();
    }
    public IActionResult Signup()
    {
            
        return View();
    }
}