#!/usr/bin/env node
// JSON tool wrapper so any agent platform can call the 3D and video-edit abilities as functions.
//   node agentoon-tool.mjs <tool> '<json arguments>'      (or pipe the JSON on stdin)
// Tools: render_3d_video, edit_video. Prints ONE JSON object on stdout: { ok: true, ... } or { ok: false, error }.
// Free and local. Needs Node 18+, FFmpeg, Playwright Chromium and `npm install` once in threejs/.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { addAudio, info, joinClips, resize, sheet, speed, trim } from "./edit.mjs";

const here = dirname(fileURLToPath(import.meta.url));

export function renderThreeD(a) {
  if (!a.spec || !a.out) throw new Error("render_3d_video needs `spec` (object or path to a JSON file) and `out` (mp4 path)");
  let specPath = a.spec;
  let tmp = null;
  if (typeof a.spec === "object") {
    tmp = mkdtempSync(join(tmpdir(), "agentoon-spec-"));
    specPath = join(tmp, "spec.json");
    writeFileSync(specPath, JSON.stringify(a.spec));
  }
  try {
    const args = [join(here, "threejs", "render.mjs"), "--spec", resolve(specPath), "--out", resolve(a.out), "--width", String(a.width ?? 720), "--height", String(a.height ?? 1280)];
    for (const [k, f] of [["fps", "--fps"], ["seconds", "--seconds"], ["frames", "--frames"]]) if (a[k] !== undefined) args.push(f, String(a[k]));
    const r = spawnSync(process.execPath, args, { encoding: "utf8", maxBuffer: 1 << 26 });
    if (r.status !== 0) throw new Error(`render failed: ${(r.stderr || r.stdout).trim().split("\n").slice(-6).join(" | ")}`);
    const result = { output: resolve(a.out), ...info(a.out) };
    if (a.contact_sheet) result.contact_sheet = sheet(a.out, a.contact_sheet).file;
    return result;
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  }
}

export function editVideo(a) {
  const ops = {
    info: () => info(a.input),
    trim: () => trim(a.input, a.out, { start: a.start, end: a.end }),
    resize: () => resize(a.input, a.out, { width: a.width, height: a.height, fps: a.fps }),
    speed: () => speed(a.input, a.out, { factor: a.factor }),
    join: () => joinClips(a.out, a.inputs, { fade: a.fade, width: a.width, height: a.height, fps: a.fps }),
    audio: () => addAudio(a.input, a.audio, a.out, { lufs: a.lufs }),
    sheet: () => sheet(a.input, a.out, { count: a.count, width: a.width }),
  };
  if (!ops[a.op]) throw new Error(`Unknown op "${a.op}". Use one of: ${Object.keys(ops).join(", ")}`);
  return { op: a.op, ...ops[a.op]() };
}

function main() {
  const [tool, raw] = process.argv.slice(2);
  try {
    const args = JSON.parse(raw ?? readFileSync(0, "utf8") ?? "{}");
    const tools = { render_3d_video: renderThreeD, edit_video: editVideo };
    if (!tools[tool]) throw new Error(`Unknown tool "${tool}". Use render_3d_video or edit_video.`);
    console.log(JSON.stringify({ ok: true, ...tools[tool](args) }));
  } catch (e) {
    console.log(JSON.stringify({ ok: false, error: e.message }));
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
