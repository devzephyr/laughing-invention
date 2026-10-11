// Fig: Tryton attachment XSS (CVE-2025-66420). An HTML attachment, here arriving by email through
// inbound_email + document_incoming, is rendered inline by SAO's preview, inside Tryton's own origin, so its
// script can read the viewer's session cookie and localStorage and send them out. Only this one of the post's
// five CVEs is shown. Patched sao releases are listed in the post but the change is not described, so there
// is no fix state.
import { writeFigure } from "../embed.mjs";
import { k, P, WIDTH, HEIGHT, at, S, L, D, deck, lamp, recess, planeOf, DOCKBAY_CSS } from "../dockbay.mjs";

// ---- World layout ----
const MAILBOX = { x: -126, y: -36, w: 24, d: 20, r: 2 };
const MAILBOX_TOP = 30;
const MAIL_FACE = MAILBOX.y + MAILBOX.d;
const SLOT_Z = 22;
const CHUTE = { x: MAILBOX.x + MAILBOX.w, y: -30, w: 30, d: 8, r: 1 };
const TRAY = { x: -72, y: -36, w: 24, d: 20, r: 1.5 };
const VIEWER = { x: -36, y: -64, w: 86, d: 22, r: 2 };
const VIEWER_TOP = 52;
const VIEW_FACE = VIEWER.y + VIEWER.d;
const WIN = { x0: -28, x1: 42, z0: 12, z1: 44, r: 2, depth: 6 };
const EXHIBIT = { x0: -22, x1: 14, z0: 15, z1: 41 };
const HOOK = [32, 34];
const TUBE = { x: VIEWER.x + VIEWER.w, y: -56, w: 56, d: 6, r: 2.4 };
const DOCK = { x: TUBE.x + TUBE.w, y: -66, w: 24, d: 26, r: 1.5 };
const DOCK_TOP = 22;

// ---- Parts ----
function mailbox() {
  const out = [S(k.slabOf(MAILBOX, 0, MAILBOX_TOP, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(MAILBOX, 6, P, 3), { tone: "faint" }) })];
  out.push(`<g transform="${planeOf(MAIL_FACE)}"><rect class="tr-slot" x="${MAILBOX.x + 5}" y="${-(SLOT_Z + 1.4)}" width="${MAILBOX.w - 10}" height="2.8" rx="1"/></g>`);
  out.push(lamp(MAILBOX.x + 6, MAILBOX.y + 6, MAILBOX_TOP, "lamp-mail"));
  out.push(S(k.slabOf(CHUTE, 0, 4, P, 2, 0.3), { tone: "lo", inner: L(k.sideSeam(CHUTE, 2, P, 2), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(CHUTE, 1.4), 4, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf(TRAY, 0, 6, P, 3, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(TRAY, 2), 6, P, 3), { tone: "lo" }));
  return out.join("");
}

// An envelope standing on edge, built with its foot at z = 0 and centred on x = 0, y = 0
const envelope = () => {
  const plan = { x: -7, y: -0.6, w: 14, d: 1.2, r: 0.3 };
  return [S(k.slabOf(plan, 0, 9, P, 1), { tone: "hi", crease: "lo" }), L(k.segment([-7, 0.6, 9], [0, 0.6, 5], P) + k.segment([0, 0.6, 5], [7, 0.6, 9], P), { tone: "lo" })].join("");
};

function viewer() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(VIEWER, 2), 0, 6, P)}"/>`];
  out.push(S(k.slabOf(VIEWER, 0, VIEWER_TOP, P, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(VIEWER, 5, P, 4) + k.sideSeam(VIEWER, VIEWER_TOP - 4, P, 4), { tone: "faint" }) }));
  // Inside the case: the preview's exhibit rises from below; the viewer's session key hangs on its hook
  const exhibitLines = [];
  for (let z = EXHIBIT.z1 - 9; z > EXHIBIT.z0 + 3; z -= 3.4) exhibitLines.push(`M${EXHIBIT.x0 + 4} ${-z}H${EXHIBIT.x0 + 4 + 14 + ((z * 7) % 11)}`);
  const exhibit =
    `<g data-part="exhibit" transform="translate(0 ${EXHIBIT.z1 - EXHIBIT.z0 + 4})">` +
    `<rect class="tr-exhibit" x="${EXHIBIT.x0}" y="${-EXHIBIT.z1}" width="${EXHIBIT.x1 - EXHIBIT.x0}" height="${EXHIBIT.z1 - EXHIBIT.z0}" rx="0.8"/>` +
    `<rect class="tr-head" x="${EXHIBIT.x0 + 4}" y="${-(EXHIBIT.z1 - 3)}" width="20" height="3" rx="0.4"/>` +
    `<path class="iso-line" data-tone="lo" data-free="" d="${exhibitLines.join("")}"/>` +
    `</g>`;
  const hook = `<rect class="tr-head" x="${HOOK[0] - 3}" y="${-(HOOK[1] + 5.4)}" width="6" height="1.4" rx="0.4"/><path class="iso-line" data-tone="mid" d="M${HOOK[0]} ${-(HOOK[1] + 4)}V${-HOOK[1]}"/>`;
  const key =
    `<g data-part="key"><circle class="tr-key" cx="${HOOK[0]}" cy="${-(HOOK[1] - 2.2)}" r="2.2"/>` +
    `<rect class="tr-key" x="${HOOK[0] - 0.6}" y="${-(HOOK[1] - 4.4)}" width="1.2" height="7"/><rect class="tr-key" x="${HOOK[0] + 0.6}" y="${-(HOOK[1] - 9.4)}" width="1.8" height="1"/></g>`;
  out.push(recess(WIN, VIEW_FACE, exhibit + hook + key));
  out.push(D([[VIEWER.x + 4, VIEWER_TOP - 4], [VIEWER.x + VIEWER.w - 4, VIEWER_TOP - 4], [VIEWER.x + 4, 5], [VIEWER.x + VIEWER.w - 4, 5]].map(([x, z]) => at([x, VIEW_FACE, z])), { size: 0.45 }));
  out.push(lamp(VIEWER.x + VIEWER.w - 8, VIEWER.y + 8, VIEWER_TOP, "lamp-session"));
  return out.join("");
}

