import { createApp } from '../server/app.js';
import { openDb } from '../server/db.js';
import { seed, DEMO_PASSWORD } from '../server/seed.js';

export async function boot() {
  const db = openDb(':memory:');
  seed(db);
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
