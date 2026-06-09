# Project Context & Architecture

**Project:** Portfolio Website (Astro + Tailwind CSS)  
**Repository:** https://github.com/Tanmoy095/Tanmoy095.github.io  
**Live Site:** https://tanmoy095.github.io  
**Status:** ✅ Deployment Fixed (2026-06-10)

---

## 🎯 Quick Summary

**What:** Personal portfolio + technical blog for recruiting visibility  
**Built With:** Astro 4.x (static site generator), Tailwind CSS 3.x, TypeScript  
**Deployed To:** GitHub Pages (gh-pages branch)  
**Owner:** Aunmoy Dey Tanmoy (AI Infrastructure Engineer)

---

## 📂 Project Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          ✅ FIXED: Now builds and deploys on push to main
├── src/
│   ├── pages/
│   │   ├── index.astro         ✅ Homepage with hero, skills, projects, contact
│   │   ├── about.astro         ✅ Professional background (262 lines)
│   │   ├── blog/
│   │   │   ├── [slug].astro    Blog post template
│   │   │   └── index.astro     Blog listing page
│   │   ├── projects.astro      Projects showcase
│   │   ├── contact.astro       Contact page (if exists)
│   │   └── learning.astro      ✅ NEW: Daily learning journal & ADR tracking
│   ├── content/
│   │   └── blog/               8 blog posts (*.md files)
│   ├── components/
│   │   ├── Header.astro        Navigation + theme toggle (Learning link added)
│   │   ├── Footer.astro        Footer with nav & social links
│   │   ├── MainLayout.astro    Main layout wrapper
│   │   └── ThemeToggle.astro   Dark/light mode toggle
│   └── config.ts               ✅ Site config (author, nav, contact, skills)
├── public/                      Static assets
├── blogs/                       User's source blog articles
├── docs/                        Documentation files
├── astro.config.mjs            ✅ Config: output=static, GitHub Pages ready
├── tailwind.config.mjs         Dark mode + Tailwind setup
├── package.json                npm dependencies
└── .gitignore                  dist/ and .astro/ ignored

