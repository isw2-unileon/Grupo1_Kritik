# Contributing to Kritik

A short reference to keep the codebase coherent. Read this before adding a new
endpoint, model, or page so we don't repeat the desync bugs we've already had.

The project layout lives in the [README](README.md#project-structure).

## JSON Casing — Important

The casing convention is **asymmetric** and has caused real bugs already.

- **Request bodies sent from frontend → backend use `snake_case`**: `user_name`,
  `product_name`, `recommended`. This is what handler request structs declare
  with their `json:"…"` tags (e.g. `CreateReviewRequest`).
- **Response bodies and stored DB columns use `PascalCase`**: `Email`, `UserName`,
  `ProductName`, `Recommended`. This is what the `bd` model structs declare.

When you add a field, the four places to update together are:
1. Supabase column (matching the PascalCase JSON tag).
2. Go model in `backend/bd/*.go` (`PascalCase` JSON tag).
3. Go handler request struct in `backend/internal/handlers/*.go` (`snake_case`
   JSON tag).
4. Frontend TypeScript interface in `frontend/src/services/api.ts` (`snake_case`
   for outgoing payloads, `PascalCase` for incoming responses to match the DB).

## Auth Pattern

- `auth.GenerateToken` issues a JWT carrying `user_id` and `email`.
- `middleware.RequireAuth` validates the `Authorization: Bearer <token>` header
  and puts the user id in the Gin context (`c.GetInt("userID")`).
- Handlers that need the author look the user up by id to obtain the username
  (see `CreateReviewHandler`). The JWT itself does **not** carry the username.

## Data Access

- All Supabase calls live in `backend/bd/`. Handlers must not import the
  Supabase client directly.
- Functions return `(*T, error)` for single rows or `([]T, error)` for lists,
  and treat "not found" as an explicit error.
- Passwords are always bcrypt-hashed via `bd.HashPassword` before insert; compared
  via `bd.VerifyPassword` on login. Never store, log, or return the raw password.

## Frontend

- Page-level components live in `src/pages/` and map 1:1 to routes.
- Reusable UI in `src/components/`, global state in `src/contexts/`.
- All HTTP goes through `src/services/api.ts` — pages should not call `fetch`
  directly. The `authedFetch` helper attaches the stored JWT automatically.
- Pure helpers (no React, no I/O) belong in `src/utils/`.

## Logging

Backend uses `slog` with structured key/value pairs:
- `slog.Info` — normal events (login success, review created).
- `slog.Warn` — client-caused failures (bad input, wrong password).
- `slog.Error` — unexpected server failures (DB down, token generation failed).

## Commits

Follow the existing convention: `fix #<issue>: …` or `feature #<issue>: …` when
the change closes or advances a GitHub issue. Use `docs: …` for documentation-
only changes that don't tie to a specific feature issue.
