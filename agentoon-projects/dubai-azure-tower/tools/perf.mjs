// Renderer statistics per mode and tier. Usage: NODE_PATH=$(npm root -g) node perf.mjs [url] [out.json]
// NOTE: frame times on a software renderer say nothing about real GPUs; draw calls / triangles / memory counts are valid anywhere.
import { createRequire } from "module"; import { writeFileSync } from "fs"; const require = createRequire(import.meta.url); const { chromium } = require("playwright");
const url = process.argv[2] || "http://localhost:8765/index.html", out = process.argv[3] || "";
const F = "window.__f50";
const VIEWS = [["tower overview", "tower", `${F}.VT.over`], ["tower street", "tower", `${F}.VT.arrival`], ["lobby", "lobby", `${F}.VL.entrance`], ["parking", "park", "[[170,120,-210],[5,-6,-12]]"], ["floor 12 plan", "office", `${F}.VO.plan`], ["floor 12 medical", "office", `${F}.VO.med`], ["floor 49", "floor", `${F}.VIEWS.over`], ["floor 50 plan", "apts", `${F}.VA.plan`], ["floor 50 3BR", "apts", `${F}.VA.br3`], ["floor 50 pools", "apts", `${F}.VA.pools`], ["wellness gym", "wellness", `${F}.AV.well('weights')`], ["wellness pool", "wellness", `${F}.AV.well('pool')`], ["sky restaurant", "sky", `${F}.AV.sky('main')`], ["lift cabin", "lift", `[${F}.LIFT.cam.p, ${F}.LIFT.cam.t]`]];
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"] });
const res = [];
for (const tier of (process.argv[4] || "high,low").split(",")) {
  const p = await b.newPage({ viewport: { width: 800, height: 500 } }); await p.goto(url + "?q=" + tier); await p.waitForFunction(() => window.__f50, null, { timeout: 120000 }); await p.waitForTimeout(2500);
  for (const [name, mode, cam] of VIEWS) { await p.evaluate(({ mode, cam }) => { __f50.setTime(14); __f50.setMode(mode); setTimeout(() => { if (mode === "lift") { __f50.LIFT.g.visible = true; } __f50.putCamera(...eval(cam)); }, 700); }, { mode, cam }); await p.waitForTimeout(4500); const m = await p.evaluate(() => __f50.metrics()); res.push({ tier, view: name, ...m }); console.log(tier.padEnd(6), name.padEnd(18), `calls ${String(m.drawCalls).padStart(5)}  tris ${String(m.triangles).padStart(8)}  geom ${m.geometries}  tex ${m.textures}  prog ${m.programs}  ${m.fps} fps(sw)`); }
  await p.close();
}
if (out) writeFileSync(out, JSON.stringify(res, null, 1)); await b.close();
