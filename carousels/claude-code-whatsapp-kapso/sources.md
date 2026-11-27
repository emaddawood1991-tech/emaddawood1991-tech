# Sources & fact-check log — Claude Code + WhatsApp AI agent with Kapso (checked 27 Nov 2026)

## What could NOT be done (read first)
- **kapso.com, kapso.com/pricing, kapso.ai, docs.kapso.ai and app.kapso.ai are unreachable from this environment** (DNS fails). **NOT inspected.** Consequences:
  - **No pricing tiers or message limits appear on slide 9.** Showing numbers I could not verify would break the brief ("do not copy outdated pricing"). Slide 9 explains the four cost layers and the WhatsApp 24-hour rule, and points to the live pricing page. **Please paste the current plans or send a screenshot and I will add a tier table.**
  - Kapso's real logo files and web-app screenshots were not available. Brand marks are **simplified glyphs** (WhatsApp, Claude Code) and a plain "kapso" wordmark. Drop official SVGs into `assets/brand-whatsapp.svg`, `assets/brand-kapso.svg`, `assets/brand-claude-code.svg` and rebuild; they are used automatically.
- **Domain note:** the official repo README links **kapso.ai** and **app.kapso.ai** (API keys come from app.kapso.ai). Your brief says kapso.com. I could not check either, so slides avoid naming a domain except through the CLI/web-app wording.
- Nothing was installed or configured; no Kapso account, API key or WhatsApp number was touched.

## Verified from the official repo https://github.com/gokapso/agent-skills (raw files read 27 Nov 2026)
| Slide | Claim | Basis |
|---|---|---|
| 5 | Install: `npx skills add gokapso/agent-skills` | README "Installation" |
| 5 | Status: "Alpha: in active development and subject to rapid change" | README banner |
| 5 | Skills: **integrate-whatsapp** (connect WhatsApp, webhooks, send messages/templates, flows), **automate-whatsapp** (workflows, agents, functions, databases), **observe-whatsapp** (search logs, debug delivery, inspect webhook deliveries, triage errors, health checks) | README "Available skills" + SKILL.md descriptions. A 4th skill, `integrate-whatsapp-calling`, exists and is not covered. |
| 5, 6 | Skills = folders of instructions/scripts for agents; they do not run a bot | README "What are Agent Skills?" |
| 4 | Onboarding via CLI: `kapso setup` → hosted onboarding URL → confirm with `kapso whatsapp numbers list --output json`; defaults are dedicated number + provisioning; customer completes embedded (Meta) signup | integrate-whatsapp SKILL.md |
| 4 | Requirements depend on number/account type | our caveat (SKILL.md shows connection types/provisioning options) |
| 6 | `kapso login`, `kapso status` confirm access | SKILL.md "Setup" |
| 6 | Env vars `KAPSO_API_BASE_URL=https://api.kapso.ai`, `KAPSO_API_KEY` (key from app.kapso.ai); placeholder only, never a real key | README "Environment Variables" |
| 6 | `kapso whatsapp messages send --phone-number-id <ID> --to <wa-id> --text "Hello from Kapso"` | SKILL.md "Operate with the CLI first" (line-wrapped on slide) |
| 6 | Phone number ID discovered via `kapso whatsapp numbers list` / `resolve` | SKILL.md (slide omits `--output json`, which the docs show; the flag is optional as far as we can tell — **re-check**) |
| 6 | Webhook event `whatsapp.message.received`; phone-number-level webhooks for message events; payload v2 recommended | webhooks-reference.md |
| 6 | Signature: header `X-Webhook-Signature` = HMAC-SHA256(secret, raw body) hex; verify before processing | webhooks-reference.md |
| 7 | Workflow node types: `agent`, `decide`, `function`, `webhook`, `handoff`, `send_text`, `send_template`, `wait_for_response`… | automate-whatsapp references/node-types.md |
| 7 | Handoff event exists: `workflow.execution.handoff` | webhooks-reference.md |
| 9 | Interactive messages need an active **24-hour** session window; outside it use **templates**; templates have approval status | integrate-whatsapp SKILL.md |

## Not verified / our own framing
- **Calendar, booking database, FAQ, human support** (slides 2, 3, 7): the skills document functions, webhook tools and agent tools but **no built-in calendar connector**. The slides present these as integrations you configure (function/webhook/server). Labelled "needs setup".
- **Reminders** are described as approved template messages (supported by the template docs); reminder scheduling is your own configuration.
- "Claude Code builds and configures it; a deployed Kapso workflow or your own server runs it" is an architectural statement based on how Agent Skills work (README) — not a quoted claim.
- **Meta messaging fees, AI model usage, hosting costs** (slide 9): stated generically; amounts depend on Meta's current rate card, your model provider and your hosting. No numbers shown.
- Slide 8 chat and calendar are **illustrative** (labelled), not output from a real run. "Demo data."
