# 📚 Complete Documentation Index

Welcome! This is your one-stop resource for everything about your portfolio website. Choose the guide that matches what you want to do.

---

## 🚀 Quick Start (First Time? Start Here!)

You just want to understand the basics? Start with **QUICK_REFERENCE.md**

⏱️ **5 minutes** to understand:
- How to add a blog post
- How to update your info
- How to deploy changes
- Quick file locations

---

## 📖 Full Documentation Guides

### 📝 **STEP_BY_STEP_GUIDE.md**
**Best for: Visual learners who want detailed instructions**

Includes step-by-step walkthroughs with examples for:
- Writing your first blog post
- Editing skills
- Changing colors
- Adding projects
- Updating your name & contact
- And more!

**Time to read:** 15 minutes

---

### 📚 **EDITING_GUIDE.md**
**Best for: Comprehensive reference documentation**

Complete guide covering:
- Blog post management (create, edit, delete)
- Project management
- Personal information updates
- Skills customization
- Styling & theme changes
- Navigation & links
- Deployment process
- Directory structure

**Time to read:** 25 minutes (or use as reference)

---

### 🔧 **TROUBLESHOOTING.md**
**Best for: Fixing problems when something breaks**

Covers 10+ common issues with solutions:
- Blog post not appearing
- Changes not showing on live site
- Site build fails
- Colors didn't change
- Theme toggle not working
- Links not working
- Styles look weird
- Image not displaying
- Git push failed
- And more!

**Time to read:** As needed when issues arise

---

### ⚡ **QUICK_REFERENCE.md**
**Best for: Quick copy-paste cheat sheets**

Fast reference for:
- Common tasks (new post, update info, edit colors)
- File locations table
- Markdown examples
- Git commands
- Commit message examples
- Pro tips

**Time to read:** 5 minutes (reference as needed)

---

## 🎯 I Want to...

### ✍️ Write a Blog Post
→ **STEP_BY_STEP_GUIDE.md - Write Your First Blog Post section**

1. Create file in `src/content/blog/my-post.md`
2. Add metadata (frontmatter)
3. Write content
4. Deploy with git

**Time:** 10 minutes

---

### 📝 Edit an Existing Blog Post
→ **EDITING_GUIDE.md - Editing an Existing Blog Post section**

1. Open `src/content/blog/filename.md`
2. Edit content
3. Deploy with git

**Time:** 5 minutes

---

### 🗑️ Delete a Blog Post
→ **EDITING_GUIDE.md - Deleting a Blog Post section**

```bash
git rm src/content/blog/blog-post-name.md
git commit -m "blog: remove post"
git push origin main
```

**Time:** 2 minutes

---

### 🎯 Add a New Project
→ **STEP_BY_STEP_GUIDE.md - Add a New Project section**

1. Open `src/pages/projects.astro`
2. Add project card HTML
3. Deploy with git

**Time:** 10 minutes

---

### 👤 Update Your Name & Contact
→ **STEP_BY_STEP_GUIDE.md - Update Your Name & Contact section**

1. Open `src/config.ts`
2. Update fields
3. Deploy with git

**Time:** 5 minutes

---

### 🎨 Change Colors
→ **STEP_BY_STEP_GUIDE.md - Change Your Colors section**

1. Open `tailwind.config.mjs`
2. Change hex codes
3. Deploy with git

**Time:** 5 minutes

---

### 🎓 Update Skills
→ **STEP_BY_STEP_GUIDE.md - Update Your Skills section**

1. Open `src/config.ts`
2. Edit skills array
3. Deploy with git (updates everywhere automatically!)

**Time:** 5 minutes

---

### 📋 Edit About Page
→ **EDITING_GUIDE.md - Edit About Page section**

1. Open `src/pages/about.astro`
2. Update bio and experience
3. Deploy with git

**Time:** 10 minutes

---

### 🔗 Update Social Links
→ **QUICK_REFERENCE.md - Update Social Links section**

1. Open `src/config.ts` (for main links)
2. Open `src/components/Footer.astro` (for footer links)
3. Update URLs
4. Deploy with git

**Time:** 5 minutes

---

### 🐛 Something is Broken!
→ **TROUBLESHOOTING.md**

Find your issue and follow the solution steps.

**Time:** As needed

---

## 📊 File Location Quick Map

