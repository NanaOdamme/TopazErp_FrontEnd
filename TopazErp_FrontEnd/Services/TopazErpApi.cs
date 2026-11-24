using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using TopazErp_FrontEnd.Models;
using TopazErp_FrontEnd.Models.Authentication;
using TopazErp_FrontEnd.Utils;

namespace TopazErp_FrontEnd.Services;

public partial class TopazErpApi: ITopazErpApi
{
    
    private readonly ClaimsHelper _claimsHelper;
    private readonly ILogger<TopazErpApi> _logger;
    private readonly HttpClient _httpClient;
    private string _apiBaseUrl;
    private string _authUrl;

    public TopazErpApi(ClaimsHelper claimsHelper, ILogger<TopazErpApi> logger, IConfiguration configuration, HttpClient httpClient)
    {
        _claimsHelper = claimsHelper;
        _logger = logger;
        _httpClient = httpClient;
        _apiBaseUrl = configuration["TopazErpApi:BaseUrl"];
        _authUrl = configuration["TopazErpApi:AuthUrl"];
    }
    
    public async Task<TokenResponse> SignIn(SignInDto dto)
    {
        var client = new HttpClient();
        var request = new HttpRequestMessage(HttpMethod.Post, _authUrl);
        request.Content = JsonContent.Create(dto);  ;
        var response = await client.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            
            var result = JsonConvert.DeserializeObject<TokenResponse>(json);
            
            return result;
        }
        
