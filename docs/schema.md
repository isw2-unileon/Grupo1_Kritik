# Database Schema

The backend talks to Supabase. There are three tables in active use plus one
(`Content`) defined in code but not wired to any current handler.

## `Users`
Stores account data. Passwords are bcrypt-hashed before insert.

| Column     | Type    | Notes                                  |
|------------|---------|----------------------------------------|
| `id`       | int     | Primary key, auto-increment            |
| `Email`    | text    | Unique, required                       |
| `Name`     | text    | Required                               |
| `Password` | text    | Bcrypt hash, never returned by the API |
| `Surname`  | text    | Optional                               |
| `UserName` | text    | Unique when present, optional          |
| `Birth`    | text    | Optional, ISO date string              |

## `Product`
Catalogue of items a review can target. Reviews reference products **by name**,
so `Name` must be unique.

| Column | Type | Notes                       |
|--------|------|-----------------------------|
| `Name` | text | Primary identifier (unique) |

> The Go model only maps `Name`; additional columns may exist in Supabase and
> will simply be ignored during decode.

## `Review`
A review written by a `User` about a `Product`. `Name` is the review title and
is unique across the table — two reviews cannot share a title.

| Column        | Type | Notes                                            |
|---------------|------|--------------------------------------------------|
| `id`          | int  | Primary key, auto-increment                      |
| `Name`        | text | Review title, unique                             |
| `Description` | text | Body of the review                               |
| `Recommended` | bool | Whether the author recommends the product        |
| `ProductName` | text | Foreign reference into `Product.Name`            |
| `UserName`    | text | Foreign reference into `Users.UserName` (author) |

> There is intentionally **no `Rating` column**. The "yes/no" recommendation is
> the only verdict the product exposes. Do not reintroduce `Rating` without
> coordinating a schema migration and matching backend/frontend changes.

## `Content` (defined, not used)
Mapped in [`backend/bd/supabase.go`](../backend/bd/supabase.go) (`GetContentByID`,
`AddContent`, etc.) but no HTTP handler exposes it today. Treat as reserved for
future work; revisit before adding new features so we don't grow two parallel
models.
