// Fig: quadratic dotted keys in toml (GHSA-9j65-hcg3-gc64, CWE-407, fixed in 5.0.1).
// A dotted key is a row of segment plates; the cart is the compiler's loop walking it. In 5.0.0, at every
// segment the reader head runs back to k0 and re-reads the whole prefix (keys.slice(0, i + 1) joined into a
// path string), and each rebuilt string is kept in a Set: the tape bin. 8 segments cost 1 + 2 + ... + 8 = 36
// segment reads. In 5.0.1 there are no path strings on the happy path: each table is tagged with how it was
// made (a WeakMap entry), so the head stays parked, every plate gets a tag, and the bin stays empty.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, railSvg, cartSvg, crateSvg, recess, planeOf, flat, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- Model, from the post ----
const SEGMENTS = 8; // k0.k1. ... .k7 = 1
const READS = (SEGMENTS * (SEGMENTS + 1)) / 2; // 36: step i re-joins i + 1 segments

// ---- World layout ----
const PITCH = 20;
const PLATE_X0 = -100;
const plateX = (i) => PLATE_X0 + i * PITCH;
const PLATE = { w: 15, d: 11, y: -16, h: 3 };
const RAIL_Y = 26;

const BEAM_Y = -32;
const BEAM_Z = 30;
const POSTS = [-122, 60];
const HEAD_Y = PLATE.y + PLATE.d / 2;
const HEAD_TIP = 11; // the read head's tip, hovering over the plates
const PARK = plateX(0);

const BIN = { x: 86, y: -60, w: 34, d: 26, r: 2.5 };
const BIN_TOP = 48;
const BIN_FACE = BIN.y + BIN.d;
const GLASS = { x0: 92, x1: 104, z0: 8, z1: 40, r: 2, depth: 2 };

// ---- Parts ----
function plates() {
  const out = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const x = plateX(i);
    const plan = { x: x - PLATE.w / 2, y: PLATE.y, w: PLATE.w, d: PLATE.d, r: 1.2 };
    out.push(S(k.slabOf({ x: x - 3, y: PLATE.y - 4, w: 6, d: 4, r: 0.6 }, 0, 1.4, P, 2), { tone: "lo", crease: "none" }));
    // The 5.0.1 kind tag: a flag that stands up on the plate's back tab once the walk passes it
    const tag = { x: x - 1.8, y: PLATE.y - 3.4, w: 3.6, d: 2.8, r: 0.5 };
    out.push(`<g data-tag="${i}" style="opacity:0">${S(k.slabOf(tag, 1.4, 5, P, 2, 0.3), { tone: "hi", crease: "lo" })}</g>`);
    out.push(S(k.slabOf(plan, 0, PLATE.h, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(plan, 1.2, P, 3), { tone: "faint" }) }));
    out.push(L(k.planOutline(k.insetPlan(plan, 1.3), PLATE.h, P, 3), { tone: "faint" }));
    out.push(k.faceTextSvg(k.topMatrix([x - 1, PLATE.y + 7.4], PLATE.h, P, "x"), "k" + i, { size: 4.4, tone: "hi", anchor: "middle" }));
    out.push(D([at([x + 5.2, PLATE.y + 2.6, PLATE.h]), at([x - 5.2, PLATE.y + 2.6, PLATE.h])], { size: 0.38 }));
  }
  return out.join("");
}

