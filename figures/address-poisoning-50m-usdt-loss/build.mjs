// Fig: address poisoning. A wallet shows only the ends of an address; a vanity lookalike that matches the
// first 3 and last 4 hex digits (1 in 16^7) looks identical through that mask. The lookalike here is the
// one the post generated in 4 s on a free T4 (~183 MH/s), not the attacker's.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, recess, planeOf, flat, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- Model, from the post ----
const REAL = "0x" + "12c6a709925783f49fc0c2bcE5D336f5a2dA25b8".toLowerCase();
const LOOKALIKE = "0x" + "12C97658A0d69C717D68517f6a9FaD4E1a7325b8".toLowerCase();
const HEAD = 3 + 2; // "0x" plus the 3 matched digits
const TAIL = 4;
const DIFFER = [...REAL].filter((c, i) => c !== LOOKALIKE[i]).length;
if (REAL.length !== 42 || LOOKALIKE.length !== 42 || REAL.slice(0, HEAD) !== LOOKALIKE.slice(0, HEAD) || REAL.slice(-TAIL) !== LOOKALIKE.slice(-TAIL)) {
  throw new Error("addresses no longer match the post's 3 + 4 lookalike");
}

// ---- World layout ----
const HOUSING = { x: -120, y: -54, w: 240, d: 14, r: 2 };
const HOUSING_TOP = 56;
const FACE_Y = HOUSING.y + HOUSING.d;
const WIN = { x0: -108, x1: 104, z0: 18, z1: 44, r: 1.6, depth: 3 };
const PITCH = 4.96;
const CELL = { w: 4.4, h: 8.4, font: 6.2 };
const ROW_Z = [37, 25.4]; // history: your real recipient; below it, the dust transaction's sender
const cellX = (i) => WIN.x0 + 2.6 + CELL.w / 2 + i * PITCH;
const MASK = { x0: cellX(HEAD) - PITCH / 2 + 0.3, x1: cellX(42 - TAIL) - PITCH / 2 - 0.3 };
const PRINT_RAIL_Z = 14;
const SELECTOR = [112, 31];
const CONSOLE = { x: 62, y: 8, w: 40, d: 26, r: 2 };
const CONSOLE_TOP = 10;
const SLIDE = { from: CONSOLE.y + 6, to: CONSOLE.y + CONSOLE.d - 6 };
const GPU = { x: -110, y: 6, w: 44, d: 28, r: 2 };
const GPU_TOP = 14;

// ---- Parts ----
function row(text, z, part) {
  const cells = [...text].map((c, i) => {
    const x = cellX(i);
    return `<rect class="db-flap" x="${(x - CELL.w / 2).toFixed(2)}" y="${-(z + CELL.h / 2)}" width="${CELL.w}" height="${CELL.h}" rx="0.5"/>` +
      `<text class="db-flap-text" x="${x.toFixed(2)}" y="${(-z + CELL.font * 0.36).toFixed(2)}" font-size="${CELL.font}" text-anchor="middle">${c}</text>`;
  });
  const seam = `<path class="db-flap-seam" d="M${WIN.x0 + 2} ${-z}H${WIN.x1 - 2}"/>`;
  return `<g data-part="${part}">${cells.join("")}${seam}</g>`;
}

function marks() {
  // Underlines under every digit the mask was hiding that differs
  const bars = [];
  [...LOOKALIKE].forEach((c, i) => {
    if (c !== REAL[i]) bars.push(`<rect x="${(cellX(i) - CELL.w / 2).toFixed(2)}" y="${-(ROW_Z[1] - CELL.h / 2 - 0.6)}" width="${CELL.w}" height="0.9"/>`);
  });
  return `<g data-part="marks" class="ap-mark" style="opacity:0">${bars.join("")}</g>`;
}

