# Spinal deformities episode — STATUS: footage-blocked (no video rendered)
Nothing was rendered, because the required live-action footage does not exist in the licensed library and your rules forbid substituting unrelated footage or fabricating a procedure.

## Footage audit result (Pexels API, key from `.env`, 42 queries × portrait+landscape, ~300 clips, thumbnails visually reviewed)
| Required scene content | Found? |
|---|---|
| Patient from behind, doctor assessing shoulder level (S1) | NO — only unrelated back-view/yoga/massage clips; no clinical posture exam |
| Scoliosis exam / Adams forward-bend test with a clinician (S2) | NO — only 6799872 (man bending forward in a gym/yoga context, no clinician, no exam) |
| Side view of rounded upper back + clinician assessing (S3) | NO |
| Spinal mobility / back exam by a doctor (S4) | NO — doctor clips are chest/ear/eye/stethoscope/pediatric, not spine |
| Clinician reviewing a SPINAL X-ray | NO — X-rays found are hand, wrist, cervical (5030439), dental; none show scoliosis/kyphosis |
| Doctor–patient calm interaction (S5) | Partly — e.g. 7579595 (doctor smiling with patient), 7579341 — usable only as generic consultation, never as FMC staff |
Conclusion: scenes 2, 3 and 4 cannot be shown accurately from licensed stock. Using the available clips would show unrelated content (yoga, massage, dental, hand X-rays) or imply a diagnosis on identifiable strangers — rejected.

## Other blockers
- AAOS OrthoInfo and Scoliosis Research Society could not be reached from this environment (blocked); medical review below is from standard clinical knowledge and marked UNVERIFIED against them.
- Pexels licence: free commercial use, but identifiable people must not be shown in a sensitive/defamatory context. Presenting stranger footage as a person with scoliosis in a medical ad needs care; model-release status is not provided by Pexels.
- Photoreal AI footage = paid credits (Higgsfield / ElevenLabs connectors) → needs your explicit approval, plus medical review of every frame (AI routinely gets spine anatomy and the Adams posture wrong).

## Options (pick one)
1. **Original FMC footage (recommended)** — film the 9 shots in `02_Shot_List_for_FMC_Filming.md` (~1 hour, a consenting adult/teen volunteer or a model, with a clinician). I then edit, grade, add Arabic type, voice and music.
2. **Licensed real medical stills + footage** — you approve additional hosts (e.g. Wikimedia Commons / NIH Open-i public-domain scoliosis X-rays and Adams-test photos); I use only PD/CC0/CC-BY items, with attribution tracked.
3. **Photoreal AI generation** — you approve paid credits; I generate and review shot by shot, labelled synthetic internally, never as FMC staff/patients.
4. **Shorter honest cut** — S1 + S5 from stock/own footage plus on-screen text only (not the full storyboard).

## Ready now (no footage needed)
Narration script and review, Arabic QC notes, medical accuracy notes, shot list, audio plan (`01`–`05` files here). Once footage exists, the render path is the existing studio (narration-driven timeline, FMC audio policy, original logo).
