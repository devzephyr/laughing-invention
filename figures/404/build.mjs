// Fig: the 404 page. A one-armed bandit whose three reels always stop on 4, 0, 4.
// The lever pulls, the reels spin and stop left to right, and the marquee bulbs flash. No words.
import { writeFigure } from "../embed.mjs";
import { k, S, L, D, lamp, recess, DOCKBAY_CSS } from "../dockbay.mjs";

const WIDTH = 600;
const HEIGHT = 440;

// ---- World layout: a cabinet standing on a plinth, its face toward +y ----
const PLINTH = { x: -50, y: -34, w: 100, d: 68, r: 4 };
const BASE = { x: -36, y: -22, w: 72, d: 40, r: 3 };
const BASE_TOP = 40;
const HOUSING = { x: -34, y: -20, w: 68, d: 36, r: 3 };
const HOUSING_TOP = 84;
const FACE = HOUSING.y + HOUSING.d;
const MARQUEE = { x: -38, y: -23, w: 76, d: 42, r: 4 };
const MARQUEE_TOP = 100;
// One symbol tall: only the result row shows, never its neighbours
const WIN = { x0: -27, x1: 27, z0: 53, z1: 73, r: 2, depth: 3 };
const REELS = [-17.5, 0, 17.5];
const REEL_W = 15;
const STEP = 24; // vertical spacing of the symbols on a reel: wider than the window, so neighbours stay hidden
const MID = (WIN.z0 + WIN.z1) / 2;
const RESULT = [4, 0, 4];
const LEVER = { x: BASE.x + BASE.w + 4, y: -2, z: 58, len: 30 };
const BULBS = 13;

const P = k.fitProjection(
  [...k.boxCorners(PLINTH, -6, 0), ...k.boxCorners(MARQUEE, 0, MARQUEE_TOP + 6), [LEVER.x, LEVER.y, LEVER.z + LEVER.len + 6], [LEVER.x, LEVER.y + LEVER.len, LEVER.z]],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: 52 },
);
const at = (point) => k.iso(point, P);
const planeOf = (y) => k.sideMatrix([0, y], 0, P, "left");

// ---- Parts ----
function plinth() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLINTH, -6, 6, P)}"/>`];
  for (const [x, y] of k.corners(PLINTH, 8).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    out.push(S(k.cylinder(x, y, 5, -6, 2, P, 24), { tone: "lo" }));
  }
  out.push(S(k.slabOf(PLINTH, -4, 4, P, 6, 1), { tone: "mid", inner: L(k.sideSeam(PLINTH, -2, P, 6), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLINTH, 4), 0, P, 6), { tone: "lo" }));
  out.push(D(k.corners(PLINTH, 6).map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  return out.join("");
}

function base() {
  const face = BASE.y + BASE.d;
  const out = [S(k.slabOf(BASE, 0, BASE_TOP, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(BASE, 6, P, 4) + k.sideSeam(BASE, BASE_TOP - 4, P, 4), { tone: "faint" }) })];
  // Front: coin slot, a belly-glass panel outline and corner screws
  out.push(`<g transform="${planeOf(face)}">` +
    `<rect class="sm-slot" x="${-7}" y="${-(BASE_TOP - 9)}" width="14" height="2.4" rx="1.2"/>` +
    `<rect class="sm-panel" x="${BASE.x + 6}" y="${-(BASE_TOP - 15)}" width="${BASE.w - 12}" height="${BASE_TOP - 32}" rx="2"/>` +
    `</g>`);
  out.push(D([[BASE.x + 3, BASE_TOP - 3], [BASE.x + BASE.w - 3, BASE_TOP - 3], [BASE.x + 3, 9], [BASE.x + BASE.w - 3, 9]].map(([x, z]) => at([x, face, z])), { size: 0.5 }));
  // Side: a recessed service panel on the +x face, with its screws
  const side = BASE.x + BASE.w;
  out.push(L(k.pathOf([[side, -14, 10], [side, 10, 10], [side, 10, 32], [side, -14, 32]].map(at), true), { tone: "lo" }));
  out.push(D([[-12, 12], [8, 12], [-12, 30], [8, 30]].map(([y, z]) => at([side, y, z])), { size: 0.45 }));
  return out.join("");
}

