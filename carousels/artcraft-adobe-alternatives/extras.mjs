// Bespoke layouts for "Free Adobe alternatives built with AI — meet ArtCraft".
// Every software image is a REAL screenshot taken from the official storytold/* GitHub READMEs (see sources.md).
// Insets are crops of the same screenshot. Nothing in this file draws fake software UI.
export default (kit) => {
  const { T, line, arrowhead, MUTED, ACC, ONA, esc, fmt, icon, mascot, shell, renderDiagram } = kit;
  const mTop = "position:absolute;right:var(--safe-x);top:var(--mascot-top)";
  const M = "assets/media/";
  // intrinsic sizes of the downsized screenshots in assets/ (used to compute crop insets)
  const SRC = {
    photocraft: [1800, 1125], vectorcraft: [1800, 1125], filmcraft: [1800, 964], lightcraft: [1800, 1125],
    effectcraft: [1800, 1093], pdfcraft: [1600, 1000], designcraft: [1600, 1000],
  };
  const hdr = (s, mood, size = 62) => `${mascot(104, mood || "happy", mTop)}<div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
    <h2 class="h2" style="margin-top:12px;font-size:${size}px;max-width:790px">${fmt(s.title)}</h2>`;

  /** window chrome around a real screenshot */
  const win = (img, w, label, o = {}) => {
    const [iw, ih] = SRC[img], h = Math.round((w * ih) / iw);
    const pos = o.pos || "50% 0";
    return `<div class="aw" style="width:${w}px;${o.style || ""}"><div class="awbar"><i></i><i></i><i></i><span class="t src">${esc(label)}</span>${o.tag ? `<span class="rt src">${esc(o.tag)}</span>` : ""}</div>
      <div class="awimg" style="height:${o.h || h}px;background-image:url(${M}${img}.jpg);background-size:${o.h ? "cover" : "100% 100%"};background-position:${pos}"></div></div>`;
  };
  /** zoomed crop (fractions of the source screenshot) shown as a floating panel */
  const inset = (img, c, w, label, style) => {
    const [iw, ih] = SRC[img], h = Math.round((w * c.fh * ih) / (c.fw * iw));
    const bw = w / c.fw, bh = (bw * ih) / iw;
    return `<div class="ains" style="width:${w}px;${style}"><div class="aimg" style="height:${h}px;background-image:url(${M}${img}.jpg);background-size:${bw}px ${bh}px;background-position:${-c.fx * bw}px ${-c.fy * bh}px"></div><span class="atag src">${esc(label)}</span></div>`;
  };
  const statusChip = (txt, kind = "hot") => `<span class="pill ${kind === "hot" ? "solid" : ""}" style="font-size:30px;padding:10px 14px;white-space:nowrap"><span class="adot"></span>${esc(txt)}</span>`;

  const layouts = {
    /* 1 · hook: layered collage of four real windows */
    collage(s, ctx) {
      const stage = `<div style="position:relative;height:536px">
        <div style="position:absolute;left:0;top:6px;transform:rotate(-3deg)">${win("filmcraft", 520, "FilmCraft", { pos: "50% 0" })}</div>
        <div style="position:absolute;right:0;top:0;transform:rotate(2.5deg)">${win("effectcraft", 470, "EffectCraft")}</div>
        <div style="position:absolute;left:300px;top:96px;transform:rotate(-1.5deg)">${win("vectorcraft", 430, "VectorCraft")}</div>
        <div style="position:absolute;left:36px;top:178px;transform:rotate(1.2deg)">${win("photocraft", 500, "PhotoCraft")}</div>
        <div style="position:absolute;right:0;bottom:0">${mascot(160, "wow")}</div>
      </div>`;
      return shell(ctx, s, `
        <div class="kicker"><span class="bar"></span>${esc(s.kicker)}</div>
        <h1 class="h1" style="margin-top:14px;font-size:84px;line-height:1.02">${fmt(s.title)}</h1>
        <p class="lede" style="margin-top:12px;font-size:34px;color:var(--muted)">${fmt(s.sub)}</p>
        <div style="margin-top:22px">${stage}</div>
        <div class="grow"></div>
        <div class="row gap16 center"><span class="pill solid" style="font-size:30px;padding:16px 28px">${esc(s.swipe)}</span><span class="pill" style="font-size:30px;padding:16px 24px">${esc(s.chip)}</span></div>`);
    },

    /* 2 · the story: developer → AI-assisted coding → apps, with evidence labels */
    story(s, ctx) {
      const node = (x, w, t1, t2, hot) => `<rect x="${x}" y="30" width="${w}" height="150" rx="26" fill="${hot ? "var(--accent)" : "var(--card)"}" stroke="${hot ? "none" : "var(--line)"}" stroke-width="2"/>
        ${T(x + w / 2, 92, t1, { a: "middle", f: "sans", w: 800, s: 30, c: hot ? ONA : "var(--fg)" })}${T(x + w / 2, 140, t2, { a: "middle", f: "sans", w: 600, s: 28, c: hot ? ONA : MUTED })}`;
      const svg = `<svg viewBox="0 0 936 210" width="936" height="210">${arrowhead}
        ${node(0, 280, "Brandon Thomas", "ArtCraft lead")}${line(288, 105, 328, 105)}
        ${node(336, 264, "AI-assisted", "Claude + Rust", true)}${line(608, 105, 656, 105)}
        ${node(664, 272, "7 open apps", "MIT / Apache-2.0")}</svg>`;
      const row = (b, kind, t) => `<div class="row gap16" style="align-items:flex-start;margin-top:18px"><span class="badge ${kind}" style="flex:none;margin-top:4px">${esc(b)}</span><span style="font:500 30px/1.32 var(--sans)">${fmt(t)}</span></div>`;
      return shell(ctx, s, `${hdr(s, s.mood, 60)}
        <p class="body" style="margin-top:10px;font-size:32px;color:var(--muted)">${fmt(s.lede)}</p>
        <div style="margin-top:14px">${svg}</div>
        ${row("GitHub", "hot", "Repos include `CLAUDE.md` and `AGENTS.md` agent rules. Apps ship MCP servers so Claude can drive them.")}
        ${row("Press", "ghost", "Press reports Brandon Thomas led it, using Claude. We could not confirm the model or workflow first-hand.")}
        ${row("GitHub", "hot", "Pure Rust, clean-room, MIT or Apache-2.0.")}
        <div class="grow"></div>
        <div class="watch" style="padding:14px 22px;font-size:30px"><span class="tag">Reality check</span><span>${fmt(s.watch)}</span></div>`);
    },

    /* 3–7 · one app per slide: real screenshot is the hero */
    appShot(s, ctx) {
      const a = s.app, v = s.view || {};
      const label = `${a.name} — ${a.statusShort}`;
      const w = v.w || 780;
      const stage = (() => {
        const winHtml = `<div style="position:absolute;${v.winSide === "right" ? "right:0" : "left:0"};top:${v.winTop ?? 0}px;${v.rot ? `transform:rotate(${v.rot}deg)` : ""}">${win(a.key, w, label, { tag: "Screenshot", pos: v.pos })}</div>`;
        const ins = (v.insets || []).map((i) => inset(a.key, i.crop, i.w, i.label, `position:absolute;${i.css}`)).join("");
        return `<div style="position:relative;height:${v.stageH || 520}px">${winHtml}${ins}</div>`;
      })();
      const bullets = s.points.map((p) => `<div class="row gap16" style="align-items:flex-start;margin-top:8px"><span style="color:var(--accent-t);flex:none;margin-top:2px;width:32px;height:32px;display:inline-flex">${icon("check", 'style="width:32px;height:32px"')}</span><span style="font:500 30px/1.28 var(--sans)">${fmt(p)}</span></div>`).join("");
      return shell(ctx, s, `${hdr(s, s.mood)}
        <div class="row gap16 center" style="margin-top:12px;flex-wrap:nowrap">
          <span class="pill" style="font-size:30px;padding:8px 20px;color:var(--muted)">${esc(a.adobe)}</span>
          <span style="color:var(--accent-t);flex:none">${icon("arrow")}</span>
          <span class="pill solid" style="font-size:30px;padding:8px 20px">${esc(a.name)}</span></div>
        <div style="margin-top:14px">${stage}</div>
        <div style="margin-top:14px">${bullets}</div>
        <div class="grow"></div>
        <div class="row center" style="flex-wrap:nowrap;gap:8px">${statusChip(a.status, a.kind)}<span class="pill" style="font-size:30px;padding:10px 20px">${esc(a.url)}</span></div>`);
    },

    /* 8 · two more tools + wider collection + warning */
    moreTools(s, ctx) {
      const card = (t) => `<div class="card" style="padding:16px;flex:1;min-width:0">
        ${win(t.key, 400, t.name, { h: 170, pos: t.pos || "50% 0" })}
        <div style="margin-top:10px;font:700 30px/1.2 var(--mono)"><span style="color:var(--muted)">${esc(t.adobe.replace("Adobe ", ""))}</span> <span style="color:var(--accent-t)">→ ${esc(t.name)}</span></div>
        <div style="margin-top:8px;font:500 30px/1.28 var(--sans)">${fmt(t.text)}</div>
        <div style="margin-top:10px">${statusChip(t.status, "ghost")}</div>
        <div class="src" style="margin-top:8px">getartcraft.com<br>${esc(t.url.replace("getartcraft.com", ""))}</div></div>`;
      return shell(ctx, s, `${hdr(s, s.mood)}
        <div class="row gap16" style="margin-top:34px;align-items:stretch">${s.tools.map(card).join("")}</div>
        <div class="card" style="margin-top:14px;padding:16px 22px"><div class="label" style="color:var(--accent-t)">Wider collection (launcher README)</div>
          <div style="margin-top:8px;font:600 30px/1.35 var(--mono)">${esc(s.more)}</div></div>
        <div class="grow"></div>
        <div class="watch" style="padding:14px 22px;font-size:30px"><span class="tag">Heads up</span><span>${fmt(s.watch)}</span></div>`);
    },

    /* 9 · cheat sheet + how to download + CTA */
    toolkit(s, ctx) {
      const rows = s.rows.map((r) => `<div class="row" style="align-items:center;gap:12px;padding:4px 0;border-bottom:2px solid var(--line);flex-wrap:nowrap">
        <span style="font:600 30px/1 var(--sans);color:var(--muted);width:300px;flex:none">${esc(r[0])}</span><span style="color:var(--accent-t);flex:none">${icon("arrow")}</span>
        <span style="font:800 32px/1 var(--sans);flex:1">${esc(r[1])}</span><span class="label" style="text-transform:none;letter-spacing:0;font-size:26px">${esc(r[2])}</span></div>`).join("");
      const steps = s.steps.map((t, i) => `<div class="row gap16" style="align-items:center;margin-top:6px"><span class="badge hot" style="flex:none;min-width:44px;justify-content:center">${i + 1}</span><span style="font:500 30px/1.25 var(--sans)">${fmt(t)}</span></div>`).join("");
      return shell(ctx, s, `${hdr(s, s.mood, 56)}
        <div class="card" style="margin-top:58px;padding:4px 22px 6px">${rows}</div>
        <div class="label" style="margin-top:14px;color:var(--accent-t)">How to download</div>
        ${steps}
        <div class="code" style="margin-top:10px;white-space:normal;padding:12px 22px;flex:none"><div class="label" style="color:#2FE3B2">${esc(s.launcherLabel)}</div><div style="font:600 32px/1.3 var(--mono);color:#F4F1EA">${esc(s.launcher)}</div></div>
        <div class="grow"></div>
        <div class="row gap16 center" style="flex-wrap:nowrap"><span class="pill solid" style="font-size:30px;padding:12px 22px;white-space:nowrap">${esc(s.cta[0])}</span><span class="pill" style="font-size:30px;padding:12px 22px;white-space:nowrap">${esc(s.cta[2])}</span></div>
        <div class="row gap16 center" style="flex-wrap:nowrap;margin-top:10px"><span class="pill" style="font-size:30px;padding:12px 22px;white-space:nowrap">${esc(s.cta[1])}</span></div>`);
    },
  };

  const css = `
.aw{border-radius:18px;overflow:hidden;background:#12151f;box-shadow:0 34px 60px -20px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.14)}
.awbar{display:flex;align-items:center;gap:8px;height:40px;padding:0 16px;background:#252a3a;color:#E8EAF4;font:600 26px/1 var(--mono);white-space:nowrap}
.awbar i{width:12px;height:12px;border-radius:50%;background:#FF7A52;flex:none}.awbar i:nth-child(2){background:#F5C451}.awbar i:nth-child(3){background:#2FE3B2}
.awbar .t{margin-left:10px;color:#E8EAF4}.awbar .rt{margin-left:auto;color:#2FE3B2}
.awimg,.aimg{background-repeat:no-repeat}
.ains{border-radius:16px;overflow:hidden;background:#12151f;box-shadow:0 30px 50px -16px rgba(0,0,0,.65),0 0 0 4px #2FE3B2;}
.atag{position:absolute;left:0;top:0;background:#2FE3B2;color:#0C1020;font:700 26px/1 var(--mono);padding:8px 14px;border-bottom-right-radius:14px}
.adot{width:14px;height:14px;border-radius:50%;background:currentColor;opacity:.9;flex:none}
`;
  return { layouts, css };
};
