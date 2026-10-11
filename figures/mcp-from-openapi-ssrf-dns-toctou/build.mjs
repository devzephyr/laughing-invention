// Fig: DNS rebinding against a check-then-fetch SSRF guard (mcp-from-openapi <= 2.5.0, GHSA-rm2m-wfw5-7wp5).
// A split-flap board is the attacker's nameserver (TTL 0). The clearance station checks lookup 1;
// the berth selector dials whatever lookup 2 says. Pinned (the 2.5.1 fix), the checked answer rides
// on the cart as a stamped card and the selector reads that instead.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, recess, planeOf, flat, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- Model: every value below comes from the post ----
const SAFE = "8.8.8.8"; // lookup 1, what assertUrlSafe() checks
const REBOUND = "127.0.0.1"; // lookup 2, what fetch() dials
const CELLS = 9; // widest answer, "127.0.0.1"

// ---- World layout ----
const RAIL_Y = 24;
const RAIL_FROM = -112;
const RAIL_TO = 52;
const CART = { x: -15, y: RAIL_Y - 15, w: 30, d: 30, r: 3 };
const CART_Z = 3;
const CART_TOP = 9;
const STOPS = { start: -92, check: -40, dock: 34 };

const BOARD = { x: -104, y: -64, w: 124, d: 14, r: 2 };
const BOARD_Z = 6;
const BOARD_TOP = 46;
const FACE_Y = BOARD.y + BOARD.d;
const WINDOW = { x0: -96, x1: 12, z0: 20, z1: 40, r: 2, depth: 3 };
const CELL = { pitch: 11.6, w: 10.4, h: 16, font: 13 };
const CELL_X0 = WINDOW.x0 + 4 + CELL.w / 2;
const CELL_Z = (WINDOW.z0 + WINDOW.z1) / 2;

const STATION = { x: -62, y: -22, w: 30, d: 16, r: 2 };
const STATION_TOP = 10;
const POST = [STOPS.check, -14];
const ARM_Z = 26;
const PAD_REST = 16; // stamp pad's underside at rest
const PAD_DOWN = CART_TOP + 0.8; // lands on the card

const DIAL = [78, 10];
const DIAL_TOP = 11;
const REACH = 19;
const ANGLE = { rest: -90, public: 45, internal: 135 };
const postAt = (deg) => [DIAL[0] + REACH * Math.sin((deg * Math.PI) / 180), DIAL[1] - REACH * Math.cos((deg * Math.PI) / 180)];

const SERVICE = { x: 108, y: 18, w: 22, d: 16, r: 2 }; // the internal service on 127.0.0.1:8124
const BULKHEAD = { x: 122, y: -40, w: 10, d: 14, r: 1.5 }; // the way out to the public internet

