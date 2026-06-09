import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://tanmoy095.github.io',
  integrations: [tailwind()],
  output: 'static',
  outDir: './dist',
  trailingSlash: 'always',
});
