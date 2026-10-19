import { icon } from '../../src/components/icons.js';
import { illustrations, labels } from '../../src/components/illustrations.js';
import { slide, tag, note, rowCard, LOGO, BRAND_AR } from '../../src/components/layout.js';
import { md } from '../../src/components/text.js';
import { clin, viz } from '../../src/components/clinical.js';
import { badge } from '../../src/components/badges.js';

const BG = ['a', 'b', 'c'];

const renderers = {
  hook: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
    <h1 class="arabic-title" style="margin-top:22px">${md(s.title)}</h1>
    <div class="hook-row">
      <div class="hook-text"><p class="lead arabic-body">${md(s.lead || '')}</p>
        <div class="chips">${(s.chips || []).map((c) => `<div class="chip">${icon(c.icon)}<span>${md(c.text)}</span></div>`).join('')}</div></div>
      <div class="hook-art"><div class="illus">${(illustrations[s.illustration] || illustrations.handNerve)()}</div></div>
    </div>`,

  explain: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
    <h2 class="arabic-title one" style="margin:18px 0 14px">${md(s.title)}</h2>
    <p class="lead arabic-body" style="font-size:33px;line-height:1.65">${md(s.lead)}</p>
    <div class="art-frame ar fill" style="margin:22px 0 22px"><div class="illus">${(illustrations[s.illustration] || illustrations.wristCross)()}${labels(s.labels || [])}</div></div>
    ${s.note ? note(md(s.note)) : ''}`,

  cards: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
    <h2 class="arabic-title one" style="margin:18px 0 26px">${md(s.title)}</h2>
    <div class="stack">${s.items.map((it, i) => rowCard({ ic: it.icon, title: md(it.title), text: md(it.text), n: s.numbered ? String(i + 1).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : null, cls: it.tone })).join('')}</div>
    <div style="flex:1"></div>${s.note ? note(md(s.note), { warn: s.warn }) : ''}`,

  steps: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
    <h2 class="arabic-title one" style="margin:18px 0 30px">${md(s.title)}</h2>
    <div class="timeline">${s.items.map((it, i) => `<div class="step ${it.fmc ? 'hl-step' : ''}"><div class="dot">${String(i + 1).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])}</div>
      <div class="body"><h3>${md(it.title)}</h3><p>${md(it.text)}</p>${it.fmc ? `<span class="fmcbadge">${icon('check')}${md(it.fmc)}</span>` : ''}</div></div>`).join('')}</div>
    <div style="flex:1"></div>${s.note ? note(md(s.note)) : ''}`,

  advice: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag), 'red')}</div>` : ''}
    <h2 class="arabic-title one" style="margin:18px 0 12px">${md(s.title)}</h2>
    ${s.lead ? `<p class="lead arabic-body" style="font-size:32px;margin-bottom:18px">${md(s.lead)}</p>` : ''}
    <div class="list-compact">${s.items.map((t) => `<div class="check red"><div class="ck">${icon('check')}</div><div>${md(t)}</div></div>`).join('')}</div>
    <div style="flex:1"></div>
    ${s.note ? `<div style="margin-bottom:22px">${note(md(s.note), { warn: true })}</div>` : ''}
    ${s.cta ? `<div class="cta"><div class="logo"><img src="${LOGO}" alt="${BRAND_AR}"></div><div><h3>${md(s.cta.title)}</h3><p>${md(s.cta.text || BRAND_AR)}</p></div></div>` : ''}`,


  /* ---- pediatric gait set ---- */
  hero: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
    <h1 class="arabic-title" style="margin:14px 0 8px;font-size:68px">${md(s.title)}</h1>
    <p class="sub arabic-body" style="font-size:30px;font-weight:600;color:var(--ink-soft)">${md(s.lead)}</p>
    <div class="hero-row">
      <div class="hero-machine"><span class="mchip">${icon('check')}${md(s.machineLabel)}</span>
        <img class="mimg" src="../../../assets/medical/machine-photo.png" alt="">
        <div class="hero-badge"><img src="../../../assets/medical/badge-pressure.png" alt=""></div></div>
      <div class="hero-photo"><img src="../../../assets/medical/child-walking-photo.jpg" alt=""></div>
    </div>`,

  quad: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
    <h2 class="arabic-title one" style="margin:16px 0 20px">${md(s.title)}</h2>
    <div class="quad">${s.items.map((it, i) => `<div class="card qcard"><div class="qtile">${badge(it.tile)}<span class="qn">${String(i + 1).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])}</span></div><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div>`).join('')}</div>
    <div style="flex:1"></div>${s.note ? note(md(s.note)) : ''}`,

  illcards: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
    <h2 class="arabic-title one" style="margin:16px 0 18px;font-size:56px">${md(s.title)}</h2>
    <div class="stack" style="gap:14px">${s.items.map((it) => `<div class="card icard"><div class="itile">${badge(it.tile)}</div><div><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div></div>`).join('')}</div>
    <div style="flex:1"></div>${s.note ? note(md(s.note)) : ''}`,

  dash: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
    <h2 class="arabic-title" style="margin:14px 0 14px;font-size:54px;line-height:1.3">${md(s.title)}</h2>
    <div class="dgrid">${s.items.map((it) => `<div class="card dcard"><div class="dscreen">${viz(it.viz)}<span class="dtag">${md(s.exampleLabel)}</span>${(it.chips || []).map((c) => `<span class="dchip" style="left:${c.x}%;top:${c.y}%">${md(c.t)}</span>`).join('')}</div><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div>`).join('')}</div>
    <div style="flex:1"></div>${s.note ? note(md(s.note)) : ''}`,

  signs2: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag), 'red')}</div>` : ''}
    <h2 class="arabic-title one" style="margin:16px 0 18px;font-size:60px">${md(s.title)}</h2>
    <div class="signs">${s.items.map((it, i) => `<div class="card sign sign2 ${i === s.items.length - 1 ? 'wide' : ''}"><div class="cl">${clin(it.clin)}</div><p>${md(it.text)}</p></div>`).join('')}</div>
    <div style="flex:1"></div>${s.note ? `<div class="urgent">${icon('alert')}<div><b>${md(s.noteTitle || 'تنبيه طبي')}</b><span>${md(s.note)}</span></div></div>` : ''}`,

  signs: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag), 'red')}</div>` : ''}
    <h2 class="arabic-title one" style="margin:16px 0 20px;font-size:60px">${md(s.title)}</h2>
    <div class="signs">${s.items.map((it, i) => `<div class="card sign ${i === s.items.length - 1 ? 'wide' : ''}"><div class="stile">${badge(it.tile)}</div><p>${md(it.text)}</p></div>`).join('')}</div>
    <div style="flex:1"></div>${s.note ? `<div class="urgent">${icon('alert')}<div><b>${md(s.noteTitle || 'تنبيه طبي')}</b><span>${md(s.note)}</span></div></div>` : ''}`,

  closing2: (s) => `
    <h1 class="arabic-title" style="font-size:60px;margin-top:4px">${md(s.title)}</h1>
    <div class="c2-top"><div class="c2-text"><p class="lead arabic-body" style="font-size:31px;line-height:1.7">${md(s.lead)}</p>
        <div class="c2-chips">${(s.chips || []).map((c) => `<span class="mchip" style="position:static">${icon('check')}${md(c)}</span>`).join('')}</div></div>
      <div class="c2-photo"><img src="../../../assets/medical/child-walking-photo.jpg" alt=""></div></div>
    <div class="cta-btn">${icon('calendar')}<span>${md(s.cta)}</span></div>
    <div class="brandcard"><div class="logo"><img src="${LOGO}" alt="${BRAND_AR}"></div><div><h3>${BRAND_AR}</h3><p>${icon('pin')}<span>${md(s.location)}</span></p></div></div>`,

  closing: (s) => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:26px">
      <div class="art-frame" style="width:380px;height:380px;display:grid;place-items:center"><img src="${LOGO}" style="width:290px;height:auto" alt="FMC"></div>
      <h1 class="arabic-title" style="font-size:84px">${md(s.title || 'صحتك تستحق العناية')}</h1>
      <p class="lead arabic-body" style="max-width:800px">${md(s.lead || '')}</p></div>`,
};

export function build(content) {
  const n = content.slides.length;
  return content.slides.map((s, i) => {
    const r = renderers[s.type];
    if (!r) throw new Error(`Unknown slide type "${s.type}" in medical-carousel (slide ${i + 1})`);
    const last = i === n - 1;
    return slide({ style: content.style, bg: BG[i % 3], index: i, total: n, body: r(s), more: !last && s.more !== false });
  });
}
export const css = 'template.css';
