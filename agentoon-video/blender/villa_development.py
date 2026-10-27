"""Agentoon.ai villa development: empty land -> two villas rise -> trees, pool, people -> car through the gate -> interior.

Procedural low-poly scene with keyframed construction, people, car and six cameras (hard cuts via timeline markers).
Vertical 9:16 (1080x1920), 24 fps, frames 1-720 (30 s). Needs Blender 4.2+ (written against the 5.2 API).

Run (any one):
  Blender UI:     Scripting tab > open this file > Run Script, or send it through your Blender MCP
  Command line:   blender -b -P villa_development.py -- --stills out/stills --samples 16
                  blender -b -P villa_development.py -- --video out/villa.mp4 --samples 32
                  blender -b -P villa_development.py -- --save out/villa.blend

Beats (frames): A empty land 1-96 | B construction 97-240 | C finished + trees + pool 241-360 |
                D people 361-456 | E car + gate 457-552 | F interior 553-720
Re-running rebuilds the scene (it only removes its own AGENTOON_VILLA collection and markers).
"""
import math
import os
import random
import sys

import bpy
import bmesh

random.seed(7)
S = bpy.context.scene
ROOT = "AGENTOON_VILLA"

A0, A1 = 1, 96
B0, B1 = 97, 240
C0, C1 = 241, 360
D0, D1 = 361, 456
E0, E1 = 457, 552
F0, F1 = 553, 720
HOLE = (-4.5, 5.5, 8.5, 13.0)  # pool recess x0, x1, y0, y1


# ----------------------------------------------------------------------------- helpers
def reset():
    root = bpy.data.collections.get(ROOT)
    if root:
        for c in list(root.children_recursive) + [root]:
            for o in list(c.objects):
                bpy.data.objects.remove(o, do_unlink=True)
            bpy.data.collections.remove(c)
    S.timeline_markers.clear()


def coll(name):
    root = bpy.data.collections.get(ROOT)
    if root is None:
        root = bpy.data.collections.new(ROOT)
        S.collection.children.link(root)
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        root.children.link(c)
    return c


def mat(name, color, rough=0.6, metal=0.0, alpha=1.0, emit=None, strength=0.0):
    name = "AGV_" + name
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Alpha"].default_value = alpha
    if emit is not None:
        b.inputs["Emission Color"].default_value = (emit[0], emit[1], emit[2], 1.0)
        b.inputs["Emission Strength"].default_value = strength
    if alpha < 1.0:
        m.surface_render_method = "BLENDED"
    return m


MATS = {}


def M(name):
    return MATS[name]


def make_materials():
    d = {
        "sand": mat("sand", (0.62, 0.52, 0.36), 0.95),
        "earth": mat("earth", (0.34, 0.23, 0.14), 0.95),
        "stake": mat("stake", (0.9, 0.35, 0.05), 0.5),
        "wood_stake": mat("wood_stake", (0.45, 0.32, 0.2), 0.8),
        "tile": mat("tile", (0.45, 0.82, 0.92), 0.25),
        "coping": mat("coping", (0.93, 0.92, 0.88), 0.5),
        "water": mat("water", (0.1, 0.55, 0.85), 0.05, alpha=0.65, emit=(0.05, 0.4, 0.7), strength=0.25),
        "plaster": mat("plaster", (0.93, 0.91, 0.86), 0.85),
        "plaster2": mat("plaster2", (0.78, 0.74, 0.68), 0.85),
        "frame": mat("frame", (0.07, 0.07, 0.08), 0.4, metal=0.6),
        "glass": mat("glass", (0.55, 0.75, 0.88), 0.05, alpha=0.25),
        "roof": mat("roof", (0.16, 0.16, 0.18), 0.7),
        "deck": mat("deck", (0.45, 0.3, 0.18), 0.6),
        "grass": mat("grass", (0.18, 0.45, 0.14), 0.9),
        "leaf": mat("leaf", (0.1, 0.38, 0.1), 0.8),
        "leaf2": mat("leaf2", (0.2, 0.5, 0.15), 0.8),
        "trunk": mat("trunk", (0.3, 0.2, 0.1), 0.9),
        "asphalt": mat("asphalt", (0.11, 0.11, 0.12), 0.9),
        "paving": mat("paving", (0.72, 0.7, 0.66), 0.8),
        "car": mat("car", (0.7, 0.04, 0.04), 0.25, metal=0.6),
        "tire": mat("tire", (0.03, 0.03, 0.03), 0.9),
        "headlight": mat("headlight", (1, 1, 0.9), 0.2, emit=(1, 0.95, 0.8), strength=8.0),
        "skin": mat("skin", (0.75, 0.55, 0.42), 0.6),
        "hair": mat("hair", (0.05, 0.04, 0.03), 0.8),
        "pants": mat("pants", (0.12, 0.14, 0.2), 0.8),
        "oak": mat("oak", (0.55, 0.38, 0.22), 0.4),
        "sofa": mat("sofa", (0.35, 0.36, 0.4), 0.9),
        "rug": mat("rug", (0.8, 0.75, 0.65), 0.95),
        "stone": mat("stone", (0.95, 0.95, 0.93), 0.3),
        "lamp": mat("lamp", (1, 0.9, 0.7), 0.3, emit=(1, 0.8, 0.5), strength=10.0),
        "umbrella": mat("umbrella", (0.95, 0.93, 0.88), 0.7),
        "lounger": mat("lounger", (0.9, 0.9, 0.9), 0.6),
    }
    MATS.update(d)


