// Bespoke layouts + illustrations for "Connect Instagram to ChatGPT" (via Ootto). All numbers in mock-ups are demo data.
import fs from "node:fs";

export default (kit) => {
  const { T, line, arrowhead, MUTED, ACC, ONA, esc, fmt, icon, mascot, shell, ills } = kit;
  const here = (f) => new URL(f, import.meta.url);

  /* ---------- brand marks: simplified glyphs by default; drop official SVGs into ./brand/ to override ---------- */
  const override = (file, x, y, s) => {
    try { const t = fs.readFileSync(here(`./brand/${file}`), "utf8").replace(/<\?xml[^>]*>/, ""); return t.replace(/<svg\b/, `<svg x="${x}" y="${y}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid meet"`); } catch { return null; }
  };
  const igMark = (x, y, s, id = "igg") => override("instagram.svg", x, y, s) || `<defs><linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FEDA75"/><stop offset=".25" stop-color="#FA7E1E"/><stop offset=".5" stop-color="#D62976"/><stop offset=".75" stop-color="#962FBF"/><stop offset="1" stop-color="#4F5BD5"/></linearGradient></defs>
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.27}" fill="url(#${id})"/>
    <rect x="${x + s * 0.25}" y="${y + s * 0.25}" width="${s * 0.5}" height="${s * 0.5}" rx="${s * 0.14}" fill="none" stroke="#fff" stroke-width="${s * 0.055}"/>
    <circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * 0.12}" fill="none" stroke="#fff" stroke-width="${s * 0.055}"/><circle cx="${x + s * 0.66}" cy="${y + s * 0.34}" r="${s * 0.032}" fill="#fff"/>`;
  const gptMark = (x, y, s) => override("chatgpt.svg", x, y, s) || `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.27}" fill="#10A37F"/>
    <g transform="translate(${x + s / 2} ${y + s / 2})" fill="none" stroke="#fff" stroke-width="${s * 0.04}" stroke-linejoin="round">${[0, 1, 2, 3, 4, 5].map((k) => `<rect x="${-s * 0.1}" y="${-s * 0.36}" width="${s * 0.2}" height="${s * 0.5}" rx="${s * 0.1}" transform="rotate(${k * 60})"/>`).join("")}</g>`;
  const ootto = (x, y, s) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.27}" fill="var(--card)" stroke="var(--line)" stroke-width="3"/>${T(x + s / 2, y + s * 0.62, "o", { a: "middle", f: "serif", w: 800, s: s * 0.62, c: ACC })}`;
  const rect = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 22}" fill="${o.fill || "var(--card)"}" stroke="${o.stroke || "var(--line)"}" stroke-width="${o.sw || 2}"/>`;
  const flowDots = (x1, x2, y) => `<path d="M${x1} ${y} L${x2} ${y}" stroke="var(--accent-t)" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 14" fill="none" marker-end="url(#ah)"/>`;
  const packet = (x, y, k) => `<g transform="translate(${x} ${y})"><rect width="58" height="38" rx="12" fill="var(--accent)"/>${k === 0 ? `<rect x="12" y="20" width="8" height="10" rx="2" fill="${ONA}"/><rect x="25" y="12" width="8" height="18" rx="2" fill="${ONA}"/><rect x="38" y="16" width="8" height="14" rx="2" fill="${ONA}"/>` : k === 1 ? `<circle cx="29" cy="19" r="9" fill="none" stroke="${ONA}" stroke-width="4"/>` : `<path d="M12 28 L24 14 L33 22 L46 10" fill="none" stroke="${ONA}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`}</g>`;

  /* ---------- reusable HTML bits for the dashboard mock-ups ---------- */
  const spark = (pts, w, h, col = "var(--accent-t)") => {
    const max = Math.max(...pts), min = Math.min(...pts), xs = w / (pts.length - 1), y = (v) => h - 8 - ((v - min) / (max - min || 1)) * (h - 16);
    const p = pts.map((v, i) => `${(i * xs).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="display:block"><polygon points="0,${h} ${p} ${w},${h}" fill="${col}" opacity=".16"/><polyline points="${p}" fill="none" stroke="${col}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  };
  const kpi = (label, value) => `<div class="card" style="flex:1;padding:14px 18px;border-radius:20px;min-width:0"><div class="label" style="font-size:26px">${label}</div><div style="font:800 50px/1.05 var(--serif);margin-top:4px">${value}</div></div>`;
  const bars = (vals, h) => `<svg viewBox="0 0 400 ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="display:block">${vals.map((v, i) => `<rect x="${i * 82 + 6}" y="${h - v * h}" width="62" height="${v * h}" rx="10" fill="${i === 1 ? "var(--accent)" : "var(--line)"}"/>`).join("")}</svg>`;
  const demoBadge = `<span class="badge hot">Demo data</span>`;

  /* ---------- illustrations (registered by name) ---------- */
  const mine = {
    dashboard: () => `<div class="card stack" style="gap:14px;padding:20px 22px;border-radius:26px">
        <div class="row between center"><div class="row center gap16"><span style="display:flex;gap:8px"><i style="width:16px;height:16px;border-radius:50%;background:#FF6A6A"></i><i style="width:16px;height:16px;border-radius:50%;background:#FFC83D"></i><i style="width:16px;height:16px;border-radius:50%;background:#2FE3B2"></i></span><span class="label">Account overview</span></div>${demoBadge}</div>
        <div class="row gap16">${kpi("Engagement", "4.8%")}${kpi("Views", "12.4K")}${kpi("Comments", "186")}</div>
        <div class="card" style="padding:14px 18px;border-radius:20px"><div class="row between"><span class="label" style="font-size:26px">Followers · 30 days</span><b style="font:700 32px/1 var(--sans);color:var(--accent-t)">+320</b></div><div style="margin-top:6px">${spark([40, 44, 43, 50, 49, 58, 57, 66, 64, 75, 80, 92], 880, 96)}</div></div>
        <div class="row center gap16" style="background:var(--card-2);border-radius:20px;padding:12px 18px"><span style="font-size:36px;color:var(--accent-t);display:flex">${icon("spark")}</span><span style="font:600 32px/1.25 var(--sans)"><b>AI insight:</b> Reels earned the most views.</span></div></div>`,

    chatDash: () => `<div class="row gap16" style="align-items:stretch">
        <div class="card stack" style="flex:1.25;gap:10px;padding:18px 20px;border-radius:24px;min-width:0">
          <div class="row center gap16"><svg viewBox="0 0 60 60" width="44" height="44">${gptMark(0, 0, 60)}</svg><span class="label">ChatGPT</span></div>
          <div style="font:600 32px/1.25 var(--sans);background:var(--card-2);border-radius:18px;padding:10px 16px">Here is what your data shows:</div>
          ${["Top posts", "Engagement patterns", "Content opportunities", "Missing metrics"].map((t, i) => `<div class="row center gap16" style="font:700 32px/1.2 var(--sans)"><span style="flex:none;width:42px;height:42px;border-radius:50%;background:var(--accent);color:var(--on-accent);font:800 30px/42px var(--serif);text-align:center">${i + 1}</span>${t}</div>`).join("")}</div>
        <div class="card stack" style="flex:1;gap:10px;padding:18px 20px;border-radius:24px;min-width:0">
          <div class="row between center"><span class="label">Dashboard</span>${demoBadge}</div>
          <div class="row gap16">${kpi("Views", "12.4K")}</div>
          <div>${bars([0.5, 0.9, 0.6, 0.35, 0.7], 120)}</div>
          <div class="label" style="font-size:26px">Posts, ranked</div></div></div>`,

    questions: () => {
      const q = [["Which posts performed best?", [0.4, 0.95, 0.55, 0.7, 0.3]], ["Which topics earned engagement?", [0.7, 0.45, 0.9, 0.35, 0.6]], ["What formats should I test?", [0.55, 0.8, 0.3, 0.65, 0.45]], ["What changed over time?", null]];
      return `<div class="label" style="margin-bottom:10px">Illustrative charts · demo data</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${q.map(([t, v], i) => `<div class="card stack" style="gap:12px;padding:20px 22px;border-radius:26px;justify-content:space-between;${i === 0 ? "border:3px solid var(--accent);" : ""}">
        <div class="row gap16" style="align-items:flex-start"><span style="flex:none;width:50px;height:50px;border-radius:50%;background:var(--accent);color:var(--on-accent);font:800 30px/50px var(--serif);text-align:center">${i + 1}</span><div style="font:800 36px/1.12 var(--serif)">${esc(t)}</div></div>
        <div>${v ? bars(v, 64) : spark([30, 34, 33, 45, 42, 55, 70, 66, 78], 400, 64)}</div></div>`).join("")}</div>`;
    },

    flow3: () => `<svg viewBox="0 0 940 340" width="940" height="340">${arrowhead}
      ${rect(0, 30, 270, 250)}
      <g transform="translate(135 150)"><rect x="-80" y="-14" width="30" height="64" rx="8" fill="var(--accent)"/><rect x="-35" y="-54" width="30" height="104" rx="8" fill="var(--accent)" opacity=".7"/><rect x="10" y="-30" width="30" height="80" rx="8" fill="var(--accent)" opacity=".5"/><rect x="55" y="-70" width="30" height="120" rx="8" fill="var(--accent)"/></g>
      ${T(135, 262, "Analytics", { a: "middle", f: "sans", w: 800, s: 32 })}
      ${line(280, 155, 336, 155)}
      ${rect(336, 30, 270, 250, { fill: "var(--accent)", stroke: "none" })}
      <use href="#mascot-think" x="396" y="52" width="150" height="172" style="--m-head:#0C1020;--m-screen:#FFF3EC;--m-eye:#FF6A3D;--m-body:#0C1020;--m-ear:#FFF3EC;--accent:#0C1020"/>
      ${T(471, 262, "AI insights", { a: "middle", f: "sans", w: 800, s: 32, c: ONA })}
      ${line(616, 155, 672, 155)}
      ${rect(672, 30, 268, 250)}
      ${Array.from({ length: 14 }, (_, i) => `<rect x="${690 + (i % 7) * 34}" y="${58 + Math.floor(i / 7) * 48}" width="28" height="38" rx="7" fill="${[ "var(--accent)", "#2FE3B2", "#FFC83D", "#6FA8FF"][i % 4]}"/>`).join("")}
      <rect x="690" y="156" width="232" height="8" rx="4" fill="var(--line)"/>${T(806, 262, "14-day plan", { a: "middle", f: "sans", w: 800, s: 32 })}
      ${T(470, 328, "evidence first, then ideas", { a: "middle", c: MUTED })}</svg>`,
  };
  Object.assign(ills, mine);

  const hdrMascot = (mood) => mascot(112, mood, "position:absolute;right:var(--safe-x);top:var(--mascot-top)");
  const stepRow = (n, t, sub) => `<div class="card row" style="gap:20px;padding:16px 22px;border-radius:24px;align-items:center"><span style="flex:none;width:58px;height:58px;border-radius:50%;background:var(--accent);color:var(--on-accent);font:800 34px/58px var(--serif);text-align:center">${n}</span><div class="stack" style="gap:2px;min-width:0"><div style="font:800 34px/1.15 var(--sans)">${t}</div>${sub ? `<div style="font:500 30px/1.25 var(--sans);color:var(--muted)">${sub}</div>` : ""}</div></div>`;

  const layouts = {
    /* 1 · hook: Instagram → robot (+Ootto) → ChatGPT with a static data-flow */
    hookConnect(s, ctx) {
      const svg = `<svg viewBox="0 0 940 372" width="940" height="372">${arrowhead}
        ${igMark(0, 20, 220)}${T(110, 292, "Instagram", { a: "middle", f: "sans", w: 800, s: 34 })}
        ${gptMark(720, 20, 220)}${T(830, 292, "ChatGPT", { a: "middle", f: "sans", w: 800, s: 34 })}
        ${[0, 1].map((k) => packet(246 + k * 62, 84, k)).join("")}${[2, 0].map((k, i) => packet(582 + i * 62, 84, k)).join("")}
        ${flowDots(236, 372, 150)}${flowDots(568, 704, 150)}
        <use href="#mascot-wow" x="384" y="-6" width="172" height="198"/>
        <rect x="378" y="206" width="184" height="62" rx="31" fill="var(--accent)"/>${T(470, 248, "via Ootto", { a: "middle", c: ONA, w: 700 })}
        ${T(470, 336, "your data flows only where you authorize it", { a: "middle", c: MUTED })}</svg>`;
      return shell(ctx, s, `
        <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
        <h1 class="h1" style="margin-top:20px;font-size:104px">${fmt(s.title)}</h1>
        <p class="lede" style="margin-top:16px;font-size:34px;color:var(--muted)">${fmt(s.sub)}</p>
        <div class="grow stack" style="justify-content:center;min-height:0">${svg}</div>
        <div class="row gap16 center"><span class="pill solid" style="font-size:34px;padding:18px 32px">${esc(s.swipe)}</span></div>`);
    },

    /* 3 · Step 1: Ootto as a third-party connector */
    steps3(s, ctx) {
      const svg = `<svg viewBox="0 0 940 196" width="940" height="196">${arrowhead}
        ${rect(0, 10, 220, 164)}<use href="#mascot-happy" x="66" y="20" width="88" height="101"/>${T(110, 158, "You", { a: "middle", f: "sans", w: 800, s: 30 })}
        ${line(230, 92, 330, 92)}
        ${rect(340, 10, 260, 164, { fill: "var(--accent)", stroke: "none" })}${T(470, 96, "ootto.ai", { a: "middle", f: "sans", w: 800, s: 36, c: ONA })}${T(470, 136, "connector", { a: "middle", c: ONA, s: 28 })}
        ${line(610, 92, 710, 92)}
        ${rect(720, 10, 220, 164)}${igMark(780, 24, 100, "igs")}${T(830, 158, "Instagram", { a: "middle", f: "sans", w: 800, s: 30 })}</svg>`;
      return shell(ctx, s, `
        ${hdrMascot(s.mood)}
        <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
        <h2 class="h2" style="margin-top:16px;font-size:64px;max-width:780px">${fmt(s.title)}</h2>
        <p class="body" style="margin-top:8px;font-size:32px;color:var(--muted);max-width:770px">${fmt(s.lede)}</p>
        <div style="margin-top:14px">${svg}</div>
        <div class="stack" style="margin-top:14px;gap:12px">${s.steps.map((st, i) => stepRow(i + 1, fmt(st.t), st.d ? fmt(st.d) : "")).join("")}</div>
        <div class="grow"></div>
        ${s.src ? `<div class="src" style="margin-bottom:10px">${esc(s.src)}</div>` : ""}
        <div class="watch" style="padding:16px 24px;font-size:30px"><span class="tag">${esc(s.tag)}</span><span>${fmt(s.watch)}</span></div>`);
    },

    /* 4 · Step 2: the MCP endpoint, readable in a code-style box */
    setupMcp(s, ctx) {
      const svg = `<svg viewBox="0 0 940 150" width="940" height="150">${arrowhead}
        ${gptMark(0, 10, 130)}${T(150, 66, "ChatGPT", { f: "sans", w: 800, s: 32 })}${T(150, 106, "custom MCP server", { c: MUTED })}
        ${flowDots(400, 528, 76)}<rect x="406" y="22" width="116" height="44" rx="22" fill="var(--accent)"/>${T(464, 53, "OAuth", { a: "middle", c: ONA, w: 700, s: 28 })}
        ${ootto(540, 10, 130)}${T(690, 66, "Ootto", { f: "sans", w: 800, s: 32 })}${T(690, 106, "MCP endpoint", { c: MUTED })}</svg>`;
      return shell(ctx, s, `
        ${hdrMascot(s.mood)}
        <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
        <h2 class="h2" style="margin-top:16px;font-size:64px;max-width:780px">${fmt(s.title)}</h2>
        <div style="margin-top:12px">${svg}</div>
        <div class="code" style="margin-top:8px;white-space:normal;padding:20px 28px 24px;border-color:rgba(47,227,178,.5)"><div class="label" style="color:#2FE3B2;margin-bottom:8px">MCP server URL</div><div style="font:700 36px/1.2 var(--mono);color:#FFFFFF;word-break:break-all">${esc(s.endpoint)}</div></div>
        <div class="stack" style="margin-top:14px;gap:10px">${s.steps.map((t, i) => `<div class="row center gap16" style="font:600 32px/1.2 var(--sans)"><span style="flex:none;width:46px;height:46px;border-radius:50%;background:var(--accent);color:var(--on-accent);font:800 30px/46px var(--serif);text-align:center">${i + 1}</span><span>${fmt(t)}</span></div>`).join("")}</div>
        <div class="grow"></div>
        ${s.src ? `<div class="src" style="margin-bottom:10px">${esc(s.src)}</div>` : ""}
        <div class="watch" style="padding:16px 24px;font-size:30px"><span class="tag">${esc(s.tag)}</span><span>${fmt(s.watch)}</span></div>`);
    },

    /* 8 · cheat sheet + Follow-first CTA */
    finale(s, ctx) {
      const cell = (t, i) => `<div class="card row" style="gap:16px;padding:14px 18px;border-radius:22px;align-items:center"><span style="flex:none;width:52px;height:52px;border-radius:50%;background:var(--ink);color:#F4F1EA;font:800 30px/52px var(--serif);text-align:center">${i + 1}</span><div style="font:800 32px/1.15 var(--sans)">${esc(t)}</div></div>`;
      return shell(ctx, s, `
        <div class="kicker" style="color:var(--ink)"><span class="bar"></span>${esc(s.kicker)}</div>
        <h2 class="h2" style="margin-top:16px;font-size:66px">${fmt(s.title)}</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px">${s.steps.map(cell).join("")}</div>
        <div class="grow"></div>
        <div class="row" style="background:var(--ink);color:#F4F1EA;border-radius:30px;padding:22px 30px;gap:12px;align-items:center;box-shadow:0 10px 0 rgba(12,16,32,.28)">
          <div class="stack grow" style="gap:12px;min-width:0">
            <span class="label" style="font-size:28px;letter-spacing:.14em;color:#2FE3B2">${icon("follow")} Follow</span>
            <div style="font:800 72px/1 var(--serif);color:#FFFFFF">${esc(s.handle)}</div>
            <span class="pill" style="align-self:flex-start;background:#FF6A3D;color:#0C1020;border:none;font:800 34px/1 var(--sans);padding:16px 28px">${icon("plus")} ${esc(s.followBtn)}</span>
          </div>
          <div style="flex:none">${mascot(210, "cheer", "--m-head:#F4F1EA;--m-screen:#0C1020;--m-eye:#2FE3B2;--m-body:#F4F1EA;--m-ear:#FF6A3D")}</div>
        </div>
        <div class="row gap16" style="margin-top:14px">${s.actions.map((a) => `<div class="card row center" style="flex:1;gap:14px;padding:16px 20px;border-radius:22px"><span style="flex:none;width:50px;height:50px;border-radius:14px;background:var(--ink);color:#F4F1EA;display:flex;align-items:center;justify-content:center;font-size:30px">${icon(a.icon)}</span><div style="font:800 34px/1.15 var(--serif)">${esc(a.t)}</div></div>`).join("")}</div>`);
    },
  };
  return { layouts };
};
