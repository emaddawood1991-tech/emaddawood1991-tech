// Pediatric gait / foot / posture illustration family — ONE style: flat fills, uniform navy outline, FMC palette.
// No text inside any SVG (Arabic is always HTML). Icons share: 200x200 badge, ice circle, 3.4-unit outline.
let n = 0; const uid = (p) => `${p}${++n}`;
const NAVY = '#0B2455', BLUE = '#2E5AB4', SKY = '#8FB8E3', ICE = '#EAF3FB', TEAL = '#1FA8B8', RED = '#D7262E';
const SKIN = '#FAD2B8', SKIN_D = '#EDB99C', SHORTS = '#0B2455', SHORTS_D = '#173469', SLV_D = '#244A96', SHOE = '#FFFFFF';
const LW = 3.4;                                     // outline weight in 200-unit icon space
const P = (pts) => pts.map((p) => p.join(' ')).join('L');
const seg = (pts, w, c, cap = 'round') => `<path d="M${P(pts)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="${cap}" stroke-linejoin="round"/>`;

/* ------------------------------ child figure ------------------------------ */
// Poses in a 400x640 box, child facing right (flipped on render so the child walks toward the reading direction).
const POSES = {
  walk:    { head: [214, 92], neck: [206, 150], hip: [194, 320], armN: [[236, 238], [274, 308]], armF: [[166, 240], [130, 304]], legN: [[246, 448], [262, 560], [306, 584]], legF: [[150, 452], [108, 548], [138, 586]] },
  run:     { head: [252, 98], neck: [234, 152], hip: [196, 318], armN: [[250, 224], [300, 238]], armF: [[168, 238], [126, 196]], legN: [[272, 392], [248, 500], [290, 512]], legF: [[148, 452], [84, 522], [104, 556]] },
  limp:    { head: [208, 100], neck: [200, 156], hip: [186, 326], armN: [[232, 252], [238, 332]], armF: [[160, 252], [132, 312]], legN: [[212, 452], [226, 566], [268, 586]], legF: [[166, 458], [150, 566], [190, 588]], rot: -7 },
  fall:    { head: [214, 92], neck: [206, 150], hip: [194, 320], armN: [[250, 220], [300, 190]], armF: [[160, 236], [116, 214]], legN: [[250, 440], [276, 550], [318, 574]], legF: [[150, 450], [118, 520], [152, 540]], rot: 16 },
  balance: { head: [210, 94], neck: [204, 152], hip: [196, 322], armN: [[262, 226], [334, 206]], armF: [[144, 228], [72, 208]], legN: [[198, 458], [198, 572], [240, 590]], legF: [[264, 432], [254, 524], [290, 528]] },
};

