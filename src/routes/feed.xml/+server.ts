import { allPosts } from "$lib/posts";
import { SITE } from "$lib/site";

export const prerender = true;

const escape = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Atom 1.0: titles, dates, summaries and tags; readers follow the link for the full post
export function GET() {
  const posts = allPosts();
  const updated = posts.length
    ? `${posts[0].date}T00:00:00Z`
    : new Date(0).toISOString();
  const entries = posts
    .map((post) => {
      const url = `${SITE.url}/blog/${post.slug}`;
      return `	<entry>
		<title>${escape(post.title)}</title>
		<link href="${url}"/>
		<id>${url}</id>
		<published>${post.date}T00:00:00Z</published>
		<updated>${post.date}T00:00:00Z</updated>
		<summary>${escape(post.description)}</summary>
${post.tags.map((tag) => `		<category term="${escape(tag)}"/>`).join("\n")}
	</entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<title>${escape(`${SITE.name} · ${SITE.title}`)}</title>
	<subtitle>${escape(SITE.description)}</subtitle>
	<link href="${SITE.url}/feed.xml" rel="self"/>
	<link href="${SITE.url}/"/>
	<id>${SITE.url}/</id>
	<updated>${updated}</updated>
	<author><name>${escape(SITE.name)}</name></author>
${entries}
</feed>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
