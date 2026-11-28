# QC report — FMC_Neck_Pain_Headache_Physiotherapy.mp4
File: `output/NeckPain/FMC_Neck_Pain_Headache_Physiotherapy.mp4` · 1080×1920 · 30 fps · h264 yuv420p (tv) + AAC · 59.63 s · −16.1 LUFS, true peak −3.0 dBTP, 0 clipped samples, LRA 6.5 LU. (`mix_raw.mp4` = same mix before the yuvj420p→yuv420p re-encode.)

## Audio (what was run)
- Content: Arabic narration (Gemini TTS, voice Charon, no speed change — only leading/trailing silence trimmed) + one ambient pad bed (−34 LUFS, `fmc-ambient-pads-v6`). SFX stem = digital silence; footage audio muted (6111095 contains an audio track; rendered muted).
- `mix-audio`: PASS (automated), 0 errors, non-speech transients: none. `audio:qc`: 0 clipped, bed 2.1 onsets/min. It also lists 49 "bright onsets outside narration"; their source is unidentified (likely TTS breaths/consonant tails or bed texture) — **nobody has listened to the file yet**. Required: human listening for pronunciation, TTS artefacts, comfort.
- Narration timing: hook 3.9 s, anatomy 8.1, assessment 8.0, chin-tuck 8.5, scapula 2.0, mobility 3.1, treatment 7.5, closing 3.9 (total speech 45.1 s) — each movement phrase starts with its movement scene.

## Standards QC (`standards:qc`)
- No red bottom bar; logo hash = original. The tool's ERROR/WARNs on "opening 8 words / symptoms 4 cards / fmc card 13 words" come from the default lower-back template content it loads, not from this video's scenes (this video's titles are ≤ 6 words). Remaining WARNs (bright edge content, text-like content in the bottom zone) are the chapter timeline and inset cards — acceptable but verify on a phone.

## What was inspected visually
Contact sheets of the final video every 2.4 s plus full-size stills of scenes 1, 2, 4, 5, 6 (anatomy alignment, pain locus, arrows, insets, closing). Not done: frame-by-frame review of all 1789 frames; timing sync between each spoken phrase and its movement was checked by design (scene starts), not by ear.

## Medical safety warning (for caption/report)
Sudden severe headache, new neurological symptoms, or headache with fever and marked neck stiffness → urgent medical assessment, not routine exercise advice.

## Open human gates
grammar review · medical terminology review · medical accuracy review (anatomy + the three movements + clip suitability) · pronunciation approval after listening. Final-export gate is **closed** until these are recorded.
