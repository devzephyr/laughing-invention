// Fig 2: a page on another site reaches the loopback gateway (praisonai-bot, GHSA-9426-q567-pc36, gateway area).
// A sequence diagram in the style of a WebSocket frame inspector, three lanes: the evil.example page, the
// operator's browser (so the TCP peer is 127.0.0.1) and the praisonai-bot gateway on ws://127.0.0.1:8765
// with no token set. 4.7.26: check_origin returns True for any Origin on a loopback bind, so the socket opens.
// 4.8.0: check_origin needs an Origin on this machine; the gateway sends the hello_error frame, closes with 4003
// and logs the rejection. Frame fields, close code and log strings are copied from the 4.8.0 source.
import { writeFigure } from "../embed.mjs";

const W = 640;
const H = 392;
const CH = 6.3; // advance of a 10.5px monospace glyph (log and notes)
const MSG_CH = 6.9; // 11.5px message labels
const HEAD_CH = 7.2; // 12px lane headers

const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const text = (x, y, value, cls, extra = "") => `<text x="${x}" y="${y}" class="${cls}"${extra}>${esc(value)}</text>`;

const LANES = { page: 92, browser: 300, gateway: 532 };
const TOP = 98; // lifelines start under the lane headers
const BOTTOM = 318;

function laneHeader(x, title, sub, tone) {
  const w = Math.max(title.length, sub.length) * HEAD_CH + 20;
  return [
    `<rect x="${x - w / 2}" y="44" width="${w}" height="44" rx="6" class="pt-panel pt-border-${tone} pt-fill"/>`,
    text(x, 62, title, `pt-title pt-${tone === "dim" ? "text" : tone}`, ' text-anchor="middle"'),
    text(x, 79, sub, "pt-dim", ' text-anchor="middle"'),
    `<path d="M${x} ${TOP}V${BOTTOM}" class="pt-lifeline"/>`,
  ].join("");
}

// A message arrow between two lanes; its line draws in from `from` and its labels fade in after it
function message(id, from, to, y, labels, tone, labelX) {
  const dir = Math.sign(to - from);
  const tip = to - dir * 4;
  const length = Math.abs(tip - from);
  const lx = labelX ?? Math.min(from, to) + 10;
  const rows = labels.map((label, i) => {
    const [value, cls] = Array.isArray(label) ? label : [label, "pt-text"];
    const ly = y - 7 - (labels.length - 1 - i) * 15;
    return `<rect x="${lx - 3}" y="${ly - 11}" width="${value.length * MSG_CH + 6}" height="14" class="pt-knock"/>` + text(lx, ly, value, `${cls} pt-msg`);
  });
  return `<g data-msg="${id}" style="opacity:0">` +
    `<path data-line="${id}" d="M${from} ${y}H${tip}" class="pt-arrow pt-stroke-${tone}" style="stroke-dasharray:${length};stroke-dashoffset:${length}"/>` +
    `<path data-head="${id}" d="M${to} ${y}l${-dir * 7} -4v8z" class="pt-head-${tone}" style="opacity:0"/>` +
    `<g data-label="${id}" style="opacity:0">${rows.join("")}</g>` +
    `</g>`;
}

// The gateway's own check, drawn as a note box against its lifeline
function checkBox() {
  const x = 360;
  const w = W - 18 - x;
  return `<g data-msg="check" style="opacity:0">` +
    `<rect x="${x}" y="174" width="${w}" height="40" rx="5" class="pt-note"/>` +
    text(x + 10, 190, 'check_origin(origin, [], "127.0.0.1")', "pt-cyan pt-small") +
    `<g data-verdict="old">${text(x + 10, 206, "True: loopback bind, Origin never read", "pt-red pt-small")}</g>` +
    `<g data-verdict="new" style="opacity:0">${text(x + 10, 206, "False: Origin is not this machine", "pt-green pt-small")}</g>` +
    `</g>`;
}

