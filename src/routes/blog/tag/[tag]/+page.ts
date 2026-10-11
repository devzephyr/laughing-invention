import { error } from '@sveltejs/kit';
import { allPosts } from '$lib/posts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	[...new Set(allPosts().flatMap((post) => post.tags))].map((tag) => ({ tag }));

export const load: PageLoad = ({ params }) => {
	const posts = allPosts().filter((post) => post.tags.includes(params.tag));
	if (!posts.length) error(404, 'No posts with that tag');
	return { tag: params.tag, posts };
};
