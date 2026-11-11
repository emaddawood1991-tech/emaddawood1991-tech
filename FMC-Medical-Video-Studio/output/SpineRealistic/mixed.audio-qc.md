# FMC audio QC

- Policy: {"transitionSfxEnabled":false,"characterSfxEnabled":false,"interfaceSfxEnabled":false,"cameraMovementSfxEnabled":false,"anatomyAnimationSfxEnabled":false,"automaticWhooshesEnabled":false,"backgroundMusicEnabled":true,"narrationEnabled":true,"backgroundMusicStyle":"ultra-soft-medical-ambient","footageAudioEnabled":false}
- Result: **PASS (automated checks only)** — 0 error(s), 0 warning(s)

## Audio sources found in code
- src/compositions/CharacterPreview.tsx: 1 <NarrationAudio> (narration)
- src/lib/audioPolicy.tsx: 1 <NarrationAudio> (narration)
- src/scenes/TreatmentScene/index.tsx:40 video element (muted via policy)
- src/templates/CarpalTunnelEpisode.tsx: 1 <NarrationAudio> (narration)
- src/templates/DoctorExplainer.tsx: 1 <NarrationAudio> (narration)
- src/templates/MedicalExplainer.tsx: 1 <NarrationAudio> (narration)
- src/templates/SpineRealisticEpisode.tsx:38 video element (muted via policy)
- src/templates/SpineRealisticEpisode.tsx: 1 <NarrationAudio> (narration)

## Findings
- **INFO** [source] registered compositions: Reel → MedicalExplainer; TV → MedicalExplainer; DoctorReel → DoctorExplainer; CharacterPreview → CharacterPreview; CollageStudy → CollageStudy; WristStudy → WristStudy; CarpalReel → CarpalTunnelEpisode; SpineStudy → SpineStudy; SpineReel → SpineRealisticEpisode; PoseLab → PoseLab; LogoStudy → LogoStudy; DoctorPreview → DoctorPreview; AnatomyPreview → AnatomyPreview
- **INFO** [assets] audio assets: narration/other=28, music=3, sfx-optional=2, retired=2
- **INFO** [stems] sound_effects stem is digital silence
- **INFO** [file] -16 LUFS, -2.8 dBTP, 0 clipped samples, 39 bright onsets of which 39 are inside narration (normal speech consonants, ignored) and 0 outside
- **INFO** [music] assets/audio/music/fmc-ambient-pads-v6.wav: -14.3 LUFS, crest 13.1 dB, 2.1 sudden onsets/min

## Rendered file
- output/SpineRealistic/mixed.mp4
- Seams (s): 5.67, 14.70, 22.37, 28.97, 38.03
- Non-speech transient candidates: none
- 5.7 s: peak -14.1 dBFS (10 ms RMS) in the ±1 s around the seam
- 14.7 s: peak -12.0 dBFS (10 ms RMS) in the ±1 s around the seam
- 22.4 s: peak -13.2 dBFS (10 ms RMS) in the ±1 s around the seam
- 29.0 s: peak -14.0 dBFS (10 ms RMS) in the ±1 s around the seam
- 38.0 s: peak -12.9 dBFS (10 ms RMS) in the ±1 s around the seam

_Limits: automated analysis flags suspicious sounds; it does not identify their source and cannot judge listening comfort, pronunciation or taste._
