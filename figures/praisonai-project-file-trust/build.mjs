// Fig: a cloned repo grants itself capabilities (PraisonAI < 4.8.0, GHSA-9426-q567-pc36, project-file trust).
// Drawn in PraisonAI's own idiom: the rich-console CLI (rounded panels with cyan / yellow / green borders,
// a cyan-yellow-green table, the "▶ Praison AI" mark from praisonai_code/cli/branding.py).
// Left: the user's ~/.praisonai/config.yaml and the cloned repo's files. Right: the effective config and a log.
// 4.7.26: each of the repo's three keys merges into the effective config and takes effect.
// 4.8.0: drop_project_trust_keys (and the MCP trust filter) sits between the two, stops each key, and the log
// shows the warning 4.8.0 actually emits (strings copied from config/trust.py and mcp/trust.py, paths shortened).
import { writeFigure } from "../embed.mjs";
import { writeGatewayFigure } from "./gateway.mjs";

const W = 640;
const H = 400;
const MONO = 7.2; // advance of a 12px monospace glyph

const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const text = (x, y, value, cls, extra = "") => `<text x="${x}" y="${y}" class="${cls}"${extra}>${esc(value)}</text>`;

// ---- Model, from the post ----
const KEYS = [
  { name: "mcp.servers.pwn", left: { x: 36, y: 176 }, result: "runs python3", effect: ["python3 ran, wrote /tmp/praisonai_mcp_pwned"],
    warning: ["warning: Not starting MCP server 'pwn' from", "  praisonai.yaml: a project file cannot choose", "  a program to run."] },
  { name: "allow_project_plugins", left: { x: 48, y: 252 }, result: "imports .py", effect: ["imported .praisonai/plugins/exfil.py"],
    warning: ["warning: Ignoring plugins.allow_project_plugins", "  from project file .praisonai/config.yaml:", "  a project file cannot grant this."] },
  { name: "allow_shell", left: { x: 36, y: 296 }, result: "runs !`id`", effect: ["!`id` ran as you"],
    warning: ["warning: Ignoring allow_shell from project file", "  .praisonai/commands/status.md: a project file", "  cannot grant this."] },
];

// ---- Layout ----
const LEFT = { x: 20, w: 248 };
const GATE_X = 281;
const RIGHT = { x: 296, w: 326 };
const TABLE = { y: 48, h: 128, rows: [106, 128, 150], cols: [306, 474, 530] };
const LOG = { y: 190, h: 194, first: 216, line: 14 };

function panel({ x, y, w, h, title, tone }) {
  // A rich Panel: rounded border with its title cut into the top edge
  const titleWidth = title.length * MONO + 12;
  return [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" class="pt-panel pt-border-${tone}"/>`,
    `<rect x="${x + 10}" y="${y - 7}" width="${titleWidth}" height="14" class="pt-knock"/>`,
    text(x + 16, y + 4, title, `pt-title pt-${tone}`),
  ].join("");
}

function chrome() {
  return [
    `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="9" class="pt-window"/>`,
    `<path d="M6 34H${W - 6}" class="pt-rule"/>`,
    text(22, 25.5, "▶ Praison AI", "pt-brand"),
    text(W / 2, 25, "~/src/cloned-repo", "pt-dim", ' text-anchor="middle"'),
    `<g data-ver="old">${text(W - 22, 25, "praisonai 4.7.26", "pt-version", ' text-anchor="end"')}</g>`,
    `<g data-ver="new" style="opacity:0">${text(W - 22, 25, "praisonai 4.8.0", "pt-version", ' text-anchor="end"')}</g>`,
  ].join("");
}

function userConfig() {
  return [
    panel({ x: LEFT.x, y: 48, w: LEFT.w, h: 58, title: "~/.praisonai/config.yaml", tone: "green" }),
    text(36, 76, "# your own settings", "pt-dim"),
    text(36, 93, "mcp.trusted_servers: []", "pt-text"),
  ].join("");
}

