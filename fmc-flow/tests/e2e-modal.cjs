// Modal accessibility: Escape closes, focus moves into the dialog and stays inside it, focus returns to the opener.
//   FMC_DB=/tmp/t.db PORT=3100 node server/index.js ;  NODE_PATH=$(npm root -g) node tests/e2e-modal.cjs http://localhost:3100
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:3100'; const PW = process.env.SEED_PASSWORD || 'Demo-Passw0rd!';
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(base); await p.fill('input[autocomplete=username]', 'reception'); await p.fill('input[type=password]', PW); await p.click('button.btn:has-text("Sign in")'); await p.waitForSelector('.shell');
  await p.click('.nav a:has-text("Visits")'); await p.waitForSelector('button:has-text("New patient")');
  const opener = p.locator('button:has-text("New patient")').first();
  await opener.focus(); await opener.press('Enter'); await p.waitForSelector('[role=dialog]');
  ok(await p.evaluate(() => !!document.querySelector('[role=dialog]').contains(document.activeElement)), 'focus moves into the dialog when it opens');
  ok(await p.evaluate(() => document.querySelector('[role=dialog]').getAttribute('aria-modal') === 'true' && !!document.querySelector('[role=dialog]').getAttribute('aria-label')), 'the dialog is marked modal and has a name');
  let stayed = true;
  for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); if (!(await p.evaluate(() => document.querySelector('[role=dialog]').contains(document.activeElement)))) { stayed = false; break; } }
  ok(stayed, 'Tab never leaves the dialog (40 presses)');
  stayed = true;
  for (let i = 0; i < 40; i++) { await p.keyboard.press('Shift+Tab'); if (!(await p.evaluate(() => document.querySelector('[role=dialog]').contains(document.activeElement)))) { stayed = false; break; } }
  ok(stayed, 'Shift+Tab never leaves the dialog (40 presses)');
  await p.keyboard.press('Escape'); await p.waitForSelector('[role=dialog]', { state: 'detached' });
  ok(true, 'Escape closes the dialog');
  ok(await p.evaluate(() => document.activeElement && document.activeElement.textContent.includes('New patient')), 'focus returns to the button that opened it');
  await opener.click(); await p.waitForSelector('[role=dialog]'); await p.mouse.click(5, 5); await p.waitForSelector('[role=dialog]', { state: 'detached' });
  ok(true, 'clicking the backdrop still closes it');
  await opener.click(); await p.waitForSelector('[role=dialog]'); await p.click('[role=dialog] button[aria-label]'); await p.waitForSelector('[role=dialog]', { state: 'detached' });
  ok(true, 'the close button still works');
  ok(errors.length === 0, 'no page errors'); await b.close();
})();
