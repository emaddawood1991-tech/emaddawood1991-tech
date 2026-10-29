#!/usr/bin/env node
// Agentoon.ai production runner: executes a manifest end to end and saves one MP4.
//   node produce.mjs productions/my-video.json [--dry-run] [--skip-missing] [--keep-work]
//
// Scene engines it can run itself (free, local):
//   threejs   { "engine": "threejs", "spec": "threejs/specs/demo-orbit.json", "seconds": 7 }
//   blender   { "engine": "blender", "script": "blender/villa_development.py", "output": "out/blender/villa.mp4", "args": ["--samples", "24"] }  (needs Blender)
//   remotion  { "engine": "remotion", "composition": "BarChart", "seconds": 4 }                                                              (needs remotion-studio deps)
// Scenes that use an existing file (stock footage, a Playwright capture, an AI clip you already generated and approved):
//   clip      { "engine": "clip" | "pexels" | "playwright" | "ai-gateway", "file": "out/ai/clip-123.mp4" }
// Paid AI clips are NEVER generated here: run ai-clip.mjs yourself after approving its cost card, then reference the file.
// Paths are relative to agentoon-video/. Optional top level: "audio": "path.mp3" (mixed to about -15 LUFS).
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { detectAvailable, findBlender } from "./available.mjs";
import { xfadeFilter } from "./edit.mjs";
import { routeScene } from "./route.mjs";

export { xfadeFilter };

const here = dirname(fileURLToPath(import.meta.url));
const abs = (p) => resolve(here, p);
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26, ...opts });

function duration(file) {
  const r = sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file]);
  return Number(r.stdout.trim());
}

function resolveScene(scene, i, ctx) {
  const n = String(i + 1).padStart(2, "0");
  const out = join(ctx.work, `scene-${n}.mp4`);
  let engine = scene.engine;
  if (!engine && scene.description) {
    engine = routeScene(scene.description, { available: Object.entries(ctx.available).filter(([, ok]) => ok).map(([k]) => k) }).engine;
  }
  const info = { n, engine, out, status: "pending", note: "" };

  if (engine === "threejs") {
    if (!scene.spec) return { ...info, status: "blocked", note: "threejs scene needs a \"spec\" JSON path" };
    if (!ctx.available.threejs) return { ...info, status: "blocked", note: "Three.js engine not ready (run `npm install` in agentoon-video/threejs; needs Playwright Chromium and ffmpeg)" };
    const args = ["threejs/render.mjs", "--spec", abs(scene.spec), "--out", out, "--width", String(ctx.width), "--height", String(ctx.height), "--fps", String(ctx.fps)];
    if (scene.seconds) args.push("--seconds", String(scene.seconds));
    return { ...info, status: "ready", run: ["node", args] };
  }
  if (engine === "blender") {
    const exe = findBlender();
    const output = abs(scene.output ?? `out/blender/scene-${n}.mp4`);
    if (existsSync(output)) return { ...info, status: "ready", file: output, note: "using the existing Blender render" };
    if (!exe) return { ...info, status: "blocked", note: `Blender not found here. On the PC run: blender -b -P ${scene.script ?? "<script>.py"} -- --video ${scene.output ?? output}` };
    return { ...info, status: "ready", file: output, run: [exe, ["-b", "-P", abs(scene.script), "--", "--video", output, ...(scene.args ?? [])]] };
  }
  if (engine === "remotion") {
    const studio = abs("../remotion-studio");
    if (!existsSync(join(studio, "node_modules"))) return { ...info, status: "blocked", note: "remotion-studio dependencies not installed (run `npm install` there)" };
    const env = { ...process.env, ...(process.platform === "win32" ? {} : { REMOTION_USE_LOCAL_CHROME: "1" }) };
    return { ...info, status: "ready", run: ["npx", ["remotion", "render", "src/index.ts", scene.composition, out], { cwd: studio, env }] };
  }
  if (["clip", "pexels", "playwright", "ai-gateway", "hyperframes"].includes(engine)) {
    if (!scene.file) return { ...info, status: "blocked", note: `${engine} scene needs a "file" (an existing MP4). ${engine === "ai-gateway" ? "Generate it with ai-clip.mjs after approving the cost card." : ""}` };
    if (!existsSync(abs(scene.file))) return { ...info, status: "blocked", note: `file not found: ${scene.file}${engine === "ai-gateway" ? " (generate with ai-clip.mjs after approval)" : ""}` };
    return { ...info, status: "ready", file: abs(scene.file) };
  }
  return { ...info, status: "blocked", note: `unknown or missing engine${scene.description ? ` (router had no match for "${scene.description}")` : ""}` };
}

