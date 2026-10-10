import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mdsvex } from "mdsvex";
import { createHighlighter } from "shiki";

// Create syntax highlighter with common languages for security research
const highlighter = await createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: [
    "javascript",
    "typescript",
    "python",
    "bash",
    "shell",
    "c",
    "cpp",
    "go",
    "rust",
    "html",
    "css",
    "json",
    "yaml",
    "markdown",
    "sql",
    "php",
    "ruby",
    "java",
  ],
});

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte", ".md"],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: [".md"],
      highlight: {
        highlighter: async (code, lang) => {
          try {
            const html = highlighter.codeToHtml(code, {
              lang: lang || "text",
              // Light colors inline; dark ones as --shiki-dark vars, swapped in app.css
              themes: { light: "github-light", dark: "github-dark" },
            });
            return `{@html \`${html}\` }`;
          } catch (e) {
            // Fallback for unknown languages
            return `<pre><code>${code}</code></pre>`;
          }
        },
      },
    }),
  ],
  kit: {
    adapter: adapter({
      runtime: "nodejs22.x",
    }),
  },
};

export default config;
