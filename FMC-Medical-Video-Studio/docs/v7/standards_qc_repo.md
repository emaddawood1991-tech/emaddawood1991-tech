# FMC standards QC (lower-back-pain, no video)

Result: **FAIL** — 1 error(s), 6 warning(s)

- **INFO** [character] static checks only: no facial-hair identifiers; official logo file on coat. Appearance (age, friendliness, proportions) needs a human look at real frames.
- **WARN** [animation] "explain" repeats within 5 s (frames 1030–1290)
- **WARN** [animation] "explain" repeats within 5 s (frames 1684–1984)
- **WARN** [animation] "explain" repeats within 5 s (frames 2075–2267)
- **INFO** [animation] 18 gesture clips (wave, pointToLowerBack, pointAtAnatomy, pointToKnee, explain, presentMedicalModel, rehabReset, progressSteps, attention, jump); acting curve dips to -0.050 (anticipation) and peaks at 1.045 (overshoot)
- **INFO** [framing] fullBodyIntro (WIDE): doctor ≈ 48 %, frame shows 3.67 m — ok
- **INFO** [framing] mediumSpeaking (CLOSE): doctor ≈ 83 %, frame shows 2.14 m — ok
- **INFO** [framing] explainAnatomy (BESIDE): doctor ≈ 43 %, frame shows 4.10 m — ok
- **INFO** [framing] demonstratePain (CLOSE): doctor ≈ 83 %, frame shows 2.14 m — ok
- **INFO** [framing] pointToTreatment (BESIDE): doctor ≈ 43 %, frame shows 4.10 m — ok
- **INFO** [framing] closeUpSpeaking (CLOSE): doctor ≈ 83 %, frame shows 2.14 m — ok
- **INFO** [framing] anatomyFocus (ANAT): doctor ≈ 108 %, frame shows 1.65 m — ok
- **INFO** [framing] closing (END): doctor ≈ 97 %, frame shows 1.84 m — ok
- **INFO** [framing] Presets are validated geometrically. Hands/limbs leaving the frame during a gesture, and cards covering the torso, must still be checked on real frames (see --video).
- **WARN** [typography] opening: title has 8 words (max 6)
- **WARN** [typography] symptoms: 4 cards (max 3)
- **ERROR** [typography] fmc card 3: 13 words (hard max 9) — shorten (needs your approval: on-screen text is part of the locked script)
- **WARN** [variety] scenes without a declared sceneType (A–F): opening, anatomy, symptoms, treatment, fmc, closing — variety cannot be checked automatically
- **INFO** [variety] scene types: A=Human introduction; B=Pain demonstration; C=Anatomical explanation; D=Interactive explanation; E=Real-world treatment; F=Professional closing; limits: ≤2 in a row, ≥3 distinct
- **INFO** [logo] official logo file hash matches the supplied original

_Limits: heuristics flag candidates for human review. They cannot judge Arabic correctness, pronunciation, medical accuracy, character appeal or audio comfort._
