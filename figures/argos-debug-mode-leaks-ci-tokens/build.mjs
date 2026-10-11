// Fig: Argos debug mode prints CI tokens (GHSA-28pg-v3hp-9g7f, Medium 6.8, fixed in @argos-ci/core 6.8.5).
// process.env feeds four debug() call sites. media.ts and deploy.ts already strip the token; the CI-detection
// context and the upload params do not. Opening DEBUG prints GITHUB_TOKEN and ARGOS_TOKEN onto the CI log.
// The fix redacts inside the debug() wrapper, so every line passes one filter.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- Model, from the post ----
// The PoC's canary and its 40-character token, 'a'.repeat(40), cut to fit the tape
const TAPE = {
  bug: ["GITHUB_TOKEN=ghp_…", "ARGOS_TOKEN=aaaa…", "media: omitted"],
  fix: ["GITHUB_TOKEN=***", "ARGOS_TOKEN=***", "media: omitted"],
};

// ---- World layout ----
const PIPE = 6;
const PIPE_Z = 4;
const TANK = [-112, -42];
const TANK_R = 18;
const TANK_H = 44;
const HEADER = { x: TANK[0] + TANK_R - 1, y: -54, w: 0, d: PIPE };
const BRANCH_X = [-68, -34, 0, 32]; // CI detection, upload params, media.ts, deploy.ts
const SCREENED = [false, false, true, true];
HEADER.w = BRANCH_X[3] + PIPE / 2 - HEADER.x;
const COLLECT_Y = 22;
const PRINTER = { x: 46, y: 2, w: 40, d: 36, r: 2 };
const PRINTER_TOP = 28;
const COLLECT = { x: BRANCH_X[0] - PIPE / 2, y: COLLECT_Y, w: PRINTER.x - BRANCH_X[0] + PIPE / 2, d: PIPE };
const VALVE_X = -84;
const FILTER_Y = -16;
const TRAY = { x: PRINTER.x + PRINTER.w + 2, y: PRINTER.y + 4, w: 50, d: 28, r: 1.5 };
const TAPE_PLAN = { x: TRAY.x + 1, y: TRAY.y + 2, w: TRAY.w - 3, d: 24, r: 0.4 };
const TAPE_Z = 3.4;

// ---- Parts ----
const pipeX = (x, y, len) => S(k.slabOf({ x, y, w: len, d: PIPE, r: 1.6 }, PIPE_Z - PIPE / 2, PIPE, P, 3), { tone: "mid", crease: "none" });
const pipeY = (x, y, len) => S(k.slabOf({ x: x - PIPE / 2, y, w: PIPE, d: len, r: 1.6 }, PIPE_Z - PIPE / 2, PIPE, P, 3), { tone: "mid", crease: "none" });
const saddle = (x, y) => S(k.slabOf({ x: x - 4.5, y: y - 3, w: 9, d: 6, r: 0.8 }, 0, 1.2, P, 2), { tone: "lo", crease: "none" });
const flowX = (x0, x1, y) => k.lineOnTop([x0, y], [x1, y], PIPE_Z + PIPE / 2, P);
const flowY = (x, y0, y1) => k.lineOnTop([x, y0], [x, y1], PIPE_Z + PIPE / 2, P);

function tank() {
  const [x, y] = TANK;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x - TANK_R, y: y - TANK_R, w: TANK_R * 2, d: TANK_R * 2, r: TANK_R }, 0, 4, P)}"/>`];
  out.push(S(k.cylinder(x, y, TANK_R + 2, 0, 3, P, 48, 0.6), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, TANK_R, 3, TANK_H - 3, P, 48, 0.8), { tone: "mid", inner: L([10, 20, 30].map((z) => k.sideArc(x, y, TANK_R, z, P, 30)).join(""), { tone: "faint" }) }));
  out.push(S(k.cylinder(x, y, 5, TANK_H, 3, P, 28, 0.4), { tone: "mid" }));
  out.push(D(Array.from({ length: 8 }, (_, i) => at([x + Math.cos((i / 8) * Math.PI * 2) * (TANK_R - 2.4), y + Math.sin((i / 8) * Math.PI * 2) * (TANK_R - 2.4), TANK_H])), { size: 0.42 }));
  return out.join("");
}

