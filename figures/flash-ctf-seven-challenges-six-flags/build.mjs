// Fig: Registry 101, the flag that was missed. A registry hive is a file plus a transaction log: the two
// RecentDocs entries holding the flag halves were still pending in ntuser.dat.LOG1, so a parser that reads
// NTUSER.DAT alone (python-registry) finds nothing. Replaying the logs (Registry Explorer, yarp, regipy)
// merges them into the hive, and the two base64 names decode to the flag.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, planeOf, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- Model, from the post ----
const FLAG = "!MetaCTF{F1r5t_st3p_2_r3g1stry_4and6}";
const ROWS = 11;
const PENDING = [9, 10]; // the two front slots the log replay fills

// ---- World layout ----
const HIVE = { x: -64, y: -50, w: 58, d: 46, r: 2 };
const TRAY_H = 6;
const CARD = { x: HIVE.x + 5, w: 48, d: 1.2, h: 12 };
const rowY = (i) => HIVE.y + 4 + i * 3.6;
const LOG = { x: 14, y: -34, w: 30, d: 16, r: 1.5 };
const SLIP = { w: 22, d: 1.2, h: 12 };
const slipHome = (n) => [LOG.x + 4, LOG.y + 5 + n * 5];
const RAILS_X = [HIVE.x - 3, HIVE.x + HIVE.w];
const BRIDGE_Z = 26;
const SWEEP = [rowY(0) - 2, rowY(ROWS - 1) + 2];
const CONSOLE = { x: -116, y: 14, w: 84, d: 12, r: 1.5 };
const CONSOLE_TOP = 14;

// ---- Parts ----
function trayBox(plan) {
  return [
    S(k.slabOf(plan, 0, TRAY_H, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(plan, 2.5, P, 3), { tone: "faint" }) }),
    L(k.planOutline(k.insetPlan(plan, 2), TRAY_H, P, 3), { tone: "lo" }),
  ].join("");
}

function cards() {
  const out = [];
  for (let i = 0; i < ROWS; i++) {
    if (PENDING.includes(i)) continue;
    const y = rowY(i);
    out.push(S(k.slabOf({ x: CARD.x, y, w: CARD.w, d: CARD.d, r: 0.3 }, TRAY_H, CARD.h, P, 1), { tone: "mid", crease: "none" }));
    const tab = CARD.x + 4 + ((i * 11) % 32);
    out.push(S(k.slabOf({ x: tab, y, w: 8, d: CARD.d, r: 0.3 }, TRAY_H + CARD.h, 2, P, 1), { tone: "mid", crease: "none" }));
  }
  return out.join("");
}

// A pending entry, built standing at its place in the log tray
const slip = (n) => {
  const [x, y] = slipHome(n);
  return [
    S(k.slabOf({ x, y, w: SLIP.w, d: SLIP.d, r: 0.3 }, TRAY_H, SLIP.h, P, 1), { tone: "hi", crease: "lo", lit: true }),
    S(k.slabOf({ x: x + 12, y, w: 8, d: SLIP.d, r: 0.3 }, TRAY_H + SLIP.h, 2, P, 1), { tone: "hi", crease: "none", lit: true }),
  ].join("");
};

function rails() {
  return RAILS_X.map((x) => [
    S(k.slabOf({ x, y: HIVE.y - 2, w: 3, d: HIVE.d + 4, r: 0.6 }, TRAY_H, 2, P, 2, 0.3), { tone: "mid" }),
    D([at([x + 1.5, HIVE.y, TRAY_H + 2]), at([x + 1.5, HIVE.y + HIVE.d, TRAY_H + 2])], { size: 0.42 }),
  ].join("")).join("");
}

// The scanner bridge spans the hive along x and sweeps along y; built at y = 0
const bridge = () =>
  [
    ...RAILS_X.map((x) => S(k.slabOf({ x: x - 0.5, y: -2.5, w: 4, d: 5, r: 0.8 }, TRAY_H + 2, BRIDGE_Z - TRAY_H - 2, P, 2, 0.3), { tone: "mid" })),
    S(k.slabOf({ x: RAILS_X[0] - 1, y: -2.5, w: RAILS_X[1] - RAILS_X[0] + 5, d: 5, r: 1 }, BRIDGE_Z, 3, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf({ x: CARD.x + 16, y: -3, w: 16, d: 6, r: 1 }, BRIDGE_Z - 4, 4, P, 2, 0.4), { tone: "hi", crease: "lo" }),
  ].join("");

function display() {
  const face = CONSOLE.y + CONSOLE.d;
  const out = [S(k.slabOf(CONSOLE, 0, CONSOLE_TOP, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(CONSOLE, 3, P, 3), { tone: "faint" }) })];
  out.push(`<g transform="${planeOf(face)}"><rect class="fc-plate" x="${CONSOLE.x + 3}" y="${-(CONSOLE_TOP - 3)}" width="${CONSOLE.w - 6}" height="7.6" rx="1"/>` +
    `<text data-part="screen" class="fc-text" x="${CONSOLE.x + 6}" y="${-(CONSOLE_TOP - 8.6)}" font-size="3.4"></text></g>`);
  out.push(lamp(CONSOLE.x + CONSOLE.w - 7, CONSOLE.y + 6, CONSOLE_TOP, "lamp-hit"));
  // Cable from the scanner rail to the console
  out.push(k.wireSvg(at([RAILS_X[0], HIVE.y + HIVE.d - 4, 3]), at([CONSOLE.x + CONSOLE.w - 14, CONSOLE.y, 3]), { via: [at([RAILS_X[0] - 6, HIVE.y + HIVE.d - 4, 0.2]), at([CONSOLE.x + CONSOLE.w - 14, HIVE.y + HIVE.d - 4, 0.2])], tone: "mid" }));
  return out.join("");
}

