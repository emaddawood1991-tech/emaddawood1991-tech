# Claude Code fan-style character v2 (original educational character, NOT an official Anthropic mascot), styled after the reference image supplied by the user:
# chunky glossy orange asterisk body, thin dark limbs, white cartoon gloves with fingers, white/orange sneakers. Blender 5.3 bpy, Cycles CPU, transparent PNG sequences.
# The face (eyes, brows, mouth with teeth/tongue) is drawn in Remotion and tracked with the per-frame anchors written to clips.json (needed for audio-driven lip-sync).
import bpy, bmesh, math, json, sys, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
A = sys.argv[sys.argv.index("--") + 1:]
OUT, SAMPLES, RW, RH = A[0], int(A[1]), int(A[2]), int(A[3]); ONLY = A[4].split(",") if len(A) > 4 and A[4] != "all" else None; STEP = int(A[5]) if len(A) > 5 else 1
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True; sc.cycles.max_bounces = 3; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 2
sc.cycles.transmission_bounces = 0; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.04; sc.render.threads_mode = "FIXED"; sc.render.threads = 4
sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
sc.render.resolution_x, sc.render.resolution_y = RW, RH; sc.render.film_transparent = True; sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"
def mat(name, col, rough=0.4, metal=0.0, emit=0.0, coat=0.0, sss=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = col; b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    for k, v in (("Coat Weight", coat), ("Subsurface Weight", sss)):
        try: b.inputs[k].default_value = v
        except Exception: pass
    if emit:
        b.inputs["Emission Color"].default_value = col; b.inputs["Emission Strength"].default_value = emit
    return m
ORANGE = mat("orange", (1.0, 0.24, 0.015, 1), 0.32, 0.0, 0.10, 0.30, 0.10); INK = mat("ink", (0.11, 0.065, 0.045, 1), 0.38, 0.0, 0.0, 0.25)
WHITE = mat("white", (0.97, 0.96, 0.94, 1), 0.34, 0.0, 0.0, 0.3, 0.1); ORANGE2 = mat("orange2", (1.0, 0.27, 0.02, 1), 0.38, 0.0, 0.05); DARK = mat("dark", (0.10, 0.10, 0.12, 1), 0.5)
def empty(name, parent=None, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, None); sc.collection.objects.link(o); o.parent = parent; o.location = loc; return o
def smooth(o):
    for p in o.data.polygons: p.use_smooth = True
def sphere(parent, r, loc, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(0, 0, 0), segments=24, ring_count=12); o = bpy.context.object; o.scale = scale; o.parent = parent; o.location = loc; o.data.materials.append(m); smooth(o); return o
def cyl(parent, r, h, loc, m):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=(0, 0, 0), vertices=24); o = bpy.context.object; o.parent = parent; o.location = loc; o.data.materials.append(m); smooth(o); return o
def capsule(parent, r, length, m, origin_top=True):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=length, location=(0, 0, 0), vertices=16); o = bpy.context.object; o.parent = parent; o.location = (0, 0, -length / 2); o.data.materials.append(m); smooth(o)
    sphere(parent, r, (0, 0, 0), m); sphere(parent, r, (0, 0, -length), m); return o
# ---- body: chunky six-armed asterisk, three beveled bars ----
root = empty("root"); body = empty("body", root, (0, 0, 1.66))
BAR_W, BAR_L, BAR_T = 0.66, 1.80, 0.40
for k, ang in enumerate((15, 75, 135)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0)); o = bpy.context.object; o.scale = (BAR_W, BAR_T - 0.004 * k, BAR_L); bpy.ops.object.transform_apply(scale=True)
    bv = o.modifiers.new("bev", "BEVEL"); bv.width = 0.15; bv.segments = 7; bv.profile = 0.7; bv.limit_method = "NONE"
    o.data.materials.append(ORANGE); smooth(o); o.parent = body; o.rotation_euler = (0, math.radians(ang), 0)
face = empty("face", body, (0, -BAR_T / 2 - 0.02, 0.0))
# ---- limbs ----
HIPZ = 1.16; LEG1 = LEG2 = 0.58; legs = {}
for s, x in (("L", -0.26), ("R", 0.26)):
    hip = empty("hip" + s, root, (x, 0.12, HIPZ)); capsule(hip, 0.052, LEG1, INK)
    knee = empty("knee" + s, hip, (0, 0, -LEG1)); capsule(knee, 0.05, LEG2, INK)
    ank = empty("ankle" + s, knee, (0, 0, -LEG2))
    Z = 1.45
    cyl(ank, 0.105 * Z, 0.14 * Z, (0, 0, -0.01 * Z), WHITE); cyl(ank, 0.112 * Z, 0.035 * Z, (0, 0, 0.055 * Z), ORANGE2)
    sphere(ank, 0.2 * Z, (0, -0.10 * Z, -0.16 * Z), WHITE, (1.0, 1.55, 0.72)); sphere(ank, 0.185 * Z, (0, -0.31 * Z, -0.175 * Z), ORANGE2, (1.0, 0.85, 0.66)); sphere(ank, 0.215 * Z, (0, -0.10 * Z, -0.255 * Z), ORANGE2, (1.0, 1.95, 0.22))
    sphere(ank, 0.201 * Z, (0, -0.07 * Z, -0.17 * Z), DARK, (1.0, 0.11, 0.24))
    legs[s] = (hip, knee, ank)
