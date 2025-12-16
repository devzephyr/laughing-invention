<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		// Add copy buttons to all pre > code blocks
		const codeBlocks = document.querySelectorAll('pre');

		codeBlocks.forEach((pre) => {
			// Create wrapper
			const wrapper = document.createElement('div');
			wrapper.className = 'code-block-wrapper';

			// Wrap the pre element
			pre.parentNode?.insertBefore(wrapper, pre);
			wrapper.appendChild(pre);

			// Create copy button
			const button = document.createElement('button');
			button.className = 'copy-code-btn';
			button.innerHTML = 'Copy';
			button.setAttribute('aria-label', 'Copy code to clipboard');

			button.addEventListener('click', async () => {
				const code = pre.querySelector('code')?.textContent || pre.textContent || '';
				try {
					await navigator.clipboard.writeText(code);
					button.innerHTML = 'Copied!';
					button.classList.add('copied');
					setTimeout(() => {
						button.innerHTML = 'Copy';
						button.classList.remove('copied');
					}, 2000);
				} catch (err) {
					button.innerHTML = 'Failed';
					setTimeout(() => {
						button.innerHTML = 'Copy';
					}, 2000);
				}
			});

			wrapper.appendChild(button);
		});
	});
</script>

<svelte:head>
	<style>
		.code-block-wrapper {
			position: relative;
			margin: 1.5rem 0;
		}

		.code-block-wrapper pre {
			margin: 0;
		}

		.copy-code-btn {
			position: absolute;
			top: 8px;
			right: 8px;
			padding: 4px 12px;
			background: var(--bg-secondary);
			border: 1px solid var(--border-color);
			border-radius: 4px;
			color: var(--text-secondary);
			font-family: var(--font-gt-standard-mono);
			font-size: 12px;
			cursor: pointer;
			opacity: 0;
			transition: opacity 0.2s ease, background 0.2s ease;
			z-index: 10;
		}

		.code-block-wrapper:hover .copy-code-btn {
			opacity: 1;
		}

		.copy-code-btn:hover {
			background: var(--color-slate-150);
			color: var(--text-primary);
		}

		.copy-code-btn.copied {
			background: var(--lavender-500);
			color: white;
			border-color: var(--lavender-500);
		}

		.copy-code-btn:focus-visible {
			opacity: 1;
			outline: 2px solid var(--lavender-500);
			outline-offset: 2px;
		}
	</style>
</svelte:head>
