#!/usr/bin/env bash
# Idempotent setup for the Claude Code tool stack (see CLAUDE-TOOLS-REGISTRY.md).
# Re-run in any fresh cloud container. Skips servers that are already registered.
set -u
CHROME="${CHROME_BIN:-$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1)}"
add() { local n=$1; shift; claude mcp get "$n" >/dev/null 2>&1 && { echo "skip $n (exists)"; return; }; claude mcp add --scope user "$n" "$@"; }
PW_EXTRA=(); DT_EXTRA=()
if [ -n "$CHROME" ]; then PW_EXTRA=(--executable-path "$CHROME"); DT_EXTRA=(--executablePath "$CHROME"); fi
add playwright -- npx -y @playwright/mcp@0.0.83 --headless --isolated --browser chromium "${PW_EXTRA[@]}" --no-sandbox
add chrome-devtools -- npx -y chrome-devtools-mcp@1.11.0 --headless --isolated "${DT_EXTRA[@]}" --chromeArg=--no-sandbox
mkdir -p "$HOME/.claude/memory"
add memory -e MEMORY_FILE_PATH="$HOME/.claude/memory/memory.jsonl" -- npx -y @modelcontextprotocol/server-memory@2026.8.31
add context7 -- npx -y @upstash/context7-mcp@4.4.2
command -v playwright-cli >/dev/null || npm install -g @playwright/cli@0.1.22
claude mcp list | grep -E "^(playwright|chrome-devtools|memory|context7):"
