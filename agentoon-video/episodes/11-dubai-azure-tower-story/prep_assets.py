#!/usr/bin/env python3
"""Portrait crops from the REAL project renders (Dubai_Azure_Tower_Poster_4K.png, Dubai_Azure_Tower_Interior_1080p.png).
Source folder: agentoon-projects/dubai-azure-tower/renders on branch claude/ecstatic-goldberg-ovm1a3 (extracted to /tmp/tower)."""
import os
from PIL import Image, ImageDraw
R = os.environ.get("TOWER_RENDERS", "/tmp/tower/agentoon-projects/dubai-azure-tower/renders"); A = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
os.makedirs(A, exist_ok=True)
P = Image.open(f"{R}/Dubai_Azure_Tower_Poster_4K.png").convert("RGB")
# hero: tower column, 1300x2400 at 2400-px height, with 520 px of sky added on top (title room); the added sky is a plain gradient, no new content
cx = int(0.505 * 3840); w = int(1300 * 2160 / 2400)
crop = P.crop((cx - w // 2, 0, cx + w // 2, 2160)).resize((1300, 2400), Image.LANCZOS)
top = crop.getpixel((650, 6)); pad = Image.new("RGB", (1300, 520)); d = ImageDraw.Draw(pad)
for y in range(520):
    k = y / 519; c = tuple(int(a * (0.22 + 0.78 * k) + b * (1 - (0.22 + 0.78 * k))) for a, b in zip(top, (10, 24, 48))); d.line([(0, y), (1300, y)], fill=c)
full = Image.new("RGB", (1300, 2920)); full.paste(pad, (0, 0)); full.paste(crop, (0, 520)); full.save(f"{A}/hero_poster.jpg", quality=92)
# side-by-side cards 500x760 (ratio .658)
cw = int(2160 * 500 / 760); P.crop((cx - cw // 2, 0, cx + cw // 2, 2160)).resize((1000, 1520), Image.LANCZOS).save(f"{A}/card_tower.jpg", quality=92)
I = Image.open(f"{R}/Dubai_Azure_Tower_Interior_1080p.png").convert("RGB"); iw = int(1080 * 500 / 760)
I.crop((880, 0, 880 + iw, 1080)).resize((1000, 1520), Image.LANCZOS).save(f"{A}/card_interior.jpg", quality=92)
print("assets ok", os.listdir(A))