function display() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(HOUSING, 2), 0, 6, P)}"/>`];
  out.push(S(k.slabOf(HOUSING, 0, HOUSING_TOP, P, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(HOUSING, 4, P, 4) + k.sideSeam(HOUSING, HOUSING_TOP - 4, P, 4), { tone: "faint" }) }));
  // Row 2 is printed in by the head: a clip that grows with the head's travel
  const reveal = `<clipPath id="ap-print"><rect data-part="print-clip" x="${WIN.x0}" y="${-WIN.z1}" width="0" height="${WIN.z1 - WIN.z0}"/></clipPath>`;
  // The wallet mask rolls up into the housing: clipped to the window, it vanishes as it rises
  const mask = `<g data-part="mask"><rect class="ap-mask" x="${MASK.x0.toFixed(2)}" y="${-(WIN.z1 - 1)}" width="${(MASK.x1 - MASK.x0).toFixed(2)}" height="${WIN.z1 - WIN.z0 - 2}" rx="0.8"/>` +
    [-(WIN.z1 - 6), -(WIN.z0 + 5)].map((y) => `<path class="iso-line" data-tone="lo" d="M${MASK.x0.toFixed(2)} ${y}H${MASK.x1.toFixed(2)}"/>`).join("") + `</g>`;
  const back = `<defs>${reveal}</defs>${row(REAL, ROW_Z[0], "row-real")}<g clip-path="url(#ap-print)">${row(LOOKALIKE, ROW_Z[1], "row-lookalike")}</g>${marks()}${mask}`;
  out.push(recess(WIN, FACE_Y, back));
  // Print rail under the window, edge to edge of the housing face
  out.push(S(k.slabOf({ x: HOUSING.x + 4, y: FACE_Y, w: HOUSING.w - 8, d: 2, r: 0.5 }, PRINT_RAIL_Z - 1, 2, P, 2, 0.3), { tone: "mid", crease: "none" }));
  out.push(D([HOUSING.x + 8, 0, HOUSING.x + HOUSING.w - 8].map((x) => at([x, FACE_Y + 2, PRINT_RAIL_Z + 1])), { size: 0.4 }));
  // Selector pivot on the right margin
  out.push(S(k.slabOf({ x: SELECTOR[0] - 3.5, y: FACE_Y, w: 7, d: 1.4, r: 0.6 }, SELECTOR[1] - 9, 18, P, 2, 0.3), { tone: "mid", crease: "none" }));
  out.push(D([at([SELECTOR[0], FACE_Y + 1.4, SELECTOR[1]])], { size: 0.9, tone: "hi" }));
  return out.join("");
}

