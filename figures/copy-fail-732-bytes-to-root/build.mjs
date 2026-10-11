// Fig: Copy Fail (CVE-2026-31431). splice() hands AF_ALG the page cache's own pages of /usr/bin/su by reference.
// Since 2017 (commit 72548b093ee3) algif_aead runs in place, src = dst, so authencesn's 4-byte scratch write
// past the tag lands on the cached page. The file on disk is never touched. The fix (a664bf3d603d) goes back
// to out of place: the scratch write lands in the caller's own buffer.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, planeOf, flat, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- World layout ----
const RACK = { x: -64, y: -62, w: 128, d: 22, r: 2 };
const RACK_H = 6;
const PAGE = { w: 16, d: 1.6, z0: RACK_H, z1: 36 };
const PAGES = 5;
const TARGET = 3;
const pageX = (i) => RACK.x + 10 + i * 24;
const PAGE_Y = RACK.y + 8;
const PAGE_FACE = PAGE_Y + PAGE.d;
const TX = pageX(TARGET) + PAGE.w / 2;
const VAULT = { x: -128, y: -64, w: 46, d: 30, r: 2 };
const VAULT_TOP = 32;
const BENCH = { x: TX - 34, y: 4, w: 60, d: 30, r: 2 };
const BENCH_TOP = 12;
const RAIL = { x: TX - 2, y: PAGE_FACE + 2, w: 4, d: BENCH.y + 10 - PAGE_FACE - 2, r: 0.8 };
const RAIL_Z = 16;
const TRAY = { x: TX - 9, y: -14, w: 18, d: 10, r: 1 };
// The carriage is built around y = 0 with its stylus reaching 9 toward the rack
const STYLUS = 9;
const CARRIAGE = { home: BENCH.y + 6, page: PAGE_FACE + STYLUS, tray: TRAY.y + TRAY.d / 2 + STYLUS - 2 };
const STOP_Y = CARRIAGE.tray - 5;
const STAMP_Z = 22;
const PROBE = { rest: PAGE.z1 + 12, read: PAGE.z1 + 2 };

// ---- Parts ----
function vault() {
  const face = VAULT.y + VAULT.d;
  const out = [S(k.slabOf(VAULT, 0, VAULT_TOP, P, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(VAULT, 3, P, 4), { tone: "faint" }) })];
  out.push(`<g transform="${planeOf(face)}"><path class="iso-line" data-tone="lo" d="${flat(VAULT.x + 6, 5, VAULT.x + VAULT.w - 6, VAULT_TOP - 5, 2)}"/></g>`);
  out.push(L(k.sideRing([VAULT.x + VAULT.w / 2, face, VAULT_TOP / 2], 6.5, "y", P) + k.sideRing([VAULT.x + VAULT.w / 2, face, VAULT_TOP / 2], 1.6, "y", P), { tone: "mid" }));
  // Spokes of the handwheel, rim to hub
  const spokes = [0, 1, 2].map((n) => {
    const a = (n / 3) * Math.PI * 2 + 0.4;
    const c = [VAULT.x + VAULT.w / 2, face, VAULT_TOP / 2];
    return k.segment([c[0] + Math.cos(a) * 1.6, face, c[2] + Math.sin(a) * 1.6], [c[0] + Math.cos(a) * 6.5, face, c[2] + Math.sin(a) * 6.5], P);
  });
  out.push(L(spokes.join(""), { tone: "mid" }));
  // The seal wire across the door: it is never cut
  out.push(k.wireSvg(at([VAULT.x + 8, face, VAULT_TOP - 9]), at([VAULT.x + VAULT.w - 8, face, VAULT_TOP - 9]), { tone: "hi", size: 0.8 }));
  out.push(lamp(VAULT.x + 8, VAULT.y + 8, VAULT_TOP, "lamp-vault"));
  // The pages were read in from disk once: a cable from the vault to the rack
  out.push(k.wireSvg(at([VAULT.x + VAULT.w, VAULT.y + 10, 4]), at([RACK.x, VAULT.y + 10, 3]), { via: [at([VAULT.x + VAULT.w + 4, VAULT.y + 10, 0.2]), at([RACK.x - 4, VAULT.y + 10, 0.2])], tone: "mid" }));
  return out.join("");
}

