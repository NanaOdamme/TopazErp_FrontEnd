using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using TopazErp_FrontEnd.Services;

namespace TopazErp_FrontEnd.Controllers;

public class SchoolManagerController: Controller
{
    private readonly IWebHostEnvironment _env;
    private readonly ITopazErpApi _topazErpApi;

    public SchoolManagerController(IWebHostEnvironment env, ITopazErpApi topazErpApi)
    {
        _env = env;
        _topazErpApi = topazErpApi;
    }
    public IActionResult AcademicYears()
{
    return View();
}

public IActionResult ActualLevels()
{
    return View();
}

public IActionResult BanksBranches()
{
    return View();
}

public IActionResult BoardingItems()
{
    return View();
}

public IActionResult ClassRooms()
{
    return View();
}

public IActionResult Classes()
{
    return View();
}

public IActionResult ConductCutOffs()
{
    return View();
}

public IActionResult CountriesCities()
{
    return View();
}

public IActionResult Currencies()
{
    return View();
}

public IActionResult DisciplinaryActions()
{
    return View();
}

public IActionResult DistanceGroups()
{
    return View();
}

public IActionResult DistanceUnits()
{
    return View();
}

public IActionResult FeesDescriptions()
{
    return View();
}

public IActionResult Healths()
{
    return View();
}

public IActionResult Hostels()
{
    return View();
}

public IActionResult Languages()
{
    return View();
}

public IActionResult LevelClasses()
{
    return View();
}

public IActionResult Locations()
{
    return View();
}

public IActionResult Nationalities()
{
    return View();
}

public IActionResult NurseryGradings()
{
    return View();
}

public IActionResult Offences()
{
    return View();
}

public IActionResult ParentProfessions()
{
    return View();
}

public IActionResult PaymentMethods()
{
    return View();
}

public IActionResult PerformanceAreas()
{
    return View();
}

public IActionResult PtaPositions()
{
    return View();
}

public IActionResult SchoolGroups()
{
    return View();
}

public IActionResult SchoolProfile()
{
    return View();
}

public IActionResult Streams()
{
    return View();
}

public IActionResult Subjects()
{
    return View();
}

public IActionResult SupplementaryItems()
{
    return View();
}

public IActionResult SystemNumbers()
{
    return View();
}

public IActionResult TerminalSubjects()
{
    return View();
}

public IActionResult Terms()
{
    return View();
}

public IActionResult TransportationLocations()
{
    return View();
}

public IActionResult TransportationUnits()
{
    return View();
}
public IActionResult StudentSetups()
{
    return View();
}
public IActionResult StaffSetups()
{
    return View();
} 
public IActionResult AssignSubjects()
{
    return View();
} 
public IActionResult AwardsAndPrizes()
{
    return View();
} 
public IActionResult ClassLevelPercentages()
{
    return View();
} 
public IActionResult DisciplinaryActionEntries()
{
    return View();
} 
public IActionResult TimeTables()
{
    return View();
} 
public IActionResult PtaExecutives()
{
    return View();
} 
public IActionResult ParentSetups()
{
    return View();
} 
public IActionResult SubjectRemarks()
{
    return View();
} 
public IActionResult Excursions()
{
    return View();
} 
public IActionResult YearEndProcedure()
{
    return View();
} 
public IActionResult MidTermRemarks()
{
    return View();
} 
public IActionResult ImportOpeningBalances()
{
    return View();
} 
public IActionResult ImportStudentEvaluations()
{
    return View();
}
public IActionResult ImportStudents()
{
    return View();
}
public IActionResult ImportParents()
{
    return View();
}
public IActionResult ImportTeacherRemarks()
{
    return View();
}
public IActionResult ImportResults()
{
    return View();
}
public IActionResult StudentEvaluations()
{
    return View();
}
public IActionResult ResultEntryPeriod()
{
    return View();
}
public IActionResult Results()
{
    return View();
}
public IActionResult Bills()
{
    return View();
}
public IActionResult BillFooters()
{
    return View();
}
public IActionResult CreditMemos()
{
    return View();
}
public IActionResult OpeningBalances()
{
    return View();
}
public IActionResult FeesSetups()
{
    return View();
}
public IActionResult GlAccounts()
{
    return View();
}
public IActionResult Payments()
{
    return View();
}
public IActionResult PostToGl()
{
    return View();
}
public IActionResult StudentReports()
{
    return View();
}
public IActionResult TimeTableReports()
{
    return View();
}
public IActionResult SubjectsReports()
{
    return View();
}
public IActionResult ExcursionReports()
{
    return View();
}
public IActionResult PtaReports()
{
    return View();
}
public IActionResult PrizeAndAwardsReports()
{
    return View();
}
public IActionResult StaffReports()
{
    return View();
}
public IActionResult ResultsReports()
{
    return View();
}
public IActionResult ContinuousAssessments()
{
    return View();
}
public IActionResult ResultsBySubject()
{
    return View();
}
public IActionResult TerminalReports()
{
    return View();
}
public IActionResult MidTermReports()
{
    return View();
}
public IActionResult Transcript()
{
    return View();
}
public IActionResult GraphReports()
{
    return View();
}
public IActionResult CanceledResults()
{
    return View();
}
public IActionResult CumulativeAverage()
{
    return View();
}
public IActionResult GlTransaction()
{
    return View();
}
public IActionResult Statements()
{
    return View();
}
public IActionResult StudentBalances()
{
    return View();
}
public IActionResult BillsReports()
{
    return View();
}
public IActionResult PaymentReports()
{
    return View();
}
public IActionResult BillsAndPayments()
{
    return View();
}
public IActionResult BillSetupsReports()
{
    return View();
}
public IActionResult CreditMemoReports()
{
    return View();
}
public IActionResult ItemizedFees()
{
    return View();
}
public IActionResult BillSetupReports()
{
    return View();
}
public IActionResult BalanceReports()
{
    return View();
}
public IActionResult CashierDailyReports()
{
    return View();
}
public IActionResult AccountStatusReports()
{
    return View();
}


//API
//academic years
public async Task<ActionResult> GetAcademicYears()
{
    var result = await _topazErpApi.GetAcademicYears();
    return Json(result);
}

public async Task<IActionResult> CreateAcademicYear([FromBody] object input)
{
    var response = await _topazErpApi.CreateAcademicYear(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateAcademicYear([FromBody] object input)
{
    var result = await _topazErpApi.UpdateAcademicYear(input);
    return Json(result);
}

public async Task<ActionResult> DeleteAcademicYear([FromQuery] Guid id)
{
    await _topazErpApi.DeleteAcademicYear(id);
    return Json(200);
}

public async Task<ActionResult> GetAcademicYearTerms()
{
    var result = await _topazErpApi.GetAcademicYearTerms();
    return Json(result);
}

public async Task<IActionResult> CreateAcademicYearTerm([FromBody] object input)
{
    var response = await _topazErpApi.CreateAcademicYearTerm(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateAcademicYearTerm([FromBody] object input)
{
    var result = await _topazErpApi.UpdateAcademicYearTerm(input);
    return Json(result);
}

public async Task<ActionResult> DeleteAcademicYearTerm([FromQuery] Guid id)
{
    await _topazErpApi.DeleteAcademicYearTerm(id);
    return Json(200);
}

public async Task<ActionResult> GetAcademicYearTermDetails()
{
    var result = await _topazErpApi.AcademicYearTermDetails();
    return Json(result);
}

public async Task<IActionResult> CreateAcademicYearTermDetail([FromBody] object input)
{
    var response = await _topazErpApi.CreateAcademicYearTermDetail(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateAcademicYearTermDetail([FromBody] object input)
{
    var result = await _topazErpApi.UpdateAcademicYearTermDetail(input);
    return Json(result);
}

public async Task<ActionResult> DeleteAcademicYearTermDetail([FromQuery] Guid id)
{
    await _topazErpApi.DeleteAcademicYearTermDetail(id);
    return Json(200);
}

public async Task<ActionResult> GetCurrentAcademicYear()
{
    var result = await _topazErpApi.GetCurrentAcademicYear();
    return Json(result);
}

// Streams
public async Task<ActionResult> GetStreams()
{
    var result = await _topazErpApi.GetStreams();
    return Json(result);
}

public async Task<IActionResult> CreateStream([FromBody] object input)
{
    var response = await _topazErpApi.CreateStream(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStream([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStream(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStream([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStream(id);
    return Json(200);
}

// Classes
public async Task<ActionResult> GetClasses()
{
    var result = await _topazErpApi.GetClasses();
    return Json(result);
}

public async Task<IActionResult> CreateClass([FromBody] object input)
{
    var response = await _topazErpApi.CreateClass(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateClass([FromBody] object input)
{
    var result = await _topazErpApi.UpdateClass(input);
    return Json(result);
}

public async Task<ActionResult> DeleteClass([FromQuery] Guid id)
{
    await _topazErpApi.DeleteClass(id);
    return Json(200);
}

// Levels
public async Task<ActionResult> GetLevels()
{
    var result = await _topazErpApi.GetLevels();
    return Json(result);
}

public async Task<IActionResult> CreateLevel([FromBody] object input)
{
    var response = await _topazErpApi.CreateLevel(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateLevel([FromBody] object input)
{
    var result = await _topazErpApi.UpdateLevel(input);
    return Json(result);
}

public async Task<ActionResult> DeleteLevel([FromQuery] Guid id)
{
    await _topazErpApi.DeleteLevel(id);
    return Json(200);
}

// Level Classes
public async Task<ActionResult> GetLevelClasses()
{
    var result = await _topazErpApi.GetLevelClasses();
    return Json(result);
}

public async Task<IActionResult> CreateLevelClass([FromBody] object input)
{
    var response = await _topazErpApi.CreateLevelClass(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateLevelClass([FromBody] object input)
{
    var result = await _topazErpApi.UpdateLevelClass(input);
    return Json(result);
}

public async Task<ActionResult> DeleteLevelClass([FromQuery] Guid id)
{
    await _topazErpApi.DeleteLevelClass(id);
    return Json(200);
}

}