function repo() {
  const lines = [
    [36, 160, "praisonai.yaml", "pt-file"],
    [48, 192, "command: python3", "pt-text"],
    [36, 220, ".praisonai/config.yaml", "pt-file"],
    [36, 236, "plugins:", "pt-text"],
    [36, 280, ".praisonai/commands/status.md", "pt-file"],
    [36, 312, "Status: !`id`", "pt-text"],
    [36, 344, ".praisonai/plugins/exfil.py", "pt-file pt-dim"],
  ];
  const out = [panel({ x: LEFT.x, y: 126, w: LEFT.w, h: 258, title: "cloned-repo/ (project files)", tone: "yellow" })];
  // The three key lines, each with a highlight bar the live code turns on while it is read
  KEYS.forEach((key, i) => {
    const value = i === 0 ? ":" : ": true";
    out.push(`<rect data-hl="${i}" x="${key.left.x - 6}" y="${key.left.y - 11}" width="${LEFT.x + LEFT.w - key.left.x - 4}" height="15" rx="3" class="pt-hl" style="opacity:0"/>`);
    out.push(text(key.left.x, key.left.y, key.name, "pt-key") + text(key.left.x + key.name.length * MONO, key.left.y, value, "pt-text"));
  });
  for (const [x, y, value, cls] of lines) out.push(text(x, y, value, cls));
  return out.join("");
}

function gate() {
  // Only exists in 4.8.0: every reader of a project file calls drop_project_trust_keys
  const y0 = 126;
  const y1 = 384;
  return `<g data-gate style="opacity:0">` +
    `<rect x="${GATE_X - 5}" y="${y0}" width="10" height="${y1 - y0}" rx="3" class="pt-gate"/>` +
    `<rect data-gate-hit x="${GATE_X - 5}" y="${y0}" width="10" height="${y1 - y0}" rx="3" class="pt-gate-hit" style="opacity:0"/>` +
    `<text x="${GATE_X + 3.5}" y="${(y0 + y1) / 2}" class="pt-gate-label" text-anchor="middle" transform="rotate(-90 ${GATE_X + 3.5} ${(y0 + y1) / 2})">drop_project_trust_keys()</text>` +
    `</g>`;
}

function table() {
  const [kx, fx, rx] = TABLE.cols;
  const out = [panel({ x: RIGHT.x, y: TABLE.y, w: RIGHT.w, h: TABLE.h, title: "effective config", tone: "cyan" })];
  out.push(text(kx, 78, "key", "pt-head pt-cyan"), text(fx, 78, "from", "pt-head pt-yellow"), text(rx, 78, "result", "pt-head pt-green"));
  out.push(`<path d="M${RIGHT.x + 8} 87H${RIGHT.x + RIGHT.w - 8}" class="pt-rule"/>`);
  KEYS.forEach((key, i) => {
    const y = TABLE.rows[i];
    out.push(
      `<g data-row="${i}" style="opacity:0">` +
        text(kx, y, key.name, "pt-cyan", ` data-row-key="${i}"`) +
        text(fx, y, "project", "pt-yellow") +
        `<g data-result="old">${text(rx, y, key.result, "pt-red")}</g>` +
        `<g data-result="new">${text(rx, y, "dropped", "pt-dim")}</g>` +
        `<path data-strike="${i}" d="M${kx} ${y - 3.5}H${kx + key.name.length * MONO}" class="pt-strike"/>` +
      `</g>`,
    );
  });
  return out.join("");
}

function log() {
  const out = [panel({ x: RIGHT.x, y: LOG.y, w: RIGHT.w, h: LOG.h, title: "log", tone: "dim" })];
  out.push(`<g data-prompt style="opacity:0">${text(306, LOG.first, '$ praisonai run "hello"', "pt-text")}</g>`);
  KEYS.forEach((key, i) => {
    key.effect.forEach((line, j) => out.push(`<g data-log="old-${i}" style="opacity:0">${text(306, LOG.first + LOG.line * (1 + i), line, "pt-red pt-small")}</g>`));
    key.warning.forEach((line, j) => out.push(`<g data-log="new-${i}" style="opacity:0">${text(306, LOG.first + LOG.line * (1 + 3 * i + j), line, (j ? "pt-text" : "pt-yellow") + " pt-small")}</g>`));
  });
  return out.join("");
}

function tokens() {
  // The key in flight: a copy of the repo's line that travels toward the effective config
  return KEYS.map((key, i) => {
    const width = key.name.length * MONO + 10;
    return `<g data-token="${i}" style="opacity:0"><rect x="${key.left.x - 5}" y="${key.left.y - 11}" width="${width}" height="15" rx="3" class="pt-token"/>${text(key.left.x, key.left.y, key.name, "pt-token-text")}</g>`;
  }).join("");
}

const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(
  "A PraisonAI-style terminal. On the left, the user's own config and the files of a cloned repository, which sets mcp.servers.pwn, allow_project_plugins and allow_shell. On the right, the effective config and a log. In 4.7.26 each key merges into the effective config and takes effect: python3 starts, a project plugin is imported, a shell command runs. In 4.8.0 a drop_project_trust_keys filter between the two stops each key, and the log shows the warning PraisonAI prints.",
)}" class="pt">${chrome()}${userConfig()}${repo()}${gate()}${table()}${log()}${tokens()}</svg>`;

