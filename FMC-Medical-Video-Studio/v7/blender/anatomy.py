"""Simplified teaching-model anatomy (NOT patient-specific) rendered with Blender (bpy) as transparent PNG sequences.
Usage: python anatomy.py <ankle|hamstring|knee> <outdir> [frames=72] [size=420]"""
import bpy, math, sys, os
from mathutils import Vector
name, out = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 72
S = int(sys.argv[4]) if len(sys.argv) > 4 else 420
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 48; sc.cycles.use_denoising = True
sc.render.resolution_x = sc.render.resolution_y = S
sc.render.film_transparent = True
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
sc.frame_start, sc.frame_end = 1, N
def mat(color, rough=0.5, emit=0.0):
    m = bpy.data.materials.new('m'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = (*color, 1); b.inputs['Emission Strength'].default_value = emit
    return m
BONE = mat((0.92, 0.87, 0.76), 0.55); BONE2 = mat((0.82, 0.76, 0.64), 0.6)
LIG = mat((0.95, 0.5, 0.12), 0.35, 0.4); MUS = mat((0.72, 0.28, 0.2), 0.45); MUS2 = mat((0.6, 0.2, 0.15), 0.45)
CART = mat((0.62, 0.78, 0.86), 0.3); HOT = mat((0.95, 0.25, 0.12), 0.3, 0.6)
def sph(loc, sc_, m, seg=48):
    bpy.ops.mesh.primitive_uv_sphere_add(location=loc, segments=seg, ring_count=32); o = bpy.context.object
    o.scale = sc_; o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o
def cyl(a, b, r0, r1, m):
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=40, radius1=r0, radius2=r1, depth=d.length, location=(a + b) / 2)
    o = bpy.context.object; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o
def tube(points, r, m):
    cu = bpy.data.curves.new('c', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 6
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(points) - 1)
    for p, bp in zip(points, sp.bezier_points):
        bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    o = bpy.data.objects.new('t', cu); bpy.context.collection.objects.link(o); o.data.materials.append(m); return o
if name == 'ankle':   # lateral view: tibia, fibula, talus, calcaneus, foot + lateral ligament group
    cyl((0.0, 0, 2.6), (0.0, 0, 0.55), 0.42, 0.5, BONE)          # tibia
    cyl((-0.62, 0.0, 2.4), (-0.62, 0, 0.2), 0.2, 0.26, BONE2)     # fibula
    sph((-0.62, 0, 0.12), (0.3, 0.26, 0.34), BONE2)               # lateral malleolus
    sph((0.0, 0, -0.18), (0.62, 0.5, 0.42), BONE)                 # talus
    sph((-0.35, 0, -0.95), (0.95, 0.55, 0.5), BONE2)              # calcaneus
    sph((1.35, 0, -1.05), (1.35, 0.52, 0.34), BONE2)              # midfoot/forefoot
    for p in [[(-0.7, -0.3, 0.1), (-0.3, -0.38, -0.2), (0.35, -0.38, -0.3)],   # ATFL
              [(-0.7, -0.3, 0.05), (-0.62, -0.42, -0.5), (-0.55, -0.45, -1.0)],  # CFL
              [(-0.62, -0.3, 0.1), (-0.1, -0.45, -0.1), (0.2, -0.45, -0.1)]]:
        tube(p, 0.07, LIG)
    focus = Vector((0.2, 0, -0.1)); R = 9.5; elev = 10
elif name == 'hamstring':   # posterior thigh: ischial tuberosity, femur, three muscle bellies, tibia/fibula heads
    cyl((0, 0, 3.4), (0, 0, -3.4), 0.5, 0.5, BONE)                # femur
    sph((0, 0.0, 3.6), (0.75, 0.6, 0.55), BONE2)                  # pelvis (ischial region)
    sph((-0.1, 0, -3.6), (0.7, 0.55, 0.35), BONE)                 # knee / tibia head
    for ang, rad, m, r in [(200, 0.95, MUS, 0.46), (265, 1.0, MUS2, 0.48), (330, 0.95, MUS, 0.46)]:
        a = math.radians(ang); x, y = rad * math.cos(a), rad * math.sin(a)
        cyl((x * 0.4, y * 0.4, 3.3), (x * 0.9, y * 0.9, -3.1), 0.22, 0.34, m)
        sph((x * 0.7, y * 0.7, 0.4), (r, r, 1.5), m)
    sph((0.3, 0.5, 0.2), (0.9, 0.9, 1.1), HOT).hide_render = True
    focus = Vector((0, 0, 0)); R = 17; elev = 6
else:   # knee: femoral condyles, tibial plateau, patella, ACL/PCL, menisci
    cyl((0, 0, 4.2), (0, 0, 1.0), 0.75, 0.8, BONE)                # femur shaft
    sph((-0.55, 0, 0.75), (0.8, 0.85, 0.75), BONE); sph((0.55, 0, 0.75), (0.8, 0.85, 0.75), BONE)   # condyles
    cyl((0, 0, -0.45), (0, 0, -4.2), 0.9, 0.62, BONE2)            # tibia
    sph((0, 0, -0.45), (1.55, 0.95, 0.28), BONE2)                 # plateau
    sph((0, 1.0, 0.45), (0.55, 0.28, 0.7), mat((0.96, 0.92, 0.84), 0.5))   # patella
    sph((-0.62, 0, -0.1), (0.62, 0.7, 0.14), CART); sph((0.62, 0, -0.1), (0.62, 0.7, 0.14), CART)   # menisci
    tube([(-0.1, 0.15, -0.15), (0.2, 0.0, 0.3), (0.35, -0.25, 0.75)], 0.1, mat((0.96, 0.85, 0.3), 0.4, 0.2))    # ACL (schematic)
    tube([(0.12, -0.3, -0.15), (-0.05, -0.15, 0.3), (-0.3, 0.1, 0.7)], 0.1, mat((0.96, 0.85, 0.3), 0.4, 0.2))    # PCL (schematic)
    focus = Vector((0, 0, 0)); R = 15; elev = 6
# lights + camera on a slow ±40° swing
bpy.ops.object.light_add(type='AREA', location=(4, -6, 6)); L = bpy.context.object; L.data.energy = 900; L.data.size = 6
bpy.ops.object.light_add(type='AREA', location=(-5, -3, 2)); L2 = bpy.context.object; L2.data.energy = 300; L2.data.size = 6
bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam; cam.data.lens = 60
for fr in range(1, N + 1):
    t = (fr - 1) / (N - 1); ang = math.radians(-40 + 80 * (0.5 - 0.5 * math.cos(math.pi * 2 * t)) - 90)
    cam.location = focus + Vector((R * math.cos(ang) * math.cos(math.radians(elev)), R * math.sin(ang) * math.cos(math.radians(elev)), R * math.sin(math.radians(elev))))
    cam.rotation_euler = (focus - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.keyframe_insert('location', frame=fr); cam.keyframe_insert('rotation_euler', frame=fr)
os.makedirs(out, exist_ok=True)
sc.render.filepath = os.path.join(out, 'f_')
bpy.ops.render.render(animation=True)
print('RENDERED', name, N)
