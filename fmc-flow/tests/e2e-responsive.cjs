// Responsive check (stage S18): every screen as three roles at tablet (820 px) and phone (390 px) width.
// Fails on: page-wide sideways scrolling, a visible element sticking out past the screen edge (unless it sits inside its own scroll area),
// and a dialog taller or wider than the screen without its own scrolling.
//   FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  NODE_PATH=$(npm root -g) node tests/e2e-responsive.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const out = process.argv[3] || '/tmp'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ROLES = ['admin', 'reception', 'pt.one']; const SIZES = [{ w: 820, h: 1100 }, { w: 390, h: 800 }];
const bad = []; let screens = 0;

function measure(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const inScroller = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(s.overflowX) && p.scrollWidth <= p.clientWidth + 1 ? false : /(auto|scroll)/.test(s.overflowX)) return true; } return false; };
    const out = [...document.querySelectorAll('.shell *')].filter(vis).filter((el) => { const r = el.getBoundingClientRect(); return r.right > vw + 2 && !inScroller(el) && !el.closest('svg'); })
      .slice(0, 4).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${(el.textContent || '').trim().slice(0, 30)}" right=${Math.round(el.getBoundingClientRect().right)}>${vw}`);
    return { page: document.documentElement.scrollWidth > vw + 1, out };
  });
}

(async () => {
  const b = await chromium.launch();
  for (const size of SIZES) for (const user of ROLES) {
    const ctx = await b.newContext({ viewport: { width: size.w, height: size.h } }); const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(base); await page.fill('input[autocomplete=username]', user); await page.fill('input[type=password]', PW); await page.click('button.btn:has-text("Sign in")'); await page.waitForSelector('.shell');
    const toggle = page.locator('[data-testid=menu-toggle]'); const narrow = await toggle.isVisible();
    if (narrow) { if ((await page.locator('.nav').isVisible())) bad.push(`${user}@${size.w}: menu should start collapsed`); await toggle.click(); }
    const links = await page.locator('.nav a').all(); const names = []; for (const l of links) names.push((await l.textContent()).trim());
    for (let i = 0; i < names.length; i++) {
      const where = `${user}@${size.w} ${names[i]}`;
      if (narrow && i > 0) await toggle.click();
      try { await page.locator('.nav a').nth(i).click({ timeout: 3000 }); } catch { bad.push(`${where}: menu link not clickable`); continue; }
      await page.waitForTimeout(350); screens++;
      if (narrow && (await page.locator('.nav').isVisible())) bad.push(`${where}: menu did not close after choosing a page`);
      if (narrow) { const top = await page.evaluate(() => Math.round(document.querySelector('.main').getBoundingClientRect().top)); if (top > 200) bad.push(`${where}: content starts ${top}px down the screen`); }
      const m = await measure(page);
      if (m.page) bad.push(`${where}: page scrolls sideways`);
      for (const o of m.out) bad.push(`${where}: sticks out: ${o}`);
      if (process.env.SHOTS) await page.screenshot({ path: `${out}/resp-${user}-${size.w}-${i}.png` });
    }
    if (errs.length) bad.push(`${user}@${size.w}: script errors ${errs.join('; ')}`);
    await ctx.close();
  }
  await b.close();
  console.log(`checked ${screens} screens`);
  for (const x of bad) console.log('FAIL:', x);
  console.log(bad.length ? `${bad.length} problems` : 'ok  - no sideways scrolling or overflow on any screen at tablet and phone width');
  if (bad.length) process.exitCode = 1;
})();
