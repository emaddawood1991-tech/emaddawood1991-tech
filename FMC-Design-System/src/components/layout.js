import { icon } from './icons.js';

export const SLOGAN_EN = 'Ideal Care';
export const SLOGAN_AR = 'الرعاية المثالية';
export const BRAND_AR = 'مركز الفيصل الطبي';
export const BRAND_EN = 'AL FAISAL MEDICAL CENTER';
export const LOGO = '../../../assets/logo/fmc-logo-trimmed.png';

/* Decorative geometry echoing the logo swooshes. Variants avoid identical compositions. */
export function background(variant = 'a') {
  const V = {
    a: `<circle cx="1010" cy="170" r="330" fill="#EAF3FB"/><circle cx="1010" cy="170" r="230" fill="#DCEBFA"/>
        <path d="M-40 1160C240 1040 520 1090 700 1260" stroke="#D7262E" stroke-opacity=".16" stroke-width="3" fill="none"/>
        <circle cx="70" cy="1040" r="210" fill="#EAF3FB"/>`,
    b: `<path d="M0 0H1080V200C800 160 500 215 0 262Z" fill="#EAF3FB"/>
        <path d="M0 262C500 215 800 160 1080 200" stroke="#2E5AB4" stroke-opacity=".18" stroke-width="3" fill="none"/>
        <circle cx="990" cy="1180" r="240" fill="#EAF3FB"/>`,
    c: `<rect x="620" y="-60" width="620" height="1500" rx="0" fill="#EAF3FB" transform="rotate(8 620 0)"/>
        <circle cx="120" cy="1230" r="250" fill="#DCEBFA" opacity=".7"/>
        <path d="M-20 1120C200 1060 330 1120 420 1240" stroke="#D7262E" stroke-opacity=".18" stroke-width="3" fill="none"/>`,
    dark: `<circle cx="980" cy="120" r="360" fill="#fff" fill-opacity=".05"/><circle cx="980" cy="120" r="240" fill="#fff" fill-opacity=".05"/>
        <circle cx="40" cy="1230" r="300" fill="#1FA8B8" fill-opacity=".14"/>
        <path d="M-40 1000C260 900 520 960 760 1180" stroke="#fff" stroke-opacity=".12" stroke-width="3" fill="none"/>`,
    awareness: `<circle cx="540" cy="520" r="520" fill="#fff" fill-opacity=".5"/><circle cx="540" cy="520" r="390" fill="#fff" fill-opacity=".6"/>
        <path d="M-20 1180C300 1020 620 1060 1100 1220" stroke="#D7262E" stroke-opacity=".2" stroke-width="3" fill="none"/>`,
  };
  return `<div class="bg"><svg viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">${V[variant] || V.a}</svg></div>`;
}

export const pager = (i, n) => `<div class="pager">${Array.from({ length: n }, (_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>`;

export const header = ({ index, total, showPager = true }) => `
<div class="header">
  <div class="brand"><img src="${LOGO}" alt="FMC"><div class="names"><span class="ar">${BRAND_AR}</span><span class="en">${BRAND_EN}</span></div></div>
  ${showPager && total > 1 ? pager(index, total) : ''}
</div>`;

export const slogan = () => `<div class="slogan"><span>${SLOGAN_EN}</span><span class="dash">–</span><span class="ar">${SLOGAN_AR}</span></div>`;

export const footer = ({ more = true, text = 'اسحب للمزيد' } = {}) => `
<div class="footer">${slogan()}${more ? `<div class="more"><span>${text}</span><span class="dot"></span></div>` : '<div class="disclaimer">محتوى توعوي ولا يغني عن استشارة الطبيب</div>'}</div>`;

/* A complete 1080x1350 slide. */
export function slide({ style = 'premium', bg = 'a', index = 0, total = 1, body, moreText, more = true, showHeader = true, footerHtml }) {
  const key = { premium: 'premium', modern3d: 'modern3d', infographic: 'infographic', editorial: 'editorial', awareness: 'awareness' }[style] || 'premium';
  const bgv = key === 'modern3d' ? 'dark' : key === 'awareness' ? 'awareness' : bg;
  return `<section class="slide style-${key}" lang="ar" dir="rtl" data-index="${index + 1}">
${background(bgv)}
<div class="frame">${showHeader ? header({ index, total }) : ''}<div class="content">${body}</div></div>
${footerHtml ?? footer({ more, text: moreText })}
</section>`;
}

export const tag = (text, cls = '') => `<span class="tag ${cls}">${text}</span>`;
export const note = (text, { warn = false, ic = 'info' } = {}) => `<div class="note ${warn ? 'warn' : ''}">${icon(warn ? 'alert' : ic)}<div>${text}</div></div>`;
export const iconBadge = (name, cls = '') => `<div class="icon-badge ${cls}">${icon(name)}</div>`;
export const rowCard = ({ ic, title, text, cls = '', n }) => `
<div class="card row-card">${n ? `<div class="num">${n}</div>` : iconBadge(ic, cls)}<div><h3>${title}</h3>${text ? `<p>${text}</p>` : ''}</div></div>`;
