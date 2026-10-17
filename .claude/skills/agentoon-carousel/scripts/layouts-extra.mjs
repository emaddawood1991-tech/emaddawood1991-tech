// Extra layouts for topic variety. Registered into `layouts` on import. Same type scale, badges, footer, grid.
import { layouts, shell, codeBlock, renderDiagram, esc, fmt, icon, mascot } from "./lib.mjs";

const head = (s, { mood, maxW = 780 } = {}) => `
  ${mood ? mascot(112, mood, "position:absolute;right:64px;top:50px") : ""}
  <div class="kicker"><span class="bar"></span>${esc(s.kicker || "")}</div>
  ${s.badge ? `<div style="margin-top:20px"><span class="badge hot">${esc(s.badge)}</span></div>` : ""}
  <h2 class="h2" style="margin-top:${s.badge ? 18 : 26}px;font-size:${s.titleSize || 76}px;max-width:${maxW}px">${fmt(s.title)}</h2>`;

Object.assign(layouts, {
  /** Numbered steps (3–4). steps[{title,text,code?}] */
  steps(s, ctx) {
    return shell(ctx, s, `${head(s, { mood: s.mood })}
      <div class="stack" style="margin-top:30px;gap:16px;position:relative">
        ${s.steps.map((st, i) => `<div class="card row" style="gap:24px;padding:22px 26px;border-radius:24px;align-items:flex-start">
          <div style="flex:none;width:68px;height:68px;border-radius:50%;background:var(--accent);color:var(--on-accent);font:800 40px/68px var(--serif);text-align:center">${i + 1}</div>
          <div class="stack" style="gap:6px;min-width:0;flex:1"><div style="font:700 36px/1.15 var(--sans)">${fmt(st.title)}</div>
          ${st.text ? `<div style="font:500 32px/1.3 var(--sans);color:var(--muted)">${fmt(st.text)}</div>` : ""}
          ${st.code ? `<div class="code" style="margin-top:8px;padding:12px 20px;border-radius:14px;font-size:32px">${st.code.map((c) => esc(c).replace(/\{\{([cfksmp]):(.*?)\}\}/g, '<span class="$1">$2</span>')).join("\n")}</div>` : ""}</div></div>`).join("")}
      </div>
      <div class="grow"></div>
      ${s.watch ? `<div class="watch"><span class="tag">${esc(s.tag || "Tip")}</span><span>${fmt(s.watch)}</span></div>` : ""}`);
  },

  /** Two columns: left = before/don't, right = after/do. left/right {label, items[]}; verdict banner. */
  compare(s, ctx) {
    const col = (c, good) => `<div class="card stack" style="flex:1;gap:18px;padding:30px 26px;border-radius:26px;min-width:0;${good ? "border:3px solid var(--accent);background:var(--card-2);" : ""}">
        <span class="badge ${good ? "hot" : "ghost"}">${icon(good ? "check" : "x")} ${esc(c.label)}</span>
        ${c.items.map((it) => `<div style="font:600 34px/1.3 var(--sans);${good ? "" : "color:var(--muted)"}">${fmt(it)}</div>`).join("")}</div>`;
    return shell(ctx, s, `${head(s, { mood: s.mood })}
      <div class="row gap16" style="margin-top:34px;align-items:stretch">${col(s.left, false)}${col(s.right, true)}</div>
      ${s.watch ? `<div class="watch" style="margin-top:22px"><span class="tag">${esc(s.tag || "Same")}</span><span>${fmt(s.watch)}</span></div>` : ""}
      <div class="grow"></div>
      ${s.verdict ? `<div class="banner">${fmt(s.verdict)}</div>` : ""}`);
  },

  /** Big code with numbered annotations. code[], notes[{t}] */
  codefocus(s, ctx) {
    return shell(ctx, s, `${head(s, { mood: s.mood })}
      ${s.text ? `<p class="body" style="margin-top:14px;color:var(--muted)">${fmt(s.text)}</p>` : ""}
      ${codeBlock(s.code, { style: `margin-top:26px;font-size:${s.codeSize || 34}px;line-height:1.5;padding:28px 34px` })}
      <div class="stack" style="margin-top:22px;gap:12px">${(s.notes || []).map((n, i) => `<div class="row center gap16"><span style="flex:none;width:50px;height:50px;border-radius:50%;background:var(--accent);color:var(--on-accent);font:800 30px/50px var(--serif);text-align:center">${i + 1}</span><span style="font:600 32px/1.25 var(--sans)">${fmt(n)}</span></div>`).join("")}</div>
      <div class="grow"></div>
      ${s.watch ? `<div class="watch"><span class="tag">${esc(s.tag || "Watch out")}</span><span>${fmt(s.watch)}</span></div>` : ""}`);
  },

  /** Full-slide illustration. diagram: name | {type,…} ; points[] (2–3 short lines) */
  diagram(s, ctx) {
    return shell(ctx, s, `${head(s, { mood: s.mood })}
      ${s.text ? `<p class="body" style="margin-top:14px;color:var(--muted)">${fmt(s.text)}</p>` : ""}
      <div class="grow stack" style="justify-content:center;min-height:0;margin:20px 0">${renderDiagram(s.diagram)}</div>
      ${(s.points || []).length ? `<div class="stack" style="gap:10px">${s.points.map((p) => `<div class="row gap16" style="align-items:flex-start;font:600 32px/1.3 var(--sans)"><span style="flex:none;margin-top:14px;width:14px;height:14px;border-radius:50%;background:var(--accent)"></span><span>${fmt(p)}</span></div>`).join("")}</div>` : ""}
      ${s.watch ? `<div class="watch" style="margin-top:20px"><span class="tag">${esc(s.tag || "Watch out")}</span><span>${fmt(s.watch)}</span></div>` : ""}`);
  },

  /** Checklist / mistakes / bonus tips. items[{t,d?,ok?}] (ok:false → ✗) */
  checklist(s, ctx) {
    return shell(ctx, s, `${head(s, { mood: s.mood })}
      <div class="stack" style="margin-top:30px;gap:14px">
        ${s.items.map((it) => { const ok = it.ok !== false; return `<div class="card row" style="gap:24px;padding:28px 28px;border-radius:24px;align-items:center">
          <span style="flex:none;width:64px;height:64px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:34px;background:${ok ? "var(--accent)" : "var(--ink)"};color:${ok ? "var(--on-accent)" : "#F4F1EA"}">${icon(ok ? "check" : "x")}</span>
          <div class="stack" style="gap:4px;min-width:0"><div style="font:700 36px/1.2 var(--sans)">${fmt(it.t)}</div>${it.d ? `<div style="font:500 32px/1.3 var(--sans);color:var(--muted)">${fmt(it.d)}</div>` : ""}</div></div>`; }).join("")}
      </div>
      <div class="grow"></div>
      ${s.note ? `<div class="banner">${fmt(s.note)}</div>` : ""}`);
  },

  /** Big-claim slide (problem / myth / hook alternative). Optional chips, swipe/save pills, big mascot. */
  statement(s, ctx) {
    return shell(ctx, s, `
      <div class="kicker"><span class="bar"></span>${esc(s.kicker || "")}</div>
      <h1 class="h1" style="margin-top:40px;font-size:${s.titleSize || 128}px;max-width:900px">${fmt(s.title)}</h1>
      ${s.sub ? `<p class="lede" style="margin-top:34px;max-width:640px;color:var(--muted)">${fmt(s.sub)}</p>` : ""}
      <div class="grow"></div>
      <div class="row between" style="align-items:flex-end;gap:20px">
        <div class="stack gap16" style="padding-bottom:10px">
          ${(s.chips || []).length ? `<div class="row gap16" style="flex-wrap:wrap;max-width:560px">${s.chips.map((c) => `<span class="pill" style="font-size:30px;padding:16px 24px">${esc(c)}</span>`).join("")}</div>` : ""}
          ${s.swipe ? `<div class="row gap16 center" style="flex-wrap:wrap"><span class="pill solid" style="font-size:34px;padding:18px 32px">${esc(s.swipe)} ${icon("arrow")}</span>${s.save ? `<span class="pill" style="font-size:30px;padding:18px 26px">${icon("bookmark")} ${esc(s.save)}</span>` : ""}</div>` : ""}
        </div>
        ${mascot(s.mascotSize || 330, s.mood || "wow", "flex:none")}
      </div>`);
  },

  /** One giant, sourced number. value, label, text, source */
  stat(s, ctx) {
    return shell(ctx, s, `${head(s, { mood: s.mood })}
      <div style="margin-top:34px;font:italic 800 300px/0.95 var(--serif);color:var(--accent-t);letter-spacing:-.04em">${esc(s.value)}</div>
      <div style="margin-top:10px;font:800 56px/1.1 var(--serif)">${fmt(s.label)}</div>
      <p class="body" style="margin-top:20px;color:var(--muted)">${fmt(s.text || "")}</p>
      <div class="grow"></div>
      <div class="src">${esc(s.source || "")}</div>`);
  },
});
