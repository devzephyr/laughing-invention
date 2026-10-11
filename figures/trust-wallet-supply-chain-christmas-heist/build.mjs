// Fig: Trust Wallet extension 2.68.0. The backdoor in 4482.js asked GET_SEED_PHRASE for every wallet on unlock,
// put each phrase in the errorMessage field of an ordinary analytics event, and changed one PostHog init
// option, api_host, so the existing telemetry line delivered to api.metrics-trustwallet.com. 2.69 is clean.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- World layout ----
const SAFE = { x: -126, y: -44, w: 40, d: 32, r: 2 };
const SAFE_TOP = 36;
const SAFE_FACE = SAFE.y + SAFE.d;
const DRAWER_Z = [4, 14, 24];
const DRAWER = { x: SAFE.x + 5, w: 30, h: 8 };
const CRADLE = { x: -66, y: -12, w: 26, d: 12, r: 1.5 };
const LINE_Y = -6;
const TROUGH = 6;
const SEL = [64, LINE_Y];
const SEL_R = 9;
const SEL_TOP = 16;
const DOCK_BACK = { x: SEL[0] - 12, y: -68, w: 24, d: 14, r: 1.5 };
const DOCK_FRONT = { x: SEL[0] - 12, y: 30, w: 24, d: 14, r: 1.5 };
const DOCK_TOP = 18;
const CAPSULE_Z = 3;
const PATH = { start: CRADLE.x + CRADLE.w / 2, turret: SEL[0] - SEL_R - 6, back: DOCK_BACK.y + DOCK_BACK.d + 6, front: DOCK_FRONT.y - 6 };

// ---- Parts ----
const troughX = (x0, x1, y) => {
  const plan = { x: x0, y: y - TROUGH / 2, w: x1 - x0, d: TROUGH, r: 1 };
  return [S(k.slabOf(plan, 0, CAPSULE_Z, P, 2, 0.3), { tone: "mid" }), L(k.planOutline(k.insetPlan(plan, 1.4), CAPSULE_Z, P, 2), { tone: "lo" })].join("");
};
const troughY = (x, y0, y1) => {
  const plan = { x: x - TROUGH / 2, y: y0, w: TROUGH, d: y1 - y0, r: 1 };
  return [S(k.slabOf(plan, 0, CAPSULE_Z, P, 2, 0.3), { tone: "mid" }), L(k.planOutline(k.insetPlan(plan, 1.4), CAPSULE_Z, P, 2), { tone: "lo" })].join("");
};

function safe() {
  const out = [S(k.slabOf(SAFE, 0, SAFE_TOP, P, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(SAFE, SAFE_TOP - 4, P, 4), { tone: "faint" }) })];
  out.push(D(k.corners(SAFE, 3).map(([x, y]) => at([x, y, SAFE_TOP])), { size: 0.45 }));
  // Unlock: a keyhole and its key on the +x face
  const kx = SAFE.x + SAFE.w;
  out.push(L(k.sideRing([kx, SAFE.y + 10, 20], 2.4, "x", P), { tone: "lo" }));
  out.push(lamp(SAFE.x + 8, SAFE.y + 8, SAFE_TOP, "lamp-unlock"));
  return out.join("");
}

function drawer(i) {
  const z = DRAWER_Z[i];
  const plan = { x: DRAWER.x, y: SAFE_FACE - 22, w: DRAWER.w, d: 23.4, r: 0.6 };
  return [
    `<g data-part="drawer-${i}">`,
    S(k.slabOf(plan, z, DRAWER.h, P, 2, 0.3), { tone: "mid" }),
    S(k.slabOf({ x: plan.x + plan.w / 2 - 4, y: plan.y + plan.d, w: 8, d: 1.4, r: 0.5 }, z + 3, 2, P, 2), { tone: "mid", crease: "none" }),
    `</g>`,
  ].join("");
}

