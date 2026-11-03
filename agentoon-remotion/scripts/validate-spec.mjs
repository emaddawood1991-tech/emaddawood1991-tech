// Usage: node scripts/validate-spec.mjs [slug]   (default: sample)
import fs from "node:fs";
import path from "node:path";

const slug = process.argv[2] ?? "sample";
const file = path.resolve("episodes", slug, "episode.json");
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

if (!fs.existsSync(file)) { console.error(`Missing ${file}`); process.exit(1); }
const ep = JSON.parse(fs.readFileSync(file, "utf8"));
const W = 1080, H = 1920, SAFE = { top: 250, bottom: 340, side: 60 };

if (ep.meta?.width !== W || ep.meta?.height !== H) err(`meta must be ${W}x${H}`);
if (![24, 25, 30, 60].includes(ep.meta?.fps)) warn(`unusual fps ${ep.meta?.fps}`);
if (!ep.scenes?.length) err("no scenes");

const tSec = ep.transitionSeconds ?? 0.4;
const ids = new Set();
const pub = (p) => path.resolve("public", p);
const exists = (p) => /^https?:/.test(p) || fs.existsSync(pub(p));

(ep.scenes ?? []).forEach((s, i) => {
  if (ids.has(s.id)) err(`duplicate scene id ${s.id}`); ids.add(s.id);
  if (!(s.duration > 0)) err(`${s.id}: duration must be > 0`);
  if (i < ep.scenes.length - 1 && (s.transition ?? "fade") !== "none") {
    const next = ep.scenes[i + 1];
    if (tSec >= Math.min(s.duration, next.duration)) err(`${s.id}: transition (${tSec}s) >= scene length`);
  }
  const lids = new Set();
  for (const l of s.layers ?? []) {
    if (lids.has(l.id)) err(`${s.id}: duplicate layer id ${l.id}`); lids.add(l.id);
    if (l.x < 0 || l.y < 0 || l.x + l.w > W + 1 || l.y + l.h > H + 1) warn(`${s.id}/${l.id}: outside canvas (bleed ok for backgrounds)`);
    if (l.type === "text") {
      if (l.fontSize < 40) warn(`${s.id}/${l.id}: fontSize ${l.fontSize} may be unreadable on a phone`);
      const inSafe = l.x >= SAFE.side && l.x + l.w <= W - SAFE.side && l.y >= SAFE.top && l.y + l.h <= H - SAFE.bottom;
      if (!inSafe) warn(`${s.id}/${l.id}: text outside UI safe area`);
    }
    if (l.type === "image" && !exists(l.src)) err(`${s.id}/${l.id}: missing asset public/${l.src}`);
  }
});
for (const f of ep.fonts ?? []) if (!exists(f.src)) err(`missing font public/${f.src}`);
for (const k of ["narration", "music"]) if (ep.audio?.[k] && !exists(ep.audio[k])) err(`missing audio public/${ep.audio[k]}`);

const fps = ep.meta?.fps ?? 30;
const total = (ep.scenes ?? []).reduce((a, s, i) => a + Math.round(s.duration * fps) -
  (i < ep.scenes.length - 1 && (s.transition ?? "fade") !== "none" ? Math.round(tSec * fps) : 0), 0);
console.log(`episode "${slug}": ${ep.scenes?.length} scenes, ${(total / fps).toFixed(2)}s (${total} frames @ ${fps}fps)`);
warns.forEach((w) => console.log("  warn:", w));
errors.forEach((e) => console.log("  ERROR:", e));
process.exit(errors.length ? 1 : 0);
