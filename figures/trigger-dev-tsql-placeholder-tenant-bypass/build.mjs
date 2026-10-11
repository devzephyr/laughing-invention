// Fig: curly braces around a table name skipped Trigger.dev's tenant filter (GHSA-m79r-84cc-xwg9, fixed in 4.7.3).
// A table name is a crate. The main belt runs it through the allowlist gate (lookupTable) and the seal press
// (createEnforcedGuard: organization_id, project_id, environment_id). A {braced} crate is a placeholder:
// the diverter sends it down the back lane past both, and every tenant's drawer opens. The fix rejects it.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, crateSvg, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- World layout ----
const BED_H = 6;
const MAIN = { x: -122, y: 2, w: 196, d: 16, r: 1 };
const BYPASS = { x: -78, y: 30, w: 132, d: 16, r: 1 };
const MAIN_Y = MAIN.y + MAIN.d / 2;
const BYPASS_Y = BYPASS.y + BYPASS.d / 2;
const GATE_X = -50;
const PRESS_X = -10;
const STORE = { x: 76, y: -8, w: 34, d: 32, r: 2 };
const STORE_TOP = 46;
const STORE_FACE = STORE.y + STORE.d;
const DRAWERS = [4, 17, 30]; // three tenants' rows in one shared cluster
const DRAWER_H = 11;
const YOURS = 1;
const TRAP = { x: -70, y: BYPASS.y + 2, w: 12, d: BYPASS.d - 4, r: 0.6 };
const CRATE_H = 8;
const RAM = { rest: 30, down: BED_H + CRATE_H + 0.6 };

// ---- Parts ----
function bed(plan) {
  const out = [S(k.slabOf(plan, 0, BED_H, P, 2, 0.4), { tone: "mid", inner: L(k.sideSeam(plan, 2, P, 2), { tone: "faint" }) })];
  // Rollers: lines across the belt, edge to edge
  const rollers = [];
  for (let x = plan.x + 3; x < plan.x + plan.w - 1; x += 5) rollers.push(k.lineOnTop([x, plan.y], [x, plan.y + plan.d], BED_H, P));
  out.push(L(rollers.join(""), { tone: "lo" }));
  return out.join("");
}

function transfers() {
  // Diagonal transfer plates where the bypass lane leaves and rejoins the main belt
  const out = [];
  const near = MAIN.y + MAIN.d;
  const rings = [
    [[-86, near], [-78, near], [-70, BYPASS.y], [-78, BYPASS.y]],
    [[46, BYPASS.y], [54, BYPASS.y], [62, near], [54, near]],
  ];
  for (const ring of rings) out.push(S(k.extrude(ring, 0, BED_H - 0.4, P), { tone: "mid" }));
  return out.join("");
}

function frameBack(x, top) {
  return S(k.slabOf({ x: x - 2, y: MAIN.y - 4, w: 4, d: 4, r: 0.8 }, 0, top, P, 2, 0.4), { tone: "mid" });
}

function frameFront(x, top) {
  return [
    S(k.slabOf({ x: x - 2, y: MAIN.y + MAIN.d, w: 4, d: 4, r: 0.8 }, 0, top, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf({ x: x - 3, y: MAIN.y - 5, w: 6, d: MAIN.d + 10, r: 1 }, top, 4, P, 2, 0.5), { tone: "mid" }),
    D([at([x, MAIN.y - 2, top + 4]), at([x, MAIN.y + MAIN.d + 2, top + 4])], { size: 0.45 }),
  ].join("");
}

function gateFront() {
  // The allowlist gauge: a profile plate only known tables pass under
  const top = 26;
  return [
    frameFront(GATE_X, top),
    S(k.slabOf({ x: GATE_X - 1, y: MAIN.y + 1, w: 2, d: MAIN.d - 2, r: 0.4 }, BED_H + CRATE_H + 2, top - BED_H - CRATE_H - 2, P, 2), { tone: "lo", crease: "none" }),
  ].join("");
}

function pressFront() {
  return [frameFront(PRESS_X, 36), S(k.cylinder(PRESS_X, MAIN_Y, 3.6, 31, 5, P, 24, 0.4), { tone: "mid" })].join("");
}

const ram = () =>
  [
    S(k.cylinder(PRESS_X, MAIN_Y, 1.6, 2, 40 - RAM.down - 2, P, 14), { tone: "mid", crease: "none" }),
    S(k.slabOf({ x: PRESS_X - 6, y: MAIN_Y - 4.5, w: 12, d: 9, r: 1 }, 0, 2, P, 2, 0.4), { tone: "hi", crease: "lo" }),
  ].join("");

function store() {
  const out = [S(k.slabOf(STORE, 0, STORE_TOP, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(STORE, 2, P, 4), { tone: "faint" }) })];
  out.push(D(k.corners(STORE, 3).map(([x, y]) => at([x, y, STORE_TOP])), { size: 0.45 }));
  out.push(lamp(STORE.x + STORE.w - 8, STORE.y + 8, STORE_TOP, "lamp-store"));
  return out.join("");
}

