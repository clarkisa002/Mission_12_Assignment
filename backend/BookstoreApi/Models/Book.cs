namespace BookstoreApi.Models;

/// <summary>
/// Entity model that matches the prepopulated SQLite `Books` table in `Bookstore.sqlite`.
/// </summary>
public class Book
{
    public int BookID { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Publisher { get; set; } = string.Empty;
    public string ISBN { get; set; } = string.Empty;
    public string Classification { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    public int PageCount { get; set; }
    public decimal Price { get; set; }
}

