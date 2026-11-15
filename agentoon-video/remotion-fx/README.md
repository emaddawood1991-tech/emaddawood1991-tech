# agentoon-remotion-fx

Reusable, parameterised Remotion animation components for Agentoon.ai videos (1080x1920, 30 fps). Rendered proof: `proof/`.

| Skill (slash) | Component file | Demo scene(s) |
|---|---|---|
| /scrapbook-collage | `src/fx/ScrapbookCollage.tsx` | S10, TestA |
| /explainer-panel-reel | `src/fx/ExplainerPanel.tsx` | S11, TestB |
| /neon-outline | `src/fx/NeonOutline.tsx` | S09, TestC |
| /agentoon-data-motion | `src/fx/data.tsx` (+ `math.ts`) | S01 S02 S03 |
| /agentoon-3d-motion | `src/fx/three.tsx`, `blender.tsx`, `blender/render_logo_turntable.py` | S04 S05 |
| /agentoon-kinetic-type | `src/fx/kinetic.tsx` | S06 (+S08) |
| /agentoon-infographics | `src/fx/infographics.tsx` | S07 S08 |
| /agentoon-logo-motion | `src/fx/logo.tsx` | S12 |
| /agentoon-cinematic-fx | `src/fx/cinematic.tsx` | transitions + S13 |

Setup: `npm install` (Node 22). Chromium is auto-detected (`remotion.config.ts`, override `REMOTION_BROWSER`); software GL (`swangle`) is configured for the 3D scenes.
Commands: `npm test` (pure-math unit tests) · `npx remotion still S05 out/s5.png --frame=60` · `npm run render:showcase` · `python3 scripts/verify-showcase.py` · `bash scripts/render-tests.sh && python3 scripts/verify-fx.py` (TestA-C) · Blender: `pip install bpy` then `npm run blender:logo`.
Rules: frame-based only (no Date/Math.random/real-time hooks); load external assets in the component body (not inside the R3F tree); real logos/screenshots only; label concept diagrams and illustrative values.
Licences: Remotion (own licence: free for individuals / small companies, see remotion.dev/license), three.js, @react-three/fiber, drei, lottie-web (MIT), gsap (GreenSock standard no-charge licence), bpy/Blender (GPL; renders are your own output).
