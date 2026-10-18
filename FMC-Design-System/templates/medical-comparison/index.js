import { icon } from '../../src/components/icons.js';
import { slide, tag, note } from '../../src/components/layout.js';
import { md } from '../../src/components/text.js';

// Template E — two-column comparison. Rows are aligned: rows[i] = label, a-cell, b-cell.
export function build(content) {
  return content.slides.map((s, i) => slide({
    style: content.style, bg: 'b', index: i, total: 1, more: false,
    body: `${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
      <h1 class="arabic-title" style="margin-top:16px;font-size:58px;white-space:nowrap">${md(s.title)}</h1>
      <div class="cmp">
        <div class="col-title">${icon(s.a.icon)}<span>${md(s.a.title)}</span></div>
        <div class="col-title b">${icon(s.b.icon)}<span>${md(s.b.title)}</span></div>
        ${s.rows.map(([label, a, b]) => `<div class="rowlabel">${md(label)}</div><div class="cell"><p>${md(a)}</p></div><div class="cell"><p>${md(b)}</p></div>`).join('')}
      </div>
      ${s.note ? note(md(s.note), { warn: false, ic: 'info' }) : ''}`,
  }));
}
export const css = 'template.css';