function gantry() {
  const out = [];
  for (const x of POSTS) {
    const foot = { x: x - 6, y: BEAM_Y - 6, w: 12, d: 12, r: 1.5 };
    out.push(S(k.slabOf(foot, 0, 2, P, 3, 0.4), { tone: "lo" }));
    out.push(D(k.corners(foot, 2).map(([px, py]) => at([px, py, 2])), { size: 0.4 }));
    out.push(S(k.slabOf({ x: x - 3, y: BEAM_Y - 3, w: 6, d: 6, r: 1 }, 2, BEAM_Z - 2, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam({ x: x - 3, y: BEAM_Y - 3, w: 6, d: 6, r: 1 }, 8, P, 3), { tone: "faint" }) }));
  }
  const beam = { x: POSTS[0] - 4, y: BEAM_Y - 3.5, w: POSTS[1] - POSTS[0] + 8, d: 7, r: 1.2 };
  out.push(S(k.slabOf(beam, BEAM_Z, 4, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(beam, BEAM_Z + 2, P, 3), { tone: "faint" }) }));
  // A tick ruler along the beam's top: the head's travel, one major per plate
  const ticks = k.topTicks(PLATE_X0 - 10, plateX(SEGMENTS - 1) + 10, PITCH / 4, 4, BEAM_Y + 3.5, BEAM_Z + 4, [1.2, 2.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

// The reader: carriage on the beam, an arm over the plates, a head that drops to read. Built at x = 0.
function reader() {
  const out = [];
  const carriage = { x: -6, y: BEAM_Y - 5, w: 12, d: 10, r: 1.5 };
  out.push(S(k.slabOf(carriage, BEAM_Z - 2, 8, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(carriage, BEAM_Z + 1, P, 3), { tone: "faint" }) }));
  out.push(D(k.corners(carriage, 2).map(([x, y]) => at([x, y, BEAM_Z + 6])), { size: 0.4 }));
  const arm = { x: -2.5, y: BEAM_Y + 5, w: 5, d: HEAD_Y - BEAM_Y - 2, r: 1 };
  out.push(S(k.slabOf(arm, BEAM_Z + 1, 3, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(0, HEAD_Y, 3.2, BEAM_Z - 3, 7, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(0, HEAD_Y, 3.2, BEAM_Z - 2, BEAM_Z + 3, 16, P), { tone: "lo" }));
  out.push(S(k.cylinder(0, HEAD_Y, 1.3, HEAD_TIP + 3, BEAM_Z - 3 - HEAD_TIP - 3, P, 14), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(0, HEAD_Y, 2.6, HEAD_TIP, 3, P, 24, 0.4), { tone: "hi", lit: true }));
  return out.join("");
}

function bin() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(BIN, 2), 0, 4, P)}"/>`];
  out.push(S(k.slabOf(BIN, 0, BIN_TOP, P, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(BIN, 4, P, 4), { tone: "faint" }) }));
  // Feed slot on the lid where rebuilt prefixes go in
  out.push(L(k.planOutline({ x: BIN.x + 8, y: BIN.y + 10, w: 18, d: 4, r: 1.5 }, BIN_TOP, P, 3), { tone: "lo" }));
  out.push(D(k.corners(BIN, 3).map(([x, y]) => at([x, y, BIN_TOP])), { size: 0.45 }));
  // Sight glass: the level is drawn on the window's back plane and set by the live code
  const span = GLASS.z1 - GLASS.z0 - 2;
  const level = `<rect data-part="level" class="tn-level" x="${GLASS.x0 + 1}" y="${-(GLASS.z0 + 1)}" width="${GLASS.x1 - GLASS.x0 - 2}" height="0"/>`;
  out.push(recess({ ...GLASS }, BIN_FACE, level));
  // Scale plate beside the glass, one tick per 4 reads, each running edge to edge
  const scale = { x0: 106, x1: 111, z0: GLASS.z0 + 1, z1: GLASS.z1 - 1 };
  const rows = [];
  for (let n = 4; n < READS; n += 4) {
    const z = scale.z0 + (span * n) / READS;
    rows.push(`M${scale.x0} ${(-z).toFixed(2)}H${n % 12 === 0 ? scale.x1 : (scale.x0 + scale.x1) / 2}`);
  }
  out.push(
    `<g transform="${planeOf(BIN_FACE)}"><path class="iso-line" data-tone="lo" d="${flat(scale.x0, scale.z0, scale.x1, scale.z1, 0.8, 3)}"/>` +
      `<path class="iso-line" data-tone="lo" d="${rows.join("")}"/></g>`,
  );
  out.push(D([[BIN.x + 3, 44], [BIN.x + BIN.w - 3, 44], [BIN.x + 3, 6], [BIN.x + BIN.w - 3, 6]].map(([x, z]) => at([x, BIN_FACE, z])), { size: 0.45 }));
  return out.join("");
}