        return new TokenResponse { };
    }
    
    public async Task<OtpResponse> SendEmailOtp(string authToken, string subject)
    {
        string url = $"{_apiBaseUrl}Mfa/SendEmailOtp?subject={subject}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
         
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<OtpResponse>(json);
        }

        return new OtpResponse {  };
    }

    public async Task<VerifyOtpResponse> VerifyOtp( string otp, string authToken)
    {
        string url = $"{_apiBaseUrl}Mfa/VerifyOtp?otp={otp}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
         
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<VerifyOtpResponse>(json);
        }

        return new VerifyOtpResponse {  };
    }

    public async Task<SubscriptionInfoResponse> GetSubscriptionInfo()
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Subscription/GetSubscriptionInfo";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<SubscriptionInfoResponse>(json);
        }

        return new SubscriptionInfoResponse { };
    }
    
    public async Task<SessionResponse> GetCurrentLoginInformation(string authToken)
    {
        string url = $"{_apiBaseUrl}Session/GetCurrentLoginInformations";
        
        var client = new HttpClient();
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await client.SendAsync(request);
         
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            
            var result = JsonConvert.DeserializeObject<SessionResponse>(json);
            
            return result;
        }

        return null;

    }
    
    //company profile
    public async Task<BaseApiResponse> CreateCompanyProfile(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CompanyProfile/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<CompanyProfileResponse> GetBusinessProfile()
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CompanyProfile/GetProfile";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CompanyProfileResponse>(json);
        }

        return new CompanyProfileResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateCompanyProfile(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}CompanyProfile/Update";

        using var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"profile update failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The profile Update API returned an empty or invalid response.");
    }
    
    //shared
    public async Task<BankResponse> GetBanks(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Bank/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BankResponse>(json);
        }

        return new BankResponse { };
    }

    public async Task<BaseApiResponse> CreateBank(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Bank/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateBank(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Bank/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteBank(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Bank/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> CreateBranch(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Bank/CreateBranch";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateBranch(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Bank/UpdateBranch";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteBranch(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Bank/DeleteBranch";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<SystemNumberResponse> GetSystemNumbers(string key)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}SystemNumber/ListAll?key={key}";
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<SystemNumberResponse>(json);
        }

        return new SystemNumberResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateSystemNumber(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}SystemNumber/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    //cost centers
    public async Task<CostCenterResponse> GetCostCenters(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CostCenter/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CostCenterResponse>(json);
        }

        return new CostCenterResponse { };
    }

    public async Task<BaseApiResponse> CreateCostCenter(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CostCenter/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateCostCenter(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}CostCenter/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteCostCenter(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}CostCenter/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //Customer Groups
    public async Task<CustomerGroupResponse> GetCustomerGroups(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CustomerGroup/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CustomerGroupResponse>(json);
        }

        return new CustomerGroupResponse { };
    }

    public async Task<CustomersResponse> GetCustomersByGroup(Guid groupId)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Customer/ListAllByGroup?groupId={groupId}";

        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CustomersResponse>(json);
        }

        return new CustomersResponse { };
    }
    
    public async Task<BaseApiResponse> CreateCustomerGroup(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CustomerGroup/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateCustomerGroup(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}CustomerGroup/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteCustomerGroup(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}CustomerGroup/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //Customers
    public async Task<CustomerResponse> GetCustomers(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Customer/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CustomerResponse>(json);
        }

        return new CustomerResponse { };
    }

    public async Task<CustomerDetailResponse> GetCustomer(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();

        string url = $"{_apiBaseUrl}Customer/GetDetails?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            
            return JsonConvert.DeserializeObject<CustomerDetailResponse>(json);
            
        }
 
        return new CustomerDetailResponse { };
       
    }

    public async Task<BaseApiResponse> CreateCustomer(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Customer/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateCustomer(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Customer/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteCustomer(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Customer/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //Supplier Groups
    public async Task<SupplierGroupResponse> GetSupplierGroups(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
                string url = $"{_apiBaseUrl}SupplierGroup/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<SupplierGroupResponse>(json);
        }

        return new SupplierGroupResponse { };
    }
    
    public async Task<SuppliersResponse> GetSuppliersByGroup(Guid groupId)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Supplier/ListAllByGroup?groupId={groupId}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<SuppliersResponse>(json);
        }

        return new SuppliersResponse { };
    }

    public async Task<BaseApiResponse> CreateSupplierGroup(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}SupplierGroup/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateSupplierGroup(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}SupplierGroup/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteSupplierGroup(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}SupplierGroup/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //Supplier
    public async Task<SupplierResponse> GetSuppliers(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Supplier/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<SupplierResponse>(json);
        }

        return new SupplierResponse { };
    }

    public async Task<SupplierDetailResponse> GetSupplier(Guid id)
    {
        try
        {
            var authToken = _claimsHelper.GetAuthToken();

            // Preferred: targeted single-record endpoint (same pattern as AllowanceType/GetDetails etc.)
            try
            {
                string url = $"{_apiBaseUrl}Supplier/GetDetails?id={id}";

                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("Authorization", $"Bearer {authToken}");

                var response = await _httpClient.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    string json = await response.Content.ReadAsStringAsync();
                    var detail = JsonConvert.DeserializeObject<SupplierDetailResponse>(json);

                    if (detail?.Result != null)
                    {
                        detail.Success = true;
                        return detail;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Supplier/GetDetails lookup failed for {SupplierId}, falling back to Supplier/ListAll.", id);
            }

            // Fallback: locate the record inside the paged list endpoint
            var listResponse = await GetSuppliers(1, 10000, "");
            var supplier = listResponse?.Result?.FirstOrDefault(s => s.Id == id);

            if (supplier != null)
            {
                return new SupplierDetailResponse { Success = true, Result = supplier };
            }

            return new SupplierDetailResponse
            {
                Success = false,
                Error = $"Supplier with id {id} was not found."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unable to load supplier {SupplierId}.", id);
            return new SupplierDetailResponse
            {
                Success = false,
                Error = "Unable to load supplier details at this time."
            };
        }
    }

    public async Task<BaseApiResponse> CreateSupplier(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Supplier/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateSupplier(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Supplier/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteSupplier(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Supplier/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //departments
    
    public async Task<DepartmentResponse> GetDepartments(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Department/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<DepartmentResponse>(json);
        }

        return new DepartmentResponse { };
    }

    public async Task<BaseApiResponse> CreateDepartment(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Department/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateDepartment(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Department/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteDepartment(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Department/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    //tax levies
    
    public async Task<TaxLevyResponse> GetTaxLevies(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}TaxLevy/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<TaxLevyResponse>(json);
        }

        return new TaxLevyResponse { };
    }

    public async Task<BaseApiResponse> CreateTaxLevy(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}TaxLevy/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateTaxLevy(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}TaxLevy/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteTaxLevy(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}TaxLevy/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    //payroll
    public async Task<AllowanceTypeResponse> GetAllowanceTypes(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}AllowanceType/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<AllowanceTypeResponse>(json);
        }

        return new AllowanceTypeResponse { };
    }

    public async Task<AllowanceTypeDetailResponse> GetAllowanceTypeDetails(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}AllowanceType/GetDetails?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<AllowanceTypeDetailResponse>(json);
        }

        return new AllowanceTypeDetailResponse { };
    }
    
    public async Task<BaseApiResponse> CreateAllowanceType(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}AllowanceType/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateAllowanceType(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}AllowanceType/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteAllowanceType(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}AllowanceType/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //allowance rate
    public async Task<BaseApiResponse> CreateAllowanceRate(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}AllowanceType/CreateAllowanceRate";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> UpdateAllowanceRate(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}AllowanceType/UpdateAllowanceRate";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> DeleteAllowanceRate(Guid allowanceTypeId,  Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}AllowanceType/DeleteAllowanceRate?allowanceTypeId={allowanceTypeId}&id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //benefits in kind type
    public async Task<BikTypeResponse> GetBikTypes(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}BikType/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BikTypeResponse>(json);
        }

        return new BikTypeResponse { };
    }

    public async Task<BikTypeDetailResponse> GetBikTypeDetails(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}BikType/GetDetails?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BikTypeDetailResponse>(json);
        }

        return new BikTypeDetailResponse { };
    }
    
    public async Task<BaseApiResponse> CreateBikType(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}BikType/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateBikType(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}BikType/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteBikType(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}BikType/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    // benefits in kind type rates
    
    public async Task<BaseApiResponse> CreateBikRate(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}BikType/CreateBikRate";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateBikRate(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}BikType/UpdateBikRate";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteBikRate(Guid bikTypeId,  Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}BikType/DeleteBikRate?bikTypeId={bikTypeId}&id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    //deduction types
    
    public async Task<DeductionTypeResponse> GetDeductionTypes(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}DeductionType/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<DeductionTypeResponse>(json);
        }

        return new DeductionTypeResponse { };
    }

    public async Task<DeductionTypeDetailResponse> GetDeductionTypeDetails(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}DeductionType/GetDetails?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<DeductionTypeDetailResponse>(json);
        }

        return new DeductionTypeDetailResponse { };
    }
    
    public async Task<BaseApiResponse> CreateDeductionType(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}DeductionType/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateDeductionType(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}DeductionType/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteDeductionType(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}DeductionType/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    // deduction rates
    public async Task<BaseApiResponse> CreateDeductionRate(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}DeductionType/CreateDeductionRate";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateDeductionRate(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}DeductionType/UpdateDeductionRate";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteDeductionRate(Guid deductionTypeId,  Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}DeductionType/DeleteDeductionRate?deductionTypeId={deductionTypeId}&id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    // overtime types
    public async Task<OvertimeTypeResponse> GetOvertimeTypes(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}OverTimeType/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<OvertimeTypeResponse>(json);
        }

        return new OvertimeTypeResponse { };
    }

    public async Task<OvertimeTypeDetailResponse> GetOvertimeTypeDetails(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}OverTimeType/GetDetails?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<OvertimeTypeDetailResponse>(json);
        }

        return new OvertimeTypeDetailResponse { };
    }
    
    public async Task<BaseApiResponse> CreateOvertimeType(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}OverTimeType/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateOvertimeType(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}OverTimeType/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteOvertimeType(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}OverTimeType/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    //overtime rates
    public async Task<BaseApiResponse> CreateOvertimeRate(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}OvertimeType/CreateOvertimeRate";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> UpdateOvertimeRate(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}OvertimeType/UpdateOvertimeRate";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteOvertimeRate(Guid overtimeTypeId,  Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}OvertimeType/DeleteOvertimeRate?overtimeTypeId={overtimeTypeId}&id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    // employee bio data...
    
    public async Task<EmployeeBioDataResponse> GetEmployeeBioData(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeBioData/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<EmployeeBioDataResponse>(json);
        }

        return new EmployeeBioDataResponse { };
    }
    
    public async Task<BaseApiResponse> CreateEmployeeBioData(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeBioData/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateEmployeeBioData(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}EmployeeBioData/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteEmployeeBioData(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}EmployeeBioData/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    // employee salary data
    
    public async Task<EmployeeSalaryInfoResponse> GetEmployeeSalaryData(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeSalaryInfo/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<EmployeeSalaryInfoResponse>(json);
        }

        return new EmployeeSalaryInfoResponse { };
    }

    public async Task<EmployeeSalaryDataResponse> GetEmployeeSalaryInfo(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeSalaryInfo/GetDetails?pageNo={id}";
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<EmployeeSalaryDataResponse>(json);
        }

        return new EmployeeSalaryDataResponse { };
    }
    
    public async Task<BaseApiResponse> CreateEmployeeSalaryData(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeSalaryInfo/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateEmployeeSalaryData(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}EmployeeSalaryInfo/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteEmployeeSalaryData(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}EmployeeSalaryInfo/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    // employee ssnit
    
    public async Task<EmployeeSsnitDataResponse> GetEmployeeSsnitData(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeSnit/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<EmployeeSsnitDataResponse>(json);
        }

        return new EmployeeSsnitDataResponse { };
    }
    
    public async Task<EmployeeSsnitDetailsResponse> GetEmployeeSsnitDetails(Guid employeeId)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeSnit/GetAll?pageNo={employeeId}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<EmployeeSsnitDetailsResponse>(json);
        }

        return new EmployeeSsnitDetailsResponse { };
    }
    
    public async Task<BaseApiResponse> CreateEmployeeSsnitData(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeSnit/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateEmployeeSsnitData(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}EmployeeSnit/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteEmployeeSsnitData(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}EmployeeSnit/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    
    // employee categories
    public async Task<EmployeeCategoryResponse> GetEmployeeCategories(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeCategory/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<EmployeeCategoryResponse>(json);
        }

        return new EmployeeCategoryResponse { };
    }
    public async Task<BaseApiResponse> CreateEmployeeCategory(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeCategory/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> UpdateEmployeeCategory(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}EmployeeCategory/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> DeleteEmployeeCategory(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}EmployeeCategory/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    
    // loan types
    public async Task<LoanTypeResponse> GetLoanTypes(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}LoanType/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<LoanTypeResponse>(json);
        }

        return new LoanTypeResponse { };
    }
    public async Task<BaseApiResponse> CreateLoanType(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}LoanType/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> UpdateLoanType(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}LoanType/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> DeleteLoanType(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}LoanType/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //employee ranks
    
    public async Task<EmployeeRankResponse> GetEmployeeRanks(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeRank/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<EmployeeRankResponse>(json);
        }

        return new EmployeeRankResponse { };
    }
    public async Task<BaseApiResponse> CreateEmployeeRank(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmployeeRank/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> UpdateEmployeeRank(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}EmployeeRank/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> DeleteEmployeeRank(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}EmployeeRank/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    //tax relief
    
    public async Task<TaxReliefResponse> GetTaxReliefs(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}TaxRelief/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<TaxReliefResponse>(json);
        }

        return new TaxReliefResponse { };
    }
    
    public async Task<BaseApiResponse> CreateTaxRelief(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}TaxRelief/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateTaxRelief(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}TaxRelief/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteTaxRelief(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}TaxRelief/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    //tax tables
    public async Task<TaxTableResponse> GetTaxTables(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}TaxTable/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<TaxTableResponse>(json);
        }

        return new TaxTableResponse { };
    }
    
    public async Task<BaseApiResponse> CreateTaxTable(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}TaxTable/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateTaxTable(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}TaxTable/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteTaxTable(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}TaxTable/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    // gratuities
    public async Task<GratuityResponse> GetGratuities(int pageNo, int pageSize)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Gratuity/GetAll?pageNo={pageNo}&pageSize={pageSize}";
        
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<GratuityResponse>(json);
        }

        return new GratuityResponse { };
    }
    public async Task<BaseApiResponse> CreateGratuity(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Gratuity/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> UpdateGratuity(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Gratuity/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> DeleteGratuity(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Gratuity/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    // pay calendar ...
    public async Task<PayCalendarResponse> GetPayCalendars(int pageNo, int pageSize, int? year)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}PayCalendar/GetAll?pageNo={pageNo}&pageSize={pageSize}";
        
        if (year.HasValue)
        {
            url += $"&year={year}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<PayCalendarResponse>(json);
        }

        return new PayCalendarResponse { };
    }
    public async Task<BaseApiResponse> CreatePayCalendar(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}PayCalendar/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> UpdatePayCalendar(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}PayCalendar/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> DeletePayCalendar(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}PayCalendar/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    
    
    //General Ledger
    public async Task<BankAccountResponse> GetBankAccounts(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}BankAccount/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BankAccountResponse>(json);
        }

        return new BankAccountResponse { };
    }
    
    public async Task<BaseApiResponse> CreateBankAccount(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}BankAccount/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateBankAccount(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}BankAccount/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteBankAccount(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}BankAccount/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //account heads
    public async  Task<AccountHeadResponse> GetAccountHeads(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CoaHierachy/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<AccountHeadResponse>(json);
        }

        return new AccountHeadResponse { };
    }

    public async Task<BaseApiResponse> CreateAccountHead(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CoaHierachy/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateAccountHead(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}CoaHierachy/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteAccountHead(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}CoaHierachy/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //chart of account control
    public async  Task<CoaControlResponse> GetAccountControls(int pageNo, int pageSize, string query, Guid accountHeadId)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CoaControl/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (accountHeadId != Guid.Empty)
        {
            url += $"&accountHeadId={accountHeadId}";
        }

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CoaControlResponse>(json);
        }

        return new CoaControlResponse { };
    }

    public async  Task<CoaControlListResponse> GetControlsByAccountHead(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CoaControl/GetControlsByAccountHead?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CoaControlListResponse>(json);
        }

        return new CoaControlListResponse { };
    }
    
    public async Task<BaseApiResponse> CreateAccountControl(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CoaControl/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateAccountControl(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}CoaControl/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteAccountControl(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}CoaControl/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    
    //chart of account detail
    public async  Task<CoaDetailResponse> GetAccountDetails(int pageNo, int pageSize, string query, bool isActive)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CoaDetail/ListAll?pageNo={pageNo}&pageSize={pageSize}&isActive={isActive}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CoaDetailResponse>(json);
        }

        return new CoaDetailResponse { };
    }

    public async  Task<CoaDetailResponse> CheckAccountNo(string accountNo)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CoaDetail/CheckAccountNo?accountNo={accountNo}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CoaDetailResponse>(json);
        }

        return new CoaDetailResponse { };
    }


    
    
    public async Task<CoaDetailResponse> GetLocalAccounts()
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CoaDetail/ListLocalAccounts";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CoaDetailResponse>(json);
        }

        return new CoaDetailResponse { };
        
    }
    
    public async Task<BaseApiResponse> CreateAccountDetail(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}CoaDetail/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateAccountDetail(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}CoaDetail/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteAccountDetail(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}CoaDetail/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<CheckCoaDetailResponse> CheckAccountDetails(int accountNumber, Guid accountControlId)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}CoaDetail/CheckAccountDetails?accountNumber={accountNumber}&accountControlId={accountControlId}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CheckCoaDetailResponse>(json);
        }

        return new CheckCoaDetailResponse { };
    }
    
    // budgets
    public async Task<BudgetResponse> GetBudgets(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Budget/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BudgetResponse>(json);
        }

        return new BudgetResponse { };
    }

    public async Task<BaseApiResponse> CreateBudget(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Budget/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateBudget(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Budget/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteBudget(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Budget/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //petty cash recipients
    public async Task<PettyCashRecipientResponse> GetPettyCashRecipients(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}PettyCashRecipient/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<PettyCashRecipientResponse>(json);
        }

        return new PettyCashRecipientResponse { };
    }

    public async Task<BaseApiResponse> CreatePettyCashRecipient(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}PettyCashRecipient/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdatePettyCashRecipient(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}PettyCashRecipient/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeletePettyCashRecipient(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}PettyCashRecipient/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //petty cash
    public async Task<PettyCashResponse> GetPettyTransactions(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}PettyCash/GetAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<PettyCashResponse>(json);
        }

        return new PettyCashResponse { };
    }

    public async Task<BaseApiResponse> CreatePettyCash(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}PettyCash/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdatePettyCash(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}PettyCash/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeletePettyCash(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}PettyCash/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //imprest category
    public async Task<ImprestCategoryResponse> GetImprestCategories(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}ImprestCategory/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ImprestCategoryResponse>(json);
        }

        return new ImprestCategoryResponse { };
    }

    public async Task<BaseApiResponse> CreateImprestCategory(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}ImprestCategory/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateImprestCategory(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}ImprestCategory/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteImprestCategory(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}ImprestCategory/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    //imprest
    public async Task<ImprestResponse> GetImprests(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Imprest/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ImprestResponse>(json);
        }

        return new ImprestResponse { };
    }

    public async Task<BaseApiResponse> CreateImprest(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Imprest/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateImprest(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Imprest/Update";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteImprest(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Imprest/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    
    // Default GL Numbers
    
    public async Task<DefaultGLNumbersResponse> GetDefaultGlNumbersSetup()
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}DefaultGlNumber/GetDefaultSetup";
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<DefaultGLNumbersResponse>(json);
        }

        return new DefaultGLNumbersResponse { };
    }
    
    public async Task<BaseApiResponse> CreateDefaultGlNumbers(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}DefaultGlNumber/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateDefaultGlNumbers(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}DefaultGlNumber/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    
    // Journal
    public async Task<JournalTransactionResponse> GetJournalTransactions(JournalListFilterDto dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Journal/ListAll";
        
        var request = new HttpRequestMessage(HttpMethod.Post, url);
        
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);
        
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            
            return JsonConvert.DeserializeObject<JournalTransactionResponse>(json);
        }

        return new JournalTransactionResponse { };
    }
    
    public async Task<BaseApiResponse> CreateJournal(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Journal/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> UpdateJournal(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Journal/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
     
    public async Task<BaseApiResponse> GetJournalDetails(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Journal/GetDetails?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> DeleteJournalBatch(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Journal/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> PostJournal(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Journal/Post?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    //currencies
    public async  Task<CurrencyResponse> GetCurrencies(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Currency/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CurrencyResponse>(json);
        }

        return new CurrencyResponse { };
    }
    
    public async Task<BaseApiResponse> CreateCurrency(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Currency/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateCurrency(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Currency/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteCurrency(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Currency/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }

    //voucher
    public async  Task<VoucherResponse> GetVouchers(DateTime startDate, DateTime endDate, string voucherType)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Voucher/ListAll?startDate={startDate:dd-MM-yyyy}&endDate={endDate:dd-MM-yyyy}&voucherType={voucherType}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<VoucherResponse>(json);
        }

        return new VoucherResponse { };
    }

    public async Task<BaseApiResponse> CreateVoucher(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Voucher/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateVoucher(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Voucher/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteVoucher(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Voucher/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    public async Task<BaseApiResponse> PostVoucher(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Voucher/Post?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    

    //AR
    //Balance
    public async Task<ArOpeningBalanceResponse> GetArOpeningBalances(int pageNo, int pageSize, string query)
    {
         var authToken = _claimsHelper.GetAuthToken();
                
                string url = $"{_apiBaseUrl}ArOpeningBalance/ListAll?pageNo={pageNo}&pageSize={pageSize}";
        
                if (!string.IsNullOrEmpty(query))
                {
                    url += $"&query={query}";
                }
                
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("Authorization", $"Bearer {authToken}");
        
                var response = await _httpClient.SendAsync(request);
        
                if (response.IsSuccessStatusCode)
                {
                    string json = await response.Content.ReadAsStringAsync();
        
                    return JsonConvert.DeserializeObject<ArOpeningBalanceResponse>(json);
                }
        
                return new ArOpeningBalanceResponse { };
    }
    public async Task<BaseApiResponse> CreateArOpeningBalance(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ArOpeningBalance/Create";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Create failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Create API returned an empty or invalid response.");
    }
    public async Task<BaseApiResponse> UpdateArOpeningBalance(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ArOpeningBalance/Update";

        using var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);

        using var response = await _httpClient.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Upstream update failed ({(int)response.StatusCode}): {body}");
        }
        return JsonConvert.DeserializeObject<BaseApiResponse>(body);
    }
    public async Task<BaseApiResponse> DeleteArOpeningBalance(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}ArOpeningBalance/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> PostArOpeningBalances(List<Guid> balanceIds)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ArOpeningBalance/PostArOpeningBalances";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(balanceIds);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Posting failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Posting API returned an empty or invalid response.");
    }
    //ApInvoice
    public async Task<ArInvoiceResponse> GetArInvoices(int pageNo, int pageSize, string query)
    {
         var authToken = _claimsHelper.GetAuthToken();
                
                string url = $"{_apiBaseUrl}ArInvoice/ListAll?pageNo={pageNo}&pageSize={pageSize}";
        
                if (!string.IsNullOrEmpty(query))
                {
                    url += $"&query={query}";
                }
                
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("Authorization", $"Bearer {authToken}");
        
                var response = await _httpClient.SendAsync(request);
        
                if (response.IsSuccessStatusCode)
                {
                    string json = await response.Content.ReadAsStringAsync();
        
                    return JsonConvert.DeserializeObject<ArInvoiceResponse>(json);
                }
        
                return new ArInvoiceResponse { };
    }
    public async Task<BaseApiResponse> CreateArInvoice(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ArInvoice/Create";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Create failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Create API returned an empty or invalid response.");
    }
    public async Task<BaseApiResponse> UpdateArInvoice(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ArInvoice/Update";

        using var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);

        using var response = await _httpClient.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Upstream update failed ({(int)response.StatusCode}): {body}");
        }
        return JsonConvert.DeserializeObject<BaseApiResponse>(body);
    }
    [HttpPost]
    public async Task<BaseApiResponse> PostArInvoices(List<Guid> invoiceIds)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ArInvoice/PostInvoice";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(invoiceIds);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Posting failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Posting API returned an empty or invalid response.");
    }
    public async Task<BaseApiResponse> CancelArInvoices(List<Guid> invoiceIds)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ArInvoice/CancelInvoice";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(invoiceIds);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Cancel failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Cancel API returned an empty or invalid response.");
    }
    public async Task<BaseApiResponse> ApproveArInvoices(List<Guid> invoiceIds)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ArInvoice/ApproveInvoice";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(invoiceIds);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Approve failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Approve API returned an empty or invalid response.");
    }
    //ApPayments
    public async Task<ArPaymentResponse> GetArPayments(
    int pageNo,
    int pageSize,
    string query)
{
    var authToken = _claimsHelper.GetAuthToken();

    var url =
        $"{_apiBaseUrl}ArPayment/ListAll?pageNo={pageNo}&pageSize={pageSize}";

    if (!string.IsNullOrWhiteSpace(query))
    {
        url += $"&query={Uri.EscapeDataString(query)}";
    }

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Failed to get AP payments ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<ArPaymentResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment list API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateArPayment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ArPayment/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AP payment creation failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment Create API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> UpdateArPayment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ArPayment/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AP payment update failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment Update API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> DeleteArPayment(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ArPayment/Delete?id={Uri.EscapeDataString(id.ToString())}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AP payment deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment Delete API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> PostArPayments(List<Guid> paymentIds)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ArPayment/PostPayments";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(paymentIds);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AP payment posting failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment posting API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CancelArPayments(List<Guid> paymentIds)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ArPayment/CancelPayment";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(paymentIds);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AP payment cancellation failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment cancellation API returned an empty or invalid response.");
}
//debit memo
public async Task<CreditMemoResponse> GetCreditMemos(
    int pageNo,
    int pageSize,
    string query)
{
    var authToken = _claimsHelper.GetAuthToken();

    var url =
        $"{_apiBaseUrl}ArCreditMemos/ListAll?pageNo={pageNo}&pageSize={pageSize}";

    if (!string.IsNullOrWhiteSpace(query))
    {
        url += $"&query={Uri.EscapeDataString(query)}";
    }

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Failed to get debit memos ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<CreditMemoResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The debit memo list API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateCreditMemo(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ArCreditMemos/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Debit memo creation failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The debit memo Create API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> UpdateCreditMemo(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ArCreditMemos/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Credit memo update failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The credit memo Update API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> DeleteCreditMemo(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url =
        $"{_apiBaseUrl}ArCreditMemos/Delete?id={Uri.EscapeDataString(id.ToString())}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Credit memo deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The Credit memo Delete API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> ApplyCreditMemo(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ArCreditMemos/Apply";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Applying Credit memo failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The Credit memo Apply API returned an empty or invalid response.");
}
//Quotation
    public async Task<QuotationResponse> GetQuotations(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Quotations/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<QuotationResponse>(json);
        }

        return new QuotationResponse { };
    }
    
    public async Task<BaseApiResponse> CreateQuotation(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}Quotations/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateQuotation(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Quotations/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteQuotation(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}Quotations/Delete?id={id}";
        
        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();
        
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Quotation deletion failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Quotation Delete API returned an empty or invalid response.");
    }
    //aging
    public async Task<ArAgingResponse> GetArAgingByDate(DateTime startDate, int agingInterval)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}ArReport/GetAgeingByDate?startDate={startDate.ToString("yyyy-MM-dd")}&agingInterval={agingInterval}";   
        
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<ArAgingResponse>(json);
        }

        return new ArAgingResponse();
        
    }
    public async Task<BaseApiResponse> SendArEmail(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmailArInvoices/DispatchInvoice";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<ArStatementResponse> GetArStatement(Guid customerId)
    {
        var authToken = _claimsHelper.GetAuthToken();

        string url = $"{_apiBaseUrl}ArReport/GetStatement?customerId={customerId}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ArStatementResponse>(json)
                   ?? new ArStatementResponse();
        }

        return new ArStatementResponse();
    }
    public async Task<ArStatementResponse> GetArStatementType2(
        Guid customerId, DateTime startDate, DateTime endDate)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ArReport/GetStatementType2" +
                     $"?customerId={customerId}" +
                     $"&startDate={startDate.ToString("yyyy-MM-dd")}" +
                     $"&endDate={endDate.ToString("yyyy-MM-dd")}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ArStatementResponse>(json)
                   ?? new ArStatementResponse();
        }
    
        return new ArStatementResponse();
    }
    
    public async Task<ArStatementResponse> GetArStatementType3(
        Guid customerId, DateTime startDate, DateTime endDate)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ArReport/GetStatementType3" +
                     $"?customerId={customerId}" +
                     $"&startDate={startDate.ToString("yyyy-MM-dd")}" +
                     $"&endDate={endDate.ToString("yyyy-MM-dd")}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ArStatementResponse>(json)
                   ?? new ArStatementResponse();
        }
    
        return new ArStatementResponse();
    }
    
    public async Task<ArStatementResponse>GetArStatementByOu(
        Guid customerId, Guid ouid, DateTime startDate, DateTime endDate)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ArReport/GetStatementByOu" +
                     $"?customerId={customerId}" +
                     $"&ouid={ouid}" +
                     $"&startDate={startDate.ToString("yyyy-MM-dd")}" +
                     $"&endDate={endDate.ToString("yyyy-MM-dd")}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ArStatementResponse>(json)
                   ?? new ArStatementResponse();
        }
    
        return new ArStatementResponse();
    }
    
    public async Task<ArStatementResponse>GetArStatementByOuType2(
        Guid customerId, Guid ouid, DateTime startDate, DateTime endDate)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ArReport/GetStatementByOuType2" +
                     $"?customerId={customerId}" +
                     $"&ouid={ouid}" +
                     $"&startDate={startDate.ToString("yyyy-MM-dd")}" +
                     $"&endDate={endDate.ToString("yyyy-MM-dd")}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ArStatementResponse>(json)
                   ?? new ArStatementResponse();
        }
    
        return new ArStatementResponse();
    }
    public async Task<ArInvoiceReportResponse> GetArInvoiceReport(Guid customerId)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ArReport/GetInvoice?customerId={customerId}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ArInvoiceReportResponse>(json)
                   ?? new ArInvoiceReportResponse();
        }
    
        return new ArInvoiceReportResponse();
    }
    
    public async Task<ArInvoiceReportResponse> GetAllArInvoices()
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ArReport/GetAllInvoices";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ArInvoiceReportResponse>(json)
                   ?? new ArInvoiceReportResponse();
        }
    
        return new ArInvoiceReportResponse();
    }
    
    public async Task<ArInvoiceReportResponse> GetArCanceledInvoices()
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ArReport/GetCanceledInvoices";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ArInvoiceReportResponse>(json)
                   ?? new ArInvoiceReportResponse();
        }
    
        return new ArInvoiceReportResponse();
    }
    
    public async Task<ArInvoiceReportResponse> GetArInvoiceByBatch(string batchNumber)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ArReport/GetInvoiceByBatch" +
                     $"?batchNumber={Uri.EscapeDataString(batchNumber)}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ArInvoiceReportResponse>(json)
                   ?? new ArInvoiceReportResponse();
        }
    
        return new ArInvoiceReportResponse();
    }
    public async Task<ArInvoiceReportResponse> GetArInvoiceByInvoiceNumber(string invoiceNumber)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetInvoiceByInvoiceNumber" +
                 $"?invoiceNumber={Uri.EscapeDataString(invoiceNumber)}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArInvoiceReportResponse>(json)
               ?? new ArInvoiceReportResponse();
    }

    return new ArInvoiceReportResponse();
}