const live = `
const KEYS = ${JSON.stringify(KEYS.map((k) => ({ x: k.left.x, y: k.left.y, width: k.name.length * MONO + 10 })))};
const ROWS = ${JSON.stringify(TABLE.rows)}, KEY_COL = ${TABLE.cols[0]}, GATE_X = ${GATE_X};

// One step per key: highlight it in the repo, fly it right, land it (4.7.26) or stop it at the filter (4.8.0).
const PROMPT = [0.2, 0.6], FIRST = 1.2, EVERY = 2.6;
const stepOf = (i) => {
  const s = FIRST + i * EVERY;
  return { s, hl: [s, s + 0.3], fly: [s + 0.3, s + 1.2], land: [s + 1.2, s + 1.45], log: [s + 1.35, s + 1.7], off: s + 1.55 };
};
const STEPS = KEYS.map((_, i) => stepOf(i));
const END = STEPS[2].log[1];
const CYCLE = END + 3, RESET = CYCLE - 0.9;
const NAMES = ${JSON.stringify(KEYS.map((k) => ({ name: k.name, result: k.result })))};

function pose(t, fixed) {
  const fade = 1 - ease(RESET, RESET + 0.6, t);
  return KEYS.map((key, i) => {
    const st = STEPS[i];
    const fly = ease(...st.fly, t);
    const stopX = GATE_X - 7 - key.width;
    const target = fixed ? { x: stopX, y: key.y } : { x: KEY_COL, y: ROWS[i] };
    return {
      hl: ease(...st.hl, t) * (1 - ease(st.off, st.off + 0.3, t)) * fade,
      dx: (target.x - key.x) * fly,
      dy: (target.y - key.y) * fly,
      token: ease(st.hl[1], st.fly[0], t) * (1 - ease(...st.land, t)),
      row: ease(...st.land, t) * fade,
      hit: fixed ? ease(st.land[0], st.land[0] + 0.12, t) * (1 - ease(st.land[0] + 0.25, st.land[0] + 0.6, t)) : 0,
      log: ease(...st.log, t) * fade,
    };
  });
}

function phaseOf(t, fixed) {
  if (t >= RESET) return "resetting";
  if (t < FIRST) return "praisonai run · cloned repo";
  if (t >= END) return fixed ? "0 granted · user config only" : "3 capabilities granted by the repo";
  const i = STEPS.reduce((last, st, j) => (t >= st.s ? j : last), 0);
  const name = NAMES[i].name;
  if (t < STEPS[i].land[0]) return "merging " + name;
  return name + " → " + (fixed ? "dropped" : NAMES[i].result);
}

const svg = document.querySelector(".iso-stage svg");
const all = (sel) => [...svg.querySelectorAll(sel)];
const hl = all("[data-hl]"), tokens = all("[data-token]"), rows = all("[data-row]");
const oldLogs = (i) => all('[data-log="old-' + i + '"]'), newLogs = (i) => all('[data-log="new-' + i + '"]');
const gate = svg.querySelector("[data-gate]"), gateHit = svg.querySelector("[data-gate-hit]"), prompt = svg.querySelector("[data-prompt]");
const verOld = svg.querySelector('[data-ver="old"]'), verNew = svg.querySelector('[data-ver="new"]');
const setOpacity = (el, v) => { const s = v.toFixed(3); if (el.style.opacity !== s) el.style.opacity = s; };

runFigure({
  cycle: CYCLE,
  scrubEnd: END + 0.3,
  steps: [0.1, ...STEPS.map((st) => st.log[1]), END + 0.4],
  label: (fixed) => (fixed ? "Fixed: 4.8.0 drops project trust keys" : "Apply the fix (4.8.0)"),
  phase: phaseOf,
  draw(t, fixed) {
    const p = pose(t, fixed);
    setOpacity(verOld, fixed ? 0 : 1);
    setOpacity(verNew, fixed ? 1 : 0);
    setOpacity(gate, fixed ? 1 : 0);
    setOpacity(prompt, ease(...PROMPT, t) * (1 - ease(RESET, RESET + 0.6, t)));
    setOpacity(gateHit, Math.max(...p.map((k) => k.hit)));
    p.forEach((k, i) => {
      setOpacity(hl[i], k.hl);
      tokens[i].setAttribute("transform", "translate(" + k.dx.toFixed(2) + " " + k.dy.toFixed(2) + ")");
      setOpacity(tokens[i], k.token);
      setOpacity(rows[i], k.row);
      rows[i].querySelector('[data-result="old"]').style.opacity = fixed ? "0" : "1";
      rows[i].querySelector('[data-result="new"]').style.opacity = fixed ? "1" : "0";
      rows[i].querySelector("[data-strike]").style.opacity = fixed ? "1" : "0";
      rows[i].querySelector("[data-row-key]").style.opacity = fixed ? "0.45" : "1";
      oldLogs(i).forEach((el) => setOpacity(el, fixed ? 0 : k.log));
      newLogs(i).forEach((el) => setOpacity(el, fixed ? k.log : 0));
    });
  },
});
`;

