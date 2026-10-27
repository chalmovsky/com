// Posts live in src/content/posts/*.md. The file name is the URL:
// src/content/posts/my-post.md is published at /posts/my-post.html,
// listed on the home page and the Posts page, and added to feed.xml.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
  }),
});

export const collections = { posts };
