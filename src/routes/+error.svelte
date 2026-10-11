<script lang="ts">
	import { page } from '$app/state';

	const missing = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{missing ? 'Not found' : `Error ${page.status}`} - Adeyemi Folarin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="content-container wide">
	<article class="error-page">
		{#if missing}
			<h1 class="mono tertiary eyebrow">Error 404</h1>
			<iframe
				class="figure-frame"
				src="/figures/404.html"
				title="A slot machine whose reels stop on 4, 0, 4"
			></iframe>
		{:else}
			<h1 class="mono primary">Error {page.status}</h1>
			<p class="mono secondary">{page.error?.message ?? 'The page could not be loaded.'}</p>
		{/if}
		<a href="/" class="mono secondary home-link">← Back to home</a>
	</article>
</div>

<style>
	.error-page {
		padding: var(--spacing-8) var(--spacing-4) var(--spacing-12);
	}

	.error-page h1 {
		margin-bottom: var(--spacing-4);
	}

	.eyebrow {
		font-size: var(--text-lg);
		font-weight: var(--font-regular);
	}

	.home-link {
		display: inline-block;
		margin-top: var(--spacing-6);
		font-size: var(--text-sm);
	}
</style>
