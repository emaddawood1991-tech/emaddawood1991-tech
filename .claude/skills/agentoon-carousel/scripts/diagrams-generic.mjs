// JSON-driven illustration kit. Use in carousel.json as  "diagram": { "type": "flow", ... }
// All SVGs are 936px wide (1:1 with the slide) and use ≥ 28px text. Use "|" in a label for a line break.
import { genericDiagrams as G, T, line, arrowhead, MUTED, ACC, ONA, esc } from "./lib.mjs";

const lines = (s) => String(s).split("|");
const TL = (cx, y, txt, o = {}, lh = 34) => lines(txt).map((l, i) => T(cx, y + i * lh, l, { a: "middle", ...o })).join("");
const cap = (d, y, w = 468) => (d.caption ? T(w, y, d.caption, { c: MUTED, a: "middle" }) : "");
const rect = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 22}" fill="${o.fill || "var(--card)"}" stroke="${o.stroke || "var(--line)"}" stroke-width="${o.sw || 2}" ${o.dash ? 'stroke-dasharray="10 9"' : ""}/>`;
const ico = (name, x, y, size, color = "var(--fg)") => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-${name}"/></svg>`;

/** flow: nodes[{label, sub?}] (2–4) left→right, last node highlighted. */
G.flow = (d) => {
  const n = d.nodes.length, gap = 64, w = (936 - gap * (n - 1)) / n, h = d.h || 250, H = (d.caption ? h + 120 : h + 40);
  return `<svg viewBox="0 0 936 ${H}" width="936" height="${H}">${arrowhead}
    ${d.nodes.map((nd, i) => {
      const x = i * (w + gap), hot = i === n - 1 && d.hot !== false;
      const l = lines(nd.label), y0 = 20 + (h - l.length * 40 - (nd.sub ? 40 : 0)) / 2 + 30;
      return `${rect(x, 20, w, h, { fill: hot ? "var(--accent)" : "var(--card)" })}
        ${nd.icon ? ico(nd.icon, x + w / 2 - 22, 36, 44, hot ? ONA : ACC) : ""}
        ${TL(x + w / 2, nd.icon ? y0 + 36 : y0, nd.label, { f: "sans", w: 700, s: 32, c: hot ? ONA : "var(--fg)" }, 40)}
        ${nd.sub ? T(x + w / 2, y0 + l.length * 40 + (nd.icon ? 40 : 6), nd.sub, { a: "middle", c: hot ? ONA : MUTED }) : ""}
        ${i < n - 1 ? line(x + w + 8, 20 + h / 2, x + w + gap - 8, 20 + h / 2) : ""}`;
    }).join("")}
    ${cap(d, h + 88)}</svg>`;
};

/** fanout: source, targets[] (2–5), result — one thing splits into many checks and merges. */
G.fanout = (d) => {
  const t = d.targets, lh = 80, gp = 16, total = t.length * lh + (t.length - 1) * gp, H = Math.max(total, 140) + 100 + (d.caption ? 50 : 0), top = 54, cy = top + total / 2;
  return `<svg viewBox="0 0 936 ${H}" width="936" height="${H}">${arrowhead}
    ${rect(0, cy - 70, 180, 140)}${TL(90, cy - 6, d.source, { f: "sans", w: 700, s: 30 }, 36)}
    ${t.map((x, i) => { const y = top + i * (lh + gp); return `${line(190, cy, 284, y + lh / 2, { w: 3 })}
      ${rect(290, y, 452, lh, { rx: lh / 2 })}<circle cx="328" cy="${y + lh / 2}" r="17" fill="var(--accent)"/>${T(328, y + lh / 2 + 10, String(i + 1), { c: ONA, a: "middle", w: 700 })}
      ${T(362, y + lh / 2 + 10, x, { f: "sans", w: 600 })}${line(748, y + lh / 2, 780, cy, { w: 3, head: false })}`; }).join("")}
    ${line(780, cy, 802, cy)}
    <rect x="808" y="${cy - 66}" width="128" height="132" rx="22" fill="var(--accent)"/>${TL(872, cy - 6, d.result, { f: "sans", w: 700, c: ONA, s: 30 }, 36)}
    ${T(468, H - 14, d.caption || "", { c: MUTED, a: "middle" })}</svg>`;
};

