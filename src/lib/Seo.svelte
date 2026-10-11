<script lang="ts">
	import { page } from '$app/state';
	import { SITE } from '$lib/site';

	interface Props {
		title: string;
		description: string;
		/** "article" adds the article tags and BlogPosting structured data */
		type?: 'website' | 'article';
		/** Site-relative path to a 1200x630 image */
		image?: string;
		published?: string;
		tags?: string[];
	}

	let { title, description, type = 'website', image = SITE.image, published, tags = [] }: Props = $props();

	const url = $derived(SITE.url + page.url.pathname);
	const imageUrl = $derived(SITE.url + image);
	// "<" escaped so a title can never close the script element early
	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BlogPosting',
			headline: title,
			description,
			datePublished: published,
			author: { '@type': 'Person', name: SITE.name, url: SITE.url },
			image: imageUrl,
			mainEntityOfPage: url,
			keywords: tags.join(', ')
		}).replace(/</g, '\\u003c')
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<link rel="alternate" type="application/atom+xml" title="{SITE.name} · {SITE.title}" href="/feed.xml" />

	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />

	{#if type === 'article'}
		{#if published}<meta property="article:published_time" content={published} />{/if}
		<meta property="article:author" content={SITE.name} />
		{#each tags as tag (tag)}<meta property="article:tag" content={tag} />{/each}
		{@html `<script type="application/ld+json">${jsonLd}</script>`}
	{/if}
</svelte:head>
