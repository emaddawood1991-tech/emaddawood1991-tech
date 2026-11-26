# Claude Code mascot (Agentoon.ai animated interpretation, NOT an official Anthropic asset)
Permanent Claude character for all future Claude-related Agentoon.ai videos (supersedes the earlier star-shaped Claude from Episode 24).
- Shape (from the user's reference stills): blocky terracotta body (#D97757), two small black square eyes, two short rectangular side arms, four short rectangular legs, minimal face (tiny mouth slit used only for TALK). No humanoid limbs, big eyes, gloves, shoes, star shape or separate head.
- Files: `blender/build_claude_mascot.py` (single source: geometry, armature, materials, accessories, 11 animation actions, test renders), `claude_mascot.blend`, `glb/claude_mascot.glb`, `tests/sheet.png` (12 poses).
- Rig bones: root, body, armL, armR, leg0-3, eyeL, eyeR, mouth, acc. Rigid vertex-group skinning (no bone-parent offset).
- Animation actions (fps 30): IDLE 60f, BOUNCE 24, WAVE 48, LOOK 60, WALK 36, RUN 18, TALK 30 (mouth), THINK 60, POINT 36, CELEBRATE 36, LISTEN 60. Face front = -Y.
- Accessories (hidden by default, toggle `hide_render` on parts of `ACC` in the script): headphones (coding), detective (hat + magnifier, research), lightbulb (ideas), laptop (development), clipboard (planning), documents (content), calendar (scheduling).
- Render: `/tmp/bpyenv/bin/python blender/build_claude_mascot.py --render-tests` (Blender 5.3 bpy, Cycles CPU, transparent PNG).
- Known v1 limits: WAVE/POINT arm lift is modest; arm/leg motion is in a mostly frontal view; no mouth in IDLE by design.
