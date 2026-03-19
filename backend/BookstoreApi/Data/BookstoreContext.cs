using BookstoreApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BookstoreApi.Data;

public class BookstoreContext : DbContext
{
    public BookstoreContext(DbContextOptions<BookstoreContext> options)
        : base(options)
    {
    }

    public DbSet<Book> Books => Set<Book>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Map the entity directly to the prepopulated `Books` table.
        modelBuilder.Entity<Book>(entity =>
        {
            entity.ToTable("Books");
            entity.HasKey(e => e.BookID);

            entity.Property(e => e.BookID).HasColumnName("BookID");
            entity.Property(e => e.Title).HasColumnName("Title");
            entity.Property(e => e.Author).HasColumnName("Author");
            entity.Property(e => e.Publisher).HasColumnName("Publisher");
            entity.Property(e => e.ISBN).HasColumnName("ISBN");
            entity.Property(e => e.Classification).HasColumnName("Classification");
            entity.Property(e => e.Category).HasColumnName("Category");
            entity.Property(e => e.PageCount).HasColumnName("PageCount");

            // SQLite stores `Price` as REAL in this database.
            entity.Property(e => e.Price).HasColumnName("Price").HasColumnType("REAL");
        });
    }
}

