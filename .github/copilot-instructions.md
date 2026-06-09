<!-- Copilot custom instructions for this portfolio workspace -->

# Portfolio Website Development Guide

## Project Overview
Personal AI Infrastructure Engineer portfolio website built with Astro, Tailwind CSS, and React. Designed for recruiter visibility and daily technical blogging.

## Technology Stack
- **Framework**: Astro 4.x
- **Styling**: Tailwind CSS 3.x
- **Components**: React (for interactive elements)
- **Blog**: MDX + Markdown
- **Type Safety**: TypeScript
- **Build**: Static site generation (SSG)

## Development Workflow

### New Blog Post
1. Create `.md` file in `src/content/blog/`
2. Use frontmatter template (see existing posts)
3. Write in Markdown/MDX
4. Local preview: `npm run dev`
5. Commit and push (auto-deployed)

### Updating Project Info
- Edit `src/pages/projects.astro` directly
- Or maintain data in `src/content/projects/`
- Restart dev server if needed

### Making Design Changes
- Update `tailwind.config.mjs` for colors/theme
- Modify components in `src/components/`
- Check `src/styles/global.css` for custom CSS

## Key Files
- **Home**: `src/pages/index.astro`
- **Blog index**: `src/pages/blog/index.astro`
- **Blog template**: `src/pages/blog/[slug].astro`
- **Layout**: `src/layouts/MainLayout.astro`
- **Header**: `src/components/Header.astro`
- **Styling**: `src/styles/global.css` and `tailwind.config.mjs`

## Before Responding to Code Changes
1. Always check existing patterns and conventions
2. Maintain consistency with current styling approach
3. Ensure dark mode compatibility
4. Test responsive design (mobile, tablet, desktop)
5. Keep performance in mind (Astro's static generation strength)

## Common Tasks

### Add a new navigation item
1. Edit `src/components/Header.astro`
2. Add link to navigation section
3. Create corresponding page in `src/pages/`

### Modify color scheme
1. Update `theme.colors` in `tailwind.config.mjs`
2. Test with theme toggle
3. Verify contrast for accessibility

### Improve performance
1. Check build output: `npm run build`
2. Optimize images for blog posts
3. Use Astro's component lazy loading

## Deployment
- **Vercel** (recommended): Auto-deploys on git push
- **Netlify**: Also has auto-deployment
- **GitHub Pages**: Supported, use GitHub Actions

## Important Notes
- Blog posts are in `src/content/blog/` (not `src/pages/blog/`)
- Keep file naming consistent (kebab-case)
- Always include metadata frontmatter in blog posts
- Test build before commit: `npm run build`
