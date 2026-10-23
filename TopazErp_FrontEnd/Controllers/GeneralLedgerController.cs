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
    
    
    public IActionResult Journal()
    {
        return View();
    }
    
    public IActionResult CreateJournal()
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

    public IActionResult SupplierPaymentVoucher()
    {
        return View();
    }

    public IActionResult EmployeePaymentVoucher()
    {
        return View();
    }

    public IActionResult CustomerReceiptVoucher()
    {
        return View();
    }
    
    public IActionResult ImprestCategories()
    {
        return View();
    }
    
    public IActionResult Imprests()
    {
        return View();
    }
    
    public IActionResult PettyCashRecipients()
    {
        return View();
    }
    
    public IActionResult PettyCash()
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

    // Bank Accounts
    public async Task<IActionResult> GetBankAccounts([FromQuery] int pageNo = 1, [FromQuery] int pageSize = 2000, [FromQuery] string query = null)
    {
        var results = await _topazErpApi.GetBankAccounts(pageNo, pageSize, query);
        return Json(results);
    }

    public async Task<IActionResult> CreateBankAccount([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateBankAccount(dto);
        return Json(results);
    }

    public async Task<IActionResult> UpdateBankAccount([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdateBankAccount(dto);
        return Json(results);
    }

    public async Task<IActionResult> DeleteBankAccount([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeleteBankAccount(id);
        return Json(results);
    }
    
    
    // imprest categories
    
    public async Task<IActionResult> GetImprestCategories()
    {
        var results = await _topazErpApi.GetImprestCategories(1,100, "");
        return Json(results);
    }

    public async Task<IActionResult> CreateImprestCategory([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateImprestCategory(dto);
        return Json(results);
    }

    public async Task<IActionResult> UpdateImprestCategory([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdateImprestCategory(dto);
        return Json(results);
    }

    public async Task<IActionResult> DeleteImprestCategory([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeleteImprestCategory(id);
        return Json(results);
    }
    
    
    // petty cash recipients
    public async Task<IActionResult> GetPettyCashRecipients([FromQuery] int pageNo = 1, [FromQuery] int pageSize = 1000, [FromQuery] string query = "")
    {
        var results = await _topazErpApi.GetPettyCashRecipients(pageNo, pageSize, query);
        return Json(results);
    }

    public async Task<IActionResult> CreatePettyCashRecipient([FromBody] object dto)
    {
        var results = await _topazErpApi.CreatePettyCashRecipient(dto);
        return Json(results);
    }

    public async Task<IActionResult> UpdatePettyCashRecipient([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdatePettyCashRecipient(dto);
        return Json(results);
    }

    public async Task<IActionResult> DeletePettyCashRecipient([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeletePettyCashRecipient(id);
        return Json(results);
    }
    

    // Journal Transactions
    public async Task<IActionResult> GetJournalTransactions(
        [FromQuery] int pageNo = 1,
        [FromQuery] int pageSize = 1000,
        [FromQuery] string batchNumber = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] bool? isPosted = null,
        [FromQuery] bool? isMultiCurrency = null)
    {
        var results = await _topazErpApi.GetJournalTransactions(pageNo, pageSize, batchNumber, startDate, endDate, isPosted, isMultiCurrency);
        return Json(results);
    }

    public async Task<IActionResult> GetJournalDetails([FromQuery] Guid id)
    {
        var results = await _topazErpApi.GetJournalDetails(id);
        return Json(results);
    }

    [HttpPost]
    public async Task<IActionResult> DeleteJournalBatch([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeleteJournalBatch(id);
        return Json(results);
    }

    [HttpPost]
    public async Task<IActionResult> DeleteJournalBatches([FromBody] List<Guid> ids)
    {
        if (ids == null || ids.Count == 0) return Json(new { success = false, message = "No IDs provided" });
        foreach (var id in ids)
        {
            await _topazErpApi.DeleteJournalBatch(id);
        }
        return Json(new { success = true });
    }

    [HttpPost]
    public async Task<IActionResult> PostJournalBatch([FromQuery] Guid id)
    {
        var results = await _topazErpApi.PostJournal(id);
        return Json(results);
    }

    [HttpPost]
    public async Task<IActionResult> PostJournalBatches([FromBody] List<Guid> ids)
    {
        if (ids == null || ids.Count == 0) return Json(new { success = false, message = "No IDs provided" });
        foreach (var id in ids)
        {
            await _topazErpApi.PostJournal(id);
        }
        return Json(new { success = true });
    }
}