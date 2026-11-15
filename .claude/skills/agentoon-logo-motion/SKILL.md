---
name: agentoon-logo-motion
description: >-
  Agentoon.ai Remotion logo animation on REAL logo assets: scale/blur/mask reveal with ring burst, particle reveal built from the logo's own pixels,
  shape morphing that lands on the logo, product-style 3D-tilt presentation with reflection, and logo-to-logo transitions. For true 3D logos use
  /agentoon-3d-motion. Use for software introductions in tutorials and roundups. Type /agentoon-logo-motion.
---

# /agentoon-logo-motion

Code: `agentoon-video/remotion-fx/src/fx/logo.tsx`. Demo: showcase S12 (and S04 for 3D).

| Component | Props | Effect |
|---|---|---|
| `LogoReveal` | `src,size,start,glow` | spring scale + blur-in + circular mask wipe + ring burst |
| `ParticleLogo` | `src,size,step,seed` | canvas particles fly in from seeded positions and settle on the logo's opaque pixels, using the logo colours |
| `ShapeMorph` | `paths[],colors[],each,logo` | `interpolatePath` morphs square→circle→rounded square, then cross-fades to the real logo |
| `ProductPresentation` | `src,size,name` | card tilting in perspective, moving gloss, floor reflection |
| `LogoTransition` | `from,to` | logo A scales/rotates/blurs out as logo B comes in |

Rules: use each project's OWN logo file, unaltered (see the episode's `data/OFFICIAL-SOURCES.md`); no invented logos; paid-brand logos only if the owner's asset was actually obtained (else plain text).
