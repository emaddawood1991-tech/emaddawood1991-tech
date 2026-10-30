"""Narration for Ep 14 (Claude + Bland MCP). (id, scene, spoken, shown). Every product claim is from the official Bland docs (read through the Bland MCP) or the Claude custom-connector article."""
PHR = [
 ("p1", "s1", "What if Claude could actually call your phone? Here's how to connect it using MCP.", "What if Claude could actually call your phone? Here's how to connect it using MCP."),
 ("p2", "s2", "First, open Bland AI and create an account. It's a platform for AI-powered voice calls.", "First, open Bland AI and create an account. It's a platform for AI-powered voice calls."),
 ("p2b", "s2", "You can sign in with a phone number, Google, or SSO.", "You can sign in with a phone number, Google, or SSO."),
 ("p3", "s3", "Next, open Bland's MCP integration page and copy its official server URL.", "Next, open Bland's MCP integration page and copy its official server URL."),
 ("p3b", "s3", "It's a hosted server, so there's nothing to install.", "It's a hosted server, so there's nothing to install."),
 ("p4", "s4", "Now open Claude, go to Customize, then Connectors. Add a custom connector, name it Bland AI, and paste the MCP URL.", "Now open Claude, go to Customize, then Connectors. Add a custom connector, name it Bland AI, and paste the MCP URL."),
 ("p4b", "s4", "Claude shows its authentication settings. Review them, then continue.", "Claude shows its authentication settings. Review them, then continue."),
 ("p5", "s5", "Sign in to Bland, choose your organization, and review the permissions. Now Claude can access Bland's available tools.", "Sign in to Bland, choose your organization, and review the permissions. Now Claude can access Bland's available tools."),
 ("p5b", "s5", "For read-only access, uncheck the permission to change your agents.", "For read-only access, uncheck the permission to change your agents."),
 ("p5c", "s5", "Prefer Claude Code? Add the server with one command, then log in.", "Prefer Claude Code? Add the server with one command, then log in."),
 ("p6", "s6", "Let's test it. Ask Claude to list your Bland agents. If it answers, you're connected.", "Let's test it. Ask Claude to list your Bland agents. If it answers, you're connected."),
 ("p6b", "s6", "Placing a real call needs your approval, your own number, and Bland credits.", "Placing a real call needs your approval, your own number, and Bland credits."),
 ("p7", "s7", "You can use this for reminders, confirmations, and other approved phone tasks. Calling features may require credits or a paid plan.", "You can use this for reminders, confirmations, and other approved phone tasks. Calling features may require credits or a paid plan."),
 ("p8", "s8", "Save this tutorial, share it with a friend, and follow Agentoon dot A I for more AI tools!", "Save this tutorial, share it with a friend, and follow Agentoon.ai for more AI tools!"),
]
SCENES = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"]
GAP, SCENE_PAD, LEAD = 0.3, 0.4, 0.2
