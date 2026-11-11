using System.Text;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using TopazErp_FrontEnd.Services;
using TopazErp_FrontEnd.Models;

namespace TopazErp_FrontEnd.Controllers
{
    
    public class ApController : Controller
    {
        private readonly IWebHostEnvironment _env;
        private readonly ITopazErpApi _topazErpApi;

        public ApController(IWebHostEnvironment env, ITopazErpApi topazErpApi)
        {
            _env = env;
            _topazErpApi = topazErpApi;
        }

        //shared
        public IActionResult DefaultGlNumbers()
        {
            return View();
        }
        
        public IActionResult CompanyProfile()
        {
            return View();
        }
        public IActionResult Relationships()
        {
            return View();
        }

        public IActionResult Religions()
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
        

        public IActionResult Suppliers()
        {
            return View();
        }

        public IActionResult Nationalities()
        {
            return View();
        }
        public ActionResult Titles()
        {
            return View();
        }
        public ActionResult Suffixes()
        {
            return View();
        }
        public ActionResult Designations()
        {
            return View();
        }
        public ActionResult TypesOfAddresses()
        {
            return View();
        }
        
        public ActionResult TypesOfPhones()
        {
            return View();
        }
        
        public ActionResult JobTitles()
        {
            return View();
        }
        
        public ActionResult Statuses()
        {
            return View();
        }
        // dataentry
        
        public ActionResult Payments()
        {
            return View();
        }
        
        public ActionResult Vouchers()
        {
            return View();
        }
        
       
        public ActionResult OpeningBalances()
        {
            return View();
        }
        
        
        public ActionResult Invoices()
        {
            
            return View();
        }
            public ActionResult DebitMemos()
            {
                return View();
            }
      
            //import
            public ActionResult ImportSuppliers()
            {
                return View();
            }
            public ActionResult ImportBalances()
            {
                return View();
            }
            public ActionResult EmailInvoice()
            {
                return View();
            }
            public ActionResult PaidInvoices()
            {
                return View();
            }
            public ActionResult Aging()
            {
                return View();
            }
            public ActionResult CanceledInvoices()
            {
                return View();
            }
            public ActionResult CanceledPayments()
            {
                return View();
            }
            public ActionResult SupplierReports()
            {
                return View();
            }

            public ActionResult Statements()
            {
                return View();
            }

            public ActionResult InvoiceReports()
            {
                return View();
            }
            public ActionResult InvoicePdfReports()
            {
                return View();
            }

            public ActionResult BalanceReports()
            {
                return View();
            }

            public ActionResult PaymentReports()
            {
                return View();
            }

            public ActionResult VoucherReports()
            {
                return View();
            }

            public ActionResult AgeingReports()
            {
                return View();
            }

            public ActionResult DebitMemoReports()
            {
                return View();
            }

            public ActionResult CanceledInvoicesReports()
            {
                return View();
            }

            public ActionResult GlTransactions()
            {
                return View();
            }

            public ActionResult AuditLogs()
            {
                return View();
            }
            
            
            public async Task<IActionResult> DownloadSuppliersUploadSample()
            {
                var wwwRoot = _env.WebRootPath;

                byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(Path.Combine(wwwRoot + "/DataSample/", "Suppliers.xlsx"));
                return File(fileBytes, "application/ms-excel", "Suppliers.xlsx");

            }
            public async Task<IActionResult> DownloadOpeningBalancesUploadSample()
            {
                var wwwRoot = _env.WebRootPath;

                byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(Path.Combine(wwwRoot + "/DataSample/", "ApOpeningBalance.xlsx"));
                return File(fileBytes, "application/ms-excel", "ApOpeningBalance.xlsx");

            }
          
            //API
            //default gl setup
            public async Task<ActionResult> GetDefaultGlSetup()
            {
                var result = await _topazErpApi.GetDefaultGlNumbersSetup();
                return Json(result);
            }
            public async Task<ActionResult> InitJournalEntry()
            {
                var accounts = await _topazErpApi.GetAccountDetails(1, 5000, null, true);
                return Json(accounts);
            }
            public async Task<ActionResult> GetOpeningBalances(string query, int pageNo = 1, int pageSize = 1000)
            {
                var result = await _topazErpApi.GetApOpeningBalances(pageNo, pageSize, query);
                return Json(result);
            }

        
            public async Task<IActionResult> CreateOpeningBalance([FromBody] object input)
            {
                var response = await _topazErpApi.CreateApOpeningBalance(input);

                return Content(
                    JsonConvert.SerializeObject(response),
                    "application/json");
            }
            
