import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';

export default defineConfig({
  site: 'https://chalmovsky.com',
  // src/pages/posts/[id].astro builds posts/<id>.html, which GitHub Pages serves at
  // /posts/<id> (the address the site links to) and at /posts/<id>.html (older links)
  build: { format: 'preserve' },
  markdown: {
    // posts keep the straight quotes and plain dashes they are written with
    processor: satteri({ features: { smartPunctuation: false } }),
    syntaxHighlight: false,
  },
});
