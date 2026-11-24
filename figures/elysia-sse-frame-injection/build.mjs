// Fig: SSE frame injection in Elysia's sse() (GHSA-2458-2qvh-2p36, CWE-113, fixed in 1.4.31).
// Drawn in Elysia's own look: its docs' rounded cards and pink / fuchsia brand colours (#f06292, #e879f9).
// Left: the chat message from the query string, newlines shown. Middle: the text/event-stream bytes Elysia
// writes, one line at a time. Right: a browser EventSource parsing them, with its type and data buffers and three
// listeners. The bytes and the dispatched events are the ones measured on elysia 1.4.30 / 1.4.31 (Bun 1.4.1)
// and run through a WHATWG event-stream parser:
//   1.4.30 -> forged("a"), message("pwned"); the chat listener never fires.
//   1.4.31 -> one chat event whose data is the attacker's text, literally.
import { writeFigure } from "../embed.mjs";

const W = 640;
const H = 392;
const CH = 6.6; // advance of an 11px monospace glyph

const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const text = (x, y, value, cls, extra = "") => `<text x="${x}" y="${y}" class="${cls}"${extra}>${esc(value)}</text>`;

// ---- Model: measured bytes, one entry per line; "" is the blank line that dispatches ----
const WIRE = {
  old: ["event: chat", "data: a", "event: forged", "", "data: pwned", ""],
  new: ["event: chat", "data: a", "data: event: forged", "data: ", "data: data: pwned", ""],
};

// Replays the WHATWG rules over a prefix of lines: returns the parser buffers and the events fired so far
function parse(lines) {
  let type = "";
  let data = "";
  const fired = [];
  for (const line of lines) {
    if (line === "") {
      if (data !== "") fired.push({ type: type || "message", data: data.slice(0, -1) });
      type = "";
      data = "";
      continue;
    }
    const colon = line.indexOf(":");
    const field = line.slice(0, colon);
    const value = line.slice(colon + 1).replace(/^ /, "");
    if (field === "event") type = value;
    if (field === "data") data += value + "\n";
  }
  return { type, data, fired };
}
const STATES = Object.fromEntries(
  Object.entries(WIRE).map(([mode, lines]) => [mode, lines.map((_, i) => parse(lines.slice(0, i + 1)))]),
);
// For each mode, the line index whose blank line fires each event type
const FIRED_AT = Object.fromEntries(
  Object.entries(STATES).map(([mode, states]) => [
    mode,
    Object.fromEntries(states.flatMap((state, i) => (i > 0 && state.fired.length > states[i - 1].fired.length ? [[state.fired.at(-1).type, i]] : []))),
  ]),
);

// ---- Layout ----
const COL = { req: 18, wire: 236, browser: 430 };
const WIRE_Y0 = 92;
const WIRE_STEP = 22;
const LISTENERS = ["chat", "forged", "message"];
const SLOT_Y0 = 180;
const SLOT_H = 64;

function card(x, y, w, h, title, tone = "line") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" class="ey-card ey-card-${tone}"/>` + text(x + 12, y + 18, title, "ey-card-title");
}

function chrome() {
  return [
    `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="12" class="ey-window"/>`,
    `<path d="M6 36H${W - 6}" class="ey-rule"/>`,
    `<text x="22" y="26" class="ey-brand">Elysia</text>`,
    text(W / 2, 26, "GET /feed?msg=…  ·  Bun", "ey-dim", ' text-anchor="middle"'),
    `<g data-ver="old"><rect x="${W - 118}" y="14" width="100" height="18" rx="9" class="ey-pill-old"/>${text(W - 68, 27, "elysia 1.4.30", "ey-pill-text", ' text-anchor="middle"')}</g>`,
    `<g data-ver="new" style="opacity:0"><rect x="${W - 118}" y="14" width="100" height="18" rx="9" class="ey-pill-new"/>${text(W - 68, 27, "elysia 1.4.31", "ey-pill-text ey-pill-text-on", ' text-anchor="middle"')}</g>`,
  ].join("");
}

