// Shared helpers + layout renderers for the Agentoon carousel generator.
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Inline markup: *italic accent*  `mono`  — HTML-escaped first. */
export const fmt = (s = "") =>
  esc(s).replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, '<code class="mono">$1</code>');

/** Code markup: {{c:/cmd}} {{f:--flag}} {{k:path}} {{s:"str"}} {{m:# comment}} {{p:>}} */
export const code = (s = "") => esc(s).replace(/\{\{([cfksmp]):(.*?)\}\}/g, '<span class="$1">$2</span>');

export const icon = (n, extra = "") => `<svg class="ic" ${extra}><use href="#i-${n}"/></svg>`;
export const mascot = (w = 200, style = "") =>
  `<svg class="mascot" viewBox="0 0 200 230" width="${w}" height="${Math.round((w * 230) / 200)}" style="${style}" data-decor><use href="#mascot"/></svg>`;

const pad2 = (n) => String(n).padStart(2, "0");

export function footer(ctx) {
  return `<div class="footer">
    <div class="brand">${mascot(36)}<span>agentoon<b>.ai</b></span></div>
    <div class="pg"><i>${pad2(ctx.index)}</i> / ${pad2(ctx.total)}</div>
    <div>${esc(ctx.handle)}</div>
  </div>`;
}

const shell = (ctx, s, inner, extra = "") =>
  `<section class="slide ${s.theme || "dark"}" id="slide-${pad2(ctx.index)}" data-slide="${ctx.index}" ${extra}>${inner}${footer(ctx)}</section>`;

const codeBlock = (lines, { dots = true, style = "" } = {}) =>
  `<div class="code" style="${style}">${dots ? '<div class="dots"><i></i><i></i><i></i></div>' : ""}${lines.map(code).join("\n")}</div>`;

/* ------------------------------------------------------------------ diagrams */
// Each diagram is a 936-wide SVG (1:1 scale) so text sizes are real pixel sizes.
const T = (x, y, txt, o = {}) =>
  `<text x="${x}" y="${y}" font-family="var(--${o.f || "mono"})" font-size="${o.s || 28}" font-weight="${o.w || 600}" fill="${o.c || "var(--fg)"}" text-anchor="${o.a || "start"}">${esc(txt)}</text>`;
