// Fig: the 404 page, a railway roundhouse. Around the turntable stands one stall per post on the site.
// A request rolls in, the turntable lines up with every stall in turn, each stall lamp flashes and its
// door stays shut, and the crate ends in the lost-and-found bin. "Route me home" swings the turntable
// back to the entry track and rolls the request out the way it came, then goes to /.
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, recess, crateSvg, CART_TOP, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- Model: one stall per post that actually exists ----
const POSTS = readdirSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "posts")).filter((f) => f.endsWith(".md")).length;
const CELLS = 16;

// ---- World layout: angles in degrees, 0 = +x, 90 = +y (toward the viewer's left) ----
const C = [34, 2]; // turntable centre
const PIT_R = 26;
const DISC_R = 23;
const DISC_TOP = 3;
const STALL = { r0: 46, r1: 72, h: 26, door: 18 };
const ARC = [150, 300]; // the stalls stand round the back of the yard
const stallAngle = (i) => ARC[0] + ((i + 0.5) * (ARC[1] - ARC[0])) / POSTS;
const HALF = (ARC[1] - ARC[0]) / POSTS / 2;
const ENTRY = 62; // the entry track runs toward the front left
const LOST = 8; // the lost-and-found siding runs to the right
const dir = (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
const along = (deg, r) => [C[0] + dir(deg)[0] * r, C[1] + dir(deg)[1] * r];
const RAIL_Z = 2;
const ENTRY_LEN = 66;
const LOST_LEN = 50;
const BIN_C = along(LOST, LOST_LEN + 10);
const BIN = { x: BIN_C[0] - 11, y: BIN_C[1] - 10, w: 22, d: 20, r: 1.5 };
const BIN_H = 8;
const BOARD = { x: -134, y: -20, w: 92, d: 12, r: 2 };
const BOARD_TOP = 40;
const FACE_Y = BOARD.y + BOARD.d;
const WIN = { x0: BOARD.x + 5, x1: BOARD.x + BOARD.w - 5, z0: 13, z1: 35, r: 1.6, depth: 3 };
const PITCH = 5.05;
const CELL = { w: 4.5, h: 8.6, font: 6.2 };
const ROW_Z = [29, 19];
const cellX = (i) => WIN.x0 + 2.6 + CELL.w / 2 + i * PITCH;

// ---- Geometry helpers ----
const wedge = (deg, r0, r1, half) => {
  const a = deg - half, b = deg + half;
  return [along(a, r0), along(a, r1), along(b, r1), along(b, r0)];
};
// A straight strip along a ray: from r0 to r1, `w` wide, offset sideways by `off`
const strip = (deg, r0, r1, w, off = 0) => {
  const [dx, dy] = dir(deg), [nx, ny] = [-dy, dx];
  const p = (r, s) => [C[0] + dx * r + nx * s, C[1] + dy * r + ny * s];
  return [p(r0, off - w / 2), p(r1, off - w / 2), p(r1, off + w / 2), p(r0, off + w / 2)];
};

function track(deg, r0, r1) {
  // Two rails on sleepers
  const out = [];
  for (let r = r0 + 1.5; r < r1 - 1; r += 3.6) out.push(S(k.extrude(strip(deg, r, r + 1.6, 9), 0, 0.6, P), { tone: "lo", crease: "none" }));
  for (const off of [-2.6, 2.6]) out.push(S(k.extrude(strip(deg, r0, r1, 1, off), 0.6, RAIL_Z - 0.6, P), { tone: "mid", crease: "none" }));
  return out.join("");
}

function stall(i) {
  const deg = stallAngle(i);
  const out = [];
  // The stall: a wedge of walls and roof, door on the face toward the turntable
  out.push(S(k.extrude(wedge(deg, STALL.r0, STALL.r1, HALF - 0.35), 0, STALL.h, P), { tone: "mid", crease: "lo" }));
  // Roof skylight along the stall, end to end on the roof
  out.push(L(k.onTop([along(deg, STALL.r0), along(deg, STALL.r1)], STALL.h, P), { tone: "faint" }));
  // Door: a thin panel standing just proud of the inner face
  out.push(S(k.extrude(wedge(deg, STALL.r0 - 0.8, STALL.r0, HALF - 1.6), 0, STALL.door, P), { tone: "mid", crease: "lo" }));
  // Lamp over the door, on the roof's inner edge
  const [lx, ly] = along(deg, STALL.r0 + 2.4);
  out.push(lamp(lx, ly, STALL.h, `lamp-stall-${i}`));
  return out.join("");
}

function smokestack(i) {
  const [x, y] = along(stallAngle(i), (STALL.r0 + STALL.r1) / 2 + 3);
  return [
    S(k.cylinder(x, y, 2.2, STALL.h, 7, P, 18, 0.3), { tone: "mid", inner: L(k.sideArc(x, y, 2.2, STALL.h + 4, P, 12), { tone: "faint" }) }),
    S(k.cylinder(x, y, 2.9, STALL.h + 7, 1.2, P, 18), { tone: "mid" }),
  ].join("");
}

function turntablePit() {
  const [x, y] = C;
  const ticks = k.radialTicks(x, y, DISC_R - 0.8, 64, 8, DISC_TOP, [1, 2.2], P);
  return [
    S(k.cylinder(x, y, PIT_R + 2.4, 0, 1, P, 72, 0.4), { tone: "lo" }),
    L(k.ring(x, y, PIT_R, 1, P, 72), { tone: "lo" }),
    S(k.cylinder(x, y, DISC_R, 0, DISC_TOP, P, 72, 0.6), { tone: "mid", inner: L(k.sideArc(x, y, DISC_R, 1.5, P, 40), { tone: "faint" }) }),
    L(ticks.minor, { tone: "lo" }),
    L(ticks.major, { tone: "mid" }),
    S(k.cylinder(x, y, 3.4, DISC_TOP, 1.4, P, 24), { tone: "mid" }),
  ].join("");
}

function board() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(BOARD, 2), 0, 4, P)}"/>`];
  // Two legs and a body: a station board at the yard entrance
  for (const x of [BOARD.x + 8, BOARD.x + BOARD.w - 12]) out.push(S(k.slabOf({ x, y: BOARD.y + 3, w: 4, d: 6, r: 0.6 }, 0, 8, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf(BOARD, 8, BOARD_TOP - 8, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(BOARD, BOARD_TOP - 4, P, 4), { tone: "faint" }) }));
  const cells = [];
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < CELLS; i++) {
      const tile = `<rect class="db-flap" x="${-CELL.w / 2}" y="${-CELL.h / 2}" width="${CELL.w}" height="${CELL.h}" rx="0.6"/>`;
      const glyph = (key) => `<text class="db-flap-text" data-k="${key}" x="0" y="${(CELL.font * 0.36).toFixed(2)}" font-size="${CELL.font}" text-anchor="middle"></text>`;
      cells.push(
        `<g data-cell="${row * CELLS + i}" transform="translate(${cellX(i).toFixed(2)} ${-ROW_Z[row]})">${tile}` +
          `<g clip-path="url(#nf-top)">${glyph("bt")}</g><g clip-path="url(#nf-bottom)">${glyph("bb")}</g>` +
          `<g clip-path="url(#nf-top)"><g data-k="f1" transform="scale(1 0)">${tile}${glyph("t1")}</g></g>` +
          `<g clip-path="url(#nf-bottom)"><g data-k="f2" transform="scale(1 0)">${tile}${glyph("t2")}</g></g>` +
          `<path class="db-flap-seam" d="M${-CELL.w / 2} 0H${CELL.w / 2}"/></g>`,
      );
    }
  }
  out.push(
    `<defs><clipPath id="nf-top"><rect x="${-CELL.w / 2}" y="${-CELL.h / 2}" width="${CELL.w}" height="${CELL.h / 2}"/></clipPath>` +
      `<clipPath id="nf-bottom"><rect x="${-CELL.w / 2}" y="0" width="${CELL.w}" height="${CELL.h / 2}"/></clipPath></defs>`,
  );
  out.push(recess(WIN, FACE_Y, cells.join("")));
  out.push(D([[BOARD.x + 3, BOARD_TOP - 2.6], [BOARD.x + BOARD.w - 3, BOARD_TOP - 2.6], [BOARD.x + 3, 10.6], [BOARD.x + BOARD.w - 3, 10.6]].map(([x, z]) => at([x, FACE_Y, z])), { size: 0.45 }));
  out.push(lamp(BOARD.x + BOARD.w - 8, BOARD.y + 6, BOARD_TOP, "lamp-board"));
  return out.join("");
}

