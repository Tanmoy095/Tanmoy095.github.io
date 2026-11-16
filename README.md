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

Profile and projects: `src/data/`. Engineering articles and notes: `src/content/blog/` and `src/content/learning/`. Academic research, personal writing, travel stories, books, and quotes use the typed shared collection in `src/content/knowledge/`. New knowledge entries start as drafts. Published and unlisted entries get static pages; unlisted pages are omitted from section listings and sitemap.

## Current limitations

The static website is live from `gh-pages`. The CMS now supports Redis-backed throttling, logout revocation, and private entries, but Vercel/Upstash production configuration is not connected or verified here, so the live admin API may still be unavailable. See [deployment](docs/DEPLOYMENT.md) and [release report](docs/PRODUCTION_RELEASE_REPORT.md).
