# Mission 11 - Online Bookstore (ASP.NET Core API + React)

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

## Notes for TAs
- `Bookstore.sqlite` is committed in the repo root; you do not need to download it.
- `node_modules` are ignored via `.gitignore` so you don't have to commit or transfer them.

