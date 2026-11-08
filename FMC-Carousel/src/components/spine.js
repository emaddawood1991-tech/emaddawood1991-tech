// Spine / low-back illustrations for the low-back-pain carousel. Original vector drawings, no text inside.
// Posterior body is a 400×940 canvas (centre x=200). Lumbar L1–L5 centres y=288…400, sacrum 428–524.
let n = 0;
const uid = () => `sp${++n}`;
const BONE = '#F7EFDD', BONE2 = '#E3D3B3', BS = '#B49C74', DISC = '#62BFCE', DISC2 = '#B9E7EE', NERVE = '#F3C641', NERVES = '#C79612';
const SK1 = '#F6DAC8', SK2 = '#EBBFA2', SKS = '#CC9576', RED = '#D7262E', NAVY = '#0E2A63';

const smooth = (pts) => {
  const m = pts.length; let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i - 1 + m) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d + 'Z';
};
const mir = (p) => [400 - p[0], p[1]];

/* one vertebra seen from behind (lamina plate, spinous process, transverse processes, facets) */
function vertPost(cx, cy, w, h, g) {
  return `<g>
    <rect x="${cx - w / 2}" y="${cy - h * 0.26}" width="${w}" height="${h * 0.5}" rx="${h * 0.24}" fill="${BONE2}" stroke="${BS}" stroke-width="1.4"/>
    <rect x="${cx - w * 0.3}" y="${cy - h / 2}" width="${w * 0.6}" height="${h}" rx="${h * 0.3}" fill="url(#${g})" stroke="${BS}" stroke-width="1.5"/>
    <rect x="${cx - w * 0.07}" y="${cy - h * 0.42}" width="${w * 0.14}" height="${h * 0.84}" rx="${w * 0.07}" fill="#fff" fill-opacity=".6"/>
    <circle cx="${cx - w * 0.2}" cy="${cy - h * 0.36}" r="${h * 0.09}" fill="${BS}" fill-opacity=".55"/><circle cx="${cx + w * 0.2}" cy="${cy - h * 0.36}" r="${h * 0.09}" fill="${BS}" fill-opacity=".55"/>
  </g>`;
}
const discPost = (cx, cy, w, h) => `<rect x="${cx - w * 0.3}" y="${cy - h / 2}" width="${w * 0.6}" height="${h}" rx="${h / 2}" fill="${DISC}" stroke="#3E9FB0" stroke-width="1.2"/>`;

/* posterior lumbar column placed at (cx, y0); returns svg group string */
function lumbarColumn(cx, ys, g, scale = 1) {
  const W = [54, 56, 58, 60, 62].map((v) => v * scale), H = 24 * scale;
  let s = '';
  ys.forEach((y, i) => { if (i < ys.length - 1) s += discPost(cx, (y + ys[i + 1]) / 2, W[i], (ys[i + 1] - y - H) + 6 * scale); });
  ys.forEach((y, i) => { s += vertPost(cx, y, W[i], H, g); });
  return s;
}

/* ------------------------------------------------------------------ whole back figure */
const LEFT = [[178, 150], [140, 158], [106, 172], [93, 202], [98, 246], [116, 292], [128, 338], [130, 384], [116, 430], [104, 470], [104, 512], [108, 566], [103, 640], [107, 720], [105, 800], [109, 870], [107, 918], [148, 920], [150, 870], [153, 800], [157, 720], [165, 640], [184, 566], [200, 522]];
const BODY = smooth([...LEFT, ...LEFT.slice(0, -1).reverse().map(mir)]);