function bin(front) {
  const t = 1.8;
  const walls = front
    ? [{ x: BIN.x, y: BIN.y + BIN.d - t, w: BIN.w, d: t }, { x: BIN.x + BIN.w - t, y: BIN.y, w: t, d: BIN.d }]
    : [{ x: BIN.x, y: BIN.y, w: BIN.w, d: t }, { x: BIN.x, y: BIN.y, w: t, d: BIN.d }];
  const out = front ? [] : [S(k.slabOf(BIN, 0, 1, P, 2), { tone: "lo", crease: "none" })];
  for (const wall of walls) out.push(S(k.slabOf({ ...wall, r: 0.4 }, 1, BIN_H, P, 2, 0.3), { tone: "mid" }));
  if (front) out.push(lamp(BIN.x + BIN.w - 4, BIN.y + BIN.d - 4, BIN_H + 1, "lamp-lost"));
  return out.join("");
}

function buffer(deg, r) {
  // A buffer stop at the end of a track
  const [x, y] = along(deg, r);
  return S(k.extrude(strip(deg, r - 1, r + 2, 11), 0, 6, P), { tone: "mid" }) + D([at([x, y, 6])], { size: 0.5 });
}

// ---- Assemble, back to front ----
const stalls = Array.from({ length: POSTS }, (_, i) => i).sort((a, b) => k.depthOf([...along(stallAngle(a), 52), 0], P) - k.depthOf([...along(stallAngle(b), 52), 0], P));

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: `A railway roundhouse for a lost request. ${POSTS} stalls, one per post on this site, stand in an arc round a turntable. A split-flap board at the yard entrance shows the requested path and 404. The turntable lines up with every stall in turn; each lamp flashes and each door stays shut, and the crate ends in the lost-and-found bin.`,
  body: [
    deck("HTTP 404"),
    ...Array.from({ length: POSTS }, (_, i) => track(stallAngle(i), PIT_R + 1, STALL.r0 - 0.8)),
    ...stalls.map((i) => stall(i)),
    ...[2, 6, 10, 13].filter((i) => i < POSTS).map((i) => smokestack(i)),
    track(LOST, PIT_R + 1, LOST_LEN),
    turntablePit(),
    `<g data-part="bridge"></g>`,
    bin(false),
    `<g data-part="cart"></g>`,
    `<g data-part="crate" transform="${k.translateAlong(P, [...along(ENTRY, ENTRY_LEN - 8), CART_TOP])}">${crateSvg(9, 7, 6, "hi", true)}</g>`,
    track(ENTRY, PIT_R + 1, ENTRY_LEN),
    buffer(ENTRY, ENTRY_LEN + 1),
    bin(true),
    board(),
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const C = ${JSON.stringify(C)}, DISC_TOP = ${DISC_TOP}, POSTS = ${POSTS}, CELLS = ${CELLS};
const STALLS = ${JSON.stringify(Array.from({ length: POSTS }, (_, i) => stallAngle(i)))}, LOST = ${LOST}, ENTRY = ${ENTRY};
const ENTRY_LEN = ${ENTRY_LEN}, LOST_LEN = ${LOST_LEN}, CART_TOP = ${CART_TOP}, BIN_C = ${JSON.stringify(BIN_C)}, BIN_FLOOR = 1;
const dir = (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
const along = (deg, r) => [C[0] + dir(deg)[0] * r, C[1] + dir(deg)[1] * r];

// The path this page was asked for, read from the page around the figure
const asked = (() => {
  try { if (parent !== window) return parent.location.pathname; } catch {}
  return "/no-such-page";
})();
const fit = (s) => (s.length > CELLS ? s.slice(0, CELLS - 1) + "…" : s).toUpperCase().padEnd(CELLS, " ");
const ROWS = fit(asked) + fit("404 NOT FOUND");

const START = ENTRY_LEN - 8;
const FIRST = STALLS[POSTS - 1], LAST = STALLS[0];
const SWEEP = [3.6, 3.6 + POSTS * 0.36];
const TT = { flip: 0.3, roll: [0.6, 2.4], toFirst: [2.6, 3.6], sweep: SWEEP, swing: [SWEEP[1] + 0.2, SWEEP[1] + 1.3], out: [SWEEP[1] + 1.5, SWEEP[1] + 2.6], drop: [SWEEP[1] + 2.7, SWEEP[1] + 3.1], reset: SWEEP[1] + 5.4 };
const CYCLE = TT.reset + 1.6;

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const bridge = part("bridge"), cart = part("cart"), crate = part("crate");
const stallLamps = STALLS.map((_, i) => part("lamp-stall-" + i));
const lamps = { board: part("lamp-board"), lost: part("lamp-lost") };
const cells = [...svg.querySelectorAll("[data-cell]")].map((g) => ({
  bt: g.querySelector('[data-k="bt"]'), bb: g.querySelector('[data-k="bb"]'),
  f1: g.querySelector('[data-k="f1"]'), t1: g.querySelector('[data-k="t1"]'),
  f2: g.querySelector('[data-k="f2"]'), t2: g.querySelector('[data-k="t2"]'),
}));
const setText = (node, text) => { if (node.textContent !== text) node.textContent = text; };
const setFlap = (node, s) => { const v = "scale(1 " + s.toFixed(3) + ")"; if (node.getAttribute("transform") !== v) node.setAttribute("transform", v); };

function drawBoard(t) {
  cells.forEach((cell, i) => {
    const local = (t - TT.flip - i * 0.03) / 0.45;
    const next = t < TT.reset ? ROWS[i] : " ";
    if (local >= 1 || local < 0) {
      const shown = local >= 1 ? next : " ";
      setText(cell.bt, shown); setText(cell.bb, shown); setFlap(cell.f1, 0); setFlap(cell.f2, 0);
      return;
    }
    setText(cell.bt, next); setText(cell.bb, " "); setText(cell.t1, " "); setText(cell.t2, next);
    setFlap(cell.f1, local < 0.5 ? Math.cos(local * Math.PI) : 0);
    setFlap(cell.f2, local >= 0.5 ? -Math.cos(local * Math.PI) : 0);
  });
}

// What turns is rebuilt from its floor outline each frame
const strip = (deg, cx, cy, half, w, off = 0) => {
  const [dx, dy] = dir(deg), [nx, ny] = [-dy, dx];
  const p = (r, s) => [cx + dx * r + nx * s, cy + dy * r + ny * s];
  return [p(-half, off - w / 2), p(half, off - w / 2), p(half, off + w / 2), p(-half, off + w / 2)];
};
const solid = (ring, z, h, style) => solidSvg(extrude(ring, z, h, P), style);

function bridgeSvg(deg) {
  const out = [solid(strip(deg, C[0], C[1], 22.5, 11), DISC_TOP, 1.2, { tone: "mid" })];
  for (const off of [-2.6, 2.6]) out.push(solid(strip(deg, C[0], C[1], 22.5, 1, off), DISC_TOP + 1.2, 1.4, { tone: "hi", crease: "lo" }));
  // The operator's cabin at one end of the bridge
  const [ex, ey] = along(deg + 180, 19);
  out.push(solid(strip(deg, ex, ey, 2.6, 6), DISC_TOP + 1.2, 6, { tone: "mid" }));
  return out.join("");
}

function cartSvg(x, y, deg) {
  return solid(strip(deg, x, y, 6, 8), DISC_TOP + 2.6, CART_TOP - DISC_TOP - 2.6, { tone: "mid", crease: "lo" });
}

function pose(t, fixed) {
  const lerp = (a, b, span) => a + (b - a) * ease(span[0], span[1], t);
  let a = ENTRY;
  if (t >= TT.toFirst[0]) a = lerp(ENTRY + 360, FIRST, TT.toFirst);
  if (t >= TT.sweep[0]) a = lerp(FIRST, LAST, TT.sweep);
  const end = fixed ? ENTRY + 360 : LOST + 360;
  if (t >= TT.swing[0]) a = lerp(LAST, end, TT.swing);
  if (t >= TT.reset) a = lerp(end, ENTRY + 360, [TT.reset, TT.reset + 1]);
  let r = START * (1 - ease(...TT.roll, t)), ra = ENTRY;
  if (t >= TT.toFirst[0]) { r = 0; ra = a; }
  if (t >= TT.out[0] && t < TT.reset) { ra = fixed ? ENTRY : LOST; r = (fixed ? START : LOST_LEN - 4) * ease(...TT.out, t); }
  if (t >= TT.reset) { ra = ENTRY; r = START * ease(TT.reset, TT.reset + 1.2, t); }
  const [cx, cy] = along(ra, r);
  return { a, cx, cy, ca: ra };
}

function phaseOf(t, fixed) {
  if (t >= TT.reset) return "resetting";
  if (t < TT.roll[1]) return "GET " + asked;
  if (t < TT.sweep[0]) return "404 · looking for a stall";
  if (t < TT.sweep[1]) {
    const n = Math.min(POSTS, 1 + Math.floor(((t - TT.sweep[0]) / (TT.sweep[1] - TT.sweep[0])) * POSTS));
    return "stall " + n + "/" + POSTS + " · no match";
  }
  if (fixed) return t < TT.out[1] ? "routing you home" : "→ /";
  return POSTS + " stalls · no match · lost & found";
}

let routed = false;
runFigure({
  cycle: CYCLE,
  scrubEnd: TT.reset - 0.2,
  steps: [0.2, TT.roll[1], (TT.sweep[0] + TT.sweep[1]) / 2, TT.sweep[1], TT.drop[1] + 0.3],
  label: (fixed) => (fixed ? "Routing you home…" : "Route me home"),
  phase: phaseOf,
  draw(t, fixed) {
    const p = pose(t, fixed);
    bridge.innerHTML = bridgeSvg(p.a);
    cart.innerHTML = cartSvg(p.cx, p.cy, p.ca);
    let crateAt = [p.cx, p.cy, CART_TOP];
    if (!fixed && t >= TT.drop[0] && t < TT.reset) {
      const u = ease(...TT.drop, t);
      crateAt = [p.cx + (BIN_C[0] - p.cx) * u, p.cy + (BIN_C[1] - p.cy) * u, CART_TOP + (BIN_FLOOR - CART_TOP) * u + Math.sin(Math.PI * u) * 6];
    }
    crate.setAttribute("transform", translateAlong(P, crateAt));
    // Each stall lamp flashes as the bridge lines up with it
    stallLamps.forEach((l, i) => {
      const on = t >= TT.sweep[0] - 0.1 && t <= TT.sweep[1] + 0.2 ? Math.max(0, 1 - Math.abs(((p.a - STALLS[i]) % 360 + 540) % 360 - 180) / 4.5) : 0;
      l.style.opacity = on.toFixed(3);
    });
    lamps.board.style.opacity = (t > TT.flip && t < TT.reset && Math.floor(t * 2) % 2 === 0 ? 1 : 0).toString();
    lamps.lost.style.opacity = (!fixed && t >= TT.drop[1] && t < TT.reset ? 1 : 0).toString();
    drawBoard(t);
    // Only a reader's own press of "Route me home" leaves the page, never the idle tour
    if (fixed && routed && t >= TT.out[1]) { routed = false; (parent === window ? window : parent).location.href = "/"; }
  },
});
document.querySelector("[data-fix]").addEventListener("click", () => {
  routed = document.querySelector("[data-fix]").getAttribute("aria-pressed") === "true";
});
`;

writeFigure("404", {
  fig: "Fig 404",
  title: "Roundhouse",
  readout: "GET /no-such-page",
  keys: [
    { mark: "lit", label: "Your request" },
    { mark: "raised", label: `${POSTS} stalls, one per post on this site` },
  ],
  caption: `Every stall in this roundhouse is a post on the site. Your path matched none of the ${POSTS}, so the request went to lost and found. Route me home rolls it back out the way it came and takes you to the home page.`,
  svg,
  stageLabel: "404 roundhouse. Arrow keys step through the run; Space routes you home.",
  live,
  css:
    DOCKBAY_CSS +
    `.db-flap{fill:var(--db-flap)}.db-flap-text{fill:var(--db-flap-text);font-family:var(--anatomy-mono);font-weight:600}.db-flap-seam{stroke:var(--db-well);stroke-width:.3}`,
});
