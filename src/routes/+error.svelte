<script lang="ts">
	import { page } from '$app/state';

	// Titles only: the post bodies stay out of this page's bundle
	const posts = Object.entries(
		import.meta.glob<{ title: string; date: string }>('/src/posts/*.md', { eager: true, import: 'metadata' })
	).map(([path, meta]) => ({
		slug: path.split('/').pop()!.replace(/\.md$/, ''),
		title: meta.title,
		date: meta.date
	}));

	// Bigram overlap between the requested path and each slug: forgiving of typos and partial names
	function bigrams(text: string): Set<string> {
		const clean = text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
		const grams = new Set<string>();
		for (let i = 0; i < clean.length - 1; i++) grams.add(clean.slice(i, i + 2));
		return grams;
	}

	function similarity(a: string, b: string): number {
		const x = bigrams(a);
		const y = bigrams(b);
		if (!x.size || !y.size) return 0;
		let shared = 0;
		for (const gram of x) if (y.has(gram)) shared++;
		return (2 * shared) / (x.size + y.size);
	}

	const missing = $derived(page.status === 404);
	const asked = $derived(page.url.pathname);
	const ranked = $derived(
		posts
			.map((post) => ({ ...post, score: similarity(asked.split('/').pop() || asked, post.slug) }))
			.sort((a, b) => b.score - a.score)
	);
	// Only call something a match if it shares a real share of letters with what was typed
	const close = $derived(ranked.filter((post) => post.score >= 0.3).slice(0, 3));
	const latest = $derived([...posts].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3));
	const suggestions = $derived(close.length ? close : latest);
</script>

<svelte:head>
	<title>{missing ? 'Not found' : `Error ${page.status}`} - Adeyemi Folarin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="content-container wide">
	<article class="error-page">
		<p class="mono tertiary eyebrow">Error {page.status}</p>
		{#if missing}
			<h1 class="mono primary">Nothing is published at <span class="asked">{asked}</span></h1>

			<iframe
				class="figure-frame"
				src="/figures/404.html"
				title="Interactive figure: your request tries every post on the site and ends up in lost and found"
			></iframe>

			<section class="suggest">
				<h2 class="mono primary">{close.length ? 'Closest posts' : 'Latest posts'}</h2>
				<ul>
					{#each suggestions as post (post.slug)}
						<li>
							<a href="/blog/{post.slug}" class="mono">{post.title}</a>
							<time class="mono tertiary">{post.date}</time>
						</li>
					{/each}
				</ul>
			</section>
		{:else}
			<h1 class="mono primary">Something went wrong</h1>
			<p class="mono secondary">{page.error?.message ?? 'The page could not be loaded.'}</p>
		{/if}

		<p class="mono secondary ways-out">
			<a href="/blog">All posts</a>
			<a href="/">Home page</a>
		</p>
	</article>
</div>

<style>
	.error-page {
		padding: var(--spacing-12) var(--spacing-4) var(--spacing-16);
	}

	.eyebrow {
		font-size: var(--text-sm);
		margin-bottom: var(--spacing-3);
	}

	h1 {
		font-size: var(--text-2xl);
		line-height: var(--leading-tight);
		text-wrap: balance;
	}

	.asked {
		color: var(--color-natural);
		overflow-wrap: anywhere;
	}

	.suggest {
		margin-top: var(--spacing-8);
	}

	.suggest h2 {
		font-size: var(--text-base);
		margin-bottom: var(--spacing-4);
	}

	.suggest ul {
		list-style: none;
		display: grid;
		gap: var(--spacing-3);
	}

	.suggest li {
		display: flex;
		justify-content: space-between;
		gap: var(--spacing-4);
		align-items: baseline;
	}

	.suggest a {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.suggest time {
		flex-shrink: 0;
		font-size: var(--text-sm);
	}

	.ways-out {
		display: flex;
		gap: var(--spacing-6);
		margin-top: var(--spacing-8);
		font-size: var(--text-sm);
	}

	.ways-out a {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
</style>