public async Task<ArInvoiceReportResponse> GetArInvoiceByDate(
    DateTime startDate, DateTime endDate)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetInvoiceByDate" +
                 $"?startDate={startDate.ToString("yyyy-MM-dd")}" +
                 $"&endDate={endDate.ToString("yyyy-MM-dd")}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArInvoiceReportResponse>(json)
               ?? new ArInvoiceReportResponse();
    }

    return new ArInvoiceReportResponse();
}

public async Task<ArInvoiceReportResponse> GetArInvoiceByRange(
    int startNumber, int endNumber)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetInvoiceByRange" +
                 $"?startNumber={startNumber}" +
                 $"&endNumber={endNumber}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArInvoiceReportResponse>(json)
               ?? new ArInvoiceReportResponse();
    }

    return new ArInvoiceReportResponse();
}

public async Task<ArInvoiceReportResponse> GetArInvoiceReportById(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetInvoiceReport?id={id}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArInvoiceReportResponse>(json)
               ?? new ArInvoiceReportResponse();
    }

    return new ArInvoiceReportResponse();
}
public async Task<ArInvoicePdfResponse> GetArInvoiceDetails(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ArReport/GetInvoiceDetails?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArInvoicePdfResponse>(json)
               ?? new ArInvoicePdfResponse();
    }

    return new ArInvoicePdfResponse();
}

public async Task<ArOpeningBalanceResponse> GetArBalancesReport(string status)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetOpeningBalances" +
                 $"?status={Uri.EscapeDataString(status)}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArOpeningBalanceResponse>(json)
               ?? new ArOpeningBalanceResponse();
    }

    return new ArOpeningBalanceResponse();
}

public async Task<ArOpeningBalanceResponse> GetArBalancesByCustomer(
    Guid customerId, string status)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetOpeningBalancesByCustomer" +
                 $"?customerId={customerId}" +
                 $"&status={Uri.EscapeDataString(status)}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArOpeningBalanceResponse>(json)
               ?? new ArOpeningBalanceResponse();
    }

    return new ArOpeningBalanceResponse();
}

public async Task<ArOpeningBalanceResponse> GetAllConvertedArBalances(string status)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetAllConvertedOpeningBalances" +
                 $"?status={Uri.EscapeDataString(status)}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArOpeningBalanceResponse>(json)
               ?? new ArOpeningBalanceResponse();
    }

    return new ArOpeningBalanceResponse();
}
public async Task<ArPaymentReportResponse> GetArPaymentsReport()
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetPayments";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArPaymentReportResponse>(json)
               ?? new ArPaymentReportResponse();
    }

    return new ArPaymentReportResponse();
}

public async Task<ArPaymentReportResponse> GetArPaymentsByCustomer(Guid customerId)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetPaymentsByCustomer?customerId={customerId}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArPaymentReportResponse>(json)
               ?? new ArPaymentReportResponse();
    }

    return new ArPaymentReportResponse();
}

public async Task<ArPaymentReportResponse> GetArPaymentsByDate(
    DateTime startDate, DateTime endDate)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetPaymentsByDate" +
                 $"?startDate={startDate.ToString("yyyy-MM-dd")}" +
                 $"&endDate={endDate.ToString("yyyy-MM-dd")}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArPaymentReportResponse>(json)
               ?? new ArPaymentReportResponse();
    }

    return new ArPaymentReportResponse();
}

public async Task<ArPaymentReceiptResponse> GetArPaymentReceipts(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetPaymentReceipts?id={id}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArPaymentReceiptResponse>(json)
               ?? new ArPaymentReceiptResponse();
    }

    return new ArPaymentReceiptResponse();
}

