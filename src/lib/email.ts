// The contact address as a mailto link whose every character is an HTML entity.
// Browsers and screen readers decode it as normal; naive scrapers reading raw HTML do not.
// Rendered with {@html} because Svelte would decode entities written directly in markup.
const ADDRESS = "folarinabdul30@gmail.com";

const encode = (text: string) =>
  [...text].map((c) => `&#${c.codePointAt(0)};`).join("");

export function emailLink(label: string = ADDRESS, className = ""): string {
  const cls = className ? ` class="${className}"` : "";
  const shown = label === ADDRESS ? encode(ADDRESS) : label;
  return `<a href="mailto:${encode(ADDRESS)}"${cls}>${shown}</a>`;
}