/* overlay: 'cover' (subtle lumbar highlight) | 'pain' (lumbar + gluteal zone + nerve path) | 'saddle' (cauda equina + saddle zone) | 'none' */
export function backFigure({ view = '0 0 400 940', overlay = 'cover' } = {}) {
  const u = uid(), g = `${u}b`, sk = `${u}s`, red = `${u}r`, amb = `${u}a`;
  const arm = (sx) => {
    const f = (x) => (sx < 0 ? 400 - x : x);
    return `<g stroke-linecap="round" fill="none">
      <path d="M${f(98)} 196L${f(76)} 340L${f(64)} 468" stroke="${SKS}" stroke-width="44"/><path d="M${f(98)} 196L${f(76)} 340L${f(64)} 468" stroke="url(#${sk})" stroke-width="38"/>
      <ellipse cx="${f(60)}" cy="492" rx="15" ry="26" fill="url(#${sk})" stroke="${SKS}" stroke-width="3"/></g>`;
  };
  const thor = Array.from({ length: 9 }, (_, i) => [176 + i * 10.5, 28 + i * 1.4]);
  const lumbarY = [288, 316, 344, 372, 400];
  let s = `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="${sk}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${SK1}"/><stop offset="1" stop-color="${SK2}"/></linearGradient>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EBDDBE"/><stop offset=".5" stop-color="${BONE}"/><stop offset="1" stop-color="#E3D3B3"/></linearGradient>
    <radialGradient id="${red}"><stop offset="0" stop-color="${RED}" stop-opacity=".34"/><stop offset=".62" stop-color="${RED}" stop-opacity=".16"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${amb}"><stop offset="0" stop-color="#F0933A" stop-opacity=".5"/><stop offset="1" stop-color="#F0933A" stop-opacity="0"/></radialGradient>
  </defs>
  ${arm(1)}${arm(-1)}
  <ellipse cx="128" cy="922" rx="30" ry="12" fill="${SK2}" stroke="${SKS}" stroke-width="3"/><ellipse cx="272" cy="922" rx="30" ry="12" fill="${SK2}" stroke="${SKS}" stroke-width="3"/>
  <path d="M184 96L184 156L216 156L216 96Z" fill="${SK2}"/>
  <path d="${BODY}" fill="url(#${sk})" stroke="${SKS}" stroke-width="3.5" stroke-linejoin="round"/>
  <ellipse cx="200" cy="62" rx="35" ry="45" fill="url(#${sk})" stroke="${SKS}" stroke-width="3"/>
  <path d="M165 66C162 14 238 14 235 66C234 84 222 94 200 94C178 94 166 84 165 66Z" fill="#3B2F2C"/>
  <path d="M200 520V474" stroke="${SKS}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
  if (overlay === 'cover' || overlay === 'pain') s += `<ellipse cx="200" cy="350" rx="${overlay === 'pain' ? 84 : 96}" ry="${overlay === 'pain' ? 108 : 120}" fill="url(#${red})"/>`;
  if (overlay === 'pain') s += `<ellipse cx="248" cy="490" rx="46" ry="60" fill="url(#${amb})"/>`;
  // translucent skeleton: ribs, pelvis, sacrum, thoracic + lumbar spine
  s += `<g opacity=".95">
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M${194 - 6} ${186 + i * 16}C${150 - i * 4} ${178 + i * 16} ${126 - i * 2} ${196 + i * 16} ${122} ${212 + i * 16}M${206 + 6} ${186 + i * 16}C${250 + i * 4} ${178 + i * 16} ${274 + i * 2} ${196 + i * 16} ${278} ${212 + i * 16}" stroke="${BONE2}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>`).join('')}
    <path d="M168 436C150 414 112 418 106 452C102 484 124 516 160 520C172 500 172 470 168 436Z" fill="url(#${g})" stroke="${BS}" stroke-width="2"/>
    <path d="M232 436C250 414 288 418 294 452C298 484 276 516 240 520C228 500 228 470 232 436Z" fill="url(#${g})" stroke="${BS}" stroke-width="2"/>
    <path d="M174 428H226L214 500L200 526L186 500Z" fill="url(#${g})" stroke="${BS}" stroke-width="2"/>
    <path d="M196 440H204M196 462H204M198 484H202" stroke="${BS}" stroke-width="3" stroke-linecap="round"/>
    ${thor.map(([y, w], i) => vertPost(200, y - 0, 34 + i * 2.2, 10, g)).join('')}
    ${lumbarColumn(200, lumbarY, g)}
  </g>`;
  if (overlay === 'cover' || overlay === 'pain') s += `<rect x="134" y="262" width="132" height="166" rx="38" fill="none" stroke="${RED}" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round" opacity=".7"/>`;
  if (overlay === 'pain') {
    s += `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M224 400C262 424 262 470 252 520C246 580 252 650 248 720C246 780 242 840 240 900" stroke="${NERVES}" stroke-width="12"/><path d="M224 400C262 424 262 470 252 520C246 580 252 650 248 720C246 780 242 840 240 900" stroke="${NERVE}" stroke-width="7"/></g>
    <g fill="#F0933A">${[[222, 790], [236, 806], [252, 792], [226, 826], [244, 840], [230, 868], [250, 874], [240, 760], [256, 820]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5"/>`).join('')}</g>`;
  }
  if (overlay === 'saddle') {
    s += `<path d="M196 276C190 318 190 360 192 400C180 420 176 470 186 520" fill="none" stroke="${NERVES}" stroke-width="2"/>
    <g stroke="${NERVE}" stroke-width="2.2" fill="none" stroke-linecap="round">${[-10, -6, -2, 2, 6, 10].map((o) => `<path d="M${200 + o * 0.4} 300C${200 + o * 0.6} 380 ${200 + o} 420 ${200 + o * 3} ${452 + Math.abs(o) * 2}"/>`).join('')}</g>
    <path d="M200 478C238 478 246 530 234 580C228 640 232 700 226 744L174 744C168 700 172 640 166 580C154 530 162 478 200 478Z" fill="${RED}" fill-opacity=".3" stroke="${RED}" stroke-width="3.5" stroke-dasharray="6 7"/>`;
  }
  return s + '</svg>';
}

/* ------------------------------------------------------------------ posterior lumbar column close-up (cover side card) */
export function lumbarPost({ view = '0 0 240 440', highlight = true } = {}) {
  const u = uid(), g = `${u}b`, red = `${u}r`;
  const ys = [44, 108, 172, 236, 300];
  return `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EBDDBE"/><stop offset=".5" stop-color="${BONE}"/><stop offset="1" stop-color="#E3D3B3"/></linearGradient>
    <radialGradient id="${red}"><stop offset="0" stop-color="${RED}" stop-opacity=".3"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient></defs>
    ${highlight ? `<ellipse cx="120" cy="260" rx="116" ry="190" fill="url(#${red})"/>` : ''}
    <g stroke="${NERVES}" stroke-width="3" stroke-linecap="round" fill="none">${ys.map((y) => `<path d="M72 ${y + 33}C50 ${y + 40} 34 ${y + 52} 22 ${y + 70}M168 ${y + 33}C190 ${y + 40} 206 ${y + 52} 218 ${y + 70}" stroke="${NERVE}"/>`).join('')}</g>
    ${lumbarColumn(120, ys, g, 2.0).replace(/<rect/g, '<rect')}
    <path d="M70 360H170L152 428L120 448L88 428Z" fill="url(#${g})" stroke="${BS}" stroke-width="2.5"/><path d="M104 380H136M106 402H134M110 424H130" stroke="${BS}" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

