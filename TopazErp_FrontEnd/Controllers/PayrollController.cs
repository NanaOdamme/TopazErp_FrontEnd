using Microsoft.AspNetCore.Mvc;
using TopazErp_FrontEnd.Services;

namespace TopazErp_FrontEnd.Controllers;

public class PayrollController : Controller
{
    private readonly ITopazErpApi _topazErpApi;

    public PayrollController(ITopazErpApi topazErpApi)
    {
        _topazErpApi = topazErpApi;
    }
    
    // GET
    public IActionResult Index()
    {
        return View();
    }
    
    //api
    //employee bio data
    public async Task<IActionResult> GetEmployeesBioData(int pageNo, int pageSize, string query)
    {
        var results = await _topazErpApi.GetEmployeeBioData(pageNo, pageSize, query);
        return Json(results);
    }

    public async Task<IActionResult> CreateEmployeeBioData([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateEmployeeBioData(dto);
        return Json(results);
    }

    public async Task<IActionResult> UpdateEmployeeBioData([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdateEmployeeBioData(dto);
        return Json(results);
    }

    public async Task<IActionResult> DeleteEmployeeBioData([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeleteEmployeeBioData(id);
        return Json(results);
    }
    
    // employee ssnit
    public async Task<IActionResult> GetAllEmployeesSsnitInfo(int pageNo, int pageSize, string query)
    {
        var results = await _topazErpApi.GetEmployeeBioData(pageNo, pageSize, query);
        return Json(results);
    }
    
    public async Task<IActionResult> GetEmployeeSsnitDetails(Guid employeeId)
    {
        var results = await _topazErpApi.GetEmployeeSsnitDetails(employeeId);
        return Json(results);
    }
    
    public async Task<IActionResult> CreateEmployeeSsnit([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateEmployeeBioData(dto);
        return Json(results);
    }

    public async Task<IActionResult> UpdateEmployeeSsnit([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdateEmployeeBioData(dto);
        return Json(results);
    }

    public async Task<IActionResult> DeleteEmployeeSsnit([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeleteEmployeeBioData(id);
        return Json(results);
    }
    
    // employee salary info
    public async Task<IActionResult> GetAllEmployeesSalaryInfo(int pageNo, int pageSize, string query)
    {
        var results = await _topazErpApi.GetEmployeeBioData(pageNo, pageSize, query);
        return Json(results);
    }
    
    public async Task<IActionResult> GetEmployeeSalaryInfo(Guid employeeId)
    {
        var results = await _topazErpApi.GetEmployeeSalaryInfo(employeeId);
        return Json(results);
    }
    
    public async Task<IActionResult> CreateEmployeeSalaryData([FromBody] object dto)
    {
        var results = await _topazErpApi.CreateEmployeeSalaryData(dto);
        return Json(results);
    }

    public async Task<IActionResult> UpdateEmployeesSalaryInfo([FromBody] object dto)
    {
        var results = await _topazErpApi.UpdateEmployeeSalaryData(dto);
        return Json(results);
    }

    public async Task<IActionResult> DeleteEmployeeSalaryData([FromQuery] Guid id)
    {
        var results = await _topazErpApi.DeleteEmployeeSalaryData(id);
        return Json(results);
    }
    
    //
}