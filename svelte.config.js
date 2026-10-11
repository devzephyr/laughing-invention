import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mdsvex } from "mdsvex";
import { createHighlighter } from "shiki";
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

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
    "dockerfile",
  ],
});

const escapeHtml = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;");

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte", ".md"],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: [".md"],
      // Every heading gets an id and becomes a link to itself, so any section can be shared
      rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      highlight: {
        highlighter: async (code, lang, meta) => {
          let html;
          try {
            html = highlighter.codeToHtml(code, {
              lang: lang || "text",
              // Light colors inline; dark ones as --shiki-dark vars, swapped in app.css
              themes: { light: "github-light", dark: "github-dark" },
              // ```ts {2,4-5} highlights lines; // [!code ++], [!code --], [!code highlight], [!code focus] in the code
              meta: { __raw: meta ?? "" },
              transformers: [
                transformerMetaHighlight(),
                transformerNotationHighlight(),
                transformerNotationDiff(),
                transformerNotationFocus(),
              ],
            });
          } catch (e) {
            // Unknown language: plain block, escaped so <, & and { in the code stay text
            html = `<pre><code>${escapeHtml(code)}</code></pre>`;
          }
          // JSON.stringify keeps every backslash and backtick intact inside the Svelte expression
          return `{@html ${JSON.stringify(html)}}`;
        },
      },
    }),
  ],
  kit: {
    adapter: adapter({
      runtime: "nodejs22.x",
    }),
    // Prerendered pages get this as a <meta> CSP with hashes of SvelteKit's own inline scripts.
    // frame-ancestors can't live in a <meta> policy, so it is sent as a header from vercel.json.
    csp: {
      mode: "auto",
      directives: {
        "default-src": ["self"],
        // va.vercel-scripts.com serves the Speed Insights debug script in development
        "script-src": ["self", "https://va.vercel-scripts.com"],
        // Shiki colours code with inline style attributes
        "style-src": ["self", "unsafe-inline"],
        "img-src": ["self", "data:"],
        "font-src": ["self"],
        "connect-src": ["self", "https://va.vercel-scripts.com"],
        "frame-src": ["self"],
        "object-src": ["none"],
        "base-uri": ["self"],
        "form-action": ["self"],
      },
    },
  },
};

export default config;
