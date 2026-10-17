# Install agentoon-carousel

**Use in this repo (project skill):** already at `.claude/skills/agentoon-carousel/`. Loads in sessions in this repository once the folder is on the branch you work from (merge it to `main` for it to appear everywhere in this repo, including cloud sessions).

**Use in every project on your computer (personal skill):**

```bash
git clone <this repo> && cd <repo>          # or open your existing clone
bash .claude/skills/agentoon-carousel/scripts/install-personal.sh          # copy
bash .claude/skills/agentoon-carousel/scripts/install-personal.sh --link   # or symlink (stays in sync with the repo)
```

Installs to `~/.claude/skills/agentoon-carousel/` (or `$CLAUDE_CONFIG_DIR/skills/…`). Start a new Claude Code session (or run `/reload-skills`), then:

```
/agentoon-carousel How MCP servers work
```

Needs: Node 18+, Playwright with Chromium (`npm i -g playwright && npx playwright install chromium`), `zip`, and optionally `pip install pyspellchecker` (`scripts/setup.sh` checks all of it).

Personal skills do **not** load in Cowork or cloud sessions. For those, keep the skill committed in the repo's `.claude/skills/` on the default branch.