function drawer(z, index) {
  // Built closed against the store's face; the live code slides it out along +y
  const plan = { x: STORE.x + 4, y: STORE_FACE - 14, w: STORE.w - 8, d: 15.4, r: 0.6 };
  const rows = [];
  for (let n = 0; n < 3; n++) rows.push(k.lineOnTop([plan.x + 3, plan.y + 3 + n * 3.4], [plan.x + 8 + ((n * 5 + index * 3) % 11), plan.y + 3 + n * 3.4], z + DRAWER_H, P));
  return [
    `<g data-part="drawer-${index}">`,
    S(k.slabOf(plan, z, DRAWER_H, P, 2, 0.4), { tone: "mid" }),
    L(rows.join(""), { tone: "lo", free: true }),
    S(k.slabOf({ x: plan.x + plan.w / 2 - 4, y: plan.y + plan.d, w: 8, d: 1.4, r: 0.5 }, z + 4.5, 2, P, 2), { tone: "hi", crease: "lo" }),
    `</g>`,
  ].join("");
}

function trapdoor() {
  // The fix: the bypass lane ends in a trapdoor and a bolted stop plate (QueryError)
  const out = [`<path class="kt-pit" d="${k.onTop(k.ringOf(TRAP, 2), BED_H + 0.05, P, true)}"/>`];
  out.push(L(k.planOutline(TRAP, BED_H + 0.05, P, 2), { tone: "hi" }));
  const stop = { x: TRAP.x + TRAP.w + 2, y: BYPASS.y - 1, w: 3, d: BYPASS.d + 2, r: 0.6 };
  out.push(S(k.slabOf(stop, 0, BED_H + 12, P, 2, 0.5), { tone: "hi", crease: "lo" }));
  out.push(D([at([stop.x + 1.5, stop.y + 2, BED_H + 12]), at([stop.x + 1.5, stop.y + stop.d - 2, BED_H + 12])], { size: 0.45 }));
  out.push(lamp(stop.x + 1.5, stop.y + stop.d / 2, BED_H + 12, "lamp-reject"));
  return out.join("");
}

const seal = () => {
  // Three bands over the lid: organization, project, environment
  const bands = [-4, 0, 4].map((x) => S(k.slabOf({ x: x - 1, y: -5.3, w: 2, d: 10.6, r: 0.3 }, CRATE_H, 0.5, P, 2), { tone: "hi", crease: "none" }));
  return bands.join("");
};

// A "{" at one end of the crate: an upright bar with a nub pointing outward at mid-depth.
// The far (-x) brace is drawn before the crate body and the near (+x) one after it.
const brace = (side) => {
  const x0 = side * 7.2, x1 = side * 8.4, tip = side * 10;
  const bar = [[Math.min(x0, x1), -5], [Math.max(x0, x1), -5], [Math.max(x0, x1), 5], [Math.min(x0, x1), 5]];
  const nub = side < 0 ? [[x1, -1.4], [x1, 1.4], [tip, 0]] : [[x1, -1.4], [tip, 0], [x1, 1.4]];
  return [
    S(k.extrude(bar, 0, CRATE_H, P), { tone: "hi", crease: "lo", lit: true }),
    S(k.extrude(nub, 0, CRATE_H, P), { tone: "hi", crease: "lo", lit: true }),
  ].join("");
};

