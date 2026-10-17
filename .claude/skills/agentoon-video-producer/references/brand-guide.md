# Agentoon.ai brand guide (video)

Principle: **SAME BRAND. DIFFERENT VISUAL EXPERIENCE. EVERY VIDEO.** The brand elements below are fixed. Everything else (background, typography treatment, motion language, camera grammar, subtitle style, transitions) changes per episode.

## Fixed elements

### Robot (the character)
- The original Agentoon robot: **teal body, light-grey head, red antenna bulb, navy eyes, chest light, black outlines.** Friendly, curious, a little mischievous.
- Preserve its appearance and personality in every video. It is a character who takes part in the story, not a corner logo.
- Never replace it with Clawd (Anthropic's mascot) or any other character, even when a style guide or example features one.
- Additions are allowed only where animation needs them (arms, legs, hands, expression layers) and must match the original's proportions, line weight and colours.

### Wordmark
- `agentoon` in white plus `.ai` in cyan `#60CDFF` on dark backgrounds. On light backgrounds keep the same split with a dark `agentoon` and the same cyan `.ai` (check contrast).
- Handle for captions and CTAs: **@agentoon.ai**.

### Signature ending
- Logo + robot (soft glow, wave) + **one** clear CTA: "+ Follow Agentoon.ai".
- No separate Like / Follow / Share buttons.
- Concise: about 1.5–2 s on short tests; on full videos keep it short and let the narration continue through it.
- Arrive with a smooth seam (for example the page tilts away while a navy field rises and the robot walks to centre), not a hard cut.

## Open items (do not guess)
- The canonical logo and robot artwork files are **not in this repository**. Before building the ending, ask the user for the original files or locate them in the user's kit, and store them under `references/assets/` (create it) with a note of their source. Do not redraw the logo from memory.
- The repo's `agentoon-carousel` skill has its own mascot sprite (`.claude/skills/agentoon-carousel/assets/sprite.svg`, rounded-square head, mint/coral accents, nine moods) and palette (Ink `#0C1020`, Paper `#F5F0E6`, Coral `#FF6A3D`, Mint `#2FE3B2`, Sky `#6FA8FF`, Sun `#FFC83D`; Fraunces / Inter / JetBrains Mono). That is the static-carousel rendering. If it differs from the video robot above, the **video robot description is canonical for video**; ask the user which version to follow when in doubt.

## Visual identity (stable across episodes)
- Educational, premium, confident, warm. Real software on screen, not stock imagery.
- Typography: pick per episode, but keep headline vs. code distinction (display or editorial face for headlines, monospace for code). Fonts must be locally bundled and licence-free (SIL OFL or similar).
- Backgrounds: alternate light and dark according to topic. Light editorial for explanations, dark for technical demos.
- Colour: episode palettes vary, but cyan `#60CDFF` stays as the brand accent for `.ai` and the CTA.

## What may vary vs. what may not

| Fixed | Varies per episode |
|---|---|
| Robot design and personality | Background, palette arc, texture |
| Wordmark and handle | Typography treatment |
| Signature ending and single CTA | Motion language, camera grammar |
| 9:16, 1080×1920 | Subtitle style, transitions, B-roll style |
| Honest, verified content | Visual device that carries the story |

## Attribution and licensing
- Free tools used for style or motion must be credited where their licence requires it. Stock footage (for example Pexels) is credited in the caption where practical ("Footage: Pexels").
- Never reuse code or assets from noncommercial-licensed projects (OneTake).
