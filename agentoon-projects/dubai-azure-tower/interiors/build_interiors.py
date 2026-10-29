"""Camera-ready interior sets: lobby, apartment, penthouse, office. Consistent materials and floor heights.
Each set is built around an origin (cx, cy, z0); glazing faces +Y (the Gulf). Run via build_all."""
import math
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "architecture"))
import bpy
from lib import *


def mats():
    material("IntMarble", (0.85, 0.82, 0.77), rough=0.14, spec=0.5)
    material("IntMarbleDark", (0.16, 0.14, 0.13), rough=0.12, spec=0.5)
    material("IntTimber", (0.34, 0.20, 0.10), rough=0.42)
    material("IntTimberLight", (0.55, 0.40, 0.25), rough=0.45)
    material("IntWall", (0.90, 0.88, 0.84), rough=0.8)
    material("IntCeiling", (0.95, 0.94, 0.92), rough=0.9)
    material("IntFabric", (0.72, 0.66, 0.56), rough=0.95)
    material("IntFabricDark", (0.18, 0.20, 0.24), rough=0.95)
    material("IntLeather", (0.30, 0.17, 0.10), rough=0.4)
    material("IntBronze", P["palette"]["bronze"], rough=0.22, metal=1.0)
    material("IntGlass", (0.8, 0.92, 1.0), rough=0.02, alpha=0.12, spec=1.0)
    material("IntLight", (1, 0.82, 0.58), rough=0.5, emit=(1.0, 0.78, 0.5), emit_strength=3.0)
    material("IntSteel", (0.75, 0.75, 0.78), rough=0.25, metal=1.0)
    material("IntRug", (0.62, 0.55, 0.45), rough=1.0)
    material("IntGreen", (0.12, 0.30, 0.14), rough=0.8)
    material("IntWhite", (0.96, 0.96, 0.95), rough=0.4)
    material("IntBlack", (0.03, 0.03, 0.035), rough=0.3)
    material("IntTV", (0.01, 0.01, 0.015), rough=0.05, spec=1.0)
    material("IntBed", (0.92, 0.9, 0.86), rough=0.9)
    material("IntPaper", (0.9, 0.9, 0.88), rough=0.7)


