# Retention-first editing: hooks, pacing, story, narration

Design every video to keep viewers watching. Never use meaningless visual movement just to fill time.

## Hook (0–2 s)
- Show the **most impressive real result** or a **compelling problem** first. Result first, then explain how.
- Real footage or real interface, large and readable on a phone. No logo animation, no "Hi, welcome", no long introduction.
- Narration opens mid-thought with the payoff or the problem, within the first second.

Hook patterns:
1. **Result first:** the working outcome on screen, one line over it.
2. **Problem first:** the painful thing (error, cost, wasted hours) shown for real.
3. **Surprising number or claim, then proof** (only if verified).

## Story structure
**PROBLEM → DISCOVERY → SOLUTION → REAL DEMO → RESULT → TAKEAWAY**

| Beat | Job | Typical time (75 s video) |
|---|---|---|
| Hook (problem or result) | stop the scroll | 0–3 s |
| Problem | make the stakes clear | 3–10 s |
| Discovery | introduce the tool and why it matters | 10–20 s |
| Solution | how it works, one idea | 20–32 s |
| Real demo | install/connect and the genuine run | 32–58 s |
| Result | what you now have, verified | 58–68 s |
| Takeaway + ending | one sentence, signature CTA | 68–75 s |

The viewer must understand **why the tool matters before any installation command**. No list of disconnected features: every scene answers "so what?" for the one takeaway.

## Pacing
- Every **5–8 s**: a new discovery, demonstration, visual surprise or useful piece of information.
- Every **2–4 s**: a meaningful visual change (new camera position, reveal, close-up, UI state, robot reaction).
- Remove repetitive sentences and scenes that add no value. If a scene can be cut without losing the takeaway, cut it.
- Zoom into the line, row or badge being discussed instead of showing a whole desktop.
- Do not hold a static frame longer than the viewer needs to read it.

## Beat sheet template
```
Logline: <tool> lets you <result>, but <problem>, so <solution>.
Takeaway: <one sentence>
# | Time | Narration (words) | Visual / camera | Real footage? | Robot | New info?
```
Mark every row where something new appears. Gaps over 8 s without a new thing are a defect.

## Narration
- Confident, natural technology-creator voice. Energetic, not shouty.
- **About 155–170 words per minute.** Natural speech rhythm; no artificial dramatic pauses, no slow delivery.
- Continuous through scene transitions: **no silent gap > ~1 s**. Sections back-to-back (about 0.2 s).
- Short sentences, concrete nouns, verbs first. Say the tool's real name; spell acronyms how they sound only in the TTS text, not on screen.
- Write for the ear, then cut 10%. Repeat nothing.
- Free local TTS (Kokoro on-device, or edge-tts). No paid TTS without approval. Save word timings to drive the subtitles.
- Word budget: 60 s ≈ 155–170 words, 75 s ≈ 195–215, 90 s ≈ 235–255.

## Subtitles as part of retention
- Word-timed, kinetic, readable at phone size, style matched to the episode look.
- Break at sentence ends; merge spoken spellings into the real name ("dot A I" → `.ai`).
- Never cover code, URLs, buttons or results; reposition per scene if needed.

## Ending
One clear follow CTA with the signature ending (see `brand-guide.md`). Do not stack CTAs. The takeaway comes before the ending, and narration continues through the seam.

## Self-check before render
- Would I keep watching at second 3? At second 20? At second 45?
- Is there a new thing at least every 8 s?
- Can the whole video be summarised in the takeaway sentence?
- Is anything on screen only there to fill time? Remove it.

## When real metrics are provided (Instagram / TikTok)
Analyse only what the user provides:
- **Retention curve:** locate drops and map them to scenes and timestamps.
- **Average watch time vs. length; completion rate.**
- **Saves and shares:** which takeaways or scenes drove them.
- Compare with earlier episodes, then propose concrete changes (shorter intro, earlier result, tighter demo, bigger close-up, new ending timing).
- State sample size and uncertainty. Do not invent or extrapolate numbers. If no metrics are given, say there is nothing to analyse yet.
