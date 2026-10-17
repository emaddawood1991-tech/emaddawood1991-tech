/* Original continuous-camera transitions (HyperFrames + GSAP, free licences). Not derived from OneTake code or assets:
   these are plain GSAP tweens of scene wrappers and one growing "carrier" element, so something on screen survives
   and becomes the next beat. All functions take absolute times and return the end time.
     Cam.cardGrow(tl, host, at, dur, {x,y,w,h,r,color,from,to})   a card on scene A grows into scene B's background
     Cam.whip(tl, at, dur, {out, inn, dir, blur})                   horizontal whip pan with motion blur
     Cam.push(tl, at, dur, {out, inn, ox, oy, scale})               push through a point; next scene arrives from inside it
     Cam.drift(tl, el, at, dur, {ax, ay, rot})                      subtle hand-held drift (deterministic sine)
     Cam.frame(world, cx, cy, s) / Cam.fly(tl, world, at, dur, {cx, cy, s})   continuous camera over a big world
     Cam.sheetDrop(tl, at, dur, {out, inn})                         a new sheet is laid over the old one */
(function () {
  const W = 1080, H = 1920;

  function cardGrow(tl, host, at, dur, o) {
    const c = document.createElement("div");
    c.style.cssText = "position:absolute;z-index:50;pointer-events:none;opacity:0;background:" + o.color;
    c.id = o.id || ("grow-" + Math.round(at * 100)); host.appendChild(c);
    c.style.display = "flex"; c.style.alignItems = "center"; c.style.justifyContent = "center"; c.style.overflow = "hidden";
    if (o.label) {                                   // same text as the card it grows from, fading as it fills the frame
      const l = document.createElement("div"); l.textContent = o.label; l.style.cssText = "white-space:nowrap;font:800 " + (o.labelSize || 58) + "px/1 var(--display);color:" + (o.ink || "#0C1020");
      c.appendChild(l); tl.to(l, { opacity: 0, duration: dur * 0.4, ease: "power1.in" }, at);
    }
    tl.set(c, { left: o.x, top: o.y, width: o.w, height: o.h, borderRadius: o.r || 28, opacity: 1, rotation: o.rot || 0 }, at);
    tl.to(c, { left: 0, top: 0, width: W, height: H, borderRadius: 0, rotation: 0, duration: dur, ease: "power3.inOut" }, at);
    if (o.from) tl.to(o.from, { scale: 1.04, duration: dur, ease: "power2.in" }, at);   // old scene stays visible until the carrier covers it
    // the carrier dissolves once scene B's own background is in place underneath
    tl.to(c, { opacity: 0, duration: 0.2, ease: "power1.out" }, at + dur + 0.02);
    return at + dur + 0.22;
  }

  function whip(tl, at, dur, o) {
    const d = o.dir || 1, blur = o.blur == null ? 26 : o.blur;
    tl.fromTo(o.inn, { x: d * W * 1.05 }, { x: 0, duration: dur, ease: "power4.inOut" }, at);
    tl.to(o.out, { x: -d * W * 1.05, duration: dur, ease: "power4.inOut" }, at);
    [o.out, o.inn].forEach(n => {
      tl.to(n, { filter: "blur(" + blur + "px)", duration: dur * 0.42, ease: "power2.in" }, at);
      tl.to(n, { filter: "blur(0px)", duration: dur * 0.42, ease: "power2.out" }, at + dur * 0.58);
    });
    return at + dur;
  }

  function push(tl, at, dur, o) {
    const ox = o.ox == null ? W / 2 : o.ox, oy = o.oy == null ? H / 2 : o.oy, s = o.scale || 5;
    tl.set(o.out, { transformOrigin: ox + "px " + oy + "px" }, at);
    tl.set(o.inn, { transformOrigin: ox + "px " + oy + "px" }, at);
    tl.to(o.out, { scale: s, duration: dur, ease: "power3.in" }, at);
    tl.to(o.out, { opacity: 0, duration: dur * 0.35, ease: "power1.in" }, at + dur * 0.65);
    tl.fromTo(o.inn, { scale: 1 / s * 1.4, opacity: 0 }, { scale: 1, opacity: 1, duration: dur, ease: "power3.out" }, at + dur * 0.3);
    return at + dur * 1.3;
  }

  /* continuous camera over a big world: world is positioned with transform-origin 0 0 and moved so (cx,cy) is centred at scale s */
  function frame(world, cx, cy, s) { gsap.set(world, { transformOrigin: "0px 0px", x: W / 2 - cx * s, y: H / 2 - cy * s, scale: s }); }
  function fly(tl, world, at, dur, o) { const s = o.s || 1; tl.to(world, { x: W / 2 - o.cx * s, y: H / 2 - o.cy * s, scale: s, duration: dur, ease: o.ease || "power2.inOut" }, at); return at + dur; }

  /* a new sheet is laid onto the desk from above (incoming scene must sit above the outgoing one in the DOM) */
  function sheetDrop(tl, at, dur, o) {
    tl.fromTo(o.inn, { y: -H * 1.08, rotation: -3, filter: "drop-shadow(0px 60px 50px rgba(0,0,0,0.55))" }, { y: 0, rotation: 0, filter: "drop-shadow(0px 0px 0px rgba(0,0,0,0))", duration: dur, ease: "power3.out" }, at);
    tl.to(o.out, { scale: 0.97, duration: dur, ease: "power2.out" }, at);
    return at + dur;
  }

  function drift(tl, el, at, dur, o) {
    o = Object.assign({ ax: 8, ay: 6, rot: 0.25 }, o);
    const n = Math.max(1, Math.floor(dur / 1.1));
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? -1 : 1;
      tl.to(el, { x: s * o.ax, y: -s * o.ay, rotation: s * o.rot, duration: dur / n, ease: "sine.inOut" }, at + i * (dur / n));
    }
    return at + dur;
  }

  window.Cam = { cardGrow, whip, push, drift, frame, fly, sheetDrop };
})();
