// Run when bland.ai hosts are reachable (add www.bland.ai, docs.bland.ai, app.bland.ai, v2.app.bland.ai, api.bland.ai, mintcdn.com to the environment's allowed domains):
//   NODE_PATH=$(npm root -g) node capture_bland.js
// Captures real pages as 1080x1920 phone-size screenshots into footage/bland/. Nothing is signed in or submitted.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  fs.mkdirSync('footage/bland', { recursive: true });
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({ proxy }); const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true }); const p = await ctx.newPage();
  for (const [name, url] of [['home', 'https://www.bland.ai'], ['mcp-page', 'https://www.bland.ai/integrations/mcp'], ['claude-guide', 'https://www.bland.ai/blog/claude-phone-number'], ['docs-mcp-overview', 'https://docs.bland.ai/integrations/mcp/overview']]) {
    try { await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }); await p.waitForTimeout(2500); await p.screenshot({ path: `footage/bland/${name}.png` }); console.log(name, 'ok'); } catch (e) { console.log(name, 'ERR', e.message.slice(0, 100)); }
  }
  await b.close();
})();
