# 03 - Security And Approval

This workflow touches advertising money. Treat it like a financial system.

## Never Commit Secrets

Do not put these in GitHub:

- Meta access token
- OpenAI API key
- Claude API key
- App secret
- Real ad account ID
- Client data
- Billing information

Use n8n credentials.

## Safe Modes

### report_only

The workflow reads data and creates recommendations only.

Recommended for the first 3 days.

### approval_required

The workflow prepares actions but waits for a human to approve.

Recommended for production.

### live_execution

The workflow can make changes directly.

Use only after strong testing.

## Approval Message Example

```text
Approval required:

Action: Pause ad
Ad: Waikato Coffee - Reel 03
Reason: Spend above threshold with zero leads
Risk: Low
Budget impact: protects approx. $20/day

Approve? yes/no
```

## Best Practice

AI should advise. Humans should approve.
