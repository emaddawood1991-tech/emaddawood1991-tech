#!/usr/bin/env bash
# Idempotent bootstrap for the user-level Claude Code skills in SKILLS-REGISTRY.md.
# Safe to re-run: every step checks first and skips if already present.
# Does NOT install claude-mem (needs explicit approval, see registry) and does NOT
# touch impeccable (already provided by the account-synced plugin).
set -euo pipefail

CLAUDE_HOME="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

# 1. Find Skills (vercel-labs/skills) -> $CLAUDE_HOME/skills/find-skills
if [ -f "$CLAUDE_HOME/skills/find-skills/SKILL.md" ]; then
  echo "find-skills: already installed"
else
  npx --yes skills add vercel-labs/skills --skill find-skills -g -a claude-code -y
fi

# 2. Superpowers (obra/superpowers) via the official Anthropic marketplace
if claude plugin list 2>/dev/null | grep -q "superpowers@claude-plugins-official"; then
  echo "superpowers: already installed"
else
  claude plugin marketplace add anthropics/claude-plugins-official 2>&1 | tail -1 || true
  claude plugin install superpowers@claude-plugins-official
fi

# 3. Task Observer (rebelytics/one-skill-to-rule-them-all) -> $CLAUDE_HOME/skills/task-observer
if [ -f "$CLAUDE_HOME/skills/task-observer/SKILL.md" ]; then
  echo "task-observer: already installed"
else
  npx --yes skills add rebelytics/one-skill-to-rule-them-all --skill task-observer -g -a claude-code -y
fi

echo "Done. Start a NEW Claude Code session for plugins/skills to load."
