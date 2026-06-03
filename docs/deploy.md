# Deploy

The application is deployed on [Render](https://render.com).

## Production URLs

- **Frontend**: `https://grupo1-kritik.onrender.com`
- **Backend**: `https://grupo1-kritik-backend.onrender.com`

## How it works

Every push to `main` triggers an automatic redeploy on Render.

## Environment variables on Render

These variables must be configured in the Render dashboard:

| Variable | Description |
|----------|-------------|
| `PORT` | `8080` |
| `GIN_MODE` | `release` |
| `JWT_SECRET` | Secret key for signing JWTs (different from local) |
| `SUPABASE_URL` | Production Supabase project URL |
| `SUPABASE_KEY` | Production Supabase API key |
| `CORS_ALLOW_ORIGIN` | `https://grupo1-kritik.onrender.com` |

## CI/CD

The repository includes four GitHub Actions workflows defined in `.github/workflows/`:

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `backend.yml` | Push/PR touching `backend/`, `go.mod` or `.golangci.yml` | golangci-lint → `go test -v -race` → `go build` |
| `frontend.yml` | Push/PR touching `frontend/` | ESLint → `tsc --noEmit` → `npm run test` → `npm run build` → uploads `dist/` |
| `e2e.yml` | Manual (`workflow_dispatch`) | Build frontend + start backend + Playwright chromium, 4 workers |
| `codeql.yml` | Weekly + push/PR to main | CodeQL security analysis for Go and JS/TS |

The backend and frontend workflows run automatically on every PR. **Do not merge if any fails.**

## Verification

```bash
curl https://grupo1-kritik-backend.onrender.com/health
# {"status":"ok"}
```
