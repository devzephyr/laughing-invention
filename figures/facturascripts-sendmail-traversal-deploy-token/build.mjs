// Fig: FacturaScripts chain (GHSA-grw9-xvv2-5623, CVSS 9.9; GHSA-jrgg-j699-qm3h, CVSS 7.5; fixed in 2026.7).
// The mail attachment arm climbs ../../../ out of MyFiles/Tmp/Email/ and takes config.php. Its database
// credentials set the Deploy token wheels, md5(name . user . password . date('Y-m-d H')) in server time,
// and the cut key turns off every plugin. The fix: realpath() must stay inside the Email folder.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, planeOf, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- World layout ----
const RACK = { x: -122, y: -64, w: 46, d: 18, r: 1.5 };
const SHELF_Z = [6, 18, 30, 42]; // Email/, Tmp/, MyFiles/, the install root with config.php
const SHELF_T = 1.6;
const RACK_TOP = 52;
const RAIL = [-70, -55];
const ARM_LEVEL_Z = SHELF_Z.map((z) => z + SHELF_T + 4);
const CARD = { x: -108, y: -60, w: 12, d: 8 };
const TUBE_Y = -32;
const TUBE = { x: -74, y: TUBE_Y - 2.5, w: 52, d: 5, r: 2 };
const STATION = { x: -24, y: -42, w: 54, d: 24, r: 2 };
const STATION_TOP = 8;
const WHEELS = [-14, -1, 12, 25];
const WHEEL_Y = -30;
const WHEEL_R = 5;
const PANEL = { x: 50, y: -56, w: 46, d: 16, r: 2 };
const PANEL_TOP = 46;
const PANEL_FACE = PANEL.y + PANEL.d;
const BREAKERS = [58, 65, 72, 79, 86];
const BREAKER_Z = 28;
const KEY_PATH = { y: PANEL_FACE + 2.6, from: 32, to: 64 };
const KEY_Z = 9;

// ---- Parts ----
function rackBack() {
  const out = [S(k.slabOf({ ...RACK, d: 2 }, 0, RACK_TOP, P, 2, 0.5), { tone: "mid" })];
  for (const x of [RACK.x, RACK.x + RACK.w - 3]) out.push(S(k.slabOf({ x, y: RACK.y, w: 3, d: RACK.d, r: 0.5 }, 0, RACK_TOP, P, 2, 0.3), { tone: "mid" }));
  return out.join("");
}

function shelf(level) {
  const z = SHELF_Z[level];
  const plan = { x: RACK.x + 3, y: RACK.y + 2, w: RACK.w - 6, d: RACK.d - 2, r: 0.4 };
  const out = [S(k.slabOf(plan, z, SHELF_T, P, 2, 0.3), { tone: "mid" })];
  // Files on the shelf: folders lying flat, each with a tab
  const files = level === 3 ? [RACK.x + 30] : [RACK.x + 8, RACK.x + 22];
  for (const x of files) {
    out.push(S(k.slabOf({ x, y: RACK.y + 5, w: 11, d: 8, r: 0.4 }, z + SHELF_T, 1.4, P, 2), { tone: "mid", crease: "none" }));
    out.push(L(k.lineOnTop([x + 2, RACK.y + 8], [x + 7, RACK.y + 8], z + SHELF_T + 1.4, P), { tone: "lo", free: true }));
  }
  return out.join("");
}

const configCard = () =>
  [
    S(k.slabOf({ ...CARD, r: 0.5 }, 0, 1.6, P, 2), { tone: "hi", crease: "lo", lit: true }),
    k.faceTextSvg(k.topMatrix([CARD.x + 1.4, CARD.y + 5.2], 1.6, P, "x"), "config", { size: 2.4, tone: "hi" }),
  ].join("");

function railPost() {
  return [
    S(k.cylinder(RAIL[0], RAIL[1], 3.4, 0, 2, P, 20), { tone: "mid" }),
    S(k.cylinder(RAIL[0], RAIL[1], 1.6, 2, RACK_TOP, P, 14), { tone: "mid", crease: "none" }),
    S(k.cylinder(RAIL[0], RAIL[1], 2.6, RACK_TOP + 2, 2, P, 18), { tone: "mid" }),
  ].join("");
}

