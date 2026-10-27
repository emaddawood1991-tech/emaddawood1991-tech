#!/usr/bin/env python3
"""Ep 10 build: narration timings -> timeline.js, src/data.js (real transcript lines from blender/render.log), index.html, mix.json.
Usage: python3 build.py   (after `kit/py/build_audio.py tts episode.json`)"""
import json, re, os
D = os.path.dirname(os.path.abspath(__file__))
tm = json.load(open(f"{D}/audio/timing.json")); ph = {p["id"]: p for p in tm["phrases"]}
ORDER = [("s1","p1","start",0.0),("s2","p3","whip",0.5),("s3","p5","whip",0.5),("s4","p7","push",0.5),("s5","p9","whip",0.5),("s6","p11","whip",0.5),("s7","p13","whip",0.5),("s8","p15","iris",0.7)]
TOTAL = round(ph["p15"]["end"] + 0.7, 1)
sc = {}
for i, (k, first, typ, dur) in enumerate(ORDER):
    sc[k] = {"b": 0.0 if i == 0 else round(ph[first]["start"] - 0.08, 2), "type": typ, "dur": dur}
for i, (k, first, typ, dur) in enumerate(ORDER):
    nxt = ORDER[i + 1][0] if i + 1 < len(ORDER) else None
    sc[k]["start"] = sc[k]["b"]
    sc[k]["end"] = round((sc[nxt]["b"] + sc[nxt]["dur"] + 0.3) if nxt else TOTAL, 2)
    sc[k]["len"] = round(sc[k]["end"] - sc[k]["start"], 2)
open(f"{D}/timeline.js", "w").write("window.EP = " + json.dumps({"total": TOTAL, "wpm": tm["wpm"], "phrases": tm["phrases"], "words": tm["words"], "scenes": sc}) + ";\n")
# real transcript data: only text that was really printed/logged in this session
log = open(f"{D}/blender/render.log").read() if os.path.exists(f"{D}/blender/render.log") else ""
saved = re.findall(r"render\s+\| Saved: '([^']+)'", log)
def line(name):
    m = re.search(r"(\d\d:\d\d\.\d+)\s+render\s+\| Saved: '(renders/%s)'" % re.escape(name), log)
    return f"{m.group(1)}  render | Saved: '{m.group(2)}'" if m else None
data = {"version_cmd": "python -c \"import bpy;print(bpy.app.version_string)\"", "version_out": "5.2.3 LTS",
        "build_out": ["Info: Saved as \"property.blend\"", "saved 223 objects"], "blockout": line("hero_blockout.png"), "partial": line("hero_partial.png"), "final": line("hero_final.png"),
        "source": "version/build lines: terminal output of this session; render lines: blender/render.log"}
open(f"{D}/src/data.js", "w").write("window.DATA = " + json.dumps(data) + ";\n"); json.dump(data, open(f"{D}/data/transcript.json", "w"), indent=1)
t = open(f"{D}/src/index.template.html").read()
for k, v in sc.items(): t = t.replace("{{%s.start}}" % k, str(v["start"])).replace("{{%s.len}}" % k, str(v["len"]))
t = t.replace("{{s6.walk}}", str(round(sc["s6"]["start"] + 5.0, 2)))
t = t.replace("{{TOTAL}}", str(TOTAL)); assert "{{" not in t, re.findall(r"\{\{[^}]+\}\}", t)[:3]
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
print("scenes:", {k: (v["start"], v["end"]) for k, v in sc.items()}, "total", TOTAL, "cues", len(mix["sfx"]))