| What You Want | File Location |
|---|---|
| Write blog post | `src/content/blog/post-name.md` |
| Edit your name | `src/config.ts` |
| Edit your skills | `src/config.ts` |
| Add project | `src/pages/projects.astro` |
| Edit about page | `src/pages/about.astro` |
| Edit homepage | `src/pages/index.astro` |
| Change colors | `tailwind.config.mjs` |
| Edit styles | `src/styles/global.css` |
| Update navigation | `src/components/Header.astro` |
| Update footer | `src/components/Footer.astro` |
| Social links | `src/config.ts` + `src/components/Footer.astro` |

---

## 🔄 Universal Deployment Process

No matter what you edit, deployment always follows this process:

```bash
# Step 1: Test locally (optional but recommended)
npm run dev
# Visit http://localhost:3000 to test
# Ctrl+C to stop

# Step 2: Rebuild production files
npm run build

# Step 3: Stage your changes
git add .

# Step 4: Describe what changed
git commit -m "what you changed: brief description"

# Step 5: Upload to GitHub
git push origin main

# Step 6: Wait 1-2 minutes and verify
# Visit: https://tanmoy095.github.io
```

---

## 🎓 Learning Path

**New to the site?** Follow this order:

1. Read: **QUICK_REFERENCE.md** (5 min)
2. Follow: **STEP_BY_STEP_GUIDE.md** for your first task (15 min)
3. Reference: **EDITING_GUIDE.md** for detailed info
4. Use: **TROUBLESHOOTING.md** if issues arise

---

## 💡 Key Concepts

### What is Frontmatter?
The metadata at the top of blog posts in YAML format:
```yaml
---
title: "My Post"
date: 2026-06-15
tags: ["infrastructure"]
---
```

### What is Git?
Version control system that tracks changes and deploys your site.

### What is GitHub Actions?
Automation that builds and deploys your site when you push.

### What is Tailwind CSS?
Utility framework that styles your site with classes.

---

## 📞 Support Resources

### Official Documentation
- **Astro Docs:** https://docs.astro.build
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Markdown Guide:** https://www.markdownguide.org
- **Git Handbook:** https://guides.github.com

### When Stuck
1. Check **TROUBLESHOOTING.md**
2. Search in official docs above
3. Look at existing examples in your site
4. Try rebuilding: `npm run build`
5. Clear browser cache

---

## ✅ Before You Deploy

Always check:
- ✅ File is in correct location
- ✅ Frontmatter (for blogs) is valid YAML
- ✅ Dates are in format: `YYYY-MM-DD`
- ✅ All links are complete: `https://...`
- ✅ Tested locally with `npm run dev`
- ✅ No typos or syntax errors

---

## 🚀 Quick Command Reference

```bash
# Development
npm run dev              # Start local server at localhost:3000

# Production
npm run build           # Build production files
npm run preview         # Preview production version

# Git operations
git status              # See what changed
git add .               # Stage all changes
git commit -m "msg"     # Commit with message
git push origin main    # Deploy to live site
git log --oneline       # View history
```

---

## 📈 Your Site Stats

- **Type:** Static site (fast & secure)
- **Builder:** Astro 4.x
- **Styling:** Tailwind CSS 3.x
- **Hosting:** GitHub Pages
- **Domain:** https://tanmoy095.github.io
- **Blog Posts:** Stored as Markdown files
- **Auto-Deploy:** Every time you push to main

---

## 🎓 Next Steps

1. **Write your first blog post** → Follow **STEP_BY_STEP_GUIDE.md**
2. **Publish daily** → Same process as step 1, repeat
3. **Customize more** → Use **EDITING_GUIDE.md**
4. **Share your portfolio** → Link to https://tanmoy095.github.io

---

## 📝 Document Summary

| Document | Purpose | Read Time | Best For |
|---|---|---|---|
| QUICK_REFERENCE.md | Fast reference | 5 min | Quick lookup |
| STEP_BY_STEP_GUIDE.md | Visual walkthrough | 15 min | First-time users |
| EDITING_GUIDE.md | Comprehensive | 25 min | Complete reference |
| TROUBLESHOOTING.md | Problem solving | As needed | When stuck |
| DOCS_INDEX.md (this file) | Navigation | 10 min | Orientation |

---

## ✨ You've Got This!

Your portfolio is live, modern, and ready. Now it's time to:
- ✍️ Write great blog posts
- 🎯 Showcase your projects
- 🚀 Let recruiters find you

**Start with your first blog post today!** → Follow **STEP_BY_STEP_GUIDE.md**

---

*Last Updated: June 10, 2026*
*Site: https://tanmoy095.github.io*
*Repo: https://github.com/Tanmoy095/Tanmoy095.github.io*
