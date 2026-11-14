# Quick Reference

## Commands

- `npm ci` — install locked dependencies
- `npm run dev` — local Astro server
- `npm run check` — Astro type and diagnostics check
- `npm run lint` — JavaScript syntax checks for CMS/API scripts
- `npm test` — unit/API helper tests
- `npm run build` — static site build
- `npm run hash-password` — create a hidden-input scrypt password hash

## CMS deployment

1. Deploy the repository to Vercel and configure server values from `.env.example` plus a managed Redis-compatible store for durable sessions/rate limiting.
2. Set GitHub Actions variable `PUBLIC_API_BASE_URL` to the Vercel origin.
3. Push through the protected workflow and verify the Pages deployment. Current release status is in `docs/PRODUCTION_RELEASE_REPORT.md`.
4. Use `/admin/`, log in, edit content, and wait for the Pages workflow.

New academic/personal knowledge entries default to drafts. Private entries are disabled until private storage exists. Do not configure GitHub PATs in the browser. See `docs/ADMIN_USER_GUIDE.md` and `docs/DEPLOYMENT.md`.
