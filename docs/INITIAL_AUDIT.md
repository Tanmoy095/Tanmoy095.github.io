# Initial Repository Audit

## Follow-up release audit (2026-11-14)

Verified prior commit `f1180ded4d9d7246f2ec2cbd5987053d373c2cbe`, then pushed feature `462baf415e1f0434abd16c81f6d8600b78f08a36` and release follow-up `bd9c8a719cafa0b01721747634c5b2a2b65a6bbc` to `main`. GitHub Actions annotations report an account billing lock; the runners did not start. Vercel CLI/project metadata and API origin were absent. See `PRODUCTION_RELEASE_REPORT.md`.

## Inspection snapshot

- Branch at start: `main`; HEAD `442f251` (`cms: publish blog building-golden-path-ai-ready-microservices`).
- Initial `git status --short --branch`: clean and aligned with `origin/main`.
- Creating `codex/portfolio-cms-rebuild` was blocked because `.git` is read-only in this workspace. No existing commit or branch was changed.
- Repository: Astro 4 static site, Tailwind, JSON profile/projects, Astro content collections, Vercel-style `api/` handlers, GitHub Pages and Vercel GitHub Actions workflows.
- No CV, application test suite, API test suite, CMS browser test setup, or verified project source repositories are included in the inspected repository.

## Findings and root causes

1. **CMS requests targeted the wrong host.** `public/admin-cms.js` hard-coded `/api/...`, while the public origin is GitHub Pages. GitHub Pages cannot run these handlers. API calls therefore failed from the live site.
2. **Authentication silently degraded to client-side SHA-256.** `admin.astro` bundled a default hash (`admin123`) and public email. If the same-origin API was unavailable, JavaScript accepted a browser-side password check and exposed a direct GitHub PAT settings screen. This was not authentication for write operations.
3. **Server password/session controls were weak.** `api/_lib/auth.js` compared a plaintext environment password, allowed a fallback signing key, and issued eight-hour stateless sessions. Logout only cleared a cookie; bearer sessions were not persisted or revocable server-side.
4. **GitHub proxy authorization was broad.** Any authenticated session could read, write, or delete arbitrary paths in the configured repository. Conflicts/errors were collapsed into generic 500 responses.
5. **Image handling was permissive.** The upload handler accepted arbitrary base64 payloads and filenames; any GitHub read error was interpreted as “file absent,” which could cause misleading retries or overwrite issues.
6. **Deployment settings conflicted.** The Pages build was given `PUBLIC_ADMIN_PASSWORD_HASH`; the Vercel deployment workflow passed several secrets and public auth settings. `vercel.json` had wildcard CORS and a redundant API rewrite. GitHub Pages cannot serve the API.
7. **Content credibility issues.** The profile and homepage claimed Senior/Staff roles, years of experience, production systems and project scale without supporting evidence in this repository. Project descriptions presented aspirational scope as production-grade status.
8. **CMS data reload/conflict risk.** Edits depend on GitHub SHA values and client-side state. Slug rename operations delete then create in separate commits; concurrent edits can conflict. Error surfaces did not consistently distinguish these cases.
9. **Outdated vulnerable dependencies.** The initial Astro 4 dependency tree had a critical Astro advisory and additional transitive vulnerabilities. Upgrading within Astro and retaining Tailwind required an Astro 7 content-layer and Tailwind Vite migration.

## Security and deployment risks

- Public password hash and insecure default credential were emitted into the static page.
- Browser-side GitHub PAT could be stored in localStorage and used for direct repository writes.
- Wildcard CORS allowed any site to call the API (bearer token still required, but the policy was overbroad).
- No login throttling, upload size/format validation, or content path allowlist.
- No environment status distinction was surfaced to the dashboard.
- Current deployment requires a Vercel project with the repository API functions and configured server environment; Pages alone cannot satisfy CMS requirements.
- GitHub Actions deploys Pages on pushes to `main`; deployment credentials/status are not available to this local audit.

## Proposed changes and implementation

- Centralize CMS calls on `PUBLIC_API_BASE_URL`; remove every client-side password/PAT fallback.
- Use scrypt password hashes, separate strong signing secret, short bearer expiry, throttling and safe errors.
- Add exact origin CORS/preflight behavior, allowlisted content/media paths, image validation and conflict status handling.
- Preserve static Pages public site and use Vercel only for API functions; configure server secrets in Vercel, public API URL in Pages build variables.
- Replace unverified claims with evidence-limited profile/project wording; document when configuration or external proof is missing.
- Document architecture, operations, environment, security and deployment; add a clear verification checklist.

## Files requiring or receiving changes

`api/_lib/auth.js`, `api/_lib/http.js`, `api/auth/*`, `api/github/*`, `public/admin-cms.js`, `src/pages/admin.astro`, `src/data/profile.json`, `src/data/projects.json`, `src/pages/index.astro`, `src/pages/projects.astro`, `src/layouts/MainLayout.astro`, `scripts/generate-admin-hash.mjs`, Astro and GitHub Actions configuration, README/context/quick reference, `.env.example`, and documentation.
