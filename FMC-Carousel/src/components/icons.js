// Clean line icons (24x24 grid). All use currentColor so they follow the badge colour.
const P = {
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1V3.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v6.5m0-3a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L4 15.5a1.6 1.6 0 0 1 2.4-2.1L8 15"/>',
  gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l-3.2-4.2"/><circle cx="12" cy="17" r="1"/>',
  stethoscope: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-1.5"/><circle cx="20" cy="11.5" r="2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  brace: '<rect x="3" y="8" width="18" height="8" rx="3"/><path d="M8 8v8M12 8v8M16 8v8"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.3"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  muscle: '<path d="M4 15c2-1 3-4 6-5 3-1 4 1 6 0s3-3 4-2c1 4-1 9-6 10-4 1-8 0-10-3z"/>',
  joint: '<circle cx="8" cy="8" r="3.2"/><circle cx="16" cy="16" r="3.2"/><path d="M10.4 10.4l3.2 3.2"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 5 1V4.5A2 2 0 0 0 9 4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-5 1V4.5A2 2 0 0 1 15 4z"/>',
  spine: '<rect x="8.5" y="3" width="7" height="3.6" rx="1.4"/><rect x="8" y="8.2" width="8" height="3.6" rx="1.4"/><rect x="8.5" y="13.4" width="7" height="3.6" rx="1.4"/><rect x="9" y="18.6" width="6" height="2.8" rx="1.2"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
};
export const icon = (name, { size, stroke = 1.9 } = {}) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"${size ? ` width="${size}" height="${size}"` : ''} aria-hidden="true">${P[name] || P.info}</svg>`;
export const iconNames = Object.keys(P);
