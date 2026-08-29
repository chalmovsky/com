// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://chalmovsky.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
  // Redirects for the old Jekyll permalinks live in public/2026/... as literal
  // .html files. Astro's `redirects` option can't be used here: in a static
  // build it emits each target as a directory, producing "/foo.html/" rather
  // than the "/foo.html" URL Jekyll actually served.
});
