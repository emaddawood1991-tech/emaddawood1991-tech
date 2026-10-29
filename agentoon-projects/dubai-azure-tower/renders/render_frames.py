"""Resumable Cycles frame renderer.
python render_frames.py scene.blend outdir start end stride resx samples [threads]
(AZURE_DEVICE=GPU env var switches Cycles to GPU on your PC)
Skips frames that already exist, so an interrupted run resumes."""
import sys, os, time
import bpy
# usable as `python render_frames.py <blend> <out> ...` or `blender -b x.blend -P render_frames.py -- <out> ...`
A = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
if "--" in sys.argv:
    blend, outdir, rest = bpy.data.filepath, A[0], A[1:]
else:
    blend, outdir, rest = A[0], A[1], A[2:]
    bpy.ops.wm.open_mainfile(filepath=blend)
start, end, stride, resx, samples = [int(x) for x in rest[:5]]
threads = int(rest[5]) if len(rest) > 5 else 4
os.makedirs(outdir, exist_ok=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.device = os.environ.get("AZURE_DEVICE", "CPU")  # set AZURE_DEVICE=GPU on the PC
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
