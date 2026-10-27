#!/usr/bin/env node
// Headless Three.js -> MP4 renderer (free, local). Renders deterministic frames with Playwright's Chromium
// and encodes them with FFmpeg. No GPU, network or API keys needed.
//
//   node render.mjs --spec specs/demo-orbit.json --out ../out/demo-orbit.mp4
//   options: --width 720 --height 1280 --fps 24 --seconds 7 --frames N (render only the first N) --keep-frames
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const o = { width: 720, height: 1280, fps: null, seconds: null, frames: null, keep: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--spec") o.spec = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--width") o.width = Number(argv[++i]);
    else if (a === "--height") o.height = Number(argv[++i]);
    else if (a === "--fps") o.fps = Number(argv[++i]);
    else if (a === "--seconds") o.seconds = Number(argv[++i]);
    else if (a === "--frames") o.frames = Number(argv[++i]);
    else if (a === "--keep-frames") o.keep = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!o.spec || !o.out) throw new Error("Usage: node render.mjs --spec <spec.json> --out <video.mp4> [--width 720 --height 1280 --fps 24 --seconds 7]");
  return o;
}

const MIME = { ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript", ".json": "application/json", ".css": "text/css" };

function serve(specText) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/spec.json") {
      res.setHeader("content-type", "application/json");
      return res.end(specText);
    }
    const file = normalize(join(here, url.pathname === "/" ? "scene.html" : url.pathname));
    if (!file.startsWith(here) || !existsSync(file) || !statSync(file).isFile()) {
      res.statusCode = 404;
      return res.end("not found");
    }
    res.setHeader("content-type", MIME[extname(file)] ?? "application/octet-stream");
    res.end(readFileSync(file));
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!existsSync(join(here, "node_modules", "three"))) throw new Error("three.js is not installed. Run `npm install` in agentoon-video/threejs once.");
  const specText = readFileSync(resolve(o.spec), "utf8");
  const spec = JSON.parse(specText);
  const fps = o.fps ?? spec.fps ?? 24;
  const seconds = o.seconds ?? spec.duration ?? spec.camera.keys.at(-1).t;
  const total = o.frames ?? Math.round(seconds * fps);

  const { chromium } = require("playwright");
  const server = await serve(specText);
  const port = server.address().port;
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const dir = mkdtempSync(join(tmpdir(), "agentoon-3d-"));
  const started = Date.now();
  try {
    const page = await browser.newPage({ viewport: { width: o.width, height: o.height } });
    page.on("pageerror", (e) => console.error("page error:", e.message));
    await page.goto(`http://127.0.0.1:${port}/scene.html?w=${o.width}&h=${o.height}`);
    await page.waitForFunction(() => window.__ready === true || window.__error, null, { timeout: 180000 });
    const err = await page.evaluate(() => window.__error);
    if (err) throw new Error(`Scene failed to build:\n${err}`);
    const info = await page.evaluate(() => window.__info);
    console.log(`Scene "${info.name}" built (${info.trees} trees). Rendering ${total} frames at ${o.width}x${o.height}, ${fps} fps...`);
    for (let i = 0; i < total; i++) {
      const data = await page.evaluate((t) => {
        window.__render(t);
        return document.getElementById("c").toDataURL("image/png").split(",")[1];
      }, i / fps);
      writeFileSync(join(dir, `f_${String(i).padStart(5, "0")}.png`), Buffer.from(data, "base64"));
      if (i === 0 || (i + 1) % 24 === 0 || i === total - 1) console.log(`  frame ${i + 1}/${total} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
    }
  } finally {
    await browser.close();
    server.close();
  }

  mkdirSync(dirname(resolve(o.out)), { recursive: true });
  const ff = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", join(dir, "f_%05d.png"), "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", resolve(o.out)], { encoding: "utf8" });
  if (ff.status !== 0) throw new Error(`ffmpeg failed: ${ff.stderr}`);
  if (o.keep) console.log(`Frames kept in ${dir}`);
  else rmSync(dir, { recursive: true, force: true });

  const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,nb_frames,codec_name", "-show_entries", "format=duration,size", "-of", "json", resolve(o.out)], { encoding: "utf8" });
  const meta = JSON.parse(probe.stdout);
  console.log(`OUTPUT: ${resolve(o.out)}`);
  console.log(`  ${meta.streams[0].codec_name} ${meta.streams[0].width}x${meta.streams[0].height} ${meta.streams[0].nb_frames} frames, ${Number(meta.format.duration).toFixed(2)} s, ${(meta.format.size / 1e6).toFixed(2)} MB, rendered in ${((Date.now() - started) / 1000).toFixed(0)} s`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
