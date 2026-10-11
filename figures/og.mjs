// Social preview images: each post's figure, settled on its final frame, light theme, cropped to 1200x630.
// Writes static/og/<slug>.png, plus static/og/site.png from the site's first figure.
// Needs Chrome (it drives the anatomy skill's headless browser script). Run: bun figures/og.mjs [slug ...]
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRIVE = join(ROOT, ".claude/skills/anatomy/scripts/drive.mjs");
const FIGURES = join(ROOT, "static/figures");
const OUT = join(ROOT, "static/og");
const SITE_FIGURE = "mcp-from-openapi-ssrf-dns-toctou";

if (!existsSync(DRIVE)) throw new Error(`anatomy skill not found at ${DRIVE}`);
mkdirSync(OUT, { recursive: true });

const posts = readdirSync(join(ROOT, "src/posts")).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : posts;

function shoot(figure, out) {
  const full = join(OUT, `.${figure}-full.png`);
  // End jumps to the figure's last step; the wait lets the eased motion settle there
  const actions = JSON.stringify([["wait", 600], ["key", "End"], ["wait", 2200], ["shot", full, ".iso-stage svg", 1]]);
  const run = spawnSync("bun", [DRIVE, join(FIGURES, `${figure}.html`), actions, "--width", "1240", "--height", "900", "--theme", "light"], { encoding: "utf8" });
  if (run.status !== 0 || !existsSync(full)) throw new Error(`capture failed for ${figure}:\n${run.stdout}${run.stderr}`);
  // The drawing is 1200x800; keep the middle 1200x630
  const crop = spawnSync("sips", ["--resampleWidth", "1200", full, "--out", full], { encoding: "utf8" });
  const cut = spawnSync("sips", ["--cropToHeightWidth", "630", "1200", full, "--out", out], { encoding: "utf8" });
  spawnSync("rm", ["-f", full]);
  if (crop.status !== 0 || cut.status !== 0) throw new Error(`crop failed for ${figure}: ${crop.stderr}${cut.stderr}`);
  console.log("wrote", out);
}

for (const slug of wanted) {
  if (!existsSync(join(FIGURES, `${slug}.html`))) {
    console.warn(`no figure for ${slug}; it will use the site image`);
    continue;
  }
  shoot(slug, join(OUT, `${slug}.png`));
}
if (!process.argv.slice(2).length) shoot(SITE_FIGURE, join(OUT, "site.png"));
