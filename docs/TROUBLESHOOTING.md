# Troubleshooting Guide: Fix Common Issues

## 🔍 Table of Common Issues

1. [Blog post not appearing](#1-blog-post-not-appearing)
2. [Changes not showing on live site](#2-changes-not-showing-on-live-site)
3. [Site build fails](#3-site-build-fails)
4. [Colors didn't change](#4-colors-didnt-change)
5. [Theme toggle not working](#5-theme-toggle-not-working)
6. [Links not working](#6-links-not-working)
7. [Styles look weird](#7-styles-look-weird)
8. [Blog post shows as draft](#8-blog-post-shows-as-draft)
9. [Image not displaying](#9-image-not-displaying)
10. [Git push failed](#10-git-push-failed)

---

## 1. Blog Post Not Appearing

### Symptom
You created a blog post but it doesn't show on the blog page.

### Quick Checklist
- ✅ File is in `src/content/blog/` (NOT in `src/pages/blog/`)
- ✅ File ends with `.md`
- ✅ Filename uses kebab-case: `my-post.md` ✓, `myPost.md` ✗
- ✅ Frontmatter is valid YAML (check spacing)
- ✅ Date format is `YYYY-MM-DD`

### Solution

**Check file location:**
```
✓ CORRECT:  src/content/blog/my-post.md
✗ WRONG:    src/pages/blog/my-post.md
```

**Verify frontmatter syntax:**
```yaml
---
title: "Title"           # Quotes required
description: "Desc"
date: 2026-06-15        # Format: YYYY-MM-DD
tags: ["tag1", "tag2"]  # Square brackets, lowercase
---
```

**Common frontmatter errors:**
```yaml
# ✗ WRONG - missing quotes
title: My Title

# ✓ CORRECT - with quotes
title: "My Title"

# ✗ WRONG - wrong date format
date: June 15, 2026

# ✓ CORRECT - YYYY-MM-DD
date: 2026-06-15

# ✗ WRONG - no quotes around tags
tags: [tag1, tag2]

# ✓ CORRECT - with quotes
tags: ["tag1", "tag2"]
```

**Test locally:**
```bash
npm run dev
```
If still not showing, check the terminal for error messages.

---

## 2. Changes Not Showing on Live Site

### Symptom
You made changes, deployed them, but the website still shows the old version.

### Solution

**Step 1: Verify you pushed to GitHub**
```bash
git log --oneline -3
```
You should see your commit message at the top.

**Step 2: Check deployment status**
Visit: https://github.com/Tanmoy095/Tanmoy095.github.io/actions

Look for:
- Green ✅ checkmark = deployment succeeded
- Red ✗ X mark = deployment failed (click to see error)
- Yellow ⏳ circle = deployment in progress

**Step 3: Wait for deployment**
GitHub Actions takes 1-2 minutes. Don't refresh too early!

**Step 4: Hard refresh your browser**
Press: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

This clears the cache and forces the browser to get the latest version.

**Step 5: Check if build failed**
Click on the failed workflow run to see the error.

Common errors:
- Syntax error in frontmatter (missing quotes)
- Invalid date format
- Broken import path

---

## 3. Site Build Fails

### Symptom
When you try to deploy, you get an error message in GitHub Actions.

### Solution

**Step 1: Build locally to see the error**
```bash
npm run build
```

Terminal will show error message like:
```
Error: Expected '}'  at line 15 in config.ts
```

**Step 2: Fix the syntax error**
- Typo in quotes: `title: "Post Title ` (missing closing quote)
- Missing comma: `title: "Post", description: "Desc" ` ← comma needed
- Invalid YAML: Check spacing in frontmatter

**Step 3: Common build errors:**

**Error: "Expected ':' but got ','"**
```yaml
# ✗ WRONG
---
title "My Post"
---

# ✓ CORRECT
---
title: "My Post"
---
```

**Error: Invalid number or unexpected symbol**
```typescript
// ✗ WRONG - extra bracket
colors: {
  primary: "#6366f1",
}

// ✓ CORRECT
colors: {
  primary: "#6366f1"
}
```

**Error: Unexpected character**
```markdown
# ✗ WRONG - missing backticks
This is code: console.log("hello")

# ✓ CORRECT - with backticks
This is code: `console.log("hello")`
```

**Step 4: After fixing, test and deploy**
```bash
npm run build
npm run dev
git add .
git commit -m "fix: correct syntax errors"
git push origin main
```

---

## 4. Colors Didn't Change

### Symptom
You changed colors in `tailwind.config.mjs` but the site still shows old colors.

### Solution

**Step 1: Rebuild the site**
```bash
npm run build
```

Color changes require a full rebuild.

**Step 2: Verify the color code is valid**
```javascript
// ✓ CORRECT formats
primary: "#6366f1"      // Hex code with #
primary: "#06b6d4"      // 6 characters after #

// ✗ WRONG formats
primary: "6366f1"       // Missing #
primary: "#6366f"       // Only 4 characters
primary: "#6366f1ff"    // Too many characters
```

**Step 3: Make sure you saved the file**
Press: `Ctrl + S`

**Step 4: Check if you're editing the right file**
```
✓ CORRECT: tailwind.config.mjs
✗ WRONG:   tailwind.config.js
```

**Step 5: After rebuild, deploy**
```bash
git add .
git commit -m "style: update colors"
git push origin main
```

**Step 6: Clear browser cache**
- Press: `Ctrl + Shift + Delete`
- Select "All time"
- Click "Clear data"
- Refresh page

---

## 5. Theme Toggle Not Working

### Symptom
Dark/light mode button doesn't toggle the theme.

### Solution

**Check if component is included**
The theme toggle is in `src/components/Header.astro`. It should be there automatically.

**Clear browser storage:**
1. Right-click page → "Inspect" (F12)
2. Go to "Application" tab
3. Click "Local Storage"
4. Find your site
5. Delete all entries
6. Refresh page

**Test locally:**
```bash
npm run dev
```
Then test dark mode toggle at http://localhost:3000

If it works locally but not on live site, might be a caching issue. Try:
```bash
npm run build
git add .
git commit -m "fix: rebuild for theme"
git push origin main
```

---

## 6. Links Not Working

### Symptom
Clicking a link goes to wrong page or shows 404.

### Solution

**Check link format:**

```astro
<!-- ✓ CORRECT - internal links without domain -->
<a href="/">Home</a>
<a href="/about">About</a>
<a href="/blog">Blog</a>
<a href="/blog/my-post">Individual post</a>

<!-- ✓ CORRECT - external links with https:// -->
<a href="https://github.com/username">GitHub</a>
<a href="https://linkedin.com/in/profile">LinkedIn</a>

<!-- ✗ WRONG - missing https:// on external links -->
<a href="github.com/username">GitHub</a>

<!-- ✗ WRONG - adding domain to internal links -->
<a href="https://tanmoy095.github.io/about">About</a>
```

**Common link mistakes:**

| Wrong | Correct | Why |
|-------|---------|-----|
| `href="/blog/my-post.md"` | `href="/blog/my-post"` | Remove .md extension |
| `href="/blog/my post"` | `href="/blog/my-post"` | Use kebab-case, no spaces |
| `href="github.com/user"` | `href="https://github.com/user"` | Need https:// |
| `href="/about.astro"` | `href="/about"` | Remove .astro extension |

**Test your links:**
1. Open each page
2. Click every link
3. Make sure they work

---

## 7. Styles Look Weird

### Symptom
Buttons look different, spacing is wrong, colors are off.

### Solution

**Step 1: Rebuild CSS**
```bash
npm run build
```

**Step 2: Clear browser cache**
- Press: `Ctrl + Shift + Delete`
- Select "All time"
- Click "Clear data"
- Refresh

**Step 3: Test locally**
```bash
npm run dev
```
Check if styles look correct at http://localhost:3000

**Step 4: Check for CSS syntax errors**

In `src/styles/global.css`:
```css
/* ✗ WRONG - missing closing brace */
.card {
  padding: 1rem;

/* ✓ CORRECT - with closing brace */
.card {
  padding: 1rem;
}
```

**Step 5: Deploy clean version**
```bash
git add .
git commit -m "style: rebuild styling"
git push origin main
```

---

## 8. Blog Post Shows as Draft

### Symptom
Blog post appears on blog listing but marked as "Draft".

### Solution

**Check date in frontmatter:**

Blog posts are automatically published when:
- Date is not in the future
- Date is in format: `YYYY-MM-DD`

```yaml
# ✗ WRONG - future date
date: 2026-12-25  # If today is before this

# ✓ CORRECT - today or before
date: 2026-06-10  # Today or past date

# ✓ CORRECT - format
date: 2026-06-10  # YYYY-MM-DD only
```

**Update to today's date:**
```yaml
# Get today's date and use it
date: 2026-06-10
```

---

## 9. Image Not Displaying

### Symptom
Image shows broken icon instead of actual image.

### Solution

**Check image location:**

```
✓ CORRECT LOCATION:  public/image.jpg
✗ WRONG LOCATION:    src/assets/image.jpg
```

Images must be in the `public/` folder.

**Check image reference:**

```markdown
<!-- ✓ CORRECT - leading slash -->
![Alt text](/image.jpg)
![My image](/blog/my-image.png)

<!-- ✗ WRONG - no leading slash -->
![Alt text](image.jpg)
![Alt text](../public/image.jpg)
```

**Step 1: Move image to `public/` folder**

If image is in `src/assets/`, move it to `public/`.

**Step 2: Update markdown link**

```markdown
![Description](/image-name.jpg)
```

**Step 3: Commit and deploy**

```bash
git add public/image-name.jpg
git add src/content/blog/post.md
git commit -m "blog: add image to post"
git push origin main
```

---

## 10. Git Push Failed

### Symptom
When you run `git push`, you get an error message.

### Solution

**Error: "fatal: unable to access repository"**

```bash
# Check your internet connection first
# Then try:
git push origin main

# If still fails, try:
git config credential.helper store
git push origin main
```

**Error: "rejected"**

```bash
# Someone pushed before you, pull first
git pull origin main
git push origin main
```

**Error: "permission denied"**

- Check you're logged in to GitHub
- Check you have write access to the repo
- Verify SSH key is set up (if using SSH)

**Error: "fatal: 'origin' does not appear to be a 'git' repository"**

```bash
# You're not in the right directory
# Navigate to project folder:
cd "c:\Users\Tanmoy95\Desktop\New folder (2)"
git push origin main
```

---

## 🆘 Still Stuck?

### Quick Debug Process

1. **Run locally first**
   ```bash
   npm run dev
   ```
   Does it work locally? If yes, likely caching or build issue.

2. **Check error messages**
   - Terminal output (when running npm run build)
   - GitHub Actions tab (workflow errors)

3. **Check git status**
   ```bash
   git status
   ```
   Are your changes staged?

4. **View last commits**
   ```bash
   git log --oneline -3
   ```
   Did your commit push successfully?

5. **Check deployed version**
   ```bash
   git branch -a
   ```
   Is gh-pages branch updated?

### Common Error Messages & Fixes

| Error | Meaning | Fix |
|-------|---------|-----|
| `fatal: not a git repository` | Not in project folder | `cd` to correct folder |
| `YAML error` | Syntax error in frontmatter | Check quotes, colons, spacing |
| `Module not found` | Missing dependency | Run `npm install` |
| `Invalid color format` | Bad hex code | Use format: `#RRGGBB` |
| `Line exceeds max length` | Too long for formatter | Break into multiple lines |

### When to Clear Cache

Clear your browser cache if:
- Changes show locally but not on live site
- Styles look wrong
- Old version showing despite deployment

How to clear:
- **Chrome/Edge**: Ctrl+Shift+Delete
- **Firefox**: Ctrl+Shift+Delete  
- **Safari**: Command+Y, then "Clear History"

---

## 📞 Getting Help

If you're really stuck:

1. **Check the docs:**
   - Astro: https://docs.astro.build
   - Markdown: https://www.markdownguide.org
   - Tailwind: https://tailwindcss.com/docs

2. **Review existing examples:**
   - Look at other blog posts for format examples
   - Copy and modify existing projects

3. **Test step by step:**
   - Make one small change
   - Test it
   - Deploy it
   - Verify it works
   - Then make next change

Remember: Most issues are syntax errors (quotes, commas, spaces). Double-check formatting!
