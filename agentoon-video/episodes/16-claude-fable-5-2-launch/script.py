"""Narration for Ep 16 (Claude Fable 5.2 launch). (id, scene, spoken, shown). Every factual line checked against the Anthropic announcement (2026-11-09) and the Claude Platform docs, read 2026-11-10."""
PHR = [
 ("p1", "s1", "Claude Fable 5.2 is here, and Anthropic is showing what AI can build beyond the chat window.", "Claude Fable 5.2 is here, and Anthropic is showing what AI can build beyond the chat window."),
 ("p2", "s2", "Announced November ninth, Fable 5.2 is built for demanding coding, reasoning, and long-running technical projects.", "Announced November 9th, Fable 5.2 is built for demanding coding, reasoning, and long-running technical projects."),
 ("p2b", "s2", "Anthropic says it generates output up to thirty percent faster than Fable 5.1, at a lower price.", "Anthropic says it generates output up to 30% faster than Fable 5.1, at a lower price."),
 ("p3", "s3", "In one experiment, Fable coordinated more than a thousand AI agents over eight days to build a prototype operating system that boots on a laptop.", "In one experiment, Fable coordinated more than a thousand AI agents over eight days to build a prototype operating system that boots on a laptop."),
 ("p3b", "s3", "It started from an empty folder, and wrote, tested, and reviewed code around the clock.", "It started from an empty folder, and wrote, tested, and reviewed code around the clock."),
 ("p4", "s4", "Anthropic also demonstrated Fable controlling robots through physical tasks, like solving a puzzle cube, unscrewing a bottle cap, and drawing a picture.", "Anthropic also demonstrated Fable controlling robots through physical tasks, like solving a puzzle cube, unscrewing a bottle cap, and drawing a picture."),
 ("p5", "s5", "And for developers, the exciting part is bringing stronger reasoning and engineering capabilities into real coding workflows.", "And for developers, the exciting part is bringing stronger reasoning and engineering capabilities into real coding workflows."),
 ("p5b", "s5", "Here is a real Claude Code run on Fable 5.2. It writes a dashboard, then runs its own tests.", "Here is a real Claude Code run on Fable 5.2. It writes a dashboard, then runs its own tests."),
 ("p6", "s6", "Fable 5.2 supports a million-token context window, and is designed for complex projects involving multiple steps, tools, and agents.", "Fable 5.2 supports a 1M-token context window, and is designed for complex projects involving multiple steps, tools, and agents."),
 ("p6b", "s6", "Mythos 5.2 is the same underlying model, with fewer safeguards, for verified programs.", "Mythos 5.2 is the same underlying model, with fewer safeguards, for verified programs."),
 ("p7", "s7", "To try it, open Claude or Claude Code, check your available models, and select Fable 5.2 if your account includes access.", "To try it, open Claude or Claude Code, check your available models, and select Fable 5.2 if your account includes access."),
 ("p8", "s8", "From software engineering to robotics, Fable 5.2 shows how far AI agents are progressing. Follow Agentoon dot A I for real demos and practical A I tutorials.", "From software engineering to robotics, Fable 5.2 shows how far AI agents are progressing. Follow Agentoon.ai for real demos and practical AI tutorials."),
]
SCENES = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"]
GAP, SCENE_PAD, LEAD = 0.28, 0.32, 0.2