async function main() {
  const argv = process.argv.slice(2);
  const manifestPath = argv.find((a) => !a.startsWith("--"));
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  if (!manifestPath) {
    console.error("Usage: node produce.mjs <manifest.json> [--dry-run] [--skip-missing] [--keep-work]");
    process.exit(1);
  }
  const m = JSON.parse(readFileSync(resolve(manifestPath), "utf8"));
  const ctx = { width: m.width ?? 1080, height: m.height ?? 1920, fps: m.fps ?? 24, available: detectAvailable() };
  const T = m.transition ?? 0.4;
  const name = m.name ?? "production";
  ctx.work = abs(join("out", "work", name));
  const outFile = abs(m.out ?? `out/${name}.mp4`);
  mkdirSync(ctx.work, { recursive: true });

  console.log(`Production "${name}": ${m.scenes.length} scene(s), ${ctx.width}x${ctx.height} @ ${ctx.fps} fps`);
  const scenes = m.scenes.map((s, i) => resolveScene(s, i, ctx));
  for (const s of scenes) console.log(`  scene ${s.n} [${s.engine ?? "?"}] ${s.status}${s.note ? ` - ${s.note}` : ""}`);
  const blocked = scenes.filter((s) => s.status === "blocked");
  if (flags.has("--dry-run")) {
    console.log(blocked.length ? `Dry run: ${blocked.length} scene(s) blocked.` : "Dry run: everything can run.");
    return;
  }
  if (blocked.length && !flags.has("--skip-missing")) {
    console.error(`\nStopped: ${blocked.length} scene(s) cannot run in this environment. Fix them or re-run with --skip-missing to assemble the rest.`);
    process.exit(2);
  }

  const clips = [];
  for (const s of scenes) {
    if (s.status !== "ready") continue;
    let file = s.file;
    if (s.run) {
      console.log(`\nRunning scene ${s.n} (${s.engine})...`);
      const [cmd, args, opts] = s.run;
      const r = spawnSync(cmd, args, { stdio: "inherit", ...(opts ?? {}) });
      if (r.status !== 0) {
        console.error(`Scene ${s.n} failed (exit ${r.status}).`);
        process.exit(3);
      }
      file = s.file ?? s.out;
    }
    if (!existsSync(file)) {
      console.error(`Scene ${s.n}: expected output not found: ${file}`);
      process.exit(3);
    }
    const norm = join(ctx.work, `norm-${s.n}.mp4`);
    const r = sh("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-vf", `scale=${ctx.width}:${ctx.height}:force_original_aspect_ratio=increase,crop=${ctx.width}:${ctx.height},fps=${ctx.fps},format=yuv420p`, "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "18", norm]);
    if (r.status !== 0) {
      console.error(`Could not normalise scene ${s.n}: ${r.stderr}`);
      process.exit(3);
    }
    clips.push({ n: s.n, file: norm, d: duration(norm) });
  }
  if (!clips.length) {
    console.error("No scenes to assemble.");
    process.exit(2);
  }
  const tooShort = clips.filter((c) => c.d <= T * 2);
  if (tooShort.length && clips.length > 1) {
    console.error(`Scenes shorter than ${T * 2}s cannot cross-fade: ${tooShort.map((c) => c.n).join(", ")}`);
    process.exit(3);
  }

  const { filter, total } = xfadeFilter(clips.map((c) => c.d), T);
  const args = ["-y", "-loglevel", "error"];
  for (const c of clips) args.push("-i", c.file);
  let map = ["-map", "[vout]"];
  let fc = filter;
  if (m.audio) {
    args.push("-i", abs(m.audio));
    fc += `;[${clips.length}:a]loudnorm=I=-15:TP=-1.5:LRA=11,afade=t=out:st=${Math.max(0, total - 0.6).toFixed(2)}:d=0.6[aout]`;
    map = ["-map", "[vout]", "-map", "[aout]", "-c:a", "aac", "-b:a", "192k", "-shortest"];
  }
  mkdirSync(dirname(outFile), { recursive: true });
  args.push("-filter_complex", fc, ...map, "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", outFile);
  const ff = sh("ffmpeg", args);
  if (ff.status !== 0) {
    console.error(`Assembly failed: ${ff.stderr}`);
    process.exit(3);
  }

  const probe = JSON.parse(sh("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,codec_name", "-show_entries", "format=duration,size", "-of", "json", outFile]).stdout);
  const report = {
    name, output: outFile, width: probe.streams[0].width, height: probe.streams[0].height, codec: probe.streams[0].codec_name,
    seconds: Number(Number(probe.format.duration).toFixed(2)), megabytes: Number((probe.format.size / 1e6).toFixed(2)),
    scenes: scenes.map((s) => ({ scene: s.n, engine: s.engine, status: s.status, note: s.note })),
    skipped: blocked.map((s) => s.n),
  };
  writeFileSync(outFile.replace(/\.mp4$/, ".report.json"), JSON.stringify(report, null, 2) + "\n");
  if (!flags.has("--keep-work")) rmSync(ctx.work, { recursive: true, force: true });
  console.log(`\nOUTPUT: ${outFile}`);
  console.log(`  ${report.codec} ${report.width}x${report.height}, ${report.seconds} s, ${report.megabytes} MB${blocked.length ? `, skipped scenes: ${report.skipped.join(", ")}` : ""}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
