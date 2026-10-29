"""Render a one-off still from the built scene. python still.py scene.blend out.png X Y Z TX TY TZ [lens] [res_x] [samples] [night]"""
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "architecture"))
import bpy
from mathutils import Vector
blend, out = sys.argv[1], sys.argv[2]
a = [float(x) for x in sys.argv[3:]]
pos, tgt = a[0:3], a[3:6]
lens = a[6] if len(a) > 6 else 35
rx = int(a[7]) if len(a) > 7 else 960
samples = int(a[8]) if len(a) > 8 else 24
night = a[9] if len(a) > 9 else 0
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
cam = bpy.data.objects.new("PrevCam", bpy.data.cameras.new("PrevCam")); sc.collection.objects.link(cam)
cam.data.lens = lens; cam.data.clip_end = 20000; cam.data.sensor_width = 36
cam.location = pos
cam.rotation_euler = (Vector(tgt) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
sc.camera = cam
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"
sc.cycles.samples = samples; sc.cycles.use_denoising = True
sc.render.resolution_x = rx; sc.render.resolution_y = int(rx * 9 / 16); sc.render.resolution_percentage = 100
sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
sc.render.threads = 4
for m in bpy.data.materials:
    if m.node_tree:
        n = m.node_tree.nodes.get("NIGHT")
        if n: n.outputs[0].default_value = night
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("done", out)
