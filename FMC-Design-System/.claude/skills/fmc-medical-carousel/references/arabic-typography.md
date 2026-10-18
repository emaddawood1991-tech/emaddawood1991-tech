# Arabic typography & proofreading

## Rendering rules
- Text is real HTML: `<html lang="ar" dir="rtl">`, `direction:rtl; text-align:right`. Fonts embedded from `assets/fonts` (Cairo variable — default; Tajawal 500/700/800; IBM Plex Sans Arabic 500/700). Fallback chain: Cairo → Tajawal → IBM Plex Sans Arabic.
- Titles `.arabic-title` weight 800, line-height 1.4. Body `.arabic-body` weight 500, line-height 1.7. Min sizes at 1080 px: body ≥ 28 px, labels ≥ 26 px, disclaimer ≥ 22 px.
- Mixed text: wrap LTR runs with `<bdi>` or `.ltr` (`unicode-bidi:isolate`). Numbers: Arabic-Indic digits (٠-٩) for numbered badges and dates in Arabic copy; keep Western digits only in English strings.
- Use `*accent*` sparingly (one phrase per headline). Break headlines with `\n` at phrase boundaries; avoid one-word orphan lines.
- Never use letter-spacing on Arabic (breaks joining). Never `text-transform`. Never AI-generated Arabic in images.
- Flex/grid inherit RTL: first DOM child appears on the right. Icons beside text sit on the right (start side).

## Proofreading checklist (before render)
1. Spelling: hamza (أ إ ؤ ئ ء), tā' marbūṭa vs hā', alif maqṣūra vs yā', al-lām shamsiyya spellings.
2. Tanween: fatḥatān goes on the letter before the final alif (ليلًا، غالبًا، أحيانًا).
3. Punctuation: `،` `؛` `؟` (Arabic comma/semicolon/question mark), full stop `.`; colon `:` before lists.
4. Agreement & grammar: gender/number agreement, prepositions (يتعرض لـ، يؤدي إلى، تحتاج إلى).
5. Consistent terminology (see glossary in `medical-content.md`). One term per concept across a series.
6. Short, natural sentences; second person singular for patient advice (استشر، لا تتجاهل) consistently within a post.
7. Medical responsibility: hedged claims ("قد"، "غالبًا")، no absolute promises.

## After render (inspect each PNG)
Every word read aloud · no clipped ascenders/descenders (check the lines under "ي" and "ق" tails and tashkeel) · joined letters intact · line wraps natural · punctuation on the correct (left) end of RTL sentences · reading order right→left, top→bottom · English brand strings in correct order · `text-proof.txt` matches the approved copy.
