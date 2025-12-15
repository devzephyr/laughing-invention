<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<a href="#main-content" class="skip-to-main">Skip to main content</a>

<div class="app">
	<main id="main-content">
		{@render children()}
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
	}
</style>