function tray() {
  // The payout tray: a shallow box standing out from the front, always empty
  const plan = { x: -18, y: BASE.y + BASE.d, w: 36, d: 9, r: 1.2 };
  return [
    S(k.slabOf(plan, 6, 6, P, 2, 0.6), { tone: "mid" }),
    L(k.planOutline(k.insetPlan(plan, 1.6), 12, P, 2), { tone: "lo" }),
  ].join("");
}

function reelStrip(i) {
  // Three copies of 0-9 so a spinning reel never runs out of symbols
  const x = REELS[i];
  const symbols = [];
  for (let n = 0; n < 30; n++) {
    symbols.push(`<text class="sm-digit" x="${x}" y="${(-MID + n * STEP + 4.6).toFixed(2)}" font-size="13" text-anchor="middle">${n % 10}</text>`);
  }
  return `<g data-part="reel-${i}">${symbols.join("")}</g>`;
}

function housing() {
  const out = [S(k.slabOf(HOUSING, BASE_TOP, HOUSING_TOP - BASE_TOP, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(HOUSING, BASE_TOP + 4, P, 4), { tone: "faint" }) })];
  // The reel window: three drums behind glass, with dividers, a shade at top and bottom, and the payline
  const reels = [];
  for (const x of REELS) reels.push(`<rect class="sm-drum" x="${x - REEL_W / 2}" y="${-WIN.z1}" width="${REEL_W}" height="${WIN.z1 - WIN.z0}"/>`);
  for (let i = 0; i < 3; i++) reels.push(reelStrip(i));
  for (const x of [REELS[0] + REEL_W / 2 + 1.25, REELS[1] + REEL_W / 2 + 1.25]) reels.push(`<rect class="sm-divider" x="${x - 1.25}" y="${-WIN.z1}" width="2.5" height="${WIN.z1 - WIN.z0}"/>`);
  reels.push(`<rect class="sm-shade-top" x="${WIN.x0}" y="${-WIN.z1}" width="${WIN.x1 - WIN.x0}" height="4"/>`);
  reels.push(`<rect class="sm-shade-bottom" x="${WIN.x0}" y="${-(WIN.z0 + 4)}" width="${WIN.x1 - WIN.x0}" height="4"/>`);
  reels.push(`<path class="iso-line" data-tone="lit" style="stroke-width:.9" d="M${WIN.x0} ${-MID}H${WIN.x1}"/>`);
  out.push(`<defs>` +
    `<linearGradient id="sm-fade-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sm-stop" stop-opacity=".85"/><stop offset="1" class="sm-stop" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="sm-fade-bottom" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="sm-stop" stop-opacity=".85"/><stop offset="1" class="sm-stop" stop-opacity="0"/></linearGradient>` +
    `</defs>`);
  out.push(recess(WIN, FACE, reels.join(""), "sm-well", P));
  // A bezel round the window and the screws that hold it
  out.push(`<g transform="${planeOf(FACE)}"><rect class="sm-bezel" x="${WIN.x0 - 3}" y="${-(WIN.z1 + 3)}" width="${WIN.x1 - WIN.x0 + 6}" height="${WIN.z1 - WIN.z0 + 6}" rx="3.5"/></g>`);
  out.push(D([[WIN.x0 - 1.5, WIN.z1 + 1.5], [WIN.x1 + 1.5, WIN.z1 + 1.5], [WIN.x0 - 1.5, WIN.z0 - 1.5], [WIN.x1 + 1.5, WIN.z0 - 1.5]].map(([x, z]) => at([x, FACE, z])), { size: 0.5 }));
  // Three buttons under the window: one per reel
  for (const x of REELS) out.push(S(k.slabOf({ x: x - 4, y: FACE, w: 8, d: 2.4, r: 1 }, BASE_TOP + 3, 3.6, P, 2, 0.3), { tone: "mid" }));
  return out.join("");
}

