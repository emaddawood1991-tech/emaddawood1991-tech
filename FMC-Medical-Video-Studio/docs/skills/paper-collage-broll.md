# Original collage B-roll (project capability, optional)

**Status:** implemented as reusable local components — `src/components/Collage/index.tsx` (`CollageField`, `PaperCutout`, `AssemblePiece`, `cutPath`, `steppedFrame`) and the style study `src/compositions/CollageStudy.tsx` (verified on one still). Inspired only by the idea of paper-collage B-roll; **no code from `pyang5166/gbro-collage-broll`**, whose workflow is paid Gemini video generation (never enable it; no extra API key).
**Technique:** flat colour field + fine paper grain, seeded hand-cut polygons, 2-colour halftone fill, offset shadow, pieces slide in on twos (12 fps stop-motion feel) with a tiny settle. All SVG/CSS in Remotion, deterministic (`random(seed)`), local, silent.
**Use only for:** health-awareness, prevention tips, simple educational sequences, public-health campaigns, posture/ergonomics ideas.
**Never for:** realistic anatomy, injury localisation, clinical claims, or replacing the presenter. Arabic = real text layers (`ArabicText`). Colours from the FMC palette. No audio, no logo recolouring.
**Not done:** icon/object library (desk, chair, spine-as-icon), scene templates, motion test beyond one still, approval of the look by the user.
