// Fig: the hydra. One proxy network ran over 20,000 accounts against one model; suspending an account or
// blocking an IP range only moved the load to the rest, so the extracted exchanges kept accumulating.
// Numbers are the post's: DeepSeek 150,000+, Moonshot 3.4 million, MiniMax 13 million, over 16 million in all.
// This is not a vulnerability with a fix, and the post's countermeasures are its own speculation, so there is
// no fix state.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, recess, planeOf, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- Model, from the post ----
const LABS = "DeepSeek 150K+ · Moonshot 3.4M · MiniMax 13M";
const TAPS = 8;
const BANNED = [2, 5]; // an account suspended, then an IP range blocked

// ---- World layout ----
const PIPE = 6;
const TANK = [-112, -44];
const TANK_R = 18;
const TANK_H = 48;
const HEADER = { y: -46, z: 10 };
const COLLECT = { y: -12, z: 3 };
const tapX = (i) => -78 + i * 17;
const RECEIVER = { x: 70, y: -34, w: 30, d: 30, r: 2 };
const RECEIVER_TOP = 38;
const RECV_FACE = RECEIVER.y + RECEIVER.d;
const WIN = { x0: RECEIVER.x + 6, x1: RECEIVER.x + 18, z0: 6, z1: 32, r: 1.2, depth: 3 };
const CONSOLE = { x: 54, y: 10, w: 56, d: 10, r: 1.5 };
const CONSOLE_TOP = 10;

// ---- Parts ----
const pipeX = (x0, x1, y, z) => S(k.slabOf({ x: x0, y: y - PIPE / 2, w: x1 - x0, d: PIPE, r: 2.4 }, z, PIPE, P, 3), { tone: "mid", crease: "none" });
const pipeY = (x, y0, y1, z) => S(k.slabOf({ x: x - PIPE / 2 + 1, y: y0, w: PIPE - 2, d: y1 - y0, r: 1.6 }, z, PIPE - 2, P, 3), { tone: "mid", crease: "none" });

function tank() {
  const [x, y] = TANK;
  return [
    `<path class="iso-halo" d="${k.haloOf({ x: x - TANK_R, y: y - TANK_R, w: TANK_R * 2, d: TANK_R * 2, r: TANK_R }, 0, 4, P)}"/>`,
    S(k.cylinder(x, y, TANK_R + 2, 0, 3, P, 56, 0.6), { tone: "lo" }),
    S(k.cylinder(x, y, TANK_R, 3, TANK_H - 3, P, 56, 0.8), { tone: "mid", inner: L([12, 24, 36].map((z) => k.sideArc(x, y, TANK_R, z, P, 32)).join(""), { tone: "faint" }) }),
    S(k.cylinder(x, y, 6, TANK_H, 3, P, 28, 0.4), { tone: "mid" }),
    D(Array.from({ length: 10 }, (_, i) => at([x + Math.cos((i / 10) * Math.PI * 2) * (TANK_R - 2.6), y + Math.sin((i / 10) * Math.PI * 2) * (TANK_R - 2.6), TANK_H])), { size: 0.45 }),
  ].join("");
}

function plumbing() {
  const out = [pipeX(TANK[0] + TANK_R - 1, tapX(TAPS - 1) + 4, HEADER.y, HEADER.z)];
  for (let i = 0; i < TAPS; i++) {
    const x = tapX(i);
    // Riser from the header down to the tap line, then the tap line to the collector
    out.push(S(k.slabOf({ x: x - 1.6, y: HEADER.y + PIPE / 2, w: 3.2, d: 3, r: 0.6 }, COLLECT.z, HEADER.z - COLLECT.z, P, 2), { tone: "mid", crease: "none" }));
    out.push(pipeY(x, HEADER.y + PIPE / 2 + 3, COLLECT.y - PIPE / 2, COLLECT.z));
    out.push(S(k.slabOf({ x: x - 4, y: -32, w: 8, d: 7, r: 1 }, 0, 9, P, 2, 0.4), { tone: "mid" }));
    out.push(S(k.cylinder(x, -28.5, 1, 9, 4, P, 10), { tone: "mid", crease: "none" }));
  }
  out.push(pipeX(tapX(0) - 4, RECEIVER.x, COLLECT.y, COLLECT.z));
  return out.join("");
}

function flow() {
  const lines = [];
  for (let i = 0; i < TAPS; i++) {
    lines.push(`<g data-part="flow-${i}">${k.lineSvg(k.lineOnTop([tapX(i), HEADER.y + PIPE / 2 + 3], [tapX(i), COLLECT.y - PIPE / 2], COLLECT.z + PIPE - 2, P), { tone: "hi", flow: true })}</g>`);
  }
  lines.push(k.lineSvg(k.lineOnTop([tapX(0), COLLECT.y], [RECEIVER.x, COLLECT.y], COLLECT.z + PIPE, P) + k.lineOnTop([TANK[0] + TANK_R, HEADER.y], [tapX(TAPS - 1), HEADER.y], HEADER.z + PIPE, P), { tone: "hi", flow: true }));
  return lines.join("");
}

const handleD = (i, closed) => {
  const x = tapX(i), y = -28.5;
  const a = closed * (Math.PI / 2);
  const dx = Math.sin(a) * 5.5, dy = Math.cos(a) * 5.5;
  return k.lineOnTop([x - dx, y - dy], [x + dx, y + dy], 13, P);
};

