// Real end-to-end test of the TidyTime booking slice (Playwright). Writes a plain-text log and screenshots.
import { createRequire } from "module"; const require = createRequire(process.env.PW_DIR || "/tmp/pw/");
const { chromium } = require("playwright"); import path from "path"; import fs from "fs"; import { fileURLToPath } from "url";
const here = path.dirname(fileURLToPath(import.meta.url)), url = "file://" + path.resolve(here, "../index.html"), shots = path.resolve(here, "../replica/screens-out"); fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch(), results = [];
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, timezoneId: "Asia/Dubai" });
const t = async (name, fn) => { try { await fn(); results.push(["PASS", name]); } catch (e) { results.push(["FAIL", name + " -> " + e.message.split("\n")[0]]); } };
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); };
let p = await ctx.newPage(); await p.goto(url);
await t("1 page shows 5 bookable days", async () => eq(await p.locator(".day").count(), 5, "days"));
await t("2 time zone is shown to the guest", async () => { const s = await p.locator("#tz").textContent(); if (!/Asia\/Dubai/.test(s)) throw new Error(s); });
await p.screenshot({ path: shots + "/01-days.png" });
await p.locator(".day").nth(0).click(); await p.screenshot({ path: shots + "/02-times.png" });
await t("3 picking a day shows 9 time slots", async () => eq(await p.locator(".slot").count(), 9, "slots"));
await p.locator('.slot[data-time="10:00"]').click(); await p.screenshot({ path: shots + "/03-form.png" });
await t("4 empty form shows a validation message", async () => { await p.click("#confirm"); const m = await p.locator("#err").textContent(); if (!/valid email/.test(m)) throw new Error(m); });
await p.fill("#name", "Sam Rivera"); await p.fill("#email", "sam@example.com");
await t("5 double-clicking Confirm creates exactly one booking", async () => { await p.dblclick("#confirm"); const n = await p.evaluate(() => JSON.parse(localStorage.getItem("tidytime.bookings")).length); eq(n, 1, "bookings"); });
await t("6 confirmation message is shown", async () => { await p.locator("#done").waitFor({ state: "visible" }); const s = await p.locator("#summary").textContent(); if (!/10:00/.test(s)) throw new Error(s); });
await p.screenshot({ path: shots + "/04-booked.png" });
await t("7 a booked slot is disabled for the next guest", async () => { const q = await ctx.newPage(); await q.goto(url); await q.locator(".day").nth(0).click(); eq(await q.locator('.slot[data-time="10:00"]').isDisabled(), true, "10:00 disabled"); await q.close(); });
await t("8 slot taken mid-booking is refused with a clear message", async () => {
  const a = await ctx.newPage(); await a.goto(url); await a.locator(".day").nth(1).click(); await a.locator('.slot[data-time="11:00"]').click(); await a.fill("#name", "Alex"); await a.fill("#email", "alex@example.com");
  const b = await ctx.newPage(); await b.goto(url); await b.locator(".day").nth(1).click(); await b.locator('.slot[data-time="11:00"]').click(); await b.fill("#name", "Blake"); await b.fill("#email", "blake@example.com"); await b.click("#confirm");
  await a.click("#confirm"); const m = await a.locator("#err").textContent(); if (!/just taken/.test(m)) throw new Error(m);
  const n = await a.evaluate(() => JSON.parse(localStorage.getItem("tidytime.bookings")).filter(x => x.date === document.querySelector(".day[aria-pressed=true]").dataset.date && x.time === "11:00").length); eq(n, 1, "11:00 bookings"); await a.screenshot({ path: shots + "/05-conflict.png" }); });
await browser.close();
const pass = results.filter(r => r[0] === "PASS").length; let out = "$ node tests/booking.test.mjs   (Playwright, Chromium, 390x844)\n" + results.map(r => r[0] + "  " + r[1]).join("\n") + `\n\n${pass}/${results.length} passed\n`;
fs.writeFileSync(path.resolve(here, "../replica/test-results.txt"), out); console.log(out); process.exit(pass === results.length ? 0 : 1);
