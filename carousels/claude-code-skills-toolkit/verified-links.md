# Verified GitHub links and install commands (checked 2026-10-19)

| Tool | Type | Repository | Install / use |
|---|---|---|---|
| task-observer (by Eoghan Henn) | Claude skill (full bundle: SKILL.md + references/ + scripts/) | https://github.com/rebelytics/one-skill-to-rule-them-all | `npx skills add rebelytics/one-skill-to-rule-them-all --skill task-observer` (add `-g` for all projects) · or copy to `.claude/skills/task-observer/` |
| impeccable (by Paul Bakaus) | Design skill with plugin installer and a standalone CLI | https://github.com/pbakaus/impeccable | `/plugin marketplace add pbakaus/impeccable`, then install via `/plugin` · or `npx impeccable install` · use: `/impeccable init`, `/impeccable audit blog`, `/impeccable polish settings` |
| skill-creator | Official Anthropic plugin | https://github.com/anthropics/claude-plugins-official/tree/main/plugins/skill-creator | `/plugin install skill-creator@claude-plugins-official` |
| anthropics/skills | Official skill collection + Agent Skills spec | https://github.com/anthropics/skills | `/plugin marketplace add anthropics/skills`, then `/plugin install example-skills@anthropic-agent-skills` |

Skill folders: personal `~/.claude/skills/<name>/SKILL.md` · project `.claude/skills/<name>/SKILL.md` · run `/reload-skills` after creating a new top-level skills folder · check with `/skills`.

Not included (could not be identified without the reference video): the "AI workflow-building platform" and the unnamed skills collection.
