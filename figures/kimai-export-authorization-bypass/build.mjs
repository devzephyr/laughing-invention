// Fig: Kimai guarded the report and forgot the export (GHSA-pvc4-crg3-gj44, CVE-2026-80194, fixed in 2.64.0).
// One bulkhead, two hatches into the same hold (getData()). The report hatch carries both IsGranted
// bolts; the export hatch carries none. The fix moves the guards to the class: one bar over both.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, recess, planeOf, flat, railSvg, cartSvg, crateSvg, CART_TOP, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- World layout ----
const WALL = { x: -112, y: -44, w: 212, d: 16, r: 2 };
const WALL_TOP = 54;
const FACE_Y = WALL.y + WALL.d;
const DOOR_D = 1.6;
const REPORT = { x0: -92, x1: -44, z0: 6, z1: 44, r: 2, depth: 10 };
const EXPORT = { x0: 14, x1: 52, z0: 6, z1: 40, r: 2, depth: 10 };
const RAIL_Y = 4;
const STOPS = { start: -95, report: -68, export: 33 };
const BAR = { x: -100, y: FACE_Y, w: 166, d: 3.4, r: 1 };
const BAR_Z = 47;

// ---- Parts ----
function hold() {
  // The same cargo, seen through either hatch: both routes call getData()
  const crates = [];
  for (const [x, z, w, h] of [[-15, 0, 14, 11], [1, 0, 14, 11], [-8, 11, 14, 11]]) {
    crates.push(`<rect class="kx-crate" x="${x}" y="${-(z + h)}" width="${w}" height="${h}" rx="0.6"/>`);
    crates.push(`<path class="iso-line" data-tone="lo" d="M${x} ${-(z + h - 2.4)}H${x + w}M${x} ${-(z + 2.4)}H${x + w}"/>`);
  }
  return crates.join("");
}

