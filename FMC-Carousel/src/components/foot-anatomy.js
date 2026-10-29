// Foot anatomy illustrations for the metatarsalgia carousel. Right foot, plantar (sole) view unless stated.
// Original vector drawing: soft-tissue silhouette + skeletal overlay (calcaneus, midfoot, 5 metatarsals, phalanges).
// No text inside SVG — labels are HTML overlays positioned with the same 300x560 coordinate space.
let n = 0; const uid = (p) => `fa${p}${++n}`;
const NAVY = '#0B2455', RED = '#D7262E', TEAL = '#1FA8B8';
const SK1 = '#F6D9C4', SK2 = '#E7B79B', SKE = '#C98F72', BN1 = '#FFFDF5', BN2 = '#E4D6B4', BNE = '#A8946A';

const hull = (a, ra, b, rb) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); if (L < 1e-6) return '';
  const ang = Math.atan2(dy, dx), t = Math.acos(Math.max(-1, Math.min(1, (ra - rb) / L)));
  const q = (c, r, th) => `${(c[0] + r * Math.cos(ang + th)).toFixed(1)} ${(c[1] + r * Math.sin(ang + th)).toFixed(1)}`;
  return `<path d="M${q(a, ra, t)}L${q(b, rb, t)}L${q(b, rb, -t)}L${q(a, ra, -t)}Z"/>`;
};
const cap = (a, ra, b, rb) => hull(a, ra, b, rb) + `<circle cx="${a[0]}" cy="${a[1]}" r="${ra}"/><circle cx="${b[0]}" cy="${b[1]}" r="${rb}"/>`;

// Metatarsal head centres [x,y], base centres, from medial (big toe, right) to lateral (left)
export const MT = [
  { h: [208, 238], b: [188, 392], rh: 17, rb: 11 },
  { h: [170, 222], b: [162, 396], rh: 12.5, rb: 9 },
  { h: [137, 228], b: [140, 392], rh: 11.5, rb: 8.5 },
  { h: [107, 242], b: [118, 388], rh: 11, rb: 8 },
  { h: [78, 266], b: [92, 384], rh: 11, rb: 9 },
];
const TOES = [ // phalanx chain from the MT head upward: [[x,y],r] ...
  [[[212, 196], 13], [[216, 138], 11], [[218, 86], 9]],                       // hallux: 2 phalanges (proximal, distal)
  [[[172, 178], 8], [[173, 142], 7], [[173, 112], 6], [[173, 90], 5]],
  [[[138, 184], 7.5], [[137, 152], 6.5], [[136, 126], 5.5], [[136, 106], 4.5]],
  [[[104, 202], 7], [[102, 172], 6], [[100, 148], 5], [[99, 130], 4.2]],
  [[[72, 228], 6.5], [[69, 202], 5.5], [[67, 182], 4.6], [[66, 168], 3.8]],
];

function softTissue() {
  const tips = [[217, 66], [173, 70], [136, 90], [99, 112], [66, 150]];
  const rr = [27, 17, 16, 15, 14];
  let s = '';
  MT.forEach((m, i) => { s += cap(tips[i], rr[i], m.h, rr[i] + 6); });
  s += `<path d="M52 250L100 196L160 178L204 168L246 196L248 300L240 420L232 500L196 566L116 566L80 524L86 430L62 340L48 280Z" stroke-linejoin="round"/>`;
  s += `<ellipse cx="152" cy="508" rx="76" ry="66"/>`;
  return s;
}

function skeleton() {
  let s = '';
  // phalanges
  TOES.forEach((ch, i) => { for (let k = 0; k < ch.length - 1; k++) s += cap(ch[k + 1][0], ch[k + 1][1] * 1.25, ch[k][0], ch[k][1] * 1.2); });
  // head -> first phalanx base
  // metatarsals (shaft + head + base)
  MT.forEach((m, i) => { s += cap(m.h, m.rh, m.b, m.rb) ; });
  // sesamoids under 1st head
  const ses = `<ellipse cx="197" cy="262" rx="8" ry="11"/><ellipse cx="221" cy="263" rx="8" ry="11"/>`;
  // tarsals: cuneiforms, cuboid, navicular, talus/calcaneus
  const tars = `<rect x="177" y="402" width="30" height="30" rx="9"/><rect x="146" y="404" width="28" height="32" rx="9"/><rect x="120" y="402" width="26" height="30" rx="9"/>
    <rect x="86" y="396" width="38" height="46" rx="13"/><rect x="152" y="438" width="48" height="30" rx="12"/>
    <path d="M108 482C110 458 140 456 168 460C196 466 202 492 196 518C188 544 160 552 134 546C112 538 106 510 108 482Z"/>`;
  return { bones: s, ses, tars };
}

