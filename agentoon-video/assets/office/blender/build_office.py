"""Agentoon.ai creator's office (Blender 5.3 bpy, Cycles CPU). python build_office.py <outdir> [--quick]
Renders plates: A_wide, B_medium (opaque) and A_fg, B_fg (desk-front + laptop + items, transparent) so 2D characters can sit between plate and fg."""
import bpy, math, os, random, sys
from mathutils import Vector
out = sys.argv[sys.argv.index("--") + 1]; quick = "--quick" in sys.argv; EV = "--evening" in sys.argv; os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
def srgb(c): return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)
def mat(n, col, r=0.5, m=0.0, emit=0.0, ecol=None):
    mm = bpy.data.materials.new(n); mm.use_nodes = True; b = mm.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*srgb(col), 1); b.inputs["Roughness"].default_value = r; b.inputs["Metallic"].default_value = m
    if emit: b.inputs["Emission Color"].default_value = (*srgb(ecol or col), 1); b.inputs["Emission Strength"].default_value = emit
    return mm
M = dict(wood=mat("wood", (0.42, 0.24, 0.12), 0.45), darkwood=mat("darkwood", (0.22, 0.12, 0.07), 0.5), wall=mat("wall", (0.55, 0.57, 0.62), 0.9), floor=mat("floor", (0.18, 0.13, 0.1), 0.7), metal=mat("metal", (0.7, 0.72, 0.76), 0.3, 0.9), dark=mat("dark", (0.04, 0.04, 0.05), 0.4),
         chair=mat("chair", (0.12, 0.14, 0.2), 0.7), cup=mat("cup", (0.95, 0.95, 0.92), 0.3), coffee=mat("coffee", (0.15, 0.08, 0.04), 0.2), plant=mat("plant", (0.12, 0.4, 0.18), 0.7), pot=mat("pot", (0.75, 0.45, 0.3), 0.6),
         screen=mat("screen", (0.02, 0.03, 0.05), 0.2, 0, 0.6, (0.12, 0.2, 0.35)), lamp=mat("lamp", (1, 0.8, 0.5), 0.3, 0, 6.0), glass=mat("glass", (0.7, 0.85, 1.0), 0.02))
