import { build } from "esbuild"; import fs from "fs";
fs.mkdirSync("dist", { recursive: true });
await build({ entryPoints: ["src/App.tsx"], bundle: true, outfile: "dist/app.js", minify: true, define: { "process.env.NODE_ENV": '"production"' } });
fs.writeFileSync("dist/index.html", '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#05080e"><div id="root"></div><script src="app.js"></script>');
console.log("built dist/");
