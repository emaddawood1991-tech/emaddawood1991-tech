import { useEffect, useRef, useState, useSyncExternalStore, useCallback } from 'react';

export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

// ---- tiny connection/sync store ----
let net = { offline: false, lastSync: null, offset: 0 };
const subs = new Set();
const setNet = (p) => { net = { ...net, ...p }; subs.forEach((f) => f()); };
export const useNet = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => net);
/** Best estimate of the *server's* clock. Client clocks are never used for recorded events. */
export const serverNow = () => Date.now() + net.offset;

async function req(method, path, body) {
  let res;
  try {
    res = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-requested-with': 'fmc' }, body: body ? JSON.stringify(body) : undefined });
  } catch {
    setNet({ offline: true });
    throw new ApiError(0, 'NETWORK', 'NETWORK');
  }
  let json = null;
  try { json = await res.json(); } catch { /* empty */ }
  setNet({ offline: false, lastSync: Date.now(), ...(json?.server_time ? { offset: Date.parse(json.server_time) - Date.now() } : {}) });
  if (!res.ok) throw new ApiError(res.status, json?.error?.code || 'ERROR', json?.error?.message || res.statusText);
  return json;
}
export const api = {
  get: (p) => req('GET', p), post: (p, b) => req('POST', p, b || {}), put: (p, b) => req('PUT', p, b || {}), patch: (p, b) => req('PATCH', p, b || {}),
};

/** Poll an endpoint. Keeps the last good data on failure and exposes the error instead of hiding it. */
export function usePoll(path, ms = 5000, enabled = true) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const alive = useRef(true);
  const load = useCallback(async () => {
    if (!enabled) return;
    try { const data = await api.get(path); if (alive.current) setState({ data, error: null, loading: false }); }
    catch (error) { if (alive.current) setState((s) => ({ ...s, error, loading: false })); }
  }, [path, enabled]);
  useEffect(() => {
    alive.current = true; load();
    const id = ms ? setInterval(load, ms) : null;
    const onVis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVis); window.addEventListener('online', load);
    return () => { alive.current = false; if (id) clearInterval(id); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', load); };
  }, [load, ms]);
  return { ...state, reload: load };
}

export function useTicker(ms = 1000) {
  const [, set] = useState(0);
  useEffect(() => { const id = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(id); }, [ms]);
  return serverNow();
}

export const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(16).slice(2)}`);
