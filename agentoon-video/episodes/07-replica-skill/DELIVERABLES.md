# Ep 07 — Replica Skill (PREVIEW v1)

Video: `out/agentoon-ep07-replica-skill-PREVIEW-v1.mp4` — 1080x1920, 49.0 s, -15.3 LUFS, true peak -1.4 dBTP.

## Narration transcript
{'id': 'p0', 'speak': 'What if Claude Code could help you rebuild your favorite app?', 'show': 'What if Claude Code could help you rebuild your favorite app?', 'map': None}
{'id': 'p0b', 'speak': 'Not copy it. Rebuild what it does, in your own brand.', 'show': 'Not copy it. Rebuild what it does, in your own brand.', 'map': None}
{'id': 'p1', 'speak': 'Meet Replica Skill. Eleven Claude skills that research, build, and test apps.', 'show': 'Meet Replica Skill. Eleven Claude skills that research, build, and test apps.', 'map': None}
{'id': 'p1b', 'speak': 'Free, MIT licensed, nothing to connect.', 'show': 'Free, MIT licensed, nothing to connect.', 'map': None}
{'id': 'p2', 'speak': 'Open Claude Code, add the GitHub marketplace, and install the plugin.', 'show': 'Open Claude Code, add the GitHub marketplace, and install the plugin.', 'map': None}
{'id': 'p3', 'speak': 'Give it an app to study. It maps the screens, features, and user flows.', 'show': 'Give it an app to study. It maps the screens, features, and user flows.', 'map': None}
{'id': 'p3b', 'speak': 'It only reads public pages and your own account.', 'show': 'It only reads public pages and your own account.', 'map': None}
{'id': 'p4', 'speak': 'Then it helps build your own version, and test the booking experience.', 'show': 'Then it helps build your own version, and test the booking experience.', 'map': None}
{'id': 'p4b', 'speak': 'In our demo, the tests caught a bug, then passed eight of eight.', 'show': 'In our demo, the tests caught a bug, then passed eight of eight.', 'map': None}
{'id': 'p5', 'speak': 'It can even find customer complaints, and suggest what to improve.', 'show': 'It can even find customer complaints, and suggest what to improve.', 'map': None}
{'id': 'p5b', 'speak': 'But it never invents reviews. Every quote needs a real link.', 'show': 'But it never invents reviews. Every quote needs a real link.', 'map': None}
{'id': 'p6', 'speak': 'Follow Agentoon dot A I for more Claude Code skills!', 'show': 'Follow Agentoon.ai for more Claude Code skills!', 'map': [['Follow', 'Follow'], ['Agentoon.ai', 'Agentoon dot A I'], ['for', 'for'], ['more', 'more'], ['Claude', 'Claude'], ['Code', 'Code'], ['skills!', 'skills!']]}

## GitHub + install (verified)
- Repo: https://github.com/Jakeschincariol/replica-skill (MIT, commit 77c9436, author Jake Schincariol)
- `claude plugin marketplace add Jakeschincariol/replica-skill` -> "Successfully added marketplace: replica-skill"
- `claude plugin install replica-skill@replica-skill` -> "Successfully installed plugin ... (scope: user)"; in Claude Code: `/plugin marketplace add Jakeschincariol/replica-skill`, `/plugin install replica-skill@replica-skill`
- `claude plugin details`: Skills (11), Agents 0, Hooks 0, MCP 0. Transcript: `data/real-install-transcript.txt`

## Actually demonstrated (real, on screen)
- Real install transcript + 11-skill list (pipeline order from the repo)
- Real tool outputs on my TidyTime demo (original brand): parity.py 64.3/100 "not shippable yet", contrast.py 9 pairs 0 failing AA, sweep.py clean, repo unit tests 57 OK (not shown)
- Real Playwright run on TidyTime: run 1 = 3/8 (a real bug in my demo code), fix, run 2 = 8/8
- Real reviews.py refusal: "no usable rows" (no reviews were collected, none invented)
- Real TidyTime screenshots (390x844 phone)

## NOT real yet (labelled PLACEHOLDER on screen; see data/slots.json)
1. Original scheduling-site footage (calendly.com unreachable from sandbox; no site was researched by replica-recon)
2. Real GitHub page screenshot (card rebuilt from real README text, labelled)
3. A real `/replica-recon` run in Claude Code (uses your Claude usage; not run, not claimed)
4. Real linked reviews for replica-entrepreneur
The test/parity numbers come from my TidyTime demo, not a Calendly clone; the video says "In our demo".
Reference video 1000285633.mp4 was not available. Remotion/Blender not used (no Blender connected; Remotion unnecessary here).

## QC
PASS: 1080x1920, 49.0 s (<=50), h264/aac, -15.3 LUFS, TP -1.4, no silence >1 s, no stray dot, no keys/email on screen, single Follow ending, mean motion energy 4.4 (longest gap 3.5 s).
WARN: narration measured 168 wpm TTS (validator's 141 uses full video length); recon/GitHub/review slots are placeholders; preview banner on.
To finalize: put real assets in data/slots.json, set "preview_banner": false, run build.py + mix + render to a NEW filename.
