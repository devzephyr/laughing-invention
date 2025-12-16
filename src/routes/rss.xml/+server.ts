import type { RequestHandler } from './$types';

interface Post {
	slug: string;
	title: string;
	description: string;
	date: string;
}

export const GET: RequestHandler = async () => {
	const postFiles = import.meta.glob('/src/posts/*.md');
	const posts: Post[] = [];

	for (const [path, resolver] of Object.entries(postFiles)) {
		const { metadata } = (await resolver()) as any;
		const slug = path.split('/').pop()?.replace('.md', '') || '';
		posts.push({
			slug,
			title: metadata.title,
			description: metadata.description,
			date: metadata.date
		});
	}

	// Sort by date, newest first
	posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	const siteUrl = 'https://adeyemi.is-a.dev';
	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>Security Research Blog</title>
		<description>Cybersecurity research and vulnerability analysis</description>
		<link>${siteUrl}</link>
		<atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
		<language>en-us</language>
		<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
		${posts
			.map(
				(post) => `
		<item>
			<title>${escapeXml(post.title)}</title>
			<description>${escapeXml(post.description)}</description>
			<link>${siteUrl}/blog/${post.slug}</link>
			<guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
			<pubDate>${new Date(post.date).toUTCString()}</pubDate>
		</item>`
			)
			.join('')}
	</channel>
</rss>`;

	return new Response(rss, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};

function escapeXml(unsafe: string): string {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