// A seed slip, built lying on the drawer's top at the front; it rises and leaves for the capsule
const slip = (i) => S(k.slabOf({ x: DRAWER.x + 9, y: SAFE_FACE - 6, w: 12, d: 4, r: 0.3 }, DRAWER_Z[i] + DRAWER.h, 0.6, P, 2), { tone: "hi", crease: "lo", lit: true });

function cradle() {
  return [
    S(k.slabOf(CRADLE, 0, 4, P, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(CRADLE, 2, P, 3), { tone: "faint" }) }),
    S(k.slabOf({ x: CRADLE.x + 2, y: CRADLE.y - 6, w: 6, d: 6, r: 0.8 }, 0, 10, P, 2, 0.3), { tone: "mid" }),
  ].join("");
}

// The analytics event: a capsule with a window over its error compartment
const capsule = () => {
  const body = { x: -8, y: LINE_Y - 2.8, w: 16, d: 5.6, r: 2.6 };
  return [
    S(k.slabOf(body, CAPSULE_Z, 5.6, P, 4, 0.4), { tone: "hi", crease: "lo" }),
    L(k.planOutline({ x: -3, y: LINE_Y - 1.4, w: 7, d: 2.8, r: 0.6 }, CAPSULE_Z + 5.6, P, 2), { tone: "lo" }),
    `<g data-part="payload" style="opacity:0">${S(k.slabOf({ x: -2.4, y: LINE_Y - 0.9, w: 5.8, d: 1.8, r: 0.3 }, CAPSULE_Z + 5.6, 0.3, P, 1), { tone: "hi", crease: "none", lit: true })}</g>`,
  ].join("");
};

function selector() {
  const [x, y] = SEL;
  const out = [S(k.cylinder(x, y, SEL_R + 3, 0, 3, P, 40, 0.5), { tone: "mid" })];
  out.push(S(k.cylinder(x, y, SEL_R, 3, SEL_TOP - 3, P, 40, 0.6), { tone: "mid", inner: L(k.sideArc(x, y, SEL_R, 9, P, 24), { tone: "faint" }) }));
  out.push(L(k.ring(x, y, SEL_R - 2, SEL_TOP, P, 40), { tone: "lo" }));
  // Index marks for the two ports
  out.push(L(k.lineOnTop([x, y - SEL_R + 2], [x, y - SEL_R + 4], SEL_TOP, P) + k.lineOnTop([x, y + SEL_R - 2], [x, y + SEL_R - 4], SEL_TOP, P), { tone: "mid" }));
  return out.join("");
}

const pointerD = (u) => {
  // u = 0 points at the PostHog port (back, -y); u = 1 at the other port (front, +y)
  const a = Math.PI * u;
  const [x, y] = SEL;
  return k.lineOnTop([x + Math.sin(a) * 1.6, y + Math.cos(a) * 1.6], [x - Math.sin(a) * (SEL_R - 3), y - Math.cos(a) * (SEL_R - 3)], SEL_TOP + 0.2, P);
};

function dock(plan, part) {
  // The two docks are the same model: nothing on the line looks different
  return [
    S(k.slabOf(plan, 0, DOCK_TOP, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(plan, 5, P, 3), { tone: "faint" }) }),
    D(k.dotGrid(plan.x + 4, plan.y + 4, 4, 2, 2.6, DOCK_TOP, P), { size: 0.42, tone: "lo" }),
    lamp(plan.x + plan.w - 5, plan.y + plan.d / 2, DOCK_TOP, part),
  ].join("");
}