function marquee() {
  const face = MARQUEE.y + MARQUEE.d;
  const out = [S(k.slabOf(MARQUEE, HOUSING_TOP, MARQUEE_TOP - HOUSING_TOP, P, 5, 1.2), { tone: "mid", inner: L(k.sideSeam(MARQUEE, HOUSING_TOP + 3, P, 5), { tone: "faint" }) })];
  // A row of bulbs across the marquee face; the live code chases and flashes them
  const bulbs = [];
  for (let n = 0; n < BULBS; n++) {
    const x = MARQUEE.x + 6 + (n * (MARQUEE.w - 12)) / (BULBS - 1);
    bulbs.push(`<circle class="sm-bulb" cx="${x.toFixed(2)}" cy="${-(HOUSING_TOP + 8)}" r="2"/>` +
      `<circle class="sm-bulb-on" data-bulb="${n}" cx="${x.toFixed(2)}" cy="${-(HOUSING_TOP + 8)}" r="2" style="opacity:0"/>`);
  }
  out.push(`<g transform="${planeOf(face)}">${bulbs.join("")}</g>`);
  out.push(lamp(0, -2, MARQUEE_TOP, "lamp-top", P));
  return out.join("");
}

function leverMount() {
  return [
    S(k.slabOf({ x: BASE.x + BASE.w, y: LEVER.y - 6, w: 3, d: 12, r: 1 }, LEVER.z - 7, 14, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf({ x: BASE.x + BASE.w + 3, y: LEVER.y - 3.5, w: 2.4, d: 7, r: 1.4 }, LEVER.z - 3.5, 7, P, 2, 0.3), { tone: "mid" }),
  ].join("");
}

// The lever arm swings in the plane just off the +x face; u = 0 upright, 1 pulled all the way
const leverEnd = (u) => {
  const a = u * 1.95;
  return [LEVER.x, LEVER.y + Math.sin(a) * LEVER.len, LEVER.z + Math.cos(a) * LEVER.len];
};
const leverD = (u) => k.segment([LEVER.x, LEVER.y, LEVER.z], leverEnd(u), P);
const knob = () => S(k.cylinder(0, 0, 3.6, -3, 6, P, 24, 0.4), { tone: "hi", crease: "lo" });

// ---- Assemble ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "A slot machine. Its lever pulls, the three reels spin, and they stop on 4, 0, 4.",
  body: [
    plinth(),
    base(),
    tray(),
    housing(),
    marquee(),
    leverMount(),
    `<path data-part="lever" class="iso-line" data-tone="hi" data-free="end" style="stroke-width:2.2" d="${leverD(0)}"/>`,
    // The pivot bolt the lever turns on
    D([at([LEVER.x, LEVER.y, LEVER.z])], { size: 1.6, tone: "hi" }),
    `<g data-part="knob" transform="${k.translateAlong(P, leverEnd(0))}">${knob()}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const LEVER = ${JSON.stringify(LEVER)}, STEP = ${STEP}, RESULT = ${JSON.stringify(RESULT)}, BULBS = ${BULBS};
const leverEnd = ${leverEnd.toString()};
const leverD = (u) => segment([LEVER.x, LEVER.y, LEVER.z], leverEnd(u), P);
const T = { pull: [0.3, 0.75], release: [0.75, 1.25], spin: 0.7, stops: [2.3, 2.9, 3.5], result: 3.6, reset: 6.2, cycle: 7 };
const LOOPS = [3, 4, 5]; // full turns each reel makes before it lands

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const lever = part("lever"), knob = part("knob"), beacon = part("lamp-top");
const reels = [0, 1, 2].map((i) => part("reel-" + i));
const bulbs = [...svg.querySelectorAll("[data-bulb]")];

// A reel's travel, in symbols: fast, then easing into its symbol with a small settle past it
function travel(i, t) {
  const total = LOOPS[i] * 10 + RESULT[i] + 10;
  const u = Math.min(1, Math.max(0, (t - T.spin) / (T.stops[i] - T.spin)));
  const eased = 1 - Math.pow(1 - u, 3);
  const settle = u >= 1 ? Math.exp(-(t - T.stops[i]) * 9) * Math.sin((t - T.stops[i]) * 26) * 0.08 : 0;
  return total * eased + settle;
}

function phaseOf(t) {
  if (t >= T.reset) return "resetting";
  if (t < T.spin) return "pulling the lever";
  if (t < T.stops[0]) return "spinning";
  if (t < T.stops[1]) return "4";
  if (t < T.stops[2]) return "4 0";
  return "404";
}

runFigure({
  scrub: false,
  cycle: T.cycle,
  scrubEnd: T.reset - 0.2,
  steps: [0.2, T.release[1], T.stops[0] + 0.1, T.stops[1] + 0.1, T.result + 0.3],
  label: () => "",
  phase: phaseOf,
  draw(t) {
    const back = 1 - ease(T.reset, T.reset + 0.5, t);
    const u = ease(...T.pull, t) * (1 - ease(...T.release, t));
    lever.setAttribute("d", leverD(u));
    knob.setAttribute("transform", translateAlong(P, leverEnd(u)));
    reels.forEach((reel, i) => {
      // Before the first spin and after the reset fade, each reel rests on its result
      const s = t < T.spin || t >= T.reset ? 10 + RESULT[i] : travel(i, t);
      const offset = (((s % 10) + 10) % 10) + 10;
      reel.setAttribute("transform", "translate(0 " + (-offset * STEP).toFixed(2) + ")");
    });
    // Bulbs chase while the reels spin, then all flash on 404
    const spinning = t >= T.spin && t < T.result;
    const won = t >= T.result && t < T.reset;
    bulbs.forEach((b, n) => {
      const on = spinning ? (((Math.floor(t * 14) - n) % 4) + 4) % 4 === 0 : won ? Math.floor(t * 4) % 2 === 0 : false;
      b.style.opacity = on ? "1" : "0";
    });
    beacon.style.opacity = (won ? back : 0).toFixed(3);
  },
});
`;

writeFigure("404", {
  bare: true,
  fig: "",
  title: "",
  hint: "",
  readout: "",
  keys: [],
  caption: "",
  svg,
  stageLabel: "Slot machine. Its reels stop on 4, 0, 4. Arrow keys step through the spin.",
  live,
  fix: false,
  css:
    DOCKBAY_CSS +
    `.iso{--sm-glass:#f1f1ee;--sm-drum:#fbfbfa;--sm-digit:#26262a;--sm-bulb:#d4d4d6;--sm-bulb-on:#000}` +
    `.iso[data-theme="dark"]{--sm-glass:#0c0c0c;--sm-drum:#181818;--sm-digit:#e6e6e6;--sm-bulb:#2a2a2a;--sm-bulb-on:#fff}` +
    `.sm-well{fill:var(--sm-glass)}.sm-drum{fill:var(--sm-drum)}.sm-digit{fill:var(--sm-digit);font-family:var(--anatomy-mono);font-weight:700}` +
    `.sm-divider{fill:var(--anatomy-mid)}.sm-stop{stop-color:var(--sm-glass)}.sm-shade-top{fill:url(#sm-fade-top)}.sm-shade-bottom{fill:url(#sm-fade-bottom)}` +
    `.sm-bezel{fill:none;stroke:var(--anatomy-lo);stroke-width:.7}.sm-slot{fill:var(--db-flap)}.sm-panel{fill:none;stroke:var(--anatomy-lo);stroke-width:.6}` +
    `.sm-bulb{fill:var(--sm-bulb)}.sm-bulb-on{fill:var(--sm-bulb-on)}`,
});
