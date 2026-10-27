import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { routeManifest, routeScene } from "../route.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const cases = [
  ["Rigged 3D robot character animation walking through a 3D environment", "blender"],
  ["Product turntable animation with precise orbit camera path", "blender"],
  ["Real software demo: install the CLI in the terminal and open the dashboard", "playwright"],
  ["Show the GitHub page and a real demo of the install command", "playwright"],
  ["Stock b-roll of a city at sunset as background video", "pexels"],
  ["Real-world footage of people working in an office", "pexels"],
  ["Kinetic typography title card with captions and a transition", "remotion"],
  ["Animated chart and lower third with CTA outro", "remotion"],
  ["AI-generated cinematic establishing shot of a futuristic city, text-to-video", "ai-gateway"],
  ["Photoreal dreamlike clip generated with Veo", "ai-gateway"],
  ["Continue the existing episode with robot acting in HyperFrames", "hyperframes"],
];

for (const [description, expected] of cases) {
  test(`routes to ${expected}: ${description}`, () => {
    assert.equal(routeScene(description).engine, expected);
  });
}

test("mascot is never generated from text", () => {
  const r = routeScene("AI-generated cinematic clip of the Agentoon robot mascot");
  assert.notEqual(r.engine, "ai-gateway");
  assert.equal(r.engine, "blender");
});

test("mascot image-to-video needs a reference image", () => {
  const r = routeScene("image-to-video of the Agentoon robot from an approved render");
  assert.equal(r.engine, "ai-gateway");
  assert.equal(r.requiresReferenceImage, true);
  assert.equal(r.requiresApproval, true);
});

test("precision beats AI when both match", () => {
  const r = routeScene("AI generated clip with a precise rigged camera path");
  assert.equal(r.engine, "blender");
});

test("real software is never AI-generated", () => {
  const r = routeScene("AI-generated real software demo of the terminal");
  assert.equal(r.engine, "playwright");
});

test("only the AI engine is paid and needs approval", () => {
  for (const [description, expected] of cases) {
    const r = routeScene(description);
    assert.equal(r.paid, expected === "ai-gateway", description);
    assert.equal(r.requiresApproval, r.paid, description);
  }
});

test("unclear scenes default to the composer with low confidence", () => {
  const r = routeScene("something nice");
  assert.equal(r.engine, "remotion");
  assert.equal(r.confidence, "low");
});

test("composer defaults to Remotion; HyperFrames only for existing-episode scenes", () => {
  assert.equal(routeScene("Rigged 3D character animation").composer, "remotion");
  assert.equal(routeScene("existing episode robot acting in hyperframes").composer, "hyperframes");
});

test("hybrid manifest: Blender, AI clip, Playwright demo, Remotion graphics", () => {
  const plan = routeManifest([
    { description: "Rigged 3D character animation with a precise orbit camera", seconds: 6 },
    { description: "AI-generated cinematic establishing shot, text-to-video", seconds: 5 },
    { description: "Real software demo in the terminal and dashboard", seconds: 12 },
    { description: "Kinetic typography captions and outro CTA with transition", seconds: 8 },
  ]);
  assert.deepEqual(plan.scenes.map((s) => s.engine), ["blender", "ai-gateway", "playwright", "remotion"]);
  assert.deepEqual(plan.paidScenes, [2]);
  assert.equal(plan.hybrid, true);
  assert.equal(plan.finalComposer, "remotion");
});

test("ai-clip dry run sends nothing and shows the approval card", () => {
  const r = spawnSync(process.execPath, [join(root, "ai-clip.mjs"), "--model", "google/veo-3.1-generate-001", "--prompt", "test", "--duration", "5"], { encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Provider:\s+Vercel AI Gateway/);
  assert.match(r.stdout, /Model:\s+google\/veo-3.1-generate-001/);
  assert.match(r.stdout, /Dry run only/);
});

test("ai-clip refuses a live call with unknown price or missing key", () => {
  const env = { ...process.env };
  delete env.AI_GATEWAY_API_KEY;
  const r = spawnSync(process.execPath, [join(root, "ai-clip.mjs"), "--model", "google/veo-3.1-generate-001", "--prompt", "test", "--duration", "5", "--confirm"], { encoding: "utf8", env });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /REFUSED/);
});

test("ai-clip never prints a key value", () => {
  const secret = "test-secret-value-1234567890";
  const r = spawnSync(process.execPath, [join(root, "ai-clip.mjs"), "--model", "google/veo-3.1-generate-001", "--prompt", "test", "--duration", "5", "--confirm"], { encoding: "utf8", env: { ...process.env, AI_GATEWAY_API_KEY: secret } });
  assert.ok(!r.stdout.includes(secret) && !r.stderr.includes(secret));
});
