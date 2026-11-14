// Read-only captures of the public project websites (no login, no forms). Output assets/sites/<key>-<n>.png
const { chromium } = require("playwright");
const SITES = { appflowy: "https://www.appflowy.com", openwhispr: "https://openwhispr.com", cap: "https://cap.so", openseo: "https://openseo.so", openai: "https://muapi.ai/open-generative-ai", gh_openai: "https://github.com/Anil-matcha/Open-Generative-AI", gh_seo: "https://github.com/every-app/open-seo", gh_cal: "https://github.com/calcom/cal.diy", gh_whispr: "https://github.com/OpenWhispr/openwhispr" };
(async () => {
  const b = await chromium.launch();
  for (const [k, u] of Object.entries(SITES)) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 }); const p = await ctx.newPage();
    try {
      const r = await p.goto(u, { waitUntil: "domcontentloaded", timeout: 60000 }); await p.waitForTimeout(5000);
      console.log(k, r && r.status(), await p.title());
      const H = await p.evaluate(() => document.documentElement.scrollHeight); const n = Math.min(4, Math.ceil(H / 800));
      for (let i = 0; i < n; i++) { await p.evaluate((y) => window.scrollTo(0, y), i * 800); await p.waitForTimeout(1200); await p.screenshot({ path: `assets/sites/${k}-${i}.png` }); }
    } catch (e) { console.log(k, "FAIL", String(e).slice(0, 120)); }
    await ctx.close();
  }
  await b.close();
})();
