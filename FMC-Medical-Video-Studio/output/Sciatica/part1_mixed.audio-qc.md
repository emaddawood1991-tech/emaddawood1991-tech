# FMC audio QC

- Policy: {"transitionSfxEnabled":false,"characterSfxEnabled":false,"interfaceSfxEnabled":false,"cameraMovementSfxEnabled":false,"anatomyAnimationSfxEnabled":false,"automaticWhooshesEnabled":false,"backgroundMusicEnabled":true,"narrationEnabled":true,"backgroundMusicStyle":"ultra-soft-medical-ambient","footageAudioEnabled":false}
- Result: **PASS (automated checks only)** — 0 error(s), 0 warning(s)

## Audio sources found in code
- src/components/FMCCinematicTransition.tsx:27 video element (muted via policy)
- src/compositions/CharacterPreview.tsx: 1 <NarrationAudio> (narration)
- src/compositions/KneeAlignmentEpisode.tsx: 1 <NarrationAudio> (narration)
- src/compositions/SciaticaEpisode.tsx: 1 <NarrationAudio> (narration)
- src/compositions/SciaticaOverlayStudy.tsx:9 video element (muted via policy)
- src/compositions/SpineEarlyDetection.tsx: 1 <NarrationAudio> (narration)
- src/lib/audioPolicy.tsx: 1 <NarrationAudio> (narration)
- src/scenes/TreatmentScene/index.tsx:40 video element (muted via policy)
- src/templates/CarpalTunnelEpisode.tsx: 1 <NarrationAudio> (narration)
- src/templates/DoctorExplainer.tsx: 1 <NarrationAudio> (narration)
- src/templates/MedicalExplainer.tsx: 1 <NarrationAudio> (narration)
- src/templates/SpineRealisticEpisode.tsx:38 video element (muted via policy)
- src/templates/SpineRealisticEpisode.tsx: 1 <NarrationAudio> (narration)

## Findings
- **INFO** [source] registered compositions: Reel → MedicalExplainer; TV → MedicalExplainer; DoctorReel → DoctorExplainer; CharacterPreview → CharacterPreview; CollageStudy → CollageStudy; WristStudy → WristStudy; CarpalReel → CarpalTunnelEpisode; SpineStudy → SpineStudy; SpineReel → SpineRealisticEpisode; SpineV2 → SpineEarlyDetection; LimbStudy → LimbStudy; KneeReel → KneeAlignmentEpisode; SciaticaOverlayStudy → SciaticaOverlayStudy; SciaticaPart1 → SciaticaPart1; PoseLab → PoseLab; LogoStudy → LogoStudy; DoctorPreview → DoctorPreview; AnatomyPreview → AnatomyPreview
- **INFO** [assets] audio assets: narration/other=59, music=4, sfx-optional=2, retired=2
- **INFO** [stems] sound_effects stem is digital silence
- **INFO** [file] -16 LUFS, -3.1 dBTP, 0 clipped samples, 37 bright onsets of which 37 are inside narration (normal speech consonants, ignored) and 0 outside
- **INFO** [music] assets/audio/music/fmc-ambient-pads-v6.wav: -14.3 LUFS, crest 13.1 dB, 2.1 sudden onsets/min

## Rendered file
- output/Sciatica/part1_mixed.mp4
- Seams (s): 12.17, 28.83
- Non-speech transient candidates: none
- 12.2 s: peak -27.5 dBFS (10 ms RMS) in the ±1 s around the seam
- 28.8 s: peak -27.4 dBFS (10 ms RMS) in the ±1 s around the seam

_Limits: automated analysis flags suspicious sounds; it does not identify their source and cannot judge listening comfort, pronunciation or taste._