def _mk(name, bm, loc, m, c):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    o = bpy.data.objects.new(name, mesh)
    o.location = loc
    if m is not None:
        o.data.materials.append(m)
    c.objects.link(o)
    return o


def box(name, cx, cy, zb, sx, sy, sz, m, c):
    """Box with its origin at the bottom centre, so scaling Z grows it upward."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z = (v.co.z + 0.5) * sz
    return _mk(name, bm, (cx, cy, zb), m, c)


def cyl(name, cx, cy, zb, r1, h, m, c, r2=None, seg=16):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=(r1 if r2 is None else r2), depth=h)
    for v in bm.verts:
        v.co.z += h / 2
    return _mk(name, bm, (cx, cy, zb), m, c)


def cyl_x(name, loc, r, length, m, c, seg=20):
    """Cylinder whose axle runs along local X (wheels)."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=length)
    for v in bm.verts:
        v.co.x, v.co.z = v.co.z, -v.co.x
    return _mk(name, bm, loc, m, c)


def ball(name, cx, cy, cz, r, m, c, sz=1.0):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r)
    for v in bm.verts:
        v.co.z *= sz
    o = _mk(name, bm, (cx, cy, cz), m, c)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def empty(name, loc, c, parent=None):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    c.objects.link(o)
    if parent is not None:
        o.parent = parent
    return o


def child(o, parent, loc=None):
    o.parent = parent
    if loc is not None:
        o.location = loc
    return o


def interp(kind):
    bpy.context.preferences.edit.keyframe_new_interpolation_type = kind


def key(o, path, frame, value):
    setattr(o, path, value)
    o.keyframe_insert(data_path=path, frame=frame)


def rects_minus_hole(X0, X1, Y0, Y1, hx0, hx1, hy0, hy1):
    return [(X0, X1, Y0, hy0), (X0, X1, hy1, Y1), (X0, hx0, hy0, hy1), (hx1, X1, hy0, hy1)]


def grow(o, f0, f1, kind="SINE", z_only=True):
    """Hidden until f0, then grows from nothing to full size by f1."""
    lo = (1, 1, 0.001) if z_only else (0.001, 0.001, 0.001)
    if f0 > 1:
        interp("CONSTANT")
        key(o, "scale", 1, lo)
    interp(kind)
    key(o, "scale", f0, lo)
    key(o, "scale", f1, (1, 1, 1))


def appear(o, f):
    """Instant switch on at frame f."""
    interp("CONSTANT")
    key(o, "scale", 1, (0.001, 0.001, 0.001))
    key(o, "scale", f - 1, (0.001, 0.001, 0.001))
    key(o, "scale", f, (1, 1, 1))


def vanish(o, f):
    interp("CONSTANT")
    key(o, "scale", 1, (1, 1, 1))
    key(o, "scale", f - 1, (1, 1, 1))
    key(o, "scale", f, (0.001, 0.001, 0.001))


def yaw_for(dx, dy):
    """Z rotation that turns a +Y-facing model toward (dx, dy)."""
    return math.atan2(-dx, dy)


def unwrap(prev, ang):
    while ang - prev > math.pi:
        ang -= 2 * math.pi
    while ang - prev < -math.pi:
        ang += 2 * math.pi
    return ang


def chaikin(pts, it=3):
    for _ in range(it):
        out = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            out.append((0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]))
            out.append((0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]))
        out.append(pts[-1])
        pts = out
    return pts


def path_length(pts):
    return sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:]))


def point_at(pts, dist):
    """Point and heading at arc-length dist along a polyline (clamped)."""
    dist = max(0.0, min(dist, path_length(pts)))
    run = 0.0
    for a, b in zip(pts, pts[1:]):
        seg = math.hypot(b[0] - a[0], b[1] - a[1]) or 1e-9
        if run + seg >= dist:
            u = (dist - run) / seg
            return (a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u), (b[0] - a[0], b[1] - a[1])
        run += seg
    a, b = pts[-2], pts[-1]
    return b, (b[0] - a[0], b[1] - a[1])


def aim(pos, target):
    """Euler angles (XYZ) that point a Blender camera (looks down -Z) from pos at target."""
    dx, dy, dz = target[0] - pos[0], target[1] - pos[1], target[2] - pos[2]
    horiz = math.hypot(dx, dy)
    return (math.pi / 2 + math.atan2(dz, horiz), 0.0, math.atan2(-dx, dy))


