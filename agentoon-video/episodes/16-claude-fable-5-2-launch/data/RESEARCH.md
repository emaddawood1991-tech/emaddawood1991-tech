# 1. VERIFIED RESEARCH SUMMARY — Claude Fable 5.2 (read 2026-11-10)
Sources: anthropic.com/claude-fable-and-mythos-5-2 (full text saved in `ann.html.txt`), platform.claude.com/docs/en/models/fable-5-2/overview (`doc.html.txt`), and a real Claude Code run (`claude-code-fable-run.jsonl`).

| Brief claim | Verdict | Evidence |
|---|---|---|
| Announced Nov 9, 2026 | CONFIRMED | Page dateline "November 9, 2026". |
| Better coding, reasoning, vision, complex technical work | CONFIRMED | "improvements in areas like coding, reasoning, and vision"; docs: "demanding reasoning and long-horizon agentic work". |
| Long-running agentic engineering | CONFIRMED | Docs: "agent sessions that run for hours"; OS experiment (below). |
| OS experiment | CONFIRMED, wording corrected | "one Anthropic engineer gave Fable 5.2 the task… Starting from an empty folder, the model coordinated over 1,000 subagents, working around the clock for eight days… working operating system that boots on a laptop… core, drivers (disk, keyboard, network), permanent file storage, windows, a login screen, an installer, built-in Claude functionality". Not a one-prompt result; video says so. |
| Robotics demos | CONFIRMED | "robots controlled by Fable 5.2 completing a variety of tasks, including solving a puzzle cube, unscrewing a bottle cap, and drawing a picture of a robot." RoboDojo Sim (simulated): 64.9% at Max effort. |
| Model ID `claude-fable-5-2` | CONFIRMED | Docs + page; also AWS `anthropic.claude-fable-5-2`. |
| 1M context, 128K max output | CONFIRMED | Docs spec box: 1M tokens / 128K tokens; $8 / $40 per MTok. Real run reported contextWindow 1,000,000, maxOutputTokens 128,000. |
| Fable vs Mythos | CONFIRMED | "the same underlying model. Fable has strong cybersecurity and biology safeguards… available to all users"; Mythos 5.2 via Cyber / Life Sciences Verification Programs. |
| Availability | CONFIRMED, qualified | "available today on all platforms" (AWS, Google Cloud, Azure); promo: eligible paid plans get extra Fable usage. Not "free for everyone". |
| Extra facts used on screen | up to 30% faster than Fable 5.1, lower price ($8/$40). |
Not used (unverified or off-topic): benchmark claims, Fermat's Last Theorem, physics results.

claude.ai: HTTP 403 from this sandbox (login/bot wall); code.claude.com/docs: 302 only. Neither was captured.
