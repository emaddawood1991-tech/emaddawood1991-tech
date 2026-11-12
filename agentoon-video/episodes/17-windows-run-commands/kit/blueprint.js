/* Blueprint look primitives: engineering-drawing line work that draws itself (SVG stroke draw-on, lettered notes, rubber stamp).
   Original implementation; grammar inspired by the "Blueprint" style guide in Lemo-Opuscar (MIT), no code or assets copied.
   Colours come from CSS variables on the scene: --bp-line (strokes), --bp-text (lettering), --bp-fill (card fill), --bp-accent.
     BP.sheet(host, {id, kind:'blue'|'white'|'ink'})
     BP.box(host, {id,x,y,w,h,r,label,sub,labelSize,subSize,fill,line,text}) -> {el, draw(tl,at,dur,labelAt)}  (outline first, lettering at labelAt)
     BP.line(host, {id,pts:[[x,y],...],width,dash,arrow,color}) -> {el, draw(tl,at,dur)}
     BP.note(host, {id,x,y,text,size,color,w,align}) -> {el, write(tl,at,dur)}
     BP.stamp(host, {id,x,y,text,rot,color}) -> {el, slam(tl,at)}    (use the stamp colour once per film)
   All timings absolute; deterministic; no randomness. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const px = n => n + "px";
  const svgEl = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const div = (host, id, css) => { const d = document.createElement("div"); if (id) d.id = id; d.style.cssText = css || ""; host.appendChild(d); return d; };

  function sheet(host, o) {
    const kinds = {
      blue:  "background-color:#1E4691;background-image:radial-gradient(120% 90% at 50% 30%,#2A58A6 0%,#1E4691 55%,#16336E 100%),linear-gradient(rgba(231,240,249,.10) 2px,transparent 2px),linear-gradient(90deg,rgba(231,240,249,.10) 2px,transparent 2px);background-size:auto,72px 72px,72px 72px",
      white: "background-color:#F4F1E8;background-image:linear-gradient(rgba(20,48,107,.09) 2px,transparent 2px),linear-gradient(90deg,rgba(20,48,107,.09) 2px,transparent 2px);background-size:72px 72px",
      ink:   "background-color:#0A1330;background-image:radial-gradient(110% 80% at 50% 30%,#13224D 0%,#0A1330 70%),linear-gradient(rgba(96,205,255,.07) 2px,transparent 2px),linear-gradient(90deg,rgba(96,205,255,.07) 2px,transparent 2px);background-size:auto,72px 72px,72px 72px",
    };
    return div(host, o.id, "position:absolute;inset:0;" + kinds[o.kind || "blue"]);
  }

  function drawOn(tl, el, at, dur) { gsap.set(el, { strokeDashoffset: 1 }); tl.to(el, { strokeDashoffset: 0, duration: dur || 0.5, ease: "power2.inOut" }, at); }

  function box(host, o) {
    o = Object.assign({ r: 20, labelSize: 52, line: "var(--bp-line,#E7F0F9)", text: "var(--bp-text,#E7F0F9)", fill: "var(--bp-fill,transparent)", width: 6 }, o);
    const w = div(host, o.id, "position:absolute;left:" + px(o.x) + ";top:" + px(o.y) + ";width:" + px(o.w) + ";height:" + px(o.h));
    const s = svgEl("svg", { width: o.w, height: o.h, viewBox: "0 0 " + o.w + " " + o.h }, w); s.style.cssText = "position:absolute;left:0;top:0;overflow:visible";
    const f = svgEl("rect", { x: 3, y: 3, width: o.w - 6, height: o.h - 6, rx: o.r, fill: o.fill, opacity: 0 }, s);
    const r = svgEl("rect", { x: 3, y: 3, width: o.w - 6, height: o.h - 6, rx: o.r, fill: "none", stroke: o.line, "stroke-width": o.width, "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": 1 }, s);
    const lbl = div(w, null, "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;color:" + o.text + ";opacity:0");
    const t = div(lbl, null, "font:italic 700 " + o.labelSize + "px/1.05 var(--display);white-space:nowrap"); t.textContent = o.label || "";
    let sub = null; if (o.sub) { sub = div(lbl, null, "font:600 " + (o.subSize || Math.round(o.labelSize * 0.52)) + "px/1.1 var(--mono);opacity:.85;white-space:nowrap"); sub.textContent = o.sub; }
    gsap.set(r, { strokeDashoffset: 1 });
    return { el: w, draw(tl, at, dur, labelAt) { const la = labelAt == null ? at + 0.35 : labelAt; drawOn(tl, r, at, dur || 0.5); tl.to(f, { opacity: 1, duration: 0.25 }, at + 0.3); tl.to(lbl, { opacity: 1, duration: 0.01 }, la);
      tl.fromTo(t, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.3, ease: "steps(" + Math.max(3, (o.label || "").length) + ")" }, la);
      if (sub) tl.fromTo(sub, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.3, ease: "steps(" + Math.max(3, o.sub.length) + ")" }, la + 0.2); return at + (dur || 0.5) + 0.3; } };
  }

  function line(host, o) {
    o = Object.assign({ width: 6, color: "var(--bp-line,#E7F0F9)", arrow: false, dash: null }, o);
    const xs = o.pts.map(p => p[0]), ys = o.pts.map(p => p[1]), pad = 24;
    const x0 = Math.min.apply(null, xs) - pad, y0 = Math.min.apply(null, ys) - pad, W = Math.max.apply(null, xs) - x0 + pad, H = Math.max.apply(null, ys) - y0 + pad;
    const w = div(host, o.id, "position:absolute;left:" + px(x0) + ";top:" + px(y0) + ";width:" + px(W) + ";height:" + px(H));
    const s = svgEl("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H }, w); s.style.cssText = "position:absolute;left:0;top:0;overflow:visible";
    const d = o.pts.map((p, i) => (i ? "L" : "M") + (p[0] - x0) + " " + (p[1] - y0)).join(" ");
    const attrs = { d, fill: "none", stroke: o.color, "stroke-width": o.width, "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1 };
    if (!o.dash) attrs["stroke-dasharray"] = 1;
    const p = svgEl("path", attrs, s); gsap.set(p, { strokeDashoffset: 1 });
    let head = null;
    if (o.arrow) {
      const a = o.pts[o.pts.length - 2], b = o.pts[o.pts.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = o.width * 3.2, sp = 0.5;
      const q = (t) => [b[0] - x0 - L * Math.cos(ang + t), b[1] - y0 - L * Math.sin(ang + t)];
      head = svgEl("path", { d: "M" + q(sp).join(" ") + " L" + (b[0] - x0) + " " + (b[1] - y0) + " L" + q(-sp).join(" "), fill: "none", stroke: o.color, "stroke-width": o.width, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0 }, s);
    }
    return { el: w, path: p, draw(tl, at, dur) { const d2 = dur || 0.5; if (o.dash) { gsap.set(p, { strokeDasharray: o.dash, strokeDashoffset: 0, opacity: 0 }); tl.to(p, { opacity: 1, duration: d2 * 0.6 }, at); }
      else drawOn(tl, p, at, d2); if (head) tl.to(head, { opacity: 1, duration: 0.12 }, at + d2 * 0.9); return at + d2; } };
  }

  function note(host, o) {
    o = Object.assign({ size: 44, color: "var(--bp-text,#E7F0F9)", align: "left", w: 700 }, o);
    const d = div(host, o.id, "position:absolute;left:" + px(o.x) + ";top:" + px(o.y) + ";width:" + px(o.w) + ";font:italic 600 " + o.size + "px/1.2 var(--display);color:" + o.color + ";text-align:" + o.align + ";opacity:0");
    d.textContent = o.text;
    return { el: d, write(tl, at, dur) { tl.to(d, { opacity: 1, duration: 0.01 }, at); tl.fromTo(d, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: dur || 0.5, ease: "steps(" + Math.max(4, o.text.length) + ")" }, at); return at + (dur || 0.5); } };
  }

  function stamp(host, o) {
    o = Object.assign({ color: "#E5484D", rot: -8, size: 78 }, o);
    const d = div(host, o.id, "position:absolute;left:" + px(o.x) + ";top:" + px(o.y) + ";padding:14px 34px 18px;border:10px double " + o.color + ";border-radius:14px;color:" + o.color + ";font:800 " + o.size + "px/1 var(--body);letter-spacing:.06em;white-space:nowrap;opacity:0;background:rgba(255,255,255,.0)");
    d.textContent = o.text; gsap.set(d, { rotation: o.rot });
    return { el: d, slam(tl, at) { tl.fromTo(d, { opacity: 0, scale: 2.6 }, { opacity: 0.94, scale: 1, duration: 0.16, ease: "power4.in" }, at);
      tl.to(d, { scale: 1.06, duration: 0.06, ease: "power1.out" }, at + 0.16); tl.to(d, { scale: 1, duration: 0.14, ease: "power2.out" }, at + 0.22);
      return at + 0.4; } };
  }

  window.BP = { sheet, box, line, note, stamp };
})();