public async Task<ArPaymentReceiptResponse> GetArPaymentReceipts(List<Guid> ids)
{
    var authToken = _claimsHelper.GetAuthToken();

    string idsQuery = string.Join("&", ids.Select(id => $"ids={id}"));
    string url = $"{_apiBaseUrl}ArReport/GetPaymentReceipts";

    if (!string.IsNullOrEmpty(idsQuery))
    {
        url += $"?{idsQuery}";
    }

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArPaymentReceiptResponse>(json)
               ?? new ArPaymentReceiptResponse();
    }

    return new ArPaymentReceiptResponse();
}
public async Task<QuotationResponse> GetQuotationsReport()
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetQuotations";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<QuotationResponse>(json)
               ?? new QuotationResponse();
    }

    return new QuotationResponse();
}
public async Task<ArQuotationPdfResponse> GetArQuotationDetails(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ArReport/GetQuotationPdf?quotationId={id}";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArQuotationPdfResponse>(json)
               ?? new ArQuotationPdfResponse();
    }

    return new ArQuotationPdfResponse();
}


public async Task<ArAgingResponse> GetArAgingSummary(
    DateTime startDate, int agingInterval)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetAgingSummary" +
                 $"?startDate={startDate.ToString("yyyy-MM-dd")}" +
                 $"&agingInterval={agingInterval}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArAgingResponse>(json)
               ?? new ArAgingResponse();
    }

    return new ArAgingResponse();
}

public async Task<ArAgingResponse> GetArAgingByCustomer(
    Guid customerId, DateTime startDate, int agingInterval)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetAgeingByCustomer" +
                 $"?customerId={customerId}" +
                 $"&startDate={startDate.ToString("yyyy-MM-dd")}" +
                 $"&agingInterval={agingInterval}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArAgingResponse>(json)
               ?? new ArAgingResponse();
    }

    return new ArAgingResponse();
}

public async Task<ArGlTransactionResponse> GetArGlTransaction(
    DateTime startDate, DateTime endDate, bool isMultiCurrency)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ArReport/GetGlTransaction" +
                 $"?startDate={startDate.ToString("yyyy-MM-dd")}" +
                 $"&endDate={endDate.ToString("yyyy-MM-dd")}" +
                 $"&isMultiCurrency={isMultiCurrency.ToString().ToLowerInvariant()}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ArGlTransactionResponse>(json)
               ?? new ArGlTransactionResponse();
    }

    return new ArGlTransactionResponse();
}


 //AP
    //Balance
    public async Task<ApOpeningBalanceResponse> GetApOpeningBalances(int pageNo, int pageSize, string query)
    {
         var authToken = _claimsHelper.GetAuthToken();
                
                string url = $"{_apiBaseUrl}ApOpeningBalance/ListAll?pageNo={pageNo}&pageSize={pageSize}";
        
                if (!string.IsNullOrEmpty(query))
                {
                    url += $"&query={query}";
                }
                
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("Authorization", $"Bearer {authToken}");
        
                var response = await _httpClient.SendAsync(request);
        
                if (response.IsSuccessStatusCode)
                {
                    string json = await response.Content.ReadAsStringAsync();
        
                    return JsonConvert.DeserializeObject<ApOpeningBalanceResponse>(json);
                }
        
                return new ApOpeningBalanceResponse { };
    }
    public async Task<BaseApiResponse> CreateApOpeningBalance(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ApOpeningBalance/Create";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Create failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Create API returned an empty or invalid response.");
    }
    public async Task<BaseApiResponse> UpdateApOpeningBalance(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ApOpeningBalance/Update";

        using var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);

        using var response = await _httpClient.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Upstream update failed ({(int)response.StatusCode}): {body}");
        }
        return JsonConvert.DeserializeObject<BaseApiResponse>(body);
    }
    public async Task<BaseApiResponse> DeleteApOpeningBalance(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}ApOpeningBalance/Delete?id={id}";

        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(json);
        }

        return new BaseApiResponse { };
    }
    public async Task<BaseApiResponse> PostApOpeningBalances(List<Guid> balanceIds)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ApOpeningBalance/PostOpeningBalances";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(balanceIds);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Posting failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Posting API returned an empty or invalid response.");
    }
    //ApInvoice
    public async Task<ApInvoiceResponse> GetApInvoices(int pageNo, int pageSize, string query)
    {
         var authToken = _claimsHelper.GetAuthToken();
                
                string url = $"{_apiBaseUrl}ApInvoice/ListAll?pageNo={pageNo}&pageSize={pageSize}";
        
                if (!string.IsNullOrEmpty(query))
                {
                    url += $"&query={query}";
                }
                
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("Authorization", $"Bearer {authToken}");
        
                var response = await _httpClient.SendAsync(request);
        
                if (response.IsSuccessStatusCode)
                {
                    string json = await response.Content.ReadAsStringAsync();
        
                    return JsonConvert.DeserializeObject<ApInvoiceResponse>(json);
                }
        
                return new ApInvoiceResponse { };
    }
    public async Task<BaseApiResponse> CreateApInvoice(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ApInvoice/Create";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Create failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Create API returned an empty or invalid response.");
    }
    public async Task<BaseApiResponse> UpdateApInvoice(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ApInvoice/Update";

        using var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);

        using var response = await _httpClient.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Upstream update failed ({(int)response.StatusCode}): {body}");
        }
        return JsonConvert.DeserializeObject<BaseApiResponse>(body);
    }
    [HttpPost]
    public async Task<BaseApiResponse> PostApInvoices(List<Guid> invoiceIds)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ApInvoice/PostInvoice";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(invoiceIds);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Posting failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Posting API returned an empty or invalid response.");
    }
    public async Task<BaseApiResponse> CancelApInvoices(List<Guid> invoiceIds)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ApInvoice/CancelInvoice";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(invoiceIds);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Cancel failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Cancel API returned an empty or invalid response.");
    }
    public async Task<BaseApiResponse> ApproveApInvoices(List<Guid> invoiceIds)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ApInvoice/ApproveInvoice";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(invoiceIds);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Approve failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The Approve API returned an empty or invalid response.");
    }
    //ApPayments
    public async Task<ApPaymentResponse> GetApPayments(
    int pageNo,
    int pageSize,
    string query)
{
    var authToken = _claimsHelper.GetAuthToken();

    var url =
        $"{_apiBaseUrl}ApPayment/ListAll?pageNo={pageNo}&pageSize={pageSize}";

    if (!string.IsNullOrWhiteSpace(query))
    {
        url += $"&query={Uri.EscapeDataString(query)}";
    }

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Failed to get AP payments ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<ApPaymentResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment list API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateApPayment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ApPayment/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AP payment creation failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment Create API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> UpdateApPayment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ApPayment/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AP payment update failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment Update API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> DeleteApPayment(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ApPayment/Delete?id={Uri.EscapeDataString(id.ToString())}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AP payment deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment Delete API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> PostApPayments(List<Guid> paymentIds)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ApPayment/PostPayments";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(paymentIds);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AP payment posting failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment posting API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CancelApPayments(List<Guid> paymentIds)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ApPayment/CancelPayment";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(paymentIds);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AP payment cancellation failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The AP payment cancellation API returned an empty or invalid response.");
}
//debit memo
public async Task<DebitMemoResponse> GetDebitMemos(
    int pageNo,
    int pageSize,
    string query)
{
    var authToken = _claimsHelper.GetAuthToken();

    var url =
        $"{_apiBaseUrl}DebitMemo/ListAll?pageNo={pageNo}&pageSize={pageSize}";

    if (!string.IsNullOrWhiteSpace(query))
    {
        url += $"&query={Uri.EscapeDataString(query)}";
    }

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Failed to get debit memos ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<DebitMemoResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The debit memo list API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateDebitMemo(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}DebitMemo/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Debit memo creation failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The debit memo Create API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> UpdateDebitMemo(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}DebitMemo/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Debit memo update failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The debit memo Update API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> DeleteDebitMemo(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url =
        $"{_apiBaseUrl}DebitMemo/Delete?id={Uri.EscapeDataString(id.ToString())}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Debit memo deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The debit memo Delete API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> ApplyDebitMemo(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}DebitMemo/Apply";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Applying debit memo failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
        ?? throw new InvalidOperationException(
            "The debit memo Apply API returned an empty or invalid response.");
}
//ApVouchers
    public async Task<ApVoucherResponse> GetApVouchers(int pageNo, int pageSize, string query)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}ApVoucher/ListAll?pageNo={pageNo}&pageSize={pageSize}";

        //if query is not null
        if (!string.IsNullOrEmpty(query))
        {
            url += $"&query={query}";
        }
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<ApVoucherResponse>(json);
        }

        return new ApVoucherResponse { };
    }
    
    public async Task<BaseApiResponse> CreateApVoucher(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}ApVoucher/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateApVoucher(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}ApVoucher/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteApVoucher(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}ApVoucher/Delete?id={id}";
        
        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();
        
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"ApVoucher deletion failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The ApVoucher Delete API returned an empty or invalid response.");
    }
    public async Task<BaseApiResponse> PostApVouchers(List<Guid> voucherIds)
    {
        var authToken = _claimsHelper.GetAuthToken();
        var url = $"{_apiBaseUrl}ApVoucher/PostVouchers";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(voucherIds);

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"ApVoucher posting failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The ApVoucher posting API returned an empty or invalid response.");
    }   
    
    //aging
    public async Task<ApAgingResponse> GetApAgingByDate(DateTime startDate, int agingInterval)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}ApReports/GetAgeingByDate?startDate={startDate.ToString("yyyy-MM-dd")}&agingInterval={agingInterval}";   
        
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<ApAgingResponse>(json);
        }

        return new ApAgingResponse();
        
    }
    public async Task<BaseApiResponse> SendApEmail(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}EmailApInvoices/DispatchInvoice";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    public async Task<ReportHeaderResponse> GetReportHeader(string title)
    {
        var authToken = _claimsHelper.GetAuthToken();

        string url = $"{_apiBaseUrl}ApReports/GetReportHeader?title={Uri.EscapeDataString(title)}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ReportHeaderResponse>(json)
                   ?? new ReportHeaderResponse();
        }

        return new ReportHeaderResponse();
    }

    public async Task<SupplierResponse> GetSuppliers()
    {
        var authToken = _claimsHelper.GetAuthToken();

        string url = $"{_apiBaseUrl}ApReports/GetSuppliers";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<SupplierResponse>(json)
                   ?? new SupplierResponse();
        }

        return new SupplierResponse();
    }

    public async Task<ApStatementResponse> GetApStatement(Guid supplierId)
    {
        var authToken = _claimsHelper.GetAuthToken();

        string url = $"{_apiBaseUrl}ApReports/GetStatement?supplierId={supplierId}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ApStatementResponse>(json)
                   ?? new ApStatementResponse();
        }

        return new ApStatementResponse();
    }
    public async Task<ApStatementResponse> GetApStatementType2(
        Guid supplierId, DateTime startDate, DateTime endDate)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ApReports/GetStatementType2" +
                     $"?supplierId={supplierId}" +
                     $"&startDate={startDate.ToString("yyyy-MM-dd")}" +
                     $"&endDate={endDate.ToString("yyyy-MM-dd")}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ApStatementResponse>(json)
                   ?? new ApStatementResponse();
        }
    
        return new ApStatementResponse();
    }
    
    public async Task<ApStatementResponse> GetApStatementType3(
        Guid supplierId, DateTime startDate, DateTime endDate)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ApReports/GetStatementType3" +
                     $"?supplierId={supplierId}" +
                     $"&startDate={startDate.ToString("yyyy-MM-dd")}" +
                     $"&endDate={endDate.ToString("yyyy-MM-dd")}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ApStatementResponse>(json)
                   ?? new ApStatementResponse();
        }
    
        return new ApStatementResponse();
    }
    
    public async Task<ApStatementResponse> GetApStatementByOu(
        Guid supplierId, Guid ouid, DateTime startDate, DateTime endDate)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ApReports/GetStatementByOu" +
                     $"?supplierId={supplierId}" +
                     $"&ouid={ouid}" +
                     $"&startDate={startDate.ToString("yyyy-MM-dd")}" +
                     $"&endDate={endDate.ToString("yyyy-MM-dd")}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ApStatementResponse>(json)
                   ?? new ApStatementResponse();
        }
    
        return new ApStatementResponse();
    }
    
    public async Task<ApStatementResponse> GetApStatementByOuType2(
        Guid supplierId, Guid ouid, DateTime startDate, DateTime endDate)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ApReports/GetStatementByOuType2" +
                     $"?supplierId={supplierId}" +
                     $"&ouid={ouid}" +
                     $"&startDate={startDate.ToString("yyyy-MM-dd")}" +
                     $"&endDate={endDate.ToString("yyyy-MM-dd")}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ApStatementResponse>(json)
                   ?? new ApStatementResponse();
        }
    
        return new ApStatementResponse();
    }
    public async Task<ApInvoiceReportResponse> GetApInvoiceReport(Guid supplierId)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ApReports/GetInvoice?supplierId={supplierId}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ApInvoiceReportResponse>(json)
                   ?? new ApInvoiceReportResponse();
        }
    
        return new ApInvoiceReportResponse();
    }
    
    public async Task<ApInvoiceReportResponse> GetAllApInvoices()
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ApReports/GetAllInvoices";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ApInvoiceReportResponse>(json)
                   ?? new ApInvoiceReportResponse();
        }
    
        return new ApInvoiceReportResponse();
    }
    
    public async Task<ApInvoiceReportResponse> GetApCanceledInvoices()
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ApReports/GetCanceledInvoices";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ApInvoiceReportResponse>(json)
                   ?? new ApInvoiceReportResponse();
        }
    
        return new ApInvoiceReportResponse();
    }
    
    public async Task<ApInvoiceReportResponse> GetApInvoiceByBatch(string batchNumber)
    {
        var authToken = _claimsHelper.GetAuthToken();
    
        string url = $"{_apiBaseUrl}ApReports/GetInvoiceByBatch" +
                     $"?batchNumber={Uri.EscapeDataString(batchNumber)}";
    
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
    
        var response = await _httpClient.SendAsync(request);
    
        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<ApInvoiceReportResponse>(json)
                   ?? new ApInvoiceReportResponse();
        }
    
        return new ApInvoiceReportResponse();
    }
    public async Task<ApInvoiceReportResponse> GetApInvoiceByInvoiceNumber(string invoiceNumber)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetInvoiceByInvoiceNumber" +
                 $"?invoiceNumber={Uri.EscapeDataString(invoiceNumber)}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApInvoiceReportResponse>(json)
               ?? new ApInvoiceReportResponse();
    }

    return new ApInvoiceReportResponse();
}

