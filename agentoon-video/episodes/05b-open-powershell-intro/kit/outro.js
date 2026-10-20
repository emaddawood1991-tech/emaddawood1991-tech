/* Signature ending: navy field, wordmark (agentoon white + .ai cyan #60CDFF), robot walks to centre, glows and waves,
   ONE call to action ("+ Follow Agentoon.ai"). No separate Like/Share buttons.
     Outro.build(tl, scene, at, {bot, fromX, ...}) -> end time
   `scene` is the scene .inner element. Timings are relative to `at` and kept short (~2 s). */
(function () {
  function build(tl, scene, at, o) {
    o = Object.assign({ cx: 390, y: 380, scale: 1, fromX: -400 }, o);
    const bw = o.bot.o.w;
    const bg = document.createElement("div"); bg.className = "bg-fill"; bg.id = "outro-bg"; bg.style.background = "radial-gradient(120% 80% at 50% 38%, #16294F 0%, #0B1630 62%, #070E20 100%)"; scene.appendChild(bg);
    const halo = document.createElement("div"); halo.id = "outro-halo";
    halo.style.cssText = "position:absolute;left:" + (o.cx + bw / 2 - 330) + "px;top:" + (o.y + bw * 0.7 - 330) + "px;width:660px;height:660px;border-radius:50%;background:radial-gradient(circle,rgba(96,205,255,.38) 0%,rgba(96,205,255,0) 68%);opacity:0";
    scene.appendChild(halo);
    scene.appendChild(o.bot.P.wrap);
    const mark = document.createElement("div"); mark.id = "outro-mark";
    mark.style.cssText = "position:absolute;left:0;right:0;top:" + (o.y + bw * 1.4 + 40) + "px;text-align:center;font:800 140px/1 var(--body);letter-spacing:-.03em;color:#fff;opacity:0";
    mark.innerHTML = 'agentoon<span style="color:#60CDFF">.ai</span>'; scene.appendChild(mark);
    const line = document.createElement("div"); line.id = "outro-line";
    line.style.cssText = "position:absolute;left:300px;width:480px;top:" + (o.y + bw * 1.4 + 210) + "px;height:8px;border-radius:4px;background:#60CDFF;transform-origin:0 50%;";
    scene.appendChild(line); gsap.set(line, { scaleX: 0 });
    const cta = document.createElement("div"); cta.id = "outro-cta";
    cta.style.cssText = "position:absolute;left:0;right:0;top:" + (o.y + bw * 1.4 + 270) + "px;display:flex;justify-content:center;opacity:0";
    cta.innerHTML = '<div style="padding:26px 54px 30px;border-radius:999px;background:#60CDFF;color:#0B1630;font:800 58px/1 var(--body)">+ Follow Agentoon.ai</div>';
    scene.appendChild(cta);

    tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.3 }, at);
    const botEnd = o.bot.outro(tl, at + 0.1, { fromX: o.fromX, cx: o.cx, y: o.y, scale: o.scale, walkDur: 0.8, halo });
    tl.fromTo(mark, { opacity: 0, y: 40, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, at + 0.55);
    tl.to(line, { scaleX: 1, duration: 0.4, ease: "power3.out" }, at + 0.95);
    tl.fromTo(cta, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.8)" }, at + 1.1);
    tl.to(cta, { scale: 1.05, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, at + 1.7);
    return Math.max(botEnd, at + 2.2);
  }
  window.Outro = { build };
})();