function plumbing() {
  const out = [];
  out.push(saddle(VALVE_X + 16, HEADER.y + PIPE / 2), saddle(BRANCH_X[1] + 17, HEADER.y + PIPE / 2));
  out.push(pipeX(HEADER.x, HEADER.y, HEADER.w));
  BRANCH_X.forEach((x, i) => {
    out.push(saddle(x, 4));
    out.push(pipeY(x, HEADER.y + PIPE, COLLECT_Y - HEADER.y - PIPE));
    if (SCREENED[i]) {
      // Redaction canister: media.ts and deploy.ts already strip the token
      out.push(S(k.cylinder(x, FILTER_Y, 6.5, 0, 15, P, 32, 0.5), { tone: "hi", crease: "lo", inner: L(k.sideArc(x, FILTER_Y, 6.5, 10, P, 24), { tone: "faint" }) }));
      out.push(S(k.cylinder(x, FILTER_Y, 2.6, 15, 1.6, P, 16), { tone: "mid" }));
    }
  });
  out.push(pipeX(COLLECT.x, COLLECT.y, COLLECT.w));
  // DEBUG valve body on the header
  out.push(S(k.slabOf({ x: VALVE_X - 5, y: HEADER.y - 2, w: 10, d: PIPE + 4, r: 1 }, 0, 10, P, 2, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(VALVE_X, HEADER.y + PIPE / 2, 1.2, 10, 6, P, 12), { tone: "mid", crease: "none" }));
  return out.join("");
}

function flow() {
  const lines = [flowX(HEADER.x + 2, BRANCH_X[3], HEADER.y + PIPE / 2)];
  BRANCH_X.forEach((x) => lines.push(flowY(x, HEADER.y + PIPE, COLLECT_Y)));
  lines.push(flowX(BRANCH_X[0], PRINTER.x, COLLECT_Y + PIPE / 2));
  return `<g data-part="flow" style="opacity:0">${k.lineSvg(lines.join(""), { tone: "hi", flow: true })}</g>`;
}

const valveD = (open) => {
  const a = open * (Math.PI / 2);
  const c = [VALVE_X, HEADER.y + PIPE / 2];
  const dx = Math.sin(a) * 8, dy = Math.cos(a) * 8;
  return k.lineOnTop([c[0] - dx, c[1] - dy], [c[0] + dx, c[1] + dy], 16, P);
};

function printer() {
  const out = [S(k.slabOf(PRINTER, 0, PRINTER_TOP, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(PRINTER, 5, P, 4), { tone: "faint" }) })];
  out.push(L(k.planOutline(k.insetPlan(PRINTER, 3), PRINTER_TOP, P, 4), { tone: "faint" }));
  out.push(D(k.corners(PRINTER, 2.4).map(([x, y]) => at([x, y, PRINTER_TOP])), { size: 0.42 }));
  // Platen roller where the tape leaves the +x face
  out.push(S(k.slabOf({ x: PRINTER.x + PRINTER.w, y: TAPE_PLAN.y - 1, w: 2, d: TAPE_PLAN.d + 2, r: 0.8 }, 1.6, 2.4, P, 2), { tone: "mid", crease: "none" }));
  out.push(lamp(PRINTER.x + 8, PRINTER.y + 8, PRINTER_TOP, "lamp-print"));
  // Tape tray and the paper strip in it
  out.push(S(k.slabOf(TRAY, 0, 2.4, P, 3, 0.4), { tone: "lo", crease: "none" }));
  out.push(S(k.slabOf(TAPE_PLAN, 2.4, TAPE_Z - 2.4, P, 2), { tone: "hi", crease: "none" }));
  return out.join("");
}

function tapeLines(set, part) {
  const texts = TAPE[set].map((line, i) =>
    `<g data-line="${i}" style="opacity:0">${k.faceTextSvg(k.topMatrix([TAPE_PLAN.x + 1.6, TAPE_PLAN.y + 6.4 + i * 7.2], TAPE_Z, P, "x"), line, { size: 3.9, tone: i < 2 && set === "bug" ? "hi" : "mid" })}</g>`,
  );
  return `<g data-part="${part}">${texts.join("")}</g>`;
}