function request() {
  const out = [card(COL.req, 50, 204, 150, "the chat message (?msg=)")];
  // The message, with each newline drawn as a visible return glyph
  const rows = [["a", true], ["event: forged", true], ["", true], ["data: pwned", false]];
  rows.forEach(([value, newline], i) => {
    const y = 84 + i * 20;
    out.push(text(COL.req + 14, y, value, "ey-code"));
    if (newline) out.push(text(COL.req + 14 + value.length * CH + (value ? 4 : 0), y, "⏎", "ey-nl"));
  });
  out.push(card(COL.req, 212, 204, 164, "the route"));
  const code = [
    ["new Elysia()", "ey-code"],
    ["  .get('/feed',", "ey-code"],
    ["    function* ({ query }) {", "ey-code"],
    ["      yield sse({", "ey-code"],
    ["        event: 'chat',", "ey-code"],
    ["        data: query.msg", "ey-pink"],
    ["      })", "ey-code"],
    ["    })", "ey-code"],
  ];
  code.forEach(([value, cls], i) => out.push(text(COL.req + 14, 246 + i * 15, value, `${cls} ey-small`)));
  return out.join("");
}

function wire() {
  const out = [card(COL.wire, 50, 182, 326, "the wire: text/event-stream")];
  for (const mode of ["old", "new"]) {
    out.push(`<g data-wire="${mode}"${mode === "new" ? ' style="opacity:0"' : ""}>`);
    WIRE[mode].forEach((line, i) => {
      const y = WIRE_Y0 + i * WIRE_STEP;
      const blank = line === "";
      out.push(
        `<g data-line="${mode}-${i}" style="opacity:0">` +
          `<rect x="${COL.wire + 10}" y="${y - 14}" width="162" height="19" rx="5" class="ey-chip${blank ? " ey-chip-blank" : ""}" data-chip="${mode}-${i}"/>` +
          (blank ? text(COL.wire + 18, y, "(blank line: dispatch)", "ey-dim ey-small") : text(COL.wire + 18, y, line, "ey-code")) +
        `</g>`,
      );
    });
    out.push("</g>");
  }
  return out.join("");
}

function browser() {
  const out = [card(COL.browser, 50, W - 18 - COL.browser, 326, "the browser: EventSource")];
  // Parser buffers, filled by the live code
  out.push(`<rect x="${COL.browser + 10}" y="76" width="${W - 38 - COL.browser}" height="94" rx="7" class="ey-state"/>`);
  out.push(text(COL.browser + 20, 96, "type", "ey-dim ey-small"), text(COL.browser + 20, 124, "data", "ey-dim ey-small"));
  out.push(`<text data-state="type" x="${COL.browser + 62}" y="96" class="ey-code ey-strong"></text>`);
  for (let i = 0; i < 3; i++) out.push(`<text data-state="data-${i}" x="${COL.browser + 62}" y="${124 + i * 15}" class="ey-code"></text>`);
  LISTENERS.forEach((name, i) => {
    const y = SLOT_Y0 + i * SLOT_H;
    const label = name === "message" ? "onmessage" : `on '${name}'`;
    out.push(
      `<rect x="${COL.browser + 10}" y="${y}" width="${W - 38 - COL.browser}" height="${SLOT_H - 8}" rx="7" class="ey-slot" data-slot="${name}"/>` +
        `<rect x="${COL.browser + 10}" y="${y}" width="${W - 38 - COL.browser}" height="${SLOT_H - 8}" rx="7" class="ey-slot-hit" data-hit="${name}" style="opacity:0"/>` +
        text(COL.browser + 20, y + 17, label, "ey-listener") +
        `<text data-recv="${name}-0" x="${COL.browser + 20}" y="${y + 34}" class="ey-code ey-small"></text>` +
        `<text data-recv="${name}-1" x="${COL.browser + 20}" y="${y + 48}" class="ey-code ey-small"></text>`,
    );
  });
  return out.join("");
}

const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(
  "Three panels. Left: a chat message containing newlines, sent to an Elysia route that yields sse({ event: 'chat', data: query.msg }). Middle: the text/event-stream lines Elysia writes. Right: a browser EventSource with its type and data buffers and listeners for chat, forged and the default message event. On elysia 1.4.30 the injected event: forged line overwrites the type, so a forged event carries 'a', a second message event carries 'pwned', and the chat listener never fires. On 1.4.31 each line of the message becomes its own data: line and one chat event arrives with the text shown literally.",
)}" class="ey">${chrome()}${request()}${wire()}${browser()}</svg>`;

