import { icon } from '../../src/components/icons.js';
import { illustrations, labels } from '../../src/components/illustrations.js';
import { slide, tag, note, rowCard, LOGO, BRAND_AR } from '../../src/components/layout.js';
import { md } from '../../src/components/text.js';
import { scene, tile, childSvg } from '../../src/components/pedi.js';

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
  scene: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
    <h1 class="arabic-title" style="margin:14px 0 6px;font-size:70px">${md(s.title)}</h1>
    <p class="sub arabic-body">${md(s.sub)}</p>
    <div class="art-frame scene-frame fill" style="margin-top:18px"><div class="illus">${scene(s.pose || 'walk')}${labels(s.labels || [], { w: 860, h: 600 })}</div>
      <div class="glass">${md(s.lead)}</div></div>`,

  quad: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
    <h2 class="arabic-title one" style="margin:16px 0 20px">${md(s.title)}</h2>
    <div class="quad">${s.items.map((it, i) => `<div class="card qcard"><div class="qtile">${tile(it.tile)}<span class="qn">${String(i + 1).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])}</span></div><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div>`).join('')}</div>
    <div style="flex:1"></div>${s.note ? note(md(s.note)) : ''}`,

  illcards: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
    <h2 class="arabic-title one" style="margin:16px 0 18px;font-size:56px">${md(s.title)}</h2>
    <div class="stack" style="gap:14px">${s.items.map((it) => `<div class="card icard"><div class="itile">${tile(it.tile)}</div><div><h3>${md(it.title)}</h3><p>${md(it.text)}</p></div></div>`).join('')}</div>
    <div style="flex:1"></div>${s.note ? note(md(s.note)) : ''}`,

  signs: (s) => `
    ${s.tag ? `<div>${tag(md(s.tag), 'red')}</div>` : ''}
    <h2 class="arabic-title one" style="margin:16px 0 20px;font-size:60px">${md(s.title)}</h2>
    <div class="signs">${s.items.map((it, i) => `<div class="card sign ${i === s.items.length - 1 ? 'wide' : ''}"><div class="stile">${tile(it.tile)}</div><p>${md(it.text)}</p></div>`).join('')}</div>
    <div style="flex:1"></div>${s.note ? `<div class="urgent">${icon('alert')}<div><b>${md(s.noteTitle || 'تنبيه طبي')}</b><span>${md(s.note)}</span></div></div>` : ''}`,

  closing2: (s) => `
    <div class="c2-top"><div class="c2-text"><h1 class="arabic-title" style="font-size:64px">${md(s.title)}</h1><p class="lead arabic-body" style="font-size:29px;margin-top:8px;line-height:1.6">${md(s.lead)}</p></div>
      <div class="c2-art">${childSvg(s.pose || 'walk')}</div></div>
    ${s.machine ? `<div class="card machine"><span class="mchip">${icon('check')}${md(s.machineLabel)}</span><img src="../../../assets/medical/foot-scanner-extracted.png" alt=""></div>` : ''}
    ${note(md(s.caution), { warn: true })}
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