const printHead = () =>
  [
    S(k.slabOf({ x: -3.5, y: FACE_Y + 2, w: 7, d: 5, r: 1 }, PRINT_RAIL_Z - 2, 5, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf({ x: -1, y: FACE_Y + 0.4, w: 2, d: 1.6, r: 0.3 }, PRINT_RAIL_Z + 3, 3, P, 2), { tone: "hi", crease: "none" }),
  ].join("");

// The selector tips toward the row being copied: up for your saved recipient, down for the history entry
const selectorD = (down) =>
  k.segment([SELECTOR[0], FACE_Y + 1.6, SELECTOR[1]], [SELECTOR[0] - 5.6, FACE_Y + 1.6, SELECTOR[1] + (down ? -2.6 : 2.6)], P);

function sendConsole() {
  const out = [S(k.slabOf(CONSOLE, 0, CONSOLE_TOP, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(CONSOLE, 4, P, 4), { tone: "faint" }) })];
  out.push(L(k.planOutline({ x: CONSOLE.x + CONSOLE.w / 2 - 1.6, y: SLIDE.from - 3, w: 3.2, d: SLIDE.to - SLIDE.from + 6, r: 1.4 }, CONSOLE_TOP, P, 3), { tone: "lo" }));
  const strip = { x: CONSOLE.x + CONSOLE.w / 2 + 4, y: SLIDE.from - 2, w: 4, d: SLIDE.to - SLIDE.from + 4, r: 0.6 };
  out.push(S(k.slabOf(strip, CONSOLE_TOP, 0.5, P, 2), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.y + 1, strip.y + strip.d - 1, 2, 4, strip.x + 0.4, CONSOLE_TOP + 0.5, [1.4, 2.6], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(lamp(CONSOLE.x + 7, CONSOLE.y + 7, CONSOLE_TOP, "lamp-sent"));
  out.push(lamp(CONSOLE.x + 7, CONSOLE.y + CONSOLE.d - 7, CONSOLE_TOP, "lamp-warn"));
  return out.join("");
}

const handle = () => {
  const x = CONSOLE.x + CONSOLE.w / 2;
  return [
    S(k.cylinder(x, SLIDE.from, 1.2, CONSOLE_TOP, 7, P, 12), { tone: "mid", crease: "none" }),
    S(k.slabOf({ x: x - 6, y: SLIDE.from - 1.6, w: 12, d: 3.2, r: 1.4 }, CONSOLE_TOP + 7, 3, P, 3, 0.4), { tone: "hi", crease: "lo" }),
  ].join("");
};

function gpu() {
  // The free T4 that found the lookalike in 4 seconds
  const out = [S(k.slabOf(GPU, 0, GPU_TOP, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(GPU, 4, P, 4), { tone: "faint" }) })];
  const [fx, fy] = [GPU.x + 15, GPU.y + GPU.d / 2];
  out.push(L(k.ring(fx, fy, 9, GPU_TOP, P, 40) + k.ring(fx, fy, 3, GPU_TOP, P, 18), { tone: "lo" }));
  out.push(L(Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    return k.lineOnTop([fx + Math.cos(a) * 3, fy + Math.sin(a) * 3], [fx + Math.cos(a + 0.5) * 9, fy + Math.sin(a + 0.5) * 9], GPU_TOP, P);
  }).join(""), { tone: "lo" }));
  out.push(D(k.dotGrid(GPU.x + 29, GPU.y + 5, 3, 5, 3.4, GPU_TOP, P), { size: 0.45, tone: "lo" }));
  out.push(lamp(GPU.x + GPU.w - 6, GPU.y + GPU.d - 6, GPU_TOP, "lamp-gpu"));
  out.push(k.wireSvg(at([GPU.x + GPU.w, GPU.y + 6, 3]), at([GPU.x + GPU.w + 26, FACE_Y, 3]), { via: [at([GPU.x + GPU.w + 4, GPU.y + 6, 0.2]), at([GPU.x + GPU.w + 26, GPU.y + 6, 0.2])], tone: "mid" }));
  return out.join("");
}