function receiver() {
  const out = [S(k.slabOf(RECEIVER, 0, RECEIVER_TOP, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(RECEIVER, 4, P, 4), { tone: "faint" }) })];
  const fill = `<rect data-part="level" class="ad-fill" x="${WIN.x0}" y="${-WIN.z0}" width="${WIN.x1 - WIN.x0}" height="0"/>`;
  const ticks = [];
  for (let z = WIN.z0 + 2; z < WIN.z1; z += 2) ticks.push(`M${WIN.x1 - (z % 10 === 0 ? 3.4 : 1.8)} ${-z}H${WIN.x1}`);
  out.push(recess(WIN, RECV_FACE, `${fill}<path class="iso-line" data-tone="lo" data-free="start" d="${ticks.join("")}"/>`));
  out.push(D(k.corners(RECEIVER, 3).map(([x, y]) => at([x, y, RECEIVER_TOP])), { size: 0.45 }));
  out.push(lamp(RECEIVER.x + RECEIVER.w - 7, RECEIVER.y + 7, RECEIVER_TOP, "lamp-recv"));
  return out.join("");
}

function console_() {
  const face = CONSOLE.y + CONSOLE.d;
  return [
    S(k.slabOf(CONSOLE, 0, CONSOLE_TOP, P, 3, 0.6), { tone: "mid" }),
    `<g transform="${planeOf(face)}"><rect class="ad-plate" x="${CONSOLE.x + 3}" y="${-(CONSOLE_TOP - 2)}" width="${CONSOLE.w - 6}" height="6.4" rx="1"/>` +
      `<text data-part="count" class="ad-text" x="${CONSOLE.x + 6}" y="${-(CONSOLE_TOP - 6.6)}" font-size="3.6"></text></g>`,
  ].join("");
}

// ---- Assemble ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A large tank, one model, feeds a header with eight sampling taps, each an account, that all drain into one collector and a receiver whose sight glass shows how much has been drawn off. When one tap is closed, the others carry its share and the level keeps rising.",
  body: [
    deck("HYDRA"),
    tank(),
    plumbing(),
    flow(),
    ...Array.from({ length: TAPS }, (_, i) => `<path data-part="handle-${i}" class="iso-line" data-tone="hi" data-free="" style="stroke-width:1.5" d="${handleD(i, 0)}"/>`),
    receiver(),
    console_(),
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const TAPS = ${TAPS}, BANNED = ${JSON.stringify(BANNED)}, WIN = ${JSON.stringify(WIN)}, LABS = ${JSON.stringify(LABS)};
const T = { flow: [0.3, 0.9], bans: [[3.0, 3.5], [5.0, 5.5]], fill: [0.6, 7.6], reset: 8.6, cycle: 10 };
const handleD = ${handleD.toString().replace(/k\./g, "")};
const tapX = (i) => -78 + i * 17;

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const handles = Array.from({ length: TAPS }, (_, i) => part("handle-" + i));
const flows = Array.from({ length: TAPS }, (_, i) => part("flow-" + i));
const level = part("level"), count = part("count"), recv = part("lamp-recv");

function phaseOf(t) {
  if (t >= T.reset) return "resetting";
  if (t < T.bans[0][0]) return "one proxy network · 20,000+ accounts";
  if (t < T.bans[1][0]) return "account suspended · load reroutes";
  if (t < T.fill[1]) return "IP range blocked · traffic reroutes";
  return LABS;
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 8.4,
  steps: [0.2, T.bans[0][1] + 0.2, T.bans[1][1] + 0.2, T.fill[1] + 0.3],
  label: () => "",
  phase: phaseOf,
  draw(t) {
    const back = 1 - ease(T.reset, T.reset + 0.6, t);
    const on = ease(...T.flow, t) * back;
    for (let i = 0; i < TAPS; i++) {
      const b = BANNED.indexOf(i);
      const closed = b < 0 ? 0 : ease(...T.bans[b], t) * back;
      handles[i].setAttribute("d", handleD(i, closed));
      flows[i].style.opacity = (on * (1 - closed)).toFixed(3);
    }
    // The level never stalls: closing a tap moves its share to the others
    const filled = ease(...T.fill, t) * back;
    const h = (WIN.z1 - WIN.z0 - 2) * filled;
    level.setAttribute("y", (-(WIN.z0 + h)).toFixed(2));
    level.setAttribute("height", h.toFixed(2));
    const millions = 16 * filled;
    const text = t < T.flow[0] || t >= T.reset ? "" : "exchanges " + (millions < 1 ? Math.round(millions * 1000) + "K" : millions.toFixed(1) + "M") + (filled >= 1 ? "+" : "");
    if (count.textContent !== text) count.textContent = text;
    recv.style.opacity = on.toFixed(3);
  },
});
`;

writeFigure("ai-distillation-wars-anthropic-deepseek", {
  fig: "Fig 1",
  title: "The hydra",
  readout: "one proxy network · 20,000+ accounts",
  keys: [
    { mark: "lit", label: "Receiver level: exchanges extracted, over 16 million in all" },
    { mark: "raised", label: "Sampling taps: accounts drawing on the same model" },
  ],
  caption:
    "One proxy network ran over 20,000 accounts at once. Suspending an account or blocking an IP range closed one tap; the cluster redistributed the load and the extraction went on. Exchanges per lab, from the post: DeepSeek 150,000+, Moonshot AI 3.4 million, MiniMax 13 million.",
  svg,
  stageLabel: "Hydra cluster manifold. Arrow keys step through the run.",
  live,
  fix: false,
  css: DOCKBAY_CSS + `.ad-fill{fill:var(--anatomy-lit);opacity:.85}.ad-plate{fill:var(--db-flap)}.ad-text{fill:var(--db-flap-text);font-family:var(--anatomy-mono)}`,
});
