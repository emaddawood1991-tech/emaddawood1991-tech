# Phase 1 report: audit, baseline, build system, metrics, quality settings

Checkpoint: Git commit `aaa7836` (tag `pre-upgrade-checkpoint`, local only: tag pushes are refused by this environment's git proxy; the commit is on the branch). Backup copy of the standalone export: `backups/Explorer_pre-upgrade_aaa7836.html`.

## Changes
| Area | What |
|---|---|
| Build | `tools/build.mjs` (esbuild API) rebuilds `Dubai_Azure_Tower_Explorer.html`; `cd tools && npm install && npm run bundle`. Dev tooling only, outside `floor50-viewer/`, so the Vercel deployment and `vercel.json` are untouched. |
| Metrics | `floor50-viewer/quality.js`: overlay (press **P**, or open with `?debug`) with fps, ms, draw calls, triangles, geometries, textures, shader programs, pixel ratio, canvas size, tier, mode, JS heap. `__f50.metrics()` returns the same numbers. |
| Quality | Low / Medium / High / Ultra selector in the header (plus Auto). Tiers change pixel-ratio cap (1 / 1.25 / 1.75 / 2), sun-shadow on/off and resolution (off / 1024 / 2048 / 4096) and per-room point lights (off on Low). Anti-aliasing is chosen at start-up (off on Low) and needs a reload to change. Choice is remembered; `?q=low|medium|high|ultra` forces a tier for testing. |
| Defaults | Phone/tablet → Medium; software GPU → Low; desktop with 6+ cores → High, otherwise Medium. Ultra is selectable only on desktops with 8+ cores, 8+ GB (where reported) and a non-weak GPU, and is never the default. |
| Fallback | In Auto mode, if the average stays under 24 fps for two 120-frame windows (after the first 6 s, not while hidden or right after a switch), the tier drops one step (Medium → Low on phones) with a message. A manually chosen tier is never overridden. |
| UI | Header gets the selector; side panel moved down to make room. |
| QA | `tools/shots.mjs` (42 screenshots), `tools/qa.mjs` (40 functional checks), `tools/perf.mjs` (renderer statistics). |

No visual or feature change to the scenes themselves.

## Test results (software renderer: Chromium + SwiftShader)
* `qa/phase1-qa-results.json`: **40/40 checks pass**, no JavaScript errors: every nav button and every mode's controls, floor picker routing (1, 12, 49, 50), doors and lights in all three plan modes, thunder strike, both fire demos, time-of-day buttons, lift ride 12 → 50, cinematic tour, guest journey, recording start/stop, layout checks for floors 12 and 50 (0 overlaps), all quality tiers, default-tier rules, automatic fallback logic.
* The standalone HTML was loaded from `file://`: no errors, selector and overlay work.
* 42 baseline screenshots of the pre-change code: `qa/phase1-baseline/` (tower day/sunset/night, engineering overlays, lobby, parking, floor 12, floor 49, floor 50 incl. all three apartments, pools by day and night, systems on/off, lift cabin, UI).

## Baseline renderer statistics (High tier = the old settings)
| View | Draw calls | Triangles | Geometries | Textures | Programs |
|---|---|---|---|---|---|
| tower overview | 695 | 166,016 | 313 | 8 | 20 |
| tower street | 627 | 148,882 | 318 | 8 | 20 |
| lobby | 696 | 278,404 | 694 | 17 | 31 |
| parking | 541 | 313,868 | 982 | 23 | 50 |
| floor 12 plan | 1701 | 404,768 | 2460 | 42 | 57 |
| floor 12 medical | 453 | 157,476 | 2460 | 42 | 57 |
| floor 49 | 638 | 195,964 | 3037 | 48 | 64 |
| floor 50 plan | 1062 | 326,876 | 4050 | 61 | 72 |
| floor 50 3BR | 650 | 192,306 | 4050 | 61 | 72 |
| floor 50 pools | 827 | 255,176 | 4050 | 61 | 72 |
| lift cabin | 31 | 694 | 4081 | 63 | 74 |

Notes: the draw-call counter does not include the shadow pass (it did not change when shadows were switched on). Geometry/texture counts keep growing as modes are visited because hidden scenes stay in memory. Floor 12 plan view is the heaviest at 1,701 calls, mostly many small meshes: first target for instancing/merging in Phase 5.

## Not verified
* **Real frame rate.** Everything ran on a CPU software renderer (3 to 8 fps), so the fps figures say nothing about real devices. No performance improvement is claimed. Please open the build on your machine/phone with `?debug` and tell me the numbers.
* Real phone behaviour (touch layout, Medium default, fallback timing), Ultra tier, anti-aliasing differences.
* The git tag is local only.
