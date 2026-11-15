---
name: explainer-panel-reel
description: >-
  Agentoon.ai Remotion effect: split-screen explainer panel with a real website screenshot in a browser frame, camera glides between keyframes,
  animated cursor and click ripples, drawn-on highlight boxes, callouts joined to numbered step cards by animated connectors, and word-synced captions.
  Use for software tutorials and "how to use X" scenes. Type /explainer-panel-reel.
---

# /explainer-panel-reel

Real, working Remotion component: `agentoon-video/remotion-fx/src/fx/ExplainerPanel.tsx` (proof clip: `agentoon-video/remotion-fx/proof/test-b-explainer.mp4`).

## When to use / not use
Use when the narration walks through UI steps (open, pick, click). Needs a REAL screenshot (or screen-recording frame) of the tool. If the site cannot be captured, say so on screen; do not mock the UI.

## Steps
1. Capture the page with Playwright at 1280x800 DPR 1.5 → 1920x1200 JPEG into `public/shots/`. View it and read target coordinates in SCREENSHOT pixels (all props use screenshot px).
2. Fill `PanelProps` (see `src/tests/TestB.tsx`):
   - `cam`: keyframes `{f, cx, cy, zoom}`: where the camera looks on each narrated beat (eased glide).
   - `cursor`: keyframes `{f,x,y,click?}`; each click draws a ripple + press squash.
   - `highlights`: rectangles that draw on and pulse; `callouts`: label + target + step index (`side: above|left|right`).
   - `steps`: cards `{title, detail, from, to}` that activate, then tick off.
   - `words`: `{w, s, e}` frame stamps from the narration timing (TTS word times × 30) → 4-word caption chunks, active word in a lime block.
3. Register in `src/Root.tsx`, preview frames with `npx remotion still`, adjust coordinates until each callout lands on the real UI element.
4. Render + verify as in /scrapbook-collage. Captions sit at the top (y 130) and never cover the browser.

## Craft rules
- Camera moves on the narrated word, holds 0.5 s, then releases; never zoom past readable text.
- Connectors draw on (`pathLength` dash) then show the arrowhead; callouts spring in; cursor eases between click targets.
- Do not claim a click works: the cursor is an overlay on a screenshot unless the footage is a real recording.
