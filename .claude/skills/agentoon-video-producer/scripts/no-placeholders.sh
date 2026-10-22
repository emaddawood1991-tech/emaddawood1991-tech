#!/usr/bin/env bash
# Fails if an Agentoon.ai episode still contains placeholder/preview material. Usage: no-placeholders.sh <episode-dir>
d="${1:-.}"; bad=0
for f in "$d/index.html" "$d/src/index.template.html"; do
  [ -f "$f" ] || continue
  if grep -n -i -E 'PLACEHOLDER|PREVIEW ·|PREVIEW\)|REBUILT FROM THE REAL|SOME REAL FOOTAGE|lorem ipsum|TODO|REPLACE ME' "$f" | grep -v -E '^\s*[0-9]+:\s*/[/*]' | head -5; then bad=1; fi
done
if [ -f "$d/data/slots.json" ]; then
  python3 - "$d/data/slots.json" <<'PY' || bad=1
import json,sys
s=json.load(open(sys.argv[1])); r=0
if s.get("preview_banner"): print("preview_banner is true"); r=1
for k,v in (s.get("slots") or {}).items():
    if v.get("status")!="verified": print("slot not verified:",k); r=1
sys.exit(r)
PY
fi
[ $bad = 0 ] && echo "PASS no placeholders / all slots verified" || { echo "FAIL placeholders remain"; exit 1; }