def shell(c, name, cx, cy, z0, w, d, h, floor="IntMarble", glazed=True, open_front=False):
    """Room w x d x h centred at (cx, cy), floor at z0. Back wall -Y, glass wall +Y, side walls, ceiling."""
    t = 0.25
    box(f"{name}_floor", c, M(floor), cx, cy, z0 - 0.4, w + 2 * t, d + 2 * t, 0.4)
    box(f"{name}_ceil", c, M("IntCeiling"), cx, cy, z0 + h, w + 2 * t, d + 2 * t, 0.3)
    box(f"{name}_wallB", c, M("IntWall"), cx, cy - d / 2 - t / 2, z0, w + 2 * t, t, h)
    box(f"{name}_wallL", c, M("IntWall"), cx - w / 2 - t / 2, cy, z0, t, d, h)
    box(f"{name}_wallR", c, M("IntWall"), cx + w / 2 + t / 2, cy, z0, t, d, h)
    if glazed:
        gy = cy + d / 2
        box(f"{name}_glass", c, M("IntGlass"), cx, gy, z0, w, 0.04, h)
        n = int(w // 3.0)
        for i in range(n + 1):
            x = cx - w / 2 + i * w / n
            box(f"{name}_mull{i}", c, M("IntBronze"), x, gy, z0, 0.12, 0.16, h)
        box(f"{name}_sill", c, M("IntBronze"), cx, gy, z0, w, 0.18, 0.1)
        box(f"{name}_head", c, M("IntBronze"), cx, gy, z0 + h - 0.15, w, 0.18, 0.15)


def area_light(c, name, loc, size, energy, color=(1.0, 0.82, 0.62), shape="RECTANGLE"):
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = shape
    ld.size = size
    ld.size_y = size
    ld.energy = energy
    ld.color = color
    o = bpy.data.objects.new(name, ld)
    o.location = loc
    o.rotation_euler = (math.pi, 0, 0)   # face down
    return link(o, c)


def ceiling_lights(c, name, cx, cy, z, w, d, nx, ny, energy, size=1.2):
    for i in range(nx):
        for j in range(ny):
            x = cx - w / 2 + (i + 0.5) * w / nx
            y = cy - d / 2 + (j + 0.5) * d / ny
            area_light(c, f"{name}_L{i}{j}", (x, y, z - 0.05), size, energy)
            box(f"{name}_panel{i}{j}", c, M("IntLight"), x, y, z - 0.04, size * 0.5, size * 0.5, 0.04)


def sofa(c, name, x, y, z, rot=0.0, length=3.0, fabric="IntFabric"):
    o = bpy.data.objects.new(name, None); 
    kids = [
        box(f"{name}_seat", c, M(fabric), x, y, z + 0.05, length - 0.6, 0.94, 0.4, rot),
        box(f"{name}_back", c, M(fabric), x, y, z + 0.0, length - 0.04, 0.28, 0.95, rot),
    ]
    # offset back toward -local Y
    dx, dy = -math.sin(rot) * -0.34, math.cos(rot) * -0.34
    kids[1].location.x += dx; kids[1].location.y += dy
    for k, sx in ((-1, 1), (1, 1)):
        a = box(f"{name}_arm{k}", c, M(fabric), x + math.cos(rot) * k * (length / 2 - 0.15), y + math.sin(rot) * k * (length / 2 - 0.15), z, 0.3, 0.99, 0.7, rot)
    return kids[0]


def table(c, name, x, y, z, w, d, h, top="IntMarbleDark", leg="IntBronze", rot=0.0):
    box(f"{name}_top", c, M(top), x, y, z + h - 0.05, w, d, 0.05, rot)
    box(f"{name}_base", c, M(leg), x, y, z, w * 0.5, d * 0.5, h - 0.05, rot)


def chair(c, name, x, y, z, rot=0.0, fabric="IntFabricDark"):
    box(f"{name}_seat", c, M(fabric), x, y, z + 0.42, 0.5, 0.5, 0.08, rot)
    b = box(f"{name}_back", c, M(fabric), x, y, z + 0.42, 0.5, 0.08, 0.5, rot)
    b.location.x += math.sin(rot) * 0.22; b.location.y -= math.cos(rot) * 0.22
    b.location.z = z + 0.45
    for dx, dy in ((-0.2, -0.2), (0.2, -0.2), (-0.2, 0.2), (0.2, 0.2)):
        cyl(f"{name}_leg", c, M("IntBronze"), x + dx * math.cos(rot) - dy * math.sin(rot), y + dx * math.sin(rot) + dy * math.cos(rot), z, 0.025, 0.42, 6)


def plant(c, name, x, y, z, s=1.0):
    cyl(f"{name}_pot", c, M("IntWhite"), x, y, z, 0.28 * s, 0.5 * s, 16)
    for k in range(5):
        a = k * 1.256
        ball(f"{name}_leaf{k}", c, M("IntGreen"), x + math.cos(a) * 0.25 * s, y + math.sin(a) * 0.25 * s, z + (0.9 + 0.12 * k) * s, 0.28 * s, 0.7, 0.7, 1.3)


def bed(c, name, x, y, z, rot=0.0):
    box(f"{name}_base", c, M("IntTimber"), x, y, z, 2.1, 2.3, 0.35, rot)
    box(f"{name}_mattress", c, M("IntBed"), x, y, z + 0.35, 2.0, 2.2, 0.28, rot)
    h = box(f"{name}_headboard", c, M("IntLeather"), x, y - 1.2, z, 2.4, 0.14, 1.3, rot)
    for k in (-0.5, 0.5):
        box(f"{name}_pillow", c, M("IntWhite"), x + k, y - 0.8, z + 0.63, 0.7, 0.4, 0.14, rot)
    box(f"{name}_runner", c, M("IntFabricDark"), x, y + 0.5, z + 0.63, 2.0, 0.6, 0.04, rot)


def pendant(c, name, x, y, z, r=0.5, drop=1.6):
    cyl(f"{name}_rod", c, M("IntBronze"), x, y, z - drop, 0.01, drop, 6)
    ball(f"{name}_globe", c, M("IntLight"), x, y, z - drop, r * 0.5, 1, 1, 0.8)
    area_light(c, f"{name}_AL", (x, y, z - drop - 0.3), 0.6, 120)


def rug(c, name, x, y, z, w, d, rot=0.0):
    box(f"{name}", c, M("IntRug"), x, y, z, w, d, 0.02, rot)


# ----------------------------------------------------------------------------- sets
def lobby(c, cx, cy, z0):
    w, d, h = 28.0, 20.0, T["lobby_height"]
    shell(c, "Lobby", cx, cy, z0, w, d, h, floor="IntMarble")
    for i in range(7):           # bronze vertical feature fins on back wall
        box(f"Lobby_fin{i}", c, M("IntBronze"), cx - 12 + i * 4, cy - d / 2 + 0.2, z0, 0.18, 0.4, h)
    box("Lobby_wallglow", c, M("IntLight"), cx, cy - d / 2 + 0.05, z0 + h - 0.6, w - 2, 0.05, 0.12)
    # sculptural reception desk (curved: stacked arc segments)
    for k in range(9):
        a = math.radians(-60 + k * 15)
        x = cx - 4 + math.sin(a) * 5.0
        y = cy - 2 + (1 - math.cos(a)) * -4.0
        box(f"Lobby_desk{k}", c, M("IntMarbleDark"), x, y, z0, 1.6, 0.7, 1.12 + 0.002 * k, -a)
        box(f"Lobby_desktop{k}", c, M("IntMarble"), x, y, z0 + 1.17 + 0.004 * k, 2.3, 1.15, 0.06, -a)
    box("Lobby_deskglow", c, M("IntLight"), cx - 4, cy - 5.9, z0 + 0.3, 7.0, 0.04, 0.05)
    # lounge seating
    for (x, y, r) in ((cx + 6, cy + 2, 0.0), (cx + 6, cy - 3.5, math.pi), (cx + 9.5, cy - 0.7, -math.pi / 2)):
        sofa(c, f"Lobby_sofa{int(x)}", x, y, z0, r, 3.0)
    rug(c, "Lobby_rug", cx + 6, cy - 0.8, z0, 8, 6)
    table(c, "Lobby_coffee", cx + 6, cy - 0.8, z0, 1.8, 1.0, 0.38)
    # feature chandelier: ring of globes
    for k in range(24):
        a = k * math.tau / 24
        for lvl in range(3):
            r = 1.2 + lvl * 0.6
            ball(f"Lobby_chand{k}_{lvl}", c, M("IntLight"), cx + 4 + math.cos(a) * r, cy + 1 + math.sin(a) * r, z0 + h - 1.5 - lvl * 0.9, 0.08)
    area_light(c, "Lobby_chandAL", (cx + 4, cy + 1, z0 + h - 2.5), 4.0, 900)
    # elevator lobby (right end)
    for i in range(4):
        box(f"Lobby_lift{i}", c, M("IntSteel"), cx - 10 + i * 3.0, cy + d / 2 - 1.0, z0, 2.0, 0.2, 2.5)
    box("Lobby_liftwall", c, M("IntMarbleDark"), cx - 5.8, cy + d / 2 - 0.5, z0, 11, 0.2, h)
    for i in range(3):
        plant(c, f"Lobby_plant{i}", cx - 13 + i * 0.2, cy - 6 + i * 6, z0, 1.6)
    ceiling_lights(c, "Lobby", cx, cy, z0 + h, w - 4, d - 4, 4, 3, 160, 1.6)
    area_light(c, "Lobby_fill", (cx, cy + 3, z0 + h - 0.4), 8, 500, (0.8, 0.9, 1.0))


def apartment(c, cx, cy, z0):
    w, d, h = 18.0, 13.0, 3.6
    shell(c, "Apt", cx, cy, z0, w, d, h, floor="IntTimberLight")
    # dividing wall: bedroom wing on right
    box("Apt_div", c, M("IntWall"), cx + 3.5, cy - 3.0, z0, 0.2, 7.0, h)
    box("Apt_div2", c, M("IntWall"), cx + 3.5 + 3.0, cy - 0.2, z0, 6.0, 0.2, h)
    # living zone
    rug(c, "Apt_rug", cx - 4.5, cy + 0.5, z0, 6, 4.5)
    sofa(c, "Apt_sofa1", cx - 6.2, cy - 0.5, z0, 0.0, 3.4)
    sofa(c, "Apt_sofa2", cx - 1.8, cy + 1.2, z0, math.pi, 2.6)
    table(c, "Apt_coffee", cx - 4.2, cy + 0.6, z0, 1.6, 0.9, 0.38)
    box("Apt_tv", c, M("IntTV"), cx - 4.5, cy - 6.3, z0 + 0.9, 2.4, 0.06, 1.3)
    box("Apt_unit", c, M("IntTimber"), cx - 4.5, cy - 6.1, z0 + 0.3, 3.8, 0.4, 0.5)
    plant(c, "Apt_plant1", cx - 8.2, cy + 5.2, z0, 1.3)
    # kitchen (left-back)
    box("Apt_kitchenwall", c, M("IntTimber"), cx - 8.6, cy - 4.0, z0, 0.6, 5.0, 2.4)
    box("Apt_island", c, M("IntMarbleDark"), cx - 6.0, cy - 3.8, z0, 3.2, 1.2, 0.95)
    box("Apt_islandtop", c, M("IntMarble"), cx - 6.0, cy - 3.8, z0 + 0.95, 3.4, 1.4, 0.05)
    for k in range(3):
        chair(c, f"Apt_stool{k}", cx - 6.9 + k * 0.9, cy - 2.7, z0 + 0.25, math.pi)
    # dining
    table(c, "Apt_dining", cx + 0.4, cy - 3.5, z0, 2.6, 1.1, 0.76, "IntTimber")
    for k in range(3):
        chair(c, f"Apt_dch{k}a", cx - 0.6 + k * 1.0, cy - 2.6, z0, math.pi)
        chair(c, f"Apt_dch{k}b", cx - 0.6 + k * 1.0, cy - 4.4, z0, 0.0)
    pendant(c, "Apt_pend", cx + 0.4, cy - 3.5, z0 + h, 0.6, 1.1)
    # master bedroom
    bed(c, "Apt_bed", cx + 9.0, cy - 3.8, z0, 0.0)
    box("Apt_wardrobe", c, M("IntTimber"), cx + 12.0, cy - 2.5, z0, 0.6, 3.0, 2.4)
    # balcony
    box("Apt_balc", c, M("IntMarble"), cx, cy + d / 2 + 1.3, z0 - 0.3, w, 2.6, 0.3)
    box("Apt_balcrail", c, M("IntGlass"), cx, cy + d / 2 + 2.55, z0, w, 0.04, 1.1)
    box("Apt_balcrailtop", c, M("IntBronze"), cx, cy + d / 2 + 2.55, z0 + 1.1, w, 0.08, 0.04)
    for k in range(3):
        chair(c, f"Apt_bch{k}", cx - 5 + k * 2.2, cy + d / 2 + 1.4, z0, math.pi, "IntFabric")
    table(c, "Apt_btable", cx - 3.9, cy + d / 2 + 1.4, z0, 0.7, 0.7, 0.5)
    ceiling_lights(c, "Apt", cx, cy, z0 + h, w - 2, d - 2, 4, 3, 60, 0.9)
    area_light(c, "Apt_fill", (cx, cy + 1, z0 + h - 0.3), 10, 300, (0.9, 0.95, 1.0))


def penthouse(c, cx, cy, z0):
    w, d, h = 26.0, 16.0, 6.2     # double-height living
    shell(c, "Pent", cx, cy, z0, w, d, h, floor="IntMarble")
    # mezzanine + feature staircase
    box("Pent_mezz", c, M("IntTimberLight"), cx + 6, cy - 4.5, z0 + 3.0, 13.0, 7.0, 0.3)
    for k in range(15):
        box(f"Pent_step{k}", c, M("IntMarble"), cx - 3.2 + k * 0.2, cy - 5.2 + k * 0.35 * 0, z0 + 0.2 * k, 1.4, 1.2, 0.2) if False else None
    for k in range(15):
        a = k * 0.28
        box(f"Pent_step{k}", c, M("IntMarble"), cx - 1.2 + math.cos(a) * 2.2, cy - 4.5 + math.sin(a) * 2.2, z0 + 0.2 * k, 1.5, 0.55, 0.12, a + math.pi / 2)
    cyl("Pent_stairpost", c, M("IntBronze"), cx - 1.2, cy - 4.5, z0, 0.12, 3.2, 12)
    box("Pent_mezzrail", c, M("IntGlass"), cx, cy - 1.0, z0 + 3.3, 6.5, 0.04, 1.0)
    # living / lounge
    rug(c, "Pent_rug", cx - 3.5, cy + 1.0, z0, 9, 6.5)
    sofa(c, "Pent_sofaA", cx - 6.0, cy - 1.2, z0, 0.0, 4.2)
    sofa(c, "Pent_sofaB", cx - 1.0, cy + 1.6, z0, math.pi, 3.6)
    sofa(c, "Pent_sofaC", cx - 8.0, cy + 1.8, z0, -math.pi / 2, 3.0)
    table(c, "Pent_coffee", cx - 4.8, cy + 0.9, z0, 2.0, 1.2, 0.36)
    # chandelier: tiers of globes
    for k in range(36):
        a = k * math.tau / 36
        for lvl in range(4):
            r = 0.7 + lvl * 0.45
            ball(f"Pent_chand{k}_{lvl}", c, M("IntLight"), cx - 4 + math.cos(a) * r, cy + 1 + math.sin(a) * r, z0 + h - 1.2 - lvl * 0.7, 0.07)
    area_light(c, "Pent_chandAL", (cx - 4, cy + 1, z0 + h - 2.4), 3.5, 700)
    # kitchen
    box("Pent_island", c, M("IntMarbleDark"), cx + 6.0, cy + 2.0, z0, 4.8, 1.4, 1.0)
    box("Pent_islandtop", c, M("IntMarble"), cx + 6.0, cy + 2.0, z0 + 1.0, 5.0, 1.6, 0.05)
    box("Pent_kitchenback", c, M("IntTimber"), cx + 6.0, cy - 7.4, z0, 10, 0.6, 2.6)
    for k in range(4):
        chair(c, f"Pent_stool{k}", cx + 4.2 + k * 1.2, cy + 3.0, z0 + 0.3, math.pi)
    # terrace with infinity edge
    box("Pent_terrace", c, M("IntTimberLight"), cx, cy + d / 2 + 3.2, z0 - 0.3, w + 4, 6.4, 0.3)
    box("Pent_rail", c, M("IntGlass"), cx, cy + d / 2 + 6.4, z0, w + 4, 0.04, 1.2)
    box("Pent_railtop", c, M("IntBronze"), cx, cy + d / 2 + 6.4, z0 + 1.2, w + 4, 0.08, 0.04)
    box("Pent_plunge", c, M("PoolWater"), cx + 6, cy + d / 2 + 3.6, z0 - 0.25, 8, 3.0, 0.2)
    for k in range(3):
        box(f"Pent_lounger{k}", c, M("IntWhite"), cx - 7 + k * 2.0, cy + d / 2 + 3.2, z0, 0.8, 2.0, 0.4, math.pi / 2 * 0)
    ceiling_lights(c, "Pent", cx, cy, z0 + h, w - 4, d - 3, 5, 3, 90, 1.0)
    area_light(c, "Pent_fill", (cx, cy + 2, z0 + h - 0.3), 14, 500, (0.9, 0.95, 1.0))


def office(c, cx, cy, z0):
    w, d, h = 32.0, 18.0, 3.6
    shell(c, "Off", cx, cy, z0, w, d, h, floor="IntMarbleDark")
    box("Off_carpet", c, M("IntFabricDark"), cx + 4, cy - 2, z0, 20, 12, 0.02)
    # reception
    box("Off_recdesk", c, M("IntTimber"), cx - 12, cy - 5.5, z0, 4.5, 1.1, 1.1)
    box("Off_rectop", c, M("IntMarble"), cx - 12, cy - 5.5, z0 + 1.1, 4.8, 1.3, 0.05)
    box("Off_logo", c, M("IntLight"), cx - 12, cy - d / 2 + 0.1, z0 + 1.6, 3.5, 0.04, 0.5)
    sofa(c, "Off_recsofa", cx - 12, cy + 0.5, z0, math.pi, 2.8, "IntLeather")
    # open plan desks
    for r in range(3):
        for k in range(4):
            x = cx - 4 + k * 4.2
            y = cy - 5.5 + r * 3.6
            box(f"Off_desk{r}{k}", c, M("IntWhite"), x, y, z0 + 0.72, 1.8, 0.8, 0.04)
            box(f"Off_deskleg{r}{k}", c, M("IntSteel"), x, y, z0, 1.7, 0.7, 0.72) if False else None
            for dx in (-0.8, 0.8):
                box(f"Off_dl{r}{k}{dx}", c, M("IntSteel"), x + dx, y, z0, 0.05, 0.7, 0.72)
            box(f"Off_mon{r}{k}", c, M("IntBlack"), x, y - 0.25, z0 + 0.76, 0.7, 0.04, 0.4)
            chair(c, f"Off_ch{r}{k}", x, y + 0.9, z0, math.pi, "IntFabricDark")
    # glass meeting rooms (right)
    for i in range(2):
        mx = cx + 12.5
        my = cy - 3.5 + i * 7.5
        box(f"Off_mr{i}_glassF", c, M("IntGlass"), mx, my - 3.0, z0, 6, 0.05, h)
        box(f"Off_mr{i}_glassB", c, M("IntGlass"), mx, my + 3.0, z0, 6, 0.05, h)
        box(f"Off_mr{i}_glassL", c, M("IntGlass"), mx - 3, my, z0, 0.05, 6, h)
        box(f"Off_mr{i}_frame", c, M("IntBronze"), mx, my - 3.0, z0 + 2.4, 6, 0.08, 0.06)
        table(c, f"Off_mrtable{i}", mx + 0.2, my, z0, 3.0, 1.3, 0.75, "IntTimber")
        for k in range(3):
            chair(c, f"Off_mrch{i}{k}a", mx - 0.8 + k * 1.0, my - 1.0, z0, 0.0, "IntFabricDark")
            chair(c, f"Off_mrch{i}{k}b", mx - 0.8 + k * 1.0, my + 1.0, z0, math.pi, "IntFabricDark")
    # boardroom/executive office hint: executive desk near window left
    table(c, "Off_exec", cx - 1.0, cy + 6.0, z0, 2.4, 1.1, 0.76, "IntTimber")
    chair(c, "Off_execchair", cx - 1.0, cy + 7.0, z0, 0.0, "IntLeather")
    plant(c, "Off_plant", cx - 15, cy + 7, z0, 1.4)
    ceiling_lights(c, "Off", cx, cy, z0 + h, w - 2, d - 2, 6, 3, 60, 1.2)
    area_light(c, "Off_fill", (cx, cy + 1, z0 + h - 0.3), 12, 400, (0.9, 0.95, 1.0))


def build_interiors():
    mats()
    isets = P["site"]["interior_sets"]
    c = sub("INTERIORS")
    lobby(c, -620, -520, 0.5)
    f = T["showcase_floors"]
    apartment(c, isets["apartment"][0], isets["apartment"][1], floor_z(f["apartment"]))
    penthouse(c, isets["penthouse"][0], isets["penthouse"][1], floor_z(f["penthouse"]))
    office(c, isets["office"][0], isets["office"][1], floor_z(f["office"]))
