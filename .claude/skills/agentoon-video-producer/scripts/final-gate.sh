#!/usr/bin/env bash
# FINAL approval gate (read-only). Usage: final-gate.sh <episode-dir> [video.mp4]
# Exit 0 = may be called FINAL. Exit 1 = PREVIEW only; blockers printed.
d="${1:-.}"; v="${2:-}"; here="$(cd "$(dirname "$0")" && pwd)"; bad=0
echo "== 1. placeholders / slots"; bash "$here/no-placeholders.sh" "$d" || bad=1
echo "== 2. official sources"
if [ ! -f "$d/data/OFFICIAL-SOURCES.md" ]; then echo "MISSING data/OFFICIAL-SOURCES.md"; bad=1
else grep -q -i 'needs-recording' "$d/data/OFFICIAL-SOURCES.md" && { echo "OFFICIAL-SOURCES has needs-recording rows"; bad=1; }; fi
echo "== 3. QC report"
if [ ! -f "$d/data/QC-REPORT.md" ]; then echo "MISSING data/QC-REPORT.md"; bad=1
else grep -q -i 'FAIL' "$d/data/QC-REPORT.md" && { echo "QC-REPORT contains FAIL"; bad=1; }
     grep -q -i 'PASS' "$d/data/QC-REPORT.md" || { echo "QC-REPORT has no PASS lines"; bad=1; }; fi
if [ -n "$v" ]; then
  echo "== 4. video"
  [ -f "$v" ] || { echo "video not found: $v"; bad=1; }
  [ -d "${v%.mp4}.mobile" ] || { echo "mobile-check not run (no ${v%.mp4}.mobile/)"; bad=1; }
  case "$v" in *PREVIEW*) echo "filename says PREVIEW"; bad=1;; esac
fi
if [ $bad = 0 ]; then echo "GATE PASS: may be marked FINAL"; else echo "GATE FAIL: this is a PREVIEW. Name it *-PREVIEW.mp4, list blockers + MUST RECORD items (final-approval-gate.md)."; exit 1; fi
