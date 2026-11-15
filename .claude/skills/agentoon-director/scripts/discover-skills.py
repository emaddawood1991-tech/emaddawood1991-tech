#!/usr/bin/env python3
"""Audit of REAL skills: lists every skill dir under .claude/skills (project) and ~/.claude/skills (global), whether it has code/assets behind it,
and flags documentation-only ones. Usage: python3 discover-skills.py [--json]"""
import os, re, sys, json, glob
roots = [os.path.join(os.getcwd(), ".claude/skills"), os.path.expanduser("~/.claude/skills")]
# also try the repo root when run from a subfolder
d = os.getcwd()
while d != "/" and not os.path.isdir(os.path.join(d, ".claude/skills")): d = os.path.dirname(d)
if os.path.isdir(os.path.join(d, ".claude/skills")): roots[0] = os.path.join(d, ".claude/skills")
rows = []
for root in roots:
    for sk in sorted(glob.glob(root + "/*/SKILL.md")):
        base = os.path.dirname(sk); name = os.path.basename(base)
        t = open(sk, errors="ignore").read(); m = re.search(r"^description:\s*(.+?)(?:\n[a-z_-]+:|\n---)", t, re.S | re.M)
        desc = re.sub(r"\s+", " ", (m.group(1) if m else "")).strip(" >-\"'")[:110]
        code = [f for f in glob.glob(base + "/**/*", recursive=True) if re.search(r"\.(tsx?|jsx?|py|sh|mjs|cjs)$", f) and "node_modules" not in f]
        impl = "code:%d files" % len(code) if code else "doc-only"
        extra = ""
        if name in ("scrapbook-collage", "explainer-panel-reel", "neon-outline"): extra = "-> agentoon-video/remotion-fx/src/fx (Remotion component)"
        rows.append({"scope": "project" if root.startswith(d) and root == roots[0] else "global", "name": name, "impl": impl, "extra": extra, "desc": desc})
if "--json" in sys.argv: print(json.dumps(rows, indent=1))
else:
    for r in rows: print(f"{r['scope']:8} {r['name']:26} {r['impl']:16} {r['extra']}  | {r['desc']}")
    print(f"\n{len(rows)} skills. 'doc-only' skills give guidance but no executable effect: never claim an effect from them without a rendered clip.")
