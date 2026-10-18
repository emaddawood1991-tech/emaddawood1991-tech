import { icon } from '../../src/components/icons.js';
import { illustrations } from '../../src/components/illustrations.js';
import { slide, tag } from '../../src/components/layout.js';
import { md } from '../../src/components/text.js';

// Template A — one strong headline, one visual, one short educational message.
export function build(content) {
  return content.slides.map((s, i) => slide({
    style: content.style, bg: 'a', index: i, total: 1, more: false,
    body: `${s.tag ? `<div>${tag(md(s.tag))}</div>` : ''}
      <h1 class="arabic-title" style="margin:20px 0 0">${md(s.title)}</h1>
      <div class="post-art">${illustrations[s.illustration] ? `<div class="illus">${illustrations[s.illustration]()}</div>` : `<div class="icon-badge big-icon">${icon(s.icon || 'heart')}</div>`}</div>
      <p class="post-msg arabic-body">${md(s.lead)}</p>`,
  }));
}
export const css = 'template.css';
