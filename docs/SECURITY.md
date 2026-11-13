# Security

- Store `GITHUB_TOKEN`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` and `ADMIN_EMAIL` only in Vercel server environment settings. Never use a `PUBLIC_` prefix for secrets.
- Create a hash with `npm run hash-password`; it uses scrypt and prints only the encoded hash. Use a long unique password.
- Generate `ADMIN_SESSION_SECRET` independently with a cryptographically secure generator; use at least 32 random characters. Rotating it invalidates all outstanding signed sessions.
- The CMS uses HTTPS bearer sessions with 30-minute expiration. The token is kept in tab-scoped `sessionStorage`, never localStorage. The current stateless session design cannot revoke one token server-side immediately; expiry or secret rotation invalidates it.
- API CORS uses exact origins: the public Pages origin and local Astro development origins. Set `CMS_ALLOWED_ORIGINS` explicitly when needed.
- Writes require a valid signed bearer token and an allowlisted path. Updates/deletes require GitHub file SHA values. Image uploads accept bounded base64 image formats and safe filenames.
- Login rate limiting is process-local and may reset between serverless invocations. Use Vercel firewall/rate limiting or a shared store for robust production throttling.
- Rotate/revoke repository tokens in GitHub and update Vercel promptly. Review Git history before publishing; never commit `.env` files or credentials.
