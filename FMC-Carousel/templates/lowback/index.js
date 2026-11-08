import { icon } from '../../src/components/icons.js';
import { slide, tag, LOGO, BRAND_AR } from '../../src/components/layout.js';
import { md } from '../../src/components/text.js';
import { lumbarPost, backFigure, causeVisual, warnVisual, careVisual } from '../../src/components/spine.js';

const H = (s, size = 46) => `<h2 class="arabic-title" style="font-size:${size}px;white-space:nowrap;margin:12px 0 10px;line-height:1.3">${md(s)}</h2>`;
const MAP = { x0: 160, y0: 10, s: 0.9855, vx: 60, vy: 240 }; // pain-map placement inside the .lb-map column

const R = {
  cover: (s) => `
    <div class="lb-cover">
      <div class="txt">
        <div>${tag(md(s.tag))}</div>
        <h1 class="arabic-title" style="font-size:84px;margin:16px 0 10px;line-height:1.2">${md(s.title)}</h1>
        <p class="lb-sub">${md(s.sub)}</p>
        <p class="lb-lead">${md(s.lead)}</p>
        <div class="lb-card"><div class="lv">${lumbarPost()}</div><div class="lbl">${['L1', 'L2', 'L3', 'L4', 'L5'].map((l, i) => `<b style="top:${33 + i * 48 - 14}px">${l}</b>`).join('')}</div><div class="cap">${md(s.cardCaption)}</div></div>
      </div>
      <div class="fig"><div class="fv">${backFigure({ view: '40 0 320 700', overlay: 'cover' })}</div>
        <div class="lb-chip" style="top:300px;left:-4px">${md(s.chip)}</div></div>
    </div>`,

  causes: (s) => `
    <div>${tag(md(s.tag))}</div>${H(s.title)}
    <div class="lb-grid">${s.items.map((it, i) => `<div class="c"><div class="vis">${causeVisual(it.vis)}<b>${'١٢٣٤'[i]}</b></div><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div>`).join('')}</div>
    <div class="lb-note">${icon('info')}<div>${md(s.note)}</div></div>`,

  symptoms: (s) => `
    <div>${tag(md(s.tag))}</div>${H(s.title)}
    <div class="lb-two">
      <div class="lb-map"><div class="m">${backFigure({ view: `${MAP.vx} ${MAP.vy} 280 690`, overlay: 'pain' })}</div>
        <svg class="ln" viewBox="0 0 440 700">${s.callouts.map((c, i) => { const px = MAP.x0 + (c.x - MAP.vx) * MAP.s, py = MAP.y0 + (c.y - MAP.vy) * MAP.s; const ly = [118, 255, 395, 590][i]; return `<path d="M158 ${ly}L${px.toFixed(0)} ${py.toFixed(0)}" stroke="${c.red ? '#D7262E' : '#0B2455'}" stroke-width="2.6" fill="none"/><circle cx="${px.toFixed(0)}" cy="${py.toFixed(0)}" r="6" fill="#fff" stroke="${c.red ? '#D7262E' : '#0B2455'}" stroke-width="3"/>`; }).join('')}</svg>
        ${s.callouts.map((c, i) => `<div class="lb-call ${c.red ? 'red' : ''}" style="top:${[118, 255, 395, 590][i]}px">${md(c.t)}</div>`).join('')}</div>
      <div class="lb-sym">${s.items.map((it) => `<div class="it"><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div>`).join('')}</div>
    </div>
    <div class="lb-note">${icon('info')}<div>${md(s.note)}</div></div>`,

  warn: (s) => `
    <div>${tag(md(s.tag))}</div>
    <h2 class="arabic-title" style="font-size:46px;margin:12px 0 10px;line-height:1.3;text-wrap:balance">${md(s.title)}</h2>
    <div class="lb-wl">${s.items.map((it) => `<div class="w"><div class="vis">${warnVisual(it.vis)}</div><div><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div></div>`).join('')}</div>
    <div class="lb-urg">
      <div class="hd">${icon('alert')}<h3>${md(s.urgentTitle)}</h3></div>
      <div class="bd">
        <div class="dg">${backFigure({ view: '70 250 260 400', overlay: 'saddle' })}</div>
        <div><ul>${s.urgent.map((u) => `<li>${md(u)}</li>`).join('')}</ul><p>${md(s.urgentNote)}</p></div>
      </div>
    </div>`,

  care: (s) => `
    <div>${tag(md(s.tag))}</div>${H(s.title)}
    <div class="lb-care">${s.items.map((it) => `<div class="r"><div class="vis">${careVisual(it.vis)}</div><div><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div></div>`).join('')}</div>
    <div class="lb-svc">${s.services.map((v) => `<div>${icon(v.icon)}<span>${md(v.text)}</span></div>`).join('')}</div>
    <div class="lb-cta">${icon('calendar')}<span>${md(s.cta)}</span></div>
    <div class="lb-brand"><div class="logo"><img src="${LOGO}" alt="${BRAND_AR}"></div><div><h3>${BRAND_AR}</h3><p>${icon('pin')}<span>${md(s.location)}</span></p></div></div>`,
};

export function build(content) {
  const n = content.slides.length;
  const BG = ['a', 'b', 'c', 'a', 'b'];
  return content.slides.map((s, i) => slide({ style: content.style, bg: BG[i], index: i, total: n, body: R[s.type](s), more: i < n - 1 }));
}
export const css = 'template.css';
