#!/usr/bin/env bash
# Real Claude Code run of one slash skill: bash scripts/cc_run.sh <skill> <CompId> <frame>
# Invokes `claude -p "/<skill> ..."` (Haiku 5.5) from the Remotion project so the project skill is discovered, lets it run ONE real `remotion still`, saves the stream-json transcript.
set -euo pipefail; cd "$(dirname "$0")/.."; S="$1"; C="$2"; F="$3"; mkdir -p out/cc ../episodes/19-nine-slash-commands/data/cc
PROMPT="/$S Render a preview still of composition $C at frame $F by running exactly: npx remotion still $C out/cc/$C.png --frame=$F  then run: ls -l out/cc/$C.png  and report the file size in one short sentence."
REMOTION_LOG=error claude -p "$PROMPT" --model claude-haiku-5-5 --output-format stream-json --verbose --permission-mode acceptEdits --allowedTools "Skill Bash(npx remotion still:*) Bash(ls:*)" > ../episodes/19-nine-slash-commands/data/cc/$S.jsonl 2> /tmp/cc_$S.err
python3 -I - "$S" <<'PY'
import json,sys
s=sys.argv[1]; skill=None; bash=[]; res=None; cost=None
for l in open(f"../episodes/19-nine-slash-commands/data/cc/{s}.jsonl"):
    try:o=json.loads(l)
    except:continue
    if o.get("type")=="assistant":
        for c in o["message"]["content"]:
            if c["type"]=="tool_use":
                if c["name"]=="Skill": skill=c["input"].get("skill")
                if c["name"]=="Bash": bash.append(c["input"].get("command","")[:90])
    if o.get("type")=="result": res=o.get("result","")[:160]; cost=o.get("total_cost_usd")
print(s,"| skill tool:",skill,"| bash:",bash,"| result:",res,"| $",cost)
PY
