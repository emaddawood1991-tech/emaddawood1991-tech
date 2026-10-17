// Shared helpers + layout renderers for the Agentoon carousel generator.
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Inline markup: *italic accent*  `mono`  — HTML-escaped first. */
export const fmt = (s = "") =>
  esc(s).replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, '<code class="mono">$1</code>');

/** Code markup: {{c:/cmd}} {{f:--flag}} {{k:path}} {{s:"str"}} {{m:# comment}} {{p:>}} */
export const code = (s = "") => esc(s).replace(/\{\{([cfksmp]):(.*?)\}\}/g, '<span class="$1">$2</span>');

export const icon = (n, extra = "") => `<svg class="ic" ${extra}><use href="#i-${n}"/></svg>`;
/** mood: happy wow think wink focus cheer dizzy oops proud */
export const mascot = (w = 200, mood = "happy", style = "") =>
  `<svg class="mascot" viewBox="0 0 200 230" width="${w}" height="${Math.round((w * 230) / 200)}" style="${style}" data-decor data-mascot><use href="#mascot-${mood}"/></svg>`;

const pad2 = (n) => String(n).padStart(2, "0");

export function footer(ctx) {
  return `<div class="footer">
    <div class="brand">${mascot(38)}<span>agentoon<b>.ai</b></span></div>
    <div class="pg"><i>${pad2(ctx.index)}</i> / ${pad2(ctx.total)}</div>
    <div>${esc(ctx.handle)}</div>
  </div>`;
}

export const shell = (ctx, s, inner) =>
  `<section class="slide ${s.theme || "dark"}" id="slide-${pad2(ctx.index)}" data-slide="${ctx.index}">${inner}${footer(ctx)}</section>`;

export const codeBlock = (lines, { dots = true, style = "" } = {}) =>
  `<div class="code" style="${style}">${dots ? '<div class="dots"><i></i><i></i><i></i></div>' : ""}${lines.map(code).join("\n")}</div>`;

/* ------------------------------------------------------------------ diagrams */
// Each diagram is a 936-wide SVG (1:1 scale) so text sizes are real pixel sizes. Minimum SVG text: 28px.
export const T = (x, y, txt, o = {}) =>
  `<text x="${x}" y="${y}" font-family="var(--${o.f || "mono"})" font-size="${o.s || 28}" font-weight="${o.w || 600}" fill="${o.c || "var(--fg)"}" text-anchor="${o.a || "start"}">${esc(String(txt).replace(/`/g, ""))}</text>`;
export const arrowhead = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 9 5 1 9" fill="none" stroke="var(--accent-t)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;
export const line = (x1, y1, x2, y2, o = {}) =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${o.c || "var(--accent-t)"}" stroke-width="${o.w || 4}" stroke-linecap="round" fill="none" ${o.head === false ? "" : 'marker-end="url(#ah)"'}/>`;
export const MUTED = "var(--muted)", ACC = "var(--accent-t)", ONA = "var(--on-accent)";
/** Generic, JSON-driven diagram types register here (see diagrams-generic.mjs): {type:"flow"|"fanout"|…, …} */
export const genericDiagrams = {};
export const renderDiagram = (d) => {
  if (typeof d === "function") return d();
  if (typeof d === "string") { if (!diagrams[d]) throw new Error(`Unknown diagram "${d}"`); return diagrams[d](); }
  if (!genericDiagrams[d.type]) throw new Error(`Unknown diagram type "${d.type}"`);
  return genericDiagrams[d.type](d);
};

