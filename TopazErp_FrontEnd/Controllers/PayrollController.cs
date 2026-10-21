using Microsoft.AspNetCore.Mvc;

namespace TopazErp_FrontEnd.Controllers;

public class PayrollController : Controller
{
    // GET
    public IActionResult Index()
    {
        return View();
    }
}