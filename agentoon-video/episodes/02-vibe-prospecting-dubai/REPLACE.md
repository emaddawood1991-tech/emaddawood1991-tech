# Ep 02 — replacing placeholders with real results

Preview: `out/agentoon-ep02-vibe-prospecting-PREVIEW-v4.mp4` (placeholders are hazard-striped "PLACEHOLDER · …" ribbons; global "PREVIEW · PLACEHOLDERS MARKED" chip).
Nothing in the preview is a real tool result. No company, contact, count, install output or login success is shown.

## Scenes awaiting real demonstrations (slots in `data/slots.json`)

| Scene (time) | Slot | What the real run must supply | Public-video rule |
|---|---|---|---|
| S1 hook 0:00–0:04 | `hook_csv` | The real exported CSV (first 4 columns, 5 rows) | Company names/domains OK; people masked |
| S2 repo 0:04–0:17 | (no slot) | Real GitHub screenshot of explorium-ai/vibeprospecting-plugin to replace the rebuilt card | Screenshot only; remove "REBUILT" chip |
| S3 install 0:17–0:25 | `install_out`, `whoami_out` | Real `/plugin install` output (or `/plugin` list); real `vpai whoami` exit 0 | Hide login URL, tokens, account email |
| S4 mission 0:25–0:41 | `prompt_run` | Screen recording of Claude Code receiving the exact prompt | Hide key/email |
| S5 research 0:41–0:57 | `stats_count`, `sample_table`, `credit_note` | Real match count, the 5-company sample, the exact credit message | Credits unverified until shown by the tool |
| S6 enrichment 0:57–1:10 | `enrich_profile` | One real enriched record | Name/email/phone masked; empty = "Not available" |
| S7 export 1:10–1:21 | `final_csv`, `final_count` | Real CSV in a spreadsheet; real row count (not necessarily 100) | Masked person fields |

S8 (value) and S9 (ending) need nothing real. Everything else is verified documentation (README at commit ca43f6d).

## Procedure (no rebuild of the video design)

1. Run the real session on your own machine (see `RECORDING-RUNBOOK.md`), 5-company sample only, no spend beyond what you approve.
2. Edit `data/slots.json`: put the value in the slot (`rows`, `lines`, `value`, `text`, or `file`), set `source`, set `status` to `"verified"`. Never mark verified without the transcript/CSV/recording on disk.
3. `python3 build.py` (tables, counters and notes switch from skeleton to real values automatically; ribbons disappear for verified slots).
4. Real screen recordings (S2 screenshot, S4 recording): add a muted `<video>`/`<img>` in `src/index.template.html` where the placeholder glass sits (HyperFrames rules: `data-start`, `data-duration`, `data-track-index`, no `crossorigin`), crop and zoom to the narrated detail, keep the drawn-on callouts.
5. If the real count is not 100, or the narration changes, edit `episode.json`, run `build_audio.py tts episode.json`, then `build.py`, `build_audio.py mix mix.json`. Scene windows, captions and cues follow the narration automatically.
6. Set `"preview_banner": false`, render to a NEW filename, and run `validate-render.sh` and `motion-profile.sh`.
7. Final check: no keys, codes, passwords, user email or unmasked personal data on any frame; no fabricated claims.
