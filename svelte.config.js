import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { createHighlighter } from 'shiki';

// Create syntax highlighter with common languages for security research
const highlighter = await createHighlighter({
	themes: ['github-light'],
	langs: [
		'javascript',
		'typescript',
		'python',
		'bash',
		'shell',
		'c',
		'cpp',
		'go',
		'rust',
		'html',
		'css',
		'json',
		'yaml',
		'markdown',
		'sql',
		'php',
		'ruby',
		'java'
	]
});

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md'],
			highlight: {
				highlighter: async (code, lang) => {
					try {
						const html = highlighter.codeToHtml(code, {
							lang: lang || 'text',
							theme: 'github-light'
						});
						return `{@html \`${html}\` }`;
					} catch (e) {
						// Fallback for unknown languages
						return `<pre><code>${code}</code></pre>`;
					}
				}
			}
		})
	],
	kit: {
		adapter: adapter()
	}
};

export default config;
