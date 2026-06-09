# Your Personal Portfolio Website

A modern, recruiter-optimized portfolio website showcasing AI infrastructure expertise, projects, and technical insights.

## Features

✨ **Modern Design**
- 2026 aesthetic with dark/light theme toggle
- Smooth animations and transitions
- Fully responsive (mobile, tablet, desktop)
- High performance with optimized images

🚀 **Built with Astro**
- Static site generation for blazing-fast performance
- Markdown-based blog system with MDX support
- TypeScript for type safety
- Tailwind CSS for styling

📝 **Blog System**
- Publish technical articles and insights
- Automatic RSS feed generation
- Tag-based organization
- Search functionality (coming soon)

🎯 **Portfolio Showcase**
- Featured projects with impact metrics
- GitHub integration
- Live demo links
- Technology tag system

💼 **Recruiter-Optimized**
- SEO-friendly structure
- Open Graph meta tags
- Performance optimizations
- Clear skills showcase

## Quick Start

### Prerequisites
- Node.js 18+ (or use nvm)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your portfolio!

### Building for Production

```bash
# Build the static site
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
portfolio/
├── src/
│   ├── components/       # Reusable Astro components
│   ├── content/
│   │   ├── blog/        # Blog posts (MDX/Markdown)
│   │   └── projects/    # Project data
│   ├── layouts/         # Page layouts
│   ├── pages/           # Routes
│   ├── styles/          # Global styles
│   └── utils/           # Utility functions
├── public/              # Static assets
├── astro.config.mjs     # Astro configuration
└── tailwind.config.mjs  # Tailwind configuration
```

## Writing Blog Posts

Create a new file in `src/content/blog/`:

```mdx
---
title: "Your Article Title"
description: "Brief description for SEO"
date: 2026-06-10
author: "Your Name"
tags: ["tag1", "tag2"]
image: "/blog/article-image.jpg"
---

# Your Article Title

Your content here using Markdown...
```

## Customization

### Update Personal Info

1. **Header/Footer**: Edit `src/components/Header.astro` and `src/components/Footer.astro`
2. **Homepage**: Edit `src/pages/index.astro`
3. **About Page**: Edit `src/pages/about.astro`

### Modify Colors

Edit `tailwind.config.mjs`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#6366f1',
      secondary: '#ec4899',
      accent: '#06b6d4',
    },
  },
},
```

### Add Social Links

Update social links in `src/components/Header.astro` and `src/components/Footer.astro`

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Connect your GitHub repo in Netlify dashboard
# It automatically detects Astro and deploys on push
```

### GitHub Pages

Add to `astro.config.mjs`:
```javascript
site: 'https://yourusername.github.io'
```

Then deploy via GitHub Actions.

## SEO & Performance

- **Lighthouse Score**: Optimized for 90+
- **Core Web Vitals**: Excellent (LCP, FID, CLS)
- **SEO**: Built-in sitemap, robots.txt, meta tags
- **Analytics Ready**: Easy integration with Vercel Analytics or Plausible

## Monitoring

### What to Track

1. **Blog Performance**: Most popular articles
2. **Traffic Source**: Organic vs. social vs. direct
3. **Visitor Behavior**: Time on page, scroll depth
4. **Conversion**: Email signups, contact form submissions

### Recommended Tools

- Vercel Analytics (built-in if deployed on Vercel)
- Plausible (privacy-focused)
- Google Analytics 4 (comprehensive)

## Adding Google Analytics

```astro
<!-- In src/layouts/BaseLayout.astro -->
<script is:inline>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

## Tips for Recruiters

**What makes this portfolio stand out:**

1. ✅ Live working demos (not just screenshots)
2. ✅ Quantifiable impact (40% cost reduction, 65% faster)
3. ✅ Regular blog updates (shows active learning)
4. ✅ Open source contributions (link to GitHub)
5. ✅ Clean, professional design (attention to detail)
6. ✅ Performance metrics (fast loading, responsive)

## Daily Workflow

### Publishing a Blog Post

```bash
# 1. Create blog post
# src/content/blog/your-topic.md

# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "blog: add new article"
git push

# 4. Auto-deployed via CI/CD
```

### Updating Projects

Edit `src/pages/projects.astro` directly or create data in `src/content/projects/`

## Support

- [Astro Docs](https://docs.astro.build)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Markdown Guide](https://www.markdownguide.org/)

## License

MIT License - feel free to use for your portfolio

---

**Built with Astro + Tailwind CSS + React**

Last updated: June 2026
