# OFFICIAL WEBSITES & REAL VISUAL ASSETS (Ep 10 · AI Property Design)
Checked 2026-10-27 from the cloud sandbox (egress allow-list). Reference video `1000285757.mp4` was NOT available in the sandbox.

| Item | Exact URL | Inspected | Used in video | Status |
|---|---|---|---|---|
| Claude Code docs | https://code.claude.com/docs | HTTP 200, Playwright screenshot `assets/shot-claude-code-docs.png` (page "Overview - Claude Code Docs") | scene 3 source reference (not on screen as a UI substitute) | verified |
| Claude (claude.ai app UI) | https://claude.ai | HTTP 403 from sandbox | needed for "give Claude the images" scene | **needs-recording** (screen recording of a real Claude chat with the 3 inputs and its real reply) |
| Blender site / docs / logo | https://www.blender.org · https://docs.blender.org/manual/en/latest/ | unreachable (proxy refuses) | logo not used | **needs-recording** (real Blender viewport recording + official logo from the press page) |
| Blender engine (what actually ran) | PyPI package `bpy` 5.2.3 (https://pypi.org/project/bpy/, licence GPL-3.0, homepage blender.org) | installed in a scratch venv, `bpy.app.version_string` = `5.2.3 LTS` | all 3D shots are real Blender Cycles renders (headless, CPU) | verified |
| Remotion | https://www.remotion.dev (site unreachable) · licence file read from raw.githubusercontent.com/remotion-dev/remotion | not used in this cut | - | not used (see report) |
| Gemini / Google Flow / Veo docs | https://gemini.google.com · https://labs.google/fx/tools/flow · https://ai.google.dev/gemini-api/docs/video | unreachable; no credits spent, no approval | not used | not used |
| Pexels | https://www.pexels.com | unreachable | not used | not used |
| Vercel | https://vercel.com · https://vercel.com/docs | unreachable; no interactive viewer built | not used | not used |

## Sample inputs (all labelled on screen)
- Land photo: Blender render of the empty sample plot (stand-in for the viewer's own photo). 
- Location: schematic card "SAMPLE LOCATION · SCHEMATIC, NOT A REAL MAP".
- Plan: SVG drawn from the same numbers as the Blender model (plot 40 x 30 m, conceptual).
## Honesty notes
- Property is an original conceptual design. No engineering dimensions are claimed.
- Claude Code here wrote and ran the bpy scripts (`blender/build_property.py`, `render_stage.py`). It did not drive Blender through a Blender MCP.
