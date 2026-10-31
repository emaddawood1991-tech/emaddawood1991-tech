# OFFICIAL WEBSITES & VERIFIED FACTS · Ep 14 "I Connected Claude to My Phone Using MCP!"

## How each source was checked (2026-10-30)
| Source | Checked how | Result |
|---|---|---|
| Bland MCP docs (docs.bland.ai: MCP overview, Sign in with Bland / OAuth, Claude Code client, tool reference list) | Read in full **through the Bland MCP connector that is connected in this session** (`search_bland_docs`, `get_bland_doc`) | Verified. The sandbox cannot open docs.bland.ai, www.bland.ai or api.bland.ai directly (network policy), so there are **no website recordings** of Bland |
| Claude custom connectors help article https://support.claude.com/en/articles/11175166-... | Fetched live from the sandbox (HTTP 200); text saved in `data/claude-support-article-snapshot.txt` | Verified. The captured page was unstyled (stylesheets blocked), so only its text is used on screen, labelled "verbatim" |
| Claude Code MCP docs https://code.claude.com/docs/en/mcp | Fetched live (HTTP 200) | Reachable; the `claude mcp add --transport http ...` form is confirmed by Bland's own Claude Code page |
| claude.ai (Settings/Customize), Bland sign-up, bland.ai pages, bland.ai/integrations/mcp, bland.ai/blog/claude-phone-number | Not reachable here / need the owner's accounts | **Not verified, not shown.** Page names from the brief are used only as targets for recording |
| Remotion, Blender, Pexels | Not needed for the verified story | Not used (Remotion not installed here; edit done in HyperFrames) |
| Reference video `1000287064.mp4` | Not among the session uploads | **Not received, not studied**; the storyboard in the brief was followed |

## Verified facts used in the video (and their source)
- Official MCP URL: `https://api.bland.ai/v1/mcp`; remote server hosted by Bland, "nothing to run locally"; transport Streamable HTTP (Bland docs, MCP overview)
- Sign in at `v2.app.bland.ai` with phone number, Google or SSO; choose an organization; consent screen lists permissions; uncheck "Create and change your agents" for read-only (Bland docs, OAuth)
- Placing calls needs the "Place phone calls (billed to this org)" permission (`calls:create`); tools `create_call`, `wait_for_call`, `stop_call`, `get_call_log` (Bland docs, OAuth + overview). Clients should keep their tool-approval prompts on
- Claude web route: "Navigate to Customize > Connectors", "Click + Add then Add custom connector", name, remote MCP URL, Continue, review authentication settings, Continue (Claude help article). Bland's page words it "Settings → Connectors": menu wording varies by version
- Claude Code route: `claude mcp add --transport http bland https://api.bland.ai/v1/mcp` then `claude mcp login bland` (Bland docs, Claude Code page). Kept separate from the web route
- **Live verification in this session:** the Bland connector is connected here; `list_agents` returned `success` with 2 agents (names, ids and org details deliberately not shown)

## NOT performed (do not claim)
- No Bland account was created or signed in by this production; no Claude connector screen was recorded; no call was placed; no credits or plan were bought; no scheduled/recurring call exists (the "morning call" concept is not implemented).

## MUST RECORD (exact shots to make it FINAL)
1. bland.ai homepage -> sign-up / start-building entry -> sign-in (dashboard with private data hidden).
2. The MCP page on bland.ai (and/or docs.bland.ai/integrations/mcp/overview) with the URL `https://api.bland.ai/v1/mcp` highlighted.
3. claude.ai -> Customize -> Connectors -> + Add -> Add custom connector -> name "Bland AI" -> paste URL -> Continue (screens as they are today).
4. Bland sign-in and consent screen (organization choice, permissions) and the connected state in Claude.
5. In Claude: ask it to list your Bland agents (result visible).
6. Optional, only with the owner's explicit approval, the owner's own number and credits: one short test call; screen of the phone ringing, answer screen and Bland's call result. No call evidence may be staged.
7. Optional: terminal recording of the two Claude Code commands.

## Added in v2 (hook graphic)
- Claude icon: official favicon from https://support.claude.com/favicon.ico (94x94 PNG, saved as `assets/claude-mark-source-94px.png`, upscaled in `assets/claude-mark.png`). Used in the hook graphic (Claude -> Bland MCP cloud -> phone, labelled "CONCEPT VISUAL · NOT A REAL CALL") and in the "Claude -> Bland MCP -> Phone call" flow.
- Real Bland website footage still missing (bland.ai hosts unreachable here). `capture_bland.js` is ready to capture the real pages once the hosts are allowed, or the owner's screen recordings can be used.