export const diagrams = {
  simplify: () => {
    const lanes = ["Reuse existing helpers", "Simplification", "Efficiency", "Right abstraction level"];
    const ys = [48, 124, 200, 276];
    return `<svg viewBox="0 0 936 392" width="936" height="392">${arrowhead}
      ${T(0, 28, "YOUR CHANGED CODE", { c: MUTED })}
      <rect x="0" y="52" width="180" height="288" rx="22" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="22" y="${82 + i * 40}" width="${[124, 96, 136, 76, 112, 90][i]}" height="14" rx="7" fill="${i % 3 === 1 ? "var(--accent)" : "var(--line)"}"/>`).join("")}
      ${ys.map((y, i) => `${line(190, 196, 284, y + 32, { w: 3 })}
        <rect x="290" y="${y}" width="452" height="64" rx="32" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
        <circle cx="328" cy="${y + 32}" r="17" fill="var(--accent)"/>${T(328, y + 42, String(i + 1), { c: ONA, a: "middle", w: 700 })}
        ${T(362, y + 43, lanes[i], { f: "sans", w: 600 })}
        ${line(748, y + 32, 778, 196, { w: 3, head: false })}`).join("")}
      ${line(778, 196, 800, 196, { w: 4 })}
      <rect x="806" y="132" width="130" height="128" rx="22" fill="var(--accent)"/>
      <svg x="855" y="144" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${ONA}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>
      ${T(871, 210, "Fixes", { c: ONA, a: "middle", w: 700 })}${T(871, 244, "applied", { c: ONA, a: "middle", w: 700 })}
      ${T(468, 376, "4 review agents run in parallel", { c: MUTED, a: "middle" })}
    </svg>`;
  },

  review: () => {
    const lv = ["low", "medium", "high", "xhigh", "max"];
    const w = 120, gap = 24;
    return `<svg viewBox="0 0 936 404" width="936" height="404">
      ${lv.map((l, i) => {
        const h = 56 + i * 28, x = i * (w + gap), y = 300 - h;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
        ${T(x + w / 2, 340, l, { a: "middle", w: 700 })}`;
      }).join("")}
      <rect x="0" y="36" width="392" height="60" rx="30" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>${T(26, 76, "--fix  applies fixes", { c: ACC })}
      <rect x="0" y="108" width="424" height="60" rx="30" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>${T(26, 148, "--comment  posts on PR", { c: ACC })}
      <rect x="752" y="36" width="184" height="264" rx="22" fill="none" stroke="var(--accent-t)" stroke-width="3" stroke-dasharray="10 9"/>
      ${T(844, 96, "ultra", { s: 38, a: "middle", c: ACC, w: 700 })}${T(844, 142, "cloud", { a: "middle" })}${T(844, 176, "review", { a: "middle" })}
      <path d="M776 198 H912" stroke="var(--line)" stroke-width="2"/>
      ${T(844, 240, "claude.ai", { a: "middle", c: MUTED })}${T(844, 274, "login", { a: "middle", c: MUTED })}
      ${T(0, 394, "low: fewer false positives · medium–max: broader", { c: MUTED })}
    </svg>`;
  },

  batch: () => {
    const cell = (cx, cy, k) => `<rect x="${cx}" y="${cy}" width="96" height="84" rx="16" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
      <svg x="${cx + 30}" y="${cy + 12}" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-t)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-branch"/></svg>
      <rect x="${cx + 20}" y="${cy + 62}" width="56" height="7" rx="3.5" fill="${k ? "var(--accent)" : "var(--line)"}"/>`;
    const cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) cells.push(cell(522 + c * 106, 64 + r * 100, (r + c) % 2));
    return `<svg viewBox="0 0 936 392" width="936" height="392">${arrowhead}
      <rect x="0" y="128" width="160" height="120" rx="22" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
      ${T(80, 182, "1 task", { s: 32, a: "middle", w: 700 })}${T(80, 220, "in words", { a: "middle", c: MUTED })}
      ${line(168, 188, 214, 188)}
      <rect x="222" y="108" width="236" height="160" rx="22" fill="var(--accent)"/>
      ${T(340, 162, "Plan", { s: 44, f: "serif", w: 800, c: ONA, a: "middle" })}
      ${T(340, 206, "you approve", { c: ONA, a: "middle", w: 700 })}${T(340, 242, "first", { c: ONA, a: "middle", w: 700 })}
      ${line(466, 188, 512, 188)}
      ${cells.join("")}
      ${T(936, 40, "5 to 30 independent units", { c: MUTED, a: "end" })}
      ${T(468, 384, "one background agent + worktree per unit", { c: MUTED, a: "middle" })}
    </svg>`;
  },

  loop: () => `<svg viewBox="0 0 936 400" width="936" height="400">${arrowhead}
      <circle cx="170" cy="176" r="128" fill="none" stroke="var(--line)" stroke-width="3"/>
      <path d="M170 48 A128 128 0 0 1 298 176" stroke="var(--accent-t)" stroke-width="9" fill="none" stroke-linecap="round" marker-end="url(#ah)"/>
      <path d="M170 304 A128 128 0 0 1 42 176" stroke="var(--accent-t)" stroke-width="9" fill="none" stroke-linecap="round" marker-end="url(#ah)"/>
      ${T(170, 162, "every", { a: "middle", c: MUTED })}${T(170, 224, "5m", { s: 68, a: "middle", c: ACC, w: 700 })}
      ${[0, 1, 2].map((i) => {
        const x = 344 + i * 172;
        return `<rect x="${x}" y="50" width="150" height="252" rx="26" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
        ${T(x + 75, 102, `run ${i + 1}`, { a: "middle", c: MUTED })}
        <svg x="${x + 41}" y="128" width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="var(--fg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-refresh"/></svg>
        ${T(x + 75, 262, "wait", { s: 32, a: "middle", w: 700 })}`;
      }).join("")}
      ${T(890, 192, "…", { s: 56, a: "middle", c: ACC, w: 700 })}
      ${T(468, 372, "repeats until you stop it or 7 days pass", { c: MUTED, a: "middle" })}
    </svg>`,

  debug: () => `<svg viewBox="0 0 936 400" width="936" height="400">${arrowhead}
      ${T(0, 28, "SESSION TIMELINE", { c: MUTED })}
      <rect x="0" y="88" width="400" height="96" rx="48" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
      ${T(200, 148, "debug log: off", { s: 32, a: "middle", c: MUTED })}
      <rect x="400" y="88" width="536" height="96" rx="48" fill="var(--accent)"/>
      ${T(668, 148, "capturing from here →", { s: 32, a: "middle", c: ONA, w: 700 })}
      <path d="M400 60 V216" stroke="var(--fg)" stroke-width="4" stroke-dasharray="3 10" stroke-linecap="round"/>
      <rect x="272" y="224" width="256" height="76" rx="38" fill="var(--fg)"/>
      ${T(400, 274, "/debug", { s: 40, a: "middle", c: "var(--bg)", w: 700 })}
      ${T(0, 372, "Claude then reads the session debug log", { s: 32, f: "sans", w: 600 })}
    </svg>`,
};

