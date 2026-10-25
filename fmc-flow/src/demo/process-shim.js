// Must be the first import: server modules read process.env at load time.
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;
globalThis.process = { env: {}, argv: [], version: 'browser-demo', uptime: () => performance.now() / 1000 };
globalThis.__FMC_DEMO__ = true;
