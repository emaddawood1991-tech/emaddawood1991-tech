---
name: agentoon-data-flow
description: >-
  Agentoon.ai Remotion technical explainer for MCP and AI-agent workflows: static workflow becomes nodes appearing in sequence, animated connection lines, labelled data packets
  moving along the lines, and a highlighted API path. Type /agentoon-data-flow <workflow description>. (Components shared with /agentoon-infographics.)
argument-hint: <nodes and edges, e.g. "Claude -> MCP server -> GitHub, Files">
allowed-tools: Read Write Edit Bash(npx remotion *) Bash(bash *)
---

# /agentoon-data-flow

Code: `remotion-fx/src/fx/infographics.tsx` (`DataFlow`, `FlowLine`, `NodeBox`, `McpDiagram`). Demo `D08` (static input version = `DataFlow static`).

## Do this when invoked
1. List nodes (id, label, sub, x, y) and edges (from, to, packet label); choose the `highlight` path that the narration explains.
2. `<DataFlow start={0} nodes edges highlight />` (pass `static` to render the ordinary before version). Label it CONCEPT DIAGRAM: never present it as proof of a real connection.
3. Render and verify: nodes appear one by one, lines draw on, packets move (compare frames 40 vs 50), the highlighted path glows amber.
