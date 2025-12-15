<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lightboxActive = $state(false);
	let lightboxSrc = $state('');

	onMount(() => {
		// Add click handlers to all images in the post
		const images = document.querySelectorAll('.post-content img');
		images.forEach((img) => {
			img.addEventListener('click', (e) => {
				const target = e.target as HTMLImageElement;
				lightboxSrc = target.src;
				lightboxActive = true;
			});

			// Add keyboard support
			img.setAttribute('tabindex', '0');
			img.setAttribute('role', 'button');
			img.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					const target = e.target as HTMLImageElement;
					lightboxSrc = target.src;
					lightboxActive = true;
				}
			});
		});

		// Close lightbox on ESC key
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && lightboxActive) {
				closeLightbox();
			}
		};
		window.addEventListener('keydown', handleEscape);

		return () => {
			window.removeEventListener('keydown', handleEscape);
		};
	});

	function closeLightbox() {
		lightboxActive = false;
	}
</script>

<svelte:head>
	<title>{data.metadata.title} - Security Research</title>
	<meta name="description" content={data.metadata.description} />
</svelte:head>

<div class="content-container">
	<article class="blog-post">
		<header class="post-header">
			<a href="/blog" class="back-link mono secondary">← Back to blog</a>
			<time class="mono tertiary">{data.metadata.date}</time>
			<h1 class="mono primary">{data.metadata.title}</h1>
			<p class="mono secondary description">{data.metadata.description}</p>
			{#if data.metadata.tags && data.metadata.tags.length > 0}
				<div class="tags">
					{#each data.metadata.tags as tag}
						<span class="tag mono tertiary">{tag}</span>
					{/each}
				</div>
			{/if}
		</header>

		<div class="post-content mono primary">
			{#if data.content}
				<data.content />
			{/if}
		</div>
	</article>
</div>

<!-- Lightbox -->
{#if lightboxActive}
	<div
		class="lightbox active"
		onclick={closeLightbox}
		role="dialog"
		aria-modal="true"
		aria-label="Image viewer"
	>
		<button class="lightbox-close" onclick={closeLightbox} aria-label="Close image viewer">&times;</button>
		{#if lightboxSrc}
			<img src={lightboxSrc} alt="Zoomed screenshot" />
		{/if}
	</div>
{/if}

<style>
	.blog-post {
		max-width: 800px;
		margin: 0 auto;
		padding: var(--spacing-16) var(--spacing-4);
	}

	.post-header {
		margin-bottom: var(--spacing-12);
		padding-bottom: var(--spacing-8);
		border-bottom: var(--border-base) solid var(--color-slate-150);
	}

	.back-link {
		display: inline-block;
		margin-bottom: var(--spacing-8);
		font-size: var(--text-sm);
	}

	.back-link:hover {
		color: var(--color-natural);
	}

	.post-header time {
		display: block;
		margin-bottom: var(--spacing-2);
		font-size: var(--text-sm);
	}

	.post-header h1 {
		font-size: var(--text-2xl);
		margin-bottom: var(--spacing-4);
	}

	.description {
		font-size: var(--text-lg);
		margin-bottom: var(--spacing-6);
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

	.post-content {
		line-height: var(--leading-relaxed);
	}

	.post-content :global(h2) {
		margin-top: var(--spacing-12);
		margin-bottom: var(--spacing-4);
		font-size: var(--text-xl);
	}

	.post-content :global(h3) {
		margin-top: var(--spacing-8);
		margin-bottom: var(--spacing-3);
		font-size: var(--text-lg);
	}

	.post-content :global(p) {
		margin-bottom: var(--spacing-6);
	}

	.post-content :global(ul),
	.post-content :global(ol) {
		margin-bottom: var(--spacing-6);
		padding-left: var(--spacing-8);
	}

	.post-content :global(li) {
		margin-bottom: var(--spacing-2);
	}

	.post-content :global(blockquote) {
		border-left: 4px solid var(--color-natural);
		padding-left: var(--spacing-6);
		margin: var(--spacing-8) 0;
		color: var(--color-slate-600);
	}

	.post-content :global(img),
	.post-content :global(video) {
		border: var(--border-base) solid var(--color-slate-150);
	}

	@media (max-width: 768px) {
		.blog-post {
			padding: var(--spacing-8) var(--spacing-4);
		}

		.post-header h1 {
			font-size: var(--text-xl);
		}
	}
</style>
