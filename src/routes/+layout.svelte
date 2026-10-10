<script lang="ts">
	import '../app.css';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { page } from '$app/state';

	injectSpeedInsights();

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Adeyemi Folarin' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/resume', label: 'Resume' }
	];

	// /blog/some-post still counts as being in the Blog section
	function isCurrent(href: string): boolean {
		const path = page.url.pathname;
		return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
	}
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />
</svelte:head>

<a href="#main-content" class="skip-to-main">Skip to main content</a>

<div class="app">
	<nav class="site-nav content-container" aria-label="Site">
		{#each navItems as item}
			<a
				href={item.href}
				class="mono"
				class:home={item.href === '/'}
				aria-current={isCurrent(item.href) ? 'page' : undefined}>{item.label}</a
			>
		{/each}
	</nav>
	<main id="main-content">
		{@render children()}
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
	}

	.site-nav {
		display: flex;
		gap: var(--spacing-6);
		padding: var(--spacing-6) var(--spacing-4) 0;
		font-size: var(--text-sm);
	}

	.site-nav a {
		color: var(--color-slate-600);
	}

	.site-nav .home {
		margin-right: auto;
		color: var(--color-black-100);
		font-weight: var(--font-medium);
	}

	.site-nav a[aria-current='page']:not(.home) {
		color: var(--color-black-100);
		text-decoration: underline;
		text-underline-offset: 0.3em;
	}
</style>
