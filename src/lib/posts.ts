/** One advisory the author reported, from a post's frontmatter. Every value is quoted from the post. */
export interface Advisory {
	id?: string;
	/** GitHub owner/name that published the advisory; with id, links to its advisory page */
	repo?: string;
	cve?: string;
	product: string;
	kind: string;
	affected?: string;
	fixed?: string;
	/** CVSS score as published, or the vendor's rating when no score was given */
	severity?: string;
}

export interface PostMeta {
	slug: string;
	title: string;
	description: string;
	date: string;
	tags: string[];
	advisories?: Advisory[];
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
