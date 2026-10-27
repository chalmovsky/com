import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../posts';

export async function GET(context: APIContext) {
  return rss({
    title: 'Chalmovský',
    description: 'Posts by Chalmovský',
    site: context.site!,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: '<language>en</language><atom:link href="https://chalmovsky.com/feed.xml" rel="self" type="application/rss+xml"/>',
    items: (await getPosts()).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      link: `/posts/${post.id}.html`,
      // noon UTC, as the old feed had it, so readers don't see the dates move
      pubDate: new Date(post.data.date.getTime() + 12 * 3600 * 1000),
    })),
  });
}
