using System.Dynamic;
using Microsoft.AspNetCore.Mvc;
using TopazErp_FrontEnd.Services;

namespace TopazErp_FrontEnd.Controllers;

public class GeneralLedgerController : Controller
{
    private readonly ITopazErpApi _topazErpApi;

    public GeneralLedgerController(ITopazErpApi topazErpApi)
    {
        _topazErpApi = topazErpApi;
    }
    
    public IActionResult CompanyProfile()
    {
        return View();
    }
     

    public IActionResult Currencies()
    {
        return View();
    }

    public IActionResult SupplierGroups()
    {
        return View();
    }

    public IActionResult CustomerGroups()
    {
         
        return View();
    }

    public IActionResult Departments()
    {
        return View();
    }

    public IActionResult CostCenters()
    {
        return View();
    }
    public IActionResult BanksBranches()
    {
        return View();
    }

    public IActionResult Customers()
    {
        return View();
    }

    public IActionResult Suppliers()
    {
        return View();
    }

    public IActionResult SystemNumbers()
    {
        return View();
    }
    
    public IActionResult DefaultGlNumbers()
    {
        return View();
    }
    
    public IActionResult AccountHeads()
    {
        return View();
    }
    
    public IActionResult CoaControl()
    {
        return View();
    }
    
    public IActionResult CoaDetails()
    {
        return View();
    }
    
    
    public IActionResult BankAccounts()
    {
        return View();
    }
    
    
    
    
     
    public IActionResult JournalHistory()
    {
        return View();
    }
    
    public IActionResult Vouchers()
    {
        return View();
    }
    
    public IActionResult VoucherHistory()
    {
        return View();
    }

    public IActionResult CreateSupplierVoucher()
    {
        return View();
    }

    public IActionResult CreateEmployeeVoucher()
    {
        return View();
    }

    public IActionResult CreateCustomerVoucher()
    {
        return View();
    }
}