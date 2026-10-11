// Fig: a Where is not a yes (@jhb.software/payload-alt-text-plugin < 0.13.0, GHSA-3pmw-vxv3-8vgq).
// The read rule hands over a Where card. The gauge only asks "is it not false?", reads yes, and the card
// goes in the discard tray; the scanner then sweeps every tenant's rows (overrideAccess: true).
// Fixed (0.13.0): the card is kept, a shutter covers the other tenant, and only your rows are counted.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- Model, from the post ----
const SAMPLE = { totalDocs: 460, missingDocs: 37, partialDocs: 11, completeDocs: 412 };
const COLS = 4;
const ROWS = 3;

// ---- World layout ----
const ZONE_H = 6;
const ZONES = [{ x: -64, y: -6, w: 52, d: 36, r: 1.5 }, { x: 2, y: -6, w: 52, d: 36, r: 1.5 }]; // yours, theirs
const CARD = { w: 10, d: 8, h: 0.8 };
const cardAt = (zone, c, r) => [zone.x + 4 + c * 12 + CARD.w / 2, zone.y + 4 + r * 11 + CARD.d / 2];
const RAILS = [-16, 40];
const RAIL_X = [-82, 74];
const BEAM_Z = 24;
const HEAD_Y = 12;
const SWEEP = [-74, 62];
const GAUGE = { x: -124, y: -52, w: 28, d: 18, r: 2 };
const GAUGE_TOP = 12;
const SLOT = [GAUGE.x + 10, GAUGE.y + 9];
const TRAY = { x: GAUGE.x + 2, y: GAUGE.y + GAUGE.d + 4, w: 22, d: 12, r: 1.2 };
const SHUTTER = { x: ZONES[1].x - 1, y: -62, w: ZONES[1].w + 2, d: 38, r: 1 };
const SHUTTER_Z = ZONE_H + 1.2;
const DIAL = [96, -40];
const DIAL_R = 13;
const DIAL_TOP = 12;

// ---- Parts ----
function rack() {
  const out = [];
  ZONES.forEach((zone, zi) => {
    out.push(S(k.slabOf(zone, 0, ZONE_H, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(zone, 2, P, 3), { tone: "faint" }) }));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const [cx, cy] = cardAt(zone, c, r);
        const plan = { x: cx - CARD.w / 2, y: cy - CARD.d / 2, w: CARD.w, d: CARD.d, r: 0.5 };
        out.push(S(k.slabOf(plan, ZONE_H, CARD.h, P, 2), { tone: zi === 0 ? "hi" : "mid", crease: "none" }));
        out.push(L(k.lineOnTop([plan.x + 2, cy - 1.2], [plan.x + 2 + 4 + ((c + r + zi) % 3), cy - 1.2], ZONE_H + CARD.h, P), { tone: "lo", free: true }));
      }
    }
  });
  // Tenant wall between the two zones
  out.push(S(k.slabOf({ x: ZONES[0].x + ZONES[0].w + 2, y: ZONES[0].y, w: 2, d: ZONES[0].d, r: 0.5 }, 0, ZONE_H + 5, P, 2, 0.3), { tone: "mid" }));
  return out.join("");
}

function rail(y) {
  const plan = { x: RAIL_X[0], y: y - 2, w: RAIL_X[1] - RAIL_X[0], d: 4, r: 1 };
  return [
    S(k.slabOf(plan, 0, 3, P, 2, 0.4), { tone: "mid" }),
    D([RAIL_X[0] + 4, RAIL_X[1] - 4].map((x) => at([x, y, 3])), { size: 0.4 }),
  ].join("");
}

function shutterHousing() {
  // Where the shutter parks, behind the other tenant's zone
  const plan = { x: SHUTTER.x - 2, y: SHUTTER.y - 2, w: SHUTTER.w + 4, d: SHUTTER.d + 2, r: 1.5 };
  return S(k.slabOf(plan, 0, SHUTTER_Z, P, 3, 0.5), { tone: "lo", inner: L(k.sideSeam(plan, 3, P, 3), { tone: "faint" }) });
}

