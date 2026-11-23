// Pilot pack check (stage S15): builds the printable guides, prints each to PDF and requires every guide and feedback sheet to fit on ONE A4 page,
// in English and Arabic (right-to-left), with the role's username and real screen names in the text. Writes the PDFs next to the HTML.
//   node tests/e2e-pilot-pack.cjs [outDir]      (default: ../docs/pilot)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'docs', 'pilot'));
const ok = (c, m) => { console.log(c ? 'ok  -' : 'FAIL:', m); if (!c) process.exitCode = 1; };
(async () => {
  const { build } = await import('../scripts/build-pilot-pack.mjs');
  const files = build(out); fs.mkdirSync(path.join(out, 'pdf'), { recursive: true });
  const b = await chromium.launch(); const page = await b.newPage();
  const content = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pilot', 'content.json'), 'utf8'));
  let pages = 0; const problems = [];
  for (const f of files) {
    await page.goto('file://' + f); await page.waitForTimeout(150);
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    const n = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length; pages += n;
    fs.writeFileSync(path.join(out, 'pdf', path.basename(f).replace('.html', '.pdf')), pdf);
    if (n !== 1) problems.push(`${path.basename(f)} prints on ${n} pages`);
    const dir = await page.evaluate(() => document.documentElement.dir); const isAr = /-ar\.html$/.test(f);
    if (isAr !== (dir === 'rtl')) problems.push(`${path.basename(f)} has the wrong text direction (${dir})`);
    const text = await page.evaluate(() => document.body.innerText);
    if (!/feedback/.test(f)) {
      const role = path.basename(f).split('-')[0];
      if (!text.includes(content.roles[role].user)) problems.push(`${path.basename(f)} does not show the trial username`);
      if (isAr && !/[؀-ۿ]{4,}/.test(text)) problems.push(`${path.basename(f)} has no Arabic text`);
    }
  }
  await b.close();
  ok(files.length === 10, `${files.length} printable pages built (4 role guides + feedback sheet, English and Arabic)`);
  ok(problems.length === 0, problems.length ? problems.join('; ') : `every page fits on exactly one A4 sheet (${pages} pages in total), with correct direction and the trial usernames`);
})();
