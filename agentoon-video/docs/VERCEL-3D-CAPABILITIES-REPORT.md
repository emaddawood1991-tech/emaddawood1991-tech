# Agentoon.ai · Vercel + 3D Video Capabilities: Technical Report

Read-only investigation. No Vercel setting, Dawoud Labs project, or credential was changed or exposed. No new website or video was made for this task.

## 1. Previous villa project (inspected)
Source: branch `claude/ecstatic-goldberg-ovm1a3` (read via git, not checked out). Not present on this branch.

## 2. What actually produced the villa animation
| Layer | Technology | Evidence |
|---|---|---|
| Scene description | JSON spec + `builder.mjs` that generates geometry in code | `threejs/builder.mjs`, `demo-orbit.json` |
| 3D engine | **Vanilla Three.js 0.170** (WebGL). Not React Three Fiber | `threejs/package.json`, `scene.html` |
| Renderer | Headless **Chromium via Playwright**, software WebGL (SwiftShader) | `render.mjs` launch args `--use-angle=swiftshader --use-gl=angle --enable-unsafe-swiftshader --ignore-gpu-blocklist` |
| Alternate path | Blender script `villa_development.py` | Written and stub-tested only; **never rendered in real Blender** |
| Video encode | FFmpeg, libx264, crf 17, yuv420p, faststart | `render.mjs` |
| Vercel's role | **Hosting/building only** | Deployments are Git-sourced previews |
| AI Gateway's role | **None.** Not used for the villa | Gateway code is a separate optional clip tool |

Conclusion: the villa was **code-generated Three.js rendered offline to PNG frames and encoded with FFmpeg**. Vercel did not render it, and AI Gateway did not produce it.

## 3. How it became video (the recording method)
1. `scene.html` exposes `window.__render(t)`: a deterministic function that positions camera and objects for time `t`.
2. `render.mjs` loops `i / fps`, calls `__render`, grabs `canvas.toDataURL("image/png")`, writes `f_00001.png ...`.
3. `ffmpeg -framerate fps -i f_%05d.png -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -movflags +faststart out.mp4`.
This is frame-exact (no screen recording, no dropped frames), and runs on a CPU-only machine.

## 4. Agentoon.ai Vercel project and AI Gateway status
| Item | Finding |
|---|---|
| Team | All projects sit in one team: `dawoudlabs` |
| Projects | `agentoon.ai`, `dawoud-labs`, `agentoon-property-preview` |
| `agentoon.ai` env vars | **None.** No AI Gateway key is configured there |
| `agentoon.ai` Git link | Linked to the **same repository** as other work. Every branch push creates a preview deployment (including video commits and other Claude sessions' branches) |
| AI Gateway key | Intended to live only in local, git-ignored `agentoon-video/.env` (name `AI_GATEWAY_API_KEY`). Not verified here because no key exists in this environment |
| `agentoon-property-preview` | Created by me earlier for the 85 s video page. It lives in the `dawoudlabs` team, which conflicts with the "independent from Dawoud Labs" requirement |
| `dawoud-labs` | Not touched |

Needs your decision (nothing changed yet):
1. Move/recreate `agentoon-property-preview` (and ideally `agentoon.ai`) under a separate Agentoon team or account.
2. Add an "Ignored Build Step" to `agentoon.ai` so unrelated branch pushes stop auto-deploying.
3. Make the video page public, or keep it behind Vercel login.

## 5. Two different Vercel workflows (do not mix)
| | A. Vercel hosts web 3D | B. AI Gateway generates video |
|---|---|---|
| What renders | Your code (Three.js / R3F / Blender) | A hosted AI model (e.g. Veo, Wan, Seedance, Kling, Grok Imagine) |
| Vercel's job | Static/SSR hosting, previews | Routes API calls to the model, bills credits |
| Cost | Free tier hosting | **Paid per second of video** |
| Control | Deterministic, editable, exact brand robot | Probabilistic; cannot hold the exact robot or exact text |
| Credentials | None for the render | `AI_GATEWAY_API_KEY` |
| Good for | Mascot, UI, logos, transitions, explainers | Atmospheric B-roll, texture clips |

Gateway facts used: base URL `https://ai-gateway.vercel.sh`, AI SDK `experimental_generateVideo`, endpoints `/v1/models` and `/v1/credits`. Model names and prices change; verify with `/v1/models` at run time.

## 6. Capability map and honest gaps
See `AGENTOON-3D-INTEGRATION-SPEC.md` section 4. Summary: the existing Three.js builder only knows villas, pools, paths and trees. Robots, floating UI, 3D text, people, cars and interiors are **not implemented** there. Blender (bpy, proven in Ep 10/10b) already covers cars, people, interiors, and animated rigs.