// ---- Parts ----
function board() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(BOARD, 2), 0, 4, P)}"/>`);
  out.push(S(k.slabOf({ x: BOARD.x + 6, y: BOARD.y + 2, w: BOARD.w - 12, d: BOARD.d - 4, r: 1.5 }, 0, BOARD_Z, P, 4, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf(BOARD, BOARD_Z, BOARD_TOP - BOARD_Z, P, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(BOARD, BOARD_Z + 6, P, 4), { tone: "faint" }) }));
  // Split-flap cells on the window's back plane, in its local (x, -z) coordinates
  const cells = [];
  for (let i = 0; i < CELLS; i++) {
    const cx = CELL_X0 + i * CELL.pitch;
    const tile = `<rect class="db-flap" x="${-CELL.w / 2}" y="${-CELL.h / 2}" width="${CELL.w}" height="${CELL.h}" rx="0.8"/>`;
    const glyph = (key) => `<text class="db-flap-text" data-k="${key}" x="0" y="${(CELL.font * 0.36).toFixed(2)}" font-size="${CELL.font}" text-anchor="middle"></text>`;
    cells.push(
      `<g data-cell="${i}" transform="translate(${cx.toFixed(2)} ${-CELL_Z})">${tile}` +
        `<g clip-path="url(#db-half-top)">${glyph("bt")}</g><g clip-path="url(#db-half-bottom)">${glyph("bb")}</g>` +
        `<g clip-path="url(#db-half-top)"><g data-k="f1" transform="scale(1 0)">${tile}${glyph("t1")}</g></g>` +
        `<g clip-path="url(#db-half-bottom)"><g data-k="f2" transform="scale(1 0)">${tile}${glyph("t2")}</g></g>` +
        `<path class="db-flap-seam" d="M${-CELL.w / 2} 0H${CELL.w / 2}"/></g>`,
    );
  }
  const halves =
    `<clipPath id="db-half-top"><rect x="${-CELL.w / 2}" y="${-CELL.h / 2}" width="${CELL.w}" height="${CELL.h / 2}"/></clipPath>` +
    `<clipPath id="db-half-bottom"><rect x="${-CELL.w / 2}" y="0" width="${CELL.w}" height="${CELL.h / 2}"/></clipPath>`;
  out.push(`<defs>${halves}</defs>`);
  out.push(recess({ ...WINDOW }, FACE_Y, cells.join("")));
  // Face screws and a vent row of closed slots below the window
  out.push(D([[BOARD.x + 5, BOARD_TOP - 4], [BOARD.x + BOARD.w - 5, BOARD_TOP - 4], [BOARD.x + 5, BOARD_Z + 10], [BOARD.x + BOARD.w - 5, BOARD_Z + 10]].map(([x, z]) => at([x, FACE_Y, z])), { size: 0.45 }));
  const vents = [];
  for (let x = -60; x <= -12; x += 8) vents.push(flat(x, 11, x + 5, 13.4, 1.2, 3));
  out.push(`<g transform="${planeOf(FACE_Y)}"><path class="iso-line" data-tone="lo" d="${vents.join("")}"/></g>`);
  // TTL dial on the roof, needle parked at zero
  const [tx, ty] = [6, BOARD.y + 7];
  out.push(S(k.cylinder(tx, ty, 6.2, BOARD_TOP, 0.6, P, 32), { tone: "lo", crease: "none" }));
  const ticks = k.radialTicks(tx, ty, 6, 12, 3, BOARD_TOP + 0.6, [0.9, 1.6], P, (-135 * Math.PI) / 180, (270 * Math.PI) / 180);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(S(k.cylinder(tx, ty, 3.4, BOARD_TOP + 0.6, 3, P, 28), { tone: "mid" }));
  out.push(L(k.knurl(tx, ty, 3.4, BOARD_TOP + 0.6, BOARD_TOP + 3.6, 22, P), { tone: "lo" }));
  out.push(L(k.lineOnTop([tx, ty], [tx + 3.4 * Math.sin(-135 * Math.PI / 180), ty - 3.4 * Math.cos(-135 * Math.PI / 180)], BOARD_TOP + 3.6, P), { tone: "hi" }));
  // Antenna mast at the back corner: the nameserver answers whoever asks
  const mast = [BOARD.x + 10, BOARD.y + 5];
  out.push(S(k.cylinder(mast[0], mast[1], 2.6, BOARD_TOP, 2, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(mast[0], mast[1], 0.9, BOARD_TOP + 2, 14, P, 12), { tone: "mid", crease: "none" }));
  out.push(D([at([mast[0], mast[1], BOARD_TOP + 16])], { size: 0.9, tone: "hi" }));
  return out.join("");
}

