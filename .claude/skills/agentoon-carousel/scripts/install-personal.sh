#!/usr/bin/env bash
# Installs agentoon-carousel as a PERSONAL skill (~/.claude/skills) so /agentoon-carousel works in every project on this machine.
# Usage: bash install-personal.sh [--link]     (--link = symlink to this folder instead of copying; edits stay in sync)
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_ROOT="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills"
DEST="$DEST_ROOT/agentoon-carousel"
mkdir -p "$DEST_ROOT"
if [ "$SRC" = "$DEST" ]; then echo "Already installed at $DEST"; exit 0; fi
if [ -e "$DEST" ] || [ -L "$DEST" ]; then
  BK="$DEST.bak-$(date +%Y%m%d-%H%M%S)"; mv "$DEST" "$BK"; echo "Existing install moved to $BK"
fi
if [ "${1:-}" = "--link" ]; then ln -s "$SRC" "$DEST"; echo "Linked $DEST -> $SRC"; else cp -R "$SRC" "$DEST"; echo "Copied to $DEST"; fi
[ -f "$DEST/SKILL.md" ] || { echo "✗ SKILL.md missing in $DEST"; exit 1; }
echo "✓ Installed. Open a NEW Claude Code session (or run /reload-skills), then type: /agentoon-carousel <topic>"
bash "$DEST/scripts/setup.sh" || true
