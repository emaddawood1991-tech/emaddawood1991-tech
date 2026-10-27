"""Render animated shots from property_anim.blend as PNG frames (resumable; existing frames are skipped).
usage: python render_shot.py <shot> <out_prefix> [w h samples] [--range f0 f1]
shots: build | hook | car | garden | interior   (absolute frames, 24 fps; see build_anim.py header)"""
import bpy, sys, os, math
from mathutils import Vector
a = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else sys.argv[1:]
shot, out = a[0], a[1]
w, h, samples = (int(a[2]), int(a[3]), int(a[4])) if len(a) > 4 and a[2].isdigit() else (540, 960, 8)
RNG = {"build": (1, 240), "hook": (380, 500), "car": (300, 612), "garden": (700, 1012), "interior": (1100, 1400)}
f0, f1 = RNG[shot]; G0, G1 = f0, f1   # path timing always uses the shot's full range, even when --range renders a subset
if "--range" in a: i = a.index("--range"); f0, f1 = int(a[i+1]), int(a[i+2])
HERE = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "property_anim.blend"))
sc = bpy.context.scene; OB = bpy.data.objects
for o in OB:
    if o.name.startswith("Mark_"): o.hide_render = True
sc.render.resolution_x, sc.render.resolution_y = w, h
sc.cycles.samples = samples; sc.cycles.use_denoising = True; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.05
cam = OB["Cam_Hero"]; sc.camera = cam
def lerpk(keys, t):
    """keys: [(t, Vector)] piecewise smooth interpolation"""
    for i in range(len(keys) - 1):
        t0, p0 = keys[i]; t1, p1 = keys[i+1]
        if t <= t1:
            u = (t - t0) / max(1e-6, t1 - t0); u = u*u*(3 - 2*u); return p0.lerp(p1, u)
    return keys[-1][1]
V = Vector
def place(pos, target, lens):
    cam.location = pos; cam.rotation_euler = (target - pos).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
def carpos(): return OB["Car"].matrix_world.translation.copy()
for fr in range(f0, f1 + 1):
    path = f"{out}_{fr:05d}.png"
    if os.path.exists(path): continue
    sc.frame_set(fr); t = (fr - G0) / max(1, G1 - G0)
    if shot == "build":
        place(lerpk([(0, V((-30, -42, 15))), (1, V((26, -44, 13)))], t), V((0, 1, 1)), 26)
    elif shot == "hook":
        c = carpos(); pos = lerpk([(0, V((-2, -37, 3.0))), (0.5, V((-5.5, -21, 2.2))), (1, V((-6, -10, 2.4)))], t)
        place(pos, c + V((0, 0, 0.9)), 30)
    elif shot == "car":
        c = carpos(); off = lerpk([(0, V((-8, -9, 2.4))), (0.35, V((8, -11, 3.0))), (0.65, V((7, -6, 4.5))), (1, V((9, -5, 6.5)))], t)
        place(c + off, c + V((0, 0, 0.9)), 26)
    elif shot == "garden":
        pos = lerpk([(0, V((-9, -13.8, 2.1))), (0.45, V((2, -13.6, 2.0))), (0.8, V((10, -13.6, 2.1))), (1, V((14.5, -7.5, 2.4)))], t)
        tg = lerpk([(0, V((-5, -8.8, 1.1))), (0.5, V((6, -7.6, 1.1))), (1, V((10, -3, 1.0)))], t)
        place(pos, tg, 24)
    elif shot == "interior":
        pos = lerpk([(0, V((3.2, -10, 1.7))), (0.17, V((3.2, -5.4, 1.6))), (0.4, V((3.2, 3.0, 1.5))), (0.7, V((-0.5, 4.0, 1.5))), (1, V((-4.0, 3.2, 1.5)))], t)
        tg = lerpk([(0, V((3.2, 1.3, 1.3))), (0.4, V((0.0, 6.0, 1.3))), (0.7, V((-5.0, 5.5, 1.2))), (1, V((-8.0, 5.0, 1.3)))], t)
        place(pos, tg, 20)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
