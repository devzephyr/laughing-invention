<script lang="ts">
	import Seo from '$lib/Seo.svelte';
	import { emailLink } from '$lib/email';
</script>

<Seo title="Privacy · Adeyemi Folarin" description="What this site collects about visits, and what it doesn't." />

<div class="content-container">
	<article class="policy">
		<h1 class="mono primary">Privacy</h1>

		<section class="section">
			<h2 class="mono primary">What is collected</h2>
			<p class="mono secondary">
				The site uses Vercel Speed Insights to measure how fast pages load. For each visit it records the page, the
				load-time measurements, and the browser, operating system, device type, connection speed and country. These
				data points are anonymous: they are not tied to an IP address or a person, and visits are not stitched
				together into sessions.
			</p>
			<p class="mono secondary">
				No cookies are set and nothing is stored in your browser. There are no ads, no analytics beyond that, and no
				third-party scripts: Speed Insights loads from this site's own domain.
			</p>
		</section>

		<section class="section">
			<h2 class="mono primary">Who runs it</h2>
			<p class="mono secondary">
				This site is run by Adeyemi Folarin. Questions about this page go to {@html emailLink()}.
			</p>
		</section>
	</article>
</div>

<style>
	.policy {
		padding: var(--spacing-16) var(--spacing-4);
	}

	.policy h1 {
		margin-bottom: var(--spacing-8);
	}

	.policy .section {
		padding: var(--spacing-8) 0;
	}

	.policy h2 {
		margin-bottom: var(--spacing-4);
	}

	.policy p + p {
		margin-top: var(--spacing-4);
	}
</style>
