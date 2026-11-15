---
name: scrapbook-collage
description: >-
  Agentoon.ai Remotion effect: layered editorial scrapbook collage with torn-paper screenshot cards, sticker cutouts (the robot), logos, tape, notes, kinetic title,
  staggered spring entrances and parallax camera depth. Use when a scene needs several real screenshots, logos or tools shown together (roundups,
  "N alternatives", hooks, recaps). Type /scrapbook-collage.
---

# /scrapbook-collage

Real, working Remotion component: `agentoon-video/remotion-fx/src/fx/ScrapbookCollage.tsx` (proof clip: `agentoon-video/remotion-fx/proof/test-a-scrapbook.mp4`).

## When to use / not use
Use for roundups, hooks and recaps with 3+ real images. Do NOT use for step-by-step UI explanations (use /explainer-panel-reel) or presenter shots (/neon-outline). One collage per video is usually enough (never in every scene).

## Steps
1. Collect REAL material: screenshots (Playwright captures of the official site), the project's own logos, the robot layer `public/robot/robot-neutral.png` (`node scripts/render-robot-layers.cjs`). Never invent screenshots. Copy files into `agentoon-video/remotion-fx/public/{shots,logos,robot}/` (JPEG for screenshots).
2. Write a composition (see `src/tests/TestA.tsx`): an array of `CollageItem`s (`kind: shot | logo | cutout | note`, `x/y/w`, `rot`, `depth` 0..1, `delay` frame, `from` direction, `tape`, `zoom` push-in) plus `titleWords`, `highlightWord`.
3. Register it in `src/Root.tsx` (`<Composition id=... width=1080 height=1920 fps=30>`).
4. Preview a frame: `cd agentoon-video/remotion-fx && npx remotion still <Id> out/x.png --frame=90`, look at it, fix overlaps (title vs logos, robot vs notes).
5. Render: `npx remotion render <Id> out/<name>.mp4 --codec=h264 --crf=18`; composite into the episode (ffmpeg overlay, or use as a full scene clip in the HyperFrames episode as `<video>`).
6. Verify with `python3 scripts/verify-fx.py` pattern (extend it for the new clip).

## Craft rules (implemented in the component)
- Entrances: `spring` (pop preset), stagger 5-6 frames, alternate directions; idle float keeps holds alive; parallax = `0.4 + depth*1.6`.
- Only the paper backing is roughened (feDisplacementMap): screenshots stay crisp and readable on a phone.
- Paper: fractal-noise grain + fibre layers + vignette (procedural, no stock texture needed).
- Keep text ≥ 30 px; keep captions off the collage (top 280 px reserved for title/captions).
- Label honestly: collage cards of websites are SCREENSHOTS, not demos.
