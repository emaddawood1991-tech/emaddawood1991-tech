# Blender (bpy 5.3, Cycles CPU) 3D extruded title: GREAT GRAPHICS / != / CHILD-FRIENDLY. Transparent PNG sequence for Remotion.
import bpy, math, sys, os
out = sys.argv[sys.argv.index("--") + 1]; frames = int(sys.argv[sys.argv.index("--") + 2]); samples = int(sys.argv[sys.argv.index("--") + 3])
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = samples
try: sc.cycles.use_denoising = True; sc.cycles.denoiser = "OPENIMAGEDENOISE"
except Exception as e: print("denoise n/a", e)
sc.render.resolution_x, sc.render.resolution_y = 1080, 760; sc.render.film_transparent = True
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"
sc.frame_start, sc.frame_end = 1, frames; sc.render.fps = 30
font = bpy.data.fonts.load(FONT)
def mat(name, col, metal, rough, emit=0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = col; b.inputs["Metallic"].default_value = metal; b.inputs["Roughness"].default_value = rough
    if emit: b.inputs["Emission Color"].default_value = col; b.inputs["Emission Strength"].default_value = emit
    return m
gold = mat("gold", (0.95, 0.72, 0.28, 1), 1.0, 0.22); white = mat("white", (0.96, 0.96, 0.98, 1), 0.2, 0.3); red = mat("red", (1.0, 0.18, 0.2, 1), 0.0, 0.35, emit=1.6)
def text(s, y, size, m, ext=0.14):
    c = bpy.data.curves.new("t", "FONT"); c.body = s; c.font = font; c.size = size; c.extrude = ext; c.bevel_depth = 0.012; c.bevel_resolution = 3
    c.align_x = "CENTER"; c.align_y = "CENTER"; o = bpy.data.objects.new("t", c); sc.collection.objects.link(o); o.location = (0, 0, y); o.rotation_euler = (math.pi / 2, 0, 0); o.data.materials.append(m); return o
t1 = text("GREAT GRAPHICS", 1.30, 0.62, white); t2 = text("≠", 0.15, 1.5, red, 0.2); t3 = text("CHILD-FRIENDLY", -1.0, 0.62, gold)
objs = [t1, t2, t3]
# staggered drop-in / pop animation
for i, o in enumerate(objs):
    s0 = 1 + i * 8
    o.scale = (0.01, 0.01, 0.01); o.keyframe_insert("scale", frame=s0)
    o.scale = (1.12, 1.12, 1.12); o.keyframe_insert("scale", frame=s0 + 9)
    o.scale = (1, 1, 1); o.keyframe_insert("scale", frame=s0 + 14)
    z = o.location.z; o.location.z = z + 1.2; o.keyframe_insert("location", frame=s0)
    o.location.z = z; o.keyframe_insert("location", frame=s0 + 9)
    for fc in o.animation_data.action.fcurves if hasattr(o.animation_data.action, "fcurves") else []:
        for k in fc.keyframe_points: k.interpolation = "BEZIER"
# slow orbit-ish camera push
cam_d = bpy.data.cameras.new("c"); cam_d.lens = 50; cam = bpy.data.objects.new("c", cam_d); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (-0.9, -9.5, 0.2); cam.rotation_euler = (math.pi / 2, 0, -0.09); cam.keyframe_insert("location", frame=1); cam.keyframe_insert("rotation_euler", frame=1)
cam.location = (0.9, -7.9, 0.1); cam.rotation_euler = (math.pi / 2, 0, 0.09); cam.keyframe_insert("location", frame=frames); cam.keyframe_insert("rotation_euler", frame=frames)
# lights
for loc, e, col in [((3, -6, 5), 900, (1, 0.95, 0.85)), ((-5, -5, 1), 500, (0.7, 0.8, 1)), ((0, 4, 3), 400, (1, 0.5, 0.4))]:
    l = bpy.data.lights.new("l", "AREA"); l.energy = e; l.size = 5; l.color = col; lo = bpy.data.objects.new("l", l); lo.location = loc; sc.collection.objects.link(lo)
    d = lo.location.copy(); lo.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
# world: dark studio reflections
w = bpy.data.worlds.new("w"); w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.02, 0.03, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.6; sc.world = w
os.makedirs(out, exist_ok=True); sc.render.filepath = out + "/f_"
if "--still" in sys.argv:
    sc.frame_set(frames); sc.render.filepath = out + "/still.png"; bpy.ops.render.render(write_still=True)
else:
    bpy.ops.render.render(animation=True)
print("DONE")
