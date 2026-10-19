# Ep 04 — Gemini + Veo 3.1 product ad: what is still needed

Preview: `out/agentoon-ep04-veo-product-ad-PREVIEW-v2.mp4` (25.0 s). Unfinished, not publishable.

Provided: narration (deliverables/narration-transcript.txt) and the reusable prompt (deliverables/veo-product-ad-prompt.txt).
NOT available in this environment: the reference video 1000285075.mp4, your product photo, Gemini (gemini.google.com, Google docs blocked by the sandbox network policy), and any Veo output. Nothing was generated and no credits were used.

| Slot (data/slots.json) | Scenes | Needed |
|---|---|---|
| product_photo | 2, 4, 5 | Your real perfume/product photo (clear, front-facing) |
| gemini_rec | 3, 4 | Real Gemini screen recording: choose Veo 3.1, upload, paste prompt (hide account info) |
| veo_output | 1, 5 | The real Veo 3.1 clip (needs you to sign in and approve any credits) |

The hook studio and the pipeline-card studio are a labeled CONCEPT ILLUSTRATION built in CSS, not Veo output. The Gemini window is a schematic. Both must be replaced with real footage before publishing.

Verify at recording time (could not be checked here): current Gemini menu names for video generation / Veo 3.1, plan or credit requirements, clip length and 9:16 support.

Replace: put files in assets/, set slot status `verified`, add `<video muted>`/`<img>` in src/index.template.html where the placeholder sits (HyperFrames rules), `python3 build.py`, mix, render to a NEW filename, validate, set preview_banner false.
