# Claude Code fan-style character (original educational character, NOT an official Anthropic mascot). Blender 5.3 bpy, Cycles CPU, transparent PNG sequences.
# The body silhouette is traced from the official Claude Code docs favicon (code.claude.com) as a polar profile (spark_profile.json). Face is added in Remotion (tracked via anchors).
import bpy, bmesh, math, json, sys, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
A = sys.argv[sys.argv.index("--") + 1:]
OUT, SAMPLES, RW, RH = A[0], int(A[1]), int(A[2]), int(A[3]); ONLY = A[4].split(",") if len(A) > 4 and A[4] != "all" else None; STEP = int(A[5]) if len(A) > 5 else 1
HERE = os.path.dirname(os.path.abspath(__file__)); prof = json.load(open(HERE + "/spark_profile.json"))["r"]
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True; sc.cycles.max_bounces = 3; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 2; sc.cycles.transmission_bounces = 0; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.05; sc.render.threads_mode = "FIXED"; sc.render.threads = 4; sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
sc.render.resolution_x, sc.render.resolution_y = RW, RH; sc.render.film_transparent = True; sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"
def mat(name, col, rough=0.45, metal=0.0, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = col; b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if emit: b.inputs["Emission Color"].default_value = col; b.inputs["Emission Strength"].default_value = emit
    return m
CORAL = mat("coral", (0.85, 0.40, 0.25, 1), 0.42, 0.0, 0.08); INK = mat("ink", (0.14, 0.12, 0.11, 1), 0.5); CREAM = mat("cream", (0.95, 0.93, 0.88, 1), 0.4); SHOE = mat("shoe", (0.90, 0.88, 0.82, 1), 0.4)
def empty(name, parent=None, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, None); sc.collection.objects.link(o); o.parent = parent; o.location = loc; return o
def smooth(o):
    for p in o.data.polygons: p.use_smooth = True
def sphere(parent, r, loc, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(0, 0, 0), segments=20, ring_count=10); o = bpy.context.object; o.scale = scale; o.parent = parent; o.location = loc; o.data.materials.append(m); smooth(o); return o
def capsule(parent, r, length, m):  # hangs down from the pivot along -Z
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=length, location=(0, 0, 0), vertices=16); o = bpy.context.object; o.parent = parent; o.location = (0, 0, -length / 2); o.data.materials.append(m); smooth(o)
    sphere(parent, r, (0, 0, 0), m); sphere(parent, r, (0, 0, -length), m); return o
