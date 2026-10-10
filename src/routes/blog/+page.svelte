<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Blog - Security Research</title>
	<meta name="description" content="Latest cybersecurity research, vulnerability analysis, and exploits." />
</svelte:head>

<div class="content-container">
	<header>
		<h1 class="mono primary">Research Blog</h1>
		<p class="mono secondary">Vulnerability analysis, proof of concepts, and code reviews</p>
	</header>

	<div class="section">
		<div class="posts-list">
			{#each data.posts as post}
				<article class="post-card">
					<time class="mono tertiary">{post.date}</time>
					<h2 class="mono primary">
						<a href="/blog/{post.slug}">{post.title}</a>
					</h2>
					<p class="mono secondary">{post.description}</p>
					{#if post.tags && post.tags.length > 0}
						<div class="tags">
							{#each post.tags as tag}
								<span class="tag mono tertiary">{tag}</span>
							{/each}
						</div>
					{/if}
				</article>
			{/each}
		</div>
	</div>
</div>

<style>
	header {
		padding: var(--spacing-16) var(--spacing-4) var(--spacing-8);
	}

	header h1 {
		margin-bottom: var(--spacing-2);
	}

	.posts-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-8);
	}

	/* The title link stretches over the whole card, so the card is the link */
	.post-card {
		position: relative;
		border: var(--border-base) solid var(--color-slate-150);
		border-radius: var(--radius-md);
		padding: var(--spacing-6);
		transition:
			border-color var(--transition-base),
			transform var(--transition-press);
	}

	.post-card h2 a::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.post-card:active {
		border-color: var(--color-natural);
		transform: scale(0.98);
	}

	.post-card:has(a:focus-visible) {
		outline: 2px solid var(--lavender-500);
		outline-offset: 2px;
	}

	.post-card h2 a:focus-visible {
		outline: none;
	}

	@media (hover: hover) {
		.post-card:hover {
			border-color: var(--color-natural);
		}

		.post-card:hover h2 a {
			color: var(--color-natural);
		}
	}

	.post-card time {
		display: block;
		margin-bottom: var(--spacing-2);
		font-size: var(--text-sm);
	}

	.post-card h2 {
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
		background-color: var(--color-slate-100);
		padding: var(--spacing-1) var(--spacing-3);
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
	}
</style>
