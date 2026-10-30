# QC report · Ep 13 CleanYourTV · status: PREVIEW (NOT FINAL)

File: `final/cleanyourtv-smart-tv-PREVIEW.mp4`: 74.7 s, 1080x1920, 30 fps, H.264 + AAC (HyperFrames render, audio normalised with ffmpeg loudnorm after render).

## Technical (validate-render.sh)
- PASS resolution, codec, pixel format, 30 fps, 74.7 s (brief: 65-75 s)
- PASS -15.0 LUFS, true peak -1.3 dBTP, no silence gap >= 1 s
- INFO narration 165 wpm while speaking (153 over the full length); HyperFrames check: 0 errors

## Brief checklist
- PASS storyboard order: hook (ads, then clean result) -> project -> connection -> backup/package review -> launcher transformation -> restore/compatibility -> CTA; the seven storyboard voice lines are used verbatim, plus five short support lines that state only README/SECURITY.md facts (MIT licence, official site, same Wi-Fi + allow prompt, nothing uninstalled/you decide, dock/app library/themes, supported platforms, turn debugging off)
- PASS every on-screen fact traces to `data/` or the repo snapshot (commit 3109... / 31092430..., see `data/OFFICIAL-SOURCES.md`): no stars, counts, press numbers or TV compatibility lists invented
- PASS no fake terminal results: commands are README text labelled "NOT RUN"; the package list is the real `examples/xiaomi-mi-tv-4a/debloat.txt` labelled "REAL FILE FROM THE REPO · NOT RUN"
- PASS the before/after is the project's own photographs, labelled "PROJECT PHOTOS · NOT MY TV"; no AI or stock footage
- PASS original robot with lip-sync; points at the repo name and the comparison; reacts (worried, wow, nod)
- PASS safety: "only a TV you own or may test", "you decide what stays", "turn debugging off", restore line shown; no rooting/bypass shown
- PASS mobile: chips >= 28 px, code 30-38 px, captions in the caption band, robot kept beside content, outro clean
- PASS no light sweeps or persistent glowing dots; signature ending present

## FAIL / not done (why PREVIEW)
- FAIL no authorised compatible TV, so **no live demonstration** (ADB session, package change, launcher install, restore) exists; it must be recorded on a real TV (see MUST RECORD in `data/OFFICIAL-SOURCES.md`)
- FAIL no github.com / cleanyour.tv browser captures (unreachable here); README text and project images are shown instead
- NOT RECEIVED reference video `1000287323.mp4`; storyboard followed
- NOT USED Remotion (not installed), Blender, Pexels, Gemini/Flow; editing was done in HyperFrames
- WEAK motion energy: motion-profile shows long stretches with only small motion (typing, ring hops, slow drift); longest gap between bursts ~41 s vs the ~2.5 s reference. Candidate polish: camera pushes on each card, a burst at each ring hop, TV channel-flip transitions inside long scenes.
