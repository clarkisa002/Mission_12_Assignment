namespace BookstoreApi.Dtos;

/// <summary>
/// Generic pagination response returned by the API.
/// </summary>
public class PaginatedResponse<T>
{
    public int TotalItems { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public List<T> Items { get; set; } = new();
}