// The arm is built at z = 0 and lifted to its level; it reaches back into the rack over the shelf
const arm = () =>
  [
    S(k.slabOf({ x: RAIL[0] - 4, y: RAIL[1] - 4, w: 8, d: 8, r: 1 }, -2, 5, P, 2, 0.4), { tone: "mid" }),
    S(k.slabOf({ x: CARD.x + 4, y: RAIL[1] - 1.2, w: RAIL[0] - 4 - CARD.x - 4, d: 2.4, r: 0.6 }, 1, 2, P, 2), { tone: "mid", crease: "none" }),
    S(k.cylinder(CARD.x + 6, RAIL[1], 1.6, -1, 2, P, 12), { tone: "hi", crease: "lo" }),
  ].join("");

function tube() {
  return [
    S(k.slabOf(TUBE, 0, 5, P, 3, 0.4), { tone: "lo", inner: L(k.sideSeam(TUBE, 2.5, P, 3), { tone: "faint" }) }),
    S(k.slabOf({ x: TUBE.x - 4, y: TUBE.y - 2, w: 6, d: TUBE.d + 4, r: 1 }, 0, 8, P, 2, 0.4), { tone: "mid" }),
  ].join("");
}

const capsule = () => S(k.slabOf({ x: -5, y: TUBE_Y - 2, w: 10, d: 4, r: 1.8 }, 5, 4, P, 3, 0.4), { tone: "hi", crease: "lo" });

function station() {
  const out = [S(k.slabOf(STATION, 0, STATION_TOP, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(STATION, 3, P, 4), { tone: "faint" }) })];
  WHEELS.forEach((x, i) => {
    out.push(S(k.cylinder(x, WHEEL_Y, WHEEL_R, STATION_TOP, 3, P, 36, 0.4), { tone: i === 2 ? "hi" : "mid", crease: "lo" }));
    out.push(L(k.knurl(x, WHEEL_Y, WHEEL_R, STATION_TOP + 0.6, STATION_TOP + 3, 26, P, 0.3), { tone: "lo" }));
    const t = k.radialTicks(x, WHEEL_Y, WHEEL_R - 0.8, i === 3 ? 24 : 16, i === 3 ? 6 : 4, STATION_TOP + 3, [0.7, 1.4], P);
    out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  });
  // Key guide from the station to the panel
  out.push(S(k.slabOf({ x: STATION.x + STATION.w, y: KEY_PATH.y - 2.5, w: KEY_PATH.to - STATION.x - STATION.w + 4, d: 5, r: 0.8 }, 0, KEY_Z - 0.4, P, 2, 0.3), { tone: "lo", crease: "none" }));
  return out.join("");
}

const needleD = (x, turn) => {
  const a = turn * Math.PI * 2;
  return k.lineOnTop([x - Math.sin(a) * 1, WHEEL_Y + Math.cos(a) * 1], [x + Math.sin(a) * (WHEEL_R - 1.2), WHEEL_Y - Math.cos(a) * (WHEEL_R - 1.2)], STATION_TOP + 3.1, P);
};

const key = () =>
  [
    S(k.slabOf({ x: -6, y: KEY_PATH.y - 1.5, w: 12, d: 3, r: 0.6 }, 0, 1.2, P, 2), { tone: "hi", crease: "lo" }),
    ...[-3, 0, 3].map((dx, i) => S(k.slabOf({ x: dx - 0.8, y: KEY_PATH.y - 1.5 - 1.2 - i * 0.4, w: 1.6, d: 1.2 + i * 0.4, r: 0.2 }, 0, 1.2, P, 1), { tone: "hi", crease: "none" })),
    S(k.cylinder(6.5, KEY_PATH.y, 2.6, 0, 1.2, P, 18), { tone: "hi", crease: "lo" }),
  ].join("");

function panel() {
  const rules = L(k.sideSeam(PANEL, BREAKER_Z + 8, P, 4) + k.sideSeam(PANEL, BREAKER_Z - 8, P, 4), { tone: "lo" });
  const out = [S(k.slabOf(PANEL, 0, PANEL_TOP, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(PANEL, 4, P, 4), { tone: "faint" }) + rules })];
  const face = [];
  for (const x of BREAKERS) face.push(`<rect class="fs-breaker" x="${x - 2.4}" y="${-(BREAKER_Z + 5)}" width="4.8" height="10" rx="0.6"/>`);
  face.push(`<rect class="fs-slot" x="${KEY_PATH.to - 6}" y="${-(KEY_Z + 2)}" width="12" height="3" rx="1"/>`);
  out.push(`<g transform="${planeOf(PANEL_FACE)}">${face.join("")}</g>`);
  out.push(lamp(PANEL.x + PANEL.w - 8, PANEL.y + 8, PANEL_TOP, "lamp-online"));
  return out.join("");
}

const leversD = (offs) =>
  BREAKERS.map((x, i) => `M${x} ${-BREAKER_Z}L${x} ${-(BREAKER_Z + (offs[i] ? -3.6 : 3.6))}`).join("");

