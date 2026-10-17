# Instagram caption — How MCP servers work

## Caption (copy-paste)

MCP servers explained in 9 slides. 🔌

Three roles. Three primitives. Two transports:

🧱 One host runs many clients. Each client connects to exactly one server.
🛠 A server offers tools (model-controlled), resources (app-controlled) and prompts (user-controlled).
📨 Tools are found with tools/list and run with tools/call.
🚚 Messages travel over stdio (a local subprocess) or Streamable HTTP (one endpoint, POST requests).

Good to know:
• The spec changed. Revisions 2025-11-25 and earlier start with an initialize handshake. Revisions 2026-07-28 and later have no handshake: every request carries its version and capabilities in _meta, and server/discover is optional. Check which revision your tools speak.
• The old HTTP+SSE transport is deprecated.
• Keep a human able to deny tool calls, and only connect servers you trust (fetched content can carry prompt injection).
• In Claude Code: claude mcp add --transport http <name> <url>, then claude mcp list or /mcp.

💾 Save this for your next MCP build.
📤 Send it to a developer friend.
➕ Follow @agentoon.ai for Claude Code, MCP and AI agent tutorials.

Which MCP server do you want explained next? Tell me below 👇

Sources: Model Context Protocol specification (revision 2026-07-28: architecture, versioning, transports, server features, tools, changelog) and Claude Code docs (code.claude.com/docs, MCP). Checked 17 Oct 2026. Details can change between spec revisions and Claude Code versions.

## Hashtags

#MCP #ModelContextProtocol #ClaudeCode #Claude #Anthropic #AIAgents #AITools #AIDeveloper #AICoding #LLM #Automation #DeveloperTools #SoftwareEngineering #Programming #TechExplained #LearnToCode #APIs #Agentoon

## Alt text (accessibility)

Slide 1: "How MCP servers actually work" with the Agentoon robot looking thoughtful. Slide 2: one host with three clients, each linked to one server. Slide 3: the three server primitives: tools, resources and prompts, and who controls each. Slide 4: a simplified tools/call request. Slide 5: the request flow from server/discover to tools/list, tools/call and a result. Slide 6: stdio versus Streamable HTTP. Slide 7: legacy versus modern protocol revisions. Slide 8: a safety checklist for connecting servers. Slide 9: Follow @agentoon.ai, plus Save and Share.
