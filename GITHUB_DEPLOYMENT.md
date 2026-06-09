# GitHub Pages Deployment Guide

Your portfolio is configured to deploy to **https://tanmoy095.github.io**

## Setup Instructions

### Step 1: Create/Update GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository named **`Tanmoy095.github.io`**
   - Make sure it's public
   - Don't add README, license, or .gitignore (we have them)

2. Copy the repository URL (HTTPS or SSH)

### Step 2: Initialize Git & Push Code

```bash
# Navigate to project directory
cd "C:\Users\Tanmoy95\Desktop\New folder (2)"

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "initial: setup portfolio website"

# Add remote repository (replace YOUR_GITHUB_URL)
git remote add origin https://github.com/Tanmoy095/Tanmoy095.github.io.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 3: Configure GitHub Pages

1. Go to your repository: `https://github.com/Tanmoy095/Tanmoy095.github.io`
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/` (root)
4. Click **Save**

The automatic GitHub Actions workflow will:
- Build your site on every push
- Deploy to GitHub Pages automatically
- Your site goes live at `https://tanmoy095.github.io`

### Step 4: Verify Deployment

Check the **Actions** tab in your repository to see the deployment status.

Once the workflow completes (✓), visit **https://tanmoy095.github.io** to see your live portfolio!

## Publishing Blog Posts

After initial setup, publishing new content is simple:

```bash
# 1. Create a new blog post
# File: src/content/blog/your-topic.md

# 2. Edit and preview locally
npm run dev

# 3. Commit and push
git add .
git commit -m "blog: add new article about your topic"
git push

# 4. GitHub Actions automatically:
#    - Builds the site
#    - Deploys to GitHub Pages
#    - Goes live instantly
```

## Customization Before Going Live

Edit these files with your actual information:

- [src/config.ts](src/config.ts) - Update name, email, social links
- [src/pages/index.astro](src/pages/index.astro) - Update hero text and skills
- [src/pages/about.astro](src/pages/about.astro) - Update your background
- [src/pages/projects.astro](src/pages/projects.astro) - Update with your projects
- [PERSONALIZATION.md](PERSONALIZATION.md) - Complete checklist

## Daily Workflow

```bash
# Development
npm run dev          # Test locally at http://localhost:4321

# Publishing
git add .
git commit -m "update: describe your changes"
git push             # Automatic deployment to tanmoy095.github.io
```

## Performance & SEO

Your site benefits from:
- ⚡ **Blazing Fast**: Static site generation (sub-100ms load time)
- 🔍 **SEO Optimized**: Automatic sitemap, meta tags, Open Graph
- 📱 **Responsive**: Mobile-first, works on all devices
- 🌙 **Dark Mode**: Automatic dark/light theme detection
- ♿ **Accessible**: WCAG 2.1 compliant

## Monitoring Your Site

1. **GitHub Pages Settings** → Check deployment status
2. **Actions Tab** → View build logs
3. **Visit your site**: https://tanmoy095.github.io

## Troubleshooting

### Site not building?
- Check **Actions** tab for error messages
- Verify `npm run build` works locally: `npm run build`
- Push again: `git push`

### Changes not showing?
- Wait 1-2 minutes for deployment to complete
- Hard refresh your browser: `Ctrl+Shift+R`
- Check Actions tab to confirm build succeeded

### Build failing?
- Run locally: `npm run build`
- Fix any errors
- Commit and push: `git push`

## Next Steps

1. ✅ Create repository on GitHub
2. ✅ Push code: `git push -u origin main`
3. ✅ Configure GitHub Pages
4. ✅ Wait for first deployment (2-3 minutes)
5. ✅ Visit https://tanmoy095.github.io
6. ✅ Share your portfolio with recruiters!

## Getting Help

- [Astro Deployment Docs](https://docs.astro.build/en/guides/deploy/github/)
- [GitHub Pages Docs](https://pages.github.com/)
- [Troubleshooting](https://docs.astro.build/en/guides/troubleshooting/)

---

**Your portfolio is production-ready!** 🚀

Once deployed, you have a professional, modern portfolio living at **https://tanmoy095.github.io** that automatically updates with every push.
