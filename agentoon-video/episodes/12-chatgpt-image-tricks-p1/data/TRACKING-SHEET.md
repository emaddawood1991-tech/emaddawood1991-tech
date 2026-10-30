# Source-to-result tracking sheet · 15 ChatGPT Image Tricks (Part 1 of 3)

Status key: PENDING = nothing real exists yet. Nothing below is a result; no photo, edit or ChatGPT screen has been invented.

## Blockers (verified in this session)
1. **Pexels not reachable.** `www.pexels.com`, `images.pexels.com`, `api.pexels.com` fail to resolve (outside the session's allowed network domains). The 15 licensed source photos cannot be selected or downloaded yet. No Pexels API key is set either.
2. **ChatGPT not reachable / not signed in.** `chatgpt.com` and `help.openai.com` fail to resolve, and ChatGPT image editing needs the owner's own signed-in account. No OpenAI connector exists in this environment.
3. Other image tools exist as connectors (Higgsfield, ElevenLabs, Adobe, Canva, Figma, Hugging Face) but they are **not ChatGPT**, spend credits, and are not used here: the video's premise is real ChatGPT edits.

## Tracking table

| # | Label | Source needed | Source photo (Pexels URL, photographer, licence) | Submitted prompt | Result file | Tool | Quality | Limitations | Status |
|---|---|---|---|---|---|---|---|---|---|
| 01 | /nightfix | Dark nighttime city photo. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 02 | /photorestore | Damaged vintage portrait. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 03 | /objectremove | Street photo with a distracting object. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 04 | /bgremove | Product or person photograph. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 05 | /outzoom | Tightly cropped photograph. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 06 | /wormseyeview | Ordinary street portrait. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 07 | /goldenhour | Outdoor daytime photograph. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 08 | /bokeh | Portrait with a distracting background. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 09 | /reflection | Scene with reflective surfaces. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 10 | /motionblur | Street or vehicle photograph. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 11 | /proshot | Casual portrait. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 12 | /bgstudio | Portrait or product in an everyday setting. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 13 | /foodcinematic | Ordinary food photograph. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 14 | /productshot | Basic product photograph. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |
| 15 | /sketch2real | Original or appropriately licensed interior sketch. | _not selected_ | exact text in `data/effects.json` | _none_ | ChatGPT (to be run by owner) | - | - | PENDING |

## Source selection criteria (so the choice can be made as soon as Pexels is reachable)
Each photo must be on Pexels (Pexels licence: free to use, attribution not required but recorded here), portrait-friendly, and make the effect obvious: 01 very dark city street with a clear subject; 02 an old-looking damaged portrait (Pexels has few; a genuine vintage scan is required, never a fake aged filter); 03 street scene with one obvious removable object on a simple background; 04 single product or person on a busy background; 05 tightly cropped subject with implied surroundings; 06 standing person at eye level on a street; 07 flat midday outdoor scene; 08 portrait with a cluttered background; 09 wet street, glass or water surface; 10 car or cyclist on a street; 11 casual, unflattering-lighting portrait; 12 everyday-setting subject; 13 plain dish on a table; 14 single product on a plain surface; 15 interior sketch/drawing.

## How the real edits get done (needs the owner)
Option A (recommended): once Pexels is allowed, Claude downloads and documents the 15 photos and writes `sources/RUN-SHEET.md` (photo + prompt per trick). The owner runs each prompt in their own ChatGPT account, saves each result (and a screen recording of the upload, prompt and result for the 'authentic software' shots) into `results/NN-label.png` / `results/NN-label.mp4` and uploads them to this session.
Option B: the owner supplies their own 15 photos instead.
Claude never asks for ChatGPT credentials.
