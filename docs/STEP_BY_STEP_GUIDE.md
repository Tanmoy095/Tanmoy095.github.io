# Step-by-Step Visual Guide: How to Edit Everything

## 🎯 GOAL: Write Your First Blog Post

### Step 1: Create New File
```
Right-click on folder: src/content/blog/
Create new file: my-first-post.md
```

Visual structure:
```
src/
  content/
    blog/
      ✅ my-first-post.md        ← Create here
      gpu-resource-management.md
      kubernetes-scale.md
      scalable-ai-infrastructure.md
```

### Step 2: Add Metadata (Copy-Paste This)

Open `my-first-post.md` and paste at the top:

```yaml
---
title: "Your Post Title Goes Here"
description: "One sentence summary of the post"
date: 2026-06-15
author: "Your Name"
tags: ["infrastructure", "kubernetes", "devops"]
---
```

⚠️ **Important:** 
- Keep the `---` lines (they're special markers)
- Date format must be: `YYYY-MM-DD`
- Tags should be in square brackets `[ ]`

### Step 3: Write Your Content

After the second `---`, write whatever you want:

```markdown
# My Amazing Blog Post

This is my first blog post! Here's what I learned:

## Key Learnings

- Point 1
- Point 2
- Point 3

## Code Example

\`\`\`python
def hello():
    print("Hello World")
\`\`\`

## Conclusion

Thanks for reading!
```

### Step 4: Save the File

Click File → Save (or Ctrl+S)

### Step 5: Preview Locally (Optional but Recommended)

Open terminal in VS Code and run:

```bash
npm run dev
```

You'll see:
```
> Local:    http://localhost:3000/
```

Visit that link in your browser to see your post before publishing!

### Step 6: Deploy (Publish to the Web)

Open terminal and run these commands one by one:

```bash
# Step 1: Add the file
git add src/content/blog/my-first-post.md

# Step 2: Describe what you changed
git commit -m "blog: add my first post about infrastructure"

# Step 3: Upload to GitHub
git push origin main
```

### Step 7: Verify It's Live

- Wait 1-2 minutes
- Visit: https://tanmoy095.github.io/blog
- Your post should appear at the top! ✨

---

## 🎯 GOAL: Edit Your Skills

### Step 1: Open the Configuration File

Navigate to: `src/config.ts`

### Step 2: Find the Skills Section

Look for this part (around line 20):

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
  // ... more categories
]
```

### Step 3: Edit Skills

Add, remove, or modify any items:

```typescript
// BEFORE:
items: ["MLOps", "CUDA", "Distributed Training", "Model Serving"]

// AFTER (added "LLM Fine-tuning"):
items: ["MLOps", "CUDA", "Distributed Training", "Model Serving", "LLM Fine-tuning"]

// AFTER (removed "CUDA"):
items: ["MLOps", "Distributed Training", "Model Serving"]
```

### Step 4: Save and Deploy

```bash
git add src/config.ts
git commit -m "config: update skills"
git push origin main
```

✨ Your skills now appear on:
- Homepage (skills grid)
- About page
- Header

---

## 🎯 GOAL: Change Your Colors

### Step 1: Open Color Configuration

Navigate to: `tailwind.config.mjs`

### Step 2: Find the Colors Section

Look for this part (around line 10-15):

```javascript
colors: {
  primary: "#6366f1",      ← Main color
  secondary: "#ec4899",    ← Secondary color
  accent: "#06b6d4"        ← Accent color
}
```

### Step 3: Change a Color

Pick a new color from this list:

| Color | Code |
|-------|------|
| 🔴 Red | `#ef4444` |
| 🟠 Orange | `#f97316` |
| 🟡 Yellow | `#eab308` |
| 🟢 Green | `#22c55e` |
| 🔵 Blue | `#3b82f6` |
| 🟣 Purple | `#8b5cf6` |
| 🩷 Pink | `#ec4899` |
| 🟦 Indigo | `#6366f1` |

Example - change primary color to blue:

```javascript
// BEFORE:
primary: "#6366f1",   // Was indigo

// AFTER:
primary: "#3b82f6",   // Now blue
```

### Step 4: Save and Deploy

```bash
git add tailwind.config.mjs
git commit -m "style: change colors to blue theme"
git push origin main
```

### Step 5: See Your Changes

- Wait 1-2 minutes
- Visit: https://tanmoy095.github.io
- Everything with the primary color now shows your new color! 🎨

---

## 🎯 GOAL: Update Your Name & Contact

### Step 1: Open Configuration

Navigate to: `src/config.ts`

### Step 2: Find and Update

```typescript
// Line 3-5 (approximate)
siteName: "Your New Name Portfolio",
author: "Your New Name",
email: "newemail@example.com",

// Social links (around line 13-17)
social: {
  github: "https://github.com/YourGitHub",
  linkedin: "https://linkedin.com/in/yourprofile",
  twitter: "https://twitter.com/yourhandle",
}
```

### Step 3: Save and Deploy

```bash
git add src/config.ts
git commit -m "config: update personal information"
git push origin main
```

---

## 🎯 GOAL: Add a New Project

### Step 1: Open Projects Page

Navigate to: `src/pages/projects.astro`

### Step 2: Find Where to Add

Look for this comment (around line 60):
```html
<!-- Add more projects below -->
```

