<script lang="ts">
	import { onMount } from 'svelte';

	let theme = $state('light');

	onMount(() => {
		// Check localStorage or system preference
		const stored = localStorage.getItem('theme');
		if (stored) {
			theme = stored;
		} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			theme = 'dark';
		}
		applyTheme(theme);
	});

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		applyTheme(theme);
		localStorage.setItem('theme', theme);
	}

	function applyTheme(newTheme: string) {
		document.documentElement.setAttribute('data-theme', newTheme);
	}
</script>

<button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle dark mode">
	{#if theme === 'dark'}
		<span class="icon">☀</span>
	{:else}
		<span class="icon">☾</span>
	{/if}
</button>

<style>
	.theme-toggle {
		position: fixed;
		bottom: var(--spacing-8);
		right: var(--spacing-8);
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 1px solid var(--border-color);
		background-color: var(--bg-primary);
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		z-index: 1000;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.theme-toggle:hover {
		transform: scale(1.1);
		border-color: var(--lavender-500);
	}

	.theme-toggle:focus-visible {
		outline: 2px solid var(--lavender-500);
		outline-offset: 2px;
	}

	.icon {
		font-size: 20px;
		line-height: 1;
	}

	@media (max-width: 768px) {
		.theme-toggle {
			bottom: var(--spacing-6);
			right: var(--spacing-6);
			width: 44px;
			height: 44px;
		}
	}
</style>
