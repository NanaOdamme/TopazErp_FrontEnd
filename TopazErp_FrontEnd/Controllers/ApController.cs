using Microsoft.AspNetCore.Mvc;


namespace TopazErp_FrontEnd.Controllers
{
    
    public class ApController : Controller
    {
        private readonly IWebHostEnvironment _env;
      

        public ApController(IWebHostEnvironment env)
        {
            _env = env;
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
          
       
    }
   
    
    
}