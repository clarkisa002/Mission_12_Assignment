# Mission 12 - Online Bookstore (ASP.NET Core API + React)

This project uses:
- `backend/BookstoreApi` (ASP.NET Core Web API + EF Core SQLite)
- `frontend` (React + Bootstrap)
- `Bookstore.sqlite` (prepopulated SQLite database at the repo root)

## Prerequisites
- .NET SDK installed (enough to run `dotnet run`)
- Node.js + npm installed

## How to run

### 1) Start the backend
From the repo root:
```bash
cd backend/BookstoreApi
dotnet run
```

The API serves books at:
`http://localhost:5017/api/books`

### 2) Start the frontend
From the repo root:
```bash
cd frontend
npm install
npm run dev
```

The React dev server runs on `http://localhost:5173` by default.

## Features implemented
- Book list pulled from `Bookstore.sqlite` (table: `Books`)
- Pagination: 5 books per page by default, user-selectable page size
- Sorting: toggle sort order by book `Title` (A-Z / Z-A)
- Category filtering (ex: Biography, Self-Help, etc.) with pagination updated to match selected category
- Shopping cart support:
  - Add books to cart from the book list
  - Update quantity (+/-), line subtotal, subtotal, and total
  - Cart data persists for the browser session while navigating
  - Continue Shopping returns users to the same browsing context/page
- Cart summary shown on the main book list page
- Bootstrap layout using the Grid system
- Additional Bootstrap features used beyond class demos:
  - Offcanvas cart panel
  - Tooltips on action buttons

## Notes for TAs
- `Bookstore.sqlite` is committed in the repo root; you do not need to download it.
- `node_modules` are ignored via `.gitignore` so you don't have to commit or transfer them.
- For the Bootstrap rubric item, the Learning Suite comment should mention:
  - Grid classes used for page layout (`row`, `col-12`, `col-lg-9`, `col-lg-3`)
  - Offcanvas cart (`offcanvas`, `offcanvas-end`)
  - Tooltip attributes (`data-bs-toggle="tooltip"`, `data-bs-placement="top"`)