/** ladder: steps[] (3–6) ascending bars, last highlighted. Great for levels, tiers, maturity. */
G.ladder = (d) => {
  const n = d.steps.length, gap = 20, w = (936 - gap * (n - 1)) / n, H = 440;
  return `<svg viewBox="0 0 936 ${H}" width="936" height="${H}">
    ${d.steps.map((s, i) => { const h = 80 + i * ((310 - 80) / Math.max(n - 1, 1)), x = i * (w + gap), y = 350 - h, hot = i === n - 1 && d.hot !== false;
      return `${rect(x, y, w, h, { fill: hot ? "var(--accent)" : "var(--card)", rx: 18 })}${T(x + w / 2, 394, s, { a: "middle", w: 700 })}`; }).join("")}
    ${T(0, 28, d.title || "", { c: MUTED })}${cap(d, 434)}</svg>`;
};

/** cycle: nodes[] (3–5) on an ellipse with arrows, optional centre label. */
G.cycle = (d) => {
  const n = d.nodes.length, cx = 468, cy = 220, rx = 290, ry = 150, H = 450 + (d.caption ? 40 : 0);
  const ang = (i) => (-90 + (360 / n) * i) * Math.PI / 180, pt = (a, k = 1) => [cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)];
  const arcs = d.nodes.map((_, i) => { const a1 = ang(i) + 0.42, a2 = ang(i + 1) - 0.42, [x1, y1] = pt(a1), [x2, y2] = pt(a2); return `<path d="M${x1} ${y1} A${rx} ${ry} 0 0 1 ${x2} ${y2}" fill="none" stroke="var(--accent-t)" stroke-width="5" stroke-linecap="round" marker-end="url(#ah)"/>`; }).join("");
  return `<svg viewBox="0 0 936 ${H}" width="936" height="${H}">${arrowhead}${arcs}
    ${d.center ? TL(cx, cy - 4, d.center, { f: "serif", w: 800, s: 44, c: ACC }, 48) : ""}
    ${d.nodes.map((nd, i) => { const [x, y] = pt(ang(i)), w = Math.max(190, lines(nd)[0].length * 17 + 40);
      return `${rect(x - w / 2, y - 34, w, 68, { rx: 34, fill: i === 0 ? "var(--accent)" : "var(--card)" })}${T(x, y + 10, lines(nd)[0], { a: "middle", w: 700, f: "sans", c: i === 0 ? ONA : "var(--fg)" })}`; }).join("")}
    ${cap(d, H - 12)}</svg>`;
};

/** timeline: milestones[{t?, label}] (3–5) along a line; labels alternate above/below. */
G.timeline = (d) => {
  const m = d.milestones, n = m.length, sp = 936 / n, H = 440 + (d.caption ? 40 : 0);
  return `<svg viewBox="0 0 936 ${H}" width="936" height="${H}">
    <path d="M0 220 H936" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/>
    <path d="M0 220 H${sp * (n - 0.5)}" stroke="var(--accent-t)" stroke-width="6" stroke-linecap="round"/>
    ${m.map((s, i) => { const x = sp * (i + 0.5), up = i % 2 === 0, hot = i === n - 1;
      return `<circle cx="${x}" cy="220" r="26" fill="${hot ? "var(--accent)" : "var(--bg)"}" stroke="var(--accent-t)" stroke-width="6"/>
      ${up ? `${s.t ? T(x, 90, s.t, { a: "middle", c: ACC, w: 700 }) : ""}${TL(x, s.t ? 134 : 100, s.label, { f: "sans", w: 600 })}` : `${s.t ? T(x, 300, s.t, { a: "middle", c: ACC, w: 700 }) : ""}${TL(x, s.t ? 342 : 306, s.label, { f: "sans", w: 600 })}`}`; }).join("")}
    ${cap(d, H - 10)}</svg>`;
};