/* opts: highlight ('heads' | 'region' | null), labelsOverlay false. width of svg is fluid. */
export function plantarFoot({ highlight = 'heads', bonesOnly = false, tissue = true, glow = true, view = '0 0 300 598' } = {}) {
  const g = uid('g'), b = uid('b'), f = uid('f'), r = uid('r');
  const { bones, ses, tars } = skeleton();
  const soft = softTissue();
  return `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${SK1}"/><stop offset="1" stop-color="${SK2}"/></linearGradient>
    <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BN1}"/><stop offset="1" stop-color="${BN2}"/></linearGradient>
    <radialGradient id="${r}"><stop offset="0" stop-color="${RED}" stop-opacity=".78"/><stop offset=".6" stop-color="${RED}" stop-opacity=".35"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient>
    <filter id="${f}"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
    ${tissue ? `<g fill="${SKE}" stroke="${SKE}" stroke-width="24" stroke-linejoin="round" opacity=".95">${soft}</g><g fill="url(#${g})" stroke="url(#${g})" stroke-width="16" stroke-linejoin="round" opacity=".97">${soft}</g>
    <g fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"><path d="M206 300Q226 360 190 430"/></g>` : ''}
    <g opacity="${tissue ? .93 : 1}"><g fill="${BNE}" stroke="${BNE}" stroke-width="2.4" stroke-linejoin="round">${bones}${ses}${tars}</g>
    <g fill="url(#${b})">${bones}${ses}${tars}</g></g>
    ${highlight && glow ? `<g>${MT.map((m) => `<ellipse cx="${m.h[0]}" cy="${m.h[1] + 12}" rx="${m.rh * 2.6}" ry="${m.rh * 2.6}" fill="url(#${r})"/>`).join('')}
      ${MT.map((m) => `<circle cx="${m.h[0]}" cy="${m.h[1]}" r="${m.rh + 3}" fill="none" stroke="${RED}" stroke-width="3.4"/>`).join('')}</g>` : ''}
  </svg>`;
}

/* lateral (side) foot silhouette with arch; used for load / shoe diagrams. 400x260 box, toes right. */
export function sideFoot({ shoe = null, heel = 0, arrows = [], bones = true } = {}) {
  const g = uid('s'), b = uid('sb');
  const raise = heel; // px that the heel is lifted (rotates foot about the ball)
  const ball = [292, 206];
  const rot = (p) => { const a = Math.atan2(raise, ball[0] - 60), c = Math.cos(a), s = Math.sin(a); const dx = p[0] - ball[0], dy = p[1] - ball[1]; return [ball[0] + dx * c + dy * s, ball[1] - dx * s + dy * c]; };
  const P = (pts) => pts.map((p) => rot(p).map((v) => v.toFixed(1)).join(' ')).join('L');
  const outline = `M${P([[58, 200], [58, 150], [74, 100], [120, 82], [176, 92], [222, 112], [262, 128], [318, 150], [346, 176], [352, 204], [340, 218], [300, 220], [108, 222], [70, 218]])}Z`;
  const bonesSvg = bones ? `<g fill="url(#${b})" stroke="${BNE}" stroke-width="2"><path d="M${P([[66, 200], [64, 160], [86, 132], [124, 126], [136, 150], [128, 200]])}Z"/><path d="M${P([[140, 140], [190, 128], [226, 150], [210, 180], [160, 178]])}Z"/><path d="M${P([[220, 156], [292, 188], [296, 204], [214, 190]])}Z"/><path d="M${P([[296, 196], [350, 200], [348, 212], [296, 214]])}Z"/></g>` : '';
  const shoeSvg = shoe === 'high' ? `<path d="M${P([[40, 214], [40, 140], [64, 92], [128, 86], [160, 96], [260, 124], [338, 160], [366, 192], [372, 214], [352, 228], [300, 228]])}" fill="none"/>` : '';
  const arr = arrows.map(([x, y, len, c = RED]) => `<g stroke="${c}" stroke-width="6" stroke-linecap="round" fill="none"><path d="M${x} ${y}V${y + len}"/><path d="M${x - 11} ${y + len - 14}L${x} ${y + len}L${x + 11} ${y + len - 14}"/></g>`).join('');
  return `<svg viewBox="0 0 400 270" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${SK1}"/><stop offset="1" stop-color="${SK2}"/></linearGradient>
  <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BN1}"/><stop offset="1" stop-color="${BN2}"/></linearGradient></defs>
  <path d="${outline}" fill="url(#${g})" stroke="${SKE}" stroke-width="4" stroke-linejoin="round"/>${bonesSvg}${shoeSvg}${arr}</svg>`;
}