// Light values first; dark overrides. Hues follow PraisonAI's rich styles: cyan names, yellow sources, green panels.
const css = `
.iso{--pt-bg:#fbfbf9;--pt-frame:#d6d6d0;--pt-text:#2b2b2b;--pt-dim:#8a8a84;--pt-cyan:#0e7490;--pt-yellow:#a16207;--pt-green:#15803d;--pt-red:#b42318;
  --pt-hl:rgba(161,98,7,.14);--pt-token:#0e7490;--pt-token-text:#ffffff;--pt-gate:#e9e6f5;--pt-gate-edge:#6d28d9;--pt-gate-hit:rgba(109,40,217,.35)}
.iso[data-theme="dark"]{--pt-bg:#0f1114;--pt-frame:#2a2d33;--pt-text:#d7d7d2;--pt-dim:#6c7078;--pt-cyan:#56c8d8;--pt-yellow:#e2b85c;--pt-green:#7fc98a;--pt-red:#f07167;
  --pt-hl:rgba(226,184,92,.16);--pt-token:#56c8d8;--pt-token-text:#0f1114;--pt-gate:#1f1a2e;--pt-gate-edge:#a78bfa;--pt-gate-hit:rgba(167,139,250,.4)}
.pt{display:block;width:100%;height:auto;font-family:var(--anatomy-mono);font-size:12px}
.pt text{white-space:pre}
.pt-window{fill:var(--pt-bg);stroke:var(--pt-frame)}
.pt-rule{stroke:var(--pt-frame);fill:none}
.pt-panel{fill:none;stroke-width:1.1}
.pt-knock{fill:var(--pt-bg)}
.pt-border-green{stroke:var(--pt-green)}.pt-border-yellow{stroke:var(--pt-yellow)}.pt-border-cyan{stroke:var(--pt-cyan)}.pt-border-dim{stroke:var(--pt-dim)}
.pt-title{font-weight:600}
.pt-brand{fill:var(--pt-cyan);font-weight:700}
.pt-version{fill:var(--pt-dim)}
.pt-text{fill:var(--pt-text)}.pt-dim{fill:var(--pt-dim)}.pt-file{fill:var(--pt-text);font-weight:600}
.pt-cyan{fill:var(--pt-cyan)}.pt-yellow{fill:var(--pt-yellow)}.pt-green{fill:var(--pt-green)}.pt-red{fill:var(--pt-red)}.pt-dim.pt-title{fill:var(--pt-dim)}
.pt-key{fill:var(--pt-yellow);font-weight:600}
.pt-head{font-weight:700}
.pt-small{font-size:10.5px}
.pt-hl{fill:var(--pt-hl)}
.pt-token{fill:var(--pt-token)}
.pt-token-text{fill:var(--pt-token-text);font-weight:700}
.pt-gate{fill:var(--pt-gate);stroke:var(--pt-gate-edge)}
.pt-gate-hit{fill:var(--pt-gate-hit)}
.pt-gate-label{fill:var(--pt-gate-edge);font-size:10.5px;font-weight:600}
.pt-strike{stroke:var(--pt-dim);stroke-width:1}
@media (max-width:420px){.iso-stage svg{width:100%;margin:0}}
`;

writeFigure("praisonai-project-file-trust", {
  fig: "Fig 1",
  title: "Who may grant",
  hint: "Hover to scrub · arrows step",
  readout: "praisonai run · cloned repo",
  keys: [],
  caption:
    "Before 4.8.0, PraisonAI merged three keys from a cloned repo's files into its effective config, so an MCP server started, a project plugin was imported and !`id` ran. In 4.8.0 drop_project_trust_keys and the MCP trust filter drop those keys unless they come from ~/.praisonai, and log the warnings shown (paths shortened).",
  svg,
  stageLabel: "PraisonAI config merge. Arrow keys step through the three keys; Space applies or removes the fix.",
  live,
  css,
});

// Fig 2, the loopback gateway, shares this palette
writeGatewayFigure(css);
