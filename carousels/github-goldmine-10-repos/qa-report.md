# QA report — 10 GitHub Repositories Every AI Builder Should Know

Safe area: 70px left/right, 100px top, 180px bottom. Thresholds (px @1080): label ≥ 26, body ≥ 30, code ≥ 32, diagram text ≥ 28; contrast ≥ 4.5:1 (3:1 for text ≥ 40px); safe margin 40px; content padding 70px; footer gap 24px.
At 390 pt phone width: label 26px = 9.4pt, body 30px = 10.8pt, code 32px = 11.6pt.

| Slide | Smallest text | On phone | Lowest contrast | Errors |
|---|---|---|---|---|
| 01 | 26px | 9.4pt | 6.65:1 | 0 |
| 02 | 26px | 9.4pt | 5.88:1 | 0 |
| 03 | 26px | 9.4pt | 5.96:1 | 0 |
| 04 | 26px | 9.4pt | 7.90:1 | 0 |
| 05 | 26px | 9.4pt | 5.44:1 | 0 |
| 06 | 26px | 9.4pt | 5.88:1 | 0 |
| 07 | 26px | 9.4pt | 5.96:1 | 0 |
| 08 | 26px | 9.4pt | 7.90:1 | 0 |
| 09 | 26px | 9.4pt | 5.36:1 | 0 |
| 10 | 26px | 9.4pt | 5.96:1 | 0 |
| 11 | 26px | 9.4pt | 5.44:1 | 0 |

## Simulated 1:1 centre crop (informational)

Instagram can crop a 4:5 image to 1:1, which removes the top and bottom 135px. Safe-area margins reduce clipping from UI overlays and grid crops; they cannot fix a wrongly selected aspect ratio. Keep 4:5 selected when uploading.

- slide 1: a 1:1 centre crop would clip: "AI builder toolkit" (34px)
- slide 2: a 1:1 centre crop would clip: "API DIRECTORY" (22px), "Curated list" (24px), "MIT" (24px), <pill> (29px)
- slide 3: a 1:1 centre crop would clip: "MCP" (22px), "Curated list" (24px), "MIT" (24px), <pill> (29px)
- slide 4: a 1:1 centre crop would clip: "README.md" (27px), "Excerpt · how it works" (27px)
- slide 5: a 1:1 centre crop would clip: "AI AGENTS" (22px), "App collection" (24px), "Apache-2.0" (24px), <pill> (29px)
- slide 6: a 1:1 centre crop would clip: "RESOURCES" (22px), "List of lists" (24px), "CC0-1.0" (24px), <pill> (29px)
- slide 7: a 1:1 centre crop would clip: "WEB SCRAPING" (22px), "Python framework" (24px), "BSD-3" (24px), <pill> (29px)
- slide 8: a 1:1 centre crop would clip: "FREE TOOLS" (22px), "Curated list" (24px), <pill> (29px)
- slide 9: a 1:1 centre crop would clip: "LOCAL AI" (22px), "Software" (24px), "MIT" (24px), <pill> (29px)
- slide 10: a 1:1 centre crop would clip: "Concept diagram" (27px), "Not a screenshot" (27px)
- slide 11: a 1:1 centre crop would clip: "CODING AGENTS" (22px), "Agent platform" (24px), "MIT" (24px), <pill> (29px)

**Status: PASSED** (automated). Visual review of every PNG is still required.
