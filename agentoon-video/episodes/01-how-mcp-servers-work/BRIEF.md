# Episode 01 · How MCP servers work

**Takeaway:** MCP is the standard plug between AI apps and your tools.
**Length:** 79 s (narration 77 s, 208 words, 162 wpm voice-only) · 1080×1920 · 30 fps · −15.1 LUFS · true peak −1.2 dBTP
**Story:** PROBLEM (N×M custom integrations) → DISCOVERY (MCP, host/client/server) → SOLUTION (tools/resources/prompts, JSON-RPC, stdio/HTTP) → REAL DEMO (real server, real wire messages, real `claude mcp add`) → RESULT (✓ Connected, CONNECTED stamp) → TAKEAWAY (standard plug) → signature ending.

## Visual concept: "The Blueprint Sheet" (new look, not Paper Switchboard)
Engineering drawing that draws itself. Dark ink hook → cyanotype blue (problem) → white drafting sheet (explanation, one continuous camera down four figures) → dark ink terminals (demo) → white sheet (result) → ink (takeaway) → navy ending. Blue + white line work only; the one red element is the CONNECTED stamp. Double-rule "drawing note" subtitles. Transitions: whip, sheet drop, push-through, whip, card grow, push-through. Style grammar from Lemo-Opuscar "Blueprint" (MIT); all code original.

## Robot acting plan
| Scene | Feeling | Looks at | Does | Reaction |
|---|---|---|---|---|
| Hook | curious → amazed | the result line | hops onto the terminal | "wow" take, then waves |
| Problem | uneasy → distressed | the tangle | stands among the lines | worried (hands on head, sweat, "!"), later thinks |
| MCP | relieved, confident | the badge | hops in, waves (introduce) | wow at "fixes that" |
| Host/client/server | explaining | host, client, server | points at each as named | blinks, nods |
| Primitives | explaining | each card | points at tools, resources, prompts | — |
| Transports | watching | packets left/right | looks along the pipes | thinks |
| Demo | focused | code, messages, result | introduces the server, thinks at the handshake, points at the tool name | celebrates at "eleven lines" |
| Result | proud | the terminal | points at the command | celebrates at the stamp |
| Takeaway | determined | the plug | aims at the plug | celebrates when it clicks in |
| Ending | warm | viewer | walks in, glows, waves | one CTA |

## Real demonstrations (all captured on the build machine, 2026-10-17)
- `demo/server.mjs`: 24-line MCP server, official `@modelcontextprotocol/sdk` 1.32.1 (MIT), tool `count_lines`.
- `demo/run-demo.mjs`: raw JSON-RPC client over stdio; `demo/transcript.jsonl` is the verbatim exchange. Result: `notes.txt has 11 lines` (`wc -l notes.txt` = 11).
- `claude mcp add count-lines -- node server.mjs` then `claude mcp list` → `count-lines: node server.mjs - ✓ Connected` (Claude Code 2.1.302, run in an isolated HOME so no user config was touched; the terminal printed a `√` glyph, the screen shows ✓).
- On-screen messages are exact substrings with `…` where trimmed; command lines are wrapped with `\`.

## Sources checked (official docs source, modelcontextprotocol/modelcontextprotocol @ 86f6e0c, 2026-10-14)
- "open-source standard for connecting AI applications to external systems" (`docs/2026-07-28/getting-started/intro.mdx`).
- Host creates one client per server; local servers use STDIO, remote use Streamable HTTP; JSON-RPC 2.0; tools / resources / prompts (`docs/2026-07-28/learn/architecture.mdx`).
- `claude mcp add` syntax: `claude mcp add --help`, Claude Code 2.1.302.

## Caveats
- The newest spec revision (2026-07-28) replaces `initialize` with `server/discover` and is stateless. The demo uses SDK 1.32.1 speaking protocol 2025-06-18, shown on screen. The narration says "asking who the server is and what it supports", true for both.
- The demo client is a script, not an AI app (stated on screen). Claude Code connection is shown separately.
- "4 apps × 4 tools = 16" is an illustration of the N×M problem, not a measured figure.
- Subtitle word times are estimated from phrase durations (Kokoro has no alignment). Voice was not auditioned by ear in this environment.
- Robot rig is rebuilt from the brand description; replace with canonical art when supplied.