function rails() {
  const out = [];
  for (const y of [RAIL_Y - 9, RAIL_Y + 5]) {
    out.push(S(k.slabOf({ x: RAIL_FROM, y, w: RAIL_TO - RAIL_FROM, d: 4, r: 1 }, 0, CART_Z, P, 3, 0.4), { tone: "mid" }));
    out.push(D([RAIL_FROM + 5, (RAIL_FROM + RAIL_TO) / 2, RAIL_TO - 5].map((x) => at([x, y + 2, CART_Z])), { size: 0.4 }));
  }
  for (const x of [RAIL_FROM - 5, RAIL_TO]) {
    out.push(S(k.slabOf({ x, y: RAIL_Y - 12, w: 5, d: 24, r: 1.2 }, 0, 7, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([x + 2.5, RAIL_Y - 8, 7]), at([x + 2.5, RAIL_Y + 8, 7])], { size: 0.45 }));
  }
  // Ruler strip along the rail, ticks rooted on its far edge
  const strip = { x: RAIL_FROM, y: RAIL_Y + 13, w: RAIL_TO - RAIL_FROM, d: 5, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

function stationBack() {
  const out = [];
  out.push(S(k.slabOf(STATION, 0, STATION_TOP, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(STATION, 3, P, 4), { tone: "faint" }) }));
  out.push(D(k.corners(STATION, 2.6).map(([x, y]) => at([x, y, STATION_TOP])), { size: 0.42 }));
  out.push(lamp(-54, -14, STATION_TOP, "lamp-check"));
  out.push(S(k.cylinder(POST[0], POST[1], 4.4, STATION_TOP, 2.4, P, 28), { tone: "mid" }));
  out.push(S(k.cylinder(POST[0], POST[1], 2.6, STATION_TOP + 2.4, ARM_Z - STATION_TOP - 2.4, P, 24), { tone: "mid", crease: "none" }));
  out.push(L(k.sideArc(POST[0], POST[1], 2.6, 20, P, 14), { tone: "faint" }));
  return out.join("");
}

function stationFront() {
  // Drawn after the cart: the arm and the stamp head hang over it
  const out = [];
  const arm = { x: POST[0] - 3, y: POST[1] - 4, w: 6, d: RAIL_Y - POST[1] + 8, r: 1.5 };
  out.push(S(k.slabOf(arm, ARM_Z, 3.4, P, 3, 0.5), { tone: "mid" }));
  out.push(D([at([POST[0], POST[1], ARM_Z + 3.4]), at([POST[0], RAIL_Y, ARM_Z + 3.4])], { size: 0.45 }));
  out.push(S(k.cylinder(POST[0], RAIL_Y, 3.2, ARM_Z - 5, 5, P, 24), { tone: "mid" }));
  out.push(L(k.sideArc(POST[0], RAIL_Y, 3.2, ARM_Z - 2.5, P, 14), { tone: "faint" }));
  return out.join("");
}

function stamp() {
  // Built with its pad at z = 0, moved up to PAD_REST by the live code
  return [
    S(k.cylinder(POST[0], RAIL_Y, 1.3, 2.2, ARM_Z - 5 - PAD_DOWN - 1, P, 14), { tone: "mid", crease: "none" }),
    S(k.cylinder(POST[0], RAIL_Y, 3.6, 0, 2.2, P, 28, 0.4), { tone: "hi", crease: "lo" }),
  ].join("");
}

function cart() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CART, 3), CART_Z, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(CART, CART_Z, CART_TOP - CART_Z, P, 5, 0.6), { tone: "mid", inner: L(k.sideSeam(CART, CART_Z + 2.4, P, 5), { tone: "faint" }) }));
  for (const [x, y] of k.corners(CART, 4.5)) out.push(L(k.ring(x, y, 1.8, CART_TOP, P, 14), { tone: "lo" }));
  out.push(D(k.corners(CART, 4.5).map(([x, y]) => at([x, y, CART_TOP])), { size: 0.45 }));
  // Card holder: two guides either side of the slot
  for (const y of [RAIL_Y - 5.4, RAIL_Y + 3.8]) out.push(S(k.slabOf({ x: -11, y, w: 22, d: 1.6, r: 0.4 }, CART_TOP, 1.4, P, 2), { tone: "mid", crease: "none" }));
  out.push(L(k.planOutline({ x: -10, y: RAIL_Y - 3.6, w: 20, d: 7.2, r: 0.6 }, CART_TOP, P, 3), { tone: "faint" }));
  // The berth card the clearance station stamps; only kept when the dial is pinned
  const card = { x: -10, y: RAIL_Y - 3.6, w: 20, d: 7.2, r: 0.6 };
  out.push(
    `<g data-part="card" style="opacity:0">${S(k.slabOf(card, CART_TOP, 0.8, P, 3), { tone: "hi", crease: "lo" })}` +
      `${k.faceTextSvg(k.topMatrix([0, RAIL_Y + 1.2], CART_TOP + 0.8, P, "x"), SAFE, { size: 3.4, tone: "hi", anchor: "middle" })}</g>`,
  );
  // Push handle on the near face
  out.push(S(k.slabOf({ x: -3, y: CART.y + CART.d - 1, w: 6, d: 3.4, r: 0.8 }, CART_Z + 1.2, 2.4, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(0, CART.y + CART.d + 3.4, 2.4, CART_Z + 0.4, 4, P, 18), { tone: "mid" }));
  out.push(L(k.knurl(0, CART.y + CART.d + 3.4, 2.4, CART_Z + 0.4, CART_Z + 4.4, 14, P), { tone: "lo" }));
  return out.join("");
}

