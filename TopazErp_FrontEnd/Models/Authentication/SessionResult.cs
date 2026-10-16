namespace TopazErp_FrontEnd.Models.Authentication;

public class SessionResult
{
    public object application { get; set; }
    public string AuthToken { get; set; }
    
    public SessionUser User { get; set; }
    public Tenant Tenant { get; set; }
}

public class SessionUser
{
    public string Name { get; set; }
    public string SurName { get; set; }
    public string UserName { get; set; }
    public string EmailAddress { get; set; }
    public int Id { get; set; }
}

public class Tenant
{
    public string TenancyName { get; set; }
    public string Name { get; set; }
    public int Id { get; set; }
}