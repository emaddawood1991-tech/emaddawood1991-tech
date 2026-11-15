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
