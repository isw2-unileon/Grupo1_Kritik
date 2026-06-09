# Kritik

A small reviews platform: users register, search products (games, books,
series, films…), and publish a short review with a yes/no recommendation. They
can browse their own reviews from a personal dashboard.

Built as a monorepo with a **Go (Gin)** backend, a **React + TypeScript + Vite**
frontend, and a **Supabase** database.

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
├── docs/                     Reference documentation (API, schema, ADRs)
├── .github/workflows/        CI/CD pipelines
└── Makefile                  Dev commands
```

## Prerequisites

- [Go](https://go.dev/dl/) 1.25+
- [Node.js](https://nodejs.org/) 22+
- A Supabase project (URL + API key) configured in `backend/.env`

## Getting Started

### Linux
```bash
make install

# Terminal 1
make run-backend    # port 8080

# Terminal 2
make run-frontend   # port 5173
```

### Windows
```bash
make install

# Terminal 1
cd backend/cmd/server
go run main.go           # port 8080

# Terminal 2
make run-frontend        # port 5173
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` requests to
the Go backend.

For the full setup walk-through see [`docs/getting-started.md`](docs/getting-started.md).

## Commands

| Command              | Description                     |
|----------------------|---------------------------------|
| `make install`       | Install all dependencies        |
| `make run-backend`   | Backend with hot reload (Air)   |
| `make run-frontend`  | Frontend dev server (Vite)      |
| `make test`          | Run all tests                   |
| `make lint`          | Run all linters                 |
| `make e2e`           | Run Playwright E2E tests        |

## Documentation

- [API reference](docs/api.md) — endpoints, request/response examples, error
  format.
- [Database schema](docs/schema.md) — tables, columns, constraints.
- [Contributing guide](CONTRIBUTING.md) — project structure, conventions, auth
  pattern, commit style. Read before opening a PR.
- [Architecture decisions](docs/adr/) — record of important design choices.
- [Deploy](docs/deploy.md) — deployment to Render, CI/CD, environment variables.
