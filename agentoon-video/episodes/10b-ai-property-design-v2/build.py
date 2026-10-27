#!/usr/bin/env python3
"""Ep 10b (85 s) build: narration timings -> timeline.js, index.html, mix.json, data/lipsync.json.
Usage: python3 build.py   (after `kit/py/build_audio.py tts episode.json`)"""
import json, re, os
D = os.path.dirname(os.path.abspath(__file__))
tm = json.load(open(f"{D}/audio/timing.json")); ph = {p["id"]: p for p in tm["phrases"]}
ORDER = [("s1","p1","start",0.0),("s2","p2","whip",0.5),("s3","p4","whip",0.5),("s4","p5","push",0.5),("s5","p6","whip",0.5),("s6","p7","whip",0.5),("s7","p8","whip",0.5),("s8","p9","whip",0.5),("s9","p11","iris",0.7)]
TOTAL = round(ph["p11"]["end"] + 0.7, 1)
sc = {}
for i, (k, first, typ, dur) in enumerate(ORDER):
    sc[k] = {"b": 0.0 if i == 0 else round(ph[first]["start"] - 0.08, 2), "type": typ, "dur": dur}
for i, (k, first, typ, dur) in enumerate(ORDER):
    nxt = ORDER[i + 1][0] if i + 1 < len(ORDER) else None
    sc[k]["start"] = sc[k]["b"]
    sc[k]["end"] = round((sc[nxt]["b"] + sc[nxt]["dur"] + 0.3) if nxt else TOTAL, 2)
    sc[k]["len"] = round(sc[k]["end"] - sc[k]["start"], 2)
open(f"{D}/timeline.js", "w").write("window.EP = " + json.dumps({"total": TOTAL, "wpm": tm["wpm"], "phrases": tm["phrases"], "words": tm["words"], "scenes": sc}) + ";\n")
t = open(f"{D}/src/index.template.html").read()
for k, v in sc.items(): t = t.replace("{{%s.start}}" % k, str(v["start"])).replace("{{%s.len}}" % k, str(v["len"]))
t = t.replace("{{s8.orb}}", str(round(sc["s8"]["start"] + 2.4, 2))).replace("{{TOTAL}}", str(TOTAL))
assert "{{" not in t, re.findall(r"\{\{[^}]+\}\}", t)[:3]
open(f"{D}/index.html", "w").write(t)
def res(a, off=0.0):
    if a.startswith("S:"): return round(sc[a[2:]]["b"] + off, 2)
    if ":" in a:
        pid, w = a.split(":"); p = ph[pid]
        for x in tm["words"]:
            if p["start"] - 0.001 <= x["s"] <= p["end"] and re.sub(r"[.,:!?]", "", x["w"]).lower() == w.lower(): return round(x["s"] + off, 2)
        raise KeyError(a)
    if a.endswith(".end"): return round(ph[a[:-4]]["end"] + off, 2)
    return round(ph[a]["start"] + off, 2)
cues = json.load(open(f"{D}/cues.json"))
mix = {"total": TOTAL, "music": [{"t0": round(res(m["from"], m.get("fo", 0)), 2), "t1": round(res(m["to"], m.get("to_off", 0)), 2), "mood": m["mood"]} for m in cues["music"]],
       "sfx": [dict({k: v for k, v in c.items() if k not in ("at", "off")}, t=res(c["at"], c.get("off", 0))) for c in cues["sfx"]]}
json.dump(mix, open(f"{D}/mix.json", "w"), indent=1)
# clip lengths the compositor needs (seconds each Blender shot must fill) -> data/clips.json, used by mkclips.sh
clips = {"hook": sc["s1"]["len"], "build": sc["s4"]["len"], "car": sc["s5"]["len"], "garden": sc["s6"]["len"], "interior": sc["s7"]["len"]}
json.dump(clips, open(f"{D}/data/clips.json", "w"), indent=1)
open(f"{D}/data/lipsync.js", "w").write("window.LIPSYNC = " + open(f"{D}/data/lipsync.json").read() + ";\n")
print("scenes:", {k: (v["start"], v["end"]) for k, v in sc.items()}, "total", TOTAL, "cues", len(mix["sfx"])); print("clip lengths", clips)