const arrowhead = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 9 5 1 9" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;
const line = (x1, y1, x2, y2, o = {}) =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${o.c || "var(--accent)"}" stroke-width="${o.w || 4}" stroke-linecap="round" fill="none" ${o.dash ? 'stroke-dasharray="3 12"' : ""} ${o.head === false ? "" : 'marker-end="url(#ah)"'}/>`;

export const diagrams = {
  simplify: () => {
    const lanes = ["Reuse existing helpers", "Simplification", "Efficiency", "Right abstraction level"];
    const ys = [44, 116, 188, 260];
    return `<svg viewBox="0 0 936 360" width="936" height="360">${arrowhead}
      ${T(0, 24, "YOUR CHANGED CODE", { s: 24, c: "var(--muted)" })}
      <rect x="0" y="54" width="190" height="270" rx="22" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="22" y="${82 + i * 38}" width="${[130, 100, 146, 80, 120, 96][i]}" height="14" rx="7" fill="${i % 3 === 1 ? "var(--accent)" : "var(--line)"}"/>`).join("")}
      ${ys.map((y, i) => `${line(200, 189, 292, y + 31, { w: 3 })}
        <rect x="298" y="${y}" width="446" height="62" rx="31" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
        <circle cx="334" cy="${y + 31}" r="15" fill="var(--accent)"/>${T(334, y + 40, String(i + 1), { s: 24, c: "var(--bg)", a: "middle", w: 700 })}
        ${T(366, y + 42, lanes[i], { s: 28, f: "sans", w: 600 })}
        ${line(750, y + 31, 782, 189, { w: 3, head: false })}`).join("")}
      ${line(782, 189, 806, 189, { w: 4 })}
      <rect x="812" y="124" width="124" height="130" rx="22" fill="var(--accent)"/>
      <svg x="858" y="136" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>
      ${T(874, 204, "Fixes", { s: 26, c: "var(--bg)", a: "middle", w: 700 })}${T(874, 236, "applied", { s: 26, c: "var(--bg)", a: "middle", w: 700 })}
      ${T(521, 354, "4 review agents · run in parallel", { s: 24, c: "var(--muted)", a: "middle" })}
    </svg>`;
  },

  review: () => {
    const lv = ["low", "medium", "high", "xhigh", "max", "ultra"];
    const w = 130, gap = 31;
    return `<svg viewBox="0 0 936 360" width="936" height="360">
      ${T(0, 24, "EFFORT LEVELS + FLAGS", { s: 24, c: "var(--muted)" })}
      ${lv.map((l, i) => {
        const h = 50 + i * 28, x = i * (w + gap), y = 292 - h;
        const last = i === 5;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${last ? "var(--accent)" : "var(--card)"}" stroke="${last ? "none" : "var(--line)"}" stroke-width="2"/>
        ${T(x + w / 2, 330, l, { s: 28, a: "middle", c: last ? "var(--accent)" : "var(--fg)", w: 700 })}
        ${last ? T(x + w / 2, y + 44, "cloud", { s: 26, a: "middle", c: "var(--bg)", w: 700 }) : ""}`;
      }).join("")}
      <rect x="0" y="48" width="350" height="58" rx="29" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
      ${T(28, 86, "--fix  applies fixes", { s: 26, c: "var(--accent)" })}
      <rect x="0" y="118" width="470" height="58" rx="29" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
      ${T(28, 156, "--comment  posts on the PR", { s: 26, c: "var(--accent)" })}
    </svg>`;
  },

  batch: () => {
    const cell = (cx, cy, k) => `<rect x="${cx}" y="${cy}" width="92" height="76" rx="16" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
      <svg x="${cx + 28}" y="${cy + 12}" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-branch"/></svg>
      <rect x="${cx + 18}" y="${cy + 58}" width="56" height="6" rx="3" fill="${k ? "var(--accent)" : "var(--line)"}"/>`;
    const cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) cells.push(cell(520 + c * 104, 56 + r * 92, (r + c) % 2));
    return `<svg viewBox="0 0 936 360" width="936" height="360">${arrowhead}
      <rect x="0" y="116" width="150" height="110" rx="22" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
      ${T(75, 164, "1 task", { s: 28, a: "middle", w: 700 })}${T(75, 198, "in words", { s: 24, a: "middle", c: "var(--muted)" })}
      ${line(158, 171, 212, 171)}
      <rect x="220" y="96" width="210" height="150" rx="22" fill="var(--accent)"/>
      ${T(325, 150, "Plan", { s: 38, f: "serif", w: 800, c: "var(--bg)", a: "middle" })}
      ${T(325, 188, "you approve", { s: 26, c: "var(--bg)", a: "middle", w: 700 })}
      ${T(325, 220, "first", { s: 26, c: "var(--bg)", a: "middle", w: 700 })}
      ${line(438, 171, 506, 171)}
      ${cells.join("")}
      ${T(520 + 208, 40, "5 to 30 independent units", { s: 24, c: "var(--muted)", a: "middle" })}
      ${T(520 + 208, 352, "one agent + worktree per unit", { s: 24, c: "var(--muted)", a: "middle" })}
    </svg>`;
  },

  loop: () => `<svg viewBox="0 0 936 400" width="936" height="400">${arrowhead}
      <circle cx="170" cy="190" r="128" fill="none" stroke="var(--line)" stroke-width="3"/>
      <path d="M170 62 A128 128 0 0 1 298 190" stroke="var(--accent)" stroke-width="9" fill="none" stroke-linecap="round" marker-end="url(#ah)"/>
      <path d="M170 318 A128 128 0 0 1 42 190" stroke="var(--accent)" stroke-width="9" fill="none" stroke-linecap="round" marker-end="url(#ah)"/>
      ${T(170, 176, "every", { s: 28, a: "middle", c: "var(--muted)" })}${T(170, 238, "5m", { s: 68, a: "middle", c: "var(--accent)", w: 700 })}
      ${[0, 1, 2].map((i) => {
        const x = 350 + i * 196;
        return `<rect x="${x}" y="64" width="176" height="252" rx="26" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
        ${T(x + 88, 116, `run ${i + 1}`, { s: 28, a: "middle", c: "var(--muted)" })}
        <svg x="${x + 54}" y="142" width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="${i === 2 ? "var(--accent)" : "var(--fg)"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-${i === 2 ? "check" : "refresh"}"/></svg>
        ${T(x + 88, 276, i === 2 ? "done" : "wait", { s: 32, a: "middle", w: 700 })}`;
      }).join("")}
      ${T(350 + 294, 372, "repeats while the session stays open", { s: 26, a: "middle", c: "var(--muted)" })}
    </svg>`,

  debug: () => `<svg viewBox="0 0 936 400" width="936" height="400">${arrowhead}
      ${T(0, 24, "SESSION TIMELINE", { s: 24, c: "var(--muted)" })}
      <rect x="0" y="90" width="400" height="92" rx="46" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
      ${T(200, 148, "debug log: off", { s: 32, a: "middle", c: "var(--muted)" })}
      <rect x="400" y="90" width="536" height="92" rx="46" fill="var(--accent)"/>
      ${T(668, 148, "capturing from here →", { s: 32, a: "middle", c: "var(--bg)", w: 700 })}
      <path d="M400 62 V214" stroke="var(--fg)" stroke-width="4" stroke-dasharray="3 10" stroke-linecap="round"/>
      <rect x="276" y="220" width="248" height="72" rx="36" fill="var(--fg)"/>
      ${T(400, 267, "/debug", { s: 38, a: "middle", c: "var(--bg)", w: 700 })}
      ${T(0, 366, "Claude then reads the session debug log", { s: 30, f: "sans", w: 600, c: "var(--fg)" })}
    </svg>`,
};

/* ------------------------------------------------------------------- layouts */
export const layouts = {
  /* ---- 1 hook ---- */
  hook(s, ctx) {
    return shell(ctx, s, `
      <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
      <div style="position:absolute;right:56px;top:96px;font:italic 800 560px/0.8 var(--serif);color:var(--accent);opacity:.16;letter-spacing:-.05em" data-decor>${esc(s.big)}</div>
      <h1 class="h1" style="margin-top:96px">${fmt(s.title)}</h1>
      <p class="lede" style="margin-top:44px;max-width:700px;color:var(--muted)">${fmt(s.sub)}</p>
      <div class="grow"></div>
      <div class="row between" style="align-items:flex-end">
        <div class="stack gap24" style="padding-bottom:18px">
          <div class="row gap16" style="flex-wrap:wrap;max-width:560px">${s.chips.map((c) => `<span class="pill">${esc(c)}</span>`).join("")}</div>
          <span class="pill solid" style="align-self:flex-start;font-size:30px">Swipe ${icon("arrow")}</span>
        </div>
        <div style="position:relative;width:340px;height:392px;margin-right:6px">
          <div style="position:absolute;left:-70px;top:-16px;transform:rotate(-6deg)"><span class="pill ink" style="font-size:34px;padding:18px 30px;box-shadow:0 10px 0 var(--accent)">/ + enter</span></div>
          ${mascot(340, "position:absolute;left:0;top:40px")}
        </div>
      </div>`);
  },

  /* ---- 2 problem + what a skill is ---- */
  concept(s, ctx) {
    return shell(ctx, s, `
      <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
      <h2 class="h2" style="margin-top:34px">${fmt(s.title)}</h2>
      <div class="row gap16" style="flex-wrap:wrap;margin-top:34px">
        ${s.chips.map((c, i) => `<span class="pill" style="transform:rotate(${[-2, 1.5, -1, 2, -1.5][i % 5]}deg)">${esc(c)}</span>`).join("")}
      </div>
      <p class="lede" style="margin-top:32px">${fmt(s.lede)}</p>
      <div class="row gap24" style="margin-top:34px;align-items:stretch">
        <div class="card stack gap16" style="width:300px;padding:28px 26px;flex:none">
          <div class="label">Where it lives</div>
          <div class="mono" style="font-size:26px;line-height:1.6;font-weight:500">
            <div>${icon("folder")} <span style="color:var(--muted)">.claude/</span></div>
            <div style="padding-left:24px">${icon("folder")} skills/</div>
            <div style="padding-left:48px">${icon("folder")} my-skill/</div>
            <div style="padding-left:72px;color:var(--accent);font-weight:700">${icon("file")} SKILL.md</div>
          </div>
          <div style="border-top:2px solid var(--line);padding-top:16px;font:500 26px/1.4 var(--sans)"><span class="muted">Then type</span><br><b class="mono" style="color:var(--accent)">/my-skill</b></div>
        </div>
        <div class="grow stack" style="min-width:0">${codeBlock(s.code, { dots: false, style: "flex:1;font-size:28px;line-height:1.55" })}</div>
      </div>
      <div class="grow"></div>
      <div class="banner">Claude Code ships ready-made ones. Here are 5 ${icon("arrow")}</div>`);
  },

  /* ---- 3–7 one skill per slide ---- */
  skill(s, ctx) {
    const flip = s.flip;
    return shell(ctx, s, `
      <div class="row between center">
        <div class="kicker"><span class="bar"></span>Skill ${String(s.n).padStart(2, "0")} / 05</div>
        ${mascot(66)}
      </div>
      <div class="mono" style="margin-top:30px;font-size:${s.cmdSize || 88}px;font-weight:700;letter-spacing:-.03em;color:var(--accent);line-height:1">${esc(s.cmd)}</div>
      <h2 class="h3" style="margin-top:20px">${fmt(s.title)}</h2>
      <p class="body" style="margin-top:18px;color:var(--muted);max-width:900px">${fmt(s.text)}</p>
      <div class="grow stack" style="justify-content:${flip ? "flex-end" : "center"};min-height:0;margin:18px 0">${diagrams[s.diagram]()}</div>
      ${codeBlock(s.code, { dots: false, style: "padding:24px 30px" })}
      <div class="watch" style="margin-top:22px"><span class="tag">${esc(s.tag || "Watch out")}</span><span>${fmt(s.watch)}</span></div>`);
  },

  /* ---- 8 cheat sheet ---- */
  cheatsheet(s, ctx) {
    return shell(ctx, s, `
      <div class="row between center">
        <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>${mascot(66)}
      </div>
      <h2 class="h2" style="margin-top:28px">${fmt(s.title)}</h2>
      <div class="stack" style="margin-top:34px;gap:16px">
        ${s.rows.map((r) => `<div class="card row center" style="padding:30px 30px;gap:28px;border-radius:24px">
            <div class="mono" style="width:262px;flex:none;font-size:30px;font-weight:700;color:var(--accent)">${esc(r.cmd)}</div>
            <div class="stack" style="gap:6px;min-width:0">
              <div style="font:700 29px/1.25 var(--sans)">${fmt(r.use)}</div>
              <div style="font:500 27px/1.3 var(--sans);color:var(--muted)">${fmt(r.note)}</div>
            </div></div>`).join("")}
      </div>
      <div class="grow"></div>
      <div class="src">${esc(s.source)}</div>`);
  },

  /* ---- 9 CTA ---- */
  cta(s, ctx) {
    const act = (ic, t, d) => `<div class="card row center" style="gap:24px;padding:30px 30px;border-radius:26px">
        <div style="width:76px;height:76px;border-radius:22px;background:var(--ink);color:#F4F1EA;display:flex;align-items:center;justify-content:center;font-size:42px;flex:none">${icon(ic)}</div>
        <div class="stack" style="gap:6px"><div style="font:800 38px/1 var(--serif)">${t}</div><div style="font:500 28px/1.3 var(--sans);color:var(--muted)">${d}</div></div></div>`;
    return shell(ctx, s, `
      <div class="kicker" style="color:var(--ink)"><span class="bar"></span>${esc(s.kicker)}</div>
      <h1 class="h1" style="margin-top:40px;font-size:124px">${s.titleLines.map(fmt).join("<br>")}</h1>
      <div class="row" style="gap:24px;margin-top:44px;align-items:flex-end">
        <div class="stack grow" style="gap:16px;min-width:0">${s.actions.map((a) => act(a.icon, esc(a.t), esc(a.d))).join("")}</div>
        <div style="flex:none;margin-right:-6px">${mascot(290)}</div>
      </div>
      <div class="grow"></div>
      <p class="lede" style="font-weight:700;font-size:48px">${fmt(s.ask)}</p>`);
  },

  /* ---- escape hatch: write your own HTML inside the slide shell ---- */
  custom(s, ctx) {
    return shell(ctx, s, s.html);
  },
};
