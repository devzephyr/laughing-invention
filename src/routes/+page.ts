import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Import all markdown files from the posts directory
	const postFiles = import.meta.glob('/src/posts/*.md');

	const posts = await Promise.all(
		Object.entries(postFiles).map(async ([path, resolver]) => {
			const { metadata } = (await resolver()) as any;
			const slug = path.split('/').pop()?.replace('.md', '') || '';

			return {
				slug,
				title: metadata.title,
				description: metadata.description,
				date: metadata.date,
				tags: metadata.tags || []
			};
		})
	);

	// Sort by date, newest first
	posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	// Return only the latest post for homepage
	return {
		latestPost: posts[0] || null
	};
};
