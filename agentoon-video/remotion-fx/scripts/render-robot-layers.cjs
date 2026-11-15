// Renders the approved Agentoon robot (kit/robot.js, 2D SVG rig) to transparent PNG layers for Remotion.
// Output: public/robot/robot-neutral.png (+ robot-wow.png). The alpha channel IS the silhouette used by neon-outline.
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const kit = path.resolve(__dirname, "../../kit"); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1100 }, deviceScaleFactor: 2 });
  await p.setContent("<html><body style='margin:0;background:transparent'><div id='host' style='position:absolute;left:100px;top:50px'></div></body></html>");
  await p.addScriptTag({ path: kit + "/vendor/gsap.min.js" }); await p.addScriptTag({ path: kit + "/robot.js" });
  await p.evaluate(() => { const bot = Robot.create(document.getElementById("host"), { id: "rb", w: 600, x: 0, y: 0 }); window.__bot = bot; bot.P.wrap.style.position = "relative"; });
  const wrap = await p.$("#rb-wrap"); await wrap.screenshot({ path: "public/robot/robot-neutral.png", omitBackground: true });
  console.log("box", JSON.stringify(await wrap.boundingBox()));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
