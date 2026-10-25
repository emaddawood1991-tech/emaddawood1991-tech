// node:sqlite (DatabaseSync) API on top of sql.js, so server/*.js runs unchanged in the browser.
let SQL = null; let initial = null;
export const setSql = (sql, bytes) => { SQL = sql; initial = bytes; };
const clean = (a) => a.map((v) => (v === undefined ? null : v));

export class DatabaseSync {
  constructor() { this.db = initial ? new SQL.Database(initial) : new SQL.Database(); initial = null; }
  exec(sql) { this.db.exec(sql); }
  close() {}
  export() { return this.db.export(); }
  prepare(sql) {
    const db = this.db;
    return {
      all(...a) { const s = db.prepare(sql); try { s.bind(clean(a)); const out = []; while (s.step()) out.push(s.getAsObject()); return out; } finally { s.free(); } },
      get(...a) { const s = db.prepare(sql); try { s.bind(clean(a)); return s.step() ? s.getAsObject() : undefined; } finally { s.free(); } },
      run(...a) {
        db.run(sql, clean(a));
        const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
        return { lastInsertRowid: id, changes: db.getRowsModified() };
      },
    };
  }
}
