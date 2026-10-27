import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const GOOD_KEY = "test-good-key-0123456789";
let server;
let base;
let balance = "12.50";

before(async () => {
  server = createServer((req, res) => {
    const authed = req.headers.authorization === `Bearer ${GOOD_KEY}`;
    res.setHeader("content-type", "application/json");
    if (!authed) {
      res.statusCode = 401;
      return res.end('{"error":"invalid key"}');
    }
    if (req.url === "/v1/credits") return res.end(JSON.stringify({ balance, total_used: "1.25" }));
    if (req.url === "/v1/models") {
      return res.end(
        JSON.stringify({
          data: [
            { id: "fake/video-a", name: "Video A", type: "video", pricing: { video_per_second: "0.40" } },
            { id: "fake/video-b", name: "Video B", type: "video", pricing: { tiers: { a: { per_second: "0.1" }, b: { per_second: "0.2" } } } },
            { id: "fake/text-a", name: "Text A", type: "language", pricing: { input: "0.000001" } },
          ],
        })
      );
    }
    res.statusCode = 404;
    res.end("{}");
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

function run(key, args = []) {
  const dir = mkdtempSync(join(tmpdir(), "agentoon-gw-"));
  const env = join(dir, ".env");
  const pricing = join(dir, "pricing.json");
  const models = join(dir, "gateway-models.json");
  writeFileSync(env, `AI_GATEWAY_API_KEY=${key}\n`);
  writeFileSync(pricing, JSON.stringify({ models: { "fake/video-a": { usd_per_second: null, verified: false } } }));
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(root, "verify-gateway.mjs"), ...args], {
      env: { ...process.env, AI_GATEWAY_BASE_URL: base, AGENTOON_ENV_FILE: env, AGENTOON_PRICING_FILE: pricing, AGENTOON_MODELS_FILE: models },
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => resolve({ code, out, pricing, models }));
  });
}

test("valid key: authenticates, shows credits and video models, never prints the key", async () => {
  balance = "12.50";
  const r = await run(GOOD_KEY, ["--write-pricing"]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /Authenticated with Vercel AI Gateway/);
  assert.match(r.out, /balance \$12\.50/);
  assert.match(r.out, /fake\/video-a/);
  assert.ok(!r.out.includes("fake/text-a"), "non-video models are not listed");
  assert.ok(!r.out.includes(GOOD_KEY), "key must never be printed");
  assert.match(r.out, /READY/);
  const pricing = JSON.parse(readFileSync(r.pricing, "utf8"));
  assert.equal(pricing.models["fake/video-a"].usd_per_second, 0.4);
  assert.equal(pricing.models["fake/video-a"].verified, true);
  assert.equal(pricing.models["fake/video-b"].usd_per_second, null, "ambiguous prices are never guessed");
  assert.equal(JSON.parse(readFileSync(r.models, "utf8")).models.length, 2);
});

test("rejected key: fails clearly and does not leak the key", async () => {
  const bad = "test-bad-key-9876543210";
  const r = await run(bad);
  assert.equal(r.code, 1);
  assert.match(r.out, /Key rejected by the gateway \(HTTP 401\)/);
  assert.ok(!r.out.includes(bad));
});

test("zero credits: not ready", async () => {
  balance = "0.00";
  const r = await run(GOOD_KEY);
  assert.equal(r.code, 1);
  assert.match(r.out, /no AI Gateway credits/);
  balance = "12.50";
});

test("without --write-pricing, pricing.json is not changed", async () => {
  const r = await run(GOOD_KEY);
  assert.equal(JSON.parse(readFileSync(r.pricing, "utf8")).models["fake/video-a"].usd_per_second, null);
  assert.match(r.out, /NOT READY/);
});