// ---- Assemble ----
const crate1 = `<g data-part="crate1" style="opacity:0">${crateSvg(14, 10, CRATE_H)}<g data-part="seal" style="opacity:0">${seal()}</g></g>`;
const crate2 = `<g data-part="crate2" style="opacity:0">${brace(-1)}${crateSvg(14, 10, CRATE_H, "hi")}${brace(1)}</g>`;

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A conveyor. Crates stand for table names. A plain crate passes an allowlist gate and a seal press that stamps three tenant bands on it, and the shared store opens only its own tenant's drawer. A crate wrapped in braces is diverted onto a back lane that skips the gate and the press, and every tenant's drawer opens for it.",
  body: [
    deck("GHSA-M79R"),
    bed(MAIN),
    frameBack(GATE_X, 26),
    frameBack(PRESS_X, 36),
    `<g data-slot="main">${crate2}</g>`,
    crate1,
    gateFront(),
    pressFront(),
    `<g data-part="ram" transform="${k.translateAlong(P, [0, 0, RAM.rest])}">${ram()}</g>`,
    transfers(),
    bed(BYPASS),
    `<g data-part="fix" style="opacity:0">${trapdoor()}</g>`,
    `<g data-slot="bypass"></g>`,
    store(),
    ...DRAWERS.map((z, i) => drawer(z, i)),
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const MAIN_Y = ${MAIN_Y}, BYPASS_Y = ${BYPASS_Y}, BED_H = ${BED_H}, RAM = ${JSON.stringify(RAM)};
const X = { start: -112, gate: ${GATE_X}, press: ${PRESS_X}, store: 72, split: -82, lane: -72, join: 50, rejoin: 60, trap: ${TRAP.x + TRAP.w / 2} };
const YOURS = ${YOURS};
const T = {
  c1: { toPress: [0.2, 2.2], press: [2.3, 2.6, 2.95], toStore: [3.0, 4.4], open: [4.6, 5.2] },
  c2: { in: [5.4, 6.0], split: [6.0, 6.5], lane: [6.5, 7.9], rejoin: [7.9, 8.4], toStore: [8.4, 8.8], open: [8.9, 9.6], toBin: [6.5, 7.0], drop: [7.0, 7.4] },
  reset: 10.6, cycle: 12,
};

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const crate1 = part("crate1"), crate2 = part("crate2"), sealBands = part("seal"), ramPart = part("ram"), fix = part("fix");
const slots = { bypass: svg.querySelector('[data-slot="bypass"]'), main: svg.querySelector('[data-slot="main"]') };
const drawers = [0, 1, 2].map((i) => part("drawer-" + i));
const lamps = { store: part("lamp-store"), reject: part("lamp-reject") };
const lerp = (a, b, u) => a + (b - a) * u;

// Crate 2 is drawn in front of the station frames while it rides the bypass lane, between their posts on the main belt
function slot(y) {
  const target = y > (MAIN_Y + BYPASS_Y) / 2 ? slots.bypass : slots.main;
  if (crate2.parentNode !== target) target.appendChild(crate2);
}

function crate1At(t) {
  const c = T.c1;
  let x = lerp(X.start, X.press, ease(...c.toPress, t));
  x = lerp(x, X.store, ease(...c.toStore, t));
  return [x, MAIN_Y, BED_H];
}

function crate2At(t, fixed) {
  const c = T.c2;
  let x = lerp(X.start, X.split, ease(...c.in, t));
  let y = MAIN_Y, z = BED_H;
  const s = ease(...c.split, t);
  x = lerp(x, X.lane, s); y = lerp(MAIN_Y, BYPASS_Y, s);
  if (fixed) {
    x = lerp(x, X.trap, ease(...c.toBin, t));
    z = BED_H - 10 * ease(...c.drop, t);
    return [x, y, z];
  }
  x = lerp(x, X.join, ease(...c.lane, t));
  const r = ease(...c.rejoin, t);
  x = lerp(x, X.rejoin, r); y = lerp(y, MAIN_Y, r);
  x = lerp(x, X.store, ease(...c.toStore, t));
  return [x, y, z];
}

function phaseOf(t, fixed) {
  const c1 = T.c1, c2 = T.c2;
  if (t >= T.reset) return "resetting";
  if (t < 1.2) return "FROM trigger_dev.task_runs_v2";
  if (t < c1.press[0]) return "allowlist · known table";
  if (t < c1.open[0]) return "tenant filter · 3 columns";
  if (t < c2.in[0]) return "rows · your environment only";
  if (t < c2.split[1]) return "FROM {trigger_dev.task_runs_v2}";
  if (fixed) return "QueryError · placeholder rejected";
  if (t < c2.open[0]) return "placeholder · no lookup, no filter";
  return "rows · every tenant";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 10.4,
  steps: [0.2, T.c1.press[2], T.c1.open[1], T.c2.split[1], T.c2.rejoin[1], T.c2.open[1] + 0.3],
  label: (fixed) => (fixed ? "Fixed: placeholders rejected" : "Apply the fix: reject placeholders"),
  phase: phaseOf,
  draw(t, fixed) {
    const c1 = T.c1, c2 = T.c2;
    const back = 1 - ease(T.reset, T.reset + 0.6, t);
    crate1.setAttribute("transform", translateAlong(P, crate1At(t)));
    crate1.style.opacity = (ease(0, 0.3, t) * (1 - ease(c1.toStore[1] - 0.3, c1.toStore[1], t))).toFixed(3);
    sealBands.style.opacity = ease(c1.press[1] - 0.05, c1.press[1] + 0.1, t).toFixed(3);
    const pressed = ease(c1.press[0], c1.press[1], t) * (1 - ease(c1.press[1] + 0.05, c1.press[2], t));
    ramPart.setAttribute("transform", translateAlong(P, [0, 0, lerp(RAM.rest, RAM.down, pressed)]));

    const at2 = crate2At(t, fixed);
    slot(at2[1]);
    crate2.setAttribute("transform", translateAlong(P, at2));
    const gone = fixed ? ease(c2.drop[0] + 0.1, c2.drop[1], t) : ease(c2.toStore[1] - 0.25, c2.toStore[1], t);
    crate2.style.opacity = (ease(c2.in[0], c2.in[0] + 0.3, t) * (1 - gone)).toFixed(3);

    fix.style.opacity = fixed ? "1" : "0";
    lamps.reject.style.opacity = (fixed ? ease(c2.drop[1], c2.drop[1] + 0.15, t) * back : 0).toFixed(3);
    // Your drawer for the sealed crate; every drawer for the unsealed one
    const mine = ease(...c1.open, t) * (1 - ease(c2.in[0], c2.in[0] + 0.5, t));
    const all = fixed ? 0 : ease(...c2.open, t) * back;
    drawers.forEach((d, i) => {
      const out = Math.max(i === YOURS ? mine : 0, all);
      d.setAttribute("transform", translateAlong(P, [0, 10 * out, 0]));
    });
    lamps.store.style.opacity = Math.max(mine, all).toFixed(3);
  },
});
`;

writeFigure("trigger-dev-tsql-placeholder-tenant-bypass", {
  fig: "Fig 1",
  title: "Braces skip the seal",
  readout: "FROM trigger_dev.task_runs_v2",
  keys: [
    { mark: "lit", label: "Braced crate: a {placeholder} table name" },
    { mark: "raised", label: "Seal bands: organization_id, project_id, environment_id" },
  ],
  caption:
    "A plain table name is a field: the compiler checks it against the allowlist and adds the three tenant columns, so the shared ClickHouse store returns only your rows. A name in braces is a placeholder; that branch only visits the node, so no filter is added and every tenant's rows come back. Trigger.dev 4.7.3 makes the placeholder branch throw a QueryError instead.",
  svg,
  stageLabel: "Trigger.dev query conveyor. Arrow keys step through the run; Space applies or removes the fix.",
  live,
  css: DOCKBAY_CSS + `.kt-pit{fill:var(--db-flap);stroke:none}`,
});
