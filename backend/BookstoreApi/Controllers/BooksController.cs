using BookstoreApi.Data;
using BookstoreApi.Dtos;
using BookstoreApi.Models;
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
        [FromQuery] string sortDir = "asc",
        [FromQuery] string? category = null)
    {
        // Clamp inputs to sensible bounds.
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 5;
        if (pageSize > 50) pageSize = 50;

        var normalizedSortDir = (sortDir ?? "asc").Trim().ToLowerInvariant();
        var ascending = normalizedSortDir != "desc";

        var baseQuery = _context.Books.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(category))
        {
            baseQuery = baseQuery.Where(b => b.Category == category.Trim());
        }

        var totalItems = await baseQuery.CountAsync();
        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pageSize);
        if (totalPages > 0 && page > totalPages)
        {
            page = totalPages;
        }

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

    [HttpGet("categories")]
    [ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<string>>> GetCategories()
    {
        var categories = await _context.Books
            .AsNoTracking()
            .Select(b => b.Category)
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return Ok(categories);
    }

    /// <summary>
    /// Returns a single book by id (used after create and for admin editing).
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(BookDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookDto>> GetBook(int id)
    {
        var b = await _context.Books.AsNoTracking().FirstOrDefaultAsync(x => x.BookID == id);
        if (b is null)
        {
            return NotFound();
        }

        return Ok(new BookDto
        {
            BookID = b.BookID,
            Title = b.Title,
            Author = b.Author,
            Publisher = b.Publisher,
            ISBN = b.ISBN,
            Classification = b.Classification,
            Category = b.Category,
            PageCount = b.PageCount,
            Price = b.Price,
        });
    }

    /// <summary>
    /// Creates a new book row.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(BookDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookDto>> CreateBook([FromBody] BookCreateUpdateDto dto)
    {
        if (dto is null)
        {
            return BadRequest("Request body is required.");
        }

        var entity = new Book
        {
            Title = dto.Title.Trim(),
            Author = dto.Author.Trim(),
            Publisher = dto.Publisher.Trim(),
            ISBN = dto.ISBN.Trim(),
            Classification = dto.Classification.Trim(),
            Category = dto.Category.Trim(),
            PageCount = dto.PageCount,
            Price = dto.Price,
        };

        _context.Books.Add(entity);
        await _context.SaveChangesAsync();

        var created = new BookDto
        {
            BookID = entity.BookID,
            Title = entity.Title,
            Author = entity.Author,
            Publisher = entity.Publisher,
            ISBN = entity.ISBN,
            Classification = entity.Classification,
            Category = entity.Category,
            PageCount = entity.PageCount,
            Price = entity.Price,
        };

        return CreatedAtAction(nameof(GetBook), new { id = created.BookID }, created);
    }

    /// <summary>
    /// Updates an existing book by id.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateBook(int id, [FromBody] BookCreateUpdateDto dto)
    {
        if (dto is null)
        {
            return BadRequest("Request body is required.");
        }

        var entity = await _context.Books.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        entity.Title = dto.Title.Trim();
        entity.Author = dto.Author.Trim();
        entity.Publisher = dto.Publisher.Trim();
        entity.ISBN = dto.ISBN.Trim();
        entity.Classification = dto.Classification.Trim();
        entity.Category = dto.Category.Trim();
        entity.PageCount = dto.PageCount;
        entity.Price = dto.Price;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Deletes a book by id.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBook(int id)
    {
        var entity = await _context.Books.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        _context.Books.Remove(entity);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

