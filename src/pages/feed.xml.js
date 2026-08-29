import rss from '@astrojs/rss';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { getPublishedPosts } from '../utils/posts';

const parser = new MarkdownIt();

// Path matters: jekyll-feed published at /feed.xml, so keeping that exact URL
// is what stops existing subscribers from silently dropping off. The format
// does change from Atom to RSS 2.0, which readers handle transparently.
export async function GET(context) {
  const posts = await getPublishedPosts();

  return rss({
    title: 'Chalmovský',
    description: 'Writings from (and often to) Chalmovský',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/posts/${post.id}/`,
      content: sanitizeHtml(parser.render(post.body ?? ''), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
    })),
    customData: '<language>en</language>',
  });
}