function feed() {
  // A conduit on the floor from the gantry's end post to the bin: where the rebuilt prefixes go
  const y = BIN.y + BIN.d - 8;
  const route = [[POSTS[1] + 3, BEAM_Y, 6], [POSTS[1] + 9, BEAM_Y, 0.3], [POSTS[1] + 9, y, 0.3], [BIN.x - 6, y, 0.3], [BIN.x, y, 6]].map(at);
  return k.wireSvg(route[0], route[route.length - 1], { via: route.slice(1, -1), tone: "mid" });
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A parsing bench. Eight plates labelled k0 to k7 form one dotted key. A cart walks along them one plate at a time. Above, a read head on a gantry runs back to k0 at every step and re-reads every plate up to the current one, and each rebuilt prefix goes into a tape bin whose sight glass fills. With the fix the head stays parked, each plate gets a small tag, and the bin stays empty.",
  body: [
    deck("GHSA-9J65"),
    bin(),
    feed(),
    gantry(),
    plates(),
    `<g data-part="reader" transform="${k.translateAlong(P, [PARK, 0, 0])}">${reader()}</g>`,
    railSvg(-128, 60, RAIL_Y),
    `<g data-part="cart" transform="${k.translateAlong(P, [plateX(0) - 10, 0, 0])}">${cartSvg(RAIL_Y, `<g transform="${k.translateAlong(P, [0, RAIL_Y, 9])}">${crateSvg(14, 10, 7, "mid")}</g>`)}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const SEGMENTS = ${SEGMENTS}, READS = ${READS}, PITCH = ${PITCH}, X0 = ${PLATE_X0}, PARK = ${PARK};
const GLASS = ${JSON.stringify(GLASS)};
const plateX = (i) => X0 + i * PITCH;
const CART0 = plateX(0) - 10;
const cartFrom = (i) => (i === 0 ? CART0 : plateX(i - 1));

// One schedule per mode, in seconds. Step i: the cart rolls to plate i; in 5.0.0 the head then reads
// plates 0..i (i + 1 reads) and returns to k0; in 5.0.1 the plate is tagged and the cart moves on.
const ROLL = 0.42, READ = 0.13, RETURN = 0.3, TAG = 0.28, START = 0.5;
function schedule(fixed) {
  const steps = [];
  let t = START;
  for (let i = 0; i < SEGMENTS; i++) {
    const arrive = t + ROLL;
    const sweep = fixed ? 0 : (i + 1) * READ;
    const back = fixed ? arrive + TAG : arrive + sweep;
    steps.push({ i, from: t, arrive, back, done: fixed ? back : back + RETURN });
    t = steps[i].done;
  }
  return steps;
}
const PLANS = [schedule(false), schedule(true)];
const plan = (fixed) => PLANS[fixed ? 1 : 0];
const END = plan(false)[SEGMENTS - 1].done;
const CYCLE = END + 2.6, RESET = CYCLE - 0.9;

function pose(t, fixed) {
  const steps = plan(fixed);
  const out = 1 - ease(RESET, RESET + 0.6, t);
  let cartX = CART0, headX = PARK, reads = 0, step = -1, tagged = 0;
  for (const s of steps) {
    if (t < s.from) break;
    step = s.i;
    cartX = cartFrom(s.i) + (plateX(s.i) - cartFrom(s.i)) * ease(s.from, s.arrive, t);
    if (!fixed && t >= s.arrive) {
      // Sweep k0 → k{i} at one plate per READ, then run back to k0
      const read = Math.min(s.i + 1, (t - s.arrive) / READ);
      headX = PARK + PITCH * Math.min(s.i, read) - PITCH * s.i * ease(s.back, s.done, t);
      reads += Math.floor(Math.min(s.i + 1, read + 1e-6));
    } else if (fixed && t >= s.arrive && s.i < SEGMENTS - 1) {
      tagged = Math.max(tagged, s.i + ease(s.arrive, s.back, t));
    }
  }
  const last = steps[SEGMENTS - 1];
  cartX = cartX + (CART0 - cartX) * ease(RESET, RESET + 0.9, t);
  return { cartX, headX, reads: Math.round(reads * out), level: reads * out, step, tagged: tagged * out, done: t >= last.done && t < RESET, fixed };
}

function phaseOf(t, fixed) {
  const p = pose(t, fixed);
  if (t >= RESET) return "resetting";
  if (p.done) return fixed ? "8 segments · 7 tags · 0 path strings" : "8 segments · 36 reads · 8 strings kept";
  if (p.step < 0) return "k0.k1. … .k7 = 1";
  const seg = "segment " + (p.step + 1) + "/" + SEGMENTS;
  return fixed ? seg + " · tagged, no string" : seg + " · reads " + p.reads + " of " + READS;
}

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const cart = part("cart"), reader = part("reader"), level = part("level");
const tags = [...svg.querySelectorAll("[data-tag]")];
const SPAN = GLASS.z1 - GLASS.z0 - 2;

runFigure({
  cycle: CYCLE,
  scrubEnd: END + 0.2,
  steps: [0.2, ...plan(false).map((s) => s.back), END + 0.3],
  label: (fixed) => (fixed ? "Fixed: tag the tables (5.0.1)" : "Apply the fix (5.0.1)"),
  phase: phaseOf,
  draw(t, fixed) {
    const p = pose(t, fixed);
    cart.setAttribute("transform", translateAlong(P, [p.cartX, 0, 0]));
    reader.setAttribute("transform", translateAlong(P, [p.headX, 0, 0]));
    const h = (SPAN * p.level) / READS;
    level.setAttribute("height", h.toFixed(2));
    level.setAttribute("y", (-(GLASS.z0 + 1) - h).toFixed(2));
    tags.forEach((g, i) => { g.style.opacity = Math.min(1, Math.max(0, p.tagged - i)).toFixed(3); });
  },
});
`;

writeFigure("toml-node-quadratic-dotted-keys", {
  fig: "Fig 1",
  title: "Rebuilding the prefix",
  readout: "k0.k1. … .k7 = 1",
  keys: [
    { mark: "lit", label: "Read head: rebuilds the path string from k0" },
    { mark: "raised", label: "Tape bin: every rebuilt prefix, kept in a Set" },
  ],
  caption:
    "In 5.0.0 the walk to segment i re-reads segments 0 to i, so 8 segments cost 36 reads and 16,000 cost 128,008,000. The fixed 5.0.1 compiler builds no path string unless it is about to throw: each table carries a tag saying how it was made, so every step is one lookup and the bin stays empty.",
  svg,
  stageLabel: "Dotted-key parsing bench. Arrow keys step through the walk; Space applies or removes the fix.",
  live,
  css: DOCKBAY_CSS + `.tn-level{fill:var(--anatomy-mid)}`,
});
