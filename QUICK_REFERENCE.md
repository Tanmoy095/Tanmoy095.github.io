# Quick Reference Guide

## 🚀 Most Common Tasks

### Task: Add a New Blog Post
```bash
# 1. Create new file in src/content/blog/
touch src/content/blog/my-new-post.md

# 2. Add frontmatter:
cat > src/content/blog/my-new-post.md << 'EOF'
---
title: "My Blog Title"
description: "Short description"
date: 2026-06-10
author: "Aunmoy Dey Tanmoy"
tags: ["tag1", "tag2"]
image: "/blog-image.jpg"
---

# Content here...
EOF

# 3. Deploy (automatic on push to main)
git add src/content/blog/my-new-post.md
git commit -m "blog: add new post"
git push origin main
```

### Task: Update Contact Information
**Files to update:**
1. `src/config.ts` - Primary config
2. `src/pages/index.astro` - Contact section
3. `src/components/Footer.astro` - Footer links

**Current contact info:**
- Email: adtanmoy95@gmail.com
- Phone: +8801850371329
- LinkedIn: linkedin.com/in/aunmoy-dey-tanmoy095
- GitHub: github.com/Tanmoy095

### Task: Update About Page
**File:** `src/pages/about.astro` (262 lines)  
**Structure:**
1. Hero section (name + role)
2. Experience highlights (3 jobs)
3. Technical expertise (4 categories)
4. Education & certifications
5. Currently focused on

### Task: Update Navigation
**File:** `src/config.ts` - `nav` array  
**Example:**
```typescript
nav: [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Blog", path: "/blog" },
  { name: "Learning", path: "/learning" },  // ✅ Already added
]
```

### Task: Test Locally
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Task: Build for Production
```bash
npm run build
# Creates dist/ folder with 13 pages
```

### Task: Debug Deployment
1. Check workflow: https://github.com/Tanmoy095/Tanmoy095.github.io/actions
2. Look for "Deploy to GitHub Pages" workflow
3. Click on failed run to see error logs
4. Common issues:
   - npm install fails → Check Node.js version
   - Build fails → Check Astro syntax in .astro files
   - Deploy fails → Check gh-pages branch permissions

---

## 🐛 Troubleshooting

### Problem: Site shows old content
**Solutions:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear CDN cache: Wait 5-10 minutes for GitHub Pages to update
3. Check workflow passed: https://github.com/Tanmoy095/Tanmoy095.github.io/actions
4. Verify gh-pages branch has new files: `git log origin/gh-pages -5`

### Problem: Blog post not showing
**Check:**
1. File exists: `src/content/blog/my-post.md`
2. Frontmatter valid YAML (no syntax errors)
3. Date is not in future (or remove date check if present)
4. Build locally: `npm run build` and check `dist/blog/`

### Problem: Navigation link 404s
**Check:**
1. Component exists: `src/pages/learning.astro`
2. Route is correct in config.ts
3. Build includes page: `npm run build` and check dist/

### Problem: Styles not applying
**Check:**
1. Using Tailwind classes: `className="px-4 py-2 bg-blue-500"`
2. Dark mode prefix: `dark:bg-slate-900`
3. Build includes CSS: `npm run build` and check dist/_astro/

---

## 📊 Project Stats

- **Build time:** ~4-5 seconds
- **Output size:** ~19 HTML files, ~2-3 CSS files, ~3 JS files
- **Pages built:** 13 (1 homepage + 1 about + 8 blog posts + 1 learning + 1 projects + 1 blog listing)
- **Blog posts:** 8
- **Navigation items:** 6

---

## 🔑 Key Files to Edit

| Task | File | Notes |
|------|------|-------|
| Contact info | `src/config.ts` | Primary source of truth |
| Navigation | `src/config.ts` | nav array |
| Homepage | `src/pages/index.astro` | Hero + contact section |
| About page | `src/pages/about.astro` | Professional background |
| Blog posts | `src/content/blog/*.md` | Markdown with YAML frontmatter |
| Learning page | `src/pages/learning.astro` | Learning journal |
| Header | `src/components/Header.astro` | Navigation + theme toggle |
| Footer | `src/components/Footer.astro` | Footer links + info |
| Build config | `astro.config.mjs` | Astro configuration |
| Style config | `tailwind.config.mjs` | Tailwind setup |
| Workflow | `.github/workflows/deploy.yml` | GitHub Actions auto-deploy |

---

## ⚡ Important Notes

1. **Never** manually edit `gh-pages` branch - workflow handles it
2. **Always** push changes to `main` - workflow auto-deploys
3. **Blog dates:** Use format `YYYY-MM-DD` in frontmatter
4. **Blog images:** Store in `public/` and reference as `/blog-image.jpg`
5. **Mobile first:** Test responsive design with DevTools
6. **Dark mode:** Check `dark:` prefix on styles when adding new elements

---

## 🔗 Important Links

- **Live Site:** https://tanmoy095.github.io
- **Repository:** https://github.com/Tanmoy095/Tanmoy095.github.io
- **GitHub Actions:** https://github.com/Tanmoy095/Tanmoy095.github.io/actions
- **Astro Docs:** https://docs.astro.build
- **Tailwind Docs:** https://tailwindcss.com/docs

---

**Last Updated:** 2026-06-10  
**Maintenance:** ✅ Active
