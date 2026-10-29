"""Nine-scene cinematic timeline: cameras (marker-bound), sky/sun grading, night transition."""
import math
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "architecture"))
sys.path.insert(0, os.path.join(HERE, "..", "landscape"))
import bpy
from mathutils import Vector
from lib import *
import build_tower, build_site

I = P["site"]["interior_sets"]
AX, AY = I["apartment"]; PX, PY = I["penthouse"]; OX, OY = I["office"]
LX, LY = -620.0, -520.0
Z_APT = floor_z(T["showcase_floors"]["apartment"]); Z_PENT = floor_z(T["showcase_floors"]["penthouse"]); Z_OFF = floor_z(T["showcase_floors"]["office"])
TF = P["timeline_frames"]


def catmull(pts, u):
    n = len(pts) - 1
    x = max(0.0, min(0.9999999, u)) * n
    i = int(x); t = x - i
    p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, n)]
    p0, p1, p2, p3 = map(Vector, (p0, p1, p2, p3))
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)


def ease(u, k=1.0):
    """Gentle ease in/out; k=0 linear, 1 full smoothstep."""
    return (1 - k) * u + k * smoothstep(u)


def make_cam(name, lens, f0, f1, pos_fn, tgt_fn, step=10, ease_k=0.6, fstop=None, focus_fn=None, roll=0.0):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens; cd.sensor_width = 36; cd.clip_start = 0.1; cd.clip_end = 30000
    if fstop:
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = fstop
    co = bpy.data.objects.new(name, cd)
    link(co, sub("CAMERAS"))
    interp("BEZIER")
    prev = None
    frames = list(range(f0, f1 + 1, step))
    if frames[-1] != f1:
        frames.append(f1)
    for f in frames:
        u = ease((f - f0) / max(1, f1 - f0), ease_k)
        pos, tgt = pos_fn(u), tgt_fn(u)
        co.location = pos
        e = (Vector(tgt) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
        if prev is not None:
            e.make_compatible(prev)
        prev = e.copy()
        e.y = roll
        co.rotation_euler = e
        co.keyframe_insert("location", frame=f)
        co.keyframe_insert("rotation_euler", frame=f)
        if focus_fn:
            cd.dof.focus_distance = (Vector(focus_fn(u)) - Vector(pos)).length
            cd.dof.keyframe_insert("focus_distance", frame=f)
    return co


def mark(scn, name, frame, cam):
    m = scn.timeline_markers.new(name, frame=frame)
    m.camera = cam
    return m


def orbit(cx, cy, r0, r1, a0, a1, z0, z1):
    def fn(u):
        a = math.radians(a0 + (a1 - a0) * u)
        r = r0 + (r1 - r0) * u
        return (cx + r * math.cos(a), cy + r * math.sin(a), z0 + (z1 - z0) * u)
    return fn


def lerp3(a, b):
    return lambda u: tuple(a[i] + (b[i] - a[i]) * u for i in range(3))


def build_timeline():
    scn = scene()
    scn.frame_start, scn.frame_end = 1, P["film"]["frames"]
    scn.render.fps = P["film"]["fps"]
    top = top_z()
    cams = []

    # S01 aerial golden-hour dolly-in toward Jumeirah with Burj Al Arab on the left
    s = TF["S01"]
    pos = [(-330, 1350, 300), (-280, 980, 270), (-200, 620, 215), (-120, 330, 190), (-50, 175, 170)]
    tgt = [(-560, 380, 110), (-420, 330, 130), (-220, 190, 150), (-110, 60, 140), (-40, 0, 150)]
    cams.append((s[0], make_cam("CAM_S01", 28, s[0], s[1], lambda u: catmull(pos, u), lambda u: catmull(tgt, u), ease_k=0.35)))

    # S02 orbit with a subtle crane (sea side -> east -> land side)
    s = TF["S02"]
    cams.append((s[0], make_cam("CAM_S02", 32, s[0], s[1], orbit(0, 0, 360, 330, 70, 235, 120, 235), lambda u: (0, 0, 130 + 40 * u), ease_k=0.5)))

    # S03 facade tracking: vertical rise hugging the twist
    s = TF["S03"]
    cams.append((s[0], make_cam("CAM_S03", 40, s[0], s[1], orbit(0, 0, 118, 98, -118, -80, 18, 215), lambda u: (0 + 8 * math.cos(math.radians(-100)) , 0 + 8 * math.sin(math.radians(-100)), 30 + 170 * u), ease_k=0.7)))

    # S04 low landscape flythrough along the arrival court and terraces
    s = TF["S04"]
    pos = [(-112, -150, 2.4), (-62, -104, 2.8), (-15, -78, 3.6), (32, -68, 5.0), (74, -50, 8.5), (82, -8, 10.0), (80, 38, 10.5)]
    tgt = [(-70, -110, 6), (-24, -72, 8), (24, -58, 22), (62, -30, 30), (66, 4, 34), (40, 30, 30), (10, 20, 45)]
    cams.append((s[0], make_cam("CAM_S04", 24, s[0], s[1], lambda u: catmull(pos, u), lambda u: catmull(tgt, u), ease_k=0.4)))

    # S05 entrance -> (hidden cut) -> lobby dolly
    s = TF["S05"]
    cut = s[0] + 150
    cams.append((s[0], make_cam("CAM_S05a", 24, s[0], cut - 1, lerp3((0, -112, 2.1), (0, -34, 2.4)), lerp3((0, -24, 6.5), (0, 0, 7.5)), ease_k=0.3)))
    cams.append((cut, make_cam("CAM_S05b", 20, cut, s[1], lerp3((LX + 3.2, LY - 9.0, 1.85), (LX + 3.8, LY - 0.5, 1.95)), lerp3((LX - 3, LY - 2, 1.4), (LX + 0.5, LY + 5, 2.8)), ease_k=0.5)))

    # S06 apartment walkthrough
    s = TF["S06"]
    pos = [(AX - 8.0, AY - 5.8, Z_APT + 1.55), (AX - 3.5, AY - 2.2, Z_APT + 1.6), (AX - 1.0, AY + 1.5, Z_APT + 1.6), (AX + 0.5, AY + 5.4, Z_APT + 1.6)]
    tgt = [(AX - 5.0, AY - 1.0, Z_APT + 1.0), (AX - 6.0, AY + 2.5, Z_APT + 0.9), (AX - 5.0, AY + 5.0, Z_APT + 1.0), (AX + 2.0, AY + 40.0, Z_APT + 4.0)]
    cams.append((s[0], make_cam("CAM_S06", 20, s[0], s[1], lambda u: catmull(pos, u), lambda u: catmull(tgt, u), ease_k=0.6)))

    # S07 penthouse sweep, ending on the sea view from the terrace
    s = TF["S07"]
    pos = [(PX - 11.5, PY - 6.0, Z_PENT + 1.7), (PX - 6.0, PY - 3.0, Z_PENT + 1.8), (PX - 1.0, PY + 2.0, Z_PENT + 1.9), (PX + 1.5, PY + 8.5, Z_PENT + 1.9), (PX + 2.0, PY + 12.0, Z_PENT + 1.9)]
    tgt = [(PX - 2.0, PY - 4.0, Z_PENT + 1.8), (PX + 2.0, PY - 2.0, Z_PENT + 1.3), (PX + 5.0, PY + 2.0, Z_PENT + 1.2), (PX + 5.0, PY + 30.0, Z_PENT + 4.0), (PX + 4.0, PY + 200.0, Z_PENT + 22.0)]
    cams.append((s[0], make_cam("CAM_S07", 20, s[0], s[1], lambda u: catmull(pos, u), lambda u: catmull(tgt, u), ease_k=0.6)))

    # S08 office walkthrough
    s = TF["S08"]
    pos = [(OX - 14.5, OY - 6.5, Z_OFF + 1.6), (OX - 9.0, OY - 2.5, Z_OFF + 1.65), (OX - 2.0, OY + 0.0, Z_OFF + 1.65), (OX + 6.0, OY - 1.0, Z_OFF + 1.65), (OX + 11.0, OY + 1.5, Z_OFF + 1.65)]
    tgt = [(OX - 8.0, OY - 4.0, Z_OFF + 1.2), (OX - 3.0, OY + 1.5, Z_OFF + 1.4), (OX + 5.0, OY + 3.0, Z_OFF + 1.5), (OX + 12.0, OY - 3.0, Z_OFF + 1.4), (OX + 14.0, OY - 2.0, Z_OFF + 1.4)]
    cams.append((s[0], make_cam("CAM_S08", 20, s[0], s[1], lambda u: catmull(pos, u), lambda u: catmull(tgt, u), ease_k=0.6)))

    # S09 sunset-to-night finale, pull back to the aerial hero
    s = TF["S09"]
    pos = [(150, -250, 85), (260, -420, 150), (430, -700, 300), (560, -980, 430)]
    tgt = [(0, 0, 165), (0, 0, 155), (0, 0, 150), (0, 0, 150)]
    cams.append((s[0], make_cam("CAM_S09", 30, s[0], s[1], lambda u: catmull(pos, u), lambda u: catmull(tgt, u), ease_k=0.6)))

    ev = scn.view_settings
    interp("CONSTANT")
    for f, v in ((1, 0.0), (TF["S05"][0] + 150, -0.9), (TF["S09"][0], 0.0)):
        ev.exposure = v
        ev.keyframe_insert("exposure", frame=f)
    for f, co in cams:
        mark(scn, co.name.replace("CAM_", ""), f, co)
    scn.camera = cams[0][1]

    # golden hour held to S09, then sunset -> night
    n0, n1 = P["night"]["start"], P["night"]["full"]
    build_site.animate_sky([(1, 10, 300, 3.2, 0.12), (TF["S04"][1], 7.5, 300, 3.0, 0.12), (n0, 6.0, 300, 2.4, 0.12), (n1 - 40, -1.0, 300, 0.25, 0.05), (P["film"]["frames"], -7.0, 300, 0.0, 0.015)])
    build_tower.animate_night([(1, 0.0), (n0 - 100, 0.0), (n0 + 60, 0.7), (n1, 1.0)])
    return cams
