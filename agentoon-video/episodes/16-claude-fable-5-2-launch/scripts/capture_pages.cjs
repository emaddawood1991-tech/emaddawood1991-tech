// Real captures of the public Anthropic pages (read-only, no login). Output: assets/page/*.png
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const out = "assets/page/";
  await p.goto("https://www.anthropic.com/claude-fable-and-mythos-5-2", { waitUntil: "domcontentloaded", timeout: 60000 }); await p.waitForTimeout(4000);
  await p.screenshot({ path: out + "ann-top.png" });
  const find = async (txt) => p.evaluate((t) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.textContent.includes(t)) { const e = n.parentElement; e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; } return null; }, txt);
  for (const [name, txt] of [["ann-intro", "We’ve upgraded Claude Fable"], ["ann-os", "prototype operating system"], ["ann-robots", "completing a variety of tasks"], ["ann-avail", "available today on all platforms"]]) { const r = await find(txt); console.log(name, JSON.stringify(r)); await p.waitForTimeout(900); await p.screenshot({ path: out + name + ".png" }); }
  const d = await ctx.newPage(); await d.goto("https://platform.claude.com/docs/en/models/fable-5-2/overview", { waitUntil: "domcontentloaded", timeout: 60000 }); await d.waitForTimeout(4000); await d.screenshot({ path: out + "doc-top.png" });
  const r2 = await d.evaluate(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.textContent.trim() === "Context window") { const e = n.parentElement; e.scrollIntoView({ block: "center" }); return 1; } return 0; }); console.log("doc ctx", r2); await d.waitForTimeout(900); await d.screenshot({ path: out + "doc-specs.png" });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
