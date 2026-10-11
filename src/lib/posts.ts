export interface PostMeta {
	slug: string;
	title: string;
	description: string;
	date: string;
	tags: string[];
}

// Frontmatter only: the post bodies stay out of whatever imports this
const files = import.meta.glob<Omit<PostMeta, 'slug'>>('/src/posts/*.md', { eager: true, import: 'metadata' });

/** Every post, newest first. */
export function allPosts(): PostMeta[] {
	return Object.entries(files)
		.map(([path, meta]) => ({
			...meta,
			tags: meta.tags ?? [],
			slug: path.split('/').pop()!.replace(/\.md$/, '')
		}))
		.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