function log() {
  return [
    `<rect x="18" y="330" width="${W - 36}" height="48" rx="5" class="pt-panel pt-border-dim pt-fill"/>`,
    `<rect x="28" y="323" width="${"gateway log".length * CH + 12}" height="14" class="pt-knock"/>`,
    text(34, 334, "gateway log", "pt-title pt-dim pt-small"),
    text(30, 352, "INFO  Gateway started on ws://127.0.0.1:8765", "pt-dim pt-small"),
    `<g data-log style="opacity:0">${text(30, 368, "WARN  WebSocket connection rejected: origin 'https://evil.example' not in allowed list", "pt-yellow pt-small")}</g>`,
  ].join("");
}

const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(
  "Sequence diagram. A page on evil.example, open in your browser, opens a WebSocket to the praisonai-bot gateway on ws://127.0.0.1:8765, which has no token set. The browser sends the handshake from 127.0.0.1 with Origin https://evil.example. In 4.7.26 check_origin returns True for any Origin on a loopback bind and the socket opens, so the page can use the gateway's chat, tools and approvals. In 4.8.0 check_origin returns False, the gateway sends a hello_error frame with code origin_not_allowed, closes with 4003 and logs the rejection.",
)}" class="pt">` +
  `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="9" class="pt-window"/>` +
  `<path d="M6 32H${W - 6}" class="pt-rule"/>` +
  text(22, 23.5, "▶ Praison AI", "pt-brand") +
  text(W / 2, 23.5, "praisonai-bot gateway · ws frames", "pt-dim", ' text-anchor="middle"') +
  `<g data-ver="old">${text(W - 22, 23.5, "praisonai-bot < 0.2.0", "pt-version", ' text-anchor="end"')}</g>` +
  `<g data-ver="new" style="opacity:0">${text(W - 22, 23.5, "praisonai-bot 0.2.0", "pt-version", ' text-anchor="end"')}</g>` +
  laneHeader(LANES.page, "evil.example", "a tab you have open", "red") +
  laneHeader(LANES.browser, "your browser", "TCP peer 127.0.0.1", "dim") +
  laneHeader(LANES.gateway, "praisonai-bot gateway", "127.0.0.1:8765, no token", "cyan") +
  message("open", LANES.page, LANES.browser, 128, ["new WebSocket(", '  "ws://127.0.0.1:8765/ws")'], "red") +
  message("hs", LANES.browser, LANES.gateway, 164, ["GET /ws  Upgrade: websocket", ["Origin: https://evil.example", "pt-yellow"]], "dim") +
  checkBox() +
  `<g data-path="old">` +
  message("ok", LANES.gateway, LANES.page, 252, [["101 Switching Protocols · socket open", "pt-red"]], "red", 112) +
  message("drive", LANES.page, LANES.gateway, 296, [["the page talks to chat, tools and approvals", "pt-red"]], "red", 112) +
  `</g>` +
  `<g data-path="new">` +
  message("deny", LANES.gateway, LANES.page, 262, [
    ['{"type": "hello_error", "code": "origin_not_allowed",', "pt-green"],
    [' "message": "Origin not allowed", "next_step": "do_not_retry"}', "pt-green"],
  ], "green", 112) +
  message("close", LANES.gateway, LANES.page, 296, [["close 4003", "pt-green"]], "green", 112) +
  `</g>` +
  log() +
  `</svg>`;

