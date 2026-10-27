import { getCollection } from 'astro:content';

/** Every post, newest first. */
export async function getPosts() {
  const posts = await getCollection('posts');
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || b.id.localeCompare(a.id));
}

/** 2026-03-29 */
export const ymd = (date: Date) => date.toISOString().slice(0, 10);
