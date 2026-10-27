"""Ep 10 v2: adds real Blender keyframe animation to property.blend -> property_anim.blend (24 fps).
CONCEPT ONLY. Run: python build_anim.py   (needs property.blend from build_property.py)
Timeline (frames at 24 fps):
  1-240     BUILD     stakes -> fence -> walls rise -> roof drops -> paths -> pool -> palms -> garden
  300-640   CAR       car on the road turns into the entrance, gate leaves open, car drives to the porch and stops
  700-1000  PEOPLE    three people walk the garden paths (limb swing + body bob), pool water ripples all the time
  1100-1400 DOOR      front door opens (hinged), interior camera shot
After frame 240 the whole property is visible (constant keys)."""
import bpy, math, random
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath=__file__.replace("build_anim.py", "property.blend"))
sc = bpy.context.scene; sc.render.fps = 24
FPS = 24
random.seed(3)
OB = bpy.data.objects
def mat(name, col, rough=0.6, metal=0.0, emit=None, es=0.0, alpha=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = es
    if alpha is not None: b.inputs["Alpha"].default_value = alpha
    return m
ANIM = bpy.data.collections.new("Anim"); sc.collection.children.link(ANIM)
def link(o, c=ANIM):
    for k in o.users_collection: k.objects.unlink(o)
    c.objects.link(o); return o
def box(name, loc, size, m, c=ANIM, rot=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.name = name; o.scale = size; o.rotation_euler[2] = math.radians(rot)
    o.data.materials.append(m); return link(o, c)
def cyl(name, loc, r, h, m, c=ANIM, verts=20, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot); o = bpy.context.object; o.name = name
    o.data.materials.append(m); return link(o, c)
def sph(name, loc, r, m, c=ANIM):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=20, ring_count=12); o = bpy.context.object; o.name = name
    o.data.materials.append(m); bpy.ops.object.shade_smooth(); return link(o, c)
def empty(name, loc, c=ANIM):
    o = bpy.data.objects.new(name, None); o.location = loc; c.objects.link(o); return o
def key(o, path, frame, value=None, interp=None, idx=-1):
    if value is not None: setattr(o, path, value)
    o.keyframe_insert(data_path=path, frame=frame, index=idx)
    if interp and o.animation_data and o.animation_data.action:
        for fc in o.animation_data.action.fcurves if hasattr(o.animation_data.action, "fcurves") else []:
            for kp in fc.keyframe_points:
                if kp.co[0] == frame: kp.interpolation = interp
PREF = bpy.context.preferences.edit
def interp(kind): PREF.keyframe_new_interpolation_type = kind     # Blender 5 layered actions: set the default for keys inserted next
def set_interp(o, kind): pass
def f(sec): return int(round(sec * FPS))

# ======================= ROAD (anim shots only) =======================
asph = mat("Asphalt", (0.07, 0.07, 0.08), 0.85); line = mat("RoadLine", (0.9, 0.9, 0.85), 0.6)
road = box("Road", (0, -27.5, 0.02), (400, 7, 0.06), asph)
for i in range(-20, 20): box(f"RoadDash{i}", (i * 8, -27.5, 0.07), (3, 0.18, 0.02), line)
apron = box("Apron", (-10, -21, 0.03), (3.4, 12, 0.07), mat("ApronPaver", (0.62, 0.58, 0.52), 0.8))
# ======================= CAR =======================
body = mat("CarBody", (0.55, 0.06, 0.05), 0.25, 0.4); glass = mat("CarGlass", (0.05, 0.08, 0.1), 0.05, 0.1)
tire = mat("Tire", (0.02, 0.02, 0.02), 0.9); head = mat("Head", (1, 0.95, 0.8), 0.3, emit=(1, 0.95, 0.75), es=8)
car = empty("Car", (-45, -27.5, 0))
parts = [box("CarBody", (0, 0, 0.62), (4.3, 1.85, 0.62), body), box("CarCabin", (-0.2, 0, 1.18), (2.3, 1.6, 0.6), glass),
         box("CarHoodTop", (1.2, 0, 0.95), (1.4, 1.75, 0.08), body), box("HeadL", (2.16, 0.62, 0.7), (0.06, 0.3, 0.16), head), box("HeadR", (2.16, -0.62, 0.7), (0.06, 0.3, 0.16), head)]
interp('LINEAR')
wheels = []
for i, (wx, wy) in enumerate([(1.35, 0.95), (1.35, -0.95), (-1.35, 0.95), (-1.35, -0.95)]):
    w = cyl(f"Wheel{i}", (wx, wy, 0.36), 0.36, 0.28, tire, rot=(math.radians(90), 0, 0)); wheels.append(w); parts.append(w)
for p in parts: p.parent = car
# path: (x, y, heading_deg, t_seconds, wheel_distance_m)
CAR_T0 = f(12.5)    # frame 300
wp = [(-45, -27.5, 0, 0.0), (-16, -27.5, 0, 3.6), (-11.0, -26.0, 55, 4.6), (-10, -23.5, 90, 5.4), (-10, -15.5, 90, 7.4), (-10, -10.0, 90, 9.0), (-6.5, -7.4, 25, 10.6), (-1.5, -6.6, 0, 12.6)]
dist = 0.0
for i, (x, y, h, t) in enumerate(wp):
    if i: dist += math.hypot(x - wp[i - 1][0], y - wp[i - 1][1])
    fr = CAR_T0 + f(t)
    car.location = (x, y, 0); car.rotation_euler = (0, 0, math.radians(h))
    car.keyframe_insert("location", frame=fr); car.keyframe_insert("rotation_euler", frame=fr)
    for w in wheels:
        w.rotation_euler[1] = -dist / 0.36; w.keyframe_insert("rotation_euler", frame=fr, index=1)
# before the car shot the car sits far away (constant), hide it in the build shot
car.location = (-45, -27.5, 0); car.keyframe_insert("location", frame=1)
for p in parts + [car]: set_interp(p, 'LINEAR')
car.hide_render = False
# ======================= GATE OPENS =======================
interp('BEZIER')
GATE_T = CAR_T0 + f(4.2)
for nm, hx, ang in (("GateLeaf1", -12.0, 100), ("GateLeaf2", -8.0, -100)):
    leaf = OB[nm]; h = empty(nm + "_hinge", (hx, -15.0, 0), ANIM)
    wm = leaf.matrix_world.copy(); leaf.parent = h; leaf.matrix_world = wm
    h.rotation_euler = (0, 0, 0); h.keyframe_insert("rotation_euler", frame=1); h.keyframe_insert("rotation_euler", frame=GATE_T)
    h.rotation_euler = (0, 0, math.radians(ang)); h.keyframe_insert("rotation_euler", frame=GATE_T + f(1.6))
# ======================= FRONT DOOR + HOLE + INTERIOR =======================
door = OB["Door"]; door.location = (3.2, 1.2, 1.15); door.scale = (1.2, 0.1, 2.2)
living = OB["Living"]
cutter = box("DoorCut", (3.2, 1.25, 1.1), (1.2, 0.6, 2.2), mat("Cutter", (1, 0, 1)))
bm = living.modifiers.new("DoorHole", "BOOLEAN"); bm.operation = 'DIFFERENCE'; bm.object = cutter; bm.solver = 'EXACT'
with bpy.context.temp_override(object=living, active_object=living, selected_objects=[living]):
    bpy.ops.object.modifier_apply(modifier="DoorHole")
cutter.hide_render = True; cutter.hide_viewport = True
dh = empty("Door_hinge", (2.6, 1.2, 0)); wm = door.matrix_world.copy(); door.parent = dh; door.matrix_world = wm
DOOR_T = f(1100 / FPS + 0.0) if False else 1100
dh.rotation_euler = (0, 0, 0); dh.keyframe_insert("rotation_euler", frame=1); dh.keyframe_insert("rotation_euler", frame=DOOR_T + 24)
dh.rotation_euler = (0, 0, math.radians(105)); dh.keyframe_insert("rotation_euler", frame=DOOR_T + 24 + 36)
wood = mat("FloorWood", (0.55, 0.38, 0.22), 0.45); rug = mat("Rug", (0.82, 0.8, 0.72), 0.95); sofa = mat("Sofa", (0.2, 0.28, 0.38), 0.8)
ink = mat("DarkWood", (0.15, 0.1, 0.07), 0.5); white = mat("IntWall", (0.95, 0.93, 0.9), 0.9)
box("IntCeiling", (-2.5, 5.0, 3.26), (12.6, 7.2, 0.03), mat("Ceil", (0.95, 0.93, 0.9), 0.9, emit=(1, 0.95, 0.88), es=0.1))
box("IntFloor", (-2.5, 5.0, 0.33), (12.6, 7.2, 0.06), wood)
box("Rug", (-3.5, 4.2, 0.37), (4.4, 3.0, 0.02), rug)
box("Sofa", (-3.5, 6.2, 0.62), (2.8, 1.0, 0.5), sofa); box("SofaBack", (-3.5, 6.65, 1.0), (2.8, 0.2, 0.8), sofa)
box("Sofa2", (-6.0, 4.2, 0.62), (1.0, 2.2, 0.5), sofa); box("CoffeeTable", (-3.5, 4.0, 0.55), (1.4, 0.8, 0.3), ink)
box("TVUnit", (-8.5, 5.0, 0.7), (0.4, 3.0, 0.7), ink); box("TV", (-8.6, 5.0, 1.5), (0.06, 1.8, 1.0), mat("Screen", (0.02, 0.03, 0.05), 0.1, emit=(0.15, 0.25, 0.4), es=1.2))
box("DiningTable", (0.0, 5.5, 0.8), (2.2, 1.0, 0.08), ink)
for i, (cx, cy) in enumerate([(-0.7, 6.3), (0.7, 6.3), (-0.7, 4.7), (0.7, 4.7)]): box(f"Chair{i}", (cx, cy, 0.5), (0.45, 0.45, 0.5), sofa)
for i, lx in enumerate((-4.5, 0.0)):
    sph(f"Pendant{i}", (lx, 5.2, 2.6), 0.28, mat(f"PendantM{i}", (1, 0.8, 0.5), 0.4, emit=(1, 0.75, 0.4), es=6))
for nm, (lx, ly, lz, e) in {"IntLightA": (-3.5, 5.0, 3.1, 150), "IntLightB": (1.5, 3.0, 3.0, 80)}.items():
    bpy.ops.object.light_add(type='AREA', location=(lx, ly, lz)); L = bpy.context.object; L.name = nm; L.data.energy = e; L.data.size = 4.0; L.data.color = (1, 0.92, 0.8); link(L)
box("Plant", (-8.0, 7.6, 0.7), (0.5, 0.5, 0.8), mat("Pot2", (0.7, 0.4, 0.25), 0.8)); sph("PlantLeaf", (-8.0, 7.6, 1.5), 0.6, mat("Leaf2", (0.1, 0.4, 0.12), 0.7))
# ======================= PEOPLE =======================
def human(name, shirt, path, t0, speed=1.25):
    skin = mat(name + "Skin", (0.75, 0.52, 0.38), 0.7); cloth = mat(name + "Shirt", shirt, 0.8); pants = mat(name + "Pants", (0.12, 0.14, 0.2), 0.8)
    root = empty(name, (path[0][0], path[0][1], 0)); parts = []
    torso = box(name + "T", (0, 0, 1.2), (0.42, 0.26, 0.62), cloth); head = sph(name + "H", (0, 0, 1.72), 0.13, skin)
    parts += [torso, head]
    limbs = {}
    for side, sx in (("L", 0.11), ("R", -0.11)):
        hip = empty(f"{name}hip{side}", (0, sx, 0.85)); lg = box(f"{name}leg{side}", (0, 0, -0.42), (0.14, 0.14, 0.84), pants); lg.parent = hip; hip.parent = root
        sh = empty(f"{name}sh{side}", (0, sx * 2.2, 1.45)); ar = box(f"{name}arm{side}", (0, 0, -0.3), (0.1, 0.1, 0.6), cloth); ar.parent = sh; sh.parent = root
        limbs[side] = (hip, sh)
    for p in parts: p.parent = root
    # walk along the polyline at `speed` m/s starting at frame t0
    t = t0; pos = Vector((path[0][0], path[0][1], 0)); cyc = 0
    root.location = pos; root.keyframe_insert("location", frame=t)
    for (x, y) in path[1:]:
        tgt = Vector((x, y, 0)); d = (tgt - pos); L = d.length; steps = max(1, int(L / speed * FPS))
        head_ang = math.atan2(d.y, d.x)
        root.rotation_euler = (0, 0, head_ang); root.keyframe_insert("rotation_euler", frame=t)
        for s in range(0, steps + 1, 6):
            fr = t + s; u = min(1.0, s / steps); root.location = pos.lerp(tgt, u); root.keyframe_insert("location", frame=fr)
            sw = math.sin((fr - t0) / FPS * math.tau * 1.0) * 0.5
            limbs["L"][0].rotation_euler = (0, sw, 0); limbs["R"][0].rotation_euler = (0, -sw, 0)
            limbs["L"][1].rotation_euler = (0, -sw * 0.9, 0); limbs["R"][1].rotation_euler = (0, sw * 0.9, 0)
            for lh in limbs.values():
                for e in lh: e.keyframe_insert("rotation_euler", frame=fr)
            root.location.z = abs(math.sin((fr - t0) / FPS * math.tau * 1.0)) * 0.03; root.keyframe_insert("location", frame=fr)
        t += steps; pos = tgt
    set_interp(root, 'LINEAR'); [set_interp(e, 'LINEAR') for lh in limbs.values() for e in lh]
    return root
interp('LINEAR')
P0 = 700
human("PersonA", (0.85, 0.3, 0.25), [(5.5, -8.0), (11.0, -9.0), (13.5, -9.0), (9.0, -7.0), (5.5, -8.0)], P0)
human("PersonB", (0.2, 0.55, 0.7), [(-3.5, -9.0), (-10.0, -10.0), (-6.0, -7.2), (-3.5, -9.0)], P0 + 24)
human("PersonC", (0.9, 0.8, 0.3), [(5.2, -1.0), (10.0, -1.0), (10.0, -2.2), (5.2, -2.2)], P0)
# ======================= POOL WATER RIPPLE =======================
interp('LINEAR')
wm_ = bpy.data.materials["Water"]; nt = wm_.node_tree; bsdf = nt.nodes["Principled BSDF"]
tex = nt.nodes.new("ShaderNodeTexNoise"); tex.inputs["Scale"].default_value = 6.0; tex.inputs["Detail"].default_value = 3.0
mp = nt.nodes.new("ShaderNodeMapping"); co = nt.nodes.new("ShaderNodeTexCoord"); bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.25
nt.links.new(co.outputs["Object"], mp.inputs["Vector"]); nt.links.new(mp.outputs[0], tex.inputs["Vector"]); nt.links.new(tex.outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs[0], bsdf.inputs["Normal"])
mp.inputs["Location"].default_value = (0, 0, 0); mp.inputs["Location"].keyframe_insert("default_value", frame=1)
mp.inputs["Location"].default_value = (2.0, 1.2, 3.0); mp.inputs["Location"].keyframe_insert("default_value", frame=1600)
# ======================= BUILD SEQUENCE (frames 1-240) =======================
interp('BEZIER')
def vis(o, on, fr):
    o.hide_render = not on; o.keyframe_insert("hide_render", frame=fr); o.hide_viewport = not on; o.keyframe_insert("hide_viewport", frame=fr)
def pop(o, fr, dur=10):
    s = Vector(o.scale)
    o.scale = (0.001, 0.001, 0.001); o.keyframe_insert("scale", frame=fr - 1); vis(o, False, fr - 2); vis(o, True, fr - 1)
    o.scale = s * 1.12; o.keyframe_insert("scale", frame=fr + dur - 3); o.scale = s; o.keyframe_insert("scale", frame=fr + dur)
def rise(o, fr, dur=24):
    z0 = o.location.z; sz = o.scale.z; h = sz
    vis(o, False, fr - 2); vis(o, True, fr - 1)
    o.scale.z = 0.001; o.location.z = z0 - sz / 2; o.keyframe_insert("scale", frame=fr - 1); o.keyframe_insert("location", frame=fr - 1)
    o.scale.z = sz; o.location.z = z0; o.keyframe_insert("scale", frame=fr + dur); o.keyframe_insert("location", frame=fr + dur)
def drop(o, fr, dur=20):
    z0 = o.location.z; vis(o, False, fr - 2); vis(o, True, fr - 1)
    o.location.z = z0 + 9; o.keyframe_insert("location", frame=fr - 1); o.location.z = z0; o.keyframe_insert("location", frame=fr + dur)
final_stage = [o for o in OB if o.users_collection and o.users_collection[0].name in ("Fence", "Gate", "House", "Paths", "S_Partial", "S_Final", "S_Garden")]
hidden = [o for o in OB if o.users_collection and o.users_collection[0].name in ("S_Iter1",)] + [o for o in OB if o.name.startswith(("PoolDeck_V1", "PoolRim_V1", "PoolWater_V1", "PoolDeck_V2", "PoolRim_V2", "PoolWater_V2"))]
for o in hidden: vis(o, False, 1)
poolv3 = [o for o in OB if o.name.endswith("_V3") and o.name.startswith("Pool")]
# everything hidden at frame 1, then appears in order
order = []
for o in final_stage + poolv3:
    if o.name.startswith(("GateLeaf", "Door", "Living", "Wing", "Slab", "Roof", "Glass", "LivingGlow", "Porch")) or o.parent: pass
    vis(o, False, 1)
t = 10
for o in [x for x in final_stage if x.users_collection[0].name == "Fence"]: pop(o, t); t += 2
for o in [OB["Slab"], OB["Porch"]]: pop(o, t); t += 5
for nm in ("Living", "Wing"): rise(OB[nm], t, 30); t += 20
for nm in ("Roof1", "Roof2"): drop(OB[nm], t); t += 12
for nm in ("Glass_South", "Glass_Wing", "Door", "LivingGlow"): pop(OB[nm], t, 8); t += 3
for o in [x for x in final_stage if x.users_collection[0].name == "Gate"]:
    pop(o, t, 8); t += 2
for o in [x for x in final_stage if x.users_collection[0].name == "Paths"]: pop(o, t, 8); t += 3
for o in poolv3: pop(o, t, 10); t += 3
palms = {}
for x in final_stage:
    if x.users_collection[0].name in ("S_Partial", "S_Final") and x.name.startswith("Palm"): palms.setdefault(x.name.split("_")[0], []).append(x)
for g, objs in palms.items():
    for o in objs: pop(o, t, 12)
    t += 4
for o in [x for x in final_stage if x.users_collection[0].name in ("S_Final",) and x.name.startswith("Shrub")]: pop(o, t, 10); t += 2
for o in [x for x in final_stage if x.users_collection[0].name == "S_Garden"]: pop(o, t, 8); t += 1
for o in bpy.data.collections["Stakes"].objects: vis(o, True, 1); vis(o, False, 14)
def kids(o):
    yield o
    for c in o.children_recursive: yield c
for nm, t_on in (("Car", 290), ("PersonA", 650), ("PersonB", 650), ("PersonC", 650)):
    for o in kids(OB[nm]):
        if o.type != "EMPTY": vis(o, False, 1); vis(o, True, t_on)
print("build sequence ends at frame", t)
# interior pieces visible only after the door opens? keep always visible (roof hides them from the aerial view)
sc.frame_start, sc.frame_end = 1, 1500
bpy.ops.wm.save_as_mainfile(filepath=__file__.replace("build_anim.py", "property_anim.blend"))
print("saved property_anim.blend", len(bpy.data.objects), "objects")
