---
description: Run all five Council agents simultaneously on a decision or question. Each agent analyzes from their perspective in parallel, then their outputs are synthesized into a peer-reviewed recommendation with an execution plan. Use for any important decision, plan, or problem where multiple angles matter.
---

# The Council — Five-Agent Decision Analysis

When this skill is invoked, follow this process exactly:

## Step 1 — Receive the Question

Ask the user: "What decision, plan, or problem should The Council analyze?" if not already provided. Restate it clearly before proceeding.

## Step 2 — Spawn All Five Agents in Parallel

Launch all five agents simultaneously using the Agent tool. Each receives the same question plus their specific lens. Do NOT wait for one before launching the others — all five run at the same time.

Agents to spawn in a single parallel call:
- `strategist` — long-term direction, second-order effects, leverage
- `critic` — risks, blind spots, failure modes, assumptions
- `creative` — reframes, non-obvious options, lateral thinking
- `operator` — execution plan, steps, owners, timeline
- `advocate` — human impact, user needs, trust, fairness

Prompt to pass each agent (substitute their role name and lens):

> You are the [ROLE] on The Council. Analyze the following from your specific perspective only — do not try to cover other angles.
>
> Question/Decision: [USER'S QUESTION]
>
> Deliver your analysis according to your role's instructions. Be specific, direct, and end with your single clearest recommendation.

## Step 3 — Collect and Display All Five Perspectives

After all five agents respond, present their outputs clearly labeled:

```
## The Council Has Spoken

### Strategist
[output]

### Critic
[output]

### Creative
[output]

### Operator
[output]

### Advocate
[output]
```

## Step 4 — Peer Review Pass

Now synthesize across all five perspectives yourself (do not spawn agents for this step):

- **Points of agreement** — what do multiple agents agree on? This is high-confidence signal.
- **Points of tension** — where do agents disagree or pull in different directions? Name the trade-off explicitly.
- **Blind spots addressed** — what did one agent catch that the others missed?
- **The sharpest challenge** — what is the Critic's most important objection, and does any other agent resolve it?

## Step 5 — Final Output

Deliver a unified conclusion in this format:

```
## Council Verdict

**The Recommendation:** [One clear sentence on what to do]

**The Core Reason:** [Why this is the right call given all five perspectives]

**The Biggest Risk:** [The Critic's sharpest objection and how to manage it]

**The First Move:** [The Operator's single next action — specific, assigned, timed]

**The Human Check:** [The Advocate's most important consideration to keep in mind]

## Execution Plan
[Numbered steps drawn from the Operator's output, refined against the other agents' input]

## Open Questions
[What remains unresolved that the user must decide before moving forward]
```

---

**Important:** Always run all five agents. Never skip an agent because the question seems simple — The Council's value comes from the full set of perspectives, especially the ones that feel least relevant at first.