ARM1, ARM2 = 0.64, 0.60; arms = {}
for s, x in (("L", -0.52), ("R", 0.52)):
    sh = empty("sh" + s, root, (x, 0.10, 1.52)); capsule(sh, 0.052, ARM1, INK)
    el = empty("el" + s, sh, (0, 0, -ARM1)); capsule(el, 0.05, ARM2, INK)
    wr = empty("wr" + s, el, (0, 0, -ARM2)); G = 1.45; cyl(wr, 0.10 * G, 0.10 * G, (0, 0, -0.03 * G), WHITE)
    sphere(wr, 0.15 * G, (0, -0.01 * G, -0.15 * G), WHITE, (1.0, 0.62, 1.0))
    fingers = []
    for j, fx in enumerate((-0.085, -0.028, 0.028, 0.085)):
        fpiv = empty(f"f{s}{j}", wr, (fx * G, -0.035 * G, -0.25 * G)); capsule(fpiv, 0.036 * G, (0.145 - 0.012 * (j in (0, 3))) * G, WHITE); fingers.append(fpiv)
    th = empty("th" + s, wr, ((0.14 if s == "R" else -0.14) * G, -0.05 * G, -0.12 * G)); capsule(th, 0.042 * G, 0.11 * G, WHITE)
    arms[s] = (sh, el, wr, fingers, th)
# ---- camera & lights ----
cd = bpy.data.cameras.new("cam"); cd.type = "ORTHO"; PXU = RW / 5.0; cd.ortho_scale = 5.0
cam = bpy.data.objects.new("cam", cd); sc.collection.objects.link(cam); cam.location = (0, -10, 1.40); cam.rotation_euler = (math.pi / 2, 0, 0); sc.camera = cam
for loc, e, col, sz in [((-2.5, -4, 4.5), 230, (1, 0.95, 0.88), 4), ((3.5, -4, 1.5), 110, (0.85, 0.9, 1), 4), ((0, 3, 3.5), 230, (1, 0.7, 0.45), 3), ((0, -5, -0.5), 60, (1, 0.93, 0.85), 3), ((-3, 2, 2), 140, (1, 0.6, 0.35), 2)]:
    l = bpy.data.lights.new("l", "AREA"); l.energy = e; l.size = sz; l.color = col; lo = bpy.data.objects.new("l", l); lo.location = loc; sc.collection.objects.link(lo)
    lo.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()
