# OctoGent

OctoGent is a single-file agent skill that coordinates five complementary Claude Code tools:

1. Find Skills
2. Superpowers
3. Claude Mem
4. Impeccable
5. Task Observer

## Download and upload

Download [OctoGent.md](./OctoGent.md), then upload it directly in **Claude Settings → Capabilities → Skills**. No ZIP is required.

The canonical skill entrypoint is [SKILL.md](./SKILL.md). Both files contain the same validated skill definition with the safe internal identifier `octogent`.

## What it does

- Routes discovery requests to Find Skills
- Applies planning, testing, review, and completion discipline through Superpowers
- Uses Claude Mem for approved cross-session context
- Applies Impeccable to frontend design and quality work
- Uses Task Observer to propose workflow improvements for human review

## Privacy

Do not place credentials, patient information, employee records, or confidential client data in memory or observation logs. Confirm before enabling persistent services or hooks.

## Official sources

- Find Skills: https://github.com/vercel-labs/skills/tree/main/skills/find-skills
- Superpowers: https://github.com/obra/superpowers
- Claude Mem: https://github.com/thedotmack/claude-mem
- Impeccable: https://github.com/pbakaus/impeccable
- Task Observer: https://github.com/rebelytics/one-skill-to-rule-them-all
