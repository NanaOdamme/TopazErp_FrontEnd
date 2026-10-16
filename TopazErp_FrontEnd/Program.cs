using Microsoft.AspNetCore.Authentication.Cookies;
using TopazErp_FrontEnd.Services;
using TopazErp_FrontEnd.Utils;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.ExpireTimeSpan = TimeSpan.FromHours(23.6);
        options.SlidingExpiration = false;
    });

builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSession();

builder.Services.AddControllersWithViews();

builder.Services.AddHttpClient();

builder.Services.AddScoped<ITopazErpApi, TopazErpApi>();
builder.Services.AddScoped<ClaimsHelper>();

// Add services to the container.
builder.Services.AddControllersWithViews()
                .AddRazorRuntimeCompilation();

// Configure Kestrel to listen on port 5305
builder.WebHost.UseUrls("http://localhost:5301");

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = int.MaxValue;
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();
app.UseSession();

app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Manage}/{action=Modules}/{id?}")
    .WithStaticAssets();


app.Run();