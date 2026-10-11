import { allPosts } from "$lib/posts";
import { SITE } from "$lib/site";

export const prerender = true;

const PAGES = ["/", "/blog", "/resume", "/security", "/privacy"];

export function GET() {
  const posts = allPosts();
  const latest = posts[0]?.date;
  const urls = [
    ...PAGES.map((path) => ({
      loc: SITE.url + path,
      lastmod: path === "/" || path === "/blog" ? latest : undefined,
    })),
    ...posts.map((post) => ({
      loc: `${SITE.url}/blog/${post.slug}`,
      lastmod: post.date,
    })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `	<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
