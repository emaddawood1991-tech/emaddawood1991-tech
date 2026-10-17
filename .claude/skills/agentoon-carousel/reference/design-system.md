# Agentoon.ai design system

**Palette** — Ink `#0C1020` · Paper `#F5F0E6` · Coral `#FF6A3D` (primary accent) · Mint `#2FE3B2` · Sky `#6FA8FF` · Sun `#FFC83D`.
Themes switch CSS variables on `.slide.dark|.paper|.coral|.mint` (`--bg --fg --muted --line --card --card-2 --accent`).

**Type** — Headlines: Fraunces 800 (opsz 40), one *italic accent word* per headline in `--accent`. Body: Inter 500. Code/labels: JetBrains Mono. Fonts are bundled in `assets/fonts` (latin subset woff2, SIL OFL).

**Scale (px)** — h1 124–132 · h2 92 · h3 60 · lede 38 · body 32 · code 28–30 · label/footer 24–26 (minimum 24).

**Components** — `.kicker`, `.pill`, `.card`, `.code` (macOS-dot optional), `.watch` (limit/tip callout), `.banner`, footer (auto).

**Mascot** — "Agentoon bot": rounded-square head, mint/coral eyes, antenna, ear bolts, small body. Colors follow theme vars (`--m-head --m-screen --m-eye --m-body --m-ear`). Use large on hook/CTA, 66px in headers, 36px in footer.

**Composition rules** — alternate dark/paper/accent backgrounds; vary diagram shape (fan-out, staircase, flow + grid, cycle, timeline); keep a 24px gap above the footer; never fill a slide edge to edge.

**Instagram** — 1080×1350 (4:5). Export PNG at scale 1.
