# Production Release Report

**Status checked:** 2026-11-14. **Release status: BLOCKED.** Commit `462baf415e1f0434abd16c81f6d8600b78f08a36` was pushed to `main`; GitHub could not start the Pages runner because the account is locked due to a billing issue. This report distinguishes pushed source from a verified deployment.

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

**Locally implemented, not production verified:** existing engineering editors and new knowledge editor. Knowledge create/read/update/delete code is wired to the authenticated GitHub proxy. Automated browser tests for those UI flows were unavailable. Do not treat the deployed admin as functional until API origin and server configuration are verified.

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

Pages workflow runs on `main` pushes and manual dispatch, uses Node 22 and `npm ci`, performs checks/tests/build, checks seeded draft leakage, and deploys the root `dist` artifact with least-privilege Pages permissions. Run [43604403522](https://github.com/Tanmoy095/Tanmoy095.github.io/actions/runs/43604403522) failed before starting the build because GitHub reports the account is locked due to a billing issue; deploy was skipped. Vercel workflow run [43604402323](https://github.com/Tanmoy095/Tanmoy095.github.io/actions/runs/43604402323) also failed. Its credential guard has since been changed to step-level checks; no successful Vercel deployment is verified.

## 12. Vercel deployment details

**NOT VERIFIED.** No Vercel project link/configuration, CLI, token, or API origin was available in the workspace. Required Vercel production secrets and `PUBLIC_API_BASE_URL` repository variable could not be verified. No deployment URL is claimed.

## 13. Production verification results

**NOT VERIFIED.** Both `https://tanmoy095.github.io/` and `https://tanmoy095.github.io/admin/` returned HTTP 200, but fetched HTML did not contain the new Academics & Life editor or navigation, so the pushed change is not live. No production API URL was discovered. Pages routes, CMS login, CORS, writes, and regeneration have not been smoke-tested.

## 14. Remaining limitations

- GitHub account billing lock prevented the Pages runner from starting; the source push alone did not deploy the change.
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
- Remote `main`: `462baf415e1f0434abd16c81f6d8600b78f08a36` pushed 2026-11-14.
- Previous implementation commit is an ancestor of the pushed commit.
- Push succeeded as a fast-forward; no force push or protection bypass.
- Deployment date and production commit: **none; not deployed**.
