import './process-shim.js';
import initSqlJs from 'sql.js/dist/sql-asm.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { setSql } from './sqlite-adapter.js';
import { makeRes } from './express-shim.js';
import { openDb } from '../../server/db.js';
import { createApp } from '../../server/app.js';
import { seed } from '../../server/seed.js';
import { LangProvider } from '../i18n.jsx';
import { ToastProvider } from '../ui.jsx';
import App from '../App.jsx';

const KEY = 'fmc_demo_db'; const CK = 'fmc_demo_cookie';
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable: demo state stays in memory */ } }, del: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } } };
const b64 = { enc: (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); }, dec: (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) };

async function boot() {
  const SQL = await initSqlJs();
  let saved = null; try { const s = ls.get(KEY); if (s) saved = b64.dec(s); } catch { saved = null; }
  setSql(SQL, saved);
  const db = openDb(':memory:');
  seed(db);
  const { app, ops } = createApp({ db, backupDir: '/demo/' });
  setInterval(() => { try { ops.sweepTimers(); } catch { /* ignore */ } }, 10000);
  let cookie = ls.get(CK) || '';
  // Save right after every change so a quick refresh never loses a record.
  const persist = () => { try { ls.set(KEY, b64.enc(db.export())); } catch { /* ignore */ } };

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, opts = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, 'http://fmc.demo/');
    if (!url.pathname.startsWith('/api')) return realFetch(input, opts);
    const method = (opts.method || 'GET').toUpperCase();
    const headers = Object.fromEntries(Object.entries(opts.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    if (cookie) headers.cookie = cookie;
    let body; try { body = opts.body ? JSON.parse(opts.body) : {}; } catch { body = {}; }
    const req = { method, path: url.pathname, url: url.pathname, query: Object.fromEntries(url.searchParams), headers, body, ip: '127.0.0.1', params: {} };
    const res = makeRes();
    await app.handle(req, res);
    const sc = res.headers['set-cookie'];
    if (sc) { const m = /fmc_sid=([a-f0-9]*)/.exec(sc); cookie = m && m[1] ? `fmc_sid=${m[1]}` : ''; ls.set(CK, cookie); }
    if (method !== 'GET') persist();
    return new Response(res.body, { status: res.statusCode, headers: { 'content-type': res.headers['content-type'] || 'application/json' } });
  };
  window.__resetDemo = () => { ls.del(KEY); ls.del(CK); try { location.reload(); } catch { document.getElementById('root').textContent = 'Demo data cleared. Reopen the file.'; } };
  createRoot(document.getElementById('root')).render(<StrictMode><LangProvider><ToastProvider><App /></ToastProvider></LangProvider></StrictMode>);
}
boot().catch((e) => { document.getElementById('root').textContent = `Demo failed to start: ${e.message}`; });
