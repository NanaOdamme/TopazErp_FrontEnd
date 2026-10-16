namespace TopazErp_FrontEnd.Models.Authentication;

public class SignInDto
{
    public string AccountName { get; set; }
    public string UserNameOrEmailAddress { get; set; }
    public string Password { get; set; }
}