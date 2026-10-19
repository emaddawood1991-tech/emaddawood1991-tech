// Pediatric gait / foot / posture illustrations (original vector art, no text inside).
// person(): stylised child built from round-capped strokes. Arabic labels are always HTML overlays.
let n = 0; const uid = (p) => `${p}${++n}`;
const SK = '#F3C9AE', SKD = '#DFA586', SH = '#2E5AB4', SHD = '#244A96', SHORT = '#0B2455', SHOE = '#D7262E', HAIR = '#3B2A20';
const P = (pts) => pts.map((p) => p.join(' ')).join('L');
const line = (pts, w, c, extra = '') => `<path d="M${P(pts)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

// Poses in a 400x640 box, child facing right (flipped on render so it walks toward the left = reading direction).
const POSES = {
  walk:  { head: [214, 92], neck: [206, 150], hip: [194, 320], armN: [[236, 238], [274, 308]], armF: [[166, 240], [130, 304]], legN: [[246, 448], [262, 560], [306, 584]], legF: [[150, 452], [108, 548], [138, 586]] },
  run:   { head: [252, 98], neck: [234, 152], hip: [196, 318], armN: [[250, 224], [300, 238]], armF: [[168, 238], [126, 196]], legN: [[272, 392], [248, 500], [290, 512]], legF: [[148, 452], [84, 522], [104, 556]] },
  limp:  { head: [208, 100], neck: [200, 156], hip: [186, 326], armN: [[232, 252], [238, 332]], armF: [[160, 252], [132, 312]], legN: [[212, 452], [226, 566], [268, 586]], legF: [[166, 458], [150, 566], [190, 588]], rot: -7 },
  fall:  { head: [214, 92], neck: [206, 150], hip: [194, 320], armN: [[250, 220], [300, 190]], armF: [[160, 236], [116, 214]], legN: [[250, 440], [276, 550], [318, 574]], legF: [[150, 450], [118, 520], [152, 540]], rot: 16 },
  balance: { head: [210, 94], neck: [204, 152], hip: [196, 322], armN: [[262, 226], [334, 206]], armF: [[144, 228], [72, 208]], legN: [[198, 458], [198, 572], [240, 590]], legF: [[264, 432], [254, 524], [290, 528]] },
};

export function person(name = 'walk', { flip = true, mocap = false, shirt = SH, id } = {}) {
  const p = POSES[name]; const shirtD = shirt === SH ? SHD : '#0E8FA3';
  const [hx, hy] = p.head, S = p.neck, H = p.hip;
  const arm = (a, sl, hand) => `${line([S, a[0]], 24, sl)}${line([a[0], a[1]], 20, hand)}<circle cx="${a[1][0]}" cy="${a[1][1]}" r="12" fill="${hand}"/>`;
  const leg = (l, short, skin, shoe) => `${line([H, l[0]], 40, short)}${line([l[0], l[1]], 27, skin)}${line([l[1], l[2]], 25, shoe)}`;
  const body = `<ellipse cx="${(H[0] + 40).toFixed(0)}" cy="612" rx="150" ry="14" fill="#0B2455" opacity=".12"/>
    ${arm(p.armF, shirtD, SKD)}${leg(p.legF, '#13306B', SKD, '#B71C24')}
    ${line([S, H], 74, shirt)}${line([S, [hx - 6, hy + 40]], 22, SK)}
    ${leg(p.legN, SHORT, SK, SHOE)}${arm(p.armN, shirt, SK)}
    <circle cx="${hx}" cy="${hy}" r="45" fill="${SK}"/>
    <path d="M${hx - 46} ${hy + 4}A46 46 0 0 1 ${hx + 46} ${hy + 4}Q${hx + 18} ${hy - 18} ${hx - 46} ${hy + 4}Z" fill="${HAIR}"/>
    <circle cx="${hx + 45}" cy="${hy + 10}" r="7" fill="${SK}"/><circle cx="${hx + 22}" cy="${hy + 4}" r="4" fill="#2a1d16"/><circle cx="${hx - 18}" cy="${hy + 14}" r="8" fill="${SKD}"/><path d="M${hx + 22} ${hy + 24}q9 9 19 0" stroke="#7a4a3a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="${hx + 14}" cy="${hy + 18}" r="7" fill="#F0A58E" opacity=".6"/>`;
  const dots = mocap ? (() => {
    const pts = [S, H, p.legN[0], p.legN[1], p.legF[0], p.legF[1]]; const c = '#27D3E6';
    return `<g stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".95"><path d="M${P([S, H])}"/><path d="M${P([H, p.legN[0], p.legN[1], p.legN[2]])}"/><path d="M${P([H, p.legF[0], p.legF[1], p.legF[2]])}"/></g>${pts.map((q) => `<circle cx="${q[0]}" cy="${q[1]}" r="9" fill="#fff" stroke="${c}" stroke-width="5"/>`).join('')}`;
  })() : '';
  const rot = p.rot ? ` rotate(${p.rot} ${H[0]} ${H[1]})` : '';
  const g = `<g transform="${flip ? 'translate(400 0) scale(-1 1)' : ''}${rot}">${body}${dots}</g>`;
  return g.replace('transform=" ', 'transform="');
}
export const childSvg = (pose, opts) => `<svg viewBox="0 0 400 640" xmlns="http://www.w3.org/2000/svg">${person(pose, opts)}</svg>`;