/* ------------------------------------------------------------------ lateral lumbar spine (anterior to the left) */
const LAT = [[132, 58, -7], [126, 128, -3], [123, 198, 1], [124, 268, 6], [134, 338, 12]];
export function spineLateral({ view = '0 0 300 480', fracture = -1, narrow = false, nerves = true } = {}) {
  const u = uid(), g = `${u}b`, dg = `${u}d`;
  let s = `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BONE}"/><stop offset="1" stop-color="#E0CFAA"/></linearGradient>
    <radialGradient id="${dg}"><stop offset="0" stop-color="${DISC2}"/><stop offset="1" stop-color="${DISC}"/></radialGradient></defs>`;
  // spinal canal with cauda equina / nerve column behind the bodies
  s += `<path d="M176 36C174 120 176 250 192 372" stroke="#EBDDBE" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M176 36C174 120 176 250 192 372" stroke="${NERVE}" stroke-width="13" fill="none" stroke-linecap="round" opacity=".95"/>`;
  if (nerves) s += LAT.map(([x, y]) => `<path d="M178 ${y + 34}C200 ${y + 36} 214 ${y + 48} 222 ${y + 70}" stroke="${NERVE}" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('');
  // discs
  LAT.forEach(([x, y, a], i) => {
    const nx = i < 4 ? LAT[i + 1] : [146, 392, 18];
    const cx = (x + nx[0]) / 2 - 0, cy = (y + nx[1]) / 2;
    const th = narrow && i === 3 ? 7 : 16;
    s += `<g transform="translate(${cx} ${cy}) rotate(${(a + nx[2]) / 2})"><rect x="-37" y="${-th / 2}" width="74" height="${th}" rx="${th / 2}" fill="url(#${dg})" stroke="#3E9FB0" stroke-width="1.6"/></g>`;
  });
  // vertebrae: body + pedicle/arch + spinous process + facets
  LAT.forEach(([x, y, a], i) => {
    const bad = i === fracture;
    s += `<g transform="translate(${x} ${y}) rotate(${a})">
      <path d="M176 ${-8}L226 ${-4}C240 0 242 8 238 16L186 ${bad ? 12 : 20}Z" transform="translate(-136 0)" fill="url(#${g})" stroke="${BS}" stroke-width="2.2"/>
      <path d="M-34 -22C-36 -14 -36 14 ${bad ? -34 : -34} ${bad ? 12 : 22}C-30 26 -8 ${bad ? 22 : 26} 34 ${bad ? 22 : 26}C40 18 40 -14 ${bad ? 36 : 36} -24C20 ${-30} -20 -30 -34 -22Z" fill="url(#${g})" stroke="${bad ? RED : BS}" stroke-width="${bad ? 3.4 : 2.4}"/>
      <path d="M34 -20C46 -22 54 -20 58 -10L60 14C54 20 46 20 36 16Z" fill="${BONE2}" stroke="${BS}" stroke-width="2"/>
      <path d="M52 -8C74 -14 96 -10 112 -2C116 4 108 12 94 12C80 12 64 10 52 8Z" fill="url(#${g})" stroke="${BS}" stroke-width="2.2"/>
      <ellipse cx="48" cy="-20" rx="9" ry="12" fill="${BONE2}" stroke="${BS}" stroke-width="1.8"/><ellipse cx="48" cy="18" rx="9" ry="11" fill="${BONE2}" stroke="${BS}" stroke-width="1.8"/>
    </g>`;
  });
  s += `<g transform="translate(146 392) rotate(18)"><path d="M-42 -20C-44 10 -30 50 -2 78C14 90 34 94 52 76L40 -20C20 -26 -20 -26 -42 -20Z" fill="url(#${g})" stroke="${BS}" stroke-width="2.4"/><path d="M-26 8H20M-22 30H18M-10 52H12" stroke="${BS}" stroke-width="3" stroke-linecap="round" opacity=".6"/></g>`;
  return s + '</svg>';
}

/* ------------------------------------------------------------------ navy clinical panels (240×150) */
const BG = '<rect width="240" height="150" fill="#0E2A63"/><g stroke="#2A4A8C" stroke-width="1" opacity=".5">' + [37, 75, 113].map((y) => `<path d="M0 ${y}H240"/>`).join('') + [60, 120, 180].map((x) => `<path d="M${x} 0V150"/>`).join('') + '</g>';
const wrap = (inner, defs = '') => `<svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${BG}${inner}</svg>`;
const MUS1 = '#C85A55', MUS2 = '#9E3A3C', LIGHT = '#DCEBFA';

/* sub-drawings reused */
const spineMini = (tx, ty, sc, rot = 0, o = {}) => `<g transform="translate(${tx} ${ty}) scale(${sc}) rotate(${rot})">${spineLateral({ ...o }).replace(/<svg[^>]*>/, '<g>').replace('</svg>', '</g>')}</g>`;

export function lineFigure(pose, { box = null, hi = true } = {}) {
  const L = (a, b, w = 11) => `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${LIGHT}" stroke-width="${w}" stroke-linecap="round"/>`;
  let s = '';
  if (pose.chair) s += `<path d="${pose.chair}" stroke="#7F9FCB" stroke-width="6" stroke-linecap="round" fill="none"/>`;
  if (pose.floor) s += `<path d="${pose.floor}" stroke="#7F9FCB" stroke-width="4" stroke-linecap="round"/>`;
  (pose.limbs || []).forEach(([a, b, c]) => { s += L(a, b, 10) + (c ? L(b, c, 10) : ''); });
  s += L(pose.hip, pose.shoulder, 17);
  s += L(pose.shoulder, pose.head, 8) + `<circle cx="${pose.head[0]}" cy="${pose.head[1]}" r="12" fill="${LIGHT}"/>`;
  if (hi) { const [hx, hy] = pose.hip, [sx, sy] = pose.shoulder; s += `<path d="M${hx} ${hy}L${hx + (sx - hx) * 0.42} ${hy + (sy - hy) * 0.42}" stroke="${RED}" stroke-width="9" stroke-linecap="round" opacity=".85"/>`; }
  if (box) s += `<rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" rx="3" fill="#C99A5B" stroke="#8A6128" stroke-width="2.5"/>`;
  return s;
}

const POSES = {
  seated: { chair: 'M72 102H132M74 102V58M76 102V142M130 102V142', hip: [100, 94], shoulder: [112, 52], head: [124, 36], limbs: [[[100, 94], [148, 92], [150, 134]], [[112, 52], [132, 74], [150, 84]]] },
  walk: { floor: 'M20 140H220', hip: [118, 74], shoulder: [122, 36], head: [126, 18], limbs: [[[118, 74], [146, 100], [158, 138]], [[118, 74], [100, 104], [76, 130]], [[122, 38], [142, 62], [150, 84]], [[122, 38], [104, 60], [96, 82]]] },
  bridge: { floor: 'M14 132H226', hip: [112, 98], shoulder: [56, 122], head: [34, 124], limbs: [[[112, 98], [152, 80], [178, 126]], [[56, 122], [104, 126]]] },
  lift: { floor: 'M20 140H220', hip: [92, 84], shoulder: [126, 52], head: [140, 40], limbs: [[[92, 84], [126, 100], [100, 138]], [[126, 52], [146, 74], [152, 92]]] },
};

export function causeVisual(kind) {
  switch (kind) {
    case 'strain': { // posterior lumbar muscles, one side strained
      const band = (cx, torn) => `<path d="M${cx} 14C${cx + 26} 34 ${cx + 30} 100 ${cx + 8} 138C${cx - 8} 118 ${cx - 12} 60 ${cx} 14Z" fill="${MUS1}" stroke="${MUS2}" stroke-width="2.5"/>
        <g stroke="${MUS2}" stroke-width="1.6" opacity=".6" fill="none">${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${cx + 2 + i * 3} ${24 + i * 4}C${cx + 12 + i * 3} 60 ${cx + 12 + i * 3} 96 ${cx + 2 + i * 2} ${130 - i * 3}"/>`).join('')}</g>`;
      return wrap(`<g opacity=".95">${band(54)}${band(150)}</g><g transform="translate(120 0)"><path d="M0 8V142" stroke="#EBDDBE" stroke-width="22" stroke-linecap="round"/>${[16, 44, 72, 100, 126].map((y) => `<rect x="-14" y="${y - 9}" width="28" height="18" rx="8" fill="${BONE}" stroke="${BS}" stroke-width="1.6"/><rect x="-3" y="${y - 12}" width="6" height="24" rx="3" fill="#fff" opacity=".6"/>`).join('')}</g>
        <path d="M170 56C186 66 190 96 180 112" stroke="#FFD1CF" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="176" cy="84" rx="26" ry="36" fill="none" stroke="${RED}" stroke-width="3.5" stroke-dasharray="5 6"/>
        <path d="M172 70L184 86L170 96L182 110" stroke="#FF5C66" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
    case 'disc': { // axial view: vertebral body, disc with bulge, canal + nerve root
      const g = `${uid()}d`;
      return wrap(`<defs/><g transform="translate(0 4)"><ellipse cx="120" cy="64" rx="72" ry="48" fill="${DISC}" stroke="#3E9FB0" stroke-width="3"/>
        <ellipse cx="120" cy="64" rx="56" ry="34" fill="#8FD3DF" stroke="#3E9FB0" stroke-width="1.5" opacity=".95"/>
        <ellipse cx="116" cy="66" rx="34" ry="19" fill="#E6F8FB" stroke="#3E9FB0" stroke-width="1.5"/>
        <path d="M150 90C166 98 178 98 184 86C190 74 186 66 178 66C172 80 162 86 150 90Z" fill="#E8776F" stroke="${RED}" stroke-width="2.5"/>
        <path d="M70 100C80 124 100 134 120 134C140 134 160 124 170 100" fill="none" stroke="${BONE2}" stroke-width="10" stroke-linecap="round"/>
        <circle cx="120" cy="122" r="17" fill="#EBDDBE" stroke="${BS}" stroke-width="2"/><circle cx="120" cy="122" r="9" fill="${NERVE}" stroke="${NERVES}" stroke-width="1.5"/>
        <path d="M134 126C150 128 164 124 176 116" stroke="${NERVE}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M120 139V150" stroke="${BONE2}" stroke-width="12" stroke-linecap="round"/></g>`);
    }
    case 'inactive':
      return wrap(lineFigure(POSES.seated));
    case 'anatomy': // lateral lumbar spine, canal visible
      return wrap(`<g transform="translate(-4 2)">${spineLateral({ view: '0 0 300 480' }).replace(/<svg[^>]*>/, '<svg x="70" y="0" width="99" height="150" viewBox="30 20 250 380">')}</g>`);
    default: return wrap('');
  }
}

