# OFFICIAL SOURCE VERIFICATION — My Robot Meets Claude Code (verified 2026-11-20)

| Claim in the video | How it was verified |
|---|---|
| Official repository is github.com/anthropics/skills | `git clone https://github.com/anthropics/skills` succeeded; HEAD `e4bb5d960d87` (2026-11-16); README states "Public repository for Agent Skills" content ("Skills are folders of instructions, scripts, and resources that Claude loads dynamically") |
| Install commands | README (verbatim): `/plugin marketplace add anthropics/skills` and `/plugin install example-skills@anthropic-agent-skills`. Marketplace name `anthropic-agent-skills` and plugin `example-skills` confirmed in `.claude-plugin/marketplace.json` |
| frontend-design, webapp-testing, skill-creator are part of example-skills | listed in marketplace.json `example-skills` skills array; folders and SKILL.md frontmatter read from the clone |
| What a skill is | docs page code.claude.com/docs/en/skills (captured with Playwright): "Skills extend what Claude can do. Create a SKILL.md file with instructions, and Claude adds it to its toolkit." |
| Install works | Executed for real: `claude plugin marketplace add anthropics/skills` → "Added marketplace: anthropic-agent-skills"; `claude plugin install example-skills@anthropic-agent-skills` → "Installed plugin ... (scope: user)"; `claude plugin list` → enabled, version e4bb5d960d87; the three skill folders exist. The terminal shows the **CLI form** of the in-app slash commands; the slash form is shown as text from the README. |

## Real demonstration (nothing scripted)
* Sample site: `site-before/index.html`, written by Agentoon (deliberately basic, NOT a real product), with one planted bug (order buttons update `#cart-total`, which does not exist).
* `claude -p` (Claude Code, isolated config, plugin installed) ran **frontend-design** (Skill tool call `frontend-design:frontend-design`, 42.5 s): redesigned the page AND fixed the bug on its own. Transcript: `data/cc/frontend-design.jsonl`. Before/after screenshots are real renders of both files (`data/shots/`).
* `claude -p` ran **webapp-testing** (`example-skills:webapp-testing`): it wrote and executed a Playwright script. Result (real, reproduced for the terminal capture): 13 checks, 9 PASS, 4 FAIL — the newsletter box accepts malformed emails `@`, `a@`, `@b`, `a b@c`. Console errors: none. Transcript: `data/cc/webapp-testing.jsonl`.

## Not shown for real / limits
* The interactive Claude Code window was not recorded (its folder-trust prompt needs the user's approval); headless runs and CLI commands are shown instead and labelled.
* The GitHub repo page is rendered from the real clone (GitHub's stylesheet host is not reachable from this sandbox), labelled "not a screenshot of the GitHub page".
* Claude logo: no official vector was reachable; the character body (v1 asked for the Claude spark) was replaced at your request by the chunky asterisk from your reference image. It is an original fan-style character, NOT an official Anthropic mascot. The official Claude Code favicon (code.claude.com) is stored in `data/claude-code-favicon-192.png` for reference.
* Skills do not guarantee a perfect site (said in the video).
