using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using TopazErp_FrontEnd.Services;

namespace TopazErp_FrontEnd.Controllers
{
    public class ArController : Controller
    {
        private readonly IWebHostEnvironment _env;
        private readonly ITopazErpApi _topazErpApi;

        public ArController(IWebHostEnvironment env, ITopazErpApi topazErpApi)
        {
            _env = env;
            _topazErpApi = topazErpApi;
        }

        public IActionResult DefaultGlNumbers()
        {
            return View();
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

        public IActionResult Nationalities()
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
        
        
       
        public ActionResult OpeningBalances()
        {
            return View();
        }
        
        
        public ActionResult Invoices()
        {
            
            return View();
        }
        
         
            //import
            public ActionResult ImportCustomers()
            {
                return View();
            }
            public ActionResult ImportBalances()
            {
                return View();
            }

            public async Task<IActionResult> DownloadCustomersUploadSample()
            {
                var wwwRoot = _env.WebRootPath;

                byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(Path.Combine(wwwRoot + "/DataSample/", "Customers.xlsx"));
                return File(fileBytes, "application/ms-excel", "Customers.xlsx");

            }
        
            public async Task<IActionResult> DownloadOpeningBalancesUploadSample() 
            {
                var wwwRoot = _env.WebRootPath;

                byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(Path.Combine(wwwRoot + "/DataSample/", "ArOpeningBalance.xlsx"));
                return File(fileBytes, "application/ms-excel", "ArOpeningBalance.xlsx");

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
            public ActionResult CanceledPayments()
            {
                return View();
            }
            public ActionResult CanceledInvoices()
            {
                return View();
            }
            public ActionResult CustomerReports()
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

            public ActionResult BalanceReports()
            {
                return View();
            }

            public ActionResult PaymentReports()
            {
                return View();
            }

        

            public ActionResult AgeingReports()
            {
                return View();
            }

            public ActionResult CreditMemoReports()
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

        public IActionResult CreditMemos()
        {
            return View();
        }
        public IActionResult Quotations()
        {
            return View();
        }
        
        //apis
         public async Task<ActionResult> GetOpeningBalances(string query, int pageNo = 1, int pageSize = 1000)
            {
                var result = await _topazErpApi.GetArOpeningBalances(pageNo, pageSize, query);
                return Json(result);
            }

        
            public async Task<IActionResult> CreateOpeningBalance([FromBody] object input)
            {
                var response = await _topazErpApi.CreateArOpeningBalance(input);

                return Content(
                    JsonConvert.SerializeObject(response),
                    "application/json");
            }
            
            public async Task<IActionResult> UpdateOpeningBalance([FromBody] object input)
            {
                var result = await _topazErpApi.UpdateArOpeningBalance(input);
                return Json(result);
            }
        
            public async Task<ActionResult> DeleteOpeningBalance([FromQuery] Guid id)
            {
                await _topazErpApi.DeleteArOpeningBalance(id);
                return Json(200);
            }
            
            public async Task<IActionResult> PostOpeningBalances([FromBody] List<Guid> balanceIds)
            {
                if (balanceIds == null || balanceIds.Count == 0)
                {
                    return Json(new { success = false, message = "No opening balances were received." });
                }

                var result = await _topazErpApi.PostArOpeningBalances(balanceIds);
                return Json(result);
            }
            //Invoices
            public async Task<ActionResult> GetInvoices(string query, int pageNo = 1, int pageSize = 1000)
            {
                var result = await _topazErpApi.GetArInvoices(pageNo, pageSize, query);
                return Json(result);
            }
            public async Task<IActionResult> CreateInvoice([FromBody] object input)
            {
                var response = await _topazErpApi.CreateArInvoice(input);

                return Content(
                    JsonConvert.SerializeObject(response),
                    "application/json");
            } 
            public async Task<IActionResult> UpdateInvoice([FromBody] object input)
            {
                var result = await _topazErpApi.UpdateArInvoice(input);
                return Json(result);
            }
            public async Task<IActionResult> PostInvoices([FromBody] List<Guid> invoiceIds)
            {
                if (invoiceIds == null || invoiceIds.Count == 0)
                {
                    return Json(new { success = false, message = "No invoices were received." });
                }

                var result = await _topazErpApi.PostArInvoices(invoiceIds);
                return Json(result);
            }

            public async Task<IActionResult> CancelInvoices([FromBody] List<Guid> invoiceIds)
            {
                if (invoiceIds == null || invoiceIds.Count == 0)
                {
                    return Json(new { success = false, message = "No invoices were received." });
                }

                var result = await _topazErpApi.CancelArInvoices(invoiceIds);
                return Json(result);
            }
            public async Task<IActionResult> ApproveInvoices([FromBody] List<Guid> invoiceIds)
            {
                if (invoiceIds == null || invoiceIds.Count == 0)
                {
                    return Json(new { success = false, message = "No invoices were received." });
                }

                var result = await _topazErpApi.ApproveArInvoices(invoiceIds);
                return Json(result);
            }
            //Payments
            public async Task<ActionResult> GetPayments([FromQuery] string query, [FromQuery] int pageNo = 1, [FromQuery] int pageSize = 1000)
            {
                var result = await _topazErpApi.GetArPayments(pageNo, pageSize, query);
                return Json(result);
            }
       
            public async Task<IActionResult> CreatePayment([FromBody] object input)
            {
                var result = await _topazErpApi.CreateArPayment(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }

            
            public async Task<IActionResult> UpdatePayment([FromBody] object input)
            {
                var result = await _topazErpApi.UpdateArPayment(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }

          
            public async Task<IActionResult> DeletePayment([FromQuery] Guid id)
            {
                var result = await _topazErpApi.DeleteArPayment(id);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            
            public async Task<IActionResult> PostPayments([FromBody] List<Guid> paymentIds)
            {
                if (paymentIds == null || paymentIds.Count == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "No payments were received."
                    });
                }

                var result = await _topazErpApi.PostArPayments(paymentIds);

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

                var result = await _topazErpApi.CancelArPayments(paymentIds);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            //creditmemo
            public async Task<ActionResult> GetCreditMemos([FromQuery] string query, [FromQuery] int pageNo = 1, [FromQuery] int pageSize = 1000)
            {
                var result = await _topazErpApi.GetCreditMemos(pageNo, pageSize, query);
                return Json(result);
            }
            
            public async Task<IActionResult> CreateCreditMemo([FromBody] object input)
            {
                var result = await _topazErpApi.CreateCreditMemo(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            
            public async Task<IActionResult> UpdateCreditMemo([FromBody] object input)
            {
                var result = await _topazErpApi.UpdateCreditMemo(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }

            [HttpDelete]
            public async Task<IActionResult> DeleteCreditMemo([FromQuery] Guid id)
            {
                var result = await _topazErpApi.DeleteCreditMemo(id);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
        
            public async Task<IActionResult> ApplyCreditMemo([FromBody] object input)
            {
                var result = await _topazErpApi.ApplyCreditMemo(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            //quotations
            public async Task<ActionResult> GetQuotations([FromQuery] int pageNo = 1, [FromQuery] int pageSize = 1000, [FromQuery] string query = "")
            {
                var result = await _topazErpApi.GetQuotations(pageNo, pageSize, query);
                return Json(result);
            }
            
            public async Task<IActionResult> CreateQuotation([FromBody] object input)
            {
                var result = await _topazErpApi.CreateQuotation(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            
            public async Task<IActionResult> UpdateQuotation([FromBody] object input)
            {
                var result = await _topazErpApi.UpdateQuotation(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            
            public async Task<IActionResult> DeleteQuotation([FromQuery] Guid id)
            {
                var result = await _topazErpApi.DeleteQuotation(id);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
        
            
            public async Task<ActionResult> GetAgingByDate([FromQuery] DateTime startDate, [FromQuery] int agingInterval)
            {
                var result = await _topazErpApi.GetArAgingByDate(startDate, agingInterval);
                return Json(result);
            }
            public async Task<IActionResult> SendEmail([FromBody] object input)
            {
                var result = await _topazErpApi.SendArEmail(input);

                return Content(
                    JsonConvert.SerializeObject(result),
                    "application/json");
            }
            
            
            
                public async Task<ActionResult> GetReportHeader([FromQuery] string title)
                {
                    var result = await _topazErpApi.GetReportHeader(title);
                    return Json(result);
                }
                
                public async Task<ActionResult> GetStatement([FromQuery] Guid customerId)
                {
                    var result = await _topazErpApi.GetArStatement(customerId);
                    return Json(result);
                }

                public async Task<ActionResult> GetStatementType2([FromQuery] Guid customerId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetArStatementType2(customerId, startDate, endDate);
                    return Json(result);
                }

                public async Task<ActionResult> GetStatementType3([FromQuery] Guid customerId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetArStatementType3(customerId, startDate, endDate);
                    return Json(result);
                }

                public async Task<ActionResult> GetStatementByOu([FromQuery] Guid customerId, [FromQuery] Guid ouid, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetArStatementByOu(customerId, ouid, startDate, endDate);
                    return Json(result);
                }

                public async Task<ActionResult> GetStatementByOuType2([FromQuery] Guid customerId, [FromQuery] Guid ouid, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetArStatementByOuType2(customerId, ouid, startDate, endDate);
                    return Json(result);
                }

                public async Task<ActionResult> GetInvoiceReport([FromQuery] Guid customerId)
                {
                    var result = await _topazErpApi.GetArInvoiceReport(customerId);
                    return Json(result);
                }

                public async Task<ActionResult> GetAllInvoices()
                {
                    var result = await _topazErpApi.GetAllArInvoices();
                    return Json(result);
                }

                public async Task<ActionResult> GetCanceledInvoices()
                {
                    var result = await _topazErpApi.GetArCanceledInvoices();
                    return Json(result);
                }

                public async Task<ActionResult> GetInvoiceByBatch([FromQuery] string batchNumber)
                {
                    var result = await _topazErpApi.GetArInvoiceByBatch(batchNumber);
                    return Json(result);
                }

                public async Task<ActionResult> GetInvoiceByInvoiceNumber([FromQuery] string invoiceNumber)
                {
                    var result = await _topazErpApi.GetArInvoiceByInvoiceNumber(invoiceNumber);
                    return Json(result);
                }

                public async Task<ActionResult> GetInvoiceByDate([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetArInvoiceByDate(startDate, endDate);
                    return Json(result);
                }

                public async Task<ActionResult> GetInvoiceByRange([FromQuery] int startNumber, [FromQuery] int endNumber)
                {
                    var result = await _topazErpApi.GetArInvoiceByRange(startNumber, endNumber);
                    return Json(result);
                }

                public async Task<ActionResult> GetInvoiceReportById([FromQuery] Guid id)
                {
                    var result = await _topazErpApi.GetArInvoiceReportById(id);
                    return Json(result);
                }

                public async Task<ActionResult> GetInvoiceDetails([FromQuery] Guid id)
                {
                    var result = await _topazErpApi.GetArInvoiceDetails(id);
                    return Json(result);
                }

                public async Task<ActionResult> GetBalancesReport([FromQuery] string status)
                {
                    var result = await _topazErpApi.GetArBalancesReport(status);
                    return Json(result);
                }

                public async Task<ActionResult> GetBalancesByCustomer([FromQuery] Guid customerId, [FromQuery] string status)
                {
                    var result = await _topazErpApi.GetArBalancesByCustomer(customerId, status);
                    return Json(result);
                }

                public async Task<ActionResult> GetAllConvertedBalances([FromQuery] string status)
                {
                    var result = await _topazErpApi.GetAllConvertedArBalances(status);
                    return Json(result);
                }

                public async Task<ActionResult> GetPaymentsReport()
                {
                    var result = await _topazErpApi.GetArPaymentsReport();
                    return Json(result);
                }

                public async Task<ActionResult> GetArPaymentsByCustomer([FromQuery] Guid customerId)
                {
                    var result = await _topazErpApi.GetArPaymentsByCustomer(customerId);
                    return Json(result);
                }

                public async Task<ActionResult> GetPaymentsByDate([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
                {
                    var result = await _topazErpApi.GetArPaymentsByDate(startDate, endDate);
                    return Json(result);
                }

                // Supports either ?id={guid} or repeated ?ids={guid}&ids={guid} parameters.
                public async Task<ActionResult> GetApPaymentReceipts([FromQuery] Guid? id, [FromQuery] List<Guid> ids)
                {
                    var result = id.HasValue ? await _topazErpApi.GetArPaymentReceipts(id.Value) : await _topazErpApi.GetArPaymentReceipts(ids ?? new List<Guid>());
                    return Json(result);
                }

                public async Task<ActionResult> GetQuotationsReport()
                {
                    var result = await _topazErpApi.GetQuotationsReport();
                    return Json(result);
                }
        

                // Matches the ApReports/GetAgeingByDate URL from your API client.
                public async Task<ActionResult> GetAgeingByDate([FromQuery] DateTime startDate, [FromQuery] int agingInterval)
                {
                    var result = await _topazErpApi.GetArAgingByDate(startDate, agingInterval);
                    return Json(result);
                }

                public async Task<ActionResult> GetAgingSummary([FromQuery] DateTime startDate, [FromQuery] int agingInterval)
                {
                    var result = await _topazErpApi.GetArAgingSummary(startDate, agingInterval);
                    return Json(result);
                }

                public async Task<ActionResult> GetAgingByCustomer([FromQuery] Guid customerId, [FromQuery] DateTime startDate, [FromQuery] int agingInterval)
                {
                    var result = await _topazErpApi.GetArAgingByCustomer(customerId, startDate, agingInterval);
                    return Json(result);
                }

                public async Task<ActionResult> GetGlTransaction([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] bool isMultiCurrency)
                {
                    var result = await _topazErpApi.GetArGlTransaction(startDate, endDate, isMultiCurrency);
                    return Json(result);
                }
    }
}
