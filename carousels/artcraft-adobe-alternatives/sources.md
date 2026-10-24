# Sources & fact-check log — ArtCraft carousel (checked 24 Oct 2026)

## What could NOT be done
- **https://getartcraft.com/** (all pages) is unreachable from this environment: DNS fails in WebFetch and the proxy returns 403 for curl. So no website page was opened, **no screenshots were captured from the website**, and no Playwright inspection of the site was possible. Site-page claims below come from the GitHub READMEs that link to those pages.
- Press articles (TechRepublic, TweakTown, Design Compass, The Register, etc.) were also unreachable; they were seen only as **search-result summaries**. Nothing from them is stated as fact on a slide except where marked "press".
- The per-app release asset lists could not be fully loaded, so installer file names are the README patterns (see verified-links.md).
- Nothing was installed or run. Screenshots were downloaded as image files only.

## Verified from official GitHub (primary)
| Claim on slides | Basis |
|---|---|
| 7 apps: PhotoCraft, VectorCraft, FilmCraft, LightCraft, EffectCraft, PdfCraft, DesignCraft; each maps to an Adobe product | Each repo README ("clean-room reimplementation of Adobe Photoshop…", "Premiere Pro parity", etc.) and the launcher README app table |
| Acrobat counterpart is **PdfCraft** (some press says "PrintCraft") | Official README + launcher README use PdfCraft; press naming conflicts, so the official one is used |
| PhotoCraft: early alpha, not yet a Photoshop replacement for daily professional work | photocraft README badge + Status paragraph |
| PhotoCraft: layers, masks, adjustment layers (Curves, Levels, Vibrance…), opens/saves layered PSD | photocraft README features |
| VectorCraft: in active development (badge), "alpha" text, ~65% ready for mainstream illustrator; paths, Pathfinder, live effects, SVG/PDF/.ai | vectorcraft README |
| FilmCraft: alpha, ~56% "ready for real work", multitrack timeline, keyframes, colour, titles, export | filmcraft README (re-measured 2026-10-10) |
| LightCraft: alpha, ~51% for a typical working photographer, raw support varies by camera | lightcraft README |
| EffectCraft: alpha, ~45% ready for professional production, 306 effects, not recommended for production client work | effectcraft README |
| PdfCraft: alpha, ~55% ready for everyday work | pdfcraft README "Where it stands (October 2026)" |
| DesignCraft: stage pre-alpha | designcraft README → ROADMAP link text "stage: pre-alpha" |
| Pure Rust, MIT OR Apache-2.0 | README badges; org page lists Apache-2.0 on repos |
| Repos contain CLAUDE.md / AGENTS.md agent instructions (filmcraft, vectorcraft, photocraft has AGENTS.md); apps expose an MCP server so Claude/other agents can drive them | raw CLAUDE.md / AGENTS.md files; README "Built for agents" sections |
| Wider collection: WordCraft, DeckCraft, GridCraft, CADCraft, SoundCraft, FigCraft | craft-launcher README |
| Launcher v0.7.0 (23 Oct), early alpha, Windows .msi/.zip, macOS universal .dmg, Linux AppImage/.deb/.rpm/flatpak | releases page + README |

## Press-reported only (labelled "Press" on slide 2)
- Brandon Thomas led the project and built it with Claude (one secondary source names "Claude Opus 5.5" — **not used on slides**). The GitHub org page lists three people (@echelon, @tanish2k09, @bflatastic); it does not name Brandon Thomas. "One Developer" is therefore the requested headline, with the claim attributed to press; we could not confirm the workflow first-hand.
- Star counts, "only two apps ready", pricing plans for AI models: not used.

## Honesty notes
- Percentages on slides (~56% etc.) are the **projects' own estimates**, labelled as such; they are not independent measurements.
- Headline "FREE": README states open source (MIT OR Apache-2.0); press says AI features may be sold separately. Slide 8 says features and stability vary.
- No screenshot is fabricated or composited. Insets are crops of the same real screenshot. The 1:1 collage windows are real screenshots, scaled and slightly rotated.
- Screenshot content: PhotoCraft/LightCraft/DesignCraft images use public-domain artwork per the repos' SOURCES/README credits (Hokusai; Ansel Adams 1942, U.S. National Archives). FilmCraft shows NASA Apollo 11 archive footage (credit per project README; not independently re-verified). UI by the ArtCraft project (Apache-2.0 / MIT repos).
- "Open its download section" wording was softened to "Find its download links": the website layout could not be checked.
