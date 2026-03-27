import { useEffect, useMemo, useRef, useState } from "react";
import { Offcanvas, Tooltip, Toast } from "bootstrap";

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

type CartItem = {
  bookID: number;
  title: string;
  price: number;
  quantity: number;
};

type BrowseState = {
  page: number;
  pageSize: number;
  sortDir: SortDirection;
  category: string;
};

const DEFAULT_API_BASE_URL = "http://localhost:5017";
const CART_SESSION_KEY = "bookstore-cart";
const BROWSE_SESSION_KEY = "bookstore-browse-state";

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
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [returnToPage, setReturnToPage] = useState(1);

  const cartOffcanvasRef = useRef<HTMLDivElement | null>(null);
  const toastRef = useRef<HTMLDivElement | null>(null);
  const toastInstanceRef = useRef<Toast | null>(null);

  // Restore previous browsing state and cart for this browser session.
  useEffect(() => {
    const rawCart = sessionStorage.getItem(CART_SESSION_KEY);
    if (rawCart) {
      try {
        const parsed = JSON.parse(rawCart) as CartItem[];
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      } catch {
        // Ignore malformed session data and continue with defaults.
      }
    }

    const rawBrowse = sessionStorage.getItem(BROWSE_SESSION_KEY);
    if (rawBrowse) {
      try {
        const parsed = JSON.parse(rawBrowse) as BrowseState;
        if (parsed.page) setPage(parsed.page);
        if (parsed.pageSize) setPageSize(parsed.pageSize);
        if (parsed.sortDir) setSortDir(parsed.sortDir);
        if (typeof parsed.category === "string") setSelectedCategory(parsed.category);
      } catch {
        // Ignore malformed session data and continue with defaults.
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(CART_SESSION_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const browseState: BrowseState = {
      page,
      pageSize,
      sortDir,
      category: selectedCategory,
    };
    sessionStorage.setItem(BROWSE_SESSION_KEY, JSON.stringify(browseState));
  }, [page, pageSize, sortDir, selectedCategory]);

  useEffect(() => {
    const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipInstances = Array.from(tooltipElements).map(
      (el) => new Tooltip(el)
    );

    if (toastRef.current) {
      toastInstanceRef.current = new Toast(toastRef.current, { delay: 1500 });
    }

    return () => {
      tooltipInstances.forEach((instance) => instance.dispose());
      toastInstanceRef.current?.dispose();
    };
  }, [books, cart.length]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchCategories() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/books/categories`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to load categories.");
        const data = (await response.json()) as string[];
        setCategories(data ?? []);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }

    fetchCategories();
    return () => controller.abort();
  }, [apiBaseUrl]);

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
        if (selectedCategory) {
          url.searchParams.set("category", selectedCategory);
        }

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
  }, [apiBaseUrl, page, pageSize, sortDir, selectedCategory]);

  const pageSizeOptions = [5, 10, 15, 20];

  function toggleSortDir() {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  }

  function onPageSizeChange(nextSize: number) {
    setPageSize(nextSize);
    setPage(1);
  }

  function onCategoryChange(nextCategory: string) {
    setSelectedCategory(nextCategory);
    setPage(1);
  }

  function addToCart(book: BookDto) {
    setCart((prev) => {
      const existing = prev.find((item) => item.bookID === book.bookID);
      if (existing) {
        return prev.map((item) =>
          item.bookID === book.bookID
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        { bookID: book.bookID, title: book.title, price: book.price, quantity: 1 },
      ];
    });
    toastInstanceRef.current?.show();
  }

  function updateCartQuantity(bookID: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.bookID === bookID
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function openCart() {
    setReturnToPage(page);
    if (cartOffcanvasRef.current) {
      const offcanvas = Offcanvas.getOrCreateInstance(cartOffcanvasRef.current);
      offcanvas.show();
    }
  }

  function continueShopping() {
    if (cartOffcanvasRef.current) {
      const offcanvas = Offcanvas.getOrCreateInstance(cartOffcanvasRef.current);
      offcanvas.hide();
    }
    setPage(returnToPage);
  }

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTax = cartSubtotal * 0.07;
  const cartTotal = cartSubtotal + cartTax;

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-12 col-lg-9">
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

              <div className="input-group input-group-sm" style={{ maxWidth: 250 }}>
                <span className="input-group-text">Category</span>
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                >
                  <option value="">All</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <button className="btn btn-outline-primary btn-sm" onClick={toggleSortDir}>
                Sort by Title: {sortDir === "asc" ? "A-Z" : "Z-A"}
              </button>

              <button
                className="btn btn-primary btn-sm position-relative"
                onClick={openCart}
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Open your shopping cart"
              >
                View Cart
                {cartItemCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {cartItemCount}
                  </span>
                )}
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
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-muted">
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
                        <td className="text-end">${formatPrice(b.price)}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => addToCart(b)}
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Add this book to cart"
                          >
                            Add
                          </button>
                        </td>
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
                  <button
                    className="page-link"
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || totalPages === 0}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="col-12 col-lg-3">
          <div className="card shadow-sm sticky-top" style={{ top: "1rem" }}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Cart Summary</span>
              <span className="badge text-bg-secondary">{cartItemCount} items</span>
            </div>
            <div className="card-body">
              <p className="mb-1">
                Subtotal: <strong>${formatPrice(cartSubtotal)}</strong>
              </p>
              <p className="mb-1">
                Tax (7%): <strong>${formatPrice(cartTax)}</strong>
              </p>
              <p className="mb-3">
                Total: <strong>${formatPrice(cartTotal)}</strong>
              </p>
              <button className="btn btn-outline-primary btn-sm w-100" onClick={openCart}>
                Open Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={cartOffcanvasRef}
        className="offcanvas offcanvas-end"
        tabIndex={-1}
        id="cartOffcanvas"
        aria-labelledby="cartOffcanvasLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="cartOffcanvasLabel">
            Your Cart
          </h5>
          <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" />
        </div>
        <div className="offcanvas-body">
          {cart.length === 0 ? (
            <div className="text-muted">Your cart is empty.</div>
          ) : (
            <ul className="list-group mb-3">
              {cart.map((item) => (
                <li
                  key={item.bookID}
                  className="list-group-item d-flex justify-content-between align-items-start"
                >
                  <div className="me-2">
                    <div className="fw-semibold">{item.title}</div>
                    <small className="text-muted">
                      ${formatPrice(item.price)} each | Subtotal: $
                      {formatPrice(item.price * item.quantity)}
                    </small>
                  </div>
                  <div className="btn-group btn-group-sm" role="group" aria-label="Quantity controls">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => updateCartQuantity(item.bookID, -1)}
                    >
                      -
                    </button>
                    <span className="btn btn-light disabled">{item.quantity}</span>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => updateCartQuantity(item.bookID, 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="border-top pt-3 mb-3">
            <div className="d-flex justify-content-between">
              <span>Subtotal</span>
              <strong>${formatPrice(cartSubtotal)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Tax (7%)</span>
              <strong>${formatPrice(cartTax)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Total</span>
              <strong>${formatPrice(cartTotal)}</strong>
            </div>
          </div>

          <button className="btn btn-primary w-100" onClick={continueShopping}>
            Continue Shopping
          </button>
        </div>
      </div>

      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        <div
          ref={toastRef}
          className="toast align-items-center text-bg-success border-0"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="d-flex">
            <div className="toast-body">Book added to cart.</div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" />
          </div>
        </div>
      </div>
    </div>
  );
}