// ---- Assemble ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A telemetry bench. A safe with three wallet drawers stands at the left. An analytics capsule rides a trough to a two-port selector, which sends it to one of two identical docks: the analytics service at the back or another dock at the front. On unlock, a seed slip rises from each drawer into the capsule's error compartment.",
  body: [
    deck("TRUST WALLET 2.68"),
    dock(DOCK_BACK, "lamp-posthog"),
    troughY(SEL[0], PATH.back - 6, SEL[1] - SEL_R),
    `<g data-slot="back"></g>`,
    safe(),
    ...[0, 1, 2].map((i) => drawer(i)),
    ...[0, 1, 2].map((i) => `<g data-part="slip-${i}" style="opacity:0">${slip(i)}</g>`),
    `<path data-part="key" class="iso-line" data-tone="hi" style="stroke-width:1.4" d=""/>`,
    cradle(),
    troughX(CRADLE.x + CRADLE.w, SEL[0] - SEL_R, LINE_Y),
    `<g data-slot="line"><g data-part="capsule" transform="${k.translateAlong(P, [PATH.start, 0, 0])}">${capsule()}</g></g>`,
    selector(),
    `<path data-part="pointer" class="iso-line" data-tone="lit" data-free="start" style="stroke-width:1.6" d="${pointerD(1)}"/>`,
    troughY(SEL[0], SEL[1] + SEL_R, PATH.front + 6),
    `<g data-slot="front"></g>`,
    dock(DOCK_FRONT, "lamp-attacker"),
  ],
});

const keyD = (u) => {
  const a = (u * Math.PI) / 2;
  const kx = SAFE.x + SAFE.w + 0.2;
  return k.segment([kx, SAFE.y + 10 - Math.cos(a) * 3.4, 20 - Math.sin(a) * 3.4], [kx, SAFE.y + 10 + Math.cos(a) * 3.4, 20 + Math.sin(a) * 3.4], P);
};

