---
name: agentoon-diagrams
description: >-
  Technical storytelling diagrams for Agentoon.ai: MCP connection diagrams, animated data flows, API request/response visualisations, agent-to-agent communication, node graphs, network diagrams, workflow timelines. Use to explain how systems connect; every diagram is labelled as a diagram and never stands in as proof of a real connection.
argument-hint: <systems to connect and what flows between them>
allowed-tools: Read Edit Write Grep Glob Bash
---

# /agentoon-diagrams

A diagram explains a **verified** fact. Before drawing a connection, confirm it from an official source or a real run and note the source in `data/OFFICIAL-SOURCES.md`.

## Proof vs explanation (non-negotiable)
- `DIAGRAM · NOT A SCREENSHOT` chip (>= 28 px) on any explanatory graphic.
- Proof is a **real result** shown as text/recording with private data hidden: e.g. a connector answered `list_agents -> success, 2 agents` (episode 14 `REAL RESULT` card). A cable animation never proves a connection.
- Do not animate a "connected" state, success tick or data flow that did not happen; animate the *explanation* (what would flow) and keep status words neutral.

## Building blocks
- **Node:** rounded card 250-300 x 80-140, label 34-36 px, border 3 px (cyan on navy, navy on paper).
- **Cable / flow:** an 8 px bar with `transform-origin:0 50%` and `scaleX 0 -> 1` (plug-in), or SVG path with `stroke-dasharray:"14 12"` and `attr:{"stroke-dashoffset": 0 -> -104}` for a flowing line; travelling pulse = a 28 px dot moved with `x` and faded at the end (finite tweens only).
- **Request/response:** two pulses on a line: label above (`create_call`), response below (`status: success`) only when real.
- **Node graph:** place nodes on a grid; draw edges first (`stroke` draw-on 0.4 s), then nodes pop (`back.out`).
- **Workflow timeline:** vertical steps (rows) with a ring hopping per narrated word (see `/agentoon-motion`).
- **Layered architecture:** stack cards with 12 px parallax drift; highlight the layer being explained.

## Content standards
- Use official names and exact URLs/commands (`https://api.bland.ai/v1/mcp`, `claude mcp add --transport http ...`) copied from docs; keep different routes separate (web connector vs terminal).
- State limits that matter (permissions, billing, which clients support OAuth) as short chips from the docs.
- Build progressively on the narrated words; never show the full diagram before it is explained.

## Do not
Use logos you cannot obtain from an official site (use plain text names), invent protocol details, imply an integration is available on a plan/device without a source, or use decorative network art to fill time.

## Template: "A connects to B" (MCP-style) in HyperFrames/GSAP
```js
const a = card("CLAUDE", 40, 320), b = card("BLAND MCP", 390, 320), c = card("PHONE CALL", 740, 320);   // 300x140 cards
const cab1 = el(host, "c1", "", "left:340px;top:390px;width:50px;height:8px;background:#60CDFF;transform-origin:0 50%"); gsap.set(cab1, { scaleX: 0 });
tl.from(a, { opacity: 0, scale: .8, duration: .35, ease: "back.out(1.6)" }, tWordA);        // tWordA = time of the narrated word
tl.to(cab1, { scaleX: 1, duration: .3 }, tWordA + .3);                                       // cable draws on the word "connect"
tl.from(b, { opacity: 0, scale: .8, duration: .35, ease: "back.out(1.6)" }, tWordA + .5);
```
Remotion: nodes as `<div>` with `spring()` scale, cable width `interpolate(frame,[t0,t0+9],[0,50])`.

## Verification evidence card (the only "proof" shape)
`REAL RESULT · <system>` bordered green: three mono lines (`tool: list_agents`, `status: success`, `agents: 2 returned`) copied from the real tool output; hide names, ids, numbers, org. If the check could not run, show `NOT VERIFIED YET` in amber instead.

## Checklist before delivery
Every edge has a source; every label is official wording; route A (web connector) and route B (terminal) are visibly different cards; the diagram appears only after the narration introduces it; chips: `DIAGRAM · NOT A SCREENSHOT`.
