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
  const size = spawnSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", full], { encoding: "utf8" }).stdout;
  const [width, height] = ["pixelWidth", "pixelHeight"].map((key) => Number(size.match(new RegExp(`${key}: (\\d+)`))?.[1]));
  if (!width || !height) throw new Error(`could not read the size of ${full}`);
  // Isometric drawings are 3:2 with empty margins: scale to 1200x800 and keep the middle 630 rows.
  // Any other shape (a terminal, a diagram) has no margin to lose: fit it inside 1200x630 and pad.
  const isometric = Math.abs(width / height - 1.5) < 0.02;
  const steps = isometric
    ? [["--resampleWidth", "1200", full, "--out", full], ["--cropToHeightWidth", "630", "1200", full, "--out", out]]
    : [[...(width / height > 1200 / 590 ? ["--resampleWidth", "1160"] : ["--resampleHeight", "590"]), full, "--out", full],
       ["--padToHeightWidth", "630", "1200", "--padColor", "FBFBF9", full, "--out", out]];
  const failed = steps.map((args) => spawnSync("sips", args, { encoding: "utf8" })).find((run) => run.status !== 0);
  spawnSync("rm", ["-f", full]);
  if (failed) throw new Error(`crop failed for ${figure}: ${failed.stderr}`);
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
