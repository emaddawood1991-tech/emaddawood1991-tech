// Real browser screen recordings (Playwright recordVideo) of public sites: the "ordinary software screen recording" inputs for the demos.
const { chromium } = require("playwright"); const fs = require("fs"); const path = require("path");
const SITES = { "screen-cap": "https://cap.so", "screen-openseo": "https://openseo.so" };
(async () => {
  const b = await chromium.launch(); const out = path.resolve("public/footage"); fs.mkdirSync(out, { recursive: true });
  for (const [name, url] of Object.entries(SITES)) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: out + "/tmp", size: { width: 1280, height: 800 } } }); const p = await ctx.newPage();
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }); await p.waitForTimeout(1800);
    await p.mouse.move(900, 300, { steps: 25 }); await p.waitForTimeout(500);
    for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 130); await p.mouse.move(560 + i * 70, 330 + i * 35, { steps: 12 }); await p.waitForTimeout(650); }
    await p.waitForTimeout(500); const v = p.video(); await ctx.close(); const f = await v.path(); fs.renameSync(f, out + "/" + name + ".webm");
  }
  fs.rmSync(out + "/tmp", { recursive: true, force: true }); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
