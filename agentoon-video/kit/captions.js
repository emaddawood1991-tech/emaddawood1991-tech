/* Kinetic word-timed subtitles. Seekable GSAP, no randomness.
   Captions.build(tl, host, words, opts)
     words: [{ w: "Servers", s: 8.1, e: 8.5 }, ...]   (display text, seconds on the root timeline)
     opts:  { style: "tag"|"bar"|"plain"|"note", bottom: 400, active: "#FF6A3D", maxWords: 4, maxChars: 24 }
   Subtitles live in a band you position; keep that band clear of code/UI (the episode decides). */
(function () {
  function chunk(words, o) {
    const out = []; let cur = [];
    words.forEach((w, i) => {
      cur.push(w);
      const len = cur.map(x => x.w).join(" ").length, end = /[.!?]$/.test(w.w), soft = /[,;:]$/.test(w.w);
      if (end || (soft && cur.length >= 2) || cur.length >= o.maxWords || len >= o.maxChars || i === words.length - 1) { out.push(cur); cur = []; }
    });
    return out;
  }

  function build(tl, host, words, opts) {
    const o = Object.assign({ style: "tag", bottom: 400, active: "#FF6A3D", maxWords: 4, maxChars: 24, idPrefix: "cap" }, opts);
    const band = document.createElement("div");
    band.className = "cap-band cap-style-" + o.style; band.id = o.idPrefix + "-band";
    band.style.bottom = o.bottom + "px"; band.style.height = "0px";
    host.appendChild(band);
    const chunks = chunk(words, o);
    chunks.forEach((ws, ci) => {
      const c = document.createElement("div"); c.className = "cap-chunk"; c.id = o.idPrefix + "-c" + ci; band.appendChild(c);
      const spans = ws.map((w, wi) => { const s = document.createElement("span"); s.className = "cap-word"; s.id = o.idPrefix + "-c" + ci + "w" + wi; s.textContent = w.w; c.appendChild(s); return s; });
      const t0 = ws[0].s - 0.04, last = ws[ws.length - 1], nextS = chunks[ci + 1] ? chunks[ci + 1][0].s : null;
      const t1 = nextS != null ? Math.min(last.e + 0.18, nextS - 0.06) : last.e + 0.3;
      const idle = getComputedStyle(spans[0]).color;
      tl.fromTo(c, { opacity: 0, y: 26, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.16, ease: "back.out(2)" }, t0);
      spans.forEach((s, wi) => {
        const w = ws[wi];
        tl.fromTo(s, { color: idle, scale: 1 }, { color: o.active, scale: 1.08, duration: 0.09, ease: "power2.out" }, w.s);
        tl.to(s, { scale: 1, duration: 0.16, ease: "power2.out" }, w.s + 0.09);
        if (o.style === "bar") tl.to(s, { color: idle, duration: 0.1 }, Math.max(w.e, w.s + 0.12));
      });
      tl.to(c, { opacity: 0, y: -14, duration: 0.1, ease: "power1.in" }, t1 - 0.1);
    });
    return band;
  }
  window.Captions = { build };
})();