# ---- body: extruded spark silhouette ----
RS = 0.82 / max(prof); N = len(prof); me = bpy.data.meshes.new("spark"); ob = bpy.data.objects.new("spark", me); sc.collection.objects.link(ob)
bm = bmesh.new(); c = bm.verts.new((0, 0, 0)); rim = [bm.verts.new((prof[i] * RS * math.cos(2 * math.pi * i / N), 0, prof[i] * RS * math.sin(2 * math.pi * i / N))) for i in range(N)]
for i in range(N): bm.faces.new((c, rim[i], rim[(i + 1) % N]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.to_mesh(me); bm.free()
sol = ob.modifiers.new("solid", "SOLIDIFY"); sol.thickness = 0.26; sol.offset = 0; bev = ob.modifiers.new("bev", "BEVEL"); bev.width = 0.035; bev.segments = 3; bev.limit_method = "ANGLE"
ob.data.materials.append(CORAL); smooth(ob)
root = empty("root"); body = empty("body", root, (0, 0, 1.55)); ob.parent = body
face = empty("face", body, (0, -0.15, 0))
# ---- limbs ----
HIPZ = 1.00; LEG1 = LEG2 = 0.50; legs = {}
for s, x in (("L", -0.24), ("R", 0.24)):
    hip = empty("hip" + s, root, (x, 0.10, HIPZ)); capsule(hip, 0.075, LEG1, INK)
    knee = empty("knee" + s, hip, (0, 0, -LEG1)); capsule(knee, 0.07, LEG2, INK)
    ankle = empty("ankle" + s, knee, (0, 0, -LEG2)); sphere(ankle, 0.13, (0, -0.08, -0.04), SHOE, (0.95, 1.5, 0.62)); legs[s] = (hip, knee)
ARM1, ARM2 = 0.42, 0.38; arms = {}
for s, x in (("L", -0.80), ("R", 0.80)):
    sh = empty("sh" + s, root, (x, 0.16, 1.40)); capsule(sh, 0.065, ARM1, INK)
    el = empty("el" + s, sh, (0, 0, -ARM1)); capsule(el, 0.06, ARM2, INK)
    wr = empty("wr" + s, el, (0, 0, -ARM2)); sphere(wr, 0.15, (0, -0.02, -0.09), CREAM, (1, 0.85, 1.05))
    th = empty("th" + s, wr, (0.11 if s == "R" else -0.11, -0.05, -0.08)); sphere(th, 0.055, (0, 0, -0.03), CREAM, (1, 1, 1.5))
    fg = empty("fg" + s, wr, (0, -0.07, -0.16)); capsule(fg, 0.048, 0.22, CREAM)
    arms[s] = (sh, el, wr, fg)
# ---- camera & lights ----
cd = bpy.data.cameras.new("cam"); cd.type = "ORTHO"; PXU = RW / 4.4; cd.ortho_scale = 4.4
cam = bpy.data.objects.new("cam", cd); sc.collection.objects.link(cam); cam.location = (0, -10, 1.32); cam.rotation_euler = (math.pi / 2, 0, 0); sc.camera = cam
for loc, e, col, sz in [((-2.5, -4, 4.5), 300, (1, 0.95, 0.88), 4), ((3.5, -4, 1.5), 140, (0.85, 0.9, 1), 4), ((0, 3, 3.5), 220, (1, 0.8, 0.7), 3), ((0, -5, -0.5), 70, (1, 0.93, 0.85), 3)]:
    l = bpy.data.lights.new("l", "AREA"); l.energy = e; l.size = sz; l.color = col; lo = bpy.data.objects.new("l", l); lo.location = loc; sc.collection.objects.link(lo)
    lo.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()
w = bpy.data.worlds.new("w"); w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (0.3, 0.3, 0.32, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.35; sc.world = w
# ---- poses (angle convention: positive = toward image right) ----
def ease(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
def env(u, a=0.28, b=0.72): return ease(u / a) if u < a else (1.0 if u < b else ease((1 - u) / (1 - b)))
REST_ARM = 0.30; REST_ELB = 0.12
def base_pose(): return {"rootz": 0, "roll": 0, "yaw": 0, "legs": {"L": (0, 0), "R": (0, 0)}, "arms": {"L": (-REST_ARM, -REST_ELB, 1.0, 0.0), "R": (REST_ARM, REST_ELB, 1.0, 0.0)}}  # arm: (shoulder, elbow, finger curl 0..1, wrist)
def pose_walk(i, n):
    p = base_pose(); ph = 2 * math.pi * i / n; A = 0.5
    th = A * math.sin(ph); s = math.cos(ph)
    p["legs"]["R"] = (th, -0.75 * max(0, s)); p["legs"]["L"] = (-th, -0.75 * max(0, -s))
    p["rootz"] = 0.035 * abs(math.sin(ph * 2 / 2 * 2 / 2 * 2)) ; p["rootz"] = -0.03 * abs(math.cos(ph)) + 0.01; p["roll"] = 0.05 * math.sin(ph)
    sw = 0.30 * math.sin(ph); p["arms"]["R"] = (REST_ARM - sw, REST_ELB + 0.15, 1.0, 0); p["arms"]["L"] = (-REST_ARM - sw, -REST_ELB - 0.15, 1.0, 0)
    return p
def pose_idle(i, n):
    p = base_pose(); ph = 2 * math.pi * i / n; p["rootz"] = 0.012 * math.sin(ph); p["roll"] = 0.025 * math.sin(ph + 0.8)
    p["arms"]["R"] = (REST_ARM + 0.04 * math.sin(ph), REST_ELB, 1.0, 0); p["arms"]["L"] = (-REST_ARM - 0.04 * math.sin(ph + 1), -REST_ELB, 1.0, 0); return p
def pose_talk(i, n):
    p = base_pose(); ph = 2 * math.pi * i / n; p["rootz"] = 0.015 * math.sin(2 * ph); p["roll"] = 0.04 * math.sin(ph + 0.4)
    a = 0.5 + 0.5 * math.sin(ph); b = 0.5 + 0.5 * math.sin(ph + math.pi)
    p["arms"]["R"] = (0.50 + 0.55 * a, 0.45 + 0.35 * a, 0.3, 0.1 * a); p["arms"]["L"] = (-0.50 - 0.55 * b, -0.45 - 0.35 * b, 0.3, -0.1 * b); p["yaw"] = 0.06 * math.sin(ph); return p
def pose_gesture(kind, side, i, n):
    p = base_pose(); u = i / (n - 1); e = env(u); sgn = 1 if side == "R" else -1; other = "L" if side == "R" else "R"
    wob = 0.04 * math.sin(u * 14) * e
    if kind == "point": p["arms"][side] = (sgn * (REST_ARM + (1.38 - REST_ARM) * e + wob), sgn * (0.12 - 0.1 * e), 0.0 if e > 0.5 else 1.0 - e * 2, 0.0)
    elif kind == "present": p["arms"][side] = (sgn * (REST_ARM + (1.05 - REST_ARM) * e + wob), sgn * (0.12 + 0.55 * e), 0.0, 0.0)
    elif kind == "both":
        for sd, sg in (("L", -1), ("R", 1)): p["arms"][sd] = (sg * (REST_ARM + (1.25 - REST_ARM) * e + wob), sg * (0.12 + 0.45 * e), 0.1, 0.0)
        p["rootz"] = 0.02 * e
    p["roll"] = -sgn * 0.05 * e if kind != "both" else 0; p["yaw"] = sgn * 0.12 * e if kind != "both" else 0
    p["arms"][other] = (-sgn * (REST_ARM + 0.05 * e), -sgn * REST_ELB, 1.0, 0.0); return p
CLIPS = {"walk": (36, lambda i, n: pose_walk(i, n)), "idle": (40, pose_idle), "talk": (48, pose_talk)}
for k in ("point", "present", "both"):
    for s in (("L", "R") if k != "both" else ("B",)): CLIPS[f"{k}_{s}"] = (36, (lambda kk, ss: (lambda i, n: pose_gesture(kk, ss if ss != "B" else "R", i, n)))(k, s))
def apply(p):
    root.location.z = p["rootz"]; root.rotation_euler = (0, p["roll"], 0); body.rotation_euler = (0, 0, p["yaw"])
    for s in ("L", "R"):
        hip, knee = legs[s]; hip.rotation_euler = (0, -p["legs"][s][0], 0); knee.rotation_euler = (0, p["legs"][s][1] * (1 if s == "R" else 1) * 1, 0)
        sh, el, wr, fg = arms[s]; a = p["arms"][s]; sh.rotation_euler = (0, -a[0], 0); el.rotation_euler = (0, -a[1], 0); wr.rotation_euler = (0, -a[3], 0); fg.rotation_euler = (0, 0, 0); fg.rotation_euler = (a[2] * 1.7 * (1 if s == "R" else -1), 0, 0)
os.makedirs(OUT, exist_ok=True); meta = {"pxu": PXU, "w": RW, "h": RH, "legL": LEG1 + LEG2, "clips": {}}
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
