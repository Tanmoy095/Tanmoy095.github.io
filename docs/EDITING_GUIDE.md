# Complete Editing & Control Guide for Your Portfolio

Welcome! This guide covers everything you need to edit, customize, and manage your Astro portfolio website. Follow the sections below to manage different aspects of your site.

---

## Table of Contents
1. [Writing & Managing Blog Posts](#writing--managing-blog-posts)
2. [Editing Your Projects](#editing-your-projects)
3. [Updating Personal Information](#updating-personal-information)
4. [Customizing Skills & Expertise](#customizing-skills--expertise)
5. [Styling & Theme Customization](#styling--theme-customization)
6. [Deploying Your Changes](#deploying-your-changes)
7. [Directory Structure Reference](#directory-structure-reference)

---

## Writing & Managing Blog Posts

### ✍️ Creating a New Blog Post

**Step 1: Create the file**
- Navigate to: `src/content/blog/`
- Create a new file with format: `my-blog-title.md` (use kebab-case for names)

**Step 2: Add frontmatter metadata**
```yaml
---
title: "Your Blog Post Title"
description: "A short description for preview and SEO"
date: 2026-06-15
author: "Your Name"
tags: ["tag1", "tag2", "tag3"]
image: "/blog-image.jpg" (optional)
---
```

**Step 3: Write your content**
Use Markdown formatting:
```markdown
# Main Heading
## Subheading
### Section heading

Regular paragraph text here.

- Bullet point 1
- Bullet point 2

1. Numbered item
2. Another item

**Bold text** and *italic text*

[Link text](https://example.com)

\`\`\`python
# Code block example
def hello():
    print("Hello World")
\`\`\`
```

**Step 4: Publish**
- Save the file
- Commit and push to main branch:
  ```bash
  git add src/content/blog/my-blog-title.md
  git commit -m "blog: add new post about topic"
  git push origin main
  ```
- Site auto-deploys in ~2 minutes

### 📝 Editing an Existing Blog Post

**Step 1: Open the file**
- Navigate to: `src/content/blog/filename.md`

**Step 2: Edit content**
- Modify the frontmatter (title, description, date, tags)
- Update the Markdown content below

**Step 3: Save and deploy**
```bash
git add src/content/blog/filename.md
git commit -m "blog: update post title or content"
git push origin main
```

### 🗑️ Deleting a Blog Post

**Step 1: Remove the file**
```bash
git rm src/content/blog/blog-post-name.md
```

**Step 2: Commit and deploy**
```bash
git commit -m "blog: remove outdated post"
git push origin main
```

**Step 3: Verify**
- The post will disappear from `/blog` within 2 minutes

---

## Editing Your Projects

### 🎯 Adding a New Project

**Open:** `src/pages/projects.astro`

Find the featured projects section and add a new project card:

```astro
<div class="card border-l-4 border-primary">
  <div>
    <h3 class="text-xl font-bold">Project Title</h3>
    <p class="text-gray-700 dark:text-gray-300">
      Brief description of what your project does and its impact.
    </p>
  </div>
  <div>
    <p class="text-sm font-semibold">Impact:</p>
    <p>Performance improvement or business metric achieved</p>
  </div>
  <div class="flex flex-wrap gap-2">
    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded">Tech1</span>
    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded">Tech2</span>
    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded">Tech3</span>
  </div>
  <div class="flex gap-4 mt-4">
    <a href="#" class="text-primary hover:underline">View Code</a>
    <a href="#" class="text-primary hover:underline">Live Demo</a>
  </div>
</div>
```

**Deploy:**
```bash
git add src/pages/projects.astro
git commit -m "projects: add new project"
git push origin main
```

### ✏️ Editing a Project

**Open:** `src/pages/projects.astro`

- Find the project card you want to edit
- Update title, description, metrics, tech tags, or links
- Save and deploy (same commands as above)

### ❌ Deleting a Project

- Find the entire `<div class="card">` block for that project
- Delete the entire block (all the HTML)
- Commit and push

---

## Updating Personal Information

### 👤 Edit Your Name & Contact Info

**File:** `src/config.ts`

```typescript
export const SITE_CONFIG = {
  siteName: "Your Name Portfolio",
  description: "Your professional tagline",
  author: "Your Full Name",
  email: "your.email@example.com",  // Change this
  location: "City, Country",
  
  // Social links
  social: {
    github: "https://github.com/YourUsername",      // Update
    linkedin: "https://linkedin.com/in/yourprofile", // Update
    twitter: "https://twitter.com/yourhandle",       // Update
  },
  
  // ... rest of config
}
```

**Save and deploy:**
```bash
git add src/config.ts
git commit -m "config: update personal information"
git push origin main
```

### 📋 Edit About Page

**File:** `src/pages/about.astro`

Update:
- Your introduction/bio
- Job titles and companies
- Years of experience
- Education details
- Current focus areas

Example section to update:
```astro
<p>
  Hi! I'm a Senior AI Infrastructure Engineer with 5+ years of experience 
  building scalable ML systems...
</p>

<h3>Work Experience</h3>
<div class="job-card">
  <h4>Position Title</h4>
  <p class="company">Company Name • 2024 - Present</p>
  <p>Description of your role and achievements</p>
</div>
```

**Deploy:** Same `git add, commit, push` workflow

---

## Customizing Skills & Expertise

### 🎓 Update Skills in Configuration

**File:** `src/config.ts`

Find the `skills` array and update:

```typescript
skills: [
  {
    category: "AI Infrastructure",
    items: ["MLOps", "CUDA", "Distributed Training", "Model Serving"]
  },
  {
    category: "Cloud Platforms",
    items: ["AWS", "GCP", "Azure", "Kubernetes"]
  },
  {
    category: "Data Systems",
    items: ["Elasticsearch", "Kafka", "PostgreSQL", "Ray"]
  },
  {
    category: "Languages",
    items: ["Python", "Go", "Rust", "TypeScript"]
  }
]
```

**Deploy:**
```bash
git add src/config.ts
git commit -m "config: update skills"
git push origin main
```

### 🎯 Update Featured Skills on Homepage

**File:** `src/pages/index.astro`

The skills grid on the homepage is auto-generated from `config.ts`, so updating there updates everywhere.

---

## Styling & Theme Customization

### 🎨 Change Color Scheme

**File:** `tailwind.config.mjs`

Update the theme colors:
```javascript
theme: {
  extend: {
    colors: {
      primary: "#6366f1",      // Change this (currently indigo)
      secondary: "#ec4899",    // Change this (currently pink)
      accent: "#06b6d4",       // Change this (currently cyan)
    }
  }
}
```

**Common color options:**
- `#ef4444` (Red), `#f97316` (Orange), `#eab308` (Yellow)
- `#22c55e` (Green), `#06b6d4` (Cyan), `#3b82f6` (Blue)
- `#8b5cf6` (Purple), `#ec4899` (Pink)

**Deploy:**
```bash
git add tailwind.config.mjs
git commit -m "style: update color scheme"
git push origin main
```

### 🌈 Customize CSS Globally

**File:** `src/styles/global.css`

Edit custom components like buttons, cards, gradients:

```css
/* Custom gradient for hero text */
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Custom button styling */
.btn-primary {
  @apply px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition;
}

/* Custom card styling */
.card {
  @apply p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md 
    hover:shadow-lg transition border border-gray-200 dark:border-gray-800;
}
```

### 🌙 Adjust Dark Mode

Dark mode is automatically enabled when user has 'dark' class on `<html>` element.

To change dark mode colors, update CSS variables or Tailwind dark mode settings in `tailwind.config.mjs`

**Deploy after styling changes:**
```bash
git add src/styles/global.css
git commit -m "style: customize component styles"
git push origin main
```

---

## Navigation & Links

### 🔗 Update Navigation Menu

**File:** `src/components/Header.astro`

Find the navigation links section:

```astro
<div class="nav-links">
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/projects">Projects</a>
  <a href="/blog">Blog</a>
  <a href="#contact">Contact</a>
  <!-- Add new links here -->
</div>
```

### 📱 Update Social Links

**File:** `src/config.ts`

```typescript
social: {
  github: "https://github.com/YourUsername",
  linkedin: "https://linkedin.com/in/yourprofile",
  twitter: "https://twitter.com/yourhandle",
  // Add more: email, portfolio, etc.
}
```

Also update in `src/components/Footer.astro`:

```astro
<a href="https://github.com/YourUsername">GitHub</a>
<a href="https://linkedin.com/in/yourprofile">LinkedIn</a>
<a href="https://twitter.com/yourhandle">Twitter</a>
```

**Deploy:**
```bash
git add src/config.ts src/components/Footer.astro
git commit -m "links: update social profiles"
git push origin main
```

---

## Deploying Your Changes

### ✅ Local Testing

Before deploying, test locally:

```bash
# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

- Open: `http://localhost:3000`
- Make changes and see them live
- Ctrl+C to stop

### 🚀 Deploy to GitHub Pages

**After making changes:**

```bash
# 1. Build production files
npm run build

# 2. Stage changes
git add .

# 3. Commit
git commit -m "update: describe your changes"

# 4. Push to main (triggers auto-deploy)
git push origin main
```

**Wait 1-2 minutes**, then visit: https://tanmoy095.github.io

### 🔄 Automatic Deployment

Every time you push to `main`, GitHub Actions automatically:
1. Builds your site
2. Deploys to `gh-pages` branch
3. Updates the live site

Monitor deployment status: https://github.com/Tanmoy095/Tanmoy095.github.io/actions

---

## Common Tasks

### 📅 Update Blog Post Date

When you publish an old blog post, update the date in frontmatter to show as most recent:

```yaml
---
title: "My Blog Post"
date: 2026-06-15  # Change to today's date
---
```

### 🔗 Add Links to Projects

In `src/pages/projects.astro`, update the demo/code links:

```astro
<a href="https://github.com/yourrepo/project">View Code</a>
<a href="https://project-demo.com">Live Demo</a>
```

### 📸 Add Images to Blog Posts

1. Place image in `public/` folder
2. Reference in Markdown: `![alt text](/image-name.jpg)`

### ✨ Add New Page

1. Create file: `src/pages/page-name.astro`
2. Import layout: `import MainLayout from "../layouts/MainLayout.astro"`
3. Add to Header navigation
4. Deploy

### 🎬 Customize Hero Section

**File:** `src/pages/index.astro`

```astro
<h1 class="gradient-text text-5xl font-bold">
  Your Custom Title Here
</h1>
<p class="text-xl text-gray-600">
  Your custom subtitle/tagline
</p>
```

---

## Directory Structure Reference

```
src/
├── pages/               # Main pages (auto-routed)
│   ├── index.astro     # Homepage
│   ├── about.astro     # About page
│   ├── projects.astro  # Projects page
│   └── blog/
│       ├── index.astro # Blog listing
│       └── [slug].astro # Individual blog posts (auto-generated)
│
├── components/         # Reusable components
│   ├── Header.astro   # Navigation
│   ├── Footer.astro   # Footer
│   └── ThemeToggle.jsx # Dark mode toggle
│
├── layouts/           # Page templates
│   ├── MainLayout.astro
│   ├── BlogLayout.astro
│   └── BaseLayout.astro
│
├── content/          # Content collections
│   └── blog/
│       ├── post-1.md
│       ├── post-2.md
│       └── post-3.md
│
├── styles/          # Global styles
│   └── global.css
│
└── config.ts        # Site configuration

public/              # Static files (images, etc.)
```

---

## Troubleshooting

### Blog post not showing?
- ✓ Check file is in `src/content/blog/` (not in pages)
- ✓ Verify frontmatter is valid YAML
- ✓ Ensure date is in format: `2026-06-15`

### Changes not live?
- ✓ Wait 2+ minutes for deployment
- ✓ Check Actions tab for errors
- ✓ Hard refresh browser (Ctrl+Shift+R)

### Styling looks off?
- ✓ Run `npm run build` to rebuild
- ✓ Clear browser cache
- ✓ Verify Tailwind CSS is imported

---

## Quick Reference: Common Commands

```bash
# Development
npm run dev              # Start local server

# Production
npm run build           # Build for deployment
npm run preview         # Preview production build

# Git
git add .               # Stage all changes
git commit -m "msg"     # Commit changes
git push origin main    # Deploy to live site

# Check status
git status              # See what's changed
git log --oneline       # View commit history
```

---

## Need Help?

For technical questions:
- Check Astro docs: https://docs.astro.build
- Tailwind CSS: https://tailwindcss.com/docs
- Markdown guide: https://www.markdownguide.org

**Your site setup:** Astro 4.x + Tailwind CSS + GitHub Pages
