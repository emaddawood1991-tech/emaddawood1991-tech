// Neuro-rehabilitation illustrations for the hemiplegia carousel. Original vector drawings, no text inside.
// Rehab scenes are drawn on a 240×150 canvas (floor y=140). People are flat-vector figures (no faces).
let n = 0;
const uid = () => `nr${++n}`;
const RED = '#D7262E', NAVY = '#0B2455', TEAL = '#1FA8B8';
const SKIN = { a: ['#EBC2A4', '#D29E7C'], b: ['#CB946F', '#AC7552'] };

const seg = (pts, w, c) => `<path d="M${pts.map((p) => p.join(' ')).join('L')}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

/* o: s shoulder, h hip, hd head, legs[far,near]=[knee,ankle,toe], arms[far,near]=[elbow,wrist], f facing, belt */
function person(o) {
  const { s, h, hd, legs, arms, f = 1, top, pants, skin, hair, belt } = o;
  const leg = (l) => seg([h, l[0], l[1]], 13, pants) + seg([l[1], l[2]], 7, '#27324D');
  const arm = (a) => seg([s, a[0]], 10, top) + seg([a[0], a[1]], 8, skin) + `<circle cx="${a[1][0]}" cy="${a[1][1]}" r="4.6" fill="${skin}"/>`;
  let g = leg(o.legs[0]) + arm(o.arms[0]) + seg([s, h], 25, top);
  if (belt) { const b = [s[0] + (h[0] - s[0]) * 0.82, s[1] + (h[1] - s[1]) * 0.82]; g += `<path d="M${b[0] - 11} ${b[1]}L${b[0] + 11} ${b[1]}" stroke="${belt}" stroke-width="5" stroke-linecap="round"/>`; }
  g += leg(o.legs[1]) + seg([s, hd], 7, skin) + `<circle cx="${hd[0]}" cy="${hd[1]}" r="9.5" fill="${skin}"/><circle cx="${hd[0] - f * 2.6}" cy="${hd[1] - 2.4}" r="9.3" fill="${hair}"/>`;
  g += arm(o.arms[1]);
  return `<g>${g}</g>`;
}
const PT = { top: '#8FB8E3', pants: '#5D7FB0', skin: SKIN.a[0], hair: '#8A8F9C' };   // patient
const TH = { top: TEAL, pants: NAVY, skin: SKIN.b[0], hair: '#2B2322' };           // physiotherapist

const stand = (x, f, lean = 0) => ({ s: [x + lean, 48], h: [x, 82], hd: [x + lean + f * 1.5, 34], legs: [[[x - 2, 110], [x - 3, 136], [x - 3 + f * 8, 138]], [[x + 2, 110], [x + 3, 136], [x + 3 + f * 8, 138]]] });
const sit = (x, f) => ({ s: [x + f, 74], h: [x, 108], hd: [x + f * 3, 60], legs: [[[x + f * 26, 110], [x + f * 28, 136], [x + f * 36, 138]], [[x + f * 28, 112], [x + f * 30, 136], [x + f * 38, 138]]] });
const walk = (x, f) => ({ s: [x + f * 2, 48], h: [x, 82], hd: [x + f * 3.5, 34], legs: [[[x - f * 6, 110], [x - f * 20, 132], [x - f * 14, 138]], [[x + f * 10, 108], [x + f * 20, 134], [x + f * 29, 138]]] });

const room = (extra = '') => `<defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F9FE"/><stop offset="1" stop-color="#E2EEFA"/></linearGradient></defs>
  <rect width="240" height="150" fill="url(#rg)"/><rect x="0" y="139" width="240" height="11" fill="#C5D9EF"/><rect x="0" y="137.5" width="240" height="2.5" fill="#B0C8E4"/>
  <g stroke="#CADCF0" stroke-width="3"><path d="M10 20V138M30 20V138M50 20V138"/><path d="M10 50H50M10 80H50M10 110H50" stroke-width="2.5"/></g>${extra}`;
const svg = (inner, view = '0 0 240 150') => `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const plinth = (x0, x1, y = 112) => `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="12" rx="4" fill="#3C5F96"/><rect x="${x0 + 4}" y="${y + 12}" width="${x1 - x0 - 8}" height="${139 - y - 12}" rx="2" fill="#9FB6D6"/>`;
const chair = (x0, x1, y = 112) => `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="6" rx="3" fill="#3C5F96"/><path d="M${x0 + 4} ${y + 6}V139M${x1 - 4} ${y + 6}V139" stroke="#3C5F96" stroke-width="4" stroke-linecap="round"/>`;
const table = (x0, x1, y = 92) => `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="5" rx="2.5" fill="#6E87AE"/><path d="M${x0 + 6} ${y + 5}V139M${x1 - 6} ${y + 5}V139" stroke="#6E87AE" stroke-width="4" stroke-linecap="round"/>`;
const bars = (x0, x1, y = 80) => `<g stroke="#8CA3C5" stroke-width="3.5" stroke-linecap="round"><path d="M${x0} ${y}H${x1}"/><path d="M${x0} ${y}V139M${x1} ${y}V139"/></g>`;
const mats = (x0, x1) => `<g fill="#F0A53A" opacity=".9">${[x0, (x0 + x1) / 2, x1].map((x) => `<path d="M${x - 4} 139L${x} 131L${x + 4} 139Z"/>`).join('')}</g>`;

