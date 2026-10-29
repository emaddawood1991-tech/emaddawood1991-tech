import { icon } from '../../src/components/icons.js';
import { slide, tag, LOGO, BRAND_AR } from '../../src/components/layout.js';
import { md } from '../../src/components/text.js';
import { plantarFoot } from '../../src/components/foot-anatomy.js';
import { cause, forefootCloseup, padFoot, assessFoot } from '../../src/components/metatarsalgia-visuals.js';

const ar = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

const R = {
  cover: (s) => `
    <div class="mt-cover">
      <div>${tag(md(s.tag))}</div>
      <h1 class="arabic-title" style="font-size:70px;margin:14px 0 8px;line-height:1.25;white-space:nowrap">${md(s.title)}</h1>
      <p class="mt-sub">${md(s.sub)}</p>
      <p class="mt-lead" style="font-size:29px;margin-top:6px;line-height:1.65">${md(s.lead)}</p>
      <div class="mt-hero">
        <div class="mt-zoom"><div class="in">${forefootCloseup()}</div></div>
        <div class="mt-chip red" style="left:70px;top:446px;transform:translateY(-50%)">${md(s.chipZoom)}</div>
        <div class="foot">${plantarFoot()}</div>
      </div>
    </div>`,

  explain: (s) => `
    <div>${tag(md(s.tag))}</div>
    <h2 class="arabic-title" style="font-size:54px;white-space:nowrap;margin:12px 0 12px;line-height:1.3">${md(s.title)}</h2>
    <div class="mt-def">${md(s.definition)}</div>
    <div class="mt-two">
      <div class="mt-fcol"><div style="position:absolute;left:140px;top:40px;width:300px;height:600px">${plantarFoot()}</div>
        <svg class="mt-lines" viewBox="0 0 440 680" style="position:absolute;inset:0;width:100%;height:100%">${s.callouts.map((c) => { const px = 140 + c.x, py = 40 + c.y; return `<path d="M160 ${c.ly}L${px.toFixed(0)} ${py.toFixed(0)}" stroke="#0B2455" stroke-width="2.6" fill="none"/><circle cx="${px.toFixed(0)}" cy="${py.toFixed(0)}" r="6" fill="#fff" stroke="${c.red ? '#D7262E' : '#0B2455'}" stroke-width="3"/>`; }).join('')}</svg>
        ${s.callouts.map((c) => `<div class="mt-call ${c.red ? 'red' : ''}" style="top:${c.ly}px;transform:translateY(-50%);width:170px">${md(c.t)}</div>`).join('')}</div>
      <div class="mt-sym">${s.items.map((it) => `<div class="it"><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div>`).join('')}</div>
    </div>`,

  causes: (s) => `
    <div>${tag(md(s.tag))}</div>
    <h2 class="arabic-title" style="font-size:52px;margin:12px 0 4px;line-height:1.3;white-space:nowrap">${md(s.title)}</h2>
    <div class="mt-causes">${s.items.map((it, i) => `<div class="mt-cause"><div class="vis">${cause(it.vis)}</div><div class="tx"><h3><span class="n">${ar(i + 1)}</span>${md(it.title)}</h3><p>${md(it.text)}</p></div></div>`).join('')}</div>`,

  care: (s) => `
    <div>${tag(md(s.tag))}</div>
    <h2 class="arabic-title" style="font-size:49px;white-space:nowrap;margin:12px 0 4px;line-height:1.3">${md(s.title)}</h2>
    <div class="mt-split">
      <div class="mt-col"><div class="mt-colh">${assessFoot().replace("<svg ","<svg preserveAspectRatio=\"xMidYMid slice\" ")}</div><div class="mt-colt"><i></i>${md(s.a.title)}</div>
        ${s.a.items.map((it) => `<div class="mt-it"><h4>${md(it.title)}</h4><p>${md(it.text)}</p></div>`).join('')}</div>
      <div class="mt-col"><div class="mt-colh pad">${padFoot('-32 212 364 134').replace('<svg ','<svg preserveAspectRatio="xMidYMid slice" ')}</div><div class="mt-colt b"><i></i>${md(s.b.title)}</div>
        ${s.b.items.map((it) => `<div class="mt-it"><h4>${md(it.title)}</h4><p>${md(it.text)}</p></div>`).join('')}</div>
    </div>
    <div class="mt-note">${icon('alert')}<div>${md(s.note)}</div></div>`,

  close: (s) => `
    <div style="display:flex;gap:20px;align-items:center">
      <div style="flex:1"><h1 class="arabic-title" style="font-size:54px;line-height:1.3">${md(s.title)}</h1>
        <p class="lead arabic-body" style="font-size:28px;line-height:1.6;margin-top:8px">${md(s.lead)}</p></div>
      <div style="flex:none;width:210px;height:210px;border-radius:50%;background:#fff;padding:8px;box-shadow:0 22px 40px -22px rgba(11,36,85,.6),0 0 0 3px rgba(46,90,180,.16)"><div style="width:100%;height:100%;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 40%,#fff,#E4F1FB);display:grid;place-items:center">${forefootCloseup().replace('<svg ', '<svg style="width:150%;margin-top:-4%" ')}</div></div>
    </div>
    <div class="mt-svc">${s.services.map((v) => `<div class="s"><div class="icon-badge ${v.tone || ''}">${icon(v.icon)}</div><div><h3>${md(v.title)}</h3><p>${md(v.text)}</p></div></div>`).join('')}</div>
    <div class="mt-cta">${icon('calendar')}<span>${md(s.cta)}</span></div>
    <div class="mt-brand"><div class="logo"><img src="${LOGO}" alt="${BRAND_AR}"></div><div><h3>${BRAND_AR}</h3><p>${icon('pin')}<span>${md(s.location)}</span></p></div></div>`,
};

export function build(content) {
  const n = content.slides.length;
  const BG = ['a', 'b', 'c', 'a', 'b'];
  return content.slides.map((s, i) => slide({ style: content.style, bg: BG[i], index: i, total: n, body: R[s.type](s), more: i < n - 1 }));
}
export const css = 'template.css';
