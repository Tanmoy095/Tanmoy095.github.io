# Production Release Report

**Status checked:** 2026-11-14. **Release status: FRONTEND LIVE; CMS BLOCKED.** The source was pushed to `main`; a static artifact was separately published to `gh-pages` at `1eeb96d832eebfaba4b906aa0622825497381afa`. The new UI is live. The admin API origin is empty, so login and CRUD do not work yet.

## 1. Original issues

The prior implementation commit `f1180ded4d9d7246f2ec2cbd5987053d373c2cbe` existed locally on `codex/portfolio-cms-rebuild`; `origin/main` was an ancestor at `442f251`. The prior work had not been pushed or deployed. This continuation adds academic and personal publishing sections, CMS workflows, and release checks.

## 2. Architecture changes

Added one typed Astro knowledge collection at `src/content/knowledge/`, with type-specific fields and routes for academics/research, writing, travel, books, and quotes. Static output and sitemap discovery filter to published records; unlisted entries receive direct pages without index links. New records default to draft.

The site remains static on GitHub Pages and the CMS API remains serverless on Vercel, with GitHub as the source of CMS content. Since this repository is public, private storage is not available; CMS private writes are disabled and rejected by the API.

## 3. New features

- Academic, research, writing, travel, books, quotes, and reflection sections and navigation.
- Shared knowledge CMS list, search, type/status filtering, editor, draft/publish/unpublish, preview, SEO, tags, category, featured/order, and delete controls.
- Cover/gallery uploads re-encoded through Sharp to remove EXIF/GPS; bounded research PDF upload.
- Academic seed is a draft and uses only owner-provided institution, degree, and thesis topic.

## 4. Existing features repaired

Existing project, profile, technical blog, learning/ADR, CV, and avatar editors remain in the code. Their full browser CRUD regression was not run.

## 5. Admin CMS functionality

**UI live; API not configured:** existing engineering editors and the new knowledge editor are on the site. The published admin HTML contains `apiBaseUrl = ""`, so login, reads, and CRUD are unavailable until the Vercel API is deployed/configured and its origin is embedded in the site build.

## 6. Academic and research management

Typed profile and research fields, citations, and PDF attachment paths are present. The AUST BSc IPE thesis record remains a draft. No supervisor, grades, research outcomes, or publication claims were invented.

## 7. Personal writing and travel management

Writing uses a Markdown editor and preview. Travel supports location, dates, gallery, captions, and lightbox. Photo re-encoding strips embedded metadata. No personal entries have been automatically published.

## 8. Books and quotes management

Book fields cover title, author, edition, reading state, concepts, and dates. Quote fields require text, author, and source; short quote length is constrained and commentary is supported.

## 9. Security improvements

Writes require a signed session and allowlisted path; image uploads are decoded/re-encoded and bounded, PDF uploads are bounded and signature-checked, and content update/delete uses SHA. Private content writes are explicitly blocked. **Unresolved:** sessions cannot revoke copied tokens before expiry and login rate limiting is process-local. Durable shared Redis-compatible storage has not been implemented/configured. Do not enable production CMS use until it is.

## 10. Automated testing results

Locally verified after changes:

- `npm run check`: passed, 0 errors (1 Astro hint, subsequently addressed).
- `npm run lint`: passed JavaScript syntax checks.
- `npm test`: 11 passed, 0 failed, including image re-encoding, private-write rejection, and PDF upload checks.
- `npm run build`: passed, 30 routes generated. Seeded draft route/content was absent from output.
- `npm audit --omit=dev`: could not complete because npm audit endpoint was unreachable. npm reported a moderate advisory during dependency installation; unresolved.

No authenticated production API or browser end-to-end CRUD tests ran. No real content was changed for tests.

## 11. GitHub Actions deployment details

Pages workflow runs on `main` pushes and manual dispatch, uses Node 22 and `npm ci`, performs checks/tests/build, checks seeded draft leakage, and deploys the root `dist` artifact with least-privilege Pages permissions. Latest observed Pages run [43604942832](https://github.com/Tanmoy095/Tanmoy095.github.io/actions/runs/43604942832) failed before starting because GitHub reports the account is locked due to a billing issue. Vercel run [43604942866](https://github.com/Tanmoy095/Tanmoy095.github.io/actions/runs/43604942866) was blocked by the same account lock. The static artifact was then pushed directly to `gh-pages`; Actions remain unsuccessful.

## 12. Vercel deployment details

**NOT VERIFIED.** No Vercel project link/configuration, CLI, token, or API origin was available in the workspace. Required Vercel production secrets and `PUBLIC_API_BASE_URL` repository variable could not be verified. No deployment URL is claimed.

## 13. Production verification results

The homepage, `/admin/`, academics, research, writing, travel, books, quotes, contact, sitemap, and RSS returned HTTP 200 after the `gh-pages` publish. Homepage HTML contains the new navigation; admin HTML contains the knowledge editor. **CMS API NOT VERIFIED:** the admin bundle has an empty API origin, so authentication, CORS, CRUD, and content regeneration could not be tested.

## 14. Remaining limitations

- GitHub account billing lock prevents the Pages and Vercel Actions runners from starting. The frontend was published directly to `gh-pages` as a fallback.
- The Vercel production URL/secrets and the `PUBLIC_API_BASE_URL` repository variable are unavailable/unverified; the live admin therefore cannot connect to its API.
- Vercel auth/API configuration is unavailable and production API is unverified.
- Durable session revocation and serverless rate limiting are not implemented.
- Private content is unavailable until private storage exists. Do not put sensitive data in drafts or unlisted content because source lives in a public repository.
- Browser UI, responsive layout, and live CRUD were not end-to-end tested.
- npm audit could not reach its advisory service.

## 15. Content management guide

Use Admin → Academics & Life. Choose a module and fill its fields. Save Draft first; select Published to publish or Draft to unpublish. Unlisted means direct URL access without normal discovery and is not private. Upload photos through the editor for EXIF/GPS stripping. Attach research PDFs through the PDF field. Private is disabled. Production admin remains blocked pending Vercel configuration and durable security storage.

## Git and deployment record

- Repository: `https://github.com/Tanmoy095/Tanmoy095.github.io`
- Intended branch: `main`
- Prior implementation commit preserved locally: `f1180ded4d9d7246f2ec2cbd5987053d373c2cbe`
- Feature commit `462baf415e1f0434abd16c81f6d8600b78f08a36` and follow-up `bd9c8a719cafa0b01721747634c5b2a2b65a6bbc` are on remote `main` (2026-11-14).
- Previous implementation commit is an ancestor of the pushed commit.
- Push succeeded as a fast-forward; no force push or protection bypass.
- Main source commits pushed: `462baf415e1f0434abd16c81f6d8600b78f08a36`, `bd9c8a719cafa0b01721747634c5b2a2b65a6bbc`, and the release report update on `main`.
- Static artifact deployment: `gh-pages` commit `1eeb96d832eebfaba4b906aa0622825497381afa`, pushed 2026-11-14 and verified live.
- Vercel API deployment: **none verified**.
