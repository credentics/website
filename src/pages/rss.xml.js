import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: 'Credentics',
    description: 'Notes on cloud-native security, identity, and OIDC from the Credentics team.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      author: post.data.author,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
    })),
  });
}
