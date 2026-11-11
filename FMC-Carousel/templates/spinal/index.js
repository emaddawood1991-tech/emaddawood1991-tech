import { icon } from '../../src/components/icons.js';
import { slide, tag, LOGO, BRAND_AR } from '../../src/components/layout.js';
import { md } from '../../src/components/text.js';
import { spine, postureBack, kyphSide, examScene } from '../../src/components/spinal.js';

const H = (s, size = 46) => `<h2 class="arabic-title" style="font-size:${size}px;white-space:nowrap;margin:12px 0 10px;line-height:1.3">${md(s)}</h2>`;
const PANEL = { scol: { view: 'post', hi: [9, 18], vb: '20 150 209 182', ref: true }, kyph: { view: 'lat', hi: [9, 15], vb: '45 125 209 182', ref: true }, lord: { view: 'lat', hi: [19, 23], vb: '-15 292 209 182', ref: true } };
const SC = 1.1; // posture-figure scale inside .sg-fig

const R = {
  cover: (s) => `
    <div class="sd-cover">
      <div>${tag(md(s.tag))}</div>
      <h1 class="arabic-title" style="font-size:60px;margin:12px 0 6px;line-height:1.3;text-wrap:balance">${md(s.title)}</h1>
      <p class="sd-sub">${md(s.sub)}</p>
      <p class="sd-lead">${md(s.lead)}</p>
      <div class="sd-trio">${s.cols.map((c) => `<div class="col"><span class="vw">${md(c.view)}</span>
        <div class="sp">${spine({ view: c.kind === 'scol' ? 'post' : 'lat', kind: c.kind, ref: c.red, hi: c.kind === 'scol' ? [8, 20] : c.kind === 'kyph' ? [8, 16] : null, vb: '20 12 180 520' })}</div>
        <h3 class="${c.red ? 'r' : ''}">${md(c.label)}</h3><p>${md(c.sub)}</p></div>`).join('')}</div>
    </div>`,

  types: (s) => `
    <div>${tag(md(s.tag))}</div>${H(s.title)}
    <div class="sd-leg"><span class="a"><i></i>${md(s.legendRef)}</span><span class="b"><i></i>${md(s.legendHi)}</span></div>
    <div class="sd-rows">${s.items.map((it) => { const o = PANEL[it.kind]; return `<div class="r"><div class="tx"><h3><b>${it.n}</b>${md(it.title)}</h3><p>${md(it.text)}</p><div class="tg"><span>${md(it.view)}</span><span class="r">${md(it.region)}</span></div></div>
      <div class="pn">${spine({ ...o, kind: it.kind })}</div></div>`; }).join('')}</div>
    <div class="sd-note">${icon('info')}<div>${md(s.note)}</div></div>`,

  signs: (s) => `
    <div>${tag(md(s.tag))}</div>${H(s.title, 43)}
    <div class="sg-two">
      <div class="sg-fig"><div class="f">${postureBack()}</div>
        ${[[150, 106, '١'], [206, 186, '٢'], [232, 300, '٣'], [148, 410, '٥']].map(([x, y, n]) => `<b style="left:${(x * SC - 17).toFixed(0)}px;top:${(y * SC - 17).toFixed(0)}px">${n}</b>`).join('')}</div>
      <div class="sg-list">${s.items.map((it) => `<div class="it"><div class="nm">${it.n}</div><div class="t"><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div>${it.side ? `<div class="th">${kyphSide()}</div>` : ''}</div>`).join('')}</div>
    </div>
    <div class="sd-note">${icon('info')}<div>${md(s.note)}</div></div>`,

  assess: (s) => `
    <div>${tag(md(s.tag))}</div>${H(s.title)}
    <div class="sa-rows">${s.items.map((it, i) => `<div class="r ${i % 2 ? 'flip' : ''}"><div class="vis">${examScene(it.vis)}${it.badge ? `<span class="bd">${md(it.badge)}</span>` : ''}</div><div class="tx"><h3>${md(it.title)}</h3><p>${md(it.text)}</p>${it.tagline ? `<div class="tg2">${md(it.tagline)}</div>` : ''}</div></div>`).join('')}</div>
    <div class="sd-note">${icon('info')}<div>${md(s.note)}</div></div>`,

  close: (s) => `
    <div>${tag(md(s.tag))}</div>
    <h1 class="arabic-title" style="font-size:48px;margin:10px 0 6px;line-height:1.3;text-wrap:balance">${md(s.title)}</h1>
    <p class="sd-lead" style="font-size:26px;margin-top:0;line-height:1.55">${md(s.lead)}</p>
    <div class="sc-svc">${s.services.map((v) => `<div class="s"><div class="icon-badge">${icon(v.icon)}</div><div><h3>${md(v.title)}</h3><p>${md(v.text)}</p></div></div>`).join('')}</div>
    <div class="sc-note"><h4>${icon('info')}${md(s.noteTitle)}</h4><p>${md(s.note)}</p></div>
    <div class="sc-cta">${icon('calendar')}<span>${md(s.cta)}</span></div>
    <div class="sc-brand"><div class="logo"><img src="${LOGO}" alt="${BRAND_AR}"></div><div><h3>${BRAND_AR}</h3><p>${icon('pin')}<span>${md(s.location)}</span></p></div></div>`,
};

export function build(content) {
  const n = content.slides.length;
  const BG = ['a', 'b', 'c', 'a', 'b'];
  return content.slides.map((s, i) => slide({ style: content.style, bg: BG[i], index: i, total: n, body: R[s.type](s), more: i < n - 1 }));
}
export const css = 'template.css';