/** stack: layers[] bottom→top, one highlighted with "hot": index. Architecture, layers, context. */
G.stack = (d) => {
  const n = d.layers.length, lh = 96, gp = 14, H = n * (lh + gp) + 20 + (d.caption ? 40 : 0);
  return `<svg viewBox="0 0 936 ${H}" width="936" height="${H}">
    ${d.layers.map((l, i) => { const y = 10 + (n - 1 - i) * (lh + gp), inset = (n - 1 - i) * 36, hot = i === (d.hot ?? n - 1);
      return `${rect(inset, y, 936 - inset * 2, lh, { rx: 20, fill: hot ? "var(--accent)" : "var(--card)" })}${T(468, y + lh / 2 + 11, l, { a: "middle", f: "sans", w: 700, s: 34, c: hot ? ONA : "var(--fg)" })}`; }).join("")}
    ${cap(d, H - 8)}</svg>`;
};

/** grid: tiles[{icon?, label}] with cols 2 or 3. */
G.grid = (d) => {
  const cols = d.cols || 3, n = d.tiles.length, rows = Math.ceil(n / cols), gap = 20, w = (936 - gap * (cols - 1)) / cols, h = d.h || 240, H = rows * (h + gap) + (d.caption ? 50 : 0);
  return `<svg viewBox="0 0 936 ${H}" width="936" height="${H}">
    ${d.tiles.map((t, i) => { const x = (i % cols) * (w + gap), y = Math.floor(i / cols) * (h + gap);
      return `${rect(x, y, w, h)}${t.icon ? ico(t.icon, x + w / 2 - 30, y + 30, 60, ACC) : ""}${TL(x + w / 2, y + (t.icon ? 132 : 100), t.label, { f: "sans", w: 700, s: 32 }, 38)}`; }).join("")}
    ${cap(d, H - 8)}</svg>`;
};

/** bars: items[{label, value 0–100, display?}] — only use numbers you can source. */
G.bars = (d) => {
  const n = d.items.length, rh = 124, H = n * rh + (d.caption ? 50 : 0);
  return `<svg viewBox="0 0 936 ${H}" width="936" height="${H}">
    ${d.items.map((it, i) => { const y = i * rh, bw = Math.max(40, (936 - 180) * (it.value / 100)), hot = it.hot ?? i === 0;
      return `${T(0, y + 34, it.label, { f: "sans", w: 700, s: 32 })}${rect(0, y + 52, bw, 52, { rx: 26, fill: hot ? "var(--accent)" : "var(--card)" })}${T(bw + 16, y + 90, it.display || String(it.value), { c: hot ? ACC : MUTED, w: 700 })}`; }).join("")}
    ${cap(d, H - 8)}</svg>`;
};

/** versus: left{label,items[]} vs right{label,items[]} as a compact diagram. */
G.versus = (d) => {
  const col = (c, x, hot) => `${rect(x, 20, 420, 72, { rx: 36, fill: hot ? "var(--accent)" : "var(--card)" })}${T(x + 210, 66, c.label, { a: "middle", w: 700, c: hot ? ONA : "var(--fg)" })}
    ${c.items.map((it, i) => `${rect(x, 112 + i * 108, 420, 92, { rx: 22 })}${T(x + 24, 168 + i * 108, it, { f: "sans", w: 600, s: 32 })}`).join("")}`;
  const H = 112 + Math.max(d.left.items.length, d.right.items.length) * 108 + 10;
  return `<svg viewBox="0 0 936 ${H}" width="936" height="${H}">${col(d.left, 0, false)}${col(d.right, 516, true)}
    <circle cx="468" cy="56" r="32" fill="var(--fg)"/>${T(468, 67, "vs", { a: "middle", c: "var(--bg)", w: 700 })}</svg>`;
};
