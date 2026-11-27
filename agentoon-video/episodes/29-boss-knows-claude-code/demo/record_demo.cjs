// Real browser recording of the local demo (Playwright + Chromium). Real mouse moves and clicks; cursor dot injected because headless video has no OS cursor.
const { chromium } = require("playwright"); const http = require("http"); const fs = require("fs"); const path = require("path");
const root = path.join(__dirname, "dist"); const srv = http.createServer((q, r) => { const f = path.join(root, q.url === "/" ? "index.html" : q.url); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : "text/html" }); r.end(d); } }); });
(async () => {
  await new Promise((r) => srv.listen(4799, r)); const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 720, height: 1000 }, recordVideo: { dir: path.join(__dirname, "rec"), size: { width: 720, height: 1000 } } });
  const p = await ctx.newPage(); await p.goto("http://localhost:4799/");
  await p.addStyleTag({ content: "#cur{position:fixed;width:26px;height:26px;border-radius:50%;background:rgba(255,154,60,.9);border:3px solid #fff;z-index:99999;pointer-events:none;transform:translate(-50%,-50%);box-shadow:0 0 14px #ff9a3c}" });
  await p.evaluate(() => { const c = document.createElement("div"); c.id = "cur"; document.body.appendChild(c); document.addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }); });
  const log = []; const t0 = Date.now(); const T = (m) => log.push([Date.now() - t0, m]);
  const bb = async (id) => (await p.getByTestId(id).boundingBox()); const mv = async (id, steps = 25) => { const r = await bb(id); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2, { steps }); };
  await p.mouse.move(360, 500); await p.waitForTimeout(900);
  await mv("fixed"); await p.waitForTimeout(500); await p.mouse.click(...(await (async () => { const r = await bb("fixed"); return [r.x + r.width / 2, r.y + r.height / 2]; })())); T("click fixed #1: " + (await p.locator("#status").first().innerText())); await p.waitForTimeout(1400);
  await mv("buggy"); await p.waitForTimeout(500); let r = await bb("buggy"); await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); T("click buggy #1: " + (await p.locator("#status").nth(1).innerText())); await p.waitForTimeout(1500);
  await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); T("click buggy #2: " + (await p.locator("#status").nth(1).innerText())); await p.waitForTimeout(1800);
  fs.writeFileSync(path.join(__dirname, "rec", "clicklog.json"), JSON.stringify(log)); console.log(JSON.stringify(log));
  await ctx.close(); await b.close(); srv.close();
})();
