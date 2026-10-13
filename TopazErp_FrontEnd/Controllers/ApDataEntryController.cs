

using Microsoft.AspNetCore.Mvc;

namespace TopazErp_FrontEnd.Controllers
{
    
    public class ApDataEntryController : Controller
    {
        
        public ActionResult AllPayments()
        {
            return View();
        }
     
        public ActionResult EditPayment(Guid id)
        {
            ViewBag.PaymentId = id;
            return View();
        }
        
        public ActionResult VoucherAction()
        {
            return View();
        }
        
       
        public ActionResult OpeningBalances()
        {
            return View();
        }
     
        public ActionResult CreateBalance()
        {
            return View();
        }
       
        public ActionResult EditBalance(Guid id)
        {
            ViewBag.BalanceId = id;
            return View();
        }
       
        public ActionResult PostBalance()
        {
            return View();
        }
        
        public ActionResult Invoices()
        {
            
            return View();
        }
       
        public ActionResult AddInvoice()
        {
            
            return View();
        }
        public ActionResult EditInvoice(Guid id, bool isPosted)
        {
            /* string permissionError = null;
             if (isPosted)
            {

                if (!PermissionChecker.IsGranted(PermissionNames.Ap_DataEntry_EditPostedInvoice))
                {
                    permissionError = "You do not have permission to edit posted invoices.";
                }
            }
            else
            {
                if (!PermissionChecker.IsGranted(PermissionNames.Ap_DataEntry_EditInvoice))
                {
                    permissionError = "You do not have permission to edit invoices.";
                }
            }
            */

            ViewBag.InvoiceId = id;
            ViewBag.IsPosted = isPosted;
            /*ViewBag.PermissionError = permissionError;*/
            return View();
            }

        
        
            public ActionResult PostInvoice()
            {
                return View();
            }
            public ActionResult CancelInvoice()
            {
                return View();
            }
   
            public ActionResult CancelPostedInvoice()
            {
                return View();
            }
        
      
            public ActionResult ChangeInvoiceStatus()
            {
                return View();
            }
        
            public ActionResult EditPostedInvoice()
            {
                return View();
            }
       
        
            public Task<ActionResult> PostVouchers()
            {
                try
                {
                    /*var result = await _companyProfileAppService.GetProfile();
                var profile = result as CompanyProfile;

                if (profile?.IsTaxLeviesInclusive == true)
                {
                    TempData["Message"] = "Access to this page is denied!, Please post vouchers from the enterprise data entry";

                }*/

                    return Task.FromResult<ActionResult>(View());
                }
                catch (Exception exception)
                {
                    return Task.FromException<ActionResult>(exception);
                }
            }
        
       
            public ActionResult Payments()
            {
                return View();
            }
        
       
            public ActionResult CancelPayments()
            {
                return View();
            }
        
       
            public ActionResult PostPayment()
            {
                return View();
            }
        
            public ActionResult PaymentApproval()
            {
                return View();
            }
        
      
            public ActionResult WithHoldingPayments()
            {
                return View();
            }
        
       
            public ActionResult ApplyDebitMemo(Guid id)
            {
                ViewBag.MemoId = id;
                return View();
            }
      
            public ActionResult EditMemo(Guid id)
            {
                ViewBag.MemoId = id;
                return View();
            }
       
            public ActionResult InitDebitMemo()
            {
                return View();
            }
      
            public ActionResult CreateMemo()
            {
                return View();
            }
            public ActionResult ApproveInvoice()
            {
                return View();
            }
        
    }
   
    
    
}