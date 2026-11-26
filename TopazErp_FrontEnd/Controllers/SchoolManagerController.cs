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
public IActionResult AssignTeacherSubjects()
{
    return View();
} 
public IActionResult AssignClasses()
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
public IActionResult RegisterClasses()
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
public IActionResult BehavioralAssessments()
{
    return View();
}
public IActionResult ImportBehavioralAssessments()
{
    return View();
}
public IActionResult Attendance()
{
    return View();
}
public IActionResult PromoteStudents()
{
    return View();
}
public IActionResult PerformanceSkills()
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

public IActionResult Houses()
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



// DisciplinaryAction
public async Task<ActionResult> GetDisciplinaryActions()
{
    var result = await _topazErpApi.GetDisciplinaryActions();
    return Json(result);
}

public async Task<IActionResult> CreateDisciplinaryAction([FromBody] object input)
{
    var response = await _topazErpApi.CreateDisciplinaryAction(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateDisciplinaryAction([FromBody] object input)
{
    var result = await _topazErpApi.UpdateDisciplinaryAction(input);
    return Json(result);
}

public async Task<ActionResult> DeleteDisciplinaryAction([FromQuery] Guid id)
{
    await _topazErpApi.DeleteDisciplinaryAction(id);
    return Json(200);
}

public async Task<ActionResult> GetStDisciplinaryActions()
{
    var result = await _topazErpApi.GetStDisciplinaryActions();
    return Json(result);
}

public async Task<IActionResult> CreateStDisciplinaryAction([FromBody] object input)
{
    var response = await _topazErpApi.CreateStDisciplinaryAction(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStDisciplinaryAction([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStDisciplinaryAction(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStDisciplinaryAction([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStDisciplinaryAction(id);
    return Json(200);
}

// Offence
public async Task<ActionResult> GetOffences()
{
    var result = await _topazErpApi.GetOffences();
    return Json(result);
}

public async Task<IActionResult> CreateOffence([FromBody] object input)
{
    var response = await _topazErpApi.CreateOffence(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateOffence([FromBody] object input)
{
    var result = await _topazErpApi.UpdateOffence(input);
    return Json(result);
}

public async Task<ActionResult> DeleteOffence([FromQuery] Guid id)
{
    await _topazErpApi.DeleteOffence(id);
    return Json(200);
}


// PerformanceArea
public async Task<ActionResult> GetPerformanceAreas()
{
    var result = await _topazErpApi.GetPerformanceAreas();
    return Json(result);
}

public async Task<IActionResult> CreatePerformanceArea([FromBody] object input)
{
    var response = await _topazErpApi.CreatePerformanceArea(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdatePerformanceArea([FromBody] object input)
{
    var result = await _topazErpApi.UpdatePerformanceArea(input);
    return Json(result);
}

public async Task<ActionResult> DeletePerformanceArea([FromQuery] Guid id)
{
    await _topazErpApi.DeletePerformanceArea(id);
    return Json(200);
}

public async Task<ActionResult> GetPerformanceSkills()
{
    var result = await _topazErpApi.GetPerformanceSkills();
    return Json(result);
}

public async Task<IActionResult> CreatePerformanceSkill([FromBody] object input)
{
    var response = await _topazErpApi.CreatePerformanceSkill(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdatePerformanceSkill([FromBody] object input)
{
    var result = await _topazErpApi.UpdatePerformanceSkill(input);
    return Json(result);
}

public async Task<ActionResult> DeletePerformanceSkill([FromQuery] Guid id)
{
    await _topazErpApi.DeletePerformanceSkill(id);
    return Json(200);
}

public async Task<ActionResult> GetStPerformanceSkills()
{
    var result = await _topazErpApi.GetStPerformanceSkills();
    return Json(result);
}

public async Task<IActionResult> CreateStPerformanceSkill([FromBody] object input)
{
    var response = await _topazErpApi.CreateStPerformanceSkill(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStPerformanceSkill([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStPerformanceSkill(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStPerformanceSkill([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStPerformanceSkill(id);
    return Json(200);
}

// Assignments
public async Task<ActionResult> GetResults()
{
    var result = await _topazErpApi.GetResults();
    return Json(result);
}

public async Task<IActionResult> CreateResult([FromBody] object input)
{
    var response = await _topazErpApi.CreateResult(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateResult([FromBody] object input)
{
    var result = await _topazErpApi.UpdateResult(input);
    return Json(result);
}

public async Task<ActionResult> DeleteResult([FromQuery] Guid id)
{
    await _topazErpApi.DeleteResult(id);
    return Json(200);
}

public async Task<ActionResult> GetResultPeriods()
{
    var result = await _topazErpApi.GetResultPeriods();
    return Json(result);
}

public async Task<IActionResult> CreateResultPeriod([FromBody] object input)
{
    var response = await _topazErpApi.CreateResultPeriod(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateResultPeriod([FromBody] object input)
{
    var result = await _topazErpApi.UpdateResultPeriod(input);
    return Json(result);
}

public async Task<ActionResult> DeleteResultPeriod([FromQuery] Guid id)
{
    await _topazErpApi.DeleteResultPeriod(id);
    return Json(200);
}

// AssignedSubject
public async Task<ActionResult> GetAssignedSubjects()
{
    var result = await _topazErpApi.GetAssignedSubjects();
    return Json(result);
}

public async Task<IActionResult> CreateAssignedSubject([FromBody] object input)
{
    var response = await _topazErpApi.CreateAssignedSubject(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateAssignedSubject([FromBody] object input)
{
    var result = await _topazErpApi.UpdateAssignedSubject(input);
    return Json(result);
}

public async Task<ActionResult> DeleteAssignedSubject([FromQuery] Guid id)
{
    await _topazErpApi.DeleteAssignedSubject(id);
    return Json(200);
}

// AwardAndPrize
public async Task<ActionResult> GetAwardTypes()
{
    var result = await _topazErpApi.GetAwardTypes();
    return Json(result);
}

public async Task<IActionResult> CreateAwardType([FromBody] object input)
{
    var response = await _topazErpApi.CreateAwardType(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateAwardType([FromBody] object input)
{
    var result = await _topazErpApi.UpdateAwardType(input);
    return Json(result);
}

public async Task<ActionResult> DeleteAwardType([FromQuery] Guid id)
{
    await _topazErpApi.DeleteAwardType(id);
    return Json(200);
}

public async Task<ActionResult> GetPrizeTypes()
{
    var result = await _topazErpApi.GetPrizeTypes();
    return Json(result);
}

public async Task<IActionResult> CreatePrizeType([FromBody] object input)
{
    var response = await _topazErpApi.CreatePrizeType(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdatePrizeType([FromBody] object input)
{
    var result = await _topazErpApi.UpdatePrizeType(input);
    return Json(result);
}

public async Task<ActionResult> DeletePrizeType([FromQuery] Guid id)
{
    await _topazErpApi.DeletePrizeType(id);
    return Json(200);
}

public async Task<ActionResult> GetPrizeAwards()
{
    var result = await _topazErpApi.GetPrizeAwards();
    return Json(result);
}

public async Task<IActionResult> CreatePrizeAward([FromBody] object input)
{
    var response = await _topazErpApi.CreatePrizeAward(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdatePrizeAward([FromBody] object input)
{
    var result = await _topazErpApi.UpdatePrizeAward(input);
    return Json(result);
}

public async Task<ActionResult> DeletePrizeAward([FromQuery] Guid id)
{
    await _topazErpApi.DeletePrizeAward(id);
    return Json(200);
}

// BehavioralAssessment
public async Task<ActionResult> GetBehavioralAssessments()
{
    var result = await _topazErpApi.GetBehavioralAssessments();
    return Json(result);
}

public async Task<IActionResult> CreateBehavioralAssessment([FromBody] object input)
{
    var response = await _topazErpApi.CreateBehavioralAssessment(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateBehavioralAssessment([FromBody] object input)
{
    var result = await _topazErpApi.UpdateBehavioralAssessment(input);
    return Json(result);
}

public async Task<ActionResult> DeleteBehavioralAssessment([FromQuery] Guid id)
{
    await _topazErpApi.DeleteBehavioralAssessment(id);
    return Json(200);
}

// BillFooter
public async Task<ActionResult> GetBillFooters()
{
    var result = await _topazErpApi.GetBillFooters();
    return Json(result);
}

public async Task<IActionResult> CreateBillFooter([FromBody] object input)
{
    var response = await _topazErpApi.CreateBillFooter(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateBillFooter([FromBody] object input)
{
    var result = await _topazErpApi.UpdateBillFooter(input);
    return Json(result);
}

public async Task<ActionResult> DeleteBillFooter([FromQuery] Guid id)
{
    await _topazErpApi.DeleteBillFooter(id);
    return Json(200);
}

// CategoryPercentage
public async Task<ActionResult> GetCategoryPercentages()
{
    var result = await _topazErpApi.GetCategoryPercentages();
    return Json(result);
}

public async Task<IActionResult> CreateCategoryPercentage([FromBody] object input)
{
    var response = await _topazErpApi.CreateCategoryPercentage(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateCategoryPercentage([FromBody] object input)
{
    var result = await _topazErpApi.UpdateCategoryPercentage(input);
    return Json(result);
}

public async Task<ActionResult> DeleteCategoryPercentage([FromQuery] Guid id)
{
    await _topazErpApi.DeleteCategoryPercentage(id);
    return Json(200);
}

// Certificate
public async Task<ActionResult> GetCertificates()
{
    var result = await _topazErpApi.GetCertificates();
    return Json(result);
}

public async Task<IActionResult> CreateCertificate([FromBody] object input)
{
    var response = await _topazErpApi.CreateCertificate(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateCertificate([FromBody] object input)
{
    var result = await _topazErpApi.UpdateCertificate(input);
    return Json(result);
}

public async Task<ActionResult> DeleteCertificate([FromQuery] Guid id)
{
    await _topazErpApi.DeleteCertificate(id);
    return Json(200);
}

// ChangeStudentStatus
public async Task<IActionResult> CreateStudentStatus([FromBody] object input)
{
    var response = await _topazErpApi.CreateStudentStatus(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStudentStatus([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStudentStatus(input);
    return Json(result);
}

// Attendance
public async Task<ActionResult> GetAttendances()
{
    var result = await _topazErpApi.GetAttendances();
    return Json(result);
}

public async Task<IActionResult> CreateAttendance([FromBody] object input)
{
    var response = await _topazErpApi.CreateAttendance(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateAttendance([FromBody] object input)
{
    var result = await _topazErpApi.UpdateAttendance(input);
    return Json(result);
}

public async Task<ActionResult> DeleteAttendance([FromQuery] Guid id)
{
    await _topazErpApi.DeleteAttendance(id);
    return Json(200);
}

public async Task<ActionResult> GetCumulativeAttendances()
{
    var result = await _topazErpApi.GetCumulativeAttendances();
    return Json(result);
}

public async Task<IActionResult> CreateCumulativeAttendance([FromBody] object input)
{
    var response = await _topazErpApi.CreateCumulativeAttendance(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateCumulativeAttendance([FromBody] object input)
{
    var result = await _topazErpApi.UpdateCumulativeAttendance(input);
    return Json(result);
}

public async Task<ActionResult> DeleteCumulativeAttendance([FromQuery] Guid id)
{
    await _topazErpApi.DeleteCumulativeAttendance(id);
    return Json(200);
}

// ClassLevelPercentage
public async Task<ActionResult> GetClassLevelPercentages()
{
    var result = await _topazErpApi.GetClassLevelPercentages();
    return Json(result);
}

public async Task<IActionResult> CreateClassLevelPercentage([FromBody] object input)
{
    var response = await _topazErpApi.CreateClassLevelPercentage(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateClassLevelPercentage([FromBody] object input)
{
    var result = await _topazErpApi.UpdateClassLevelPercentage(input);
    return Json(result);
}

public async Task<ActionResult> DeleteClassLevelPercentage([FromQuery] Guid id)
{
    await _topazErpApi.DeleteClassLevelPercentage(id);
    return Json(200);
}

// ClassPromotion
public async Task<ActionResult> GetClassPromotions()
{
    var result = await _topazErpApi.GetClassPromotions();
    return Json(result);
}

public async Task<IActionResult> CreateClassPromotion([FromBody] object input)
{
    var response = await _topazErpApi.CreateClassPromotion(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateClassPromotion([FromBody] object input)
{
    var result = await _topazErpApi.UpdateClassPromotion(input);
    return Json(result);
}

// ClassRoom
public async Task<ActionResult> GetClassRooms()
{
    var result = await _topazErpApi.GetClassRooms();
    return Json(result);
}

public async Task<IActionResult> CreateClassRoom([FromBody] object input)
{
    var response = await _topazErpApi.CreateClassRoom(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateClassRoom([FromBody] object input)
{
    var result = await _topazErpApi.UpdateClassRoom(input);
    return Json(result);
}

public async Task<ActionResult> DeleteClassRoom([FromQuery] Guid id)
{
    await _topazErpApi.DeleteClassRoom(id);
    return Json(200);
}

// SmCreditMemo
public async Task<ActionResult> GetSchCreditMemos()
{
    var result = await _topazErpApi.GetSchCreditMemos();
    return Json(result);
}

public async Task<IActionResult> CreateSchCreditMemo([FromBody] object input)
{
    var response = await _topazErpApi.CreateSchCreditMemo(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateSchCreditMemo([FromBody] object input)
{
    var result = await _topazErpApi.UpdateSchCreditMemo(input);
    return Json(result);
}

public async Task<IActionResult> CancelSchCreditMemo([FromBody] List<Guid> memoIds)
{
    var result = await _topazErpApi.CancelSchCreditMemo(memoIds);
    return Json(result);
}


// Excursion
public async Task<ActionResult> GetExcursions()
{
    var result = await _topazErpApi.GetExcursions();
    return Json(result);
}

public async Task<IActionResult> CreateExcursion([FromBody] object input)
{
    var response = await _topazErpApi.CreateExcursion(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateExcursion([FromBody] object input)
{
    var result = await _topazErpApi.UpdateExcursion(input);
    return Json(result);
}

public async Task<ActionResult> DeleteExcursion([FromQuery] Guid id)
{
    await _topazErpApi.DeleteExcursion(id);
    return Json(200);
}

// FeesDescription
public async Task<ActionResult> GetFeesDescriptions()
{
    var result = await _topazErpApi.GetFeesDescriptions();
    return Json(result);
}

public async Task<IActionResult> CreateFeesDescription([FromBody] object input)
{
    var response = await _topazErpApi.CreateFeesDescription(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateFeesDescription([FromBody] object input)
{
    var result = await _topazErpApi.UpdateFeesDescription(input);
    return Json(result);
}

public async Task<ActionResult> DeleteFeesDescription([FromQuery] Guid id)
{
    await _topazErpApi.DeleteFeesDescription(id);
    return Json(200);
}

// FeeSetUp
public async Task<ActionResult> GetFees()
{
    var result = await _topazErpApi.GetFees();
    return Json(result);
}

public async Task<IActionResult> CreateFee([FromBody] object input)
{
    var response = await _topazErpApi.CreateFee(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateFee([FromBody] object input)
{
    var result = await _topazErpApi.UpdateFee(input);
    return Json(result);
}

public async Task<ActionResult> DeleteFee([FromQuery] Guid id)
{
    await _topazErpApi.DeleteFee(id);
    return Json(200);
}

public async Task<ActionResult> GetBoardingItems()
{
    var result = await _topazErpApi.GetBoardingItems();
    return Json(result);
}

public async Task<IActionResult> CreateBoardingItem([FromBody] object input)
{
    var response = await _topazErpApi.CreateBoardingItem(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateBoardingItem([FromBody] object input)
{
    var result = await _topazErpApi.UpdateBoardingItem(input);
    return Json(result);
}

public async Task<ActionResult> DeleteBoardingItem([FromQuery] Guid id)
{
    await _topazErpApi.DeleteBoardingItem(id);
    return Json(200);
}

public async Task<ActionResult> GetBoardingFees()
{
    var result = await _topazErpApi.GetBoardingFees();
    return Json(result);
}

public async Task<IActionResult> CreateBoardingFee([FromBody] object input)
{
    var response = await _topazErpApi.CreateBoardingFee(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateBoardingFee([FromBody] object input)
{
    var result = await _topazErpApi.UpdateBoardingFee(input);
    return Json(result);
}

public async Task<ActionResult> DeleteBoardingFee([FromQuery] Guid id)
{
    await _topazErpApi.DeleteBoardingFee(id);
    return Json(200);
}

// Health
public async Task<ActionResult> GetHealths()
{
    var result = await _topazErpApi.GetHealths();
    return Json(result);
}

public async Task<IActionResult> CreateHealth([FromBody] object input)
{
    var response = await _topazErpApi.CreateHealth(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateHealth([FromBody] object input)
{
    var result = await _topazErpApi.UpdateHealth(input);
    return Json(result);
}

public async Task<ActionResult> DeleteHealth([FromQuery] Guid id)
{
    await _topazErpApi.DeleteHealth(id);
    return Json(200);
}

// Hostel
public async Task<ActionResult> GetHostels()
{
    var result = await _topazErpApi.GetHostels();
    return Json(result);
}

public async Task<IActionResult> CreateHostel([FromBody] object input)
{
    var response = await _topazErpApi.CreateHostel(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateHostel([FromBody] object input)
{
    var result = await _topazErpApi.UpdateHostel(input);
    return Json(result);
}

public async Task<ActionResult> DeleteHostel([FromQuery] Guid id)
{
    await _topazErpApi.DeleteHostel(id);
    return Json(200);
}

// House
public async Task<ActionResult> GetHouses()
{
    var result = await _topazErpApi.GetHouses();
    return Json(result);
}

public async Task<IActionResult> CreateHouse([FromBody] object input)
{
    var response = await _topazErpApi.CreateHouse(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateHouse([FromBody] object input)
{
    var result = await _topazErpApi.UpdateHouse(input);
    return Json(result);
}

public async Task<ActionResult> DeleteHouse([FromQuery] Guid id)
{
    await _topazErpApi.DeleteHouse(id);
    return Json(200);
}

// Location
public async Task<ActionResult> GetLocations()
{
    var result = await _topazErpApi.GetLocations();
    return Json(result);
}

public async Task<IActionResult> CreateLocation([FromBody] object input)
{
    var response = await _topazErpApi.CreateLocation(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateLocation([FromBody] object input)
{
    var result = await _topazErpApi.UpdateLocation(input);
    return Json(result);
}

public async Task<ActionResult> DeleteLocation([FromQuery] Guid id)
{
    await _topazErpApi.DeleteLocation(id);
    return Json(200);
}

// MidTermAssessment
public async Task<ActionResult> GetAssessmentRemarkHeaders()
{
    var result = await _topazErpApi.GetAssessmentRemarkHeaders();
    return Json(result);
}

public async Task<IActionResult> CreateAssessmentRemarkHeader([FromBody] object input)
{
    var response = await _topazErpApi.CreateAssessmentRemarkHeader(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateAssessmentRemarkHeader([FromBody] object input)
{
    var result = await _topazErpApi.UpdateAssessmentRemarkHeader(input);
    return Json(result);
}

public async Task<ActionResult> DeleteAssessmentRemarkHeader([FromQuery] Guid id)
{
    await _topazErpApi.DeleteAssessmentRemarkHeader(id);
    return Json(200);
}

public async Task<ActionResult> GetMidTermAssessments()
{
    var result = await _topazErpApi.GetMidTermAssessments();
    return Json(result);
}

public async Task<IActionResult> CreateMidTermAssessment([FromBody] object input)
{
    var response = await _topazErpApi.CreateMidTermAssessment(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateMidTermAssessment([FromBody] object input)
{
    var result = await _topazErpApi.UpdateMidTermAssessment(input);
    return Json(result);
}

public async Task<ActionResult> DeleteMidTermAssessment([FromQuery] Guid id)
{
    await _topazErpApi.DeleteMidTermAssessment(id);
    return Json(200);
}

// SmOpeningBalance
public async Task<ActionResult> GetSmOpeningBalances()
{
    var result = await _topazErpApi.GetSmOpeningBalances();
    return Json(result);
}

public async Task<IActionResult> CreateSmOpeningBalance([FromBody] object input)
{
    var response = await _topazErpApi.CreateSmOpeningBalance(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateSmOpeningBalance([FromBody] object input)
{
    var result = await _topazErpApi.UpdateSmOpeningBalance(input);
    return Json(result);
}

public async Task<ActionResult> DeleteSmOpeningBalance([FromQuery] Guid id)
{
    await _topazErpApi.DeleteSmOpeningBalance(id);
    return Json(200);
}

public async Task<IActionResult> PostSmOpeningBalance([FromBody] List<Guid> balanceIds)
{
    if (balanceIds == null || balanceIds.Count == 0)
    {
        return Json(new { success = false, message = "No opening balances were received." });
    }

    var result = await _topazErpApi.PostSmOpeningBalance(balanceIds);
    return Json(result);
}

// ParentProfession
public async Task<ActionResult> GetParentProfessions()
{
    var result = await _topazErpApi.GetParentProfessions();
    return Json(result);
}

public async Task<IActionResult> CreateParentProfession([FromBody] object input)
{
    var response = await _topazErpApi.CreateParentProfession(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateParentProfession([FromBody] object input)
{
    var result = await _topazErpApi.UpdateParentProfession(input);
    return Json(result);
}

public async Task<ActionResult> DeleteParentProfession([FromQuery] Guid id)
{
    await _topazErpApi.DeleteParentProfession(id);
    return Json(200);
}

// SmPayment
public async Task<ActionResult> GetSchPayments()
{
    var result = await _topazErpApi.GetSchPayments();
    return Json(result);
}

public async Task<IActionResult> CreateSchPayment([FromBody] object input)
{
    var response = await _topazErpApi.CreateSchPayment(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateSchPayment([FromBody] object input)
{
    var result = await _topazErpApi.UpdateSchPayment(input);
    return Json(result);
}

public async Task<IActionResult> ProcessSchPayments([FromBody] List<Guid> paymentIds)
{
    var result = await _topazErpApi.ProcessSchPayments(paymentIds);
    return Json(result);
}

public async Task<IActionResult> CancelSchPayments([FromBody] List<Guid> paymentIds)
{
    var result = await _topazErpApi.CancelSchPayments(paymentIds);
    return Json(result);
}

// PostToGl
public async Task<IActionResult> PostBills([FromBody] List<Guid> billIds)
{
    var result = await _topazErpApi.PostBills(billIds);
    return Json(result);
}

public async Task<IActionResult> PostSchPayments([FromBody] List<Guid> billIds)
{
    var result = await _topazErpApi.PostSchPayments(billIds);
    return Json(result);
}

public async Task<IActionResult> PostSchCreditMemos([FromBody] List<Guid> memoIds)
{
    var result = await _topazErpApi.PostSchCreditMemos(memoIds);
    return Json(result);
}

// ProcessBill
public async Task<ActionResult> GetBills()
{
    var result = await _topazErpApi.GetBills();
    return Json(result);
}

public async Task<ActionResult> GetStudentBills()
{
    var result = await _topazErpApi.GetStudentBills();
    return Json(result);
}

public async Task<IActionResult> CreateBill([FromBody] object input)
{
    var response = await _topazErpApi.CreateBill(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateBill([FromBody] object input)
{
    var result = await _topazErpApi.UpdateBill(input);
    return Json(result);
}


public async Task<IActionResult> CancelStudentBills([FromBody] object input)
{
    var result = await _topazErpApi.CancelStudentBills(input);
    return Content(JsonConvert.SerializeObject(result), "application/json");
}
/*public async Task<IActionResult> ProcessBills([FromBody] object input)
{
    var result = await _topazErpApi.ProcessBills(input);
    return Json(result);
}

public async Task<IActionResult> CancelStudentBills([FromBody] object input)
{
    var result = await _topazErpApi.CancelStudentBills(input);
    return Json(result);
}*/



// PtaExecutive
public async Task<ActionResult> GetPtaExecutives()
{
    var result = await _topazErpApi.GetPtaExecutives();
    return Json(result);
}

public async Task<IActionResult> CreatePtaExecutive([FromBody] object input)
{
    var response = await _topazErpApi.CreatePtaExecutive(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdatePtaExecutive([FromBody] object input)
{
    var result = await _topazErpApi.UpdatePtaExecutive(input);
    return Json(result);
}

public async Task<ActionResult> DeletePtaExecutive([FromQuery] Guid id)
{
    await _topazErpApi.DeletePtaExecutive(id);
    return Json(200);
}

// PtaPosition
public async Task<ActionResult> GetPtaPositions()
{
    var result = await _topazErpApi.GetPtaPositions();
    return Json(result);
}

public async Task<IActionResult> CreatePtaPosition([FromBody] object input)
{
    var response = await _topazErpApi.CreatePtaPosition(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdatePtaPosition([FromBody] object input)
{
    var result = await _topazErpApi.UpdatePtaPosition(input);
    return Json(result);
}

public async Task<ActionResult> DeletePtaPosition([FromQuery] Guid id)
{
    await _topazErpApi.DeletePtaPosition(id);
    return Json(200);
}

// RegisterClass
public async Task<ActionResult> GetRegisteredClasses()
{
    var result = await _topazErpApi.GetRegisteredClasses();
    return Json(result);
}

public async Task<IActionResult> CreateRegisteredClass([FromBody] object input)
{
    var response = await _topazErpApi.CreateRegisteredClass(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateRegisteredClass([FromBody] object input)
{
    var result = await _topazErpApi.UpdateRegisteredClass(input);
    return Json(result);
}

public async Task<ActionResult> DeleteRegisteredClass([FromQuery] Guid id)
{
    await _topazErpApi.DeleteRegisteredClass(id);
    return Json(200);
}

// RemarkByTeacher
public async Task<ActionResult> GetRemarksByTeachers()
{
    var result = await _topazErpApi.GetRemarksByTeachers();
    return Json(result);
}

public async Task<IActionResult> CreateRemarksByTeacher([FromBody] object input)
{
    var response = await _topazErpApi.CreateRemarksByTeacher(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateRemarksByTeacher([FromBody] object input)
{
    var result = await _topazErpApi.UpdateRemarksByTeacher(input);
    return Json(result);
}

// SchGlAccounts
public async Task<ActionResult> GetSchBillAccounts()
{
    var result = await _topazErpApi.GetSchBillAccounts();
    return Json(result);
}

public async Task<IActionResult> CreateSchBillAccount([FromBody] object input)
{
    var response = await _topazErpApi.CreateSchBillAccount(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateSchBillAccount([FromBody] object input)
{
    var result = await _topazErpApi.UpdateSchBillAccount(input);
    return Json(result);
}

public async Task<ActionResult> DeleteSchBillAccount([FromQuery] Guid id)
{
    await _topazErpApi.DeleteSchBillAccount(id);
    return Json(200);
}

public async Task<ActionResult> GetSchPaymentAccounts()
{
    var result = await _topazErpApi.GetSchPaymentAccounts();
    return Json(result);
}

public async Task<IActionResult> CreateSchPaymentAccount([FromBody] object input)
{
    var response = await _topazErpApi.CreateSchPaymentAccount(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateSchPaymentAccount([FromBody] object input)
{
    var result = await _topazErpApi.UpdateSchPaymentAccount(input);
    return Json(result);
}

public async Task<ActionResult> DeleteSchPaymentAccount([FromQuery] Guid id)
{
    await _topazErpApi.DeleteSchPaymentAccount(id);
    return Json(200);
}

public async Task<ActionResult> GetSchCreditMemoAccounts()
{
    var result = await _topazErpApi.GetSchCreditMemoAccounts();
    return Json(result);
}

public async Task<IActionResult> CreateSchCreditMemoAccount([FromBody] object input)
{
    var response = await _topazErpApi.CreateSchCreditMemoAccount(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateSchCreditMemoAccount([FromBody] object input)
{
    var result = await _topazErpApi.UpdateSchCreditMemoAccount(input);
    return Json(result);
}

public async Task<ActionResult> DeleteSchCreditMemoAccount([FromQuery] Guid id)
{
    await _topazErpApi.DeleteSchCreditMemoAccount(id);
    return Json(200);
}

// SchoolGroup
public async Task<ActionResult> GetSchoolGroups()
{
    var result = await _topazErpApi.GetSchoolGroups();
    return Json(result);
}

public async Task<IActionResult> CreateSchoolGroup([FromBody] object input)
{
    var response = await _topazErpApi.CreateSchoolGroup(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateSchoolGroup([FromBody] object input)
{
    var result = await _topazErpApi.UpdateSchoolGroup(input);
    return Json(result);
}

public async Task<ActionResult> DeleteSchoolGroup([FromQuery] Guid id)
{
    await _topazErpApi.DeleteSchoolGroup(id);
    return Json(200);
}

// SchoolProfile
public async Task<ActionResult> GetSchoolProfile()
{
    var result = await _topazErpApi.GetSchoolProfile();
    return Json(result);
}

public async Task<IActionResult> CreateSchoolProfile([FromBody] object input)
{
    var response = await _topazErpApi.CreateSchoolProfile(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateSchoolProfile([FromBody] object input)
{
    var result = await _topazErpApi.UpdateSchoolProfile(input);
    return Json(result);
}

// StaffBio
public async Task<ActionResult> GetStaffBios()
{
    var result = await _topazErpApi.GetStaffBios();
    return Json(result);
}

public async Task<IActionResult> CreateStaffBio([FromBody] object input)
{
    var response = await _topazErpApi.CreateStaffBio(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStaffBio([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStaffBio(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStaffBio([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStaffBio(id);
    return Json(200);
}

// StaffDesignation
public async Task<ActionResult> GetStaffDesignations()
{
    var result = await _topazErpApi.GetStaffDesignations();
    return Json(result);
}

public async Task<IActionResult> CreateStaffDesignation([FromBody] object input)
{
    var response = await _topazErpApi.CreateStaffDesignation(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStaffDesignation([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStaffDesignation(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStaffDesignation([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStaffDesignation(id);
    return Json(200);
}

// StaffGrade
public async Task<ActionResult> GetStaffGrades()
{
    var result = await _topazErpApi.GetStaffGrades();
    return Json(result);
}

public async Task<IActionResult> CreateStaffGrade([FromBody] object input)
{
    var response = await _topazErpApi.CreateStaffGrade(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStaffGrade([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStaffGrade(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStaffGrade([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStaffGrade(id);
    return Json(200);
}

// StaffPastEmployment
public async Task<ActionResult> GetStaffPastEmployments()
{
    var result = await _topazErpApi.GetStaffPastEmployments();
    return Json(result);
}

public async Task<IActionResult> CreateStaffPastEmployment([FromBody] object input)
{
    var response = await _topazErpApi.CreateStaffPastEmployment(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStaffPastEmployment([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStaffPastEmployment(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStaffPastEmployment([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStaffPastEmployment(id);
    return Json(200);
}

// StaffPastPosition
public async Task<ActionResult> GetStaffPastPositions()
{
    var result = await _topazErpApi.GetStaffPastPositions();
    return Json(result);
}

public async Task<IActionResult> CreateStaffPastPosition([FromBody] object input)
{
    var response = await _topazErpApi.CreateStaffPastPosition(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStaffPastPosition([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStaffPastPosition(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStaffPastPosition([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStaffPastPosition(id);
    return Json(200);
}

// StaffQualification
public async Task<ActionResult> GetStaffQualifications()
{
    var result = await _topazErpApi.GetStaffQualifications();
    return Json(result);
}

public async Task<IActionResult> CreateStaffQualification([FromBody] object input)
{
    var response = await _topazErpApi.CreateStaffQualification(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStaffQualification([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStaffQualification(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStaffQualification([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStaffQualification(id);
    return Json(200);
}

// StaffRelationship
public async Task<ActionResult> GetStaffRelationships()
{
    var result = await _topazErpApi.GetStaffRelationships();
    return Json(result);
}

public async Task<IActionResult> CreateStaffRelationship([FromBody] object input)
{
    var response = await _topazErpApi.CreateStaffRelationship(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStaffRelationship([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStaffRelationship(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStaffRelationship([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStaffRelationship(id);
    return Json(200);
}

// StContactRelationship
public async Task<ActionResult> GetStContactRelationships()
{
    var result = await _topazErpApi.GetStContactRelationships();
    return Json(result);
}

public async Task<IActionResult> CreateStContactRelationship([FromBody] object input)
{
    var response = await _topazErpApi.CreateStContactRelationship(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStContactRelationship([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStContactRelationship(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStContactRelationship([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStContactRelationship(id);
    return Json(200);
}

// StudentAllergy
public async Task<ActionResult> GetAllergyTypes()
{
    var result = await _topazErpApi.GetAllergyTypes();
    return Json(result);
}

public async Task<IActionResult> CreateAllergyType([FromBody] object input)
{
    var response = await _topazErpApi.CreateAllergyType(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateAllergyType([FromBody] object input)
{
    var result = await _topazErpApi.UpdateAllergyType(input);
    return Json(result);
}

public async Task<ActionResult> DeleteAllergyType([FromQuery] Guid id)
{
    await _topazErpApi.DeleteAllergyType(id);
    return Json(200);
}

public async Task<ActionResult> GetStudentAllergies([FromQuery] Guid studentId)
{
    var result = await _topazErpApi.GetStudentAllergies(studentId);
    return Json(result);
}

public async Task<IActionResult> CreateStudentAllergy([FromBody] object input)
{
    var response = await _topazErpApi.CreateStudentAllergy(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStudentAllergy([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStudentAllergy(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStudentAllergy([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStudentAllergy(id);
    return Json(200);
}

// StudentBio
public async Task<ActionResult> GetStudentBios()
{
    var result = await _topazErpApi.GetStudentBios();
    return Json(result);
}

public async Task<IActionResult> CreateStudentBio([FromBody] object input)
{
    var response = await _topazErpApi.CreateStudentBio(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStudentBio([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStudentBio(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStudentBio([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStudentBio(id);
    return Json(200);
}

// StudentDisability
public async Task<ActionResult> GetDisabilityTypes()
{
    var result = await _topazErpApi.GetDisabilityTypes();
    return Json(result);
}

public async Task<IActionResult> CreateDisabilityType([FromBody] object input)
{
    var response = await _topazErpApi.CreateDisabilityType(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateDisabilityType([FromBody] object input)
{
    var result = await _topazErpApi.UpdateDisabilityType(input);
    return Json(result);
}

public async Task<ActionResult> DeleteDisabilityType([FromQuery] Guid id)
{
    await _topazErpApi.DeleteDisabilityType(id);
    return Json(200);
}

public async Task<ActionResult> GetStudentDisabilities([FromQuery] Guid studentId)
{
    var result = await _topazErpApi.GetStudentDisabilities(studentId);
    return Json(result);
}

public async Task<IActionResult> CreateStudentDisability([FromBody] object input)
{
    var response = await _topazErpApi.CreateStudentDisability(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStudentDisability([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStudentDisability(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStudentDisability([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStudentDisability(id);
    return Json(200);
}

// StudentImmunization
public async Task<ActionResult> GetImmunizationTypes()
{
    var result = await _topazErpApi.GetImmunizationTypes();
    return Json(result);
}

public async Task<IActionResult> CreateImmunizationType([FromBody] object input)
{
    var response = await _topazErpApi.CreateImmunizationType(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateImmunizationType([FromBody] object input)
{
    var result = await _topazErpApi.UpdateImmunizationType(input);
    return Json(result);
}

public async Task<ActionResult> DeleteImmunizationType([FromQuery] Guid id)
{
    await _topazErpApi.DeleteImmunizationType(id);
    return Json(200);
}

public async Task<ActionResult> GetStudentImmunizations([FromQuery] Guid studentId)
{
    var result = await _topazErpApi.GetStudentImmunizations(studentId);
    return Json(result);
}

public async Task<IActionResult> CreateStudentImmunization([FromBody] object input)
{
    var response = await _topazErpApi.CreateStudentImmunization(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStudentImmunization([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStudentImmunization(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStudentImmunization([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStudentImmunization(id);
    return Json(200);
}

// StudentMedical
public async Task<ActionResult> GetStudentMedicals([FromQuery] Guid studentId)
{
    var result = await _topazErpApi.GetStudentMedicals(studentId);
    return Json(result);
}

public async Task<IActionResult> CreateStudentMedical([FromBody] object input)
{
    var response = await _topazErpApi.CreateStudentMedical(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStudentMedical([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStudentMedical(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStudentMedical([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStudentMedical(id);
    return Json(200);
}

// StudentPosition
public async Task<ActionResult> GetPositionTypes()
{
    var result = await _topazErpApi.GetPositionTypes();
    return Json(result);
}

public async Task<IActionResult> CreatePositionType([FromBody] object input)
{
    var response = await _topazErpApi.CreatePositionType(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdatePositionType([FromBody] object input)
{
    var result = await _topazErpApi.UpdatePositionType(input);
    return Json(result);
}

public async Task<ActionResult> DeletePositionType([FromQuery] Guid id)
{
    await _topazErpApi.DeletePositionType(id);
    return Json(200);
}

public async Task<ActionResult> GetPositionsByStudent([FromQuery] Guid studentId)
{
    var result = await _topazErpApi.GetStudentPositions(studentId);
    return Json(result);
}

public async Task<IActionResult> CreateStudentPosition([FromBody] object input)
{
    var response = await _topazErpApi.CreateStudentPosition(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStudentPosition([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStudentPosition(input);
    return Json(result);
}

public async Task<ActionResult> DeleteStudentPosition([FromQuery] Guid id)
{
    await _topazErpApi.DeleteStudentPosition(id);
    return Json(200);
}

public async Task<ActionResult> GetStudentPositions()
{
    var result = await _topazErpApi.GetStudentPositions();
    return Json(result);
}

// StudentPromotion
public async Task<ActionResult> GetStudentPromotions()
{
    var result = await _topazErpApi.GetStudentPromotions();
    return Json(result);
}

public async Task<IActionResult> CreateStudentPromotion([FromBody] object input)
{
    var response = await _topazErpApi.CreateStudentPromotion(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateStudentPromotion([FromBody] object input)
{
    var result = await _topazErpApi.UpdateStudentPromotion(input);
    return Json(result);
}

public async Task<ActionResult> GetPreClassStudentPromotions()
{
    var result = await _topazErpApi.GetPreClassStudentPromotions();
    return Json(result);
}

public async Task<IActionResult> CreatePreClassStudentPromotion([FromBody] object input)
{
    var response = await _topazErpApi.CreatePreClassStudentPromotion(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdatePreClassStudentPromotion([FromBody] object input)
{
    var result = await _topazErpApi.UpdatePreClassStudentPromotion(input);
    return Json(result);
}

// SubjectRemark
public async Task<ActionResult> GetSubjectRemarks()
{
    var result = await _topazErpApi.GetSubjectRemarks();
    return Json(result);
}

public async Task<IActionResult> CreateSubjectRemark([FromBody] object input)
{
    var response = await _topazErpApi.CreateSubjectRemark(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateSubjectRemark([FromBody] object input)
{
    var result = await _topazErpApi.UpdateSubjectRemark(input);
    return Json(result);
}

public async Task<ActionResult> DeleteSubjectRemark([FromQuery] Guid id)
{
    await _topazErpApi.DeleteSubjectRemark(id);
    return Json(200);
}

// Subject
public async Task<ActionResult> GetSubjects()
{
    var result = await _topazErpApi.GetSubjects();
    return Json(result);
}

public async Task<IActionResult> CreateSubject([FromBody] object input)
{
    var response = await _topazErpApi.CreateSubject(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateSubject([FromBody] object input)
{
    var result = await _topazErpApi.UpdateSubject(input);
    return Json(result);
}

public async Task<ActionResult> DeleteSubject([FromQuery] Guid id)
{
    await _topazErpApi.DeleteSubject(id);
    return Json(200);
}

// SupplementaryItem
public async Task<ActionResult> GetSupplementaryItems()
{
    var result = await _topazErpApi.GetSupplementaryItems();
    return Json(result);
}

public async Task<IActionResult> CreateSupplementaryItem([FromBody] object input)
{
    var response = await _topazErpApi.CreateSupplementaryItem(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateSupplementaryItem([FromBody] object input)
{
    var result = await _topazErpApi.UpdateSupplementaryItem(input);
    return Json(result);
}

public async Task<ActionResult> DeleteSupplementaryItem([FromQuery] Guid id)
{
    await _topazErpApi.DeleteSupplementaryItem(id);
    return Json(200);
}

// TeacherClass
public async Task<ActionResult> GetTeacherClasses()
{
    var result = await _topazErpApi.GetTeacherClasses();
    return Json(result);
}

public async Task<IActionResult> CreatTeacherClass([FromBody] object input)
{
    var response = await _topazErpApi.CreatTeacherClass(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateTeacherClass([FromBody] object input)
{
    var result = await _topazErpApi.UpdateTeacherClass(input);
    return Json(result);
}

public async Task<ActionResult> DeleteTeacherClass([FromQuery] Guid id)
{
    await _topazErpApi.DeleteTeacherClass(id);
    return Json(200);
}

// TeacherSubject
public async Task<ActionResult> GetTeacherSubjects()
{
    var result = await _topazErpApi.GetTeacherSubjects();
    return Json(result);
}

public async Task<IActionResult> CreateTeacherSubject([FromBody] object input)
{
    var response = await _topazErpApi.CreateTeacherSubject(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateTeacherSubject([FromBody] object input)
{
    var result = await _topazErpApi.UpdateTeacherSubject(input);
    return Json(result);
}

public async Task<ActionResult> DeleteTeacherSubject([FromQuery] Guid id)
{
    await _topazErpApi.DeleteTeacherSubject(id);
    return Json(200);
}

// TimeTable
public async Task<ActionResult> GetTimeTables()
{
    var result = await _topazErpApi.GetTimeTables();
    return Json(result);
}

public async Task<IActionResult> CreateTimeTable([FromBody] object input)
{
    var response = await _topazErpApi.CreateTimeTable(input);

    return Content(
        JsonConvert.SerializeObject(response),
        "application/json");
}

public async Task<IActionResult> UpdateTimeTable([FromBody] object input)
{
    var result = await _topazErpApi.UpdateTimeTable(input);
    return Json(result);
}

public async Task<ActionResult> DeleteTimeTable([FromQuery] Guid id)
{
    await _topazErpApi.DeleteTimeTable(id);
    return Json(200);
}

}