// ---- Assemble ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A card file standing for the NTUSER.DAT hive, its RecentDocs cards in rows with two empty slots at the front, and beside it a small tray, ntuser.dat.LOG1, holding two pending entries. A scanner bridge sweeps the card file and reports to a console display.",
  body: [
    deck("REGISTRY 101"),
    trayBox(HIVE),
    cards(),
    trayBox(LOG),
    ...[0, 1].map((n) => `<g data-part="slip-${n}">${slip(n)}</g>`),
    rails(),
    `<g data-part="bridge" transform="${k.translateAlong(P, [0, SWEEP[0], 0])}">${bridge()}</g>`,
    display(),
  ],
});

const MOVE = [0, 1].map((n) => {
  const [x, y] = slipHome(n);
  return [CARD.x - x, rowY(PENDING[n]) - y];
});

const live = `
const P = ${JSON.stringify(P)};
const SWEEP = ${JSON.stringify(SWEEP)}, MOVE = ${JSON.stringify(MOVE)}, FLAG = ${JSON.stringify(FLAG)};
const PENDING_Y = ${JSON.stringify(PENDING.map(rowY))};
const T = { start: [0.3, 0.8], merge: [0.9, 2.2], sweep: [2.4, 5.4], show: 5.6, reset: 8.4, cycle: 10 };

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const bridge = part("bridge"), screen = part("screen"), hit = part("lamp-hit");
const slips = [part("slip-0"), part("slip-1")];

function hits(y, fixed) {
  return fixed ? PENDING_Y.filter((p) => y >= p).length : 0;
}

function phaseOf(t, fixed) {
  if (t >= T.reset) return "resetting";
  if (t < T.merge[0]) return fixed ? "replay LOG1 + LOG2 into the hive" : "python-registry · NTUSER.DAT only";
  if (t < T.sweep[0]) return fixed ? "RecentDocs · 2 entries merged" : "ntuser.dat.LOG1 · not read";
  if (t < T.show) return "scanning RecentDocs";
  return fixed ? FLAG : "regdump.txt · 101 MB · 0 hits";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 8.2,
  steps: [0.2, T.merge[1], (T.sweep[0] + T.sweep[1]) / 2, T.show + 0.4],
  label: (fixed) => (fixed ? "Fixed: logs replayed" : "Apply the fix: replay the logs"),
  phase: phaseOf,
  draw(t, fixed) {
    const back = 1 - ease(T.reset, T.reset + 0.6, t);
    slips.forEach((s, n) => {
      const m = fixed ? ease(T.merge[0] + n * 0.3, T.merge[1] - 0.3 + n * 0.3, t) * back : 0;
      const lift = Math.sin(Math.PI * m) * 14;
      s.setAttribute("transform", translateAlong(P, [MOVE[n][0] * m, MOVE[n][1] * m, lift]));
    });
    const y = SWEEP[0] + (SWEEP[1] - SWEEP[0]) * ease(...T.sweep, t) * back;
    bridge.setAttribute("transform", translateAlong(P, [0, y, 0]));
    const n = t < T.sweep[0] || t >= T.reset ? 0 : hits(y, fixed);
    const text = t < T.sweep[0] || t >= T.reset ? "" : t < T.show ? "hits " + n : fixed ? FLAG : "0 hits";
    if (screen.textContent !== text) screen.textContent = text;
    hit.style.opacity = (fixed && n > 0 ? back : 0).toFixed(3);
  },
});
`;

writeFigure("flash-ctf-seven-challenges-six-flags", {
  fig: "Fig 1",
  title: "Hive plus log",
  readout: "python-registry · NTUSER.DAT only",
  keys: [
    { mark: "lit", label: "Pending entries in ntuser.dat.LOG1: the two flag halves" },
    { mark: "raised", label: "NTUSER.DAT: the hive as it sat on disk" },
  ],
  caption:
    "Windows writes registry changes to the transaction log first and merges them into the hive later. The two RecentDocs entries whose names decode to the flag were still in ntuser.dat.LOG1, so a parser that reads NTUSER.DAT alone returned a clean 101 MB dump with no flag in it. Replaying the logs, as Registry Explorer, yarp and regipy do, brings them in.",
  svg,
  stageLabel: "Registry hive and transaction log. Arrow keys step through the run; Space applies or removes the fix.",
  live,
  css: DOCKBAY_CSS + `.fc-plate{fill:var(--db-flap)}.fc-text{fill:var(--db-flap-text);font-family:var(--anatomy-mono)}`,
});
