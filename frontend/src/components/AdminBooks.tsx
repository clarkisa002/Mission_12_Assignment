import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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
  return value.toFixed(2);
}

const emptyForm = {
  title: "",
  author: "",
  publisher: "",
  isbn: "",
  classification: "",
  category: "",
  pageCount: 0,
  price: 0,
};

export default function AdminBooks() {
  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
    []
  );

  const [books, setBooks] = useState<BookDto[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [listVersion, setListVersion] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchBooks() {
      try {
        setLoading(true);
        setError(null);
        const url = new URL(`${apiBaseUrl}/api/books`);
        url.searchParams.set("page", String(page));
        url.searchParams.set("pageSize", String(pageSize));
        url.searchParams.set("sortDir", "asc");

        const response = await fetch(url.toString(), { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as PaginatedResponse<BookDto>;
        setBooks(data.items ?? []);
        setTotalItems(data.totalItems ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? page);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load books.");
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
    return () => controller.abort();
  }, [apiBaseUrl, page, pageSize, listVersion]);

  function startEdit(book: BookDto) {
    setEditingId(book.bookID);
    setForm({
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      isbn: book.isbn,
      classification: book.classification,
      category: book.category,
      pageCount: book.pageCount,
      price: book.price,
    });
  }

  function clearForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveBook() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        author: form.author,
        publisher: form.publisher,
        isbn: form.isbn,
        classification: form.classification,
        category: form.category,
        pageCount: form.pageCount,
        price: form.price,
      };

      if (editingId === null) {
        const response = await fetch(`${apiBaseUrl}/api/books`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Create failed: ${response.status}`);
        }
      } else {
        const response = await fetch(`${apiBaseUrl}/api/books/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Update failed: ${response.status}`);
        }
      }

      clearForm();
      setPage(1);
      setListVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBook(id: number) {
    if (!window.confirm("Delete this book from the database?")) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/books/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
      setPage(1);
      setListVersion((v) => v + 1);
      if (editingId === id) {
        clearForm();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h2 className="mb-0">Admin — Books</h2>
        <Link className="btn btn-outline-secondary btn-sm" to="/">
          Back to bookstore
        </Link>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header">
          {editingId === null ? "Add a new book" : `Edit book #${editingId}`}
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Title</label>
              <input
                className="form-control"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Author</label>
              <input
                className="form-control"
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Publisher</label>
              <input
                className="form-control"
                value={form.publisher}
                onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">ISBN</label>
              <input
                className="form-control"
                value={form.isbn}
                onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Classification</label>
              <input
                className="form-control"
                value={form.classification}
                onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Category</label>
              <input
                className="form-control"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Page count</label>
              <input
                type="number"
                min={0}
                className="form-control"
                value={form.pageCount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pageCount: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="form-control"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
          <div className="mt-3 d-flex flex-wrap gap-2">
            <button
              className="btn btn-primary"
              type="button"
              disabled={saving}
              onClick={() => void saveBook()}
            >
              {editingId === null ? "Add book" : "Update book"}
            </button>
            {editingId !== null && (
              <button className="btn btn-outline-secondary" type="button" onClick={clearForm}>
                Cancel edit
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="alert alert-info">Loading books...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <div className="mb-2 text-muted">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong> (Total:{" "}
            <strong>{totalItems}</strong> books)
          </div>
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th className="text-end">Price</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      No books found.
                    </td>
                  </tr>
                ) : (
                  books.map((b) => (
                    <tr key={b.bookID}>
                      <td>{b.title}</td>
                      <td>{b.author}</td>
                      <td>{b.category}</td>
                      <td className="text-end">${formatPrice(b.price)}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => startEdit(b)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={saving}
                          onClick={() => void deleteBook(b.bookID)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <nav aria-label="Admin book pagination" className="mt-3">
            <ul className="pagination justify-content-center flex-wrap">
              <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                  <button
                    className="page-link"
                    type="button"
                    onClick={() => setPage(p)}
                    disabled={p === page}
                  >
                    {p}
                  </button>
                </li>
              ))}
              <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || totalPages === 0}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
