# OFFICIAL WEBSITES & REAL VISUAL ASSETS · Ep 11 Dubai Azure Tower story

## What the story is built from (all real, all from the user's own project)
| Asset | Source | Verified |
|---|---|---|
| Hero footage: 120 s animatic, 1280x720 | uploaded `Dubai_Azure_Tower_Animatic_720p-1.mp4` (sha256 prefix d83a72adb83fb518); identical to `agentoon-projects/dubai-azure-tower/exports/Dubai_Azure_Tower_Animatic_720p.mp4` on branch `claude/ecstatic-goldberg-ovm1a3` | ffprobe: 120.000 s, 30 fps, H.264 + AAC |
| 4K poster + 1080p interior still | same branch, `agentoon-projects/dubai-azure-tower/renders/` | 3840x2160 and 1920x1080 |
| Tower numbers (50 floors, 96 deg twist, 72 fins, showcase floors 12/31/48) | `architecture/tower_params.json` on that branch | read directly |
| Build command + output | `python architecture/build_all.py out.blend` run in this session with `bpy` 5.2.3 LTS: `built in 0.9s, objects=1843` | `data/real-build-output.txt` |
| Production report | `reports/PRODUCTION_REPORT.md` on that branch | read directly |

## What the source project says about how the tower was made
Blender 5.2 LTS through `bpy` (procedural, headless, Cycles CPU), FFmpeg for assembly, Remotion scaffolded but not rendered. **Three.js, Vercel (hosting or AI Gateway), Pexels and any AI video model: not used.** The site is a fictional Jumeirah-inspired coast with no real plot boundary (no Google Maps).
Commit times on that branch (UTC, 2026-10-29): 12:03 first (tower + site + preview renders), 12:19 interiors/timeline/score, 14:45 verified animatic + QC, 15:06 compression. The "about 30 minutes" is the owner's own account of prompting time; the repo timestamps neither confirm nor contradict it and the render time was hours. The video states it as "by my own count".

## Official websites (checked from the cloud sandbox)
| Site | Reachable here | Used in the video |
|---|---|---|
| https://code.claude.com/docs | yes (HTTP 200) | no screenshot used; the name "Claude Code" is plain text |
| https://www.blender.org | no (no response) | not shown; Blender named in text only |
| https://vercel.com, https://threejs.org, https://www.google.com/maps, https://r3f.docs.pmnd.rs, https://www.remotion.dev, https://www.pexels.com, https://gemini.google.com, https://labs.google/fx/tools/flow | no (no response) or not relevant to the verified workflow | not shown |

## Why the brief's Vercel / Google Maps / Three.js scenes are absent
The project's own report rules them out (see above). Showing them would present a workflow that did not happen. The Reel therefore tells the verified workflow: idea, brief, Claude Code writing Python/JSON for Blender, build, exterior, interior.

## MUST RECORD (to make the video FINAL)
1. Official Claude Code and Blender logos and their genuine web/app interfaces (from a computer with access).
2. A real screen recording of the original Claude Code conversation that produced the tower (if it exists), with the brief text visible; replaces the "BRIEF SUMMARY" scene.
3. A real Blender viewport recording of `Dubai_Azure_Tower.blend` (optional, adds proof).
4. A native 4K render on the owner's PC (`renders/RENDER_ON_PC.md`) to replace the 720p animatic (footage is low-res and labelled as such).
