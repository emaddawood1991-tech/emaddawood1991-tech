(() => {
  let t = 0; const q = []; let id = 0;
  performance.now = () => t; const D = Date.now; const t0 = D.call(Date); Date.now = () => t0 + t;
  window.requestAnimationFrame = (cb) => { q.push(cb); return ++id; }; window.cancelAnimationFrame = () => {};
  window.__step = (dt) => { t += dt; const cur = q.splice(0); for (const cb of cur) cb(t); };
})();
