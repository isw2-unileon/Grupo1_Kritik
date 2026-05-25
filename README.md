# Monorepo Template: Go + React/Vite

A monorepo template for full-stack applications with a **Go** backend and a **React + TypeScript + Vite** frontend.

## Project Structure

```text
├── backend/                  Go API server (Gin)
│   ├── cmd/server/           Entry point — wires routes and middleware
│   ├── internal/
│   │   ├── auth/             JWT generation and validation
│   │   ├── config/           Environment config loader
│   │   ├── handlers/         HTTP handlers (auth, reviews, products)
│   │   └── middleware/       Gin middlewares (RequireAuth, …)
│   └── bd/                   Supabase client + data-access layer
│
├── frontend/                 React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── pages/            Route-level components
│       ├── components/       Reusable UI components
│       ├── contexts/         React contexts (AuthContext)
│       ├── services/api.ts   Typed HTTP client to the backend
│       └── utils/            Pure helpers (validation, …)
│
├── e2e/                      Playwright E2E tests
├── .github/workflows/        CI/CD pipelines
└── Makefile                  Dev commands
```

## Prerequisites

- [Go](https://go.dev/dl/) 1.24+
- [Node.js](https://nodejs.org/) 22+

## Getting Started

```bash
make install

# Terminal 1
make run-backend    # port 8080

# Terminal 2
make run-frontend   # port 5173
```

The Vite dev server proxies `/api` requests to the backend.

## Commands

| Command              | Description                     |
|----------------------|---------------------------------|
| `make install`       | Install all dependencies        |
| `make run-backend`   | Backend with hot reload (Air)   |
| `make run-frontend`  | Frontend dev server (Vite)      |
| `make test`          | Run all tests                   |
| `make lint`          | Run all linters                 |
| `make e2e`           | Run Playwright E2E tests        |

## API

All request and response bodies are JSON. Endpoints under `/api/*` (except `/api/hello`)
require a JWT bearer token: `Authorization: Bearer <token>`. The token is issued by
`POST /auth/login` and carries the user's id and email.

### Public

#### `GET /health`
Liveness probe. Returns `{ "status": "ok" }`.

#### `GET /api/hello`
Sample endpoint kept from the template. Safe to remove once no longer used.

#### `POST /auth/register`
Creates a new user. Password is hashed with bcrypt before being stored.

Request:
```json
{
  "email": "ana@example.com",
  "password": "secret123",
  "name": "Ana",
  "surname": "Pérez",
  "user_name": "ana",
  "birth": "2000-01-31"
}
```
`email`, `password`, `name` are required; the rest are optional.

Responses:
- `201 Created` — returns the created user (without the password):
  ```json
  { "id": 1, "email": "ana@example.com", "name": "Ana", "surname": "Pérez", "user_name": "ana" }
  ```
- `400 Bad Request` — missing required fields.
- `409 Conflict` — email or username already taken.

#### `POST /auth/login`
Authenticates a user by **either** email or username, plus password.

Request (one of):
```json
{ "email": "ana@example.com", "password": "secret123" }
```
```json
{ "user_name": "ana", "password": "secret123" }
```

Responses:
- `200 OK`:
  ```json
  {
    "token": "<jwt>",
    "user": { "id": 1, "email": "ana@example.com", "name": "Ana", "surname": "Pérez", "user_name": "ana" }
  }
  ```
- `400 Bad Request` — missing credentials.
- `401 Unauthorized` — user not found or wrong password.

### Authenticated (`Authorization: Bearer <token>` required)

#### `GET /api/products?q=<query>`
Searches products by partial name match (case-insensitive). Empty `q` returns `[]`.

Response `200 OK`:
```json
[ { "Name": "Hollow Knight" }, { "Name": "Hades" } ]
```

#### `POST /api/reviews`
Publishes a review by the authenticated user about an existing product. The review
title (`title`) is stored as the unique key — two reviews cannot share a title.

Request:
```json
{
  "title": "Plataformas y atmósfera al máximo",
  "product_name": "Hollow Knight",
  "description": "Una experiencia preciosa, controles impecables.",
  "recommended": true
}
```

Responses:
- `201 Created` — returns the stored review:
  ```json
  {
    "id": 42,
    "Name": "Plataformas y atmósfera al máximo",
    "Description": "Una experiencia preciosa, controles impecables.",
    "Recommended": true,
    "ProductName": "Hollow Knight",
    "UserName": "ana"
  }
  ```
- `400 Bad Request` — missing/empty `title`, `product_name`, or `description`.
- `401 Unauthorized` — missing/invalid token.
- `500 Internal Server Error` — duplicate title, unknown product, or DB failure.

#### `GET /api/reviews`
Returns the reviews written by the authenticated user.

Response `200 OK` — array of `Review` objects (same shape as the create response).

### Error format

All non-2xx responses use the same envelope:
```json
{ "error": "human-readable message" }
```

## Database Schema

The backend talks to Supabase. There are three tables in active use plus one
(`Content`) defined in code but not wired to any current handler.

### `Users`
Stores account data. Passwords are bcrypt-hashed before insert.

| Column     | Type    | Notes                                |
|------------|---------|--------------------------------------|
| `id`       | int     | Primary key, auto-increment          |
| `Email`    | text    | Unique, required                     |
| `Name`     | text    | Required                             |
| `Password` | text    | Bcrypt hash, never returned by the API |
| `Surname`  | text    | Optional                             |
| `UserName` | text    | Unique when present, optional        |
| `Birth`    | text    | Optional, ISO date string            |

### `Product`
Catalogue of items a review can target. Reviews reference products **by name**, so
`Name` must be unique.

| Column | Type | Notes                       |
|--------|------|-----------------------------|
| `Name` | text | Primary identifier (unique) |

> The Go model only maps `Name`; additional columns may exist in Supabase and will
> simply be ignored during decode.

### `Review`
A review written by a `User` about a `Product`. `Name` is the review title and is
unique across the table — two reviews cannot share a title.

| Column        | Type | Notes                                                        |
|---------------|------|--------------------------------------------------------------|
| `id`          | int  | Primary key, auto-increment                                  |
| `Name`        | text | Review title, unique                                         |
| `Description` | text | Body of the review                                           |
| `Recommended` | bool | Whether the author recommends the product                    |
| `ProductName` | text | Foreign reference into `Product.Name`                        |
| `UserName`    | text | Foreign reference into `Users.UserName` (author)             |

> There is intentionally **no `Rating` column**. The "yes/no" recommendation is the
> only verdict the product exposes. Do not reintroduce `Rating` without coordinating
> a schema migration and matching backend/frontend changes.

### `Content` (defined, not used)
Mapped in [`backend/bd/supabase.go`](backend/bd/supabase.go) (`GetContentByID`,
`AddContent`, etc.) but no HTTP handler exposes it today. Treat as reserved for
future work; revisit before adding new features so we don't grow two parallel models.

## Repo Conventions

A short reference to keep the codebase coherent. Read this before adding a new
endpoint or model so we don't repeat the desync bugs we've already had.

### JSON casing — important
The casing convention is **asymmetric** and has caused real bugs already.

- **Request bodies sent from frontend → backend use `snake_case`**: `user_name`,
  `product_name`, `recommended`. This is what handler request structs declare with
  their `json:"…"` tags (e.g. `CreateReviewRequest`).
- **Response bodies and stored DB columns use `PascalCase`**: `Email`, `UserName`,
  `ProductName`, `Recommended`. This is what the `bd` model structs declare.

When you add a field, the four places to update together are:
1. Supabase column (matching the PascalCase JSON tag).
2. Go model in `backend/bd/*.go` (`PascalCase` JSON tag).
3. Go handler request struct in `backend/internal/handlers/*.go` (`snake_case` JSON tag).
4. Frontend TypeScript interface in `frontend/src/services/api.ts` (use `snake_case`
   for outgoing payloads, `PascalCase` for incoming responses to match the DB).

### Auth pattern
- `auth.GenerateToken` issues a JWT carrying `user_id` and `email`.
- `middleware.RequireAuth` validates the `Authorization: Bearer <token>` header and
  puts the user id in the Gin context (`c.GetInt("userID")`).
- Handlers that need the author look the user up by id to obtain the username
  (see `CreateReviewHandler`). The JWT itself does **not** carry the username.

### Data access
- All Supabase calls live in `backend/bd/`. Handlers must not import the supabase
  client directly.
- Functions return `(*T, error)` for single rows or `([]T, error)` for lists, and
  treat "not found" as an explicit error.
- Passwords are always bcrypt-hashed via `bd.HashPassword` before insert; compared
  via `bd.VerifyPassword` on login. Never store, log, or return the raw password.

### Frontend
- Page-level components live in `src/pages/` and map 1:1 to routes.
- Reusable UI in `src/components/`, global state in `src/contexts/`.
- All HTTP goes through `src/services/api.ts` — pages should not call `fetch`
  directly. The `authedFetch` helper attaches the stored JWT automatically.
- Pure helpers (no React, no I/O) belong in `src/utils/`.

### Logging
Backend uses `slog` with structured key/value pairs. Use `slog.Info` for normal
events, `slog.Warn` for client-caused failures (bad input, wrong password),
`slog.Error` for unexpected server failures.
