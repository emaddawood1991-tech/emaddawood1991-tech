# QC report · Ep 11 Dubai Azure Tower story · status: PREVIEW (final gate fails by design)

File: `final/dubai-azure-tower-story-PREVIEW.mp4` (76.9 s, 1080x1920, 30 fps, H.264 + AAC), rendered by HyperFrames from 2,307 frames.

## Technical (validate-render.sh)
- PASS 1080x1920, h264, yuv420p, 30 fps, 76.9 s (target 75-90 s)
- PASS -15.2 LUFS, true peak -1.3 dBTP, no silence gap >= 1 s
- INFO narration 159 wpm while speaking (147 wpm over the whole length, which includes the intro pad and the closing card)
- HyperFrames check: 0 errors; remaining warnings are decorative door labels, caption blink hold times and the ruler odometer (texture)

## Story and honesty checklist
- PASS finished tower on screen in the first frame; "50 FLOORS. DUBAI. AI." title; "~30 MIN OF PROMPTING · MY COUNT" attributed to the owner
- PASS hero footage is the owner's real animatic; same building in every shot; nothing generated or re-modelled
- PASS 50 floors presented as the brief; 96 deg twist, 72 fins, floors 12/31/48 read from `tower_params.json`
- PASS build step is real: `python architecture/build_all.py out.blend` run in this session, output `built in 0.9s, objects=1843` (bpy 5.2.3 LTS)
- PASS timing not exaggerated: narration and on-screen text say prompting ~30 min (owner's count) and rendering "a few hours"
- PASS concept disclaimer on screen ("CONCEPT VISUALIZATION · NOT AN APPROVED ARCHITECTURAL DESIGN"); source footage carries its own "FICTIONAL ARCHITECTURAL CONCEPT · NOT APPROVED · NOT BUILT" and "ANIMATIC · LOW-RES PREVIEW" labels
- PASS 16:9 footage reframed per shot (full frame with blurred extension for context shots, full-height building crop for hero shots)
- PASS mobile: chips >= 28 px, code at 32-38 px, captions in the caption band, robot clear of captions
- PASS no placeholders, no fake terminal output, no light sweeps; original robot and signature ending ("Follow @agentoon.ai" + "Real AI Tools • Skills • Automation")

## Deviations from the brief (and why)
- **Vercel agent and Google Maps scenes are not in the video.** The project's own report says Vercel, Three.js, Pexels and AI video models were not used, and the site is a fictional Jumeirah-inspired coast with no real plot. Showing them would misstate the workflow. Scene 2 states "NOT GOOGLE MAPS · A BLENDER SCENE".
- **Remotion was not used.** It is not installed here (no `node_modules`). HyperFrames (installed and verified) was the editor.
- The original `1000287161.mp4` was not found; the uploaded `Dubai_Azure_Tower_Animatic_720p` was used on the owner's confirmation.
- Repo commit times (12:03 to 15:06 UTC) neither confirm nor refute the ~30 min; they are not shown in the video.

## FAIL (why this is PREVIEW)
- Real Claude Code conversation recording: not available
- Official logos / genuine website and Blender interface footage: sites unreachable from the sandbox (only code.claude.com/docs answered)
- Footage resolution: 720p animatic upscaled in hero crops (native 4K render pending on the owner's PC)

## Known cosmetic points
- Source animatic has soft detail and primitive furniture (stated in the project report).
- The night finale's blurred backdrop shows the tower glow as a soft vertical glow.
