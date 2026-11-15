// Builds the single-file standalone export: ../Dubai_Azure_Tower_Explorer.html
// Usage: cd tools && npm install && npm run bundle        (or: node build.mjs)
import { createRequire } from "module"; import { readFileSync, writeFileSync, statSync } from "fs"; import { dirname, resolve } from "path"; import { fileURLToPath } from "url";
const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, ".."), src = resolve(root, "floor50-viewer"), require = createRequire(import.meta.url);
const esbuild = require("esbuild");
const res = await esbuild.build({
  entryPoints: [resolve(src, "main.js")], bundle: true, minify: true, format: "iife", write: false, logLevel: "warning",
  alias: { three: resolve(src, "vendor/three.module.min.js"), "three/addons": resolve(src, "vendor/addons") },
});
const js = res.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
let html = readFileSync(resolve(src, "index.html"), "utf8");
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, "");
if (!html.includes('<script type="module" src="./main.js"></script>')) throw new Error("index.html no longer references ./main.js as a module script");
html = html.replace('<script type="module" src="./main.js"></script>', () => "<script>" + js + "</script>");
const out = resolve(root, "Dubai_Azure_Tower_Explorer.html"); writeFileSync(out, html);
console.log(`wrote ${out} (${(statSync(out).size / 1e6).toFixed(2)} MB)`);
