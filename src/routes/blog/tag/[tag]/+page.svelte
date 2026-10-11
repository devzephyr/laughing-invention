<script lang="ts">
	import Seo from '$lib/Seo.svelte';
	import PostList from '$lib/PostList.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo
	title="Posts tagged {data.tag} · Adeyemi Folarin"
	description="{data.posts.length} {data.posts.length === 1 ? 'post' : 'posts'} tagged {data.tag}."
/>

<div class="content-container">
	<header>
		<a href="/blog" class="mono secondary">← All posts</a>
		<h1 class="mono primary">Tagged {data.tag}</h1>
		<p class="mono secondary">{data.posts.length} {data.posts.length === 1 ? 'post' : 'posts'}</p>
	</header>

	<div class="section">
		<PostList posts={data.posts} />
	</div>
</div>

<style>
	header {
		padding: var(--spacing-16) var(--spacing-4) var(--spacing-8);
	}

	header h1 {
		margin: var(--spacing-6) 0 var(--spacing-2);
	}
</style>