export function person(name = 'walk', { flip = true, mocap = false, o = 6, smile = true, shirt = BLUE } = {}) {
  const p = POSES[name]; const [hx, hy] = p.head, S = p.neck, H = p.hip;
  const slvD = shirt === BLUE ? SLV_D : '#0E8FA3';
  // a limb = outlines first (no seams between its own segments), then fills
  const limb = (parts) => parts.map(([pts, w]) => seg(pts, w + 2 * o, NAVY)).join('') + parts.map(([pts, w, c]) => seg(pts, w, c)).join('');
  const arm = (a, sleeve, hand) => limb([[[S, a[0]], 26, sleeve], [[a[0], a[1]], 21, hand]]) + `<circle cx="${a[1][0]}" cy="${a[1][1]}" r="${12 + o}" fill="${NAVY}"/><circle cx="${a[1][0]}" cy="${a[1][1]}" r="12" fill="${hand}"/>`;
  const leg = (l, short, skin, shoe) => limb([[[H, l[0]], 42, short], [[l[0], l[1]], 28, skin], [[l[1], l[2]], 26, shoe]]);
  const body = `<ellipse cx="${H[0] + 40}" cy="614" rx="150" ry="13" fill="${NAVY}" opacity=".10"/>
    ${arm(p.armF, slvD, SKIN_D)}${leg(p.legF, SHORTS_D, SKIN_D, SHOE)}
    ${limb([[[S, H], 76, shirt]])}${seg([S, [hx - 6, hy + 40]], 22 + 2 * o, NAVY)}${seg([S, [hx - 6, hy + 40]], 22, SKIN)}
    ${leg(p.legN, SHORTS, SKIN, SHOE)}${arm(p.armN, shirt, SKIN)}
    <circle cx="${hx}" cy="${hy}" r="${45 + o}" fill="${NAVY}"/><circle cx="${hx}" cy="${hy}" r="45" fill="${SKIN}"/>
    <path d="M${hx - 46} ${hy - 4}A46 46 0 0 1 ${hx + 46} ${hy - 4}Q${hx + 8} ${hy - 26} ${hx - 46} ${hy - 4}Z" fill="${NAVY}"/>
    <circle cx="${hx + 22}" cy="${hy + 6}" r="4.5" fill="${NAVY}"/>${smile ? `<path d="M${hx + 22} ${hy + 25}q9 9 19 0" stroke="${NAVY}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` : ''}`;
  const dots = mocap ? (() => {
    const c = TEAL, pts = [S, H, p.legN[0], p.legN[1], p.legF[0], p.legF[1]];
    return `<g stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"><path d="M${P([S, H])}"/><path d="M${P([H, ...p.legN])}"/><path d="M${P([H, ...p.legF])}"/></g>${pts.map((q) => `<circle cx="${q[0]}" cy="${q[1]}" r="10" fill="#fff" stroke="${c}" stroke-width="5"/>`).join('')}`;
  })() : '';
  const rot = p.rot ? ` rotate(${p.rot} ${H[0]} ${H[1]})` : '';
  return `<g transform="${(flip ? 'translate(400 0) scale(-1 1)' : '') + rot}".trim()>${body}${dots}</g>`.replace('".trim()', '"').replace('transform=" ', 'transform="');
}
export const childSvg = (pose, opts) => `<svg viewBox="0 0 400 640" xmlns="http://www.w3.org/2000/svg">${person(pose, { o: 5.5, ...opts })}</svg>`;

/* ------------------------------ foot (plantar view) ------------------------------ */
const FOOT = 'M100 34C132 34 148 62 146 96C144 124 126 134 124 156C122 182 110 194 92 194C70 194 62 176 66 154C70 130 52 116 52 88C52 56 70 34 100 34Z';
const TOES = [[121, 20, 13], [92, 17, 9], [72, 25, 8], [58, 39, 7.5], [49, 56, 6.5]];
const sole = (fill, stroke = NAVY, w = 3) => `<path d="${FOOT}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>${TOES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`).join('')}`;
// place a sole: centre (cx,cy) in icon space, height h, rotation deg, mirror for the right foot
const soleAt = (fill, cx, cy, h, rot = 0, mirror = false, w = 3) => { const s = h / 190, sw = w / s; return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${mirror ? -s : s} ${s}) translate(-98 -104)">${sole(fill, NAVY, sw)}</g>`; };

