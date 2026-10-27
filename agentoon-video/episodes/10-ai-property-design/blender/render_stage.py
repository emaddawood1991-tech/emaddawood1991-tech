"""Render a design stage from property.blend. usage: python render_stage.py <stage> <camera> <out.png|prefix> [w h samples] [frames f0 f1]
stages: empty | blockout | partial | iterA | iterB | final"""
import bpy, sys, math, os
from mathutils import Vector
a = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else sys.argv[1:]
stage, camname, out = a[0], a[1], a[2]
w, h, samples = (int(a[3]), int(a[4]), int(a[5])) if len(a) > 5 else (1080, 1920, 48)
bpy.ops.wm.open_mainfile(filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "property.blend"))
sc = bpy.context.scene
def vis(o, on): o.hide_render = not on; o.hide_viewport = not on
def stage_rules(name, cols):
    n = name
    base = lambda c: c in ("Land","Rig")
    if stage == "empty": return base(cols) or cols == "Stakes"
    if stage == "blockout": return base(cols) or cols in ("Fence","S_Iter1","Stakes")
    if stage == "partial":  return base(cols) or cols in ("Fence","Gate","House","Paths") or cols == "S_Partial" or (cols == "Pool" and n.endswith("_V1"))
    if stage == "iterA":    return base(cols) or cols in ("Fence","Gate","House","Paths","S_Partial") or (cols == "Pool" and n.endswith("_V2"))
    if stage == "iterB":    return base(cols) or cols in ("Fence","Gate","House","Paths","S_Partial") or (cols == "Pool" and n.endswith("_V2"))
    if stage == "final":    return base(cols) or cols in ("Fence","Gate","House","Paths","S_Partial","S_Final","S_Garden") or (cols == "Pool" and n.endswith("_V3"))
    return False
for o in bpy.data.objects:
    cn = o.users_collection[0].name if o.users_collection else "Land"
    if cn == "Marks": vis(o, False); continue
    if o.type in ("CAMERA",): continue
    vis(o, stage_rules(o.name, cn))
if stage == "iterA":  # more trees only (iteration 2)
    for o in bpy.data.collections["S_Final"].objects:
        if o.name.startswith(("PalmC","PalmD","PalmE")): vis(o, True)
if stage == "iterB":
    for o in bpy.data.collections["S_Final"].objects:
        if o.name.startswith(("PalmC","PalmD","PalmE","PalmF","PalmG","PalmH","Shrub")): vis(o, True)
sc.render.resolution_x, sc.render.resolution_y = w, h
sc.cycles.samples = samples; sc.cycles.use_denoising = True
sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.05
sc.render.threads_mode = 'AUTO'
sc.camera = bpy.data.objects[camname]
if "--frames" in a:
    i = a.index("--frames"); f0, f1 = int(a[i+1]), int(a[i+2]); mode = a[i+3]
    sc.frame_start, sc.frame_end = f0, f1
    tgt = Vector((0, 2, 2))
    cam = sc.camera; n = f1-f0
    for f in range(f0, f1+1):
        t = (f-f0)/n
        if mode == "orbit":      # cinematic aerial orbit, descending
            ang = math.radians(-125 + 150*t); r = 62 - 24*t; z = 31 - 15*t
            cam.location = Vector((math.cos(ang)*r, math.sin(ang)*r, z)); tg = tgt
        elif mode == "walk":     # gate -> driveway -> pool -> house
            pts = [(-10,-22,3.0),(-10,-12,2.0),(-3,-8,1.7),(5,-9,1.8),(11,-3,2.0)]
            s = t*(len(pts)-1); i0 = min(int(s), len(pts)-2); u = s-i0; u = u*u*(3-2*u)
            P0, P1 = Vector(pts[i0]), Vector(pts[i0+1]); cam.location = P0.lerp(P1, u)
            look = [(0,5,1.6),(2,5,1.8),(4,5,1.6),(2,4,1.5),(-2,6,1.8)]
            tg = Vector(look[i0]).lerp(Vector(look[i0+1]), u)
        cam.rotation_euler = (tg - cam.location).to_track_quat('-Z','Y').to_euler()
        cam.data.lens = 24 if mode == "walk" else 30
        sc.frame_set(f); sc.render.filepath = f"{out}_{f:04d}.png"
        bpy.ops.render.render(write_still=True)
else:
    sc.render.filepath = out; bpy.ops.render.render(write_still=True)
