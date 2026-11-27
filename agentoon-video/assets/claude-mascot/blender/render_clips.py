"""Render Claude mascot clips as transparent PNG sequences. usage: python render_clips.py <outdir>  (clips listed in CLIPS: state, accessory or none)"""
import bpy, sys, os, math
out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/claude_clips"
bpy.ops.wm.open_mainfile(filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "claude_mascot.blend"))
sc = bpy.context.scene; arm = bpy.data.objects["ClaudeRig"]
sc.render.resolution_x = 512; sc.render.resolution_y = 512; sc.cycles.samples = 28; sc.render.film_transparent = True
cam = sc.camera; cam.data.type = "ORTHO"; cam.data.ortho_scale = 3.7; cam.location = (0, -7.5, 1.15); cam.rotation_euler = (math.radians(90), 0, 0)
ACC = {}
for o in bpy.data.objects:
    for k in ("headphones", "detective", "lightbulb", "laptop", "clipboard", "documents", "calendar"): pass
names = {"headphones": ["hp_band", "hp_cupL", "hp_cupR"], "detective": ["hat_brim", "hat_crown", "hat_band", "mag_ring", "mag_glass", "mag_handle"], "lightbulb": ["bulb", "bulb_base"], "clipboard": ["clip_board", "clip_paper", "clip_clip"], "documents": ["doc0", "doc1", "doc2"], "calendar": ["cal_page", "cal_head"], "cape": ["cape_back", "cape_collar", "cape_flapL", "cape_flapR"], "laptop": ["lap_base", "lap_screen"]}
CLIPS = [("IDLE", "none"), ("LISTEN", "none"), ("TALK", "none"), ("TALK", "lightbulb"), ("TALK", "detective"), ("TALK", "calendar"), ("TALK", "documents"), ("BOUNCE", "none"), ("WAVE", "none"), ("CELEBRATE", "none"), ("POINT", "none"), ("LOOK", "none"), ("IDLE", "headphones"), ("TALK", "headphones"), ("TALK", "clipboard"), ("LISTEN", "detective"), ("LAUGH", "none"), ("CONFUSED", "none"), ("THINK", "none"), ("CODE", "headphones+laptop"), ("TALK", "headphones+laptop"), ("IDLE", "headphones+laptop"), ("TALK", "headphones+documents"), ("TALK", "cape"), ("IDLE", "cape"), ("POINT", "cape"), ("CELEBRATE", "cape"), ("IDLE", "clipboard")]
sel = os.environ.get("ONLY")
for st, ac in CLIPS:
    tag = f"{st}_{ac}"
    if sel and tag not in sel.split(","): continue
    acs = ac.split("+")
    for k, ns in names.items():
        for n in ns: bpy.data.objects[n].hide_render = (k not in acs)
    act = bpy.data.actions[st]; arm.animation_data.action = act; n = int(act.frame_range[1] - act.frame_range[0])
    d = os.path.join(out, tag); os.makedirs(d, exist_ok=True)
    for f in range(n):
        sc.frame_set(f + 1); sc.render.filepath = os.path.join(d, f"{f:03d}.png"); bpy.ops.render.render(write_still=True)
    print("DONE", tag, n, flush=True)
