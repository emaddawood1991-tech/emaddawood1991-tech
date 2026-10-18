# Episode 02 · "I Made Claude Code Find 100 Potential Clients in Dubai" (Vibe Prospecting)

**Status: PRE-PRODUCTION ONLY. Blocked at the approval gate (sign-in, credits, network). No demo has been run, no data exists, nothing is mocked.**

## 1. Verified facts (official repo `explorium-ai/vibeprospecting-plugin`, HEAD `ca43f6d`, read 2026-10-18)
- Built by Explorium; product site vibeprospecting.ai. "GTM data plugin for Claude Code, Claude Cowork, Claude Chat, OpenAI Codex, OpenClaw"; live B2B data (README: 150M+ companies, 800M+ professionals).
- **Install command is unchanged and correct:** `/plugin install vibe-prospecting@claude-plugins-official` (README + `docs/install-claude-code.md`). Restart Claude Code if the skill does not appear.
- **Already installed on this account:** `vpai@synced` 0.1.107 (path `.../synced/.../vibe-prospecting`), license MIT. Nothing was installed.
- **CLI step per workflow (platform guide `skills/vibe-prospecting/platforms/claude-code.md`):** `npm install -g @vibeprospecting/vpai@latest` at the start of each workflow (npm latest 0.1.105, MIT), then:
  `vpai login` (prints a URL; the user approves in the browser) → `vpai login --poll` → `vpai whoami` (exit 0 = ready) → `vpai --help`. Credentials stored in `~/.config/vpai/config.json`. An API-key route exists (`vpai config --api-key`); never show keys on screen.
- **Workflow rules from the guide:** read each tool's schema first (`vpai <tool> --all-parameters`); use `autocomplete` for controlled vocab (`linkedin_category`, `city_region`, `job_title`...); optional `fetch-entities-statistics` (gives the real universe size); **Sample Gate:** by default run the *complete* chain on exactly **5 entities**, show them as a sample, and wait for approval before full scale (`/skip_sample` skips it). After a full run the final `csv_path` is copied to the working folder.
- **Capabilities:** company search, contact discovery by role/seniority, company/contact matching, enrichment, events/signals, CSV/JSON output. **No Excel export is documented**; an .xlsx would be built locally from the CSV.
- **Limits that affect the claims:** location filters match **headquarters only** (Dubai-HQ'd companies, not branches); `job_title` is substring match (combine with `job_level`); work emails/phones are available only "where available" (README: "email availability varies"); the README output example has a `confidence` field, but the real column set is unknown until a real run.
- **Credits/pricing: not stated anywhere in the repo or plugin docs I could read** (the README says only "your account permissions" and the sample gate protects "quota"). Pricing page vibeprospecting.ai is unreachable from this sandbox, so costs are **unverified**.
- **Security note from the README:** data is subject to Explorium's data terms; do not put raw API keys in prompts or exports.

## 2. Why production stopped
1. **Sign-in required** (browser approval of a Vibe Prospecting account). Only the account owner can approve; I will not handle credentials.
2. **Credits unknown.** Even the 5-entity sample consumes account quota. Needs your explicit approval.
3. **Network:** `vibeprospecting.ai` and `explorium.ai` return no connection from this cloud sandbox (policy denial). A live session cannot run here until those hosts (and the API host the CLI actually uses, shown by the first `vpai login`) are allowed under the cloud environment's Network access, **or** the session is recorded on your own machine.
4. **Privacy:** a public video must not display real individuals' names, emails or phone numbers unmasked (see section 4).

## 3. Needed from the real run (and nothing else may appear on screen as a result)
Sample table (5 rows), stats universe count, final record count N, CSV path, columns present, per-field fill rates, credit cost shown by the tool, the exact prompt and tool output. The video shows **N, whatever it is**.

## 4. Claim and storyboard corrections to the brief (to keep it truthful)
- Scene 5: say Claude queries **Vibe Prospecting's B2B database (Explorium)** through the plugin/CLI; do not imply Claude browsed websites.
- Scene 4/5 map: Dubai filter is HQ-based; label it "HQ in Dubai".
- Scene 6: show contact fields only as masked placeholders (`j***@company.ae`, `+971 •• ••• 1234`) and job titles generically; company names, domains and counts may be shown. Show "Not available" where the data is empty. Confirm Explorium's data terms allow publishing before showing any real person-level data.
- Scene 7: show the real CSV and its real row count; build the Excel from that CSV, label it a local conversion.
- Scene 3: show `/plugin` status (already installed) or the real install, then `vpai whoami` OK. Hide the login URL token and any key.
- No outreach, no email sending, no contacting prospects.
- The "ONE AI WORKFLOW / 100" hero must resolve to the real N ("100" → "N" replace animation), never a fake 100.

## 5. Fresh direction (not Paper Switchboard, not Blueprint)
Concept **"Night Ops"**: an AI sales-intelligence mission. Hero technique: giant `100` that is struck and replaced by the real number. Carrier: a glowing data stream from a Dubai-emirate outline to table rows. Transition family: iris + zoom-through + vertical blur. Environment arc: dark ops room → city-light map → light spreadsheet → gradient → navy ending. Map geometry: Natural Earth admin-1 (public domain) for the Dubai emirate outline, no invented agency logos. Robot acts as the "agent" (receives mission card, presses ENTER, rejects/approves rows by stamping, celebrates the export). Single "+ Follow Agentoon.ai" ending.

## 6. Draft narration (about 215 words ≈ 80–95 s; numbers in [brackets] are filled from the real run)
"What if Claude Code could find your next hundred clients? This is Vibe Prospecting, an open plugin from Explorium that connects Claude Code to a live business database. Install it with one command, sign in to your account, and check you're connected. Now give Claude a mission: real estate agencies in Dubai that sell apartments or serve property investors. Before it spends anything, it shows a five-company sample and tells you the credit cost. The database holds [stats] matching companies. Claude searches it, filters the matches, and checks them against your criteria. Then it finds decision-makers: titles, company domains, and professional contact details where they exist. Where they don't, the field says not available. Duplicates are removed. Then everything lands in a spreadsheet: [N] companies, [M] with a named decision-maker, [K] with a business email. Not a hundred. The real number. Instead of starting every search from scratch, you get a structured list to research and qualify. Find companies. Discover contacts. Export leads. Would you use this to find your next clients? Follow Agentoon.ai for more real AI tutorials."
(Final wording, timings and any claim about credits are written only after the real run.)

## 7. Deliverables when unblocked
Final MP4 (new filename), narration script, storyboard, verified install steps (section 1), GitHub source, the real lead count, QC report (`validate-render.sh`, `motion-profile.sh`, phone sheet, seams).