function selector() {
  const out = [];
  const [x, y] = DIAL;
  out.push(S(k.cylinder(x, y, 13, 0, 3, P, 48, 0.6), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 9.6, 3, DIAL_TOP - 3, P, 48, 0.6), { tone: "hi", crease: "lo" }));
  out.push(L(k.sideArc(x, y, 9.6, 6.5, P, 30), { tone: "faint" }));
  out.push(L(k.ring(x, y, 7.6, DIAL_TOP, P, 48), { tone: "lo" }));
  const ticks = k.radialTicks(x, y, 7.4, 24, 6, DIAL_TOP, [0.9, 1.8], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D(k.corners({ x: x - 13, y: y - 13, w: 26, d: 26, r: 13 }, 4).map(([px, py]) => at([px, py, 3])), { size: 0.42 }));
  return out.join("");
}

function contact(deg) {
  const [x, y] = postAt(deg);
  return [
    S(k.cylinder(x, y, 3, 0, 1.4, P, 20), { tone: "lo" }),
    S(k.cylinder(x, y, 1.8, 1.4, DIAL_TOP - 0.4, P, 16), { tone: "mid", crease: "none" }),
    S(k.cylinder(x, y, 2.6, DIAL_TOP + 1, 1.2, P, 20), { tone: "mid" }),
  ].join("");
}

function service() {
  const out = [S(k.slabOf(SERVICE, 0, 16, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(SERVICE, 4, P, 4), { tone: "faint" }) })];
  out.push(D(k.dotGrid(SERVICE.x + 4, SERVICE.y + 4, 6, 3, 2.4, 16, P), { size: 0.45, tone: "lo" }));
  out.push(lamp(SERVICE.x + SERVICE.w - 5, SERVICE.y + SERVICE.d - 5, 16, "lamp-internal"));
  return out.join("");
}

function bulkhead() {
  const out = [S(k.slabOf(BULKHEAD, 0, 12, P, 3, 0.6), { tone: "mid" })];
  out.push(L(k.sideRing([BULKHEAD.x + BULKHEAD.w, BULKHEAD.y + 7, 6], 3, "x", P), { tone: "lo" }));
  out.push(lamp(BULKHEAD.x + 5, BULKHEAD.y + 7, 12, "lamp-public"));
  return out.join("");
}

function wires() {
  const [px, py] = postAt(ANGLE.public);
  const [ix, iy] = postAt(ANGLE.internal);
  const floor = (points) => points.map(([x, y, z = 0.2]) => at([x, y, z]));
  const pub = floor([[px, py], [px, BULKHEAD.y + BULKHEAD.d + 4], [BULKHEAD.x + 5, BULKHEAD.y + BULKHEAD.d + 4], [BULKHEAD.x + 5, BULKHEAD.y + BULKHEAD.d, 3]]);
  const int = floor([[ix, iy], [ix, SERVICE.y + SERVICE.d + 6], [SERVICE.x + 6, SERVICE.y + SERVICE.d + 6], [SERVICE.x + 6, SERVICE.y + SERVICE.d, 3]]);
  return [
    k.wireSvg(pub[0], pub[pub.length - 1], { via: pub.slice(1, -1), tone: "mid" }),
    k.wireSvg(int[0], int[int.length - 1], { via: int.slice(1, -1), tone: "mid" }),
  ].join("");
}

const wiperAt = (deg) => {
  const a = (deg * Math.PI) / 180;
  return [
    [DIAL[0] - Math.sin(a) * 3, DIAL[1] + Math.cos(a) * 3],
    [DIAL[0] + Math.sin(a) * REACH, DIAL[1] - Math.cos(a) * REACH],
  ];
};
const wiperD = (deg) => {
  const [a, b] = wiperAt(deg);
  return k.lineOnTop(a, b, DIAL_TOP + 1.6, P);
};

