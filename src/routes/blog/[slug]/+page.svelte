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

		// Add copy buttons to code blocks
		const codeBlocks = document.querySelectorAll('.post-content pre');
		codeBlocks.forEach((pre) => {
			const wrapper = document.createElement('div');
			wrapper.className = 'code-block-wrapper';

			const copyButton = document.createElement('button');
			copyButton.className = 'copy-code-button';
			copyButton.innerHTML = 'Copy';
			copyButton.setAttribute('aria-label', 'Copy code to clipboard');

			copyButton.addEventListener('click', async () => {
				const code = pre.querySelector('code');
				const text = code?.textContent || '';

				try {
					await navigator.clipboard.writeText(text);
					copyButton.innerHTML = 'Copied!';
					copyButton.classList.add('copied');

					setTimeout(() => {
						copyButton.innerHTML = 'Copy';
						copyButton.classList.remove('copied');
					}, 2000);
				} catch (err) {
					console.error('Failed to copy:', err);
					copyButton.innerHTML = 'Failed';
					setTimeout(() => {
						copyButton.innerHTML = 'Copy';
					}, 2000);
				}
			});

			pre.parentNode?.insertBefore(wrapper, pre);
			wrapper.appendChild(pre);
			wrapper.appendChild(copyButton);
		});

		// Highlight links when they're in viewport
		const links = document.querySelectorAll('.post-content a');
		const observerOptions = {
			root: null,
			rootMargin: '0px',
			threshold: 0.5
		};

		const linkObserver = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add('in-view');
				} else {
					entry.target.classList.remove('in-view');
				}
			});
		}, observerOptions);

		links.forEach((link) => {
			linkObserver.observe(link);
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
			linkObserver.disconnect();
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

	/* Code block with copy button */
	.post-content :global(.code-block-wrapper) {
		position: relative;
		margin: var(--spacing-6) 0;
	}

	.post-content :global(.code-block-wrapper pre) {
		margin: 0;
	}

	.post-content :global(.copy-code-button) {
		position: absolute;
		top: var(--spacing-2);
		right: var(--spacing-2);
		padding: var(--spacing-1) var(--spacing-3);
		background-color: var(--color-slate-100);
		border: var(--border-base) solid var(--color-slate-200);
		border-radius: var(--radius-sm);
		font-family: var(--font-gt-standard-mono);
		font-size: var(--text-xs);
		color: var(--color-slate-600);
		cursor: pointer;
		transition: all var(--transition-fast);
		opacity: 0.7;
	}

	.post-content :global(.copy-code-button:hover) {
		opacity: 1;
		background-color: var(--color-slate-150);
		border-color: var(--color-slate-300);
	}

	.post-content :global(.copy-code-button.copied) {
		background-color: var(--color-natural-light);
		border-color: var(--color-natural);
		color: var(--color-natural);
	}

	.post-content :global(.copy-code-button:active) {
		transform: scale(0.95);
	}

	/* Links in viewport highlighting */
	.post-content :global(a.in-view) {
		color: var(--lavender-500);
	}

	.post-content :global(a:hover) {
		color: var(--lavender-700);
	}

	@media (max-width: 768px) {
		.blog-post {
			padding: var(--spacing-8) var(--spacing-4);
		}

		.post-header h1 {
			font-size: var(--text-xl);
		}

		.post-content :global(.copy-code-button) {
			opacity: 1;
		}
	}
</style>