/* ------------------------------ 200x200 icon family ------------------------------ */
export function tile(kind, { tint = ICE } = {}) {
  const dash = (d, c = TEAL, w = 3) => `<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-dasharray="6 6" stroke-linecap="round" fill="none"/>`;
  const wrap = (inner, defs = '') => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${defs ? `<defs>${defs}</defs>` : ''}<circle cx="100" cy="100" r="96" fill="${tint}"/>${inner}</svg>`;
  const fig = (pose, x, y, s, extra = {}) => `<g transform="translate(${x} ${y}) scale(${s})">${person(pose, { o: LW / s, smile: false, ...extra })}</g>`;
  const back = (tilt) => {
    const sh = tilt ? [[30, 77], [170, 57]] : [[30, 66], [170, 66]], hp = tilt ? [[44, 123], [156, 113]] : [[44, 120], [156, 120]];
    const spine = tilt ? 'M100 58C94 74 108 90 100 106C96 114 104 118 100 124' : 'M100 56V124';
    const gc = tilt ? RED : TEAL;
    return wrap(`<g stroke="${NAVY}" stroke-width="${LW}" stroke-linejoin="round" stroke-linecap="round">
      <rect x="74" y="136" width="22" height="42" rx="9" fill="${SKIN}"/><rect x="104" y="136" width="22" height="42" rx="9" fill="${SKIN}"/>
      <ellipse cx="85" cy="181" rx="12" ry="6" fill="${SKIN}"/><ellipse cx="115" cy="181" rx="12" ry="6" fill="${SKIN}"/>
      <rect x="40" y="76" width="15" height="58" rx="7" fill="${SKIN}"/><rect x="145" y="76" width="15" height="58" rx="7" fill="${SKIN}"/>
      <path d="M68 118H132L134 148H104L100 136L96 148H66Z" fill="${SHORTS}"/>
      <path d="M62 62Q100 52 138 62L152 92L137 99L135 124H65L63 99L48 92Z" fill="${BLUE}"/>
      <rect x="92" y="44" width="16" height="16" rx="6" fill="${SKIN}"/>
      <circle cx="82" cy="34" r="4.5" fill="${SKIN}"/><circle cx="118" cy="34" r="4.5" fill="${SKIN}"/><circle cx="100" cy="32" r="18" fill="${SKIN}"/>
      <path d="M82 30A18 18 0 0 1 118 30Q118 46 100 48Q82 46 82 30Z" fill="${NAVY}"/></g>
      <path d="${spine}" stroke="#fff" stroke-width="3.4" stroke-dasharray="5 5" stroke-linecap="round" fill="none"/>
      <path d="M${sh[0][0]} ${sh[0][1]}L${sh[1][0]} ${sh[1][1]}M${hp[0][0]} ${hp[0][1]}L${hp[1][0]} ${hp[1][1]}" stroke="${gc}" stroke-width="3.4" stroke-linecap="round"/>
      ${[...sh, ...hp].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="${gc}"/>`).join('')}`);
  };
  switch (kind) {
    case 'scan': return wrap(`<ellipse cx="100" cy="170" rx="66" ry="9" fill="${NAVY}" opacity=".10"/>
      <g transform="rotate(-7 100 108)"><rect x="30" y="66" width="140" height="92" rx="14" fill="#9FB3D1" stroke="${NAVY}" stroke-width="${LW}"/>
      <rect x="30" y="58" width="140" height="92" rx="14" fill="#fff" stroke="${NAVY}" stroke-width="${LW}"/><rect x="40" y="68" width="120" height="72" rx="8" fill="#F1F7FD" stroke="${SKY}" stroke-width="2"/>
      ${soleAt(NAVY, 74, 104, 56, 0, false, 0)}${soleAt(NAVY, 126, 104, 56, 0, true, 0)}
      <path d="M34 104H166" stroke="${TEAL}" stroke-width="10" opacity=".25" stroke-linecap="round"/><path d="M34 104H166" stroke="${TEAL}" stroke-width="${LW}" stroke-linecap="round"/></g>
      <path d="M26 46V34H38M174 46V34H162" stroke="${TEAL}" stroke-width="${LW}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
    case 'pressure': {
      const c = uid('c'), a = uid('a'), b = uid('b'), d = uid('d'), e = uid('e');
      const blob = (id, col) => `<radialGradient id="${id}"><stop offset="0" stop-color="${col}" stop-opacity=".97"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;
      const heat = (cx, mirror) => { const s = 150 / 190; return `<g transform="translate(${cx} 100) scale(${mirror ? -s : s} ${s}) translate(-98 -104)">
        <clipPath id="${c}${mirror ? 'm' : ''}"><path d="${FOOT}"/>${TOES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</clipPath>
        <path d="${FOOT}" fill="#CFE6F7"/>${TOES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#CFE6F7"/>`).join('')}
        <g clip-path="url(#${c}${mirror ? 'm' : ''})"><circle cx="96" cy="164" r="34" fill="url(#${a})"/><circle cx="108" cy="72" r="38" fill="url(#${b})"/><circle cx="124" cy="120" r="22" fill="url(#${d})"/><circle cx="121" cy="22" r="15" fill="url(#${e})"/><circle cx="90" cy="20" r="10" fill="url(#${e})"/></g>
        <path d="${FOOT}" fill="none" stroke="${NAVY}" stroke-width="${LW / s}" stroke-linejoin="round"/>${TOES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${NAVY}" stroke-width="${LW / s}"/>`).join('')}</g>`; };
      return wrap(`${heat(60, false)}${heat(140, true)}${dash('M100 16V184', TEAL, 2.6)}`, blob(a, '#E5322D') + blob(b, '#F6A21E') + blob(d, '#5CC66B') + blob(e, '#F2D13A'));
    }
    case 'gait': return wrap(`<path d="M28 172H172" stroke="${NAVY}" stroke-width="${LW}" stroke-linecap="round"/>${fig('walk', 40, 6, 0.3)}`);
    case 'spine': return back(false);
    case 'tilt': return back(true);
    case 'steps': {
      const f = (x, y) => soleAt(ICE === tint ? '#fff' : '#fff', x, y, 38, 90, false, LW);
      return wrap(`${[26, 62, 128, 164].map((x) => f(x, 70)).join('')}${[44, 96, 150].map((x) => f(x, 128)).join('')}
        <path d="M62 100H128" stroke="${RED}" stroke-width="${LW}" stroke-dasharray="5 7" stroke-linecap="round"/><path d="M62 94V106M128 94V106" stroke="${RED}" stroke-width="${LW}" stroke-linecap="round"/>`);
    }
    case 'align': return wrap(`${soleAt('#fff', 66, 102, 124, 9, false, LW)}${soleAt('#fff', 134, 102, 124, -9, true, LW)}${dash('M66 14V190', TEAL, 2.6)}${dash('M134 14V190', TEAL, 2.6)}
        <path d="M84 24Q100 34 116 24" stroke="${RED}" stroke-width="${LW}" fill="none" stroke-linecap="round"/>`);
    case 'balance': return wrap(`<path d="M30 70Q16 100 30 130M170 70Q184 100 170 130" stroke="${TEAL}" stroke-width="${LW}" fill="none" stroke-dasharray="3 8" stroke-linecap="round"/>${fig('balance', 42, 8, 0.29)}`);
    case 'pain': {
      const ring = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${RED}" stroke-width="${LW}"/><circle cx="${x}" cy="${y}" r="${r + 10}" fill="none" stroke="${RED}" stroke-width="2.4" opacity=".45"/>`;
      return wrap(`${seg([[96, 34], [98, 92]], 46 + 6.8, NAVY)}${seg([[98, 92], [96, 150]], 32 + 6.8, NAVY)}${seg([[96, 34], [98, 92]], 46, SKIN)}${seg([[98, 92], [96, 150]], 32, SKIN)}
        <path d="M60 160Q60 148 82 148H124Q148 150 148 166Q148 176 136 176H66Q58 176 60 160Z" fill="#fff" stroke="${NAVY}" stroke-width="${LW}" stroke-linejoin="round"/>${ring(98, 94, 12)}${ring(96, 130, 10)}`);
    }
    case 'limp': return wrap(`<path d="M24 172H70M102 172H128M150 172H176" stroke="${NAVY}" stroke-width="${LW}" stroke-linecap="round"/>${fig('limp', 40, 6, 0.3)}`);
    case 'run': return wrap(`<path d="M20 70H44M14 92H36M22 114H44" stroke="${TEAL}" stroke-width="${LW}" stroke-linecap="round"/>${fig('run', 36, 8, 0.3)}`);
    case 'fall': return wrap(`<path d="M34 44Q16 100 54 168" stroke="${TEAL}" stroke-width="${LW}" fill="none" stroke-dasharray="3 8" stroke-linecap="round"/>${fig('fall', 42, 10, 0.28)}`);
    default: return wrap('');
  }
}

