<script lang="ts">
	import { onMount } from 'svelte';

	let serverStatus = $state({
		online: true,
		uptime: '99.9%',
		responseTime: '45ms'
	});

	onMount(() => {
		// Fetch server health on mount
		checkServerHealth();
	});

	async function checkServerHealth() {
		try {
			const start = Date.now();
			const response = await fetch('/api/health');
			const end = Date.now();

			if (response.ok) {
				serverStatus = {
					online: true,
					uptime: '99.9%',
					responseTime: `${end - start}ms`
				};
			}
		} catch (error) {
			serverStatus = {
				online: false,
				uptime: 'N/A',
				responseTime: 'N/A'
			};
		}
	}
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

	<!-- Server Health Section -->
	<section class="section">
		<h2 class="mono primary">Server Health</h2>
		<div class="health-grid">
			<div class="health-item">
				<span class="mono tertiary">Status</span>
				<span class="mono primary status" class:online={serverStatus.online} class:offline={!serverStatus.online}>
					{serverStatus.online ? 'Online' : 'Offline'}
				</span>
			</div>
			<div class="health-item">
				<span class="mono tertiary">Uptime</span>
				<span class="mono primary">{serverStatus.uptime}</span>
			</div>
			<div class="health-item">
				<span class="mono tertiary">Response Time</span>
				<span class="mono primary">{serverStatus.responseTime}</span>
			</div>
		</div>
	</section>

	<div class="divider"></div>

	<!-- Blog Section -->
	<section class="section">
		<div class="section-header">
			<h2 class="mono primary">Latest Research</h2>
			<a href="/blog" class="mono secondary view-all">View all →</a>
		</div>
		<div class="blog-grid">
			<article class="blog-card">
				<time class="mono tertiary">2024-12-14</time>
				<h3 class="mono primary">
					<a href="/blog/getting-started">Getting Started</a>
				</h3>
				<p class="mono secondary">Welcome to the cybersecurity blog. Start writing your first post in /src/posts/</p>
			</article>
		</div>
	</section>

	<div class="divider"></div>

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

	<div class="divider"></div>

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

	<div class="divider"></div>

	<!-- Social Links -->
	<footer class="section">
		<h2 class="mono tertiary">Connect</h2>
		<div class="social-links">
			<a href="https://www.linkedin.com/in/adeyemi-folarin/" class="mono secondary" target="_blank" rel="noopener">LinkedIn</a>
			<a href="https://github.com/devzephyr" class="mono secondary" target="_blank" rel="noopener">GitHub</a>
			<a href="mailto:adeyemfolarin@icloud.com" class="mono secondary">Email</a>
		</div>
	</footer>
</div>

<style>
	header {
		padding: var(--spacing-16) 0 var(--spacing-8) 0;
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

	.view-all {
		font-family: var(--font-gt-standard-mono);
		font-size: 14px;
		font-weight: 400;
		color: var(--lavender-500);
		cursor: pointer;
		text-decoration: none;
		transition: color 0.1s ease-out;
	}

	.view-all:hover {
		color: var(--lavender-700);
	}

	.health-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-8);
		margin-top: var(--spacing-6);
	}

	.health-item {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.status {
		font-weight: var(--font-medium);
	}

	.status.online {
		color: #22c55e;
	}

	.status.offline {
		color: var(--color-fire);
	}

	.blog-grid {
		display: grid;
		gap: var(--spacing-8);
		margin-top: var(--spacing-6);
	}

	.blog-card {
		border: var(--border-base) solid var(--color-slate-150);
		border-radius: var(--radius-md);
		padding: var(--spacing-6);
		transition: border-color var(--transition-base);
	}

	.blog-card:hover {
		border-color: var(--color-natural);
	}

	.blog-card time {
		display: block;
		margin-bottom: var(--spacing-2);
		font-size: var(--text-sm);
	}

	.blog-card h3 {
		margin-bottom: var(--spacing-3);
	}

	.blog-card h3 a:hover {
		color: var(--color-natural);
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

	.social-links a {
		font-family: var(--font-gt-standard-mono);
		font-size: 14px;
		font-weight: 400;
		color: var(--lavender-500);
		cursor: pointer;
		text-decoration: none;
		transition: color 0.1s ease-out;
	}

	.social-links a:hover {
		color: var(--lavender-700);
	}

	footer {
		padding-bottom: var(--spacing-16);
	}

	@media (max-width: 768px) {
		.content-container {
			padding: 0 var(--spacing-4);
		}

		.health-grid,
		.recommendations-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
