"""Agentoon.ai animated interpretation of the Claude Code mascot (NOT an official Anthropic asset).
Run: /tmp/bpyenv/bin/python build_claude_mascot.py [--render-tests]
Outputs: ../claude_mascot.blend, ../glb/claude_mascot.glb, ../tests/*.png. Shape source: user-supplied reference stills (blocky body, 2 black square eyes, 2 short side nubs, 4 short legs)."""
import bpy, math, sys, os
from mathutils import Vector, Euler
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.dirname(HERE)
BODY = (0.851, 0.467, 0.341)  # #D97757
def srgb(c): return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = 30
def mat(name, col, rough=0.5, metal=0.0, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*srgb(col), 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if emit: b.inputs["Emission Color"].default_value = (*srgb(col), 1); b.inputs["Emission Strength"].default_value = emit
    return m
M = {"body": mat("ClaudeBody", BODY, 0.55), "eye": mat("ClaudeEye", (0.02, 0.02, 0.02), 0.2), "dark": mat("Dark", (0.08, 0.08, 0.1), 0.4), "metal": mat("Metal", (0.7, 0.72, 0.78), 0.3, 0.8),
     "blue": mat("Blue", (0.1, 0.35, 0.7), 0.4), "brown": mat("Brown", (0.25, 0.14, 0.07), 0.6), "yellow": mat("Bulb", (1.0, 0.85, 0.4), 0.2, 0, 2.0), "paper": mat("Paper", (0.97, 0.96, 0.92), 0.8), "red": mat("Red", (0.85, 0.2, 0.2), 0.5), "glass": mat("Glass", (0.6, 0.8, 1.0), 0.05)}
def box(name, size, loc, m, bevel=0.04, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.active_object; o.name = name; o.scale = size; bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(m)
    if bevel: bv = o.modifiers.new("bev", "BEVEL"); bv.width = bevel; bv.segments = 3
    bpy.ops.object.shade_smooth()
    return o
def cyl(name, r, d, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=loc, rotation=rot); o = bpy.context.active_object; o.name = name; o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o
def tor(name, R, r, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot); o = bpy.context.active_object; o.name = name; o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o
def sph(name, r, loc, m):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc); o = bpy.context.active_object; o.name = name; o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o
# ---- armature ----
bpy.ops.object.armature_add(location=(0, 0, 0)); arm = bpy.context.active_object; arm.name = "ClaudeRig"; ad = arm.data; ad.name = "ClaudeRigData"
bpy.ops.object.mode_set(mode="EDIT"); eb = ad.edit_bones; eb.remove(eb[0])
def bone(n, h, t, parent=None):
    b = eb.new(n); b.head = h; b.tail = t
    if parent: b.parent = eb[parent]
    return b
LEGX = [-0.88, -0.5, 0.5, 0.88]
bone("root", (0, 0, 0), (0, 0, 0.3)); bone("body", (0, 0, 0.55), (0, 0, 1.4), "root")
bone("armL", (-1.0, 0, 1.0), (-1.45, 0, 1.0), "body"); bone("armR", (1.0, 0, 1.0), (1.45, 0, 1.0), "body")
for i, x in enumerate(LEGX): bone(f"leg{i}", (x, 0, 0.6), (x, 0, 0.05), "root")
bone("eyeL", (-0.5, -0.52, 1.0), (-0.5, -0.62, 1.0), "body"); bone("eyeR", (0.5, -0.52, 1.0), (0.5, -0.62, 1.0), "body"); bone("mouth", (0, -0.52, 0.72), (0, -0.62, 0.72), "body")
bone("acc", (0, 0, 1.2), (0, 0, 1.4), "body")
bpy.ops.object.mode_set(mode="OBJECT")
def attach(o, bn):
    """rigid skin: all vertices 100% weighted to one bone via vertex group + Armature modifier (avoids bone-tail parent offset)"""
    vg = o.vertex_groups.new(name=bn); vg.add(list(range(len(o.data.vertices))), 1.0, "REPLACE")
    md = o.modifiers.new("arm", "ARMATURE"); md.object = arm; o.parent = arm
# ---- body parts (front faces -Y) ----
body = box("Body", (2.0, 1.1, 1.1), (0, 0, 1.0), M["body"], 0.05); attach(body, "body")
for s, n in ((-1, "armL"), (1, "armR")): a = box("Arm" + n[-1], (0.5, 0.5, 0.46), (s * 1.22, 0, 1.0), M["body"], 0.04); attach(a, n)
for i, x in enumerate(LEGX): l = box(f"Leg{i}", (0.26, 0.3, 0.6), (x, 0, 0.3), M["body"], 0.03); attach(l, f"leg{i}")
for s, n in ((-1, "eyeL"), (1, "eyeR")): e = box("Eye" + n[-1], (0.16, 0.06, 0.2), (s * 0.5, -0.56, 1.1), M["eye"], 0.01); attach(e, n)
mo = box("Mouth", (0.26, 0.04, 0.05), (0, -0.56, 0.72), M["eye"], 0.01); attach(mo, "mouth")
# ---- accessories (hidden by default; parented to 'acc' bone, toggled by name) ----
ACC = {}
def acc(name, parts):
    for p in parts: attach(p, "acc"); p.hide_render = True; p.hide_viewport = True
    ACC[name] = (None, parts)
acc("headphones", [tor("hp_band", 0.72, 0.06, (0, 0, 1.6), M["blue"], (math.radians(90), 0, 0)), cyl("hp_cupL", 0.22, 0.2, (-0.95, 0, 1.15), M["blue"], (0, math.radians(90), 0)), cyl("hp_cupR", 0.22, 0.2, (0.95, 0, 1.15), M["blue"], (0, math.radians(90), 0))])
acc("detective", [cyl("hat_brim", 0.7, 0.06, (0, 0, 1.58), M["dark"]), cyl("hat_crown", 0.4, 0.34, (0, 0, 1.78), M["dark"]), cyl("hat_band", 0.41, 0.08, (0, 0, 1.68), M["brown"]), tor("mag_ring", 0.22, 0.04, (0.55, -0.75, 0.9), M["blue"], (math.radians(90), 0, 0)), cyl("mag_glass", 0.2, 0.02, (0.55, -0.75, 0.9), M["glass"], (math.radians(90), 0, 0)), cyl("mag_handle", 0.04, 0.4, (0.72, -0.75, 0.68), M["brown"], (0, math.radians(45), 0))])
acc("lightbulb", [sph("bulb", 0.2, (0, 0, 1.95), M["yellow"]), cyl("bulb_base", 0.1, 0.14, (0, 0, 1.72), M["metal"])])
acc("laptop", [box("lap_base", (1.0, 0.7, 0.06), (0, -1.1, 0.04), M["metal"], 0.02), box("lap_screen", (1.0, 0.05, 0.65), (0, -0.78, 0.38), M["dark"], 0.02)])
acc("clipboard", [box("clip_board", (0.6, 0.06, 0.8), (0.9, -0.7, 1.0), M["brown"], 0.02), box("clip_paper", (0.5, 0.02, 0.7), (0.9, -0.74, 1.0), M["paper"], 0.01), box("clip_clip", (0.2, 0.05, 0.08), (0.9, -0.76, 1.42), M["metal"], 0.01)])
acc("documents", [box(f"doc{i}", (0.55, 0.02, 0.7), (-0.9 + i * 0.06, -0.7 - i * 0.03, 1.0), M["paper"], 0.005) for i in range(3)])
acc("calendar", [box("cal_page", (0.7, 0.05, 0.8), (0.9, -0.7, 1.0), M["paper"], 0.01), box("cal_head", (0.7, 0.06, 0.2), (0.9, -0.72, 1.3), M["red"], 0.01)])
# ---- animation library ----
pb = arm.pose.bones
for b in pb: b.rotation_mode = "XYZ"
LEG = ["leg0", "leg1", "leg2", "leg3"]
def reset():
    for b in pb: b.location = (0, 0, 0); b.rotation_euler = (0, 0, 0); b.scale = (1, 1, 1)
def blink(f, n, period=84):
    p = (f + 20) % period; return max(0.12, abs(p - 2) / 2) if p < 4 else 1.0
def S(name, n, fn):  # build one action
    act = bpy.data.actions.new(name); arm.animation_data_create(); arm.animation_data.action = act
    for f in range(n + 1):
        reset(); fn(f, n)
        for b in pb: b.keyframe_insert("location", frame=f + 1); b.keyframe_insert("rotation_euler", frame=f + 1); b.keyframe_insert("scale", frame=f + 1)
    act.use_fake_user = True
sin = math.sin; pi = math.pi
def eyes(f, n, look=(0, 0), bl=True):
    s = blink(f, n) if bl else 1.0
    for e in ("eyeL", "eyeR"): pb[e].scale = (1, 1, s); pb[e].location = (look[0] * 0.08, 0, look[1] * 0.08)
def idle(f, n): t = f / n * 2 * pi; pb["body"].scale = (1, 1, 1 + 0.015 * sin(t)); pb["body"].location = (0, 0, 0.01 * sin(t)); pb["armL"].rotation_euler = (0.04 * sin(t), 0, 0); pb["armR"].rotation_euler = (-(-0.04 * sin(t)), 0, 0); eyes(f, n)
def bounce(f, n):
    t = f / n; h = abs(sin(t * pi)) * 0.6; pb["root"].location = (0, 0, h); sq = 1 - 0.12 * max(0, 1 - h * 6) * (1 if t < .15 or t > .85 else 0); pb["body"].scale = (1 + (1 - sq) * 0.5, 1, sq)
    pb["armL"].rotation_euler = (0.5 * h * 2, 0, 0); pb["armR"].rotation_euler = (-(-0.5 * h * 2), 0, 0); eyes(f, n, bl=False)
def wave(f, n):
    t = f / n; up = min(1, t * 6, (1 - t) * 6); pb["armR"].rotation_euler = (-(-1.2 * up + 0.35 * sin(t * 6 * pi) * up), 0, 0); pb["body"].rotation_euler = (0, -0.04 * up, 0); eyes(f, n)
def look(f, n): t = f / n * 2 * pi; eyes(f, n, (sin(t), 0.2 * sin(2 * t)), False); pb["body"].rotation_euler = (0, 0, 0.12 * sin(t))
def walk(f, n):
    t = f / n * 2 * pi
    for i, l in enumerate(LEG): ph = t + (0 if i % 2 == 0 else pi); pb[l].rotation_euler = (0.55 * sin(ph), 0, 0); pb[l].location = (0, 0, 0.08 * max(0, cos(ph)))
    pb["body"].location = (0, 0, 0.03 * abs(sin(t))); pb["body"].rotation_euler = (0, 0.05 * sin(t), 0); eyes(f, n)
cos = math.cos
def run(f, n):
    t = f / n * 2 * pi
    for i, l in enumerate(LEG): ph = t + (0 if i % 2 == 0 else pi); pb[l].rotation_euler = (0.9 * sin(ph), 0, 0); pb[l].location = (0, 0, 0.14 * max(0, cos(ph)))
    pb["body"].location = (0, 0, 0.1 * abs(sin(t))); pb["body"].rotation_euler = (-0.12, 0.08 * sin(t), 0); pb["armL"].rotation_euler = (0.25, 0, 0); pb["armR"].rotation_euler = (-(-0.25), 0, 0); eyes(f, n)
def talk(f, n):
    t = f / n * 2 * pi; m = max(0.0, sin(t * 3) * 0.5 + 0.5 * sin(t * 5 + 1)); pb["mouth"].scale = (1 - 0.3 * m, 1, 0.4 + 3.2 * m); pb["body"].rotation_euler = (0, 0.02 * sin(t * 2), 0.03 * sin(t)); pb["armL"].rotation_euler = (0.15 * sin(t * 2), 0, 0); eyes(f, n)
def think(f, n): t = f / n * 2 * pi; eyes(f, n, (-0.6, 0.8), False); pb["eyeL"].scale = (1, 1, 0.8); pb["eyeR"].scale = (1, 1, 1.1); pb["body"].rotation_euler = (0, -0.1, 0.06 * sin(t)); pb["armR"].rotation_euler = (-(-0.7), 0, 0.0)
def point(f, n): t = f / n; up = min(1, t * 5, (1 - t) * 5); pb["armR"].rotation_euler = (-(-0.9 * up), 0, -0.35 * up); pb["armR"].scale = (1, 1 + 0.3 * up, 1); pb["body"].rotation_euler = (0, 0, 0.1 * up); eyes(f, n, (0.8 * up, 0.1 * up), False)
def celebrate(f, n):
    t = f / n; h = abs(sin(t * 2 * pi)) * 0.5; pb["root"].location = (0, 0, h); pb["armL"].rotation_euler = (1.3, 0, 0); pb["armR"].rotation_euler = (-(-1.3), 0, 0); pb["armL"].scale = pb["armR"].scale = (1, 1.15, 1)
    for e in ("eyeL", "eyeR"): pb[e].scale = (1.25, 1, 0.3)
def listen(f, n): t = f / n * 2 * pi; eyes(f, n, (0.3 * sin(t * 0.5), 0.1), True); pb["body"].rotation_euler = (0.05, 0.06, 0.05 * sin(t * 0.5)); pb["body"].location = (0, 0, 0.01 * sin(t))
LIB = [("IDLE", 60, idle), ("BOUNCE", 24, bounce), ("WAVE", 48, wave), ("LOOK", 60, look), ("WALK", 36, walk), ("RUN", 18, run), ("TALK", 30, talk), ("THINK", 60, think), ("POINT", 36, point), ("CELEBRATE", 36, celebrate), ("LISTEN", 60, listen)]
for n, fr, fn in LIB: S(n, fr, fn)
arm.animation_data.action = bpy.data.actions["IDLE"]
# ---- scene: camera + lights + transparent ----
cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam")); sc.collection.objects.link(cam); sc.camera = cam; cam.location = (0, -7.5, 1.6); cam.rotation_euler = (math.radians(88), 0, 0); cam.data.lens = 60
for nm, loc, e, col in (("Key", (4, -5, 5), 900, (1, 0.95, 0.9)), ("Fill", (-5, -4, 2), 350, (0.8, 0.9, 1)), ("Rim", (0, 4, 4), 500, (1, 0.9, 0.8))):
    L = bpy.data.lights.new(nm, "AREA"); L.energy = e; L.color = col; L.size = 4; o = bpy.data.objects.new(nm, L); o.location = loc; sc.collection.objects.link(o)
    d = (Vector((0, 0, 1.1)) - Vector(loc)); o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
sc.view_settings.view_transform = "Standard"; sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = 24; sc.render.film_transparent = True
sc.render.resolution_x = 480; sc.render.resolution_y = 480
bpy.context.scene.world = bpy.data.worlds.new("W"); bpy.context.scene.world.use_nodes = True; bpy.context.scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "claude_mascot.blend"))
try: bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "glb", "claude_mascot.glb"), export_format="GLB", export_animations=True, export_animation_mode="ACTIONS")
except Exception as ex: print("GLB export skipped:", ex)
if "--render-tests" in sys.argv:
    tests = [("IDLE", 10, None), ("BOUNCE", 6, None), ("WAVE", 14, None), ("WALK", 9, None), ("RUN", 5, None), ("TALK", 5, None), ("THINK", 20, "lightbulb"), ("POINT", 18, "detective"), ("CELEBRATE", 9, "headphones"), ("LISTEN", 15, "clipboard"), ("LOOK", 15, "documents"), ("IDLE", 10, "calendar")]
    for i, (st, fr, ac) in enumerate(tests):
        arm.animation_data.action = bpy.data.actions[st]; sc.frame_set(fr + 1)
        for k, (e, parts) in ACC.items():
            vis = (k == ac)
            for p in parts: p.hide_render = not vis
        sc.render.filepath = os.path.join(OUT, "tests", f"{i:02d}_{st}{'_' + ac if ac else ''}.png"); bpy.ops.render.render(write_still=True)