function wall() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(WALL, 2), 0, 6, P)}"/>`];
  out.push(S(k.slabOf(WALL, 0, WALL_TOP, P, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(WALL, 3, P, 4) + k.sideSeam(WALL, WALL_TOP - 6, P, 4), { tone: "faint" }) }));
  for (const opening of [REPORT, EXPORT]) {
    const cx = (opening.x0 + opening.x1) / 2;
    out.push(recess(opening, FACE_Y, `<g transform="translate(${cx} ${-opening.z0})">${hold()}</g>`));
  }
  // Stiffener ribs standing proud of the face, between and beside the hatches
  for (const x of [WALL.x + 6, -20, 4]) {
    out.push(S(k.slabOf({ x, y: FACE_Y, w: 4, d: 2.2, r: 0.5 }, 0, WALL_TOP - 6, P, 2, 0.3), { tone: "mid", crease: "none" }));
  }
  // Tread plate where cargo leaves the export hatch
  const tread = { x: EXPORT.x0 - 2, y: FACE_Y + 2, w: EXPORT.x1 - EXPORT.x0 + 4, d: 9, r: 0.8 };
  out.push(S(k.slabOf(tread, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(Array.from({ length: 9 }, (_, i) => k.lineOnTop([tread.x + 2 + i * 4.6, tread.y], [tread.x + 2 + i * 4.6 + 2.4, tread.y + tread.d], 0.8, P)).join(""), { tone: "faint" }));
  // Rivet rows along the top edge of the face, edge to edge
  out.push(D(Array.from({ length: 21 }, (_, i) => at([WALL.x + 6 + i * 10, FACE_Y, WALL_TOP - 3])), { size: 0.4 }));
  // The export frame's bolt mounts: two empty screw pairs where a guard would sit
  out.push(D([18, 30].flatMap((z) => [at([EXPORT.x1 + 4, FACE_Y, z]), at([EXPORT.x1 + 4, FACE_Y, z + 4])]), { size: 0.45, tone: "lo" }));
  return out.join("");
}

function door(opening, lit) {
  const plan = { x: opening.x0 - 2, y: FACE_Y, w: opening.x1 - opening.x0 + 4, d: DOOR_D, r: 0.6 };
  const z0 = opening.z0 - 2;
  const z1 = opening.z1 + 2;
  const face = FACE_Y + DOOR_D;
  const out = [S(k.slabOf(plan, z0, z1 - z0, P, 2, 0.4), { tone: lit ? "hi" : "mid", crease: "lo", lit })];
  // Panel seams run edge to edge across the door face
  const seams = [z0 + (z1 - z0) / 3, z0 + (2 * (z1 - z0)) / 3].map((z) => k.segment([plan.x, face, z], [plan.x + plan.w, face, z], P)).join("");
  out.push(L(seams, { tone: "lo" }));
  // Pull handle: two standoffs and a bar
  const hx = opening === REPORT ? plan.x + plan.w - 7 : plan.x + 5;
  for (const z of [z0 + 12, z0 + 22]) out.push(S(k.slabOf({ x: hx - 0.8, y: face, w: 1.6, d: 2.4, r: 0.4 }, z, 1.6, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: hx - 1, y: face + 2.4, w: 2, d: 1.4, r: 0.5 }, z0 + 11, 13.6, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}

function reportGuards() {
  // Two IsGranted bolts on the report frame, thrown into the door
  const out = [];
  const x = REPORT.x1 + 2;
  for (const z of [16, 32]) {
    out.push(S(k.slabOf({ x: x + 1, y: FACE_Y, w: 7, d: 4, r: 0.8 }, z, 5, P, 2, 0.4), { tone: "mid" }));
    out.push(S(k.slabOf({ x: x - 4, y: FACE_Y + DOOR_D, w: 6, d: 2.2, r: 0.6 }, z + 1.4, 2.2, P, 2), { tone: "hi", crease: "lo" }));
    out.push(D([at([x + 6, FACE_Y + 4, z + 5])], { size: 0.4 }));
  }
  // Keycard interlock with its lamp
  const box = { x: REPORT.x1 + 12, y: FACE_Y, w: 12, d: 6, r: 1 };
  out.push(S(k.slabOf(box, 18, 14, P, 3, 0.6), { tone: "mid" }));
  out.push(`<g transform="${planeOf(FACE_Y + box.d)}"><path class="iso-line" data-tone="lo" d="${flat(box.x + 3, 22, box.x + box.w - 3, 23.4, 0.6, 3)}"/></g>`);
  out.push(lamp(box.x + box.w / 2, FACE_Y + box.d / 2, 32, "lamp-report"));
  return out.join("");
}

function classBar() {
  // The fix: guards on the class, so one bar drops a pin into every door
  const out = [S(k.slabOf(BAR, BAR_Z, 3.6, P, 2, 0.5), { tone: "mid" })];
  for (const x of [BAR.x + 4, BAR.x + BAR.w - 4]) out.push(S(k.slabOf({ x: x - 3, y: FACE_Y, w: 6, d: 5, r: 0.8 }, BAR_Z - 2, 7.6, P, 2, 0.4), { tone: "mid" }));
  for (const [x, top] of [[STOPS.report, REPORT.z1 + 2], [STOPS.export, EXPORT.z1 + 2]]) {
    out.push(S(k.cylinder(x, FACE_Y + DOOR_D + 1.4, 1.4, top - 1, BAR_Z - top + 1, P, 14), { tone: "hi", crease: "none" }));
  }
  out.push(lamp(BAR.x + BAR.w - 4, FACE_Y + 2.5, BAR_Z + 5.6, "lamp-class"));
  return out.join("");
}

const badge = () => {
  const card = { x: -6, y: RAIL_Y + 5, w: 12, d: 5, r: 0.5 };
  return [
    S(k.slabOf({ x: -7.5, y: RAIL_Y + 3.6, w: 15, d: 7.8, r: 0.8 }, CART_TOP, 1.2, P, 2), { tone: "mid", crease: "none" }),
    S(k.slabOf(card, CART_TOP + 1.2, 0.6, P, 2), { tone: "hi", crease: "lo" }),
    k.faceTextSvg(k.topMatrix([0, RAIL_Y + 8.4], CART_TOP + 1.8, P, "x"), "ROLE_USER", { size: 2.2, tone: "hi", anchor: "middle" }),
  ].join("");
};

// ---- Assemble ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A bulkhead with two hatches opening into the same cargo hold. The left hatch, the report, has two bolts and a keycard interlock. The right hatch, the export, has no bolts. A cart carrying a ROLE_USER badge is refused at the report hatch, then rolls to the export hatch, which slides open and hands it a crate.",
  body: [
    deck("GHSA-PVC4"),
    wall(),
    `<g data-part="door-report">${door(REPORT, false)}</g>`,
    `<g data-part="door-export">${door(EXPORT, true)}</g>`,
    reportGuards(),
    `<g data-part="bar" style="opacity:0">${classBar()}</g>`,
    railSvg(-110, 50, RAIL_Y),
    `<g data-part="cart" transform="${k.translateAlong(P, [STOPS.start, 0, 0])}">${cartSvg(RAIL_Y, badge())}</g>`,
    `<g data-part="crate" style="opacity:0">${crateSvg(14, 10, 8)}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const STOPS = ${JSON.stringify(STOPS)};
const EXPORT_W = ${EXPORT.x1 - EXPORT.x0 + 6};
const CRATE_FROM = [${STOPS.export}, ${FACE_Y + 6}, ${EXPORT.z0}], CRATE_TO = [${STOPS.export}, ${RAIL_Y - 6}, ${CART_TOP}];
const T = { toReport: [0.3, 1.4], tryReport: [1.6, 2.6], toExport: [2.8, 4.0], tryExport: [4.2, 5.0], crate: [5.0, 6.0], reset: 8.4, home: [8.6, 9.8], cycle: 10 };

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const cart = part("cart"), crate = part("crate"), bar = part("bar");
const doors = { report: part("door-report"), export: part("door-export") };
const lamps = { report: part("lamp-report"), cls: part("lamp-class") };

// A refused door rattles against its bolt and settles; it never opens
const rattle = (t, [a, b]) => (t > a && t < b ? 0.7 * Math.sin((t - a) * 2 * Math.PI * 9) * (1 - ease(a, b, t)) : 0);

function phaseOf(t, fixed) {
  if (t < T.tryReport[0]) return "ROLE_USER · logged in";
  if (t < T.tryExport[0]) return "GET /reporting/project_view · 403";
  if (t >= T.reset) return "resetting";
  if (fixed) return "GET …/project_view/export · 403";
  return t < T.crate[1] ? "GET …/project_view/export · 200" : "export · 200 · every customer's projects";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 8.2,
  steps: [0.2, T.tryReport[1], T.toExport[1], T.tryExport[1], T.crate[1] + 0.4],
  label: (fixed) => (fixed ? "Fixed: guards on the class" : "Apply the fix: guard the class"),
  phase: phaseOf,
  draw(t, fixed) {
    const back = 1 - ease(T.reset, T.reset + 0.6, t);
    const x = t < T.home[0]
      ? STOPS.start + (STOPS.report - STOPS.start) * ease(...T.toReport, t) + (STOPS.export - STOPS.report) * ease(...T.toExport, t)
      : STOPS.export + (STOPS.start - STOPS.export) * ease(...T.home, t);
    cart.setAttribute("transform", translateAlong(P, [x, 0, 0]));
    doors.report.setAttribute("transform", translateAlong(P, [rattle(t, T.tryReport), 0, 0]));
    lamps.report.style.opacity = (ease(T.tryReport[0], T.tryReport[0] + 0.15, t) * (1 - ease(T.tryReport[1], T.tryReport[1] + 0.3, t))).toFixed(3);
    bar.style.opacity = fixed ? "1" : "0";
    if (fixed) {
      doors.export.setAttribute("transform", translateAlong(P, [rattle(t, T.tryExport), 0, 0]));
      lamps.cls.style.opacity = (ease(T.tryExport[0], T.tryExport[0] + 0.15, t) * back).toFixed(3);
      crate.style.opacity = "0";
      return;
    }
    lamps.cls.style.opacity = "0";
    doors.export.setAttribute("transform", translateAlong(P, [EXPORT_W * ease(...T.tryExport, t) * back, 0, 0]));
    // The crate comes out of the hold onto the cart, then rides home with it
    const out = ease(...T.crate, t);
    const at = t < T.home[0]
      ? CRATE_FROM.map((v, i) => v + (CRATE_TO[i] - v) * out)
      : [x, CRATE_TO[1], CRATE_TO[2]];
    crate.setAttribute("transform", translateAlong(P, at));
    crate.style.opacity = (ease(T.crate[0], T.crate[0] + 0.25, t) * back).toFixed(3);
  },
});
`;

writeFigure("kimai-export-authorization-bypass", {
  fig: "Fig 1",
  title: "Report vs export",
  readout: "ROLE_USER · logged in",
  keys: [
    { mark: "lit", label: "Export hatch: report_project_view_export, no IsGranted" },
    { mark: "raised", label: "Report hatch: report:project and budget_any bolts" },
  ],
  caption:
    "Both hatches open into the same hold, because both actions call getData(). The report action carries both guards, so a ROLE_USER is refused there; the export action carries none and hands over the project overview across every customer. Kimai 2.64.0 moves both attributes to the class, so one bar covers every action.",
  svg,
  stageLabel: "Kimai report and export hatches. Arrow keys step through the run; Space applies or removes the fix.",
  live,
  css: DOCKBAY_CSS + `.kx-crate{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:.5}`,
});
