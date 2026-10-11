import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pageHtml, plateHtml } from "./anatomy/kit/iso-kit.mjs";
import { kitScript } from "./anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "static", "figures");
const RUNTIME = readFileSync(join(HERE, "runtime.js"), "utf8");

// Sits inside the post's column: no page chrome, the site's mono type
const FRAME_CSS = `
html{color-scheme:light dark}
html,body{background:transparent}
body{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;font-size:13px}
.iso-page{width:100%;margin:0}
.iso-figure{margin:0}
.iso-stage{touch-action:pan-y}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
.fig-controls{display:flex;gap:8px;margin-top:12px}
.fig-controls button{font:inherit;font-size:12px;color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);padding:6px 12px;cursor:pointer;transition:transform 100ms ease-out}
.fig-controls button[aria-pressed="true"]{background:var(--anatomy-strong);color:var(--anatomy-card)}
.fig-controls button:active{transform:scale(.97)}
.fig-controls button:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:3px}
@media (max-width:420px){.iso-plate{overflow:hidden}.iso-stage svg{width:118%;margin:0 -9%}}
.fig-live{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
`;

// Runs before first paint, so the figure never flashes the wrong theme
const THEME = `<script>(()=>{const m=matchMedia("(prefers-color-scheme: dark)");const set=()=>{document.body.dataset.theme=m.matches?"dark":"light"};set();m.addEventListener("change",set)})()</script>`;

// The post page listens for this and sizes the iframe to fit, so there is no inner scrollbar.
// The body's own box, not documentElement.scrollHeight, which never drops below the iframe's height.
const resize = (slug) => `
new ResizeObserver(() => parent.postMessage({ figure: ${JSON.stringify(slug)}, height: Math.ceil(document.body.getBoundingClientRect().height) }, "/")).observe(document.body);
`;

/**
 * Writes static/figures/<slug>.html: the card, the fix toggle, and the live code on top of the
 * kit and the shared runtime (runtime.js). `live` must end by calling runFigure({...}).
 * @param {string} slug post slug; also the iframe's src name
 * @param {{ title: string, fig: string, hint?: string, readout: string, keys: {mark: string, label: string}[],
 *   caption: string, svg: string, stageLabel: string, live: string, css?: string }} figure
 */
export function writeFigure(slug, { title, fig, hint = "Hover to scrub · arrows step", readout, keys, caption, svg, stageLabel, live, css = "", fix = true }) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`bad figure slug: ${slug}`);
  const plate = plateHtml({
    fig,
    title,
    hint,
    readout,
    keys,
    caption,
    body:
      `<div class="iso-stage" tabindex="0" role="group" aria-label="${stageLabel.replace(/"/g, "&quot;")}">${svg}</div>` +
      `<span class="fig-live" aria-live="polite" data-live></span>`,
  });
  const controls = `<div class="fig-controls"><button type="button" data-fix aria-pressed="false">Apply the fix</button></div>`;
  const body = fix ? plate.replace("</div><figcaption", `</div>${controls}<figcaption`) : plate;
  if (fix && body === plate) throw new Error("plateHtml markup changed: could not place the fix toggle");
  const html = pageHtml({ title, theme: "light", body, script: kitScript() + RUNTIME + live + resize(slug) })
    .replace("</style>", `${FRAME_CSS}${css}</style>`)
    .replace('<main class="iso-page">', `${THEME}<main class="iso-page">`);
  mkdirSync(OUT, { recursive: true });
  const file = join(OUT, `${slug}.html`);
  writeFileSync(file, html);
  console.log("wrote", file, `${(html.length / 1024).toFixed(0)} KB`);
}
