/* "Night Ops" look primitives: cinematic dark operations room, glass dashboards, placeholder system, hand-drawn callouts.
   Original implementation (HTML/CSS/SVG/GSAP). All motion is seekable and deterministic (seeded PRNG, finite tweens).
     NO.env(host, {tint})                        ops-room environment: gradient, glows, perspective floor grid, particles, scanlines
     NO.motion(tl, env, at, dur)                 continuous background motion (grid scroll, particles, glow breathing) for a scene window
     NO.glass(host, {id,x,y,w,h,title,accent})   glass dashboard panel; returns element (content area: el.querySelector('.gb'))
     NO.skel(host, {id,x,y,w,rows,rowH,gap})     skeleton rows (shimmer) = clearly NOT real data
     NO.ribbon(host, {id,x,y,text,w})            hazard-stripe PLACEHOLDER tag
     NO.callout(host, {id,x,y,w,h,color,label})  wobbled outline that draws on; .draw(tl, at, dur)
     NO.count(tl, el, at, dur, from, to, fmt)    number count-up
   Placeholder policy: anything standing in for a real tool result carries a ribbon until slots.json marks it verified. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const css = (d, s) => { d.style.cssText = s; return d; };
  const mk = (host, id, cls, style) => { const d = document.createElement("div"); if (id) d.id = id; if (cls) d.className = cls; if (style) d.style.cssText = style; host.appendChild(d); return d; };
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function env(host, o) {
    o = Object.assign({ id: "env", tint: "#00E0C6", seed: 5, floor: true, particles: 26 }, o);
    const e = mk(host, o.id, "no-env", "position:absolute;inset:0;overflow:hidden;background:radial-gradient(120% 90% at 50% 35%,#0B1B3A 0%,#050B1C 55%,#02040C 100%)");
    const glowA = mk(e, o.id + "-gA", "", "position:absolute;left:-200px;top:300px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle," + o.tint + "33 0%,transparent 65%)");
    const glowB = mk(e, o.id + "-gB", "", "position:absolute;right:-300px;top:900px;width:1100px;height:1100px;border-radius:50%;background:radial-gradient(circle,#3B82F633 0%,transparent 65%)");
    let plane = null;
    if (o.floor) {
      const fl = mk(e, o.id + "-fl", "", "position:absolute;left:0;right:0;bottom:0;height:900px;overflow:hidden;perspective:700px;perspective-origin:50% 0%;-webkit-mask-image:linear-gradient(to bottom,transparent 0%,#000 45%);mask-image:linear-gradient(to bottom,transparent 0%,#000 45%)");
      plane = mk(fl, o.id + "-pl", "", "position:absolute;left:-1400px;top:0;width:3880px;height:3000px;transform-origin:50% 0%;transform:rotateX(74deg);background-image:linear-gradient(" + o.tint + "88 3px,transparent 3px),linear-gradient(90deg," + o.tint + "66 3px,transparent 3px);background-size:140px 140px");
    }
    const R = rng(o.seed), dots = [];
    for (let i = 0; i < o.particles; i++) { const d = mk(e, o.id + "-p" + i, "", "position:absolute;left:" + Math.round(R() * 1080) + "px;top:" + Math.round(200 + R() * 1500) + "px;width:" + (3 + Math.round(R() * 5)) + "px;height:" + (3 + Math.round(R() * 5)) + "px;border-radius:50%;background:" + o.tint + ";opacity:" + (0.25 + R() * 0.5).toFixed(2) + ";box-shadow:0 0 14px " + o.tint); dots.push(d); }
    mk(e, o.id + "-sc", "", "position:absolute;inset:0;background:repeating-linear-gradient(to bottom,rgba(255,255,255,.035) 0px,rgba(255,255,255,.035) 2px,transparent 2px,transparent 6px);pointer-events:none");
    mk(e, o.id + "-vg", "", "position:absolute;inset:0;background:radial-gradient(120% 100% at 50% 50%,transparent 55%,rgba(0,0,0,.65) 100%);pointer-events:none");
    return { el: e, plane, dots, glowA, glowB };
  }

  function motion(tl, e, at, dur) {
    if (e.plane) { gsap.set(e.plane, { backgroundPosition: "0px 0px" }); tl.to(e.plane, { backgroundPosition: "0px " + Math.round(dur * 420) + "px", duration: dur, ease: "none" }, at); }
    e.dots.forEach((d, i) => { tl.fromTo(d, { y: 0 }, { y: -(120 + (i % 5) * 60), duration: dur, ease: "none" }, at); });
    const n = Math.max(1, Math.floor(dur / 2.4));
    for (let i = 0; i < n; i++) { tl.to(e.glowA, { scale: i % 2 ? 1 : 1.12, duration: dur / n, ease: "sine.inOut" }, at + i * dur / n); tl.to(e.glowB, { scale: i % 2 ? 1.1 : 1, duration: dur / n, ease: "sine.inOut" }, at + i * dur / n); }
  }

  function glass(host, o) {
    o = Object.assign({ accent: "#00E0C6", title: "" }, o);
    const p = mk(host, o.id, "no-glass", "position:absolute;left:" + o.x + "px;top:" + o.y + "px;width:" + o.w + "px;height:" + o.h + "px;border-radius:26px;background:linear-gradient(160deg,rgba(18,34,70,.82),rgba(8,16,38,.88));border:2px solid " + o.accent + "66;box-shadow:0 0 50px " + o.accent + "33, inset 0 0 40px rgba(0,0,0,.35)");
    const h = mk(p, null, "gh", "position:absolute;left:0;right:0;top:0;height:64px;border-radius:26px 26px 0 0;display:flex;align-items:center;padding:0 26px;font:700 26px/1 var(--mono);letter-spacing:.08em;color:" + o.accent + ";border-bottom:2px solid " + o.accent + "33"); h.textContent = o.title;
    mk(p, null, "gb", "position:absolute;left:0;right:0;top:64px;bottom:0");
    return p;
  }

  function skel(host, o) {
    o = Object.assign({ rows: 6, rowH: 34, gap: 22, color: "#7FA4FF" }, o);
    const w = mk(host, o.id, "no-skel", "position:absolute;left:" + o.x + "px;top:" + o.y + "px;width:" + o.w + "px");
    const bars = [];
    for (let i = 0; i < o.rows; i++) { const wd = 55 + ((i * 37) % 45); bars.push(mk(w, null, "", "height:" + o.rowH + "px;margin-bottom:" + o.gap + "px;border-radius:" + o.rowH / 2 + "px;width:" + wd + "%;background:linear-gradient(90deg," + o.color + "22 0%," + o.color + "55 50%," + o.color + "22 100%);background-size:220% 100%")); }
    w._bars = bars; return w;
  }
  function shimmer(tl, w, at, dur) { w._bars.forEach((b, i) => tl.fromTo(b, { backgroundPosition: "120% 0" }, { backgroundPosition: "-120% 0", duration: Math.max(1.6, dur), ease: "none" }, at + i * 0.08)); }

  function ribbon(host, o) {
    o = Object.assign({ text: "PLACEHOLDER · REAL RESULT PENDING", w: 560 }, o);
    const r = mk(host, o.id, "no-ribbon", "position:absolute;left:" + o.x + "px;top:" + o.y + "px;width:" + o.w + "px;height:46px;border-radius:8px;display:flex;align-items:center;justify-content:center;font:800 24px/1 var(--mono);letter-spacing:.06em;color:#1A1200;background:repeating-linear-gradient(135deg,#FFC83D 0px,#FFC83D 22px,#FFE08A 22px,#FFE08A 44px);box-shadow:0 0 24px #FFC83D66;border:2px solid #1A1200");
    r.textContent = o.text; return r;
  }

  function callout(host, o) {
    o = Object.assign({ color: "#FF5A5F", w: 400, h: 100, width: 7 }, o);
    const pad = 14, W = o.w + pad * 2, H = o.h + pad * 2;
    const w = mk(host, o.id, "no-callout", "position:absolute;left:" + (o.x - pad) + "px;top:" + (o.y - pad) + "px;width:" + W + "px;height:" + H + "px;pointer-events:none");
    const s = document.createElementNS(NS, "svg"); s.setAttribute("width", W); s.setAttribute("height", H); s.setAttribute("viewBox", "0 0 " + W + " " + H); s.style.cssText = "position:absolute;left:0;top:0;overflow:visible"; w.appendChild(s);
    const r = rng(o.id.length * 7 + o.w), j = () => (r() - 0.5) * 7;
    const x0 = pad, y0 = pad, x1 = pad + o.w, y1 = pad + o.h, c = Math.min(26, o.h / 2.4);
    const d = "M" + (x0 + c + j()) + " " + (y0 + j()) + " L" + (x1 - c + j()) + " " + (y0 + j()) + " Q" + (x1 + 4) + " " + (y0 - 2) + " " + (x1 + j()) + " " + (y0 + c) + " L" + (x1 + j()) + " " + (y1 - c) + " Q" + (x1 + 3) + " " + (y1 + 3) + " " + (x1 - c + j()) + " " + (y1 + j()) + " L" + (x0 + c + j()) + " " + (y1 + j()) + " Q" + (x0 - 4) + " " + (y1 + 2) + " " + (x0 + j()) + " " + (y1 - c) + " L" + (x0 + j()) + " " + (y0 + c + j()) + " Q" + (x0 - 2) + " " + (y0 - 3) + " " + (x0 + c + 8) + " " + (y0 + 1);
    const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); p.setAttribute("fill", "none"); p.setAttribute("stroke", o.color); p.setAttribute("stroke-width", o.width); p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round"); p.setAttribute("pathLength", 1); p.setAttribute("stroke-dasharray", 1); s.appendChild(p);
    gsap.set(p, { strokeDashoffset: 1 });
    let lab = null;
    if (o.label) { lab = mk(w, null, "", "position:absolute;left:" + (pad + 10) + "px;top:" + (-34) + "px;padding:6px 14px 8px;border-radius:8px;background:" + o.color + ";color:#0A0A0A;font:800 24px/1 var(--mono);opacity:0;white-space:nowrap"); lab.textContent = o.label; }
    return { el: w, draw(tl, at, dur) { tl.to(p, { strokeDashoffset: 0, duration: dur || 0.45, ease: "power2.inOut" }, at); if (lab) tl.fromTo(lab, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2 }, at + (dur || 0.45) * 0.7); return at + (dur || 0.45); }, hide(tl, at) { tl.to(w, { opacity: 0, duration: 0.2 }, at); } };
  }

  function count(tl, el, at, dur, from, to, fmt) {
    const o = { v: from }; fmt = fmt || (v => Math.round(v).toLocaleString("en-US"));
    el.textContent = fmt(from);
    tl.to(o, { v: to, duration: dur, ease: "power2.out", onUpdate: () => { el.textContent = fmt(o.v); } }, at);
  }

  window.NO = { env, motion, glass, skel, shimmer, ribbon, callout, count, mk };
})();