/* ------------------------------------------------------------------- layouts */
export const layouts = {
  /* ---- 1 hook ---- */
  hook(s, ctx) {
    return shell(ctx, s, `
      <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
      <h1 class="h1" style="margin-top:34px;font-size:126px">${fmt(s.title)}</h1>
      <div class="row" style="margin-top:36px;gap:20px;align-items:flex-end">
        <div class="code" style="width:650px;flex:none;padding:26px 32px 30px;white-space:normal">
          <div class="dots"><i></i><i></i><i></i></div>
          <div style="font-size:36px;line-height:1.5"><span class="p">&gt;</span> <span class="c">/</span><span style="display:inline-block;width:18px;height:36px;background:#2FE3B2;vertical-align:-6px;margin-left:4px"></span></div>
          ${s.rows.map((r) => `<div style="font-size:36px;line-height:1.7;display:flex;gap:18px"><span class="c" style="width:272px;flex:none">${esc(r.cmd)}</span><span style="color:#B9C0DA;font-family:var(--sans);font-size:34px">${esc(r.verb)}</span></div>`).join("")}
        </div>
        <div style="position:relative;width:266px;height:400px;flex:none">
          <div class="pill ink" style="position:absolute;right:-6px;top:-34px;transform:rotate(3deg);font:700 30px/1.15 var(--sans);padding:18px 24px;border-radius:26px 26px 6px 26px;white-space:normal;width:250px;box-shadow:0 8px 0 var(--accent)">${esc(s.bubble)}</div>
          ${mascot(262, "wow", "position:absolute;left:2px;top:120px")}
        </div>
      </div>
      <div class="grow"></div>
      <div class="row gap16 center">
        <span class="pill solid" style="font-size:34px;padding:18px 32px">${esc(s.swipe)} ${icon("arrow")}</span>
        <span class="pill" style="font-size:30px;padding:18px 26px">${icon("bookmark")} ${esc(s.save)}</span>
      </div>`);
  },

  /* ---- 2 problem + what a skill is (and what it is not) ---- */
  concept(s, ctx) {
    return shell(ctx, s, `
      <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
      <h2 class="h2" style="margin-top:30px">${fmt(s.title)}</h2>
      <p class="lede" style="margin-top:26px;font-size:36px">${fmt(s.lede)}</p>
      <div class="label" style="margin-top:30px">${esc(s.label || "Know the difference: four kinds of slash command")}</div>
      <div class="stack" style="gap:14px;margin-top:16px">
        ${s.rows.map((r) => `<div class="card row" style="gap:22px;padding:20px 24px;border-radius:22px;align-items:center;${r.hot ? "background:var(--card-2);border:3px solid var(--accent);" : ""}">
          <div style="width:324px;flex:none;display:flex;flex-direction:column;gap:10px;align-items:flex-start"><span class="badge ${r.hot ? "hot" : r.ghost ? "ghost" : ""}">${esc(r.badge)}</span><span class="mono" style="font-size:30px;font-weight:700;color:var(--accent-t)">${esc(r.ex)}</span></div>
          <div style="font:500 32px/1.3 var(--sans)">${fmt(r.text)}</div></div>`).join("")}
      </div>`);
  },

  /* ---- 3–7 one skill per slide ---- */
  skill(s, ctx) {
    return shell(ctx, s, `
      ${mascot(112, s.mood || "happy", "position:absolute;right:64px;top:50px")}
      <div class="row center gap16" style="min-height:40px">
        <div class="kicker"><span class="bar"></span>Skill ${String(s.n).padStart(2, "0")} / 05</div>
      </div>
      <div class="row center gap16" style="margin-top:22px"><span class="badge hot">${esc(s.badge || "Bundled skill")}</span></div>
      <div class="mono" style="margin-top:16px;font-size:${s.cmdSize || 88}px;font-weight:700;letter-spacing:-.03em;color:var(--accent-t);line-height:1">${esc(s.cmd)}</div>
      <h2 class="h3" style="margin-top:18px;font-size:56px">${fmt(s.title)}</h2>
      <p class="body" style="margin-top:14px;color:var(--muted)">${fmt(s.text)}</p>
      <div class="grow stack" style="justify-content:${s.flip ? "flex-end" : "center"};min-height:0;margin:22px 0 20px">${renderDiagram(s.diagram)}</div>
      ${codeBlock(s.code, { dots: false, style: "padding:22px 30px" })}
      <div class="watch" style="margin-top:20px"><span class="tag">${esc(s.tag || "Watch out")}</span><span>${fmt(s.watch)}</span></div>`);
  },

  /* ---- 8 cheat sheet ---- */
  cheatsheet(s, ctx) {
    return shell(ctx, s, `
      ${mascot(112, "proud", "position:absolute;right:64px;top:50px")}
      <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
      <h2 class="h2" style="margin-top:26px">${fmt(s.title)}</h2>
      <div class="row center gap16" style="margin-top:24px"><span class="badge hot">${esc(s.badge)}</span><span style="font:600 30px/1.2 var(--sans)">${esc(s.badgeNote)}</span></div>
      <div class="stack" style="margin-top:24px;gap:12px">
        ${s.rows.map((r) => `<div class="card row" style="padding:20px 26px;gap:24px;border-radius:22px;align-items:center">
            <div class="mono" style="width:250px;flex:none;font-size:32px;font-weight:700;color:var(--accent-t)">${esc(r.cmd)}</div>
            <div class="stack" style="gap:4px;min-width:0">
              <div style="font:700 32px/1.2 var(--sans)">${fmt(r.use)}</div>
              <div style="font:500 30px/1.25 var(--sans);color:var(--muted)">${fmt(r.note)}</div>
            </div></div>`).join("")}
      </div>
      <div class="grow"></div>
      <div class="watch" style="padding:20px 26px;font-size:30px;flex-direction:column;gap:12px;align-items:flex-start"><span class="tag">${esc(s.legendTag)}</span><div class="stack" style="gap:4px">${s.legend.map((l) => `<div>${fmt(l)}</div>`).join("")}</div></div>`);
  },

  /* ---- 9 CTA (Follow is the hero) ---- */
  cta(s, ctx) {
    const mini = (ic, t, d) => `<div class="card stack" style="flex:1;gap:10px;padding:24px 26px;border-radius:24px">
        <div class="row center gap16"><span style="width:56px;height:56px;border-radius:16px;background:var(--ink);color:#F4F1EA;display:flex;align-items:center;justify-content:center;font-size:32px">${icon(ic)}</span><span style="font:800 42px/1 var(--serif)">${esc(t)}</span></div>
        <div style="font:500 32px/1.3 var(--sans);color:var(--muted)">${esc(d)}</div></div>`;
    return shell(ctx, s, `
      ${mascot(300, "cheer", "position:absolute;right:48px;top:96px")}
      <div class="kicker" style="color:var(--ink)"><span class="bar"></span>${esc(s.kicker)}</div>
      <h1 class="h1" style="margin-top:34px;font-size:108px">${s.titleLines.map(fmt).join("<br>")}</h1>
      <div class="stack" style="margin-top:38px;gap:22px;background:var(--ink);color:#F4F1EA;border-radius:34px;padding:40px 40px 42px;box-shadow:0 12px 0 rgba(12,16,32,.28)">
        <div class="row center gap16"><span class="label" style="font-size:28px;letter-spacing:.14em;color:#2FE3B2">${icon("follow")} ${esc(s.followLabel)}</span></div>
        <div style="font:800 96px/1 var(--serif);letter-spacing:-.01em;color:#FFFFFF">${esc(s.handle)}</div>
        <div style="font:500 34px/1.3 var(--sans);color:#C9CFE6">${esc(s.followSub)}</div>
        <div class="row center between" style="margin-top:6px"><span class="pill" style="background:#FF6A3D;color:#0C1020;border:none;font:800 46px/1 var(--sans);padding:26px 46px;font-family:var(--sans)">${icon("plus")} ${esc(s.followBtn)}</span></div>
      </div>
      <div class="row gap16" style="margin-top:22px">${s.actions.map((a) => mini(a.icon, a.t, a.d)).join("")}</div>
      <div class="grow"></div>
      <p style="font:700 44px/1.2 var(--sans)">${fmt(s.ask)}</p>`);
  },

  /* ---- escape hatch: write your own HTML inside the slide shell ---- */
  custom(s, ctx) {
    return shell(ctx, s, s.html);
  },
};
