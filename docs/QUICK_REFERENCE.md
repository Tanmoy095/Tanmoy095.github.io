# Quick Reference: Common Editing Tasks

## New Blog Post (Fastest Way)

1. Create file: `src/content/blog/post-title.md`
2. Copy-paste template below
3. Write content
4. Deploy: `git add . && git commit -m "blog: add post" && git push origin main`

**Template:**
```yaml
---
title: "Your Article Title"
description: "One-sentence summary"
date: 2026-06-15
author: "Your Name"
tags: ["tag1", "tag2"]
---

# Heading

Your content here with **bold**, *italic*, code, and links.
```

---

## Update Your Info Quickly

| What | Where | What to Change |
|------|-------|----------------|
| Name | `src/config.ts` | `author:` field |
| Email | `src/config.ts` | `email:` field |
| GitHub | `src/config.ts` | `github:` field |
| LinkedIn | `src/config.ts` | `linkedin:` field |
| Skills | `src/config.ts` | `skills: [ ]` array |
| About text | `src/pages/about.astro` | Any paragraph |
| Projects | `src/pages/projects.astro` | Card HTML sections |
| Footer | `src/components/Footer.astro` | Links and text |

---

## Edit Colors

**File:** `tailwind.config.mjs`

```javascript
colors: {
  primary: "#YOUR_COLOR",    // Main color
  secondary: "#YOUR_COLOR",  // Secondary color
  accent: "#YOUR_COLOR"      // Accent color
}
```

**Color palette:**
- Red: `#ef4444`
- Orange: `#f97316`
- Yellow: `#eab308`
- Green: `#22c55e`
- Blue: `#3b82f6`
- Purple: `#8b5cf6`
- Pink: `#ec4899`
- Indigo: `#6366f1`

---

## Blog Operations

### Add Blog Post
```bash
# 1. Create: src/content/blog/title.md
# 2. Add frontmatter + content
git add src/content/blog/title.md
git commit -m "blog: add new post"
git push origin main
```

### Edit Blog Post
```bash
# 1. Edit: src/content/blog/title.md
# 2. Update content
git add src/content/blog/title.md
git commit -m "blog: update post"
git push origin main
```

### Delete Blog Post
```bash
git rm src/content/blog/title.md
git commit -m "blog: remove post"
git push origin main
```

---

## Project Operations

### Add Project
1. Open `src/pages/projects.astro`
2. Find `<!-- Add more projects -->` comment
3. Add new `<div class="card">` block
4. Deploy

### Edit Project
1. Open `src/pages/projects.astro`
2. Find project card
3. Update title/description/tech/links
4. Deploy

### Delete Project
1. Open `src/pages/projects.astro`
2. Delete entire project `<div class="card">` block
3. Deploy

---

## Test Before Deploying

```bash
npm run dev
# Opens http://localhost:3000
# See changes live
# Ctrl+C to stop
```

---

## Deploy Your Changes

```bash
# Build
npm run build

# Deploy (pushes to main → auto-deploys)
git add .
git commit -m "describe changes"
git push origin main

# Wait 1-2 minutes
# Check: https://tanmoy095.github.io
```

---

## File Locations Cheat Sheet

| Page | File |
|------|------|
| Homepage | `src/pages/index.astro` |
| About | `src/pages/about.astro` |
| Projects | `src/pages/projects.astro` |
| Blog Listing | `src/pages/blog/index.astro` |
| Blog Posts | `src/content/blog/*.md` |
| Config | `src/config.ts` |
| Header | `src/components/Header.astro` |
| Footer | `src/components/Footer.astro` |
| Styles | `src/styles/global.css` |
| Colors | `tailwind.config.mjs` |

---

## Markdown Examples

```markdown
# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*
`inline code`

- Bullet 1
- Bullet 2

1. Numbered
2. Item

[Link text](https://url.com)

![Image alt](./image.jpg)

\`\`\`python
# Code block
print("hello")
\`\`\`
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Blog post not showing | Check file in `src/content/blog/`, verify frontmatter |
| Changes not live | Wait 2 min, check Actions tab, hard refresh |
| Site looks broken | Run `npm run build`, clear cache |
| Preview doesn't match | Test with `npm run dev` locally first |

---

## Commit Message Examples

```bash
# Blog
git commit -m "blog: add kubernetes scaling post"
git commit -m "blog: update gpu management article"
git commit -m "blog: remove outdated tutorial"

# Projects
git commit -m "projects: add new ml pipeline project"
git commit -m "projects: update impact metrics"

# Config
git commit -m "config: update contact information"
git commit -m "config: add new skills"

# Styling
git commit -m "style: change primary color to blue"
git commit -m "style: customize button appearance"
```

---

## One-Command Workflows

**Add and publish blog:**
```bash
cd src/content/blog && echo "---
title: 'Post'
description: 'Desc'
date: $(date +%Y-%m-%d)
tags: []
---

Content" > new-post.md && cd ../../.. && npm run dev
```

**Deploy all changes:**
```bash
npm run build && git add . && git commit -m "update: various changes" && git push origin main
```

---

## Pro Tips

✨ **Always test locally first:** `npm run dev`

✨ **Use descriptive commit messages** for easy history tracking

✨ **Keep blog post dates recent** so they show up first

✨ **Update skills in `config.ts`** - used everywhere automatically

✨ **Images go in `public/` folder** - reference as `/image.jpg`

✨ **Use kebab-case for file names:** `my-blog-post.md` ✓, `myBlogPost.md` ✗

✨ **Dark mode works automatically** - Tailwind handles it

✨ **Links open in same tab** - add `target="_blank"` for new tab
