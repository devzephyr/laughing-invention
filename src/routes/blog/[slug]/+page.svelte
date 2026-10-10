<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let lightbox: HTMLDialogElement;
	let lightboxSrc = $state('');
	let lightboxAlt = $state('');
	let sourceImage: HTMLImageElement | null = null;

	// The zoomed image grows out of the thumbnail and shrinks back into it.
	// Browsers without the View Transitions API just open and close instantly.
	function runTransition(update: () => void | Promise<void>): Promise<void> {
		if (!document.startViewTransition) {
			return Promise.resolve(update());
		}
		return document.startViewTransition(update).finished;
	}

	function openLightbox(img: HTMLImageElement) {
		sourceImage = img;
		img.style.viewTransitionName = 'lightbox-image';
		runTransition(async () => {
			img.style.viewTransitionName = '';
			lightboxSrc = img.currentSrc || img.src;
			lightboxAlt = img.alt;
			await tick();
			lightbox.showModal();
		});
	}

	function closeLightbox() {
		if (!lightbox.open) return;
		const img = sourceImage;
		runTransition(() => {
			lightbox.close();
			if (img) img.style.viewTransitionName = 'lightbox-image';
		}).finally(() => {
			if (!img) return;
			img.style.viewTransitionName = '';
			// Hand focus back to the image that opened the viewer
			img.focus({ preventScroll: true });
		});
	}

	// Esc: run the same animated close instead of the dialog's instant one
	function handleCancel(e: Event) {
		e.preventDefault();
		closeLightbox();
	}

	onMount(() => {
		const images = document.querySelectorAll<HTMLImageElement>('.post-content img');
		images.forEach((img) => {
			img.addEventListener('click', () => openLightbox(img));

			// Add keyboard support
			img.setAttribute('tabindex', '0');
			img.setAttribute('role', 'button');
			img.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					openLightbox(img);
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
			copyButton.textContent = 'Copy';
			// Screen readers announce the Copied!/Failed text change
			copyButton.setAttribute('aria-live', 'polite');

			copyButton.addEventListener('click', async () => {
				const code = pre.querySelector('code');
				const text = code?.textContent || '';

				try {
					await navigator.clipboard.writeText(text);
					copyButton.textContent = 'Copied!';
					copyButton.classList.add('copied');

					setTimeout(() => {
						copyButton.textContent = 'Copy';
						copyButton.classList.remove('copied');
					}, 2000);
				} catch (err) {
					console.error('Failed to copy:', err);
					copyButton.textContent = 'Failed';
					setTimeout(() => {
						copyButton.textContent = 'Copy';
					}, 2000);
				}
			});

			pre.parentNode?.insertBefore(wrapper, pre);
			wrapper.appendChild(pre);
			wrapper.appendChild(copyButton);
		});
	});
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

<!-- Lightbox: any click closes it; the button is there for keyboard and screen readers -->
<dialog
	class="lightbox"
	bind:this={lightbox}
	onclick={closeLightbox}
	oncancel={handleCancel}
	aria-label="Image viewer"
>
	<button class="lightbox-close" aria-label="Close image viewer">&times;</button>
	{#if lightboxSrc}
		<img src={lightboxSrc} alt={lightboxAlt} />
	{/if}
</dialog>

<style>
	.blog-post {
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

	.back-link:active {
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

	/* Tables */
	.post-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: var(--spacing-8) 0;
		font-size: var(--text-sm);
		line-height: var(--leading-normal);
	}

	.post-content :global(th),
	.post-content :global(td) {
		padding: var(--spacing-3) var(--spacing-4);
		border: var(--border-base) solid var(--color-slate-200);
		text-align: left;
		vertical-align: top;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.post-content :global(th) {
		background-color: var(--color-slate-100);
		font-weight: 600;
		white-space: nowrap;
	}

	/* Tables are held to the exact width of the text column at every viewport.
	   No bleed past the text edges: a table that cannot fit wraps or scrolls. */

	/* Fall back to horizontal scroll if a table still overflows */
	@media (max-width: 640px) {
		.post-content :global(table) {
			display: block;
			overflow-x: auto;
			white-space: nowrap;
		}
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
		transition: all var(--transition-press);
		opacity: 0.7;
	}

	.post-content :global(.copy-code-button.copied) {
		background-color: var(--color-natural-light);
		border-color: var(--color-natural);
		color: var(--color-natural);
	}

	.post-content :global(.copy-code-button:active) {
		transform: scale(0.97);
	}

	/* Underline as well as color, so links don't rely on color alone (WCAG 1.4.1) */
	.post-content :global(a) {
		color: var(--lavender-500);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}

	.post-content :global(a:active) {
		color: var(--lavender-700);
	}

	@media (hover: hover) {
		.back-link:hover {
			color: var(--color-natural);
		}

		.post-content :global(.copy-code-button:hover) {
			opacity: 1;
			background-color: var(--color-slate-150);
			border-color: var(--color-slate-300);
		}

		.post-content :global(a:hover) {
			color: var(--lavender-700);
		}
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