public async Task<ApInvoiceReportResponse> GetApInvoiceByDate(
    DateTime startDate, DateTime endDate)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetInvoiceByDate" +
                 $"?startDate={startDate.ToString("yyyy-MM-dd")}" +
                 $"&endDate={endDate.ToString("yyyy-MM-dd")}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApInvoiceReportResponse>(json)
               ?? new ApInvoiceReportResponse();
    }

    return new ApInvoiceReportResponse();
}

public async Task<ApInvoiceReportResponse> GetApInvoiceByRange(
    int startNumber, int endNumber)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetInvoiceByRange" +
                 $"?startNumber={startNumber}" +
                 $"&endNumber={endNumber}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApInvoiceReportResponse>(json)
               ?? new ApInvoiceReportResponse();
    }

    return new ApInvoiceReportResponse();
}

public async Task<ApInvoiceReportResponse> GetApInvoiceReportById(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetInvoiceReport?id={id}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApInvoiceReportResponse>(json)
               ?? new ApInvoiceReportResponse();
    }

    return new ApInvoiceReportResponse();
}
public async Task<ApInvoicePdfResponse> GetApInvoiceDetails(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ApReports/GetInvoiceDetails?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApInvoicePdfResponse>(json)
               ?? new ApInvoicePdfResponse();
    }

    return new ApInvoicePdfResponse();
}

public async Task<ApOpeningBalanceResponse> GetApBalancesReport(string status)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetOpeningBalances" +
                 $"?status={Uri.EscapeDataString(status)}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApOpeningBalanceResponse>(json)
               ?? new ApOpeningBalanceResponse();
    }

    return new ApOpeningBalanceResponse();
}

public async Task<ApOpeningBalanceResponse> GetApBalancesBySupplier(
    Guid supplierId, string status)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetOpeningBalancesBySupplier" +
                 $"?supplierId={supplierId}" +
                 $"&status={Uri.EscapeDataString(status)}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApOpeningBalanceResponse>(json)
               ?? new ApOpeningBalanceResponse();
    }

    return new ApOpeningBalanceResponse();
}

public async Task<ApOpeningBalanceResponse> GetAllConvertedApBalances(string status)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetAllConvertedOpeningBalances" +
                 $"?status={Uri.EscapeDataString(status)}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApOpeningBalanceResponse>(json)
               ?? new ApOpeningBalanceResponse();
    }

    return new ApOpeningBalanceResponse();
}
public async Task<ApPaymentReportResponse> GetApPaymentsReport()
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetPayments";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApPaymentReportResponse>(json)
               ?? new ApPaymentReportResponse();
    }

    return new ApPaymentReportResponse();
}

public async Task<ApPaymentReportResponse> GetApPaymentsBySupplier(Guid supplierId)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetPaymentsBySupplier?supplierId={supplierId}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApPaymentReportResponse>(json)
               ?? new ApPaymentReportResponse();
    }

    return new ApPaymentReportResponse();
}

public async Task<ApPaymentReportResponse> GetApPaymentsByDate(
    DateTime startDate, DateTime endDate)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetPaymentsByDate" +
                 $"?startDate={startDate.ToString("yyyy-MM-dd")}" +
                 $"&endDate={endDate.ToString("yyyy-MM-dd")}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApPaymentReportResponse>(json)
               ?? new ApPaymentReportResponse();
    }

    return new ApPaymentReportResponse();
}

public async Task<ApPaymentReceiptResponse> GetApPaymentReceipts(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetPaymentReceipts?id={id}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApPaymentReceiptResponse>(json)
               ?? new ApPaymentReceiptResponse();
    }

    return new ApPaymentReceiptResponse();
}

public async Task<ApPaymentReceiptResponse> GetApPaymentReceipts(List<Guid> ids)
{
    var authToken = _claimsHelper.GetAuthToken();

    string idsQuery = string.Join("&", ids.Select(id => $"ids={id}"));
    string url = $"{_apiBaseUrl}ApReports/GetPaymentReceipts";

    if (!string.IsNullOrEmpty(idsQuery))
    {
        url += $"?{idsQuery}";
    }

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApPaymentReceiptResponse>(json)
               ?? new ApPaymentReceiptResponse();
    }

    return new ApPaymentReceiptResponse();
}
public async Task<ApVoucherResponse> GetApVouchersReport()
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetVouchers";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApVoucherResponse>(json)
               ?? new ApVoucherResponse();
    }

    return new ApVoucherResponse();
}

public async Task<ApVoucherResponse> GetApVouchersBySupplier(Guid supplierId)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetVouchersBySupplier?supplierId={supplierId}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApVoucherResponse>(json)
               ?? new ApVoucherResponse();
    }

    return new ApVoucherResponse();
}

public async Task<ApVoucherResponse> GetApVouchersByDate(
    DateTime startDate, DateTime endDate)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetVouchersByDate" +
                 $"?startDate={startDate.ToString("yyyy-MM-dd")}" +
                 $"&endDate={endDate.ToString("yyyy-MM-dd")}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApVoucherResponse>(json)
               ?? new ApVoucherResponse();
    }

    return new ApVoucherResponse();
}

public async Task<ApVoucherResponse> GetApVoucherByInvoice(string invoiceId)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetVoucherByInvoice" +
                 $"?invoiceId={Uri.EscapeDataString(invoiceId)}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApVoucherResponse>(json)
               ?? new ApVoucherResponse();
    }

    return new ApVoucherResponse();
}
public async Task<ApVoucherResponse> GetApVoucherDetails(Guid voucherId)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetVoucherDetails?voucherId={voucherId}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApVoucherResponse>(json)
               ?? new ApVoucherResponse();
    }

    return new ApVoucherResponse();
}

public async Task<ApVoucherResponse> GetApPaymentVoucher(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetPaymentVoucher?id={id}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApVoucherResponse>(json)
               ?? new ApVoucherResponse();
    }

    return new ApVoucherResponse();
}

public async Task<ApVoucherResponse> GetApPaymentVouchers(List<Guid> ids)
{
    var authToken = _claimsHelper.GetAuthToken();

    string idsQuery = string.Join("&", ids.Select(id => $"ids={id}"));
    string url = $"{_apiBaseUrl}ApReports/GetPaymentVouchers";

    if (!string.IsNullOrEmpty(idsQuery))
    {
        url += $"?{idsQuery}";
    }

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApVoucherResponse>(json)
               ?? new ApVoucherResponse();
    }

    return new ApVoucherResponse();
}

public async Task<DebitMemoResponse> GetApDebitMemo()
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetDebitMemo";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<DebitMemoResponse>(json)
               ?? new DebitMemoResponse();
    }

    return new DebitMemoResponse();
}
public async Task<ApAgingResponse> GetApAgingSummary(
    DateTime startDate, int agingInterval)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetAgingSummary" +
                 $"?startDate={startDate.ToString("yyyy-MM-dd")}" +
                 $"&agingInterval={agingInterval}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApAgingResponse>(json)
               ?? new ApAgingResponse();
    }

    return new ApAgingResponse();
}

public async Task<ApAgingResponse> GetApAgingBySupplier(
    Guid supplierId, DateTime startDate, int agingInterval)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetAgeingBySupplier" +
                 $"?supplierId={supplierId}" +
                 $"&startDate={startDate.ToString("yyyy-MM-dd")}" +
                 $"&agingInterval={agingInterval}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApAgingResponse>(json)
               ?? new ApAgingResponse();
    }

    return new ApAgingResponse();
}

public async Task<ApGlTransactionResponse> GetApGlTransaction(
    DateTime startDate, DateTime endDate, bool isMultiCurrency)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ApReports/GetGlTransaction" +
                 $"?startDate={startDate.ToString("yyyy-MM-dd")}" +
                 $"&endDate={endDate.ToString("yyyy-MM-dd")}" +
                 $"&isMultiCurrency={isMultiCurrency.ToString().ToLowerInvariant()}";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ApGlTransactionResponse>(json)
               ?? new ApGlTransactionResponse();
    }

    return new ApGlTransactionResponse();
}

//School Manager
//academic years
 public async Task<AcademicYearResponse> GetAcademicYears()
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}AcademicYear/ListAll";
        
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<AcademicYearResponse>(json);
        }

        return new AcademicYearResponse { };
    }
    
    public async Task<BaseApiResponse> CreateAcademicYear(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}AcademicYear/Create";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateAcademicYear(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}AcademicYear/Update";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteAcademicYear(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}AcademicYear/Delete?id={id}";
        
        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();
        
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"AcademicYear deletion failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The AcademicYear Delete API returned an empty or invalid response.");
    }
    public async Task<CurrentAcademicYearResponse> GetCurrentAcademicYear()
    {
        var authToken = _claimsHelper.GetAuthToken();

        string url = $"{_apiBaseUrl}SchoolProfile/GetCurrentAcademicYear";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<CurrentAcademicYearResponse>(json);
        }

        return new CurrentAcademicYearResponse();
    }
    public async Task<AcademicYearTermResponse> GetAcademicYearTerms()
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}AcademicYear/ListAllAcademicTerms";
        
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<AcademicYearTermResponse>(json);
        }

        return new AcademicYearTermResponse { };
    }
    
    public async Task<BaseApiResponse> CreateAcademicYearTerm(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}AcademicYear/CreateAcademicYearTerm";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateAcademicYearTerm(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}AcademicYear/UpdateAcademicYearTerm";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteAcademicYearTerm(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}AcademicYear/DeleteAcademicYearTerm?id={id}";
        
        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();
        
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"AcademicYearTerm deletion failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The AcademicYearTerm Delete API returned an empty or invalid response.");
    }
    public async Task<AcademicYearTermDetailResponse> AcademicYearTermDetails()
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}AcademicYear/ListAllAcademicTermDetails";
        
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<AcademicYearTermDetailResponse>(json);
        }

        return new AcademicYearTermDetailResponse { };
    }
    
    public async Task<BaseApiResponse> CreateAcademicYearTermDetail(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}AcademicYear/CreateAcademicYearTermDetail";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> UpdateAcademicYearTermDetail(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}AcademicYear/UpdateAcademicYearTermDetail";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteAcademicYearTermDetail(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}AcademicYear/DeleteAcademicYearTermDetail?id={id}";
        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();
        
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"AcademicYearTermDetail deletion failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The AcademicYearTermDetail Delete API returned an empty or invalid response.");
    }
    //streams
     public async Task<SmSimpleInputResponse> GetStreams()
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}ClassesAndStreams/ListAllStreams";
        
        
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string json = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<SmSimpleInputResponse>(json);
        }

        return new SmSimpleInputResponse { };
    }
    
    public async Task<BaseApiResponse> CreateStream(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        
        string url = $"{_apiBaseUrl}ClassesAndStreams/CreateStream";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }

    

    public async Task<BaseApiResponse> UpdateStream(object dto)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}ClassesAndStreams/UpdateStream";

        var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");
        request.Content = JsonContent.Create(dto);  

        var response = await _httpClient.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseData = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
        }

        return new BaseApiResponse { };
    }
    
    public async Task<BaseApiResponse> DeleteStream(Guid id)
    {
        var authToken = _claimsHelper.GetAuthToken();
        string url = $"{_apiBaseUrl}ClassesAndStreams/DeleteStream?id={id}";
        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Authorization", $"Bearer {authToken}");

        using var response = await _httpClient.SendAsync(request);
        var responseData = await response.Content.ReadAsStringAsync();
        
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"stream deletion failed ({(int)response.StatusCode}): {responseData}");
        }

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? throw new InvalidOperationException(
                   "The stream Delete API returned an empty or invalid response.");
    }
    //classes
    // Classes
