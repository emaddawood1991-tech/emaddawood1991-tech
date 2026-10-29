# Dubai Azure Tower - Production Report
Status of the work: **editable project + verified low-res animatic delivered. Native 4K film NOT rendered** (see "Limitations").
Fictional concept. Not approved, not built, not for sale. Conceptual Jumeirah-inspired coast; no real plot boundary.

## What exists (verified)
| Deliverable | File | Verified |
|---|---|---|
| Animatic film, 120 s | `exports/Dubai_Azure_Tower_Animatic_720p.mp4` | ffprobe: 3,600 frames, 30 fps, 120.000 s, H.264 1280x720 + AAC 48 kHz stereo; blackdetect: only 1-2 frame fades at the 8 scene boundaries |
| Native 4K poster frame | `renders/Dubai_Azure_Tower_Poster_4K.png` | 3840x2160, Cycles 64 spp, 460 s on 4 CPU cores |
| Interior 1080p still | `renders/Dubai_Azure_Tower_Interior_1080p.png` | 1920x1080, Cycles 64 spp, 375 s |
| Editable Blender project | `animations/Dubai_Azure_Tower.blend` (+ procedural sources) | rebuilt from scripts in <1 s, no external textures (nothing can be missing) |
| Timeline / cameras | `cameras/build_timeline.py` | 9 marker-bound cameras, S01..S09 frame ranges exact |
| Remotion project | `remotion/` | source only, not rendered here |
| Score | `audio/azure_score.wav` | original, generated (numpy), 120.000 s, loudnorm -16 LUFS; no third-party music |

## NOT delivered
- `Dubai_Azure_Tower_4K.mp4` does not exist. Do not treat the animatic as the final film.
- Reason: Cycles on this sandbox (4 CPU cores, no GPU, no Blender GUI/MCP access) costs 460 s per 4K exterior frame at 64 spp. 3,600 frames = about 19 days. Interiors cost more.
- Proposed path (tested scripts): render on your Windows GPU PC, see `renders/RENDER_ON_PC.md` (3840x2160, or 1080p + lanczos upscale in `exports/assemble.py`).

## Engines used
- Blender 5.2 LTS via `bpy` (headless, Cycles CPU + OpenImageDenoise): all modelling, materials, lights, cameras, sky, rendering. Blender MCP on your PC was not reachable from this cloud session, so it was not used.
- FFmpeg: interpolation (10 -> 30 fps, motion-compensated), fades, title/disclaimer drawtext, loudness, mux, QC (ffprobe, blackdetect, silencedetect).
- Remotion: project scaffolded for the final edit (not rendered here).
- Three.js, Vercel AI Gateway, Pexels, any AI video model: **not used.** No paid calls were made. Vercel was not involved in rendering.
- Existing tools were not reinstalled; no website or Vercel project was created; Dawoud Labs untouched.

## Design (from `architecture/tower_params.json`)
50 floors (double-height lobby 9 m + 49 x 4 m), 205 m shaft + 32 m crown + 28 m spire. Tri-lobed plan, tapered 36 %, 96 degrees twist. Blue high-performance glass skin, 72 champagne-bronze fins following the twist, curved balcony bands (floors 22 and 46), illuminated crown. Multi-level landscaped podium, porte-cochere, palms/shrubs/pergolas/seating (instanced), pools with lighting, coastal highway, Gulf, stylised Burj Al Arab landmark and skyline blocks.
Interiors (same floor heights, materials, orientation): lobby (floor 1), office (floor 12), apartment (floor 31), duplex penthouse with feature stair and terrace (floor 48).

## Render settings and performance
- Animatic: Cycles CPU, 512x288, 8 samples + OIDN denoise, every 3rd frame (1,200 renders), ~5 s (exterior) to ~10 s (interior) per frame per process; two processes in parallel. Scenes S04-S08 were re-rendered once after QC fixes (~710 frames).
- Native-4K probe: 3840x2160, 64 spp = 460 s. 1080p interior 64 spp = 375 s.
- View transform Standard (AgX washed out the palette); interior exposure -0.9 EV keyed at the lobby cut.

## QC results and known weaknesses
Passed: exactly 120.000 s / 3,600 frames; all nine scenes present in the specified time ranges; same tower in every shot; four complete interior sets; no missing textures (procedural); no extended black; audio present with no silent gaps; valid MP4; title readable; concept disclaimer visible throughout.
Found and fixed during QC: camera cutting through the podium terrace in S04 (black frames), camera inside the lobby reception desk, coplanar-face black patches on sofas/desk, overexposed interiors, blown-out sky, horizon band.
Remaining weaknesses (honest):
- Animatic resolution is low and motion-interpolated; fine detail (fins, glass) is only judged on the 4K poster.
- Landscape and skyline are simple block-outs; the Burj Al Arab is stylised, not a faithful model.
- Furniture is geometric/primitive; materials are clean but not photographic. No volumetric haze pass.
- S04 flythrough is modest: a final art pass on the camera path and set dressing is recommended before the 4K render.
- Interiors are lit by area lights only; subtle blotchiness can remain at 8 spp (gone at 64 spp).