export function rehabScene(kind, view) {
  const A = (o) => person({ ...PT, ...o });
  const T = (o) => person({ ...TH, ...o });
  switch (kind) {
    case 'reach': { // cover / guided reach: seated patient, therapist supporting the forearm
      const p = sit(78, 1), t = stand(160, -1);
      return svg(room(plinth(44, 104)) + T({ ...t, f: -1, belt: null, arms: [[[148, 66], [128, 76]], [[142, 62], [122, 72]]] }) + A({ ...p, f: 1, belt: '#F0A53A', arms: [[[88, 92], [98, 104]], [[96, 86], [116, 72]]] }), view);
    }
    case 'strength': // manual muscle strength: therapist resists a flexed elbow
      return svg(room(chair(44, 100)) + T({ ...stand(158, -1), f: -1, arms: [[[140, 72], [92, 94]], [[140, 64], [108, 84]]] }) + A({ ...sit(76, 1), f: 1, arms: [[[86, 96], [96, 104]], [[84, 92], [106, 84]]] }), view);
    case 'balance': // sitting balance: patient reaches forward, therapist guards at the side
      return svg(room(plinth(40, 108)) + T({ ...stand(150, -1), f: -1, arms: [[[146, 70], [134, 84]], [[142, 66], [130, 78]]] }) + A({ ...sit(74, 1), s: [86, 70], hd: [92, 56], f: 1, belt: '#F0A53A', arms: [[[96, 82], [110, 80]], [[100, 76], [118, 76]]] }), view);
    case 'standbal': // standing balance: patient reaches forward, therapist guards behind with belt contact
      return svg(room(mats(70, 200)) + T({ ...stand(88, 1), f: 1, arms: [[[100, 68], [112, 82]], [[98, 62], [116, 82]]] }) + A({ ...stand(134, 1), f: 1, belt: '#F0A53A', arms: [[[146, 62], [162, 66]], [[144, 58], [160, 62]]] }), view);
    case 'rom': // joint range of motion: therapist moves the patient's arm
      return svg(room(chair(40, 98)) + T({ ...stand(156, -1), f: -1, arms: [[[130, 62], [92, 58]], [[132, 52], [104, 42]]] }) + A({ ...sit(72, 1), f: 1, arms: [[[84, 96], [94, 104]], [[84, 60], [102, 42]]] }), view);
    case 'gait': // gait assessment: patient walks with a gait belt, therapist behind
      return svg(room(mats(60, 190)) + T({ ...walk(84, 1), f: 1, arms: [[[96, 66], [108, 80]], [[98, 62], [112, 76]]] }) + A({ ...walk(122, 1), f: 1, belt: '#F0A53A', arms: [[[130, 66], [136, 82]], [[128, 62], [136, 78]]] }), view);
    case 'function': // functional task: reaching for a cup at a table, therapist observing
      return svg(room(table(112, 190, 96) + '<rect x="146" y="82" width="9" height="14" rx="2" fill="#FFFFFF" stroke="#7F9FCB" stroke-width="2"/>' + chair(44, 100)) + A({ ...sit(76, 1), f: 1, arms: [[[88, 94], [96, 104]], [[92, 84], [124, 90]]] }) + T({ ...stand(198, -1), f: -1, arms: [[[190, 70], [178, 82]], [[188, 66], [176, 62]]] }) + '<rect x="166" y="52" width="14" height="19" rx="2" fill="#fff" stroke="#7F9FCB" stroke-width="2" transform="rotate(-12 173 61)"/>', view);
    case 'guided': // upper-limb movement: both seated at a table, therapist supports elbow and wrist
      return svg(room(table(96, 196, 98) + chair(44, 98) + chair(176, 226)) + A({ ...sit(74, 1), f: 1, arms: [[[86, 98], [96, 104]], [[92, 88], [126, 92]]] }) + T({ ...sit(206, -1), f: -1, arms: [[[170, 92], [136, 92]], [[176, 84], [112, 90]]] }) + '<circle cx="148" cy="91" r="5" fill="#F0A53A" opacity=".95"/>', view);
    case 'supportstand': // supported standing between parallel bars with therapist at the hip
      return svg(room(bars(70, 214, 82)) + T({ ...stand(76, 1), f: 1, arms: [[[88, 66], [104, 80]], [[88, 62], [108, 82]]] }) + A({ ...stand(122, 1), f: 1, belt: '#F0A53A', arms: [[[132, 62], [150, 82]], [[130, 60], [138, 82]]] }), view);
    case 'gaittrain': // supervised gait training with a cane and therapist guarding by the belt
      return svg(room(mats(70, 200)) + T({ ...walk(88, 1), f: 1, arms: [[[100, 66], [112, 80]], [[102, 62], [116, 78]]] }) + A({ ...walk(126, 1), f: 1, belt: '#F0A53A', arms: [[[134, 68], [138, 82]], [[136, 62], [152, 84]]] }) + '<path d="M152 84L156 139M152 84Q156 80 160 84" stroke="#6E87AE" stroke-width="3" stroke-linecap="round" fill="none"/>', view);
    case 'sit2stand': // sit-to-stand: forward trunk lean, therapist in front guarding
      return svg(room(chair(40, 90)) + A({ s: [98, 62], h: [76, 98], hd: [108, 50], f: 1, belt: '#F0A53A', legs: [[[100, 112], [96, 136], [104, 138]], [[102, 112], [98, 136], [106, 138]]], arms: [[[116, 70], [128, 74]], [[114, 66], [126, 70]]] }) + T({ ...stand(160, -1), f: -1, lean: -4, arms: [[[146, 66], [132, 74]], [[144, 62], [130, 70]]] }), view);
    default: return svg(room(), view);
  }
}

