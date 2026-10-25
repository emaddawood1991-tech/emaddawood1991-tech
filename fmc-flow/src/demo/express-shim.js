// Minimal in-browser stand-in for the parts of Express that server/app.js uses.
const compile = (path) => {
  if (path instanceof RegExp) return { re: path, keys: [] };
  const keys = [];
  const src = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; });
  return { re: new RegExp(`^${src}$`), keys };
};

function express() {
  const stack = [];
  const add = (method, path, handlers) => handlers.flat().forEach((h) => stack.push({ method, path, h, ...(path && typeof path !== 'string' ? { c: compile(path) } : path && !path.startsWith('/') ? {} : {}) }));
  const app = {
    disable() {}, set() {},
    use(a, ...rest) { if (typeof a === 'function') add(null, null, [a, ...rest]); else add(null, a, rest); },
  };
  for (const m of ['get', 'post', 'put', 'patch', 'delete']) app[m] = (path, ...hs) => hs.flat().forEach((h) => stack.push({ method: m.toUpperCase(), c: compile(path), h }));
  const ensureC = (l) => l;

  app.handle = (req, res) => new Promise((resolve) => {
    let i = 0;
    res._done = resolve;
    const next = (err) => {
      if (res.finished) return;
      while (i < stack.length) {
        const l = ensureC(stack[i++]);
        let ok = false;
        if (l.method === null) ok = !l.path || req.path === l.path || req.path.startsWith(`${l.path}/`);
        else if (l.method === req.method) { const m = l.c.re.exec(req.path); if (m) { ok = true; req.params = Object.fromEntries(l.c.keys.map((k, n) => [k, decodeURIComponent(m[n + 1])])); } }
        if (!ok) continue;
        const isErr = l.h.length === 4;
        if (err && !isErr) continue;
        if (!err && isErr) continue;
        try {
          const r = isErr ? l.h(err, req, res, next) : l.h(req, res, next);
          if (r && typeof r.catch === 'function') r.catch(next);
        } catch (e) { next(e); }
        return;
      }
      if (!res.finished) res.status(err ? 500 : 404).json({ error: { code: err ? 'INTERNAL' : 'NOT_FOUND', message: String(err?.message || 'Not found') } });
    };
    next();
  });
  return app;
}
express.json = () => (_req, _res, next) => next();
express.static = () => (_req, _res, next) => next();
export default express;

export function makeRes() {
  const res = { statusCode: 200, headers: {}, body: '', finished: false };
  res.set = (k, v) => { if (typeof k === 'object') for (const [a, b] of Object.entries(k)) res.headers[a.toLowerCase()] = b; else res.headers[k.toLowerCase()] = v; return res; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.type = (t) => res.set('content-type', t);
  const end = (body) => { res.body = body; res.finished = true; res._done?.(); return res; };
  res.json = (o) => { res.set('content-type', 'application/json'); return end(JSON.stringify(o)); };
  res.send = (s) => end(String(s));
  return res;
}
