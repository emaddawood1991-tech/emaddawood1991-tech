// Bespoke layouts for "Your Claude Code skills can improve themselves".
// Facts come from the projects' own READMEs and the Claude Code docs (see sources.md). Mock-ups are illustrative.
export default (kit) => {
  const { T, line, arrowhead, MUTED, ACC, ONA, esc, fmt, icon, mascot, shell, codeBlock, renderDiagram } = kit;
  const mTop = "position:absolute;right:var(--safe-x);top:var(--mascot-top)";
  const hdr = (s, mood) => `${mascot(112, mood || "happy", mTop)}<div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
    <h2 class="h2" style="margin-top:14px;font-size:${s.titleSize || 62}px;max-width:790px">${fmt(s.title)}</h2>`;
  const rect = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 22}" fill="${o.fill || "var(--card)"}" stroke="${o.stroke || "var(--line)"}" stroke-width="${o.sw || 2}"/>`;
  const dash = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="var(--accent-t)" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 12" fill="none"/>`;
  const watch = (s, size = 30) => s.watch ? `<div class="watch" style="padding:14px 22px;font-size:${size}px"><span class="tag">${esc(s.tag || "Note")}</span><span>${fmt(s.watch)}</span></div>` : "";
  const badge = (t, cls = "hot") => `<span class="badge ${cls}">${esc(t)}</span>`;
  const linkBox = (a, b) => `<div class="code" style="white-space:normal;padding:16px 24px 18px;flex:none"><div class="label" style="color:#2FE3B2;margin-bottom:4px">Official repository</div><div style="font:600 32px/1.3 var(--mono);color:#fff;word-break:break-all">${esc(a)}${b ? `<br>${esc(b)}` : ""}</div></div>`;

  const layouts = {
    /* 1 · hook */
    skillHub(s, ctx) {
      const mod = (x, y, w, t, hot) => `${rect(x, y, w, 58, { rx: 29, fill: hot ? "var(--accent)" : "var(--card)" })}${T(x + w / 2, y + 39, t, { a: "middle", w: 700, c: hot ? ONA : "var(--fg)" })}`;
      const svg = `<svg viewBox="0 0 940 330" width="940" height="330">${arrowhead}
        ${dash(268, 62, 402, 122)}${dash(238, 280, 410, 214)}${dash(672, 62, 538, 122)}${dash(612, 280, 530, 214)}${dash(470, 244, 470, 262)}
        <use href="#mascot-wow" x="383" y="22" width="174" height="200"/>
        ${mod(10, 34, 250, "task-observer", true)}${mod(10, 252, 230, "impeccable")}${mod(680, 34, 250, "skill-creator")}${mod(600, 252, 330, "anthropics/skills")}
        ${rect(398, 262, 144, 58, { rx: 29, fill: "none", stroke: "var(--accent-t)", sw: 3 })}${T(470, 301, "SKILL.md", { a: "middle", w: 700, c: ACC })}</svg>`;
      return shell(ctx, s, `
        <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
        <h1 class="h1" style="margin-top:16px;font-size:88px">${fmt(s.title)}</h1>
        <p class="lede" style="margin-top:14px;font-size:34px;color:var(--muted)">${fmt(s.sub)}</p>
        <div class="grow stack" style="justify-content:center;min-height:0">${svg}</div>
        <div class="row gap16 center"><span class="pill solid" style="font-size:32px;padding:16px 28px">${esc(s.swipe)}</span><span class="pill" style="font-size:30px;padding:16px 24px">${icon("shield")} ${esc(s.chip)}</span></div>`);
    },

    /* 2 · what are skills */
    skillsExplained(s, ctx) {
      return shell(ctx, s, `${hdr(s, s.mood)}
        <p class="body" style="margin-top:8px;font-size:32px;color:var(--muted);max-width:790px">${fmt(s.lede)}</p>
        <div style="margin-top:14px">${renderDiagram(s.diagram)}</div>
        ${codeBlock(s.code, { dots: false, style: "margin-top:14px;padding:20px 28px;flex:none" })}
        <div class="grow"></div>${watch(s)}`);
    },

    /* 3 · task-observer */
    observer(s, ctx) {
      const pill = (y, t) => `${rect(0, y, 340, 64, { rx: 32 })}${T(170, y + 42, t, { a: "middle", f: "sans", w: 700, s: 30 })}`;
      const svg = `<svg viewBox="0 0 940 250" width="940" height="250">${arrowhead}
        ${pill(10, "Your corrections")}${pill(92, "Gaps no skill covers")}${pill(174, "Its own blind spots")}
        ${line(350, 42, 390, 100)}${line(350, 124, 390, 124)}${line(350, 206, 390, 148)}
        ${rect(396, 56, 256, 136, { rx: 26, fill: "var(--accent)", stroke: "none" })}${T(524, 112, "task-observer", { a: "middle", f: "sans", w: 800, s: 31, c: ONA })}${T(524, 154, "watches work", { a: "middle", c: ONA })}
        ${line(660, 124, 704, 124)}
        ${rect(714, 40, 226, 168, { rx: 26 })}<g transform="translate(827 96)" fill="none" stroke="var(--accent-t)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M-26 -34 h38 l14 14 v54 h-52z"/><path d="M-14 -4 h28 M-14 12 h28"/></g>${T(827, 168, "Observation", { a: "middle", f: "sans", w: 800, s: 30 })}${T(827, 200, "log", { a: "middle", f: "sans", w: 800, s: 30 })}</svg>`;
      return shell(ctx, s, `${hdr(s, s.mood)}
        <div class="row gap16" style="margin-top:12px">${badge("Skill")}${badge("CC BY 4.0", "ghost")}</div>
        <p class="body" style="margin-top:10px;font-size:32px;color:var(--muted)">${fmt(s.lede)}</p>
        <div style="margin-top:10px">${svg}</div>
        <div style="margin-top:10px">${linkBox(s.repo[0], s.repo[1])}</div>
        <div class="src" style="margin-top:8px">${esc(s.by)}</div>
        <div class="grow"></div>${watch(s)}`);
    },

    /* 4 · continuous improvement loop (no auto-apply) */
    loop5(s, ctx) {
      const steps = ["Work", "Observe", "Suggest", "Review", "Improve"], w = 196, h = 96, ov = 14;
      const chev = steps.map((t, i) => { const x = i * (w - ov), hot = i === 3;
        return `<path d="M${x} 6 H${x + w - 28} L${x + w} ${6 + h / 2} L${x + w - 28} ${6 + h} H${x} L${x + 28} ${6 + h / 2} Z" fill="${hot ? "var(--accent)" : "var(--card)"}" stroke="${hot ? "none" : "var(--line)"}" stroke-width="2"/>${T(x + w / 2 + 6, 6 + h / 2 + 11, t, { a: "middle", f: "sans", w: 800, s: 30, c: hot ? ONA : "var(--fg)" })}`; }).join("");
      const svg = `<svg viewBox="0 0 940 170" width="940" height="170">${chev}${T(3 * (w - ov) + w / 2 + 6, 150, "you decide", { a: "middle", c: ACC, w: 700 })}</svg>`;
      return shell(ctx, s, `${hdr(s, s.mood)}
        <p class="body" style="margin-top:8px;font-size:32px;color:var(--muted)">${fmt(s.lede)}</p>
        <div style="margin-top:14px">${svg}</div>
        ${codeBlock(s.code, { dots: false, style: "margin-top:12px;padding:18px 26px;flex:none" })}
        <div class="grow"></div>${watch(s)}`);
    },

    /* 5 · impeccable: before / after */
    impeccable(s, ctx) {
      const field = (bad) => `<div style="height:${bad ? 26 : 34}px;border-radius:${bad ? 0 : 12}px;border:${bad ? "3px solid #111" : "2px solid var(--line)"};background:${bad ? "#fff" : "var(--card)"};margin-top:${bad ? 6 : 12}px"></div>`;
      const before = `<div style="flex:1;min-width:0;background:#E6E6E6;border:2px solid #999;padding:18px;color:#111"><div style="font:700 30px/1 'Times New Roman',serif;text-align:left">Sign Up</div>${field(true)}${field(true)}${field(true)}<div style="margin-top:10px;background:#3366FF;color:#fff;font:700 30px/1 Arial,sans-serif;padding:12px 10px;text-align:center;border:3px solid #000">SUBMIT</div></div>`;
      const after = `<div style="flex:1;min-width:0;background:var(--card);border:2px solid var(--line);border-radius:22px;padding:20px;box-shadow:0 10px 0 var(--line)"><div style="font:800 36px/1.05 var(--serif);color:var(--fg)">Sign <i style="color:var(--accent-t);font-weight:500">up</i></div>${field(false)}${field(false)}${field(false)}<div style="margin-top:16px;background:var(--accent);color:var(--on-accent);font:800 30px/1 var(--sans);padding:14px 10px;text-align:center;border-radius:14px">Create account</div></div>`;
      return shell(ctx, s, `${hdr(s, s.mood)}
        <div class="row gap16" style="margin-top:12px;align-items:center">${badge("Design skill")}<span class="label">Illustrative mock-up</span></div>
        <div class="row gap16" style="margin-top:10px;align-items:stretch">${before}${after}</div>
        <div style="font:600 32px/1.3 var(--sans);margin-top:18px">Commands: ${s.cmds.map((c) => `<code class="mono">${esc(c)}</code>`).join(" ")}</div>
        ${codeBlock(s.code, { dots: false, style: "margin-top:10px;padding:16px 26px;flex:none" })}
        <div class="grow"></div>
        <div class="row between center" style="gap:12px"><span class="src" style="font-size:26px">${esc(s.by)}</span><span class="badge ghost">Apache-2.0</span></div>`);
    },

    /* 6 · other verified tools; skills vs plugins vs CLIs vs MCP servers */
    collections(s, ctx) {
      const card = (c) => `<div class="card stack" style="gap:6px;padding:12px 20px;border-radius:24px"><div class="row between center"><span class="mono" style="font-size:34px;font-weight:800;color:var(--accent-t)">${esc(c.name)}</span>${badge(c.kind, c.kind === "Plugin" ? "hot" : "")}</div><div style="font:600 32px/1.25 var(--sans)">${fmt(c.what)}</div><div class="mono" style="font-size:30px;font-weight:600;word-break:break-all;color:var(--muted)">${esc(c.link)}</div>${c.cmd ? `<div class="code" style="white-space:normal;padding:10px 18px;border-radius:14px;font-size:32px;line-height:1.3;word-break:break-all">${esc(c.cmd)}</div>` : ""}</div>`;
      return shell(ctx, s, `${hdr(s, s.mood)}
        <div class="stack" style="gap:10px;margin-top:12px">${s.items.map(card).join("")}</div>
        <div class="grow"></div>
        <div class="card" style="padding:10px 22px;border-radius:22px"><div class="label" style="margin-bottom:4px">Know the difference</div>${s.legend.map(([k, v]) => `<div class="row gap16" style="align-items:baseline;font:500 30px/1.3 var(--sans)"><b style="flex:none;width:210px;font:800 30px/1.3 var(--mono);color:var(--accent-t)">${esc(k)}</b><span>${esc(v)}</span></div>`).join("")}</div>`);
    },

    /* 7 · install + where skills live */
    install(s, ctx) {
      const where = (t, p, d) => `<div class="card stack" style="flex:1;gap:4px;padding:14px 18px;border-radius:22px;min-width:0"><div class="label" style="font-size:26px">${esc(t)}</div><div class="mono" style="font-size:30px;font-weight:700;word-break:break-all">${esc(p)}</div><div style="font:500 30px/1.25 var(--sans);color:var(--muted)">${esc(d)}</div></div>`;
      return shell(ctx, s, `${hdr(s, s.mood)}
        <div class="row gap16" style="margin-top:14px;align-items:stretch">${s.where.map(([a, b, c]) => where(a, b, c)).join("")}</div>
        ${codeBlock(s.code, { dots: false, style: "margin-top:12px;padding:18px 26px;flex:none;line-height:1.38" })}
        <div class="grow"></div>${watch(s)}`);
    },

    /* 8 · test that skills are recognised AND used */
    testSkills(s, ctx) {
      const row = (n, t, d, c) => `<div class="card row" style="gap:18px;padding:12px 18px;border-radius:22px;align-items:flex-start"><span style="flex:none;width:50px;height:50px;border-radius:50%;background:var(--accent);color:var(--on-accent);font:800 30px/50px var(--serif);text-align:center">${n}</span><div class="stack" style="gap:2px;min-width:0"><div style="font:800 34px/1.15 var(--sans)">${t}</div><div style="font:500 30px/1.25 var(--sans);color:var(--muted)">${d}</div>${c ? `<div class="mono" style="font-size:30px;font-weight:700;color:var(--accent-t);word-break:break-all">${esc(c)}</div>` : ""}</div></div>`;
      return shell(ctx, s, `${hdr(s, s.mood)}
        <div class="stack" style="gap:10px;margin-top:14px">${s.checks.map((c, i) => row(i + 1, fmt(c.t), fmt(c.d), c.c)).join("")}</div>
        <div class="grow"></div>${watch(s)}`);
    },

    /* 9 · cheat sheet + Follow-first CTA */
    toolkit9(s, ctx) {
      const row = (r, i) => `<div class="card row" style="gap:16px;padding:10px 18px;border-radius:20px;align-items:center"><span style="flex:none;width:48px;height:48px;border-radius:50%;background:var(--ink);color:#F4F1EA;font:800 30px/48px var(--serif);text-align:center">${i + 1}</span><div class="stack" style="min-width:0;gap:0"><div class="row gap16" style="align-items:baseline;flex-wrap:wrap"><b class="mono" style="font-size:32px;color:var(--accent-t)">${esc(r[0])}</b><span style="font:600 30px/1.2 var(--sans);color:var(--muted)">${esc(r[1])}</span></div><div class="mono" style="font-size:30px;font-weight:600;word-break:break-all">${esc(r[2])}</div></div></div>`;
      return shell(ctx, s, `
        <div class="kicker" style="color:var(--ink)"><span class="bar"></span>${esc(s.kicker)}</div>
        <h2 class="h2" style="margin-top:14px;font-size:64px">${fmt(s.title)}</h2>
        <div class="stack" style="gap:10px;margin-top:16px">${s.rows.map(row).join("")}</div>
        <div class="grow"></div>
        <div class="row" style="background:var(--ink);color:#F4F1EA;border-radius:30px;padding:18px 28px;gap:12px;align-items:center;box-shadow:0 10px 0 rgba(12,16,32,.28)">
          <div class="stack grow" style="gap:10px;min-width:0">
            <span class="label" style="font-size:28px;letter-spacing:.14em;color:#2FE3B2">${icon("follow")} Follow</span>
            <div style="font:800 68px/1 var(--serif);color:#FFFFFF">${esc(s.handle)}</div>
            <span class="pill" style="align-self:flex-start;background:#FF6A3D;color:#0C1020;border:none;font:800 32px/1 var(--sans);padding:14px 26px">${icon("plus")} ${esc(s.followBtn)}</span>
          </div>
          <div style="flex:none">${mascot(190, "cheer", "--m-head:#F4F1EA;--m-screen:#0C1020;--m-eye:#2FE3B2;--m-body:#F4F1EA;--m-ear:#FF6A3D")}</div>
        </div>
        <div class="row gap16" style="margin-top:12px">${s.actions.map((a) => `<div class="card row center" style="flex:1;gap:12px;padding:12px 16px;border-radius:20px"><span style="flex:none;width:46px;height:46px;border-radius:14px;background:var(--ink);color:#F4F1EA;display:flex;align-items:center;justify-content:center;font-size:28px">${icon(a.icon)}</span><div style="font:800 31px/1.12 var(--serif)">${esc(a.t)}</div></div>`).join("")}</div>`);
    },
  };
  return { layouts };
};
