// Static-position screen recordings (no scrolling; cursor hovers) used for the cinematic-cuts demo, where a fixed target point must stay put.
const { chromium } = require("playwright"); const fs = require("fs"); const path = require("path");
const SITES = { "cut-cap": ["https://cap.so", [[900, 600], [610, 610]]], "cut-openseo": ["https://openseo.so", [[700, 300], [640, 515]]] };
(async () => {
  const b = await chromium.launch(); const out = path.resolve("public/footage");
  for (const [name, [url, path_]] of Object.entries(SITES)) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: out + "/tmp", size: { width: 1280, height: 800 } } }); const p = await ctx.newPage();
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }); await p.waitForTimeout(2500);
    for (const [x, y] of path_) { await p.mouse.move(x, y, { steps: 30 }); await p.waitForTimeout(700); }
    await p.waitForTimeout(2500); const v = p.video(); await ctx.close(); fs.renameSync(await v.path(), out + "/" + name + ".webm");
  }
  fs.rmSync(out + "/tmp", { recursive: true, force: true }); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