function stop() {
  // The fix: realpath() must stay inside MyFiles/Tmp/Email, so the rail has a collar just above the Email level
  const z = ARM_LEVEL_Z[0] + 4;
  return [
    S(k.cylinder(RAIL[0], RAIL[1], 3.2, z, 2.4, P, 18, 0.4), { tone: "hi", crease: "lo" }),
    D([at([RAIL[0] + 3.2, RAIL[1], z + 1.2])], { size: 0.5 }),
  ].join("");
}

// ---- Assemble: the arm moves between per-level slots, so the shelf above it stays in front ----
const slots = [];
for (let level = 0; level < 4; level++) {
  slots.push(shelf(level));
  if (level === 3) slots.push(`<g data-part="card" transform="${k.translateAlong(P, [0, 0, SHELF_Z[3] + SHELF_T + 1.4])}">${configCard()}</g>`);
  slots.push(`<g data-slot="${level}"></g>`);
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A three-station chain. A file rack with four shelves, Email at the bottom and the install root with config.php at the top, has a retrieval arm on a rail. A pneumatic tube runs to a station of four code wheels, which cut a key for the Deploy panel, whose row of plugin breakers sits under an online lamp.",
  body: [
    deck("GHSA-GRW9"),
    rackBack(),
    ...slots,
    railPost(),
    `<g data-part="fix" style="opacity:0">${stop()}</g>`,
    `<g data-part="arm" transform="${k.translateAlong(P, [0, 0, ARM_LEVEL_Z[0]])}">${arm()}</g>`,
    tube(),
    `<g data-part="capsule" style="opacity:0">${capsule()}</g>`,
    station(),
    ...WHEELS.map((x, i) => `<path data-part="needle-${i}" class="iso-line" data-tone="${i === 2 ? "lit" : "hi"}" style="stroke-width:${i === 2 ? 1.3 : 1}" data-free="start" d="${needleD(x, 0)}"/>`),
    panel(),
    `<g transform="${planeOf(PANEL_FACE)}"><path data-part="levers" class="iso-line" data-tone="hi" style="stroke-width:1.4" d="${leversD([0, 0, 0, 0, 0])}"/></g>`,
    `<g data-part="key" style="opacity:0">${key()}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const LEVEL_Z = ${JSON.stringify(ARM_LEVEL_Z)}, SHELF_Z = ${JSON.stringify(SHELF_Z)}, CARD_Z = ${SHELF_Z[3] + SHELF_T + 1.4};
const WHEELS = ${JSON.stringify(WHEELS)}, WHEEL_Y = ${WHEEL_Y}, WHEEL_R = ${WHEEL_R}, STATION_TOP = ${STATION_TOP};
const TUBE = ${JSON.stringify({ from: -70, to: -20 })}, KEY_PATH = ${JSON.stringify(KEY_PATH)}, KEY_Z = ${KEY_Z};
const BREAKERS = ${JSON.stringify(BREAKERS)}, BREAKER_Z = ${BREAKER_Z};
const CARD_X = ${CARD.x + 6}, RAIL_X = ${RAIL[0]};
const T = { climb: [0.9, 2.4], pick: 2.6, down: [2.9, 3.9], tube: [4.1, 5.1], wheels: [5.2, 6.2], key: [6.3, 7.2], trip: [7.5, 8.1], reset: 10.4, cycle: 12 };
const TARGETS = [0.31, 0.62, 0.17, 0.58]; // name, user, password, server hour
const needleD = ${needleD.toString().replace(/k\./g, "")};
const leversD = ${leversD.toString()};

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const armPart = part("arm"), card = part("card"), capsule = part("capsule"), keyPart = part("key"), levers = part("levers"), fix = part("fix"), online = part("lamp-online");
const needles = WHEELS.map((_, i) => part("needle-" + i));
const slots = [0, 1, 2, 3].map((i) => svg.querySelector('[data-slot="' + i + '"]'));

function armZ(t, fixed) {
  if (fixed) {
    // The collar stops the first ../ : a short climb and a bounce back
    const bump = ease(T.climb[0], T.climb[0] + 0.25, t) * (1 - ease(T.climb[0] + 0.25, T.climb[0] + 0.6, t));
    return LEVEL_Z[0] + 3 * bump;
  }
  const up = ease(...T.climb, t) * 3;
  const level = up * (1 - ease(...T.down, t));
  const lo = Math.floor(level), hi = Math.min(3, lo + 1);
  return LEVEL_Z[lo] + (LEVEL_Z[hi] - LEVEL_Z[lo]) * (level - lo);
}

function phaseOf(t, fixed) {
  if (t >= T.reset) return "resetting";
  if (t < T.climb[0]) return "fileName=../../../config.php";
  if (fixed) return "realpath outside Email/ · not attached";
  if (t < T.pick) return "../ ×3 · out of MyFiles/Tmp/Email";
  if (t < T.wheels[0]) return "config.php emailed · FS_DB_PASS";
  if (t < T.key[0]) return "md5(name.user.pass.date('Y-m-d H'))";
  if (t < T.trip[0]) return "/Deploy?action=disable-plugins";
  return "every plugin off · no session";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 10.2,
  steps: [0.2, T.climb[1], T.down[1], T.tube[1], T.wheels[1], T.trip[1] + 0.4],
  label: (fixed) => (fixed ? "Fixed: realpath stays in Email/" : "Apply the fix: check realpath"),
  phase: phaseOf,
  draw(t, fixed) {
    const back = 1 - ease(T.reset, T.reset + 0.6, t);
    fix.style.opacity = fixed ? "1" : "0";
    const z = armZ(t, fixed);
    let level = 0;
    for (let i = 0; i < 4; i++) if (z >= LEVEL_Z[i] - 0.5) level = i;
    if (armPart.parentNode !== slots[level]) slots[level].appendChild(armPart);
    armPart.setAttribute("transform", translateAlong(P, [0, 0, z]));
    // The config card rides the arm from the moment it is picked until it drops into the capsule
    const carried = !fixed && t >= T.pick && t < T.tube[0];
    if (carried) {
      if (card.parentNode !== armPart) armPart.appendChild(card);
      card.setAttribute("transform", translateAlong(P, [0, 0, 1.6]));
    } else {
      if (card.nextElementSibling !== slots[3]) slots[3].parentNode.insertBefore(card, slots[3]);
      card.setAttribute("transform", translateAlong(P, [0, 0, CARD_Z]));
    }
    card.style.opacity = (fixed ? 1 : t < T.tube[0] ? 1 : ease(T.reset, T.reset + 0.4, t)).toFixed(3);
    const travel = fixed ? 0 : ease(...T.tube, t);
    capsule.setAttribute("transform", translateAlong(P, [TUBE.from + (TUBE.to - TUBE.from) * travel, 0, 0]));
    capsule.style.opacity = (fixed ? 0 : ease(T.tube[0] - 0.15, T.tube[0], t) * (1 - ease(T.tube[1], T.tube[1] + 0.3, t))).toFixed(3);
    const set = fixed ? 0 : ease(...T.wheels, t) * back;
    needles.forEach((n, i) => n.setAttribute("d", needleD(WHEELS[i], TARGETS[i] * set)));
    const kx = KEY_PATH.from + (KEY_PATH.to - KEY_PATH.from) * ease(...T.key, t);
    keyPart.setAttribute("transform", translateAlong(P, [kx, 0, KEY_Z]));
    keyPart.style.opacity = (fixed ? 0 : ease(T.key[0], T.key[0] + 0.2, t) * back).toFixed(3);
    const offs = BREAKERS.map((_, i) => !fixed && ease(T.trip[0] + i * 0.1, T.trip[0] + i * 0.1 + 0.15, t) * back > 0.5);
    levers.setAttribute("d", leversD(offs));
    online.style.opacity = (fixed || t < T.trip[0] + 0.5 || t >= T.reset ? 1 : 0).toString();
  },
});
`;

writeFigure("facturascripts-sendmail-traversal-deploy-token", {
  fig: "Fig 1",
  title: "One email, one GET",
  readout: "fileName=../../../config.php",
  keys: [
    { mark: "lit", label: "config.php card and the password wheel it sets" },
    { mark: "raised", label: "Shelves: Email/, Tmp/, MyFiles/, the install root" },
  ],
  caption:
    "SendMail::setAttachment() joins the attachments folder and the file name without canonicalising, so three ../ climb to config.php and it is emailed out. The Deploy token is md5(db_name . db_user . db_password . date('Y-m-d H')) in the server's timezone, so the leaked credentials mint a valid one and /Deploy?action=disable-plugins runs with no session. 2026.7 requires realpath() to land inside MyFiles/Tmp/Email/.",
  svg,
  stageLabel: "FacturaScripts traversal and Deploy token chain. Arrow keys step through the run; Space applies or removes the fix.",
  live,
  css: DOCKBAY_CSS + `.fs-breaker{fill:var(--db-well);stroke:var(--anatomy-mid);stroke-width:.5}.fs-slot{fill:var(--db-flap)}`,
});