/* warning-slide panels */
export function warnVisual(kind) {
  switch (kind) {
    case 'trend': // pain pattern persisting / worsening over time (no numbers)
      return wrap(`<path d="M28 124H214M28 124V22" stroke="#9CC4F2" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M34 104C60 100 76 108 96 96C120 84 128 90 150 66C170 44 190 40 208 22" stroke="${RED}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M34 112H210" stroke="#7FD8E6" stroke-width="3" stroke-dasharray="3 8" stroke-linecap="round"/>
        <circle cx="208" cy="22" r="7" fill="${RED}"/><g fill="#9CC4F2">${[60, 100, 140, 180].map((x) => `<rect x="${x}" y="128" width="3" height="8" rx="1.5"/>`).join('')}</g>`);
    case 'leg': // nerve running down the leg with tingling
      return wrap(`<path d="M72 6C96 40 92 92 100 146" stroke="${SKS}" stroke-width="46" stroke-linecap="round" fill="none"/><path d="M72 6C96 40 92 92 100 146" stroke="${SK1}" stroke-width="40" stroke-linecap="round" fill="none"/>
        <path d="M62 12C88 30 96 60 94 86C92 112 98 128 98 144" fill="none" stroke="${NERVES}" stroke-width="10" stroke-linecap="round"/><path d="M62 12C88 30 96 60 94 86C92 112 98 128 98 144" fill="none" stroke="${NERVE}" stroke-width="5.5" stroke-linecap="round"/>
        <g fill="#F0933A">${[[118, 96], [130, 112], [114, 126], [134, 130], [124, 142]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4"/>`).join('')}</g>
        <g transform="translate(150 12) scale(.2)">${spineLateral({ nerves: false }).replace(/<svg[^>]*>/, '<g>').replace('</svg>', '</g>')}</g>`);
    case 'fracture': // lateral spine, one vertebra compressed
      return wrap(`<g transform="translate(34 4)">${spineLateral({ fracture: 2, view: '0 0 300 480' }).replace(/<svg[^>]*>/, '<svg x="0" y="0" width="99" height="150" viewBox="30 20 250 380">')}</g>
        <g stroke="${RED}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M196 30V86M184 74L196 88L208 74"/></g><path d="M170 20H222" stroke="#9CC4F2" stroke-width="5" stroke-linecap="round"/>`);
    default: return wrap('');
  }
}

/* care-slide panels */
export function careVisual(kind) {
  switch (kind) {
    case 'active': return wrap(lineFigure(POSES.walk));
    case 'physio': return wrap(lineFigure(POSES.bridge));
    case 'load': return wrap(lineFigure(POSES.lift, { box: [142, 82, 36, 30] }));
    case 'assess': // range-of-motion assessment on the lumbar curve
      return wrap(`<g transform="translate(0 0)">${spineLateral({ view: '0 0 300 480', nerves: false }).replace(/<svg[^>]*>/, '<svg x="26" y="6" width="96" height="138" viewBox="30 20 250 380">')}</g>
        <path d="M150 124H214M150 124L206 70" stroke="#9CC4F2" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M186 124A36 36 0 0 0 176 98" stroke="#7FD8E6" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="150" cy="124" r="6" fill="#fff"/><circle cx="206" cy="70" r="5" fill="#9CC4F2"/>`);
    default: return wrap('');
  }
}