            public async Task<IActionResult> UpdateOpeningBalance([FromBody] object input)
            {
                var result = await _topazErpApi.UpdateApOpeningBalance(input);
                return Json(result);
            }
        
            public async Task<ActionResult> DeleteOpeningBalance([FromQuery] Guid id)
            {
                await _topazErpApi.DeleteApOpeningBalance(id);
                return Json(200);
            }
            
            public async Task<IActionResult> PostOpeningBalances([FromBody] List<Guid> balanceIds)
            {
                if (balanceIds == null || balanceIds.Count == 0)
                {
                    return Json(new { success = false, message = "No opening balances were received." });
                }

                var result = await _topazErpApi.PostApOpeningBalances(balanceIds);
                return Json(result);
            }
            //Invoices
            public async Task<ActionResult> GetInvoices(string query, int pageNo = 1, int pageSize = 1000)
            {
                var result = await _topazErpApi.GetApInvoices(pageNo, pageSize, query);
                return Json(result);
            }
            public async Task<IActionResult> CreateInvoice([FromBody] object input)
            {
                var response = await _topazErpApi.CreateApInvoice(input);

                return Content(
                    JsonConvert.SerializeObject(response),
                    "application/json");
            } 
            public async Task<IActionResult> UpdateInvoice([FromBody] object input)
            {
                var result = await _topazErpApi.UpdateApInvoice(input);
                return Json(result);
            }
            public async Task<IActionResult> PostInvoices([FromBody] List<Guid> invoiceIds)
            {
                if (invoiceIds == null || invoiceIds.Count == 0)
                {
                    return Json(new { success = false, message = "No invoices were received." });
                }

                var result = await _topazErpApi.PostApInvoices(invoiceIds);
                return Json(result);
            }

            public async Task<IActionResult> CancelInvoices([FromBody] List<Guid> invoiceIds)
            {
                if (invoiceIds == null || invoiceIds.Count == 0)
                {
                    return Json(new { success = false, message = "No invoices were received." });
                }

                var result = await _topazErpApi.CancelApInvoices(invoiceIds);
                return Json(result);
            }
            public async Task<IActionResult> ApproveInvoices([FromBody] List<Guid> invoiceIds)
            {
                if (invoiceIds == null || invoiceIds.Count == 0)
                {
                    return Json(new { success = false, message = "No invoices were received." });
                }

                var result = await _topazErpApi.ApproveApInvoices(invoiceIds);
                return Json(result);
            }
            //Payments
            public async Task<ActionResult> GetPayments([FromQuery] string query, [FromQuery] int pageNo = 1, [FromQuery] int pageSize = 1000)
            {
                var result = await _topazErpApi.GetApPayments(pageNo, pageSize, query);
                return Json(result);
            }
       
            public async Task<IActionResult> CreatePayment([FromBody] object input)
            {
                var result = await _topazErpApi.CreateApPayment(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }

            
            public async Task<IActionResult> UpdatePayment([FromBody] object input)
            {
                var result = await _topazErpApi.UpdateApPayment(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }

          
            public async Task<IActionResult> DeletePayment([FromQuery] Guid id)
            {
                var result = await _topazErpApi.DeleteApPayment(id);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            
            public async Task<IActionResult> PostPayments([FromBody] List<Guid>? paymentIds)
            {
                if (paymentIds == null || paymentIds.Count == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "No payments were received."
                    });
                }

                var result = await _topazErpApi.PostApPayments(paymentIds);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }

        
            public async Task<IActionResult> CancelPayments([FromBody] List<Guid> paymentIds)
            {
                if (paymentIds == null || paymentIds.Count == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "No payments were received."
                    });
                }

                var result = await _topazErpApi.CancelApPayments(paymentIds);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            //debitmemo
            public async Task<ActionResult> GetDebitMemos([FromQuery] string query, [FromQuery] int pageNo = 1, [FromQuery] int pageSize = 1000)
            {
                var result = await _topazErpApi.GetDebitMemos(pageNo, pageSize, query);
                return Json(result);
            }
            
