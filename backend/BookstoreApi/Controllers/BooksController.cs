using BookstoreApi.Data;
using BookstoreApi.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookstoreApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly BookstoreContext _context;

    public BooksController(BookstoreContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Returns a page of books, sorted by title (ascending or descending).
    /// </summary>
    /// <param name="page">1-based page number.</param>
    /// <param name="pageSize">Number of results per page.</param>
    /// <param name="sortDir">`asc` or `desc`.</param>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<BookDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<BookDto>>> GetBooks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5,
        [FromQuery] string sortDir = "asc")
    {
        // Clamp inputs to sensible bounds.
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 5;
        if (pageSize > 50) pageSize = 50;

        var normalizedSortDir = (sortDir ?? "asc").Trim().ToLowerInvariant();
        var ascending = normalizedSortDir != "desc";

        var baseQuery = _context.Books.AsNoTracking();

        var totalItems = await baseQuery.CountAsync();
        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pageSize);

        var orderedQuery = ascending
            ? baseQuery.OrderBy(b => b.Title)
            : baseQuery.OrderByDescending(b => b.Title);

        var books = await orderedQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BookDto
            {
                BookID = b.BookID,
                Title = b.Title,
                Author = b.Author,
                Publisher = b.Publisher,
                ISBN = b.ISBN,
                Classification = b.Classification,
                Category = b.Category,
                PageCount = b.PageCount,
                Price = b.Price
            })
            .ToListAsync();

        return Ok(new PaginatedResponse<BookDto>
        {
            TotalItems = totalItems,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages,
            Items = books
        });
    }
}

