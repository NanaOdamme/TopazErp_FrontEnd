using Microsoft.AspNetCore.Mvc;

namespace TopazErp_FrontEnd.Controllers;

public class DashboardController: Controller
{
    public IActionResult Payroll()
    {
        return View();
    }
    public IActionResult Ap()
    {
        return View();
    }
    
    public IActionResult Ar()
    {
        return View();
    }

    
    public IActionResult GeneralLedger()
    {
        return View();
    }
    
    public IActionResult SchoolManager()
    {
        return View();
    }
    public IActionResult Asset()
    {
        return View();
    }
}