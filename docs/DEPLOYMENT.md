# Deployment

## Workflow behavior and current status

The Pages workflow triggers on main pushes and manual dispatch, uses Node 22 and `npm ci`, runs Astro diagnostics, syntax checks, tests, and the static build, checks that the seeded draft is absent, and uploads/deploys `dist/`. Its permissions are contents read, Pages write, and OIDC token write. Vercel auto-deploy is configured to run only when token, organization, and project secrets are all present. No workflow run or deployment has been verified for this change.

Before enabling CMS use, configure the Vercel values listed in `ENVIRONMENT_VARIABLES.md`, set the Pages variable `PUBLIC_API_BASE_URL` to the verified Vercel origin, and implement a durable shared session/revocation and rate-limit store. No API URL is guessed in this documentation.

## GitHub Pages

Keep Pages as the public site at `https://tanmoy095.github.io/`. In repository Actions variables set `PUBLIC_API_BASE_URL` to the Vercel project origin (no trailing slash). The `Deploy to GitHub Pages` workflow builds with Node 22 and `npm ci`, then publishes `dist/`. Pages deployment needs the workflow's existing `pages: write` and `id-token: write` permissions.

## Vercel API

Import the same repository into Vercel, select Node.js 22, and keep its production project URL for `PUBLIC_API_BASE_URL`. Configure every server variable from `.env.example` under Project Settings > Environment Variables for Production and Preview as appropriate. Redeploy after changing variables. Vercel's Git integration or the existing optional workflow deploys the API. Confirm `/api/auth/verify` returns JSON with `serverMode: true` before enabling CMS use.

## Verification

Check the Pages workflow run, inspect the public homepage and `/admin/`, check API verify and login, and perform a test content write with a dedicated test item before relying on production. Ensure Vercel has write access only to the intended repository and the Pages build receives no server secrets.

No deployment was run from this workspace: Git metadata is read-only, no branch could be created, and no authenticated remote deployment status or Vercel configuration is available here.
