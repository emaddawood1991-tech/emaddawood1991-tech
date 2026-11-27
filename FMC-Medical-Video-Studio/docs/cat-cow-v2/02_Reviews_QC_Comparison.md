# Cat-Cow V2 — medical review, QC, V1 vs V2, skills
Output: `output/CatCow/FMC_Cat_Cow_30_Days_Premium_3D_V2.mp4` (1080×1920, 30 fps, 89.1 s, h264+AAC, −16.0 LUFS). V1 untouched.

## Medical accuracy review (author review only — clinician sign-off REQUIRED)
- Terminology: «تمرين تقويس الظهر ومدّه» (also «القطة والبقرة», said once). Phases «تقويس الظهر للأعلى» / «مدّ الظهر بلطف».
- No claim that discs regenerate or pain disappears (explicit denial in W4 line). Results "differ by case". Stop-and-assess line included.
- Statistic: 32.9 % of participants in a Dubai study (PRO Dubai, Oman Med J 2016, 3,985 Emiratis, data 2009). Shown as study participants, not a national rate. Source page could not be re-read here (mdpi 403) — verify citation.
- Anatomy: procedural teaching model (L1–L5, sacrum, discs with annulus/nucleus/endplates, nerve roots). Simplified; vertebrae are schematic. Load is shown qualitatively, no percentages.
- Added sentence not in the user's original script: Dubai-study line (approved with the script).

## Character QC
Stylised male presenter, clean-shaven, navy scrubs, coat logo. Rig: IK-planted hands, skinned torso, breathing. Frames checked: cat/cow poses read correctly, hands planted. Limits: stylised (not photoreal), no facial animation/lip-sync in this video, no closing glance, hair/hands simplified. Needs human review of appeal.

## Audio QC
Narration (Gemini TTS, Charon, ×1.08 tempo after silence trim) + one ambient bed (−34 LUFS), no SFX, no source audio. mix-audio: PASS automated, 0 errors, no non-speech transients. `audio:qc` lists many "transient candidates" (likely speech consonants; source unidentified) — **not listened to**. Pronunciation lexicon is machine-drafted; human listening approval pending.

## Standards QC
No red bottom bar. Warnings: bright content touching side edges (studio background), text-like content in Instagram bottom zone (phase chips y≈1290; chapter dots) — review. Final-export gate CLOSED until human grammar, medical, pronunciation reviews.

## V1 → V2
| | V1 | V2 |
|---|---|---|
| Name | القطة والبقرة repeated | تقويس الظهر ومدّه (old name once) |
| Anatomy | 2D cross-section SVG | 3D lumbar stack, translucent body, disc orbit, flex/ext stack |
| Studio | flat navy | off-white studio, navy/turquoise accents, DOF |
| Cameras | 3 | hero, side, close, top, anatomy orbit/stack |
| Stat card | big card | compact card, caveats |
| Closing | dark seal | light, plain original logo, name + slogan |
Known V2 weaknesses: flexion/extension stack looks crude (blocky processes); highlight circle approximate; W3 top-down view is busy.

## Skills used
fmc-video-producer, Remotion, Blender (bpy), FFmpeg, Gemini TTS (existing key), project audio policy/QC scripts. HyperFrames/Lemo/GSAP: not used for V2 render.