/* Hero scene: bright room, floor, window light, child with motion-analysis overlay. 860x600. */
export function scene(pose = 'walk', { mocap = true } = {}) {
  const w = uid('w'), fl = uid('f'), win = uid('i');
  return `<svg viewBox="0 0 860 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="${w}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4FAFF"/><stop offset="1" stop-color="#D9EEF8"/></linearGradient>
    <linearGradient id="${fl}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9DFD0"/><stop offset="1" stop-color="#D8C8B0"/></linearGradient>
    <linearGradient id="${win}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#CDEBF6"/></linearGradient></defs>
    <rect width="860" height="600" fill="url(#${w})"/>
    <rect x="70" y="40" width="330" height="270" rx="22" fill="url(#${win})" stroke="#fff" stroke-width="10"/><path d="M235 40V310M70 175H400" stroke="#fff" stroke-width="8"/>
    <circle cx="560" cy="120" r="150" fill="#fff" opacity=".45"/><circle cx="560" cy="120" r="95" fill="#fff" opacity=".5"/>
    <rect y="430" width="860" height="170" fill="url(#${fl})"/><path d="M0 430H860" stroke="#fff" stroke-opacity=".7" stroke-width="4"/>
    <path d="M40 520Q430 478 820 520" stroke="${TEAL}" stroke-width="5" stroke-dasharray="3 14" stroke-linecap="round" fill="none"/>
    <g transform="translate(440 8) scale(.88)">${person(pose, { mocap, o: 5.5 })}</g></svg>`;
}
