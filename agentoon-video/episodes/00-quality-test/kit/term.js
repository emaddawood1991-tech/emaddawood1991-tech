/* Terminal/code card with typed reveal. Real output only: pass lines captured from the real tool.
     Term.card(host, {id,x,y,w,title,lines:[{t:"claude mcp add ...", c:"prompt|cmt|hl|url|"}], font})
     Term.type(tl, card, at, cps)  reveals lines in order at `cps` characters per second (stepped, monospace-exact)
   Reveal uses clip-path with steps(): seekable, no JS timers. Returns {end, lineTimes[]}. */
(function () {
  function card(host, o) {
    const c = document.createElement("div"); c.className = "term"; c.id = o.id;
    c.style.cssText = "left:" + o.x + "px;top:" + o.y + "px;width:" + o.w + "px";
    const bar = document.createElement("div"); bar.className = "bar";
    ["#FF5F57", "#FEBC2E", "#28C840"].forEach(col => { const i = document.createElement("i"); i.style.background = col; bar.appendChild(i); });
    const title = document.createElement("b"); title.textContent = o.title || ""; bar.appendChild(title); c.appendChild(bar);
    const body = document.createElement("div"); body.className = "body"; if (o.font) body.style.fontSize = o.font + "px";
    o.lines.forEach((l, i) => {
      const d = document.createElement("div"); d.className = "ln " + (l.c || ""); d.id = o.id + "-l" + i;
      d.textContent = l.t || " "; d.dataset.chars = (l.t || "").length; body.appendChild(d);
    });
    c.appendChild(body); host.appendChild(c); return c;
  }

  function type(tl, c, at, cps) {
    let t = at; const times = [];
    c.querySelectorAll(".ln").forEach(d => {
      const n = +d.dataset.chars; times.push(t);
      if (!n) { return; }
      const dur = Math.max(0.12, n / cps);
      tl.fromTo(d, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: dur, ease: "steps(" + n + ")" }, t);
      t += dur + 0.08;
    });
    return { end: t, lineTimes: times };
  }
  window.Term = { card, type };
})();