w = bpy.data.worlds.new("w"); w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (0.32, 0.30, 0.34, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.30; sc.world = w
# ---- poses (angle convention: positive = toward image right) ----
def ease(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
def env(u, a=0.28, b=0.72): return ease(u / a) if u < a else (1.0 if u < b else ease((1 - u) / (1 - b)))
RA = 0.32; RE = 0.14; REST = 0.55   # rest arm angle, elbow, finger curl
# arm tuple: (shoulder, elbow, index curl 0..1, other fingers curl 0..1, wrist, thumb 0..1)
def rest_arm(sg): return (sg * RA, sg * RE, REST, REST, 0.0, 0.3)
def base_pose(): return {"rootz": 0, "roll": 0, "yaw": 0, "legs": {"L": (0, 0), "R": (0, 0)}, "arms": {"L": rest_arm(-1), "R": rest_arm(1)}}
def pose_walk(i, n):
    p = base_pose(); ph = 2 * math.pi * i / n; Aw = 0.5; th = Aw * math.sin(ph); s = math.cos(ph)
    p["legs"]["R"] = (th, 0.75 * max(0, s)); p["legs"]["L"] = (-th, 0.75 * max(0, -s)); p["rootz"] = -0.03 * abs(math.cos(ph)) + 0.01; p["roll"] = 0.05 * math.sin(ph)
    sw = 0.32 * math.sin(ph); p["arms"]["R"] = (RA - sw, RE + 0.2, 0.6, 0.6, 0, 0.3); p["arms"]["L"] = (-RA - sw, -RE - 0.2, 0.6, 0.6, 0, 0.3); return p
def pose_idle(i, n):
    p = base_pose(); ph = 2 * math.pi * i / n; p["rootz"] = 0.012 * math.sin(ph); p["roll"] = 0.025 * math.sin(ph + 0.8)
    p["arms"]["R"] = (RA + 0.04 * math.sin(ph), RE, REST, REST, 0, 0.3); p["arms"]["L"] = (-RA - 0.04 * math.sin(ph + 1), -RE, REST, REST, 0, 0.3); return p
def pose_talk(i, n):
    p = base_pose(); ph = 2 * math.pi * i / n; p["rootz"] = 0.015 * math.sin(2 * ph); p["roll"] = 0.04 * math.sin(ph + 0.4)
    a = 0.5 + 0.5 * math.sin(ph); b = 0.5 + 0.5 * math.sin(ph + math.pi)
    p["arms"]["R"] = (0.5 + 0.55 * a, 0.5 + 0.35 * a, 0.15, 0.15, 0.12 * a, 0.5); p["arms"]["L"] = (-0.5 - 0.55 * b, -0.5 - 0.35 * b, 0.15, 0.15, -0.12 * b, 0.5); p["yaw"] = 0.06 * math.sin(ph); return p
def pose_gesture(kind, side, i, n):
    p = base_pose(); u = i / (n - 1); e = env(u); sgn = 1 if side == "R" else -1; other = "L" if side == "R" else "R"; wob = 0.04 * math.sin(u * 14) * e
    if kind == "point": p["arms"][side] = (sgn * (RA + (1.40 - RA) * e + wob), sgn * (RE - 0.1 * e), 0.0, 1.0, 0.0, 0.7)
    elif kind == "present": p["arms"][side] = (sgn * (RA + (1.05 - RA) * e + wob), sgn * (RE + 0.6 * e), 0.0, 0.0, sgn * 0.35 * e, 0.8)
    elif kind == "both":
        for sd, sg in (("L", -1), ("R", 1)): p["arms"][sd] = (sg * (RA + (1.28 - RA) * e + wob), sg * (RE + 0.5 * e), 0.0, 0.0, sg * 0.3 * e, 0.8)
        p["rootz"] = 0.02 * e
    p["roll"] = -sgn * 0.05 * e if kind != "both" else 0; p["yaw"] = sgn * 0.12 * e if kind != "both" else 0
    if kind != "both": p["arms"][other] = (-sgn * (RA + 0.05 * e), -sgn * RE, REST, REST, 0, 0.3)
    return p
CLIPS = {"walk": (36, pose_walk), "idle": (40, pose_idle), "talk": (48, pose_talk)}
for k in ("point", "present", "both"):
    for s in (("L", "R") if k != "both" else ("B",)): CLIPS[f"{k}_{s}"] = (36, (lambda kk, ss: (lambda i, n: pose_gesture(kk, ss if ss != "B" else "R", i, n)))(k, s))
def apply(p):
    root.location.z = p["rootz"]; root.rotation_euler = (0, p["roll"], 0); body.rotation_euler = (0, 0, p["yaw"])
    for s in ("L", "R"):
        hip, knee, ank = legs[s]; ang, bend = p["legs"][s]; hip.rotation_euler = (0, -ang, 0); knee.rotation_euler = (0, bend, 0); ank.rotation_euler = (0, ang - bend, 0)
        sh, el, wr, fingers, th = arms[s]; a = p["arms"][s]; sh.rotation_euler = (0, -a[0], 0); el.rotation_euler = (0, -a[1], 0); wr.rotation_euler = (0, -a[4], 0)
        for j, fp in enumerate(fingers): fp.rotation_euler = (-(a[2] if j == 0 else a[3]) * 1.75, 0, 0)
        th.rotation_euler = (0, 0, (1 if s == "R" else -1) * a[5] * 0.6)
os.makedirs(OUT, exist_ok=True); meta = {"pxu": PXU, "w": RW, "h": RH, "legL": LEG1 + LEG2 + 0.0, "clips": {}}
if os.path.exists(OUT + "/clips.json"): meta = json.load(open(OUT + "/clips.json"))
for name, (n, fn) in CLIPS.items():
    if ONLY and name not in ONLY: continue
    anchors = []
    for i in range(0, n, STEP):
        apply(fn(i, n)); bpy.context.view_layer.update()
        pt = world_to_camera_view(sc, cam, face.matrix_world.translation); pr = world_to_camera_view(sc, cam, (face.matrix_world @ Vector((0.5, 0, 0))))
        cx, cy = pt.x * RW, (1 - pt.y) * RH; ang = math.atan2((1 - pr.y) * RH - cy, pr.x * RW - cx)
        anchors.append([round(cx, 2), round(cy, 2), round(ang, 4)])
        sc.render.filepath = f"{OUT}/{name}_{i:03d}.png"; bpy.ops.render.render(write_still=True)
    meta["clips"][name] = {"n": n, "step": STEP, "anchors": anchors}
    json.dump(meta, open(OUT + "/clips.json", "w"))
print("DONE")
