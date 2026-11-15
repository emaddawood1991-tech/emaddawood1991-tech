import test from "node:test"; import assert from "node:assert/strict";
import { counterValue, formatNumber, odometerPositions, speedRamp, rng, easeOutCubic } from "../src/fx/math.ts";
test("counter animates 0 -> 1000 frame by frame and ends exactly on 1000", () => {
  const o = { from: 0, to: 1000, start: 10, dur: 60 };
  assert.equal(counterValue(0, o), 0); assert.equal(counterValue(10, o), 0); assert.equal(counterValue(70, o), 1000); assert.equal(counterValue(200, o), 1000);
  const mid = counterValue(40, o); assert.ok(mid > 500 && mid < 1000, "ease-out: past the halfway value at the halfway frame");
  let prev = -1; for (let f = 10; f <= 70; f++) { const v = counterValue(f, o); assert.ok(v >= prev); prev = v; }
});
test("percent 0 -> 95", () => { assert.equal(Math.round(counterValue(90, { from: 0, to: 95, start: 0, dur: 90 })), 95); assert.equal(counterValue(0, { from: 0, to: 95, start: 0, dur: 90 }), 0); });
test("formatNumber", () => { assert.equal(formatNumber(1000), "1,000"); assert.equal(formatNumber(999.6), "1,000"); assert.equal(formatNumber(95.04, 1), "95.0"); assert.equal(formatNumber(1234567), "1,234,567"); });
test("odometer positions land on the digits", () => { assert.deepEqual(odometerPositions(1000, 4).map(Math.round), [1, 0, 0, 0]); assert.deepEqual(odometerPositions(95, 2).map(Math.round), [9, 5]); const p = odometerPositions(7.5, 1); assert.ok(p[0] > 7 && p[0] < 8); });
test("speed ramp is monotonic and eased", () => { const k = [{ f: 0, t: 0 }, { f: 30, t: 20 }, { f: 60, t: 100 }]; let prev = -1; for (let f = 0; f <= 60; f++) { const t = speedRamp(f, k); assert.ok(t >= prev); prev = t; } assert.equal(speedRamp(60, k), 100); assert.equal(speedRamp(30, k), 20); });
test("rng deterministic", () => { const a = rng(5), b = rng(5); for (let i = 0; i < 5; i++) assert.equal(a(), b()); assert.ok(easeOutCubic(0.5) > 0.5); });
