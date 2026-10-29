#!/usr/bin/env python3
"""Ep 11 build: narration timings -> timeline.js, index.html (from src/index.template.html), mix.json, data/clips.json.
Usage: python3 build.py   (after build_audio.py tts + make_lipsync.py)"""
import json, re, os
D = os.path.dirname(os.path.abspath(__file__))
tm = json.load(open(f"{D}/audio/timing.json")); ph = {p["id"]: p for p in tm["phrases"]}
ORDER = [("s1", "p1"), ("s2", "p2"), ("s3", "p3"), ("s4", "p4"), ("s5", "p5"), ("s6", "p6"), ("s7", "p7"), ("s8", "p8"), ("s9", "p9")]
TOTAL = round(ph["p9"]["end"] + 0.7, 1)
sc = {}
for i, (k, first) in enumerate(ORDER): sc[k] = {"b": 0.0 if i == 0 else round(ph[first]["start"] - 0.08, 2)}
for i, (k, first) in enumerate(ORDER):
    sc[k]["start"] = sc[k]["b"]; sc[k]["end"] = round(sc[ORDER[i + 1][0]]["b"] + 0.45, 2) if i + 1 < len(ORDER) else TOTAL
    sc[k]["len"] = round(sc[k]["end"] - sc[k]["start"], 2)
open(f"{D}/timeline.js", "w").write("window.EP = " + json.dumps({"total": TOTAL, "wpm": tm["wpm"], "phrases": tm["phrases"], "words": tm["words"], "scenes": sc}) + ";\n")
t = open(f"{D}/src/index.template.html").read()
for k, v in sc.items(): t = t.replace("{{%s.start}}" % k, str(v["start"])).replace("{{%s.len}}" % k, str(v["len"]))
t = t.replace("{{TOTAL}}", str(TOTAL)); assert "{{" not in t, re.findall(r"\{\{[^}]+\}\}", t)[:3]
open(f"{D}/index.html", "w").write(t)
def res(a, off=0.0):
    if a.startswith("S:"): return round(sc[a[2:]]["b"] + off, 2)
    if ":" in a:
        pid, w = a.split(":"); p = ph[pid]
        for x in tm["words"]:
            if p["start"] - 0.001 <= x["s"] <= p["end"] and re.sub(r"[.,:!?\"]", "", x["w"]).lower() == w.lower(): return round(x["s"] + off, 2)
        raise KeyError(a)
    if a.endswith(".end"): return round(ph[a[:-4]]["end"] + off, 2)
    return round(ph[a]["start"] + off, 2)
cues = json.load(open(f"{D}/cues.json"))
mix = {"total": TOTAL, "music": [{"t0": round(res(m["from"], m.get("fo", 0)), 2), "t1": round(res(m["to"], m.get("to_off", 0)), 2), "mood": m["mood"]} for m in cues["music"]],
       "sfx": [dict({k: v for k, v in c.items() if k not in ("at", "off")}, t=res(c["at"], c.get("off", 0))) for c in cues["sfx"]]}
json.dump(mix, open(f"{D}/mix.json", "w"), indent=1)
os.makedirs(f"{D}/data", exist_ok=True)
def cuts(k, words, off=-0.15):
    pts = [sc[k]["start"]] + [res(w, off) for w in words] + [sc[k]["end"]]
    return [round(pts[i + 1] - pts[i], 3) for i in range(len(pts) - 1)]
json.dump({"v2": sc["s2"]["len"], "v5": sc["s5"]["len"], "v6": sc["s6"]["len"], "v7": sc["s7"]["len"], "v9": sc["s9"]["len"],
           "v6_cuts": cuts("s6", ["p6:palm"], -0.2), "v7_cuts": cuts("s7", ["p7:office", "p7:apartment", "p7:penthouse"])}, open(f"{D}/data/clips.json", "w"), indent=1)
print("scenes:", {k: (v["start"], v["end"]) for k, v in sc.items()}, "total", TOTAL, "sfx", len(mix["sfx"]))