public async Task<SmSimpleInputResponse> GetClasses()
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ClassesAndStreams/ListAllClasses";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<SmSimpleInputResponse>(json);
    }

    return new SmSimpleInputResponse { };
}

public async Task<BaseApiResponse> CreateClass(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ClassesAndStreams/CreateClass";

    var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateClass(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ClassesAndStreams/UpdateClass";

    var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteClass(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}ClassesAndStreams/DeleteClass?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);

    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Class deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The class Delete API returned an empty or invalid response.");
}

// Level Classes
public async Task<LevelResponse> GetLevels()
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}LevelAndClass/ListAllLevels";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<LevelResponse>(json);
    }

    return new LevelResponse { };
}

public async Task<BaseApiResponse> CreateLevel(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}LevelAndClass/CreateLevel";

    var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateLevel(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}LevelAndClass/UpdateLevel";

    var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteLevel(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}LevelAndClass/DeleteLevel?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);

    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Level class deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The level class Delete API returned an empty or invalid response.");
}
    
public async Task<LevelClassResponse> GetLevelClasses()
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}LevelAndClass/ListAllLevelClasses";

    var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string json = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<LevelClassResponse>(json);
    }

    return new LevelClassResponse { };
}

public async Task<BaseApiResponse> CreateLevelClass(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}LevelAndClass/CreateLevelClass";

    var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateLevelClass(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}LevelAndClass/UpdateLevelClass";

    var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData);
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteLevelClass(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();

    string url = $"{_apiBaseUrl}LevelAndClass/DeleteLevelClass?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);

    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Level class deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The level class Delete API returned an empty or invalid response.");
}

// CutOff
public async Task<ConductCutOfResponse> GetCutOffs()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}CutOff/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"CutOff retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<ConductCutOfResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The CutOff GetAll API returned an empty or invalid response.");
}
public async Task<BaseApiResponse> CreateCutOff(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}CutOff/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> UpdateCutOff(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}CutOff/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> DeleteCutOff(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}CutOff/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"CutOff deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The CutOff Delete API returned an empty or invalid response.");
}

// DisciplinaryAction
public async Task<DisciplinaryActionResponse> GetDisciplinaryActions()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DisciplinaryAction/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"DisciplinaryAction retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<DisciplinaryActionResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The DisciplinaryAction GetAll API returned an empty or invalid response.");
}
public async Task<BaseApiResponse> CreateDisciplinaryAction(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DisciplinaryAction/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> UpdateDisciplinaryAction(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DisciplinaryAction/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> DeleteDisciplinaryAction(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DisciplinaryAction/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"DisciplinaryAction deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The DisciplinaryAction Delete API returned an empty or invalid response.");
}

// StudentDisciplinaryAction
public async Task<StudentDisciplinaryActionResponse> GetStDisciplinaryActions()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DisciplinaryAction/ListAllActions";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentDisciplinaryAction retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentDisciplinaryActionResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentDisciplinaryAction GetAll API returned an empty or invalid response.");
}
public async Task<BaseApiResponse> CreateStDisciplinaryAction(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DisciplinaryAction/CreateStudentDiscAction";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> UpdateStDisciplinaryAction(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DisciplinaryAction/UpdateStudentDiscAction";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> DeleteStDisciplinaryAction(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DisciplinaryAction/DeleteStudentDiscAction?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentDisciplinaryAction deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentDisciplinaryAction Delete API returned an empty or invalid response.");
}

// Offence
public async Task<SmSimpleInputResponse> GetOffences()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Offence/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Offence retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Offence GetAll API returned an empty or invalid response.");
}
public async Task<BaseApiResponse> CreateOffence(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Offence/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> UpdateOffence(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Offence/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> DeleteOffence(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Offence/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Offence deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Offence Delete API returned an empty or invalid response.");
}

// NurseryGrading
public async Task<SmSimpleInputResponse> GetNurseryGradings()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}NurseryGrading/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"NurseryGrading retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The NurseryGrading GetAll API returned an empty or invalid response.");
}
public async Task<BaseApiResponse> CreateNurseryGrading(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}NurseryGrading/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> UpdateNurseryGrading(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}NurseryGrading/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> DeleteNurseryGrading(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}NurseryGrading/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"NurseryGrading deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The NurseryGrading Delete API returned an empty or invalid response.");
}

// PerformanceArea
public async Task<SmSimpleInputResponse> GetPerformanceAreas()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PerformanceArea retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The PerformanceArea GetAll API returned an empty or invalid response.");
}
public async Task<BaseApiResponse> CreatePerformanceArea(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> UpdatePerformanceArea(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> DeletePerformanceArea(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PerformanceArea deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The PerformanceArea Delete API returned an empty or invalid response.");
}

// PerformanceSkill
public async Task<PerformanceSkillResponse> GetPerformanceSkills()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/ListAllSkills";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PerformanceSkill retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<PerformanceSkillResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The PerformanceSkill GetAll API returned an empty or invalid response.");
}
public async Task<BaseApiResponse> CreatePerformanceSkill(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/CreateSkill";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> UpdatePerformanceSkill(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/UpdateSkill";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> DeletePerformanceSkill(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/DeleteSkill?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PerformanceSkill deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The PerformanceSkill Delete API returned an empty or invalid response.");
}

// StudentPerformanceSkill
public async Task<StudentPerformanceSkillResponse> GetStPerformanceSkills()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/ListAllStudentPerformanceSkills";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentPerformanceSkill retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentPerformanceSkillResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentPerformanceSkill GetAll API returned an empty or invalid response.");
}
public async Task<BaseApiResponse> CreateStPerformanceSkill(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/CreateStudentPerformanceSkill";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> UpdateStPerformanceSkill(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/UpdateStudentPerformanceSkill";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> DeleteStPerformanceSkill(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PerformanceArea/DeleteStudentPerformanceSkill?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentPerformanceSkill deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentPerformanceSkill Delete API returned an empty or invalid response.");
}

// Result
public async Task<ClassAssignmentResponse> GetResults()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Assignment/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Result retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<ClassAssignmentResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Result GetAll API returned an empty or invalid response.");
}
public async Task<BaseApiResponse> CreateResult(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Assignment/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> UpdateResult(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Assignment/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> DeleteResult(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Assignment/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Result deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Result Delete API returned an empty or invalid response.");
}

// ResultPeriod
public async Task<ResultPeriodResponse> GetResultPeriods()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Assignment/ListAllPeriods";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ResultPeriod retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<ResultPeriodResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ResultPeriod GetAll API returned an empty or invalid response.");
}
public async Task<BaseApiResponse> CreateResultPeriod(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Assignment/CreatePeriod";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> UpdateResultPeriod(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Assignment/UpdatePeriod";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}
public async Task<BaseApiResponse> DeleteResultPeriod(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Assignment/DeletePeriod?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ResultPeriod deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ResultPeriod Delete API returned an empty or invalid response.");
}

// AssignedSubject
public async Task<AssignedSubjectResponse> GetAssignedSubjects()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AssignSubject/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AssignedSubject retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<AssignedSubjectResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The AssignedSubject GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateAssignedSubject(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AssignSubject/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateAssignedSubject(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AssignSubject/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteAssignedSubject(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AssignSubject/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AssignedSubject deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The AssignedSubject Delete API returned an empty or invalid response.");
}

// AwardAndPrize
public async Task<SmSimpleInputResponse> GetAwardTypes()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/ListAllAwards";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AwardTypes retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The AwardAndPrize GetAwardTypes API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateAwardType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/CreateAwardType";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateAwardType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/UpdateAwardType";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteAwardType(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/DeleteAwardType?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AwardType deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The AwardAndPrize DeleteAwardType API returned an empty or invalid response.");
}

public async Task<SmSimpleInputResponse> GetPrizeTypes()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/ListAllPrizes";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PrizeTypes retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The AwardAndPrize GetPrizeTypes API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreatePrizeType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/CreatePrizeType";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdatePrizeType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/UpdatePrizeType";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeletePrizeType(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/DeletePrizeType?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PrizeType deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The AwardAndPrize DeletePrizeType API returned an empty or invalid response.");
}

public async Task<PrizeAwardedResponse> GetPrizeAwards()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/ListAllPrizeAwards";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PrizeAwards retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<PrizeAwardedResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The AwardAndPrize GetPrizeAwards API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreatePrizeAward(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/CreatePrizeAward";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdatePrizeAward(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/UpdatePrizeAward";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeletePrizeAward(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}AwardAndPrize/DeletePrizeAward?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PrizeAward deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The AwardAndPrize DeletePrizeAward API returned an empty or invalid response.");
}

// BehavioralAssessment
public async Task<BehavioralAssessmentResponse> GetBehavioralAssessments()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}BehavioralAssessment/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"BehavioralAssessment retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BehavioralAssessmentResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The BehavioralAssessment GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateBehavioralAssessment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}BehavioralAssessment/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateBehavioralAssessment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}BehavioralAssessment/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteBehavioralAssessment(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}BehavioralAssessment/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"BehavioralAssessment deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The BehavioralAssessment Delete API returned an empty or invalid response.");
}

// BillFooter
public async Task<BillFooterResponse> GetBillFooters()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}BillFooter/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"BillFooter retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BillFooterResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The BillFooter GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateBillFooter(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}BillFooter/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateBillFooter(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}BillFooter/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteBillFooter(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}BillFooter/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"BillFooter deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The BillFooter Delete API returned an empty or invalid response.");
}

// CategoryPercentage
public async Task<CategoryPercentageResponse> GetCategoryPercentages()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}CategoryPercentage/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"CategoryPercentage retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<CategoryPercentageResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The CategoryPercentage GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateCategoryPercentage(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}CategoryPercentage/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateCategoryPercentage(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}CategoryPercentage/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteCategoryPercentage(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}CategoryPercentage/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"CategoryPercentage deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The CategoryPercentage Delete API returned an empty or invalid response.");
}

