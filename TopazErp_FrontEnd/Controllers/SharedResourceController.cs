using Microsoft.AspNetCore.Mvc;
using TopazErp_FrontEnd.Models;
using TopazErp_FrontEnd.Services;

namespace TopazErp_FrontEnd.Controllers;



public class SharedResourceController: Controller
{
    
    private readonly ITopazErpApi _topazErpApi;

    public SharedResourceController(ITopazErpApi topazErpApi)
    {
        _topazErpApi = topazErpApi;
    }
    
    public async Task<ActionResult> CreateBusinessProfile([FromBody] object input)
    {
        await _topazErpApi.CreateCompanyProfile(input);
        return Json(200);
    }

    public async Task<ActionResult> GetBusinessProfile()
    {
        var result = await _topazErpApi.GetBusinessProfile();
        return Json(result);

    }
        
        //tax levies
        public async Task<ActionResult> GetTaxLevies([FromQuery]int pageNo, int pageSize, string query)
        {
            var result = await _topazErpApi.GetTaxLevies(pageNo, pageSize, query);
            return Json(result);
        }
        
        
        public async Task<ActionResult> CreateTaxLevy([FromBody] object input)
        {
            await _topazErpApi.CreateTaxLevy(input);
            return Json(200);

        }
        
        public async Task<ActionResult> UpdateTaxLevy([FromBody] object input)
        {
            await _topazErpApi.UpdateTaxLevy(input);
            return Json(200);
        }
        
        public async Task<ActionResult> DelTaxLevy([FromQuery] Guid id)
        {
            await _topazErpApi.DeleteTaxLevy(id);
            return Json(200);
        }

        //currency
        public async Task<ActionResult> GetCurrencies(string query, int pageNo = 1, int pageSize = 100)
        {
            var result = await _topazErpApi.GetCurrencies(pageNo, pageSize, query);
            return Json(result);
        }

        public async Task<ActionResult> CreateCurrency([FromBody] object input)
        {
            var result = await _topazErpApi.CreateCurrency(input);
            return Json(result);

        }

        public async Task<ActionResult> UpdateCurrency([FromBody] object input)
        {
            await _topazErpApi.UpdateCurrency(input);
            return Json(200);

        }

        public async Task<ActionResult> DelCurrency([FromQuery] Guid id)
        {
            await _topazErpApi.DeleteCurrency(id);
            return Json(200);
        }

        //system numbers

        public async Task<ActionResult> GetSystemNumbers()
        {
            var result = await _topazErpApi.GetSystemNumbers("");
            return Json(result);
        }
        
        public async Task<ActionResult> GetSystemNumberInfo(string key)
        {
            var result = await _topazErpApi.GetSystemNumbers(key);
            return Json(result);
        }
        
        
        public async Task<ActionResult> UpdateSystemNumber([FromBody] object dto)
        {
            await _topazErpApi.UpdateSystemNumber(dto);
            return Json(200);

        }
        
         
        //supplier group ...
        
        public async Task<ActionResult> GetSupplierGroups(string query, int pageNo = 1, int pageSize = 100)
        {
            var result = await _topazErpApi.GetSupplierGroups(pageNo, pageSize, query);
            return Json(result);
        }

        public async Task<ActionResult> CreateSupplierGroup([FromBody] object input)
        {
            var result = await _topazErpApi.CreateSupplierGroup(input);
            return Json(result);
        }

        public async Task<ActionResult> UpdateSupplierGroup([FromBody] object input)
        {
            await _topazErpApi.UpdateSupplierGroup(input);
            return Json(200);

        }

        public async Task<ActionResult> DelSupplierGroup([FromQuery] Guid id)
        {
            await _topazErpApi.DeleteSupplierGroup(id);
            return Json(200);
        }


        //customer groups...
        public async Task<ActionResult> GetCustomerGroups(string query, int pageNo = 1, int pageSize = 1000)
        {
            var result = await _topazErpApi.GetCustomerGroups(pageNo, pageSize, query);
            return Json(result);
        }

        public async Task<ActionResult> CreateCustomerGroup([FromBody] object input)
        {
            var result = await _topazErpApi.CreateCustomerGroup(input);
            return Json(result);

        }

        public async Task<ActionResult> UpdateCustomerGroup([FromBody] object input)
        {
            await _topazErpApi.UpdateCustomerGroup(input);
            return Json(200);

        }

        public async Task<ActionResult> DelCustomerGroup([FromQuery] Guid id)
        {
            await _topazErpApi.DeleteCustomerGroup(id);
            return Json(200);
        }


        //banks...
        public async Task<ActionResult> GetBanks(string query, int pageNo = 1, int pageSize = 1000)
        {
            var result = await _topazErpApi.GetBanks(pageNo, pageSize, query);
            return Json(result);
        }

