using System.Dynamic;
using Microsoft.AspNetCore.Mvc;
using TopazErp_FrontEnd.Models;
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

    [HttpGet]
    public IActionResult CreateCustomer([FromQuery] Guid? id = null)
    {
        ViewBag.CustomerId = id;
        return View();
    }

    public IActionResult Suppliers()
    {
        return View();
    }

    [HttpGet]
    public IActionResult CreateSupplier([FromQuery] Guid? id = null)
    {
        ViewBag.SupplierId = id;
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

    [HttpGet]
    public IActionResult CreatePettyCash([FromQuery] Guid? id = null)
    {
        ViewBag.PettyCashId = id;
        return View();
    }
    
    
    
    
    
    //api
    //save journal
    public async Task<ActionResult> InitJournalEntry()
    {
        var accounts = await _topazErpApi.GetAccountDetails(1, 5000, null, true);
        var costCenters = await _topazErpApi.GetCostCenters(1,1000,"");
        var businessProfile = await _topazErpApi.GetBusinessProfile();
            
        return Json(new { accounts, costCenters, enforceOu = businessProfile.Result is { EnforceOu: true } });
    }

    public async Task<ActionResult> InitSupplierPvEntry()
    {
        var accounts = await _topazErpApi.GetAccountDetails(1, 5000, null, true);
        var costCenters = await _topazErpApi.GetCostCenters(1, 1000, "");
        var defaultGl = await _topazErpApi.GetDefaultGlNumbersSetup();
        var systemNumbers = await _topazErpApi.GetSystemNumbers("");

        var voucherBatchSystemNumber = systemNumbers?.Result?.FirstOrDefault(s =>
            !string.IsNullOrEmpty(s.Key) &&
            (s.Key.Contains("voucher", StringComparison.OrdinalIgnoreCase) ||
             s.Key.Contains("pv", StringComparison.OrdinalIgnoreCase)))
            ?? systemNumbers?.Result?.FirstOrDefault();

        return Json(new
        {
            accounts = accounts?.Result,
            costCenters = costCenters?.Result,
            defaultGlNumbers = defaultGl?.Result,
            voucherBatchSystemNumber
        });
    }

    // dashboard: one round trip that powers the General Ledger dashboard
    [HttpGet]
    public async Task<IActionResult> InitGlDashboard()
    {
        var today = DateTime.Today;
        var journalStart = new DateTime(today.Year, today.Month, 1).AddMonths(-5); // 6 calendar months incl. current
        var voucherStart = today.AddDays(-30);
        var degraded = new List<string>();

        async Task<T?> Fetch<T>(string name, Func<Task<T>> call) where T : class
        {
            try
            {
                return await call();
            }
            catch (Exception)
            {
                degraded.Add(name);
                return null;
            }
        }

        // fire all lookups in parallel; a failing source only degrades that slice
        var journalsTask = Fetch("journals", () => _topazErpApi.GetJournalTransactions(new JournalListFilterDto
        {
            PageNo = 1,
            PageSize = 500,
            StartDate = journalStart,
            EndDate = today
        }));
        var supplierVouchersTask = Fetch("supplierVouchers", () => _topazErpApi.GetVouchers(voucherStart, today, "supplier"));
        var employeeVouchersTask = Fetch("employeeVouchers", () => _topazErpApi.GetVouchers(voucherStart, today, "employee"));
        var customerVouchersTask = Fetch("customerVouchers", () => _topazErpApi.GetVouchers(voucherStart, today, "customer"));
        var suppliersTask = Fetch("suppliers", () => _topazErpApi.GetSuppliers(1, 1000, ""));
        var accountsTask = Fetch("accounts", () => _topazErpApi.GetAccountDetails(1, 5000, "", true));

        await Task.WhenAll(journalsTask, supplierVouchersTask, employeeVouchersTask, customerVouchersTask, suppliersTask, accountsTask);

        var journalHeaders = journalsTask.Result?.Result?.Items?
            .Where(t => t?.JournalHeader != null)
            .Select(t => t!.JournalHeader!)
            .OrderByDescending(h => h.BatchDate)
            .ToList() ?? new List<JournalHeader>();

        var suppliers = suppliersTask.Result?.Result ?? new List<Supplier>();

        object VoucherStat(VoucherResponse? r) => new
        {
            count = r?.Result?.Count ?? 0,
            value = r?.Result?.Sum(v => v.BaseAmount) ?? 0m
        };

        return Json(new
        {
            generatedAt = DateTime.Now,
            journalPeriodStart = journalStart,
            voucherPeriodStart = voucherStart,
            journalHeaders,
            vouchers = new
            {
                supplier = VoucherStat(supplierVouchersTask.Result),
                employee = VoucherStat(employeeVouchersTask.Result),
                customer = VoucherStat(customerVouchersTask.Result)
            },
            payables = new
            {
                supplierCount = suppliers.Count,
                activeSupplierCount = suppliers.Count(s => string.Equals(s.StatusName ?? s.StatusId, "Active", StringComparison.OrdinalIgnoreCase)),
                totalBalance = suppliers.Sum(s => s.Balance),
                topSuppliers = suppliers
                    .OrderByDescending(s => s.Balance)
                    .Take(5)
                    .Select(s => new { s.Id, s.Name, s.AccountNumber, s.Balance })
                    .ToList()
            },
            accounts = new { activeCount = accountsTask.Result?.Result?.Count ?? 0 },
            degraded
        });
    }
    
    
    public async Task<IActionResult> SaveJournal([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateJournal(dto);
        return Json(results);
    }
    
    public async Task<IActionResult> UpdateJournal([FromBody]object dto)
    {
        var results = await _topazErpApi.UpdateJournal(dto);
        return Json(results);
    }
    
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

    public async Task<IActionResult> CheckAccountNo([FromQuery] string accountNo)
    {
        if (string.IsNullOrWhiteSpace(accountNo))
        {
            return Json(new CoaDetailResponse { Result = new List<CoaDetail>(), Success = true });
        }

        var results = await _topazErpApi.CheckAccountNo(accountNo);
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
    
    // suppliers
    public async Task<IActionResult> GetSuppliers()
    {
        var results = await _topazErpApi.GetSuppliers(1,1000, "");
        return Json(results);
    }

    [HttpGet]
    public async Task<IActionResult> GetSupplier([FromQuery] Guid id)
    {
        if (id == Guid.Empty)
        {
            return Json(new SupplierDetailResponse { Success = false, Error = "A supplier id is required." });
        }

        var results = await _topazErpApi.GetSupplier(id);
        return Json(results);
    }

     

    [HttpPost]
    public async Task<IActionResult> CreateSupplier([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateSupplier(dto);
        return Json(results);
    }

    [HttpPost]
    public async Task<IActionResult> UpdateSupplier([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdateSupplier(dto);
        return Json(results);
    }

    [HttpDelete, HttpPost]
    public async Task<IActionResult> DeleteSupplier([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeleteSupplier(id);
        return Json(results);
    }
    
    
    //customers
    public async Task<IActionResult> GetCustomers()
    {
        var results = await _topazErpApi.GetCustomers(1,1000, "");
        return Json(results);
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomer([FromQuery] Guid id)
    {
        if (id == Guid.Empty)
        {
            return Json(new CustomerDetailResponse { Success = false, Error = "A customer id is required." });
        }

        var results = await _topazErpApi.GetCustomer(id);
        return Json(results);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCustomer([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateCustomer(dto);
        return Json(results);
    }

    [HttpPost]
    public async Task<IActionResult> UpdateCustomer([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdateCustomer(dto);
        return Json(results);
    }

    [HttpDelete, HttpPost, HttpGet]
    public async Task<IActionResult> DeleteCustomer([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeleteCustomer(id);
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
    
    // Petty Cash Transactions
    [HttpGet]
    public async Task<IActionResult> GetPettyCashTransactions([FromQuery] int pageNo = 1, [FromQuery] int pageSize = 1000, [FromQuery] string query = "")
    {
        var results = await _topazErpApi.GetPettyTransactions(pageNo, pageSize, query);
        return Json(results);
    }

    [HttpGet]
    public async Task<IActionResult> InitPettyCashEntry()
    {
        var accounts = await _topazErpApi.GetAccountDetails(1, 5000, null, true);
        var costCenters = await _topazErpApi.GetCostCenters(1, 1000, "");
        var departments = await _topazErpApi.GetDepartments(1, 1000, "");
        var recipients = await _topazErpApi.GetPettyCashRecipients(1, 1000, "");
        var currencies = await _topazErpApi.GetCurrencies(1, 100, "");
        var defaultGl = await _topazErpApi.GetDefaultGlNumbersSetup();
        var systemNumbers = await _topazErpApi.GetSystemNumbers("");

        var currentUser = User?.Identity?.Name ?? "Administrator";

        return Json(new
        {
            success = true,
            currentUser,
            accounts = accounts?.Result,
            costCenters = costCenters?.Result,
            departments = departments?.Result,
            recipients = recipients?.Result,
            currencies = currencies?.Result,
            defaultGlNumbers = defaultGl?.Result,
            systemNumbers = systemNumbers?.Result
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreatePettyCash([FromBody] object dto)
    {
        var results = await _topazErpApi.CreatePettyCash(dto);
        return Json(results);
    }

    [HttpPost]
    public async Task<IActionResult> UpdatePettyCash([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdatePettyCash(dto);
        return Json(results);
    }

    [HttpDelete, HttpPost, HttpGet]
    public async Task<IActionResult> DeletePettyCash([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeletePettyCash(id);
        return Json(results);
    }
    
    //Default GL Numbers
    
    public async Task<IActionResult> GetDefaultGlNumbersSetup()
    {
        var results = await _topazErpApi.GetDefaultGlNumbersSetup();
        return Json(results);
    }

    public async Task<IActionResult> CreateDefaultGlNumbers([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateDefaultGlNumbers(dto);
        return Json(results);
    }

    public async Task<IActionResult> UpdateDefaultGlNumbers([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdateDefaultGlNumbers(dto);
        return Json(results);
    }
    
    
    // Journal Transactions
    public async Task<IActionResult> GetJournalTransactions([FromBody]JournalListFilterDto dto)
    {
        var results = await _topazErpApi.GetJournalTransactions(dto);
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
    
    // vouchers
    public async Task<IActionResult> GetVoucherData([FromQuery] DateTime startDate, DateTime endDate, string voucherType)
    {
        var results = await _topazErpApi.GetVouchers(startDate, endDate, voucherType);
        return Json(results);
    }
    
    public async Task<IActionResult> CreateVoucher([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateVoucher(dto);
        return Json(results);
    }

    public async Task<IActionResult> UpdateVoucher([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdateVoucher(dto);
        return Json(results);
    }
    
}