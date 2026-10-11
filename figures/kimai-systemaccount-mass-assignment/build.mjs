// Fig: one boolean and you vanish (Kimai 2.56.0, fixed in 2.57.0 via PR #5929, CWE-915).
// Five profile fields sit under covers chained to one lock; systemAccount has no cover. A ROLE_TEAMLEAD
// request flips it, and the user's tag drops out of all four report windows that filter system accounts.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, recess, planeOf, railSvg, cartSvg, CART_TOP, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- Model, from the post ----
const FIELDS = ["roles", "active", "preferences", "supervisor", "password reset", "systemAccount"];
const REPORTS = 4; // ReportUsersWeek/Month/Year and CustomerMonthlyProjects all skip system accounts

// ---- World layout ----
const BOARD = { x: -112, y: -64, w: 204, d: 12, r: 2 };
const BOARD_TOP = 50;
const FACE_Y = BOARD.y + BOARD.d;
const WIN = { w: 40, gap: 8, x0: -104, z0: 14, z1: 44, depth: 4 };
const TAG = { w: 30, h: 5, rows: [38, 31.5, 25, 18.5], you: 2 };
const CONSOLE = { x: -92, y: -16, w: 152, d: 26, r: 2 };
const CONSOLE_TOP = 12;
const SWITCH_Y = -3;
const switchX = (i) => -78 + i * 24;
const COVER_TOP = CONSOLE_TOP + 10.6;
const LEVER = { base: CONSOLE_TOP + 2.6, len: 6.2, tilt: 28 };
const RAIL_Y = 28;
const STOPS = { start: -100, first: switchX(0), last: switchX(5) };
const ARM_Z = 30;
const FINGER = { rest: COVER_TOP + 3.4, onCover: COVER_TOP + 0.2, onLever: LEVER.base + 4.4 };

// ---- Parts ----
function board() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(BOARD, 2), 0, 6, P)}"/>`];
  out.push(S(k.slabOf(BOARD, 0, BOARD_TOP, P, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(BOARD, 4, P, 4) + k.sideSeam(BOARD, BOARD_TOP - 3, P, 4), { tone: "faint" }) }));
  for (let w = 0; w < REPORTS; w++) {
    const x0 = WIN.x0 + w * (WIN.w + WIN.gap);
    const cx = x0 + WIN.w / 2;
    const tags = TAG.rows.map((z, row) => {
      const you = row === TAG.you;
      const tag = `<rect class="${you ? "ks-you" : "ks-tag"}" x="${cx - TAG.w / 2}" y="${-(z + TAG.h / 2)}" width="${TAG.w}" height="${TAG.h}" rx="0.6"/>` +
        `<path class="iso-line" data-tone="${you ? "faint" : "lo"}" data-free="" d="M${cx - TAG.w / 2 + 3} ${-z}H${cx - TAG.w / 2 + 3 + (you ? 16 : 10 + ((row * 7 + w * 3) % 9))}"/>`;
      return you ? `<g data-part="you-${w}">${tag}</g>` : tag;
    });
    out.push(recess({ x0, x1: x0 + WIN.w, z0: WIN.z0, z1: WIN.z1, r: 1.6, depth: WIN.depth }, FACE_Y, tags.join("")));
    // A stud above each window where its report's name plate would hang
    out.push(D([at([cx - 6, FACE_Y, WIN.z1 + 3]), at([cx + 6, FACE_Y, WIN.z1 + 3])], { size: 0.42 }));
  }
  return out.join("");
}

function consoleBox() {
  const out = [S(k.slabOf(CONSOLE, 0, CONSOLE_TOP, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(CONSOLE, 4, P, 4), { tone: "faint" }) })];
  out.push(L(k.planOutline(k.insetPlan(CONSOLE, 3), CONSOLE_TOP, P, 4), { tone: "faint" }));
  for (let i = 0; i < FIELDS.length; i++) {
    const x = switchX(i);
    out.push(S(k.slabOf({ x: x - 5, y: SWITCH_Y - 4, w: 10, d: 8, r: 1 }, CONSOLE_TOP, 0.6, P, 3), { tone: "lo", crease: "none" }));
    out.push(D([at([x - 3.4, SWITCH_Y - 2.6, CONSOLE_TOP + 0.6]), at([x + 3.4, SWITCH_Y + 2.6, CONSOLE_TOP + 0.6])], { size: 0.35, tone: "lo" }));
    out.push(S(k.cylinder(x, SWITCH_Y, 1.8, CONSOLE_TOP + 0.6, 2, P, 16), { tone: "mid" }));
  }
  // Key lock at the left end of the console: the chain's anchor
  out.push(S(k.slabOf({ x: CONSOLE.x + 3, y: SWITCH_Y - 4, w: 7, d: 8, r: 1 }, CONSOLE_TOP, 5, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(CONSOLE.x + 6.5, SWITCH_Y, 2, CONSOLE_TOP + 5, 1.2, P, 16), { tone: "hi", crease: "lo" }));
  return out.join("");
}

