# Episode 02 recording runbook (run on YOUR machine)

Decisions (2026-10-18): record locally · credits: **5-company sample only** · real people's contact details **masked** in the video.
Because only the sample is approved, the video will honestly show **"5-company sample out of [X] matches in the database"**, not 100 leads. If you later approve a bigger run, set a credit/record cap first.

## Before recording
- Quit email/chat apps, hide notifications and your own email in the browser and terminal prompt.
- Terminal: dark theme, font 20pt+, window about 70 columns wide (so text is large in a 9:16 crop). Screen recorder at 60 fps, MP4.
- Create an empty folder `dubai-leads` and start `claude` inside it.

## Record (one continuous take; stop recording while the login URL is on screen)
1. Show the plugin: run `/plugin` and show **vibe-prospecting** installed. If it is not installed, run `/plugin install vibe-prospecting@claude-plugins-official`, then restart Claude Code.
2. Paste the exact prompt from the storyboard (it already asks for a sample and the credit explanation first).
3. Let Claude run the workflow. It should install the CLI (`npm install -g @vibeprospecting/vpai@latest`) and ask you to sign in (`vpai login`). **Pause the recording**, open the printed URL off-camera, approve in the browser, then resume once `vpai login --poll` / `vpai whoami` succeeds. Never show the URL, a key, or `~/.config/vpai/config.json`.
4. Capture on camera: `vpai whoami` OK, the statistics count, the 5-entity sample table, and the **exact credit/cost message**. **Do not approve the full run.**
5. Open the produced CSV (its `csv_path`, copied into `dubai-leads/`) in a spreadsheet and scroll slowly across all columns once. Keep the cursor still on each column header for ~1 s.

## Send me (via chat upload)
1. The screen recording(s) (MP4).
2. The sample CSV (I mask person-level fields immediately; raw person data is never committed to the repo).
3. The terminal text (copy/paste) including the statistics count and the credit/cost message.
4. `claude --version` and `vpai --version` output.
Do **not** send: the login URL, API keys, config files, or screenshots showing your own email.

## What I do on receipt
Verify every number against the CSV and transcript, mask person-level data, rewrite the narration with the real figures (sample of 5, [X] matches, columns present, fill rates), build the "Night Ops" episode around the recordings, render to a new filename, then run `validate-render.sh`, `motion-profile.sh`, the phone-size sheet and seam review before delivery.
