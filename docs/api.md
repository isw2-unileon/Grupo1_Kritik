# API Reference

All request and response bodies are JSON. Endpoints under `/api/*` (except
`/api/hello`) require a JWT bearer token: `Authorization: Bearer <token>`. The
token is issued by `POST /auth/login` and carries the user's id and email.

All non-2xx responses use the same error envelope:

```json
{ "error": "human-readable message" }
```

## Public

### `GET /health`
Liveness probe. Returns `{ "status": "ok" }`.

### `GET /api/hello`
Sample endpoint kept from the template. Safe to remove once no longer used.

### `POST /auth/register`
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

### `POST /auth/login`
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

## Authenticated

These endpoints require `Authorization: Bearer <token>`.

### `GET /api/products?q=<query>`
Searches products by partial name match (case-insensitive). Empty `q` returns
`[]`.

Response `200 OK`:
```json
[ { "Name": "Hollow Knight" }, { "Name": "Hades" } ]
```

### `POST /api/reviews`
Publishes a review by the authenticated user about an existing product. The
review title (`title`) is stored as the unique key — two reviews cannot share a
title.

Request:
```json
{
  "title": "Plataformas y atmósfera al máximo",
  "product_id": 42,
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
- `400 Bad Request` — missing/empty `title`, `product_id`, or `description`.
- `401 Unauthorized` — missing/invalid token.
- `500 Internal Server Error` — duplicate title, unknown product, or DB failure.

### `GET /api/reviews`
Returns the reviews written by the authenticated user.

Response `200 OK` — array of `Review` objects (same shape as the create
response).
