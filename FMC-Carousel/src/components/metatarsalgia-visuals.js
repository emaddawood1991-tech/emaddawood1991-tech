// Clinical-screen style panels (navy) for the metatarsalgia carousel. Original vector drawings, no text inside.
import { heatFoot, LOADS } from './clinical.js';
import { plantarFoot } from './foot-anatomy.js';
const RED = '#EF4452', WHITE = '#E6F1FF', SKY = '#9CC4F2', TEAL = '#27C6D8', SKIN = '#F6D9C4', SKIN2 = '#E7B79B';
const BG = '<rect width="240" height="150" rx="0" fill="#0E2A63"/><g stroke="#2A4A8C" stroke-width="1" opacity=".5">' + [37, 75, 113].map((y) => `<path d="M0 ${y}H240"/>`).join('') + [60, 120, 180].map((x) => `<path d="M${x} 0V150"/>`).join('') + '</g>';
const wrap = (inner, defs = '') => `<svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${BG}${inner}</svg>`;
const arrow = (x, y, len, w = 6, c = RED) => `<g stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M${x} ${y}V${y + len}"/><path d="M${x - w * 1.5} ${y + len - w * 1.8}L${x} ${y + len}L${x + w * 1.5} ${y + len - w * 1.8}"/></g>`;

const FOOTSIDE = 'M0 38C0 20 12 8 30 6L72 2C96 4 120 14 146 24C170 32 188 42 196 54L196 64L0 64Z'; // heel at 0, toes at 196 (side view)

export function cause(kind) {
  switch (kind) {
    case 'load': // running / jumping: impact travelling into the forefoot
      return wrap(`<path d="M16 126H224" stroke="${SKY}" stroke-width="3" stroke-linecap="round"/>
        <g transform="translate(26 62)"><path d="${FOOTSIDE}" fill="${SKIN}" stroke="${SKIN2}" stroke-width="3"/><path d="M130 50Q170 46 192 58" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none"/>
        <ellipse cx="170" cy="60" rx="22" ry="6" fill="${RED}" opacity=".55"/></g>
        ${arrow(190, 12, 44, 7)}<path d="M40 40Q70 10 112 24" stroke="${TEAL}" stroke-width="3.5" stroke-dasharray="2 8" stroke-linecap="round" fill="none"/>
        <path d="M118 22L104 16M118 22L110 34" stroke="${TEAL}" stroke-width="3.5" stroke-linecap="round" fill="none"/>`);
    case 'shoe': // narrow toe box squeezing the forefoot (top view, toes right)
      return wrap(`<ellipse cx="52" cy="76" rx="30" ry="25" fill="${SKIN}" stroke="${SKIN2}" stroke-width="3"/><path d="M70 62Q110 56 130 50L196 52Q214 76 196 100L130 102Q110 96 70 90Z" fill="${SKIN}" stroke="${SKIN2}" stroke-width="3"/>
        <g fill="${SKIN}" stroke="${SKIN2}" stroke-width="2.5">${[[204, 62, 9], [211, 74, 9], [211, 86, 8.5], [205, 97, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
        <path d="M18 56Q110 36 168 40Q238 62 228 76Q238 90 168 112Q110 118 18 98Z" fill="none" stroke="${WHITE}" stroke-width="4" stroke-linejoin="round"/>
        <g stroke="${RED}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M160 12V32M152 24L160 32L168 24"/><path d="M160 138V118M152 126L160 118L168 126"/></g>
        <ellipse cx="170" cy="76" rx="26" ry="14" fill="${RED}" opacity=".35"/>`);
    case 'shape': { // normal arch vs high arch pressure maps
      const a = heatFoot({ heel: .85, lat: .5, mt1: .6, mt2: .7, mt3: .6, mt45: .5, hal: .45, t2: .25, t3: .25, t45: .2 }, { cx: 64, cy: 80, h: 112 });
      const b = heatFoot({ heel: .98, lat: .08, mt1: .95, mt2: .98, mt3: .85, mt45: .6, hal: .75, t2: .35, t3: .3, t45: .25 }, { cx: 168, cy: 80, h: 112 });
      return wrap(`${a.g}${b.g}<path d="M120 30V130" stroke="${SKY}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="4 5"/>`, a.defs + b.defs);
    }
    case 'weight': // same foot, heavier load
      return wrap(`<rect x="34" y="104" width="172" height="16" rx="8" fill="#BFD7F3"/><rect x="34" y="118" width="172" height="8" rx="4" fill="#7F9FCB"/>
        <ellipse cx="86" cy="96" rx="22" ry="8" fill="${SKIN}" opacity=".9"/><ellipse cx="154" cy="96" rx="22" ry="8" fill="${SKIN}" opacity=".9"/>
        ${arrow(86, 12, 66, 8)}${arrow(154, 12, 66, 8)}<g stroke="${WHITE}" stroke-opacity=".6" stroke-width="3" stroke-dasharray="3 6" stroke-linecap="round" fill="none"><path d="M112 26V70M128 26V70"/></g>`);
    case 'joint': { // metatarsophalangeal joint close-up
      return wrap(`<g><path d="M20 66H98" stroke="#BFD7F3" stroke-width="30" stroke-linecap="round"/><circle cx="104" cy="66" r="28" fill="#F6EFD9" stroke="#B8A57A" stroke-width="3"/>
        <path d="M218 66H160" stroke="#BFD7F3" stroke-width="22" stroke-linecap="round"/><path d="M150 40Q140 66 150 92L166 92L166 40Z" fill="#F6EFD9" stroke="#B8A57A" stroke-width="3"/>
        <path d="M132 44Q126 66 132 88" stroke="${SKY}" stroke-width="5" stroke-linecap="round" fill="none"/></g>
        <ellipse cx="128" cy="66" rx="52" ry="44" fill="none" stroke="${RED}" stroke-width="3.5" stroke-dasharray="5 6"/><circle cx="170" cy="104" r="5" fill="${RED}"/>`);
    }
    default: return wrap('');
  }
}

/* big plantar close-up of the forefoot (ball of foot) with the typical pain region */
export const forefootCloseup = () => plantarFoot({ view: '30 150 230 190', glow: true });
export const wholeFoot = (o) => plantarFoot(o);

/* treatment: metatarsal pad placed just behind the metatarsal heads (plantar view) */
export function padFoot(view = '0 0 300 580') {
  const base = plantarFoot({ glow: false, highlight: null, view });
  return base.replace('</svg>', `<g><ellipse cx="146" cy="318" rx="74" ry="26" fill="#27C6D8" fill-opacity=".72" stroke="#0E8FA3" stroke-width="4"/><ellipse cx="146" cy="318" rx="46" ry="12" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3"/></g></svg>`);
}

/* assessment: pressure plate with feet + palpation point */
export function assessFoot() {
  const h = heatFoot(LOADS.stand, { cx: 92, cy: 76, h: 118 }), h2 = heatFoot(LOADS.standR, { mirror: true, cx: 148, cy: 76, h: 118 });
  return wrap(`${h.g}${h2.g}<rect x="170" y="22" width="56" height="106" rx="12" fill="#fff" fill-opacity=".1" stroke="${SKY}" stroke-opacity=".6" stroke-width="1.5"/>${[40, 66, 92].map((y) => `<circle cx="184" cy="${y + 8}" r="6" fill="${TEAL}"/><rect x="196" y="${y + 3}" width="22" height="10" rx="5" fill="${WHITE}" fill-opacity=".8"/>`).join('')}`, h.defs + h2.defs);
}
