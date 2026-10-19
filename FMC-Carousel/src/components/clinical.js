// Clinical illustrations for slides 3 & 4 (vector, no text inside). Style: anatomical "mannequin" charts —
// neutral steel-blue figure, thin outline, FMC red only for the finding, teal for reference/normal guides.
let n = 0; const uid = (p) => `${p}${++n}`;
const NAVY = '#0B2455', TEAL = '#1FA8B8', RED = '#D7262E';
const BODY_A = '#D6E3F2', BODY_B = '#9DB5D3', EDGE = '#5F7CA6', BONE = '#FFF7E4', BONE_E = '#C7B58C';

/* ---------- mannequin helpers ---------- */
const hull = (a, ra, b, rb) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); if (L < 1e-6) return '';
  const ang = Math.atan2(dy, dx), t = Math.acos(Math.max(-1, Math.min(1, (ra - rb) / L)));
  const q = (c, r, th) => [(c[0] + r * Math.cos(ang + th)).toFixed(2), (c[1] + r * Math.sin(ang + th)).toFixed(2)];
  const a1 = q(a, ra, t), a2 = q(a, ra, -t), b1 = q(b, rb, t), b2 = q(b, rb, -t);
  return `<path d="M${a1}L${b1}L${b2}L${a2}Z"/>`;
};
const circ = (c, r) => `<circle cx="${c[0]}" cy="${c[1]}" r="${r}"/>`;
const seg = (a, ra, b, rb) => hull(a, ra, b, rb) + circ(a, ra) + circ(b, rb);
const rot = (p, c, deg) => { const r = deg * Math.PI / 180, dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r)]; };
// union of shapes, drawn twice (outline pass, fill pass) so the silhouette has one clean contour
const body = (shapes, grad) => `<g fill="${EDGE}" stroke="${EDGE}" stroke-width="3.2" stroke-linejoin="round">${shapes}</g><g fill="url(#${grad})">${shapes}</g>`;
const defsBody = (g) => `<linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="160" y2="200"><stop offset="0" stop-color="${BODY_A}"/><stop offset="1" stop-color="${BODY_B}"/></linearGradient>`;
const svg = (inner, defs = '') => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${defs ? `<defs>${defs}</defs>` : ''}${inner}</svg>`;
const ground = (y = 184) => `<path d="M26 ${y}H174" stroke="#B4C6DD" stroke-width="2.4" stroke-linecap="round"/>`;
const arc = (c, r, a0, a1) => { const p = (a) => [(c[0] + r * Math.cos(a)).toFixed(1), (c[1] + r * Math.sin(a)).toFixed(1)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0} ${y0}A${r} ${r} 0 0 ${a1 > a0 ? 1 : 0} ${x1} ${y1}`; };

// side-view child figure from joint dictionary
function side(J, g, { lean = 0 } = {}) {
  const hip = J.hip, R = (p) => (lean ? rot(p, hip, lean) : p);
  const sh = R(J.sh), head = R(J.head), neck = R([J.head[0], J.head[1] + 15]);
  const arms = J.arms.map(([e, w]) => seg(sh, 5, R(e), 4.2) + seg(R(e), 4.2, R(w), 3.4) + circ(R(w), 3.8)).join('');
  const leg = ([k, a, t]) => seg(hip, 8, k, 5.8) + seg(k, 5.8, a, 3.9) + seg(a, 4, t, 2.7) + circ([a[0] - 3, a[1] + 3.5], 4);
  return body(`${J.legsFar ? J.legsFar.map(leg).join('') : ''}${seg(head, 12.6, neck, 5)}${seg(sh, 9.6, hip, 8.8)}${J.legs.map(leg).join('')}${arms}`, g);
}

