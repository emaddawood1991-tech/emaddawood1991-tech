#!/usr/bin/env bash
# Report which Agentoon.ai production tools are available RIGHT NOW. Read-only; prints no secrets. Usage: bash check-env.sh
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"; ok(){ printf "  %-22s %s\n" "$1" "$2"; }
echo "Agentoon.ai environment check ($ROOT)"
for c in ffmpeg ffprobe node npx python3; do command -v $c >/dev/null && ok "$c" "yes" || ok "$c" "MISSING"; done
command -v blender >/dev/null && ok "blender (app)" "yes" || ok "blender (app)" "not installed"
if [ -x /tmp/bpyenv/bin/python ]; then ok "bpy (headless Blender)" "$(/tmp/bpyenv/bin/python -c 'import bpy;print(bpy.app.version_string)' 2>/dev/null || echo broken)"; else ok "bpy (headless Blender)" "no /tmp/bpyenv (pip install bpy in a venv)"; fi
command -v shotcut >/dev/null && ok "shotcut" "yes" || ok "shotcut" "not installed"
ok "hyperframes" "$(cd "$ROOT" && npx --no-install hyperframes --version 2>/dev/null | tail -1 || echo missing)"
for d in remotion-studio remotion-video remotion-claude; do [ -d "$ROOT/$d" ] && ok "$d" "$( [ -d "$ROOT/$d/node_modules" ] && echo 'installed' || echo 'present, node_modules NOT installed (use a scratch copy)')"; done
[ -f /tmp/kokoro/kokoro-v1.0.onnx ] && ok "kokoro tts" "model present" || ok "kokoro tts" "model missing (see kit/README.md)"
[ -f "$ROOT/agentoon-video/kit/robot.js" ] && ok "robot kit" "kit/robot.js (+ speak/aimPoint/react)" || ok "robot kit" "MISSING"
find "$ROOT/agentoon-video" -name '*.blend' -not -path '*/node_modules/*' 2>/dev/null | grep -qi robot && ok "blender robot rig" "found" || ok "blender robot rig" "none in repo (robot is the 2D SVG kit)"
for h in api.pexels.com images.pexels.com; do c=$(curl -s -m 6 -o /dev/null -w '%{http_code}' https://$h 2>/dev/null); ok "$h" "$([ "$c" = 000 ] && echo 'unreachable' || echo "http $c")"; done
[ -n "$PEXELS_API_KEY$KEY" ] && ok "pexels key" "env var present" || ok "pexels key" "no env var (checked PEXELS_API_KEY, KEY)"
echo "Existing skills:"; ls "$ROOT/.claude/skills" 2>/dev/null | sed 's/^/  /'
