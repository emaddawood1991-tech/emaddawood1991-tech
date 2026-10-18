import { icon } from '../../src/components/icons.js';
import { slide } from '../../src/components/layout.js';
import { md } from '../../src/components/text.js';

// Template C — health awareness day. Only mentions confirmed FMC services (see references/medical-content.md).
export function build(content) {
  return content.slides.map((s, i) => slide({
    style: 'awareness', index: i, total: 1, more: false,
    body: `<div class="aw">
      <div class="date">${icon('calendar', { size: 36 })}<span>${md(s.date)}</span></div>
      <div class="day">${md(s.day)}</div>
      <div class="medal">${icon(s.icon || 'activity', { stroke: 1.4 })}</div>
      <h1 class="arabic-title">${md(s.title)}</h1>
      <p class="msg arabic-body">${md(s.lead)}</p>
      ${s.fmc ? `<div class="fmc">${md(s.fmc)}</div>` : ''}</div>`,
  }));
}
export const css = 'template.css';
