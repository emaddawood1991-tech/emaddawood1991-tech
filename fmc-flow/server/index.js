import { createApp } from './app.js';
import { seed } from './seed.js';

const staticDir = new URL('../dist/', import.meta.url).pathname;
const { app, db } = createApp({ staticDir });
if (process.env.FMC_SEED !== '0' && seed(db)) console.log('Seeded synthetic development data (see npm run seed).');
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`FMC Patient Flow API on http://localhost:${port}`));
