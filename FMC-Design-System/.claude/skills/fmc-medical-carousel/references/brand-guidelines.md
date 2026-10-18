# FMC brand guidelines

- Arabic name: **مركز الفيصل الطبي** · English: **AL FAISAL MEDICAL CENTER** · Short: **FMC** · Al Ain, Abu Dhabi, UAE.
- Slogan (always exactly): **Ideal Care – الرعاية المثالية**. Render with the `slogan()` component (LTR container; English, red en-dash, Arabic).
- Closing CTA example: «صحتك تستحق العناية».

## Logo
- Source: `assets/logo/fmc-logo-original.webp` (original, untouched) → `fmc-logo.png` (lossless PNG conversion) → `fmc-logo-trimmed.png` (transparent margins cropped; no scaling/recolouring). Templates use the trimmed PNG at natural aspect ratio.
- The logo (heart-like swooshes in blue / silver-blue / red + "FMC Ideal Care") has a transparent background. Place on white or very light surfaces; on dark styles it sits in a white rounded tile.
- Never redraw, recolour, stretch, rotate, add effects, or crop into the artwork. Keep ≥ 20 px clear space. Don't generate replacement logos.
- Provenance: the file was found in this repository at `remotion-studio/public/images/fmc-logo.webp`. Confirm with the client that it is the official master; swap the three files in `assets/logo/` if a vector/master is supplied.

## Colours (sampled from the logo)
| Token | Hex | Use |
|---|---|---|
| `--fmc-navy` | #0B2455 | headlines, body, dark backgrounds |
| `--fmc-blue` | #2E5AB4 | primary accent, icons, highlights |
| `--fmc-sky` | #8FB8E3 | soft fills, ligament/discs in illustrations |
| `--fmc-ice` | #EAF3FB | background shapes, note boxes |
| `--fmc-red` | #D7262E | logo accent: small highlights, warnings, sparkles (use sparingly) |
| `--fmc-aqua` | #1FA8B8 | supporting turquoise (NOT in the logo) — only subtle glows in the dark "Modern 3D" style |

Subtle gradients only (navy→blue). White backgrounds dominate.

## Never
Change the logo · invent contact info/prices/QR codes/doctor names/testimonials · promise outcomes · use unverified statistics · publish without permission.
