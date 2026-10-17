# Agentoon.ai — MoneyPrinterTurbo script templates

Vertical 9:16 shorts for TikTok / Instagram Reels. Paste each block into the matching MoneyPrinterTurbo field.
Rules: fact-check every claim against official docs before generating. No invented numbers, versions, or features. Label anything beta/paid/needs setup.

## Global settings (WebUI)

| Setting | Value |
|---|---|
| Aspect | 9:16 (1080x1920) |
| Clip mode | Sequential, max clip duration 3 s |
| Language / voice | English: `en-US-AndrewNeural` or `en-US-AvaNeural` · Arabic: `ar-AE-HamdanNeural` (voiceover only) |
| Voice rate | 1.05–1.1 |
| Subtitles | On, bottom third (position ~72%), font bold sans, size 60, white text, stroke `#0C1020`, stroke width 2 |
| Background music | Low volume (0.15) or none |
| Length target | 30–45 s (90–130 words) |
| Search terms | English, 5–8 terms, generic visuals (Pexels has no AI-product footage) |
| Credit (caption) | `Footage: Pexels` |

Brand palette (for end-card / cover in Canva): Ink `#0C1020` · Paper `#F5F0E6` · Coral `#FF6A3D` · Mint `#2FE3B2`.
Style: smart, calm, beginner-friendly but exact. Hook in first 2 s. One idea per video. No hype words ("insane", "game-changer").

## Structure (every video)

1. **Hook** (0–3 s): one clear promise or surprising claim.
2. **Problem** (3–8 s): what goes wrong without it.
3. **Core** (8–32 s): 3 short points, one sentence each.
4. **Caveat** (32–38 s): what it is, what setup it needs.
5. **CTA** (last 4 s): "Follow @agentoon.ai for more."

---

## Template 1 — Explainer: "What is X?"

**Video Subject:** What is [TOPIC] in plain English

**Script:**
```
[TOPIC] in under 40 seconds.
Most people use AI tools without knowing what happens underneath.
Here is the simple version.
[TOPIC] is [one-sentence definition from official docs].
It works in three steps. First, [step 1]. Second, [step 2]. Third, [step 3].
The catch: [limit, cost, or setup requirement].
Now you know what [TOPIC] actually does.
Follow Agentoon dot A I for more.
```

**Search terms:** `person typing on laptop, code on computer screen, abstract digital network, server room lights, futuristic technology, hands using smartphone, data visualization`

**Example (fill-in):** TOPIC = MCP servers. Verify the definition at modelcontextprotocol.io before use.

---

## Template 2 — Tip: "One thing that saves hours"

**Video Subject:** One [TOOL] tip that saves time

**Script:**
```
Stop doing [slow task] by hand.
Here is a [TOOL] trick that takes ten seconds.
Step one: [exact command or action].
Step two: [exact command or action].
Step three: [result you get].
It is [built-in / a plugin / paid / beta], and it needs [setup].
Try it on your next task.
Save this and follow Agentoon dot A I.
```

**Search terms:** `developer working at desk, typing keyboard close up, coding screen dark, clock time lapse, focused programmer, laptop night office`

---

## Template 3 — Myth vs fact

**Video Subject:** Myth about [TOPIC]

**Script:**
```
Myth: [common wrong belief].
Fact: [correct statement, sourced].
Here is why people get this wrong.
[Reason 1 in one sentence].
[Reason 2 in one sentence].
So the right way is to [practical advice].
Did this change how you think about [TOPIC]?
Follow Agentoon dot A I for AI explained simply.
```

**Search terms:** `thinking person close up, question mark abstract, lightbulb idea, man looking at laptop surprised, crossing out paper, chalkboard writing`

---

## Template 4 — 3 mistakes

**Video Subject:** 3 mistakes beginners make with [TOOL]

**Script:**
```
Three mistakes beginners make with [TOOL].
Mistake one: [mistake]. Instead, [fix].
Mistake two: [mistake]. Instead, [fix].
Mistake three: [mistake]. Instead, [fix].
Fix these and your results improve right away.
Which one did you make?
Follow Agentoon dot A I.
```

**Search terms:** `frustrated programmer laptop, error screen computer, warning sign red, person correcting notes, checklist pen, success handshake office`

---

## Template 5 — Tool vs tool

**Video Subject:** [A] vs [B]: which should you use

**Script:**
```
[A] or [B]? Here is the quick answer.
Use [A] when [specific situation].
Use [B] when [specific situation].
[A] costs [verified price or free tier]. [B] costs [verified price or free tier].
My pick for beginners: [pick], because [one reason].
Comment which one you use.
Follow Agentoon dot A I for more.
```

**Search terms:** `two paths road split, balance scale abstract, comparing two screens, person choosing, laptop and phone side by side, tech workspace`

---

## Arabic voiceover variant (voiceover Arabic, English search terms)

**Video Subject (Arabic):** ما هو [الموضوع] ببساطة

**Script:**
```
[الموضوع] في أقل من أربعين ثانية.
كثيرون يستخدمون أدوات الذكاء الاصطناعي دون أن يعرفوا كيف تعمل.
إليك الشرح المبسط.
[الموضوع] هو [تعريف في جملة واحدة].
يعمل في ثلاث خطوات. أولاً، [خطوة ١]. ثانياً، [خطوة ٢]. ثالثاً، [خطوة ٣].
لكن انتبه: [قيد أو شرط إعداد].
تابع Agentoon للمزيد.
```
Keep search terms in English. Set subtitle language to match the script, or turn subtitles off if Arabic rendering looks wrong.

---

## Pre-publish checklist

- [ ] Every command/name/limit checked against official docs
- [ ] Hook visible in first 2 s, subtitles readable on phone
- [ ] No Pexels clip that looks unrelated to the line it plays under
- [ ] Caption: 1-line hook, 3 bullets, `Follow @agentoon.ai`, `Footage: Pexels`, 5–8 hashtags
- [ ] API keys stay in local `config.toml` (gitignored), never in this repo
