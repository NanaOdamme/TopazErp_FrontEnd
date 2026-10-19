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

    public IActionResult SystemNumbers()
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

    public IActionResult DefaultSystemNumbers()
    {
        return View();
    }
    
    public IActionResult Statuses()
    {
        return View();
    }
    // GET
    public async Task<IActionResult> Budget(string query, int pageNo = 1, int pageSize = 100)
    {
        dynamic viewmodel = new ExpandoObject();
        
        var result = await _topazErpApi.GetBudgets(pageNo, pageSize, query);
        
        viewmodel.PagedBudgets = result.Result;
        viewmodel.Query = query;

        return View(viewmodel);
    }
    public async Task<IActionResult> AccountHeads(string query, int pageNo = 1, int pageSize = 10)
    {
        dynamic viewmodel = new ExpandoObject();
        
        var result = await _topazErpApi.GetAccountHeads(pageNo, pageSize, query);
        
        viewmodel.PagedAccountHeads = result.Result;
        viewmodel.Query = query;
        
        return View(viewmodel);

    }
    
    public async Task<IActionResult> CoaControl(string query, Guid accountHeadId, int pageNo = 1, int pageSize = 1000)
    {
        dynamic viewmodel = new ExpandoObject();
        
        var result = await _topazErpApi.GetAccountControls(pageNo, pageSize, query, accountHeadId);
        
        viewmodel.PagedAccountControls = result.Result;
        viewmodel.Query = query;

        return View(viewmodel);
    }
    
    public async Task<IActionResult> CoaDetails(string query, int pageNo = 1, int pageSize = 100)
    {
        dynamic viewmodel = new ExpandoObject();
        
        var result = await _topazErpApi.GetAccountDetails(pageNo, pageSize, query, true);
        
        viewmodel.PagedAccountDetails = result.Result;
        viewmodel.Query = query;

        return View(viewmodel);
    }
    
    public IActionResult DefaultGlNumbers()
    {
        return View();
    }
    
    
    public async Task<IActionResult> CostCenters(string query, int pageNo = 1, int pageSize = 1000)
    {
        dynamic viewmodel = new ExpandoObject();
        
        var result = await _topazErpApi.GetCostCenters(pageNo, pageSize, query);
        
        viewmodel.PagedCostCenters = result.Result;
        viewmodel.Query = query;
        
        return View(viewmodel);
    }
    
    public async Task<IActionResult> BankAccounts(string query, int pageNo = 1, int pageSize = 100)
    {
        dynamic viewmodel = new ExpandoObject();
        
        var result = await _topazErpApi.GetBankAccounts(pageNo, pageSize, query);
        
        viewmodel.PagedBankAccounts = result.Result;
        viewmodel.Query = query;

        return View(viewmodel);
    }
    public async Task<IActionResult> Journal(string batchNumber, DateTime? startDate = null, DateTime? endDate = null, bool? isPosted = null, bool? isMultiCurrency = null, int pageNo = 1, int pageSize = 10)
    {
        dynamic viewmodel = new ExpandoObject();
        
        var result = await _topazErpApi.GetJournalTransactions(pageNo, pageSize, batchNumber, startDate, endDate, isPosted, isMultiCurrency);
        
        viewmodel.PagedJournalTransactions = result.Result;
        viewmodel.BatchNumber = batchNumber;
        viewmodel.StartDate = startDate;
        viewmodel.EndDate = endDate;
        viewmodel.IsPosted = isPosted;
        viewmodel.IsMultiCurrency = isMultiCurrency;
        
        return View(viewmodel);
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