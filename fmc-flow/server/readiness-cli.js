// npm run readiness — prints the production readiness report for the configured database. Exit code 2 if any item FAILS.
import { openDb } from './db.js';
import { readiness } from './readiness.js';
const db = openDb(); const r = readiness({ db, reqSecure: false });
for (const c of r.checks) console.log(`${{ ok: ' OK ', warn: 'WARN', fail: 'FAIL' }[c.status]}  ${c.label}\n        ${c.detail}`);
console.log(`\n${r.summary.ok} ok, ${r.summary.warn} to do, ${r.summary.fail} failing.\n${r.note}`);
db.close(); process.exit(r.summary.fail ? 2 : 0);
