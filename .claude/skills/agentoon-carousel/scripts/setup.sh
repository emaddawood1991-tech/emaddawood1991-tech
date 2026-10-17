#!/usr/bin/env bash
# Checks (and where possible installs) what the carousel generator needs. Safe to run repeatedly.
set -u
ok=1
say() { printf '%s\n' "$*"; }
command -v node >/dev/null || { say "✗ node not found (need Node 18+)"; ok=0; }
command -v zip  >/dev/null || { say "✗ zip not found (needed for the ZIP package)"; ok=0; }
if node -e "require('playwright')" 2>/dev/null; then say "✓ playwright (node)"; else
  say "✗ playwright missing. Install: npm i -g playwright && npx playwright install chromium"; ok=0; fi
if python3 -c "import spellchecker" 2>/dev/null; then say "✓ pyspellchecker"; else
  say "… installing pyspellchecker"; pip install --quiet pyspellchecker 2>/dev/null || pip3 install --quiet pyspellchecker 2>/dev/null || python3 -m pip install --quiet pyspellchecker 2>/dev/null
  python3 -c "import spellchecker" 2>/dev/null && say "✓ pyspellchecker" || say "! pyspellchecker unavailable: spelling check will be skipped"; fi
[ "$ok" = 1 ] && say "READY" || { say "NOT READY"; exit 1; }
