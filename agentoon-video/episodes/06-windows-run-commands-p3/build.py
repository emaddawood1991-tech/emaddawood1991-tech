#!/usr/bin/env python3
"""Episode 06 build: narration timings + slots -> timeline.js, slots.js, index.html (from index.template.html) and mix.json.
Usage: python3 build.py            (after `python3 ../../kit/py/build_audio.py tts episode.json` if the script text changed)
Scene windows and subtitles follow the narration; swapping placeholders for real results needs only data/slots.json."""
import json, re, os
D = os.path.dirname(os.path.abspath(__file__))
ep = json.load(open(f"{D}/episode.json")); tm = json.load(open(f"{D}/audio/timing.json")); sl = json.load(open(f"{D}/data/slots.json"))
ph = {p["id"]: p for p in tm["phrases"]}
ORDER = [("s1", "p0", "start", 0.0), ("s2", "p1", "whip", 0.5), ("s3", "p2", "whip", 0.5), ("s4", "p3", "whip", 0.5), ("s5", "p4", "whip", 0.5), ("s6", "p5", "iris", 0.7)]
TOTAL = round(tm["total"] + 0.5, 1)
sc = {}
for i, (k, first, typ, dur) in enumerate(ORDER):
    b = 0.0 if i == 0 else round(ph[first]["start"] - 0.08, 2)
    sc[k] = {"b": b, "type": typ, "dur": dur}
for i, (k, first, typ, dur) in enumerate(ORDER):
    nxt = ORDER[i + 1][0] if i + 1 < len(ORDER) else None
    lead = 0.5 if typ == "cardGrow" else 0.0               # carrier covers the frame first, scene starts under it
    sc[k]["start"] = round(sc[k]["b"] + lead, 2)
    sc[k]["end"] = round((sc[nxt]["b"] + sc[nxt]["dur"] + 0.3) if nxt else TOTAL, 2)
    sc[k]["len"] = round(sc[k]["end"] - sc[k]["start"], 2)
open(f"{D}/timeline.js", "w").write("window.EP = " + json.dumps({"total": TOTAL, "wpm": tm["wpm"], "phrases": tm["phrases"], "words": tm["words"], "scenes": sc}) + ";\n")
open(f"{D}/slots.js", "w").write("window.SLOTS = " + json.dumps({"banner": sl["preview_banner"], **sl["slots"]}) + ";\n")
t = open(f"{D}/src/index.template.html").read()
for k, v in sc.items():
    t = t.replace("{{%s.start}}" % k, str(v["start"])).replace("{{%s.len}}" % k, str(v["len"]))
t = t.replace("{{TOTAL}}", str(TOTAL))
assert "{{" not in t, re.findall(r"\{\{[^}]+\}\}", t)[:3]
open(f"{D}/index.html", "w").write(t)
# audio cues: anchors are phrase ids ('p3'), 'p3.end', 'p3:word', or scene boundary 'S:s4', plus offset
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