// Certificate
public async Task<SmSimpleInputResponse> GetCertificates()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Certificate/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Certificate retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Certificate GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateCertificate(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Certificate/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateCertificate(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Certificate/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteCertificate(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Certificate/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Certificate deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Certificate Delete API returned an empty or invalid response.");
}

// ChangeStudentStatus
public async Task<BaseApiResponse> CreateStudentStatus(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ChangeStudentStatus/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStudentStatus(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ChangeStudentStatus/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

// Attendance
public async Task<AttendanceResponse> GetAttendances()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Attendance/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Attendance retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<AttendanceResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Attendance GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateAttendance(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Attendance/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateAttendance(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Attendance/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteAttendance(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Attendance/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Attendance deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Attendance Delete API returned an empty or invalid response.");
}

public async Task<CumulativeAttendanceResponse> GetCumulativeAttendances()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Attendance/ListAllCumulativeAttendance";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Cumulative attendance retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<CumulativeAttendanceResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Attendance GetCumulativeAttendances API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateCumulativeAttendance(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Attendance/CreateAttendance";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateCumulativeAttendance(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Attendance/UpdateAttendance";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteCumulativeAttendance(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Attendance/DeleteAttendance?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Cumulative attendance deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Attendance DeleteCumulativeAttendance API returned an empty or invalid response.");
}

// ClassLevelPercentage
public async Task<ClassLevelPercentageResponse> GetClassLevelPercentages()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ClassLevelPercentage/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ClassLevelPercentage retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<ClassLevelPercentageResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ClassLevelPercentage GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateClassLevelPercentage(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ClassLevelPercentage/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateClassLevelPercentage(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ClassLevelPercentage/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteClassLevelPercentage(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ClassLevelPercentage/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ClassLevelPercentage deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ClassLevelPercentage Delete API returned an empty or invalid response.");
}

// ClassPromotion
public async Task<ClassPromotionResponse> GetClassPromotions()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ClassPromotion/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ClassPromotion retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<ClassPromotionResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ClassPromotion GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateClassPromotion(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ClassPromotion/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateClassPromotion(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ClassPromotion/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

// ClassRoom
public async Task<SmSimpleInputResponse> GetClassRooms()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ClassRoom/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ClassRoom retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ClassRoom GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateClassRoom(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ClassRoom/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateClassRoom(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ClassRoom/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteClassRoom(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ClassRoom/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ClassRoom deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ClassRoom Delete API returned an empty or invalid response.");
}

// SmCreditMemo
public async Task<SchCreditMemoResponse> GetSchCreditMemos()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SmCreditMemo/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SmCreditMemo retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SchCreditMemoResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SmCreditMemo GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateSchCreditMemo(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SmCreditMemo/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateSchCreditMemo(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SmCreditMemo/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> CancelSchCreditMemo(List<Guid> memoIds)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}SmCreditMemo/CancelMemos";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(memoIds);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"School credit memo cancellation failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SmCreditMemo Cancel API returned an empty or invalid response.");
}

// DistanceGroup
public async Task<DistanceGroupResponse> GetDistanceGroups()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DistanceGroup/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"DistanceGroup retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<DistanceGroupResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The DistanceGroup GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateDistanceGroup(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DistanceGroup/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateDistanceGroup(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DistanceGroup/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteDistanceGroup(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}DistanceGroup/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"DistanceGroup deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The DistanceGroup Delete API returned an empty or invalid response.");
}

// Excursion
public async Task<ExcursionResponse> GetExcursions()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Excursion/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Excursion retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<ExcursionResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Excursion GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateExcursion(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Excursion/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateExcursion(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Excursion/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteExcursion(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Excursion/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Excursion deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Excursion Delete API returned an empty or invalid response.");
}

// FeesDescription
public async Task<FeesDescriptionResponse> GetFeesDescriptions()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeesDescription/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"FeesDescription retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<FeesDescriptionResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The FeesDescription GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateFeesDescription(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeesDescription/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateFeesDescription(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeesDescription/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteFeesDescription(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeesDescription/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"FeesDescription deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The FeesDescription Delete API returned an empty or invalid response.");
}

// FeeSetUp
public async Task<FeeSetUpResponse> GetFees()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/ListAllFees";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Fees retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<FeeSetUpResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The FeeSetUp GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateFee(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/CreateFee";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateFee(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/UpdateFee";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteFee(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/DeleteFee?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Fee deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The FeeSetUp Delete API returned an empty or invalid response.");
}

public async Task<SmSimpleInputResponse> GetBoardingItems()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/ListAllBoardingItems";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"BoardingItems retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The FeeSetUp GetBoardingItems API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateBoardingItem(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/CreateBoardingItem";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateBoardingItem(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/UpdateBoardingItem";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteBoardingItem(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/DeleteBoardingItem?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"BoardingItem deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The FeeSetUp DeleteBoardingItem API returned an empty or invalid response.");
}

public async Task<BoardingFeeResponse> GetBoardingFees()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/ListAllBoardingFees";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"BoardingFees retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BoardingFeeResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The FeeSetUp GetBoardingFees API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateBoardingFee(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/CreateBoardingFee";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateBoardingFee(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/UpdateBoardingFee";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteBoardingFee(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}FeeSetUp/DeleteBoardingFee?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"BoardingFee deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The FeeSetUp DeleteBoardingFee API returned an empty or invalid response.");
}

// Health
public async Task<SmSimpleInputResponse> GetHealths()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Health/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Health retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Health GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateHealth(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Health/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateHealth(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Health/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteHealth(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Health/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Health deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Health Delete API returned an empty or invalid response.");
}

// Hostel
public async Task<HostelResponse> GetHostels()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Hostel/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Hostel retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<HostelResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Hostel GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateHostel(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Hostel/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateHostel(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Hostel/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteHostel(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Hostel/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Hostel deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Hostel Delete API returned an empty or invalid response.");
}

// House
public async Task<SmSimpleInputResponse> GetHouses()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}House/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"House retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The House GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateHouse(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}House/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateHouse(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}House/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteHouse(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}House/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"House deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The House Delete API returned an empty or invalid response.");
}

// Location
public async Task<SmSimpleInputResponse> GetLocations()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Location/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Location retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Location GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateLocation(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Location/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateLocation(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Location/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteLocation(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Location/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Location deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Location Delete API returned an empty or invalid response.");
}

// MidTermAssessment
public async Task<AssessmentRemarkHeaderResponse> GetAssessmentRemarkHeaders()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}MidTermAssessment/ListAllAssessmentHeaders";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AssessmentRemarkHeaders retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<AssessmentRemarkHeaderResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The MidTermAssessment GetAssessmentRemarkHeaders API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateAssessmentRemarkHeader(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}MidTermAssessment/CreateHeader";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateAssessmentRemarkHeader(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}MidTermAssessment/UpdateHeader";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteAssessmentRemarkHeader(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}MidTermAssessment/DeleteHeader?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AssessmentRemarkHeader deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The MidTermAssessment DeleteAssessmentRemarkHeader API returned an empty or invalid response.");
}

public async Task<MidTermAssessmentResponse> GetMidTermAssessments()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}MidTermAssessment/ListAllMidTermAssessments";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"MidTermAssessment retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<MidTermAssessmentResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The MidTermAssessment GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateMidTermAssessment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}MidTermAssessment/CreateMidTermAssessment";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateMidTermAssessment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}MidTermAssessment/UpdateMidTermAssessment";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteMidTermAssessment(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}MidTermAssessment/DeleteMidTermAssessment?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"MidTermAssessment deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The MidTermAssessment Delete API returned an empty or invalid response.");
}

// SmOpeningBalance
public async Task<StudentOpeningBalanceResponse> GetSmOpeningBalances()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SmOpeningBalance/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SmOpeningBalance retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentOpeningBalanceResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SmOpeningBalance GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateSmOpeningBalance(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SmOpeningBalance/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateSmOpeningBalance(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SmOpeningBalance/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteSmOpeningBalance(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SmOpeningBalance/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SmOpeningBalance deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SmOpeningBalance Delete API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> PostSmOpeningBalance(List<Guid> balanceIds)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}SmOpeningBalance/PostBalances";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(balanceIds);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Opening balance posting failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SmOpeningBalance Post API returned an empty or invalid response.");
}

// ParentProfession
public async Task<SmSimpleInputResponse> GetParentProfessions()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ParentProfession/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ParentProfession retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ParentProfession GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateParentProfession(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ParentProfession/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateParentProfession(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ParentProfession/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteParentProfession(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ParentProfession/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ParentProfession deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ParentProfession Delete API returned an empty or invalid response.");
}

// SmPayment
public async Task<SchPaymentResponse> GetSchPayments()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SmPayment/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SmPayment retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SchPaymentResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SmPayment GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateSchPayment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SmPayment/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateSchPayment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SmPayment/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> ProcessSchPayments(List<Guid> paymentIds)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}SmPayment/ProcessPayments";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(paymentIds);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"School payment processing failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SmPayment Process API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CancelSchPayments(List<Guid> paymentIds)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}SmPayment/CancelPayments";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(paymentIds);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"School payment cancellation failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SmPayment Cancel API returned an empty or invalid response.");
}

// PostToGl
public async Task<BaseApiResponse> PostBills(List<Guid> billIds)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}PostToGl/PostBills";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(billIds);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Bill posting failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The PostToGl PostBills API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> PostSchPayments(List<Guid> billIds)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}PostToGl/PostPayments";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(billIds);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"School payment posting failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The PostToGl PostSchPayments API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> PostSchCreditMemos(List<Guid> memoIds)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}PostToGl/PostCreditMemos";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(memoIds);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"School credit memo posting failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The PostToGl PostSchCreditMemos API returned an empty or invalid response.");
}

// ProcessBill
public async Task<BillResponse> GetBills()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ProcessBill/ListAllBills";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ProcessBill retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BillResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ProcessBill GetAll API returned an empty or invalid response.");
}
public async Task<StudentBillInfoResponse> GetStudentBills()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ProcessBill/ListAllStudentBills";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Bill retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentBillInfoResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Bill GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateBill(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ProcessBill/CreateBill";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateBill(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ProcessBill/UpdateBill";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> ProcessBills(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ProcessBill/ProcessMultipleBills";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Bill processing failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ProcessBill ProcessBills API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CancelStudentBills(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    var url = $"{_apiBaseUrl}ProcessBill/CancelBillsForStudents";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Student bill cancellation failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ProcessBill CancelStudentBills API returned an empty or invalid response.");
}

public async Task<ExistingBillResponse> GetExistingBill()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}ProcessBill/CheckExistingBill";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Existing bill retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<ExistingBillResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The ProcessBill GetExistingBill API returned an empty or invalid response.");
}

// PtaExecutive
public async Task<PtaExecutiveResponse> GetPtaExecutives()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PtaExecutive/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PtaExecutive retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<PtaExecutiveResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The PtaExecutive GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreatePtaExecutive(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PtaExecutive/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdatePtaExecutive(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PtaExecutive/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeletePtaExecutive(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PtaExecutive/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PtaExecutive deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The PtaExecutive Delete API returned an empty or invalid response.");
}

// PtaPosition
public async Task<SmSimpleInputResponse> GetPtaPositions()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PtaPosition/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PtaPosition retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The PtaPosition GetAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreatePtaPosition(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PtaPosition/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdatePtaPosition(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PtaPosition/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeletePtaPosition(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}PtaPosition/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PtaPosition deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The PtaPosition Delete API returned an empty or invalid response.");
}


// RegisterClass
public async Task<RegisteredClassResponse> GetRegisteredClasses()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}RegisterClass/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"RegisteredClasses retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<RegisteredClassResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The RegisterClass ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateRegisteredClass(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}RegisterClass/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateRegisteredClass(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}RegisterClass/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteRegisteredClass(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}RegisterClass/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"RegisteredClass deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The RegisterClass Delete API returned an empty or invalid response.");
}

// RemarkByTeacher
public async Task<RemarksByTeacherResponse> GetRemarksByTeachers()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}RemarkByTeacher/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"RemarksByTeachers retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<RemarksByTeacherResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The RemarkByTeacher ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateRemarksByTeacher(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}RemarkByTeacher/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateRemarksByTeacher(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}RemarkByTeacher/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

// SchGlAccounts
public async Task<SchBillAccountResponse> GetSchBillAccounts()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/ListBillAccounts";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SchBillAccounts retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SchBillAccountResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SchGlAccounts ListAllSchBillAccounts API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateSchBillAccount(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/CreateBillAccount";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateSchBillAccount(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/UpdateBillAccount";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteSchBillAccount(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/DeleteBillAccount?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SchBillAccount deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SchGlAccounts DeleteSchBillAccount API returned an empty or invalid response.");
}

public async Task<SchPaymentAccountResponse> GetSchPaymentAccounts()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/ListPaymentAccounts";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SchPaymentAccounts retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SchPaymentAccountResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SchGlAccounts ListAllSchPaymentAccounts API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateSchPaymentAccount(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/CreatePaymentAccount";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateSchPaymentAccount(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/UpdatePaymentAccount";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteSchPaymentAccount(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/DeletePaymentAccount?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SchPaymentAccount deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SchGlAccounts DeleteSchPaymentAccount API returned an empty or invalid response.");
}

public async Task<SchCreditMemoAccountResponse> GetSchCreditMemoAccounts()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/ListCreditMemoAccounts";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SchCreditMemoAccounts retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SchCreditMemoAccountResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SchGlAccounts ListAllSchCreditMemoAccounts API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateSchCreditMemoAccount(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/CreateCreditMemoAccount";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateSchCreditMemoAccount(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/UpdateCreditMemoAccount";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteSchCreditMemoAccount(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchGlAccounts/DeleteCreditMemoAccount?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SchCreditMemoAccount deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SchGlAccounts DeleteSchCreditMemoAccount API returned an empty or invalid response.");
}

// SchoolGroup
public async Task<SchoolGroupResponse> GetSchoolGroups()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchoolGroup/ListAllGroups";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SchoolGroups retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SchoolGroupResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SchoolGroup ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateSchoolGroup(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchoolGroup/CreateGroup";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateSchoolGroup(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchoolGroup/UpdateGroup";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteSchoolGroup(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchoolGroup/DeleteGroup?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SchoolGroup deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SchoolGroup Delete API returned an empty or invalid response.");
}