const fixFilter = () =>
  [
    S(k.cylinder(PRINTER.x - 8, COLLECT_Y + PIPE / 2, 7, 0, 16, P, 32, 0.5), { tone: "hi", crease: "lo", inner: L(k.sideArc(PRINTER.x - 8, COLLECT_Y + PIPE / 2, 7, 11, P, 24), { tone: "faint" }) }),
    S(k.cylinder(PRINTER.x - 8, COLLECT_Y + PIPE / 2, 2.8, 16, 1.6, P, 16), { tone: "mid" }),
  ].join("");

// ---- Assemble ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A tank standing for process.env feeds a header pipe with four branch lines into a tape printer, the CI log. Two of the branches, media and deploy, pass through redaction canisters; the other two, CI detection and upload, do not. A DEBUG valve on the header opens the flow, and the tape prints what comes through.",
  body: [
    deck("GHSA-28PG"),
    tank(),
    plumbing(),
    flow(),
    `<path data-part="valve" class="iso-line" data-tone="lit" style="stroke-width:1.6" d="${valveD(0)}"/>`,
    `<g data-part="fix" style="opacity:0">${fixFilter()}</g>`,
    printer(),
    tapeLines("bug", "tape-bug"),
    tapeLines("fix", "tape-fix"),
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const VALVE_X = ${VALVE_X}, HEADER = ${JSON.stringify(HEADER)}, PIPE = ${PIPE};
const T = { open: [0.3, 1.0], flow: [1.0, 1.4], lines: [1.8, 2.8, 3.6], reset: 8.4, cycle: 10 };
const valveD = ${valveD.toString().replace(/k\./g, "")};

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const valve = part("valve"), flowPart = part("flow"), fix = part("fix"), printLamp = part("lamp-print");
const tapes = { bug: [...part("tape-bug").children], fix: [...part("tape-fix").children] };

function phaseOf(t, fixed) {
  if (t >= T.reset) return "resetting";
  if (t < T.open[1]) return "argos upload ./screenshots";
  if (t < T.lines[0] - 0.4) return "DEBUG=@argos-ci/core";
  if (t < T.lines[0]) return "config load · env snapshot";
  if (t < T.lines[1]) return fixed ? "GITHUB_TOKEN · redacted" : "GITHUB_TOKEN · on stderr";
  return fixed ? "*_TOKEN dropped · log is clean" : "ARGOS_TOKEN · 40 chars · in the log";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 8.2,
  steps: [0.2, T.flow[1], T.lines[0] + 0.3, T.lines[1] + 0.3, T.lines[2] + 0.5],
  label: (fixed) => (fixed ? "Fixed: debug() redacts tokens" : "Apply the fix: redact in debug()"),
  phase: phaseOf,
  draw(t, fixed) {
    const back = 1 - ease(T.reset, T.reset + 0.6, t);
    const open = ease(...T.open, t) * back;
    valve.setAttribute("d", valveD(open));
    flowPart.style.opacity = (ease(...T.flow, t) * back).toFixed(3);
    fix.style.opacity = fixed ? "1" : "0";
    const on = fixed ? "fix" : "bug", off = fixed ? "bug" : "fix";
    tapes[on].forEach((line, i) => { line.style.opacity = (ease(T.lines[i], T.lines[i] + 0.2, t) * back).toFixed(3); });
    tapes[off].forEach((line) => { line.style.opacity = "0"; });
    printLamp.style.opacity = (t > T.lines[0] && t < T.lines[2] + 0.4 ? 1 : 0).toString();
  },
});
`;

writeFigure("argos-debug-mode-leaks-ci-tokens", {
  fig: "Fig 1",
  title: "Debug prints tokens",
  readout: "argos upload ./screenshots",
  keys: [
    { mark: "lit", label: "DEBUG valve: the flag the CLI docs tell you to set" },
    { mark: "raised", label: "Redaction canisters: media.ts and deploy.ts already strip the token" },
  ],
  caption:
    "With DEBUG=@argos-ci/core, the CI-detection debug() call logs the whole process.env and upload.ts logs its params and config, so GITHUB_TOKEN and the 40-character ARGOS_TOKEN reach stderr before the first network request. media.ts and deploy.ts already dropped the token before logging. The fix (Medium, CVSS 6.8; @argos-ci/core 6.8.5) redacts inside debug() itself.",
  svg,
  stageLabel: "Argos debug plumbing and CI log printer. Arrow keys step through the run; Space applies or removes the fix.",
  live,
  css: DOCKBAY_CSS,
});
