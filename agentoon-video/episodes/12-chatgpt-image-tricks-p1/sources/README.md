# sources/  ·  results/  (drop-in folders)
Put each REAL Pexels source photo here as `NN.jpg` (NN = 01..15) and each REAL ChatGPT result in `../results/NN.png`.
Then run: `python3 build.py && npx hyperframes render --quality delivery --fps 30 --output out/ep12-raw.mp4`
The composition picks the files up automatically; a missing file stays a labelled PENDING panel.
Record each photo's Pexels URL, photographer and licence in `../data/TRACKING-SHEET.md`.
