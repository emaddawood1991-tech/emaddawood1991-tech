import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { buildRequest, detectMode, parseArgs, parseCamera, validate } from "../ai-clip.mjs";
import { routeManifest, routeScene } from "../route.mjs";
import { xfadeFilter } from "../produce.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;
const clip = (args, env = {}) => spawnSync(node, [join(root, "ai-clip.mjs"), ...args], { encoding: "utf8", env: { ...process.env, ...env } });

// ---- Three.js engine and availability-aware routing
test("architectural visualization routes to Three.js", () => {
  const r = routeScene("Architectural visualization of a villa with landscaping and an orbiting camera");
  assert.equal(r.engine, "threejs");
  assert.equal(r.paid, false);
});

test("Blender is preferred for generic 3D, Three.js takes over when Blender is unavailable", () => {
  const text = "Simple 3D environment with a building, trees, shadows, lighting and a smooth orbiting camera";
  assert.equal(routeScene(text).engine, "blender");
  const r = routeScene(text, { available: ["threejs", "remotion", "ffmpeg"] });
  assert.equal(r.engine, "threejs");
  assert.equal(r.fallbackFrom, "blender");
});

test("rigged or character work never falls back to Three.js", () => {
  for (const text of ["Rigged 3D robot character animation", "Character animation of the mascot walking with a rig"]) {
    const r = routeScene(text, { available: ["threejs", "remotion"] });
    assert.equal(r.engine, "blender", text);
    assert.equal(r.fallbackFrom, null, text);
    assert.ok(r.notes.some((n) => /hand off/.test(n)), text);
  }
});

test("hybrid manifest with Blender, Three.js, AI, Playwright and Remotion", () => {
  const plan = routeManifest([
    { description: "Rigged 3D character animation with a precise orbit camera" },
    { description: "Architectural visualization with an orbiting camera and trees" },
    { description: "AI-generated cinematic establishing shot, text-to-video" },
    { description: "Real software demo in the terminal and dashboard" },
    { description: "Kinetic typography captions and outro CTA with transition" },
  ]);
  assert.deepEqual(plan.scenes.map((s) => s.engine), ["blender", "threejs", "ai-gateway", "playwright", "remotion"]);
  assert.deepEqual(plan.paidScenes, [3]);
  assert.equal(plan.finalComposer, "remotion");
});

// ---- AI Gateway modes
test("mode detection covers every requested mode", () => {
  const m = (argv) => detectMode(parseArgs(argv));
  assert.equal(m(["--prompt", "x"]), "text-to-video");
  assert.equal(m(["--image-url", "https://a/b.png"]), "image-to-video");
  assert.equal(m(["--first-frame", "https://a/1.png", "--last-frame", "https://a/2.png"]), "first-last-frame");
  assert.equal(m(["--ref", "https://a/1.png"]), "reference-to-video");
  assert.equal(m(["--character-image", "https://a/c.png", "--motion-video", "https://a/m.mp4"]), "motion-control");
});

test("requests match the documented Vercel AI Gateway shapes", () => {
  const first = buildRequest(parseArgs(["--model", "google/veo-3.1-generate-001", "--prompt", "pan", "--duration", "8", "--first-frame", "https://a/1.png", "--last-frame", "https://a/2.png"])).req;
  assert.deepEqual(first.frameImages, [{ image: "https://a/1.png", frameType: "first_frame" }, { image: "https://a/2.png", frameType: "last_frame" }]);
  assert.equal(first.aspectRatio, "9:16");

  const ref = buildRequest(parseArgs(["--model", "alibaba/wan-v2.6-r2v", "--prompt", "p", "--duration", "4", "--ref", "https://a/1.png", "--ref-video", "https://a/v.mp4"])).req;
  assert.deepEqual(ref.inputReferences, ["https://a/1.png", { data: "https://a/v.mp4", mediaType: "video/mp4" }]);

  const motion = buildRequest(parseArgs(["--model", "klingai/kling-v3.0-motion-control", "--prompt", "p", "--duration", "5", "--character-image", "https://a/c.png", "--motion-video", "https://a/m.mp4", "--quality", "pro"])).req;
  assert.deepEqual(motion.prompt, { image: "https://a/c.png", text: "p" });
  assert.deepEqual(motion.providerOptions.klingai, { videoUrl: "https://a/m.mp4", characterOrientation: "video", mode: "pro" });

  const cam = buildRequest(parseArgs(["--model", "klingai/kling-v3.0-i2v", "--prompt", "p", "--duration", "5", "--image-url", "https://a/i.png", "--camera", "simple:horizontal=2,zoom=3"])).req;
  assert.deepEqual(cam.providerOptions.klingai.cameraControl, { type: "simple", config: { horizontal: 2, zoom: 3 } });
  assert.deepEqual(parseCamera("forward_up"), { type: "forward_up" });
});

test("invalid combinations and non-hosted inputs are rejected", () => {
  const a = parseArgs(["--model", "klingai/kling-v3.0-i2v", "--prompt", "p", "--duration", "5", "--first-frame", "https://a/1.png", "--camera", "forward_up"]);
  assert.ok(validate(a, detectMode(a)).some((p) => /camera/.test(p)));
  const b = parseArgs(["--model", "klingai/kling-v3.0-i2v", "--prompt", "p", "--duration", "5", "--image-url", "C:\\local\\file.png"]);
  assert.ok(validate(b, detectMode(b)).some((p) => /hosted https URL/.test(p)));
});

test("dry run shows the card for each mode and sends nothing", () => {
  const r = clip(["--model", "klingai/kling-v3.0-motion-control", "--prompt", "walk", "--duration", "5", "--character-image", "https://cdn.example.com/c.png", "--motion-video", "https://cdn.example.com/m.mp4"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Mode:\s+motion-control/);
  assert.match(r.stdout, /listed for this mode/);
  assert.match(r.stdout, /cdn\.example\.com/);
  assert.match(r.stdout, /Dry run only/);
});

test("a model not listed for the mode is flagged and refused live", () => {
  const dry = clip(["--model", "alibaba/wan-v2.6-t2v", "--image-url", "https://a/i.png", "--prompt", "p", "--duration", "5"]);
  assert.match(dry.stdout, /UNVERIFIED/);
  const live = clip(["--model", "alibaba/wan-v2.6-t2v", "--image-url", "https://a/i.png", "--prompt", "p", "--duration", "5", "--confirm"], { AI_GATEWAY_API_KEY: "test-secret-1234567890" });
  assert.equal(live.status, 2);
  assert.ok(!live.stdout.includes("test-secret-1234567890") && !live.stderr.includes("test-secret-1234567890"));
});

// ---- production assembly
test("cross-fade offsets and total length", () => {
  assert.deepEqual(xfadeFilter([2, 7], 0.4).total, 8.6);
  assert.match(xfadeFilter([2, 7], 0.4).filter, /offset=1\.6/);
  const three = xfadeFilter([5, 5, 5], 0.5);
  assert.equal(three.total, 14);
  assert.match(three.filter, /offset=4\.5/);
  assert.match(three.filter, /offset=9/);
  assert.equal(xfadeFilter([6], 0.4).total, 6);
});

test("produce dry run reports blocked scenes without running anything", () => {
  const r = spawnSync(node, [join(root, "produce.mjs"), join(root, "productions", "demo-hybrid.json"), "--dry-run"], { encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /scene 04 \[ai-gateway\] blocked/);
  assert.match(r.stdout, /generate with ai-clip\.mjs after approval/);
});
