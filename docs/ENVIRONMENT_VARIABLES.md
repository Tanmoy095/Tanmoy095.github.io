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

Never put server values in GitHub Pages build variables, browser code, `.env.example`, or documentation.

The current API code still uses process-local rate limits and stateless signed sessions. Redis support is not implemented or configured in this release, so logout cannot revoke a copied bearer token and rate limits may reset between serverless invocations. A managed Redis-compatible URL and token will be required when this is implemented. Do not treat the API as production-ready until this is resolved and verified.
