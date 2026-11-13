# Architecture

## Frontend and content

Astro 4 builds the public site as static HTML with Tailwind styling. Profile and project data live in `src/data/*.json`; articles, engineering journal entries and ADRs live in Astro content collections under `src/content/`. GitHub is the source of truth: a successful CMS write commits repository content and GitHub Actions rebuilds Pages.

## API and CMS

The admin UI is a static Astro page. It sends requests to `PUBLIC_API_BASE_URL`, a public Vercel API origin. Vercel runs `api/auth/*` and `api/github/*`; the GitHub token remains server-side. The API proxy only permits profile/projects JSON, Markdown in blog/learning collections, approved media directories and `public/cv.pdf`.

## Authentication

Login compares the submitted password with an `scrypt` hash in `ADMIN_PASSWORD_HASH`. Successful login returns a signed bearer session with a 30-minute expiry. The browser keeps it in `sessionStorage` for the current tab and sends it only in Authorization headers. Signing requires a separate 32+ character `ADMIN_SESSION_SECRET`. Logout clears the browser token. Because the current bearer token is stateless, server-side immediate revocation is not available without adding a shared session store; rotation of `ADMIN_SESSION_SECRET` invalidates all sessions. Keep the short expiry and rotate after suspected exposure.

## Persistence and hosting

GitHub Contents API writes use each file's SHA for updates/deletes; commits trigger the Pages build workflow. GitHub Pages serves the public site at `https://tanmoy095.github.io/`. Vercel serves the API. The public hostname is retained. Vercel API credentials must be configured separately from the Pages build.

## Request flow

1. Static admin build embeds only the API base URL.
2. Login request goes to Vercel over HTTPS and receives a signed session token.
3. Read/write/upload calls include the bearer token.
4. Vercel checks session and path, then uses its GitHub token to access the configured repository.
5. GitHub commit triggers site rebuild; newly published content appears after successful Pages deployment.
