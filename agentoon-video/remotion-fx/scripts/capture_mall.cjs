// Deterministic capture of the REAL Al Mutarid Mall HTML (unmodified file) with a virtual clock: usage node cap.cjs <segment> <W> <H> <outdir>
const { chromium } = require("playwright"); const fs = require("fs");
const [, , SEG, W, H, OUT] = process.argv; const w = +W, h = +H; fs.mkdirSync(OUT, { recursive: true });
const FPS = 30, DT = 1000 / FPS;
const ease = (t) => t * t * (3 - 2 * t);
// each segment: duration, ui(bool), keys[{k,a,b}], drag[{a,b,dx,dy}], acts[{t,type,idx|x,y}]
const SEGS = {
  hook: { dur: 3.5, ui: false, keys: [{ k: "w", a: 0, b: 2.4 }], drag: [{ a: 0, b: 3.5, dx: 60, dy: 0 }] },
  reveal: { dur: 9, ui: false, keys: [{ k: "w", a: 0, b: 2 }, { k: "w", a: 6, b: 7.2 }], drag: [{ a: 2, b: 6, dx: -170, dy: 0 }, { a: 6, b: 9, dx: -60, dy: 0 }] },
  walk: { dur: 18, ui: true, keys: [], drag: [], acts: [{ t: 0.4, type: "dir", idx: 9 }, { t: 9.0, type: "click", x: 0.33, y: 0.5 }, { t: 12.0, type: "close" }, { t: 12.6, type: "dir", idx: 24 }] },
  tour: { dur: 11, ui: false, keys: [], drag: [], acts: [{ t: 0.2, type: "dirh", idx: 10 }, { t: 5.4, type: "dirh", idx: 15 }] },
  end: { dur: 7, ui: false, keys: [{ k: "s", a: 0, b: 7 }], drag: [{ a: 0, b: 7, dx: -60, dy: 0 }] },
};
(async () => {
  const S = SEGS[SEG]; const frames = Math.round(S.dur * FPS);
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.addInitScript(fs.readFileSync("vt.js", "utf8")); await p.goto("file:///tmp/mall/mall.html"); await p.waitForTimeout(2500);
  if (!S.ui) await p.addStyleTag({ content: ".dir,.help,.brand,.tip{display:none!important}" });
  await p.evaluate(() => { for (let i = 0; i < 3; i++) window.__step(33.3); });
  const down = new Set(); let dragging = false, dpos = [w / 2, h / 2];
  const acts = (S.acts || []).slice();
  for (let f = 0; f < frames; f++) {
    const t = f / FPS;
    for (const k of ["w", "s"]) { const want = (S.keys || []).some((x) => x.k === k && t >= x.a && t < x.b); if (want && !down.has(k)) { await p.keyboard.down(k); down.add(k); } if (!want && down.has(k)) { await p.keyboard.up(k); down.delete(k); } }
    const dr = (S.drag || []).find((x) => t >= x.a && t < x.b);
    if (dr) { if (!dragging) { await p.mouse.move(w / 2, h / 2); await p.mouse.down(); dragging = true; dpos = [w / 2, h / 2]; } const u0 = ease((t - dr.a) / (dr.b - dr.a)), u1 = ease(Math.min(1, (t + 1 / FPS - dr.a) / (dr.b - dr.a))); dpos = [dpos[0] + (u1 - u0) * dr.dx, dpos[1] + (u1 - u0) * dr.dy]; await p.mouse.move(dpos[0], dpos[1]); }
    else if (dragging) { await p.mouse.up(); dragging = false; }
    while (acts.length && acts[0].t <= t) { const a = acts.shift(); if (a.type === "dir") await p.locator("#dir button").nth(a.idx).click(); if (a.type === "dirh") await p.evaluate((i) => document.querySelectorAll("#dir button")[i].click(), a.idx); if (a.type === "click") await p.mouse.click(a.x * w, a.y * h); if (a.type === "close") await p.locator("#cClose").click({ timeout: 2000 }).catch(() => {}); }
    await p.evaluate((dt) => window.__step(dt), DT);
    await p.screenshot({ path: `${OUT}/f${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 92 });
  }
  await b.close(); console.log(SEG, "done", frames);
})();
