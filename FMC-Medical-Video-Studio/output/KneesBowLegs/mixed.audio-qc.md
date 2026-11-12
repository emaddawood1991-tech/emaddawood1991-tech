# FMC audio QC

- Policy: {"transitionSfxEnabled":false,"characterSfxEnabled":false,"interfaceSfxEnabled":false,"cameraMovementSfxEnabled":false,"anatomyAnimationSfxEnabled":false,"automaticWhooshesEnabled":false,"backgroundMusicEnabled":true,"narrationEnabled":true,"backgroundMusicStyle":"ultra-soft-medical-ambient","footageAudioEnabled":false}
- Result: **PASS (automated checks only)** — 0 error(s), 0 warning(s)

## Audio sources found in code
- src/components/FMCCinematicTransition.tsx:27 video element (muted via policy)
- src/compositions/CharacterPreview.tsx: 1 <NarrationAudio> (narration)
- src/compositions/KneeAlignmentEpisode.tsx: 1 <NarrationAudio> (narration)
- src/compositions/SpineEarlyDetection.tsx: 1 <NarrationAudio> (narration)
- src/lib/audioPolicy.tsx: 1 <NarrationAudio> (narration)
- src/scenes/TreatmentScene/index.tsx:40 video element (muted via policy)
- src/templates/CarpalTunnelEpisode.tsx: 1 <NarrationAudio> (narration)
- src/templates/DoctorExplainer.tsx: 1 <NarrationAudio> (narration)
- src/templates/MedicalExplainer.tsx: 1 <NarrationAudio> (narration)
- src/templates/SpineRealisticEpisode.tsx:38 video element (muted via policy)
- src/templates/SpineRealisticEpisode.tsx: 1 <NarrationAudio> (narration)

## Findings
- **INFO** [source] registered compositions: Reel → MedicalExplainer; TV → MedicalExplainer; DoctorReel → DoctorExplainer; CharacterPreview → CharacterPreview; CollageStudy → CollageStudy; WristStudy → WristStudy; CarpalReel → CarpalTunnelEpisode; SpineStudy → SpineStudy; SpineReel → SpineRealisticEpisode; SpineV2 → SpineEarlyDetection; LimbStudy → LimbStudy; KneeReel → KneeAlignmentEpisode; PoseLab → PoseLab; LogoStudy → LogoStudy; DoctorPreview → DoctorPreview; AnatomyPreview → AnatomyPreview
- **INFO** [assets] audio assets: narration/other=40, music=4, sfx-optional=2, retired=2
- **INFO** [stems] sound_effects stem is digital silence
- **INFO** [file] -16 LUFS, -3 dBTP, 0 clipped samples, 44 bright onsets of which 44 are inside narration (normal speech consonants, ignored) and 0 outside
- **INFO** [music] assets/audio/music/fmc-ambient-pads-v6.wav: -14.3 LUFS, crest 13.1 dB, 2.1 sudden onsets/min

## Rendered file
- output/KneesBowLegs/mixed.mp4
- Seams (s): 6.63, 13.90, 21.33, 28.43, 38.63
- Non-speech transient candidates: none
- 6.6 s: peak -13.4 dBFS (10 ms RMS) in the ±1 s around the seam
- 13.9 s: peak -14.5 dBFS (10 ms RMS) in the ±1 s around the seam
- 21.3 s: peak -14.2 dBFS (10 ms RMS) in the ±1 s around the seam
- 28.4 s: peak -13.8 dBFS (10 ms RMS) in the ±1 s around the seam
- 38.6 s: peak -14.2 dBFS (10 ms RMS) in the ±1 s around the seam

_Limits: automated analysis flags suspicious sounds; it does not identify their source and cannot judge listening comfort, pronunciation or taste._
