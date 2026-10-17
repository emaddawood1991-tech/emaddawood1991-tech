// Bespoke layouts + illustrations for "Run Your Instagram with Claude" (7 copy-and-paste prompts).
export default (kit) => {
  const { T, line, arrowhead, MUTED, ACC, ONA, esc, fmt, icon, mascot, shell, renderDiagram } = kit;
  const ph = (t) => esc(t).replace(/\[([^\]]+)\]/g, '<mark class="ph">[$1]</mark>');
  const dash = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="var(--accent-t)" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 14" fill="none" marker-end="url(#ah)"/>`;
  const rect = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 22}" fill="${o.fill || "var(--card)"}" stroke="${o.stroke || "var(--line)"}" stroke-width="${o.sw || 2}"/>`;

  /* ------------------------------------------------------------ illustrations */
  const ills = {
    brain: () => `<svg viewBox="0 0 936 450" width="936" height="450">${arrowhead}
      ${[[400, 175, 72], [468, 140, 74], [536, 175, 72], [384, 255, 66], [552, 255, 66], [468, 285, 64]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="var(--card)" stroke="var(--accent-t)" stroke-width="5"/>`).join("")}
      ${[[400, 175, 72], [468, 140, 74], [536, 175, 72], [384, 255, 66], [552, 255, 66], [468, 285, 64]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 2.5}" fill="var(--card)"/>`).join("")}
      <path d="M468 82 C448 140 490 190 466 240 S488 310 468 345" fill="none" stroke="var(--line)" stroke-width="4"/>
      <path d="M392 168 H436 V214 H408 M544 168 H504 V200 M404 262 H446 V300 M532 262 H494 V236 H520" fill="none" stroke="var(--accent-t)" stroke-width="4" stroke-linecap="round"/>
      ${[[392, 168], [408, 214], [544, 168], [404, 262], [532, 262], [520, 236]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="var(--accent)"/>`).join("")}
      ${[["Niche", 0, 24, 170], ["Audience", 726, 24, 210], ["Voice", 0, 352, 170], ["Goal", 766, 352, 170]].map(([l, x, y, w]) => `${rect(x, y, w, 64, { rx: 32 })}${T(x + w / 2, y + 42, l, { a: "middle", f: "sans", w: 800, s: 32 })}`).join("")}
      ${line(176, 62, 352, 140, { w: 4 })}${line(726, 62, 584, 140, { w: 4 })}${line(176, 390, 346, 300, { w: 4 })}${line(766, 390, 592, 300, { w: 4 })}
      ${T(468, 438, "context for the whole conversation", { a: "middle", c: MUTED })}</svg>`,

    hooks: () => {
      const items = [["My first 50 posts taught me one lesson.", "specific number"], ["Your carousel’s slide 2 decides who keeps swiping.", "curiosity gap"], ["3 caption openers I now reuse every week.", "useful promise"]];
      return `<div class="label" style="margin-bottom:14px">Example hooks · 8 words each</div><div class="stack" style="gap:14px">${items.map(([h, t], i) => `
        <div class="card row" style="gap:22px;padding:22px 26px;border-radius:26px;align-items:center">
          <span style="flex:none;width:60px;height:60px;border-radius:50%;background:var(--accent);color:var(--on-accent);font:800 34px/60px var(--serif);text-align:center">${i + 1}</span>
          <div class="stack" style="gap:8px;min-width:0;flex:1"><div style="font:700 38px/1.15 var(--serif)">${esc(h)}</div><div class="label" style="font-size:26px">${esc(t)}</div></div>
          <span class="badge ghost" style="flex:none">8 words</span></div>`).join("")}</div>`;
    },

    carousel: () => {
      const names = ["Hook", "Value", "Value", "Takeaway", "CTA"];
      return `<svg viewBox="0 0 936 430" width="936" height="430">${arrowhead}
        ${names.map((n, i) => { const x = i * 196, y = 24 + (i % 2) * 18, first = i === 0, last = i === 4, ink = first ? ONA : "var(--fg)";
          return `${rect(x, y, 150, 188, { rx: 22, fill: first ? "var(--accent)" : last ? "var(--fg)" : "var(--card)" })}
          <rect x="${x + 16}" y="${y + 24}" width="${first ? 96 : 82}" height="16" rx="8" fill="${last ? "var(--bg)" : ink}"/>
          ${[0, 1, 2].map((k) => `<rect x="${x + 16}" y="${y + 56 + k * 18}" width="${[118, 100, 70][k]}" height="10" rx="5" fill="${last ? "var(--bg)" : ink}" opacity=".5"/>`).join("")}
          <rect x="${x + 16}" y="${y + 120}" width="118" height="46" rx="10" fill="${last ? "var(--accent)" : first ? ONA : "var(--line)"}" opacity="${first ? ".35" : "1"}"/>
          ${T(x + 75, y + 188 + 46, n, { a: "middle", w: 700 })}`; }).join("")}
        ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${468 + (i - 2) * 34}" cy="352" r="${i === 0 ? 11 : 8}" fill="${i === 0 ? "var(--accent)" : "var(--line)"}"/>`).join("")}
        ${T(468, 418, "headline · copy · visual direction", { a: "middle", c: MUTED })}</svg>`;
    },

    captions: () => {
      const col = (label, good, lines) => `<div class="card stack" style="flex:1;gap:12px;padding:24px 24px;border-radius:26px;min-width:0;${good ? "border:3px solid var(--accent);background:var(--card-2);" : ""}">
        <span class="badge ${good ? "hot" : "ghost"}">${icon(good ? "check" : "x")} ${label}</span>
        ${lines.map((l) => `<div style="font:${good ? 600 : 500} 32px/1.3 var(--sans);${good ? "" : "color:var(--muted)"}">${esc(l)}</div>`).join("")}</div>`;
      return `<div class="row gap16" style="align-items:stretch">${col("Before", false, ["New post!", "Link in bio.", "#love #instagood #follow #like #photo"])}${col("After", true, ["Stuck on what to post?", "Try this weekly rhythm: one tutorial, one tip, one example.", "Save it. Which will you try first?", "#ContentPlanning #InstagramTips #CreatorTips"])}</div>`;
    },

    calendar: () => {
      const fills = { Tutorial: "var(--accent)", Tip: "#2FE3B2", Example: "#FFC83D", Community: "#6FA8FF" };
      const week = ["Tutorial", "Tip", "Example", "Tip", "Community", "Tutorial", "Example"];
      const pitch = 936 / 7, cw = 124, ch = 78;
      const cells = [];
      for (let d = 1; d <= 30; d++) { const i = d - 1, c = i % 7, r = Math.floor(i / 7);
        cells.push(`<rect x="${c * pitch}" y="${58 + r * (ch + 8)}" width="${cw}" height="${ch}" rx="16" fill="${fills[week[c]]}"/>${T(c * pitch + 16, 58 + r * (ch + 8) + 50, String(d), { c: "#0C1020", w: 800, s: 32 })}`); }
      return `<svg viewBox="0 0 936 570" width="936" height="570">
        ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((n, c) => T(c * pitch + cw / 2, 34, n, { a: "middle", c: MUTED, w: 700 })).join("")}
        ${cells.join("")}
        ${Object.entries(fills).map(([n, f], k) => `<rect x="${k * 236}" y="518" width="30" height="30" rx="8" fill="${f}"/>${T(k * 236 + 42, 544, n, { w: 700 })}`).join("")}</svg>`;
    },

    comments: () => {
      const bubble = (who, text) => `<div class="stack" style="gap:6px;align-items:flex-start"><span class="label" style="font-size:26px">${who}</span><div style="font:600 32px/1.3 var(--sans);background:var(--card);border:2px solid var(--line);border-radius:22px 22px 22px 6px;padding:10px 22px">${esc(text)}</div></div>`;
      const reply = (text) => `<div class="row gap16" style="margin-left:56px;align-items:flex-start"><div style="flex:none">${mascot(54, "happy")}</div><div class="stack" style="gap:6px;align-items:flex-start;min-width:0"><span class="badge hot" style="font-size:26px;padding:8px 12px">Claude draft</span><div style="font:600 32px/1.3 var(--sans);background:var(--card-2);border:3px solid var(--accent);border-radius:22px 22px 6px 22px;padding:10px 22px">${esc(text)}</div></div></div>`;
      const flag = `<div class="row gap16 center" style="margin-left:56px;border:3px dashed var(--accent-t);border-radius:22px;padding:10px 22px;font:700 32px/1.25 var(--sans)"><span style="font-size:40px;color:var(--accent-t);display:flex">${icon("shield")}</span><span>Flagged for manual review. No draft.</span></div>`;
      return `<div class="stack" style="gap:10px">${bubble("@maya.makes", "Love this! Where do I start?")}${reply("Thanks, Maya! Start with prompt 1.")}${bubble("@sam_r", "I was charged twice. This is a scam.")}${flag}</div>`;
    },
  };

  /* ------------------------------------------------------------ layouts */
  const promptCard = (s) => {
    const body = `<div style="font:500 ${s.promptStyle === "note" || s.promptStyle === "chat" ? 32 : 32}px/1.42 var(--sans)">${ph(s.prompt)}</div>`;
    if (s.promptStyle === "note") return `<div class="card" style="border-left:10px solid var(--accent);border-radius:12px 26px 26px 12px;padding:24px 30px"><div class="label" style="margin-bottom:12px;color:var(--accent-t)">Copy-paste prompt</div>${body}</div>`;
    if (s.promptStyle === "chat") return `<div class="stack" style="gap:10px;align-items:flex-end"><span class="badge">You to Claude</span><div style="width:100%;background:var(--card-2);border:2px solid var(--line);border-radius:30px 30px 8px 30px;padding:24px 30px">${body}</div></div>`;
    return `<div class="code" style="white-space:normal;padding:24px 32px 28px"><div class="label" style="color:#2FE3B2;margin-bottom:12px">Copy-paste prompt</div><div style="font:500 32px/1.42 var(--sans);color:#EEF1FA">${ph(s.prompt)}</div></div>`;
  };
  const illBox = (s) => {
    const html = typeof s.ill === "string" ? ills[s.ill]() : renderDiagram(s.ill);
    return `<div class="grow stack" style="justify-content:center;min-height:0;margin:${s.illMargin || "20px 0"}">${html}</div>`;
  };

  const layouts = {
    /* slide 1: Instagram ↔ Claude with the robot in the middle */
    igHook(s, ctx) {
      const svg = `<svg viewBox="0 0 936 380" width="936" height="380">${arrowhead}
        ${rect(0, 40, 230, 230, { rx: 64, fill: "var(--accent)", stroke: "none" })}
        <rect x="55" y="95" width="120" height="120" rx="34" fill="none" stroke="${ONA}" stroke-width="12"/><circle cx="115" cy="155" r="29" fill="none" stroke="${ONA}" stroke-width="12"/><circle cx="150" cy="120" r="8" fill="${ONA}"/>
        ${T(115, 322, "Instagram", { a: "middle", f: "sans", w: 800, s: 32 })}
        ${rect(706, 40, 230, 230, { rx: 64 })}
        <g stroke="var(--accent-t)" stroke-width="15" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<line x1="${821 + Math.cos(a) * 30}" y1="${155 + Math.sin(a) * 30}" x2="${821 + Math.cos(a) * 72}" y2="${155 + Math.sin(a) * 72}"/>`; }).join("")}</g>
        ${T(821, 322, "Claude", { a: "middle", f: "sans", w: 800, s: 32 })}
        <use href="#mascot-wow" x="378" y="6" width="180" height="207"/>
        ${rect(386, 226, 164, 62, { rx: 31, fill: "var(--accent)", stroke: "none" })}${T(468, 266, "prompts", { a: "middle", c: ONA, w: 700 })}
        ${dash(244, 156, 366, 156)}${dash(570, 156, 694, 156)}</svg>`;
      return shell(ctx, s, `
        <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
        <h1 class="h1" style="margin-top:30px;font-size:122px">${fmt(s.title)}</h1>
        <p class="lede" style="margin-top:24px;color:var(--muted)">${fmt(s.sub)}</p>
        <div class="grow stack" style="justify-content:center;min-height:0">${svg}</div>
        <div class="row gap16 center"><span class="pill solid" style="font-size:36px;padding:20px 34px">${esc(s.swipe)}</span></div>`);
    },

    /* slides 2–8: one copy-paste prompt + a bespoke illustration */
    prompt(s, ctx) {
      const card = promptCard(s), ill = illBox(s);
      return shell(ctx, s, `
        ${mascot(112, s.mood || "happy", "position:absolute;right:64px;top:50px")}
        <div class="kicker"><span class="bar"></span>Prompt ${String(s.n).padStart(2, "0")} / 07</div>
        <h2 class="h2" style="margin-top:24px;font-size:${s.titleSize || 72}px;max-width:790px">${fmt(s.title)}</h2>
        ${s.why ? `<p class="body" style="margin-top:12px;color:var(--muted)">${fmt(s.why)}</p>` : ""}
        <div style="margin-top:22px">${s.order === "ill-first" ? "" : card}</div>
        ${ill}
        ${s.order === "ill-first" ? card : ""}
        ${s.banner ? `<div class="banner" style="margin-top:20px;font-size:32px">${fmt(s.banner)}</div>` : ""}
        ${s.watch ? `<div class="watch" style="margin-top:${s.watchGap || 20}px"><span class="tag">${esc(s.tag || "Tip")}</span><span>${fmt(s.watch)}</span></div>` : ""}`);
    },

    /* slide 9: cheat sheet + Follow-first CTA with a big robot */
    toolkit(s, ctx) {
      const cell = (it, i, span) => `<div class="card row" style="gap:18px;padding:16px 20px;border-radius:22px;align-items:center;${span ? "grid-column:1 / -1;" : ""}"><span style="flex:none;width:52px;height:52px;border-radius:50%;background:var(--accent);color:var(--on-accent);font:800 30px/52px var(--serif);text-align:center">${i + 1}</span><div class="stack" style="min-width:0"><div style="font:800 32px/1.15 var(--sans)">${esc(it[0])}</div><div style="font:500 30px/1.2 var(--sans);color:var(--muted)">${esc(it[1])}</div></div></div>`;
      return shell(ctx, s, `
        <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
        <h2 class="h2" style="margin-top:20px;font-size:70px">${fmt(s.title)}</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px">${s.items.map((it, i) => cell(it, i, i === s.items.length - 1 && s.items.length % 2 === 1)).join("")}</div>
        <div class="grow"></div>
        <div class="row" style="background:var(--ink);color:#F4F1EA;border-radius:34px;padding:26px 34px 26px;gap:12px;align-items:center;box-shadow:0 10px 0 rgba(12,16,32,.28)">
          <div class="stack grow" style="gap:12px;min-width:0">
            <span class="label" style="font-size:28px;letter-spacing:.14em;color:#2FE3B2">${icon("follow")} Follow</span>
            <div style="font:800 82px/1 var(--serif);color:#FFFFFF">${esc(s.handle)}</div>
            <div style="font:500 32px/1.25 var(--sans);color:#C9CFE6">${esc(s.followSub)}</div>
          </div>
          <div style="flex:none;margin:-34px -6px -18px 0">${mascot(270, "cheer", "--m-head:#F4F1EA;--m-screen:#0C1020;--m-eye:#2FE3B2;--m-body:#F4F1EA;--m-ear:#FF6A3D")}</div>
        </div>
        <div class="row gap16" style="margin-top:16px">${s.actions.map((a) => `<div class="card row center" style="flex:1;gap:14px;padding:18px 22px;border-radius:22px"><span style="flex:none;width:52px;height:52px;border-radius:14px;background:var(--ink);color:#F4F1EA;display:flex;align-items:center;justify-content:center;font-size:30px">${icon(a.icon)}</span><div style="font:800 34px/1.15 var(--serif)">${esc(a.t)}</div></div>`).join("")}</div>`);
    },
  };

  return { layouts, css: `mark.ph{background:var(--accent);color:var(--on-accent);padding:0 8px;border-radius:8px;font-weight:700}` };
};
