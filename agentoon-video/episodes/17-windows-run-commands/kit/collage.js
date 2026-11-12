/* Original paper-collage B-roll, rendered locally (HTML + CSS + SVG + GSAP). No video-generation API.
   Torn-edge paper pieces with halftone dots, hard drop shadows and stop-motion entrances (`steps()` easing).
     Collage.paper(host, {id,x,y,w,h,fill,ink,dots,rot,label,seed,labelSize}) -> element
     Collage.stopIn(tl, el, at, {dx,dy,rot,steps,dur})       slide + settle in a few discrete steps
     Collage.arrow(host, {id,x,y,len,color,rot}) -> element   cut-paper arrow
   All geometry is seeded (no Math.random) so renders are identical. */
(function () {
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function tornPolygon(w, h, seed, amp) {
    const r = rng(seed), pts = [], n = Math.max(10, Math.round((w + h) / 46)), a = amp || 7;
    const edge = (x0, y0, x1, y1, k) => { for (let i = 0; i < k; i++) { const t = i / k; pts.push([x0 + (x1 - x0) * t + (r() - .5) * a, y0 + (y1 - y0) * t + (r() - .5) * a]); } };
    const kx = Math.round(n * w / (w + h)), ky = Math.round(n * h / (w + h));
    edge(a, a, w - a, a, kx); edge(w - a, a, w - a, h - a, ky); edge(w - a, h - a, a, h - a, kx); edge(a, h - a, a, a, ky);
    return "polygon(" + pts.map(p => p[0].toFixed(1) + "px " + p[1].toFixed(1) + "px").join(",") + ")";
  }

  function paper(host, o) {
    o = Object.assign({ w: 400, h: 260, fill: "#FFFDF7", ink: "#0C1020", dots: null, rot: 0, seed: 7, label: "", labelSize: 54 }, o);
    const wrap = document.createElement("div"); wrap.className = "paper"; wrap.id = o.id;
    wrap.style.cssText = "left:" + o.x + "px;top:" + o.y + "px;width:" + o.w + "px;height:" + o.h + "px;filter:drop-shadow(10px 12px 0 rgba(12,16,32," + (o.shadow == null ? .85 : o.shadow) + "))";
    const face = document.createElement("div"); face.className = "face";
    face.style.background = o.fill; face.style.clipPath = tornPolygon(o.w, o.h, o.seed);
    if (o.dots) face.style.backgroundImage = "radial-gradient(" + o.dots + " 22%, transparent 24%)", face.style.backgroundSize = "18px 18px";
    wrap.appendChild(face);
    if (o.label) { const l = document.createElement("div"); l.className = "lbl"; l.textContent = o.label; l.style.color = o.ink; l.style.fontSize = o.labelSize + "px"; if (o.mono) l.style.fontFamily = "var(--mono)"; wrap.appendChild(l); }
    host.appendChild(wrap);
    gsap.set(wrap, { rotation: o.rot });
    return wrap;
  }

  function stopIn(tl, el, at, o) {
    o = Object.assign({ dx: 0, dy: 120, rot: 6, steps: 5, dur: 0.42 }, o);
    tl.from(el, { x: "+=" + o.dx, y: "+=" + o.dy, rotation: "+=" + o.rot, opacity: 0, duration: o.dur, ease: "steps(" + o.steps + ")" }, at);
    tl.fromTo(el, { scale: 1.06 }, { scale: 1, duration: 0.12, ease: "power2.out" }, at + o.dur);
    return at + o.dur + 0.12;
  }

  function arrow(host, o) {
    o = Object.assign({ len: 220, color: "#FF6A3D", rot: 0 }, o);
    const d = document.createElement("div"); d.id = o.id; d.className = "paper";
    d.style.cssText = "left:" + o.x + "px;top:" + o.y + "px;width:" + o.len + "px;height:90px;filter:drop-shadow(6px 8px 0 rgba(12,16,32,.85))";
    d.innerHTML = '<svg viewBox="0 0 220 90" width="' + o.len + '" height="90"><polygon points="4,30 150,30 150,6 216,45 150,84 150,60 4,60" fill="' + o.color + '" stroke="#0C1020" stroke-width="4" stroke-linejoin="round"/></svg>';
    host.appendChild(d); gsap.set(d, { rotation: o.rot });
    return d;
  }

  window.Collage = { paper, stopIn, arrow };
})();
