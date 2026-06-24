# 01 - Meta Setup

This file explains what you need before connecting Meta Ads to n8n.

## 1. Prepare Business Manager

Open Meta Business Manager and confirm:

- You own or manage the business.
- The Facebook Page is connected.
- The Instagram account is connected.
- The ad account is connected.
- Billing is active.
- You have admin access.

## 2. Create A Meta Developer App

Go to Meta for Developers and create a business app.

Add:

- Marketing API
- Business Manager connection

## 3. Create A System User

Inside Business Settings:

1. Go to Users.
2. Open System Users.
3. Create a system user.
4. Give the system user access to the ad account.
5. Generate a token with Marketing API access.

## 4. Required Permissions

For reporting:

- Read campaigns
- Read ad sets
- Read ads
- Read insights

For future automation:

- Manage campaigns
- Manage ad sets
- Manage ads

Start with reporting only.

## 5. Find Your Ad Account ID

Your Meta Ad Account ID usually looks like:

```text
act_1234567890
```

Place it inside the n8n node named:

```text
Set Workflow Config
```

Do not publish the real value in GitHub.
