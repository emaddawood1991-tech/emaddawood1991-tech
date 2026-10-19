# Fact-check log — Claude Code skills toolkit (checked 2026-10-19)

## Reference video: NOT inspected
The video you mentioned was not provided in this session, so nothing here claims to come from it. I could identify only the two skills you named. The other two items ("an AI workflow-building platform" and "a collection of reusable Claude Code skills") are **unidentified**. Slide 6 and the cheat sheet use two *verified, official* alternatives (Anthropic's `skill-creator` plugin and `anthropics/skills`) instead. Send the video or the exact names and I will swap them in.

## Verified from primary sources (GitHub README files and Claude Code docs)

| Item | Claim | Source | Status |
|---|---|---|---|
| task-observer | Name "task-observer – One Skill to Rule Them All"; created and maintained by Eoghan Henn (rebelytics.com); repo `rebelytics/one-skill-to-rule-them-all` | README of that repo | Verified |
| task-observer | Meta-skill that watches your sessions and suggests improvements to your other skills; observes your corrections, gaps no skill covers, and its own blind spots | README | Verified |
| task-observer | Writes observations to `skill-observations/observation-log/`, proposed updates to `skill-updates/`; "The observer doesn't modify your installed skills"; nothing goes live until you install the updated bundle; a scheduled review applies only to staged copies | README | Verified |
| task-observer | Install: `npx skills add rebelytics/one-skill-to-rule-them-all --skill task-observer` (add `-g` for all projects) or copy to `.claude/skills/task-observer/` keeping `references/` and `scripts/`; Node needed for the CLI route; full bundle recommended; filesystem access for the full experience | README | Verified |
| task-observer | Description matching alone under-triggers: add the activation instruction from `references/environments.md` to CLAUDE.md or install the session-start hook; verify in a fresh session; check `skill-observations/checkpoints.log` for a recent "session-start scan" line | README + references/environments.md | Verified |
| task-observer | License CC BY 4.0 | README | Verified |
| task-observer | Type | A Claude skill (SKILL.md bundle), not a plugin or MCP server | Verified |
| impeccable | Design guidance for AI coding agents by Paul Bakaus; Apache 2.0; repo `pbakaus/impeccable` | README | Verified |
| impeccable | Commands run as `/impeccable <command> <target>` (craft, audit, polish, critique, …); `/impeccable init` records product context | README | Verified |
| impeccable | Install: `/plugin marketplace add pbakaus/impeccable` then install from `/plugin`; or `npx impeccable install` from the project root (`--providers=claude`); reload Claude Code afterwards; Node only for the npx installer; ships a standalone CLI | README | Verified |
| skill-creator | Official plugin: `/plugin install skill-creator@claude-plugins-official` (add the marketplace first with `/plugin marketplace add anthropics/claude-plugins-official` if not found) | Claude Code docs (Skills) | Verified |
| anthropics/skills | "Anthropic's implementation of skills for Claude": example skills, the Agent Skills spec, a template; `/plugin marketplace add anthropics/skills`; document skills are source-available | README | Verified |
| Locations | Personal `~/.claude/skills/<name>/SKILL.md` (all projects on this machine, not Cowork/cloud sessions); project `.claude/skills/<name>/SKILL.md`; plugin skills as `/plugin-name:skill-name`; `/reload-skills` after creating a new top-level skills directory | Claude Code docs (Skills) | Verified |
| Testing | `/skills` and "What skills are available?"; invoke with `/skill-name`; invoked skill content enters the conversation; `--debug` shows frontmatter parse errors | Claude Code docs (Skills, Troubleshooting) | Verified |

## Caveats
- **Hook headline:** "Can Improve Themselves" is your wording. task-observer *suggests* improvements and stages them; it does not change installed skills. Slide 1 carries a "You review every change" chip and slides 3–4 spell this out.
- **Forks:** other repos host copies of task-observer (for example Carefree-1991/claude-skills, iamneilroberts/claude-skills). This carousel links only to the original by Eoghan Henn.
- **Mock-ups:** the before/after UI on slide 5 is an illustrative mock-up, not an Impeccable output.
- **Counts and popularity** (stars, installs) are deliberately not shown; they change daily.
