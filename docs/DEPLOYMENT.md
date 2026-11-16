# Deployment

## Free Vercel deployment

Vercel Hobby is a $0 plan suitable for a personal, non-commercial portfolio. If you do not already have a Vercel account, you need to create one and authorize Vercel to access this GitHub repository. Vercel's Git integration builds the site and serverless API on pushes to the selected production branch, independently of the repository's GitHub Actions runners.

1. In Vercel, add a new project and import `Tanmoy095/Tanmoy095.github.io`.
2. Use the repository's `vercel.json` settings and Node.js 22 runtime. Set `main` as the production branch.
3. Create/claim a persistent Upstash Redis database, then add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel Project Settings → Environment Variables.
4. Add `GITHUB_TOKEN` with contents read/write access to this repository, plus `GITHUB_OWNER=Tanmoy095`, `GITHUB_REPO=Tanmoy095.github.io`, and `GITHUB_BRANCH=main`.
5. Add `ADMIN_EMAIL`, an `ADMIN_PASSWORD_HASH` generated with `npm run hash-password`, and a unique random `ADMIN_SESSION_SECRET` of at least 32 characters. Add `CMS_ALLOWED_ORIGINS` with the Vercel project origin and any other site origins that should access the API.
6. Deploy Production and note its `https://<project>.vercel.app` origin. The admin page automatically uses same-origin API requests when hosted on Vercel. For the GitHub Pages copy, set the GitHub Actions variable `PUBLIC_API_BASE_URL` to this origin and redeploy Pages.
7. Confirm `/api/auth/verify` reports `serverMode: true`, then verify admin login, logout, content create/update/delete, and upload using a disposable test item.

Vercel Hobby is free but is restricted by Vercel's terms to personal, non-commercial use and has plan limits. Upstash's free tier also has usage limits; review current pricing before production traffic grows. A temporary unclaimed Redis credential expires and is not a production database.

## GitHub Pages

The public Pages copy is served at `https://tanmoy095.github.io/`. Its workflow builds `dist/`, checks for draft leakage, and publishes with the repository's Pages permissions. GitHub has previously blocked this account's Actions runners due to a billing lock. Vercel's direct Git integration can still deploy independently; it does not fix a blocked Pages workflow.

## Current verification state

Local build, diagnostics, syntax checks, and API tests pass. The deployed Vercel project, Upstash database, production secrets, and live CRUD have not been verified from this workspace. Do not treat production CMS use as ready until the seven-step deployment and verification above are complete.
