import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

const d = (f) => fileURLToPath(new URL(`./src/demo/${f}`, import.meta.url));
// Builds ONE self-contained HTML file: UI + API + in-browser SQLite. Demo/synthetic data only.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: [
    { find: 'node:sqlite', replacement: d('sqlite-adapter.js') }, { find: 'node:crypto', replacement: d('crypto-shim.js') },
    { find: 'node:fs', replacement: d('node-stubs.js') }, { find: 'node:path', replacement: d('node-stubs.js') }, { find: 'node:url', replacement: d('node-stubs.js') },
    { find: /^express$/, replacement: d('express-shim.js') },
  ] },
  define: { 'import.meta.url': JSON.stringify('file:///demo/server/x.js') },
  build: { outDir: 'dist-demo', emptyOutDir: true, assetsInlineLimit: 100000000, rollupOptions: { input: 'demo.html' }, chunkSizeWarningLimit: 6000 },
});
