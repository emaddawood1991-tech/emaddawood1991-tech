# 02 - n8n Setup

This guide shows how to import the workflow into n8n Cloud.

## 1. Open n8n

Go to your n8n workspace.

Example:

```text
https://your-workspace.app.n8n.cloud/
```

## 2. Create A Workflow

1. Open your project.
2. Click Create Workflow.
3. Open the command bar.
4. Choose Import workflow from file.
5. Upload:

```text
n8n/meta-ads-ai-automation.workflow.json
```

If file upload is blocked, copy the workflow JSON and paste it into the workflow canvas.

## 3. Configure Workflow

Open the node:

```text
Set Workflow Config
```

Replace:

```text
act_REPLACE_WITH_AD_ACCOUNT_ID
```

with your real Meta Ad Account ID.

Keep:

```text
mode = report_only
```

## 4. Add Credentials

Create an HTTP Header Auth credential for Meta:

```text
Header name: Authorization
Header value: Bearer YOUR_META_ACCESS_TOKEN
```

Create another HTTP Header Auth credential for OpenAI:

```text
Header name: Authorization
Header value: Bearer YOUR_OPENAI_API_KEY
```

## 5. Test

Run the workflow manually first.

Check:

- Meta data loads.
- AI report is generated.
- Email report is sent.
- Numbers match Meta Ads Manager.
