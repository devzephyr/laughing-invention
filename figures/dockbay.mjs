// The dock bay family: one deck, one camera, one set of recurring parts for every figure.
import * as k from "./anatomy/kit/iso-kit.mjs";

export { k };

export const WIDTH = 600;
export const HEIGHT = 360;

export const DECK = { x: -140, y: -70, w: 280, d: 140, r: 8 };
const DECK_H = 12;
const FOOT_H = 5;
// Tallest thing any figure may stand; fixing it fixes the camera, so every figure shares one scale
const HEADROOM_Z = 64;

export const P = k.fitProjection(
  [...k.boxCorners(DECK, -DECK_H - FOOT_H, 0), ...k.corners(DECK, 0).map(([x, y]) => [x, y, HEADROOM_Z])],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: 45 },
);

export const at = (point) => k.iso(point, P);
export const S = (paths, style) => k.solidSvg(paths, style);
export const L = (d, style) => k.lineSvg(d, style);
export const D = (points, style) => k.dotsSvg(points, style);
export const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

// Hazard edge along the front of the deck: black-and-white chevrons, the family's signature
const HAZARD = { x: -126, y: DECK.y + DECK.d - 13, w: 252, d: 7, r: 1 };
const LABEL = { x: -126, y: DECK.y + 8, w: 40, d: 10, r: 1.2 };

let clipCount = 0;
const clipId = (name) => `db-${name}-${clipCount++}`;

function hazard() {
  const out = [S(k.slabOf(HAZARD, 0, 0.6, P, 3), { tone: "lo", crease: "none" })];
  const id = clipId("hazard");
  const top = k.onTop(k.ringOf(HAZARD, 3), 0.6, P, true);
  const stripes = [];
  // Parallelograms leaning by the strip's depth; the clip trims them to the strip's own edge
  for (let x = HAZARD.x - HAZARD.d; x < HAZARD.x + HAZARD.w; x += 8) {
    stripes.push(k.onTop([[x, HAZARD.y + HAZARD.d], [x + 4, HAZARD.y + HAZARD.d], [x + 4 + HAZARD.d, HAZARD.y], [x + HAZARD.d, HAZARD.y]], 0.6, P, true));
  }
  out.push(`<clipPath id="${id}"><path d="${top}"/></clipPath><path class="db-hazard" clip-path="url(#${id})" d="${stripes.join("")}"/>`);
  return out.join("");
}

/** The deck plate on feet, with groove, corner bolts, hazard edge and the engraved advisory plate. */
export function deck(advisory) {
  const out = [`<path class="iso-halo" d="${k.haloOf(DECK, -DECK_H - FOOT_H, DECK_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(DECK, 22))) {
    out.push(S(k.cylinder(x, y, 7, -DECK_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -DECK_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(DECK, -DECK_H, DECK_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(DECK, -DECK_H / 2, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(DECK, 5), 0, P), { tone: "lo" }));
  const bolts = k.corners(DECK, 10);
  out.push(L(bolts.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(bolts.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  out.push(hazard());
  out.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(LABEL, 1.4), 0.8, P, 3), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([LABEL.x + 4, LABEL.y + 6.4], 0.8, P, "x"), advisory, { size: 3.2, tone: "mid" }));
  out.push(D([at([LABEL.x + LABEL.w - 2.6, LABEL.y + 2.4, 0.8]), at([LABEL.x + LABEL.w - 2.6, LABEL.y + LABEL.d - 2.4, 0.8])], { size: 0.42 }));
  return out.join("");
}

/**
 * A status lamp: base ring, housing and a dome that the live code switches with data-on on `part`.
 * The off dome is always drawn; the on dome sits on top and fades in.
 */
export function lamp(x, y, z, part) {
  return [
    S(k.cylinder(x, y, 4.2, z, 1.4, P, 24), { tone: "mid" }),
    S(k.cylinder(x, y, 3.2, z + 1.4, 3, P, 24), { tone: "mid" }),
    L(k.sideArc(x, y, 3.2, z + 3, P, 16), { tone: "faint" }),
    S(k.cylinder(x, y, 2.4, z + 4.4, 2.4, P, 24), { tone: "lo" }),
    `<g class="db-lamp-on" data-part="${part}" style="opacity:0">${S(k.cylinder(x, y, 2.4, z + 4.4, 2.4, P, 24), { tone: "hi", crease: "none" })}</g>`,
  ].join("");
}

/** Maps a group's local (x, -z) onto the vertical face at y that looks toward +y. */
export const planeOf = (y) => k.sideMatrix([0, y], 0, P, "left");
export const flat = (x0, z0, x1, z1, r, steps = 6) =>
  k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);

/**
 * A window recessed `depth` into the +y face at `y`, with its inner walls shaded by facing.
 * `back` is drawn on the window's back plane, in that plane's local (x, -z) coordinates.
 * Adapted from the kit's desk-computer example.
 */
export function recess({ x0, x1, z0, z1, r, depth }, y, back = "", backClass = "db-well") {
  const id = clipId("recess");
  const ring = k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 6);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const { sinA } = k.cameraOf(P);
  const tops = [];
  const sides = [[], [], [], []];
  ring.forEach(([ax, az], index) => {
    const [bx, bz] = ring[(index + 1) % ring.length];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    let [nx, nz] = [(bz - az) / length, -(bx - ax) / length];
    if (nx * (cx - (ax + bx) / 2) + nz * (cz - (az + bz) / 2) < 0) [nx, nz] = [-nx, -nz];
    if (nx <= 0 && nz <= 0) return;
    const quad = k.pathOf([at([ax, y, az]), at([bx, y, bz]), at([bx, y - depth, bz]), at([ax, y - depth, az])], true);
    if (nz >= nx) tops.push(quad);
    else sides[Math.min(3, Math.max(0, Math.floor(((nx * -sinA + 1) / 2) * 4)))].push(quad);
  });
  const shape = flat(x0, z0, x1, z1, r);
  return [
    `<clipPath id="${id}"><path transform="${planeOf(y)}" d="${shape}"/></clipPath>`,
    `<g clip-path="url(#${id})">`,
    `<path class="iso-top" d="${tops.join("")}"/>`,
    ...sides.map((d, shade) => (d.length ? `<path class="iso-shade" data-shade="${shade}" d="${d.join("")}"/>` : "")),
    `<g transform="${planeOf(y - depth)}"><path class="${backClass}" d="${shape}"/>${back}<path class="iso-line" data-tone="faint" d="${shape}"/></g>`,
    `</g>`,
    `<g transform="${planeOf(y)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
  ].join("");
}

// Every colour is a token with a light value and a dark override
export const DOCKBAY_CSS = `
.iso{--db-hazard:#3a3a3e;--db-well:#e9e9e6;--db-flap:#2a2a2e;--db-flap-text:#f4f4f1}
.iso[data-theme="dark"]{--db-hazard:#4a4a4a;--db-well:#0e0e0e;--db-flap:#0b0b0b;--db-flap-text:#d8d8d8}
.db-hazard{fill:var(--db-hazard);stroke:none}
.db-well{fill:var(--db-well);stroke:none}
.db-lamp-on .iso-top,.db-lamp-on .iso-shade,.db-lamp-on .iso-fill{fill:var(--anatomy-hi)}
`;
