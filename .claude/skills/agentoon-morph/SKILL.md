---
name: agentoon-morph
description: >-
  Before-and-after and transformation reveals for Agentoon.ai: comparison sliders, image wipes, mask reveals, shape morphing, match cuts, split screens, image expansion. Use when demonstrating a real tool's result (image edits, restores, clean-ups, upgrades). Requires genuine before and after assets.
argument-hint: <what changes, and where the real before/after files are>
allowed-tools: Read Edit Write Grep Glob Bash
---

# /agentoon-morph

A comparison is evidence. Both sides must be **real files from the real tool**. If either is missing, render a hatched `PENDING` panel that says what is missing; never synthesise a result or label another generator's output as the demonstrated tool.

## Asset rules
- Pairs: `sources/NN.jpg` (original) and `results/NN.png` (real result) in the episode folder; `build.py` picks them up automatically (`episodes/12-chatgpt-image-tricks-p1/build.py`).
- Same crop and aspect for both (`object-fit: cover` in one box) so differences are the edit, not framing. Large (>= 1000 px wide on 1080) and centred; no caption or robot over the image.
- Record per pair in a tracking sheet: source (URL, author, licence), exact prompt/settings, tool, quality, limitations.
- Project-supplied screenshots are fine **if labelled** (`PROJECT PHOTOS · NOT MY TV`), never as your own test.

## Patterns
- **Wipe (default):** the AFTER layer is `clip-path: inset(0 100% 0 0) -> inset(0 0% 0 0)` over 0.9-1.0 s `power2.inOut`, a 6 px divider line moves with it; BEFORE chip fades at 50 %, AFTER chip at 85 %. Build with the `wipe(host,id,w,h,tr,at,dur)` helper in episodes 12 and 13.
- **Hold:** at least 1.5 s on the finished AFTER with a slow 3-4 % push; narrate one concise sentence.
- **Slider:** the divider sweeps A -> B -> centre; use when the viewer should judge detail.
- **Match cut:** end the BEFORE scene on a shape/object that the AFTER scene starts on (same position/scale), cut on the frame.
- **Split screen:** two cards, equal size, labelled; use for three-way comparisons (original / tool A / tool B).
- **Image expansion (outpaint demos):** animate the frame growing: original centred at scale 1, background layer revealed by an expanding mask; keep the original untouched.
- **Shape morph:** SVG path tween only between simple icons (use for explainers, never for results).
- **Montage of results:** grid with staggered pop-ins (0.35-0.4 s apart), numbered chips; tiles show real results or `NOT RUN` panels.

## Mobile
BEFORE/AFTER chips >= 28 px; the transformation must be obvious at 360 px width; if it is subtle, crop to the changed area and zoom (label the crop).

## Do not
Use a filter to fake the "after", reorder results to look better, or claim an effect the real result does not show. If the real result is weak, say so in the QC report.
