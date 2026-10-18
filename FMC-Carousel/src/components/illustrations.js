// Vector medical illustrations (SVG). Arabic labels are NEVER inside the SVG — they are HTML overlays (see label()).
let uid = 0;
const id = (p) => `${p}${++uid}`;

/* Hand (palm view) + median nerve path, compression at the wrist, sensory zones highlighted. */
export function handNerve({ sparkle = true } = {}) {
  const g = id('g'), glow = id('glow'), red = id('red'), skin = id('skin'), fade = id('fd'), mk = id('mk');
  const fingers = [
    ['M235 440L228 240', 62], ['M307 430L307 196', 64], ['M378 440L386 230', 62], ['M446 468L466 312', 56],
    ['M208 612C140 566 118 480 122 392', 68],
  ];
  const stroke = (extra, color) => fingers.map(([d, w]) => `<path d="${d}" stroke="${color}" stroke-width="${w + extra}" fill="none" stroke-linecap="round"/>`).join('');
  const palm = 'M205 440C150 480 140 590 202 706L412 706C446 640 488 560 480 456Z';
  const fore = 'M205 690C200 760 186 830 180 900L452 900C442 830 422 760 412 690Z';
  const star = (x, y, s, c = '#D7262E') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-14L3.4-3.4 14 0 3.4 3.4 0 14-3.4 3.4-14 0-3.4-3.4Z" fill="${c}"/>`;
  return `<svg viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${skin}" gradientUnits="userSpaceOnUse" x1="120" y1="200" x2="480" y2="900"><stop offset="0" stop-color="#F8DAC6"/><stop offset="1" stop-color="#EDBA9D"/></linearGradient>
    <linearGradient id="${g}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F29A1F"/><stop offset="1" stop-color="#FFD23F"/></linearGradient>
    <radialGradient id="${red}"><stop offset="0" stop-color="#D7262E" stop-opacity=".55"/><stop offset="1" stop-color="#D7262E" stop-opacity="0"/></radialGradient>
    <linearGradient id="${fade}" gradientUnits="userSpaceOnUse" x1="0" y1="760" x2="0" y2="900"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="${mk}"><rect width="600" height="900" fill="url(#${fade})"/></mask>
    <filter id="${glow}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <g mask="url(#${mk})">
  <g stroke-linejoin="round">
    <g fill="#DDA284" stroke="#DDA284" stroke-width="8"><path d="${fore}"/><path d="${palm}"/></g>${stroke(10, '#DDA284')}
    <g fill="url(#${skin})" stroke="url(#${skin})" stroke-width="2"><path d="${fore}"/><path d="${palm}"/></g>${stroke(0, `url(#${skin})`)}
  </g>
  <g fill="none" stroke="#C98B6B" stroke-width="3" stroke-linecap="round" opacity=".35">
    <path d="M222 520C270 545 330 545 392 510"/><path d="M214 580C280 600 340 598 414 560"/><path d="M185 470C175 520 190 580 215 620"/></g>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g filter="url(#${glow})" stroke="#FFC44D" opacity=".85" stroke-width="22"><path d="M318 900V690C318 640 318 600 316 566"/></g>
    <path d="M318 900V690C318 640 318 600 316 566" stroke="url(#${g})" stroke-width="15"/>
    <path d="M316 566C316 600 290 600 258 520C246 486 236 380 232 276" stroke="url(#${g})" stroke-width="9"/>
    <path d="M316 566C316 500 312 380 309 262" stroke="url(#${g})" stroke-width="9"/>
    <path d="M316 566C330 520 372 480 382 310" stroke="url(#${g})" stroke-width="9"/>
    <path d="M316 580C262 590 170 540 126 400" stroke="url(#${g})" stroke-width="9"/>
    <path d="M318 900V566" stroke="#FFF3C4" stroke-width="3" opacity=".7"/>
  </g>
  <ellipse cx="312" cy="672" rx="96" ry="64" fill="url(#${red})"/>
  <rect x="196" y="652" width="232" height="40" rx="20" fill="rgba(46,90,180,.32)" stroke="#2E5AB4" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/>
  <path d="M296 672l-26-17v34zM328 672l26-17v34z" fill="#D7262E"/>
    </g>
  ${sparkle ? [star(128, 340, .9), star(232, 220, .9), star(312, 170, 1), star(390, 205, .9)].join('') : ''}
</svg>`;
}

/* Axial cross-section of the wrist at the carpal tunnel (palmar side down). Stylised patient-education drawing. */
export function wristCross({ pressure = true } = {}) {
  const skin = id('s'), bone = id('b'), tend = id('t'), nerve = id('n');
  const tendons = [[262, 292], [318, 288], [374, 288], [430, 296], [292, 342], [348, 340], [404, 344], [232, 346]];
  return `<svg viewBox="0 0 860 580" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="${skin}" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#F9DCC9"/><stop offset=".75" stop-color="#EEBFA2"/><stop offset="1" stop-color="#E2A688"/></radialGradient>
    <radialGradient id="${bone}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFFBEF"/><stop offset="1" stop-color="#DCCDAE"/></radialGradient>
    <radialGradient id="${tend}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFF4EA"/><stop offset="1" stop-color="#E6C3A6"/></radialGradient>
    <linearGradient id="${nerve}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD84D"/><stop offset="1" stop-color="#F0A21E"/></linearGradient>
  </defs>
  <g transform="translate(115 20) scale(.9)">
    <ellipse cx="350" cy="300" rx="300" ry="232" fill="url(#${skin})" stroke="#D79A7B" stroke-width="5"/>
    <ellipse cx="350" cy="300" rx="272" ry="206" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="3"/>
    <!-- carpal bones forming the arch -->
    <g fill="url(#${bone})" stroke="#B8A783" stroke-width="4">
      <ellipse cx="160" cy="318" rx="62" ry="54"/><ellipse cx="222" cy="210" rx="56" ry="48"/>
      <ellipse cx="350" cy="180" rx="72" ry="62"/><ellipse cx="474" cy="210" rx="58" ry="50"/><ellipse cx="520" cy="322" rx="42" ry="50"/>
    </g>
    <!-- tunnel interior -->
    <path d="M205 330C210 270 250 250 350 246C450 250 490 270 494 330C480 372 430 412 350 416C270 412 220 372 205 330Z" fill="#F6E5D6" opacity=".55"/>
    <g fill="url(#${tend})" stroke="#B98A68" stroke-width="3.5">${tendons.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="24"/>`).join('')}</g>
    <!-- median nerve -->
    <ellipse cx="346" cy="388" rx="60" ry="21" fill="url(#${nerve})" stroke="#C97F12" stroke-width="4"/>
    <ellipse cx="338" cy="382" rx="34" ry="6" fill="#fff" opacity=".45"/>
    <!-- flexor retinaculum (transverse carpal ligament) -->
    <path d="M178 374Q345 478 512 372" fill="none" stroke="#2E5AB4" stroke-width="30" stroke-linecap="round"/>
    <path d="M178 374Q345 478 512 372" fill="none" stroke="#8FB8E3" stroke-width="18" stroke-linecap="round"/>
    ${pressure ? `<g fill="#D7262E"><path d="M300 452l-18-24h36zM392 450l18-24h-36z" transform="translate(0 -6)"/><path d="M346 296l-16 22h32z" transform="translate(0 -2)"/></g>` : ''}
  </g>
</svg>`;
}

/* Label: HTML overlay + SVG leader line. Positions in the illustration's own coordinate space (860x700). */
export function labels(items, { w = 860, h = 580 } = {}) {
  const lines = items.map(({ x, y, lx, ly }) => `<path d="M${lx} ${ly}L${x} ${y}" stroke="#0B2455" stroke-width="3" fill="none"/><circle cx="${x}" cy="${y}" r="7" fill="#fff" stroke="#0B2455" stroke-width="3.5"/>`).join('');
  const tags = items.map(({ text, lx, ly, tone }) => `<div class="label ${tone || ''}" style="left:${(lx / w) * 100}%;top:${(ly / h) * 100}%;transform:translate(-50%,-50%)">${text}</div>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" style="position:absolute;inset:0">${lines}</svg>${tags}`;
}

export const illustrations = { handNerve, wristCross };
