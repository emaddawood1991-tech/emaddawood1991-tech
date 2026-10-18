# FMC-Carousel

Reusable generator of Arabic (RTL) Instagram medical carousels for **مركز الفيصل الطبي** — HTML/CSS/SVG slides → Playwright → 1080×1350 PNG. Static images only; nothing is published automatically.

```bash
npm install                                   # playwright + (Chromium preinstalled in this env)
npm run demo                                  # render demo + contact sheet + ZIP
node src/rendering/render.js src/content/<slug>.json [--only=1,3] [--scale=2]
node src/rendering/contact-sheet.js <slug>    # output/preview/contact-sheet.png
node src/rendering/pack.js <slug>             # output/FMC-Carousel-<slug>.zip
```
New carousel: in Claude Code use the `fmc-carousel` skill ("make a carousel about frozen shoulder"), or copy `src/content/carpal-tunnel.json`.

Layout: `.claude/skills/fmc-carousel/SKILL.md` (all rules) · `assets/` (logo, fonts, medical, icons) · `templates/carousel` · `src/` (components, styles, content, rendering) · `output/png|preview|source`.
Edit slides: open `output/source/<slug>/slide-N.html` in a browser (relative links to CSS/fonts/logo are kept in the ZIP).

Notes: logo came from `remotion-studio/public/images/fmc-logo.webp` in this repo — confirm it's the official master. Illustrations are original schematic vector drawings (no AI image generation, no stock). A native-Arabic clinician should sign off before posting.