function rack() {
  const out = [S(k.slabOf(RACK, 0, RACK_H, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(RACK, 2, P, 3), { tone: "faint" }) })];
  for (const x of [RACK.x + 2, RACK.x + RACK.w - 6]) out.push(S(k.slabOf({ x, y: RACK.y + 4, w: 4, d: 4, r: 0.6 }, RACK_H, PAGE.z1 + 6 - RACK_H, P, 2, 0.3), { tone: "mid" }));
  for (let i = 0; i < PAGES; i++) {
    const x = pageX(i);
    out.push(L(k.planOutline({ x: x - 1, y: PAGE_Y - 1, w: PAGE.w + 2, d: PAGE.d + 2, r: 0.4 }, RACK_H, P, 2), { tone: "lo" }));
    out.push(S(k.slabOf({ x, y: PAGE_Y, w: PAGE.w, d: PAGE.d, r: 0.3 }, PAGE.z0, PAGE.z1 - PAGE.z0, P, 2), { tone: i === TARGET ? "hi" : "mid", crease: "lo" }));
    // Byte rows printed on each page's face
    const rows = [];
    for (let z = PAGE.z1 - 4; z > PAGE.z0 + 3; z -= 3.2) rows.push(`M${x + 2} ${-z}H${x + 2 + 6 + ((i * 3 + Math.round(z)) % 7)}`);
    out.push(`<g transform="${planeOf(PAGE_FACE)}"><path class="iso-line" data-tone="lo" data-free="" d="${rows.join("")}"/></g>`);
  }
  out.push(S(k.slabOf({ x: RACK.x + 2, y: RACK.y + 4, w: RACK.w - 4, d: 4, r: 0.6 }, PAGE.z1 + 6, 3, P, 2, 0.4), { tone: "mid" }));
  out.push(lamp(RACK.x + RACK.w - 12, RACK.y + 6, PAGE.z1 + 9, "lamp-root"));
  return out.join("");
}

// Four bytes: four small blocks stamped in a row, on the page face or in the tray
const bytesOnPage = () =>
  `<g transform="${planeOf(PAGE_FACE + 0.05)}">` +
  [0, 1, 2, 3].map((n) => `<rect class="cf-byte" x="${TX - 4.6 + n * 2.4}" y="${-(STAMP_Z + 1)}" width="1.8" height="2.2"/>`).join("") +
  `</g>`;
const bytesInTray = () =>
  [0, 1, 2, 3].map((n) => S(k.slabOf({ x: TX - 4.6 + n * 2.4, y: TRAY.y + TRAY.d / 2 - 1.1, w: 1.8, d: 2.2, r: 0.2 }, BENCH_TOP + 1.4, 0.4, P, 1), { tone: "hi", crease: "none", lit: true })).join("");

function bench() {
  const out = [S(k.slabOf(BENCH, 0, BENCH_TOP, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(BENCH, 4, P, 4), { tone: "faint" }) })];
  // The AEAD housing with its key slot
  const box = { x: BENCH.x + 4, y: BENCH.y + 8, w: 22, d: 16, r: 1.5 };
  out.push(S(k.slabOf(box, BENCH_TOP, 12, P, 3, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline({ x: box.x + 4, y: box.y + 6, w: 14, d: 2.4, r: 0.8 }, BENCH_TOP + 12, P, 2), { tone: "lo" }));
  out.push(D(k.corners(box, 2.2).map(([x, y]) => at([x, y, BENCH_TOP + 12])), { size: 0.42 }));
  out.push(lamp(BENCH.x + BENCH.w - 8, BENCH.y + BENCH.d - 8, BENCH_TOP, "lamp-alg"));
  return out.join("");
}

