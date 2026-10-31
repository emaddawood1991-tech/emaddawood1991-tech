#!/usr/bin/env python3
"""Validate the Agentoon.ai slash-skill set: SKILL.md present, frontmatter parses, name == folder, description present and <= 1536 chars (description + when_to_use),
body is substantive (not a placeholder) and <= 500 lines, referenced ${CLAUDE_SKILL_DIR}/ paths exist, listed kit/script paths exist. Exit 1 on any failure.
Usage: python3 validate-skills.py"""
import os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
SK = os.path.join(ROOT, ".claude", "skills")
NAMES = ["agentoon-director", "agentoon-motion", "agentoon-camera", "agentoon-typography", "agentoon-robot", "agentoon-ui", "agentoon-3d", "agentoon-morph", "agentoon-diagrams", "agentoon-audio", "agentoon-transitions", "agentoon-qc"]
try:
    import yaml
except Exception:
    yaml = None
def parse(text):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m: return None, text
    fm = m.group(1)
    if yaml: return yaml.safe_load(fm), m.group(2)
    d = {}
    for line in fm.splitlines():
        mm = re.match(r"^([a-zA-Z_-]+):\s*(.*)$", line)
        if mm: d[mm.group(1)] = mm.group(2).strip()
    return d, m.group(2)
bad = 0; rows = []
for n in NAMES:
    p = os.path.join(SK, n, "SKILL.md"); errs = []
    if not os.path.exists(p): rows.append((n, ["MISSING SKILL.md"])); bad += 1; continue
    fm, body = parse(open(p).read())
    if not isinstance(fm, dict): errs.append("frontmatter missing or unparsable")
    else:
        if fm.get("name") != n: errs.append(f"name {fm.get('name')!r} != folder")
        desc = str(fm.get("description", "")) + " " + str(fm.get("when_to_use", ""))
        if len(desc.strip()) < 80: errs.append("description too short to discover")
        if len(desc) > 1536: errs.append(f"description+when_to_use {len(desc)} > 1536")
        if "argument-hint" not in fm: errs.append("no argument-hint")
    lines = body.splitlines(); nz = sum(1 for l in lines if l.strip())
    if nz < 20: errs.append(f"body too thin ({nz} non-empty lines): placeholder?")
    if len(lines) > 500: errs.append("body over 500 lines")
    if re.search(r"\b(TODO|TBD|lorem ipsum|placeholder skill)\b", body, re.I): errs.append("contains TODO/TBD")
    for ref in re.findall(r"\$\{CLAUDE_SKILL_DIR\}/([\w./-]+)", body):
        if not os.path.exists(os.path.join(SK, n, ref)): errs.append(f"missing referenced file {ref}")
    for ref in re.findall(r"(?:agentoon-video/[\w./-]+\.(?:js|py|sh|css|md)|\.claude/skills/[\w./-]+\.(?:sh|py|md))", body):
        if "*" in ref or "<" in ref: continue
        if not os.path.exists(os.path.join(ROOT, ref)): errs.append(f"missing repo path {ref}")
    rows.append((n, errs)); bad += bool(errs)
for n, errs in rows: print(("FAIL " if errs else "PASS ") + "/" + n + ("  " + "; ".join(errs) if errs else ""))
print(f"\n{len(NAMES) - bad}/{len(NAMES)} skills valid" + ("" if yaml else " (PyYAML not installed: simple frontmatter parser used)"))
sys.exit(1 if bad else 0)
