#!/usr/bin/env python3
"""Ep 13 build: audio/timing.json -> index.html (from src/index.template.html), mix.json. Usage: python3 build.py"""
import json, re, os
D = os.path.dirname(os.path.abspath(__file__))
tm = json.load(open(f"{D}/audio/timing.json")); ph = {p["id"]: p for p in tm["phrases"]}; TOTAL = tm["total"]
SC = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11"]; first = {s: next(p for p in tm["phrases"] if p["scene"] == s) for s in SC}
sc = {}
for i, s in enumerate(SC): sc[s] = {"b": 0.0 if i == 0 else round(first[s]["start"] - 0.1, 2)}
for i, s in enumerate(SC):
    sc[s]["start"] = sc[s]["b"]; sc[s]["end"] = round(sc[SC[i + 1]]["b"] + 0.6, 2) if i + 1 < len(SC) else TOTAL; sc[s]["len"] = round(sc[s]["end"] - sc[s]["start"], 2)
secs = "\n".join(f'  <section id="{k}" class="clip scene" data-start="{v["start"]}" data-duration="{v["len"]}"><div id="{k}i" class="inner"></div></section>' for k, v in sc.items())
from PIL import Image
ARS = {f: round(Image.open(f"{D}/assets/shots/{f}").size[0] / Image.open(f"{D}/assets/shots/{f}").size[1], 4) for f in sorted(os.listdir(f"{D}/assets/shots"))}
t = open(f"{D}/src/index.template.html").read()
for key, val in (("{{SECTIONS}}", secs), ("{{SCENES}}", json.dumps(sc)), ("{{TOTAL}}", str(TOTAL)), ("{{ARS}}", json.dumps(ARS))): t = t.replace(key, val)
assert "{{" not in t; open(f"{D}/index.html", "w").write(t)
def W(pid, w, off=0.0):
    p = ph[pid]
    for x in tm["words"]:
        if p["start"] - 0.001 <= x["s"] <= p["end"] and re.sub(r"[.,:!?\"']", "", x["w"]).lower() == w.lower(): return round(x["s"] + off, 2)
    raise KeyError((pid, w))
sfx = [{"name": "whoosh", "t": round(sc[s]["b"] - 0.05, 2), "gain": 0.4} for s in SC[1:]]
sfx += [{"name": "pop", "t": round(0.6 + i * 0.38, 2), "gain": 0.32} for i in range(7)] + [{"name": "sparkle", "t": W("p1", "ArtCraft"), "gain": 0.4},
        {"name": "tick", "t": W("p2", "Windows"), "gain": 0.4}, {"name": "tick", "t": W("p2", "Linux"), "gain": 0.4}, {"name": "pop", "t": W("p2b", "launcher"), "gain": 0.4},
        {"name": "pop", "t": W("p3", "layered"), "gain": 0.4}, {"name": "tick", "t": W("p3b", "PSD"), "gain": 0.4},
        {"name": "pop", "t": W("p4", "vector"), "gain": 0.4}, {"name": "tick", "t": W("p4b", "Pathfinder"), "gain": 0.4},
        {"name": "tick", "t": W("p5", "timeline"), "gain": 0.4}, {"name": "tick", "t": W("p5b", "scopes"), "gain": 0.4},
        {"name": "pop", "t": W("p6", "libraries"), "gain": 0.4}, {"name": "tick", "t": W("p6b", "curves"), "gain": 0.4},
        {"name": "pop", "t": W("p7", "motion"), "gain": 0.4}, {"name": "tick", "t": W("p7b", "keyframes"), "gain": 0.4},
        {"name": "tick", "t": W("p8", "viewing"), "gain": 0.4}, {"name": "tick", "t": W("p8", "organizing"), "gain": 0.4}, {"name": "tick", "t": W("p8", "splitting"), "gain": 0.4},
        {"name": "pop", "t": W("p9", "page"), "gain": 0.4}, {"name": "tick", "t": W("p9b", "spread"), "gain": 0.4},
        {"name": "pop", "t": W("p10", "evolving"), "gain": 0.4}, {"name": "pop", "t": W("p10b", "pre-alpha"), "gain": 0.45}, {"name": "sparkle", "t": W("p11", "follow", -0.1), "gain": 0.4}]
mix = {"total": TOTAL, "music": [{"t0": 0.0, "t1": round(sc["s2"]["b"], 2), "mood": "hook"}, {"t0": round(sc["s2"]["b"], 2), "t1": round(sc["s7"]["b"], 2), "mood": "demo"}, {"t0": round(sc["s7"]["b"], 2), "t1": TOTAL, "mood": "result"}], "sfx": sorted(sfx, key=lambda c: c["t"])}
json.dump(mix, open(f"{D}/mix.json", "w"), indent=1)
print("total", TOTAL, {k: (v["b"], v["end"]) for k, v in sc.items()})