            public async Task<IActionResult> CreateDebitMemo([FromBody] object input)
            {
                var result = await _topazErpApi.CreateDebitMemo(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            
            public async Task<IActionResult> UpdateDebitMemo([FromBody] object input)
            {
                var result = await _topazErpApi.UpdateDebitMemo(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }

            [HttpDelete]
            public async Task<IActionResult> DeleteDebitMemo([FromQuery] Guid id)
            {
                var result = await _topazErpApi.DeleteDebitMemo(id);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
        
            public async Task<IActionResult> ApplyDebitMemo([FromBody] object input)
            {
                var result = await _topazErpApi.ApplyDebitMemo(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            //vouchers
            public async Task<ActionResult> GetVouchers([FromQuery] int pageNo = 1, [FromQuery] int pageSize = 1000, [FromQuery] string query = "")
            {
                var result = await _topazErpApi.GetApVouchers(pageNo, pageSize, query);
                return Json(result);
            }
            
            public async Task<IActionResult> CreateVoucher([FromBody] object input)
            {
                var result = await _topazErpApi.CreateApVoucher(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            
            public async Task<IActionResult> UpdateVoucher([FromBody] object input)
            {
                var result = await _topazErpApi.UpdateApVoucher(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            
            public async Task<IActionResult> DeleteVoucher([FromQuery] Guid id)
            {
                var result = await _topazErpApi.DeleteApVoucher(id);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            public async Task<IActionResult> PostVouchers([FromBody] List<Guid> voucherIds)
            {
                if (voucherIds == null || voucherIds.Count == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "No vouchers were received."
                    });
                }

                var result = await _topazErpApi.PostApVouchers(voucherIds);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            
            public async Task<ActionResult> GetAgingByDate([FromQuery] DateTime startDate, [FromQuery] int agingInterval)
            {
                var result = await _topazErpApi.GetApAgingByDate(startDate, agingInterval);
                return Json(result);
            }
            public async Task<IActionResult> SendEmail([FromBody] object input)
            {
                var result = await _topazErpApi.SendApEmail(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            
            
            
                public async Task<ActionResult> GetReportHeader([FromQuery] string title)
                {
                    var result = await _topazErpApi.GetReportHeader(title);
                    return Json(result);
                }

                public async Task<ActionResult> GetSuppliers()
                {
                    var result = await _topazErpApi.GetSuppliers();
                    return Json(result);
                }
                public async Task<ActionResult> GetSuppliersByGroup(Guid groupId)
                {
                    var result = await _topazErpApi.GetSuppliersByGroup(groupId);
                    return Json(result);
                }

                public async Task<ActionResult> GetApStatement([FromQuery] Guid supplierId)
                {
                    var result = await _topazErpApi.GetApStatement(supplierId);
                    return Json(result);
                }

                public async Task<ActionResult> GetApStatementType2([FromQuery] Guid supplierId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetApStatementType2(supplierId, startDate, endDate);
                    return Json(result);
                }

                public async Task<ActionResult> GetApStatementType3([FromQuery] Guid supplierId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetApStatementType3(supplierId, startDate, endDate);
                    return Json(result);
                }

                public async Task<ActionResult> GetApStatementByOu([FromQuery] Guid supplierId, [FromQuery] Guid ouid, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetApStatementByOu(supplierId, ouid, startDate, endDate);
                    return Json(result);
                }

                public async Task<ActionResult> GetApStatementByOuType2([FromQuery] Guid supplierId, [FromQuery] Guid ouid, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetApStatementByOuType2(supplierId, ouid, startDate, endDate);
                    return Json(result);
                }

                public async Task<ActionResult> GetApInvoiceReport([FromQuery] Guid supplierId)
                {
                    var result = await _topazErpApi.GetApInvoiceReport(supplierId);
                    return Json(result);
                }

                public async Task<ActionResult> GetAllApInvoices()
                {
                    var result = await _topazErpApi.GetAllApInvoices();
                    return Json(result);
                }

                public async Task<ActionResult> GetApCanceledInvoices()
                {
                    var result = await _topazErpApi.GetApCanceledInvoices();
                    return Json(result);
                }

                public async Task<ActionResult> GetApInvoiceByBatch([FromQuery] string batchNumber)
                {
                    var result = await _topazErpApi.GetApInvoiceByBatch(batchNumber);
                    return Json(result);
                }

                public async Task<ActionResult> GetApInvoiceByInvoiceNumber([FromQuery] string invoiceNumber)
                {
                    var result = await _topazErpApi.GetApInvoiceByInvoiceNumber(invoiceNumber);
                    return Json(result);
                }

                public async Task<ActionResult> GetApInvoiceByDate([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetApInvoiceByDate(startDate, endDate);
                    return Json(result);
                }

                public async Task<ActionResult> GetApInvoiceByRange([FromQuery] int startNumber, [FromQuery] int endNumber)
                {
                    var result = await _topazErpApi.GetApInvoiceByRange(startNumber, endNumber);
                    return Json(result);
                }

                public async Task<ActionResult> GetApInvoiceReportById([FromQuery] Guid id)
                {
                    var result = await _topazErpApi.GetApInvoiceReportById(id);
                    return Json(result);
                }

                public async Task<ActionResult> GetApInvoiceDetails([FromQuery] Guid id)
                {
                    var result = await _topazErpApi.GetApInvoiceDetails(id);
                    return Json(result);
                }

                public async Task<ActionResult> GetApBalancesReport([FromQuery] string status)
                {
                    var result = await _topazErpApi.GetApBalancesReport(status);
                    return Json(result);
                }

                public async Task<ActionResult> GetApBalancesBySupplier([FromQuery] Guid supplierId, [FromQuery] string status)
                {
                    var result = await _topazErpApi.GetApBalancesBySupplier(supplierId, status);
                    return Json(result);
                }

                public async Task<ActionResult> GetAllConvertedApBalances([FromQuery] string status)
                {
                    var result = await _topazErpApi.GetAllConvertedApBalances(status);
                    return Json(result);
                }

                public async Task<ActionResult> GetApPaymentsReport()
                {
                    var result = await _topazErpApi.GetApPaymentsReport();
                    return Json(result);
                }

                public async Task<ActionResult> GetApPaymentsBySupplier([FromQuery] Guid supplierId)
                {
                    var result = await _topazErpApi.GetApPaymentsBySupplier(supplierId);
                    return Json(result);
                }

                public async Task<ActionResult> GetApPaymentsByDate([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetApPaymentsByDate(startDate, endDate);
                    return Json(result);
                }

                // Supports either ?id={guid} or repeated ?ids={guid}&ids={guid} parameters.
                public async Task<ActionResult> GetApPaymentReceipts([FromQuery] Guid? id, [FromQuery] List<Guid> ids)
                {
                    var result = id.HasValue ? await _topazErpApi.GetApPaymentReceipts(id.Value) : await _topazErpApi.GetApPaymentReceipts(ids ?? new List<Guid>());
                    return Json(result);
                }

                public async Task<ActionResult> GetApVouchersReport()
                {
                    var result = await _topazErpApi.GetApVouchersReport();
                    return Json(result);
                }

                public async Task<ActionResult> GetApVouchersBySupplier([FromQuery] Guid supplierId)
                {
                    var result = await _topazErpApi.GetApVouchersBySupplier(supplierId);
                    return Json(result);
                }

                public async Task<ActionResult> GetApVouchersByDate([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetApVouchersByDate(startDate, endDate);
                    return Json(result);
                }

                public async Task<ActionResult> GetApVoucherByInvoice([FromQuery] string invoiceId)
                {
                    var result = await _topazErpApi.GetApVoucherByInvoice(invoiceId);
                    return Json(result);
                }

                public async Task<ActionResult> GetApVoucherDetails([FromQuery] Guid voucherId)
                {
                    var result = await _topazErpApi.GetApVoucherDetails(voucherId);
                    return Json(result);
                }

                public async Task<ActionResult> GetApPaymentVoucher([FromQuery] Guid id)
                {
                    var result = await _topazErpApi.GetApPaymentVoucher(id);
                    return Json(result);
                }

                public async Task<ActionResult> GetApPaymentVouchers([FromQuery] List<Guid> ids)
                {
                    var result = await _topazErpApi.GetApPaymentVouchers(ids ?? new List<Guid>());
                    return Json(result);
                }

                public async Task<ActionResult> GetApDebitMemo()
                {
                    var result = await _topazErpApi.GetApDebitMemo();
                    return Json(result);
                }

                // Matches the ApReports/GetAgeingByDate URL from your API client.
                public async Task<ActionResult> GetAgeingByDate([FromQuery] DateTime startDate, [FromQuery] int agingInterval)
                {
                    var result = await _topazErpApi.GetApAgingByDate(startDate, agingInterval);
                    return Json(result);
                }

                public async Task<ActionResult> GetApAgingSummary([FromQuery] DateTime startDate, [FromQuery] int agingInterval)
                {
                    var result = await _topazErpApi.GetApAgingSummary(startDate, agingInterval);
                    return Json(result);
                }

                public async Task<ActionResult> GetApAgingBySupplier([FromQuery] Guid supplierId, [FromQuery] DateTime startDate, [FromQuery] int agingInterval)
                {
                    var result = await _topazErpApi.GetApAgingBySupplier(supplierId, startDate, agingInterval);
                    return Json(result);
                }

                public async Task<ActionResult> GetApGlTransaction([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] bool isMultiCurrency)
                {
                    var result = await _topazErpApi.GetApGlTransaction(startDate, endDate, isMultiCurrency);
                    return Json(result);
                }
    }
  
    
    
}