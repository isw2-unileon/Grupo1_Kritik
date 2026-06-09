# Database Schema

The backend talks to Supabase (PostgreSQL). There are four tables in active
use: `Users`, `Product`, `Review` and `Followers`.

## `Users`
Account data. Passwords are bcrypt-hashed before insert.

| Column     | Type    | Constraints / Notes                                       |
|------------|---------|-----------------------------------------------------------|
| `id`       | bigint  | Primary key, identity                                     |
| `Name`     | text    | NOT NULL                                                  |
| `Surname`  | text    | NOT NULL                                                  |
| `UserName` | text    | NOT NULL, unique                                          |
| `Email`    | text    | NOT NULL, unique, format-checked (email regex)            |
| `Birth`    | date    | NOT NULL, must be in the past (`Birth < CURRENT_DATE`)    |
| `Password` | text    | NOT NULL, bcrypt hash, never returned by the API          |
| `Image`    | text    | Nullable, URL to avatar image                             |
| `IsAdmin`  | boolean | NOT NULL, default `false`                                 |

## `Product`
Catalogue of items a review can target.

| Column         | Type     | Constraints / Notes                                  |
|----------------|----------|------------------------------------------------------|
| `id`           | bigint   | Primary key, identity                                |
| `Name`         | text     | NOT NULL, unique                                     |
| `Type`         | text     | NOT NULL — category (game, book, film…)              |
| `Genre`        | text[]   | NOT NULL — array of genres                           |
| `Release`      | date     | NOT NULL, default `now()`                            |
| `Description`  | text     | Nullable                                             |
| `AverageGrade` | smallint | NOT NULL, default `0` — **maintained by a trigger**  |
| `Image`        | text     | Nullable, URL to image                               |

`AverageGrade` is **not** entered by hand. The trigger `trg_update_product_grade`
recomputes it on every `INSERT` / `UPDATE` / `DELETE` of a `Review`
(function `update_product_average_grade()`), derived from the yes/no verdicts.

## `Review`
A review written by a `User` about a `Product`.

| Column        | Type   | Constraints / Notes                            |
|---------------|--------|------------------------------------------------|
| `id`          | bigint | Primary key, identity                          |
| `Recommended` | bool   | NOT NULL — whether the author recommends it    |
| `Description` | text   | NOT NULL — body of the review                  |
| `UserId`      | bigint | NOT NULL, FK → `Users.id` (author)             |
| `ProductId`   | bigint | NOT NULL, FK → `Product.id`                    |

- **Unique `(UserId, ProductId)`** — a user can review a given product only once.
- There is intentionally **no `Rating` column**: the yes/no recommendation is the
  only per-review verdict. The aggregate lives in `Product.AverageGrade`, kept up
  to date by the trigger above. Do not reintroduce `Rating` without coordinating a
  schema migration and matching backend/frontend changes.

## `Followers`
**Directional follow**: a `Fan` follows an `Influencer`. The "recommendations from
your circle" feature is built on this table.

| Column       | Type   | Constraints / Notes                          |
|--------------|--------|----------------------------------------------|
| `id`         | bigint | Primary key, identity                        |
| `Fan`        | bigint | NOT NULL, FK → `Users.id` (the follower)     |
| `Influencer` | bigint | NOT NULL, FK → `Users.id` (the followed)     |

- Check `Fan <> Influencer` — a user cannot follow themselves.

> **Note on constraint names.** Some constraints carry names left over from an
> earlier "friendship" design: the `Followers` primary key is named
> `Friend_Relations_pkey` and the self-follow check is `chk_orden_amigos`; the
> `Review` primary key is named `Content_pkey`. They are harmless, but can be
> renamed in a future migration for clarity.
