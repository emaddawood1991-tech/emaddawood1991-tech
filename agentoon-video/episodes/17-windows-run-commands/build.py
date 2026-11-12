#!/usr/bin/env python3
"""Ep 16 build: audio/timing.json -> index.html (from src/index.template.html), mix.json. Usage: python3 build.py"""
import json, re, os
D = os.path.dirname(os.path.abspath(__file__))
tm = json.load(open(f"{D}/audio/timing.json")); ph = {p["id"]: p for p in tm["phrases"]}; TOTAL = tm["total"]
SC = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"]; first = {s: next(p for p in tm["phrases"] if p["scene"] == s) for s in SC}
sc = {}
for i, s in enumerate(SC): sc[s] = {"b": 0.0 if i == 0 else round(first[s]["start"] - 0.1, 2)}
for i, s in enumerate(SC):
    sc[s]["start"] = sc[s]["b"]; sc[s]["end"] = round(sc[SC[i + 1]]["b"] + 0.6, 2) if i + 1 < len(SC) else TOTAL; sc[s]["len"] = round(sc[s]["end"] - sc[s]["start"], 2)
secs = "\n".join(f'  <section id="{k}" class="clip scene" data-start="{v["start"]}" data-duration="{v["len"]}"><div id="{k}i" class="inner"></div></section>' for k, v in sc.items())
t = open(f"{D}/src/index.template.html").read()
for key, val in (("{{SECTIONS}}", secs), ("{{SCENES}}", json.dumps(sc)), ("{{TOTAL}}", str(TOTAL))): t = t.replace(key, val)
assert "{{" not in t; open(f"{D}/index.html", "w").write(t)
def W(pid, w, off=0.0):
    p = ph[pid]
    for x in tm["words"]:
        if p["start"] - 0.001 <= x["s"] <= p["end"] and re.sub(r"[.,:!?\"']", "", x["w"]).lower() == w.lower(): return round(x["s"] + off, 2)
    raise KeyError((pid, w))
sfx = [{"name": "whoosh", "t": round(sc[s]["b"] - 0.05, 2), "gain": 0.4} for s in SC[1:]]
sfx += [{"name": "sparkle", "t": 0.3, "gain": 0.4}, {"name": "pop", "t": W("p1", "Run"), "gain": 0.35}]
for pid, cmd in (("p2", "secpolmsc"), ("p3", "tpmmsc"), ("p4", "verifier"), ("p5", "fsmgmtmsc"), ("p6", "sigverif")):
    sfx += [{"name": "tick", "t": W(pid, "Command", 0.1), "gain": 0.3}, {"name": "tick", "t": W(pid, "Command", 0.35), "gain": 0.3}, {"name": "pop", "t": W(pid, cmd, 0.05), "gain": 0.4}]
sfx += [{"name": "tick", "t": W("p7", "Press"), "gain": 0.4}, {"name": "sparkle", "t": W("p7", "Follow", -0.1), "gain": 0.4}]
mix = {"total": TOTAL, "music": [{"t0": 0.0, "t1": round(sc["s2"]["b"], 2), "mood": "hook"}, {"t0": round(sc["s2"]["b"], 2), "t1": round(sc["s7"]["b"], 2), "mood": "demo"}, {"t0": round(sc["s7"]["b"], 2), "t1": TOTAL, "mood": "result"}], "sfx": sorted(sfx, key=lambda c: c["t"])}
json.dump(mix, open(f"{D}/mix.json", "w"), indent=1)
print("total", TOTAL, {k: (v["b"], v["end"]) for k, v in sc.items()})