### Step 3: Copy and Paste Project Template

```astro
<div class="card border-l-4 border-primary">
  <div>
    <h3 class="text-xl font-bold">Your Project Title</h3>
    <p class="text-gray-700 dark:text-gray-300">
      What does your project do? What problem does it solve?
    </p>
  </div>
  <div>
    <p class="text-sm font-semibold">Impact:</p>
    <p>Performance improvement or metric: "50% faster", "$100k saved", "10x scale"</p>
  </div>
  <div class="flex flex-wrap gap-2">
    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded">Tech1</span>
    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded">Tech2</span>
    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded">Tech3</span>
  </div>
  <div class="flex gap-4 mt-4">
    <a href="https://github.com/repo" class="text-primary hover:underline">View Code</a>
    <a href="https://demo-url.com" class="text-primary hover:underline">Live Demo</a>
  </div>
</div>
```

### Step 4: Edit to Your Project

Replace the placeholders:
- "Your Project Title" → actual project name
- Description → what your project does
- Impact → measurable result
- Tech1, Tech2, Tech3 → technologies used
- Links → your GitHub/demo URLs

### Step 5: Save and Deploy

```bash
git add src/pages/projects.astro
git commit -m "projects: add new infrastructure project"
git push origin main
```

---

## 🎯 GOAL: Edit Your About Page

### Step 1: Open About Page

Navigate to: `src/pages/about.astro`

### Step 2: Find Sections to Edit

Look for these sections (you can edit them):

```astro
<!-- Introduction section - around line 30 -->
<p>Hi! I'm a Senior AI Infrastructure Engineer...</p>

<!-- Experience section - around line 50 -->
<h3>Work Experience</h3>

<!-- Education section - around line 70 -->
<h3>Education</h3>

<!-- Current focus - around line 90 -->
<p>Currently focused on...</p>
```

### Step 3: Edit the Content

Replace with your own information:

```astro
<!-- BEFORE -->
<p>Hi! I'm a Senior AI Infrastructure Engineer with 5+ years of experience 
building scalable ML systems at scale...</p>

<!-- AFTER - your version -->
<p>Hi! I'm a Software Engineer with 3+ years of experience in cloud infrastructure 
and DevOps...</p>
```

### Step 4: Save and Deploy

```bash
git add src/pages/about.astro
git commit -m "about: update bio and experience"
git push origin main
```

---

## 🎯 GOAL: Update Social Links

### Step 1: Open Config

Navigate to: `src/config.ts`

### Step 2: Update Social URLs

```typescript
social: {
  github: "https://github.com/YourUsername",        // Change this
  linkedin: "https://linkedin.com/in/yourprofile",   // Change this
  twitter: "https://twitter.com/yourhandle",         // Change this
}
```

Get your URLs:
- GitHub: Go to your profile → copy URL from browser
- LinkedIn: Go to your profile → click "Share" → copy URL
- Twitter: Go to your profile → copy URL from browser

### Step 3: Save and Deploy

```bash
git add src/config.ts
git commit -m "config: update social profiles"
git push origin main
```

---

## 🔄 DEPLOYMENT PROCESS (Always the Same)

No matter what you edit, deployment follows this pattern:

### Step 1: Test Locally (Optional)
```bash
npm run dev
# Test at http://localhost:3000
# Ctrl+C to stop
```

### Step 2: Stage Changes
```bash
git add .
```

### Step 3: Describe Changes
```bash
git commit -m "what you changed: brief description"
```

Good messages:
- `"blog: add post on kubernetes"`
- `"style: change primary color"`
- `"config: update contact info"`
- `"projects: add new ml project"`

### Step 4: Deploy
```bash
git push origin main
```

### Step 5: Wait & Verify
- Wait 1-2 minutes for GitHub Actions to deploy
- Visit: https://tanmoy095.github.io
- Your changes should be live! ✨

---

## 📋 File Edit Checklist

Before you deploy, make sure:

- ✅ File is in the right location
- ✅ Frontmatter (for blogs) has valid YAML
- ✅ Dates are in format: `YYYY-MM-DD`
- ✅ Links include full URL: `https://...`
- ✅ Tested locally with `npm run dev`
- ✅ Saved all files (Ctrl+S)

---

## 🆘 Something Went Wrong?

### Blog post isn't showing
1. Check file is in `src/content/blog/` (not pages)
2. Verify frontmatter format (look at existing posts)
3. Hard refresh browser: Ctrl+Shift+R

### Changes not live after 2 minutes
1. Check GitHub Actions: https://github.com/Tanmoy095/Tanmoy095.github.io/actions
2. Look for red ✗ error
3. Read error message for clue
4. Most common: Syntax error in config.ts or markdown

### Site looks broken
1. Run: `npm run build`
2. Clear browser cache
3. Try different browser

---

## 💡 Pro Tips

💡 **Always commit with good messages** - you'll thank yourself later

💡 **Test locally before deploying** - catch mistakes early

💡 **Keep blog dates recent** - posts sort by date, newest first

💡 **Use images from public folder** - reference as `/imagename.jpg`

💡 **Duplicate existing posts** - easier than starting from scratch

💡 **Skills auto-update everywhere** - edit config once, updates homepage + about

💡 **Dark mode works automatically** - users can toggle with button
