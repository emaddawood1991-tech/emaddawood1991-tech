import { createApp } from '../server/app.js';
import { openDb } from '../server/db.js';
import { seed, DEMO_PASSWORD } from '../server/seed.js';

// `gap` is the one-minute same-resource gap (production default 1). Older suites reuse one room back-to-back and do not test the gap, so they run with 0.
export async function boot({ gap = 0, autoClose = 0 } = {}) {
  const db = openDb(':memory:');
  seed(db);
  db.prepare("UPDATE settings SET value=? WHERE key='resource_gap_minutes'").run(String(gap));
  db.prepare("UPDATE settings SET value=? WHERE key='timer_auto_close'").run(String(autoClose)); // production default is 1; older suites test the confirm-after-elapsed mode
  const { app, ops } = createApp({ db });
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  async function login(username) {
    const res = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password: DEMO_PASSWORD }) });
    const cookie = res.headers.get('set-cookie').split(';')[0];
    const body = await res.json();
    const call = async (method, path, data) => {
      const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc', cookie }, body: data ? JSON.stringify(data) : undefined });
      const text = await r.text();
      let json = null; try { json = JSON.parse(text); } catch { json = text; }
      return { status: r.status, body: json };
    };
    return { user: body.user, get: (p) => call('GET', p), post: (p, d) => call('POST', p, d || {}), put: (p, d) => call('PUT', p, d || {}), patch: (p, d) => call('PATCH', p, d || {}) };
  }
  return { db, ops, base, login, close: () => server.close() };
}
export const byName = (list, key, val) => list.find((x) => x[key] === val);
