# Database Schema

The backend talks to Supabase. There are four tables in active use:

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
| `Image`    | text    | Optional, URL to avatar image          |

## `Product`
Catalogue of items a review can target.

| Column        | Type    | Notes                          |
|---------------|---------|--------------------------------|
| `id`          | int     | Primary key, auto-increment    |
| `Name`        | text    | Unique, required               |
| `Type`        | text    | Category (game, book, film…)   |
| `AverageGrade`| int     | Average user rating            |
| `Description` | text    | Product description            |
| `Release`     | date    | Optional, ISO date             |
| `Genre`       | text[]  | Array of genres                |
| `Image`       | text    | Optional, URL to image         |

## `Review`
A review written by a `User` about a `Product`.

| Column        | Type | Notes                                            |
|---------------|------|--------------------------------------------------|
| `id`          | int  | Primary key, auto-increment                      |
| `Recommended` | bool | Whether the author recommends the product        |
| `Description` | text | Body of the review                               |
| `ProductId`   | int  | Foreign reference into `Product.id`              |
| `UserId`      | int  | Foreign reference into `Users.id` (author)       |

> There is intentionally **no `Rating` column**. The "yes/no" recommendation is
> the only verdict the product exposes. Do not reintroduce `Rating` without
> coordinating a schema migration and matching backend/frontend changes.

## `Friend_Relations`
Represents a friendship between two users. Each row is a bidirectional relation
— no separate "friend request" model exists yet.

| Column   | Type | Notes                                      |
|----------|------|--------------------------------------------|
| `id`     | int  | Primary key, auto-increment                |
| `Friend1`| int  | User ID (one side of the relation)         |
| `Friend2`| int  | User ID (the other side of the relation)   |
