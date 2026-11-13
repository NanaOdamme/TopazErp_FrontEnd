using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using TopazErp_FrontEnd.Models;
using TopazErp_FrontEnd.Models.Authentication;
using TopazErp_FrontEnd.Utils;

namespace TopazErp_FrontEnd.Services;

public class TopazErpApi: ITopazErpApi
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
}