const live = `
// Every element is a pure function of t: lines draw in, then heads and labels fade in.
const T = { open: 0.5, hs: 1.6, check: 2.7, ok: 3.7, drive: 4.8, deny: 3.7, close: 4.8, log: 4.4 };
const DRAW = 0.55, LABEL = 0.25;
const END = 5.8, CYCLE = 9.2, RESET = CYCLE - 0.9;
const OLD = ["open", "hs", "check", "ok", "drive"], NEW = ["open", "hs", "check", "deny", "close"];

const svg = document.querySelector(".iso-stage svg");
const q = (sel) => svg.querySelector(sel);
const parts = (id) => ({ g: q('[data-msg="' + id + '"]'), line: q('[data-line="' + id + '"]'), head: q('[data-head="' + id + '"]'), label: q('[data-label="' + id + '"]') });
const MSGS = Object.fromEntries(["open", "hs", "ok", "drive", "deny", "close"].map((id) => [id, parts(id)]));
const check = q('[data-msg="check"]'), logLine = q("[data-log]");
const setO = (el, v) => { const s = v.toFixed(3); if (el.style.opacity !== s) el.style.opacity = s; };
const lengths = Object.fromEntries(Object.entries(MSGS).map(([id, m]) => [id, parseFloat(m.line.style.strokeDasharray)]));

function phaseOf(t, fixed) {
  if (t >= RESET) return "resetting";
  if (t < T.open) return "evil.example is open in your browser";
  if (t < T.hs) return "page opens ws://127.0.0.1:8765/ws";
  if (t < T.check) return "handshake from 127.0.0.1 · Origin: https://evil.example";
  if (t < T.ok) return fixed ? "check_origin → False" : "check_origin → True (loopback bind)";
  if (t < END) return fixed ? "hello_error · origin_not_allowed" : "socket open · no token set";
  return fixed ? "close 4003 · Origin not allowed" : "evil.example holds a gateway session";
}

runFigure({
  cycle: CYCLE,
  scrubEnd: END + 0.2,
  steps: [0.2, T.hs + 0.8, T.check + 0.6, T.ok + 0.8, END + 0.3],
  label: (fixed) => (fixed ? "Fixed: Origin checked (4.8.0)" : "Apply the fix (4.8.0)"),
  phase: phaseOf,
  draw(t, fixed) {
    const fade = 1 - ease(RESET, RESET + 0.6, t);
    const shown = fixed ? NEW : OLD;
    setO(q('[data-ver="old"]'), fixed ? 0 : 1);
    setO(q('[data-ver="new"]'), fixed ? 1 : 0);
    setO(q('[data-path="old"]'), fixed ? 0 : 1);
    setO(q('[data-path="new"]'), fixed ? 1 : 0);
    setO(q('[data-verdict="old"]'), fixed ? 0 : 1);
    setO(q('[data-verdict="new"]'), fixed ? 1 : 0);
    for (const [id, m] of Object.entries(MSGS)) {
      const on = shown.includes(id);
      const start = T[id];
      const draw = on ? ease(start, start + DRAW, t) : 0;
      setO(m.g, on ? fade * (t >= start ? 1 : 0) : 0);
      m.line.style.strokeDashoffset = (lengths[id] * (1 - draw)).toFixed(1);
      setO(m.head, ease(start + DRAW - 0.1, start + DRAW + 0.05, t));
      setO(m.label, ease(start + DRAW - 0.15, start + DRAW + LABEL, t));
    }
    setO(check, ease(T.check, T.check + 0.35, t) * fade);
    setO(logLine, fixed ? ease(T.log, T.log + 0.3, t) * fade : 0);
  },
});
`;

const extraCss = `
.pt-fill{fill:var(--pt-bg)}
.pt-border-red{stroke:var(--pt-red)}
.pt-msg{font-size:11.5px}
.pt-lifeline{stroke:var(--pt-frame);stroke-dasharray:3 4;fill:none}
.pt-arrow{fill:none;stroke-width:1.4}
.pt-stroke-red{stroke:var(--pt-red)}.pt-stroke-dim{stroke:var(--pt-dim)}.pt-stroke-green{stroke:var(--pt-green)}
.pt-head-red{fill:var(--pt-red)}.pt-head-dim{fill:var(--pt-dim)}.pt-head-green{fill:var(--pt-green)}
.pt-note{fill:var(--pt-bg);stroke:var(--pt-cyan);stroke-dasharray:4 3}
`;

/** Writes Fig 2 with the shared PraisonAI palette (`css`) from build.mjs. */
export function writeGatewayFigure(css) {
  writeFigure("praisonai-project-file-trust-2", {
    fig: "Fig 2",
    title: "A page on localhost",
    hint: "Hover to scrub · arrows step",
    readout: "evil.example is open in your browser",
    keys: [],
    caption:
      "The praisonai-bot gateway on 127.0.0.1:8765 with no token set. A page on another site opens a WebSocket to it through your browser, so the connection comes from 127.0.0.1. Before 4.8.0 check_origin approved any Origin on a loopback bind and the socket opened. In 4.8.0 it requires an Origin on this machine: the gateway sends a hello_error frame, closes with 4003 and logs the rejection.",
    svg,
    stageLabel: "Gateway WebSocket sequence. Arrow keys step through the handshake; Space applies or removes the fix.",
    live,
    css: css + extraCss,
  });
}