const leverD = (x, on) => {
  const a = ((on * 2 - 1) * LEVER.tilt * Math.PI) / 180;
  return k.segment([x, SWITCH_Y, LEVER.base], [x, SWITCH_Y + Math.sin(a) * LEVER.len, LEVER.base + Math.cos(a) * LEVER.len], P);
};

function cover(i) {
  const x = switchX(i);
  const plan = { x: x - 5, y: SWITCH_Y - 5, w: 10, d: 10, r: 1.2 };
  return [
    S(k.slabOf(plan, CONSOLE_TOP + 0.6, COVER_TOP - CONSOLE_TOP - 0.6, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(plan, CONSOLE_TOP + 3, P, 3), { tone: "faint" }) }),
    S(k.cylinder(x, SWITCH_Y, 1.4, COVER_TOP, 1.4, P, 12), { tone: "mid" }),
  ].join("");
}

function chain(from, to) {
  // The lock wire threads the lug on top of each cover
  const points = [[CONSOLE.x + 6.5, SWITCH_Y, CONSOLE_TOP + 6.2], ...Array.from({ length: to - from + 1 }, (_, n) => [switchX(from + n), SWITCH_Y, COVER_TOP + 1.4])];
  const flat = points.slice(from === 0 ? 0 : 1).map((p) => at(p));
  return k.wireSvg(flat[0], flat[flat.length - 1], { via: flat.slice(1, -1), tone: "lo", size: 0.8 });
}

const CABINET = { x: 84, y: -8, w: 28, d: 22, r: 2 };
const CABINET_TOP = 22;
function cabinet() {
  // The database the write lands in: drawers on the near face, cabled from the console
  const face = CABINET.y + CABINET.d;
  const seams = L(k.sideSeam(CABINET, 7, P, 4) + k.sideSeam(CABINET, 14, P, 4), { tone: "lo" });
  const out = [S(k.slabOf(CABINET, 0, CABINET_TOP, P, 4, 0.8), { tone: "mid", inner: seams })];
  for (const z of [3.5, 10.5, 17.5]) out.push(S(k.slabOf({ x: CABINET.x + CABINET.w / 2 - 4, y: face, w: 8, d: 1.4, r: 0.5 }, z - 0.8, 1.6, P, 2), { tone: "mid", crease: "none" }));
  out.push(D(k.corners(CABINET, 2.6).map(([x, y]) => at([x, y, CABINET_TOP])), { size: 0.42 }));
  const from = at([CONSOLE.x + CONSOLE.w, SWITCH_Y + 6, 4]);
  const via = [at([CONSOLE.x + CONSOLE.w + 6, SWITCH_Y + 6, 0.2]), at([CABINET.x - 4, SWITCH_Y + 6, 0.2])];
  out.push(k.wireSvg(from, at([CABINET.x, SWITCH_Y + 6, 4]), { via, tone: "mid" }));
  out.push(lamp(CABINET.x + CABINET.w / 2, CABINET.y + 7, CABINET_TOP, "lamp-saved"));
  return out.join("");
}

function actuator() {
  // Post and arm on the cart; the finger is a separate part that moves in z
  return [
    S(k.cylinder(0, RAIL_Y - 6, 3, CART_TOP, 2, P, 20), { tone: "mid" }),
    S(k.cylinder(0, RAIL_Y - 6, 1.8, CART_TOP + 2, ARM_Z - CART_TOP - 2, P, 16), { tone: "mid", crease: "none" }),
    S(k.slabOf({ x: -2.5, y: SWITCH_Y - 2.5, w: 5, d: RAIL_Y - 6 - SWITCH_Y + 5, r: 1.2 }, ARM_Z, 3, P, 2, 0.4), { tone: "mid" }),
    D([at([0, RAIL_Y - 6, ARM_Z + 3]), at([0, SWITCH_Y, ARM_Z + 3])], { size: 0.42 }),
  ].join("");
}

const finger = () =>
  [
    S(k.cylinder(0, SWITCH_Y, 1.1, 2.4, ARM_Z - FINGER.rest - 2.4, P, 12), { tone: "mid", crease: "none" }),
    S(k.cylinder(0, SWITCH_Y, 2.2, 0, 2.4, P, 18, 0.3), { tone: "hi", crease: "lo" }),
  ].join("");

