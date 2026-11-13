import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.SITE_URL || 'https://tanmoy095.github.io',
  base: process.env.PUBLIC_SITE_BASE || '/',
  output: 'static',
  outDir: './dist',
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
});
