# QC report · Ep 10 AI Property Design (71 s version) · status: PREVIEW (gate fails by design)

Checked on `out/ai-property-design-PREVIEW.mp4` (rendered as 1,704 PNG frames at 24 fps, then ffmpeg).

## Technical (validate-render.sh)
- PASS 1080x1920, h264, yuv420p, 24 fps, 71.0 s, AAC audio
- PASS loudness -15.4 LUFS, true peak -1.4 dBTP, no silence gap >= 1 s
- INFO narration pace 150 wpm over the full 71 s (speaking-only pace higher)

## Visual (contact sheets reviewed)
- PASS hook: finished property flashes in the first second, then empty land, then the slider reveal
- PASS real Blender 5.2.3 renders in every 3D shot (stages, 120-frame orbit, 96-frame walkthrough)
- PASS no placeholder labels, no moving light sweeps
- FIXED walkthrough scene was blank (video timing bug); re-rendered and re-checked
- FIXED "ONE CLEAR BRIEF" overlapped the input cards
- PASS captions stay clear of the 3D subject; robot present in every scene
- KNOWN the terminal card in scene 4 ends on a partly typed line while the next command types in (cosmetic)

## Real-footage requirements
- FAIL real claude.ai / Claude app recording (sandbox cannot reach it)
- FAIL real Blender interface recording (headless bpy build has no interface)
- FAIL real Google Maps recording (not in the 71 s version; unreachable)
- FAIL official logos (Claude, Blender): brand sites unreachable
- NOT USED Gemini/Flow (no approved credits), Pexels, Vercel, Remotion
- PASS terminal text is verbatim real output; sample land/location/plan cards are labelled as samples

## Not in this version (requested for the 85 s version)
car/gate/people/interior walkthrough footage and lip-synced robot: Blender animation and lip-sync action exist and are tested, not yet rendered or composited.

Result: PREVIEW. Missing recordings are listed in DELIVERABLES.md.
