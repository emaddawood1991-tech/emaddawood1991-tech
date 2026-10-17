/* Agentoon robot: SVG rig + seekable GSAP actions (pointing, walking, reacting, introducing a tool, outro).
   Rig is rebuilt from the brand description (teal body, light-grey head, red antenna bulb, navy eyes, chest light,
   black outlines). Swap `BODY`/`HEAD` shapes for the canonical artwork when the original file is supplied.
   Principles (ClaudeAnimationBase, MIT): anticipation, arcs, overlap, squash/stretch, no twinning, readable holds.
   All actions add tweens to a paused timeline at absolute times and return their end time. No repeat:-1, no randomness. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const C = { line: "#0B0F1A", teal: "#19B5A5", tealD: "#128F83", head: "#E9EDF2", face: "#F8FAFC", eye: "#14234B", red: "#E5484D", glow: "#D8FFF6", hand: "#E9EDF2" };
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

  function create(host, opts) {
    const o = Object.assign({ id: "bot", w: 300 }, opts);
    const k = o.w / 200;                       // svg units -> px
    const wrap = document.createElement("div");
    wrap.className = "ag-bot"; wrap.id = o.id + "-wrap";
    wrap.style.width = o.w + "px"; wrap.style.height = o.w * 1.4 + "px";
    const svg = el("svg", { viewBox: "0 0 200 280", width: o.w, height: o.w * 1.4 }, wrap);
    const stroke = { stroke: C.line, "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" };
    const P = { wrap, svg, k };

    P.shadow = el("ellipse", { cx: 100, cy: 272, rx: 52, ry: 8, fill: "#000", opacity: 0.22 }, svg);
    P.flip = el("g", {}, svg);
    P.legL = el("g", {}, P.flip); P.legR = el("g", {}, P.flip);
    el("rect", Object.assign({ x: 72, y: 222, width: 20, height: 38, rx: 10, fill: C.tealD }, stroke), P.legL);
    el("ellipse", Object.assign({ cx: 80, cy: 264, rx: 17, ry: 8, fill: C.line }, {}), P.legL);
    el("rect", Object.assign({ x: 108, y: 222, width: 20, height: 38, rx: 10, fill: C.tealD }, stroke), P.legR);
    el("ellipse", Object.assign({ cx: 120, cy: 264, rx: 17, ry: 8, fill: C.line }, {}), P.legR);

    P.bob = el("g", {}, P.flip);
    P.armL = el("g", {}, P.bob); P.armR = el("g", {}, P.bob);
    [[P.armL, 61], [P.armR, 139]].forEach(([g, sx]) => {
      el("rect", Object.assign({ x: sx - 9, y: 156, width: 18, height: 52, rx: 9, fill: C.teal }, stroke), g);
      el("circle", Object.assign({ cx: sx, cy: 214, r: 11, fill: C.hand }, stroke), g);
    });
    el("rect", Object.assign({ x: 56, y: 136, width: 88, height: 96, rx: 30, fill: C.teal }, stroke), P.bob);
    P.chestGlow = el("circle", { cx: 100, cy: 184, r: 20, fill: C.glow, opacity: 0.0 }, P.bob);
    el("circle", Object.assign({ cx: 100, cy: 184, r: 11, fill: C.glow }, { stroke: C.line, "stroke-width": 2.5 }), P.bob);

    P.head = el("g", {}, P.bob);
    P.antenna = el("g", {}, P.head);
    el("line", Object.assign({ x1: 100, y1: 42, x2: 100, y2: 16 }, stroke), P.antenna);
    P.bulb = el("circle", Object.assign({ cx: 100, cy: 11, r: 9, fill: C.red }, stroke), P.antenna);
    el("rect", Object.assign({ x: 23, y: 76, width: 14, height: 32, rx: 7, fill: C.tealD }, stroke), P.head);
    el("rect", Object.assign({ x: 163, y: 76, width: 14, height: 32, rx: 7, fill: C.tealD }, stroke), P.head);
    el("rect", Object.assign({ x: 34, y: 40, width: 132, height: 100, rx: 36, fill: C.head }, stroke), P.head);
    el("rect", { x: 50, y: 58, width: 100, height: 64, rx: 24, fill: C.face, opacity: 0.9 }, P.head);
    P.eyes = el("g", {}, P.head);
    P.eyeL = el("g", {}, P.eyes); P.eyeR = el("g", {}, P.eyes);
    [[P.eyeL, 78], [P.eyeR, 122]].forEach(([g, cx]) => {
      el("ellipse", { cx, cy: 90, rx: 9, ry: 14, fill: C.eye }, g);
      el("circle", { cx: cx + 3, cy: 85, r: 3.2, fill: "#fff" }, g);
    });
    P.eyesHappy = el("g", { opacity: 0, fill: "none", stroke: C.eye, "stroke-width": 6, "stroke-linecap": "round" }, P.head);
    el("path", { d: "M68 96 Q78 80 88 96" }, P.eyesHappy); el("path", { d: "M112 96 Q122 80 132 96" }, P.eyesHappy);
    P.browL = el("path", { d: "M68 70 L88 68", stroke: C.eye, "stroke-width": 5, "stroke-linecap": "round", opacity: 0 }, P.head);
    P.browR = el("path", { d: "M112 68 L132 70", stroke: C.eye, "stroke-width": 5, "stroke-linecap": "round", opacity: 0 }, P.head);
    P.m = {
      smile: el("path", { d: "M84 110 Q100 124 116 110", fill: "none", stroke: C.eye, "stroke-width": 5, "stroke-linecap": "round" }, P.head),
      open: el("ellipse", { cx: 100, cy: 114, rx: 9, ry: 8, fill: C.eye, opacity: 0 }, P.head),
      flat: el("path", { d: "M88 114 L112 114", fill: "none", stroke: C.eye, "stroke-width": 5, "stroke-linecap": "round", opacity: 0 }, P.head),
      worry: el("path", { d: "M86 118 Q100 106 114 118", fill: "none", stroke: C.eye, "stroke-width": 5, "stroke-linecap": "round", opacity: 0 }, P.head),
      big: el("path", { d: "M80 106 Q100 134 120 106 Z", fill: C.eye, opacity: 0 }, P.head),
    };
    P.sweat = el("path", { d: "M150 52 Q158 66 150 72 Q142 66 150 52 Z", fill: "#7CD3FF", stroke: C.line, "stroke-width": 2.5, opacity: 0 }, P.head);
    P.bang = el("g", { opacity: 0 }, P.head);
    el("rect", { x: 160, y: 8, width: 9, height: 24, rx: 4, fill: C.red }, P.bang); el("circle", { cx: 164.5, cy: 40, r: 5, fill: C.red }, P.bang);

    host.appendChild(wrap);
    // pivots (svg units) and initial pose
    gsap.set(P.armL, { svgOrigin: "61 162", rotation: 6 });
    gsap.set(P.armR, { svgOrigin: "139 162", rotation: -6 });
    gsap.set(P.legL, { svgOrigin: "82 224" }); gsap.set(P.legR, { svgOrigin: "118 224" });
    gsap.set(P.head, { svgOrigin: "100 136" });
    gsap.set(P.antenna, { svgOrigin: "100 42" });
    gsap.set(P.eyeL, { svgOrigin: "78 90" }); gsap.set(P.eyeR, { svgOrigin: "122 90" });
    gsap.set(P.flip, { svgOrigin: "100 140", scaleX: 1 });
    gsap.set(wrap, { x: o.x || 0, y: o.y || 0, transformOrigin: "50% 100%" });
    return new Bot(P, o);
  }

  function Bot(P, o) { this.P = P; this.o = o; this.facing = 1; }
  const B = Bot.prototype;
  const set = (tl, t, tg, v) => tl.set(tg, v, t);

  B.place = function (tl, at, x, y, scale) { tl.set(this.P.wrap, { x, y, scale: scale == null ? 1 : scale }, at); return at; };
  B.face = function (tl, at, dir, dur) { this.facing = dir; tl.to(this.P.flip, { scaleX: dir, duration: dur == null ? 0.18 : dur, ease: "power2.inOut" }, at); return at + (dur == null ? 0.18 : dur); };
  B.mouth = function (tl, at, name) { for (const n in this.P.m) tl.set(this.P.m[n], { opacity: n === name ? 1 : 0 }, at); };
  B.eyesMode = function (tl, at, mode) { tl.set(this.P.eyes, { opacity: mode === "happy" ? 0 : 1 }, at); tl.set(this.P.eyesHappy, { opacity: mode === "happy" ? 1 : 0 }, at); };
  B.look = function (tl, at, dx, dy, dur) { const d = dur == null ? 0.15 : dur; [this.P.eyeL, this.P.eyeR].forEach((e, i) => tl.to(e, { x: dx, y: dy, duration: d + i * 0.02, ease: "power2.out" }, at)); return at + d; };
  B.blink = function (tl, at) { [this.P.eyeL, this.P.eyeR].forEach(e => { tl.to(e, { scaleY: 0.1, duration: 0.06, ease: "power1.in" }, at); tl.to(e, { scaleY: 1, duration: 0.09, ease: "power1.out" }, at + 0.07); }); return at + 0.16; };
  B.blinks = function (tl, from, to, period) { for (let t = from; t < to; t += period) this.blink(tl, t + ((t * 7) % 3) * 0.1); };
  B.idle = function (tl, at, dur) { const n = Math.max(1, Math.floor(dur / 0.9)); for (let i = 0; i < n; i++) { tl.to(this.P.bob, { y: -2.5, duration: 0.45, ease: "sine.inOut" }, at + i * 0.9); tl.to(this.P.bob, { y: 0, duration: 0.45, ease: "sine.inOut" }, at + i * 0.9 + 0.45); } return at + dur; };

  B.reset = function (tl, at, dur) {
    const d = dur == null ? 0.25 : dur, P = this.P;
    tl.to(P.armL, { rotation: 6, duration: d, ease: "power2.out" }, at); tl.to(P.armR, { rotation: -6, duration: d, ease: "power2.out" }, at);
    tl.to(P.head, { rotation: 0, duration: d, ease: "power2.out" }, at);
    tl.to([P.eyeL, P.eyeR], { scaleX: 1, scaleY: 1, x: 0, y: 0, duration: d }, at);
    this.eyesMode(tl, at, "normal"); this.mouth(tl, at, "smile");
    [P.sweat, P.bang, P.browL, P.browR].forEach(n => tl.to(n, { opacity: 0, duration: 0.12 }, at));
    return at + d;
  };

  // squash on landing, stretch on leaving: anticipation -> action -> settle
  B.hop = function (tl, at, h, dur) {
    const w = this.P.wrap, d = dur || 0.5, up = d * 0.45;
    tl.to(w, { scaleY: 0.86, scaleX: 1.1, duration: 0.1, ease: "power2.out" }, at);
    tl.to(w, { y: "-=" + h, scaleY: 1.1, scaleX: 0.93, duration: up, ease: "power2.out" }, at + 0.1);
    tl.to(w, { y: "+=" + h, scaleY: 1, scaleX: 1, duration: d - up - 0.1 + 0.1, ease: "power2.in" }, at + 0.1 + up);
    tl.to(w, { scaleY: 0.9, scaleX: 1.08, duration: 0.07, ease: "power1.out" }, at + d + 0.1);
    tl.to(w, { scaleY: 1, scaleX: 1, duration: 0.18, ease: "back.out(2.5)" }, at + d + 0.17);
    return at + d + 0.35;
  };

  B.wave = function (tl, at, hand) {
    const a = hand === "L" ? this.P.armL : this.P.armR, s = hand === "L" ? -1 : 1;
    tl.to(a, { rotation: s * 168, duration: 0.28, ease: "back.out(1.8)" }, at);
    for (let i = 0; i < 3; i++) { tl.to(a, { rotation: s * 150, duration: 0.14, ease: "sine.inOut" }, at + 0.28 + i * 0.28); tl.to(a, { rotation: s * 172, duration: 0.14, ease: "sine.inOut" }, at + 0.42 + i * 0.28); }
    tl.to(a, { rotation: s * 6, duration: 0.3, ease: "power2.inOut" }, at + 1.2);
    return at + 1.5;
  };

  /* introduce a tool: hop in, wave, name appears via onTool(tl, t) callback */
  B.introduce = function (tl, at, o) {
    const P = this.P; let t = at;
    this.place(tl, t, o.fromX, o.y, o.scale);
    this.mouth(tl, t, "smile");
    const n = o.hops || 2, dx = (o.toX - o.fromX) / n;
    for (let i = 0; i < n; i++) { tl.to(P.wrap, { x: o.fromX + dx * (i + 1), duration: 0.5, ease: "none" }, t + 0.1); t = this.hop(tl, t, 70, 0.4) - 0.2; }
    t = this.wave(tl, t, "R");
    if (o.onTool) o.onTool(tl, t - 1.0);
    return t;
  };

  B.walk = function (tl, at, dur, toX, o) {
    o = o || {}; const P = this.P, steps = o.steps || Math.max(2, Math.round(dur / 0.34)), sd = dur / steps;
    const dir = toX >= (o.fromX == null ? 0 : o.fromX) ? 1 : -1;
    tl.to(P.wrap, { x: toX, duration: dur, ease: "sine.inOut" }, at);
    for (let i = 0; i < steps; i++) {
      const t = at + i * sd, a = i % 2 === 0 ? 1 : -1;
      tl.to(P.legL, { rotation: 24 * a, duration: sd, ease: "sine.inOut" }, t); tl.to(P.legR, { rotation: -24 * a, duration: sd, ease: "sine.inOut" }, t);
      tl.to(P.armL, { rotation: 6 - 20 * a, duration: sd, ease: "sine.inOut" }, t + 0.03); tl.to(P.armR, { rotation: -6 - 20 * a, duration: sd, ease: "sine.inOut" }, t);
      tl.to(P.bob, { y: -7, duration: sd / 2, ease: "sine.out" }, t); tl.to(P.bob, { y: 0, duration: sd / 2, ease: "sine.in" }, t + sd / 2);
      tl.to(P.head, { rotation: 2.5 * a * dir, duration: sd, ease: "sine.inOut" }, t + 0.05);
    }
    tl.to([P.legL, P.legR], { rotation: 0, duration: 0.2, ease: "power2.out" }, at + dur);
    tl.to(P.head, { rotation: 0, duration: 0.2 }, at + dur);
    tl.to(P.armL, { rotation: 6, duration: 0.2 }, at + dur); tl.to(P.armR, { rotation: -6, duration: 0.2 }, at + dur);
    return at + dur + 0.2;
  };

  /* point at a stage-space target. o = {x,y (wrapper top-left), scale, target:[tx,ty], hand:'R'|'L', hold} */
  B.aimPoint = function (tl, at, o) {
    const P = this.P, k = P.k * (o.scale || 1), hand = o.hand || "R", arm = hand === "L" ? P.armL : P.armR;
    const sx = hand === "L" ? 61 : 139, shoulder = [o.x + (sx - 100) * k + 100 * k, o.y + (162 - 280) * k + 280 * k];
    let dx = o.target[0] - shoulder[0], dy = o.target[1] - shoulder[1];
    if (this.facing === -1) dx = -dx;
    let theta = Math.atan2(-dx, dy) * 180 / Math.PI;                 // clockwise degrees, 0 = hanging down
    theta = Math.max(-150, Math.min(150, theta));                    // never straight up: the arm would hide behind the head
    const hold = o.hold == null ? 0.9 : o.hold, side = dx >= 0 ? 1 : -1;
    this.look(tl, at, Math.max(-5, Math.min(5, dx / 120)), Math.max(-3, Math.min(3, dy / 160)), 0.14);
    tl.to(P.head, { rotation: 7 * side * this.facing, duration: 0.2, ease: "power2.out" }, at);
    tl.to(arm, { rotation: (hand === "L" ? 1 : -1) * 14 + (hand === "L" ? -1 : 1) * 0, duration: 0.14, ease: "power2.out" }, at);          // anticipation: tiny pull back
    tl.to(arm, { rotation: theta, duration: 0.3, ease: "back.out(2.2)" }, at + 0.14);
    tl.to(arm, { rotation: theta + (theta >= 0 ? 4 : -4), duration: 0.18, ease: "sine.inOut" }, at + 0.14 + 0.3 + hold * 0.5);   // small settle
    const end = at + 0.44 + hold;
    tl.to(arm, { rotation: hand === "L" ? 6 : -6, duration: 0.3, ease: "power2.inOut" }, end);
    tl.to(P.head, { rotation: 0, duration: 0.25 }, end); this.look(tl, end, 0, 0, 0.2);
    return end + 0.3;
  };

  B.react = function (tl, at, mood) {
    const P = this.P; let t = at;
    if (mood === "wow") {
      tl.to(P.wrap, { y: "-=28", scaleY: 1.1, scaleX: 0.95, duration: 0.14, ease: "power2.out" }, t);
      tl.to(P.wrap, { y: "+=28", scaleY: 1, scaleX: 1, duration: 0.26, ease: "back.out(2)" }, t + 0.14);
      tl.to([P.eyeL, P.eyeR], { scaleX: 1.25, scaleY: 1.3, duration: 0.12, ease: "back.out(3)" }, t);
      this.mouth(tl, t, "open");
      tl.to(P.antenna, { rotation: 14, duration: 0.1, ease: "power2.out" }, t); tl.to(P.antenna, { rotation: 0, duration: 0.5, ease: "elastic.out(1,.35)" }, t + 0.1);
      tl.to(P.bulb, { scale: 1.5, svgOrigin: "100 11", duration: 0.14, yoyo: true, repeat: 1 }, t);
      tl.to(P.head, { rotation: -6, duration: 0.14 }, t); tl.to(P.head, { rotation: 0, duration: 0.3, ease: "power2.out" }, t + 0.8);
      return this.reset(tl, t + 0.9);
    }
    if (mood === "think") {
      tl.to(P.head, { rotation: 8, duration: 0.25, ease: "power2.out" }, t);
      tl.to([P.browL, P.browR], { opacity: 1, duration: 0.1 }, t); tl.to(P.browL, { rotation: -10, svgOrigin: "78 69", duration: 0.2 }, t);
      this.mouth(tl, t, "flat"); this.look(tl, t, 3, -3, 0.2);
      tl.to(P.armR, { rotation: -150, duration: 0.35, ease: "back.out(1.5)" }, t + 0.1);
      return this.reset(tl, t + 1.1, 0.3);
    }
    if (mood === "worried") {
      this.mouth(tl, t, "worry"); tl.to(P.sweat, { opacity: 1, y: 14, duration: 0.5, ease: "power1.in" }, t); tl.to(P.bang, { opacity: 1, duration: 0.08 }, t);
      tl.to([P.eyeL, P.eyeR], { scaleX: 1.2, scaleY: 1.2, duration: 0.1 }, t);
      tl.to(P.armL, { rotation: 150, duration: 0.2, ease: "back.out(2)" }, t); tl.to(P.armR, { rotation: -150, duration: 0.2, ease: "back.out(2)" }, t + 0.05);
      for (let i = 0; i < 4; i++) tl.to(P.wrap, { x: i % 2 ? "-=7" : "+=7", duration: 0.06 }, t + 0.2 + i * 0.06);
      return this.reset(tl, t + 1.2, 0.3);
    }
    if (mood === "celebrate") {
      this.eyesMode(tl, t, "happy"); this.mouth(tl, t, "big");
      tl.to(P.armL, { rotation: 155, duration: 0.2, ease: "back.out(2)" }, t); tl.to(P.armR, { rotation: -150, duration: 0.2, ease: "back.out(2)" }, t + 0.06);
      tl.to(P.chestGlow, { opacity: 0.9, scale: 1.4, svgOrigin: "100 184", duration: 0.2, yoyo: true, repeat: 3 }, t);
      t = this.hop(tl, t + 0.05, 60, 0.36); t = this.hop(tl, t - 0.1, 44, 0.3);
      return this.reset(tl, t + 0.1, 0.3);
    }
    return at;
  };

  /* Signature outro: walk to centre, face the viewer, wave, glow. Returns end time. */
  B.outro = function (tl, at, o) {
    const P = this.P; let t = at;
    t = this.face(tl, t, 1, 0.15);
    if (o.fromX != null) { this.place(tl, t, o.fromX, o.y, o.scale); t = this.walk(tl, t, o.walkDur || 0.9, o.cx, { fromX: o.fromX }); }
    this.eyesMode(tl, t, "happy"); this.mouth(tl, t, "big");
    if (o.halo) { tl.fromTo(o.halo, { opacity: 0, scale: 0.6 }, { opacity: 0.85, scale: 1, duration: 0.5, ease: "power2.out" }, t); }
    tl.to(P.chestGlow, { opacity: 0.95, scale: 1.5, svgOrigin: "100 184", duration: 0.35, yoyo: true, repeat: 3 }, t);
    t = this.wave(tl, t, "R");
    return t;
  };

  window.Robot = { create };
})();