// SchoolProfile
public async Task<SchoolProfileResponse> GetSchoolProfile()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchoolProfile/GetProfile";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SchoolProfile retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SchoolProfileResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SchoolProfile ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateSchoolProfile(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchoolProfile/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateSchoolProfile(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SchoolProfile/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

// StaffBio
public async Task<StaffBioResponse> GetStaffBios()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffBio/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffBios retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StaffBioResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffBio ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStaffBio(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffBio/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStaffBio(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffBio/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStaffBio(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffBio/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffBio deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffBio Delete API returned an empty or invalid response.");
}

// StaffDesignation
public async Task<SmSimpleInputResponse> GetStaffDesignations()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffDesignation/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffDesignations retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffDesignation ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStaffDesignation(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffDesignation/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStaffDesignation(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffDesignation/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStaffDesignation(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffDesignation/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffDesignation deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffDesignation Delete API returned an empty or invalid response.");
}

// StaffGrade
public async Task<SmSimpleInputResponse> GetStaffGrades()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffGrade/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffGrades retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffGrade ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStaffGrade(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffGrade/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStaffGrade(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffGrade/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStaffGrade(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffGrade/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffGrade deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffGrade Delete API returned an empty or invalid response.");
}

// StaffPastEmployment
public async Task<StaffPastEmploymentResponse> GetStaffPastEmployments()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffPastEmployment/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffPastEmployments retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StaffPastEmploymentResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffPastEmployment ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStaffPastEmployment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffPastEmployment/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStaffPastEmployment(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffPastEmployment/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStaffPastEmployment(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffPastEmployment/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffPastEmployment deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffPastEmployment Delete API returned an empty or invalid response.");
}

// StaffPastPosition
public async Task<StaffPastPositionResponse> GetStaffPastPositions()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffPastPosition/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffPastPositions retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StaffPastPositionResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffPastPosition ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStaffPastPosition(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffPastPosition/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStaffPastPosition(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffPastPosition/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStaffPastPosition(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffPastPosition/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffPastPosition deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffPastPosition Delete API returned an empty or invalid response.");
}

// StaffQualification
public async Task<StaffQualificationResponse> GetStaffQualifications()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffQualification/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffQualifications retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StaffQualificationResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffQualification ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStaffQualification(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffQualification/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStaffQualification(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffQualification/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStaffQualification(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffQualification/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffQualification deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffQualification Delete API returned an empty or invalid response.");
}

// StaffRelationship
public async Task<StaffRelationshipResponse> GetStaffRelationships()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffRelationship/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffRelationships retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StaffRelationshipResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffRelationship ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStaffRelationship(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffRelationship/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStaffRelationship(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffRelationship/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStaffRelationship(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StaffRelationship/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StaffRelationship deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StaffRelationship Delete API returned an empty or invalid response.");
}

// StContactRelationship
public async Task<StContactRelationshipResponse> GetStContactRelationships()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StContactRelationship/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StContactRelationships retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StContactRelationshipResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StContactRelationship ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStContactRelationship(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StContactRelationship/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStContactRelationship(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StContactRelationship/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStContactRelationship(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StContactRelationship/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StContactRelationship deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StContactRelationship Delete API returned an empty or invalid response.");
}

// StudentAllergy
public async Task<SmSimpleInputResponse> GetAllergyTypes()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentAllergy/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AllergyTypes retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentAllergy ListAllAllergyTypes API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateAllergyType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentAllergy/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateAllergyType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentAllergy/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteAllergyType(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentAllergy/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"AllergyType deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentAllergy DeleteAllergyType API returned an empty or invalid response.");
}

public async Task<StudentAllergyResponse> GetStudentAllergies(Guid studentId)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentAllergy/ListByStudentId?studentId={studentId}";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentAllergies retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentAllergyResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentAllergy ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStudentAllergy(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentAllergy/CreateStudentAllergy";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStudentAllergy(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentAllergy/UpdateStudentAllergy";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStudentAllergy(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentAllergy/DeleteStudentAllergy?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentAllergy deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentAllergy Delete API returned an empty or invalid response.");
}

// StudentBio
public async Task<StudentInfoResponse> GetStudentBios()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentBio/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentBios retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentInfoResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentBio ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStudentBio(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentBio/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStudentBio(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentBio/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStudentBio(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentBio/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentBio deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentBio Delete API returned an empty or invalid response.");
}

// StudentDisability
public async Task<SmSimpleInputResponse> GetDisabilityTypes()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentDisability/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"DisabilityTypes retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentDisability ListAllDisabilityTypes API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateDisabilityType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentDisability/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateDisabilityType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentDisability/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteDisabilityType(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentDisability/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"DisabilityType deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentDisability DeleteDisabilityType API returned an empty or invalid response.");
}

public async Task<StudentDisabilityResponse> GetStudentDisabilities(Guid studentId)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentDisability/ListByStudentId?studentId={studentId}";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentDisabilities retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentDisabilityResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentDisability ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStudentDisability(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentDisability/CreateForStudent";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStudentDisability(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentDisability/UpdateForStudent";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStudentDisability(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentDisability/DeleteForStudent?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentDisability deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentDisability Delete API returned an empty or invalid response.");
}

// StudentImmunization
public async Task<SmSimpleInputResponse> GetImmunizationTypes()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentImmunization/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ImmunizationTypes retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentImmunization ListAllImmunizationTypes API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateImmunizationType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentImmunization/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateImmunizationType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentImmunization/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteImmunizationType(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentImmunization/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"ImmunizationType deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentImmunization DeleteImmunizationType API returned an empty or invalid response.");
}

public async Task<StudentImmunizationResponse> GetStudentImmunizations(Guid studentId)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentImmunization/ListAllForStudent?studentId={studentId}";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentImmunizations retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentImmunizationResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentImmunization ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStudentImmunization(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentImmunization/CreateForStudent";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStudentImmunization(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentImmunization/UpdateForStudent";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStudentImmunization(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentImmunization/DeleteForStudent?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentImmunization deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentImmunization Delete API returned an empty or invalid response.");
}

// StudentMedical
public async Task<StudentMedicalResponse> GetStudentMedicals(Guid studentId)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentMedical/ListByStudentId?studentId={studentId}";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentMedicals retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentMedicalResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentMedical ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStudentMedical(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentMedical/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStudentMedical(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentMedical/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStudentMedical(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentMedical/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentMedical deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentMedical Delete API returned an empty or invalid response.");
}

// StudentPosition
public async Task<SmSimpleInputResponse> GetPositionTypes()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPosition/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PositionTypes retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SmSimpleInputResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentPosition ListAllPositionTypes API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreatePositionType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPosition/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdatePositionType(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPosition/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeletePositionType(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPosition/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PositionType deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentPosition DeletePositionType API returned an empty or invalid response.");
}

public async Task<StudentPositionResponse> GetStudentPositions(Guid studentId)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPosition/ListByStudentId?studentId={studentId}";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentPositions retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentPositionResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentPosition ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStudentPosition(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPosition/CreateForStudent";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStudentPosition(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPosition/UpdateForStudent";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteStudentPosition(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPosition/DeleteForStudent?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentPosition deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentPosition Delete API returned an empty or invalid response.");
}

public async Task<StudentPositionResponse> GetStudentPositions()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPosition/GetAllStudentPositions";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentPositions retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentPositionResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentPosition ListAll API returned an empty or invalid response.");
}

// StudentPromotion
public async Task<StudentPromotionResponse> GetStudentPromotions()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPromotion/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"StudentPromotions retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<StudentPromotionResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentPromotion ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateStudentPromotion(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPromotion/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateStudentPromotion(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPromotion/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<PreClassStudentPromotionResponse> GetPreClassStudentPromotions()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPromotion/ListAllPreClass";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"PreClassStudentPromotions retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<PreClassStudentPromotionResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The StudentPromotion ListAllPreClassStudentPromotions API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreatePreClassStudentPromotion(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPromotion/CreatePreClass";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdatePreClassStudentPromotion(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}StudentPromotion/UpdatePreClass";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

// SubjectRemark
public async Task<SubjectRemarkResponse> GetSubjectRemarks()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SubjectRemark/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SubjectRemarks retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SubjectRemarkResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SubjectRemark ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateSubjectRemark(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SubjectRemark/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateSubjectRemark(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SubjectRemark/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteSubjectRemark(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SubjectRemark/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SubjectRemark deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SubjectRemark Delete API returned an empty or invalid response.");
}

// Subject
public async Task<SubjectResponse> GetSubjects()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Subject/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Subjects retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SubjectResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Subject ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateSubject(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Subject/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateSubject(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Subject/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteSubject(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}Subject/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"Subject deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The Subject Delete API returned an empty or invalid response.");
}

// SupplementaryItem
public async Task<SupplementaryItemResponse> GetSupplementaryItems()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SupplementaryItem/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SupplementaryItems retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<SupplementaryItemResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SupplementaryItem ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateSupplementaryItem(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SupplementaryItem/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateSupplementaryItem(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SupplementaryItem/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteSupplementaryItem(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}SupplementaryItem/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"SupplementaryItem deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The SupplementaryItem Delete API returned an empty or invalid response.");
}

// TeacherClass
public async Task<TeacherClassResponse> GetTeacherClasses()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TeacherClass/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"TeacherClasses retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<TeacherClassResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The TeacherClass ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreatTeacherClass(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TeacherClass/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateTeacherClass(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TeacherClass/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteTeacherClass(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TeacherClass/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"TeacherClass deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The TeacherClass Delete API returned an empty or invalid response.");
}

// TeacherSubject
public async Task<TeacherSubjectResponse> GetTeacherSubjects()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TeacherSubject/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"TeacherSubjects retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<TeacherSubjectResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The TeacherSubject ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateTeacherSubject(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TeacherSubject/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateTeacherSubject(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TeacherSubject/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteTeacherSubject(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TeacherSubject/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"TeacherSubject deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The TeacherSubject Delete API returned an empty or invalid response.");
}

// TimeTable
public async Task<TimeTableResponse> GetTimeTables()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TimeTable/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"TimeTables retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<TimeTableResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The TimeTable ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateTimeTable(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TimeTable/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateTimeTable(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TimeTable/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteTimeTable(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TimeTable/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"TimeTable deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The TimeTable Delete API returned an empty or invalid response.");
}

// TransportationLocation
public async Task<TransportationLocationResponse> GetTransportationLocations()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TransportationLocation/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"TransportationLocations retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<TransportationLocationResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The TransportationLocation ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreateTransportationLocation(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TransportationLocation/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateTransportationLocation(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TransportationLocation/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteTransportationLocation(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TransportationLocation/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"TransportationLocation deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The TransportationLocation Delete API returned an empty or invalid response.");
}

// TransportationUnit
public async Task<TransportationUnitResponse> GetTransportationUnits()
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TransportationUnit/ListAll";

    using var request = new HttpRequestMessage(HttpMethod.Get, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"TransportationUnits retrieval failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<TransportationUnitResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The TransportationUnit ListAll API returned an empty or invalid response.");
}

public async Task<BaseApiResponse> CreatTransportationUnit(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TransportationUnit/Create";

    using var request = new HttpRequestMessage(HttpMethod.Post, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> UpdateTransportationUnit(object dto)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TransportationUnit/Update";

    using var request = new HttpRequestMessage(HttpMethod.Put, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");
    request.Content = JsonContent.Create(dto);

    using var response = await _httpClient.SendAsync(request);

    if (response.IsSuccessStatusCode)
    {
        string responseData = await response.Content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
               ?? new BaseApiResponse { };
    }

    return new BaseApiResponse { };
}

public async Task<BaseApiResponse> DeleteTransportationUnit(Guid id)
{
    var authToken = _claimsHelper.GetAuthToken();
    string url = $"{_apiBaseUrl}TransportationUnit/Delete?id={id}";

    using var request = new HttpRequestMessage(HttpMethod.Delete, url);
    request.Headers.Add("Authorization", $"Bearer {authToken}");

    using var response = await _httpClient.SendAsync(request);
    var responseData = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        throw new HttpRequestException(
            $"TransportationUnit deletion failed ({(int)response.StatusCode}): {responseData}");
    }

    return JsonConvert.DeserializeObject<BaseApiResponse>(responseData)
           ?? throw new InvalidOperationException(
               "The TransportationUnit Delete API returned an empty or invalid response.");
}


}