# ----------------------------------------------------------------------------- scene setup
def setup_scene():
    ids = [e.identifier for e in S.render.bl_rna.properties["engine"].enum_items]
    S.render.engine = next((i for i in ids if i.startswith("BLENDER_EEVEE")), "BLENDER_EEVEE")
    S.render.resolution_x = 1080
    S.render.resolution_y = 1920
    S.render.resolution_percentage = 100
    S.render.fps = 24
    S.frame_start = 1
    S.frame_end = 720
    try:
        S.view_settings.view_transform = "AgX"
    except Exception:
        pass
    w = S.world or bpy.data.worlds.new("World")
    S.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.42, 0.62, 0.92, 1.0)
    bg.inputs["Strength"].default_value = 1.0

    L = coll("LIGHTS")
    sun = bpy.data.lights.new("LGT_key", "SUN")
    sun.energy = 4.5
    sun.angle = math.radians(2.0)
    sun.color = (1.0, 0.95, 0.85)
    so = bpy.data.objects.new("LGT_key", sun)
    so.location = (0, 0, 40)
    so.rotation_euler = (math.radians(48), math.radians(8), math.radians(-38))
    L.objects.link(so)
    fill = bpy.data.lights.new("LGT_fill", "POINT")
    fill.energy = 4000
    fill.shadow_soft_size = 12
    fill.color = (0.75, 0.85, 1.0)
    fo = bpy.data.objects.new("LGT_fill", fill)
    fo.location = (10, -45, 30)
    L.objects.link(fo)


def build_ground():
    E = coll("ENV")
    for i, (x0, x1, y0, y1) in enumerate(rects_minus_hole(-200, 200, -200, 200, *HOLE)):
        box(f"ENV_ground_{i}", (x0 + x1) / 2, (y0 + y1) / 2, -3.0, x1 - x0, y1 - y0, 3.0, M("sand"), E)
    for i, (x0, x1, y0, y1) in enumerate(rects_minus_hole(-40, 40, -30, 30, *HOLE)):
        box(f"ENV_plot_earth_{i}", (x0 + x1) / 2, (y0 + y1) / 2, 0.0, x1 - x0, y1 - y0, 0.03, M("earth"), E)
    cx, cy = (HOLE[0] + HOLE[1]) / 2, (HOLE[2] + HOLE[3]) / 2
    pw, pd = HOLE[1] - HOLE[0], HOLE[3] - HOLE[2]
    box("ENV_pool_floor", cx, cy, -1.5, pw, pd, 0.05, M("tile"), E)
    box("ENV_pool_wall_W", HOLE[0] + 0.025, cy, -1.5, 0.05, pd, 1.5, M("tile"), E)
    box("ENV_pool_wall_E", HOLE[1] - 0.025, cy, -1.5, 0.05, pd, 1.5, M("tile"), E)
    box("ENV_pool_wall_S", cx, HOLE[2] + 0.025, -1.5, pw, 0.05, 1.5, M("tile"), E)
    box("ENV_pool_wall_N", cx, HOLE[3] - 0.025, -1.5, pw, 0.05, 1.5, M("tile"), E)
    water = box("ENV_pool_water", cx, cy, -0.18, pw - 0.1, pd - 0.1, 0.01, M("water"), E)
    appear(water, C0 + 10)

    stakes = coll("STAKES")
    pts = [(-40, -30), (40, -30), (-40, 30), (40, 30), (0, 30), (-40, 0), (40, 0), (-20, -30), (20, -30)]
    for i, (x, y) in enumerate(pts):
        a = cyl(f"ENV_stake_{i}", x, y, 0, 0.06, 1.2, M("wood_stake"), stakes, seg=8)
        b = cyl(f"ENV_stake_tip_{i}", x, y, 1.2, 0.09, 0.25, M("stake"), stakes, r2=0.0, seg=8)
        vanish(a, B0 + 20)
        vanish(b, B0 + 20)


# ----------------------------------------------------------------------------- villas
def wall_x(name, y, xa, xb, zb, h, openings, thick, m, c, out, glass_out):
    """Wall running along X at fixed y with openings (o0, o1, lo, hi) measured from zb."""
    segs, cur = [], xa
    for o0, o1, lo, hi in sorted(openings):
        o0, o1 = max(o0, xa), min(o1, xb)
        if o1 <= o0:
            continue
        if o0 > cur:
            segs.append((cur, o0, zb, h))
        if lo > 0:
            segs.append((o0, o1, zb, lo))
        if hi < h:
            segs.append((o0, o1, zb + hi, h - hi))
        glass_out.append(box(f"{name}_glass", (o0 + o1) / 2, y, zb + lo, o1 - o0, 0.06, hi - lo, M("glass"), c))
        cur = o1
    if xb > cur:
        segs.append((cur, xb, zb, h))
    for i, (a, b, z0, hh) in enumerate(segs):
        out.append(box(f"{name}_{i}", (a + b) / 2, y, z0, b - a, thick, hh, m, c))


def wall_y(name, x, ya, yb, zb, h, openings, thick, m, c, out, glass_out):
    segs, cur = [], ya
    for o0, o1, lo, hi in sorted(openings):
        o0, o1 = max(o0, ya), min(o1, yb)
        if o1 <= o0:
            continue
        if o0 > cur:
            segs.append((cur, o0, zb, h))
        if lo > 0:
            segs.append((o0, o1, zb, lo))
        if hi < h:
            segs.append((o0, o1, zb + hi, h - hi))
        glass_out.append(box(f"{name}_glass", x, (o0 + o1) / 2, zb + lo, 0.06, o1 - o0, hi - lo, M("glass"), c))
        cur = o1
    if yb > cur:
        segs.append((cur, yb, zb, h))
    for i, (a, b, z0, hh) in enumerate(segs):
        out.append(box(f"{name}_{i}", x, (a + b) / 2, z0, thick, b - a, hh, m, c))


