# Agentoon.ai design system

**Palette** — Ink `#0C1020` · Paper `#F5F0E6` · Coral `#FF6A3D` (primary accent) · Mint `#2FE3B2` · Sky `#6FA8FF` · Sun `#FFC83D`.
Accent text must use `--accent-t` (contrast-safe); text on accent fills uses `--on-accent`. Themes switch CSS variables on `.slide.dark|.paper|.coral|.mint` (`--bg --fg --muted --line --card --card-2 --accent`).

**Type** — Headlines: Fraunces 800 (opsz 40), one *italic accent word* per headline in `--accent`. Body: Inter 500. Code/labels: JetBrains Mono. Fonts are bundled in `assets/fonts` (latin subset woff2, SIL OFL).

**Scale (px)** — h1 108–132 · h2 92 · h3 56–60 · lede 36–38 · body 34 · code 32 · watch 32 · label/footer 26–28 (minimum 26). Diagram text ≥ 28.

**Components** — `.kicker`, `.pill`, `.card`, `.code` (macOS-dot optional), `.watch` (limit/tip callout), `.banner`, footer (auto).

**Mascot** — "Agentoon bot": rounded-square head, mint/coral eyes, antenna, ear bolts, small body. Nine moods: happy, wow (hook), think (planning), wink, focus (review), cheer (CTA, arms up), dizzy (loop), oops (debug), proud (summary). Colors follow theme vars (`--m-head --m-screen --m-eye --m-body --m-ear`). Large on hook/CTA (260–300px), 112px in headers (so the expression reads on a phone), 38px in footer.

**Composition rules** — alternate dark/paper/accent backgrounds; vary diagram shape (fan-out, staircase, flow + grid, cycle, timeline); keep a 24px gap above the footer; never fill a slide edge to edge.

**Instagram** — 1080×1350 (4:5). Export PNG at scale 1.
