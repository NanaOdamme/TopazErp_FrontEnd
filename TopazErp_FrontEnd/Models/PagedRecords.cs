namespace TopazErp_FrontEnd.Models;

public class PagedRecords<T>
{
    public int PageNo { get; set; }

    public int PageSize { get; set; }

    public int TotalCount { get; set; }

    public int TotalPages { get; set; }

    public int LowerBound { get; set; }

    public int UpperBound { get; set; }

    public List<T> Data { get; set; }

    /// <summary>Some backend endpoints return ABP-style "items" instead of "data".</summary>
    public List<T> Items { get; set; } = new List<T>();
}