/* ---------- Slide-4 illustrations ---------- */
export function clin(kind) {
  const g = uid('g');
  switch (kind) {
    case 'limp': { // altered stride: short swing step vs expected (dashed ghost)
      const hip = [98, 98];
      const J = { head: [100, 25], sh: [100, 52], hip, arms: [[[91, 76], [97, 98]], [[109, 75], [117, 92]]],
        legsFar: [[[112, 128], [108, 160], [124, 168]]], legs: [[[100, 136], [100, 170], [118, 176]]] };
      return svg(`${ground(182)}<path d="M98 98L120 134L132 164L148 172" stroke="${TEAL}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke-dasharray="1 9" opacity=".7"/>
        ${side(J, g, { lean: 7 })}<path d="M124 188H148M124 184V192M148 184V192" stroke="${RED}" stroke-width="2.6" stroke-linecap="round"/>`, defsBody(g));
    }
    case 'pain': { // lateral view of lower limb with skeleton hint and a soft pain region over the distal tibia
      const gr = uid('p');
      const limb = seg([88, 6], 14, [94, 86], 10.5) + seg([94, 86], 10.5, [96, 152], 6.6) + seg([96, 154], 7, [136, 176], 4) + circ([88, 164], 8);
      const bones = `<g fill="${BONE}" stroke="${BONE_E}" stroke-width="1.3" opacity=".92">${seg([88, 6], 4, [93, 80], 5)}${circ([95, 87], 6.5)}<ellipse cx="104" cy="88" rx="4.4" ry="6"/>${seg([95, 96], 4.2, [96, 148], 3.4)}${seg([88, 100], 2.2, [90, 150], 2)}${circ([96, 154], 5)}<ellipse cx="88" cy="164" rx="7" ry="5"/>${seg([104, 164], 2.6, [132, 175], 2)}</g>`;
      return svg(`${ground(184)}${body(limb, g)}${bones}<circle cx="96" cy="128" r="30" fill="url(#${gr})"/>
        <circle cx="96" cy="128" r="9" fill="none" stroke="${RED}" stroke-width="2.4"/><circle cx="96" cy="128" r="18" fill="none" stroke="${RED}" stroke-width="1.8" opacity=".55"/>`,
        defsBody(g) + `<radialGradient id="${gr}"><stop offset="0" stop-color="${RED}" stop-opacity=".62"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient>`);
    }
    case 'run': { // restricted knee motion: expected range (dashed) vs achieved (solid)
      const hip = [94, 98], knee = [122, 112];
      const J = { head: [108, 26], sh: [106, 53], hip, arms: [[[120, 70], [132, 60]], [[92, 72], [80, 84]]],
        legsFar: [[[88, 134], [70, 160], [82, 172]]], legs: [[knee, [112, 146], [130, 152]]] };
      const at = Math.atan2(hip[1] - knee[1], hip[0] - knee[0]), as = Math.atan2(146 - knee[1], 112 - knee[0]);
      return svg(`${ground(182)}${side(J, g, { lean: 9 })}
        <path d="${arc(knee, 26, at, at - 1.75)}" stroke="${TEAL}" stroke-width="2.6" stroke-dasharray="4 4" stroke-linecap="round" fill="none"/>
        <path d="${arc(knee, 26, at, as - 6.283)}" stroke="${RED}" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="${knee[0]}" cy="${knee[1]}" r="2.6" fill="${RED}"/>`, defsBody(g));
    }
    case 'balance': { // single-leg stance on a wobble board; centre-of-gravity line and sway cue
      const hip = [98, 98];
      const shapes = seg([100, 25], 12.6, [100, 40], 5) + seg([84, 52], 7, [116, 52], 7) + seg([100, 54], 15, hip, 12.5)
        + seg([84, 54], 5, [62, 58], 4) + seg([62, 58], 4, [44, 54], 3.3) + circ([42, 54], 3.8) + seg([116, 54], 5, [138, 58], 4) + seg([138, 58], 4, [156, 52], 3.3) + circ([158, 52], 3.8)
        + seg([92, 100], 7.5, [92, 138], 5.6) + seg([92, 138], 5.6, [92, 170], 3.9) + seg([92, 172], 4.2, [108, 175], 3)
        + seg([106, 100], 7.5, [122, 124], 5.6) + seg([122, 124], 5.6, [112, 150], 3.9) + seg([112, 150], 3.9, [118, 158], 3);
      return svg(`<g transform="rotate(-5 94 186)"><rect x="50" y="177" width="90" height="8" rx="4" fill="#8FA6C6" stroke="${EDGE}" stroke-width="1.6"/></g><path d="M82 188A12 12 0 0 0 106 188Z" fill="#6F88AE"/>
        ${body(shapes, g)}<path d="M100 10V176" stroke="${TEAL}" stroke-width="2.2" stroke-dasharray="4 4"/><circle cx="98" cy="98" r="3.6" fill="${RED}"/>
        <path d="M34 150Q26 168 38 184M162 150Q170 168 158 184" stroke="${TEAL}" stroke-width="2.4" stroke-dasharray="2 6" stroke-linecap="round" fill="none"/>`, defsBody(g));
    }
    case 'posture': { // rear view: shoulder / pelvic line tilt, spine column and plumb line
      const L = [76, 50], Rr = [124, 60];
      const shapes = seg([100, 25], 12.6, [100, 42], 5) + seg(L, 8, Rr, 8) + seg([100, 66], 17, [100, 104], 14)
        + seg(L, 5, [66, 82], 4.2) + seg([66, 82], 4.2, [64, 106], 3.4) + circ([64, 108], 3.8) + seg(Rr, 5, [134, 88], 4.2) + seg([134, 88], 4.2, [136, 110], 3.4) + circ([136, 112], 3.8)
        + seg([90, 106], 8, [88, 142], 6) + seg([88, 142], 6, [88, 172], 4) + seg([110, 106], 8, [112, 142], 6) + seg([112, 142], 6, [112, 172], 4)
        + `<ellipse cx="88" cy="178" rx="9" ry="4.4"/><ellipse cx="112" cy="178" rx="9" ry="4.4"/>`;
      const vert = Array.from({ length: 11 }, (_, i) => { const y = 48 + i * 5.4, x = 100 + Math.sin(i / 10 * Math.PI * 1.6) * 3.4; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="3.8" ry="2.2" fill="${BONE}" stroke="${BONE_E}" stroke-width="1"/>`; }).join('');
      return svg(`${body(shapes, g)}${vert}<path d="M100 8V186" stroke="${TEAL}" stroke-width="2.2" stroke-dasharray="4 4"/>
        <path d="M50 48L150 62" stroke="${RED}" stroke-width="2.8" stroke-linecap="round"/><path d="M70 105L130 108" stroke="${RED}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>
        <circle cx="${L[0]}" cy="${L[1]}" r="3.2" fill="${RED}"/><circle cx="${Rr[0]}" cy="${Rr[1]}" r="3.2" fill="${RED}"/>`, defsBody(g));
    }
    default: return svg('');
  }
}

/* ---------- Slide-3 pressure-analysis visuals (illustrative, no patient data) ---------- */
const FOOT = 'M100 34C132 34 148 62 146 96C144 124 126 134 124 156C122 182 110 194 92 194C70 194 62 176 66 154C70 130 52 116 52 88C52 56 70 34 100 34Z';
const TOES = [[121, 20, 13], [92, 17, 9], [72, 25, 8], [58, 39, 7.5], [49, 56, 6.5]];
const STOPS = [[0, [29, 78, 216]], [.25, [6, 182, 212]], [.5, [34, 197, 94]], [.72, [250, 204, 21]], [.88, [249, 115, 22]], [1, [220, 38, 38]]];
const ramp = (v) => { v = Math.max(0, Math.min(1, v)); for (let i = 1; i < STOPS.length; i++) if (v <= STOPS[i][0]) { const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], t = (v - a) / (b - a); return ca.map((c, k) => Math.round(c + (cb[k] - c) * t)); } return STOPS.at(-1)[1]; };
const rgb = (c) => `rgb(${c.join(',')})`;
const ZONES = { heel: [96, 166, 30], lat: [74, 122, 19], mt1: [112, 82, 18], mt2: [94, 74, 18], mt3: [79, 80, 15], mt45: [65, 90, 13], hal: [121, 22, 12], t2: [92, 18, 8], t3: [72, 26, 7.5], t45: [56, 42, 7] };
export const LOADS = {
  stand: { heel: .95, lat: .42, mt1: .7, mt2: .86, mt3: .76, mt45: .5, hal: .6, t2: .3, t3: .28, t45: .22 },
  standR: { heel: .84, lat: .5, mt1: .76, mt2: .8, mt3: .72, mt45: .56, hal: .56, t2: .3, t3: .26, t45: .24 },
  strike: { heel: .98, lat: .12, mt1: 0, mt2: 0, mt3: 0, mt45: 0, hal: 0, t2: 0, t3: 0, t45: 0 },
  mid: { heel: .5, lat: .72, mt1: .45, mt2: .6, mt3: .55, mt45: .5, hal: .18, t2: .1, t3: .1, t45: .1 },
  toeoff: { heel: 0, lat: .1, mt1: .96, mt2: .86, mt3: .66, mt45: .4, hal: .92, t2: .55, t3: .4, t45: .3 },
};
// plantar heat map of a LEFT foot (big toe on the right when viewed from the sole); mirror=true gives the right foot
export function heatFoot(load, { mirror = false, cx = 0, cy = 0, h = 150 } = {}) {
  const c = uid('c'), f = uid('f'); const s = h / 190; const defs = []; const blobs = [];
  for (const [k, v] of Object.entries(load)) {
    if (v <= 0.02) continue; const [x, y, r] = ZONES[k]; const id = uid('b');
    defs.push(`<radialGradient id="${id}"><stop offset="0" stop-color="${rgb(ramp(v))}" stop-opacity=".97"/><stop offset=".55" stop-color="${rgb(ramp(v * .6))}" stop-opacity=".72"/><stop offset="1" stop-color="${rgb(ramp(v * .3))}" stop-opacity="0"/></radialGradient>`);
    blobs.push(`<circle cx="${x}" cy="${y}" r="${r * 1.35}" fill="url(#${id})"/>`);
  }
  const clip = `<clipPath id="${c}"><path d="${FOOT}"/>${TOES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</clipPath><filter id="${f}"><feGaussianBlur stdDeviation="2.2"/></filter>`;
  const g = `<g transform="translate(${cx} ${cy}) scale(${mirror ? -s : s} ${s}) translate(-98 -104)">
    <path d="${FOOT}" fill="#1E4F9A" fill-opacity=".55"/>${TOES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#1E4F9A" fill-opacity=".55"/>`).join('')}
    <g clip-path="url(#${c})" filter="url(#${f})">${blobs.join('')}</g>
    <path d="${FOOT}" fill="none" stroke="#9CC4F2" stroke-opacity=".8" stroke-width="${1.6 / s}" stroke-linejoin="round"/>${TOES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#9CC4F2" stroke-opacity=".8" stroke-width="${1.6 / s}"/>`).join('')}</g>`;
  return { defs: defs.join('') + clip, g };
}
const SCREEN_BG = `<rect width="375" height="176" fill="#0E2A63"/><g stroke="#2A4A8C" stroke-width="1" opacity=".55">${[44, 88, 132].map((y) => `<path d="M0 ${y}H375"/>`).join('')}${[75, 150, 225, 300].map((x) => `<path d="M${x} 0V176"/>`).join('')}</g>`;
const wrap = (inner, defs) => `<svg viewBox="0 0 375 176" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${SCREEN_BG}<g transform="translate(0 24)">${inner}</g></svg>`;

export function viz(kind) {
  if (kind === 'zones') { // both feet, loading zones
    const L = heatFoot(LOADS.stand, { cx: 150, cy: 72, h: 116 }), R = heatFoot(LOADS.standR, { mirror: true, cx: 236, cy: 72, h: 116 });
    return wrap(`${L.g}${R.g}<path d="M20 52H356M20 100H356" stroke="#E6F1FF" stroke-opacity=".6" stroke-width="1.6" stroke-dasharray="5 5"/>`, L.defs + R.defs);
  }
  if (kind === 'compare') { // left vs right, three regions, relative bars (no values)
    const rows = [[26, 122, 100], [62, 70, 84], [98, 138, 118]]; // y, right length, left length
    const bars = rows.map(([y, r, l]) => `<rect x="${187 + 48}" y="${y - 11}" width="${r * .66}" height="22" rx="5" fill="#5E9BF0"/><rect x="${187 - 48 - l * .66}" y="${y - 11}" width="${l * .66}" height="22" rx="5" fill="#27C6D8"/>`).join('');
    return wrap(`${bars}<path d="M187 10V130" stroke="#E6F1FF" stroke-opacity=".35" stroke-width="1.4" stroke-dasharray="4 5"/>`, '');
  }
  if (kind === 'progress') { // heel strike -> mid-stance -> toe-off (reads right to left)
    const a = heatFoot(LOADS.strike, { cx: 312, cy: 64, h: 98 }), b = heatFoot(LOADS.mid, { cx: 187, cy: 64, h: 98 }), c = heatFoot(LOADS.toeoff, { cx: 62, cy: 64, h: 98 });
    return wrap(`${a.g}${b.g}${c.g}<g stroke="#E6F1FF" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M266 66H236M244 58L234 66L244 74"/><path d="M141 66H111M119 58L109 66L119 74"/></g>`, a.defs + b.defs + c.defs);
  }
  if (kind === 'clinical') { // pressure map beside a clinical findings panel
    const L = heatFoot(LOADS.stand, { cx: 92, cy: 70, h: 108 });
    const rows = [38, 70, 102].map((y, i) => `<circle cx="196" cy="${y}" r="9" fill="#27C6D8"/><path d="M191.5 ${y}l3.2 3.2l6-6.4" stroke="#0E2A63" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="214" y="${y - 6}" width="${[118, 96, 108][i]}" height="12" rx="6" fill="#E6F1FF" fill-opacity=".85"/>`).join('');
    return wrap(`${L.g}<rect x="160" y="14" width="196" height="128" rx="14" fill="#fff" fill-opacity=".08" stroke="#9CC4F2" stroke-opacity=".55" stroke-width="1.4"/>${rows}<path d="M176 128H340" stroke="#9CC4F2" stroke-opacity=".5" stroke-width="2"/>`, L.defs);
  }
  return '';
}
