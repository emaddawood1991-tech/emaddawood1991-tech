#!/usr/bin/env node
// Free video editing helpers on top of FFmpeg: info, trim, resize, speed, join (cross-fades), audio, sheet.
//   node edit.mjs info   <in.mp4>
//   node edit.mjs trim   <in.mp4> <out.mp4> --start 1.5 --end 6
//   node edit.mjs resize <in.mp4> <out.mp4> [--width 1080 --height 1920 --fps 24]     (fills the frame, crops the rest)
//   node edit.mjs speed  <in.mp4> <out.mp4> --factor 1.5
//   node edit.mjs join   <out.mp4> <a.mp4> <b.mp4> ... [--fade 0.4 --width 1080 --height 1920 --fps 24]
//   node edit.mjs audio  <video.mp4> <audio.mp3> <out.mp4> [--lufs -15]               (mix to about -15 LUFS, fades out)
//   node edit.mjs sheet  <in.mp4> <out.png> [--count 8 --width 240]                   (contact sheet to review a video)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr.trim() || r.error?.message}`);
}

function ensureInput(file) {
  if (!existsSync(file)) throw new Error(`File not found: ${file}`);
  return resolve(file);
}

function prepareOutput(out) {
  const o = resolve(out);
  mkdirSync(dirname(o), { recursive: true });
  return o;
}

export function info(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate", "-show_entries", "format=duration,size", "-of", "json", ensureInput(file)], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffprobe failed: ${r.stderr.trim()}`);
  const j = JSON.parse(r.stdout);
  const v = j.streams.find((s) => s.codec_type === "video");
  const [n, d] = (v?.r_frame_rate ?? "0/1").split("/").map(Number);
  return { file: resolve(file), width: v?.width, height: v?.height, fps: d ? +(n / d).toFixed(2) : null, codec: v?.codec_name, seconds: +Number(j.format.duration).toFixed(3), megabytes: +(j.format.size / 1e6).toFixed(2), hasAudio: j.streams.some((s) => s.codec_type === "audio") };
}

export function trim(inp, out, { start = 0, end } = {}) {
  const args = ["-i", ensureInput(inp), "-ss", String(start)];
  if (end !== undefined) args.push("-to", String(end));
  ffmpeg([...args, ...ENC, "-c:a", "aac", prepareOutput(out)]);
  return info(out);
}

export function resize(inp, out, { width = 1080, height = 1920, fps = 24 } = {}) {
  ffmpeg(["-i", ensureInput(inp), "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=${fps},format=yuv420p`, ...ENC, "-c:a", "aac", prepareOutput(out)]);
  return info(out);
}

export function speed(inp, out, { factor = 1 } = {}) {
  if (!(factor > 0)) throw new Error("factor must be greater than 0");
  const src = info(inp);
  const args = ["-i", ensureInput(inp), "-filter:v", `setpts=PTS/${factor}`];
  if (src.hasAudio) {
    let f = factor;
    const chain = [];
    while (f > 2) (chain.push("atempo=2.0"), (f /= 2));
    while (f < 0.5) (chain.push("atempo=0.5"), (f /= 0.5));
    chain.push(`atempo=${f}`);
    args.push("-filter:a", chain.join(","), "-c:a", "aac");
  } else args.push("-an");
  ffmpeg([...args, ...ENC, prepareOutput(out)]);
  return info(out);
}

export function xfadeFilter(durations, T) {
  if (durations.length === 1) return { filter: "[0:v]null[vout]", total: durations[0] };
  let filter = "";
  let label = "[0:v]";
  let acc = durations[0];
  for (let i = 1; i < durations.length; i++) {
    const offset = +(acc - i * T).toFixed(3);
    const out = i === durations.length - 1 ? "[vout]" : `[v${i}]`;
    filter += `${label}[${i}:v]xfade=transition=fade:duration=${T}:offset=${offset}${out};`;
    label = out;
    acc += durations[i];
  }
  return { filter: filter.replace(/;$/, ""), total: +(acc - (durations.length - 1) * T).toFixed(3) };
}

export function joinClips(out, inputs, { fade = 0.4, width, height, fps } = {}) {
  if (!inputs.length) throw new Error("join needs at least one input");
  const first = info(inputs[0]);
  const W = width ?? first.width, H = height ?? first.height, F = fps ?? Math.round(first.fps ?? 24);
  const dir = mkdtempSync(join(tmpdir(), "agentoon-join-"));
  try {
    const norm = inputs.map((f, i) => {
      const o = join(dir, `n${i}.mp4`);
      ffmpeg(["-i", ensureInput(f), "-vf", `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${F},format=yuv420p`, "-an", ...ENC, o]);
      return { file: o, d: info(o).seconds };
    });
    if (norm.length > 1 && norm.some((c) => c.d <= fade * 2)) throw new Error(`Every clip must be longer than ${fade * 2}s to cross-fade`);
    const { filter } = xfadeFilter(norm.map((c) => c.d), fade);
    const args = [];
    for (const c of norm) args.push("-i", c.file);
    ffmpeg([...args, "-filter_complex", filter, "-map", "[vout]", ...ENC, prepareOutput(out)]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return info(out);
}

export function addAudio(video, audio, out, { lufs = -15 } = {}) {
  const v = info(video);
  const fade = Math.max(0, v.seconds - 0.6).toFixed(2);
  ffmpeg(["-i", ensureInput(video), "-i", ensureInput(audio), "-filter_complex", `[1:a]loudnorm=I=${lufs}:TP=-1.5:LRA=11,afade=t=out:st=${fade}:d=0.6[a]`, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", prepareOutput(out)]);
  return info(out);
}

export function sheet(inp, out, { count = 8, width = 240 } = {}) {
  const { seconds, fps } = info(inp);
  const step = Math.max(1, Math.floor((seconds * (fps || 24)) / count));
  ffmpeg(["-i", ensureInput(inp), "-vf", `select='not(mod(n,${step}))',scale=${width}:-1,tile=${count}x1`, "-frames:v", "1", prepareOutput(out)]);
  return { file: resolve(out), frames: count };
}

function parseFlags(argv) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) flags[argv[i].slice(2)] = Number.isNaN(Number(argv[i + 1])) ? argv[++i] : Number(argv[++i]);
    else pos.push(argv[i]);
  }
  return { pos, flags };
}

function main() {
  const [op, ...rest] = process.argv.slice(2);
  const { pos, flags } = parseFlags(rest);
  const ops = {
    info: () => info(pos[0]),
    trim: () => trim(pos[0], pos[1], flags),
    resize: () => resize(pos[0], pos[1], flags),
    speed: () => speed(pos[0], pos[1], flags),
    join: () => joinClips(pos[0], pos.slice(1), flags),
    audio: () => addAudio(pos[0], pos[1], pos[2], flags),
    sheet: () => sheet(pos[0], pos[1], flags),
  };
  if (!ops[op]) {
    console.error("Usage: node edit.mjs <info|trim|resize|speed|join|audio|sheet> ...  (see the header of edit.mjs)");
    process.exit(1);
  }
  try {
    console.log(JSON.stringify(ops[op](), null, 2));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
