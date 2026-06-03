# Getting Started

Guide to set up the project locally.

## Prerequisites

- [Go](https://go.dev/dl/) 1.25+
- [Node.js](https://nodejs.org/) 22+
- A Supabase account and project

## Initial setup

### 1. Clone the repository

```bash
# SSH (recommended)
git clone git@github.com:isw2-unileon/Grupo1_Kritik.git

# HTTPS
git clone https://github.com/isw2-unileon/Grupo1_Kritik.git

cd Grupo1_Kritik
```

### 2. Set up environment variables

Copy the environment file and fill in the Supabase credentials:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with the real project credentials (ask the team if you don't have them):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-api-key
```

> The `.env` file is in `.gitignore` — **it is never committed to the repository**.

### 3. Install dependencies

```bash
make install
```

This installs:
- **Air** (hot reload for Go)
- **golangci-lint** (Go linter)
- Go dependencies (`go mod download`)
- Frontend dependencies (`npm ci` in `frontend/`)
- E2E dependencies (`npm ci` in `e2e/`)

### 4. Run locally

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 8080)
make run-backend

# Terminal 2 — Frontend (port 5173)
make run-frontend
```

The backend starts with Air (hot reload on changes in `backend/`).
The frontend starts with Vite and proxies `/api`, `/auth` and `/health` to the backend.

Open [http://localhost:5173](http://localhost:5173).

## Available commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make run-backend` | Backend with hot reload on port 8080 |
| `make run-frontend` | Frontend dev server on port 5173 |
| `make test` | Run backend and frontend tests |
| `make lint` | Run backend and frontend linters |
| `make e2e` | Run Playwright E2E tests (requires backend+frontend running) |
| `make build-backend` | Compile the backend binary |
| `make build-frontend` | Compile the frontend for production |

## Tests

```bash
# All tests
make test

# Backend only
cd backend && go test -v -race ./...

# Frontend only (with watcher)
cd frontend && npm run test
cd frontend && npm run test:watch

# Typecheck standalone
cd frontend && npx tsc --noEmit

# E2E with visible browser
cd e2e && npx playwright test --headed
```

## Reference docs

- [API Reference](api.md) — endpoints, request/response, errors
- [Database Schema](schema.md) — tables, columns, constraints
- [Deploy](deploy.md) — Render deployment, CI/CD, environment variables
- [Contributing Guide](../CONTRIBUTING.md) — code conventions, JSON casing, auth pattern, commits
- [Monorepo architecture](monorepo.md) — structure and rationale
