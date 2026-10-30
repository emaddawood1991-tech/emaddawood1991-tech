# QC + production report · Ep 14 "I Connected Claude to My Phone Using MCP!" · status: PREVIEW (NOT FINAL)

File: `final/bland-claude-mcp-PREVIEW.mp4`: 80.0 s, 1080x1920, 30 fps, H.264 + AAC, -15.1 LUFS, true peak -1.4 dBTP, no silence gap >= 1 s, narration ~160 wpm (HyperFrames check: 0 errors).

## What was actually demonstrated (and what was not)
| Brief item | Status |
|---|---|
| Official MCP URL `https://api.bland.ai/v1/mcp` | VERIFIED from Bland's docs (read through the connected Bland MCP) and shown verbatim |
| Claude web route (Customize > Connectors > + Add > Add custom connector > name > URL > Continue > review auth > Continue) | VERIFIED from the live Claude help article; shown as verbatim text, **not** as a recording of claude.ai |
| Bland sign-in (phone number / Google / SSO), organization choice, permissions / read-only option | VERIFIED from Bland docs; text only, **not recorded** |
| Claude Code route (`claude mcp add --transport http bland ...`, `claude mcp login bland`) | VERIFIED from Bland docs; shown as a separate optional card, not run |
| Connection verification | REAL: the Bland connector in this session answered `list_agents` -> success, 2 agents (names/ids hidden). Shown as a text result, not a screen recording |
| Real Bland website footage, registration flow, dashboard | **NOT DONE**: bland.ai / docs.bland.ai unreachable from the sandbox; sign-up needs the owner's account. Labelled on screen "NOT RECORDED YET" |
| Real Claude settings footage | **NOT DONE** (needs the owner's claude.ai session) |
| Real test call (incoming call, answer, result) | **NOT DONE**: needs the owner's approval, own number and Bland credits. The video says so ("TEST CALL · NOT PLACED IN THIS VIDEO"); the ringing phone in the hook is labelled "CONCEPT VISUAL · NOT A REAL CALL" |
| Morning/scheduled call | Not implemented, not claimed |

## Checklist
- PASS no keys, tokens, phone numbers, emails or org details on screen; no fake UI, terminal output or call evidence; no purchase or call made
- PASS original robot with lip-sync; points at the URL and cards; reacts (wow on the ring, nod, celebrate on "connected")
- PASS mobile: chips >= 28 px, text 34-46 px, captions in the caption band
- PASS voiceover is original; reference video not used (not received)
- PASS safety statements: approval, own number, credits, "MCP is the connection, Bland bills the calls", keep tool approvals on
- NOTE storyboard line "I'll ask Claude to call my own phone, say a short message and end the call" was replaced with the verifiable "ask Claude to list your Bland agents" because no call was authorised
- NOT USED Remotion (not installed), Blender, Pexels, Shotcut; edit in HyperFrames; only text/diagram visuals plus the robot

## FAIL (why PREVIEW)
Real website/Claude recordings and the authorised test call are missing; see MUST RECORD in `data/OFFICIAL-SOURCES.md`. Motion: mostly card build-ons and ring hops; not profiled against the motion benchmark.
