"""Derives presenter assets from the supplied reference sheet WITHOUT altering the character art:
 - crops (hero head/torso panel, pose panels) and Lanczos upscales them
 - mattes the plain-background pose panel with a gradient-aware flood fill (alpha only; RGB untouched)
numpy + PIL only."""
import numpy as np
from PIL import Image, ImageFilter
SHEET = 'assets/character/fmc-presenter-reference.png'
OUT = 'assets/character/derived/'
im = Image.open(SHEET).convert('RGB')

def up(img, k=3):
    return img.resize((img.width * k, img.height * k), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))

# hero head/torso panel (keeps its own clinic background; used as a rounded "camera" card)
up(im.crop((0, 0, 592, 578)), 2).save(OUT + 'presenter-hero.png')

def matte(box, name, k=3, thr=34):
    a = np.asarray(im.crop(box)).astype(np.float32)
    H, W, _ = a.shape
    # per-row background estimate from the left/right 4px borders (panels have a smooth vertical gradient)
    border = np.concatenate([a[:, :4], a[:, -4:]], axis=1).mean(axis=1)           # H x 3
    d = np.linalg.norm(a - border[:, None, :], axis=2)
    bgmask = d < thr
    # background = bg-like pixels connected to the border (flood fill by iterative dilation)
    reach = np.zeros_like(bgmask); reach[0, :] = bgmask[0, :]; reach[:, 0] = bgmask[:, 0]; reach[:, -1] = bgmask[:, -1]; reach[-1, :] = bgmask[-1, :]
    for _ in range(max(H, W)):
        n = reach.copy()
        n[1:] |= reach[:-1]; n[:-1] |= reach[1:]; n[:, 1:] |= reach[:, :-1]; n[:, :-1] |= reach[:, 1:]
        n &= bgmask
        if (n == reach).all(): break
        reach = n
    alpha = (~reach).astype(np.uint8) * 255
    al = Image.fromarray(alpha).filter(ImageFilter.MedianFilter(5))
    rgb = up(Image.fromarray(a.astype(np.uint8)), k)
    al = al.resize(rgb.size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.6))
    out = rgb.convert('RGBA'); out.putalpha(al); out.save(OUT + name)
    print(name, out.size)

matte((406, 582, 610, 926), 'presenter-pose-pain.png')    # hands on lower back, pain glow
matte((182, 582, 402, 926), 'presenter-pose-point.png')   # pointing toward spine

# ---- hero with the open mouth interior inpainted away (the mouth is redrawn live, driven by the audio) ----
from PIL import ImageDraw
hero = Image.open(OUT + 'presenter-hero.png').convert('RGB')
H = np.asarray(hero).astype(np.float32)
poly = [(662, 383), (690, 395), (720, 401), (755, 406), (792, 407), (797, 413), (782, 425), (745, 431), (708, 423), (684, 410), (667, 394)]
pm = Image.new('L', hero.size, 0); ImageDraw.Draw(pm).polygon(poly, fill=255)
polyarr = np.asarray(pm) > 0
lum = H.mean(axis=2)
skin_like = (H[..., 0] > 150) & (H[..., 0] - H[..., 2] > 35) & (lum > 120)           # pink lip/skin pixels
mask = polyarr & ~skin_like                                                         # cavity + teeth only
mask = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
mask &= polyarr
known = ~mask
fill = H.copy(); fill[mask] = 0
# diffusion inpaint: repeatedly average neighbours into the hole
ys, xs = np.where(mask); y0, y1, x0, x1 = ys.min() - 3, ys.max() + 4, xs.min() - 3, xs.max() + 4
sub = fill[y0:y1, x0:x1].copy(); m = mask[y0:y1, x0:x1]; kn = known[y0:y1, x0:x1]
sub[m] = sub[kn].mean(axis=0)
for _ in range(900):
    p = np.pad(sub, ((1, 1), (1, 1), (0, 0)), mode='edge')
    avg = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]) / 4
    sub[m] = avg[m]
fill[y0:y1, x0:x1] = sub
out = Image.fromarray(fill.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.0))
out.save(OUT + 'presenter-hero-closed.png')
print('mouth inpainted; mask px', int(mask.sum()))
out.crop((620, 340, 840, 470)).resize((880, 520), Image.LANCZOS).save('.tmp/char/closed_zoom.png')
