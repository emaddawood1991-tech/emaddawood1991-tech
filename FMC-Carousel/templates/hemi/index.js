import { icon } from '../../src/components/icons.js';
import { slide, tag, LOGO, BRAND_AR } from '../../src/components/layout.js';
import { md } from '../../src/components/text.js';
import { rehabScene, brainPathway } from '../../src/components/neuro.js';

const H = (s, size = 50) => `<h2 class="arabic-title" style="font-size:${size}px;white-space:nowrap;margin:12px 0 10px;line-height:1.3">${md(s)}</h2>`;

const R = {
  cover: (s) => `
    <div class="hm-cover">
      <div>${tag(md(s.tag))}</div>
      <h1 class="arabic-title" style="font-size:76px;margin:14px 0 8px;line-height:1.25">${md(s.title)}</h1>
      <p class="hm-sub">${md(s.sub)}</p>
      <p class="hm-lead">${md(s.lead)}</p>
      <div class="hm-hero"><div class="sc">${rehabScene('reach', '0 20 240 120')}</div>
        <div class="in">${brainPathway({ body: false, view: '30 0 240 235' })}</div></div>
    </div>`,

  explain: (s) => `
    <div>${tag(md(s.tag))}</div>${H(s.title, 54)}
    <div class="hm-def">${md(s.definition)}</div>
    <div class="hm-two">
      <div class="hm-brain"><div class="b">${brainPathway({ view: '30 0 240 430' })}</div><p>${md(s.caption)}</p></div>
      <div class="hm-causes"><h3>${md(s.causesTitle)}</h3>${s.items.map((it) => `<div class="it"><h4>${md(it.title)}</h4><p>${md(it.text)}</p></div>`).join('')}</div>
    </div>
    <div class="hm-note">${icon('info')}<div>${md(s.note)}</div></div>
    <div class="hm-emg">${icon('alert')}<div>${md(s.emergency)}</div></div>`,

  assess: (s) => `
    <div>${tag(md(s.tag))}</div>${H(s.title)}
    <div class="hm-steps">${s.items.map((it, i) => `<div class="st"><div class="num">${'١٢٣٤'[i]}</div><div class="cd"><div class="vis">${rehabScene(it.vis)}</div><div class="tx"><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div></div></div>`).join('')}</div>
    <div class="hm-note">${icon('info')}<div>${md(s.note)}</div></div>`,

  methods: (s) => `
    <div>${tag(md(s.tag))}</div>${H(s.title, 44)}
    <div class="hm-grid">${s.items.map((it) => `<div class="c"><div class="vis">${rehabScene(it.vis, '0 16 240 124')}</div><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div>`).join('')}</div>
    <div class="hm-note">${icon('info')}<div>${md(s.note)}</div></div>`,

  close: (s) => `
    <div>${tag(md(s.tag))}</div>
    <h1 class="arabic-title" style="font-size:52px;margin:12px 0 8px;line-height:1.3;text-wrap:balance">${md(s.title)}</h1>
    <p class="hm-lead" style="font-size:27px;margin-top:0">${md(s.lead)}</p>
    <div class="hm-svc">${s.services.map((v) => `<div class="s"><div class="icon-badge">${icon(v.icon)}</div><div><h3>${md(v.title)}</h3><p>${md(v.text)}</p></div></div>`).join('')}</div>
    <div class="hm-cta">${icon('calendar')}<span>${md(s.cta)}</span></div>
    <div class="hm-brand"><div class="logo"><img src="${LOGO}" alt="${BRAND_AR}"></div><div><h3>${BRAND_AR}</h3><p>${icon('pin')}<span>${md(s.location)}</span></p></div></div>`,
};

export function build(content) {
  const n = content.slides.length;
  const BG = ['a', 'b', 'c', 'a', 'b'];
  return content.slides.map((s, i) => slide({ style: content.style, bg: BG[i], index: i, total: n, body: R[s.type](s), more: i < n - 1 }));
}
export const css = 'template.css';
