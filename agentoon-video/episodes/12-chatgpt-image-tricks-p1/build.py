#!/usr/bin/env python3
"""Ep 12 build: effects.json + sources/results folders + audio timing -> index.html, mix.json.
A trick's real photo = sources/NN.(jpg|jpeg|png|webp), real ChatGPT result = results/NN.(png|jpg|jpeg|webp).
Anything missing renders as a clearly labelled PENDING panel; the final gate (final-gate.sh + data/QC-REPORT.md) must fail while any is missing."""
import json, os, re, glob
D = os.path.dirname(os.path.abspath(__file__))
tm = json.load(open(f"{D}/audio/timing.json")); ph = {p["id"]: p for p in tm["phrases"]}
E = json.load(open(f"{D}/data/effects.json"))["effects"]; TOTAL = 105.0
ORDER = [("hook", 0.0), ("explain", 5.0)] + [(f"t{i:02d}", 10.0 + 5 * (i - 1)) for i in range(1, 16)] + [("montage", 85.0), ("cta", 97.0)]
sc = {}
for i, (k, b) in enumerate(ORDER):
    nb = ORDER[i + 1][1] if i + 1 < len(ORDER) else None
    sc[k] = {"b": b, "start": b, "end": round(nb + 0.6, 2) if nb is not None else TOTAL}; sc[k]["len"] = round(sc[k]["end"] - sc[k]["start"], 2)
def find(folder, n):
    for ext in ("png", "jpg", "jpeg", "webp"):
        f = f"{folder}/{n:02d}.{ext}"
        if os.path.exists(f"{D}/{f}"): return f
    for f in sorted(glob.glob(f"{D}/{folder}/{n:02d}-*")): return os.path.relpath(f, D)
    return None
TR = []
for e in E:
    p = e["prompt"]; first = re.split(r"(?<=[.!?])\s", p)[0]; ex = first + (" …" if len(first) < len(p) else "")
    TR.append({"n": e["n"], "label": e["label"], "excerpt": ex, "src": find("sources", e["n"]), "res": find("results", e["n"]), "g": 0 if e["n"] <= 5 else (1 if e["n"] <= 10 else 2)})
secs = "\n".join(f'  <section id="{k}" class="clip scene" data-start="{v["start"]}" data-duration="{v["len"]}"><div id="{k}i" class="inner"></div></section>' for k, v in sc.items())
t = open(f"{D}/src/index.template.html").read()
for key, val in (("{{SECTIONS}}", secs), ("{{TRICKS}}", json.dumps(TR)), ("{{SCENES}}", json.dumps(sc)), ("{{TOTAL}}", str(TOTAL))): t = t.replace(key, val)
assert "{{" not in t; open(f"{D}/index.html", "w").write(t)
def W(pid, w, off=0.0):
    p = ph[pid]
    for x in tm["words"]:
        if p["start"] - 0.001 <= x["s"] <= p["end"] and re.sub(r"[.,:!?\"]", "", x["w"]).lower() == w.lower(): return round(x["s"] + off, 2)
    raise KeyError((pid, w))
sfx = []
for k, v in sc.items():
    if k != "hook": sfx.append({"name": "whoosh", "t": round(v["b"] - 0.05, 2), "gain": 0.4})
for i in range(1, 16):
    b = sc[f"t{i:02d}"]["b"]; sfx += [{"name": "tick", "t": round(b + 0.08, 2), "gain": 0.4}, {"name": "type", "t": round(b + 0.7, 2), "dur": 1.1, "cps": 22, "gain": 0.25}, {"name": "whoosh", "t": round(b + 2.0, 2), "gain": 0.35}, {"name": "sparkle", "t": round(b + 3.0, 2), "gain": 0.3}]
sfx += [{"name": "pop", "t": round(86.0 + j * 0.4, 2), "gain": 0.35} for j in range(15)] + [{"name": "tick", "t": W("p01", "built-in"), "gain": 0.45}, {"name": "pop", "t": W("p01", "copy"), "gain": 0.4}, {"name": "sparkle", "t": 98.4, "gain": 0.4}]
mix = {"total": TOTAL, "music": [{"t0": 0.0, "t1": 10.0, "mood": "hook"}, {"t0": 10.0, "t1": 85.0, "mood": "demo"}, {"t0": 85.0, "t1": 105.0, "mood": "result"}], "sfx": sorted(sfx, key=lambda c: c["t"])}
json.dump(mix, open(f"{D}/mix.json", "w"), indent=1)
miss = [(e["n"], "photo" if not TR[e["n"] - 1]["src"] else None, "result" if not TR[e["n"] - 1]["res"] else None) for e in E]
print("scenes", len(sc), "| real photos", sum(1 for x in TR if x["src"]), "/15 | real results", sum(1 for x in TR if x["res"]), "/15 | sfx", len(sfx))
