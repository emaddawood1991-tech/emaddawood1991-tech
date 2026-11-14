/* Agentoon snippet (Ep 07c): real software inside a laptop illustration + purposeful camera zoom.
   Paste inside an episode template after el()/svgEl()/swapTo() exist and after scenes are wrapped with wrapScene().
   laptop(host,id,x,y,w,{imgs:[real screenshots 720x500 @2x], hideFirst}) -> {g,scr,ims,sw,sh,cx,cy,bottom}; put real terminal text in .scr via term().
   zoomTo/zoomOut move the scene camera toward the screen (point cx,cy ends at frame x=540,y=860). NO moving light sweeps. */
  const laptop = (host, id, x, y, w, o) => {
    o = o || {}; const sw = w - 44, sh = Math.round(sw * 500 / 720), lidH = sh + 44;
    const g = el(host, id, "", "left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + (lidH + 34) + "px");
    const lid = el(g, id + "lid", "", "left:0;top:0;width:" + w + "px;height:" + lidH + "px;border-radius:22px 22px 8px 8px;background:linear-gradient(180deg,#2A2150,#120B2C);border:3px solid #6F5BD0;box-shadow:0 34px 70px rgba(0,0,0,.6),0 0 50px rgba(139,92,246,.35)");
    const scr = el(lid, id + "scr", "", "left:19px;top:19px;width:" + sw + "px;height:" + sh + "px;overflow:hidden;border-radius:6px;background:#0B0620");
    el(g, id + "base", "", "left:" + (-w * 0.04) + "px;top:" + lidH + "px;width:" + (w * 1.08) + "px;height:22px;border-radius:0 0 22px 22px;background:linear-gradient(180deg,#8E7DE0,#4B3C99);box-shadow:0 14px 30px rgba(0,0,0,.5)");
    el(g, id + "nt", "", "left:" + (w * 0.5 - 60) + "px;top:" + lidH + "px;width:120px;height:9px;border-radius:0 0 10px 10px;background:#2A2150");
    const ims = (o.imgs || []).map((f, i) => { const im = document.createElement("img"); im.src = "assets/" + f; im.id = id + "i" + i; im.style.cssText = "position:absolute;left:0;top:0;width:" + sw + "px;height:" + sh + "px;opacity:" + (i || o.hideFirst ? 0 : 1); scr.appendChild(im); return im; });
    return { g, scr, ims, sw, sh, cx: x + w / 2, cy: y + 19 + sh / 2, bottom: y + lidH + 34 };
  };
  const zwin = []; /* windows used by purposeful zooms (the drift below keeps clear of them) */
  const zoomTo = (cam, cx, cy, s, at, dur) => (zwin.push([cam.id, at - 0.2, at + (dur || 0.7) + 0.1]), tl.to(cam, { scale: s, x: 540 - cx * s, y: 860 - cy * s, duration: dur || 0.7, ease: "power2.inOut" }, at));
  const zoomOut = (cam, at, dur) => (zwin.push([cam.id, at - 0.2, at + (dur || 0.7) + 0.1]), tl.to(cam, { scale: 1, x: 0, y: 0, duration: dur || 0.7, ease: "power2.inOut" }, at));
