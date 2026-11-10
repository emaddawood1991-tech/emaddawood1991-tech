// Shared by index.html (classic <script>) and test.js (require) — no build step.
(function (root) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const RAW = {
    North: { revenue: [120, 135, 150, 160, 155, 180], orders: [30, 34, 36, 40, 38, 45] },
    South: { revenue: [90, 95, 110, 105, 120, 130], orders: [25, 26, 30, 28, 32, 35] },
    East: { revenue: [150, 145, 170, 185, 190, 210], orders: [40, 38, 44, 48, 50, 55] },
    West: { revenue: [80, 100, 95, 115, 125, 140], orders: [20, 26, 24, 30, 32, 36] },
  };
  const REGIONS = Object.keys(RAW);
  // One row per region per month; revenue in dollars.
  const salesData = REGIONS.flatMap((region) =>
    MONTHS.map((month, i) => ({ region, month, revenue: RAW[region].revenue[i] * 1000, orders: RAW[region].orders[i] }))
  );
  function filterByRegion(rows, region) {
    return !region || region === 'All' ? rows.slice() : rows.filter((r) => r.region === region);
  }
  function byMonth(rows) {
    return MONTHS.map((month) => ({
      month,
      revenue: rows.filter((r) => r.month === month).reduce((s, r) => s + r.revenue, 0),
    }));
  }
  function totals(rows) {
    const revenue = rows.reduce((s, r) => s + r.revenue, 0);
    const orders = rows.reduce((s, r) => s + r.orders, 0);
    const best = byMonth(rows).reduce((a, b) => (b.revenue > a.revenue ? b : a));
    return { revenue, orders, avgOrder: orders ? revenue / orders : 0, bestMonth: revenue ? best.month : null };
  }

  const api = { MONTHS, REGIONS, salesData, filterByRegion, byMonth, totals };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Sales = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