/* ------------------------------------------------------------------ brain + motor pathway (coronal schematic) */
export function brainPathway({ view = '0 0 300 430', body = true } = {}) {
  const u = uid(), clipL = `${u}cl`, clipR = `${u}cr`, bg = `${u}g`;
  const HL = 'M148 18C100 10 54 44 50 92C46 132 78 156 148 154Z', HR = 'M152 18C200 10 246 44 250 92C254 132 222 156 152 154Z';
  const gy = ['M70 70C86 58 100 76 116 62C128 52 136 66 144 58', 'M60 96C78 84 92 104 110 90C124 80 134 96 144 88', 'M60 122C76 112 90 130 108 118C122 108 134 122 144 116', 'M80 140C94 132 108 142 124 134C132 130 140 138 146 134', 'M92 36C104 44 116 34 128 42C136 46 140 40 146 38'];
  const gyri = (m) => `<g ${m ? 'transform="translate(300 0) scale(-1 1)"' : ''} fill="none" stroke="#C98C89" stroke-width="3" stroke-linecap="round" opacity=".8">${gy.map((d) => `<path d="${d}"/>`).join('')}</g>`;
  let s = `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="${bg}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6D6D2"/><stop offset="1" stop-color="#E4ABA8"/></linearGradient>
    <clipPath id="${clipL}"><path d="${HL}"/></clipPath><clipPath id="${clipR}"><path d="${HR}"/></clipPath></defs>`;
  if (body) {
    s += `<g fill="#F3DBCB" stroke="#C99F86" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
      <path d="M136 214H164V236H136Z"/><path d="M104 242C120 228 180 228 196 242L190 336H110Z"/>
      <path d="M108 250L88 330L82 384M192 250L212 330L218 384" fill="none" stroke="#C99F86" stroke-width="25"/><path d="M108 250L88 330L82 384M192 250L212 330L218 384" fill="none" stroke="#F3DBCB" stroke-width="20"/>
      <path d="M130 332L122 420M170 332L178 420" fill="none" stroke="#C99F86" stroke-width="34"/><path d="M130 332L122 420M170 332L178 420" fill="none" stroke="#F3DBCB" stroke-width="29"/></g>
    <g fill="${RED}" fill-opacity=".2" stroke="${RED}" stroke-width="3" stroke-dasharray="6 6"><path d="M150 232C170 230 188 234 196 242L190 336H150Z"/><path d="M192 250L212 330L218 384" fill="none" stroke-width="22" stroke-opacity=".45" stroke-dasharray="none"/><path d="M170 332L178 420" fill="none" stroke-width="28" stroke-opacity=".45" stroke-dasharray="none"/></g>`;
  }
  s += `<ellipse cx="108" cy="168" rx="36" ry="17" fill="#D9A19E" stroke="#B97876" stroke-width="2.5"/><ellipse cx="192" cy="168" rx="36" ry="17" fill="#D9A19E" stroke="#B97876" stroke-width="2.5"/>
    <path d="M132 148C130 176 132 200 136 220H164C168 200 170 176 168 148Z" fill="#E7B3AF" stroke="#B97876" stroke-width="2.5"/>
    <path d="${HL}" fill="url(#${bg})" stroke="#B97876" stroke-width="3"/><path d="${HR}" fill="url(#${bg})" stroke="#B97876" stroke-width="3"/>
    <g clip-path="url(#${clipL})">${gyri(false)}</g><g clip-path="url(#${clipR})">${gyri(true)}</g>
    <path d="M76 52C92 34 118 26 142 28" stroke="${TEAL}" stroke-width="13" stroke-linecap="round" fill="none" opacity=".6"/><path d="M224 52C208 34 182 26 158 28" stroke="${TEAL}" stroke-width="13" stroke-linecap="round" fill="none" opacity=".6"/>
    <path d="M78 54C80 36 100 30 114 40C124 52 114 68 98 68C84 68 76 64 78 54Z" fill="${RED}" fill-opacity=".8" stroke="#A81C23" stroke-width="2.5"/>
    <g fill="none" stroke-linecap="round">
      <path d="M204 66C196 110 176 150 150 190C140 208 124 226 118 246C108 280 100 308 90 340" stroke="${TEAL}" stroke-width="5"/>
      <path d="M96 70C104 110 124 150 150 190C160 208 176 226 182 246C192 280 200 308 210 340" stroke="${RED}" stroke-width="5" stroke-dasharray="3 9"/>
    </g>
    <circle cx="150" cy="190" r="6" fill="#fff" stroke="${NAVY}" stroke-width="3"/>`;
  return s + '</svg>';
}
