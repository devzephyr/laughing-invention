<script lang="ts">
	import Seo from '$lib/Seo.svelte';
	import { allPosts } from '$lib/posts';

	// One row per advisory I reported, straight from each post's frontmatter
	const rows = allPosts().flatMap((post) =>
		(post.advisories ?? []).map((advisory) => ({
			...advisory,
			key: `${advisory.id ?? advisory.kind}-${post.slug}`,
			score: advisory.severity && /^[0-9.]+$/.test(advisory.severity) ? Number(advisory.severity) : -1,
			date: post.date,
			slug: post.slug,
			title: post.title
		}))
	);

	type Key = 'date' | 'product' | 'score';
	let key = $state<Key>('date');
	let descending = $state(true);

	const sorted = $derived(
		[...rows].sort((a, b) => {
			const x = a[key];
			const y = b[key];
			const order = x < y ? -1 : x > y ? 1 : 0;
			return descending ? -order : order;
		})
	);

	function sortBy(next: Key) {
		descending = key === next ? !descending : next !== 'product';
		key = next;
	}

	const ariaSort = (column: Key) => (key === column ? (descending ? 'descending' : 'ascending') : 'none');
	const writeups = new Set(rows.map((row) => row.slug)).size;
</script>

<Seo
	title="Disclosures · Adeyemi Folarin"
	description="Every vulnerability I have reported and seen fixed: advisory IDs, affected and fixed versions, and severity."
/>

<div class="content-container wide">
	<article class="disclosures">
		<h1 class="mono primary">Disclosures</h1>
		<p class="mono secondary lede">
			{rows.length} advisories from {writeups} writeups, each reported privately and published after the fix shipped.
		</p>

		<div class="table-wrap">
			<table class="mono">
				<thead>
					<tr>
						<th aria-sort={ariaSort('date')}><button type="button" onclick={() => sortBy('date')}>Date</button></th>
						<th aria-sort={ariaSort('product')}><button type="button" onclick={() => sortBy('product')}>Product</button></th>
						<th>Advisory</th>
						<th aria-sort={ariaSort('score')}><button type="button" onclick={() => sortBy('score')}>Severity</button></th>
					</tr>
				</thead>
				<tbody>
					{#each sorted as row (row.key)}
						<tr>
							<td class="nowrap">{row.date}</td>
							<td>
								<a href="/blog/{row.slug}">{row.product}</a>
								<span class="kind">{row.kind}</span>
							</td>
							<td class="nowrap">
								{#if row.id && row.repo}
									<a href="https://github.com/{row.repo}/security/advisories/{row.id}" rel="noopener">{row.id}</a>
								{:else}
									{row.id ?? 'No advisory ID'}
								{/if}
								{#if row.cve}<span class="kind">{row.cve}</span>{/if}
							</td>
							<td class="nowrap">
								{row.severity ? (row.score >= 0 ? `CVSS ${row.severity}` : row.severity) : '—'}
								{#if row.fixed}<span class="kind">fixed in {row.fixed}</span>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</article>
</div>

<style>
	.disclosures {
		padding: var(--spacing-16) var(--spacing-4);
	}

	.lede {
		margin: var(--spacing-3) 0 var(--spacing-8);
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}

	th,
	td {
		padding: var(--spacing-3);
		border-bottom: var(--border-base) solid var(--color-slate-150);
		text-align: left;
		vertical-align: top;
	}

	th {
		font-weight: var(--font-medium);
		color: var(--color-slate-600);
		white-space: nowrap;
	}

	th button {
		font: inherit;
		color: inherit;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	th[aria-sort='ascending'] button::after {
		content: ' ↑';
	}

	th[aria-sort='descending'] button::after {
		content: ' ↓';
	}

	td a {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.kind {
		display: block;
		margin-top: var(--spacing-1);
		color: var(--color-slate-400);
		font-size: var(--text-xs);
	}

	.nowrap {
		white-space: nowrap;
	}
</style>
