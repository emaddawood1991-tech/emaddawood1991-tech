# FMC V7 — Dependency & Licensing Report

Method: each repository was shallow-cloned read-only into `/home/user/<owner>/<repo>` (outside the FMC project), `LICENSE`, README, `package.json`, plugin manifests and skill files were read. Licence text for GSAP could not be fetched (gsap.com is blocked from this environment); its npm metadata was read instead. Nothing was run from these repos except the HyperFrames CLI (`lint`, `check`, `timeline`, `keyframes`) inside an isolated folder.

## Summary
| Tool | Licence (verified from LICENSE file) | Commercial use | Selected version / commit | Cost / external services | Decision |
|---|---|---|---|---|---|
| **HyperFrames** (`heygen-com/hyperframes`) | Apache-2.0 | Yes | plugin & CLI **0.8.171**, repo commit `dc0e80e73af1` (2026-10-18) | Free local CLI. **Optional HeyGen cloud rendering, HeyGen-catalog music/SFX/TTS via `/media-use`, `heygen auth login`** → treat as paid/external | **Installed** (Claude plugin, user scope) + CLI via pinned `npx`. Used for lint/check/keyframes/timeline on an isolated overlay study only. Cloud/TTS/catalog/`add`/`render` **blocked** by `scripts/hf.mjs` |
| **Lemo Opuscar** (`lemomo-ai/lemo-opuscar`) | MIT | Yes | plugin from commit `508848acb2b4` (v0.1.0) | Plugin itself is guidance. Its tooling can download sample libraries (GitHub/Hugging Face/PyPI), use online edge-tts for Chinese, Whisper. README: "built for Claude Opus 5.5; other models may not reproduce the styles" | **Installed** (Claude plugin, user scope) as reference only. Directing guidance adapted; **no code/assets/styles copied; its sound-design advice not adopted** |
| **ClaudeAnimationBase** (`JohnHeibel/ClaudeAnimationBase`) | MIT | Yes (code) | commit `0ac8bf2b3194` | Free (p5.js, p5.brush, puppeteer-core). Its sample character "Clawd" is an Anthropic-style mascot — **not** licensed for FMC use by this MIT file alone | **Not installed.** Read the animation-principles guide only; principles re-implemented from scratch for the 3D rig. Sample character/assets not used |
| **OneTake** (`feitangyuan/onetake`) | **PolyForm Noncommercial 1.0.0** (+ "Commercial use is not permitted"; commercial licence = paid "onetake Pro") | **No** | commit `4157581` | Paid Pro tier for commercial use | **Not installed, not used.** FMC is a commercial clinic. Only the public one-line concept ("no slide-to-slide cuts") informed an *original* design (`continuousTransitions.ts`). Clone deleted from the machine |
| **Collage B-roll** (`pyang5166/gbro-collage-broll`) | MIT | Yes (code) | commit `a1a4ee2e2abf` | **Paid:** Gemini Omni Flash video generation via `GEMINI_API_KEY` (pay-per-use); also needs Codex `image_gen` | **Not installed, not run.** Not activated. Local original technique described in `docs/v7/COLLAGE_NOTE.md`, not built |

Nothing paid was activated. No API key was requested, created, printed or committed. HyperFrames telemetry is switched off (`HYPERFRAMES_NO_TELEMETRY=1`, `DO_NOT_TRACK=1`) in the wrapper.

