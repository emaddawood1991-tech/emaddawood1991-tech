// Bespoke layouts for "Claude Code + WhatsApp AI agent with Kapso".
// Facts come from the official gokapso/agent-skills repo (README, SKILL.md files, references); see sources.md.
// Chat/calendar visuals are ILLUSTRATIVE and labelled as such. Brand marks are simplified glyphs unless the user
// drops official files into assets/brand-whatsapp.svg, brand-kapso.svg, brand-claude-code.svg (auto-used).
import fs from "node:fs";
export default (kit) => {
  const { T, line, arrowhead, MUTED, ACC, ONA, esc, fmt, icon, mascot, shell, codeBlock } = kit;
  const mTop = "position:absolute;right:var(--safe-x);top:var(--mascot-top)";
  const hasBrand = (n) => fs.existsSync(new URL(`./assets/brand-${n}.svg`, import.meta.url));

  /* ---------- brand marks (simplified glyphs; official SVG auto-used when present) ---------- */
  const waGlyph = (s = 44) => hasBrand("whatsapp") ? `<img src="assets/media/brand-whatsapp.svg" width="${s}" height="${s}" alt="WhatsApp">` :
    `<svg width="${s}" height="${s}" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#25D366"/><path d="M24 11a13 13 0 0 0-11 19.7L11 37l6.5-1.7A13 13 0 1 0 24 11z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M19.5 18.5c.5-1 1.200-1 1.700-.9l1 2.300c.1.500-.8 1.300-.8 1.300s.9 2 3 3 2.200-.1 2.200-.1.900-.9 1.300-.8l2.100 1c.3.600-.3 2-1.400 2.600-1.600.9-4.200-.2-6.500-2.500s-3.200-5-2.600-6.900z" fill="#fff"/></svg>`;
  const claudeGlyph = (s = 44) => hasBrand("claude-code") ? `<img src="assets/media/brand-claude-code.svg" width="${s}" height="${s}" alt="Claude Code">` :
    `<svg width="${s}" height="${s}" viewBox="0 0 48 48"><g stroke="#D97757" stroke-width="5" stroke-linecap="round"><path d="M24 5v38M5 24h38M10.500 10.500l27 27M37.500 10.500l-27 27"/></g><circle cx="24" cy="24" r="4" fill="#D97757"/></svg>`;
  const kapsoMark = (s = 44) => hasBrand("kapso") ? `<img src="assets/media/brand-kapso.svg" height="${s}" alt="Kapso">` :
    `<span class="kmark">kapso</span>`;
  const brandPill = (g, label) => `<span class="bp">${g}<span>${esc(label)}</span></span>`;

  /* ---------- WhatsApp chat mockup (illustrative) ---------- */
  const chat = (msgs, o = {}) => {
    const b = (m) => `<div class="wb ${m.who}"><div class="wt">${esc(m.t)}</div><div class="wm src">${esc(m.time)}${m.who === "out" ? " ✓✓" : ""}</div></div>`;
    return `<div class="wa" style="${o.style || ""}"><div class="wah"><span class="wav">${waGlyph(34)}</span><div><div class="wan">${esc(o.name || "Your Business")}</div><div class="wao src">Illustrative chat</div></div></div><div class="wbody">${msgs.map(b).join("")}</div></div>`;
  };

  const hdr = (s, mood, size = 62) => `${mascot(104, mood || "happy", mTop)}<div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
    <h2 class="h2" style="margin-top:12px;font-size:${size}px;max-width:790px">${fmt(s.title)}</h2>`;
  const note = (tag, text, st = "") => `<div class="watch" style="padding:14px 22px;font-size:30px;${st}"><span class="tag">${esc(tag)}</span><span>${fmt(text)}</span></div>`;
  const box = (x, y, w, h, lines, o = {}) => {
    const fill = o.hot ? "#FF7A52" : o.ghost ? "none" : "var(--card)";
    const stroke = o.hot ? "none" : "var(--line)";
    const txt = lines.map((l, i) => T(x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * 32 + 10, l, { a: "middle", f: "sans", w: 800, s: o.s || 28, c: o.hot ? "#0C1020" : "var(--fg)" })).join("");
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${fill}" stroke="${stroke}" stroke-width="${o.ghost ? 3 : 2}" ${o.dash ? 'stroke-dasharray="9 9"' : ""}/>${txt}`;
  };

  const layouts = {
    /* 1 · hook: chat ↔ agent */
    hookChat(s, ctx) {
      const stage = `<div style="position:relative;height:410px">
        <div class="hglow"></div>
        <svg viewBox="0 0 940 392" width="940" height="392" style="position:absolute;left:0;top:0"><defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stop-color="#25D366"/><stop offset=".5" stop-color="#FF7A52"/><stop offset="1" stop-color="#2FE3B2"/></linearGradient><filter id="hf"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <path d="M470 150 C530 110 560 110 600 150" fill="none" stroke="url(#hg)" stroke-width="4" stroke-dasharray="3 12" stroke-linecap="round" filter="url(#hf)"/>
          <path d="M470 250 C530 292 560 292 600 252" fill="none" stroke="url(#hg)" stroke-width="4" stroke-dasharray="3 12" stroke-linecap="round" filter="url(#hf)"/>
          <circle cx="470" cy="150" r="7" fill="#25D366"/><circle cx="470" cy="250" r="7" fill="#25D366"/><circle cx="600" cy="150" r="7" fill="#2FE3B2"/><circle cx="600" cy="252" r="7" fill="#2FE3B2"/></svg>
        ${chat([{ who: "in", t: "Can I book Saturday at 3:30?", time: "10:41" }, { who: "out", t: "3:30 PM is available. Want me to confirm it?", time: "10:41" }, { who: "in", t: "Yes please", time: "10:42" }], { style: "position:absolute;left:0;top:4px;width:500px;transform:rotate(-1.5deg)" })}
        <div style="position:absolute;left:650px;top:70px;filter:drop-shadow(0 0 30px rgba(255,122,82,.55))">${mascot(250, "wow")}</div>
      </div>`;
      return shell(ctx, s, `
        <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
        <h1 class="h1" style="margin-top:12px;font-size:78px;line-height:1.02">${fmt(s.title)}</h1>
        <p class="lede" style="margin-top:12px;font-size:34px;font-weight:700;font-family:var(--mono);color:var(--accent-t)">${esc(s.sub)}</p>
        <p class="lede" style="margin-top:8px;font-size:32px;color:var(--muted);text-wrap:balance">${esc(s.hook)}</p>
        <div style="margin-top:12px">${stage}</div>
        <div class="grow"></div>
        <div class="row center" style="gap:10px;flex-wrap:nowrap">${brandPill(waGlyph(34), "WhatsApp")}${brandPill(kapsoMark(30), "")}${brandPill(claudeGlyph(34), "Claude Code")}</div>`);
    },

    /* 2 · six jobs */
    sixJobs(s, ctx) {
      const card = (c) => `<div class="jc ${c.setup ? "su" : ""}"><span class="jci">${icon(c.icon, 'style="width:44px;height:44px"')}</span><div class="jct">${esc(c.t)}</div>${c.setup ? `<span class="jcs src">Needs setup</span>` : `<span class="jcs ok src">Core</span>`}</div>`;
      return shell(ctx, s, `${hdr(s, s.mood)}
        <p class="body" style="margin-top:8px;font-size:32px;color:var(--muted)">${fmt(s.lede)}</p>
        <div class="jg">${s.cards.map(card).join("")}</div>
        <div class="grow"></div>${note("Heads up", s.watch)}`);
    },

    /* 3 · architecture */
    architecture(s, ctx) {
      const nodes = ["Customer", "WhatsApp", "Kapso", "Workflow", "AI model"];
      const nx = (i) => i * 194;
      const row = nodes.map((n, i) => box(nx(i), 0, 160, 110, [n], { hot: i === 2 })).join("") + [0, 1, 2, 3].map((i) => line(nx(i) + 166, 55, nx(i + 1) - 6, 55)).join("");
      const back = `<path d="M${nx(4) + 80} 118 L${nx(4) + 80} 176 L${nx(0) + 80} 176 L${nx(0) + 80} 124" fill="none" stroke="var(--accent-t)" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 10" marker-end="url(#ah)"/>${T(112, 160, "Reply goes back the same way", { a: "start", f: "sans", w: 700, s: 28, c: "var(--fg)" })}`;
      const tools = ["Calendar", "Business FAQ", "Booking database", "Human support"];
      const tw = 218, tx = (i) => i * 239;
      const trow = tools.map((t, i) => box(tx(i), 300, tw, 110, t.split(" ").length > 1 && t.length > 12 ? t.split(" ") : [t], { dash: true, ghost: true, s: 28 })).join("") + tools.map((t, i) => `<path d="M${tx(i) + tw / 2} 300 L${tx(i) + tw / 2} 252 L${nx(3) + 80} 252 L${nx(3) + 80} 118" fill="none" stroke="var(--line)" stroke-width="3" stroke-dasharray="6 8"/>`).join("");
      const svg = `<svg viewBox="0 0 936 416" width="936" height="416">${arrowhead}${trow}${row}${back}</svg>`;
      return shell(ctx, s, `${hdr(s, s.mood)}
        <p class="body" style="margin-top:8px;font-size:32px;color:var(--muted);max-width:790px">${fmt(s.lede)}</p>
        <div style="margin-top:44px">${svg}</div>
        <div class="grow"></div>${note("Who does what", s.watch)}`);
    },

    /* 4 · connect number */
    connect(s, ctx) {
      const row = (r, i) => `<div class="sr"><span class="sn">${i + 1}</span><div><div class="st">${fmt(r.t)}</div><div class="sd">${fmt(r.d)}</div></div></div>`;
      return shell(ctx, s, `${hdr(s, s.mood, 56)}
        <div style="margin-top:12px">${s.rows.map(row).join("")}</div>
        <div class="grow"></div>${note("Depends on", s.watch)}`);
    },

    /* 5 · install skills */
    skills(s, ctx) {
      const sk = (k) => `<div class="kc"><div class="kcn">${esc(k.n)}</div><div class="kcd">${esc(k.d)}</div></div>`;
      return shell(ctx, s, `${hdr(s, s.mood, 56)}
        ${codeBlock(s.code, { dots: true, style: "margin-top:14px;padding:18px 24px;flex:none;font-size:34px" })}
        <div class="src" style="margin-top:8px">Verified in the official README · alpha, changes quickly</div>
        <div style="margin-top:12px">${s.skills.map(sk).join("")}</div>
        <div class="grow"></div>${note("Not a bot yet", s.watch)}`);
    },

    /* 6 · configure */
    configure(s, ctx) {
      const c = (x) => `<div class="cf"><div class="cfl label">${esc(x.l)}</div><div class="cft">${fmt(x.t)}</div></div>`;
      return shell(ctx, s, `${hdr(s, s.mood, 56)}
        ${codeBlock(s.code, { dots: true, style: "margin-top:44px;padding:16px 22px;flex:none;font-size:32px" })}
        <div style="margin-top:12px">${s.cards.map(c).join("")}</div>
        <div class="grow"></div>${note("Never", s.watch)}`);
    },

    /* 7 · AI workflow flowchart */
    flow(s, ctx) {
      const W = 270, H = 112, gx = 63;
      const X = [0, W + gx, 2 * (W + gx)], Y = [0, 206, 412];
      const n = (x, y, l, o) => box(x, y, W, H, l, { s: 28, ...o });
      const A = (x1, y1, x2, y2) => line(x1, y1, x2, y2);
      const nodes = n(X[0], Y[0], ["1  Incoming", "message"]) + n(X[1], Y[0], ["2  Identify", "the request"]) + n(X[2], Y[0], ["3  Retrieve", "business info"]) +
        n(X[2], Y[1], ["4  Check calendar", "(if booking)"], { hot: true }) + n(X[1], Y[1], ["5  Generate", "the response"]) + n(X[0], Y[1], ["6  Confirm booking", "(if authorized)"]) +
        n(X[0], Y[2], ["7  Send WhatsApp", "reply"], { hot: true });
      const arrows = A(X[0] + W + 4, Y[0] + 56, X[1] - 4, Y[0] + 56) + A(X[1] + W + 4, Y[0] + 56, X[2] - 4, Y[0] + 56) + A(X[2] + W / 2, Y[0] + H + 4, X[2] + W / 2, Y[1] - 4) +
        A(X[2] - 4, Y[1] + 56, X[1] + W + 4, Y[1] + 56) + A(X[1] - 4, Y[1] + 56, X[0] + W + 4, Y[1] + 56) + A(X[0] + W / 2, Y[1] + H + 4, X[0] + W / 2, Y[2] - 4);
      const hand = `<rect x="${X[1]}" y="${Y[2]}" width="${W + gx + W}" height="${H}" rx="22" fill="none" stroke="var(--accent-t)" stroke-width="3" stroke-dasharray="9 9"/>${T(X[1] + (W * 2 + gx) / 2, Y[2] + 50, "Unsure or sensitive?", { a: "middle", f: "sans", w: 800, s: 30, c: "var(--fg)" })}${T(X[1] + (W * 2 + gx) / 2, Y[2] + 92, "→ Human handoff", { a: "middle", f: "sans", w: 800, s: 30, c: "var(--accent-t)" })}<path d="M${X[1] + W / 2} ${Y[1] + H} L${X[1] + W / 2} ${Y[2] - 4}" fill="none" stroke="var(--accent-t)" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" marker-end="url(#ah)"/>`;
      const svg = `<svg viewBox="0 0 936 524" width="936" height="524">${arrowhead}${arrows}${nodes}${hand}</svg>`;
      return shell(ctx, s, `${hdr(s, s.mood)}
        <div style="margin-top:60px">${svg}</div>
        <div class="grow"></div>${note("In Kapso", s.watch)}`);
    },

    /* 8 · example: chat + calendar */
    chatCal(s, ctx) {
      const msgs = [{ who: "in", t: "Can I book Saturday at 3:30?", time: "10:41" }, { who: "out", t: "Let me check availability.", time: "10:41" }, { who: "out", t: "3:30 PM is available. Would you like to confirm?", time: "10:41" }, { who: "in", t: "Yes.", time: "10:42" }, { who: "out", t: "Your appointment is confirmed!", time: "10:42" }];
      const cal = `<div class="cal"><div class="calh src">Calendar · illustrative</div><div class="cald">Saturday</div><div class="calt">3:30 PM</div><div class="cale"><span class="cdot"></span><div><div class="cn">Appointment</div><div class="cm src">Booked via WhatsApp agent</div></div></div><div class="calc">Confirmed</div></div>`;
      return shell(ctx, s, `${hdr(s, s.mood, 56)}
        <div class="row" style="gap:16px;align-items:flex-start;flex-wrap:nowrap;margin-top:26px">${chat(msgs, { style: "width:560px;flex:none" })}<div style="flex:1;min-width:0">${cal}</div></div>
        <div class="grow"></div>${note("Illustrative", s.watch)}`);
    },

    /* 9 · pricing + rules */
    pricing(s, ctx) {
      const c = (x) => `<div class="pc"><div class="pct">${esc(x.t)}</div><div class="pcd">${fmt(x.d)}</div></div>`;
      return shell(ctx, s, `${hdr(s, s.mood, 60)}
        <div class="pgx">${s.cards.map(c).join("")}</div>
        <div class="rule2" style="margin-top:16px"><div class="label" style="color:inherit">WhatsApp rules</div><div style="margin-top:6px;font:600 30px/1.28 var(--sans)">${fmt(s.rules)}</div></div>
        <div class="grow"></div>${note("Pricing", s.watch)}`);
    },

    /* 10 · checklist + CTA */
    setup(s, ctx) {
      const it = (x) => `<div class="ck"><span class="ckb">${icon("check", 'style="width:30px;height:30px"')}</span><span class="ckt">${esc(x)}</span></div>`;
      return shell(ctx, s, `${hdr(s, s.mood, 58)}
        <div class="ckg">${s.items.map(it).join("")}</div>
        <div class="grow"></div>
        <div class="row center" style="gap:12px;flex-wrap:nowrap"><span class="pill solid" style="font-size:30px;padding:14px 24px;white-space:nowrap">${esc(s.cta[0])}</span></div>
        <div class="row center" style="gap:12px;flex-wrap:nowrap;margin-top:10px"><span class="pill" style="font-size:30px;padding:12px 22px;white-space:nowrap">${esc(s.cta[1])}</span></div>`);
    },
  };

  const css = `
.kmark{font:800 34px/1 var(--sans);letter-spacing:-.02em;color:#F4F1EA}
.bp{display:inline-flex;align-items:center;gap:10px;background:#141A2E;border:2px solid rgba(255,255,255,.18);border-radius:999px;padding:10px 18px;font:700 30px/1 var(--sans);color:#F4F1EA;white-space:nowrap}
.hglow{position:absolute;left:230px;top:20px;width:700px;height:360px;background:radial-gradient(ellipse at 60% 50%,rgba(255,122,82,.35),rgba(37,211,102,.10) 55%,transparent 72%)}
.wa{border-radius:22px;overflow:hidden;background:#0B141A;box-shadow:0 30px 56px -18px rgba(0,0,0,.65),0 0 0 2px rgba(255,255,255,.12)}
.wah{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#202C33;color:#E9EDEF}
.wav{display:inline-flex;flex:none}.wan{font:700 30px/1.1 var(--sans)}.wao{color:#A9B8C1!important;margin-top:2px}
.wbody{padding:14px 14px 18px;display:flex;flex-direction:column;gap:10px;background:#0B141A}
.wb{max-width:92%;padding:8px 14px 6px;border-radius:16px;color:#E9EDEF}
.wb.in{align-self:flex-start;background:#202C33;border-top-left-radius:4px}
.wb.out{align-self:flex-end;background:#005C4B;border-top-right-radius:4px}
.wt{font:500 30px/1.25 var(--sans)}.wm{text-align:right;color:#CDE9E0!important;margin-top:2px}.wb.in .wm{color:#A9B8C1!important}
.jg{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.jc{background:var(--card);border:2px solid var(--line);border-radius:24px;padding:14px 18px;display:flex;flex-direction:column;gap:8px;min-height:150px}
.jci{width:60px;height:60px;border-radius:18px;background:var(--accent);color:var(--on-accent);display:inline-flex;align-items:center;justify-content:center}
.jct{font:800 31px/1.18 var(--sans)}
.jcs{align-self:flex-start;border-radius:999px;padding:5px 12px;border:2px dashed var(--accent-t);color:var(--accent-t);font-weight:700}
.jcs.ok{border-style:solid;border-color:#0E9F7E;color:#0E7A5F}
.sr{display:flex;gap:18px;align-items:center;padding:22px 0;border-bottom:2px solid var(--line)}
.sn{width:56px;height:56px;border-radius:50%;background:var(--accent);color:var(--on-accent);font:800 32px/56px var(--sans);text-align:center;flex:none}
.st{font:800 33px/1.15 var(--sans)}.sd{font:500 30px/1.25 var(--sans);color:var(--muted);margin-top:2px}
.kc{background:#141A2E;border:2px solid rgba(255,255,255,.16);border-radius:20px;padding:12px 20px;margin-top:10px}
.kcn{font:800 32px/1.1 var(--mono);color:#FF9A78}.kcd{font:500 30px/1.25 var(--sans);color:#F4F1EA;margin-top:4px}
.cf{background:var(--card);border:2px solid var(--line);border-radius:20px;padding:12px 20px;margin-top:10px}
.cft{font:600 30px/1.28 var(--sans);margin-top:4px}
.cal{background:#FFFBF2;color:#0C1020;border-radius:24px;padding:18px 20px;box-shadow:0 30px 56px -18px rgba(0,0,0,.5);border:2px solid rgba(12,16,32,.12)}
.cal .src{color:#4F546B}.calh{text-transform:uppercase;letter-spacing:.08em}
.cald{font:800 40px/1.1 var(--serif);margin-top:12px}.calt{font:800 52px/1.1 var(--serif);color:#A8330A;margin-top:4px}
.cale{display:flex;gap:12px;align-items:flex-start;margin-top:16px;background:#FFF1E8;border-radius:16px;padding:12px 14px;border-left:8px solid #FF7A52}
.cdot{width:16px;height:16px;border-radius:50%;background:#FF7A52;margin-top:10px;flex:none}.cn{font:800 31px/1.15 var(--sans)}.cm{margin-top:2px}
.calc{margin-top:16px;display:inline-block;background:#2FE3B2;color:#0C1020;font:800 30px/1 var(--sans);padding:10px 18px;border-radius:999px}
.pgx{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:46px}
.pc{background:var(--card);border:2px solid var(--line);border-radius:22px;padding:18px 20px;min-height:200px}
.pct{font:800 31px/1.15 var(--sans);color:var(--accent-t)}.pcd{font:500 30px/1.25 var(--sans);margin-top:6px}
.rule2{background:var(--accent);color:var(--on-accent);border-radius:22px;padding:14px 20px}
.ckg{display:grid;grid-template-columns:1fr;gap:10px;margin-top:14px}
.ck{display:flex;align-items:center;gap:16px;background:var(--card);border:2px solid var(--line);border-radius:18px;padding:10px 18px}
.ckb{width:44px;height:44px;border-radius:12px;background:#2FE3B2;color:#0C1020;display:inline-flex;align-items:center;justify-content:center;flex:none}
.ckt{font:700 31px/1.2 var(--sans)}
`;
  return { layouts, css };
};
