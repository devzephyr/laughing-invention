<svelte:head>
	<title>Security Policy - Adeyemi Folarin</title>
	<meta
		name="description"
		content="How to report a vulnerability in this site, and how I disclose the vulnerabilities I find."
	/>
</svelte:head>

<div class="content-container">
	<article class="policy">
		<h1 class="mono primary">Security Policy</h1>

		<section class="section">
			<h2 class="mono primary">Report a vulnerability in this site</h2>
			<p class="mono secondary">
				If you find a security issue in <code>blog.adeyemi.xyz</code>, email
				<a href="mailto:folarinabdul30@gmail.com">folarinabdul30@gmail.com</a> with the affected URL, the steps to
				reproduce it, and what an attacker could do with it.
			</p>
			<p class="mono secondary">
				In scope: this site and its interactive figures. Out of scope: denial of service, automated scanner output
				with no demonstrated impact, and third-party services the site links to.
			</p>
			<p class="mono secondary">
				Testing in good faith within that scope, without accessing other people's data or degrading the site, is
				welcome. I will not pursue legal action over it.
			</p>
		</section>

		<section class="section">
			<h2 class="mono primary">How I disclose what I find</h2>
			<p class="mono secondary">
				I report privately to the maintainers, usually through GitHub Security Advisories, and publish a writeup only
				after a fixed release ships. Each writeup cites the advisory and CVE IDs and credits the maintainers who
				fixed it.
			</p>
		</section>

		<section class="section">
			<h2 class="mono primary">Machine-readable</h2>
			<p class="mono secondary">
				This policy is referenced from <a href="/.well-known/security.txt">/.well-known/security.txt</a> (RFC 9116).
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

	.policy a {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
</style>
