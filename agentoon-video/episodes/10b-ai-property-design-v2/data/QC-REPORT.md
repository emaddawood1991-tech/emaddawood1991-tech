# QC report · Ep 10b AI Property Design (85 s) · status: PREVIEW (gate fails by design)

File: `final/ai-property-design-v2-PREVIEW.mp4` (2,046 PNG frames at 24 fps rendered by HyperFrames, then ffmpeg).

## Technical (validate-render.sh)
- PASS 1080x1920, h264, yuv420p, 24 fps, 85.2 s, AAC audio
- PASS -15.6 LUFS, true peak -1.3 dBTP, no silence gap >= 1 s
- INFO narration 152 wpm over the full length (speaking pace 163 wpm)

## Brief checklist
- PASS car animation is real Blender keyframes (road, turn, wheels spinning, parks)
- PASS entrance gate opens (two hinged leaves)
- PASS people walk the garden paths (limb swing); pool water ripples
- PASS front door opens; hollow furnished interior walkthrough (consistent with the exterior model)
- PASS build-up animation (walls rise, roof drops, garden grows), aerial orbit, land photo / plan / concept side by side with "CONCEPT VISUALIZATION · NOT CONSTRUCTION DRAWINGS"
- PASS robot mouth follows the narration loudness (envelope lip-sync), blinks, head bob, gestures
- PASS no moving light sweeps, no placeholder labels, no invented dimensions
- PASS editable Blender project (`10-ai-property-design/blender/property_anim.blend`) + scripts
- FAIL real Google Maps recording (not reachable; the Maps scene is a labelled Blender top view "NOT GOOGLE MAPS")
- FAIL real Claude Code / claude.ai interface recording (not reachable; the scene shows the brief text verbatim)
- FAIL real Blender interface recording (headless bpy has no UI)
- NOT USED Gemini/Flow (no approved credits, unreachable), Pexels, Remotion (HyperFrames edit), Vercel (no deployment made)

## Known cosmetic points
- Robot lip-sync is loudness-driven (open / wide / closed), not phoneme-accurate visemes; it is an SVG character, not a Blender rig.
- Interior is stylised low-poly with warm light (graded down in the edit).
- Cars/people are simple low-poly models.

Result: PREVIEW. See DELIVERABLES.md for the MUST RECORD list.