function tube() {
  return [
    S(k.slabOf(TUBE, 4, 6, P, 3, 0.4), { tone: "lo", inner: L(k.sideSeam(TUBE, 7, P, 3), { tone: "faint" }) }),
    S(k.slabOf({ x: TUBE.x + 20, y: TUBE.y - 1, w: 4, d: TUBE.d + 2, r: 0.6 }, 0, 4, P, 2), { tone: "mid", crease: "none" }),
    S(k.slabOf(DOCK, 0, DOCK_TOP, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(DOCK, 5, P, 3), { tone: "faint" }) }),
    D(k.dotGrid(DOCK.x + 4, DOCK.y + 4, 4, 3, 2.6, DOCK_TOP, P), { size: 0.42, tone: "lo" }),
    lamp(DOCK.x + DOCK.w - 6, DOCK.y + DOCK.d - 6, DOCK_TOP, "lamp-out"),
  ].join("");
}

const capsule = () => S(k.slabOf({ x: -5, y: TUBE.y + 0.8, w: 10, d: 4.4, r: 2 }, 10, 4.4, P, 3, 0.4), { tone: "hi", crease: "lo", lit: true });

// ---- Assemble ----
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "An inbound mail slot feeds a chute and a document tray. Behind it a display case, Tryton's preview, has a window where an attachment is shown, and the viewer's session key hangs inside the same case. An outbound tube leaves the case for a dock at the right.",
  body: [
    deck("CVE-2025-66420"),
    viewer(),
    tube(),
    `<g data-part="capsule" style="opacity:0">${capsule()}</g>`,
    mailbox(),
    `<g data-part="envelope" style="opacity:0">${envelope()}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const ENV = { from: [${MAILBOX.x + MAILBOX.w / 2}, ${MAIL_FACE + 26}, 0], slot: [${MAILBOX.x + MAILBOX.w / 2}, ${MAIL_FACE + 1}, ${SLOT_Z - 4}], tray: [${TRAY.x + TRAY.w / 2}, ${TRAY.y + TRAY.d / 2}, 6] };
const RISE = ${EXHIBIT.z1 - EXHIBIT.z0 + 4}, TUBE = [${TUBE.x + 6}, ${TUBE.x + TUBE.w - 4}];
const T = { arrive: [0.3, 1.3], ingest: [1.4, 2.4], preview: [2.6, 3.4], script: [3.6, 4.4], out: [4.6, 6.0], reset: 8.4, cycle: 10 };

const svg = document.querySelector(".iso-stage svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const envelope = part("envelope"), exhibit = part("exhibit"), key = part("key"), capsule = part("capsule");
const lamps = { mail: part("lamp-mail"), session: part("lamp-session"), out: part("lamp-out") };
const lerp3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);

function phaseOf(t) {
  if (t >= T.reset) return "resetting";
  if (t < T.ingest[0]) return "email in · HTML attachment";
  if (t < T.preview[0]) return "document_incoming · no login";
  if (t < T.script[0]) return "preview · rendered as HTML";
  if (t < T.out[0]) return "script runs in Tryton's origin";
  return "session cookie + localStorage · out";
}

runFigure({
  cycle: T.cycle,
  scrubEnd: 8.2,
  steps: [0.2, T.arrive[1], T.ingest[1], T.preview[1], T.script[1], T.out[1] + 0.3],
  label: () => "",
  phase: phaseOf,
  draw(t) {
    const back = 1 - ease(T.reset, T.reset + 0.5, t);
    // The envelope reaches the slot, then reappears in the tray after the chute
    const inSlot = t < T.ingest[0];
    const pos = inSlot ? lerp3(ENV.from, ENV.slot, ease(...T.arrive, t)) : ENV.tray;
    envelope.setAttribute("transform", translateAlong(P, pos));
    envelope.style.opacity = (inSlot ? ease(T.arrive[0], T.arrive[0] + 0.2, t) * (1 - ease(T.arrive[1] - 0.15, T.arrive[1], t)) : ease(T.ingest[1] - 0.3, T.ingest[1], t) * (1 - ease(T.preview[0], T.preview[1], t))).toFixed(3);
    lamps.mail.style.opacity = (t > T.arrive[1] - 0.1 && t < T.ingest[1] ? 1 : 0).toString();
    const shown = ease(...T.preview, t) * back;
    exhibit.setAttribute("transform", "translate(0 " + (RISE * (1 - shown)).toFixed(2) + ")");
    lamps.session.style.opacity = (ease(T.script[0], T.script[0] + 0.15, t) * back).toFixed(3);
    // The script lifts the session key off its hook; it leaves through the outbound tube
    const lift = ease(...T.script, t);
    key.setAttribute("transform", "translate(" + (8 * lift).toFixed(2) + " " + (-4 * lift).toFixed(2) + ")");
    key.style.opacity = (1 - ease(T.out[0], T.out[0] + 0.3, t) + ease(T.reset, T.reset + 0.5, t)).toFixed(3);
    const go = ease(...T.out, t);
    capsule.setAttribute("transform", translateAlong(P, [TUBE[0] + (TUBE[1] - TUBE[0]) * go, 0, 0]));
    capsule.style.opacity = (ease(T.out[0], T.out[0] + 0.25, t) * (1 - ease(T.out[1] - 0.2, T.out[1], t))).toFixed(3);
    lamps.out.style.opacity = (ease(T.out[1], T.out[1] + 0.15, t) * back).toFixed(3);
  },
});
`;

writeFigure("tryton-erp-five-cves-one-audit", {
  fig: "Fig 1",
  title: "Attachment XSS",
  readout: "email in · HTML attachment",
  keys: [
    { mark: "lit", label: "The session, carried out by the attachment's script" },
    { mark: "raised", label: "SAO's preview: shows the attachment inside Tryton's own origin" },
  ],
  caption:
    "CVE-2025-66420, one of the post's five. SAO previews an uploaded HTML attachment by rendering it inline, so its script runs in Tryton's origin with the viewer's session cookies and localStorage. With inbound_email and document_incoming enabled, the attachment can arrive by email with no login. Fixed in sao 7.6.9, 7.4.19, 7.0.38 and 6.0.67; the post does not describe the change, so only the bug is shown.",
  svg,
  stageLabel: "Tryton attachment preview. Arrow keys step through the run.",
  live,
  fix: false,
  css:
    DOCKBAY_CSS +
    `.tr-slot{fill:var(--db-flap)}.tr-exhibit{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:.6}.tr-head{fill:var(--anatomy-mid)}.tr-key{fill:var(--anatomy-hi)}`,
});
