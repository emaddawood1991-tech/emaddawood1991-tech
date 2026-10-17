#!/usr/bin/env python3
"""Spell-check visible carousel text. Usage: spellcheck.py texts.json  (list of {slide, text}).
Needs `pip install pyspellchecker`. Allow-list: assets/spell-allow.txt. Exit 1 on suspect words."""
import json, re, sys, pathlib
try:
    from spellchecker import SpellChecker
except ImportError:
    print("! spelling skipped (pip install pyspellchecker)"); sys.exit(0)
allow = {w.strip().lower() for w in (pathlib.Path(__file__).parent.parent / "assets" / "spell-allow.txt").read_text().split() if w.strip()}
sp = SpellChecker(); sp.word_frequency.load_words(allow)
bad = []
for item in json.load(open(sys.argv[1])):
    text = re.sub(r"[/`@#$<>\-\.]\S+|\S*[/_\\]\S*|\d+\S*", " ", item["text"])  # skip commands, paths, flags, handles, numbers
    words = [w.lower().strip("'’") for w in re.findall(r"[A-Za-z][A-Za-z'’]*", text)]
    for w in sp.unknown([w for w in words if len(w) > 1 and w not in allow]):
        bad.append((item["slide"], w, sorted(sp.candidates(w) or [])[:3]))
for s, w, c in bad: print(f"✗ slide {s}: possible typo “{w}” → {', '.join(c) or '?'}")
if not bad: print("✓ spelling: no suspect words")
sys.exit(1 if bad else 0)