const live = `
const WIRE = ${JSON.stringify(WIRE)};
const STATES = ${JSON.stringify(STATES)};
const FIRED_AT = ${JSON.stringify(FIRED_AT)};
const LISTENERS = ${JSON.stringify(LISTENERS)};
const START = 0.6, STEP = 0.8;
const END = START + STEP * 6;
const CYCLE = END + 3, RESET = CYCLE - 0.9;

const svg = document.querySelector(".iso-stage svg");
const q = (sel) => svg.querySelector(sel);
const setO = (el, v) => { const s = v.toFixed(3); if (el.style.opacity !== s) el.style.opacity = s; };
const setT = (el, v) => { if (el.textContent !== v) el.textContent = v; };
const show = (value) => value.length > 24 ? value.slice(0, 23) + "…" : value;

// The line being read and the lines already written, as a pure function of t
const progress = (t) => (t - START) / STEP;

function phaseOf(t, fixed) {
  if (t >= RESET) return "resetting";
  const k = Math.floor(progress(t));
  const mode = fixed ? "new" : "old";
  if (k < 0) return "a chat message with newlines in it";
  if (k >= WIRE[mode].length) return fixed ? "1 chat event · the text arrives literally" : "chat never fired · forged: a · message: pwned";
  const line = WIRE[mode][k];
  if (line === "") return "blank line → dispatch";
  if (!fixed && line === "event: forged") return "event: forged overwrites the type";
  return "reading: " + line;
}

runFigure({
  cycle: CYCLE,
  scrubEnd: END + 0.3,
  steps: [0.2, ...WIRE.old.map((_, i) => START + STEP * (i + 0.6)), END + 0.4],
  label: (fixed) => (fixed ? "Fixed: newlines split (1.4.31)" : "Apply the fix (1.4.31)"),
  phase: phaseOf,
  draw(t, fixed) {
    const mode = fixed ? "new" : "old";
    const fade = 1 - ease(RESET, RESET + 0.6, t);
    const p = progress(t);
    const k = Math.min(Math.floor(p), WIRE[mode].length - 1);
    setO(q('[data-ver="old"]'), fixed ? 0 : 1);
    setO(q('[data-ver="new"]'), fixed ? 1 : 0);
    setO(q('[data-wire="old"]'), fixed ? 0 : 1);
    setO(q('[data-wire="new"]'), fixed ? 1 : 0);
    WIRE[mode].forEach((line, i) => {
      setO(q('[data-line="' + mode + "-" + i + '"]'), ease(START + STEP * i, START + STEP * i + 0.25, t) * fade);
      q('[data-chip="' + mode + "-" + i + '"]').classList.toggle("ey-chip-now", i === k && p >= 0 && p < WIRE[mode].length);
    });
    const state = k >= 0 ? STATES[mode][k] : { type: "", data: "", fired: [] };
    const fired = fade > 0.5 ? state.fired : [];
    setT(q('[data-state="type"]'), k >= 0 && fade > 0.5 ? (state.type || "(none)") : "");
    const dataLines = state.data && fade > 0.5 ? state.data.slice(0, -1).split("\\n") : [];
    for (let i = 0; i < 3; i++) setT(q('[data-state="data-' + i + '"]'), i < dataLines.length ? show(JSON.stringify(dataLines[i]).slice(1, -1) || "(empty line)") : "");
    for (const name of LISTENERS) {
      const event = fired.find((e) => e.type === name);
      const at = event ? START + STEP * FIRED_AT[mode][name] : -1;
      const lines = event ? event.data.split("\\n") : [];
      const first = event ? show(lines[0]) + (lines.length > 1 ? "  ⏎ " + lines.length + " lines" : "") : (name === "chat" && t >= END && t < RESET ? "never fired" : "");
      const second = event && lines.length > 1 ? show(lines.slice(1).join(" ⏎ ")) : "";
      setT(q('[data-recv="' + name + '-0"]'), first);
      setT(q('[data-recv="' + name + '-1"]'), second);
      q('[data-recv="' + name + '-0"]').classList.toggle("ey-missing", !event && name === "chat" && t >= END);
      setO(q('[data-hit="' + name + '"]'), event ? 1 - ease(at + 0.05, at + 1.2, t) : 0);
      q('[data-slot="' + name + '"]').classList.toggle("ey-slot-on", !!event);
    }
  },
});
`;

