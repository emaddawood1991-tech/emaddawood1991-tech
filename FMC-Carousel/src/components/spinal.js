// Full-spine anatomical illustrations (C1–sacrum) for the spinal-deformities carousel. Original vector drawings, no text inside.
// Lateral view: anterior = left, posterior = right. Posterior view: patient's left = viewer's right.
let n = 0;
const uid = () => `sd${++n}`;
const BONE = '#F8F0DE', BONE2 = '#E6D8B8', BS = '#B09870', DISC = '#62BFCE', DISC_S = '#3E9FB0', RED = '#D7262E', TEAL = '#1FA8B8';

const hermite = (ctrl) => {
  const xs = ctrl.map((c) => c[0]), ys = ctrl.map((c) => c[1]), m = ctrl.length;
  const tan = ys.map((_, k) => (k === 0 ? (ys[1] - ys[0]) / (xs[1] - xs[0]) : k === m - 1 ? (ys[m - 1] - ys[m - 2]) / (xs[m - 1] - xs[m - 2]) : (ys[k + 1] - ys[k - 1]) / (xs[k + 1] - xs[k - 1])));
  return (x) => {
    let k = 0; while (k < m - 2 && x > xs[k + 1]) k++;
    const h = xs[k + 1] - xs[k], t = (x - xs[k]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[k] + (t3 - 2 * t2 + t) * h * tan[k] + (-2 * t3 + 3 * t2) * ys[k + 1] + (t3 - t2) * h * tan[k + 1];
  };
};
const PROFILE = {
  normal: [[0, 0], [3, -5], [6, 2], [9, 12], [13, 17], [17, 10], [19, -1], [21, -14], [23, -8], [24, 6]],
  kyph: [[0, -14], [3, -6], [6, 10], [9, 28], [13, 52], [17, 36], [19, 6], [21, -12], [23, -8], [24, 6]],
  lord: [[0, 0], [3, -5], [6, 2], [9, 12], [13, 16], [17, 8], [19, -8], [21, -32], [23, -26], [24, 4]],
  flat: [[0, 0], [24, 0]],
  scol: [[0, 0], [4, 0], [7, 7], [10, 19], [13, 34], [16, 21], [19, -5], [21, -26], [23, -19], [24, -2]],
};
const DIM = Array.from({ length: 24 }, (_, i) => {
  if (i < 7) return { r: 'C', w: 15 + i * 0.6, h: 9 + i * 0.3, g: 3 };
  if (i < 19) { const k = i - 7; return { r: 'T', w: 20 + k * 1.3, h: 12 + k * 0.55, g: 3.4 }; }
  const k = i - 19; return { r: 'L', w: 38 + k * 1.5, h: 22, g: 6 };
});
const YS = []; DIM.forEach((d, i) => { YS[i] = i === 0 ? 26 + d.h / 2 : YS[i - 1] + DIM[i - 1].h / 2 + DIM[i - 1].g + d.h / 2; });
const CX = 110;

/* view: 'lat' | 'post'; kind: PROFILE key; hi: [fromIdx,toIdx] highlight band; ref: dashed normal reference */
export function spine({ view = 'lat', kind = 'normal', hi = null, ref = false, vb = '0 0 220 560', hiColor = RED, tilt = null, ribs = true, cobb = false, xray = false } = {}) {
  const u = uid(), g = `${u}g`, g2 = `${u}h`;
  const f = hermite(PROFILE[kind]);
  const dx = (i) => f(i);
  const slope = (i) => (dx(Math.min(i + 0.5, 24)) - dx(Math.max(i - 0.5, 0))) / ((YS[Math.min(Math.ceil(i + 0.5), 23)] - YS[Math.max(Math.floor(i - 0.5), 0)]) || 1);
  const rot = (i) => -(Math.atan(slope(i)) * 180) / Math.PI * 0.9;
  const kappa = (i) => dx(Math.min(i + 1, 24)) - 2 * dx(i) + dx(Math.max(i - 1, 0));
  let s = `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF9EC"/><stop offset=".55" stop-color="${BONE}"/><stop offset="1" stop-color="#DCCBA4"/></linearGradient>
    <linearGradient id="${g2}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ADCE6"/><stop offset="1" stop-color="${DISC}"/></linearGradient></defs>`;
  const y24 = YS[23] + 11 + 8 + 22;
  const base = (v) => v; // placeholder for symmetry
  if (ref) {
    if (view === 'lat') s += `<path d="${Array.from({ length: 25 }, (_, i) => { const fy = i === 24 ? y24 : YS[i]; const fx = CX + hermite(PROFILE.normal)(i); return `${i ? 'L' : 'M'}${fx.toFixed(1)} ${fy.toFixed(1)}`; }).join('')}" fill="none" stroke="${TEAL}" stroke-width="3" stroke-dasharray="3 7" stroke-linecap="round" opacity=".95"/>`;
    else s += `<path d="M${CX} 16V${y24 + 30}" stroke="${TEAL}" stroke-width="3" stroke-dasharray="3 7" stroke-linecap="round"/>`;
  }
  if (hi) {
    const a = YS[hi[0]] - DIM[hi[0]].h, b = YS[hi[1]] + DIM[hi[1]].h; const cxm = CX + (dx(hi[0]) + dx(hi[1])) / 2 + (view === 'lat' ? 8 : 0);
    s += `<rect x="${cxm - (view === 'lat' ? 52 : 74)}" y="${a}" width="${view === 'lat' ? 104 : 148}" height="${b - a}" rx="30" fill="${hiColor}" fill-opacity=".14" stroke="${hiColor}" stroke-width="2.6" stroke-dasharray="5 6"/>`;
  }
  if (view === 'post') {
    // ribs (behind)
    if (ribs) for (let i = 7; i < 17; i++) {
      const d = DIM[i], x = CX + dx(i), y = YS[i], L = 30 + 24 * Math.sin((Math.PI * (i - 6)) / 12);
      [-1, 1].forEach((sd) => { s += `<path d="M${x + sd * d.w * 0.8} ${y}C${x + sd * (d.w + 16)} ${y - 6} ${x + sd * (L + 24)} ${y + 4} ${x + sd * (L + 20)} ${y + 28}" stroke="#EADFC4" stroke-opacity=".8" stroke-width="3" fill="none" stroke-linecap="round"/>`; });
    }
    DIM.forEach((d, i) => {
      if (i < 23) { const x = CX + (dx(i) + dx(i + 1)) / 2, y = (YS[i] + YS[i + 1]) / 2; s += `<rect x="${x - d.w * 0.34}" y="${y - (d.g + 2) / 2}" width="${d.w * 0.68}" height="${d.g + 2}" rx="2.5" fill="url(#${g2})" stroke="${DISC_S}" stroke-width="1" transform="rotate(${rot(i + 0.5)} ${x} ${y})"/>`; }
    });
    DIM.forEach((d, i) => {
      const x = CX + dx(i), y = YS[i], sp = kind === 'scol' ? Math.max(-7, Math.min(7, kappa(i) * 3.2)) : 0;
      const tw = d.r === 'C' ? d.w * 2.0 : d.r === 'T' ? d.w * 1.9 : d.w * 1.8;
      s += `<g transform="translate(${x} ${y}) rotate(${rot(i)})">
        <rect x="${-tw / 2}" y="${-d.h * 0.32}" width="${tw}" height="${d.h * 0.46}" rx="${d.h * 0.2}" fill="${BONE2}" stroke="${BS}" stroke-width="1.1"/>
        <rect x="${-d.w * 0.31}" y="${-d.h / 2}" width="${d.w * 0.62}" height="${d.h}" rx="${d.h * 0.3}" fill="url(#${g})" stroke="${BS}" stroke-width="1.2"/>
        <rect x="${sp - d.w * 0.07}" y="${-d.h * 0.46}" width="${d.w * 0.14}" height="${d.h * 0.92}" rx="${d.w * 0.07}" fill="#fff" fill-opacity=".72" stroke="${BS}" stroke-width=".7"/></g>`;
    });
    // pelvis + sacrum
    const x = CX + dx(24), y = y24;
    [-1, 1].forEach((sd) => { s += `<path d="M${x + sd * 22} ${y - 16}C${x + sd * 40} ${y - 30} ${x + sd * 66} ${y - 20} ${x + sd * 68} ${y + 4}C${x + sd * 68} ${y + 30} ${x + sd * 46} ${y + 48} ${x + sd * 26} ${y + 44}Z" fill="url(#${g})" stroke="${BS}" stroke-width="1.6"/>`; });
    s += `<path d="M${x - 24} ${y - 18}H${x + 24}L${x + 14} ${y + 36}L${x} ${y + 56}L${x - 14} ${y + 36}Z" fill="url(#${g})" stroke="${BS}" stroke-width="1.6"/><path d="M${x - 8} ${y - 2}h16M${x - 7} ${y + 14}h14M${x - 5} ${y + 28}h10" stroke="${BS}" stroke-width="2.4" stroke-linecap="round"/>`;
  } else {
    // discs
    DIM.forEach((d, i) => {
      if (i < 23) { const x = CX + (dx(i) + dx(i + 1)) / 2, y = (YS[i] + YS[i + 1]) / 2; s += `<rect x="${x - d.w * 0.46}" y="${y - (d.g + 2) / 2}" width="${d.w * 0.92}" height="${d.g + 2}" rx="${(d.g + 2) / 2}" fill="url(#${g2})" stroke="${DISC_S}" stroke-width="1" transform="rotate(${rot(i + 0.5)} ${x} ${y})"/>`; }
    });
    DIM.forEach((d, i) => {
      const x = CX + dx(i), y = YS[i], w = d.w * 0.92;
      let sp;
      if (d.r === 'C') sp = `M${w / 2 + 3} ${-d.h * 0.1}L${w / 2 + (i === 6 ? 17 : 11)} ${d.h * 0.1}`;
      else if (d.r === 'T') sp = `M${w / 2 + 3} ${-d.h * 0.1}L${w / 2 + 15} ${d.h * 0.85}`;
      else sp = `M${w / 2 + 3} ${-d.h * 0.05}L${w / 2 + 24} ${d.h * 0.08}`;
      s += `<g transform="translate(${x} ${y}) rotate(${rot(i)})">
        <path d="${sp}" stroke="${BS}" stroke-width="${d.r === 'L' ? 8.5 : 6}" stroke-linecap="round" fill="none"/><path d="${sp}" stroke="${BONE2}" stroke-width="${d.r === 'L' ? 6 : 3.6}" stroke-linecap="round" fill="none"/>
        <rect x="${w / 2 - 1}" y="${-d.h * 0.34}" width="6" height="${d.h * 0.68}" rx="2" fill="${BONE2}" stroke="${BS}" stroke-width="1"/>
        <rect x="${-w / 2}" y="${-d.h / 2}" width="${w}" height="${d.h}" rx="${d.h * 0.3}" fill="url(#${g})" stroke="${BS}" stroke-width="1.2"/>
        <rect x="${-w / 2 + 2}" y="${-d.h / 2 + 1.5}" width="${w * 0.28}" height="${d.h - 3}" rx="2" fill="#fff" opacity=".38"/></g>`;
    });
    const x = CX + dx(24), t = tilt ?? (kind === 'lord' ? 42 : 26);
    s += `<g transform="translate(${x} ${y24 - 10}) rotate(${-t + 26})"><path d="M-19 -8L20 -11L26 12C22 40 10 58 -2 70L-16 66C-12 44 -16 16 -19 -8Z" fill="url(#${g})" stroke="${BS}" stroke-width="1.6"/><path d="M-3 66L-9 80" stroke="${BS}" stroke-width="5" stroke-linecap="round"/><path d="M-12 12H12M-9 34H8" stroke="${BS}" stroke-width="2.2" stroke-linecap="round" opacity=".6"/></g>`;
  }
  if (cobb) [8, 20].forEach((i) => { const x = CX + dx(i), y = YS[i]; s += `<g transform="translate(${x} ${y}) rotate(${rot(i)})"><path d="M-70 -DD H70" stroke="${RED}" stroke-width="3" stroke-linecap="round"/></g>`.replace('-DD', String(-DIM[i].h / 2 - 1)); });
  s += '</svg>';
  if (xray) s = s.replace(/#FFF9EC/g, '#F4F6F9').replace(/#F8F0DE/g, '#D5DAE2').replace(/#DCCBA4/g, '#8F99A8').replace(/#E6D8B8/g, '#B9C1CD').replace(/#EADFC4/g, '#5C6778').replace(/#B09870/g, '#6E7889').replace(/#9ADCE6/g, '#121926').replace(/#62BFCE/g, '#0C121C').replace(/#3E9FB0/g, '#0C121C');
  return s;
}

/* ------------------------------------------------------------------ posterior posture figure (viewBox 0 0 300 560) */
const SK1 = '#F4D6C3', SK2 = '#E3B79C', SKS = '#C99A7F';
const sm = (pts) => { const m = pts.length; let d = `M${pts[0][0]} ${pts[0][1]}`; for (let i = 0; i < m; i++) { const p0 = pts[(i - 1 + m) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m]; d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]} ${p2[1]}`; } return d + 'Z'; };

export function postureBack({ marks = true } = {}) {
  const u = uid(), sk = `${u}s`;
  const torso = sm([[132, 84], [158, 82], [196, 90], [238, 98], [246, 138], [230, 198], [210, 258], [208, 306], [216, 352], [210, 384], [150, 394], [90, 384], [84, 352], [98, 306], [98, 258], [70, 198], [56, 142], [62, 112], [106, 94]]);
  let s = `<svg viewBox="0 0 300 560" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${sk}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${SK1}"/><stop offset="1" stop-color="${SK2}"/></linearGradient></defs>
    <g stroke-linecap="round" fill="none"><path d="M70 120L42 300" stroke="${SKS}" stroke-width="40"/><path d="M70 120L42 300" stroke="url(#${sk})" stroke-width="35"/><ellipse cx="40" cy="322" rx="12" ry="22" fill="url(#${sk})" stroke="${SKS}" stroke-width="3"/>
    <path d="M236 108L248 296" stroke="${SKS}" stroke-width="40"/><path d="M236 108L248 296" stroke="url(#${sk})" stroke-width="35"/><ellipse cx="248" cy="320" rx="12" ry="22" fill="url(#${sk})" stroke="${SKS}" stroke-width="3"/>
    <path d="M114 420L110 536M190 420L194 536" stroke="${SKS}" stroke-width="56"/><path d="M114 420L110 536M190 420L194 536" stroke="url(#${sk})" stroke-width="51"/></g>
    <path d="M142 70H174V92H142Z" fill="${SK2}"/><ellipse cx="156" cy="42" rx="29" ry="35" fill="url(#${sk})" stroke="${SKS}" stroke-width="3"/><path d="M127 44C124 6 188 6 185 44C184 58 174 66 156 66C138 66 128 58 127 44Z" fill="#3B2F2C"/>
    <path d="${torso}" fill="url(#${sk})" stroke="${SKS}" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="M84 366C110 372 190 372 216 366L212 424C190 440 112 440 88 424Z" fill="#2E3B5C"/>
    <path d="M96 150C112 140 128 152 128 178C128 206 112 220 98 210C88 190 88 164 96 150Z" fill="${SKS}" fill-opacity=".16" stroke="${SKS}" stroke-width="2" stroke-opacity=".5"/>
    <path d="M182 146C206 134 232 156 230 194C228 220 204 232 188 218C174 200 172 164 182 146Z" fill="#fff" fill-opacity=".22" stroke="#B98368" stroke-width="3"/><path d="M190 158C206 152 218 164 218 190" stroke="#fff" stroke-opacity=".55" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M156 92C150 130 162 176 166 214C168 254 150 300 146 376" stroke="#B98368" stroke-width="3.4" stroke-dasharray="1 7" stroke-linecap="round" fill="none"/>`;
  if (marks) s += `<g fill="none" stroke-linecap="round"><path d="M30 113H150" stroke="${RED}" stroke-width="3" stroke-dasharray="7 6"/><path d="M150 98H272" stroke="${RED}" stroke-width="3" stroke-dasharray="7 6"/>
    <path d="M156 18V548" stroke="#0B2455" stroke-width="2.6" stroke-dasharray="3 7"/></g><path d="M146 396V428" stroke="#0B2455" stroke-width="4" stroke-linecap="round"/>`;
  return s + '</svg>';
}

/* lateral silhouette with increased thoracic curvature (viewBox 0 0 170 300) */
export function kyphSide() {
  const u = uid(), sk = `${u}s`;
  const body = sm([[66, 66], [48, 106], [50, 150], [58, 196], [56, 240], [58, 292], [100, 294], [102, 246], [110, 214], [96, 178], [118, 142], [134, 108], [122, 80], [92, 62]]);
  return `<svg viewBox="0 0 170 300" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${sk}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${SK1}"/><stop offset="1" stop-color="${SK2}"/></linearGradient></defs>
    <path d="${body}" fill="url(#${sk})" stroke="${SKS}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="64" cy="40" rx="22" ry="26" fill="url(#${sk})" stroke="${SKS}" stroke-width="3"/><path d="M60 16C86 14 92 40 84 58C84 42 74 32 60 32Z" fill="#3B2F2C"/>
    <path d="M110 78C132 96 140 124 124 148C112 166 104 176 98 190" fill="none" stroke="${RED}" stroke-width="8" stroke-linecap="round" opacity=".5"/>
    <path d="M94 66C112 86 116 118 108 150C104 170 100 184 100 200" fill="none" stroke="${TEAL}" stroke-width="3.2" stroke-dasharray="3 7" stroke-linecap="round"/>
    <path d="M46 4V296" stroke="#0B2455" stroke-width="2.6" stroke-dasharray="3 7"/></svg>`;
}

/* ------------------------------------------------------------------ clinical examination scenes (240×150, floor y=140) */
const FLOOR = '<rect x="0" y="139" width="240" height="11" fill="#C5D9EF"/><rect x="0" y="137.5" width="240" height="2.5" fill="#B0C8E4"/>';
const BGR = (extra = '') => `<defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F9FE"/><stop offset="1" stop-color="#E2EEFA"/></linearGradient></defs><rect width="240" height="150" fill="url(#eg)"/>${FLOOR}${extra}`;
const wrapE = (inner, vb = '0 0 240 150') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const limb = (pts, w, c) => `<path d="M${pts.map((q) => q.join(' ')).join('L')}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

export function examScene(kind) {
  switch (kind) {
    case 'posture': { // posture grid, plumb line, level lines (patient from behind)
      const grid = `<g stroke="#BBD0EA" stroke-width="1.6">${[40, 80, 120, 160, 200].map((x) => `<path d="M${x} 6V138"/>`).join('')}${[30, 60, 90, 120].map((y) => `<path d="M10 ${y}H230"/>`).join('')}</g>`;
      return wrapE(BGR(grid) + `<g>${limb([[100, 96], [98, 136]], 17, '#CF9F83')}${limb([[100, 96], [98, 136]], 14, SK1)}${limb([[140, 96], [142, 136]], 17, '#CF9F83')}${limb([[140, 96], [142, 136]], 14, SK1)}
        ${limb([[96, 52], [84, 90]], 10, SK2)}${limb([[144, 48], [152, 88]], 10, SK2)}
        <path d="M100 38L96 54L96 96L100 108H140L144 96L144 52L140 36Z" fill="${SK1}" stroke="#CF9F83" stroke-width="2"/><path d="M98 92H142L140 108H100Z" fill="#2E3B5C"/>
        <circle cx="121" cy="26" r="11" fill="${SK1}" stroke="#CF9F83" stroke-width="2"/><path d="M110 24C108 12 134 12 132 24C128 18 114 18 110 24Z" fill="#3B2F2C"/></g>
        <path d="M121 6V138" stroke="#0B2455" stroke-width="2.4" stroke-dasharray="3 5"/><path d="M82 40H162M80 54H160" stroke="${RED}" stroke-width="2.4" stroke-dasharray="5 4" stroke-linecap="round" opacity="0"/><path d="M84 46H122M122 40H160" stroke="${RED}" stroke-width="3" stroke-dasharray="5 4" stroke-linecap="round"/>`);
    }
    case 'bend': { // Adam's forward bend test, seen from the side with the examiner's sight line along the back
      return wrapE(BGR() + `${limb([[128, 90], [128, 136]], 15, '#2E3B5C')}${limb([[128, 90], [126, 136]], 15, '#2E3B5C')}
        ${limb([[128, 90], [76, 72]], 25, SK1)}<path d="M76 62C88 54 112 58 128 74" stroke="${SKS}" stroke-width="2.4" fill="none"/>
        ${limb([[78, 76], [70, 112]], 9, SK2)}<circle cx="58" cy="84" r="11" fill="${SK1}" stroke="#CF9F83" stroke-width="2"/><path d="M52 76C58 70 68 74 68 82C62 80 56 80 52 76Z" fill="#3B2F2C"/>
        <ellipse cx="100" cy="64" rx="17" ry="6" fill="${RED}" fill-opacity=".42" stroke="${RED}" stroke-width="2.4" stroke-dasharray="4 4" transform="rotate(8 100 64)"/>
        <g transform="translate(196 30)"><path d="M-17 0C-9 -11 9 -11 17 0C9 11 -9 11 -17 0Z" fill="#fff" stroke="#0B2455" stroke-width="3"/><circle cx="0" cy="0" r="5.5" fill="#0B2455"/></g><path d="M180 34C150 44 124 52 108 60" stroke="#0B2455" stroke-width="2.6" stroke-dasharray="4 5" fill="none" stroke-linecap="round"/>`);
    }
    case 'scoliometer': { // inclinometer across the back in forward bend (back seen from behind)
      return wrapE(BGR() + `<path d="M24 118C24 80 60 56 120 56C180 56 216 80 216 118V138H24Z" fill="${SK1}" stroke="#CF9F83" stroke-width="3"/>
        <path d="M122 62C120 84 126 104 120 134" stroke="#B98368" stroke-width="3.4" stroke-dasharray="1 7" stroke-linecap="round" fill="none"/>
        <path d="M150 74C176 72 196 88 196 110C174 112 156 100 150 74Z" fill="#fff" fill-opacity=".3" stroke="#B98368" stroke-width="2.6"/>
        <g transform="rotate(-4 122 86)"><rect x="52" y="74" width="140" height="26" rx="13" fill="#fff" stroke="#0B2455" stroke-width="3"/><rect x="72" y="80" width="100" height="14" rx="7" fill="#DCEBFA" stroke="#7F9FCB" stroke-width="2"/><circle cx="130" cy="87" r="5.4" fill="${TEAL}"/>${[82, 98, 114, 130, 146, 162].map((x) => `<path d="M${x} 80V84" stroke="#0B2455" stroke-width="2"/>`).join('')}<path d="M122 74V100" stroke="${RED}" stroke-width="2.2"/></g>`);
    }
    case 'xray': { // illustrative radiograph (explicitly an illustration; labelled in HTML)
      const sp = spine({ view: 'post', kind: 'scol', ribs: true, xray: true, cobb: true, vb: '10 96 200 420' });
      return wrapE(`<rect width="240" height="150" fill="#070B14"/><g opacity=".16" stroke="#8FA3C2">${[30, 60, 90, 120].map((y) => `<path d="M0 ${y}H240"/>`).join('')}</g>${sp.replace('<svg ', '<svg x="84" y="0" width="71" height="150" ')}`);
    }
    default: return wrapE(BGR());
  }
}