def evenly(a, b, n, width, lo, hi):
    """n windows spread evenly between a and b."""
    step = (b - a) / n
    width = min(width, step - 0.4)
    return [(a + step * (i + 0.5) - width / 2, a + step * (i + 0.5) + width / 2, lo, hi) for i in range(n)]


def villa(tag, cx, cy, w, d, f0, door_x, u0, u1, plaster="plaster"):
    c = coll(f"VILLA_{tag}")
    t = 0.3
    x0, x1, y0, y1 = cx - w / 2, cx + w / 2, cy - d / 2, cy + d / 2
    found, g1, slab, g2, roof, glass = [], [], [], [], [], []
    found.append(box(f"{tag}_foundation", cx, cy, 0, w + 1.0, d + 1.0, 0.3, M("plaster2"), c))
    z1, h1 = 0.3, 3.2
    # ground floor
    if door_x is None:
        front = evenly(x0 + 1, x1 - 1, 4, 2.4, 0.9, 2.5)
    else:
        front = [(door_x - 1.2, door_x + 1.2, 0, 2.6)]
        front += evenly(x0 + 1, door_x - 1.6, 2, 2.4, 0.9, 2.5)
        front += evenly(door_x + 1.6, x1 - 1, 2, 2.4, 0.9, 2.5)
    wall_x(f"{tag}_g1_S", y0 + t / 2, x0, x1, z1, h1, front, t, M(plaster), c, g1, glass)
    wall_x(f"{tag}_g1_N", y1 - t / 2, x0, x1, z1, h1, [(x0 + 1.5, x1 - 1.5, 0, 2.8)], t, M(plaster), c, g1, glass)
    wall_y(f"{tag}_g1_W", x0 + t / 2, y0 + t, y1 - t, z1, h1, [(cy - 2, cy + 2, 0.9, 2.4)], t, M(plaster), c, g1, glass)
    wall_y(f"{tag}_g1_E", x1 - t / 2, y0 + t, y1 - t, z1, h1, [(cy - 2, cy + 2, 0.9, 2.4)], t, M(plaster), c, g1, glass)
    # first-floor slab (also the lower roof)
    z2 = z1 + h1
    slab.append(box(f"{tag}_slab2", cx, cy, z2, w + 0.8, d + 0.8, 0.3, M("plaster2"), c))
    # second floor over u0..u1
    zz, h2 = z2 + 0.3, 3.0
    n = max(2, int((u1 - u0) // 4))
    wall_x(f"{tag}_g2_S", y0 + t / 2, u0, u1, zz, h2, evenly(u0 + 0.5, u1 - 0.5, n, 2.2, 0.8, 2.3), t, M(plaster), c, g2, glass)
    wall_x(f"{tag}_g2_N", y1 - t / 2, u0, u1, zz, h2, evenly(u0 + 0.5, u1 - 0.5, n, 2.2, 0.8, 2.3), t, M(plaster), c, g2, glass)
    wall_y(f"{tag}_g2_W", u0 + t / 2, y0 + t, y1 - t, zz, h2, [(cy - 2, cy + 2, 0.8, 2.3)], t, M(plaster), c, g2, glass)
    wall_y(f"{tag}_g2_E", u1 - t / 2, y0 + t, y1 - t, zz, h2, [(cy - 2, cy + 2, 0.8, 2.3)], t, M(plaster), c, g2, glass)
    roof.append(box(f"{tag}_roof", (u0 + u1) / 2, cy, zz + h2, (u1 - u0) + 1.6, d + 1.6, 0.35, M("roof"), c))

    stages = [(found, 0, 16), (g1, 14, 52), (slab, 50, 64), (g2, 62, 96), (roof, 94, 112)]
    for objs, s, e in stages:
        for i, o in enumerate(objs):
            st = f0 + s + (i % 6)
            grow(o, st, min(st + (e - s), f0 + e + 6))
    for o in glass:
        grow(o, f0 + 100, f0 + 108, "BACK", z_only=False)
    return {"coll": c, "x0": x0, "x1": x1, "y0": y0, "y1": y1, "z1": z1}


def front_doors(v, door_x, f0):
    c = v["coll"]
    y, z = v["y0"] + 0.15, v["z1"]
    for side, hinge, off, ang in (("L", door_x - 1.2, 0.6, 100.0), ("R", door_x + 1.2, -0.6, -100.0)):
        piv = empty(f"HERO_door_{side}_pivot", (hinge, y, z), c)
        panel = box(f"HERO_door_{side}", 0, 0, 0, 1.2, 0.08, 2.6, M("frame"), c)
        child(panel, piv, (off, 0, 0))
        appear(piv, f0 + 100)
        interp("SINE")
        key(piv, "rotation_euler", F0 + 3, (0, 0, 0))
        key(piv, "rotation_euler", F0 + 28, (0, 0, math.radians(ang)))


def build_interior(v, f_on):
    c = coll("INTERIOR")
    z = v["z1"]
    items = []

    def add(o):
        appear(o, f_on)
        items.append(o)
        return o

    add(box("INT_floor", -16, 6, z, 15.4, 11.4, 0.02, M("oak"), c))
    add(box("INT_rug", -20.2, 5.6, z + 0.02, 4.2, 3.2, 0.02, M("rug"), c))
    add(box("INT_sofa_seat", -20.2, 3.95, z, 3.6, 1.0, 0.45, M("sofa"), c))
    add(box("INT_sofa_back", -20.2, 3.4, z, 3.6, 0.25, 0.95, M("sofa"), c))
    add(box("INT_sofa_arm_L", -22.15, 3.95, z, 0.3, 1.0, 0.65, M("sofa"), c))
    add(box("INT_sofa_arm_R", -18.25, 3.95, z, 0.3, 1.0, 0.65, M("sofa"), c))
    add(box("INT_coffee_table", -20.2, 6.2, z + 0.02, 1.6, 0.9, 0.4, M("deck"), c))
    add(box("INT_island", -12, 6.5, z, 3.2, 1.2, 0.95, M("stone"), c))
    for i, sx in enumerate((-13.0, -12.0, -11.0)):
        add(cyl(f"INT_stool_{i}", sx, 5.5, z, 0.2, 0.7, M("frame"), c))
        pend = add(ball(f"INT_pendant_{i}", sx, 6.5, z + 2.7, 0.2, M("lamp"), c))
        add(cyl(f"INT_pendant_wire_{i}", sx, 6.5, z + 2.9, 0.01, 0.3, M("frame"), c, seg=6))
    add(box("INT_dining_table", -11.8, 9.8, z, 2.4, 1.0, 0.75, M("deck"), c))
    for i, (px, py) in enumerate(((-12.5, 8.8), (-11.1, 8.8), (-12.5, 10.8), (-11.1, 10.8))):
        add(box(f"INT_chair_{i}", px, py, z, 0.45, 0.45, 0.85, M("sofa"), c))
    add(cyl("INT_plant_pot", -22.8, 10.8, z, 0.3, 0.5, M("stone"), c))
    add(ball("INT_plant_leaves", -22.8, 10.8, z + 1.1, 0.6, M("leaf2"), c))
    add(box("INT_wall_art", -23.55, 6.5, z + 1.3, 0.08, 2.0, 1.2, M("frame"), c))
    # warm interior lights, on from just before the camera goes in
    for i, (lx, ly) in enumerate(((-16, 5), (-19, 9))):
        ld = bpy.data.lights.new(f"LGT_int_{i}", "POINT")
        ld.shadow_soft_size = 0.4
        ld.color = (1.0, 0.82, 0.6)
        lo = bpy.data.objects.new(f"LGT_int_{i}", ld)
        lo.location = (lx, ly, z + 2.8)
        c.objects.link(lo)
        interp("CONSTANT")
        ld.energy = 0
        ld.keyframe_insert("energy", frame=1)
        ld.energy = 300
        ld.keyframe_insert("energy", frame=F0 - 12)
    return items


# ----------------------------------------------------------------------------- landscape
def tree(name, x, y, s, f, c):
    root = empty(name, (x, y, 0), c)
    child(cyl(f"{name}_trunk", 0, 0, 0, 0.28 * s, 2.8 * s, M("trunk"), c, r2=0.2 * s, seg=8), root)
    child(ball(f"{name}_crown_a", 0, 0, 4.0 * s, 1.9 * s, M("leaf"), c, sz=0.9), root)
    child(ball(f"{name}_crown_b", 0.9 * s, 0.4 * s, 3.4 * s, 1.3 * s, M("leaf2"), c, sz=0.9), root)
    child(ball(f"{name}_crown_c", -0.8 * s, -0.5 * s, 3.5 * s, 1.2 * s, M("leaf"), c, sz=0.9), root)
    grow(root, f, f + 16, "BACK", z_only=False)


def palm(name, x, y, f, c):
    root = empty(name, (x, y, 0), c)
    root.rotation_euler = (0, 0, random.uniform(0, 6.28))
    child(cyl(f"{name}_trunk", 0, 0, 0, 0.22, 5.0, M("trunk"), c, r2=0.14, seg=8), root)
    for i in range(8):
        leaf = box(f"{name}_leaf_{i}", 0, 0, 0, 0.35, 2.8, 0.06, M("leaf2"), c)
        piv = empty(f"{name}_leafpiv_{i}", (0, 0, 5.0), c, root)
        piv.rotation_euler = (0, 0, math.radians(i * 45))
        child(leaf, piv, (0, 1.3, 0))
        leaf.rotation_euler = (math.radians(-25), 0, 0)
    grow(root, f, f + 14, "BACK", z_only=False)


def build_landscape():
    c = coll("LANDSCAPE")
    # pool deck and coping
    px0, px1, py0, py1 = HOLE
    m = 0.35
    for i, (x0, x1, y0, y1) in enumerate(rects_minus_hole(px0 - m, px1 + m, py0 - m, py1 + m, px0, px1, py0, py1)):
        o = box(f"LND_coping_{i}", (x0 + x1) / 2, (y0 + y1) / 2, 0.03, x1 - x0, y1 - y0, 0.1, M("coping"), c)
        grow(o, C0 + 4, C0 + 14)
    for i, (x0, x1, y0, y1) in enumerate(rects_minus_hole(-7.0, 8.5, 5.0, 16.5, px0 - m, px1 + m, py0 - m, py1 + m)):
        o = box(f"LND_deck_{i}", (x0 + x1) / 2, (y0 + y1) / 2, 0.03, x1 - x0, y1 - y0, 0.07, M("deck"), c)
        grow(o, C0 + 2, C0 + 14)
    # loungers and umbrella
    for i, ly in enumerate((8.8, 10.4, 12.0)):
        b = box(f"LND_lounger_{i}", 7.0, ly, 0.1, 0.7, 1.9, 0.3, M("lounger"), c)
        bk = box(f"LND_lounger_back_{i}", 7.0, ly + 0.95, 0.35, 0.7, 0.9, 0.06, M("lounger"), c)
        bk.rotation_euler = (math.radians(-50), 0, 0)
        grow(b, C0 + 18, C0 + 28)
        grow(bk, C0 + 18, C0 + 28)
    pole = cyl("LND_umbrella_pole", 7.6, 14.2, 0.1, 0.04, 2.3, M("frame"), c, seg=8)
    top = cyl("LND_umbrella_top", 7.6, 14.2, 2.3, 1.5, 0.45, M("umbrella"), c, r2=0.05, seg=12)
    grow(pole, C0 + 20, C0 + 30)
    grow(top, C0 + 22, C0 + 32)
    # driveway, forecourt, lawns
    paving = [
        ("drive", 0, -17, 5.6, 26, "asphalt"),
        ("connector", -11, -6.5, 26.4, 5, "asphalt"),
        ("forecourt", -16, -2.2, 16, 3.6, "paving"),
    ]
    for i, (nm, px, py, sx, sy, mm) in enumerate(paving):
        o = box(f"LND_{nm}", px, py, 0.03, sx, sy, 0.05, M(mm), c)
        grow(o, B1 - 30 + i * 4, B1 - 14 + i * 4)
    lawns = [(-38, -4, -29, -10), (4, 38, -29, -5), (-38, 38, 15, 29), (-38, -26, 0, 15), (11, 38, -5, 15)]
    for i, (x0, x1, y0, y1) in enumerate(lawns):
        o = box(f"LND_lawn_{i}", (x0 + x1) / 2, (y0 + y1) / 2, 0.03, x1 - x0, y1 - y0, 0.04, M("grass"), c)
        grow(o, C0 + i * 4, C0 + 24 + i * 4)
    # trees and palms
    spots = [(-36, -24, 1.1), (-30, -26, 0.9), (-36, -6, 1.0), (-37, 12, 1.2), (-35, 26, 1.1), (-26, 24, 0.9),
             (-12, 25, 1.0), (-20, 20, 1.2), (4, 22, 1.0), (18, 20, 1.1), (30, 24, 1.2), (36, 10, 1.0),
             (36, -10, 1.1), (34, -24, 1.0), (24, -26, 0.9), (12, -24, 1.0), (-12, -22, 1.1), (-22, -20, 1.0)]
    for i, (x, y, s) in enumerate(spots):
        tree(f"LND_tree_{i}", x, y, s, C0 + 6 + i * 3, c)
    for i, y in enumerate((-28, -23, -18, -13)):
        palm(f"LND_palm_L{i}", -4.2, y, C0 + 10 + i * 4, c)
        palm(f"LND_palm_R{i}", 4.2, y, C0 + 12 + i * 4, c)
    # perimeter wall with a gap for the gate (x -3..3 on the south side)
    wall_pieces = [(-40, -3, -30), (3, 40, -30), (-40, 40, 30)]
    for i, (xa, xb, y) in enumerate(wall_pieces):
        o = box(f"LND_wall_S{i}", (xa + xb) / 2, y, 0.03, xb - xa, 0.3, 2.2, M("plaster2"), c)
        grow(o, B0 + 100 + i * 8, B0 + 128 + i * 8)
    for i, x in enumerate((-40, 40)):
        o = box(f"LND_wall_side_{i}", x, 0, 0.03, 0.3, 60, 2.2, M("plaster2"), c)
        grow(o, B0 + 104 + i * 8, B0 + 132 + i * 8)
    for i, x in enumerate((-3.3, 3.3)):
        o = box(f"LND_gate_pillar_{i}", x, -30, 0.03, 0.6, 0.6, 2.9, M("plaster"), c)
        grow(o, B0 + 118, B0 + 134)
    # sliding gate panels: closed until the car arrives
    for i, (cx, sign) in enumerate(((-1.5, -1), (1.5, 1))):
        o = box(f"HERO_gate_{i}", cx, -29.6, 0.1, 3.0, 0.1, 2.0, M("frame"), c)
        grow(o, B0 + 120, B0 + 134)
        interp("SINE")
        key(o, "location", E0, (cx, -29.6, 0.1))
        key(o, "location", E0 + 24, (cx + sign * 3.0, -29.6, 0.1))


# ----------------------------------------------------------------------------- people and car
SHIRTS = [(0.8, 0.2, 0.2), (0.2, 0.4, 0.8), (0.9, 0.8, 0.2), (0.3, 0.7, 0.4), (0.7, 0.4, 0.8)]


def person(i, shirt):
    c = coll("PEOPLE")
    sm = mat(f"shirt_{i}", shirt, 0.8)
    root = empty(f"HERO_person_{i}", (0, 0, 0), c)
    child(box(f"P{i}_torso", 0, 0, 0.85, 0.46, 0.26, 0.62, sm, c), root)
    child(ball(f"P{i}_head", 0, 0, 1.58, 0.12, M("skin"), c), root)
    child(ball(f"P{i}_hair", 0, -0.01, 1.62, 0.125, M("hair"), c, sz=0.8), root)
    limbs = {}
    for side, sx in (("L", -0.1), ("R", 0.1)):
        piv = empty(f"P{i}_legpiv_{side}", (sx, 0, 0.85), c, root)
        child(box(f"P{i}_leg_{side}", 0, 0, 0, 0.15, 0.15, 0.85, M("pants"), c), piv, (0, 0, -0.85))
        limbs["leg" + side] = piv
    for side, sx in (("L", -0.29), ("R", 0.29)):
        piv = empty(f"P{i}_armpiv_{side}", (sx, 0, 1.45), c, root)
        child(box(f"P{i}_arm_{side}", 0, 0, 0, 0.1, 0.1, 0.6, M("skin"), c), piv, (0, 0, -0.58))
        limbs["arm" + side] = piv
    return root, limbs


def walk(i, pts, f0, f1, shirt, speed=0.054):
    root, limbs = person(i, shirt)
    grow(root, f0 - 8, f0, "BACK", z_only=False)
    prev = yaw_for(*(pts[1][k] - pts[0][k] for k in (0, 1)))
    sign = 1
    end_f = min(f1, f0 + int(path_length(pts) / speed))
    interp("LINEAR")
    for f in list(range(f0, end_f, 6)) + [end_f]:
        p, d = point_at(pts, speed * (f - f0))
        prev = unwrap(prev, yaw_for(d[0], d[1]))
        key(root, "location", f, (p[0], p[1], 0.03))
        key(root, "rotation_euler", f, (0, 0, prev))
    interp("SINE")
    for f in range(f0, end_f, 6):
        swing = 0.55 * sign
        key(limbs["legL"], "rotation_euler", f, (swing, 0, 0))
        key(limbs["legR"], "rotation_euler", f, (-swing, 0, 0))
        key(limbs["armL"], "rotation_euler", f, (-swing * 0.8, 0, 0))
        key(limbs["armR"], "rotation_euler", f, (swing * 0.8, 0, 0))
        sign = -sign
    for k in ("legL", "legR", "armL", "armR"):
        key(limbs[k], "rotation_euler", end_f, (0, 0, 0))
    return root


def build_people():
    paths = [
        [(-5, 6.6), (6.6, 6.6), (6.6, 14.5)],
        [(4.5, -16), (4.5, -3)],
        [(12, -7), (12, 4), (18, 4)],
        [(26, -2), (26, 11)],
        [(-3, 15.5), (3, 15.5), (8, 18)],
    ]
    for i, pts in enumerate(paths):
        walk(i, pts, D0 - 10, F1, SHIRTS[i % len(SHIRTS)])


CAR_PATH = [(0, -36), (0, -16), (-2.5, -9.5), (-8, -6.6), (-14, -5.6)]
CAR_F0, CAR_F1 = E0 + 12, E1


def car_dist(f, total):
    t = max(0.0, min(1.0, (f - CAR_F0) / (CAR_F1 - CAR_F0)))
    return total * (3 * t * t - 2 * t * t * t)  # smoothstep: eases in, rolls to a stop in the forecourt


def build_car():
    c = coll("CAR")
    root = empty("HERO_car", (0, -36, 0.03), c)
    child(box("CAR_body", 0, 0, 0.45, 1.9, 4.4, 0.7, M("car"), c), root)
    child(box("CAR_cabin", 0, -0.2, 1.15, 1.65, 2.3, 0.62, M("glass"), c), root)
    child(box("CAR_roof", 0, -0.2, 1.77, 1.65, 2.3, 0.06, M("car"), c), root)
    for sx in (-0.65, 0.65):
        child(box(f"CAR_headlight_{sx}", 0, 0, 0, 0.35, 0.05, 0.14, M("headlight"), c), root, (sx, 2.2, 0.78))
    wheels = []
    for wx, wy in ((-0.95, 1.35), (0.95, 1.35), (-0.95, -1.35), (0.95, -1.35)):
        w = cyl_x(f"CAR_wheel_{wx}_{wy}", (wx, wy, 0.36), 0.36, 0.26, M("tire"), c)
        child(w, root, (wx, wy, 0.36))
        wheels.append(w)
    appear(root, E0 - 40)
    pts = chaikin(CAR_PATH, 3)
    total = path_length(pts)
    prev = 0.0
    interp("LINEAR")
    for f in list(range(CAR_F0, CAR_F1, 4)) + [CAR_F1]:
        dist = car_dist(f, total)
        p, d = point_at(pts, dist)
        yaw = unwrap(prev, yaw_for(d[0], d[1]))
        prev = yaw
        key(root, "location", f, (p[0], p[1], 0.03))
        key(root, "rotation_euler", f, (0, 0, yaw))
        for w in wheels:
            key(w, "rotation_euler", f, (dist / 0.36, 0, 0))
    return root


# ----------------------------------------------------------------------------- cameras
LENS = {"A": 24, "B": 28, "C": 28, "D": 26, "E": 30, "F": 24}


def make_cam(name, lens=24.0):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_fit = "HORIZONTAL"
    cd.sensor_width = 36
    cd.clip_end = 600
    co = bpy.data.objects.new(name, cd)
    coll("CAMERAS").objects.link(co)
    return co


def fly(cam, shots):
    """shots: [(frame, (x,y,z), (tx,ty,tz))] with smooth interpolation and unwrapped yaw."""
    interp("SINE")
    prev = None
    for f, pos, tgt in shots:
        e = list(aim(pos, tgt))
        if prev is not None:
            e[2] = unwrap(prev, e[2])
        prev = e[2]
        key(cam, "location", f, pos)
        key(cam, "rotation_euler", f, tuple(e))


def orbit(cam, f0, f1, center, r0, r1, a0, a1, z0, z1, tz, n=8):
    shots = []
    for i in range(n + 1):
        u = i / n
        a = math.radians(a0 + (a1 - a0) * u)
        r = r0 + (r1 - r0) * u
        z = z0 + (z1 - z0) * u
        shots.append((round(f0 + (f1 - f0) * u), (center[0] + r * math.cos(a), center[1] + r * math.sin(a), z), (center[0], center[1], tz)))
    fly(cam, shots)


def build_cameras():
    cams = {k: make_cam(f"CAM_{k}", LENS[k]) for k in "ABCDEF"}
    # A: aerial drone drift over the empty plot
    fly(cams["A"], [(A0, (-62, -74, 40), (0, 2, 0)), (A1, (-34, -46, 22), (0, 4, 0))])
    # B: construction orbit
    orbit(cams["B"], B0, B1, (0, 5, 4), 70, 62, -125, -55, 36, 26, 4)
    # C: finished development, lower orbit
    orbit(cams["C"], C0, C1, (0, 4, 3), 56, 44, -40, 20, 16, 9, 3)
    # D: street-level view of people walking
    fly(cams["D"], [(D0, (12, -24, 2.3), (3, -2, 1.3)), (D1, (7, -15, 1.8), (3, 2, 1.3))])
    # E: car approaches and enters the gate (camera inside the plot, tracking the car)
    car_pts = chaikin(CAR_PATH, 3)
    total = path_length(car_pts)
    shots = []
    for f in list(range(E0, E1, 8)) + [E1]:
        p, _ = point_at(car_pts, car_dist(f, total))
        shots.append((f, (-8, -21, 2.4), (p[0], p[1], 0.9)))
    fly(cams["E"], shots)
    # F: through the front door and across the living space to the pool view
    fly(cams["F"], [
        (F0, (-16, -9, 1.6), (-16, 6, 1.5)),
        (F0 + 40, (-16, -2.5, 1.6), (-16, 6, 1.5)),
        (F0 + 80, (-16, 3.2, 1.55), (-15, 8, 1.5)),
        (F0 + 125, (-17.5, 6.2, 1.5), (-12, 12, 1.4)),
        (F1, (-15, 8.4, 1.5), (-8, 12, 1.5)),
    ])
    for name, frame in (("A", A0), ("B", B0), ("C", C0), ("D", D0), ("E", E0), ("F", F0)):
        mk = S.timeline_markers.new(f"cut_{name}", frame=frame)
        mk.camera = cams[name]
    S.camera = cams["A"]


# ----------------------------------------------------------------------------- build + render
def build():
    reset()
    make_materials()
    setup_scene()
    build_ground()
    va = villa("A", -16, 6, 16, 12, B0 + 2, -16, -24, -8)
    villa("B", 16, 6, 14, 11, B0+ 22, None, 11.0, 23.0)
    front_doors(va, -16, B0 + 2)
    build_interior(va, B1 - 4)
    build_landscape()
    build_people()
    build_car()
    build_cameras()
    S.frame_set(1)


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    opts = {"stills": None, "video": None, "save": None, "samples": 16}
    i = 0
    while i < len(argv):
        if argv[i] in ("--stills", "--video", "--save") and i + 1 < len(argv):
            opts[argv[i][2:]] = argv[i + 1]
            i += 2
        elif argv[i] == "--samples" and i + 1 < len(argv):
            opts["samples"] = int(argv[i + 1])
            i += 2
        else:
            i += 1
    return opts


def render_stills(folder, frames=(1, 60, 120, 180, 235, 300, 380, 440, 490, 540, 600, 680)):
    os.makedirs(folder, exist_ok=True)
    try:
        S.render.image_settings.media_type = "IMAGE"
    except Exception:
        pass
    S.render.image_settings.file_format = "PNG"
    for f in frames:
        S.frame_set(f)
        S.render.filepath = os.path.join(folder, f"villa_{f:04d}.png")
        bpy.ops.render.render(write_still=True)


def render_video(path):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    try:
        S.render.image_settings.media_type = "VIDEO"
    except Exception:
        pass
    S.render.image_settings.file_format = "FFMPEG"
    S.render.ffmpeg.format = "MPEG4"
    S.render.ffmpeg.codec = "H264"
    S.render.ffmpeg.constant_rate_factor = "HIGH"
    S.render.filepath = path
    bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    opts = parse_args()
    build()
    S.eevee.taa_render_samples = opts["samples"]
    if opts["save"]:
        os.makedirs(os.path.dirname(os.path.abspath(opts["save"])), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(opts["save"]))
    if opts["stills"]:
        render_stills(opts["stills"])
    if opts["video"]:
        render_video(opts["video"])