```

---

## ✅ Latest Changes (Session: 2026-06-10)

### 1. **Fixed GitHub Pages Deployment** ✅
- **Issue:** deploy.yml workflow failing at npm install step
- **Solution:** Updated .github/workflows/deploy.yml
  - Changed Node.js: 18 → 20
  - Changed package installer: npm ci → npm install
  - Now builds dist/ and deploys to gh-pages automatically
- **Commit:** `4c6b69c` (origin/main HEAD)

### 2. **New Content Added** ✅
- **Learning Page** (`/learning`): Daily learning, ADR tracking, knowledge map
- **8 Blog Posts:** All with recruiter-friendly content
  1. SOLID Principles Design Excellence
  2. OOP in Go: Pragmatic Design
  3. Go Buffered Channels Guide
  4. DAG Theory & Data Pipelines
  5. Designing for Scalability HLD
  6. Scalable AI Infrastructure
  7. GPU Resource Management in Cloud
  8. Kubernetes at Scale

### 3. **Updated Contact Information** ✅
- Email: `adtanmoy95@gmail.com`
- Phone: `+8801850371329`
- LinkedIn: `linkedin.com/in/aunmoy-dey-tanmoy095`
- GitHub: `github.com/Tanmoy095`

### 4. **Updated About Page** ✅
- Replaced generic ML content with specific professional background
- Added 7 expertise sections with bullet points
- Added experience highlights (3 roles)
- Added education & certifications
- Added "Currently Focused On" section

---

## 🔧 Configuration Files

### src/config.ts
```typescript
export const SITE_METADATA = {
  author: "Aunmoy Dey Tanmoy",
  email: "adtanmoy95@gmail.com",
  phone: "+8801850371329",
  role: "AI Infrastructure Engineer & Software Architect",
  social: {
    github: "https://github.com/Tanmoy095",
    linkedin: "https://linkedin.com/in/aunmoy-dey-tanmoy095",
    twitter: "https://twitter.com/tanmoy"
  },
  nav: [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Projects", path: "/projects" },
    { name: "Blog", path: "/blog" },
    { name: "Learning", path: "/learning" },  // ✅ NEW
    { name: "Contact", path: "#contact" }
  ]
}
```

### astro.config.mjs
- `output: "static"` - Builds to static HTML/CSS/JS
- `outDir: "dist"` - Output directory (deployed to gh-pages)
- Routes at: `/about`, `/blog`, `/learning`, `/projects`

---

## 📊 Blog Post Format

All blog posts use Markdown with YAML frontmatter:
```yaml
---
title: "Blog Title"
description: "Short description for preview"
date: 2026-06-10
author: "Aunmoy Dey Tanmoy"
tags: ["Tag1", "Tag2", "Tag3"]
image: "/blog-image.jpg"
---
```

**Location:** `src/content/blog/*.md`  
**Auto-generated routes:** `/blog/slug-from-filename/`

---

## 🚀 Build & Deploy

### Local Development
```bash
npm install
npm run dev          # Starts dev server at localhost:3000
```

### Build for Production
```bash
npm run build        # Creates dist/ folder
```

### Deployment
**Automatic (via GitHub Actions):**
1. Push to `main` branch
2. `.github/workflows/deploy.yml` triggers
3. Builds Astro → generates dist/
4. Deploys dist/ to `gh-pages` branch
5. GitHub Pages serves from `gh-pages`

**Manual (if needed):**
```bash
npm run build
git checkout gh-pages
# Copy dist/* to gh-pages root
git add -A
git commit -m "deploy: manual update"
git push origin gh-pages
```

---

## 🔍 Key Files to Know

| File | Purpose | Last Updated |
|------|---------|--------------|
| `.github/workflows/deploy.yml` | Automated deployment workflow | ✅ 2026-06-10 (FIXED) |
| `src/config.ts` | Site metadata, nav, contact info | ✅ Added phone field |
| `src/pages/about.astro` | About page (262 lines) | ✅ Rewritten professionally |
| `src/pages/learning.astro` | Learning page (NEW) | ✅ Created 2026-06-10 |
| `src/components/Header.astro` | Navigation bar | ✅ Added Learning link |
| `src/components/Footer.astro` | Footer | ✅ Updated author name |
| `src/content/blog/*.md` | Blog posts (8 total) | ✅ 5 new posts created |

---

## 🐛 Known Issues & Solutions

### Issue: Site shows old content after deployment
**Root Cause:** GitHub Pages was configured, workflow was failing  
**Solution:** Fixed deploy.yml (node 20, npm install)  
**Status:** ✅ RESOLVED

### Issue: Learning link not appearing in navigation
**Root Cause:** Navigation array in config.ts didn't include learning  
**Solution:** Added `{ name: "Learning", path: "/learning" }` to nav array  
**Status:** ✅ RESOLVED

### Issue: Contact info hardcoded in components
**Root Cause:** Some email links pointed to placeholder  
**Solution:** Updated all contact links to use real email: adtanmoy95@gmail.com  
**Status:** ✅ RESOLVED

---

## 📱 Page Routes (After Deployment)

| Route | Component | Status |
|-------|-----------|--------|
| `/` | `index.astro` | ✅ Live |
| `/about` | `about.astro` | ✅ Professional background |
| `/blog` | `blog/index.astro` | ✅ 8 posts |
| `/blog/[slug]/` | `blog/[slug].astro` | ✅ Dynamic routes |
| `/learning` | `learning.astro` | ✅ NEW |
| `/projects` | `projects.astro` | ✅ Live |

---

## 🎨 Styling

- **Framework:** Tailwind CSS 3.x
- **Dark Mode:** Configured (`dark:` prefix classes)
- **Theme Toggle:** `ThemeToggle.astro` component
- **Responsive:** Mobile-first design with Tailwind breakpoints

---

## 🔐 Environment & Deployment

### GitHub Actions Secrets
- `GITHUB_TOKEN` - Used for gh-pages deployment (auto-provided)

### DNS/CNAME
- CNAME file: `dist/.nojekyll` (tells GitHub Pages to use Astro)
- Custom domain: (if configured, check repository settings)

### GitHub Pages Settings
- Source: `gh-pages` branch (gh-pages branch receives dist/ on deploy)
- Domain: `tanmoy095.github.io`

---

## 📝 NPM Scripts

```json
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview"
}
```

---

## 🎯 Next Steps for Future Agents

1. **To update content:** Edit files in `src/pages/` or `src/content/blog/`
2. **To deploy:** Push to `main` branch (workflow auto-deploys)
3. **To test locally:** `npm run dev` then edit and save
4. **To add pages:** Create `.astro` file in `src/pages/`
5. **To add blog:** Create `.md` file in `src/content/blog/`

**Avoid:** Manually editing gh-pages branch - let the workflow handle it

---

## 📊 Content Statistics

- **Blog Posts:** 8 total
  - 5 newly created (recruiter-focused)
  - All with code examples & production patterns
  - Average length: 1800-2500 words
  
- **Pages:** 6 total
  - Homepage (hero + skills + projects + contact)
  - About (professional background)
  - Blog listing + individual posts
  - Learning journal
  - Projects showcase
  - Contact section on homepage

- **Contact Methods:** 4 total
  - Email: adtanmoy95@gmail.com
  - Phone: +8801850371329
  - LinkedIn: linkedin.com/in/aunmoy-dey-tanmoy095
  - GitHub: github.com/Tanmoy095

---

## ✨ Success Checklist

- ✅ Site builds successfully (`npm run build` → 13 pages)
- ✅ All 8 blog posts published
- ✅ Learning page live at `/learning`
- ✅ About page updated with professional background
- ✅ Contact info updated across all pages
- ✅ Navigation includes Learning link
- ✅ GitHub Actions workflow fixed and deploying
- ✅ Site live at https://tanmoy095.github.io

---

**Last Updated:** 2026-06-10 02:10 UTC  
**Maintenance Status:** ✅ All systems operational
