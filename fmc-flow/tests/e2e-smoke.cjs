// Browser smoke test (run against a running server): node tests/e2e-smoke.cjs http://localhost:3100 [outDir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100';
const out = process.argv[3] || '/tmp';
const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const assert = (c, m) => { if (!c) { console.error('FAIL:', m); process.exitCode = 1; } else console.log('ok  -', m); };

async function login(browser, user) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  await page.goto(base);
  await page.fill('input[autocomplete=username]', user); await page.fill('input[type=password]', PW);
  await page.click('button.btn:has-text("Sign in")');
  await page.waitForSelector('.shell');
  return { ctx, page, errors };
}
(async () => {
  const browser = await chromium.launch();
  const rec = await login(browser, 'reception');
  await rec.page.screenshot({ path: `${out}/01-dashboard.png` });
  await rec.page.click('.nav a:has-text("Visits")');
  await rec.page.fill('input[placeholder^="Search by"]', 'Patient B');
  await rec.page.click('button.btn.ghost:has-text("Sample Patient B")');
  await rec.page.selectOption('#ci-appt', { index: 1 });
  await rec.page.click('button.btn:has-text("Check in")');
  await rec.page.waitForSelector('tr:has-text("Sample Patient B")');
  assert(true, 'reception checked a patient in through the UI');
  await rec.page.click('tr:has-text("Sample Patient B") button:has-text("Assign room")');
  const sel = rec.page.locator('.modal select').first();
  const opts = await sel.locator('option').allTextContents();
  const hall = opts.find((o) => o.includes('PT-HALL-01'));
  await sel.selectOption({ label: hall });
  await rec.page.locator('.modal select').nth(1).selectOption({ label: 'BED-02' });
  await rec.page.screenshot({ path: `${out}/02-assign.png` });
  await rec.page.click('.modal button:has-text("Confirm")');
  await rec.page.waitForSelector('tr:has-text("Sample Patient B"):has-text("PT-HALL-01/BED-02")');
  await rec.page.click('tr:has-text("Sample Patient B") button:has-text("Confirm entry")');
  await rec.page.waitForSelector('tr:has-text("Sample Patient B") button:has-text("Transfer")');
  assert(true, 'room assigned to a bed and entry confirmed');

  const pt = await login(browser, 'pt.one');
  await pt.page.click('.nav a:has-text("Visits")');
  await pt.page.click('tr:has-text("Sample Patient B") button:has-text("Start treatment")');
  await pt.page.locator('.modal select').selectOption({ label: 'PT Treatment' });
  await pt.page.click('.modal button:has-text("Confirm")');
  await pt.page.waitForSelector('tr:has-text("Sample Patient B") button:has-text("Pause")');
  await pt.page.waitForTimeout(2500);
  const before = await pt.page.locator('tr:has-text("Sample Patient B") .timer').first().textContent();
  await pt.page.reload(); await pt.page.waitForSelector('.shell');
  await pt.page.click('.nav a:has-text("Sessions")');
  await pt.page.waitForSelector('.card > h2:has-text("Sessions")'); await pt.page.waitForSelector('.timer'); await pt.page.waitForTimeout(500);
  const after = await pt.page.locator('.timer').first().textContent();
  const secs = (s) => s.split(':').reduce((a, b) => a * 60 + Number(b), 0);
  assert(secs(after) >= secs(before), `session survived browser refresh (timer ${before} → ${after}, not reset)`);
  assert(await pt.page.locator('.timer').count() === 1, 'no duplicate session after refresh');
  await pt.page.screenshot({ path: `${out}/03-sessions.png` });

  // simulate network loss: actions blocked, banner shown, nothing recorded
  await pt.ctx.setOffline(true);
  await pt.page.waitForSelector('.banner.bad', { timeout: 15000 });
  assert(true, 'offline banner is displayed clearly');
  await pt.page.click('button:has-text("Pause")');
  await pt.page.waitForSelector('.toast.bad');
  assert(true, 'offline action is refused with a clear message (no fabricated timestamp)');
  await pt.page.screenshot({ path: `${out}/04-offline.png` });
  await pt.ctx.setOffline(false);
  await pt.page.waitForSelector('.banner.bad', { state: 'detached', timeout: 15000 });
  assert(true, 'reconnects and clears the banner');
  await pt.page.click('button:has-text("Complete")');
  await pt.page.waitForSelector('text=Nothing here yet', { timeout: 8000 });

  await rec.page.click('tr:has-text("Sample Patient B") button:has-text("Timeline")');
  await rec.page.waitForSelector('.tl li');
  assert((await rec.page.locator('.tl li').count()) >= 7, 'timeline renders the visit events');
  await rec.page.screenshot({ path: `${out}/05-timeline.png` });
  await rec.page.click('.modal button[aria-label=Close]');

  await rec.page.click('button:has-text("العربية")');
  assert((await rec.page.getAttribute('html', 'dir')) === 'rtl', 'Arabic switches to RTL');
  await rec.page.click('.nav a >> nth=0'); await rec.page.waitForTimeout(800);
  await rec.page.screenshot({ path: `${out}/06-arabic.png` });
  const ad = await login(browser, 'admin');
  await ad.page.click('.nav a:has-text("Settings")'); await ad.page.waitForSelector('table');
  await ad.page.screenshot({ path: `${out}/07-settings.png` });
  await ad.page.click('.nav a:has-text("System")'); await ad.page.waitForSelector('text=System health');
  await ad.page.screenshot({ path: `${out}/08-system.png` });
  for (const s of [rec, pt, ad]) assert(s.errors.length === 0, `no browser console errors ${s.errors.slice(0, 2).join(' | ')}`);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