## HyperFrames — details
- **Verified current:** the README and `docs/guides/plugins.mdx` still document `claude plugin marketplace add heygen-com/hyperframes` + `claude plugin install hyperframes@hyperframes`; both ran successfully (marketplace `hyperframes`, plugin inventory: 21 skills, **0 agents, 0 hooks, 0 MCP servers** → nothing runs automatically).
- **Already installed?** No (checked `claude plugin list` first). Not duplicated.
- **Requirements:** Node ≥ 22 (machine: 22.22.0 ✔), FFmpeg (6.1.1 ✔), Chrome via `puppeteer-core` (the Playwright Chromium was usable; `check` ran, software-GL probe).
- **CLI dependencies** (npm `hyperframes@0.8.171`): hono, open, citty, debug, giget, sharp, yauzl, ignore, adm-zip, esbuild, fontkit, postcss, css-tree, prettier, puppeteer-core, compare-versions, @hono/node-server, @puppeteer/browsers. Fetched on demand by `npx` into the npm cache; **not** added to FMC's `package.json`. Unnecessary-for-FMC parts: cloud/Lambda/Cloud Run packages, TTS/transcribe models, `media-use`, registry catalog, social/product-launch workflows.
- **Third-party notes from its CREDITS.md:** Studio uses `mediabunny` (MPL-2.0); GSAP, Puppeteer, FFmpeg are upstream deps.
- **Plugin cost:** ~4.1 k always-on tokens per Claude session (plugin details). Disable with `claude plugin disable hyperframes@hyperframes` if not needed.
- **Hazards found and mitigated**
  - `media-use` skill and CLI (`tts`, `auth`, `cloud`, catalog `bgm/sfx`) use HeyGen accounts/free-usage allowance → blocked in `hf.mjs`, forbidden in `CLAUDE.md`.
  - Registry blocks can ship audio (found `*-sfx*.wav` in 4 blocks, e.g. `vpn-youtube-spot`, `apple-money-count`) and "glitch/CRT/chromatic aberration" looks → `hyperframes add` blocked; `audio-qc` errors on any audio file or `<audio>` inside `v7/`.
  - The marketplace checkout contains 84 Git-LFS pointer files (assets); not needed.
- **Compatibility with FMC:** not a drop-in. HyperFrames = HTML/GSAP renderer; FMC = React/Three renderer with Arabic text, 3D rig and viseme timing already working. The skills themselves offer `/remotion-to-hyperframes` (one-way port) — **not used; no migration proposed**. Integration = isolated adapter for overlay studies and inspection only.
- **Arabic:** the overlay study uses the project's own IBM Plex Sans Arabic files with `dir="rtl"`; `hyperframes check` passed lint, runtime, layout (0 issues / 9 samples), motion; contrast reported `0/0 text checks` because the overlay has a transparent background, so contrast is **not** verified by it.

## Other dependencies touched
| Item | Licence | Note |
|---|---|---|
| GSAP 3.14.2 (adapter only, `npm install` into the ignored `node_modules`) | "Standard 'no charge' licence" (npm metadata; full text not retrievable here) | **Please review the terms** (commercial use of GSAP is generally allowed under it, with restrictions on building competing animation tools — unverified here). The file is not committed to git |
| Remotion 4.0.505 (existing) | Remotion licence — **company licence may be required for commercial use** by companies above its free threshold | Pre-existing; not changed; flagged for your review |
| FFmpeg 6.1.1 (existing) | LGPL/GPL depending on build | audio/QC only |
| IBM Plex Sans Arabic / Cairo / Tajawal (existing, `@fontsource`) | SIL OFL 1.1 | two Plex files copied into the adapter's `assets/fonts` |
| three 0.170, React 19, zod, tsx (existing) | MIT | unchanged |

## Checkpoint / protection (Phase 13)
Checkpoint commit `fe7c918` (local tag `fmc-pre-v7-checkpoint`; the tag push was refused by the proxy, the commit is on the pushed branch), `docs/v7/dependency-snapshot-before-v7.txt` (exact versions + lockfile hash), no earlier output deleted or overwritten (`anim_qc` now writes to `docs/v7/`), no Agentoon files touched.

## Needs your decision
1. Confirm Remotion licensing status for commercial use.
2. Review GSAP's Standard licence text.
3. Keep the HyperFrames plugin enabled (4.1 k tokens/session) or disable it between video projects.
4. Whether to allow any HeyGen-catalog asset in future (default: no).
