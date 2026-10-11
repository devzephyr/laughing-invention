// Fig: one credential, fourteen names. Four authorities each coined terms for the same key and none can retire
// another's, so the tags only accumulate. Names, coiners and years are the post's table, in date order.
// This is a governance problem, not a bug, so there is no fix state.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, planeOf, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- Model, from the post's table ----
const PRESSES = ["FIDO", "W3C", "FIDO marketing", "Vendors"];
const NAMES = [
  ["FIDO2 credential", "FIDO Alliance", "2018", 0],
  ["Resident key", "FIDO CTAP2", "2018", 0],
  ["Public key credential", "W3C WebAuthn", "2019", 1],
  ["WebAuthn credential", "W3C", "2019", 1],
  ["Roaming authenticator credential", "W3C", "2019", 1],
  ["Platform authenticator credential", "Vendor", "2019", 3],
  ["Discoverable credential", "W3C WebAuthn L2", "2021", 1],
  ["Client-side discoverable credential", "W3C", "2021", 1],
  ["Non-discoverable credential", "W3C", "2021", 1],
  ["Passkey", "FIDO Alliance marketing", "2022", 2],
  ["Multi-device FIDO credential", "FIDO / Apple / Google / MS", "2022", 2],
  ["Synced passkey", "Apple / Google / MS", "2022 to 2024", 3],
  ["Device-bound passkey", "Enterprise / hardware", "2022 to 2023", 3],
  ["Single-device / hardware-bound credential", "Enterprise", "2023", 3],
];
if (NAMES.length !== 14) throw new Error("the post's table has 14 names");

// ---- World layout ----
const pressX = (i) => -96 + i * 50;
const PRESS_Y = -52;
const PRESS_TOP = 34;
const RAM = { rest: PRESS_TOP - 12, strike: 12 };
const RAIL = { x: -112, y: -22, w: 210, d: 4, r: 1 };
const RAIL_Z = 30;
const hookX = (i) => RAIL.x + 8 + i * 14.6;
const TAG = { w: 9, d: 1, h: 11 };
const KEY = [-14, 18];
const CONSOLE = { x: 22, y: 20, w: 104, d: 12, r: 1.5 };
const CONSOLE_TOP = 13;

// ---- Parts ----
function press(i) {
  const x = pressX(i);
  const base = { x: x - 14, y: PRESS_Y - 10, w: 28, d: 20, r: 1.5 };
  const out = [S(k.slabOf(base, 0, 8, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(base, 3, P, 3), { tone: "faint" }) })];
  for (const px of [x - 10, x + 10]) out.push(S(k.slabOf({ x: px - 1.5, y: PRESS_Y - 1.5, w: 3, d: 3, r: 0.5 }, 8, PRESS_TOP - 8, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: x - 13, y: PRESS_Y - 4, w: 26, d: 8, r: 1 }, PRESS_TOP, 4, P, 2, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x - 6, y: PRESS_Y - 4, w: 12, d: 8, r: 0.8 }, 8, 1, P, 2), { tone: "lo", crease: "none" }));
  out.push(lamp(x + 9, PRESS_Y + 6, 8, `lamp-press-${i}`));
  return out.join("");
}

// A press's ram, built with its die at z = 0
const ram = (i) => {
  const x = pressX(i);
  return [
    S(k.cylinder(x, PRESS_Y, 1.4, 3, PRESS_TOP - RAM.strike - 3, P, 12), { tone: "mid", crease: "none" }),
    S(k.slabOf({ x: x - 5, y: PRESS_Y - 3.5, w: 10, d: 7, r: 0.8 }, 0, 3, P, 2, 0.3), { tone: "hi", crease: "lo" }),
  ].join("");
};

function rail() {
  const out = [];
  for (const x of [RAIL.x + 2, RAIL.x + RAIL.w - 6]) out.push(S(k.slabOf({ x, y: RAIL.y, w: 4, d: 4, r: 0.6 }, 0, RAIL_Z, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf(RAIL, RAIL_Z, 3, P, 2, 0.4), { tone: "mid" }));
  for (let i = 0; i < NAMES.length; i++) out.push(S(k.cylinder(hookX(i), RAIL.y + RAIL.d + 0.8, 0.6, RAIL_Z - 2, 2.4, P, 8), { tone: "mid", crease: "none" }));
  return out.join("");
}

// A name tag hanging from its hook
const tag = (i) => {
  const x = hookX(i);
  const plan = { x: x - TAG.w / 2, y: RAIL.y + RAIL.d + 0.4, w: TAG.w, d: TAG.d, r: 0.3 };
  const z = RAIL_Z - 2 - TAG.h;
  return [
    S(k.slabOf(plan, z, TAG.h, P, 1), { tone: "mid", crease: "none" }),
    `<g transform="${planeOf(plan.y + plan.d)}"><path class="iso-line" data-tone="lo" data-free="" d="M${x - 3} ${-(z + 7)}H${x + 3}M${x - 3} ${-(z + 4.6)}H${x + 1 + (i % 3)}"/></g>`,
  ].join("");
};

function keyOnCradle() {
  const [x, y] = KEY;
  const cradle = { x: x - 18, y: y - 9, w: 44, d: 18, r: 2 };
  return [
    S(k.slabOf(cradle, 0, 5, P, 3, 0.6), { tone: "mid" }),
    L(k.planOutline(k.insetPlan(cradle, 2), 5, P, 3), { tone: "faint" }),
    // The key: bow, blade and teeth, the one thing every name refers to
    S(k.cylinder(x - 8, y, 6.5, 5, 1.6, P, 32, 0.3), { tone: "hi", crease: "lo", lit: true }),
    L(k.ring(x - 8, y, 2.2, 6.6, P, 16), { tone: "lo" }),
    S(k.slabOf({ x: x - 2, y: y - 1.8, w: 26, d: 3.6, r: 0.6 }, 5, 1.6, P, 2), { tone: "hi", crease: "lo", lit: true }),
    ...[8, 12, 16, 20].map((dx, n) => S(k.slabOf({ x: x + dx, y: y + 1.8, w: 2.2, d: 1.2 + (n % 2) * 0.8, r: 0.2 }, 5, 1.6, P, 1), { tone: "hi", crease: "none", lit: true })),
    // The ring that every tag ends up on
    k.wireSvg(at([x - 8, y - 6.5, 6.6]), at([hookX(0) + 2, RAIL.y + RAIL.d, RAIL_Z]), { via: [at([x - 8, RAIL.y + RAIL.d + 4, 0.2]), at([hookX(0) + 2, RAIL.y + RAIL.d + 4, 0.2])], tone: "mid", size: 0.9 }),
  ].join("");
}

function console_() {
  const face = CONSOLE.y + CONSOLE.d;
  return [
    S(k.slabOf(CONSOLE, 0, CONSOLE_TOP, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(CONSOLE, 3, P, 3), { tone: "faint" }) }),
    `<g transform="${planeOf(face)}"><rect class="pk-plate" x="${CONSOLE.x + 3}" y="${-(CONSOLE_TOP - 2.4)}" width="${CONSOLE.w - 6}" height="7.6" rx="1"/>` +
      `<text data-part="name" class="pk-text" x="${CONSOLE.x + 6}" y="${-(CONSOLE_TOP - 7.8)}" font-size="3.6"></text></g>`,
  ].join("");
}