        public async Task<ActionResult> CreateBank([FromBody] object input)
        {
            var result = await _topazErpApi.CreateBank(input);
            return Json(result);
        }

        public async Task<ActionResult> UpdateBank([FromBody] object input)
        {
            await _topazErpApi.UpdateBank(input);
            return Json(200);

        }

        public async Task<ActionResult> DelBank([FromQuery] Guid id)
        {
            await _topazErpApi.DeleteBank(id);
            return Json(200);
        }

        public async Task<ActionResult> CreateBankBranch([FromBody] BranchInput input)
        {
            var result = await _topazErpApi.CreateBranch(input);
            return Json(result);
        }

        public async Task<ActionResult> UpdateBankBranch([FromBody] object input)
        {
            await _topazErpApi.UpdateBranch(input);
            return Json(200);

        }

        public async Task<ActionResult> DelBankBranch([FromBody] object input)
        {
            await _topazErpApi.DeleteBranch(input);
            return Json(200);
        }

        //cost centers
        public async Task<ActionResult> GetCostCenters(string query, int pageNo = 1, int pageSize = 2000)
        {
            var result = await _topazErpApi.GetCostCenters(pageNo, pageSize, query);
            return Json(result);
        }

        public async Task<ActionResult> CreateCostCenter([FromBody] object input)
        {
            var result = await _topazErpApi.CreateCostCenter(input);
            return Json(result);
        }

        public async Task<ActionResult> UpdateCostCenter([FromBody] object input)
        {
            await _topazErpApi.UpdateCostCenter(input);
            return Json(200);

        }

        public async Task<ActionResult> DelCostCenter([FromQuery] Guid id)
        {
            await _topazErpApi.DeleteCostCenter(id);
            return Json(200);
        }

        //department...
        public async Task<ActionResult> GetDepartments(string query, int pageNo = 1, int pageSize = 2000)
        {
            var result = await _topazErpApi.GetDepartments(pageNo, pageSize, query);
            return Json(result);
        }

        public async Task<ActionResult> CreateDepartment([FromBody] object input)
        {
            var result = await _topazErpApi.CreateDepartment(input);
            return Json(result);
        }

        public async Task<ActionResult> UpdateDepartment([FromBody] object input)
        {
            await _topazErpApi.UpdateDepartment(input);
            return Json(200);

        }

        public async Task<ActionResult> DelDepartment([FromQuery] Guid id)
        {
            await _topazErpApi.DeleteDepartment(id);
            return Json(200);
        }

        //customers...

        public async Task<ActionResult> GetCustomers(string query, int pageNo = 1, int pageSize = 500)
        {
            var result = await _topazErpApi.GetCustomers(pageNo, pageSize, query);
            return Json(result);
        }

        // employees (payroll lookup used by GL employee payment vouchers)
        public async Task<ActionResult> GetEmployees(string query, int pageNo = 1, int pageSize = 500)
        {
            var result = await _topazErpApi.GetEmployeeBioData(pageNo, pageSize, query);
            return Json(result);
        }

        public async Task<ActionResult> GetCustomersByGroup([FromQuery] Guid groupId)
        {
            var result = await _topazErpApi.GetCustomersByGroup(groupId);
            return Json(result);
        }

        public async Task<ActionResult> CreateCustomer([FromBody] object input)
        {
            var result = await _topazErpApi.CreateCustomer(input);
            return Json(result);
        }

        public async Task<ActionResult> UpdateCustomer([FromBody] object input)
        {
            await _topazErpApi.UpdateCustomer(input);
            return Json(200);

        }

        public async Task<ActionResult> DelCustomer([FromQuery] Guid id)
        {
            await _topazErpApi.DeleteCustomer(id);
            return Json(200);
        }

        //suppliers
        public async Task<ActionResult> GetSuppliers(string query, int pageNo = 1, int pageSize = 500)
        {
            var result = await _topazErpApi.GetSuppliers(pageNo, pageSize, query);
            return Json(result);
        }

        public async Task<ActionResult> GetSuppliersByGroup([FromQuery] Guid groupId)
        {
            var result = await _topazErpApi.GetSuppliersByGroup(groupId);
            return Json(result);
        }

        public async Task<ActionResult> CreateSupplier([FromBody] object input)
        {
            var result = await _topazErpApi.CreateSupplier(input);
            return Json(result);
        }

        public async Task<ActionResult> UpdateSupplier([FromBody] object input)
        {
            await _topazErpApi.UpdateSupplier(input);
            return Json(200);

        }

        public async Task<ActionResult> DelSupplier([FromQuery] Guid id)
        {
            await _topazErpApi.DeleteSupplier(id);
            return Json(200);
        }

        
         
        
        
}