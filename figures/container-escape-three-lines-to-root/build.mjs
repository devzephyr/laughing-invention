// Fig: NVIDIAScape (CVE-2025-23266, CVSS 9.0, fixed in NVIDIA Container Toolkit 1.17.8).
// The createContainer hook (nvidia-ctk) runs on the host with host privileges, inherits the container's
// environment, and starts in the container's root filesystem. So LD_PRELOAD=/proc/self/cwd/poc.so makes it
// load the image's own library as host root. The post does not describe the 1.17.8 change, so there is no
// fix state here: the figure shows only the three-line Dockerfile working.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, planeOf, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- Model, from the post ----
const DOCKERFILE = ["FROM busybox", "ENV LD_PRELOAD=/proc/self/cwd/poc.so", "ADD poc.so /"];

// ---- World layout ----
const POD = { x: -118, y: -28, w: 96, d: 48, r: 2 };
const POD_FLOOR = 4;
const WALL = 3;
const WALL_TOP = 24;
const POD_FACE = POD.y + POD.d;
const LINE_Y = -4; // the boom, the module and the socket all sit on this line
const MODULE = { x: -84, w: 9, d: 7, h: 5 };
const CABINET = { x: 14, y: -24, w: 36, d: 36, r: 2 };
const CABINET_TOP = 40;
const SOCKET_X = 32;
const BOOM = { x: -124, y: LINE_Y - 2, w: 176, d: 4, r: 1 };
const BOOM_Z = 46;
const HEAD = { rest: BOOM_Z - 8, grip: POD_FLOOR + MODULE.h + 1.6, carry: WALL_TOP + 10, socket: CABINET_TOP + MODULE.h + 1.6 };
const CARRIAGE_X = { home: SOCKET_X, pod: MODULE.x + MODULE.w / 2 };

// ---- Parts ----
function podBack() {
  const out = [S(k.slabOf(POD, 0, POD_FLOOR, P, 3, 0.8), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(POD, WALL + 1.5), POD_FLOOR, P, 3), { tone: "faint" }));
  // Back and left walls, drawn before anything inside the pod
  out.push(S(k.slabOf({ x: POD.x, y: POD.y, w: POD.w, d: WALL, r: 0.6 }, POD_FLOOR, WALL_TOP - POD_FLOOR, P, 2, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: POD.x, y: POD.y, w: WALL, d: POD.d, r: 0.6 }, POD_FLOOR, WALL_TOP - POD_FLOOR, P, 2, 0.4), { tone: "mid" }));
  // Image layers: a few files lying in the root filesystem
  for (const [x, y] of [[-108, -18], [-50, -16], [-104, 6]]) out.push(S(k.slabOf({ x, y, w: 10, d: 7, r: 0.4 }, POD_FLOOR, 1.2, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}

function podFront() {
  const out = [];
  out.push(S(k.slabOf({ x: POD.x + POD.w - WALL, y: POD.y, w: WALL, d: POD.d, r: 0.6 }, POD_FLOOR, WALL_TOP - POD_FLOOR, P, 2, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: POD.x, y: POD_FACE - WALL, w: POD.w, d: WALL, r: 0.6 }, POD_FLOOR, WALL_TOP - POD_FLOOR, P, 2, 0.4), { tone: "mid" }));
  // The image's Dockerfile as the pod's manifest plate
  const plate = [`<rect class="ce-plate" x="${POD.x + 4}" y="${-(WALL_TOP - 2)}" width="${POD.w - 8}" height="${WALL_TOP - POD_FLOOR - 4}" rx="1"/>`];
  DOCKERFILE.forEach((line, i) => plate.push(`<text class="ce-text" x="${POD.x + 7}" y="${-(WALL_TOP - 7.4 - i * 5.4)}" font-size="3.6">${line}</text>`));
  plate.push(`<rect data-part="env-mark" class="ce-mark" x="${POD.x + 7}" y="${-(WALL_TOP - 8.8 - 5.4)}" width="${0.6 * 3.6 * DOCKERFILE[1].length}" height="0.8" style="opacity:0"/>`);
  out.push(`<g transform="${planeOf(POD_FACE)}">${plate.join("")}</g>`);
  out.push(lamp(POD.x + 7, POD.y + 7, WALL_TOP, "lamp-pod"));
  return out.join("");
}

function cabinet() {
  const out = [S(k.slabOf(CABINET, 0, CABINET_TOP, P, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(CABINET, 6, P, 4) + k.sideSeam(CABINET, CABINET_TOP - 6, P, 4), { tone: "faint" }) })];
  // The socket on top where a loaded library ends up
  out.push(L(k.planOutline({ x: SOCKET_X - 6, y: LINE_Y - 5, w: 12, d: 10, r: 1 }, CABINET_TOP, P, 2), { tone: "lo" }));
  out.push(D(k.dotGrid(CABINET.x + 4, CABINET.y + 4, 4, 3, 2.6, CABINET_TOP, P), { size: 0.42, tone: "lo" }));
  out.push(lamp(CABINET.x + CABINET.w - 7, CABINET.y + CABINET.d - 7, CABINET_TOP, "lamp-root"));
  return out.join("");
}