// ---- Assemble ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A manifest display with two rows of 42 split-flap cells: the real recipient from history, and below it the sender of a dust transaction. A wallet mask covers the middle of both rows, so each shows only 0x12c and 25b8. A send handle sits on a console in front, and a GPU box at the left found the lookalike.",
  body: [
    deck("1 IN 16^7"),
    display(),
    `<path data-part="selector" class="iso-line" data-tone="hi" style="stroke-width:1.3" d="${selectorD(false)}"/>`,
    `<g data-part="head" transform="${k.translateAlong(P, [WIN.x0, 0, 0])}">${printHead()}</g>`,
    gpu(),
    sendConsole(),
    `<g data-part="handle">${handle()}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const WIN = ${JSON.stringify(WIN)}, FACE_Y = ${FACE_Y}, SELECTOR = ${JSON.stringify(SELECTOR)}, SLIDE = ${JSON.stringify(SLIDE)};
const DIFFER = ${DIFFER}, MASK_RISE = ${WIN.z1 - WIN.z0};
const T = { print: [1.2, 3.0], choose: [3.3, 3.8], unmask: [3.1, 3.9], send: [4.2, 4.9], reset: 9.4, cycle: 11 };
const selectorD = ${selectorD.toString().replace(/k\./g, "")};

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const head = part("head"), clip = part("print-clip"), mask = part("mask"), marks = part("marks"), selector = part("selector"), handle = part("handle");
const lamps = { gpu: part("lamp-gpu"), sent: part("lamp-sent"), warn: part("lamp-warn") };

function phaseOf(t, fixed) {
  if (t >= T.reset) return "resetting";
  if (t < T.print[0]) return "history · 0x12c…25b8 · $50 test";
  if (t < T.print[1]) return "dust from 0x12c…25b8 · 1 in 268,435,456";
  if (fixed) return t < T.send[0] ? "full address · " + DIFFER + " of 40 digits differ" : "warning · not your saved contact";
  if (t < T.send[0]) return "copied 0x12c…25b8 from history";
  return "sent $50M USDT · to the lookalike";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 9.2,
  steps: [0.2, T.print[1], T.choose[1], T.send[1] + 0.3],
  label: (fixed) => (fixed ? "Fixed: full address, checked" : "Apply the fix: show the full address"),
  phase: phaseOf,
  draw(t, fixed) {
    const back = 1 - ease(T.reset, T.reset + 0.6, t);
    const p = ease(...T.print, t);
    const headX = WIN.x0 + (WIN.x1 - WIN.x0) * p;
    head.setAttribute("transform", translateAlong(P, [t < T.reset ? headX : WIN.x1 + (WIN.x0 - WIN.x1) * ease(T.reset, T.reset + 1.2, t), 0, 0]));
    clip.setAttribute("width", ((WIN.x1 - WIN.x0) * p * back).toFixed(2));
    lamps.gpu.style.opacity = (t > T.print[0] - 0.4 && t < T.print[0] + 0.1 ? 1 : 0).toString();
    // In the fix the wallet shows the whole address: the mask rolls up out of the window
    const up = fixed ? ease(...T.unmask, t) * back : 0;
    mask.setAttribute("transform", "translate(0 " + (-MASK_RISE * up).toFixed(2) + ")");
    marks.style.opacity = up.toFixed(3);
    selector.setAttribute("d", selectorD(!fixed && ease(...T.choose, t) * back > 0.5));
    const pull = fixed ? 0 : ease(...T.send, t) * back;
    handle.setAttribute("transform", translateAlong(P, [0, (SLIDE.to - SLIDE.from) * pull, 0]));
    lamps.sent.style.opacity = (fixed ? 0 : ease(T.send[1], T.send[1] + 0.15, t) * back).toFixed(3);
    lamps.warn.style.opacity = (fixed ? ease(T.send[0], T.send[0] + 0.15, t) * back : 0).toFixed(3);
  },
});
`;

writeFigure("address-poisoning-50m-usdt-loss", {
  fig: "Fig 1",
  title: "Seven digits",
  readout: "history · 0x12c…25b8 · $50 test",
  keys: [
    { mark: "lit", label: "Wallet mask: shows only 0x12c and 25b8" },
    { mark: "raised", label: "Top row: the real recipient. Bottom row: the dust sender" },
  ],
  caption: `Through the mask both rows read 0x12c…25b8. Matching 3 leading and 4 trailing hex digits takes 1 in 16^7 tries; the lookalike shown is the one this post generated in 4 seconds on a free T4. With the full address shown, ${DIFFER} of the 40 digits differ. The lookalike is a valid checksummed address, so only comparing against a saved contact catches it.`,
  svg,
  stageLabel: "Address poisoning manifest. Arrow keys step through the run; Space applies or removes the fix.",
  live,
  css:
    DOCKBAY_CSS +
    `.db-flap{fill:var(--db-flap)}.db-flap-text{fill:var(--db-flap-text);font-family:var(--anatomy-mono);font-weight:600}.db-flap-seam{stroke:var(--db-well);stroke-width:.3}` +
    `.ap-mask{fill:var(--anatomy-face);stroke:var(--anatomy-lit);stroke-width:.7}.ap-mark{fill:var(--anatomy-lit)}`,
});
