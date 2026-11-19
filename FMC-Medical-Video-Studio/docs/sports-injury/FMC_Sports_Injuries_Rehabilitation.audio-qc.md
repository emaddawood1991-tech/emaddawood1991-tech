# FMC audio QC

- Policy: {"transitionSfxEnabled":false,"characterSfxEnabled":false,"interfaceSfxEnabled":false,"cameraMovementSfxEnabled":false,"anatomyAnimationSfxEnabled":false,"automaticWhooshesEnabled":false,"backgroundMusicEnabled":true,"narrationEnabled":true,"backgroundMusicStyle":"ultra-soft-medical-ambient","footageAudioEnabled":false}
- Result: **PASS (automated checks only)** — 0 error(s), 4 warning(s)

## Audio sources found in code
- src/components/FMCCinematicTransition.tsx:27 video element (muted via policy)
- src/compositions/CharacterPreview.tsx: 1 <NarrationAudio> (narration)
- src/compositions/KneeAlignmentEpisode.tsx: 1 <NarrationAudio> (narration)
- src/compositions/SciaticaEpisode.tsx: 3 <NarrationAudio> (narration)
- src/compositions/SciaticaOverlayStudy.tsx:9 video element (muted via policy)
- src/compositions/SpineEarlyDetection.tsx: 1 <NarrationAudio> (narration)
- src/compositions/SportsInjuryReel.tsx: 1 <NarrationAudio> (narration)
- src/lib/audioPolicy.tsx: 1 <NarrationAudio> (narration)
- src/scenes/TreatmentScene/index.tsx:40 video element (muted via policy)
- src/scenes/sports/SportsParts.tsx:22 video element (muted via policy)
- src/templates/CarpalTunnelEpisode.tsx: 1 <NarrationAudio> (narration)
- src/templates/DoctorExplainer.tsx: 1 <NarrationAudio> (narration)
- src/templates/MedicalExplainer.tsx: 1 <NarrationAudio> (narration)
- src/templates/SpineRealisticEpisode.tsx:38 video element (muted via policy)
- src/templates/SpineRealisticEpisode.tsx: 1 <NarrationAudio> (narration)

## Findings
- **INFO** [source] registered compositions: Reel → MedicalExplainer; TV → MedicalExplainer; DoctorReel → DoctorExplainer; CharacterPreview → CharacterPreview; CollageStudy → CollageStudy; WristStudy → WristStudy; CarpalReel → CarpalTunnelEpisode; SpineStudy → SpineStudy; SpineReel → SpineRealisticEpisode; SpineV2 → SpineEarlyDetection; LimbStudy → LimbStudy; KneeReel → KneeAlignmentEpisode; SciaticaOverlayStudy → SciaticaOverlayStudy; SciaticaPart1 → SciaticaPart1; SciaticaRelief → SciaticaRelief; SciaticaFull → SciaticaFull; SportsInjuryReel → SportsInjuryReel; PoseLab → PoseLab; LogoStudy → LogoStudy; DoctorPreview → DoctorPreview; AnatomyPreview → AnatomyPreview
- **INFO** [assets] audio assets: narration/other=78, music=4, sfx-optional=0, retired=2
- **WARN** [footage] assets/footage/sports-injury-rehab/raw/7187116.mp4 has an embedded audio stream (rendered muted by policy; not used)
- **WARN** [footage] assets/footage/sports-injury-rehab/raw/7299332.mp4 has an embedded audio stream (rendered muted by policy; not used)
- **WARN** [footage] assets/footage/sports-injury-rehab/raw/7299360.mp4 has an embedded audio stream (rendered muted by policy; not used)
- **WARN** [footage] assets/footage/sports-injury-rehab/raw/7299361.mp4 has an embedded audio stream (rendered muted by policy; not used)
- **INFO** [stems] sound_effects stem is digital silence
- **INFO** [file] -16 LUFS, -3 dBTP, 0 clipped samples, 55 bright onsets of which 55 are inside narration (normal speech consonants, ignored) and 0 outside
- **INFO** [music] assets/audio/music/fmc-ambient-pads-v6.wav: -14.3 LUFS, crest 13.1 dB, 2.1 sudden onsets/min

## Rendered file
- output/SportsInjury/FMC_Sports_Injuries_Rehabilitation.mp4
- Seams (s): 8.13, 19.17, 27.50, 36.53, 44.87, 54.23
- Non-speech transient candidates: none
- 8.1 s: peak -13.8 dBFS (10 ms RMS) in the ±1 s around the seam
- 19.2 s: peak -12.6 dBFS (10 ms RMS) in the ±1 s around the seam
- 27.5 s: peak -12.4 dBFS (10 ms RMS) in the ±1 s around the seam
- 36.5 s: peak -12.1 dBFS (10 ms RMS) in the ±1 s around the seam
- 44.9 s: peak -12.8 dBFS (10 ms RMS) in the ±1 s around the seam
- 54.2 s: peak -13.8 dBFS (10 ms RMS) in the ±1 s around the seam

_Limits: automated analysis flags suspicious sounds; it does not identify their source and cannot judge listening comfort, pronunciation or taste._