function shutter() {
  const out = [S(k.slabOf(SHUTTER, SHUTTER_Z, 1.2, P, 2, 0.4), { tone: "hi", crease: "lo" })];
  for (let i = 1; i < 4; i++) out.push(L(k.lineOnTop([SHUTTER.x, SHUTTER.y + (i * SHUTTER.d) / 4], [SHUTTER.x + SHUTTER.w, SHUTTER.y + (i * SHUTTER.d) / 4], SHUTTER_Z + 1.2, P), { tone: "lo" }));
  out.push(S(k.slabOf({ x: SHUTTER.x + SHUTTER.w / 2 - 5, y: SHUTTER.y + SHUTTER.d - 3, w: 10, d: 2, r: 0.5 }, SHUTTER_Z + 1.2, 1.4, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}

function bridgeBack() {
  return [
    S(k.slabOf({ x: -4, y: RAILS[0] - 3, w: 8, d: 6, r: 1 }, 3, 2, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf({ x: -1.6, y: RAILS[0] - 1.6, w: 3.2, d: 3.2, r: 0.6 }, 5, BEAM_Z - 5, P, 2), { tone: "mid", crease: "none" }),
  ].join("");
}

function bridgeFront() {
  return [
    S(k.slabOf({ x: -2.5, y: RAILS[0] - 3, w: 5, d: RAILS[1] - RAILS[0] + 6, r: 1 }, BEAM_Z, 3.4, P, 2, 0.5), { tone: "mid" }),
    S(k.slabOf({ x: -4, y: RAILS[1] - 3, w: 8, d: 6, r: 1 }, 3, 2, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf({ x: -1.6, y: RAILS[1] - 1.6, w: 3.2, d: 3.2, r: 0.6 }, 5, BEAM_Z - 5, P, 2), { tone: "mid", crease: "none" }),
    S(k.cylinder(0, HEAD_Y, 3.4, BEAM_Z - 5, 5, P, 24, 0.4), { tone: "mid" }),
    S(k.cylinder(0, HEAD_Y, 1.4, ZONE_H + 4, BEAM_Z - 5 - ZONE_H - 4, P, 12), { tone: "mid", crease: "none" }),
    S(k.cylinder(0, HEAD_Y, 2.2, ZONE_H + 2.8, 1.2, P, 18), { tone: "hi", crease: "lo" }),
    D([at([0, RAILS[0], BEAM_Z + 3.4]), at([0, RAILS[1], BEAM_Z + 3.4])], { size: 0.45 }),
  ].join("");
}

function gauge() {
  const out = [S(k.slabOf(GAUGE, 0, GAUGE_TOP, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(GAUGE, 4, P, 3), { tone: "faint" }) })];
  // The card slot: a closed outline on top
  out.push(L(k.planOutline({ x: SLOT[0] - 6, y: SLOT[1] - 1.2, w: 12, d: 2.4, r: 0.6 }, GAUGE_TOP, P, 2), { tone: "lo" }));
  // Two stops for the go/no-go pointer: false at the back, "not false" at the front
  for (const y of [GAUGE.y + 3, GAUGE.y + GAUGE.d - 3]) out.push(S(k.cylinder(GAUGE.x + GAUGE.w - 6, y, 1.2, GAUGE_TOP, 2.4, P, 12), { tone: "mid" }));
  out.push(S(k.cylinder(GAUGE.x + GAUGE.w - 14, GAUGE.y + GAUGE.d / 2, 2, GAUGE_TOP, 1.4, P, 16), { tone: "mid" }));
  out.push(lamp(GAUGE.x + 5, GAUGE.y + GAUGE.d - 5, GAUGE_TOP, "lamp-yes"));
  // Discard tray in front of the gauge
  out.push(S(k.slabOf(TRAY, 0, 4, P, 3, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(TRAY, 1.6), 4, P, 3), { tone: "lo" }));
  return out.join("");
}

const pointerD = (u) => {
  const pivot = [GAUGE.x + GAUGE.w - 14, GAUGE.y + GAUGE.d / 2];
  const a = Math.PI / 2 + (u * 2 - 1) * 0.62;
  return k.lineOnTop(pivot, [pivot[0] + Math.sin(a) * 7.6, pivot[1] - Math.cos(a) * 7.6 * 0.8], GAUGE_TOP + 1.6, P);
};

// The Where card stands upright in the slot; built with its foot at z = 0
const card = () => {
  const plan = { x: SLOT[0] - 5, y: SLOT[1] - 0.6, w: 10, d: 1.2, r: 0.3 };
  return [
    S(k.slabOf(plan, 0, 12, P, 2, 0.3), { tone: "hi", crease: "lo", lit: true }),
    D([at([SLOT[0] - 2.5, SLOT[1] + 0.6, 8]), at([SLOT[0] + 2.5, SLOT[1] + 0.6, 8]), at([SLOT[0], SLOT[1] + 0.6, 5])], { size: 0.5, tone: "lo" }),
  ].join("");
};

function tally() {
  const [x, y] = DIAL;
  const out = [S(k.cylinder(x, y, DIAL_R + 3, 0, 4, P, 48, 0.6), { tone: "mid" })];
  out.push(S(k.cylinder(x, y, DIAL_R, 4, DIAL_TOP - 4, P, 56, 0.6), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, DIAL_R, DIAL_TOP - 2.6, DIAL_TOP, 64, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(x, y, DIAL_R - 2, DIAL_TOP, P, 56), { tone: "lo" }));
  const ticks = k.radialTicks(x, y, DIAL_R - 2.4, 24, 6, DIAL_TOP, [1, 2.2], P, (-150 * Math.PI) / 180, (300 * Math.PI) / 180);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L(k.ring(x, y, 1.4, DIAL_TOP, P, 14), { tone: "mid" }));
  // Cable from the scanner rail to the tally
  out.push(k.wireSvg(at([RAIL_X[1], RAILS[0], 1.5]), at([x - DIAL_R - 3, y + 6, 2]), { via: [at([RAIL_X[1] + 6, RAILS[0], 0.2]), at([RAIL_X[1] + 6, y + 6, 0.2])], tone: "mid" }));
  return out.join("");
}

const needleD = (share) => {
  const a = ((-150 + 300 * share) * Math.PI) / 180;
  const [x, y] = DIAL;
  return k.lineOnTop([x - Math.sin(a) * 2.4, y + Math.cos(a) * 2.4], [x + Math.sin(a) * (DIAL_R - 3.2), y - Math.cos(a) * (DIAL_R - 3.2)], DIAL_TOP + 0.2, P);
};

// ---- Assemble ----
const columns = ZONES.flatMap((zone, zi) => Array.from({ length: COLS }, (_, c) => ({ x: cardAt(zone, c, 0)[0], theirs: zi === 1 })));

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A scanning bench. At the left, a go/no-go gauge takes the read rule's Where card. Two tenant zones of document cards sit under a gantry scanner that sweeps across them, and a tally dial counts what it passes. A shutter can slide over the other tenant's zone.",
  body: [
    deck("GHSA-3PMW"),
    gauge(),
    `<path data-part="pointer" class="iso-line" data-tone="hi" style="stroke-width:1.3" d="${pointerD(0)}"/>`,
    `<g data-part="card" style="opacity:0">${card()}</g>`,
    tally(),
    `<path data-part="needle" class="iso-line" data-tone="hi" style="stroke-width:1.1" data-free="start" d="${needleD(0)}"/>`,
    rail(RAILS[0]),
    shutterHousing(),
    rack(),
    `<g data-part="shutter">${shutter()}</g>`,
    `<g data-part="bridge-back" transform="${k.translateAlong(P, [SWEEP[0], 0, 0])}">${bridgeBack()}</g>`,
    rail(RAILS[1]),
    `<g data-part="bridge" transform="${k.translateAlong(P, [SWEEP[0], 0, 0])}">${bridgeFront()}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const SWEEP = ${JSON.stringify(SWEEP)}, COLUMNS = ${JSON.stringify(columns)}, ROWS = ${ROWS}, SAMPLE = ${JSON.stringify(SAMPLE)};
const SLOT = ${JSON.stringify(SLOT)}, TRAY = ${JSON.stringify(TRAY)}, SHUTTER_TRAVEL = ${ZONES[1].y - 2 - SHUTTER.y};
const GAUGE = ${JSON.stringify(GAUGE)}, GAUGE_TOP = ${GAUGE_TOP}, DIAL = ${JSON.stringify(DIAL)}, DIAL_R = ${DIAL_R}, DIAL_TOP = ${DIAL_TOP};
const T = { card: [0.4, 1.2], gauge: [1.5, 1.9], discard: [2.1, 2.8], shutter: [2.1, 2.9], sweep: [3.1, 7.1], reset: 8.6, home: [8.6, 9.8], cycle: 10 };
const pointerD = ${pointerD.toString().replace(/k\./g, "")};
const needleD = ${needleD.toString().replace(/k\./g, "")};

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const card = part("card"), pointer = part("pointer"), needle = part("needle"), shutterPart = part("shutter"), yes = part("lamp-yes");
const bridges = [part("bridge-back"), part("bridge")];
const total = COLUMNS.length * ROWS;

function counted(x, fixed) {
  let n = 0;
  for (const col of COLUMNS) if (x >= col.x && !(fixed && col.theirs)) n += ROWS;
  return n;
}

function phaseOf(t, fixed) {
  if (t >= T.reset) return "resetting";
  if (t < T.gauge[0]) return "GET /api/alt-text/health";
  if (t < T.discard[0]) return "read → Where { tenant }";
  if (t < T.sweep[0]) return fixed ? "Where kept · scan as the user" : "Where !== false → true";
  if (t < T.sweep[1]) return fixed ? "scanning · overrideAccess: false" : "scanning · overrideAccess: true";
  return fixed ? "counts · your tenant's rows only" : SAMPLE.totalDocs + " docs · " + SAMPLE.missingDocs + " missing · all tenants";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 8.4,
  steps: [0.2, T.gauge[1], T.discard[1], (T.sweep[0] + T.sweep[1]) / 2, T.sweep[1] + 0.4],
  label: (fixed) => (fixed ? "Fixed: the Where is applied" : "Apply the fix: keep the Where"),
  phase: phaseOf,
  draw(t, fixed) {
    const back = 1 - ease(T.reset, T.reset + 0.6, t);
    const x = t < T.home[0] ? SWEEP[0] + (SWEEP[1] - SWEEP[0]) * ease(...T.sweep, t) : SWEEP[1] + (SWEEP[0] - SWEEP[1]) * ease(...T.home, t);
    for (const b of bridges) b.setAttribute("transform", translateAlong(P, [x, 0, 0]));
    // The card drops into the slot; in the bug it then goes to the discard tray
    const seat = ease(...T.card, t);
    let pos = [0, 0, 14 * (1 - seat)];
    if (!fixed) {
      const d = ease(...T.discard, t);
      const lift = Math.sin(Math.PI * d) * 10;
      pos = [(TRAY.x + TRAY.w / 2 - SLOT[0]) * d, (TRAY.y + TRAY.d / 2 - SLOT[1]) * d, pos[2] + lift + (4 - GAUGE_TOP) * d];
    }
    card.setAttribute("transform", translateAlong(P, [pos[0], pos[1], GAUGE_TOP + pos[2]]));
    card.style.opacity = (ease(T.card[0], T.card[0] + 0.25, t) * back).toFixed(3);
    const tilt = ease(...T.gauge, t) * back;
    pointer.setAttribute("d", pointerD(tilt));
    yes.style.opacity = tilt.toFixed(3);
    shutterPart.setAttribute("transform", translateAlong(P, [0, fixed ? SHUTTER_TRAVEL * ease(...T.shutter, t) * back : 0, 0]));
    const n = t < T.sweep[0] || t >= T.reset ? 0 : counted(x + 0.001, fixed);
    needle.setAttribute("d", needleD(n / total));
  },
});
`;

writeFigure("payload-alt-text-health-row-level-bypass", {
  fig: "Fig 1",
  title: "A Where is not a yes",
  readout: "GET /api/alt-text/health",
  keys: [
    { mark: "lit", label: "Where card: the read rule's row constraint" },
    { mark: "raised", label: "Your tenant's documents (left) and another tenant's (right)" },
  ],
  caption:
    "The read rule returns a Where, not a boolean. 0.12.0 only asked whether it was !== false, read yes, and dropped the constraint; the cached scan had already counted every tenant with overrideAccess: true, so any logged-in user got counts and up to 100 document IDs from rows they cannot read. 0.13.0 records the constraint and scans as the user.",
  svg,
  stageLabel: "Payload alt text health scanner. Arrow keys step through the run; Space applies or removes the fix.",
  live,
  css: DOCKBAY_CSS,
});
