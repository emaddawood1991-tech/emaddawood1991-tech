import { iconBadge, slide, tag, note } from '../../src/components/layout.js';
import { md } from '../../src/components/text.js';

// Template D — icon grid infographic (up to 6 cells).
export function build(content) {
  return content.slides.map((s, i) => slide({
    style: content.style === 'premium' ? 'infographic' : content.style, bg: 'c', index: i, total: 1, more: false,
    body: `${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
      <h1 class="arabic-title" style="margin-top:18px;font-size:68px">${md(s.title)}</h1>
      ${s.lead ? `<p class="lead arabic-body" style="font-size:31px;margin-top:6px">${md(s.lead)}</p>` : ''}
      <div class="ig-grid">${s.items.map((it, k) => `<div class="card cell"><span class="nn">${String(k + 1).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])}</span>${iconBadge(it.icon, it.tone)}<h3>${md(it.title)}</h3><p>${md(it.text)}</p></div>`).join('')}</div>
      ${s.note ? note(md(s.note)) : ''}`,
  }));
}
export const css = 'template.css';