function boom() {
  return [
    S(k.slabOf({ x: BOOM.x - 1, y: LINE_Y - 3, w: 6, d: 6, r: 1 }, 0, BOOM_Z, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf({ x: SOCKET_X + 14, y: LINE_Y - 3, w: 6, d: 6, r: 1 }, CABINET_TOP, BOOM_Z - CABINET_TOP, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf(BOOM, BOOM_Z, 3, P, 2, 0.4), { tone: "mid" }),
    D([BOOM.x + 3, SOCKET_X + 17].map((x) => at([x, LINE_Y, BOOM_Z + 3])), { size: 0.45 }),
  ].join("");
}

const carriage = () => S(k.slabOf({ x: -5, y: LINE_Y - 4, w: 10, d: 8, r: 1 }, BOOM_Z - 2, 6, P, 2, 0.4), { tone: "mid" });

// The hook's head, built with its underside at z = 0
const head = () =>
  [
    S(k.slabOf({ x: -4.5, y: LINE_Y - 4, w: 9, d: 8, r: 1 }, MODULE.h, 3, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf({ x: -4.5, y: LINE_Y - 4, w: 1.4, d: 8, r: 0.3 }, 0, MODULE.h, P, 1), { tone: "mid", crease: "none" }),
    S(k.slabOf({ x: 3.1, y: LINE_Y - 4, w: 1.4, d: 8, r: 0.3 }, 0, MODULE.h, P, 1), { tone: "mid", crease: "none" }),
  ].join("");

// poc.so: a cartridge built with its underside at z = 0, centred on x = 0
const module = () =>
  [
    S(k.slabOf({ x: -MODULE.w / 2 + 1.4, y: LINE_Y - MODULE.d / 2, w: MODULE.w - 2.8, d: MODULE.d, r: 0.6 }, 0, MODULE.h, P, 2, 0.3), { tone: "hi", crease: "lo", lit: true }),
    D([at([-1.2, LINE_Y, MODULE.h]), at([1.2, LINE_Y, MODULE.h])], { size: 0.45, tone: "lo" }),
  ].join("");

// ---- Assemble ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A sealed pod, the container, holds a small cartridge, poc.so, on its floor, with its three-line Dockerfile on the front plate. On the host side a cabinet carries a boom with a hook carriage. The hook runs over the pod, reads the inherited LD_PRELOAD, drops into the pod's root filesystem, lifts the cartridge and loads it into the host cabinet.",
  body: [
    deck("CVE-2025-23266"),
    podBack(),
    `<g data-slot="inside"><path data-part="cable" class="iso-line" data-tone="mid" d=""/><g data-part="module">${module()}</g><g data-part="head">${head()}</g></g>`,
    podFront(),
    cabinet(),
    `<g data-slot="outside"></g>`,
    boom(),
    `<g data-part="carriage">${carriage()}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const LINE_Y = ${LINE_Y}, BOOM_Z = ${BOOM_Z}, HEAD = ${JSON.stringify(HEAD)}, X = ${JSON.stringify(CARRIAGE_X)};
const MODULE_REST = [${MODULE.x + MODULE.w / 2}, 0, ${POD_FLOOR}], POD_EDGE = ${POD.x + POD.w};
const T = { start: [0.3, 0.8], out: [1.0, 2.2], env: [2.4, 2.8], down: [3.2, 4.0], grip: 4.2, up: [4.4, 5.2], home: [5.3, 6.3], drop: [6.3, 6.8], root: [6.9, 7.1], reset: 8.6, back: [8.6, 9.6], cycle: 10 };

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const carriage = part("carriage"), head = part("head"), modulePart = part("module"), cable = part("cable"), envMark = part("env-mark");
const lamps = { pod: part("lamp-pod"), root: part("lamp-root") };
const slots = { inside: svg.querySelector('[data-slot="inside"]'), outside: svg.querySelector('[data-slot="outside"]') };
const parts = [cable, modulePart, head];

function phaseOf(t) {
  if (t >= T.reset) return "resetting";
  if (t < T.out[0]) return "docker run --gpus all";
  if (t < T.env[0]) return "createContainer hook · host side";
  if (t < T.down[0]) return "inherits LD_PRELOAD";
  if (t < T.up[0]) return "cwd = container rootfs";
  if (t < T.root[0]) return "loads poc.so · as host root";
  return "root on the host";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 8.4,
  steps: [0.2, T.out[1], T.env[1], T.down[1], T.home[1], T.root[1] + 0.3],
  label: () => "",
  phase: phaseOf,
  draw(t) {
    const fade = 1 - ease(T.reset, T.reset + 0.4, t);
    lamps.pod.style.opacity = (ease(...T.start, t) * fade).toFixed(3);
    envMark.style.opacity = (ease(...T.env, t) * fade).toFixed(3);
    let x = X.home + (X.pod - X.home) * ease(...T.out, t);
    x += (X.home - X.pod) * ease(...T.home, t);
    let z = HEAD.rest + (HEAD.grip - HEAD.rest) * ease(...T.down, t);
    z += (HEAD.carry - HEAD.grip) * ease(...T.up, t);
    z += (HEAD.socket - HEAD.carry) * ease(...T.drop, t);
    if (t >= T.reset) { x = X.home; z = HEAD.socket + (HEAD.rest - HEAD.socket) * ease(...T.back, t); }
    carriage.setAttribute("transform", translateAlong(P, [x, 0, 0]));
    head.setAttribute("transform", translateAlong(P, [x, 0, z]));
    // Inside the pod's walls the hook is drawn behind the front walls; above or beyond them, in front
    const target = x < POD_EDGE && z < ${WALL_TOP} ? slots.inside : slots.outside;
    for (const p of parts) if (p.parentNode !== target) target.appendChild(p);
    cable.setAttribute("d", segment([x, LINE_Y, BOOM_Z - 2], [x, LINE_Y, z + ${MODULE.h + 3}], P));
    const held = t >= T.grip && t < T.reset;
    const m = held ? [x, 0, z] : MODULE_REST;
    modulePart.setAttribute("transform", translateAlong(P, m));
    modulePart.style.opacity = (t >= T.reset ? 1 - fade : 1).toFixed(3);
    lamps.root.style.opacity = (ease(...T.root, t) * fade).toFixed(3);
  },
});
`;

writeFigure("container-escape-three-lines-to-root", {
  fig: "Fig 1",
  title: "Three lines to root",
  readout: "docker run --gpus all",
  keys: [
    { mark: "lit", label: "poc.so, shipped inside the image" },
    { mark: "raised", label: "nvidia-ctk createContainer hook, running on the host" },
  ],
  caption:
    "The NVIDIA Container Toolkit's createContainer hook runs with host privileges, inherits the container's environment and starts in the container's root filesystem, so LD_PRELOAD=/proc/self/cwd/poc.so loads the image's own library into a host-root process. Fixed in toolkit 1.17.8; the post does not describe that change, so this figure shows only the bug.",
  svg,
  stageLabel: "NVIDIAScape container escape. Arrow keys step through the run.",
  live,
  fix: false,
  css: DOCKBAY_CSS + `.ce-plate{fill:var(--db-flap)}.ce-text{fill:var(--db-flap-text);font-family:var(--anatomy-mono)}.ce-mark{fill:var(--anatomy-lit)}`,
});
