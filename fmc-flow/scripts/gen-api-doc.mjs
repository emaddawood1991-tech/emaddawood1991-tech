// Writes docs/API.md from the real router.   node --disable-warning=ExperimentalWarning scripts/gen-api-doc.mjs
import { writeFileSync } from 'node:fs';
import { openDb } from '../server/db.js';
import { createApp } from '../server/app.js';
import { buildApiDoc } from '../server/apidoc.js';
const { app } = createApp({ db: openDb(':memory:') });
writeFileSync(new URL('../docs/API.md', import.meta.url), buildApiDoc(app));
console.log('docs/API.md written');
