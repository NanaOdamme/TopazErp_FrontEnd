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
    
    //api
    
    public async Task<IActionResult> GetAccountHeads([FromQuery]int pageNo, int pageSize, string query)
    {
        var results = await _topazErpApi.GetAccountHeads(pageNo, pageSize, query);
        return Json(results);
    }
    
    public async Task<IActionResult> CreateAccountHead([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateAccountHead(dto);
        return Json(results);
    }
    
    public async Task<IActionResult> UpdateAccountHead([FromBody]object dto)
    {
        var results = await _topazErpApi.UpdateAccountHead(dto);
        return Json(results);
    }
    
    public async Task<IActionResult> DeleteAccountHead([FromQuery]Guid id)
    {
        var results = await _topazErpApi.DeleteAccountHead(id);
        return Json(results);
    }
    
    //chart of account control
    public async Task<IActionResult> GetAccountControls([FromQuery]int pageNo = 1, [FromQuery]int pageSize = 2000, [FromQuery]string query = null, [FromQuery]Guid? accountHeadId = null)
    {
        var results = await _topazErpApi.GetAccountControls(pageNo, pageSize, query, accountHeadId ?? Guid.Empty);
        return Json(results);
    }
    
    public async Task<IActionResult> GetControlsByAccountHead([FromQuery]Guid id)
    {
        var results = await _topazErpApi.GetControlsByAccountHead(id);
        return Json(results);
    }
    
    public async Task<IActionResult> CreateAccountControl([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateAccountControl(dto);
        return Json(results);
    }
    
    public async Task<IActionResult> UpdateAccountControl([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdateAccountControl(dto);
        return Json(results);
    }
    
    public async Task<IActionResult> DeleteAccountControl([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeleteAccountControl(id);
        return Json(results);
    }
    
    //chart of account detail
    public async Task<IActionResult> GetAccountDetails([FromQuery]int pageNo = 1, [FromQuery]int pageSize = 2000, [FromQuery]string query = null, [FromQuery]bool isActive = true)
    {
        var results = await _topazErpApi.GetAccountDetails(pageNo, pageSize, query, isActive);
        return Json(results);
    }
    
    public async Task<IActionResult> CreateAccountDetail([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateAccountDetail(dto);
        return Json(results);
    }
    
    public async Task<IActionResult> UpdateAccountDetail([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdateAccountDetail(dto);
        return Json(results);
    }
    
    public async Task<IActionResult> DeleteAccountDetail([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeleteAccountDetail(id);
        return Json(results);
    }

    public async Task<IActionResult> CheckAccountDetails([FromQuery] int accountNumber, [FromQuery] Guid accountControlId)
    {
        var results = await _topazErpApi.CheckAccountDetails(accountNumber, accountControlId);
        return Json(results);
    }
}