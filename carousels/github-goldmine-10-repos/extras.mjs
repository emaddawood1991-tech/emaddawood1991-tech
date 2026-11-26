// Bespoke layouts for "10 GitHub repositories every AI builder should know".
// Visuals are real README content: images downloaded from the repos' own READMEs, or README text re-typeset in a window
// frame and labelled "README excerpt". Concept diagrams are labelled "Concept diagram". Nothing is a fake screenshot.
// GitHub star counts could not be verified (github.com blocked in this session), so none are shown.
export default (kit) => {
  const { T, line, arrowhead, MUTED, ACC, ONA, esc, fmt, icon, mascot, shell, codeBlock } = kit;
  const mTop = "position:absolute;right:var(--safe-x);top:var(--mascot-top)";
  const M = "assets/media/";

  /** window chrome: bar with dots, title, right tag */
  const rw = (title, tag, body, h, style = "") => `<div class="rw" style="height:${h}px;${style}"><div class="rwbar"><i></i><i></i><i></i><span class="t src">${esc(title)}</span>${tag ? `<span class="rt src">${esc(tag)}</span>` : ""}</div><div class="rwbody src" style="height:${h - 40}px">${body}</div></div>`;
  const pill = (t, cls = "") => `<span class="pill ${cls}" style="font-size:30px;padding:8px 18px;white-space:nowrap">${esc(t)}</span>`;

  /* ---------- visuals (README content) ---------- */
  const visuals = {
    api: (h) => {
      const rows = [["7Timer!", "No", "No"], ["AccuWeather", "apiKey", "No"], ["Aemet", "apiKey", "Yes"], ["AQICN", "apiKey", "Yes"]];
      const head = `<div class="xr xh src"><span>API</span><span>Auth</span><span>HTTPS</span></div>`;
      const body = rows.map(([n, a, s]) => `<div class="xr"><span class="xn">${esc(n)}</span><span class="xc ${a === "No" ? "ok" : "key"}">${esc(a)}</span><span class="xc ${s === "Yes" ? "ok" : "no"}">${esc(s)}</span></div>`).join("");
      return rw("README.md", "Excerpt", `<div class="src xt">### Weather</div>${head}${body}`, h);
    },
    mcp: (h) => {
      const ent = (n, tags, d) => `<div class="me"><div class="xn">${n}</div><div class="md">${tags} ${d}</div></div>`;
      const body = ent("modelcontextprotocol/server-filesystem", "📇 🏠", "Direct local file system access.") +
        ent("github/github-mcp-server", "📇 ☁️", "GitHub integration for repositories, pull requests, issues and more.") +

        `<div class="src xt" style="margin-top:6px">Legend: 🎖️ official · 📇 TypeScript · 🐍 Python · 🏠 local · ☁️ cloud</div>`;
      return rw("README.md", "Excerpt", body, h);
    },
    browser: (h) => {
      const st = (t, c) => `<div class="bs"><span class="bd"></span><div><div class="bt">${t}</div>${c ? `<div class="bc src">${c}</div>` : ""}</div></div>`;
      const body = st("task: “book the earliest driving test”") + st("model writes a cell", "new_tab(url); bu.click(41); js(...)") + st("REPL runs it on Chrome (CDP)", "output goes back to the model") + st("finish(result)");
      return rw("README.md", "Excerpt · how it works", `<div class="bl">${body}</div>`, h);
    },
    llm: (h) => {
      const w = (img, left, top, wd, rot, tag) => `<div style="position:absolute;left:${left}px;top:${top}px;transform:rotate(${rot}deg)">${rw(tag, "README", `<div class="gimg" style="background-image:url(${M}${img}.jpg)"></div>`, Math.round(wd * 0.5625) + 40, `width:${wd}px`)}</div>`;
      return `<div style="position:relative;height:${h}px">${w("llm-self-improving-agent-skills", 8, 34, 430, -2, "Agent skills")}${w("llm-ai-fraud-investigation", 470, 4, 430, 2, "AI agents")}${w("llm-project-graveyard", 200, 44, 500, 0, "Project Graveyard")}</div>`;
    },
    awesome: (h) => {
      const cats = ["Platforms", "Programming Languages", "Front-End Development", "Back-End Development", "Databases", "Security"];
      const body = `<div class="row" style="gap:22px;align-items:flex-start;flex-wrap:nowrap"><div class="alogo"><img src="${M}awesome-logo.svg" alt="Awesome logo" width="230"></div><div style="flex:1"><div class="src xt">## Contents</div><div class="cloud">${cats.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div></div>`;
      return rw("README.md", "Excerpt", body, h);
    },
    scrapling: (h) => {
      const code = codeBlock(["{{k:from}} scrapling.fetchers {{k:import}} Fetcher", "page = Fetcher.get(", "    {{s:'https://quotes.toscrape.com/'}})", "quotes = page.css(", "    {{s:'.quote .text::text'}}).getall()"], { dots: false, style: "padding:10px 14px;margin-top:8px;font-size:32px;border:none" });
      return rw("README.md", "Excerpt", `<img src="${M}scrapling-cover-dark.svg" alt="Scrapling cover" style="width:250px;display:block;border-radius:10px">${code}`, h, "");
    },
    free: (h) => {
      const r = (n, t) => `<div class="fr"><span class="xn">${n}</span><span class="fd">${t}</span></div>`;
      const body = `<div class="src xt">* Google Cloud Platform</div>${r("Cloud Run", "2 million requests per month")}${r("Cloud Functions", "2 million invocations per month")}<div class="rule">Free tier, not just a free trial</div>`;
      return rw("README.md", "Excerpt", body, h);
    },
    ollama: (h) => {
      const code = codeBlock(["{{m:# start}}", "{{p:$}} {{c:ollama}}", "{{m:# chat with a model}}", "{{p:$}} {{c:ollama}} run gemma4", "{{m:# launch Claude Code}}", "{{p:$}} {{c:ollama}} launch claude"], { dots: false, style: "padding:14px 16px;font-size:32px;border:none" });
      return rw("Terminal", "From the README", code, h, "");
    },
    langflow: (h) => {
      const nd = (x, y, w, t, hot) => `<rect x="${x}" y="${y}" width="${w}" height="76" rx="20" fill="${hot ? "#FF7A52" : "#1A2038"}" stroke="${hot ? "none" : "rgba(255,255,255,.2)"}" stroke-width="2"/>${T(x + w / 2, y + 49, t, { a: "middle", f: "sans", w: 800, s: 30, c: hot ? "#0C1020" : "#F4F1EA" })}`;
      const svg = `<svg viewBox="0 0 880 110" width="880" height="110">${arrowhead}${nd(0, 17, 190, "Chat input")}${line(196, 55, 226, 55)}${nd(232, 17, 170, "Agent", true)}${line(408, 55, 438, 55)}${nd(444, 17, 170, "Tools")}${line(620, 55, 650, 55)}${nd(656, 17, 224, "API / MCP")}</svg>`;
      return rw("Concept diagram", "Not a screenshot", `<img src="${M}langflow-logo.svg" alt="Langflow logo" style="width:300px;display:block;border-radius:10px;margin-bottom:14px">${svg}<div class="src xt" style="margin-top:8px">Desktop app: Windows · macOS</div>`, h);
    },
    openhands: (h) => {
      const chips = ["OpenHands", "Claude Code", "Codex", "Gemini", "Pi", "OpenCode"].map((n, i) => `<rect x="0" y="${i * 46}" width="206" height="40" rx="12" fill="#1A2038" stroke="rgba(255,255,255,.2)" stroke-width="2"/>${T(103, i * 46 + 29, n, { a: "middle", f: "sans", w: 700, s: 28, c: "#F4F1EA" })}`).join("");
      const be = ["Local", "Docker / VM", "Cloud"].map((n, i) => `<rect x="676" y="${i * 94 + 6}" width="204" height="72" rx="18" fill="#1A2038" stroke="#2FE3B2" stroke-width="3"/>${T(778, i * 94 + 51, n, { a: "middle", f: "sans", w: 700, s: 28, c: "#F4F1EA" })}`).join("");
      const svg = `<svg viewBox="0 0 880 280" width="880" height="280">${arrowhead}${chips}<rect x="300" y="77" width="250" height="126" rx="24" fill="#FF7A52"/>${T(425, 133, "Agent", { a: "middle", f: "sans", w: 800, s: 32, c: "#0C1020" })}${T(425, 173, "Canvas", { a: "middle", f: "sans", w: 800, s: 32, c: "#0C1020" })}${line(214, 140, 290, 140, { c: "#FF7A52" })}${line(560, 140, 666, 140, { c: "#FF7A52" })}${be}</svg>`;
      return rw("Concept diagram", "From the README text", svg, h);
    },
  };

  const layouts = {
    /* 1 · cinematic developer command center */
    commandCenter(s, ctx) {
      const card = (x, y, w, n, c, rot, hue) => `<div class="fc" style="left:${x}px;top:${y}px;width:${w}px;transform:rotate(${rot}deg);--h:${hue}"><div class="fcn">${esc(n)}</div><div class="fcc src">${esc(c)}</div></div>`;
      const term = (x, y, w, cmd, rot) => `<div class="ft" style="left:${x}px;top:${y}px;width:${w}px;transform:rotate(${rot}deg)"><div class="rwbar" style="height:34px"><i></i><i></i><i></i></div><div class="ftb"><span style="color:#2FE3B2">$</span> ${esc(cmd)}</div></div>`;
      const grid = (() => { let g = ""; for (let i = -9; i <= 9; i++) g += `<line x1="${470 + i * 28}" y1="300" x2="${470 + i * 120}" y2="520" />`; for (let j = 0; j < 6; j++) { const y = 300 + Math.pow(j / 5, 1.8) * 220; g += `<line x1="0" y1="${y}" x2="940" y2="${y}" />`; } return g; })();
      const links = `<g fill="none" stroke="url(#lg)" stroke-width="3.5" stroke-linecap="round" filter="url(#gl)">
        <path d="M385 200 C300 190 250 120 270 74"/><path d="M555 200 C650 190 690 120 676 74"/>
        <path d="M388 250 C300 260 250 250 262 246"/><path d="M552 250 C650 260 690 250 676 246"/>
        <path d="M430 330 C360 360 300 380 262 398"/><path d="M510 330 C580 360 640 380 676 398"/></g>
        <g fill="#2FE3B2"><circle cx="270" cy="74" r="7"/><circle cx="676" cy="74" r="7"/><circle cx="262" cy="246" r="7"/><circle cx="676" cy="246" r="7"/><circle cx="262" cy="398" r="7"/><circle cx="676" cy="398" r="7"/></g>`;
      const stage = `<div class="cc" style="position:relative;height:540px">
        <div class="ccglow"></div><div class="ccbeam"></div>
        <svg viewBox="0 0 940 540" width="940" height="540" style="position:absolute;left:0;top:0"><defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" stop-color="#FF7A52"/><stop offset="1" stop-color="#2FE3B2"/></linearGradient><filter id="gl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <g stroke="rgba(47,227,178,.28)" stroke-width="1.5">${grid}</g>${links}
          <ellipse cx="470" cy="440" rx="170" ry="26" fill="rgba(255,122,82,.22)"/><ellipse cx="470" cy="440" rx="120" ry="16" fill="none" stroke="#FF7A52" stroke-width="3"/></svg>
        <div style="position:absolute;left:325px;top:84px;filter:drop-shadow(0 0 34px rgba(255,122,82,.55))">${mascot(290, "wow")}</div>
        ${card(0, 20, 290, "public-apis", "API DIRECTORY", -4, "255,122,82")}
        ${card(660, 12, 280, "OpenHands", "CODING AGENTS", 3.5, "47,227,178")}
        ${card(8, 206, 262, "langflow", "WORKFLOW", -2.5, "47,227,178")}
        ${card(670, 196, 262, "Scrapling", "WEB SCRAPING", 3, "255,122,82")}
        ${term(0, 430, 410, "ollama run gemma4", -2)}
        ${term(520, 424, 410, "uv run langflow run", 2)}
      </div>`;
      return shell(ctx, s, `
        <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
        <h1 class="h1" style="margin-top:12px;font-size:84px;line-height:1.02">${fmt(s.title)}</h1>
        <p class="lede" style="margin-top:12px;font-size:32px;color:var(--muted)">${fmt(s.sub)}</p>
        <div style="margin-top:14px">${stage}</div>
        <div class="grow"></div>
        <div class="row gap16 center"><span class="pill solid" style="font-size:30px;padding:14px 26px">${esc(s.swipe)}</span><span class="pill" style="font-size:30px;padding:14px 22px">${esc(s.chip)}</span></div>`);
    },

    /* 2–11 · one repository per slide */
    repo(s, ctx) {
      const v = s.variant || "stack", H = s.vh || { stack: 350, cards: 370, hero: 420 }[v];
      const vis = visuals[s.visual](H);
      const mas = s.mood && v !== "hero" ? mascot(104, s.mood, mTop) : "";
      const meta = `<div class="row" style="gap:10px;flex-wrap:nowrap">${pill(s.type, "")}${s.license ? pill(s.license, "") : ""}</div>`;
      const topRow = `<div class="row center" style="justify-content:space-between;flex-wrap:nowrap;gap:12px;max-width:${mas ? 760 : 940}px"><div class="kicker"><span class="bar" style="width:30px"></span>${esc(s.cat)}</div>${meta}</div>`;
      const name = `<h2 class="h2" style="margin-top:10px;font-size:${s.nameSize || 78}px;max-width:790px">${fmt(s.name)}</h2>`;
      const explain = `<p class="lede" style="margin-top:8px;font-size:32px;line-height:1.3;max-width:${mas ? 790 : 940}px">${fmt(s.explain)}</p>`;
      const example = `<div class="card" style="padding:14px 20px;border-radius:20px;margin-top:12px"><div class="label" style="color:var(--accent-t)">Example</div><div style="margin-top:6px;font:500 30px/1.28 var(--sans)">${fmt(s.example)}</div></div>`;
      const why = `<div class="why" style="margin-top:12px"><div class="label" style="color:inherit;opacity:.9">Why it matters</div><div style="margin-top:6px;font:600 30px/1.28 var(--sans)">${fmt(s.why)}</div></div>`;
      const cards = `<div class="row" style="gap:14px;align-items:stretch;flex-wrap:nowrap;margin-top:12px"><div class="card" style="flex:1;min-width:0;padding:14px 18px;border-radius:20px"><div class="label" style="color:var(--accent-t)">Example</div><div style="margin-top:6px;font:500 30px/1.28 var(--sans)">${fmt(s.example)}</div></div><div class="why" style="flex:1;min-width:0;margin:0"><div class="label" style="color:inherit;opacity:.9">Why it matters</div><div style="margin-top:6px;font:600 30px/1.28 var(--sans)">${fmt(s.why)}</div></div></div>`;
      const note = s.note ? `<div class="src" style="margin-top:10px">${esc(s.note)}</div>` : "";
      const url = `<div class="row center" style="gap:12px;flex-wrap:nowrap"><span class="pill solid" style="font-size:30px;padding:12px 18px;white-space:nowrap"><span style="width:30px;height:30px;display:inline-flex">${icon("code", 'style="width:30px;height:30px"')}</span>${esc(s.url)}</span>${s.extra ? `<span class="pill" style="font-size:30px;padding:12px 18px;white-space:nowrap">${esc(s.extra)}</span>` : ""}</div>`;
      let inner;
      if (v === "stack") inner = `${mas}${topRow}${name}${explain}<div style="margin-top:12px">${vis}</div>${note}${example}${why}<div class="grow"></div>${url}`;
      else if (v === "cards") inner = `${mas}${topRow}${name}${explain}<div style="margin-top:12px">${vis}</div>${note}${cards}<div class="grow"></div>${url}`;
      else inner = `<div>${vis}</div>${note}<div style="margin-top:14px">${topRow}</div>${name}${explain}${example}${why}<div class="grow"></div>${url}`;
      return shell(ctx, s, inner);
    },
  };

  const css = `
.rw{border-radius:18px;overflow:hidden;background:#0F1424;box-shadow:0 30px 56px -18px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.14);color:#E8EAF4}
.rwbar{display:flex;align-items:center;gap:8px;height:40px;padding:0 16px;background:#252A3A;color:#E8EAF4;white-space:nowrap}
.rwbar i{width:12px;height:12px;border-radius:50%;background:#FF7A52;flex:none}.rwbar i:nth-child(2){background:#F5C451}.rwbar i:nth-child(3){background:#2FE3B2}
.rwbar .t{margin-left:10px;color:#E8EAF4}.rwbar .rt{margin-left:auto;color:#2FE3B2}
.rwbody{padding:14px 20px;overflow:hidden}
.rw .src{color:#B9C0DA}
.xt{font-size:26px;margin-bottom:6px}
.xr{display:grid;grid-template-columns:1fr 150px 130px;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.1)}
.xh{border-bottom:2px solid rgba(255,255,255,.25)}
.xn{font:700 28px/1.2 var(--mono);color:#FF9A78}
.xc{font:700 26px/1 var(--mono);padding:6px 10px;border-radius:10px;text-align:center;width:fit-content}
.xc.ok{background:#2FE3B2;color:#0C1020}.xc.key{background:#FF7A52;color:#0C1020}.xc.no{background:#3A4262;color:#F4F1EA}
.me{padding:7px 0;border-bottom:1px solid rgba(255,255,255,.1)}.md{font:500 28px/1.25 var(--sans);color:#E8EAF4;margin-top:2px}
.bl{position:relative;padding-left:6px}.bl::before{content:"";position:absolute;left:19px;top:20px;bottom:20px;width:3px;background:linear-gradient(#FF7A52,#2FE3B2)}
.bs{display:flex;gap:18px;align-items:flex-start;padding:5px 0;position:relative}.bd{width:30px;height:30px;border-radius:50%;background:#FF7A52;box-shadow:0 0 18px #FF7A52;flex:none;margin-top:2px;border:5px solid #0F1424;outline:3px solid #FF7A52}
.bt{font:700 31px/1.25 var(--sans);color:#F4F1EA}.bc{font-size:28px!important;color:#2FE3B2!important;margin-top:2px}
.gimg{width:100%;height:100%;background-size:cover;background-position:center}
.alogo{background:#FFFBF2;border-radius:14px;padding:16px;flex:none}
.cloud{display:flex;flex-wrap:wrap;gap:10px}.cloud span{font:600 28px/1 var(--sans);background:#1F2640;border:2px solid rgba(255,255,255,.18);border-radius:999px;padding:9px 16px;color:#F4F1EA}
.fr{padding:8px 0;border-bottom:1px solid rgba(255,255,255,.1)}.fd{display:block;font:500 28px/1.25 var(--sans);color:#E8EAF4}
.rule{margin-top:10px;display:inline-block;background:#2FE3B2;color:#0C1020;font:700 28px/1 var(--sans);padding:10px 16px;border-radius:12px}
.why{border-radius:20px;padding:14px 20px;background:var(--accent);color:var(--on-accent)}
.why .label{color:var(--on-accent)}
.cc .ccglow{position:absolute;left:150px;top:30px;width:640px;height:440px;background:radial-gradient(ellipse at 50% 55%,rgba(255,122,82,.38),rgba(47,227,178,.10) 55%,transparent 72%)}
.cc .ccbeam{position:absolute;left:330px;top:-10px;width:280px;height:420px;background:linear-gradient(180deg,rgba(255,255,255,.16),transparent 90%);clip-path:polygon(40% 0,60% 0,100% 100%,0 100%);opacity:.55}
.fc{position:absolute;background:#141A2E;border:2px solid rgba(255,255,255,.16);border-radius:16px;padding:12px 16px;box-shadow:0 0 28px rgba(var(--h),.35),0 22px 36px -14px rgba(0,0,0,.7)}
.fcn{font:800 30px/1.1 var(--mono);color:#F4F1EA}.fcc{margin-top:6px;color:rgb(var(--h))!important;letter-spacing:.1em}
.ft{position:absolute;background:#0A0E1B;border:2px solid rgba(47,227,178,.5);border-radius:14px;overflow:hidden;box-shadow:0 0 30px rgba(47,227,178,.25),0 20px 34px -12px rgba(0,0,0,.7)}
.ft .rwbar{background:#1B2136}.ftb{font:600 30px/1 var(--mono);color:#F4F1EA;padding:14px 16px 16px;white-space:nowrap}
#slide-01::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.018) 0 2px,transparent 2px 5px)}
`;
  return { layouts, css };
};
