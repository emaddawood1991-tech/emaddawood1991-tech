# Agentoon.ai real skill registry (updated 2026-11-15)

## Installed from GitHub (project level, `.claude/skills/`, reviewed before install)
| Skill dir | Source | Licence | Notes |
|---|---|---|---|
| `video-effects` | github.com/JesseEisenbart/video-effects-skill @2b173e3 | MIT | 21-effect Remotion project for talking-head footage. Needs `npm install` inside its folder (git-ignored). Person matting is macOS-only (Apple Vision): supply masks/alpha elsewhere. NOT rendered here yet. |
| `motion-graphics`, `cinematic-camera`, `terminal-inserts`, `article-highlights` | github.com/Liamrjohnston/remotion-motion-graphics-skill @b860c79 | MIT | Copied the 4 skill folders only (its `install.sh` pipes curl/npx scaffolding and refuses to run inside a git repo; not executed). Their mandatory intake questions are pre-answered by Agentoon defaults; three forbid neon. NOT rendered here yet. |

## Reviewed and NOT installed
| Repo | Decision |
|---|---|
| JulianVolodia/claudestory_claude-remotion-skill (MIT) | SKIP: same purpose as Liam's `motion-graphics`; its description says to trigger "EVERY time" a video is requested, which would override `/agentoon-director`. |
| yours2grab/video-editor | SKIP: no LICENSE file (cannot copy); it is a project, not a skill; setup downloads whisper.cpp. Ideas only (transcribe, trim, behind-speaker graphics). |
| Safiullah-Rahu/claude-video-skills (MIT, 61 skills, 456 MB) | SKIP for now: HyperFrames-pinned (0.8.210) explainer formats that all need `explainer-engine` (npm + Kokoro + fonts); would flood skill triggers. Candidates later: `explainer-collage-brand`, `explainer-saas-ui`. |
| remotion-dev/skills | REUSE existing `remotion:*` plugin skills (same set); no LICENSE file in the repo root, so not copied. |

## Created (Agentoon, working Remotion code)
| Slash skill | SKILL.md | Component |
|---|---|---|
| `/scrapbook-collage` | `.claude/skills/scrapbook-collage/` | `agentoon-video/remotion-fx/src/fx/ScrapbookCollage.tsx` |
| `/explainer-panel-reel` | `.claude/skills/explainer-panel-reel/` | `.../ExplainerPanel.tsx` |
| `/neon-outline` | `.claude/skills/neon-outline/` | `.../NeonOutline.tsx` (+ `scripts/render-robot-layers.cjs`) |
| `/agentoon-director` (extended, section 7) | `.claude/skills/agentoon-director/` | `scripts/discover-skills.py`, `check-fx-usage.py`, `render-fx.sh`, `reference/fx-styles.md` |

## Dependencies
Node 22, npm packages in `agentoon-video/remotion-fx/package.json` (remotion 4.0.505, react 19.2.3; Remotion is free for individuals/small teams, check its licence for company use), headless Chromium at `/opt/pw-browsers/chromium_headless_shell-1194` (auto-detected in `remotion.config.ts`, override with `REMOTION_BROWSER`), ffmpeg, Python 3 with numpy/Pillow/scipy (verifier), Playwright (robot layer + screenshot captures).

## Working slash commands
`/scrapbook-collage`, `/explainer-panel-reel`, `/neon-outline`, `/agentoon-director <brief>`, plus the installed `/video-effects`, `/motion-graphics`, `/cinematic-camera`, `/terminal-inserts`, `/article-highlights`, and the existing `/agentoon-*` specialists (most are guidance-only: `discover-skills.py` shows which are `doc-only`).

