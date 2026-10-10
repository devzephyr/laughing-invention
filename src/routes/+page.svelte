<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Cybersecurity Blog - Security Research & Vulnerability Analysis</title>
	<meta name="description" content="Cybersecurity research, exploit analysis, proof of concepts, and code reviews." />
</svelte:head>

<div class="content-container">
	<!-- Header -->
	<header>
		<h1 class="mono primary">Security Research</h1>
		<p class="mono secondary">Vulnerability analysis, exploits, and proof of concepts</p>
	</header>

	<!-- Blog Section -->
	<section class="section">
		<div class="section-header">
			<h2 class="mono primary">Latest Research</h2>
			<a href="/blog" class="mono secondary view-all">View all →</a>
		</div>
		<div class="blog-grid">
			{#if data.latestPost}
				<article class="blog-card">
					<time class="mono tertiary">{data.latestPost.date}</time>
					<h3 class="mono primary">
						<a href="/blog/{data.latestPost.slug}">{data.latestPost.title}</a>
					</h3>
					<p class="mono secondary">{data.latestPost.description}</p>
				</article>
			{:else}
				<p class="mono secondary">No posts yet. Start writing in /src/posts/</p>
			{/if}
		</div>
	</section>

	<!-- Recommendations Section -->
	<section class="section">
		<h2 class="mono primary">Reading List</h2>
		<div class="recommendations-grid">
			<div class="recommendation-card">
				<h3 class="mono primary">Currently Reading</h3>
				<ul>
					<li class="mono secondary">Real-World Bug Hunting - Peter Yaworski</li>
					<li class="mono secondary">Black Hat Python - Justin Seitz</li>
				</ul>
			</div>
			<div class="recommendation-card">
				<h3 class="mono primary">Recommended</h3>
				<ul>
					<li class="mono secondary">The Web Application Hacker's Handbook</li>
					<li class="mono secondary">Hacking: The Art of Exploitation</li>
				</ul>
			</div>
		</div>
	</section>

	<!-- Resume/Credentials Section -->
	<section class="section">
		<div class="section-header">
			<h2 class="mono primary">Background</h2>
			<a href="/resume" class="mono secondary view-all">Full resume →</a>
		</div>
		<p class="mono secondary">
			Security researcher focused on web application vulnerabilities, exploit development,
			and responsible disclosure. Currently seeking internship opportunities in offensive security.
		</p>
	</section>

	<!-- Social Links -->
	<footer class="section">
		<h2 class="mono tertiary">Connect</h2>
		<div class="social-links">
			<a href="https://www.linkedin.com/in/adeyemi-folarin/" class="mono secondary" target="_blank" rel="noopener">LinkedIn</a>
			<a href="https://github.com/devzephyr" class="mono secondary" target="_blank" rel="noopener">GitHub</a>
			<a href="mailto:folarinabdul30@gmail.com" class="mono secondary">Email</a>
		</div>
	</footer>
</div>

<style>
	header {
		padding: var(--spacing-16) var(--spacing-4) var(--spacing-8);
	}

	header h1 {
		margin-bottom: var(--spacing-2);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-6);
	}

	.view-all,
	.social-links a {
		color: var(--lavender-500);
		transition: color var(--transition-press);
	}

	.view-all:active,
	.social-links a:active {
		color: var(--lavender-700);
	}

	@media (hover: hover) {
		.view-all:hover,
		.social-links a:hover {
			color: var(--lavender-700);
		}
	}

	.blog-grid {
		display: grid;
		gap: var(--spacing-8);
		margin-top: var(--spacing-6);
	}

	/* The title link stretches over the whole card, so the card is the link */
	.blog-card {
		position: relative;
		border: var(--border-base) solid var(--color-slate-150);
		border-radius: var(--radius-md);
		padding: var(--spacing-6);
		transition:
			border-color var(--transition-base),
			transform var(--transition-press);
	}

	.blog-card h3 a::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.blog-card:active {
		border-color: var(--color-natural);
		transform: scale(0.98);
	}

	.blog-card:has(a:focus-visible) {
		outline: 2px solid var(--lavender-500);
		outline-offset: 2px;
	}

	.blog-card h3 a:focus-visible {
		outline: none;
	}

	@media (hover: hover) {
		.blog-card:hover {
			border-color: var(--color-natural);
		}

		.blog-card:hover h3 a {
			color: var(--color-natural);
		}
	}

	.blog-card time {
		display: block;
		margin-bottom: var(--spacing-2);
		font-size: var(--text-sm);
	}

	.blog-card h3 {
		margin-bottom: var(--spacing-3);
	}

	.recommendations-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--spacing-8);
		margin-top: var(--spacing-6);
	}

	.recommendation-card h3 {
		margin-bottom: var(--spacing-4);
		font-size: var(--text-base);
	}

	.recommendation-card ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.social-links {
		display: flex;
		gap: var(--spacing-6);
		margin-top: var(--spacing-4);
		flex-wrap: wrap;
	}

	footer {
		padding-bottom: var(--spacing-16);
	}

	@media (max-width: 768px) {
		.recommendations-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
