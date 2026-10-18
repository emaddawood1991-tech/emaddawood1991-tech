// Content mini-markup: *word* -> blue accent, !!word!! -> red accent. Everything else is escaped.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const md = (s = '') => esc(s).replace(/\n/g, '<br>').replace(/\*([^*]+)\*/g, '<span class="accent">$1</span>').replace(/!!([^!]+)!!/g, '<span class="accent-red">$1</span>');
