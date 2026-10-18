# FMC Design System — Arabic medical Instagram production

Code-based design system for **مركز الفيصل الطبي (Al Faisal Medical Center, Al Ain)**. Arabic text is real HTML/CSS (never AI-generated in images), rendered with Playwright to exact **1080 × 1350** PNGs.

## Quick start
```bash
cd FMC-Design-System
npm install                       # playwright + embedded font packages (Chromium is pre-installed in this environment)
npm run demo                      # 5-slide carpal-tunnel carousel → output/png/carpal-tunnel/
npm run samples                   # all templates (A–E) → output/png/sample-*/
node src/rendering/render.js src/content/<file>.json --style=modern3d --scale=2 --only=1,2
```
Open any `output/source/<slug>/slide-N.html` in a browser to edit visually; change the content JSON and re-render for text edits.

## Make a new post
1. Copy `src/content/carpal-tunnel.json` (or a file in `src/content/samples/`), set `slug`, `template`, `style`, slides (schema in `.claude/skills/fmc-medical-carousel/SKILL.md`).
2. Write Arabic copy → medical review → proofread (`references/`).
3. `node src/rendering/render.js src/content/<slug>.json` — automatic QC prints problems (exit code 2).
4. Open every PNG and read every word; fix and re-render with `--only=`.
5. Write caption + hashtags (`output/caption-<slug>.md`). Publishing is always manual.
In Claude Code, say e.g. "use fmc-medical-carousel: carousel about frozen shoulder, 6 slides".

## Structure
`.claude/skills/fmc-medical-carousel/` skill + 4 reference docs · `assets/` logo, fonts (Cairo, Tajawal, IBM Plex Sans Arabic), icons, images · `templates/` A single-post, B medical-carousel, C health-awareness, D medical-infographic, E medical-comparison · `src/` components, styles, content, rendering · `output/png|source`.

## Styles (`--style=`)
`premium` · `modern3d` · `infographic` · `editorial` · `awareness` — gallery in `output/png/style-gallery/`.

## Known limitations (be aware)
- **Logo**: the file in `assets/logo/` was taken from this repo (`remotion-studio/public/images/fmc-logo.webp`). Confirm it is the official master; replace the three logo files if you have a vector original.
- **Colours**: the logo is blue / silver-blue / red, so the palette follows it. Turquoise (from the brief) is not in the logo and is only used as a subtle glow in the dark style.
- **Illustrations** are original schematic SVG vector drawings (hand + median nerve, wrist cross-section) — no image-generation tool was used and no stock images were downloaded. True photoreal/3D anatomy and "Clinical Editorial" photography need licensed assets dropped into `assets/medical-images/`.
- Arabic was proofread and visually inspected, but a native-speaking clinician should give the final sign-off before publishing.
