# Design system

## Canvas & safe area
1080 × 1350 px (4:5). Side padding 110 px, top 84 px, content ends at y=1200 (footer 130 px at the bottom). Profile-grid crop removes ~34 px on each side: keep key content inside 110 px sides. Use `--scale=2` for 2160×2700 masters.

## Architecture
- `src/styles/base.css` — tokens, fonts, frame, cards, 5 style themes (`.style-premium|modern3d|infographic|editorial|awareness`).
- `src/components/` — `layout.js` (slide shell, header, footer/slogan, backgrounds, note, rowCard), `icons.js`, `illustrations.js`, `text.js` (markup).
- `templates/<name>/index.js` (+ `template.css`) — `build(content)` returns an array of slide HTML. `export const css` names the stylesheet.
- `src/rendering/render.js` — HTML source → Playwright PNG + QC; `render-all.js` batch.
- Output: `output/png/<slug>[-style]/slide-N.png`, `output/source/<slug>[-style]/slide-N.html` (open directly in a browser; relative links to CSS/assets).

## Templates → use
A `single-post` · B `medical-carousel` (hook → explain → symptoms → causes/risks → treatment → advice → closing; use only the slides the topic needs) · C `health-awareness` · D `medical-infographic` · E `medical-comparison`.

## Styles
1 Premium Medical (`premium`: white, blue accents) · 2 Modern Medical 3D (`modern3d`: navy→blue/aqua gradient; anatomy on a light disc; true 3D renders require supplied assets) · 3 Medical Infographic (`infographic`) · 4 Clinical Editorial (`editorial`: rules, no decoration; add licensed photography via `.photo` + `assets/medical-images`) · 5 Medical Awareness (`awareness`: soft warm gradient, medal icon). Switch with `--style=`; each style keeps FMC colours, logo and slogan.

## Adding things
- New icon: add path to `P` in `icons.js`. New illustration: vector function returning an SVG (no text inside) + HTML labels via `labels()` (coordinates in the SVG's viewBox, container must keep the viewBox aspect ratio — see `.art-frame.ar`).
- New slide type: add a renderer in the template's `renderers`; keep ≤4 cards/slide.
- New template: copy a folder under `templates/`, set `template` in the content JSON.

## QC automation (render.js)
Fonts loaded · images decoded · exact PNG size · content within safe area · no text clipping · side margins · text-on-text overlap. Manual: inspect PNGs (see `arabic-typography.md`).
