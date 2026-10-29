import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { editVideo } from "../agentoon-tool.mjs";
import { info, joinClips, resize, speed, trim } from "../edit.mjs";
import { collect } from "../package-skill.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let dir, src;

before(() => {
  dir = mkdtempSync(join(tmpdir(), "agentoon-skill-"));
  src = join(dir, "src.mp4");
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=size=320x180:rate=24:duration=3", "-pix_fmt", "yuv420p", src]);
  assert.equal(r.status, 0);
});
after(() => rmSync(dir, { recursive: true, force: true }));

test("info, trim, speed and resize", () => {
  assert.equal(info(src).seconds, 3);
  assert.ok(Math.abs(trim(src, join(dir, "t.mp4"), { start: 0.5, end: 2 }).seconds - 1.5) < 0.1);
  assert.ok(Math.abs(speed(src, join(dir, "s.mp4"), { factor: 2 }).seconds - 1.5) < 0.1);
  const r = resize(src, join(dir, "r.mp4"), { width: 180, height: 320 });
  assert.deepEqual([r.width, r.height], [180, 320]);
});

test("join cross-fades clips into one shorter-than-the-sum video", () => {
  const out = joinClips(join(dir, "j.mp4"), [src, src], { fade: 0.5, width: 180, height: 320 });
  assert.ok(Math.abs(out.seconds - 5.5) < 0.15);
  assert.throws(() => joinClips(join(dir, "bad.mp4"), [src, src], { fade: 2 }), /longer than/);
});

test("edit_video tool reports unknown ops and missing files cleanly", () => {
  assert.throws(() => editVideo({ op: "nope" }), /Unknown op/);
  assert.throws(() => editVideo({ op: "info", input: join(dir, "missing.mp4") }), /not found/);
  const r = spawnSync(process.execPath, [join(root, "agentoon-tool.mjs"), "edit_video", '{"op":"nope"}'], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.equal(JSON.parse(r.stdout).ok, false);
});

test("skill bundle is self-contained and has no secrets or node_modules", () => {
  const names = collect().map((e) => e.name);
  for (const need of ["SKILL.md", "spec-reference.md", "tool-definitions.json", "scripts/edit.mjs", "scripts/agentoon-tool.mjs", "scripts/threejs/render.mjs", "scripts/threejs/builder.mjs", "scripts/threejs/specs/demo-orbit.json"]) {
    assert.ok(names.includes(`agentoon-3d-video/${need}`), need);
  }
  assert.ok(!names.some((n) => /node_modules|\.env$/.test(n)));
});
