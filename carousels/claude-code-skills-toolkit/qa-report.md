# QA report — Your Claude Code Skills Can Improve Themselves

Safe area: 70px left/right, 100px top, 180px bottom. Thresholds (px @1080): label ≥ 26, body ≥ 30, code ≥ 32, diagram text ≥ 28; contrast ≥ 4.5:1 (3:1 for text ≥ 40px); safe margin 40px; content padding 70px; footer gap 24px.
At 390 pt phone width: label 26px = 9.4pt, body 30px = 10.8pt, code 32px = 11.6pt.

| Slide | Smallest text | On phone | Lowest contrast | Errors |
|---|---|---|---|---|
| 01 | 26px | 9.4pt | 6.65:1 | 0 |
| 02 | 26px | 9.4pt | 5.36:1 | 0 |
| 03 | 26px | 9.4pt | 8.32:1 | 0 |
| 04 | 26px | 9.4pt | 5.36:1 | 0 |
| 05 | 26px | 9.4pt | 4.68:1 | 0 |
| 06 | 26px | 9.4pt | 8.32:1 | 0 |
| 07 | 26px | 9.4pt | 5.36:1 | 0 |
| 08 | 26px | 9.4pt | 5.84:1 | 0 |
| 09 | 26px | 9.4pt | 5.44:1 | 0 |

## Simulated 1:1 centre crop (informational)

Instagram can crop a 4:5 image to 1:1, which removes the top and bottom 135px. Safe-area margins reduce clipping from UI overlays and grid crops; they cannot fix a wrongly selected aspect ratio. Keep 4:5 selected when uploading.

- slide 1: a 1:1 centre crop would clip: "Claude Code · Skills" (34px)
- slide 2: a 1:1 centre crop would clip: "The basics" (34px)
- slide 3: a 1:1 centre crop would clip: "Skill 1 · task-observe" (34px)
- slide 4: a 1:1 centre crop would clip: "Continuous improvement" (34px)
- slide 5: a 1:1 centre crop would clip: "Skill 2 · impeccable" (34px)
- slide 6: a 1:1 centre crop would clip: "The toolkit" (34px)
- slide 7: a 1:1 centre crop would clip: "Install" (34px)
- slide 8: a 1:1 centre crop would clip: "Verify" (34px)
- slide 9: a 1:1 centre crop would clip: "Save this" (34px)

**Status: PASSED** (automated). Visual review of every PNG is still required.