const live = `
const P = ${JSON.stringify(P)};
const PATH = ${JSON.stringify(PATH)}, SEL = ${JSON.stringify(SEL)}, SEL_R = ${SEL_R}, SEL_TOP = ${SEL_TOP}, SAFE = ${JSON.stringify(SAFE)};
const SLIP_TO = ${JSON.stringify([0, 1, 2].map((i) => [PATH.start - (DRAWER.x + 15), -6 - (SAFE_FACE - 4), CAPSULE_Z + 5.6 - (DRAWER_Z[i] + DRAWER.h)]))};
const T = { unlock: [0.3, 0.9], drawers: [1.0, 1.6], seeds: [1.6, 2.4], pack: [2.5, 3.3], ride: [3.6, 5.0], fork: [5.2, 6.2], reset: 8.6, cycle: 10 };
const pointerD = ${pointerD.toString().replace(/k\./g, "")};
const keyD = ${keyD.toString().replace(/k\./g, "")};

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const capsule = part("capsule"), payload = part("payload"), pointer = part("pointer"), key = part("key");
const drawers = [0, 1, 2].map((i) => part("drawer-" + i)), slips = [0, 1, 2].map((i) => part("slip-" + i));
const lamps = { unlock: part("lamp-unlock"), posthog: part("lamp-posthog"), attacker: part("lamp-attacker") };
const slots = { back: svg.querySelector('[data-slot="back"]'), line: svg.querySelector('[data-slot="line"]'), front: svg.querySelector('[data-slot="front"]') };

function phaseOf(t, fixed) {
  if (t >= T.reset) return "resetting";
  if (t < T.drawers[0]) return fixed ? "Trust Wallet 2.69 · unlock" : "Trust Wallet 2.68 · unlock";
  if (fixed) return t < T.fork[0] ? "analytics event · no seed in it" : "api_host → PostHog · as usual";
  if (t < T.pack[0]) return "GET_SEED_PHRASE · every wallet";
  if (t < T.ride[0]) return "seed → errorMessage field";
  if (t < T.fork[1]) return "api_host → api.metrics-trustwallet.com";
  return "seed phrases delivered · ~$7M drained";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 8.4,
  steps: [0.2, T.seeds[1], T.pack[1], T.ride[1], T.fork[1] + 0.3],
  label: (fixed) => (fixed ? "Fixed: clean 2.69" : "Apply the fix: update to 2.69"),
  phase: phaseOf,
  draw(t, fixed) {
    const back = 1 - ease(T.reset, T.reset + 0.6, t);
    const unlock = ease(...T.unlock, t) * back;
    key.setAttribute("d", keyD(unlock));
    lamps.unlock.style.opacity = unlock.toFixed(3);
    // 2.68 only: the backdoor opens every wallet and pulls its seed phrase into the capsule
    const open = fixed ? 0 : ease(...T.drawers, t) * (1 - ease(T.pack[1], T.pack[1] + 0.6, t));
    drawers.forEach((d) => d.setAttribute("transform", translateAlong(P, [0, 8 * open, 0])));
    slips.forEach((s, i) => {
      const rise = ease(T.seeds[0] + i * 0.15, T.seeds[0] + i * 0.15 + 0.4, t);
      const go = ease(T.pack[0] + i * 0.1, T.pack[0] + i * 0.1 + 0.6, t);
      const [dx, dy, dz] = SLIP_TO[i];
      s.setAttribute("transform", translateAlong(P, [dx * go, 8 * open * (1 - go) + dy * go, 6 * rise * (1 - go) + dz * go]));
      s.style.opacity = (fixed ? 0 : rise * (1 - ease(T.pack[1] - 0.1, T.pack[1] + 0.1, t))).toFixed(3);
    });
    payload.style.opacity = (fixed ? 0 : ease(T.pack[1] - 0.1, T.pack[1] + 0.1, t) * back).toFixed(3);
    // api_host: the selector is the only part that differs between 2.68 and 2.69
    const to = fixed ? 0 : 1;
    pointer.setAttribute("d", pointerD(to));
    const ride = ease(...T.ride, t), fork = ease(...T.fork, t);
    let x = PATH.start + (PATH.turret - PATH.start) * ride, y = 0, slot = "line";
    let seen = 1 - ease(T.ride[1] - 0.25, T.ride[1], t);
    if (t >= T.fork[0]) {
      x = SEL[0];
      const end = fixed ? PATH.back : PATH.front;
      const startY = fixed ? SEL[1] - 12 : SEL[1] + 12;
      y = startY + (end - startY) * fork - SEL[1];
      slot = fixed ? "back" : "front";
      seen = ease(T.fork[0], T.fork[0] + 0.2, t) * (1 - ease(T.fork[1], T.fork[1] + 0.3, t));
    }
    if (capsule.parentNode !== slots[slot]) slots[slot].appendChild(capsule);
    capsule.setAttribute("transform", translateAlong(P, [x, y, 0]));
    capsule.style.opacity = (seen * back).toFixed(3);
    const arrived = ease(T.fork[1], T.fork[1] + 0.15, t) * back;
    lamps.posthog.style.opacity = (fixed ? arrived : 0).toFixed(3);
    lamps.attacker.style.opacity = (fixed ? 0 : arrived).toFixed(3);
  },
});
`;

writeFigure("trust-wallet-supply-chain-christmas-heist", {
  fig: "Fig 1",
  title: "One init option",
  readout: "Trust Wallet 2.68 · unlock",
  keys: [
    { mark: "lit", label: "api_host selector and the seed slips it carries away" },
    { mark: "raised", label: "Two identical docks: PostHog at the back, the attacker's in front" },
  ],
  caption:
    "The backdoor in 4482.js reused the extension's own PostHog analytics. On unlock it called GET_SEED_PHRASE for every wallet, put each phrase in the errorMessage field of an ordinary event, and changed one init option, api_host, to api.metrics-trustwallet.com. No new channel was built; the existing one was pointed elsewhere. Version 2.69 removed it.",
  svg,
  stageLabel: "Trust Wallet telemetry bench. Arrow keys step through the run; Space applies or removes the fix.",
  live,
  css: DOCKBAY_CSS,
});