## Test results (5 s, 1080x1920, 30 fps, 150 frames each; `agentoon-video/remotion-fx/proof/`)
`python3 scripts/verify-fx.py` → ALL PASS (13 checks): A lime highlight, paper grain, white paper/sticker borders, staggered entrances, camera depth motion; B amber callouts/connector, lime caption/step, camera glide, step advance, cursor/click motion; C neon pixels hug the robot silhouette (ring share 0.068 vs 0.00001 far away), outline animates, subject on top. Frames were also viewed (proof/*-frames.png).

## Limitations
- The "existing 3D robot" is the 2D SVG rig (`kit/robot.js`); no Blender/3D robot asset exists in the repo or the machine (Blender not installed). `/neon-outline` uses the robot's rendered alpha layer; a 3D alpha pass can replace it unchanged.
- The reference video `1000290009.mp4` was not found in the uploads; the three style names were implemented from their descriptions in your brief (original source unverified).
- Test A/B screenshots are third-party site captures used only for the proofs.
- video-effects and Liam's skills are installed but not yet exercised on a real episode.


# EXPANSION 2026-11-15: full motion-graphics system
## Upstream libraries reviewed (licences read from each repo's LICENSE; none is a ready-made Claude skill, so they are wrapped by our components)
| Library | Licence | Used? |
|---|---|---|
| remotion-dev/remotion @cc7879e | Remotion License (free for individuals and small companies; company licence otherwise; Remotion 5 changes it) | YES: engine, `@remotion/transitions`, `motion-blur`, `paths`, `three`, `lottie` installed |
| remotion-dev/skills | no LICENSE file in the repo | reused via the existing `remotion:*` plugin skills (not copied) |
| pmndrs/react-three-fiber @d74622e, pmndrs/drei @bf6f4ad, pmndrs/three-stdlib @e0e835a | MIT | R3F + three used by `three.tsx`; drei and three-stdlib installed (drei pinned 10.0.7), not needed by current components (no HDR/env maps: software GL) |
| mrdoob/three.js @6281ce3 | MIT | YES: SVGLoader, ExtrudeGeometry, FontLoader/TextGeometry, bundled helvetiker typeface |
| greensock/GSAP @5e6c35f | GreenSock standard "no charge" licence (all plugins free incl. commercial) | installed; used by the HyperFrames episodes (kit). Not used in the Remotion components (Remotion's `spring`/`interpolate` are frame-deterministic) |
| motiondivision/motion @f95ab94 | MIT | REVIEWED, NOT integrated: real-time animation engine; Remotion springs cover the need |
| airbnb/lottie-web @bede03d | MIT | `@remotion/lottie` + lottie-web installed for Lottie assets; no Lottie file is used yet (no demo claimed) |
| Blender (bpy 5.3.0 from PyPI) | GPL | YES: `blender/render_logo_turntable.py` rendered a real Cycles turntable (public/blender/cal, 36 frames) used in showcase S04 |

## New slash skills (all with working components + rendered demos)
`/agentoon-data-motion`, `/agentoon-3d-motion`, `/agentoon-kinetic-type`, `/agentoon-infographics`, `/agentoon-logo-motion`, `/agentoon-cinematic-fx` (+ the earlier `/scrapbook-collage`, `/explainer-panel-reel`, `/neon-outline`). Components and props: `agentoon-video/remotion-fx/README.md`. Selection data: `.claude/skills/agentoon-director/reference/fx-registry.json` (read by `select-skills.py`).

## Verification (see agentoon-video/remotion-fx/proof/)
- `npm test`: 6/6 pure-math tests (counter 0 to 1,000 frame by frame, 0 to 95 percent, number formatting, odometer positions, speed ramp, seeded RNG).
- `python3 scripts/verify-showcase.py`: pixel/motion checks per scene and per transition on the rendered showcase (result in `proof/verify-showcase.json`).
- Frames viewed by hand during development; bugs found and fixed: 3D panels blank (delayRender inside the R3F tree does not block capture), 3D logo back-face frames, stroke-only SVG parts, missing asset 404, screenshot text warped by the paper filter.

## Limitations
Blender's SVG import ignores stroke-only shapes and complex SVGs (AppFlowy) import badly: use filled-shape logos; `drei`/`motion`/`lottie` are installed or reviewed but not yet exercised; the showcase uses demo data and illustrative values (labelled); no Lottie demo; software GL makes 3D scenes slow (about 3-6 s per frame).
