// Real recordings of skills.sh (home -> search "remotion" -> skill page -> audits) and of the source SKILL.md on GitHub. A visible cursor dot is injected (recordVideo does not capture the OS cursor).
const { chromium } = require("playwright"); const fs = require("fs"); const path = require("path");
const out = path.resolve("public/ep20/footage"); const W = 1080, H = 1400;
const CUR = `(()=>{const d=document.createElement('div');d.style.cssText='position:fixed;z-index:2147483647;width:26px;height:26px;border-radius:50%;background:rgba(200,240,49,.85);border:3px solid #111;pointer-events:none;left:-50px;top:-50px;transform:translate(-50%,-50%);transition:none';document.documentElement.appendChild(d);addEventListener('mousemove',e=>{d.style.left=e.clientX+'px';d.style.top=e.clientY+'px'},true)})()`;
async function rec(name, fn) {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: out + "/tmp", size: { width: W, height: H } } });
  await ctx.addInitScript(CUR); const p = await ctx.newPage();
  try { await fn(p); } catch (e) { console.error(name, "ERR", e.message); }
  const v = p.video(); await ctx.close(); const f = await v.path(); fs.renameSync(f, out + "/" + name + ".webm"); await b.close(); console.log("recorded", name);
}
(async () => {
  await rec("home", async (p) => {
    await p.goto("https://skills.sh", { waitUntil: "domcontentloaded", timeout: 60000 }); await p.waitForTimeout(2500);
    await p.mouse.move(540, 700, { steps: 20 }); await p.waitForTimeout(700);
    const box = p.locator('input[type="search"], input[placeholder*="earch"]').first(); await box.waitFor({ timeout: 15000 });
    const bb = await box.boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 30 }); await p.waitForTimeout(400);
    await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.keyboard.type("remotion", { delay: 140 }); await p.waitForTimeout(3500);
    await p.mouse.move(540, 900, { steps: 25 }); await p.mouse.wheel(0, 300); await p.waitForTimeout(1500);
  });
  await rec("skillpage", async (p) => {
    await p.goto("https://skills.sh/remotion-dev/skills/remotion-best-practices", { waitUntil: "domcontentloaded", timeout: 60000 }); await p.waitForTimeout(2500);
    await p.mouse.move(300, 500, { steps: 20 }); await p.waitForTimeout(800);
    for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 260); await p.mouse.move(300 + i * 90, 520 + i * 40, { steps: 14 }); await p.waitForTimeout(900); }
    await p.waitForTimeout(800);
  });
  await rec("github", async (p) => {
    await p.goto("https://github.com/remotion-dev/skills/blob/main/skills/remotion-best-practices/SKILL.md", { waitUntil: "domcontentloaded", timeout: 45000 }); await p.waitForTimeout(2500);
    await p.mouse.move(400, 600, { steps: 20 });
    for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(800); }
  });
  fs.rmSync(out + "/tmp", { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
