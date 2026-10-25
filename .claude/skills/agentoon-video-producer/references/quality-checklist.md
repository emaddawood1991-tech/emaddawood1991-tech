# Agentoon.ai Video Quality Checklist

This is the production quality standard for every new Agentoon.ai video. It is the user's checklist and rules, kept in their wording. Do not weaken it. Tick each item before moving on, and report any item that fails.

Permanent principle: **SAME BRAND. DIFFERENT VISUAL EXPERIENCE. EVERY VIDEO.**

## Before rendering — verify

- [ ] **Strong first two seconds:** the most impressive real result or a compelling problem is on screen within 0–2 s.
- [ ] **A clear educational takeaway:** one sentence, stated in the video.
- [ ] **Accurate GitHub links and installation commands:** copied from the real repo and tested.
- [ ] **Authentic demonstrations:** real terminal, GitHub pages, dashboards and results. Nothing fabricated; time-lapses and simulations labelled.
- [ ] **Distinctive visual direction:** a new concept, not the previous episode's template (check the style ledger in `creative-direction.md`).
- [ ] **Expressive robot acting:** an acting plan per scene; the robot reacts to real software results.
- [ ] **Energetic continuous narration:** about 155–170 wpm, no long pauses.
- [ ] **Professional subtitles and sound:** synchronized kinetic subtitles; carefully mixed music; subtle SFX.
- [ ] **Readable mobile interfaces:** commands, GitHub pages and results large enough for a phone.
- [ ] **Correct Agentoon.ai branding:** original robot, logo, wordmark.
- [ ] **A concise signature ending:** one clear follow CTA.
- [ ] **Alive, not attractive-only:** diagrams build progressively, nothing appears fully formed; no dead holds; a burst of motion about every 3 s (see section 12).
- [ ] `npx hyperframes lint` and `check` are clean (or the project's equivalent).

## 1. Pre-production research and story planning
- [ ] Tool researched from primary sources; every technical claim verified and sourced; limits and trade-offs stated honestly; prices accurate.
- [ ] Explains what the tool does, why it matters, how to install or connect it, and shows a genuine working demonstration.
- [ ] Story: PROBLEM → DISCOVERY → SOLUTION → REAL DEMO → RESULT → TAKEAWAY. The audience understands why the tool matters before watching installation commands. Not a list of disconnected features.
- [ ] Length 60–90 s, maximum 1:50 (short tests about 15 s).

## 2. Retention-first scripting and energetic narration
- [ ] 0–2 s: most impressive real result or compelling problem. Show the result early, then explain how.
- [ ] Every 5–8 s: a new discovery, demonstration, visual surprise or useful piece of information.
- [ ] Meaningful visual change every 2–4 s.
- [ ] No long introductions, no unnecessary explanations, no repetitive sentences or scenes that add no value.
- [ ] Confident, natural technology-creator voice at about 155–170 words per minute. Natural speech rhythm, not artificial dramatic pauses.
- [ ] No silent gap longer than about one second; narration flows through scene transitions.
- [ ] Never use meaningless visual movement just to fill time.

## 3. Unique creative direction for every video
- [ ] New visual concept: background, typography treatment, animation language, camera movement, subtitle style and transitions chosen for the topic.
- [ ] Not an animated PowerPoint and not a plain screen recording: premium motion graphics, camera movements, layered interfaces, creative reveals, smooth transitions that support the explanation.
- [ ] Light and dark backgrounds alternate according to the topic.

## 4. Robot acting and original Agentoon.ai branding
- [ ] The robot actively participates: natural reactions, expressions, gestures and interactions with software interfaces. Not standing in the corner.
- [ ] Per scene: what is it feeling, what is it looking at, what is it doing, how does it react to the software result.
- [ ] Expressive timing, anticipation, reactions. Original appearance and personality preserved.
- [ ] Original logo, robot and signature ending; one clear follow CTA.

## 5. Real technical demonstrations
- [ ] Real GitHub pages, commands, software interfaces and authentic results.
- [ ] Important UI elements get close-up shots instead of showing an entire desktop.
- [ ] No API keys, setup codes, passwords or personal email visible.

## 6. HyperFrames and compatible animation tools
- [ ] Tools confirmed installed and working before use; licences and API costs checked.
- [ ] HyperFrames is the primary engine; Lemo Opuscar for creative direction; character-animation components for the robot.
- [ ] No paid services or APIs invoked without explicit approval. OneTake code/assets not used; Gemini collage workflow not used.

## 7. Subtitle and sound design
- [ ] Synchronized kinetic subtitles; never cover important code or interface details; inside safe areas.
- [ ] Small sound effects matched to meaningful actions; whooshes, glitches and loud impacts used sparingly.
- [ ] Subtle music changes between discovery, demonstration and result.
- [ ] Voiceover clearly above music and effects.
- [ ] Loudness checked; final mix does not clip.

## 8. Mobile-first visual quality (inspect at actual phone-screen size)
- [ ] Commands readable. Subtitles do not overlap important software.
- [ ] Text inside platform-safe areas.
- [ ] Important UI receives close-ups. No overcrowded scenes.
- [ ] Contrast checked on both bright and dark backgrounds.

## 9. Technical video quality (see `technical-validation.md`)
- [ ] 1080×1920 MP4, H.264, yuv420p, AAC audio, constant frame rate (24 or 30 fps).
- [ ] Duration within range; audio present; no silence gaps > ~1 s; loudness about −15 LUFS; true peak ≤ −1 dBTP.

## 10. Review of the actual rendered MP4 (after rendering)
- [ ] Narration speed (measured wpm), silent gaps, mobile readability, technical accuracy, robot acting, animation quality, spelling, branding.
- [ ] Contact sheets viewed at every scene and every seam; phone-size sheet viewed.
- [ ] Significant problems corrected and re-rendered to a new filename before presenting.
- [ ] Working project files and reusable components organized (one folder per episode, shared kit).

## 11. Analytics-based improvements (only with real metrics)
- [ ] When the user provides Instagram or TikTok metrics: analyse retention, average watch time, completion rate, saves and shares; map drop points to scenes; propose concrete changes for future videos.
- [ ] Do not invent analytics. If no metrics were provided, say so.

## 12. Motion and liveliness (from `reference-analysis.md`)
- [ ] **Fresh direction:** one hero technique, one carrier, one transition family and one environment arc chosen for this topic; not the previous episode's combination.
- [ ] **Progressive build:** every diagram, list, wire and collage assembles piece by piece, each piece timed to its narrated word (±0.1 s).
- [ ] **Real UI at readable size:** crops of real pages, sessions or logs, zoomed to the narrated detail, with a drawn-on highlight, held ≥ 1 s, then released. No whole-desktop shots.
- [ ] **Camera has intent:** continuous moves carried by something on screen (cable, scroll, zoom-through, growing shape); motion blur on fast moves; slow push-in or parallax drift during holds.
- [ ] **Layered frame:** environment, UI card with depth (tilt or shadow), robot and chips, hero type; no large empty zone next to small content; light and dark environments alternate.
- [ ] **Hero typography moment** in the hook or the key claim (giant number or word that moves, is struck, swaps or sits behind the subject).
- [ ] **Authenticity chips** on every real capture; trimmed or sped-up footage labelled.
- [ ] **Robot works on the interface** in every scene (perch, peek, press, pull, climb, point, react), not only beside it.
- [ ] **Motion profile passes** (`scripts/motion-profile.sh`): mean energy ≥ 4, alive time ≥ 55 %, no static stretch ≥ 2.5 s before the last 3 s, no gap between motion bursts longer than about 3 s. Compare with the reference bar in `reference-analysis.md`.
- [ ] **Subtitles:** word-block karaoke mechanic (active word in a filled block or equivalent), below all UI and code.

- [ ] **No placeholders** (`scripts/no-placeholders.sh`): no PLACEHOLDER/PREVIEW chips, every slot verified, every on-screen number traceable to `data/` (see `real-demo-standard.md`).
- [ ] **Zoom/crop safe:** camera zooms keep all text inside the frame; subtitles never cover text, UI or code.
- [ ] **CTA:** Outro with "Follow @agentoon.ai" + "Real AI Tools • Skills • Automation".

## Delivery note template
```
Video: <path>   (1080x1920, <fps> fps, <duration>)
Concept: <one line>   Takeaway: <one line>
Checks: wpm <n>, loudness <LUFS>, true peak <dBTP>, longest silence <s>, motion mean <n>, longest burst gap <s>
Sources: <links>
Unverified / simulated: <list or "none">
```

## Final QC (added: required before any video is called FINAL; see final-approval-gate.md)
**Visual:** no placeholders/missing-footage labels; real software shown (not mock-ups passed as recordings); consistent branding, robot acts in each scene; no large empty zones; no clipped/overlapping text; transitions clean; no moving light sweeps.
**Technical accuracy:** every command/URL/number verified against the official page or a local run; official URLs listed in `data/OFFICIAL-SOURCES.md`; no secrets/emails; labels truthful.
**Audio:** ~-15 LUFS, true peak <= -1 dBTP, no clipping; voice above music; no silent gap > ~1 s; SFX match on-screen actions.
**Mobile:** `scripts/mobile-check.sh` frames reviewed at 360x640; commands readable and fully inside safe areas; captions not over commands (see mobile-readability.md).
**Storytelling:** hook in 0-3 s shows the real result; narration matches visuals beat for beat; one point at a time; one takeaway; single follow CTA.
**Gate:** `scripts/final-gate.sh` passes; `data/QC-REPORT.md` filled in; exported MP4 actually inspected.
