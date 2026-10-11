<script lang="ts">
	import type { PostMeta } from '$lib/posts';

	let { posts }: { posts: PostMeta[] } = $props();

	// Posts arrive newest first, so each year's posts are already together and in order
	const years = $derived(
		posts.reduce<[string, PostMeta[]][]>((groups, post) => {
			const year = post.date.slice(0, 4);
			if (groups.at(-1)?.[0] === year) groups.at(-1)![1].push(post);
			else groups.push([year, [post]]);
			return groups;
		}, [])
	);
</script>

{#each years as [year, group] (year)}
	<section class="year" aria-labelledby="year-{year}">
		<h2 id="year-{year}" class="mono tertiary">{year}</h2>
		<div class="posts-list">
			{#each group as post (post.slug)}
				<article class="post-card">
					<time class="mono tertiary" datetime={post.date}>{post.date}</time>
					<h3 class="mono primary">
						<a href="/blog/{post.slug}">{post.title}</a>
					</h3>
					<p class="mono secondary">{post.description}</p>
					{#if post.tags.length > 0}
						<div class="tags">
							{#each post.tags as tag (tag)}
								<a href="/blog/tag/{tag}" class="tag mono tertiary">{tag}</a>
							{/each}
						</div>
					{/if}
				</article>
			{/each}
		</div>
	</section>
{/each}

<style>
	.year + .year {
		margin-top: var(--spacing-12);
	}

	.year h2 {
		margin-bottom: var(--spacing-4);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.posts-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-8);
	}

	/* The title link stretches over the whole card, so the card is the link; tags sit above it */
	.post-card {
		position: relative;
		border: var(--border-base) solid var(--color-slate-150);
		border-radius: var(--radius-md);
		padding: var(--spacing-6);
		transition:
			border-color var(--transition-base),
			transform var(--transition-press);
	}

	.post-card h3 a::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.post-card:active:not(:has(.tag:active)) {
		border-color: var(--color-natural);
		transform: scale(0.98);
	}

	.post-card:has(h3 a:focus-visible) {
		outline: 2px solid var(--lavender-500);
		outline-offset: 2px;
	}

	.post-card h3 a:focus-visible {
		outline: none;
	}

	@media (hover: hover) {
		.post-card:hover {
			border-color: var(--color-natural);
		}

		.post-card:hover h3 a {
			color: var(--color-natural);
		}

		.tag:hover {
			color: var(--color-natural);
		}
	}

	.post-card time {
		display: block;
		margin-bottom: var(--spacing-2);
		font-size: var(--text-sm);
	}

	.post-card h3 {
		margin-bottom: var(--spacing-3);
	}

	.post-card p {
		margin-bottom: var(--spacing-4);
	}

	.tags {
		display: flex;
		gap: var(--spacing-2);
		flex-wrap: wrap;
	}

	.tag {
		position: relative;
		z-index: 1;
		background-color: var(--color-slate-100);
		padding: var(--spacing-1) var(--spacing-3);
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
	}
</style>
