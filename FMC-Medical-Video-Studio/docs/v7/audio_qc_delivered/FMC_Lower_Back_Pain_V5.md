# FMC audio QC

- Policy: {"transitionSfxEnabled":false,"characterSfxEnabled":false,"interfaceSfxEnabled":false,"cameraMovementSfxEnabled":false,"anatomyAnimationSfxEnabled":false,"automaticWhooshesEnabled":false,"backgroundMusicEnabled":true,"narrationEnabled":true,"backgroundMusicStyle":"ultra-soft-medical-ambient","footageAudioEnabled":false}
- Result: **FAIL** — 1 error(s), 0 warning(s)

## Audio sources found in code
- src/compositions/CharacterPreview.tsx: 1 <NarrationAudio> (narration)
- src/lib/audioPolicy.tsx: 1 <NarrationAudio> (narration)
- src/scenes/TreatmentScene/index.tsx:40 video element (muted via policy)
- src/templates/DoctorExplainer.tsx: 1 <NarrationAudio> (narration)
- src/templates/MedicalExplainer.tsx: 1 <NarrationAudio> (narration)

## Findings
- **INFO** [source] registered compositions: Reel → MedicalExplainer; TV → MedicalExplainer; DoctorReel → DoctorExplainer; CharacterPreview → CharacterPreview; LogoStudy → LogoStudy; DoctorPreview → DoctorPreview; AnatomyPreview → AnatomyPreview
- **INFO** [assets] audio assets: narration/other=6, music=3, sfx-optional=2, retired=2
- **ERROR** [file] true peak -0.9 dBTP exceeds ceiling -1.5
- **INFO** [file] -16.1 LUFS, -0.9 dBTP, 0 clipped samples, 82 bright onsets of which 82 are inside narration (normal speech consonants, ignored) and 0 outside
- **INFO** [music] assets/audio/music/fmc-ambient-pads-v6.wav: -14.3 LUFS, crest 13.1 dB, 2.1 sudden onsets/min

## Rendered file
- output/V5/FMC_Lower_Back_Pain_V5.mp4
- Seams (s): 4.67, 20.23, 39.17, 55.53, 75.17
- Non-speech transient candidates: none
- 4.7 s: peak -11.6 dBFS (10 ms RMS) in the ±1 s around the seam
- 20.2 s: peak -11.3 dBFS (10 ms RMS) in the ±1 s around the seam
- 39.2 s: peak -9.5 dBFS (10 ms RMS) in the ±1 s around the seam
- 55.5 s: peak -11.3 dBFS (10 ms RMS) in the ±1 s around the seam
- 75.2 s: peak -10.9 dBFS (10 ms RMS) in the ±1 s around the seam

_Limits: automated analysis flags suspicious sounds; it does not identify their source and cannot judge listening comfort, pronunciation or taste._
