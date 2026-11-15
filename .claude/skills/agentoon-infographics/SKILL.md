---
name: agentoon-infographics
description: >-
  Agentoon.ai Remotion animated diagrams: MCP/API connection diagrams with flowing data dots along bezier lines, node networks, timelines, process steps,
  morphing software comparison cards, animated arrows and callouts. Use to explain how systems connect, step order, or compare two tools.
  Type /agentoon-infographics.
---

# /agentoon-infographics

Code: `agentoon-video/remotion-fx/src/fx/infographics.tsx`. Demo: showcase S07 (MCP diagram) and S08 (morphing comparison).

| Component | Props | Effect |
|---|---|---|
| `McpDiagram` | `start,client,server,tools[]` | nodes spring in; lines draw on; request dots flow down, result dots flow back |
| `FlowLine` / `NodeBox` | `pts(4 bezier points),start,color,dots,speed,back` | building blocks for any connection diagram |
| `NodeNetwork` | `count,seed` | deterministic node graph, edges draw on, pulses travel |
| `Timeline` | `events[{label,sub}]` | vertical line draws, milestones spring in |
| `ProcessSteps` | `steps[]` | stacked steps joined by animated arrows |
| `ComparisonMorph` | `a,b,rows[{label,a,b}],start,dur` | name text-morphs, bars interpolate, accent colour crossfades (values are ILLUSTRATIVE: say so) |
| `AnimatedArrow` | `from,to,label` | curved arrow draws on with arrowhead and label |

Rules: label concept diagrams CONCEPT DIAGRAM; never present an animation as proof of a real connection; real logos/screenshots for named products (see /agentoon-logo-motion).
