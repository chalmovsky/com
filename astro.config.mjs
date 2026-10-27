import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';

export default defineConfig({
  site: 'https://chalmovsky.com',
  // src/pages/posts/[id].astro builds /posts/<id>.html, the URLs the posts always had
  build: { format: 'preserve' },
  markdown: {
    // posts keep the straight quotes and plain dashes they are written with
    processor: satteri({ features: { smartPunctuation: false } }),
    syntaxHighlight: false,
  },
});
