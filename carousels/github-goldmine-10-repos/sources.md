# Sources & fact-check log — 10 GitHub repos carousel (checked 26 Nov 2026)

## What could NOT be done (read this first)
- **github.com pages and the GitHub API were not reachable for these repos.** The session proxy answered "GitHub access to this repository is not enabled for this session"; my `add_repo` request was **denied** by the permission classifier, so I did not work around it. Consequences:
  - **No star counts** (not verifiable → omitted from all slides, as required: "verify star counts or omit them").
  - **No Playwright screenshots of github.com pages.** Visuals are instead (a) real images from the repos' own READMEs, (b) README text re-typeset in a window frame and labelled "Excerpt", (c) concept diagrams labelled "Concept diagram / Not a screenshot".
  - Repo descriptions, licenses and install commands come from the **raw README / LICENSE files** (`raw.githubusercontent.com/<repo>/HEAD/…`), fetched 26 Nov 2026.
- Official project websites (ollama.com, langflow.org, scrapling docs, openhands.dev, browser-use.com) were unreachable (DNS/proxy), so nothing was taken from them. `assets.openhands.dev/screenshot/…` (OpenHands README screenshot) and the Langflow README's `github.com/user-attachments/…` image returned 403, so they are not used.
- Nothing was installed or run. No reference-creator image or post was used.

## Repo table (all from README/LICENSE)
| # | Repo (URL as supplied) | Type | License file | Purpose (README) | Requirements / pricing notes |
|---|---|---|---|---|---|
| 2 | https://github.com/public-apis/public-apis | Curated list | MIT | "manually curated by community members… extensive list of public APIs"; tables list API, Description, Auth, HTTPS, CORS | Listing only; each API has its own limits/terms. README opens with a sponsored **APILayer** section (commercial APIs) — not endorsed here. |
| 3 | https://github.com/punkpeye/awesome-mcp-servers | Curated list | MIT | "curated list of awesome Model Context Protocol (MCP) servers"; legend marks official, language, local/cloud | Servers you install and run yourself; hosted servers are in a separate list (awesome-remote-mcp-servers). README starts with an ad banner (ray.run) — not endorsed. |
| 4 | https://github.com/browser-use/browser-use | AI agent (library/CLI) | MIT | "The open-source browser agent. Give it a task and the model does it in a real browser" | Python ≥3.11. README default uses a **Browser Use Cloud API key** (model + cloud browser, paid usage; new signups get $1 credit per README); you can use your own LLM (ChatOpenAI/Anthropic/Google etc.). **Original Agentoon.ai selection** (fills the missing reference item #3). |
| 5 | https://github.com/Shubhamsaboo/awesome-llm-apps | App collection | Apache-2.0 | "100+ open-source AI agents, agent skills, and RAG apps… tested end-to-end" | Clone + `pip install -r requirements.txt` + `streamlit run travel_agent.py` (README quick start). Apps need model access; check each app's README. |
| 6 | https://github.com/sindresorhus/awesome | List of lists | CC0-1.0 (file `license`) | The index of "awesome" lists by topic (README "Contents") | Free; links out. |
| 7 | https://github.com/D4Vinci/Scrapling | Python framework | BSD-3-Clause | "Python Web Scraping framework… fast HTTP requests, stealth browsers, powerful parsing, concurrent crawling"; MCP server + Agent Skill | `pip install "scrapling[fetchers]"` then `scrapling install` (README). Scrape only where allowed; follow site terms (our caution, not from README). |
| 8 | https://github.com/ripienaar/free-for-dev | Curated list | **not verified** (no LICENSE file found at repo root) | "software (SaaS, PaaS, IaaS, etc.) and other offerings with free developer tiers" | Rules in README: must be a free tier, not just a free trial; ≥1 year if time-bucketed. Limits change — check provider. README says built by "1600+ people" (not shown on slide). |
| 9 | https://github.com/ollama/ollama | Software | MIT | "Start building with open models. Access the latest releases locally or in the cloud with complete privacy." | Install per README (script / dmg / exe / Docker). Local models need your own hardware. `ollama`, `ollama run gemma4`, `ollama launch claude` appear in README. We advise reading install scripts before running. |
| 10 | https://github.com/langflow-ai/langflow | Agent platform | MIT | "platform for building and deploying AI-powered agents and workflows… visual authoring experience and built-in API and MCP servers" | Python 3.10–3.14 + uv: `uv pip install langflow -U`, `uv run langflow run`; Langflow Desktop for Windows/macOS. |
| 11 | https://github.com/All-Hands-AI/OpenHands | Agent platform | MIT (LICENSE: "Copyright © 2025 OpenHands contributors") | README now describes **Agent Canvas**: "self-hosted developer control center for coding agents and automations"; runs OpenHands, Claude Code, Codex, Gemini, Pi, OpenCode or any ACP agent on local, remote and cloud backends | "Bring your own model"; README points to SELF_HOSTING.md for security hardening. README badges reference `OpenHands/OpenHands`, so the repo has likely moved orgs; the supplied URL still resolved on raw.githubusercontent.com. Could not confirm the canonical URL on github.com. |

## Visual sources (all downloaded as files only)
| Slide | Visual | Source |
|---|---|---|
| 2 | Weather table rows (7Timer!, AccuWeather, Aemet, AQICN) | public-apis README, "### Weather" (text re-typeset) |
| 3 | 2 server entries + legend | awesome-mcp-servers README (text re-typeset) |
| 4 | "How it works" loop | browser-use README (text re-typeset; step 3/4 split over lines) |
| 5 | 3 gallery graphics | https://raw.githubusercontent.com/Shubhamsaboo/awesome-llm-apps/HEAD/docs/gallery/{self-improving-agent-skills,ai-fraud-investigation,project-graveyard}.png — the repo's own README artwork, not UI screenshots (Apache-2.0 repo) |
| 6 | Awesome logo + Contents chips | https://raw.githubusercontent.com/sindresorhus/awesome/HEAD/media/logo.svg; README contents list (CC0) |
| 7 | Scrapling cover + code | https://raw.githubusercontent.com/D4Vinci/Scrapling/main/docs/assets/cover_dark.svg; README quick-start code (line-wrapped for fit) |
| 8 | GCP free-tier lines + rule | free-for-dev README "Major Cloud Providers" (limits can change) |
| 9 | Terminal | Ollama README commands |
| 10 | Logo + flow | https://raw.githubusercontent.com/langflow-ai/langflow/HEAD/docs/static/img/langflow-logo-color-blue-bg.svg; flow is a **concept diagram** |
| 11 | Agent/backends diagram | **concept diagram** built from README text |

## Honesty notes
- The reference post's "$40,000 saved per year" claim is **not used**; no savings figure appears anywhere.
- "Example" lines describe what the README says each tool does; nothing was run or tested.
- Compact slide wording simplifies README text; no star counts, version numbers or benchmark claims are shown.
