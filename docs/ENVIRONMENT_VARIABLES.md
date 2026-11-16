# Environment Variables

| Name | Public/secret | Where | Purpose |
|---|---|---|---|
| `PUBLIC_API_BASE_URL` | Public | GitHub Actions repository variable and local build | Vercel API origin embedded in static admin client. |
| `GITHUB_TOKEN` | Secret | Vercel | Server-only repository contents access token. |
| `GITHUB_OWNER` | Server config | Vercel | Repository owner (`Tanmoy095`). |
| `GITHUB_REPO` | Server config | Vercel | Content repository (`Tanmoy095.github.io`). |
| `GITHUB_BRANCH` | Server config | Vercel | Branch used by content API (`main`). |
| `ADMIN_EMAIL` | Secret/config | Vercel | Login identity. |
| `ADMIN_PASSWORD_HASH` | Secret | Vercel | Encoded scrypt password hash. |
| `ADMIN_SESSION_SECRET` | Secret | Vercel | Independent HMAC signing key, 32+ characters. |
| `CMS_ALLOWED_ORIGINS` | Server config | Vercel | Comma-separated exact browser origins; defaults to Pages and local Astro origins. |
| `UPSTASH_REDIS_REST_URL` | Secret/config | Vercel | Upstash Redis REST endpoint for shared login throttling, revocation, and private knowledge. |
| `UPSTASH_REDIS_REST_TOKEN` | Secret | Vercel | Upstash REST bearer token. Keep server side; never put it in a `PUBLIC_` variable. |

Never put server values in GitHub Pages build variables, browser code, `.env.example`, or documentation.

The API now uses the shared Redis store for atomic login throttling, logout revocation, and private knowledge entries. Set both Upstash variables in Vercel before using the CMS; the API fails closed when Redis is missing or unavailable. Production readiness still requires verifying these values and exercising login, logout, and CRUD against the deployed service.