function rail() {
  const out = [];
  for (const y of [RAIL.y + 4, RAIL.y + RAIL.d - 14]) out.push(S(k.cylinder(TX, y, 1.4, 0, RAIL_Z, P, 12), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf(RAIL, RAIL_Z, 2, P, 2, 0.3), { tone: "mid" }));
  // Tag boundary: a ruler strip along the rail, major tick at the boundary
  const strip = { x: RAIL.x + RAIL.w, y: RAIL.y, w: 3, d: RAIL.d, r: 0.4 };
  out.push(S(k.slabOf(strip, RAIL_Z, 0.5, P, 2), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.y + 1, strip.y + strip.d - 1, 4, 5, strip.x + 0.3, RAIL_Z + 0.5, [1.2, 2.2], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

function outOfPlace() {
  // The fix: a separate destination buffer under the rail, with a stop at its far edge
  return [
    S(k.cylinder(TX - 10, TRAY.y + TRAY.d / 2, 1.2, 0, BENCH_TOP, P, 12), { tone: "mid", crease: "none" }),
    S(k.cylinder(TX + 10, TRAY.y + TRAY.d / 2, 1.2, 0, BENCH_TOP, P, 12), { tone: "mid", crease: "none" }),
    S(k.slabOf(TRAY, BENCH_TOP, 1.4, P, 3, 0.4), { tone: "hi", crease: "lo" }),
    L(k.planOutline(k.insetPlan(TRAY, 1.4), BENCH_TOP + 1.4, P, 3), { tone: "lo" }),
    S(k.slabOf({ x: RAIL.x - 1, y: STOP_Y - 3, w: RAIL.w + 2, d: 3, r: 0.5 }, RAIL_Z + 2, 2.6, P, 2, 0.3), { tone: "hi", crease: "lo" }),
  ].join("");
}

const carriage = () =>
  [
    S(k.slabOf({ x: TX - 4, y: -5, w: 8, d: 10, r: 1 }, RAIL_Z + 2, 4, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf({ x: TX - 0.8, y: -STYLUS, w: 1.6, d: STYLUS - 5, r: 0.4 }, STAMP_Z - 0.6, 1.2, P, 2), { tone: "hi", crease: "lo", lit: true }),
  ].join("");

const probe = () =>
  [
    S(k.cylinder(TX, PAGE_Y + 0.8, 0.9, 2, 8, P, 10), { tone: "mid", crease: "none" }),
    S(k.cylinder(TX, PAGE_Y + 0.8, 2, 0, 2, P, 16), { tone: "hi", crease: "lo" }),
  ].join("");

// splice(): a reference cable clipped from the target page's foot to the bench
const spliceCable = () => k.wireSvg(at([TX + 6, PAGE_FACE, PAGE.z0 + 2]), at([BENCH.x + 14, BENCH.y, 4]), { via: [at([TX + 6, PAGE_FACE + 4, 0.2]), at([BENCH.x + 14, BENCH.y - 4, 0.2])], tone: "hi" });

// ---- Assemble ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A page-cache rack holds the cached pages of /usr/bin/su beside a sealed disk vault. A crypto bench in front is cabled to one page by splice, and a stylus on a rail runs from the bench toward the rack. With src equal to dst, the stylus stamps four bytes onto the cached page; the vault stays sealed.",
  body: [
    deck("CVE-2026-31431"),
    vault(),
    rack(),
    `<g data-part="bytes-page" style="opacity:0">${bytesOnPage()}</g>`,
    `<g data-part="probe" transform="${k.translateAlong(P, [0, 0, PROBE.rest])}">${probe()}</g>`,
    `<g data-part="splice" style="opacity:0">${spliceCable()}</g>`,
    bench(),
    `<g data-part="fix" style="opacity:0">${outOfPlace()}<g data-part="bytes-tray" style="opacity:0">${bytesInTray()}</g></g>`,
    rail(),
    `<g data-part="carriage" transform="${k.translateAlong(P, [0, CARRIAGE.home, 0])}">${carriage()}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const CARRIAGE = ${JSON.stringify(CARRIAGE)}, PROBE = ${JSON.stringify(PROBE)}, STOP_Y = ${STOP_Y};
const T = { alg: [0.2, 0.5], splice: [0.8, 1.4], out: [1.8, 3.4], stamp: [3.45, 3.65, 3.9], back: [4.0, 5.0], exec: [5.3, 5.7, 6.4], reset: 8.4, cycle: 10 };

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const carriage = part("carriage"), probe = part("probe"), splice = part("splice"), fix = part("fix");
const bytes = { page: part("bytes-page"), tray: part("bytes-tray") };
const lamps = { alg: part("lamp-alg"), root: part("lamp-root") };

function phaseOf(t, fixed) {
  if (t >= T.reset) return "resetting";
  if (t < T.splice[0]) return "socket(AF_ALG) · authencesn";
  if (t < T.out[0]) return "splice /usr/bin/su · by reference";
  if (t < T.stamp[0]) return fixed ? "out of place · dst = your buffer" : "in place · src = dst";
  if (t < T.exec[0]) return fixed ? "4 bytes past the tag · your buffer" : "4 bytes past the tag · cached page";
  return fixed ? "execve su · unchanged" : "execve su · root · disk untouched";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 8.2,
  steps: [0.2, T.splice[1], T.out[1], T.stamp[2], T.exec[2] + 0.3],
  label: (fixed) => (fixed ? "Fixed: out-of-place again" : "Apply the fix: separate dst"),
  phase: phaseOf,
  draw(t, fixed) {
    const back = 1 - ease(T.reset, T.reset + 0.6, t);
    lamps.alg.style.opacity = (ease(...T.alg, t) * back).toFixed(3);
    splice.style.opacity = (ease(...T.splice, t) * back).toFixed(3);
    fix.style.opacity = fixed ? "1" : "0";
    const target = fixed ? CARRIAGE.tray : CARRIAGE.page;
    const y = CARRIAGE.home + (target - CARRIAGE.home) * ease(...T.out, t) * (1 - ease(...T.back, t));
    // The stylus dips to strike: a small nod down and back
    const strike = ease(T.stamp[0], T.stamp[1], t) * (1 - ease(T.stamp[1], T.stamp[2], t));
    carriage.setAttribute("transform", translateAlong(P, [0, y, -0.8 * strike]));
    const marked = ease(T.stamp[1] - 0.02, T.stamp[1] + 0.08, t) * back;
    bytes.page.style.opacity = (fixed ? 0 : marked).toFixed(3);
    bytes.tray.style.opacity = (fixed ? marked : 0).toFixed(3);
    const read = ease(T.exec[0], T.exec[1], t) * (1 - ease(T.exec[1] + 0.2, T.exec[2], t));
    probe.setAttribute("transform", translateAlong(P, [0, 0, PROBE.rest + (PROBE.read - PROBE.rest) * read]));
    lamps.root.style.opacity = (fixed ? 0 : ease(T.exec[1], T.exec[1] + 0.15, t) * back).toFixed(3);
  },
});
`;

writeFigure("copy-fail-732-bytes-to-root", {
  fig: "Fig 1",
  title: "Copy Fail",
  readout: "socket(AF_ALG) · authencesn",
  keys: [
    { mark: "lit", label: "authencesn scratch stylus: writes 4 bytes past the tag" },
    { mark: "raised", label: "Page cache: the pages every read, mmap and execve of su share" },
  ],
  caption:
    "splice() passes the page cache's own pages of /usr/bin/su to the AF_ALG socket by reference. Since 2017 algif_aead runs in place (src = dst), so authencesn's scratch write past the tag lands on that cached page, at an offset and value the caller picks. The file on disk is never written. The fix goes back to out of place, so the scratch write lands in the caller's buffer.",
  svg,
  stageLabel: "Copy Fail page cache bench. Arrow keys step through the run; Space applies or removes the fix.",
  live,
  css: DOCKBAY_CSS + `.cf-byte{fill:var(--anatomy-lit)}`,
});
