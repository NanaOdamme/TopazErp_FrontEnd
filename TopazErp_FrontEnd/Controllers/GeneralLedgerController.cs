
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TopazErp_FrontEnd.Models;
using TopazErp_FrontEnd.Services;

namespace TopazErp_FrontEnd.Controllers;
[Authorize]
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
    
    public IActionResult Reports()
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
    
    public IActionResult CreateJournal(Guid? id = null)
    {
        if (id.HasValue && id.Value != Guid.Empty)
        {
            ViewBag.JournalId = id.Value;
        }
        return View();
    }

    public IActionResult CreateJournalEdit(Guid id)
    {
        ViewBag.JournalId = id;
        return View("CreateJournal");
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

    public IActionResult SupplierPaymentVoucher(Guid? id = null)
    {
        if (id.HasValue && id.Value != Guid.Empty)
        {
            ViewBag.VoucherId = id.Value;
        }
        return View();
    }

    public IActionResult SupplierPaymentVoucherEdit(Guid id)
    {
        ViewBag.VoucherId = id;
        return View("SupplierPaymentVoucher");
    }

    public IActionResult EmployeePaymentVoucher(Guid? id = null)
    {
        if (id.HasValue && id.Value != Guid.Empty)
        {
            ViewBag.VoucherId = id.Value;
        }
        return View();
    }

    public IActionResult EmployeePaymentVoucherEdit(Guid id)
    {
        ViewBag.VoucherId = id;
        return View("EmployeePaymentVoucher");
    }

    public IActionResult CustomerReceiptVoucher(Guid? id = null)
    {
        if (id.HasValue && id.Value != Guid.Empty)
        {
            ViewBag.VoucherId = id.Value;
        }
        return View();
    }

    public IActionResult CustomerReceiptVoucherEdit(Guid id)
    {
        ViewBag.VoucherId = id;
        return View("CustomerReceiptVoucher");
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
    //api
//save journal
    public async Task<ActionResult> InitJournalEntry()
    {
        // Fire all independent lookups in parallel
        var accountsTask        = _topazErpApi.GetAccountDetails(1, 5000, null, true);
        var costCentersTask     = _topazErpApi.GetCostCenters(1, 1000, "");
        var businessProfileTask = _topazErpApi.GetBusinessProfile();

        await Task.WhenAll(accountsTask, costCentersTask, businessProfileTask);

        return Json(new
        {
            accounts        = accountsTask.Result,
            costCenters     = costCentersTask.Result,
            enforceOu       = businessProfileTask.Result.Result is { EnforceOu: true }
        });
    }

    public async Task<ActionResult> InitSupplierPvEntry()
    {
        // Fire all independent lookups in parallel
        var accountsTask       = _topazErpApi.GetAccountDetails(1, 5000, null, true);
        var costCentersTask    = _topazErpApi.GetCostCenters(1, 1000, "");
        var defaultGlTask      = _topazErpApi.GetDefaultGlNumbersSetup();
        var systemNumbersTask  = _topazErpApi.GetSystemNumbers("");

        await Task.WhenAll(accountsTask, costCentersTask, defaultGlTask, systemNumbersTask);

        var systemNumbers = systemNumbersTask.Result;

        var voucherBatchSystemNumber = systemNumbers?.Result?.FirstOrDefault(s =>
                                           !string.IsNullOrEmpty(s.Key) &&
                                           (s.Key.Contains("gl-voucher-batch-id", StringComparison.OrdinalIgnoreCase)))
                                       ?? systemNumbers?.Result?.FirstOrDefault();

        var receiptVoucherSystemNumber = systemNumbers?.Result?.FirstOrDefault(s =>
            !string.IsNullOrEmpty(s.Key) &&
            (s.Key.Contains("gl-receipt-voucher-id", StringComparison.OrdinalIgnoreCase)));

        return Json(new
        {
            accounts                 = accountsTask.Result?.Result,
            costCenters              = costCentersTask.Result?.Result,
            defaultGlNumbers         = defaultGlTask.Result?.Result,
            voucherBatchSystemNumber,
            receiptVoucherSystemNumber
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
            value = r?.Result?.Sum(v => v.WithholdingSettings.BaseAmount) ?? 0m
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
    
    
    [HttpPost]
    public async Task<IActionResult> SaveJournal([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateJournal(dto);
        return Json(results);
    }
    
    [HttpPost]
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
    
    public async Task<IActionResult> GetBankGlAccounts()
    {
        var results = await _topazErpApi.GetBankGlAccounts();
        return Json(results);
    }
    
    [HttpPost]
    public async Task<IActionResult> CreateAccountDetail([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateAccountDetail(dto);
        return Json(results);
    }

    [HttpPost]
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
        var results = await _topazErpApi.GetCustomers();
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
    [HttpPost]
    public async Task<IActionResult> GetPettyCashTransactions([FromBody] PettyCashFilterDto? dto)
    {
        dto ??= new PettyCashFilterDto { PageNo = 1, PageSize = 5000 };
        var results = await _topazErpApi.GetPettyTransactions(dto);
        return Json(results);
    }

    [HttpGet]
    [ActionName("GetPettyCashTransactions")]
    public async Task<IActionResult> GetPettyCashTransactionsGet([FromQuery] int pageNo = 1, [FromQuery] int pageSize = 5000, [FromQuery] string? search = null)
    {
        var dto = new PettyCashFilterDto { PageNo = pageNo, PageSize = pageSize, Search = search };
        var results = await _topazErpApi.GetPettyTransactions(dto);
        return Json(results);
    }

    [HttpGet]
    public async Task<IActionResult> InitPettyCashEntry()
    {
        // Fire all independent lookups in parallel
        var accountsTask       = _topazErpApi.GetAccountDetails(1, 5000, null, true);
        var costCentersTask    = _topazErpApi.GetCostCenters(1, 1000, "");
        var departmentsTask    = _topazErpApi.GetDepartments(1, 1000, "");
        var recipientsTask     = _topazErpApi.GetPettyCashRecipients(1, 1000, "");
        var currenciesTask     = _topazErpApi.GetCurrencies(1, 100, "");
        var defaultGlTask      = _topazErpApi.GetDefaultGlNumbersSetup();
        var systemNumbersTask  = _topazErpApi.GetSystemNumbers("");

        await Task.WhenAll(
            accountsTask, costCentersTask, departmentsTask, recipientsTask,
            currenciesTask, defaultGlTask, systemNumbersTask);

        var systemNumbers = systemNumbersTask.Result;

        var pettyCashSystemNumber = systemNumbers?.Result?.FirstOrDefault(s =>
            !string.IsNullOrEmpty(s.Key) &&
            (s.Key.Equals("petty-cash-id", StringComparison.OrdinalIgnoreCase) ||
             s.Key.Contains("petty-cash-id", StringComparison.OrdinalIgnoreCase)));

        var currentUser = User?.Identity?.Name ?? "Administrator";

        return Json(new
        {
            success = true,
            currentUser,
            accounts        = accountsTask.Result?.Result,
            costCenters     = costCentersTask.Result?.Result,
            departments     = departmentsTask.Result?.Result,
            recipients      = recipientsTask.Result?.Result,
            currencies      = currenciesTask.Result?.Result,
            defaultGlNumbers = defaultGlTask.Result?.Result,
            systemNumbers   = systemNumbers?.Result,
            pettyCashSystemNumber
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

    public async Task<IActionResult> DeletePettyCash([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeletePettyCash(id);
        return Json(results);
    }
    
    [HttpGet]
    public async Task<IActionResult> GetPettyCashTransactionDetails([FromQuery] Guid id)
    {
        var results = await _topazErpApi.GetPettyTransactionDetails(id);
        return Json(results);
    }

    [HttpGet]
    [ActionName("GetPettyTransactionDetails")]
    public async Task<IActionResult> GetPettyTransactionDetailsAlias([FromQuery] Guid id)
    {
        return await GetPettyCashTransactionDetails(id);
    }
    
    

    [HttpPost]
    public async Task<IActionResult> PostPettyCash([FromBody] PostVoucherDto? dto = null, [FromQuery] Guid? id = null)
    {
        dto ??= new PostVoucherDto();
        if (id.HasValue && id.Value != Guid.Empty && !dto.Ids.Contains(id.Value))
        {
            dto.Ids.Add(id.Value);
        }
        var results = await _topazErpApi.PostPettyCash(dto);
        return Json(results);
    }

    [HttpPost]
    public async Task<IActionResult> PostPettyCashBatches([FromBody] PostVoucherDto dto)
    {
        return await PostPettyCash(dto);
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
    
    // company profile (used by preview pages)
    [HttpGet]
    public async Task<IActionResult> GetBusinessProfile()
    {
        var result = await _topazErpApi.GetBusinessProfile();
        return Json(result);
    }

    // vouchers
    public async Task<IActionResult> GetVoucherData([FromQuery] DateTime startDate, DateTime endDate, string voucherType)
    {
        var results = await _topazErpApi.GetVouchers(startDate, endDate, voucherType);
        return Json(results);
    }

    [HttpGet]
    public async Task<IActionResult> GetVoucherDetails([FromQuery] Guid id)
    {
        var results = await _topazErpApi.GetVoucherDetails(id);
        return Json(results);
    }
    
    public async Task<IActionResult> CreateVoucher([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateVoucher(dto);
        return Json(results);
    }

    [HttpPost]
    [HttpPut]
    public async Task<IActionResult> UpdateVoucher([FromBody] object dto, [FromQuery] Guid? id = null)
    {
        var results = await _topazErpApi.UpdateVoucher(dto, id);
        return Json(results);
    }

    [HttpPost]
    public async Task<IActionResult> PostVouchers([FromBody] PostVoucherDto dto)
    {
        var results = await _topazErpApi.PostVoucher(dto);
        return Json(results);
    }
    
    [HttpPost]
    public async Task<IActionResult> DeleteVouchers([FromBody] System.Text.Json.JsonElement? body = null, [FromQuery] Guid? id = null)
    {
        return await HandleDeleteVouchers(body, id);
    }

    [HttpPost]
    public async Task<IActionResult> DeleteVoucher([FromBody] System.Text.Json.JsonElement? body = null, [FromQuery] Guid? id = null)
    {
        return await HandleDeleteVouchers(body, id);
    }

    private async Task<IActionResult> HandleDeleteVouchers(System.Text.Json.JsonElement? body, Guid? id)
    {
        var dto = new PostVoucherDto { Ids = new List<Guid>() };
        if (id.HasValue && id.Value != Guid.Empty)
        {
            dto.Ids.Add(id.Value);
        }

        if (body.HasValue)
        {
            var el = body.Value;
            if (el.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var item in el.EnumerateArray())
                {
                    if (item.ValueKind == System.Text.Json.JsonValueKind.String && Guid.TryParse(item.GetString(), out var g))
                    {
                        dto.Ids.Add(g);
                    }
                }
            }
            else if (el.ValueKind == System.Text.Json.JsonValueKind.Object)
            {
                if ((el.TryGetProperty("ids", out var idsProp) || el.TryGetProperty("Ids", out idsProp)) && idsProp.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var item in idsProp.EnumerateArray())
                    {
                        if (item.ValueKind == System.Text.Json.JsonValueKind.String && Guid.TryParse(item.GetString(), out var g))
                        {
                            dto.Ids.Add(g);
                        }
                    }
                }
                if ((el.TryGetProperty("id", out var idProp) || el.TryGetProperty("Id", out idProp)) && idProp.ValueKind == System.Text.Json.JsonValueKind.String && Guid.TryParse(idProp.GetString(), out var singleG))
                {
                    dto.Ids.Add(singleG);
                }
            }
        }

        dto.Ids = dto.Ids.Distinct().ToList();
        var results = await _topazErpApi.DeleteVoucher(dto);
        return Json(results);
    }

    [HttpPost]
    public async Task<IActionResult> PostVoucher([FromBody] PostVoucherDto? dto = null, [FromQuery] Guid? id = null)
    {
        dto ??= new PostVoucherDto();
        if ((dto.Ids == null || !dto.Ids.Any()) && id.HasValue)
        {
            dto.Ids = new List<Guid> { id.Value };
        }
        var results = await _topazErpApi.PostVoucher(dto);
        return Json(results);
    }
    
}