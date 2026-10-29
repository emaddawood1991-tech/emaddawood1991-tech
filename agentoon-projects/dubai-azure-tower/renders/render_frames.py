"""Resumable Cycles frame renderer.
python render_frames.py scene.blend outdir start end stride resx samples [threads]
Skips frames that already exist, so an interrupted run resumes."""
import sys, os, time
import bpy
blend, outdir = sys.argv[1], sys.argv[2]
start, end, stride, resx, samples = [int(x) for x in sys.argv[3:8]]
threads = int(sys.argv[8]) if len(sys.argv) > 8 else 4
os.makedirs(outdir, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"
sc.cycles.samples = samples; sc.cycles.use_denoising = True
sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 3; sc.cycles.glossy_bounces = 4
sc.cycles.transmission_bounces = 4; sc.cycles.transparent_max_bounces = 6
sc.render.resolution_x = resx; sc.render.resolution_y = resx * 9 // 16; sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = "PNG"
sc.render.use_persistent_data = True
sc.render.threads = threads
sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
t0 = time.time(); n = 0
for f in range(start, end + 1, stride):
    path = os.path.join(outdir, "f%04d.png" % f)
    if os.path.exists(path):
        continue
    sc.frame_set(f)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    n += 1
    print("frame %d done (%d rendered, %.1fs/frame)" % (f, n, (time.time() - t0) / n), flush=True)
