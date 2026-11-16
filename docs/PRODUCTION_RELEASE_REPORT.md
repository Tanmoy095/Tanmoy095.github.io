# Production Release Report

**Checked:** 2026-11-16. **Status: frontend previously published; upgraded CMS source is not yet production-deployed or configured.** No Vercel deployment or fully working live admin is claimed.

## Application scope

The Astro portfolio includes home/about, projects, technical blog, learning notes, academics/research, writing, travel, books, quotes, contact, and an admin interface. The CMS has profile, project, blog, learning, uploads, and typed knowledge editing. Public content is stored in GitHub. Private knowledge entries use a separate authenticated Redis store and do not enter the public repository.

The CMS API uses expiring signed sessions, Redis-backed logout revocation, shared Redis login throttling, GitHub-backed public content CRUD, image re-encoding, and bounded PDF uploads. The API fails closed if durable Redis configuration is missing/unavailable. All connected accounts, environment values, and deployed endpoint behavior still need production verification.

## Verification performed locally

- `npm run check`: passed, 0 errors, warnings, or hints.
- `npm run lint`: passed.
- `npm test`: passed, 13 tests, including session revocation, shared throttling, private knowledge CRUD, and upload validation.
- `npm run build`: passed; 30 routes generated.

These checks do not validate production credentials, Vercel routing, account configuration, live CORS, or browser CRUD.

## Deployment state and remaining setup

Prior deployment work reported that the static site was published to `gh-pages` and the live admin had an empty API origin. The repository's GitHub Actions runs were blocked because GitHub reported an account billing lock. The current working changes have not been pushed or deployed in this run. The live site may therefore still serve the older artifact.

The workspace has no connected Vercel project, Vercel token/CLI, or Upstash credentials. Vercel Hobby offers a free tier for personal, non-commercial use, but account signup and GitHub authorization are needed if the user has no account. A persistent Upstash Redis database must also be created/claimed. Follow [deployment steps](DEPLOYMENT.md) to connect the repository, set the server environment, deploy, and verify authenticated flows.

## Security and content notes

- Never put GitHub, admin, or Upstash credentials in browser-exposed `PUBLIC_` settings or Git.
- Draft and unlisted files are still readable from the public GitHub repository; do not store secrets in them.
- Only private entries stored in Redis are intended for non-public knowledge.
- The CMS must not be used on the public site until the Vercel production API is configured and login/CRUD/upload flows have been verified.
