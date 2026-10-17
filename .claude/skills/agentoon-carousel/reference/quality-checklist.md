# Quality gate (enforced by `scripts/render.mjs`, exit code 1 on failure)

| Check | Rule |
|---|---|
| Canvas | Every PNG exactly 1080 × 1350 (checked from the PNG header) |
| Instagram safe area | Text, cards, pills, code boxes, callouts, diagrams, mascot and footer ≥ 120px from top/bottom and ≥ 70px from left/right. `safe-area-check.png` shades the unsafe zones red |
| Text size (px @1080) | labels/kicker/footer ≥ 26 · body & explanations ≥ 30 · code ≥ 32 · diagram text ≥ 28 |
| Phone test | `mobile-preview.png` = every slide at 390 px wide (1×). 30px ≈ 10.8pt, 32px ≈ 11.6pt on a 390pt phone. Read it, not just the full-size PNGs |
| Contrast | WCAG ≥ 4.5:1 (≥ 3:1 for text ≥ 40px), measured against the colour really painted behind each text node (HTML + SVG) |
| Grid | content blocks start at x = 72px; content area ≈ 1000px tall |
| Alignment | every stacked block starts at x = 72px and ends ≤ 1008px |
| Footer | ≥ 24px between the last block and the footer rule |
| Overflow | no content wider/taller than its card, pill, code box or callout; no child spilling out of its container |
| Overlap | stacked blocks never overlap; diagram SVG text stays inside its viewBox |
| Mascot | stays on the slide and never covers text |
| Spelling | `spellcheck.py` (pyspellchecker). Add brand/tech terms to `assets/spell-allow.txt` |
| Fonts | Fraunces, Inter, JetBrains Mono must load |

Output: `qa-report.md` (smallest font, phone pt size, lowest contrast per slide).

## Manual review (the gate cannot judge these)

1. Open every `png/slide-NN.png`, `mobile-preview.png` and `safe-area-check.png` (nothing important may touch the red zones).
2. Headline line breaks (no one-word orphans), awkward wraps in callouts, unbalanced empty space.
3. Layout variety: different diagram, theme, and block order on neighbouring slides, same type/colour/footer system.
4. Mascot mood fits the slide (hook = wow, review = focus, plan = think, loop = dizzy, error = oops, CTA = cheer).
5. Every technical claim matches `reference/verified-claude-code-commands.md` or a freshly fetched official page.
6. The hook works at thumbnail size: one idea, one promise, one reason to swipe.
7. The CTA makes **Follow @agentoon.ai** the biggest element.

## Palette rules learned the hard way

- Coral `#FF6A3D` is a *fill* colour. As text on paper it is 2.5:1 (fails). Use `--accent-t` for accent text and `--on-accent` for text on accent fills.
- Never put paper-coloured text on coral fills. Use ink.
