import { getCollection, type CollectionEntry } from 'astro:content';

/** Published posts, newest first. Drafts are excluded from every build. */
export async function getPublishedPosts(): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

const formatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

/** ISO-style YYYY-MM-DD, matching the format the Jekyll site used. */
export function formatDate(date: Date): string {
  return formatter.format(date);
}
