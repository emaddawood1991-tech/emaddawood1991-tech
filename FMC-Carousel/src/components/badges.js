// Icon badges: supplied illustrations (circular, one common ice-blue tint) + simple interface icons in the same badge.
import { icon } from './icons.js';
const ASSET = '../../../assets/medical/';
export const badge = (k) => {
  if (k.startsWith('ib:')) return `<div class="ib">${icon(k.slice(3), { stroke: 1.7 })}</div>`;
  return `<img class="bimg" src="${ASSET}badge-${k}.png" alt="">`;
};