// Light values first, dark overrides. Elysia's brand: pink #f06292, fuchsia #e879f9, violet-tinted dark page.
const css = `
.iso{--ey-bg:#fffafd;--ey-card:#ffffff;--ey-line:#eadfe8;--ey-text:#2a2230;--ey-dim:#8b8090;--ey-pink:#c2185b;--ey-fuchsia:#a21caf;
  --ey-chip:#fbf3f8;--ey-now:#fde3ef;--ey-hit:rgba(240,98,146,.28);--ey-state:#f7f2fb;--ey-on:#fdf0f6;--ey-missing:#b42318}
.iso[data-theme="dark"]{--ey-bg:#1d1720;--ey-card:#241c27;--ey-line:#3a2f3e;--ey-text:#ece4ef;--ey-dim:#9a8fa0;--ey-pink:#f06292;--ey-fuchsia:#e879f9;
  --ey-chip:#2b2230;--ey-now:#4a2540;--ey-hit:rgba(240,98,146,.32);--ey-state:#211a25;--ey-on:#30202f;--ey-missing:#f07167}
.ey{display:block;width:100%;height:auto;font-family:var(--anatomy-mono);font-size:11px}
.ey text{white-space:pre}
.ey-window{fill:var(--ey-bg);stroke:var(--ey-line)}
.ey-rule{stroke:var(--ey-line);fill:none}
.ey-brand{fill:var(--ey-pink);font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;font-weight:800;letter-spacing:.2px}
.ey-dim{fill:var(--ey-dim)}
.ey-pill-old{fill:none;stroke:var(--ey-pink)}.ey-pill-new{fill:var(--ey-pink);stroke:var(--ey-pink)}
.ey-pill-text{fill:var(--ey-text);font-size:10px}.ey-pill-text-on{fill:#ffffff;font-weight:700}
.ey-card{fill:var(--ey-card);stroke:var(--ey-line)}
.ey-card-title{fill:var(--ey-fuchsia);font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:700}
.ey-code{fill:var(--ey-text)}.ey-strong{font-weight:700}.ey-pink{fill:var(--ey-pink);font-weight:700}.ey-small{font-size:10.5px}
.ey-nl{fill:var(--ey-pink);font-weight:700}
.ey-chip{fill:var(--ey-chip);stroke:var(--ey-line)}
.ey-chip-blank{fill:none;stroke-dasharray:3 3}
.ey-chip-now{fill:var(--ey-now);stroke:var(--ey-pink)}
.ey-state{fill:var(--ey-state);stroke:var(--ey-line)}
.ey-slot{fill:none;stroke:var(--ey-line)}
.ey-slot-on{fill:var(--ey-on);stroke:var(--ey-pink)}
.ey-slot-hit{fill:var(--ey-hit)}
.ey-listener{fill:var(--ey-fuchsia);font-weight:700}
.ey-missing{fill:var(--ey-missing)}
@media (max-width:420px){.iso-stage svg{width:100%;margin:0}}
`;

writeFigure("elysia-sse-frame-injection", {
  fig: "Fig 1",
  title: "One message, two events",
  hint: "Hover to scrub · arrows step",
  readout: "a chat message with newlines in it",
  keys: [],
  caption:
    "Measured on Elysia 1.4.30 and 1.4.31 (Bun 1.4.1) and parsed with the WHATWG event-stream rules. On 1.4.30 the injected event: forged line overwrites the chat type, so the browser fires forged with 'a' and a second message with 'pwned', and the chat listener never fires. On 1.4.31 every line of the message gets its own data: line and one chat event arrives with the text intact.",
  svg,
  stageLabel: "Elysia SSE parsing. Arrow keys step through the stream; Space applies or removes the fix.",
  live,
  css,
});
