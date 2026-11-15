// Adaptive graphics quality + performance metrics (Phase 1).
// Tiers change: pixel ratio, sun-shadow resolution / on-off, and per-room point lights. Anti-aliasing is fixed when the
// renderer is created (a change of AA needs a reload), everything else applies live.
const KEY = "azure.gfx";
export const TIERS = {
  low: { label: "Low", dpr: 1, shadows: false, shadowMap: 1024, pointLights: false },
  medium: { label: "Medium", dpr: 1.25, shadows: true, shadowMap: 1024, pointLights: true },
  high: { label: "High", dpr: 1.75, shadows: true, shadowMap: 2048, pointLights: true },
  ultra: { label: "Ultra", dpr: 2, shadows: true, shadowMap: 4096, pointLights: true },
};
const ORDER = ["low", "medium", "high", "ultra"];

export function detectDevice() {
  const ua = navigator.userAgent || "", coarse = matchMedia && matchMedia("(pointer:coarse)").matches;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (coarse && Math.min(screen.width, screen.height) < 900);
  let gpu = "";
  try { const gl = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl"); const e = gl && gl.getExtension("WEBGL_debug_renderer_info"); gpu = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : ""; } catch (e) { /* unknown GPU */ }
  const software = /swiftshader|llvmpipe|software|softpipe/i.test(gpu);
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory;   // deviceMemory is Chromium-only
  const weakGpu = /Mali|Adreno|PowerVR|Intel.*(HD|UHD)|llvmpipe/i.test(gpu);
  const ultraOK = !mobile && !software && !weakGpu && cores >= 8 && (mem === undefined || mem >= 8);
  return { mobile, gpu, software, cores, mem, ultraOK, dpr: window.devicePixelRatio || 1 };
}
export function autoTier(d) {
  if (d.software) return "low";
  if (d.mobile) return "medium";                       // phones/tablets start on Medium, fall back to Low if too slow
  if (d.cores >= 6 && (d.mem === undefined || d.mem >= 4)) return "high";
  return "medium";
}

export function createQuality() {
  const dev = detectDevice(), params = new URLSearchParams(location.search);
  let stored = null; try { stored = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  let pref = params.get("q") || stored || "auto";                      // "auto" | tier name
  if (pref !== "auto" && !TIERS[pref]) pref = "auto";
  if (pref === "ultra" && !dev.ultraOK && !params.get("q")) pref = "auto";   // a stored Ultra is ignored on weaker devices
  const Q = { dev, pref, tier: pref === "auto" ? autoTier(dev) : pref, forced: !!params.get("q"), listeners: [], toast: null };
  Q.initial = Q.tier; Q.cfg = TIERS[Q.tier];
  Q.antialias = Q.tier !== "low";
  Q.set = (p, persist = true) => { Q.pref = p; Q.tier = p === "auto" ? autoTier(dev) : p; Q.cfg = TIERS[Q.tier]; if (persist) { try { localStorage.setItem(KEY, p); } catch (e) { /* ignore */ } } Q.listeners.forEach((f) => f(Q)); };
  Q.onChange = (f) => Q.listeners.push(f);
  Q.stepDown = (why) => { const i = ORDER.indexOf(Q.tier); if (i <= 0) return false; Q.tier = ORDER[i - 1]; Q.cfg = TIERS[Q.tier]; Q.listeners.forEach((f) => f(Q)); Q.toast && Q.toast(`Graphics lowered to ${Q.cfg.label}: ${why}`); return true; };

  // frame-rate monitor: only auto mode may fall back; never during the first seconds or while the tab is hidden
  const mon = { n: 0, sum: 0, strikes: 0, t0: performance.now(), ema: 16.7, frames: 0, last: performance.now() };
  Q.frame = (now) => {
    const dt = now - mon.last; mon.last = now; if (document.hidden || dt > 1000) return;
    mon.ema = mon.ema * 0.95 + dt * 0.05; mon.frames++;
    if (Q.pref !== "auto" || Q.forced || now - mon.t0 < 6000 || Q.fadeUntil > now) return;
    mon.n++; mon.sum += dt;
    if (mon.n >= 120) { const fps = 1000 / (mon.sum / mon.n); mon.n = 0; mon.sum = 0; mon.strikes = fps < 24 ? mon.strikes + 1 : 0; if (mon.strikes >= 2 && Q.stepDown(`only ${fps.toFixed(0)} frames per second`)) { mon.strikes = 0; mon.t0 = now; } }
  };
  Q.fps = () => 1000 / mon.ema; Q.ms = () => mon.ema;
  return Q;
}

// Overlay with live renderer statistics. Toggle with the P key (or open the page with ?debug).
export function createMetrics(renderer, Q, getMode) {
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;left:12px;bottom:70px;z-index:30;font:11px/1.5 ui-monospace,Menlo,monospace;color:#cfe;background:rgba(5,10,14,.82);border:1px solid rgba(120,255,200,.35);border-radius:8px;padding:6px 9px;display:none;white-space:pre;pointer-events:none";
  document.body.appendChild(el);
  const get = () => { const i = renderer.info, m = performance && performance.memory; return { fps: +Q.fps().toFixed(1), frameMs: +Q.ms().toFixed(1), drawCalls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs ? i.programs.length : 0, pixelRatio: renderer.getPixelRatio(), canvas: `${renderer.domElement.width}x${renderer.domElement.height}`, tier: Q.tier, mode: getMode(), heapMB: m ? +(m.usedJSHeapSize / 1048576).toFixed(0) : null }; };
  let on = new URLSearchParams(location.search).has("debug"), tick = 0;
  const show = (v) => { on = v; el.style.display = on ? "block" : "none"; };
  addEventListener("keydown", (e) => { if ((e.key === "p" || e.key === "P") && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) show(!on); });
  show(on);
  return { get, show, update() { if (!on || ++tick % 20) return; const s = get(); el.textContent = `${s.fps} fps  ${s.frameMs} ms\ncalls ${s.drawCalls}  tris ${(s.triangles / 1000).toFixed(0)}k\ngeom ${s.geometries}  tex ${s.textures}  prog ${s.programs}\nDPR ${s.pixelRatio}  ${s.canvas}\n${s.tier.toUpperCase()}  ${s.mode}${s.heapMB ? "  heap " + s.heapMB + " MB" : ""}`; } };
}
