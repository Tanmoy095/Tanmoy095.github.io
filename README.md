# Aunmoy Dey Tanmoy — Engineering Portfolio

Astro and Tailwind portfolio focused on Go backend engineering, distributed systems and AI infrastructure. Public pages are static on GitHub Pages. The admin CMS calls serverless API functions deployed on Vercel; GitHub is the content store and publication trigger.

## Local development

```sh
npm ci
npm run dev
```

Set `PUBLIC_API_BASE_URL` in a local `.env` file to the Vercel API origin to use the CMS. Never add server credentials to local frontend variables or commit `.env` files.

## Verification

```sh
npm run check
npm run lint
npm test
npm run build
```

## CMS setup

The CMS requires a Vercel deployment and the server settings described in [environment variables](docs/ENVIRONMENT_VARIABLES.md). Generate an scrypt admin hash with `npm run hash-password`. Configure the public `PUBLIC_API_BASE_URL` as a GitHub Actions variable. See [deployment](docs/DEPLOYMENT.md), [security](docs/SECURITY.md), and [admin guide](docs/ADMIN_USER_GUIDE.md).

## Content

Profile and projects: `src/data/`. Blog, learning notes, and ADRs: `src/content/`. The CMS writes these GitHub paths and Actions rebuilds the public site.

## Current limitations

Production API setup, live credentials, deployment, external profile/CV verification, and full browser CRUD validation have not been confirmed in this workspace. Consult [implementation report](docs/IMPLEMENTATION_REPORT.md).
