import { useEffect, useMemo, useState } from "react";

type SortDirection = "asc" | "desc";

type BookDto = {
  bookID: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  classification: string;
  category: string;
  pageCount: number;
  price: number;
};

type PaginatedResponse<T> = {
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: T[];
};

const DEFAULT_API_BASE_URL = "http://localhost:5017";

function formatPrice(value: number): string {
  // Keep formatting simple and consistent for displaying currency-like values.
  return value.toFixed(2);
}

export default function BookList() {
  const apiBaseUrl = useMemo(() => {
    // Allow overriding the backend URL without code changes.
    return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  }, []);

  const [books, setBooks] = useState<BookDto[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data any time the paging/sorting inputs change.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchBooks() {
      try {
        setLoading(true);
        setError(null);

        const url = new URL(`${apiBaseUrl}/api/books`);
        url.searchParams.set("page", String(page));
        url.searchParams.set("pageSize", String(pageSize));
        url.searchParams.set("sortDir", sortDir);

        const response = await fetch(url.toString(), { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as PaginatedResponse<BookDto>;

        setBooks(data.items ?? []);
        setTotalItems(data.totalItems ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? page);
        setPageSize(data.pageSize ?? pageSize);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load books.");
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
    return () => controller.abort();
  }, [apiBaseUrl, page, pageSize, sortDir]);

  const pageSizeOptions = [5, 10, 15, 20];

  function toggleSortDir() {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  }

  function onPageSizeChange(nextSize: number) {
    setPageSize(nextSize);
    setPage(1);
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <h2 className="mb-0">Bookstore</h2>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
            <span className="input-group-text">Results per page</span>
            <select
              className="form-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-outline-primary btn-sm" onClick={toggleSortDir}>
            Sort by Title: {sortDir === "asc" ? "A-Z" : "Z-A"}
          </button>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-muted">
          Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> (Total:{" "}
          <strong>{totalItems}</strong> books)
        </div>
      </div>

      {loading ? (
        <div className="alert alert-info">Loading books...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Publisher</th>
                <th>ISBN</th>
                <th>Classification</th>
                <th>Category</th>
                <th className="text-end">Pages</th>
                <th className="text-end">Price</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted">
                    No books found.
                  </td>
                </tr>
              ) : (
                books.map((b) => (
                  <tr key={b.bookID}>
                    <td>{b.title}</td>
                    <td>{b.author}</td>
                    <td>{b.publisher}</td>
                    <td>{b.isbn}</td>
                    <td>{b.classification}</td>
                    <td>{b.category}</td>
                    <td className="text-end">{b.pageCount}</td>
                    <td className="text-end">{formatPrice(b.price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <nav aria-label="Book pagination" className="mt-3">
        <ul className="pagination justify-content-center flex-wrap">
          <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
          </li>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
              <button className="page-link" onClick={() => setPage(p)} disabled={p === page}>
                {p}
              </button>
            </li>
          ))}

          <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