// ---- Assemble, back to front ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A dispatch bench. At the back, a split-flap board stands for the attacker's DNS server with a TTL of zero. A cart on a rail stops at a clearance station, whose stamp checks the address on the board, then rolls to a berth selector, which reads the board again and swings its arm to either the public bulkhead or the internal service.",
  body: [
    deck("GHSA-RM2M"),
    board(),
    stationBack(),
    wires(),
    contact(ANGLE.public),
    bulkhead(),
    selector(),
    rails(),
    `<g data-part="cart" transform="${k.translateAlong(P, [STOPS.start, 0, 0])}">${cart()}</g>`,
    stationFront(),
    `<g data-part="stamp" transform="${k.translateAlong(P, [0, 0, PAD_REST])}">${stamp()}</g>`,
    contact(ANGLE.rest),
    `<path data-part="wiper" class="iso-line" data-tone="lit" d="${wiperD(ANGLE.rest)}" style="stroke-width:1.6"/>`,
    S(k.cylinder(DIAL[0], DIAL[1], 2.6, DIAL_TOP, 1.6, P, 20), { tone: "hi", lit: true }),
    contact(ANGLE.internal),
    service(),
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const SAFE = ${JSON.stringify(SAFE)}, REBOUND = ${JSON.stringify(REBOUND)}, CELLS = ${CELLS};
const STOPS = ${JSON.stringify(STOPS)};
const DIAL = ${JSON.stringify(DIAL)}, REACH = ${REACH}, DIAL_TOP = ${DIAL_TOP};
const ANGLE = ${JSON.stringify(ANGLE)};
const PAD_REST = ${PAD_REST}, PAD_DOWN = ${PAD_DOWN};
const wiperAt = ${wiperAt.toString()};
const wiperD = (deg) => { const [a, b] = wiperAt(deg); return lineOnTop(a, b, DIAL_TOP + 1.6, P); };

// One cycle, in seconds. Every part is a pure function of t, so scrubbing works both ways.
const T = { toCheck: [0.4, 1.6], look1: 1.8, stamp: [2.9, 3.1, 3.4], toDock: [3.6, 5.2], look2: 5.4, dialPinned: 5.5, dialRebound: 6.5, reset: 8.6, home: [8.6, 9.8], cycle: 10 };
const SCRUB_END = 8.4;
const FLIP = 0.5, STAGGER = 0.05;

const pad = (text) => text.padEnd(CELLS, " ");
const dialAt = (pinned) => (pinned ? T.dialPinned : T.dialRebound);
const dialedIp = (pinned) => (pinned ? SAFE : REBOUND);

function boardEvents(pinned) {
  const list = [[0, pad("")], [T.look1, pad(SAFE)]];
  if (!pinned) list.push([T.look2, pad(REBOUND)]);
  list.push([T.reset, pad("")]);
  return list;
}

function pose(t, pinned) {
  const x = t < T.home[0]
    ? STOPS.start + (STOPS.check - STOPS.start) * ease(...T.toCheck, t) + (STOPS.dock - STOPS.check) * ease(...T.toDock, t)
    : STOPS.dock + (STOPS.start - STOPS.dock) * ease(...T.home, t);
  const press = ease(T.stamp[0], T.stamp[1], t) * (1 - ease(T.stamp[1], T.stamp[2], t));
  const out = 1 - ease(T.reset, T.reset + 0.3, t);
  const dial = dialAt(pinned);
  const target = dialedIp(pinned) === REBOUND ? ANGLE.internal : ANGLE.public;
  const swing = ease(dial, dial + 0.7, t);
  const angle = ANGLE.rest + (target - ANGLE.rest) * swing * (1 - ease(T.reset, T.reset + 0.7, t)) ;
  return {
    x,
    padZ: PAD_REST + (PAD_DOWN - PAD_REST) * press,
    card: pinned ? ease(T.stamp[1] - 0.05, T.stamp[1] + 0.1, t) * out : 0,
    check: ease(T.stamp[1], T.stamp[1] + 0.15, t) * out,
    angle,
    hit: ease(dial + 0.6, dial + 0.75, t) * out,
    target,
  };
}

function phaseOf(t, pinned) {
  const dial = dialAt(pinned);
  if (t < T.look1) return "resolving · 0 lookups";
  if (t < T.stamp[1]) return "lookup 1 → " + SAFE;
  if (t >= dial + 0.6 && t < T.reset) return pinned ? "dialed " + SAFE + " · the checked IP" : "dialed " + REBOUND + " · never checked";
  if (!pinned && t >= T.look2 && t < T.reset) return "lookup 2 → " + REBOUND;
  if (t < T.reset) return "check " + SAFE + " · allowed" + (pinned ? " · pinned" : "");
  return "resetting";
}

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const cart = part("cart"), stamp = part("stamp"), card = part("card"), wiper = part("wiper");
const lamps = { check: part("lamp-check"), internal: part("lamp-internal"), public: part("lamp-public") };
const cells = [...svg.querySelectorAll("[data-cell]")].map((g) => ({
  bt: g.querySelector('[data-k="bt"]'), bb: g.querySelector('[data-k="bb"]'),
  f1: g.querySelector('[data-k="f1"]'), t1: g.querySelector('[data-k="t1"]'),
  f2: g.querySelector('[data-k="f2"]'), t2: g.querySelector('[data-k="t2"]'),
}));

const setText = (node, text) => { if (node.textContent !== text) node.textContent = text; };
const setFlap = (node, scale) => { const v = "scale(1 " + scale.toFixed(3) + ")"; if (node.getAttribute("transform") !== v) node.setAttribute("transform", v); };

function drawBoard(t, pinned) {
  const events = boardEvents(pinned);
  let index = 0;
  for (let i = 0; i < events.length; i++) if (events[i][0] <= t) index = i;
  const [at, text] = events[index];
  const before = index > 0 ? events[index - 1][1] : text;
  cells.forEach((cell, i) => {
    const local = (t - at - i * STAGGER) / FLIP;
    const next = text[i], prev = local >= 1 || index === 0 ? next : before[i];
    if (prev === next || local >= 1) {
      setText(cell.bt, next); setText(cell.bb, next); setFlap(cell.f1, 0); setFlap(cell.f2, 0);
      return;
    }
    // Back: new top, old bottom. Front flap: old top folds down, then new bottom unfolds.
    setText(cell.bt, local < 0 ? prev : next);
    setText(cell.bb, prev);
    setText(cell.t1, prev); setText(cell.t2, next);
    setFlap(cell.f1, local >= 0 && local < 0.5 ? Math.cos(local * Math.PI) : 0);
    setFlap(cell.f2, local >= 0.5 ? -Math.cos(local * Math.PI) : 0);
  });
}

runFigure({
  cycle: T.cycle,
  scrubEnd: SCRUB_END,
  steps: [0.2, T.look1 + 1, T.stamp[2], T.toDock[1] + 0.1, T.look2 + 0.95, T.dialRebound + 0.8],
  label: (pinned) => (pinned ? "Fixed: dial the checked IP" : "Apply the fix: pin the dial"),
  phase: phaseOf,
  draw(t, pinned) {
    const p = pose(t, pinned);
    cart.setAttribute("transform", translateAlong(P, [p.x, 0, 0]));
    stamp.setAttribute("transform", translateAlong(P, [0, 0, p.padZ]));
    card.style.opacity = p.card.toFixed(3);
    lamps.check.style.opacity = p.check.toFixed(3);
    lamps.internal.style.opacity = (p.target === ANGLE.internal ? p.hit : 0).toFixed(3);
    lamps.public.style.opacity = (p.target === ANGLE.public ? p.hit : 0).toFixed(3);
    wiper.setAttribute("d", wiperD(p.angle));
    drawBoard(t, pinned);
  },
});
`;

writeFigure("mcp-from-openapi-ssrf-dns-toctou", {
  fig: "Fig 1",
  title: "DNS rebinding",
  readout: "resolving · 0 lookups",
  keys: [
    { mark: "lit", label: "Selector arm: the address the socket actually dials" },
    { mark: "raised", label: "Split-flap board: the attacker's DNS answer, TTL 0" },
  ],
  caption:
    "The clearance station checks lookup 1 (8.8.8.8) and its lamp clears. The selector then reads the board again at connect time, gets 127.0.0.1, and dials the internal service. With the fix, as in 2.5.1, the checked address rides with the request and the selector dials that.",
  svg,
  stageLabel: "DNS rebinding bench. Arrow keys step through the run; Space applies or removes the fix.",
  live,
  css:
    DOCKBAY_CSS +
    `.db-flap{fill:var(--db-flap)}.db-flap-text{fill:var(--db-flap-text);font-family:var(--anatomy-mono);font-weight:600}.db-flap-seam{stroke:var(--db-well);stroke-width:.35}`,
});