/* ---- foot (plantar view) ---- */
const FOOT = 'M100 34C132 34 148 62 146 96C144 124 126 134 124 156C122 182 110 194 92 194C70 194 62 176 66 154C70 130 52 116 52 88C52 56 70 34 100 34Z';
const TOES = [[121, 20, 13], [92, 17, 9], [72, 25, 8], [58, 39, 7.5], [49, 56, 6.5]];
const foot = (fill = '#F3C9AE', stroke = '#DFA586', w = 3) => `<path d="${FOOT}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>${TOES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`).join('')}`;

/* ---- 200x200 tiles ---- */
export function tile(kind) {
  const T = '#1FA8B8', R = '#D7262E', N = '#0B2455';
  const wrap = (inner, defs = '') => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${defs ? `<defs>${defs}</defs>` : ''}${inner}</svg>`;
  const person200 = (pose, o = {}) => `<g transform="translate(${o.x ?? 52} ${o.y ?? 6}) scale(${o.s ?? 0.29})">${person(pose, o)}</g>`;
  switch (kind) {
    case 'foot': return wrap(`<g transform="translate(14 4) scale(.92)">${foot()}</g>
      <path d="M100 180V30" stroke="${T}" stroke-width="3" stroke-dasharray="6 6"/><path d="M70 150C92 110 112 120 134 150" stroke="${R}" stroke-width="4" fill="none" stroke-linecap="round" transform="translate(0 -2)"/>
      <circle cx="100" cy="100" r="6" fill="#fff" stroke="${T}" stroke-width="3"/>`);
    case 'pressure': {
      const c = uid('c'), a = uid('a'), b = uid('b'), d = uid('d');
      const blob = (id, col) => `<radialGradient id="${id}"><stop offset="0" stop-color="${col}" stop-opacity=".95"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;
      return wrap(`<g transform="translate(14 4) scale(.92)"><clipPath id="${c}"><path d="${FOOT}"/>${TOES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</clipPath>
        <path d="${FOOT}" fill="#CFE6F7"/>${TOES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#CFE6F7"/>`).join('')}
        <g clip-path="url(#${c})"><circle cx="96" cy="166" r="34" fill="url(#${a})"/><circle cx="108" cy="72" r="38" fill="url(#${b})"/><circle cx="124" cy="122" r="22" fill="url(#${d})"/>
        <circle cx="121" cy="22" r="15" fill="url(#${d})"/><circle cx="90" cy="20" r="10" fill="url(#${d})"/></g>
        <path d="${FOOT}" fill="none" stroke="#5B8FC9" stroke-width="3"/></g>`,
        blob(a, '#E5322D') + blob(b, '#F6A21E') + blob(d, '#5CC66B'));
    }
    case 'gait': return wrap(`<path d="M16 178H184" stroke="${T}" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/>${person200('walk', { mocap: true, x: 56, s: .28 })}`);
    case 'spine': case 'tilt': {
      const tilt = kind === 'tilt'; const y = (i) => 62 + i * 8.4; const x = (i) => 100 + (tilt ? Math.sin(i / 11 * Math.PI) * 5 : 0);
      return wrap(`<circle cx="100" cy="30" r="18" fill="${SK}"/><path d="M82 30A18 18 0 0 1 118 30Q100 20 82 30Z" fill="${HAIR}"/><rect x="92" y="44" width="16" height="16" rx="6" fill="${SK}"/>
        <path d="M44 84Q100 56 156 84L148 112 140 156Q100 170 60 156L52 112Z" fill="#8FB8E3" opacity=".55" transform="${tilt ? 'rotate(-4 100 110)' : ''}"/>
        <path d="M44 84Q100 56 156 84L148 112 140 156Q100 170 60 156L52 112Z" fill="none" stroke="#2E5AB4" stroke-width="3" transform="${tilt ? 'rotate(-4 100 110)' : ''}"/>
        ${Array.from({ length: 11 }, (_, i) => `<ellipse cx="${x(i)}" cy="${y(i)}" rx="${5.5 - i * 0.1}" ry="3.6" fill="#fff" stroke="${N}" stroke-width="2"/>`).join('')}
        <path d="M100 14V190" stroke="${T}" stroke-width="3" stroke-dasharray="6 6"/>
        <path d="M30 ${tilt ? 94 : 84}L170 ${tilt ? 72 : 84}" stroke="${R}" stroke-width="4" stroke-linecap="round"/><circle cx="30" cy="${tilt ? 94 : 84}" r="5" fill="${R}"/><circle cx="170" cy="${tilt ? 72 : 84}" r="5" fill="${R}"/>`);
    }
    case 'steps': {
      const sole = (x, y, s = .26, r = 90) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-100 -110)">${foot('#8FB8E3', '#2E5AB4', 5)}</g>`;
      return wrap(`${[26, 66, 140, 172].map((x) => sole(x, 62)).join('')}${[48, 112, 158].map((x) => sole(x, 132)).join('')}
        <path d="M26 98H66M140 98H172" stroke="${R}" stroke-width="3.5" stroke-linecap="round"/><path d="M66 98H140" stroke="${R}" stroke-width="3.5" stroke-dasharray="3 7" stroke-linecap="round"/>`);
    }
    case 'align': return wrap(`<g transform="translate(5 30) rotate(10 40 70) scale(.62)">${foot()}</g><g transform="translate(73 30) rotate(-10 40 70) scale(.62)">${foot()}</g>
        <path d="M66 20V190M134 20V190" stroke="${T}" stroke-width="3" stroke-dasharray="6 6"/>`);
    case 'balance': return wrap(`<path d="M30 70Q16 100 30 130M170 70Q184 100 170 130" stroke="${T}" stroke-width="4" fill="none" stroke-dasharray="3 8" stroke-linecap="round"/>${person200('balance', { x: 52, s: .29 })}`);
    case 'pain': return wrap(`<path d="M92 30L96 100L92 160" stroke="${SK}" stroke-width="46" fill="none" stroke-linecap="round"/><path d="M92 100L92 150" stroke="${SK}" stroke-width="32" stroke-linecap="round"/>
        <ellipse cx="98" cy="178" rx="34" ry="14" fill="${SHOE}"/>${[[96, 104, 14], [92, 146, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${R}" stroke-width="4"/><circle cx="${x}" cy="${y}" r="${r + 14}" fill="none" stroke="${R}" stroke-width="3" opacity=".45"/>`).join('')}`);
    case 'limp': return wrap(`<path d="M20 180H70M110 180H132M150 180H180" stroke="${T}" stroke-width="3" stroke-linecap="round"/>${person200('limp', { x: 56, s: .28 })}`);
    case 'run': return wrap(`<path d="M16 60H46M10 84H36M20 108H44" stroke="${T}" stroke-width="4" stroke-linecap="round" opacity=".6"/>${person200('run', { x: 52, s: .29 })}`);
    case 'fall': return wrap(`<path d="M36 40Q20 100 56 170" stroke="${T}" stroke-width="4" fill="none" stroke-dasharray="3 8" stroke-linecap="round"/>${person200('fall', { x: 56, s: .27 })}`);
    default: return wrap('');
  }
}

/* Hero scene: bright room, floor, soft window light, child with motion-analysis overlay. 860x600. */
export function scene(pose = 'walk', { mocap = true, mood = 'bright' } = {}) {
  const w = uid('w'), fl = uid('f'), win = uid('i');
  return `<svg viewBox="0 0 860 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="${w}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4FAFF"/><stop offset="1" stop-color="#D9EEF8"/></linearGradient>
    <linearGradient id="${fl}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9DFD0"/><stop offset="1" stop-color="#D8C8B0"/></linearGradient>
    <linearGradient id="${win}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#CDEBF6"/></linearGradient></defs>
    <rect width="860" height="600" fill="url(#${w})"/>
    <rect x="70" y="40" width="330" height="270" rx="22" fill="url(#${win})" stroke="#fff" stroke-width="10"/><path d="M235 40V310M70 175H400" stroke="#fff" stroke-width="8"/>
    <circle cx="560" cy="120" r="150" fill="#fff" opacity=".45"/><circle cx="560" cy="120" r="95" fill="#fff" opacity=".5"/>
    <rect y="430" width="860" height="170" fill="url(#${fl})"/><path d="M0 430H860" stroke="#fff" stroke-opacity=".7" stroke-width="4"/>
    <path d="M40 520Q430 478 820 520" stroke="#1FA8B8" stroke-width="5" stroke-dasharray="3 14" stroke-linecap="round" fill="none"/>
    <path d="M60 560Q430 520 800 560" stroke="#2E5AB4" stroke-opacity=".25" stroke-width="3" fill="none"/>
    <g transform="translate(440 8) scale(.88)">${person(pose, { mocap, shirt: mood === 'bright' ? SH : '#1FA8B8' })}</g></svg>`;
}
