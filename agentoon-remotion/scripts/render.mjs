// Usage: node scripts/render.mjs [slug] [--still] [--frame=N]
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--")) ?? "sample";
const still = args.includes("--still");
const frame = (args.find((a) => a.startsWith("--frame=")) ?? "--frame=30").split("=")[1];
const props = `episodes/${slug}/episode.json`;
if (!fs.existsSync(props)) { console.error(`Missing ${props}`); process.exit(1); }

// Use a local Chrome if present (offline/sandbox); else Remotion downloads its own.
const chrome = process.env.BROWSER_EXECUTABLE ?? (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : null);
const chromeArgs = chrome ? [`--browser-executable=${chrome}`, "--chrome-mode=chrome-for-testing"] : [];

const run = (cmd, a) => { const r = spawnSync(cmd, a, { stdio: "inherit" }); if (r.status !== 0) process.exit(r.status ?? 1); };

run("node", ["scripts/validate-spec.mjs", slug]);
fs.mkdirSync("out", { recursive: true });

if (still) {
  run("npx", ["remotion", "still", "src/index.ts", "Episode", `out/${slug}-f${frame}.png`, `--props=${props}`, `--frame=${frame}`, ...chromeArgs]);
} else {
  const out = `out/${slug}-1080x1920.mp4`;
  run("npx", ["remotion", "render", "src/index.ts", "Episode", out, `--props=${props}`, "--codec=h264", "--crf=18", "--pixel-format=yuv420p", ...chromeArgs]);
  run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,codec_name,pix_fmt", "-of", "default=nw=1", out]);
}
