<script lang="ts">
	import Seo from '$lib/Seo.svelte';
	import PostList from '$lib/PostList.svelte';
	import { allPosts } from '$lib/posts';

	const posts = allPosts();
	let query = $state('');

	// Every word typed has to appear somewhere in the title, description or tags
	const shown = $derived.by(() => {
		const words = query.toLowerCase().split(/\s+/).filter(Boolean);
		if (!words.length) return posts;
		return posts.filter((post) => {
			const text = [post.title, post.description, ...post.tags].join(' ').toLowerCase();
			return words.every((word) => text.includes(word));
		});
	});
</script>

<Seo title="Blog · Adeyemi Folarin" description="Every post: vulnerability disclosures, exploit analysis and CTF writeups." />

<div class="content-container">
	<header>
		<h1 class="mono primary">Research Blog</h1>
		<p class="mono secondary">Vulnerability analysis, proof of concepts, and code reviews</p>
		<input
			class="filter mono"
			type="search"
			bind:value={query}
			aria-label="Filter posts"
			placeholder="Filter posts"
			autocomplete="off"
			spellcheck="false"
		/>
		<p class="mono tertiary count" aria-live="polite">
			{query.trim() ? `${shown.length} of ${posts.length} posts` : ''}
		</p>
	</header>

	<div class="section">
		{#if shown.length}
			<PostList posts={shown} />
		{:else}
			<p class="mono secondary">No posts match "{query.trim()}".</p>
		{/if}
	</div>
</div>

<style>
	header {
		padding: var(--spacing-16) var(--spacing-4) var(--spacing-4);
	}

	header h1 {
		margin-bottom: var(--spacing-2);
	}

	.filter {
		display: block;
		margin-top: var(--spacing-8);
		width: 100%;
		font: inherit;
		font-size: var(--text-sm);
		color: var(--color-black-100);
		background-color: transparent;
		border: var(--border-base) solid var(--color-slate-150);
		border-radius: var(--radius-md);
		padding: var(--spacing-2) var(--spacing-3);
	}

	.filter:focus-visible {
		outline: 2px solid var(--lavender-500);
		outline-offset: 2px;
	}

	.count {
		min-height: 1.5em;
		margin-top: var(--spacing-2);
		font-size: var(--text-xs);
	}
</style>
