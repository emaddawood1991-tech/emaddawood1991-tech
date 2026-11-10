const test = require('node:test');
const assert = require('node:assert/strict');
const { salesData, filterByRegion, totals } = require('./logic.js');

test('overall totals', () => {
  const t = totals(salesData);
  assert.equal(salesData.length, 24);
  assert.equal(t.revenue, 3255000);
  assert.equal(t.orders, 842);
  assert.equal(t.bestMonth, 'Jun');
  assert.ok(Math.abs(t.avgOrder - 3255000 / 842) < 1e-9);
});

test('filterByRegion keeps only the chosen region', () => {
  const east = filterByRegion(salesData, 'East');
  assert.equal(east.length, 6);
  assert.ok(east.every((r) => r.region === 'East'));
  assert.equal(totals(east).revenue, 1050000);
  assert.equal(totals(east).orders, 275);
});

test('"All" returns every row as a copy; unknown region returns none', () => {
  const all = filterByRegion(salesData, 'All');
  assert.deepEqual(all, salesData);
  assert.notEqual(all, salesData);
  assert.deepEqual(filterByRegion(salesData, 'Mars'), []);
  assert.equal(totals([]).bestMonth, null);
});