col_main = bpy.data.collections.new("main"); col_fg = bpy.data.collections.new("fg"); sc.collection.children.link(col_main); sc.collection.children.link(col_fg)
def box(n, s, loc, m, bev=0.01, fg=False, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.active_object; o.name = n; o.scale = s; bpy.ops.object.transform_apply(scale=True); o.data.materials.append(m)
    if bev: b = o.modifiers.new("b", "BEVEL"); b.width = bev; b.segments = 2
    for c in o.users_collection: c.objects.unlink(o)
    (col_fg if fg else col_main).objects.link(o); return o
def cyl(n, r, d, loc, m, fg=False, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=loc, rotation=rot); o = bpy.context.active_object; o.name = n; o.data.materials.append(m); bpy.ops.object.shade_smooth()
    for c in o.users_collection: c.objects.unlink(o)
    (col_fg if fg else col_main).objects.link(o); return o
# room
box("floor", (8, 9, 0.1), (0, 1.5, -0.05), M["floor"], 0); box("wall_back", (8, 0.2, 3.6), (0, 3.3, 1.8), M["wall"], 0); box("ceiling", (8, 9, 0.1), (0, 1.5, 3.65), mat("ceil", (0.12, 0.12, 0.15), 0.9), 0); box("wall_L", (0.2, 9, 3.6), (-3.2, 1.5, 1.8), M["wall"], 0); box("wall_R", (0.2, 9, 3.6), (3.2, 1.5, 1.8), M["wall"], 0)
# window opening: cut visually by placing glass + frames in front of a bright skyline plane; back wall has a hole made by 4 boxes instead
bpy.data.objects["wall_back"].location = (0, 3.3, -10)  # hide solid wall, rebuild with window hole
for n, s, l in (("wb_bot", (8, 0.2, 0.9), (0, 3.3, 0.45)), ("wb_top", (8, 0.2, 0.5), (0, 3.3, 3.35)), ("wb_l", (1.4, 0.2, 2.2), (-3.3, 3.3, 2.0)), ("wb_r", (1.4, 0.2, 2.2), (3.3, 3.3, 2.0))): box(n, s, l, M["wall"], 0)
for n, s, l in (("mull1", (0.06, 0.12, 2.2), (-1.0, 3.3, 2.0)), ("mull2", (0.06, 0.12, 2.2), (1.0, 3.3, 2.0)), ("mullH", (4.2, 0.12, 0.06), (0, 3.3, 2.4))): box(n, s, l, M["darkwood"], 0)
# sky + skyline
sky = mat("sky", (0.9, 0.7, 0.5), 1, 0, 0.8 if EV else 1.6, (0.85, 0.42, 0.3) if EV else (1.0, 0.72, 0.45)); box("sky", (400, 0.1, 160), (0, 160, 40), sky, 0)
random.seed(4)
for i in range(26):
    x = random.uniform(-60, 60); w = random.uniform(5, 9); h = random.uniform(14, 34); y = random.uniform(50, 100)
    b = box(f"bld{i}", (w, w, h), (x, y, h / 2 - 8), mat(f"bm{i}", (0.18, 0.22, 0.3), 0.6), 0)
    wm = mat(f"win{i}", (0.2, 0.22, 0.3), 0.4, 0, 1.2, (1.0, 0.8, 0.5)); b.data.materials.append(wm)
# desk
box("desk_top", (2.4, 1.0, 0.06), (0, 0, 0.75), M["wood"], 0.012, fg=True); box("desk_front", (2.4, 0.04, 0.7), (0, -0.46, 0.38), M["darkwood"], 0.01, fg=True)
for sx in (-1, 1): box("desk_leg", (0.06, 0.9, 0.72), (sx * 1.15, 0, 0.36), M["darkwood"], 0.01, fg=True)
box("desk_top_front_edge", (2.4, 0.04, 0.06), (0, -0.5, 0.75), M["wood"], 0.012, fg=True)
# chair behind desk
box("seat", (0.62, 0.6, 0.1), (0, 1.0, 0.52), M["chair"], 0.04); box("chair_back", (0.62, 0.1, 0.8), (0, 1.32, 0.95), M["chair"], 0.04); cyl("chair_post", 0.04, 0.45, (0, 1.0, 0.27), M["metal"])
for k in range(5): a = k * 2 * math.pi / 5; box("wheel", (0.3, 0.05, 0.04), (0.15 * math.cos(a), 1.0 + 0.15 * math.sin(a), 0.05), M["metal"], 0, rot=(0, 0, a))
# laptop: base near robot (y+), screen away from robot, back toward camera
box("lap_base", (0.36, 0.25, 0.02), (-0.25, 0.1, 0.79), M["metal"], 0.006, fg=True); box("lap_back", (0.36, 0.012, 0.24), (-0.25, -0.03, 0.91), M["metal"], 0.006, fg=True, rot=(math.radians(-12), 0, 0))
# monitor
box("mon_stand", (0.05, 0.05, 0.2), (-0.9, 0.25, 0.88), M["metal"], 0.005, fg=True); box("mon_base", (0.28, 0.2, 0.015), (-0.9, 0.25, 0.78), M["metal"], 0.005, fg=True); box("mon_back", (0.62, 0.025, 0.37), (-0.9, 0.2, 1.1), M["dark"], 0.01, fg=True, rot=(math.radians(-4), 0, 0))
# lamp, cup, plant, books
cyl("lamp_base", 0.08, 0.02, (-1.1, -0.1, 0.79), M["metal"], fg=True); cyl("lamp_arm", 0.012, 0.45, (-1.1, -0.1, 1.02), M["metal"], fg=True); cyl("lamp_head", 0.07, 0.1, (-1.04, -0.14, 1.26), M["lamp"], fg=True, rot=(math.radians(35), 0, 0))
cyl("cup", 0.045, 0.09, (0.25, -0.2, 0.82), M["cup"], fg=True); cyl("coffee", 0.04, 0.005, (0.25, -0.2, 0.865), M["coffee"], fg=True)
cyl("pot", 0.1, 0.16, (1.0, 0.25, 0.86), M["pot"], fg=True); cyl("plant", 0.12, 0.25, (1.0, 0.25, 1.05), M["plant"], fg=True)
for i in range(3): box(f"book{i}", (0.2, 0.15, 0.03), (0.95, -0.15, 0.80 + i * 0.03), mat(f"bk{i}", (0.5 - 0.1 * i, 0.2 + 0.2 * i, 0.3 + 0.1 * i), 0.6), 0.004, fg=True)
# lights
def area(n, loc, tgt, e, col, size):
    L = bpy.data.lights.new(n, "AREA"); L.energy = e; L.color = col; L.size = size; o = bpy.data.objects.new(n, L); o.location = loc; sc.collection.objects.link(o)
    o.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
area("window_key", (0, 3.0, 2.2), (0, 0, 1.0), 120 if EV else 500, (0.55, 0.62, 0.95) if EV else (1.0, 0.82, 0.62), 4.0); area("fill", (0, -3, 2.5), (0, 0.5, 1), 50 if EV else 220, (0.8, 0.88, 1.0), 4.0)
sp = bpy.data.lights.new("lamp", "SPOT"); sp.energy = 2500 if EV else 300; sp.color = (1, 0.7, 0.4); sp.spot_size = math.radians(70); o = bpy.data.objects.new("lamp", sp); o.location = (-1.04, -0.14, 1.25); sc.collection.objects.link(o); o.rotation_euler = (math.radians(120), 0, 0)
if EV:
    pl = bpy.data.lights.new("deskwarm", "POINT"); pl.energy = 220; pl.color = (1, 0.7, 0.4); pl.shadow_soft_size = 0.3; po = bpy.data.objects.new("deskwarm", pl); po.location = (-0.35, -0.2, 1.45); sc.collection.objects.link(po)
w = bpy.data.worlds.new("W"); w.use_nodes = True; w.node_tree.nodes["Background"].inputs[1].default_value = 0.05 if EV else 0.25; w.node_tree.nodes["Background"].inputs[0].default_value = (0.2, 0.22, 0.3, 1); sc.world = w
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = 24 if quick else 64; sc.view_settings.view_transform = "Standard"
W, H = (360, 640) if quick else (1350, 2400); sc.render.resolution_x = W; sc.render.resolution_y = H
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
def shot(name, loc, tgt, lens, fstop=None):
    cam.location = loc; cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat("-Z", "Y").to_euler(); cam.data.lens = lens; cam.data.sensor_fit = "HORIZONTAL"; cam.data.sensor_width = 24
    if fstop: cam.data.dof.use_dof = True; cam.data.dof.focus_distance = (Vector(tgt) - Vector(loc)).length; cam.data.dof.aperture_fstop = fstop
    else: cam.data.dof.use_dof = False
    sc.render.film_transparent = False
    for o in list(col_main.objects) + list(col_fg.objects): o.is_holdout = False
    sc.render.filepath = os.path.join(out, f"{name}.png"); bpy.ops.render.render(write_still=True)
    sc.render.film_transparent = True
    for o in col_main.objects: o.is_holdout = True
    sc.render.filepath = os.path.join(out, f"{name}_fg.png"); bpy.ops.render.render(write_still=True)
    for o in col_main.objects: o.is_holdout = False
if EV:
    shot("E_A_wide", (0, -3.4, 1.0), (0, 0.4, 1.8), 24)
    shot("E_B_medium", (0.1, -2.4, 1.0), (0.15, 0.2, 1.55), 30, 2.8)
    hinge = Vector((-3.1, 1.75, 0))
    box("door_fL", (0.12, 0.08, 2.2), (-3.1, 0.65, 1.1), M["darkwood"], 0.005); box("door_fR", (0.12, 0.08, 2.2), (-3.1, 1.85, 1.1), M["darkwood"], 0.005); box("door_fT", (0.12, 1.28, 0.08), (-3.1, 1.25, 2.2), M["darkwood"], 0.005)
    box("door_panel", (0.05, 1.1, 2.1), (-3.1, 1.2, 1.05), mat("door", (0.55, 0.22, 0.08), 0.5), 0.005); box("door_knob", (0.1, 0.06, 0.06), (-3.05, 0.78, 1.05), M["metal"], 0.01)
    shot("E_C_door", (2.2, -3.0, 1.15), (-1.4, 1.2, 1.0), 24)
elif "--door" in sys.argv:
    # Episode 28: door on the left wall (hinge at y=1.75), two shots: closed and ajar. Same office, same lights.
    hinge = Vector((-3.1, 1.75, 0))
    def door(angle):
        for o in [o for o in bpy.data.objects if o.name.startswith("door_")]: bpy.data.objects.remove(o, do_unlink=True)
        frame_m = M["darkwood"]; dm = mat("door", (0.85, 0.35, 0.12), 0.5)
        box("door_fL", (0.12, 0.08, 2.2), (-3.1, 0.65, 1.1), frame_m, 0.005); box("door_fR", (0.12, 0.08, 2.2), (-3.1, 1.85, 1.1), frame_m, 0.005); box("door_fT", (0.12, 1.28, 0.08), (-3.1, 1.25, 2.2), frame_m, 0.005)
        ar = math.radians(angle); E_ = Vector((hinge.x + 1.1 * math.sin(ar), hinge.y - 1.1 * math.cos(ar), 0)); Mid = (Vector((hinge.x, hinge.y, 0)) + E_) / 2
        box("door_panel", (0.05, 1.1, 2.1), (Mid.x, Mid.y, 1.05), dm, 0.005, rot=(0, 0, ar))
        box("door_knob", (0.1, 0.06, 0.06), (-3.05, 0.78, 1.05), M["metal"], 0.01)
        if angle != 0: box("door_dark", (0.02, 1.1, 2.1), (-3.085, 1.2, 1.05), mat("doordark", (0.02, 0.02, 0.03), 0.9), 0)  # dark hallway visible through the open door
    door(0); shot("C_door_closed", (2.2, -3.0, 1.15), (-1.4, 1.2, 1.0), 24)
    door(75); shot("C_door_open", (2.2, -3.0, 1.15), (-1.4, 1.2, 1.0), 24)
else:
    shot("A_wide", (0, -3.4, 1.0), (0, 0.4, 1.8), 24)
    shot("B_medium", (0.1, -2.4, 1.0), (0.15, 0.2, 1.55), 30, 2.8)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "office.blend"))
