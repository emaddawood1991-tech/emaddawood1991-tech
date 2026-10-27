"""Top-down 'location' stills from property_anim.blend (empty plot with road at frame 1, finished property at frame 1000).
usage: python render_loc.py <frame> <out.png> [w h samples]   Blender top view, NOT Google Maps."""
import bpy, sys, os
from mathutils import Vector
a = sys.argv[1:]; fr, out = int(a[0]), a[1]
w, h, s = (int(a[2]), int(a[3]), int(a[4])) if len(a) > 4 else (1080, 1920, 24)
bpy.ops.wm.open_mainfile(filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "property_anim.blend"))
sc = bpy.context.scene; cam = bpy.data.objects["Cam_Hero"]; sc.camera = cam
sc.frame_set(fr)
pos = Vector((0, -16, 120)); tgt = Vector((0, -16.001, 0))
cam.location = pos; cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 34
sc.render.resolution_x, sc.render.resolution_y = w, h; sc.cycles.samples = s; sc.cycles.use_denoising = True
sc.render.filepath = out; bpy.ops.render.render(write_still=True)