// ---- Assemble ----
const levers = FIELDS.map((_, i) => {
  if (i === 5) return `<g data-part="lever"><path class="iso-line" data-tone="lit" style="stroke-width:1.5" d="${leverD(switchX(i), 0)}"/></g>`;
  return `<path class="iso-line" data-tone="hi" style="stroke-width:1.5" d="${leverD(switchX(i), 0)}"/>`;
});

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A crew roster board with four report windows, each showing the same user's tag, above a console of six toggle switches. Five switches sit under covers chained to a key lock; the sixth, systemAccount, has no cover. A team lead's actuator is turned away by a cover, then flips the bare switch, and the user's tag drops out of all four windows.",
  body: [
    deck("CWE-915"),
    board(),
    consoleBox(),
    levers.slice(0, 5).join(""),
    FIELDS.slice(0, 5).map((_, i) => cover(i)).join(""),
    chain(0, 4),
    levers[5],
    `<g data-part="cover6" style="opacity:0">${cover(5)}${chain(4, 5)}</g>`,
    cabinet(),
    railSvg(-112, 56, RAIL_Y),
    `<g data-part="cart" transform="${k.translateAlong(P, [STOPS.start, 0, 0])}">${cartSvg(RAIL_Y, actuator())}</g>`,
    `<g data-part="finger" transform="${k.translateAlong(P, [STOPS.start, 0, FINGER.rest])}">${finger()}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const STOPS = ${JSON.stringify(STOPS)}, FINGER = ${JSON.stringify(FINGER)}, REPORTS = ${REPORTS};
const LEVER = ${JSON.stringify(LEVER)}, SWITCH_Y = ${SWITCH_Y}, X6 = ${switchX(5)};
const T = { toFirst: [0.3, 1.3], pressFirst: [1.4, 1.8, 2.3], toLast: [2.6, 4.0], pressLast: [4.2, 4.6, 5.2], flip: [4.45, 4.75], drop: [5.3, 6.3], reset: 8.4, home: [8.6, 9.8], cycle: 10 };
const DROP = 22;

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const cart = part("cart"), finger = part("finger"), lever = part("lever").firstElementChild, cover6 = part("cover6"), saved = part("lamp-saved");
const tags = Array.from({ length: REPORTS }, (_, w) => part("you-" + w));
const leverD = (on) => {
  const a = ((on * 2 - 1) * LEVER.tilt * Math.PI) / 180;
  return segment([X6, SWITCH_Y, LEVER.base], [X6, SWITCH_Y + Math.sin(a) * LEVER.len, LEVER.base + Math.cos(a) * LEVER.len], P);
};
// Down, hold, up: the finger's travel during one press
const press = (t, [a, b, c]) => ease(a, b, t) * (1 - ease(b + 0.15, c, t));

function phaseOf(t, fixed) {
  if (t < T.pressFirst[0]) return "ROLE_TEAMLEAD · PATCH /api/users/4";
  if (t < T.toLast[0]) return "roles · guarded";
  if (t < T.pressLast[0]) return '{"systemAccount":true} · 22 bytes';
  if (t >= T.reset) return "resetting";
  if (fixed) return "systemAccount · admin only";
  return t < T.drop[0] ? "HTTP 200 · systemAccount true" : "user 4 · gone from 4 reports";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 8.2,
  steps: [0.2, T.pressFirst[1], T.toLast[1], T.pressLast[2], T.drop[1] + 0.3],
  label: (fixed) => (fixed ? "Fixed: systemAccount needs admin" : "Apply the fix: guard systemAccount"),
  phase: phaseOf,
  draw(t, fixed) {
    const x = t < T.home[0]
      ? STOPS.start + (STOPS.first - STOPS.start) * ease(...T.toFirst, t) + (STOPS.last - STOPS.first) * ease(...T.toLast, t)
      : STOPS.last + (STOPS.start - STOPS.last) * ease(...T.home, t);
    const back = 1 - ease(T.reset, T.reset + 0.6, t);
    // Covers stop the finger at their top; the bare lever lets it go further down
    const lastStop = fixed ? FINGER.onCover : FINGER.onLever;
    const z = FINGER.rest - (FINGER.rest - FINGER.onCover) * press(t, T.pressFirst) - (FINGER.rest - lastStop) * press(t, T.pressLast);
    cart.setAttribute("transform", translateAlong(P, [x, 0, 0]));
    finger.setAttribute("transform", translateAlong(P, [x, 0, z]));
    cover6.style.opacity = fixed ? "1" : "0";
    const on = fixed ? 0 : ease(...T.flip, t) * back;
    lever.setAttribute("d", leverD(on));
    saved.style.opacity = (fixed ? 0 : ease(T.flip[1], T.flip[1] + 0.15, t) * back).toFixed(3);
    tags.forEach((tag, w) => {
      const fall = fixed ? 0 : ease(T.drop[0] + w * 0.12, T.drop[0] + w * 0.12 + 0.7, t) * back;
      tag.setAttribute("transform", "translate(0 " + (fall * DROP).toFixed(2) + ")");
    });
  },
});
`;

writeFigure("kimai-systemaccount-mass-assignment", {
  fig: "Fig 1",
  title: "One boolean",
  readout: "ROLE_TEAMLEAD · PATCH /api/users/4",
  keys: [
    { mark: "lit", label: "systemAccount switch: the one field with no guard" },
    { mark: "raised", label: "Covers on roles, active, preferences, supervisor, password reset" },
  ],
  caption:
    "UserController guards five fields before building the edit form; systemAccount was added later without one. A team lead's 22-byte PATCH flips it with HTTP 200, and the user disappears from the week, month and year user reports and the customer monthly projects report, which all call setSystemAccount(false). Kimai 2.57.0 gates the field behind an admin permission.",
  svg,
  stageLabel: "Kimai roster board and field switches. Arrow keys step through the run; Space applies or removes the fix.",
  live,
  css: DOCKBAY_CSS + `.ks-tag{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:.5}.ks-you{fill:var(--anatomy-hi);stroke:var(--anatomy-hi);stroke-width:.5}`,
});
