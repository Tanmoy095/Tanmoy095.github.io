# Security

## Current implementation limits

- Sessions are expiring HMAC-signed bearer tokens. Redis stores revocations until the token expires; token validation fails closed if Redis is unavailable.
- Login throttling is shared through an atomic Redis counter with a 15-minute window.
- GitHub is the public content store. Draft Markdown is omitted from generated pages, but source remains visible in the public repository. Private knowledge entries are stored in the authenticated Redis store and are not written to GitHub.
- Image uploads are re-encoded by Sharp without preserving EXIF/GPS. PDFs are size bounded and checked for a PDF signature.

- Store `GITHUB_TOKEN`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` and `ADMIN_EMAIL` only in Vercel server environment settings. Never use a `PUBLIC_` prefix for secrets.
- Create a hash with `npm run hash-password`; it uses scrypt and prints only the encoded hash. Use a long unique password.
- Generate `ADMIN_SESSION_SECRET` independently with a cryptographically secure generator; use at least 32 random characters. Rotating it invalidates all outstanding signed sessions.
- The CMS uses HTTPS bearer sessions with 30-minute expiration. The token is kept in tab-scoped `sessionStorage`, never localStorage. Logout records the token nonce in Redis until its expiry.
- API CORS uses exact origins: the public Pages origin and local Astro development origins. Set `CMS_ALLOWED_ORIGINS` explicitly when needed.
- Writes require a valid signed bearer token and an allowlisted path. Updates/deletes require GitHub file SHA values. Image uploads accept bounded base64 image formats and safe filenames.
- Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel. Missing or unavailable Redis disables authentication and protected API operations.
- Rotate/revoke repository tokens in GitHub and update Vercel promptly. Review Git history before publishing; never commit `.env` files or credentials.
