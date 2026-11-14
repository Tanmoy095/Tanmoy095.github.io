# Project Context

- **Owner:** Aunmoy Dey Tanmoy
- **Positioning:** Backend Engineer | Go, Distributed Systems & AI Infrastructure
- **Frontend:** Astro static site with Tailwind CSS
- **CMS API:** Vercel serverless functions
- **Content store:** GitHub repository Contents API
- **Public URL:** https://tanmoy095.github.io/
- **Content:** `src/data/profile.json`, `src/data/projects.json`, and Astro collections under `src/content/`, including the shared typed academics and personal knowledge collection

The CMS must use `PUBLIC_API_BASE_URL`. GitHub Pages cannot execute API functions. No browser password hash, GitHub PAT, or server secret belongs in the static bundle. Configure Vercel secrets per `docs/ENVIRONMENT_VARIABLES.md`.

Project status and professional facts should be evidence-based. Distinguish personal projects from client work, and do not claim production deployment, scale, impact, or dates without a source. The repository does not currently include the CV or complete project source documentation.

Private content must not be saved to this public repository. The CMS blocks private status until a separate private store is configured. The API also needs a durable Redis-compatible store before revocation and rate limiting can be considered production-ready. Read the [release report](docs/PRODUCTION_RELEASE_REPORT.md) for current verification status.
