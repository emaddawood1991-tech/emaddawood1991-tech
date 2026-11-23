// API reference built from the running router and the permission table, so it cannot drift from the code (a test compares it to docs/API.md).
import { listRoutes } from './roles.js';
import { PERMS } from './perms.js';

const PUBLIC = new Set(['POST /api/login', 'POST /api/login/mfa', 'POST /api/recovery-request', 'GET /api/time']);

export function buildApiDoc(app) {
  const routes = listRoutes(app);
  const rows = routes.map((r) => {
    const key = `${r.method} ${r.path}`;
    let access;
    if (PUBLIC.has(key) || !r.guarded) access = 'Public (no sign-in)';
    else if (r.permission) access = `\`${r.permission}\` — ${(PERMS[r.permission] || []).join(', ') || 'no role'}`;
    else access = 'Any signed-in user (finer rules are checked inside the operation)';
    return { ...r, access, group: r.path.split('/')[2] || '' };
  });
  const groups = [...new Set(rows.map((r) => r.group))].sort();
  const guarded = rows.filter((r) => r.guarded).length;
  let md = `# FMC Patient Flow — API reference\n\n`
    + `Generated from the running router by \`npm run docs:api\` — do not edit by hand (\`tests/apidoc.test.js\` fails if this file is out of date).\n\n`
    + `**${rows.length} routes: ${guarded} require sign-in, ${rows.length - guarded} are public.** All permissions are enforced on the server; the interface only hides what a role cannot use.\n\n`
    + `Conventions: JSON in and out; every request that is not a GET must send the header \`x-requested-with: fmc\` (cross-site request protection); the session is an HTTP-only cookie; errors are \`{ "error": { "code": "CODE", "message": "…" } }\` with the status codes 400 validation or malformed JSON, 401 not signed in, 403 not allowed (including a missing header), 404 not found, 409 conflict, 429 too many attempts.\n\n`
    + `Roles: \`admin\`, \`supervisor\`, \`reception\`, \`clinician\`. Role templates (see Security & Access) map onto these four enforced roles. Department access and clinical service authorization are separate checks made on top of the role.\n`;
  for (const g of groups) {
    md += `\n## /api/${g}\n\n| Method | Path | Access |\n|---|---|---|\n`;
    for (const r of rows.filter((x) => x.group === g)) md += `| ${r.method} | \`${r.path}\` | ${r.access} |\n`;
  }
  return md;
}
