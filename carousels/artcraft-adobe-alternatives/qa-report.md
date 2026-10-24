# QA report — Free Adobe Alternatives Built With AI — Meet ArtCraft

Safe area: 70px left/right, 100px top, 180px bottom. Thresholds (px @1080): label ≥ 26, body ≥ 30, code ≥ 32, diagram text ≥ 28; contrast ≥ 4.5:1 (3:1 for text ≥ 40px); safe margin 40px; content padding 70px; footer gap 24px.
At 390 pt phone width: label 26px = 9.4pt, body 30px = 10.8pt, code 32px = 11.6pt.

| Slide | Smallest text | On phone | Lowest contrast | Errors |
|---|---|---|---|---|
| 01 | 26px | 9.4pt | 6.65:1 | 0 |
| 02 | 26px | 9.4pt | 5.88:1 | 0 |
| 03 | 26px | 9.4pt | 5.44:1 | 0 |
| 04 | 26px | 9.4pt | 6.65:1 | 0 |
| 05 | 26px | 9.4pt | 8.32:1 | 0 |
| 06 | 26px | 9.4pt | 5.88:1 | 0 |
| 07 | 26px | 9.4pt | 6.65:1 | 0 |
| 08 | 26px | 9.4pt | 8.32:1 | 0 |
| 09 | 26px | 9.4pt | 6.65:1 | 0 |

## Simulated 1:1 centre crop (informational)

Instagram can crop a 4:5 image to 1:1, which removes the top and bottom 135px. Safe-area margins reduce clipping from UI overlays and grid crops; they cannot fix a wrongly selected aspect ratio. Keep 4:5 selected when uploading.

- slide 1: a 1:1 centre crop would clip: "Open-source · AI-assis" (34px)
- slide 2: a 1:1 centre crop would clip: "The story" (34px)
- slide 3: a 1:1 centre crop would clip: "Photo editing" (34px)
- slide 4: a 1:1 centre crop would clip: "Vector graphics" (34px)
- slide 5: a 1:1 centre crop would clip: "Video editing" (34px)
- slide 6: a 1:1 centre crop would clip: "Photo organizing" (34px)
- slide 7: a 1:1 centre crop would clip: "Motion graphics" (34px)
- slide 8: a 1:1 centre crop would clip: "More ArtCraft tools" (34px)
- slide 9: a 1:1 centre crop would clip: "Save the toolkit" (34px)

**Status: PASSED** (automated). Visual review of every PNG is still required.