// ---- Assemble ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Four stamping presses along the back stand for FIDO, W3C, FIDO's marketing group and the platform vendors. In date order each press strikes and a name tag appears on a rail of fourteen hooks chained to one key in a cradle. Tags are only ever added. A console in front shows the latest name.",
  body: [
    deck("1 KEY · 14 NAMES"),
    ...PRESSES.map((_, i) => press(i)),
    ...PRESSES.map((_, i) => `<g data-part="ram-${i}" transform="${k.translateAlong(P, [0, 0, RAM.rest])}">${ram(i)}</g>`),
    rail(),
    ...NAMES.map((_, i) => `<g data-part="tag-${i}" style="opacity:0">${tag(i)}</g>`),
    keyOnCradle(),
    console_(),
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const NAMES = ${JSON.stringify(NAMES)}, RAM = ${JSON.stringify(RAM)};
const STEP = 0.7, FIRST = 0.4, HOLD = 9.9 + 1.2, CYCLE = 12;
const at_ = (i) => FIRST + i * STEP;

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const rams = [0, 1, 2, 3].map((i) => part("ram-" + i)), lamps = [0, 1, 2, 3].map((i) => part("lamp-press-" + i));
const tags = NAMES.map((_, i) => part("tag-" + i)), name = part("name");

function current(t) {
  let n = -1;
  for (let i = 0; i < NAMES.length; i++) if (t >= at_(i)) n = i;
  return n;
}

function phaseOf(t) {
  if (t >= HOLD) return "resetting";
  const n = current(t);
  if (n < 0) return "one credential";
  if (t > at_(NAMES.length - 1) + 1) return "14 names · 1 key · none retired";
  return NAMES[n][1] + " · " + NAMES[n][2];
}

runFigure({
  cycle: CYCLE,
  scrubEnd: at_(NAMES.length - 1) + 1.4,
  steps: [0.2, ...NAMES.map((_, i) => at_(i) + 0.35), at_(NAMES.length - 1) + 1.4],
  label: () => "",
  phase: phaseOf,
  draw(t) {
    const fade = 1 - ease(HOLD, HOLD + 0.6, t);
    const strikes = [0, 0, 0, 0];
    NAMES.forEach((entry, i) => {
      const s = ease(at_(i), at_(i) + 0.12, t) * (1 - ease(at_(i) + 0.15, at_(i) + 0.4, t));
      strikes[entry[3]] = Math.max(strikes[entry[3]], s);
      tags[i].style.opacity = (ease(at_(i) + 0.1, at_(i) + 0.25, t) * fade).toFixed(3);
    });
    rams.forEach((r, i) => r.setAttribute("transform", translateAlong(P, [0, 0, RAM.rest + (RAM.strike - RAM.rest) * strikes[i]])));
    lamps.forEach((l, i) => { l.style.opacity = strikes[i].toFixed(3); });
    const n = current(t);
    const text = n < 0 || t >= HOLD ? "" : NAMES[n][0];
    if (name.textContent !== text) name.textContent = text;
  },
});
`;

writeFigure("fourteen-names-for-a-passkey", {
  fig: "Fig 1",
  title: "Fourteen names",
  readout: "one credential",
  keys: [
    { mark: "lit", label: "The credential: one key, unchanged by any of its names" },
    { mark: "raised", label: "Presses: FIDO, W3C, FIDO marketing, the platform vendors" },
  ],
  caption:
    "FIDO's protocol group named it first in 2018, W3C renamed it for the browser API in 2019 and 2021, FIDO's marketing group called it a passkey in 2022, and the vendors split it into synced and device-bound once sync arrived. Each body owns its own vocabulary and none can retire another's, so every name is still in use.",
  svg,
  stageLabel: "Fourteen names for one credential. Arrow keys step through the names.",
  live,
  fix: false,
  css: DOCKBAY_CSS + `.pk-plate{fill:var(--db-flap)}.pk-text{fill:var(--db-flap-text);font-family:var(--anatomy-mono)}`,
});
