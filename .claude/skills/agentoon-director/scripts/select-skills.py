#!/usr/bin/env python3
"""Score an Agentoon.ai video brief and suggest which specialist skills to use. Deterministic keyword scoring: a starting point for /agentoon-director, which still applies judgement.
Usage: python3 select-skills.py "<brief text>" [--json]"""
import json, re, sys
ALWAYS = {"agentoon-robot": "presenter in every scene", "agentoon-audio": "narration, music, sound", "agentoon-qc": "final gate"}
RULES = {
 "agentoon-ui": (r"\b(tutorial|terminal|cli|github|repo|website|browser|app|software|settings|dashboard|login|sign[- ]?up|connector|screen|ui|dev tools|install|command|setup|how to|chatgpt|gemini|claude|tool|prompt)\b", "real software or web screens to show, zoom and highlight"),
 "agentoon-diagrams": (r"\b(mcp|api|webhook|agent|pipeline|workflow|connect(?:s|ion|ed)?|integration|server|protocol|oauth|data flow|network|call(?:s|ing)? (?:your )?phone|(?:system|software) architecture)\b", "two or more systems connect: build the flow on the narration"),
 "agentoon-morph": (r"\b(before[- ]and[- ]after|before/after|transform(?:ation|s)?|restore|upgrade|makeover|clean(?:s|ing)?\b|edit(?:ed|s)? (?:photo|image)|image (?:trick|edit)|compare|comparison|reveal|remove (?:the )?background|retouch)\b", "genuine before/after reveal"),
 "agentoon-3d": (r"\b(3d|blender|architect(?:ure|ural)?|building|tower|villa|walkthrough|fly[- ]?through|product (?:viz|visuali[sz]ation|shot)|render|interior|turntable|mascot|environment)\b", "form, space or depth is the subject"),
 "agentoon-camera": (r"\b(orbit|fly[- ]?through|walkthrough|dolly|cinematic|aerial|tracking|parallax|reveal|hero shot|product hero|city|landscape|tower)\b", "camera language beyond simple zooms"),
 "agentoon-motion": (r"\b(motion graphics?|kinetic|cards?|steps?|list|ui chrome|floating|premium|editorial|depth|layers?|explainer|tutorial|reel)\b", "layered, staggered movement for cards, steps and UI"),
 "agentoon-typography": (r"\b(title|captions?|subtitles?|numbers?|stats?|steps?|quote|headline|kinetic|text|how to|tutorial|list|ranking|tips?|\d+ (?:tricks|tips|steps|edits|ways))\b", "key phrases, steps and numbers need designed type"),
 "agentoon-transitions": (r"\b(scenes?|chapters?|montage|location change|time jump|multi[- ]scene|sequence|series|tour|walkthrough|journey|steps?)\b", "scene changes carried by an on-screen object (max two families)"),
}
def score(text):
    t = text.lower(); out = {}
    for k, (rx, why) in RULES.items():
        n = len(re.findall(rx, t))
        if n: out[k] = (n, why)
    return out
def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args: sys.exit(__doc__)
    brief = " ".join(args); sc = score(brief)
    # specialist selection: strongest signals first; cap total at 8 (3 always + 5 specialists), typography/motion only when they have independent signal
    ranked = sorted(sc.items(), key=lambda kv: -kv[1][0])
    chosen = [(k, v) for k, v in ranked if v[0] >= 1][:6]
    names = [k for k, _ in chosen]
    if "agentoon-ui" in names and "agentoon-3d" in names and sc["agentoon-3d"][0] < 2 and sc["agentoon-ui"][0] >= 2: chosen = [(k, v) for k, v in chosen if k != "agentoon-3d"]
    if "agentoon-3d" in [k for k, _ in chosen] and sc["agentoon-3d"][0] < 2 and not re.search(r"\b3d|blender|render|architect|tower|villa|walkthrough\b", brief.lower()): chosen = [(k, v) for k, v in chosen if k != "agentoon-3d"]
    res = {"specialists": [{"skill": k, "score": v[0], "why": v[1]} for k, v in chosen], "always": [{"skill": k, "why": w} for k, w in ALWAYS.items()]}
    res["total"] = len(res["specialists"]) + len(ALWAYS)
    if "--json" in sys.argv: print(json.dumps(res, indent=1)); return
    print("Brief:", brief[:160])
    print("Always:", ", ".join(ALWAYS))
    print("Specialists:", ", ".join(f"{s['skill']}({s['score']})" for s in res["specialists"]) or "none")
    for s in res["specialists"]: print(f"  - /{s['skill']}: {s['why']}")
    print("Total skills:", res["total"], "(cap 9). Apply judgement: drop any skill you cannot tie to a named scene.")
if __name__ == "__main__": main()
